import { getLanguageHint, type LanguageHint } from "./recipe-extraction";

export const MAX_AI_INPUT_CHARACTERS = 12000;

const sectionHeadingAliases = [
  "ingredients",
  "ingredient list",
  "instructions",
  "directions",
  "method",
  "preparation",
  "notes",
  "tips",
  "comments",
  "source",
  "link",
  "url",
];

export type PreprocessedRecipeImportText = {
  normalizedText: string;
  cleanedText: string;
  aiInputText: string;
  detectedUrls: string[];
  detectedSourceUrl: string;
  languageHint: LanguageHint;
  sectionHints: string[];
  removedLineCount: number;
  inputCharacterLimit: number;
  wasTruncated: boolean;
};

export function preprocessRecipeImportText(
  pastedText: string,
  maxCharacters = MAX_AI_INPUT_CHARACTERS,
): PreprocessedRecipeImportText {
  const normalizedText = normalizeWhitespace(pastedText);
  const normalizedLines = normalizedText.split("\n").map((line) => line.trim());
  const detectedUrls = uniqueStrings(extractUrls(normalizedText).map(cleanUrl));
  const sectionHints = uniqueStrings(
    normalizedLines.filter(isLikelySectionHeading).map((line) => line.toLowerCase()),
  );
  const cleanedLines = normalizedLines
    .map((line) => removeUrls(line).trim())
    .filter((line) => shouldKeepLine(line));
  const cleanedText = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const aiInputText = cleanedText.slice(0, maxCharacters);

  return {
    normalizedText,
    cleanedText,
    aiInputText,
    detectedUrls,
    detectedSourceUrl: detectedUrls[0] ?? "",
    languageHint: getLanguageHint(normalizedText),
    sectionHints,
    removedLineCount: normalizedLines.length - cleanedLines.length,
    inputCharacterLimit: maxCharacters,
    wasTruncated: cleanedText.length > maxCharacters,
  };
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

function shouldKeepLine(line: string) {
  if (!line) {
    return false;
  }

  if (isHashtagOnlyLine(line)) {
    return false;
  }

  if (isDecorativeOnlyLine(line)) {
    return false;
  }

  if (isSocialCallToAction(line)) {
    return false;
  }

  if (isIrrelevantMetadataLine(line)) {
    return false;
  }

  return true;
}

function isHashtagOnlyLine(line: string) {
  const tags = line.match(/#[\p{L}\p{N}_-]+/gu);

  if (!tags || tags.length === 0) {
    return false;
  }

  const remaining = line.replace(/#[\p{L}\p{N}_-]+/gu, "").trim();

  return remaining === "";
}

function isDecorativeOnlyLine(line: string) {
  const withoutEmoji = line.replace(
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
    "",
  );
  const withoutSymbols = withoutEmoji.replace(/[\p{S}\p{P}\s]/gu, "").trim();

  return withoutSymbols === "";
}

function isSocialCallToAction(line: string) {
  const normalizedLine = line.toLowerCase();
  const ctaPatterns = [
    /\bfollow\b/,
    /\bshare\b/,
    /\bsave\b/,
    /\blike\b/,
    /\bsubscribe\b/,
    /\bcomment below\b/,
    /\btag a friend\b/,
  ];

  return (
    ctaPatterns.some((pattern) => pattern.test(normalizedLine)) &&
    !hasRecipeContentSignal(normalizedLine)
  );
}

function isIrrelevantMetadataLine(line: string) {
  const normalizedLine = line.toLowerCase();
  const metadataPatterns = [
    /^ad$/,
    /^advertisement$/,
    /^sponsored$/,
    /\bpaid partnership\b/,
    /\baffiliate link\b/,
    /^rating\s*[:\-]/,
    /^\d+(\.\d+)?\s*(\/\s*5|stars?)$/,
    /^posted by\b/,
    /^comments?\s*[:\-]?\s*\d+$/,
  ];

  return metadataPatterns.some((pattern) => pattern.test(normalizedLine));
}

function isLikelySectionHeading(line: string) {
  const normalizedLine = line.toLowerCase().replace(/[:\-\s]+$/g, "").trim();

  return sectionHeadingAliases.includes(normalizedLine);
}

function hasRecipeContentSignal(line: string) {
  return /(\d|cup|tbsp|tsp|gram|grams|kg|ml|oz|bake|boil|chop|cook|heat|mix|roast|serve|slice|stir|min|minutes)/.test(
    line,
  );
}

function extractUrls(text: string) {
  return text.match(/https?:\/\/[^\s)]+/g) ?? [];
}

function removeUrls(text: string) {
  return text.replace(/https?:\/\/[^\s)]+/g, "").trim();
}

function cleanUrl(value: string) {
  const trimmedValue = value.replace(/[.,;!?]+$/g, "");

  try {
    const url = new URL(trimmedValue);
    const trackingParams = [
      "fbclid",
      "gclid",
      "igshid",
      "mc_cid",
      "mc_eid",
      "utm_campaign",
      "utm_content",
      "utm_medium",
      "utm_source",
      "utm_term",
    ];

    trackingParams.forEach((param) => url.searchParams.delete(param));

    return url.toString();
  } catch {
    return trimmedValue;
  }
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
