// src/components/game/RouletteLayout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import Logo from "@/components/ui/Logo";
import { useGameStore } from "@/store/gameStore";
import { MassiveConfetti } from "@games-platform/ui";

interface RouletteLayoutProps {
  children: ReactNode;
  buttons?: ReactNode;
}

export default function RouletteLayout({ children, buttons }: RouletteLayoutProps) {
  const showConfetti = useGameStore((state) => state.showConfetti);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  return (
    <div className="h-screen bg-game-gradient relative overflow-hidden">
      {/* CONFETTI */}
      <MassiveConfetti
        show={showConfetti}
        windowSize={windowSize}
      />

      {/* Layout con espacio optimizado por la eliminación del botón inferior */}
      <main className="h-full flex flex-col w-full items-center justify-between py-6">
        {/* LOGO - Tamaño original grande */}
        <div className="flex justify-center items-center z-20 relative mb-4">
          <Logo
            size="lg"
            variant="default"
            animated={true}
            withShadow={true}
            className="transition-all duration-300 ease-out"
          />
        </div>

        {/* CONTENEDOR CENTRAL - Un poco más de espacio para la ruleta */}
        <div className="flex-1 w-full flex items-center justify-center min-h-[520px]">
          {/* Wrapper ligeramente aumentado */}
          <div className="w-full h-full max-w-[550px] flex items-center justify-center">
            {children}
          </div>
        </div>

        {/* BOTONES - Parte inferior (si existen) */}
        {buttons && (
          <div className="flex justify-center items-center w-full z-10 relative gap-4">
            {buttons}
          </div>
        )}
      </main>
    </div>
  );
}