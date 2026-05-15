# Recipe Lab

A minimal Next.js recipe app built with TypeScript, Tailwind CSS, and the App Router.

Recipe Lab stores recipes in React local state and saves them to `localStorage` in the browser. There is no database yet, so recipes stay on the same device and browser.

## Features

- Browse, search, filter, and sort a small mock recipe collection
- Add a new recipe from the homepage or navigation
- Import a draft recipe from pasted text with mocked section detection and review
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

## Useful scripts

- `npm run dev` - start the local development server
- `npm run build` - create a production build
- `npm run start` - run the production build
- `npm run typecheck` - check TypeScript types
