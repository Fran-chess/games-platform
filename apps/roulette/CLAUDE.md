# CLAUDE.md

Guía para Claude Code al trabajar en `apps/roulette` (ruleta de preguntas DarSalud).

## Comandos

Desde la raíz del monorepo:

```bash
pnpm dev:roulette                                # Dev server en http://localhost:3000
pnpm build --filter=@games-platform/roulette     # Build de producción
pnpm --filter @games-platform/roulette type-check
pnpm build:perf && pnpm test:perf:roulette       # Benchmarks Playwright (FPS, memoria, carga)
```

No hay tests unitarios ni configuración de ESLint en esta app (`pnpm lint` pide crearla).
No requiere variables de entorno. Opcional: `NEXT_PUBLIC_ENABLE_PERF_MONITORING=true` para
loguear Core Web Vitals en producción (`PerformanceMonitor`).

## Qué es

Una única página (`src/app/page.tsx`) que funciona como máquina de estados, pensada para una
tablet en vertical durante eventos presenciales:

```
waiting  →  roulette  →  question  →  prize  →  (roulette | waiting)
video LED   girar rueda   30 s timer   resultado
```

El estado global vive en Zustand (`src/store/gameStore.ts`); los tipos en `src/types/index.ts`.

## Ruleta: arquitectura de render

Diseñada para costo mínimo por frame (la tablet objetivo corre a 90 Hz):

- **`src/utils/roulette/physics.ts`** — física del giro **basada en tiempo** (ms), no en frames.
  El ganador se elige antes de girar (`pickWinnerIndex`, evita 3 repeticiones seguidas) y la
  rueda se anima hasta dejarlo bajo el puntero (`createSpinPlan` / `getSpinFrame`). Duración
  fija de 2400 ms, alineada con `public/sounds/wheel-spin.mp3` (2,42 s).
- **`src/services/roulette/canvasRenderer.ts`** — dos capas pre-renderizadas al DPR del
  dispositivo: `wheel` (segmentos + títulos, rota) y `overlay` (borde exterior y puntero).
  Por frame solo se hace un `drawImage` rotado + resplandor del ganador + `drawImage`.
  Los títulos se parten y reducen automáticamente para entrar en el segmento; el color de
  texto lo decide el contraste WCAG contra el fondo (`utils/roulette/colors.ts`).
- **`src/hooks/useRouletteLogic.ts`** — estado del giro en refs y un único loop de
  `requestAnimationFrame` fuera del ciclo de React. Expone `phase`
  (`idle | spinning | resolved`) y publica el ganador en el store al terminar. Tras
  `resolved` no se puede volver a girar: la página cambia de vista y la ruleta se remonta.
- **`src/components/game/RouletteWheel.tsx`** — canvas, capas, `ResizeObserver` y el botón
  central **GIRAR**, que es un `<button>` del DOM superpuesto (no se dibuja en el canvas).
  Su diámetro llega por la variable CSS `--spin-button-size`, fijada desde la misma
  geometría del canvas; los estilos y estados viven en `.spin-button` (`globals.css`).

Reglas:
- Nada que se ejecute por frame debe crear gradientes, medir texto ni usar `shadowBlur`.
- En reposo el loop de rAF está apagado. Cualquier animación "idle" va por CSS
  (`transform`/`opacity`) en el DOM, nunca dentro del canvas.
- Es táctil puro: sin hover. El estado presionado se maneja con `pointerdown/up/cancel/leave`
  (iOS no aplica `:active` en touch) y `navigator.vibrate` no existe en iOS, así que el
  feedback visual no depende de la vibración.
- Solo el botón central es zona activa (disco + 15 px de margen). La rueda no recibe toques:
  también es pantalla de resultado y un giro accidental quema una pregunta.

## Preguntas y categorías

- `src/data/questions.json`: cada pregunta tiene `id`, `category`, `text`, 4 `options`
  (exactamente una `correct: true`) y `explanation` (se muestra al responder mal).
- Cada `category` distinta es un segmento, en el orden en que aparece en el JSON. Los colores
  por categoría están en `CATEGORY_COLOR_MAP` (`utils/roulette/colors.ts`); vecinos no deben
  repetir color.
- El material fuente del evento (PDF de preguntas) va en `apps/roulette/material/` y las
  capturas en `apps/roulette/imagenes-captura/`; ambas carpetas están en `.gitignore`.
- Las respuestas correctas se transcriben **exactamente** como las marca el material del
  cliente; ante una duda se avisa, no se corrige.

## Dispositivo objetivo y PWA

- Lenovo Tab M11 en vertical: viewport CSS ≈ 800×1280, DPR 1.5, 90 Hz. Para previsualizar en
  PC: DevTools, dispositivo 800×1280, DPR 1.5.
- `public/manifest.json` la hace instalable (fullscreen, portrait). **No hay service worker**:
  cada apertura carga desde la red; tras un deploy basta cerrar y reabrir la app instalada.

## Estilos

- Tailwind **v4** vía `@tailwindcss/postcss`, sin archivo de configuración (v4 autodetecta el
  contenido; la config JS anterior estaba inerte y se eliminó). Tipografía: la sans por
  defecto de Tailwind; la marca decidió no usar la fuente Marine.
- `src/app/globals.css` contiene los resets en `@layer base` y el fondo `.bg-game-gradient`.
- Cualquier CSS global fuera de `@layer` gana sobre las utilidades de Tailwind: no agregar
  reglas de elemento (`button {}`, etc.) sin capa.

## Convenciones

- Español en comentarios y textos de UI.
- Sin código muerto: exportar solo lo que se usa; borrar helpers huérfanos.
- Cambios de layout se validan en el viewport de la tablet (el timer no debe pisar el logo).
