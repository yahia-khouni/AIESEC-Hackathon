import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { candidateService } from "@/lib/services/candidate.service";
import { roadmapService } from "@/lib/services/roadmap.service";
import { generateRoadmapSchema } from "@/lib/validations/schemas";

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

    const body = await request.json();
    const parsed = generateRoadmapSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const skills = await candidateService.getSkills(profile.id);
    const currentSkills = skills.map((s) => ({
      name: s.skill?.name || "Unknown",
      proficiency: s.proficiency,
    }));

    const roadmap = await roadmapService.generate(
      profile.id,
      parsed.data.target_role,
      parsed.data.timeline_weeks,
      currentSkills
    );

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error("[POST /api/roadmap/generate]", error);
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

    const roadmap = await roadmapService.getActive(profile.id);
    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error("[GET /api/roadmap]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
