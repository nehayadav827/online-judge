import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllContests } from "../api/contestApi";
import ContestStatusBadge from "../components/contest/ContestStatusBadge";

const TABS = ["All", "Live", "Upcoming", "Past"];

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const params = activeTab !== "All" ? { status: activeTab } : {};
        const res = await getAllContests(params);
        setContests(res.data.contests);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load contests");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [activeTab]);

  return (
    <div className="contests-page">
      <div className="page-header">
        <h2>Contests</h2>
        <p>Compete with others and climb the leaderboard</p>
      </div>

      <div className="contest-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`contest-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="placeholder">Loading contests...</div>
      ) : contests.length === 0 ? (
        <div className="placeholder">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div>No {activeTab !== "All" ? activeTab.toLowerCase() : ""} contests</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            Check back soon!
          </div>
        </div>
      ) : (
        <div className="contest-list">
          {contests.map((contest) => (
            <Link
              key={contest._id}
              to={`/contests/${contest.slug}`}
              className="contest-card"
            >
              <div className="contest-card-left">
                <div className="contest-card-header">
                  <h3 className="contest-card-title">{contest.title}</h3>
                  <ContestStatusBadge status={contest.status} />
                </div>

                {contest.description && (
                  <p className="contest-card-desc">{contest.description}</p>
                )}

                <div className="contest-card-meta">
                  <span>
                    🕐 {new Date(contest.startTime).toLocaleString()}
                  </span>
                  <span>
                    🏁 {new Date(contest.endTime).toLocaleString()}
                  </span>
                  <span>👥 {contest.participantCount} participants</span>
                  <span>📋 {contest.scoringMode}</span>
                </div>
              </div>

              <div className="contest-card-right">
                <span className="contest-arrow">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Contests;