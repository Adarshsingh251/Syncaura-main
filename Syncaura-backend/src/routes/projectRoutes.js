import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  restoreProject,
} from "../controllers/projectController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Protected routes
router.post("/", auth, createProject);
router.get("/", auth, getAllProjects);
router.get("/:id", auth, getProjectById);
router.put("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);
router.patch("/:id/archive", auth, archiveProject);
router.patch("/:id/restore", auth, restoreProject);

export default router;
