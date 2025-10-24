/**
 * Clock Service - Reloj centralizado a 1 Hz con corrección de deriva
 * Evita rAF a 60 FPS, optimiza performance en tablets
 * @module clockService
 */

type ClockCallback = (timeLeft: number) => void;

class ClockService {
  private intervalId: number | null = null;
  private startTime: number = 0;
  private duration: number = 0;
  private elapsed: number = 0;
  private callback: ClockCallback | null = null;
  private isRunning: boolean = false;

  /**
   * Inicia el reloj
   * @param seconds Duración en segundos
   * @param onTick Callback que recibe el tiempo restante cada segundo
   */
  start(seconds: number, onTick: ClockCallback): void {
    this.stop(); // Cancelar reloj previo si existe

    this.duration = seconds;
    this.elapsed = 0;
    this.callback = onTick;
    this.isRunning = true;
    this.startTime = Date.now();

    // Emitir inmediatamente el valor inicial
    if (this.callback) {
      this.callback(this.duration);
    }

    // Intervalo a 1 Hz con corrección de deriva
    this.intervalId = window.setInterval(() => {
      if (!this.isRunning) return;

      const now = Date.now();
      const actualElapsed = Math.floor((now - this.startTime) / 1000);

      // Corrección de deriva: usar tiempo real, no acumulado
      this.elapsed = actualElapsed;
      const timeLeft = Math.max(0, this.duration - this.elapsed);

      if (this.callback) {
        this.callback(timeLeft);
      }

      // Detener al llegar a 0
      if (timeLeft === 0) {
        this.stop();
      }
    }, 1000);
  }

  /**
   * Detiene el reloj
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.callback = null;
  }

  /**
   * Pausa el reloj (mantiene el tiempo actual)
   */
  pause(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Resume el reloj pausado
   */
  resume(): void {
    if (this.isRunning || !this.callback) return;

    this.isRunning = true;
    const remainingTime = this.duration - this.elapsed;
    this.startTime = Date.now() - (this.elapsed * 1000);

    this.intervalId = window.setInterval(() => {
      if (!this.isRunning) return;

      const now = Date.now();
      const actualElapsed = Math.floor((now - this.startTime) / 1000);

      this.elapsed = actualElapsed;
      const timeLeft = Math.max(0, this.duration - this.elapsed);

      if (this.callback) {
        this.callback(timeLeft);
      }

      if (timeLeft === 0) {
        this.stop();
      }
    }, 1000);
  }

  /**
   * Obtiene el estado actual del reloj
   */
  getState(): { isRunning: boolean; elapsed: number; duration: number } {
    return {
      isRunning: this.isRunning,
      elapsed: this.elapsed,
      duration: this.duration,
    };
  }
}

// Instancia única exportada
export const clockService = new ClockService();
