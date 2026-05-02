import { PosterWallBg, TapeH, TapeCorner } from "../components/PosterWallBg";
import type { RoomState } from "../types/game";

const BEBAS = "'Bebas Neue', sans-serif";
const DM = "'DM Sans', sans-serif";

type Props = {
  room: RoomState;
  mySocketId: string;
  myPlayerId: string;
  amIHost: boolean;
  onStart: () => void;
};

export function LobbyPage({ room, myPlayerId, amIHost, onStart }: Props) {
  return (
    <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <PosterWallBg />

      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:500, display:"flex", flexDirection:"column", gap:"1.25rem" }}>

        {/* ── LOGO small ── */}
        <div style={{ textAlign:"center" }}>
          <img src="/poster-logo.png" alt="POSTER" style={{ width:140, mixBlendMode:"normal", filter:"brightness(0) invert(1)", opacity:0.9, margin:"0 auto", display:"block" }} />
        </div>

        {/* ── ROOM CODE — big flyer card ── */}
        <div style={{ position:"relative" }}>
          <div style={{
            background:"#D4B84A",
            padding:"1.6rem 2rem 1.4rem",
            transform:"rotate(-0.9deg)",
            boxShadow:"6px 12px 40px rgba(0,0,0,0.7)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            position:"relative",
          }}>
            <TapeH color="#C4681A" width={88} />
            <div>
              <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.25em", color:"#6A5200", marginBottom:2 }}>ROOM CODE</div>
              <div style={{ fontFamily:BEBAS, fontSize:"3.5rem", letterSpacing:"0.45em", color:"#1A1410", lineHeight:1 }}>{room.id}</div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(room.id)}
              style={{
                fontFamily:BEBAS, fontSize:"0.85rem", letterSpacing:"0.14em",
                color:"#1A1410", background:"rgba(0,0,0,0.15)", border:"2px solid rgba(0,0,0,0.3)",
                padding:"0.35rem 0.9rem", cursor:"pointer",
              }}
            >
              Copy
            </button>
          </div>
          <svg viewBox="0 0 500 16" style={{ display:"block", width:"100%", marginTop:-2 }} preserveAspectRatio="none">
            <path d="M0 0 L0 6 Q28 15 56 6 Q84 0 112 12 Q140 16 168 5 Q196 0 224 13 Q252 16 280 5 Q308 0 336 12 Q364 16 392 5 Q420 0 448 12 Q472 16 500 5 L500 0 Z" fill="#D4B84A"/>
          </svg>
        </div>

        {/* ── PLAYERS — corkboard card ── */}
        <div style={{ position:"relative" }}>
          <div style={{
            background:"#1E1C18",
            border:"3px solid #0A0906",
            boxShadow:"6px 8px 0 rgba(0,0,0,0.65)",
            padding:"1.5rem 1.5rem 1.25rem",
            transform:"rotate(0.7deg)",
            position:"relative",
          }}>
            <TapeCorner color="#1A5888" corner="tl" />
            <TapeCorner color="#C4681A" corner="tr" />

            <div style={{ fontFamily:BEBAS, fontSize:"0.72rem", letterSpacing:"0.2em", color:"#5C5040", marginBottom:"0.85rem" }}>
              Players ({room.players.length}/5)
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem", marginBottom:"1.2rem" }}>
              {room.players.map((player) => {
                const isMe = player.id === myPlayerId;
                return (
                  <div key={player.id} style={{
                    display:"flex", alignItems:"center", gap:"0.75rem",
                    padding:"0.55rem 0.8rem",
                    background: isMe ? "rgba(212,184,74,0.1)" : "rgba(255,255,255,0.04)",
                    border: isMe ? "1px solid rgba(212,184,74,0.35)" : "1px solid rgba(255,255,255,0.08)",
                    transform: isMe ? "rotate(-0.4deg)" : "none",
                  }}>
                    <div style={{ width:11, height:11, borderRadius:"50%", background:player.color, flexShrink:0, boxShadow:`0 0 7px ${player.color}88` }} />
                    <span style={{ fontFamily:DM, color:"#EDE5CC", fontWeight:500, flex:1 }}>
                      {player.name}
                      {isMe && <span style={{ fontSize:"0.7rem", color:"rgba(237,229,204,0.45)", marginLeft:"0.4rem" }}>(you)</span>}
                    </span>
                    {player.isHost && (
                      <span style={{ fontFamily:BEBAS, fontSize:"0.68rem", letterSpacing:"0.1em", color:"#CC2200", background:"rgba(204,34,0,0.15)", padding:"0.12rem 0.45rem", border:"1px solid rgba(204,34,0,0.35)" }}>
                        HOST
                      </span>
                    )}
                  </div>
                );
              })}
              {Array.from({ length: 5 - room.players.length }).map((_, i) => (
                <div key={`empty-${i}`} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.55rem 0.8rem", background:"rgba(255,255,255,0.015)", border:"1px dashed rgba(255,255,255,0.08)", opacity:0.35 }}>
                  <div style={{ width:11, height:11, borderRadius:"50%", background:"rgba(237,229,204,0.2)" }} />
                  <span style={{ fontFamily:DM, color:"#EDE5CC", fontSize:"0.82rem" }}>Waiting for player…</span>
                </div>
              ))}
            </div>

            {amIHost ? (
              room.players.length >= 2 ? (
                <button
                  onClick={onStart}
                  style={{
                    width:"100%", fontFamily:BEBAS, fontSize:"1.6rem", letterSpacing:"0.14em",
                    color:"#EDE5CC", background:"#CC2200", border:"2px solid #8A1200",
                    boxShadow:"5px 5px 0 rgba(0,0,0,0.7)", padding:"0.55rem", cursor:"pointer",
                    transition:"transform 0.1s, box-shadow 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform="translate(-2px,-2px)"; e.currentTarget.style.boxShadow="7px 7px 0 rgba(0,0,0,0.7)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="5px 5px 0 rgba(0,0,0,0.7)"; }}
                >
                  ▶ START GAME
                </button>
              ) : (
                <div style={{ textAlign:"center", fontFamily:DM, fontSize:"0.85rem", color:"rgba(237,229,204,0.4)", padding:"0.75rem", border:"1px dashed rgba(237,229,204,0.18)" }}>
                  Need at least 2 players to start
                </div>
              )
            ) : (
              <div style={{ textAlign:"center", fontFamily:DM, fontSize:"0.85rem", color:"rgba(237,229,204,0.38)", padding:"0.75rem", border:"1px dashed rgba(237,229,204,0.14)" }}>
                Waiting for host to start…
              </div>
            )}
          </div>
        </div>

        {/* ── STATS ROW — sticky notes ── */}
        <div style={{ display:"flex", gap:"0.6rem", justifyContent:"center" }}>
          {[
            { n:"4", label:"Rounds" },
            { n:"2m", label:"Design" },
            { n:"90s", label:"Discuss" },
            { n:"45s", label:"Vote" },
          ].map(({ n, label }, i) => (
            <div key={label} style={{
              background: i % 2 === 0 ? "#F0E8D0" : "#D4B84A",
              padding:"0.55rem 0.9rem 0.6rem",
              transform:`rotate(${[-1.8, 1.2, -0.8, 2][i]}deg)`,
              boxShadow:"3px 5px 14px rgba(0,0,0,0.5)",
              textAlign:"center", flex:1,
            }}>
              <div style={{ fontFamily:BEBAS, fontSize:"1.8rem", color:"#CC2200", lineHeight:1 }}>{n}</div>
              <div style={{ fontFamily:DM, fontSize:"0.62rem", color:"#4A3C22", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:1 }}>{label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
