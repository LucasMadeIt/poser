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
const PANEL_W  = 228;
const BEBAS    = "'Bebas Neue', sans-serif";
const DM       = "'DM Sans', sans-serif";

const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";
const CREAM   = "#EDE5CC";

const PALETTE = [
  "#ffffff","#F8F4EE","#e0e0e0","#aaaaaa","#555555","#1a1a1a",
  "#D4561A","#E87DBB","#F5A623","#F1C40F","#2A8080","#1C3A60",
  "#8B1A10","#1A5A30","#9B59B6","#3ECFCF",
];

const TEXT_TYPES: CanvasElement["type"][] = ["text","heading","label","button","badge","tag","alert","toast"];
const FONT_SIZES = [10,12,14,16,18,24,32,48,64];
const MIN_W = 20;
const MIN_H = 10;

function detectCanvasMode(prompt: string): "mobile" | "web" | "default" {
  const p = prompt.toLowerCase();
  const mobileHits = ["mobile","phone","ios","android","iphone","onboarding","splash screen","splash","smartphone","app screen","instagram","story","twitter","snap"].filter((k) => p.includes(k)).length;
  const webHits    = ["website","landing page","dashboard","desktop","saas","homepage","blog","checkout","portfolio","newsletter","hero section","pitch deck","banner","error page","404","profile page","web page","web app","e-commerce"].filter((k) => p.includes(k)).length;
  const mobileScore = mobileHits + (p.includes("app") && !p.includes("web app") ? 0.5 : 0);
  const webScore    = webHits   + (p.includes("page") && webHits === 0 ? 0.5 : 0);
  if (mobileScore > webScore) return "mobile";
  if (webScore > mobileScore) return "web";
  return "default";
}

type ChipDef = {
  label: string;
  type: CanvasElement["type"];
  defaults: Partial<Omit<CanvasElement,"id"|"zIndex"|"ownerId">>;
  preview: () => React.ReactNode;
  special?: "image" | "video";
};
type SectionDef = { id: string; label: string; color: string; defaultOpen: boolean; chips: ChipDef[] };

type LocalTransform = { x: number; y: number; w: number; h: number };

