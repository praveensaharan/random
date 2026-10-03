/*
 * FutureSpin batch engine — pure logic, no DOM.
 * Owns: the 3-day batch calendar, building batches, picks/vault, XP, streaks.
 * Every mutating function changes `state` in place and returns something useful.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FSBatch = api;
})(this, function () {
  const VERSION = 1;
  const BATCH_DAYS = 3;
  const BATCH_SIZE = 36;
  const BATCH_GOAL = 3;
  const MS_DAY = 864e5;
  const AREAS = ['ai', 'cloud', 'data', 'security', 'emerging'];
  const DEPTHS = ['quick', 'deep', 'expert'];
  const AREA_WEIGHTS = { ai: 0.36, cloud: 0.16, data: 0.16, security: 0.16, emerging: 0.16 };
  const XP = { pick: 5, learned: 25, explain: 10, focus: 15 };
  const LEVELS = [
    { name: 'Explorer', emoji: '🧭', min: 0 },
    { name: 'Early Adopter', emoji: '🌱', min: 100 },
    { name: 'Trendsetter', emoji: '🚀', min: 300 },
    { name: 'Visionary', emoji: '🔭', min: 700 },
    { name: 'Futurist', emoji: '🌌', min: 1500 }
  ];

  // ---------- calendar (local days, DST-safe) ----------
  function dayNumber(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_DAY);
  }

  function dayToDate(day) {
    const d = new Date(day * MS_DAY);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  function batchIndexFor(anchorDay, today) {
    return Math.max(0, Math.floor((today - anchorDay) / BATCH_DAYS));
  }

  function msUntilNextBatch(state, now) {
    const endDay = state.anchorDay + (state.batch.index + 1) * BATCH_DAYS;
    return Math.max(0, dayToDate(endDay) - now);
  }

  // ---------- randomness ----------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function batchSeed(anchorDay, index) {
    return (Math.imul(anchorDay, 2654435761) ^ Math.imul(index + 1, 40503)) >>> 0;
  }

  // Weighted shuffle: hotter topics tend to come first, but not always.
  function heatShuffle(list, rng) {
    return list
      .map(t => ({ t, key: -Math.log(1 - rng()) / (t.heat || 1) }))
      .sort((x, y) => x.key - y.key)
      .map(x => x.t);
  }

  // ---------- batch building ----------
  // Largest-remainder split of `size` across areas, capped by what each area has left.
  function computeQuotas(size, weights, available) {
    const areas = Object.keys(weights);
    const raw = areas.map(a => ({ a, v: size * weights[a] }));
    const q = {};
    raw.forEach(r => { q[r.a] = Math.min(Math.floor(r.v), available[r.a] || 0); });
    let remaining = size - areas.reduce((s, a) => s + q[a], 0);

    const byRemainder = raw.slice().sort((x, y) => (y.v % 1) - (x.v % 1) || weights[y.a] - weights[x.a]);
    for (const r of byRemainder) {
      if (remaining <= 0) break;
      if (q[r.a] < Math.ceil(r.v) && q[r.a] < (available[r.a] || 0)) { q[r.a]++; remaining--; }
    }

    const byWeight = areas.slice().sort((x, y) => weights[y] - weights[x]);
    while (remaining > 0) {
      let progressed = false;
      for (const a of byWeight) {
        if (remaining > 0 && q[a] < (available[a] || 0)) { q[a]++; remaining--; progressed = true; }
      }
      if (!progressed) break;
    }
    return q;
  }

  // Fresh (never batched) topics first, weighted by heat; then the longest-unseen ones.
  function buildBatchIds(library, opts) {
    const retired = opts.retired || new Set();
    const lastBatched = opts.lastBatched || {};
    const weights = opts.weights || AREA_WEIGHTS;
    const rng = opts.rng || Math.random;
    const size = opts.size || BATCH_SIZE;

    const ordered = {};
    const available = {};
    Object.keys(weights).forEach(area => {
      const candidates = library.filter(t => t.area === area && !retired.has(t.id));
      const fresh = heatShuffle(candidates.filter(t => !(t.id in lastBatched)), rng);
      const stale = heatShuffle(candidates.filter(t => t.id in lastBatched), rng)
        .sort((x, y) => lastBatched[x.id] - lastBatched[y.id]);
      ordered[area] = fresh.concat(stale);
      available[area] = ordered[area].length;
    });

    const quotas = computeQuotas(size, weights, available);
    const ids = [];
    Object.keys(weights).forEach(area => {
      ordered[area].slice(0, quotas[area]).forEach(t => ids.push(t.id));
    });
    // Interleave areas so the batch doesn't read as blocks.
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }

  function newBatch(state, library, index, today) {
    const rng = mulberry32(batchSeed(state.anchorDay, index));
    const ids = buildBatchIds(library, {
      retired: new Set(state.retired),
      lastBatched: state.lastBatched,
      size: BATCH_SIZE,
      rng
    });
    ids.forEach(id => { state.lastBatched[id] = index; });
    return { index, startedDay: today, ids, skipped: [], seen: [] };
  }

  function createState(library, today) {
    const state = {
      v: VERSION,
      anchorDay: today,
      batch: null,
      picks: [],
      vault: [],
      retired: [],
      lastBatched: {},
      explains: 0,
      focus: 0,
      streak: { count: 0, lastDay: null, best: 0 },
      settings: { sound: true, area: 'random', depth: 'any' }
    };
    state.batch = newBatch(state, library, 0, today);
    return state;
  }

  // Rolls to the current batch if the 3-day window has passed. Picks go to the vault.
  function ensureCurrentBatch(state, library, today) {
    const index = batchIndexFor(state.anchorDay, today);
    if (index <= state.batch.index) return { rolled: false, moved: 0, index: state.batch.index };
    const from = state.batch.index;
    const moved = state.picks.length;
    state.picks.forEach(p => {
      state.vault.push(Object.assign({}, p, { batch: from }));
      if (!state.retired.includes(p.id)) state.retired.push(p.id);
    });
    state.picks = [];
    state.batch = newBatch(state, library, index, today);
    return { rolled: true, moved, from, index };
  }

  // ---------- spinning ----------
  const indexCache = new WeakMap();
  function libIndex(library) {
    let m = indexCache.get(library);
    if (!m) { m = new Map(library.map(t => [t.id, t])); indexCache.set(library, m); }
    return m;
  }

  function findTopic(library, id) {
    return libIndex(library).get(id) || null;
  }

  function spinPool(state, library, filters) {
    const area = (filters && filters.area) || 'random';
    const depth = (filters && filters.depth) || 'any';
    const byId = libIndex(library);
    const picked = new Set(state.picks.map(p => p.id));
    const skipped = new Set(state.batch.skipped);
    return state.batch.ids
      .map(id => byId.get(id))
      .filter(t => t && !picked.has(t.id) && !skipped.has(t.id)
        && (area === 'random' || t.area === area)
        && (depth === 'any' || t.depth === depth));
  }

  function chooseTopic(pool, opts, rng) {
    if (!pool.length) return null;
    opts = opts || {};
    rng = rng || Math.random;
    let candidates = pool.filter(t => t.id !== opts.avoidId);
    if (!candidates.length) candidates = pool;
    if (opts.seen) {
      const unseen = candidates.filter(t => !opts.seen.has(t.id));
      if (unseen.length) candidates = unseen;
    }
    if (!opts.area || opts.area === 'random') {
      const groups = {};
      candidates.forEach(t => { (groups[t.area] = groups[t.area] || []).push(t); });
      const present = Object.keys(groups);
      const total = present.reduce((s, a) => s + (AREA_WEIGHTS[a] || 0.1), 0);
      let r = rng() * total;
      let chosen = present[present.length - 1];
      for (const a of present) {
        r -= AREA_WEIGHTS[a] || 0.1;
        if (r < 0) { chosen = a; break; }
      }
      candidates = groups[chosen];
    }
    return candidates[Math.floor(rng() * candidates.length)];
  }

  function markSeen(state, id) {
    if (!state.batch.seen.includes(id)) state.batch.seen.push(id);
  }

  // ---------- picks ----------
  function isPicked(state, id) {
    return state.picks.some(p => p.id === id);
  }

  function pick(state, item, today) {
    if (isPicked(state, item.id)) return false;
    state.picks.push({
      id: item.id,
      title: item.title,
      area: item.area,
      source: item.source || 'library',
      url: item.url || null,
      pickedDay: today,
      learned: false,
      learnedDay: null
    });
    return true;
  }

  function unpick(state, id) {
    const before = state.picks.length;
    state.picks = state.picks.filter(p => p.id !== id);
    return state.picks.length !== before;
  }

  function skip(state, id) {
    if (!state.batch.skipped.includes(id)) state.batch.skipped.push(id);
  }

  function restoreSkipped(state) {
    const n = state.batch.skipped.length;
    state.batch.skipped = [];
    return n;
  }

  function toggleLearned(state, id, today) {
    const entry = state.picks.find(p => p.id === id) || state.vault.find(p => p.id === id);
    if (!entry) return null;
    entry.learned = !entry.learned;
    entry.learnedDay = entry.learned ? today : null;
    if (entry.learned) recordActivity(state, today);
    return entry.learned;
  }

  // ---------- progress ----------
  function recordActivity(state, today) {
    const s = state.streak;
    if (s.lastDay === today) return s.count;
    s.count = s.lastDay === today - 1 ? s.count + 1 : 1;
    s.lastDay = today;
    s.best = Math.max(s.best, s.count);
    return s.count;
  }

  function currentStreak(state, today) {
    const s = state.streak;
    return s.lastDay === today || s.lastDay === today - 1 ? s.count : 0;
  }

  function addExplain(state, today) { state.explains++; recordActivity(state, today); }
  function addFocus(state, today) { state.focus++; recordActivity(state, today); }

  function xpOf(state) {
    const all = state.picks.concat(state.vault);
    const learned = all.filter(p => p.learned).length;
    return all.length * XP.pick + learned * XP.learned + state.explains * XP.explain + state.focus * XP.focus;
  }

  function levelFor(xp) {
    let i = 0;
    while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
    const level = LEVELS[i];
    const next = LEVELS[i + 1] || null;
    const progress = next ? (xp - level.min) / (next.min - level.min) : 1;
    return { name: level.name, emoji: level.emoji, min: level.min, next, progress, rank: i + 1 };
  }

  function batchProgress(state) {
    return {
      picked: state.picks.length,
      learned: state.picks.filter(p => p.learned).length,
      goal: BATCH_GOAL
    };
  }

  // ---------- persistence ----------
  function normalizeState(raw) {
    if (!raw || typeof raw !== 'object' || raw.v !== VERSION) return null;
    if (typeof raw.anchorDay !== 'number' || !raw.batch || !Array.isArray(raw.batch.ids)) return null;
    const arr = x => (Array.isArray(x) ? x : []);
    raw.batch.skipped = arr(raw.batch.skipped);
    raw.batch.seen = arr(raw.batch.seen);
    raw.picks = arr(raw.picks);
    raw.vault = arr(raw.vault);
    raw.retired = arr(raw.retired);
    raw.lastBatched = raw.lastBatched && typeof raw.lastBatched === 'object' ? raw.lastBatched : {};
    raw.explains = raw.explains | 0;
    raw.focus = raw.focus | 0;
    raw.streak = Object.assign({ count: 0, lastDay: null, best: 0 }, raw.streak);
    raw.settings = Object.assign({ sound: true, area: 'random', depth: 'any' }, raw.settings);
    return raw;
  }

  return {
    VERSION, BATCH_DAYS, BATCH_SIZE, BATCH_GOAL, AREAS, DEPTHS, AREA_WEIGHTS, XP, LEVELS,
    dayNumber, dayToDate, batchIndexFor, msUntilNextBatch, mulberry32,
    computeQuotas, buildBatchIds, createState, ensureCurrentBatch,
    findTopic, spinPool, chooseTopic, markSeen,
    isPicked, pick, unpick, skip, restoreSkipped, toggleLearned,
    recordActivity, currentStreak, addExplain, addFocus, xpOf, levelFor, batchProgress,
    normalizeState
  };
});
