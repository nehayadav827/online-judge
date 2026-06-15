import express from "express";

import {
  register,
  login,
  logout,
  getMe,
  refresh,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", protect, getMe);

export default router;