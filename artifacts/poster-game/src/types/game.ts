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
    | "framemobile" | "frameweb";
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
};
