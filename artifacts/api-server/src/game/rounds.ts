export const DESIGN_PROMPTS = [
  "Design a hero section for a sustainable fashion brand",
  "Create a landing page layout for a meditation app",
  "Design a dashboard UI for a personal finance tracker",
  "Create a poster for an underground music festival",
  "Design a product card for a premium coffee brand",
  "Create a mobile app onboarding screen for a travel app",
  "Design a newsletter header for a design agency",
  "Create a UI for a recipe-sharing social platform",
  "Design an event invite for an art gallery opening",
  "Create a pitch deck slide for a tech startup",
  "Design a splash screen for a fitness tracking app",

  "Design a profile page for a creative portfolio site",
  "Create an error page (404) that's actually beautiful",
  "Design a checkout page for a luxury skincare brand",
];

export function pickPrompts(_count: number): string[] {
  // One prompt per game — locked at start and kept for all rounds
  const shuffled = [...DESIGN_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 1);
}

export const PHASE_DURATIONS = {
  design: 300_000,
  chat: 90_000,
  vote: 45_000,
  results: 8_000,
};
