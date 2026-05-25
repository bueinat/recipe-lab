# Recipe Lab

A minimal Next.js recipe app built with TypeScript, Tailwind CSS, and the App Router.

Recipe Lab is currently a local-first prototype.

Recipe Lab stores recipes in React local state and saves them to `localStorage` in the browser. There is no database yet, so recipes stay on the same device and browser.

## Features

- Browse, search, filter, and sort a small mock recipe collection
- Add a new recipe from the homepage or navigation
- Import a draft recipe from pasted text with AI extraction, local preprocessing, confidence scoring, and review
- Keep recipe changes after refresh with browser `localStorage`
- View recipe details
- Add cooking notes to a recipe log
- Save recipe versions and adaptations
- Preview a simple serving-size multiplier on recipe details
- Edit an existing recipe
- Track title, image URL, servings, ingredients, instructions, notes, cooking notes, versions, tags, source URL, status, and rating

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## AI recipe import

Recipe imports use AI extraction after local cleanup of pasted text. Create `.env.local` in the project root to enable imports:

```bash
OPENAI_API_KEY=your_api_key_here
```

Restart the development server after adding the key. `.env.local` is ignored by git via `.env*.local`. Without `OPENAI_API_KEY`, the rest of the app still works, but AI recipe import will show a setup message instead of extracting a draft.

## Useful scripts

- `npm run dev` - start the local development server
- `npm run build` - create a production build
- `npm run start` - run the production build
- `npm run typecheck` - check TypeScript types
