export type RecipeStatus = "Idea" | "Testing" | "Favorite";

export type CookingLog = {
  id: string;
  date: string;
  text: string;
};

export type Recipe = {
  id: string;
  title: string;
  imageUrl?: string;
  servings: number;
  ingredients: string;
  instructions: string;
  notes: string;
  tags: string[];
  sourceUrl: string;
  status: RecipeStatus;
  rating: number;
  cookingLogs?: CookingLog[];
};

export type RecipeFormValues = Omit<Recipe, "id">;

export const recipeStatuses: RecipeStatus[] = ["Idea", "Testing", "Favorite"];
