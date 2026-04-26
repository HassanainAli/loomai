import { createServerFn } from "@tanstack/react-start";

interface AlignmentInput {
  user: { pace: string; intention: string };
  match: { pace: string; intention: string; name: string };
}

export const generateAlignmentSpec = createServerFn({ method: "POST" })
  .inputValidator((input: AlignmentInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { text: null, error: "GEMINI_API_KEY is not configured." };
    }

    const systemInstruction =
      "You are the Loom Alignment Engine. Analyze the provided Spec Sheets for Pace and Intention. Generate a tactical, 2-sentence summary of their high-signal compatibility. Tone: Technical, intentional, Neon-Noir.";

    const userPrompt = `Spec Sheet A (current user)
Pace: ${data.user.pace}
Intention: ${data.user.intention}

Spec Sheet B (${data.match.name})
Pace: ${data.match.pace}
Intention: ${data.match.intention}`;

    const model = "gemma-4-31b-it";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      console.log(`[AlignmentEngine] Calling Gemini API model=${model} for match=${data.match.name}`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
        }),
      });

      console.log(`[AlignmentEngine] Gemini response status=${res.status}`);

      if (res.status === 429) {
        return { text: null, error: "Rate limit reached. Try again in a moment." };
      }
      if (!res.ok) {
        const t = await res.text();
        console.error("[AlignmentEngine] Gemini API error:", res.status, t);
        return { text: null, error: "Engine offline. Try again." };
      }

      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text =
        json.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim() ?? null;
      if (!text) return { text: null, error: "No response generated." };
      return { text, error: null };
    } catch (err) {
      console.error("[AlignmentEngine] Request failed:", err);
      return { text: null, error: "Engine offline. Try again." };
    }
  });