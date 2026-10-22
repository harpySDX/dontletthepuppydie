// Physics 11: kinematics model, answer checker, question generators and curriculum claims.
// Expected values are computed here with closed-form formulas written independently of js/physics/model.js.
const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
require("../js/physics/curriculum.js");
require("../js/physics/content.js");
const { PhysModel: P, PhysCheck: C, Bank: B, PhysCurriculum: CUR, PhysContent: CON } = W;

const mem = {};
W.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };

const g = 9.81, D = Math.PI / 180;
const close = (a, b, rel = 1e-9, msg) => assert.ok(Math.abs(a - b) <= Math.max(rel * Math.abs(b), 1e-9), `${msg || ""} got ${a}, want ${b}`);

// ───────── model ─────────
test("model: horizontal launch from a height", () => {
  const p = P.launch({ v0: 12, angle: 0, h0: 20 });
  const t = Math.sqrt((2 * 20) / g);
  assert.ok(p.ok);
  close(p.tLand, t); close(p.range, 12 * t); close(p.yMax, 20); close(p.tApex, 0);
  close(p.impact.vy, -g * t); close(p.impact.speed, Math.hypot(12, g * t));
  close(p.impact.angleBelow, Math.atan2(g * t, 12) / D);
});
test("model: angled launch, equal heights matches the range formula and symmetric flight", () => {
  for (const [v, a] of [[20, 30], [15, 45], [9, 70], [31, 12]]) {
    const p = P.launch({ v0: v, angle: a });
    const vy = v * Math.sin(a * D), vx = v * Math.cos(a * D);
    close(p.tLand, (2 * vy) / g); close(p.tApex, vy / g); close(p.yMax, (vy * vy) / (2 * g));
    close(p.range, (v * v * Math.sin(2 * a * D)) / g); close(P.sameHeightRange(v, a), p.range);
    close(p.impact.vy, -vy, 1e-9, "lands with -vy"); close(p.impact.vx, vx);
    close(p.apexX, p.range / 2);
  }
  // complementary angles give the same range
  close(P.launch({ v0: 18, angle: 25 }).range, P.launch({ v0: 18, angle: 65 }).range);
});
test("model: angled launch to a lower and to a higher landing", () => {
  const v = 14, a = 40, vy = v * Math.sin(a * D), vx = v * Math.cos(a * D);
  const down = P.launch({ v0: v, angle: a, h0: 9 });
  const tDown = (vy + Math.sqrt(vy * vy + 2 * g * 9)) / g;
  close(down.tLand, tDown); close(down.range, vx * tDown); close(down.yMax, 9 + (vy * vy) / (2 * g));
  const up = P.launch({ v0: v, angle: a, yLand: 2 });
  const tUp = (vy + Math.sqrt(vy * vy - 2 * g * 2)) / g; // the later root: on the way down
  close(up.tLand, tUp); close(up.range, vx * tUp);
  // a landing height above the apex is never reached
  const nope = P.launch({ v0: v, angle: a, yLand: 50 });
  assert.strictEqual(nope.ok, false); assert.strictEqual(nope.error, "never-reaches");
});
test("model: straight up / straight down, positive vs negative vertical velocity", () => {
  const up = P.vertical(15, 0);
  close(up.tApex, 15 / g); close(up.yMax, (15 * 15) / (2 * g)); close(up.tLand, 30 / g); close(up.range, 0);
  const dn = P.vertical(-5, 30);
  close(dn.vy, -5); close(dn.tLand, (-5 + Math.sqrt(25 + 2 * g * 30)) / g); close(dn.yMax, 30); close(dn.tApex, 0);
  const s = P.stateAt(up, 2);
  close(s.vy, 15 - g * 2); assert.ok(s.vy < 0, "falling after the apex"); close(s.y, 15 * 2 - 0.5 * g * 4);
  close(s.ax, 0); close(s.ay, -g);
});
test("model: components, state at a time, times at a height", () => {
  const c = P.components(25, 37);
  close(c.x, 25 * Math.cos(37 * D)); close(c.y, 25 * Math.sin(37 * D));
  close(P.speedFromComponents(c.x, c.y), 25); close(P.angleFromComponents(c.x, c.y), 37);
  const p = P.launch({ v0: 20, angle: 50, h0: 3 });
  const s = P.stateAt(p, 1.3);
  close(s.x, 20 * Math.cos(50 * D) * 1.3); close(s.vx, 20 * Math.cos(50 * D)); close(s.speed, Math.hypot(s.vx, s.vy));
  const ts = P.timesAtHeight(p, 8);
  assert.strictEqual(ts.length, 2);
  for (const t of ts) close(P.stateAt(p, t).y, 8, 1e-9);
  assert.strictEqual(P.timesAtHeight(p, 1000), null);
  // samples start at launch and end at landing
  const ss = P.samples(p, 40);
  assert.strictEqual(ss.length, 41); close(ss[0].y, 3); close(ss[40].y, 0, 1e-9);
});
test("model: rejects invalid inputs instead of returning nonsense", () => {
  for (const bad of [{ v0: -1, angle: 30 }, { v0: 10, angle: 95 }, { v0: 10, angle: 30, g: 0 }, { v0: NaN, angle: 30 }, { v0: 10, angle: "x" }])
    assert.strictEqual(P.launch(bad).ok, false, JSON.stringify(bad));
  // launched at ground level aimed downward: no flight
  assert.strictEqual(P.launch({ v0: 10, angle: -20 }).ok, false);
});
test("units, parsing, significant figures and formatting", () => {
  close(P.toSI(36, "km/h"), 10); close(P.fromSI(10, "km/h"), 36); close(P.toSI(250, "cm"), 2.5); close(P.toSI(450, "ms"), 0.45);
  close(P.toSI(90, "°"), 90); assert.ok(Number.isNaN(P.toSI(3, "furlong")));
  for (const [s, v] of [["12.5", 12.5], ["−3", -3], ["1.2e3", 1200], ["1.2×10^3", 1200], ["1.2 x 10^-3", 0.0012], ["1.2*10^3", 1200], ["1.2·10³", 1200], ["12,5", 12.5], [".5", 0.5]]) close(P.parseNumber(s), v, 1e-12, s);
  for (const s of ["", "abc", "1..2", "12 m", "1,234,5"]) assert.ok(Number.isNaN(P.parseNumber(s)), s);
  assert.deepStrictEqual(P.parseQty("12.4 m/s"), { value: 12.4, unit: "m/s" });
  assert.deepStrictEqual(P.parseQty("1.2e3 m"), { value: 1200, unit: "m" });
  assert.deepStrictEqual(P.parseQty("3.0|s"), { value: 3, unit: "s" });
  assert.strictEqual(P.parseQty("45°").unit, "°");
  assert.strictEqual(P.parseQty("7").unit, "");
  assert.strictEqual(P.roundSig(0.012345, 3), 0.0123); assert.strictEqual(P.roundSig(98765, 2), 99000);
  assert.strictEqual(P.sigFigs("0.00450"), 3); assert.strictEqual(P.sigFigs("1200"), 2); assert.strictEqual(P.sigFigs("1200."), 4); assert.strictEqual(P.sigFigs("3.20×10^4"), 3);
  assert.strictEqual(P.fmt(9.8123), "9.81"); assert.strictEqual(P.fmt(-0.5), "−0.500"); assert.strictEqual(P.fmt(1234567), "1.23×10^6"); assert.strictEqual(P.fmt(NaN), "—");
  assert.strictEqual(P.fmtTeX(0.000123), "1.23\\times 10^{-4}");
});

