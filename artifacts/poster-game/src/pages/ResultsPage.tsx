import { PosterWallBg, TapeH, TapeCorner } from "../components/PosterWallBg";
import type { RoomState, CanvasElement } from "../types/game";

// ── Canvas-based PNG export — renders all element types faithfully ─────────────
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(Math.abs(r), w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

async function downloadDesignAsPng(elements: CanvasElement[], prompt: string) {
  const W = 900, H = 560;
  const cvs = document.createElement("canvas");
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext("2d")!;

  // Load images first
  const imgCache = new Map<string, HTMLImageElement>();
  await Promise.all(
    elements.filter(e => e.type === "image" && e.imageUrl).map(e => new Promise<void>(res => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => { imgCache.set(e.imageUrl!, img); res(); };
      img.onerror = () => res();
      img.src = e.imageUrl!;
    }))
  );

  // Background
  ctx.fillStyle = "#F5EEE2";
  ctx.fillRect(0, 0, W, H);

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sorted) {
    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;
    const x = el.x, y = el.y, w = el.width, h = el.height;
    const r = el.cornerRadius ?? 0;
    const fill = el.fill || "#cccccc";

    switch (el.type) {
      case "rect":
      case "label":
      case "input":
      case "searchbar":
      case "dropdown":
      case "checkbox":
      case "toggle":
      case "progress":
      case "alert":
      case "toast":
      case "modal":
      case "fab":
      case "card":
      case "listitem":
      case "badge":
      case "tag":
      case "navbar":
      case "tabbar":
      case "sidebar":
      case "breadcrumb": {
        rrect(ctx, x, y, w, h, r);
        ctx.fillStyle = fill === "transparent" ? "rgba(0,0,0,0)" : fill;
        ctx.fill();
        if (el.stroke) { ctx.strokeStyle = el.stroke; ctx.lineWidth = 2; ctx.stroke(); }
        // Render text content for text-bearing components
        if (el.content && !["tabbar","sidebar","navbar","breadcrumb"].includes(el.type)) {
          const fs = el.fontSize ?? 13;
          const fw = el.fontWeight ?? 600;
          ctx.font = `${fw} ${fs}px "DM Sans", sans-serif`;
          const isDark = fill === "transparent" || fill === "#ffffff" || fill === "#f5f5f5" || fill.startsWith("#f") || fill.startsWith("#e");
          ctx.fillStyle = isDark ? "#222222" : "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(el.content, x + w / 2, y + h / 2);
        }
        // Tabbar icon row
        if (el.type === "tabbar") {
          let tabs: Array<{icon:string;label:string;active?:boolean}> = [{icon:"🏠",label:"Home",active:true},{icon:"🔍",label:"Search"},{icon:"➕",label:""},{icon:"❤️",label:"Saved"},{icon:"👤",label:"Profile"}];
          try { const p=JSON.parse(el.content??""); if(Array.isArray(p)) tabs=p; } catch {}
          const tw = w / tabs.length;
          ctx.textBaseline = "middle";
          tabs.forEach((t, i) => {
            ctx.globalAlpha = (el.opacity ?? 1) * (t.active ? 1 : 0.4);
            const cx = x + tw * i + tw / 2;
            ctx.font = `18px sans-serif`;
            ctx.textAlign = "center";
            ctx.fillStyle = "#333";
            ctx.fillText(t.icon, cx, y + h / 2 - (t.label ? 8 : 0));
            if (t.label) {
              ctx.font = `400 10px "DM Sans", sans-serif`;
              ctx.fillStyle = "#333";
              ctx.fillText(t.label, cx, y + h / 2 + 10);
            }
          });
        }
        break;
      }
      case "circle": {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        if (el.stroke) { ctx.strokeStyle = el.stroke; ctx.lineWidth = 2; ctx.stroke(); }
        break;
      }
      case "divider": {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, w, Math.max(h, 2));
        break;
      }
      case "button": {
        rrect(ctx, x, y, w, h, r);
        ctx.fillStyle = fill === "transparent" ? "rgba(0,0,0,0)" : fill;
        ctx.fill();
        if (el.stroke) { ctx.strokeStyle = el.stroke; ctx.lineWidth = 2; ctx.stroke(); }
        const fs = el.fontSize ?? 14, fw = el.fontWeight ?? 600;
        ctx.font = `${fw} ${fs}px "DM Sans", sans-serif`;
        ctx.fillStyle = fill === "transparent" ? (el.stroke ?? "#222") : "#ffffff";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(el.content ?? "Button", x + w / 2, y + h / 2);
        break;
      }
      case "text":
      case "heading": {
        const fs = el.fontSize ?? (el.type === "heading" ? 36 : 14);
        const fw = el.fontWeight ?? (el.type === "heading" ? 800 : 400);
        ctx.font = `${fw} ${fs}px "DM Sans", sans-serif`;
        ctx.fillStyle = fill;
        ctx.textAlign = (el.textAlign as CanvasTextAlign) ?? "left";
        ctx.textBaseline = "top";
        const lines = wrapLines(ctx, el.content ?? "", w - 8);
        let lx = el.textAlign === "center" ? x + w / 2 : el.textAlign === "right" ? x + w - 4 : x + 4;
        let ly = y + 4;
        for (const line of lines) {
          ctx.fillText(line, lx, ly);
          ly += fs * 1.45;
          if (ly > y + h) break;
        }
        break;
      }
      case "image": {
        const img = el.imageUrl ? imgCache.get(el.imageUrl) : undefined;
        ctx.save();
        rrect(ctx, x, y, w, h, r);
        ctx.clip();
        if (img) {
          // Contain fit
          const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
          const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
          ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
        } else {
          ctx.fillStyle = fill || "#f0e8d8";
          ctx.fill();
          ctx.font = "32px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("🖼️", x + w / 2, y + h / 2);
        }
        ctx.restore();
        break;
      }
      case "freedraw": {
        const pts = el.points ?? [];
        if (pts.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
          }
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.strokeStyle = fill;
          ctx.lineWidth = el.strokeWidth ?? 3;
          ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.stroke();
        }
        break;
      }
      case "triangle": {
        const verts = el.vertices ?? [];
        if (verts.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
          if (el.stroke) { ctx.strokeStyle = el.stroke; ctx.lineWidth = 2; ctx.stroke(); }
        }
        break;
      }
      default:
        break;
    }
    ctx.restore();
  }

  // Watermark
  ctx.save();
  ctx.font = `400 11px sans-serif`;
  ctx.fillStyle = "rgba(138,120,104,0.6)";
  ctx.textAlign = "left"; ctx.textBaseline = "bottom";
  ctx.fillText(`${prompt} — made with POSTER`, 10, H - 6);
  ctx.restore();

  cvs.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "poster-design.png" });
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

