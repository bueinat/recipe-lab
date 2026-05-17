"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipes } from "@/components/recipe-provider";
import type { RecipeFormValues } from "@/lib/recipe-types";
import { getTextDirection } from "@/lib/text-direction";

export function EditRecipePage({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const { getRecipe, updateRecipe } = useRecipes();
  const recipe = getRecipe(recipeId);

  function handleUpdateRecipe(updatedRecipe: RecipeFormValues) {
    updateRecipe(recipeId, updatedRecipe);
    router.push(`/recipes/${recipeId}`);
  }

  if (!recipe) {
    return (
      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-tomato">
            Missing recipe
          </p>
          <h1 className="mt-4 text-3xl font-bold text-stone-950">
            This recipe is not available to edit.
          </h1>
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
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <Link
          href={`/recipes/${recipe.id}`}
          className="text-sm font-bold text-herb hover:text-green-800"
        >
          ← Back to details
        </Link>
        <div className="mb-8 mt-6">
          <p className="font-semibold text-tomato">Edit Recipe</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
            Update{" "}
            <span dir={getTextDirection(recipe.title)}>{recipe.title}</span>
          </h1>
          <p className="mt-3 text-stone-600">
            Adjust ingredients, instructions, notes, tags, source, status, or rating.
          </p>
        </div>
        <RecipeForm
          buttonLabel="Save changes"
          initialValues={recipe}
          onSubmit={handleUpdateRecipe}
        />
      </section>
    </main>
  );
}
