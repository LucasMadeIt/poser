import type { RoomState } from "../types/game";

type Props = {
  room: RoomState;
  myPlayerId: string;
  amIHost: boolean;
  onPlayAgain: () => void;
};

const LOGO_STYLE: React.CSSProperties = {
  height: "36px",
  display: "block",
  filter: "brightness(0) invert(1)",
};

export function ResultsPage({ room, myPlayerId, amIHost, onPlayAgain }: Props) {
  const latestResult = room.results[room.results.length - 1];
  const imposter = room.players.find((p) => p.id === room.imposterId);
  const isEnded = room.phase === "ended";

  return (
    <div style={{ minHeight: "100vh", background: "#E8E2D9", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#2C2C2C", padding: "0.6rem 1.25rem", borderBottom: "2px solid #1a1a1a", display: "flex", alignItems: "center", gap: "1rem" }}>
        <img src="/poster-logo.png" alt="POSTER" style={LOGO_STYLE} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.12em", fontSize: "1.1rem", color: isEnded ? "#CC2200" : "#E8E2D9" }}>
          {isEnded ? "GAME OVER" : `ROUND ${room.round} RESULTS`}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2.5rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Imposter reveal */}
          {latestResult && (
            <div style={{ background: "#2C2C2C", border: "2px solid #1a1a1a", boxShadow: "6px 6px 0 rgba(0,0,0,0.2)", padding: "2rem" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.75rem", letterSpacing: "0.2em", color: "rgba(232,226,217,0.5)", marginBottom: "1rem" }}>
                THE IMPOSTER WAS...
              </div>
              {imposter && (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: imposter.color, boxShadow: `0 0 20px ${imposter.color}88`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: "#E8E2D9", lineHeight: 1 }}>
                      {imposter.name}
                    </div>
                    {imposter.id === myPlayerId && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#CC2200", fontWeight: 600, marginTop: "2px" }}>That was you!</div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "2rem",
                      color: latestResult.caught ? "#E87DBB" : "#3ECFCF",
                      lineHeight: 1,
                    }}>
                      {latestResult.caught ? "CAUGHT!" : "GOT AWAY!"}
                    </div>
                  </div>
                </div>
              )}

              {latestResult.feedback && (
                <div style={{ borderTop: "1px solid rgba(232,226,217,0.12)", paddingTop: "1rem" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem", letterSpacing: "0.12em", color: "#CC2200", marginBottom: "0.5rem" }}>
                    DESIGN CRITIQUE
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "rgba(232,226,217,0.8)", lineHeight: 1.55, margin: 0 }}>
                    {latestResult.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Vote breakdown */}
          {room.votes && Object.keys(room.votes).length > 0 && (
            <div style={{ background: "rgba(44,44,44,0.07)", border: "1px solid rgba(44,44,44,0.14)", padding: "1.25rem" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(44,44,44,0.5)", marginBottom: "0.75rem" }}>
                VOTE BREAKDOWN
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {room.players.map((player) => {
                  const votes = (room.voteTally ?? {})[player.id] ?? 0;
                  const isImp = player.id === room.imposterId;
                  return (
                    <div key={player.id} style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: player.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#2C2C2C", flex: 1, fontWeight: isImp ? 700 : 400 }}>
                        {player.name}
                        {isImp && <span style={{ color: "#CC2200" }}> ★</span>}
                      </span>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {Array.from({ length: votes }).map((_, i) => (
                          <div key={i} style={{ width: 10, height: 10, background: "#CC2200", borderRadius: "50%" }} />
                        ))}
                        {votes === 0 && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", color: "rgba(44,44,44,0.3)" }}>no votes</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Round history */}
          {room.results.length > 1 && (
            <div style={{ background: "rgba(44,44,44,0.05)", border: "1px solid rgba(44,44,44,0.1)", padding: "1rem 1.25rem" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(44,44,44,0.4)", marginBottom: "0.5rem" }}>
                ROUND HISTORY
              </div>
              {room.results.map((r) => {
                const imp = room.players.find((p) => p.id === r.imposterId);
                return (
                  <div key={r.round} style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "0.3rem" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.75rem", color: "rgba(44,44,44,0.4)", width: "24px" }}>R{r.round}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#2C2C2C", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.prompt}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#5C5C5C" }}>{imp?.name}</span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem", color: r.caught ? "#E87DBB" : "#3ECFCF" }}>{r.caught ? "CAUGHT" : "FREE"}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Game over / next round */}
          {isEnded ? (
            <div style={{ background: "#2C2C2C", border: "3px solid #CC2200", boxShadow: "6px 6px 0 #CC2200", padding: "1.75rem", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: "#E8E2D9", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                GAME OVER
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "rgba(232,226,217,0.6)", marginBottom: "1.5rem" }}>
                {room.results.filter((r) => r.caught).length} of {room.results.length} imposters were caught
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                {room.players.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#E8E2D9" }}>{p.name}</span>
                  </div>
                ))}
              </div>

              {amIHost ? (
                <button
                  onClick={onPlayAgain}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: "0.1em",
                    fontSize: "1.4rem",
                    color: "#E8E2D9",
                    background: "#CC2200",
                    border: "2px solid #A81B00",
                    boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
                    padding: "0.5rem 2.5rem",
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  PLAY AGAIN
                </button>
              ) : (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(232,226,217,0.4)" }}>
                  Waiting for host to start a new game...
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(44,44,44,0.45)", textAlign: "center" }}>
              Next round starting soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
