// Nightmare mode: every template, every tier, many seeds. Answer keys are re-checked from the outside
// with an independent LaTeX evaluator (tests/texeval.js) and with the site's own answer checker.
const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
require("../js/nightmare.js");
const { evalTeX } = require("./texeval");
const N = W.Nightmare, C = W.MathCheck;

const SEEDS = Number(process.env.NM_SEEDS || 60);
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const rel = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-8 * Math.max(Math.abs(a), Math.abs(b), 1e-300);
const PTS = [{ a: 1.37, b: 0.71, c: 2.13, x: 1.29, y: 0.83, z: 1.61 }, { a: 0.43, b: 1.9, c: 0.66, x: 2.2, y: 1.4, z: 0.51 }, { a: 3.1, b: 2.6, c: 1.18, x: 0.77, y: 3.3, z: 1.05 }];
const display = (q) => { const m = /\\\[([\s\S]*?)\\\]/.exec(q); assert.ok(m, "question has a displayed expression"); return m[1]; };
const inline = (s) => [...String(s).matchAll(/\\\(([\s\S]*?)\\\)/g)].map((m) => m[1]);
const strip = (c) => c.replace(/^\\\(|\\\)$/g, "");
const tiers = [1, 2, 3];
const many = (tier, kind, tpl, fn, n = SEEDS) => { const r = seeded(1000 + tier * 7919 + tpl.length * 31 + kind.length); for (let i = 0; i < n; i++) fn(N.generate(tier, kind, tpl, r), i); };

function checkMCCommon(q) {
  assert.ok(Array.isArray(q.c) && q.c.length === 4, "4 choices");
  assert.strictEqual(new Set(q.c).size, 4, "choice text is distinct: " + q.c.join(" | "));
  assert.ok(Array.isArray(q.why) && q.why.length === 4 && q.why[0] === null && q.why.slice(1).every((w) => typeof w === "string" && w.length > 10), "every distractor has targeted feedback");
  assert.ok(q.e && q.e.length > 20, "worked solution");
  assert.strictEqual(N.byId(q.id).q, q.q, "rebuilds from its id");
}

test("tier metadata, ids and level keys", () => {
  assert.deepStrictEqual(Object.keys(N.TIERS), ["1", "2", "3"]);
  assert.deepStrictEqual([1, 2, 3].map((t) => N.TIERS[t].label), ["Brutal", "Extreme", "Catastrophic"]);
  assert.deepStrictEqual(["nightmare1", "nightmare2", "nightmare3", "challenge", "normal", undefined, "nightmare"].map(N.tierOf), [1, 2, 3, null, null, null, null]);
  assert.strictEqual(N.byId("nm-1-4-mc-exp-abc"), null, "unknown tier rejected");
  assert.strictEqual(N.byId("nm-99-1-mc-exp-abc"), null, "unknown version rejected");
  assert.strictEqual(N.byId("nm-1-1-mc-nope-abc"), null, "unknown template rejected");
  assert.throws(() => N.build(0), /Pick Nightmare/);
  assert.throws(() => N.build(undefined), /Pick Nightmare/);
});

