/* Unit tests for js/batch.js and the topic library. Run via tests/index.html. */
(function () {
  const B = window.FSBatch;
  const LIB = window.FS_TOPICS;
  const tests = [];
  const test = (name, fn) => tests.push({ name, fn });
  const ok = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
  const eq = (actual, expected, msg) => {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) throw new Error((msg ? msg + ': ' : '') + 'expected ' + e + ', got ' + a);
  };
  const areaCount = (ids, lib) => {
    const byId = new Map(lib.map(t => [t.id, t]));
    const out = {};
    ids.forEach(id => { const a = byId.get(id).area; out[a] = (out[a] || 0) + 1; });
    return out;
  };
  const sum = obj => Object.values(obj).reduce((s, n) => s + n, 0);
  const mini = (n, area, extra) => Array.from({ length: n }, (_, i) => Object.assign({
    id: area + '-' + i, title: area + ' ' + i, area, depth: 'quick', heat: 3,
    eta: 'Now', why: 'x', learn: ['a', 'b', 'c']
  }, extra || {}));
  const DAY = 20000;

  // ---------- calendar ----------
  test('dayNumber advances by exactly 1 across a DST change', () => {
    eq(B.dayNumber(new Date(2026, 2, 9)) - B.dayNumber(new Date(2026, 2, 8)), 1);
    eq(B.dayNumber(new Date(2026, 9, 26, 23, 59)) - B.dayNumber(new Date(2026, 9, 25, 0, 1)), 1);
  });

  test('batchIndexFor groups days into blocks of 3 from the anchor', () => {
    eq([100, 101, 102, 103, 105, 106, 110].map(d => B.batchIndexFor(100, d)), [0, 0, 0, 1, 1, 2, 3]);
    eq(B.batchIndexFor(100, 99), 0, 'clock moved backwards stays on batch 0');
  });

  test('msUntilNextBatch counts down to local midnight of the next batch day', () => {
    const now = new Date(2026, 9, 1, 12, 0, 0);
    const state = { anchorDay: B.dayNumber(now), batch: { index: 0 } };
    const expected = new Date(2026, 9, 4, 0, 0, 0) - now;
    eq(B.msUntilNextBatch(state, now), expected);
  });

  // ---------- quotas ----------
  test('computeQuotas gives AI the biggest share and fills the batch exactly', () => {
    const avail = { ai: 99, cloud: 99, data: 99, security: 99, emerging: 99 };
    const q = B.computeQuotas(36, B.AREA_WEIGHTS, avail);
    eq(sum(q), 36);
    ok(q.ai === 13, 'AI should get 13 of 36, got ' + q.ai);
    ['cloud', 'data', 'security', 'emerging'].forEach(a => ok(q[a] >= 5 && q[a] <= 6, a + ' ' + q[a]));
  });

  test('computeQuotas redistributes when an area runs short', () => {
    const q = B.computeQuotas(36, B.AREA_WEIGHTS, { ai: 99, cloud: 99, data: 99, security: 2, emerging: 99 });
    eq(q.security, 2);
    eq(sum(q), 36);
  });

  test('computeQuotas never exceeds what is available', () => {
    const avail = { ai: 4, cloud: 1, data: 0, security: 3, emerging: 2 };
    const q = B.computeQuotas(36, B.AREA_WEIGHTS, avail);
    eq(q, avail);
  });

  // ---------- batches ----------
  test('createState builds a full, unique batch from the library', () => {
    const s = B.createState(LIB, DAY);
    eq(s.batch.ids.length, B.BATCH_SIZE);
    eq(new Set(s.batch.ids).size, B.BATCH_SIZE, 'ids unique');
    const counts = areaCount(s.batch.ids, LIB);
    ok(counts.ai > counts.cloud && counts.ai > counts.data, 'AI weighted highest');
  });

  test('same anchor + batch index always builds the same batch', () => {
    eq(B.createState(LIB, DAY).batch.ids, B.createState(LIB, DAY).batch.ids);
  });

  test('pick removes a topic from the pool and unpick puts it back', () => {
    const s = B.createState(LIB, DAY);
    const id = s.batch.ids[0];
    const topic = LIB.find(t => t.id === id);
    B.pick(s, topic, DAY);
    ok(B.isPicked(s, id));
    ok(!B.spinPool(s, LIB, {}).some(t => t.id === id), 'picked topic left the pool');
    eq(B.spinPool(s, LIB, {}).length, B.BATCH_SIZE - 1);
    B.pick(s, topic, DAY);
    eq(s.picks.length, 1, 'picking twice is a no-op');
    B.unpick(s, id);
    ok(!B.isPicked(s, id));
    eq(B.spinPool(s, LIB, {}).length, B.BATCH_SIZE);
  });

  test('skip hides a topic for the batch and restoreSkipped brings it back', () => {
    const s = B.createState(LIB, DAY);
    const id = s.batch.ids[3];
    B.skip(s, id);
    ok(!B.spinPool(s, LIB, {}).some(t => t.id === id));
    eq(B.restoreSkipped(s), 1);
    ok(B.spinPool(s, LIB, {}).some(t => t.id === id));
  });

  test('spinPool respects area and depth filters', () => {
    const s = B.createState(LIB, DAY);
    const pool = B.spinPool(s, LIB, { area: 'security', depth: 'quick' });
    ok(pool.every(t => t.area === 'security' && t.depth === 'quick'));
  });

  test('no rollover inside the same 3-day batch', () => {
    const s = B.createState(LIB, DAY);
    const before = s.batch.ids.slice();
    eq(B.ensureCurrentBatch(s, LIB, DAY + 2).rolled, false);
    eq(s.batch.ids, before);
  });

  test('rollover moves picks to the vault and retires them forever', () => {
    const s = B.createState(LIB, DAY);
    const picked = s.batch.ids.slice(0, 3).map(id => LIB.find(t => t.id === id));
    picked.forEach(t => B.pick(s, t, DAY));
    B.toggleLearned(s, picked[0].id, DAY + 1);
    const r = B.ensureCurrentBatch(s, LIB, DAY + 3);
    eq(r.rolled, true);
    eq(r.moved, 3);
    eq(s.batch.index, 1);
    eq(s.picks.length, 0, 'tray is empty for the new batch');
    eq(s.vault.map(v => v.id), picked.map(t => t.id));
    ok(s.vault.every(v => v.batch === 0), 'vault remembers the batch number');
    ok(s.vault[0].learned === true, 'learned flag kept in vault');
    picked.forEach(t => ok(!s.batch.ids.includes(t.id), t.id + ' must not return'));
    picked.forEach(t => ok(s.retired.includes(t.id)));
  });

  test('a new batch is made of topics not seen in earlier batches', () => {
    const s = B.createState(LIB, DAY);
    const first = new Set(s.batch.ids);
    B.ensureCurrentBatch(s, LIB, DAY + 3);
    ok(s.batch.ids.every(id => !first.has(id)), 'batch 1 is entirely fresh');
    eq(s.batch.ids.length, B.BATCH_SIZE);
  });

  test('when fresh topics run out, the longest-unseen ones come back first', () => {
    const lib = [].concat(mini(6, 'ai'), mini(6, 'cloud'));
    const s = B.createState(lib, DAY);
    // Simulate: batch 0 showed ai-0..2, batch 1 showed ai-3..5; nothing else fresh.
    s.lastBatched = { 'ai-0': 0, 'ai-1': 0, 'ai-2': 0, 'ai-3': 1, 'ai-4': 1, 'ai-5': 1 };
    lib.filter(t => t.area === 'cloud').forEach(t => { s.lastBatched[t.id] = 1; });
    const ids = B.buildBatchIds(lib, { retired: new Set(), lastBatched: s.lastBatched, size: 3, rng: B.mulberry32(1), weights: { ai: 1 } });
    eq(ids.slice().sort(), ['ai-0', 'ai-1', 'ai-2']);
  });

  test('being away for several batches triggers a single rollover', () => {
    const s = B.createState(LIB, DAY);
    B.pick(s, LIB.find(t => t.id === s.batch.ids[0]), DAY);
    const r = B.ensureCurrentBatch(s, LIB, DAY + 10);
    eq(r.rolled, true);
    eq(s.batch.index, 3);
    eq(s.vault.length, 1);
    eq(s.vault[0].batch, 0);
  });

  test('an exhausted library gives an empty batch without crashing', () => {
    const lib = mini(5, 'ai');
    const s = B.createState(lib, DAY);
    eq(s.batch.ids.length, 5);
    lib.forEach(t => B.pick(s, t, DAY));
    B.ensureCurrentBatch(s, lib, DAY + 3);
    eq(s.batch.ids, []);
    eq(B.spinPool(s, lib, {}), []);
    eq(B.chooseTopic([], {}, Math.random), null);
  });

  test('radar stories can be picked and roll into the vault', () => {
    const s = B.createState(LIB, DAY);
    B.pick(s, { id: 'hn-42', title: 'Some trending story', area: 'ai', url: 'https://example.com', source: 'radar' }, DAY);
    eq(B.spinPool(s, LIB, {}).length, B.BATCH_SIZE, 'radar pick does not touch the pool');
    B.ensureCurrentBatch(s, LIB, DAY + 3);
    eq(s.vault[0].id, 'hn-42');
    eq(s.vault[0].source, 'radar');
  });

  // ---------- choosing ----------
  test('chooseTopic weights AI higher when area is random', () => {
    const pool = [].concat(mini(20, 'ai'), mini(20, 'cloud'), mini(20, 'data'), mini(20, 'security'), mini(20, 'emerging'));
    const rng = B.mulberry32(7);
    let ai = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) if (B.chooseTopic(pool, { area: 'random' }, rng).area === 'ai') ai++;
    const share = ai / N;
    ok(share > 0.31 && share < 0.41, 'AI share ' + share.toFixed(3));
  });

  test('chooseTopic avoids repeating the last topic and prefers unseen ones', () => {
    const pool = mini(3, 'ai');
    const rng = B.mulberry32(3);
    for (let i = 0; i < 50; i++) ok(B.chooseTopic(pool, { avoidId: 'ai-0' }, rng).id !== 'ai-0');
    for (let i = 0; i < 50; i++) eq(B.chooseTopic(pool, { seen: new Set(['ai-0', 'ai-1']) }, rng).id, 'ai-2');
    eq(B.chooseTopic(mini(1, 'ai'), { avoidId: 'ai-0' }, rng).id, 'ai-0', 'falls back when only one');
  });

  // ---------- progress ----------
  test('XP comes from picks, learned topics and timers', () => {
    const s = B.createState(LIB, DAY);
    eq(B.xpOf(s), 0);
    const t = LIB.find(x => x.id === s.batch.ids[0]);
    B.pick(s, t, DAY);
    eq(B.xpOf(s), B.XP.pick);
    eq(B.toggleLearned(s, t.id, DAY), true);
    eq(B.xpOf(s), B.XP.pick + B.XP.learned);
    B.addExplain(s, DAY);
    B.addFocus(s, DAY);
    eq(B.xpOf(s), B.XP.pick + B.XP.learned + B.XP.explain + B.XP.focus);
    eq(B.toggleLearned(s, t.id, DAY), false);
    eq(B.xpOf(s), B.XP.pick + B.XP.explain + B.XP.focus);
  });

  test('learned topics can still be toggled after moving to the vault', () => {
    const s = B.createState(LIB, DAY);
    const t = LIB.find(x => x.id === s.batch.ids[0]);
    B.pick(s, t, DAY);
    B.ensureCurrentBatch(s, LIB, DAY + 3);
    eq(B.toggleLearned(s, t.id, DAY + 3), true);
    eq(s.vault[0].learned, true);
  });

  test('streak grows on consecutive days and resets after a gap', () => {
    const s = B.createState(LIB, DAY);
    B.recordActivity(s, DAY);
    B.recordActivity(s, DAY);
    B.recordActivity(s, DAY + 1);
    eq(B.currentStreak(s, DAY + 1), 2);
    eq(B.currentStreak(s, DAY + 2), 2, 'still alive the next day');
    eq(B.currentStreak(s, DAY + 3), 0, 'broken after a missed day');
    B.recordActivity(s, DAY + 3);
    eq(s.streak.count, 1);
    eq(s.streak.best, 2);
  });

  test('batch progress counts learned picks against the goal', () => {
    const s = B.createState(LIB, DAY);
    s.batch.ids.slice(0, 2).forEach(id => B.pick(s, LIB.find(t => t.id === id), DAY));
    B.toggleLearned(s, s.batch.ids[0], DAY);
    eq(B.batchProgress(s), { picked: 2, learned: 1, goal: B.BATCH_GOAL });
  });

  test('levelFor maps XP to levels with progress to the next one', () => {
    eq(B.levelFor(0).name, 'Explorer');
    eq(B.levelFor(100).name, 'Early Adopter');
    const mid = B.levelFor(200);
    eq(mid.name, 'Early Adopter');
    eq(mid.progress, 0.5);
    eq(B.levelFor(99999).next, null);
  });

  test('normalizeState rejects garbage and keeps valid saves', () => {
    eq(B.normalizeState(null), null);
    eq(B.normalizeState({ v: 999 }), null);
    eq(B.normalizeState('nope'), null);
    const s = B.createState(LIB, DAY);
    const round = B.normalizeState(JSON.parse(JSON.stringify(s)));
    eq(round.batch.ids, s.batch.ids);
    const partial = JSON.parse(JSON.stringify(s));
    delete partial.settings;
    delete partial.streak;
    const fixed = B.normalizeState(partial);
    eq(fixed.settings.area, 'random');
    eq(fixed.streak.count, 0);
  });

  // ---------- library ----------
  test('library: ids unique and every topic well-formed', () => {
    const ids = new Set();
    LIB.forEach(t => {
      ok(!ids.has(t.id), 'duplicate id ' + t.id);
      ids.add(t.id);
      ok(B.AREAS.includes(t.area), t.id + ' bad area ' + t.area);
      ok(B.DEPTHS.includes(t.depth), t.id + ' bad depth ' + t.depth);
      ok(t.heat >= 1 && t.heat <= 5, t.id + ' heat');
      ok(typeof t.eta === 'string' && t.eta.length, t.id + ' eta');
      ok(typeof t.why === 'string' && t.why.length > 30, t.id + ' why');
      ok(Array.isArray(t.learn) && t.learn.length === 3, t.id + ' learn');
      ok(t.title.length <= 48, t.id + ' title too long (' + t.title.length + ')');
    });
  });

  test('library: big enough, AI is the largest area, every filter combo has topics', () => {
    ok(LIB.length >= 140, 'only ' + LIB.length + ' topics');
    const counts = {};
    LIB.forEach(t => { counts[t.area] = (counts[t.area] || 0) + 1; });
    B.AREAS.filter(a => a !== 'ai').forEach(a => ok(counts.ai > counts[a], 'AI vs ' + a));
    B.AREAS.forEach(a => B.DEPTHS.forEach(d => {
      const n = LIB.filter(t => t.area === a && t.depth === d).length;
      ok(n >= 3, a + '/' + d + ' has only ' + n);
    }));
  });

  // ---------- radar ----------
  test('radar tags trending titles with an area and drops non-tech stories', () => {
    const R = window.FSRadar;
    eq(R.classify('Sonnet 5.5'), 'ai');
    eq(R.classify('Dots: Always-on agents'), 'ai');
    eq(R.classify('A new prompt injection attack on browser agents'), 'security');
    eq(R.classify('Postgres 19 released'), 'data');
    eq(R.classify('Kubernetes 1.36: what changed'), 'cloud');
    eq(R.classify('Logical qubits beat physical ones'), 'emerging');
    eq(R.classify('California farmers are struggling to sell grapes'), null);
    eq(R.classify('Ask HN: What are you reading?'), null);
  });

  test('radar items get safe links and are sorted by points', () => {
    const items = window.FSRadar.toItems([
      { objectID: '1', title: 'GPT news', url: 'javascript:alert(1)', points: 10, num_comments: 1 },
      { objectID: '2', title: 'Kubernetes news', url: 'https://k8s.example', points: 50, num_comments: 2 },
      { objectID: '3', title: 'Grapes', url: 'https://x.example', points: 999 }
    ]);
    eq(items.map(i => i.id), ['hn-2', 'hn-1']);
    eq(items[1].url, 'https://news.ycombinator.com/item?id=1', 'unsafe URL replaced with HN discussion');
  });

  // ---------- runner ----------
  // Other suites (e.g. prep.test.js, loaded before this file) register themselves on window.FSTestSuites.
  (window.FSTestSuites || []).forEach(suite => suite.tests.forEach(t => tests.push({ name: suite.name + ': ' + t.name, fn: t.fn })));
  const lines = [];
  let failed = 0;
  tests.forEach(t => {
    try { t.fn(); lines.push('ok   ' + t.name); }
    catch (e) { failed++; lines.push('FAIL ' + t.name + '\n     ' + e.message); }
  });
  lines.push('', (tests.length - failed) + '/' + tests.length + ' passed');
  const out = document.getElementById('results');
  out.textContent = lines.join('\n');
  out.dataset.status = failed ? 'fail' : 'pass';
  document.title = failed ? 'FAIL' : 'PASS';
})();
