import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category");

    let query = supabase
      .from("skills")
      .select("*")
      .order("demand_score", { ascending: false })
      .limit(50);

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ skills: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load skills" }, { status: 500 });
  }
}
