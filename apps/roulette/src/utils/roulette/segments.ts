/**
 * Gestión de segmentos de la ruleta
 * Maneja la creación, organización y asignación de colores a los segmentos
 */

import type { Question } from '@/types';
import {
  getCategoryColor,
  normalizeCategory,
  AVAILABLE_COLORS
} from './colors';

/**
 * Interfaz para un segmento de la ruleta
 */
export interface WheelSegment {
  text: string;
  color: string;
  questions: Question[];
}

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
export function assignColorsToSegments(segments: SegmentWithoutColor[]): WheelSegment[] {
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
export function groupQuestionsByCategory(questions: Question[]): Record<string, Question[]> {
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
 * Crea los segmentos de la ruleta distribuyendo las categorías estratégicamente
 * Asegura que las categorías "Dar Salud" aparezcan dos veces en posiciones no consecutivas
 *
 * @param questions - Array de preguntas del juego
 * @returns Array de segmentos con colores asignados
 */
export function createRouletteSegments(questions: Question[]): WheelSegment[] {
  if (!questions || questions.length === 0) return [];

  const grouped = groupQuestionsByCategory(questions);
  const categories = Object.keys(grouped);
  const segments: SegmentWithoutColor[] = [];
  const darSaludCategories: string[] = [];

  // Identificar categorías "Dar Salud" y categorías regulares
  categories.forEach(category => {
    if (category.startsWith("Dar Salud")) {
      darSaludCategories.push(category);
    } else {
      segments.push({
        text: category,
        questions: grouped[category]
      });
    }
  });

  // Insertar segmentos "Dar Salud" estratégicamente
  if (darSaludCategories.length > 0) {
    insertDarSaludSegments(segments, grouped, darSaludCategories);
  }

  return assignColorsToSegments(segments);
}

/**
 * Inserta los segmentos de "Dar Salud" en posiciones estratégicas
 * Cada segmento mantiene sus preguntas específicas pero se muestra como "Dar Salud"
 *
 * @param segments - Array de segmentos donde insertar
 * @param grouped - Objeto con todas las preguntas agrupadas por categoría
 * @param darSaludCategories - Array con los nombres de las categorías "Dar Salud"
 */
function insertDarSaludSegments(
  segments: SegmentWithoutColor[],
  grouped: Record<string, Question[]>,
  darSaludCategories: string[]
): void {
  const totalSegments = segments.length + darSaludCategories.length;

  // Si hay 2 o más categorías Dar Salud, distribuirlas estratégicamente
  if (darSaludCategories.length >= 2) {
    // Calcular posiciones óptimas (aproximadamente 1/3 y 2/3 del círculo)
    const firstPosition = Math.floor(totalSegments / 3);
    const secondPosition = Math.floor((totalSegments * 2) / 3);

    // Insertar primer segmento "Dar Salud" con sus preguntas específicas
    segments.splice(firstPosition, 0, {
      text: normalizeCategory(darSaludCategories[0]), // "Dar Salud"
      questions: grouped[darSaludCategories[0]]
    });

    // Insertar segundo segmento "Dar Salud" con sus preguntas específicas
    segments.splice(secondPosition + 1, 0, {
      text: normalizeCategory(darSaludCategories[1]), // "Dar Salud"
      questions: grouped[darSaludCategories[1]]
    });

    // Si hay más de 2, agregar al final
    for (let i = 2; i < darSaludCategories.length; i++) {
      segments.push({
        text: normalizeCategory(darSaludCategories[i]),
        questions: grouped[darSaludCategories[i]]
      });
    }
  } else if (darSaludCategories.length === 1) {
    // Si solo hay una, agregarla en posición estratégica
    const position = Math.floor(totalSegments / 2);
    segments.splice(position, 0, {
      text: normalizeCategory(darSaludCategories[0]),
      questions: grouped[darSaludCategories[0]]
    });
  }
}

/**
 * Valida si los segmentos están correctamente configurados
 *
 * @param segments - Array de segmentos a validar
 * @returns true si los segmentos son válidos
 */
export function validateSegments(segments: WheelSegment[]): boolean {
  if (!segments || segments.length === 0) return false;

  return segments.every(segment =>
    segment.text &&
    segment.color &&
    segment.questions &&
    segment.questions.length > 0
  );
}