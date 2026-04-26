import { useState, useRef, useCallback, useEffect } from "react";
import type { RoomState, CanvasElement } from "../types/game";
import { Timer } from "../components/Timer";

type Props = {
  room: RoomState;
  myPlayerId: string;
  amIHost: boolean;
  onAdd: (el: Omit<CanvasElement, "id" | "zIndex" | "ownerId">) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onSkip: () => void;
};

const CANVAS_W = 900;
const CANVAS_H = 560;

type ToolItem = {
  label: string;
  type: CanvasElement["type"];
  defaults: Partial<CanvasElement>;
};

const TOOLS: ToolItem[] = [
  { label: "Heading", type: "heading", defaults: { width: 300, height: 60, content: "Heading", fill: "#2C2C2C", fontSize: 36 } },
  { label: "Text", type: "text", defaults: { width: 200, height: 80, content: "Text block", fill: "#2C2C2C", fontSize: 14 } },
  { label: "Rectangle", type: "rect", defaults: { width: 200, height: 120, fill: "#3ECFCF", stroke: "#2C2C2C" } },
  { label: "Circle", type: "circle", defaults: { width: 100, height: 100, fill: "#E87DBB" } },
  { label: "Label", type: "label", defaults: { width: 120, height: 30, content: "Label", fill: "#F5A623", fontSize: 12 } },
  { label: "Button", type: "button", defaults: { width: 140, height: 40, content: "Click me", fill: "#CC2200", fontSize: 14 } },
  { label: "Divider", type: "divider", defaults: { width: 400, height: 4, fill: "#2C2C2C" } },
];

function renderElement(el: CanvasElement, myPlayerId: string) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    zIndex: el.zIndex,
    boxSizing: "border-box",
  };

  const isOwn = el.ownerId === myPlayerId;
  const ownerRing: React.CSSProperties = isOwn
    ? { outline: "2px dashed rgba(255,255,255,0.25)", outlineOffset: "2px" }
    : {};

  if (el.type === "rect") {
    return {
      style: {
        ...base,
        ...ownerRing,
        background: el.fill,
        border: el.stroke ? `2px solid ${el.stroke}` : "none",
      },
    };
  }
  if (el.type === "circle") {
    return {
      style: {
        ...base,
        ...ownerRing,
        background: el.fill,
        borderRadius: "50%",
        border: el.stroke ? `2px solid ${el.stroke}` : "none",
      },
    };
  }
  if (el.type === "divider") {
    return {
      style: {
        ...base,
        ...ownerRing,
        height: Math.max(el.height, 2),
        background: el.fill,
      },
    };
  }
  if (el.type === "heading") {
    return {
      style: {
        ...base,
        ...ownerRing,
        fontFamily: "'Rubik Dirt', sans-serif",
        fontSize: el.fontSize ?? 36,
        color: el.fill,
        display: "flex",
        alignItems: "center",
        letterSpacing: "0.04em",
        overflow: "hidden",
        userSelect: "none" as const,
      },
    };
  }
  if (el.type === "text") {
    return {
      style: {
        ...base,
        ...ownerRing,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: el.fontSize ?? 14,
        color: el.fill,
        display: "flex",
        alignItems: "flex-start",
        lineHeight: 1.5,
        overflow: "hidden",
        userSelect: "none" as const,
      },
    };
  }
  if (el.type === "label") {
    return {
      style: {
        ...base,
        ...ownerRing,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: el.fontSize ?? 12,
        color: "#2C2C2C",
        background: el.fill,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "2px",
        fontWeight: 600,
        overflow: "hidden",
        userSelect: "none" as const,
      },
    };
  }
  if (el.type === "button") {
    return {
      style: {
        ...base,
        ...ownerRing,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: el.fontSize ?? 14,
        color: "#E8E2D9",
        background: el.fill,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "3px",
        fontWeight: 600,
        cursor: "default",
        overflow: "hidden",
        userSelect: "none" as const,
      },
    };
  }
  return { style: base };
}

