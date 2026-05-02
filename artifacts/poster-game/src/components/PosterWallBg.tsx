export function PosterWallBg() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, background:"#111009", overflow:"hidden", pointerEvents:"none" }}>

      {/* ── Faded poster colour patches ── */}
      <div style={{ position:"absolute", top:"-10%", left:"-5%", width:"50%", height:"65%", background:"#1B3A6E", opacity:0.13, transform:"rotate(-3.8deg)" }} />
      <div style={{ position:"absolute", top:"20%", right:"-8%", width:"44%", height:"58%", background:"#7A3208", opacity:0.11, transform:"rotate(2.6deg)" }} />
      <div style={{ position:"absolute", bottom:"-14%", left:"12%", width:"58%", height:"50%", background:"#5E4A00", opacity:0.10, transform:"rotate(-1.8deg)" }} />
      <div style={{ position:"absolute", top:"32%", left:"-4%", width:"30%", height:"42%", background:"#0E1E3A", opacity:0.19, transform:"rotate(4.2deg)" }} />
      <div style={{ position:"absolute", bottom:"8%", right:"-4%", width:"38%", height:"40%", background:"#1A3A5A", opacity:0.14, transform:"rotate(3deg)" }} />
      <div style={{ position:"absolute", top:"8%", right:"12%", width:"22%", height:"28%", background:"#F0E8D0", opacity:0.025, transform:"rotate(-2.5deg)" }} />

      {/* ── Orange duct tape strips ── */}
      {([
        { top:"13%", left:"7%",  w:148, h:24, rot:-38 },
        { top:"46%", left:"30%", w:110, h:20, rot:-26 },
        { bottom:"20%", right:"10%", w:136, h:22, rot:18 },
        { top:"70%", left:"4%",  w:100, h:18, rot:-14 },
        { top:"26%", right:"4%", w:88,  h:20, rot:43 },
        { bottom:"38%", left:"52%", w:92, h:18, rot:-32 },
      ] as { top?:string; bottom?:string; left?:string; right?:string; w:number; h:number; rot:number }[]).map((t,i) => (
        <div key={`ot${i}`} style={{
          position:"absolute", top:t.top, bottom:t.bottom, left:t.left, right:t.right,
          width:t.w, height:t.h,
          background:"repeating-linear-gradient(90deg,#A85210CC,#CC6218EE 10px,#A85210CC 14px)",
          transform:`rotate(${t.rot}deg)`,
          boxShadow:"1px 4px 14px rgba(0,0,0,0.5)",
          opacity:0.82,
        }} />
      ))}

      {/* ── Blue duct tape strips ── */}
      {([
        { top:"7%",  right:"20%", w:124, h:20, rot:16 },
        { top:"56%", left:"42%",  w:100, h:18, rot:-9 },
        { bottom:"10%", left:"30%", w:156, h:22, rot:22 },
        { top:"38%", right:"30%", w:78,  h:18, rot:-36 },
        { top:"80%", right:"40%", w:108, h:20, rot:8 },
      ] as { top?:string; bottom?:string; left?:string; right?:string; w:number; h:number; rot:number }[]).map((t,i) => (
        <div key={`bt${i}`} style={{
          position:"absolute", top:t.top, bottom:t.bottom, left:t.left, right:t.right,
          width:t.w, height:t.h,
          background:"repeating-linear-gradient(90deg,#144068CC,#1A5888EE 10px,#144068CC 14px)",
          transform:`rotate(${t.rot}deg)`,
          boxShadow:"1px 4px 14px rgba(0,0,0,0.5)",
          opacity:0.76,
        }} />
      ))}

      {/* ── Hand-drawn scribbles & doodles ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.065 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M70 110 Q200 80 290 155 Q370 225 460 125 Q535 45 620 140" stroke="#E8E2D9" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M920 70 Q1000 145 1035 88 Q1075 30 1160 96 Q1240 162 1330 72" stroke="#E8E2D9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M190 605 Q295 550 348 625 Q408 698 508 645 Q608 590 658 665" stroke="#E8E2D9" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M960 710 L1065 685 L1005 758 L1115 738" stroke="#E8E2D9" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="1360" cy="195" r="42" stroke="#E8E2D9" strokeWidth="2.5" fill="none" strokeDasharray="9 7"/>
        <circle cx="110" cy="760" r="28" stroke="#E8E2D9" strokeWidth="2" fill="none" strokeDasharray="6 9"/>
        <circle cx="720" cy="850" r="18" stroke="#CC2200" strokeWidth="2" fill="none" strokeDasharray="4 6" opacity="0.5"/>
        <path d="M700 395 L722 372 L744 425 L762 368 L784 432" stroke="#CC2200" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.35"/>
        <path d="M395 298 C418 272 442 318 454 287 S486 265 498 298" stroke="#E8E2D9" strokeWidth="2" fill="none"/>
        <line x1="45" y1="455" x2="188" y2="488" stroke="#E8E2D9" strokeWidth="1.5" strokeDasharray="4 10" opacity="0.45"/>
        <line x1="1285" y1="605" x2="1430" y2="572" stroke="#E8E2D9" strokeWidth="1.5" strokeDasharray="4 10" opacity="0.45"/>
        <path d="M595 808 Q648 782 660 826 Q674 868 724 844" stroke="#E8E2D9" strokeWidth="2" fill="none"/>
        <path d="M280 800 Q260 820 285 840 Q310 860 300 880" stroke="#E8E2D9" strokeWidth="2" fill="none"/>
        <text x="1110" y="498" fontFamily="'Bebas Neue',sans-serif" fontSize="36" fill="#E8E2D9" transform="rotate(-11 1110 498)" opacity="0.06">POSTER</text>
        <text x="52" y="355" fontFamily="sans-serif" fontSize="16" fill="#CC2200" transform="rotate(5 52 355)" opacity="0.14">WHO DID THIS?</text>
        <text x="800" y="150" fontFamily="sans-serif" fontSize="13" fill="#E8E2D9" transform="rotate(-3 800 150)" opacity="0.07">SABOTEUR</text>
        <rect x="1050" y="650" width="180" height="80" fill="none" stroke="#E8E2D9" strokeWidth="1.5" strokeDasharray="6 8" transform="rotate(6 1140 690)" opacity="0.12"/>
        <rect x="60" y="180" width="120" height="55" fill="none" stroke="#E8E2D9" strokeWidth="1.5" strokeDasharray="5 7" transform="rotate(-8 120 207)" opacity="0.1"/>
        <path d="M 840 300 Q 860 280 880 295 Q 900 310 920 285" stroke="#E8E2D9" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>

      {/* ── Paper grain overlay ── */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:"160px",
        opacity:0.055,
        mixBlendMode:"overlay",
      }} />
    </div>
  );
}

// Tape strip used on panels
export function TapeH({ color = "#C4681A", width = 90, style = {} }: { color?: string; width?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)",
      width, height:26,
      background:`repeating-linear-gradient(90deg,${color}AA,${color}EE 10px,${color}AA 14px)`,
      boxShadow:"0 2px 12px rgba(0,0,0,0.55)",
      zIndex:2,
      ...style,
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
      ...positions[corner],
      ...style,
    }} />
  );
}
