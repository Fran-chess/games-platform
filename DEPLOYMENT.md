# 🚀 Guía de Deployment - Monorepo Roulette Game

## ✅ Estado de la Migración

La migración está **COMPLETA**. El monorepo es ahora tu única fuente de código.

### Lo que hicimos:
1. ✅ Migración completa del código de `roulette-game` a `apps/roulette`
2. ✅ Componentes compartidos extraídos a packages:
   - `@games-platform/ui`: Button, MassiveConfetti, Card, Loader
   - `@games-platform/game-core`: Hooks reutilizables
   - `@games-platform/types`: Tipos compartidos
3. ✅ Imports actualizados para usar packages compartidos
4. ✅ Configuración de Vercel preparada

## 📦 Instalación Local

```bash
cd /mnt/c/Users/Francisco/Desktop/Trabajos/redes-evento/games-platform
pnpm install
```

## 🏃 Ejecutar en Desarrollo

```bash
# Ejecutar solo la ruleta
pnpm dev --filter=@games-platform/roulette

# O ejecutar todo el monorepo
pnpm dev
```

La app estará disponible en: http://localhost:3000

## 🔧 Variables de Entorno

Copia tu archivo `.env` actual al nuevo proyecto:

```bash
cp /mnt/c/Users/Francisco/Desktop/Trabajos/redes-evento/roulette-game/.env \
   /mnt/c/Users/Francisco/Desktop/Trabajos/redes-evento/games-platform/apps/roulette/.env
```

## 🚢 Deploy en Vercel

### Opción 1: Nuevo Proyecto (Recomendado)

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "Add New..." → "Project"
3. Importa el repositorio
4. **Configuración importante:**
   - **Root Directory**: `apps/roulette`
   - **Framework Preset**: Next.js
   - **Build Command**: `cd ../.. && pnpm build --filter=@games-platform/roulette`
   - **Output Directory**: `.next`
   - **Install Command**: `cd ../.. && pnpm install`

5. Agrega las variables de entorno (las mismas que tenías antes)
6. Deploy!

### Opción 2: Actualizar Proyecto Existente

Si ya tienes el proyecto en Vercel y quieres mantener la misma URL:

1. Ve a tu proyecto en Vercel
2. Settings → General
3. Actualiza:
   - **Root Directory**: `apps/roulette`
   - **Build Command**: `cd ../.. && pnpm build --filter=@games-platform/roulette`
   - **Install Command**: `cd ../.. && pnpm install`
4. Settings → Git
   - Actualiza el branch/repositorio si cambió
5. Redeploy

## 🎯 Verificación Post-Deploy

1. **Verifica que la app funcione**: Visita tu URL de Vercel
2. **Revisa los logs**: En Vercel Dashboard → Functions → Logs
3. **Test de funcionalidad**:
   - La ruleta debe girar correctamente
   - Los botones deben responder
   - El confetti debe aparecer

## 📝 Estructura del Proyecto Deployado

```
Tu URL de Vercel sirve: games-platform/apps/roulette
├── Componentes UI desde: @games-platform/ui
├── Hooks desde: @games-platform/game-core
└── Build optimizado con: Turborepo cache
```

## 🆕 Para Agregar Nuevos Juegos

Ahora que tienes el monorepo funcionando, agregar un nuevo juego es simple:

```bash
# Copiar estructura base
cp -r apps/roulette apps/nuevo-juego

# Actualizar package.json del nuevo juego
# Cambiar name: "@games-platform/nuevo-juego"

# Desarrollar usando los packages compartidos
import { Button, MassiveConfetti } from '@games-platform/ui'
import { useTimer } from '@games-platform/game-core'
```

## ⚠️ Importante

- **NO necesitas backend**: Todo es frontend estático
- **El monorepo es tu única fuente**: Puedes archivar/eliminar la carpeta `roulette-game` original
- **Los packages son compartidos**: Cualquier cambio en `packages/` afecta a todas las apps

## 🎉 ¡Listo!

Tu juego de ruleta ahora vive en un monorepo escalable. La misma app deployada seguirá funcionando, solo necesitas actualizar la configuración de build en Vercel.

## Comandos Útiles

```bash
# Build de producción
pnpm build --filter=@games-platform/roulette

# Limpiar cache
pnpm clean

# Ver tamaño del bundle
cd apps/roulette && npx next build --analyze
```