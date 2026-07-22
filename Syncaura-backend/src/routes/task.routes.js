import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addSubtask,
  getGanttData,
  getUpcomingReminders,
  startTask,
  getTaskActivity,
} from "../controllers/task.controller.js";
import { auth, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

// --- 1. Read Routes (Protected: Logged-in Users) ---
router.get("/gantt/data", auth, getGanttData);
router.get("/reminders/upcoming", auth, getUpcomingReminders);
router.get("/", auth, getAllTasks);
router.get("/:id", auth, getTaskById);
router.get("/:id/activity", auth, getTaskActivity);

// --- 2. User Actions (Protected: Logged-in Users) ---
router.patch("/:id/status", auth, updateTaskStatus);
router.patch("/:id/start", auth, startTask);
router.post("/:taskId/subtasks", auth, addSubtask);

// --- 3. Admin-Only Actions (Protected: Auth + Admin Role) ---
router.post("/", auth, requireAdmin, createTask);
router.put("/:id", auth, requireAdmin, updateTask);
router.delete("/:id", auth, requireAdmin, deleteTask);

export default router;