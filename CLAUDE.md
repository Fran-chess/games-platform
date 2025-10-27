# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Monorepo Commands (from root)
```bash
# Development - Run specific app
pnpm dev --filter=@games-platform/roulette  # Port 3000
pnpm dev --filter=@games-platform/memotest  # Port 3001

# Development shortcuts
pnpm dev:roulette  # Start roulette app
pnpm dev:memotest  # Start memotest app

# Build commands
pnpm build --filter=@games-platform/roulette  # Build specific app
pnpm build                                     # Build all apps

# Linting and type checking
pnpm lint --filter=@games-platform/roulette   # Lint specific app
pnpm type-check                                # Type check all packages

# Code formatting
pnpm format  # Format all files with Prettier

# Clean build artifacts
pnpm clean  # Clean all build outputs and node_modules

# Performance testing
pnpm test:perf           # Run all performance tests (Playwright)
pnpm test:perf:memotest  # Test only memotest
pnpm test:perf:roulette  # Test only roulette
pnpm test:perf:report    # View HTML report
pnpm build:perf          # Build both games for production (required before testing)
```

**📊 For complete performance testing documentation, see [PERFORMANCE_TESTING.md](./PERFORMANCE_TESTING.md)**

### App-specific commands (from apps/[app-name])
```bash
pnpm dev         # Start development server
pnpm build       # Build for production
pnpm start       # Start production server
pnpm lint        # Run ESLint
pnpm type-check  # Check TypeScript types
pnpm clean       # Clean build artifacts
```

## High-Level Architecture

### Monorepo Structure
This is a **Turborepo + PNPM monorepo** containing multiple game applications and shared packages. The architecture promotes code reuse through shared packages while maintaining independent deployment capabilities for each app.

### Apps
- **`apps/roulette`** (port 3000): Interactive roulette game with question system, originally migrated from a standalone project. Features canvas-based wheel rendering, physics simulation, and audio management.
- **`apps/memotest`** (port 3001): Memory test game with card matching mechanics, memorization phases, and prize selection.

### Shared Packages
- **`@games-platform/ui`**: Minimal shared UI package containing only `MassiveConfetti` component (used by both games for victory celebrations)

### Technology Stack
- **Build System**: Turborepo for monorepo orchestration with caching
- **Package Manager**: PNPM with workspace protocol for efficient dependency management
- **Framework**: Next.js 15 (App Router) for all apps
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with PostCSS
- **State Management**: Zustand for global state
- **Animations**: Framer Motion for UI transitions
- **Icons**: Heroicons and React Icons

### Key Architectural Patterns

#### Package Dependencies
Apps have minimal shared dependencies following a pragmatic architecture:
- Only `@games-platform/ui` is shared (contains `MassiveConfetti` component)
- Each game has its own implementations of hooks, stores, and utilities tailored to specific needs
- Workspace protocol (`workspace:*`) ensures shared package changes are immediately available
- No version mismatch between packages
- Efficient development with hot module replacement

#### Build Pipeline
Turborepo manages the build pipeline with:
- Dependency graph-based task execution
- Intelligent caching for faster rebuilds
- Parallel execution where possible
- Task dependencies defined in `turbo.json`

#### Roulette Game Architecture
The roulette app implements:
- **Canvas-based rendering** (`canvasRenderer.ts`) for smooth wheel animation
- **Physics simulation** (`physics.ts`) for realistic spinning behavior
- **Question system** with categories loaded from JSON
- **Audio service** for sound effects management
- **Game state management** via Zustand store (`gameStore.ts`)
- **Responsive layouts** for different screen sizes
- **Prize modal** and timer components for game flow

### Deployment Configuration

#### Vercel Deployment
Each app can be deployed independently on Vercel with:
- **Root Directory**: `apps/[app-name]`
- **Build Command**: `cd ../.. && pnpm build --filter=@games-platform/[app-name]`
- **Install Command**: `cd ../.. && pnpm install`
- **Output Directory**: `.next`

#### Environment Variables
Apps may require environment-specific configuration. Check individual app CLAUDE.md files for specific requirements. The roulette app includes database configuration for Supabase integration.

### Development Workflow

#### Working on a specific app
1. Use filtered commands from root: `pnpm dev --filter=@games-platform/app-name`
2. Changes to shared packages automatically reflect in dependent apps
3. Turborepo caches unchanged package builds for efficiency

#### Adding new shared components
**Important**: Only add components to `@games-platform/ui` if they are **truly shared** by multiple games. The monorepo follows a minimal sharing philosophy:
1. Verify the component is needed by 2+ games
2. Add component to `packages/ui/src/components/`
3. Export from `packages/ui/src/index.ts`
4. Import in apps: `import { Component } from '@games-platform/ui'`

If a component is only used by one game, keep it in that game's `src/components/` directory.

#### Creating a new game
1. Copy existing app structure: `cp -r apps/roulette apps/new-game`
2. Update `package.json` name to `@games-platform/new-game`
3. Adjust development port to avoid conflicts (3002, 3003, etc.)
4. Implement game-specific logic locally - only extract to shared packages if reused across multiple games
5. Add dependency to `@games-platform/ui` only if using `MassiveConfetti` or other shared components

### Performance Optimizations
- Turborepo caching reduces rebuild times
- PNPM's efficient node_modules structure saves disk space (symlinks to central store)
- Minimal shared packages reduce build complexity
- Each game optimizes independently for its specific use case
- Next.js optimizations (code splitting, image optimization) apply to all apps

#### Performance Testing
Both games have comprehensive performance testing with Playwright measuring FPS, memory usage, load times, and Core Web Vitals:
- Run tests: `pnpm test:perf` (requires `pnpm build:perf` first)
- View results: `benchmarks/PERFORMANCE_REPORT.md`
- Current benchmarks: 60 FPS, <2s load times, 0 memory leaks
- See [PERFORMANCE_TESTING.md](./PERFORMANCE_TESTING.md) for complete documentation

### Architecture Philosophy

This monorepo follows a **pragmatic minimal sharing approach**:

#### ✅ What We Share
- **UI Components**: Only truly reusable visual components used by multiple games (`MassiveConfetti`)
- **Build tooling**: Turborepo, PNPM, shared dev scripts
- **Deployment patterns**: Common Vercel configuration approach

#### ❌ What We Don't Share
- **Game logic**: Each game has unique mechanics, no forced abstractions
- **Hooks**: `useTimer`, `useSound` implemented per-game with specific requirements
- **Types**: Game-specific TypeScript interfaces live with their games
- **State management**: Each game has its own Zustand store structure
- **Configuration**: Tailwind configs are game-specific (different design systems)

**Why?** Premature abstraction creates maintenance burden. We only share when there's clear, proven duplication across multiple games.

## Project History

### Code Cleanup (October 2025)
A major refactoring removed unused shared packages and code to simplify the monorepo:

**Removed packages:**
- `@games-platform/game-core` - Unused hooks (`useTimer`, `useSound`) and stores
- `@games-platform/types` - Generic types that didn't fit game-specific needs
- `@games-platform/config` - Unused base configurations

**Removed from `@games-platform/ui`:**
- `Button` - Moved to `apps/roulette` (only user)
- `Card`, `Loader`, `Confetti` - Never used
- `cn` utility - Not needed

**Results:**
- 75% reduction in shared packages (4 → 1)
- 90% reduction in exported components (10 → 1)
- ~500 lines of dead code removed
- Faster builds and clearer architecture

**Current structure:** Only `MassiveConfetti` remains in shared packages, as it's the only component genuinely used by both games.