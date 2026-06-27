import { generateFile } from "./generateFile.js";
import { generateInputFile } from "./generateInputFile.js";
import { executeCode } from "./executeCode.js";
import { cleanupFile, cleanupOutput } from "./cleanup.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "outputs");

const SUPPORTED_LANGUAGES = ["cpp", "java", "python", "javascript"];

/**
 * @desc    Run submitted code against given input
 * @route   POST /api/compiler/run
 * @access  Private (or Public — your choice)
 */
export const runCode = async (req, res) => {

  
  const { language, code, input } = req.body;

  // ── Validation ──
  if (!code || code.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Code cannot be empty",
    });
  }

  if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      success: false,
      message: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
    });
  }

  let filePath, jobId, jobDir, inputFilePath;

  try {

    

    // ── Generate files ──
    ({ filePath, jobId, jobDir } = await generateFile(language, code));

    

    inputFilePath = await generateInputFile(input);


    // ── Execute ──
    const result = await executeCode(language, filePath, inputFilePath, jobId, jobDir);
  
    if (!result.success) {
      // Map internal error types to verdict-style responses
      const verdictMap = {
        compile_error: "Compile Error",
        timeout: "Time Limit Exceeded",
        runtime_error: "Runtime Error",
        unsupported_language: "Unsupported Language",
      };

      return res.status(200).json({
        success: false,
        verdict: verdictMap[result.errorType] || "Error",
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      verdict: "Success",
      output: result.output,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Execution failed",
      error: error.message,
    });

  } finally {
    // ── Cleanup — always runs, even if there was an error ──
    if (language === "java" && jobDir) {
      cleanupFile(jobDir); // deletes the whole job folder (Main.java + Main.class)
    } else if (filePath) {
      cleanupFile(filePath);
      cleanupOutput(language, jobId, jobDir, outputPath);
    }

    if (inputFilePath) {
      cleanupFile(inputFilePath);

      
    }
  }
};