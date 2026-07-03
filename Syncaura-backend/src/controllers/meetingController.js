import pool from "../config/db.js";
import { createCalendarEvent , updateCalendarEvent, deleteCalendarEvent} from "../services/googleCalendar.js";

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
  return res.status(400).json({ message: "Invalid date format for startTime or endTime" });
}

if (end <= start) {
  return res.status(400).json({ message: "endTime must be after startTime" });
}

    let calendarEvent = null;

    try {
      calendarEvent = await createCalendarEvent({
        title,
        description,
        startTime,
        endTime,
      });
    } catch (err) {
      console.warn("Calendar sync failed:", err.message);
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
        req.user?.id || null
      ]
    );

    const meeting = result.rows[0];

    // Handle participants
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
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all meetings
export const getMeetings = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM meetings ORDER BY start_time DESC");
    const meetings = result.rows;

    for (const meeting of meetings) {
      const participantsResult = await pool.query(
        "SELECT email FROM meeting_participants WHERE meeting_id = $1",
        [meeting.id]
      );
      meeting.participants = participantsResult.rows.map(r => r.email);
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
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE id = $1", [id]);

    if (meetingResult.rowCount === 0) return res.status(404).json({ message: "Meeting not found" });

    const meeting = meetingResult.rows[0];

    // Get participants
    const participantsResult = await pool.query(
      "SELECT email FROM meeting_participants WHERE meeting_id = $1",
      [id]
    );
    meeting.participants = participantsResult.rows.map(r => r.email);

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

    // Fetch existing meeting
    const existing = await pool.query(
      "SELECT * FROM meetings WHERE id = $1",
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const meeting = existing.rows[0];

    // Sync update to Google Calendar
    if (meeting.google_event_id) {
      try {
        await updateCalendarEvent(meeting.google_event_id, {
          title: title || meeting.title,
          description: description || meeting.description,
          startTime: startTime || meeting.start_time,
          endTime: endTime || meeting.end_time,
        });
      } catch (err) {
        console.warn("Google Calendar update failed:", err.message);
        // Continue updating the database even if Google sync fails
      }
    }

    // Update database
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

    // Step 1: Get Google event id before deleting
    const existing = await pool.query(
      "SELECT google_event_id FROM meetings WHERE id = $1",
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const googleEventId = existing.rows[0].google_event_id;

    // Step 2: Delete from Google Calendar first
    if (googleEventId) {
      try {
        await deleteCalendarEvent(googleEventId);
      } catch (err) {
        console.warn("Google Calendar delete failed:", err.message);
        // continue even if Google fails
      }
    }

    // Step 3: Delete from DB
    await pool.query("DELETE FROM meetings WHERE id = $1", [id]);

    res.json({ message: "Meeting deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};