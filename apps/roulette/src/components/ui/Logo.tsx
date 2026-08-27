"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * Lado del logo en px CSS. El SVG es cuadrado (viewBox 21000×21000), así que ancho = alto.
 * En la tablet (800×1280) la rueda está limitada por el ancho, no por el alto: este valor
 * puede crecer hasta ~480 sin quitarle tamaño a la ruleta ni a la tarjeta de pregunta.
 */
const LOGO_SIZE = 240;

/**
 * Logo DarSalud, cabecera de todas las vistas del juego.
 * Tamaño fijo desde el primer render: sin salto de layout al montar.
 */
export default function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
    >
      <Image
        src="/images/8.svg"
        alt="Logo DarSalud"
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        priority
        className="drop-shadow-lg"
      />
    </motion.div>
  );
}
