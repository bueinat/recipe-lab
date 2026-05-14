import type { Recipe } from "./recipe-types";

export const sampleRecipes: Recipe[] = [
  {
    id: "sunny-lemon-pasta",
    title: "Sunny Lemon Pasta",
    imageUrl:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    servings: 4,
    ingredients:
      "Spaghetti\nLemon zest and juice\nParmesan\nFresh basil\nOlive oil\nBlack pepper",
    instructions:
      "Cook pasta until al dente. Toss with olive oil, lemon zest, lemon juice, and parmesan. Finish with basil and black pepper.",
    notes: "Add a splash of pasta water to make the sauce glossy.",
    tags: ["Vegetarian", "Dinner"],
    sourceUrl: "https://example.com/lemon-pasta",
    status: "Favorite",
    rating: 5,
    cookingLogs: [
      {
        id: "sunny-lemon-pasta-log-1",
        date: "2026-05-01",
        text: "Used extra lemon zest and saved a little pasta water for the sauce.",
      },
    ],
  },
  {
    id: "cozy-tomato-soup",
    title: "Cozy Tomato Soup",
    servings: 6,
    ingredients:
      "Canned tomatoes\nYellow onion\nGarlic\nVegetable broth\nCream\nButter",
    instructions:
      "Soften onion and garlic in butter. Add tomatoes and broth, simmer, then blend until smooth. Stir in cream before serving.",
    notes: "Great with grilled cheese or crunchy croutons.",
    tags: ["Comfort", "Lunch"],
    sourceUrl: "",
    status: "Testing",
    rating: 4,
    cookingLogs: [],
  },
  {
    id: "herby-sheet-pan-chicken",
    title: "Herby Sheet-Pan Chicken",
    imageUrl:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    servings: 4,
    ingredients:
      "Chicken thighs\nBaby potatoes\nCarrots\nGarlic\nRosemary\nThyme\nOlive oil",
    instructions:
      "Season chicken and vegetables with herbs, garlic, olive oil, salt, and pepper. Roast on one sheet pan until golden and cooked through.",
    notes: "Cut vegetables the same size so everything cooks evenly.",
    tags: ["Protein", "Meal Prep"],
    sourceUrl: "https://example.com/sheet-pan-chicken",
    status: "Idea",
    rating: 3,
    cookingLogs: [],
  },
];