export function GamePage({ room, myPlayerId, amIHost, onAdd, onUpdate, onDelete, onSkip }: Props) {
  const isImposter = room.myRole === "imposter";
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ elId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    setLocalPositions({});
  }, [room.round]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingRef.current || !canvasRef.current) return;
    const { elId, startX, startY, origX, origY } = draggingRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const el = room.canvas.find((c) => c.id === elId);
    if (!el) return;
    const newX = Math.max(0, Math.min(CANVAS_W - el.width, origX + dx));
    const newY = Math.max(0, Math.min(CANVAS_H - el.height, origY + dy));
    setLocalPositions((p) => ({ ...p, [elId]: { x: newX, y: newY } }));
  }, [room.canvas]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!draggingRef.current) return;
    const { elId } = draggingRef.current;
    const pos = localPositions[elId];
    if (pos) {
      onUpdate(elId, { x: Math.round(pos.x), y: Math.round(pos.y) });
    }
    draggingRef.current = null;
  }, [localPositions, onUpdate]);

  function handleElementMouseDown(e: React.MouseEvent, el: CanvasElement) {
    e.stopPropagation();
    draggingRef.current = {
      elId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
    };
  }

  function handleContextMenu(e: React.MouseEvent, el: CanvasElement) {
    e.preventDefault();
    if (el.ownerId === myPlayerId) {
      onDelete(el.id);
    }
  }

  function addTool(tool: ToolItem) {
    const x = Math.floor(Math.random() * (CANVAS_W - (tool.defaults.width ?? 200) - 20)) + 10;
    const y = Math.floor(Math.random() * (CANVAS_H - (tool.defaults.height ?? 80) - 20)) + 10;
    onAdd({
      type: tool.type,
      x,
      y,
      width: tool.defaults.width ?? 200,
      height: tool.defaults.height ?? 80,
      content: tool.defaults.content,
      fill: tool.defaults.fill ?? "#2C2C2C",
      stroke: tool.defaults.stroke,
      fontSize: tool.defaults.fontSize,
    });
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#E8E2D9", overflow: "hidden" }}>
      {/* Top bar */}
      <div
        style={{
          background: "#2C2C2C",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          padding: "0.6rem 1.25rem",
          flexShrink: 0,
          borderBottom: "2px solid #1a1a1a",
        }}
      >
        <img src="/poster-logo.png" alt="POSTER" style={{ height: "34px", display: "block", filter: "brightness(0) invert(1)" }} />

        <div style={{ width: "1px", height: "24px", background: "rgba(232,226,217,0.2)" }} />

        <div>
          <div style={{ fontFamily: "'Rubik Dirt', sans-serif", letterSpacing: "0.1em", fontSize: "0.7rem", color: "rgba(232,226,217,0.5)", marginBottom: "1px" }}>
            Round {room.round}/{room.maxRounds}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#E8E2D9", fontWeight: 500 }}>
            {room.prompt}
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
          {isImposter && (
            <div style={{
              fontFamily: "'Rubik Dirt', sans-serif",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              color: "#CC2200",
              background: "rgba(204,34,0,0.12)",
              border: "1px solid rgba(204,34,0,0.4)",
              padding: "0.2rem 0.6rem",
              animation: "pulse 2s infinite",
            }}>
              IMPOSTER — SABOTAGE SUBTLY
            </div>
          )}
          {!isImposter && (
            <div style={{
              fontFamily: "'Rubik Dirt', sans-serif",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              color: "rgba(232,226,217,0.5)",
              border: "1px solid rgba(232,226,217,0.15)",
              padding: "0.2rem 0.6rem",
            }}>
              CREWMATE
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Rubik Dirt', sans-serif", fontSize: "0.6rem", color: "rgba(232,226,217,0.4)", letterSpacing: "0.1em" }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>

          {amIHost && (
            <button
              onClick={onSkip}
              style={{
                fontFamily: "'Rubik Dirt', sans-serif",
                letterSpacing: "0.08em",
                fontSize: "0.85rem",
                color: "#E8E2D9",
                background: "rgba(232,226,217,0.08)",
                border: "1px solid rgba(232,226,217,0.2)",
                padding: "0.35rem 0.75rem",
                cursor: "pointer",
              }}
            >
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          style={{
            width: "120px",
            background: "#3A3A3A",
            borderRight: "2px solid #1a1a1a",
            display: "flex",
            flexDirection: "column",
            padding: "0.75rem 0.5rem",
            gap: "0.4rem",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <div style={{ fontFamily: "'Rubik Dirt', sans-serif", fontSize: "0.65rem", letterSpacing: "0.15em", color: "rgba(232,226,217,0.4)", textAlign: "center", marginBottom: "0.25rem" }}>
            ADD ELEMENT
          </div>
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => addTool(tool)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#E8E2D9",
                background: "rgba(232,226,217,0.06)",
                border: "1px solid rgba(232,226,217,0.12)",
                padding: "0.5rem 0.25rem",
                cursor: "pointer",
                textAlign: "center",
                transition: "background 0.15s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,226,217,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(232,226,217,0.06)")}
            >
              {tool.label}
            </button>
          ))}

          <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid rgba(232,226,217,0.1)" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", color: "rgba(232,226,217,0.35)", textAlign: "center", lineHeight: 1.4 }}>
              Drag to move<br />Right-click to delete own
            </div>
          </div>

          {/* Player list */}
          <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(232,226,217,0.1)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {room.players.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", color: "rgba(232,226,217,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "flex-start", padding: "1.5rem", background: "#E8E2D9" }}>
          <div
            ref={canvasRef}
            style={{
              position: "relative",
              width: CANVAS_W,
              height: CANVAS_H,
              background: "#F8F4EE",
              border: "2px solid #2C2C2C",
              boxShadow: "6px 6px 0 rgba(0,0,0,0.15)",
              flexShrink: 0,
              cursor: draggingRef.current ? "grabbing" : "default",
            }}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {room.canvas.map((el) => {
              const localPos = localPositions[el.id];
              const displayEl = localPos ? { ...el, x: localPos.x, y: localPos.y } : el;
              const { style } = renderElement(displayEl, myPlayerId);

              if (el.type === "heading" || el.type === "text" || el.type === "label" || el.type === "button") {
                return (
                  <div
                    key={el.id}
                    style={{ ...style, cursor: "grab" }}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    onContextMenu={(e) => handleContextMenu(e, el)}
                  >
                    {el.content}
                  </div>
                );
              }

              return (
                <div
                  key={el.id}
                  style={{ ...style, cursor: "grab" }}
                  onMouseDown={(e) => handleElementMouseDown(e, el)}
                  onContextMenu={(e) => handleContextMenu(e, el)}
                />
              );
            })}

            {room.canvas.length === 0 && (
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}>
                <div style={{ fontFamily: "'Rubik Dirt', sans-serif", fontSize: "1.5rem", color: "rgba(44,44,44,0.15)", letterSpacing: "0.1em" }}>
                  {room.prompt}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(44,44,44,0.2)", marginTop: "0.5rem" }}>
                  Add elements from the toolbar →
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
