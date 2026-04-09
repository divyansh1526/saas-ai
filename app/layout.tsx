import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { ProModalProvider } from "@/hooks/use-pro-modal";
import ProModal from "@/components/pro-modal";



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Companion",
  description:
    "AI Companion made using Next.js, React.js, TypeScript, TailwindCSS, Prisma & Stripe."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={cn("bg-secondary", inter.className)}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ProModalProvider>
              {children}
              <ProModal />
              <Toaster position="top-right" />
            </ProModalProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
