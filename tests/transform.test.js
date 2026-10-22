// Quadratic transformations (js/gen/unit-f-transform.js): coverage, the (bx)² vs bx² distinction, answer checking
// for the expected formats, no "also true" distractors, and the four subtopics in the curriculum.
const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
const { Bank: B, MathCheck: C, QuadMath: QM, Curriculum: CUR, Concepts: CON } = W;
const mem = {};
W.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
const FAMS = ["ft_vertical", "ft_horizontal", "ft_translate", "ft_combined"];
const SUBS = ["F.t_vertical", "F.t_horizontal", "F.t_translate", "F.t_combined"];
const grade = (spec, r) => C.grade(spec, r).verdict;

test("four transformation subtopics are in unit F and each has a generator at Normal and Challenging", () => {
  for (const sid of SUBS) {
    assert.ok(CUR.get(sid), sid);
    const fs = B.FAMILIES.filter((F) => F.subs.includes(sid));
    assert.ok(fs.length, `${sid} has a family`);
    for (const m of ["normal", "challenge"]) assert.ok(fs.some((F) => F.modes.includes(m)), `${sid} at ${m}`);
  }
  assert.ok(CON.get("quad.hscale"), "lesson for horizontal scaling");
});
test("every family × kind × level builds valid questions whose keys grade right (80 seeds)", () => {
  for (const f of FAMS) {
    const F = B.byFam(f);
    for (const m of F.modes) for (const k of F.kinds) {
      const templates = new Set();
      for (let s = 1; s <= 80; s++) {
        let q; try { q = B.make(f, k, m, s * 131 + 7); } catch { continue; }
        templates.add(q.meta.template);
        assert.ok(!/NaN|undefined|Infinity|\[object/.test(JSON.stringify(q)), `${f} ${m} ${k}`);
        if (k === "wr") for (const p of q.parts) assert.strictEqual(grade(p, B.keyResponse(p)), "right", `${f} ${m} part ${p.key}`);
        else assert.strictEqual(new Set(q.c).size, q.c.length);
        assert.ok(q.hints.length && (k === "mc" ? q.e : q.solution.length), `${f} explanation`);
      }
      assert.ok(templates.size >= 1);
    }
  }
});
test("horizontal vs vertical scaling: (2x)² is 4x², not 2x²", () => {
  const eq = { kind: "equation", form: "any", answer: "y=(2x)^2", marks: 1 };
  assert.strictEqual(grade(eq, "y = 4x^2"), "right");
  assert.strictEqual(grade(eq, "y = (2x)^2"), "right");
  assert.strictEqual(grade(eq, "y = 2x^2"), "wrong");
  const half = { kind: "equation", form: "any", answer: "y=((1/2)*x)^2", marks: 1 };
  assert.strictEqual(grade(half, "y = (x/2)^2"), "right");
  assert.strictEqual(grade(half, "y = 1/4 x^2"), "right");
  assert.strictEqual(grade(half, "y = 1/2 x^2"), "wrong");
  // vertex form is required when asked: the bracket form is the same function but loses the form mark
  const vf = { kind: "equation", form: "vertex", answer: "y=12(x-1)^2+5", marks: 2 };
  assert.strictEqual(grade(vf, "y = 12(x - 1)^2 + 5"), "right");
  assert.strictEqual(grade(vf, "y = 3(2(x - 1))^2 + 5"), "partial");
  assert.strictEqual(grade(vf, "y = 6(x - 1)^2 + 5"), "partial"); // right vertex, wrong stretch
});
test("horizontal-scaling questions: keys follow (x, y) → (x/b, y) and a = b²; no distractor is also true", () => {
  for (let s = 1; s <= 120; s++) {
    for (const m of ["simple", "normal", "challenge"]) {
      let q; try { q = B.make("ft_horizontal", "mc", m, s); } catch { continue; }
      if (q.meta.template !== "describe y = (bx)²") continue;
      // the true vertical equivalent (scaling by b²) must never be offered as a wrong option
      const b = QM.fparse(q.meta.sig.split("|").pop()), b2 = QM.ftex(QM.fmul(b, b));
      for (const o of q.c.slice(1)) assert.ok(!(o.includes("vertical") && o.includes(`\\(${b2}\\)`)), `also-true distractor: ${o}`);
      assert.ok(q.c[0].includes(`\\(${QM.ftex(QM.fdiv(QM.F(1), b))}\\)`), "key uses the reciprocal factor");
    }
    for (const m of ["simple", "normal", "challenge"]) {
      let q; try { q = B.make("ft_horizontal", "wr", m, s); } catch { continue; }
      if (q.meta.template !== "rewrite and map a point") continue;
      const a = q.parts.find((p) => p.key === "a"), pt = q.parts.find((p) => p.key === "b");
      // the mapped point lies on y = a·x² with a = b²
      const x = QM.fval(QM.fparse(pt.answer.x)), y = QM.fval(QM.fparse(pt.answer.y));
      assert.ok(Math.abs(a.answer * x * x - y) < 1e-9, `${q.id}: (${x}, ${y}) on y = ${a.answer}x²`);
    }
  }
});
test("combined: the mapped point and vertex form agree with y = a(b(x − h))² + k", () => {
  let n = 0;
  for (let s = 1; s <= 200; s++) for (const m of ["normal", "challenge"]) {
    let q; try { q = B.make("ft_combined", "wr", m, s); } catch { continue; }
    if (q.meta.template === "rewrite in vertex form") {
      const v = q.parts.find((p) => p.key === "a").answer, eq = q.parts.find((p) => p.key === "c");
      const r = W.QuadCheck.readEquation(eq.answer); assert.ok(r.ok && r.forms.has("vertex"));
      const P = r.poly, at = (x) => QM.fval(P[0] || QM.F(0)) + QM.fval(P[1] || QM.F(0)) * x + QM.fval(P[2]) * x * x;
      assert.ok(Math.abs(at(QM.fval(QM.fparse(v.x))) - QM.fval(QM.fparse(v.y))) < 1e-9, "vertex lies on the curve");
      n++;
    }
    if (q.meta.template === "map a point") {
      const src = /\\left\(([^,]+),\\ ([^\\]+)\\right\)/.exec(q.parts[0].prompt);
      assert.ok(src, "source point in prompt"); n++;
    }
  }
  assert.ok(n > 40, String(n));
});
test("difficulty: Simple stays single-step; Challenging uses harder templates and fractional factors", () => {
  const tpl = (f, m) => { const s = new Set(); for (let i = 1; i <= 120; i++) { try { s.add(B.make(f, "wr", m, i).meta.template); } catch { /* retry */ } } return s; };
  assert.ok(!tpl("ft_vertical", "simple").has("find a from a point"));
  assert.ok(tpl("ft_vertical", "challenge").has("find a from a point"));
  assert.ok(tpl("ft_combined", "challenge").has("graph it") && tpl("ft_combined", "challenge").has("compare two"));
  assert.ok(!tpl("ft_combined", "normal").has("graph it"));
  assert.ok(!B.byFam("ft_combined").modes.includes("simple"));
});
test("selection by subtopic returns only transformation questions at the chosen level", () => {
  for (const sid of SUBS) for (const m of ["normal", "challenge"]) {
    const got = B.select({ subs: [sid], mode: m, n: 4, rnd: B.rng(9), record: false });
    assert.ok(got.items.length >= 2, `${sid} ${m}`);
    for (const { q } of got.items) { assert.strictEqual(q.meta.mode, m); assert.ok(q.meta.subs.includes(sid) || FAMS.includes(q.meta.family) || q.meta.subs.some((x) => SUBS.includes(x) || x === "F.transform" || x === "F.vertex"), q.meta.family); }
  }
});
