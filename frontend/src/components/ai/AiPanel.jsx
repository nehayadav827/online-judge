import { useState } from "react";
import {
  getCodeReview,
  getComplexityAnalysis,
  getHint,
  explainWrongAnswer,
  explainError,
  generateTestCases,
  getDryRun,
} from "../../api/aiApi";

const AI_FEATURES = [
  { id: "review", label: "Code Review", icon: "🔍" },
  { id: "complexity", label: "Complexity", icon: "📊" },
  { id: "hint", label: "Hint", icon: "💡" },
  { id: "wrong-answer", label: "Wrong Answer Help", icon: "❌" },
  { id: "error", label: "Error Explain", icon: "🐛" },
  { id: "testcases", label: "Generate Tests", icon: "🧪" },
  { id: "dryrun", label: "Dry Run", icon: "▶️" },
];

const AiPanel = ({ code, language, problem, submitResult, input }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hintLevel, setHintLevel] = useState(1);
  const [testCases, setTestCases] = useState([]);

  const runFeature = async (featureId) => {
    setActiveFeature(featureId);
    setResult("");
    setError("");
    setTestCases([]);
    setLoading(true);

    try {
      let res;

      switch (featureId) {
        case "review":
          res = await getCodeReview({
            code,
            language,
            problemTitle: problem?.title,
          });
          setResult(res.data.review);
          break;

        case "complexity":
          res = await getComplexityAnalysis({ code, language });
          setResult(res.data.analysis);
          break;

        case "hint":
          res = await getHint({
            problemTitle: problem?.title,
            problemStatement: problem?.statement,
            level: hintLevel,
          });
          setResult(res.data.hint);
          // Auto-increment hint level next time
          if (hintLevel < 3) setHintLevel(hintLevel + 1);
          break;

        case "wrong-answer":
          res = await explainWrongAnswer({
            code,
            language,
            problemTitle: problem?.title,
            problemStatement: problem?.statement,
            errorMessage: submitResult?.errorMessage || "",
          });
          setResult(res.data.explanation);
          break;

        case "error":
          res = await explainError({
            code,
            language,
            errorMessage: submitResult?.errorMessage || "Unknown error",
            errorType: submitResult?.verdict || "Runtime Error",
          });
          setResult(res.data.explanation);
          break;

        case "testcases":
          res = await generateTestCases({
            problemTitle: problem?.title,
            problemStatement: problem?.statement,
            constraints: problem?.constraints,
          });
          setTestCases(res.data.testCases || []);
          if (res.data.raw) setResult(res.data.raw);
          break;

        case "dryrun":
          res = await getDryRun({ code, language, input });
          setResult(res.data.dryRun);
          break;

        default:
          break;
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "AI request failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span>🤖 AI Assistant</span>
        {activeFeature && (
          <button
            className="ai-close-btn"
            onClick={() => {
              setActiveFeature(null);
              setResult("");
              setError("");
              setTestCases([]);
              setHintLevel(1);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Feature buttons */}
      <div className="ai-features-grid">
        {AI_FEATURES.map((f) => (
          <button
            key={f.id}
            className={`ai-feature-btn ${activeFeature === f.id ? "active" : ""}`}
            onClick={() => runFeature(f.id)}
            disabled={loading}
            title={f.label}
          >
            <span className="ai-feature-icon">{f.icon}</span>
            <span className="ai-feature-label">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Hint level selector */}
      {activeFeature === "hint" && !loading && result && (
        <div className="hint-level-row">
          <span className="hint-level-text">
            Next hint: Level {Math.min(hintLevel, 3)} / 3
          </span>
          <button
            className="ai-feature-btn"
            onClick={() => runFeature("hint")}
            disabled={loading || hintLevel > 3}
          >
            {hintLevel > 3 ? "Max hints reached" : `Get Level ${hintLevel} Hint`}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="ai-loading">
          <div className="ai-spinner" />
          <span>AI is thinking...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="ai-error">{error}</div>
      )}

      {/* Test cases result */}
      {testCases.length > 0 && !loading && (
        <div className="ai-result">
          <h4>Generated Test Cases</h4>
          {testCases.map((tc, i) => (
            <div key={i} className="ai-testcase">
              <div className="ai-testcase-header">
                <strong>Test {i + 1}</strong>
                {tc.description && (
                  <span className="ai-testcase-desc">{tc.description}</span>
                )}
              </div>
              <div className="ai-testcase-row">
                <span>Input:</span>
                <pre>{tc.input}</pre>
              </div>
              <div className="ai-testcase-row">
                <span>Expected:</span>
                <pre>{tc.expectedOutput}</pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Text result */}
      {result && !loading && (
        <div className="ai-result">
          <MarkdownResult text={result} />
        </div>
      )}
    </div>
  );
};

// Simple markdown-ish renderer — handles bold, code blocks, numbered lists
const MarkdownResult = ({ text }) => {
  const lines = text.split("\n");

  return (
    <div className="ai-markdown">
      {lines.map((line, i) => {
        // Code block markers
        if (line.startsWith("```")) {
          return <div key={i} className="ai-code-fence" />;
        }

        // Bold headers like **Time Complexity:**
        if (line.startsWith("**") && line.includes("**")) {
          const parts = line.split("**").filter(Boolean);
          return (
            <p key={i} className="ai-bold-line">
              {parts.map((part, j) =>
                j % 2 === 0 ? (
                  <strong key={j}>{part}</strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          );
        }

        // Numbered list
        if (/^\d+\./.test(line)) {
          return (
            <p key={i} className="ai-list-item">
              {line}
            </p>
          );
        }

        // Empty line
        if (line.trim() === "") {
          return <br key={i} />;
        }

        return <p key={i} className="ai-text-line">{line}</p>;
      })}
    </div>
  );
};

export default AiPanel;