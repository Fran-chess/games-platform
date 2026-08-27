/**
 * Renderizado de la ruleta en canvas
 *
 * La rueda se dibuja por capas para que el costo por frame sea mínimo:
 * - Capa "wheel" (rota): segmentos y títulos. Se rasteriza una sola vez por
 *   tamaño/preguntas en un canvas fuera de pantalla.
 * - Capa "overlay" (fija): borde exterior y puntero. También se rasteriza
 *   una sola vez.
 * - Por frame solo se hace: limpiar, dibujar la capa "wheel" rotada, el
 *   resplandor del segmento ganador y la capa "overlay".
 *
 * El botón central "GIRAR" no vive en el canvas: es un <button> del DOM
 * superpuesto (ver RouletteWheel), así sus estados se animan por CSS en el
 * compositor sin encender el loop de dibujo.
 */

import type { WheelSegment } from '@/types';
import { getContrastColor, SEGMENT_TEXT_COLORS } from '@/utils/roulette/colors';

/**
 * Configuración visual de la ruleta
 */
const VISUAL_CONFIG = {
  /** Radio de la rueda como fracción del lado del canvas */
  WHEEL_RADIUS_RATIO: 0.44,
  /** Radio del botón central (DOM) como fracción del radio de la rueda */
  CENTER_BUTTON_RATIO: 0.19,
  /** Grosor del borde exterior */
  OUTER_BORDER_WIDTH: 8,
  /** Tamaño del puntero */
  ARROW_SIZE: 25,
  /** Separación del puntero respecto del borde */
  ARROW_OFFSET: 5,
  /** Margen (px CSS) alrededor de la capa de la rueda para que los trazos no se recorten */
  LAYER_PADDING: 4,
} as const;

/**
 * Colores del tema
 */
const THEME_COLORS = {
  OUTER_BORDER: '#2C3E50',
  /** Rojo funcional del puntero: fuera de paleta a propósito, es el único indicador del resultado */
  ARROW: '#D93A2B',
  ARROW_SHADOW: 'rgba(217, 58, 43, 0.5)',
  SEGMENT_BORDER: '#FFFFFF',
  WINNER_GLOW: 'rgba(255, 215, 0, 0.6)',
  WINNER_STROKE: '#FFD700',
} as const;

/**
 * Configuración del layout del texto dentro de cada segmento
 */
const TEXT_LAYOUT = {
  /** Inicio de la banda de texto, como fracción del radio (el botón central llega a 0.19) */
  INNER_RADIUS_RATIO: 0.3,
  /** Fin de la banda de texto, como fracción del radio (deja margen antes del borde) */
  OUTER_RADIUS_RATIO: 0.94,
  /** Margen de seguridad respecto del ancho angular del segmento */
  TANGENTIAL_SAFETY: 0.85,
  /** Cantidad máxima de líneas por título */
  MAX_LINES: 3,
  /** Tamaño mínimo de fuente antes de dejar de reducir */
  MIN_FONT_SIZE: 11,
  /** Interlineado relativo al tamaño de fuente */
  LINE_HEIGHT: 1.1,
  /** Familia tipográfica de los títulos */
  FONT_FAMILY: 'sans-serif',
} as const;

/**
 * Geometría de la rueda en píxeles CSS
 */
export interface WheelGeometry {
  /** Lado del canvas (cuadrado) */
  size: number;
  /** Relación de píxeles del dispositivo */
  dpr: number;
  centerX: number;
  centerY: number;
  radius: number;
  /** Diámetro visible del botón central (DOM), derivado del radio de la rueda */
  centerButtonDiameter: number;
}

/**
 * Capas pre-renderizadas de la rueda
 */
export interface WheelLayers {
  /** Segmentos y títulos; rota con la rueda */
  wheel: HTMLCanvasElement;
  /** Borde exterior y puntero; no rota */
  overlay: HTMLCanvasElement;
  /** Cantidad de segmentos con la que se generaron las capas */
  segmentCount: number;
}

/**
 * Estado dinámico de un frame
 */
