# Deploy

Every push to `main` runs `.github/workflows/deploy.yml`:

1. **ci** — reuses `.github/workflows/ci.yml` (`npm run check` + `npm run e2e`) via `workflow_call`.
2. **build** — `npm run build` with `VITE_BASE` and `VITE_SITE_URL` set; Vite copies
   `dist/index.html` → `dist/404.html` (SPA fallback, plugin in `vite.config.ts`); a step greps
   `dist/index.html` for sub-path asset URLs and the absolute `og:image`.
3. **deploy** — `actions/upload-pages-artifact` + `actions/deploy-pages`.

The site lives at `https://<owner>.github.io/<repo>/` (by default `/booster-cv/`).

## First time (the repo has no remote yet)

1. Create an empty GitHub repository named `booster-cv` (no README/licence, so the push is clean).
2. Push:
   ```
   git remote add origin git@github.com:<you>/booster-cv.git
   git push -u origin main
   ```
3. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
4. Re-run the `deploy` workflow (Actions tab → deploy → Run workflow) if the first push ran
   before Pages was enabled. The job summary links the URL; record it in `docs/checkpoints/M3.md`.

## Variables (optional)

Settings → Secrets and variables → Actions → **Variables**:

| Variable        | Default                            | Used for                                           |
| --------------- | ---------------------------------- | -------------------------------------------------- |
| `VITE_BASE`     | `/<repo>/`                         | Vite `base`: where assets are served from          |
| `VITE_SITE_URL` | `https://<owner>.github.io/<repo>` | absolute `og:url` / `og:image` (no trailing slash) |

Locally, `.env` sets `VITE_SITE_URL=http://localhost:5173` and `VITE_BASE` is unset (`/`).
Try a Pages-like build with `VITE_BASE=/booster-cv/ npm run build && VITE_BASE=/booster-cv/ npm run preview`
→ http://localhost:4173/booster-cv/.

## Share image

`public/og.png` (2400×1260) and `public/apple-touch-icon.png` are committed artefacts rendered
from `/dev/og`. After changing `content/meta.ts`, packs, or tokens run:

```
npm run og:render
```

and commit both PNGs. Link previews are cached by WhatsApp/LinkedIn; use LinkedIn's Post
Inspector or add `?v=2` to the shared URL to force a refresh.

## Custom domain later

1. Add `public/CNAME` containing the domain (e.g. `cv.example.nl`).
2. Set repo variables `VITE_BASE=/` and `VITE_SITE_URL=https://cv.example.nl`.
3. DNS: a `CNAME` record to `<owner>.github.io` (subdomain) or the four GitHub Pages `A` records (apex).
4. Settings → Pages → Custom domain, tick _Enforce HTTPS_ once the certificate is issued.

## Vercel or Netlify instead

1. Import the repo; framework preset **Vite**; build `npm run build`; output `dist`.
2. Set env `VITE_BASE=/` and `VITE_SITE_URL=https://<your-site-domain>`.
3. No rewrites needed: only `/` is a real route in production (`404.html` is also emitted).
4. Keep `ci.yml` as the gate (require the check on the branch); disable `deploy.yml` (delete or
   remove the `push` trigger) so two hosts don't both deploy.
5. Preview deployments per PR come for free on both hosts.
