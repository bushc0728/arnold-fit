# Arnold Fit

Installable, offline-first PWA for Christopher's Oct 5 → Dec 31 2026 fat-loss + strength plan.
Pure static files (vanilla JS, no build, no backend). All data lives in `localStorage`; back it up from Settings → Export.

## Run locally
    python3 -m http.server 8765   # then open http://localhost:8765
Preview any date with `?date=2026-11-18`.

## Deploy (any static host)
Upload everything except `screenshots/`. Paths are relative, so it works at a domain root or a sub-path (e.g. GitHub Pages).

GitHub Pages (after `gh auth login`):
    gh repo create arnold-fit --public --source=. --push
    gh api -X POST repos/{owner}/arnold-fit/pages -f "source[branch]=main" -f "source[path]=/"

When you change files, bump `CACHE` in `sw.js` so installed copies update.
