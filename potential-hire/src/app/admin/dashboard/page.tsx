import { createClient } from "@/lib/db/supabase.server";
import { redirect } from "next/navigation";
import { Users, Briefcase, TrendingUp, AlertCircle, BarChart3, Globe } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify admin role
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") redirect("/");

  // Platform stats
  const [
    { count: totalUsers },
    { count: totalCandidates },
    { count: totalEmployers },
    { count: activeJobs },
    { count: activeInternships },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("candidates").select("id", { count: "exact", head: true }),
    supabase.from("employers").select("id", { count: "exact", head: true }),
    supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("internships").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("users").select("id, email, role, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  // Average potential score
  const { data: scoreData } = await supabase.from("candidates").select("potential_score").not("potential_score", "is", null);
  const avgScore = scoreData && scoreData.length > 0
    ? Math.round(scoreData.reduce((a, c) => a + (c.potential_score ?? 0), 0) / scoreData.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time platform analytics and health</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        <StatCard label="Total Users" value={totalUsers ?? 0} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard label="Candidates" value={totalCandidates ?? 0} icon={Globe} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="Employers" value={totalEmployers ?? 0} icon={Briefcase} color="bg-violet-500/10 text-violet-400" />
        <StatCard label="Active Jobs" value={activeJobs ?? 0} icon={BarChart3} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Open Internships" value={activeInternships ?? 0} icon={AlertCircle} color="bg-amber-500/10 text-amber-400" />
        <StatCard label="Avg. Potential Score" value={avgScore} icon={TrendingUp} color="bg-pink-500/10 text-pink-400" />
      </div>

      {/* Recent Users */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Recent Registrations
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground text-xs border-b border-border/50">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {(recentUsers ?? []).map((u: any) => (
                <tr key={u.id} className="hover:bg-accent/20 transition-colors">
                  <td className="py-3 pr-4 text-sm">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      u.role === "admin" ? "bg-red-500/20 text-red-400" :
                      u.role === "employer" ? "bg-violet-500/20 text-violet-400" :
                      u.role === "institution" ? "bg-amber-500/20 text-amber-400" :
                      "bg-primary/20 text-primary"
                    }`}>{u.role}</span>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
