"use client";

import Link from "next/link";
import { useRecipes } from "@/components/recipe-provider";

function formatRating(rating: number) {
  return rating > 0 ? "★".repeat(rating) : "Not rated";
}

function formatServings(servings: number | undefined) {
  const servingCount = servings ?? 1;

  return `${servingCount} serving${servingCount === 1 ? "" : "s"}`;
}

export default function Home() {
  const { recipes } = useRecipes();

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="rounded-3xl bg-white/80 p-8 shadow-sm ring-1 ring-stone-200 sm:p-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-tomato">
            Recipe Lab
          </p>
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-stone-950 sm:text-6xl">
                Simple recipes for curious home cooks.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
                Capture ideas, test new flavors, and keep your favorite recipes in
                one clean local workspace.
              </p>
            </div>
            <div className="rounded-2xl bg-herb p-6 text-white">
              <p className="text-sm font-medium uppercase tracking-wide text-green-100">
                Start experimenting
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Add a new recipe, rate it, and update your notes after each cook.
              </p>
              <Link
                href="/recipes/new"
                className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-herb transition hover:bg-green-50"
              >
                Add Recipe
              </Link>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-semibold text-herb">Fresh from the lab</p>
              <h2 className="text-3xl font-bold tracking-tight text-stone-950">
                Recipe collection
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Saved locally in your browser for quick testing.
              </p>
            </div>
            <Link
              href="/recipes/new"
              className="inline-flex items-center justify-center rounded-full bg-tomato px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-600"
            >
              Add Recipe
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {recipes.map((recipe) => (
              <article
                key={recipe.id}
                className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-md"
              >
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-stone-100 text-sm font-semibold text-stone-400">
                    No image yet
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-tomato">
                      {recipe.status}
                    </span>
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-bold text-stone-950">{recipe.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-herb">
                    {formatServings(recipe.servings)}
                  </p>
                  <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-sm leading-6 text-stone-600">
                    {recipe.ingredients}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-medium text-stone-500">
                    <span>{formatRating(recipe.rating)}</span>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="font-bold text-herb hover:text-green-800"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