const BEBAS   = "'Bebas Neue', sans-serif";
const DM      = "'DM Sans', sans-serif";
const ORANGE  = "#D4561A";
const NAVY    = "#1C3A60";
const TEAL    = "#2A8080";
const MUSTARD = "#C8A028";

const STYLE_COLORS: Record<string, string> = {
  "Subtle Saboteur": ORANGE,
  "Chaos Agent":     "#C03020",
  "The Minimalist":  TEAL,
  "Over-Designer":   "#9B59B6",
};

const OBJECTIVE_COLORS: Record<string, string> = {
  "Break Alignment":     ORANGE,
  "Reduce Hierarchy":    NAVY,
  "Inconsistent Sizing": MUSTARD,
  "Reduce Clarity":      "#C03020",
};

type Props = {
  room: RoomState;
  myPlayerId: string;
  amIHost: boolean;
  onPlayAgain: () => void;
};

export function ResultsPage({ room, myPlayerId, amIHost, onPlayAgain }: Props) {
  const latestResult = room.results[room.results.length - 1];
  const imposter     = room.players.find((p) => p.id === room.imposterId);
  const isEnded      = room.phase === "ended";

  return (
    <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden" }}>
      <PosterWallBg />

      {/* Header */}
      <div style={{ position:"relative", zIndex:20, background:"#FFFFFF", borderBottom:`3px solid ${ORANGE}`, padding:"0.6rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem", boxShadow:"0 2px 12px rgba(0,0,0,0.10)" }}>
        <img src="/poster-logo.png" alt="POSTER" style={{ height:38, display:"block", objectFit:"contain" }} />
        <div style={{ fontFamily:BEBAS, letterSpacing:"0.15em", fontSize:"1.15rem", color:isEnded?ORANGE:NAVY }}>
          {isEnded?"GAME OVER":`ROUND ${room.round} RESULTS`}
        </div>
      </div>

      <div style={{ position:"relative", zIndex:10, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2.5rem 1.5rem 3rem" }}>
        <div style={{ width:"100%", maxWidth:620, display:"flex", flexDirection:"column", gap:"1.4rem" }}>

          {/* ── IMPOSTER REVEAL — white poster ── */}
          {latestResult && (
            <div style={{ position:"relative" }}>
              <div style={{ position:"relative", background:"#FFFFFF", padding:"2rem 2.2rem 1.8rem", transform:"rotate(-0.7deg)", boxShadow:`8px 10px 0 ${NAVY}`, border:`4px solid ${NAVY}` }}>
                <TapeH color={ORANGE} width={110} />
                <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.28em", color:"#8A7868", marginBottom:"0.85rem" }}>
                  THE IMPOSTER WAS…
                </div>
                {imposter && (
                  <div style={{ display:"flex", alignItems:"center", gap:"1.25rem", marginBottom:"1.5rem" }}>
                    <div style={{ width:60, height:60, borderRadius:"50%", background:imposter.color, boxShadow:`0 0 24px ${imposter.color}88, 4px 4px 0 ${NAVY}`, flexShrink:0, border:"3px solid #fff" }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:BEBAS, fontSize:"3rem", color:"#1A1208", lineHeight:1, letterSpacing:"0.04em" }}>{imposter.name}</div>
                      {imposter.id===myPlayerId&&<div style={{ fontFamily:DM, fontSize:"0.85rem", color:ORANGE, fontWeight:700, marginTop:2 }}>That was you!</div>}
                    </div>
                    <div style={{
                      fontFamily:BEBAS, fontSize:"2rem", lineHeight:1, letterSpacing:"0.04em",
                      color:"#FFFFFF",
                      background:latestResult.caught?ORANGE:TEAL,
                      border:`3px solid ${latestResult.caught?"#8A3008":"#1A5858"}`,
                      boxShadow:`4px 4px 0 ${NAVY}`,
                      padding:"0.3rem 0.8rem",
                      transform:latestResult.caught?"rotate(-3deg)":"rotate(2deg)",
                    }}>
                      {latestResult.caught?"CAUGHT!":"GOT AWAY!"}
                    </div>
                  </div>
                )}
                {latestResult.feedback&&(
                  <div style={{ borderTop:`2px dashed #E8E2D8`, paddingTop:"1rem" }}>
                    <div style={{ fontFamily:BEBAS, fontSize:"0.68rem", letterSpacing:"0.15em", color:ORANGE, marginBottom:"0.5rem" }}>DESIGN CRITIQUE</div>
                    <p style={{ fontFamily:DM, fontSize:"0.92rem", color:"#4A3C22", lineHeight:1.6, margin:0, fontStyle:"italic" }}>"{latestResult.feedback}"</p>
                  </div>
                )}
              </div>
              <svg viewBox="0 0 620 18" style={{ display:"block", width:"100%", marginTop:-2 }} preserveAspectRatio="none">
                <path d="M0 0 L0 7 Q30 16 60 7 Q90 0 120 13 Q150 18 180 7 Q210 0 240 14 Q270 18 300 7 Q330 0 360 13 Q390 18 420 7 Q450 0 480 13 Q510 18 540 7 Q570 0 600 13 Q615 16 620 9 L620 0 Z" fill="#FFFFFF"/>
              </svg>
            </div>
          )}

          {/* ── IMPOSTER OBJECTIVES REVEAL ── */}
          {room.imposterMeta && (
            <div style={{ position:"relative" }}>
              <div style={{ background:"rgba(8,2,0,0.92)", border:`3px solid ${ORANGE}44`, padding:"1.4rem 1.6rem", transform:"rotate(0.4deg)", position:"relative" }}>
                <div style={{ position:"absolute", top:-10, left:20, width:100, height:20, background:`repeating-linear-gradient(90deg,${ORANGE}CC,${ORANGE}FF 10px,${ORANGE}CC 14px)`, transform:"rotate(-3deg)", zIndex:2 }} />
                <div style={{ fontFamily:BEBAS, fontSize:"0.65rem", letterSpacing:"0.28em", color:`${ORANGE}88`, marginBottom:"0.7rem", marginTop:"0.2rem" }}>
                  🕵️ IMPOSTER OBJECTIVES — REVEALED
                </div>
                <div style={{ display:"flex", gap:"0.85rem" }}>
                  <div style={{ flex:1, background:`${ORANGE}12`, border:`1.5px solid ${ORANGE}44`, padding:"0.75rem 0.9rem" }}>
                    <div style={{ fontFamily:BEBAS, fontSize:"0.55rem", letterSpacing:"0.25em", color:`${ORANGE}77`, marginBottom:4 }}>SABOTAGE STYLE</div>
                    <div style={{ fontFamily:BEBAS, fontSize:"1rem", letterSpacing:"0.06em", color:STYLE_COLORS[room.imposterMeta.styleName] ?? ORANGE, marginBottom:4 }}>
                      {room.imposterMeta.styleName}
                    </div>
                    <div style={{ fontFamily:DM, fontSize:"0.75rem", color:"rgba(237,229,204,0.65)", lineHeight:1.5 }}>
                      {room.imposterMeta.style}
                    </div>
                  </div>
                  <div style={{ flex:1, background:"rgba(28,58,96,0.25)", border:`1.5px solid ${NAVY}66`, padding:"0.75rem 0.9rem" }}>
                    <div style={{ fontFamily:BEBAS, fontSize:"0.55rem", letterSpacing:"0.25em", color:"rgba(180,200,230,0.55)", marginBottom:4 }}>HIDDEN OBJECTIVE</div>
                    <div style={{ fontFamily:BEBAS, fontSize:"1rem", letterSpacing:"0.06em", color:OBJECTIVE_COLORS[room.imposterMeta.objectiveName] ?? "#8AB8E8", marginBottom:4 }}>
                      {room.imposterMeta.objectiveName}
                    </div>
                    <div style={{ fontFamily:DM, fontSize:"0.75rem", color:"rgba(237,229,204,0.65)", lineHeight:1.5 }}>
                      {room.imposterMeta.objective}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── VOTE BREAKDOWN ── */}
          {room.votes&&Object.keys(room.votes).length>0&&(
            <div style={{ position:"relative" }}>
              <div style={{ background:"#FFFFFF", border:`3px solid ${NAVY}`, boxShadow:`5px 6px 0 ${MUSTARD}`, padding:"1.25rem 1.5rem", transform:"rotate(0.5deg)", position:"relative" }}>
                <TapeCorner color={TEAL} corner="tl" />
                <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.2em", color:NAVY, marginBottom:"0.85rem" }}>VOTE BREAKDOWN</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  {room.players.map((player) => {
                    const votes = (room.voteTally??{})[player.id]??0;
                    const isImp = player.id===room.imposterId;
                    return (
                      <div key={player.id} style={{ display:"flex", alignItems:"center", gap:"0.7rem", padding:"0.35rem 0", borderBottom:`1px solid #F0E8D8` }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:player.color, flexShrink:0, boxShadow:`0 0 5px ${player.color}88` }} />
                        <span style={{ fontFamily:DM, fontSize:"0.85rem", color:isImp?"#1A1208":"#8A7868", flex:1, fontWeight:isImp?700:400 }}>
                          {player.name}{isImp&&<span style={{ color:ORANGE }}> ★ IMPOSTER</span>}
                        </span>
                        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                          {Array.from({length:votes}).map((_,i)=>(
                            <div key={i} style={{ width:10, height:10, background:ORANGE, borderRadius:"50%", boxShadow:`0 0 4px ${ORANGE}66` }} />
                          ))}
                          {votes===0&&<span style={{ fontFamily:DM, fontSize:"0.7rem", color:"#E8E2D8" }}>no votes</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── ROUND HISTORY ── */}
          {room.results.length>1&&(
            <div style={{ background:"rgba(255,255,255,0.85)", border:`2px solid #E8E2D8`, padding:"1rem 1.25rem", backdropFilter:"blur(4px)" }}>
              <div style={{ fontFamily:BEBAS, fontSize:"0.7rem", letterSpacing:"0.2em", color:NAVY, marginBottom:"0.6rem" }}>ROUND HISTORY</div>
              {room.results.map((r) => {
                const imp=room.players.find((p)=>p.id===r.imposterId);
                return (
                  <div key={r.round} style={{ display:"flex", alignItems:"center", gap:"0.75rem", paddingBottom:"0.3rem" }}>
                    <span style={{ fontFamily:BEBAS, fontSize:"0.75rem", color:ORANGE, width:"24px" }}>R{r.round}</span>
                    <span style={{ fontFamily:DM, fontSize:"0.78rem", color:"#8A7868", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.prompt}</span>
                    <span style={{ fontFamily:DM, fontSize:"0.75rem", color:"#4A3C22" }}>{imp?.name}</span>
                    <span style={{ fontFamily:BEBAS, fontSize:"0.7rem", color:r.caught?ORANGE:TEAL, letterSpacing:"0.08em" }}>{r.caught?"CAUGHT":"FREE"}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── GAME OVER / NEXT ROUND ── */}
          {isEnded ? (
            <div style={{ position:"relative" }}>
              <div style={{ background:"#FFFFFF", border:`4px solid ${NAVY}`, boxShadow:`8px 8px 0 ${ORANGE}`, padding:"2rem", textAlign:"center", transform:"rotate(-0.5deg)", position:"relative" }}>
                <TapeH color={ORANGE} width={120} />
                <div style={{ fontFamily:BEBAS, fontSize:"3.5rem", color:NAVY, letterSpacing:"0.06em", marginBottom:"0.4rem", lineHeight:1 }}>GAME OVER</div>
                <div style={{ fontFamily:DM, fontSize:"0.9rem", color:"#8A7868", marginBottom:"1.5rem" }}>
                  {room.results.filter((r)=>r.caught).length} of {room.results.length} imposters were caught
                </div>
                <div style={{ display:"flex", justifyContent:"center", gap:"1.2rem", marginBottom:"1.75rem", flexWrap:"wrap" }}>
                  {room.players.map((p)=>(
                    <div key={p.id} style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:p.color, boxShadow:`0 0 6px ${p.color}88` }} />
                      <span style={{ fontFamily:DM, fontSize:"0.85rem", color:"#1A1208", fontWeight:500 }}>{p.name}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.9rem" }}>
                  {room.canvas.length > 0 && (
                    <button
                      onClick={() => downloadDesignAsPng(room.canvas, room.prompt)}
                      style={{ fontFamily:BEBAS, letterSpacing:"0.12em", fontSize:"1.3rem", color:NAVY, background:"#FFFFFF", border:`3px solid ${NAVY}`, boxShadow:`4px 4px 0 ${TEAL}`, padding:"0.45rem 2.2rem", cursor:"pointer", transition:"transform 0.1s, box-shadow 0.1s" }}
                      onMouseEnter={(e)=>{e.currentTarget.style.transform="translate(-2px,-2px)";e.currentTarget.style.boxShadow=`6px 6px 0 ${TEAL}`;}}
                      onMouseLeave={(e)=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`4px 4px 0 ${TEAL}`;}}>
                      ↓ SAVE DESIGN (PNG)
                    </button>
                  )}
                  {amIHost ? (
                    <button onClick={onPlayAgain}
                      style={{ fontFamily:BEBAS, letterSpacing:"0.12em", fontSize:"1.6rem", color:"#FFFFFF", background:ORANGE, border:`3px solid #8A3008`, boxShadow:`5px 5px 0 ${NAVY}`, padding:"0.5rem 3rem", cursor:"pointer", transition:"transform 0.1s, box-shadow 0.1s" }}
                      onMouseEnter={(e)=>{e.currentTarget.style.transform="translate(-2px,-2px)";e.currentTarget.style.boxShadow=`7px 7px 0 ${NAVY}`;}}
                      onMouseLeave={(e)=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`5px 5px 0 ${NAVY}`;}}>
                      PLAY AGAIN
                    </button>
                  ) : (
                    <div style={{ fontFamily:DM, fontSize:"0.8rem", color:"#C8B888" }}>Waiting for host to start a new game…</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:"center", fontFamily:BEBAS, fontSize:"0.9rem", letterSpacing:"0.15em", color:NAVY, background:"rgba(255,255,255,0.7)", padding:"0.75rem", border:`2px solid #E8E2D8` }}>
              NEXT ROUND STARTING SOON…
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
