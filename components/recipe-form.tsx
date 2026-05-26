"use client";

import { useState, type FormEvent } from "react";
import {
  cleanIngredientSections,
  cleanInstructionSections,
  ingredientSectionsToText,
  instructionSectionsToText,
  makeSectionId,
} from "@/lib/recipe-sections";
import { recipeStatuses, type RecipeFormValues } from "@/lib/recipe-types";
import { getTextDirection } from "@/lib/text-direction";

const emptyRecipeForm: RecipeFormValues = {
  title: "",
  imageUrl: "",
  servings: 1,
  ingredients: "",
  instructions: "",
  ingredientSections: [],
  instructionSections: [],
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
  const [ingredientSections, setIngredientSections] = useState(
    initialValues.ingredientSections ?? [],
  );
  const [instructionSections, setInstructionSections] = useState(
    initialValues.instructionSections ?? [],
  );
  const [notes, setNotes] = useState(initialValues.notes);
  const [tags, setTags] = useState(tagsToText(initialValues.tags));
  const [sourceUrl, setSourceUrl] = useState(initialValues.sourceUrl);
  const [status, setStatus] = useState(initialValues.status);
  const [rating, setRating] = useState(initialValues.rating);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedIngredientSections = cleanIngredientSections(ingredientSections);
    const cleanedInstructionSections = cleanInstructionSections(instructionSections);
    const resolvedIngredients =
      ingredientSectionsToText(cleanedIngredientSections) || ingredients.trim();
    const resolvedInstructions =
      instructionSectionsToText(cleanedInstructionSections) || instructions.trim();

    onSubmit({
      title: title.trim(),
      imageUrl: imageUrl.trim() || undefined,
      servings,
      ingredients: resolvedIngredients,
      instructions: resolvedInstructions,
      ingredientSections: cleanedIngredientSections,
      instructionSections: cleanedInstructionSections,
      notes: notes.trim(),
      tags: textToTags(tags),
      sourceUrl: sourceUrl.trim(),
      status,
      rating,
    });
  }

  const hasIngredientSectionText = ingredientSections.some((section) =>
    section.itemsText.trim(),
  );
  const hasInstructionSectionText = instructionSections.some((section) =>
    section.stepsText.trim(),
  );

  function addIngredientSection() {
    setIngredientSections((currentSections) => [
      ...currentSections,
      { id: makeSectionId("ingredient-section"), title: "", itemsText: "" },
    ]);
  }

  function updateIngredientSection(
    sectionId: string,
    field: "title" | "itemsText",
    value: string,
  ) {
    setIngredientSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    );
  }

  function removeIngredientSection(sectionId: string) {
    setIngredientSections((currentSections) =>
      currentSections.filter((section) => section.id !== sectionId),
    );
  }

  function addInstructionSection() {
    setInstructionSections((currentSections) => [
      ...currentSections,
      { id: makeSectionId("instruction-section"), title: "", stepsText: "" },
    ]);
  }

  function updateInstructionSection(
    sectionId: string,
    field: "title" | "stepsText",
    value: string,
  ) {
    setInstructionSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    );
  }

  function removeInstructionSection(sectionId: string) {
    setInstructionSections((currentSections) =>
      currentSections.filter((section) => section.id !== sectionId),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <section className="grid gap-5">
        <h2 className="text-lg font-bold text-stone-950">Basic info</h2>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Title</span>
          <input
            required
            dir={getTextDirection(title)}
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
      </section>

      <section className="grid gap-5">
        <h2 className="text-lg font-bold text-stone-950">Source and organization</h2>
        <div className="grid gap-5 md:grid-cols-2">
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
        </div>

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
      </section>

      <section className="grid gap-5">
        <h2 className="text-lg font-bold text-stone-950">Recipe content</h2>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Ingredients</span>
          <textarea
            required={!hasIngredientSectionText}
            dir={getTextDirection(ingredients)}
            value={ingredients}
            onChange={(event) => setIngredients(event.target.value)}
            rows={6}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
            placeholder="Add one ingredient per line"
          />
          <span className="text-xs text-stone-500">
            Use this simple list, or add sections for parts like Dough, Filling, or Sauce.
          </span>
        </label>

        <div className="grid gap-3 rounded-2xl bg-stone-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-800">
                Ingredient sections
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Optional. Leave this empty for a simple recipe.
              </p>
            </div>
            <button
              type="button"
              onClick={addIngredientSection}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-herb ring-1 ring-green-200 transition hover:bg-green-50"
            >
              Add section
            </button>
          </div>

          {ingredientSections.length > 0 ? (
            <div className="grid gap-3">
              {ingredientSections.map((section, index) => (
                <div
                  key={section.id}
                  className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="grid flex-1 gap-2">
                      <span className="text-xs font-bold text-stone-600">
                        Section title
                      </span>
                      <input
                        dir={getTextDirection(section.title)}
                        value={section.title}
                        onChange={(event) =>
                          updateIngredientSection(
                            section.id,
                            "title",
                            event.target.value,
                          )
                        }
                        className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                        placeholder={index === 0 ? "Dough" : "Filling"}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeIngredientSection(section.id)}
                      className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-200"
                    >
                      Remove
                    </button>
                  </div>
                  <label className="grid gap-2">
                    <span className="text-xs font-bold text-stone-600">
                      Ingredients for this section
                    </span>
                    <textarea
                      dir={getTextDirection(section.itemsText)}
                      value={section.itemsText}
                      onChange={(event) =>
                        updateIngredientSection(
                          section.id,
                          "itemsText",
                          event.target.value,
                        )
                      }
                      rows={4}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                      placeholder="Add one ingredient per line"
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Instructions</span>
          <textarea
            required={!hasInstructionSectionText}
            dir={getTextDirection(instructions)}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={6}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
            placeholder="Write the cooking steps here"
          />
          <span className="text-xs text-stone-500">
            Keep one set of steps here, or add sections when different parts need their own method.
          </span>
        </label>

        <div className="grid gap-3 rounded-2xl bg-stone-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-800">
                Instruction sections
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Optional. Use this for separate methods like Sauce and Filling.
              </p>
            </div>
            <button
              type="button"
              onClick={addInstructionSection}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-herb ring-1 ring-green-200 transition hover:bg-green-50"
            >
              Add section
            </button>
          </div>

          {instructionSections.length > 0 ? (
            <div className="grid gap-3">
              {instructionSections.map((section, index) => (
                <div
                  key={section.id}
                  className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="grid flex-1 gap-2">
                      <span className="text-xs font-bold text-stone-600">
                        Section title
                      </span>
                      <input
                        dir={getTextDirection(section.title)}
                        value={section.title}
                        onChange={(event) =>
                          updateInstructionSection(
                            section.id,
                            "title",
                            event.target.value,
                          )
                        }
                        className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                        placeholder={index === 0 ? "Dough" : "Sauce"}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeInstructionSection(section.id)}
                      className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-200"
                    >
                      Remove
                    </button>
                  </div>
                  <label className="grid gap-2">
                    <span className="text-xs font-bold text-stone-600">
                      Steps for this section
                    </span>
                    <textarea
                      dir={getTextDirection(section.stepsText)}
                      value={section.stepsText}
                      onChange={(event) =>
                        updateInstructionSection(
                          section.id,
                          "stepsText",
                          event.target.value,
                        )
                      }
                      rows={4}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
                      placeholder="Write the steps for this part"
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-700">Notes</span>
          <textarea
            dir={getTextDirection(notes)}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-herb focus:ring-4 focus:ring-green-100"
            placeholder="Optional reminders, swaps, or serving ideas"
          />
        </label>
      </section>

      <button
        type="submit"
        className="rounded-2xl bg-herb px-5 py-3 font-bold text-white shadow-sm transition hover:bg-green-800"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
