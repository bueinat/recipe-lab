"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { sampleRecipes } from "@/lib/sample-recipes";
import type { Recipe, RecipeFormValues } from "@/lib/recipe-types";

type RecipeContextValue = {
  recipes: Recipe[];
  addRecipe: (recipe: RecipeFormValues) => Recipe;
  updateRecipe: (id: string, recipe: RecipeFormValues) => void;
  getRecipe: (id: string) => Recipe | undefined;
};

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

function makeRecipeId(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "recipe"}-${Date.now()}`;
}

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);

  const value = useMemo<RecipeContextValue>(() => {
    function addRecipe(recipe: RecipeFormValues) {
      const newRecipe = {
        ...recipe,
        id: makeRecipeId(recipe.title),
      };

      setRecipes((currentRecipes) => [newRecipe, ...currentRecipes]);
      return newRecipe;
    }

    function updateRecipe(id: string, recipe: RecipeFormValues) {
      setRecipes((currentRecipes) =>
        currentRecipes.map((currentRecipe) =>
          currentRecipe.id === id ? { ...recipe, id } : currentRecipe,
        ),
      );
    }

    function getRecipe(id: string) {
      return recipes.find((recipe) => recipe.id === id);
    }

    return { recipes, addRecipe, updateRecipe, getRecipe };
  }, [recipes]);

  return (
    <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);

  if (!context) {
    throw new Error("useRecipes must be used inside RecipeProvider");
  }

  return context;
}
