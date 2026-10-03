# FutureSpin — design

A tech-topic slot machine that helps you learn the technologies that are about to matter,
inspired by the lever-and-reel interaction of speechtopicgen.com (own visual design and code).

## Goals
- Make learning hot/future tech feel like a game you want to come back to.
- Topics cover AI & Agents (weighted ~35%), Cloud & DevOps, Data, Security, Quantum & Emerging.
- Picked topics leave the pool; every 3 days a fresh batch replaces them.

## Architecture
Static site, no build step, no backend. Plain HTML/CSS/JS (classic scripts, so `index.html`
also works when opened directly). State lives in `localStorage`.

| File | Responsibility |
|------|----------------|
| `js/topics.js` | Curated library (~150 topics) + area/depth metadata |
| `js/batch.js` | Pure logic: batch calendar, batch building, picks, vault, XP, streaks |
| `js/radar.js` | Live Radar: fetch + classify trending Hacker News stories, 3h cache |
| `js/effects.js` | WebAudio sounds + canvas confetti |
| `js/app.js` | UI wiring: lever, reel, card, tray, timers, modals |
| `tests/` | Browser-run unit tests for `batch.js` and the library |

## Batch rules
- The batch calendar is anchored to your first visit (local days). Batch N covers days
  `anchor + 3N … anchor + 3N + 2`; a countdown shows time to the next one.
- A batch holds 36 topics. Quotas follow area weights (AI 36%, others 16% each → 13 AI topics of 36).
  Topics never shown in an earlier batch are preferred; hotter topics are more likely.
- **Pick it** → topic goes to My Picks and leaves the spin pool. **Remove** puts it back.
  **Skip** hides it for the rest of the batch. **Learned ✓** marks it done.
- When a batch ends, all picks move to the Knowledge Vault and are retired forever
  (they never return to the pool). The new batch refills with fresh topics.
- If you were away for several batches, one rollover happens to the current batch.
- Live Radar stories can be picked too; they follow the same pick → vault flow.

## Engagement
- Lever: drag, click, Space, or mobile Spin button. Idle lever wiggles with a "Pull me" hint.
- Reel decelerates with a bounce, ticks as rows pass, chimes on land, confetti on 5🔥 topics.
- Topic card: hype 1–5🔥, mainstream ETA, why it will boom, 3 concepts, 60-second explain
  challenge (timer), 15-minute focus timer, search links (YouTube, web, arXiv, GitHub).
- Daily streak (any learning activity), XP + levels (Explorer → Futurist), batch goal
  (learn 3 per batch), learning-technique cards (Feynman, What·Why·How·Where,
  Adopt/Trial/Assess/Hold, 1-3-1).
- "Talk smarter" section for recording explainer videos, based on Matt Abrahams' talk
  *Think Faster, Talk Smarter*: 6 speaking habits plus fill-in script templates (full video,
  What·So what·Now what, Problem·Solution·Benefit, Past·Present·Future). Copy fills in the current topic.

## Visual design (hybrid)
- Calm light page: white background, near-black text, gray `#646f79` secondary text, soft gray
  panels, pill buttons, 8px spacing grid, 100–300ms ease-in-out transitions, Helvetica Neue stack.
- The slot machine is the one dark, colorful, animated element (long bouncy spin, lever, bulbs, confetti).
- Single status line (batch · topics left · countdown) and a daily streak nudge under the headline.
- Filters are two native dropdowns; trending stories are a calm list (6 shown, "Show all").
- Wide screens: main column + slim picks rail. Phones: one column, a bottom quick bar
  (Spin + Picks) once the machine scrolls away, and dialogs as bottom sheets.

## Error handling
- Corrupt/missing storage → fresh state. Radar fetch failure → strip hides itself.
- Empty filtered pool → message offering to widen filters / restore skipped topics.
- Exhausted library → celebration state; radar still works.

## Testing
- `tests/index.html` runs unit tests for `batch.js` (calendar, quotas, rollover, retire,
  weighting, exhaustion) and validates the topic library. Runs in headless Chromium.
- Manual/automated browser check of spin → pick → learn → rollover.
