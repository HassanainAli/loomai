import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const firstName = (n?: string | null) => (n ?? "").trim().split(/\s+/)[0] || "";

// Emails both students when the caller's green light completed a mutual match.
// Only fires for a match the caller owns that is mutual with an open thread; idempotent per thread+recipient.
export const notifyMutualGreenlight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ matchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: m } = await context.supabase
      .from("matches")
      .select("id, user_id, matched_user_id, status, drop_date")
      .eq("id", data.matchId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!m || m.status !== "mutual") return { sent: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: thread } = await supabaseAdmin
      .from("match_threads")
      .select("id")
      .eq("status", "active")
      .eq("user_a", m.user_id < m.matched_user_id ? m.user_id : m.matched_user_id)
      .eq("user_b", m.user_id < m.matched_user_id ? m.matched_user_id : m.user_id)
      .maybeSingle();
    if (!thread) return { sent: 0 };

    const ids = [m.user_id, m.matched_user_id];
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, display_name").in("id", ids);
    const nameOf = (id: string) => firstName(profiles?.find((p) => p.id === id)?.display_name);

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    let sent = 0;
    for (const [me, other] of [[ids[0]!, ids[1]!], [ids[1]!, ids[0]!]]) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(me);
      const email = u?.user?.email;
      if (!email) continue;
      try {
        const r = await sendTemplateEmail("mutual-greenlight", email, {
          templateData: { name: nameOf(me), partnerName: nameOf(other) },
          idempotencyKey: `mutual-greenlight-${thread.id}-${me}`,
        });
        if (r.sent) sent++;
      } catch (e) {
        console.error("[notifyMutualGreenlight]", e);
      }
    }
    return { sent };
  });
