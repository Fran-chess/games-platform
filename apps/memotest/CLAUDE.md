# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server (port 3001)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting
- `pnpm type-check` - Check TypeScript types

## Project Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand with immer middleware
- **Styling**: Tailwind CSS v4 with PostCSS
- **Animations**: Framer Motion (optimized with CSS transitions)
- **Audio**: Web Audio API (synthesized sounds)
- **Icons**: Emoji-based (no icon libraries)

### Core Application Structure

This is a **single-player memory card game** (MemoTest) designed for tablet use at DarSalud events.

**Game Flow:**
1. **WaitingScreen** - Initial screen with branding
2. **Shuffling Phase** - Cards are shuffled with animation
3. **Memorization Phase** - Player has 5 seconds to memorize card positions
4. **Playing Phase** - Player finds 2 matching pairs in 3 moves max
5. **Success/Failed** - Result screen
6. **Prize Phase** - Winner selects from 3 mystery cards

### Key Components Architecture

#### State Management (Zustand Store)
- `src/store/memoStore.ts` - Single store with all game state
  - Game phases: `'waiting' | 'shuffling' | 'memorizing' | 'playing' | 'success' | 'failed' | 'prize'`
  - Cards state (12 cards, 6 pairs)
  - Game stats (moves, matches, time, score)
  - Actions for game logic
  - **Optimized**: devtools only enabled in development

#### Component Structure
- `components/game/` - Core game components
  - `MemoGame.tsx` - Main orchestrator
  - `MemorizationPhase.tsx` - Shuffling and memorization
  - `PlayingPhase.tsx` - Active gameplay
  - `PrizePhase.tsx` - Prize selection screen
  - `DefeatModal.tsx` - Loss screen
  - `MemoCard.tsx` - Individual card (optimized animations)
- `components/tv/screens/` - Branding screens
  - `WaitingScreen.tsx` - Initial landing screen
- `components/ui/` - Reusable UI components
  - `ErrorBoundary.tsx` - Error handling
  - `Logo.tsx` - DarSalud branding
  - `TimerCircle.tsx` - Countdown timer

#### Game Service
- `src/services/game/memoService.ts` - Business logic
  - Card generation and shuffling (Fisher-Yates)
  - Match validation
  - Score calculation
  - Prize card generation
  - Game state validation

#### Audio Service
- `src/services/audio/audioService.ts` - Web Audio API wrapper
  - Synthesized sound effects (no audio files)
  - Victory/defeat melodies
  - Card flip sounds

### Game Configuration

**Default Settings** (in `memoService.ts`):
```typescript
{
  totalPairs: 6,        // 12 cards total
  requiredPairs: 2,     // Must find 2 pairs to win
  maxMoves: 3,          // 3 attempts maximum
  memorizationTime: 5,  // 5 seconds to memorize
  gameTime: 120,        // 2 minutes to complete
  shuffleAnimationTime: 2  // 2 seconds shuffle animation
}
```

### Performance Optimizations

#### Applied Optimizations
1. **Zustand Middleware**: devtools disabled in production
2. **Card Animations**: 3D transforms removed, replaced with CSS opacity transitions
3. **Framer Motion**: Simplified to essential animations only
4. **Memoization**: `React.memo` on MemoCard component
5. **CSS Animations**: Native CSS keyframes for fade/scale effects

#### Animation Strategy
- ❌ **Removed**: `rotateY`, `preserve-3d`, complex motion values
- ✅ **Using**: `opacity`, `scale`, CSS transitions
- **Result**: ~40-50% reduction in GPU load

### Critical Implementation Details

#### Game State Flow
```
waiting → shuffling → memorizing → playing → (success/failed) → prize
           ↑_______________________________________________|
                        (restartGame)
```

**Important Functions:**
- `initGame()` - Initialize fresh game (goes to 'waiting')
- `restartGame()` - Quick restart (goes directly to 'shuffling', skips waiting)
- `resetGame()` - Back to waiting screen

