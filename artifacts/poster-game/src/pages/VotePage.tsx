import type { RoomState } from "../types/game";
import { Timer } from "../components/Timer";

type Props = {
  room: RoomState;
  myPlayerId: string;
  voteTally: Record<string, number>;
  onVote: (targetId: string) => void;
};

export function VotePage({ room, myPlayerId, voteTally, onVote }: Props) {
  const myVote = room.votes?.[myPlayerId];
  const isImposter = room.myRole === "imposter";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#E8E2D9" }}>
      {/* Top bar */}
      <div style={{ background: "#2C2C2C", display: "flex", alignItems: "center", gap: "1rem", padding: "0.6rem 1.25rem", borderBottom: "2px solid #1a1a1a" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#E8E2D9", letterSpacing: "0.06em", lineHeight: 1 }}>
          PO<span style={{ color: "#CC2200" }}>S</span>TER
        </span>
        <div style={{ width: "1px", height: "24px", background: "rgba(232,226,217,0.2)" }} />
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.12em", fontSize: "1.1rem", color: "#CC2200" }}>
          VOTING PHASE
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
          {isImposter && (
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.75rem", letterSpacing: "0.12em", color: "#CC2200", border: "1px solid rgba(204,34,0,0.4)", padding: "0.2rem 0.6rem" }}>
              IMPOSTER — VOTE STRATEGICALLY
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.6rem", color: "rgba(232,226,217,0.4)", letterSpacing: "0.1em" }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "2.5rem 1.5rem", gap: "2rem" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", letterSpacing: "0.08em", color: "#2C2C2C", lineHeight: 1 }}>
            WHO IS THE IMPOSTER?
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#5C5C5C", marginTop: "0.4rem" }}>
            Vote for the player who sabotaged the design
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", maxWidth: "700px" }}>
          {room.players.map((player) => {
            const votes = voteTally[player.id] ?? 0;
            const isMe = player.id === myPlayerId;
            const isVotedByMe = myVote === player.id;

            return (
              <button
                key={player.id}
                onClick={() => !isMe && onVote(player.id)}
                disabled={isMe}
                style={{
                  width: "160px",
                  padding: "1.25rem 1rem",
                  background: isVotedByMe ? "#2C2C2C" : isMe ? "rgba(44,44,44,0.04)" : "#2C2C2C",
                  border: isVotedByMe
                    ? "3px solid #CC2200"
                    : isMe
                    ? "2px dashed rgba(44,44,44,0.2)"
                    : "2px solid #2C2C2C",
                  boxShadow: isVotedByMe ? "4px 4px 0 #CC2200" : isMe ? "none" : "4px 4px 0 rgba(0,0,0,0.15)",
                  cursor: isMe ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.15s",
                  opacity: isMe ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isMe) e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: player.color, boxShadow: `0 0 12px ${player.color}66` }} />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 600, color: isMe ? "#2C2C2C" : "#E8E2D9" }}>
                  {player.name}
                  {isMe && <span style={{ fontSize: "0.7rem", color: "#5C5C5C" }}> (you)</span>}
                </div>
                {player.isHost && (
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", color: "#CC2200" }}>HOST</div>
                )}

                {/* Vote count */}
                {myVote && (
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
                    color: votes > 0 ? "#CC2200" : "rgba(232,226,217,0.2)",
                    letterSpacing: "0.05em",
                  }}>
                    {votes} {votes === 1 ? "vote" : "votes"}
                  </div>
                )}

                {isVotedByMe && (
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.65rem", letterSpacing: "0.12em", color: "#CC2200" }}>
                    ✓ YOUR VOTE
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!myVote && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#5C5C5C", background: "rgba(204,34,0,0.07)", border: "1px solid rgba(204,34,0,0.2)", padding: "0.5rem 1rem" }}>
            You haven't voted yet — click a player to cast your vote
          </div>
        )}

        {myVote && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#5C5C5C" }}>
            {Object.keys(room.votes ?? {}).length} of {room.players.length} players have voted
          </div>
        )}
      </div>
    </div>
  );
}
