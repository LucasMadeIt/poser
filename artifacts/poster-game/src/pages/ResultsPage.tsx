import { PosterWallBg, TapeH, TapeCorner } from "../components/PosterWallBg";
import type { RoomState } from "../types/game";

const BEBAS = "'Bebas Neue', sans-serif";
const DM = "'DM Sans', sans-serif";

type Props = {
  room: RoomState;
  myPlayerId: string;
  amIHost: boolean;
  onPlayAgain: () => void;
};

export function ResultsPage({ room, myPlayerId, amIHost, onPlayAgain }: Props) {
  const latestResult = room.results[room.results.length - 1];
  const imposter = room.players.find((p) => p.id === room.imposterId);
  const isEnded = room.phase === "ended";

  return (
    <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden" }}>
      <PosterWallBg />

      {/* Header */}
      <div style={{ position:"relative", zIndex:20, background:"rgba(10,9,8,0.92)", borderBottom:"2px solid #1A1612", padding:"0.6rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem", backdropFilter:"blur(4px)" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height:34, filter:"brightness(0) invert(1)", opacity:0.9 }} />
        <div style={{ fontFamily:BEBAS, letterSpacing:"0.15em", fontSize:"1.15rem", color: isEnded ? "#CC2200" : "#D4B84A" }}>
          {isEnded ? "GAME OVER" : `ROUND ${room.round} RESULTS`}
        </div>
      </div>

      <div style={{ position:"relative", zIndex:10, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2.5rem 1.5rem 3rem" }}>
        <div style={{ width:"100%", maxWidth:620, display:"flex", flexDirection:"column", gap:"1.4rem" }}>

          {/* ── IMPOSTER REVEAL ── */}
          {latestResult && (
            <div style={{ position:"relative" }}>
              {/* BIG HEADLINE on torn paper */}
              <div style={{ position:"relative", background:"#F0E8D0", padding:"2rem 2.2rem 1.8rem", transform:"rotate(-0.7deg)", boxShadow:"8px 14px 48px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.4)" }}>
                <TapeH color="#C4681A" width={110} />

                <div style={{ fontFamily:BEBAS, fontSize:"0.72rem", letterSpacing:"0.28em", color:"#8A7850", marginBottom:"0.85rem" }}>
                  THE IMPOSTER WAS…
                </div>

                {imposter && (
                  <div style={{ display:"flex", alignItems:"center", gap:"1.25rem", marginBottom:"1.5rem" }}>
                    <div style={{ width:60, height:60, borderRadius:"50%", background:imposter.color, boxShadow:`0 0 24px ${imposter.color}88, 0 4px 16px rgba(0,0,0,0.5)`, flexShrink:0, border:"3px solid rgba(0,0,0,0.2)" }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:BEBAS, fontSize:"3rem", color:"#1A1410", lineHeight:1, letterSpacing:"0.04em" }}>
                        {imposter.name}
                      </div>
                      {imposter.id === myPlayerId && (
                        <div style={{ fontFamily:DM, fontSize:"0.85rem", color:"#CC2200", fontWeight:700, marginTop:2 }}>That was you!</div>
                      )}
                    </div>
                    <div style={{
                      fontFamily:BEBAS, fontSize:"2.2rem", lineHeight:1, letterSpacing:"0.04em",
                      color: latestResult.caught ? "#CC2200" : "#4A8C2A",
                      background: latestResult.caught ? "rgba(204,34,0,0.1)" : "rgba(74,140,42,0.1)",
                      border: `3px solid ${latestResult.caught ? "#CC2200" : "#4A8C2A"}`,
                      padding:"0.3rem 0.8rem",
                      transform: latestResult.caught ? "rotate(-3deg)" : "rotate(2deg)",
                    }}>
                      {latestResult.caught ? "CAUGHT!" : "GOT AWAY!"}
                    </div>
                  </div>
                )}

                {latestResult.feedback && (
                  <div style={{ borderTop:"2px dashed rgba(90,72,40,0.2)", paddingTop:"1rem" }}>
                    <div style={{ fontFamily:BEBAS, fontSize:"0.68rem", letterSpacing:"0.15em", color:"#CC2200", marginBottom:"0.5rem" }}>
                      DESIGN CRITIQUE
                    </div>
                    <p style={{ fontFamily:DM, fontSize:"0.92rem", color:"#4A3C22", lineHeight:1.6, margin:0, fontStyle:"italic" }}>
                      "{latestResult.feedback}"
                    </p>
                  </div>
                )}
              </div>
              {/* torn bottom edge */}
              <svg viewBox="0 0 620 18" style={{ display:"block", width:"100%", marginTop:-2, filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }} preserveAspectRatio="none">
                <path d="M0 0 L0 7 Q30 16 60 7 Q90 0 120 13 Q150 18 180 7 Q210 0 240 14 Q270 18 300 7 Q330 0 360 13 Q390 18 420 7 Q450 0 480 13 Q510 18 540 7 Q570 0 600 13 Q615 16 620 9 L620 0 Z" fill="#F0E8D0"/>
              </svg>
            </div>
          )}

          {/* ── VOTE BREAKDOWN ── */}
          {room.votes && Object.keys(room.votes).length > 0 && (
            <div style={{ position:"relative" }}>
              <div style={{ background:"#1E1C18", border:"3px solid #0A0906", boxShadow:"6px 8px 0 rgba(0,0,0,0.65)", padding:"1.25rem 1.5rem", transform:"rotate(0.5deg)", position:"relative" }}>
                <TapeCorner color="#1A5888" corner="tl" />
                <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.2em", color:"#5C5040", marginBottom:"0.85rem" }}>VOTE BREAKDOWN</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  {room.players.map((player) => {
                    const votes = (room.voteTally ?? {})[player.id] ?? 0;
                    const isImp = player.id === room.imposterId;
                    return (
                      <div key={player.id} style={{ display:"flex", alignItems:"center", gap:"0.7rem" }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:player.color, flexShrink:0, boxShadow:`0 0 5px ${player.color}88` }} />
                        <span style={{ fontFamily:DM, fontSize:"0.85rem", color: isImp ? "#EDE5CC" : "#8A7850", flex:1, fontWeight: isImp ? 700 : 400 }}>
                          {player.name}{isImp && <span style={{ color:"#CC2200" }}> ★ IMPOSTER</span>}
                        </span>
                        <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
                          {Array.from({ length:votes }).map((_, i) => (
                            <div key={i} style={{ width:10, height:10, background:"#CC2200", borderRadius:"50%", boxShadow:"0 0 4px rgba(204,34,0,0.5)" }} />
                          ))}
                          {votes === 0 && <span style={{ fontFamily:DM, fontSize:"0.7rem", color:"rgba(237,229,204,0.2)" }}>no votes</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── ROUND HISTORY ── */}
          {room.results.length > 1 && (
            <div style={{ position:"relative" }}>
              <div style={{ background:"rgba(14,12,10,0.7)", border:"1px solid rgba(237,229,204,0.08)", padding:"1rem 1.25rem", backdropFilter:"blur(4px)" }}>
                <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.2em", color:"#3a3020", marginBottom:"0.6rem" }}>ROUND HISTORY</div>
                {room.results.map((r) => {
                  const imp = room.players.find((p) => p.id === r.imposterId);
                  return (
                    <div key={r.round} style={{ display:"flex", alignItems:"center", gap:"0.75rem", paddingBottom:"0.3rem" }}>
                      <span style={{ fontFamily:BEBAS, fontSize:"0.75rem", color:"#3a3020", width:"24px" }}>R{r.round}</span>
                      <span style={{ fontFamily:DM, fontSize:"0.78rem", color:"#8A7850", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.prompt}</span>
                      <span style={{ fontFamily:DM, fontSize:"0.75rem", color:"#5C5040" }}>{imp?.name}</span>
                      <span style={{ fontFamily:BEBAS, fontSize:"0.7rem", color: r.caught ? "#CC2200" : "#4A8C2A", letterSpacing:"0.08em" }}>{r.caught ? "CAUGHT" : "FREE"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── GAME OVER / NEXT ROUND ── */}
          {isEnded ? (
            <div style={{ position:"relative" }}>
              <div style={{ background:"#1A1410", border:"4px solid #CC2200", boxShadow:"8px 8px 0 #8A1200", padding:"2rem", textAlign:"center", transform:"rotate(-0.5deg)", position:"relative" }}>
                <TapeH color="#C4681A" width={120} />
                <div style={{ fontFamily:BEBAS, fontSize:"3.5rem", color:"#EDE5CC", letterSpacing:"0.06em", marginBottom:"0.4rem", lineHeight:1 }}>
                  GAME OVER
                </div>
                <div style={{ fontFamily:DM, fontSize:"0.9rem", color:"#8A7850", marginBottom:"1.5rem" }}>
                  {room.results.filter((r) => r.caught).length} of {room.results.length} imposters were caught
                </div>
                <div style={{ display:"flex", justifyContent:"center", gap:"1.2rem", marginBottom:"1.75rem", flexWrap:"wrap" }}>
                  {room.players.map((p) => (
                    <div key={p.id} style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:p.color, boxShadow:`0 0 6px ${p.color}88` }} />
                      <span style={{ fontFamily:DM, fontSize:"0.85rem", color:"#EDE5CC" }}>{p.name}</span>
                    </div>
                  ))}
                </div>
                {amIHost ? (
                  <button
                    onClick={onPlayAgain}
                    style={{
                      fontFamily:BEBAS, letterSpacing:"0.12em", fontSize:"1.6rem",
                      color:"#EDE5CC", background:"#CC2200", border:"2px solid #8A1200",
                      boxShadow:"5px 5px 0 rgba(0,0,0,0.7)", padding:"0.5rem 3rem", cursor:"pointer",
                      transition:"transform 0.1s, box-shadow 0.1s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform="translate(-2px,-2px)"; e.currentTarget.style.boxShadow="7px 7px 0 rgba(0,0,0,0.7)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="5px 5px 0 rgba(0,0,0,0.7)"; }}
                  >
                    PLAY AGAIN
                  </button>
                ) : (
                  <div style={{ fontFamily:DM, fontSize:"0.8rem", color:"rgba(237,229,204,0.35)" }}>Waiting for host to start a new game…</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign:"center", fontFamily:BEBAS, fontSize:"0.9rem", letterSpacing:"0.15em", color:"#3a3020" }}>
              NEXT ROUND STARTING SOON…
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
