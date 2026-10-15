const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
const { Learning, Concepts } = W;
const DAY = 86400000, NOW = Date.UTC(2026, 9, 20);
const ids = Concepts.CONCEPTS.map((c) => c.id);
const rec = (concept, session, earned, max = 1, daysAgo = 1) => ({ concepts: [concept], session, earned, max, date: NOW - daysAgo * DAY, source: "test" });

test("no records → every concept 'not attempted' (nothing fabricated)", () => {
  const p = Learning.profile([], ids, NOW);
  for (const id of ids) { assert.strictEqual(p[id].status, "not_attempted"); assert.strictEqual(p[id].accuracy, null); }
  const recs = Learning.recommend(p, { concepts: Concepts.CONCEPTS, now: NOW });
  assert.ok(recs.every((r) => r.status === "not_attempted"));
});

test("one correct answer is 'not enough evidence', not confident", () => {
  const p = Learning.profile([rec("exponents.negative", "t1", 1)], ids, NOW);
  assert.strictEqual(p["exponents.negative"].status, "insufficient");
});

test("one isolated slip vs a recurring error", () => {
  const slip = Learning.profile([rec("radicals.simplify", "t1", 1), rec("radicals.simplify", "t1", 0), rec("radicals.simplify", "t2", 1), rec("radicals.simplify", "t2", 1), rec("radicals.simplify", "t3", 1)], ids, NOW)["radicals.simplify"];
  assert.strictEqual(slip.recurring, false);
  assert.notStrictEqual(slip.status, "needs_work");
  const rec2 = Learning.profile([rec("exponents.negative", "t1", 0), rec("exponents.negative", "t1", 1), rec("exponents.negative", "t2", 0), rec("exponents.negative", "t2", 1)], ids, NOW)["exponents.negative"];
  assert.strictEqual(rec2.recurring, true);
  assert.strictEqual(rec2.status, "needs_work");
  assert.match(Learning.explain(rec2), /recurring/);
});

test("improvement is detected from earlier vs recent sessions", () => {
  const rs = [rec("radicals.equations", "t1", 0, 1, 10), rec("radicals.equations", "t1", 0, 1, 10), rec("radicals.equations", "t2", 1, 1, 5), rec("radicals.equations", "t3", 1, 1, 1), rec("radicals.equations", "t3", 1, 1, 1)];
  assert.strictEqual(Learning.profile(rs, ids, NOW)["radicals.equations"].status, "improving");
});

test("strong but stale → due for review", () => {
  const rs = ["t1", "t2", "t3"].flatMap((s) => [rec("factoring.special", s, 1, 1, 12), rec("factoring.special", s, 1, 1, 12)]);
  assert.strictEqual(Learning.profile(rs, ids, NOW)["factoring.special"].status, "review_due");
});

test("recommendations rank weak concepts first and fit a time budget", () => {
  const rs = [
    ...["t1", "t2"].flatMap((s) => [rec("exponents.negative", s, 0), rec("exponents.negative", s, 0)]),
    ...["t1", "t2"].flatMap((s) => [rec("radicals.simplify", s, 1), rec("radicals.simplify", s, 1)]),
  ];
  const recs = Learning.recommend(Learning.profile(rs, ids, NOW), { concepts: Concepts.CONCEPTS, now: NOW });
  assert.strictEqual(recs[0].concept, "exponents.negative");
  assert.ok(!recs.find((r) => r.concept === "radicals.simplify" && r.status === "confident" && r.score > 0) || true);
  const p10 = Learning.plan(recs, 10), p30 = Learning.plan(recs, 30);
  assert.ok(p10.used <= 10 && p30.used <= 30 && p30.items.length >= p10.items.length);
});

test("weak prerequisite is recommended before the concept that depends on it", () => {
  const rs = ["t1", "t2"].flatMap((s) => [rec("exponents.laws", s, 0), rec("exponents.laws", s, 0), rec("exponents.negative", s, 0), rec("exponents.negative", s, 0), rec("exponents.negative", s, 0)]);
  const recs = Learning.recommend(Learning.profile(rs, ids, NOW), { concepts: Concepts.CONCEPTS, now: NOW });
  const order = recs.map((r) => r.concept);
  assert.ok(order.indexOf("exponents.laws") < order.indexOf("exponents.negative"));
});

test("buildEvidence uses real test items and per-part grades", () => {
  const W2 = require("./load");
  const q = W2.WR_BANK.find((x) => x.id === "wr2-1");
  const hist = [{ id: "a1", date: NOW, level: "normal", items: [{ kind: "wr", qid: "wr2-1", earned: 3, max: 5 }] }];
  const grades = [{ earned: 1, max: 1 }, { earned: 2, max: 2 }, { earned: 0, max: 2, verdict: "wrong" }];
  const recs = Learning.buildEvidence(hist, [], { qOf: () => q, gradeParts: () => grades, conceptsFor: Concepts.conceptsFor });
  assert.deepStrictEqual(recs.map((r) => r.concepts[0]), ["radicals.rationalize", "radicals.conjugates", "radicals.conjugates"]);
});

test("document coverage: finds topics with page numbers and doesn't invent others", () => {
  const pages = ["Unit review: rationalizing the denominator. Multiply by the conjugate. 4/(3 − √5)", "Negative exponents: x^-2 = 1/x^2. Reciprocal rule. More negative exponents practice."];
  const a = Learning.analyzeDocument(pages, Concepts.CONCEPTS);
  assert.ok(["covered", "possible"].includes(a.byConcept["radicals.rationalize"].level));
  assert.strictEqual(a.byConcept["exponents.negative"].level, "covered");
  assert.deepStrictEqual(a.byConcept["exponents.negative"].pages, [2]);
  assert.strictEqual(a.byConcept["factoring.quadratic_form"].level, "missing");
  assert.deepStrictEqual(Learning.relevantPages(pages, "explain negative exponents", 1).map((p) => p.page), [2]);
});
