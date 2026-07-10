import Replicate from "replicate";
import type { ModelConfig, GenerationResult } from "../types.js";

let _client: Replicate | null = null;

function getClient(): Replicate {
  if (!_client) _client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  return _client;
}

async function fetchUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function retryAfterMs(err: unknown): number | null {
  if (!(err instanceof Error)) return null;
  if (!err.message.includes("429")) return null;
  const match = err.message.match(/"retry_after"\s*:\s*(\d+)/);
  // Add 2s buffer on top of the server's suggested wait
  return match ? (parseInt(match[1]) + 2) * 1000 : 12_000;
}

async function runWithRetry(
  replicate: Replicate,
  modelSlug: string,
  input: Record<string, unknown>,
  retriesLeft = 2,
): Promise<unknown> {
  try {
    return await replicate.run(modelSlug as `${string}/${string}`, { input });
  } catch (err) {
    const waitMs = retryAfterMs(err);
    if (waitMs !== null && retriesLeft > 0) {
      console.log(`Replicate 429 — retrying in ${waitMs / 1000}s… (${retriesLeft} left)`);
      await new Promise((res) => setTimeout(res, waitMs));
      return runWithRetry(replicate, modelSlug, input, retriesLeft - 1);
    }
    throw err;
  }
}

async function outputToBuffer(output: unknown): Promise<Buffer> {
  if (output instanceof Buffer) return output;
  if (output instanceof Uint8Array) return Buffer.from(output);

  if (typeof output === "string" && output.startsWith("http")) {
    return fetchUrl(output);
  }

  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string" && first.startsWith("http")) return fetchUrl(first);
    if (first instanceof Uint8Array || first instanceof Buffer) return Buffer.from(first as Uint8Array);
    if (first && typeof (first as Record<string, unknown>).url === "function") {
      return fetchUrl(String((first as Record<string, () => unknown>).url()));
    }
  }

  if (output && typeof (output as Record<string, unknown>).url === "function") {
    return fetchUrl(String((output as Record<string, () => unknown>).url()));
  }

  throw new Error(`Unrecognised Replicate output shape: ${typeof output}`);
}

export async function generateWithReplicate(
  prompt: string,
  model: ModelConfig
): Promise<GenerationResult> {
  if (!model.replicateModel) {
    return {
      modelId: model.id,
      label: model.label,
      imageBuffer: null,
      timingMs: 0,
      costUsd: null,
      error: "No replicateModel slug configured for this model",
    };
  }

  const start = Date.now();
  try {
    const replicate = getClient();
    const input = { prompt, ...(model.extraInput ?? {}) };

    const output = await runWithRetry(replicate, model.replicateModel, input);

    const imageBuffer = await outputToBuffer(output);

    return {
      modelId: model.id,
      label: model.label,
      imageBuffer,
      timingMs: Date.now() - start,
      costUsd: null,
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
