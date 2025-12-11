import type { Metadata } from "next";
import "./globals.css";
import GoogleAdSense from "@/components/GoogleAdSense";
import Analytics from "@/components/Analytics";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "utku tarhan",
  description: "Yapay zeka destekli yemek analizi ve kalori takip asistanı. Fotoğraf yükle, anında besin değerlerini öğren.",
  keywords: ["kalori hesaplama", "yemek analizi", "diyet", "yapay zeka", "sağlıklı beslenme"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <GoogleAdSense pId="ca-pub-XXXXXXXXXXXXXXXX" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Analytics />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
