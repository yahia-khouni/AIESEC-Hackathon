import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { candidateService } from "@/lib/services/candidate.service";
import { roadmapService } from "@/lib/services/roadmap.service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await candidateService.getProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { roadmapId, phaseIndex, milestoneIndex } = await request.json();

    if (
      typeof roadmapId !== "string" ||
      typeof phaseIndex !== "number" ||
      typeof milestoneIndex !== "number"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const completionPct = await roadmapService.completeMilestone(
      roadmapId,
      phaseIndex,
      milestoneIndex
    );

    return NextResponse.json({ completionPct });
  } catch (error) {
    console.error("[POST /api/roadmap/milestone]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
