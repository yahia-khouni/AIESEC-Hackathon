import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify caller is admin
    const { data: adminData } = await supabase
      .from("users").select("role").eq("id", user.id).single();
    if (adminData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "suspend") {
      // In production, you'd use Supabase Admin API to ban the user
      // For now we mark them in a metadata field
      const { error } = await supabase
        .from("users")
        .update({ onboarding_complete: false })
        .eq("id", userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
