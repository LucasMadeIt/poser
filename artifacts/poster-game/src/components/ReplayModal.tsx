import { useState, useRef, useEffect, useCallback } from "react";
import type { CanvasElement, ReplayEvent } from "../types/game";
import { CanvasPreview } from "./CanvasPreview";

const BEBAS   = "'Bebas Neue', sans-serif";
const DM      = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";

const CANVAS_NATIVE_W = 900;
const CANVAS_DISPLAY_W = 820;
const SCALE = CANVAS_DISPLAY_W / CANVAS_NATIVE_W;
const CANVAS_DISPLAY_H = Math.round(560 * SCALE);

type Props = {
  events: ReplayEvent[];
  prompt: string;
  defaultSpeed?: number;
  onClose: () => void;
};

export function ReplayModal({ events, prompt, defaultSpeed = 2, onClose }: Props) {
  const [playing, setPlaying]           = useState(false);
  const [speed,   setSpeed]             = useState(defaultSpeed);
  const [quick,   setQuick]             = useState(false);
  const [eventIndex, setEventIndex]     = useState(-1);
  const [canvasMap, setCanvasMap]       = useState<Map<string, CanvasElement>>(new Map());
  const [currentEv, setCurrentEv]       = useState<ReplayEvent | null>(null);
  const [highlightId, setHighlightId]   = useState<string | null>(null);
  const [showTag, setShowTag]           = useState(false);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hlTimerRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tagTimerRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setTimeout(() => setPlaying(true), 300);
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(hlTimerRef.current);
      clearTimeout(tagTimerRef.current);
    };
  }, []);

  const applyEvent = useCallback((idx: number) => {
    if (idx < 0 || idx >= events.length) return;
    const ev = events[idx];
    setCanvasMap(prev => {
      const next = new Map(prev);
      if (ev.type === "add" && ev.element) {
        next.set(ev.elementId, { ...ev.element });
      } else if (ev.type === "update" && ev.updates) {
        const ex = next.get(ev.elementId);
        if (ex) next.set(ev.elementId, { ...ex, ...ev.updates });
      } else if (ev.type === "delete") {
        next.delete(ev.elementId);
      }
      return next;
    });
    setCurrentEv(ev);
    if (ev.type !== "delete") {
      setHighlightId(ev.elementId);
      setShowTag(true);
      clearTimeout(hlTimerRef.current);
      clearTimeout(tagTimerRef.current);
      hlTimerRef.current  = setTimeout(() => setHighlightId(null), 700);
      tagTimerRef.current = setTimeout(() => setShowTag(false), 1600);
    } else {
      setHighlightId(null);
      setShowTag(true);
      clearTimeout(tagTimerRef.current);
      tagTimerRef.current = setTimeout(() => setShowTag(false), 1200);
    }
  }, [events]);

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const nextIdx = eventIndex + 1;
    if (nextIdx >= events.length) { setPlaying(false); return; }

    let delay: number;
    if (eventIndex < 0) {
      delay = 0;
    } else {
      const gap = events[nextIdx].timestamp - events[eventIndex].timestamp;
      delay = gap / speed;
      if (quick && delay > 1200 / speed) delay = 280;
      delay = Math.max(40, Math.min(delay, quick ? 700 : 2500));
    }

    timerRef.current = setTimeout(() => {
      applyEvent(nextIdx);
      setEventIndex(nextIdx);
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [playing, eventIndex, speed, quick, events, applyEvent]);

  function restart() {
    clearTimeout(timerRef.current);
    clearTimeout(hlTimerRef.current);
    clearTimeout(tagTimerRef.current);
    setEventIndex(-1);
    setCanvasMap(new Map());
    setCurrentEv(null);
    setHighlightId(null);
    setShowTag(false);
    setTimeout(() => setPlaying(true), 100);
  }

  const elements     = Array.from(canvasMap.values()).sort((a, b) => a.zIndex - b.zIndex);
  const progress     = events.length > 0 ? Math.max(0, (eventIndex + 1) / events.length) : 0;
  const isFinished   = eventIndex >= events.length - 1 && events.length > 0;
  const highlightEl  = highlightId ? canvasMap.get(highlightId) : null;

  const actionWord = currentEv?.type === "add" ? "added" : currentEv?.type === "update" ? "edited" : "deleted";

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(6,4,2,0.90)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes tagPop { 0%{opacity:0;transform:translateY(6px)} 15%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
        @keyframes hlPulse { 0%{opacity:0.9} 100%{opacity:0} }
      `}</style>

      <div style={{
        width: CANVAS_DISPLAY_W + 40,
        background: "#FFFFFF",
        border: `4px solid ${NAVY}`,
        boxShadow: `10px 12px 0 ${ORANGE}`,
        display: "flex", flexDirection: "column",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: NAVY, padding: "0.6rem 0.9rem",
          display: "flex", alignItems: "center", gap: "0.7rem",
        }}>
          <span style={{ fontFamily: BEBAS, fontSize: "1.1rem", letterSpacing: "0.2em", color: ORANGE }}>
            🎬 ROUND REPLAY
          </span>
          <span style={{ fontFamily: DM, fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {prompt}
          </span>

          {/* Speed */}
          <div style={{ display: "flex", gap: 4 }}>
            {([1, 2, 3] as const).map(s => (
              <button key={s} onClick={() => setSpeed(s)} style={{
                fontFamily: BEBAS, fontSize: "0.75rem", letterSpacing: "0.08em",
                padding: "2px 8px", cursor: "pointer", border: "none",
                background: speed === s ? ORANGE : "rgba(255,255,255,0.12)",
                color: speed === s ? "#fff" : "rgba(255,255,255,0.55)",
                transition: "background 0.12s",
              }}>{s}x</button>
            ))}
          </div>

          {/* Quick */}
          <button onClick={() => setQuick(q => !q)} title="Compress idle gaps" style={{
            fontFamily: BEBAS, fontSize: "0.75rem", letterSpacing: "0.08em",
            padding: "2px 9px", cursor: "pointer", border: `1.5px solid ${quick ? TEAL : "rgba(255,255,255,0.2)"}`,
            background: quick ? `${TEAL}33` : "transparent",
            color: quick ? TEAL : "rgba(255,255,255,0.45)",
            transition: "all 0.12s",
          }}>⚡ QUICK</button>

          {/* Play/Pause */}
          <button onClick={() => isFinished ? restart() : setPlaying(p => !p)} style={{
            fontFamily: BEBAS, fontSize: "0.85rem", letterSpacing: "0.1em",
            padding: "3px 12px", cursor: "pointer", border: `2px solid ${ORANGE}`,
            background: ORANGE, color: "#fff",
            transition: "opacity 0.12s",
          }}>
            {isFinished ? "⏮ REPLAY" : playing ? "⏸ PAUSE" : "▶ PLAY"}
          </button>

          {/* Restart */}
          {!isFinished && (
            <button onClick={restart} title="Restart" style={{
              fontFamily: BEBAS, fontSize: "0.85rem",
              padding: "3px 10px", cursor: "pointer", border: `2px solid rgba(255,255,255,0.2)`,
              background: "transparent", color: "rgba(255,255,255,0.6)",
            }}>⏮</button>
          )}

          {/* Close */}
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)",
            cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
            marginLeft: 4,
          }}>✕</button>
        </div>

        {/* ── Canvas area ── */}
        <div style={{ padding: "20px 20px 0", position: "relative" }}>
          <div style={{ position: "relative", lineHeight: 0 }}>
            <CanvasPreview elements={elements} displayWidth={CANVAS_DISPLAY_W} />

            {/* Highlight overlay */}
            {highlightEl && (
              <div style={{
                position: "absolute",
                left: highlightEl.x * SCALE,
                top: highlightEl.y * SCALE,
                width: highlightEl.width * SCALE,
                height: highlightEl.height * SCALE,
                border: `2.5px solid ${currentEv?.playerColor ?? ORANGE}`,
                borderRadius: Math.min((highlightEl.cornerRadius ?? 0) * SCALE, 12),
                boxShadow: `0 0 14px ${currentEv?.playerColor ?? ORANGE}AA, inset 0 0 10px ${currentEv?.playerColor ?? ORANGE}22`,
                pointerEvents: "none",
                animation: "hlPulse 0.7s ease-out forwards",
                zIndex: 10,
              }} />
            )}

            {/* Player attribution tag */}
            {showTag && currentEv && (
              <div style={{
                position: "absolute", bottom: 10, left: 10,
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(20,14,8,0.85)",
                border: `1.5px solid ${currentEv.playerColor}`,
                padding: "4px 10px 4px 7px",
                pointerEvents: "none",
                animation: "tagPop 1.6s ease-out forwards",
                zIndex: 20,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: currentEv.playerColor, flexShrink: 0 }} />
                <span style={{ fontFamily: DM, fontSize: "0.72rem", color: "#F0E8D8", fontWeight: 600 }}>
                  {currentEv.playerName}
                </span>
                <span style={{ fontFamily: DM, fontSize: "0.72rem", color: "rgba(240,232,216,0.55)" }}>
                  {actionWord}
                </span>
              </div>
            )}

            {/* Empty state */}
            {elements.length === 0 && eventIndex < 0 && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(245,238,226,0.6)",
              }}>
                <span style={{ fontFamily: BEBAS, fontSize: "1.2rem", letterSpacing: "0.15em", color: NAVY, opacity: 0.5 }}>
                  STARTING…
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Progress bar + counter ── */}
        <div style={{ padding: "12px 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ position: "relative", height: 6, background: "#E8E2D8", overflow: "hidden" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${ORANGE}, ${TEAL})`,
              transition: "width 0.15s linear",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: DM, fontSize: "0.65rem", color: "#8A7868" }}>
              {eventIndex < 0 ? "Ready" : isFinished ? "Finished" : `Event ${eventIndex + 1} of ${events.length}`}
            </span>
            <span style={{ fontFamily: BEBAS, fontSize: "0.65rem", letterSpacing: "0.12em", color: NAVY, opacity: 0.6 }}>
              {events.length} TOTAL EDITS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
