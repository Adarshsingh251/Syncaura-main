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
import { permit } from "../middlewares/role.js";
import ROLES from "../config/roles.js";

const router = express.Router();

// Gantt & reminders
router.get("/gantt/data", auth, getGanttData);
router.get("/reminders/upcoming", auth, getUpcomingReminders);
router.patch("/:id/status", auth, updateTaskStatus);
router.patch("/:id/start", auth, startTask);
router.post("/:taskId/subtasks", auth, addSubtask);

// Task CRUD
router.post("/", auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN), createTask);
router.get("/", auth, getAllTasks);
router.get("/:id", auth, getTaskById);
router.put("/:id", auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN), updateTask);
router.delete("/:id", auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN), deleteTask);
router.get("/:id/activity", auth, getTaskActivity);

export default router;