export interface FrameState {
  /** Ángulo de la rueda en grados */
  angleDeg: number;
  /** Segmento ganador del último giro, o null */
  winnerSegment: number | null;
  /** Intensidad del resplandor del ganador (0 a 1) */
  glowIntensity: number;
}

/**
 * Calcula la geometría de la rueda a partir del tamaño de layout del contenedor.
 * Usa clientWidth/clientHeight (no getBoundingClientRect) para ignorar transformaciones CSS.
 *
 * @returns Geometría, o null si el contenedor todavía no tiene tamaño
 */
export function createWheelGeometry(container: HTMLElement): WheelGeometry | null {
  const size = Math.floor(Math.min(container.clientWidth, container.clientHeight));
  if (size <= 0) return null;

  const radius = size * VISUAL_CONFIG.WHEEL_RADIUS_RATIO;

  return {
    size,
    dpr: window.devicePixelRatio || 1,
    centerX: size / 2,
    centerY: size / 2,
    radius,
    centerButtonDiameter: Math.round(radius * VISUAL_CONFIG.CENTER_BUTTON_RATIO * 2),
  };
}

/**
 * Configura el canvas visible para la geometría dada (resolución física + escala DPR)
 *
 * @returns Contexto 2D listo para dibujar en px CSS, o null si no está disponible
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  geometry: WheelGeometry
): CanvasRenderingContext2D | null {
  const { size, dpr } = geometry;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/**
 * Crea un canvas fuera de pantalla de `sideCss` px CSS de lado, escalado al DPR
 */
function createLayerCanvas(
  sideCss: number,
  dpr: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(sideCss * dpr);
  canvas.height = Math.ceil(sideCss * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx };
}

/**
 * Ángulos de inicio y fin de un segmento, en radianes.
 * El segmento 0 empieza arriba (−90°) y los siguientes avanzan en sentido horario.
 */
function getSegmentArc(index: number, segmentCount: number): { startAngle: number; endAngle: number } {
  const anglePerSegment = (2 * Math.PI) / segmentCount;
  const startAngle = index * anglePerSegment - Math.PI / 2;
  return { startAngle, endAngle: startAngle + anglePerSegment };
}

/**
 * Pre-renderiza las capas de la rueda. Llamar solo cuando cambian el tamaño o los segmentos.
 *
 * @returns Capas listas para `renderFrame`, o null si el canvas 2D no está disponible
 */
export function createWheelLayers(segments: WheelSegment[], geometry: WheelGeometry): WheelLayers | null {
  const { size, dpr, centerX, centerY, radius } = geometry;

  // Capa de la rueda: cuadrado centrado en la rueda con margen para los trazos
  const wheelHalfSide = radius + VISUAL_CONFIG.LAYER_PADDING;
  const wheelLayer = createLayerCanvas(wheelHalfSide * 2, dpr);
  if (!wheelLayer) return null;

  segments.forEach((segment, index) => {
    const { startAngle, endAngle } = getSegmentArc(index, segments.length);
    drawSegment(wheelLayer.ctx, segment, startAngle, endAngle, wheelHalfSide, wheelHalfSide, radius);
    drawSegmentText(wheelLayer.ctx, segment.text, startAngle, endAngle, wheelHalfSide, wheelHalfSide, radius, segment.color);
  });

  // Capa fija: mismo tamaño que el canvas visible
  const overlayLayer = createLayerCanvas(size, dpr);
  if (!overlayLayer) return null;

  drawOuterBorder(overlayLayer.ctx, centerX, centerY, radius);
  drawArrow(overlayLayer.ctx, centerX, centerY, radius);

  return {
    wheel: wheelLayer.canvas,
    overlay: overlayLayer.canvas,
    segmentCount: segments.length,
  };
}

/**
 * Dibuja un frame completo: rueda rotada + resplandor del ganador + capa fija
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  geometry: WheelGeometry,
  layers: WheelLayers,
  frame: FrameState
): void {
  const { size, centerX, centerY, radius } = geometry;
  const wheelHalfSide = radius + VISUAL_CONFIG.LAYER_PADDING;

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((frame.angleDeg * Math.PI) / 180);
  ctx.drawImage(layers.wheel, -wheelHalfSide, -wheelHalfSide, wheelHalfSide * 2, wheelHalfSide * 2);

  if (frame.winnerSegment !== null && frame.glowIntensity > 0 && layers.segmentCount > 0) {
    drawWinnerGlow(ctx, frame.winnerSegment, layers.segmentCount, radius, frame.glowIntensity);
  }
  ctx.restore();

  ctx.drawImage(layers.overlay, 0, 0, size, size);
}

/**
 * Resplandor del segmento ganador sobre la rueda ya rotada (coordenadas locales, origen en el centro)
 */
