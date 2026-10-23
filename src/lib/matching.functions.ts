import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Embed the caller's latest daily answer for a drop date.
export const embedDailyAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { dropDate: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.dropDate ?? "")) throw new Error("bad date");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { embedText, toPgVector } = await import("./embeddings.server");
    const sb = context.supabase as any;
    const { data: row, error } = await sb
      .from("prompt_responses")
      .select("id, response_text")
      .eq("user_id", context.userId)
      .eq("drop_date", data.dropDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { ok: false };
    const vec = await embedText(row.response_text);
    const { error: upErr } = await sb
      .from("prompt_responses")
      .update({ answer_embedding: toPgVector(vec) })
      .eq("id", row.id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

// Embed the caller's three onboarding answers as one baseline vector.
export const embedBaseline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { embedText, toPgVector } = await import("./embeddings.server");
    const sb = context.supabase as any;
    const { data: p, error } = await sb
      .from("profiles")
      .select("seed_prompts")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const seeds = Array.isArray(p?.seed_prompts) ? p.seed_prompts : [];
    const text = seeds
      .map((s: any) => `${s?.q ?? ""}\n${s?.a ?? ""}`)
      .join("\n\n")
      .trim();
    if (!text) return { ok: false };
    const vec = await embedText(text);
    const { error: upErr } = await sb
      .from("profiles")
      .update({ baseline_embedding: toPgVector(vec) })
      .eq("id", context.userId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });
