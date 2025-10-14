# 🎮 MemoTest - Documentación Técnica de Implementación

## 📋 Resumen

Juego de memoria profesional optimizado para tablets en orientación horizontal. El jugador debe encontrar 2 pares de cartas en 3 movimientos máximo, con una fase de memorización inicial y una fase de premio al final.

---

## 🎯 Flujo del Juego

### 1. **Pantalla de Espera (`waiting`)**
- Video institucional del cliente
- Click/Touch para iniciar

### 2. **Fase de Mezcla (`shuffling`)** - 2 segundos
- Las 8 cartas (4 pares) se mezclan con animación stagger
- Cartas mostradas boca abajo (fondo azul institucional)

### 3. **Fase de Memorización (`memorizing`)** - 8 segundos
- Todas las cartas se voltean simultáneamente
- Timer circular cuenta regresiva de 8s
- El jugador memoriza la posición de los símbolos

### 4. **Fase de Juego (`playing`)** - 2 minutos máximo
- Cartas se ocultan nuevamente
- El jugador tiene:
  - **3 movimientos** (1 movimiento = 2 cartas volteadas)
  - **2 minutos** de tiempo
  - **Objetivo**: Encontrar **2 pares**

**Condiciones de Victoria:**
- Encuentra 2 pares antes de agotar los 3 movimientos
- O antes de que se acabe el tiempo

**Condiciones de Derrota:**
- Agota los 3 movimientos sin encontrar 2 pares
- O se acaba el tiempo

### 5. **Fase de Premio (`prize`)** - Solo si ganó
- Se muestran 3 cartas misteriosas boca abajo
- El jugador elige 1 carta
- Animación de flip revela si ganó premio (🏆) o no (😔)
- Confetti si ganó premio

### 6. **Modal de Derrota (`failed`)** - Si perdió
- Muestra estadísticas del intento
- Mensaje motivador
- Botón "Intentar de nuevo"

---

## 🏗️ Arquitectura

### Estructura de Archivos

```
apps/memotest/src/
├── components/
│   └── game/
│       ├── MemoGame.tsx           # Orquestador principal
│       ├── MemoCard.tsx           # Componente de carta individual
│       ├── MemorizationPhase.tsx  # Fase shuffling + memorización
│       ├── PlayingPhase.tsx       # Fase de juego activo
│       ├── PrizePhase.tsx         # Fase de selección de premio
│       └── DefeatModal.tsx        # Modal de derrota
├── services/
│   └── game/
│       └── memoService.ts         # Lógica de negocio del juego
├── store/
│   └── memoStore.ts               # Estado global con Zustand
├── hooks/
│   └── useMemoAudio.ts            # Hook personalizado de audio
└── app/
    └── page.tsx                   # Página principal
```

---

## 🔧 Tecnologías y Librerías

### Core
- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **React 18**

### Estado y Datos
- **Zustand** con middleware:
  - `immer` - Mutaciones inmutables
  - `persist` - Persistencia de `bestScore`
  - `devtools` - Debugging

### UI/UX
- **Tailwind CSS v4** - Estilos utility-first
- **Framer Motion** - Animaciones profesionales
- **@games-platform/ui** - Componentes compartidos (MassiveConfetti)

### Audio
- **Web Audio API** - Sonidos sintetizados en tiempo real
- AudioService singleton con soporte para:
  - Flip, match, error, victory, defeat
  - Melodías personalizadas
  - Control de volumen y mute

---

## 📊 Estado Global (Zustand Store)

### GameState
```typescript
type GameState =
  | 'waiting'      // Pantalla de espera
  | 'shuffling'    // Mezclando cartas
  | 'memorizing'   // Mostrando cartas
  | 'playing'      // Juego activo
  | 'success'      // Victoria (encontró 2 pares)
  | 'failed'       // Derrota
  | 'prize';       // Selección de premio
```

### GameStats
```typescript
interface GameStats {
  movesUsed: number;        // Movimientos realizados
  matchesFound: number;     // Pares encontrados
  timeElapsed: number;      // Tiempo transcurrido (segundos)
  score: number;            // Puntaje calculado
  bestScore: number | null; // Mejor puntaje (persistido)
}
```

### Selectores Optimizados
```typescript
export const useGameState = () => useMemoStore((state) => state.gameState);
export const useCards = () => useMemoStore((state) => state.cards);
export const useStats = () => useMemoStore((state) => state.stats);
export const useIsProcessing = () => useMemoStore((state) => state.isProcessing);
// ... más selectores
```

**Beneficio**: Evita re-renders innecesarios, solo se actualiza el componente cuando cambia el slice específico.

---

## 🎨 Sistema de Diseño

### Paleta de Colores
- **Primario**: `blue-500` → `blue-700` (azul institucional)
- **Success**: `green-400` → `emerald-600`
- **Error**: `red-400` → `rose-600`
- **Neutral**: `slate-50` → `slate-900`

### Animaciones Clave

**Flip 3D de Cartas:**
```tsx
animate={{ rotateY: card.isFlipped ? 180 : 0 }}
transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
style={{ transformStyle: 'preserve-3d' }}
```

**Match Exitoso:**
- Scale + rotation del ícono
- Glow effect con `bg-white/20`
- Checkmark animado con spring physics

**Error (sin match):**
- Shake animation (CSS keyframes)
- Sonido de error
- Delay de 800ms antes de ocultar

**Stagger en Shuffling:**
```tsx
transition={{ delay: index * 0.1, type: 'spring' }}
```

---

## 🔊 Sistema de Audio

### Hook useMemoAudio()
Proporciona funciones tipadas para reproducir sonidos:

