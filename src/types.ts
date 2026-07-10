export interface BadgeSpec {
  id: string;
  category:
    | "consistency"
    | "strength"
    | "endurance"
    | "recovery"
    | "nutrition"
    | "community"
    | "journey";
  name: string;
  achievement: string;
  heroSymbol: string;
  environment: string;
  metaphor: string;
  accentPalette: string;
  emotion: string;
  rarity: "bronze" | "silver" | "gold" | "platinum" | "mythic";
}

export interface ModelConfig {
  id: string;
  label: string;
  provider: "openai" | "replicate";
  replicateModel?: string;
  extraInput?: Record<string, unknown>;
  enabled: boolean;
}

export interface GenerationResult {
  modelId: string;
  label: string;
  imageBuffer: Buffer | null;
  timingMs: number;
  costUsd: number | null;
  error?: string;
}
