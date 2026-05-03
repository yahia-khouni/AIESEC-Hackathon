import { createClient } from "@/lib/db/supabase.server";
import type { Credential } from "@/types";

export const credentialService = {
  async add(
    candidateId: string,
    data: {
      provider: string;
      title: string;
      credential_url: string;
    }
  ): Promise<Credential> {
    const supabase = await createClient();

    const { data: credential, error } = await supabase
      .from("credentials")
      .insert({
        candidate_id: candidateId,
        provider: data.provider,
        title: data.title,
        credential_url: data.credential_url,
        verified: false,
      })
      .select()
      .single();

    if (error) throw error;
    return credential as Credential;
  },

  async verify(credentialId: string): Promise<boolean> {
    const supabase = await createClient();

    // Basic URL verification — check if the credential URL is accessible
    const { data: credential } = await supabase
      .from("credentials")
      .select("credential_url")
      .eq("id", credentialId)
      .single();

    if (!credential) return false;

    try {
      const response = await fetch(credential.credential_url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      const isValid = response.ok;

      await supabase
        .from("credentials")
        .update({
          verified: isValid,
          verified_at: isValid ? new Date().toISOString() : null,
        })
        .eq("id", credentialId);

      return isValid;
    } catch {
      return false;
    }
  },

  async getAll(candidateId: string): Promise<Credential[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Credential[];
  },

  async delete(credentialId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("credentials")
      .delete()
      .eq("id", credentialId);

    if (error) throw error;
  },

  async getCount(candidateId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("credentials")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", candidateId);

    if (error) throw error;
    return count || 0;
  },
};
