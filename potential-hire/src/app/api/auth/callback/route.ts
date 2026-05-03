import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/candidate/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user role to redirect properly
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role, onboarding_complete")
          .eq("id", user.id)
          .single();

        if (userData && !userData.onboarding_complete) {
          return NextResponse.redirect(
            new URL(`/${userData.role}/onboarding`, origin)
          );
        }

        if (userData) {
          return NextResponse.redirect(
            new URL(`/${userData.role}/dashboard`, origin)
          );
        }
      }

      return NextResponse.redirect(new URL(redirect, origin));
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", origin)
  );
}
