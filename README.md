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

## Interview prep page

`prep.html` is the same machine loaded with 45 interview topics for **AI Engineer** and
**Forward Deployed Engineer (FDE)** roles, in 6 tracks: LLM foundations, building AI apps,
AI system design, FDE customer & delivery skills, coding rounds and behavioural stories.

Each card has the idea in plain words, real interview questions, what a strong answer covers,
a practice task, a red flag, hand-picked learning links (articles, Medium posts, videos) and a
60-second "answer out loud" timer. Add topics to your prep list and tick them off when you can
talk about them confidently.

Open a topic directly: http://localhost:8000/prep.html?topic=build-rag

## Tests

Open `tests/index.html` in a browser — it runs the batch-engine, library and interview-prep tests.

## Files

- `js/topics.js` — the topic library (158 topics; add your own rows here)
- `js/batch.js` — batch calendar, picks, vault, XP and streak logic
- `js/radar.js` — Live Radar (trending stories from the Hacker News Search API)
- `js/effects.js` — sounds and confetti
- `js/app.js` — UI wiring
- `js/prep-topics.js` — interview-prep topics and their learning links (add your own here)
- `js/prep.js` — prep logic: spin pool, weighted choice, prep list, readiness
- `js/prep-app.js` — prep page UI wiring
