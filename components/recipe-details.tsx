"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getTextDirection, type TextDirection } from "@/lib/text-direction";
import { useRecipes } from "./recipe-provider";

function DetailBlock({
  title,
  children,
  dir = "ltr",
}: {
  title: string;
  children: ReactNode;
  dir?: TextDirection;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <h2 className="text-lg font-bold text-stone-950">{title}</h2>
      <div dir={dir} className="mt-4 whitespace-pre-line leading-7 text-stone-700">
        {children}
      </div>
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

function formatLogDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function RecipeDetails({ recipeId }: { recipeId: string }) {
  const { addCookingLog, addRecipeVersion, getRecipe } = useRecipes();
  const [newCookingNote, setNewCookingNote] = useState("");
  const [desiredServings, setDesiredServings] = useState("1");
  const [versionName, setVersionName] = useState("");
  const [versionIngredients, setVersionIngredients] = useState("");
  const [versionInstructions, setVersionInstructions] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const [isVersionFormOpen, setIsVersionFormOpen] = useState(false);
  const [openVersionId, setOpenVersionId] = useState<string | null>(null);
  const recipe = getRecipe(recipeId);

  const cookingLogs = recipe?.cookingLogs ?? [];
  const versions = recipe?.versions ?? [];
  const originalServings = recipe?.servings && recipe.servings > 0 ? recipe.servings : 1;
  const desiredServingCount = Number(desiredServings);
  const hasValidDesiredServings =
    Number.isFinite(desiredServingCount) && desiredServingCount > 0;
  const servingMultiplier = hasValidDesiredServings
    ? desiredServingCount / originalServings
    : null;

  useEffect(() => {
    if (!recipe) {
      return;
    }

    setDesiredServings(String(recipe.servings || 1));
    setVersionIngredients(recipe.ingredients);
    setVersionInstructions(recipe.instructions);
    setVersionNotes(recipe.notes);
  }, [recipe?.id, recipe?.ingredients, recipe?.instructions, recipe?.notes, recipe?.servings]);

  function resetVersionForm() {
    if (!recipe) {
      return;
    }

    setVersionName("");
    setVersionIngredients(recipe.ingredients);
    setVersionInstructions(recipe.instructions);
    setVersionNotes(recipe.notes);
  }

  function handleAddCookingNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addCookingLog(recipeId, newCookingNote);
    setNewCookingNote("");
  }

  function handleAddVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!versionName.trim()) {
      return;
    }

    addRecipeVersion(recipeId, {
      name: versionName.trim(),
      ingredients: versionIngredients.trim(),
      instructions: versionInstructions.trim(),
      notes: versionNotes.trim(),
    });
    resetVersionForm();
    setIsVersionFormOpen(false);
  }

  function handleCancelVersionForm() {
    resetVersionForm();
    setIsVersionFormOpen(false);
  }

  function toggleVersion(versionId: string) {
    setOpenVersionId((currentVersionId) =>
      currentVersionId === versionId ? null : versionId,
    );
  }

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
              <h1
                dir={getTextDirection(recipe.title)}
                className="text-4xl font-bold tracking-tight text-stone-950"
              >
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

        <div className="aspect-[16/9] w-full overflow-hidden rounded-3xl bg-stone-100 shadow-sm ring-1 ring-stone-200">
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

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <DetailBlock title="Ingredients" dir={getTextDirection(recipe.ingredients)}>
            {recipe.ingredients}
          </DetailBlock>
          <DetailBlock title="Instructions" dir={getTextDirection(recipe.instructions)}>
            {recipe.instructions}
          </DetailBlock>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-lg font-bold text-stone-950">Scale recipe</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] sm:items-end">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-stone-700">
                Desired servings
              </span>
              <input
                type="number"
                min={1}
                value={desiredServings}
                onChange={(event) => setDesiredServings(event.target.value)}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
              />
            </label>
            <div className="rounded-2xl bg-stone-50 p-4">
              {servingMultiplier ? (
                <>
                  <p className="font-semibold text-stone-900">
                    Scaling from {formatServings(originalServings)} to {formatServings(desiredServingCount)}
                  </p>
                  <p className="mt-2 text-sm font-bold text-herb">
                    Multiplier: {servingMultiplier.toFixed(2).replace(/\.00$/, "")}x
                  </p>
                </>
              ) : (
                <p className="font-semibold text-tomato">
                  Enter a serving amount greater than 0.
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            For now, multiply ingredient amounts manually using this multiplier.
            Recipe Lab does not rewrite ingredients automatically yet.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <DetailBlock title="Notes" dir={getTextDirection(recipe.notes)}>
            {recipe.notes || "No notes yet. Add reminders after your next test cook."}
          </DetailBlock>
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-bold text-stone-950">Cooking Notes</h2>
            <form onSubmit={handleAddCookingNote} className="mt-4 grid gap-3">
              <textarea
                dir={getTextDirection(newCookingNote)}
                value={newCookingNote}
                onChange={(event) => setNewCookingNote(event.target.value)}
                rows={4}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                placeholder="What changed when you cooked this recipe?"
              />
              <button
                type="submit"
                className="rounded-2xl bg-herb px-5 py-3 font-bold text-white shadow-sm transition hover:bg-green-800"
              >
                Add cooking note
              </button>
            </form>
            <div className="mt-6 grid gap-4">
              {cookingLogs.length > 0 ? (
                cookingLogs.map((log) => (
                  <article key={log.id} className="rounded-2xl bg-stone-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                      {formatLogDate(log.date)}
                    </p>
                    <p
                      dir={getTextDirection(log.text)}
                      className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700"
                    >
                      {log.text}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-stone-500">
                  No cooking notes yet. Add one after your next test cook.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-950">
                Versions / Adaptations
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Save variations without changing the main recipe.
              </p>
            </div>
            {!isVersionFormOpen ? (
              <button
                type="button"
                onClick={() => setIsVersionFormOpen(true)}
                className="rounded-full bg-herb px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-800"
              >
                Add Adaptation
              </button>
            ) : null}
          </div>

          {isVersionFormOpen ? (
            <form onSubmit={handleAddVersion} className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-stone-700">
                  Version name
                </span>
                <input
                  required
                  dir={getTextDirection(versionName)}
                  value={versionName}
                  onChange={(event) => setVersionName(event.target.value)}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                  placeholder="Weeknight shortcut version"
                />
              </label>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-stone-700">
                    Ingredients
                  </span>
                  <textarea
                    dir={getTextDirection(versionIngredients)}
                    value={versionIngredients}
                    onChange={(event) => setVersionIngredients(event.target.value)}
                    rows={6}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-stone-700">
                    Instructions
                  </span>
                  <textarea
                    dir={getTextDirection(versionInstructions)}
                    value={versionInstructions}
                    onChange={(event) => setVersionInstructions(event.target.value)}
                    rows={6}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-stone-700">Notes</span>
                <textarea
                  dir={getTextDirection(versionNotes)}
                  value={versionNotes}
                  onChange={(event) => setVersionNotes(event.target.value)}
                  rows={4}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-herb px-5 py-3 font-bold text-white shadow-sm transition hover:bg-green-800"
                >
                  Save version
                </button>
                <button
                  type="button"
                  onClick={handleCancelVersionForm}
                  className="rounded-2xl bg-stone-100 px-5 py-3 font-bold text-stone-700 transition hover:bg-stone-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-6 grid gap-3">
            {versions.length > 0 ? (
              versions.map((version) => {
                const isOpen = openVersionId === version.id;

                return (
                  <article key={version.id} className="rounded-2xl bg-stone-50">
                    <button
                      type="button"
                      onClick={() => toggleVersion(version.id)}
                      className="flex w-full flex-col gap-1 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span
                        dir={getTextDirection(version.name)}
                        className="font-bold text-stone-950"
                      >
                        {version.name}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wide text-stone-500">
                        {formatLogDate(version.createdAt)}
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="border-t border-stone-200 p-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="text-sm font-bold text-stone-700">
                              Ingredients
                            </p>
                            <p
                              dir={getTextDirection(version.ingredients)}
                              className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600"
                            >
                              {version.ingredients ||
                                "No ingredients saved for this version."}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-700">
                              Instructions
                            </p>
                            <p
                              dir={getTextDirection(version.instructions)}
                              className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600"
                            >
                              {version.instructions ||
                                "No instructions saved for this version."}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-bold text-stone-700">Notes</p>
                          <p
                            dir={getTextDirection(version.notes)}
                            className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600"
                          >
                            {version.notes || "No notes saved for this version."}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-stone-500">
                No versions yet. Save an adaptation when you try a variation.
              </p>
            )}
          </div>
        </section>

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
      </article>
    </main>
  );
}
