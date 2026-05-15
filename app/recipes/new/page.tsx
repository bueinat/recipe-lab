"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipes } from "@/components/recipe-provider";
import type { RecipeFormValues } from "@/lib/recipe-types";

export default function NewRecipePage() {
  const router = useRouter();
  const { addRecipe } = useRecipes();

  function handleCreateRecipe(recipe: RecipeFormValues) {
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
          <p className="font-semibold text-tomato">New Recipe</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
            Add a recipe to your lab
          </h1>
          <p className="mt-3 text-stone-600">
            Fill in the basics now. You can edit the recipe later as you test it.
          </p>
        </div>
        <RecipeForm buttonLabel="Save recipe" onSubmit={handleCreateRecipe} />
      </section>
    </main>
  );
}
