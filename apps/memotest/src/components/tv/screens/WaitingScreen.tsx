import { useSSR } from '@/hooks/useSSR';
import { MotionDiv } from '../shared/MotionComponents';
import { useGameStore } from '@/store/gameStore';

/**
 * Pantalla de espera con fondo limpio y logo flotante
 * Se muestra antes de comenzar el juego
 * Reacciona al toque para iniciar
 */
export default function WaitingScreen() {
  const { isMounted } = useSSR();
  const setGameState = useGameStore((state) => state.setGameState);

  // Manejar el toque/click para iniciar el juego
  const handleTouch = () => {
    setGameState('roulette');
  };

  if (!isMounted) {
    return null;
  }

  return (
    <MotionDiv
      key="waiting-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen w-full bg-cyan-600 overflow-hidden cursor-pointer"
      style={{
        minHeight: '100dvh'
      }}
      role="main"
      aria-label="Pantalla de espera - Toca para jugar"
      onClick={handleTouch}
      onTouchStart={handleTouch}
    >
      {/* Logo DarSalud flotante centrado */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{
            opacity: { duration: 0.8, ease: "easeOut" },
            scale: { duration: 0.8, ease: "easeOut" },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <img
            src="/images/8.svg"
            alt="DarSalud Logo"
            className="w-[32rem] h-[32rem] object-contain"
            style={{ filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.25))' }}
          />
        </MotionDiv>
      </div>
      
      {/* Indicador sutil de que se puede tocar para jugar */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute bottom-10 left-0 right-0 text-center z-30"
      >
        <MotionDiv
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <p className="text-white text-2xl font-bold drop-shadow-lg">
            Toca la pantalla para jugar
          </p>
        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  );
}