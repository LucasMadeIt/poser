import { useState, useRef, useCallback, useEffect } from "react";
import type { RoomState, CanvasElement } from "../types/game";
import { Timer } from "../components/Timer";
import type { RemoteCursor } from "../hooks/useGame";

type Props = {
  room: RoomState;
  myPlayerId: string;
  amIHost: boolean;
  onAdd: (el: Omit<CanvasElement, "id" | "zIndex" | "ownerId">) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onSkip: () => void;
  remoteCursors: Record<string, RemoteCursor>;
  emitCursorMove: (x: number, y: number) => void;
};

const CANVAS_W = 900;
const CANVAS_H = 560;
const PANEL_W = 216;
const GRUNGE = "'Permanent Marker', cursive";
const PALETTE = ["#ffffff", "#1a1a1a", "#555555", "#aaaaaa", "#E8E2D9", "#CC2200", "#3ECFCF", "#E87DBB", "#F5A623", "#9B59B6", "#F1C40F", "#2C2C2C"];
const TEXT_TYPES: CanvasElement["type"][] = ["text", "heading", "label", "button"];
const FONT_SIZES = [12, 14, 16, 18, 24, 32, 48, 64];

type ChipDef = {
  label: string;
  type: CanvasElement["type"];
  defaults: Partial<Omit<CanvasElement, "id" | "zIndex" | "ownerId">>;
  preview: () => React.ReactNode;
};

type SectionDef = { id: string; label: string; defaultOpen: boolean; chips: ChipDef[] };

