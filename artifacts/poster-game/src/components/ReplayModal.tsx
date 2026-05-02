import { useState, useRef, useEffect, useCallback } from "react";
import type { CanvasElement, ReplayEvent } from "../types/game";
import { CanvasPreview } from "./CanvasPreview";

const BEBAS   = "'Bebas Neue', sans-serif";
const DM      = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";

const CANVAS_NATIVE_W  = 900;
const CANVAS_DISPLAY_W = 620;
const SCALE = CANVAS_DISPLAY_W / CANVAS_NATIVE_W;
const CANVAS_DISPLAY_H = Math.round(560 * SCALE);

type Props = {
  events: ReplayEvent[];
  prompt: string;
  defaultSpeed?: number;
  onClose: () => void;
};

type GroupedEvent = {
  idx: number;
  label: string;
  subLabel: string;
  type: "add" | "update" | "delete";
  elementId: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  startTimestamp: number;
  endTimestamp: number;
  lastRawIdx: number;
};

function groupEvents(events: ReplayEvent[]): GroupedEvent[] {
  const groups: GroupedEvent[] = [];

  const isPositional = (ev: ReplayEvent) =>
    ev.type === "update" && ev.updates &&
    ("x" in ev.updates || "y" in ev.updates || "width" in ev.updates || "height" in ev.updates || "vertices" in ev.updates);

  const elLabel = (ev: ReplayEvent) => {
    const t = ev.element?.type ?? (ev.updates ? Object.keys(ev.updates).filter(k=>!["x","y","width","height","vertices","zIndex"].includes(k))[0] : undefined);
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "Element";
  };

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const pos = isPositional(ev);

    if (pos) {
      const last = groups[groups.length - 1];
      if (last && last.type === "update" && last.elementId === ev.elementId &&
          last.playerId === ev.playerId && ev.timestamp - last.endTimestamp < 1500) {
        last.endTimestamp = ev.timestamp;
        last.lastRawIdx = i;
        continue;
      }
    }

    const type = ev.type;
    const label = type === "add"    ? `Added ${elLabel(ev)}` :
                  type === "delete" ? `Removed element` :
                  pos               ? `Moved ${elLabel(ev)}` :
                                      `Edited ${elLabel(ev)}`;
    const tOff = Math.round((ev.timestamp - (events[0]?.timestamp ?? ev.timestamp)) / 1000);
    groups.push({
      idx: groups.length,
      label,
      subLabel: `by ${ev.playerName} · ${tOff}s`,
      type,
      elementId: ev.elementId,
      playerId: ev.playerId,
      playerName: ev.playerName,
      playerColor: ev.playerColor,
      startTimestamp: ev.timestamp,
      endTimestamp: ev.timestamp,
      lastRawIdx: i,
    });
  }

  return groups;
}

function computeState(events: ReplayEvent[], upTo: number): Map<string, CanvasElement> {
  const map = new Map<string, CanvasElement>();
  for (let i = 0; i <= upTo; i++) {
    const ev = events[i];
    if (ev.type === "add" && ev.element) map.set(ev.elementId, { ...ev.element });
    else if (ev.type === "update" && ev.updates) {
      const ex = map.get(ev.elementId);
      if (ex) map.set(ev.elementId, { ...ex, ...ev.updates });
    } else if (ev.type === "delete") map.delete(ev.elementId);
  }
  return map;
}

