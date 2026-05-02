import { useState } from "react";
import { PosterWallBg, TapeH } from "../components/PosterWallBg";

const BEBAS = "'Bebas Neue', sans-serif";
const DM    = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";

type Props = {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  error: string;
};

const TUTORIAL_STEPS = [
  {
    icon: "🖱️",
    title: "Add Elements",
    color: ORANGE,
    desc: "Click any block in the left panel to add it to the canvas. Or drag it directly to where you want it. Press R for a rectangle, T for text.",
  },
  {
    icon: "✋",
    title: "Move & Resize",
    color: TEAL,
    desc: "Click an element to select it. Drag it to reposition. Drag the corner handles to resize. Arrow keys nudge by 1px (Shift = 10px).",
  },
  {
    icon: "🎨",
    title: "Style in the Sidebar",
    color: NAVY,
    desc: "When an element is selected, a properties panel opens on the right. Change fill colour, size, corner radius, opacity, and font settings.",
  },
  {
    icon: "✏️",
    title: "Edit Text",
    color: MUSTARD,
    desc: "Double-click any text or heading block to type directly on the canvas. Press Escape or click away to confirm. Ctrl+D duplicates an element.",
  },
  {
    icon: "📷",
    title: "Upload Media",
    color: "#6A1A8A",
    desc: "Open the Media section in the panel and click Upload Image to pick a photo from your device. It lands on the canvas instantly.",
  },
  {
    icon: "🔍",
    title: "Layer Order",
    color: "#8B1A10",
    desc: "Double-click any non-text element to open the layer menu — bring to front, send to back, or nudge forward/backward through the stack.",
  },
];

const GAME_STEPS = [
  { num: "01", text: "2–5 players collaborate on a shared design canvas around a prompt" },
  { num: "02", text: "One player is secretly the imposter — they subtly sabotage the design" },
  { num: "03", text: "After each round, discuss who acted suspicious and vote them out" },
  { num: "04", text: "Catch the imposter before all 4 rounds are over to win!" },
];

