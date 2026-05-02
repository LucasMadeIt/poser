import { useState } from "react";
import { PosterWallBg, TapeH } from "../components/PosterWallBg";

const BEBAS = "'Bebas Neue', sans-serif";
const DM = "'DM Sans', sans-serif";

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

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:440, display:"flex", flexDirection:"column", gap:"1.4rem" }}>

        {/* ── LOGO POSTER ── */}
        <div style={{ position:"relative", alignSelf:"center" }}>
          {/* paper card */}
          <div style={{
            background:"#EDE5CC",
            padding:"2.4rem 3.2rem 2rem",
            transform:"rotate(-1.4deg)",
            boxShadow:"6px 14px 48px rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.4)",
            position:"relative",
            textAlign:"center",
          }}>
            <TapeH color="#C4681A" width={104} />
            <img
              src="/poster-logo.png"
              alt="POSTER"
              style={{ width:"clamp(200px,46vw,290px)", display:"block", margin:"0 auto", mixBlendMode:"multiply", filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.22))" }}
            />
            <div style={{ fontFamily:DM, fontSize:"0.78rem", color:"#5C4A2A", letterSpacing:"0.12em", textTransform:"uppercase", marginTop:"0.6rem", fontWeight:500 }}>
              The Design Imposter Game
            </div>
          </div>
          {/* torn paper bottom edge */}
          <svg viewBox="0 0 440 18" style={{ display:"block", width:"100%", marginTop:-2, filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }} preserveAspectRatio="none">
            <path d="M0 0 L0 8 Q20 14 40 8 Q60 2 80 10 Q100 18 120 10 Q140 2 160 12 Q180 18 200 8 Q220 2 240 14 Q260 18 280 8 Q300 0 320 12 Q340 18 360 8 Q380 2 400 10 Q420 16 440 8 L440 0 Z" fill="#EDE5CC"/>
          </svg>
        </div>

        {/* ── FORM PANEL ── */}
        <div style={{
          background:"#1A1714",
          border:"3px solid #0A0906",
          boxShadow:"8px 10px 0 rgba(0,0,0,0.7), 0 0 0 1px #2a2620",
          padding:"1.75rem 1.75rem 1.5rem",
          transform:"rotate(0.6deg)",
          position:"relative",
        }}>
          {/* blue tape top-left corner */}
          <div style={{ position:"absolute", top:-11, left:18, width:66, height:22, background:"repeating-linear-gradient(90deg,#12406ACC,#1A5888EE 10px,#12406ACC 14px)", transform:"rotate(-6deg)", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }} />
          {/* orange tape top-right corner */}
          <div style={{ position:"absolute", top:-11, right:24, width:54, height:22, background:"repeating-linear-gradient(90deg,#A85210CC,#CC6218EE 10px,#A85210CC 14px)", transform:"rotate(4deg)", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }} />

          <div style={{ marginBottom:"1.25rem" }}>
            <label style={{ fontFamily:BEBAS, letterSpacing:"0.14em", color:"#A89878", fontSize:"0.82rem", display:"block", marginBottom:"0.4rem" }}>
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
              style={{ background:"#EDE5CC", color:"#1A1714", border:"2px solid #0A0906", fontFamily:DM, fontWeight:600 }}
            />
          </div>

          {/* Create / Join toggle */}
          <div style={{ display:"flex", marginBottom:"1.25rem", border:"2px solid #2a2620" }}>
            {(["create","join"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, fontFamily:BEBAS, letterSpacing:"0.1em", fontSize:"1rem",
                padding:"0.5rem",
                background: mode === m ? "#CC2200" : "transparent",
                color: mode === m ? "#EDE5CC" : "#5C5040",
                border:"none", cursor:"pointer", transition:"all 0.15s",
                borderRight: m === "create" ? "2px solid #2a2620" : "none",
              }}>
                {m === "create" ? "Create Room" : "Join Room"}
              </button>
            ))}
          </div>

          {mode === "join" && (
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={{ fontFamily:BEBAS, letterSpacing:"0.14em", color:"#A89878", fontSize:"0.82rem", display:"block", marginBottom:"0.4rem" }}>
                Room Code
              </label>
              <input
                className="input-poster"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={handleKey}
                placeholder="6-LETTER CODE"
                maxLength={6}
                style={{ background:"#EDE5CC", color:"#1A1714", border:"2px solid #0A0906", fontFamily:BEBAS, fontSize:"1.4rem", letterSpacing:"0.35em", textTransform:"uppercase", fontWeight:700, textAlign:"center" }}
              />
            </div>
          )}

          {error && (
            <div style={{ background:"#CC2200", color:"#EDE5CC", padding:"0.5rem 0.75rem", marginBottom:"1rem", fontFamily:DM, fontSize:"0.85rem", border:"2px solid #A81A00" }}>
              {error}
            </div>
          )}

          <button
            className="btn-poster"
            style={{ width:"100%", fontSize:"1.35rem", letterSpacing:"0.12em", background:"#CC2200", border:"2px solid #8A1200", boxShadow:"4px 4px 0 rgba(0,0,0,0.6)", color:"#EDE5CC" }}
            onClick={mode === "create" ? handleCreate : handleJoin}
          >
            {mode === "create" ? "Create Room" : "Join Room"}
          </button>
        </div>

        {/* ── HOW TO PLAY (torn scrap) ── */}
        <div style={{ position:"relative", transform:"rotate(-0.8deg)", alignSelf:"stretch" }}>
          <div style={{
            background:"#F0E8D0",
            padding:"1rem 1.2rem 1.2rem",
            boxShadow:"4px 8px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
            position:"relative",
          }}>
            <TapeH color="#1A5888" width={72} />
            <div style={{ fontFamily:BEBAS, letterSpacing:"0.12em", fontSize:"0.88rem", color:"#CC2200", marginBottom:"0.55rem", marginTop:"0.3rem" }}>
              How To Play
            </div>
            <ul style={{ fontFamily:DM, fontSize:"0.8rem", color:"#4A3C22", lineHeight:1.65, margin:0, paddingLeft:"1.1rem" }}>
              <li>2–5 players collaborate on a shared design canvas</li>
              <li>One player is secretly the imposter — sabotaging the design</li>
              <li>After each round, discuss who acted suspicious</li>
              <li>Vote to unmask the imposter before they get away</li>
            </ul>
          </div>
          {/* torn bottom */}
          <svg viewBox="0 0 440 16" style={{ display:"block", width:"100%", marginTop:-2 }} preserveAspectRatio="none">
            <path d="M0 0 L0 6 Q25 14 50 6 Q75 0 100 10 Q125 16 150 6 Q175 0 200 12 Q225 16 250 6 Q275 0 300 10 Q325 16 350 6 Q375 0 400 10 Q420 16 440 6 L440 0 Z" fill="#F0E8D0"/>
          </svg>
        </div>

      </div>
    </div>
  );
}