```typescript
const {
  playFlip,        // Al voltear carta
  playMatch,       // Match exitoso
  playError,       // Sin match
  playVictory,     // Victoria (melodía ascendente)
  playDefeat,      // Derrota (melodía descendente)
  playTick,        // Countdown (últimos 10s)
  playPrizeSelect, // Selección de premio
  playPrizeWin,    // Premio ganado (melodía especial)
} = useMemoAudio();
```

### AudioService
- Singleton pattern
- Web Audio API con `AudioContext`
- Auto-resume en primera interacción del usuario
- Configuraciones predefinidas por tipo de sonido
- Soporte para melodías (secuencia de notas)

---

## ⚡ Optimizaciones Implementadas

### 1. **Eliminación de `setTimeout` con `get()`**
❌ **Antes:**
```typescript
setTimeout(() => get().checkMatch(), 600);
```

✅ **Después:**
```typescript
// Lógica movida a useEffect en componentes
useEffect(() => {
  // Verificación de match
}, [cards, isProcessing]);
```

### 2. **Selectores Específicos de Zustand**
❌ **Antes:**
```typescript
const { gameState, cards, stats, ... } = useMemoStore();
// Re-render en CUALQUIER cambio del store
```

✅ **Después:**
```typescript
const gameState = useGameState();
const cards = useCards();
// Solo re-render cuando cambia el slice específico
```

### 3. **Memoización de Cálculos**
```typescript
const formatTime = useMemo(() => {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return `${mins}:${secs}`;
}, [timeLeft]);
```

### 4. **React.memo en MemoCard**
```typescript
export const MemoCard = memo(function MemoCard({ ... }) {
  // Solo re-render cuando cambian sus props
});
```

### 5. **Persistencia con Zustand Persist**
```typescript
persist(
  immer((set, get) => ({ ... })),
  {
    name: 'memo-storage',
    partialize: (state) => ({
      stats: { bestScore: state.stats.bestScore },
      soundEnabled: state.soundEnabled,
    }),
  }
)
```

### 6. **CSS en globals.css (no inline)**
Clases `.preserve-3d`, `.backface-hidden`, `.animate-shake` definidas globalmente para mejor performance.

---

## 🎯 Lógica de Negocio (memoService)

### Generación de Cartas
```typescript
generateCards(theme: 'medical' | 'default'): MemoCard[]
```
- Selecciona 4 íconos del tema
- Crea 2 cartas por ícono (8 cartas totales)
- Mezcla con Fisher-Yates
- Asigna posiciones

### Generación de Premios
```typescript
generatePrizeCards(): PrizeCard[]
```
- Crea 3 cartas: 1 ganadora, 2 perdedoras
- Aleatoriza posición de la ganadora

### Validación de Match
```typescript
checkMatch(card1: MemoCard, card2: MemoCard): boolean
```
Compara `card1.value === card2.value`

### Validación de Estado del Juego
```typescript
validateGameState(
  matchesFound: number,
  movesUsed: number,
  timeRemaining: number
): GameValidation
```
Determina victoria/derrota según:
- `matchesFound >= requiredPairs` → Victoria
- `movesUsed >= maxMoves` → Derrota
- `timeRemaining <= 0` → Derrota

### Cálculo de Puntaje
```typescript
calculateScore(movesUsed: number, timeElapsed: number): number
```
- Base: 1000 puntos
- Penalización: -100 por movimiento extra
- Bonus: +2 por cada segundo restante

---

## 📱 Optimización para Tablets

### Orientación Forzada
```json
// manifest.json
"orientation": "landscape"
```

```tsx
// Meta tags
<meta name="screen-orientation" content="landscape" />
```

### Sin Interacciones Hover
- Solo `whileTap` (no `whileHover`)
- Áreas de touch grandes (min 44x44px)
- Feedback inmediato en clicks (<100ms)

### Prevención de Zoom iOS
```css
input, button {
  font-size: 16px !important;
  touch-action: manipulation;
}
```

---

## 🐛 Debugging

### Zustand DevTools
```typescript
devtools(
  persist(...),
  { name: 'memo-store' }
)
```
Accesible en Redux DevTools Extension

### Console Logs (desarrollo)
```typescript
console.log('GameState:', gameState);
console.log('Stats:', stats);
```

### React DevTools Profiler
Verificar re-renders y performance

---

## 🚀 Próximos Pasos (Opcional)

1. **Imágenes personalizadas** en lugar de emojis
2. **Temas adicionales** (no solo medical)
3. **Niveles de dificultad** (4, 6, 8 pares)
4. **Tabla de high scores** (leaderboard)
5. **Multiplayer** (varios jugadores simultáneos)
6. **Analytics** (tracking de eventos)

---

## ✅ Checklist de Implementación Completada

- [x] Arquitectura base y servicio de juego
- [x] MemoCard con animaciones 3D profesionales
- [x] Fase de memorización (shuffling + countdown)
- [x] Fase de juego con lógica 2 pares/3 movimientos
- [x] Fase de premio (3 cartas misteriosas)
- [x] Modal de derrota con estadísticas
- [x] Sistema de audio integrado
- [x] Optimizaciones de performance
- [x] Orientación landscape forzada
- [x] Persistencia de bestScore
- [x] Selectores optimizados de Zustand
- [x] Animaciones enterprise-grade con Framer Motion
- [x] Diseño UI/UX profesional con Tailwind CSS

---

## 📝 Notas Finales

- **Sin hovers**: Diseño exclusivo para touch (tablets)
- **Grid 4x2**: Optimizado para landscape
- **Iconos médicos**: Tema enfermería por defecto
- **Confetti**: Solo en victoria y premio ganado
- **Audio**: Se inicializa en primera interacción del usuario (política de navegadores)

---

**Implementado por**: Claude Code
**Fecha**: 2025-01-29
**Versión**: 1.0.0