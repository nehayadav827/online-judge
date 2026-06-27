import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyDashboard } from "../api/dashboardApi";
import { useAuthStore } from "../store/authStore";

const VERDICT_COLORS = {
  Accepted: "#0F7B0F",
  "Wrong Answer": "#9B1C1C",
  "Time Limit Exceeded": "#C05600",
  "Runtime Error": "#9B1C1C",
  "Compile Error": "#6B21A8",
};

const DIFFICULTY_COLORS = {
  Easy: "#0F7B0F",
  Medium: "#C05600",
  Hard: "#9B1C1C",
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyDashboard();
        setData(res.data.dashboard);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p className="placeholder" style={{ padding: 32 }}>Loading dashboard...</p>;
  if (error) return <p className="error" style={{ padding: 32 }}>{error}</p>;

  return (
    <div className="dashboard-page">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {user?.firstName}!</h2>
          <p className="dashboard-subtitle">{user?.email}</p>
        </div>
        <Link to="/problems" className="browse-btn">Browse Problems →</Link>
      </div>

      {/* ── Top Stats ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{data.totalSolved}</div>
          <div className="stat-label">Problems Solved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{data.totalSubmissions}</div>
          <div className="stat-label">Total Submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#0F7B0F" }}>
            {data.verdictCount.Accepted}
          </div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#9B1C1C" }}>
            {data.verdictCount["Wrong Answer"]}
          </div>
          <div className="stat-label">Wrong Answers</div>
        </div>
      </div>

      <div className="dashboard-grid">

        {/* ── Difficulty Breakdown ── */}
        <div className="dash-card">
          <h3>Solved by Difficulty</h3>
          <div className="difficulty-bars">
            {Object.entries(data.difficultyBreakdown).map(([diff, count]) => (
              <div key={diff} className="diff-row">
                <span
                  className="diff-label"
                  style={{ color: DIFFICULTY_COLORS[diff] }}
                >
                  {diff}
                </span>
                <div className="diff-bar-bg">
                  <div
                    className="diff-bar-fill"
                    style={{
                      width: `${data.totalSolved > 0 ? (count / data.totalSolved) * 100 : 0}%`,
                      background: DIFFICULTY_COLORS[diff],
                    }}
                  />
                </div>
                <span className="diff-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Language Usage ── */}
        <div className="dash-card">
          <h3>Language Usage</h3>
          <div className="language-list">
            {Object.entries(data.languageCount).length === 0 ? (
              <p className="placeholder">No submissions yet</p>
            ) : (
              Object.entries(data.languageCount)
                .sort((a, b) => b[1] - a[1])
                .map(([lang, count]) => (
                  <div key={lang} className="lang-row">
                    <span className="lang-name">{lang}</span>
                    <div className="diff-bar-bg">
                      <div
                        className="diff-bar-fill"
                        style={{
                          width: `${(count / data.totalSubmissions) * 100}%`,
                          background: "#2e75b6",
                        }}
                      />
                    </div>
                    <span className="diff-count">{count}</span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* ── Verdict Breakdown ── */}
        <div className="dash-card">
          <h3>Verdict Breakdown</h3>
          <div className="verdict-list">
            {Object.entries(data.verdictCount).map(([verdict, count]) => (
              <div key={verdict} className="verdict-row">
                <span
                  className="verdict-dot"
                  style={{ background: VERDICT_COLORS[verdict] }}
                />
                <span className="verdict-name">{verdict}</span>
                <span className="verdict-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Activity (last 30 days) ── */}
        <div className="dash-card">
          <h3>Activity — Last 30 Days</h3>
          <ActivityHeatmap data={data.recentActivity} />
        </div>

        {/* ── Recent Submissions ── */}
        <div className="dash-card dash-card-wide">
          <h3>Recent Submissions</h3>
          {data.recentSubmissions.length === 0 ? (
            <p className="placeholder">No submissions yet. <Link to="/problems">Start solving!</Link></p>
          ) : (
            <table className="submission-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Verdict</th>
                  <th>Language</th>
                  <th>Passed</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <Link
                        to={`/problems/${s.problemSlug}`}
                        style={{ color: "#5a9fd4" }}
                      >
                        {s.problemSlug}
                      </Link>
                    </td>
                    <td style={{ color: VERDICT_COLORS[s.verdict], fontWeight: 600 }}>
                      {s.verdict}
                    </td>
                    <td>{s.language}</td>
                    <td>{s.testCasesPassed}/{s.totalTestCases}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Solved Problems ── */}
        <div className="dash-card dash-card-wide">
          <h3>Solved Problems ({data.solvedProblems.length})</h3>
          {data.solvedProblems.length === 0 ? (
            <p className="placeholder">No problems solved yet.</p>
          ) : (
            <div className="solved-list">
              {data.solvedProblems.map((p) => (
                <Link
                  key={p._id}
                  to={`/problems/${p.slug}`}
                  className="solved-problem-tag"
                  style={{ borderColor: DIFFICULTY_COLORS[p.difficulty] }}
                >
                  <span>{p.title}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: DIFFICULTY_COLORS[p.difficulty],
                    }}
                  >
                    {p.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// Simple activity heatmap — shows submission count per day
const ActivityHeatmap = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="placeholder">No activity in the last 30 days</p>;
  }

  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className="heatmap">
      {data.map((d) => {
        const intensity = max > 0 ? d.count / max : 0;
        const bg = intensity === 0
          ? "#2a2a2a"
          : `rgba(46, 117, 182, ${0.3 + intensity * 0.7})`;

        return (
          <div
            key={d._id}
            className="heatmap-cell"
            style={{ background: bg }}
            title={`${d._id}: ${d.count} submission${d.count > 1 ? "s" : ""}`}
          />
        );
      })}
    </div>
  );
};

export default Dashboard;