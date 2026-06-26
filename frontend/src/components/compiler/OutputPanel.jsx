const VERDICT_COLORS = {
  Success: "#0F7B0F",
  "Compile Error": "#9B1C1C",
  "Runtime Error": "#9B1C1C",
  "Time Limit Exceeded": "#C05600",
  "Unsupported Language": "#9B1C1C",
  Error: "#9B1C1C",
};

const OutputPanel = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="output-panel">
        <p>Running code...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="output-panel">
        <p className="placeholder">Output will appear here after you run your code</p>
      </div>
    );
  }

  const verdictColor = VERDICT_COLORS[result.verdict] || "#888";

  return (
    <div className="output-panel">
      <div className="verdict" style={{ color: verdictColor }}>
        {result.verdict}
      </div>

      {result.success ? (
        <pre className="output-text">{result.output || "(no output)"}</pre>
      ) : (
        <pre className="output-text error-text">{result.error}</pre>
      )}
    </div>
  );
};

export default OutputPanel;