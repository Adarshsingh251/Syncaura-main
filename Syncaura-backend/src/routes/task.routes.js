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
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Gantt & reminders
router.get("/gantt/data", getGanttData);
router.get("/reminders/upcoming", getUpcomingReminders);
router.patch("/:id/status", auth, updateTaskStatus);
router.patch("/:id/start", startTask);
router.post("/:taskId/subtasks", auth, addSubtask);
router.get("/:id/activity", auth, getTaskActivity);

router.post("/", createTask);
router.get("/", getAllTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;