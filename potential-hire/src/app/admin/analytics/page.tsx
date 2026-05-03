import { createClient } from "@/lib/db/supabase.server";
import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, Users, Briefcase, GraduationCap, Award } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") redirect("/");

  // Time series: users joined per day last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentUsers } = await supabase
    .from("users")
    .select("created_at, role")
    .gte("created_at", sevenDaysAgo)
    .order("created_at");

  // Group by day
  const dayMap: Record<string, number> = {};
  (recentUsers ?? []).forEach((u) => {
    const day = new Date(u.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    dayMap[day] = (dayMap[day] ?? 0) + 1;
  });
  const chartData = Object.entries(dayMap);

  const maxVal = Math.max(...chartData.map(([, v]) => v), 1);

  // Role distribution
  const roleCounts: Record<string, number> = {};
  (recentUsers ?? []).forEach((u) => {
    roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;
  });

  // Platform totals
  const [
    { count: totalUsers },
    { count: totalCandidates },
    { count: totalEmployers },
    { count: completedInternships },
    { data: scoreData },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("candidates").select("id", { count: "exact", head: true }),
    supabase.from("employers").select("id", { count: "exact", head: true }),
    supabase.from("internship_applications").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("candidates").select("potential_score").not("potential_score", "is", null),
  ]);

  const scores = (scoreData ?? []).map((c) => c.potential_score ?? 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highPotential = scores.filter((s) => s >= 70).length;

  const COLORS = ["bg-primary", "bg-blue-400", "bg-violet-400", "bg-emerald-400"];
  const ROLE_LABELS: Record<string, string> = {
    candidate: "Candidates", employer: "Employers",
    institution: "Institutions", admin: "Admins",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Platform Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">7-day activity overview and platform health</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: totalUsers ?? 0, icon: Users, color: "text-primary" },
          { label: "Avg. Potential Score", value: avgScore, icon: TrendingUp, color: "text-emerald-400" },
          { label: "High Potential (≥70)", value: highPotential, icon: Award, color: "text-amber-400" },
          { label: "Total Candidates", value: totalCandidates ?? 0, icon: GraduationCap, color: "text-blue-400" },
          { label: "Total Employers", value: totalEmployers ?? 0, icon: Briefcase, color: "text-violet-400" },
          { label: "Completed Internships", value: completedInternships ?? 0, icon: BarChart3, color: "text-pink-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass rounded-xl p-5 flex items-center gap-4">
            <kpi.icon className={`w-8 h-8 shrink-0 ${kpi.color}`} />
            <div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* User Growth Chart (7d) */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          New Users — Last 7 Days
        </h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No new users in the last 7 days</p>
        ) : (
          <div className="flex items-end gap-3 h-32">
            {chartData.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-primary">{count}</span>
                <div
                  className="w-full gradient-primary rounded-t-md transition-all duration-700"
                  style={{ height: `${(count / maxVal) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{day}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Distribution */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-5 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          New Users by Role (7d)
        </h2>
        {Object.keys(roleCounts).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(roleCounts).map(([role, count], i) => {
              const pct = Math.round((count / (recentUsers?.length ?? 1)) * 100);
              return (
                <div key={role} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{ROLE_LABELS[role] ?? role}</span>
                    <span className="font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${COLORS[i % COLORS.length]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Potential Score Distribution */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-5 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Potential Score Distribution
        </h2>
        {scores.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No score data yet</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "0–39", filter: (s: number) => s < 40, color: "text-red-400", bg: "bg-red-500/20" },
              { label: "40–59", filter: (s: number) => s >= 40 && s < 60, color: "text-amber-400", bg: "bg-amber-500/20" },
              { label: "60–79", filter: (s: number) => s >= 60 && s < 80, color: "text-blue-400", bg: "bg-blue-500/20" },
              { label: "80–100", filter: (s: number) => s >= 80, color: "text-emerald-400", bg: "bg-emerald-500/20" },
            ].map((bucket) => {
              const count = scores.filter(bucket.filter).length;
              const pct = Math.round((count / scores.length) * 100);
              return (
                <div key={bucket.label} className={`rounded-xl p-4 text-center ${bucket.bg}`}>
                  <p className={`text-2xl font-bold ${bucket.color}`}>{count}</p>
                  <p className={`text-xs ${bucket.color}`}>{bucket.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% of all</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
