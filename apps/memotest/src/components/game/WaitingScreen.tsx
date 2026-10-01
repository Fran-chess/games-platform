/**
 * Pantalla de espera: logo de DarSalud y llamado a tocar.
 * Es solo presentación; el toque lo maneja quien la monta.
 * Los movimientos en reposo son animaciones CSS de transform/opacity (globals.css):
 * las resuelve el compositor, sin JavaScript por frame.
 */
export function WaitingScreen() {
  return (
    <div className="relative h-full w-full bg-cyan-600 overflow-hidden cursor-pointer">
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/images/8.svg"
          alt="DarSalud"
          className="waiting-logo w-[32rem] h-[32rem] object-contain select-none"
          draggable={false}
        />
      </div>

      <p className="waiting-hint absolute bottom-10 inset-x-0 text-center text-white text-2xl font-bold text-shadow-md">
        Toca la pantalla para jugar
      </p>
    </div>
  );
}
