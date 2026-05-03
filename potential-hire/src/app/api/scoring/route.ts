import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { scoringService } from "@/lib/services/scoring.service";
import { candidateService } from "@/lib/services/candidate.service";

export async function POST() {
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

    const score = await scoringService.computeScore(profile.id);
    return NextResponse.json({ score });
  } catch (error) {
    console.error("[POST /api/scoring/compute]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
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

    const [latest, history] = await Promise.all([
      scoringService.getLatestScore(profile.id),
      scoringService.getScoreHistory(profile.id),
    ]);

    return NextResponse.json({ score: latest, history });
  } catch (error) {
    console.error("[GET /api/scoring]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
