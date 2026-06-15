const express = require("express");

const {
  register,
  login,
  logout,
  getMe, 
  refresh,
} = require("../controllers/authController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", protect, getMe);
router.post("/refresh", refresh);

module.exports = router;