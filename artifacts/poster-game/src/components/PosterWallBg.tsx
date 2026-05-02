// Logo palette: orange #D4561A · navy #1C3A60 · teal #2A8080 · mustard #C8A028 · cream #EDE5CC
export function PosterWallBg() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, background:"#18130E", overflow:"hidden", pointerEvents:"none" }}>

      {/* ── Layered ripped-poster colour patches (vibrant, chaotic) ── */}
      <div style={{ position:"absolute", top:"-8%",  left:"-6%",  width:"46%", height:"60%", background:"#1C3A60", opacity:0.45, transform:"rotate(-3.8deg)" }} />
      <div style={{ position:"absolute", top:"-4%",  left:"10%",  width:"30%", height:"38%", background:"#D4561A", opacity:0.28, transform:"rotate(2.1deg)" }} />
      <div style={{ position:"absolute", top:"5%",   right:"-6%", width:"42%", height:"52%", background:"#2A8080", opacity:0.30, transform:"rotate(3.2deg)" }} />
      <div style={{ position:"absolute", top:"18%",  right:"10%", width:"28%", height:"35%", background:"#C8A028", opacity:0.22, transform:"rotate(-4deg)" }} />
      <div style={{ position:"absolute", top:"35%",  left:"-5%",  width:"32%", height:"45%", background:"#8B1A10", opacity:0.35, transform:"rotate(4.5deg)" }} />
      <div style={{ position:"absolute", top:"40%",  left:"22%",  width:"38%", height:"42%", background:"#1C3A60", opacity:0.20, transform:"rotate(-2deg)" }} />
      <div style={{ position:"absolute", bottom:"-10%", left:"8%",  width:"55%", height:"48%", background:"#D4561A", opacity:0.18, transform:"rotate(-1.5deg)" }} />
      <div style={{ position:"absolute", bottom:"-5%",  right:"-5%", width:"40%", height:"50%", background:"#2A6040", opacity:0.28, transform:"rotate(3deg)" }} />
      <div style={{ position:"absolute", top:"60%",  right:"15%", width:"28%", height:"35%", background:"#EDE5CC", opacity:0.04, transform:"rotate(-2.5deg)" }} />
      <div style={{ position:"absolute", top:"25%",  left:"45%",  width:"20%", height:"28%", background:"#C8A028", opacity:0.15, transform:"rotate(5deg)" }} />
      <div style={{ position:"absolute", bottom:"25%", left:"-2%", width:"24%", height:"30%", background:"#2A8080", opacity:0.22, transform:"rotate(-5deg)" }} />

      {/* White-ish torn paper scrap overlays (faded posters) */}
      <div style={{ position:"absolute", top:"8%",  right:"28%", width:"18%", height:"22%", background:"#F0E8D0", opacity:0.06, transform:"rotate(3deg)" }} />
      <div style={{ position:"absolute", bottom:"18%", left:"28%", width:"22%", height:"18%", background:"#EDE5CC", opacity:0.05, transform:"rotate(-2deg)" }} />

      {/* ── Orange duct tape strips ── */}
      {([
        { top:"11%", left:"6%",   w:150, h:24, rot:-40 },
        { top:"48%", left:"32%",  w:110, h:20, rot:-26 },
        { bottom:"18%", right:"8%",  w:140, h:24, rot:20 },
        { top:"68%", left:"2%",   w:100, h:18, rot:-16 },
        { top:"24%", right:"2%",  w:88,  h:22, rot:44 },
        { bottom:"42%", left:"54%", w:92, h:18, rot:-30 },
        { top:"80%", right:"30%", w:120, h:20, rot:12 },
      ] as { top?:string; bottom?:string; left?:string; right?:string; w:number; h:number; rot:number }[]).map((t,i) => (
        <div key={`ot${i}`} style={{
          position:"absolute", top:t.top, bottom:t.bottom, left:t.left, right:t.right,
          width:t.w, height:t.h,
          background:"repeating-linear-gradient(90deg,#B84E10CC,#D4621AEE 10px,#B84E10CC 14px)",
          transform:`rotate(${t.rot}deg)`,
          boxShadow:"1px 4px 14px rgba(0,0,0,0.55)",
          opacity:0.88,
        }} />
      ))}

      {/* ── Blue/teal duct tape strips ── */}
      {([
        { top:"6%",  right:"18%", w:128, h:20, rot:16 },
        { top:"54%", left:"44%",  w:100, h:18, rot:-9 },
        { bottom:"8%", left:"28%", w:160, h:22, rot:22 },
        { top:"36%", right:"28%", w:78,  h:18, rot:-37 },
        { top:"78%", right:"42%", w:110, h:20, rot:9 },
      ] as { top?:string; bottom?:string; left?:string; right?:string; w:number; h:number; rot:number }[]).map((t,i) => (
        <div key={`bt${i}`} style={{
          position:"absolute", top:t.top, bottom:t.bottom, left:t.left, right:t.right,
          width:t.w, height:t.h,
          background:"repeating-linear-gradient(90deg,#1A5070CC,#206090EE 10px,#1A5070CC 14px)",
          transform:`rotate(${t.rot}deg)`,
          boxShadow:"1px 4px 14px rgba(0,0,0,0.55)",
          opacity:0.80,
        }} />
      ))}

      {/* ── Hand-drawn scribbles matching logo style ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.08 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        {/* squiggly lines */}
        <path d="M70 115 Q200 80 295 158 Q375 228 465 122 Q538 48 625 142" stroke="#EDE5CC" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M920 68 Q1005 148 1038 88 Q1078 28 1162 98 Q1244 165 1335 70" stroke="#EDE5CC" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M188 608 Q295 552 350 628 Q410 700 510 646 Q612 590 660 668" stroke="#EDE5CC" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* doodle shapes */}
        <path d="M958 715 L1068 688 L1008 762 L1118 742" stroke="#EDE5CC" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="1362" cy="198" r="44" stroke="#EDE5CC" strokeWidth="2.5" fill="none" strokeDasharray="9 7"/>
        <circle cx="108" cy="762" r="28" stroke="#EDE5CC" strokeWidth="2" fill="none" strokeDasharray="6 9"/>
        <circle cx="725" cy="852" r="18" stroke="#D4561A" strokeWidth="2" fill="none" strokeDasharray="4 6" opacity="0.4"/>
        {/* lightning / arrow */}
        <path d="M705 398 L728 372 L748 428 L765 370 L788 435" stroke="#D4561A" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.4"/>
        {/* small doodles */}
        <path d="M395 300 C420 272 444 320 456 288 S488 265 500 298" stroke="#EDE5CC" strokeWidth="2" fill="none"/>
        <line x1="42" y1="455" x2="188" y2="488" stroke="#EDE5CC" strokeWidth="1.5" strokeDasharray="4 10" opacity="0.45"/>
        <line x1="1285" y1="608" x2="1435" y2="575" stroke="#EDE5CC" strokeWidth="1.5" strokeDasharray="4 10" opacity="0.45"/>
        {/* sticker outlines */}
        <rect x="1048" y="648" width="185" height="82" fill="none" stroke="#EDE5CC" strokeWidth="1.5" strokeDasharray="6 8" transform="rotate(6 1140 689)" opacity="0.14"/>
        <rect x="58" y="178" width="124" height="56" fill="none" stroke="#EDE5CC" strokeWidth="1.5" strokeDasharray="5 7" transform="rotate(-8 120 206)" opacity="0.12"/>
        {/* small star */}
        <path d="M840 302 L845 290 L850 302 L862 302 L852 310 L856 322 L845 314 L834 322 L838 310 L828 302 Z" stroke="#C8A028" strokeWidth="1.5" fill="none" opacity="0.3"/>
        {/* watermark text */}
        <text x="1108" y="498" fontFamily="'Bebas Neue',sans-serif" fontSize="40" fill="#EDE5CC" transform="rotate(-11 1108 498)" opacity="0.05">POSTER</text>
        <text x="50" y="356" fontFamily="sans-serif" fontSize="17" fill="#D4561A" transform="rotate(5 50 356)" opacity="0.16">WHO DID THIS?</text>
        <text x="795" y="152" fontFamily="sans-serif" fontSize="13" fill="#EDE5CC" transform="rotate(-3 795 152)" opacity="0.07">SABOTEUR</text>
      </svg>

      {/* ── Paper grain overlay ── */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:"160px", opacity:0.06, mixBlendMode:"overlay",
      }} />
    </div>
  );
}

export function TapeH({ color = "#C4681A", width = 90, style = {} }: { color?: string; width?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)",
      width, height:26,
      background:`repeating-linear-gradient(90deg,${color}AA,${color}EE 10px,${color}AA 14px)`,
      boxShadow:"0 2px 12px rgba(0,0,0,0.55)",
      zIndex:2, ...style,
    }} />
  );
}

export function TapeCorner({ color = "#C4681A", corner = "tl", style = {} }: { color?: string; corner?: "tl"|"tr"|"bl"|"br"; style?: React.CSSProperties }) {
  const positions: Record<string, React.CSSProperties> = {
    tl: { top:-10, left:-10, transform:"rotate(-45deg)" },
    tr: { top:-10, right:-10, transform:"rotate(45deg)" },
    bl: { bottom:-10, left:-10, transform:"rotate(45deg)" },
    br: { bottom:-10, right:-10, transform:"rotate(-45deg)" },
  };
  return (
    <div style={{
      position:"absolute", width:56, height:20,
      background:`repeating-linear-gradient(90deg,${color}AA,${color}EE 10px,${color}AA 14px)`,
      boxShadow:"0 2px 8px rgba(0,0,0,0.5)",
      ...positions[corner], ...style,
    }} />
  );
}
