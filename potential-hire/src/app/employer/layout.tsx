"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import type { Employer } from "@/types";
import NotificationBell from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Search,
  BookmarkCheck,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  X,
  Building2,
  ChevronRight,
  Rocket,
} from "lucide-react";

const navItems = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/talent-search", label: "Talent Search", icon: Search },
  { href: "/employer/pipeline", label: "Pipeline", icon: BookmarkCheck },
  { href: "/employer/marketplace", label: "Marketplace", icon: Briefcase },
  { href: "/employer/jobs", label: "Job Posts", icon: FileText },
  { href: "/employer/settings", label: "Settings", icon: Settings },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free Trial",
  startup: "Startup Plan",
  growth: "Growth Plan",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  startup: "bg-blue-500/20 text-blue-400",
  growth: "bg-violet-500/20 text-violet-400",
  enterprise: "bg-amber-500/20 text-amber-400",
};

function SidebarContent({
  employer,
  onClose,
}: {
  employer: Employer | null;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserSupabase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  const planKey = employer?.plan ?? "free";
  const initials = employer?.company_name?.slice(0, 2).toUpperCase() ?? "EM";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            Hire<span className="text-primary">Potential</span>
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Company Info */}
      {employer && (
        <>
          <div className="px-4 pb-3">
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {employer.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={employer.logo_url}
                    alt={employer.company_name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {employer.company_name}
                </p>
                <Badge
                  className={`text-[10px] px-2 py-0 mt-0.5 ${PLAN_COLORS[planKey]}`}
                >
                  {PLAN_LABELS[planKey]}
                </Badge>
              </div>
            </div>
          </div>
        </>
      )}

      <Separator className="opacity-50" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Views Remaining */}
      {employer && (
        <div className="px-4 pb-2">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                Candidate Views
              </span>
              <span className="text-xs font-bold text-primary">
                {employer.candidate_views_remaining}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="gradient-primary h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (employer.candidate_views_remaining / (planKey === "free" ? 20 : planKey === "startup" ? 100 : 500)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              remaining this month
            </p>
          </div>
        </div>
      )}

      <Separator className="opacity-50" />

      {/* User section */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {employer?.company_name ?? "Employer"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {PLAN_LABELS[planKey]}
            </p>
          </div>
        </div>
        <div className="mb-2">
          <ThemeToggle />
        </div>
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

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const supabase = createBrowserSupabase();

  useEffect(() => {
    async function loadEmployer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("employers")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setEmployer(data as Employer);
    }
    loadEmployer();
  }, [supabase]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-sidebar">
        <SidebarContent employer={employer} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger>
          <div role="button" aria-label="Open menu" className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar border border-border/50 shadow-lg cursor-pointer">
            <Menu className="w-5 h-5" />
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent
            employer={employer}
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border/50 bg-sidebar/50 backdrop-blur-sm flex items-center justify-end px-6 shrink-0">
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {employer?.company_name?.slice(0, 2).toUpperCase() ?? "EM"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
