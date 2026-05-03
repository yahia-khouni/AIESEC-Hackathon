import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * POST /api/auth/create-profile
 * Creates a public.users row using the service role (bypasses RLS and trigger).
 * Called after signUp or OAuth exchange when the trigger fails.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, full_name, role } = body;

    console.log("━━━ CREATE PROFILE ━━━");
    console.log("  user_id:", user_id);
    console.log("  email:", email);
    console.log("  role:", role);

    if (!user_id || !email) {
      return NextResponse.json(
        { error: "user_id and email are required" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.error("  ❌ Missing Supabase service role credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Use service role — bypasses RLS entirely
    const supabase = createServiceClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if row already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (existing) {
      console.log("  ✅ User row already exists — skipping insert");
      return NextResponse.json({ success: true, created: false });
    }

    // Insert the profile
    const validRoles = ["candidate", "employer", "institution", "admin"];
    const safeRole = validRoles.includes(role) ? role : "candidate";

    const { error: insertError } = await supabase.from("users").insert({
      id: user_id,
      email: email,
      full_name: full_name || email.split("@")[0],
      role: safeRole,
    });

    if (insertError) {
      console.error("  ❌ Insert failed:", insertError.message);
      console.error("  code:", insertError.code);
      console.error("  details:", insertError.details);
      return NextResponse.json(
        { error: insertError.message, code: insertError.code },
        { status: 500 }
      );
    }

    console.log("  ✅ User profile created successfully");
    return NextResponse.json({ success: true, created: true });
  } catch (err) {
    console.error("  ❌ Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
