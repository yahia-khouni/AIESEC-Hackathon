import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { candidateService } from "@/lib/services/candidate.service";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await candidateService.getProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const skills = await candidateService.getSkills(profile.id);
    const completeness = await candidateService.getProfileCompleteness(profile.id);

    return NextResponse.json({ profile, skills, completeness });
  } catch (error) {
    console.error("[GET /api/candidates/profile]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await candidateService.getProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    await candidateService.updateProfile(profile.id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/candidates/profile]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
