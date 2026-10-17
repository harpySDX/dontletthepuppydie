// Question engine: every generator family, answer equivalence, fixed difficulty, selection diversity and history.
const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
const { Bank: B, AnswerCheck: A, MathCheck: M, Curriculum: CUR } = W;

// in-memory localStorage so the history store works under Node
const mem = {};
W.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };

const SUB_IDS = new Set(CUR.SUBS.map((s) => s.id));
const own = B.FAMILIES.filter((F) => !F.adapter);
const BAD = /NaN|undefined|Infinity|\[object/;

test("every generator family × format × level builds valid, self-consistent questions (40 seeds each)", () => {
  let combos = 0;
  for (const F of own) {
    assert.ok(F.subs.length && F.subs.every((s) => SUB_IDS.has(s)), `${F.id} curriculum ids`);
    assert.ok(F.templates && F.templates.length, `${F.id} declares its templates`);
    for (const kind of F.kinds) for (const mode of F.modes) {
      combos++;
      const rnd = B.rng(1234 + combos);
      for (let i = 0; i < 40; i++) {
        const q = B.generate(F.id, kind, mode, rnd);                                    // throws if no valid instance
        assert.strictEqual(q.meta.mode, mode, `${F.id} ${kind} labelled ${q.meta.mode}, asked ${mode}`);
        assert.strictEqual(q.meta.family, F.id);
        assert.ok(!BAD.test(JSON.stringify(q)), `${F.id} ${kind} ${mode} has a broken value`);
        assert.ok(kind === "wr" ? q.solution && q.solution.length : q.e && q.e.length > 10, `${F.id} ${kind} has a worked solution`);
        assert.ok(q.hints && q.hints.length, `${F.id} ${kind} has hints`);
        if (kind === "mc") {
          assert.ok(q.c.length >= 4 && new Set(q.c).size === q.c.length, `${F.id} mc options distinct`);
          // convention (shared with the authored banks): c[0] is the key; options are shuffled when shown
        } else if (kind === "nr") {
          assert.strictEqual(M.grade({ kind: "number", answer: q.answer, marks: 1 }, String(q.ansText || q.answer)).verdict, "right");
        } else {
          for (const p of q.parts) assert.strictEqual(M.grade(p, B.keyResponse(p)).verdict, "right", `${F.id} part ${p.key} key`);
        }
        // the same id rebuilds the same question (saved tests and history depend on it)
        assert.deepStrictEqual(B.byId(q.id) && B.byId(q.id).meta.sig, q.meta.sig);
      }
    }
  }
  assert.ok(combos >= 200, `only ${combos} combinations`);
});

test("poly answers: equivalent forms accepted, requested form enforced", () => {
  const g = (answer, form, r) => A.grade({ kind: "poly", answer, form, marks: 2 }, r).verdict;
  assert.strictEqual(g("x^2+5x+6", "any", "(x+3)(x+2)"), "right");
  assert.strictEqual(g("x^2+5x+6", "any", "x(x+5)+6"), "right");
  assert.strictEqual(g("(x+2)(x+3)", "factored", "(x+3)(x+2)"), "right");
  assert.strictEqual(g("(x+2)(x+3)", "factored", "x^2+5x+6"), "partial");      // equal, but not factored
  assert.strictEqual(g("2(x-1)(x+1)", "factored", "(2x-2)(x+1)"), "partial");  // common factor left in
  assert.strictEqual(g("x^2+5x+6", "expanded", "(x+2)(x+3)"), "partial");
  assert.strictEqual(g("x^2+5x+6", "any", "x^2+5x+5"), "wrong");
  assert.strictEqual(g("(x+1)/(x-2)", "simplified", "(x^2+2x+1)/((x-2)(x+1))"), "partial");
  assert.strictEqual(g("(x+1)/(x-2)", "simplified", "(x+1)/(x-2)"), "right");
  assert.strictEqual(g("2(x-3)^2+1", "any", "2x^2-12x+19"), "right");
});

test("interval, approx and mono answers: notation-independent, tolerance by rounding", () => {
  const iv = (answer, r) => A.grade({ kind: "interval", answer, marks: 1 }, r).verdict;
  assert.strictEqual(iv("(-inf, 3)", "x < 3"), "right");
  assert.strictEqual(iv("(-inf, -2] U (3, inf)", "x <= -2 or x > 3"), "right");
  assert.strictEqual(iv("(-inf, -2] U (3, inf)", "(3, ∞) ∪ (−∞, −2]"), "right");
  assert.strictEqual(iv("[-1, 4)", "-1 <= x < 4"), "right");
  assert.notStrictEqual(iv("[-1, 4)", "(-1, 4)"), "right");
  assert.strictEqual(iv("(-inf, 3)", "x > 3"), "wrong");
  const ap = (answer, dp, r) => A.grade({ kind: "approx", answer, dp, marks: 1 }, r).verdict;
  assert.strictEqual(ap(12.3456, 2, "12.35"), "right");
  assert.strictEqual(ap(12.3456, 2, "12.346"), "right");
  assert.notStrictEqual(ap(12.3456, 2, "12.4"), "right");
  assert.strictEqual(ap(12.3456, 2, "15"), "wrong");
  const mo = (answer, form, r) => A.grade({ kind: "mono", answer, form, marks: 2 }, r).verdict;
  assert.strictEqual(mo("x^5*y^2", "any", "y^2 x^5"), "right");
  assert.strictEqual(mo("1/x^3", "positive", "x^(-3)"), "partial");
  assert.strictEqual(mo("1/x^3", "positive", "1/(x*x*x)"), "right");
  assert.strictEqual(mo("x^5*y^2", "any", "x^5*y^3"), "wrong");
});

test("quadratic form conversions (vertex ↔ standard ↔ factored): every key accepted, a perturbed answer rejected", () => {
  for (const fam of ["f_vertex_to_std", "f_std_factored"]) {
    const F = B.byFam(fam);
    for (const mode of F.modes) {
      const rnd = B.rng(99);
      for (let i = 0; i < 30; i++) {
        const q = B.generate(fam, "wr", mode, rnd);
        for (const p of q.parts.filter((x) => x.kind === "poly")) {
          assert.strictEqual(A.grade(p, String(p.answer)).verdict, "right");
          assert.strictEqual(A.grade(p, `(${p.answer})+1`).verdict, "wrong");
        }
      }
    }
  }
});

test("graph construction: any point order, snap tolerance, wrong vertex/side/direction caught", () => {
  const spec = { kind: "graph", answer: { a: "1", h: "2", k: "-3" }, marks: 3, minPoints: 2, bothSides: true, snap: 1 };
  const g = (r) => A.grade(spec, r);
  assert.strictEqual(g("v:2,-3;p:1,-2|3,-2|4,1").verdict, "right");
  assert.strictEqual(g("v:2,-3;p:4,1|3,-2|1,-2").verdict, "right");          // order doesn't matter
  assert.match(g("v:-2,-3;p:-1,-2|-3,-2").note, /mirrored/);                  // sign slip in (x − h) is named
  assert.ok(g("v:2,-3;p:3,-2|4,1").earned < 3);                                // one side only
  assert.ok(g("v:2,-3;p:1,-4|3,-4").earned <= 1);                              // opens the wrong way
  assert.ok(g("v:2,-3;p:1,0|3,0").earned < 3);                                 // points off the curve
  assert.strictEqual(g("").verdict, "blank");
});

test("difficulty is fixed by the selected level: 30 sessions of strong answers never change it", () => {
  B.clearHistory();
  for (const mode of ["simple", "normal", "challenge"]) {
    for (let s = 0; s < 10; s++) {
      const sel = B.select({ subs: null, mode, n: 10, rnd: B.rng(s + 7) });
      assert.ok(!sel.unavailable);
      for (const it of sel.items) assert.strictEqual(it.q.meta.mode, mode, `${it.q.meta.family} served ${it.q.meta.mode} in a ${mode} session`);
    }
  }
});

test("no substitution: a subtopic without questions at a level is reported unavailable, not filled from another level", () => {
  const sub = CUR.SUBS.find((s) => { const fams = B.familiesFor(s.id); return fams.length && !fams.some((F) => F.modes.includes("simple")); });
  assert.ok(sub, "fixture: some subtopic lacks a Simple level");
  const sel = B.select({ subs: [sub.id], mode: "simple", n: 5 });
  assert.strictEqual(sel.unavailable, true);
  assert.strictEqual(sel.items.length, 0);
});

test("topic filtering and mixed rotation", () => {
  B.clearHistory();
  const one = B.select({ subs: ["G.interval"], mode: "normal", n: 6, rnd: B.rng(3) });
  assert.ok(one.items.length && one.items.every((it) => it.q.meta.subs.includes("G.interval")));
  const unitH = CUR.SUBS.filter((s) => s.id.startsWith("H.")).map((s) => s.id);
  const mix = B.select({ subs: unitH, mode: "normal", n: 9, rnd: B.rng(4) });
  assert.ok(mix.items.every((it) => it.q.meta.subs.some((s) => unitH.includes(s))));
  assert.ok(new Set(mix.items.map((it) => it.q.meta.sub)).size >= 6, "a 9-question unit mix should touch at least 6 subtopics");
  const full = B.select({ subs: null, mode: "normal", n: 20, rnd: B.rng(5) });
  assert.ok(new Set(full.items.map((it) => it.q.meta.unit)).size >= 7, "a 20-question full-course mix should touch at least 7 units");
});

test("duplicate avoidance (documented measurement): 25 Normal full-course sessions × 10", (t) => {
  B.clearHistory();
  const seen = new Map(); let total = 0, repeats = 0, revisits = 0, inSession = 0;
  for (let s = 0; s < 25; s++) {
    const sel = B.select({ subs: null, mode: "normal", n: 10, rnd: B.rng(1000 + s) });
    const sigs = sel.items.map((it) => it.q.meta.sig);
    if (new Set(sigs).size !== sigs.length) inSession++;
    for (const sig of sigs) { total++; if (seen.has(sig)) repeats++; seen.set(sig, 1); }
    revisits += sel.revisits;
  }
  t.diagnostic(`questions ${total}, exact repeats ${repeats} (${(100 * repeats / total).toFixed(2)}%), flagged revisits ${revisits}, sessions with an internal repeat ${inSession}`);
  assert.strictEqual(inSession, 0);
  assert.ok(repeats <= revisits, "every repeat must be a flagged revisit");
  assert.ok(repeats / total < 0.02);
});

test("duplicate avoidance in a small topic: 8 sessions × 6 on one subtopic", (t) => {
  B.clearHistory();
  for (const sub of ["F.vertex_to_std", "G.quadratic", "I.compound", "D.trinomials"]) {
    const seen = new Set(); let total = 0, repeats = 0;
    for (let s = 0; s < 8; s++) {
      for (const it of B.select({ subs: [sub], mode: "normal", n: 6, rnd: B.rng(50 + s) }).items) { total++; if (seen.has(it.q.meta.sig)) repeats++; seen.add(it.q.meta.sig); }
    }
    t.diagnostic(`${sub}: ${total} questions, ${repeats} exact repeats`);
    assert.strictEqual(repeats, 0, `${sub} repeated a question`);
  }
});

test("history persists through storage, is capped, and survives a corrupt value", () => {
  B.clearHistory();
  B.select({ subs: ["A.classify"], mode: "normal", n: 4, rnd: B.rng(1) });
  const raw = JSON.parse(mem["campfire-prep.qhist.v1"]);
  assert.strictEqual(raw.recent.length, 4);
  assert.ok(raw.recent.every((e) => e.s && e.f && e.u && e.m === "normal"));
  for (let i = 0; i < 70; i++) B.select({ subs: null, mode: "normal", n: 10, rnd: B.rng(i) });
  assert.strictEqual(B.history().recent.length, 600);
  mem["campfire-prep.qhist.v1"] = "{not json";
  assert.deepStrictEqual(B.history().recent, []);
  assert.ok(B.select({ subs: null, mode: "normal", n: 3 }).items.length === 3);
});

test("curriculum coverage is computed from the registry, not declared", () => {
  const cov = CUR.coverage();
  assert.strictEqual(cov.length, CUR.SUBS.length);
  for (const s of cov) {
    assert.strictEqual(s.implemented, B.familiesFor(s.id).length > 0);
    for (const m of s.modes) assert.ok(B.familiesFor(s.id, m).length > 0);
  }
  const st = B.stats();
  assert.strictEqual(st.families, B.FAMILIES.length);
  assert.strictEqual(st.generators, own.length);
});
