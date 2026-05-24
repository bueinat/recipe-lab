import type { RecipeFormValues } from "./recipe-types";

export const LOCAL_AI_CONFIDENCE_THRESHOLD = 0.65;

export type LanguageHint = "he" | "en" | "mixed" | "unknown";

export type ExtractionConfidence = {
  overall: number;
  title: number;
  ingredients: number;
  instructions: number;
  notes: number;
};

export type RecipeExtractionSource = "local" | "ai";

export type RecipeExtractionResult = {
  recipe: RecipeFormValues;
  source: RecipeExtractionSource;
  confidence: ExtractionConfidence;
  warnings: string[];
  languageHint: LanguageHint;
  model?: string;
};

export type AiRecipeExtraction = {
  title: string;
  ingredients: string[];
  instructions: string[];
  notes: string;
  servings: number | null;
  tags: string[];
  languageHint: LanguageHint;
  confidence: ExtractionConfidence;
  warnings: string[];
};

export const AI_RECIPE_EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "ingredients",
    "instructions",
    "notes",
    "servings",
    "tags",
    "languageHint",
    "confidence",
    "warnings",
  ],
  properties: {
    title: { type: "string" },
    ingredients: {
      type: "array",
      items: { type: "string" },
    },
    instructions: {
      type: "array",
      items: { type: "string" },
    },
    notes: { type: "string" },
    servings: {
      anyOf: [{ type: "number" }, { type: "null" }],
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    languageHint: {
      type: "string",
      enum: ["he", "en", "mixed", "unknown"],
    },
    confidence: {
      type: "object",
      additionalProperties: false,
      required: ["overall", "title", "ingredients", "instructions", "notes"],
      properties: {
        overall: { type: "number" },
        title: { type: "number" },
        ingredients: { type: "number" },
        instructions: { type: "number" },
        notes: { type: "number" },
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

export function clampScore(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function getLanguageHint(text: string): LanguageHint {
  const hebrewCharacters = text.match(/[\u0590-\u05ff]/g)?.length ?? 0;
  const latinCharacters = text.match(/[A-Za-z]/g)?.length ?? 0;

  if (hebrewCharacters === 0 && latinCharacters === 0) {
    return "unknown";
  }

  if (hebrewCharacters > 0 && latinCharacters > 0) {
    const largerCount = Math.max(hebrewCharacters, latinCharacters);
    const smallerCount = Math.min(hebrewCharacters, latinCharacters);

    return smallerCount / largerCount > 0.25
      ? "mixed"
      : hebrewCharacters > latinCharacters
        ? "he"
        : "en";
  }

  return hebrewCharacters > latinCharacters ? "he" : "en";
}

export function hasImportantMissingFields(recipe: RecipeFormValues) {
  return (
    !recipe.title.trim() ||
    recipe.title === "Untitled imported recipe" ||
    !recipe.ingredients.trim() ||
    !recipe.instructions.trim()
  );
}

export function shouldOfferAiExtraction(result: RecipeExtractionResult) {
  if (result.source !== "local") {
    return false;
  }

  return (
    result.confidence.overall < LOCAL_AI_CONFIDENCE_THRESHOLD ||
    hasImportantMissingFields(result.recipe)
  );
}

export function mergeAiExtractionWithLocal({
  aiExtraction,
  imageUrl,
  localRecipe,
  sourceUrl,
}: {
  aiExtraction: AiRecipeExtraction;
  imageUrl: string;
  localRecipe: RecipeFormValues;
  sourceUrl: string;
}): RecipeFormValues {
  const ingredients = aiExtraction.ingredients.join("\n").trim();
  const instructions = aiExtraction.instructions.join("\n").trim();
  const tags = uniqueStrings([...localRecipe.tags, ...aiExtraction.tags, "imported"]);

  return {
    ...localRecipe,
    title: aiExtraction.title || localRecipe.title,
    imageUrl: imageUrl.trim() || localRecipe.imageUrl,
    servings: aiExtraction.servings ?? localRecipe.servings,
    ingredients: ingredients || localRecipe.ingredients,
    instructions: instructions || localRecipe.instructions,
    notes: aiExtraction.notes || localRecipe.notes,
    tags,
    sourceUrl: sourceUrl.trim() || localRecipe.sourceUrl,
  };
}

export function sanitizeAiRecipeExtraction(value: unknown): AiRecipeExtraction {
  const record = isRecord(value) ? value : {};
  const confidence = sanitizeConfidence(record.confidence);
  const title = sanitizeText(record.title);
  const ingredients = sanitizeStringArray(record.ingredients);
  const instructions = sanitizeStringArray(record.instructions);
  const notes = sanitizeText(record.notes);
  const tags = uniqueStrings(sanitizeStringArray(record.tags)).slice(0, 8);
  const warnings = sanitizeStringArray(record.warnings);

  if (!title) {
    warnings.push("AI did not find a clear title.");
  }

  if (ingredients.length === 0) {
    warnings.push("AI did not find clear ingredients.");
  }

  if (instructions.length === 0) {
    warnings.push("AI did not find clear instructions.");
  }

  return {
    title,
    ingredients,
    instructions,
    notes,
    servings: sanitizeServings(record.servings),
    tags,
    languageHint: sanitizeLanguageHint(record.languageHint),
    confidence,
    warnings: uniqueStrings(warnings).slice(0, 10),
  };
}

function sanitizeConfidence(value: unknown): ExtractionConfidence {
  if (typeof value === "number") {
    const score = clampScore(value);

    return {
      overall: score,
      title: score,
      ingredients: score,
      instructions: score,
      notes: score,
    };
  }

  const record = isRecord(value) ? value : {};

  return {
    overall: sanitizeScore(record.overall),
    title: sanitizeScore(record.title),
    ingredients: sanitizeScore(record.ingredients),
    instructions: sanitizeScore(record.instructions),
    notes: sanitizeScore(record.notes),
  };
}

function sanitizeScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? clampScore(value) : 0;
}

function sanitizeLanguageHint(value: unknown): LanguageHint {
  return value === "he" || value === "en" || value === "mixed" || value === "unknown"
    ? value
    : "unknown";
}

function sanitizeServings(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.max(1, Math.round(value));
}

function sanitizeStringArray(value: unknown) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|,/)
      : [];

  return values
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, 80);
}

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalizedValue = value.trim();
    const key = normalizedValue.toLowerCase();

    if (!normalizedValue || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
