import { useState } from "react";
import { PosterWallBg, TapeH } from "../components/PosterWallBg";

const BEBAS = "'Bebas Neue', sans-serif";
const DM    = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const CREAM   = "#EDE5CC";
const MUSTARD = "#C8A028";

type Props = {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  error: string;
};

export function LandingPage({ onCreateRoom, onJoinRoom, error }: Props) {
  const [name,     setName]     = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode,     setMode]     = useState<"create" | "join">("create");

  function handleCreate() { if (name.trim()) onCreateRoom(name.trim()); }
  function handleJoin()   { if (name.trim() && joinCode.trim()) onJoinRoom(joinCode.trim().toUpperCase(), name.trim()); }
  function handleKey(e: React.KeyboardEvent) { if (e.key === "Enter") mode === "create" ? handleCreate() : handleJoin(); }

  return (
    <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <PosterWallBg />

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:500, display:"flex", flexDirection:"column", gap:"1.2rem" }}>

        {/* ── LOGO — floating poster, pinned with tape ── */}
        <div style={{ position:"relative", alignSelf:"stretch" }}>
          <div style={{ position:"absolute", top:-14, left:"16%", width:84, height:26, background:`repeating-linear-gradient(90deg,#B84E10DD,#D4621AFF 10px,#B84E10DD 14px)`, transform:"rotate(-5deg)", boxShadow:"0 3px 14px rgba(0,0,0,0.55)", zIndex:2 }} />
          <div style={{ position:"absolute", top:-14, right:"16%", width:84, height:26, background:`repeating-linear-gradient(90deg,#1A5070DD,#206090FF 10px,#1A5070DD 14px)`, transform:"rotate(4deg)", boxShadow:"0 3px 14px rgba(0,0,0,0.55)", zIndex:2 }} />
          <img src="/poster-logo.png" alt="POSTER" style={{ width:"100%", display:"block", boxShadow:"6px 14px 56px rgba(0,0,0,0.70), 0 2px 8px rgba(0,0,0,0.4)", transform:"rotate(-0.8deg)", imageRendering:"crisp-edges" }} />
        </div>

        {/* ── FORM — white poster pinned on wall ── */}
        <div style={{ position:"relative", background:"#FFFFFF", border:`4px solid ${NAVY}`, boxShadow:`6px 8px 0 ${ORANGE}, 10px 14px 0 rgba(0,0,0,0.35)`, padding:"1.75rem 1.75rem 1.5rem", transform:"rotate(0.5deg)" }}>
          {/* Tape corners */}
          <div style={{ position:"absolute", top:-12, left:16, width:68, height:24, background:`repeating-linear-gradient(90deg,#1A5070DD,#206090FF 10px,#1A5070DD 14px)`, transform:"rotate(-5deg)", boxShadow:"0 2px 10px rgba(0,0,0,0.4)", zIndex:2 }} />
          <div style={{ position:"absolute", top:-12, right:22, width:56, height:24, background:`repeating-linear-gradient(90deg,#B84E10DD,#D4621AFF 10px,#B84E10DD 14px)`, transform:"rotate(4deg)", boxShadow:"0 2px 10px rgba(0,0,0,0.4)", zIndex:2 }} />

          <div style={{ marginBottom:"1.2rem" }}>
            <label style={{ fontFamily:BEBAS, letterSpacing:"0.16em", color:NAVY, fontSize:"0.8rem", display:"block", marginBottom:"0.4rem" }}>Your Name</label>
            <input className="input-poster" value={name} onChange={(e)=>setName(e.target.value)} onKeyDown={handleKey}
              placeholder="Enter your name..."
              maxLength={20} autoFocus
              style={{ background:"#FAFAF5", color:"#1A1208", border:`2px solid ${NAVY}`, fontFamily:DM, fontWeight:600, outline:"none", width:"100%", padding:"0.55rem 0.75rem", fontSize:"0.95rem", boxSizing:"border-box" }} />
          </div>

          {/* Toggle */}
          <div style={{ display:"flex", marginBottom:"1.2rem", border:`2px solid ${NAVY}` }}>
            {(["create","join"] as const).map((m) => (
              <button key={m} onClick={()=>setMode(m)} style={{
                flex:1, fontFamily:BEBAS, letterSpacing:"0.1em", fontSize:"1rem", padding:"0.5rem",
                background:mode===m?ORANGE:"#FAFAF5",
                color:mode===m?"#FFFFFF":NAVY,
                border:"none", cursor:"pointer", transition:"all 0.15s",
                borderRight:m==="create"?`2px solid ${NAVY}`:"none",
              }}>{m==="create"?"Create Room":"Join Room"}</button>
            ))}
          </div>

          {mode==="join" && (
            <div style={{ marginBottom:"1.2rem" }}>
              <label style={{ fontFamily:BEBAS, letterSpacing:"0.16em", color:NAVY, fontSize:"0.8rem", display:"block", marginBottom:"0.4rem" }}>Room Code</label>
              <input className="input-poster" value={joinCode} onChange={(e)=>setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={handleKey} placeholder="6-LETTER CODE" maxLength={6}
                style={{ background:"#FAFAF5", color:NAVY, border:`2px solid ${NAVY}`, fontFamily:BEBAS, fontSize:"1.5rem", letterSpacing:"0.42em", textTransform:"uppercase", fontWeight:700, textAlign:"center", width:"100%", padding:"0.5rem", boxSizing:"border-box", outline:"none" }} />
            </div>
          )}

          {error && (
            <div style={{ background:ORANGE, color:"#FFFFFF", padding:"0.5rem 0.75rem", marginBottom:"1rem", fontFamily:DM, fontSize:"0.85rem", border:`2px solid #8A3008` }}>
              {error}
            </div>
          )}

          <button className="btn-poster"
            style={{ width:"100%", fontSize:"1.4rem", letterSpacing:"0.12em", background:ORANGE, border:`3px solid #8A3008`, boxShadow:`4px 4px 0 ${NAVY}`, color:"#FFFFFF", fontFamily:BEBAS, padding:"0.55rem", cursor:"pointer", transition:"transform 0.1s, box-shadow 0.1s" }}
            onMouseEnter={(e)=>{e.currentTarget.style.transform="translate(-2px,-2px)";e.currentTarget.style.boxShadow=`6px 6px 0 ${NAVY}`;}}
            onMouseLeave={(e)=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`4px 4px 0 ${NAVY}`;}}
            onClick={mode==="create"?handleCreate:handleJoin}>
            {mode==="create"?"CREATE ROOM":"JOIN ROOM"}
          </button>
        </div>

        {/* ── HOW TO PLAY — bright yellow sticky flyer ── */}
        <div style={{ position:"relative", transform:"rotate(-0.6deg)", alignSelf:"stretch" }}>
          <div style={{ background:MUSTARD, padding:"1.1rem 1.3rem 1.3rem", boxShadow:`5px 7px 0 ${NAVY}`, position:"relative", border:`3px solid #8A6800` }}>
            <TapeH color={TEAL} width={80} />
            <div style={{ fontFamily:BEBAS, letterSpacing:"0.14em", fontSize:"1rem", color:NAVY, marginBottom:"0.6rem", marginTop:"0.4rem" }}>
              HOW TO PLAY
            </div>
            <ul style={{ fontFamily:DM, fontSize:"0.82rem", color:"#1A1208", lineHeight:1.7, margin:0, paddingLeft:"1.1rem" }}>
              <li>2–5 players collaborate on a shared design canvas</li>
              <li>One player is secretly the imposter — sabotaging the design</li>
              <li>After each round, discuss who acted suspicious</li>
              <li>Vote to unmask the imposter before they get away</li>
            </ul>
          </div>
          <svg viewBox="0 0 500 16" style={{ display:"block", width:"100%", marginTop:-2 }} preserveAspectRatio="none">
            <path d="M0 0 L0 6 Q28 15 56 6 Q84 0 112 12 Q140 16 168 5 Q196 0 224 13 Q252 16 280 5 Q308 0 336 12 Q364 16 392 5 Q420 0 448 12 Q472 16 500 5 L500 0 Z" fill={MUSTARD}/>
          </svg>
        </div>

      </div>
    </div>
  );
}
