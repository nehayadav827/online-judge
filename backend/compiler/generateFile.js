import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";
import languageConfig from "./languageConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dirCodes = path.join(__dirname, "codes");

if (!fs.existsSync(dirCodes)) {
  fs.mkdirSync(dirCodes, { recursive: true });
}

/**
 * Generates a code file for the given language.
 * For Java, creates a dedicated folder per submission so the file
 * can be named "Main.java" (required to match "public class Main").
 *
 * Returns: { filePath, jobId, jobDir }
 */
export const generateFile = async (language, code) => {
  const config = languageConfig[language];

  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const jobId = uuid();

  if (config.fixedFilename) {
    // Java: create codes/<jobId>/Main.java
    const jobDir = path.join(dirCodes, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const filePath = path.join(jobDir, `${config.fixedFilename}.${config.extension}`);
    fs.writeFileSync(filePath, code);

    return { filePath, jobId, jobDir };
  }

  // cpp / python / javascript: single file named <jobId>.<ext>
  const filename = `${jobId}.${config.extension}`;
  const filePath = path.join(dirCodes, filename);
  fs.writeFileSync(filePath, code);

  return { filePath, jobId, jobDir: dirCodes };
};