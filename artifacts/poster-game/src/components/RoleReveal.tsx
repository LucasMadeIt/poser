import { useState, useEffect } from "react";

const BEBAS   = "'Bebas Neue', sans-serif";
const DM      = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";

type Props = {
  role: "imposter" | "crewmate";
  onDismiss: () => void;
};

function CrewmateIcon() {
  return (
    <div style={{ position:"relative", width:100, height:120, margin:"0 auto" }}>
      <div style={{ width:100, height:100, background:TEAL, borderRadius:"50% 50% 44% 44%", position:"absolute", bottom:0, boxShadow:`0 0 28px ${TEAL}88, 4px 4px 0 ${NAVY}` }}>
        <div style={{ position:"absolute", top:"24%", left:"15%", width:20, height:26, background:"white", borderRadius:"50%" }}><div style={{ position:"absolute", bottom:4, right:3, width:10, height:13, background:"#1a1208", borderRadius:"50%" }} /></div>
        <div style={{ position:"absolute", top:"24%", right:"15%", width:20, height:26, background:"white", borderRadius:"50%" }}><div style={{ position:"absolute", bottom:4, left:3, width:10, height:13, background:"#1a1208", borderRadius:"50%" }} /></div>
        <div style={{ position:"absolute", bottom:"16%", left:"50%", transform:"translateX(-50%)", width:36, height:16, borderBottom:`4px solid #1a1208`, borderLeft:`3px solid #1a1208`, borderRight:`3px solid #1a1208`, borderRadius:"0 0 20px 20px" }} />
      </div>
      <div style={{ position:"absolute", right:-16, top:33, width:20, height:7, background:TEAL, borderRadius:4, transform:"rotate(-32deg)" }}><div style={{ position:"absolute", right:-2, top:-12, width:10, height:15, background:TEAL, borderRadius:"4px 4px 2px 2px" }} /></div>
      <div style={{ position:"absolute", left:-13, top:42, width:18, height:7, background:TEAL, borderRadius:4, transform:"rotate(18deg)" }} />
    </div>
  );
}

function ImposterIcon() {
  return (
    <div style={{ position:"relative", width:100, height:145, margin:"0 auto" }}>
      <div style={{ width:100, height:100, background:"#1A1208", borderRadius:"50% 50% 44% 44%", position:"absolute", top:0, zIndex:2, boxShadow:`0 0 28px ${ORANGE}66, 4px 4px 0 ${NAVY}` }}>
        <div style={{ position:"absolute", top:"22%", left:"13%", width:20, height:16, background:ORANGE, borderRadius:"50%", transform:"rotate(-12deg)", boxShadow:`0 0 8px ${ORANGE}88` }}><div style={{ position:"absolute", bottom:2, right:3, width:9, height:10, background:"#5A1A00", borderRadius:"50%" }} /></div>
        <div style={{ position:"absolute", top:"22%", right:"13%", width:20, height:16, background:ORANGE, borderRadius:"50%", transform:"rotate(12deg)", boxShadow:`0 0 8px ${ORANGE}88` }}><div style={{ position:"absolute", bottom:2, left:3, width:9, height:10, background:"#5A1A00", borderRadius:"50%" }} /></div>
        <div style={{ position:"absolute", bottom:"17%", left:"50%", transform:"translateX(-50%)", width:34, height:13, borderTop:`4px solid ${ORANGE}`, borderLeft:`3px solid ${ORANGE}`, borderRight:`3px solid ${ORANGE}`, borderRadius:"20px 20px 0 0" }} />
      </div>
      <div style={{ position:"absolute", top:68, left:-10, right:-10, height:62, background:"#1A1208", borderRadius:"0 0 26px 26px", zIndex:1 }} />
      <div style={{ position:"absolute", top:88, left:-18, width:26, height:42, background:"#1A1208", borderRadius:"0 0 7px 7px", transform:"rotate(17deg)", zIndex:0 }} />
      <div style={{ position:"absolute", top:88, right:-18, width:26, height:42, background:"#1A1208", borderRadius:"0 0 7px 7px", transform:"rotate(-17deg)", zIndex:0 }} />
    </div>
  );
}

