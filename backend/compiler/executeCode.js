import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export const outputPath = path.join(os.tmpdir(), "oj_outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const TIME_LIMIT_MS = 5000;
const MEMORY_LIMIT = "256m";
const PIDS_LIMIT = 64;

// Docker image names
const DOCKER_IMAGES = {
  cpp:        "codearena-cpp:latest",
  java:       "codearena-java:latest",
  python:     "codearena-python:latest",
  javascript: "codearena-javascript:latest",
};

// Local language config (no Docker)
const localConfig = {
  cpp: {
    needsCompile: true,
    compile: (codeFilePath, jobId) =>
      `g++ "${codeFilePath}" -o "${path.join(outputPath, jobId)}"`,
    run: (codeFilePath, jobId) =>
      `"${path.join(outputPath, jobId)}"`,
  },
  java: {
    needsCompile: true,
    compile: (codeFilePath, jobId, jobDir) =>
      `javac "${codeFilePath}" -d "${jobDir}"`,
    run: (codeFilePath, jobId, jobDir) =>
      `java -cp "${jobDir}" Main`,
  },
  python: {
    needsCompile: false,
    run: (codeFilePath) => `python3 "${codeFilePath}"`,
  },
  javascript: {
    needsCompile: false,
    run: (codeFilePath) => `node "${codeFilePath}"`,
  },
};

// ─────────────────────────────────────────────
// LOCAL EXECUTION
// ─────────────────────────────────────────────
const runCommandLocal = (command, inputData = "") => {
  return new Promise((resolve, reject) => {
    console.log("[LOCAL] Running:", command);

    const child = exec(
      command,
      { timeout: TIME_LIMIT_MS, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        console.log("[LOCAL] stdout:", stdout);
        console.log("[LOCAL] stderr:", stderr);

        if (error) {
          if (error.killed) {
            return reject({ type: "timeout", message: "Time Limit Exceeded" });
          }
          return reject({
            type: "runtime_error",
            message: stderr || error.message,
          });
        }

        resolve({ stdout, stderr });
      }
    );

    try {
      if (inputData && inputData.trim() !== "") {
        child.stdin.write(inputData);
      }
      child.stdin.end();
    } catch (e) {
      console.log("[LOCAL] stdin write error:", e.message);
    }
  });
};

const executeLocal = async (language, codeFilePath, inputData, jobId, jobDir) => {
  const config = localConfig[language];

  if (!config) {
    return {
      success: false,
      error: `Unsupported language: ${language}`,
      errorType: "unsupported_language",
    };
  }

  // Step 1 — Compile if needed
  if (config.needsCompile) {
    const compileCmd = language === "java"
      ? config.compile(codeFilePath, jobId, jobDir)
      : config.compile(codeFilePath, jobId);

    try {
      await runCommandLocal(compileCmd, "");
    } catch (err) {
      return {
        success: false,
        error: err.message,
        errorType: "compile_error",
      };
    }
  }

  // Step 2 — Run
  const runCmd = language === "java"
    ? config.run(codeFilePath, jobId, jobDir)
    : config.run(codeFilePath, jobId);

  try {
    const { stdout } = await runCommandLocal(runCmd, inputData);
    return { success: true, output: stdout };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      errorType: err.type || "runtime_error",
    };
  }
};

// ─────────────────────────────────────────────
// DOCKER EXECUTION
// ─────────────────────────────────────────────

// Commands that run INSIDE the container
const dockerCompileCmd = {
  cpp:  (filename) => `g++ /sandbox/${filename} -o /sandbox/output`,
  java: (filename) => `javac /sandbox/${filename}`,
};

const dockerRunCmd = {
  cpp:        () => `/sandbox/output`,
  java:       () => `java -cp /sandbox Main`,
  python:     (filename) => `python3 /sandbox/${filename}`,
  javascript: (filename) => `node /sandbox/${filename}`,
};



