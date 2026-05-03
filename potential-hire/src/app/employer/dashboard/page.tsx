import { createClient } from "@/lib/db/supabase.server";
import { employerService } from "@/lib/services/employer.service";
import { jobService } from "@/lib/services/job.service";
import { matchingService } from "@/lib/services/matching.service";
import {
  Briefcase,
  BookmarkCheck,
  Users,
  TrendingUp,
  Bell,
  Eye,
  Sparkles,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import type { JobPost } from "@/types";

function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="3" className="stroke-muted/30" />
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className={score >= 70 ? "stroke-emerald-400" : score >= 50 ? "stroke-blue-400" : "stroke-amber-400"}
        />
      </svg>
      <span className="text-xs font-bold">{score}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: string | number; icon: React.ElementType; color: string; href?: string;
}) {
  const content = (
    <div className="glass rounded-xl p-5 flex items-center gap-4 hover:bg-accent/5 transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {href && <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function EmployerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const employer = await employerService.getProfile(user.id);
  if (!employer) redirect("/employer/onboarding");

  const [jobs, bookmarks] = await Promise.all([
    jobService.getByEmployer(employer.id),
    supabase.from("bookmarks")
      .select("*, candidates(potential_score, availability)")
      .eq("employer_id", employer.id)
      .limit(5),
  ]);

  const activeJobs = jobs.filter((j) => j.status === "active");
  const readyBookmarks = (bookmarks.data ?? []).filter(
    (b: any) => b.candidates?.potential_score >= b.readiness_threshold
  );

  // Get top recommendations from first active job
  let recommendations: any[] = [];
  if (activeJobs.length > 0) {
    try {
      recommendations = await matchingService.getRecommendations(employer.id, activeJobs[0].id);
    } catch {
      recommendations = [];
    }
  }

  // Recent notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Marketplace stats
  const { count: activeInternships } = await supabase
    .from("internships")
    .select("id", { count: "exact", head: true })
    .eq("employer_id", employer.id)
    .eq("status", "open");

  const PLAN_QUOTA = { free: 20, startup: 100, growth: 500, enterprise: 99999 };
  const quota = PLAN_QUOTA[employer.plan] ?? 20;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="gradient-text">{employer.company_name}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&apos;s your talent acquisition overview
          </p>
        </div>
        <Link href="/employer/jobs/create">
          <Button className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Job Post
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          label="Active Job Posts"
          value={activeJobs.length}
          icon={Briefcase}
          color="bg-primary/10 text-primary"
          href="/employer/jobs"
        />
        <StatCard
          label="Bookmarked Candidates"
          value={bookmarks.data?.length ?? 0}
          icon={BookmarkCheck}
          color="bg-amber-500/10 text-amber-400"
          href="/employer/pipeline"
        />
        <StatCard
          label="Ready to Hire"
          value={readyBookmarks.length}
          icon={TrendingUp}
          color="bg-emerald-500/10 text-emerald-400"
          href="/employer/pipeline"
        />
        <StatCard
          label="Views Remaining"
          value={employer.candidate_views_remaining}
          icon={Eye}
          color="bg-blue-500/10 text-blue-400"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Active Jobs
            </h2>
            <Link href="/employer/jobs" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {activeJobs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No active jobs yet</p>
              <Link href="/employer/jobs/create">
                <Button size="sm" className="gradient-primary text-white text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.slice(0, 4).map((job) => (
                <Link
                  key={job.id}
                  href={`/employer/jobs`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.region} · Min {job.min_potential_score}</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] shrink-0 ml-2">Active</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Recommended
            </h2>
            <Link href="/employer/talent-search" className="text-xs text-primary hover:underline">
              Search all
            </Link>
          </div>
          {recommendations.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">
                {activeJobs.length === 0 ? "Create a job post to get recommendations" : "Loading recommendations..."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 4).map((c, i) => (
                <Link
                  key={c.id}
                  href={`/employer/talent-search/${c.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <ScoreRing score={c.potential_score ?? 0} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">Candidate #{i + 1}</p>
                    <p className="text-[11px] text-muted-foreground">{c.region} · {c.availability}</p>
                  </div>
                  {c.matchScore && (
                    <Badge className="bg-primary/20 text-primary text-[10px]">
                      {c.matchScore}% match
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Recent Activity
            </h2>
          </div>
          {(notifications ?? []).length === 0 ? (
            <div className="text-center py-6">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(notifications ?? []).map((n: any) => (
                <div key={n.id} className={`p-2.5 rounded-lg text-xs ${!n.read ? "bg-primary/5" : ""}`}>
                  <p className="font-medium truncate">{n.title}</p>
                  <p className="text-muted-foreground truncate mt-0.5">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Marketplace + Views Banner */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Marketplace
            </h2>
            <Link href="/employer/marketplace" className="text-xs text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">{activeInternships ?? 0}</p>
              <p className="text-xs text-muted-foreground">Active Internships</p>
            </div>
            <Link href="/employer/marketplace/create" className="flex-1">
              <Button variant="outline" className="w-full text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Post Internship
              </Button>
            </Link>
          </div>
        </div>

        {/* Views Remaining Banner */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Candidate View Quota</h2>
            <Badge className="text-[10px] bg-primary/20 text-primary capitalize">{employer.plan} plan</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Used this month</span>
              <span className="font-bold">
                {quota - employer.candidate_views_remaining} / {quota === 99999 ? "∞" : quota}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="gradient-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((quota - employer.candidate_views_remaining) / quota) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {employer.candidate_views_remaining} views remaining ·{" "}
              <Link href="/employer/settings" className="text-primary hover:underline">
                Upgrade plan
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
