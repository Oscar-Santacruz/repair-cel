import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reparar-Cel",
  description: "Sistema de gestión de venta y financiación de equipos.",
};

import { PostHogProvider } from "@/components/providers/posthog-provider";
import SuspendedPostHogPageView from "@/components/posthog-pageview";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <AuthProvider>
              <SuspendedPostHogPageView />
              {children}
              <Toaster />
            </AuthProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
