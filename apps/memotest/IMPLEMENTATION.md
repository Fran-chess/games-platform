# MemoTest - Cómo funciona

Juego de memoria para los stands de DarSalud. Se juega en una tablet en horizontal
(Lenovo Tab M11, 1280×800). La guía técnica para trabajar en el código está en
[CLAUDE.md](./CLAUDE.md); este documento explica el juego y cómo adaptarlo a un evento.

## La partida

| Fase | Duración | Qué ve el jugador |
|---|---|---|
| Espera | hasta que tocan | Logo y "Toca la pantalla para jugar" |
| Preparación | 1 s | Tablero con las 12 cartas boca abajo |
| Memorización | 5 s | Las 12 cartas a la vista |
| Juego | hasta 30 s | Da vuelta cartas de a dos |
| Festejo | 1,5 s | El tablero con los pares encontrados |
| Premio | lo que tarde | Elige 1 de 3 cartas; una sola tiene premio |
| Derrota | lo que tarde | Mensaje de agradecimiento |

En Premio y en Derrota, si nadie toca la pantalla durante 20 s el juego vuelve solo a la
pantalla de espera, para el próximo jugador.

## Reglas

- 12 cartas: 6 pares, sorteados entre 9 íconos.
- Se gana encontrando **2 pares** en **3 intentos** (se tolera un error).
- Se pierde cuando ya no se puede llegar a los 2 pares con los intentos que quedan, o cuando
  se acaba el tiempo.
- En un par errado las cartas quedan a la vista 0,9 s antes de taparse.
- El reloj se pone rojo en los últimos 10 s y suena en los últimos 5.
- El premio es 1 de 3: la probabilidad total de premio es la de ganar la partida × 1/3.

## Dónde se cambia cada cosa

| Qué | Archivo |
|---|---|
| Reglas y tiempos | `src/services/game/memoService.ts` (`GAME_CONFIG` y las constantes de abajo) |
| Íconos de las cartas | `src/services/game/memoService.ts` (lista) y `src/components/game/cardIcons.tsx` (dibujos) |
| Textos del HUD | `src/components/game/GameBoard.tsx` (`HUD_TEXT`) |
| Textos finales y botones | `src/components/game/EndPanel.tsx` |
| Sonidos | `src/services/audio/audioService.ts` |
| Colores y aspecto de las cartas | clases de Tailwind en `MemoCard.tsx` y `PrizePhase.tsx` |
| Giro, sacudida y animaciones | `src/app/globals.css` |
| Nombre de la app instalada | `public/manifest.json` y `src/app/layout.tsx` |

## Íconos para un evento nuevo

El set actual es el del congreso de Cuidados Paliativos: manos y corazón, casa, mariposa,
familia, camino, cápsula, estetoscopio, tablet de salud y girasol.

Para cambiarlo:
1. Editar la lista `CARD_ICON_IDS` en `memoService.ts`.
2. Dibujar cada ícono en `cardIcons.tsx`: SVG de línea sobre un cuadro de 48×48, con
   `currentColor` para que el color se defina por CSS.
3. Cuidar que cada ícono tenga una silueta bien distinta de los demás. Si dos se parecen,
   el juego se vuelve injusto.

Hacen falta al menos 6 íconos (uno por par).
