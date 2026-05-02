import { useState, useRef, useEffect } from "react";
import type { RoomState, CanvasElement } from "../types/game";
import type { VoteResult } from "../hooks/useGame";
import { Timer } from "../components/Timer";
import { PosterWallBg, TapeCorner } from "../components/PosterWallBg";

const BEBAS  = "'Bebas Neue', sans-serif";
const DM     = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";
const CREAM   = "#EDE5CC";

const MINI_W = 472;
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
    position:"absolute", left:el.x*MINI_SCALE, top:el.y*MINI_SCALE,
    width:el.width*MINI_SCALE, height:el.height*MINI_SCALE,
    zIndex:el.zIndex, boxSizing:"border-box", pointerEvents:"none",
    opacity:el.opacity??1, borderRadius:(el.cornerRadius??0)*MINI_SCALE,
  };
  if (el.type === "rect")    return <div key={el.id} style={{ ...base, background:el.fill, border:el.stroke?`1px solid ${el.stroke}`:"none" }} />;
  if (el.type === "circle")  return <div key={el.id} style={{ ...base, background:el.fill, borderRadius:"50%" }} />;
  if (el.type === "divider") return <div key={el.id} style={{ ...base, height:Math.max(1,el.height*MINI_SCALE), background:el.fill }} />;
  if (el.type === "heading") return <div key={el.id} style={{ ...base, fontFamily:BEBAS, fontSize:Math.max(8,(el.fontSize??36)*MINI_SCALE), color:el.fill, overflow:"hidden", userSelect:"none", display:"flex", alignItems:"center" }}>{el.content}</div>;
  if (el.type === "text")    return <div key={el.id} style={{ ...base, fontFamily:DM, fontSize:Math.max(6,(el.fontSize??14)*MINI_SCALE), color:el.fill, overflow:"hidden", userSelect:"none" }}>{el.content}</div>;
  if (el.type === "button")  return <div key={el.id} style={{ ...base, fontFamily:DM, fontSize:Math.max(6,(el.fontSize??14)*MINI_SCALE), color:CREAM, background:el.fill, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", userSelect:"none" }}>{el.content}</div>;
  return <div key={el.id} style={{ ...base, background:el.fill }} />;
}

export function ChatPage({ room, myPlayerId, amIHost, onSend, onSkip, voteTally, onVote, voteResult, typingPlayers, emitTyping }: Props) {
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isVotePhase = room.phase === "vote";
  const isImposter  = room.myRole === "imposter";
  const myVote      = room.votes?.[myPlayerId];

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [room.messages.length]);

  function handleSend() { const t = draft.trim(); if (!t || isVotePhase) return; onSend(t); setDraft(""); }
  function handleKey(e: React.KeyboardEvent) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }

  const typingList = Object.entries(typingPlayers)
    .filter(([id, time]) => id !== myPlayerId && now - time < 2000)
    .map(([id]) => room.players.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
      <PosterWallBg />

      {/* ── TOP BAR ── */}
      <div style={{ position:"relative", zIndex:20, background:"rgba(10,8,6,0.92)", borderBottom:`2px solid ${NAVY}44`, display:"flex", alignItems:"center", padding:"0 1.25rem", height:52, flexShrink:0, gap:"1rem", backdropFilter:"blur(4px)" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height:38, display:"block", objectFit:"contain" }} />
        <div style={{ width:1, height:24, background:"#2a2218" }} />
        <div>
          <div style={{ fontFamily:BEBAS, fontSize:"0.8rem", letterSpacing:"0.2em", color: isVotePhase ? ORANGE : MUSTARD, lineHeight:1.2 }}>
            {isVotePhase ? "▸ VOTE PHASE" : "▸ DISCUSSION PHASE"}
          </div>
          <div style={{ fontFamily:DM, fontSize:"0.7rem", color:"rgba(237,229,204,0.38)", lineHeight:1.2 }}>
            Round {room.round}/{room.maxRounds} · {room.prompt}
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.9rem" }}>
          {isImposter && (
            <div style={{ fontFamily:BEBAS, fontSize:"0.72rem", letterSpacing:"0.14em", color:ORANGE, border:`1px solid ${ORANGE}50`, padding:"0.2rem 0.65rem", background:`${ORANGE}0E` }}>
              IMPOSTER — BLEND IN
            </div>
          )}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.5rem", color:"rgba(237,229,204,0.28)", letterSpacing:"0.2em", lineHeight:1 }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
          {amIHost && !isVotePhase && (
            <button onClick={onSkip} style={{ fontFamily:BEBAS, fontSize:"0.85rem", letterSpacing:"0.1em", color:CREAM, background:"rgba(237,229,204,0.07)", border:"1px solid rgba(237,229,204,0.18)", padding:"0.28rem 0.75rem", cursor:"pointer" }}>
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative", zIndex:10 }}>

        {/* ── LEFT: canvas preview + voting ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          <div style={{ padding:"1rem 1.2rem 0.75rem", flexShrink:0 }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.66rem", letterSpacing:"0.2em", color:"#5C5040", marginBottom:10 }}>
              SUBMITTED DESIGN — WHO SABOTAGED IT?
            </div>
            <div style={{ position:"relative", display:"inline-block" }}>
              <TapeCorner color={ORANGE} corner="tl" />
              <TapeCorner color={NAVY}   corner="tr" style={{ background:`repeating-linear-gradient(90deg,#1A5070CC,#206090EE 10px,#1A5070CC 14px)` }} />
              <TapeCorner color={NAVY}   corner="bl" style={{ background:`repeating-linear-gradient(90deg,#1A5070CC,#206090EE 10px,#1A5070CC 14px)` }} />
              <TapeCorner color={ORANGE} corner="br" />
              <div style={{ width:MINI_W, height:MINI_H, background:"#F0EADA", border:"3px solid #0A0906", overflow:"hidden", position:"relative", boxShadow:"6px 8px 24px rgba(0,0,0,0.7)" }}>
                {room.canvas.map((el) => renderMiniElement(el))}
                {room.canvas.length === 0 && (
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontFamily:DM, fontSize:"0.8rem", color:"rgba(44,44,44,0.22)" }}>Canvas was left empty</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ height:2, background:"rgba(255,255,255,0.04)", margin:"0 1.2rem", flexShrink:0 }} />

          {/* VOTING */}
          <div style={{ flex:1, overflow:"auto", padding:"0.75rem 1.2rem 1rem" }}>
            <div style={{ fontFamily:BEBAS, fontSize:"1.5rem", color:ORANGE, letterSpacing:"0.08em", lineHeight:1 }}>
              VOTE — WHO IS THE IMPOSTER?
            </div>
            <div style={{ fontFamily:DM, fontSize:"0.73rem", color:"#5C5040", marginTop:2, marginBottom:14 }}>
              {isVotePhase ? "Click a player to cast your vote" : "🔒 Voting opens when discussion ends"}
            </div>

            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {room.players.map((player) => {
                const votes = voteTally[player.id] ?? 0;
                const isMe = player.id === myPlayerId;
                const isVotedByMe = myVote === player.id;
                const hasVoted = !!myVote;
                const isActive = isVotePhase && !isMe && !hasVoted;
                const isGreyed = !isVotePhase || isMe || (hasVoted && !isVotedByMe);
                return (
                  <div key={player.id}
                    title={!isVotePhase ? "Voting opens when discussion ends" : undefined}
                    onClick={() => isActive && onVote(player.id)}
                    style={{
                      position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                      padding:"10px 14px",
                      background: isVotedByMe ? `${ORANGE}18` : "rgba(237,229,204,0.04)",
                      border: isVotedByMe ? `2px solid ${player.color}` : "1px solid rgba(237,229,204,0.1)",
                      cursor: isActive ? "pointer" : "default",
                      opacity: isGreyed ? 0.33 : 1,
                      transition:"transform 0.15s, box-shadow 0.15s",
                      transform: isVotedByMe ? "translateY(-3px) rotate(-1deg)" : "none",
                      boxShadow: isVotedByMe ? `0 6px 18px ${player.color}44` : "none",
                      minWidth:72,
                    }}
                    onMouseEnter={(e) => { if (isActive) { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 4px 14px ${player.color}33`; } }}
                    onMouseLeave={(e) => { if (!isVotedByMe) { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; } }}>
                    {votes > 0 && (
                      <div style={{ position:"absolute", top:-7, right:-7, background:ORANGE, color:CREAM, fontSize:10, fontFamily:DM, fontWeight:700, padding:"1px 5px", borderRadius:12, minWidth:18, textAlign:"center", zIndex:1 }}>{votes}</div>
                    )}
                    <div style={{ position:"relative", width:44, height:44, borderRadius:"50%", background:player.color, boxShadow:`0 0 10px ${player.color}66` }}>
                      {isVotedByMe && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.45)", borderRadius:"50%", fontSize:20, color:CREAM, fontWeight:700 }}>✓</div>}
                      {!isVotePhase && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.55)", borderRadius:"50%", fontSize:14 }}>🔒</div>}
                    </div>
                    <div style={{ fontFamily:DM, fontSize:"0.7rem", color:"#8A7050", textAlign:"center", maxWidth:72, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {player.name}{isMe ? " (you)" : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {isVotePhase && !myVote && (
              <div style={{ textAlign:"right", marginTop:10 }}>
                <button onClick={() => onVote("")} style={{ background:"none", border:"none", color:"#5C5040", fontFamily:DM, fontSize:"0.75rem", cursor:"pointer", textDecoration:"underline" }}>
                  Skip vote (abstain)
                </button>
              </div>
            )}
            {myVote && !voteResult && (
              <div style={{ fontFamily:DM, fontSize:"0.8rem", color:TEAL, marginTop:10 }}>
                Vote cast ✓ — waiting for others ({Object.keys(room.votes ?? {}).length}/{room.players.length})
              </div>
            )}
            {voteResult && (
              <div style={{ marginTop:14, padding:"14px 16px", background:"rgba(237,229,204,0.05)", border:`2px solid rgba(237,229,204,0.12)` }}>
                {voteResult.wasImposter ? (
                  <>
                    <div style={{ fontFamily:BEBAS, fontSize:"1.6rem", color:TEAL, letterSpacing:"0.06em", lineHeight:1.1 }}>{voteResult.imposterName} WAS THE IMPOSTER! 🎉</div>
                    <div style={{ fontFamily:BEBAS, fontSize:"1rem", color:TEAL, letterSpacing:"0.05em", marginTop:2 }}>DESIGNERS WIN THIS ROUND!</div>
                  </>
                ) : voteResult.isTie ? (
                  <div style={{ fontFamily:BEBAS, fontSize:"1.3rem", color:MUSTARD, letterSpacing:"0.06em" }}>IT'S A TIE — no one was eliminated 😬</div>
                ) : (
                  <>
                    <div style={{ fontFamily:BEBAS, fontSize:"1.3rem", color:MUSTARD, letterSpacing:"0.06em", lineHeight:1.1 }}>
                      {room.players.find((p) => p.id === voteResult.eliminatedId)?.name ?? "That player"} WAS NOT THE IMPOSTER 😬
                    </div>
                    <div style={{ fontFamily:DM, fontSize:"0.8rem", color:"#5C5040", marginTop:4 }}>The imposter is still among you…</div>
                  </>
                )}
                <div style={{ fontFamily:DM, fontSize:"0.7rem", color:"#3a3020", marginTop:8 }}>Advancing to next phase…</div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: chat panel ── */}
        <div style={{ width:288, flexShrink:0, display:"flex", flexDirection:"column", background:"rgba(14,10,6,0.88)", backdropFilter:"blur(6px)", borderLeft:`2px solid ${NAVY}33` }}>

          <div style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0.75rem 0.9rem", flexShrink:0 }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.6rem", letterSpacing:"0.25em", color:"#3a3020", marginBottom:8 }}>PLAYERS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {room.players.map((player) => (
                <div key={player.id} style={{ display:"flex", alignItems:"center", gap:8, opacity:player.eliminated ? 0.3 : 1 }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:player.color, boxShadow:`0 0 8px ${player.color}55` }} />
                    <div style={{ position:"absolute", bottom:-1, right:-1, width:8, height:8, borderRadius:"50%", background:"#4CAF50", border:"1.5px solid #0e0a06" }} />
                  </div>
                  <span style={{ fontFamily:DM, fontSize:"0.77rem", color:player.id === myPlayerId ? CREAM : "#8A7050", fontWeight:player.id === myPlayerId ? 600 : 400, textDecoration:player.eliminated ? "line-through" : "none", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {player.name}{player.id === myPlayerId && <span style={{ color:"#3a3020", fontWeight:400 }}> (you)</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0.5rem 0.9rem", flexShrink:0 }}>
            <div style={{ fontFamily:BEBAS, fontSize:"1.1rem", color:ORANGE, letterSpacing:"0.1em", lineHeight:1 }}>
              DISCUSS — WHO IS THE IMPOSTER?
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"0.7rem 0.9rem", display:"flex", flexDirection:"column", gap:9 }}>
            {room.messages.length === 0 && (
              <div style={{ textAlign:"center", fontFamily:DM, fontSize:"0.73rem", color:"#2a2010", marginTop:"1.2rem" }}>
                No messages yet. Start accusing.
              </div>
            )}
            {room.messages.map((msg) => {
              const isMine = msg.playerId === myPlayerId;
              return (
                <div key={msg.id} style={{ display:"flex", flexDirection:isMine ? "row-reverse" : "row", gap:6, alignItems:"flex-end" }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:msg.playerColor, flexShrink:0, boxShadow:`0 0 6px ${msg.playerColor}55` }} />
                  <div style={{ maxWidth:"80%" }}>
                    {!isMine && <div style={{ fontFamily:DM, fontSize:"0.63rem", fontWeight:600, color:msg.playerColor, marginBottom:2 }}>{msg.playerName}</div>}
                    <div style={{
                      background: isMine ? "#2a1a0E" : "#1A1208",
                      color:CREAM, padding:"0.42rem 0.65rem",
                      fontFamily:DM, fontSize:"0.82rem", lineHeight:1.45,
                      borderRadius: isMine ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                      border: isMine ? `1px solid ${msg.playerColor}44` : "1px solid rgba(255,255,255,0.07)",
                      wordBreak:"break-word",
                    }}>{msg.text}</div>
                  </div>
                </div>
              );
            })}
            {typingList.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ display:"flex", gap:3, padding:"6px 10px", background:"#1A1208", borderRadius:"10px 10px 10px 2px", border:"1px solid rgba(255,255,255,0.07)", alignItems:"center" }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:"#5C5040", animation:"typing-bounce 1s infinite", animationDelay:`${delay}s` }} />
                  ))}
                </div>
                <span style={{ fontFamily:DM, fontSize:"0.63rem", color:"#3a3020" }}>{typingList.join(", ")} typing…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", padding:"0.6rem 0.75rem", flexShrink:0 }}>
            {isVotePhase && (
              <div style={{ fontFamily:DM, fontSize:"0.66rem", color:"#3a3020", textAlign:"center", marginBottom:5 }}>Chat disabled during vote phase</div>
            )}
            <div style={{ display:"flex", gap:6 }}>
              <input
                disabled={isVotePhase}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); if (!isVotePhase) emitTyping(); }}
                onKeyDown={handleKey}
                placeholder="Say something suspicious…"
                style={{ flex:1, background:"#110E08", border:"1px solid rgba(255,255,255,0.1)", color:CREAM, padding:"0.45rem 0.7rem", fontFamily:DM, fontSize:"0.82rem", outline:"none", borderRadius:4, opacity:isVotePhase ? 0.3 : 1 }}
              />
              <button onClick={handleSend} disabled={isVotePhase}
                style={{ background:isVotePhase ? "#1A1208" : ORANGE, border:"none", color:isVotePhase ? "#2a2010" : CREAM, padding:"0 12px", cursor:isVotePhase ? "default" : "pointer", borderRadius:4, fontSize:"1rem", flexShrink:0 }}>
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
