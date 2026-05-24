export type TextDirection = "ltr" | "rtl";

const hebrewTextPattern = /[\u0590-\u05FF\uFB1D-\uFB4F]/g;
const latinTextPattern = /[A-Za-z]/g;

export function getTextDirection(text: string | undefined | null): TextDirection {
  if (!text?.trim()) {
    return "ltr";
  }

  const hebrewCharacters = text.match(hebrewTextPattern)?.length ?? 0;
  const latinCharacters = text.match(latinTextPattern)?.length ?? 0;

  return hebrewCharacters > latinCharacters ? "rtl" : "ltr";
}
