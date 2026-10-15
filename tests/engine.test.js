const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
const { Learning, Concepts, Group } = W;
const DAY = 86400000, NOW = new Date(2026, 9, 20, 12).getTime();
const ids = Concepts.CONCEPTS.map((c) => c.id);
const r = (concept, session, earned, daysAgo, qid, extra = {}) => ({ concepts: [concept], session, earned, max: 1, date: NOW - daysAgo * DAY, source: "quiz", level: "normal", qid: qid || "q" + Math.random(), ...extra });

test("mastery: high accuracy in ONE sitting is not Confident", () => {
  const rs = ["s1", "s2"].flatMap((s) => [r("radicals.simplify", s, 1, 0, s + "a"), r("radicals.simplify", s, 1, 0, s + "b")]);
  const p = Learning.profile(rs, ids, NOW)["radicals.simplify"];
  assert.strictEqual(p.status, "consolidating");
  assert.match(Learning.explain(p), /gap of at least 2 days/);
});

test("mastery: varied questions + a good session after a gap → Confident", () => {
  const rs = [r("radicals.simplify", "s1", 1, 5, "a"), r("radicals.simplify", "s1", 1, 5, "b"), r("radicals.simplify", "s2", 1, 1, "c"), r("radicals.simplify", "s2", 1, 1, "d")];
  const p = Learning.profile(rs, ids, NOW)["radicals.simplify"];
  assert.strictEqual(p.retrievals, 1);
  assert.strictEqual(p.distinct, 4);
  assert.strictEqual(p.status, "confident");
});

test("mastery: repeating the SAME question doesn't count as variety", () => {
  const rs = [r("exponents.laws", "s1", 1, 5, "same"), r("exponents.laws", "s1", 1, 5, "same"), r("exponents.laws", "s2", 1, 1, "same"), r("exponents.laws", "s2", 1, 1, "same")];
  const p = Learning.profile(rs, ids, NOW)["exponents.laws"];
  assert.strictEqual(p.distinct, 1);
  assert.strictEqual(p.status, "consolidating");
});

test("mastery: Challenge answers never lower accuracy but count as variety when right", () => {
  const rs = [r("exponents.laws", "s1", 1, 5, "a"), r("exponents.laws", "s2", 1, 1, "b"), r("exponents.laws", "s2", 1, 1, "b2"), r("exponents.laws", "h", 0, 1, "h1", { level: "challenge" }), r("exponents.laws", "h", 1, 1, "h2", { level: "challenge" })];
  const p = Learning.profile(rs, ids, NOW)["exponents.laws"];
  assert.strictEqual(p.accuracy, 1);
  assert.strictEqual(p.hardRight, 1);
  assert.strictEqual(p.distinct, 4);
});

test("spaced repetition: steps up on good sessions, resets on bad, due dates follow the intervals", () => {
  const good = [r("factoring.special", "s1", 1, 10, "a"), r("factoring.special", "s2", 1, 8, "b"), r("factoring.special", "s3", 1, 4, "c")];
  const sc = Learning.profile(good, ids, NOW)["factoring.special"].schedule;
  assert.deepStrictEqual(sc.history.map((h) => h.step), [1, 2, 3]);
  assert.strictEqual(sc.interval, 7);
  assert.strictEqual(sc.isDue, false);
  assert.strictEqual(sc.overdueDays, -3);
  const bad = [...good, r("factoring.special", "s4", 0, 1, "d"), r("factoring.special", "s4", 0, 1, "e")];
  const sc2 = Learning.profile(bad, ids, NOW)["factoring.special"].schedule;
  assert.strictEqual(sc2.step, 0);
  assert.strictEqual(sc2.interval, 1);
  assert.strictEqual(sc2.isDue, true);
  assert.match(Learning.scheduleText(sc2), /overdue|due today/);
});

test("spaced repetition: new evidence reschedules (deterministic replay)", () => {
  const rs = [r("radicals.multiply", "s1", 1, 6, "a")];
  const before = Learning.profile(rs, ids, NOW)["radicals.multiply"].schedule;
  assert.ok(before.isDue);
  const after = Learning.profile([...rs, r("radicals.multiply", "s2", 1, 0, "b")], ids, NOW)["radicals.multiply"].schedule;
  assert.strictEqual(after.isDue, false);
  assert.strictEqual(after.step, 2);
});

