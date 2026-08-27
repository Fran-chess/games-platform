/**
 * Gestión de segmentos de la ruleta
 * Maneja la creación, organización y asignación de colores a los segmentos
 */

import type { Question, WheelSegment } from '@/types';
import { getCategoryColor, AVAILABLE_COLORS } from './colors';

/**
 * Interfaz para segmento sin color asignado
 */
interface SegmentWithoutColor {
  text: string;
  questions: Question[];
}

/**
 * Asigna colores a los segmentos evitando colores adyacentes repetidos
 * Implementa un algoritmo inteligente de distribución de colores
 *
 * @param segments - Array de segmentos sin color
 * @returns Array de segmentos con colores asignados
 */
function assignColorsToSegments(segments: SegmentWithoutColor[]): WheelSegment[] {
  if (!segments || segments.length === 0) return [];

  const result: WheelSegment[] = [];
  const usedColors: string[] = [];

  segments.forEach((segment, index) => {
    const categoryColor = getCategoryColor(segment.text);

    // Si la categoría tiene un color específico asignado, usarlo
    if (categoryColor) {
      result.push({
        text: segment.text,
        color: categoryColor,
        questions: segment.questions
      });
      usedColors.push(categoryColor);
      return;
    }

    // Para categorías sin color específico, seleccionar inteligentemente
    const selectedColor = selectOptimalColor(
      index,
      segments,
      usedColors,
      AVAILABLE_COLORS
    );

    result.push({
      text: segment.text,
      color: selectedColor,
      questions: segment.questions
    });
    usedColors.push(selectedColor);
  });

  return result;
}

/**
 * Selecciona el color óptimo para un segmento evitando adyacencias
 *
 * @param currentIndex - Índice del segmento actual
 * @param allSegments - Todos los segmentos
 * @param usedColors - Colores ya utilizados
 * @param availableColors - Colores disponibles para selección
 * @returns Color hexadecimal seleccionado
 */
function selectOptimalColor(
  currentIndex: number,
  allSegments: SegmentWithoutColor[],
  usedColors: string[],
  availableColors: string[]
): string {
  // Obtener colores adyacentes para evitar
  const prevColor = currentIndex > 0 ? usedColors[currentIndex - 1] : null;
  const nextColor = getNextFixedColor(currentIndex, allSegments);

  // Filtrar colores que no sean adyacentes
  let candidateColors = availableColors.filter(color =>
    color !== prevColor && color !== nextColor
  );

  // Si no hay opciones, relajar restricciones
  if (candidateColors.length === 0) {
    candidateColors = availableColors.filter(color => color !== prevColor);
  }

  // Si aún no hay opciones, usar todos los colores disponibles
  if (candidateColors.length === 0) {
    candidateColors = [...availableColors];
  }

  // Seleccionar color usando distribución circular para mejor balance
  const colorIndex = currentIndex % candidateColors.length;
  return candidateColors[colorIndex];
}

/**
 * Obtiene el color fijo del siguiente segmento si existe
 *
 * @param currentIndex - Índice actual
 * @param segments - Array de segmentos
 * @returns Color del siguiente segmento con color fijo o null
 */
function getNextFixedColor(
  currentIndex: number,
  segments: SegmentWithoutColor[]
): string | null {
  const nextSegment = segments[currentIndex + 1];
  if (!nextSegment) return null;

  return getCategoryColor(nextSegment.text) || null;
}

/**
 * Agrupa las preguntas por categoría (sin normalizar para preservar las categorías originales)
 *
 * @param questions - Array de preguntas
 * @returns Objeto con preguntas agrupadas por categoría original
 */
function groupQuestionsByCategory(questions: Question[]): Record<string, Question[]> {
  const grouped: Record<string, Question[]> = {};

  questions.forEach(question => {
    const category = question.category; // NO normalizar aquí para mantener categorías separadas

    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(question);
  });

  return grouped;
}

/**
 * Crea los segmentos de la ruleta, uno por categoría, respetando el orden
 * en que las categorías aparecen en el archivo de preguntas.
 *
 * @param questions - Array de preguntas del juego
 * @returns Array de segmentos con colores asignados
 */
export function createRouletteSegments(questions: Question[]): WheelSegment[] {
  if (!questions || questions.length === 0) return [];

  const grouped = groupQuestionsByCategory(questions);

  const segments: SegmentWithoutColor[] = Object.keys(grouped).map(category => ({
    text: category,
    questions: grouped[category]
  }));

  return assignColorsToSegments(segments);
}