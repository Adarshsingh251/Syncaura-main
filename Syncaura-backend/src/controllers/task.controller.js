import pool from "../config/db.js";
import { validate as isUUID } from "uuid";

/**
 * CREATE TASK
 */
export const createTask = async (req, res) => {
  try {
    const { 
      title, description, priority, assignedTo, deadline, status, 
      projectId, startDate, endDate, dependencies, reminderAt 
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (
        title, description, priority, assigned_to, deadline, status, 
        project_id, start_date, end_date, reminder_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        title, description, priority || "medium", assignedTo, deadline, 
        status || "TODO", projectId || null, startDate || null, 
        endDate || null, reminderAt || deadline || null
      ]
    );

    const task = result.rows[0];

    // Handle dependencies
    if (dependencies && Array.isArray(dependencies)) {
      for (const depId of dependencies) {
        await pool.query(
          "INSERT INTO task_dependencies (task_id, dependency_id) VALUES ($1, $2)",
          [task.id, depId]
        );
      }
      task.dependencies = dependencies;
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET ALL TASKS
 */
export const getAllTasks = async (req, res) => {
  try {
    const {
      projectId,
      assignedTo,
      priority,
      status,
      deadline,
      search
    } = req.query;

    // Validate Project ID
    if (projectId && !isUUID(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    let query = "SELECT * FROM tasks";
    const conditions = [];
    const values = [];

    // Project Filter
    if (projectId) {
      values.push(projectId);
      conditions.push(`project_id = $${values.length}`);
    }

    // Assignee Filter
    if (assignedTo) {
      values.push(assignedTo);
      conditions.push(`assigned_to = $${values.length}`);
    }

    // Priority Filter
    if (priority) {
      values.push(priority);
      conditions.push(`priority = $${values.length}`);
    }

    // Status Filter
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    // Due Date Filter
    if (deadline) {
      values.push(deadline);
      conditions.push(`DATE(deadline) = DATE($${values.length})`);
    }

    // Search by title or description
    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(title ILIKE $${values.length} OR description ILIKE $${values.length})`
      );
    }

    // Add WHERE clause
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Sort latest first
    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error("Get Tasks Error:", error);

    return res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
};

/**
 * GET SINGLE TASK
 */
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const taskResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);

    if (taskResult.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskResult.rows[0];

    // Get subtasks
    const subtasksResult = await pool.query("SELECT * FROM subtasks WHERE task_id = $1", [id]);
    task.subtasks = subtasksResult.rows;

    // Get dependencies
    const depsResult = await pool.query(
      "SELECT dependency_id FROM task_dependencies WHERE task_id = $1",
      [id]
    );
    task.dependencies = depsResult.rows.map(r => r.dependency_id);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE TASK 
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, priority, assignedTo, deadline, status, 
      projectId, startDate, endDate, reminderAt 
    } = req.body;

    const result = await pool.query(
      `UPDATE tasks SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        assigned_to = COALESCE($4, assigned_to),
        deadline = COALESCE($5, deadline),
        status = COALESCE($6, status),
        project_id = COALESCE($7, project_id),
        start_date = COALESCE($8, start_date),
        end_date = COALESCE($9, end_date),
        reminder_at = COALESCE($10, reminder_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 RETURNING *`,
      [
        title, description, priority, assignedTo, deadline, status, 
        projectId, startDate, endDate, reminderAt, id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE TASK
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE TASK STATUS
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id: userId, role } = req.user; 
    const { id: taskId } = req.params;

    const allowedStatus = ["TODO", "IN_PROGRESS", "DONE"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const taskResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);

    if (taskResult.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskResult.rows[0];

    if (role !== "admin" && task.assigned_to !== userId) {
      return res.status(403).json({
        message: "Not authorized to update task status",
      });
    }

    const updateResult = await pool.query(
      "UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, taskId]
    );

    res.json({
      message: "Task status updated successfully",
      task: updateResult.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const taskCheck = await pool.query("SELECT id FROM tasks WHERE id = $1", [taskId]);
    if (taskCheck.rowCount === 0) return res.status(404).json({ message: "Task not found" });

    const result = await pool.query(
      "INSERT INTO subtasks (task_id, title) VALUES ($1, $2) RETURNING *",
      [taskId, title]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGanttData = async (req, res) => {
  try {
    const { projectId } = req.query;

    const result = await pool.query(
      "SELECT * FROM tasks WHERE project_id = $1 AND start_date IS NOT NULL AND end_date IS NOT NULL",
      [projectId]
    );

    const ganttTasks = result.rows.map(task => ({
      id: task.id,
      name: task.title,
      start: task.start_date.toISOString().split("T")[0], 
      end: task.end_date.toISOString().split("T")[0],
      progress: task.status === "DONE" ? 100 : 0
    }));

    res.json(ganttTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUpcomingReminders = async (req, res) => {
  try {
    const now = new Date();
    const upcoming = new Date();
    upcoming.setDate(now.getDate() + 3); // next 3 days

    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE status != 'DONE' 
       AND (
         (reminder_at >= $1 AND reminder_at <= $2) OR 
         (reminder_at IS NULL AND deadline >= $1 AND deadline <= $2)
       )`,
      [now, upcoming]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Check dependencies
    const depsResult = await pool.query(
      `SELECT d.status 
       FROM task_dependencies td 
       JOIN tasks d ON td.dependency_id = d.id 
       WHERE td.task_id = $1`,
      [id]
    );

    const blocked = depsResult.rows.some(dep => dep.status !== "DONE");

    if (blocked) {
      return res.status(400).json({
        message: "Cannot start task. Dependencies not completed.",
      });
    }

    const updateResult = await pool.query(
      "UPDATE tasks SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
