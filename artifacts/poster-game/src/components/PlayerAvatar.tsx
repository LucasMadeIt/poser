/* Deterministic playful SVG avatar — head + hat + eyes + mouth */

function hashId(id: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

type HeadShape = "circle" | "squircle" | "hex" | "oval" | "diamond";
type HatType   = "none" | "flatcap" | "cowboy" | "wizard" | "crown" | "party" | "beanie";
type EyeType   = "normal" | "heart" | "shades" | "star" | "cute";
type MouthType = "smile" | "grin" | "smirk";

const HEADS:  HeadShape[] = ["circle","squircle","hex","oval","diamond"];
const HATS:   HatType[]   = ["none","flatcap","cowboy","wizard","crown","party","beanie"];
const EYES:   EyeType[]   = ["normal","heart","shades","star","cute"];
const MOUTHS: MouthType[] = ["smile","grin","smirk"];

function Head({ shape, color }: { shape: HeadShape; color: string }) {
  const stroke = "#1C3A60";
  const sw = 2;
  switch (shape) {
    case "circle":
      return <circle cx="24" cy="30" r="18" fill={color} stroke={stroke} strokeWidth={sw} />;
    case "squircle":
      return <rect x="6" y="12" width="36" height="36" rx="14" ry="14" fill={color} stroke={stroke} strokeWidth={sw} />;
    case "hex":
      return <polygon points="24,12 38,20 38,38 24,46 10,38 10,20" fill={color} stroke={stroke} strokeWidth={sw} />;
    case "oval":
      return <ellipse cx="24" cy="30" rx="16" ry="20" fill={color} stroke={stroke} strokeWidth={sw} />;
    case "diamond":
      return <rect x="8" y="12" width="32" height="36" rx="10" ry="10" fill={color} stroke={stroke} strokeWidth={sw} transform="rotate(5 24 30)" />;
  }
}

function Hat({ type, color }: { type: HatType; color: string }) {
  if (type === "none") return null;
  const darkColor = "#1C3A60";
  const accentMap: Record<HatType, string> = {
    none:"", flatcap:darkColor, cowboy:"#6B4C11", wizard:"#6A1A8A", crown:"#C8A028", party:"#D4561A", beanie:"#2A8080"
  };
  const hatColor = accentMap[type];
  switch (type) {
    case "flatcap":
      return (<g>
        <ellipse cx="24" cy="14" rx="18" ry="4.5" fill={hatColor} />
        <rect x="10" y="8" width="28" height="8" rx="4" fill={hatColor} />
      </g>);
    case "cowboy":
      return (<g>
        <ellipse cx="24" cy="16" rx="22" ry="4" fill={hatColor} />
        <rect x="13" y="5" width="22" height="12" rx="6" fill={hatColor} />
        <ellipse cx="24" cy="5" rx="9" ry="4" fill="#8B6914" />
      </g>);
    case "wizard":
      return (<g>
        <polygon points="24,0 14,16 34,16" fill={hatColor} />
        <ellipse cx="24" cy="16" rx="12" ry="3.5" fill="#8B2FAE" />
        <circle cx="24" cy="4" r="2" fill="#F1C40F" />
        <circle cx="19" cy="10" r="1.2" fill="#F1C40F" />
        <circle cx="29" cy="8" r="1.2" fill="#F1C40F" />
      </g>);
    case "crown":
      return (<g>
        <polygon points="10,16 14,6 18,14 24,4 30,14 34,6 38,16" fill="#C8A028" stroke="#8A6800" strokeWidth="1" />
        <rect x="10" y="14" width="28" height="6" rx="2" fill="#C8A028" />
        <circle cx="18" cy="9" r="2" fill="#D4561A" />
        <circle cx="24" cy="5" r="2" fill="#2A8080" />
        <circle cx="30" cy="9" r="2" fill="#D4561A" />
      </g>);
    case "party":
      return (<g>
        <polygon points="24,1 13,16 35,16" fill={color} stroke="#8A3008" strokeWidth="1" />
        <ellipse cx="24" cy="16" rx="11" ry="3" fill="#D4561A" />
        <circle cx="24" cy="1" r="2.5" fill="#C8A028" />
        {[14,19,29,33].map((x,i)=><circle key={i} cx={x} cy={9+(i%2)*3} r="1.5" fill={["#fff","#2A8080","#C8A028","#fff"][i]} />)}
      </g>);
    case "beanie":
      return (<g>
        <ellipse cx="24" cy="14" rx="17" ry="11" fill="#2A8080" />
        <rect x="7" y="17" width="34" height="6" rx="3" fill="#1C3A60" />
        <circle cx="24" cy="5" r="4" fill="#D4561A" />
      </g>);
    default: return null;
  }
}

function Eyes({ type }: { type: EyeType }) {
  const lx = 17, rx = 31, y = 27;
  switch (type) {
    case "normal":
      return (<g>
        <circle cx={lx} cy={y} r="4.5" fill="white" />
        <circle cx={rx} cy={y} r="4.5" fill="white" />
        <circle cx={lx+1} cy={y+1} r="2.5" fill="#1C3A60" />
        <circle cx={rx+1} cy={y+1} r="2.5" fill="#1C3A60" />
        <circle cx={lx+2} cy={y} r="1" fill="white" />
        <circle cx={rx+2} cy={y} r="1" fill="white" />
      </g>);
    case "heart":
      return (<g>
        {([lx,rx] as number[]).map((cx,i)=>(
          <g key={i} transform={`translate(${cx-4},${y-4})`}>
            <path d="M4 2 C4 0 2 0 2 2 C2 0 0 0 0 2 C0 4 4 7 4 7 C4 7 8 4 8 2 C8 0 6 0 6 2 Z" fill="#E87DBB" />
          </g>
        ))}
      </g>);
    case "shades":
      return (<g>
        <rect x={lx-5} y={y-4} width="10" height="7" rx="3.5" fill="#1a1a1a" />
        <rect x={rx-5} y={y-4} width="10" height="7" rx="3.5" fill="#1a1a1a" />
        <line x1={lx+5} y1={y} x2={rx-5} y2={y} stroke="#1a1a1a" strokeWidth="1.5" />
        <line x1={lx-5} y1={y} x2={lx-8} y2={y-1} stroke="#1a1a1a" strokeWidth="1.5" />
        <line x1={rx+5} y1={y} x2={rx+8} y2={y-1} stroke="#1a1a1a" strokeWidth="1.5" />
      </g>);
    case "star":
      return (<g>
        {([lx,rx] as number[]).map((cx,i)=>(
          <text key={i} x={cx} y={y+3.5} textAnchor="middle" fontSize="10" fill="#C8A028">★</text>
        ))}
      </g>);
    case "cute":
      return (<g>
        <circle cx={lx} cy={y} r="4" fill="white" />
        <circle cx={rx} cy={y} r="4" fill="white" />
        <ellipse cx={lx+0.5} cy={y+1} rx="2" ry="2.5" fill="#1C3A60" />
        <ellipse cx={rx+0.5} cy={y+1} rx="2" ry="2.5" fill="#1C3A60" />
        <circle cx={lx+1} cy={y} r="0.8" fill="white" />
        <circle cx={rx+1} cy={y} r="0.8" fill="white" />
        {/* eyelashes */}
        <line x1={lx-3} y1={y-4} x2={lx-2} y2={y-2} stroke="#1C3A60" strokeWidth="1" />
        <line x1={lx}   y1={y-4.5} x2={lx}   y2={y-2.5} stroke="#1C3A60" strokeWidth="1" />
        <line x1={rx-3} y1={y-4} x2={rx-2} y2={y-2} stroke="#1C3A60" strokeWidth="1" />
        <line x1={rx}   y1={y-4.5} x2={rx}   y2={y-2.5} stroke="#1C3A60" strokeWidth="1" />
      </g>);
  }
}

function Mouth({ type }: { type: MouthType }) {
  const y = 37;
  switch (type) {
    case "smile":
      return <path d="M17 37 Q24 43 31 37" stroke="#1C3A60" strokeWidth="2" fill="none" strokeLinecap="round" />;
    case "grin":
      return (<g>
        <path d="M16 36 Q24 44 32 36" fill="white" stroke="#1C3A60" strokeWidth="1.5" />
        <path d="M16 36 Q24 44 32 36" fill="none" stroke="#1C3A60" strokeWidth="1.5" />
      </g>);
    case "smirk":
      return <path d={`M17 ${y} Q22 ${y+4} 30 ${y-2}`} stroke="#1C3A60" strokeWidth="2" fill="none" strokeLinecap="round" />;
  }
}

function Blush() {
  return (<g>
    <ellipse cx="13" cy="33" rx="5" ry="3" fill="#E87DBB" opacity="0.4" />
    <ellipse cx="35" cy="33" rx="5" ry="3" fill="#E87DBB" opacity="0.4" />
  </g>);
}

export function PlayerAvatar({ playerId, color, size = 48, showBorder = false }: {
  playerId: string;
  color: string;
  size?: number;
  showBorder?: boolean;
}) {
  const head  = HEADS [hashId(playerId, 17) % HEADS.length];
  const hat   = HATS  [hashId(playerId, 31) % HATS.length];
  const eyes  = EYES  [hashId(playerId, 47) % EYES.length];
  const mouth = MOUTHS[hashId(playerId, 61) % MOUTHS.length];
  const blush = hashId(playerId, 79) % 3 === 0;

  return (
    <svg
      viewBox="0 0 48 52"
      width={size}
      height={Math.round(size * 52 / 48)}
      style={{ display: "block", filter: showBorder ? `drop-shadow(0 0 3px ${color}88)` : undefined }}
    >
      <Head shape={head} color={color} />
      <Hat  type={hat}   color={color} />
      <Eyes type={eyes} />
      <Mouth type={mouth} />
      {blush && <Blush />}
    </svg>
  );
}
