# AI Recipe Extraction Architecture Design

## Product decision

AI is the main extraction method for imports. Local code should not try to fully parse recipes, decide whether a draft is good enough, or replace the model with a handwritten parser. Local code exists to clean pasted text, reduce token usage, preserve obvious metadata, and improve the quality of a single explicit AI extraction request.

Recipe storage remains local-first: imported recipes are still reviewed by the user and saved to browser `localStorage`. The import extraction step requires server-side OpenAI setup.

## Import pipeline

1. User pastes recipe text and optionally enters a source URL and image URL.
2. The browser sends the pasted text to a server route only when the user clicks **Extract with AI**.
3. The server runs local preprocessing:
   - normalize whitespace
   - remove obvious social noise
   - remove hashtag-only lines
   - remove follow/share/save/like CTA lines
   - remove emoji-only and decorative-only lines
   - remove ratings, sponsored, affiliate, and similar metadata when clearly irrelevant
   - extract obvious URLs and remove tracking parameters where practical
   - collect lightweight section-heading hints without parsing fields
   - cap the text sent to the model
4. The server calls OpenAI with the cleaned text, source URL hints, language hint, and optional section-heading hints.
5. OpenAI extracts structured recipe fields.
6. The server validates and sanitizes the model response.
7. The browser maps the result into the editable review form.
8. The user reviews, edits, and saves.

The flow is:

```text
raw pasted text -> local preprocessing/cleanup -> AI extraction -> editable review form -> save
```

## What local preprocessing should do

Local preprocessing should stay cheap, predictable, and conservative. It may remove lines that are clearly unrelated to the recipe, such as:

- hashtag-only lines
- follow/share/save/like calls to action
- decorative separators and emoji-only lines
- sponsored, affiliate, rating, posted-by, and comment-count metadata
- obvious URLs after extracting them as metadata

It should normalize line endings and repeated whitespace, preserve original language and text order, and cap the cleaned text length before the model request.

It may detect likely section headings such as `ingredients`, `instructions`, `method`, `notes`, `source`, or `url` as hints for the model. It should not use those headings to build a complete recipe draft locally.

## What AI should do

AI is responsible for extracting:

- `title`
- `ingredients`
- `instructions`
- `notes`
- `servings`
- `tags`
- `languageHint`
- `confidence`
- `warnings`

The prompt should stay concise and ask for strict JSON only. The model should prefer empty fields plus warnings over invented quantities, times, temperatures, or steps.

## Server-side OpenAI route

The app should call OpenAI only from a Next.js server route. The browser must never receive or use `OPENAI_API_KEY`.

The route should:

- read `OPENAI_API_KEY` from `process.env`
- return a clear setup error when the key is missing
- preprocess text before sending it to OpenAI
- use a low-cost model suitable for structured extraction
- request strict JSON with a schema
- validate and sanitize the response before returning it to the client
- avoid logging full pasted recipe text

## Model and cost strategy

Use a small, low-cost model that supports structured outputs for the first implementation. Recipe import is a bounded extraction task, so cost control should primarily come from preprocessing and input length limits rather than building a second local parser.

Cost controls:

- send cleaned text instead of raw paste
- cap model input length
- keep prompts short
- extract URLs locally and pass them as metadata
- call AI only on explicit button click
- avoid retries except for future carefully scoped transient-error handling

## UX

The import page should present AI extraction as the extraction method. It should not imply that local extraction is the main high-quality parser.

Recommended states:

- empty form with pasted text, optional source URL, optional image URL, and **Extract with AI**
- loading state while the AI request runs
- clear setup error if `OPENAI_API_KEY` is missing
- editable review form after successful extraction
- extraction summary showing source `ai`, confidence, language hint, warnings, and whether preprocessing truncated the input

The user-provided source URL and image URL should be preserved when mapping the AI response into the review form. If the user did not provide a source URL, an obvious URL detected during preprocessing may be used.

## Failure behavior

If AI extraction fails, keep the pasted text on screen and show a clear error. Do not silently fall back to a local parser that pretends to produce a complete draft.

Examples:

- Missing API key: explain that AI extraction requires `OPENAI_API_KEY` in `.env.local`.
- Not enough text: ask the user to paste more recipe content.
- Timeout or provider error: ask the user to try again later.
- Invalid model response: ask the user to try again and keep the pasted text editable.

## Future extensions

- Add server-side caching keyed by normalized cleaned text plus schema version.
- Add OCR/image import that feeds text into the same preprocessing and AI route.
- Add more multilingual section-heading hints.
- Add structured ingredient normalization as a second AI-assisted step after the editable recipe draft.
