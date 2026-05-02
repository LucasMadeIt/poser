import { PosterWallBg, TapeH, TapeCorner } from "../components/PosterWallBg";
import type { RoomState } from "../types/game";

const BEBAS   = "'Bebas Neue', sans-serif";
const DM      = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";

type Props = {
  room: RoomState;
  mySocketId: string;
  myPlayerId: string;
  amIHost: boolean;
  onStart: () => void;
  onToggleChallenge: (enabled: boolean) => void;
};

export function LobbyPage({ room, myPlayerId, amIHost, onStart, onToggleChallenge }: Props) {
  const challengeOn = !!room.challengeMode;

  return (
    <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <PosterWallBg />

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:500, display:"flex", flexDirection:"column", gap:"1.2rem" }}>

        {/* ── LOGO ── */}
        <div style={{ alignSelf:"center", position:"relative" }}>
          <div style={{ position:"absolute", top:-12, left:"18%", width:76, height:22, background:`repeating-linear-gradient(90deg,#B84E10DD,#D4621AFF 10px,#B84E10DD 14px)`, transform:"rotate(-5deg)", boxShadow:"0 2px 12px rgba(0,0,0,0.5)", zIndex:2 }} />
          <div style={{ position:"absolute", top:-12, right:"18%", width:76, height:22, background:`repeating-linear-gradient(90deg,#1A5070DD,#206090FF 10px,#1A5070DD 14px)`, transform:"rotate(4deg)", boxShadow:"0 2px 12px rgba(0,0,0,0.5)", zIndex:2 }} />
          <img src="/poster-logo.png" alt="POSTER" style={{ width:310, display:"block", boxShadow:"4px 10px 40px rgba(0,0,0,0.6)", transform:"rotate(-0.6deg)" }} />
        </div>

        {/* ── ROOM CODE — mustard/yellow flyer ── */}
        <div style={{ position:"relative" }}>
          <div style={{ background:MUSTARD, padding:"1.5rem 2rem 1.3rem", transform:"rotate(-0.9deg)", boxShadow:`6px 8px 0 ${NAVY}`, display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", border:`3px solid #8A6800` }}>
            <TapeH color={ORANGE} width={92} />
            <div>
              <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.3em", color:NAVY, marginBottom:3 }}>ROOM CODE</div>
              <div style={{ fontFamily:BEBAS, fontSize:"3.4rem", letterSpacing:"0.45em", color:NAVY, lineHeight:1 }}>{room.id}</div>
            </div>
            <button onClick={()=>navigator.clipboard.writeText(room.id)}
              style={{ fontFamily:BEBAS, fontSize:"0.85rem", letterSpacing:"0.14em", color:NAVY, background:"rgba(28,58,96,0.14)", border:`2px solid ${NAVY}`, padding:"0.35rem 1rem", cursor:"pointer", boxShadow:"2px 2px 0 rgba(0,0,0,0.25)" }}>
              Copy
            </button>
          </div>
          <svg viewBox="0 0 500 16" style={{ display:"block", width:"100%", marginTop:-2 }} preserveAspectRatio="none">
            <path d="M0 0 L0 6 Q28 15 56 6 Q84 0 112 12 Q140 16 168 5 Q196 0 224 13 Q252 16 280 5 Q308 0 336 12 Q364 16 392 5 Q420 0 448 12 Q472 16 500 5 L500 0 Z" fill={MUSTARD}/>
          </svg>
        </div>

        {/* ── PLAYERS — white notice board ── */}
        <div style={{ position:"relative" }}>
          <div style={{ background:"#FFFFFF", border:`4px solid ${NAVY}`, boxShadow:`6px 8px 0 ${ORANGE}`, padding:"1.5rem 1.5rem 1.25rem", transform:"rotate(0.6deg)", position:"relative" }}>
            <TapeCorner color={TEAL}   corner="tl" />
            <TapeCorner color={ORANGE} corner="tr" />

            <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.2em", color:NAVY, marginBottom:"0.85rem" }}>
              Players ({room.players.length}/6)
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem", marginBottom:"1.2rem" }}>
              {room.players.map((player) => {
                const isMe = player.id === myPlayerId;
                return (
                  <div key={player.id} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.55rem 0.8rem", background:isMe?`${MUSTARD}25`:"#FAFAF5", border:isMe?`2px solid ${MUSTARD}`:`1px solid #E8E2D8`, transform:isMe?"rotate(-0.4deg)":"none" }}>
                    <div style={{ width:11, height:11, borderRadius:"50%", background:player.color, flexShrink:0, boxShadow:`0 0 7px ${player.color}88` }} />
                    <span style={{ fontFamily:DM, color:"#1A1208", fontWeight:isMe?700:500, flex:1 }}>
                      {player.name}
                      {isMe && <span style={{ fontSize:"0.7rem", color:"#8A7868", marginLeft:"0.4rem", fontWeight:400 }}>(you)</span>}
                    </span>
                    {player.isHost && (
                      <span style={{ fontFamily:BEBAS, fontSize:"0.68rem", letterSpacing:"0.1em", color:ORANGE, background:`${ORANGE}18`, padding:"0.12rem 0.5rem", border:`1.5px solid ${ORANGE}` }}>HOST</span>
                    )}
                  </div>
                );
              })}
              {Array.from({ length: 6-room.players.length }).map((_,i) => (
                <div key={`empty-${i}`} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.55rem 0.8rem", background:"#FAFAF5", border:"1.5px dashed #E8E2D8", opacity:0.45 }}>
                  <div style={{ width:11, height:11, borderRadius:"50%", background:"#E8E2D8" }} />
                  <span style={{ fontFamily:DM, color:"#8A7868", fontSize:"0.82rem" }}>Waiting for player…</span>
                </div>
              ))}
            </div>

            {/* ── CHALLENGE MODE TOGGLE (host only) ── */}
            {amIHost && (
              <div style={{ marginBottom:"1rem", padding:"0.75rem 0.9rem", background:challengeOn?`${ORANGE}10`:"#FAFAF5", border:`2px solid ${challengeOn?ORANGE:"#E8E2D8"}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem" }}>
                <div>
                  <div style={{ fontFamily:BEBAS, fontSize:"0.75rem", letterSpacing:"0.14em", color:challengeOn?ORANGE:NAVY }}>
                    ⚡ Challenge Mode
                  </div>
                  <div style={{ fontFamily:DM, fontSize:"0.7rem", color:"#8A7868", marginTop:1 }}>
                    {challengeOn ? "Random player gets a constraint each round" : "Enable for extra chaos each round"}
                  </div>
                </div>
                <button
                  onClick={() => onToggleChallenge(!challengeOn)}
                  style={{
                    width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                    background: challengeOn ? ORANGE : "#E8E2D8",
                    position: "relative", flexShrink: 0, transition: "background 0.2s",
                    boxShadow: challengeOn ? `inset 0 1px 4px rgba(0,0,0,0.2)` : "inset 0 1px 3px rgba(0,0,0,0.15)",
                  }}>
                  <div style={{
                    position:"absolute", top: 3, left: challengeOn ? 23 : 3,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#FFFFFF", boxShadow:"0 1px 4px rgba(0,0,0,0.25)",
                    transition: "left 0.2s",
                  }} />
                </button>
              </div>
            )}

            {/* Challenge mode visible to non-hosts */}
            {!amIHost && challengeOn && (
              <div style={{ marginBottom:"1rem", padding:"0.6rem 0.9rem", background:`${ORANGE}10`, border:`2px solid ${ORANGE}44`, display:"flex", alignItems:"center", gap:"0.6rem" }}>
                <span style={{ fontSize:16 }}>⚡</span>
                <div style={{ fontFamily:BEBAS, fontSize:"0.72rem", letterSpacing:"0.1em", color:ORANGE }}>CHALLENGE MODE ON</div>
                <div style={{ fontFamily:DM, fontSize:"0.68rem", color:"#8A7868", flex:1 }}>Random player constraint each round</div>
              </div>
            )}

            {amIHost ? (
              room.players.length >= 3 ? (
                <button onClick={onStart}
                  style={{ width:"100%", fontFamily:BEBAS, fontSize:"1.6rem", letterSpacing:"0.14em", color:"#FFFFFF", background:ORANGE, border:`3px solid #8A3008`, boxShadow:`5px 5px 0 ${NAVY}`, padding:"0.55rem", cursor:"pointer", transition:"transform 0.1s, box-shadow 0.1s" }}
                  onMouseEnter={(e)=>{e.currentTarget.style.transform="translate(-2px,-2px)";e.currentTarget.style.boxShadow=`7px 7px 0 ${NAVY}`;}}
                  onMouseLeave={(e)=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`5px 5px 0 ${NAVY}`;}}>
                  ▶ START GAME
                </button>
              ) : (
                <div style={{ textAlign:"center", fontFamily:DM, fontSize:"0.85rem", color:"#8A7868", padding:"0.75rem", border:`1.5px dashed #E8E2D8`, background:"#FAFAF5" }}>
                  Need at least 3 players to start
                </div>
              )
            ) : (
              <div style={{ textAlign:"center", fontFamily:DM, fontSize:"0.85rem", color:"#8A7868", padding:"0.75rem", border:`1.5px dashed #E8E2D8`, background:"#FAFAF5" }}>
                Waiting for host to start…
              </div>
            )}
          </div>
        </div>

        {/* ── STATS — sticky notes ── */}
        <div style={{ display:"flex", gap:"0.6rem", justifyContent:"center" }}>
          {[
            { n:"4",   label:"Rounds",  bg:"#FFFFFF",     rot:-1.8, border:NAVY    },
            { n:"5m",  label:"Design",  bg:MUSTARD,       rot:1.2,  border:"#8A6800" },
            { n:"90s", label:"Discuss", bg:"#FFFFFF",     rot:-0.8, border:TEAL    },
            { n:"45s", label:"Vote",    bg:ORANGE,        rot:2.0,  border:"#8A3008" },
          ].map(({ n, label, bg, rot, border }) => (
            <div key={label} style={{ background:bg, padding:"0.55rem 0.9rem 0.6rem", transform:`rotate(${rot}deg)`, boxShadow:`3px 5px 0 ${NAVY}`, textAlign:"center", flex:1, border:`2.5px solid ${border}` }}>
              <div style={{ fontFamily:BEBAS, fontSize:"1.8rem", color:bg===ORANGE?"#FFFFFF":NAVY, lineHeight:1 }}>{n}</div>
              <div style={{ fontFamily:DM, fontSize:"0.62rem", color:bg===ORANGE?"rgba(255,255,255,0.8)":"#4A3C22", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:1 }}>{label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
