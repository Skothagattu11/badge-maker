import type { BadgeSpec } from "./types.js";

const MASTER_PROMPT = `Create one premium digital achievement badge for a high-end health and lifestyle application.

VISUAL SYSTEM:
A cinematic three-dimensional collectible medallion, front-facing and symmetrical, with a sculpted circular frame. The outer frame is made from brushed antique gold and dark oxidized bronze. The inner badge uses carved charcoal stone and deep navy enamel. It should feel like a luxury physical artifact translated into a digital collectible.

COMPOSITION:
One dominant centered hero symbol inside a recessed illustrated world. Strong readable silhouette. Layered foreground, middle ground and background. The badge occupies approximately 85 percent of the square canvas. Straight-on view with no dramatic camera tilt.

LIGHTING:
Warm golden backlight behind the central symbol, narrow metallic rim light, cool dark navy ambient shadows, restrained particles and subtle volumetric light. High contrast but with readable shadow detail.

CRAFT:
Fine engraving, embossed edges, subtle topographic contour patterns, realistic metal and stone texture, polished highlights, physically convincing depth. Detailed but not visually cluttered.

BRAND PALETTE:
Midnight navy #091640, deep navy #0D1E3D, elevated navy #0F2356, antique gold #D6A74F, pale gold #F3D890, charcoal stone and a small amount of category-specific accent color.

STYLE:
Premium cinematic fantasy realism, sophisticated health achievement system, high-end collectible medal, restrained and modern. Not childish, not cartoon, not a generic mobile-game icon.

OUTPUT:
One isolated badge on a plain dark background. No mockup, no phone, no hand, no interface, no additional objects outside the badge. No visible words, letters, numbers, logos or typography.`;

export function buildPrompt(badge: BadgeSpec): string {
  const rarity = badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1);

  const variable = `
BADGE:
Category: ${badge.category}
Achievement: ${badge.achievement}

CENTRAL STORY:
A ${badge.environment}. At the center stands ${badge.heroSymbol}. The scene captures the metaphor of ${badge.metaphor}.

CATEGORY ACCENT:
${badge.accentPalette}.

EMOTION:
${badge.emotion}.

RARITY:
${rarity} tier. Valuable and refined, frame ornamentation appropriate to ${badge.rarity} tier.`;

  return `${MASTER_PROMPT}\n\n${variable}`;
}
