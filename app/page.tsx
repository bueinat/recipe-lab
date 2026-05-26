"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRecipes } from "@/components/recipe-provider";
import { getTextDirection } from "@/lib/text-direction";

function formatRating(rating: number) {
  return rating > 0 ? "★".repeat(rating) : "Not rated";
}

function formatServings(servings: number | undefined) {
  const servingCount = servings ?? 1;

  return `${servingCount} serving${servingCount === 1 ? "" : "s"}`;
}

type StatusFilter = "All" | "Idea" | "Testing" | "Favorite";

type SortOption = "newest" | "title" | "rating";

const statusOptions: StatusFilter[] = ["All", "Idea", "Testing", "Favorite"];

export default function Home() {
  const { recipes } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const availableTags = useMemo(() => {
    const uniqueTags = new Set<string>();

    recipes.forEach((recipe) => {
      recipe.tags.forEach((tag) => uniqueTags.add(tag));
    });

    return Array.from(uniqueTags).sort((firstTag, secondTag) =>
      firstTag.localeCompare(secondTag),
    );
  }, [recipes]);

  const visibleRecipes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return recipes
      .filter((recipe) => {
        const searchableText = [
          recipe.title,
          recipe.ingredients,
          recipe.instructions,
          ...(recipe.ingredientSections ?? []).flatMap((section) => [
            section.title,
            section.itemsText,
          ]),
          ...(recipe.instructionSections ?? []).flatMap((section) => [
            section.title,
            section.stepsText,
          ]),
          recipe.notes,
          recipe.tags.join(" "),
          recipe.sourceUrl,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedSearch === "" || searchableText.includes(normalizedSearch);
        const matchesStatus =
          statusFilter === "All" || recipe.status === statusFilter;
        const matchesTag =
          tagFilter === "All" || recipe.tags.includes(tagFilter);

        return matchesSearch && matchesStatus && matchesTag;
      })
      .sort((firstRecipe, secondRecipe) => {
        if (sortOption === "title") {
          return firstRecipe.title.localeCompare(secondRecipe.title);
        }

        if (sortOption === "rating") {
          return secondRecipe.rating - firstRecipe.rating;
        }

        return recipes.indexOf(firstRecipe) - recipes.indexOf(secondRecipe);
      });
  }, [recipes, searchQuery, sortOption, statusFilter, tagFilter]);

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
            <div className="rounded-2xl bg-green-50 p-6 text-stone-900 ring-1 ring-green-100">
              <p className="text-sm font-medium uppercase tracking-wide text-herb">
                Start experimenting
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Import a recipe, rate it, and update your notes after each cook.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/recipes/import"
                  className="inline-flex items-center justify-center rounded-full bg-herb px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-800"
                >
                  Import recipe
                </Link>
                <Link
                  href="/recipes/new"
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-herb ring-1 ring-green-200 transition hover:bg-green-100"
                >
                  Add manually
                </Link>
              </div>
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/recipes/import"
                className="inline-flex items-center justify-center rounded-full bg-herb px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-800"
              >
                Import recipe
              </Link>
              <Link
                href="/recipes/new"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-herb ring-1 ring-green-200 transition hover:bg-green-50"
              >
                Add manually
              </Link>
            </div>
          </div>

          <div className="mb-6 grid gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 md:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-2 md:col-span-2 lg:col-span-1">
              <span className="text-sm font-semibold text-stone-700">Search</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                placeholder="Search recipes"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-stone-700">Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-stone-700">Tag</span>
              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
              >
                <option value="All">All</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-stone-700">Sort</span>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
              >
                <option value="newest">Newest first</option>
                <option value="title">Title A-Z</option>
                <option value="rating">Rating high to low</option>
              </select>
            </label>
          </div>

          {visibleRecipes.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
              <h3 className="text-2xl font-bold text-stone-950">
                No recipes found
              </h3>
              <p className="mt-3 text-stone-600">
                Try a different search, status, tag, or sort option.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {visibleRecipes.map((recipe) => (
                <article
                  key={recipe.id}
                  className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-stone-400">
                        No image yet
                      </div>
                    )}
                  </div>

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
                    <h3
                      dir={getTextDirection(recipe.title)}
                      className="text-xl font-bold text-stone-950"
                    >
                      {recipe.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-herb">
                      {formatServings(recipe.servings)}
                    </p>
                    <p
                      dir={getTextDirection(recipe.ingredients)}
                      className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-sm leading-6 text-stone-600"
                    >
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
          )}
        </section>
      </section>
    </main>
  );
}
