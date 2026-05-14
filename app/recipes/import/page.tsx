"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useRecipes } from "@/components/recipe-provider";
import type { RecipeFormValues } from "@/lib/recipe-types";

export default function ImportRecipePage() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const [pastedText, setPastedText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  function handleImportRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draftRecipe: RecipeFormValues = {
      title: "Untitled imported recipe",
      imageUrl: imageUrl.trim() || undefined,
      servings: 1,
      ingredients: pastedText.trim(),
      instructions: "",
      notes: "Imported from pasted text",
      tags: ["imported"],
      sourceUrl: sourceUrl.trim(),
      status: "Idea",
      rating: 0,
      cookingLogs: [],
    };

    const newRecipe = addRecipe(draftRecipe);
    router.push(`/recipes/${newRecipe.id}/edit`);
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
            Paste a recipe draft
          </h1>
          <p className="mt-3 text-stone-600">
            Recipe Lab will save the pasted text as ingredients, then send you to
            the edit page so you can clean it up manually.
          </p>
        </div>

        <form onSubmit={handleImportRecipe} className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-stone-700">Recipe text</span>
            <textarea
              required
              value={pastedText}
              onChange={(event) => setPastedText(event.target.value)}
              rows={12}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
              placeholder="Paste ingredients, notes, or the full recipe text here."
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-stone-700">
                Source URL
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
              <span className="text-sm font-semibold text-stone-700">Image URL</span>
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
            Import and edit
          </button>
        </form>
      </section>
    </main>
  );
}
