import type { RecipeFormValues } from "./recipe-types";
import {
  ingredientSectionsToText,
  instructionSectionsToText,
  makeSectionId,
} from "./recipe-sections";

export type LanguageHint = "he" | "en" | "mixed" | "unknown";

export type ExtractionConfidence = {
  overall: number;
  title: number;
  ingredients: number;
  instructions: number;
  notes: number;
};

export type RecipeExtractionResult = {
  recipe: RecipeFormValues;
  source: "ai";
  confidence: ExtractionConfidence;
  warnings: string[];
  languageHint: LanguageHint;
  model?: string;
};

export type AiRecipeExtraction = {
  title: string;
  ingredients: string[];
  instructions: string[];
  ingredientSections: {
    title: string;
    items: string[];
  }[];
  instructionSections: {
    title: string;
    steps: string[];
  }[];
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
    "ingredientSections",
    "instructionSections",
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
    ingredientSections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "items"],
        properties: {
          title: { type: "string" },
          items: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    instructionSections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "steps"],
        properties: {
          title: { type: "string" },
          steps: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
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

export function createRecipeFromAiExtraction({
  aiExtraction,
  detectedSourceUrl,
  imageUrl,
  sourceUrl,
}: {
  aiExtraction: AiRecipeExtraction;
  detectedSourceUrl: string;
  imageUrl: string;
  sourceUrl: string;
}): RecipeFormValues {
  const ingredientSections = aiExtraction.ingredientSections.map(
    (section, index) => ({
      id: makeSectionId(`ingredient-section-${index + 1}`),
      title: section.title,
      itemsText: section.items.join("\n").trim(),
    }),
  );
  const instructionSections = aiExtraction.instructionSections.map(
    (section, index) => ({
      id: makeSectionId(`instruction-section-${index + 1}`),
      title: section.title,
      stepsText: section.steps.join("\n").trim(),
    }),
  );
  const ingredients =
    ingredientSectionsToText(ingredientSections) ||
    aiExtraction.ingredients.join("\n").trim();
  const instructions =
    instructionSectionsToText(instructionSections) ||
    aiExtraction.instructions.join("\n").trim();

  return {
    title: aiExtraction.title || "Untitled imported recipe",
    imageUrl: imageUrl.trim() || undefined,
    servings: aiExtraction.servings ?? 1,
    ingredients,
    instructions,
    ingredientSections,
    instructionSections,
    notes: aiExtraction.notes,
    tags: uniqueStrings([...aiExtraction.tags, "imported"]),
    sourceUrl: sourceUrl.trim() || detectedSourceUrl,
    status: "Idea",
    rating: 0,
    cookingLogs: [],
    versions: [],
  };
}

export function sanitizeAiRecipeExtraction(value: unknown): AiRecipeExtraction {
  const record = isRecord(value) ? value : {};
  const confidence = sanitizeConfidence(record.confidence);
  const title = sanitizeText(record.title);
  const ingredients = sanitizeStringArray(record.ingredients);
  const instructions = sanitizeStringArray(record.instructions);
  const ingredientSections = sanitizeAiIngredientSections(record.ingredientSections);
  const instructionSections = sanitizeAiInstructionSections(
    record.instructionSections,
  );
  const notes = sanitizeText(record.notes);
  const tags = uniqueStrings(sanitizeStringArray(record.tags)).slice(0, 8);
  const warnings = sanitizeStringArray(record.warnings);

  if (!title) {
    warnings.push("AI did not find a clear title.");
  }

  if (ingredients.length === 0 && ingredientSections.length === 0) {
    warnings.push("AI did not find clear ingredients.");
  }

  if (instructions.length === 0 && instructionSections.length === 0) {
    warnings.push("AI did not find clear instructions.");
  }

  return {
    title,
    ingredients,
    instructions,
    ingredientSections,
    instructionSections,
    notes,
    servings: sanitizeServings(record.servings),
    tags,
    languageHint: sanitizeLanguageHint(record.languageHint),
    confidence,
    warnings: uniqueStrings(warnings).slice(0, 10),
  };
}

function sanitizeAiIngredientSections(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = isRecord(item) ? item : {};

      return {
        title: sanitizeText(record.title) || "Section",
        items: sanitizeStringArray(record.items),
      };
    })
    .filter((section) => section.items.length > 0)
    .slice(0, 20);
}

function sanitizeAiInstructionSections(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = isRecord(item) ? item : {};

      return {
        title: sanitizeText(record.title) || "Section",
        steps: sanitizeStringArray(record.steps),
      };
    })
    .filter((section) => section.steps.length > 0)
    .slice(0, 20);
}

function sanitizeConfidence(value: unknown): ExtractionConfidence {
  if (typeof value === "number") {
    const score = sanitizeScore(value);

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
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, Number(value.toFixed(2))))
    : 0;
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
