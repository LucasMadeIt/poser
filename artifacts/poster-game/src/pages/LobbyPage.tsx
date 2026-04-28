import type { RoomState } from "../types/game";

type Props = {
  room: RoomState;
  mySocketId: string;
  myPlayerId: string;
  amIHost: boolean;
  onStart: () => void;
};

export function LobbyPage({ room, myPlayerId, amIHost, onStart }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{ background: "#E8E2D9" }}
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="text-center mb-8">
          <img
            src="/poster-logo.png"
            alt="POSTER"
            style={{ width: "180px", margin: "0 auto", display: "block", mixBlendMode: "multiply", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))" }}
          />
        </div>

        <div style={{ background: "#2C2C2C", border: "2px solid #1a1a1a", boxShadow: "6px 6px 0 rgba(0,0,0,0.25)", padding: "2rem" }}>
          {/* Room code */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(232,226,217,0.2)" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em", color: "#E8E2D9", fontSize: "0.8rem", opacity: 0.6, marginBottom: "0.2rem" }}>
                Room Code
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", letterSpacing: "0.3em", color: "#CC2200", lineHeight: 1 }}>
                {room.id}
              </div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(room.id)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#E8E2D9", background: "rgba(232,226,217,0.1)", border: "1px solid rgba(232,226,217,0.2)", padding: "0.4rem 0.75rem", cursor: "pointer", letterSpacing: "0.05em" }}
            >
              Copy Code
            </button>
          </div>

          <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.12em", color: "#E8E2D9", fontSize: "0.85rem", marginBottom: "0.75rem", opacity: 0.7 }}>
            Players ({room.players.length}/5)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {room.players.map((player) => {
              const isMe = player.id === myPlayerId;
              return (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    background: isMe ? "rgba(232,226,217,0.1)" : "rgba(232,226,217,0.06)",
                    border: isMe ? "1px solid rgba(232,226,217,0.25)" : "1px solid rgba(232,226,217,0.12)",
                  }}
                >
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: player.color, flexShrink: 0, boxShadow: `0 0 6px ${player.color}66` }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#E8E2D9", fontWeight: 500, flex: 1 }}>
                    {player.name}
                    {isMe && <span style={{ fontSize: "0.7rem", color: "rgba(232,226,217,0.5)", marginLeft: "0.4rem" }}>(you)</span>}
                  </span>
                  {player.isHost && (
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem", letterSpacing: "0.1em", color: "#CC2200", background: "rgba(204,34,0,0.15)", padding: "0.15rem 0.4rem", border: "1px solid rgba(204,34,0,0.3)" }}>
                      Host
                    </span>
                  )}
                </div>
              );
            })}
            {Array.from({ length: 5 - room.players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "rgba(232,226,217,0.02)", border: "1px dashed rgba(232,226,217,0.1)", opacity: 0.4 }}
              >
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(232,226,217,0.2)" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#E8E2D9", fontSize: "0.85rem" }}>Waiting for player...</span>
              </div>
            ))}
          </div>

          {amIHost ? (
            room.players.length >= 2 ? (
              <button className="btn-poster" style={{ width: "100%", fontSize: "1.4rem" }} onClick={onStart}>
                Start Game
              </button>
            ) : (
              <div style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(232,226,217,0.5)", padding: "0.75rem", border: "1px dashed rgba(232,226,217,0.2)" }}>
                Need at least 2 players to start
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(232,226,217,0.4)", padding: "0.75rem", border: "1px dashed rgba(232,226,217,0.15)" }}>
              Waiting for host to start the game...
            </div>
          )}
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "2rem", justifyContent: "center" }}>
          {[
            { n: "4", label: "Rounds" },
            { n: "120s", label: "Design Phase" },
            { n: "90s", label: "Discussion" },
            { n: "45s", label: "Voting" },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#CC2200", lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", color: "#5C5C5C", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
