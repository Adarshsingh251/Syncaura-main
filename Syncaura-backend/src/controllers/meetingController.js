import pool from "../config/db.js";
import { createCalendarEvent } from "../services/googleCalendar.js";

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

    const result = await pool.query(
      `UPDATE meetings SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        start_time = COALESCE($3, start_time),
        end_time = COALESCE($4, end_time),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *`,
      [title, description, startTime, endTime, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: "Meeting not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete meeting
export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM meetings WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) return res.status(404).json({ message: "Meeting not found" });

    res.json({ message: "Meeting deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};