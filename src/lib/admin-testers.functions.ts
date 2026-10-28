// DEV TESTERS — delete before launch together with src/loom/dev/.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TESTERS, isTestEmail, testerEmail } from "@/loom/dev/testers";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

export const seedTesters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { embedText, toPgVector } = await import("./embeddings.server");
    const sb = supabaseAdmin as any;
    const { data: prompt } = await sb.rpc("get_current_prompt");
    const p = prompt?.[0];
    if (!p) throw new Error("No prompt today");
    const password = `Loom-${crypto.randomUUID().slice(0, 12)}`;
    const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
    const out: { email: string }[] = [];
    for (const t of TESTERS) {
      const email = testerEmail(t.n);
      let uid = list?.users?.find((u: any) => u.email === email)?.id as string | undefined;
      if (uid) {
        await sb.auth.admin.updateUserById(uid, { password });
      } else {
        const { data, error } = await sb.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { display_name: t.name, date_of_birth: "2003-01-01" },
        });
        if (error) throw new Error(error.message);
        uid = data.user.id;
      }
      const seeds = [{ q: "What recharges you?", a: t.answer }];
      const baseline = await embedText(t.answer);
      const { error: pe } = await sb.from("profiles").upsert({
        id: uid, display_name: t.name, gender: t.gender, target_preference: t.seeking,
        campus_hub: "UW Seattle", height_in: 68, seed_prompts: seeds,
        baseline_embedding: toPgVector(baseline), is_test_account: true,
      });
      if (pe) throw new Error(pe.message);
      await sb.from("matching_preferences").delete().eq("user_id", uid);
      await sb.from("matching_preferences").insert({ user_id: uid, intention: "intentional", balance: "mirror", pause_matching: false });
      await sb.from("prompt_responses").delete().eq("user_id", uid).eq("drop_date", p.drop_date);
      const vec = await embedText(t.answer);
      const { error: re } = await sb.from("prompt_responses").insert({
        user_id: uid, prompt_id: p.id, drop_date: p.drop_date, response_text: t.answer, answer_embedding: toPgVector(vec),
      });
      if (re) throw new Error(re.message);
      out.push({ email });
    }
    await context.supabase.rpc("admin_log_action", { p_action: "seed_testers", p_details: { count: out.length } });
    return { accounts: out, password };
  });

export const wipeTesters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: flagged } = await sb.from("profiles").select("id").eq("is_test_account", true);
    const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
    const ids: string[] = (flagged ?? [])
      .map((r: any) => r.id)
      .filter((id: string) => {
        const u = list?.users?.find((x: any) => x.id === id);
        return u && isTestEmail(u.email) && id !== context.userId;
      });
    for (const id of ids) {
      const { data: threads } = await sb.from("match_threads").select("id").or(`user_a.eq.${id},user_b.eq.${id}`);
      const tids = (threads ?? []).map((t: any) => t.id);
      if (tids.length) {
        await sb.from("match_messages").delete().in("thread_id", tids);
        await sb.from("match_history").delete().in("thread_id", tids);
        await sb.from("match_threads").delete().in("id", tids);
      }
      await sb.from("matches").delete().or(`user_id.eq.${id},matched_user_id.eq.${id}`);
      await sb.from("user_blocks").delete().or(`blocker_id.eq.${id},blocked_id.eq.${id}`);
      await sb.from("match_history").delete().or(`user_id.eq.${id},matched_user_id.eq.${id}`);
      await sb.from("prompt_responses").delete().eq("user_id", id);
      await sb.from("matching_preferences").delete().eq("user_id", id);
      await sb.from("loom_plus_members").delete().eq("user_id", id);
      const { error } = await sb.auth.admin.deleteUser(id);
      if (error) throw new Error(error.message);
    }
    await context.supabase.rpc("admin_log_action", { p_action: "wipe_testers", p_details: { count: ids.length } });
    return { removed: ids.length };
  });
