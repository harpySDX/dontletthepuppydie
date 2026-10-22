/*
 * MathCheck — reads typed answers like  3√2,  (6+2√5)/7,  ∛(-40),  2sqrt(3)
 * and checks them the way a teacher would:
 *   • is the VALUE right?
 *   • is it in SIMPLEST FORM? (radicals simplified, denominator rationalized,
 *     like terms combined, fraction reduced)
 *   • is it an ENTIRE radical (for "write as an entire radical")?
 *
 * Implicit multiplication binds tighter than ÷, so  3√2/2  means (3√2)/2
 * and  1/2√3  means 1/(2√3). The live preview shows how input was read.
 */
(function (root) {
  "use strict";

  // ───────────── tokenizer ─────────────
  function tokenize(src) {
    const s = String(src)
      .replace(/[−–—]/g, "-")
      .replace(/[×·∙]/g, "*")
      .replace(/÷/g, "/")
      .replace(/\s+/g, "");
    const out = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      const rest = s.slice(i);
      let m;
      if ((m = rest.match(/^(\d+\.?\d*|\.\d+)/))) { out.push({ k: "num", v: parseFloat(m[1]), raw: m[1] }); i += m[1].length; continue; }
      if ((m = rest.match(/^(sqrt|cbrt|root)/i))) { out.push({ k: "fn", v: m[1].toLowerCase() }); i += m[1].length; continue; }
      if ((m = rest.match(/^(pi|π)/i))) { out.push({ k: "num", v: Math.PI, raw: "π", pi: true }); i += m[1].length; continue; }
      if (ch === "√") { out.push({ k: "root", n: 2 }); i++; continue; }
      if (ch === "∛") { out.push({ k: "root", n: 3 }); i++; continue; }
      if (ch === "∜") { out.push({ k: "root", n: 4 }); i++; continue; }
      if ("+-*/^(),".includes(ch)) { out.push({ k: ch }); i++; continue; }
      if (ch === "[" || ch === "{") { out.push({ k: "(" }); i++; continue; }
      if (ch === "]" || ch === "}") { out.push({ k: ")" }); i++; continue; }
      throw new Error(`I don't understand "${ch}"`);
    }
    return out;
  }

  // ───────────── parser ─────────────
  function parse(src) {
    const toks = tokenize(src);
    if (!toks.length) throw new Error("Empty answer");
    let p = 0;
    const peek = () => toks[p];
    const eat = (k) => {
      const t = toks[p];
      if (t && t.k === "," && k === ")") throw new Error("This answer is a single number, not a point: leave out the comma.");
      if (!t || t.k !== k) throw new Error(k === ")" ? "Missing a closing bracket )" : `Expected "${k}"`);
      p++;
      return t;
    };
    const startsPrimary = (t) => t && (t.k === "num" || t.k === "(" || t.k === "root" || t.k === "fn");

    function expr() {
      let node = term();
      while (peek() && (peek().k === "+" || peek().k === "-")) {
        const op = toks[p++].k;
        node = { t: op === "+" ? "add" : "sub", a: node, b: term() };
      }
      return node;
    }
    function term() {
      let node = implicit();
      while (peek() && (peek().k === "*" || peek().k === "/")) {
        const op = toks[p++].k;
        node = { t: op === "*" ? "mul" : "div", a: node, b: implicit() };
      }
      return node;
    }
    function implicit() {
      let node = unary();
      while (startsPrimary(peek())) node = { t: "mul", a: node, b: power(), imp: true };
      return node;
    }
    function unary() {
      if (peek() && peek().k === "-") { p++; return { t: "neg", a: unary() }; }
      if (peek() && peek().k === "+") { p++; return unary(); }
      return power();
    }
    function power() {
      const base = primary();
      if (peek() && peek().k === "^") { p++; return { t: "pow", a: base, b: unary() }; }
      return base;
    }
    function rootArg() {
      // √ applies to the next number or bracket:  √12,  √(x),  √-8 for cube roots
      const t = peek();
      if (!t) throw new Error("Nothing after the root sign");
      if (t.k === "num") { p++; return { t: "num", v: t.v, pi: t.pi }; }
      if (t.k === "(") { p++; const e = expr(); eat(")"); return e; }
      if (t.k === "-") { p++; return { t: "neg", a: rootArg() }; }
      if (t.k === "root" || t.k === "fn") return primary();
      throw new Error("Put a number or brackets after √");
    }
    function primary() {
      const t = peek();
      if (!t) throw new Error("Answer ends too early");
      if (t.k === "num") { p++; return { t: "num", v: t.v, pi: t.pi }; }
      if (t.k === "(") { p++; const e = expr(); eat(")"); return e; }
      if (t.k === "root") { p++; return { t: "root", n: t.n, a: rootArg() }; }
      if (t.k === "fn") {
        p++;
        if (t.v === "root") { // root(n, x)
          eat("(");
          const n = expr(); eat(",");
          const a = expr(); eat(")");
          return { t: "root", n: evaluate(n), a };
        }
        const n = t.v === "sqrt" ? 2 : 3;
        if (peek() && peek().k === "(") { p++; const e = expr(); eat(")"); return { t: "root", n, a: e }; }
        return { t: "root", n, a: rootArg() };
      }
      throw new Error(`Unexpected "${t.k}"`);
    }

    const tree = expr();
    if (p < toks.length) throw new Error(`Unexpected "${toks[p].k === "num" ? toks[p].raw : toks[p].k}"`);
    return tree;
  }

  // ───────────── evaluate ─────────────
  function evaluate(n) {
    switch (n.t) {
      case "num": return n.v;
      case "neg": return -evaluate(n.a);
      case "add": return evaluate(n.a) + evaluate(n.b);
      case "sub": return evaluate(n.a) - evaluate(n.b);
      case "mul": return evaluate(n.a) * evaluate(n.b);
      case "div": return evaluate(n.a) / evaluate(n.b);
      case "pow": return Math.pow(evaluate(n.a), evaluate(n.b));
      case "root": {
        const v = evaluate(n.a);
        if (n.n % 2 === 1) return Math.sign(v) * Math.pow(Math.abs(v), 1 / n.n);
        return v < 0 ? NaN : Math.pow(v, 1 / n.n);
      }
    }
    return NaN;
  }

  // ───────────── LaTeX for the live preview ─────────────
  const PREC = { add: 1, sub: 1, mul: 2, div: 2, neg: 3, pow: 4, num: 5, root: 5 };
  function toTeX(n, parent = 0) {
    const wrap = (s, my) => (my < parent ? `\\left(${s}\\right)` : s);
    switch (n.t) {
      case "num": return n.pi ? "\\pi" : String(n.v);
      case "neg": return wrap(`-${toTeX(n.a, 3)}`, 3);
      case "add": return wrap(`${toTeX(n.a, 1)} + ${toTeX(n.b, 1)}`, 1);
      case "sub": return wrap(`${toTeX(n.a, 1)} - ${toTeX(n.b, 1.5)}`, 1);
      case "mul": {
        const a = toTeX(n.a, 2), b = toTeX(n.b, 2.5);
        const needDot = n.b.t === "num" || (n.b.t === "neg") || (!n.imp && n.a.t === "num" && n.b.t === "num");
        return wrap(needDot ? `${a} \\cdot ${b}` : `${a}${b}`, 2);
      }
      case "div": return wrap(`\\dfrac{${toTeX(n.a)}}{${toTeX(n.b)}}`, 4);
      case "pow": return wrap(`{${toTeX(n.a, 4.5)}}^{${toTeX(n.b)}}`, 4);
      case "root": return n.n === 2 ? `\\sqrt{${toTeX(n.a)}}` : `\\sqrt[${n.n}]{${toTeX(n.a)}}`;
    }
    return "?";
  }

  // ───────────── simplest-form analysis ─────────────
  const isInt = (v) => Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-9;
  const hasRoot = (n) => !!n && (n.t === "root" || ["a", "b"].some((k) => n[k] && typeof n[k] === "object" && hasRoot(n[k])));
  const gcd = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a; };

  function largestPowerFactor(v, n) {
    // largest k with k^n dividing v
    v = Math.abs(Math.round(v));
    let best = 1;
    for (let k = 2; Math.pow(k, n) <= v; k++) if (v % Math.pow(k, n) === 0) best = k;
    return best;
  }

  // Break a sum into signed terms; describe each term as  coef × (single radical | 1)
  function terms(n, sign = 1, out = []) {
    if (n.t === "add") { terms(n.a, sign, out); terms(n.b, sign, out); }
    else if (n.t === "sub") { terms(n.a, sign, out); terms(n.b, -sign, out); }
    else if (n.t === "neg" && (n.a.t === "add" || n.a.t === "sub")) terms(n.a, -sign, out);
    else out.push({ sign, node: n });
    return out;
  }
  // Returns {coef, key} for simple monomials like 3, -2√5, 4∛2; null otherwise
  function monomial(n) {
    if (n.t === "num") return { coef: n.v, key: n.pi ? "pi" : "1" };
    if (n.t === "neg") { const m = monomial(n.a); return m && { coef: -m.coef, key: m.key }; }
    if (n.t === "root") { const v = evaluate(n.a); return isInt(v) ? { coef: 1, key: `${n.n}:${Math.round(v)}` } : null; }
    if (n.t === "mul") {
      const a = monomial(n.a), b = monomial(n.b);
      if (!a || !b) return null;
      if (a.key !== "1" && b.key !== "1") return null;
      return { coef: a.coef * b.coef, key: a.key === "1" ? b.key : a.key };
    }
    return null;
  }

  function issues(tree) {
    const found = new Set();
    (function walk(n, inDenom) {
      if (!n || typeof n !== "object") return;
      if (n.t === "root") {
        const v = evaluate(n.a);
        if (n.a.t !== "num" && !(n.a.t === "neg" && n.a.a.t === "num")) {
          if (isInt(v)) found.add("Work out the number under the radical first.");
          else found.add("There's a fraction or expression under the radical — simplify it.");
        } else if (!isInt(v)) {
          found.add("There's a decimal or fraction under the radical.");
        } else {
          const iv = Math.abs(Math.round(v));
          if (iv <= 1 || largestPowerFactor(iv, n.n) > 1) found.add("A radical can still be simplified (take out the largest perfect " + (n.n === 2 ? "square" : n.n === 3 ? "cube" : "power") + ").");
        }
      }
      if (n.t === "div") {
        if (hasRoot(n.b)) found.add("The denominator still has a radical — rationalize it.");
        const d = evaluate(n.b);
        if (!hasRoot(n.b) && isInt(d)) {
          if (Math.abs(d) === 1) found.add("Dividing by 1 — drop the denominator.");
          if (d < 0) found.add("Move the negative out of the denominator.");
          // A factored numerator like 2(3+√5) over 2 can also reduce
          const intFactor = (x) => x.t === "mul" ? (x.a.t === "num" && isInt(x.a.v) ? x.a.v : x.b.t === "num" && isInt(x.b.v) ? x.b.v : null) : null;
          const f = intFactor(n.a);
          if (f !== null && gcd(f, d) > 1) found.add("The fraction can be reduced.");
          const ts = terms(n.a).map((t) => monomial(t.node));
          if (ts.every((m) => m && isInt(m.coef))) {
            const g = ts.reduce((acc, m) => gcd(acc, m.coef), Math.round(d));
            if (g > 1) found.add("The fraction can be reduced.");
          }
        }
      }
      if (n.t === "mul") {
        if (hasRoot(n.a) && hasRoot(n.b)) found.add("Multiply the radicals together into one.");
        if (n.a.t === "num" && n.b.t === "num" && !n.a.pi && !n.b.pi) found.add("Multiply the numbers out.");
      }
      if (n.t === "pow") found.add("Evaluate the exponent.");
      if (n.t === "add" || n.t === "sub") {
        const ms = terms(n).map((t) => monomial(t.node));
        const keys = ms.filter(Boolean).map((m) => m.key);
        if (new Set(keys).size < keys.length) found.add("Like terms can still be combined.");
      }
      for (const k of ["a", "b"]) if (n[k] && typeof n[k] === "object") walk(n[k], inDenom || (n.t === "div" && k === "b"));
    })(tree, false);
    return [...found];
  }

  function isEntire(tree) {
    let n = tree;
    if (n.t === "neg" && n.a.t === "root") n = n.a; // −∛40 or −∜162: a sign outside is allowed
    if (n.t !== "root") return false;
    const a = n.a.t === "neg" ? n.a.a : n.a;
    return a.t === "num" && isInt(a.v);
  }

  const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b));

  // ───────────── public API ─────────────
  function read(src) {
    try {
      const tree = parse(src);
      const value = evaluate(tree);
      if (!Number.isFinite(value)) return { ok: false, error: "That isn't a real number (check for √ of a negative)." };
      return { ok: true, tree, value, tex: toTeX(tree) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // Restrictions like  x ≥ 2/3,  x>=2/3,  2/3 <= x
  const OPS = { ">=": "\\ge", "≥": "\\ge", "=>": "\\ge", ">": ">", "<=": "\\le", "≤": "\\le", "=<": "\\le", "<": "<" };
  const NORM = { ">=": ">=", "≥": ">=", "=>": ">=", ">": ">", "<=": "<=", "≤": "<=", "=<": "<=", "<": "<" };
  const FLIP = { ">=": "<=", ">": "<", "<=": ">=", "<": ">" };
  function readRestriction(src) {
    const s = String(src).replace(/\s+/g, "");
    const m = s.match(/^(.*?)(>=|=>|≥|<=|=<|≤|>|<)(.*)$/);
    if (!m) return { ok: false, error: "Use an inequality like x ≥ 3" };
    let [, left, op, right] = m;
    let side;
    if (/^[a-z]$/i.test(left)) side = right;
    else if (/^[a-z]$/i.test(right)) { side = left; op = FLIP[NORM[op]]; }
    else return { ok: false, error: "Put the variable on one side, like x ≥ 3" };
    const r = read(side);
    if (!r.ok) return { ok: false, error: r.error };
    op = NORM[op];
    return { ok: true, op, value: r.value, tex: `x ${OPS[op]} ${r.tex}` };
  }

  const NONE = /^(none|no(\s*real)?\s*solutions?|ns|∅|\{\s*\}|empty|nosolution)$/i;

  function readSet(src) {
    const s = String(src).trim();
    if (!s) return { ok: false, error: "Empty answer" };
    if (NONE.test(s.replace(/\s+/g, " ").trim()) || NONE.test(s.replace(/\s+/g, ""))) return { ok: true, values: [], tex: "\\text{no solution}" };
    const parts = s.split(/,|;|\bor\b|\band\b/i).map((x) => x.trim().replace(/^[a-z]\s*=\s*/i, "")).filter(Boolean);
    const values = [], texs = [];
    for (const part of parts) {
      const r = read(part);
      if (!r.ok) return { ok: false, error: r.error };
      if (!values.some((v) => close(v, r.value))) { values.push(r.value); texs.push(r.tex); }
    }
    return { ok: true, values, tex: texs.map((t) => `x = ${t}`).join(",\\ ") };
  }

  /*
   * Grade one part. spec:
   *   { kind: "expr", answer: "3+√5", marks, form: "simplest" | "rationalized" | "entire" | "value" }
   *   { kind: "set",  answer: ["2"] (strings) or [], marks, mode: "final" | "candidates" | "extraneous" }
   *   { kind: "choice", answer: "Mixed", marks }
   *   { kind: "number", answer: 45, marks }
   * Returns { earned, max, verdict: "right"|"partial"|"wrong"|"blank", note }
   */
  function grade(spec, response) {
    // quadratic answer kinds (points, equations, plotted parabolas) live in quad-engine.js
    if (root.QuadCheck && root.QuadCheck.handles(spec.kind)) return root.QuadCheck.grade(spec, response);
    // curriculum-wide kinds (polynomials/rational expressions, exponent expressions, intervals, decimals, built graphs)
    if (root.AnswerCheck && root.AnswerCheck.handles(spec.kind)) return root.AnswerCheck.grade(spec, response);
    // physics: quantities with units, option choices, ordered steps (js/physics/check.js)
    if (root.PhysCheck && root.PhysCheck.handles(spec.kind)) return root.PhysCheck.grade(spec, response);
    const max = spec.marks || 1;
    const blank = response === undefined || response === null || String(response).trim() === "";
    if (blank) return { earned: 0, max, verdict: "blank", note: "No answer." };

    if (spec.kind === "choice") {
      const ok = String(response) === String(spec.answer);
      return { earned: ok ? max : 0, max, verdict: ok ? "right" : "wrong", note: ok ? "" : `It's ${spec.answer}.` };
    }

    if (spec.kind === "number") {
      const r = read(response);
      if (!r.ok) return { earned: 0, max, verdict: "wrong", note: r.error };
      const ok = close(r.value, Number(spec.answer));
      if (ok) return { earned: max, max, verdict: "right", note: "" };
      // Rounded answers: right but not rounded (or rounded wrong) keeps the method marks
      if (spec.round !== undefined && spec.exact) {
        const exact = read(spec.exact).value;
        if (Math.abs(r.value - exact) < Math.pow(10, -spec.round)) {
          return { earned: Math.max(0, max - 1), max, verdict: max > 1 ? "partial" : "wrong", note: `Right idea — round to ${spec.round === 2 ? "the nearest hundredth" : spec.round + " decimal places"}: ${spec.answer}.` };
        }
      }
      return { earned: 0, max, verdict: "wrong", note: "" };
    }

    if (spec.kind === "restriction") {
      const r = readRestriction(response);
      if (!r.ok) return { earned: 0, max, verdict: "wrong", note: r.error };
      const target = read(spec.answer.value).value;
      if (!close(r.value, target)) return { earned: 0, max, verdict: "wrong", note: "" };
      if (r.op === spec.answer.op) return { earned: max, max, verdict: "right", note: "" };
      const sameDir = r.op[0] === spec.answer.op[0];
      return { earned: sameDir && max > 1 ? max - 1 : 0, max, verdict: sameDir && max > 1 ? "partial" : "wrong", note: sameDir ? "Right boundary — check whether it should include the endpoint (≥ vs >)." : "The inequality points the wrong way." };
    }

    if (spec.kind === "set") {
      const r = readSet(response);
      if (!r.ok) return { earned: 0, max, verdict: "wrong", note: r.error };
      const correct = spec.answer.map((a) => read(a).value);
      const user = r.values;
      const hits = correct.filter((c) => user.some((u) => close(u, c))).length;
      const extras = user.filter((u) => !correct.some((c) => close(u, c))).length;
      if (hits === correct.length && extras === 0) return { earned: max, max, verdict: "right", note: "" };
      // Partial credit: found every real solution but also listed something wrong (often an extraneous root)
      if (max >= 2 && correct.length && hits === correct.length) {
        return { earned: max - 1, max, verdict: "partial", note: spec.mode === "final" ? "You kept a value that doesn't check — it's extraneous." : "One of your values is wrong." };
      }
      if (max >= 2 && hits > 0) return { earned: 1, max, verdict: "partial", note: "Some of your values are right, but not all." };
      return { earned: 0, max, verdict: "wrong", note: !correct.length && user.length ? (spec.mode === "extraneous" ? "Nothing is extraneous here — every candidate checks out." : "There is no solution — every candidate fails the check.") : "" };
    }

    // expression
    const r = read(response);
    if (!r.ok) return { earned: 0, max, verdict: "wrong", note: r.error };
    const target = read(spec.answer).value;
    if (!close(r.value, target)) {
      // A decimal approximation of an exact answer (1.414 for √2, 12.57 for 4π) keeps the method mark
      const decimalOnly = !hasRoot(r.tree) && !/π|pi/i.test(String(response));
      if (decimalOnly && hasExactPart(spec.answer) && Math.abs(r.value - target) <= 0.006 * Math.max(1, Math.abs(target))) {
        return { earned: Math.max(0, max - 1), max, verdict: max > 1 ? "partial" : "wrong", note: "That's a decimal approximation — the question wants the exact value." };
      }
      return { earned: 0, max, verdict: "wrong", note: "" };
    }

    const form = spec.form || "simplest";
    if (form === "value") return { earned: max, max, verdict: "right", note: "" };
    // a decimal typed to many places can land inside the equality tolerance; it is still not the exact value
    if (/\d\.\d/.test(String(response)) && !hasRoot(r.tree) && !/π|pi/i.test(String(response)) && hasExactPart(spec.answer)) {
      return { earned: Math.max(0, max - 1), max, verdict: max > 1 ? "partial" : "wrong", note: "That's a decimal approximation — the question wants the exact value." };
    }
    if (form === "entire") {
      return isEntire(r.tree)
        ? { earned: max, max, verdict: "right", note: "" }
        : { earned: 0, max, verdict: "partial", note: "Right value, but an entire radical has no number outside the root." };
    }
    const probs = issues(r.tree);
    if (!probs.length) return { earned: max, max, verdict: "right", note: "" };
    const notRationalized = probs.some((p) => p.startsWith("The denominator"));
    if (form === "rationalized" && notRationalized) {
      return { earned: 0, max, verdict: "wrong", note: "Equal value, but the denominator isn't rationalized yet." };
    }
    const earned = Math.max(0, max - 1);
    return { earned, max, verdict: earned ? "partial" : "wrong", note: "Right value, not in simplest form: " + probs.join(" ") };
  }

  function hasExactPart(answer) { return /√|∛|∜|sqrt|cbrt|root|π|pi/i.test(String(answer)); }

  const api = { parse, evaluate, toTeX, issues, isEntire, read, readSet, readRestriction, grade };
  root.MathCheck = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
