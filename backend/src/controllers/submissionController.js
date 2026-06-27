import Submission from "../models/Submission.js";
import Problem from "../models/Problem.js";
import { generateFile } from "../../compiler/generateFile.js";
import { generateInputFile } from "../../compiler/generateInputFile.js";
import { executeCode } from "../../compiler/executeCode.js";
import { cleanupFile, cleanupOutput, outputPath } from "../../compiler/cleanup.js";

/**
 * @desc    Submit code against hidden test cases
 * @route   POST /api/submissions
 * @access  Private
 */
export const submitCode = async (req, res) => {
  const { problemSlug, language, code } = req.body;

  if (!problemSlug || !language || !code) {
    return res.status(400).json({
      success: false,
      message: "problemSlug, language, and code are required",
    });
  }

  // Fetch problem WITH test cases (select: false by default)
  const problem = await Problem.findOne({ slug: problemSlug }).select("+testCases");

  if (!problem) {
    return res.status(404).json({
      success: false,
      message: "Problem not found",
    });
  }

  if (!problem.testCases || problem.testCases.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No test cases found for this problem",
    });
  }

  // Create a pending submission first — we'll update it after execution
  const submission = await Submission.create({
    userId: req.user.id,
    problemId: problem._id,
    problemSlug,
    language,
    code,
    verdict: "Pending",
    totalTestCases: problem.testCases.length,
  });

  let filePath, jobId, jobDir;

  try {
    // Generate code file
    ({ filePath, jobId, jobDir } = await generateFile(language, code));

    let testCasesPassed = 0;
    let finalVerdict = "Accepted";
    let errorMessage = "";
    let maxRuntime = 0;

    // Run against each test case one by one
    for (let i = 0; i < problem.testCases.length; i++) {
      const testCase = problem.testCases[i];
      let inputFilePath;

      try {
        inputFilePath = await generateInputFile(testCase.input);

        const startTime = Date.now();
        const result = await executeCode(
          language,
          filePath,
          inputFilePath,
          jobId,
          jobDir
        );
        const runtime = Date.now() - startTime;

        if (runtime > maxRuntime) maxRuntime = runtime;

        if (!result.success) {
          // Map error type to verdict
          if (result.errorType === "compile_error") {
            finalVerdict = "Compile Error";
            errorMessage = result.error;
            break; // No point running more test cases
          } else if (result.errorType === "timeout") {
            finalVerdict = "Time Limit Exceeded";
            break;
          } else {
            finalVerdict = "Runtime Error";
            errorMessage = result.error;
            break;
          }
        }

        // Trim whitespace from both sides before comparing
        const actualOutput = result.output.trim();
        const expectedOutput = testCase.expectedOutput.trim();

        if (actualOutput !== expectedOutput) {
          finalVerdict = "Wrong Answer";
          errorMessage = `Test case ${i + 1} failed.\nExpected: ${expectedOutput}\nGot: ${actualOutput}`;
          break;
        }

        testCasesPassed++;
      } finally {
        if (inputFilePath) cleanupFile(inputFilePath);
      }
    }

    // Update submission with final verdict
    submission.verdict = finalVerdict;
    submission.testCasesPassed = testCasesPassed;
    submission.runtime = maxRuntime;
    submission.errorMessage = errorMessage;
    await submission.save();

    return res.status(200).json({
      success: true,
      submission: {
        _id: submission._id,
        verdict: finalVerdict,
        testCasesPassed,
        totalTestCases: problem.testCases.length,
        runtime: maxRuntime,
        errorMessage,
        language,
        createdAt: submission.createdAt,
      },
    });
  } catch (error) {
    // Update submission as runtime error if something unexpected happened
    submission.verdict = "Runtime Error";
    submission.errorMessage = error.message;
    await submission.save();

    return res.status(500).json({
      success: false,
      message: "Submission failed",
      error: error.message,
    });
  } finally {
    // Always cleanup code file
    if (language === "java" && jobDir) {
      cleanupFile(jobDir);
    } else if (filePath) {
      cleanupFile(filePath);
      if (jobId) cleanupOutput(language, jobId, jobDir);
    }
  }
};

/**
 * @desc    Get submission history for a problem by the logged-in user
 * @route   GET /api/submissions?problemSlug=two-sum
 * @access  Private
 */
export const getMySubmissions = async (req, res) => {
  try {
    const { problemSlug } = req.query;

    const filter = { userId: req.user.id };
    if (problemSlug) filter.problemSlug = problemSlug;

    const submissions = await Submission.find(filter)
      .select("-code") // don't send full code in list view
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single submission with full code
 * @route   GET /api/submissions/:id
 * @access  Private
 */
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Users can only see their own submissions
    if (submission.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};