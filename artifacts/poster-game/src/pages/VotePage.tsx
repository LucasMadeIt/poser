import { useState, useEffect } from "react";
import type { RoomState } from "../types/game";
import type { VoteResult } from "../hooks/useGame";

type Props = {
  room: RoomState;
  myPlayerId: string;
  voteTally: Record<string, number>;
  onVote: (targetId: string) => void;
  voteResult: VoteResult | null;
};

const GRUNGE = "'Permanent Marker', cursive";

export function VotePage({ room, myPlayerId, voteTally, onVote, voteResult }: Props) {
  const myVote = room.votes?.[myPlayerId];
  const myPlayer = room.players.find((p) => p.id === myPlayerId);
  const isImposter = myPlayer?.isImposter ?? false;
  const [countdown, setCountdown] = useState(() => Math.max(0, Math.ceil((room.phaseEndTime - Date.now()) / 1000)));
  const [resultVisible, setResultVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((room.phaseEndTime - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(interval);
  }, [room.phaseEndTime]);

  useEffect(() => {
    if (voteResult) {
      const t = setTimeout(() => setResultVisible(true), 300);
      return () => clearTimeout(t);
    }
    setResultVisible(false);
    return undefined;
  }, [voteResult]);

  const totalVotes = Object.keys(room.votes ?? {}).length;
  const totalPlayers = room.players.length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,10,10,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: GRUNGE, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#CC2200", letterSpacing: "0.06em", lineHeight: 1, textShadow: "0 0 30px rgba(204,34,0,0.5)" }}>
          VOTE FOR THE IMPOSTER
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "rgba(232,226,217,0.5)", marginTop: "0.4rem" }}>
          {myVote ? `${totalVotes} of ${totalPlayers} players have voted` : "Select the player you think is the imposter"}
        </div>
        {isImposter && !voteResult && (
          <div style={{ fontFamily: GRUNGE, fontSize: "0.8rem", color: "#CC2200", border: "1px solid rgba(204,34,0,0.4)", padding: "0.25rem 0.75rem", borderRadius: 20, display: "inline-block", marginTop: "0.5rem" }}>
            Vote strategically to survive
          </div>
        )}
      </div>

      {/* Countdown */}
      {!voteResult && (
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: "4rem", lineHeight: 1, color: countdown <= 10 ? "#CC2200" : "#E8E2D9", textShadow: countdown <= 10 ? "0 0 20px rgba(204,34,0,0.7)" : "none", transition: "color 0.3s, text-shadow 0.3s" }}>
            {countdown}s
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", color: "rgba(232,226,217,0.3)", letterSpacing: "0.1em" }}>REMAINING</div>
        </div>
      )}

      {/* Vote result reveal */}
      {voteResult && (
        <div style={{ textAlign: "center", marginBottom: "2rem", opacity: resultVisible ? 1 : 0, transform: resultVisible ? "scale(1)" : "scale(0.8)", transition: "opacity 0.5s, transform 0.5s" }}>
          {voteResult.isTie ? (
            <div style={{ fontFamily: GRUNGE, fontSize: "2rem", color: "#F5A623", letterSpacing: "0.05em" }}>
              IT'S A TIE — no one eliminated!
            </div>
          ) : voteResult.wasImposter ? (
            <div>
              <div style={{ fontFamily: GRUNGE, fontSize: "1.2rem", color: "#3ECFCF", letterSpacing: "0.08em", marginBottom: 4 }}>
                {voteResult.imposterName} WAS THE IMPOSTER!
              </div>
              <div style={{ fontFamily: GRUNGE, fontSize: "2rem", color: "#3ECFCF", letterSpacing: "0.05em", textShadow: "0 0 30px rgba(62,207,207,0.6)" }}>
                DESIGNERS WIN! 🎉
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: GRUNGE, fontSize: "1.2rem", color: "#F5A623", letterSpacing: "0.08em", marginBottom: 4 }}>
                {room.players.find((p) => p.id === voteResult.eliminatedId)?.name ?? "That player"} was NOT the imposter 😬
              </div>
              <div style={{ fontFamily: GRUNGE, fontSize: "1.5rem", color: "#CC2200", letterSpacing: "0.05em", textShadow: "0 0 20px rgba(204,34,0,0.6)" }}>
                Imposter lives on...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player blobs */}
      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 720 }}>
        {room.players.map((player) => {
          const votes = voteTally[player.id] ?? 0;
          const isMe = player.id === myPlayerId;
          const isVotedByMe = myVote === player.id;
          const isEliminated = voteResult && voteResult.eliminatedId === player.id;
          const hasVoted = !!myVote;

          return (
            <div
              key={player.id}
              onClick={() => !isMe && !hasVoted && onVote(player.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.6rem",
                padding: "1.25rem 1rem",
                background: isVotedByMe ? "rgba(204,34,0,0.15)" : isMe ? "rgba(232,226,217,0.04)" : "rgba(232,226,217,0.06)",
                border: isEliminated ? "2px solid #F5A623" : isVotedByMe ? "2px solid #CC2200" : isMe ? "1px dashed rgba(232,226,217,0.15)" : "1px solid rgba(232,226,217,0.12)",
                borderRadius: 16,
                cursor: isMe || hasVoted ? "not-allowed" : "pointer",
                minWidth: 130,
                opacity: isMe ? 0.6 : 1,
                transform: isEliminated ? "scale(1.05)" : isVotedByMe ? "scale(1.02)" : "scale(1)",
                transition: "transform 0.3s, border-color 0.3s, background 0.3s",
                boxShadow: isVotedByMe ? "0 0 20px rgba(204,34,0,0.35)" : isEliminated ? "0 0 20px rgba(245,166,35,0.35)" : "none",
              }}
              onMouseEnter={(e) => { if (!isMe && !hasVoted) (e.currentTarget as HTMLElement).style.background = "rgba(204,34,0,0.12)"; }}
              onMouseLeave={(e) => { if (!isMe && !hasVoted) (e.currentTarget as HTMLElement).style.background = isVotedByMe ? "rgba(204,34,0,0.15)" : "rgba(232,226,217,0.06)"; }}
            >
              {/* Player blob avatar */}
              <div style={{ position: "relative", width: 56, height: 66 }}>
                <div style={{ width: 56, height: 56, background: player.color, borderRadius: "55% 55% 48% 48%", position: "absolute", bottom: 0, boxShadow: `0 0 16px ${player.color}66` }}>
                  {/* Eyes */}
                  <div style={{ position: "absolute", top: "26%", left: "16%", width: 12, height: 15, background: "white", borderRadius: "50%" }}>
                    <div style={{ position: "absolute", bottom: 2, right: 2, width: 6, height: 8, background: "#1a1a1a", borderRadius: "50%" }} />
                  </div>
                  <div style={{ position: "absolute", top: "26%", right: "16%", width: 12, height: 15, background: "white", borderRadius: "50%" }}>
                    <div style={{ position: "absolute", bottom: 2, left: 2, width: 6, height: 8, background: "#1a1a1a", borderRadius: "50%" }} />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 600, color: "#E8E2D9", textAlign: "center" }}>
                {player.name}
                {isMe && <span style={{ fontSize: "0.7rem", color: "rgba(232,226,217,0.5)" }}> (you)</span>}
              </div>

              {/* Vote count badge */}
              <div style={{ fontFamily: GRUNGE, fontSize: votes > 0 ? "1.5rem" : "1rem", color: votes > 0 ? "#CC2200" : "rgba(232,226,217,0.18)", lineHeight: 1, transition: "font-size 0.2s, color 0.2s" }}>
                {votes > 0 ? `${votes} vote${votes !== 1 ? "s" : ""}` : "·"}
              </div>

              {/* Voted indicator */}
              {isVotedByMe && (
                <div style={{ fontFamily: GRUNGE, fontSize: "0.65rem", color: "#CC2200", letterSpacing: "0.1em" }}>✓ YOUR VOTE</div>
              )}
              {isEliminated && (
                <div style={{ fontFamily: GRUNGE, fontSize: "0.65rem", color: "#F5A623", letterSpacing: "0.1em" }}>ELIMINATED</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom status */}
      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        {!myVote && !voteResult && (
          <>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", color: "rgba(232,226,217,0.4)", marginBottom: "0.5rem" }}>
              Click a player to cast your vote
            </div>
            <button onClick={() => onVote("")} style={{ fontFamily: GRUNGE, fontSize: "0.8rem", color: "rgba(232,226,217,0.5)", background: "none", border: "1px solid rgba(232,226,217,0.2)", padding: "0.3rem 1rem", cursor: "pointer", borderRadius: 20, letterSpacing: "0.06em" }}>
              Skip Vote
            </button>
          </>
        )}
        {myVote && !voteResult && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", color: "rgba(232,226,217,0.4)" }}>
            Waiting for other players… ({totalVotes}/{totalPlayers} voted)
          </div>
        )}
        {voteResult && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "rgba(232,226,217,0.3)" }}>
            Advancing to next phase…
          </div>
        )}
      </div>
    </div>
  );
}
