import { useState, useRef, useEffect } from "react";
import type { Socket } from "socket.io-client";
import type { RoomState, CanvasElement } from "../types/game";
import type { VoteResult } from "../hooks/useGame";
import { Timer } from "../components/Timer";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { PosterWallBg, TapeCorner } from "../components/PosterWallBg";
import { useVoiceChat } from "../hooks/useVoiceChat";

const BEBAS   = "'Bebas Neue', sans-serif";
const DM      = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";

const MINI_W = 700;
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
  socket: Socket;
  roomId: string;
};

function renderMiniElement(el: CanvasElement) {
  const base: React.CSSProperties = {
    position:"absolute", left:el.x*MINI_SCALE, top:el.y*MINI_SCALE,
    width:el.width*MINI_SCALE, height:el.height*MINI_SCALE,
    zIndex:el.zIndex, boxSizing:"border-box", pointerEvents:"none",
    opacity:el.opacity??1, borderRadius:(el.cornerRadius??0)*MINI_SCALE,
  };
  if (el.type==="rect")    return <div key={el.id} style={{ ...base, background:el.fill, border:el.stroke?`1px solid ${el.stroke}`:"none" }} />;
  if (el.type==="circle")  return <div key={el.id} style={{ ...base, background:el.fill, borderRadius:"50%" }} />;
  if (el.type==="divider") return <div key={el.id} style={{ ...base, height:Math.max(1,el.height*MINI_SCALE), background:el.fill }} />;
  if (el.type==="heading") return <div key={el.id} style={{ ...base, fontFamily:DM, fontSize:Math.max(8,(el.fontSize??36)*MINI_SCALE), color:el.fill, overflow:"hidden", userSelect:"none", display:"flex", alignItems:"center" }}>{el.content}</div>;
  if (el.type==="text")    return <div key={el.id} style={{ ...base, fontFamily:DM, fontSize:Math.max(6,(el.fontSize??14)*MINI_SCALE), color:el.fill, overflow:"hidden", userSelect:"none" }}>{el.content}</div>;
  if (el.type==="button")  return <div key={el.id} style={{ ...base, fontFamily:DM, fontSize:Math.max(6,(el.fontSize??14)*MINI_SCALE), color:"#fff", background:el.fill, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", userSelect:"none" }}>{el.content}</div>;
  if (el.type==="image" && el.imageUrl) return <img key={el.id} src={el.imageUrl} alt="" style={{ ...base, objectFit:"contain" }} />;
  return <div key={el.id} style={{ ...base, background:el.fill }} />;
}

function formatTime(secs: number): string {
  const s = Math.floor(secs);
  return `0:${s < 10 ? "0" : ""}${s}`;
}

const WAVEFORM = [5, 10, 7, 14, 9, 12, 8, 15, 6, 13, 8, 11, 7, 13, 9, 10, 6, 12];

function VoicePlayer({ src, isMine, playerColor }: { src: string; isMine: boolean; playerColor: string }) {
  const audioRef   = useRef<HTMLAudioElement>(null);
  const [playing,  setPlaying]  = useState(false);
  const [duration, setDuration] = useState(0);
  const [curTime,  setCurTime]  = useState(0);

  const progress = duration > 0 ? curTime / duration : 0;
  const accent   = isMine ? "rgba(255,255,255,0.9)" : ORANGE;
  const trackBg  = isMine ? "rgba(255,255,255,0.18)" : `${ORANGE}22`;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:isMine?NAVY:"#F0E8D8", border:`1px solid ${isMine?"#0A2040":"#E8E2D8"}`, borderRadius:"10px", minWidth:168, boxSizing:"border-box" }}>
      <button
        onClick={()=>{ const a=audioRef.current; if(!a) return; if(playing) a.pause(); else a.play().catch(()=>{}); }}
        style={{ width:30, height:30, borderRadius:"50%", border:"none", background:accent, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:isMine?NAVY:ORANGE, fontSize:12, fontWeight:700 }}>
        {playing ? "⏸" : "▶"}
      </button>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"flex-end", height:20, gap:2, marginBottom:3 }}>
          {WAVEFORM.map((h, i) => {
            const ratio = i / WAVEFORM.length;
            const isPast = ratio <= progress;
            return (
              <div key={i} style={{ flex:1, borderRadius:2, background:isPast ? accent : trackBg, height:`${h * (isPast ? 1 : 0.45)}px`, transition:"height 0.08s" }} />
            );
          })}
        </div>
        <div style={{ height:2, background:trackBg, borderRadius:1, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress*100}%`, background:accent, transition:"width 0.1s linear" }} />
        </div>
      </div>
      <span style={{ fontFamily:DM, fontSize:"0.6rem", color:isMine?"rgba(255,255,255,0.5)":"#8A7868", flexShrink:0 }}>
        {playing ? formatTime(curTime) : formatTime(duration)}
      </span>
      <audio ref={audioRef} src={src}
        onPlay={()=>setPlaying(true)}
        onPause={()=>setPlaying(false)}
        onEnded={()=>{ setPlaying(false); setCurTime(0); }}
        onTimeUpdate={()=>setCurTime(audioRef.current?.currentTime??0)}
        onLoadedMetadata={()=>setDuration(audioRef.current?.duration??0)} />
    </div>
  );
}

function MicButton({ isRecording, permissionDenied, speakingCount, onStart, onStop }: {
  isRecording: boolean;
  permissionDenied: boolean;
  speakingCount: number;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
      {speakingCount > 0 && !isRecording && (
        <div style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 7px", background:`${TEAL}18`, border:`1px solid ${TEAL}`, borderRadius:12 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:TEAL, animation:"pulse-speak 0.8s infinite" }} />
          <span style={{ fontFamily:DM, fontSize:"0.6rem", color:TEAL, fontWeight:600 }}>{speakingCount}</span>
        </div>
      )}
      <button title={permissionDenied?"Mic access denied":isRecording?"Release to send":"Hold to talk"}
        onMouseDown={!permissionDenied?onStart:undefined}
        onMouseUp={!permissionDenied?onStop:undefined}
        onTouchStart={!permissionDenied?(e)=>{e.preventDefault();onStart();}:undefined}
        onTouchEnd={!permissionDenied?(e)=>{e.preventDefault();onStop();}:undefined}
        style={{ width:34, height:34, borderRadius:"50%", border:"none", cursor:permissionDenied?"not-allowed":"pointer",
          background:isRecording?ORANGE:permissionDenied?"#E8E2D8":"#F0E8DC",
          boxShadow:isRecording?`0 0 0 4px ${ORANGE}44`:"none",
          transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
        {isRecording ? "🔴" : permissionDenied ? "🚫" : "🎙"}
      </button>
      <style>{`@keyframes pulse-speak{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

export function ChatPage({ room, myPlayerId, amIHost, onSend, onSkip, voteTally, onVote, voteResult, typingPlayers, emitTyping, socket, roomId }: Props) {
  const [draft,     setDraft]     = useState("");
  const [now,       setNow]       = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Live voice chat (walkie-talkie)
  const { isRecording: liveRecording, speakingPlayers, startRecording, stopRecording, permissionDenied } = useVoiceChat(socket, roomId);

  // ── Voice memo states
  const [memoMode,    setMemoMode]    = useState<"idle"|"recording"|"preview">("idle");
  const [memoSeconds, setMemoSeconds] = useState(0);
  const [previewUrl,  setPreviewUrl]  = useState<string|null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob|null>(null);
  const memoRecRef   = useRef<MediaRecorder|null>(null);
  const memoStreamRef = useRef<MediaStream|null>(null);
  const memoChunksRef = useRef<Blob[]>([]);
  const memoTimerRef  = useRef<ReturnType<typeof setInterval>|null>(null);
  const memoStartRef  = useRef<number>(0);

  const isVotePhase = room.phase === "vote";
  const isImposter  = room.myRole === "imposter";
  const myVote      = room.votes?.[myPlayerId];

  useEffect(() => { const id = setInterval(()=>setNow(Date.now()),500); return ()=>clearInterval(id); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [room.messages.length]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (memoTimerRef.current) clearInterval(memoTimerRef.current);
      memoStreamRef.current?.getTracks().forEach(t=>t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startMemoRecording() {
    if (memoMode !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      memoStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      memoRecRef.current = rec;
      memoChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) memoChunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(memoChunksRef.current, { type: mime });
        setPreviewBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setMemoMode("preview");
        memoStreamRef.current?.getTracks().forEach(t=>t.stop());
      };
      rec.start();
      setMemoMode("recording");
      memoStartRef.current = Date.now();
      setMemoSeconds(0);
      memoTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - memoStartRef.current) / 1000;
        setMemoSeconds(elapsed);
        if (elapsed >= 10) stopMemoRecording();
      }, 100);
    } catch {
      // mic not available
    }
  }

  function stopMemoRecording() {
    if (memoTimerRef.current) { clearInterval(memoTimerRef.current); memoTimerRef.current = null; }
    memoRecRef.current?.stop();
  }

  function discardMemo() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null); setPreviewBlob(null);
    setMemoMode("idle"); setMemoSeconds(0);
  }

  async function sendMemo() {
    if (!previewBlob) return;
    const buf  = await previewBlob.arrayBuffer();
    const b64  = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const mime = previewBlob.type;
    onSend(`[VOICE]data:${mime};base64,${b64}`);
    discardMemo();
  }

  function handleSend() { const t=draft.trim(); if(!t||isVotePhase) return; onSend(t); setDraft(""); }
  function handleKey(e: React.KeyboardEvent) { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();} }

  const typingList = Object.entries(typingPlayers)
    .filter(([id,time])=>id!==myPlayerId&&now-time<2000)
    .map(([id])=>room.players.find((p)=>p.id===id)?.name)
    .filter(Boolean) as string[];

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
      <PosterWallBg />

      {/* ── TOP BAR ── */}
      <div style={{ position:"relative", zIndex:20, background:"#FFFFFF", borderBottom:`3px solid ${ORANGE}`, display:"flex", alignItems:"center", padding:"0 1.25rem", height:52, flexShrink:0, gap:"1rem", boxShadow:"0 2px 12px rgba(0,0,0,0.10)" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height:38, display:"block", objectFit:"contain" }} />
        <div style={{ width:1, height:24, background:"#E8E2D8" }} />
        <div>
          <div style={{ fontFamily:BEBAS, fontSize:"0.8rem", letterSpacing:"0.2em", color:isVotePhase?ORANGE:MUSTARD, lineHeight:1.2 }}>
            {isVotePhase?"▸ VOTE PHASE":"▸ DISCUSSION PHASE"}
          </div>
          <div style={{ fontFamily:DM, fontSize:"0.7rem", color:"#8A7868", lineHeight:1.2 }}>
            Round {room.round}/{room.maxRounds} · {room.prompt}
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"0.9rem" }}>
          {/* Speaking indicators */}
          {room.players.filter(p=>speakingPlayers.has(p.id)).map(p=>(
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 7px", background:`${p.color}22`, border:`1.5px solid ${p.color}`, borderRadius:12 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:p.color, animation:"pulse-speak 0.8s infinite" }} />
              <span style={{ fontFamily:DM, fontSize:"0.6rem", color:p.color, fontWeight:700 }}>{p.name}</span>
            </div>
          ))}
          {/* Live walkie-talkie mic */}
          <MicButton isRecording={liveRecording} permissionDenied={permissionDenied} speakingCount={speakingPlayers.size} onStart={startRecording} onStop={stopRecording} />
          <div style={{ width:1, height:24, background:"#E8E2D8" }} />
          {isImposter && (
            <div style={{ fontFamily:BEBAS, fontSize:"0.72rem", letterSpacing:"0.14em", color:ORANGE, border:`2px solid ${ORANGE}`, padding:"0.2rem 0.65rem", background:`${ORANGE}12` }}>
              IMPOSTER — BLEND IN
            </div>
          )}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.5rem", color:"#B8A880", letterSpacing:"0.2em", lineHeight:1 }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
          {amIHost && !isVotePhase && (
            <button onClick={onSkip} style={{ fontFamily:BEBAS, fontSize:"0.85rem", letterSpacing:"0.1em", color:"#FFFFFF", background:NAVY, border:`2px solid #0A2040`, padding:"0.28rem 0.75rem", cursor:"pointer", boxShadow:"2px 2px 0 rgba(0,0,0,0.3)" }}>
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative", zIndex:10 }}>

        {/* LEFT: canvas preview + voting */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"rgba(245,238,226,0.85)", backdropFilter:"blur(2px)" }}>

          <div style={{ padding:"1.1rem 1.4rem 0.85rem", flexShrink:0 }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.85rem", letterSpacing:"0.2em", color:ORANGE, marginBottom:12 }}>
              SUBMITTED DESIGN — WHO SABOTAGED IT?
            </div>
            <div style={{ position:"relative", display:"inline-block" }}>
              <TapeCorner color={ORANGE} corner="tl" />
              <TapeCorner color={NAVY}   corner="tr" style={{ background:`repeating-linear-gradient(90deg,#1A5070CC,#206090FF 10px,#1A5070CC 14px)` }} />
              <TapeCorner color={NAVY}   corner="bl" style={{ background:`repeating-linear-gradient(90deg,#1A5070CC,#206090FF 10px,#1A5070CC 14px)` }} />
              <TapeCorner color={ORANGE} corner="br" />
              <div style={{ width:MINI_W, height:MINI_H, background:"#F8F4EE", border:`4px solid ${NAVY}`, overflow:"hidden", position:"relative", boxShadow:`6px 8px 0 ${ORANGE}` }}>
                {room.canvas.map((el)=>renderMiniElement(el))}
                {room.canvas.length===0 && (
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontFamily:DM, fontSize:"0.8rem", color:"rgba(44,44,44,0.22)" }}>Canvas was left empty</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ height:2, background:"rgba(28,58,96,0.12)", margin:"0 1.4rem", flexShrink:0 }} />

          {/* VOTING */}
          <div style={{ flex:1, overflow:"auto", padding:"0.9rem 1.4rem 1.1rem" }}>
            <div style={{ fontFamily:BEBAS, fontSize:"1.9rem", color:NAVY, letterSpacing:"0.08em", lineHeight:1 }}>
              VOTE — WHO IS THE IMPOSTER?
            </div>
            <div style={{ fontFamily:DM, fontSize:"0.85rem", color:"#8A7868", marginTop:4, marginBottom:18 }}>
              {isVotePhase?"Click a player to cast your vote":"🔒 Voting opens when discussion ends"}
            </div>

            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              {room.players.map((player) => {
                const votes = voteTally[player.id]??0;
                const isMe = player.id===myPlayerId;
                const isVotedByMe = myVote===player.id;
                const hasVoted = !!myVote;
                const isActive = isVotePhase&&!isMe&&!hasVoted;
                const isGreyed = !isVotePhase||isMe||(hasVoted&&!isVotedByMe);
                return (
                  <div key={player.id}
                    title={!isVotePhase?"Voting opens when discussion ends":undefined}
                    onClick={()=>isActive&&onVote(player.id)}
                    style={{
                      position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"14px 18px",
                      background:isVotedByMe?"#FFFFFF":"rgba(255,255,255,0.7)",
                      border:isVotedByMe?`3px solid ${player.color}`:`2px solid ${isActive?"#E8E2D8":"#EAE4DC"}`,
                      boxShadow:isVotedByMe?`4px 4px 0 ${player.color}`:"2px 2px 0 rgba(0,0,0,0.08)",
                      cursor:isActive?"pointer":"default",
                      opacity:isGreyed?0.38:1,
                      transition:"transform 0.15s, box-shadow 0.15s",
                      transform:isVotedByMe?"translateY(-3px)":"none",
                      minWidth:90,
                    }}
                    onMouseEnter={(e)=>{if(isActive){e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`4px 4px 0 ${player.color}`;}}}
                    onMouseLeave={(e)=>{if(!isVotedByMe){e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="2px 2px 0 rgba(0,0,0,0.08)";}}}
                  >
                    {votes>0 && <div style={{ position:"absolute", top:-10, right:-10, background:ORANGE, color:"#fff", fontSize:12, fontFamily:DM, fontWeight:700, padding:"2px 7px", borderRadius:12, minWidth:22, textAlign:"center", zIndex:1, border:"2px solid #fff" }}>{votes}</div>}
                    <div style={{ position:"relative" }}>
                      <PlayerAvatar playerId={player.id} color={player.color} size={56} showBorder={isVotedByMe} />
                      {isVotedByMe&&<div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.35)", borderRadius:"50%", fontSize:22, color:"#fff", fontWeight:700 }}>✓</div>}
                      {!isVotePhase&&<div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.4)", borderRadius:"50%", fontSize:18 }}>🔒</div>}
                    </div>
                    <div style={{ fontFamily:DM, fontSize:"0.82rem", color:"#4A3C22", fontWeight:600, textAlign:"center", maxWidth:88, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {player.name}{isMe?" (you)":""}
                    </div>
                  </div>
                );
              })}
            </div>

            {isVotePhase&&!myVote&&(
              <div style={{ textAlign:"right", marginTop:14 }}>
                <button onClick={()=>onVote("")} style={{ background:"none", border:"none", color:"#8A7868", fontFamily:DM, fontSize:"0.82rem", cursor:"pointer", textDecoration:"underline" }}>
                  Skip vote (abstain)
                </button>
              </div>
            )}
            {myVote&&!voteResult&&<div style={{ fontFamily:DM, fontSize:"0.9rem", color:TEAL, marginTop:14, fontWeight:600 }}>Vote cast ✓ — waiting for others ({Object.keys(room.votes??{}).length}/{room.players.length})</div>}
            {voteResult&&(
              <div style={{ marginTop:18, padding:"18px 20px", background:"#FFFFFF", border:`3px solid ${voteResult.wasImposter?TEAL:MUSTARD}`, boxShadow:`4px 4px 0 ${voteResult.wasImposter?TEAL:MUSTARD}` }}>
                {voteResult.wasImposter ? (
                  <><div style={{ fontFamily:BEBAS, fontSize:"2rem", color:TEAL, letterSpacing:"0.06em", lineHeight:1.1 }}>{voteResult.imposterName} WAS THE IMPOSTER! 🎉</div>
                  <div style={{ fontFamily:BEBAS, fontSize:"1.2rem", color:TEAL, letterSpacing:"0.05em", marginTop:2 }}>DESIGNERS WIN THIS ROUND!</div></>
                ) : voteResult.isTie ? (
                  <div style={{ fontFamily:BEBAS, fontSize:"1.6rem", color:MUSTARD, letterSpacing:"0.06em" }}>IT'S A TIE — no one was eliminated 😬</div>
                ) : (
                  <><div style={{ fontFamily:BEBAS, fontSize:"1.6rem", color:ORANGE, letterSpacing:"0.06em", lineHeight:1.1 }}>
                    {room.players.find((p)=>p.id===voteResult.eliminatedId)?.name??"That player"} WAS NOT THE IMPOSTER 😬
                  </div>
                  <div style={{ fontFamily:DM, fontSize:"0.9rem", color:"#8A7868", marginTop:6 }}>The imposter is still among you…</div></>
                )}
                <div style={{ fontFamily:DM, fontSize:"0.8rem", color:"#C8B888", marginTop:10 }}>Advancing to next phase…</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: chat panel */}
        <div style={{ width:340, flexShrink:0, display:"flex", flexDirection:"column", background:"#FFFFFF", borderLeft:`3px solid ${NAVY}` }}>

          {/* Players with avatars */}
          <div style={{ borderBottom:`2px solid #F0E8D8`, padding:"0.8rem 1rem", flexShrink:0, background:"#FAFAF5" }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.25em", color:ORANGE, marginBottom:10 }}>PLAYERS</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {room.players.map((player) => (
                <div key={player.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, opacity:player.eliminated?0.35:1 }}>
                  <div style={{ position:"relative" }}>
                    <PlayerAvatar playerId={player.id} color={player.color} size={44} showBorder={player.id===myPlayerId} />
                    {speakingPlayers.has(player.id) && (
                      <div style={{ position:"absolute", bottom:-2, right:-2, width:12, height:12, borderRadius:"50%", background:TEAL, border:"2px solid #fff", animation:"pulse-speak 0.8s infinite" }} />
                    )}
                  </div>
                  <span style={{ fontFamily:DM, fontSize:"0.62rem", color:player.id===myPlayerId?NAVY:"#8A7868", fontWeight:player.id===myPlayerId?700:400, textDecoration:player.eliminated?"line-through":"none", maxWidth:48, textAlign:"center", lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {player.id===myPlayerId?"you":player.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderBottom:`2px solid #F0E8D8`, padding:"0.65rem 1rem", flexShrink:0, background:"#FAFAF5" }}>
            <div style={{ fontFamily:BEBAS, fontSize:"1.3rem", color:NAVY, letterSpacing:"0.1em", lineHeight:1 }}>WHO IS THE IMPOSTER?</div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"0.7rem 0.9rem", display:"flex", flexDirection:"column", gap:9, background:"#FFFFFF" }}>
            {room.messages.length===0&&(
              <div style={{ textAlign:"center", fontFamily:DM, fontSize:"0.73rem", color:"#C8B888", marginTop:"1.2rem" }}>
                No messages yet. Start accusing.
              </div>
            )}
            {room.messages.map((msg) => {
              const isMine = msg.playerId===myPlayerId;
              const isVoice = msg.text.startsWith("[VOICE]");
              return (
                <div key={msg.id} style={{ display:"flex", flexDirection:isMine?"row-reverse":"row", gap:6, alignItems:"flex-end" }}>
                  <div style={{ width:22, height:24, flexShrink:0 }}>
                    <PlayerAvatar playerId={msg.playerId} color={msg.playerColor} size={22} />
                  </div>
                  <div style={{ maxWidth:"82%" }}>
                    {!isMine&&<div style={{ fontFamily:DM, fontSize:"0.63rem", fontWeight:700, color:msg.playerColor, marginBottom:2 }}>{msg.playerName}</div>}
                    {isVoice ? (
                      <VoicePlayer src={msg.text.slice(7)} isMine={isMine} playerColor={msg.playerColor} />
                    ) : (
                      <div style={{
                        background:isMine?NAVY:"#F0E8D8",
                        color:isMine?"#FFFFFF":"#1A1208",
                        padding:"0.42rem 0.65rem",
                        fontFamily:DM, fontSize:"0.82rem", lineHeight:1.45,
                        borderRadius:isMine?"10px 10px 2px 10px":"10px 10px 10px 2px",
                        border:isMine?`1px solid #0A2040`:`1px solid #E8E2D8`,
                        wordBreak:"break-word",
                      }}>{msg.text}</div>
                    )}
                  </div>
                </div>
              );
            })}
            {typingList.length>0&&(
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ display:"flex", gap:3, padding:"6px 10px", background:"#F0E8D8", borderRadius:"10px 10px 10px 2px", border:`1px solid #E8E2D8`, alignItems:"center" }}>
                  {[0,0.2,0.4].map((delay,i)=>(
                    <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:ORANGE, animation:"typing-bounce 1s infinite", animationDelay:`${delay}s` }} />
                  ))}
                </div>
                <span style={{ fontFamily:DM, fontSize:"0.63rem", color:"#C8B888" }}>{typingList.join(", ")} typing…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{ borderTop:`2px solid #F0E8D8`, padding:"0.6rem 0.75rem", flexShrink:0, background:"#FAFAF5" }}>

            {/* Voice memo preview */}
            {memoMode==="preview" && previewUrl && (
              <div style={{ marginBottom:8, padding:"8px 10px", background:"#F5EEE2", border:`2px solid ${ORANGE}`, borderRadius:8, display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ fontFamily:BEBAS, fontSize:"0.55rem", letterSpacing:"0.18em", color:ORANGE }}>VOICE MEMO — PREVIEW BEFORE SENDING</div>
                <VoicePlayer src={previewUrl} isMine={false} playerColor={ORANGE} />
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={discardMemo}
                    style={{ flex:1, height:32, background:"#FFF0EC", border:`1.5px solid ${ORANGE}`, borderRadius:5, cursor:"pointer", fontFamily:DM, fontSize:"0.72rem", color:ORANGE, fontWeight:600 }}>
                    🗑 Discard
                  </button>
                  <button onClick={sendMemo}
                    style={{ flex:1, height:32, background:ORANGE, border:`1.5px solid #8A3008`, borderRadius:5, cursor:"pointer", fontFamily:DM, fontSize:"0.72rem", color:"#fff", fontWeight:700, boxShadow:`2px 2px 0 ${NAVY}` }}>
                    ➤ Send
                  </button>
                </div>
              </div>
            )}

            {/* Recording indicator */}
            {memoMode==="recording" && (
              <div style={{ marginBottom:8, padding:"6px 10px", background:`${ORANGE}12`, border:`1.5px solid ${ORANGE}`, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:ORANGE, animation:"pulse-speak 0.5s infinite" }} />
                  <span style={{ fontFamily:DM, fontSize:"0.72rem", color:ORANGE, fontWeight:600 }}>Recording {formatTime(memoSeconds)}/0:10</span>
                </div>
                <button onClick={stopMemoRecording}
                  style={{ background:ORANGE, border:"none", borderRadius:4, padding:"3px 10px", cursor:"pointer", fontFamily:BEBAS, fontSize:"0.65rem", letterSpacing:"0.1em", color:"#fff" }}>
                  STOP
                </button>
              </div>
            )}

            {isVotePhase&&<div style={{ fontFamily:DM, fontSize:"0.66rem", color:"#C8B888", textAlign:"center", marginBottom:5 }}>Chat disabled during vote phase</div>}

            <div style={{ display:"flex", gap:6, alignItems:"flex-end" }}>
              {/* Voice memo record button */}
              {!isVotePhase && memoMode==="idle" && (
                <button onClick={startMemoRecording}
                  title="Record a voice memo"
                  style={{ width:36, height:36, borderRadius:"50%", border:`1.5px solid #E8E2D8`, background:"#FAFAF5", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0, color:"#8A7868" }}>
                  🎤
                </button>
              )}

              <input
                disabled={isVotePhase || memoMode!=="idle"}
                value={draft}
                onChange={(e)=>{setDraft(e.target.value);if(!isVotePhase)emitTyping();}}
                onKeyDown={handleKey}
                placeholder={memoMode!=="idle" ? "…" : "Say something suspicious…"}
                style={{ flex:1, background:isVotePhase||memoMode!=="idle"?"#FAFAF5":"#FFFFFF", border:`2px solid ${isVotePhase?"#E8E2D8":NAVY}`, color:"#1A1208", padding:"0.45rem 0.7rem", fontFamily:DM, fontSize:"0.82rem", outline:"none", borderRadius:4, opacity:isVotePhase||memoMode!=="idle"?0.5:1 }}
              />
              <button onClick={handleSend} disabled={isVotePhase || memoMode!=="idle"}
                style={{ background:isVotePhase||memoMode!=="idle"?"#E8E2D8":ORANGE, border:`2px solid ${isVotePhase?"#E8E2D8":"#8A3008"}`, color:isVotePhase||memoMode!=="idle"?"#C8B888":"#FFFFFF", padding:"0 12px", cursor:isVotePhase||memoMode!=="idle"?"default":"pointer", borderRadius:4, fontSize:"1rem", flexShrink:0, height:36, boxShadow:isVotePhase||memoMode!=="idle"?"none":`2px 2px 0 ${NAVY}` }}>
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typing-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
      `}</style>
    </div>
  );
}
