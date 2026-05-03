import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles, ArrowRight, Target, Map, ShieldCheck,
  Briefcase, BarChart3, Users, Award, Brain,
  GraduationCap, Building2, Globe,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Potential Score",
    description: "Transparent, explainable scoring based on learning velocity, skills, and progress — not demographics.",
  },
  {
    icon: Map,
    title: "Personalized Roadmaps",
    description: "AI-generated learning paths tailored to your target role, skills, and timeline.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Credentials",
    description: "Link certificates from Coursera, freeCodeCamp, Udemy, and more. Auto-verified.",
  },
  {
    icon: Target,
    title: "Blind Matching",
    description: "First-round matching hides your name, age, and photo. Only your potential matters.",
  },
  {
    icon: Briefcase,
    title: "Micro-Internships",
    description: "Short 2–4 week projects to build real, verified work experience.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Watch your score grow as you learn, build, and get verified.",
  },
];

const STATS = [
  { value: "200M+", label: "Juniors entering the market yearly" },
  { value: "72%", label: "Entry-level jobs require experience" },
  { value: "0", label: "Platforms hiring by potential" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              Potential<span className="gradient-text">Hire</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gradient-primary text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-10 -right-40 w-[500px] h-[500px] rounded-full bg-chart-2/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-6">
            <Sparkles className="w-3 h-3 mr-1" /> Built for AIESEC Hackathon 2026
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Get Hired for Your{" "}
            <span className="gradient-text glow-text">Potential</span>
            <br />
            Not Just Your Past
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-powered platform that turns hidden potential into measurable employability.
            Build skills, track progress, and get matched with employers who hire
            based on where you&apos;re going — not just where you&apos;ve been.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gradient-primary text-white px-8 text-base">
                Start Your Journey
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/register?role=employer">
              <Button size="lg" variant="outline" className="px-8 text-base bg-transparent">
                <Building2 className="w-4 h-4 mr-2" />
                I&apos;m Hiring
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border/20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2">Three steps to becoming hire-ready</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", icon: Users, title: "Build Your Profile", desc: "Sign up, add skills, upload credentials. Our AI analyzes your potential." },
              { step: "2", icon: Map, title: "Follow Your Roadmap", desc: "Get a personalized AI learning path. Complete milestones, take assessments." },
              { step: "3", icon: Target, title: "Get Matched", desc: "Employers discover you by potential score. Blind first-round matching removes bias." },
            ].map((item) => (
              <Card key={item.step} className="gradient-card border-border/30 relative overflow-hidden group hover:glow transition-all duration-300">
                <div className="absolute top-4 right-4 text-6xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <CardContent className="pt-6 pb-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Built for the Future of Hiring</h2>
            <p className="text-muted-foreground mt-2">Everything you need to grow and get hired</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-border/30 hover:border-primary/30 transition-all group">
                <CardContent className="pt-6 pb-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Employers */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 mb-4">
            <Building2 className="w-3 h-3 mr-1" /> For Employers
          </Badge>
          <h2 className="text-3xl font-bold">Find Tomorrow&apos;s Talent Today</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Search candidates by potential score, skill trajectory, and readiness.
            Build future hiring pipelines with talent alerts. Reduce bias with blind first-round matching.
          </p>
          <Link href="/register?role=employer">
            <Button size="lg" className="mt-8 gradient-primary text-white">
              Start Hiring <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 px-6 border-t border-border/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-6">Built for an ecosystem of</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Universities</div>
            <div className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Companies</div>
            <div className="flex items-center gap-2"><Award className="w-5 h-5" /> Bootcamps</div>
            <div className="flex items-center gap-2"><Globe className="w-5 h-5" /> NGOs</div>
            <div className="flex items-center gap-2"><Users className="w-5 h-5" /> Governments</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 gradient-hero">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold">Ready to Unlock Your Potential?</h2>
          <p className="text-muted-foreground mt-3">
            Join thousands of candidates building their future with AI-powered career development.
          </p>
          <Link href="/register">
            <Button size="lg" className="mt-8 gradient-primary text-white px-10 text-base">
              Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">PotentialHire</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 PotentialHire. Built for AIESEC Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}
