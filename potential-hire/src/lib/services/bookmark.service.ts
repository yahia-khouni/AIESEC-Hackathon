import { createClient } from "@/lib/db/supabase.server";
import type { Bookmark } from "@/types";

export interface BookmarkWithCandidate extends Bookmark {
  candidate: {
    id: string;
    potential_score: number | null;
    availability: string;
    target_regions: string[];
  };
}

export const bookmarkService = {
  async add(
    employerId: string,
    candidateId: string,
    threshold: number,
    notes?: string
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("bookmarks").upsert(
      {
        employer_id: employerId,
        candidate_id: candidateId,
        readiness_threshold: threshold,
        notes: notes ?? null,
        notified: false,
      },
      { onConflict: "employer_id,candidate_id" }
    );
    if (error) throw new Error(error.message);
  },

  async remove(bookmarkId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId);
    if (error) throw new Error(error.message);
  },

  async getAll(employerId: string): Promise<BookmarkWithCandidate[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bookmarks")
      .select(
        `
        *,
        candidates(id, potential_score, availability, target_regions)
      `
      )
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((b: any) => ({
      ...b,
      candidate: b.candidates,
    })) as BookmarkWithCandidate[];
  },

  async updateThreshold(bookmarkId: string, threshold: number): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("bookmarks")
      .update({ readiness_threshold: threshold, notified: false })
      .eq("id", bookmarkId);
    if (error) throw new Error(error.message);
  },

  async isBookmarked(employerId: string, candidateId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("employer_id", employerId)
      .eq("candidate_id", candidateId)
      .single();
    return !!data;
  },
};
