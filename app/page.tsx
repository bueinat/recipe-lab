type Recipe = {
  title: string;
  description: string;
  time: string;
  difficulty: "Easy" | "Medium";
  tags: string[];
  emoji: string;
};

const recipes: Recipe[] = [
  {
    title: "Sunny Lemon Pasta",
    description: "A bright weeknight pasta with lemon, parmesan, and fresh basil.",
    time: "25 min",
    difficulty: "Easy",
    tags: ["Vegetarian", "Dinner"],
    emoji: "🍋",
  },
  {
    title: "Cozy Tomato Soup",
    description: "A silky soup made with pantry tomatoes and a splash of cream.",
    time: "35 min",
    difficulty: "Easy",
    tags: ["Comfort", "Lunch"],
    emoji: "🍅",
  },
  {
    title: "Herby Sheet-Pan Chicken",
    description: "Juicy chicken and vegetables roasted together with garlic herbs.",
    time: "45 min",
    difficulty: "Medium",
    tags: ["Protein", "Meal Prep"],
    emoji: "🌿",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="rounded-3xl bg-white/80 p-8 shadow-sm ring-1 ring-stone-200 sm:p-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-tomato">
            Recipe Lab
          </p>
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-stone-950 sm:text-6xl">
                Simple recipes for curious home cooks.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
                Test new flavors, save dependable favorites, and make dinner feel a
                little more playful with Recipe Lab.
              </p>
            </div>
            <div className="rounded-2xl bg-herb p-6 text-white">
              <p className="text-sm font-medium uppercase tracking-wide text-green-100">
                This week&apos;s goal
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Cook three colorful meals with ingredients you already love.
              </p>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-semibold text-herb">Fresh from the lab</p>
              <h2 className="text-3xl font-bold tracking-tight text-stone-950">
                Mock recipe cards
              </h2>
            </div>
            <p className="text-sm text-stone-500">
              Beginner-friendly layout using the App Router, TypeScript, and Tailwind.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {recipes.map((recipe) => (
              <article
                key={recipe.title}
                className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-4xl">
                  {recipe.emoji}
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-stone-950">{recipe.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-stone-600">
                  {recipe.description}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-medium text-stone-500">
                  <span>{recipe.time}</span>
                  <span>{recipe.difficulty}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