// ───────── checker ─────────
const spec = (o) => Object.assign({ kind: "qty", dim: "speed", answer: 12.4, marks: 1 }, o);
test("checker: right within tolerance, in any unit of the right kind", () => {
  for (const r of ["12.4 m/s", "12.4|m/s", "12.45 m/s", "44.64 km/h", "1.24e1 m/s", "12,4 m/s"]) assert.strictEqual(C.grade(spec(), r).verdict, "right", r);
  assert.strictEqual(C.grade(spec(), "13 m/s").verdict, "wrong");
  assert.strictEqual(C.grade(spec(), "").verdict, "blank");
  assert.strictEqual(C.grade(spec(), "|m/s").verdict, "blank");
});
test("checker: unit problems are told apart from arithmetic", () => {
  assert.strictEqual(C.grade(spec(), "12.4 m").noteKey, "ph.note.dim");
  assert.strictEqual(C.grade(spec(), "12.4 m").cat, "unit");
  assert.strictEqual(C.grade(spec(), "12.4").noteKey, "ph.note.unit");             // several speed units possible → must say which
  assert.strictEqual(C.grade(spec({ units: ["m/s"] }), "12.4").verdict, "right");   // only one allowed unit → assumed
  const slip = C.grade(spec(), "12.4 km/h");                                         // right number, wrong unit
  assert.strictEqual(slip.noteKey, "ph.note.unitSlip"); assert.strictEqual(slip.cat, "unit");
  assert.strictEqual(C.grade(spec(), "twelve").noteKey, "ph.note.number");
});
test("checker: sign errors, magnitudes, named wrong paths, rounding", () => {
  const v = spec({ answer: -9.9 });
  assert.strictEqual(C.grade(v, "9.9 m/s").noteKey, "ph.note.sign");
  assert.strictEqual(C.grade(v, "9.9 m/s").cat, "sign");
  assert.strictEqual(C.grade(spec({ answer: -9.9, magnitude: true }), "9.9 m/s").noteKey, "ph.note.magnitude");
  assert.strictEqual(C.grade(spec({ answer: -9.9, signed: false }), "9.9 m/s").verdict, "right");
  const w = C.grade(spec({ wrongs: [{ value: 6.2, key: "ph.w.half", cat: "algebra" }] }), "6.2 m/s");
  assert.strictEqual(w.noteKey, "ph.w.half"); assert.strictEqual(w.cat, "algebra");
  assert.strictEqual(C.grade(spec(), "12.8 m/s").noteKey, "ph.note.round");
  assert.strictEqual(C.grade(spec(), "12.8 m/s").cat, "numerical");
  // degrees: no radians accepted silently
  const ang = { kind: "qty", dim: "angle", answer: 30, units: ["°"], marks: 1 };
  assert.strictEqual(C.grade(ang, "30").verdict, "right");
  assert.notStrictEqual(C.grade(ang, "0.5236").verdict, "right");
});
test("checker: multiple choice and ordering", () => {
  const mc = { kind: "pmc", answer: 2, why: { 0: { key: "ph.w.half", cat: "algebra" } } };
  assert.strictEqual(C.grade(mc, "2").verdict, "right");
  assert.strictEqual(C.grade(mc, "0").cat, "algebra");
  assert.strictEqual(C.grade(mc, "1").cat, "conceptual");
  const ord = { kind: "order", answer: [2, 0, 1] };
  assert.strictEqual(C.grade(ord, "2,0,1").verdict, "right");
  const bad = C.grade(ord, "2,1,0"); assert.strictEqual(bad.verdict, "wrong"); assert.deepStrictEqual(bad.noteVars, { n: 2 });
  assert.throws(() => C.grade({ kind: "essay" }, "x"));
});

