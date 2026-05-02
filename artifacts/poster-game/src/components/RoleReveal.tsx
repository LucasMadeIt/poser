import { useState, useEffect } from "react";

const BEBAS = "'Bebas Neue', sans-serif";
const DM = "'DM Sans', sans-serif";

type Props = {
  role: "imposter" | "crewmate";
  onDismiss: () => void;
};

function GrainOverlay() {
  return (
    <div style={{
      position:"absolute", inset:0, pointerEvents:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize:"160px", opacity:0.07, mixBlendMode:"overlay", zIndex:1,
    }} />
  );
}

function CrewmateIcon() {
  return (
    <div style={{ position:"relative", width:100, height:120, margin:"0 auto" }}>
      {/* body */}
      <div style={{ width:100, height:100, background:"#3ECFCF", borderRadius:"50% 50% 44% 44%", position:"absolute", bottom:0, boxShadow:"0 0 28px rgba(62,207,207,0.45)" }}>
        {/* eyes */}
        <div style={{ position:"absolute", top:"24%", left:"15%", width:20, height:26, background:"white", borderRadius:"50%" }}>
          <div style={{ position:"absolute", bottom:4, right:3, width:10, height:13, background:"#1a1a1a", borderRadius:"50%" }} />
        </div>
        <div style={{ position:"absolute", top:"24%", right:"15%", width:20, height:26, background:"white", borderRadius:"50%" }}>
          <div style={{ position:"absolute", bottom:4, left:3, width:10, height:13, background:"#1a1a1a", borderRadius:"50%" }} />
        </div>
        {/* smile */}
        <div style={{ position:"absolute", bottom:"16%", left:"50%", transform:"translateX(-50%)", width:36, height:16, borderBottom:"4px solid #1a1a1a", borderLeft:"3px solid #1a1a1a", borderRight:"3px solid #1a1a1a", borderRadius:"0 0 20px 20px" }} />
      </div>
      {/* arm */}
      <div style={{ position:"absolute", right:-16, top:33, width:20, height:7, background:"#3ECFCF", borderRadius:4, transform:"rotate(-32deg)" }}>
        <div style={{ position:"absolute", right:-2, top:-12, width:10, height:15, background:"#3ECFCF", borderRadius:"4px 4px 2px 2px" }} />
      </div>
      <div style={{ position:"absolute", left:-13, top:42, width:18, height:7, background:"#3ECFCF", borderRadius:4, transform:"rotate(18deg)" }} />
    </div>
  );
}

function ImposterIcon() {
  return (
    <div style={{ position:"relative", width:100, height:145, margin:"0 auto" }}>
      {/* head */}
      <div style={{ width:100, height:100, background:"#1a1410", borderRadius:"50% 50% 44% 44%", position:"absolute", top:0, zIndex:2, boxShadow:"0 0 28px rgba(204,34,0,0.35)" }}>
        {/* evil eyes */}
        <div style={{ position:"absolute", top:"22%", left:"13%", width:20, height:16, background:"#CC2200", borderRadius:"50%", transform:"rotate(-12deg)", boxShadow:"0 0 8px rgba(204,34,0,0.8)" }}>
          <div style={{ position:"absolute", bottom:2, right:3, width:9, height:10, background:"#600", borderRadius:"50%" }} />
        </div>
        <div style={{ position:"absolute", top:"22%", right:"13%", width:20, height:16, background:"#CC2200", borderRadius:"50%", transform:"rotate(12deg)", boxShadow:"0 0 8px rgba(204,34,0,0.8)" }}>
          <div style={{ position:"absolute", bottom:2, left:3, width:9, height:10, background:"#600", borderRadius:"50%" }} />
        </div>
        {/* frown */}
        <div style={{ position:"absolute", bottom:"17%", left:"50%", transform:"translateX(-50%)", width:34, height:13, borderTop:"4px solid #CC2200", borderLeft:"3px solid #CC2200", borderRight:"3px solid #CC2200", borderRadius:"20px 20px 0 0" }} />
      </div>
      {/* torso + legs */}
      <div style={{ position:"absolute", top:68, left:-10, right:-10, height:62, background:"#0d0c0a", borderRadius:"0 0 26px 26px", zIndex:1 }} />
      <div style={{ position:"absolute", top:88, left:-18, width:26, height:42, background:"#0d0c0a", borderRadius:"0 0 7px 7px", transform:"rotate(17deg)", zIndex:0 }} />
      <div style={{ position:"absolute", top:88, right:-18, width:26, height:42, background:"#0d0c0a", borderRadius:"0 0 7px 7px", transform:"rotate(-17deg)", zIndex:0 }} />
    </div>
  );
}

