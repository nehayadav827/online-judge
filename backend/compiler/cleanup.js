import fs from "fs";

/**
 * Deletes a file or directory (recursively) if it exists.
 * Used to clean up code/input/output files after execution.
 */
export const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Cleanup failed for ${filePath}:`, err.message);
  }
};

/**
 * Cleans up the compiled binary/class file for cpp and java.
 */
export const cleanupOutput = (language, jobId, jobDir, outputPath) => {
  try {
    if (language === "cpp") {
      const binaryPath = `${outputPath}/${jobId}`;
      cleanupFile(binaryPath);
    } else if (language === "java") {
      const classPath = `${jobDir}/Main.class`;
      cleanupFile(classPath);
    }
  } catch (err) {
    console.error("Output cleanup failed:", err.message);
  }
};