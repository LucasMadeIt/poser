import { useState, useRef, useCallback, useEffect } from "react";
import type { Socket } from "socket.io-client";
import type { RoomState, CanvasElement } from "../types/game";
import { Timer } from "../components/Timer";
import type { RemoteCursor } from "../hooks/useGame";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { PlayerAvatar } from "../components/PlayerAvatar";

type Props = {
  room: RoomState;
  myPlayerId: string;
  amIHost: boolean;
  onAdd: (el: Omit<CanvasElement, "id" | "zIndex" | "ownerId">) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onDone: () => void;
  doneVotes: string[];
  remoteCursors: Record<string, RemoteCursor>;
  emitCursorMove: (x: number, y: number) => void;
  socket: Socket;
  roomId: string;
};

const CANVAS_W = 900;
const CANVAS_H = 560;
const PANEL_W  = 220;
const SIDEBAR_W = 256;
const BEBAS    = "'Bebas Neue', sans-serif";
const DM       = "'DM Sans', sans-serif";

const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";

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
  const mobileHits = ["mobile","phone","ios","android","iphone","onboarding","splash","smartphone","app screen","instagram","story","twitter","snap"].filter((k)=>p.includes(k)).length;
  const webHits    = ["website","landing page","dashboard","desktop","saas","homepage","blog","checkout","portfolio","newsletter","hero section","pitch deck","banner","404","profile page","web page","web app","e-commerce"].filter((k)=>p.includes(k)).length;
  const mobileScore = mobileHits + (p.includes("app")&&!p.includes("web app")?0.5:0);
  const webScore    = webHits   + (p.includes("page")&&webHits===0?0.5:0);
  if (mobileScore > webScore) return "mobile";
  if (webScore > mobileScore) return "web";
  return "default";
}

type ChipDef = {
  label: string;
  type: CanvasElement["type"];
  defaults: Partial<Omit<CanvasElement,"id"|"zIndex"|"ownerId">>;
  preview: () => React.ReactNode;
  special?: "image";
};
type SectionDef = { id: string; label: string; color: string; defaultOpen: boolean; chips: ChipDef[] };

type LocalTransform = { x: number; y: number; w: number; h: number };

