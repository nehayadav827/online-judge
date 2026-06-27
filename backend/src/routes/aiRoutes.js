import express from "express";
import {
  codeReview,
  complexityAnalysis,
  getHint,
  explainWrongAnswer,
  explainError,
  generateTestCases,
  dryRun,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All AI features require login
router.post("/review", protect, codeReview);
router.post("/complexity", protect, complexityAnalysis);
router.post("/hint", protect, getHint);
router.post("/explain-wrong-answer", protect, explainWrongAnswer);
router.post("/explain-error", protect, explainError);
router.post("/generate-test-cases", protect, generateTestCases);
router.post("/dry-run", protect, dryRun);

export default router;