function drawWinnerGlow(
  ctx: CanvasRenderingContext2D,
  index: number,
  segmentCount: number,
  radius: number,
  glowIntensity: number
): void {
  const { startAngle, endAngle } = getSegmentArc(index, segmentCount);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, startAngle, endAngle);
  ctx.closePath();

  ctx.globalAlpha = glowIntensity * 0.7;
  ctx.fillStyle = THEME_COLORS.WINNER_GLOW;
  ctx.fill();

  ctx.globalAlpha = glowIntensity;
  ctx.strokeStyle = THEME_COLORS.WINNER_STROKE;
  ctx.lineWidth = 4 + glowIntensity * 6;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Dibuja el relleno y el borde de un segmento
 */
function drawSegment(
  ctx: CanvasRenderingContext2D,
  segment: WheelSegment,
  startAngle: number,
  endAngle: number,
  centerX: number,
  centerY: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.closePath();

  ctx.fillStyle = segment.color;
  ctx.fill();

  ctx.strokeStyle = THEME_COLORS.SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.stroke();
}

interface TextLayout {
  lines: string[];
  fontSize: number;
}

function segmentFont(fontSize: number): string {
  return `bold ${fontSize}px ${TEXT_LAYOUT.FONT_FAMILY}`;
}

/**
 * Genera todas las particiones contiguas de `words` en exactamente `lineCount` líneas
 */
function enumerateLineSplits(words: string[], lineCount: number): string[][] {
  if (lineCount === 1) return [[words.join(' ')]];

  const results: string[][] = [];
  // La primera línea toma entre 1 y (n - lineCount + 1) palabras; el resto se reparte recursivamente
  for (let take = 1; take <= words.length - (lineCount - 1); take++) {
    const head = words.slice(0, take).join(' ');
    for (const rest of enumerateLineSplits(words.slice(take), lineCount - 1)) {
      results.push([head, ...rest]);
    }
  }
  return results;
}

/**
 * Busca la división en la menor cantidad de líneas que entre en `maxWidth`,
 * eligiendo entre las opciones de igual cantidad de líneas la más balanceada
 * (menor ancho de la línea más larga). Devuelve null si ninguna entra.
 */
function findBestWrap(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxWidth: number,
  maxLines: number
): string[] | null {
  const limit = Math.min(maxLines, words.length);

  for (let lineCount = 1; lineCount <= limit; lineCount++) {
    let best: string[] | null = null;
    let bestWidth = Infinity;

    for (const candidate of enumerateLineSplits(words, lineCount)) {
      const widest = Math.max(...candidate.map(line => ctx.measureText(line).width));
      if (widest <= maxWidth && widest < bestWidth) {
        best = candidate;
        bestWidth = widest;
      }
    }

    if (best) return best;
  }

  return null;
}

/**
 * Calcula líneas y tamaño de fuente para que un título entre en el espacio disponible.
 * Parte de `preferredFontSize` y reduce de a 1px hasta que el texto entra o se llega al mínimo.
 */
function layoutSegmentText(
  ctx: CanvasRenderingContext2D,
  text: string,
  preferredFontSize: number,
  maxWidth: number,
  maxHeight: number
): TextLayout {
  const words = text.trim().split(/\s+/);

  for (let fontSize = preferredFontSize; fontSize >= TEXT_LAYOUT.MIN_FONT_SIZE; fontSize -= 1) {
    ctx.font = segmentFont(fontSize);
    const lines = findBestWrap(ctx, words, maxWidth, TEXT_LAYOUT.MAX_LINES);
    if (lines && lines.length * fontSize * TEXT_LAYOUT.LINE_HEIGHT <= maxHeight) {
      return { lines, fontSize };
    }
  }

  // Último recurso: fuente mínima y una palabra por línea (hasta MAX_LINES)
  const lines = words.length <= TEXT_LAYOUT.MAX_LINES
    ? words
    : [...words.slice(0, TEXT_LAYOUT.MAX_LINES - 1), words.slice(TEXT_LAYOUT.MAX_LINES - 1).join(' ')];
  return { lines, fontSize: TEXT_LAYOUT.MIN_FONT_SIZE };
}

