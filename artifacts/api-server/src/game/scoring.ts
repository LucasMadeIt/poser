import Anthropic from "@anthropic-ai/sdk";
import type { CanvasElement, Player } from "./gameState.js";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

type ScoreResult = {
  scores: Record<string, number>;
  feedback: string;
};

export async function scoreRound(
  prompt: string,
  canvas: CanvasElement[],
  players: Player[]
): Promise<ScoreResult> {
  if (!client) {
    const scores: Record<string, number> = {};
    players.forEach((p) => {
      scores[p.id] = Math.floor(Math.random() * 40) + 50;
    });
    return {
      scores,
      feedback: "AI scoring unavailable — no ANTHROPIC_API_KEY set.",
    };
  }

  const canvasSummary = canvas.map((el) => ({
    type: el.type,
    position: `(${Math.round(el.x)}, ${Math.round(el.y)})`,
    size: `${Math.round(el.width)}×${Math.round(el.height)}`,
    content: el.content ?? "",
    fill: el.fill,
    owner: players.find((p) => p.id === el.ownerId)?.name ?? "unknown",
  }));

  const playerList = players.map((p) => ({ id: p.id, name: p.name }));

  const userMessage = `You are judging a multiplayer design game called POSTER.

The design brief was: "${prompt}"

Here are the elements placed on the collaborative canvas by each player:
${JSON.stringify(canvasSummary, null, 2)}

Players in this game:
${JSON.stringify(playerList, null, 2)}

Score each player 0-100 based on:
- How much their elements contribute positively to the design brief (0-100)
- Quality of their contribution (appropriate type, placement, size, color)
- One player is the "imposter" who is trying to subtly ruin the design — their contributions may be off-brand, misplaced, ugly, or wrong. Give them a lower score if their work is clearly bad.
- If a player placed no elements, give them 30 points.

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "scores": { "player_id_1": 75, "player_id_2": 80 },
  "feedback": "One short sentence of overall design feedback."
}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 500,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);

    const scores: Record<string, number> = {};
    for (const player of players) {
      const raw = parsed.scores?.[player.id] ?? parsed.scores?.[player.name];
      scores[player.id] = typeof raw === "number" ? Math.max(0, Math.min(100, Math.round(raw))) : 50;
    }

    return {
      scores,
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "Design round complete.",
    };
  } catch {
    const scores: Record<string, number> = {};
    players.forEach((p) => {
      scores[p.id] = Math.floor(Math.random() * 40) + 50;
    });
    return { scores, feedback: "Scoring timed out — points awarded randomly." };
  }
}