const executeDocker = async (language, codeFilePath, inputFilePath, jobId, jobDir) => {
  if (!DOCKER_IMAGES[language]) {
    return {
      success: false,
      error: `Unsupported language: ${language}`,
      errorType: "unsupported_language",
    };
  }

  const image    = DOCKER_IMAGES[language];
  const filename = path.basename(codeFilePath);

  // Build the full command to run inside ONE container
  let innerCmd;

  if (language === "cpp") {
    // Compile then run in same shell session — output binary stays in /sandbox
    innerCmd = `g++ /sandbox/${filename} -o /sandbox/output && timeout ${Math.floor(TIME_LIMIT_MS / 1000)} /sandbox/output < /sandbox/input.txt`;
  } else if (language === "java") {
    // Compile then run in same session
    innerCmd = `javac /sandbox/${filename} && timeout ${Math.floor(TIME_LIMIT_MS / 1000)} java -cp /sandbox Main < /sandbox/input.txt`;
  } else if (language === "python") {
    innerCmd = `timeout ${Math.floor(TIME_LIMIT_MS / 1000)} python3 /sandbox/${filename} < /sandbox/input.txt`;
  } else if (language === "javascript") {
    innerCmd = `timeout ${Math.floor(TIME_LIMIT_MS / 1000)} node /sandbox/${filename} < /sandbox/input.txt`;
  }

  const dockerCmd = [
    "docker run",
    "--rm",
    "--network none",
    `--memory ${MEMORY_LIMIT}`,
    `--memory-swap ${MEMORY_LIMIT}`,
    `--pids-limit ${PIDS_LIMIT}`,
    "--cpus 1",
    `-v "${codeFilePath}":/sandbox/${filename}:ro`,
    inputFilePath ? `-v "${inputFilePath}":/sandbox/input.txt:ro` : "",
    `--workdir /sandbox`,
    image,
    `/bin/sh -c "${innerCmd}"`,
  ].filter(Boolean).join(" ");

  console.log("[DOCKER] Running:", dockerCmd);

  return new Promise((resolve, reject) => {
    const hardKillTimer = setTimeout(() => {
      reject({ type: "timeout", message: "Time Limit Exceeded" });
    }, TIME_LIMIT_MS + 3000);

    exec(
      dockerCmd,
      { timeout: TIME_LIMIT_MS + 3000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        clearTimeout(hardKillTimer);

        console.log("[DOCKER] stdout:", stdout);
        console.log("[DOCKER] stderr:", stderr);

        if (error) {
          if (error.code === 124) {
            return reject({ type: "timeout", message: "Time Limit Exceeded" });
          }
          if (error.killed || error.signal === "SIGTERM") {
            return reject({ type: "timeout", message: "Time Limit Exceeded" });
          }

          // Separate compile errors from runtime errors
          const isCompileError =
            stderr?.includes("error:") ||        // g++ errors
            stderr?.includes("error:") ||        // javac errors
            stderr?.includes("SyntaxError");     // python syntax

          return reject({
            type: isCompileError ? "compile_error" : "runtime_error",
            message: stderr || error.message,
          });
        }

        resolve({ stdout, stderr });
      }
    );
  });
};

// ─────────────────────────────────────────────
// MAIN EXPORT — picks local or docker from .env
// ─────────────────────────────────────────────
export const executeCode = async (
  language,
  codeFilePath,
  inputFilePath,
  jobId,
  jobDir
) => {
  const useDocker = process.env.EXECUTOR_MODE === "docker";

  console.log(`[EXECUTOR] Mode: ${useDocker ? "DOCKER" : "LOCAL"} | Language: ${language}`);

  if (useDocker) {
    return executeDocker(language, codeFilePath, inputFilePath, jobId, jobDir);
  } else {
    const inputData = fs.existsSync(inputFilePath)
      ? fs.readFileSync(inputFilePath, "utf8")
      : "";
    return executeLocal(language, codeFilePath, inputData, jobId, jobDir);
  }
};