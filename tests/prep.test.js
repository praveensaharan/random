/* Unit tests for js/prep.js and the interview-prep library. Run via tests/index.html. */
(function () {
  const P = window.FSPrep;
  const LIB = window.PREP_TOPICS;
  const TRACKS = window.PREP_TRACKS;
  const rngFor = seed => window.FSBatch.mulberry32(seed);
  const tests = [];
  const test = (name, fn) => tests.push({ name, fn });
  const ok = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
  const eq = (actual, expected, msg) => {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) throw new Error((msg ? msg + ': ' : '') + 'expected ' + e + ', got ' + a);
  };
  const mini = () => [
    { id: 'a', track: 'llm', roles: 'both', priority: 5, asks: ['q'] },
    { id: 'b', track: 'llm', roles: 'ai', priority: 1, asks: ['q'] },
    { id: 'c', track: 'fde', roles: 'fde', priority: 3, asks: ['q'] },
    { id: 'd', track: 'fde', roles: 'both', priority: 2, asks: ['q'] }
  ];
  const ids = list => list.map(t => t.id);
  const KINDS = ['article', 'video', 'docs', 'guide', 'course', 'book', 'podcast', 'case-study'];

  // ---------- library ----------
  test('prep library: ids are unique and every topic is complete', () => {
    ok(LIB.length >= 40, 'only ' + LIB.length + ' topics');
    const seen = new Set();
    LIB.forEach(t => {
      ok(!seen.has(t.id), 'duplicate id ' + t.id);
      seen.add(t.id);
      ok(TRACKS[t.track], t.id + ': unknown track ' + t.track);
      ok(['both', 'ai', 'fde'].includes(t.roles), t.id + ': bad roles ' + t.roles);
      ok(t.priority >= 1 && t.priority <= 5, t.id + ': priority ' + t.priority);
      ok(t.title && t.gist && t.practice && t.flag, t.id + ': missing text');
      ok(Array.isArray(t.asks) && t.asks.length >= 2, t.id + ': needs 2+ interview questions');
      ok(Array.isArray(t.cover) && t.cover.length >= 3, t.id + ': needs 3+ answer points');
    });
  });

  test('prep library: every track has topics for both roles', () => {
    Object.keys(TRACKS).forEach(track => {
      ok(LIB.filter(t => t.track === track).length >= 5, track + ' has fewer than 5 topics');
      ['ai', 'fde'].forEach(role => {
        const n = LIB.filter(t => P.matches(t, { track, role })).length;
        ok(n >= 2, track + '/' + role + ' has only ' + n);
      });
    });
  });

  test('prep library: every topic has 2+ safe learning links', () => {
    LIB.forEach(t => {
      ok(Array.isArray(t.res) && t.res.length >= 2, t.id + ' has ' + (t.res || []).length + ' links');
      const urls = new Set();
      t.res.forEach(r => {
        ok(Array.isArray(r) && r.length === 4, t.id + ': link must be [kind, title, source, url]');
        ok(KINDS.includes(r[0]), t.id + ': unknown kind ' + r[0]);
        ok(r[1] && r[2], t.id + ': link missing title or source');
        ok(/^https:\/\/[^\s"'<>]+$/.test(r[3]), t.id + ': unsafe url ' + r[3]);
        ok(!urls.has(r[3]), t.id + ': duplicate url ' + r[3]);
        urls.add(r[3]);
      });
    });
  });

  // ---------- pool & filters ----------
  test('spinPool drops picked and skipped topics', () => {
    const s = P.createState();
    P.pick(s, { id: 'a' }, 1);
    P.skip(s, 'c');
    eq(ids(P.spinPool(s, mini(), {})), ['b', 'd']);
  });

  test('role filter keeps topics marked for both roles', () => {
    const s = P.createState();
    eq(ids(P.spinPool(s, mini(), { role: 'ai' })), ['a', 'b', 'd']);
    eq(ids(P.spinPool(s, mini(), { role: 'fde' })), ['a', 'c', 'd']);
    eq(ids(P.spinPool(s, mini(), { track: 'fde', role: 'ai' })), ['d']);
    eq(ids(P.spinPool(s, mini(), { track: 'random', role: 'any' })), ['a', 'b', 'c', 'd']);
  });

  test('picking a skipped topic un-skips it', () => {
    const s = P.createState();
    P.skip(s, 'a');
    P.pick(s, { id: 'a' }, 1);
    eq(s.skipped, []);
    eq(P.pick(s, { id: 'a' }, 1), false, 'second pick is a no-op');
  });

  // ---------- choosing ----------
  test('chooseTopic avoids the current topic and prefers unseen ones', () => {
    const pool = mini();
    const rng = rngFor(7);
    for (let i = 0; i < 50; i++) {
      const t = P.chooseTopic(pool, { avoidId: 'a', seen: new Set(['b', 'c']) }, rng);
      eq(t.id, 'd');
    }
    eq(P.chooseTopic([pool[0]], { avoidId: 'a' }, rng).id, 'a', 'falls back when only the current topic is left');
    eq(P.chooseTopic([], {}, rng), null);
  });

  test('chooseTopic lands on higher-priority topics more often', () => {
    const pool = [{ id: 'hi', priority: 5 }, { id: 'lo', priority: 1 }];
    const rng = rngFor(42);
    let hi = 0;
    for (let i = 0; i < 3000; i++) if (P.chooseTopic(pool, {}, rng).id === 'hi') hi++;
    ok(hi > 2300 && hi < 2700, 'expected ~5/6 high-priority, got ' + hi + '/3000');
  });

  test('seen list resets once every topic has been seen', () => {
    const s = P.createState();
    mini().forEach(t => P.markSeen(s, t.id));
    P.markSeen(s, 'a');
    eq(s.seen.length, 4, 'markSeen does not duplicate');
    eq(P.resetSeenIfDone(s, mini()), true);
    eq(s.seen, []);
  });

  // ---------- readiness ----------
  test('toggleReady flips the flag and readiness counts per track', () => {
    const s = P.createState();
    const tracks = { llm: {}, fde: {} };
    eq(P.toggleReady(s, 'a', 5), null, 'not on the list yet');
    P.pick(s, { id: 'a' }, 5);
    P.pick(s, { id: 'c' }, 5);
    eq(P.toggleReady(s, 'a', 6), true);
    eq(s.picks[0].readyDay, 6);
    const r = P.readiness(s, mini(), tracks);
    eq([r.ready, r.total], [1, 4]);
    eq(r.byTrack.llm, { ready: 1, total: 2 });
    eq(r.byTrack.fde, { ready: 0, total: 2 });
    eq(P.toggleReady(s, 'a', 7), false);
    eq(s.picks[0].readyDay, null);
  });

  // ---------- persistence ----------
  test('normalizeState rejects other versions and cleans unknown or duplicate ids', () => {
    eq(P.normalizeState(null, mini(), TRACKS), null);
    eq(P.normalizeState({ v: 99 }, mini(), TRACKS), null);
    const s = P.normalizeState({
      v: P.VERSION,
      picks: [{ id: 'a', ready: 1 }, { id: 'a' }, { id: 'gone' }, null],
      skipped: ['b', 'gone'],
      seen: 'oops',
      settings: { track: 'nope', role: 'pm' }
    }, mini(), TRACKS);
    eq(s.picks.map(p => [p.id, p.ready]), [['a', true]]);
    eq(s.skipped, ['b']);
    eq(s.seen, []);
    eq([s.settings.track, s.settings.role, s.settings.sound], ['random', 'any', true]);
    eq(s.streak, { count: 0, lastDay: null, best: 0 });
    const inherited = P.normalizeState({ v: P.VERSION, settings: { track: 'constructor' } }, mini(), TRACKS);
    eq(inherited.settings.track, 'random', 'inherited object keys are not tracks');
  });

  window.FSTestSuites = (window.FSTestSuites || []).concat([{ name: 'prep', tests }]);
})();