export function ReplayModal({ events, prompt, onClose }: Props) {
  const groups = groupEvents(events);
  const [selIdx, setSelIdx]       = useState<number>(-1);
  const [flashId, setFlashId]     = useState<string | null>(null);
  const [playing, setPlaying]     = useState(false);
  const [speed, setSpeed]         = useState(1);
  const listRef   = useRef<HTMLDivElement>(null);
  const playTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => {
    clearTimeout(playTimer.current);
    clearTimeout(flashTimer.current);
  }, []);

  const selectGroup = useCallback((idx: number) => {
    setSelIdx(idx);
    if (idx >= 0 && idx < groups.length) {
      const g = groups[idx];
      clearTimeout(flashTimer.current);
      setFlashId(g.elementId);
      flashTimer.current = setTimeout(() => setFlashId(null), 900);
      const el = listRef.current?.children[idx] as HTMLElement | undefined;
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [groups]);

  useEffect(() => {
    if (!playing) return;
    if (selIdx >= groups.length - 1) { setPlaying(false); return; }
    const delay = Math.max(300, 900 / speed);
    playTimer.current = setTimeout(() => selectGroup(selIdx + 1), delay);
    return () => clearTimeout(playTimer.current);
  }, [playing, selIdx, speed, groups.length, selectGroup]);

  const canvasMap  = selIdx >= 0 ? computeState(events, groups[selIdx].lastRawIdx) : new Map<string, CanvasElement>();
  const elements   = Array.from(canvasMap.values()).sort((a, b) => a.zIndex - b.zIndex);
  const selectedG  = selIdx >= 0 ? groups[selIdx] : null;
  const flashEl    = flashId ? canvasMap.get(flashId) : null;

  const actionColor = (type: GroupedEvent["type"]) =>
    type === "add" ? TEAL : type === "delete" ? "#C03020" : MUSTARD;

  const typeIcon = (type: GroupedEvent["type"]) =>
    type === "add" ? "+" : type === "delete" ? "✕" : "✎";

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(6,4,2,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes flash   { 0%{opacity:0.9;box-shadow:0 0 0 4px rgba(255,255,255,0.4)} 100%{opacity:0;box-shadow:0 0 0 0} }
        @keyframes slideIn { from{transform:translateX(-6px);opacity:0} to{transform:none;opacity:1} }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column",
        width: CANVAS_DISPLAY_W + 260 + 40,
        maxHeight: "92vh",
        background: "#FFFFFF",
        border: `4px solid ${NAVY}`,
        boxShadow: `10px 12px 0 ${ORANGE}`,
        overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: NAVY, padding: "0.5rem 0.9rem",
          display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0,
        }}>
          <span style={{ fontFamily: BEBAS, fontSize: "1rem", letterSpacing: "0.2em", color: ORANGE }}>🎬 REPLAY</span>
          <span style={{
            fontFamily: DM, fontSize: "0.68rem", color: "rgba(255,255,255,0.45)",
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{prompt}</span>

          <span style={{ fontFamily: BEBAS, fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
            {groups.length} EDITS
          </span>

          <div style={{ display: "flex", gap: 4 }}>
            {([1, 2, 3] as const).map(s => (
              <button key={s} onClick={() => setSpeed(s)} style={{
                fontFamily: BEBAS, fontSize: "0.72rem", letterSpacing: "0.08em",
                padding: "2px 7px", cursor: "pointer", border: "none",
                background: speed === s ? ORANGE : "rgba(255,255,255,0.12)",
                color: speed === s ? "#fff" : "rgba(255,255,255,0.5)",
              }}>{s}x</button>
            ))}
          </div>

          <button onClick={() => {
            if (playing) { setPlaying(false); }
            else if (selIdx >= groups.length - 1) { setSelIdx(-1); setTimeout(() => { setSelIdx(0); setPlaying(true); }, 50); }
            else { if (selIdx < 0) setSelIdx(0); setPlaying(true); }
          }} style={{
            fontFamily: BEBAS, fontSize: "0.8rem", letterSpacing: "0.1em",
            padding: "3px 12px", cursor: "pointer", border: `2px solid ${ORANGE}`,
            background: ORANGE, color: "#fff",
          }}>
            {playing ? "⏸ PAUSE" : selIdx >= groups.length - 1 && groups.length > 0 ? "⏮ REPLAY" : "▶ PLAY"}
          </button>

          <button onClick={onClose} style={{
            width: 26, height: 26, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)",
            cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
            marginLeft: 2,
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── History list ── */}
          <div ref={listRef} style={{
            width: 260, borderRight: `2px solid #F0E8D8`,
            overflowY: "auto", background: "#FAFAF5", flexShrink: 0,
          }}>
            {groups.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", fontFamily: DM, fontSize: "0.72rem", color: "#C8B888" }}>
                No edits recorded
              </div>
            )}
            {groups.map((g, i) => {
              const active = i === selIdx;
              const color  = actionColor(g.type);
              return (
                <button key={i} onClick={() => { setPlaying(false); selectGroup(i); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "flex-start", gap: 8,
                    padding: "7px 10px",
                    background: active ? `${g.playerColor}22` : "transparent",
                    borderLeft: `3px solid ${active ? g.playerColor : "transparent"}`,
                    border: "none", borderBottom: "1px solid #F0E8D8",
                    cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                    animation: active ? "slideIn 0.14s ease" : "none",
                  }}>
                  {/* player dot + type icon */}
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: g.playerColor, border: `2px solid ${g.playerColor}88`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{typeIcon(g.type)}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: DM, fontSize: "0.68rem", fontWeight: 600,
                      color: active ? "#1A1208" : "#4A3C22",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{g.label}</div>
                    <div style={{ fontFamily: DM, fontSize: "0.56rem", color: "#8A7868", marginTop: 1 }}>
                      {g.subLabel}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: BEBAS, fontSize: "0.55rem", letterSpacing: "0.08em",
                    color: color, flexShrink: 0, marginTop: 3,
                  }}>{g.type.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* ── Canvas area ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F5EEE2", overflow: "hidden" }}>
            {/* Canvas */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflow: "hidden" }}>
              <div style={{ position: "relative", lineHeight: 0, flexShrink: 0 }}>
                <CanvasPreview elements={elements} displayWidth={CANVAS_DISPLAY_W} />

                {/* Flash overlay on changed element */}
                {flashEl && (
                  <div style={{
                    position: "absolute",
                    left: flashEl.x * SCALE, top: flashEl.y * SCALE,
                    width: flashEl.width * SCALE, height: flashEl.height * SCALE,
                    border: `2.5px solid ${selectedG?.playerColor ?? ORANGE}`,
                    borderRadius: Math.min((flashEl.cornerRadius ?? 0) * SCALE, 12),
                    boxShadow: `0 0 18px ${selectedG?.playerColor ?? ORANGE}BB`,
                    pointerEvents: "none",
                    animation: "flash 0.9s ease-out forwards",
                    zIndex: 10,
                  }} />
                )}

                {/* Empty state */}
                {selIdx < 0 && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    background: "rgba(245,238,226,0.85)",
                    gap: 8,
                  }}>
                    <span style={{ fontFamily: BEBAS, fontSize: "1.4rem", letterSpacing: "0.15em", color: NAVY, opacity: 0.5 }}>
                      SELECT AN EDIT
                    </span>
                    <span style={{ fontFamily: DM, fontSize: "0.7rem", color: "#8A7868" }}>
                      Click any item from the history list, or press Play
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info strip */}
            {selectedG && (
              <div style={{
                flexShrink: 0, padding: "8px 16px",
                background: "#FFFFFF", borderTop: `2px solid #F0E8D8`,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: selectedG.playerColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 28 28" style={{ width: "100%", height: "100%" }}>
                    <circle cx="14" cy="11" r="5.5" fill="rgba(255,255,255,0.88)" />
                    <ellipse cx="14" cy="26" rx="9.5" ry="7" fill="rgba(255,255,255,0.88)" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: DM, fontSize: "0.72rem", fontWeight: 700, color: "#1A1208" }}>
                    {selectedG.playerName}
                    <span style={{ fontWeight: 400, color: "#8A7868", marginLeft: 5 }}>
                      {selectedG.label.toLowerCase()}
                    </span>
                  </div>
                  <div style={{ fontFamily: DM, fontSize: "0.58rem", color: "#C8B888" }}>
                    {Math.round((selectedG.endTimestamp - (events[0]?.timestamp ?? selectedG.startTimestamp)) / 1000)}s into design phase
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={() => selIdx > 0 && selectGroup(selIdx - 1)} disabled={selIdx <= 0}
                    style={{
                      width: 28, height: 28, border: `1.5px solid ${selIdx > 0 ? NAVY : "#E8E2D8"}`,
                      borderRadius: 4, background: "none", cursor: selIdx > 0 ? "pointer" : "default",
                      color: selIdx > 0 ? NAVY : "#ccc", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>‹</button>
                  <span style={{ fontFamily: BEBAS, fontSize: "0.65rem", letterSpacing: "0.1em", color: "#8A7868", minWidth: 60, textAlign: "center" }}>
                    {selIdx + 1} / {groups.length}
                  </span>
                  <button onClick={() => selIdx < groups.length - 1 && selectGroup(selIdx + 1)} disabled={selIdx >= groups.length - 1}
                    style={{
                      width: 28, height: 28, border: `1.5px solid ${selIdx < groups.length - 1 ? NAVY : "#E8E2D8"}`,
                      borderRadius: 4, background: "none", cursor: selIdx < groups.length - 1 ? "pointer" : "default",
                      color: selIdx < groups.length - 1 ? NAVY : "#ccc", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>›</button>
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div style={{ height: 4, background: "#E8E2D8", flexShrink: 0 }}>
              <div style={{
                height: "100%",
                width: groups.length > 0 ? `${((selIdx + 1) / groups.length) * 100}%` : "0%",
                background: `linear-gradient(90deg, ${ORANGE}, ${TEAL})`,
                transition: "width 0.2s",
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
