/*
 * ANSWERCHECK — answer kinds for the curriculum-wide question engine (alongside MathCheck and QuadCheck).
 *
 *   poly     an expression in x, compared EXACTLY as a rational function (polynomials and rational expressions).
 *            spec.form: "any" | "factored" (fully factored over the integers) | "expanded" | "simplified" (one reduced fraction)
 *   mono     an expression in several letters (exponent laws): compared by evaluating at random positive values.
 *            spec.form: "any" | "positive" (no negative exponents) | "radical" (no fractional exponents) | "power" (no radicals)
 *   interval a solution set written in interval notation or as inequalities, compared exactly as a union of intervals
 *   approx   a decimal answer rounded to spec.dp places (trigonometry, finance); spec.answer is the exact value
 *   graph    a parabola built on an empty grid: vertex + points (response "v:h,k;p:x,y|x,y|…"), graded on vertex,
 *            points on the curve and shape — any order of placing them
 *
 * Every grader returns { earned, max, verdict: "right"|"partial"|"wrong"|"blank", note } like MathCheck.
 * Text equality is never used to mark algebra: forms are checked structurally, values exactly or numerically.
 */
(function (root) {
  "use strict";
  const QM = () => root.QuadMath;

  // ───────── tokenizer / parser (letters are variables; sqrt, √, ∛, root) ─────────
  function tokenize(src) {
    const s = String(src)
      .replace(/[−–—]/g, "-").replace(/[×·∙⋅]/g, "*").replace(/÷/g, "/").replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/\*\*/g, "^").replace(/\s+/g, "");
    const out = [];
    let i = 0;
    while (i < s.length) {
      const rest = s.slice(i);
      let m;
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(rest))) { out.push({ k: "num", v: m[1] }); i += m[1].length; continue; }
      if ((m = /^(sqrt|cbrt|root)/i.exec(rest))) { out.push({ k: "fn", v: m[1].toLowerCase() }); i += m[1].length; continue; }
      const ch = s[i];
      if (ch === "√") { out.push({ k: "fn", v: "sqrt" }); i++; continue; }
      if (ch === "∛") { out.push({ k: "fn", v: "cbrt" }); i++; continue; }
      if (/[a-zA-Z]/.test(ch)) { out.push({ k: "var", v: ch }); i++; continue; }
      if ("+-*/^(),".includes(ch)) { out.push({ k: ch }); i++; continue; }
      if (ch === "[" || ch === "{") { out.push({ k: "(" }); i++; continue; }
      if (ch === "]" || ch === "}") { out.push({ k: ")" }); i++; continue; }
      throw new Error(`I can't read "${ch}" here.`);
    }
    return out;
  }
  function parse(src) {
    const toks = tokenize(src);
    if (!toks.length) throw new Error("Empty answer.");
    let i = 0;
    const peek = () => toks[i], eat = (k) => (toks[i] && toks[i].k === k ? toks[i++] : null);
    const startsAtom = (t) => t && (t.k === "num" || t.k === "var" || t.k === "(" || t.k === "fn");
    function expr() { let n = term(); for (;;) { const t = eat("+") || eat("-"); if (!t) return n; n = { t: t.k === "+" ? "add" : "sub", a: n, b: term() }; } }
    function term() {
      let n = unary();
      for (;;) {
        if (eat("*")) { n = { t: "mul", a: n, b: unary() }; continue; }
        if (eat("/")) { n = { t: "div", a: n, b: unary() }; continue; }
        if (startsAtom(peek())) { n = { t: "mul", a: n, b: power(), implicit: true }; continue; }
        return n;
      }
    }
    function unary() { if (eat("-")) return { t: "neg", a: unary() }; if (eat("+")) return unary(); return power(); }
    function power() {
      const b = atom();
      if (eat("^")) { const neg = !!eat("-"); const e = atom(); return { t: "pow", a: b, e: neg ? { t: "neg", a: e } : e }; }
      return b;
    }
    function atom() {
      const t = toks[i++];
      if (!t) throw new Error("The answer ends too early.");
      if (t.k === "num") return { t: "num", v: t.v };
      if (t.k === "var") return { t: "var", v: t.v };
      if (t.k === "fn") {
        if (t.v === "root") { if (!eat("(")) throw new Error("Write root(x, n)."); const a = expr(); if (!eat(",")) throw new Error("Write root(x, n)."); const n = expr(); if (!eat(")")) throw new Error("A bracket isn't closed."); return { t: "root", a, n }; }
        const a = power();
        return { t: "root", a, n: { t: "num", v: t.v === "cbrt" ? "3" : "2" } };
      }
      if (t.k === "(") { const n = expr(); if (!eat(")")) throw new Error("A bracket isn't closed."); return { t: "par", a: n }; }
      throw new Error(t.k === ")" ? "There's an extra closing bracket." : `"${t.k}" is in an odd place.`);
    }
    const n = expr();
    if (i < toks.length) throw new Error(toks[i].k === ")" ? "There's an extra closing bracket." : "Something extra is at the end.");
    return n;
  }
  const vars = (n, out = new Set()) => { if (!n) return out; if (n.t === "var") out.add(n.v); for (const k of ["a", "b", "e", "n"]) if (n[k] && typeof n[k] === "object") vars(n[k], out); return out; };
  const hasVar = (n) => vars(n).size > 0;
  const unpar = (n) => (n.t === "par" ? unpar(n.a) : n);

  function evalAt(n, env) {
    switch (n.t) {
      case "num": return Number(n.v);
      case "var": if (!(n.v in env)) throw new Error("var"); return env[n.v];
      case "par": return evalAt(n.a, env);
      case "neg": return -evalAt(n.a, env);
      case "add": return evalAt(n.a, env) + evalAt(n.b, env);
      case "sub": return evalAt(n.a, env) - evalAt(n.b, env);
      case "mul": return evalAt(n.a, env) * evalAt(n.b, env);
      case "div": return evalAt(n.a, env) / evalAt(n.b, env);
      case "pow": return Math.pow(evalAt(n.a, env), evalAt(n.e, env));
      case "root": { const a = evalAt(n.a, env), k = evalAt(n.n, env); return a < 0 && k % 2 === 1 ? -Math.pow(-a, 1 / k) : Math.pow(a, 1 / k); }
    }
    throw new Error("?");
  }

  // ───────── exact rational functions in x (numerator/denominator polynomials with fraction coefficients) ─────────
  const F = (n, d) => QM().F(n, d);
  const fparse = (s) => QM().fparse(String(s));
  function ptrim(p) { const q = p.slice(); while (q.length > 1 && QM().fr(q[q.length - 1]).n === 0) q.pop(); return q; }
  const pdeg = (p) => { p = ptrim(p); return p.length === 1 && QM().fr(p[0]).n === 0 ? -Infinity : p.length - 1; };
  const padd = (a, b) => QM().padd(a, b), pmul = (a, b) => QM().pmul(a, b);
  const pneg = (a) => a.map((c) => QM().fneg(c));
  const pzero = (p) => pdeg(p) === -Infinity;
  const pconst = (c) => [QM().fr(c)];
  function pdivmod(a, b) {
    const M = QM();
    a = ptrim(a); b = ptrim(b);
    if (pzero(b)) throw new Error("div0");
    let r = a.slice(); const q = new Array(Math.max(1, a.length - b.length + 1)).fill(F(0));
    const db = pdeg(b), lb = b[db];
    while (!pzero(r) && pdeg(r) >= db) {
      const dr = pdeg(r), c = M.fdiv(r[dr], lb), sh = dr - db;
      q[sh] = M.fadd(q[sh], c);
      for (let k = 0; k <= db; k++) r[k + sh] = M.fsub(r[k + sh], M.fmul(c, b[k]));
      r = ptrim(r);
    }
    return { q: ptrim(q), r: ptrim(r) };
  }
  function pgcd(a, b) { a = ptrim(a); b = ptrim(b); while (!pzero(b)) { const { r } = pdivmod(a, b); a = b; b = r; } return a; }
  // AST → { n, d } (exact). Only the variable x; integer powers −6…6.
  function toRF(node, v = "x") {
    const M = QM();
    const rf = (n, d = [F(1)]) => ({ n: ptrim(n), d: ptrim(d) });
    function go(x) {
      switch (x.t) {
        case "num": { const f = fparse(x.v); if (!f) throw new Error("bad number"); return rf([f]); }
        case "var": if (x.v !== v) throw new Error(`Use only the variable ${v}.`); return rf([F(0), F(1)]);
        case "par": return go(x.a);
        case "neg": { const a = go(x.a); return rf(pneg(a.n), a.d); }
        case "add": { const a = go(x.a), b = go(x.b); return rf(padd(pmul(a.n, b.d), pmul(b.n, a.d)), pmul(a.d, b.d)); }
        case "sub": { const a = go(x.a), b = go(x.b); return rf(padd(pmul(a.n, b.d), pneg(pmul(b.n, a.d))), pmul(a.d, b.d)); }
        case "mul": { const a = go(x.a), b = go(x.b); return rf(pmul(a.n, b.n), pmul(a.d, b.d)); }
        case "div": { const a = go(x.a), b = go(x.b); if (pzero(b.n)) throw new Error("That divides by zero."); return rf(pmul(a.n, b.d), pmul(a.d, b.n)); }
        case "pow": {
          const e = go(x.e);
          if (pdeg(e.n) > 0 || pdeg(e.d) > 0) throw new Error("Exponents must be numbers.");
          const ev = M.fdiv(e.n[0], e.d[0]);
          if (!M.fint(ev) || Math.abs(ev.n) > 6) throw new Error("Use whole-number powers.");
          const b = go(x.a);
          let n = [F(1)], d = [F(1)];
          for (let k = 0; k < Math.abs(ev.n); k++) { n = pmul(n, b.n); d = pmul(d, b.d); }
          return ev.n >= 0 ? rf(n, d) : rf(d, n);
        }
        case "root": throw new Error("No roots in this answer.");
      }
      throw new Error("Unreadable.");
    }
    return go(node);
  }
  const rfEqual = (a, b) => pzero(padd(pmul(a.n, b.d), pneg(pmul(b.n, a.d))));
  const intCoeffs = (p) => p.every((c) => QM().fr(c).d === 1);
  const content = (p) => p.reduce((g, c) => QM().gcd(g, Math.abs(QM().fr(c).n)), 0);
  function factorsOf(n, out = []) {
    n = unpar(n);
    if (n.t === "mul") { factorsOf(n.a, out); factorsOf(n.b, out); }
    else if (n.t === "neg") { out.push({ t: "num", v: "-1" }); factorsOf(n.a, out); }
    else out.push(n);
    return out;
  }
  // is this polynomial factor irreducible over the integers (for the degrees we generate)?
  function irreducible(p) {
    const d = pdeg(p);
    if (d <= 1) return true;
    if (d === 2) { const [c, b, a] = p.map((x) => QM().fval(x)); const D = b * b - 4 * a * c; if (D < 0) return true; const r = Math.round(Math.sqrt(D)); return r * r !== D; }
    // degree 3–4: no rational root and (for 4) not a product of two integer quadratics we'd expect students to find
    const lead = Math.abs(QM().fval(p[d])), c0 = Math.abs(QM().fval(p[0]));
    const divs = (n) => { const out = []; for (let k = 1; k <= Math.max(1, n); k++) if (n % k === 0) out.push(k); return out; };
    for (const q of divs(c0 || 1)) for (const s of divs(lead)) for (const sg of [1, -1]) { const x = (sg * q) / s; if (Math.abs(p.reduce((acc, c, k) => acc + QM().fval(c) * Math.pow(x, k), 0)) < 1e-9) return false; }
    if (c0 === 0) return false;
    if (d === 4) { const ev = p.every((c, k) => k % 2 === 0 || QM().fr(c).n === 0); if (ev) return irreducible([p[0], p[2], p[4]]); }
    return true;
  }
  function factorIssues(ast) {
    const fs = factorsOf(ast);
    const xf = fs.filter(hasVar);
    if (!xf.length) return ["That's a number, not a factored expression."];
    const issues = [];
    if (xf.length === 1 && unpar(xf[0]).t !== "pow") {
      const p = toRF(xf[0]); if (pdeg(p.d) > 0) return ["Factor it as a product, without fractions."];
      if (!irreducible(p.n) || content(p.n) > 1) return ["It isn't factored yet: write it as a product of factors."];
    }
    for (const f of xf) {
      const base = unpar(f).t === "pow" ? unpar(f).a : f;
      let p; try { p = toRF(base); } catch (e) { return [e.message]; }
      if (pdeg(p.d) > 0) return ["Factor it as a product, without fractions."];
      if (!intCoeffs(p.n)) { issues.push("Use integer coefficients inside each factor."); continue; }
      if (content(p.n) > 1) issues.push("A common factor is still inside a bracket — take it out.");
      else if (!irreducible(p.n)) issues.push("One of the factors can still be factored.");
    }
    return [...new Set(issues)];
  }
  function isExpanded(ast) {
    let ok = true;
    (function walk(n) {
      if (!n || typeof n !== "object") return;
      if ((n.t === "mul" || n.t === "pow" || n.t === "div") && [n.a, n.b].some((c) => c && (unpar(c).t === "add" || unpar(c).t === "sub") && hasVar(c))) ok = false;
      for (const k of ["a", "b", "e"]) if (n[k]) walk(n[k]);
    })(ast);
    return ok;
  }
  // a single reduced fraction (or a polynomial): no sum of separate fractions, no common factor left
  function simplifiedIssues(ast, r) {
    const top = unpar(ast);
    const hasDivX = (n) => { if (!n || typeof n !== "object") return false; if (n.t === "div" && hasVar(n.b)) return true; return ["a", "b", "e"].some((k) => n[k] && hasDivX(n[k])); };
    if ((top.t === "add" || top.t === "sub") && hasDivX(top)) return ["Combine it into a single fraction."];
    const g = pgcd(r.n, r.d);
    if (pdeg(g) > 0) return ["The numerator and denominator still share a factor — cancel it."];
    return [];
  }

  // ───────── interval sets ─────────
  // value: [{ lo, hi, loC, hiC }] with ±Infinity, merged and sorted
  function normSet(list) {
    const s = list.filter((I) => I.lo < I.hi || (I.lo === I.hi && I.loC && I.hiC)).sort((a, b) => a.lo - b.lo || (b.loC - a.loC));
    const out = [];
    for (const I of s) {
      const last = out[out.length - 1];
      if (last && (I.lo < last.hi || (I.lo === last.hi && (last.hiC || I.loC)))) {
        if (I.hi > last.hi || (I.hi === last.hi && I.hiC)) { last.hi = I.hi; last.hiC = I.hiC || (I.hi === last.hi && last.hiC); }
      } else out.push({ ...I });
    }
    return out;
  }
  const num = (s) => {
    s = String(s).trim().replace(/[−–]/g, "-");
    if (/^[+-]?(inf|infinity|∞|oo)$/i.test(s)) return /^-/.test(s) ? -Infinity : Infinity;
    const f = fparse(s); if (f) return QM().fval(f);
    if (root.MathCheck) { const r = root.MathCheck.read(s); if (r.ok) return r.value; }
    throw new Error(`I can't read the number "${s}".`);
  };
  function readInterval(src) {
    let s = String(src || "").trim().replace(/[−–—]/g, "-").replace(/≤|=</g, "<=").replace(/≥|=>/g, ">=").replace(/∪/g, "U").replace(/\s+/g, " ");
    if (!s) return { ok: false, error: "Empty answer." };
    if (/^(no solution|none|∅|\{\s*\}|empty)$/i.test(s)) return { ok: true, set: [] };
    if (/^(all real numbers|all reals|r|ℝ|x\s*∈\s*r|\(-?(inf|∞|infinity),\s*\+?(inf|∞|infinity)\))$/i.test(s)) return { ok: true, set: [{ lo: -Infinity, hi: Infinity, loC: false, hiC: false }] };
    try {
      if (/[<>]/.test(s) || /≠|!=/.test(s)) {
        // inequalities: "x < 3", "x <= -2 or x >= 5", "-2 < x <= 5", "x ≠ 3"
        const parts = s.split(/\bor\b|\bU\b|,(?![^()[\]]*[)\]])/i).map((x) => x.trim()).filter(Boolean);
        const out = [];
        for (const p of parts) {
          let m;
          if ((m = /^x\s*(≠|!=)\s*(.+)$/i.exec(p))) { const v = num(m[2]); out.push({ lo: -Infinity, hi: v, loC: false, hiC: false }, { lo: v, hi: Infinity, loC: false, hiC: false }); continue; }
          if ((m = /^(.+?)\s*(<=|<)\s*x\s*(<=|<)\s*(.+)$/i.exec(p))) { out.push({ lo: num(m[1]), hi: num(m[4]), loC: m[2] === "<=", hiC: m[3] === "<=" }); continue; }
          if ((m = /^(.+?)\s*(>=|>)\s*x\s*(>=|>)\s*(.+)$/i.exec(p))) { out.push({ lo: num(m[4]), hi: num(m[1]), loC: m[3] === ">=", hiC: m[2] === ">=" }); continue; }
          if ((m = /^x\s*(<=|<|>=|>)\s*(.+)$/i.exec(p))) { const v = num(m[2]); out.push(m[1][0] === "<" ? { lo: -Infinity, hi: v, loC: false, hiC: m[1] === "<=" } : { lo: v, hi: Infinity, loC: m[1] === ">=", hiC: false }); continue; }
          if ((m = /^(.+?)\s*(<=|<|>=|>)\s*x$/i.exec(p))) { const v = num(m[1]); out.push(m[2][0] === ">" ? { lo: -Infinity, hi: v, loC: false, hiC: m[2] === ">=" } : { lo: v, hi: Infinity, loC: m[2] === "<=", hiC: false }); continue; }
          throw new Error("Write it like x < 3, −2 ≤ x < 5, or in interval notation like (−∞, 3].");
        }
        return { ok: true, set: normSet(out) };
      }
      const pieces = s.split(/\s*U\s*/i);
      const out = [];
      for (const p of pieces) {
        let m;
        if ((m = /^\{\s*(.+)\s*\}$/.exec(p))) { for (const v of m[1].split(",")) { const x = num(v); out.push({ lo: x, hi: x, loC: true, hiC: true }); } continue; }
        m = /^([[(])\s*([^,]+?)\s*,\s*([^,]+?)\s*([\])])$/.exec(p);
        if (!m) throw new Error("Write intervals like (−∞, 3] ∪ [5, ∞), or inequalities like x ≤ 3 or x ≥ 5.");
        const lo = num(m[2]), hi = num(m[3]);
        if (lo > hi) throw new Error("The smaller number goes first in an interval.");
        if ((m[1] === "[" && lo === -Infinity) || (m[4] === "]" && hi === Infinity)) throw new Error("Infinity always gets a round bracket.");
        out.push({ lo, hi, loC: m[1] === "[", hiC: m[4] === "]" });
      }
      return { ok: true, set: normSet(out) };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  const sameSet = (A, B) => A.length === B.length && A.every((I, k) => Math.abs(I.lo - B[k].lo) < 1e-9 * Math.max(1, Math.abs(I.lo)) || I.lo === B[k].lo) && A.every((I, k) => (I.hi === B[k].hi || Math.abs(I.hi - B[k].hi) < 1e-9 * Math.max(1, Math.abs(I.hi))) && I.loC === B[k].loC && I.hiC === B[k].hiC);
  const sameEndpoints = (A, B) => A.length === B.length && A.every((I, k) => (I.lo === B[k].lo || Math.abs(I.lo - B[k].lo) < 1e-9) && (I.hi === B[k].hi || Math.abs(I.hi - B[k].hi) < 1e-9));
  const fmtN = (v) => (v === Infinity ? "\\infty" : v === -Infinity ? "-\\infty" : root.QuadMath ? (() => { for (let d = 1; d <= 60; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-9) return d === 1 ? String(n) : `${n < 0 ? "-" : ""}\\tfrac{${Math.abs(n)}}{${d}}`; } return String(+v.toFixed(4)); })() : String(v));
  const intervalTeX = (set) => (!set.length ? "\\varnothing" : set.map((I) => (I.lo === I.hi ? `\\{${fmtN(I.lo)}\\}` : `${I.loC ? "[" : "("}${fmtN(I.lo)},\\ ${fmtN(I.hi)}${I.hiC ? "]" : ")"}`)).join(" \\cup "));

  // ───────── graph (construct a parabola) ─────────
  function readGraph(src) {
    const s = String(src || "").trim();
    const m = /^v:(-?[\d.]+),(-?[\d.]+)(?:;p:(.*))?$/.exec(s);
    if (!m) return { ok: false, error: "Place the vertex first." };
    const pts = (m[3] || "").split("|").filter(Boolean).map((t) => t.split(",").map(Number)).filter((p) => p.length === 2 && p.every(Number.isFinite));
    return { ok: true, h: Number(m[1]), k: Number(m[2]), pts };
  }

  // ───────── reading a decimal answer ─────────
  function readApprox(src) {
    let s = String(src || "").trim().replace(/[$,%°]/g, "").replace(/\s*(dollars?|degrees?|deg|cm|m|km|years?|units?)\s*$/i, "").replace(/^\s*[a-zA-Zθ]+\s*=\s*/, "").trim();
    if (!s) return { ok: false, error: "Empty answer." };
    const f = fparse(s);
    if (f) return { ok: true, value: QM().fval(f), tex: s };
    if (root.MathCheck) { const r = root.MathCheck.read(s); if (r.ok) return { ok: true, value: r.value, tex: r.tex }; return { ok: false, error: r.error }; }
    return { ok: false, error: "Not a number." };
  }
  const decimals = (s) => { const m = /\.(\d+)/.exec(String(s)); return m ? m[1].length : 0; };

  // ───────── grading ─────────
  const KINDS = new Set(["poly", "mono", "interval", "approx", "graph"]);
  const R = (max, note = "") => ({ earned: max, max, verdict: "right", note });
  const W = (max, note = "") => ({ earned: 0, max, verdict: "wrong", note });
  const P = (earned, max, note) => ({ earned, max, verdict: earned >= max ? "right" : earned > 0 ? "partial" : "wrong", note });

  function grade(spec, response) {
    const max = spec.marks || 1;
    if (response === undefined || response === null || String(response).trim() === "") return { earned: 0, max, verdict: "blank", note: "No answer." };
    if (spec.kind === "poly") {
      let ast, r, key;
      try { ast = parse(String(response).replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, "")); r = toRF(ast, spec.v || "x"); } catch (e) { return W(max, e.message); }
      key = toRF(parse(String(spec.answer)), spec.v || "x");
      if (!rfEqual(r, key)) {
        // a sign slip in a factor, or forgetting the leading factor: say so when we can tell
        if (rfEqual({ n: pneg(r.n), d: r.d }, key)) return W(max, "Check the signs: your answer is the negative of the correct one.");
        return W(max, "");
      }
      const form = spec.form || "any";
      let issues = [];
      if (form === "factored") issues = factorIssues(ast);
      else if (form === "expanded") { if (!isExpanded(ast)) issues = ["Expand fully and collect like terms."]; }
      else if (form === "simplified") issues = simplifiedIssues(ast, r);
      if (!issues.length) return R(max);
      return P(Math.max(0, max - 1), max, "Equivalent, but not in the requested form: " + issues.join(" "));
    }
    if (spec.kind === "mono") {
      let ast, key;
      try { ast = parse(response); key = parse(String(spec.answer)); } catch (e) { return W(max, e.message); }
      const vs = [...new Set([...vars(key), ...vars(ast)])];
      const extra = [...vars(ast)].filter((v) => !vars(key).has(v));
      if (extra.length) return W(max, `There's no ${extra.join(", ")} in this question.`);
      let same = true;
      for (let t = 0; t < 6 && same; t++) {
        const env = {}; vs.forEach((v, k) => { env[v] = 1.13 + 0.71 * k + 0.37 * t + 0.11 * k * t; });
        const a = evalAt(ast, env), b = evalAt(key, env);
        if (!Number.isFinite(a) || Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(b))) same = false;
      }
      if (!same) return W(max, "");
      const form = spec.form || "any";
      const negExp = (n) => { if (!n || typeof n !== "object") return false; if (n.t === "pow") { try { if (evalAt(n.e, {}) < 0) return true; } catch { /* has a variable */ } } return ["a", "b", "e", "n"].some((k) => n[k] && negExp(n[k])); };
      const fracExp = (n) => { if (!n || typeof n !== "object") return false; if (n.t === "pow") { try { const e = evalAt(n.e, {}); if (!Number.isInteger(e)) return true; } catch { /* */ } } return ["a", "b", "e", "n"].some((k) => n[k] && fracExp(n[k])); };
      const hasRoot = (n) => { if (!n || typeof n !== "object") return false; if (n.t === "root") return true; return ["a", "b", "e", "n"].some((k) => n[k] && hasRoot(n[k])); };
      if (form === "positive" && negExp(ast)) return P(max - 1, max, "Right value — now write it with positive exponents only.");
      if (form === "radical" && (fracExp(ast) || !hasRoot(ast))) return P(max - 1, max, "Equal, but the question asks for radical form (use √ or root(x, n)).");
      if (form === "power" && hasRoot(ast)) return P(max - 1, max, "Equal, but the question asks for a power with a rational exponent.");
      return R(max);
    }
    if (spec.kind === "interval") {
      const r = readInterval(response); if (!r.ok) return W(max, r.error);
      const key = readInterval(spec.answer); if (!key.ok) throw new Error("bad interval key " + spec.answer);
      if (sameSet(r.set, key.set)) return R(max);
      if (sameEndpoints(r.set, key.set)) return P(max > 1 ? max - 1 : 0, max, "Right boundaries — check which endpoints are included (closed [ ] vs open ( ), ≤ vs <).");
      const comp = normSet(complement(key.set));
      if (sameEndpoints(r.set, comp)) return W(max, "That's the opposite region: check the direction (where is the expression positive vs negative?).");
      return W(max, "");
    }
    if (spec.kind === "approx") {
      const r = readApprox(response); if (!r.ok) return W(max, r.error);
      const dp = spec.dp === undefined ? 2 : spec.dp, a = Number(spec.answer);
      const tol = 0.5 * Math.pow(10, -dp) + 1e-9 * Math.max(1, Math.abs(a));
      const rounded = Math.round(a * Math.pow(10, dp)) / Math.pow(10, dp);
      if (Math.abs(r.value - a) <= tol || Math.abs(r.value - rounded) < 1e-9) return R(max);
      if (Math.abs(r.value - a) <= Math.max(0.01 * Math.abs(a), 2 * Math.pow(10, -dp))) return P(max > 1 ? max - 1 : 0, max, `Close — check your rounding: ${rounded.toFixed(dp)}${spec.unit ? " " + spec.unit : ""}.`);
      if (spec.wrongs) for (const w of spec.wrongs) if (Math.abs(r.value - w.value) <= Math.max(tol, 0.005 * Math.abs(w.value))) return W(max, w.note);
      return W(max, "");
    }
    if (spec.kind === "graph") return gradeGraph(spec, response);
    throw new Error("AnswerCheck can't grade " + spec.kind);
  }
  function complement(set) {
    const out = []; let lo = -Infinity, loC = false;
    for (const I of set) { out.push({ lo, hi: I.lo, loC, hiC: !I.loC }); lo = I.hi; loC = !I.hiC; }
    out.push({ lo, hi: Infinity, loC, hiC: false });
    return out;
  }
  // A constructed parabola: vertex (1 mark), points that lie on the target curve (1), the right shape/direction (1).
  // Points may be placed in any order; a point counts if it is within the snap tolerance of the target curve.
  function gradeGraph(spec, response) {
    const max = spec.marks || 3;
    const r = readGraph(response); if (!r.ok) return W(max, r.error);
    const { a, h, k } = spec.answer, A = Number(eval1(a)), H = Number(eval1(h)), K = Number(eval1(k));
    const tol = (spec.snap || 1) / 2 * 0.999;
    const f = (x) => A * (x - H) * (x - H) + K;
    const vOK = Math.abs(r.h - H) < 1e-9 && Math.abs(r.k - K) < 1e-9;
    const others = r.pts.filter((p) => !(Math.abs(p[0] - r.h) < 1e-9 && Math.abs(p[1] - r.k) < 1e-9));
    const onCurve = others.filter((p) => Math.abs(p[1] - f(p[0])) <= tol);
    const offCurve = others.length - onCurve.length;
    const need = spec.minPoints || 2;
    // shape from the student's own points (least squares through their vertex)
    let aFit = null;
    const den = others.reduce((s, p) => s + Math.pow(p[0] - r.h, 4), 0);
    if (den > 0) aFit = others.reduce((s, p) => s + (p[1] - r.k) * Math.pow(p[0] - r.h, 2), 0) / den;
    const shapeOK = aFit !== null && Math.abs(aFit - A) <= Math.max(0.15 * Math.abs(A), 0.1) && Math.sign(aFit) === Math.sign(A);
    const sides = new Set(onCurve.map((p) => Math.sign(p[0] - H)));
    let earned = 0; const notes = [];
    if (vOK) earned++; else notes.push(Math.abs(r.h + H) < 1e-9 && Math.abs(r.k - K) < 1e-9 && H !== 0 ? "The vertex is mirrored: (x − h) moves the graph right." : `The vertex should be at (${fmtPlain(H)}, ${fmtPlain(K)}).`);
    if (onCurve.length >= need && offCurve === 0) earned++;
    else notes.push(others.length < need ? `Plot at least ${need} more points (one on each side of the axis helps).` : offCurve ? `${offCurve} of your points ${offCurve === 1 ? "isn't" : "aren't"} on the parabola.` : "Plot more points on the curve.");
    if (shapeOK && sides.size >= (spec.bothSides ? 2 : 1)) earned++;
    else if (aFit !== null && Math.sign(aFit) !== Math.sign(A)) notes.push(`It should open ${A > 0 ? "up" : "down"}.`);
    else if (aFit !== null && !shapeOK) notes.push("The width is off: check how far the graph rises one step from the vertex.");
    else if (spec.bothSides && sides.size < 2) notes.push("Use the axis of symmetry: plot a point on each side.");
    const scaled = Math.round((earned / 3) * max * 2) / 2;
    return P(Math.min(max, scaled), max, notes.join(" "));
  }
  const eval1 = (s) => { const f = fparse(String(s)); return f ? QM().fval(f) : Number(s); };
  const fmtPlain = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(3)));

  // preview ("Reads as") and the key as TeX
  function read(kind, src) {
    try {
      if (kind === "poly" || kind === "mono") { const ast = parse(String(src).replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, "")); return { ok: true, tex: astTeX(ast) }; }
      if (kind === "interval") { const r = readInterval(src); return r.ok ? { ok: true, tex: intervalTeX(r.set) } : r; }
      if (kind === "approx") { const r = readApprox(src); return r.ok ? { ok: true, tex: String(r.tex) } : r; }
      if (kind === "graph") { const r = readGraph(src); return r.ok ? { ok: true, tex: `\\text{vertex } (${r.h}, ${r.k}),\\ ${r.pts.length} \\text{ points}` } : r; }
    } catch (e) { return { ok: false, error: e.message }; }
    return { ok: false, error: "?" };
  }
  function astTeX(n) {
    switch (n.t) {
      case "num": return n.v;
      case "var": return n.v;
      case "par": return `\\left(${astTeX(n.a)}\\right)`;
      case "neg": return `-${astTeX(n.a)}`;
      case "add": return `${astTeX(n.a)} + ${astTeX(n.b)}`;
      case "sub": return `${astTeX(n.a)} - ${astTeX(n.b)}`;
      case "mul": return n.implicit ? `${astTeX(n.a)}${astTeX(n.b)}` : `${astTeX(n.a)} \\cdot ${astTeX(n.b)}`;
      case "div": return `\\dfrac{${astTeX(unpar(n.a))}}{${astTeX(unpar(n.b))}}`;
      case "pow": return `{${astTeX(n.a)}}^{${astTeX(unpar(n.e))}}`;
      case "root": return n.n.v === "2" ? `\\sqrt{${astTeX(unpar(n.a))}}` : `\\sqrt[${astTeX(n.n)}]{${astTeX(unpar(n.a))}}`;
    }
    return "";
  }
  function keyTeX(spec) {
    if (spec.ansTex) return spec.ansTex;
    if (spec.kind === "poly" || spec.kind === "mono") return astTeX(parse(String(spec.answer)));
    if (spec.kind === "interval") return intervalTeX(readInterval(spec.answer).set);
    if (spec.kind === "approx") return `${Number(spec.answer).toFixed(spec.dp === undefined ? 2 : spec.dp)}${spec.unit ? "\\text{ " + spec.unit + "}" : ""}`;
    if (spec.kind === "graph") return root.QuadMath ? root.QuadMath.vertexTeX({ a: fparse(spec.answer.a), h: fparse(spec.answer.h), k: fparse(spec.answer.k) }) : "";
    return "";
  }
  // the key typed the way a student would (generators self-check with this)
  function keyResponse(spec) {
    if (spec.kind === "approx") return Number(spec.answer).toFixed(spec.dp === undefined ? 2 : spec.dp);
    if (spec.kind === "graph") {
      const A = eval1(spec.answer.a), H = eval1(spec.answer.h), K = eval1(spec.answer.k);
      const pts = [-2, -1, 1, 2].map((d) => [H + d, A * d * d + K]);
      return `v:${H},${K};p:${pts.map((p) => p.join(",")).join("|")}`;
    }
    return String(spec.answer);
  }

  const api = { KINDS, handles: (k) => KINDS.has(k), grade, read, keyTeX, keyResponse, parse, toRF, rfEqual, readInterval, intervalTeX, factorIssues, isExpanded, irreducible, pgcd, pdivmod, evalAt, readGraph };
  root.AnswerCheck = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
