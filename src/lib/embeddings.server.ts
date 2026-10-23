// Portable embedding generator: OpenAI REST first, Lovable AI Gateway fallback.
// Model + dimensions are fixed so every stored vector is comparable.
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

async function call(url: string, key: string, model: string, input: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input }),
  });
  if (!res.ok) throw new Error(`embedding ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { data?: { embedding: number[] }[] };
  const vec = json.data?.[0]?.embedding;
  if (!vec || vec.length !== EMBEDDING_DIMS) throw new Error("embedding: bad vector");
  return vec;
}

export async function embedText(input: string): Promise<number[]> {
  const text = input.trim().slice(0, 8000);
  const openaiKey = process.env["Embeddings_3_Small_API"] || process.env["OPENAI_API_KEY"];
  if (openaiKey) {
    try {
      return await call("https://api.openai.com/v1/embeddings", openaiKey, EMBEDDING_MODEL, text);
    } catch (e) {
      console.error("[embeddings] OpenAI failed, trying gateway", e);
    }
  }
  const gwKey = process.env["LOVABLE_API_KEY"];
  if (!gwKey) throw new Error("No embedding provider configured");
  return call("https://ai.gateway.lovable.dev/v1/embeddings", gwKey, `openai/${EMBEDDING_MODEL}`, text);
}

export const toPgVector = (v: number[]) => `[${v.join(",")}]`;
