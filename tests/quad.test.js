// Quadratic functions: engine, checker, every question family in every mode, the Nightmare gauntlet.
// Answer keys are re-derived from the DISPLAYED TeX with tests/texeval.js, which shares no code with the generator.
const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
const { evalTeX } = require("./texeval");
const { QuadMath: M, QuadCheck: QC, QuadBank: B, MathCheck: C, Graph } = W;

const SEEDS = Number(process.env.QD_SEEDS || 25);
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const close = (a, b, tol = 1e-7) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const inline = (s) => [...String(s).matchAll(/\\\(([\s\S]*?)\\\)/g)].map((m) => m[1]);
const strip = (c) => String(c).replace(/^\\\(\\displaystyle\s*|^\\\(|\\\)$/g, "");
// "y = …" / "f(x) = …" → a function of x
const fnOf = (texStr) => { const rhs = texStr.split("=").slice(1).join("="); return (x) => evalTeX(rhs, { x }); };
// fit y = ax² + bx + c through three samples of a function
function fit(fn) { const y0 = fn(0), y1 = fn(1), ym = fn(-1); const a = (y1 + ym) / 2 - y0, b = (y1 - ym) / 2; return { a, b, c: y0, h: -b / (2 * a), k: y0 - (b * b) / (4 * a) }; }
const firstFn = (q) => inline(q).find((t) => /^(y|f\(x\)|g\(x\)|h\(t\))\s*=/.test(t.trim()) && /x|t/.test(t.split("=")[1]));
const pointOf = (tex) => { const m = /\\left\(([\s\S]*?),\\ ([\s\S]*?)\\right\)/.exec(tex); return m ? [evalTeX(m[1]), evalTeX(m[2])] : null; };
function each(fid, kind, lv, n, fn) { const r = seeded(3 + fid.length * 997 + kind.length * 31 + lv.length * 7); for (let i = 0; i < n; i++) fn(B.generate(fid, kind, lv, r), i); }
const famModes = (fid) => B.byFam.get(fid).modes;

// ───────── engine ─────────
test("fractions and conversions are exact (round trip standard ⇄ vertex)", () => {
  const r = seeded(11);
  for (let i = 0; i < 400; i++) {
    const a = M.F(Math.floor(r() * 9) - 4 || 1, 1 + Math.floor(r() * 3)), h = M.F(Math.floor(r() * 19) - 9, 2), k = M.F(Math.floor(r() * 21) - 10, 4);
    const s = M.toStandard({ a, h, k }), v = M.toVertex(s);
    assert.ok(M.feq(v.a, a) && M.feq(v.h, h) && M.feq(v.k, k));
    for (const x of [-2.5, 0, 1.25, 3]) assert.ok(close(M.fval(M.evalStd(s, M.fparse(String(x)))), M.fval(a) * (x - M.fval(h)) ** 2 + M.fval(k)));
  }
  assert.deepStrictEqual(M.fparse("-0.125"), M.F(-1, 8));
  assert.strictEqual(M.fparse("abc"), null);
});

test("exact roots satisfy the equation and are readable by the checker", () => {
  const r = seeded(29);
  for (let i = 0; i < 600; i++) {
    const s = { a: M.F(Math.floor(r() * 11) - 5 || 2), b: M.F(Math.floor(r() * 21) - 10), c: M.F(Math.floor(r() * 21) - 10) };
    const rt = M.roots(s), D = M.fval(M.disc(s));
    assert.strictEqual(rt.count, D > 0 ? 2 : D === 0 ? 1 : 0);
    rt.strs.forEach((str, k) => {
      const v = C.read(str).value;
      assert.ok(close(v, rt.values[k]), str);
      assert.ok(Math.abs(M.fval(s.a) * v * v + M.fval(s.b) * v + M.fval(s.c)) < 1e-8, `${str} is a root of ${JSON.stringify(s)}`);
    });
  }
});

test("equation parser: values, forms and errors", () => {
  const cases = [
    ["y = 2(x-3)^2 + 1", ["vertex"]], ["2(x-3)²+1", ["vertex"]], ["y=1+2(x-3)^2", ["vertex"]], ["y=2x^2-12x+19", ["standard"]],
    ["y=-(x-1)(x+5)", ["factored"]], ["y=(2x-1)(x+3)", ["factored"]], ["y = x^2", ["standard", "vertex", "factored"]], ["y=0.5(x+2)^2-3", ["vertex"]],
    ["f(x) = -x^2 + 4x", ["standard"]], ["y=(x-3)(x-3)+1", []],
  ];
  for (const [s, forms] of cases) { const e = QC.readEquation(s); assert.ok(e.ok, s); for (const fm of forms) assert.ok(e.forms.has(fm), `${s} should count as ${fm}`); }
  for (const bad of ["", "y=", "y = 2(x-3", "y = x^3", "y = 2x/(x+1)", "y = x + y", "y = 3 = x", "y = 2x^-1", "x@2"]) {
    const e = QC.readEquation(bad); assert.ok(!e.ok && e.error, `rejects ${bad}`);
  }
  // malformed input never throws in grading
  for (const bad of ["(((", "v:1,2;p:1,5", "v:x", "()", "(1,2,3)", "∞", "y=+"]) for (const kind of ["point", "equation", "plot"]) {
    const spec = kind === "point" ? { kind, answer: { x: "1", y: "2" } } : kind === "equation" ? { kind, answer: "y=x^2" } : { kind, answer: { a: "1", h: "0", k: "0" } };
    assert.doesNotThrow(() => C.grade(spec, bad));
  }
});

test("checker: points, equations and plots grade like a teacher", () => {
  const g = (spec, r) => C.grade(spec, r);
  const pt = { kind: "point", answer: { x: "3", y: "-2" }, role: "vertex", marks: 1 };
  assert.strictEqual(g(pt, "(3, -2)").verdict, "right");
  assert.strictEqual(g(pt, "(-2, 3)").verdict, "wrong");
  assert.match(g(pt, "(-3,-2)").note, /sign of h/);
  assert.strictEqual(g({ kind: "point", answer: { x: "3/2", y: "-1/4" } }, "(1.5, -0.25)").verdict, "right");
  const eqv = { kind: "equation", answer: "y=2(x-3)^2+1", form: "vertex", marks: 2 };
  assert.strictEqual(g(eqv, "y = 2(x - 3)^2 + 1").verdict, "right");
  assert.strictEqual(g(eqv, "y=2x^2-12x+19").verdict, "partial");
  assert.strictEqual(g(eqv, "y=2(x+3)^2+1").verdict, "wrong");
  assert.strictEqual(g(eqv, "y=(x-3)^2+1").verdict, "partial");
  assert.strictEqual(g({ ...eqv, form: "any" }, "y=2x^2-12x+19").verdict, "right");
  const pl = { kind: "plot", answer: { a: "2", h: "1", k: "-3" }, marks: 2 };
  assert.strictEqual(g(pl, "v:1,-3;p:2,-1").verdict, "right");
  assert.strictEqual(g(pl, "v:1,-3;p:-1,5").verdict, "right");
  assert.strictEqual(g(pl, "v:1,-3;p:2,-2").verdict, "partial");
  assert.strictEqual(g(pl, "v:-1,-3;p:0,-1").verdict, "wrong");
  assert.strictEqual(g(pl, "v:1,-3").verdict, "wrong");
  assert.strictEqual(g(pl, "").verdict, "blank");
});

// ───────── generic properties of every family / kind / mode ─────────
const BAD_TEXT = [/\+\s*-(?!\s*\\infty)/, /-\s*-\s*\d/, /undefined|NaN|\[object/, /\\frac\{-?\d+\}\{1\}/, /(^|[^\d.\w])1x\b/, /\^\{?1\}?(?![\d/])/, /\b0x\b/];
const checkable = (piece) => !/[a-wzA-Z]/.test(piece.replace(/\\(left|right|frac|dfrac|tfrac|sqrt|cdot|times|displaystyle)|[()]/g, "").replace(/x/g, ""));
// identities inside worked solutions and hints must actually hold
function checkEqualities(text, where) {
  for (const m of inline(text)) {
    if (/\\pm|\\approx|\\ne|\\le|\\ge|<|>|\\text|,|\\to/.test(m)) continue;
    const pieces = m.split("=").map((p) => p.trim()).filter(Boolean);
    if (pieces.length < 2) continue;
    const defn = /^(y|f\(x\)|g\(x\)|A\(x\)|R\(x\)|h\(t\))$/.test(pieces[0]);
    const rest = defn ? pieces.slice(1) : pieces;
    for (let i = 0; i + 1 < rest.length; i++) {
      const [p, q] = [rest[i], rest[i + 1]];
      if (!checkable(p) || !checkable(q)) continue;
      const hasX = /x/.test(p + q);
      if (hasX && !defn) continue; // an equation to solve, not an identity
      for (const x of hasX ? [-1.7, 0.3, 2.9] : [0]) {
        let L, Rv;
        try { L = evalTeX(p, { x }); Rv = evalTeX(q, { x }); } catch { L = Rv = NaN; }
        if (!Number.isFinite(L) || !Number.isFinite(Rv)) continue;
        assert.ok(close(L, Rv, 1e-6), `${where}: "${p}" ≠ "${q}" in \\(${m}\\)`);
      }
    }
  }
}
function commonChecks(q, kind) {
  const all = JSON.stringify(q);
  for (const re of BAD_TEXT) assert.ok(!re.test(all.replace(/\\\\/g, "\\")), `${q.id} matches ${re}: …${all.slice(Math.max(0, all.search(re) - 50), all.search(re) + 40)}…`);
  assert.ok(Array.isArray(q.hints), "hints array");
  assert.ok(q.meta && q.meta.family && q.meta.mode && q.meta.complexity >= 1 && q.meta.tags.length, "metadata");
  assert.ok(q.concepts.length && q.topic, "concepts and topic");
  const sol = kind === "wr" ? q.solution.join(" ") : q.e;
  assert.ok(sol && sol.length > 30, "worked solution");
  checkEqualities(sol, q.id + " solution");
  checkEqualities(q.hints.join(" "), q.id + " hints");
  assert.deepStrictEqual(JSON.stringify(B.byId(q.id)), JSON.stringify(q), "byId rebuilds " + q.id);
  if (kind === "mc") {
    assert.strictEqual(q.c.length, 4);
    assert.strictEqual(new Set(q.c).size, 4, "distinct choices");
    assert.ok(q.why.length === 4 && q.why[0] === null && q.why.slice(1).every((w) => typeof w === "string" && w.length > 8), "feedback for each distractor");
  }
  if (kind === "nr") {
    assert.ok(Number.isFinite(q.answer));
    assert.strictEqual(C.grade({ kind: "number", answer: q.answer, marks: 1 }, q.ansText).verdict, "right");
  }
  if (kind === "wr") {
    for (const p of q.parts) {
      const resp = p.kind === "set" ? (p.answer.length ? p.answer.join(", ") : "none") : p.kind === "number" ? String(p.ansText || p.answer) : p.kind === "choice" ? p.answer : QC.handles(p.kind) ? QC.keyResponse(p) : p.answer;
      assert.strictEqual(C.grade(p, resp).verdict, "right", `${q.id}(${p.key}) key graded right`);
      if (p.kind === "choice") assert.ok(p.choices.includes(p.answer));
    }
    assert.ok(q.rubric.length);
  }
}
test("every family × format × mode: keys right, distinct choices, feedback, consistent solutions and hints, exact rebuild", () => {
  let n = 0;
  for (const F of B.FAMILIES) for (const kind of F.kinds) for (const lv of F.modes) each(F.id, kind, lv, F.id.startsWith("nm") ? 6 : SEEDS, (q) => { commonChecks(q, kind); n++; });
  assert.ok(n > 1500, `${n} instances checked`);
});

// ───────── independent checks from what the student sees ─────────
const VFAM = { vform: "v", vstd: "v", features: null };
test("vertex questions: the keyed vertex is the turning point of the displayed function", () => {
  for (const fid of ["vform", "vstd"]) for (const lv of famModes(fid)) each(fid, "mc", lv, SEEDS, (q) => {
    const fn = fnOf(firstFn(q.q)); const p = fit(fn);
    const [x, y] = pointOf(strip(q.c[0]));
    assert.ok(close(x, p.h) && close(y, p.k), `${q.id}: key (${x}, ${y}) vs fitted (${p.h}, ${p.k})`);
    for (const c of q.c.slice(1)) { const d = pointOf(strip(c)); assert.ok(!(close(d[0], p.h) && close(d[1], p.k)), q.id + " distractor is also right"); }
  });
  for (const lv of famModes("vstd")) each("vstd", "wr", lv, SEEDS, (q) => {
    const p = fit(fnOf(firstFn(q.intro)));
    assert.ok(close(C.read(q.parts[0].answer.x).value, p.h) && close(C.read(q.parts[0].answer.y).value, p.k));
  });
});

test("completing the square: the vertex-form key equals the displayed standard form", () => {
  for (const lv of famModes("cts")) {
    each("cts", "wr", lv, SEEDS, (q) => {
      const fn = fnOf(firstFn(q.intro));
      const key = QC.readEquation(q.parts[0].answer);
      for (const x of [-2.3, 0.7, 4.1]) assert.ok(close(M.pval(key.poly, x), fn(x)), q.id);
      assert.ok(key.forms.has("vertex"));
    });
    each("cts", "mc", lv, SEEDS, (q) => {
      const fn = fnOf(firstFn(q.q));
      const ok = q.c.map((c) => [-1.3, 0.4, 2.2].every((x) => close(fnOf(strip(c))(x), fn(x))));
      assert.deepStrictEqual(ok, [true, false, false, false], q.id);
    });
  }
});

test("max/min, y-intercept and axis answers match the displayed function", () => {
  for (const lv of famModes("maxmin")) each("maxmin", "nr", lv, SEEDS, (q) => { const p = fit(fnOf(firstFn(q.q))); assert.ok(close(q.answer, p.k), q.id); assert.ok(q.q.includes(p.a > 0 ? "minimum" : "maximum"), q.id + " max/min word"); });
  for (const lv of famModes("yint")) each("yint", "nr", lv, SEEDS, (q) => { assert.ok(close(q.answer, fnOf(firstFn(q.q))(0)), q.id); });
  for (const lv of famModes("axis")) each("axis", "nr", lv, SEEDS, (q) => {
    const t = firstFn(q.q);
    if (t) { assert.ok(close(q.answer, fit(fnOf(t)).h), q.id); return; }
    const nums = inline(q.q).map((s) => s.match(/-?\d+(?:\/\d+)?/g)).flat().filter(Boolean).map(Number);
    if (/crosses the x-axis/.test(q.q)) assert.ok(close(q.answer, (nums[0] + nums[1]) / 2));
    if (/f\(-?\d+\) = f\(/.test(q.q)) { const m = /f\((-?\d+)\) = f\((-?\d+)\)/.exec(q.q); assert.ok(close(q.answer, (Number(m[1]) + Number(m[2])) / 2), q.id); }
  });
});

test("zeros: every keyed root satisfies the displayed equation, and nothing else is keyed", () => {
  for (const fid of ["solve", "zvertex", "zfactored"]) for (const lv of famModes(fid)) each(fid, "wr", lv, SEEDS, (q) => {
    const fn = fnOf(firstFn(q.intro));
    const rts = q.parts[0].answer.map((s) => C.read(s).value);
    for (const x of rts) assert.ok(Math.abs(fn(x)) < 1e-7 * Math.max(1, Math.abs(fn(x + 1))), `${q.id}: f(${x}) = ${fn(x)}`);
    const p = fit(fn), D = p.b * p.b - 4 * p.a * p.c;
    assert.strictEqual(rts.length, D > 1e-9 ? 2 : Math.abs(D) <= 1e-9 ? 1 : 0, q.id);
  });
  for (const lv of famModes("count")) each("count", "mc", lv, SEEDS, (q) => {
    const p = fit(fnOf(firstFn(q.q))), D = p.b * p.b - 4 * p.a * p.c;
    const n = Math.abs(D) < 1e-9 ? 1 : D > 0 ? 2 : 0;
    assert.strictEqual(q.c[0], n === 0 ? "No x-intercepts" : n === 1 ? "Exactly one x-intercept" : "Two x-intercepts", q.id);
  });
});

test("graph questions: the drawn graph and the key agree", () => {
  for (const lv of famModes("readgraph")) each("readgraph", "wr", lv, SEEDS, (q) => {
    const spec = Graph.specOf(q.intro); const f = Graph.std(spec.fns[0]); const kp = Graph.keyPoints(f);
    const [a, b, c, d] = q.parts;
    assert.ok(close(C.read(a.answer.x).value, kp.h) && close(C.read(a.answer.y).value, kp.k));
    assert.ok(close(b.answer, kp.h));
    assert.deepStrictEqual(c.answer.map(Number).sort((x, y) => x - y), kp.xs.map((x) => Math.round(x * 1e9) / 1e9));
    assert.ok(close(d.answer, kp.yint));
    // every feature lies on the visible grid at whole numbers
    for (const v of [kp.h, kp.k, ...kp.xs, kp.yint]) assert.ok(Number.isInteger(Math.round(v * 1e9) / 1e9), q.id + " feature off the grid");
    for (const v of [kp.h, ...kp.xs]) assert.ok(v >= spec.window.x0 && v <= spec.window.x1);
    for (const v of [kp.k, kp.yint]) assert.ok(v >= spec.window.y0 && v <= spec.window.y1);
  });
  for (const lv of famModes("matchgraph")) each("matchgraph", "mc", lv, SEEDS, (q) => {
    const target = fit(fnOf(firstFn(q.q)));
    const fits = q.c.map((c) => Graph.std(Graph.specOf(c).fns[0]));
    const same = fits.map((g) => close(g.a, target.a) && close(g.b, target.b) && close(g.c, target.c));
    assert.deepStrictEqual(same, [true, false, false, false], q.id);
  });
  for (const lv of famModes("graphtoeq")) each("graphtoeq", "mc", lv, SEEDS, (q) => {
    const g = Graph.std(Graph.specOf(q.q).fns[0]);
    const same = q.c.map((c) => { const p = fit(fnOf(strip(c))); return close(p.a, g.a) && close(p.b, g.b) && close(p.c, g.c); });
    assert.deepStrictEqual(same, [true, false, false, false], q.id);
    const pt = Graph.specOf(q.q).points[0];
    assert.ok(close(g.a * Number(pt.x) ** 2 + g.b * Number(pt.x) + g.c, eval(pt.y)), "labelled point is on the curve");
  });
  for (const lv of famModes("eqfromgraph")) each("eqfromgraph", "wr", lv, SEEDS, (q) => {
    const spec = Graph.specOf(q.intro), g = Graph.std(spec.fns[0]);
    const key = QC.readEquation(q.parts[0].answer);
    for (const x of [-2, 0.5, 3]) assert.ok(close(M.pval(key.poly, x), g.a * x * x + g.b * x + g.c));
  });
  for (const lv of famModes("sketch")) each("sketch", "wr", lv, SEEDS, (q) => {
    const p = fit(fnOf(firstFn(q.intro))), ans = q.parts[0].answer;
    assert.ok(close(Number(eval(ans.a)), p.a) && close(Number(ans.h), p.h) && close(Number(ans.k), p.k), q.id);
    const w = q.parts[0].window; const kr = QC.keyResponse(q.parts[0]).match(/-?[\d.]+/g).map(Number);
    assert.ok(kr[0] >= w.x0 && kr[0] <= w.x1 && kr[2] >= w.x0 && kr[2] <= w.x1 && kr[1] >= w.y0 && kr[1] <= w.y1 && kr[3] >= w.y0 && kr[3] <= w.y1, "the key points fit on the plotting grid");
  });
});

test("applied problems: answers re-derived from the stated model", () => {
  for (const lv of famModes("projectile")) each("projectile", "wr", lv, SEEDS, (q) => {
    const m = /h\(t\) = -5t\^2 \+ (\d+)t \+ (\d+)/.exec(q.intro); const v = +m[1], h0 = +m[2];
    const [a, b, c, d] = q.parts;
    assert.strictEqual(a.answer, h0); assert.ok(close(b.answer, v / 10)); assert.ok(close(c.answer, h0 + (v * v) / 20));
    const land = (v + Math.sqrt(v * v + 20 * h0)) / 10; assert.ok(close(d.answer, Math.round(land * 100) / 100));
    assert.strictEqual(C.grade(d, String(Math.round(land * 10) / 10)).verdict !== "right" || Math.round(land * 10) / 10 === d.answer, true, "rounding is enforced");
  });
  for (const lv of famModes("optimize")) each("optimize", "wr", lv, SEEDS, (q) => {
    if (/fencing/.test(q.intro)) {
      const L = +/has (\d+) m/.exec(q.intro)[1]; let best = -1, bx = 0;
      for (let x = 0; x <= L / 2; x += 0.5) { const A = x * (L - 2 * x); if (A > best) { best = A; bx = x; } }
      assert.ok(close(q.parts[1].answer, bx) && close(q.parts[3].answer, best), q.id);
    } else {
      const m = /sells (\d+) tickets at \$(\d+) each\. For every \$1 increase in price, (\d+) fewer/.exec(q.intro); const [n0, p, d] = [+m[1], +m[2], +m[3]];
      let best = -1, bx = 0; for (let x = 0; x < 200; x++) { const R = (p + x) * (n0 - d * x); if (R > best) { best = R; bx = x; } }
      assert.ok(close(q.parts[0].answer, bx) && close(q.parts[3].answer, best), q.id);
    }
  });
  for (const lv of famModes("fromroots")) each("fromroots", "wr", lv, SEEDS, (q) => {
    const m = /x-intercepts \\\((-?\d+)\\\) and \\\((-?\d+)\\\) and passes through \\\(\\left\((-?\d+), ([^\\]+)\\right\)/.exec(q.intro);
    const key = QC.readEquation(q.parts[0].answer);
    assert.ok(Math.abs(M.pval(key.poly, +m[1])) < 1e-9 && Math.abs(M.pval(key.poly, +m[2])) < 1e-9, "zeros");
    assert.ok(close(M.pval(key.poly, +m[3]), evalTeX(m[4])), "through the point");
  });
});

test("find-the-error: the keyed line is the first line that isn't equal to the start", () => {
  for (const lv of famModes("fixerror")) each("fixerror", "mc", lv, SEEDS, (q) => {
    const [start, ...lines] = q._lines;
    const f0 = fnOf(start);
    const truth = lines.map((l) => [-1.1, 0.6, 2.3].every((x) => close(fnOf(l)(x), f0(x))));
    const first = truth.indexOf(false) + 1;
    assert.ok(first > 0, q.id + " has an error");
    assert.strictEqual(q.c[0], `Line ${first}`, q.id);
    assert.deepStrictEqual(q.order.map((i) => q.c[i]), ["Line 1", "Line 2", "Line 3", "Line 4"]);
  });
});

test("identify / direction / width: decided from the displayed expressions", () => {
  for (const lv of famModes("identify")) each("identify", "mc", lv, SEEDS, (q) => {
    const quad = q.c.map((c) => { const fn = fnOf(strip(c)); const p = fit(fn); const cubicCheck = fn(3) - (p.a * 9 + p.b * 3 + p.c); return Math.abs(p.a) > 1e-9 && Math.abs(cubicCheck) < 1e-7; });
    assert.deepStrictEqual(quad, [true, false, false, false], q.id);
  });
  for (const lv of famModes("direction")) each("direction", "mc", lv, SEEDS, (q) => { const p = fit(fnOf(firstFn(q.q))); assert.strictEqual(q.c[0], p.a > 0 ? "Opens up; it has a minimum" : "Opens down; it has a maximum", q.id); });
  for (const lv of famModes("width")) each("width", "mc", lv, SEEDS, (q) => {
    const as = q.c.map((c) => Math.abs(fit(fnOf(strip(c))).a));
    const want = /narrowest/.test(q.q) ? Math.max(...as) : Math.min(...as);
    assert.ok(close(as[0], want) && as.filter((x) => close(x, want)).length === 1, q.id);
  });
});

// ───────── tests, modes and the Nightmare gauntlet ─────────
test("normal and challenging tests: 5 WR (4/5/2/3/5), 5 NR, 10 MC; ids distinct; harder material in Challenging", () => {
  let fracN = 0, fracC = 0;
  for (const lv of ["normal", "challenge"]) for (let s = 1; s <= 12; s++) {
    const t = B.buildTest(lv, seeded(s * 7 + (lv === "challenge" ? 1 : 0)));
    assert.deepStrictEqual(t.wr.map((q) => q.parts.reduce((a, p) => a + p.marks, 0)), [4, 5, 2, 3, 5]);
    assert.strictEqual(t.nr.length, 5); assert.strictEqual(t.mc.length, 10);
    const ids = [...t.wr, ...t.nr, ...t.mc].map((q) => q.id);
    assert.strictEqual(new Set(ids).size, 20);
    assert.ok(ids.every((id) => new RegExp(`-${lv === "challenge" ? "c" : "n"}-`).test(id)), "every question is at the chosen level");
    const fr = JSON.stringify(t).match(/\\\\frac/g) || [];
    if (lv === "normal") fracN += fr.length; else fracC += fr.length;
  }
  assert.ok(fracC > fracN, `challenging uses more fractions (${fracC} vs ${fracN})`);
});

test("mode metadata: complexity never drops as the mode gets harder, and simple mode has guided hints", () => {
  for (const F of B.FAMILIES) {
    const order = ["simple", "normal", "challenge", "nightmare"].filter((m) => F.modes.includes(m)).map((m) => F.complexity[m]);
    for (let i = 1; i < order.length; i++) assert.ok(order[i] >= order[i - 1], F.id);
    if (F.modes.includes("simple")) for (const kind of F.kinds) each(F.id, kind, "simple", 4, (q) => assert.ok(q.hints.length >= 2, `${q.id} has step hints`));
  }
});

test("Nightmare: one connected 5-stage gauntlet about the same f; every stage verified", () => {
  for (let s = 1; s <= 25; s++) {
    const st = B.buildNightmare(seeded(s * 31));
    assert.strictEqual(st.length, 5);
    const f0 = firstFn(st[0].intro);
    for (const q of st) { assert.strictEqual(firstFn(q.intro), f0, "every stage is about the same f"); assert.ok(/-x-/.test(q.id)); }
    const fn = fnOf(f0), p = fit(fn);
    // stage 1: vertex form equals f
    const vf = QC.readEquation(st[0].parts[0].answer); for (const x of [-1, 2.5]) assert.ok(close(M.pval(vf.poly, x), fn(x)));
    // stage 2: zeros of f, distance between them
    const z = st[1].parts[1].answer.map((x) => C.read(x).value); for (const x of z) assert.ok(Math.abs(fn(x)) < 1e-8);
    assert.ok(close(C.read(st[1].parts[2].answer).value, Math.abs(z[1] - z[0])));
    // stage 3: g(x) = −f(x − ½) + e
    const e = evalTeX(/\\right\) ([+-] .+?)\\\)\.?$/.exec(st[2].intro)[1].replace(/\s/g, ""));
    const g = (x) => -fn(x - 0.5) + e;
    const gk = QC.readEquation(st[2].parts[0].answer); for (const x of [-1, 0.25, 3]) assert.ok(close(M.pval(gk.poly, x), g(x)));
    // stage 4: f(x) = g(x)
    for (const x of st[3].parts[0].answer.map((v) => C.read(v).value)) assert.ok(close(fn(x), g(x)), "f = g there");
    assert.ok(close(st[3].parts[1].answer, p.k));
    // stage 5: mirror point and through-the-origin parabola
    const o = QC.readEquation(st[4].parts[2].answer); assert.ok(Math.abs(M.pval(o.poly, 0)) < 1e-9); const op = fit((x) => M.pval(o.poly, x)); assert.ok(close(op.h, p.h) && close(op.k, p.k));
    assert.ok(st.reduce((a, q) => a + q.parts.reduce((b, x) => b + x.marks, 0), 0) >= 20);
  }
});

test("counting: families (authored templates) are reported separately from runtime variations", () => {
  const fams = B.FAMILIES.length;
  const formats = B.FAMILIES.reduce((a, F) => a + F.kinds.length, 0);
  const combos = B.FAMILIES.reduce((a, F) => a + F.kinds.length * F.modes.length, 0);
  assert.ok(fams >= 30 && formats >= 45 && combos >= 120, `${fams} families, ${formats} family×format, ${combos} family×format×mode`);
});

// ───────── concept library and formula reference ─────────
const CON = W.Concepts, QCont = W.QuadContent;
let katex = null; try { katex = require("../vendor/katex/katex.min.js"); } catch { /* optional */ }
const renders = (t) => { if (!katex) return true; katex.renderToString(t, { throwOnError: true }); return true; };
test("quadratics concepts: complete lessons, real links, translated titles, practice behind each one", () => {
  const ids = new Set(CON.CONCEPTS.map((c) => c.id));
  const quad = CON.CONCEPTS.filter((c) => c.unit === "quadratics");
  assert.strictEqual(quad.length, QCont.CONCEPTS.length);
  assert.ok(quad.length >= 15);
  assert.strictEqual(CON.UNITS[0].id, "quadratics", "quadratics comes first in the library");
  assert.ok(CON.UNITS.some((u) => u.id === "radicals"), "radicals stay in the library");
  for (const c of quad) {
    for (const k of ["title", "summary", "intuition"]) assert.ok(c[k] && c[k].length > 10, `${c.id}.${k}`);
    assert.ok(c.explanation.length >= 2 && c.rules.length >= 1 && c.examples.length >= 1 && c.mistakes.length >= 1 && c.keywords.length >= 4, c.id);
    for (const id of [...c.prereqs, ...c.related]) assert.ok(ids.has(id), `${c.id} links to ${id}`);
    for (const lang of ["fr", "es", "de", "zh"]) assert.ok(c.tr[lang] && c.tr[lang].title && c.tr[lang].summary, `${c.id} ${lang}`);
    for (const r of c.rules) assert.ok(renders(r.tex), r.tex);
    for (const t of [c.summary, ...c.explanation, ...c.examples.flatMap((e) => [e.title, ...e.steps, e.answer])]) for (const m of inline(t)) assert.ok(renders(m), m);
    // worked examples must be arithmetically consistent
    for (const e of c.examples) checkEqualities(e.steps.join(" "), c.id + " example");
    if (c.graph) assert.ok(/<svg/.test(Graph.svg(c.graph)), c.id + " graph renders");
    const linked = [...B.FAMILIES, ...W.Bank.FAMILIES].filter((F) => F.concepts.includes(c.id)); // quadratics bank or the shared registry
    assert.ok(linked.length >= 1, `${c.id} has practice questions`);
  }
  // prerequisite graph has no cycles
  const visit = (id, path = []) => { assert.ok(!path.includes(id), "cycle: " + [...path, id].join(" → ")); for (const p of CON.get(id).prereqs) visit(p, [...path, id]); };
  for (const c of quad) visit(c.id);
  // every family tag points at a real concept
  for (const F of B.FAMILIES) for (const id of [...F.concepts, ...F.prereqs]) assert.ok(ids.has(id), `${F.id} → ${id}`);
  // generated questions are tagged through conceptsFor
  const q = B.generate("vform", "mc", "normal", seeded(5));
  assert.deepStrictEqual(CON.conceptsFor(q), ["quad.vertex_form"]);
});

test("formula reference: complete entries that render, with examples that check out", () => {
  const ids = new Set(CON.CONCEPTS.map((c) => c.id));
  assert.ok(CON.FORMULAS.length >= 14);
  assert.strictEqual(new Set(CON.FORMULAS.map((f) => f.id)).size, CON.FORMULAS.length);
  for (const f of CON.FORMULAS) {
    assert.ok(f.name && f.tex && f.when && f.conditions && f.example && f.symbols.length, f.id);
    assert.ok(renders(f.tex), f.tex);
    for (const m of inline(f.example)) assert.ok(renders(m), m);
    checkEqualities(f.example, f.id);
    for (const r of f.related) assert.ok(ids.has(r), `${f.id} → ${r}`);
  }
});

// Simple is an easier ASSESSMENT (not a tutorial): 24 marks, every question generated at Simple, keys verified
test("Simple test: 24 marks of Simple-level questions in the unit-test layout", () => {
  const r = seeded(424242);
  for (let i = 0; i < 40; i++) {
    const t = B.buildTest("simple", r);
    const marks = t.wr.reduce((a, q) => a + q.parts.reduce((x, p) => x + p.marks, 0), 0) + t.nr.length + t.mc.length;
    assert.strictEqual(marks, 24);
    assert.deepStrictEqual([t.wr.length, t.nr.length, t.mc.length], [4, 5, 10]);
    for (const q of [...t.wr, ...t.nr, ...t.mc]) {
      assert.strictEqual(q.meta.mode, "simple", q.id);
      assert.ok(/-s-/.test(q.id), q.id);
      if (q.c) assert.strictEqual(new Set(q.c).size, q.c.length, "distinct options " + q.id);
    }
    // Simple never borrows the Normal/Challenging-only families (completing the square, projectiles, optimisation)
    for (const q of t.wr) assert.ok(!["cts", "projectile", "optimize", "solve", "zvertex"].includes(q.meta.family), q.meta.family);
  }
});
