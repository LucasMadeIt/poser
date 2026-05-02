export type PlayerColor = "#3ECFCF" | "#E87DBB" | "#F5A623" | "#9B59B6" | "#F1C40F";

export type Player = {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isImposter: boolean;
  eliminated: boolean;
  score: number;
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
  /** Freedraw: path points in absolute canvas coordinates */
  points?: { x: number; y: number }[];
  /** Freedraw: stroke width in px */
  strokeWidth?: number;
  /** Explicit text / label colour for elements that have content */
  textColor?: string;
  /** Triangle: 3 vertex positions in absolute canvas coordinates */
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

export type ReplayEvent = {
  type: "add" | "update" | "delete";
  elementId: string;
  element?: CanvasElement;
  updates?: Partial<CanvasElement>;
  playerId: string;
  playerName: string;
  playerColor: string;
  timestamp: number;
};

export type ImposterObjective = {
  styleName: string;
  style: string;
  objectiveName: string;
  objective: string;
};

export type RoomState = {
  id: string;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  prompt: string;
  canvas: CanvasElement[];
  messages: ChatMessage[];
  results: RoundResult[];
  phaseEndTime: number;
  imposterId?: string;
  players: Player[];
  myRole: "imposter" | "crewmate";
  votes?: Record<string, string>;
  voteTally?: Record<string, number>;
  doneVotes?: string[];
  challengeMode?: boolean;
  challengeHint?: boolean;
  challengeHintType?: string;
  myConstraint?: string;
  imposterMeta?: ImposterObjective;
  /** Canvas edit history — populated once design phase ends */
  replayEvents?: ReplayEvent[];
};
