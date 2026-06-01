import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SpecSchema = z.object({
  pace: z.string().trim().min(1).max(500),
  intention: z.string().trim().min(1).max(500),
});

const AlignmentInputSchema = z.object({
  user: SpecSchema,
  match: SpecSchema.extend({
    name: z.string().trim().min(1).max(100),
  }),
});

// Simple in-memory rate limit (per server instance).
// Protects the paid Gemini endpoint from anonymous abuse.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

export const generateAlignmentSpec = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AlignmentInputSchema.parse(input))
  .handler(async ({ data }) => {
    // Rate limit by client IP to prevent budget exhaustion on this paid endpoint.
    try {
      const req = getRequest();
      const ip =
        req?.headers.get("cf-connecting-ip") ||
        req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";
      if (!checkRateLimit(ip)) {
        return { text: null, error: "Rate limit exceeded. Try again shortly." };
      }
    } catch {
      // If request context is unavailable, fall through.
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("[AlignmentEngine] API Key Missing from Environment");
      return { text: null, error: "Engine unavailable. Please try again later." };
    }

    console.log("[AlignmentEngine] request initiated");

    const systemInstruction =
      "You are the Loom Alignment Engine. Analyze the provided Spec Sheets for Pace and Intention. Generate a tactical, 2-sentence summary of their high-signal compatibility. Tone: Technical, intentional, Neon-Noir.";

    const userPrompt = `Spec Sheet A (current user)
Pace: ${data.user.pace}
Intention: ${data.user.intention}

Spec Sheet B (${data.match.name})
Pace: ${data.match.pace}
Intention: ${data.match.intention}`;

    const model = "gemma-4-31b-it";

    try {
      const ai = new GoogleGenAI({ apiKey });
      console.log(`[AlignmentEngine] Calling Gemma model=${model} for match=${data.match.name}`);

      // Gemma models on Gemini API don't support a separate system instruction —
      // prepend it to the user prompt for compatibility.
      const composedPrompt = `${systemInstruction}\n\n${userPrompt}`;

      const response = await ai.models.generateContent({
        model,
        contents: composedPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 256,
        },
      });

      const text = (response.text ?? "").trim();
      console.log(`[AlignmentEngine] Gemma response received length=${text.length}`);

      if (!text) return { text: null, error: "No response generated." };
      return { text, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[AlignmentEngine] Request failed:", message);
      if (/429|rate/i.test(message)) {
        return { text: null, error: "Rate limit reached. Try again in a moment." };
      }
      return { text: null, error: "Engine offline. Try again." };
    }
  });
