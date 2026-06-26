import path from "path";

// jobId is the unique filename (without extension)
// outputPath is the outputs/ directory
// codeFilePath is the full path to the submitted code file

const languageConfig = {
  cpp: {
    extension: "cpp",
    // Two-step: compile to binary, then run binary with input
    compile: (codeFilePath, jobId, outputPath) =>
      `g++ "${codeFilePath}" -o "${path.join(outputPath, jobId)}"`,
    run: (jobId, outputPath, inputFilePath) =>
      `cd "${outputPath}" && "./${jobId}" < "${inputFilePath}"`,
    needsCompile: true,
  },

  java: {
    extension: "java",
    // javac requires the file to be named exactly as the public class
    // We name every submission "Main.java" and require class Main in user code
    compile: (codeFilePath, jobId, outputPath) =>
      `javac "${codeFilePath}" -d "${outputPath}"`,
    run: (jobId, outputPath, inputFilePath) =>
      `cd "${outputPath}" && java Main < "${inputFilePath}"`,
    needsCompile: true,
    // Java needs a fixed filename — handled specially in generateFile.js
    fixedFilename: "Main",
  },

  python: {
    extension: "py",
    // No compile step — runs directly
    compile: null,
    run: (jobId, outputPath, inputFilePath, codeFilePath) =>
      `python3 "${codeFilePath}" < "${inputFilePath}"`,
    needsCompile: false,
  },

  javascript: {
  extension: "cjs",
  compile: null,
  run: (jobId, outputPath, inputFilePath, codeFilePath) =>
    `node "${codeFilePath}" < "${inputFilePath}"`,
  needsCompile: false,
},
};

export default languageConfig;