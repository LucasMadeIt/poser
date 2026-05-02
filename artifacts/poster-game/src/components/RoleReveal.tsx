import { useState, useEffect } from "react";
import { PlayerAvatar } from "./PlayerAvatar";

const BEBAS = "'Bebas Neue', sans-serif";
const DM    = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";

type Props = {
  role: "imposter" | "crewmate";
  onDismiss: () => void;
  myPlayerId?: string;
  myPlayerColor?: string;
};

/* ── The colourful poster that falls off the wall ─────────────────────────── */
function FallingPoster({ role }: { role: "imposter" | "crewmate" }) {
  const blocks = [
    { x:0, y:0, w:"50%", h:"40%", bg:ORANGE },
    { x:50, y:0, w:"50%", h:"40%", bg:TEAL },
    { x:0, y:40, w:"35%", h:"35%", bg:MUSTARD },
    { x:35, y:40, w:"40%", h:"35%", bg:NAVY },
    { x:75, y:40, w:"25%", h:"35%", bg:"#9B59B6" },
    { x:0, y:75, w:"60%", h:"25%", bg:"#1A5A30" },
    { x:60, y:75, w:"40%", h:"25%", bg:"#8B1A10" },
  ];

  return (
    <div style={{ position:"relative", width:520, height:600, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.5), 8px 12px 0 rgba(0,0,0,0.3)" }}>
      {/* Colour blocks */}
      {blocks.map((b,i) => (
        <div key={i} style={{ position:"absolute", left:b.x+"%", top:b.y+"%", width:b.w, height:b.h, background:b.bg }} />
      ))}

      {/* Ripped paper scraps */}
      {[
        { l:"10%", t:"15%", r:"-8deg", bg:"rgba(255,255,255,0.82)", w:160, h:90 },
        { l:"55%", t:"42%", r:"6deg",  bg:"rgba(255,255,255,0.78)", w:130, h:70 },
        { l:"5%",  t:"60%", r:"-4deg", bg:"rgba(255,255,255,0.70)", w:200, h:55 },
      ].map((p,i)=>(
        <div key={i} style={{ position:"absolute", left:p.l, top:p.t, width:p.w, height:p.h, background:p.bg, transform:`rotate(${p.r})`, clipPath:"polygon(0 0, 98% 3%, 100% 94%, 2% 100%)" }} />
      ))}

      {/* Big graffiti text */}
      <div style={{ position:"absolute", top:"8%", left:0, right:0, textAlign:"center", fontFamily:BEBAS, fontSize:"5.5rem", color:"rgba(255,255,255,0.92)", letterSpacing:"0.08em", lineHeight:1, textShadow:"4px 4px 0 rgba(0,0,0,0.35)" }}>
        POSTER
      </div>
      <div style={{ position:"absolute", top:"36%", left:"8%", fontFamily:BEBAS, fontSize:"2.2rem", color:"rgba(255,255,255,0.7)", transform:"rotate(-8deg)", letterSpacing:"0.2em", textShadow:"2px 2px 0 rgba(0,0,0,0.4)" }}>
        DESIGN
      </div>
      <div style={{ position:"absolute", top:"55%", right:"6%", fontFamily:BEBAS, fontSize:"1.6rem", color:"rgba(255,255,255,0.65)", transform:"rotate(5deg)", letterSpacing:"0.15em" }}>
        WHO DID IT?
      </div>

      {/* SVG doodles */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} viewBox="0 0 520 600">
        <circle cx="420" cy="80"  r="45" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none" strokeDasharray="10 14"/>
        <circle cx="80"  cy="500" r="38" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeDasharray="8 12"/>
        <path d="M60 200 Q180 160 280 220 Q380 280 480 200" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M30 350 Q130 310 200 380" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* star burst */}
        {Array.from({length:8}).map((_,i)=>{
          const a=(i/8)*Math.PI*2;
          return <line key={i} x1={440} y1={420} x2={440+Math.cos(a)*28} y2={420+Math.sin(a)*28} stroke="rgba(255,255,255,0.4)" strokeWidth="2" />;
        })}
        <circle cx="440" cy="420" r="8" fill="rgba(255,255,255,0.55)" />
        {/* drip */}
        <path d="M200 0 L200 30 Q200 50 208 60 Q216 70 200 80" stroke={ORANGE} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <circle cx="200" cy="85" r="7" fill={ORANGE}/>
      </svg>

      {/* Tape strips at top */}
      <div style={{ position:"absolute", top:-10, left:"18%", width:110, height:28, background:`repeating-linear-gradient(90deg,${ORANGE}CC,${ORANGE}FF 10px,${ORANGE}CC 14px)`, transform:"rotate(-5deg)", boxShadow:"0 3px 10px rgba(0,0,0,0.4)", zIndex:10 }} />
      <div style={{ position:"absolute", top:-10, right:"18%", width:90, height:28, background:`repeating-linear-gradient(90deg,#1A5070CC,#206090FF 10px,#1A5070CC 14px)`, transform:"rotate(4deg)", boxShadow:"0 3px 10px rgba(0,0,0,0.4)", zIndex:10 }} />

      {/* Bottom torn edge */}
      <svg viewBox="0 0 520 24" style={{ position:"absolute", bottom:-2, left:0, width:"100%", height:24 }} preserveAspectRatio="none">
        <path d="M0 0 L0 8 Q20 20 40 10 Q60 2 80 16 Q100 24 120 10 Q140 0 160 18 Q180 24 200 8 Q220 0 240 16 Q260 24 280 8 Q300 2 320 18 Q340 24 360 8 Q380 0 400 16 Q420 22 440 8 Q460 0 480 16 Q500 22 520 8 L520 0 Z" fill="#F5EEE2"/>
      </svg>
    </div>
  );
}

/* ── Role content that appears behind the poster ─────────────────────────── */
function RoleContent({ role, myPlayerId, myPlayerColor }: { role: "imposter"|"crewmate"; myPlayerId?: string; myPlayerColor?: string }) {
  const isImposter = role === "imposter";
  const pid  = myPlayerId ?? "defaultplayer";
  const col  = myPlayerColor ?? (isImposter ? ORANGE : TEAL);

  return (
    <div style={{ textAlign:"center", padding:"0 2rem", maxWidth:520, animation:"role-content-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>

      {/* Avatar */}
      <div style={{ margin:"0 auto 1.25rem", width:96, height:104, animation:"float-slow 3s ease-in-out infinite" }}>
        <PlayerAvatar playerId={pid} color={col} size={96} showBorder />
      </div>

      <div style={{ fontFamily:BEBAS, fontSize:"0.85rem", letterSpacing:"0.4em", color:isImposter?`${ORANGE}CC`:NAVY, marginBottom:"0.4rem" }}>
        {isImposter ? "YOU ARE THE" : "YOU ARE A"}
      </div>

      <div style={{
        fontFamily:BEBAS, fontSize:"clamp(4.5rem,11vw,7rem)", lineHeight:1, letterSpacing:"0.06em",
        color:isImposter?"#FFFFFF":NAVY,
        textShadow:isImposter
          ?`0 0 40px ${ORANGE}BB, 0 0 80px ${ORANGE}44, 4px 4px 0 ${NAVY}`
          :`4px 4px 0 ${ORANGE}, 8px 8px 0 rgba(0,0,0,0.14)`,
        animation:isImposter?"imposter-shake 0.5s ease-out 0.1s both":"stamp-in 0.4s ease-out both",
      }}>
        {isImposter ? "IMPOSTER" : "CREWMATE"}
      </div>

      <div style={{ height:5, background:isImposter?ORANGE:NAVY, margin:"0.6rem auto 1.4rem", width:"65%", boxShadow:isImposter?`4px 4px 0 ${NAVY}`:`4px 4px 0 ${ORANGE}` }} />

      <div style={{
        background:isImposter?"rgba(20,6,0,0.9)":"#FFFFFF",
        border:isImposter?`3px solid ${ORANGE}`:`3px solid ${NAVY}`,
        boxShadow:isImposter?`4px 4px 0 ${NAVY}`:`4px 4px 0 ${ORANGE}`,
        padding:"0.9rem 1.4rem", marginBottom:"1.25rem",
      }}>
        <p style={{ fontFamily:DM, fontSize:"0.88rem", color:isImposter?"rgba(237,229,204,0.8)":NAVY, margin:0, lineHeight:1.6, fontWeight:600 }}>
          {isImposter
            ? "Sabotage the UI without getting caught. You have the same tools — use them against the team."
            : "Work with your team to build the best design. Watch for suspicious moves and catch the imposter."}
        </p>
      </div>

      <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.2em", color:isImposter?"rgba(255,255,255,0.4)":NAVY, opacity:0.55, animation:"blink-hint 1.2s ease-in-out infinite" }}>
        STARTING SOON…
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export function RoleReveal({ role, onDismiss, myPlayerId, myPlayerColor }: Props) {
  const [phase, setPhase] = useState<"hanging" | "falling" | "revealed" | "fading">("hanging");
  const isImposter = role === "imposter";

  useEffect(() => {
    // Poster wobbles then falls
    const fallTimer    = setTimeout(() => setPhase("falling"),  1600);
    const revealTimer  = setTimeout(() => setPhase("revealed"), 3100);
    const fadeTimer    = setTimeout(() => setPhase("fading"),   5800);
    const dismissTimer = setTimeout(() => onDismiss(),          6500);
    return () => { clearTimeout(fallTimer); clearTimeout(revealTimer); clearTimeout(fadeTimer); clearTimeout(dismissTimer); };
  }, [onDismiss]);

  // Neutral cream wall — same for both roles so you can't tell before the poster falls
  const bg = "radial-gradient(ellipse at center, #EDE5CC 0%, #D8CEAE 50%, #C4B898 100%)";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999, overflow:"hidden",
      background:bg,
      opacity:phase==="fading"?0:1,
      transition:"opacity 0.65s ease",
    }}>

      {/* Wall texture / background patches */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        <>
          <div style={{ position:"absolute", top:"-20%", left:"-12%", width:"50%", height:"58%", background:NAVY, opacity:0.12, transform:"rotate(-5deg)" }} />
          <div style={{ position:"absolute", bottom:"-15%", right:"-8%", width:"48%", height:"55%", background:TEAL, opacity:0.10, transform:"rotate(4deg)" }} />
          <div style={{ position:"absolute", top:"32%", right:"18%", width:"22%", height:"32%", background:MUSTARD, opacity:0.15, transform:"rotate(-6deg)" }} />
        </>

        {/* Wall tape strips (always visible) */}
        <div style={{ position:"absolute", top:"8%", left:"6%", width:120, height:18, background:`repeating-linear-gradient(90deg,${ORANGE}99,${ORANGE}BB 10px,${ORANGE}99 14px)`, transform:"rotate(-32deg)", opacity:0.5 }} />
        <div style={{ position:"absolute", top:"12%", right:"8%", width:100, height:16, background:`repeating-linear-gradient(90deg,#1A507088,#20609088 10px,#1A507088 14px)`, transform:"rotate(18deg)", opacity:0.5 }} />
        <div style={{ position:"absolute", bottom:"20%", left:"12%", width:90, height:14, background:`repeating-linear-gradient(90deg,${MUSTARD}99,${MUSTARD}BB 10px,${MUSTARD}99 14px)`, transform:"rotate(8deg)", opacity:0.4 }} />

        {/* Grain texture */}
        <div style={{ position:"absolute", inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:"160px", opacity:0.04, mixBlendMode:"overlay" }} />
      </div>

      {/* ── Role content (behind the poster) ── */}
      <div style={{
        position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
        opacity:phase==="revealed"||phase==="fading"?1:0,
        transition:"opacity 0.45s ease",
        zIndex:2,
      }}>
        <RoleContent role={role} myPlayerId={myPlayerId} myPlayerColor={myPlayerColor} />
      </div>

      {/* ── Falling poster (sits on top) ── */}
      <div style={{
        position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:10, pointerEvents:"none",
      }}>
        <div style={{
          transformOrigin:"50% 0%",
          animation:
            phase==="hanging"  ? "poster-wobble 1.6s ease-in-out" :
            phase==="falling"  ? "poster-fall 1.5s cubic-bezier(0.4,0,1,1) forwards" :
            "none",
          display: phase==="revealed"||phase==="fading" ? "none" : "block",
        }}>
          <FallingPoster role={role} />
        </div>
      </div>

      <style>{`
        @keyframes poster-wobble {
          0%   { transform: rotate(0deg); }
          20%  { transform: rotate(-1.5deg); }
          40%  { transform: rotate(1.2deg); }
          60%  { transform: rotate(-2deg); }
          80%  { transform: rotate(1.5deg); }
          100% { transform: rotate(-1deg); }
        }
        @keyframes poster-fall {
          0%   { transform: rotate(0deg)    translateY(0)    translateX(0);   opacity:1; }
          15%  { transform: rotate(-4deg)   translateY(2%)   translateX(-2%); opacity:1; }
          35%  { transform: rotate(18deg)   translateY(18%)  translateX(8%);  opacity:1; }
          65%  { transform: rotate(42deg)   translateY(55%)  translateX(22%); opacity:0.8; }
          100% { transform: rotate(75deg)   translateY(130%) translateX(40%); opacity:0; }
        }
        @keyframes role-content-in {
          0%   { transform: scale(0.85) translateY(10px); opacity:0; }
          100% { transform: scale(1)    translateY(0);    opacity:1; }
        }
        @keyframes stamp-in {
          0%   { transform: scale(1.4); opacity:0; }
          60%  { transform: scale(0.97); opacity:1; }
          80%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes imposter-shake {
          0%   { transform: scale(0.7) rotate(-3deg); opacity:0; }
          40%  { transform: scale(1.1)  rotate(2deg);  opacity:1; }
          60%  { transform: scale(0.97) rotate(-1deg); }
          80%  { transform: scale(1.03) rotate(0.5deg); }
          100% { transform: scale(1)    rotate(0deg); }
        }
        @keyframes float-slow {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-8px); }
        }
        @keyframes blink-hint {
          0%,100% { opacity:0.55; }
          50%     { opacity:0.3; }
        }
      `}</style>
    </div>
  );
}
