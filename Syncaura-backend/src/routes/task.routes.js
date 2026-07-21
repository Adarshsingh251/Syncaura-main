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
 fix/admin-rbac-verification
import {auth} from "../middlewares/auth.js";
import { permit } from "../middlewares/role.js";
import ROLES from "../config/roles.js";

const router = express.Router();

import { auth } from "../middlewares/auth.js";
 main

const router = express.Router();

// Gantt & reminders
router.get("/gantt/data", getGanttData);
router.get("/reminders/upcoming", getUpcomingReminders);
router.patch("/:id/status", auth, updateTaskStatus);
router.patch("/:id/start", startTask);
router.post("/:taskId/subtasks", auth, addSubtask);
 fix/admin-rbac-verification
router.post("/", auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN, 'coadmin'), createTask); // Create Task
router.get("/", getAllTasks); // Get All Tasks
router.get("/:id", getTaskById); // Get Single Task
router.put("/:id", auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN, 'coadmin'), updateTask); // Update Task
router.delete("/:id", auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN, 'coadmin'), deleteTask); // Delete Task
router.get("/:id/activity", auth, getTaskActivity);
 main

router.post("/", createTask);
router.get("/", getAllTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;