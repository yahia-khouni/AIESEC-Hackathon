import { createClient } from "@/lib/db/supabase.server";
import type { Notification, NotificationType } from "@/types";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const notificationService = {
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    actionUrl?: string;
  }): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      action_url: params.actionUrl ?? null,
      read: false,
    });
    if (error) throw new Error(error.message);
  },

  async getAll(userId: string): Promise<Notification[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as Notification[];
  },

  async markRead(notificationId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    if (error) throw new Error(error.message);
  },

  async markAllRead(userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) return 0;
    return count ?? 0;
  },

  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await resend.emails.send({
        from: "PotentialHire <noreply@potentialhire.dev>",
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
    } catch (error) {
      console.error("[Resend email error]", error);
      // Don't throw — email failure shouldn't crash the flow
    }
  },
};
