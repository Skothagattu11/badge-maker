import { describe, it, expect } from "vitest";
import { buildPrompt } from "../prompt-builder.js";
import type { BadgeSpec } from "../types.js";

const sample: BadgeSpec = {
  id: "consistency-30",
  category: "consistency",
  name: "Unbroken",
  achievement: "Complete planned tasks for 30 consecutive days",
  heroSymbol: "lone figure planting a flag at a mountain summit",
  environment: "layered mountain ridges beneath a rising golden sun",
  metaphor: "repeated small actions leading toward a meaningful summit",
  accentPalette: "warm amber and muted sage green",
  emotion: "discipline, quiet confidence and momentum",
  rarity: "gold",
};

describe("buildPrompt", () => {
  it("includes Entropy brand palette hex codes", () => {
    const prompt = buildPrompt(sample);
    expect(prompt).toContain("#091640");
    expect(prompt).toContain("#D6A74F");
  });

  it("includes the core style description", () => {
    const prompt = buildPrompt(sample);
    expect(prompt).toContain("premium digital achievement badge");
    expect(prompt).toContain("cinematic three-dimensional collectible medallion");
  });

  it("includes the no-typography instruction", () => {
    const prompt = buildPrompt(sample);
    expect(prompt).toContain("No visible words");
  });

  it("embeds the badge achievement", () => {
    const prompt = buildPrompt(sample);
    expect(prompt).toContain("Complete planned tasks for 30 consecutive days");
  });

  it("embeds the hero symbol", () => {
    const prompt = buildPrompt(sample);
    expect(prompt).toContain("lone figure planting a flag at a mountain summit");
  });

  it("embeds the accent palette", () => {
    const prompt = buildPrompt(sample);
    expect(prompt).toContain("warm amber and muted sage green");
  });

  it("capitalises the rarity tier label", () => {
    const prompt = buildPrompt(sample);
    expect(prompt).toContain("Gold tier");
  });
});
