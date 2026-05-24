"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipes } from "@/components/recipe-provider";
import type { RecipeFormValues } from "@/lib/recipe-types";
import { getTextDirection } from "@/lib/text-direction";

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

function mockExtractRecipeFromText({
  imageUrl,
  pastedText,
  sourceUrl,
}: {
  imageUrl: string;
  pastedText: string;
  sourceUrl: string;
}): RecipeFormValues {
  const lines = pastedText.split("\n").map((line) => line.trim());
  const firstNonEmptyLine = lines.find(Boolean);
  const titleLine =
    firstNonEmptyLine && !getSectionForLine(firstNonEmptyLine)
      ? firstNonEmptyLine
      : undefined;
  const sections: Record<ImportSection, string[]> = {
    ingredients: [],
    instructions: [],
    notes: [],
    source: [],
  };
  let currentSection: ImportSection | null = null;
  let foundSectionHeading = false;

  lines.forEach((line) => {
    if (!line) {
      return;
    }

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

  const pastedUrl = findFirstUrl(pastedText);
  const sourceSectionUrl = findFirstUrl(sections.source.join("\n"));

  return {
    title: titleLine || "Untitled imported recipe",
    imageUrl: imageUrl.trim(),
    servings: 1,
    ingredients: foundSectionHeading
      ? sections.ingredients.join("\n")
      : pastedText.trim(),
    instructions: foundSectionHeading ? sections.instructions.join("\n") : "",
    notes: sections.notes.join("\n"),
    tags: ["imported"],
    sourceUrl: sourceUrl.trim() || sourceSectionUrl || pastedUrl,
    status: "Idea",
    rating: 0,
    cookingLogs: [],
    versions: [],
  };
}

export default function ImportRecipePage() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const [pastedText, setPastedText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [draftRecipe, setDraftRecipe] = useState<RecipeFormValues | null>(null);

  function handleExtractDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setDraftRecipe(
      mockExtractRecipeFromText({
        imageUrl,
        pastedText,
        sourceUrl,
      }),
    );
  }

  function handleSaveRecipe(recipe: RecipeFormValues) {
    const newRecipe = addRecipe(recipe);
    router.push(`/recipes/${newRecipe.id}`);
  }

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <Link href="/" className="text-sm font-bold text-herb hover:text-green-800">
          ← Back to recipes
        </Link>
        <div className="mb-8 mt-6">
          <p className="font-semibold text-tomato">Import from Text</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
            Paste, review, then save
          </h1>
          <p className="mt-3 text-stone-600">
            This is ready for future AI extraction, but today it uses a simple
            mock extractor so you can review and edit every field before saving.
          </p>
        </div>

        {!draftRecipe ? (
          <form onSubmit={handleExtractDraft} className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-stone-700">
                Recipe text
              </span>
              <textarea
                required
                dir={getTextDirection(pastedText)}
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
                rows={12}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                placeholder="Paste Instagram, Facebook, website, ingredients, notes, or recipe text here."
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-stone-700">
                  Source URL (optional)
                </span>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                  placeholder="https://example.com/recipe"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-stone-700">
                  Image URL (optional)
                </span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                  placeholder="https://example.com/photo.jpg"
                />
              </label>
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-herb px-5 py-3 font-bold text-white shadow-sm transition hover:bg-green-800"
            >
              Extract draft
            </button>
          </form>
        ) : (
          <div className="grid gap-6">
            <div className="rounded-2xl bg-orange-50 p-4 text-sm text-stone-700">
              <p className="font-bold text-stone-950">Review extracted draft</p>
              <p className="mt-2">
                The mock extractor looked for common recipe headings and filled
                the draft below. Edit anything before saving.
              </p>
            </div>
            <RecipeForm
              key={draftRecipe.title}
              buttonLabel="Save imported recipe"
              initialValues={draftRecipe}
              onSubmit={handleSaveRecipe}
            />
            <button
              type="button"
              onClick={() => setDraftRecipe(null)}
              className="rounded-2xl bg-stone-100 px-5 py-3 font-bold text-stone-700 transition hover:bg-stone-200"
            >
              Back to pasted text
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
