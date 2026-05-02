# POSTER — Multiplayer Design Game

## Overview

Full-stack real-time multiplayer browser game (Among Us-style for UI/UX designers). One player is the secret imposter who subtly ruins the group's shared design canvas.

pnpm workspace monorepo using TypeScript.

## Stack

- **Frontend**: React + Vite (`artifacts/poster-game`) — port via `PORT` env var
- **Backend**: Express + Socket.io (`artifacts/api-server`) — port 8080
- **Monorepo tool**: pnpm workspaces
- **Node.js**: 24, **TypeScript**: 5.9

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/poster-game run typecheck` — frontend only
- `pnpm --filter @workspace/api-server run typecheck` — backend only

## Colors & Fonts (design system)

- ORANGE=#D4561A, NAVY=#1C3A60, TEAL=#2A8080, MUSTARD=#C8A028, CREAM=#EDE5CC
- Fonts: Bebas Neue (headers), DM Sans (body)
- Canvas: 900×560px

## Key Files

- `artifacts/poster-game/src/pages/GamePage.tsx` — main game canvas page (~1540 lines)
- `artifacts/poster-game/src/types/game.ts` — shared frontend types (CanvasElement etc)
- `artifacts/api-server/src/game/gameState.ts` — server-side game state + types
- `artifacts/api-server/src/game/socketHandlers.ts` — all socket event handlers
- `artifacts/poster-game/src/pages/ResultsPage.tsx` — voting + results + SVG export

## CanvasElement Types

Supported element types: `text`, `heading`, `rect`, `circle`, `label`, `button`, `divider`, `input`, `searchbar`, `dropdown`, `checkbox`, `radio`, `toggle`, `navbar`, `tabbar`, `sidebar`, `breadcrumb`, `listitem`, `card`, `badge`, `tag`, `progress`, `alert`, `toast`, `modal`, `fab`, `framemobile`, `frameweb`, `image`, `video`, `freedraw`, `triangle`

New fields (added for drawing tools):
- `points?: {x,y}[]` — freedraw path points (absolute canvas coords)
- `strokeWidth?: number` — freedraw pen width
- `vertices?: {x,y}[]` — triangle vertex positions (absolute canvas coords)

## Drawing Tools (GamePage)

Tool strip at top of left panel. Three tools: **Select** (V), **Pencil** (P), **Triangle** (G). Escape returns to Select.

- **Pencil**: mousedown starts stroke, mousemove collects points (throttled 30fps preview), mouseup commits `freedraw` element. Color swatches + 3 width options shown in tool strip.
- **Triangle**: click anywhere on canvas places equilateral triangle. When selected: orange vertex handles allow per-vertex drag editing, live-updates via socket.
- **Select**: default mode — drag/resize/select elements as before.

## Game Features

- 3–6 players, real-time canvas via Socket.io
- Imposter role (hidden from others), majority vote to end round
- Canvas preserved between rounds (imposter's sabotages persist)
- Voice chat (push-to-talk mic button)
- SVG export on Results page
- Player cursors always visible
- 5-minute design timer per round
