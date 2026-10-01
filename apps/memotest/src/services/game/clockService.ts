/**
 * Clock Service - Cuenta regresiva a 1 Hz con corrección de deriva
 * Un tick por segundo alcanza para el HUD y evita trabajo por frame
 * @module clockService
 */

type ClockCallback = (timeLeft: number) => void;

class ClockService {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Inicia una cuenta regresiva y reemplaza a la anterior, si había una
   * @param seconds Duración en segundos
   * @param onTick Recibe el tiempo restante: al iniciar y luego una vez por segundo, hasta 0
   */
  start(seconds: number, onTick: ClockCallback): void {
    this.stop();

    const startTime = Date.now();
    onTick(seconds);

    this.intervalId = setInterval(() => {
      // Corrección de deriva: el tiempo restante sale del reloj real, no de contar ticks
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const timeLeft = Math.max(0, seconds - elapsed);

      // Se detiene antes de avisar: en 0 el callback puede iniciar la cuenta siguiente
      if (timeLeft === 0) {
        this.stop();
      }
      onTick(timeLeft);
    }, 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Instancia única exportada
export const clockService = new ClockService();
