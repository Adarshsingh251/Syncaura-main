import pool from "../config/db.js";
import { validate as isUUID } from "uuid";

/**
 * CREATE PROJECT
 */
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (name, description, created_by) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET ALL PROJECTS
 */
export const getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE created_by = $1",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET SINGLE PROJECT
 */
export const getProjectById = async (req, res) => {
  try {

    if (!isUUID(req.params.id)) {
  return res.status(400).json({
    message: "Invalid project ID"
  });
}
    const result = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * UPDATE PROJECT
 */
export const updateProject = async (req, res) => {
  try {

    if (!isUUID(req.params.id)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    const { name, description, status } = req.body;
    let updateFields = [];
    let values = [];
    let idx = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${idx++}`);
      values.push(status);
    }

    if (updateFields.length === 0) {
      const current = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
      if (current.rowCount === 0) return res.status(404).json({ message: "Project not found" });
      return res.json(current.rows[0]);
    }

    values.push(req.params.id);
    const query = `UPDATE projects SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`;
    
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE PROJECT
 */
export const deleteProject = async (req, res) => {
  try {

    if (!isUUID(req.params.id)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }
    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
