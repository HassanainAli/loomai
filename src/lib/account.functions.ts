import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Permanently deletes the signed-in user's account. Only ever deletes the caller.
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Storage must be removed through its API, before deleting the account owner.
    const bucket = supabaseAdmin.storage.from("profile-photos");
    for (;;) {
      const { data: files, error: listError } = await bucket.list(context.userId, { limit: 100, offset: 0 });
      if (listError) return { ok: false as const };
      if (!files?.length) break;
      const { error: removeError } = await bucket.remove(files.map((f) => `${context.userId}/${f.name}`));
      if (removeError) return { ok: false as const };
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) {
      console.error("[deleteMyAccount]", error);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
