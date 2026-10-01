import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Mismo valor que theme_color en public/manifest.json
  themeColor: "#0652D4",
};

// Sin nombre de evento: el juego se reutiliza de un congreso a otro.
// Next genera desde acá el <link rel="manifest">, los íconos y los metas de PWA.
export const metadata: Metadata = {
  title: "MemoTest DarSalud",
  description: "Juego de memoria interactivo para tablets - DarSalud",
  manifest: "/manifest.json",
  applicationName: "MemoTest DarSalud",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MemoTest DarSalud",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full overflow-hidden">
      <body className="bg-game-gradient h-screen font-sans text-white">
        <PerformanceMonitor />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
