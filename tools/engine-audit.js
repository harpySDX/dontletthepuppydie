// Engine audit: measures repetition and mode drift in the question system as it stood before the overhaul.
// node tools/engine-audit.js
require("../tests/load.js");
const QB = global.QuadBank, C = global.Concepts;
const shape = (s) => String(s).replace(/\\\(|\\\)|\\left|\\right|\\displaystyle|\\,/g, "").replace(/-?\d+(\.\d+)?/g, "#").replace(/\s+/g, " ").trim();
const stemOf = (q) => (q.q || q.intro || "") + "|" + (q.parts ? q.parts.map((p) => p.prompt).join("|") : "") + "|" + (q.c ? q.c.join("|") : "");
const out = { families: [] };
const N = Number(process.env.N || 200);
for (const F of QB.FAMILIES) {
  for (const kind of F.kinds) for (const lv of F.modes) {
    const stems = new Set(), shapes = new Set(); let ok = 0;
    for (let i = 0; i < N; i++) { try { const q = QB.generate(F.id, kind, lv); ok++; stems.add(stemOf(q)); shapes.add(shape(stemOf(q))); } catch {} }
    out.families.push({ fam: F.id, kind, lv, n: ok, distinct: stems.size, dupRate: +(1 - stems.size / ok).toFixed(3), shapes: shapes.size });
  }
}
// mode substitution inside practicePool
const sub = {};
for (const c of C.CONCEPTS.filter((c) => c.unit === "quadratics")) {
  for (const lv of ["simple", "normal", "challenge"]) {
    const items = QB.practicePool(c.id, lv, 30);
    const off = items.filter(([, q]) => q.meta.mode !== lv).length;
    if (off) (sub[lv] = sub[lv] || []).push(`${c.id}: ${off}/${items.length} served at ${[...new Set(items.filter(([, q]) => q.meta.mode !== lv).map(([, q]) => q.meta.mode))].join("/")}`);
  }
}
out.modeSubstitution = sub;
// hand-written pools used by concept quizzes outside quadratics
const pools = {};
const all = [...global.MC_BANK.map((q) => ["mc", q]), ...global.NR_BANK.map((q) => ["nr", q]), ...global.CLASSMATE.mc.map((q) => ["mc", q]), ...global.CLASSMATE.nr.map((q) => ["nr", q])];
for (const c of C.CONCEPTS.filter((c) => c.unit !== "quadratics")) pools[c.id] = all.filter(([, q]) => C.conceptsFor(q).includes(c.id)).length;
out.handWrittenQuizPools = pools;
const worst = out.families.filter((f) => f.dupRate > 0.2).sort((a, b) => b.dupRate - a.dupRate);
console.log(JSON.stringify({ worstDuplicateFamilies: worst.slice(0, 25), modeSubstitution: sub, handWrittenQuizPools: pools }, null, 1));
console.log("families×kind×mode measured:", out.families.length, " mean dup rate:", (out.families.reduce((a, f) => a + f.dupRate, 0) / out.families.length).toFixed(3));
