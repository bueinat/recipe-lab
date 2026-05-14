"use client";

import Link from "next/link";
import { useRecipes } from "./recipe-provider";

export function SiteHeader() {
  const { recipes } = useRecipes();

  return (
    <header className="border-b border-orange-100 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Link href="/" className="text-2xl font-black tracking-tight text-herb">
          Recipe Lab
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-stone-600 transition hover:bg-orange-50 hover:text-herb"
          >
            Recipes ({recipes.length})
          </Link>
          <Link
            href="/recipes/import"
            className="rounded-full px-4 py-2 text-stone-600 transition hover:bg-orange-50 hover:text-herb"
          >
            Import
          </Link>
          <Link
            href="/recipes/new"
            className="rounded-full bg-tomato px-4 py-2 text-white shadow-sm transition hover:bg-red-600"
          >
            Add Recipe
          </Link>
        </div>
      </nav>
    </header>
  );
}
