import pool from "../config/db.js";
import {errorMiddleware} from "../middlewares/errorHandler.js";

// Send Message
export const sendMessage = async (req, res ,next) => {
  try {
    const userId = req.user.id;
    const { channelId, text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const channelResult = await pool.query("SELECT * FROM channels WHERE id = $1", [channelId]);
    if (channelResult.rowCount === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const memberCheck = await pool.query(
      "SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2",
      [channelId, userId]
    );
    if (memberCheck.rowCount === 0) {
      return res.status(403).json({ message: "Not a channel member" });
    }

    const result = await pool.query(
      "INSERT INTO messages (channel_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *",
      [channelId, userId, text]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error)
  }
};

// Fetch Messages
export const getMessages = async (req, res ,next) => {
  try {
    const userId = req.user.id;
    const { channelId } = req.params;

    const channelCheck = await pool.query(
      "SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2",
      [channelId, userId]
    );
    if (channelCheck.rowCount === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await pool.query(
      `SELECT m.*, u.name as sender_name 
       FROM messages m 
       JOIN users u ON m.sender_id = u.id 
       WHERE m.channel_id = $1 
       ORDER BY m.created_at ASC`,
      [channelId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error)
  }
};

export const sendMediaMessage = async (req, res ,next) => {
  try {
    const { channelId } = req.body;
    const senderId = req.user.id;

    const channelResult = await pool.query("SELECT * FROM channels WHERE id = $1", [channelId]);
    if (channelResult.rowCount === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const memberCheck = await pool.query(
      "SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2",
      [channelId, senderId]
    );
    if (memberCheck.rowCount === 0) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const result = await pool.query(
      "INSERT INTO messages (channel_id, sender_id, message_type, file_url) VALUES ($1, $2, $3, $4) RETURNING *",
      [channelId, senderId, "file", `/uploads/chat/${req.file.filename}`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error)
  }
};