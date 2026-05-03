import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { notificationService } from "@/lib/services/notification.service";

// This route is meant to be called by a cron job (e.g., Vercel Cron) every hour
// It checks if any bookmarked candidates have crossed the employer's readiness threshold
export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "dev-cron";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get all non-notified bookmarks
    const { data: bookmarks, error } = await supabase
      .from("bookmarks")
      .select(`
        id,
        employer_id,
        candidate_id,
        readiness_threshold,
        notified,
        candidates(potential_score, users(email)),
        employers(user_id, company_name, users(email))
      `)
      .eq("notified", false);

    if (error) throw error;

    let notifiedCount = 0;

    for (const bookmark of bookmarks ?? []) {
      const candidateScore = (bookmark as any).candidates?.potential_score ?? 0;
      const threshold = bookmark.readiness_threshold;

      if (candidateScore >= threshold) {
        const employerUserId = (bookmark as any).employers?.user_id;
        const employerName = (bookmark as any).employers?.company_name;
        const employerEmail = (bookmark as any).employers?.users?.email;

        // Create in-app notification
        if (employerUserId) {
          await notificationService.create({
            userId: employerUserId,
            type: "bookmark",
            title: "🎉 Candidate is ready to hire!",
            body: `A bookmarked candidate has reached your readiness threshold of ${threshold}. Their current score is ${candidateScore}.`,
            actionUrl: `/employer/pipeline`,
          });
        }

        // Send email notification
        if (employerEmail) {
          await notificationService.sendEmail({
            to: employerEmail,
            subject: `HirePotential: A candidate is ready to hire!`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>A candidate is ready!</h2>
                <p>Hello <strong>${employerName}</strong>,</p>
                <p>One of your bookmarked candidates on HirePotential has reached your readiness threshold of <strong>${threshold}</strong>.</p>
                <p>Their current potential score is <strong>${candidateScore}</strong>.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/employer/pipeline" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">View Pipeline →</a></p>
              </div>
            `,
          });
        }

        // Mark bookmark as notified
        await supabase
          .from("bookmarks")
          .update({ notified: true })
          .eq("id", bookmark.id);

        notifiedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      checked: bookmarks?.length ?? 0,
      notified: notifiedCount,
    });
  } catch (error) {
    console.error("[Readiness Check Cron]", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
