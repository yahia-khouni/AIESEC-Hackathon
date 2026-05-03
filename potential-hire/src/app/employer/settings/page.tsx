"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, Globe, Users, Settings, CreditCard, Shield, Save, Zap, TrendingUp, AlertCircle,
} from "lucide-react";

const PLAN_INFO = {
  free: { name: "Free Trial", price: "$0", views: 20, seats: 1, color: "text-muted-foreground" },
  startup: { name: "Startup", price: "$49/mo", views: 100, seats: 3, color: "text-blue-400" },
  growth: { name: "Growth", price: "$199/mo", views: 500, seats: 10, color: "text-violet-400" },
  enterprise: { name: "Enterprise", price: "Custom", views: 99999, seats: 99, color: "text-amber-400" },
};

const UPGRADES = [
  { id: "startup", name: "Startup", price: "$49/mo", icon: Zap, features: ["100 views/mo", "3 team seats", "Blind hiring", "5 job posts"], color: "border-blue-500/40" },
  { id: "growth", name: "Growth", price: "$199/mo", icon: TrendingUp, features: ["500 views/mo", "10 team seats", "Talent Futures", "20 job posts"], color: "border-violet-500/40", recommended: true },
];

export default function EmployerSettingsPage() {
  const router = useRouter();
  const [employer, setEmployer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ company_name: "", industry: "", company_size: "", website: "" });

  useEffect(() => {
    fetch("/api/employers/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.employer) {
          setEmployer(d.employer);
          setForm({
            company_name: d.employer.company_name ?? "",
            industry: d.employer.industry ?? "",
            company_size: d.employer.company_size ?? "startup",
            website: d.employer.website ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/employers/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  }

  const plan = employer?.plan ?? "free";
  const planInfo = PLAN_INFO[plan as keyof typeof PLAN_INFO] ?? PLAN_INFO.free;

  if (loading) {
    return <div className="glass rounded-xl p-8 animate-pulse h-64" />;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your employer profile and subscription</p>
      </div>

      {/* Company Profile */}
      <div className="glass rounded-xl p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Company Profile
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Size</Label>
            <Select
              onValueChange={(v) => setForm({ ...form, company_size: v ?? form.company_size })}
              value={form.company_size}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup (1–50)</SelectItem>
                <SelectItem value="sme">SME (51–500)</SelectItem>
                <SelectItem value="enterprise">Enterprise (500+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="website" className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Website
            </Label>
            <Input
              id="website"
              placeholder="https://yourcompany.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-primary text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Current Plan */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Subscription Plan
        </h2>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${planInfo.color}`}>{planInfo.name}</span>
              <Badge className={`text-[10px] ${plan === "free" ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"}`}>
                Current
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{planInfo.price}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{planInfo.views === 99999 ? "Unlimited" : planInfo.views} views/mo</p>
            <p>{planInfo.seats} team seat{planInfo.seats !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Views remaining this month</span>
            <span className="font-bold text-primary">{employer?.candidate_views_remaining ?? 0}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full"
              style={{
                width: `${Math.min(100, ((planInfo.views - (employer?.candidate_views_remaining ?? 0)) / planInfo.views) * 100)}%`,
              }}
            />
          </div>
        </div>

        {plan === "free" && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400">
              You&apos;re on the Free Trial. Upgrade to get more candidate views, team seats, and advanced features.
            </p>
          </div>
        )}
      </div>

      {/* Upgrade Plans */}
      {plan !== "enterprise" && (
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Upgrade Your Plan
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {UPGRADES.filter((u) =>
              plan === "free" ? true : (u.id === "growth" && plan === "startup")
            ).map((upgrade) => {
              const Icon = upgrade.icon;
              return (
                <div
                  key={upgrade.id}
                  className={`relative border rounded-xl p-5 ${upgrade.color} ${upgrade.recommended ? "ring-1 ring-primary/30" : ""}`}
                >
                  {upgrade.recommended && (
                    <span className="absolute -top-2.5 left-4 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{upgrade.name}</p>
                      <p className="text-xs text-primary font-bold">{upgrade.price}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {upgrade.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="text-primary">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full gradient-primary text-white text-xs"
                    size="sm"
                    onClick={() => toast.info("Upgrade flow coming soon — contact sales@potentialhire.dev")}
                  >
                    Upgrade to {upgrade.name}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security */}
      <div className="glass rounded-xl p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Security
        </h2>
        <Button
          variant="outline"
          className="text-sm"
          onClick={() => toast.info("Password reset email sent!")}
        >
          Change Password
        </Button>
      </div>
    </div>
  );
}