test("mistakes: deduplicated per question, categorised, and fixed after spaced right retries", () => {
  const rec = (d, earned, extra = {}) => ({ qid: "nr-7", concepts: ["exponents.negative"], session: "x" + d, earned, max: 1, date: NOW - d * DAY, source: "quiz", level: "normal", response: "-4", ...extra });
  const ms = Learning.mistakes([rec(10, 0), rec(9, 0)], { now: NOW, answerOf: () => 4 });
  assert.strictEqual(ms.length, 1);
  assert.strictEqual(ms[0].times, 2);
  assert.strictEqual(ms[0].autoCategory, "sign");
  assert.ok(ms[0].isDue);
  const fixed = Learning.mistakes([rec(10, 0), rec(8, 1, { response: "4" }), rec(5, 1, { response: "4" }), rec(1, 1, { response: "4" })], { now: NOW });
  assert.strictEqual(fixed[0].fixed, true);
  assert.strictEqual(fixed[0].isDue, false);
  const relapse = Learning.mistakes([rec(10, 0), rec(8, 1), rec(5, 0)], { now: NOW });
  assert.strictEqual(relapse[0].step, 0);
  assert.strictEqual(relapse[0].times, 2);
  assert.strictEqual(Learning.mistakes([rec(3, 1)], { now: NOW }).length, 0, "a right answer alone is never a mistake");
});

test("mistakes: written-response grader notes map to categories; unknown stays 'not sure'", () => {
  const base = { qid: "wr4-1", concepts: ["radicals.equations"], session: "t", max: 1, earned: 0, date: NOW, source: "test" };
  const ms = Learning.mistakes([{ ...base, part: "c", note: "You kept a value that doesn't check — it's extraneous." }, { ...base, part: "a", note: "" }, { ...base, part: "b", blank: true, verdict: "blank" }], { now: NOW });
  const by = Object.fromEntries(ms.map((m) => [m.part, m]));
  assert.strictEqual(by.c.autoCategory, "checking");
  assert.strictEqual(by.a.autoCategory, "unknown");
  assert.strictEqual(by.a.autoSure, false);
  assert.strictEqual(by.b.autoCategory, "blank");
});

test("exam plan: only study days before the exam, reviews first, weak concepts revisited, no out-of-scope work", () => {
  const rs = ["s1", "s2"].flatMap((s) => [r("exponents.negative", s, 0, 3), r("exponents.negative", s, 0, 3), r("radicals.simplify", s, 0, 3), r("radicals.simplify", s, 1, 3)]);
  const prof = Learning.profile(rs, ids, NOW);
  const recs = Learning.recommend(prof, { concepts: Concepts.CONCEPTS, now: NOW });
  const d = new Date(NOW + 6 * DAY); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const plan = Learning.examPlan({ prof, recs, concepts: Concepts.CONCEPTS, unitOf: (id) => Concepts.get(id).unit, exam: { date: iso, units: ["exponents"], minutesPerDay: 30, days: [1, 2, 3, 4, 5] }, now: NOW });
  assert.strictEqual(plan.daysLeft, 6);
  for (const day of plan.days) {
    assert.ok([1, 2, 3, 4, 5].includes(new Date(day.date).getDay()));
    assert.ok(day.used <= 30);
    for (const t of day.tasks) if (t.concept) assert.strictEqual(Concepts.get(t.concept).unit, "exponents", "radicals is out of scope");
  }
  const all = plan.days.flatMap((x) => x.tasks);
  assert.ok(all.some((t) => t.type === "review"), "a review is planned for the due concept");
  assert.ok(all.filter((t) => t.concept === "exponents.negative").length >= 2, "weak concept comes back for a follow-up");
  assert.ok(!JSON.stringify(plan).match(/guarantee|ready for/i));
  const past = Learning.examPlan({ prof, recs, concepts: Concepts.CONCEPTS, unitOf: (id) => Concepts.get(id).unit, exam: { date: "2020-01-01" }, now: NOW });
  assert.strictEqual(past.days.length, 0);
});

test("room codes round-trip and reject tampering; result codes carry only name + marks", () => {
  const start = Date.UTC(2026, 9, 21, 18, 30);
  const code = Group.encodeRoom({ concepts: 0b1010000000000101, count: 10, synced: true, pace: 120, hints: false, seed: 12345, start });
  assert.match(code, /^R[0-9A-Z]{3}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  const r2 = Group.decodeRoom(code.toLowerCase());
  assert.deepStrictEqual({ mask: r2.mask, count: r2.count, pace: r2.pace, synced: r2.synced, hints: r2.hints, seed: r2.seed, start: r2.start }, { mask: 0b1010000000000101, count: 10, pace: 120, synced: true, hints: false, seed: 12345, start });
  const bad = code.slice(0, -1) + (code.endsWith("0") ? "1" : "0");
  assert.strictEqual(Group.decodeRoom(bad), null);
  assert.strictEqual(Group.decodeGroup(code), null, "room codes are not group-test codes");
  const res = Group.encodeRoomResult({ room: code, name: "Aubrey", marks: [true, false, null, true] });
  assert.deepStrictEqual(Group.decodeRoomResult(res), { room: Group.normalize(code), name: "Aubrey", marks: [true, false, null, true] });
});
