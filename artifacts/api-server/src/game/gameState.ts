import { nanoid } from "nanoid";

export type PlayerColor = "#3ECFCF" | "#E87DBB" | "#F5A623" | "#9B59B6" | "#F1C40F" | "#3498DB";
const COLORS: PlayerColor[] = ["#3ECFCF", "#E87DBB", "#F5A623", "#9B59B6", "#F1C40F", "#3498DB"];

export type Player = {
  id: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  isImposter: boolean;
  eliminated: boolean;
  score: number;
  socketId: string;
};

export type CanvasElement = {
  id: string;
  type:
    | "text" | "heading" | "rect" | "circle" | "label" | "button" | "divider"
    | "input" | "searchbar" | "dropdown" | "checkbox" | "radio" | "toggle"
    | "navbar" | "tabbar" | "sidebar" | "breadcrumb"
    | "listitem" | "card" | "badge" | "tag"
    | "progress" | "alert" | "toast" | "modal" | "fab"
    | "framemobile" | "frameweb"
    | "image" | "video"
    | "freedraw" | "triangle";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fill: string;
  stroke?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
  cornerRadius?: number;
  opacity?: number;
  imageUrl?: string;
  videoUrl?: string;
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  vertices?: { x: number; y: number }[];
  ownerId: string;
  zIndex: number;
};

export type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  text: string;
  timestamp: number;
};

export type GamePhase = "lobby" | "design" | "chat" | "vote" | "results" | "ended";

export type RoundResult = {
  round: number;
  prompt: string;
  scores: Record<string, number>;
  feedback: string;
  imposterId: string;
  caught: boolean;
};

export type ImposterObjective = {
  styleName: string;
  style: string;
  objectiveName: string;
  objective: string;
};

export type ConstraintType = "colorblind-rg" | "colorblind-by" | "no-undo" | "one-font";

export type ActiveConstraint = {
  playerId: string;
  type: ConstraintType;
};

export type Room = {
  id: string;
  players: Player[];
  phase: GamePhase;
  round: number;
  maxRounds: number;
  prompt: string;
  canvas: CanvasElement[];
  messages: ChatMessage[];
  votes: Record<string, string>;
  doneVotes: string[];
  results: RoundResult[];
  phaseEndTime: number;
  imposterId: string;
  phaseTimer?: ReturnType<typeof setTimeout>;
  imposterMeta?: ImposterObjective;
  challengeMode: boolean;
  activeConstraint?: ActiveConstraint;
};

const IMPOSTER_STYLES: { name: string; desc: string }[] = [
  { name: "Subtle Saboteur",  desc: "Make small, hard-to-notice mistakes" },
  { name: "Chaos Agent",      desc: "Introduce disorder and randomness" },
  { name: "The Minimalist",   desc: "Remove or under-design key elements" },
  { name: "Over-Designer",    desc: "Add unnecessary clutter and noise" },
];

const IMPOSTER_OBJECTIVES: { name: string; desc: string }[] = [
  { name: "Break Alignment",     desc: "Misalign elements in subtle, hard-to-spot ways" },
  { name: "Reduce Hierarchy",    desc: "Make important elements less visually dominant" },
  { name: "Inconsistent Sizing", desc: "Introduce random spacing or size discrepancies" },
  { name: "Reduce Clarity",      desc: "Make the overall UI harder to understand" },
];

const CONSTRAINT_TYPES: ConstraintType[] = ["colorblind-rg", "colorblind-by", "no-undo", "one-font"];

const rooms = new Map<string, Room>();

export function createRoom(hostSocketId: string, hostName: string): Room {
  const id = nanoid(6).toUpperCase();
  const host: Player = {
    id: nanoid(),
    name: hostName,
    color: COLORS[0],
    isHost: true,
    isImposter: false,
    eliminated: false,
    score: 0,
    socketId: hostSocketId,
  };
  const room: Room = {
    id,
    players: [host],
    phase: "lobby",
    round: 0,
    maxRounds: 4,
    prompt: "",
    canvas: [],
    messages: [],
    votes: {},
    doneVotes: [],
    results: [],
    phaseEndTime: 0,
    imposterId: "",
    challengeMode: false,
  };
  rooms.set(id, room);
  return room;
}

