/*
 * FutureSpin Interview Prep engine — pure logic, no DOM.
 * Owns: the spin pool, weighted topic choice, the prep list (picks) and interview readiness.
 * There are no batches here: every topic stays available until you put it on your list.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FSPrep = api;
})(this, function () {
  const VERSION = 1;
  const DEFAULT_SETTINGS = { sound: true, track: 'random', role: 'any' };

  function createState() {
    return {
      v: VERSION,
      picks: [],
      skipped: [],
      seen: [],
      explains: 0,
      focus: 0,
      streak: { count: 0, lastDay: null, best: 0 },
      settings: Object.assign({}, DEFAULT_SETTINGS)
    };
  }

  // Drops anything that no longer matches the library, so editing topics never breaks saved progress.
  function normalizeState(raw, library, tracks) {
    if (!raw || typeof raw !== 'object' || raw.v !== VERSION) return null;
    const known = new Set(library.map(t => t.id));
    const arr = x => (Array.isArray(x) ? x : []);
    const seenIds = new Set();
    raw.picks = arr(raw.picks).filter(p => p && known.has(p.id) && !seenIds.has(p.id) && seenIds.add(p.id));
    raw.picks.forEach(p => { p.ready = !!p.ready; p.readyDay = p.ready ? p.readyDay : null; });
    raw.skipped = arr(raw.skipped).filter(id => known.has(id));
    raw.seen = arr(raw.seen).filter(id => known.has(id));
    raw.explains = raw.explains | 0;
    raw.focus = raw.focus | 0;
    raw.streak = Object.assign({ count: 0, lastDay: null, best: 0 }, raw.streak);
    raw.settings = Object.assign({}, DEFAULT_SETTINGS, raw.settings);
    const knownTrack = tracks && Object.prototype.hasOwnProperty.call(tracks, raw.settings.track);
    if (raw.settings.track !== 'random' && !knownTrack) raw.settings.track = 'random';
    if (!['any', 'ai', 'fde'].includes(raw.settings.role)) raw.settings.role = 'any';
    return raw;
  }

  // ---------- filters & pool ----------
  function matchesRole(topic, role) {
    return !role || role === 'any' || topic.roles === 'both' || topic.roles === role;
  }

  function matches(topic, filters) {
    const f = filters || {};
    return (!f.track || f.track === 'random' || topic.track === f.track) && matchesRole(topic, f.role);
  }

  function isPicked(state, id) {
    return state.picks.some(p => p.id === id);
  }

  // Topics that can still land: not on your list, not skipped, matching the filters.
  function spinPool(state, library, filters) {
    const picked = new Set(state.picks.map(p => p.id));
    const skipped = new Set(state.skipped);
    return library.filter(t => !picked.has(t.id) && !skipped.has(t.id) && matches(t, filters));
  }

  // Higher-priority topics land more often. Avoids repeating the current topic and prefers unseen ones.
  function chooseTopic(pool, opts, rng) {
    if (!pool.length) return null;
    const o = opts || {};
    const rand = rng || Math.random;
    let candidates = pool.filter(t => t.id !== o.avoidId);
    if (!candidates.length) candidates = pool;
    if (o.seen) {
      const unseen = candidates.filter(t => !o.seen.has(t.id));
      if (unseen.length) candidates = unseen;
    }
    const weight = t => Math.max(1, t.priority || 1);
    const total = candidates.reduce((s, t) => s + weight(t), 0);
    let r = rand() * total;
    for (const t of candidates) {
      r -= weight(t);
      if (r < 0) return t;
    }
    return candidates[candidates.length - 1];
  }

  function markSeen(state, id) {
    if (!state.seen.includes(id)) state.seen.push(id);
  }

  // Once every topic in the library has been seen, start a fresh round so "unseen first" keeps working.
  function resetSeenIfDone(state, library) {
    if (state.seen.length >= library.length) { state.seen = []; return true; }
    return false;
  }

  // ---------- prep list ----------
  function pick(state, topic, today) {
    if (isPicked(state, topic.id)) return false;
    state.picks.push({ id: topic.id, pickedDay: today, ready: false, readyDay: null });
    state.skipped = state.skipped.filter(id => id !== topic.id);
    return true;
  }

  function unpick(state, id) {
    const before = state.picks.length;
    state.picks = state.picks.filter(p => p.id !== id);
    return state.picks.length !== before;
  }

  function skip(state, id) {
    if (!state.skipped.includes(id)) state.skipped.push(id);
  }

  function restoreSkipped(state) {
    const n = state.skipped.length;
    state.skipped = [];
    return n;
  }

  // Returns the new ready flag, or null when the topic is not on the list.
  function toggleReady(state, id, today) {
    const entry = state.picks.find(p => p.id === id);
    if (!entry) return null;
    entry.ready = !entry.ready;
    entry.readyDay = entry.ready ? today : null;
    return entry.ready;
  }

  // ---------- readiness ----------
  function readiness(state, library, tracks) {
    const ready = new Set(state.picks.filter(p => p.ready).map(p => p.id));
    const byTrack = {};
    Object.keys(tracks).forEach(k => { byTrack[k] = { ready: 0, total: 0 }; });
    library.forEach(t => {
      const row = byTrack[t.track] || (byTrack[t.track] = { ready: 0, total: 0 });
      row.total++;
      if (ready.has(t.id)) row.ready++;
    });
    return { ready: ready.size, total: library.length, byTrack };
  }

  return {
    VERSION, createState, normalizeState,
    matches, matchesRole, isPicked, spinPool, chooseTopic, markSeen, resetSeenIfDone,
    pick, unpick, skip, restoreSkipped, toggleReady, readiness
  };
});
