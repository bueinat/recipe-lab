export type RecipeStatus = "Idea" | "Testing" | "Favorite";

export type CookingLog = {
  id: string;
  date: string;
  text: string;
};

export type RecipeVersion = {
  id: string;
  name: string;
  createdAt: string;
  ingredients: string;
  instructions: string;
  notes: string;
};

export type RecipeVersionInput = Omit<RecipeVersion, "id" | "createdAt">;

export type IngredientSection = {
  id: string;
  title: string;
  itemsText: string;
};

export type InstructionSection = {
  id: string;
  title: string;
  stepsText: string;
};

export type Recipe = {
  id: string;
  title: string;
  imageUrl?: string;
  servings: number;
  ingredients: string;
  instructions: string;
  ingredientSections?: IngredientSection[];
  instructionSections?: InstructionSection[];
  notes: string;
  tags: string[];
  sourceUrl: string;
  status: RecipeStatus;
  rating: number;
  cookingLogs?: CookingLog[];
  versions?: RecipeVersion[];
};

export type RecipeFormValues = Omit<Recipe, "id">;

export const recipeStatuses: RecipeStatus[] = ["Idea", "Testing", "Favorite"];
