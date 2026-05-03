import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { matchingService } from "@/lib/services/matching.service";
import { employerService } from "@/lib/services/employer.service";
import { z } from "zod";

const searchSchema = z.object({
  minScore: z.number().min(0).max(100).optional(),
  skills: z.array(z.string()).optional(),
  region: z.string().optional(),
  availability: z.string().optional(),
  languages: z.array(z.string()).optional(),
  sortBy: z.enum(["match_score", "potential_score", "recent"]).optional(),
  jobId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employer = await employerService.getProfile(user.id);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const body = await request.json();
    const filters = searchSchema.parse(body);

    const candidates = await matchingService.searchCandidates(filters, employer.id);
    return NextResponse.json({
      candidates,
      total: candidates.length,
      viewsRemaining: employer.candidate_views_remaining,
    });
  } catch (error) {
    console.error("[POST /api/matching/search]", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
