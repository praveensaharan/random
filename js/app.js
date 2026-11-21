/*
 * FutureSpin UI — wires the lever, reel, topic card, picks tray, timers, vault and radar
 * to the pure batch engine in batch.js.
 */
(function () {
  'use strict';

  const B = window.FSBatch;
  const LIB = window.FS_TOPICS;
  const AREAS = window.FS_AREAS;
  const DEPTHS = window.FS_DEPTHS;
  const Radar = window.FSRadar;
  const Fx = window.FSFx;

  const STORE_KEY = 'futurespin:v1';
  const params = new URLSearchParams(location.search);
  const dayOffset = parseInt(params.get('dayOffset') || '0', 10) || 0; // preview future days: ?dayOffset=3
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = sel => document.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const now = () => new Date(Date.now() + dayOffset * 864e5);
  const today = () => B.dayNumber(now());
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const sample = (arr, n) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n);
  };

  // ---------- persistence ----------
  function loadState() {
    try { return B.normalizeState(JSON.parse(localStorage.getItem(STORE_KEY))); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode / full */ }
  }

  let state = loadState();
  const firstVisit = !state;
  if (!state) state = B.createState(LIB, today());
  const bootRoll = B.ensureCurrentBatch(state, LIB, today());
  save();

  const ui = { current: null, spinning: false, hasSpun: false, reel: [], radarItems: [] };
  Fx.sound.setEnabled(state.settings.sound);

  // ---------- content helpers ----------
  const TRICKS = {
    feynman: {
      name: 'Feynman technique', hint: 'Teach it to a 12-year-old',
      steps: ['<b>Pick</b> the concept and write its name down.', '<b>Explain</b> it in plain words, as if to a kid.', '<b>Spot the gaps</b>: where did you stall or use jargon?', '<b>Simplify</b> with an analogy, then explain again.']
    },
    www: {
      name: 'What, why, how, where', hint: 'The 4-part tech explainer',
      steps: ['<b>What</b> is it, in one sentence?', '<b>Why now</b>: what changed to make it hot?', '<b>How</b> does it work? Name the key mechanism.', '<b>Where</b> would it fit in your projects or clients?']
    },
    radar: {
      name: 'Adopt, trial, assess, hold', hint: 'Place it on your tech radar',
      steps: ['<b>Adopt</b>: proven, use it now.', '<b>Trial</b>: worth a real pilot project.', '<b>Assess</b>: explore and keep watching.', '<b>Hold</b>: not yet; say what would change your mind.']
    },
    oto: {
      name: '1-3-1', hint: 'Headline, proof, action',
      steps: ['<b>1 line</b>: your headline about the topic.', '<b>3 points</b>: facts or examples that back it up.', '<b>1 action</b>: what you or your team should do next.']
    }
  };

  const CHALLENGES = [
    { text: t => `Explain ${t} to a client executive: what it is, why now, and one business win.`, trick: 'www' },
    { text: t => `Pitch ${t} to your team: should we pilot it this quarter? Pick a ring and defend it.`, trick: 'radar' },
    { text: t => `Explain ${t} so a 12-year-old gets it. No jargon allowed.`, trick: 'feynman' },
    { text: t => `Predict it: where will ${t} be in 2030, and whose job changes first?`, trick: 'oto' },
    { text: t => `Devil's advocate: name the biggest risk of ${t}, then argue why it still wins.`, trick: 'oto' },
    { text: t => `Whiteboard it: how does ${t} actually work, in 3 steps?`, trick: 'feynman' }
  ];

  const challengeFor = topic => CHALLENGES[hash(topic.id) % CHALLENGES.length];

  // Speaking templates (Matt Abrahams, "Think Faster, Talk Smarter"). [brackets] are blanks; [topic] is auto-filled on copy.
  const SCRIPTS = {
    video: {
      name: 'Full video script', hint: 'Hook, what, so what, now what',
      parts: [
        ['Hook (first 10 seconds)', 'Have you ever [problem your viewer faces]? In the next [X] minutes you\'ll learn how to [result].'],
        ['Intro', 'Hi, I\'m [name]. I [your experience with this topic]. Today I\'ll cover [point 1], [point 2] and [point 3].'],
        ['What', 'So, what is [topic]? Simply put, it\'s [one-line definition]. Think of it like [everyday comparison].'],
        ['So what', 'Why should you care? Because [problem it solves]. Without it, [what goes wrong]. With it, [benefit]. For example, [real story from your work].'],
        ['Now what', 'Here\'s how to get started: first [action], then [action], then [action]. A common mistake is [mistake], so [tip to avoid it].'],
        ['Recap', 'Quick recap: [topic] is [what], it matters because [so what], and you can start by [now what].'],
        ['Call to action', 'Try [one small action] today. If this helped, [like / subscribe / comment your question].']
      ]
    },
    swn: {
      name: 'What, so what, now what', hint: 'The 60-second answer',
      parts: [
        ['What', '[topic] is [one-line definition].'],
        ['So what', 'It matters because [problem it solves or benefit].'],
        ['Now what', 'To get started, [first step].']
      ]
    },
    psb: {
      name: 'Problem, solution, benefit', hint: 'Pitch a tool or a fix',
      parts: [
        ['Problem', 'A lot of teams struggle with [problem]. It causes [pain].'],
        ['Solution', 'The fix is [topic]. It works like this: [step 1], [step 2], [step 3].'],
        ['Benefit', 'Once you do this, you\'ll [save time / avoid errors / get result].']
      ]
    },
    ppf: {
      name: 'Past, present, future', hint: 'Tell the story of how it changed',
      parts: [
        ['Past', 'Before [topic], [how things used to be done].'],
        ['Present', 'Now, [what changed] because [reason].'],
        ['Future', 'Next, [where this is heading], so [what you should do].']
      ]
    }
  };

  function searchLinks(topic) {
    const q = encodeURIComponent(topic.title);
    return [
      ['▶', 'YouTube', `https://www.youtube.com/results?search_query=${encodeURIComponent(topic.title + ' explained')}`],
      ['🔎', 'Web', `https://www.google.com/search?q=${q}`],
      ['🧪', 'Papers', `https://scholar.google.com/scholar?q=${q}`],
      ['💻', 'GitHub', `https://github.com/search?q=${q}&type=repositories`]
    ];
  }

  // ---------- toasts & pops ----------
  function toast(msg, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    el.className = 'toast' + (o.big ? ' big' : '');
    el.textContent = msg;
    const box = $('#toasts');
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, o.ms || 3200);
  }

  function xpPop(amount) {
    const r = $('#level').getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'xp-pop';
    el.textContent = '+' + amount + ' XP';
    el.style.left = (r.left + r.width / 2) + 'px';
    el.style.top = (r.bottom + 4) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function announce(msg) { $('#announcer').textContent = msg; }

  // Compare progress before/after an action and celebrate what changed.
  function snapshot() {
    const xp = B.xpOf(state);
    return { xp, rank: B.levelFor(xp).rank, streak: B.currentStreak(state, today()), learned: B.batchProgress(state).learned };
  }
  function celebrate(before) {
    const after = snapshot();
    renderHeader();
    if (after.xp > before.xp) xpPop(after.xp - before.xp);
    if (after.rank > before.rank) {
      const lvl = B.levelFor(after.xp);
      Fx.sound.jackpot();
      Fx.burst(innerWidth / 2, innerHeight * 0.35, 160, 1.3);
      toast(`Level up! You're now a ${lvl.name}.`, { big: true, ms: 4200 });
      bump($('#level'));
    }
    if (after.streak > before.streak) {
      toast(after.streak === 1 ? 'Streak started. Come back tomorrow to grow it!' : `${after.streak}-day streak! Keep it alive tomorrow.`);
      bump($('#streak'));
    }
    if (before.learned < B.BATCH_GOAL && after.learned >= B.BATCH_GOAL) {
      Fx.burst(innerWidth / 2, innerHeight * 0.4, 200, 1.4);
      toast("Batch goal crushed. You're ahead of the curve!", { big: true, ms: 4500 });
    }
  }

  // ---------- header ----------
  const SOUND_ON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const SOUND_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function renderHeader() {
    const streak = B.currentStreak(state, today());
    const streakEl = $('#streak');
    $('#streakCount').textContent = streak;
    streakEl.classList.toggle('alive', streak > 0);
    streakEl.classList.toggle('cold', streak === 0);
    const xp = B.xpOf(state);
    const lvl = B.levelFor(xp);
    $('#levelName').textContent = lvl.name;
    $('#xpFill').style.width = Math.round(lvl.progress * 100) + '%';
    $('#xpText').textContent = lvl.next ? `${xp} / ${lvl.next.min} XP` : `${xp} XP`;
    $('#level').title = lvl.next ? `${xp} XP, ${lvl.next.min - xp} more to reach ${lvl.next.name}` : `${xp} XP, max level`;
    const sb = $('#soundBtn');
    sb.innerHTML = state.settings.sound ? SOUND_ON : SOUND_OFF;
    sb.setAttribute('aria-pressed', String(state.settings.sound));
    renderNudge(streak);
  }

  // One line under the headline that gives a reason to come back today.
  function renderNudge(streak) {
    const doneToday = state.streak.lastDay === today();
    $('#nudge').textContent = doneToday
      ? `You learned today, so your ${streak}-day streak is safe. See you tomorrow!`
      : streak > 0
        ? `Learn one topic today to keep your ${streak}-day streak alive.`
        : 'Start a streak today: learn one topic or finish a 60-second challenge.';
  }

  // ---------- filters ----------
  const AREA_OPTS = [['random', 'Random mix']].concat(Object.keys(AREAS).map(k => [k, AREAS[k].label]));
  const DEPTH_OPTS = [['any', 'Any depth']].concat(Object.keys(DEPTHS).map(k => [k, DEPTHS[k].label]));

  function renderOptions(select, opts, value) {
    select.innerHTML = opts.map(([v, label]) =>
      `<option value="${v}"${v === value ? ' selected' : ''}>${esc(label)}</option>`
    ).join('');
  }
  function renderFilters() {
    renderOptions($('#areaSelect'), AREA_OPTS, state.settings.area);
    renderOptions($('#depthSelect'), DEPTH_OPTS, state.settings.depth);
  }
  function filtersActive() { return state.settings.area !== 'random' || state.settings.depth !== 'any'; }
  function currentPool() { return B.spinPool(state, LIB, state.settings); }

  // ---------- batch panel ----------
  function renderBatch() {
    $('#batchNo').textContent = '#' + (state.batch.index + 1);
    const p = B.batchProgress(state);
    $('#goalText').textContent = `${p.learned} / ${p.goal} learned`;
    $('#goalFill').style.width = Math.min(100, Math.round(p.learned / p.goal * 100)) + '%';
    const crushed = p.learned >= p.goal;
    $('#goal').classList.toggle('crushed', crushed);
    $('#goalNote').textContent = crushed
      ? 'Goal crushed! Every extra topic now is pure edge.'
      : p.picked > p.learned
        ? `${p.picked - p.learned} pick${p.picked - p.learned > 1 ? 's' : ''} waiting. Tick them off as you learn.`
        : 'Learn 3 topics this batch to stay ahead of the curve.';
    renderPoolInfo();
  }

  function renderPoolInfo() {
    const total = B.spinPool(state, LIB, {}).length;
    const pool = currentPool().length;
    $('#poolInfo').textContent = filtersActive()
      ? `${pool} of ${total} left match your filters`
      : `${total} of ${state.batch.ids.length} topics left`;
  }

  function tickCountdown() {
    let ms = B.msUntilNextBatch(state, now());
    if (ms <= 0) { checkRollover(); ms = B.msUntilNextBatch(state, now()); }
    const s = Math.floor(ms / 1000);
    const pad = n => String(n).padStart(2, '0');
    const d = Math.floor(s / 86400);
    const text = (d ? d + 'd ' : '') + pad(Math.floor(s / 3600) % 24) + 'h ' + pad(Math.floor(s / 60) % 60) + 'm ' + pad(s % 60) + 's';
    const el = $('#countdown');
    el.textContent = text;
    el.classList.toggle('soon', s < 6 * 3600);
  }

  function checkRollover() {
    const r = B.ensureCurrentBatch(state, LIB, today());
    if (!r.rolled) return;
    save();
    ui.current = null;
    renderAll();
    idleReel();
    announceRollover(r);
  }

  function announceRollover(r) {
    const moved = r.moved ? ` Your ${r.moved} pick${r.moved > 1 ? 's' : ''} moved to the Vault.` : '';
    setTimeout(() => {
      Fx.burst(innerWidth / 2, innerHeight * 0.3, 140, 1.2);
      toast(`Batch #${r.index + 1} just dropped: ${state.batch.ids.length} fresh hot topics!${moved}`, { big: true, ms: 5500 });
    }, 500);
  }

  // ---------- picks tray ----------
  function pickRow(p, inVault) {
    const title = p.source === 'radar'
      ? `<a class="pick-title" href="${esc(p.url)}" target="_blank" rel="noopener" title="${esc(p.title)}">${esc(p.title)}</a>`
      : `<button type="button" class="pick-title" data-open="${esc(p.id)}" title="${esc(p.title)}">${esc(p.title)}</button>`;
    const remove = inVault ? '' : `<button type="button" class="pick-x" data-remove="${esc(p.id)}" aria-label="Remove ${esc(p.title)} from picks" title="Remove (puts it back in the machine)">✕</button>`;
    return `<li class="pick${p.learned ? ' learned' : ''}">
      <label class="check" title="Mark as learned"><input type="checkbox" data-learn="${esc(p.id)}" ${p.learned ? 'checked' : ''} aria-label="Learned: ${esc(p.title)}"><span></span></label>
      ${title}${remove}
    </li>`;
  }

  function renderPicks() {
    const list = $('#picksList');
    list.innerHTML = state.picks.length
      ? state.picks.map(p => pickRow(p, false)).join('')
      : '<li class="picks-empty">No picks yet. Pull the lever and pick what excites you.</li>';
    $('#picksCount').textContent = state.picks.length;
    $('#mbPicksCount').textContent = state.picks.length;
    $('#vaultCount').textContent = state.vault.length;
  }

  // ---------- topic card ----------
  function renderCard(topic, opts) {
    const o = opts || {};
    const card = $('#card');
    card.classList.remove('reveal');
    if (!topic) { renderEmptyCard(o.reason); }
    else {
      const area = AREAS[topic.area];
      const depth = DEPTHS[topic.depth];
      const ch = challengeFor(topic);
      const trick = TRICKS[ch.trick];
      const picked = B.isPicked(state, topic.id);
      card.style.setProperty('--c', area.color);
      card.innerHTML = `
        <div class="card-meta">
          <span class="tag area">${esc(area.label)}</span>
          <span class="tag">${esc(depth.label)}</span>
          <span class="heat">Hype <b>${topic.heat}</b> of 5</span>
          <span class="eta">Mainstream: <b>${esc(topic.eta)}</b></span>
        </div>
        <h2 class="card-title">${esc(topic.title)}</h2>
        <p class="why">${esc(topic.why)}</p>
        <div class="learn">
          <h3 class="minor-head">Learn these 3 things</h3>
          <ol class="learn-list">${topic.learn.map(l => `<li>${esc(l)}</li>`).join('')}</ol>
        </div>
        <div class="challenge">
          <div>
            <h3 class="minor-head">60-second challenge</h3>
            <p>${esc(ch.text(topic.title))}</p>
            <small>Tip: use the ${esc(trick.name)} trick.</small>
          </div>
          <button type="button" class="btn secondary" data-act="explain">Start 60s</button>
        </div>
        <div class="actions">
          ${picked
            ? '<button type="button" class="btn done" disabled>✓ In My Picks</button>'
            : '<button type="button" class="btn primary" data-act="pick">Pick it</button>'}
          <button type="button" class="btn secondary" data-act="spin">Spin again</button>
          <span class="quiet">
            ${picked
              ? '<button type="button" class="text-btn" data-act="unpick">Put back</button>'
              : '<button type="button" class="text-btn" data-act="skip">Skip</button>'}
            <button type="button" class="text-btn" data-act="share">Share</button>
            <button type="button" class="text-btn" data-act="focus">15-min focus</button>
          </span>
        </div>
        <p class="resources">Go deeper:
          ${searchLinks(topic).map(([, label, href]) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`).join('')}
        </p>`;
    }
    if (o.reveal && !reduceMotion) { void card.offsetWidth; card.classList.add('reveal'); }
  }

  function renderEmptyCard(reason) {
    const card = $('#card');
    card.style.setProperty('--c', 'var(--m-violet)');
    const skipped = state.batch.skipped.length;
    const bringBack = skipped ? `<button type="button" class="btn secondary" data-act="restore">Bring back ${skipped} skipped</button>` : '';
    if (reason === 'filtered') {
      card.innerHTML = `<div class="card-empty">
        <h2>Nothing left for these filters</h2>
        <p>You've worked through every matching topic in this batch. Widen the filters or come back when the next batch drops.</p>
        <div class="actions"><button type="button" class="btn primary" data-act="reset-filters">Reset filters</button>${bringBack}</div></div>`;
    } else if (reason === 'cleared') {
      card.innerHTML = `<div class="card-empty">
        <h2>You cleared this batch!</h2>
        <p>Every topic is picked or skipped. Fresh hot topics drop when the countdown hits zero, so check what's trending meanwhile.</p>
        <div class="actions">${bringBack}</div></div>`;
    } else {
      card.innerHTML = `<div class="card-empty">
        <h2>Your next edge is one pull away</h2>
        <p>This batch has ${state.batch.ids.length} hot tech topics, weighted toward AI. Pull the lever and see what you land.</p>
        <div class="steps">
          <span class="step"><b>1</b>Pull the lever</span>
          <span class="step"><b>2</b>Pick what excites you</span>
          <span class="step"><b>3</b>Explain it in 60s</span>
        </div></div>`;
    }
  }

  // ---------- reel ----------
  const strip = $('#reelStrip');
  const reelWindow = $('#reelWindow');
  const machine = $('#machine');
  const spinBtn = $('#spinBtn');

  function reelItem(t) {
    const a = AREAS[t.area];
    return `<div class="reel-item" style="--c:${a.color}"><span class="reel-tag">${esc(a.short)}</span><span class="reel-text">${esc(t.title)}</span></div>`;
  }
  function setReel(items) {
    strip.getAnimations().forEach(a => a.cancel());
    ui.reel = items;
    strip.innerHTML = items.map(reelItem).join('');
  }
  function fillers(n, excludeId) {
    const pool = currentPool();
    const src = (pool.length >= 8 ? pool : LIB).filter(t => t.id !== excludeId);
    const out = [];
    while (out.length < n) out.push.apply(out, sample(src, Math.min(src.length, n - out.length)));
    return out;
  }
  function idleReel() { setReel(fillers(3)); }

  function spin() {
    if (ui.spinning) return;
    const pool = currentPool();
    const target = B.chooseTopic(pool, {
      area: state.settings.area,
      avoidId: ui.current && ui.current.id,
      seen: new Set(state.batch.seen)
    });
    if (!target) {
      Fx.sound.nope();
      machine.classList.remove('shake'); void machine.offsetWidth; machine.classList.add('shake');
      renderCard(null, { reason: filtersActive() && B.spinPool(state, LIB, {}).length ? 'filtered' : 'cleared', reveal: true });
      return;
    }
    ui.spinning = true;
    ui.hasSpun = true;
    $('#leverHint').classList.add('hide');
    machine.classList.add('spinning');
    machine.classList.remove('win');
    reelWindow.classList.remove('win');
    spinBtn.disabled = true;

    const h = strip.firstElementChild ? strip.firstElementChild.offsetHeight : 76;
    const head = ui.reel.length === 3 ? ui.reel : fillers(3, target.id);
    const middle = fillers(reduceMotion ? 3 : 24 + Math.floor(Math.random() * 6), target.id);
    const tail = fillers(1, target.id);
    const seq = head.concat(middle, [target], tail);
    strip.getAnimations().forEach(a => a.cancel());
    strip.innerHTML = seq.map(reelItem).join('');
    const targetIdx = head.length + middle.length;
    const end = (targetIdx - 1) * h;
    const duration = reduceMotion ? 400 : 2500 + Math.random() * 600;

    reelWindow.classList.add('spinning');
    const anim = strip.animate([
      { transform: 'translateY(0)', easing: 'cubic-bezier(.12,.6,.22,1)' },
      { transform: `translateY(${-(end + h * 0.3)}px)`, offset: 0.88, easing: 'cubic-bezier(.3,0,.3,1)' },
      { transform: `translateY(${-end}px)` }
    ], { duration, fill: 'forwards' });

    let lastRow = 0;
    const ticker = () => {
      if (anim.playState !== 'running') return;
      const m = new DOMMatrixReadOnly(getComputedStyle(strip).transform);
      const row = Math.floor(-m.m42 / h);
      if (row !== lastRow) { lastRow = row; Fx.sound.tick(); }
      requestAnimationFrame(ticker);
    };
    requestAnimationFrame(ticker);
    setTimeout(() => reelWindow.classList.remove('spinning'), duration * 0.72);

    anim.onfinish = () => {
      setReel([seq[targetIdx - 1], target, tail[0]]);
      land(target);
    };
  }

  function land(topic) {
    ui.spinning = false;
    ui.current = topic;
    machine.classList.remove('spinning');
    machine.classList.add('win');
    reelWindow.classList.add('win');
    spinBtn.disabled = false;
    B.markSeen(state, topic.id);
    save();
    renderCard(topic, { reveal: true });
    announce(`Landed on ${topic.title}. Hype ${topic.heat} of 5.`);
    if (topic.heat >= 5) {
      Fx.sound.jackpot();
      Fx.burstFrom(reelWindow, 110);
    } else {
      Fx.sound.land();
    }
    const r = $('#card').getBoundingClientRect();
    if (r.top > innerHeight * 0.75) $('#card').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  // ---------- lever ----------
  const lever = $('#lever');
  const knob = $('#leverKnob');
  const rod = $('#leverRod');
  const L = { rest: 24, max: 236, pivot: 150, p: 0, busy: false };
  const ease = {
    in: k => k * k,
    out: k => 1 - (1 - k) * (1 - k),
    elastic: k => (k === 0 || k === 1) ? k : Math.pow(2, -9 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI / 3)) + 1
  };

  function layoutLever() {
    const H = lever.clientHeight || 260;
    L.rest = 24; L.max = H - 24; L.pivot = Math.round(H * 0.58);
    lever.style.setProperty('--pivot', L.pivot + 'px');
    setLever(L.p);
  }

  // The arm pivots at the base: the knob swings toward the viewer (grows) as it passes the pivot.
  function setLever(p) {
    L.p = p;
    const y = L.rest + p * (L.max - L.rest);
    const dist = Math.abs(y - L.pivot);
    const span = Math.max(L.pivot - L.rest, L.max - L.pivot);
    const near = 1 - dist / span;
    knob.style.top = y + 'px';
    knob.style.setProperty('--s', (1 + 0.38 * near).toFixed(3));
    rod.style.top = Math.min(y, L.pivot) + 'px';
    rod.style.height = dist + 'px';
    rod.style.width = (10 * (1 + 0.35 * near)).toFixed(1) + 'px';
  }

  function animateLever(to, ms, fn) {
    return new Promise(resolve => {
      const from = L.p;
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / ms);
        setLever(from + (to - from) * fn(k));
        if (k < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  async function pullLever() {
    if (ui.spinning || L.busy) return;
    if (reduceMotion || getComputedStyle(lever).display === 'none') { spin(); return; }
    L.busy = true;
    Fx.sound.lever();
    await animateLever(1, 200, ease.in);
    spin();
    await animateLever(0, 750, ease.elastic);
    L.busy = false;
  }

  let drag = null;
  lever.addEventListener('pointerdown', e => {
    if (ui.spinning || L.busy) return;
    drag = { y0: e.clientY, p0: L.p, moved: false, fired: false };
    lever.setPointerCapture(e.pointerId);
    lever.classList.add('grabbing');
  });
  lever.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    if (Math.abs(dy) > 4) drag.moved = true;
    setLever(clamp(drag.p0 + dy / (L.max - L.rest), 0, 1));
    if (L.p >= 0.9 && !drag.fired) { drag.fired = true; Fx.sound.lever(); spin(); }
  });
  const release = async () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    lever.classList.remove('grabbing');
    if (!d.moved) { pullLever(); return; }
    L.busy = true;
    await animateLever(0, d.fired ? 750 : 420, d.fired ? ease.elastic : ease.out);
    L.busy = false;
  };
  lever.addEventListener('pointerup', release);
  lever.addEventListener('pointercancel', release);
  lever.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); pullLever(); }
  });

  // Idle invitation: wiggle the lever a few times before the first spin (never with reduced motion).
  let wiggles = 0;
  setInterval(async () => {
    if (reduceMotion || wiggles >= 3 || ui.hasSpun || ui.spinning || L.busy || drag || document.hidden) return;
    wiggles++;
    L.busy = true;
    await animateLever(0.16, 200, ease.out);
    await animateLever(0, 600, ease.elastic);
    L.busy = false;
  }, 4500);

  // ---------- actions ----------
  function doPick(item) {
    const topic = item || ui.current;
    if (!topic || B.isPicked(state, topic.id)) return;
    const before = snapshot();
    B.pick(state, topic, today());
    save();
    Fx.sound.pick();
    announce(`Added ${topic.title} to My Picks.`);
    if (!item || item === ui.current) renderCard(ui.current);
    renderPicks();
    renderBatch();
    markRadarButtons();
    bump($('#picksPanel'));
    celebrate(before);
  }

  function doUnpick(id) {
    if (!B.unpick(state, id)) return;
    save();
    announce('Back in the machine. It can land again.');
    if (ui.current && ui.current.id === id) renderCard(ui.current);
    renderPicks();
    renderBatch();
    markRadarButtons();
    renderHeader();
  }

  function doSkip() {
    if (!ui.current || ui.spinning) return;
    B.skip(state, ui.current.id);
    save();
    toast('Skipped for this batch');
    renderBatch();
    pullLever();
  }

  function doToggleLearned(id, el) {
    const before = snapshot();
    const learned = B.toggleLearned(state, id, today());
    if (learned === null) return;
    save();
    if (learned) {
      Fx.sound.learned();
      if (el) Fx.burstFrom(el, 45, 0.7);
    }
    renderPicks();
    renderBatch();
    if ($('#vaultDialog').open) renderVault();
    celebrate(before);
  }

  async function doShare(topic) {
    const text = `${topic.title}\n${topic.why}\nLearn: ${topic.learn.join(', ')}\nFound on FutureSpin`;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ title: topic.title, text }); return; }
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard. Paste it to your team!');
    } catch (e) {
      toast('Could not copy automatically. Select the card text instead.');
    }
  }

  // ---------- timers ----------
  const RING = 326.73;
  const timer = { mode: null, total: 0, remaining: 0, endAt: 0, running: false, int: null, topic: null, lastBeep: null };
  const timerDialog = $('#timerDialog');

  function openTimer(mode, topic) {
    timer.mode = mode;
    timer.topic = topic;
    timer.total = mode === 'explain' ? 60e3 : 15 * 60e3;
    const ch = challengeFor(topic);
    const trick = TRICKS[mode === 'explain' ? ch.trick : 'www'];
    $('#timerKicker').textContent = mode === 'explain' ? '60-second challenge' : '15-minute focus sprint';
    $('#timerTitle').textContent = topic.title;
    $('#timerPrompt').textContent = mode === 'explain'
      ? ch.text(topic.title) + ' Talk out loud, and record yourself if you can.'
      : `Deep-learn it: ${topic.learn.join(', ')}. Use the search links, then try to explain it back.`;
    $('#timerTrick').innerHTML = `<b>${esc(trick.name)}</b><ol>${trick.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
    resetTimer();
    timerDialog.showModal();
  }

  function setTimerActions(html) { $('#timerActions').innerHTML = html; }

  function resetTimer() {
    stopTimer();
    timer.remaining = timer.total;
    timer.lastBeep = null;
    $('#ring').classList.remove('urgent', 'complete');
    setTimerActions('<button class="btn primary" id="timerStart" type="button">Start</button><button class="btn secondary" id="timerReset" type="button">Reset</button>');
    drawTimer();
  }

  function drawTimer() {
    const s = Math.ceil(timer.remaining / 1000);
    $('#timerTime').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    $('#ringFg').style.strokeDashoffset = String(RING * (1 - timer.remaining / timer.total));
    $('#ring').classList.toggle('urgent', timer.running && s <= 10 && s > 0);
  }

  function startTimer() {
    if (timer.running) { pauseTimer(); return; }
    timer.running = true;
    timer.endAt = Date.now() + timer.remaining;
    $('#timerStart').textContent = 'Pause';
    Fx.sound.beep();
    timer.int = setInterval(() => {
      timer.remaining = Math.max(0, timer.endAt - Date.now());
      const s = Math.ceil(timer.remaining / 1000);
      if (s <= 3 && s > 0 && timer.lastBeep !== s) { timer.lastBeep = s; Fx.sound.beep(); }
      drawTimer();
      if (timer.remaining <= 0) completeTimer();
    }, 200);
  }

  function pauseTimer() {
    stopTimer();
    $('#timerStart').textContent = 'Resume';
  }

  function stopTimer() {
    timer.running = false;
    clearInterval(timer.int);
    timer.int = null;
  }

  function completeTimer() {
    stopTimer();
    const before = snapshot();
    if (timer.mode === 'explain') B.addExplain(state, today()); else B.addFocus(state, today());
    save();
    Fx.sound.done();
    $('#ring').classList.remove('urgent');
    $('#ring').classList.add('complete');
    $('#timerTime').textContent = 'Done';
    Fx.burstFrom($('#ring'), 120, 1.1);
    const picked = B.isPicked(state, timer.topic.id);
    setTimerActions(
      (picked ? '' : '<button class="btn primary" type="button" data-timer="pick">Pick this topic</button>')
      + '<button class="btn secondary" type="button" data-timer="next">Spin the next one</button>'
      + '<button class="btn secondary" type="button" data-timer="again">Go again</button>'
    );
    celebrate(before);
  }

  timerDialog.addEventListener('click', e => {
    if (e.target === timerDialog || e.target.closest('[data-close]')) { timerDialog.close(); return; }
    const id = e.target.closest('button') && e.target.closest('button').id;
    if (id === 'timerStart') startTimer();
    else if (id === 'timerReset') resetTimer();
    const act = e.target.closest('[data-timer]');
    if (!act) return;
    const a = act.dataset.timer;
    if (a === 'again') resetTimer();
    else if (a === 'pick') { doPick(timer.topic); act.remove(); }
    else if (a === 'next') { timerDialog.close(); setTimeout(pullLever, 250); }
  });
  timerDialog.addEventListener('close', stopTimer);

  // ---------- vault ----------
  const vaultDialog = $('#vaultDialog');

  function renderVault() {
    const v = state.vault;
    const learned = v.filter(x => x.learned).length;
    const batches = new Set(v.map(x => x.batch)).size;
    $('#vaultStats').innerHTML = `<div><b>${v.length}</b><small>topics picked</small></div><div><b>${learned}</b><small>learned</small></div><div><b>${batches}</b><small>batches</small></div>`;
    if (!v.length) {
      $('#vaultList').innerHTML = `<p class="picks-empty">Your vault fills up as batches roll over. Picks from batch #${state.batch.index + 1} land here when its countdown ends.</p>`;
      return;
    }
    const groups = {};
    v.forEach(x => { (groups[x.batch] = groups[x.batch] || []).push(x); });
    $('#vaultList').innerHTML = Object.keys(groups).map(Number).sort((a, b) => b - a).map(b =>
      `<div class="vault-batch"><h4>Batch #${b + 1}, ${groups[b].length} topic${groups[b].length > 1 ? 's' : ''}</h4><ul>${groups[b].map(x => pickRow(x, true)).join('')}</ul></div>`
    ).join('');
  }

  function vaultMarkdown() {
    const lines = ['# My FutureSpin Knowledge Vault', ''];
    const groups = {};
    state.vault.forEach(x => { (groups[x.batch] = groups[x.batch] || []).push(x); });
    Object.keys(groups).map(Number).sort((a, b) => a - b).forEach(b => {
      lines.push(`## Batch #${b + 1}`);
      groups[b].forEach(x => lines.push(`- [${x.learned ? 'x' : ' '}] ${x.title} (${(AREAS[x.area] || AREAS.ai).label})${x.url ? ' — ' + x.url : ''}`));
      lines.push('');
    });
    return lines.join('\n');
  }

  vaultDialog.addEventListener('click', async e => {
    if (e.target === vaultDialog || e.target.closest('[data-close]')) { vaultDialog.close(); return; }
    if (e.target.closest('#vaultCopy')) {
      try { await navigator.clipboard.writeText(vaultMarkdown()); toast('Vault copied as Markdown'); }
      catch (err) { toast('Could not access the clipboard'); }
    }
  });

  // ---------- radar ----------
  const RADAR_PREVIEW = 6;

  function radarRow(it) {
    const a = AREAS[it.area];
    return `<li class="radar-row">
      <a href="${esc(it.url)}" target="_blank" rel="noopener" title="${esc(it.title)}">${esc(it.title)}</a>
      <span class="radar-meta"><span>${esc(a.short)}</span><span>▲ ${it.points}</span></span>
      <button type="button" class="btn secondary" data-radar="${esc(it.id)}" aria-label="Add “${esc(it.title)}” to My Picks">+ Pick</button>
    </li>`;
  }

  function markRadarButtons() {
    document.querySelectorAll('[data-radar]').forEach(btn => {
      const picked = B.isPicked(state, btn.dataset.radar) || state.vault.some(v => v.id === btn.dataset.radar);
      btn.disabled = picked;
      btn.textContent = picked ? '✓ Picked' : '+ Pick';
    });
  }

  function renderRadar() {
    const items = ui.radarExpanded ? ui.radarItems : ui.radarItems.slice(0, RADAR_PREVIEW);
    $('#radarList').innerHTML = items.map(radarRow).join('');
    const more = $('#radarMore');
    more.hidden = ui.radarItems.length <= RADAR_PREVIEW;
    more.textContent = ui.radarExpanded ? 'Show less' : `Show all ${ui.radarItems.length}`;
    markRadarButtons();
  }

  async function initRadar() {
    const items = await Radar.load();
    if (!items.length) return;
    ui.radarItems = items;
    renderRadar();
    $('#radar').hidden = false;
  }

  // ---------- learning tricks section ----------
  const accordion = (t, body) => `<details class="trick"><summary><span><b>${esc(t.name)}</b><small>${esc(t.hint)}</small></span></summary>${body}</details>`;

  function renderTricks() {
    $('#tricksGrid').innerHTML = Object.keys(TRICKS).map(k => {
      const t = TRICKS[k];
      return accordion(t, `<ol>${t.steps.map(s => `<li>${s}</li>`).join('')}</ol>`);
    }).join('');
  }

  // ---------- speaking templates ----------
  function renderScripts() {
    const blanks = s => esc(s).replace(/\[[^\]]+\]/g, m => `<span class="blank">${m}</span>`);
    $('#scriptsGrid').innerHTML = Object.keys(SCRIPTS).map(k => {
      const s = SCRIPTS[k];
      return accordion(s, `<div class="script">${s.parts.map(([label, line]) => `<p><b>${esc(label)}</b>${blanks(line)}</p>`).join('')}`
        + `<button type="button" class="btn secondary" data-act="copy-script" data-script="${k}">Copy template</button></div>`);
    }).join('');
  }

  async function copyScript(key) {
    const s = SCRIPTS[key];
    if (!s) return;
    const topic = ui.current && ui.current.title;
    const text = s.parts.map(([label, line]) => `${label.toUpperCase()}\n${topic ? line.split('[topic]').join(topic) : line}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast(topic ? `Copied with “${topic}” filled in` : 'Copied. Fill in the [brackets].');
    } catch (e) {
      toast('Could not access the clipboard');
    }
  }

  // ---------- events ----------
  const onFilter = () => {
    state.settings.area = $('#areaSelect').value;
    state.settings.depth = $('#depthSelect').value;
    save();
    renderPoolInfo();
  };
  $('#areaSelect').addEventListener('change', onFilter);
  $('#depthSelect').addEventListener('change', onFilter);
  $('#radarMore').addEventListener('click', () => { ui.radarExpanded = !ui.radarExpanded; renderRadar(); });

  document.addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'pick') doPick();
      else if (a === 'unpick' && ui.current) doUnpick(ui.current.id);
      else if (a === 'skip') doSkip();
      else if (a === 'spin') pullLever();
      else if (a === 'share' && ui.current) doShare(ui.current);
      else if (a === 'explain' && ui.current) openTimer('explain', ui.current);
      else if (a === 'focus' && ui.current) openTimer('focus', ui.current);
      else if (a === 'copy-script') copyScript(act.dataset.script);
      else if (a === 'reset-filters') { state.settings.area = 'random'; state.settings.depth = 'any'; save(); renderFilters(); renderPoolInfo(); pullLever(); }
      else if (a === 'restore') { const n = B.restoreSkipped(state); save(); toast(`${n} skipped topic${n > 1 ? 's are' : ' is'} back in the machine`); renderBatch(); renderCard(null); }
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) {
      const t = B.findTopic(LIB, open.dataset.open);
      if (t) {
        ui.current = t;
        if (vaultDialog.open) vaultDialog.close();
        renderCard(t, { reveal: true });
        $('#card').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) { doUnpick(rm.dataset.remove); return; }
    const rad = e.target.closest('[data-radar]');
    if (rad) {
      const it = ui.radarItems.find(x => x.id === rad.dataset.radar);
      if (it) doPick(it);
    }
  });

  document.addEventListener('change', e => {
    const box = e.target.closest('[data-learn]');
    if (box) doToggleLearned(box.dataset.learn, box);
  });

  spinBtn.addEventListener('click', pullLever);

  // Phone quick bar: appears once the machine scrolls out of view.
  const mobileBar = $('#mobileBar');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      mobileBar.classList.toggle('show', !entry.isIntersecting);
      document.body.classList.toggle('bar-on', !entry.isIntersecting);
    }, { threshold: 0.15 })
      .observe(machine);
  }
  $('#mbSpin').addEventListener('click', () => {
    machine.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setTimeout(pullLever, reduceMotion ? 0 : 450);
  });
  $('#mbPicks').addEventListener('click', () => {
    $('#picksPanel').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
  $('#soundBtn').addEventListener('click', () => {
    state.settings.sound = !state.settings.sound;
    Fx.sound.setEnabled(state.settings.sound);
    save();
    renderHeader();
    if (state.settings.sound) Fx.sound.pick();
  });
  $('#vaultBtn').addEventListener('click', () => { renderVault(); vaultDialog.showModal(); });
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all progress? Your picks, vault, XP and streak will be cleared and a new batch will start.')) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const onControl = e.target.closest('button, a');
    if (e.key === ' ' && !onControl) { e.preventDefault(); pullLever(); }
    else if ((e.key === 'p' || e.key === 'P') && ui.current && !ui.spinning) doPick();
    else if ((e.key === 's' || e.key === 'S') && ui.current && !ui.spinning) doSkip();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { checkRollover(); renderHeader(); }
  });
  window.addEventListener('resize', layoutLever);

  // ---------- boot ----------
  function renderAll() {
    renderHeader();
    renderFilters();
    renderBatch();
    renderPicks();
    renderCard(ui.current);
  }

  $('#marquee').innerHTML = Array.from({ length: 22 }, (_, i) => `<span class="bulb" style="--i:${i}"></span>`).join('');
  renderTricks();
  renderScripts();
  renderAll();
  idleReel();
  layoutLever();
  tickCountdown();
  setInterval(tickCountdown, 1000);
  initRadar();

  if (firstVisit) {
    setTimeout(() => toast(`Welcome! Batch #1 is loaded with ${state.batch.ids.length} hot topics. Pull the lever!`, { ms: 4500 }), 600);
  } else if (bootRoll.rolled) {
    announceRollover(bootRoll);
  }
})();
