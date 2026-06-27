import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getContestBySlug,
  registerForContest,
  contestSubmit,
  getScoreboard,
  getMyContestSubmissions,
} from "../api/contestApi";
import { useAuthStore } from "../store/authStore";
import ContestTimer from "../components/contest/ContestTimer";
import ContestStatusBadge from "../components/contest/ContestStatusBadge";
import CodeEditor from "../components/compiler/CodeEditor";
import LanguageSelector from "../components/compiler/LanguageSelector";
import VerdictCard from "../components/compiler/VerdictCard";
import { DEFAULT_CODE } from "../constants/languages";

const TABS = ["Problems", "Scoreboard", "My Submissions"];

const ContestDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Problems");

  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState("");

  const [selectedProblem, setSelectedProblem] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const [scoreboard, setScoreboard] = useState([]);
  const [scoreLoading, setScoreLoading] = useState(false);

  const [mySubmissions, setMySubmissions] = useState([]);
  const [mySubLoading, setMySubLoading] = useState(false);

  const fetchContest = useCallback(async () => {
    try {
      const res = await getContestBySlug(slug);
      setContest(res.data.contest);
    } catch (err) {
      setError(err.response?.data?.message || "Contest not found");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchContest();
  }, [fetchContest]);

  const fetchScoreboard = async () => {
    setScoreLoading(true);
    try {
      const res = await getScoreboard(slug);
      setScoreboard(res.data.scoreboard);
    } catch {}
    finally { setScoreLoading(false); }
  };

  const fetchMySubmissions = async () => {
    setMySubLoading(true);
    try {
      const res = await getMyContestSubmissions(slug);
      setMySubmissions(res.data.submissions);
    } catch {}
    finally { setMySubLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "Scoreboard") fetchScoreboard();
    if (activeTab === "My Submissions" && user) fetchMySubmissions();
  }, [activeTab]);

  const handleRegister = async () => {
    if (!user) { navigate("/login"); return; }
    setRegistering(true);
    setRegisterMsg("");
    try {
      await registerForContest(slug);
      setRegisterMsg("Registered successfully!");
      fetchContest();
    } catch (err) {
      setRegisterMsg(err.response?.data?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setSubmitResult(null);
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/login"); return; }
    if (!selectedProblem) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await contestSubmit(slug, {
        problemSlug: selectedProblem.problemSlug,
        language,
        code,
      });
      setSubmitResult(res.data.submission);
      // Refresh scoreboard if on that tab
      if (activeTab === "Scoreboard") fetchScoreboard();
    } catch (err) {
      setSubmitResult({
        verdict: "Error",
        errorMessage: err.response?.data?.message || "Submission failed",
        testCasesPassed: 0,
        totalTestCases: 0,
        runtime: 0,
        language,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="placeholder">Loading contest...</div>;
  if (error) return (
    <div className="placeholder">
      <p className="error">{error}</p>
      <Link to="/contests" style={{ color: "var(--blue)", marginTop: 12, display: "block" }}>
        ← Back to Contests
      </Link>
    </div>
  );

  const hasStarted = new Date() >= new Date(contest.startTime);
  const hasEnded = new Date() > new Date(contest.endTime);

  return (
    <div className="contest-detail-page">
      {/* ── Header ── */}
      <div className="contest-detail-header">
        <div className="contest-detail-header-left">
          <Link to="/contests" className="back-link">← Contests</Link>
          <div className="contest-detail-title-row">
            <h2>{contest.title}</h2>
            <ContestStatusBadge status={contest.status} />
          </div>
          {contest.description && (
            <p className="contest-detail-desc">{contest.description}</p>
          )}
          <div className="contest-detail-meta">
            <span>📋 {contest.scoringMode} scoring</span>
            <span>👥 {contest.participantCount} participants</span>
            <span>
              🕐 {new Date(contest.startTime).toLocaleString()}
            </span>
            <span>
              🏁 {new Date(contest.endTime).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="contest-detail-header-right">
          <ContestTimer
            startTime={contest.startTime}
            endTime={contest.endTime}
            onEnd={fetchContest}
          />

          {!hasEnded && (
            contest.isRegistered ? (
              <div className="registered-badge">✓ Registered</div>
            ) : (
              <button
                className="register-btn"
                onClick={handleRegister}
                disabled={registering}
              >
                {registering ? "Registering..." : "Register"}
              </button>
            )
          )}

          {registerMsg && (
            <p style={{
              fontSize: 13,
              color: registerMsg.includes("success")
                ? "var(--green)" : "var(--red)"
            }}>
              {registerMsg}
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="contest-body">
        <div className="contest-sidebar">
          <div className="contest-sidebar-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`contest-sidebar-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Problems tab */}
          {activeTab === "Problems" && (
            <div className="contest-problems-list">
              {!hasStarted ? (
                <div className="placeholder" style={{ padding: 32 }}>
                  Problems will be revealed when the contest starts
                </div>
              ) : contest.problems.length === 0 ? (
                <div className="placeholder" style={{ padding: 32 }}>
                  No problems added yet
                </div>
              ) : (
                contest.problems
                  .sort((a, b) => a.order - b.order)
                  .map((p, idx) => (
                    <button
                      key={p.problemSlug}
                      className={`contest-problem-item ${
                        selectedProblem?.problemSlug === p.problemSlug ? "active" : ""
                      }`}
                      onClick={() => {
                        setSelectedProblem(p);
                        setSubmitResult(null);
                        setCode(DEFAULT_CODE[language]);
                      }}
                    >
                      <span className="cp-label">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="cp-info">
                        <span className="cp-title">{p.problemTitle}</span>
                        <span className="cp-points">{p.points} pts</span>
                      </div>
                    </button>
                  ))
              )}
            </div>
          )}

          {/* Scoreboard tab */}
          {activeTab === "Scoreboard" && (
            <div className="contest-scoreboard">
              {scoreLoading ? (
                <div className="placeholder" style={{ padding: 32 }}>
                  Loading scoreboard...
                </div>
              ) : scoreboard.length === 0 ? (
                <div className="placeholder" style={{ padding: 32 }}>
                  No submissions yet
                </div>
              ) : (
                <table className="scoreboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Score</th>
                      <th>Penalty</th>
                      <th>Solved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreboard.map((entry) => (
                      <tr
                        key={entry.userId}
                        className={
                          user && entry.userId === user.id
                            ? "scoreboard-me" : ""
                        }
                      >
                        <td>{entry.rank}</td>
                        <td>{entry.firstName} {entry.lastName}</td>
                        <td style={{ color: "var(--green)", fontWeight: 600 }}>
                          {entry.totalPoints}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {entry.totalPenalty}
                        </td>
                        <td>{entry.solvedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* My Submissions tab */}
          {activeTab === "My Submissions" && (
            <div className="contest-my-subs">
              {!user ? (
                <div className="placeholder" style={{ padding: 32 }}>
                  <Link to="/login" style={{ color: "var(--blue)" }}>
                    Login to view submissions
                  </Link>
                </div>
              ) : mySubLoading ? (
                <div className="placeholder" style={{ padding: 32 }}>
                  Loading...
                </div>
              ) : mySubmissions.length === 0 ? (
                <div className="placeholder" style={{ padding: 32 }}>
                  No submissions yet
                </div>
              ) : (
                <table className="submission-table">
                  <thead>
                    <tr>
                      <th>Problem</th>
                      <th>Verdict</th>
                      <th>Lang</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySubmissions.map((s) => (
                      <tr key={s._id}>
                        <td>{s.problemSlug}</td>
                        <td style={{
                          color: s.verdict === "Accepted"
                            ? "var(--green)" : "var(--red)",
                          fontWeight: 600,
                          fontSize: 12,
                        }}>
                          {s.verdict}
                        </td>
                        <td>{s.language}</td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {new Date(s.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* ── Editor panel ── */}
        <div className="contest-editor">
          {!selectedProblem ? (
            <div className="placeholder" style={{ height: "100%" }}>
              {hasStarted
                ? "Select a problem from the left to start coding"
                : "Contest hasn't started yet"}
            </div>
          ) : (
            <>
              <div className="contest-editor-header">
                <span className="contest-editor-title">
                  {selectedProblem.problemTitle}
                  <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                    · {selectedProblem.points} pts
                  </span>
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <LanguageSelector
                    language={language}
                    onChange={handleLanguageChange}
                  />
                  <button
                    className="submit-button"
                    onClick={handleSubmit}
                    disabled={submitting || hasEnded || !contest.isRegistered}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>

              {!contest.isRegistered && !hasEnded && (
                <div className="contest-register-prompt">
                  Register for the contest to submit solutions
                </div>
              )}

              {hasEnded && (
                <div className="contest-ended-banner">
                  Contest has ended. Submissions are closed.
                </div>
              )}

              {submitResult && (
                <VerdictCard submission={submitResult} />
              )}

              <div style={{ flex: 1, overflow: "hidden" }}>
                <CodeEditor
                  language={language}
                  code={code}
                  onChange={setCode}
                />
              </div>

              <div style={{ padding: "8px 14px", fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
                <Link
                  to={`/problems/${selectedProblem.problemSlug}`}
                  target="_blank"
                  style={{ color: "var(--blue)" }}
                >
                  View full problem statement ↗
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestDetail;