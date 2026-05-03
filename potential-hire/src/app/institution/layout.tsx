"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, BarChart3, Settings, LogOut, Menu, Sparkles, X, ChevronRight, GraduationCap,
} from "lucide-react";

const navItems = [
  { href: "/institution/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/institution/cohorts", label: "Cohorts", icon: Users },
  { href: "/institution/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/institution/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserSupabase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Potential<span className="gradient-text">Hire</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">Institution Portal</span>
        </div>
      </div>

      <Separator className="opacity-50" />

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-primary/60" />}
            </Link>
          );
        })}
      </nav>

      <Separator className="opacity-50" />
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-sidebar">
        <SidebarContent />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger>
          <div role="button" aria-label="Open menu" className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar border border-border/50 shadow-lg cursor-pointer">
            <Menu className="w-5 h-5" />
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
