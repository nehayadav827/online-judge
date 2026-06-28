import { DIFFICULTY_COLORS } from "../../constants/difficulty";
import DOMPurify from "dompurify";

const ProblemStatement = ({ problem }) => {
  return (
    <div className="problem-statement">
      <div className="problem-statement-header">
        <h2>{problem.title}</h2>
        <span
          className="difficulty-badge"
          style={{ color: DIFFICULTY_COLORS[problem.difficulty] }}
        >
          {problem.difficulty}
        </span>
      </div>

      <div className="problem-tags">
        {problem.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="problem-section">
        {/* statement may contain line breaks — preserve them */}
        <SafeText text={problem.statement} />
      </div>

      {problem.constraints && (
        <div className="problem-section">
          <h4>Constraints</h4>
          <pre className="constraints-text">{problem.constraints}</pre>
        </div>
      )}

      {problem.examples?.length > 0 && (
        <div className="problem-section">
          <h4>Examples</h4>
          {problem.examples.map((example, idx) => (
            <div key={idx} className="example-block">
              <div className="example-row">
                <strong>Input:</strong>
                <pre>{example.input}</pre>
              </div>
              <div className="example-row">
                <strong>Output:</strong>
                <pre>{example.output}</pre>
              </div>
              {example.explanation && (
                <div className="example-row">
                  <strong>Explanation:</strong>
                  <p>{example.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="problem-limits">
        <span>Time Limit: {problem.timeLimit}s</span>
        <span>Memory Limit: {problem.memoryLimit}MB</span>
      </div>
    </div>
  );
};

// For the statement text, sanitize before rendering
const SafeText = ({ text }) => {
  // Strip any HTML tags — problem statements are plain text
  const clean = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  return <p className="statement-text">{clean}</p>;
};

export default ProblemStatement;