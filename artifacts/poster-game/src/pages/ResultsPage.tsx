import type { RoomState } from "../types/game";

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
  const isImposter = room.myRole === "imposter";

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winner = isEnded ? sortedPlayers[0] : undefined;

  return (
    <div style={{ minHeight: "100vh", background: "#E8E2D9", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#2C2C2C", padding: "0.6rem 1.25rem", borderBottom: "2px solid #1a1a1a", display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#E8E2D9", letterSpacing: "0.06em", lineHeight: 1 }}>
          PO<span style={{ color: "#CC2200" }}>S</span>TER
        </span>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.12em", fontSize: "1.1rem", color: isEnded ? "#CC2200" : "#E8E2D9" }}>
          {isEnded ? "GAME OVER" : `ROUND ${room.round} RESULTS`}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "0", overflow: "hidden" }}>
        {/* Left: imposter reveal + round result */}
        <div style={{ flex: 1, padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", overflowY: "auto" }}>
          {/* Imposter reveal */}
          {latestResult && (
            <div style={{ background: "#2C2C2C", border: "2px solid #1a1a1a", boxShadow: "6px 6px 0 rgba(0,0,0,0.2)", padding: "1.75rem" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.75rem", letterSpacing: "0.15em", color: "rgba(232,226,217,0.5)", marginBottom: "0.75rem" }}>
                THE IMPOSTER WAS...
              </div>
              {imposter && (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: imposter.color, boxShadow: `0 0 16px ${imposter.color}88` }} />
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: "#E8E2D9", letterSpacing: "0.06em", lineHeight: 1 }}>
                      {imposter.name}
                    </div>
                    {imposter.id === myPlayerId && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#CC2200", fontWeight: 600 }}>That was you!</div>
                    )}
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.75rem",
                      color: latestResult.caught ? "#E87DBB" : "#3ECFCF",
                      letterSpacing: "0.05em",
                    }}>
                      {latestResult.caught ? "CAUGHT!" : "GOT AWAY!"}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(232,226,217,0.5)" }}>
                      {latestResult.caught ? "Crew +15 pts · Imposter -20 pts" : "Imposter +30 pts · Better luck next time"}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Feedback */}
              {latestResult.feedback && (
                <div style={{ borderTop: "1px solid rgba(232,226,217,0.12)", paddingTop: "1rem" }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem", letterSpacing: "0.12em", color: "#CC2200", marginBottom: "0.5rem" }}>
                    AI DESIGN CRITIQUE
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(232,226,217,0.8)", lineHeight: 1.55, margin: 0 }}>
                    {latestResult.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Vote tally */}
          {latestResult && room.votes && Object.keys(room.votes).length > 0 && (
            <div style={{ background: "rgba(44,44,44,0.07)", border: "1px solid rgba(44,44,44,0.12)", padding: "1rem 1.25rem" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(44,44,44,0.5)", marginBottom: "0.75rem" }}>
                VOTE BREAKDOWN
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {room.players.map((player) => {
                  const votes = (room.voteTally ?? {})[player.id] ?? 0;
                  const isImp = player.id === room.imposterId;
                  return (
                    <div key={player.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: player.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#2C2C2C", flex: 1 }}>
                        {player.name}
                        {isImp && <span style={{ color: "#CC2200", fontWeight: 700 }}> ★</span>}
                      </span>
                      <div style={{ display: "flex", gap: "3px" }}>
                        {Array.from({ length: votes }).map((_, i) => (
                          <div key={i} style={{ width: 12, height: 12, background: "#CC2200", borderRadius: "50%" }} />
                        ))}
                        {votes === 0 && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", color: "rgba(44,44,44,0.3)" }}>no votes</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Game winner (ended phase) */}
          {isEnded && winner && (
            <div style={{
              background: "#2C2C2C",
              border: "3px solid #CC2200",
              boxShadow: "6px 6px 0 #CC2200",
              padding: "1.5rem",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.75rem", letterSpacing: "0.2em", color: "#CC2200", marginBottom: "0.4rem" }}>
                WINNER
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: winner.color, boxShadow: `0 0 16px ${winner.color}88` }} />
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", color: "#E8E2D9", letterSpacing: "0.05em", lineHeight: 1 }}>
                  {winner.name}
                </div>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(232,226,217,0.6)", marginTop: "0.4rem" }}>
                {winner.id === myPlayerId ? "That's you!" : ""}
              </div>

              {amIHost && (
                <button
                  onClick={onPlayAgain}
                  style={{
                    marginTop: "1.25rem",
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: "0.1em",
                    fontSize: "1.4rem",
                    color: "#E8E2D9",
                    background: "#CC2200",
                    border: "2px solid #A81B00",
                    boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
                    padding: "0.5rem 2rem",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                  }}
                >
                  PLAY AGAIN
                </button>
              )}
              {!amIHost && (
                <div style={{ marginTop: "1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(232,226,217,0.4)" }}>
                  Waiting for host to start a new game...
                </div>
              )}
            </div>
          )}

          {!isEnded && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(44,44,44,0.5)", textAlign: "center" }}>
              Next round starting soon...
            </div>
          )}
        </div>

        {/* Right: Scoreboard */}
        <div style={{ width: "260px", background: "#2C2C2C", borderLeft: "2px solid #1a1a1a", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.75rem", letterSpacing: "0.15em", color: "rgba(232,226,217,0.5)", marginBottom: "0.5rem" }}>
            LEADERBOARD
          </div>
          {sortedPlayers.map((player, rank) => {
            const roundScore = latestResult?.scores[player.id] ?? 0;
            const isMe = player.id === myPlayerId;
            const isImp = player.id === room.imposterId;
            return (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.6rem 0.75rem",
                  background: isMe ? "rgba(232,226,217,0.1)" : "rgba(232,226,217,0.04)",
                  border: isMe ? "1px solid rgba(232,226,217,0.2)" : "1px solid rgba(232,226,217,0.06)",
                }}
              >
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: rank === 0 ? "#F5A623" : "rgba(232,226,217,0.3)", width: "18px", textAlign: "center" }}>
                  {rank + 1}
                </div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: player.color, flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#E8E2D9", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {player.name}
                    {isImp && <span style={{ color: "#CC2200" }}> ★</span>}
                  </div>
                  {roundScore !== 0 && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", color: roundScore > 0 ? "#3ECFCF" : "#CC2200" }}>
                      {roundScore > 0 ? "+" : ""}{roundScore} this round
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: "#E8E2D9", letterSpacing: "0.03em" }}>
                  {player.score}
                </div>
              </div>
            );
          })}

          {/* Round history */}
          {room.results.length > 0 && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(232,226,217,0.1)" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(232,226,217,0.35)", marginBottom: "0.5rem" }}>
                ROUND HISTORY
              </div>
              {room.results.map((r) => (
                <div key={r.round} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.65rem", color: "rgba(232,226,217,0.35)" }}>R{r.round}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", color: "rgba(232,226,217,0.4)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.prompt}</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.65rem", color: r.caught ? "#E87DBB" : "#3ECFCF" }}>{r.caught ? "CAUGHT" : "FREE"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
