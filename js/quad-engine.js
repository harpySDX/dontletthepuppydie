/*
 * QUAD ENGINE: exact arithmetic and answer checking for quadratic functions.
 *
 *   QuadMath   exact fractions, polynomials, vertex/standard/factored conversions, exact roots
 *   QuadCheck  reads and grades the answer kinds the radicals checker can't:
 *                point     "(3, -2)"                       e.g. a vertex or an intercept
 *                equation  "y = 2(x-3)^2 + 1"              compared exactly as polynomials, with a required form
 *                plot      "v:3,-2;p:4,0"                  a parabola placed on the graph (vertex + one point)
 *
 * MathCheck.grade() hands these kinds to QuadCheck, so every screen (tests, practice, review, rooms)
 * grades them the same way. Nothing here uses eval: answers are parsed by a small recursive-descent parser.
 */
(function (root) {
  "use strict";

  // ═════════════ exact fractions ═════════════
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  function F(n, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error("bad fraction " + n + "/" + d);
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    const f = { n: n / g, d: d / g };
    if (!Number.isSafeInteger(f.n) || !Number.isSafeInteger(f.d) || Math.abs(f.n) > 1e12 || f.d > 1e12) throw new Error("fraction overflow");
    return f;
  }
  const fr = (x) => (typeof x === "number" ? F(x) : x);
  const fadd = (a, b) => { a = fr(a); b = fr(b); return F(a.n * b.d + b.n * a.d, a.d * b.d); };
  const fsub = (a, b) => { a = fr(a); b = fr(b); return F(a.n * b.d - b.n * a.d, a.d * b.d); };
  const fmul = (a, b) => { a = fr(a); b = fr(b); return F(a.n * b.n, a.d * b.d); };
  const fdiv = (a, b) => { a = fr(a); b = fr(b); if (b.n === 0) throw new Error("divide by zero"); return F(a.n * b.d, a.d * b.n); };
  const fneg = (a) => { a = fr(a); return F(-a.n, a.d); };
  const feq = (a, b) => { a = fr(a); b = fr(b); return a.n === b.n && a.d === b.d; };
  const fval = (a) => { a = fr(a); return a.n / a.d; };
  const fint = (a) => fr(a).d === 1;
  const fsign = (a) => Math.sign(fr(a).n);
  const fabs = (a) => { a = fr(a); return F(Math.abs(a.n), a.d); };
  const fpowi = (a, k) => { let r = F(1); for (let i = 0; i < k; i++) r = fmul(r, a); return r; };
  const fstr = (a) => { a = fr(a); return a.d === 1 ? String(a.n) : `${a.n}/${a.d}`; };
  const ftex = (a) => { a = fr(a); return a.d === 1 ? String(a.n) : `${a.n < 0 ? "-" : ""}\\frac{${Math.abs(a.n)}}{${a.d}}`; };
  // a decimal or fraction string → exact fraction ("0.25" → 1/4, "-3/4", "2")
  function fparse(s) {
    s = String(s).trim().replace(/[−–]/g, "-");
    let m = /^(-?)(\d+)\/(\d+)$/.exec(s);
    if (m) return F((m[1] ? -1 : 1) * Number(m[2]), Number(m[3]));
    m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s);
    if (!m || (!m[2] && !m[3])) return null;
    const dec = m[3] || "";
    return F((m[1] ? -1 : 1) * Number((m[2] || "0") + dec), Math.pow(10, dec.length));
  }

  // ═════════════ polynomials (arrays of fractions, index = power) ═════════════
  const ptrim = (p) => { const q = p.slice(); while (q.length > 1 && fr(q[q.length - 1]).n === 0) q.pop(); return q.map(fr); };
  const pconst = (c) => [fr(c)];
  const padd = (a, b) => ptrim(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => fadd(a[i] || F(0), b[i] || F(0))));
  const pneg = (a) => a.map(fneg);
  const psub = (a, b) => padd(a, pneg(b));
  function pmul(a, b) {
    const out = Array.from({ length: a.length + b.length - 1 }, () => F(0));
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] = fadd(out[i + j], fmul(a[i], b[j]));
    return ptrim(out);
  }
  const ppow = (a, k) => { let r = [F(1)]; for (let i = 0; i < k; i++) r = pmul(r, a); return r; };
  const pdeg = (p) => { const q = ptrim(p); return q.length === 1 && q[0].n === 0 ? -Infinity : q.length - 1; };
  const peq = (a, b) => { const x = ptrim(a), y = ptrim(b); return x.length === y.length && x.every((c, i) => feq(c, y[i])); };
  const pval = (p, x) => p.reduce((s, c, i) => s + fval(c) * Math.pow(x, i), 0);

  // ═════════════ quadratic conversions ═════════════
  // standard {a,b,c} ⇄ vertex {a,h,k}; factored {a,r,s}
  function toVertex({ a, b, c }) {
    a = fr(a); b = fr(b); c = fr(c);
    const h = fdiv(fneg(b), fmul(2, a));
    const k = fsub(c, fdiv(fmul(b, b), fmul(4, a)));
    return { a, h, k };
  }
  function toStandard({ a, h, k }) {
    a = fr(a); h = fr(h); k = fr(k);
    return { a, b: fmul(fmul(-2, a), h), c: fadd(fmul(a, fmul(h, h)), k) };
  }
  const fromFactored = ({ a, r, s }) => ({ a: fr(a), b: fmul(fneg(a), fadd(r, s)), c: fmul(a, fmul(r, s)) });
  const evalStd = ({ a, b, c }, x) => fadd(fadd(fmul(a, fmul(x, x)), fmul(b, x)), c);
  const disc = ({ a, b, c }) => fsub(fmul(b, b), fmul(4, fmul(a, c)));
  const polyOf = ({ a, b, c }) => ptrim([fr(c), fr(b), fr(a)]);

  // largest square factor: m = s²·t
  function sqrtSplit(m) { let s = 1, t = m; for (let f = 2; f * f <= t; f++) while (t % (f * f) === 0) { t /= f * f; s *= f; } return [s, t]; }
  function isqrt(n) { if (n < 0) return null; const r = Math.round(Math.sqrt(n)); return r * r === n ? r : null; }

  /*
   * Exact real roots of ax² + bx + c = 0.
   *   { count: 0 } | { count: 1, rational: [r] } | { count: 2, rational: [r1, r2] } (sorted)
   *   | { count: 2, p, q, t }  meaning  p ± q√t  (q > 0, t square-free > 1)
   * plus strings MathCheck can read (strs) and TeX (tex).
   */
  function roots(std) {
    const a = fr(std.a), b = fr(std.b);
    const D = disc(std);
    if (D.n < 0) return { count: 0, strs: [], tex: "\\text{no real roots}", values: [] };
    const p = fdiv(fneg(b), fmul(2, a));
    if (D.n === 0) return { count: 1, rational: [p], strs: [fstr(p)], tex: ftex(p), values: [fval(p)] };
    // √(n/d) = √(n·d)/d
    const [s, t] = sqrtSplit(D.n * D.d);
    const q = fabs(fdiv(F(s), fmul(D.d, fmul(2, a))));
    if (t === 1) {
      const r1 = fsub(p, q), r2 = fadd(p, q);
      return { count: 2, rational: [r1, r2], strs: [fstr(r1), fstr(r2)], tex: `${ftex(r1)},\\ ${ftex(r2)}`, values: [fval(r1), fval(r2)] };
    }
    const L = (p.d * q.d) / gcd(p.d, q.d);
    const P = p.n * (L / p.d), Q = q.n * (L / q.d);
    const rad = (Q === 1 ? "" : Q) + "√" + t;
    const radTex = (Q === 1 ? "" : Q) + `\\sqrt{${t}}`;
    const str = (sg) => {
      const top = P === 0 ? (sg < 0 ? "-" : "") + rad : `${P}${sg < 0 ? "-" : "+"}${rad}`;
      return L === 1 ? top : `(${top})/${L}`;
    };
    const topTex = P === 0 ? `\\pm ${radTex}` : `${P} \\pm ${radTex}`;
    const tex = L === 1 ? topTex : `\\frac{${topTex}}{${L}}`;
    const v = [fval(p) - fval(q) * Math.sqrt(t), fval(p) + fval(q) * Math.sqrt(t)];
    return { count: 2, p, q, t, strs: [str(-1), str(1)], tex, values: v, P, Q, L };
  }

  // ═════════════ TeX for quadratics in each form ═════════════
  function termTeX(coef, body, first) {
    coef = fr(coef);
    if (coef.n === 0) return "";
    const neg = coef.n < 0, abs = fabs(coef);
    const sign = first ? (neg ? "-" : "") : neg ? " - " : " + ";
    const cs = body && feq(abs, 1) ? "" : ftex(abs);
    return sign + cs + body;
  }
  function stdTeX({ a, b, c }, lhs = "y") {
    let s = termTeX(a, "x^2", true);
    s += termTeX(b, "x", !s);
    s += termTeX(c, "", !s);
    return (lhs ? lhs + " = " : "") + (s || "0");
  }
  const shiftTeX = (h) => { h = fr(h); return h.n === 0 ? "x" : `\\left(x ${h.n > 0 ? "-" : "+"} ${ftex(fabs(h))}\\right)`; };
  function vertexTeX({ a, h, k }, lhs = "y") {
    a = fr(a); k = fr(k);
    const sq = fr(h).n === 0 ? "x^2" : `${shiftTeX(h)}^2`;
    const lead = feq(a, 1) ? "" : feq(a, -1) ? "-" : ftex(a);
    const tail = k.n === 0 ? "" : k.n > 0 ? ` + ${ftex(k)}` : ` - ${ftex(fabs(k))}`;
    return (lhs ? lhs + " = " : "") + lead + sq + tail;
  }
  function factoredTeX({ a, r, s }, lhs = "y") {
    a = fr(a);
    const lead = feq(a, 1) ? "" : feq(a, -1) ? "-" : ftex(a);
    const f = (z) => (fr(z).n === 0 ? "x" : `\\left(x ${fr(z).n > 0 ? "-" : "+"} ${ftex(fabs(z))}\\right)`);
    return (lhs ? lhs + " = " : "") + lead + (feq(r, s) ? `${f(r)}^2` : f(r) + f(s));
  }
  // plain strings (keys typed the way a student would)
  const pstr = (a) => fstr(a);
  function vertexStr({ a, h, k }) {
    a = fr(a); h = fr(h); k = fr(k);
    const lead = feq(a, 1) ? "" : feq(a, -1) ? "-" : (a.d === 1 ? fstr(a) : `(${fstr(a)})`);
    const sq = h.n === 0 ? "x^2" : `(x${h.n > 0 ? "-" : "+"}${fstr(fabs(h))})^2`;
    const tail = k.n === 0 ? "" : k.n > 0 ? `+${fstr(k)}` : `-${fstr(fabs(k))}`;
    return `y=${lead}${sq}${tail}`;
  }
  function stdStr({ a, b, c }) {
    const t = (co, body, first) => {
      co = fr(co); if (co.n === 0) return "";
      const abs = fabs(co), sign = first ? (co.n < 0 ? "-" : "") : co.n < 0 ? "-" : "+";
      const cs = body && feq(abs, 1) ? "" : abs.d === 1 ? fstr(abs) : `(${fstr(abs)})`;
      return sign + cs + body;
    };
    let s = t(a, "x^2", true); s += t(b, "x", !s); s += t(c, "", !s);
    return "y=" + (s || "0");
  }
  const pointTeX = (x, y) => `\\left(${ftex(x)},\\ ${ftex(y)}\\right)`;
  const pointStr = (x, y) => `(${fstr(x)}, ${fstr(y)})`;

  // ═════════════ answer parser: expressions in x ═════════════
  function tokenize(src) {
    const s = String(src)
      .replace(/[−–—]/g, "-").replace(/[×·∙⋅]/g, "*").replace(/÷/g, "/")
      .replace(/²/g, "^2").replace(/³/g, "^3").replace(/\*\*/g, "^").replace(/\s+/g, "");
    const out = [];
    let i = 0;
    while (i < s.length) {
      const rest = s.slice(i);
      let m;
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(rest))) { out.push({ k: "num", v: fparse(m[1]) }); i += m[1].length; continue; }
      const ch = s[i];
      if (ch === "x" || ch === "X") { out.push({ k: "x" }); i++; continue; }
      if ("+-*/^()".includes(ch)) { out.push({ k: ch }); i++; continue; }
      if (ch === "[" || ch === "{") { out.push({ k: "(" }); i++; continue; }
      if (ch === "]" || ch === "}") { out.push({ k: ")" }); i++; continue; }
      throw new Error(`I can't read "${ch}" here. Use x, numbers, + − × ÷ ^ and brackets.`);
    }
    return out;
  }
  function parseExpr(src) {
    const toks = tokenize(src);
    let i = 0;
    const peek = () => toks[i], eat = (k) => (toks[i] && toks[i].k === k ? toks[i++] : null);
    function expr() {
      let n = term();
      for (;;) { const t = eat("+") || eat("-"); if (!t) return n; n = { t: t.k === "+" ? "add" : "sub", a: n, b: term() }; }
    }
    function startsAtom(t) { return t && (t.k === "num" || t.k === "x" || t.k === "("); }
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
      if (eat("^")) {
        const neg = !!eat("-");
        const e = atom();
        return { t: "pow", a: b, e: neg ? { t: "neg", a: e } : e };
      }
      return b;
    }
    function atom() {
      const t = toks[i++];
      if (!t) throw new Error("The answer ends too early.");
      if (t.k === "num") return { t: "num", v: t.v };
      if (t.k === "x") return { t: "x" };
      if (t.k === "(") { const n = expr(); if (!eat(")")) throw new Error("A bracket isn't closed."); return { t: "par", a: n }; }
      throw new Error(t.k === ")" ? "There's an extra closing bracket." : `"${t.k}" is in an odd place.`);
    }
    if (!toks.length) throw new Error("Empty answer.");
    const n = expr();
    if (i < toks.length) throw new Error(toks[i].k === ")" ? "There's an extra closing bracket." : "Something extra is at the end.");
    return n;
  }
  // AST → polynomial (exact). Division only by constants; exponents must be whole numbers 0–4.
  function toPoly(n) {
    switch (n.t) {
      case "num": return pconst(n.v);
      case "x": return [F(0), F(1)];
      case "par": return toPoly(n.a);
      case "neg": return pneg(toPoly(n.a));
      case "add": return padd(toPoly(n.a), toPoly(n.b));
      case "sub": return psub(toPoly(n.a), toPoly(n.b));
      case "mul": return pmul(toPoly(n.a), toPoly(n.b));
      case "div": {
        const d = toPoly(n.b);
        if (pdeg(d) > 0) throw new Error("Only divide by numbers here.");
        if (fr(d[0]).n === 0) throw new Error("That divides by zero.");
        return toPoly(n.a).map((c) => fdiv(c, d[0]));
      }
      case "pow": {
        const e = toPoly(n.e);
        if (pdeg(e) > 0 || !fint(e[0]) || e[0].n < 0 || e[0].n > 4) throw new Error("Use whole-number powers like ^2.");
        return ppow(toPoly(n.a), e[0].n);
      }
    }
    throw new Error("Unreadable.");
  }
  const hasX = (n) => n.t === "x" || (n.a && hasX(n.a)) || (n.b && hasX(n.b)) || (n.e && hasX(n.e));
  // top-level sum → signed terms
  function terms(n, sign = 1, out = []) {
    if (n.t === "add") { terms(n.a, sign, out); terms(n.b, sign, out); }
    else if (n.t === "sub") { terms(n.a, sign, out); terms(n.b, -sign, out); }
    else if (n.t === "par" && !hasX(n)) out.push({ sign, n });
    else out.push({ sign, n });
    return out;
  }
  // product factors (through negation and implicit/explicit multiplication)
  function factors(n, out = []) {
    if (n.t === "mul") { factors(n.a, out); factors(n.b, out); }
    else if (n.t === "neg") { out.push({ t: "num", v: F(-1) }); factors(n.a, out); }
    else if (n.t === "div" && !hasX(n.b)) { factors(n.a, out); out.push(n.b.t === "num" ? { t: "num", v: fdiv(1, n.b.v) } : { t: "inv", a: n.b }); }
    else out.push(n);
    return out;
  }
  const unpar = (n) => (n.t === "par" ? unpar(n.a) : n);
  const isLinear = (n) => { try { return pdeg(toPoly(n)) === 1; } catch { return false; } };
  const isUnitLinear = (n) => { try { const p = toPoly(n); return pdeg(p) === 1 && Math.abs(fval(p[1])) === 1; } catch { return false; } };
  // Which forms does this expression count as? (a student's layout, not just its value)
  function formsOf(ast) {
    const forms = new Set();
    const ts = terms(ast);
    const xTerms = ts.filter((t) => hasX(t.n));
    // standard: every term a constant times x^0/x^1/x^2, no brackets around x, each power once
    const mono = (n) => {
      const fs = factors(n);
      let pw = 0;
      for (const f of fs) {
        const g = f;
        if (g.t === "x") pw += 1;
        else if (g.t === "pow" && g.a.t === "x") { const e = toPoly(g.e); pw += e[0].n; }
        else if (hasX(g)) return null;
      }
      return pw;
    };
    const pows = ts.map((t) => mono(t.n));
    if (pows.every((p) => p !== null) && new Set(pows).size === pows.length) forms.add("standard");
    // vertex: one x-term = const × (x ± h)^2 (or x^2), the rest constants
    if (xTerms.length === 1) {
      const fs = factors(xTerms[0].n);
      const xf = fs.filter(hasX);
      if (xf.length === 1) {
        const f = xf[0];
        if (f.t === "pow" && !hasX(f.e) && (() => { const e = toPoly(f.e); return fint(e[0]) && e[0].n === 2; })()) {
          const inner = unpar(f.a);
          if (inner.t === "x" || isUnitLinear(inner)) forms.add("vertex");
        }
      }
    }
    // factored: a single product of constants and linear factors (no separate constant term)
    if (ts.length === 1) {
      const fs = factors(ts[0].n);
      const xf = fs.filter(hasX);
      const ok = xf.length >= 1 && xf.every((f) => isLinear(unpar(f)) || (f.t === "pow" && isLinear(unpar(f.a)) && !hasX(f.e)));
      if (ok) forms.add("factored");
    }
    return forms;
  }
  // AST → TeX (for the "Reads as" preview)
  function astTeX(n) {
    switch (n.t) {
      case "num": return ftex(n.v);
      case "x": return "x";
      case "par": return `\\left(${astTeX(n.a)}\\right)`;
      case "neg": return `-${astTeX(n.a)}`;
      case "add": return `${astTeX(n.a)} + ${astTeX(n.b)}`;
      case "sub": return `${astTeX(n.a)} - ${astTeX(n.b)}`;
      case "mul": return n.implicit ? `${astTeX(n.a)}${astTeX(n.b)}` : `${astTeX(n.a)} \\cdot ${astTeX(n.b)}`;
      case "div": return `\\frac{${astTeX(n.a)}}{${astTeX(n.b)}}`;
      case "pow": return `{${astTeX(n.a)}}^{${astTeX(n.e)}}`;
    }
    return "";
  }

  // "y = …", "f(x) = …" or just "…"
  function readEquation(src) {
    let s = String(src || "").trim();
    if (!s) return { ok: false, error: "Empty answer." };
    s = s.replace(/^\s*(y|f\s*\(\s*x\s*\)|g\s*\(\s*x\s*\)|h\s*\(\s*x\s*\))\s*=\s*/i, "");
    if (/=/.test(s)) return { ok: false, error: "Write it as y = … (one equals sign)." };
    if (/y/i.test(s)) return { ok: false, error: "Keep y on the left: y = …" };
    try {
      const ast = parseExpr(s);
      const poly = toPoly(ast);
      if (pdeg(poly) > 2) return { ok: false, error: "That isn't a quadratic (the power is higher than 2)." };
      return { ok: true, poly, forms: formsOf(ast), tex: "y = " + astTeX(ast) };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  // a constant (fractions, decimals, radicals via MathCheck): returns { ok, value, tex }
  function readNumber(s) {
    const C = root.MathCheck;
    s = String(s || "").trim();
    if (!s) return { ok: false, error: "Empty." };
    const f = fparse(s);
    if (f) return { ok: true, value: fval(f), exact: f, tex: ftex(f) };
    if (C) { const r = C.read(s); if (r.ok) return { ok: true, value: r.value, tex: r.tex }; return { ok: false, error: r.error }; }
    return { ok: false, error: "Not a number." };
  }
  // "(3, -2)", "3,-2", "(1/2, 4)" → { ok, x, y }
  function readPoint(src) {
    let s = String(src || "").trim();
    if (!s) return { ok: false, error: "Empty answer." };
    s = s.replace(/^[A-Za-z]\s*(?=\()/, ""); // "V(3,-2)"
    const m = /^\(?\s*([^,;()]+(?:\([^()]*\))?[^,;()]*)\s*[,;]\s*([^,;()]+(?:\([^()]*\))?[^,;()]*)\s*\)?$/.exec(s);
    if (!m) return { ok: false, error: "Write a point like (3, −2)." };
    const x = readNumber(m[1]), y = readNumber(m[2]);
    if (!x.ok) return { ok: false, error: "The x-coordinate: " + x.error };
    if (!y.ok) return { ok: false, error: "The y-coordinate: " + y.error };
    return { ok: true, x: x.value, y: y.value, tex: `\\left(${x.tex},\\ ${y.tex}\\right)` };
  }
  // plot response "v:h,k;p:x,y" → { ok, h, k, px, py, a }
  function readPlot(src) {
    const m = /^v:(-?[\d.]+),(-?[\d.]+);p:(-?[\d.]+),(-?[\d.]+)$/.exec(String(src || "").trim());
    if (!m) return { ok: false, error: "Place the vertex and one more point on the graph." };
    const [h, k, px, py] = m.slice(1).map(fparse);
    if (feq(px, h)) return { ok: false, error: "The second point can't be straight above or below the vertex." };
    const a = fdiv(fsub(py, k), fmul(fsub(px, h), fsub(px, h)));
    if (a.n === 0) return { ok: false, error: "The second point is level with the vertex, so that's not a parabola." };
    return { ok: true, h, k, px, py, a, tex: vertexTeX({ a, h, k }) };
  }

  const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  const KINDS = new Set(["point", "equation", "plot"]);
  const FORM_NAMES = { vertex: "vertex form y = a(x − h)² + k", standard: "standard form y = ax² + bx + c", factored: "factored form y = a(x − r)(x − s)" };

  function gradePoint(spec, response) {
    const max = spec.marks || 1;
    const r = readPoint(response);
    if (!r.ok) return { earned: 0, max, verdict: "wrong", note: r.error };
    const ax = readNumber(spec.answer.x).value, ay = readNumber(spec.answer.y).value;
    if (close(r.x, ax) && close(r.y, ay)) return { earned: max, max, verdict: "right", note: "" };
    if (close(r.x, ay) && close(r.y, ax)) return { earned: 0, max, verdict: "wrong", note: "The coordinates look swapped: a point is (x, y)." };
    if (spec.role === "vertex" && close(r.x, -ax) && close(r.y, ay) && ax !== 0) return { earned: max > 1 ? max - 1 : 0, max, verdict: max > 1 ? "partial" : "wrong", note: "Check the sign of h: y = a(x − h)² + k has its vertex at (h, k), so (x − 3) means h = 3." };
    if (close(r.x, ax) && max > 1) return { earned: max - 1, max, verdict: "partial", note: "The x-coordinate is right; recheck the y-coordinate." };
    return { earned: 0, max, verdict: "wrong", note: "" };
  }
  function gradeEquation(spec, response) {
    const max = spec.marks || 1;
    const r = readEquation(response);
    if (!r.ok) return { earned: 0, max, verdict: "wrong", note: r.error };
    const key = readEquation(spec.answer);
    if (!key.ok) throw new Error("bad key " + spec.answer);
    const form = spec.form || "any";
    if (peq(r.poly, key.poly)) {
      if (form === "any" || r.forms.has(form)) return { earned: max, max, verdict: "right", note: "" };
      return { earned: Math.max(0, max - 1), max, verdict: max > 1 ? "partial" : "wrong", note: `Same function, but the question asks for ${FORM_NAMES[form]}.` };
    }
    // diagnose common slips
    const p = r.poly, q = key.poly;
    if (pdeg(p) === 2 && pdeg(q) === 2) {
      const vs = toVertex({ a: p[2], b: p[1] || F(0), c: p[0] }), vk = toVertex({ a: q[2], b: q[1] || F(0), c: q[0] });
      if (feq(vs.h, fneg(vk.h)) && feq(vs.k, vk.k) && feq(vs.a, vk.a) && vk.h.n !== 0) return { earned: 0, max, verdict: "wrong", note: "The horizontal shift has the wrong sign: (x − h) moves the graph h units to the right." };
      if (feq(vs.h, vk.h) && feq(vs.k, vk.k)) return { earned: max > 1 ? 1 : 0, max, verdict: max > 1 ? "partial" : "wrong", note: "The vertex is right, but the stretch a isn't. Use a second point to find a." };
      if (feq(vs.a, vk.a) && feq(vs.h, vk.h)) return { earned: 0, max, verdict: "wrong", note: "Check the vertical shift k." };
    }
    return { earned: 0, max, verdict: "wrong", note: "" };
  }
  function gradePlot(spec, response) {
    const max = spec.marks || 1;
    const r = readPlot(response);
    if (!r.ok) return { earned: 0, max, verdict: "wrong", note: r.error };
    const A = fr(fparse(spec.answer.a)), H = fparse(spec.answer.h), K = fparse(spec.answer.k);
    const vOK = feq(r.h, H) && feq(r.k, K), aOK = feq(r.a, A);
    if (vOK && aOK) return { earned: max, max, verdict: "right", note: "" };
    if (vOK) return { earned: max > 1 ? max - 1 : 0, max, verdict: max > 1 ? "partial" : "wrong", note: `Vertex in the right place. The shape is off: one step right of the vertex, the graph should move ${feq(fabs(A), 1) ? "" : fstr(fabs(A)) + " "}${fsign(A) > 0 ? "up" : "down"}${feq(fabs(A), 1) ? " 1" : ""}.` };
    if (feq(r.h, fneg(H)) && feq(r.k, K) && aOK) return { earned: 0, max, verdict: "wrong", note: "The vertex is mirrored: (x − h) moves the graph right, (x + h) moves it left." };
    if (aOK && max > 1) return { earned: 1, max, verdict: "partial", note: "Right shape, but the vertex is in the wrong place." };
    return { earned: 0, max, verdict: "wrong", note: "" };
  }
  function grade(spec, response) {
    const max = spec.marks || 1;
    if (response === undefined || response === null || String(response).trim() === "") return { earned: 0, max, verdict: "blank", note: "No answer." };
    if (spec.kind === "point") return gradePoint(spec, response);
    if (spec.kind === "equation") return gradeEquation(spec, response);
    if (spec.kind === "plot") return gradePlot(spec, response);
    throw new Error("QuadCheck can't grade " + spec.kind);
  }
  // preview reader for the answer box
  function read(kind, src) {
    if (kind === "point") return readPoint(src);
    if (kind === "equation") return readEquation(src);
    if (kind === "plot") return readPlot(src);
    return { ok: false, error: "?" };
  }
  // the key, as TeX
  function keyTeX(spec) {
    if (spec.ansTex) return spec.ansTex;
    if (spec.kind === "point") return `\\left(${readNumber(spec.answer.x).tex},\\ ${readNumber(spec.answer.y).tex}\\right)`;
    if (spec.kind === "equation") return readEquation(spec.answer).tex;
    if (spec.kind === "plot") return vertexTeX({ a: fparse(spec.answer.a), h: fparse(spec.answer.h), k: fparse(spec.answer.k) });
    return "";
  }
  // the key, typed the way a student would (used to self-check generated questions)
  function keyResponse(spec) {
    if (spec.kind === "point") return `(${spec.answer.x}, ${spec.answer.y})`;
    if (spec.kind === "equation") return spec.answer;
    if (spec.kind === "plot") {
      const a = fparse(spec.answer.a), h = fparse(spec.answer.h), k = fparse(spec.answer.k);
      const px = fadd(h, 1);
      return `v:${fstr2(h)},${fstr2(k)};p:${fstr2(px)},${fstr2(fadd(k, a))}`;
    }
    return "";
  }
  const fstr2 = (f) => { f = fr(f); return String(f.n / f.d); };

  const QuadMath = {
    F, fr, fadd, fsub, fmul, fdiv, fneg, feq, fval, fint, fsign, fabs, fpowi, fstr, ftex, fparse, gcd,
    ptrim, padd, psub, pmul, ppow, pdeg, peq, pval,
    toVertex, toStandard, fromFactored, evalStd, disc, polyOf, roots, sqrtSplit, isqrt,
    stdTeX, vertexTeX, factoredTeX, vertexStr, stdStr, pointTeX, pointStr, shiftTeX, termTeX, pstr,
    parseExpr, toPoly, formsOf, astTeX,
  };
  const QuadCheck = { KINDS, handles: (k) => KINDS.has(k), grade, read, readEquation, readPoint, readPlot, readNumber, keyTeX, keyResponse, FORM_NAMES };
  root.QuadMath = QuadMath;
  root.QuadCheck = QuadCheck;
  if (typeof module !== "undefined") module.exports = { QuadMath, QuadCheck };
})(typeof window !== "undefined" ? window : globalThis);
