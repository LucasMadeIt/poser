import { useState, useEffect } from "react";
import type { ImposterObjective } from "../types/game";

const BEBAS  = "'Bebas Neue', sans-serif";
const DM     = "'DM Sans', sans-serif";
const ORANGE = "#D4561A";
const NAVY   = "#1C3A60";

type Props = {
  objectives: ImposterObjective;
  onDismiss: () => void;
};

export function ImposterBriefing({ objectives, onDismiss }: Props) {
  const [phase, setPhase] = useState<"in" | "visible" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 50);
    const t2 = setTimeout(() => setPhase("out"),     4000);
    const t3 = setTimeout(() => onDismiss(),          4600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(6, 1, 0, 0.93)",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: phase === "in" ? 0 : phase === "out" ? 0 : 1,
      transition: "opacity 0.5s ease",
      backdropFilter: "blur(4px)",
    }}>
      {/* Noise texture */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:"160px", opacity:0.03, pointerEvents:"none" }} />

      <div style={{
        maxWidth: 480, width: "90%", textAlign: "center",
        transform: phase === "in" ? "translateY(16px) scale(0.96)" : "translateY(0) scale(1)",
        transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Eye icon */}
        <div style={{ fontSize: 48, marginBottom: "0.6rem", filter: `drop-shadow(0 0 20px ${ORANGE}88)` }}>🕵️</div>

        <div style={{ fontFamily: BEBAS, fontSize: "0.75rem", letterSpacing: "0.4em", color: `${ORANGE}99`, marginBottom: "0.3rem" }}>
          YOUR MISSION THIS ROUND
        </div>
        <div style={{
          fontFamily: BEBAS, fontSize: "clamp(2.4rem, 7vw, 3.2rem)", letterSpacing: "0.05em",
          color: ORANGE, lineHeight: 1,
          textShadow: `0 0 40px ${ORANGE}66, 0 0 80px ${ORANGE}33`,
          marginBottom: "1.5rem",
        }}>
          SABOTAGE THE DESIGN
        </div>

        <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center" }}>
          {/* Style card */}
          <div style={{
            flex: 1, background: "rgba(212,86,26,0.10)", border: `2px solid ${ORANGE}55`,
            padding: "1rem 1.1rem", textAlign: "left",
          }}>
            <div style={{ fontFamily: BEBAS, fontSize: "0.6rem", letterSpacing: "0.3em", color: `${ORANGE}88`, marginBottom: "0.4rem" }}>
              SABOTAGE STYLE
            </div>
            <div style={{ fontFamily: BEBAS, fontSize: "1.1rem", color: ORANGE, letterSpacing: "0.06em", lineHeight: 1.1, marginBottom: "0.4rem" }}>
              {objectives.styleName}
            </div>
            <div style={{ fontFamily: DM, fontSize: "0.78rem", color: "rgba(237,229,204,0.7)", lineHeight: 1.5 }}>
              {objectives.style}
            </div>
          </div>

          {/* Objective card */}
          <div style={{
            flex: 1, background: "rgba(28,58,96,0.30)", border: `2px solid ${NAVY}88`,
            padding: "1rem 1.1rem", textAlign: "left",
          }}>
            <div style={{ fontFamily: BEBAS, fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(180,200,230,0.6)", marginBottom: "0.4rem" }}>
              HIDDEN OBJECTIVE
            </div>
            <div style={{ fontFamily: BEBAS, fontSize: "1.1rem", color: "#8AB8E8", letterSpacing: "0.06em", lineHeight: 1.1, marginBottom: "0.4rem" }}>
              {objectives.objectiveName}
            </div>
            <div style={{ fontFamily: DM, fontSize: "0.78rem", color: "rgba(237,229,204,0.7)", lineHeight: 1.5 }}>
              {objectives.objective}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: "1.2rem", fontFamily: BEBAS, fontSize: "0.65rem",
          letterSpacing: "0.22em", color: "rgba(237,229,204,0.3)",
          animation: "ib-blink 1.1s ease-in-out infinite",
        }}>
          BLEND IN — STARTING NOW
        </div>
      </div>

      <style>{`
        @keyframes ib-blink {
          0%,100% { opacity:0.3; }
          50%      { opacity:0.7; }
        }
      `}</style>
    </div>
  );
}
