# FutureSpin 🎰

A tech-topic slot machine: pull the lever, land on a hot, future-proof tech topic, pick it,
and explain it in 60 seconds. A fresh batch of 36 topics drops every 3 days; picked topics
move to your Knowledge Vault and never come back.

Live: https://praveensaharan.github.io/random/

## Run it

```bash
cd ~/random && python3 -m http.server 8000
```

Then open http://localhost:8000. (Opening `index.html` directly also works.)

Preview a future batch rollover: http://localhost:8000/?dayOffset=3

## Tests

Open `tests/index.html` in a browser — it runs the batch-engine and library tests.

## Files

- `js/topics.js` — the topic library (158 topics; add your own rows here)
- `js/batch.js` — batch calendar, picks, vault, XP and streak logic
- `js/radar.js` — Live Radar (trending stories from the Hacker News Search API)
- `js/effects.js` — sounds and confetti
- `js/app.js` — UI wiring
