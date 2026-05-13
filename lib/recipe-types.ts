export type RecipeStatus = "Idea" | "Testing" | "Favorite";

export type Recipe = {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  notes: string;
  tags: string[];
  sourceUrl: string;
  status: RecipeStatus;
  rating: number;
};

export type RecipeFormValues = Omit<Recipe, "id">;

export const recipeStatuses: RecipeStatus[] = ["Idea", "Testing", "Favorite"];
