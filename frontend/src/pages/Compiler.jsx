import { useState } from "react";
import CodeEditor from "../components/compiler/CodeEditor";
import LanguageSelector from "../components/compiler/LanguageSelector";
import OutputPanel from "../components/compiler/OutputPanel";
import { runCode } from "../api/compilerApi";
import { DEFAULT_CODE } from "../constants/languages";

const Compiler = () => {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // When language changes, load that language's default starter code
  // (only if user hasn't started typing their own code)
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);
    setResult(null);
  };

  const handleRun = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await runCode({ language, code, input });
      setResult(res.data);
    } catch (err) {
      setResult({
        success: false,
        verdict: "Error",
        error: err.response?.data?.message || "Something went wrong while running your code",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compiler-page">
      <div className="compiler-header">
        <h2>Online Compiler</h2>
        <LanguageSelector language={language} onChange={handleLanguageChange} />
        <button onClick={handleRun} disabled={loading} className="run-button">
          {loading ? "Running..." : "Run ▶"}
        </button>
      </div>

      <div className="compiler-body">
        <div className="editor-section">
          <CodeEditor language={language} code={code} onChange={setCode} />
        </div>

        <div className="io-section">
          <div className="input-section">
            <label>Input (stdin)</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program here..."
              rows={6}
            />
          </div>

          <div className="output-section">
            <label>Output</label>
            <OutputPanel result={result} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compiler;