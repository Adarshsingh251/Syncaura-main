import pool from '../config/db.js';

export const applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;

    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({
        message: "fromDate, toDate and reason are required"
      });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from) || isNaN(to)) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (from < today) {
      return res.status(400).json({
        message: "fromDate cannot be before today"
      });
    }

    if (to < from) {
      return res.status(400).json({
        message: "toDate cannot be before fromDate"
      });
    }

    const result = await pool.query(
      "INSERT INTO leaves (user_id, from_date, to_date, reason) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.id, from, to, reason]
    );

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error applying leave:", error);
    res.status(500).json({ message: "Error applying leave" });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query("SELECT * FROM leaves WHERE user_id = $1", [userId]);

    res.status(200).json({ leaves: result.rows });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ message: "Error fetching leaves" });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const result = await pool.query("SELECT l.*, u.name as user_name FROM leaves l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC");

    res.status(200).json({ leaves: result.rows });
  } catch (error) {
    console.error("Error fetching all leaves:", error);
    res.status(500).json({ message: "Error fetching leaves" });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE leaves SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [req.user.id, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.status(200).json({ message: "Leave approved successfully", leave: result.rows[0] });
  } catch (error) {
    console.error("Error approving leave:", error);
    res.status(500).json({ message: "Error approving leave" });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE leaves SET status = 'rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = 'pending' RETURNING *",
      [req.user.id, req.params.id]
    );

    if (result.rowCount === 0) {
      const check = await pool.query("SELECT status FROM leaves WHERE id = $1", [req.params.id]);
      if (check.rowCount === 0) return res.status(404).json({ message: "Leave not found" });
      return res.status(400).json({ message: "Leave already reviewed" });
    }

    res.status(200).json({ message: "Leave rejected successfully", leave: result.rows[0] });
  } catch (error) {
    console.error("Error rejecting leave:", error);
    res.status(500).json({ message: "Error rejecting leave" });
  }
};
