import type { IngredientSection, InstructionSection } from "./recipe-types";

export function makeSectionId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function cleanIngredientSections(sections: IngredientSection[] = []) {
  return sections
    .map((section) => ({
      id: section.id || makeSectionId("ingredient-section"),
      title: section.title.trim() || "Section",
      itemsText: section.itemsText.trim(),
    }))
    .filter((section) => section.itemsText);
}

export function cleanInstructionSections(sections: InstructionSection[] = []) {
  return sections
    .map((section) => ({
      id: section.id || makeSectionId("instruction-section"),
      title: section.title.trim() || "Section",
      stepsText: section.stepsText.trim(),
    }))
    .filter((section) => section.stepsText);
}

export function ingredientSectionsToText(sections: IngredientSection[] = []) {
  return cleanIngredientSections(sections)
    .map((section) => `${section.title}\n${section.itemsText}`)
    .join("\n\n")
    .trim();
}

export function instructionSectionsToText(sections: InstructionSection[] = []) {
  return cleanInstructionSections(sections)
    .map((section) => `${section.title}\n${section.stepsText}`)
    .join("\n\n")
    .trim();
}
