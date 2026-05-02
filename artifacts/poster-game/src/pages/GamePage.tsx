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
const PANEL_W = 224;
const GRUNGE = "'Bebas Neue', sans-serif";
const DM = "'DM Sans', sans-serif";
const PALETTE = [
  "#ffffff", "#F8F4EE", "#e0e0e0", "#aaaaaa", "#555555", "#1a1a1a",
  "#CC2200", "#FF6B6B", "#F5A623", "#F1C40F", "#3ECFCF", "#9B59B6",
];
const TEXT_TYPES: CanvasElement["type"][] = ["text", "heading", "label", "button", "badge", "tag", "alert", "toast"];
const FONT_SIZES = [10, 12, 14, 16, 18, 24, 32, 48, 64];

type ChipDef = {
  label: string;
  type: CanvasElement["type"];
  defaults: Partial<Omit<CanvasElement, "id" | "zIndex" | "ownerId">>;
  preview: () => React.ReactNode;
};
type SectionDef = { id: string; label: string; defaultOpen: boolean; chips: ChipDef[] };

// ─── Component tray sections ────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    id: "frames", label: "Frames", defaultOpen: true,
    chips: [
      {
        label: "Web Frame", type: "frameweb",
        defaults: { width: 560, height: 360, fill: "#ffffff" },
        preview: () => (
          <div style={{ width: "100%", border: "1.5px solid #555", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ height: 10, background: "#2a2a2a", display: "flex", alignItems: "center", gap: 3, padding: "0 4px" }}>
              {["#f56","#fa0","#2c2"].map(c => <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ height: 18, background: "#1a1a1a", padding: "2px 4px" }}>
              {[60,40,30].map((w,i) => <div key={i} style={{ height: 2, background: "#444", borderRadius: 1, width: `${w}%`, marginBottom: 2 }} />)}
            </div>
          </div>
        ),
      },
      {
        label: "Mobile Frame", type: "framemobile",
        defaults: { width: 200, height: 380, fill: "#ffffff" },
        preview: () => (
          <div style={{ width: 40, height: 64, border: "3px solid #555", borderRadius: 10, background: "#1a1a1a", position: "relative", overflow: "hidden", margin: "0 auto" }}>
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "40%", height: 6, background: "#333", borderRadius: "0 0 4px 4px" }} />
            <div style={{ position: "absolute", inset: "8px 2px 6px", background: "#F8F4EE", borderRadius: 4 }} />
            <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: "30%", height: 2, background: "#444", borderRadius: 2 }} />
          </div>
        ),
      },
    ],
  },
  {
    id: "shape", label: "Shapes & Text", defaultOpen: true,
    chips: [
      { label: "Heading", type: "heading", defaults: { width: 300, height: 56, content: "Heading", fill: "#1a1a1a", fontSize: 36 }, preview: () => <span style={{ fontFamily: DM, fontWeight: 800, fontSize: 18, color: "#eee" }}>Heading</span> },
      { label: "Body Text", type: "text", defaults: { width: 240, height: 72, content: "Body text content here.", fill: "#555", fontSize: 14 }, preview: () => <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", padding: "0 4px" }}>{[100,82,65].map((w,i) => <div key={i} style={{ height: 2.5, background: "#666", borderRadius: 2, width: `${w}%` }} />)}</div> },
      { label: "Caption", type: "text", defaults: { width: 180, height: 24, content: "Small caption text", fill: "#888", fontSize: 11 }, preview: () => <div style={{ height: 2, background: "#666", borderRadius: 1, width: "55%", margin: "0 auto" }} /> },
      { label: "Rectangle", type: "rect", defaults: { width: 200, height: 100, fill: "#e8e8e8", stroke: "#ccc" }, preview: () => <div style={{ width: "70%", height: 24, background: "#3a3a3a", border: "1.5px solid #555", borderRadius: 3 }} /> },
      { label: "Oval", type: "circle", defaults: { width: 80, height: 80, fill: "#e0e0e0" }, preview: () => <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#3a3a3a", border: "1.5px solid #555" }} /> },
      { label: "Divider", type: "divider", defaults: { width: 400, height: 2, fill: "#ddd" }, preview: () => <div style={{ width: "100%", height: 2, background: "#666", borderRadius: 1 }} /> },
    ],
  },
  {
    id: "inputs", label: "Inputs & Controls", defaultOpen: false,
    chips: [
      { label: "Primary Button", type: "button", defaults: { width: 140, height: 42, content: "Continue", fill: "#1a1a1a", fontSize: 14, cornerRadius: 8 }, preview: () => <div style={{ border: "none", background: "#333", color: "#eee", fontFamily: DM, fontWeight: 600, fontSize: 11, padding: "4px 14px", borderRadius: 6 }}>Continue</div> },
      { label: "Ghost Button", type: "button", defaults: { width: 140, height: 42, content: "Cancel", fill: "transparent", stroke: "#888", fontSize: 14, cornerRadius: 8 }, preview: () => <div style={{ border: "1.5px solid #777", color: "#ccc", fontFamily: DM, fontWeight: 600, fontSize: 11, padding: "3px 12px", borderRadius: 6 }}>Cancel</div> },
      { label: "Text Input", type: "input", defaults: { width: 220, height: 44, fill: "#ffffff", cornerRadius: 8 }, preview: () => <div style={{ width: "100%", height: 22, border: "1.5px solid #555", borderRadius: 5, display: "flex", alignItems: "center", padding: "0 6px", gap: 3 }}><span style={{ fontFamily: DM, fontSize: 9, color: "#666" }}>Enter text...</span><span style={{ width: 1, height: 11, background: "#777" }} /></div> },
      { label: "Search Bar", type: "searchbar", defaults: { width: 240, height: 44, fill: "#f0f0f0", cornerRadius: 100 }, preview: () => <div style={{ width: "100%", height: 22, background: "#2a2a2a", borderRadius: 100, display: "flex", alignItems: "center", padding: "0 8px", gap: 4 }}><span style={{ fontSize: 9 }}>🔍</span><span style={{ fontFamily: DM, fontSize: 9, color: "#666" }}>Search...</span></div> },
      { label: "Dropdown", type: "dropdown", defaults: { width: 200, height: 44, content: "Select option", fill: "#ffffff", cornerRadius: 8 }, preview: () => <div style={{ width: "100%", height: 22, border: "1.5px solid #555", borderRadius: 5, display: "flex", alignItems: "center", padding: "0 6px", justifyContent: "space-between" }}><span style={{ fontFamily: DM, fontSize: 9, color: "#888" }}>Select...</span><span style={{ fontSize: 8, color: "#777" }}>⌄</span></div> },
      { label: "Checkbox", type: "checkbox", defaults: { width: 140, height: 28, content: "Option", fill: "#ffffff" }, preview: () => <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 12, height: 12, border: "1.5px solid #666", borderRadius: 2, background: "#1a1a1a" }} /><div style={{ height: 2.5, background: "#666", width: 36, borderRadius: 2 }} /></div> },
      { label: "Radio", type: "radio", defaults: { width: 140, height: 28, content: "Option", fill: "#ffffff" }, preview: () => <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 12, height: 12, border: "1.5px solid #666", borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3ECFCF" }} /></div><div style={{ height: 2.5, background: "#666", width: 36, borderRadius: 2 }} /></div> },
      { label: "Toggle", type: "toggle", defaults: { width: 80, height: 32, fill: "#3ECFCF" }, preview: () => <div style={{ width: 38, height: 20, background: "#3ECFCF", borderRadius: 100, position: "relative" }}><div style={{ position: "absolute", top: 3, right: 3, width: 14, height: 14, background: "#fff", borderRadius: "50%" }} /></div> },
    ],
  },
  {
    id: "nav", label: "Navigation", defaultOpen: false,
    chips: [
      { label: "Nav Bar", type: "navbar", defaults: { width: 600, height: 60, fill: "#ffffff" }, preview: () => <div style={{ width: "100%", height: 20, background: "#1e1e1e", borderRadius: 3, display: "flex", alignItems: "center", padding: "0 6px", gap: 8 }}><div style={{ width: 24, height: 6, background: "#555", borderRadius: 2 }} /><div style={{ flex: 1 }} />{[16,16,16].map((_,i) => <div key={i} style={{ width: _, height: 4, background: "#444", borderRadius: 2 }} />)}<div style={{ width: 12, height: 12, borderRadius: "50%", background: "#555" }} /></div> },
      { label: "Tab Bar", type: "tabbar", defaults: { width: 375, height: 64, fill: "#ffffff" }, preview: () => <div style={{ width: "100%", height: 20, background: "#1e1e1e", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "space-around" }}>{["🏠","🔍","➕","❤️","👤"].map((ic,i) => <span key={i} style={{ fontSize: i === 0 ? 11 : 9, opacity: i === 0 ? 1 : 0.4 }}>{ic}</span>)}</div> },
      { label: "Sidebar", type: "sidebar", defaults: { width: 200, height: 320, fill: "#f7f7f7" }, preview: () => <div style={{ width: "100%", height: 32, border: "1.5px solid #444", borderRadius: 3, overflow: "hidden", display: "flex" }}><div style={{ width: "40%", background: "#222", display: "flex", flexDirection: "column", gap: 3, padding: 3 }}>{[1,1,1].map((_,i) => <div key={i} style={{ height: 3, background: "#444", borderRadius: 2, width: "80%" }} />)}</div><div style={{ flex: 1, background: "#2a2a2a" }} /></div> },
      { label: "Breadcrumb", type: "breadcrumb", defaults: { width: 260, height: 28, content: "Home / Page / Current", fill: "#555" }, preview: () => <div style={{ display: "flex", gap: 3, alignItems: "center" }}>{["Home","›","Page","›","Here"].map((t,i) => <span key={i} style={{ fontSize: 8, color: i === 4 ? "#eee" : i % 2 === 0 ? "#3ECFCF" : "#555", fontFamily: DM }}>{t}</span>)}</div> },
    ],
  },
  {
    id: "content", label: "Content", defaultOpen: false,
    chips: [
      { label: "Card", type: "card", defaults: { width: 240, height: 210, fill: "#ffffff", cornerRadius: 12 }, preview: () => <div style={{ width: "100%", border: "1.5px solid #444", borderRadius: 6, overflow: "hidden" }}><div style={{ height: 18, background: "#3a3a3a", width: "100%" }} /><div style={{ padding: "4px 6px", display: "flex", flexDirection: "column", gap: 2 }}>{[80,60].map((w,i) => <div key={i} style={{ height: 2.5, background: i === 0 ? "#777" : "#4a4a4a", borderRadius: 2, width: `${w}%` }} />)}</div></div> },
      { label: "List Item", type: "listitem", defaults: { width: 340, height: 64, content: "List Item", fill: "#ffffff" }, preview: () => <div style={{ width: "100%", height: 22, border: "1px solid #444", borderRadius: 3, display: "flex", alignItems: "center", gap: 5, padding: "0 5px" }}><div style={{ width: 14, height: 14, borderRadius: "50%", background: "#3a3a3a", flexShrink: 0 }} /><div style={{ flex: 1, height: 2.5, background: "#555", borderRadius: 2 }} /><span style={{ fontSize: 8, color: "#555" }}>›</span></div> },
      { label: "Avatar", type: "circle", defaults: { width: 52, height: 52, fill: "#9B59B6" }, preview: () => <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #9B59B6 0%, #E87DBB 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, color: "#fff", fontFamily: DM, fontWeight: 700 }}>JD</span></div> },
      { label: "Image Block", type: "rect", defaults: { width: 240, height: 160, fill: "#e0e0e0", cornerRadius: 6 }, preview: () => <div style={{ width: "100%", height: 28, background: "#2a2a2a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, color: "#666" }}>🖼</span></div> },
      { label: "Badge", type: "badge", defaults: { width: 64, height: 26, content: "New", fill: "#CC2200", cornerRadius: 100 }, preview: () => <div style={{ background: "#CC2200", borderRadius: 100, padding: "2px 8px" }}><span style={{ fontFamily: DM, fontSize: 9, fontWeight: 700, color: "#fff" }}>New</span></div> },
      { label: "Chip / Tag", type: "tag", defaults: { width: 80, height: 28, content: "Design", fill: "#f0f0f0", cornerRadius: 100 }, preview: () => <div style={{ background: "#2a2a2a", border: "1px solid #555", borderRadius: 100, padding: "2px 8px" }}><span style={{ fontFamily: DM, fontSize: 9, color: "#aaa" }}>Design</span></div> },
    ],
  },
  {
    id: "feedback", label: "Feedback & Overlays", defaultOpen: false,
    chips: [
      { label: "Progress Bar", type: "progress", defaults: { width: 260, height: 14, fill: "#3ECFCF", cornerRadius: 100 }, preview: () => <div style={{ width: "100%", height: 8, background: "#2a2a2a", borderRadius: 100, overflow: "hidden" }}><div style={{ width: "65%", height: "100%", background: "#3ECFCF", borderRadius: 100 }} /></div> },
      { label: "Alert Banner", type: "alert", defaults: { width: 320, height: 52, content: "Something needs attention", fill: "#fffbe6", cornerRadius: 6 }, preview: () => <div style={{ width: "100%", height: 20, background: "#3a3000", border: "1px solid #665500", borderRadius: 4, display: "flex", alignItems: "center", gap: 4, padding: "0 5px" }}><span style={{ fontSize: 9 }}>⚠️</span><div style={{ height: 2.5, background: "#665500", borderRadius: 2, flex: 1 }} /></div> },
      { label: "Toast", type: "toast", defaults: { width: 240, height: 48, content: "Saved successfully", fill: "#1a1a1a", cornerRadius: 100 }, preview: () => <div style={{ width: "100%", height: 20, background: "#1a1a1a", borderRadius: 100, display: "flex", alignItems: "center", gap: 4, padding: "0 8px" }}><span style={{ fontSize: 8 }}>✅</span><div style={{ height: 2.5, background: "#444", borderRadius: 2, flex: 1 }} /></div> },
      { label: "Modal", type: "modal", defaults: { width: 340, height: 240, fill: "#ffffff", cornerRadius: 12 }, preview: () => <div style={{ width: "100%", position: "relative" }}><div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", borderRadius: 4 }} /><div style={{ border: "1.5px solid #444", borderRadius: 5, padding: "4px 6px", background: "#1e1e1e", position: "relative" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><div style={{ height: 3, background: "#888", width: "40%", borderRadius: 2 }} /><span style={{ fontSize: 7, color: "#666" }}>✕</span></div>{[100,70].map((w,i) => <div key={i} style={{ height: 2, background: "#444", width: `${w}%`, borderRadius: 2, marginBottom: 2 }} />)}</div></div> },
      { label: "FAB", type: "fab", defaults: { width: 56, height: 56, fill: "#1a1a1a", cornerRadius: 100 }, preview: () => <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a2a", border: "1.5px solid #555", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, color: "#eee" }}>+</span></div> },
    ],
  },
];

// ─── Canvas element renderers ────────────────────────────────────────────────

function renderCanvasContent(el: CanvasElement): React.ReactNode {
  const r = el.cornerRadius ?? 0;
  const c = el.fill;

  switch (el.type) {
    case "input":
      return (
        <div style={{ width: "100%", height: "100%", background: "#fff", border: "1.5px solid #ccc", borderRadius: r || 8, display: "flex", alignItems: "center", padding: "0 12px", gap: 4, boxSizing: "border-box" }}>
          <span style={{ fontFamily: DM, fontSize: 13, color: "#bbb", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{el.content || "Enter text here..."}</span>
          <span style={{ width: 1, height: "55%", background: "#ccc", display: "inline-block", flexShrink: 0 }} />
        </div>
      );

    case "searchbar":
      return (
        <div style={{ width: "100%", height: "100%", background: "#f2f2f2", borderRadius: r || 100, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, boxSizing: "border-box" }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>🔍</span>
          <span style={{ fontFamily: DM, fontSize: 13, color: "#aaa" }}>{el.content || "Search..."}</span>
        </div>
      );

    case "dropdown":
      return (
        <div style={{ width: "100%", height: "100%", background: "#fff", border: "1.5px solid #ccc", borderRadius: r || 8, display: "flex", alignItems: "center", padding: "0 12px", justifyContent: "space-between", boxSizing: "border-box" }}>
          <span style={{ fontFamily: DM, fontSize: 13, color: "#aaa" }}>{el.content || "Select option..."}</span>
          <span style={{ fontFamily: DM, fontSize: 14, color: "#aaa", lineHeight: 1 }}>⌄</span>
        </div>
      );

    case "checkbox":
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 18, height: 18, border: "2px solid #bbb", borderRadius: 4, background: "#fff", flexShrink: 0 }} />
          <span style={{ fontFamily: DM, fontSize: 13, color: "#333" }}>{el.content || "Option"}</span>
        </div>
      );

    case "radio":
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 18, height: 18, border: "2px solid #bbb", borderRadius: "50%", background: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c !== "#ffffff" ? c : "#ccc" }} />
          </div>
          <span style={{ fontFamily: DM, fontSize: 13, color: "#333" }}>{el.content || "Option"}</span>
        </div>
      );

    case "toggle":
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 50, height: 28, background: c, borderRadius: 100, position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
          <span style={{ fontFamily: DM, fontSize: 12, color: "#333" }}>{el.content || ""}</span>
        </div>
      );

    case "navbar":
      return (
        <div style={{ width: "100%", height: "100%", background: c, borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", padding: "0 20px", gap: 28, boxSizing: "border-box" }}>
          <div style={{ width: 80, height: 22, background: "#1a1a1a", borderRadius: 4, flexShrink: 0 }} />
          <div style={{ flex: 1 }} />
          {["Home", "About", "Work"].map(t => (
            <span key={t} style={{ fontFamily: DM, fontSize: 13, color: "#555", flexShrink: 0 }}>{t}</span>
          ))}
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ddd", flexShrink: 0 }} />
        </div>
      );

    case "tabbar":
      return (
        <div style={{ width: "100%", height: "100%", background: c, borderTop: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 8px", boxSizing: "border-box" }}>
          {[["🏠","Home",true],["🔍","Search",false],["➕","",false],["❤️","Saved",false],["👤","Profile",false]].map(([icon, label, active]) => (
            <div key={label as string} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: active ? 1 : 0.4, flex: 1 }}>
              <span style={{ fontSize: label === "" ? 24 : 18 }}>{icon}</span>
              {label && <span style={{ fontFamily: DM, fontSize: 10, color: "#333" }}>{label}</span>}
            </div>
          ))}
        </div>
      );

    case "sidebar":
      return (
        <div style={{ width: "100%", height: "100%", background: c, borderRight: "1px solid #e8e8e8", padding: "16px 0", display: "flex", flexDirection: "column", gap: 2, boxSizing: "border-box" }}>
          {[["🏠","Home",true],["📁","Projects",false],["⭐","Favorites",false],["⚙️","Settings",false],["👤","Profile",false]].map(([icon,label,active]) => (
            <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: active ? "rgba(0,0,0,0.06)" : "transparent", borderRadius: "0 8px 8px 0", marginRight: 8 }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span style={{ fontFamily: DM, fontSize: 13, color: active ? "#222" : "#888", fontWeight: active ? 600 : 400 }}>{label}</span>
            </div>
          ))}
        </div>
      );

    case "breadcrumb":
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 6 }}>
          {(el.content || "Home / Page / Current").split("/").map((seg, i, arr) => (
            <span key={i} style={{ fontFamily: DM, fontSize: 13, color: i === arr.length - 1 ? "#222" : "#999", display: "flex", alignItems: "center", gap: 6 }}>
              {seg.trim()}
              {i < arr.length - 1 && <span style={{ color: "#ddd" }}>›</span>}
            </span>
          ))}
        </div>
      );

    case "listitem":
      return (
        <div style={{ width: "100%", height: "100%", background: c, borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", padding: "0 14px", gap: 12, boxSizing: "border-box" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e0e0e0", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DM, fontWeight: 600, fontSize: 14, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.content || "List Item Title"}</div>
            <div style={{ fontFamily: DM, fontSize: 12, color: "#aaa", marginTop: 2 }}>Subtitle text here</div>
          </div>
          <span style={{ color: "#ccc", fontSize: 18, flexShrink: 0 }}>›</span>
        </div>
      );

    case "card":
      return (
        <div style={{ width: "100%", height: "100%", background: c, border: "1px solid #eee", borderRadius: r || 12, overflow: "hidden", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          <div style={{ height: "42%", background: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 28, color: "#ccc" }}>🖼</span>
          </div>
          <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: DM, fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{el.content || "Card Title"}</div>
            <div style={{ fontFamily: DM, fontSize: 12, color: "#aaa", lineHeight: 1.4 }}>Short description text goes here.</div>
            <div style={{ marginTop: "auto", height: 32, background: "#1a1a1a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: DM, fontSize: 13, color: "#fff", fontWeight: 600 }}>Get Started</span>
            </div>
          </div>
        </div>
      );

    case "badge":
      return (
        <div style={{ width: "100%", height: "100%", background: c, borderRadius: r || 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: DM, fontSize: el.fontSize ?? 12, fontWeight: 700, color: "#fff" }}>{el.content || "New"}</span>
        </div>
      );

    case "tag":
      return (
        <div style={{ width: "100%", height: "100%", background: c, border: "1px solid #e0e0e0", borderRadius: r || 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: DM, fontSize: el.fontSize ?? 12, color: "#555" }}>{el.content || "Tag"}</span>
        </div>
      );

    case "progress":
      return (
        <div style={{ width: "100%", height: "100%", background: "#e0e0e0", borderRadius: r || 100, overflow: "hidden" }}>
          <div style={{ width: "65%", height: "100%", background: c, borderRadius: r || 100 }} />
        </div>
      );

    case "alert":
      return (
        <div style={{ width: "100%", height: "100%", background: c || "#fffbe6", border: `1px solid ${c === "#fffbe6" || !c ? "#ffe58f" : "#ccc"}`, borderRadius: r || 6, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", boxSizing: "border-box" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <span style={{ fontFamily: DM, fontSize: 13, color: "#856404", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.content || "Something needs attention"}</span>
        </div>
      );

    case "toast":
      return (
        <div style={{ width: "100%", height: "100%", background: c || "#1a1a1a", borderRadius: r || 100, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", boxSizing: "border-box" }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>✅</span>
          <span style={{ fontFamily: DM, fontSize: 13, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.content || "Saved successfully"}</span>
        </div>
      );

    case "modal":
      return (
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: r || 12, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
          <div style={{ position: "absolute", left: "8%", right: "8%", top: "8%", bottom: "8%", background: c || "#fff", borderRadius: Math.max(0, (r || 12) - 4), display: "flex", flexDirection: "column", padding: "18px 20px", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: DM, fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{el.content || "Modal Title"}</span>
              <span style={{ fontSize: 14, color: "#aaa", cursor: "pointer" }}>✕</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              {[100,80,60].map((w,i) => <div key={i} style={{ height: 8, background: "#e8e8e8", borderRadius: 4, width: `${w}%` }} />)}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <div style={{ height: 32, background: "#f0f0f0", borderRadius: 6, display: "flex", alignItems: "center", padding: "0 16px" }}>
                <span style={{ fontFamily: DM, fontSize: 13, color: "#666" }}>Cancel</span>
              </div>
              <div style={{ height: 32, background: "#1a1a1a", borderRadius: 6, display: "flex", alignItems: "center", padding: "0 16px" }}>
                <span style={{ fontFamily: DM, fontSize: 13, color: "#fff" }}>Confirm</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "fab":
      return (
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: c, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: Math.round(Math.min(el.width, el.height) * 0.4), color: "#fff", lineHeight: 1 }}>+</span>
        </div>
      );

    case "framemobile":
      return (
        <div style={{ width: "100%", height: "100%", border: "6px solid #2a2a2a", borderRadius: 32, background: "#1a1a1a", position: "relative", boxSizing: "border-box", boxShadow: "inset 0 0 0 2px #3a3a3a" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "38%", height: 22, background: "#1a1a1a", borderRadius: "0 0 12px 12px", zIndex: 2 }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: c || "#F8F4EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: DM, fontSize: 11, color: "#ccc" }}>Screen</span>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: "32%", height: 4, background: "#3a3a3a", borderRadius: 4 }} />
        </div>
      );

    case "frameweb":
      return (
        <div style={{ width: "100%", height: "100%", border: "1.5px solid #ccc", borderRadius: r || 8, overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          <div style={{ height: 32, background: "#f0f0f0", borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: 8, padding: "0 10px", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {["#f56","#fa3","#2c2"].map(cc => <div key={cc} style={{ width: 9, height: 9, borderRadius: "50%", background: cc }} />)}
            </div>
            <div style={{ flex: 1, height: 18, background: "#fff", borderRadius: 100, border: "1px solid #ddd", display: "flex", alignItems: "center", padding: "0 8px" }}>
              <span style={{ fontFamily: DM, fontSize: 10, color: "#bbb" }}>https://yourapp.com</span>
            </div>
          </div>
          <div style={{ flex: 1, background: c || "#F8F4EE", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[70,50,35].map((w,i) => <div key={i} style={{ height: i === 0 ? 20 : 8, background: "rgba(0,0,0,0.08)", borderRadius: 4, width: `${w}%` }} />)}
          </div>
        </div>
      );

    // Simple types — rendered entirely via outer style
    case "rect":
    case "circle":
    case "divider":
      return null;

    // Text types — content rendered as span
    case "heading":
      return <span style={{ fontFamily: DM, fontWeight: el.fontWeight ?? 800, fontSize: el.fontSize ?? 36, color: el.fill, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{el.content}</span>;
    case "text":
      return <span style={{ fontFamily: DM, fontSize: el.fontSize ?? 14, color: el.fill, lineHeight: 1.55, fontWeight: el.fontWeight ?? 400 }}>{el.content}</span>;
    case "label":
      return <span style={{ fontFamily: DM, fontSize: el.fontSize ?? 12, color: "#2C2C2C", fontWeight: el.fontWeight ?? 600 }}>{el.content}</span>;
    case "button":
      return <span style={{ fontFamily: DM, fontSize: el.fontSize ?? 14, fontWeight: el.fontWeight ?? 600 }}>{el.content}</span>;

    default:
      return null;
  }
}

function getOuterStyle(el: CanvasElement): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    zIndex: el.zIndex,
    cursor: "grab",
    userSelect: "none",
    boxSizing: "border-box",
    opacity: el.opacity ?? 1,
    overflow: "hidden",
  };
  switch (el.type) {
    case "rect":   return { ...base, background: el.fill, border: el.stroke ? `2px solid ${el.stroke}` : "none", borderRadius: el.cornerRadius ?? 0 };
    case "circle": return { ...base, background: el.fill, borderRadius: "50%", border: el.stroke ? `2px solid ${el.stroke}` : "none" };
    case "divider": return { ...base, height: Math.max(el.height, 2), background: el.fill, borderRadius: el.cornerRadius ?? 100 };
    case "heading": return { ...base, display: "flex", alignItems: "center", overflow: "hidden" };
    case "text":   return { ...base, display: "flex", alignItems: "flex-start", overflow: "hidden" };
    case "label":  return { ...base, background: el.fill, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: el.cornerRadius ?? 2 };
    case "button": {
      const ghost = el.fill === "transparent";
      return { ...base, background: el.fill, border: el.stroke ? `2px solid ${el.stroke}` : "none", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: el.cornerRadius ?? 6, color: ghost ? (el.stroke ?? "#222") : "#fff" };
    }
    default: return base;
  }
}

// ─── Corner ornament ─────────────────────────────────────────────────────────

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

// ─── Main component ──────────────────────────────────────────────────────────

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        onDelete(selectedId);
        setSelectedId(null);
      }
      if (e.key === "Escape") { setSelectedId(null); setShowColorPicker(false); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        const action = undoStackRef.current.pop();
        if (action?.type === "move") onUpdate(action.id, { x: action.oldX, y: action.oldY });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedId) {
        e.preventDefault();
        const el = room.canvas.find((c) => c.id === selectedId);
        if (el) onAdd({ type: el.type, x: el.x + 16, y: el.y + 16, width: el.width, height: el.height, content: el.content, fill: el.fill, stroke: el.stroke, fontSize: el.fontSize, cornerRadius: el.cornerRadius, opacity: el.opacity });
      }
      if (selectedId && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
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
    setLocalPositions((p) => ({
      ...p,
      [elId]: { x: Math.max(0, Math.min(CANVAS_W - el.width, origX + dx)), y: Math.max(0, Math.min(CANVAS_H - el.height, origY + dy)) },
    }));
  }, [room.canvas, emitCursorMove]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!draggingRef.current) return;
    const { elId, origX, origY } = draggingRef.current;
    const pos = localPositions[elId];
    if (pos && (Math.abs(pos.x - origX) > 2 || Math.abs(pos.y - origY) > 2)) {
      onUpdate(elId, { x: Math.round(pos.x), y: Math.round(pos.y) });
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
    onUpdate(el.id, { content: div.innerText ?? div.textContent ?? "" });
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
    onAdd({ type: chip.type, x: Math.round(px), y: Math.round(py), width: w, height: h, content: chip.defaults.content, fill: chip.defaults.fill ?? "#ffffff", stroke: chip.defaults.stroke, fontSize: chip.defaults.fontSize, cornerRadius: chip.defaults.cornerRadius, opacity: chip.defaults.opacity });
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("chipDef");
    if (!raw || !canvasRef.current) return;
    const { type, defaults } = JSON.parse(raw) as { type: CanvasElement["type"]; defaults: ChipDef["defaults"] };
    const rect = canvasRef.current.getBoundingClientRect();
    addChipAt({ label: "", type, defaults, preview: () => null }, e.clientX - rect.left, e.clientY - rect.top);
  }

  const lowerSearch = search.toLowerCase().trim();
  const filteredSections = SECTIONS.map((s) => ({
    ...s,
    chips: lowerSearch ? s.chips.filter((c) => c.label.toLowerCase().includes(lowerSearch)) : s.chips,
  })).filter((s) => s.chips.length > 0);

  const selectedEl = selectedId ? (room.canvas.find((e) => e.id === selectedId) ?? null) : null;
  const selectedPos = selectedEl ? (localPositions[selectedId!] ?? { x: selectedEl.x, y: selectedEl.y }) : null;
  const isTextEl = selectedEl ? TEXT_TYPES.includes(selectedEl.type) : false;

  const TOOLBAR_H = isTextEl ? 86 : 44;
  const toolbarY = selectedEl && selectedPos
    ? (selectedPos.y < TOOLBAR_H + 16 ? selectedPos.y + selectedEl.height + 8 : selectedPos.y - TOOLBAR_H - 10)
    : 0;
  const toolbarX = selectedEl && selectedPos
    ? Math.max(4, Math.min(CANVAS_W - 310, selectedPos.x + selectedEl.width / 2 - 155))
    : 0;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#1a1a1a", overflow: "hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: "#1e1e1e", display: "flex", alignItems: "center", padding: "0 1.25rem", height: 52, flexShrink: 0, borderBottom: "1px solid #2a2a2a", gap: "1.2rem" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height: 36, display: "block", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
        <div style={{ width: 1, height: 26, background: "#2a2a2a", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: GRUNGE, fontSize: "0.72rem", color: "rgba(232,226,217,0.4)", letterSpacing: "0.1em", lineHeight: 1 }}>ROUND {room.round} / {room.maxRounds}</div>
          <div style={{ fontFamily: DM, fontSize: "0.88rem", color: "#E8E2D9", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{room.prompt}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexShrink: 0 }}>
          <div style={{ fontFamily: GRUNGE, fontSize: "0.68rem", letterSpacing: "0.12em", padding: "0.22rem 0.65rem", borderRadius: 20, background: isImposter ? "rgba(204,34,0,0.18)" : "rgba(62,207,207,0.12)", border: `1px solid ${isImposter ? "rgba(204,34,0,0.5)" : "rgba(62,207,207,0.35)"}`, color: isImposter ? "#CC2200" : "#3ECFCF" }}>
            {isImposter ? "IMPOSTER" : "CREWMATE"}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: DM, fontSize: "0.55rem", color: "rgba(232,226,217,0.3)", letterSpacing: "0.14em", marginBottom: 1 }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
          {amIHost && (
            <button onClick={onSkip}
              style={{ fontFamily: GRUNGE, fontSize: "0.78rem", color: "#E8E2D9", background: "rgba(232,226,217,0.06)", border: "1px solid rgba(232,226,217,0.15)", padding: "0.28rem 0.75rem", cursor: "pointer", borderRadius: 4, letterSpacing: "0.05em" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,226,217,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(232,226,217,0.06)")}>
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: PANEL_W, background: "#212121", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Search */}
          <div style={{ padding: "0.6rem 0.6rem 0.35rem" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#666", pointerEvents: "none" }}>🔍</span>
              <input type="text" placeholder="Search components…" value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: "#181818", border: "1.5px solid #333", color: "#eee", borderRadius: 7, padding: "0.32rem 0.5rem 0.32rem 1.8rem", fontFamily: DM, fontSize: "0.73rem", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#555")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#333")} />
            </div>
          </div>

          {/* Component sections */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0.4rem" }}>
            {filteredSections.length === 0 ? (
              <div style={{ textAlign: "center", color: "#555", fontFamily: DM, fontSize: "0.73rem", marginTop: "2rem" }}>No components found</div>
            ) : filteredSections.map((section) => {
              const isOpen = lowerSearch ? true : !collapsed[section.id];
              return (
                <div key={section.id} style={{ marginBottom: "0.2rem" }}>
                  <button onClick={() => !lowerSearch && setCollapsed((c) => ({ ...c, [section.id]: !c[section.id] }))}
                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.38rem 0.3rem", color: "#888", fontFamily: GRUNGE, fontSize: "0.65rem", letterSpacing: "0.12em", textAlign: "left" }}>
                    <span style={{ fontSize: 9, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▸</span>
                    {section.label.toUpperCase()}
                  </button>
                  {isOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 4 }}>
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
                            style={{ background: hov ? "#2e2e2e" : "#272727", border: `1px solid ${hov ? "#555" : "#333"}`, borderRadius: 7, padding: "7px 8px 5px", cursor: "grab", transform: hov ? "translateY(-2px)" : "none", transition: "transform 0.12s, border-color 0.12s, background 0.12s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, userSelect: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 30, width: "100%" }}>{chip.preview()}</div>
                            <div style={{ fontFamily: DM, fontSize: "0.63rem", color: "#777" }}>{chip.label}</div>
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

          {/* Players pinned at bottom */}
          <div style={{ borderTop: "1px solid #2a2a2a", padding: "0.55rem 0.8rem 0.6rem" }}>
            <div style={{ fontFamily: GRUNGE, fontSize: "0.58rem", letterSpacing: "0.15em", color: "#555", marginBottom: "0.35rem" }}>PLAYERS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem" }}>
              {room.players.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0, boxShadow: `0 0 5px ${p.color}80` }} />
                  <span style={{ fontFamily: DM, fontSize: "0.7rem", color: p.id === myPlayerId ? "#E8E2D9" : "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: p.id === myPlayerId ? 600 : 400 }}>
                    {p.name}{p.id === myPlayerId ? " (you)" : ""}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: DM, fontSize: "0.58rem", color: "#444", marginTop: "0.45rem", lineHeight: 1.5 }}>
              Click / drag to add · Dbl-click to edit<br />Del removes · Ctrl+D duplicates
            </div>
          </div>
        </div>

        {/* ── CANVAS AREA ── */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", padding: "3rem 5rem 2rem" }}>
          <div style={{ position: "relative" }}>

            {/* Round label */}
            <div style={{ position: "absolute", top: -48, left: "50%", transform: "translateX(-50%)", fontFamily: GRUNGE, fontSize: "1.7rem", color: "rgba(232,226,217,0.1)", letterSpacing: "0.35em", whiteSpace: "nowrap", pointerEvents: "none" }}>
              ROUND {room.round}
            </div>

            {/* Ornate frame */}
            <div style={{ position: "absolute", inset: -12, border: "12px solid #111", transform: "rotate(-0.8deg)", pointerEvents: "none", boxShadow: "inset 0 0 0 4px #444, inset 0 0 0 8px #111, inset 0 0 0 12px #333, 10px 14px 48px rgba(0,0,0,0.85), 0 0 0 2px #222", zIndex: 0 }} />
            {[[-20,-20,0],[-20,undefined,90],[undefined,-20,270],[undefined,undefined,180]].map(([t,l,r],i) => (
              <div key={i} style={{ position: "absolute", top: t !== undefined ? t : undefined, left: l !== undefined ? l : undefined, bottom: t === undefined ? -20 : undefined, right: l === undefined ? -20 : undefined, pointerEvents: "none", zIndex: 2 }}>
                <CornerOrnament rotate={r as number} />
              </div>
            ))}

            {/* Sticky note — prompt */}
            <div style={{ position: "absolute", top: 20, right: -152, width: 132, background: "#F5EE7A", padding: "8px 10px 10px", transform: "rotate(3deg)", boxShadow: "2px 4px 10px rgba(0,0,0,0.4)", zIndex: 5, pointerEvents: "none" }}>
              <div style={{ fontFamily: GRUNGE, fontSize: "0.56rem", color: "#8a7700", letterSpacing: "0.1em", marginBottom: 4 }}>BRIEF</div>
              <div style={{ fontFamily: DM, fontSize: "0.65rem", color: "#3a3000", lineHeight: 1.4, wordBreak: "break-word" }}>{room.prompt}</div>
            </div>
            <div style={{ position: "absolute", top: 168, right: -144, width: 124, background: "#f0f0f0", padding: "8px 10px 10px", transform: "rotate(-2deg)", boxShadow: "2px 4px 10px rgba(0,0,0,0.4)", zIndex: 5, pointerEvents: "none" }}>
              <div style={{ fontFamily: GRUNGE, fontSize: "0.56rem", color: "#888", letterSpacing: "0.1em", marginBottom: 4 }}>FONTS</div>
              <div style={{ fontFamily: DM, fontSize: "0.62rem", color: "#333", lineHeight: 1.6 }}>🔒 DM Sans<br />🔒 Bebas Neue</div>
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
              {/* Empty state */}
              {room.canvas.length === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ fontFamily: DM, fontWeight: 700, fontSize: "1.5rem", color: "rgba(0,0,0,0.06)", textAlign: "center", padding: "0 3rem", lineHeight: 1.3 }}>{room.prompt}</div>
                  <div style={{ fontFamily: DM, fontSize: "0.8rem", color: "rgba(0,0,0,0.1)", marginTop: "0.75rem" }}>Drag elements from the panel or click to add</div>
                </div>
              )}

              {/* Canvas elements */}
              {room.canvas.map((el) => {
                const localPos = localPositions[el.id];
                const displayEl = localPos ? { ...el, x: localPos.x, y: localPos.y } : el;
                const isEditing = editingId === el.id;
                const isText = TEXT_TYPES.includes(el.type);
                const outerStyle = getOuterStyle(displayEl);

                if (isEditing) {
                  return (
                    <div key={el.id}
                      contentEditable suppressContentEditableWarning
                      style={{ ...outerStyle, border: "2px solid #3ECFCF", outline: "none", cursor: "text", userSelect: "text" }}
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
                  <div key={el.id} style={outerStyle}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    onDoubleClick={(e) => handleElementDoubleClick(e, el)}>
                    {isText ? renderCanvasContent(displayEl) : renderCanvasContent(displayEl)}
                  </div>
                );
              })}

              {/* Selection overlay */}
              {selectedEl && selectedPos && !editingId && (() => {
                const H = 8;
                const ex = selectedPos.x;
                const ey = selectedPos.y;
                const ew = selectedEl.width;
                const eh = selectedEl.height;
                return (
                  <>
                    <div style={{ position: "absolute", left: ex - 2, top: ey - 2, width: ew + 4, height: eh + 4, border: "2px solid #3ECFCF", pointerEvents: "none", zIndex: 900 }} />
                    {[[ex - H/2, ey - H/2],[ex + ew - H/2, ey - H/2],[ex - H/2, ey + eh - H/2],[ex + ew - H/2, ey + eh - H/2]].map(([hx,hy],i) => (
                      <div key={i} style={{ position: "absolute", left: hx, top: hy, width: H, height: H, background: "#fff", border: "2px solid #3ECFCF", zIndex: 901, pointerEvents: "none" }} />
                    ))}

                    {/* Toolbar */}
                    <div style={{ position: "absolute", left: toolbarX, top: toolbarY, zIndex: 950, background: "#161616", border: "1px solid #3a3a3a", borderRadius: 20, padding: "6px 10px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 6px 24px rgba(0,0,0,0.7)", minWidth: 300, pointerEvents: "all" }}
                      onMouseDown={(e) => e.stopPropagation()}>

                      {/* Row 1: always shown */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <ToolBtn title="Delete (Del)" onClick={() => { onDelete(selectedEl.id); setSelectedId(null); }}>🗑️</ToolBtn>
                        <ToolBtn title="Bring Forward" onClick={() => onUpdate(selectedEl.id, { zIndex: selectedEl.zIndex + 1 })}>⬆️</ToolBtn>
                        <ToolBtn title="Send Backward" onClick={() => onUpdate(selectedEl.id, { zIndex: Math.max(0, selectedEl.zIndex - 1) })}>⬇️</ToolBtn>

                        {/* Color picker */}
                        <div style={{ position: "relative" }}>
                          <button title="Fill Color" onClick={() => setShowColorPicker((v) => !v)}
                            style={{ width: 26, height: 26, borderRadius: "50%", background: selectedEl.fill === "transparent" ? `conic-gradient(red, orange, yellow, green, cyan, blue, violet, red)` : selectedEl.fill, border: "2px solid #555", cursor: "pointer", flexShrink: 0 }} />
                          {showColorPicker && (
                            <div style={{ position: "absolute", bottom: 32, left: 0, background: "#111", border: "1px solid #3a3a3a", borderRadius: 10, padding: 8, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, zIndex: 960, boxShadow: "0 8px 28px rgba(0,0,0,0.8)" }}>
                              {PALETTE.map((c) => (
                                <button key={c} onClick={() => { onUpdate(selectedEl.id, { fill: c }); setShowColorPicker(false); }}
                                  style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: selectedEl.fill === c ? "2px solid #3ECFCF" : "1.5px solid #444", cursor: "pointer", flexShrink: 0 }} />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Corner radius */}
                        <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 2 }}>
                          <span style={{ fontSize: 12, color: "#555" }}>◻</span>
                          <input type="number" min={0} max={100} value={selectedEl.cornerRadius ?? 0}
                            onChange={(e) => onUpdate(selectedEl.id, { cornerRadius: Number(e.target.value) })}
                            title="Corner Radius"
                            style={{ width: 36, background: "#222", border: "1px solid #444", color: "#ccc", borderRadius: 5, padding: "2px 4px", fontFamily: DM, fontSize: "0.68rem", textAlign: "center", outline: "none" }} />
                        </div>

                        {/* Opacity */}
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 10, color: "#555", fontFamily: DM, fontWeight: 600 }}>%</span>
                          <input type="number" min={0} max={100} value={Math.round((selectedEl.opacity ?? 1) * 100)}
                            onChange={(e) => onUpdate(selectedEl.id, { opacity: Number(e.target.value) / 100 })}
                            title="Opacity"
                            style={{ width: 36, background: "#222", border: "1px solid #444", color: "#ccc", borderRadius: 5, padding: "2px 4px", fontFamily: DM, fontSize: "0.68rem", textAlign: "center", outline: "none" }} />
                        </div>

                        <div style={{ flex: 1 }} />
                        <ToolBtn title="Deselect (Esc)" onClick={() => { setSelectedId(null); setShowColorPicker(false); }}>✕</ToolBtn>
                      </div>

                      {/* Row 2: text controls */}
                      {isTextEl && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, borderTop: "1px solid #2a2a2a", paddingTop: 6 }}>
                          <select value={selectedEl.fontSize ?? 14} onChange={(e) => onUpdate(selectedEl.id, { fontSize: Number(e.target.value) })}
                            style={{ background: "#1e1e1e", border: "1px solid #444", color: "#ddd", borderRadius: 6, padding: "2px 4px", fontFamily: DM, fontSize: "0.7rem", cursor: "pointer" }}>
                            {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
                          </select>
                          <div style={{ display: "flex", gap: 2 }}>
                            {(["left","center","right"] as const).map((a, i) => (
                              <ToolBtn key={a} title={`Align ${a}`} onClick={() => onUpdate(selectedEl.id, { textAlign: a } as Partial<CanvasElement>)}>
                                {["≡","☰","≣"][i]}
                              </ToolBtn>
                            ))}
                          </div>
                          <ToolBtn title="Bold" onClick={() => onUpdate(selectedEl.id, { fontWeight: selectedEl.fontWeight === 800 ? 400 : 800 } as Partial<CanvasElement>)}>
                            <b>B</b>
                          </ToolBtn>
                          <div style={{ flex: 1 }} />
                          <span style={{ fontFamily: DM, fontSize: "0.62rem", color: "#444" }}>Dbl-click to edit</span>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Remote cursors */}
              {Object.values(remoteCursors).map((cursor) => {
                const player = room.players.find((p) => p.id === cursor.playerId);
                if (!player) return null;
                const isVisible = Date.now() - cursor.lastSeen < 3000;
                return (
                  <div key={cursor.playerId} style={{ position: "absolute", left: cursor.x * CANVAS_W, top: cursor.y * CANVAS_H, pointerEvents: "none", zIndex: 999, opacity: isVisible ? 1 : 0, transition: "left 0.05s linear, top 0.05s linear, opacity 0.5s" }}>
                    <svg width="16" height="20" viewBox="0 0 16 20">
                      <path d="M0 0 L0 14 L4 11 L6 18 L8 17 L6 10 L11 10 Z" fill={player.color} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                    </svg>
                    <div style={{ position: "absolute", top: 18, left: 10, background: player.color, color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 10, whiteSpace: "nowrap", fontFamily: DM, fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
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
      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid #3a3a3a", color: "#ddd", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}>
      {children}
    </button>
  );
}
