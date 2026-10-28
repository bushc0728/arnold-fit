# Arnold Fit v2.5

An installable, offline-first PWA for Christopher's hybrid training plan (Oct 5 → Dec 31, 2026).
It's plain static files (vanilla JS, no build step, no backend). All data lives in `localStorage` under the key `arnoldfit.v1`, and v1 data is migrated in place. Back it up from Settings → Export.

**Live:** https://bushc0728.github.io/arnold-fit/

## v2.6 (Oct 27, 2026) — "simple, fun, easy, but most of all GROW ME"

- **Food tab (built-in calorie tracker, no MyFitnessPal needed):** kcal ring vs 2,550, protein vs 190 g, carbs and fat. It has Breakfast/Lunch/Dinner/Snack cards and a Day/Week view (avg kcal, avg protein, days at the protein goal).
- **Fast logging:**
  - search covering your foods, starter foods (USDA FDC values cited in `js/fooddb.js`), Open Food Facts and USDA FoodData Central (DEMO_KEY, results cached)
  - one-tap re-log from Recent and Frequent, Copy yesterday or any day, My Meals, custom foods and Quick add
  - servings in g, oz or serving with a stepper and live macros
- **Barcode scan:** the vendored ZXing library (`vendor/`) loads only when the scanner opens. You can type the barcode if the camera is unavailable.
- **Backdating** up to 7 days.
- **Food feeds the rest of the app:** totals feed the nightly kcal/protein (a typed number overrides), the protein habit auto-checks at ≥190 g, and the totals feed Progress 7-day averages.
- **Simple Today:**
  - one **▶ Start today's workout** button
  - Pick another / ⚡ Minimum day ("Something > nothing.")
  - Grow card: 🔥 streak, bench → 225 bar with level-ups, protein days, weight and waist trend, and a "you got stronger" recap
  - everything else sits in collapsed *More* sections
- **Pick today's workout:** Push, Pull, Legs, Upper, Full, Arms, Hockey, MTB, Run or Rest, with a recommendation, a 48-h legs guard and a week balance view. Minimum day counts toward the streak but not toward the 2-lift rule.
- **One-time import** of the Oct 25–27 activities, and a deload Push/Pull on Oct 28–29.
- **Hypertrophy audit:**
  - every working set is RPE 8–9
  - main lifts: top set 4–6 plus back-offs of 6–10 at −10%
  - accessories: 2–3 sets of 8–15
  - lengthened-position exercises: incline DB, overhead triceps, incline/Bayesian curls, cable laterals, seated leg curl, long-pause calves
  - rest shown per exercise
  - a *Weekly sets per muscle* view on Train
  - Nov 2+ weekly hard sets: chest 13, back 11, side delts 9.5, rear delts 7.5, biceps 10.5, triceps 12, quads 3, hams 6, glutes 4.5, calves 6 (legs low on purpose because of hockey and MTB). Every session is ≤60 min.
- **Real PRs only:** numbers saved from a prefilled target without a tap or edit are flagged and never award a PR. You can confirm them from the summary.
- **Schema v5** migrates v4 data in place. A backup is written first to `arnoldfit.v1.backup-v4`.

## v2.5 (Oct 27, 2026)
- **New plan from Nov 2** (the deload week Oct 26–Nov 1 is unchanged): Mon Upper A (heavy bench top set + back-offs) · Tue MTB · Wed short, knee-friendly Lower · Thu Upper B (shoulders/arms) · Fri Upper C (paused bench volume + back) · Sat 25–30′ run or MTB · Sun hockey. No swimming in upcoming weeks.
- **Goals through Dec 31** (Settings → Goals, coach "goals"): waist is the main metric; 210+ → ~205 lb while adding muscle; bench 225 for reps; triathlon parked. Food plan: 3 home-cooked meals × 55–60 g protein + 1 snack ≈ 190 g, no shakes; weekends keep the 3 meals; drinks ≤1 night/week (3–4), protein meal first.
- **Backdate up to 7 days:** 📅 calendar with dots on days that have logs.
- **Quick add** hockey / bike (MTB or stationary) / run / swim / walk / other, with duration, optional distance and effort 1–10. It replaces the planned session (shown as "↪ swapped") and counts for the streak and checklist. Undo is available.
- **Lift top sets:** one line per exercise (weight × reps), done by default. It feeds the bench e1RM chart and next targets.
- **One-screen nightly log** (also for past days): training done or swapped, protein yes/no, mobility, devotional, sleep, optional Calories and Protein g from MyFitnessPal (≥190 g auto-marks protein ✓), and weight.
- **Nightly prompt** in the app from 8 PM (no push notifications).
- **Weekly summary + streak** (swaps count) on Today and Progress. Progress shows 7-day calorie and protein averages next to the weight trend.
- **Training rule:** hockey or a hard ride can replace a lift; keep ≥2 lifts/week; no heavy lower body within 48 h of hard hockey or a hard ride. Shown as tips with a one-tap Move.
- **Mobile:** ≥48 px tap targets, collapsible long text, the workout first on Today, toast moved to the bottom.
- **Data safety:** schema v4. The first v2.5 launch keeps a one-time copy of the old data in `arnoldfit.v1.backup-v3`. Data that can't be parsed is saved to a rescue key and never overwritten.

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
