export const DESIGN_PROMPTS = [
  "Design a dashboard UI for a personal finance tracker",
  "Design a budget focused, food delivery app home screen",
];

export function pickPrompts(_count: number): string[] {
  const shuffled = [...DESIGN_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 1);
}

export const PHASE_DURATIONS = {
  design: 300_000,
  chat: 90_000,
  vote: 45_000,
  results: 8_000,
};
