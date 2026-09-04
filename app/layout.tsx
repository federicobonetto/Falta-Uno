import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Falta Uno | Encontrá jugadores de pádel",
  description: "Encontrá jugadores de tu nivel, completá el equipo y armá tu próximo partido de pádel sin vueltas.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
