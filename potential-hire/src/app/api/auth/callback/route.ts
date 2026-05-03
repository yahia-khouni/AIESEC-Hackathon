import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/candidate/dashboard";

  // ── Log incoming callback params ──
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDesc = searchParams.get("error_description");

  console.log("━━━ AUTH CALLBACK ━━━");
  console.log("  URL:", request.url);
  console.log("  code:", code ? `${code.slice(0, 8)}...` : "null");
  console.log("  error:", error);
  console.log("  error_code:", errorCode);
  console.log("  error_description:", errorDesc);

  // ── Handle Supabase-level auth errors (e.g., trigger failures) ──
  if (error) {
    console.error("━━━ AUTH ERROR FROM SUPABASE ━━━");
    console.error("  error:", error);
    console.error("  error_code:", errorCode);
    console.error("  error_description:", errorDesc);

    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error);
    if (errorCode) loginUrl.searchParams.set("error_code", errorCode);
    if (errorDesc) loginUrl.searchParams.set("error_description", errorDesc);
    return NextResponse.redirect(loginUrl);
  }

  // ── No code and no error — something weird happened ──
  if (!code) {
    console.error("━━━ AUTH CALLBACK: No code and no error ━━━");
    return NextResponse.redirect(
      new URL("/login?error=no_code_received", origin)
    );
  }

  // ── Exchange code for session ──
  try {
    const supabase = await createClient();

    console.log("  Exchanging code for session...");
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("━━━ SESSION EXCHANGE ERROR ━━━");
      console.error("  message:", sessionError.message);
      console.error("  status:", sessionError.status);
      console.error("  name:", sessionError.name);
      console.error("  full:", JSON.stringify(sessionError, null, 2));

      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "session_exchange_failed");
      loginUrl.searchParams.set("error_description", sessionError.message);
      return NextResponse.redirect(loginUrl);
    }

    console.log("  ✅ Session exchanged successfully");
    console.log("  user_id:", sessionData?.user?.id);
    console.log("  email:", sessionData?.user?.email);
    console.log("  provider:", sessionData?.user?.app_metadata?.provider);
    console.log(
      "  user_metadata:",
      JSON.stringify(sessionData?.user?.user_metadata, null, 2)
    );

    // ── Get user ──
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("  ❌ No user after session exchange");
      return NextResponse.redirect(new URL("/login?error=no_user", origin));
    }

    // ── Always ensure public.users row exists (don't rely on trigger) ──
    console.log("  Ensuring public.users profile exists...");
    const profileRes = await fetch(`${origin}/api/auth/create-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0],
        role: user.user_metadata?.role || "candidate",
      }),
    });

    const profileJson = await profileRes.json().catch(() => ({}));
    console.log(
      "  Profile API:",
      profileRes.status,
      JSON.stringify(profileJson)
    );

    // ── Get user role from DB for redirect ──
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("  ❌ Still cannot read user from DB:", userError.message);
      // Last resort redirect
      const role = user.user_metadata?.role || "candidate";
      return NextResponse.redirect(new URL(`/${role}/onboarding`, origin));
    }

    console.log("  ✅ User:", JSON.stringify(userData));

    if (!userData.onboarding_complete) {
      return NextResponse.redirect(
        new URL(`/${userData.role}/onboarding`, origin)
      );
    }
    return NextResponse.redirect(
      new URL(`/${userData.role}/dashboard`, origin)
    );
  } catch (err) {
    console.error("━━━ UNHANDLED AUTH CALLBACK ERROR ━━━");
    console.error("  error:", err);
    console.error(
      "  stack:",
      err instanceof Error ? err.stack : "no stack trace"
    );

    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "unexpected_error");
    loginUrl.searchParams.set(
      "error_description",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.redirect(loginUrl);
  }
}
