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
  console.log("--- /run hit ---");
  console.log("body:", req.body);

  const { language, code, input } = req.body;

  if (!code || code.trim() === "") {
    return res.status(400).json({ success: false, message: "Code cannot be empty" });
  }

  if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ success: false, message: "Unsupported language" });
  }

  let filePath, jobId, jobDir, inputFilePath;

  try {
    console.log("Step 1: generating file...");
    ({ filePath, jobId, jobDir } = await generateFile(language, code));
    console.log("Step 2: file generated:", filePath);

    inputFilePath = await generateInputFile(input);
    console.log("Step 3: input file generated:", inputFilePath);

    const result = await executeCode(language, filePath, inputFilePath, jobId, jobDir);
    console.log("Step 4: result:", result);

    if (!result.success) {
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
    console.log("CAUGHT ERROR:", error); // THIS IS THE KEY LOG
    return res.status(500).json({
      success: false,
      verdict: "Error",
      error: error.message,
    });

  } finally {
    if (language === "java" && jobDir) {
      cleanupFile(jobDir);
    } else if (filePath) {
      cleanupFile(filePath);
      cleanupOutput(language, jobId, jobDir);
    }
    if (inputFilePath) cleanupFile(inputFilePath);
  }
};