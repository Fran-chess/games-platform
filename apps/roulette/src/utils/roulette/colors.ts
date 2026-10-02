/**
 * Gestión de colores para la ruleta de DarSalud
 * Maneja la paleta de colores oficial y el mapeo de categorías
 */

/**
 * Paleta de colores oficial de DarSalud
 */
export const ROULETTE_COLORS = {
  AZUL_INTENSO: "#192A6E",
  VERDE_SALUD: "#5ACCC1",
  CELESTE_MEDIO: "#40C0EF",
  AMARILLO_DS: "#F2BD35",
  ROSADO_LILA: "#D5A7CD",
} as const;

/**
 * Array de colores disponibles para segmentos sin categoría específica
 * Excluye el azul intenso, reservado para las categorías que lo tienen asignado explícitamente
 */
export const AVAILABLE_COLORS = [
  ROULETTE_COLORS.VERDE_SALUD,
  ROULETTE_COLORS.CELESTE_MEDIO,
  ROULETTE_COLORS.AMARILLO_DS,
  ROULETTE_COLORS.ROSADO_LILA,
];

/**
 * Mapeo de categorías específicas a sus colores designados.
 *
 * Las 6 temáticas del evento se dibujan en el orden en que aparecen en
 * `questions.json`; el azul intenso se repite en dos segmentos no adyacentes
 * (Abordaje ético y Manejo de síntomas) para que ningún par de vecinos comparta color.
 */
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  "Abordaje ético": ROULETTE_COLORS.AZUL_INTENSO,
  "Transiciones": ROULETTE_COLORS.VERDE_SALUD,
  "Trayectorias": ROULETTE_COLORS.AMARILLO_DS,
  "Manejo de síntomas": ROULETTE_COLORS.AZUL_INTENSO,
  "Innovación y proyección": ROULETTE_COLORS.CELESTE_MEDIO,
  "Estrategias prácticas": ROULETTE_COLORS.ROSADO_LILA,
};

/** Colores de texto candidatos para los títulos de los segmentos */
export const SEGMENT_TEXT_COLORS = {
  LIGHT: "#FFFFFF",
  DARK: "#1E1E1E",
} as const;

/**
 * Luminancia relativa según WCAG 2.x (0 = negro, 1 = blanco)
 * @param hexColor - Color en formato hexadecimal (#RRGGBB)
 */
function getRelativeLuminance(hexColor: string): number {
  const color = hexColor.replace("#", "");
  const channel = (offset: number) => {
    const value = parseInt(color.substr(offset, 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/**
 * Ratio de contraste WCAG entre dos colores (1 = sin contraste, 21 = máximo)
 */
function getContrastRatio(hexA: string, hexB: string): number {
  const luminanceA = getRelativeLuminance(hexA);
  const luminanceB = getRelativeLuminance(hexB);
  const [lighter, darker] = luminanceA >= luminanceB
    ? [luminanceA, luminanceB]
    : [luminanceB, luminanceA];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Regla única de legibilidad para los segmentos: se usa el color de texto
 * (blanco u oscuro) que tenga mayor ratio de contraste WCAG contra el fondo.
 * Con la paleta actual: blanco sobre azul intenso (13:1) y oscuro sobre el
 * resto (entre 7.9:1 y 9.6:1), ambos por encima del nivel AAA.
 *
 * @param hexColor - Color de fondo del segmento
 * @returns Color de texto (#FFFFFF o #1E1E1E)
 */
export function getContrastColor(hexColor: string): string {
  const withLight = getContrastRatio(hexColor, SEGMENT_TEXT_COLORS.LIGHT);
  const withDark = getContrastRatio(hexColor, SEGMENT_TEXT_COLORS.DARK);
  return withLight >= withDark ? SEGMENT_TEXT_COLORS.LIGHT : SEGMENT_TEXT_COLORS.DARK;
}

/**
 * Obtiene el color asignado para una categoría específica
 * @param category - Nombre de la categoría
 * @returns Color hexadecimal o undefined si no tiene color específico
 */
export function getCategoryColor(category: string): string | undefined {
  return CATEGORY_COLOR_MAP[category.trim()];
}
