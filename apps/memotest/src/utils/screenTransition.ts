import { flushSync } from 'react-dom';

/**
 * Cambia de pantalla con un fundido entre la vista anterior y la nueva (View Transitions API).
 * El navegador captura las dos vistas y las funde en el compositor: no hay animación de salida
 * que mantener en React ni JavaScript por frame. La duración está en globals.css.
 *
 * `update` se ejecuta en el frame siguiente, no de inmediato: el navegador primero captura
 * la vista actual. Si la API no existe, se ejecuta en el momento y el cambio es un corte.
 *
 * @param update Cambio de estado que provoca el cambio de pantalla
 */
export function screenTransition(update: () => void): void {
  if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
    update();
    return;
  }

  // flushSync: el DOM tiene que estar actualizado cuando el callback termina,
  // porque ahí el navegador captura la vista nueva
  document.startViewTransition(() => {
    flushSync(update);
  });
}
