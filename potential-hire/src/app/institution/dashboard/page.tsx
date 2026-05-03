import { createClient } from "@/lib/db/supabase.server";
import { redirect } from "next/navigation";
import { GraduationCap, Users, TrendingUp, Award, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default async function InstitutionDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "institution") redirect("/");

  // Institution data
  const { data: institution } = await supabase
    .from("institutions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!institution) redirect("/institution/onboarding");

  // Cohort stats
  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("*, cohort_members(*, candidates(potential_score))")
    .eq("institution_id", institution.id);

  const totalMembers = cohorts?.reduce(
    (acc, c) => acc + (c.cohort_members?.length ?? 0), 0
  ) ?? 0;

  const allScores = cohorts?.flatMap(
    (c) => c.cohort_members?.map((m: any) => m.candidates?.potential_score).filter(Boolean) ?? []
  ) ?? [];
  const avgScore = allScores.length
    ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length)
    : 0;

  const { count: credCount } = await supabase
    .from("credentials")
    .select("id", { count: "exact", head: true });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, <span className="gradient-text">{institution.name}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor your cohorts and candidate progress
          </p>
        </div>
        <Link href="/institution/cohorts">
          <Button className="gradient-primary text-white">
            <Users className="w-4 h-4 mr-2" />
            Manage Cohorts
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Active Cohorts" value={cohorts?.length ?? 0} icon={GraduationCap} color="bg-primary/10 text-primary" />
        <StatCard label="Total Members" value={totalMembers} icon={Users} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="Avg Potential Score" value={avgScore} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Total Credentials" value={credCount ?? 0} icon={Award} color="bg-amber-500/10 text-amber-400" />
      </div>

      {/* Cohorts Overview */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Your Cohorts
          </h2>
          <Link href="/institution/cohorts" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        {!cohorts?.length ? (
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">No cohorts created yet</p>
            <Link href="/institution/cohorts">
              <Button size="sm" className="gradient-primary text-white text-xs">Create First Cohort</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {cohorts.slice(0, 4).map((c) => {
              const memberScores = c.cohort_members
                ?.map((m: any) => m.candidates?.potential_score)
                .filter(Boolean) ?? [];
              const avg = memberScores.length
                ? Math.round(memberScores.reduce((a: number, b: number) => a + b, 0) / memberScores.length)
                : 0;
              return (
                <Link key={c.id} href={`/institution/cohorts/${c.id}`}>
                  <div className="p-4 bg-muted/20 rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{c.name}</h3>
                      <span className="text-xs text-primary font-bold">{avg}/100</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.cohort_members?.length ?? 0} members
                      </span>
                      <span>{c.program ?? "General"}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full gradient-primary rounded-full" style={{ width: `${avg}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Performers */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Top Performers
        </h2>
        {totalMembers === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No candidates in cohorts yet</p>
        ) : (
          <div className="space-y-3">
            {cohorts?.flatMap((c) => c.cohort_members ?? [])
              .filter((m: any) => m.candidates?.potential_score)
              .sort((a: any, b: any) => b.candidates.potential_score - a.candidates.potential_score)
              .slice(0, 5)
              .map((m: any, i: number) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/20 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-amber-500/20 text-amber-400" :
                    i === 1 ? "bg-muted text-muted-foreground" :
                    "bg-muted/50 text-muted-foreground"
                  }`}>{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">Candidate #{i + 1}</p>
                  </div>
                  <span className="text-sm font-bold gradient-text">
                    {m.candidates.potential_score}/100
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