export function RoleReveal({ role, onDismiss }: Props) {
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const isImposter = role === "imposter";

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => setProgress(Math.min(100, ((Date.now() - start) / 4200) * 100)), 50);
    const fadeTimer = setTimeout(() => setFading(true), 3700);
    const dismissTimer = setTimeout(() => onDismiss(), 4300);
    return () => { clearInterval(interval); clearTimeout(fadeTimer); clearTimeout(dismissTimer); };
  }, [onDismiss]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background: isImposter
        ? "radial-gradient(ellipse at center, #1A0400 0%, #0A0806 60%, #050302 100%)"
        : "radial-gradient(ellipse at center, #0A1428 0%, #060C18 60%, #020408 100%)",
      opacity: fading ? 0 : 1,
      transition:"opacity 0.55s ease",
      overflow:"hidden",
    }}>
      <GrainOverlay />

      {/* Wall texture patches behind */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        {isImposter ? (
          <>
            <div style={{ position:"absolute", top:"-20%", left:"-15%", width:"60%", height:"70%", background:"#3A0A00", opacity:0.18, transform:"rotate(-5deg)" }} />
            <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:"50%", height:"60%", background:"#200600", opacity:0.22, transform:"rotate(4deg)" }} />
          </>
        ) : (
          <>
            <div style={{ position:"absolute", top:"-20%", left:"-15%", width:"60%", height:"70%", background:"#001030", opacity:0.18, transform:"rotate(-5deg)" }} />
            <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:"50%", height:"60%", background:"#00082A", opacity:0.22, transform:"rotate(4deg)" }} />
          </>
        )}

        {/* Floating particles for imposter */}
        {isImposter && Array.from({ length:18 }).map((_, i) => (
          <div key={i} style={{
            position:"absolute",
            left:`${10 + (i * 47) % 80}%`,
            top:`${5 + (i * 31) % 90}%`,
            width: i % 3 === 0 ? 6 : 4,
            height: i % 3 === 0 ? 6 : 4,
            background:"#CC2200",
            borderRadius:"50%",
            animation:`float-particle ${2.5 + (i % 5) * 0.6}s ease-in-out infinite`,
            animationDelay:`${(i * 0.27) % 2}s`,
            opacity:0.5 + (i % 3) * 0.15,
            boxShadow:"0 0 6px rgba(204,34,0,0.8)",
          }} />
        ))}

        {/* Scribble lines */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.06 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <path d="M60 100 Q200 70 320 140 Q440 210 560 110" stroke="#E8E2D9" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M900 750 Q1040 710 1160 780 Q1280 850 1400 760" stroke="#E8E2D9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M100 800 Q250 760 300 830" stroke="#E8E2D9" strokeWidth="2" fill="none"/>
          <circle cx="80" cy="200" r="35" stroke="#E8E2D9" strokeWidth="2" fill="none" strokeDasharray="7 9"/>
          <circle cx="1380" cy="700" r="28" stroke="#E8E2D9" strokeWidth="2" fill="none" strokeDasharray="5 8"/>
        </svg>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ textAlign:"center", padding:"0 2rem", maxWidth:560, position:"relative", zIndex:10 }}>

        {/* PRE-TITLE */}
        <div style={{ fontFamily:BEBAS, fontSize:"1.1rem", letterSpacing:"0.35em", color: isImposter ? "rgba(204,34,0,0.7)" : "rgba(62,207,207,0.7)", marginBottom:"0.6rem" }}>
          {isImposter ? "YOU ARE THE" : "YOU ARE A"}
        </div>

        {/* MAIN TITLE — stencil/stamp style */}
        <div style={{
          fontFamily:BEBAS,
          fontSize:"clamp(4.5rem, 11vw, 7.5rem)",
          lineHeight:1,
          marginBottom:"0.25rem",
          letterSpacing:"0.06em",
          color: isImposter ? "#CC2200" : "#EDE5CC",
          textShadow: isImposter
            ? "0 0 50px rgba(204,34,0,0.9), 0 0 100px rgba(204,34,0,0.5), 4px 4px 0 rgba(0,0,0,0.8)"
            : "0 0 50px rgba(62,207,207,0.6), 0 0 100px rgba(62,207,207,0.25), 4px 4px 0 rgba(0,0,0,0.8)",
          animation: isImposter ? "imposter-shake 0.55s ease-in-out 0.25s both" : "stamp-in 0.4s ease-out both",
          position:"relative",
        }}>
          {isImposter ? "IMPOSTER" : "CREWMATE"}
          {/* Distress/scratch lines over text */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 5px)",
            mixBlendMode:"multiply",
          }} />
        </div>

        {/* Stamp underline */}
        <div style={{ height:4, background: isImposter ? "#CC2200" : "#3ECFCF", margin:"0.5rem auto 1.75rem", width:"70%", opacity:0.7, boxShadow: isImposter ? "0 0 12px rgba(204,34,0,0.8)" : "0 0 12px rgba(62,207,207,0.6)" }} />

        {/* Character */}
        <div style={{ margin:"0 auto 1.75rem", animation:"float-slow 3s ease-in-out infinite" }}>
          {isImposter ? <ImposterIcon /> : <CrewmateIcon />}
        </div>

        {/* Description on a paper card */}
        <div style={{
          background: isImposter ? "rgba(26,4,0,0.7)" : "rgba(0,10,28,0.7)",
          border: isImposter ? "1px solid rgba(204,34,0,0.25)" : "1px solid rgba(62,207,207,0.2)",
          padding:"0.9rem 1.4rem",
          marginBottom:"1.75rem",
          backdropFilter:"blur(4px)",
        }}>
          <p style={{ fontFamily:DM, fontSize:"0.9rem", color:"rgba(237,229,204,0.65)", margin:0, lineHeight:1.6 }}>
            {isImposter
              ? "Sabotage the UI without getting caught. You have the same tools as everyone — use them against the team."
              : "Work with your team to build the best UI. Catch the imposter before all rounds are up."}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ width:180, height:4, background:"rgba(237,229,204,0.1)", margin:"0 auto 0.5rem", overflow:"hidden" }}>
          <div style={{ height:"100%", background: isImposter ? "#CC2200" : "#3ECFCF", width:`${progress}%`, transition:"width 0.05s linear", boxShadow: isImposter ? "0 0 8px rgba(204,34,0,0.8)" : "0 0 8px rgba(62,207,207,0.7)" }} />
        </div>
        <div style={{ fontFamily:DM, fontSize:"0.72rem", color:"rgba(237,229,204,0.28)" }}>
          Starting in {Math.max(0, Math.ceil(4 - progress / 25))}s
        </div>
      </div>

      <style>{`
        @keyframes imposter-shake {
          0%   { transform: scale(0.7) rotate(-2deg); opacity:0; }
          40%  { transform: scale(1.08) rotate(1.5deg); opacity:1; }
          60%  { transform: scale(0.97) rotate(-0.8deg); }
          80%  { transform: scale(1.03) rotate(0.5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes stamp-in {
          0%   { transform: scale(1.4); opacity:0; }
          60%  { transform: scale(0.96); opacity:1; }
          80%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity:0.5; }
          50%       { transform: translateY(-18px) scale(1.2); opacity:0.9; }
        }
      `}</style>
    </div>
  );
}
