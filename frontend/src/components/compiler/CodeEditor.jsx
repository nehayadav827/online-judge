import Editor from "@monaco-editor/react";
import { LANGUAGES } from "../../constants/languages";

const CodeEditor = ({ language, code, onChange }) => {
  const monacoLang =
    LANGUAGES.find((l) => l.id === language)?.monacoLang || "plaintext";

  return (
    <Editor
      height="500px"
      language={monacoLang}
      value={code}
      onChange={(value) => onChange(value ?? "")}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
      }}
    />
  );
};

export default CodeEditor;