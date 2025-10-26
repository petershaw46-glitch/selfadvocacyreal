# Self‑Advocacy Quest

A small React game to practice noticing signs to self‑advocate and choosing strategies.

Powered by Vite + React + Tailwind.

## Quick start (locally)

1. Clone or create a repo and add the files.
2. Install:
   npm install
3. Run dev server:
   npm run dev
4. Open the URL printed in the console (usually http://localhost:5173).

## Build
npm run build
Then preview:
npm run preview

## Deploy

Option 1 — Vercel (recommended)
- Push the repo to GitHub.
- Sign in to Vercel and import the repo.
- Build command: `npm run build` (Vercel auto-detects).
- Output directory: `dist`.
- Deploy — each push to main will trigger a new deployment.

Option 2 — Netlify
- Connect to the GitHub repo in Netlify.
- Build command: `npm run build`
- Publish directory: `dist`.

Option 3 — GitHub Pages
- Use a separate GH Action or the `gh-pages` package to push `dist` to the `gh-pages` branch.
- Or use a static-file host and point from GitHub Pages to that hosted build.

## Notes & small fixes applied
- Fixed template literal bugs (JSX interpolation) and some in-file syntax issues.
- Moved Tailwind `@apply` usage to `src/index.css` (it won't work inline in component).
- Keyboard accessibility preserved; everything is keyboard-operable.

## Next steps (suggested)
- Add tests and accessibility checks (e.g., axe).
- Add teacher-saved presets or server-side storage if you want progress to persist centrally.
- If you want, I can:
  - Initialize the GitHub repo for you (if you give repo details).
  - Add a GitHub Action to deploy to GitHub Pages automatically.
  - Create a Vercel / Netlify guide with screenshots for your chosen provider.

Enjoy — tell me how you'd like to deploy (Vercel, Netlify, or GH Pages) and I can prepare the exact deploy steps or create a PR with the files.