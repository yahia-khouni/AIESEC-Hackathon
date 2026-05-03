import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { matchingService } from "@/lib/services/matching.service";
import { employerService } from "@/lib/services/employer.service";
import { notificationService } from "@/lib/services/notification.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employer = await employerService.getProfile(user.id);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const { candidate, user: candidateUser } = await matchingService.revealCandidate(
      employer.id,
      candidateId
    );

    // Log a notification for the reveal
    await notificationService.create({
      userId: user.id,
      type: "match",
      title: "Candidate Profile Revealed",
      body: `You revealed a candidate profile. ${employer.candidate_views_remaining - 1} views remaining.`,
      actionUrl: `/employer/talent-search/${candidateId}`,
    });

    return NextResponse.json({ candidate, user: candidateUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("No candidate views") ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
