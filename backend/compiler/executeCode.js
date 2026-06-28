import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export const outputPath = path.join(os.tmpdir(), "oj_outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Docker mode = 5s, local mode = 3s
const TIME_LIMIT_MS = process.env.EXECUTOR_MODE === "docker" ? 5000 : 3000;
const MEMORY_LIMIT  = "256m";
const PIDS_LIMIT    = 64;

const DOCKER_IMAGES = {
  cpp:        "codearena-cpp:latest",
  java:       "codearena-java:latest",
  python:     "codearena-python:latest",
  javascript: "codearena-javascript:latest",
};

// ─────────────────────────────────────────────
// LOCAL EXECUTION
// ─────────────────────────────────────────────

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

const runCommandLocal = (command, inputData = "") => {
  return new Promise((resolve, reject) => {
    console.log("[LOCAL] Running:", command);

    // Hard kill timer for local — catches infinite loops that ignore exec timeout
    const hardKillTimer = setTimeout(() => {
      reject({ type: "timeout", message: "Time Limit Exceeded" });
    }, TIME_LIMIT_MS + 1000);

    const child = exec(
      command,
      { timeout: TIME_LIMIT_MS, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        clearTimeout(hardKillTimer);

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

        resolve(stdout);
      }
    );

    try {
      if (inputData && inputData.trim() !== "") {
        child.stdin.write(inputData);
      }
      child.stdin.end();
    } catch (e) {
      clearTimeout(hardKillTimer);
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
    const stdout = await runCommandLocal(runCmd, inputData);
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

  // Build single command that compiles + runs in ONE container
  // This is critical — binary produced in compile step stays in same /sandbox
  let innerCmd;

  if (language === "cpp") {
    // Infinite loop protection: timeout command inside container kills it at TIME_LIMIT
    innerCmd = `g++ /sandbox/${filename} -o /sandbox/output && timeout ${Math.floor(TIME_LIMIT_MS / 1000)} /sandbox/output < /sandbox/input.txt`;
  } else if (language === "java") {
    innerCmd = `javac /sandbox/${filename} && timeout ${Math.floor(TIME_LIMIT_MS / 1000)} java -cp /sandbox Main < /sandbox/input.txt`;
  } else if (language === "python") {
    innerCmd = `timeout ${Math.floor(TIME_LIMIT_MS / 1000)} python3 /sandbox/${filename} < /sandbox/input.txt`;
  } else if (language === "javascript") {
    innerCmd = `timeout ${Math.floor(TIME_LIMIT_MS / 1000)} node /sandbox/${filename} < /sandbox/input.txt`;
  }

  const dockerCmd = [
    "docker run",
    "--rm",                              // auto-delete container after run
    "--network none",                    // no internet access
    `--memory ${MEMORY_LIMIT}`,          // hard memory cap
    `--memory-swap ${MEMORY_LIMIT}`,     // no swap (prevents memory tricks)
    `--pids-limit ${PIDS_LIMIT}`,        // prevents fork bombs
    "--cpus 1",                          // limit to 1 CPU core
    `-v "${codeFilePath}":/sandbox/${filename}:ro`,       // code file (read-only)
    inputFilePath
      ? `-v "${inputFilePath}":/sandbox/input.txt:ro`     // input file (read-only)
      : "",
    `--workdir /sandbox`,
    image,
    `/bin/sh -c "${innerCmd}"`,
  ].filter(Boolean).join(" ");

  console.log("[DOCKER] Running:", dockerCmd);

  try {
    const output = await new Promise((resolve, reject) => {

      // Layer 1: Hard kill timer — catches cases where Docker itself hangs
      // (e.g. container won't start, daemon issue)
      const hardKillTimer = setTimeout(() => {
        reject({ type: "timeout", message: "Time Limit Exceeded" });
      }, TIME_LIMIT_MS + 3000); // 3s grace period on top of inner timeout

      exec(
        dockerCmd,
        {
          // Layer 2: exec timeout — kills the exec process if it runs too long
          timeout: TIME_LIMIT_MS + 3000,
          maxBuffer: 1024 * 1024, // 1MB output limit
        },
        (error, stdout, stderr) => {
          clearTimeout(hardKillTimer);

          console.log("[DOCKER] stdout:", stdout);
          console.log("[DOCKER] stderr:", stderr);

          if (error) {
            // Layer 3: timeout command inside container returns exit code 124
            if (error.code === 124) {
              return reject({ type: "timeout", message: "Time Limit Exceeded" });
            }
            // exec killed it
            if (error.killed || error.signal === "SIGTERM") {
              return reject({ type: "timeout", message: "Time Limit Exceeded" });
            }
            // stderr says Killed (OOM killer)
            if (stderr?.includes("Killed")) {
              return reject({ type: "timeout", message: "Time Limit Exceeded" });
            }

            // Detect compile errors vs runtime errors
            const isCompileError =
              stderr?.includes("error:") ||      // g++ / javac errors
              stderr?.includes("SyntaxError") || // Python syntax
              stderr?.includes("cannot find");   // Java class not found

            return reject({
              type: isCompileError ? "compile_error" : "runtime_error",
              message: stderr || error.message,
            });
          }

          resolve(stdout);
        }
      );
    });

    return { success: true, output };

  } catch (err) {
    return {
      success: false,
      error: err.message,
      errorType: err.type || "runtime_error",
    };
  }
};

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export const executeCode = async (
  language,
  codeFilePath,
  inputFilePath,
  jobId,
  jobDir
) => {
  const useDocker = process.env.EXECUTOR_MODE === "docker";

  console.log(
    `[EXECUTOR] Mode: ${useDocker ? "DOCKER" : "LOCAL"} | Language: ${language}`
  );

  if (useDocker) {
    // Docker receives inputFilePath directly — mounts as volume
    return executeDocker(language, codeFilePath, inputFilePath, jobId, jobDir);
  } else {
    // Local reads input file content and pipes via stdin
    const inputData = fs.existsSync(inputFilePath)
      ? fs.readFileSync(inputFilePath, "utf8")
      : "";
    return executeLocal(language, codeFilePath, inputData, jobId, jobDir);
  }
};