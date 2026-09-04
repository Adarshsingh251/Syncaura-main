import pool from "../config/db.js";
import { validate as isUUID } from "uuid";

/**
 * Helper: Check if the requesting user is an admin/co-admin (org-wide
 * visibility) as opposed to a regular user (only their own projects).
 * Mirrors the same helper used in the tasks controller so both endpoints
 * agree on who counts as "assigned" to a project.
 */
const isUserAdminOrCoAdmin = (user) => {
  const role = String(user?.role || "").toLowerCase();
  return role === "admin" || role === "co-admin" || role === "coadmin";
};

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
    // Admins / Co-admins manage the whole org, so they should see every
    // active project, not just the ones they personally created.
    if (isUserAdminOrCoAdmin(req.user)) {
      const result = await pool.query(
        "SELECT * FROM projects WHERE is_archived = false ORDER BY created_at DESC",
        []
      );
      return res.json(result.rows);
    }

    // Regular users previously only saw projects where created_by = them,
    // which is almost always empty since users don't create projects —
    // they get assigned tasks inside projects created by an admin/co-admin.
    // A project should show up for a user if they created it OR they have
    // at least one task assigned to them inside it (matched the same way
    // tasks.getAllTasks matches "my tasks": by id, email, or name).
    // TRIM+LOWER on both sides to tolerate stray whitespace/case differences
    // in how assigned_to was stored when the task was created.
    const userId = req.user.id;
    const values = [userId, userId];
    const assignedConditions = [`TRIM(LOWER(t.assigned_to)) = TRIM(LOWER($2::text))`];

    if (req.user?.email) {
      values.push(req.user.email);
      assignedConditions.push(`TRIM(LOWER(t.assigned_to)) = TRIM(LOWER($${values.length}))`);
    }
    if (req.user?.name) {
      values.push(req.user.name);
      assignedConditions.push(`TRIM(LOWER(t.assigned_to)) = TRIM(LOWER($${values.length}))`);
    }

    const result = await pool.query(
      `SELECT DISTINCT p.*
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.is_archived = false
         AND (p.created_by = $1::uuid OR (${assignedConditions.join(" OR ")}))
       ORDER BY p.created_at DESC`,
      values
    );

    // TEMP DEBUG: prints to your backend terminal (not visible to the
    // browser) so you can compare against the tasks table directly.
    // Safe to delete once the empty-projects issue is confirmed fixed.
    console.log("[DEBUG getAllProjects] user:", { id: req.user.id, email: req.user.email, name: req.user.name });
    console.log("[DEBUG getAllProjects] matched projects:", result.rows.length);
    const allTasksForUser = await pool.query(
      `SELECT id, title, project_id, assigned_to FROM tasks WHERE (${assignedConditions.join(" OR ")})`,
      values
    ).catch((e) => ({ rows: [], _err: e.message }));
    console.log("[DEBUG getAllProjects] tasks matching this user's identity:", JSON.stringify(allTasksForUser.rows || allTasksForUser._err));

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
/**
 * ARCHIVE PROJECT
 */
export const archiveProject = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE projects SET is_archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project archived successfully", project: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * RESTORE PROJECT
 */
export const restoreProject = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE projects SET is_archived = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project restored successfully", project: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};