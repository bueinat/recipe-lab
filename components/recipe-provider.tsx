"use client";

import {
  createContext,
  useContext,
  useEffect,
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
  addCookingLog: (recipeId: string, text: string) => void;
  getRecipe: (id: string) => Recipe | undefined;
};

const STORAGE_KEY = "recipe-lab-recipes";

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

function makeRecipeId(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "recipe"}-${Date.now()}`;
}

function makeCookingLogId() {
  return `log-${Date.now()}`;
}

function readStoredRecipes() {
  const storedRecipes = window.localStorage.getItem(STORAGE_KEY);

  if (!storedRecipes) {
    return sampleRecipes;
  }

  try {
    const parsedRecipes = JSON.parse(storedRecipes);

    if (Array.isArray(parsedRecipes) && parsedRecipes.length > 0) {
      return parsedRecipes as Recipe[];
    }
  } catch {
    // Fall back to mock recipes if saved data cannot be read.
  }

  return sampleRecipes;
}

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [hasLoadedStoredRecipes, setHasLoadedStoredRecipes] = useState(false);

  useEffect(() => {
    setRecipes(readStoredRecipes());
    setHasLoadedStoredRecipes(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredRecipes) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  }, [hasLoadedStoredRecipes, recipes]);

  const value = useMemo<RecipeContextValue>(() => {
    function addRecipe(recipe: RecipeFormValues) {
      const newRecipe = {
        ...recipe,
        cookingLogs: recipe.cookingLogs ?? [],
        id: makeRecipeId(recipe.title),
      };

      setRecipes((currentRecipes) => [newRecipe, ...currentRecipes]);
      return newRecipe;
    }

    function updateRecipe(id: string, recipe: RecipeFormValues) {
      setRecipes((currentRecipes) =>
        currentRecipes.map((currentRecipe) =>
          currentRecipe.id === id
            ? {
                ...recipe,
                cookingLogs: currentRecipe.cookingLogs ?? [],
                id,
              }
            : currentRecipe,
        ),
      );
    }

    function addCookingLog(recipeId: string, text: string) {
      const trimmedText = text.trim();

      if (!trimmedText) {
        return;
      }

      setRecipes((currentRecipes) =>
        currentRecipes.map((recipe) =>
          recipe.id === recipeId
            ? {
                ...recipe,
                cookingLogs: [
                  {
                    id: makeCookingLogId(),
                    date: new Date().toISOString(),
                    text: trimmedText,
                  },
                  ...(recipe.cookingLogs ?? []),
                ],
              }
            : recipe,
        ),
      );
    }

    function getRecipe(id: string) {
      return recipes.find((recipe) => recipe.id === id);
    }

    return { recipes, addRecipe, updateRecipe, addCookingLog, getRecipe };
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
