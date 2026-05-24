"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipes } from "@/components/recipe-provider";
import {
  extractRecipeFromTextLocally,
  type LocalRecipeExtractionResult,
} from "@/lib/local-recipe-extraction";
import {
  mergeAiExtractionWithLocal,
  shouldOfferAiExtraction,
  type AiRecipeExtraction,
  type RecipeExtractionResult,
} from "@/lib/recipe-extraction";
import type { RecipeFormValues } from "@/lib/recipe-types";
import { getTextDirection } from "@/lib/text-direction";

type AiExtractResponse = {
  extraction?: AiRecipeExtraction;
  error?: string;
  model?: string;
};

export default function ImportRecipePage() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const [pastedText, setPastedText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [draftRecipe, setDraftRecipe] = useState<RecipeFormValues | null>(null);
  const [draftRevision, setDraftRevision] = useState(0);
  const [localExtractionResult, setLocalExtractionResult] =
    useState<LocalRecipeExtractionResult | null>(null);
  const [extractionResult, setExtractionResult] =
    useState<RecipeExtractionResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const canUseAiExtraction = localExtractionResult
    ? shouldOfferAiExtraction(localExtractionResult) &&
      extractionResult?.source === "local"
    : false;

  function handleExtractDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const localExtraction = extractRecipeFromTextLocally({
      imageUrl,
      pastedText,
      sourceUrl,
    });

    setAiError("");
    setLocalExtractionResult(localExtraction);
    setExtractionResult(localExtraction);
    setDraftRecipe(localExtraction.recipe);
    setDraftRevision((currentRevision) => currentRevision + 1);
  }

  async function handleAiExtract() {
    if (!localExtractionResult) {
      return;
    }

    setIsAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/recipes/ai-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pastedText,
        }),
      });
      const responseBody = (await response.json()) as AiExtractResponse;

      if (!response.ok || !responseBody.extraction) {
        throw new Error(responseBody.error || "AI extraction failed. Try again later.");
      }

      const recipe = mergeAiExtractionWithLocal({
        aiExtraction: responseBody.extraction,
        imageUrl,
        localRecipe: localExtractionResult.recipe,
        sourceUrl,
      });

      setDraftRecipe(recipe);
      setExtractionResult({
        recipe,
        source: "ai",
        confidence: responseBody.extraction.confidence,
        warnings: responseBody.extraction.warnings,
        languageHint: responseBody.extraction.languageHint,
        model: responseBody.model,
      });
      setDraftRevision((currentRevision) => currentRevision + 1);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "AI extraction failed. Keep using the local draft or try again.",
      );
    } finally {
      setIsAiLoading(false);
    }
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
            Local extraction runs first. AI is optional and only offered when the
            local draft looks incomplete.
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
                {extractionResult?.source === "ai"
                  ? "AI extraction updated the draft below. Review and edit anything before saving."
                  : "Local extraction prepared the draft below. Review and edit anything before saving."}
              </p>
              {extractionResult ? (
                <div className="mt-4 grid gap-3 rounded-xl bg-white p-3 ring-1 ring-orange-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Extraction source: {extractionResult.source}
                    {extractionResult.model ? ` (${extractionResult.model})` : ""}
                  </p>
                  <p className="text-xs text-stone-600">
                    Confidence - overall: {Math.round(extractionResult.confidence.overall * 100)}%, title: {Math.round(extractionResult.confidence.title * 100)}%, ingredients: {Math.round(extractionResult.confidence.ingredients * 100)}%, instructions: {Math.round(extractionResult.confidence.instructions * 100)}%, notes: {Math.round(extractionResult.confidence.notes * 100)}%
                  </p>
                  <p className="text-xs text-stone-600">
                    Language hint: {extractionResult.languageHint}
                  </p>
                  {extractionResult.warnings.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-xs text-stone-600">
                      {extractionResult.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-600">No extraction warnings.</p>
                  )}
                </div>
              ) : null}
              {canUseAiExtraction ? (
                <div className="mt-4 grid gap-3 rounded-xl bg-white p-3 ring-1 ring-orange-100">
                  <p className="text-xs text-stone-600">
                    The local draft is low-confidence or missing important fields.
                    AI can try one server-side extraction using the cleaned text.
                  </p>
                  <button
                    type="button"
                    onClick={handleAiExtract}
                    disabled={isAiLoading}
                    className="w-fit rounded-2xl bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                  >
                    {isAiLoading ? "Extracting with AI..." : "AI Extract"}
                  </button>
                </div>
              ) : null}
              {aiError ? (
                <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
                  {aiError}
                </p>
              ) : null}
            </div>
            <RecipeForm
              key={`${extractionResult?.source ?? "draft"}-${draftRevision}`}
              buttonLabel="Save imported recipe"
              initialValues={draftRecipe}
              onSubmit={handleSaveRecipe}
            />
            <button
              type="button"
              onClick={() => {
                setDraftRecipe(null);
                setExtractionResult(null);
                setLocalExtractionResult(null);
                setAiError("");
              }}
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
