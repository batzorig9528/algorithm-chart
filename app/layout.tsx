import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthDialog } from "@/components/auth/auth-dialog";

export const metadata: Metadata = {
  title: "Flow — Алгоритмыг дүрслэн бодъё",
  description:
    "Блокоор алгоритм угсарч, алхам бүрээр ажиллуулан програмчлал сур.",
};

// Applies a saved theme before first paint so there is no light flash in dark mode.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          {children}
          <AuthDialog />
        </AuthProvider>
      </body>
    </html>
  );
}
