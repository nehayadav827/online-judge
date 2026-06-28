import express from "express";
import rateLimit from "express-rate-limit";

import {
  createContest,
  getAllContests,
  getContestBySlug,
  updateContest,
  deleteContest,
  registerForContest,
  contestSubmit,
  getScoreboard,
  getMyContestSubmissions,
} from "../controllers/contestController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Optional auth — attach user if token exists but don't block
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_ACCESS_SECRET
      );
    } catch {}
  }
  next();
};

const contestSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id ?? "anonymous",
  skip: (req) => !req.user,
  message: {
    success: false,
    message: "Too many submissions. Please wait.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public
router.get("/", getAllContests);
router.get("/:slug", optionalAuth, getContestBySlug);
router.get("/:slug/scoreboard", getScoreboard);

// Private
router.post("/", protect, restrictTo("admin", "problemsetter"), createContest);
router.put("/:slug", protect, restrictTo("admin", "problemsetter"), updateContest);
router.delete("/:slug", protect, restrictTo("admin"), deleteContest);
router.post("/:slug/register", protect, registerForContest);
router.post("/:slug/submit", protect, contestSubmissionLimiter, contestSubmit);
router.get("/:slug/my-submissions", protect, getMyContestSubmissions);

export default router;