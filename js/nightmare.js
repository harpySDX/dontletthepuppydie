/*
 * NIGHTMARE — generated, verified questions for Nightmare I (Brutal), II (Extreme) and III (Catastrophic).
 *
 * Every question is built from a parameterised template with EXACT arithmetic (integer fractions,
 * exact rational powers, exact radical sums), and is then checked independently before a student sees it:
 *   • the answer is compared with a direct floating-point evaluation of the original expression
 *     (at several random positive values when there are variables);
 *   • typed answers must be graded "right" by the site's own answer checker (js/mathcheck.js), so the key
 *     is in the simplest / rationalized form the rubric demands;
 *   • every multiple-choice distractor must differ in value from the answer and from each other;
 *   • expressions that collapse to something trivial are rejected.
 * An instance that fails any check is discarded and the template is re-seeded. Nothing unverified is shown.
 *
 * Question ids encode (version, tier, template, seed), e.g. "nm-1-2-mono-1a2b3c", so any question can be
 * rebuilt exactly from its id: saved tests, pause/resume, review and history all keep working.
 * Domain: variables are assumed positive (stated in every question that has them).
 */
(function (root) {
  "use strict";
  const VERSION = 1;
  const R = String.raw;

  // ───────── exact rationals ─────────
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  function F(n, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error("bad fraction");
    if (Math.abs(n) > 1e12 || Math.abs(d) > 1e12) throw new Error("too big");
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  const fadd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const fsub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const fmul = (a, b) => F(a.n * b.n, a.d * b.d);
  const fdiv = (a, b) => { if (b.n === 0) throw new Error("÷0"); return F(a.n * b.d, a.d * b.n); };
  const fneg = (a) => F(-a.n, a.d);
  const feq = (a, b) => a.n === b.n && a.d === b.d;
  const fval = (a) => a.n / a.d;
  const fint = (a) => a.d === 1;
  function iroot(v, k) {
    if (v < 0) { if (k % 2 === 0) return null; const r = iroot(-v, k); return r === null ? null : -r; }
    const r = Math.round(Math.pow(v, 1 / k));
    for (const c of [r - 1, r, r + 1]) if (c >= 0 && Math.pow(c, k) === v) return c;
    return null;
  }
  function ipow(b, e) { let r = 1; for (let i = 0; i < e; i++) r *= b; if (Math.abs(r) > 1e12) throw new Error("too big"); return r; }
  // exact a^(p/q); throws if not exact
  function fpow(a, e) {
    const rn = iroot(a.n, e.d), rd = iroot(a.d, e.d);
    if (rn === null || rd === null) throw new Error("inexact power");
    if (e.n >= 0) return F(ipow(rn, e.n), ipow(rd, e.n));
    if (rn === 0) throw new Error("0^neg");
    return F(ipow(rd, -e.n), ipow(rn, -e.n));
  }

  // ───────── seeded random ─────────
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // x² + bx + c and (x − r) written with clean signs
  const signed = (n, first) => (n < 0 ? (first ? "-" : " - ") + Math.abs(n) : (first ? "" : " + ") + n);
  const quadTeX = (b, c) => `x^2${b === 0 ? "" : b === 1 ? " + x" : b === -1 ? " - x" : signed(b) + "x"}${c === 0 ? "" : signed(c)}`;
  const linTeX = (r) => (r === 0 ? "x" : `(x${signed(-r)})`);
  const pick = (r, arr) => { if (!arr.length) throw new Error("empty pick"); return arr[Math.floor(r() * arr.length)]; };
  const rint = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const shuffle = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ───────── TeX helpers ─────────
  const tFrac = (a) => (a.d === 1 ? String(a.n) : `${a.n < 0 ? "-" : ""}\\frac{${Math.abs(a.n)}}{${a.d}}`);
  const tExp = (e) => (e.d === 1 ? `{${e.n}}` : `{${e.n < 0 ? "-" : ""}\\frac{${Math.abs(e.n)}}{${e.d}}}`);
  const tExpPlain = (e) => (e.d === 1 ? String(e.n) : `${e.n}/${e.d}`);

  // ───────── monomials: coefficient (fraction) × variables^(fraction) ─────────
  const M = (c, e = {}) => { const o = {}; for (const [k, v] of Object.entries(e)) if (v.n !== 0) o[k] = v; return { c, e: o }; };
  const mmul = (a, b) => { const e = { ...a.e }; for (const [k, v] of Object.entries(b.e)) e[k] = e[k] ? fadd(e[k], v) : v; return M(fmul(a.c, b.c), e); };
  const mdiv = (a, b) => { const e = { ...a.e }; for (const [k, v] of Object.entries(b.e)) e[k] = e[k] ? fsub(e[k], v) : fneg(v); return M(fdiv(a.c, b.c), e); };
  const mpow = (a, p) => { const e = {}; for (const [k, v] of Object.entries(a.e)) e[k] = fmul(v, p); return M(fpow(a.c, p), e); };
  const VARS_ORDER = ["a", "b", "c", "x", "y", "z"];
  const vars = (m) => Object.keys(m.e).sort((x, y) => VARS_ORDER.indexOf(x) - VARS_ORDER.indexOf(y));
  const varTeX = (v, e) => (e.n === 1 && e.d === 1 ? v : `${v}^${tExp(e)}`);
  // inner form as written in a question, e.g. 72x^{-6}y^{9}
  function texRaw(m) {
    const c = m.c.d === 1 ? (m.c.n === 1 && vars(m).length ? "" : m.c.n === -1 && vars(m).length ? "-" : String(m.c.n)) : tFrac(m.c);
    return c + vars(m).map((v) => varTeX(v, m.e[v])).join("");
  }
  // simplified form with positive exponents only
  function texPos(m) {
    const num = [], den = [];
    for (const v of vars(m)) { const e = m.e[v]; (e.n > 0 ? num : den).push(varTeX(v, e.n > 0 ? e : fneg(e))); }
    const neg = m.c.n < 0, cn = Math.abs(m.c.n), cd = m.c.d;
    const top = (cn === 1 && num.length ? "" : String(cn)) + num.join("");
    const bot = (cd === 1 && den.length ? "" : cd === 1 ? "" : String(cd)) + den.join("");
    const body = bot ? `\\frac{${top || "1"}}{${bot}}` : top || "1";
    return (neg ? "-" : "") + body;
  }
  const mkey = (m) => texPos(m);
  function mval(m, vals) { let v = fval(m.c); for (const [k, e] of Object.entries(m.e)) v *= Math.pow(vals[k], fval(e)); return v; }

  // ───────── exact radical sums: Σ coef · ⁿ√radicand  (radicand 1 = rational part) ─────────
  function largestPow(v, n) { let best = 1; for (let k = 2; Math.pow(k, n) <= v; k++) if (v % Math.pow(k, n) === 0) best = k; return best; }
  function rootSimplify(n, v) { if (v === 0) return [0, 1]; const s = v < 0 ? -1 : 1; v = Math.abs(v); if (s < 0 && n % 2 === 0) throw new Error("even root of negative"); const k = largestPow(v, n); return [s * k, v / Math.pow(k, n)]; }
  const RS = (terms = []) => { const m = new Map(); for (const t of terms) addTerm(m, t.c, t.n, t.r); return m; };
  function addTerm(m, c, n, r) {
    if (c.n === 0) return;
    let [k, rad] = r === 1 ? [1, 1] : rootSimplify(n, r);
    let nn = rad === 1 ? 1 : n;
    const key = `${nn}|${rad}`;
    const cc = fmul(c, F(k));
    m.set(key, m.has(key) ? fadd(m.get(key), cc) : cc);
    if (m.get(key).n === 0) m.delete(key);
  }
  const rsTerms = (m) => [...m.entries()].map(([k, c]) => { const [n, r] = k.split("|").map(Number); return { c, n, r }; }).sort((a, b) => (a.r === 1 ? -1 : b.r === 1 ? 1 : a.n - b.n || a.r - b.r));
  const rsAdd = (a, b) => { const m = new Map(a); for (const t of rsTerms(b)) addTerm(m, t.c, t.n, t.r); return m; };
  const rsScale = (a, f) => { const m = new Map(); for (const t of rsTerms(a)) addTerm(m, fmul(t.c, f), t.n, t.r); return m; };
  function rsMul(a, b) {
    const m = new Map();
    for (const x of rsTerms(a)) for (const y of rsTerms(b)) {
      if (x.r === 1) addTerm(m, fmul(x.c, y.c), y.n, y.r);
      else if (y.r === 1) addTerm(m, fmul(x.c, y.c), x.n, x.r);
      else if (x.n === y.n) addTerm(m, fmul(x.c, y.c), x.n, x.r * y.r);
      else throw new Error("mixed indices");
    }
    return m;
  }
  const rsIsRational = (a) => rsTerms(a).every((t) => t.r === 1);
  const rsRational = (a) => { const t = rsTerms(a); return t.length ? t[0].c : F(0); };
  function rsVal(a) { return rsTerms(a).reduce((s, t) => s + fval(t.c) * (t.r === 1 ? 1 : Math.sign(t.r) * Math.pow(Math.abs(t.r), 1 / t.n)), 0); }
  // conjugate of a two-term square-root denominator (p + q → p − q)
  function rsConj(a) { const t = rsTerms(a); if (t.length !== 2 || t.some((x) => x.r !== 1 && x.n !== 2)) throw new Error("no conjugate"); return RS([t[0], { ...t[1], c: fneg(t[1].c) }]); }
  const SYM = { 2: "√", 3: "∛", 4: "∜" };
  const texRoot = (n, r) => (n === 2 ? `\\sqrt{${r}}` : `\\sqrt[${n}]{${r}}`);
  // → { str (for the answer checker), tex }
  function rsFormat(a) {
    const ts = rsTerms(a);
    if (!ts.length) return { str: "0", tex: "0" };
    const D = ts.reduce((acc, t) => lcm(acc, t.c.d), 1);
    const ks = ts.map((t) => ({ ...t, k: t.c.n * (D / t.c.d) }));
    const piece = (t, first, tex) => {
      const sign = t.k < 0 ? "-" : first ? "" : "+";
      const a = Math.abs(t.k);
      if (t.r === 1) return sign + a;
      const coef = a === 1 ? "" : String(a);
      return sign + coef + (tex ? texRoot(t.n, t.r) : SYM[t.n] + t.r);
    };
    const numS = ks.map((t, i) => piece(t, i === 0, false)).join("");
    const numT = ks.map((t, i) => piece(t, i === 0, true)).join("");
    if (D === 1) return { str: numS, tex: numT };
    const str = ks.length > 1 ? `(${numS})/${D}` : `${numS}/${D}`;
    const lead = ks.length === 1 && ks[0].k < 0;
    const tex = lead ? `-\\frac{${numT.slice(1)}}{${D}}` : `\\frac{${numT}}{${D}}`;
    return { str, tex };
  }

  // ───────── verification helpers ─────────
  const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  function needChecker() { const C = root.MathCheck; if (!C) throw new Error("MathCheck missing"); return C; }
  // the key must be graded "right" by the site's own checker, and match an independent float value
  function verifyTyped(answerStr, form, floatVal) {
    const C = needChecker();
    const g = C.grade({ kind: "expr", answer: answerStr, form, marks: 2 }, answerStr);
    if (g.verdict !== "right") throw new Error("checker rejects key " + answerStr + " " + g.note);
    const r = C.read(answerStr);
    if (!r.ok || !close(r.value, floatVal)) throw new Error(`key ${answerStr}=${r.value} ≠ ${floatVal}`);
  }
  const SAMPLES = [{ a: 1.37, b: 0.71, c: 2.13, x: 1.29, y: 0.83, z: 1.61 }, { a: 0.59, b: 1.83, c: 0.77, x: 2.41, y: 1.17, z: 0.67 }, { a: 2.9, b: 1.13, c: 1.47, x: 0.93, y: 2.21, z: 1.39 }];
  // monomials can evaluate to tiny numbers (e.g. 1e-10) at the sample points, so compare them by relative error only
  const rclose = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));
  function verifyMono(m, floatFn) { for (const s of SAMPLES) if (!rclose(mval(m, s), floatFn(s))) throw new Error("monomial mismatch"); }
  function distinctMonos(list) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      if (mkey(list[i]) === mkey(list[j])) throw new Error("duplicate choice");
      if (SAMPLES.some((s) => rclose(mval(list[i], s), mval(list[j], s)))) throw new Error("equivalent choices");
    }
  }

  const T = () => root.TOPICS || {};
  const ASSUME = "Assume all variables are positive.";

  // ════════════════ TEMPLATES ════════════════
  // Each returns { kind: "mc" | "nr" | "wr", q }  or throws to be re-seeded.

  // ── exponent laws: (A·vars)^r · (B·vars)^s / (C·vars)^t ─────────
  const BASES = { 1: [2, 3, 4, 5, 6, 7], 2: [2, 3, 4, 5, 6], 3: [2, 3, 5, 6, 7, 10] };
  function expFactor(r, tier, vs, outer, allowFrac) {
    const base = pick(r, BASES[tier]);
    const bd = tier >= 3 && r() < 0.35 ? pick(r, [2, 3, 5].filter((x) => x !== base)) : 1;
    const c = F(ipow(base, outer.d), ipow(bd, outer.d));
    const e = {};
    for (const v of vs) {
      let k = rint(r, -4, 5); if (k === 0) k = 3;
      e[v] = allowFrac && r() < 0.3 ? F(k * outer.d + (r() < 0.5 ? 1 : -1), 1) : F(k * outer.d);
    }
    return { inner: M(c, e), outer };
  }
  const OUTERS = { 1: [F(2, 3), F(3, 2), F(-1, 2), F(-2), F(1, 3), F(-1, 3), F(2), F(-3, 2)], 2: [F(-2, 3), F(-3, 2), F(3, 4), F(-1, 2), F(5, 3), F(-4, 3)], 3: [F(-2, 3), F(-3, 2), F(3, 4), F(-5, 3), F(4, 3), F(-3, 4), F(5, 2)] };
  function buildExp(r, tier, intOnly = false) {
    const vs = tier === 1 ? shuffle(r, ["x", "y"]) : shuffle(r, ["a", "b", "c"]).slice(0, tier === 2 ? pick(r, [2, 3]) : 3);
    vs.sort((x, y) => VARS_ORDER.indexOf(x) - VARS_ORDER.indexOf(y));
    const nTop = tier === 3 ? 2 : 1;
    const top = Array.from({ length: nTop }, () => expFactor(r, intOnly ? Math.min(tier, 2) : tier, vs, pick(r, OUTERS[tier]), tier >= 2 && !intOnly));
    const bot = [expFactor(r, intOnly ? Math.min(tier, 2) : tier, vs, pick(r, OUTERS[tier]), tier >= 2 && !intOnly)];
    if (top.length === 1 && feq(top[0].outer, bot[0].outer)) throw new Error("same outer");
    return { vs, top, bot };
  }
  function evalExp(spec, mode = "ok") {
    // error models: "addpow" (added exponents for a power of a power), "coef" (outer exponent ignored on the coefficient),
    //               "quot" (added exponents when dividing), "negflip" (dropped the minus sign of a negative outer exponent)
    const pw = (f) => {
      if (mode === "addpow") { const e = {}; for (const [k, v] of Object.entries(f.inner.e)) e[k] = fadd(v, f.outer); return M(fpow(f.inner.c, f.outer), e); }
      if (mode === "coef") { const p = mpow(f.inner, f.outer); return M(f.inner.c, p.e); }
      if (mode === "negflip" && f.outer.n < 0) return mpow(f.inner, fneg(f.outer));
      return mpow(f.inner, f.outer);
    };
    let num = pw(spec.top[0]);
    for (const f of spec.top.slice(1)) num = mmul(num, pw(f));
    const den = pw(spec.bot[0]);
    return mode === "quot" ? mmul(num, den) : mdiv(num, den);
  }
  const floatExp = (spec) => (s) => {
    const fv = (f) => Math.pow(fval(f.inner.c) * Object.entries(f.inner.e).reduce((p, [k, e]) => p * Math.pow(s[k], fval(e)), 1), fval(f.outer));
    return spec.top.reduce((p, f) => p * fv(f), 1) / fv(spec.bot[0]);
  };
  const texFactor = (f) => `\\left(${texRaw(f.inner)}\\right)^${tExp(f.outer)}`;
  const texExpQ = (spec) => `\\dfrac{${spec.top.map(texFactor).join("")}}{${texFactor(spec.bot[0])}}`;
  function expSolution(spec, ans) {
    const lines = [];
    const show = (f) => `${texFactor(f)} = ${texRaw(mpow(f.inner, f.outer))}`;
    lines.push(R`Raise every factor inside each bracket to the outer exponent (multiply exponents; take the root of the coefficient first, then the power):`);
    for (const f of [...spec.top, ...spec.bot]) lines.push(`\\(${show(f)}\\)`);
    let num = mpow(spec.top[0].inner, spec.top[0].outer);
    for (const f of spec.top.slice(1)) num = mmul(num, mpow(f.inner, f.outer));
    if (spec.top.length > 1) lines.push(R`Multiply the numerator factors (add exponents): \(` + texRaw(num) + R`\)`);
    lines.push(R`Divide by the denominator (subtract exponents): \(` + texRaw(ans) + R`\)`);
    lines.push(R`Write with positive exponents only: \(` + texPos(ans) + R`\)`);
    return lines;
  }
  const EXP_WHY = {
    addpow: "This is what you get by adding the outer exponent to each inner exponent. For a power of a power, multiply them.",
    coef: "This forgets to apply the outer exponent to the number in front. The coefficient gets the exponent too.",
    quot: "This adds the denominator's exponents instead of subtracting them.",
    negflip: "This drops the minus sign of a negative outer exponent. A negative exponent means take the reciprocal.",
  };
  function tplExp(r, tier, kind) {
    const spec = buildExp(r, tier, kind === "nr");
    const ans = evalExp(spec);
    verifyMono(ans, floatExp(spec));
    if (vars(ans).length < 2) throw new Error("collapsed");
    const q = R`Simplify. Write the answer with positive exponents only. ${ASSUME}\[` + texExpQ(spec) + R`\]`;
    const sol = expSolution(spec, ans);
    if (kind === "nr") {
      if (!fint(ans.c) || Math.abs(ans.c.n) > 999 || vars(ans).some((v) => !fint(ans.e[v]))) throw new Error("nr needs modest integers");
      const vs = vars(ans);
      const total = ans.c.n + vs.reduce((s, v) => s + ans.e[v].n, 0);
      return { kind, q: { topic: T().exp, concepts: ["exponents.laws", "exponents.negative", "exponents.rational"], fmt: "Integer",
        q: R`The expression below simplifies to \(k\,${vs.map((v, i) => `${v}^{${"mnp"[i]}}`).join("")}\), where \(k\) and the exponents are integers (exponents may be negative). ${ASSUME} Find \(k + ${vs.map((_, i) => "mnp"[i]).join(" + ")}\).\[` + texExpQ(spec) + R`\]`,
        answer: total, e: sol.join("<br>") + R`<br>So \(k = ${ans.c.n}\)${vs.map((v, i) => `, \\(${"mnp"[i]} = ${ans.e[v].n}\\)`).join("")} and the sum is \(${total}\).` } };
    }
    const modes = shuffle(r, ["addpow", "coef", "quot", "negflip"]);
    const ds = [];
    for (const mo of modes) { try { const d = evalExp(spec, mo); distinctMonos([ans, ...ds.map((x) => x.m), d]); ds.push({ m: d, why: EXP_WHY[mo] }); } catch { /* try next */ } if (ds.length === 3) break; }
    if (ds.length < 3) throw new Error("not enough distractors");
    return { kind: "mc", q: { topic: T().exp, concepts: ["exponents.laws", "exponents.negative", "exponents.rational"], q,
      c: [`\\(${texPos(ans)}\\)`, ...ds.map((d) => `\\(${texPos(d.m)}\\)`)], why: [null, ...ds.map((d) => d.why)], e: sol.join("<br>") } };
  }

  // ── like radicals with variables: Σ c·√(s² r · var powers) → one radical term ─────────
  function tplRadVars(r, tier, kind) {
    const n = tier === 3 && r() < 0.4 ? 3 : 2;
    const vs = tier === 1 ? ["x", "y"] : ["a", "b"];
    const rad = n === 2 ? pick(r, [2, 3, 5, 6, 7]) : pick(r, [2, 3, 4, 5]);
    const u = { [vs[0]]: rint(r, 0, n - 1), [vs[1]]: rint(r, 1, n - 1) }; // leftover powers inside
    const G = { [vs[0]]: rint(r, 1, 3), [vs[1]]: rint(r, 0, 2) };          // final outside powers
    const nTerms = tier === 1 ? 3 : tier === 2 ? pick(r, [3, 4]) : 4;
    const terms = [];
    for (let i = 0; i < nTerms; i++) {
      const s = pick(r, n === 2 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3]);
      const t = {}, g = {};
      for (const v of vs) { t[v] = rint(r, 0, G[v]); g[v] = G[v] - t[v]; }     // t pulled out of the radical, g already outside
      let c = rint(r, 1, tier === 1 ? 5 : 7) * (i > 0 && r() < 0.45 ? -1 : 1);
      if (i > 0 && r() < 0.25) c *= 1; // keep
      const inside = { [vs[0]]: n * t[vs[0]] + u[vs[0]], [vs[1]]: n * t[vs[1]] + u[vs[1]] };
      terms.push({ c, s, g, inside, radNum: ipow(s, n) * rad, frac: tier >= 2 && n === 2 && i === nTerms - 1 && r() < 0.6 });
    }
    const K = terms.reduce((acc, t) => acc + t.c * t.s, 0);
    if (K === 0 || Math.abs(K) === terms[0].c * terms[0].s) throw new Error("trivial");
    const outTeX = (g) => vs.map((v) => (g[v] ? varTeX(v, F(g[v])) : "")).join("");
    const inTeX = (num, ins) => `${num}${vs.map((v) => (ins[v] ? varTeX(v, F(ins[v])) : "")).join("")}`;
    const termTeX = (t, i) => {
      const sign = t.c < 0 ? "-" : i ? "+" : "";
      const coef = Math.abs(t.c) === 1 && (outTeX(t.g) || true) ? (Math.abs(t.c) === 1 ? "" : String(Math.abs(t.c))) : String(Math.abs(t.c));
      if (t.frac) return `${sign}${coef}${outTeX(t.g)}\\left(${inTeX(t.radNum, t.inside)}\\right)^{\\frac{1}{2}}`;
      return `${sign}${coef}${outTeX(t.g)}${texRoot(n, inTeX(t.radNum, t.inside))}`;
    };
    const exprTeX = terms.map(termTeX).join("");
    const resRad = inTeX(rad, u);
    const ansTeX = (k, Gx) => `${k === 1 ? "" : k === -1 ? "-" : k}${outTeX(Gx)}${texRoot(n, resRad)}`;
    // float check (positive variables)
    const fl = (s) => terms.reduce((acc, t) => acc + t.c * vs.reduce((p, v) => p * Math.pow(s[v], t.g[v]), 1) * Math.pow(t.radNum * vs.reduce((p, v) => p * Math.pow(s[v], t.inside[v]), 1), 1 / n), 0);
    const av = (k, Gx) => (s) => k * vs.reduce((p, v) => p * Math.pow(s[v], Gx[v]), 1) * Math.pow(rad * vs.reduce((p, v) => p * Math.pow(s[v], u[v]), 1), 1 / n);
    for (const s of SAMPLES) if (!close(fl(s), av(K, G)(s))) throw new Error("radvars mismatch");
    const sol = [R`Simplify each radical: take out the largest perfect ${n === 2 ? "square" : "cube"} from the number and every variable power (variables are positive).`,
      ...terms.map((t) => `\\(${termTeX({ ...t, c: Math.abs(t.c) }, 0)} = ${Math.abs(t.c) * t.s === 1 ? "" : Math.abs(t.c) * t.s}${outTeX(G)}${texRoot(n, resRad)}\\)`),
      R`Every term now has the same radical \(${texRoot(n, resRad)}\) and the same outside variables, so add the coefficients: \(${terms.map((t) => t.c * t.s).join(" + ").replace(/\+ -/g, "- ")} = ${K}\).`,
      R`Answer: \(${ansTeX(K, G)}\).`];
    const concepts = ["radicals.simplify", "radicals.add_subtract", ...(tier >= 2 ? ["exponents.rational"] : [])];
    const q = R`Simplify fully. ${ASSUME}\[${exprTeX}\]`;
    if (kind === "nr") return { kind, q: { topic: T().ops, concepts, fmt: "Integer", q: R`The expression simplifies to \(k\,${outTeX(G)}${texRoot(n, resRad)}\). ${ASSUME} Find \(k\).\[${exprTeX}\]`, answer: K, e: sol.join("<br>") } };
    const Kbad = terms.reduce((acc, t) => acc + t.c, 0);
    const Ksign = terms.reduce((acc, t, i) => acc + (i === 1 ? -t.c : t.c) * t.s, 0);
    const Gbad = { ...G, [vs[0]]: G[vs[0]] + 1 };
    const cands = [
      { k: Kbad, G, why: "This adds the original coefficients without multiplying each by the root that came out of its radical." },
      { k: Ksign, G, why: "A sign slipped on one of the terms when they were combined." },
      { k: K, G: Gbad, why: `This takes too much of \\(${vs[0]}\\) out of the radical. Taking the ${n === 2 ? "square" : "cube"} root divides the exponent by ${n}.` },
      { k: K + (K > 0 ? 1 : -1), G, why: "Close, but one of the radicals wasn't simplified completely before combining." },
    ];
    const seen = new Set([`${K}|${JSON.stringify(G)}`]); const ds = [];
    for (const c of cands) { const key = `${c.k}|${JSON.stringify(c.G)}`; if (c.k !== 0 && !seen.has(key)) { seen.add(key); ds.push(c); } if (ds.length === 3) break; }
    if (ds.length < 3) throw new Error("distractors");
    return { kind: "mc", q: { topic: T().ops, concepts, q, c: [`\\(${ansTeX(K, G)}\\)`, ...ds.map((d) => `\\(${ansTeX(d.k, d.G)}\\)`)], why: [null, ...ds.map((d) => d.why)], e: sol.join("<br>") } };
  }

  // ── nested radicals with variables → one rational exponent (MC) ─────────
  function tplNested(r, tier) {
    const vs = tier === 1 ? ["x"] : ["a", "b"];
    const outer = pick(r, tier === 1 ? [2, 3] : [3, 4, 2]), inner = pick(r, [2, 3].filter((x) => tier > 1 || x !== outer || true));
    const A = {}, B = {};
    for (const v of vs) { A[v] = rint(r, tier === 1 ? 1 : -2, 5) || 2; B[v] = rint(r, 1, 5); }
    // ⁿ√( v^A · ᵐ√(v^B) ) = v^((A + B/m)/n)
    const ex = {}; for (const v of vs) ex[v] = fdiv(fadd(F(A[v]), F(B[v], inner)), F(outer));
    const ans = M(F(1), ex);
    if (vars(ans).length < vs.length || vars(ans).every((v) => fint(ans.e[v]))) throw new Error("too tidy");
    const fl = (s) => Math.pow(vs.reduce((p, v) => p * Math.pow(s[v], A[v]), 1) * Math.pow(vs.reduce((p, v) => p * Math.pow(s[v], B[v]), 1), 1 / inner), 1 / outer);
    verifyMono(ans, fl);
    const insideTeX = vs.map((v) => varTeX(v, F(A[v]))).join("") + texRoot(inner, vs.map((v) => varTeX(v, F(B[v]))).join(""));
    const exprTeX = texRoot(outer, insideTeX);
    const asPow = (m) => vars(m).map((v) => varTeX(v, m.e[v])).join("");
    const wrong = [
      { m: M(F(1), Object.fromEntries(vs.map((v) => [v, fdiv(fmul(F(A[v]), F(B[v], inner)), F(outer))]))), why: "This multiplies the exponents of the two layers together. Inside the outer root they're multiplied as powers of the same base, so the exponents add first." },
      { m: M(F(1), Object.fromEntries(vs.map((v) => [v, fadd(F(A[v], outer), F(B[v], inner))]))), why: "This forgets that the inner radical sits under the outer one too, so its exponent must also be divided by the outer index." },
      { m: M(F(1), Object.fromEntries(vs.map((v) => [v, fmul(fadd(F(A[v]), F(B[v], inner)), F(outer))]))), why: "This multiplies by the outer index instead of dividing. An nth root means the exponent 1/n." },
    ];
    distinctMonos([ans, ...wrong.map((w) => w.m)]);
    const sol = [R`Rewrite radicals as rational exponents, working from the inside out: an \(n\)th root is the power \(\frac{1}{n}\), and the outer root applies to everything inside it.`,
      ...vs.map((v) => R`For \(${v}\): \(\left(${v}^{${A[v]}}\cdot ${v}^${tExp(F(B[v], inner))}\right)^{\frac{1}{${outer}}} = ${v}^{\left(${A[v]} + ${tFrac(F(B[v], inner))}\right)\cdot\frac{1}{${outer}}} = ${varTeX(v, ans.e[v])}\)`),
      R`Answer: \(${asPow(ans)}\).`];
    return { kind: "mc", q: { topic: T().exp, concepts: ["exponents.rational", "radicals.simplify"], q: R`Write as a single power of each variable (rational exponents). ${ASSUME}\[${exprTeX}\]`,
      c: [`\\(${asPow(ans)}\\)`, ...wrong.map((w) => `\\(${asPow(w.m)}\\)`)], why: [null, ...wrong.map((w) => w.why)], e: sol.join("<br>") } };
  }

  // ── numeric building blocks for typed answers ─────────
  const SQF2 = [2, 3, 5, 6, 7, 10, 11];
  // Σ c_i √(s_i² · m) combining to K√m (+ maybe a second family)
  function radSum(r, tier) {
    const m = pick(r, SQF2);
    const nT = tier === 1 ? 3 : 4;
    const ts = [];
    for (let i = 0; i < nT; i++) {
      const s = pick(r, [1, 2, 3, 4, 5, 6, 8, 9, 10, 12].filter((x) => x * x * m <= (tier === 3 ? 1500 : 800) && !ts.some((t) => t.s === x)));
      const c = rint(r, 1, tier === 1 ? 4 : 6) * (i > 0 && r() < 0.45 ? -1 : 1);
      ts.push({ c, s, v: s * s * m });
    }
    if (tier >= 2) { const j = rint(r, 1, nT - 1); ts[j].other = true; }
    const m2 = pick(r, SQF2.filter((x) => x !== m && x * m !== 1));
    for (const t of ts) if (t.other) { t.v = t.s * t.s * m2; }
    const sum = RS(ts.map((t) => ({ c: F(t.c), n: 2, r: t.v })));
    if (rsTerms(sum).length === 0 || rsTerms(sum).some((t) => Math.abs(t.c.n) > 200)) throw new Error("bad sum");
    const tex = ts.map((t, i) => `${t.c < 0 ? "-" : i ? "+" : ""}${Math.abs(t.c) === 1 ? "" : Math.abs(t.c)}\\sqrt{${t.v}}`).join("");
    const fl = ts.reduce((a, t) => a + t.c * Math.sqrt(t.v), 0);
    const steps = ts.map((t) => { const [k, rr] = rootSimplify(2, t.v); return `\\(${Math.abs(t.c) === 1 ? "" : Math.abs(t.c)}\\sqrt{${t.v}} = ${Math.abs(t.c) === 1 ? "" : Math.abs(t.c) + "\\cdot "}${k}\\sqrt{${rr}} = ${Math.abs(t.c) * k}\\sqrt{${rr}}\\)`; });
    return { sum, tex, fl, steps };
  }
  // a rational power product that evaluates exactly, e.g. 27^{2/3} · (16/81)^{-3/4}
  function ratPower(r, tier) {
    const opts = [[8, 3], [27, 3], [64, 3], [125, 3], [16, 4], [81, 4], [32, 5], [4, 2], [9, 2], [25, 2], [36, 2], [49, 2]];
    const nF = tier === 1 ? 2 : 3;
    const fs = [];
    for (let i = 0; i < nF; i++) {
      const [b, q] = pick(r, opts);
      const frac = tier >= 2 && r() < 0.5;
      const same = opts.filter((o) => o[1] === q && o[0] !== b);
      const den = frac && same.length ? pick(r, same)[0] : 1;
      let p = pick(r, [1, 2, 3, -1, -2, -3].filter((x) => x % q !== 0));
      if (q === 5 && Math.abs(p) > 2) p = Math.sign(p);
      fs.push({ base: F(b, den), e: F(p, q) });
    }
    let v = F(1);
    for (const f of fs) v = fmul(v, fpow(f.base, f.e));
    if (Math.abs(v.n) > 5000 || v.d > 5000 || (v.n === 1 && v.d === 1)) throw new Error("ugly");
    const tex = fs.map((f) => `\\left(${tFrac(f.base)}\\right)^${tExp(f.e)}`).join("\\cdot ");
    const fl = fs.reduce((a, f) => a * Math.pow(fval(f.base), fval(f.e)), 1);
    if (!close(fl, fval(v))) throw new Error("ratpow mismatch");
    const steps = fs.map((f) => `\\(\\left(${tFrac(f.base)}\\right)^${tExp(f.e)} = ${tFrac(fpow(f.base, f.e))}\\)`);
    return { v, tex, fl, steps };
  }
  // a denominator of two square-root terms (or integer ± one root)
  function binomDen(r, tier, avoid = []) {
    const ps = shuffle(r, SQF2.filter((x) => !avoid.includes(x)));
    const p = ps[0], q = ps[1];
    const a = tier === 1 ? 1 : rint(r, 1, 3), b = tier === 1 ? 1 : rint(r, 1, 3);
    const sign = r() < 0.55 ? -1 : 1;
    const intForm = r() < (tier === 1 ? 0.5 : 0.25);
    const den = intForm ? RS([{ c: F(rint(r, 2, 6)), n: 1, r: 1 }, { c: F(sign * b), n: 2, r: q }]) : RS([{ c: F(a), n: 2, r: p }, { c: F(sign * b), n: 2, r: q }]);
    const dv = rsMul(den, rsConj(den));
    if (!rsIsRational(dv) || rsRational(dv).n === 0) throw new Error("bad den");
    return den;
  }
  function rationalize(num, den) {
    const conj = rsConj(den);
    const top = rsMul(num, conj), bottom = rsRational(rsMul(den, conj));
    return { conj, top, bottom, res: rsScale(top, fdiv(F(1), bottom)) };
  }

  // ── WR Q1 (4 marks): two big simplifications ─────────
  function nestedNumeric(r, tier) {
    // √( c · √(s² r) ) = √(c s √r) = k ∜r   with c·s = k²   (and in tier 3, plus/minus a like term ∜(k2⁴ r))
    const rr = pick(r, [2, 3, 5, 6, 7, 10, 12, 15]);
    const k = pick(r, [2, 3, 4, 5, 6]);
    const s = pick(r, [2, 3, 4, 6].filter((x) => (k * k) % x === 0 && k * k / x > 1));
    if (!s) throw new Error("no s");
    const c = (k * k) / s;
    const parts = [{ c: 1, tex: `\\sqrt{${c}\\sqrt{${s * s * rr}}}`, val: k, fl: Math.sqrt(c * Math.sqrt(s * s * rr)) }];
    if (tier === 3) { const k2 = pick(r, [1, 2, 3]); const sg = r() < 0.5 ? -1 : 1; parts.push({ c: sg, tex: `\\sqrt[4]{${ipow(k2, 4) * rr}}`, val: k2, fl: sg * Math.pow(ipow(k2, 4) * rr, 0.25) }); }
    const K = parts.reduce((a, p) => a + p.c * p.val, 0);
    if (K === 0) throw new Error("zero");
    const ans = RS([{ c: F(K), n: 4, r: rr }]);
    const fmt = rsFormat(ans);
    const fl = parts.reduce((a, p) => a + (p.c === 1 ? p.fl : p.fl), 0);
    verifyTyped(fmt.str, "simplest", fl);
    const tex = parts.map((p, i) => (i ? (p.c < 0 ? "-" : "+") : "") + p.tex).join("");
    return { tex, fmt, steps: [R`Inner radical first: \(\sqrt{${s * s * rr}} = ${s}\sqrt{${rr}}\), so \(\sqrt{${c}\cdot ${s}\sqrt{${rr}}} = \sqrt{${c * s}\sqrt{${rr}}}\).`, R`\(\sqrt{${c * s}\sqrt{${rr}}} = \sqrt{\sqrt{${c * s * c * s * rr}}} = \sqrt[4]{${c * s * c * s * rr}} = ${k}\sqrt[4]{${rr}}\)`, ...(tier === 3 ? [R`\(\sqrt[4]{${ipow(parts[1].val, 4) * rr}} = ${parts[1].val}\sqrt[4]{${rr}}\); combine the like fourth roots.`] : []), R`Answer: \(${fmt.tex}\)`] };
  }
  function wrQ1(r, tier) {
    const a = radSum(r, tier);
    const fa = rsFormat(a.sum); verifyTyped(fa.str, "simplest", a.fl);
    const partA = { key: "a", label: "(a)", prompt: R`Simplify fully: \(${a.tex}\)`, kind: "expr", answer: fa.str, ansTex: fa.tex, form: "simplest", marks: 2 };
    let partB, solB;
    if (tier === 1) {
      // cube roots with negatives
      const m = pick(r, [2, 3, 4, 5, 6]); const ks = [pick(r, [2, 3, 4]), pick(r, [2, 3, 5])];
      const cs = [rint(r, 1, 4), -rint(r, 1, 4)];
      const vs = ks.map((k, i) => (i === 1 && r() < 0.5 ? -1 : 1) * ipow(k, 3) * m);
      const sum = RS(vs.map((v, i) => ({ c: F(cs[i]), n: 3, r: v })));
      if (!rsTerms(sum).length) throw new Error("zero");
      const f = rsFormat(sum), fl = vs.reduce((acc, v, i) => acc + cs[i] * Math.cbrt(v), 0);
      verifyTyped(f.str, "simplest", fl);
      const tex = vs.map((v, i) => `${cs[i] < 0 ? "-" : i ? "+" : ""}${Math.abs(cs[i]) === 1 ? "" : Math.abs(cs[i])}\\sqrt[3]{${v}}`).join("");
      partB = { key: "b", label: "(b)", prompt: R`Simplify fully: \(${tex}\)`, kind: "expr", answer: f.str, ansTex: f.tex, form: "simplest", marks: 2 };
      solB = [R`<b>(b)</b> Take out perfect cubes (cube roots of negatives are fine): ${vs.map((v, i) => { const [k, rr] = rootSimplify(3, v); return `\\(\\sqrt[3]{${v}} = ${k}\\sqrt[3]{${rr}}\\)`; }).join(", ")}. Then combine: \\(${f.tex}\\).`];
    } else {
      const nn = nestedNumeric(r, tier);
      partB = { key: "b", label: "(b)", prompt: R`Simplify fully (simplest radical form): \(${nn.tex}\)`, kind: "expr", answer: nn.fmt.str, ansTex: nn.fmt.tex, form: "simplest", marks: 2 };
      solB = [R`<b>(b)</b> ` + nn.steps.join(" ")];
    }
    return { kind: "wr", q: { slot: 1, topic: T().simp, title: tier === 1 ? "Radical gauntlet" : "The Nested Abyss", concepts: ["radicals.simplify", "radicals.add_subtract", "radicals.mixed_entire"],
      intro: "Simplify each expression completely. Answers must be in simplest radical form.", parts: [partA, partB],
      rubric: ["(a) Every radical simplified correctly — 1 mark; like radicals combined to the right answer — 1 mark", "(b) Correct method — 1 mark; correct answer in simplest form — 1 mark", "Equal values that aren't fully simplified lose a mark."],
      solution: [R`<b>(a)</b> ` + a.steps.join(", ") + R`. Combine like radicals: \(${fa.tex}\).`, ...solB] } };
  }

  // ── WR Q2 (5 marks): the Conjugate Chamber — three rationalizations ─────────
  function wrQ2(r, tier) {
    const parts = [], sol = [];
    // (a) single radical denominator: tier 1 square root, tiers 2–3 cube root
    {
      const cube = tier >= 2;
      const rr = cube ? pick(r, [2, 3, 4, 5, 6, 9, 12]) : pick(r, [2, 3, 5, 6, 7, 10]);
      const k = pick(r, [2, 3, 4, 5]); const num = pick(r, [6, 8, 9, 10, 12, 14, 15, 18, 20, 21]);
      const den = RS([{ c: F(k), n: cube ? 3 : 2, r: rr }]);
      const mult = cube ? (() => { const [, cf] = rootSimplify(3, rr); return RS([{ c: F(1), n: 3, r: cf * cf }]); })() : RS([{ c: F(1), n: 2, r: rr }]);
      const dv = rsMul(den, mult);
      if (!rsIsRational(dv)) throw new Error("not rational");
      const res = rsScale(rsMul(RS([{ c: F(num), n: 1, r: 1 }]), mult), fdiv(F(1), rsRational(dv)));
      const f = rsFormat(res); verifyTyped(f.str, "rationalized", num / (k * Math.pow(rr, 1 / (cube ? 3 : 2))));
      parts.push({ key: "a", label: "(a)", prompt: R`\(\dfrac{${num}}{${k}${texRoot(cube ? 3 : 2, rr)}}\)`, kind: "expr", answer: f.str, ansTex: f.tex, form: "rationalized", marks: 1 });
      sol.push(R`<b>(a)</b> Multiply top and bottom by \(${cube ? texRoot(3, rootSimplify(3, rr)[1] ** 2) : texRoot(2, rr)}\) to make the denominator a perfect ${cube ? "cube" : "square"}: denominator \(= ${tFrac(rsRational(dv))}\). Reduce: \(${f.tex}\).`);
    }
    // (b) binomial denominator, simple numerator
    {
      const den = binomDen(r, tier);
      const num = tier === 1 ? RS([{ c: F(pick(r, [4, 6, 8, 10, 12])), n: 1, r: 1 }]) : RS([{ c: F(pick(r, [2, 3, 4, 6])), n: 2, r: pick(r, [2, 3, 5]) }]);
      const z = rationalize(num, den); const f = rsFormat(z.res);
      if (rsTerms(z.res).length < 2) throw new Error("too tidy");
      verifyTyped(f.str, "rationalized", rsVal(num) / rsVal(den));
      parts.push({ key: "b", label: "(b)", prompt: R`\(\dfrac{${rsFormat(num).tex}}{${rsFormat(den).tex}}\)`, kind: "expr", answer: f.str, ansTex: f.tex, form: "rationalized", marks: 2 });
      sol.push(R`<b>(b)</b> Multiply by the conjugate \(\dfrac{${rsFormat(z.conj).tex}}{${rsFormat(z.conj).tex}}\). The denominator becomes \(${tFrac(z.bottom)}\) (difference of squares). Numerator: \(${rsFormat(z.top).tex}\). Simplify and reduce: \(${f.tex}\).`);
    }
    // (c) numerator that must be simplified first, then rationalized
    {
      let numRS, numTex, numSteps, numFl;
      if (tier === 3) {
        const rp = ratPower(r, 2), m = pick(r, [2, 3, 5]), s = pick(r, [2, 3, 4, 6]);
        numRS = RS([{ c: rp.v, n: 2, r: s * s * m }]); numTex = `${rp.tex}\\cdot\\sqrt{${s * s * m}}`; numFl = rp.fl * Math.sqrt(s * s * m);
        numSteps = [...rp.steps, R`\(\sqrt{${s * s * m}} = ${s}\sqrt{${m}}\)`];
      } else {
        const A = pick(r, [6, 10, 14, 15, 21]), B = pick(r, [2, 3, 6, 10, 12]), C2 = pick(r, [2, 3, 5]);
        numRS = rsScale(rsMul(RS([{ c: F(1), n: 2, r: A }]), RS([{ c: F(1), n: 2, r: B }])), F(1));
        numTex = `\\sqrt{${A}}\\cdot\\sqrt{${B}}`; numFl = Math.sqrt(A * B);
        if (tier === 2 && C2 && r() < 0.5) { numRS = rsAdd(numRS, RS([{ c: F(1), n: 2, r: C2 * C2 * rootSimplify(2, A * B)[1] }])); numTex += `+\\sqrt{${C2 * C2 * rootSimplify(2, A * B)[1]}}`; numFl += Math.sqrt(C2 * C2 * rootSimplify(2, A * B)[1]); }
        numSteps = [R`\(\sqrt{${A}}\cdot\sqrt{${B}} = \sqrt{${A * B}} = ${rsFormat(RS([{ c: F(1), n: 2, r: A * B }])).tex}\)`];
      }
      if (!close(rsVal(numRS), numFl)) throw new Error("num mismatch");
      const den = binomDen(r, Math.max(2, tier), rsTerms(numRS).map((t) => t.r));
      const z = rationalize(numRS, den); const f = rsFormat(z.res);
      if (rsTerms(z.res).length < 2) throw new Error("too tidy");
      verifyTyped(f.str, "rationalized", numFl / rsVal(den));
      parts.push({ key: "c", label: "(c)", prompt: R`\(\dfrac{${numTex}}{${rsFormat(den).tex}}\)`, kind: "expr", answer: f.str, ansTex: f.tex, form: "rationalized", marks: 2 });
      sol.push(R`<b>(c)</b> Simplify the numerator first: ${numSteps.join(", ")}, so the numerator is \(${rsFormat(numRS).tex}\). Then multiply by the conjugate \(${rsFormat(z.conj).tex}\): the denominator becomes \(${tFrac(z.bottom)}\) and the numerator \(${rsFormat(z.top).tex}\). Final: \(${f.tex}\).`);
    }
    return { kind: "wr", q: { slot: 2, topic: T().div, title: "The Conjugate Chamber", concepts: ["radicals.rationalize", "radicals.conjugates", "radicals.multiply"],
      intro: "Rationalize each denominator. Answers must be fully simplified with a rational denominator.", parts,
      rubric: ["(a) Correct multiplier and simplified answer — 1 mark", "(b) Correct conjugate and rational denominator — 1 mark; fully simplified — 1 mark", "(c) Numerator simplified and conjugate used — 1 mark; fully simplified final answer — 1 mark", "A radical left in a denominator earns 0 for that part."],
      solution: sol } };
  }

  // ── WR Q3/Q4: radical equations with exact checks ─────────
  function radEqA(r, tier) {
    // a√(px+q) = x − s ; squared: x² − (2s + a²p)x + s² − a²q = 0 with chosen integer roots
    for (let tries = 0; tries < 50; tries++) {
      const a = tier === 1 ? 1 : pick(r, [1, 2, 3]);
      const s = rint(r, -4, 6), r1 = rint(r, -6, 12), r2 = rint(r, -6, 12);
      if (r1 === r2) continue;
      const a2p = r1 + r2 - 2 * s; if (a2p <= 0 || a2p % (a * a)) continue;
      const p = a2p / (a * a);
      const qn = s * s - r1 * r2; if (qn % (a * a)) continue;
      const q = qn / (a * a);
      if ((r1 - s) % a || (r2 - s) % a) continue;
      const check = (x) => { const inside = p * x + q; if (inside < 0) return false; const rt = iroot(inside, 2); if (rt === null) return false; return a * rt === x - s; };
      const sols = [r1, r2].filter(check), ext = [r1, r2].filter((x) => !check(x));
      if (!sols.length) continue;
      const lhs = `${a === 1 ? "" : a}\\sqrt{${p === 1 ? "" : p}x${q ? (q > 0 ? "+" : "-") + Math.abs(q) : ""}}`;
      const rhs = `x${s ? (s > 0 ? "-" : "+") + Math.abs(s) : ""}`;
      return { eq: `${lhs} = ${rhs}`, cands: [r1, r2].sort((x, y) => x - y), sols, ext, steps: [
        R`Square both sides: \(${a * a === 1 ? "" : a * a}\left(${p === 1 ? "" : p}x${q ? (q > 0 ? "+" : "-") + Math.abs(q) : ""}\right) = \left(${rhs}\right)^2\)`,
        R`Rearrange: \(${quadTeX(-(2 * s + a * a * p), s * s - a * a * q)} = 0\), which factors as \(${linTeX(r1)}${linTeX(r2)} = 0\), so \(x = ${r1}\) or \(x = ${r2}\).`,
        ...[r1, r2].map((x) => R`Check \(x = ${x}\): left side \(= ${a === 1 ? "" : a + "\\cdot"}\sqrt{${p * x + q}}${p * x + q >= 0 && iroot(p * x + q, 2) !== null ? " = " + a * iroot(p * x + q, 2) : ""}\), right side \(= ${x - s}\). ${check(x) ? "✓ valid" : "✗ extraneous"}`),
      ] };
    }
    throw new Error("no equation");
  }
  function radEqB(r) {
    // √(x+a) + √(x+b) = c, built from u, v with u + v = c
    for (let tries = 0; tries < 50; tries++) {
      const u = rint(r, 3, 9), v = rint(r, 1, u - 1), x = rint(r, -6, 15);
      const a = u * u - x, b = v * v - x; if (a === b) continue;
      const c = u + v;
      const sgn = (n) => (n >= 0 ? `+${n}` : `-${-n}`);
      // independent check of the solution and uniqueness (squaring twice gives one linear equation)
      const lhs = (t) => Math.sqrt(t + a) + Math.sqrt(t + b);
      if (!close(lhs(x), c)) continue;
      return { eq: `\\sqrt{x${sgn(a)}} + \\sqrt{x${sgn(b)}} = ${c}`, sols: [x], steps: [
        R`Isolate one radical: \(\sqrt{x${sgn(a)}} = ${c} - \sqrt{x${sgn(b)}}\). Square: \(x${sgn(a)} = ${c * c} - ${2 * c}\sqrt{x${sgn(b)}} + x${sgn(b)}\).`,
        R`Simplify: \(${2 * c}\sqrt{x${sgn(b)}} = ${c * c + b - a}\), so \(\sqrt{x${sgn(b)}} = ${(c * c + b - a) / (2 * c)}\).`,
        R`Square again: \(x${sgn(b)} = ${v * v}\), so \(x = ${x}\).`,
        R`Check: \(\sqrt{${x + a}} + \sqrt{${x + b}} = ${u} + ${v} = ${c}\) ✓`,
      ] };
    }
    throw new Error("no equation B");
  }
  function wrQ3(r, tier) {
    if (tier >= 2) {
      const e = radEqB(r);
      return { kind: "wr", q: { slot: 3, topic: T().eq, title: "Double radical equation", concepts: ["radicals.equations"], intro: R`Solve algebraically: \(${e.eq}\)`,
        parts: [{ key: "a", label: "", prompt: "Solution(s):", kind: "set", answer: e.sols.map(String), mode: "final", marks: 2 }],
        rubric: ["Isolated a radical and squared twice correctly — 1 mark", "Correct solution, checked — 1 mark"], solution: e.steps } };
    }
    const e = radEqA(r, tier);
    return { kind: "wr", q: { slot: 3, topic: T().eq, title: "Solve the radical equation", concepts: ["radicals.equations"], intro: R`Solve algebraically: \(${e.eq}\)`,
      parts: [{ key: "a", label: "", prompt: "Solution(s):", kind: "set", answer: e.sols.map(String), mode: "final", marks: 2 }],
      rubric: ["Squared both sides and solved the quadratic — 1 mark", "Correct solution(s) after checking — 1 mark", "Keeping an extraneous value costs 1 mark."], solution: e.steps } };
  }
  function wrQ4(r, tier) {
    let e;
    for (let i = 0; i < 30; i++) { e = radEqA(r, tier + 1); if (e.ext.length) break; }
    if (!e.ext.length) throw new Error("no extraneous");
    return { kind: "wr", q: { slot: 4, topic: T().eq, title: "Extraneous roots", concepts: ["radicals.equations", "radicals.restrictions"], intro: R`Solve \(${e.eq}\). Show your check for extraneous roots.`,
      parts: [
        { key: "a", label: "(a)", prompt: "After squaring and solving, list <b>every</b> value you get (before checking).", kind: "set", answer: e.cands.map(String), mode: "candidates", marks: 1 },
        { key: "b", label: "(b)", prompt: "After checking, what are the <b>solution(s)</b>?", kind: "set", answer: e.sols.map(String), mode: "final", marks: 1 },
        { key: "c", label: "(c)", prompt: "Which value(s) are <b>extraneous</b>? Type <i>none</i> if there aren't any.", kind: "set", answer: e.ext.map(String), mode: "extraneous", marks: 1 },
      ],
      rubric: ["(a) Squared correctly and found both candidates — 1 mark", "(b) Correct solution(s) after verifying — 1 mark", "(c) Correctly identified the extraneous root — 1 mark"], solution: e.steps } };
  }

  // ── WR Q5 (5 marks): multi-stage boss — the answers to (a) and (b) feed (c) ─────────
  function wrQ5(r, tier) {
    const A = ratPower(r, tier === 1 ? 1 : 2);
    if (!fint(A.v) && tier === 1) throw new Error("tier1 wants integer");
    const B = radSum(r, 1); // one radical family
    if (rsTerms(B.sum).length !== 1) throw new Error("B not single");
    const fB = rsFormat(B.sum); verifyTyped(fB.str, "simplest", B.fl);
    const C = window.MathCheck;
    if (!C) throw new Error("checker");
    const prod = rsScale(B.sum, A.v);
    const den = tier === 1 ? RS([{ c: F(pick(r, [2, 3, 5])), n: 2, r: pick(r, [2, 3, 5, 7].filter((x) => x !== rsTerms(B.sum)[0].r)) }]) : binomDen(r, tier, [rsTerms(B.sum)[0].r]);
    let res, how;
    if (tier === 1) {
      const t = rsTerms(den)[0]; const mult = RS([{ c: F(1), n: 2, r: t.r }]);
      res = rsScale(rsMul(prod, mult), fdiv(F(1), fmul(t.c, F(t.r)))); how = R`multiply top and bottom by \(\sqrt{${t.r}}\)`;
    } else { const z = rationalize(prod, den); res = z.res; how = R`multiply by the conjugate \(${rsFormat(z.conj).tex}\); the denominator becomes \(${tFrac(z.bottom)}\)`; }
    const f = rsFormat(res);
    verifyTyped(f.str, "rationalized", A.fl * B.fl / rsVal(den));
    const aStr = fint(A.v) ? String(A.v.n) : `${A.v.n}/${A.v.d}`;
    if (C.grade({ kind: "number", answer: fval(A.v), marks: 1 }, aStr).verdict !== "right") throw new Error("A key");
    return { kind: "wr", q: { slot: 5, topic: T().div, title: tier === 3 ? "Boss fight: three stages" : "Multi-stage problem", concepts: ["exponents.rational", "radicals.add_subtract", "radicals.rationalize", "radicals.conjugates"],
      intro: R`Let \(P = ${A.tex}\) and \(Q = ${B.tex}\).`,
      parts: [
        { key: "a", label: "(a)", prompt: R`Evaluate \(P\) exactly (integer or fraction).`, kind: "number", answer: fval(A.v), ansTex: tFrac(A.v), ansText: aStr, marks: 1 },
        { key: "b", label: "(b)", prompt: R`Simplify \(Q\) fully.`, kind: "expr", answer: fB.str, ansTex: fB.tex, form: "simplest", marks: 2 },
        { key: "c", label: "(c)", prompt: R`Using your answers, write \(\dfrac{P\,Q}{${rsFormat(den).tex}}\) in simplest form with a rational denominator.`, kind: "expr", answer: f.str, ansTex: f.tex, form: "rationalized", marks: 2 },
      ],
      rubric: ["(a) Correct exact value — 1 mark", "(b) Radicals simplified — 1 mark; combined correctly — 1 mark", "(c) Correct product over the denominator — 1 mark; rationalized and fully simplified — 1 mark"],
      solution: [R`<b>(a)</b> ${A.steps.join(", ")}. Multiply: \(P = ${tFrac(A.v)}\).`, R`<b>(b)</b> ${B.steps.join(", ")}. Combine: \(Q = ${fB.tex}\).`, R`<b>(c)</b> \(PQ = ${rsFormat(prod).tex}\). To rationalize, ${how}. Simplify: \(${f.tex}\).`] } };
  }

  // ── Find the Fatal Error (MC): a worked chain with one injected mistake ─────────
  function tplFatal(r, tier) {
    const spec = buildExp(r, Math.min(tier, 2));
    const good = [];
    const f0 = spec.top[0], g0 = spec.bot[0];
    const L1 = mpow(f0.inner, f0.outer), L2 = mpow(g0.inner, g0.outer);
    const L3 = mdiv(spec.top.length > 1 ? mmul(L1, mpow(spec.top[1].inner, spec.top[1].outer)) : L1, L2);
    good.push(`${texFactor(f0)} = ${texRaw(L1)}`, `${texFactor(g0)} = ${texRaw(L2)}`, `\\text{Quotient} = ${texRaw(L3)}`, `= ${texPos(L3)}`);
    if (spec.top.length > 1) throw new Error("keep to one factor");
    const errLine = rint(r, 1, 3);
    const lines = good.slice();
    let why;
    if (errLine === 1) { const bad = M(f0.inner.c.n === 1 ? F(2) : f0.inner.c, L1.e); const B3 = mdiv(bad, L2); lines[0] = `${texFactor(f0)} = ${texRaw(bad)}`; lines[2] = `\\text{Quotient} = ${texRaw(B3)}`; lines[3] = `= ${texPos(B3)}`; why = R`Line 1 leaves the coefficient as \(${tFrac(f0.inner.c)}\). The outer exponent applies to the number too: \(${tFrac(f0.inner.c)}^${tExp(f0.outer)} = ${tFrac(L1.c)}\).`; if (feq(bad.c, L1.c)) throw new Error("no visible error"); }
    if (errLine === 2) { const bad = mpow(g0.inner, fneg(g0.outer)); const B3 = mdiv(L1, bad); lines[1] = `${texFactor(g0)} = ${texRaw(bad)}`; lines[2] = `\\text{Quotient} = ${texRaw(B3)}`; lines[3] = `= ${texPos(B3)}`; why = R`Line 2 drops the minus sign of the exponent \(${tFrac(g0.outer)}\). Raising to a negative power flips every exponent's sign and takes the reciprocal of the coefficient: it should be \(${texRaw(L2)}\).`; if (g0.outer.n > 0) throw new Error("need negative"); }
    if (errLine === 3) { const B3 = mmul(L1, L2); lines[2] = `\\text{Quotient} = ${texRaw(B3)}`; lines[3] = `= ${texPos(B3)}`; why = R`Line 3 adds the exponents of the denominator instead of subtracting them (and multiplies the coefficients instead of dividing). The quotient is \(${texRaw(L3)}\).`; }
    const work = `<div class="work">${lines.map((l, i) => `<span class="ln">Line ${i + 1}</span>\\(${l}\\)`).join("")}</div>`;
    const order = [errLine, ...[1, 2, 3, 4].filter((x) => x !== errLine)];
    return { kind: "mc", q: { topic: T().err, concepts: ["exponents.laws", "exponents.negative", "exponents.rational"],
      q: R`A student simplified the expression below (all variables positive).\[${texExpQ(spec)}\]${work}In which line is the <b>first</b> error?`,
      c: order.map((x) => `Line ${x}`), order: [1, 2, 3, 4].map((x) => order.indexOf(x)), why: [null, ...order.slice(1).map((x) => (x === 4 ? "Line 4 only rewrites the previous line with positive exponents. The mistake happened earlier." : x > errLine ? "This line follows correctly from the line before it. The error is earlier." : "This line is correct."))],
      e: why + R` The correct simplification is \(${texPos(L3)}\).` } };
  }

  // ── rationalization MC (numbers) ─────────
  function tplRatMC(r, tier) {
    const num = tier === 1 ? RS([{ c: F(pick(r, [6, 8, 10, 12, 14])), n: 1, r: 1 }]) : RS([{ c: F(pick(r, [2, 3, 4])), n: 2, r: pick(r, [2, 3, 5]) }]);
    const den = binomDen(r, tier + 1, rsTerms(num).map((t) => t.r));
    const z = rationalize(num, den); const ok = rsFormat(z.res);
    verifyTyped(ok.str, "rationalized", rsVal(num) / rsVal(den));
    const dt = rsTerms(den);
    // wrong: denominator added instead of subtracted; numerator used the same sign (not the conjugate); forgot to square the coefficient
    const bAdd = F(dt.reduce((s, t) => s + (t.r === 1 ? fval(t.c) ** 2 : fval(t.c) ** 2 * t.r), 0));
    const wrongs = [];
    try { wrongs.push({ v: rsScale(z.top, fdiv(F(1), bAdd)), why: "The denominator should be a difference of squares, not a sum." }); } catch { /* skip */ }
    try { const sameSign = rsScale(rsMul(num, den), fdiv(F(1), z.bottom)); wrongs.push({ v: sameSign, why: "This multiplies by the denominator itself rather than its conjugate (only the middle sign flips)." }); } catch { /* skip */ }
    try { const bNoSq = F(dt.reduce((s, t, i) => s + (i ? -1 : 1) * (t.r === 1 ? fval(t.c) ** 2 : Math.abs(fval(t.c)) * t.r), 0)); if (bNoSq.n) wrongs.push({ v: rsScale(z.top, fdiv(F(1), bNoSq)), why: "When squaring a term like \\(a\\sqrt{b}\\), square the coefficient too: \\((a\\sqrt{b})^2 = a^2 b\\)." }); } catch { /* skip */ }
    try { wrongs.push({ v: rsScale(z.top, fdiv(F(1), fneg(z.bottom))), why: "A sign error in the denominator: check which term is subtracted in the difference of squares." }); } catch { /* skip */ }
    const okv = rsVal(z.res); const used = [okv]; const ds = [];
    for (const w of wrongs) { const v = rsVal(w.v); if (rsTerms(w.v).length && used.every((u) => !close(u, v))) { used.push(v); ds.push(w); } if (ds.length === 3) break; }
    if (ds.length < 3) throw new Error("distractors");
    return { kind: "mc", q: { topic: T().div, concepts: ["radicals.rationalize", "radicals.conjugates"], q: R`Rationalize the denominator and simplify:\[\dfrac{${rsFormat(num).tex}}{${rsFormat(den).tex}}\]`,
      c: [`\\(${ok.tex}\\)`, ...ds.map((d) => `\\(${rsFormat(d.v).tex}\\)`)], why: [null, ...ds.map((d) => d.why)],
      e: R`Multiply by the conjugate \(\dfrac{${rsFormat(z.conj).tex}}{${rsFormat(z.conj).tex}}\). Denominator: \(${tFrac(z.bottom)}\) (difference of squares, with coefficients squared). Numerator: \(${rsFormat(z.top).tex}\). Divide and simplify: \(${ok.tex}\).` } };
  }

  // ── NR: exact rational power product ─────────
  function tplRatPowNR(r, tier) {
    const A = ratPower(r, tier);
    if (!fint(A.v) || Math.abs(A.v.n) > 999) throw new Error("NR wants a modest integer");
    return { kind: "nr", q: { topic: T().exp, concepts: ["exponents.rational", "exponents.negative"], fmt: "Integer", q: R`Evaluate exactly:\[${A.tex}\]`, answer: A.v.n, e: A.steps.join(", ") + R`. Multiply: \(${A.v.n}\).` } };
  }

  // ════════════════ test assembly ════════════════
  const TIERS = {
    1: { name: "Nightmare I", label: "Brutal", key: "nightmare1", desc: "Dense algebra, awkward coefficients, negative and fractional exponents, and radicals that take several steps to simplify.", skills: "Exponent laws · big radicands · like radicals · single and binomial rationalizing · radical equations" },
    2: { name: "Nightmare II", label: "Extreme", key: "nightmare2", desc: "Interlocking exponent laws, nested radicals, conjugates with coefficients, cube-root denominators and double-radical equations.", skills: "Rational & negative exponents · nested radicals → ∜ · conjugates · cube-root rationalizing · error analysis" },
    3: { name: "Nightmare III", label: "Catastrophic", key: "nightmare3", desc: "Multi-layer monsters: products of rational powers, nested radicals, numerators to simplify before an ugly conjugate, and multi-stage boss questions.", skills: "Everything above, chained · boss questions where (a) and (b) feed (c) · find the fatal error" },
  };
  const TEMPLATES = {
    exp: (r, t, k) => tplExp(r, t, k), rad: (r, t, k) => tplRadVars(r, t, k), nest: (r, t) => tplNested(r, t), fatal: (r, t) => tplFatal(r, t), rat: (r, t) => tplRatMC(r, t),
    rpow: (r, t) => tplRatPowNR(r, t), w1: (r, t) => wrQ1(r, t), w2: (r, t) => wrQ2(r, t), w3: (r, t) => wrQ3(r, t), w4: (r, t) => wrQ4(r, t), w5: (r, t) => wrQ5(r, t),
  };
  const KIND_OF = { w1: "wr", w2: "wr", w3: "wr", w4: "wr", w5: "wr", rpow: "nr" };
  // the multiple-choice and numerical-response mix per tier (the WR slots are fixed: w1…w5)
  const MIX = {
    1: { mc: ["exp", "exp", "exp", "rad", "rad", "rad", "nest", "rat", "rat", "fatal"], nr: ["exp", "exp", "rad", "rad", "rpow"] },
    2: { mc: ["exp", "exp", "rad", "rad", "nest", "nest", "rat", "rat", "fatal", "fatal"], nr: ["exp", "exp", "rad", "rpow", "rpow"] },
    3: { mc: ["exp", "exp", "exp", "rad", "rad", "nest", "rat", "rat", "fatal", "fatal"], nr: ["exp", "exp", "rad", "rad", "rpow"] },
  };

  // id: nm-<version>-<tier>-<kind>-<template>-<seed>
  function make(tier, kind, tpl, seed) {
    const id = `nm-${VERSION}-${tier}-${kind}-${tpl}-${seed.toString(36)}`;
    const r = rng(seed * 2654435761 + tier * 97 + tpl.length);
    const out = TEMPLATES[tpl](r, tier, kind === "nr" ? "nr" : "mc");
    if (out.kind !== kind) throw new Error("kind mismatch");
    const q = { ...out.q, id, nightmare: tier };
    // stacked fractions and rational exponents need full-size rendering to be readable in the choices
    if (Array.isArray(q.c)) q.c = q.c.map((s) => s.replace(/^\\\((?!\\displaystyle)/, "\\(\\displaystyle "));
    return q;
  }
  // Generate with re-seeding until a verified instance appears
  function generate(tier, kind, tpl, rnd) {
    for (let i = 0; i < 400; i++) {
      const seed = 1 + Math.floor(rnd() * 2147483646);
      try { return make(tier, kind, tpl, seed); } catch { /* rejected: re-seed */ }
    }
    throw new Error(`could not build ${tpl}`);
  }
  const cache = new Map();
  function byId(id) {
    if (cache.has(id)) return cache.get(id);
    const m = /^nm-(\d+)-([123])-(mc|nr|wr)-([a-z0-9]+)-([0-9a-z]+)$/.exec(id || "");
    if (!m || Number(m[1]) !== VERSION || !TEMPLATES[m[4]]) return null;
    try { const q = make(Number(m[2]), m[3], m[4], parseInt(m[5], 36)); cache.set(id, q); return q; } catch { return null; }
  }
  function build(tier, rnd = Math.random) {
    if (!TIERS[tier]) throw new Error("Pick Nightmare I, II or III");
    const mix = MIX[tier];
    const wr = ["w1", "w2", "w3", "w4", "w5"].map((t) => generate(tier, "wr", t, rnd));
    const nr = mix.nr.map((t) => generate(tier, "nr", t, rnd));
    const mc = shuffle(rnd, mix.mc).map((t) => generate(tier, "mc", t, rnd));
    for (const q of [...wr, ...nr, ...mc]) cache.set(q.id, q);
    return { wr, nr, mc };
  }
  const tierOf = (level) => { const m = /^nightmare([123])$/.exec(level || ""); return m ? Number(m[1]) : null; };

  const api = { build, byId, make, generate, TIERS, MIX, tierOf, VERSION, _t: { F, fpow, rsFormat, RS, rationalize, rsVal, mpow, mdiv, texPos, TEMPLATES } };
  root.Nightmare = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
