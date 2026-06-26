import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import languageConfig from "./languageConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Time limit for execution — prevents infinite loops from hanging the server
const TIME_LIMIT_MS = 5000;

/**
 * Runs a shell command with a timeout.
 * Resolves with { stdout, stderr }
 * Rejects with { type: "compile_error" | "runtime_error" | "timeout", message }
 */
const runCommand = (command, errorType) => {
  return new Promise((resolve, reject) => {
    const child = exec(
      command,
      { timeout: TIME_LIMIT_MS, maxBuffer: 1024 * 1024 }, // 1MB output limit
      (error, stdout, stderr) => {
        if (error) {
          // exec sets error.killed = true when timeout is hit
          if (error.killed) {
            return reject({
              type: "timeout",
              message: "Time Limit Exceeded",
            });
          }

          return reject({
            type: errorType,
            message: stderr || error.message,
          });
        }

        resolve({ stdout, stderr });
      }
    );
  });
};

/**
 * Executes code for the given language.
 *
 * @param {string} language - "cpp" | "java" | "python" | "javascript"
 * @param {string} codeFilePath - path to the submitted code file
 * @param {string} inputFilePath - path to the input file
 * @param {string} jobId - unique job identifier
 * @param {string} jobDir - directory containing the code (matters for Java)
 *
 * Returns: { success: true, output: string }
 *       or { success: false, error: string, errorType: string }
 */
export const executeCode = async (language, codeFilePath, inputFilePath, jobId, jobDir) => {
  const config = languageConfig[language];

  if (!config) {
    return {
      success: false,
      error: `Unsupported language: ${language}`,
      errorType: "unsupported_language",
    };
  }

  // Step 1 — Compile (if the language needs it)
  if (config.needsCompile) {
    // Java compiles into jobDir itself; cpp compiles into outputs/
    const compileTargetDir = language === "java" ? jobDir : outputPath;
    const compileCommand = config.compile(codeFilePath, jobId, compileTargetDir);

    try {
      await runCommand(compileCommand, "compile_error");
    } catch (err) {
      return {
        success: false,
        error: err.message,
        errorType: err.type, // "compile_error"
      };
    }
  }

  // Step 2 — Run
  const runTargetDir = language === "java" ? jobDir : outputPath;
  const runCommandStr = config.run(jobId, runTargetDir, inputFilePath, codeFilePath);

  try {
    const { stdout } = await runCommand(runCommandStr, "runtime_error");

    return {
      success: true,
      output: stdout,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      errorType: err.type, // "runtime_error" or "timeout"
    };
  }
};
