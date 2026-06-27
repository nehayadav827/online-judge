const STATUS_STYLES = {
  Live: { color: "#4caf76", bg: "rgba(76,175,118,0.12)", dot: "#4caf76" },
  Upcoming: { color: "#4a9eff", bg: "rgba(74,158,255,0.12)", dot: "#4a9eff" },
  Past: { color: "#606060", bg: "rgba(96,96,96,0.12)", dot: "#606060" },
};

const ContestStatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Past;

  return (
    <span
      className="contest-status-badge"
      style={{ color: style.color, background: style.bg }}
    >
      {status === "Live" && (
        <span
          className="status-dot"
          style={{ background: style.dot }}
        />
      )}
      {status}
    </span>
  );
};

export default ContestStatusBadge;