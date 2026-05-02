const FINE    = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`;
const COARSE  = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.32' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23c)'/%3E%3C/svg%3E")`;
const TURBULENT = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.05 0.08' numOctaves='5' seed='8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23t)'/%3E%3C/svg%3E")`;
const GRAIN2  = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' seed='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g2)'/%3E%3C/svg%3E")`;

type BlockP = { bg: string; opacity?: number } & React.CSSProperties;

function NoisyBlock({ bg, opacity = 0.88, ...pos }: BlockP) {
  return (
    <div style={{ position:"absolute", overflow:"hidden", opacity, ...pos }}>
      <div style={{ position:"absolute", inset:0, background:bg }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:FINE,     backgroundSize:"170px", opacity:0.32, mixBlendMode:"overlay"  as React.CSSProperties["mixBlendMode"] }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:COARSE,   backgroundSize:"330px", opacity:0.22, mixBlendMode:"multiply" as React.CSSProperties["mixBlendMode"] }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:TURBULENT,backgroundSize:"400px", opacity:0.10, mixBlendMode:"screen"   as React.CSSProperties["mixBlendMode"] }} />
    </div>
  );
}

export function PosterWallBg() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, background:"#EDE5D4", overflow:"hidden", pointerEvents:"none" }}>

      {/* ── Big vivid textured colour blocks ── */}
      <NoisyBlock bg="#1C3A60" opacity={0.72} top="-12%" left="-8%"  width="52%" height="65%" transform="rotate(-4deg)" />
      <NoisyBlock bg="#D4561A" opacity={0.68} top="-6%"  left="8%"   width="36%" height="44%" transform="rotate(2.5deg)" />
      <NoisyBlock bg="#2A8080" opacity={0.65} top="-8%"  right="-8%" width="48%" height="58%" transform="rotate(3.8deg)" />
      <NoisyBlock bg="#C8A028" opacity={0.60} top="20%"  right="5%"  width="30%" height="40%" transform="rotate(-5deg)" />
      <NoisyBlock bg="#8B1A10" opacity={0.68} top="32%"  left="-6%"  width="38%" height="50%" transform="rotate(5deg)" />
      <NoisyBlock bg="#1C3A60" opacity={0.54} top="46%"  left="26%"  width="42%" height="46%" transform="rotate(-2.5deg)" />
      <NoisyBlock bg="#D4561A" opacity={0.58} bottom="-12%" left="4%"  width="60%" height="52%" transform="rotate(-2deg)" />
      <NoisyBlock bg="#1A5A30" opacity={0.62} bottom="-8%"  right="-6%" width="46%" height="56%" transform="rotate(3.5deg)" />
      <NoisyBlock bg="#F0E8D0" opacity={0.50} top="58%"  right="12%" width="32%" height="38%" transform="rotate(-3deg)" />
      <NoisyBlock bg="#C8A028" opacity={0.52} top="22%"  left="48%"  width="22%" height="30%" transform="rotate(6deg)" />
      <NoisyBlock bg="#2A8080" opacity={0.55} bottom="22%" left="-3%" width="28%" height="34%" transform="rotate(-6deg)" />
      <NoisyBlock bg="#E8302A" opacity={0.38} top="14%"  left="30%"  width="18%" height="24%" transform="rotate(-3deg)" />
      <NoisyBlock bg="#F5C842" opacity={0.42} bottom="8%"  left="38%" width="16%" height="20%" transform="rotate(4deg)" />
      <NoisyBlock bg="#2A4AAA" opacity={0.34} top="70%"  left="14%"  width="22%" height="18%" transform="rotate(-2deg)" />
      <NoisyBlock bg="#F0E8D0" opacity={0.60} top="4%"   right="30%" width="14%" height="20%" transform="rotate(2deg)" />
      <NoisyBlock bg="#8B1A10" opacity={0.38} bottom="35%" right="5%" width="18%" height="16%" transform="rotate(-4deg)" />
      {/* extra mid-tone patches */}
      <NoisyBlock bg="#4A1A70" opacity={0.30} top="8%"   left="55%"  width="16%" height="22%" transform="rotate(-7deg)" />
      <NoisyBlock bg="#C8601A" opacity={0.25} bottom="50%" right="32%" width="12%" height="18%" transform="rotate(9deg)" />
      <NoisyBlock bg="#1A4A3A" opacity={0.28} top="80%"  left="52%"  width="20%" height="22%" transform="rotate(-3deg)" />

      {/* ── Diagonal crosshatch hatching ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.055 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hatch" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#1a1208" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hatch)"/>
      </svg>

      {/* ── Ripped white/cream paper scraps ── */}
      <div style={{ position:"absolute", top:"6%",  right:"26%", width:"22%", height:"26%", background:"#FAFAF5", opacity:0.82, transform:"rotate(3.5deg)",  boxShadow:"3px 6px 18px rgba(0,0,0,0.25)" }} />
      <div style={{ position:"absolute", bottom:"16%", left:"26%", width:"26%", height:"20%", background:"#F5F0E8", opacity:0.78, transform:"rotate(-2.5deg)", boxShadow:"3px 6px 18px rgba(0,0,0,0.25)" }} />
      <div style={{ position:"absolute", top:"48%",  left:"6%",   width:"16%", height:"24%", background:"#FFFDF5", opacity:0.70, transform:"rotate(4deg)" }} />
      {/* extra scraps */}
      <div style={{ position:"absolute", top:"18%",  right:"8%",   width:"10%", height:"14%", background:"#F8F4EE", opacity:0.65, transform:"rotate(-6deg)", boxShadow:"2px 4px 12px rgba(0,0,0,0.20)" }} />
      <div style={{ position:"absolute", bottom:"38%", right:"28%", width:"14%", height:"10%", background:"#FAFAF2", opacity:0.58, transform:"rotate(5.5deg)", boxShadow:"2px 4px 10px rgba(0,0,0,0.18)" }} />
      <div style={{ position:"absolute", top:"60%",  right:"48%",  width:"8%",  height:"18%", background:"#FFFFF8", opacity:0.52, transform:"rotate(-3deg)" }} />

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
        { top:"62%",  right:"14%", w:72,  h:16, rot:-50 },
        { bottom:"58%", left:"8%", w:90,  h:16, rot:35 },
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
        { bottom:"70%", right:"6%",  w:65,  h:16, rot:52 },
        { top:"90%",  left:"72%",  w:100, h:18, rot:-8 },
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
        { top:"44%",  left:"2%",    w:78, h:16, rot:62 },
        { bottom:"18%", left:"60%", w:92, h:18, rot:-20 },
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

      {/* ── Ink bleed / paint splatter circles ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.10, pointerEvents:"none" }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <circle cx="220"  cy="155" r="38" fill="#D4561A" opacity="0.55"/>
        <circle cx="1310" cy="720" r="52" fill="#1C3A60" opacity="0.50"/>
        <circle cx="680"  cy="820" r="28" fill="#C8A028" opacity="0.60"/>
        <circle cx="1180" cy="140" r="20" fill="#2A8080" opacity="0.55"/>
        <circle cx="90"   cy="560" r="16" fill="#8B1A10" opacity="0.65"/>
        <circle cx="800"  cy="45"  r="24" fill="#D4561A" opacity="0.45"/>
        <circle cx="440"  cy="760" r="18" fill="#F5C842" opacity="0.50"/>
        <ellipse cx="1060" cy="490" rx="32" ry="18" fill="#1A5A30" opacity="0.40" transform="rotate(-20 1060 490)"/>
        <ellipse cx="340"  cy="420" rx="22" ry="12" fill="#C8A028" opacity="0.45" transform="rotate(15 340 420)"/>
      </svg>

      {/* ── Street art scribbles / graffiti ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.14 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M65 108 Q210 72 310 155 Q395 230 490 118 Q568 40 660 148" stroke="#FAFAF5" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M940 60 Q1020 155 1055 82 Q1098 22 1188 98 Q1268 170 1365 65" stroke="#FAFAF5" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M182 618 Q302 558 360 638 Q422 712 528 654 Q628 595 678 678" stroke="#FAFAF5" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M978 725 L1085 695 L1022 768 L1130 748" stroke="#FAFAF5" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="1378" cy="195" r="52" stroke="#FAFAF5" strokeWidth="3" fill="none" strokeDasharray="10 8"/>
        <circle cx="102"  cy="770" r="34" stroke="#FAFAF5" strokeWidth="2.5" fill="none" strokeDasharray="7 10"/>
        <circle cx="735"  cy="858" r="22" stroke="#D4561A" strokeWidth="3" fill="none" strokeDasharray="5 7"/>
        <circle cx="570"  cy="200" r="44" stroke="#C8A028" strokeWidth="2" fill="none" strokeDasharray="12 6" opacity="0.5"/>
        <circle cx="1200" cy="560" r="30" stroke="#2A8080" strokeWidth="2.5" fill="none" strokeDasharray="8 5" opacity="0.45"/>
        <path d="M715 408 L740 378 L762 438 L782 375 L808 445" stroke="#D4561A" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M388 295 C416 265 444 318 460 284 S496 260 512 298" stroke="#FAFAF5" strokeWidth="2.5" fill="none"/>
        <path d="M1050 350 C1075 320 1110 370 1130 335 S1165 310 1190 348" stroke="#C8A028" strokeWidth="2" fill="none" opacity="0.55"/>
        <path d="M250 480 Q290 440 330 480 Q370 520 410 478" stroke="#FAFAF5" strokeWidth="2" fill="none" opacity="0.40"/>
        <line x1="38"  y1="460" x2="192" y2="496" stroke="#FAFAF5" strokeWidth="2" strokeDasharray="5 12" opacity="0.6"/>
        <line x1="1295" y1="615" x2="1440" y2="580" stroke="#FAFAF5" strokeWidth="2" strokeDasharray="5 12" opacity="0.6"/>
        <line x1="600" y1="0" x2="580" y2="900" stroke="#FAFAF5" strokeWidth="1" strokeDasharray="18 14" opacity="0.08"/>
        <line x1="900" y1="0" x2="920" y2="900" stroke="#D4561A" strokeWidth="1" strokeDasharray="14 18" opacity="0.10"/>
        <rect x="1058" y="655" width="192" height="88" fill="none" stroke="#FAFAF5" strokeWidth="2" strokeDasharray="7 9" transform="rotate(6 1154 699)" opacity="0.35"/>
        <rect x="52"  y="182" width="132" height="60" fill="none" stroke="#FAFAF5" strokeWidth="2" strokeDasharray="6 8" transform="rotate(-8 118 212)" opacity="0.28"/>
        <rect x="820" y="580" width="88"  height="55" fill="none" stroke="#C8A028" strokeWidth="2" strokeDasharray="5 6" transform="rotate(-4 864 608)" opacity="0.25"/>
        <path d="M848 310 L854 295 L860 310 L875 310 L863 320 L868 335 L854 326 L840 335 L845 320 L833 310 Z" stroke="#C8A028" strokeWidth="2" fill="none" opacity="0.6"/>
        <path d="M1280 380 L1286 365 L1292 380 L1307 380 L1295 390 L1300 405 L1286 396 L1272 405 L1277 390 L1265 380 Z" stroke="#FAFAF5" strokeWidth="1.5" fill="none" opacity="0.30"/>
        <text x="1118" y="505" fontFamily="'Bebas Neue',sans-serif" fontSize="55" fill="#FAFAF5" transform="rotate(-12 1118 505)" opacity="0.13">POSTER</text>
        <text x="42"   y="362" fontFamily="sans-serif" fontSize="20" fill="#D4561A" transform="rotate(5 42 362)" opacity="0.32">WHO DID THIS?</text>
        <text x="808"  y="155" fontFamily="sans-serif" fontSize="15" fill="#FAFAF5" transform="rotate(-3 808 155)" opacity="0.16">SABOTEUR</text>
        <text x="1220" y="345" fontFamily="sans-serif" fontSize="13" fill="#F5F0E8" transform="rotate(8 1220 345)" opacity="0.14">IMPOSTER</text>
        <text x="480"  y="680" fontFamily="'Bebas Neue',sans-serif" fontSize="38" fill="#C8A028" transform="rotate(-6 480 680)" opacity="0.11">DESIGN</text>
        <text x="1040" y="820" fontFamily="sans-serif" fontSize="11" fill="#FAFAF5" transform="rotate(3 1040 820)" opacity="0.18">SUSPECT</text>
        <text x="150"  y="820" fontFamily="'Bebas Neue',sans-serif" fontSize="32" fill="#8B1A10" transform="rotate(-4 150 820)" opacity="0.20">GUILTY</text>
        <text x="700"  y="420" fontFamily="sans-serif" fontSize="10" fill="#FAFAF5" transform="rotate(-2 700 420)" opacity="0.08">VOTE THEM OUT</text>
        <path d="M280 0 Q282 35 278 60 Q275 85 280 110" stroke="#D4561A" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.4"/>
        <path d="M620 0 Q623 28 619 50 Q616 72 621 90" stroke="#C8A028" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.35"/>
        <path d="M1100 0 Q1103 40 1098 68 Q1094 96 1100 118" stroke="#2A8080" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.35"/>
        <path d="M0 280 Q35 282 60 278 Q85 275 110 280" stroke="#1C3A60" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.30"/>
        <path d="M0 650 Q28 653 50 649 Q72 646 90 651" stroke="#D4561A" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.25"/>
      </svg>

      {/* ── Circular stamp / ink ring marks ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.07, pointerEvents:"none" }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <circle cx="480"  cy="320" r="70" stroke="#1C3A60" strokeWidth="8" fill="none" opacity="0.6"/>
        <circle cx="480"  cy="320" r="58" stroke="#1C3A60" strokeWidth="2" fill="none" opacity="0.4"/>
        <circle cx="1060" cy="660" r="55" stroke="#D4561A" strokeWidth="7" fill="none" opacity="0.55"/>
        <circle cx="1060" cy="660" r="44" stroke="#D4561A" strokeWidth="1.5" fill="none" opacity="0.35"/>
        <circle cx="200"  cy="700" r="42" stroke="#C8A028" strokeWidth="6" fill="none" opacity="0.50"/>
        <circle cx="1340" cy="240" r="36" stroke="#2A8080" strokeWidth="5" fill="none" opacity="0.45"/>
      </svg>

      {/* ── Global grain layers ── */}
      <div style={{ position:"absolute", inset:0, backgroundImage:FINE,     backgroundSize:"170px", opacity:0.10, mixBlendMode:"overlay"    as React.CSSProperties["mixBlendMode"] }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:COARSE,   backgroundSize:"340px", opacity:0.07, mixBlendMode:"multiply"   as React.CSSProperties["mixBlendMode"] }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:GRAIN2,   backgroundSize:"120px", opacity:0.04, mixBlendMode:"overlay"    as React.CSSProperties["mixBlendMode"] }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:TURBULENT,backgroundSize:"600px", opacity:0.04, mixBlendMode:"soft-light" as React.CSSProperties["mixBlendMode"] }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:FINE,     backgroundSize:"220px", opacity:0.05, mixBlendMode:"screen"     as React.CSSProperties["mixBlendMode"] }} />

      {/* ── Vignette ── */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(10,6,0,0.22) 100%)" }} />
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
