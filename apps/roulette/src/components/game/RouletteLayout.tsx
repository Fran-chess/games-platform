// src/components/game/RouletteLayout.tsx
"use client";

import { ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import { useGameStore } from "@/store/gameStore";
import { useWindowSize } from "@/hooks/useWindowSize";
import { MassiveConfetti } from "@games-platform/ui";

interface RouletteLayoutProps {
  children: ReactNode;
  buttons?: ReactNode;
}

export default function RouletteLayout({ children, buttons }: RouletteLayoutProps) {
  const showConfetti = useGameStore((state) => state.showConfetti);
  const windowSize = useWindowSize();

  return (
    <div className="h-screen bg-game-gradient relative overflow-hidden">
      <MassiveConfetti show={showConfetti} windowSize={windowSize} />

      <main className="h-full flex flex-col w-full items-center justify-between">
        {/* LOGO */}
        <div className="flex justify-center items-center z-20 relative mb-4">
          <Logo />
        </div>

        {/* CONTENIDO CENTRAL: la ruleta toma el menor lado de este contenedor */}
        <div className="flex-1 w-full flex items-center justify-center min-h-[520px]">
          <div className="w-full h-full max-w-[780px] flex items-center justify-center">
            {children}
          </div>
        </div>

        {/* BOTONES (si existen) */}
        {buttons && (
          <div className="flex justify-center items-center w-full z-10 relative gap-4">
            {buttons}
          </div>
        )}
      </main>
    </div>
  );
}
