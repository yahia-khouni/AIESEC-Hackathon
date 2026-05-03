import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PotentialHire — Get Hired for Your Potential",
  description:
    "AI-powered employment platform that matches candidates with employers based on future potential, not just past credentials. Build skills, track progress, and get discovered.",
  keywords: [
    "jobs",
    "hiring",
    "AI",
    "potential",
    "career",
    "skills",
    "roadmap",
    "junior",
    "graduate",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
