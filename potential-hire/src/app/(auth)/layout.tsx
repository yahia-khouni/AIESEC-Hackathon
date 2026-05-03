import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="gradient-hero min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center justify-center mb-8 relative z-10 group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="HirePotential Logo" className="w-auto h-24 rounded-2xl object-contain drop-shadow-lg group-hover:scale-105 transition-transform invert dark:invert-0" />
      </Link>

      {/* Auth card */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground relative z-10">
        © 2026 PotentialHire. Built for AIESEC Hackathon.
      </p>
    </div>
  );
}
