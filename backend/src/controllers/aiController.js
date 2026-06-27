import groq from "../config/groq.js";

// Single reusable function to call Groq
const askGroq = async (systemPrompt, userPrompt) => {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // best free model on Groq
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  return response.choices[0].message.content;
};

// ─────────────────────────────────────────────
// 1. AI Code Review
// ─────────────────────────────────────────────
export const codeReview = async (req, res) => {
  try {
    const { code, language, problemTitle } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "code and language are required",
      });
    }

    const system = `You are an expert competitive programming mentor.
Review code submissions and give honest, constructive feedback.
Be specific and concise. Format your response with clear sections.`;

    const user = `Review this ${language} solution${problemTitle ? ` for the problem "${problemTitle}"` : ""}:

\`\`\`${language}
${code}
\`\`\`

Give feedback on:
1. Correctness — will it pass all edge cases?
2. Code Quality — readability, naming, structure
3. Potential Issues — bugs, off-by-one errors, overflow
4. Suggestions — specific improvements

Keep it concise and practical.`;

    const result = await askGroq(system, user);

    return res.status(200).json({ success: true, review: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 2. Time & Space Complexity Analysis
// ─────────────────────────────────────────────
export const complexityAnalysis = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "code and language are required",
      });
    }

    const system = `You are an algorithms expert specializing in complexity analysis.
Always give precise Big-O notation with clear reasoning.
Be concise and direct.`;

    const user = `Analyze the time and space complexity of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Respond in exactly this format:

**Time Complexity:** O(?)
**Space Complexity:** O(?)

**Time Complexity Explanation:**
(explain why, mention loops, recursion, data structures used)

**Space Complexity Explanation:**
(explain why, mention extra memory used)

**Can it be optimized?**
(yes/no and brief suggestion if yes)`;

    const result = await askGroq(system, user);

    return res.status(200).json({ success: true, analysis: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 3. Hint Generator
// ─────────────────────────────────────────────
export const getHint = async (req, res) => {
  try {
    const { problemTitle, problemStatement, level = 1 } = req.body;

    if (!problemTitle || !problemStatement) {
      return res.status(400).json({
        success: false,
        message: "problemTitle and problemStatement are required",
      });
    }

    const hintLevels = {
      1: "Give a very subtle hint — just point toward the right category of algorithm or data structure. Do NOT reveal the approach.",
      2: "Give a moderate hint — mention the technique or pattern to use (e.g. sliding window, two pointers) but do not show code.",
      3: "Give a strong hint — describe the high-level approach step by step. Still no code.",
    };

    const system = `You are a helpful programming tutor. 
Give hints that guide students to find the solution themselves.
Never give away the complete solution.`;

    const user = `Problem: ${problemTitle}

Statement: ${problemStatement}

Hint level ${level}/3: ${hintLevels[level] || hintLevels[1]}`;

    const result = await askGroq(system, user);

    return res.status(200).json({
      success: true,
      hint: result,
      level: parseInt(level),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 4. Wrong Answer Explanation
// ─────────────────────────────────────────────
export const explainWrongAnswer = async (req, res) => {
  try {
    const {
      code,
      language,
      problemTitle,
      problemStatement,
      errorMessage,
    } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "code and language are required",
      });
    }

    const system = `You are a debugging expert and programming mentor.
Explain bugs clearly so students understand what went wrong and why.
Be educational, not just corrective.`;

    const user = `A student got a Wrong Answer on this problem.

Problem: ${problemTitle || "Unknown"}
Statement: ${problemStatement || "Not provided"}

Their ${language} code:
\`\`\`${language}
${code}
\`\`\`

${errorMessage ? `Error / Failed test case info:\n${errorMessage}` : ""}

Please explain:
1. What is likely wrong with their logic?
2. Which specific part of the code causes the wrong answer?
3. What edge cases they might have missed?
4. How to fix it (without writing the complete solution)?`;

    const result = await askGroq(system, user);

    return res.status(200).json({ success: true, explanation: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 5. Error Explanation (Compile / Runtime)
// ─────────────────────────────────────────────
export const explainError = async (req, res) => {
  try {
    const { code, language, errorMessage, errorType } = req.body;

    if (!code || !language || !errorMessage) {
      return res.status(400).json({
        success: false,
        message: "code, language, and errorMessage are required",
      });
    }

    const system = `You are a programming tutor who explains compiler and runtime errors clearly.
Explain errors in simple language that a beginner can understand.
Always point to the exact line or issue causing the error.`;

    const user = `A student got a ${errorType || "compilation/runtime"} error.

Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\`

Error message:
${errorMessage}

Please explain:
1. What does this error mean in simple words?
2. What line or part of the code is causing it?
3. How to fix it?`;

    const result = await askGroq(system, user);

    return res.status(200).json({ success: true, explanation: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 6. Test Case Generator
// ─────────────────────────────────────────────
export const generateTestCases = async (req, res) => {
  try {
    const { problemTitle, problemStatement, constraints } = req.body;

    if (!problemTitle || !problemStatement) {
      return res.status(400).json({
        success: false,
        message: "problemTitle and problemStatement are required",
      });
    }

    const system = `You are a competitive programming problem setter.
Generate diverse, tricky test cases that cover edge cases well.
Always output valid JSON only — no extra text.`;

    const user = `Generate 6 test cases for this problem:

Problem: ${problemTitle}
Statement: ${problemStatement}
${constraints ? `Constraints: ${constraints}` : ""}

Include:
- 2 basic/normal cases
- 2 edge cases (minimum input, maximum input, empty, single element)
- 2 tricky cases (could trip up naive solutions)

Respond with ONLY a JSON array, no other text:
[
  { "input": "...", "expectedOutput": "...", "description": "..." },
  ...
]`;

    const result = await askGroq(system, user);

    // Parse JSON from response
    let testCases;
    try {
      const cleaned = result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      testCases = JSON.parse(cleaned);
    } catch {
      // If parsing fails return raw text
      return res.status(200).json({ success: true, testCases: [], raw: result });
    }

    return res.status(200).json({ success: true, testCases });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// 7. Dry Run Visualizer
// ─────────────────────────────────────────────
export const dryRun = async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "code and language are required",
      });
    }

    const system = `You are a programming tutor who traces code execution step by step.
Show variable values changing at each important step.
Be clear and use a table or numbered steps format.`;

    const user = `Dry run this ${language} code step by step:

\`\`\`${language}
${code}
\`\`\`

${input ? `With input: ${input}` : ""}

Show:
1. Each important step of execution
2. Variable values at each step
3. What happens in loops — show first 3 iterations max
4. Final output

Format it clearly with step numbers. Keep it concise.`;

    const result = await askGroq(system, user);

    return res.status(200).json({ success: true, dryRun: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};