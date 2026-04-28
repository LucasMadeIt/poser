import { useState, useRef, useEffect } from "react";
import type { RoomState, CanvasElement } from "../types/game";
import type { VoteResult } from "../hooks/useGame";
import { Timer } from "../components/Timer";

const BEBAS = "'Bebas Neue', sans-serif";
const DM = "'DM Sans', sans-serif";

const MINI_W = 484;
const MINI_SCALE = MINI_W / 900;
const MINI_H = Math.round(560 * MINI_SCALE);

type Props = {
  room: RoomState;
  myPlayerId: string;
  amIHost: boolean;
  onSend: (text: string) => void;
  onSkip: () => void;
  voteTally: Record<string, number>;
  onVote: (targetId: string) => void;
  voteResult: VoteResult | null;
  typingPlayers: Record<string, number>;
  emitTyping: () => void;
};

function renderMiniElement(el: CanvasElement) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: el.x * MINI_SCALE,
    top: el.y * MINI_SCALE,
    width: el.width * MINI_SCALE,
    height: el.height * MINI_SCALE,
    zIndex: el.zIndex,
    boxSizing: "border-box",
    pointerEvents: "none",
  };
  if (el.type === "rect") return <div key={el.id} style={{ ...base, background: el.fill, border: el.stroke ? `1px solid ${el.stroke}` : "none" }} />;
  if (el.type === "circle") return <div key={el.id} style={{ ...base, background: el.fill, borderRadius: "50%" }} />;
  if (el.type === "divider") return <div key={el.id} style={{ ...base, height: Math.max(1, el.height * MINI_SCALE), background: el.fill }} />;
  if (el.type === "heading") return (
    <div key={el.id} style={{ ...base, fontFamily: BEBAS, fontSize: Math.max(8, (el.fontSize ?? 36) * MINI_SCALE), color: el.fill, overflow: "hidden", userSelect: "none", display: "flex", alignItems: "center" }}>
      {el.content}
    </div>
  );
  if (el.type === "text") return (
    <div key={el.id} style={{ ...base, fontFamily: DM, fontSize: Math.max(6, (el.fontSize ?? 14) * MINI_SCALE), color: el.fill, overflow: "hidden", userSelect: "none" }}>
      {el.content}
    </div>
  );
  if (el.type === "label") return (
    <div key={el.id} style={{ ...base, fontFamily: DM, fontSize: Math.max(6, (el.fontSize ?? 12) * MINI_SCALE), color: "#2C2C2C", background: el.fill, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", userSelect: "none" }}>
      {el.content}
    </div>
  );
  if (el.type === "button") return (
    <div key={el.id} style={{ ...base, fontFamily: DM, fontSize: Math.max(6, (el.fontSize ?? 14) * MINI_SCALE), color: "#E8E2D9", background: el.fill, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px", overflow: "hidden", userSelect: "none" }}>
      {el.content}
    </div>
  );
  return <div key={el.id} style={base} />;
}

export function ChatPage({
  room,
  myPlayerId,
  amIHost,
  onSend,
  onSkip,
  voteTally,
  onVote,
  voteResult,
  typingPlayers,
  emitTyping,
}: Props) {
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isVotePhase = room.phase === "vote";
  const isImposter = room.myRole === "imposter";
  const myVote = room.votes?.[myPlayerId];

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room.messages.length]);

  function handleSend() {
    const t = draft.trim();
    if (!t || isVotePhase) return;
    onSend(t);
    setDraft("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const typingList = Object.entries(typingPlayers)
    .filter(([id, time]) => id !== myPlayerId && now - time < 2000)
    .map(([id]) => room.players.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#141414", overflow: "hidden", color: "#E8E2D9" }}>

      {/* TOP BAR */}
      <div style={{ background: "#0e0e0e", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", padding: "0 1.25rem", height: 50, flexShrink: 0, gap: "1rem" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height: 32, filter: "brightness(0) invert(1)", opacity: 0.9 }} />
        <div style={{ width: 1, height: 22, background: "#2a2a2a" }} />
        <div>
          <div style={{ fontFamily: BEBAS, fontSize: "0.75rem", letterSpacing: "0.2em", color: isVotePhase ? "#CC2200" : "#E87DBB", lineHeight: 1.2 }}>
            {isVotePhase ? "VOTE PHASE" : "DISCUSSION PHASE"}
          </div>
          <div style={{ fontFamily: DM, fontSize: "0.72rem", color: "rgba(232,226,217,0.45)", lineHeight: 1.2 }}>
            Round {room.round}/{room.maxRounds} · {room.prompt}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.9rem" }}>
          {isImposter && (
            <div style={{ fontFamily: BEBAS, fontSize: "0.72rem", letterSpacing: "0.14em", color: "#CC2200", border: "1px solid rgba(204,34,0,0.4)", padding: "0.2rem 0.65rem" }}>
              IMPOSTER — BLEND IN
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: BEBAS, fontSize: "0.5rem", color: "rgba(232,226,217,0.3)", letterSpacing: "0.2em", lineHeight: 1 }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
          {amIHost && !isVotePhase && (
            <button onClick={onSkip} style={{ fontFamily: BEBAS, fontSize: "0.85rem", letterSpacing: "0.1em", color: "#E8E2D9", background: "rgba(232,226,217,0.06)", border: "1px solid rgba(232,226,217,0.15)", padding: "0.28rem 0.75rem", cursor: "pointer" }}>
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT PANEL — canvas + voting */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #2a2a2a" }}>

          {/* Canvas preview */}
          <div style={{ padding: "0.9rem 1.1rem 0.6rem", flexShrink: 0 }}>
            <div style={{ fontFamily: BEBAS, fontSize: "0.72rem", letterSpacing: "0.2em", color: "#484848", marginBottom: 7 }}>
              SUBMITTED DESIGN — WHO SABOTAGED IT?
            </div>
            <div style={{ position: "relative", width: MINI_W, height: MINI_H, background: "#F8F4EE", border: "2px solid #2a2a2a", overflow: "hidden" }}>
              {room.canvas.map((el) => renderMiniElement(el))}
              {room.canvas.length === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: DM, fontSize: "0.8rem", color: "rgba(44,44,44,0.3)" }}>Nothing was placed</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "#2a2a2a", margin: "0 1.1rem", flexShrink: 0 }} />

          {/* VOTING SECTION */}
          <div style={{ flex: 1, overflow: "auto", padding: "0.75rem 1.1rem 1rem" }}>
            <div style={{ fontFamily: BEBAS, fontSize: "1.35rem", color: "#CC2200", letterSpacing: "0.08em", lineHeight: 1 }}>
              VOTE — WHO IS THE IMPOSTER?
            </div>
            <div style={{ fontFamily: DM, fontSize: "0.75rem", color: "#555", marginTop: 2, marginBottom: 14 }}>
              {isVotePhase ? "Click a player to cast your vote" : "🔒 Voting opens when discussion ends"}
            </div>

            {/* Voting cards */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {room.players.map((player) => {
                const votes = voteTally[player.id] ?? 0;
                const isMe = player.id === myPlayerId;
                const isVotedByMe = myVote === player.id;
                const hasVoted = !!myVote;
                const isActive = isVotePhase && !isMe && !hasVoted;
                const isGreyed = !isVotePhase || isMe || (hasVoted && !isVotedByMe);

                return (
                  <div
                    key={player.id}
                    title={!isVotePhase ? "Voting opens when discussion ends" : undefined}
                    onClick={() => isActive && onVote(player.id)}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 14px",
                      background: isVotedByMe ? "rgba(204,34,0,0.12)" : "rgba(255,255,255,0.03)",
                      border: isVotedByMe ? `2px solid ${player.color}` : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      cursor: isActive ? "pointer" : "default",
                      opacity: isGreyed ? 0.35 : 1,
                      transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
                      transform: isVotedByMe ? "translateY(-3px)" : "none",
                      boxShadow: isVotedByMe ? `0 6px 18px ${player.color}44` : "none",
                      minWidth: 72,
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) {
                        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 14px ${player.color}33`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isVotedByMe) {
                        (e.currentTarget as HTMLDivElement).style.transform = "none";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                      }
                    }}
                  >
                    {/* Vote badge */}
                    {votes > 0 && (
                      <div style={{ position: "absolute", top: -7, right: -7, background: "#CC2200", color: "#fff", fontSize: 10, fontFamily: DM, fontWeight: 700, padding: "1px 5px", borderRadius: 12, minWidth: 18, textAlign: "center", zIndex: 1 }}>
                        {votes}
                      </div>
                    )}

                    {/* Avatar circle */}
                    <div style={{ position: "relative", width: 44, height: 44, borderRadius: "50%", background: player.color, boxShadow: `0 0 8px ${player.color}66`, flexShrink: 0 }}>
                      {isVotedByMe && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", borderRadius: "50%", fontSize: 20, color: "#fff", fontWeight: 700 }}>
                          ✓
                        </div>
                      )}
                      {!isVotePhase && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", borderRadius: "50%", fontSize: 14 }}>
                          🔒
                        </div>
                      )}
                    </div>

                    <div style={{ fontFamily: DM, fontSize: "0.7rem", color: "#aaa", textAlign: "center", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {player.name}{isMe ? " (you)" : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Skip vote */}
            {isVotePhase && !myVote && (
              <div style={{ textAlign: "right", marginTop: 10 }}>
                <button
                  onClick={() => onVote("")}
                  style={{ background: "none", border: "none", color: "#444", fontFamily: DM, fontSize: "0.78rem", cursor: "pointer", textDecoration: "underline" }}
                >
                  Skip vote (abstain)
                </button>
              </div>
            )}

            {/* Vote cast confirmation */}
            {myVote && !voteResult && (
              <div style={{ fontFamily: DM, fontSize: "0.8rem", color: "#3ECFCF", marginTop: 10 }}>
                Vote cast ✓ — waiting for others ({Object.keys(room.votes ?? {}).length}/{room.players.length})
              </div>
            )}

            {/* Vote result */}
            {voteResult && (
              <div style={{ marginTop: 14, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid #2a2a2a", borderRadius: 8 }}>
                {voteResult.wasImposter ? (
                  <>
                    <div style={{ fontFamily: BEBAS, fontSize: "1.5rem", color: "#3ECFCF", letterSpacing: "0.06em", lineHeight: 1.1 }}>
                      {voteResult.imposterName} WAS THE IMPOSTER! 🎉
                    </div>
                    <div style={{ fontFamily: BEBAS, fontSize: "1rem", color: "#3ECFCF", letterSpacing: "0.05em", marginTop: 2 }}>
                      DESIGNERS WIN THIS ROUND!
                    </div>
                  </>
                ) : voteResult.isTie ? (
                  <div style={{ fontFamily: BEBAS, fontSize: "1.3rem", color: "#F5A623", letterSpacing: "0.06em" }}>
                    IT'S A TIE — no one was eliminated 😬
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: BEBAS, fontSize: "1.3rem", color: "#F5A623", letterSpacing: "0.06em", lineHeight: 1.1 }}>
                      {room.players.find((p) => p.id === voteResult.eliminatedId)?.name ?? "That player"} WAS NOT THE IMPOSTER 😬
                    </div>
                    <div style={{ fontFamily: DM, fontSize: "0.8rem", color: "#555", marginTop: 4 }}>
                      The imposter is still among you...
                    </div>
                  </>
                )}
                <div style={{ fontFamily: DM, fontSize: "0.72rem", color: "#444", marginTop: 8 }}>
                  Advancing to next phase…
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — player list + chat */}
        <div style={{
          width: 292,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "#1a1a1a",
          boxShadow: !isVotePhase ? "0 0 24px rgba(255,255,255,0.04) inset" : "none",
          border: !isVotePhase ? "1px solid rgba(255,255,255,0.06)" : "1px solid #1a1a1a",
          borderTop: "none",
          borderBottom: "none",
        }}>

          {/* Player list */}
          <div style={{ borderBottom: "1px solid #2a2a2a", padding: "0.75rem 0.9rem 0.7rem", flexShrink: 0 }}>
            <div style={{ fontFamily: BEBAS, fontSize: "0.65rem", letterSpacing: "0.25em", color: "#3a3a3a", marginBottom: 8 }}>PLAYERS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {room.players.map((player) => (
                <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 8, opacity: player.eliminated ? 0.3 : 1 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: player.color, boxShadow: `0 0 6px ${player.color}55` }} />
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: "#4CAF50", border: "1.5px solid #1a1a1a" }} />
                  </div>
                  <span style={{
                    fontFamily: DM,
                    fontSize: "0.78rem",
                    color: player.eliminated ? "#3a3a3a" : (player.id === myPlayerId ? "#E8E2D9" : "#b0b0b0"),
                    fontWeight: player.id === myPlayerId ? 600 : 400,
                    textDecoration: player.eliminated ? "line-through" : "none",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {player.name}
                    {player.id === myPlayerId && (
                      <span style={{ color: "#444", fontWeight: 400 }}> (you)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat header */}
          <div style={{ borderBottom: "1px solid #2a2a2a", padding: "0.55rem 0.9rem", flexShrink: 0 }}>
            <div style={{ fontFamily: BEBAS, fontSize: "1.15rem", color: "#CC2200", letterSpacing: "0.1em", lineHeight: 1 }}>
              DISCUSS — WHO IS THE IMPOSTER?
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.7rem 0.9rem", display: "flex", flexDirection: "column", gap: 9 }}>
            {room.messages.length === 0 && (
              <div style={{ textAlign: "center", fontFamily: DM, fontSize: "0.75rem", color: "#333", marginTop: "1.2rem" }}>
                No messages yet. Be the first to speak!
              </div>
            )}

            {room.messages.map((msg) => {
              const isMine = msg.playerId === myPlayerId;
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", gap: 6, alignItems: "flex-end" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: msg.playerColor, flexShrink: 0, boxShadow: `0 0 5px ${msg.playerColor}55` }} />
                  <div style={{ maxWidth: "80%" }}>
                    {!isMine && (
                      <div style={{ fontFamily: DM, fontSize: "0.65rem", fontWeight: 600, color: msg.playerColor, marginBottom: 2 }}>
                        {msg.playerName}
                      </div>
                    )}
                    <div style={{
                      background: isMine ? "#2a2a2a" : "#222",
                      color: "#E8E2D9",
                      padding: "0.42rem 0.65rem",
                      fontFamily: DM,
                      fontSize: "0.82rem",
                      lineHeight: 1.45,
                      borderRadius: isMine ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                      border: isMine ? `1px solid ${msg.playerColor}44` : "1px solid #2a2a2a",
                      wordBreak: "break-word",
                    }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingList.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ display: "flex", gap: 3, padding: "6px 10px", background: "#222", borderRadius: "10px 10px 10px 2px", border: "1px solid #2a2a2a", alignItems: "center" }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#555", animation: "typing-bounce 1s infinite", animationDelay: `${delay}s` }} />
                  ))}
                </div>
                <span style={{ fontFamily: DM, fontSize: "0.65rem", color: "#444" }}>
                  {typingList.join(", ")} typing…
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: "1px solid #2a2a2a", padding: "0.6rem 0.75rem", flexShrink: 0 }}>
            {isVotePhase && (
              <div style={{ fontFamily: DM, fontSize: "0.68rem", color: "#3a3a3a", textAlign: "center", marginBottom: 5 }}>
                Chat disabled during vote phase
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                disabled={isVotePhase}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); if (!isVotePhase) emitTyping(); }}
                onKeyDown={handleKey}
                placeholder="Type a message…"
                style={{
                  flex: 1,
                  background: "#111",
                  border: "1px solid #2a2a2a",
                  color: "#E8E2D9",
                  padding: "0.45rem 0.7rem",
                  fontFamily: DM,
                  fontSize: "0.82rem",
                  outline: "none",
                  borderRadius: 6,
                  opacity: isVotePhase ? 0.35 : 1,
                }}
              />
              <button
                onClick={handleSend}
                disabled={isVotePhase}
                style={{
                  background: isVotePhase ? "#1a1a1a" : "#CC2200",
                  border: "none",
                  color: isVotePhase ? "#333" : "#E8E2D9",
                  padding: "0 12px",
                  cursor: isVotePhase ? "default" : "pointer",
                  borderRadius: 6,
                  fontSize: "1rem",
                  flexShrink: 0,
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
