# kenny-cluster

Kenny Le's portfolio: career as an interactive, Kubernetes-style cluster map, with a terminal and a plain list view.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + production build to dist/
```

- All content lives in `src/data/resume.ts`; map positions are in `src/data/layout.ts`.
- Press `` ` `` for the terminal (`help` lists commands).
- Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
  (enable Pages → Source: GitHub Actions in the repo settings).
