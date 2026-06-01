// Edge Function: embed-prompt
// Triggered by a Postgres database webhook on INSERT into public.prompt_responses.
// Generates a 384-dim embedding from response_text using Supabase.ai's built-in
// gte-small model and writes it back to the embedding column.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore - Supabase.ai is provided by the Supabase Edge Runtime
const session = new Supabase.ai.Session("gte-small");

// This endpoint is only called by the Postgres database webhook — never from a
// browser — so we do not advertise any CORS allowances.
const jsonHeaders = { "Content-Type": "application/json" };

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("\\x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyHmac(secret: string, body: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  const expectedHex = bytesToHex(sigBuf);
  // Accept either raw hex or `sha256=<hex>` formats.
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  return timingSafeEqual(hexToBytes(expectedHex), hexToBytes(provided));
}

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
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const secret = Deno.env.get("WEBHOOK_SECRET");
    if (!secret) {
      console.error("[embed-prompt] WEBHOOK_SECRET is not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const signature =
      req.headers.get("x-webhook-signature") ??
      req.headers.get("x-supabase-signature") ??
      "";
    const rawBody = await req.text();

    if (!signature || !(await verifyHmac(secret, rawBody, signature))) {
      console.warn("[embed-prompt] rejected: invalid or missing signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;

    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not an INSERT event" }),
        { headers: jsonHeaders },
      );
    }

    const { id, response_text } = payload.record;

    if (!response_text || response_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Empty response_text", id }),
        { headers: jsonHeaders },
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
        headers: jsonHeaders,
      });
    }

    console.log(`[embed-prompt] embedded row id=${id} dim=${embedding.length}`);
    return new Response(
      JSON.stringify({ ok: true, id, dim: embedding.length }),
      { headers: jsonHeaders },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[embed-prompt] error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});