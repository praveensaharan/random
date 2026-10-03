/*
 * Effects — synthesized WebAudio sounds (no audio files) and a canvas confetti burst.
 */
(function (root) {
  const reduceMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- sound ----------
  let ctx = null;
  let enabled = true;

  function audio() {
    if (!enabled) return null;
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, opts) {
    const a = audio();
    if (!a) return;
    const o = opts || {};
    const t = a.currentTime + (o.when || 0);
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(o.gain || 0.06, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  const chord = (notes, step, dur, gain) =>
    notes.forEach((f, i) => tone(f, dur, { type: 'triangle', gain, when: i * step }));

  const sound = {
    setEnabled(v) { enabled = !!v; },
    tick() { tone(1500 + Math.random() * 250, 0.025, { type: 'square', gain: 0.018 }); },
    lever() { tone(220, 0.22, { type: 'sawtooth', gain: 0.04, slide: 70 }); },
    land() { chord([523.25, 659.25, 783.99], 0.07, 0.28, 0.06); },
    jackpot() { chord([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.08, 0.4, 0.07); },
    pick() { tone(660, 0.12, { gain: 0.06 }); tone(990, 0.2, { gain: 0.05, when: 0.08 }); },
    learned() { chord([783.99, 987.77, 1174.66, 1567.98], 0.06, 0.3, 0.06); },
    beep() { tone(880, 0.1, { type: 'square', gain: 0.03 }); },
    done() { chord([659.25, 783.99, 1046.5, 1318.5, 1567.98], 0.09, 0.5, 0.07); },
    nope() { tone(200, 0.18, { type: 'square', gain: 0.03, slide: 140 }); }
  };

  // ---------- confetti ----------
  const COLORS = ['#b8f35a', '#22d3ee', '#a78bfa', '#ff4d8d', '#fbbf24', '#ffffff'];
  let canvas = null, c2d = null, parts = [], running = false;

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.getElementById('confetti') || document.body.appendChild(document.createElement('canvas'));
    c2d = canvas.getContext('2d');
    const resize = () => {
      const dpr = root.devicePixelRatio || 1;
      canvas.width = root.innerWidth * dpr;
      canvas.height = root.innerHeight * dpr;
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    root.addEventListener('resize', resize);
  }

  function burst(x, y, count, spread) {
    ensureCanvas();
    const n = Math.round((count || 80) * (reduceMotion ? 0.25 : 1));
    const power = spread || 1;
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = (5 + Math.random() * 9) * power;
      parts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        w: 6 + Math.random() * 6,
        h: 3 + Math.random() * 5,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 0,
        ttl: 90 + Math.random() * 60
      });
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  function burstFrom(el, count, spread) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, count, spread);
  }

  function frame() {
    c2d.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter(p => p.life < p.ttl && p.y < root.innerHeight + 40);
    parts.forEach(p => {
      p.life++;
      p.vy += 0.28;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      c2d.save();
      c2d.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
      c2d.translate(p.x, p.y);
      c2d.rotate(p.rot);
      c2d.fillStyle = p.color;
      c2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c2d.restore();
    });
    if (parts.length) requestAnimationFrame(frame);
    else { running = false; c2d.clearRect(0, 0, canvas.width, canvas.height); }
  }

  root.FSFx = { sound, burst, burstFrom };
})(this);
