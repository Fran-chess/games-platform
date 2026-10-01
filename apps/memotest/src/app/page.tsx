import { MemoGame } from '@/components/game/MemoGame';

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* El juego está pensado para la tablet en horizontal */}
      <div className="h-full portrait:hidden">
        <MemoGame />
      </div>

      <div className="hidden portrait:flex absolute inset-0 bg-blue-900 flex-col items-center justify-center text-center p-8">
        <svg
          className="w-24 h-24 mb-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <h2 className="text-4xl font-bold mb-4 text-white">Rota tu dispositivo</h2>
        <p className="text-xl text-blue-200">Este juego solo funciona en modo horizontal</p>
      </div>
    </main>
  );
}
