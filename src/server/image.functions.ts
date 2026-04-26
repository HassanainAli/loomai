import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";

interface AuraInput {
  name: string;
  identity: string; // gender spectrum value
}

export const generateAuraImage = createServerFn({ method: "POST" })
  .inputValidator((input: AuraInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("[AuraEngine] API Key Missing from Environment");
      return { image: null, error: "API Key Missing from Environment" };
    }

    console.log("Gemini Image Request Initiated for Project 652894558236");

    const safeName = data.name?.trim() || "Operator";
    const identity = data.identity?.trim() || "Unspecified";

    const prompt = `A high-fidelity, minimalist Neon-Noir data aura for ${safeName} (${identity}). Abstract geometric lines in fuchsia and yellow glowing against a deep black void. 8k resolution, technical aesthetic.`;

    const model = "gemini-2.5-flash-image";

    try {
      const ai = new GoogleGenAI({ apiKey });
      console.log(`[AuraEngine] Calling ${model} for name=${safeName}`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const inline = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
        if (inline?.data) {
          const mime = inline.mimeType || "image/png";
          console.log(`[AuraEngine] Image received mime=${mime} size=${inline.data.length}`);
          return { image: `data:${mime};base64,${inline.data}`, error: null };
        }
      }

      console.error("[AuraEngine] No inline image data in response");
      return { image: null, error: "No image generated." };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[AuraEngine] Request failed:", message);
      if (/429|rate/i.test(message)) {
        return { image: null, error: "Rate limit reached. Try again." };
      }
      return { image: null, error: "Aura engine offline. Try again." };
    }
  });
