const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
const { Concepts } = W;
const all = {
  mc: [...W.MC_BANK, ...W.CH_MC_BANK, ...W.CLASSMATE.mc],
  nr: [...W.NR_BANK, ...W.CH_NR_BANK, ...W.CLASSMATE.nr],
  wr: [...W.WR_BANK, ...W.CH_WR_BANK, ...W.CLASSMATE.wr],
};

test("every question and every written part maps to real concepts", () => {
  for (const kind of ["mc", "nr", "wr"]) for (const q of all[kind]) {
    const cs = Concepts.conceptsFor(q);
    assert.ok(cs.length, `${q.id} has no concept`);
    for (const c of cs) assert.ok(Concepts.get(c), `${q.id} → unknown concept ${c}`);
    if (q.parts) for (const p of q.parts) {
      const pc = Concepts.conceptsFor(q, p.key);
      assert.ok(pc.length, `${q.id}:${p.key} has no concept`);
      for (const c of pc) assert.ok(Concepts.get(c), `${q.id}:${p.key} → unknown ${c}`);
    }
  }
});

test("concept links (prereqs/related) point at real concepts", () => {
  for (const c of Concepts.CONCEPTS) for (const id of [...c.prereqs, ...c.related]) assert.ok(Concepts.get(id), `${c.id} → ${id}`);
});

test("every concept has lesson content and at least 4 quiz questions (MC/NR, normal + Tim's)", () => {
  for (const c of Concepts.CONCEPTS) {
    assert.ok(c.summary && c.explanation.length && c.examples.length >= 2 && c.mistakes.length >= 2, `${c.id} content`);
    const n = [...W.MC_BANK, ...W.CLASSMATE.mc, ...W.NR_BANK, ...W.CLASSMATE.nr].filter((q) => Concepts.conceptsFor(q).includes(c.id)).length;
    assert.ok(n >= 4, `${c.id} only has ${n} quiz questions`);
  }
});

test("concept ids are unique and use unit.name form", () => {
  const ids = Concepts.CONCEPTS.map((c) => c.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  for (const c of Concepts.CONCEPTS) assert.match(c.id, /^[a-z]+\.[a-z_]+$/);
});
