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
const PANEL_W = 216;
const GRUNGE = "'Permanent Marker', cursive";

type ChipDef = {
  label: string;
  type: CanvasElement["type"];
  defaults: Partial<CanvasElement>;
  preview: () => React.ReactNode;
};

type SectionDef = {
  id: string;
  label: string;
  defaultOpen: boolean;
  chips: ChipDef[];
};

const SECTIONS: SectionDef[] = [
  {
    id: "type",
    label: "Typography",
    defaultOpen: true,
    chips: [
      {
        label: "Title",
        type: "heading",
        defaults: { width: 320, height: 64, content: "Title", fill: "#1a1a1a", fontSize: 42 },
        preview: () => <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.02em" }}>Title</span>,
      },
      {
        label: "Heading",
        type: "heading",
        defaults: { width: 260, height: 50, content: "Heading", fill: "#2C2C2C", fontSize: 28 },
        preview: () => <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: "#eee" }}>Heading</span>,
      },
      {
        label: "Body Text",
        type: "text",
        defaults: { width: 220, height: 80, content: "Body text content here.", fill: "#444", fontSize: 14 },
        preview: () => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", padding: "0 4px" }}>
            <div style={{ height: 3, background: "#666", borderRadius: 2, width: "100%" }} />
            <div style={{ height: 3, background: "#555", borderRadius: 2, width: "85%" }} />
            <div style={{ height: 3, background: "#555", borderRadius: 2, width: "70%" }} />
          </div>
        ),
      },
      {
        label: "Caption",
        type: "text",
        defaults: { width: 180, height: 28, content: "Caption text", fill: "#888", fontSize: 11 },
        preview: () => <div style={{ height: 3, background: "#777", borderRadius: 2, width: "60%", margin: "0 auto" }} />,
      },
    ],
  },
  {
    id: "buttons",
    label: "Buttons",
    defaultOpen: true,
    chips: [
      {
        label: "Button",
        type: "button",
        defaults: { width: 140, height: 40, content: "Click me", fill: "#CC2200", fontSize: 14 },
        preview: () => (
          <div style={{ background: "#CC2200", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11, padding: "4px 12px", borderRadius: 4 }}>Button</div>
        ),
      },
      {
        label: "Ghost Button",
        type: "button",
        defaults: { width: 140, height: 40, content: "Button", fill: "transparent", stroke: "#2C2C2C", fontSize: 14 },
        preview: () => (
          <div style={{ border: "2px dashed #aaa", color: "#ccc", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11, padding: "4px 12px", borderRadius: 4 }}>Button</div>
        ),
      },
      {
        label: "Icon Button",
        type: "label",
        defaults: { width: 40, height: 40, content: "☆", fill: "rgba(44,44,44,0.1)", stroke: "#aaa", fontSize: 20 },
        preview: () => (
          <div style={{ width: 28, height: 28, border: "1.5px solid #777", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#bbb" }}>☆</div>
        ),
      },
    ],
  },
  {
    id: "forms",
    label: "Forms",
    defaultOpen: false,
    chips: [
      {
        label: "Text Input",
        type: "rect",
        defaults: { width: 200, height: 36, fill: "transparent", stroke: "#aaa" },
        preview: () => (
          <div style={{ width: "100%", border: "1.5px solid #666", borderRadius: 4, height: 22, display: "flex", alignItems: "center", padding: "0 6px" }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#666" }}>Input</span>
            <span style={{ width: 1, height: 12, background: "#aaa", marginLeft: 2 }} />
          </div>
        ),
      },
      {
        label: "Password",
        type: "rect",
        defaults: { width: 200, height: 36, fill: "transparent", stroke: "#aaa" },
        preview: () => (
          <div style={{ width: "100%", border: "1.5px solid #666", borderRadius: 4, height: 22, display: "flex", alignItems: "center", padding: "0 6px", gap: 3 }}>
            {[...Array(5)].map((_, i) => <span key={i} style={{ width: 5, height: 5, background: "#888", borderRadius: "50%" }} />)}
          </div>
        ),
      },
      {
        label: "Dropdown",
        type: "button",
        defaults: { width: 160, height: 36, content: "Select ▾", fill: "transparent", stroke: "#aaa", fontSize: 13 },
        preview: () => (
          <div style={{ width: "100%", border: "1.5px solid #666", borderRadius: 4, height: 22, display: "flex", alignItems: "center", padding: "0 6px", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#999" }}>Select</span>
            <span style={{ fontSize: 9, color: "#888" }}>▾</span>
          </div>
        ),
      },
      {
        label: "Checkbox",
        type: "label",
        defaults: { width: 110, height: 24, content: "☐ Option", fill: "transparent", fontSize: 13 },
        preview: () => (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, border: "1.5px solid #777", borderRadius: 2 }} />
            <div style={{ height: 3, background: "#666", width: 40, borderRadius: 2 }} />
          </div>
        ),
      },
      {
        label: "Radio",
        type: "circle",
        defaults: { width: 16, height: 16, fill: "transparent", stroke: "#aaa" },
        preview: () => (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, border: "1.5px solid #777", borderRadius: "50%" }} />
            <div style={{ height: 3, background: "#666", width: 40, borderRadius: 2 }} />
          </div>
        ),
      },
      {
        label: "Slider",
        type: "divider",
        defaults: { width: 200, height: 4, fill: "#3ECFCF" },
        preview: () => (
          <div style={{ width: "100%", position: "relative", height: 16, display: "flex", alignItems: "center" }}>
            <div style={{ width: "100%", height: 3, background: "#555", borderRadius: 2 }} />
            <div style={{ position: "absolute", left: "55%", width: 12, height: 12, background: "#3ECFCF", borderRadius: "50%", transform: "translateX(-50%)" }} />
          </div>
        ),
      },
    ],
  },
  {
    id: "nav",
    label: "Navigation",
    defaultOpen: false,
    chips: [
      {
        label: "Nav Bar",
        type: "rect",
        defaults: { width: 450, height: 52, fill: "#2C2C2C" },
        preview: () => (
          <div style={{ width: "100%", height: 20, background: "#333", borderRadius: 3, display: "flex", alignItems: "center", padding: "0 6px", gap: 5 }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ width: 20, height: 3, background: "#666", borderRadius: 2 }} />)}
          </div>
        ),
      },
      {
        label: "Tabs",
        type: "rect",
        defaults: { width: 300, height: 40, fill: "rgba(44,44,44,0.08)", stroke: "#ccc" },
        preview: () => (
          <div style={{ display: "flex", gap: 2, width: "100%" }}>
            {["Tab 1", "Tab 2", "Tab 3"].map((t, i) => (
              <div key={t} style={{ flex: 1, height: 18, background: i === 0 ? "#444" : "#2a2a2a", border: "1px solid #555", borderRadius: "3px 3px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 7, color: i === 0 ? "#eee" : "#888", fontFamily: "'DM Sans',sans-serif" }}>{t}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        label: "Breadcrumb",
        type: "text",
        defaults: { width: 220, height: 24, content: "Home › Page › Current", fill: "#888", fontSize: 12 },
        preview: () => (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {["Home", "›", "Page", "›", "Here"].map((t, i) => (
              <span key={i} style={{ fontSize: 8, color: i % 2 === 0 ? "#3ECFCF" : "#666", fontFamily: "'DM Sans',sans-serif" }}>{t}</span>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: "cards",
    label: "Cards",
    defaultOpen: false,
    chips: [
      {
        label: "Content Card",
        type: "rect",
        defaults: { width: 220, height: 140, fill: "#ffffff", stroke: "#ddd" },
        preview: () => (
          <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 4, padding: 6, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ height: 3, background: "#888", borderRadius: 2, width: "80%" }} />
            <div style={{ height: 3, background: "#555", borderRadius: 2, width: "100%" }} />
            <div style={{ height: 3, background: "#555", borderRadius: 2, width: "70%" }} />
          </div>
        ),
      },
      {
        label: "Image Card",
        type: "rect",
        defaults: { width: 220, height: 180, fill: "#f5f5f5", stroke: "#ddd" },
        preview: () => (
          <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: 20, background: "#555", width: "100%" }} />
            <div style={{ padding: "4px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ height: 3, background: "#888", borderRadius: 2, width: "80%" }} />
              <div style={{ height: 3, background: "#555", borderRadius: 2, width: "60%" }} />
            </div>
          </div>
        ),
      },
      {
        label: "Modal",
        type: "rect",
        defaults: { width: 300, height: 200, fill: "#ffffff", stroke: "#ccc" },
        preview: () => (
          <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 4, padding: "4px 6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ height: 3, background: "#888", borderRadius: 2, width: "50%" }} />
              <span style={{ fontSize: 9, color: "#888", lineHeight: 1 }}>✕</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ height: 3, background: "#555", borderRadius: 2, width: "100%" }} />
              <div style={{ height: 3, background: "#555", borderRadius: 2, width: "80%" }} />
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "media",
    label: "Media & Elements",
    defaultOpen: false,
    chips: [
      {
        label: "Divider",
        type: "divider",
        defaults: { width: 400, height: 2, fill: "#ddd" },
        preview: () => <div style={{ width: "100%", height: 2, background: "#666", borderRadius: 1 }} />,
      },
      {
        label: "Image Block",
        type: "rect",
        defaults: { width: 220, height: 140, fill: "#e0e0e0", stroke: "#bbb" },
        preview: () => (
          <div style={{ width: "100%", height: 28, background: "#555", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#888", fontSize: 14 }}>✕</span>
          </div>
        ),
      },
      {
        label: "Video Block",
        type: "rect",
        defaults: { width: 220, height: 140, fill: "#1a1a1a", stroke: "#333" },
        preview: () => (
          <div style={{ width: "100%", height: 28, background: "#222", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#888", fontSize: 12 }}>▶</span>
          </div>
        ),
      },
      {
        label: "Avatar",
        type: "circle",
        defaults: { width: 52, height: 52, fill: "#9B59B6" },
        preview: () => (
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#9B59B6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>◉</span>
          </div>
        ),
      },
      {
        label: "Icon",
        type: "circle",
        defaults: { width: 36, height: 36, fill: "#3ECFCF" },
        preview: () => (
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid #3ECFCF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3ECFCF" }} />
          </div>
        ),
      },
      {
        label: "Map",
        type: "rect",
        defaults: { width: 240, height: 160, fill: "#e8f0e8", stroke: "#bbb" },
        preview: () => (
          <div style={{ width: "100%", height: 28, background: "#3a4a3a", borderRadius: 3, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 1, padding: 2 }}>
            {[...Array(6)].map((_, i) => <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 1 }} />)}
          </div>
        ),
      },
      {
        label: "Calendar",
        type: "rect",
        defaults: { width: 200, height: 160, fill: "#ffffff", stroke: "#ddd" },
        preview: () => (
          <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: 8, background: "#CC2200", width: "100%" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, padding: 2 }}>
              {[...Array(14)].map((_, i) => <div key={i} style={{ height: 4, background: "#444", borderRadius: 1 }} />)}
            </div>
          </div>
        ),
      },
    ],
  },
];

function CornerOrnament({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg
      width="28" height="28" viewBox="0 0 28 28"
      style={{ position: "absolute", display: "block", transform: `rotate(${rotate}deg)`, zIndex: 10 }}
    >
      <path d="M14 0 L16 11 L28 14 L16 17 L14 28 L12 17 L0 14 L12 11 Z" fill="#1a1a1a" />
      <circle cx="14" cy="14" r="3" fill="#E8E2D9" />
    </svg>
  );
}

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
    ? { outline: "2px dashed rgba(62,207,207,0.4)", outlineOffset: "2px" }
    : {};

  if (el.type === "rect") {
    return { style: { ...base, ...ownerRing, background: el.fill, border: el.stroke ? `2px solid ${el.stroke}` : "none" } };
  }
  if (el.type === "circle") {
    return { style: { ...base, ...ownerRing, background: el.fill, borderRadius: "50%", border: el.stroke ? `2px solid ${el.stroke}` : "none" } };
  }
  if (el.type === "divider") {
    return { style: { ...base, ...ownerRing, height: Math.max(el.height, 2), background: el.fill } };
  }
  if (el.type === "heading") {
    return {
      style: {
        ...base, ...ownerRing,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 800,
        fontSize: el.fontSize ?? 36,
        color: el.fill,
        display: "flex",
        alignItems: "center",
        letterSpacing: "-0.01em",
        overflow: "hidden",
        userSelect: "none" as const,
      },
    };
  }
  if (el.type === "text") {
    return {
      style: {
        ...base, ...ownerRing,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: el.fontSize ?? 14,
        color: el.fill,
        display: "flex",
        alignItems: "flex-start",
        lineHeight: 1.55,
        overflow: "hidden",
        userSelect: "none" as const,
      },
    };
  }
  if (el.type === "label") {
    return {
      style: {
        ...base, ...ownerRing,
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
    const isGhost = el.fill === "transparent";
    return {
      style: {
        ...base, ...ownerRing,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: el.fontSize ?? 14,
        color: isGhost ? el.stroke ?? "#2C2C2C" : "#E8E2D9",
        background: el.fill,
        border: el.stroke ? `2px solid ${el.stroke}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
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
  const myPlayer = room.players.find((p) => p.id === myPlayerId);
  const isImposter = myPlayer?.isImposter ?? false;

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ elId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SECTIONS.forEach((s) => { init[s.id] = !s.defaultOpen; });
    return init;
  });
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);

  useEffect(() => { setLocalPositions({}); }, [room.round]);

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
    if (pos) onUpdate(elId, { x: Math.round(pos.x), y: Math.round(pos.y) });
    draggingRef.current = null;
  }, [localPositions, onUpdate]);

  function handleElementMouseDown(e: React.MouseEvent, el: CanvasElement) {
    e.stopPropagation();
    draggingRef.current = { elId: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
  }

  function handleContextMenu(e: React.MouseEvent, el: CanvasElement) {
    e.preventDefault();
    if (el.ownerId === myPlayerId) onDelete(el.id);
  }

  function addChip(chip: ChipDef) {
    const w = chip.defaults.width ?? 200;
    const h = chip.defaults.height ?? 80;
    const x = Math.floor(Math.random() * (CANVAS_W - w - 20)) + 10;
    const y = Math.floor(Math.random() * (CANVAS_H - h - 20)) + 10;
    onAdd({ type: chip.type, x, y, width: w, height: h, content: chip.defaults.content, fill: chip.defaults.fill ?? "#2C2C2C", stroke: chip.defaults.stroke, fontSize: chip.defaults.fontSize });
  }

  function toggleSection(id: string) {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  }

  const lowerSearch = search.toLowerCase().trim();
  const filteredSections = SECTIONS.map((s) => ({
    ...s,
    chips: lowerSearch ? s.chips.filter((c) => c.label.toLowerCase().includes(lowerSearch)) : s.chips,
  })).filter((s) => s.chips.length > 0);

  const autoExpandedIds: Set<string> = new Set();
  if (lowerSearch) {
    filteredSections.forEach((s) => autoExpandedIds.add(s.id));
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#1a1a1a", overflow: "hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: "#1e1e1e", display: "flex", alignItems: "center", padding: "0 1.25rem", height: 56, flexShrink: 0, borderBottom: "1px solid #333", gap: "1.2rem" }}>
        {/* Left: logo */}
        <img
          src="/poster-logo.png"
          alt="POSTER"
          style={{ height: 38, display: "block", filter: "brightness(0) invert(1)", opacity: 0.9 }}
        />

        <div style={{ width: 1, height: 28, background: "#333", flexShrink: 0 }} />

        {/* Center: round + prompt */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: GRUNGE, fontSize: "0.8rem", color: "rgba(232,226,217,0.45)", letterSpacing: "0.08em", lineHeight: 1 }}>
            Round {room.round} / {room.maxRounds}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#E8E2D9", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
            {room.prompt}
          </div>
        </div>

        {/* Right: role badge + timer + skip */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexShrink: 0 }}>
          <div style={{
            fontFamily: GRUNGE,
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            padding: "0.25rem 0.7rem",
            borderRadius: 20,
            background: isImposter ? "rgba(204,34,0,0.18)" : "rgba(62,207,207,0.12)",
            border: `1px solid ${isImposter ? "rgba(204,34,0,0.5)" : "rgba(62,207,207,0.35)"}`,
            color: isImposter ? "#CC2200" : "#3ECFCF",
          }}>
            {isImposter ? "IMPOSTER" : "CREWMATE"}
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.58rem", color: "rgba(232,226,217,0.35)", letterSpacing: "0.12em", marginBottom: 1 }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>

          {amIHost && (
            <button
              onClick={onSkip}
              style={{ fontFamily: GRUNGE, fontSize: "0.8rem", color: "#E8E2D9", background: "rgba(232,226,217,0.07)", border: "1px solid rgba(232,226,217,0.18)", padding: "0.3rem 0.8rem", cursor: "pointer", borderRadius: 4, letterSpacing: "0.05em" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,226,217,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(232,226,217,0.07)")}
            >
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: PANEL_W, background: "#252525", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Search bar */}
          <div style={{ padding: "0.6rem 0.6rem 0.4rem" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#777", pointerEvents: "none" }}>🔍</span>
              <input
                type="text"
                placeholder="Search… e.g. calendar, map"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1.5px solid #444",
                  color: "#eee",
                  borderRadius: 6,
                  padding: "0.35rem 0.5rem 0.35rem 1.8rem",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#666")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#444")}
              />
            </div>
          </div>

          {/* Component sections */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0.4rem" }}>
            {filteredSections.length === 0 ? (
              <div style={{ textAlign: "center", color: "#666", fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", marginTop: "2rem", padding: "0 1rem" }}>
                No components found
              </div>
            ) : (
              filteredSections.map((section) => {
                const isOpen = lowerSearch ? true : !collapsed[section.id];
                return (
                  <div key={section.id} style={{ marginBottom: "0.25rem" }}>
                    <button
                      onClick={() => !lowerSearch && toggleSection(section.id)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.4rem 0.3rem",
                        color: "#aaa",
                        fontFamily: GRUNGE,
                        fontSize: "0.7rem",
                        letterSpacing: "0.08em",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 10, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▸</span>
                      {section.label.toUpperCase()}
                    </button>

                    {isOpen && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingBottom: 4 }}>
                        {section.chips.map((chip) => {
                          const chipKey = `${section.id}-${chip.label}`;
                          const hov = hoveredChip === chipKey;
                          return (
                            <div
                              key={chip.label}
                              onClick={() => addChip(chip)}
                              onMouseEnter={() => setHoveredChip(chipKey)}
                              onMouseLeave={() => setHoveredChip(null)}
                              style={{
                                background: "#2a2a2a",
                                border: `1.5px solid ${hov ? "#666" : "#444"}`,
                                borderRadius: 8,
                                padding: "7px 8px 5px",
                                cursor: "pointer",
                                boxShadow: hov ? "0 6px 16px rgba(0,0,0,0.6)" : "0 4px 10px rgba(0,0,0,0.5)",
                                transform: hov ? "translateY(-3px)" : "none",
                                transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 4,
                                userSelect: "none",
                                position: "relative",
                              }}
                            >
                              <div style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", fontSize: "0.65rem", color: "#555", pointerEvents: "none" }}>⠿</div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 28, width: "100%" }}>
                                {chip.preview()}
                              </div>
                              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.65rem", color: "#888", letterSpacing: "0.03em" }}>
                                {chip.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div style={{ height: 8 }} />
          </div>

          {/* ── PLAYER LIST ── pinned bottom */}
          <div style={{ borderTop: "1px solid #333", padding: "0.6rem 0.8rem 0.7rem" }}>
            <div style={{ fontFamily: GRUNGE, fontSize: "0.6rem", letterSpacing: "0.1em", color: "#666", marginBottom: "0.4rem" }}>PLAYERS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {room.players.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: p.color, flexShrink: 0, boxShadow: `0 0 6px ${p.color}80` }} />
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.72rem", color: p.id === myPlayerId ? "#E8E2D9" : "rgba(232,226,217,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: p.id === myPlayerId ? 600 : 400 }}>
                    {p.name}{p.id === myPlayerId ? " (you)" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CANVAS AREA ── */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", padding: "3rem 4rem 2rem" }}>
          <div style={{ position: "relative" }}>

            {/* ROUND N text above frame */}
            <div style={{
              position: "absolute", top: -44, left: "50%", transform: "translateX(-50%)",
              fontFamily: GRUNGE, fontSize: "1.4rem", color: "rgba(232,226,217,0.18)",
              letterSpacing: "0.25em", whiteSpace: "nowrap", pointerEvents: "none",
            }}>
              ROUND {room.round}
            </div>

            {/* Ornate decorative frame (purely visual, rotated) */}
            <div style={{
              position: "absolute",
              inset: -14,
              border: "14px solid #111",
              transform: "rotate(-1deg)",
              pointerEvents: "none",
              boxShadow: "0 0 0 2px #2a2a2a, 0 0 0 4px #111, 8px 12px 32px rgba(0,0,0,0.7), inset 0 0 0 1px #333",
              zIndex: 0,
            }} />

            {/* Corner ornaments */}
            <div style={{ position: "absolute", top: -24, left: -24, pointerEvents: "none", zIndex: 2 }}>
              <CornerOrnament rotate={0} />
            </div>
            <div style={{ position: "absolute", top: -24, right: -24, pointerEvents: "none", zIndex: 2 }}>
              <CornerOrnament rotate={90} />
            </div>
            <div style={{ position: "absolute", bottom: -24, left: -24, pointerEvents: "none", zIndex: 2 }}>
              <CornerOrnament rotate={270} />
            </div>
            <div style={{ position: "absolute", bottom: -24, right: -24, pointerEvents: "none", zIndex: 2 }}>
              <CornerOrnament rotate={180} />
            </div>

            {/* Sticky note — prompt */}
            <div style={{
              position: "absolute",
              top: 18,
              right: -148,
              width: 128,
              background: "#F5EE7A",
              padding: "8px 10px 10px",
              transform: "rotate(3deg)",
              boxShadow: "2px 4px 10px rgba(0,0,0,0.4)",
              zIndex: 5,
              pointerEvents: "none",
            }}>
              <div style={{ fontFamily: GRUNGE, fontSize: "0.6rem", color: "#8a7700", letterSpacing: "0.08em", marginBottom: 4 }}>BRIEF</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.68rem", color: "#3a3000", lineHeight: 1.4, wordBreak: "break-word" }}>
                {room.prompt}
              </div>
            </div>

            {/* Sticky note — fonts */}
            <div style={{
              position: "absolute",
              top: 154,
              right: -140,
              width: 120,
              background: "#f0f0f0",
              padding: "8px 10px 10px",
              transform: "rotate(-2deg)",
              boxShadow: "2px 4px 10px rgba(0,0,0,0.4)",
              zIndex: 5,
              pointerEvents: "none",
            }}>
              <div style={{ fontFamily: GRUNGE, fontSize: "0.6rem", color: "#888", letterSpacing: "0.08em", marginBottom: 4 }}>FONTS</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.65rem", color: "#333", lineHeight: 1.6 }}>
                🔒 DM Sans<br />🔒 Bebas Neue
              </div>
            </div>

            {/* Actual interactive canvas */}
            <div
              ref={canvasRef}
              style={{
                position: "relative",
                width: CANVAS_W,
                height: CANVAS_H,
                background: "#F8F4EE",
                flexShrink: 0,
                cursor: draggingRef.current ? "grabbing" : "default",
                zIndex: 1,
                overflow: "hidden",
              }}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              {/* Canvas ghost text */}
              {room.canvas.length === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    color: "rgba(0,0,0,0.06)",
                    textAlign: "center",
                    padding: "0 3rem",
                    lineHeight: 1.3,
                  }}>
                    {room.prompt}
                  </div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "rgba(0,0,0,0.1)", marginTop: "0.75rem" }}>
                    Click elements from the panel to add them
                  </div>
                </div>
              )}

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
