import { useState } from "react";

type Props = {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  error: string;
};

export function LandingPage({ onCreateRoom, onJoinRoom, error }: Props) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");

  function handleCreate() {
    if (!name.trim()) return;
    onCreateRoom(name.trim());
  }

  function handleJoin() {
    if (!name.trim() || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), name.trim());
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (mode === "create") handleCreate();
      else handleJoin();
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#E8E2D9" }}
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="inline-block relative mb-2">
            <span
              style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: "clamp(4rem, 12vw, 7rem)",
                letterSpacing: "0.06em",
                color: "#2C2C2C",
                lineHeight: 1,
                display: "block",
                textShadow: "4px 4px 0 rgba(0,0,0,0.12)",
              }}
            >
              PO
              <span style={{ color: "#CC2200" }}>S</span>
              TER
            </span>
          </div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.9rem",
              color: "#5C5C5C",
              fontWeight: 400,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            The design imposter game
          </p>
        </div>

        <div
          style={{
            background: "#2C2C2C",
            border: "2px solid #1a1a1a",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.25)",
            padding: "2rem",
          }}
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.1em",
                color: "#E8E2D9",
                fontSize: "0.85rem",
                display: "block",
                marginBottom: "0.4rem",
              }}
            >
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
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "0",
              marginBottom: "1.5rem",
              border: "2px solid #E8E2D9",
            }}
          >
            <button
              onClick={() => setMode("create")}
              style={{
                flex: 1,
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.08em",
                fontSize: "1rem",
                padding: "0.5rem",
                background: mode === "create" ? "#E8E2D9" : "transparent",
                color: mode === "create" ? "#2C2C2C" : "#E8E2D9",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Create Room
            </button>
            <button
              onClick={() => setMode("join")}
              style={{
                flex: 1,
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.08em",
                fontSize: "1rem",
                padding: "0.5rem",
                background: mode === "join" ? "#E8E2D9" : "transparent",
                color: mode === "join" ? "#2C2C2C" : "#E8E2D9",
                border: "none",
                borderLeft: "2px solid #E8E2D9",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Join Room
            </button>
          </div>

          {mode === "join" && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.1em",
                  color: "#E8E2D9",
                  fontSize: "0.85rem",
                  display: "block",
                  marginBottom: "0.4rem",
                }}
              >
                Room Code
              </label>
              <input
                className="input-poster"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={handleKey}
                placeholder="6-LETTER CODE"
                maxLength={6}
                style={{ textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700 }}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#CC2200",
                color: "#E8E2D9",
                padding: "0.5rem 0.75rem",
                marginBottom: "1rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn-poster"
            style={{ width: "100%", fontSize: "1.3rem" }}
            onClick={mode === "create" ? handleCreate : handleJoin}
          >
            {mode === "create" ? "Create Room" : "Join Room"}
          </button>
        </div>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem 1.25rem",
            background: "rgba(44,44,44,0.06)",
            border: "1px solid rgba(44,44,44,0.15)",
          }}
        >
          <p
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.1em",
              fontSize: "0.9rem",
              color: "#CC2200",
              marginBottom: "0.5rem",
            }}
          >
            How to Play
          </p>
          <ul
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              color: "#5C5C5C",
              lineHeight: 1.6,
              margin: 0,
              paddingLeft: "1rem",
            }}
          >
            <li>2–5 players collaborate on a design brief</li>
            <li>One player is secretly the imposter saboteur</li>
            <li>After each round, discuss and vote who the imposter is</li>
            <li>AI scores the design — the imposter tries to stay hidden</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
