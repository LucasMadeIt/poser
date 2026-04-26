import type { CanvasElement, Player } from "./gameState.js";

type ScoreResult = {
  scores: Record<string, number>;
  feedback: string;
};

const FEEDBACK_LINES = [
  "Some strong contributions, but the layout feels unresolved.",
  "Interesting use of elements — composition could be tighter.",
  "Good variety, though colour choices clash in places.",
  "Solid structure with a few elements that feel out of place.",
  "Typography and shapes work together well overall.",
  "The hierarchy is unclear — someone sabotaged the visual flow.",
  "Nice balance of types, but a couple of elements feel off-brand.",
  "Layout has potential; a rogue element dragged the score down.",
];

export async function scoreRound(
  prompt: string,
  canvas: CanvasElement[],
  players: Player[]
): Promise<ScoreResult> {
  const scores: Record<string, number> = {};

  const elementsByPlayer: Record<string, CanvasElement[]> = {};
  for (const el of canvas) {
    if (!elementsByPlayer[el.ownerId]) elementsByPlayer[el.ownerId] = [];
    elementsByPlayer[el.ownerId].push(el);
  }

  for (const player of players) {
    const els = elementsByPlayer[player.id] ?? [];
    const base = els.length === 0 ? 30 : Math.min(90, 45 + els.length * 8);
    const jitter = Math.floor(Math.random() * 16) - 8;
    scores[player.id] = Math.max(0, Math.min(100, base + jitter));
  }

  const feedback = FEEDBACK_LINES[Math.floor(Math.random() * FEEDBACK_LINES.length)];

  return { scores, feedback };
}
