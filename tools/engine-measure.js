// Measurements for docs/ENGINE.md: catalogue counts, raw generator diversity, and repetition/level drift
// before (QuadBank.practicePool, no history) vs after (Bank.select with history). node tools/engine-measure.js
require("../tests/load.js");
const B = global.Bank, QB = global.QuadBank, C = global.Concepts, CU = global.Curriculum;
const mem = {}; global.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
const N = Number(process.env.N || 200);
const out = { stats: B.stats() };

// 1. raw generator diversity (independent seeds, no history): share of duplicates among N draws
const rows = [];
for (const F of B.FAMILIES.filter((F) => !F.adapter)) for (const kind of F.kinds) for (const mode of F.modes) {
  const sigs = new Set(), rnd = B.rng(42);
  for (let i = 0; i < N; i++) sigs.add(B.generate(F.id, kind, mode, rnd).meta.sig);
  rows.push({ f: F.id, kind, mode, distinct: sigs.size, dup: 1 - sigs.size / N });
}
out.rawDiversity = { combos: rows.length, meanDupRate: +(rows.reduce((a, r) => a + r.dup, 0) / rows.length).toFixed(3), medianDistinct: rows.map((r) => r.distinct).sort((a, b) => a - b)[Math.floor(rows.length / 2)], smallest: rows.sort((a, b) => a.distinct - b.distinct).slice(0, 12).map((r) => `${r.f} ${r.kind} ${r.mode}: ${r.distinct}/${N}`) };

// 2. sessions: 10 sessions × 6 questions per quadratics concept at Normal — repeats across sessions, and level drift
const stemOf = (q) => (q.q || q.intro || "") + "|" + (q.parts ? q.parts.map((p) => p.prompt + JSON.stringify(p.answer)).join("|") : "") + "|" + (q.c ? q.c.join("|") : "");
let oldTotal = 0, oldRep = 0, oldOff = 0, newTotal = 0, newRep = 0, newOff = 0, newRevisit = 0;
for (const c of C.CONCEPTS.filter((c) => c.unit === "quadratics")) {
  for (const lv of ["simple", "normal", "challenge"]) {
    const seenO = new Set(), seenN = new Set();
    B.clearHistory();
    for (let s = 0; s < 10; s++) {
      for (const [, q] of QB.practicePool(c.id, lv, 6)) { oldTotal++; const k = stemOf(q); if (seenO.has(k)) oldRep++; seenO.add(k); if (q.meta.mode !== lv) oldOff++; }
      const sel = B.select({ concept: c.id, mode: lv, n: 6 });
      if (sel.unavailable) continue;
      for (const it of sel.items) { newTotal++; const k = stemOf(it.q); if (seenN.has(k)) newRep++; seenN.add(k); if (it.q.meta.mode !== lv) newOff++; }
      newRevisit += sel.revisits;
    }
  }
}
out.quadSessions = {
  before: { questions: oldTotal, exactRepeats: oldRep, repeatRate: +(oldRep / oldTotal).toFixed(3), servedAtAnotherLevel: oldOff },
  after: { questions: newTotal, exactRepeats: newRep, repeatRate: +(newRep / newTotal).toFixed(3), servedAtAnotherLevel: newOff, flaggedRevisits: newRevisit },
};

// 3. whole course at Normal: 30 sessions × 10
B.clearHistory();
let t = 0, r = 0; const seen = new Set(), units = new Set();
for (let s = 0; s < 30; s++) for (const it of B.select({ subs: null, mode: "normal", n: 10 }).items) { t++; if (seen.has(it.q.meta.sig)) r++; seen.add(it.q.meta.sig); units.add(it.q.meta.unit); }
out.fullCourse = { questions: t, exactRepeats: r, unitsTouched: units.size };

// 4. coverage
const cov = CU.coverage();
out.coverage = { subtopics: cov.length, implemented: cov.filter((c) => c.implemented).length, allThreeLevels: cov.filter((c) => c.status === "implemented").length, partial: cov.filter((c) => c.status === "partial").map((c) => `${c.id} (${c.modes.join("/")})`), missing: cov.filter((c) => c.status === "missing").map((c) => c.id) };
console.log(JSON.stringify(out, null, 2));
