import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (userData?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const role = searchParams.get("role");

    let query = supabase.from("users").select("*").order("created_at", { ascending: false }).limit(100);
    if (role) query = query.eq("role", role);
    if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ users: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
