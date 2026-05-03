"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Globe,
  Users,
  Briefcase,
  MapPin,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";

// ---- Step schemas ----
const step1Schema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(2, "Please select an industry"),
  company_size: z.enum(["startup", "sme", "enterprise"]),
  website: z.string().url("Please enter a valid URL").or(z.literal("")),
});

const step2Schema = z.object({
  hiring_roles: z.string().min(2, "Please describe the roles"),
  target_regions: z.string().min(2, "Please enter at least one region"),
  team_hiring_size: z.string(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "E-commerce",
  "Marketing & Advertising", "Consulting", "Manufacturing", "Media & Entertainment",
  "Real Estate", "Logistics", "Non-profit", "Government", "Other",
];

const PLANS = [
  {
    id: "free",
    name: "Free Trial",
    price: "$0",
    duration: "14 days",
    views: 20,
    seats: 1,
    features: ["Basic talent search", "1 job post", "20 candidate views"],
    color: "border-border",
    badge: "",
    icon: Shield,
  },
  {
    id: "startup",
    name: "Startup",
    price: "$49",
    duration: "/mo",
    views: 100,
    seats: 3,
    features: ["Blind hiring", "Bookmarks", "5 job posts", "100 views"],
    color: "border-blue-500/50",
    badge: "Popular",
    icon: Zap,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$199",
    duration: "/mo",
    views: 500,
    seats: 10,
    features: ["Talent futures", "Analytics", "ATS integration", "20 job posts"],
    color: "border-violet-500/50",
    badge: "Best Value",
    icon: TrendingUp,
  },
];

const STEPS = [
  { label: "Company Info", icon: Building2 },
  { label: "Hiring Needs", icon: Users },
  { label: "Choose Plan", icon: Sparkles },
];

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [selectedPlan] = useState("free");
  const [isLoading, setIsLoading] = useState(false);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { company_name: "", industry: "", company_size: "startup", website: "" },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { hiring_roles: "", target_regions: "", team_hiring_size: "1-5" },
  });

  async function handleStep1(data: Step1Data) {
    setStep1Data(data);
    setStep(2);
  }

  async function handleStep2(data: Step2Data) {
    setStep2Data(data);
    setStep(3);
  }

  async function handleFinish() {
    if (!step1Data) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch("/api/employers/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: step1Data.company_name,
          industry: step1Data.industry,
          company_size: step1Data.company_size,
          website: step1Data.website || null,
          plan: selectedPlan,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create employer profile");
      }

      toast.success("Welcome to HirePotential! 🎉");
      router.push("/employer/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              Hire<span className="text-primary">Potential</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Set up your employer profile</h1>
          <p className="text-muted-foreground">
            Takes 2 minutes. Start finding top talent today.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const stepNum = i + 1;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isCompleted
                      ? "bg-primary/20 text-primary"
                      : isCurrent
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <s.icon className="w-3.5 h-3.5" />
                  )}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${step > stepNum ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Cards */}
        <div className="glass rounded-2xl p-8 animate-slide-up">
          {/* Step 1 — Company Info */}
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1">Tell us about your company</h2>
                <p className="text-sm text-muted-foreground">Basic info to get started</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Company Name *
                  </Label>
                  <Input
                    id="company_name"
                    placeholder="Acme Corp"
                    {...form1.register("company_name")}
                    className={form1.formState.errors.company_name ? "border-destructive" : ""}
                  />
                  {form1.formState.errors.company_name && (
                    <p className="text-xs text-destructive">{form1.formState.errors.company_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    Industry *
                  </Label>
                  <Select
                    onValueChange={(val) => form1.setValue("industry", val ?? "")}
                    defaultValue={form1.getValues("industry")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form1.formState.errors.industry && (
                    <p className="text-xs text-destructive">{form1.formState.errors.industry.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Company Size *
                  </Label>
                  <Select
                    onValueChange={(val) =>
                      form1.setValue("company_size", val as "startup" | "sme" | "enterprise")
                    }
                    defaultValue="startup"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (1–50 employees)</SelectItem>
                      <SelectItem value="sme">SME (51–500 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (500+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Website (optional)
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://yourcompany.com"
                    {...form1.register("website")}
                    className={form1.formState.errors.website ? "border-destructive" : ""}
                  />
                  {form1.formState.errors.website && (
                    <p className="text-xs text-destructive">{form1.formState.errors.website.message}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary text-white" size="lg">
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Step 2 — Hiring Needs */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1">What are you hiring for?</h2>
                <p className="text-sm text-muted-foreground">Help us tailor recommendations</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hiring_roles" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    Roles you&apos;re hiring for *
                  </Label>
                  <Input
                    id="hiring_roles"
                    placeholder="e.g. Frontend Developer, Data Analyst, UX Designer"
                    {...form2.register("hiring_roles")}
                  />
                  {form2.formState.errors.hiring_roles && (
                    <p className="text-xs text-destructive">{form2.formState.errors.hiring_roles.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_regions" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Target regions *
                  </Label>
                  <Input
                    id="target_regions"
                    placeholder="e.g. Tunisia, Morocco, France, Remote"
                    {...form2.register("target_regions")}
                  />
                  {form2.formState.errors.target_regions && (
                    <p className="text-xs text-destructive">{form2.formState.errors.target_regions.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    How many people are you looking to hire?
                  </Label>
                  <Select
                    onValueChange={(val) => form2.setValue("team_hiring_size", val ?? "1-5")}
                    defaultValue="1-5"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1–5 people</SelectItem>
                      <SelectItem value="6-20">6–20 people</SelectItem>
                      <SelectItem value="21-50">21–50 people</SelectItem>
                      <SelectItem value="50+">50+ people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1 gradient-primary text-white">
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3 — Plan Selection */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1">Start with a free trial</h2>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll start on the <strong className="text-foreground">Free Trial</strong> — upgrade anytime from your dashboard.
                </p>
              </div>

              <div className="grid gap-3">
                {PLANS.map((plan) => {
                  const Icon = plan.icon;
                  const isSelected = plan.id === "free";
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : plan.color + " bg-muted/20 opacity-60"
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {plan.badge}
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "gradient-primary" : "bg-muted"}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold">{plan.name}</span>
                            <span className="text-lg font-bold gradient-text">{plan.price}</span>
                            <span className="text-xs text-muted-foreground">{plan.duration}</span>
                          </div>
                          <ul className="mt-1.5 space-y-0.5">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                No credit card required · Cancel anytime
              </p>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>
                <Button
                  className="flex-1 gradient-primary text-white"
                  size="lg"
                  onClick={handleFinish}
                  disabled={isLoading}
                >
                  {isLoading ? "Setting up..." : "Launch Dashboard"}
                  <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Summary footer */}
        {step1Data && step > 1 && (
          <div className="mt-4 text-center text-xs text-muted-foreground animate-fade-in">
            Setting up <strong className="text-foreground">{step1Data.company_name}</strong> ·{" "}
            {step1Data.industry} · {step1Data.company_size}
          </div>
        )}
      </div>
    </div>
  );
}
