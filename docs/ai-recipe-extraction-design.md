# AI Recipe Extraction Architecture Design (Cost-Optimized)

## Purpose and constraints

This document proposes a **small-project, practical architecture** for extracting structured recipes from messy text (Instagram captions, Facebook posts, blog copy/paste), while minimizing OpenAI API cost.

Key constraints:

- Keep the current app simple (local-first, browser recipes).
- Use AI only when local logic is not enough.
- Always let users review extracted data before saving.
- Avoid expensive repeated calls.

---

## 1) Recommended AI architecture

## High-level pipeline

1. **User pastes text** (and optional URL) in Import page.
2. **Local preprocessing** runs first (fast, free):
   - normalize whitespace
   - remove social-media noise
   - detect headings/sections
   - extract URL(s)
   - estimate language direction (Hebrew/English/mixed)
3. **Local parser attempts extraction**.
4. If local confidence is high enough → **skip AI**.
5. If local confidence is low/medium or content is messy → **call AI extractor** (server-side only).
6. Validate AI JSON response against schema.
7. Merge results with local heuristics, then show draft in **review-before-save** form.

## When AI should be used

Use AI when one or more are true:

- No clear section headings were found.
- Headings exist but fields are sparse or contradictory.
- Steps and ingredients are mixed together.
- Content includes storytelling + recipe details in one block.
- Local parser confidence score is below threshold (example: < 0.65).

## When local parsing should be used instead

Use local-only extraction when:

- Clean headings are present (ingredients/instructions/notes).
- Enough content appears in the expected fields.
- Field-level confidence is high and no obvious ambiguity exists.

This avoids unnecessary API calls and keeps import near-instant.

## Fallback strategy

Use a staged fallback:

1. **Local parse only** (best case).
2. **Single AI extraction call** if local is weak.
3. If AI fails (timeout/invalid JSON), fall back to local draft + warning.
4. If AI partially succeeds, keep partial result and mark uncertain fields for review.

Never block user from continuing; always provide editable draft.

---

## 2) Cost optimization

## Recommended OpenAI model strategy

For this project, use a **two-tier model plan**:

- **Primary extractor model:** a low-cost, fast small model (for most imports).
- **Fallback extractor model:** a stronger model only when the small model is low-confidence or malformed.

Why this fits recipe extraction:

- Most recipe extraction tasks are structured transformation, not deep reasoning.
- Small models are often sufficient after good preprocessing.
- Escalation to a larger model can be rare and controlled.

(Choose exact model names from currently available OpenAI catalog at implementation time.)

## Token reduction strategies

- Send **cleaned text**, not raw paste.
- Cap maximum input length (e.g., first N useful lines/characters after cleaning).
- Remove repeated boilerplate and emoji-only lines.
- Use concise system instructions and strict JSON output format.
- Request only needed fields (no prose explanation).

## Preprocessing ideas that reduce cost

- Strip hashtags, follow/share CTAs, long comment threads copied into post text.
- Remove duplicate lines and repeated separators.
- Keep extracted URLs outside model input when possible (pass separately as metadata).

## Caching ideas

Use server-side cache keyed by normalized input hash:

- `cacheKey = sha256(normalizedText + sourceUrl + schemaVersion)`
- Cache successful extraction JSON and confidence metadata.
- TTL can be long for personal app usage (e.g., 30–90 days).
- Invalidate cache when schema version changes.

This prevents paying twice for the same pasted recipe.

## Retry and error handling

- Timeout each AI request.
- Retry at most once on transient failures.
- Do **not** retry on validation failures repeatedly; escalate model once at most.
- Record failure reason categories: timeout, network, invalid JSON, low confidence.

## Avoiding unnecessary API calls

- Gate with local confidence first.
- Debounce imports so only explicit “Extract” triggers call.
- Never call AI on every keystroke.
- Skip AI for very short inputs that cannot contain recipe content.

---

## 3) Input preprocessing

## What to remove before sending to AI