export function LandingPage({ onCreateRoom, onJoinRoom, error }: Props) {
  const [name,     setName]     = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode,     setMode]     = useState<"create" | "join">("create");
  const [tutOpen,  setTutOpen]  = useState(false);

  function handleCreate() { if (name.trim()) onCreateRoom(name.trim()); }
  function handleJoin()   { if (name.trim() && joinCode.trim()) onJoinRoom(joinCode.trim().toUpperCase(), name.trim()); }
  function handleKey(e: React.KeyboardEvent) { if (e.key === "Enter") mode === "create" ? handleCreate() : handleJoin(); }

  return (
    <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"2rem 1rem 4rem" }}>
      <PosterWallBg />

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:500, display:"flex", flexDirection:"column", gap:"1.2rem" }}>

        {/* ── LOGO ── */}
        <div style={{ position:"relative", alignSelf:"stretch" }}>
          <div style={{ position:"absolute", top:-14, left:"16%", width:84, height:26, background:`repeating-linear-gradient(90deg,#B84E10DD,#D4621AFF 10px,#B84E10DD 14px)`, transform:"rotate(-5deg)", boxShadow:"0 3px 14px rgba(0,0,0,0.55)", zIndex:2 }} />
          <div style={{ position:"absolute", top:-14, right:"16%", width:84, height:26, background:`repeating-linear-gradient(90deg,#1A5070DD,#206090FF 10px,#1A5070DD 14px)`, transform:"rotate(4deg)", boxShadow:"0 3px 14px rgba(0,0,0,0.55)", zIndex:2 }} />
          <img src="/poster-logo.png" alt="POSTER" style={{ width:"100%", display:"block", boxShadow:"6px 14px 56px rgba(0,0,0,0.70), 0 2px 8px rgba(0,0,0,0.4)", transform:"rotate(-0.8deg)", imageRendering:"crisp-edges" }} />
        </div>

        {/* ── FORM ── */}
        <div style={{ position:"relative", background:"#FFFFFF", border:`4px solid ${NAVY}`, boxShadow:`6px 8px 0 ${ORANGE}, 10px 14px 0 rgba(0,0,0,0.35)`, padding:"1.75rem 1.75rem 1.5rem", transform:"rotate(0.5deg)" }}>
          <div style={{ position:"absolute", top:-12, left:16, width:68, height:24, background:`repeating-linear-gradient(90deg,#1A5070DD,#206090FF 10px,#1A5070DD 14px)`, transform:"rotate(-5deg)", boxShadow:"0 2px 10px rgba(0,0,0,0.4)", zIndex:2 }} />
          <div style={{ position:"absolute", top:-12, right:22, width:56, height:24, background:`repeating-linear-gradient(90deg,#B84E10DD,#D4621AFF 10px,#B84E10DD 14px)`, transform:"rotate(4deg)", boxShadow:"0 2px 10px rgba(0,0,0,0.4)", zIndex:2 }} />

          <div style={{ marginBottom:"1.2rem" }}>
            <label style={{ fontFamily:BEBAS, letterSpacing:"0.16em", color:NAVY, fontSize:"0.8rem", display:"block", marginBottom:"0.4rem" }}>Your Name</label>
            <input className="input-poster" value={name} onChange={(e)=>setName(e.target.value)} onKeyDown={handleKey}
              placeholder="Enter your name..."
              maxLength={20} autoFocus
              style={{ background:"#FAFAF5", color:"#1A1208", border:`2px solid ${NAVY}`, fontFamily:DM, fontWeight:600, outline:"none", width:"100%", padding:"0.55rem 0.75rem", fontSize:"0.95rem", boxSizing:"border-box" }} />
          </div>

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

        {/* ── HOW TO PLAY ── */}
        <div style={{ position:"relative", transform:"rotate(-0.6deg)", alignSelf:"stretch" }}>
          <div style={{ background:MUSTARD, padding:"1.1rem 1.3rem 1.5rem", boxShadow:`5px 7px 0 ${NAVY}`, position:"relative", border:`3px solid #8A6800` }}>
            <TapeH color={TEAL} width={80} />
            <div style={{ fontFamily:BEBAS, letterSpacing:"0.14em", fontSize:"1rem", color:NAVY, marginBottom:"0.6rem", marginTop:"0.4rem" }}>HOW TO PLAY</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
              {GAME_STEPS.map((s) => (
                <div key={s.num} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start" }}>
                  <div style={{ fontFamily:BEBAS, fontSize:"1.3rem", color:"rgba(28,58,96,0.3)", lineHeight:1, flexShrink:0, marginTop:1 }}>{s.num}</div>
                  <div style={{ fontFamily:DM, fontSize:"0.82rem", color:"#1A1208", lineHeight:1.6 }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 500 16" style={{ display:"block", width:"100%", marginTop:-2 }} preserveAspectRatio="none">
            <path d="M0 0 L0 6 Q28 15 56 6 Q84 0 112 12 Q140 16 168 5 Q196 0 224 13 Q252 16 280 5 Q308 0 336 12 Q364 16 392 5 Q420 0 448 12 Q472 16 500 5 L500 0 Z" fill={MUSTARD}/>
          </svg>
        </div>

        {/* ── CANVAS TUTORIAL (collapsible) ── */}
        <div style={{ position:"relative", transform:"rotate(0.4deg)", alignSelf:"stretch" }}>
          <div style={{ background:"#FFFFFF", border:`3px solid ${NAVY}`, boxShadow:`5px 7px 0 ${TEAL}`, position:"relative" }}>
            {/* Header toggle */}
            <button onClick={()=>setTutOpen(v=>!v)}
              style={{ width:"100%", background:"none", border:"none", cursor:"pointer", padding:"0.85rem 1.2rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.7rem" }}>
                <span style={{ fontSize:20 }}>🎓</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontFamily:BEBAS, fontSize:"1rem", letterSpacing:"0.14em", color:NAVY }}>HOW TO USE THE CANVAS</div>
                  <div style={{ fontFamily:DM, fontSize:"0.7rem", color:"#8A7868" }}>Learn the controls before you play</div>
                </div>
              </div>
              <div style={{ fontFamily:BEBAS, fontSize:"1.2rem", color:NAVY, transform:tutOpen?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</div>
            </button>

            {/* Tape corner */}
            <div style={{ position:"absolute", top:-10, right:20, width:60, height:20, background:`repeating-linear-gradient(90deg,${TEAL}CC,${TEAL}FF 10px,${TEAL}CC 14px)`, transform:"rotate(3deg)", zIndex:2 }} />

            {tutOpen && (
              <div style={{ borderTop:`2px solid #F0E8D8`, padding:"0.85rem 1.2rem 1.2rem" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                  {TUTORIAL_STEPS.map((step) => (
                    <div key={step.title} style={{ display:"flex", gap:"0.85rem", alignItems:"flex-start" }}>
                      <div style={{ width:38, height:38, borderRadius:"50%", background:`${step.color}18`, border:`2px solid ${step.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                        {step.icon}
                      </div>
                      <div>
                        <div style={{ fontFamily:BEBAS, fontSize:"0.82rem", letterSpacing:"0.12em", color:step.color, marginBottom:2 }}>{step.title}</div>
                        <div style={{ fontFamily:DM, fontSize:"0.78rem", color:"#4A3C22", lineHeight:1.55 }}>{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shortcut quick ref */}
                <div style={{ marginTop:"1rem", padding:"0.7rem 0.9rem", background:"#FAFAF5", border:`1.5px solid #E8E2D8`, borderRadius:6 }}>
                  <div style={{ fontFamily:BEBAS, fontSize:"0.6rem", letterSpacing:"0.2em", color:ORANGE, marginBottom:8 }}>KEYBOARD SHORTCUTS</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px" }}>
                    {[
                      ["R","Add rectangle"],["T","Add text"],
                      ["Ctrl+D","Duplicate"],["Delete","Remove element"],
                      ["Escape","Deselect"],["Ctrl+Z","Undo move"],
                      ["← → ↑ ↓","Nudge 1px"],["Shift+Arrow","Nudge 10px"],
                    ].map(([key,desc]) => (
                      <div key={key} style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontFamily:DM, fontWeight:700, fontSize:"0.65rem", background:NAVY, color:"#FFFFFF", padding:"1px 5px", borderRadius:3, flexShrink:0 }}>{key}</span>
                        <span style={{ fontFamily:DM, fontSize:"0.65rem", color:"#8A7868" }}>{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
