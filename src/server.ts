import "dotenv/config";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPrompt } from "./prompt-builder.js";
import { generateWithOpenAI } from "./providers/openai.js";
import { generateWithReplicate } from "./providers/replicate.js";
import type { BadgeSpec, ModelConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 3000;
const UI_FILE = path.join(__dirname, "ui", "index.html");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(ROOT, file), "utf-8")) as T;
}

function respond(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  contentType = "application/json",
): void {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": contentType });
  res.end(text);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk.toString()));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const method = req.method ?? "GET";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const html = await fs.readFile(UI_FILE, "utf-8");
      respond(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (method === "GET" && url.pathname === "/api/badges") {
      respond(res, 200, await readJson("badges.json"));
      return;
    }

    if (method === "GET" && url.pathname === "/api/models") {
      respond(res, 200, await readJson("models.config.json"));
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/api/preview/")) {
      const badgeId = decodeURIComponent(url.pathname.slice("/api/preview/".length));
      const badges = await readJson<BadgeSpec[]>("badges.json");
      const badge = badges.find((b) => b.id === badgeId);
      if (!badge) {
        respond(res, 404, { error: "Badge not found" });
        return;
      }
      respond(res, 200, { prompt: buildPrompt(badge) });
      return;
    }

    if (method === "POST" && url.pathname === "/api/generate") {
      const body = await readBody(req);
      const { badgeId, modelIds } = JSON.parse(body) as {
        badgeId: string;
        modelIds: string[];
      };

      const [badges, allModels] = await Promise.all([
        readJson<BadgeSpec[]>("badges.json"),
        readJson<ModelConfig[]>("models.config.json"),
      ]);

      const badge = badges.find((b) => b.id === badgeId);
      if (!badge) {
        respond(res, 404, { error: "Badge not found" });
        return;
      }

      const models = allModels.filter((m) => modelIds.includes(m.id));
      const prompt = buildPrompt(badge);

      const results = await Promise.all(
        models.map((model) =>
          model.provider === "openai"
            ? generateWithOpenAI(prompt, model)
            : generateWithReplicate(prompt, model),
        ),
      );

      const outputDir = path.join(ROOT, "output");
      await fs.mkdir(outputDir, { recursive: true });

      const responseResults = await Promise.all(
        results.map(async (r) => {
          if (r.imageBuffer) {
            await fs.writeFile(
              path.join(outputDir, `${badgeId}-${r.modelId}.png`),
              r.imageBuffer,
            );
            return {
              modelId: r.modelId,
              label: r.label,
              imageBase64: r.imageBuffer.toString("base64"),
              timingMs: r.timingMs,
              costUsd: r.costUsd,
              error: null,
            };
          }
          return {
            modelId: r.modelId,
            label: r.label,
            imageBase64: null,
            timingMs: r.timingMs,
            costUsd: r.costUsd,
            error: r.error ?? "Unknown error",
          };
        }),
      );

      respond(res, 200, { badge, results: responseResults });
      return;
    }

    respond(res, 404, "Not found", "text/plain");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Server error:", message);
    respond(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`\nEntropy Badge Generator`);
  console.log(`Open: http://localhost:${PORT}\n`);
  import("open").then((m) => m.default(`http://localhost:${PORT}`));
});
