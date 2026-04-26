import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";

interface AlignmentInput {
  user: { pace: string; intention: string };
  match: { pace: string; intention: string; name: string };
}

export const generateAlignmentSpec = createServerFn({ method: "POST" })
  .inputValidator((input: AlignmentInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("[AlignmentEngine] API Key Missing from Environment");
      return { text: null, error: "API Key Missing from Environment" };
    }

    console.log("Gemma 4 Request Initiated for Project 652894558236");

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
