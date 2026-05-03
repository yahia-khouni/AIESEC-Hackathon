import { createClient } from "@/lib/db/supabase.server";
import { redirect } from "next/navigation";
import { GraduationCap, Users, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function InstitutionCohortsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "institution") redirect("/");

  const { data: institution } = await supabase
    .from("institutions").select("id, name").eq("user_id", user.id).single();
  if (!institution) redirect("/institution/onboarding");

  const { data: cohorts } = await supabase
    .from("cohorts")
    .select(`
      *,
      cohort_members(
        id,
        role,
        candidates(id, potential_score, availability)
      )
    `)
    .eq("institution_id", institution.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            Cohorts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {institution.name} · {cohorts?.length ?? 0} cohorts
          </p>
        </div>
        <Button className="gradient-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Cohort
        </Button>
      </div>

      {!cohorts?.length ? (
        <div className="glass rounded-xl p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-2">No cohorts yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first cohort to track students&apos; progress together
          </p>
          <Button className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create First Cohort
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 stagger-children">
          {cohorts.map((cohort) => {
            const members = cohort.cohort_members ?? [];
            const scores = members
              .map((m: any) => m.candidates?.potential_score)
              .filter(Boolean);
            const avgScore = scores.length
              ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
              : 0;
            const readyCount = members.filter(
              (m: any) => (m.candidates?.potential_score ?? 0) >= 70
            ).length;

            return (
              <div key={cohort.id} className="glass rounded-xl p-6 hover:bg-accent/5 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{cohort.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cohort.program ?? "General Program"} · {cohort.year ?? new Date().getFullYear()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold gradient-text">{avgScore}</p>
                    <p className="text-[10px] text-muted-foreground">avg score</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Average Potential</span>
                    <span>{avgScore}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-700"
                      style={{ width: `${avgScore}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {members.length} members
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {readyCount} job-ready (≥70)
                  </span>
                </div>

                {/* Member score distribution */}
                <div className="space-y-1.5">
                  {members.slice(0, 5).map((m: any, i: number) => {
                    const score = m.candidates?.potential_score ?? 0;
                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                          Member {i + 1}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              score >= 70 ? "bg-emerald-400" :
                              score >= 50 ? "bg-blue-400" : "bg-amber-400"
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium w-6 text-right">{score}</span>
                      </div>
                    );
                  })}
                  {members.length > 5 && (
                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                      +{members.length - 5} more members
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    View Members
                  </Button>
                  <Badge className={`text-[10px] self-center ${
                    cohort.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {cohort.status ?? "active"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
