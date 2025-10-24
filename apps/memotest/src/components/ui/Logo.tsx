"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface LogoProps {
  /** Tamaño del logo: 'sm' (pequeño), 'md' (mediano), 'lg' (grande) o 'auto' (responsivo automático) */
  size?: "sm" | "md" | "lg" | "auto";
  /** Variante del logo que controla la prominencia visual */
  variant?: "default" | "subtle" | "minimal" | "watermark";
  /** Controla si el logo tiene animación de entrada */
  animated?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Controla si se mostrará sombra debajo del logo */
  withShadow?: boolean;
}

const Logo = ({
  size = "auto",
  variant = "default",
  animated = true,
  className = "",
  withShadow = true,
}: LogoProps) => {
  // Estados para dimensiones
  const [dimensions, setDimensions] = useState({ width: 200, height: 60 });

  useEffect(() => {
    // Función de cálculo de dimensiones (pura, sin side effects)
    const calculateDimensions = (width: number, height: number) => {
      if (size !== "auto") {
        const baseSizesMap = {
          sm: { width: 160, height: 48 },
          md: { width: 240, height: 72 },
          lg: { width: 400, height: 200 },
        };

        let newDimensions = baseSizesMap[size];

        // Ajustar según variante
        const variantMultiplier =
          variant === "subtle" ? 0.92 :
          variant === "minimal" ? 0.85 :
          variant === "watermark" ? 0.75 :
          1.0;

        return {
          width: Math.round(newDimensions.width * variantMultiplier),
          height: Math.round(newDimensions.height * variantMultiplier)
        };
      }

      // Lógica responsiva para tamaño automático
      let baseDimensions;
      if (width >= 2160 && height >= 3840) {
        baseDimensions = { width: 600, height: 180 };
      } else if (width >= 768 && width <= 1200 && height > width) {
        baseDimensions = { width: 400, height: 200 };
      } else if (width < 768) {
        baseDimensions = { width: 220, height: 66 };
      } else {
        baseDimensions = { width: 380, height: 114 };
      }

      // Aplicar modificadores de variante
      const variantMultiplier =
        variant === "subtle" ? 0.92 :
        variant === "minimal" ? 0.85 :
        variant === "watermark" ? 0.75 :
        1.0;

      return {
        width: Math.round(baseDimensions.width * variantMultiplier),
        height: Math.round(baseDimensions.height * variantMultiplier)
      };
    };

    // Throttle: máximo 1 actualización cada 150ms
    let throttleTimeout: NodeJS.Timeout | null = null;
    let lastUpdate = 0;

    const updateSize = () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdate;

      // Si han pasado más de 150ms, actualizar inmediatamente
      if (timeSinceLastUpdate >= 150) {
        lastUpdate = now;
        const newDimensions = calculateDimensions(window.innerWidth, window.innerHeight);
        setDimensions(newDimensions);
      } else {
        // Si no, programar actualización para completar los 150ms
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
          lastUpdate = Date.now();
          const newDimensions = calculateDimensions(window.innerWidth, window.innerHeight);
          setDimensions(newDimensions);
        }, 150 - timeSinceLastUpdate);
      }
    };

    // Calcular dimensiones iniciales
    const initialDimensions = calculateDimensions(window.innerWidth, window.innerHeight);
    setDimensions(initialDimensions);

    // ResizeObserver (más eficiente que window.resize)
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    // Observar el body (se redimensiona con la ventana)
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [size, variant]);

  // Determinar clases CSS basadas en la variante
  const getVariantClasses = () => {
    switch (variant) {
      case "subtle":
        return "logo-variant-subtle";
      case "minimal":
        return "logo-variant-minimal";
      case "watermark":
        return "logo-variant-watermark";
      default:
        return "opacity-100";
    }
  };

  // Ajustar sombra según variante
  const getShadowClass = () => {
    if (!withShadow) return "";
    
    switch (variant) {
      case "subtle":
        return "drop-shadow-md";
      case "minimal":
        return "drop-shadow-sm";
      case "watermark":
        return "drop-shadow-sm";
      default:
        return "drop-shadow-lg";
    }
  };

  // Componente del logo
  const logoContent = (
    <Image
      src="/images/8.svg"
      alt="Logo DarSalud"
      width={dimensions.width}
      height={dimensions.height}
      priority
      className={`
        object-contain transition-all duration-300 ease-out
        ${getShadowClass()}
        ${getVariantClasses()}
      `}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    />
  );

  if (animated) {
    // CORREGIDO: Ajustar animación según variante con tipos correctos
    const animationProps = variant === "watermark" || variant === "minimal" 
      ? { duration: 0.5, ease: "easeInOut" as const } 
      : { duration: 0.8, type: "spring" as const, stiffness: 120 };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={animationProps}
        className={`logo-responsive ${className}`}
      >
        {logoContent}
      </motion.div>
    );
  }

  return (
    <div className={`logo-responsive ${className}`}>
      {logoContent}
    </div>
  );
};

export default Logo;