/**
 * Dibuja el título del segmento en sentido radial, centrado en la banda
 * comprendida entre INNER_RADIUS_RATIO y OUTER_RADIUS_RATIO.
 * El texto se parte en líneas y se reduce automáticamente para que siempre
 * quede dentro del segmento, sin importar el título ni la cantidad de segmentos.
 */
function drawSegmentText(
  ctx: CanvasRenderingContext2D,
  text: string,
  startAngle: number,
  endAngle: number,
  centerX: number,
  centerY: number,
  radius: number,
  segmentColor: string
): void {
  ctx.save();

  const middleAngle = (startAngle + endAngle) / 2;
  const segmentAngle = endAngle - startAngle;

  // Espacio disponible: ancho radial de la banda y alto tangencial en su borde interno
  const innerRadius = radius * TEXT_LAYOUT.INNER_RADIUS_RATIO;
  const outerRadius = radius * TEXT_LAYOUT.OUTER_RADIUS_RATIO;
  const maxWidth = outerRadius - innerRadius;
  const maxHeight = 2 * innerRadius * Math.tan(segmentAngle / 2) * TEXT_LAYOUT.TANGENTIAL_SAFETY;

  const preferredFontSize = Math.min(22, Math.max(16, radius * 0.09));
  const { lines, fontSize } = layoutSegmentText(ctx, text, preferredFontSize, maxWidth, maxHeight);

  ctx.font = segmentFont(fontSize);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Regla de legibilidad: el color de texto lo decide el contraste WCAG contra el fondo.
  // La sombra oscura solo acompaña al texto claro; bajo texto oscuro embarra los bordes.
  const textColor = getContrastColor(segmentColor);
  ctx.fillStyle = textColor;
  if (textColor === SEGMENT_TEXT_COLORS.LIGHT) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
  }

  // Orientar el eje X en sentido radial del segmento
  ctx.translate(centerX, centerY);
  ctx.rotate(middleAngle);

  // En la mitad izquierda se invierte el texto para que nunca quede cabeza abajo
  const normalizedAngle = (((middleAngle * 180) / Math.PI) % 360 + 360) % 360;
  const needsFlip = normalizedAngle > 90 && normalizedAngle < 270;

  const bandCenter = (innerRadius + outerRadius) / 2;
  let anchorX = bandCenter;
  if (needsFlip) {
    ctx.rotate(Math.PI);
    anchorX = -bandCenter;
  }

  const lineHeight = fontSize * TEXT_LAYOUT.LINE_HEIGHT;
  const startY = -((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, anchorX, startY + index * lineHeight);
  });

  ctx.restore();
}

/**
 * Dibuja el puntero superior
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  const arrowSize = VISUAL_CONFIG.ARROW_SIZE;
  const arrowY = centerY - radius - VISUAL_CONFIG.ARROW_OFFSET;

  ctx.save();
  ctx.shadowColor = THEME_COLORS.ARROW_SHADOW;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;

  ctx.beginPath();
  ctx.moveTo(centerX, arrowY);
  ctx.lineTo(centerX - arrowSize / 2, arrowY - arrowSize);
  ctx.lineTo(centerX + arrowSize / 2, arrowY - arrowSize);
  ctx.closePath();

  ctx.fillStyle = THEME_COLORS.ARROW;
  ctx.fill();

  ctx.strokeStyle = THEME_COLORS.SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/**
 * Dibuja el borde exterior de la rueda
 */
function drawOuterBorder(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = THEME_COLORS.OUTER_BORDER;
  ctx.lineWidth = VISUAL_CONFIG.OUTER_BORDER_WIDTH;
  ctx.stroke();
}
