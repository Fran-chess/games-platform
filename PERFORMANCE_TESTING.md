# Performance Testing - Games Platform

**Documentación completa del sistema de testing de rendimiento para Memotest y Roulette**

---

## Índice

1. [Resumen Rápido](#resumen-rápido)
2. [Comandos Disponibles](#comandos-disponibles)
3. [Flujo de Testing](#flujo-de-testing)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Métricas Capturadas](#métricas-capturadas)
6. [Interpretación de Resultados](#interpretación-de-resultados)
7. [Troubleshooting](#troubleshooting)
8. [Umbrales y Baselines](#umbrales-y-baselines)

---

## Resumen Rápido

### ¿Qué hace este sistema?

Mide el rendimiento de los juegos Memotest y Roulette usando:
- **Playwright**: Tests E2E con métricas personalizadas (FPS, memory, Core Web Vitals)
- **Lighthouse CI**: Auditorías estándar de performance
- **Web Vitals**: Monitoreo en producción (RUM - Real User Monitoring)

### Ejecutar Tests (flujo simple)

```bash
# 1. Build de producción (si hay cambios en el código)
pnpm build:perf

# 2. Ejecutar tests de performance
pnpm test:perf

# 3. Ver resultados
cat benchmarks/PERFORMANCE_REPORT.md
```

---

## Comandos Disponibles

### Playwright (Recomendado - Mide TODO)

```bash
# Ejecutar TODOS los tests de performance
pnpm test:perf

# Ejecutar solo tests de Memotest
pnpm test:perf:memotest

# Ejecutar solo tests de Roulette
pnpm test:perf:roulette

# Ver reporte HTML interactivo
pnpm test:perf:report
```

### Lighthouse CI (Opcional - Solo Web Vitals estándar)

```bash
# Windows (Git Bash/MSYS)
./scripts/lighthouse-test.sh

# El script hace: build + start servers + lighthouse + cleanup
```

### Builds

```bash
# Build de producción de AMBOS juegos
pnpm build:perf

# Build individual
pnpm build --filter=@games-platform/memotest
pnpm build --filter=@games-platform/roulette
```

---

## Flujo de Testing

### Primera Vez

```bash
# 1. Instalar dependencias (si no lo hiciste)
pnpm install

# 2. Build de producción
pnpm build:perf

# 3. Ejecutar tests
pnpm test:perf
```

### Después de Cambios en el Código

```bash
# 1. Rebuild los juegos modificados
pnpm build:perf  # O build específico si solo cambiaste uno

# 2. Ejecutar tests
pnpm test:perf

# 3. Revisar resultados
cat benchmarks/PERFORMANCE_REPORT.md
```

### Solo Re-ejecutar Tests (sin cambios)

```bash
# Si no modificaste código, podés ejecutar directo
pnpm test:perf
```

### Iteración Rápida

```bash
# Hacer cambios en CSS/animaciones
pnpm build --filter=@games-platform/memotest

# Testear
pnpm test:perf:memotest

# Revisar, ajustar, repetir
```

---

## Arquitectura del Sistema

### Estructura de Archivos

```
games-platform/
├── tests/
│   ├── memotest.spec.ts         # Tests de Memotest
│   ├── roulette.spec.ts         # Tests de Roulette
│   ├── helpers/
│   │   └── performance.ts       # Utilidades (measureFPS, measureMemory)
│   └── reporters/
│       └── performance-reporter.ts  # Reporter personalizado
├── benchmarks/
│   ├── results/                 # JSONs con métricas capturadas
│   │   ├── memotest-fps.json
│   │   ├── roulette-load.json
│   │   └── ...
│   ├── memotest-baseline.json   # Valores de referencia
│   ├── roulette-baseline.json
│   └── PERFORMANCE_REPORT.md    # Reporte generado automáticamente
├── playwright.config.ts          # Configuración de Playwright
├── lighthouserc.js              # Configuración de Lighthouse CI
└── scripts/
    └── lighthouse-test.sh       # Script para Lighthouse
```

### Componentes Clave

#### 1. Performance Monitor (RUM - Real User Monitoring)

**Archivos:**
- `apps/memotest/src/components/PerformanceMonitor.tsx`
- `apps/roulette/src/components/PerformanceMonitor.tsx`

**Función:** Captura Core Web Vitals en producción (navegador real de usuarios)

**Habilitar en producción:**
```env
NEXT_PUBLIC_ENABLE_PERF_MONITORING=true
```

#### 2. Playwright Tests

**Qué mide:**
- FPS durante animaciones (flip de cartas, spin de ruleta)
- Memory usage (detección de leaks)
- Load time (tiempo hasta interactividad)
- Core Web Vitals (LCP, FCP, TTFB)
- Canvas rendering (solo roulette)
- Audio loading time

**Configuración:** `playwright.config.ts`
- 1 worker (tests secuenciales para evitar interferencia)
- Servers automáticos en puertos 3000 (roulette) y 3001 (memotest)
- Traces y videos solo en fallos

#### 3. Lighthouse CI

**Qué mide:**
- Performance score (0-100)
- Core Web Vitals estándar
- Best practices
- Accessibility básico

**Configuración:** `lighthouserc.js`
- 3 runs por URL para estabilidad
- Asserts sobre LCP, CLS, TBT

#### 4. Custom Reporter

**Función:** Lee los JSONs de `benchmarks/results/` y genera `PERFORMANCE_REPORT.md`

**Formato:**
```markdown
## Memotest
| Metric | Value | Status |
|--------|-------|--------|
| FPS (flip) | 60.3 | ✅ |

## Roulette
| Metric | Value | Status |
|--------|-------|--------|
| Load Time | 1085ms | ✅ |
```

---

## Métricas Capturadas

### Memotest

| Métrica | Descripción | Threshold |
|---------|-------------|-----------|
| **FPS (flip)** | Frames por segundo durante animación de volteo de cartas | > 45 FPS |
| **FPS (stress)** | FPS bajo múltiples interacciones | > 40 FPS |
| **Memory Increase** | Incremento de memoria después de múltiples juegos | < 15 MB |
| **Memory (before/after)** | Memoria antes y después de interacciones | Info |

**Archivos generados:**
- `memotest-fps.json`
- `memotest-memory.json`
- `memotest-stress.json`

### Roulette

| Métrica | Descripción | Threshold |
|---------|-------------|-----------|
| **Load Time** | Tiempo desde navegación hasta canvas visible | < 3000 ms |
| **LCP** | Largest Contentful Paint | < 3000 ms |
| **FCP** | First Contentful Paint | < 1800 ms |
| **TTFB** | Time to First Byte | < 800 ms |
| **FPS (spin)** | FPS durante el spin de la ruleta | > 40 FPS |
| **FPS (idle)** | FPS cuando ruleta está en reposo | > 40 FPS |
| **Canvas Size** | Dimensiones del canvas | Info |
| **Audio Load Time** | Tiempo de carga de efectos de sonido | < 2000 ms |
| **Memory (full round)** | Incremento de memoria en una ronda completa | < 15 MB |

**Archivos generados:**
- `roulette-load.json`
- `roulette-spin-fps.json`
- `roulette-canvas.json`
- `roulette-audio.json`
- `roulette-full-round.json`

### Core Web Vitals

**LCP (Largest Contentful Paint)**
- Tiempo hasta que el contenido principal es visible
- Target: < 2.5s (Good), < 4s (Needs Improvement)

**FCP (First Contentful Paint)**
- Tiempo hasta el primer elemento visible
- Target: < 1.8s (Good)

**TTFB (Time to First Byte)**
- Tiempo de respuesta del servidor
- Target: < 800ms (Good)

**CLS (Cumulative Layout Shift)**
- Estabilidad visual (cambios inesperados de layout)
- Target: < 0.1 (Good)

**INP (Interaction to Next Paint)**
- Responsividad a interacciones del usuario
- Target: < 200ms (Good)

---

## Interpretación de Resultados

### PERFORMANCE_REPORT.md

```markdown
## Memotest
| Metric | Value | Status |
|--------|-------|--------|
| FPS (flip) | 60.3 | ✅ |
| Memory Increase | 0.0MB | ✅ |
```

**Estados:**
- ✅ **Verde**: Cumple threshold (excelente)
- ❌ **Rojo**: No cumple threshold (requiere atención)
- ℹ️ **Info**: Métrica informativa (no hay threshold)

### Valores de Referencia

**Excelente:**
- FPS: 55-60
- Load time: < 1.5s
- Memory increase: 0 MB
- LCP: < 1.5s

**Aceptable:**
- FPS: 45-55
- Load time: 1.5-3s
- Memory increase: < 5 MB
- LCP: 1.5-2.5s

**Necesita atención:**
- FPS: < 45
- Load time: > 3s
- Memory increase: > 10 MB
- LCP: > 2.5s

### Consideraciones de Headless Chrome

Los tests corren en **headless Chrome**, que tiene aproximadamente:
- **15-20% menos FPS** que Chrome con interfaz gráfica
- **Algunas APIs no funcionan** (ej: `screen.orientation`)
- **No reproduce video** siempre correctamente

Por eso:
- FPS threshold: 45 en headless ≈ 55-60 en real
- Algunos tests se skippean (ej: memotest load time)

---

## Troubleshooting

### "Port already in use"

**Problema:** Los servidores quedaron corriendo de una ejecución anterior

**Solución (Windows):**
```bash
# Matar todos los procesos de Node
taskkill //F //IM node.exe

# O específicos
netstat -ano | findstr :3000
taskkill //PID <PID> //F
```

### Tests fallan por timeout

**Problema:** Tests esperan elementos que no aparecen

**Soluciones:**
1. Verificar que el build está actualizado: `pnpm build:perf`
2. Aumentar timeout en `playwright.config.ts`: `timeout: 90000`
3. Verificar logs del servidor en la consola

### "Memory API not available"

**Problema:** API de medición de memoria no disponible en algunos navegadores

**Comportamiento:** Test se skippea automáticamente, no es un error

### FPS muy bajo en tests

**Posibles causas:**
1. **Normal en headless** - hasta 20% menos es esperado
2. **PC sobrecargado** - cerrar otras aplicaciones
3. **Animaciones pesadas** - revisar código si FPS < 40

### Reporte vacío o incompleto

**Problema:** Tests fallan antes de guardar métricas

**Solución:** Ver logs de Playwright para identificar qué test falla y por qué

```bash
# Ver último reporte HTML
pnpm test:perf:report
```

### Lighthouse "NO_FCP" error

**Problema:** Lighthouse no puede medir FCP en headless (conocido en memotest)

**Solución:** Usar Playwright en su lugar, que es más robusto

---

## Umbrales y Baselines

### Actualizar Baselines

Después de optimizaciones que mejoran el rendimiento:

```bash
# 1. Ejecutar tests
pnpm test:perf

# 2. Revisar resultados en PERFORMANCE_REPORT.md

# 3. Si son mejores, actualizar baselines
# Editar manualmente:
#   - benchmarks/memotest-baseline.json
#   - benchmarks/roulette-baseline.json
```

**Ejemplo de baseline:**
```json
{
  "loadTime": 1500,
  "lcp": 1200,
  "fcp": 800,
  "ttfb": 200,
  "fpsFlip": 58,
  "memoryIncrease": 5
}
```

### Ajustar Thresholds

Si los thresholds son muy estrictos o muy laxos:

**Editar:** `tests/reporters/performance-reporter.ts`

```typescript
// Ejemplo: Cambiar threshold de FPS
md += `| FPS (flip) | ${fps.toFixed(1)} | ${fps > 50 ? '✅' : '❌'} |\n`;
//                                                    ^^^ cambiar aquí
```

---

## Margen para Animaciones

### Rendimiento Actual

**Memotest:**
- FPS actual: 60 (headless) → ~55-60 (real)
- Margen: ✅ Bajo - medio

**Roulette:**
- FPS actual: 60 (headless) → ~55-60 (real)
- Margen: ⚠️ Bajo (ya tiene canvas + video + Framer Motion)

### Recomendaciones

**Puedes agregar:**
- ✅ Micro-interacciones (hover, ripples)
- ✅ Transitions suaves (fade, slide)
- ✅ Confetti optimizado (usa `MassiveConfetti` de `@games-platform/ui`)

**Evitar:**
- ❌ Blur filters (muy costosos)
- ❌ Box shadows complejos en animación
- ❌ Muchos elementos con `transform` simultáneos
- ❌ Partículas no optimizadas

### Proceso de Validación

```bash
# 1. Agregar animación al código
# 2. Build
pnpm build --filter=@games-platform/memotest

# 3. Testear
pnpm test:perf:memotest

# 4. Revisar FPS
# Si FPS > 45 → ✅ OK
# Si FPS < 45 → ⚠️ Simplificar animación
```

---

## CI/CD Integration (Opcional)

### GitHub Actions (ejemplo)

```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build:perf
      - run: pnpm test:perf
      - uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: benchmarks/PERFORMANCE_REPORT.md
```

### Vercel Deployment Checks (ejemplo)

Agregar en `vercel.json`:

```json
{
  "buildCommand": "pnpm build && pnpm test:perf",
  "checks": {
    "performance": {
      "path": "/",
      "lighthouse": {
        "performance": 85
      }
    }
  }
}
```

---

## Monitoreo en Producción

### Web Vitals en Producción

Los componentes `PerformanceMonitor` ya están instalados en ambos juegos.

**Habilitar:**
```env
# .env.production
NEXT_PUBLIC_ENABLE_PERF_MONITORING=true
```

**Ver métricas:**
- Abrir DevTools → Console
- Buscar logs con prefijo "🎯" (CLS, INP, LCP, etc.)

**Opcional: Enviar a backend**

Editar `PerformanceMonitor.tsx`:

```typescript
onLCP((metric) => {
  // Enviar a tu servicio de analytics
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      metric: 'LCP',
      value: metric.value,
      rating: metric.rating
    })
  });
});
```

---

## Comandos de Referencia Rápida

```bash
# Testing
pnpm test:perf                    # Todos los tests
pnpm test:perf:memotest          # Solo memotest
pnpm test:perf:roulette          # Solo roulette
pnpm test:perf:report            # Ver reporte HTML

# Builds
pnpm build:perf                   # Build de ambos juegos
pnpm build --filter=@games-platform/memotest
pnpm build --filter=@games-platform/roulette

# Lighthouse (opcional)
./scripts/lighthouse-test.sh      # Windows Git Bash

# Resultados
cat benchmarks/PERFORMANCE_REPORT.md
ls benchmarks/results/            # JSONs individuales
pnpm exec playwright show-report  # HTML interactivo
```

---

## Contacto y Soporte

Para dudas sobre el sistema de performance testing, consultar este documento primero.

Si encuentras bugs o quieres agregar nuevas métricas, revisar:
- `tests/helpers/performance.ts` - Funciones de medición
- `tests/reporters/performance-reporter.ts` - Generación de reportes
- `playwright.config.ts` - Configuración general
