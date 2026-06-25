import pool from "../config/db.js";

export const addAttachment = async (req, res) => {
  try {
    const { meetingId, fileName, fileUrl } = req.body;
    // validating
  if (!meetingId || !fileName || !fileUrl) {
    return res.status(400).json({ message: "meetingId, fileName, and fileUrl are required" });
  }
    // Check if meeting exists
    const meetingCheck = await pool.query("SELECT id FROM meetings WHERE id = $1", [meetingId]);
    if (meetingCheck.rowCount === 0) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const result = await pool.query(
      "INSERT INTO attachments (meeting_id, file_name, file_url) VALUES ($1, $2, $3) RETURNING *",
      [meetingId, fileName, fileUrl]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttachmentsByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const result = await pool.query(
      "SELECT * FROM attachments WHERE meeting_id = $1 ORDER BY created_at DESC",
      [meetingId]
    );
    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


