/**
 * DefeatScreen - Pantalla de derrota (sin intentos o sin tiempo)
 * @module DefeatScreen
 */

import { EndPanel } from './EndPanel';

export function DefeatScreen() {
  return (
    <div data-testid="defeat-screen" className="h-full flex items-center justify-center p-6 bg-black/40">
      <EndPanel hasPrize={false} />
    </div>
  );
}
