"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRecipes } from "./recipe-provider";

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <h2 className="text-lg font-bold text-stone-950">{title}</h2>
      <div className="mt-4 whitespace-pre-line leading-7 text-stone-700">{children}</div>
    </section>
  );
}

function formatRating(rating: number) {
  return rating > 0 ? `${"★".repeat(rating)}${"☆".repeat(5 - rating)}` : "Not rated";
}

function formatServings(servings: number | undefined) {
  const servingCount = servings ?? 1;

  return `${servingCount} serving${servingCount === 1 ? "" : "s"}`;
}

export function RecipeDetails({ recipeId }: { recipeId: string }) {
  const { getRecipe } = useRecipes();
  const recipe = getRecipe(recipeId);

  if (!recipe) {
    return (
      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-tomato">
            Missing recipe
          </p>
          <h1 className="mt-4 text-3xl font-bold text-stone-950">
            We could not find that recipe.
          </h1>
          <p className="mt-3 text-stone-600">
            Recipe Lab saves recipes in this browser, with mock recipes as a fallback.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-herb px-5 py-3 font-bold text-white"
          >
            Back to recipes
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <article className="mx-auto grid max-w-5xl gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
          <Link href="/" className="text-sm font-bold text-herb hover:text-green-800">
            ← Back to recipes
          </Link>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-tomato">
                  {recipe.status}
                </span>
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-stone-950">
                {recipe.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                <span className="text-amber-500">{formatRating(recipe.rating)}</span>
                <span className="text-herb">{formatServings(recipe.servings)}</span>
              </div>
            </div>
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="rounded-full bg-herb px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-green-800"
            >
              Edit recipe
            </Link>
          </div>
        </div>

        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-64 w-full rounded-3xl object-cover shadow-sm ring-1 ring-stone-200"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center rounded-3xl bg-stone-100 text-sm font-semibold text-stone-400 ring-1 ring-stone-200">
            No image yet
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <DetailBlock title="Ingredients">{recipe.ingredients}</DetailBlock>
          <DetailBlock title="Instructions">{recipe.instructions}</DetailBlock>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DetailBlock title="Notes">
            {recipe.notes || "No notes yet. Add reminders after your next test cook."}
          </DetailBlock>
          <DetailBlock title="Source">
            {recipe.sourceUrl ? (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-herb underline decoration-green-200 underline-offset-4 hover:text-green-800"
              >
                {recipe.sourceUrl}
              </a>
            ) : (
              "No source URL saved."
            )}
          </DetailBlock>
        </div>
      </article>
    </main>
  );
}