export function RoleReveal({ role, onDismiss }: Props) {
  const [fading,   setFading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const isImposter = role === "imposter";

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(()=>setProgress(Math.min(100,((Date.now()-start)/4200)*100)), 50);
    const fadeTimer    = setTimeout(()=>setFading(true), 3700);
    const dismissTimer = setTimeout(()=>onDismiss(), 4300);
    return ()=>{clearInterval(interval);clearTimeout(fadeTimer);clearTimeout(dismissTimer);};
  }, [onDismiss]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background: isImposter
        ? `radial-gradient(ellipse at center, #3A1800 0%, #1A0A00 50%, #0A0400 100%)`
        : `radial-gradient(ellipse at center, #EDE5CC 0%, #D4C8A8 50%, #C0B090 100%)`,
      opacity:fading?0:1, transition:"opacity 0.55s ease", overflow:"hidden",
    }}>

      {/* Background poster patches */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        {isImposter ? (<>
          <div style={{ position:"absolute", top:"-20%", left:"-15%", width:"55%", height:"65%", background:ORANGE, opacity:0.20, transform:"rotate(-5deg)" }} />
          <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:"50%", height:"60%", background:"#5A1A00", opacity:0.35, transform:"rotate(4deg)" }} />
          <div style={{ position:"absolute", top:"30%", right:"15%", width:"25%", height:"35%", background:"#8B1A10", opacity:0.20, transform:"rotate(-8deg)" }} />
        </>) : (<>
          <div style={{ position:"absolute", top:"-20%", left:"-15%", width:"55%", height:"65%", background:NAVY, opacity:0.18, transform:"rotate(-5deg)" }} />
          <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:"50%", height:"60%", background:TEAL, opacity:0.14, transform:"rotate(4deg)" }} />
          <div style={{ position:"absolute", top:"30%", right:"15%", width:"25%", height:"35%", background:MUSTARD, opacity:0.22, transform:"rotate(-5deg)" }} />
        </>)}

        {/* Tape strips */}
        <div style={{ position:"absolute", top:"12%", left:"8%", width:140, height:22, background:`repeating-linear-gradient(90deg,${ORANGE}BB,${ORANGE}FF 10px,${ORANGE}BB 14px)`, transform:"rotate(-38deg)", opacity:0.65 }} />
        <div style={{ position:"absolute", bottom:"18%", right:"10%", width:120, height:20, background:`repeating-linear-gradient(90deg,#1A5070BB,#206090FF 10px,#1A5070BB 14px)`, transform:"rotate(22deg)", opacity:0.65 }} />

        {/* Particles for imposter */}
        {isImposter&&Array.from({length:16}).map((_,i)=>(
          <div key={i} style={{
            position:"absolute", left:`${10+(i*47)%80}%`, top:`${5+(i*31)%90}%`,
            width:i%3===0?6:4, height:i%3===0?6:4,
            background:ORANGE, borderRadius:"50%",
            animation:`float-particle ${2.5+(i%5)*0.6}s ease-in-out infinite`,
            animationDelay:`${(i*0.27)%2}s`, opacity:0.6,
            boxShadow:`0 0 6px ${ORANGE}CC`,
          }} />
        ))}

        {/* Scribble SVG */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:isImposter?0.12:0.08 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <path d="M60 100 Q200 70 320 140 Q440 210 560 110" stroke={isImposter?"#FFFFFF":NAVY} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <circle cx="80" cy="200" r="35" stroke={isImposter?"#FFFFFF":NAVY} strokeWidth="2" fill="none" strokeDasharray="7 9"/>
          <circle cx="1380" cy="700" r="28" stroke={isImposter?"#FFFFFF":NAVY} strokeWidth="2" fill="none" strokeDasharray="5 8"/>
          <text x="1118" y="505" fontFamily={BEBAS} fontSize="55" fill={isImposter?"#FFFFFF":NAVY} transform="rotate(-12 1118 505)" opacity="0.2">POSTER</text>
        </svg>
      </div>

      {/* Grain */}
      <div style={{ position:"absolute", inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:"160px", opacity:0.05, mixBlendMode:"overlay", pointerEvents:"none", zIndex:1 }} />

      {/* ── CONTENT ── */}
      <div style={{ textAlign:"center", padding:"0 2rem", maxWidth:560, position:"relative", zIndex:10 }}>

        <div style={{ fontFamily:BEBAS, fontSize:"1.1rem", letterSpacing:"0.35em", color:isImposter?`${ORANGE}CC`:NAVY, marginBottom:"0.6rem" }}>
          {isImposter?"YOU ARE THE":"YOU ARE A"}
        </div>

        <div style={{
          fontFamily:BEBAS, fontSize:"clamp(4.5rem, 11vw, 7.5rem)", lineHeight:1, marginBottom:"0.25rem", letterSpacing:"0.06em",
          color:isImposter?"#FFFFFF":NAVY,
          textShadow:isImposter
            ?`0 0 50px ${ORANGE}CC, 0 0 100px ${ORANGE}66, 4px 4px 0 ${NAVY}`
            :`4px 4px 0 ${ORANGE}, 8px 8px 0 rgba(0,0,0,0.15)`,
          animation:isImposter?"imposter-shake 0.55s ease-in-out 0.25s both":"stamp-in 0.4s ease-out both",
          position:"relative",
        }}>
          {isImposter?"IMPOSTER":"CREWMATE"}
        </div>

        {/* Stamp underline */}
        <div style={{ height:5, background:isImposter?ORANGE:NAVY, margin:"0.5rem auto 1.75rem", width:"70%", boxShadow:isImposter?`4px 4px 0 ${NAVY}`:`4px 4px 0 ${ORANGE}` }} />

        <div style={{ margin:"0 auto 1.75rem", animation:"float-slow 3s ease-in-out infinite" }}>
          {isImposter?<ImposterIcon/>:<CrewmateIcon/>}
        </div>

        {/* Description card */}
        <div style={{
          background:isImposter?"rgba(26,8,0,0.85)":"#FFFFFF",
          border:isImposter?`3px solid ${ORANGE}`:`3px solid ${NAVY}`,
          boxShadow:isImposter?`4px 4px 0 ${NAVY}`:`4px 4px 0 ${ORANGE}`,
          padding:"0.9rem 1.4rem", marginBottom:"1.75rem",
        }}>
          <p style={{ fontFamily:DM, fontSize:"0.9rem", color:isImposter?"rgba(237,229,204,0.75)":NAVY, margin:0, lineHeight:1.6, fontWeight:isImposter?400:600 }}>
            {isImposter
              ?"Sabotage the UI without getting caught. You have the same tools as everyone — use them against the team."
              :"Work with your team to build the best UI. Catch the imposter before all rounds are up."}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ width:180, height:5, background:isImposter?"rgba(255,255,255,0.15)":"rgba(28,58,96,0.15)", margin:"0 auto 0.5rem", overflow:"hidden", border:isImposter?`1px solid ${ORANGE}44`:`1px solid ${NAVY}44` }}>
          <div style={{ height:"100%", background:isImposter?ORANGE:NAVY, width:`${progress}%`, transition:"width 0.05s linear", boxShadow:isImposter?`0 0 8px ${ORANGE}CC`:undefined }} />
        </div>
        <div style={{ fontFamily:DM, fontSize:"0.72rem", color:isImposter?"rgba(255,255,255,0.35)":NAVY, opacity:0.5 }}>
          Starting in {Math.max(0,Math.ceil(4-progress/25))}s
        </div>
      </div>

      <style>{`
        @keyframes imposter-shake { 0%{transform:scale(0.7) rotate(-2deg);opacity:0} 40%{transform:scale(1.08) rotate(1.5deg);opacity:1} 60%{transform:scale(0.97) rotate(-0.8deg)} 80%{transform:scale(1.03) rotate(0.5deg)} 100%{transform:scale(1) rotate(0deg)} }
        @keyframes stamp-in { 0%{transform:scale(1.4);opacity:0} 60%{transform:scale(0.96);opacity:1} 80%{transform:scale(1.02)} 100%{transform:scale(1)} }
        @keyframes float-slow { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes float-particle { 0%,100%{transform:translateY(0) scale(1);opacity:0.5} 50%{transform:translateY(-18px) scale(1.2);opacity:0.9} }
      `}</style>
    </div>
  );
}
