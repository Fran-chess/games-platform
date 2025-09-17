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
```

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
- **`apps/memotest`** (port 3001): Memory test game (in development)

### Shared Packages
- **`@games-platform/ui`**: Reusable UI components (Button, Card, Loader, MassiveConfetti, Confetti) using Tailwind CSS and Framer Motion
- **`@games-platform/game-core`**: Game logic primitives (hooks like useTimer, useSound, base Zustand stores)
- **`@games-platform/types`**: Shared TypeScript interfaces (BaseGame, Player, GameSession, GameResult)
- **`@games-platform/config`**: Base configurations for TypeScript and Tailwind CSS

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
Apps depend on shared packages using workspace protocol (`workspace:*`), ensuring:
- Local package changes are immediately available
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
1. Add component to appropriate package in `packages/`
2. Export from package's index file
3. Import in apps using package name: `import { Component } from '@games-platform/ui'`

#### Creating a new game
1. Copy existing app structure: `cp -r apps/roulette apps/new-game`
2. Update `package.json` name to `@games-platform/new-game`
3. Adjust development port to avoid conflicts
4. Leverage shared packages for common functionality

### Performance Optimizations
- Turborepo caching reduces rebuild times
- PNPM's efficient node_modules structure saves disk space
- Shared packages are built once and reused
- Next.js optimizations (code splitting, image optimization) apply to all apps