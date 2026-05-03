import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { marketplaceService } from "@/lib/services/marketplace.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: internshipId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get candidate ID from user
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!candidate) return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });

    const body = await request.json();
    await marketplaceService.apply(candidate.id, internshipId, body.coverMessage);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
