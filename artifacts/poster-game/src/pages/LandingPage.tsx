import { useState } from "react";
import { PosterWallBg, TapeH } from "../components/PosterWallBg";

const BEBAS = "'Bebas Neue', sans-serif";
const DM = "'DM Sans', sans-serif";

// Logo palette
const ORANGE = "#D4561A";
const NAVY   = "#1C3A60";
const TEAL   = "#2A8080";
const CREAM  = "#EDE5CC";

type Props = {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  error: string;
};

export function LandingPage({ onCreateRoom, onJoinRoom, error }: Props) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");

  function handleCreate() { if (name.trim()) onCreateRoom(name.trim()); }
  function handleJoin() { if (name.trim() && joinCode.trim()) onJoinRoom(joinCode.trim().toUpperCase(), name.trim()); }
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") mode === "create" ? handleCreate() : handleJoin();
  }

  return (
    <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <PosterWallBg />

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:500, display:"flex", flexDirection:"column", gap:"1.2rem" }}>

        {/* ── LOGO — displayed as a floating poster on the wall ── */}
        <div style={{ position:"relative", alignSelf:"stretch" }}>
          {/* tape strips holding the logo up */}
          <div style={{ position:"absolute", top:-12, left:"18%", width:80, height:24, background:`repeating-linear-gradient(90deg,#B84E10CC,#D4621AEE 10px,#B84E10CC 14px)`, transform:"rotate(-4deg)", boxShadow:"0 2px 12px rgba(0,0,0,0.6)", zIndex:2 }} />
          <div style={{ position:"absolute", top:-12, right:"18%", width:80, height:24, background:`repeating-linear-gradient(90deg,#1A5070CC,#206090EE 10px,#1A5070CC 14px)`, transform:"rotate(3deg)", boxShadow:"0 2px 12px rgba(0,0,0,0.6)", zIndex:2 }} />
          <img
            src="/poster-logo.png"
            alt="POSTER"
            style={{
              width:"100%",
              display:"block",
              boxShadow:"6px 14px 56px rgba(0,0,0,0.85), 2px 4px 16px rgba(0,0,0,0.5)",
              transform:"rotate(-0.8deg)",
              imageRendering:"crisp-edges",
            }}
          />
        </div>

        {/* ── FORM PANEL — dark notice board ── */}
        <div style={{
          background:"#1A1410",
          border:`3px solid #0A0906`,
          boxShadow:`8px 10px 0 rgba(0,0,0,0.75), 0 0 0 1px #2a2218`,
          padding:"1.75rem 1.75rem 1.5rem",
          transform:"rotate(0.5deg)",
          position:"relative",
        }}>
          {/* tape corners */}
          <div style={{ position:"absolute", top:-11, left:18, width:66, height:22, background:`repeating-linear-gradient(90deg,#1A5070CC,#206090EE 10px,#1A5070CC 14px)`, transform:"rotate(-5deg)", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }} />
          <div style={{ position:"absolute", top:-11, right:24, width:54, height:22, background:`repeating-linear-gradient(90deg,#B84E10CC,#D4621AEE 10px,#B84E10CC 14px)`, transform:"rotate(4deg)", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }} />

          <div style={{ marginBottom:"1.2rem" }}>
            <label style={{ fontFamily:BEBAS, letterSpacing:"0.14em", color:"#8A7050", fontSize:"0.82rem", display:"block", marginBottom:"0.4rem" }}>
              Your Name
            </label>
            <input
              className="input-poster"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
              style={{ background:CREAM, color:"#1A1410", border:`2px solid #0A0906`, fontFamily:DM, fontWeight:600 }}
            />
          </div>

          {/* Create / Join toggle */}
          <div style={{ display:"flex", marginBottom:"1.2rem", border:`2px solid #2a2218` }}>
            {(["create","join"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, fontFamily:BEBAS, letterSpacing:"0.1em", fontSize:"1rem",
                padding:"0.5rem",
                background: mode === m ? ORANGE : "transparent",
                color: mode === m ? CREAM : "#5C5040",
                border:"none", cursor:"pointer", transition:"all 0.15s",
                borderRight: m === "create" ? `2px solid #2a2218` : "none",
              }}>
                {m === "create" ? "Create Room" : "Join Room"}
              </button>
            ))}
          </div>

          {mode === "join" && (
            <div style={{ marginBottom:"1.2rem" }}>
              <label style={{ fontFamily:BEBAS, letterSpacing:"0.14em", color:"#8A7050", fontSize:"0.82rem", display:"block", marginBottom:"0.4rem" }}>
                Room Code
              </label>
              <input
                className="input-poster"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={handleKey}
                placeholder="6-LETTER CODE"
                maxLength={6}
                style={{ background:CREAM, color:"#1A1410", border:`2px solid #0A0906`, fontFamily:BEBAS, fontSize:"1.4rem", letterSpacing:"0.35em", textTransform:"uppercase", fontWeight:700, textAlign:"center" }}
              />
            </div>
          )}

          {error && (
            <div style={{ background:ORANGE, color:CREAM, padding:"0.5rem 0.75rem", marginBottom:"1rem", fontFamily:DM, fontSize:"0.85rem", border:`2px solid #A84010` }}>
              {error}
            </div>
          )}

          <button
            className="btn-poster"
            style={{ width:"100%", fontSize:"1.35rem", letterSpacing:"0.12em", background:ORANGE, border:`2px solid #8A3008`, boxShadow:"4px 4px 0 rgba(0,0,0,0.65)", color:CREAM }}
            onClick={mode === "create" ? handleCreate : handleJoin}
          >
            {mode === "create" ? "Create Room" : "Join Room"}
          </button>
        </div>

        {/* ── HOW TO PLAY — torn scrap ── */}
        <div style={{ position:"relative", transform:"rotate(-0.6deg)", alignSelf:"stretch" }}>
          <div style={{ background:"#F0E8D0", padding:"1rem 1.2rem 1.2rem", boxShadow:"4px 8px 24px rgba(0,0,0,0.6)", position:"relative" }}>
            <TapeH color={TEAL} width={72} />
            <div style={{ fontFamily:BEBAS, letterSpacing:"0.12em", fontSize:"0.88rem", color:ORANGE, marginBottom:"0.55rem", marginTop:"0.3rem" }}>
              How To Play
            </div>
            <ul style={{ fontFamily:DM, fontSize:"0.8rem", color:"#4A3C22", lineHeight:1.65, margin:0, paddingLeft:"1.1rem" }}>
              <li>2–5 players collaborate on a shared design canvas</li>
              <li>One player is secretly the imposter — sabotaging the design</li>
              <li>After each round, discuss who acted suspicious</li>
              <li>Vote to unmask the imposter before they get away</li>
            </ul>
          </div>
          <svg viewBox="0 0 500 16" style={{ display:"block", width:"100%", marginTop:-2 }} preserveAspectRatio="none">
            <path d="M0 0 L0 6 Q28 15 56 6 Q84 0 112 12 Q140 16 168 5 Q196 0 224 13 Q252 16 280 5 Q308 0 336 12 Q364 16 392 5 Q420 0 448 12 Q472 16 500 5 L500 0 Z" fill="#F0E8D0"/>
          </svg>
        </div>

      </div>
    </div>
  );
}
