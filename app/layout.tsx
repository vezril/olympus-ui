import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { AppSidebar } from "@/components/app-sidebar";
import { HealthProvider } from "@/components/health-context";

import "./globals.css";

export const metadata: Metadata = {
  title: "Olympus",
  description: "The constellation's front door — every console, one login.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#06060F",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body className="antialiased">
        <HealthProvider>
          <div className="flex min-h-dvh flex-col md:flex-row">
            <AppSidebar />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </HealthProvider>
      </body>
    </html>
  );
}
