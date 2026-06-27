import { useState, useEffect } from "react";

const pad = (n) => String(n).padStart(2, "0");

const ContestTimer = ({ startTime, endTime, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (now < start) {
        const diff = start - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setLabel("Starts in");
        setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
      } else if (now < end) {
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setLabel("Time left");
        setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
        if (diff <= 1000 && onEnd) onEnd();
      } else {
        setLabel("Ended");
        setTimeLeft("00:00:00");
        if (onEnd) onEnd();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime, onEnd]);

  return (
    <div className="contest-timer">
      <span className="timer-label">{label}</span>
      <span className="timer-value">{timeLeft}</span>
    </div>
  );
};

export default ContestTimer;