#### Page Router Logic (`app/page.tsx`)
- Manages transition between WaitingScreen and MemoGame
- Detects "Volver al Inicio" action when gameState changes to 'waiting'
- Only shows WaitingScreen on initial load or explicit reset

#### Card Flip Logic
- Player can flip 2 cards per move
- After 2nd card flip, checks for match
- Match: cards stay flipped, increment matches
- No match: cards flip back after 800ms with shake animation
- Game ends when: 2 pairs found (win) OR 3 moves used (lose) OR time runs out (lose)

### Common Patterns

#### Error Handling
- `ErrorBoundary` component wraps the app
- Shows debug info only in development (`process.env.NODE_ENV === 'development'`)

#### Component Organization
```
src/
├── app/              # Next.js App Router
│   ├── page.tsx      # Main page (WaitingScreen ↔ MemoGame)
│   ├── layout.tsx    # Root layout with branding
│   └── globals.css   # Global styles and animations
├── components/
│   ├── game/         # Game-specific components
│   ├── tv/           # Branding/waiting screens
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
│   └── useMemoAudio.ts  # Audio management
├── services/         # Business logic services
│   ├── audio/        # Audio synthesis
│   └── game/         # Game rules and logic
├── store/            # Zustand state management
│   └── memoStore.ts  # Single store
├── types/            # TypeScript interfaces
└── utils/            # Utility functions
```

#### Data Flow
- **User Action** → **Zustand Action** → **State Update** → **Component Re-render**
- No API calls, no database, no external data sources
- All game state is ephemeral (resets on page reload)

## Important Notes

- This is a **Spanish-language application** for DarSalud events
- **Frontend-only** - No backend, no database, no API routes
- **Tablet-optimized** - Landscape orientation required
- Uses **medical-themed emojis** for cards (💉, 🩺, 💊, 🏥, etc.)
- **PWA-ready** - Has manifest.json and service worker
- **No external dependencies** for game logic (pure TypeScript)

## Environment Variables

**None required!**

The app uses only `process.env.NODE_ENV` which is automatically set by Next.js:
- `pnpm dev` → `NODE_ENV=development` (enables devtools)
- `pnpm build` → `NODE_ENV=production` (disables devtools)
- Vercel → `NODE_ENV=production` (automatic)

## Deployment

### Vercel Configuration
- **Root Directory**: `apps/memotest`
- **Build Command**: `cd ../.. && pnpm build --filter=@games-platform/memotest`
- **Install Command**: `cd ../.. && pnpm install`
- **Output Directory**: `.next`
- **Environment Variables**: None needed

### Build Output
- Optimized for production with Next.js static optimization
- All assets bundled and minified
- No server-side rendering required (can deploy as static export)

## Troubleshooting

### Common Issues

**Build Error: TypeScript Types**
- Run `pnpm type-check` to verify types
- Ensure all imports are correct
- Check Zustand store type definitions

**Animation Performance**
- Already optimized to use CSS transitions
- If still slow, check browser GPU acceleration
- Reduce `transition-duration` values in Tailwind classes

**Audio Not Playing**
- Web Audio API requires user interaction to start
- First click/tap on page initializes audio context
- Check browser console for audio errors

**Cards Not Flipping**
- Verify `isProcessing` state in Zustand store
- Check if move limit (maxMoves) has been reached
- Ensure cards are not already matched

## Architecture Decisions

### Why No Backend?
- Simple single-player game doesn't require persistence
- Faster development and deployment
- Zero infrastructure costs
- No security concerns with user data

### Why Zustand?
- Lightweight (~1KB)
- Simple API, no boilerplate
- Great TypeScript support
- Built-in devtools integration

### Why Synthesized Audio?
- No audio files to load (faster)
- Smaller bundle size
- Consistent cross-browser support
- Customizable sound effects via code

### Why CSS Transitions over Framer Motion?
- Better performance (GPU-accelerated)
- Simpler to maintain
- Smaller bundle size
- Framer Motion still used for complex orchestrations
