import { createClient } from "@/lib/db/supabase.server";
import { redirect } from "next/navigation";
import { Shield, AlertCircle, Star, Award, CheckCircle2, XCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") redirect("/");

  // Flagged internships (open with many rejections or spam indicators)
  const { data: flaggedInternships } = await supabase
    .from("internships")
    .select("*, employers(company_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(10);

  // Low-rated completed applications (potential disputes)
  const { data: disputedApps } = await supabase
    .from("internship_applications")
    .select("*, internships(title), candidates(user_id)")
    .eq("status", "completed")
    .or("employer_rating.lte.2,candidate_rating.lte.2")
    .limit(10);

  // Unverified credentials pending review
  const { data: unverifiedCreds } = await supabase
    .from("credentials")
    .select("*, candidates(user_id, users(email))")
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Moderation Queue
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review flagged content, disputes, and pending verifications
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Flagged Internships", value: flaggedInternships?.length ?? 0, icon: Flag, color: "text-amber-400" },
          { label: "Disputed Ratings", value: disputedApps?.length ?? 0, icon: Star, color: "text-red-400" },
          { label: "Pending Credentials", value: unverifiedCreds?.length ?? 0, icon: Award, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Flagged Internships */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Flag className="w-4 h-4 text-amber-400" />
          Internships — Review Queue
        </h2>
        {!flaggedInternships?.length ? (
          <p className="text-sm text-muted-foreground py-4">No internships in review queue</p>
        ) : (
          <div className="space-y-3">
            {flaggedInternships.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{i.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {i.employers?.company_name} · {new Date(i.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">{i.status}</Badge>
                  <Button size="sm" variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 h-7">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30 h-7">
                    <XCircle className="w-3 h-3 mr-1" />Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disputed Ratings */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-red-400" />
          Disputed Ratings (≤ 2 stars)
        </h2>
        {!disputedApps?.length ? (
          <p className="text-sm text-muted-foreground py-4">No disputed ratings</p>
        ) : (
          <div className="space-y-3">
            {disputedApps.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{app.internships?.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {app.employer_rating && (
                      <span>Employer rated: {app.employer_rating}⭐</span>
                    )}
                    {app.candidate_rating && (
                      <span>Candidate rated: {app.candidate_rating}⭐</span>
                    )}
                  </div>
                  {app.employer_review && (
                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                      &quot;{app.employer_review}&quot;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7">
                    <Shield className="w-3 h-3 mr-1" />Mediate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unverified Credentials */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Credentials Pending Manual Verification
        </h2>
        {!unverifiedCreds?.length ? (
          <p className="text-sm text-muted-foreground py-4">No pending credentials</p>
        ) : (
          <div className="space-y-3">
            {unverifiedCreds.map((cred: any) => (
              <div key={cred.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{cred.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Provider: {cred.provider} · {new Date(cred.created_at).toLocaleDateString()}
                  </p>
                  {cred.credential_url && (
                    <a
                      href={cred.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-0.5 block"
                    >
                      View Certificate →
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gradient-primary text-white text-xs h-7">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Verify
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs text-destructive h-7">
                    <XCircle className="w-3 h-3 mr-1" />Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
