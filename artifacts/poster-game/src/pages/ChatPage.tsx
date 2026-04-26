import { useState, useRef, useEffect } from "react";
import type { RoomState, CanvasElement } from "../types/game";
import { Timer } from "../components/Timer";

type Props = {
  room: RoomState;
  myPlayerId: string;
  amIHost: boolean;
  onSend: (text: string) => void;
  onSkip: () => void;
};

const CANVAS_W = 500;
const CANVAS_H = 320;

function renderMiniElement(el: CanvasElement) {
  const scale = CANVAS_W / 900;
  const base: React.CSSProperties = {
    position: "absolute",
    left: el.x * scale,
    top: el.y * scale,
    width: el.width * scale,
    height: el.height * scale,
    zIndex: el.zIndex,
    boxSizing: "border-box",
    pointerEvents: "none",
  };

  if (el.type === "rect") return <div key={el.id} style={{ ...base, background: el.fill, border: el.stroke ? `1px solid ${el.stroke}` : "none" }} />;
  if (el.type === "circle") return <div key={el.id} style={{ ...base, background: el.fill, borderRadius: "50%" }} />;
  if (el.type === "divider") return <div key={el.id} style={{ ...base, height: Math.max(1, el.height * scale), background: el.fill }} />;
  if (el.type === "heading") return (
    <div key={el.id} style={{ ...base, fontFamily: "'Rubik Dirt', sans-serif", fontSize: Math.max(8, (el.fontSize ?? 36) * scale), color: el.fill, overflow: "hidden", userSelect: "none", display: "flex", alignItems: "center" }}>
      {el.content}
    </div>
  );
  if (el.type === "text") return (
    <div key={el.id} style={{ ...base, fontFamily: "'DM Sans', sans-serif", fontSize: Math.max(6, (el.fontSize ?? 14) * scale), color: el.fill, overflow: "hidden", userSelect: "none" }}>
      {el.content}
    </div>
  );
  if (el.type === "label") return (
    <div key={el.id} style={{ ...base, fontFamily: "'DM Sans', sans-serif", fontSize: Math.max(6, (el.fontSize ?? 12) * scale), color: "#2C2C2C", background: el.fill, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", userSelect: "none" }}>
      {el.content}
    </div>
  );
  if (el.type === "button") return (
    <div key={el.id} style={{ ...base, fontFamily: "'DM Sans', sans-serif", fontSize: Math.max(6, (el.fontSize ?? 14) * scale), color: "#E8E2D9", background: el.fill, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px", overflow: "hidden", userSelect: "none" }}>
      {el.content}
    </div>
  );
  return <div key={el.id} style={base} />;
}

export function ChatPage({ room, myPlayerId, amIHost, onSend, onSkip }: Props) {
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isImposter = room.myRole === "imposter";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room.messages.length]);

  function handleSend() {
    const t = draft.trim();
    if (!t) return;
    onSend(t);
    setDraft("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const myPlayer = room.players.find((p) => p.id === myPlayerId);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#E8E2D9", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ background: "#2C2C2C", display: "flex", alignItems: "center", gap: "1rem", padding: "0.6rem 1.25rem", flexShrink: 0, borderBottom: "2px solid #1a1a1a" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height: "34px", display: "block", filter: "brightness(0) invert(1)" }} />

        <div style={{ width: "1px", height: "24px", background: "rgba(232,226,217,0.2)" }} />

        <div>
          <div style={{ fontFamily: "'Rubik Dirt', sans-serif", letterSpacing: "0.12em", fontSize: "0.75rem", color: "#CC2200" }}>
            DISCUSSION PHASE
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(232,226,217,0.7)" }}>
            Round {room.round}/{room.maxRounds} · {room.prompt}
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
          {isImposter && (
            <div style={{ fontFamily: "'Rubik Dirt', sans-serif", fontSize: "0.75rem", letterSpacing: "0.12em", color: "#CC2200", border: "1px solid rgba(204,34,0,0.4)", padding: "0.2rem 0.6rem" }}>
              IMPOSTER — BLEND IN
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Rubik Dirt', sans-serif", fontSize: "0.6rem", color: "rgba(232,226,217,0.4)", letterSpacing: "0.1em" }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
          {amIHost && (
            <button onClick={onSkip} style={{ fontFamily: "'Rubik Dirt', sans-serif", letterSpacing: "0.08em", fontSize: "0.85rem", color: "#E8E2D9", background: "rgba(232,226,217,0.08)", border: "1px solid rgba(232,226,217,0.2)", padding: "0.35rem 0.75rem", cursor: "pointer" }}>
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Canvas preview */}
        <div style={{ width: "540px", flexShrink: 0, display: "flex", flexDirection: "column", padding: "1.25rem", borderRight: "2px solid rgba(44,44,44,0.15)", gap: "0.75rem" }}>
          <div style={{ fontFamily: "'Rubik Dirt', sans-serif", letterSpacing: "0.12em", fontSize: "0.75rem", color: "rgba(44,44,44,0.5)" }}>
            SUBMITTED DESIGN — WHO SABOTAGED IT?
          </div>
          <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, background: "#F8F4EE", border: "2px solid #2C2C2C", boxShadow: "4px 4px 0 rgba(0,0,0,0.12)", flexShrink: 0, overflow: "hidden" }}>
            {room.canvas.map((el) => renderMiniElement(el))}
            {room.canvas.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(44,44,44,0.25)" }}>Nothing was placed</span>
              </div>
            )}
          </div>

          {/* Player list */}
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {room.players.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(44,44,44,0.07)", border: "1px solid rgba(44,44,44,0.12)", padding: "0.3rem 0.6rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#2C2C2C", fontWeight: 500 }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontFamily: "'Rubik Dirt', sans-serif", letterSpacing: "0.12em", fontSize: "0.75rem", color: "rgba(44,44,44,0.4)", textAlign: "center", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(44,44,44,0.1)" }}>
              DISCUSS — WHO IS THE IMPOSTER?
            </div>

            {room.messages.map((msg) => {
              const isMine = msg.playerId === myPlayerId;
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", gap: "0.5rem", alignItems: "flex-end" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: msg.playerColor, flexShrink: 0, marginBottom: "4px" }} />
                  <div style={{ maxWidth: "70%" }}>
                    {!isMine && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", fontWeight: 600, color: msg.playerColor, marginBottom: "2px" }}>
                        {msg.playerName}
                      </div>
                    )}
                    <div style={{
                      background: isMine ? "#2C2C2C" : "rgba(44,44,44,0.08)",
                      color: isMine ? "#E8E2D9" : "#2C2C2C",
                      padding: "0.5rem 0.75rem",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.85rem",
                      lineHeight: 1.45,
                      border: "1px solid " + (isMine ? "#1a1a1a" : "rgba(44,44,44,0.12)"),
                    }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {room.messages.length === 0 && (
              <div style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(44,44,44,0.3)", marginTop: "2rem" }}>
                Be the first to speak. Who sabotaged the design?
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: "2px solid rgba(44,44,44,0.15)", padding: "0.75rem 1rem", display: "flex", gap: "0.5rem", flexShrink: 0, background: "#E8E2D9" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: myPlayer?.color ?? "#ccc", flexShrink: 0, alignSelf: "center" }} />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Say something... (Enter to send)"
              maxLength={300}
              rows={2}
              style={{
                flex: 1,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                color: "#2C2C2C",
                background: "rgba(44,44,44,0.06)",
                border: "1px solid rgba(44,44,44,0.2)",
                padding: "0.5rem 0.75rem",
                resize: "none",
                outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              style={{
                fontFamily: "'Rubik Dirt', sans-serif",
                letterSpacing: "0.1em",
                fontSize: "1rem",
                color: "#E8E2D9",
                background: "#CC2200",
                border: "none",
                padding: "0 1rem",
                cursor: "pointer",
                alignSelf: "stretch",
              }}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
