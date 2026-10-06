# Arnold Fit v2

An installable, offline-first PWA for Christopher's hybrid training plan (Oct 5 → Dec 31, 2026).
It's plain static files (vanilla JS, no build step, no backend). All data lives in `localStorage` under the key `arnoldfit.v1`, and v1 data is migrated in place. Back it up from Settings → Export.

**Live:** https://bushc0728.github.io/arnold-fit/

## What's inside
- **Onboarding quiz** runs on first launch and can be retaken from Settings. It covers style, goals, stats, equipment, schedule, injuries and diet, and drives the weekly template, exercise picks, knee rules, kcal and protein. The defaults reproduce the original 13-week plan (2,450 kcal / 190 g).
- **Today:**
  - daily KJV verse: 129 entries, no repeats until every verse has been shown, ♥ to save, link to BibleGateway
  - session card with a "Why" science note and per-exercise 🎯 next targets
  - banners for skipped sessions and days off
  - habits per date, with streaks and a heatmap
  - fuel summary
- **Train:**
  - week schedule with Start / Move / Skip
  - knee-rule checks on every move: no running the day before hockey, no hard lower-body work within 48 h of hockey, one new impact stressor per week
  - program, blocks, and all weeks
- **Workout (Fitbod-style):**
  - per-set weight × reps + optional RPE
  - add, remove or skip sets and exercises; extra sets are labelled
  - swaps (optionally saved as the default), rest timer, PRs
  - after a session, next targets are computed per exercise:
    - top of the range on all planned sets → add weight (upper +5, lower +10, DB +5 / 2.5)
    - within the range → +1 rep
    - missed the bottom of the range or did fewer sets → hold
  - targets are prefilled on the next session
- **Coach chat** (💬 on every screen and in the workout): plain-language edits to the current or most recent session, each with Undo. Examples:
  - `bench 185 for 5, 5, 4`
  - `I only did 2 sets of bench`
  - `add a set of pull-ups 8 reps`
  - `remove a set of rows`
  - `swap the leg press for step-ups` (offers "Make it my default")
  - `skip laterals today` / `unskip laterals`
  - `skip today`
  - `move today to Thursday`
  - `what's my target for RDL`
  - `undo`
  - `help`
- **Food:**
  - quick-add college foods
  - custom foods (saved and editable)
  - breakfast / lunch / dinner / snack checklist
  - kcal and protein bars against your targets
  - browse and edit past days
- **Fuel:**
  - motivation videos in Discipline / Hockey / Triathlon-Ironman / Faith, plus your own categories
  - paste a YouTube link: it gets the thumbnail and tries to fetch the title via oEmbed (you can edit it)
  - "Find similar" opens a YouTube search
  - your saved verses
- **Progress:** weight trend and projection, calorie auto-adjust, waist, e1RM, cardio against the plan, habits, knee pain, test days.

## Run locally
    python3 -m http.server 8765   # then open http://localhost:8765
To preview any date, add `?date=2026-11-18`.

## Deploy
GitHub Pages serves `master` from `/`. Commit and push, and Pages rebuilds automatically.
When you change files, bump `CACHE` in `sw.js` so installed copies update.
