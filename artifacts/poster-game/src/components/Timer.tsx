import { useState, useEffect } from "react";

type Props = {
  endTime: number;
  onExpired?: () => void;
};

export function Timer({ endTime, onExpired }: Props) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const update = () => {
      const r = Math.max(0, endTime - Date.now());
      setRemaining(r);
      if (r === 0) onExpired?.();
    };

    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [endTime, onExpired]);

  const seconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 15;

  return (
    <span
      style={{
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: "2.2rem",
        letterSpacing: "0.05em",
        color: isUrgent ? "#CC2200" : "#E8E2D9",
        transition: "color 0.3s",
        lineHeight: 1,
      }}
    >
      {minutes > 0 ? `${minutes}:${secs.toString().padStart(2, "0")}` : `${seconds}s`}
    </span>
  );
}
