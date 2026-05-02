import type { CanvasElement } from "../types/game";

const DM    = "'DM Sans', sans-serif";
const ORANGE = "#D4561A";
const TEAL   = "#2A8080";

const CANVAS_W = 900;
const CANVAS_H = 560;

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
    case "navbar": {
      let navCfg: {logo?:boolean;logoText?:string;links?:{label:string}[]} = {logo:true,logoText:"Brand",links:[{label:"Home"},{label:"About"},{label:"Work"}]};
      if (el.content) { try { navCfg = JSON.parse(el.content); } catch {} }
      const navLinks = navCfg.links ?? [{label:"Home"},{label:"About"},{label:"Work"}];
      const linkFs = el.fontSize ?? 13;
      return <div style={{ width:"100%", height:"100%", background:c, borderBottom:"1px solid #e8e8e8", display:"flex", alignItems:"center", padding:"0 20px", gap:18, boxSizing:"border-box" }}>
        {navCfg.logo!==false && <div style={{ height:22, background:"#1a1a1a", borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 8px" }}><span style={{ fontFamily:DM, fontSize:11, color:"#fff", fontWeight:700 }}>{navCfg.logoText||"Brand"}</span></div>}
        <div style={{ flex:1 }} />
        {navLinks.map((link,i)=><span key={i} style={{ fontFamily:DM, fontSize:linkFs, color:"#555", flexShrink:0 }}>{link.label}</span>)}
        <div style={{ width:32, height:32, borderRadius:"50%", background:"#ddd", flexShrink:0 }} />
      </div>;
    }
    case "tabbar": {
      let tabs: Array<{icon:string;label:string;active?:boolean}> = [{icon:"🏠",label:"Home",active:true},{icon:"🔍",label:"Search"},{icon:"➕",label:""},{icon:"❤️",label:"Saved"},{icon:"👤",label:"Profile"}];
      if (el.content) { try { const p=JSON.parse(el.content); if(Array.isArray(p)) tabs=p; } catch {} }
      const tabIconSz = el.fontSize;
      return <div style={{ width:"100%", height:"100%", background:c, borderTop:"1px solid #e8e8e8", display:"flex", alignItems:"center", justifyContent:"space-around", padding:"0 8px", boxSizing:"border-box" }}>{tabs.map((t,i)=><div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, opacity:t.active?1:0.4, flex:1 }}><span style={{ fontSize:tabIconSz??(t.label===""?24:18) }}>{t.icon}</span>{t.label&&<span style={{ fontFamily:DM, fontSize:10, color:"#333" }}>{t.label}</span>}</div>)}</div>;
    }
    case "sidebar": {
      let sideItems: {icon:string;label:string;active?:boolean}[] = [{icon:"🏠",label:"Home",active:true},{icon:"📁",label:"Projects"},{icon:"⭐",label:"Favorites"},{icon:"⚙️",label:"Settings"},{icon:"👤",label:"Profile"}];
      if (el.content) { try { const p=JSON.parse(el.content); if(Array.isArray(p)) sideItems=p; } catch {} }
      const iconSz = el.fontSize ?? 15;
      return <div style={{ width:"100%", height:"100%", background:c, borderRight:"1px solid #e8e8e8", padding:"16px 0", display:"flex", flexDirection:"column", gap:2, boxSizing:"border-box" }}>
        {sideItems.map((item,i)=><div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", background:item.active?"rgba(0,0,0,0.06)":"transparent", borderRadius:"0 8px 8px 0", marginRight:8 }}>
          <span style={{ fontSize:iconSz }}>{item.icon}</span>
          <span style={{ fontFamily:DM, fontSize:13, color:item.active?"#222":"#888", fontWeight:item.active?600:400 }}>{item.label}</span>
        </div>)}
      </div>;
    }
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
    case "chart": {
      const W = el.width, H = el.height;
      let data: {chartType?:string;title?:string;labels?:string[];values?:number[];color?:string} = {};
      try { data = JSON.parse(el.content ?? "{}"); } catch {}
      const chartType = data.chartType ?? "bar";
      const labels = data.labels ?? ["Jan","Feb","Mar","Apr","May","Jun"];
      const values = data.values ?? [40,65,45,80,55,70];
      const color = data.color ?? el.fill ?? TEAL;
      const maxVal = Math.max(...values, 1);
      const padL=38, padR=10, padT=data.title?26:14, padB=26;
      const chartW=W-padL-padR, chartH=H-padT-padB;
      if (chartType==="pie"||chartType==="donut") {
        const cx=W/2, cy=H/2+(data.title?8:0);
        const R=Math.min(W,H)*0.37;
        const innerR=chartType==="donut"?R*0.55:0;
        const total=values.reduce((a,b)=>a+b,0)||1;
        const COLORS=[color,"#F5A623","#E87DBB","#9B59B6","#3498DB","#F1C40F"];
        let angle=-Math.PI/2;
        const slices=values.map((v,i)=>{
          const sweep=(v/total)*Math.PI*2;
          const x1=cx+R*Math.cos(angle),y1=cy+R*Math.sin(angle);
          const x2=cx+R*Math.cos(angle+sweep),y2=cy+R*Math.sin(angle+sweep);
          const ix1=cx+innerR*Math.cos(angle),iy1=cy+innerR*Math.sin(angle);
          const ix2=cx+innerR*Math.cos(angle+sweep),iy2=cy+innerR*Math.sin(angle+sweep);
          const large=sweep>Math.PI?1:0;
          const d=innerR>0
            ?`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`
            :`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
          const s={d,fill:COLORS[i%COLORS.length]};
          angle+=sweep; return s;
        });
        return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:"block",width:"100%",height:"100%" }}>
          {data.title&&<text x={W/2} y={16} textAnchor="middle" fontSize={11} fontFamily={DM} fontWeight="600" fill="#1a1a1a">{data.title}</text>}
          {slices.map((s,i)=><path key={i} d={s.d} fill={s.fill} stroke="#fff" strokeWidth={1.5}/>)}
        </svg>;
      }
      if (chartType==="line") {
        const gap=values.length>1?chartW/(values.length-1):chartW;
        const pts=values.map((v,i)=>({x:padL+i*gap,y:padT+chartH-(v/maxVal)*chartH}));
        const d=pts.map((p,i)=>i===0?`M ${p.x} ${p.y}`:`L ${p.x} ${p.y}`).join(" ");
        const areaD=`${d} L ${pts[pts.length-1].x} ${padT+chartH} L ${padL} ${padT+chartH} Z`;
        return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:"block",width:"100%",height:"100%" }}>
          {data.title&&<text x={W/2} y={14} textAnchor="middle" fontSize={11} fontFamily={DM} fontWeight="600" fill="#1a1a1a">{data.title}</text>}
          <line x1={padL} y1={padT} x2={padL} y2={padT+chartH} stroke="#ddd" strokeWidth={1}/>
          <line x1={padL} y1={padT+chartH} x2={padL+chartW} y2={padT+chartH} stroke="#ddd" strokeWidth={1}/>
          <path d={areaD} fill={color} opacity={0.12}/>
          <path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          {pts.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r={3.5} fill={color}/><text x={p.x} y={padT+chartH+16} textAnchor="middle" fontSize={9} fontFamily={DM} fill="#888">{labels[i]??""}</text></g>)}
        </svg>;
      }
      const barGap=chartW/(values.length||1);
      const barW=barGap*0.65;
      return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:"block",width:"100%",height:"100%" }}>
        {data.title&&<text x={W/2} y={14} textAnchor="middle" fontSize={11} fontFamily={DM} fontWeight="600" fill="#1a1a1a">{data.title}</text>}
        <line x1={padL} y1={padT} x2={padL} y2={padT+chartH} stroke="#ddd" strokeWidth={1}/>
        <line x1={padL} y1={padT+chartH} x2={padL+chartW} y2={padT+chartH} stroke="#ddd" strokeWidth={1}/>
        {values.map((v,i)=>{
          const bH=Math.max(2,(v/maxVal)*chartH);
          const bx=padL+i*barGap+(barGap-barW)/2;
          const by=padT+chartH-bH;
          return <g key={i}><rect x={bx} y={by} width={barW} height={bH} fill={color} rx={2} opacity={0.85}/><text x={bx+barW/2} y={padT+chartH+16} textAnchor="middle" fontSize={9} fontFamily={DM} fill="#888">{labels[i]??""}</text></g>;
        })}
      </svg>;
    }
    case "avatar": {
      const bg = el.fill || "#9B59B6";
      return (
        <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:`linear-gradient(145deg, ${bg}, ${bg}bb)`, display:"flex", alignItems:"flex-end", justifyContent:"center", overflow:"hidden" }}>
          <svg viewBox="0 0 100 100" style={{ width:"78%", marginBottom:"-4%" }}>
            <circle cx="50" cy="33" r="22" fill="rgba(255,255,255,0.9)" />
            <ellipse cx="50" cy="100" rx="40" ry="30" fill="rgba(255,255,255,0.9)" />
          </svg>
        </div>
      );
    }
    case "icon":
      return (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:el.fontSize ?? Math.round(Math.min(el.width, el.height) * 0.62), lineHeight:1, userSelect:"none" }}>{el.content || "⭐"}</span>
        </div>
      );
    case "rect":    return null;
    case "circle":  return null;
    case "divider": return null;
    case "heading": return <span style={{ fontFamily:DM, fontWeight:el.fontWeight??800, fontSize:el.fontSize??36, color:el.textColor??el.fill, letterSpacing:"-0.01em", lineHeight:1.2 }}>{el.content}</span>;
    case "text":    return <span style={{ fontFamily:DM, fontSize:el.fontSize??14, color:el.textColor??el.fill, lineHeight:1.55, fontWeight:el.fontWeight??400 }}>{el.content}</span>;
    case "label":   return <span style={{ fontFamily:DM, fontSize:el.fontSize??12, color:el.textColor??"#2C2C2C", fontWeight:el.fontWeight??600 }}>{el.content}</span>;
    case "button":  return <span style={{ fontFamily:DM, fontSize:el.fontSize??14, fontWeight:el.fontWeight??600 }}>{el.content}</span>;
    default: return null;
  }
}

function getElementStyle(el: CanvasElement): React.CSSProperties {
  const base: React.CSSProperties = {
    position:"absolute", left:el.x, top:el.y, width:el.width, height:el.height,
    zIndex:el.zIndex, boxSizing:"border-box", opacity:el.opacity??1, overflow:"hidden",
    pointerEvents:"none", userSelect:"none",
  };
  switch (el.type) {
    case "rect":     return { ...base, background:el.fill, border:el.stroke?`2px solid ${el.stroke}`:"none", borderRadius:el.cornerRadius??0 };
    case "circle":   return { ...base, background:el.fill, borderRadius:"50%", border:el.stroke?`2px solid ${el.stroke}`:"none" };
    case "divider":  return { ...base, height:Math.max(el.height,2), background:el.fill, borderRadius:el.cornerRadius??100 };
    case "heading":  return { ...base, display:"flex", alignItems:"center", overflow:"hidden" };
    case "text":     return { ...base, display:"flex", alignItems:"flex-start", overflow:"hidden" };
    case "label":    return { ...base, background:el.fill, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:el.cornerRadius??2 };
    case "button":   { const ghost=el.fill==="transparent"; return { ...base, background:el.fill, border:el.stroke?`2px solid ${el.stroke}`:"none", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:el.cornerRadius??6, color:el.textColor??(ghost?(el.stroke??"#222"):"#fff") }; }
    case "image":    return { ...base, background:el.fill, borderRadius:el.cornerRadius??4 };
    case "video":    return { ...base, borderRadius:el.cornerRadius??4, overflow:"hidden" };
    case "chart":    return { ...base, background:"#f8f8f8", borderRadius:el.cornerRadius??8 };
    case "avatar":   return { ...base, borderRadius:"50%", overflow:"hidden" };
    case "icon":     return { ...base, background:"transparent", overflow:"visible" };
    case "freedraw": return { ...base, background:"transparent", overflow:"visible" };
    case "triangle": return { ...base, background:"transparent", overflow:"visible" };
    default:         return base;
  }
}

type Props = {
  elements: CanvasElement[];
  /** Target display width in px. Height is computed from 900:560 aspect ratio. */
  displayWidth: number;
  canvasMode?: "mobile" | "web" | "default";
  className?: string;
};

export function CanvasPreview({ elements, displayWidth, canvasMode = "default" }: Props) {
  const scale = displayWidth / CANVAS_W;
  const displayHeight = Math.round(CANVAS_H * scale);
  const bg = canvasMode === "mobile" ? "#FFFFFF" : canvasMode === "web" ? "#FFFFFF" : "#F8F4EE";

  return (
    <div style={{
      width: displayWidth,
      height: displayHeight,
      overflow: "hidden",
      position: "relative",
      flexShrink: 0,
    }}>
      <div style={{
        width: CANVAS_W,
        height: CANVAS_H,
        position: "relative",
        transformOrigin: "top left",
        transform: `scale(${scale})`,
        background: bg,
        overflow: "hidden",
      }}>
        {/* Mobile chrome */}
        {canvasMode === "mobile" && <>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:30, background:"#ffffff", borderBottom:"1px solid rgba(0,0,0,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", zIndex:50, pointerEvents:"none" }}>
            <span style={{ fontFamily:DM, fontWeight:700, fontSize:12, color:"#1a1a1a" }}>9:41</span>
            <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#1a1a1a" strokeOpacity="0.35"/><rect x="2" y="2" width="18" height="9" rx="2" fill="#1a1a1a"/></svg>
          </div>
          <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", width:130, height:5, background:"rgba(0,0,0,0.18)", borderRadius:100, zIndex:50, pointerEvents:"none" }} />
        </>}
        {/* Web chrome */}
        {canvasMode === "web" && (
          <div style={{ position:"absolute", top:0, left:0, right:0, height:40, background:"#f0f0f0", borderBottom:"1px solid #ddd", display:"flex", alignItems:"center", gap:10, padding:"0 14px", zIndex:50, pointerEvents:"none" }}>
            <div style={{ display:"flex", gap:5, flexShrink:0 }}>{["#ff5f57","#febc2e","#28c840"].map(col=><div key={col} style={{ width:11, height:11, borderRadius:"50%", background:col }} />)}</div>
            <div style={{ flex:1, height:24, background:"#fff", borderRadius:100, border:"1px solid #ddd", display:"flex", alignItems:"center", padding:"0 12px", maxWidth:480 }}>
              <span style={{ fontFamily:DM, fontSize:11, color:"#bbb" }}>https://yourapp.com</span>
            </div>
          </div>
        )}
        {/* Empty state */}
        {elements.length === 0 && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
            <span style={{ fontFamily:DM, fontSize:"0.8rem", color:"rgba(44,44,44,0.22)" }}>Canvas was left empty</span>
          </div>
        )}
        {/* Elements — exact same rendering as GamePage */}
        {elements.map(el => (
          <div key={el.id} style={getElementStyle(el)}>
            {renderCanvasContent(el)}
          </div>
        ))}
      </div>
    </div>
  );
}

export { TEAL };
