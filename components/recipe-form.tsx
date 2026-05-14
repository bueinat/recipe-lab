"use client";

import { useState, type FormEvent } from "react";
import { recipeStatuses, type RecipeFormValues } from "@/lib/recipe-types";

const emptyRecipeForm: RecipeFormValues = {
  title: "",
  imageUrl: "",
  servings: 1,
  ingredients: "",
  instructions: "",
  notes: "",
  tags: [],
  sourceUrl: "",
  status: "Idea",
  rating: 0,
};

type RecipeFormProps = {
  buttonLabel: string;
  initialValues?: RecipeFormValues;
  onSubmit: (recipe: RecipeFormValues) => void;
};

function tagsToText(tags: string[]) {
  return tags.join(", ");
}

function textToTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function RecipeForm({
  buttonLabel,
  initialValues = emptyRecipeForm,
  onSubmit,
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [imageUrl, setImageUrl] = useState(initialValues.imageUrl ?? "");
  const [servings, setServings] = useState(initialValues.servings ?? 1);
  const [ingredients, setIngredients] = useState(initialValues.ingredients);
  const [instructions, setInstructions] = useState(initialValues.instructions);
  const [notes, setNotes] = useState(initialValues.notes);
  const [tags, setTags] = useState(tagsToText(initialValues.tags));
  const [sourceUrl, setSourceUrl] = useState(initialValues.sourceUrl);
  const [status, setStatus] = useState(initialValues.status);
  const [rating, setRating] = useState(initialValues.rating);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      title: title.trim(),
      imageUrl: imageUrl.trim() || undefined,
      servings,
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      notes: notes.trim(),
      tags: textToTags(tags),
      sourceUrl: sourceUrl.trim(),
      status,
      rating,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-stone-700">Title</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
          placeholder="Grandma's apple crumble"
        />
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
          >
            {recipeStatuses.map((recipeStatus) => (
              <option key={recipeStatus} value={recipeStatus}>
                {recipeStatus}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Servings</span>
          <input
            required
            type="number"
            min={1}
            value={servings}
            onChange={(event) => setServings(Number(event.target.value))}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Rating</span>
          <select
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
          >
            <option value={0}>Not rated yet</option>
            {[1, 2, 3, 4, 5].map((starCount) => (
              <option key={starCount} value={starCount}>
                {starCount} star{starCount > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-stone-700">Ingredients</span>
        <textarea
          required
          value={ingredients}
          onChange={(event) => setIngredients(event.target.value)}
          rows={6}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
          placeholder="Add one ingredient per line"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-stone-700">Instructions</span>
        <textarea
          required
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          rows={6}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
          placeholder="Write the cooking steps here"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-stone-700">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
          placeholder="Optional reminders, swaps, or serving ideas"
        />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Image URL</span>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
            placeholder="https://example.com/photo.jpg"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Tags</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
            placeholder="Dinner, Vegetarian, Quick"
          />
          <span className="text-xs text-stone-500">Separate tags with commas.</span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Source URL</span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
            placeholder="https://example.com/recipe"
          />
        </label>
      </div>

      <button
        type="submit"
        className="rounded-2xl bg-herb px-5 py-3 font-bold text-white shadow-sm transition hover:bg-green-800"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
