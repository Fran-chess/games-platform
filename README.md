# Games Platform - Monorepo de Juegos

Monorepo para gestionar múltiples juegos frontend usando PNPM, Turborepo y Next.js.

## 🏗️ Estructura

```
games-platform/
├── apps/
│   ├── roulette/         # Juego de ruleta (migrado)
│   ├── trivia/           # Futuro juego trivia
│   └── hub/              # Landing/selector de juegos
├── packages/
│   ├── ui/               # Componentes compartidos (Button, Card, Loader, Confetti)
│   ├── game-core/        # Lógica de juegos (hooks, stores, timers)
│   ├── types/            # Tipos TypeScript compartidos
│   └── config/           # Configuraciones base (tsconfig, tailwind)
```

## 🚀 Instalación

### Prerrequisitos
- Node.js >= 20.0.0
- PNPM >= 9.0.0

### Pasos de instalación

1. **Instalar dependencias:**
```bash
cd games-platform
pnpm install
```

2. **Ejecutar en desarrollo:**
```bash
# Ejecutar todos los proyectos
pnpm dev

# Ejecutar solo la ruleta
pnpm dev --filter=@games-platform/roulette
```

3. **Construir para producción:**
```bash
pnpm build
```

## 📦 Packages Compartidos

### @games-platform/ui
- **Button**: Botón con múltiples variantes y soporte táctil
- **Card**: Tarjetas con diferentes estilos
- **Loader**: Spinners de carga
- **Confetti**: Animación de confeti para celebraciones

### @games-platform/game-core
- **useTimer**: Hook para manejo de temporizadores
- **useSound**: Hook para reproducción de audio
- **createBaseGameStore**: Store base con Zustand

### @games-platform/types
- Interfaces compartidas: `BaseGame`, `Player`, `GameSession`, `GameResult`

### @games-platform/config
- Configuración base de Tailwind CSS
- TSConfig base

## 🎮 Apps

### Roulette (`apps/roulette`)
Tu juego de ruleta actual, ahora integrado en el monorepo con:
- Componentes compartidos del package UI
- Hooks reutilizables de game-core
- Configuración centralizada

Puerto de desarrollo: **3000**

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Ejecutar todos los proyectos
pnpm dev --filter=app # Ejecutar app específica

# Build
pnpm build            # Construir todos
pnpm build --filter=app # Construir app específica

# Linting y Type Check
pnpm lint
pnpm type-check

# Limpiar
pnpm clean            # Limpiar builds y node_modules
```

## 📝 Próximos Pasos

### Para completar la migración de Roulette:

1. **Actualizar imports en los componentes:**
   - Cambiar `import Button from '@/components/ui/Button'`
   - Por `import { Button } from '@games-platform/ui'`

2. **Migrar hooks compartibles:**
   - useTimer → `@games-platform/game-core`
   - Stores comunes → `@games-platform/game-core`

3. **Actualizar configuración de Tailwind:**
   ```ts
   // apps/roulette/tailwind.config.ts
   import { tailwindBaseConfig } from '@games-platform/config'

   export default {
     ...tailwindBaseConfig,
     // Configuración específica de roulette
   }
   ```

### Para crear un nuevo juego:

1. **Copiar estructura base:**
```bash
cp -r apps/roulette apps/nuevo-juego
```

2. **Actualizar package.json:**
   - Cambiar nombre a `@games-platform/nuevo-juego`
   - Ajustar puerto de desarrollo

3. **Reutilizar componentes:**
   - Importar desde `@games-platform/ui`
   - Usar hooks de `@games-platform/game-core`

## 🚢 Deploy

Cada app puede desplegarse independientemente en Vercel:

1. Crear proyecto en Vercel
2. Configurar:
   - Root Directory: `apps/[nombre-app]`
   - Build Command: `cd ../.. && pnpm build --filter=[nombre-app]`
   - Output Directory: `apps/[nombre-app]/.next`

## 🎯 Ventajas del Monorepo

- ✅ **Reutilización de código**: Componentes y lógica compartida
- ✅ **Desarrollo paralelo**: Múltiples equipos en diferentes juegos
- ✅ **Builds optimizados**: Caché con Turborepo
- ✅ **Consistencia**: Mismas versiones de dependencias
- ✅ **Testing unificado**: Una sola suite de pruebas
- ✅ **Deploy independiente**: Cada juego en su subdominio

## 📄 Licencia

Privado - Todos los derechos reservados