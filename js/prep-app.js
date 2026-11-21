/*
 * FutureSpin Interview Prep UI — the same lever-and-reel machine as the main page, loaded with
 * AI Engineer and FDE interview topics. Logic lives in prep.js; streak helpers come from batch.js.
 */
(function () {
  'use strict';

  const P = window.FSPrep;
  const B = window.FSBatch;
  const LIB = window.PREP_TOPICS;
  const TRACKS = window.PREP_TRACKS;
  const ROLES = window.PREP_ROLES;
  const Fx = window.FSFx;

  const STORE_KEY = 'futurespin:prep:v1';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = sel => document.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const today = () => B.dayNumber(new Date());
  const byId = new Map(LIB.map(t => [t.id, t]));
  const sample = (arr, n) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n);
  };
  const safeUrl = u => (/^https:\/\//i.test(u) ? u : '#');

  // ---------- persistence ----------
  function loadState() {
    try { return P.normalizeState(JSON.parse(localStorage.getItem(STORE_KEY)), LIB, TRACKS); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode / storage full */ }
  }

  let state = loadState();
  const firstVisit = !state;
  if (!state) state = P.createState();
  save();

  const ui = { current: null, qIndex: 0, spinning: false, hasSpun: false, reel: [] };
  Fx.sound.setEnabled(state.settings.sound);

  // ---------- answer frameworks ----------
  const FRAMEWORKS = {
    concept: {
      name: 'Define, how, example, limit', hint: 'For “explain X” questions',
      steps: ['<b>Define</b> it in one plain sentence.', '<b>How</b> it works: the one key mechanism.', '<b>Example</b> from a real project or product.', '<b>Limit</b>: when it fails, or the trade-off you would watch.']
    },
    design: {
      name: 'Clarify, design, evaluate, ship', hint: 'For system design rounds',
      steps: ['<b>Clarify</b> users, success metric, scale, latency, data and risk.', '<b>Design</b> the data flow, model choice, retrieval or tools, and where humans step in.', '<b>Evaluate</b>: evals, guardrails and how it fails.', '<b>Ship</b>: cost, phased rollout, monitoring and feedback.']
    },
    bluf: {
      name: 'Bottom line first', hint: 'For customer and executive answers',
      steps: ['<b>Bottom line</b>: your answer or recommendation, first.', '<b>Why</b>: two or three reasons in business terms.', '<b>Risk</b>: what could go wrong and how you will handle it.', '<b>Next step</b>: the decision or action you need.']
    },
    thinkaloud: {
      name: 'Think out loud', hint: 'For coding and decomposition rounds',
      steps: ['<b>Restate</b> the problem and ask clarifying questions.', '<b>Outline</b> your approach before writing code.', '<b>Narrate</b> trade-offs as you go.', '<b>Test</b> with an example and an edge case, then say what you would improve.']
    },
    star: {
      name: 'STAR', hint: 'For “tell me about a time…” questions',
      steps: ['<b>Situation</b>: one or two lines of context.', '<b>Task</b>: what you were responsible for.', '<b>Action</b>: what <i>you</i> did. Spend most of your time here.', '<b>Result</b>: the outcome, with a number, and what you learned.']
    }
  };
  const frameworkFor = topic => FRAMEWORKS[TRACKS[topic.track].framework] || FRAMEWORKS.concept;

  const KINDS = {
    article: 'Article', video: 'Video', docs: 'Docs', guide: 'Guide',
    course: 'Course', book: 'Book', podcast: 'Podcast', 'case-study': 'Case study'
  };
  const isMedium = (source, url) => /medium/i.test(source) || /(^|\.)medium\.com$/i.test(hostOf(url));
  function hostOf(url) { try { return new URL(url).hostname; } catch (e) { return ''; } }

  function searchLinks(topic) {
    const q = encodeURIComponent(topic.title.replace(/["“”]/g, ''));
    return [
      ['Medium', `https://medium.com/search?q=${q}`],
      ['YouTube', `https://www.youtube.com/results?search_query=${encodeURIComponent(topic.title.replace(/["“”]/g, '') + (topic.track === 'behavioral' ? ' interview answer' : ' explained'))}`],
      ['Web', `https://www.google.com/search?q=${q}`]
    ];
  }

  const resources = topic => (topic.res || []).filter(r => Array.isArray(r) && r[3]);
  const questionFor = topic => topic.asks[ui.qIndex % topic.asks.length];

  // ---------- toasts ----------
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
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function announce(msg) { $('#announcer').textContent = msg; }

  // Compare progress before/after an action and celebrate what changed.
  function snapshot() {
    const r = P.readiness(state, LIB, TRACKS);
    const full = Object.keys(r.byTrack).filter(k => r.byTrack[k].total && r.byTrack[k].ready === r.byTrack[k].total);
    return { streak: B.currentStreak(state, today()), ready: r.ready, total: r.total, full };
  }
  function celebrate(before) {
    const after = snapshot();
    renderHeader();
    if (after.streak > before.streak) {
      toast(after.streak === 1 ? 'Streak started. Come back tomorrow to grow it!' : `${after.streak}-day streak! Keep it alive tomorrow.`);
      bump($('#streak'));
    }
    if (after.ready > before.ready) bump($('#readyPill'));
    const newlyFull = after.full.filter(k => !before.full.includes(k));
    if (after.ready === after.total && before.ready < before.total) {
      Fx.sound.jackpot();
      Fx.burst(innerWidth / 2, innerHeight * 0.35, 220, 1.5);
      toast('Every topic is interview-ready. Go book those interviews!', { big: true, ms: 5000 });
    } else if (newlyFull.length) {
      const t = TRACKS[newlyFull[0]];
      Fx.burst(innerWidth / 2, innerHeight * 0.4, 160, 1.3);
      toast(`${t.label}: every topic ready!`, { big: true, ms: 4200 });
    }
  }

  // ---------- header & status ----------
  const SOUND_ON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const SOUND_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function renderHeader() {
    const streak = B.currentStreak(state, today());
    const streakEl = $('#streak');
    $('#streakCount').textContent = streak;
    streakEl.classList.toggle('alive', streak > 0);
    streakEl.classList.toggle('cold', streak === 0);
    const r = P.readiness(state, LIB, TRACKS);
    $('#readyCount').textContent = r.ready;
    $('#readyText').textContent = `of ${r.total} ready`;
    $('#readyFill').style.width = Math.round(r.ready / r.total * 100) + '%';
    $('#readyPill').title = `${r.ready} of ${r.total} topics marked interview-ready`;
    const sb = $('#soundBtn');
    sb.innerHTML = state.settings.sound ? SOUND_ON : SOUND_OFF;
    sb.setAttribute('aria-pressed', String(state.settings.sound));
    renderNudge(streak, r);
  }

  function renderNudge(streak, r) {
    const doneToday = state.streak.lastDay === today();
    $('#nudge').textContent = doneToday
      ? `You practised today, so your ${streak}-day streak is safe.`
      : streak > 0
        ? `Answer one question out loud today to keep your ${streak}-day streak.`
        : r.ready
          ? `${r.ready} topic${r.ready > 1 ? 's' : ''} ready. Start a streak: answer one question out loud today.`
          : 'Start a streak today: spin, read one link, then answer out loud for 60 seconds.';
  }

  function renderStatus() {
    $('#topicTotal').textContent = LIB.length;
    $('#trackTotal').textContent = Object.keys(TRACKS).length;
    $('#linkTotal').textContent = LIB.reduce((s, t) => s + resources(t).length, 0);
    const pool = currentPool().length;
    const all = P.spinPool(state, LIB, {}).length;
    $('#poolInfo').textContent = filtersActive() ? `${pool} of ${all} left match your filters` : `${all} left to spin`;
  }

  // ---------- filters ----------
  const TRACK_OPTS = [['random', 'All tracks']].concat(Object.keys(TRACKS).map(k => [k, TRACKS[k].label]));
  const ROLE_OPTS = [['any', 'Any role'], ['ai', ROLES.ai.label], ['fde', 'Forward Deployed (FDE)']];

  function renderOptions(select, opts, value) {
    select.innerHTML = opts.map(([v, label]) => `<option value="${v}"${v === value ? ' selected' : ''}>${esc(label)}</option>`).join('');
  }
  function renderFilters() {
    renderOptions($('#trackSelect'), TRACK_OPTS, state.settings.track);
    renderOptions($('#roleSelect'), ROLE_OPTS, state.settings.role);
  }
  function filtersActive() { return state.settings.track !== 'random' || state.settings.role !== 'any'; }
  function currentPool() { return P.spinPool(state, LIB, state.settings); }

  // ---------- prep list (rail) ----------
  function pickRow(p) {
    const t = byId.get(p.id);
    return `<li class="pick${p.ready ? ' learned' : ''}">
      <label class="check" title="I can talk about this"><input type="checkbox" data-ready="${esc(t.id)}" ${p.ready ? 'checked' : ''} aria-label="Interview-ready: ${esc(t.title)}"><span></span></label>
      <button type="button" class="pick-title" data-open="${esc(t.id)}" title="${esc(t.title)}">${esc(t.title)}</button>
      <button type="button" class="pick-x" data-remove="${esc(t.id)}" aria-label="Remove ${esc(t.title)} from your prep list" title="Remove (puts it back in the machine)">✕</button>
    </li>`;
  }

  function renderPicks() {
    const list = $('#picksList');
    const sorted = state.picks.slice().sort((a, b) => Number(a.ready) - Number(b.ready));
    list.innerHTML = sorted.length
      ? sorted.map(pickRow).join('')
      : '<li class="picks-empty">Your prep list is empty. Spin, then add the topics you want to study.</li>';
    $('#picksCount').textContent = state.picks.length;
    $('#mbPicksCount').textContent = state.picks.length;

    const r = P.readiness(state, LIB, TRACKS);
    $('#goalText').textContent = `${r.ready} / ${r.total}`;
    $('#goalFill').style.width = Math.round(r.ready / r.total * 100) + '%';
    $('#goal').classList.toggle('crushed', r.ready === r.total);
    $('#trackBars').innerHTML = Object.keys(TRACKS).map(k => {
      const row = r.byTrack[k];
      const pct = row.total ? Math.round(row.ready / row.total * 100) : 0;
      return `<li style="--c:${TRACKS[k].color}"><span class="tb-label">${esc(TRACKS[k].short)}</span>
        <span class="tb-meter" aria-hidden="true"><i style="--p:${pct / 100}"></i></span><span class="tb-num">${row.ready}/${row.total}</span></li>`;
    }).join('');
    renderSyllabusMarks();
  }

  // ---------- topic card ----------
  function renderCard(topic, opts) {
    const o = opts || {};
    const card = $('#card');
    card.classList.remove('reveal');
    if (!topic) { renderEmptyCard(o.reason); }
    else {
      const track = TRACKS[topic.track];
      const fw = frameworkFor(topic);
      const picked = P.isPicked(state, topic.id);
      const entry = state.picks.find(p => p.id === topic.id);
      const roleTags = topic.roles === 'both'
        ? `<span class="tag">${esc(ROLES.ai.short)}</span><span class="tag">${esc(ROLES.fde.short)}</span>`
        : `<span class="tag">${esc(ROLES[topic.roles].short)}</span>`;
      const res = resources(topic);
      const resList = res.length
        ? `<ul class="res-list">${res.map(([kind, title, source, url]) => {
            const medium = isMedium(source, url) ? '<span class="res-badge">Medium</span>' : '';
            return `<li><a class="res" href="${esc(safeUrl(url))}" target="_blank" rel="noopener">
              <span class="res-body"><b>${esc(title)}</b><small><span>${esc(source)}</span><span>${KINDS[kind] || KINDS.article}</span></small></span>${medium}
            </a></li>`;
          }).join('')}</ul>`
        : '<p class="res-none">Hand-picked links are on the way. Use the searches below for now.</p>';
      card.style.setProperty('--c', track.color);
      card.innerHTML = `
        <div class="card-meta">
          <span class="tag area">${esc(track.label)}</span>
          ${roleTags}
          <span class="heat">Priority <b>${topic.priority}</b> of 5</span>
          ${entry && entry.ready ? '<span class="eta"><b>✓ Interview-ready</b></span>' : ''}
        </div>
        <h2 class="card-title">${esc(topic.title)}</h2>
        <p class="why">${esc(topic.gist)}</p>
        <div class="prep-grid">
          <div>
            <h3 class="minor-head">They ask</h3>
            <ul class="asks">${topic.asks.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
          </div>
          <div>
            <h3 class="minor-head">A strong answer covers</h3>
            <ul class="covers">${topic.cover.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="challenge">
          <div>
            <h3 class="minor-head">Answer out loud in 60 seconds</h3>
            <p class="q">“${esc(questionFor(topic))}”</p>
            <small>Shape it with <b>${esc(fw.name)}</b>.${topic.asks.length > 1 ? ' <button type="button" class="text-btn inline" data-act="next-q">Another question</button>' : ''}</small>
          </div>
          <button type="button" class="btn secondary" data-act="explain">Start 60s</button>
        </div>
        <div class="prep-notes">
          <div class="note"><h3 class="minor-head">Practice</h3><p>${esc(topic.practice)}</p></div>
          <div class="note flag"><h3 class="minor-head">Red flag</h3><p>${esc(topic.flag)}</p></div>
        </div>
        <div class="study">
          <h3 class="minor-head">Learn from</h3>
          ${resList}
          <p class="resources">Find more:
            ${searchLinks(topic).map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`).join('')}
          </p>
        </div>
        <div class="actions">
          ${picked
            ? (entry.ready
              ? '<button type="button" class="btn done" disabled>✓ Interview-ready</button>'
              : '<button type="button" class="btn primary" data-act="ready">✓ I can talk about this</button>')
            : '<button type="button" class="btn primary" data-act="pick">Add to prep list</button>'}
          <button type="button" class="btn secondary" data-act="spin">Spin again</button>
          <span class="quiet">
            ${picked
              ? '<button type="button" class="text-btn" data-act="unpick">Put back</button>'
              : '<button type="button" class="text-btn" data-act="skip">Skip</button>'}
            <button type="button" class="text-btn" data-act="copy">Copy notes</button>
            <button type="button" class="text-btn" data-act="focus">15-min study</button>
          </span>
        </div>`;
    }
    if (o.reveal && !reduceMotion) { void card.offsetWidth; card.classList.add('reveal'); }
  }

  function renderEmptyCard(reason) {
    const card = $('#card');
    card.style.setProperty('--c', 'var(--m-violet)');
    const skipped = state.skipped.length;
    const bringBack = skipped ? `<button type="button" class="btn secondary" data-act="restore">Bring back ${skipped} skipped</button>` : '';
    if (reason === 'filtered') {
      card.innerHTML = `<div class="card-empty">
        <h2>Nothing left for these filters</h2>
        <p>Every matching topic is on your prep list or skipped. Widen the filters to keep spinning.</p>
        <div class="actions"><button type="button" class="btn primary" data-act="reset-filters">Reset filters</button>${bringBack}</div></div>`;
    } else if (reason === 'cleared') {
      card.innerHTML = `<div class="card-empty">
        <h2>The machine is empty</h2>
        <p>Every topic is on your prep list or skipped. Work through your list and tick off what you can talk about.</p>
        <div class="actions">${bringBack}</div></div>`;
    } else {
      card.innerHTML = `<div class="card-empty">
        <h2>Your next interview question is one pull away</h2>
        <p>${LIB.length} topics across ${Object.keys(TRACKS).length} tracks, from LLM basics to customer discovery. Each comes with real interview questions and links to learn from.</p>
        <div class="steps">
          <span class="step"><b>1</b>Pull the lever</span>
          <span class="step"><b>2</b>Read one link</span>
          <span class="step"><b>3</b>Answer out loud</span>
        </div></div>`;
    }
  }

  // ---------- reel ----------
  const strip = $('#reelStrip');
  const reelWindow = $('#reelWindow');
  const machine = $('#machine');
  const spinBtn = $('#spinBtn');

  function reelItem(t) {
    const tr = TRACKS[t.track];
    return `<div class="reel-item" style="--c:${tr.color}"><span class="reel-tag">${esc(tr.short)}</span><span class="reel-text">${esc(t.title)}</span></div>`;
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
    P.resetSeenIfDone(state, LIB);
    const target = P.chooseTopic(currentPool(), { avoidId: ui.current && ui.current.id, seen: new Set(state.seen) });
    if (!target) {
      Fx.sound.nope();
      machine.classList.remove('shake'); void machine.offsetWidth; machine.classList.add('shake');
      renderCard(null, { reason: filtersActive() && P.spinPool(state, LIB, {}).length ? 'filtered' : 'cleared', reveal: true });
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

    anim.finished.then(() => {
      setReel([seq[targetIdx - 1], target, tail[0]]);
      land(target);
    }).catch(() => { /* animation cancelled */ });
  }

  function land(topic) {
    ui.spinning = false;
    ui.current = topic;
    ui.qIndex = Math.floor(Math.random() * topic.asks.length);
    machine.classList.remove('spinning');
    machine.classList.add('win');
    reelWindow.classList.add('win');
    spinBtn.disabled = false;
    P.markSeen(state, topic.id);
    save();
    renderCard(topic, { reveal: true });
    announce(`Landed on ${topic.title}. Priority ${topic.priority} of 5.`);
    if (topic.priority >= 5) { Fx.sound.jackpot(); Fx.burstFrom(reelWindow, 90); }
    else Fx.sound.land();
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
  lever.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); pullLever(); } });

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
  function doPick(topic) {
    const t = topic || ui.current;
    if (!t || P.isPicked(state, t.id)) return;
    P.pick(state, t, today());
    save();
    Fx.sound.pick();
    announce(`${t.title} is on your prep list.`);
    if (ui.current && ui.current.id === t.id) renderCard(ui.current);
    renderPicks();
    renderStatus();
    bump($('#picksPanel'));
  }

  function doUnpick(id) {
    if (!P.unpick(state, id)) return;
    save();
    announce('Back in the machine. It can land again.');
    if (ui.current && ui.current.id === id) renderCard(ui.current);
    renderPicks();
    renderStatus();
    renderHeader();
  }

  function doSkip() {
    if (!ui.current || ui.spinning) return;
    P.skip(state, ui.current.id);
    save();
    toast('Skipped. Bring it back any time from an empty machine.');
    renderStatus();
    pullLever();
  }

  function doToggleReady(id, el) {
    const before = snapshot();
    if (!P.isPicked(state, id)) P.pick(state, byId.get(id), today());
    const ready = P.toggleReady(state, id, today());
    if (ready === null) return;
    if (ready) B.recordActivity(state, today());
    save();
    if (ready) {
      Fx.sound.learned();
      if (el) Fx.burstFrom(el, 45, 0.7);
      announce(`Interview-ready: ${byId.get(id).title}`);
    }
    renderPicks();
    renderStatus();
    if (ui.current && ui.current.id === id) renderCard(ui.current);
    celebrate(before);
  }

  function topicNotes(t) {
    const lines = [`## ${t.title}`, '', t.gist, '', '**They ask**'];
    t.asks.forEach(a => lines.push(`- ${a}`));
    lines.push('', '**A strong answer covers**');
    t.cover.forEach(c => lines.push(`- ${c}`));
    lines.push('', `**Practice:** ${t.practice}`, `**Red flag:** ${t.flag}`);
    const res = resources(t);
    if (res.length) {
      lines.push('', '**Learn from**');
      res.forEach(([, title, source, url]) => lines.push(`- [${title}](${url}) (${source})`));
    }
    return lines.join('\n');
  }

  async function copyText(text, ok) {
    try { await navigator.clipboard.writeText(text); toast(ok); }
    catch (e) { toast('Could not access the clipboard'); }
  }

  function studyPlan() {
    if (!state.picks.length) return null;
    const lines = ['# My AI / FDE interview prep plan', ''];
    Object.keys(TRACKS).forEach(k => {
      const rows = state.picks.filter(p => byId.get(p.id).track === k);
      if (!rows.length) return;
      lines.push(`## ${TRACKS[k].label}`);
      rows.forEach(p => {
        const t = byId.get(p.id);
        lines.push(`- [${p.ready ? 'x' : ' '}] **${t.title}**`);
        resources(t).slice(0, 2).forEach(([, title, , url]) => lines.push(`  - [${title}](${url})`));
      });
      lines.push('');
    });
    return lines.join('\n');
  }

  // ---------- timers ----------
  const RING = 326.73;
  const timer = { mode: null, total: 0, remaining: 0, endAt: 0, running: false, int: null, topic: null, lastBeep: null };
  const timerDialog = $('#timerDialog');

  function openTimer(mode, topic) {
    timer.mode = mode;
    timer.topic = topic;
    timer.total = mode === 'explain' ? 60e3 : 15 * 60e3;
    const fw = frameworkFor(topic);
    const first = resources(topic)[0];
    $('#timerKicker').textContent = mode === 'explain' ? '60-second answer' : '15-minute study sprint';
    $('#timerTitle').textContent = topic.title;
    $('#timerPrompt').textContent = mode === 'explain'
      ? `“${questionFor(topic)}” Answer out loud, and record yourself if you can.`
      : `Read ${first ? '“' + first[1] + '”' : 'one of the links'}, note the 3 points you would say, then answer: “${questionFor(topic)}”`;
    $('#timerTrick').innerHTML = `<b>${esc(fw.name)}</b><ol>${fw.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
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

  function pauseTimer() { stopTimer(); $('#timerStart').textContent = 'Resume'; }
  function stopTimer() { timer.running = false; clearInterval(timer.int); timer.int = null; }

  function completeTimer() {
    stopTimer();
    const before = snapshot();
    if (timer.mode === 'explain') state.explains++; else state.focus++;
    B.recordActivity(state, today());
    save();
    Fx.sound.done();
    $('#ring').classList.remove('urgent');
    $('#ring').classList.add('complete');
    $('#timerTime').textContent = 'Done';
    Fx.burstFrom($('#ring'), 120, 1.1);
    const entry = state.picks.find(p => p.id === timer.topic.id);
    setTimerActions(
      (entry && entry.ready ? '' : '<button class="btn primary" type="button" data-timer="ready">✓ I can talk about this</button>')
      + '<button class="btn secondary" type="button" data-timer="next">Spin the next one</button>'
      + '<button class="btn secondary" type="button" data-timer="again">Go again</button>'
    );
    celebrate(before);
  }

  timerDialog.addEventListener('click', e => {
    if (e.target === timerDialog || e.target.closest('[data-close]')) { timerDialog.close(); return; }
    const btn = e.target.closest('button');
    if (btn && btn.id === 'timerStart') startTimer();
    else if (btn && btn.id === 'timerReset') resetTimer();
    const act = e.target.closest('[data-timer]');
    if (!act) return;
    const a = act.dataset.timer;
    if (a === 'again') resetTimer();
    else if (a === 'ready') { doToggleReady(timer.topic.id, act); act.remove(); }
    else if (a === 'next') { timerDialog.close(); setTimeout(pullLever, 250); }
  });
  timerDialog.addEventListener('close', stopTimer);

  // ---------- frameworks & syllabus ----------
  const accordion = (name, hint, body) => `<details class="trick"><summary><span><b>${esc(name)}</b><small>${esc(hint)}</small></span></summary>${body}</details>`;

  function renderFrameworks() {
    $('#frameworksGrid').innerHTML = Object.keys(FRAMEWORKS).map(k => {
      const f = FRAMEWORKS[k];
      const used = Object.keys(TRACKS).filter(t => TRACKS[t].framework === k).map(t => TRACKS[t].short).join(', ');
      return accordion(f.name, f.hint + (used ? `, used in ${used.replace(/, ([^,]*)$/, ' and $1')}` : ''), `<ol>${f.steps.map(s => `<li>${s}</li>`).join('')}</ol>`);
    }).join('');
  }

  function renderSyllabus() {
    $('#syllabusGrid').innerHTML = Object.keys(TRACKS).map(k => {
      const tr = TRACKS[k];
      const topics = LIB.filter(t => t.track === k);
      const body = `<ul class="syllabus">${topics.map(t => `<li><button type="button" class="syl-item" data-open="${esc(t.id)}">
        <span class="syl-mark" data-mark="${esc(t.id)}" aria-hidden="true"></span><span>${esc(t.title)}</span></button></li>`).join('')}</ul>`;
      return accordion(tr.label, `${topics.length} topics`, body);
    }).join('');
    renderSyllabusMarks();
  }

  function renderSyllabusMarks() {
    document.querySelectorAll('[data-mark]').forEach(el => {
      const p = state.picks.find(x => x.id === el.dataset.mark);
      el.textContent = p && p.ready ? '✓' : '';
      el.classList.toggle('on', !!p);
      el.classList.toggle('ready', !!(p && p.ready));
    });
  }

  function openTopic(id) {
    const t = byId.get(id);
    if (!t) return;
    ui.current = t;
    ui.qIndex = 0;
    renderCard(t, { reveal: true });
    $('#card').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  // ---------- events ----------
  const onFilter = () => {
    state.settings.track = $('#trackSelect').value;
    state.settings.role = $('#roleSelect').value;
    save();
    renderStatus();
  };
  $('#trackSelect').addEventListener('change', onFilter);
  $('#roleSelect').addEventListener('change', onFilter);

  document.addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'pick') doPick();
      else if (a === 'ready' && ui.current) doToggleReady(ui.current.id, act);
      else if (a === 'unpick' && ui.current) doUnpick(ui.current.id);
      else if (a === 'skip') doSkip();
      else if (a === 'spin') pullLever();
      else if (a === 'copy' && ui.current) copyText(topicNotes(ui.current), 'Notes copied as Markdown');
      else if (a === 'explain' && ui.current) openTimer('explain', ui.current);
      else if (a === 'focus' && ui.current) openTimer('focus', ui.current);
      else if (a === 'next-q' && ui.current) { ui.qIndex++; const q = $('#card .q'); if (q) q.textContent = `“${questionFor(ui.current)}”`; }
      else if (a === 'reset-filters') { state.settings.track = 'random'; state.settings.role = 'any'; save(); renderFilters(); renderStatus(); pullLever(); }
      else if (a === 'restore') { const n = P.restoreSkipped(state); save(); toast(`${n} skipped topic${n > 1 ? 's are' : ' is'} back in the machine`); renderStatus(); renderCard(null); }
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) { openTopic(open.dataset.open); return; }
    const rm = e.target.closest('[data-remove]');
    if (rm) doUnpick(rm.dataset.remove);
  });

  document.addEventListener('change', e => {
    const box = e.target.closest('[data-ready]');
    if (box) doToggleReady(box.dataset.ready, box);
  });

  spinBtn.addEventListener('click', pullLever);

  // Phone quick bar: appears once the machine scrolls out of view.
  const mobileBar = $('#mobileBar');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      mobileBar.classList.toggle('show', !entry.isIntersecting);
      document.body.classList.toggle('bar-on', !entry.isIntersecting);
    }, { threshold: 0.15 }).observe(machine);
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
  $('#copyPlanBtn').addEventListener('click', () => {
    const plan = studyPlan();
    if (!plan) { toast('Add topics to your prep list first'); return; }
    copyText(plan, 'Study plan copied as Markdown');
  });
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Reset your interview prep progress? Your prep list, ready marks and streak will be cleared.')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    location.reload();
  });

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const onControl = e.target.closest('button, a, summary');
    if (e.key === ' ' && !onControl) { e.preventDefault(); pullLever(); }
    else if ((e.key === 'p' || e.key === 'P') && ui.current && !ui.spinning) doPick();
    else if ((e.key === 's' || e.key === 'S') && ui.current && !ui.spinning) doSkip();
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderHeader(); });
  window.addEventListener('resize', layoutLever);

  // ---------- boot ----------
  $('#marquee').innerHTML = Array.from({ length: 22 }, (_, i) => `<span class="bulb" style="--i:${i}"></span>`).join('');
  renderFrameworks();
  renderSyllabus();
  renderHeader();
  renderFilters();
  renderStatus();
  renderPicks();
  renderCard(null);
  idleReel();
  layoutLever();

  // Deep link: prep.html?topic=build-rag opens that card straight away.
  const linked = byId.get(new URLSearchParams(location.search).get('topic'));
  if (linked) { ui.current = linked; renderCard(linked); }

  if (firstVisit) {
    setTimeout(() => toast(`Welcome! ${LIB.length} interview topics are loaded. Pull the lever!`, { ms: 4500 }), 600);
  }
})();
