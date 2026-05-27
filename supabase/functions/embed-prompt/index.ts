// Edge Function: embed-prompt
// Triggered by a Postgres database webhook on INSERT into public.prompt_responses.
// Generates a 384-dim embedding from response_text using Supabase.ai's built-in
// gte-small model and writes it back to the embedding column.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore - Supabase.ai is provided by the Supabase Edge Runtime
const session = new Supabase.ai.Session("gte-small");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: number;
    response_text: string | null;
    embedding: number[] | null;
  } | null;
  old_record: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as WebhookPayload;

    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not an INSERT event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { id, response_text } = payload.record;

    if (!response_text || response_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Empty response_text", id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate the 384-dim embedding using the built-in gte-small model.
    const embedding = (await session.run(response_text, {
      mean_pool: true,
      normalize: true,
    })) as number[];

    // Update the row with the resulting vector.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("prompt_responses")
      .update({ embedding })
      .eq("id", id);

    if (error) {
      console.error("[embed-prompt] update failed", { id, error });
      return new Response(JSON.stringify({ error: error.message, id }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[embed-prompt] embedded row id=${id} dim=${embedding.length}`);
    return new Response(
      JSON.stringify({ ok: true, id, dim: embedding.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[embed-prompt] error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});