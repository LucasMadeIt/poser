import { useState, useEffect } from "react";

const BEBAS   = "'Bebas Neue', sans-serif";
const DM      = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const MUSTARD = "#C8A028";

const CONSTRAINT_INFO: Record<string, { icon: string; name: string; desc: string; color: string }> = {
  "colorblind-rg": {
    icon: "👁️",
    name: "Colorblind Mode",
    desc: "You see as a protanope this round. Red and green look similar. Design carefully with limited colour perception.",
    color: ORANGE,
  },
  "colorblind-by": {
    icon: "👁️",
    name: "Colorblind Mode",
    desc: "You see as a tritanope this round. Blue and yellow look similar. Design carefully with limited colour perception.",
    color: "#6A4AD4",
  },
  "no-undo": {
    icon: "🚫",
    name: "No Undo!",
    desc: "Ctrl+Z is disabled for you this round. Every move is permanent — think carefully before you click.",
    color: "#C03020",
  },
  "one-font": {
    icon: "🔤",
    name: "One Font Only",
    desc: "Stick to a single text style this round. No mixing font sizes or weights allowed.",
    color: MUSTARD,
  },
};

type Props = {
  constraintType: string;
  onDismiss: () => void;
};

export function ChallengeOverlay({ constraintType, onDismiss }: Props) {
  const [phase, setPhase] = useState<"in" | "visible" | "out">("in");
  const info = CONSTRAINT_INFO[constraintType] ?? {
    icon: "⚠️", name: "Challenge Active", desc: "You have a special constraint this round.", color: MUSTARD,
  };

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 50);
    const t2 = setTimeout(() => setPhase("out"),     3800);
    const t3 = setTimeout(() => onDismiss(),          4400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9997,
      background: "rgba(10, 6, 0, 0.90)",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: phase === "in" ? 0 : phase === "out" ? 0 : 1,
      transition: "opacity 0.45s ease",
      backdropFilter: "blur(3px)",
    }}>
      <div style={{
        maxWidth: 440, width: "90%", textAlign: "center",
        transform: phase === "in" ? "scale(0.92) translateY(12px)" : "scale(1) translateY(0)",
        transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Warning tape strip */}
        <div style={{
          height: 24, background: `repeating-linear-gradient(90deg, ${info.color}DD, ${info.color}FF 12px, #1a1a1a 12px, #1a1a1a 24px)`,
          marginBottom: "1.4rem",
          boxShadow: `0 0 30px ${info.color}55`,
        }} />

        <div style={{ fontSize: 52, marginBottom: "0.6rem" }}>{info.icon}</div>

        <div style={{ fontFamily: BEBAS, fontSize: "0.72rem", letterSpacing: "0.4em", color: `${info.color}99`, marginBottom: "0.25rem" }}>
          ⚠️ CHALLENGE ACTIVE
        </div>

        <div style={{
          fontFamily: BEBAS, fontSize: "clamp(2rem, 6vw, 2.8rem)", letterSpacing: "0.04em",
          color: info.color, lineHeight: 1, marginBottom: "1.2rem",
          textShadow: `0 0 40px ${info.color}55`,
        }}>
          {info.name}
        </div>

        <div style={{
          background: `${info.color}14`, border: `2px solid ${info.color}44`,
          padding: "1rem 1.4rem",
        }}>
          <div style={{ fontFamily: DM, fontSize: "0.9rem", color: "rgba(237,229,204,0.82)", lineHeight: 1.65 }}>
            {info.desc}
          </div>
        </div>

        <div style={{ marginTop: "1rem", fontFamily: BEBAS, fontSize: "0.6rem", letterSpacing: "0.22em", color: "rgba(237,229,204,0.25)" }}>
          ONLY YOU SEE THIS
        </div>

        {/* Warning tape strip bottom */}
        <div style={{
          height: 24, marginTop: "1.4rem",
          background: `repeating-linear-gradient(90deg, ${info.color}DD, ${info.color}FF 12px, #1a1a1a 12px, #1a1a1a 24px)`,
          boxShadow: `0 0 30px ${info.color}55`,
        }} />
      </div>
    </div>
  );
}
