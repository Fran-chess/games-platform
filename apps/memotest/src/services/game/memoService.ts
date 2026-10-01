/**
 * Servicio de lógica de negocio del MemoTest
 * Centraliza las reglas y mecánicas del juego
 */

/**
 * Íconos disponibles para las cartas (set "Cuidados Paliativos").
 * Cada partida sortea `totalPairs` de ellos. Los dibujos están en components/game/cardIcons.tsx.
 */
export const CARD_ICON_IDS = [
  'manos-corazon',
  'casa',
  'mariposa',
  'familia',
  'camino',
  'capsula',
  'estetoscopio',
  'tablet-salud',
  'girasol',
] as const;

export type CardIconId = (typeof CARD_ICON_IDS)[number];

export interface MemoCard {
  id: string;
  value: string;
  icon: CardIconId;
  isFlipped: boolean;
  isMatched: boolean;
  position: number;
}

export interface PrizeCard {
  id: string;
  hasPrize: boolean;
  isRevealed: boolean;
  position: number;
}

export interface GameConfig {
  totalPairs: number;
  requiredPairs: number;
  maxMoves: number;
  memorizationTime: number;
  gameTime: number;
  shuffleAnimationTime: number;
}

export interface GameValidation {
  hasWon: boolean;
  hasFailed: boolean;
  reason?: 'max_moves' | 'time_up' | 'success';
}

/**
 * Configuración por defecto del juego
 */
const DEFAULT_CONFIG: GameConfig = {
  totalPairs: 6,
  requiredPairs: 2,
  maxMoves: 3,
  memorizationTime: 5, // 5 segundos para memorizar 12 cartas
  gameTime: 120,
  shuffleAnimationTime: 2,
};

/**
 * Clase principal del servicio de MemoTest
 */
export class MemoService {
  private config: GameConfig;

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Genera las cartas para el juego: sortea los íconos de la partida y arma los pares
   */
  generateCards(): MemoCard[] {
    const selectedIcons = this.shuffle(CARD_ICON_IDS).slice(0, this.config.totalPairs);

    // Crear pares de cartas
    const cards: MemoCard[] = [];
    selectedIcons.forEach((icon, index) => {
      for (let i = 0; i < 2; i++) {
        cards.push({
          id: `card-${index}-${i}`,
          value: `value-${index}`,
          icon,
          isFlipped: false,
          isMatched: false,
          position: 0
        });
      }
    });

    return this.shuffle(cards).map((card, index) => ({
      ...card,
      position: index
    }));
  }

  /**
   * Devuelve una copia mezclada (Fisher-Yates)
   */
  private shuffle<T>(items: readonly T[]): T[] {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Genera 3 cartas de premio (1 ganadora, 2 perdedoras)
   */
  generatePrizeCards(): PrizeCard[] {
    const cards: PrizeCard[] = [
      { id: 'prize-0', hasPrize: true, isRevealed: false, position: 0 },
      { id: 'prize-1', hasPrize: false, isRevealed: false, position: 1 },
      { id: 'prize-2', hasPrize: false, isRevealed: false, position: 2 },
    ];

    // Aleatorizar la posición de la carta ganadora
    return this.shuffle(cards).map((card, index) => ({
      ...card,
      position: index
    }));
  }

  /**
   * Valida si dos cartas coinciden
   */
  checkMatch(card1: MemoCard, card2: MemoCard): boolean {
    return card1.value === card2.value;
  }

  /**
   * Valida el estado del juego (victoria o derrota)
   */
  validateGameState(
    matchesFound: number,
    movesUsed: number,
    timeRemaining: number
  ): GameValidation {
    // Victoria: encontró los pares requeridos
    if (matchesFound >= this.config.requiredPairs) {
      return {
        hasWon: true,
        hasFailed: false,
        reason: 'success'
      };
    }

    // Derrota anticipada: es matemáticamente imposible ganar
    // Si los pares encontrados + movimientos restantes < pares requeridos → perdió
    const movesLeft = this.config.maxMoves - movesUsed;
    const maxPossibleMatches = matchesFound + movesLeft;
    if (maxPossibleMatches < this.config.requiredPairs) {
      return {
        hasWon: false,
        hasFailed: true,
        reason: 'max_moves'
      };
    }

    // Derrota: se acabaron los movimientos
    if (movesUsed >= this.config.maxMoves) {
      return {
        hasWon: false,
        hasFailed: true,
        reason: 'max_moves'
      };
    }

    // Derrota: se acabó el tiempo
    if (timeRemaining <= 0) {
      return {
        hasWon: false,
        hasFailed: true,
        reason: 'time_up'
      };
    }

    // Juego en progreso
    return {
      hasWon: false,
      hasFailed: false
    };
  }

  /**
   * Calcula el puntaje basado en tiempo y movimientos
   */
  calculateScore(movesUsed: number, timeElapsed: number): number {
    const baseScore = 1000;
    const movePenalty = (movesUsed - 1) * 100; // Penalización por movimientos extra
    const timeBonus = Math.max(0, this.config.gameTime - timeElapsed) * 2;

    return Math.max(0, baseScore - movePenalty + timeBonus);
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): GameConfig {
    return { ...this.config };
  }
}

// Exportar instancia por defecto
export const memoService = new MemoService();