- Social handles and mention-only lines (`@...`) when non-instructional.
- CTA boilerplate: “like/share/follow/save this post”.
- Engagement bait and giveaway text.
- Hashtag-only lines and emoji-only clusters.
- Duplicate decorative separators (`---`, `***`, repeated emojis).

## Social-media noise filtering

Heuristics:

- Remove lines with high symbol/emoji ratio and no ingredient verbs/numbers.
- Remove lines matching common CTA phrases in English/Hebrew.
- Preserve lines containing quantities, units, or cooking verbs.

## Heading detection

Detect likely sections from English + Hebrew heading aliases:

- Ingredients / מצרכים / רכיבים
- Instructions / Directions / Method / הוראות / אופן הכנה
- Notes / Tips / הערות / טיפים
- Source / Link / URL / מקור

Keep this local and cheap before AI.

## URL extraction

- Extract first URL and section-specific URL candidates locally.
- Pass source URL separately to schema.
- Remove tracking query params where practical for deduping.

## Hebrew/English handling

- Keep existing RTL/LTR direction detection in UI.
- During preprocessing, keep original text order; do not transliterate.
- Include language hint in AI request metadata (`he`, `en`, or `mixed`) based on character distribution.

---

## 4) Output design

## Recommended structured JSON schema

Return a strict object like:

- `title: string`
- `ingredients: string[]`
- `instructions: string[]`
- `notes: string`
- `sourceUrl: string`
- `servings: number | null`
- `tags: string[]`
- `languageHint: "he" | "en" | "mixed" | "unknown"`
- `confidence: { overall: number, title: number, ingredients: number, instructions: number, notes: number }`
- `uncertainFields: string[]`
- `warnings: string[]`

Then map arrays to the app’s current multiline string fields for compatibility.

## Confidence and fallback handling

- Use field-level confidence values.
- If `overall` is low, keep local parse as baseline and overlay only high-confidence fields.
- Add warnings when sections are inferred or possibly incomplete.

## Handling uncertain fields safely

- Never invent specifics (times, temperatures, quantities) unless present.
- Prefer empty field + warning over hallucinated details.
- Mark uncertain fields for user review highlighting.

---

## 5) User experience

## Review-before-save flow

1. User clicks **Extract draft**.
2. Show loading state.
3. Present editable form with extracted fields.
4. Show small extraction summary:
   - source (local vs AI)
   - confidence badge
   - warnings for uncertain fields
5. User edits and saves.

## Loading and error UX

- Loading text: “Extracting recipe draft…”
- On error: preserve pasted text and show retry option.
- Provide fallback draft from local parse even if AI fails.

## Partial extraction behavior

- Populate known fields first.
- Leave unknown fields empty with placeholders.
- Keep save enabled after user review.

---

## 6) Security

## Environment variables

- Store API key only in server environment variables (e.g., `.env.local` server-side).
- Never expose keys in client bundles.

## Server-side API usage

- Route all OpenAI calls through a server endpoint / server action.
- Client sends raw pasted text to your server; server calls OpenAI.

## Protecting API keys

- No key in browser localStorage.
- No key in frontend code.
- Log only redacted request metadata (not full sensitive text unless user consents).

---

## 7) Future extensibility

## OCR / image import

- Add optional image upload + OCR pre-step.
- Feed OCR text into same preprocessing + extraction pipeline.

## Ingredient scaling support

- Later parse structured ingredient entries:
  - amount
  - unit
  - item
- This enables automatic scaling beyond current multiplier helper.

## Multilingual recipes

- Expand heading dictionaries beyond Hebrew/English.
- Keep language hint + direction handling field-aware.

## Structured ingredient parsing

- Add secondary parser (local or AI) for line-by-line normalization.
- Keep original ingredient line for transparency.

---

## Practical implementation plan (small steps)

1. Add preprocessing + confidence scoring locally (no API yet).
2. Add server endpoint for AI extraction behind feature flag.
3. Add schema validation and fallback merge.
4. Add cache by normalized text hash.
5. Add confidence/warnings UI badges in import review.

This stepwise approach keeps risk and cost low while improving extraction quality incrementally.