export function joinRoom(roomId: string, socketId: string, name: string): { room: Room; player: Player } | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.phase !== "lobby") return null;
  if (room.players.length >= 6) return null;

  const usedColors = new Set(room.players.map((p) => p.color));
  const availableColor = COLORS.find((c) => !usedColors.has(c)) ?? COLORS[0];

  const player: Player = {
    id: nanoid(),
    name,
    color: availableColor,
    isHost: false,
    isImposter: false,
    eliminated: false,
    score: 0,
    socketId,
  };

  room.players.push(player);
  return { room, player };
}

export function removePlayerBySocket(socketId: string): { room: Room; player: Player } | null {
  for (const room of rooms.values()) {
    const idx = room.players.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      const [player] = room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(room.id);
      } else if (player.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
      }
      return { room, player };
    }
  }
  return null;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomBySocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socketId === socketId)) return room;
  }
  return undefined;
}

export function getPlayerBySocket(room: Room, socketId: string): Player | undefined {
  return room.players.find((p) => p.socketId === socketId);
}

export function assignImposter(room: Room): void {
  const idx = Math.floor(Math.random() * room.players.length);
  room.players.forEach((p, i) => {
    p.isImposter = i === idx;
    if (i === idx) room.imposterId = p.id;
  });
}

export function assignImposterObjectives(room: Room): void {
  const s = IMPOSTER_STYLES[Math.floor(Math.random() * IMPOSTER_STYLES.length)];
  const o = IMPOSTER_OBJECTIVES[Math.floor(Math.random() * IMPOSTER_OBJECTIVES.length)];
  room.imposterMeta = {
    styleName: s.name,
    style: s.desc,
    objectiveName: o.name,
    objective: o.desc,
  };
}

export function assignConstraint(room: Room): void {
  room.activeConstraint = undefined;
  if (!room.challengeMode) return;
  const eligible = room.players.filter((p) => !p.isImposter && !p.eliminated);
  if (eligible.length === 0) return;
  const target = eligible[Math.floor(Math.random() * eligible.length)];
  const type = CONSTRAINT_TYPES[Math.floor(Math.random() * CONSTRAINT_TYPES.length)];
  room.activeConstraint = { playerId: target.id, type };
}

export function resetRound(room: Room): void {
  room.canvas = [];
  room.messages = [];
  room.votes = {};
  room.doneVotes = [];
  room.activeConstraint = undefined;
}

/** Like resetRound but keeps the canvas — used when the imposter escaped */
export function resetRoundKeepCanvas(room: Room): void {
  room.messages = [];
  room.votes = {};
  room.doneVotes = [];
  room.activeConstraint = undefined;
}

export function addCanvasElement(room: Room, element: Omit<CanvasElement, "id" | "zIndex">): CanvasElement {
  const el: CanvasElement = {
    ...element,
    id: nanoid(),
    zIndex: room.canvas.length,
  };
  room.canvas.push(el);
  return el;
}

export function updateCanvasElement(room: Room, elementId: string, updates: Partial<CanvasElement>): CanvasElement | null {
  const el = room.canvas.find((e) => e.id === elementId);
  if (!el) return null;
  Object.assign(el, updates);
  return el;
}

export function deleteCanvasElement(room: Room, elementId: string, requesterId?: string): boolean {
  const idx = requesterId
    ? room.canvas.findIndex((e) => e.id === elementId && e.ownerId === requesterId)
    : room.canvas.findIndex((e) => e.id === elementId);
  if (idx === -1) return false;
  room.canvas.splice(idx, 1);
  return true;
}

export function addChatMessage(room: Room, playerId: string, text: string): ChatMessage | null {
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;
  const msg: ChatMessage = {
    id: nanoid(),
    playerId,
    playerName: player.name,
    playerColor: player.color,
    text: text.slice(0, 300),
    timestamp: Date.now(),
  };
  room.messages.push(msg);
  return msg;
}

export function castVote(room: Room, voterId: string, targetId: string): void {
  room.votes[voterId] = targetId;
}

export function tallyVotes(room: Room): { mostVoted: string; isTie: boolean; hasMajority: boolean } {
  const activePlayers = room.players.filter((p) => !p.eliminated);
  const activeCount = activePlayers.length;
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(room.votes)) {
    if (targetId) tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  const max = Math.max(...Object.values(tally), 0);
  const leaders = Object.entries(tally).filter(([, v]) => v === max).map(([k]) => k);
  const hasMajority = leaders.length === 1 && max > activeCount / 2;
  return { mostVoted: leaders[0] ?? "", isTie: leaders.length > 1, hasMajority };
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}
