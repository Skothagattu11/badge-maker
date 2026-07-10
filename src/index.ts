import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import open from "open";
import type { BadgeSpec, ModelConfig } from "./types.js";
import { buildPrompt } from "./prompt-builder.js";
import { generateWithOpenAI } from "./providers/openai.js";
import { generateWithReplicate } from "./providers/replicate.js";
import { generateReport } from "./reporter.js";
import type { BadgeResult } from "./reporter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");

function validateEnv(models: ModelConfig[]): void {
  const needsOpenAI = models.some((m) => m.enabled && m.provider === "openai");
  const needsReplicate = models.some((m) => m.enabled && m.provider === "replicate");
  const missing: string[] = [];
  if (needsOpenAI && !process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (needsReplicate && !process.env.REPLICATE_API_TOKEN) missing.push("REPLICATE_API_TOKEN");
  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}\nCopy .env.example to .env and fill in your keys.`
    );
  }
}

async function main(): Promise<void> {
  const badges: BadgeSpec[] = JSON.parse(
    await fs.readFile(path.join(ROOT, "badges.json"), "utf-8")
  );
  const allModels: ModelConfig[] = JSON.parse(
    await fs.readFile(path.join(ROOT, "models.config.json"), "utf-8")
  );
  const enabledModels = allModels.filter((m) => m.enabled);

  if (!enabledModels.length) {
    throw new Error(
      'No models are enabled in models.config.json. Set "enabled": true on at least one entry.'
    );
  }

  validateEnv(allModels);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`\nEntropy Badge Model Comparison`);
  console.log(`${badges.length} badge(s) x ${enabledModels.length} model(s)\n`);

  const badgeResults: BadgeResult[] = [];

  for (const badge of badges) {
    console.log(`> ${badge.name} (${badge.id})`);

    const prompt = buildPrompt(badge);
    const results = await Promise.all(
      enabledModels.map((model) =>
        model.provider === "openai"
          ? generateWithOpenAI(prompt, model)
          : generateWithReplicate(prompt, model)
      )
    );

    for (const result of results) {
      if (result.imageBuffer) {
        const filename = `${badge.id}-${result.modelId}.png`;
        await fs.writeFile(path.join(OUTPUT_DIR, filename), result.imageBuffer);
        const cost =
          result.costUsd != null ? ` ($${result.costUsd.toFixed(2)})` : " (~compute)";
        console.log(
          `  ok  ${result.label.padEnd(20)} ${(result.timingMs / 1000).toFixed(1)}s${cost}`
        );
      } else {
        console.log(`  ERR ${result.label.padEnd(20)} ${result.error}`);
      }
    }

    badgeResults.push({ badge, results });
    console.log();
  }

  const html = generateReport(badgeResults);
  const reportPath = path.join(OUTPUT_DIR, "report.html");
  await fs.writeFile(reportPath, html, "utf-8");
  console.log(`Report saved -> ${reportPath}`);
  await open(reportPath);
}

main().catch((err: Error) => {
  console.error(`\nError: ${err.message}`);
  process.exitCode = 1;
});
