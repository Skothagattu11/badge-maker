import { describe, it, expect } from "vitest";
import { generateReport } from "../reporter.js";
import type { BadgeSpec } from "../types.js";

const sampleBadge: BadgeSpec = {
  id: "consistency-30",
  category: "consistency",
  name: "Unbroken",
  achievement: "Complete planned tasks for 30 consecutive days",
  heroSymbol: "lone figure",
  environment: "mountain ridges",
  metaphor: "small actions",
  accentPalette: "warm amber",
  emotion: "discipline",
  rarity: "gold",
};

describe("generateReport", () => {
  it("returns a valid HTML document", () => {
    const html = generateReport([{
      badge: sampleBadge,
      results: [{
        modelId: "gpt-image-2",
        label: "GPT Image 2",
        imageBuffer: Buffer.from("fake-png-data"),
        timingMs: 6100,
        costUsd: 0.06,
      }],
    }]);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes badge name and model label", () => {
    const html = generateReport([{
      badge: sampleBadge,
      results: [{
        modelId: "gpt-image-2",
        label: "GPT Image 2",
        imageBuffer: Buffer.from("fake"),
        timingMs: 6100,
        costUsd: 0.06,
      }],
    }]);
    expect(html).toContain("Unbroken");
    expect(html).toContain("GPT Image 2");
  });

  it("formats timing and USD cost correctly", () => {
    const html = generateReport([{
      badge: sampleBadge,
      results: [{
        modelId: "gpt-image-2",
        label: "GPT Image 2",
        imageBuffer: Buffer.from("fake"),
        timingMs: 6100,
        costUsd: 0.06,
      }],
    }]);
    expect(html).toContain("6.1s");
    expect(html).toContain("$0.06");
  });

  it("shows ~compute for Replicate models (null costUsd)", () => {
    const html = generateReport([{
      badge: sampleBadge,
      results: [{
        modelId: "flux-2-max",
        label: "FLUX.2 Max",
        imageBuffer: Buffer.from("fake"),
        timingMs: 4300,
        costUsd: null,
      }],
    }]);
    expect(html).toContain("~compute");
  });

  it("shows error message and no img tag when imageBuffer is null", () => {
    const html = generateReport([{
      badge: sampleBadge,
      results: [{
        modelId: "gpt-image-2",
        label: "GPT Image 2",
        imageBuffer: null,
        timingMs: 500,
        costUsd: null,
        error: "Invalid API key",
      }],
    }]);
    expect(html).toContain("Invalid API key");
    expect(html).not.toContain("<img");
  });

  it("includes contenteditable notes with correct data attributes", () => {
    const html = generateReport([{
      badge: sampleBadge,
      results: [{
        modelId: "gpt-image-2",
        label: "GPT Image 2",
        imageBuffer: Buffer.from("fake"),
        timingMs: 1000,
        costUsd: 0.06,
      }],
    }]);
    expect(html).toContain('contenteditable="true"');
    expect(html).toContain('data-model="gpt-image-2"');
    expect(html).toContain('data-badge="consistency-30"');
  });

  it("includes the Export ratings button and clipboard script", () => {
    const html = generateReport([{ badge: sampleBadge, results: [] }]);
    expect(html).toContain("Export ratings");
    expect(html).toContain("exportRatings");
    expect(html).toContain("navigator.clipboard");
  });
});
