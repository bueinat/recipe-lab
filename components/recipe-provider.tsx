"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { sampleRecipes } from "@/lib/sample-recipes";
import type {
  Recipe,
  RecipeFormValues,
  RecipeVersionInput,
} from "@/lib/recipe-types";

type RecipeContextValue = {
  recipes: Recipe[];
  addRecipe: (recipe: RecipeFormValues) => Recipe;
  updateRecipe: (id: string, recipe: RecipeFormValues) => void;
  addCookingLog: (recipeId: string, text: string) => void;
  addRecipeVersion: (recipeId: string, version: RecipeVersionInput) => void;
  getRecipe: (id: string) => Recipe | undefined;
  hasHydratedFromStorage: boolean;
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

function makeRecipeVersionId() {
  return `version-${Date.now()}`;
}

function normalizeRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    cookingLogs: recipe.cookingLogs ?? [],
    versions: recipe.versions ?? [],
  };
}

function normalizeRecipes(recipes: Recipe[]) {
  return recipes.map(normalizeRecipe);
}

function readStoredRecipes() {
  const storedRecipes = window.localStorage.getItem(STORAGE_KEY);

  if (!storedRecipes) {
    return normalizeRecipes(sampleRecipes);
  }

  try {
    const parsedRecipes = JSON.parse(storedRecipes);

    if (Array.isArray(parsedRecipes)) {
      if (parsedRecipes.length > 0) {
        return normalizeRecipes(parsedRecipes as Recipe[]);
      }

      return [];
    }
  } catch {
    // Fall back to mock recipes if saved data cannot be read.
  }

  return normalizeRecipes(sampleRecipes);
}

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [hasHydratedFromStorage, setHasHydratedFromStorage] = useState(false);
  const lastSavedRecipesRef = useRef("");

  useEffect(() => {
    // Hydration runs exactly once per mount. We load localStorage first,
    // normalize legacy recipes, and only then allow persistence writes.
    const initialRecipes = readStoredRecipes();

    if (initialRecipes.length > 0) {
      setRecipes(initialRecipes);
    }

    lastSavedRecipesRef.current = JSON.stringify(initialRecipes);
    setHasHydratedFromStorage(true);
  }, []);

  useEffect(() => {
    // Do not write sample/default state before hydration finishes.
    if (!hasHydratedFromStorage) {
      return;
    }

    // Save only when recipes actually changed to prevent write loops.
    const serializedRecipes = JSON.stringify(recipes);

    if (serializedRecipes === lastSavedRecipesRef.current) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, serializedRecipes);
    lastSavedRecipesRef.current = serializedRecipes;
  }, [hasHydratedFromStorage, recipes]);

  const value = useMemo<RecipeContextValue>(() => {
    function addRecipe(recipe: RecipeFormValues) {
      const newRecipe = {
        ...recipe,
        cookingLogs: recipe.cookingLogs ?? [],
        versions: recipe.versions ?? [],
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
                versions: currentRecipe.versions ?? [],
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

    function addRecipeVersion(recipeId: string, version: RecipeVersionInput) {
      setRecipes((currentRecipes) =>
        currentRecipes.map((recipe) =>
          recipe.id === recipeId
            ? {
                ...recipe,
                versions: [
                  {
                    ...version,
                    id: makeRecipeVersionId(),
                    createdAt: new Date().toISOString(),
                  },
                  ...(recipe.versions ?? []),
                ],
              }
            : recipe,
        ),
      );
    }

    function getRecipe(id: string) {
      return recipes.find((recipe) => recipe.id === id);
    }

    return {
      recipes,
      addRecipe,
      updateRecipe,
      addCookingLog,
      addRecipeVersion,
      getRecipe,
      hasHydratedFromStorage,
    };
  }, [hasHydratedFromStorage, recipes]);

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
