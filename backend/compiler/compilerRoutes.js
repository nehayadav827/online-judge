import express from "express";
import { runCode } from "./compilerController.js";

const router = express.Router();

router.post("/run", runCode);

export default router;