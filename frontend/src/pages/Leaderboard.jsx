import { useEffect, useState } from "react";
import { getLeaderboard } from "../api/dashboardApi";
import { useAuthStore } from "../store/authStore";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

const Leaderboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getLeaderboard(50);
        setData(res.data.leaderboard);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p className="placeholder" style={{ padding: 32 }}>Loading leaderboard...</p>;
  if (error) return <p className="error" style={{ padding: 32 }}>{error}</p>;

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h2>🏆 Global Leaderboard</h2>
        <p className="dashboard-subtitle">Ranked by number of problems solved</p>
      </div>

      {/* ── Top 3 podium ── */}
      {data.length >= 3 && (
        <div className="podium">
          {/* 2nd place */}
          <div className="podium-item podium-second">
            <div className="podium-medal">🥈</div>
            <div className="podium-name">
              {data[1].firstName} {data[1].lastName}
            </div>
            <div className="podium-score">{data[1].totalSolved} solved</div>
            <div className="podium-bar podium-bar-2" />
          </div>

          {/* 1st place */}
          <div className="podium-item podium-first">
            <div className="podium-medal">🥇</div>
            <div className="podium-name">
              {data[0].firstName} {data[0].lastName}
            </div>
            <div className="podium-score">{data[0].totalSolved} solved</div>
            <div className="podium-bar podium-bar-1" />
          </div>

          {/* 3rd place */}
          <div className="podium-item podium-third">
            <div className="podium-medal">🥉</div>
            <div className="podium-name">
              {data[2].firstName} {data[2].lastName}
            </div>
            <div className="podium-score">{data[2].totalSolved} solved</div>
            <div className="podium-bar podium-bar-3" />
          </div>
        </div>
      )}

      {/* ── Full table ── */}
      <div className="leaderboard-table-wrap">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Problems Solved</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => {
              const isMe = user && entry.email === user.email;
              return (
                <tr
                  key={entry.userId}
                  className={isMe ? "leaderboard-me" : ""}
                >
                  <td className="rank-cell">
                    {MEDAL[entry.rank] || `#${entry.rank}`}
                  </td>
                  <td>
                    <div className="lb-name">
                      {entry.firstName} {entry.lastName}
                      {isMe && <span className="you-badge">You</span>}
                    </div>
                  </td>
                  <td>
                    <div className="lb-score-row">
                      <div className="lb-score-bar-bg">
                        <div
                          className="lb-score-bar-fill"
                          style={{
                            width: `${data[0]?.totalSolved > 0
                              ? (entry.totalSolved / data[0].totalSolved) * 100
                              : 0}%`,
                          }}
                        />
                      </div>
                      <span className="lb-score-num">{entry.totalSolved}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;