const SECTIONS: SectionDef[] = [
  {
    id:"media", label:"Media", color:"#6A1A8A", defaultOpen:true,
    chips:[
      { label:"Upload Image", type:"image", special:"image", defaults:{ width:300, height:200, fill:"#f0e8d8" }, preview:()=><div style={{ width:"100%", height:36, background:"linear-gradient(135deg,#f0e8d8,#e8ddc8)", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:2 }}><span style={{ fontSize:18 }}>🖼️</span><span style={{ fontFamily:DM, fontSize:7, color:"#888" }}>Click to upload</span></div> },
      { label:"Image Block",  type:"image", defaults:{ width:260, height:180, fill:"#e8e8e8" }, preview:()=><div style={{ width:"100%", height:32, background:"#e8e8e8", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><span style={{ fontSize:16 }}>🖼</span><span style={{ fontFamily:DM, fontSize:8, color:"#aaa" }}>Image</span></div> },
      { label:"Video Block",  type:"video", defaults:{ width:320, height:200, fill:"#1a1a1a" }, preview:()=><div style={{ width:"100%", height:32, background:"#1a1a1a", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><div style={{ width:0, height:0, borderTop:"7px solid transparent", borderBottom:"7px solid transparent", borderLeft:"12px solid #fff" }} /><span style={{ fontFamily:DM, fontSize:8, color:"#888" }}>Video</span></div> },
    ],
  },
  {
    id:"shape", label:"Shapes & Text", color:ORANGE, defaultOpen:true,
    chips:[
      { label:"Heading",   type:"heading", defaults:{ width:300, height:56, content:"Heading",        fill:"#1a1a1a", fontSize:36 }, preview:()=><span style={{ fontFamily:DM, fontWeight:800, fontSize:16, color:"#1a1a1a" }}>Heading</span> },
      { label:"Body Text", type:"text",    defaults:{ width:240, height:72, content:"Body text here.", fill:"#555",    fontSize:14 }, preview:()=><div style={{ display:"flex", flexDirection:"column", gap:3, width:"100%", padding:"0 4px" }}>{[100,82,65].map((w,i)=><div key={i} style={{ height:2.5, background:"#ccc", borderRadius:2, width:`${w}%` }} />)}</div> },
      { label:"Caption",   type:"text",    defaults:{ width:180, height:24, content:"Small caption",  fill:"#888",    fontSize:11 }, preview:()=><div style={{ height:2, background:"#ccc", borderRadius:1, width:"55%", margin:"0 auto" }} /> },
      { label:"Rectangle", type:"rect",    defaults:{ width:200, height:100, fill:"#e8e8e8", stroke:"#ccc" }, preview:()=><div style={{ width:"70%", height:24, background:"#e0e0e0", border:"1.5px solid #ccc", borderRadius:3 }} /> },
      { label:"Oval",      type:"circle",  defaults:{ width:80,  height:80,  fill:"#e0e0e0" }, preview:()=><div style={{ width:28, height:28, borderRadius:"50%", background:"#e0e0e0", border:"1.5px solid #ccc" }} /> },
      { label:"Divider",   type:"divider", defaults:{ width:400, height:2,   fill:"#ddd" }, preview:()=><div style={{ width:"100%", height:2, background:"#ccc", borderRadius:1 }} /> },
    ],
  },
  {
    id:"inputs", label:"Inputs & Controls", color:NAVY, defaultOpen:false,
    chips:[
      { label:"Primary Btn",  type:"button",    defaults:{ width:140, height:42, content:"Continue", fill:"#1a1a1a", fontSize:14, cornerRadius:8 }, preview:()=><div style={{ background:"#1a1a1a", color:"#fff", fontFamily:DM, fontWeight:600, fontSize:11, padding:"4px 14px", borderRadius:6 }}>Continue</div> },
      { label:"Ghost Btn",    type:"button",    defaults:{ width:140, height:42, content:"Cancel", fill:"transparent", stroke:"#888", fontSize:14, cornerRadius:8 }, preview:()=><div style={{ border:"1.5px solid #aaa", color:"#555", fontFamily:DM, fontWeight:600, fontSize:11, padding:"3px 12px", borderRadius:6 }}>Cancel</div> },
      { label:"Text Input",   type:"input",     defaults:{ width:220, height:44, fill:"#ffffff", cornerRadius:8 }, preview:()=><div style={{ width:"100%", height:22, border:"1.5px solid #ccc", borderRadius:5, display:"flex", alignItems:"center", padding:"0 6px", gap:3 }}><span style={{ fontFamily:DM, fontSize:9, color:"#aaa" }}>Enter text...</span></div> },
      { label:"Search Bar",   type:"searchbar", defaults:{ width:240, height:44, fill:"#f0f0f0", cornerRadius:100 }, preview:()=><div style={{ width:"100%", height:22, background:"#f0f0f0", borderRadius:100, display:"flex", alignItems:"center", padding:"0 8px", gap:4 }}><span style={{ fontSize:9 }}>🔍</span><span style={{ fontFamily:DM, fontSize:9, color:"#aaa" }}>Search...</span></div> },
      { label:"Dropdown",     type:"dropdown",  defaults:{ width:200, height:44, content:"Select option", fill:"#ffffff", cornerRadius:8 }, preview:()=><div style={{ width:"100%", height:22, border:"1.5px solid #ccc", borderRadius:5, display:"flex", alignItems:"center", padding:"0 6px", justifyContent:"space-between" }}><span style={{ fontFamily:DM, fontSize:9, color:"#aaa" }}>Select...</span><span style={{ fontSize:8, color:"#aaa" }}>⌄</span></div> },
      { label:"Checkbox",     type:"checkbox",  defaults:{ width:140, height:28, content:"Option", fill:"#ffffff" }, preview:()=><div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:12, height:12, border:"1.5px solid #ccc", borderRadius:2, background:"#fff" }} /><div style={{ height:2.5, background:"#ccc", width:36, borderRadius:2 }} /></div> },
      { label:"Toggle",       type:"toggle",    defaults:{ width:80, height:32, fill:"#2A8080" }, preview:()=><div style={{ width:38, height:20, background:"#2A8080", borderRadius:100, position:"relative" }}><div style={{ position:"absolute", top:3, right:3, width:14, height:14, background:"#fff", borderRadius:"50%" }} /></div> },
    ],
  },
  {
    id:"nav", label:"Navigation", color:TEAL, defaultOpen:false,
    chips:[
      { label:"Nav Bar",    type:"navbar",     defaults:{ width:600, height:60, fill:"#ffffff" }, preview:()=><div style={{ width:"100%", height:20, background:"#f0f0f0", borderRadius:3, display:"flex", alignItems:"center", padding:"0 6px", gap:8 }}><div style={{ width:24, height:6, background:"#ccc", borderRadius:2 }} /><div style={{ flex:1 }} />{[0,1,2].map(i=><div key={i} style={{ width:16, height:4, background:"#ddd", borderRadius:2 }} />)}</div> },
      { label:"Tab Bar",    type:"tabbar",     defaults:{ width:375, height:64, fill:"#ffffff" }, preview:()=><div style={{ width:"100%", height:20, background:"#f5f5f5", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"space-around" }}>{["🏠","🔍","➕","❤️","👤"].map((ic,i)=><span key={i} style={{ fontSize:i===0?11:9, opacity:i===0?1:0.35 }}>{ic}</span>)}</div> },
      { label:"Sidebar",    type:"sidebar",    defaults:{ width:200, height:320, fill:"#f7f7f7" }, preview:()=><div style={{ width:"100%", height:32, border:"1.5px solid #e0e0e0", borderRadius:3, overflow:"hidden", display:"flex" }}><div style={{ width:"40%", background:"#f0f0f0", display:"flex", flexDirection:"column", gap:3, padding:3 }}>{[0,1,2].map(i=><div key={i} style={{ height:3, background:"#ddd", borderRadius:2, width:"80%" }} />)}</div><div style={{ flex:1, background:"#fff" }} /></div> },
      { label:"Breadcrumb", type:"breadcrumb", defaults:{ width:260, height:28, content:"Home / Page / Current", fill:"#555" }, preview:()=><div style={{ display:"flex", gap:3, alignItems:"center" }}>{["Home","›","Page","›","Here"].map((t,i)=><span key={i} style={{ fontSize:8, color:i===4?"#333":i%2===0?"#2A8080":"#ccc", fontFamily:DM }}>{t}</span>)}</div> },
    ],
  },
  {
    id:"content", label:"Content", color:MUSTARD, defaultOpen:false,
    chips:[
      { label:"Card",       type:"card",     defaults:{ width:240, height:210, fill:"#ffffff", cornerRadius:12 }, preview:()=><div style={{ width:"100%", border:"1.5px solid #e8e8e8", borderRadius:6, overflow:"hidden" }}><div style={{ height:18, background:"#e8e8e8", width:"100%" }} /><div style={{ padding:"4px 6px", display:"flex", flexDirection:"column", gap:2 }}>{[80,60].map((w,i)=><div key={i} style={{ height:2.5, background:i===0?"#bbb":"#ddd", borderRadius:2, width:`${w}%` }} />)}</div></div> },
      { label:"List Item",  type:"listitem", defaults:{ width:340, height:64, content:"List Item", fill:"#ffffff" }, preview:()=><div style={{ width:"100%", height:22, border:"1px solid #e8e8e8", borderRadius:3, display:"flex", alignItems:"center", gap:5, padding:"0 5px" }}><div style={{ width:14, height:14, borderRadius:"50%", background:"#e0e0e0", flexShrink:0 }} /><div style={{ flex:1, height:2.5, background:"#e0e0e0", borderRadius:2 }} /></div> },
      { label:"Avatar",     type:"circle",   defaults:{ width:52, height:52, fill:"#9B59B6" }, preview:()=><div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#9B59B6,#E87DBB)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:10, color:"#fff", fontFamily:DM, fontWeight:700 }}>JD</span></div> },
      { label:"Badge",      type:"badge",    defaults:{ width:64, height:26, content:"New", fill:ORANGE, cornerRadius:100 }, preview:()=><div style={{ background:ORANGE, borderRadius:100, padding:"2px 8px" }}><span style={{ fontFamily:DM, fontSize:9, fontWeight:700, color:"#fff" }}>New</span></div> },
      { label:"Chip / Tag", type:"tag",      defaults:{ width:80, height:28, content:"Design", fill:"#f0f0f0", cornerRadius:100 }, preview:()=><div style={{ background:"#f0f0f0", border:"1px solid #e0e0e0", borderRadius:100, padding:"2px 8px" }}><span style={{ fontFamily:DM, fontSize:9, color:"#666" }}>Design</span></div> },
    ],
  },
  {
    id:"feedback", label:"Feedback & Overlays", color:"#8B1A10", defaultOpen:false,
    chips:[
      { label:"Progress",     type:"progress", defaults:{ width:260, height:14, fill:TEAL, cornerRadius:100 }, preview:()=><div style={{ width:"100%", height:8, background:"#e8e8e8", borderRadius:100, overflow:"hidden" }}><div style={{ width:"65%", height:"100%", background:TEAL, borderRadius:100 }} /></div> },
      { label:"Alert Banner", type:"alert",    defaults:{ width:320, height:52, content:"Something needs attention", fill:"#fffbe6", cornerRadius:6 }, preview:()=><div style={{ width:"100%", height:20, background:"#fffbe6", border:"1px solid #ffe58f", borderRadius:4, display:"flex", alignItems:"center", gap:4, padding:"0 5px" }}><span style={{ fontSize:9 }}>⚠️</span><div style={{ height:2.5, background:"#ffe58f", borderRadius:2, flex:1 }} /></div> },
      { label:"Toast",        type:"toast",    defaults:{ width:240, height:48, content:"Saved successfully", fill:"#1a1a1a", cornerRadius:100 }, preview:()=><div style={{ width:"100%", height:20, background:"#1a1a1a", borderRadius:100, display:"flex", alignItems:"center", gap:4, padding:"0 8px" }}><span style={{ fontSize:8 }}>✅</span><div style={{ height:2.5, background:"#444", borderRadius:2, flex:1 }} /></div> },
      { label:"Modal",        type:"modal",    defaults:{ width:340, height:240, fill:"#ffffff", cornerRadius:12 }, preview:()=><div style={{ width:"100%", position:"relative" }}><div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.25)", borderRadius:4 }} /><div style={{ border:"1.5px solid #e8e8e8", borderRadius:5, padding:"4px 6px", background:"#fff", position:"relative" }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><div style={{ height:3, background:"#ccc", width:"40%", borderRadius:2 }} /><span style={{ fontSize:7, color:"#aaa" }}>✕</span></div>{[100,70].map((w,i)=><div key={i} style={{ height:2, background:"#e0e0e0", width:`${w}%`, borderRadius:2, marginBottom:2 }} />)}</div></div> },
      { label:"FAB",          type:"fab",      defaults:{ width:56, height:56, fill:"#1a1a1a", cornerRadius:100 }, preview:()=><div style={{ width:28, height:28, borderRadius:"50%", background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:14, color:"#fff" }}>+</span></div> },
    ],
  },
];

// ─── Smooth path builder (quadratic bezier) ──────────────────────────────────
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
}

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
      return <div style={{ width:"100%", height:"100%", background:c||"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center", gap:8, position:"relative" }}>
        <div style={{ width:0, height:0, borderTop:"18px solid transparent", borderBottom:"18px solid transparent", borderLeft:"30px solid rgba(255,255,255,0.75)" }} />
        <div style={{ position:"absolute", bottom:10, left:0, right:0, height:4, background:"rgba(255,255,255,0.15)", margin:"0 12px", borderRadius:2 }}><div style={{ width:"35%", height:"100%", background:ORANGE, borderRadius:2 }} /></div>
      </div>;
    case "input":
      return <div style={{ width:"100%", height:"100%", background:"#fff", border:"1.5px solid #ccc", borderRadius:r||8, display:"flex", alignItems:"center", padding:"0 12px", gap:4, boxSizing:"border-box" }}><span style={{ fontFamily:DM, fontSize:13, color:"#bbb", flex:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{el.content||"Enter text here..."}</span></div>;
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
      return <div style={{ width:"100%", height:"100%", background:c, border:"1px solid #eee", borderRadius:r||12, overflow:"hidden", display:"flex", flexDirection:"column", boxSizing:"border-box" }}><div style={{ height:"42%", background:"#e8e8e8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span style={{ fontSize:28, color:"#ccc" }}>🖼</span></div><div style={{ flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", gap:6 }}><div style={{ fontFamily:DM, fontWeight:700, fontSize:15, color:"#1a1a1a" }}>{el.content||"Card Title"}</div><div style={{ fontFamily:DM, fontSize:12, color:"#aaa", lineHeight:1.4 }}>Short description.</div><div style={{ marginTop:"auto", height:32, background:"#1a1a1a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:DM, fontSize:13, color:"#fff", fontWeight:600 }}>Get Started</span></div></div></div>;
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
      return <div style={{ width:"100%", height:"100%", border:"6px solid #2a2a2a", borderRadius:32, background:"#1a1a1a", position:"relative", boxSizing:"border-box" }}><div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"38%", height:22, background:"#1a1a1a", borderRadius:"0 0 12px 12px", zIndex:2 }} /><div style={{ position:"absolute", inset:0, borderRadius:26, overflow:"hidden" }}><div style={{ position:"absolute", inset:0, background:c||"#F8F4EE", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:DM, fontSize:11, color:"#ccc" }}>Screen</span></div></div><div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", width:"32%", height:4, background:"#3a3a3a", borderRadius:4 }} /></div>;
    case "frameweb":
      return <div style={{ width:"100%", height:"100%", border:"1.5px solid #ccc", borderRadius:r||8, overflow:"hidden", background:"#fff", display:"flex", flexDirection:"column", boxSizing:"border-box" }}><div style={{ height:32, background:"#f0f0f0", borderBottom:"1px solid #ddd", display:"flex", alignItems:"center", gap:8, padding:"0 10px", flexShrink:0 }}><div style={{ display:"flex", gap:4 }}>{["#f56","#fa3","#2c2"].map(cc=><div key={cc} style={{ width:9, height:9, borderRadius:"50%", background:cc }} />)}</div><div style={{ flex:1, height:18, background:"#fff", borderRadius:100, border:"1px solid #ddd", display:"flex", alignItems:"center", padding:"0 8px" }}><span style={{ fontFamily:DM, fontSize:10, color:"#bbb" }}>https://yourapp.com</span></div></div><div style={{ flex:1, background:c||"#F8F4EE", padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>{[70,50,35].map((w,i)=><div key={i} style={{ height:i===0?20:8, background:"rgba(0,0,0,0.08)", borderRadius:4, width:`${w}%` }} />)}</div></div>;
    case "freedraw": {
      const pts = el.points ?? [];
      if (pts.length < 2) return null;
      const minX = pts.reduce((m, p) => Math.min(m, p.x), Infinity);
      const minY = pts.reduce((m, p) => Math.min(m, p.y), Infinity);
      const rel  = pts.map(p => ({ x: p.x - minX, y: p.y - minY }));
      return (
        <svg style={{ position:"absolute", inset:0, overflow:"visible", pointerEvents:"none" }} width={el.width} height={el.height}>
          <path d={smoothPath(rel)} stroke={el.fill} strokeWidth={el.strokeWidth ?? 3}
            fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity ?? 1}/>
        </svg>
      );
    }
    case "triangle": {
      const verts = el.vertices ?? [];
      if (verts.length < 3) return null;
      const minX = verts.reduce((m, v) => Math.min(m, v.x), Infinity);
      const minY = verts.reduce((m, v) => Math.min(m, v.y), Infinity);
      const pts  = verts.map(v => `${v.x - minX},${v.y - minY}`).join(" ");
      return (
        <svg style={{ position:"absolute", inset:0, overflow:"visible" }} width={el.width} height={el.height}>
          <polygon points={pts} fill={el.fill} stroke={el.stroke ?? "none"} strokeWidth="2" opacity={el.opacity ?? 1}/>
        </svg>
      );
    }
    case "rect":    return null;
    case "circle":  return null;
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
    case "rect":    return { ...base, background:el.fill, border:el.stroke?`2px solid ${el.stroke}`:"none", borderRadius:el.cornerRadius??0 };
    case "circle":  return { ...base, background:el.fill, borderRadius:"50%", border:el.stroke?`2px solid ${el.stroke}`:"none" };
    case "divider": return { ...base, height:Math.max(el.height,2), background:el.fill, borderRadius:el.cornerRadius??100 };
    case "heading": return { ...base, display:"flex", alignItems:"center", overflow:"hidden" };
    case "text":    return { ...base, display:"flex", alignItems:"flex-start", overflow:"hidden" };
    case "label":   return { ...base, background:el.fill, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:el.cornerRadius??2 };
    case "button":  { const ghost=el.fill==="transparent"; return { ...base, background:el.fill, border:el.stroke?`2px solid ${el.stroke}`:"none", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:el.cornerRadius??6, color:ghost?(el.stroke??"#222"):"#fff" }; }
    case "image":   return { ...base, background:el.fill, borderRadius:el.cornerRadius??4 };
    case "video":   return { ...base, borderRadius:el.cornerRadius??4, overflow:"hidden" };
    case "freedraw":  return { ...base, background:"transparent", overflow:"visible" };
    case "triangle":  return { ...base, background:"transparent", overflow:"visible" };
    default:        return base;
  }
}

// ─── Properties sidebar ──────────────────────────────────────────────────────
function PropertiesSidebar({
  el, lt, isText,
  onUpdate, onDelete, onClose,
}: {
  el: CanvasElement;
  lt: { x:number; y:number; w:number; h:number };
  isText: boolean;
  onUpdate: (id: string, u: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const labelStyle: React.CSSProperties = { fontFamily:BEBAS, fontSize:"0.6rem", letterSpacing:"0.18em", color:ORANGE, marginBottom:4, display:"block" };
  const inputStyle: React.CSSProperties = { width:"100%", background:"#FAFAF5", border:`1.5px solid #E8E2D8`, color:"#1A1208", borderRadius:5, padding:"4px 7px", fontFamily:DM, fontSize:"0.78rem", outline:"none", boxSizing:"border-box" };

  function alignEl(axis: "lx"|"cx"|"rx"|"ty"|"cy"|"by") {
    let nx=lt.x, ny=lt.y;
    if (axis==="lx") nx=0; if (axis==="cx") nx=Math.round((CANVAS_W-lt.w)/2); if (axis==="rx") nx=CANVAS_W-lt.w;
    if (axis==="ty") ny=0; if (axis==="cy") ny=Math.round((CANVAS_H-lt.h)/2); if (axis==="by") ny=CANVAS_H-lt.h;
    onUpdate(el.id, { x:nx, y:ny });
  }

  const typeName = el.type.charAt(0).toUpperCase() + el.type.slice(1);

  return (
    <div style={{ flex:1, background:"#FAFAF5", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ padding:"0.75rem 0.9rem 0.6rem", background:"#FFFFFF", borderBottom:`2px solid #F0E8D8`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:BEBAS, fontSize:"0.58rem", letterSpacing:"0.2em", color:"#C8B888", lineHeight:1 }}>SELECTED</div>
          <div style={{ fontFamily:BEBAS, fontSize:"1rem", color:NAVY, letterSpacing:"0.08em", lineHeight:1.2 }}>{typeName}</div>
        </div>
        <button onClick={onClose}
          style={{ background:"none", border:`1.5px solid #E8E2D8`, borderRadius:5, width:26, height:26, cursor:"pointer", color:"#8A7868", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>
          ✕
        </button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0.8rem 0.9rem", display:"flex", flexDirection:"column", gap:"1rem" }}>

        {/* ── Fill color ── */}
        <div>
          <span style={labelStyle}>FILL COLOR</span>
          <div style={{ position:"relative" }}>
            <button onClick={()=>setShowPicker(v=>!v)}
              style={{ width:"100%", height:34, background:el.fill==="transparent"?"linear-gradient(135deg,#f55,#5af,#5f5)":el.fill, border:`2px solid ${el.fill==="#ffffff"?"#E8E2D8":el.fill}`, borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", padding:"0 10px", gap:8 }}>
              <span style={{ fontFamily:DM, fontSize:"0.72rem", color:el.fill==="transparent"||el.fill==="white"?"#555":"rgba(255,255,255,0.8)", fontWeight:600, textShadow:"0 1px 2px rgba(0,0,0,0.25)" }}>
                {el.fill==="transparent"?"Transparent":el.fill}
              </span>
            </button>
            {showPicker && (
              <div style={{ position:"absolute", top:38, left:0, right:0, background:"#FFFFFF", border:`2px solid #E8E2D8`, borderRadius:8, padding:10, display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:5, zIndex:50, boxShadow:"0 8px 24px rgba(0,0,0,0.14)" }}>
                {PALETTE.map(color=>(
                  <button key={color} onClick={()=>{ onUpdate(el.id,{fill:color}); setShowPicker(false); }}
                    style={{ width:"100%", aspectRatio:"1", borderRadius:"50%", background:color, border:el.fill===color?`2.5px solid ${TEAL}`:`1.5px solid #E8E2D8`, cursor:"pointer" }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Position & size ── */}
        <div>
          <span style={labelStyle}>POSITION & SIZE</span>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[["X", "x", lt.x], ["Y", "y", lt.y], ["W", "width", lt.w], ["H", "height", lt.h]].map(([lbl,key,val])=>(
              <div key={key as string}>
                <div style={{ fontFamily:DM, fontSize:"0.6rem", color:"#C8B888", marginBottom:2 }}>{lbl}</div>
                <input type="number" value={Math.round(val as number)}
                  onChange={(e)=>onUpdate(el.id,{[key as string]:Number(e.target.value)})}
                  style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Corner radius + Opacity ── */}
        <div>
          <span style={labelStyle}>STYLE</span>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            <div>
              <div style={{ fontFamily:DM, fontSize:"0.6rem", color:"#C8B888", marginBottom:2 }}>Corner radius</div>
              <input type="number" value={el.cornerRadius??0} min={0} max={200}
                onChange={(e)=>onUpdate(el.id,{cornerRadius:Number(e.target.value)})}
                style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily:DM, fontSize:"0.6rem", color:"#C8B888", marginBottom:2 }}>Opacity %</div>
              <input type="number" value={Math.round((el.opacity??1)*100)} min={0} max={100}
                onChange={(e)=>onUpdate(el.id,{opacity:Number(e.target.value)/100})}
                style={inputStyle} />
            </div>
          </div>
        </div>


        {/* ── Typography (text elements) ── */}
        {isText && (
          <div>
            <span style={labelStyle}>TYPOGRAPHY</span>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div>
                <div style={{ fontFamily:DM, fontSize:"0.6rem", color:"#C8B888", marginBottom:2 }}>Font size</div>
                <select value={el.fontSize??14} onChange={(e)=>onUpdate(el.id,{fontSize:Number(e.target.value)})}
                  style={{ ...inputStyle, cursor:"pointer" }}>
                  {FONT_SIZES.map(s=><option key={s} value={s}>{s}px</option>)}
                </select>
              </div>
              <div style={{ display:"flex", gap:5 }}>
                {(["left","center","right"] as const).map((a,i)=>(
                  <button key={a} title={`Align ${a}`} onClick={()=>onUpdate(el.id,{textAlign:a} as Partial<CanvasElement>)}
                    style={{ flex:1, height:30, background:el.textAlign===a?"#FFF0E8":"#FFFFFF", border:`1.5px solid ${el.textAlign===a?ORANGE:"#E8E2D8"}`, borderRadius:5, cursor:"pointer", fontFamily:DM, fontSize:13, color:"#4A3C22" }}>
                    {["≡","☰","≣"][i]}
                  </button>
                ))}
                <button title="Bold" onClick={()=>onUpdate(el.id,{fontWeight:el.fontWeight===800?400:800} as Partial<CanvasElement>)}
                  style={{ flex:1, height:30, background:el.fontWeight===800?"#FFF0E8":"#FFFFFF", border:`1.5px solid ${el.fontWeight===800?ORANGE:"#E8E2D8"}`, borderRadius:5, cursor:"pointer", fontFamily:DM, fontSize:13, fontWeight:700, color:"#4A3C22" }}>
                  B
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete button */}
      <div style={{ padding:"0.75rem 0.9rem", borderTop:`2px solid #F0E8D8`, flexShrink:0 }}>
        <button onClick={()=>{ onDelete(el.id); onClose(); }}
          style={{ width:"100%", height:36, background:"#FFF0EC", border:`2px solid ${ORANGE}`, borderRadius:6, cursor:"pointer", fontFamily:BEBAS, fontSize:"0.85rem", letterSpacing:"0.12em", color:ORANGE, display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:`2px 2px 0 ${NAVY}` }}
          onMouseEnter={(e)=>{e.currentTarget.style.background=ORANGE;e.currentTarget.style.color="#FFFFFF";}}
          onMouseLeave={(e)=>{e.currentTarget.style.background="#FFF0EC";e.currentTarget.style.color=ORANGE;}}>
          🗑 DELETE ELEMENT
        </button>
      </div>
    </div>
  );
}

// ─── MicButton ───────────────────────────────────────────────────────────────
function MicButton({ isRecording, permissionDenied, speakingCount, onStart, onStop }: {
  isRecording: boolean;
  permissionDenied: boolean;
  speakingCount: number;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
      {speakingCount > 0 && !isRecording && (
        <div style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 8px", background:`${TEAL}18`, border:`1px solid ${TEAL}`, borderRadius:12, animation:"pulse-speaking 1.2s ease-in-out infinite" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:TEAL, animation:"pulse-speaking 0.8s ease-in-out infinite" }} />
          <span style={{ fontFamily:DM, fontSize:"0.64rem", color:TEAL, fontWeight:600 }}>{speakingCount} speaking</span>
        </div>
      )}
      <button
        title={permissionDenied?"Microphone access denied":isRecording?"Release to send":"Hold to talk"}
        onMouseDown={!permissionDenied?onStart:undefined}
        onMouseUp={!permissionDenied?onStop:undefined}
        onTouchStart={!permissionDenied?(e)=>{e.preventDefault();onStart();}:undefined}
        onTouchEnd={!permissionDenied?(e)=>{e.preventDefault();onStop();}:undefined}
        style={{
          width:36, height:36, borderRadius:"50%", border:"none", cursor:permissionDenied?"not-allowed":"pointer",
          background:isRecording?ORANGE:permissionDenied?"#E8E2D8":"#F0E8DC",
          boxShadow:isRecording?`0 0 0 4px ${ORANGE}44, 2px 2px 0 ${NAVY}`:`2px 2px 0 rgba(0,0,0,0.15)`,
          transition:"background 0.15s, box-shadow 0.15s",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, flexShrink:0,
        }}>
        {isRecording ? "🔴" : permissionDenied ? "🚫" : "🎙"}
      </button>
      {isRecording && (
        <span style={{ fontFamily:DM, fontSize:"0.65rem", color:ORANGE, fontWeight:600, animation:"pulse-speaking 0.8s ease-in-out infinite" }}>
          Recording…
        </span>
      )}
      <style>{`
        @keyframes pulse-speaking { 0%,100%{opacity:1} 50%{opacity:0.55} }
      `}</style>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GamePage({ room, myPlayerId, amIHost, onAdd, onUpdate, onDelete, onDone, doneVotes, remoteCursors, emitCursorMove, socket, roomId }: Props) {
  const myPlayer   = room.players.find((p)=>p.id===myPlayerId);
  const isImposter = myPlayer?.isImposter ?? false;

  const canvasRef      = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const draggingRef    = useRef<{ elId:string; startX:number; startY:number; origX:number; origY:number }|null>(null);
  const resizingRef    = useRef<{ elId:string; handle:0|1|2|3; startX:number; startY:number; origX:number; origY:number; origW:number; origH:number }|null>(null);
  const lastCursorEmit = useRef(0);
  const undoStackRef   = useRef<Array<{ type:"move"; id:string; oldX:number; oldY:number; oldW:number; oldH:number }>>([]);
  const pencilRef      = useRef<{ points:{ x:number; y:number }[]; lastEmit:number; color:string; width:number }|null>(null);
  const vertexDragRef  = useRef<{ elId:string; vertIdx:number; startMX:number; startMY:number; origVerts:{ x:number; y:number }[] }|null>(null);

  const [localTransforms, setLocalTransforms] = useState<Record<string,LocalTransform>>({});
  const [selectedId,      setSelectedId]      = useState<string|null>(null);
  const [editingId,       setEditingId]       = useState<string|null>(null);
  const [search,          setSearch]          = useState("");
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>(() => {
    const init: Record<string,boolean> = {};
    SECTIONS.forEach((s)=>{ init[s.id]=!s.defaultOpen; });
    return init;
  });
  const [hoveredChip,  setHoveredChip]  = useState<string|null>(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [layerMenu,    setLayerMenu]    = useState<{ elId:string; x:number; y:number }|null>(null);
  const [activeTool,   setActiveTool]   = useState<"select"|"pencil"|"triangle">("select");
  const [pencilColor,  setPencilColor]  = useState("#1a1a1a");
  const [pencilWidth,  setPencilWidth]  = useState(3);
  const [livePoints,   setLivePoints]   = useState<{ x:number; y:number }[]|null>(null);

  const { isRecording, speakingPlayers, startRecording, stopRecording, permissionDenied } = useVoiceChat(socket, roomId);

  useEffect(()=>{ setLocalTransforms({}); setSelectedId(null); }, [room.round]);
  useEffect(()=>{
    if (editingId && canvasRef.current) {
      const el = canvasRef.current.querySelector("[contenteditable='true']") as HTMLElement|null;
      if (el) { el.focus(); const r=document.createRange(); r.selectNodeContents(el); r.collapse(false); const s=window.getSelection(); s?.removeAllRanges(); s?.addRange(r); }
    }
  }, [editingId]);

  useEffect(()=>{
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      const tag=(e.target as HTMLElement).tagName;
      if (tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT") return;
      if ((e.key==="Delete"||e.key==="Backspace")&&selectedId) { e.preventDefault(); onDelete(selectedId); setSelectedId(null); }
      if (e.key==="Escape") { setSelectedId(null); setActiveTool("select"); }
      if ((e.ctrlKey||e.metaKey)&&e.key==="z") { e.preventDefault(); const a=undoStackRef.current.pop(); if(a?.type==="move") onUpdate(a.id,{x:a.oldX,y:a.oldY,width:a.oldW,height:a.oldH}); }
      if ((e.ctrlKey||e.metaKey)&&e.key==="d"&&selectedId) { e.preventDefault(); const el=room.canvas.find(c=>c.id===selectedId); if(el) onAdd({type:el.type,x:el.x+16,y:el.y+16,width:el.width,height:el.height,content:el.content,fill:el.fill,stroke:el.stroke,fontSize:el.fontSize,cornerRadius:el.cornerRadius,opacity:el.opacity,imageUrl:el.imageUrl}); }
      if (selectedId&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) { e.preventDefault(); const el=room.canvas.find(c=>c.id===selectedId); if(el){const n=e.shiftKey?10:1;const dx=e.key==="ArrowLeft"?-n:e.key==="ArrowRight"?n:0;const dy=e.key==="ArrowUp"?-n:e.key==="ArrowDown"?n:0;onUpdate(el.id,{x:Math.max(0,Math.min(CANVAS_W-el.width,el.x+dx)),y:Math.max(0,Math.min(CANVAS_H-el.height,el.y+dy))});} }
      if (!e.ctrlKey&&!e.metaKey&&!e.altKey) {
        if (e.key==="r"||e.key==="R") { e.preventDefault(); quickAdd("rect",200,120); }
        if (e.key==="t"||e.key==="T") { e.preventDefault(); quickAdd("text",200,48,"Text"); }
        if (e.key==="p"||e.key==="P") { e.preventDefault(); setActiveTool("pencil"); }
        if (e.key==="g"||e.key==="G") { e.preventDefault(); setActiveTool("triangle"); }
        if (e.key==="v"||e.key==="V") { e.preventDefault(); setActiveTool("select"); }
      }
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editingId, room.canvas, onDelete, onUpdate, onAdd]);

  function quickAdd(type: CanvasElement["type"], w: number, h: number, content?: string) {
    const x=Math.round((CANVAS_W-w)/2), y=Math.round((CANVAS_H-h)/2);
    onAdd({ type, x, y, width:w, height:h, fill:type==="rect"?"#e8e8e8":type==="text"?"#333333":"#1a1a1a", content, fontSize:type==="text"?16:undefined });
  }

  function openImagePicker() { fileInputRef.current?.click(); }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const dataUrl=ev.target?.result as string;
      const img=new Image();
      img.onload=()=>{
        const aspect=img.width/img.height;
        const w=Math.min(300,CANVAS_W*0.4);
        const h=Math.round(w/aspect);
        onAdd({ type:"image", x:Math.round((CANVAS_W-w)/2), y:Math.round((CANVAS_H-h)/2), width:w, height:h, fill:"transparent", imageUrl:dataUrl });
      };
      img.src=dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value="";
  }

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent)=>{
    const now=Date.now();
    if (canvasRef.current&&now-lastCursorEmit.current>33) { lastCursorEmit.current=now; const rect=canvasRef.current.getBoundingClientRect(); emitCursorMove((e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height); }

    // Pencil: capture points
    if (pencilRef.current&&canvasRef.current) {
      const rect=canvasRef.current.getBoundingClientRect();
      const x=e.clientX-rect.left, y=e.clientY-rect.top;
      pencilRef.current.points.push({x,y});
      if (now-pencilRef.current.lastEmit>33) { pencilRef.current.lastEmit=now; setLivePoints([...pencilRef.current.points]); }
      return;
    }

    // Vertex drag: update a single triangle vertex
    if (vertexDragRef.current) {
      const{elId,vertIdx,startMX,startMY,origVerts}=vertexDragRef.current;
      const dx=e.clientX-startMX, dy=e.clientY-startMY;
      const newVerts=origVerts.map((v,i)=>i===vertIdx?{x:v.x+dx,y:v.y+dy}:{...v});
      const minX=Math.min(...newVerts.map(v=>v.x)), minY=Math.min(...newVerts.map(v=>v.y));
      const maxX=Math.max(...newVerts.map(v=>v.x)), maxY=Math.max(...newVerts.map(v=>v.y));
      onUpdate(elId,{vertices:newVerts,x:Math.round(minX),y:Math.round(minY),width:Math.round(maxX-minX)||2,height:Math.round(maxY-minY)||2});
      return;
    }

    if (draggingRef.current&&!resizingRef.current) {
      const{elId,startX,startY,origX,origY}=draggingRef.current;
      const el=room.canvas.find(c=>c.id===elId);
      if(!el) return;
      setLocalTransforms(p=>({...p,[elId]:{x:Math.max(0,Math.min(CANVAS_W-el.width,origX+(e.clientX-startX))),y:Math.max(0,Math.min(CANVAS_H-el.height,origY+(e.clientY-startY))),w:el.width,h:el.height}}));
    }
    if (resizingRef.current) {
      const{elId,handle,startX,startY,origX,origY,origW,origH}=resizingRef.current;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      let nx=origX,ny=origY,nw=origW,nh=origH;
      if(handle===0){nx=origX+dx;ny=origY+dy;nw=origW-dx;nh=origH-dy;}
      if(handle===1){ny=origY+dy;nw=origW+dx;nh=origH-dy;}
      if(handle===2){nx=origX+dx;nw=origW-dx;nh=origH+dy;}
      if(handle===3){nw=origW+dx;nh=origH+dy;}
      nw=Math.max(MIN_W,nw);nh=Math.max(MIN_H,nh);nx=Math.max(0,Math.min(CANVAS_W-MIN_W,nx));ny=Math.max(0,Math.min(CANVAS_H-MIN_H,ny));
      setLocalTransforms(p=>({...p,[elId]:{x:nx,y:ny,w:nw,h:nh}}));
    }
  }, [room.canvas, emitCursorMove, onUpdate]);

  const handleCanvasMouseUp = useCallback(()=>{
    // Finalize pencil stroke
    if (pencilRef.current) {
      const {points:pts, color, width:sw}=pencilRef.current;
      if (pts.length>=3) {
        const minX=Math.min(...pts.map(p=>p.x)), minY=Math.min(...pts.map(p=>p.y));
        const maxX=Math.max(...pts.map(p=>p.x)), maxY=Math.max(...pts.map(p=>p.y));
        onAdd({ type:"freedraw", x:Math.round(minX), y:Math.round(minY), width:Math.round(maxX-minX)||2, height:Math.round(maxY-minY)||2, fill:color, strokeWidth:sw, points:pts.map(p=>({x:Math.round(p.x),y:Math.round(p.y)})) });
      }
      pencilRef.current=null;
      setLivePoints(null);
      return;
    }

    // Commit vertex drag (already sent live)
    if (vertexDragRef.current) { vertexDragRef.current=null; return; }

    if (draggingRef.current&&!resizingRef.current) {
      const{elId,origX,origY}=draggingRef.current;
      const lt=localTransforms[elId];
      if(lt&&(Math.abs(lt.x-origX)>2||Math.abs(lt.y-origY)>2)){
        const el=room.canvas.find(c=>c.id===elId);
        const dx=Math.round(lt.x)-origX, dy=Math.round(lt.y)-origY;
        const updates: Record<string,unknown>={ x:Math.round(lt.x), y:Math.round(lt.y) };
        if (el?.type==="freedraw"&&el.points) updates.points=el.points.map(p=>({x:p.x+dx,y:p.y+dy}));
        if (el?.type==="triangle"&&el.vertices) updates.vertices=el.vertices.map(v=>({x:v.x+dx,y:v.y+dy}));
        onUpdate(elId, updates as Partial<CanvasElement>);
        if(undoStackRef.current.length>=10) undoStackRef.current.shift();
        undoStackRef.current.push({type:"move",id:elId,oldX:origX,oldY:origY,oldW:el?.width??0,oldH:el?.height??0});
      }
      draggingRef.current=null;
    }
    if (resizingRef.current) {
      const{elId,origX,origY,origW,origH}=resizingRef.current;
      const lt=localTransforms[elId];
      if(lt){onUpdate(elId,{x:Math.round(lt.x),y:Math.round(lt.y),width:Math.round(lt.w),height:Math.round(lt.h)});if(undoStackRef.current.length>=10) undoStackRef.current.shift();undoStackRef.current.push({type:"move",id:elId,oldX:origX,oldY:origY,oldW:origW,oldH:origH});}
      resizingRef.current=null;
    }
  }, [localTransforms, onUpdate, onAdd, room.canvas]);

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (activeTool==="pencil"&&canvasRef.current) {
      const rect=canvasRef.current.getBoundingClientRect();
      const x=e.clientX-rect.left, y=e.clientY-rect.top;
      pencilRef.current={points:[{x,y}],lastEmit:0,color:pencilColor,width:pencilWidth};
      setLivePoints([{x,y}]);
    }
  }
  function handleElementMouseDown(e: React.MouseEvent, el: CanvasElement) {
    if(activeTool!=="select") return; // let draw tools handle canvas events
    if(editingId||resizingRef.current) return;
    e.stopPropagation();
    setSelectedId(el.id);
    draggingRef.current={elId:el.id,startX:e.clientX,startY:e.clientY,origX:el.x,origY:el.y};
  }
  function handleCornerMouseDown(e: React.MouseEvent, el: CanvasElement, handle: 0|1|2|3) {
    e.stopPropagation(); e.preventDefault();
    draggingRef.current=null;
    resizingRef.current={elId:el.id,handle,startX:e.clientX,startY:e.clientY,origX:el.x,origY:el.y,origW:el.width,origH:el.height};
  }
  function handleElementDoubleClick(e: React.MouseEvent, el: CanvasElement) {
    e.stopPropagation();
    if (TEXT_TYPES.includes(el.type)) {
      setEditingId(el.id); setSelectedId(el.id);
    } else {
      setLayerMenu({ elId:el.id, x:e.clientX, y:e.clientY });
    }
  }
  function bringToFront(elId: string) { const maxZ=Math.max(0,...room.canvas.map(e=>e.zIndex)); onUpdate(elId,{zIndex:maxZ+1}); setLayerMenu(null); }
  function sendToBack(elId: string)   { const minZ=Math.min(0,...room.canvas.map(e=>e.zIndex)); onUpdate(elId,{zIndex:minZ-1}); setLayerMenu(null); }
  function bringForward(elId: string) { const el=room.canvas.find(e=>e.id===elId); if(!el) return; const higher=room.canvas.filter(e=>e.zIndex>el.zIndex).map(e=>e.zIndex).sort((a,b)=>a-b); onUpdate(elId,{zIndex:higher.length>0?higher[0]+1:el.zIndex+1}); setLayerMenu(null); }
  function sendBackward(elId: string) { const el=room.canvas.find(e=>e.id===elId); if(!el) return; const lower=room.canvas.filter(e=>e.zIndex<el.zIndex).map(e=>e.zIndex).sort((a,b)=>b-a); onUpdate(elId,{zIndex:lower.length>0?lower[0]-1:el.zIndex-1}); setLayerMenu(null); }
  function commitEdit(el: CanvasElement, div: HTMLElement|null) {
    if(!div) return;
    onUpdate(el.id,{content:div.innerText??div.textContent??""});
    setEditingId(null);
  }
  function handleCanvasClick(e: React.MouseEvent) {
    // Triangle placement
    if(activeTool==="triangle"&&canvasRef.current) {
      const rect=canvasRef.current.getBoundingClientRect();
      const cx=e.clientX-rect.left, cy=e.clientY-rect.top;
      const size=110, h=size*Math.sqrt(3)/2;
      const v0={x:Math.round(cx),y:Math.round(cy-h*2/3)};
      const v1={x:Math.round(cx-size/2),y:Math.round(cy+h/3)};
      const v2={x:Math.round(cx+size/2),y:Math.round(cy+h/3)};
      const minX=Math.min(v0.x,v1.x,v2.x), minY=Math.min(v0.y,v1.y,v2.y);
      const maxX=Math.max(v0.x,v1.x,v2.x), maxY=Math.max(v0.y,v1.y,v2.y);
      onAdd({type:"triangle",x:Math.max(0,minX),y:Math.max(0,minY),width:maxX-minX,height:maxY-minY,fill:ORANGE,vertices:[v0,v1,v2]});
      return;
    }
    if(e.target===canvasRef.current||(e.target as HTMLElement).dataset.canvas==="true") {
      setSelectedId(null); setEditingId(null);
    }
  }
  function addChipAt(chip: ChipDef, x?: number, y?: number) {
    if(chip.special==="image") { openImagePicker(); return; }
    const w=chip.defaults.width??200, h=chip.defaults.height??80;
    const px=x!==undefined?Math.max(0,Math.min(CANVAS_W-w,x-w/2)):Math.floor(Math.random()*(CANVAS_W-w-20))+10;
    const py=y!==undefined?Math.max(0,Math.min(CANVAS_H-h,y-h/2)):Math.floor(Math.random()*(CANVAS_H-h-20))+10;
    onAdd({type:chip.type,x:Math.round(px),y:Math.round(py),width:w,height:h,content:chip.defaults.content,fill:chip.defaults.fill??"#ffffff",stroke:chip.defaults.stroke,fontSize:chip.defaults.fontSize,cornerRadius:chip.defaults.cornerRadius,opacity:chip.defaults.opacity});
  }
  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const raw=e.dataTransfer.getData("chipDef");
    if(!raw||!canvasRef.current) return;
    const{type,defaults}=JSON.parse(raw) as{type:CanvasElement["type"];defaults:ChipDef["defaults"]};
    const rect=canvasRef.current.getBoundingClientRect();
    addChipAt({label:"",type,defaults,preview:()=>null},e.clientX-rect.left,e.clientY-rect.top);
  }

  const canvasMode=detectCanvasMode(room.prompt);
  const lowerSearch=search.toLowerCase().trim();
  const filteredSections=SECTIONS.map(s=>({...s,chips:lowerSearch?s.chips.filter(c=>c.label.toLowerCase().includes(lowerSearch)):s.chips})).filter(s=>s.chips.length>0);

  // Context-aware icons based on prompt keywords
  function getContextIcons(): { emoji:string; label:string }[] {
    const p = room.prompt.toLowerCase();
    const sets: Record<string,{emoji:string;label:string}[]> = {
      checkout:  [{emoji:"🛒",label:"Cart"},{emoji:"💳",label:"Card"},{emoji:"📦",label:"Package"},{emoji:"✅",label:"Confirm"},{emoji:"🏷️",label:"Price tag"},{emoji:"💰",label:"Price"},{emoji:"🔒",label:"Secure"},{emoji:"🎁",label:"Gift"},{emoji:"🧾",label:"Receipt"},{emoji:"↩️",label:"Return"},{emoji:"⭐",label:"Rating"},{emoji:"🚚",label:"Delivery"}],
      login:     [{emoji:"🔐",label:"Lock"},{emoji:"👤",label:"User"},{emoji:"📧",label:"Email"},{emoji:"🔑",label:"Key"},{emoji:"✉️",label:"Message"},{emoji:"🛡️",label:"Shield"},{emoji:"👁️",label:"Show pw"},{emoji:"📱",label:"Phone"},{emoji:"🔄",label:"Reset"},{emoji:"🔓",label:"Unlocked"},{emoji:"🍎",label:"Apple"},{emoji:"🔔",label:"Notify"}],
      signup:    [{emoji:"👤",label:"User"},{emoji:"📧",label:"Email"},{emoji:"🎂",label:"Birthday"},{emoji:"🌍",label:"Country"},{emoji:"📸",label:"Photo"},{emoji:"✅",label:"Agree"},{emoji:"🎉",label:"Welcome"},{emoji:"🔑",label:"Password"},{emoji:"📱",label:"Phone"},{emoji:"🔗",label:"Link"}],
      dashboard: [{emoji:"📊",label:"Chart"},{emoji:"📈",label:"Graph"},{emoji:"🔔",label:"Alert"},{emoji:"⚙️",label:"Settings"},{emoji:"📅",label:"Calendar"},{emoji:"👥",label:"Users"},{emoji:"💬",label:"Messages"},{emoji:"🔍",label:"Search"},{emoji:"📌",label:"Pin"},{emoji:"🏠",label:"Home"},{emoji:"📋",label:"Report"},{emoji:"🔗",label:"Link"}],
      profile:   [{emoji:"👤",label:"Avatar"},{emoji:"📸",label:"Photo"},{emoji:"✏️",label:"Edit"},{emoji:"📧",label:"Email"},{emoji:"🌍",label:"Location"},{emoji:"🔗",label:"Link"},{emoji:"⭐",label:"Badge"},{emoji:"🔔",label:"Notify"},{emoji:"🔒",label:"Private"},{emoji:"❤️",label:"Follow"},{emoji:"📊",label:"Stats"},{emoji:"🎨",label:"Theme"}],
      social:    [{emoji:"❤️",label:"Like"},{emoji:"👍",label:"Thumbs up"},{emoji:"💬",label:"Comment"},{emoji:"🔔",label:"Notify"},{emoji:"📸",label:"Photo"},{emoji:"🌟",label:"Star"},{emoji:"✉️",label:"Message"},{emoji:"📤",label:"Share"},{emoji:"🔗",label:"Link"},{emoji:"👥",label:"Friends"},{emoji:"🎉",label:"Celebrate"},{emoji:"🔁",label:"Repost"}],
      blog:      [{emoji:"📝",label:"Post"},{emoji:"🔖",label:"Bookmark"},{emoji:"❤️",label:"Like"},{emoji:"💬",label:"Comment"},{emoji:"📸",label:"Image"},{emoji:"🏷️",label:"Tag"},{emoji:"📅",label:"Date"},{emoji:"✏️",label:"Edit"},{emoji:"📤",label:"Share"},{emoji:"🔗",label:"Read more"},{emoji:"🔍",label:"Search"},{emoji:"📢",label:"Publish"}],
      ecommerce: [{emoji:"🛒",label:"Cart"},{emoji:"❤️",label:"Wishlist"},{emoji:"🔍",label:"Search"},{emoji:"💳",label:"Pay"},{emoji:"📦",label:"Orders"},{emoji:"⭐",label:"Rating"},{emoji:"🏷️",label:"Sale"},{emoji:"🔄",label:"Return"},{emoji:"📍",label:"Delivery"},{emoji:"🎁",label:"Gift"},{emoji:"💰",label:"Price"},{emoji:"🔒",label:"Secure"}],
      onboarding:[{emoji:"👋",label:"Welcome"},{emoji:"🎯",label:"Goal"},{emoji:"✅",label:"Step done"},{emoji:"➡️",label:"Next"},{emoji:"🔑",label:"Setup"},{emoji:"📱",label:"Device"},{emoji:"🎉",label:"Success"},{emoji:"⭐",label:"Favourite"},{emoji:"🔔",label:"Notify"},{emoji:"🌟",label:"Star"},{emoji:"📸",label:"Photo"},{emoji:"🤝",label:"Connect"}],
      landing:   [{emoji:"🚀",label:"Launch"},{emoji:"⭐",label:"Feature"},{emoji:"💬",label:"Testimonial"},{emoji:"💰",label:"Pricing"},{emoji:"✅",label:"Check"},{emoji:"📧",label:"Email"},{emoji:"🎯",label:"CTA"},{emoji:"🏆",label:"Award"},{emoji:"🔗",label:"Link"},{emoji:"📱",label:"Mobile"},{emoji:"🌍",label:"Global"},{emoji:"🎁",label:"Offer"}],
      settings:  [{emoji:"⚙️",label:"Settings"},{emoji:"🔔",label:"Notify"},{emoji:"🔒",label:"Privacy"},{emoji:"🌙",label:"Dark mode"},{emoji:"🌍",label:"Language"},{emoji:"💳",label:"Billing"},{emoji:"👤",label:"Account"},{emoji:"🔗",label:"Connect"},{emoji:"📱",label:"Device"},{emoji:"🔑",label:"Password"},{emoji:"🎨",label:"Theme"},{emoji:"❓",label:"Help"}],
    };
    const keywords = Object.keys(sets);
    const matched = keywords.filter(k=>p.includes(k));
    if (matched.length === 0) {
      if (p.includes("shop")||p.includes("store")||p.includes("product")) return sets.ecommerce;
      if (p.includes("sign in")||p.includes("sign up")||p.includes("auth")) return sets.login;
      if (p.includes("home")||p.includes("portfolio")||p.includes("hero")) return sets.landing;
      return [];
    }
    const combined = matched.flatMap(k=>sets[k]);
    // dedupe by emoji
    const seen = new Set<string>();
    return combined.filter(i=>{ if(seen.has(i.emoji)) return false; seen.add(i.emoji); return true; }).slice(0,12);
  }
  const contextIcons = getContextIcons();

  const selectedEl = selectedId ? (room.canvas.find(e=>e.id===selectedId)??null) : null;
  const selectedLT = selectedEl ? (localTransforms[selectedId!]??{x:selectedEl.x,y:selectedEl.y,w:selectedEl.width,h:selectedEl.height}) : null;
  const isTextEl   = selectedEl ? TEXT_TYPES.includes(selectedEl.type) : false;

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#F5EEE2", overflow:"hidden" }}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFileChange} />

      {/* ── TOP BAR ── */}
      <div style={{ background:"#FFFFFF", display:"flex", alignItems:"center", padding:"0 1.25rem", height:52, flexShrink:0, borderBottom:`3px solid ${ORANGE}`, gap:"1rem", boxShadow:"0 2px 12px rgba(0,0,0,0.10)" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height:38, display:"block", objectFit:"contain" }} />
        <div style={{ width:1, height:28, background:"#E8E2D8", flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", color:"#B8A880", letterSpacing:"0.1em", lineHeight:1 }}>ROUND {room.round} / {room.maxRounds}</div>
          <div style={{ fontFamily:DM, fontSize:"0.9rem", color:"#1A1208", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginTop:1 }}>{room.prompt}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexShrink:0 }}>
          {/* Voice mic — who is speaking */}
          {room.players.filter(p=>speakingPlayers.has(p.id)).map(p=>(
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 7px", background:`${p.color}22`, border:`1.5px solid ${p.color}`, borderRadius:12 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:p.color, animation:"pulse-speaking 0.8s infinite" }} />
              <span style={{ fontFamily:DM, fontSize:"0.6rem", color:p.color, fontWeight:700 }}>{p.name}</span>
            </div>
          ))}
          <MicButton isRecording={isRecording} permissionDenied={permissionDenied} speakingCount={speakingPlayers.size} onStart={startRecording} onStop={stopRecording} />
          <div style={{ width:1, height:24, background:"#E8E2D8" }} />
          <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.12em", padding:"0.22rem 0.65rem", borderRadius:3, background:isImposter?`${ORANGE}18`:`${TEAL}14`, border:`2px solid ${isImposter?ORANGE:TEAL}`, color:isImposter?ORANGE:TEAL }}>
            {isImposter?"IMPOSTER":"CREWMATE"}
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:DM, fontSize:"0.52rem", color:"#B8A880", letterSpacing:"0.14em", marginBottom:1 }}>TIME</div>
            <Timer endTime={room.phaseEndTime} />
          </div>
          {(()=>{
            const activePlayers = room.players.filter(p=>!p.eliminated);
            const myDone = doneVotes.includes(myPlayerId);
            const needed = Math.ceil(activePlayers.length / 2);
            return (
              <button onClick={myDone ? undefined : onDone}
                style={{ fontFamily:BEBAS, fontSize:"0.8rem", color:myDone?"#FFFFFF":"#EDE5CC", background:myDone?TEAL:NAVY, border:`2px solid ${myDone?"#1A6060":"#0A2040"}`, padding:"0.3rem 0.85rem", cursor:myDone?"default":"pointer", letterSpacing:"0.06em", boxShadow:"2px 2px 0 rgba(0,0,0,0.3)", opacity:myDone?0.85:1 }}>
                {myDone ? `✓ DONE ${doneVotes.length}/${needed}` : `DONE ${doneVotes.length}/${needed}`}
              </button>
            );
          })()}
        </div>
      </div>

      {/* ── MAIN ROW ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* LEFT PANEL */}
        <div style={{ width:PANEL_W, background:"#FAFAF5", borderRight:`3px solid #E8E2D8`, display:"flex", flexDirection:"column", flexShrink:0, boxShadow:"2px 0 8px rgba(0,0,0,0.06)" }}>

          {/* ── DRAW TOOLS ── */}
          <div style={{ padding:"0.45rem 0.5rem 0.35rem", borderBottom:`1.5px solid #F0E8D8`, background:"#FFFFFF", flexShrink:0 }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.52rem", letterSpacing:"0.18em", color:"#C8B888", marginBottom:4 }}>TOOLS</div>
            <div style={{ display:"flex", gap:4 }}>
              {([["select","↖","V"],["pencil","✏","P"],["triangle","▲","G"]] as [string,string,string][]).map(([tool,icon,key])=>(
                <button key={tool} onClick={()=>setActiveTool(tool as typeof activeTool)} title={`${tool.charAt(0).toUpperCase()+tool.slice(1)} (${key})`}
                  style={{ flex:1, height:28, display:"flex", alignItems:"center", justifyContent:"center", gap:3, background:activeTool===tool?NAVY:"#FAFAF5", color:activeTool===tool?"#FFF":"#555", border:`1.5px solid ${activeTool===tool?NAVY:"#E8E2D8"}`, borderRadius:5, fontFamily:DM, fontSize:"0.7rem", fontWeight:600, cursor:"pointer" }}>
                  <span style={{ fontSize:11 }}>{icon}</span>
                </button>
              ))}
            </div>
            {activeTool==="pencil"&&(
              <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:5 }}>
                {["#1a1a1a",ORANGE,TEAL,NAVY,"#E87DBB","#1A5A30","#FFFFFF"].map(c=>(
                  <button key={c} onClick={()=>setPencilColor(c)}
                    style={{ width:18, height:18, borderRadius:"50%", background:c, border:pencilColor===c?`2.5px solid ${TEAL}`:`1.5px solid ${c==="#FFFFFF"?"#CCC":"transparent"}`, cursor:"pointer", flexShrink:0 }} />
                ))}
                <div style={{ width:1, height:14, background:"#E8E2D8" }} />
                {[2,4,8].map(w=>(
                  <button key={w} onClick={()=>setPencilWidth(w)}
                    style={{ width:24, height:18, display:"flex", alignItems:"center", justifyContent:"center", background:pencilWidth===w?"#FFF0E8":"transparent", border:`1.5px solid ${pencilWidth===w?ORANGE:"#E8E2D8"}`, borderRadius:3, cursor:"pointer" }}>
                    <div style={{ width:14, height:w, background:pencilColor, borderRadius:1 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding:"0.65rem 0.65rem 0.4rem", borderBottom:"1.5px solid #F0E8D8" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#C8B888", pointerEvents:"none" }}>🔍</span>
              <input type="text" placeholder="Search…" value={search} onChange={(e)=>setSearch(e.target.value)}
                style={{ width:"100%", background:"#FFF8F0", border:`1.5px solid #E8E2D8`, color:"#1A1208", borderRadius:6, padding:"0.35rem 0.5rem 0.35rem 1.9rem", fontFamily:DM, fontSize:"0.73rem", outline:"none", boxSizing:"border-box" }}
                onFocus={(e)=>(e.currentTarget.style.borderColor=ORANGE)}
                onBlur={(e)=>(e.currentTarget.style.borderColor="#E8E2D8")} />
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"0 0.4rem 0.4rem" }}>

            {/* Context-aware icons section */}
            {!lowerSearch && contextIcons.length > 0 && (
              <div style={{ marginBottom:"0.15rem" }}>
                <div style={{ fontFamily:BEBAS, fontSize:"0.62rem", letterSpacing:"0.16em", color:MUSTARD, padding:"0.5rem 0.3rem 0.25rem", marginTop:4, display:"flex", alignItems:"center", gap:"0.35rem" }}>
                  <span style={{ fontSize:9, color:"#C8B888" }}>▸</span>ICONS
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, paddingBottom:4 }}>
                  {contextIcons.map(ic=>(
                    <div key={ic.emoji}
                      onClick={()=>onAdd({ type:"text", x:Math.floor(Math.random()*(CANVAS_W-60))+10, y:Math.floor(Math.random()*(CANVAS_H-60))+10, width:60, height:60, fill:"#1a1a1a", content:ic.emoji, fontSize:36 })}
                      title={ic.label}
                      style={{ background:"#FFFFFF", border:"1.5px solid #EAE4DC", borderRadius:6, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"5px 2px 3px", gap:2, transition:"all 0.12s" }}
                      onMouseEnter={(e)=>{e.currentTarget.style.borderColor=MUSTARD;e.currentTarget.style.background="#FFFBF0";e.currentTarget.style.transform="translateY(-2px)";}}
                      onMouseLeave={(e)=>{e.currentTarget.style.borderColor="#EAE4DC";e.currentTarget.style.background="#FFFFFF";e.currentTarget.style.transform="none";}}>
                      <span style={{ fontSize:18, lineHeight:1 }}>{ic.emoji}</span>
                      <span style={{ fontFamily:DM, fontSize:"0.48rem", color:"#8A7868", lineHeight:1.2, textAlign:"center" }}>{ic.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSections.length===0
              ? <div style={{ textAlign:"center", color:"#C8B888", fontFamily:DM, fontSize:"0.73rem", marginTop:"2rem" }}>No results</div>
              : filteredSections.map(section=>{
                const isOpen=lowerSearch?true:!collapsed[section.id];
                return (
                  <div key={section.id} style={{ marginBottom:"0.15rem" }}>
                    <button onClick={()=>!lowerSearch&&setCollapsed(c=>({...c,[section.id]:!c[section.id]}))}
                      style={{ width:"100%", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.5rem 0.3rem 0.25rem", fontFamily:BEBAS, fontSize:"0.62rem", letterSpacing:"0.16em", textAlign:"left", color:section.color, marginTop:4 }}>
                      <span style={{ fontSize:9, transform:isOpen?"rotate(90deg)":"none", transition:"transform 0.2s", display:"inline-block", color:"#C8B888" }}>▸</span>
                      {section.label.toUpperCase()}
                    </button>
                    {isOpen && (
                      <div style={{ display:"flex", flexDirection:"column", gap:4, paddingBottom:4 }}>
                        {section.chips.map(chip=>{
                          const ck=`${section.id}-${chip.label}`;
                          const hov=hoveredChip===ck;
                          return (
                            <div key={chip.label} draggable={!chip.special}
                              onDragStart={(e)=>e.dataTransfer.setData("chipDef",JSON.stringify({type:chip.type,defaults:chip.defaults}))}
                              onClick={()=>addChipAt(chip)}
                              onMouseEnter={()=>setHoveredChip(ck)}
                              onMouseLeave={()=>setHoveredChip(null)}
                              style={{ background:hov?"#FFF5EE":"#FFFFFF", border:`1.5px solid ${hov?section.color:"#EAE4DC"}`, borderRadius:6, padding:"7px 8px 5px", cursor:chip.special?"pointer":"grab", transform:hov?"translateY(-2px)":"none", transition:"all 0.12s", boxShadow:hov?"0 4px 12px rgba(0,0,0,0.08)":"0 1px 3px rgba(0,0,0,0.04)", display:"flex", flexDirection:"column", alignItems:"center", gap:4, userSelect:"none" }}>
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
          <div style={{ borderTop:`2px solid #F0E8D8`, padding:"0.55rem 0.8rem 0.6rem" }}>
            <div style={{ fontFamily:BEBAS, fontSize:"0.58rem", letterSpacing:"0.15em", color:ORANGE, marginBottom:"0.45rem" }}>PLAYERS</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {room.players.map(p=>(
                <div key={p.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, opacity:p.eliminated?0.3:1 }}>
                  <div style={{ position:"relative" }}>
                    <PlayerAvatar playerId={p.id} color={p.color} size={30} showBorder={p.id===myPlayerId} />
                    {speakingPlayers.has(p.id) && <div style={{ position:"absolute", bottom:-1, right:-1, width:7, height:7, borderRadius:"50%", background:TEAL, border:"1.5px solid #fff", animation:"pulse-speaking 0.8s infinite" }} />}
                  </div>
                  <span style={{ fontFamily:DM, fontSize:"0.48rem", color:p.id===myPlayerId?NAVY:"#8A7868", fontWeight:p.id===myPlayerId?700:400, maxWidth:32, textAlign:"center", lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {p.id===myPlayerId?"you":p.name}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:DM, fontSize:"0.55rem", color:"#C8B888", marginTop:"0.45rem", lineHeight:1.55 }}>
              V=Select · P=Pencil · G=Triangle
            </div>
          </div>
        </div>

        {/* CANVAS AREA — shrinks when sidebar is open */}
        <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", background:"#EDE5CC", padding:"2.5rem 3rem 2rem", backgroundImage:`repeating-linear-gradient(0deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 28px)` }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ position:"absolute", top:-44, left:"50%", transform:"translateX(-50%)", fontFamily:BEBAS, fontSize:"1.7rem", color:"rgba(28,58,96,0.12)", letterSpacing:"0.35em", whiteSpace:"nowrap", pointerEvents:"none" }}>ROUND {room.round}</div>
            <div style={{ position:"absolute", inset:-8, border:`8px solid ${NAVY}`, boxShadow:`4px 6px 0 ${ORANGE}, 8px 12px 0 rgba(0,0,0,0.22)`, pointerEvents:"none", zIndex:0 }} />

            {/* Canvas */}
            <div ref={canvasRef} data-canvas="true"
              style={{ position:"relative", width:CANVAS_W, height:CANVAS_H, background:canvasMode==="mobile"?"#FFFFFF":canvasMode==="web"?"#FFFFFF":"#F8F4EE", flexShrink:0, zIndex:1, overflow:"hidden", outline:dragOver?`4px dashed ${TEAL}`:"none", borderRadius:canvasMode==="mobile"?24:0, cursor:activeTool==="pencil"?"crosshair":activeTool==="triangle"?"crosshair":"default" }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
              onClick={handleCanvasClick}
              onDragOver={(e)=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleCanvasDrop}>

              {canvasMode==="mobile"&&(<>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:30, background:"#ffffff", borderBottom:"1px solid rgba(0,0,0,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", zIndex:50, pointerEvents:"none" }}>
                  <span style={{ fontFamily:DM, fontWeight:700, fontSize:12, color:"#1a1a1a" }}>9:41</span>
                  <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                    <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#1a1a1a" strokeOpacity="0.35"/><rect x="2" y="2" width="18" height="9" rx="2" fill="#1a1a1a"/></svg>
                  </div>
                </div>
                <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", width:130, height:5, background:"rgba(0,0,0,0.18)", borderRadius:100, zIndex:50, pointerEvents:"none" }} />
              </>)}
              {canvasMode==="web"&&(
                <div style={{ position:"absolute", top:0, left:0, right:0, height:40, background:"#f0f0f0", borderBottom:"1px solid #ddd", display:"flex", alignItems:"center", gap:10, padding:"0 14px", zIndex:50, pointerEvents:"none" }}>
                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>{["#ff5f57","#febc2e","#28c840"].map(c=><div key={c} style={{ width:11, height:11, borderRadius:"50%", background:c }} />)}</div>
                  <div style={{ flex:1, height:24, background:"#fff", borderRadius:100, border:"1px solid #ddd", display:"flex", alignItems:"center", padding:"0 12px", maxWidth:480 }}>
                    <span style={{ fontFamily:DM, fontSize:11, color:"#bbb" }}>https://yourapp.com</span>
                  </div>
                </div>
              )}

              {room.canvas.length===0&&(
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                  <div style={{ fontFamily:DM, fontWeight:700, fontSize:"1.5rem", color:"rgba(0,0,0,0.07)", textAlign:"center", padding:"0 3rem", lineHeight:1.3 }}>{room.prompt}</div>
                  <div style={{ fontFamily:DM, fontSize:"0.8rem", color:"rgba(0,0,0,0.12)", marginTop:"0.75rem" }}>Drag from panel · R = Rect · T = Text</div>
                </div>
              )}

              {room.canvas.map(el=>{
                const lt=localTransforms[el.id];
                const dEl=lt?{...el,x:lt.x,y:lt.y,width:lt.w,height:lt.h}:el;
                const isEditing=editingId===el.id;
                const outerStyle=getOuterStyle(dEl);
                if(isEditing) return <div key={el.id} contentEditable suppressContentEditableWarning style={{...outerStyle,border:`2px solid ${TEAL}`,outline:"none",cursor:"text",userSelect:"text"}} onBlur={(e)=>commitEdit(el,e.currentTarget)} onKeyDown={(e)=>{e.stopPropagation();if(e.key==="Escape"){e.preventDefault();commitEdit(el,e.currentTarget);}}}>{el.content}</div>;
                const elCursor = activeTool!=="select" ? (activeTool==="pencil"?"crosshair":"crosshair") : outerStyle.cursor;
                return <div key={el.id} style={{...outerStyle,cursor:elCursor}} onMouseDown={(e)=>handleElementMouseDown(e,el)} onDoubleClick={(e)=>handleElementDoubleClick(e,el)}>{renderCanvasContent(dEl)}</div>;
              })}

              {/* Selection outline + handles */}
              {selectedEl&&selectedLT&&!editingId&&(()=>{
                const H=9,ex=selectedLT.x,ey=selectedLT.y,ew=selectedLT.w,eh=selectedLT.h;
                const isDrawEl=selectedEl.type==="freedraw"||selectedEl.type==="triangle";
                const CURSORS=["nwse-resize","nesw-resize","nesw-resize","nwse-resize"] as const;
                const handles:[number,number,0|1|2|3][]=[[ex-H/2,ey-H/2,0],[ex+ew-H/2,ey-H/2,1],[ex-H/2,ey+eh-H/2,2],[ex+ew-H/2,ey+eh-H/2,3]];
                return (<>
                  <div style={{ position:"absolute", left:ex-2, top:ey-2, width:ew+4, height:eh+4, border:`2px dashed ${TEAL}`, pointerEvents:"none", zIndex:900 }} />
                  <div style={{ position:"absolute", left:ex, top:ey+eh+6, fontFamily:DM, fontSize:9, color:TEAL, background:"rgba(255,255,255,0.88)", border:`1px solid ${TEAL}`, padding:"1px 5px", borderRadius:4, pointerEvents:"none", zIndex:901, whiteSpace:"nowrap" }}>
                    {Math.round(selectedLT.w)} × {Math.round(selectedLT.h)}
                  </div>
                  {/* Resize handles only for non-draw elements */}
                  {!isDrawEl&&handles.map(([hx,hy,idx])=>(
                    <div key={idx} style={{ position:"absolute", left:hx, top:hy, width:H, height:H, background:"#fff", border:`2px solid ${TEAL}`, zIndex:902, cursor:CURSORS[idx], pointerEvents:"all" }} onMouseDown={(e)=>handleCornerMouseDown(e,selectedEl,idx)} />
                  ))}
                  {/* Vertex handles for triangle */}
                  {selectedEl.type==="triangle"&&selectedEl.vertices&&selectedEl.vertices.map((v,idx)=>(
                    <div key={`vert-${idx}`}
                      style={{ position:"absolute", left:v.x-7, top:v.y-7, width:14, height:14, borderRadius:"50%", background:"#fff", border:`2.5px solid ${ORANGE}`, zIndex:903, cursor:"move", pointerEvents:"all", boxShadow:"0 1px 4px rgba(0,0,0,0.22)" }}
                      onMouseDown={(e)=>{ e.stopPropagation(); e.preventDefault(); draggingRef.current=null; resizingRef.current=null; vertexDragRef.current={elId:selectedEl.id,vertIdx:idx,startMX:e.clientX,startMY:e.clientY,origVerts:[...selectedEl.vertices!]}; }} />
                  ))}
                </>);
              })()}

              {/* Pencil live preview */}
              {livePoints&&livePoints.length>1&&(
                <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1000, overflow:"visible" }}>
                  <path d={smoothPath(livePoints)} stroke={pencilColor} strokeWidth={pencilWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85}/>
                </svg>
              )}

              {/* Remote cursors */}
              {Object.values(remoteCursors).map(cursor=>{
                const player=room.players.find(p=>p.id===cursor.playerId);
                if(!player) return null;
                return (
                  <div key={cursor.playerId} style={{ position:"absolute", left:cursor.x*CANVAS_W, top:cursor.y*CANVAS_H, pointerEvents:"none", zIndex:999, opacity:1, transition:"left 0.05s linear, top 0.05s linear" }}>
                    <svg width="16" height="20" viewBox="0 0 16 20"><path d="M0 0 L0 14 L4 11 L6 18 L8 17 L6 10 L11 10 Z" fill={player.color} stroke="rgba(0,0,0,0.3)" strokeWidth="1" /></svg>
                    <div style={{ position:"absolute", top:18, left:10, background:player.color, color:"#fff", fontSize:10, padding:"2px 6px", borderRadius:10, whiteSpace:"nowrap", fontFamily:DM, fontWeight:600 }}>{player.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — always present, switches between brief and properties */}
        <div style={{ width:SIDEBAR_W, flexShrink:0, background:"#FAFAF5", borderLeft:`3px solid #E8E2D8`, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"-4px 0 14px rgba(0,0,0,0.06)" }}>
          {selectedEl && selectedLT ? (
            <PropertiesSidebar
              el={selectedEl}
              lt={selectedLT}
              isText={isTextEl}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onClose={()=>setSelectedId(null)}
            />
          ) : (
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"0.75rem 0.9rem 0.6rem", background:"#FFFFFF", borderBottom:`2px solid #F0E8D8`, flexShrink:0 }}>
                <div style={{ fontFamily:BEBAS, fontSize:"0.55rem", letterSpacing:"0.2em", color:"#C8B888", lineHeight:1 }}>ROUND {room.round} / {room.maxRounds}</div>
                <div style={{ fontFamily:BEBAS, fontSize:"0.95rem", color:NAVY, letterSpacing:"0.06em", lineHeight:1.3, marginTop:1 }}>DESIGN BRIEF</div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"0.8rem 0.9rem", display:"flex", flexDirection:"column", gap:"0.8rem" }}>
                <div style={{ background:"#FFFFFF", border:`2px solid #E8E2D8`, borderRadius:6, padding:"0.7rem 0.75rem", boxShadow:"2px 3px 0 rgba(0,0,0,0.05)" }}>
                  <div style={{ fontFamily:BEBAS, fontSize:"0.52rem", letterSpacing:"0.18em", color:MUSTARD, marginBottom:5 }}>PROMPT</div>
                  <div style={{ fontFamily:DM, fontSize:"0.78rem", color:"#1A1208", lineHeight:1.5, fontWeight:500 }}>{room.prompt}</div>
                </div>
                <div>
                  <div style={{ fontFamily:BEBAS, fontSize:"0.52rem", letterSpacing:"0.18em", color:ORANGE, marginBottom:6 }}>PLAYERS</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {room.players.map(p=>(
                      <div key={p.id} style={{ display:"flex", alignItems:"center", gap:7, opacity:p.eliminated?0.3:1 }}>
                        <div style={{ position:"relative", flexShrink:0 }}>
                          <PlayerAvatar playerId={p.id} color={p.color} size={26} showBorder={p.id===myPlayerId} />
                          {speakingPlayers.has(p.id) && <div style={{ position:"absolute", bottom:-1, right:-1, width:6, height:6, borderRadius:"50%", background:TEAL, border:"1.5px solid #fff" }} />}
                        </div>
                        <span style={{ fontFamily:DM, fontSize:"0.7rem", color:p.id===myPlayerId?NAVY:"#555", fontWeight:p.id===myPlayerId?700:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                          {p.id===myPlayerId?"you":p.name}
                        </span>
                        {doneVotes.includes(p.id) && <span style={{ fontSize:10, color:TEAL }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding:"0.5rem 0.6rem", background:isImposter?`${ORANGE}14`:`${TEAL}10`, border:`2px solid ${isImposter?ORANGE:TEAL}`, borderRadius:4, textAlign:"center" }}>
                  <div style={{ fontFamily:BEBAS, fontSize:"0.52rem", letterSpacing:"0.18em", color:isImposter?ORANGE:TEAL }}>YOUR ROLE</div>
                  <div style={{ fontFamily:BEBAS, fontSize:"1.05rem", color:isImposter?ORANGE:TEAL, letterSpacing:"0.08em" }}>{isImposter?"IMPOSTER":"CREWMATE"}</div>
                </div>
                <div>
                  <div style={{ fontFamily:BEBAS, fontSize:"0.52rem", letterSpacing:"0.18em", color:"#C8B888", marginBottom:6 }}>SHORTCUTS</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {[["R","Rectangle"],["T","Text block"],["Del","Delete"],["Ctrl+D","Duplicate"],["↑↓←→","Nudge"]].map(([k,v])=>(
                      <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{ fontFamily:"monospace", fontSize:"0.6rem", background:"#F0E8D8", border:"1px solid #DDD5C4", borderRadius:3, padding:"1px 5px", color:"#555", flexShrink:0 }}>{k}</span>
                        <span style={{ fontFamily:DM, fontSize:"0.63rem", color:"#8A7868" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Layer reorder context menu */}
      {layerMenu && (
        <div
          style={{ position:"fixed", left:layerMenu.x, top:layerMenu.y, zIndex:9999, background:"#FFFFFF", border:`2px solid ${NAVY}`, boxShadow:`4px 4px 0 ${ORANGE}`, borderRadius:6, overflow:"hidden", minWidth:170 }}
          onMouseLeave={()=>setLayerMenu(null)}>
          <div style={{ fontFamily:BEBAS, fontSize:"0.55rem", letterSpacing:"0.18em", color:"#B8A880", padding:"6px 12px 4px", borderBottom:"1px solid #F0E8D8" }}>LAYER ORDER</div>
          {([
            ["⬆ Bring to Front", ()=>bringToFront(layerMenu.elId)],
            ["↑ Bring Forward",  ()=>bringForward(layerMenu.elId)],
            ["↓ Send Backward",  ()=>sendBackward(layerMenu.elId)],
            ["⬇ Send to Back",   ()=>sendToBack(layerMenu.elId)],
          ] as [string, ()=>void][]).map(([label, fn])=>(
            <button key={label} onClick={fn}
              style={{ display:"block", width:"100%", background:"none", border:"none", padding:"7px 12px", textAlign:"left", fontFamily:DM, fontSize:"0.78rem", color:NAVY, cursor:"pointer" }}
              onMouseEnter={(e)=>{e.currentTarget.style.background="#FFF0E8";e.currentTarget.style.color=ORANGE;}}
              onMouseLeave={(e)=>{e.currentTarget.style.background="none";e.currentTarget.style.color=NAVY;}}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
