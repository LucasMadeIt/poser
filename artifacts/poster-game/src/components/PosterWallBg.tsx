// Two SVG-noise data URIs — fine grain + coarse grain
const FINE   = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`;
const COARSE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.32' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23c)'/%3E%3C/svg%3E")`;

type BlockP = { bg: string; opacity?: number } & React.CSSProperties;

function NoisyBlock({ bg, opacity = 0.88, ...pos }: BlockP) {
  return (
    <div style={{ position:"absolute", overflow:"hidden", opacity, ...pos }}>
      {/* solid colour */}
      <div style={{ position:"absolute", inset:0, background:bg }} />
      {/* fine grain overlay — adds grit to the colour */}
      <div style={{ position:"absolute", inset:0, backgroundImage:FINE,   backgroundSize:"170px", opacity:0.28, mixBlendMode:"overlay"   as React.CSSProperties["mixBlendMode"] }} />
      {/* coarse grain — worn/aged depth */}
      <div style={{ position:"absolute", inset:0, backgroundImage:COARSE, backgroundSize:"330px", opacity:0.18, mixBlendMode:"multiply"  as React.CSSProperties["mixBlendMode"] }} />
    </div>
  );
}

export function PosterWallBg() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, background:"#F0E8D8", overflow:"hidden", pointerEvents:"none" }}>

      {/* ── Big vivid textured colour blocks ── */}
      <NoisyBlock bg="#1C3A60" opacity={0.92} top="-12%" left="-8%"  width="52%" height="65%" transform="rotate(-4deg)" />
      <NoisyBlock bg="#D4561A" opacity={0.88} top="-6%"  left="8%"   width="36%" height="44%" transform="rotate(2.5deg)" />
      <NoisyBlock bg="#2A8080" opacity={0.85} top="-8%"  right="-8%" width="48%" height="58%" transform="rotate(3.8deg)" />
      <NoisyBlock bg="#C8A028" opacity={0.80} top="20%"  right="5%"  width="30%" height="40%" transform="rotate(-5deg)" />
      <NoisyBlock bg="#8B1A10" opacity={0.88} top="32%"  left="-6%"  width="38%" height="50%" transform="rotate(5deg)" />
      <NoisyBlock bg="#1C3A60" opacity={0.72} top="46%"  left="26%"  width="42%" height="46%" transform="rotate(-2.5deg)" />
      <NoisyBlock bg="#D4561A" opacity={0.78} bottom="-12%" left="4%"  width="60%" height="52%" transform="rotate(-2deg)" />
      <NoisyBlock bg="#1A5A30" opacity={0.82} bottom="-8%"  right="-6%" width="46%" height="56%" transform="rotate(3.5deg)" />
      <NoisyBlock bg="#F0E8D0" opacity={0.65} top="58%"  right="12%" width="32%" height="38%" transform="rotate(-3deg)" />
      <NoisyBlock bg="#C8A028" opacity={0.70} top="22%"  left="48%"  width="22%" height="30%" transform="rotate(6deg)" />
      <NoisyBlock bg="#2A8080" opacity={0.75} bottom="22%" left="-3%" width="28%" height="34%" transform="rotate(-6deg)" />
      {/* accent patches */}
      <NoisyBlock bg="#E8302A" opacity={0.55} top="14%"  left="30%"  width="18%" height="24%" transform="rotate(-3deg)" />
      <NoisyBlock bg="#F5C842" opacity={0.60} bottom="8%"  left="38%" width="16%" height="20%" transform="rotate(4deg)" />
      <NoisyBlock bg="#2A4AAA" opacity={0.50} top="70%"  left="14%"  width="22%" height="18%" transform="rotate(-2deg)" />
      <NoisyBlock bg="#F0E8D0" opacity={0.82} top="4%"   right="30%" width="14%" height="20%" transform="rotate(2deg)" />
      <NoisyBlock bg="#8B1A10" opacity={0.55} bottom="35%" right="5%" width="18%" height="16%" transform="rotate(-4deg)" />

      {/* ── Ripped white/cream paper scraps ── */}
      <div style={{ position:"absolute", top:"6%",  right:"26%", width:"22%", height:"26%", background:"#FAFAF5", opacity:0.82, transform:"rotate(3.5deg)",  boxShadow:"3px 6px 18px rgba(0,0,0,0.25)" }} />
      <div style={{ position:"absolute", bottom:"16%", left:"26%", width:"26%", height:"20%", background:"#F5F0E8", opacity:0.78, transform:"rotate(-2.5deg)", boxShadow:"3px 6px 18px rgba(0,0,0,0.25)" }} />
      <div style={{ position:"absolute", top:"48%",  left:"6%",   width:"16%", height:"24%", background:"#FFFDF5", opacity:0.70, transform:"rotate(4deg)" }} />

      {/* ── Orange duct tape strips ── */}
      {([
        { top:"10%",  left:"4%",   w:160, h:26, rot:-42 },
        { top:"50%",  left:"30%",  w:120, h:22, rot:-28 },
        { bottom:"15%", right:"6%", w:150, h:26, rot:22 },
        { top:"70%",  left:"0%",   w:110, h:20, rot:-18 },
        { top:"22%",  right:"0%",  w:95,  h:24, rot:46 },
        { bottom:"40%", left:"52%", w:100, h:20, rot:-32 },
        { top:"82%",  right:"28%", w:130, h:22, rot:14 },
        { top:"36%",  left:"18%",  w:80,  h:18, rot:58 },
      ] as { top?:string; bottom?:string; left?:string; right?:string; w:number; h:number; rot:number }[]).map((t,i) => (
        <div key={`ot${i}`} style={{
          position:"absolute", top:t.top, bottom:t.bottom, left:t.left, right:t.right,
          width:t.w, height:t.h,
          background:"repeating-linear-gradient(90deg,#B84E10EE,#D4621AFF 10px,#B84E10EE 14px)",
          transform:`rotate(${t.rot}deg)`,
          boxShadow:"2px 5px 16px rgba(0,0,0,0.55)",
          opacity:0.95,
        }} />
      ))}

      {/* ── Teal/blue tape strips ── */}
      {([
        { top:"4%",   right:"16%", w:140, h:22, rot:18 },
        { top:"56%",  left:"42%",  w:110, h:20, rot:-11 },
        { bottom:"6%",  left:"26%", w:170, h:24, rot:24 },
        { top:"38%",  right:"26%", w:86,  h:20, rot:-40 },
        { top:"76%",  right:"40%", w:120, h:22, rot:11 },
        { top:"62%",  left:"60%",  w:75,  h:18, rot:-22 },
      ] as { top?:string; bottom?:string; left?:string; right?:string; w:number; h:number; rot:number }[]).map((t,i) => (
        <div key={`bt${i}`} style={{
          position:"absolute", top:t.top, bottom:t.bottom, left:t.left, right:t.right,
          width:t.w, height:t.h,
          background:"repeating-linear-gradient(90deg,#1A5070EE,#206090FF 10px,#1A5070EE 14px)",
          transform:`rotate(${t.rot}deg)`,
          boxShadow:"2px 5px 16px rgba(0,0,0,0.55)",
          opacity:0.90,
        }} />
      ))}

      {/* ── Mustard tape strips ── */}
      {([
        { top:"16%",  left:"60%",  w:100, h:18, rot:30 },
        { bottom:"28%", right:"22%", w:88, h:18, rot:-15 },
      ] as { top?:string; bottom?:string; left?:string; right?:string; w:number; h:number; rot:number }[]).map((t,i) => (
        <div key={`mt${i}`} style={{
          position:"absolute", top:t.top, bottom:t.bottom, left:t.left, right:t.right,
          width:t.w, height:t.h,
          background:"repeating-linear-gradient(90deg,#A88010EE,#C8A028FF 10px,#A88010EE 14px)",
          transform:`rotate(${t.rot}deg)`,
          boxShadow:"2px 4px 12px rgba(0,0,0,0.5)",
          opacity:0.85,
        }} />
      ))}

      {/* ── Street art scribbles / graffiti ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.22 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M65 108 Q210 72 310 155 Q395 230 490 118 Q568 40 660 148" stroke="#FAFAF5" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M940 60 Q1020 155 1055 82 Q1098 22 1188 98 Q1268 170 1365 65" stroke="#FAFAF5" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M182 618 Q302 558 360 638 Q422 712 528 654 Q628 595 678 678" stroke="#FAFAF5" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M978 725 L1085 695 L1022 768 L1130 748" stroke="#FAFAF5" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="1378" cy="195" r="52" stroke="#FAFAF5" strokeWidth="3" fill="none" strokeDasharray="10 8"/>
        <circle cx="102"  cy="770" r="34" stroke="#FAFAF5" strokeWidth="2.5" fill="none" strokeDasharray="7 10"/>
        <circle cx="735"  cy="858" r="22" stroke="#D4561A" strokeWidth="3" fill="none" strokeDasharray="5 7"/>
        <path d="M715 408 L740 378 L762 438 L782 375 L808 445" stroke="#D4561A" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M388 295 C416 265 444 318 460 284 S496 260 512 298" stroke="#FAFAF5" strokeWidth="2.5" fill="none"/>
        <line x1="38"  y1="460" x2="192" y2="496" stroke="#FAFAF5" strokeWidth="2" strokeDasharray="5 12" opacity="0.6"/>
        <line x1="1295" y1="615" x2="1440" y2="580" stroke="#FAFAF5" strokeWidth="2" strokeDasharray="5 12" opacity="0.6"/>
        <rect x="1058" y="655" width="192" height="88" fill="none" stroke="#FAFAF5" strokeWidth="2" strokeDasharray="7 9" transform="rotate(6 1154 699)" opacity="0.35"/>
        <rect x="52"  y="182" width="132" height="60" fill="none" stroke="#FAFAF5" strokeWidth="2" strokeDasharray="6 8" transform="rotate(-8 118 212)" opacity="0.28"/>
        <path d="M848 310 L854 295 L860 310 L875 310 L863 320 L868 335 L854 326 L840 335 L845 320 L833 310 Z" stroke="#C8A028" strokeWidth="2" fill="none" opacity="0.6"/>
        <text x="1118" y="505" fontFamily="'Bebas Neue',sans-serif" fontSize="55" fill="#FAFAF5" transform="rotate(-12 1118 505)" opacity="0.12">POSTER</text>
        <text x="42"   y="362" fontFamily="sans-serif" fontSize="20" fill="#D4561A" transform="rotate(5 42 362)" opacity="0.30">WHO DID THIS?</text>
        <text x="808"  y="155" fontFamily="sans-serif" fontSize="15" fill="#FAFAF5" transform="rotate(-3 808 155)" opacity="0.15">SABOTEUR</text>
        <text x="1220" y="345" fontFamily="sans-serif" fontSize="13" fill="#F5F0E8" transform="rotate(8 1220 345)" opacity="0.12">IMPOSTER</text>
        <path d="M280 0 Q282 35 278 60 Q275 85 280 110" stroke="#D4561A" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.4"/>
        <path d="M620 0 Q623 28 619 50 Q616 72 621 90" stroke="#C8A028" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.35"/>
        <path d="M1100 0 Q1103 40 1098 68 Q1094 96 1100 118" stroke="#2A8080" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.35"/>
      </svg>

      {/* ── Global grain layers — heavy, like printed paper ── */}
      {/* Fine screen-space grain */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage: FINE,
        backgroundSize:"170px",
        opacity:0.13,
        mixBlendMode:"overlay" as React.CSSProperties["mixBlendMode"],
      }} />
      {/* Coarse worn-paper grain */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage: COARSE,
        backgroundSize:"340px",
        opacity:0.09,
        mixBlendMode:"multiply" as React.CSSProperties["mixBlendMode"],
      }} />
      {/* Subtle screen layer — lifts texture off dark areas */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage: FINE,
        backgroundSize:"220px",
        opacity:0.06,
        mixBlendMode:"screen" as React.CSSProperties["mixBlendMode"],
      }} />
    </div>
  );
}

export function TapeH({ color = "#C4681A", width = 90, style = {} }: { color?: string; width?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)",
      width, height:28,
      background:`repeating-linear-gradient(90deg,${color}CC,${color}FF 10px,${color}CC 14px)`,
      boxShadow:"0 3px 14px rgba(0,0,0,0.45)",
      zIndex:2, ...style,
    }} />
  );
}

export function TapeCorner({ color = "#C4681A", corner = "tl", style = {} }: { color?: string; corner?: "tl"|"tr"|"bl"|"br"; style?: React.CSSProperties }) {
  const positions: Record<string, React.CSSProperties> = {
    tl: { top:-11, left:-11, transform:"rotate(-45deg)" },
    tr: { top:-11, right:-11, transform:"rotate(45deg)" },
    bl: { bottom:-11, left:-11, transform:"rotate(45deg)" },
    br: { bottom:-11, right:-11, transform:"rotate(-45deg)" },
  };
  return (
    <div style={{
      position:"absolute", width:60, height:22,
      background:`repeating-linear-gradient(90deg,${color}CC,${color}FF 10px,${color}CC 14px)`,
      boxShadow:"0 2px 10px rgba(0,0,0,0.45)",
      ...positions[corner], ...style,
    }} />
  );
}
