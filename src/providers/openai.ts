import OpenAI from "openai";
import type { ModelConfig, GenerationResult } from "../types.js";

const COST_USD: Record<string, number> = {
  "gpt-image-2": 0.06,
  "dall-e-3": 0.08,
};

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function generateWithOpenAI(
  prompt: string,
  model: ModelConfig
): Promise<GenerationResult> {
  const start = Date.now();
  try {
    const openai = getClient();

    // gpt-image-2 uses output_format (new Images API); dall-e-3 uses response_format (legacy)
    const params =
      model.id === "gpt-image-2"
        ? ({
            model: "gpt-image-2",
            prompt,
            size: "1024x1024" as const,
            quality: "high" as const,
            output_format: "png",
            response_format: "b64_json" as const,
            n: 1,
          } as Parameters<typeof openai.images.generate>[0])
        : ({
            model: model.id,
            prompt,
            size: "1024x1024" as const,
            quality: "hd" as const,
            response_format: "b64_json" as const,
            n: 1,
          } as Parameters<typeof openai.images.generate>[0]);

    const result = await openai.images.generate(params);
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("API returned no image data");

    return {
      modelId: model.id,
      label: model.label,
      imageBuffer: Buffer.from(b64, "base64"),
      timingMs: Date.now() - start,
      costUsd: COST_USD[model.id] ?? null,
    };
  } catch (err) {
    return {
      modelId: model.id,
      label: model.label,
      imageBuffer: null,
      timingMs: Date.now() - start,
      costUsd: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
