import express from "express";
import {
  submitCode,
  getMySubmissions,
  getSubmissionById,
} from "../controllers/submissionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, submitCode);
router.get("/", protect, getMySubmissions);
router.get("/:id", protect, getSubmissionById);

export default router;