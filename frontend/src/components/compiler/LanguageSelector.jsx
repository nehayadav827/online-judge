import { LANGUAGES } from "../../constants/languages";

const LanguageSelector = ({ language, onChange }) => {
  return (
    <select
      value={language}
      onChange={(e) => onChange(e.target.value)}
      className="language-selector"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;