import { createServerFn } from "@tanstack/react-start";

interface AlignmentInput {
  user: { pace: string; intention: string };
  match: { pace: string; intention: string; name: string };
}

export const generateAlignmentSpec = createServerFn({ method: "POST" })
  .inputValidator((input: AlignmentInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { text: null, error: "AI service is not configured." };
    }

    const prompt = `User A — Pace: ${data.user.pace}. Intention: ${data.user.intention}.
User B (${data.match.name}) — Pace: ${data.match.pace}. Intention: ${data.match.intention}.

Analyze these two user spec sheets. Generate a tactical, 2-sentence summary explaining why these daily rhythms and long-term goals are a high-signal match. Keep the tone professional, direct, and slightly technical.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an alignment analyst for a high-signal dating engine. Output exactly 2 sentences. No preamble, no bullet points, no quotes.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (res.status === 429) {
        return { text: null, error: "Rate limit reached. Try again in a moment." };
      }
      if (res.status === 402) {
        return { text: null, error: "AI credits exhausted. Add funds in Workspace settings." };
      }
      if (!res.ok) {
        const t = await res.text();
        console.error("AI gateway error:", res.status, t);
        return { text: null, error: "Engine offline. Try again." };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim() ?? null;
      if (!text) return { text: null, error: "No response generated." };
      return { text, error: null };
    } catch (err) {
      console.error("alignment spec error:", err);
      return { text: null, error: "Engine offline. Try again." };
    }
  });