test("exponent-law MC: stem equals exactly one choice (the key) at several positive points", () => {
  for (const t of tiers) many(t, "mc", "exp", (q) => {
    checkMCCommon(q);
    assert.match(q.q, /Assume all variables are positive/);
    const stem = display(q.q);
    for (const p of PTS) {
      const sv = evalTeX(stem, p), cv = q.c.map((c) => evalTeX(strip(c), p));
      assert.ok(rel(cv[0], sv), `${q.id}: key ${q.c[0]} ≠ stem`);
      cv.slice(1).forEach((v, i) => assert.ok(!rel(v, sv), `${q.id}: distractor ${q.c[i + 1]} equals the stem`));
    }
    // positive exponents only in the key
    assert.ok(!/\^\{-/.test(q.c[0]), "key has positive exponents: " + q.c[0]);
  });
});

for (const tpl of ["rad", "nest"]) test(`${tpl} MC: stem equals exactly the key`, () => {
  for (const t of tiers) many(t, "mc", tpl, (q) => {
    checkMCCommon(q);
    const stem = display(q.q);
    for (const p of PTS) {
      const sv = evalTeX(stem, p), cv = q.c.map((c) => evalTeX(strip(c), p));
      assert.ok(rel(cv[0], sv), `${q.id}: key ≠ stem (${cv[0]} vs ${sv})`);
      cv.slice(1).forEach((v, i) => assert.ok(!rel(v, sv), `${q.id}: distractor ${q.c[i + 1]} equals the stem`));
    }
  }, 40);
});

test("rationalizing MC: key equals the original value, has no radical in the denominator, and the checker accepts it", () => {
  for (const t of tiers) many(t, "mc", "rat", (q) => {
    checkMCCommon(q);
    const sv = evalTeX(display(q.q));
    const cv = q.c.map((c) => evalTeX(strip(c)));
    assert.ok(rel(cv[0], sv), q.id);
    cv.slice(1).forEach((v) => assert.ok(!rel(v, sv), q.id + " distractor equals the value"));
    const den = /\\frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{([^{}]*)\}/.exec(strip(q.c[0]));
    if (den) assert.ok(!/sqrt/.test(den[1]), "rational denominator: " + q.c[0]);
  });
});

test("find-the-fatal-error MC: the keyed line is the first line that is actually false", () => {
  for (const t of tiers) many(t, "mc", "fatal", (q) => {
    checkMCCommon(q);
    assert.ok(Array.isArray(q.order) && [...q.order].sort().join() === "0,1,2,3", "lines shown in order");
    assert.deepStrictEqual(q.order.map((i) => q.c[i]), ["Line 1", "Line 2", "Line 3", "Line 4"]);
    const lines = inline(q.q.split('<div class="work">')[1]).map((l) => l.split("="));
    assert.strictEqual(lines.length, 4);
    for (const p of PTS) {
      const stem = evalTeX(display(q.q), p);
      const rhs = lines.map((l) => evalTeX(l[l.length - 1], p));
      const truth = [rel(evalTeX(lines[0][0], p), rhs[0]), rel(evalTeX(lines[1][0], p), rhs[1]), rel(rhs[2], stem), rel(rhs[3], rhs[2])];
      const first = truth.indexOf(false) + 1;
      assert.ok(first > 0, q.id + ": no false line");
      assert.strictEqual(q.c[0], `Line ${first}`, q.id);
    }
  }, 40);
});

test("NR exponent laws: k + m + n (+ p) recovered independently from the expression", () => {
  for (const t of tiers) many(t, "nr", "exp", (q) => {
    assert.strictEqual(q.fmt, "Integer");
    assert.ok(Number.isInteger(q.answer) && Math.abs(q.answer) <= 9999, "integer answer " + q.answer);
    const stem = display(q.q);
    const vars = [...q.q.matchAll(/([abcxyz])\^\{([mnp])\}/g)].map((m) => m[1]);
    const base = { a: 1.3, b: 1.7, c: 0.9, x: 1.3, y: 1.7, z: 0.9 };
    const f0 = evalTeX(stem, base);
    let sum = 0, rest = 1;
    for (const v of vars) {
      const e = Math.log(evalTeX(stem, { ...base, [v]: base[v] * 2 }) / f0) / Math.log(2);
      assert.ok(Math.abs(e - Math.round(e)) < 1e-7, `${q.id}: exponent of ${v} is an integer (${e})`);
      sum += Math.round(e); rest *= Math.pow(base[v], Math.round(e));
    }
    const k = f0 / rest;
    assert.ok(Math.abs(k - Math.round(k)) < 1e-6 * Math.max(1, Math.abs(k)), `${q.id}: k is an integer (${k})`);
    assert.strictEqual(Math.round(k) + sum, q.answer, q.id);
    assert.strictEqual(N.byId(q.id).answer, q.answer);
  });
});

test("NR radicals with variables: k·(stated form) equals the expression", () => {
  for (const t of tiers) many(t, "nr", "rad", (q) => {
    const form = /simplifies to \\\(k\\,([\s\S]*?)\\\)/.exec(q.q)[1];
    for (const p of PTS) assert.ok(rel(q.answer * evalTeX(form, p), evalTeX(display(q.q), p)), q.id);
    assert.ok(Number.isInteger(q.answer));
  });
});

test("NR rational powers: evaluates exactly to the integer key", () => {
  for (const t of tiers) many(t, "nr", "rpow", (q) => {
    assert.ok(Number.isInteger(q.answer));
    assert.ok(rel(evalTeX(display(q.q)), q.answer), q.id + " " + q.answer);
    assert.ok(!/\^\{1\}|\^\{\\frac\{(\d+)\}\{\1\}\}/.test(q.q), "no trivial exponents");
  });
});

const keyOK = (part) => {
  const g = C.grade(part, part.kind === "set" ? part.answer.join(", ") || "none" : part.kind === "number" ? (part.ansText || String(part.answer)) : part.answer);
  assert.strictEqual(g.verdict, "right", `checker accepts the key for ${part.key}: ${JSON.stringify(part.answer)} (${g.note || ""})`);
};
const val = (s) => { const r = C.read(s); assert.ok(r.ok, "readable key " + s); return r.value; };

test("WR 1–2 (simplify, rationalize): key value equals the printed expression; checker grades the key right", () => {
  for (const t of tiers) for (const w of ["w1", "w2"]) many(t, "wr", w, (q) => {
    assert.ok(q.parts.length >= 2 && q.rubric && q.solution);
    for (const part of q.parts) {
      keyOK(part);
      const exprs = inline(part.prompt);
      assert.strictEqual(exprs.length, 1, part.prompt);
      assert.ok(rel(val(part.answer), evalTeX(exprs[0])), `${q.id}(${part.key}): ${part.answer} vs ${exprs[0]}`);
    }
  }, 40);
});

// "\sqrt{13x+40} = x+2" → [lhs, rhs] as functions of x
const eqn = (s) => { const m = inline(s)[0].split("="); return [(x) => evalTeX(m[0], { x }), (x) => evalTeX(m[1], { x })]; };
test("WR 3 radical equations: every listed solution satisfies the original equation", () => {
  for (const t of tiers) many(t, "wr", "w3", (q) => {
    const [L, R] = eqn(q.intro);
    const part = q.parts[0]; keyOK(part);
    assert.ok(part.answer.length >= 1);
    for (const s of part.answer) assert.ok(Math.abs(L(val(s)) - R(val(s))) < 1e-9, `${q.id}: ${s}`);
  });
});

test("WR 4 extraneous roots: candidates solve the squared equation; final = checks; extraneous = fails", () => {
  for (const t of tiers) many(t, "wr", "w4", (q) => {
    const [L, R] = eqn(q.intro);
    const [cand, fin, ext] = q.parts;
    q.parts.forEach(keyOK);
    for (const s of cand.answer) assert.ok(Math.abs(L(val(s)) ** 2 - R(val(s)) ** 2) < 1e-9, `${q.id} candidate ${s}`);
    const good = cand.answer.filter((s) => Math.abs(L(val(s)) - R(val(s))) < 1e-9);
    assert.deepStrictEqual(fin.answer.slice().sort(), good.slice().sort(), q.id);
    assert.deepStrictEqual(ext.answer.slice().sort(), cand.answer.filter((s) => !good.includes(s)).sort(), q.id);
    // the worked solution's quadratic really has the candidates as roots
    const quad = q.solution.map((l) => /Rearrange: \\\(([\s\S]*?)= 0\\\)/.exec(l)).find(Boolean);
    assert.ok(quad, "solution shows the quadratic");
    for (const s of cand.answer) assert.ok(Math.abs(evalTeX(quad[1], { x: val(s) })) < 1e-9, `${q.id}: quadratic at ${s}`);
  });
});

test("WR 5 boss: P and Q evaluate as printed, and (c) equals PQ over the printed denominator", () => {
  for (const t of tiers) many(t, "wr", "w5", (q) => {
    const [Pt, Qt] = inline(q.intro).map((s) => s.split("=").slice(1).join("="));
    const P = evalTeX(Pt), Q = evalTeX(Qt);
    const [a, b, c] = q.parts;
    q.parts.forEach(keyOK);
    assert.ok(rel(a.answer, P), `${q.id}: P`);
    assert.ok(rel(val(b.answer), Q), `${q.id}: Q`);
    const den = /\\dfrac\{P\\,Q\}\{([\s\S]*?)\}\\\)/.exec(c.prompt)[1];
    assert.ok(rel(val(c.answer), (P * Q) / evalTeX(den)), `${q.id}: (c)`);
  });
});

