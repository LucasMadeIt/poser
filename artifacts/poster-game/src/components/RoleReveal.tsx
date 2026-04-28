import { useState, useEffect } from "react";

type Props = {
  role: "imposter" | "crewmate";
  onDismiss: () => void;
};

function CrewmateBlob() {
  return (
    <div style={{ position: "relative", width: 110, height: 130, margin: "0 auto" }}>
      <div style={{ width: 110, height: 110, background: "#3ECFCF", borderRadius: "55% 55% 48% 48%", position: "absolute", bottom: 0 }}>
        <div style={{ position: "absolute", top: "26%", left: "16%", width: 20, height: 26, background: "white", borderRadius: "50%" }}>
          <div style={{ position: "absolute", bottom: 4, right: 3, width: 10, height: 13, background: "#1a1a1a", borderRadius: "50%" }} />
        </div>
        <div style={{ position: "absolute", top: "26%", right: "16%", width: 20, height: 26, background: "white", borderRadius: "50%" }}>
          <div style={{ position: "absolute", bottom: 4, left: 3, width: 10, height: 13, background: "#1a1a1a", borderRadius: "50%" }} />
        </div>
        <div style={{ position: "absolute", bottom: "16%", left: "50%", transform: "translateX(-50%)", width: 38, height: 18, borderBottom: "4px solid #1a1a1a", borderLeft: "3px solid #1a1a1a", borderRight: "3px solid #1a1a1a", borderRadius: "0 0 20px 20px" }} />
      </div>
      <div style={{ position: "absolute", right: -18, top: 35, width: 22, height: 7, background: "#3ECFCF", borderRadius: 4, transform: "rotate(-35deg)" }}>
        <div style={{ position: "absolute", right: -2, top: -13, width: 11, height: 16, background: "#3ECFCF", borderRadius: "5px 5px 2px 2px" }} />
      </div>
      <div style={{ position: "absolute", left: -14, top: 45, width: 20, height: 7, background: "#3ECFCF", borderRadius: 4, transform: "rotate(20deg)" }} />
    </div>
  );
}

function ImposterBlob() {
  return (
    <div style={{ position: "relative", width: 110, height: 150, margin: "0 auto" }}>
      <div style={{ width: 110, height: 110, background: "#1a1a1a", borderRadius: "55% 55% 48% 48%", position: "absolute", top: 0, zIndex: 2 }}>
        <div style={{ position: "absolute", top: "24%", left: "14%", width: 20, height: 17, background: "#CC2200", borderRadius: "50%", transform: "rotate(-12deg)" }}>
          <div style={{ position: "absolute", bottom: 2, right: 4, width: 9, height: 10, background: "#600", borderRadius: "50%" }} />
        </div>
        <div style={{ position: "absolute", top: "24%", right: "14%", width: 20, height: 17, background: "#CC2200", borderRadius: "50%", transform: "rotate(12deg)" }}>
          <div style={{ position: "absolute", bottom: 2, left: 4, width: 9, height: 10, background: "#600", borderRadius: "50%" }} />
        </div>
        <div style={{ position: "absolute", bottom: "18%", left: "50%", transform: "translateX(-50%)", width: 36, height: 14, borderTop: "4px solid #CC2200", borderLeft: "3px solid #CC2200", borderRight: "3px solid #CC2200", borderRadius: "20px 20px 0 0" }} />
      </div>
      <div style={{ position: "absolute", top: 72, left: -12, right: -12, height: 65, background: "#0d0d0d", borderRadius: "0 0 28px 28px", zIndex: 1 }} />
      <div style={{ position: "absolute", top: 90, left: -20, width: 28, height: 44, background: "#0d0d0d", borderRadius: "0 0 8px 8px", transform: "rotate(18deg)", zIndex: 0 }} />
      <div style={{ position: "absolute", top: 90, right: -20, width: 28, height: 44, background: "#0d0d0d", borderRadius: "0 0 8px 8px", transform: "rotate(-18deg)", zIndex: 0 }} />
    </div>
  );
}

export function RoleReveal({ role, onDismiss }: Props) {
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const isImposter = role === "imposter";

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - start) / 4000) * 100));
    }, 50);
    const fadeTimer = setTimeout(() => setFading(true), 3600);
    const dismissTimer = setTimeout(() => onDismiss(), 4100);
    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const bg = isImposter
    ? "radial-gradient(ellipse at center, rgba(120,10,10,0.98) 0%, #0a0a0a 100%)"
    : "radial-gradient(ellipse at center, rgba(15,30,80,0.98) 0%, #0a0a0a 100%)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease",
      }}
    >
      {isImposter && (
        <>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: 4,
                  height: 4,
                  background: "#CC2200",
                  borderRadius: "50%",
                  animation: `float-${i % 4} ${2 + Math.random() * 3}s ease-in-out infinite`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
          `}</style>
        </>
      )}

      <div style={{ textAlign: "center", padding: "0 2rem", maxWidth: 600 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: isImposter ? "rgba(255,255,255,0.6)" : "rgba(200,220,255,0.7)", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
          {isImposter ? "YOU ARE THE" : "YOU ARE A"}
        </div>

        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(4rem, 10vw, 7rem)",
            color: isImposter ? "#CC2200" : "#ffffff",
            lineHeight: 1,
            marginBottom: "1rem",
            letterSpacing: "0.04em",
            textShadow: isImposter
              ? "0 0 40px rgba(204,34,0,0.8), 0 0 80px rgba(204,34,0,0.4)"
              : "0 0 40px rgba(62,207,207,0.6), 0 0 80px rgba(62,207,207,0.2)",
            animation: isImposter ? "shake 0.5s ease-in-out 0.3s" : "none",
          }}
        >
          {isImposter ? "IMPOSTER" : "CREWMATE"}
        </div>

        <div style={{ margin: "2rem 0" }}>
          {isImposter ? <ImposterBlob /> : <CrewmateBlob />}
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "1rem",
          color: "rgba(255,255,255,0.55)",
          maxWidth: 400,
          margin: "0 auto 2rem",
          lineHeight: 1.55,
        }}>
          {isImposter
            ? "Sabotage the UI without getting caught. You have the same tools as everyone — use them against the team."
            : "Work with your team to build the best UI. Find the imposter before all rounds are up."}
        </p>

        <div style={{ width: 200, height: 3, background: "rgba(255,255,255,0.1)", margin: "0 auto", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", background: isImposter ? "#CC2200" : "#3ECFCF", width: `${progress}%`, transition: "width 0.05s linear", borderRadius: 2 }} />
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "0.5rem" }}>
          Starting in {Math.max(0, Math.ceil(4 - progress / 25))}s
        </div>
      </div>
    </div>
  );
}
