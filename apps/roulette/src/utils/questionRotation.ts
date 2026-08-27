/**
 * Rotación de preguntas por categoría
 *
 * La ruleta puede caer varias veces en la misma categoría; para que el público
 * no vea dos veces la misma pregunta, cada categoría recorre todo su pool antes
 * de volver a empezar. Al reiniciar el ciclo, la primera pregunta nunca es la
 * última que se mostró en esa categoría.
 *
 * `askedIds` es el historial cronológico de ids ya mostrados, con todas las
 * categorías mezcladas; la función solo toca los ids que pertenecen al pool.
 */

import type { Question } from '@/types';

export interface QuestionDraw {
  question: Question;
  /** Historial actualizado, listo para guardar */
  askedIds: string[];
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Elige la próxima pregunta de un pool sin repetir las ya mostradas
 *
 * @param pool - Preguntas de la categoría ganadora
 * @param askedIds - Ids ya mostrados, del más antiguo al más reciente
 * @returns La pregunta y el historial actualizado; null si el pool está vacío
 */
export function pickNextQuestion(pool: Question[], askedIds: readonly string[]): QuestionDraw | null {
  if (pool.length === 0) return null;

  const pending = pool.filter((question) => !askedIds.includes(question.id));
  if (pending.length > 0) {
    const question = pickRandom(pending);
    return { question, askedIds: [...askedIds, question.id] };
  }

  // Ciclo completo: se libera la categoría y arranca uno nuevo sin repetir la última
  const poolIds = new Set(pool.map((question) => question.id));
  const lastAskedId = askedIds.findLast((id) => poolIds.has(id));
  const candidates = pool.length > 1 ? pool.filter((question) => question.id !== lastAskedId) : pool;
  const question = pickRandom(candidates);

  return {
    question,
    askedIds: [...askedIds.filter((id) => !poolIds.has(id)), question.id],
  };
}