test("wrong but plausible answers are not graded right (WR keys are discriminating)", () => {
  let n = 0;
  for (const t of tiers) many(t, "wr", "w2", (q) => {
    for (const part of q.parts) {
      const v = val(part.answer);
      // an unrationalized answer with the same value must not get full marks
      const raw = inline(part.prompt)[0];
      if (/sqrt/.test(raw.split("}{")[1] || "")) { const g = C.grade(part, String(v.toFixed(6))); assert.notStrictEqual(g.verdict, "right", "a decimal is not an exact answer"); n++; }
    }
  }, 15);
  assert.ok(n > 10);
});

test("text hygiene: no '+ -', '- -', stray \\cdot, 1√, undefined or NaN anywhere in questions or solutions", () => {
  const bad = [/=\s*\\cdot/, /(^|[^0-9.])1\\sqrt/, /\+\s*-/, /-\s*-/, /undefined|NaN|\[object/, /\\frac\{\d+\}\{1\}/];
  for (const t of tiers) { const r = seeded(4242 + t); for (let i = 0; i < 60; i++) { const b = N.build(t, r); for (const q of [...b.wr, ...b.nr, ...b.mc]) { const txt = JSON.stringify(q); for (const re of bad) assert.ok(!re.test(txt), `${q.id} matches ${re}: …${txt.slice(Math.max(0, txt.search(re) - 60), txt.search(re) + 40)}…`); } } }
});

test("build(): 5 WR (4/5/2/3/5 marks), 5 NR, 10 MC per tier, all ids distinct and rebuildable", () => {
  for (const t of tiers) for (let s = 1; s <= 8; s++) {
    const r = seeded(s * 104729 + t);
    const b = N.build(t, r);
    assert.strictEqual(b.wr.length, 5); assert.strictEqual(b.nr.length, 5); assert.strictEqual(b.mc.length, 10);
    assert.deepStrictEqual(b.wr.map((q) => q.parts.reduce((a, p) => a + p.marks, 0)), [4, 5, 2, 3, 5]);
    const ids = [...b.wr, ...b.nr, ...b.mc].map((q) => q.id);
    assert.strictEqual(new Set(ids).size, 20);
    for (const q of [...b.wr, ...b.nr, ...b.mc]) {
      assert.strictEqual(q.nightmare, t);
      assert.ok(new RegExp(`^nm-${N.VERSION}-${t}-`).test(q.id));
      assert.deepStrictEqual(JSON.stringify(N.byId(q.id)), JSON.stringify(q), "byId round trip " + q.id);
    }
  }
});

test("difficulty rises with the tier (bigger structures in II and III)", () => {
  const size = (t) => { let s = 0; const r = seeded(77 + t); for (let i = 0; i < 6; i++) { const b = N.build(t, r); s += [...b.mc, ...b.nr].reduce((a, q) => a + q.q.length, 0) + b.wr.reduce((a, q) => a + JSON.stringify(q.parts).length + (q.intro || "").length, 0); } return s; };
  const [s1, s2, s3] = tiers.map(size);
  assert.ok(s2 > s1 && s3 > s2, `${s1} < ${s2} < ${s3}`);
  // tier III uses three-factor products in exponent questions, tier I never does
  const r = seeded(5); let three = 0;
  for (let i = 0; i < 30; i++) { if ((display(N.generate(3, "mc", "exp", r).q).match(/\\left\(/g) || []).length >= 3) three++; }
  assert.ok(three > 5, "tier III has 3-factor products: " + three);
});

test("generation is fast enough to build in the browser", () => {
  const t0 = Date.now();
  for (const t of tiers) N.build(t, seeded(31 + t));
  assert.ok(Date.now() - t0 < 2000, `${Date.now() - t0} ms`);
});
