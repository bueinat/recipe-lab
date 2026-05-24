import {
  clampScore,
  getLanguageHint,
  type LanguageHint,
  type RecipeExtractionResult,
} from "./recipe-extraction";
import type { RecipeFormValues } from "./recipe-types";

const sectionHeadings = {
  ingredients: ["ingredients", "ingredient list", "מצרכים", "רכיבים"],
  instructions: [
    "instructions",
    "directions",
    "method",
    "preparation",
    "הוראות",
    "אופן הכנה",
    "הכנה",
  ],
  notes: ["notes", "tips", "comments", "הערות", "טיפים"],
  source: ["source", "link", "url", "מקור", "קישור"],
} as const;

type ImportSection = keyof typeof sectionHeadings;

export type { ExtractionConfidence } from "./recipe-extraction";

export type LocalRecipeExtractionResult = {
  source: "local";
} & RecipeExtractionResult;

export type PreprocessedRecipeText = {
  normalizedText: string;
  cleanedLines: string[];
  cleanedText: string;
  languageHint: LanguageHint;
};

function normalizeHeading(line: string) {
  return line.trim().toLowerCase().replace(/[:：-]+$/, "").trim();
}

function getSectionForLine(line: string): ImportSection | null {
  const normalizedLine = normalizeHeading(line);

  for (const [section, headings] of Object.entries(sectionHeadings)) {
    if ((headings as readonly string[]).includes(normalizedLine)) {
      return section as ImportSection;
    }
  }

  return null;
}

function findFirstUrl(text: string) {
  return text.match(/https?:\/\/\S+/)?.[0] ?? "";
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isHashtagOnlyLine(line: string) {
  const tags = line.match(/#[\p{L}\p{N}_-]+/gu);

  if (!tags || tags.length === 0) {
    return false;
  }

  const remaining = line.replace(/#[\p{L}\p{N}_-]+/gu, "").trim();

  return remaining === "";
}

function isDecorativeLine(line: string) {
  const cleaned = line
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/[\p{S}\p{P}\s]/gu, "")
    .trim();

  return cleaned === "";
}

function isSocialCallToAction(line: string) {
  const normalizedLine = line.toLowerCase();
  const ctaPatterns = [
    /\bfollow\b/,
    /\bshare\b/,
    /\bsave\b/,
    /\blike\b/,
    /לשמור/,
    /שתפו/,
    /עקבו/,
    /לייק/,
  ];

  return ctaPatterns.some((pattern) => pattern.test(normalizedLine));
}

function removeSocialNoise(lines: string[]) {
  return lines.filter((line) => {
    if (!line) {
      return false;
    }

    if (isHashtagOnlyLine(line)) {
      return false;
    }

    if (isDecorativeLine(line)) {
      return false;
    }

    if (isSocialCallToAction(line)) {
      return false;
    }

    return true;
  });
}

export function preprocessRecipeText(pastedText: string): PreprocessedRecipeText {
  const normalizedText = normalizeWhitespace(pastedText);
  const normalizedLines = normalizedText.split("\n").map((line) => line.trim());
  const cleanedLines = removeSocialNoise(normalizedLines);

  return {
    normalizedText,
    cleanedLines,
    cleanedText: cleanedLines.join("\n").trim(),
    languageHint: getLanguageHint(normalizedText),
  };
}

export function extractRecipeFromTextLocally({
  imageUrl,
  pastedText,
  sourceUrl,
}: {
  imageUrl: string;
  pastedText: string;
  sourceUrl: string;
}): LocalRecipeExtractionResult {
  const { cleanedLines, languageHint, normalizedText } =
    preprocessRecipeText(pastedText);

  const firstNonHeadingLine = cleanedLines.find(
    (line) => Boolean(line) && !getSectionForLine(line),
  );

  const sections: Record<ImportSection, string[]> = {
    ingredients: [],
    instructions: [],
    notes: [],
    source: [],
  };

  let currentSection: ImportSection | null = null;
  let foundSectionHeading = false;

  cleanedLines.forEach((line) => {
    const nextSection = getSectionForLine(line);

    if (nextSection) {
      currentSection = nextSection;
      foundSectionHeading = true;
      return;
    }

    if (currentSection) {
      sections[currentSection].push(line);
    }
  });

  const pastedUrl = findFirstUrl(normalizedText);
  const sourceSectionUrl = findFirstUrl(sections.source.join("\n"));
  const resolvedSourceUrl = sourceUrl.trim() || sourceSectionUrl || pastedUrl;

  const title = firstNonHeadingLine || "Untitled imported recipe";
  const ingredients = foundSectionHeading
    ? sections.ingredients.join("\n").trim()
    : cleanedLines.join("\n").trim();
  const instructions = foundSectionHeading
    ? sections.instructions.join("\n").trim()
    : "";
  const notes = sections.notes.join("\n").trim();

  const recipe: RecipeFormValues = {
    title,
    imageUrl: imageUrl.trim(),
    servings: 1,
    ingredients,
    instructions,
    notes,
    tags: ["imported"],
    sourceUrl: resolvedSourceUrl,
    status: "Idea",
    rating: 0,
    cookingLogs: [],
    versions: [],
  };

  const titleScore = title !== "Untitled imported recipe" ? 0.9 : 0.3;
  const ingredientsScore = ingredients ? (foundSectionHeading ? 0.95 : 0.7) : 0.1;
  const instructionsScore = instructions ? (foundSectionHeading ? 0.95 : 0.2) : 0.15;
  const notesScore = notes ? 0.85 : 0.4;
  const overallScore = clampScore(
    titleScore * 0.2 +
      ingredientsScore * 0.35 +
      instructionsScore * 0.35 +
      notesScore * 0.1,
  );

  const warnings: string[] = [];

  if (!foundSectionHeading) {
    warnings.push(
      "No section headings were found. Ingredients were filled from the cleaned text as a safe fallback.",
    );
  }

  if (!instructions) {
    warnings.push("Instructions may be missing. Please review and add cooking steps.");
  }

  if (!resolvedSourceUrl) {
    warnings.push("No source URL was detected. Add one manually if needed.");
  }

  if (title === "Untitled imported recipe") {
    warnings.push("A clear recipe title was not detected. Please update the title.");
  }

  if (!notes) {
    warnings.push("No notes section was detected.");
  }

  return {
    recipe,
    source: "local",
    confidence: {
      overall: overallScore,
      title: clampScore(titleScore),
      ingredients: clampScore(ingredientsScore),
      instructions: clampScore(instructionsScore),
      notes: clampScore(notesScore),
    },
    languageHint,
    warnings,
  };
}