// ───────── generators ─────────
const PHYS = B.FAMILIES.filter((F) => F.subject === "physics");
const LV = ["simple", "normal", "challenge", "nightmare"];
const BAD = /NaN|undefined|Infinity|\[object/;

test("all sixteen+ physics families exist and are registered as physics", () => {
  assert.ok(PHYS.length >= 16, `${PHYS.length} families`);
  for (const F of PHYS) assert.strictEqual(B.subjectOf(F), "physics");
});
test("every physics family × level: 60 seeds, valid, keys grade right, distinct options, same id rebuilds", () => {
  for (const F of PHYS) for (const mode of F.modes) {
    for (let s = 1; s <= 60; s++) {
      const q = B.make(F.id, "wr", mode, s * 977 + 13);
      assert.strictEqual(q.meta.mode, mode); assert.strictEqual(q.meta.subject, "physics");
      assert.ok(!BAD.test(JSON.stringify(q)), `${F.id} ${mode} broken value`);
      C.validate(q);
      for (const p of q.parts) {
        assert.strictEqual(C.grade(p, C.keyResponse(p)).verdict, "right", `${F.id} ${mode} part ${p.key}`);
        assert.ok(Array.isArray(p.skills) && p.skills.length, `${F.id} part ${p.key} skills`);
        if (p.kind === "pmc") for (let i = 0; i < p.options.length; i++) if (i !== p.answer) assert.notStrictEqual(C.grade(p, String(i)).verdict, "right");
        if (p.kind === "qty") for (const w of p.wrongs || []) if (Number.isFinite(w.value)) {
          const u = (p.units || [])[0]; if (!u) continue;
          assert.notStrictEqual(C.grade(p, `${P.fromSI(w.value, u)}|${u}`).verdict, "right", `${F.id} wrong path graded right`);
        }
      }
      assert.deepStrictEqual(B.byId(q.id).meta.sig, q.meta.sig);
    }
  }
});
test("physics keys agree with an independent calculation from the numbers shown", () => {
  let checked = 0;
  for (const fam of ["ph_horizontal", "ph_angled_same", "ph_angled_diff", "ph_downward", "ph_vertical", "ph_impact", "ph_velocity_at", "ph_components"]) for (const mode of ["simple", "normal", "challenge", "nightmare"]) {
    const F = B.FAMILIES.find((f) => f.id === fam); if (!F.modes.includes(mode)) continue;
    for (let s = 1; s <= 40; s++) {
      const q = B.make(fam, "wr", mode, s * 31 + 5), f = q.fig;
      if (!f) continue;
      if (f.type === "vector") {
        for (const p of q.parts) {
          if (/v_\{0x\}/.test(p.prompt.en)) { close(p.answer, f.mag * Math.cos(f.angle * D), 1e-6); checked++; }
          if (/v_\{0y\}/.test(p.prompt.en)) { close(p.answer, f.mag * Math.sin(f.angle * D), 1e-6); checked++; }
        }
        continue;
      }
      if (f.type !== "scene" || f.target) continue;
      const vx = f.v0 * Math.cos(f.angle * D), vy = f.v0 * Math.sin(f.angle * D), dh = f.h0 - f.yLand;
      const T = (vy + Math.sqrt(vy * vy + 2 * g * dh)) / g, vyI = vy - g * T;
      if (f.show && f.show.includes("v0")) assert.ok(q.stem.en.includes(P.fmt(f.v0, 3).replace(/\.?0+$/, "")) || q.stem.en.includes(String(f.v0)), `${fam}: shown v0 ${f.v0} in "${q.stem.en}"`);
      for (const p of q.parts) {
        const e = p.prompt.en; let want;
        if (/^Time of flight/.test(e)) want = T;
        else if (/^Horizontal distance travelled before landing/.test(e)) want = vx * T;
        else if (/^Speed just before landing/.test(e)) want = Math.hypot(vx, vyI);
        else if (/^Vertical velocity just before landing/.test(e)) want = vyI;
        else if (/^Angle of the velocity below the horizontal just before landing/.test(e)) want = Math.atan2(-vyI, vx) / D;
        else if (/^Maximum height above the ground/.test(e)) want = f.h0 + (vy > 0 ? (vy * vy) / (2 * g) : 0);
        else if (/^Maximum height above the launch point/.test(e)) want = vy > 0 ? (vy * vy) / (2 * g) : 0;
        else if (/^Time to reach the highest point/.test(e)) want = vy / g;
        else if (f.mark !== undefined && /^Horizontal velocity/.test(e)) want = vx;
        else if (f.mark !== undefined && /^Vertical velocity \\\(v_y\\\) at/.test(e)) want = vy - g * f.mark;
        else if (f.mark !== undefined && /^Speed at t/.test(e)) want = Math.hypot(vx, vy - g * f.mark);
        else if (f.mark !== undefined && /^Height above the launch point at t/.test(e)) want = vy * f.mark - 0.5 * g * f.mark * f.mark;
        if (want === undefined) continue;
        close(p.answer, want, 1e-6, `${fam} ${mode} "${e}"`); checked++;
      }
    }
  }
  assert.ok(checked > 600, `only ${checked} values cross-checked`);
});
test("difficulty is fixed: a run at one level never contains another level's questions", () => {
  for (const mode of LV) {
    const qs = B.select({ subject: "physics", mode, n: 10, kinds: ["wr"], rnd: B.rng(99) }).items.map((x) => x.q);
    assert.ok(qs.length >= 6, `${mode}: ${qs.length}`);
    for (const q of qs) { assert.strictEqual(q.meta.mode, mode); assert.strictEqual(q.meta.subject, "physics"); }
  }
  // and math selection never leaks physics
  for (const { q } of B.select({ mode: "normal", n: 12, rnd: B.rng(5) }).items) assert.notStrictEqual(q.meta.subject, "physics");
});
test("variety: repeated seeds give many different numbers and stems", () => {
  for (const F of PHYS) for (const mode of F.modes) {
    const sigs = new Set();
    for (let s = 1; s <= 30; s++) sigs.add(JSON.stringify(B.make(F.id, "wr", mode, s * 7 + 1).parts.map((p) => p.answer)) + B.make(F.id, "wr", mode, s * 7 + 1).stem.en);
    const min = ["ph_concepts", "ph_equations", "ph_insufficient"].includes(F.id) ? 4 : 10;
    assert.ok(sigs.size >= min, `${F.id} ${mode}: only ${sigs.size} distinct of 30`);
  }
});
test("selection by family and the separate physics history", () => {
  const before = JSON.stringify(B.history ? B.history("math") : null);
  const qs = B.select({ subject: "physics", mode: "normal", n: 5, families: ["ph_horizontal"], rnd: B.rng(3) }).items.map((x) => x.q);
  assert.ok(qs.length && qs.every((q) => q.meta.family === "ph_horizontal"));
  assert.ok(mem["campfire-prep.phys.qhist.v1"], "physics history stored under its own key");
  assert.strictEqual(JSON.stringify(B.history ? B.history("math") : null), before, "math history untouched by physics practice");
});

// ───────── curriculum & content claims ─────────
test("curriculum: every subtopic claimed as tested has generators at every level it lists, tests cover them", () => {
  const cov = CUR.coverage();
  const famIds = new Set(PHYS.map((F) => F.id));
  for (const sub of cov) {
    if (sub.status === "tested") {
      assert.ok(CUR.TESTED.has(sub.id));
      assert.ok(sub.families.length && sub.families.every((f) => famIds.has(f)), `${sub.id} families`);
    }
    if (sub.status === "planned") assert.strictEqual(sub.families.length, 0, `${sub.id} is planned but has families`);
    assert.ok(["tested", "validation", "planned", "supplementary"].includes(sub.status), sub.status);
    for (const l of ["en", "fr", "es", "de", "zh"]) assert.ok(sub.title[l], `${sub.id} title ${l}`);
  }
  for (const id of CUR.TESTED) assert.ok(cov.find((s) => s.id === id && s.status === "tested"), `${id} claimed tested`);
  // every family points at real subtopics
  for (const F of PHYS) for (const s of F.subs) assert.ok(cov.find((c) => c.id === s), `${F.id} → ${s}`);
  // projectile motion is the implemented core; unbuilt units stay planned
  assert.ok(cov.filter((s) => s.unit === "PC").every((s) => s.status === "tested" || s.status === "validation"));
  assert.ok(cov.some((s) => s.status === "planned"));
});
test("lessons and formula reference: five languages, worked examples computed from the model", () => {
  const ls = Array.isArray(CON.LESSONS) ? CON.LESSONS : Object.values(CON.LESSONS);
  assert.ok(ls.length >= 8);
  const hasAll = (t) => t && ["en", "fr", "es", "de", "zh"].every((l) => typeof t[l] === "string" && t[l].length);
  for (const L of ls) {
    assert.ok(hasAll(L.title), `${L.id} title`);
    const ex = CON.workedExample(L);
    if (ex) assert.ok(!BAD.test(JSON.stringify(ex)), `${L.id} worked example has a broken value`);
  }
  const fs = Array.isArray(CON.FORMULAS) ? CON.FORMULAS : Object.values(CON.FORMULAS);
  assert.ok(fs.length >= 6);
  for (const f of fs) assert.ok(f.tex || f.eq || f.latex, "formula has an equation");
});

// ───────── Physics tests (shared engine): topics offered = topics that generate; options respected ─────────
require("../js/physics/test.js");
test("Physics tests: every offered topic at every test level builds a full test of valid questions from that topic", () => {
  const PT = W.PhysTest;
  for (const level of PT.TEST_LEVELS) {
    for (const t of PT.topics(level).filter((x) => x.ok)) {
      const subs = PT.subsFor(t.id);
      const n = PT.COUNTS[level][0];
      const { questions, opts } = PT.build(level, { topic: t.id, n, rnd: B.rng(17) });
      assert.strictEqual(questions.length, n, `${level} ${t.id}: ${questions.length}/${n}`);
      assert.strictEqual(opts.n, n);
      for (const q of questions) {
        assert.strictEqual(q.meta.mode, level, `${level} ${t.id}`);
        assert.ok(q.meta.subs.some((s) => subs.includes(s)), `${level} ${t.id}: ${q.meta.family} is off-topic`);
        if (level === "nightmare") assert.ok(PT.NIGHTMARE_FAMS.includes(q.meta.family), q.meta.family);
        C.validate(q);
        for (const p of q.parts) assert.strictEqual(C.grade(p, C.keyResponse(p)).verdict, "right");
      }
    }
    // topics that are not offered really have no generator at that level
    for (const t of PT.topics(level).filter((x) => !x.ok && x.id !== PT.MIX)) {
      const F = B.FAMILIES.filter((f) => f.subject === "physics" && f.subs.includes(t.id) && f.modes.includes(level) && (level !== "nightmare" || PT.NIGHTMARE_FAMS.includes(f.id)));
      assert.strictEqual(F.length, 0, `${level} ${t.id} hidden but generatable`);
    }
  }
});
test("Physics tests: answered() ignores a unit with no value; default lengths per level", () => {
  const PT = W.PhysTest;
  assert.strictEqual(PT.answered({ kind: "qty" }, "|m/s"), false);
  assert.strictEqual(PT.answered({ kind: "qty" }, "3|m/s"), true);
  assert.strictEqual(PT.answered({ kind: "pmc" }, "0"), true);
  assert.strictEqual(PT.answered({ kind: "order" }, ""), false);
  assert.deepStrictEqual(Object.keys(PT.DEFAULTS), ["normal", "challenge", "nightmare"]);
  assert.throws(() => PT.build("simple", {}));
});
test("Physics mixed tests follow the blueprint: mostly calculation, at most a couple of reasoning questions, harder by level", () => {
  const PT = W.PhysTest, REASON = new Set(["ph_concepts", "ph_graphs", "ph_equations", "ph_error", "ph_insufficient", "ph_units"]);
  const stats = {};
  for (const level of PT.TEST_LEVELS) {
    let parts = 0, qs = 0, unequal = 0;
    for (let s = 1; s <= 25; s++) {
      const { questions } = PT.build(level, { topic: PT.MIX, n: PT.DEFAULTS[level].n, rnd: B.rng(s * 17), preview: true });
      assert.strictEqual(questions.length, PT.DEFAULTS[level].n);
      assert.strictEqual(new Set(questions.map((q) => q.meta.sig)).size, questions.length, "no repeats inside a test");
      assert.ok(questions.filter((q) => REASON.has(q.meta.family)).length <= (level === "nightmare" ? 1 : 2), `${level}: too many reasoning-only questions`);
      for (const q of questions) { assert.strictEqual(q.meta.mode, level); qs++; parts += q.parts.length; if (q.parts.some((p) => (p.skills || []).includes("unequal"))) unequal++; }
    }
    stats[level] = { ppq: parts / qs, unequal: unequal / qs };
  }
  assert.ok(stats.challenge.ppq > stats.normal.ppq, JSON.stringify(stats));
  assert.ok(stats.nightmare.unequal > stats.challenge.unequal && stats.challenge.unequal >= stats.normal.unequal, JSON.stringify(stats));
});
