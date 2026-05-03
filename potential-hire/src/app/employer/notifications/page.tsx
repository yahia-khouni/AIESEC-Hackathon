"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@/types";
import {
  Bell,
  BellOff,
  CheckCheck,
  TrendingUp,
  Bookmark,
  Briefcase,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  score_update: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  bookmark: { icon: Bookmark, color: "text-amber-400", bg: "bg-amber-500/10" },
  match: { icon: AlertCircle, color: "text-primary", bg: "bg-primary/10" },
  internship: { icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10" },
  system: { icon: MessageSquare, color: "text-muted-foreground", bg: "bg-muted" },
};

export default function EmployerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const key = new Date(n.created_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stay updated on your candidates and matches
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark all read
            <Badge className="ml-2 bg-primary/20 text-primary text-[10px]">{unreadCount}</Badge>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass rounded-xl p-16 text-center">
          <BellOff className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold mb-2">All caught up!</h3>
          <p className="text-sm text-muted-foreground">
            You&apos;ll be notified when candidates hit your readiness threshold or new matches appear.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {date}
              </h3>
              <div className="space-y-2">
                {items.map((n) => {
                  const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
                  const Icon = config.icon;
                  return (
                    <div
                      key={n.id}
                      className={`glass rounded-xl p-4 flex items-start gap-4 transition-all ${
                        !n.read ? "ring-1 ring-primary/20 bg-primary/5" : ""
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">
                          {new Date(n.created_at).toLocaleTimeString("en-US", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {n.action_url && (
                          <Link href={n.action_url}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </Link>
                        )}
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => markRead(n.id)}
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
