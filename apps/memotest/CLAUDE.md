# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server (port 3001)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm type-check` - Check TypeScript types

## What this app is

A single-player memory card game (MemoTest) for DarSalud event stands. Spanish-language,
frontend-only (no backend, no database, no environment variables).

**Target device:** Lenovo Tab M11 in **landscape** (1280×800 CSS px, DPR 1.5, 90 Hz), installed
as a PWA. The "PWA" is only `public/manifest.json` (fullscreen, landscape); there is no service
worker, so every launch loads from Vercel and needs network.

## Technology Stack

- **Framework**: Next.js 15 (App Router), TypeScript strict
- **State**: Zustand (single store, `devtools` in development only, nothing persisted)
- **Styling**: Tailwind CSS v4 (no JS config; custom CSS lives in `globals.css` inside `@layer`)
- **Animations**: CSS only (`transform` / `opacity`). No animation library.
- **Audio**: Web Audio API, synthesized (no audio files)
- **Icons**: own inline SVG set (`components/game/cardIcons.tsx`)

## Architecture

### The store drives the round; components only draw

`src/store/memoStore.ts` owns the whole sequence: phases, clock, sounds and waits. Components
have no timers and no flow effects; they render state and report taps.

```
waiting → ready → memorizing → playing → success → prize
                                   └──────────────→ failed
```

| Phase | What happens |
|---|---|
| `waiting` | Waiting screen. A tap calls `startGame()` |
| `ready` | Board with cards face down for `readyTime` |
| `memorizing` | Cards face up for `memorizationTime` |
| `playing` | Player flips cards; clock counts down `gameTime` |
| `success` | Required pairs found; board stays visible for `SUCCESS_HOLD_MS` |
| `prize` | Pick 1 of 3 cards; `prizeStage` tracks choosing → revealing → (winner-shown) → result |
| `failed` | Defeat screen (no reachable win, or time up) |

Store actions: `startGame`, `flipCard`, `pickPrizeCard`, `keepAlive`, `resetGame`.

Key behaviours:
- **Timers live at module level** (`schedule` / `cancelPending`), not in state. Every
  `startGame` / `resetGame` cancels whatever the previous round left pending.
- **The round outcome is decided in the same step that resolves a pair** (`resolvePair`). If the
  round is over, the board is locked from that instant; only the screen change is delayed.
- **Idle return**: on `prize` and `failed`, `IDLE_RETURN_MS` without a touch returns to
  `waiting`. Any pointerdown (`keepAlive`) re-arms it.
- **Screen changes** go through `changeScreen` in the store, which wraps
  `utils/screenTransition.ts` (View Transitions API with `flushSync`; falls back to an instant
  change). The state update runs on the next frame, not synchronously, so while a change is
  pending every action ignores input (`isChangingScreen`) and anything that depends on the new
  screen (timers, idle return) is scheduled inside the update callback.

### Rules and timings: one file

`src/services/game/memoService.ts` holds `GAME_CONFIG`, every timing constant, the icon id list
and the pure logic (`createCards`, `createPrizeCards`, `evaluateRound`). Change rules there.

`FLIP_MS` is passed to CSS as `--flip-ms` from `GameBoard`, so JS waits and CSS durations
cannot drift apart.

### Components

```
src/
├── app/
│   ├── page.tsx         # MemoGame + "rotate device" notice
│   ├── layout.tsx       # Metadata, ErrorBoundary
│   └── globals.css      # All custom CSS, inside @layer
├── components/
│   ├── game/
│   │   ├── MemoGame.tsx       # Picks the screen for the current phase
│   │   ├── WaitingScreen.tsx
│   │   ├── GameBoard.tsx      # Single board for ready → success; HUD + card grid
│   │   ├── MemoCard.tsx       # One card; subscribes only to its own state
│   │   ├── cardIcons.tsx      # SVG icon set
│   │   ├── PrizePhase.tsx
│   │   ├── DefeatScreen.tsx
│   │   └── EndPanel.tsx       # Final message + actions (prize result and defeat)
│   └── ui/
│       ├── ErrorBoundary.tsx  # Reloads the page after 5 s in production (kiosk)
│       └── TimerCircle.tsx
├── services/
│   ├── audio/audioService.ts  # Named sounds; notes scheduled on the AudioContext clock
│   └── game/
│       ├── clockService.ts    # 1 Hz countdown with drift correction
│       └── memoService.ts     # Rules, timings, pure logic
├── store/memoStore.ts
└── utils/screenTransition.ts
```

## Performance rules

These were set in the October 2026 optimization. Keep them when changing the UI.

1. **Animate only `transform` and `opacity`**, in CSS. They run on the compositor, independent
   of the main thread and of the refresh rate. No JS-driven animation, no animation library.
2. **No `backdrop-filter`, `filter` or `drop-shadow`** on anything that animates or sits over
   animated content. Use solid semi-opaque backgrounds.
3. **Subscribe narrowly.** Never call `useMemoStore()` without a selector. Selectors must return
   primitives or stable references. Read actions with `useMemoStore.getState()` in handlers.
   Only `HudTimer` subscribes to `timeLeft`: the 1 Hz tick must not re-render anything else.
4. **The board mounts once per round.** Phase changes only swap HUD text. The HUD has a fixed
   height so the grid never moves.
5. **3D flip constraints** (`.flip-card` in `globals.css`): `.flip-card__inner` must not get
   `overflow`, `opacity`, `filter` or `contain: paint` (any of them flattens the 3D).
   `will-change: transform` is permanent on it so layers are not created and destroyed per flip.
6. **Custom CSS goes inside `@layer`.** In Tailwind v4 unlayered CSS beats utilities.
7. **Nothing is written to localStorage.**

## Card icons

`cardIcons.tsx` has 9 line icons for the current event (Cuidados Paliativos). Each round draws
`totalPairs` of them at random. Rules for the set:
- 48×48 viewBox, `stroke="currentColor"`: the colour comes from CSS.
- Every icon needs a clearly different silhouette (the game is unfair otherwise).
- To change the set for another event: edit `CARD_ICON_IDS` in `memoService.ts` and the shapes
  in `cardIcons.tsx` (the `Record<CardIconId, …>` type forces both to match).

## Testing

- Performance tests live at the repo root: `tests/memotest.spec.ts` (see `PERFORMANCE_TESTING.md`).
  They rely on `data-testid` / `data-state` / `data-phase` / `data-icon` attributes; keep them.
- `benchmarks/memotest-before.json` is the reference run from before the optimization.

## Deployment

- **Root Directory**: `apps/memotest`
- **Build Command**: `cd ../.. && pnpm build --filter=@games-platform/memotest`
- **Install Command**: `cd ../.. && pnpm install`
- **Output Directory**: `.next`
- **Environment Variables**: none