const SECTIONS: SectionDef[] = [
  {
    id: "type", label: "Typography", defaultOpen: true,
    chips: [
      { label: "Title", type: "heading", defaults: { width: 320, height: 64, content: "Title", fill: "#1a1a1a", fontSize: 42 }, preview: () => <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff" }}>Title</span> },
      { label: "Heading", type: "heading", defaults: { width: 260, height: 50, content: "Heading", fill: "#2C2C2C", fontSize: 28 }, preview: () => <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: "#eee" }}>Heading</span> },
      { label: "Body Text", type: "text", defaults: { width: 220, height: 80, content: "Body text content here.", fill: "#444", fontSize: 14 }, preview: () => <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", padding: "0 4px" }}>{[100, 85, 70].map((w, i) => <div key={i} style={{ height: 3, background: "#666", borderRadius: 2, width: `${w}%` }} />)}</div> },
      { label: "Caption", type: "text", defaults: { width: 180, height: 28, content: "Caption text", fill: "#888", fontSize: 11 }, preview: () => <div style={{ height: 3, background: "#777", borderRadius: 2, width: "60%", margin: "0 auto" }} /> },
    ],
  },
  {
    id: "buttons", label: "Buttons", defaultOpen: true,
    chips: [
      // Item 8: Button chip is dark/wireframe style — NO red
      { label: "Button", type: "button", defaults: { width: 140, height: 40, content: "Button", fill: "#2C2C2C", stroke: "#888", fontSize: 14 }, preview: () => <div style={{ border: "1.5px solid #999", color: "#eee", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11, padding: "4px 14px", borderRadius: 4 }}>Button</div> },
      { label: "Ghost Button", type: "button", defaults: { width: 140, height: 40, content: "Button", fill: "transparent", stroke: "#2C2C2C", fontSize: 14 }, preview: () => <div style={{ border: "2px dashed #aaa", color: "#ccc", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11, padding: "4px 12px", borderRadius: 4 }}>Button</div> },
      { label: "Icon Button", type: "label", defaults: { width: 40, height: 40, content: "☆", fill: "rgba(44,44,44,0.1)", stroke: "#aaa", fontSize: 20 }, preview: () => <div style={{ width: 28, height: 28, border: "1.5px solid #777", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#bbb" }}>☆</div> },
    ],
  },
  {
    id: "forms", label: "Forms", defaultOpen: false,
    chips: [
      { label: "Text Input", type: "rect", defaults: { width: 200, height: 36, fill: "transparent", stroke: "#aaa" }, preview: () => <div style={{ width: "100%", border: "1.5px solid #666", borderRadius: 4, height: 22, display: "flex", alignItems: "center", padding: "0 6px", gap: 3 }}><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#666" }}>Input</span><span style={{ width: 1, height: 12, background: "#aaa" }} /></div> },
      { label: "Password", type: "rect", defaults: { width: 200, height: 36, fill: "transparent", stroke: "#aaa" }, preview: () => <div style={{ width: "100%", border: "1.5px solid #666", borderRadius: 4, height: 22, display: "flex", alignItems: "center", padding: "0 6px", gap: 3 }}>{[...Array(5)].map((_, i) => <span key={i} style={{ width: 5, height: 5, background: "#888", borderRadius: "50%" }} />)}</div> },
      { label: "Dropdown", type: "button", defaults: { width: 160, height: 36, content: "Select ▾", fill: "transparent", stroke: "#aaa", fontSize: 13 }, preview: () => <div style={{ width: "100%", border: "1.5px solid #666", borderRadius: 4, height: 22, display: "flex", alignItems: "center", padding: "0 6px", justifyContent: "space-between" }}><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#999" }}>Select</span><span style={{ fontSize: 9, color: "#888" }}>▾</span></div> },
      { label: "Checkbox", type: "label", defaults: { width: 110, height: 24, content: "☐ Option", fill: "transparent", fontSize: 13 }, preview: () => <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, border: "1.5px solid #777", borderRadius: 2 }} /><div style={{ height: 3, background: "#666", width: 40, borderRadius: 2 }} /></div> },
      { label: "Radio", type: "circle", defaults: { width: 16, height: 16, fill: "transparent", stroke: "#aaa" }, preview: () => <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, border: "1.5px solid #777", borderRadius: "50%" }} /><div style={{ height: 3, background: "#666", width: 40, borderRadius: 2 }} /></div> },
      { label: "Slider", type: "divider", defaults: { width: 200, height: 4, fill: "#3ECFCF" }, preview: () => <div style={{ width: "100%", position: "relative", height: 16, display: "flex", alignItems: "center" }}><div style={{ width: "100%", height: 3, background: "#555", borderRadius: 2 }} /><div style={{ position: "absolute", left: "55%", width: 12, height: 12, background: "#3ECFCF", borderRadius: "50%", transform: "translateX(-50%)" }} /></div> },
    ],
  },
  {
    id: "nav", label: "Navigation", defaultOpen: false,
    chips: [
      { label: "Nav Bar", type: "rect", defaults: { width: 450, height: 52, fill: "#2C2C2C" }, preview: () => <div style={{ width: "100%", height: 20, background: "#333", borderRadius: 3, display: "flex", alignItems: "center", padding: "0 6px", gap: 5 }}>{[...Array(3)].map((_, i) => <div key={i} style={{ width: 20, height: 3, background: "#666", borderRadius: 2 }} />)}</div> },
      { label: "Tabs", type: "rect", defaults: { width: 300, height: 40, fill: "rgba(44,44,44,0.08)", stroke: "#ccc" }, preview: () => <div style={{ display: "flex", gap: 2, width: "100%" }}>{["Tab 1", "Tab 2", "Tab 3"].map((t, i) => <div key={t} style={{ flex: 1, height: 18, background: i === 0 ? "#444" : "#2a2a2a", border: "1px solid #555", borderRadius: "3px 3px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 7, color: i === 0 ? "#eee" : "#888", fontFamily: "'DM Sans',sans-serif" }}>{t}</span></div>)}</div> },
      { label: "Breadcrumb", type: "text", defaults: { width: 220, height: 24, content: "Home › Page › Current", fill: "#888", fontSize: 12 }, preview: () => <div style={{ display: "flex", gap: 4, alignItems: "center" }}>{["Home", "›", "Page", "›", "Here"].map((t, i) => <span key={i} style={{ fontSize: 8, color: i % 2 === 0 ? "#3ECFCF" : "#666", fontFamily: "'DM Sans',sans-serif" }}>{t}</span>)}</div> },
    ],
  },
  {
    id: "cards", label: "Cards", defaultOpen: false,
    chips: [
      { label: "Content Card", type: "rect", defaults: { width: 220, height: 140, fill: "#ffffff", stroke: "#ddd" }, preview: () => <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 4, padding: 6, display: "flex", flexDirection: "column", gap: 3 }}>{[80, 100, 70].map((w, i) => <div key={i} style={{ height: 3, background: i === 0 ? "#888" : "#555", borderRadius: 2, width: `${w}%` }} />)}</div> },
      { label: "Image Card", type: "rect", defaults: { width: 220, height: 180, fill: "#f5f5f5", stroke: "#ddd" }, preview: () => <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 4, overflow: "hidden" }}><div style={{ height: 20, background: "#555", width: "100%" }} /><div style={{ padding: "4px 6px", display: "flex", flexDirection: "column", gap: 3 }}>{[80, 60].map((w, i) => <div key={i} style={{ height: 3, background: i === 0 ? "#888" : "#555", borderRadius: 2, width: `${w}%` }} />)}</div></div> },
      { label: "Modal", type: "rect", defaults: { width: 300, height: 200, fill: "#ffffff", stroke: "#ccc" }, preview: () => <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 4, padding: "4px 6px" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><div style={{ height: 3, background: "#888", borderRadius: 2, width: "50%" }} /><span style={{ fontSize: 9, color: "#888" }}>✕</span></div>{[100, 80].map((w, i) => <div key={i} style={{ height: 3, background: "#555", borderRadius: 2, width: `${w}%`, marginBottom: 3 }} />)}</div> },
    ],
  },
  {
    id: "media", label: "Media & Elements", defaultOpen: false,
    chips: [
      { label: "Divider", type: "divider", defaults: { width: 400, height: 2, fill: "#ddd" }, preview: () => <div style={{ width: "100%", height: 2, background: "#666", borderRadius: 1 }} /> },
      { label: "Image Block", type: "rect", defaults: { width: 220, height: 140, fill: "#e0e0e0", stroke: "#bbb" }, preview: () => <div style={{ width: "100%", height: 28, background: "#555", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#888", fontSize: 14 }}>✕</span></div> },
      { label: "Video Block", type: "rect", defaults: { width: 220, height: 140, fill: "#1a1a1a", stroke: "#333" }, preview: () => <div style={{ width: "100%", height: 28, background: "#222", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#888", fontSize: 12 }}>▶</span></div> },
      { label: "Avatar", type: "circle", defaults: { width: 52, height: 52, fill: "#9B59B6" }, preview: () => <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#9B59B6", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>◉</span></div> },
      { label: "Icon", type: "circle", defaults: { width: 36, height: 36, fill: "#3ECFCF" }, preview: () => <div style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid #3ECFCF", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3ECFCF" }} /></div> },
      { label: "Map", type: "rect", defaults: { width: 240, height: 160, fill: "#e8f0e8", stroke: "#bbb" }, preview: () => <div style={{ width: "100%", height: 28, background: "#3a4a3a", borderRadius: 3, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 1, padding: 2 }}>{[...Array(6)].map((_, i) => <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 1 }} />)}</div> },
      { label: "Calendar", type: "rect", defaults: { width: 200, height: 160, fill: "#ffffff", stroke: "#ddd" }, preview: () => <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 3, overflow: "hidden" }}><div style={{ height: 8, background: "#CC2200", width: "100%" }} /><div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, padding: 2 }}>{[...Array(14)].map((_, i) => <div key={i} style={{ height: 4, background: "#444", borderRadius: 1 }} />)}</div></div> },
    ],
  },
];

function CornerOrnament({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: "block", transform: `rotate(${rotate}deg)` }}>
      <line x1="20" y1="0" x2="20" y2="16" stroke="#444" strokeWidth="1.5" />
      <line x1="0" y1="20" x2="16" y2="20" stroke="#444" strokeWidth="1.5" />
      <path d="M20 8 L23 20 L20 32 L17 20 Z" fill="#2a2a2a" />
      <path d="M8 20 L20 23 L32 20 L20 17 Z" fill="#2a2a2a" />
      <circle cx="20" cy="20" r="6" fill="#111" stroke="#444" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="2.5" fill="#555" />
      <rect x="0" y="0" width="12" height="1.5" fill="#333" />
      <rect x="0" y="0" width="1.5" height="12" fill="#333" />
    </svg>
  );
}

function getElementStyle(el: CanvasElement, isSelected: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    zIndex: el.zIndex,
    boxSizing: "border-box",
    cursor: "grab",
    userSelect: "none" as const,
    // NO persistent border — only selection shows border (handled separately)
  };

  if (el.type === "rect") return { ...base, background: el.fill, border: el.stroke ? `2px solid ${el.stroke}` : "none" };
  if (el.type === "circle") return { ...base, background: el.fill, borderRadius: "50%", border: el.stroke ? `2px solid ${el.stroke}` : "none" };
  if (el.type === "divider") return { ...base, height: Math.max(el.height, 2), background: el.fill };
  if (el.type === "heading") return { ...base, fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: el.fontSize ?? 36, color: el.fill, display: "flex", alignItems: "center", letterSpacing: "-0.01em", overflow: "hidden" };
  if (el.type === "text") return { ...base, fontFamily: "'DM Sans', sans-serif", fontSize: el.fontSize ?? 14, color: el.fill, display: "flex", alignItems: "flex-start", lineHeight: 1.55, overflow: "hidden" };
  if (el.type === "label") return { ...base, fontFamily: "'DM Sans', sans-serif", fontSize: el.fontSize ?? 12, color: "#2C2C2C", background: el.fill, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px", fontWeight: 600, overflow: "hidden" };
  if (el.type === "button") {
    const isGhost = el.fill === "transparent";
    return { ...base, fontFamily: "'DM Sans', sans-serif", fontSize: el.fontSize ?? 14, color: isGhost ? (el.stroke ?? "#2C2C2C") : "#E8E2D9", background: el.fill, border: el.stroke ? `2px solid ${el.stroke}` : "none", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", fontWeight: 600, overflow: "hidden" };
  }
  return base;
}

export function GamePage({ room, myPlayerId, amIHost, onAdd, onUpdate, onDelete, onSkip, remoteCursors, emitCursorMove }: Props) {
  const myPlayer = room.players.find((p) => p.id === myPlayerId);
  const isImposter = myPlayer?.isImposter ?? false;

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ elId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const lastCursorEmit = useRef(0);
  const undoStackRef = useRef<Array<{ type: "move"; id: string; oldX: number; oldY: number }>>([]);

  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SECTIONS.forEach((s) => { init[s.id] = !s.defaultOpen; });
    return init;
  });
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { setLocalPositions({}); setSelectedId(null); }, [room.round]);

  // Focus contenteditable when editing starts
  useEffect(() => {
    if (editingId && canvasRef.current) {
      const el = canvasRef.current.querySelector("[contenteditable='true']") as HTMLElement | null;
      if (el) {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [editingId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return; // Don't intercept when editing text
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        onDelete(selectedId);
        setSelectedId(null);
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setShowColorPicker(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        const action = undoStackRef.current.pop();
        if (action?.type === "move") {
          onUpdate(action.id, { x: action.oldX, y: action.oldY });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedId) {
        e.preventDefault();
        const el = room.canvas.find((c) => c.id === selectedId);
        if (el) {
          onAdd({ type: el.type, x: el.x + 10, y: el.y + 10, width: el.width, height: el.height, content: el.content, fill: el.fill, stroke: el.stroke, fontSize: el.fontSize });
        }
      }
      if (selectedId && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const el = room.canvas.find((c) => c.id === selectedId);
        if (el) {
          const nudge = e.shiftKey ? 10 : 1;
          const dx = e.key === "ArrowLeft" ? -nudge : e.key === "ArrowRight" ? nudge : 0;
          const dy = e.key === "ArrowUp" ? -nudge : e.key === "ArrowDown" ? nudge : 0;
          onUpdate(el.id, { x: Math.max(0, Math.min(CANVAS_W - el.width, el.x + dx)), y: Math.max(0, Math.min(CANVAS_H - el.height, el.y + dy)) });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, editingId, room.canvas, onDelete, onUpdate, onAdd]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    // Cursor tracking (30fps throttle)
    const now = Date.now();
    if (canvasRef.current && now - lastCursorEmit.current > 33) {
      lastCursorEmit.current = now;
      const rect = canvasRef.current.getBoundingClientRect();
      emitCursorMove((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    }

    if (!draggingRef.current || !canvasRef.current) return;
    const { elId, startX, startY, origX, origY } = draggingRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const el = room.canvas.find((c) => c.id === elId);
    if (!el) return;
    const newX = Math.max(0, Math.min(CANVAS_W - el.width, origX + dx));
    const newY = Math.max(0, Math.min(CANVAS_H - el.height, origY + dy));
    setLocalPositions((p) => ({ ...p, [elId]: { x: newX, y: newY } }));
  }, [room.canvas, emitCursorMove]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!draggingRef.current) return;
    const { elId, origX, origY } = draggingRef.current;
    const pos = localPositions[elId];
    if (pos && (Math.abs(pos.x - origX) > 2 || Math.abs(pos.y - origY) > 2)) {
      onUpdate(elId, { x: Math.round(pos.x), y: Math.round(pos.y) });
      // Push undo action
      if (undoStackRef.current.length >= 10) undoStackRef.current.shift();
      undoStackRef.current.push({ type: "move", id: elId, oldX: origX, oldY: origY });
    }
    draggingRef.current = null;
  }, [localPositions, onUpdate]);

  function handleElementMouseDown(e: React.MouseEvent, el: CanvasElement) {
    if (editingId) return;
    e.stopPropagation();
    setSelectedId(el.id);
    setShowColorPicker(false);
    draggingRef.current = { elId: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
  }

  function handleElementDoubleClick(e: React.MouseEvent, el: CanvasElement) {
    if (!TEXT_TYPES.includes(el.type)) return;
    e.stopPropagation();
    setEditingId(el.id);
    setSelectedId(el.id);
  }

  function commitEdit(el: CanvasElement, div: HTMLElement | null) {
    if (!div) return;
    const newText = div.innerText ?? div.textContent ?? "";
    onUpdate(el.id, { content: newText });
    setEditingId(null);
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas === "true") {
      setSelectedId(null);
      setShowColorPicker(false);
    }
  }

  function addChipAt(chip: ChipDef, x?: number, y?: number) {
    const w = chip.defaults.width ?? 200;
    const h = chip.defaults.height ?? 80;
    const px = x !== undefined ? Math.max(0, Math.min(CANVAS_W - w, x - w / 2)) : Math.floor(Math.random() * (CANVAS_W - w - 20)) + 10;
    const py = y !== undefined ? Math.max(0, Math.min(CANVAS_H - h, y - h / 2)) : Math.floor(Math.random() * (CANVAS_H - h - 20)) + 10;
    onAdd({ type: chip.type, x: Math.round(px), y: Math.round(py), width: w, height: h, content: chip.defaults.content, fill: chip.defaults.fill ?? "#2C2C2C", stroke: chip.defaults.stroke, fontSize: chip.defaults.fontSize });
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("chipDef");
    if (!raw || !canvasRef.current) return;
    const { type, defaults } = JSON.parse(raw) as { type: CanvasElement["type"]; defaults: ChipDef["defaults"] };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addChipAt({ label: "", type, defaults, preview: () => null }, x, y);
  }

  function toggleSection(id: string) {
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  }

  const lowerSearch = search.toLowerCase().trim();
  const filteredSections = SECTIONS.map((s) => ({
    ...s,
    chips: lowerSearch ? s.chips.filter((c) => c.label.toLowerCase().includes(lowerSearch)) : s.chips,
  })).filter((s) => s.chips.length > 0);

  // Selection toolbar data
  const selectedEl = selectedId ? (room.canvas.find((e) => e.id === selectedId) ?? null) : null;
  const selectedPos = selectedEl ? (localPositions[selectedId!] ?? { x: selectedEl.x, y: selectedEl.y }) : null;
  const isTextEl = selectedEl ? TEXT_TYPES.includes(selectedEl.type) : false;

  const TOOLBAR_H = isTextEl ? 82 : 42;
  const toolbarY = selectedEl && selectedPos
    ? (selectedPos.y < TOOLBAR_H + 16 ? selectedPos.y + selectedEl.height + 8 : selectedPos.y - TOOLBAR_H - 10)
    : 0;
  const toolbarX = selectedEl && selectedPos
    ? Math.max(4, Math.min(CANVAS_W - 300, selectedPos.x + selectedEl.width / 2 - 150))
    : 0;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#1a1a1a", overflow: "hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: "#1e1e1e", display: "flex", alignItems: "center", padding: "0 1.25rem", height: 56, flexShrink: 0, borderBottom: "1px solid #333", gap: "1.2rem" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height: 38, display: "block", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
        <div style={{ width: 1, height: 28, background: "#333", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: GRUNGE, fontSize: "0.8rem", color: "rgba(232,226,217,0.45)", letterSpacing: "0.08em", lineHeight: 1 }}>Round {room.round} / {room.maxRounds}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: "#E8E2D9", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{room.prompt}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexShrink: 0 }}>
          <div style={{ fontFamily: GRUNGE, fontSize: "0.72rem", letterSpacing: "0.1em", padding: "0.25rem 0.7rem", borderRadius: 20, background: isImposter ? "rgba(204,34,0,0.18)" : "rgba(62,207,207,0.12)", border: `1px solid ${isImposter ? "rgba(204,34,0,0.5)" : "rgba(62,207,207,0.35)"}`, color: isImposter ? "#CC2200" : "#3ECFCF" }}>
            {isImposter ? "IMPOSTER" : "CREWMATE"}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.58rem", color: "rgba(232,226,217,0.35)", letterSpacing: "0.12em", marginBottom: 1 }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
          {amIHost && (
            <button onClick={onSkip} style={{ fontFamily: GRUNGE, fontSize: "0.8rem", color: "#E8E2D9", background: "rgba(232,226,217,0.07)", border: "1px solid rgba(232,226,217,0.18)", padding: "0.3rem 0.8rem", cursor: "pointer", borderRadius: 4, letterSpacing: "0.05em" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,226,217,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(232,226,217,0.07)")}>
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: PANEL_W, background: "#252525", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "0.6rem 0.6rem 0.4rem" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#777", pointerEvents: "none" }}>🔍</span>
              <input type="text" placeholder="Search components…" value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: "#1a1a1a", border: "1.5px solid #444", color: "#eee", borderRadius: 6, padding: "0.35rem 0.5rem 0.35rem 1.8rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#666")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#444")} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 0.4rem" }}>
            {filteredSections.length === 0 ? (
              <div style={{ textAlign: "center", color: "#666", fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", marginTop: "2rem" }}>No components found</div>
            ) : filteredSections.map((section) => {
              const isOpen = lowerSearch ? true : !collapsed[section.id];
              return (
                <div key={section.id} style={{ marginBottom: "0.25rem" }}>
                  <button onClick={() => !lowerSearch && toggleSection(section.id)}
                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.3rem", color: "#aaa", fontFamily: GRUNGE, fontSize: "0.7rem", letterSpacing: "0.08em", textAlign: "left" }}>
                    <span style={{ fontSize: 10, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▸</span>
                    {section.label.toUpperCase()}
                  </button>
                  {isOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingBottom: 4 }}>
                      {section.chips.map((chip) => {
                        const chipKey = `${section.id}-${chip.label}`;
                        const hov = hoveredChip === chipKey;
                        return (
                          <div key={chip.label}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("chipDef", JSON.stringify({ type: chip.type, defaults: chip.defaults }))}
                            onClick={() => addChipAt(chip)}
                            onMouseEnter={() => setHoveredChip(chipKey)}
                            onMouseLeave={() => setHoveredChip(null)}
                            style={{ background: "#2a2a2a", border: `1.5px solid ${hov ? "#666" : "#444"}`, borderRadius: 8, padding: "7px 8px 5px", cursor: "grab", boxShadow: hov ? "0 6px 16px rgba(0,0,0,0.6)" : "0 4px 10px rgba(0,0,0,0.5)", transform: hov ? "translateY(-3px)" : "none", transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, userSelect: "none", position: "relative" }}>
                            <div style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", fontSize: "0.65rem", color: "#555", pointerEvents: "none" }}>⠿</div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 28, width: "100%" }}>{chip.preview()}</div>
                            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.65rem", color: "#888" }}>{chip.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ height: 8 }} />
          </div>

          {/* Player list pinned at bottom */}
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
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.6rem", color: "#555", marginTop: "0.5rem", lineHeight: 1.5 }}>
              Click to select · Drag to move<br />
              Dbl-click text to edit · Del to remove
            </div>
          </div>
        </div>

        {/* ── CANVAS AREA ── */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", padding: "3rem 5rem 2rem" }}>
          <div style={{ position: "relative" }}>

            {/* ROUND N text above */}
            <div style={{ position: "absolute", top: -52, left: "50%", transform: "translateX(-50%)", fontFamily: GRUNGE, fontSize: "1.8rem", color: "rgba(232,226,217,0.14)", letterSpacing: "0.3em", whiteSpace: "nowrap", pointerEvents: "none" }}>
              ROUND {room.round}
            </div>

            {/* Ornate frame border (visual only, slightly rotated) */}
            <div style={{ position: "absolute", inset: -12, border: "12px solid #111", transform: "rotate(-1deg)", pointerEvents: "none", boxShadow: "inset 0 0 0 4px #444, inset 0 0 0 8px #111, inset 0 0 0 12px #333, 10px 14px 48px rgba(0,0,0,0.85), 0 0 0 2px #222", zIndex: 0 }} />

            {/* Corner ornaments */}
            {[[-20, -20, 0], [-20, undefined, 90], [undefined, -20, 270], [undefined, undefined, 180]].map(([t, l, r], i) => (
              <div key={i} style={{ position: "absolute", top: t !== undefined ? t : undefined, left: l !== undefined ? l : undefined, bottom: t === undefined ? -20 : undefined, right: l === undefined ? -20 : undefined, pointerEvents: "none", zIndex: 2 }}>
                <CornerOrnament rotate={r as number} />
              </div>
            ))}

            {/* Sticky note — prompt */}
            <div style={{ position: "absolute", top: 20, right: -152, width: 132, background: "#F5EE7A", padding: "8px 10px 10px", transform: "rotate(3deg)", boxShadow: "2px 4px 10px rgba(0,0,0,0.4)", zIndex: 5, pointerEvents: "none" }}>
              <div style={{ fontFamily: GRUNGE, fontSize: "0.58rem", color: "#8a7700", letterSpacing: "0.08em", marginBottom: 4 }}>BRIEF</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.66rem", color: "#3a3000", lineHeight: 1.4, wordBreak: "break-word" }}>{room.prompt}</div>
            </div>

            {/* Sticky note — fonts */}
            <div style={{ position: "absolute", top: 164, right: -144, width: 124, background: "#f0f0f0", padding: "8px 10px 10px", transform: "rotate(-2deg)", boxShadow: "2px 4px 10px rgba(0,0,0,0.4)", zIndex: 5, pointerEvents: "none" }}>
              <div style={{ fontFamily: GRUNGE, fontSize: "0.58rem", color: "#888", letterSpacing: "0.08em", marginBottom: 4 }}>FONTS</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.63rem", color: "#333", lineHeight: 1.6 }}>🔒 DM Sans<br />🔒 Bebas Neue</div>
            </div>

            {/* Interactive canvas */}
            <div
              ref={canvasRef}
              data-canvas="true"
              style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, background: "#F8F4EE", flexShrink: 0, zIndex: 1, overflow: "hidden", outline: dragOver ? "3px dashed #3ECFCF" : "none" }}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onClick={handleCanvasClick}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleCanvasDrop}
            >
              {/* Canvas ghost text */}
              {room.canvas.length === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "1.6rem", color: "rgba(0,0,0,0.06)", textAlign: "center", padding: "0 3rem", lineHeight: 1.3 }}>{room.prompt}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "rgba(0,0,0,0.1)", marginTop: "0.75rem" }}>Drag elements from the panel or click to add</div>
                </div>
              )}

              {/* Canvas elements */}
              {room.canvas.map((el) => {
                const localPos = localPositions[el.id];
                const displayEl = localPos ? { ...el, x: localPos.x, y: localPos.y } : el;
                const style = getElementStyle(displayEl, selectedId === el.id);
                const isEditing = editingId === el.id;
                const isText = TEXT_TYPES.includes(el.type);

                if (isEditing) {
                  return (
                    <div key={el.id}
                      contentEditable suppressContentEditableWarning
                      style={{ ...style, border: "2px solid #3ECFCF", outline: "none", cursor: "text", userSelect: "text" }}
                      onBlur={(e) => commitEdit(el, e.currentTarget)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Escape") { e.preventDefault(); commitEdit(el, e.currentTarget); }
                      }}>
                      {el.content}
                    </div>
                  );
                }

                return (
                  <div key={el.id} style={style}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    onDoubleClick={(e) => handleElementDoubleClick(e, el)}>
                    {isText ? el.content : null}
                  </div>
                );
              })}

              {/* Selection overlay (border + handles + toolbar) */}
              {selectedEl && selectedPos && !editingId && (() => {
                const H = 8;
                const ex = selectedPos.x;
                const ey = selectedPos.y;
                const ew = selectedEl.width;
                const eh = selectedEl.height;
                return (
                  <>
                    {/* Selection border */}
                    <div style={{ position: "absolute", left: ex - 2, top: ey - 2, width: ew + 4, height: eh + 4, border: "2px solid #3ECFCF", pointerEvents: "none", zIndex: 900 }} />
                    {/* Corner handles */}
                    {[[ex - H / 2, ey - H / 2], [ex + ew - H / 2, ey - H / 2], [ex - H / 2, ey + eh - H / 2], [ex + ew - H / 2, ey + eh - H / 2]].map(([hx, hy], i) => (
                      <div key={i} style={{ position: "absolute", left: hx, top: hy, width: H, height: H, background: "#fff", border: "2px solid #3ECFCF", zIndex: 901, pointerEvents: "none" }} />
                    ))}

                    {/* Selection toolbar */}
                    <div style={{ position: "absolute", left: toolbarX, top: toolbarY, zIndex: 950, background: "#1a1a1a", border: "1px solid #444", borderRadius: 20, padding: "6px 10px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.6)", minWidth: 280, pointerEvents: "all" }}
                      onMouseDown={(e) => e.stopPropagation()}>
                      {/* Row 1: all elements */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {/* Delete */}
                        <ToolBtn title="Delete" onClick={() => { onDelete(selectedEl.id); setSelectedId(null); }}>🗑️</ToolBtn>
                        {/* Bring Forward */}
                        <ToolBtn title="Bring Forward" onClick={() => onUpdate(selectedEl.id, { zIndex: selectedEl.zIndex + 1 })}>⬆️</ToolBtn>
                        {/* Send Backward */}
                        <ToolBtn title="Send Backward" onClick={() => onUpdate(selectedEl.id, { zIndex: Math.max(0, selectedEl.zIndex - 1) })}>⬇️</ToolBtn>
                        {/* Color */}
                        <div style={{ position: "relative" }}>
                          <button title="Color" onClick={() => setShowColorPicker((v) => !v)}
                            style={{ width: 26, height: 26, borderRadius: "50%", background: selectedEl.fill === "transparent" ? "#fff" : selectedEl.fill, border: "2px solid #555", cursor: "pointer", flexShrink: 0 }} />
                          {showColorPicker && (
                            <div style={{ position: "absolute", bottom: 32, left: 0, background: "#111", border: "1px solid #444", borderRadius: 10, padding: 8, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, zIndex: 960, boxShadow: "0 8px 24px rgba(0,0,0,0.7)" }}>
                              {PALETTE.map((c) => (
                                <button key={c} onClick={() => { onUpdate(selectedEl.id, { fill: c }); setShowColorPicker(false); }}
                                  style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: selectedEl.fill === c ? "2px solid #3ECFCF" : "1.5px solid #555", cursor: "pointer", flexShrink: 0 }} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }} />
                        {/* Deselect */}
                        <ToolBtn title="Deselect" onClick={() => { setSelectedId(null); setShowColorPicker(false); }}>✕</ToolBtn>
                      </div>

                      {/* Row 2: text-only controls */}
                      {isTextEl && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, borderTop: "1px solid #333", paddingTop: 6 }}>
                          <select value={selectedEl.fontSize ?? 14} onChange={(e) => onUpdate(selectedEl.id, { fontSize: Number(e.target.value) })}
                            style={{ background: "#222", border: "1px solid #555", color: "#eee", borderRadius: 6, padding: "2px 4px", fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", cursor: "pointer" }}>
                            {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
                          </select>
                          <div style={{ display: "flex", gap: 2 }}>
                            {(["left", "center", "right"] as const).map((a, i) => (
                              <ToolBtn key={a} title={`Align ${a}`} onClick={() => onUpdate(selectedEl.id, { textAlign: a } as any)}>
                                {["≡", "☰", "≣"][i]}
                              </ToolBtn>
                            ))}
                          </div>
                          <ToolBtn title="Bold" onClick={() => onUpdate(selectedEl.id, { fontWeight: selectedEl.fontWeight === 800 ? 400 : 800 } as any)}>
                            <b>B</b>
                          </ToolBtn>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Remote cursors overlay */}
              {Object.values(remoteCursors).map((cursor) => {
                const player = room.players.find((p) => p.id === cursor.playerId);
                if (!player) return null;
                const isVisible = Date.now() - cursor.lastSeen < 3000;
                return (
                  <div key={cursor.playerId} style={{ position: "absolute", left: cursor.x * CANVAS_W, top: cursor.y * CANVAS_H, pointerEvents: "none", zIndex: 999, opacity: isVisible ? 1 : 0, transition: "left 0.05s linear, top 0.05s linear, opacity 0.5s" }}>
                    <svg width="16" height="20" viewBox="0 0 16 20">
                      <path d="M0 0 L0 14 L4 11 L6 18 L8 17 L6 10 L11 10 Z" fill={player.color} stroke="rgba(0,0,0,0.6)" strokeWidth="1" />
                    </svg>
                    <div style={{ position: "absolute", top: 18, left: 10, background: player.color, color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 10, whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                      {player.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button title={title} onClick={onClick}
      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid #444", color: "#eee", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}>
      {children}
    </button>
  );
}
