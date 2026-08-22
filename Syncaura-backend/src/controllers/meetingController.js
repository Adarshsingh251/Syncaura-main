import pool from "../config/db.js";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
} from "../services/googleCalendar.js";

// ✅ Sync Google Calendar (import from Google + push local unsynced meetings)
export const syncCalendar = async (req, res) => {
  try {
    const tokens = req.googleTokens;
    if (!tokens || (!tokens.access_token && !tokens.refresh_token)) {
      return res.status(400).json({
        success: false,
        message:
          "Google Calendar not connected. Please connect your Google account first.",
      });
    }

    const userId = req.user?.id;
    const googleEvents = await listCalendarEvents({ tokens, userId });
    let importedCount = 0;

    // Import Google Calendar events into DB
    for (const gEvent of googleEvents) {
      if (!gEvent.id) continue;

      const existing = await pool.query(
        "SELECT id FROM meetings WHERE google_event_id = $1",
        [gEvent.id]
      );

      const title = gEvent.summary || "Google Calendar Event";
      const description = gEvent.description || "";
      const startTime = gEvent.start?.dateTime || gEvent.start?.date;
      const endTime = gEvent.end?.dateTime || gEvent.end?.date;
      const meetLink = gEvent.hangoutLink || gEvent.htmlLink || null;

      if (!startTime || !endTime) continue;

      if (existing.rowCount === 0) {
        await pool.query(
          `INSERT INTO meetings (title, description, start_time, end_time, google_event_id, google_meet_link, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [title, description, startTime, endTime, gEvent.id, meetLink, userId]
        );
        importedCount++;
      } else {
        await pool.query(
          `UPDATE meetings SET
            title = $1,
            description = $2,
            start_time = $3,
            end_time = $4,
            google_meet_link = COALESCE($5, google_meet_link),
            updated_at = CURRENT_TIMESTAMP
           WHERE google_event_id = $6`,
          [title, description, startTime, endTime, meetLink, gEvent.id]
        );
      }
    }

    // Push local unsynced meetings to Google Calendar
    const unsyncedResult = await pool.query(
      "SELECT * FROM meetings WHERE created_by = $1 AND (google_event_id IS NULL OR google_event_id = '')",
      [userId]
    );

    for (const localMeeting of unsyncedResult.rows) {
      try {
        const createdGEvent = await createCalendarEvent({
          tokens,
          userId,
          title: localMeeting.title,
          description: localMeeting.description,
          startTime: localMeeting.start_time,
          endTime: localMeeting.end_time,
        });

        if (createdGEvent?.id) {
          await pool.query(
            "UPDATE meetings SET google_event_id = $1, google_meet_link = $2 WHERE id = $3",
            [createdGEvent.id, createdGEvent.hangoutLink || null, localMeeting.id]
          );
          importedCount++;
        }
      } catch (err) {
        console.warn(
          `Failed to push local meeting ID ${localMeeting.id} to Google Calendar:`,
          err.message
        );
      }
    }

    // Return all meetings
    const allMeetingsResult = await pool.query(
      "SELECT * FROM meetings ORDER BY start_time DESC"
    );
    const meetings = allMeetingsResult.rows;
    for (const meeting of meetings) {
      const participantsResult = await pool.query(
        "SELECT email FROM meeting_participants WHERE meeting_id = $1",
        [meeting.id]
      );
      meeting.participants = participantsResult.rows.map((r) => r.email);
    }

    return res.status(200).json({
      success: true,
      message: `Calendar sync completed! Synced ${importedCount} items.`,
      syncedCount: importedCount,
      meetings,
    });
  } catch (error) {
    console.error("Error in syncCalendar controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sync calendar",
    });
  }
};

// ✅ Create meeting
export const createMeeting = async (req, res) => {
  try {
    const { title, description, startTime, endTime, participants } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date format for startTime or endTime" });
    }

    if (end <= start) {
      return res
        .status(400)
        .json({ message: "endTime must be after startTime" });
    }

    let calendarEvent = null;

    if (
      req.googleTokens &&
      (req.googleTokens.access_token || req.googleTokens.refresh_token)
    ) {
      try {
        calendarEvent = await createCalendarEvent({
          tokens: req.googleTokens,
          userId: req.user?.id,
          title,
          description,
          startTime,
          endTime,
        });
      } catch (err) {
        // console.warn("Calendar sync failed:", err.message);
        console.error("Calendar sync failed:", err);
      }
    }

    const result = await pool.query(
      `INSERT INTO meetings (title, description, start_time, end_time, google_event_id, google_meet_link, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        title,
        description,
        startTime,
        endTime,
        calendarEvent?.id || null,
        calendarEvent?.hangoutLink || null,
        req.user?.id || null,
      ]
    );

    const meeting = result.rows[0];

    if (participants && Array.isArray(participants)) {
      for (const email of participants) {
        await pool.query(
          "INSERT INTO meeting_participants (meeting_id, email) VALUES ($1, $2)",
          [meeting.id, email]
        );
      }
      meeting.participants = participants;
    }

    res.status(201).json({
      message: "Meeting created successfully",
      meeting,
      google_synced: !!calendarEvent?.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all meetings
export const getMeetings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM meetings ORDER BY start_time DESC"
    );
    const meetings = result.rows;

    for (const meeting of meetings) {
      const participantsResult = await pool.query(
        "SELECT email FROM meeting_participants WHERE meeting_id = $1",
        [meeting.id]
      );
      meeting.participants = participantsResult.rows.map((r) => r.email);
    }

    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single meeting
export const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const meetingResult = await pool.query(
      "SELECT * FROM meetings WHERE id = $1",
      [id]
    );

    if (meetingResult.rowCount === 0)
      return res.status(404).json({ message: "Meeting not found" });

    const meeting = meetingResult.rows[0];

    const participantsResult = await pool.query(
      "SELECT email FROM meeting_participants WHERE meeting_id = $1",
      [id]
    );
    meeting.participants = participantsResult.rows.map((r) => r.email);

    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update meeting
export const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime } = req.body;

    const existing = await pool.query(
      "SELECT * FROM meetings WHERE id = $1",
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const meeting = existing.rows[0];

    if (meeting.google_event_id && req.googleTokens) {
      try {
        await updateCalendarEvent(meeting.google_event_id, {
          tokens: req.googleTokens,
          userId: req.user?.id,
          title: title || meeting.title,
          description: description || meeting.description,
          startTime: startTime || meeting.start_time,
          endTime: endTime || meeting.end_time,
        });
      } catch (err) {
        console.warn("Google Calendar update failed:", err.message);
      }
    }

    const result = await pool.query(
      `UPDATE meetings SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        start_time = COALESCE($3, start_time),
        end_time = COALESCE($4, end_time),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [title, description, startTime, endTime, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete meeting
export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      "SELECT google_event_id FROM meetings WHERE id = $1",
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const googleEventId = existing.rows[0].google_event_id;

    if (googleEventId && req.googleTokens) {
      try {
        await deleteCalendarEvent(
          googleEventId,
          req.googleTokens,
          req.user?.id
        );
      } catch (err) {
        console.warn("Google Calendar delete failed:", err.message);
      }
    }

    await pool.query("DELETE FROM meetings WHERE id = $1", [id]);

    res.json({ message: "Meeting deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};