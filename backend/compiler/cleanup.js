import fs from "fs";
import path from "path";
import os from "os";

export const outputPath = path.join(os.tmpdir(), "oj_outputs");

export const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Cleanup failed for ${filePath}:`, err.message);
  }
};

export const cleanupOutput = (language, jobId, jobDir) => {
  try {
    if (language === "cpp") {
      cleanupFile(path.join(outputPath, jobId));
    } else if (language === "java") {
      cleanupFile(path.join(jobDir, "Main.class"));
    }
  } catch (err) {
    console.error("Output cleanup failed:", err.message);
  }
};