import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { generateQuiz } from "@/lib/ai/assessment-generator";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skill, difficulty = "intermediate", count = 5 } = await request.json();

    if (!skill) {
      return NextResponse.json({ error: "Skill is required" }, { status: 400 });
    }

    const questions = await generateQuiz(skill, difficulty, count);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[POST /api/assessments/generate]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