// ─── Chip sections (no Frames — they already exist as background) ─────────────
const SECTIONS: SectionDef[] = [
  {
    id: "shape", label: "Shapes & Text", color: ORANGE, defaultOpen: true,
    chips: [
      { label: "Heading",    type:"heading", defaults:{ width:300, height:56,  content:"Heading",       fill:"#1a1a1a", fontSize:36 }, preview:()=><span style={{ fontFamily:DM, fontWeight:800, fontSize:16, color:"#1a1a1a" }}>Heading</span> },
      { label: "Body Text",  type:"text",    defaults:{ width:240, height:72,  content:"Body text here.", fill:"#555", fontSize:14 }, preview:()=><div style={{ display:"flex", flexDirection:"column", gap:3, width:"100%", padding:"0 4px" }}>{[100,82,65].map((w,i)=><div key={i} style={{ height:2.5, background:"#ccc", borderRadius:2, width:`${w}%` }} />)}</div> },
      { label: "Caption",    type:"text",    defaults:{ width:180, height:24,  content:"Small caption",  fill:"#888", fontSize:11 }, preview:()=><div style={{ height:2, background:"#ccc", borderRadius:1, width:"55%", margin:"0 auto" }} /> },
      { label: "Rectangle",  type:"rect",    defaults:{ width:200, height:100, fill:"#e8e8e8", stroke:"#ccc" }, preview:()=><div style={{ width:"70%", height:24, background:"#e0e0e0", border:"1.5px solid #ccc", borderRadius:3 }} /> },
      { label: "Oval",       type:"circle",  defaults:{ width:80,  height:80,  fill:"#e0e0e0" }, preview:()=><div style={{ width:28, height:28, borderRadius:"50%", background:"#e0e0e0", border:"1.5px solid #ccc" }} /> },
      { label: "Divider",    type:"divider", defaults:{ width:400, height:2,   fill:"#ddd" }, preview:()=><div style={{ width:"100%", height:2, background:"#ccc", borderRadius:1 }} /> },
    ],
  },
  {
    id: "inputs", label: "Inputs & Controls", color: NAVY, defaultOpen: false,
    chips: [
      { label:"Primary Btn",  type:"button",    defaults:{ width:140, height:42, content:"Continue", fill:"#1a1a1a", fontSize:14, cornerRadius:8 }, preview:()=><div style={{ background:"#1a1a1a", color:"#fff", fontFamily:DM, fontWeight:600, fontSize:11, padding:"4px 14px", borderRadius:6 }}>Continue</div> },
      { label:"Ghost Btn",    type:"button",    defaults:{ width:140, height:42, content:"Cancel", fill:"transparent", stroke:"#888", fontSize:14, cornerRadius:8 }, preview:()=><div style={{ border:"1.5px solid #aaa", color:"#555", fontFamily:DM, fontWeight:600, fontSize:11, padding:"3px 12px", borderRadius:6 }}>Cancel</div> },
      { label:"Text Input",   type:"input",     defaults:{ width:220, height:44, fill:"#ffffff", cornerRadius:8 }, preview:()=><div style={{ width:"100%", height:22, border:"1.5px solid #ccc", borderRadius:5, display:"flex", alignItems:"center", padding:"0 6px", gap:3 }}><span style={{ fontFamily:DM, fontSize:9, color:"#aaa" }}>Enter text...</span><span style={{ width:1, height:11, background:"#ccc" }} /></div> },
      { label:"Search Bar",   type:"searchbar", defaults:{ width:240, height:44, fill:"#f0f0f0", cornerRadius:100 }, preview:()=><div style={{ width:"100%", height:22, background:"#f0f0f0", borderRadius:100, display:"flex", alignItems:"center", padding:"0 8px", gap:4 }}><span style={{ fontSize:9 }}>🔍</span><span style={{ fontFamily:DM, fontSize:9, color:"#aaa" }}>Search...</span></div> },
      { label:"Dropdown",     type:"dropdown",  defaults:{ width:200, height:44, content:"Select option", fill:"#ffffff", cornerRadius:8 }, preview:()=><div style={{ width:"100%", height:22, border:"1.5px solid #ccc", borderRadius:5, display:"flex", alignItems:"center", padding:"0 6px", justifyContent:"space-between" }}><span style={{ fontFamily:DM, fontSize:9, color:"#aaa" }}>Select...</span><span style={{ fontSize:8, color:"#aaa" }}>⌄</span></div> },
      { label:"Checkbox",     type:"checkbox",  defaults:{ width:140, height:28, content:"Option", fill:"#ffffff" }, preview:()=><div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:12, height:12, border:"1.5px solid #ccc", borderRadius:2, background:"#fff" }} /><div style={{ height:2.5, background:"#ccc", width:36, borderRadius:2 }} /></div> },
      { label:"Toggle",       type:"toggle",    defaults:{ width:80,  height:32, fill:"#2A8080" }, preview:()=><div style={{ width:38, height:20, background:"#2A8080", borderRadius:100, position:"relative" }}><div style={{ position:"absolute", top:3, right:3, width:14, height:14, background:"#fff", borderRadius:"50%" }} /></div> },
    ],
  },
  {
    id: "nav", label: "Navigation", color: TEAL, defaultOpen: false,
    chips: [
      { label:"Nav Bar",    type:"navbar",     defaults:{ width:600, height:60, fill:"#ffffff" }, preview:()=><div style={{ width:"100%", height:20, background:"#f0f0f0", borderRadius:3, display:"flex", alignItems:"center", padding:"0 6px", gap:8 }}><div style={{ width:24, height:6, background:"#ccc", borderRadius:2 }} /><div style={{ flex:1 }} />{[0,1,2].map(i=><div key={i} style={{ width:16, height:4, background:"#ddd", borderRadius:2 }} />)}<div style={{ width:12, height:12, borderRadius:"50%", background:"#ccc" }} /></div> },
      { label:"Tab Bar",    type:"tabbar",     defaults:{ width:375, height:64, fill:"#ffffff" }, preview:()=><div style={{ width:"100%", height:20, background:"#f5f5f5", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"space-around" }}>{["🏠","🔍","➕","❤️","👤"].map((ic,i)=><span key={i} style={{ fontSize:i===0?11:9, opacity:i===0?1:0.35 }}>{ic}</span>)}</div> },
      { label:"Sidebar",    type:"sidebar",    defaults:{ width:200, height:320, fill:"#f7f7f7" }, preview:()=><div style={{ width:"100%", height:32, border:"1.5px solid #e0e0e0", borderRadius:3, overflow:"hidden", display:"flex" }}><div style={{ width:"40%", background:"#f0f0f0", display:"flex", flexDirection:"column", gap:3, padding:3 }}>{[0,1,2].map(i=><div key={i} style={{ height:3, background:"#ddd", borderRadius:2, width:"80%" }} />)}</div><div style={{ flex:1, background:"#fff" }} /></div> },
      { label:"Breadcrumb", type:"breadcrumb", defaults:{ width:260, height:28, content:"Home / Page / Current", fill:"#555" }, preview:()=><div style={{ display:"flex", gap:3, alignItems:"center" }}>{["Home","›","Page","›","Here"].map((t,i)=><span key={i} style={{ fontSize:8, color:i===4?"#333":i%2===0?"#2A8080":"#ccc", fontFamily:DM }}>{t}</span>)}</div> },
    ],
  },
  {
    id: "content", label: "Content", color: MUSTARD, defaultOpen: false,
    chips: [
      { label:"Card",       type:"card",     defaults:{ width:240, height:210, fill:"#ffffff", cornerRadius:12 }, preview:()=><div style={{ width:"100%", border:"1.5px solid #e8e8e8", borderRadius:6, overflow:"hidden" }}><div style={{ height:18, background:"#e8e8e8", width:"100%" }} /><div style={{ padding:"4px 6px", display:"flex", flexDirection:"column", gap:2 }}>{[80,60].map((w,i)=><div key={i} style={{ height:2.5, background:i===0?"#bbb":"#ddd", borderRadius:2, width:`${w}%` }} />)}</div></div> },
      { label:"List Item",  type:"listitem", defaults:{ width:340, height:64, content:"List Item", fill:"#ffffff" }, preview:()=><div style={{ width:"100%", height:22, border:"1px solid #e8e8e8", borderRadius:3, display:"flex", alignItems:"center", gap:5, padding:"0 5px" }}><div style={{ width:14, height:14, borderRadius:"50%", background:"#e0e0e0", flexShrink:0 }} /><div style={{ flex:1, height:2.5, background:"#e0e0e0", borderRadius:2 }} /><span style={{ fontSize:8, color:"#ccc" }}>›</span></div> },
      { label:"Avatar",     type:"circle",   defaults:{ width:52, height:52, fill:"#9B59B6" }, preview:()=><div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#9B59B6,#E87DBB)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:10, color:"#fff", fontFamily:DM, fontWeight:700 }}>JD</span></div> },
      { label:"Badge",      type:"badge",    defaults:{ width:64, height:26, content:"New", fill:ORANGE, cornerRadius:100 }, preview:()=><div style={{ background:ORANGE, borderRadius:100, padding:"2px 8px" }}><span style={{ fontFamily:DM, fontSize:9, fontWeight:700, color:"#fff" }}>New</span></div> },
      { label:"Chip / Tag", type:"tag",      defaults:{ width:80, height:28, content:"Design", fill:"#f0f0f0", cornerRadius:100 }, preview:()=><div style={{ background:"#f0f0f0", border:"1px solid #e0e0e0", borderRadius:100, padding:"2px 8px" }}><span style={{ fontFamily:DM, fontSize:9, color:"#666" }}>Design</span></div> },
    ],
  },
  {
    id: "feedback", label: "Feedback & Overlays", color: "#8B1A10", defaultOpen: false,
    chips: [
      { label:"Progress",     type:"progress", defaults:{ width:260, height:14, fill:TEAL, cornerRadius:100 }, preview:()=><div style={{ width:"100%", height:8, background:"#e8e8e8", borderRadius:100, overflow:"hidden" }}><div style={{ width:"65%", height:"100%", background:TEAL, borderRadius:100 }} /></div> },
      { label:"Alert Banner", type:"alert",    defaults:{ width:320, height:52, content:"Something needs attention", fill:"#fffbe6", cornerRadius:6 }, preview:()=><div style={{ width:"100%", height:20, background:"#fffbe6", border:"1px solid #ffe58f", borderRadius:4, display:"flex", alignItems:"center", gap:4, padding:"0 5px" }}><span style={{ fontSize:9 }}>⚠️</span><div style={{ height:2.5, background:"#ffe58f", borderRadius:2, flex:1 }} /></div> },
      { label:"Toast",        type:"toast",    defaults:{ width:240, height:48, content:"Saved successfully", fill:"#1a1a1a", cornerRadius:100 }, preview:()=><div style={{ width:"100%", height:20, background:"#1a1a1a", borderRadius:100, display:"flex", alignItems:"center", gap:4, padding:"0 8px" }}><span style={{ fontSize:8 }}>✅</span><div style={{ height:2.5, background:"#444", borderRadius:2, flex:1 }} /></div> },
      { label:"Modal",        type:"modal",    defaults:{ width:340, height:240, fill:"#ffffff", cornerRadius:12 }, preview:()=><div style={{ width:"100%", position:"relative" }}><div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.25)", borderRadius:4 }} /><div style={{ border:"1.5px solid #e8e8e8", borderRadius:5, padding:"4px 6px", background:"#fff", position:"relative" }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><div style={{ height:3, background:"#ccc", width:"40%", borderRadius:2 }} /><span style={{ fontSize:7, color:"#aaa" }}>✕</span></div>{[100,70].map((w,i)=><div key={i} style={{ height:2, background:"#e0e0e0", width:`${w}%`, borderRadius:2, marginBottom:2 }} />)}</div></div> },
      { label:"FAB",          type:"fab",      defaults:{ width:56, height:56, fill:"#1a1a1a", cornerRadius:100 }, preview:()=><div style={{ width:28, height:28, borderRadius:"50%", background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:14, color:"#fff" }}>+</span></div> },
    ],
  },
  {
    id: "media", label: "Media (Images & Video)", color: "#6A1A8A", defaultOpen: true,
    chips: [
      { label:"Upload Image", type:"image", special:"image", defaults:{ width:300, height:200, fill:"#f0e8d8" }, preview:()=><div style={{ width:"100%", height:36, background:"linear-gradient(135deg,#f0e8d8,#e8ddc8)", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:2 }}><span style={{ fontSize:18 }}>🖼️</span><span style={{ fontFamily:DM, fontSize:7, color:"#888" }}>Click to upload</span></div> },
      { label:"Image Block",  type:"image", defaults:{ width:260, height:180, fill:"#e8e8e8" }, preview:()=><div style={{ width:"100%", height:32, background:"#e8e8e8", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><span style={{ fontSize:16 }}>🖼</span><span style={{ fontFamily:DM, fontSize:8, color:"#aaa" }}>Image</span></div> },
      { label:"Video Block",  type:"video", defaults:{ width:320, height:200, fill:"#1a1a1a" }, preview:()=><div style={{ width:"100%", height:32, background:"#1a1a1a", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><div style={{ width:0, height:0, borderTop:"7px solid transparent", borderBottom:"7px solid transparent", borderLeft:`12px solid #fff` }} /><span style={{ fontFamily:DM, fontSize:8, color:"#888" }}>Video</span></div> },
    ],
  },
];

// ─── Canvas element renderers ────────────────────────────────────────────────
function renderCanvasContent(el: CanvasElement): React.ReactNode {
  const r = el.cornerRadius ?? 0;
  const c = el.fill;
  switch (el.type) {
    case "image":
      return el.imageUrl
        ? <img src={el.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", pointerEvents:"none" }} />
        : <div style={{ width:"100%", height:"100%", background:"#f0e8d8", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}><span style={{ fontSize:32 }}>🖼️</span><span style={{ fontFamily:DM, fontSize:12, color:"#aaa" }}>No image</span></div>;
    case "video":
      return <div style={{ width:"100%", height:"100%", background:c||"#1a1a1a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, position:"relative" }}>
        <div style={{ width:0, height:0, borderTop:"18px solid transparent", borderBottom:"18px solid transparent", borderLeft:"30px solid rgba(255,255,255,0.75)" }} />
        <div style={{ position:"absolute", bottom:10, left:0, right:0, height:4, background:"rgba(255,255,255,0.15)", margin:"0 12px", borderRadius:2 }}><div style={{ width:"35%", height:"100%", background:ORANGE, borderRadius:2 }} /></div>
      </div>;
    case "input":
      return <div style={{ width:"100%", height:"100%", background:"#fff", border:"1.5px solid #ccc", borderRadius:r||8, display:"flex", alignItems:"center", padding:"0 12px", gap:4, boxSizing:"border-box" }}><span style={{ fontFamily:DM, fontSize:13, color:"#bbb", flex:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{el.content||"Enter text here..."}</span><span style={{ width:1, height:"55%", background:"#ccc", display:"inline-block", flexShrink:0 }} /></div>;
    case "searchbar":
      return <div style={{ width:"100%", height:"100%", background:"#f2f2f2", borderRadius:r||100, display:"flex", alignItems:"center", padding:"0 14px", gap:8, boxSizing:"border-box" }}><span style={{ fontSize:15, flexShrink:0 }}>🔍</span><span style={{ fontFamily:DM, fontSize:13, color:"#aaa" }}>{el.content||"Search..."}</span></div>;
    case "dropdown":
      return <div style={{ width:"100%", height:"100%", background:"#fff", border:"1.5px solid #ccc", borderRadius:r||8, display:"flex", alignItems:"center", padding:"0 12px", justifyContent:"space-between", boxSizing:"border-box" }}><span style={{ fontFamily:DM, fontSize:13, color:"#aaa" }}>{el.content||"Select option..."}</span><span style={{ fontFamily:DM, fontSize:14, color:"#aaa" }}>⌄</span></div>;
    case "checkbox":
      return <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", gap:10 }}><div style={{ width:18, height:18, border:"2px solid #bbb", borderRadius:4, background:"#fff", flexShrink:0 }} /><span style={{ fontFamily:DM, fontSize:13, color:"#333" }}>{el.content||"Option"}</span></div>;
    case "radio":
      return <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", gap:10 }}><div style={{ width:18, height:18, border:"2px solid #bbb", borderRadius:"50%", background:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ width:8, height:8, borderRadius:"50%", background:c!=="#ffffff"?c:"#ccc" }} /></div><span style={{ fontFamily:DM, fontSize:13, color:"#333" }}>{el.content||"Option"}</span></div>;
    case "toggle":
      return <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", gap:10 }}><div style={{ width:50, height:28, background:c, borderRadius:100, position:"relative", flexShrink:0 }}><div style={{ position:"absolute", top:4, right:4, width:20, height:20, background:"#fff", borderRadius:"50%", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} /></div><span style={{ fontFamily:DM, fontSize:12, color:"#333" }}>{el.content||""}</span></div>;
    case "navbar":
      return <div style={{ width:"100%", height:"100%", background:c, borderBottom:"1px solid #e8e8e8", display:"flex", alignItems:"center", padding:"0 20px", gap:28, boxSizing:"border-box" }}><div style={{ width:80, height:22, background:"#1a1a1a", borderRadius:4, flexShrink:0 }} /><div style={{ flex:1 }} />{["Home","About","Work"].map(t=><span key={t} style={{ fontFamily:DM, fontSize:13, color:"#555", flexShrink:0 }}>{t}</span>)}<div style={{ width:34, height:34, borderRadius:"50%", background:"#ddd", flexShrink:0 }} /></div>;
    case "tabbar":
      return <div style={{ width:"100%", height:"100%", background:c, borderTop:"1px solid #e8e8e8", display:"flex", alignItems:"center", justifyContent:"space-around", padding:"0 8px", boxSizing:"border-box" }}>{[["🏠","Home",true],["🔍","Search",false],["➕","",false],["❤️","Saved",false],["👤","Profile",false]].map(([icon,label,active])=><div key={label as string} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, opacity:active?1:0.4, flex:1 }}><span style={{ fontSize:label===""?24:18 }}>{icon}</span>{label&&<span style={{ fontFamily:DM, fontSize:10, color:"#333" }}>{label}</span>}</div>)}</div>;
    case "sidebar":
      return <div style={{ width:"100%", height:"100%", background:c, borderRight:"1px solid #e8e8e8", padding:"16px 0", display:"flex", flexDirection:"column", gap:2, boxSizing:"border-box" }}>{[["🏠","Home",true],["📁","Projects",false],["⭐","Favorites",false],["⚙️","Settings",false],["👤","Profile",false]].map(([icon,label,active])=><div key={label as string} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", background:active?"rgba(0,0,0,0.06)":"transparent", borderRadius:"0 8px 8px 0", marginRight:8 }}><span style={{ fontSize:15 }}>{icon}</span><span style={{ fontFamily:DM, fontSize:13, color:active?"#222":"#888", fontWeight:active?600:400 }}>{label}</span></div>)}</div>;
    case "breadcrumb":
      return <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", gap:6 }}>{(el.content||"Home / Page / Current").split("/").map((seg,i,arr)=><span key={i} style={{ fontFamily:DM, fontSize:13, color:i===arr.length-1?"#222":"#999", display:"flex", alignItems:"center", gap:6 }}>{seg.trim()}{i<arr.length-1&&<span style={{ color:"#ddd" }}>›</span>}</span>)}</div>;
    case "listitem":
      return <div style={{ width:"100%", height:"100%", background:c, borderBottom:"1px solid #f0f0f0", display:"flex", alignItems:"center", padding:"0 14px", gap:12, boxSizing:"border-box" }}><div style={{ width:38, height:38, borderRadius:"50%", background:"#e0e0e0", flexShrink:0 }} /><div style={{ flex:1, minWidth:0 }}><div style={{ fontFamily:DM, fontWeight:600, fontSize:14, color:"#222", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{el.content||"List Item Title"}</div><div style={{ fontFamily:DM, fontSize:12, color:"#aaa", marginTop:2 }}>Subtitle text here</div></div><span style={{ color:"#ccc", fontSize:18, flexShrink:0 }}>›</span></div>;
    case "card":
      return <div style={{ width:"100%", height:"100%", background:c, border:"1px solid #eee", borderRadius:r||12, overflow:"hidden", display:"flex", flexDirection:"column", boxSizing:"border-box" }}><div style={{ height:"42%", background:"#e8e8e8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span style={{ fontSize:28, color:"#ccc" }}>🖼</span></div><div style={{ flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", gap:6 }}><div style={{ fontFamily:DM, fontWeight:700, fontSize:15, color:"#1a1a1a" }}>{el.content||"Card Title"}</div><div style={{ fontFamily:DM, fontSize:12, color:"#aaa", lineHeight:1.4 }}>Short description text.</div><div style={{ marginTop:"auto", height:32, background:"#1a1a1a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:DM, fontSize:13, color:"#fff", fontWeight:600 }}>Get Started</span></div></div></div>;
    case "badge":
      return <div style={{ width:"100%", height:"100%", background:c, borderRadius:r||100, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:DM, fontSize:el.fontSize??12, fontWeight:700, color:"#fff" }}>{el.content||"New"}</span></div>;
    case "tag":
      return <div style={{ width:"100%", height:"100%", background:c, border:"1px solid #e0e0e0", borderRadius:r||100, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:DM, fontSize:el.fontSize??12, color:"#555" }}>{el.content||"Tag"}</span></div>;
    case "progress":
      return <div style={{ width:"100%", height:"100%", background:"#e0e0e0", borderRadius:r||100, overflow:"hidden" }}><div style={{ width:"65%", height:"100%", background:c, borderRadius:r||100 }} /></div>;
    case "alert":
      return <div style={{ width:"100%", height:"100%", background:c||"#fffbe6", border:`1px solid ${c==="#fffbe6"||!c?"#ffe58f":"#ccc"}`, borderRadius:r||6, display:"flex", alignItems:"center", gap:10, padding:"0 14px", boxSizing:"border-box" }}><span style={{ fontSize:18, flexShrink:0 }}>⚠️</span><span style={{ fontFamily:DM, fontSize:13, color:"#856404", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{el.content||"Something needs attention"}</span></div>;
    case "toast":
      return <div style={{ width:"100%", height:"100%", background:c||"#1a1a1a", borderRadius:r||100, display:"flex", alignItems:"center", gap:10, padding:"0 16px", boxSizing:"border-box" }}><span style={{ fontSize:15, flexShrink:0 }}>✅</span><span style={{ fontFamily:DM, fontSize:13, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{el.content||"Saved successfully"}</span></div>;
    case "modal":
      return <div style={{ position:"relative", width:"100%", height:"100%", borderRadius:r||12, overflow:"hidden" }}><div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)" }} /><div style={{ position:"absolute", left:"8%", right:"8%", top:"8%", bottom:"8%", background:c||"#fff", borderRadius:Math.max(0,(r||12)-4), display:"flex", flexDirection:"column", padding:"18px 20px", gap:10 }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}><span style={{ fontFamily:DM, fontWeight:700, fontSize:15, color:"#1a1a1a" }}>{el.content||"Modal Title"}</span><span style={{ fontSize:14, color:"#aaa" }}>✕</span></div><div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>{[100,80,60].map((w,i)=><div key={i} style={{ height:8, background:"#e8e8e8", borderRadius:4, width:`${w}%` }} />)}</div><div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><div style={{ height:32, background:"#f0f0f0", borderRadius:6, display:"flex", alignItems:"center", padding:"0 16px" }}><span style={{ fontFamily:DM, fontSize:13, color:"#666" }}>Cancel</span></div><div style={{ height:32, background:"#1a1a1a", borderRadius:6, display:"flex", alignItems:"center", padding:"0 16px" }}><span style={{ fontFamily:DM, fontSize:13, color:"#fff" }}>Confirm</span></div></div></div></div>;
    case "fab":
      return <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:c, boxShadow:"0 4px 16px rgba(0,0,0,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:Math.round(Math.min(el.width,el.height)*0.4), color:"#fff", lineHeight:1 }}>+</span></div>;
    case "framemobile":
      return <div style={{ width:"100%", height:"100%", border:"6px solid #2a2a2a", borderRadius:32, background:"#1a1a1a", position:"relative", boxSizing:"border-box", boxShadow:"inset 0 0 0 2px #3a3a3a" }}><div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"38%", height:22, background:"#1a1a1a", borderRadius:"0 0 12px 12px", zIndex:2 }} /><div style={{ position:"absolute", inset:0, borderRadius:26, overflow:"hidden" }}><div style={{ position:"absolute", inset:0, background:c||"#F8F4EE", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:DM, fontSize:11, color:"#ccc" }}>Screen</span></div></div><div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", width:"32%", height:4, background:"#3a3a3a", borderRadius:4 }} /></div>;
    case "frameweb":
      return <div style={{ width:"100%", height:"100%", border:"1.5px solid #ccc", borderRadius:r||8, overflow:"hidden", background:"#fff", display:"flex", flexDirection:"column", boxSizing:"border-box" }}><div style={{ height:32, background:"#f0f0f0", borderBottom:"1px solid #ddd", display:"flex", alignItems:"center", gap:8, padding:"0 10px", flexShrink:0 }}><div style={{ display:"flex", gap:4 }}>{["#f56","#fa3","#2c2"].map(cc=><div key={cc} style={{ width:9, height:9, borderRadius:"50%", background:cc }} />)}</div><div style={{ flex:1, height:18, background:"#fff", borderRadius:100, border:"1px solid #ddd", display:"flex", alignItems:"center", padding:"0 8px" }}><span style={{ fontFamily:DM, fontSize:10, color:"#bbb" }}>https://yourapp.com</span></div></div><div style={{ flex:1, background:c||"#F8F4EE", padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>{[70,50,35].map((w,i)=><div key={i} style={{ height:i===0?20:8, background:"rgba(0,0,0,0.08)", borderRadius:4, width:`${w}%` }} />)}</div></div>;
    case "rect":   return null;
    case "circle": return null;
    case "divider": return null;
    case "heading": return <span style={{ fontFamily:DM, fontWeight:el.fontWeight??800, fontSize:el.fontSize??36, color:el.fill, letterSpacing:"-0.01em", lineHeight:1.2 }}>{el.content}</span>;
    case "text":    return <span style={{ fontFamily:DM, fontSize:el.fontSize??14, color:el.fill, lineHeight:1.55, fontWeight:el.fontWeight??400 }}>{el.content}</span>;
    case "label":   return <span style={{ fontFamily:DM, fontSize:el.fontSize??12, color:"#2C2C2C", fontWeight:el.fontWeight??600 }}>{el.content}</span>;
    case "button":  return <span style={{ fontFamily:DM, fontSize:el.fontSize??14, fontWeight:el.fontWeight??600 }}>{el.content}</span>;
    default: return null;
  }
}

function getOuterStyle(el: CanvasElement): React.CSSProperties {
  const base: React.CSSProperties = {
    position:"absolute", left:el.x, top:el.y, width:el.width, height:el.height,
    zIndex:el.zIndex, cursor:"grab", userSelect:"none", boxSizing:"border-box",
    opacity:el.opacity??1, overflow:"hidden",
  };
  switch (el.type) {
    case "rect":   return { ...base, background:el.fill, border:el.stroke?`2px solid ${el.stroke}`:"none", borderRadius:el.cornerRadius??0 };
    case "circle": return { ...base, background:el.fill, borderRadius:"50%", border:el.stroke?`2px solid ${el.stroke}`:"none" };
    case "divider": return { ...base, height:Math.max(el.height,2), background:el.fill, borderRadius:el.cornerRadius??100 };
    case "heading": return { ...base, display:"flex", alignItems:"center", overflow:"hidden" };
    case "text":   return { ...base, display:"flex", alignItems:"flex-start", overflow:"hidden" };
    case "label":  return { ...base, background:el.fill, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:el.cornerRadius??2 };
    case "button": {
      const ghost = el.fill === "transparent";
      return { ...base, background:el.fill, border:el.stroke?`2px solid ${el.stroke}`:"none", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:el.cornerRadius??6, color:ghost?(el.stroke??"#222"):"#fff" };
    }
    case "image":  return { ...base, background:el.fill, borderRadius:el.cornerRadius??4 };
    case "video":  return { ...base, borderRadius:el.cornerRadius??4, overflow:"hidden" };
    default: return base;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GamePage({ room, myPlayerId, amIHost, onAdd, onUpdate, onDelete, onSkip, remoteCursors, emitCursorMove }: Props) {
  const myPlayer   = room.players.find((p) => p.id === myPlayerId);
  const isImposter = myPlayer?.isImposter ?? false;

  const canvasRef        = useRef<HTMLDivElement>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const draggingRef      = useRef<{ elId:string; startX:number; startY:number; origX:number; origY:number } | null>(null);
  const resizingRef      = useRef<{ elId:string; handle:0|1|2|3; startX:number; startY:number; origX:number; origY:number; origW:number; origH:number } | null>(null);
  const lastCursorEmit   = useRef(0);
  const undoStackRef     = useRef<Array<{ type:"move"; id:string; oldX:number; oldY:number; oldW:number; oldH:number }>>([]);

  const [localTransforms, setLocalTransforms] = useState<Record<string,LocalTransform>>({});
  const [selectedId,      setSelectedId]      = useState<string|null>(null);
  const [editingId,       setEditingId]       = useState<string|null>(null);
  const [search,          setSearch]          = useState("");
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>(() => {
    const init: Record<string,boolean> = {};
    SECTIONS.forEach((s) => { init[s.id] = !s.defaultOpen; });
    return init;
  });
  const [hoveredChip,    setHoveredChip]    = useState<string|null>(null);
  const [showColorPicker,setShowColorPicker] = useState(false);
  const [dragOver,       setDragOver]        = useState(false);

  useEffect(() => { setLocalTransforms({}); setSelectedId(null); }, [room.round]);
  useEffect(() => {
    if (editingId && canvasRef.current) {
      const el = canvasRef.current.querySelector("[contenteditable='true']") as HTMLElement|null;
      if (el) { el.focus(); const range=document.createRange(); range.selectNodeContents(el); range.collapse(false); const sel=window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range); }
    }
  }, [editingId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) { e.preventDefault(); onDelete(selectedId); setSelectedId(null); }
      if (e.key === "Escape") { setSelectedId(null); setShowColorPicker(false); }
      if ((e.ctrlKey||e.metaKey) && e.key==="z") { e.preventDefault(); const action=undoStackRef.current.pop(); if(action?.type==="move") onUpdate(action.id,{x:action.oldX,y:action.oldY,width:action.oldW,height:action.oldH}); }
      if ((e.ctrlKey||e.metaKey) && e.key==="d" && selectedId) { e.preventDefault(); const el=room.canvas.find((c)=>c.id===selectedId); if(el) onAdd({type:el.type,x:el.x+16,y:el.y+16,width:el.width,height:el.height,content:el.content,fill:el.fill,stroke:el.stroke,fontSize:el.fontSize,cornerRadius:el.cornerRadius,opacity:el.opacity,imageUrl:el.imageUrl}); }
      if (selectedId && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) { e.preventDefault(); const el=room.canvas.find((c)=>c.id===selectedId); if(el){const nudge=e.shiftKey?10:1;const dx=e.key==="ArrowLeft"?-nudge:e.key==="ArrowRight"?nudge:0;const dy=e.key==="ArrowUp"?-nudge:e.key==="ArrowDown"?nudge:0;onUpdate(el.id,{x:Math.max(0,Math.min(CANVAS_W-el.width,el.x+dx)),y:Math.max(0,Math.min(CANVAS_H-el.height,el.y+dy))});} }
      if (!e.ctrlKey&&!e.metaKey&&!e.altKey) {
        if (e.key==="r"||e.key==="R") { e.preventDefault(); quickAdd("rect",200,120); }
        if (e.key==="t"||e.key==="T") { e.preventDefault(); quickAdd("text",200,48,"Text"); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editingId, room.canvas, onDelete, onUpdate, onAdd]);

  function quickAdd(type: CanvasElement["type"], w: number, h: number, content?: string) {
    const x = Math.round((CANVAS_W-w)/2);
    const y = Math.round((CANVAS_H-h)/2);
    onAdd({ type, x, y, width:w, height:h, fill:type==="rect"?"#e8e8e8":type==="text"?"#333333":"#1a1a1a", content, fontSize:type==="text"?16:undefined });
  }

  function openImagePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const w = Math.min(300, CANVAS_W * 0.4);
        const h = Math.round(w / aspect);
        const x = Math.round((CANVAS_W - w) / 2);
        const y = Math.round((CANVAS_H - h) / 2);
        onAdd({ type:"image", x, y, width:w, height:h, fill:"transparent", imageUrl:dataUrl });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (canvasRef.current && now-lastCursorEmit.current>33) { lastCursorEmit.current=now; const rect=canvasRef.current.getBoundingClientRect(); emitCursorMove((e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height); }
    if (draggingRef.current && !resizingRef.current) {
      const { elId,startX,startY,origX,origY } = draggingRef.current;
      const el = room.canvas.find((c)=>c.id===elId);
      if (!el) return;
      setLocalTransforms((p)=>({...p,[elId]:{x:Math.max(0,Math.min(CANVAS_W-el.width,origX+(e.clientX-startX))),y:Math.max(0,Math.min(CANVAS_H-el.height,origY+(e.clientY-startY))),w:el.width,h:el.height}}));
    }
    if (resizingRef.current) {
      const { elId,handle,startX,startY,origX,origY,origW,origH } = resizingRef.current;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      let nx=origX,ny=origY,nw=origW,nh=origH;
      if(handle===0){nx=origX+dx;ny=origY+dy;nw=origW-dx;nh=origH-dy;}
      if(handle===1){ny=origY+dy;nw=origW+dx;nh=origH-dy;}
      if(handle===2){nx=origX+dx;nw=origW-dx;nh=origH+dy;}
      if(handle===3){nw=origW+dx;nh=origH+dy;}
      nw=Math.max(MIN_W,nw);nh=Math.max(MIN_H,nh);nx=Math.max(0,Math.min(CANVAS_W-MIN_W,nx));ny=Math.max(0,Math.min(CANVAS_H-MIN_H,ny));
      setLocalTransforms((p)=>({...p,[elId]:{x:nx,y:ny,w:nw,h:nh}}));
    }
  }, [room.canvas, emitCursorMove]);

  const handleCanvasMouseUp = useCallback(() => {
    if (draggingRef.current && !resizingRef.current) {
      const { elId,origX,origY } = draggingRef.current;
      const lt = localTransforms[elId];
      if (lt && (Math.abs(lt.x-origX)>2||Math.abs(lt.y-origY)>2)) {
        const el=room.canvas.find((c)=>c.id===elId);
        onUpdate(elId,{x:Math.round(lt.x),y:Math.round(lt.y)});
        if(undoStackRef.current.length>=10) undoStackRef.current.shift();
        undoStackRef.current.push({type:"move",id:elId,oldX:origX,oldY:origY,oldW:el?.width??0,oldH:el?.height??0});
      }
      draggingRef.current=null;
    }
    if (resizingRef.current) {
      const { elId,origX,origY,origW,origH } = resizingRef.current;
      const lt=localTransforms[elId];
      if(lt){onUpdate(elId,{x:Math.round(lt.x),y:Math.round(lt.y),width:Math.round(lt.w),height:Math.round(lt.h)});if(undoStackRef.current.length>=10)undoStackRef.current.shift();undoStackRef.current.push({type:"move",id:elId,oldX:origX,oldY:origY,oldW:origW,oldH:origH});}
      resizingRef.current=null;
    }
  }, [localTransforms, onUpdate, room.canvas]);

  function handleElementMouseDown(e: React.MouseEvent, el: CanvasElement) {
    if (editingId||resizingRef.current) return;
    e.stopPropagation();
    setSelectedId(el.id); setShowColorPicker(false);
    draggingRef.current={elId:el.id,startX:e.clientX,startY:e.clientY,origX:el.x,origY:el.y};
  }
  function handleCornerMouseDown(e: React.MouseEvent, el: CanvasElement, handle: 0|1|2|3) {
    e.stopPropagation(); e.preventDefault();
    draggingRef.current=null;
    resizingRef.current={elId:el.id,handle,startX:e.clientX,startY:e.clientY,origX:el.x,origY:el.y,origW:el.width,origH:el.height};
  }
  function handleElementDoubleClick(e: React.MouseEvent, el: CanvasElement) {
    if (!TEXT_TYPES.includes(el.type)) return;
    e.stopPropagation(); setEditingId(el.id); setSelectedId(el.id);
  }
  function commitEdit(el: CanvasElement, div: HTMLElement|null) {
    if (!div) return;
    onUpdate(el.id,{content:div.innerText??div.textContent??""});
    setEditingId(null);
  }
  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target===canvasRef.current||(e.target as HTMLElement).dataset.canvas==="true") {
      setSelectedId(null); setShowColorPicker(false); setEditingId(null);
    }
  }
  function addChipAt(chip: ChipDef, x?: number, y?: number) {
    if (chip.special === "image") { openImagePicker(); return; }
    const w=chip.defaults.width??200, h=chip.defaults.height??80;
    const px=x!==undefined?Math.max(0,Math.min(CANVAS_W-w,x-w/2)):Math.floor(Math.random()*(CANVAS_W-w-20))+10;
    const py=y!==undefined?Math.max(0,Math.min(CANVAS_H-h,y-h/2)):Math.floor(Math.random()*(CANVAS_H-h-20))+10;
    onAdd({type:chip.type,x:Math.round(px),y:Math.round(py),width:w,height:h,content:chip.defaults.content,fill:chip.defaults.fill??"#ffffff",stroke:chip.defaults.stroke,fontSize:chip.defaults.fontSize,cornerRadius:chip.defaults.cornerRadius,opacity:chip.defaults.opacity});
  }
  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const raw=e.dataTransfer.getData("chipDef");
    if (!raw||!canvasRef.current) return;
    const {type,defaults}=JSON.parse(raw) as {type:CanvasElement["type"];defaults:ChipDef["defaults"]};
    const rect=canvasRef.current.getBoundingClientRect();
    addChipAt({label:"",type,defaults,preview:()=>null},e.clientX-rect.left,e.clientY-rect.top);
  }

  const canvasMode = detectCanvasMode(room.prompt);
  const lowerSearch = search.toLowerCase().trim();
  const filteredSections = SECTIONS.map((s)=>({...s,chips:lowerSearch?s.chips.filter((c)=>c.label.toLowerCase().includes(lowerSearch)):s.chips})).filter((s)=>s.chips.length>0);

  const selectedEl  = selectedId ? (room.canvas.find((e)=>e.id===selectedId)??null) : null;
  const selectedLT  = selectedEl ? (localTransforms[selectedId!]??{x:selectedEl.x,y:selectedEl.y,w:selectedEl.width,h:selectedEl.height}) : null;
  const isTextEl    = selectedEl ? TEXT_TYPES.includes(selectedEl.type) : false;
  const TOOLBAR_H   = isTextEl ? 130 : 108;
  const toolbarY    = selectedEl&&selectedLT ? (selectedLT.y<TOOLBAR_H+16?selectedLT.y+selectedLT.h+8:selectedLT.y-TOOLBAR_H-10) : 0;
  const toolbarX    = selectedEl&&selectedLT ? Math.max(4,Math.min(CANVAS_W-320,selectedLT.x+selectedLT.w/2-160)) : 0;

  function alignEl(axis:"lx"|"cx"|"rx"|"ty"|"cy"|"by") {
    if(!selectedEl) return;
    const lt=selectedLT??{x:selectedEl.x,y:selectedEl.y,w:selectedEl.width,h:selectedEl.height};
    let nx=lt.x,ny=lt.y;
    if(axis==="lx") nx=0; if(axis==="cx") nx=Math.round((CANVAS_W-lt.w)/2); if(axis==="rx") nx=CANVAS_W-lt.w;
    if(axis==="ty") ny=0; if(axis==="cy") ny=Math.round((CANVAS_H-lt.h)/2); if(axis==="by") ny=CANVAS_H-lt.h;
    onUpdate(selectedEl.id,{x:nx,y:ny});
  }

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#F5EEE2", overflow:"hidden" }}>

      {/* hidden file input for image upload */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFileChange} />

      {/* ── TOP BAR — white with colourful logo accents ── */}
      <div style={{ background:"#FFFFFF", display:"flex", alignItems:"center", padding:"0 1.25rem", height:52, flexShrink:0, borderBottom:`3px solid ${ORANGE}`, gap:"1.2rem", boxShadow:"0 2px 12px rgba(0,0,0,0.10)" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height:38, display:"block", objectFit:"contain" }} />
        <div style={{ width:1, height:28, background:"#E8E2D8", flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", color:"#B8A880", letterSpacing:"0.1em", lineHeight:1 }}>ROUND {room.round} / {room.maxRounds}</div>
          <div style={{ fontFamily:DM, fontSize:"0.9rem", color:"#1A1208", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginTop:1 }}>{room.prompt}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.9rem", flexShrink:0 }}>
          <div style={{
            fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.12em", padding:"0.22rem 0.75rem", borderRadius:3,
            background:isImposter?`${ORANGE}18`:`${TEAL}14`,
            border:`2px solid ${isImposter?ORANGE:TEAL}`,
            color:isImposter?ORANGE:TEAL,
          }}>
            {isImposter ? "IMPOSTER" : "CREWMATE"}
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:DM, fontSize:"0.52rem", color:"#B8A880", letterSpacing:"0.14em", marginBottom:1 }}>TIME LEFT</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
          {amIHost && (
            <button onClick={onSkip}
              style={{ fontFamily:BEBAS, fontSize:"0.8rem", color:CREAM, background:NAVY, border:`2px solid #0A2040`, padding:"0.3rem 0.85rem", cursor:"pointer", letterSpacing:"0.06em", boxShadow:"2px 2px 0 rgba(0,0,0,0.3)" }}
              onMouseEnter={(e)=>(e.currentTarget.style.background="#2A4A70")}
              onMouseLeave={(e)=>(e.currentTarget.style.background=NAVY)}>
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── LEFT PANEL — white/cream ── */}
        <div style={{ width:PANEL_W, background:"#FAFAF5", borderRight:`3px solid #E8E2D8`, display:"flex", flexDirection:"column", flexShrink:0, boxShadow:"2px 0 8px rgba(0,0,0,0.06)" }}>

          {/* Search */}
          <div style={{ padding:"0.65rem 0.65rem 0.4rem", borderBottom:"1.5px solid #F0E8D8" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#C8B888", pointerEvents:"none" }}>🔍</span>
              <input type="text" placeholder="Search components…" value={search} onChange={(e)=>setSearch(e.target.value)}
                style={{ width:"100%", background:"#FFF8F0", border:`1.5px solid #E8E2D8`, color:"#1A1208", borderRadius:6, padding:"0.35rem 0.5rem 0.35rem 1.9rem", fontFamily:DM, fontSize:"0.73rem", outline:"none", boxSizing:"border-box" }}
                onFocus={(e)=>(e.currentTarget.style.borderColor=ORANGE)}
                onBlur={(e)=>(e.currentTarget.style.borderColor="#E8E2D8")} />
            </div>
          </div>

          {/* Component list */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 0.4rem 0.4rem" }}>
            {filteredSections.length === 0
              ? <div style={{ textAlign:"center", color:"#C8B888", fontFamily:DM, fontSize:"0.73rem", marginTop:"2rem" }}>No components found</div>
              : filteredSections.map((section) => {
                const isOpen = lowerSearch ? true : !collapsed[section.id];
                return (
                  <div key={section.id} style={{ marginBottom:"0.15rem" }}>
                    <button onClick={()=>!lowerSearch&&setCollapsed((c)=>({...c,[section.id]:!c[section.id]}))}
                      style={{ width:"100%", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.5rem 0.3rem 0.25rem", fontFamily:BEBAS, fontSize:"0.62rem", letterSpacing:"0.16em", textAlign:"left", color:section.color, marginTop:4 }}>
                      <span style={{ fontSize:9, transform:isOpen?"rotate(90deg)":"none", transition:"transform 0.2s", display:"inline-block", color:"#C8B888" }}>▸</span>
                      {section.label.toUpperCase()}
                    </button>
                    {isOpen && (
                      <div style={{ display:"flex", flexDirection:"column", gap:4, paddingBottom:4 }}>
                        {section.chips.map((chip) => {
                          const chipKey=`${section.id}-${chip.label}`;
                          const hov=hoveredChip===chipKey;
                          return (
                            <div key={chip.label} draggable={!chip.special}
                              onDragStart={(e)=>e.dataTransfer.setData("chipDef",JSON.stringify({type:chip.type,defaults:chip.defaults}))}
                              onClick={()=>addChipAt(chip)}
                              onMouseEnter={()=>setHoveredChip(chipKey)}
                              onMouseLeave={()=>setHoveredChip(null)}
                              style={{
                                background:hov?"#FFF5EE":"#FFFFFF",
                                border:`1.5px solid ${hov?section.color:"#EAE4DC"}`,
                                borderRadius:6, padding:"7px 8px 5px",
                                cursor:chip.special?"pointer":"grab",
                                transform:hov?"translateY(-2px)":"none",
                                transition:"transform 0.12s, border-color 0.12s, background 0.12s, box-shadow 0.12s",
                                boxShadow:hov?`0 4px 12px rgba(0,0,0,0.08)`:"0 1px 3px rgba(0,0,0,0.04)",
                                display:"flex", flexDirection:"column", alignItems:"center", gap:4, userSelect:"none",
                              }}>
                              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:30, width:"100%" }}>{chip.preview()}</div>
                              <div style={{ fontFamily:DM, fontSize:"0.63rem", color:hov?section.color:"#8A7868" }}>{chip.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            }
            <div style={{ height:8 }} />
          </div>

          {/* Players */}
          <div style={{ borderTop:`2px solid #F0E8D8`, padding:"0.55rem 0.8rem 0.6rem", background:"#FAFAF5" }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.58rem", letterSpacing:"0.15em", color:ORANGE, marginBottom:"0.35rem" }}>PLAYERS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.28rem" }}>
              {room.players.map((p)=>(
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, flexShrink:0, boxShadow:`0 0 5px ${p.color}88` }} />
                  <span style={{ fontFamily:DM, fontSize:"0.69rem", color:p.id===myPlayerId?"#1A1208":"#8A7868", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:p.id===myPlayerId?700:400 }}>
                    {p.name}{p.id===myPlayerId?" (you)":""}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:DM, fontSize:"0.55rem", color:"#C8B888", marginTop:"0.4rem", lineHeight:1.55 }}>
              R=Rect · T=Text<br />Drag corner to resize · Ctrl+D dupe
            </div>
          </div>
        </div>

        {/* ── CANVAS AREA ── */}
        <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", background:"#EDE5CC", padding:"3rem 5rem 2rem", backgroundImage:`repeating-linear-gradient(0deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 28px)` }}>
          <div style={{ position:"relative" }}>
            {/* Round watermark */}
            <div style={{ position:"absolute", top:-46, left:"50%", transform:"translateX(-50%)", fontFamily:BEBAS, fontSize:"1.8rem", color:"rgba(28,58,96,0.12)", letterSpacing:"0.35em", whiteSpace:"nowrap", pointerEvents:"none" }}>
              ROUND {room.round}
            </div>

            {/* Canvas frame border */}
            <div style={{ position:"absolute", inset:-8, border:`8px solid ${NAVY}`, boxShadow:`4px 6px 0 ${ORANGE}, 8px 12px 0 rgba(0,0,0,0.25)`, pointerEvents:"none", zIndex:0 }} />

            {/* Sticky notes */}
            <div style={{ position:"absolute", top:16, right:-156, width:136, background:"#F5EE7A", padding:"8px 10px 12px", transform:"rotate(3deg)", boxShadow:"3px 5px 12px rgba(0,0,0,0.25)", zIndex:5, pointerEvents:"none" }}>
              <div style={{ fontFamily:BEBAS, fontSize:"0.56rem", color:"#8a7700", letterSpacing:"0.1em", marginBottom:4 }}>BRIEF</div>
              <div style={{ fontFamily:DM, fontSize:"0.65rem", color:"#3a3000", lineHeight:1.4, wordBreak:"break-word" }}>{room.prompt}</div>
            </div>
            <div style={{ position:"absolute", top:172, right:-148, width:128, background:"#fff", padding:"8px 10px 12px", transform:"rotate(-2deg)", boxShadow:"3px 5px 12px rgba(0,0,0,0.25)", zIndex:5, pointerEvents:"none", border:`2px solid #E8E2D8` }}>
              <div style={{ fontFamily:BEBAS, fontSize:"0.56rem", color:ORANGE, letterSpacing:"0.1em", marginBottom:4 }}>SHORTCUTS</div>
              <div style={{ fontFamily:DM, fontSize:"0.59rem", color:"#555", lineHeight:1.7 }}>R — Rectangle<br />T — Text<br />Ctrl+D — Dupe<br />Ctrl+Z — Undo</div>
            </div>

            {/* Canvas */}
            <div ref={canvasRef} data-canvas="true"
              style={{ position:"relative", width:CANVAS_W, height:CANVAS_H, background:canvasMode==="mobile"?"#FFFFFF":canvasMode==="web"?"#FFFFFF":"#F8F4EE", flexShrink:0, zIndex:1, overflow:"hidden", outline:dragOver?`4px dashed ${TEAL}`:"none", borderRadius:canvasMode==="mobile"?24:0 }}
              onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
              onClick={handleCanvasClick}
              onDragOver={(e)=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleCanvasDrop}>

              {/* Mobile chrome */}
              {canvasMode==="mobile" && (<>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:30, background:"#ffffff", borderBottom:"1px solid rgba(0,0,0,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", zIndex:50, pointerEvents:"none" }}>
                  <span style={{ fontFamily:DM, fontWeight:700, fontSize:12, color:"#1a1a1a" }}>9:41</span>
                  <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                    <svg width="17" height="12" viewBox="0 0 17 12" fill="#1a1a1a"><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0.5" width="3" height="11.5" rx="1"/><rect x="13.5" y="0" width="3.5" height="12" rx="1"/></svg>
                    <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#1a1a1a" strokeOpacity="0.35"/><rect x="2" y="2" width="18" height="9" rx="2" fill="#1a1a1a"/></svg>
                  </div>
                </div>
                <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", width:130, height:5, background:"rgba(0,0,0,0.18)", borderRadius:100, zIndex:50, pointerEvents:"none" }} />
              </>)}

              {/* Web chrome */}
              {canvasMode==="web" && (
                <div style={{ position:"absolute", top:0, left:0, right:0, height:40, background:"#f0f0f0", borderBottom:"1px solid #ddd", display:"flex", alignItems:"center", gap:10, padding:"0 14px", zIndex:50, pointerEvents:"none" }}>
                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>{["#ff5f57","#febc2e","#28c840"].map((c)=><div key={c} style={{ width:11, height:11, borderRadius:"50%", background:c }} />)}</div>
                  <div style={{ flex:1, height:24, background:"#fff", borderRadius:100, border:"1px solid #ddd", display:"flex", alignItems:"center", padding:"0 12px", gap:6, maxWidth:480 }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="#bbb" strokeWidth="1.2"/><line x1="7.2" y1="7.2" x2="10" y2="10" stroke="#bbb" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span style={{ fontFamily:DM, fontSize:11, color:"#bbb" }}>https://yourapp.com</span>
                  </div>
                </div>
              )}

              {room.canvas.length===0 && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                  {canvasMode==="mobile"&&<div style={{ fontFamily:DM, fontSize:"0.72rem", color:"rgba(0,0,0,0.12)", marginBottom:8, letterSpacing:"0.08em" }}>MOBILE SCREEN · 375×812</div>}
                  {canvasMode==="web"&&<div style={{ fontFamily:DM, fontSize:"0.72rem", color:"rgba(0,0,0,0.12)", marginBottom:8, letterSpacing:"0.08em" }}>WEB BROWSER · 1440×900</div>}
                  <div style={{ fontFamily:DM, fontWeight:700, fontSize:"1.5rem", color:"rgba(0,0,0,0.07)", textAlign:"center", padding:"0 3rem", lineHeight:1.3 }}>{room.prompt}</div>
                  <div style={{ fontFamily:DM, fontSize:"0.8rem", color:"rgba(0,0,0,0.12)", marginTop:"0.75rem" }}>Drag from panel · R = Rect · T = Text</div>
                </div>
              )}

              {room.canvas.map((el) => {
                const lt=localTransforms[el.id];
                const displayEl=lt?{...el,x:lt.x,y:lt.y,width:lt.w,height:lt.h}:el;
                const isEditing=editingId===el.id;
                const outerStyle=getOuterStyle(displayEl);
                if(isEditing) return <div key={el.id} contentEditable suppressContentEditableWarning style={{...outerStyle,border:`2px solid ${TEAL}`,outline:"none",cursor:"text",userSelect:"text"}} onBlur={(e)=>commitEdit(el,e.currentTarget)} onKeyDown={(e)=>{e.stopPropagation();if(e.key==="Escape"){e.preventDefault();commitEdit(el,e.currentTarget);}}}>{el.content}</div>;
                return <div key={el.id} style={outerStyle} onMouseDown={(e)=>handleElementMouseDown(e,el)} onDoubleClick={(e)=>handleElementDoubleClick(e,el)}>{renderCanvasContent(displayEl)}</div>;
              })}

              {/* Selection overlay */}
              {selectedEl&&selectedLT&&!editingId&&(()=>{
                const H=9,ex=selectedLT.x,ey=selectedLT.y,ew=selectedLT.w,eh=selectedLT.h;
                const CURSORS=["nwse-resize","nesw-resize","nesw-resize","nwse-resize"] as const;
                const handles:[number,number,0|1|2|3][]=[[ex-H/2,ey-H/2,0],[ex+ew-H/2,ey-H/2,1],[ex-H/2,ey+eh-H/2,2],[ex+ew-H/2,ey+eh-H/2,3]];
                return (<>
                  <div style={{ position:"absolute", left:ex-2, top:ey-2, width:ew+4, height:eh+4, border:`2px solid ${TEAL}`, pointerEvents:"none", zIndex:900 }} />
                  <div style={{ position:"absolute", left:ex, top:ey+eh+6, fontFamily:DM, fontSize:10, color:TEAL, background:"rgba(255,255,255,0.9)", border:`1px solid ${TEAL}`, padding:"1px 5px", borderRadius:4, pointerEvents:"none", zIndex:901, whiteSpace:"nowrap" }}>
                    {Math.round(selectedLT.w)} × {Math.round(selectedLT.h)}
                  </div>
                  {handles.map(([hx,hy,idx])=>(
                    <div key={idx} style={{ position:"absolute", left:hx, top:hy, width:H, height:H, background:"#fff", border:`2px solid ${TEAL}`, zIndex:902, cursor:CURSORS[idx], pointerEvents:"all" }} onMouseDown={(e)=>handleCornerMouseDown(e,selectedEl,idx)} />
                  ))}
                  {/* Toolbar — white */}
                  <div style={{ position:"absolute", left:toolbarX, top:toolbarY, zIndex:950, background:"#FFFFFF", border:`2px solid #E8E2D8`, borderRadius:10, padding:"8px 10px", display:"flex", flexDirection:"column", gap:7, boxShadow:"0 8px 28px rgba(0,0,0,0.14)", minWidth:320, pointerEvents:"all" }}
                    onMouseDown={(e)=>e.stopPropagation()}>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <LToolBtn title="Delete" onClick={()=>{onDelete(selectedEl.id);setSelectedId(null);}}>🗑️</LToolBtn>
                      <LToolBtn title="Bring Forward" onClick={()=>onUpdate(selectedEl.id,{zIndex:selectedEl.zIndex+1})}>⬆️</LToolBtn>
                      <LToolBtn title="Send Backward" onClick={()=>onUpdate(selectedEl.id,{zIndex:Math.max(0,selectedEl.zIndex-1)})}>⬇️</LToolBtn>
                      <div style={{ position:"relative" }}>
                        <button title="Fill Color" onClick={()=>setShowColorPicker((v)=>!v)}
                          style={{ width:26, height:26, borderRadius:"50%", background:selectedEl.fill==="transparent"?"linear-gradient(135deg,#f55,#5af,#5f5)":selectedEl.fill, border:`2px solid #E8E2D8`, cursor:"pointer", flexShrink:0 }} />
                        {showColorPicker && (
                          <div style={{ position:"absolute", bottom:32, left:0, background:"#FFFFFF", border:`2px solid #E8E2D8`, borderRadius:10, padding:8, display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:4, zIndex:960, boxShadow:"0 8px 28px rgba(0,0,0,0.18)" }}>
                            {PALETTE.map((c)=>(
                              <button key={c} onClick={()=>{onUpdate(selectedEl.id,{fill:c});setShowColorPicker(false);}}
                                style={{ width:22, height:22, borderRadius:"50%", background:c, border:selectedEl.fill===c?`2.5px solid ${TEAL}`:`1.5px solid #E8E2D8`, cursor:"pointer", flexShrink:0 }} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ flex:1 }} />
                      <LToolBtn title="Deselect (Esc)" onClick={()=>{setSelectedId(null);setShowColorPicker(false);}}>✕</LToolBtn>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5, borderTop:`1px solid #F0E8D8`, paddingTop:7 }}>
                      <span style={{ fontFamily:DM, fontSize:"0.6rem", color:"#C8B888", flexShrink:0 }}>W</span>
                      <input type="number" value={Math.round(selectedLT.w)} min={MIN_W} max={CANVAS_W} onChange={(e)=>onUpdate(selectedEl.id,{width:Number(e.target.value)})} style={inputStyle} />
                      <span style={{ fontFamily:DM, fontSize:"0.6rem", color:"#C8B888", flexShrink:0 }}>H</span>
                      <input type="number" value={Math.round(selectedLT.h)} min={MIN_H} max={CANVAS_H} onChange={(e)=>onUpdate(selectedEl.id,{height:Number(e.target.value)})} style={inputStyle} />
                      <span style={{ fontFamily:DM, fontSize:"0.6rem", color:"#C8B888", flexShrink:0 }}>R</span>
                      <input type="number" value={selectedEl.cornerRadius??0} min={0} max={100} onChange={(e)=>onUpdate(selectedEl.id,{cornerRadius:Number(e.target.value)})} title="Corner Radius" style={inputStyle} />
                      <span style={{ fontFamily:DM, fontSize:"0.6rem", color:"#C8B888", flexShrink:0 }}>%</span>
                      <input type="number" value={Math.round((selectedEl.opacity??1)*100)} min={0} max={100} onChange={(e)=>onUpdate(selectedEl.id,{opacity:Number(e.target.value)/100})} title="Opacity" style={inputStyle} />
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:3, borderTop:`1px solid #F0E8D8`, paddingTop:7 }}>
                      <span style={{ fontFamily:DM, fontSize:"0.58rem", color:"#C8B888", marginRight:2, flexShrink:0 }}>Align</span>
                      {(([["⊢","lx","Left"],["↔","cx","Center H"],["⊣","rx","Right"],["⊤","ty","Top"],["↕","cy","Center V"],["⊥","by","Bottom"]] as [string,string,string][])).map(([icon,axis,title])=>(
                        <LToolBtn key={axis} title={title} onClick={()=>alignEl(axis as "lx"|"cx"|"rx"|"ty"|"cy"|"by")}>
                          <span style={{ fontSize:14, lineHeight:1 }}>{icon}</span>
                        </LToolBtn>
                      ))}
                    </div>
                    {isTextEl && (
                      <div style={{ display:"flex", alignItems:"center", gap:4, borderTop:`1px solid #F0E8D8`, paddingTop:7 }}>
                        <select value={selectedEl.fontSize??14} onChange={(e)=>onUpdate(selectedEl.id,{fontSize:Number(e.target.value)})}
                          style={{ background:"#FAFAF5", border:`1px solid #E8E2D8`, color:"#1A1208", borderRadius:5, padding:"2px 4px", fontFamily:DM, fontSize:"0.7rem", cursor:"pointer" }}>
                          {FONT_SIZES.map((s)=><option key={s} value={s}>{s}px</option>)}
                        </select>
                        <div style={{ display:"flex", gap:2 }}>
                          {(["left","center","right"] as const).map((a,i)=>(
                            <LToolBtn key={a} title={`Align ${a}`} onClick={()=>onUpdate(selectedEl.id,{textAlign:a} as Partial<CanvasElement>)}>
                              {["≡","☰","≣"][i]}
                            </LToolBtn>
                          ))}
                        </div>
                        <LToolBtn title="Bold" onClick={()=>onUpdate(selectedEl.id,{fontWeight:selectedEl.fontWeight===800?400:800} as Partial<CanvasElement>)}>
                          <b>B</b>
                        </LToolBtn>
                      </div>
                    )}
                  </div>
                </>);
              })()}

              {/* Remote cursors */}
              {Object.values(remoteCursors).map((cursor)=>{
                const player=room.players.find((p)=>p.id===cursor.playerId);
                if(!player) return null;
                const isVisible=Date.now()-cursor.lastSeen<3000;
                return (
                  <div key={cursor.playerId} style={{ position:"absolute", left:cursor.x*CANVAS_W, top:cursor.y*CANVAS_H, pointerEvents:"none", zIndex:999, opacity:isVisible?1:0, transition:"left 0.05s linear, top 0.05s linear, opacity 0.5s" }}>
                    <svg width="16" height="20" viewBox="0 0 16 20"><path d="M0 0 L0 14 L4 11 L6 18 L8 17 L6 10 L11 10 Z" fill={player.color} stroke="rgba(0,0,0,0.3)" strokeWidth="1" /></svg>
                    <div style={{ position:"absolute", top:18, left:10, background:player.color, color:"#fff", fontSize:10, padding:"2px 6px", borderRadius:10, whiteSpace:"nowrap", fontFamily:DM, fontWeight:600, boxShadow:"0 2px 8px rgba(0,0,0,0.25)" }}>
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

const inputStyle: React.CSSProperties = {
  width:44, background:"#FAF8F5", border:`1px solid #E8E2D8`, color:"#1A1208",
  borderRadius:5, padding:"2px 4px", fontFamily:DM, fontSize:"0.68rem",
  textAlign:"center", outline:"none",
};

function LToolBtn({ children, onClick, title }: { children:React.ReactNode; onClick:()=>void; title?:string }) {
  return (
    <button title={title} onClick={onClick}
      style={{ background:"#FAF8F5", border:`1px solid #E8E2D8`, color:"#4A3C22", borderRadius:6, width:28, height:28, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}
      onMouseEnter={(e)=>(e.currentTarget.style.background="#FFF0E8")}
      onMouseLeave={(e)=>(e.currentTarget.style.background="#FAF8F5")}>
      {children}
    </button>
  );
}
