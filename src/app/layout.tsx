import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { getSettings } from "@/lib/settings";
import { appUrl } from "@/lib/env";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(appUrl()),
    title: { default: `${s.companyName} — ${s.slogan}`, template: `%s | ${s.companyName}` },
    description: s.seoDescription,
    applicationName: s.companyName,
    openGraph: { siteName: s.companyName, locale: "pt_BR", type: "website" },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${inter.variable} ${space.variable}`}>
      <body>
        <a href="#conteudo" className="sr-only z-[200] rounded-lg bg-neon px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Pular para o conteúdo
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
