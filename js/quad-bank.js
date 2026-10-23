/*
 * QUAD BANK — the quadratic-functions question library.
 *
 * Content is organised as FAMILIES (authored templates). Each family has stable metadata
 * (id, topic, subtopic, concepts, prerequisites, formats, modes, answer format, complexity, tags)
 * and a generator that builds an exact question for a mode:
 *   simple     guided, one skill, friendly numbers, step-by-step hints
 *   normal     unit-test level, mixed formats
 *   challenge  fewer scaffolds, fractions, disguised forms, traps, combined skills
 *   nightmare  used by the Nightmare gauntlet (connected multi-part stages)
 *
 * Every instance is generated from a seed with exact fraction arithmetic, then self-checked:
 * the key must be graded "right" by the site's checker, every distractor must be graded wrong and
 * be distinct, and the float re-derivations must agree. Anything that fails is re-seeded, never shown.
 *
 * Instance ids: qd-<VERSION>-<family>-<kind>-<mode letter>-<seed base36>, rebuilt exactly by byId().
 * Question text is English; the interface around it is localised (see js/i18n.js).
 */
(function (root) {
  "use strict";
  const VERSION = 1;
  const R = String.raw;
  const M = () => root.QuadMath;
  const G = () => root.Graph;
  const Chk = () => root.MathCheck;

  // ───────── seeded randomness ─────────
  function rng(seed) { let s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
  const rint = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (r, arr) => { if (!arr.length) throw new Error("empty pick"); return arr[Math.floor(r() * arr.length)]; };
  const nz = (r, a, b) => { let v; do v = rint(r, a, b); while (v === 0); return v; };
  const shuffle = (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const LV = ["simple", "normal", "challenge", "nightmare"];
  const LV_CODE = { simple: "s", normal: "n", challenge: "c", nightmare: "x" };
  const CODE_LV = { s: "simple", n: "normal", c: "challenge", x: "nightmare" };
  const hard = (lv) => lv === "challenge" || lv === "nightmare";

  // ───────── short-hands (exact) ─────────
  const f = (x, d) => M().F(x, d);
  const fx = (x) => (typeof x === "string" ? M().fparse(x) : M().fr(x));
  const tx = (x) => M().ftex(fx(x));
  const sx = (x) => M().fstr(fx(x));
  const V = (x) => M().fval(fx(x));
  const eq = (a, b) => M().feq(fx(a), fx(b));
  const add = (a, b) => M().fadd(fx(a), fx(b)), sub = (a, b) => M().fsub(fx(a), fx(b)), mul = (a, b) => M().fmul(fx(a), fx(b)), div = (a, b) => M().fdiv(fx(a), fx(b)), neg = (a) => M().fneg(fx(a));
  const isInt = (x) => M().fint(fx(x));
  // a parenthesised value for substitution lines: (−3), (1/2)
  const par = (x) => { x = fx(x); return x.n < 0 || x.d !== 1 ? `\\left(${tx(x)}\\right)` : tx(x); };
  // always bracketed: for products written side by side, 2(3) rather than 23
  const pp = (x) => `\\left(${tx(fx(x))}\\right)`;
  // a coefficient in front of something: 1 → "", −1 → "-"
  const coefTeX = (a) => (eq(a, 1) ? "" : eq(a, -1) ? "-" : tx(a));

  // parameters by mode
  const A_SET = {
    simple: [1, 1, 1, -1],
    normal: [1, -1, 2, -2, 3, -3, "1/2", "-1/2"],
    challenge: [2, -2, 3, -3, "1/2", "-1/2", "3/2", "-3/2", "1/3", "-2/3", 4, -4],
    nightmare: [2, -2, 3, -3, "1/2", "-1/2", "3/2", "-3/2", "2/3", "-4/3", 4, -5],
  };
  const aOf = (r, lv) => fx(pick(r, A_SET[lv]));
  const hOf = (r, lv) => (lv === "simple" ? f(nz(r, -5, 5)) : lv === "normal" ? f(nz(r, -6, 6)) : r() < 0.4 ? f(nz(r, -9, 9), 2) : f(nz(r, -7, 7)));
  const kOf = (r, lv) => (lv === "simple" ? f(rint(r, -6, 6)) : lv === "normal" ? f(nz(r, -8, 8)) : r() < 0.3 ? f(nz(r, -15, 15), 4) : f(nz(r, -12, 12)));

  // ───────── self-checks ─────────
  function checkKey(spec, response) {
    const g = Chk().grade(spec, response);
    if (g.verdict !== "right") throw new Error(`key not accepted: ${JSON.stringify(spec.answer)} (${g.note})`);
  }
  function checkWR(parts) {
    for (const p of parts) {
      const resp = p.kind === "set" ? (p.answer.length ? p.answer.join(", ") : "none")
        : p.kind === "number" ? String(p.ansText || p.answer)
        : p.kind === "choice" ? p.answer
        : root.QuadCheck.handles(p.kind) ? root.QuadCheck.keyResponse(p) : p.answer;
      checkKey(p, resp);
    }
  }
  // MC: exactly 4 distinct choices (by key), correct first; every distractor has feedback
  function mc(correct, wrongs, extra) {
    const seen = new Set([correct.key]);
    const ds = [];
    for (const w of wrongs) { if (!w || seen.has(w.key)) continue; seen.add(w.key); ds.push(w); if (ds.length === 3) break; }
    if (ds.length < 3) throw new Error("not enough distinct distractors");
    return { kind: "mc", c: [correct.tex, ...ds.map((d) => d.tex)], why: [null, ...ds.map((d) => d.why)], ...extra };
  }
  const ptKey = (x, y) => `${sx(x)},${sx(y)}`;
  const ptChoice = (x, y, why) => ({ key: ptKey(x, y), tex: `\\(${M().pointTeX(fx(x), fx(y))}\\)`, why });
  const stdOf = (a, h, k) => M().toStandard({ a: fx(a), h: fx(h), k: fx(k) });
  const vxOf = (s) => M().toVertex(s);
  const polyKey = (s) => `${sx(s.a)},${sx(s.b)},${sx(s.c)}`;
  const close = (p, q) => Math.abs(p - q) <= 1e-9 * Math.max(1, Math.abs(p), Math.abs(q));
  // float re-derivation of a vertex (independent of the exact path)
  function floatVertex(a, b, c) { const h = -b / (2 * a); return [h, a * h * h + b * h + c]; }
  const gwin = (spec) => G().autoWindow(spec.fns.map(G().std), spec.points || []);
  const graphTok = (spec, desc) => G().token(spec, desc);
  const describeVertex = (a, h, k) => `parabola opening ${V(a) > 0 ? "up" : "down"} with vertex (${sx(h)}, ${sx(k)})`;

  // ═════════════════════════ FAMILIES ═════════════════════════
  const FAMILIES = [];
  const fam = (o) => FAMILIES.push({ prereqs: [], tags: [], ...o });

  // ─── Quadratic fundamentals ───────────────────────────────────
  fam({
    id: "identify", title: "Is it quadratic?", topic: "Quadratic basics", subtopic: "Identifying quadratic functions",
    concepts: ["quad.basics"], kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "choice",
    complexity: { simple: 1, normal: 2, challenge: 3 }, tags: ["recognize", "expand", "trap"],
    gen(r, lv) {
      const a = nz(r, -4, 4), b = rint(r, -6, 6), c = rint(r, -9, 9), m = nz(r, 2, 5), p = nz(r, -5, 5);
      const quads = lv === "challenge"
        ? [{ e: `(${a}x-1)(x+${Math.abs(p)})`, t: R`y = \left(${a === 1 ? "" : a === -1 ? "-" : a}x - 1\right)\left(x + ${Math.abs(p)}\right)` }, { e: `${c}-(x-${m})^2`, t: R`y = ${c} - \left(x - ${m}\right)^2` }, { e: `x(${m}-x)`, t: R`y = x\left(${m} - x\right)` }]
        : [{ e: `${a}x^2+${b}x+${c}`, t: `y = ${M().stdTeX({ a: f(a), b: f(b), c: f(c) }, "").replace(/^y = /, "")}` }, { e: `${a}(x-${m})^2+${c}`, t: `y = ${M().vertexTeX({ a: f(a), h: f(m), k: f(c) }, "")}` }];
      const traps = lv === "challenge"
        ? [{ e: `(x+${m})^2-x^2`, t: R`y = \left(x + ${m}\right)^2 - x^2`, why: R`Expand: \(\left(x + ${m}\right)^2 - x^2 = ${2 * m}x + ${m * m}\). The \(x^2\) terms cancel, so it's linear.` },
          { e: `x(x-1)(x+${m})`, t: R`y = x\left(x - 1\right)\left(x + ${m}\right)`, why: "Three linear factors multiply to an x³ term, so it's cubic, not quadratic." },
          { e: `${m}x^2-${m}(x^2-x)`, t: R`y = ${m}x^2 - ${m}\left(x^2 - x\right)`, why: R`Distribute: \(${m}x^2 - ${m}x^2 + ${m}x = ${m}x\). The squares cancel, leaving a line.` },
          { e: `(2x+1)^2-4x^2`, t: R`y = \left(2x + 1\right)^2 - 4x^2`, why: R`\(\left(2x + 1\right)^2 = 4x^2 + 4x + 1\), so the \(4x^2\) cancels and \(y = 4x + 1\) is linear.` }]
        : [{ e: `${m}x+${Math.abs(c)}`, t: `y = ${m}x + ${Math.abs(c)}`, why: "The highest power of x is 1, so this is linear (a straight line)." },
          { e: `x^3-${m}x`, t: `y = x^3 - ${m}x`, why: "The highest power is 3, so this is cubic. A quadratic's highest power is exactly 2." },
          { e: `${m}`, t: `y = ${m}`, why: "This is a constant: a horizontal line with no x term at all." },
          { e: `${m}x-${m}x^3`, t: `y = ${m}x - ${m}x^3`, why: "The x³ term makes it cubic." }];
      const q0 = pick(r, quads);
      const deg = (e) => M().pdeg(M().toPoly(M().parseExpr(e)));
      if (deg(q0.e) !== 2) throw new Error("not quadratic");
      const ws = shuffle(r, traps).filter((t) => deg(t.e) !== 2);
      return mc({ key: q0.e, tex: `\\(${q0.t}\\)` }, ws.map((w) => ({ key: w.e, tex: `\\(${w.t}\\)`, why: w.why })), {
        q: "Which of these is a quadratic function?",
        e: R`A quadratic function can be written as \(y = ax^2 + bx + c\) with \(a \ne 0\): after expanding and collecting like terms, the highest power of \(x\) is exactly 2. Here that's \(${q0.t}\).`,
        hints: ["Expand each one in your head and look for the highest power of x that survives.", lv === "challenge" ? "Watch for x² terms that cancel out after you expand." : "Quadratic means the highest power of x is 2: not 1, not 3."],
      });
    },
  });

  fam({
    id: "coeffs", title: "Name the coefficients", topic: "Quadratic basics", subtopic: "Coefficients a, b, c",
    concepts: ["quad.basics"], kinds: ["nr", "mc"], modes: ["simple", "normal", "challenge"], answer: "integer",
    complexity: { simple: 1, normal: 2, challenge: 3 }, tags: ["coefficients", "expand"],
    gen(r, lv, kind) {
      let a, b, c, t, steps;
      if (lv === "challenge") {
        const p = nz(r, -3, 3), q = nz(r, -6, 6), s = nz(r, -3, 3), u = nz(r, -6, 6);
        if (Math.abs(p) === 1 && Math.abs(s) === 1 && r() < 0.5) throw new Error("too plain");
        a = p * s; b = p * u + q * s; c = q * u;
        const lin = (m, n) => `\\left(${m === 1 ? "" : m === -1 ? "-" : m}x ${n < 0 ? "-" : "+"} ${Math.abs(n)}\\right)`;
        t = `y = ${lin(p, q)}${lin(s, u)}`;
        steps = [R`Expand: \(${lin(p, q)}${lin(s, u)} = ${M().stdTeX({ a: f(a), b: f(b), c: f(c) }, "")}\).`];
      } else {
        a = lv === "simple" ? nz(r, -4, 4) : nz(r, -7, 7); b = nz(r, -9, 9); c = nz(r, -12, 12);
        const parts = [[a, "x^2"], [b, "x"], [c, ""]];
        const order = lv === "simple" ? parts : shuffle(r, parts);
        if (lv !== "simple" && order[0][1] === "x^2") throw new Error("keep it shuffled");
        t = "y = " + order.map(([co, body], i) => M().termTeX(f(co), body, i === 0)).join("");
        steps = [R`Rewrite in the order \(ax^2 + bx + c\): \(${M().stdTeX({ a: f(a), b: f(b), c: f(c) }, "y")}\).`];
      }
      const which = pick(r, ["a", "b", "c"]);
      const val = { a, b, c }[which];
      if (Math.abs(val) > 99) throw new Error("big");
      const e = steps.concat([R`So \(a = ${a}\), \(b = ${b}\) and \(c = ${c}\). The question asks for \(${which}\): \(${val}\).`]).join(" ");
      const hints = ["Standard form is y = ax² + bx + c: a goes with x², b with x, c is the constant.", lv === "challenge" ? "Expand the brackets first, then collect like terms." : "Rearrange the terms into the order x², x, constant. Keep each sign with its term."];
      if (kind === "nr") return { kind: "nr", q: R`For the quadratic function \(${t}\), what is the value of \(${which}\)?`, answer: val, fmt: "Integer", e, hints };
      const others = { a, b, c };
      const ws = [
        { key: String(-val), tex: `\\(${which} = ${-val}\\)`, why: "Sign slip: the sign in front of a term belongs to its coefficient." },
        ...["a", "b", "c"].filter((w) => w !== which).map((w) => ({ key: String(others[w]), tex: `\\(${which} = ${others[w]}\\)`, why: `That's ${w}, the coefficient of ${w === "a" ? "x²" : w === "b" ? "x" : "the constant term"}.` })),
        { key: String(val + 1), tex: `\\(${which} = ${val + 1}\\)`, why: "Recheck the arithmetic when you expand or collect terms." },
      ];
      return mc({ key: String(val), tex: `\\(${which} = ${val}\\)` }, ws, { q: R`For \(${t}\), which is correct?`, e, hints });
    },
  });

  fam({
    id: "direction", title: "Up or down?", topic: "Quadratic basics", subtopic: "Direction of opening and max/min",
    concepts: ["quad.direction"], kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "choice",
    complexity: { simple: 1, normal: 1, challenge: 3 }, tags: ["leading coefficient", "max", "min", "trap"],
    gen(r, lv) {
      let t, a, why0;
      if (lv === "challenge") {
        const p = nz(r, -5, 5), q = nz(r, -5, 5);
        const form = pick(r, ["negneg", "swap", "const"]);
        if (form === "negneg") { t = R`y = -\left(x ${p < 0 ? "+" : "-"} ${Math.abs(p)}\right)\left(${Math.abs(q)} - x\right)`; a = 1; why0 = R`\(-\left(x - p\right)\left(q - x\right) = \left(x - p\right)\left(x - q\right)\): the two minus signs cancel, so the \(x^2\) coefficient is \(+1\).`; }
        else if (form === "swap") { t = R`y = \left(${Math.abs(q)} - x\right)\left(x ${p < 0 ? "-" : "+"} ${Math.abs(p)}\right)`; a = -1; why0 = R`Multiply the \(x\)-terms: \(\left(-x\right)\left(x\right) = -x^2\), so \(a = -1\) and the graph opens down.`; }
        else { const m = nz(r, 2, 9); t = R`y = ${m} - ${Math.abs(q) === 1 ? "" : Math.abs(q)}x^2 + ${Math.abs(p) === 1 ? "" : Math.abs(p)}x`; a = -Math.abs(q); why0 = R`The \(x^2\) term is \(-${Math.abs(q) === 1 ? "" : Math.abs(q)}x^2\) even though it isn't written first, so \(a < 0\).`; }
      } else {
        a = lv === "simple" ? pick(r, [1, -1, 2, -2]) : nz(r, -5, 5);
        const h = f(nz(r, -6, 6)), k = f(nz(r, -9, 9));
        t = lv === "simple" ? M().vertexTeX({ a: f(a), h, k }) : M().stdTeX({ a: f(a), b: f(nz(r, -9, 9)), c: k });
        why0 = R`\(a = ${a}\) is ${a > 0 ? "positive" : "negative"}, so the parabola opens ${a > 0 ? "up" : "down"}.`;
      }
      const up = a > 0;
      const opts = [["up", "min"], ["up", "max"], ["down", "max"], ["down", "min"]];
      const lab = ([d, m]) => `Opens ${d}; it has a ${m === "min" ? "minimum" : "maximum"}`;
      const right = up ? ["up", "min"] : ["down", "max"];
      const ws = opts.filter((o) => o.join() !== right.join()).map((o) => ({
        key: o.join(), tex: lab(o),
        why: o[0] !== right[0] ? "Look at the sign of a, the coefficient of x²: positive opens up, negative opens down." : "An upward parabola bottoms out (minimum); a downward one peaks (maximum).",
      }));
      return mc({ key: right.join(), tex: lab(right) }, ws, {
        q: R`Describe the graph of \(${t}\).`,
        e: why0 + ` A parabola that opens ${up ? "up has a lowest point: a minimum" : "down has a highest point: a maximum"} at its vertex.`,
        hints: ["Only the x² coefficient decides the direction.", lv === "challenge" ? "Multiply out just the x-terms to find the sign of the x² term." : "a > 0: opens up (minimum). a < 0: opens down (maximum)."],
      });
    },
  });

  fam({
    id: "width", title: "Narrow or wide?", topic: "Graphing & transformations", subtopic: "Stretches and compressions",
    concepts: ["quad.transform", "quad.direction"], kinds: ["mc"], modes: ["normal", "challenge"], answer: "choice",
    complexity: { normal: 2, challenge: 3 }, tags: ["leading coefficient", "stretch", "compare"],
    gen(r, lv) {
      const mags = shuffle(r, ["1/3", "1/2", "1", "2", "3", "4", "3/2", "2/3"]).slice(0, 4).map(fx);
      const narrow = r() < 0.5;
      const best = mags.reduce((m, x) => (narrow ? (V(x) > V(m) ? x : m) : V(x) < V(m) ? x : m));
      if (mags.filter((x) => eq(x, best)).length !== 1) throw new Error("tie");
      const make = (mag) => {
        const s = r() < 0.5 ? -1 : 1, a = mul(mag, s), h = f(nz(r, -5, 5)), k = f(nz(r, -6, 6));
        if (lv === "challenge" && r() < 0.6) return { key: sx(mag), tex: `\\(${M().stdTeX(stdOf(a, h, k))}\\)`, mag };
        return { key: sx(mag), tex: `\\(${M().vertexTeX({ a, h, k })}\\)`, mag };
      };
      const cs = mags.map(make);
      const right = cs.find((c) => eq(c.mag, best));
      return mc({ key: right.key, tex: right.tex }, cs.filter((c) => c !== right).map((c) => ({ key: c.key, tex: c.tex, why: `Here |a| = ${sx(c.mag)}. ${narrow ? "A smaller |a| makes a wider parabola." : "A bigger |a| makes a narrower parabola."} The sign of a and the shifts don't change the width.` })), {
        q: `Which parabola is the ${narrow ? "narrowest" : "widest"}?`,
        e: R`Width depends only on \(|a|\): the bigger \(|a|\), the faster \(y\) grows away from the vertex, so the narrower the graph. ${lv === "challenge" ? "In standard form, a is still the x² coefficient. " : ""}The ${narrow ? "largest" : "smallest"} \(|a|\) here is \(${tx(best)}\).`,
        hints: ["Ignore the shifts and the sign of a. Compare |a| only.", narrow ? "Narrowest = largest |a|." : "Widest = smallest |a| (closest to 0)."],
      });
    },
  });

  // ─── Vertex and axis of symmetry ──────────────────────────────
  fam({
    id: "vform", title: "Vertex from vertex form", topic: "Vertex & axis", subtopic: "Vertex form",
    concepts: ["quad.vertex_form"], kinds: ["mc", "nr", "wr"], modes: ["simple", "normal", "challenge"], answer: "point",
    complexity: { simple: 1, normal: 1, challenge: 2 }, tags: ["vertex", "sign trap"],
    gen(r, lv, kind) {
      const a = aOf(r, lv), h = hOf(r, lv), k = kOf(r, lv);
      if (eq(h, 0) || eq(k, 0) || eq(h, k) || eq(h, neg(k))) throw new Error("ambiguous");
      let t = M().vertexTeX({ a, h, k });
      let note = "";
      if (lv === "challenge" && r() < 0.5) {
        if (r() < 0.5) { t = `y = ${tx(k)} ${V(a) < 0 ? "-" : "+"} ${coefTeX(M().fabs(a))}${M().shiftTeX(h)}^2`; note = R` The \(${tx(k)}\) written first is still \(k\).`; }
        else { t = `y = ${coefTeX(a)}\\left(${tx(h)} - x\\right)^2 ${V(k) < 0 ? "-" : "+"} ${tx(M().fabs(k))}`; note = R` Note \(\left(${tx(h)} - x\right)^2 = \left(x - ${par(h)}\right)^2\): squaring removes the sign.`; }
      }
      const e = R`In \(y = a\left(x - h\right)^2 + k\) the vertex is \(\left(h, k\right)\). Read \(h\) from inside the bracket with the sign flipped: \(${M().shiftTeX(h)}\) means \(h = ${tx(h)}\). So the vertex is \(${M().pointTeX(h, k)}\).${note}`;
      const hints = ["Vertex form is y = a(x − h)² + k, and the vertex is (h, k).", R`Inside the bracket, \(x - 3\) means \(h = 3\) and \(x + 3\) means \(h = -3\).`];
      if (kind === "nr") {
        const askX = r() < 0.5;
        return { kind: "nr", q: R`What is the ${askX ? "x" : "y"}-coordinate of the vertex of \(${t}\)?`, answer: V(askX ? h : k), ansTex: tx(askX ? h : k), fmt: "Number", e, hints };
      }
      if (kind === "wr") {
        const parts = [{ key: "a", label: "(a)", prompt: "Vertex:", kind: "point", role: "vertex", answer: { x: sx(h), y: sx(k) }, marks: 1 },
          { key: "b", label: "(b)", prompt: R`Equation of the axis of symmetry: \(x = \)`, kind: "number", answer: V(h), ansTex: tx(h), ansText: sx(h), marks: 1 }];
        checkWR(parts);
        return { kind: "wr", title: "Read the vertex", intro: R`For \(${t}\):`, parts, solution: [e, R`The axis of symmetry is the vertical line through the vertex: \(x = ${tx(h)}\).`], rubric: ["(a) Correct vertex, with both signs right — 1 mark", "(b) x = h — 1 mark"], hints };
      }
      return mc(ptChoice(h, k), [
        ptChoice(neg(h), k, "Sign slip on h: (x − h) means the vertex is h units to the right, so the sign flips."),
        ptChoice(h, neg(k), "k is added outside the bracket as written, so keep its sign."),
        ptChoice(k, h, "The coordinates are swapped: h is the x-coordinate."),
        ptChoice(neg(h), neg(k), "Only h flips sign; k keeps its sign."),
      ], { q: R`What is the vertex of \(${t}\)?`, e, hints });
    },
  });

  fam({
    id: "axis", title: "Axis of symmetry", topic: "Vertex & axis", subtopic: "Axis of symmetry",
    concepts: ["quad.axis"], kinds: ["nr", "mc"], modes: ["simple", "normal", "challenge"], answer: "number",
    complexity: { simple: 1, normal: 2, challenge: 3 }, tags: ["symmetry", "-b/2a"],
    gen(r, lv, kind) {
      const how = lv === "simple" ? pick(r, ["vertex", "roots"]) : lv === "normal" ? pick(r, ["std", "roots", "pair"]) : pick(r, ["std", "pair", "factored"]);
      let q, ans, e;
      if (how === "vertex") {
        const a = aOf(r, lv), h = f(nz(r, -6, 6)), k = f(nz(r, -6, 6));
        q = R`What is the axis of symmetry of \(${M().vertexTeX({ a, h, k })}\)? Answer with the number in \(x = \ ?\)`; ans = h;
        e = R`The axis of symmetry passes through the vertex \(${M().pointTeX(h, k)}\), so it's \(x = ${tx(h)}\).`;
      } else if (how === "std") {
        const a = lv === "normal" ? f(nz(r, -3, 3)) : aOf(r, lv), b = f(nz(r, -12, 12)), c = f(nz(r, -9, 9));
        ans = div(neg(b), mul(2, a));
        if (lv === "normal" && !isInt(mul(ans, 2))) throw new Error("keep it friendly");
        q = R`Find the axis of symmetry of \(${M().stdTeX({ a, b, c })}\). Answer with the number in \(x = \ ?\)`;
        e = R`For \(y = ax^2 + bx + c\), the axis is \(x = -\frac{b}{2a}\). Here \(-\frac{b}{2a} = -\frac{${tx(b)}}{2${pp(a)}} = ${tx(ans)}\).`;
      } else if (how === "roots") {
        const p = nz(r, -8, 8), s = nz(r, -8, 8); if (p === s) throw new Error("same root");
        ans = div(p + s, 2);
        q = R`A parabola crosses the x-axis at \(x = ${Math.min(p, s)}\) and \(x = ${Math.max(p, s)}\). What is its axis of symmetry? Answer with the number in \(x = \ ?\)`;
        e = R`The axis is halfway between the x-intercepts: \(x = \frac{${Math.min(p, s)} + ${par(Math.max(p, s))}}{2} = ${tx(ans)}\).`;
      } else if (how === "pair") {
        const p = nz(r, -7, 7), d = rint(r, 2, 9), yv = nz(r, -15, 15);
        ans = div(2 * p + d, 2);
        q = R`For a quadratic function \(f\), \(f(${p}) = f(${p + d}) = ${yv}\). What is the axis of symmetry? Answer with the number in \(x = \ ?\)`;
        e = R`Points at the same height sit symmetrically about the axis, so the axis is halfway between them: \(x = \frac{${p} + ${par(p + d)}}{2} = ${tx(ans)}\). The value ${yv} doesn't matter.`;
      } else {
        const a = nz(r, -3, 3), p = nz(r, -7, 7), s = nz(r, -7, 7); if (p === s) throw new Error("same");
        ans = div(p + s, 2);
        q = R`Find the axis of symmetry of \(y = ${a === 1 ? "" : a === -1 ? "-" : a}\left(x ${p < 0 ? "+" : "-"} ${Math.abs(p)}\right)\left(x ${s < 0 ? "+" : "-"} ${Math.abs(s)}\right)\). Answer with the number in \(x = \ ?\)`;
        e = R`The zeros are \(x = ${p}\) and \(x = ${s}\). The axis is halfway between them: \(x = \frac{${p} + ${par(s)}}{2} = ${tx(ans)}\). The factor ${a} stretches the graph but doesn't move the axis.`;
      }
      const hints = ["The axis of symmetry is the vertical line x = h through the vertex.", how === "std" ? "Use x = −b / (2a). Watch the minus signs." : "It sits exactly halfway between any two points at the same height, such as the x-intercepts."];
      if (kind === "nr") return { kind: "nr", q, answer: V(ans), ansTex: tx(ans), fmt: "Number", e, hints };
      const ch = (v, why) => ({ key: sx(v), tex: `\\(x = ${tx(v)}\\)`, why });
      return mc(ch(ans), [ch(neg(ans), "Sign slip: check −b/(2a) or the midpoint again."), ch(mul(ans, 2), "You found the sum of the two x-values; the axis is their average (divide by 2)."), ch(add(ans, 1), "Close, but recompute the midpoint carefully."), ch(div(ans, 2), "Divide by 2 only once.")],
        { q: q.replace(" Answer with the number in \\(x = \\ ?\\)", ""), e, hints });
    },
  });

  fam({
    id: "vstd", title: "Vertex from standard form", topic: "Vertex & axis", subtopic: "Vertex from standard form",
    concepts: ["quad.standard_vertex"], prereqs: ["quad.vertex_form", "quad.axis"], kinds: ["mc", "nr", "wr"], modes: ["normal", "challenge"], answer: "point",
    complexity: { normal: 2, challenge: 3 }, tags: ["-b/2a", "substitute"],
    gen(r, lv, kind) {
      const a = lv === "normal" ? f(nz(r, -3, 3)) : aOf(r, lv);
      const h = lv === "normal" ? f(nz(r, -5, 5)) : hOf(r, lv), k = lv === "normal" ? f(nz(r, -9, 9)) : kOf(r, lv);
      const s = stdOf(a, h, k);
      if (Math.abs(V(s.b)) > 40 || Math.abs(V(s.c)) > 60 || !isInt(s.b) || !isInt(s.c) || eq(s.b, 0) || eq(h, k)) throw new Error("messy");
      const [fh, fk] = floatVertex(V(s.a), V(s.b), V(s.c));
      if (!close(fh, V(h)) || !close(fk, V(k))) throw new Error("vertex mismatch");
      const t = M().stdTeX(s);
      const sub1 = R`${coefTeX(s.a)}${pp(h)}^2 ${V(s.b) < 0 ? "-" : "+"} ${tx(M().fabs(s.b))}${pp(h)} ${V(s.c) < 0 ? "-" : "+"} ${tx(M().fabs(s.c))}`;
      const steps = [R`\(h = -\frac{b}{2a} = -\frac{${tx(s.b)}}{2${pp(s.a)}} = ${tx(h)}\).`, R`Substitute: \(k = ${sub1} = ${tx(k)}\).`, R`The vertex is \(${M().pointTeX(h, k)}\).`];
      const hints = [R`First find \(h = -\frac{b}{2a}\).`, "Then substitute that x-value back into the function to get k.", R`Check: \(h = ${tx(h)}\).`];
      if (kind === "nr") {
        const askK = r() < 0.6;
        return { kind: "nr", q: R`Find the ${askK ? (V(a) > 0 ? "minimum" : "maximum") + " value" : "x-coordinate of the vertex"} of \(${t}\).`, answer: V(askK ? k : h), ansTex: tx(askK ? k : h), fmt: "Number", e: steps.join(" "), hints };
      }
      if (kind === "wr") {
        const parts = [{ key: "a", label: "(a)", prompt: "Vertex:", kind: "point", role: "vertex", answer: { x: sx(h), y: sx(k) }, marks: 2 },
          { key: "b", label: "(b)", prompt: `${V(a) > 0 ? "Minimum" : "Maximum"} value of y:`, kind: "number", answer: V(k), ansTex: tx(k), ansText: sx(k), marks: 1 }];
        checkWR(parts);
        return { kind: "wr", title: "Vertex from standard form", intro: R`For \(${t}\):`, parts, solution: steps.concat([R`It opens ${V(a) > 0 ? "up, so the vertex is a minimum" : "down, so the vertex is a maximum"}: \(y = ${tx(k)}\).`]), rubric: ["(a) Correct h = −b/(2a) — 1 mark; correct k by substitution — 1 mark", "(b) The max/min value is k — 1 mark"], hints };
      }
      const wrongK = M().evalStd(s, neg(h));
      return mc(ptChoice(h, k), [
        ptChoice(neg(h), wrongK, R`Sign slip: \(h = -\frac{b}{2a}\), not \(+\frac{b}{2a}\).`),
        ptChoice(h, s.c, "c is the y-intercept, not the y-coordinate of the vertex. Substitute h to get k."),
        ptChoice(h, neg(k), "Recheck the substitution, especially the squared term."),
        ptChoice(div(neg(s.b), s.a), M().evalStd(s, div(neg(s.b), s.a)), "Divide by 2a, not by a."),
      ], { q: R`What is the vertex of \(${t}\)?`, e: steps.join(" "), hints });
    },
  });

  // completing the square (used by tests, practice and the Nightmare gauntlet)
  function ctsSteps(s) {
    const { a, b, c } = s;
    const v = vxOf(s);
    const ba = div(b, a), half = div(ba, 2), sq = mul(half, half);
    const L = [];
    const inner = (extra) => R`x^2 ${V(ba) < 0 ? "-" : "+"} ${tx(M().fabs(ba)) === "1" ? "" : tx(M().fabs(ba))}x${extra}`;
    if (eq(a, 1)) {
      L.push(R`\(y = ${inner("")} ${V(c) < 0 ? "-" : "+"} ${tx(M().fabs(c))}\)`);
      L.push(R`Add and subtract \(\left(\frac{b}{2}\right)^2 = ${par(half)}^2 = ${tx(sq)}\): \(y = ${inner(` + ${tx(sq)}`)} - ${tx(sq)} ${V(c) < 0 ? "-" : "+"} ${tx(M().fabs(c))}\)`);
    } else {
      L.push(R`Factor \(${tx(a)}\) from the \(x\)-terms: \(y = ${tx(a)}\left(${inner("")}\right) ${V(c) < 0 ? "-" : "+"} ${tx(M().fabs(c))}\)`);
      L.push(R`Inside, add and subtract \(\left(${tx(half)}\right)^2 = ${tx(sq)}\): \(y = ${tx(a)}\left(${inner(` + ${tx(sq)} - ${tx(sq)}`)}\right) ${V(c) < 0 ? "-" : "+"} ${tx(M().fabs(c))}\)`);
      L.push(R`Move the \(-${tx(sq)}\) out (it gets multiplied by \(${tx(a)}\)): \(y = ${tx(a)}${M().shiftTeX(v.h)}^2 ${V(neg(mul(a, sq))) < 0 ? "-" : "+"} ${tx(M().fabs(mul(a, sq)))} ${V(c) < 0 ? "-" : "+"} ${tx(M().fabs(c))}\)`);
    }
    L.push(R`So \(${M().vertexTeX(v)}\).`);
    return L;
  }

  fam({
    id: "cts", title: "Complete the square", topic: "Vertex & axis", subtopic: "Completing the square",
    concepts: ["quad.complete_square", "quad.vertex_form"], prereqs: ["quad.vertex_form", "factoring.special"], kinds: ["wr", "mc"], modes: ["normal", "challenge", "nightmare"], answer: "equation (vertex form)",
    complexity: { normal: 3, challenge: 4, nightmare: 5 }, tags: ["completing the square", "vertex form", "multi-step"],
    gen(r, lv, kind) {
      const a = lv === "normal" ? fx(pick(r, [1, 1, 2, -1, 3])) : aOf(r, lv);
      let h = lv === "normal" ? f(nz(r, -6, 6)) : hOf(r, lv);
      const k = lv === "normal" ? f(nz(r, -9, 9)) : kOf(r, lv);
      const s = stdOf(a, h, k);
      if (!isInt(s.b) || !isInt(s.c) || eq(s.b, 0) || Math.abs(V(s.b)) > 36 || Math.abs(V(s.c)) > 60) throw new Error("messy");
      if (lv !== "normal" && isInt(h) && Math.abs(V(a)) === 1) throw new Error("too easy for challenge");
      const v = vxOf(s);
      const steps = ctsSteps(s);
      const hints = ["Factor a out of the x² and x terms first (skip this if a = 1).", R`Inside the bracket, add and subtract \(\left(\frac{1}{2}\cdot\text{the x-coefficient}\right)^2\).`, R`The vertex should come out as \(${M().pointTeX(v.h, v.k)}\).`];
      if (kind === "mc") {
        const W = (a2, h2, k2, why) => ({ key: `${sx(a2)},${sx(h2)},${sx(k2)}`, tex: `\\(${M().vertexTeX({ a: a2, h: h2, k: k2 })}\\)`, why });
        const half = div(div(s.b, a), 2);
        return mc(W(v.a, v.h, v.k), [
          W(v.a, neg(v.h), v.k, "The sign inside the bracket: x² − 6x completes to (x − 3)², not (x + 3)²."),
          W(v.a, v.h, add(s.c, mul(half, half)), "The square you add inside the bracket must be subtracted again (times a), not added."),
          W(v.a, v.h, sub(s.c, mul(half, half)), eq(a, 1) ? "Recheck the constant." : "The subtracted square gets multiplied by a when it leaves the bracket."),
          W(v.a, mul(v.h, 2), v.k, "Halve the x-coefficient before squaring."),
        ], { q: R`Which is \(${M().stdTeX(s)}\) written in vertex form?`, e: steps.join(" "), hints });
      }
      const parts = [
        { key: "a", label: "(a)", prompt: "Write the function in vertex form.", kind: "equation", form: "vertex", answer: M().vertexStr(v), marks: 2 },
        { key: "b", label: "(b)", prompt: "Vertex:", kind: "point", role: "vertex", answer: { x: sx(v.h), y: sx(v.k) }, marks: 1 },
        { key: "c", label: "(c)", prompt: R`Axis of symmetry: \(x = \)`, kind: "number", answer: V(v.h), ansTex: tx(v.h), ansText: sx(v.h), marks: 1 },
        { key: "d", label: "(d)", prompt: `${V(a) > 0 ? "Minimum" : "Maximum"} value:`, kind: "number", answer: V(v.k), ansTex: tx(v.k), ansText: sx(v.k), marks: 1 },
      ];
      checkWR(parts);
      return { kind: "wr", title: "Complete the square", intro: R`Consider \(${M().stdTeX(s)}\).`, parts, solution: steps.concat([R`Vertex \(${M().pointTeX(v.h, v.k)}\), axis \(x = ${tx(v.h)}\), ${V(a) > 0 ? "minimum" : "maximum"} value \(${tx(v.k)}\).`]),
        rubric: ["(a) Correct method (factor a, add and subtract the square) — 1 mark; correct vertex form — 1 mark", "(b)–(d) 1 mark each; they follow from (a)", "The same function in standard form earns 1 of 2 marks for (a)."], hints };
    },
  });

  fam({
    id: "maxmin", title: "Maximum or minimum value", topic: "Vertex & axis", subtopic: "Maximum and minimum",
    concepts: ["quad.direction", "quad.standard_vertex"], kinds: ["mc", "nr"], modes: ["simple", "normal", "challenge"], answer: "number",
    complexity: { simple: 1, normal: 2, challenge: 3 }, tags: ["max", "min", "vertex"],
    gen(r, lv, kind) {
      const a = aOf(r, lv), h = hOf(r, lv), k = kOf(r, lv);
      if (eq(h, k) || eq(h, 0)) throw new Error("ambiguous");
      const s = stdOf(a, h, k);
      const useStd = lv !== "simple" && (lv === "challenge" || r() < 0.5);
      if (useStd && (!isInt(s.b) || !isInt(s.c) || Math.abs(V(s.c)) > 60)) throw new Error("messy");
      const t = useStd ? M().stdTeX(s) : M().vertexTeX({ a, h, k });
      const kind2 = V(a) > 0 ? "minimum" : "maximum";
      const e = (useStd ? R`Find the vertex: \(h = -\frac{b}{2a} = ${tx(h)}\) and \(k = f\left(${tx(h)}\right) = ${tx(k)}\). ` : R`The vertex is \(${M().pointTeX(h, k)}\). `) + R`Since \(a = ${tx(a)}\) is ${V(a) > 0 ? "positive" : "negative"}, the graph opens ${V(a) > 0 ? "up" : "down"}, so the ${kind2} value is \(y = ${tx(k)}\), reached at \(x = ${tx(h)}\).`;
      const hints = ["The max or min value is the y-coordinate of the vertex.", "a > 0 → minimum, a < 0 → maximum."];
      if (kind === "nr") return { kind: "nr", q: R`What is the ${kind2} value of \(${t}\)?`, answer: V(k), ansTex: tx(k), fmt: "Number", e, hints };
      const other = kind2 === "minimum" ? "maximum" : "minimum";
      const ch = (word, v, why) => ({ key: `${word}${sx(v)}`, tex: `A ${word} value of \\(${tx(v)}\\)`, why });
      return mc(ch(kind2, k), [ch(other, k, "Right number, wrong type: the sign of a decides max or min."), ch(kind2, h, "That's the x-coordinate of the vertex. The max/min value is the y-coordinate."), ch(kind2, neg(k), "Recheck the sign of k."), useStd ? ch(kind2, s.c, "That's the y-intercept, not the vertex.") : ch(other, h, "Use the y-coordinate, and check the sign of a.")], { q: R`Which describes \(${t}\)?`, e, hints });
    },
  });

  fam({
    id: "features", title: "Vertex or intercept?", topic: "Vertex & axis", subtopic: "Vertex versus intercepts",
    concepts: ["quad.vertex_form", "quad.intercepts"], kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "point",
    complexity: { simple: 2, normal: 2, challenge: 3 }, tags: ["vertex", "intercepts", "distinguish"],
    gen(r, lv) {
      const p = nz(r, -7, 7), d = 2 * rint(r, 1, 4), s = p + d;
      const a = lv === "simple" ? 1 : nz(r, -2, 2);
      const std = M().fromFactored({ a: f(a), r: f(p), s: f(s) });
      const v = vxOf(std);
      const ask = pick(r, ["vertex", "yint", "xint"]);
      const fac = R`y = ${a === 1 ? "" : a === -1 ? "-" : a}\left(x ${p < 0 ? "+" : "-"} ${Math.abs(p)}\right)\left(x ${s < 0 ? "+" : "-"} ${Math.abs(s)}\right)`;
      const t = lv === "challenge" ? M().stdTeX(std) : fac;
      if (eq(std.c, 0) || p === 0 || s === 0) throw new Error("origin");
      const V1 = ptChoice(v.h, v.k, "That's the vertex: the turning point halfway between the zeros."), Y = ptChoice(0, std.c, "That's the y-intercept (where x = 0)."), X1 = ptChoice(p, 0, "That's an x-intercept (where y = 0)."), X2 = ptChoice(s, 0, "That's an x-intercept (where y = 0).");
      const right = ask === "vertex" ? V1 : ask === "yint" ? Y : X1;
      const name = { vertex: "the vertex", yint: "the y-intercept", xint: "an x-intercept" }[ask];
      return mc({ key: right.key, tex: right.tex }, [V1, Y, X1, X2, ptChoice(std.c, 0, "x and y are swapped: the y-intercept is (0, c).")].filter((c) => c.key !== right.key && !(ask === "xint" && c.key === X2.key)), {
        q: R`For \(${t}\), which point is ${name}?`,
        e: R`Zeros: \(x = ${p}\) and \(x = ${s}\) (where \(y = 0\)). y-intercept: set \(x = 0\) to get \(y = ${tx(std.c)}\). Vertex: halfway between the zeros at \(x = ${tx(v.h)}\), and \(y = ${tx(v.k)}\) there. So ${name} is ${right.tex}.`,
        hints: ["x-intercepts have y = 0, the y-intercept has x = 0, and the vertex is the turning point.", "The vertex sits halfway between the two x-intercepts."],
      });
    },
  });

  // ─── Graphing and transformations ─────────────────────────────
  fam({
    id: "matchgraph", title: "Match the equation to its graph", topic: "Graphing & transformations", subtopic: "Matching equations and graphs",
    concepts: ["quad.graph_read", "quad.transform"], kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "graph",
    complexity: { simple: 1, normal: 2, challenge: 3 }, tags: ["graph", "representation"],
    gen(r, lv) {
      const a = lv === "simple" ? fx(pick(r, [1, -1])) : fx(pick(r, [1, -1, 2, -2, "1/2", "-1/2"])), h = f(nz(r, -4, 4)), k = f(nz(r, -4, 4));
      if (eq(h, k) || eq(h, neg(k))) throw new Error("ambiguous");
      const fns = [{ a, h, k }, { a, h: neg(h), k }, { a: neg(a), h, k }, { a, h, k: neg(k) }, { a: mul(a, 2), h, k }];
      const win = gwin({ fns: fns.map((x) => ({ a: sx(x.a), h: sx(x.h), k: sx(x.k) })) });
      const gt = (x) => graphTok({ fns: [{ a: sx(x.a), h: sx(x.h), k: sx(x.k) }], window: win, marks: { vertex: true } }, describeVertex(x.a, x.h, x.k));
      const key = (x) => `${sx(x.a)},${sx(x.h)},${sx(x.k)}`;
      const whys = ["", "The vertex is mirrored left–right: (x − h) shifts right by h.", "This one opens the wrong way: check the sign of a.", "The vertex is at the wrong height: k is added after squaring.", "Right vertex, but too narrow: |a| controls the width."];
      const useStd = lv === "challenge";
      const s = stdOf(a, h, k);
      if (useStd && (!isInt(s.b) || !isInt(s.c))) throw new Error("messy");
      return mc({ key: key(fns[0]), tex: gt(fns[0]) }, fns.slice(1).map((x, i) => ({ key: key(x), tex: gt(x), why: whys[i + 1] })), {
        q: R`Which graph shows \(${useStd ? M().stdTeX(s) : M().vertexTeX({ a, h, k })}\)?`,
        e: (useStd ? R`Complete the square: \(${M().stdTeX(s)} = ${M().vertexTeX({ a, h, k }, "")}\). ` : "") + R`The vertex is \(${M().pointTeX(h, k)}\) and \(a = ${tx(a)}\), so it opens ${V(a) > 0 ? "up" : "down"}${eq(M().fabs(a), 1) ? "" : V(M().fabs(a)) > 1 ? ", narrower than y = x²" : ", wider than y = x²"}.`,
        hints: ["Find the vertex first, then check the direction.", "Then check the width: one step from the vertex, y changes by |a|."],
      });
    },
  });

  fam({
    id: "graphtoeq", title: "Equation from a graph (choose)", topic: "Graphing & transformations", subtopic: "Reading a graph",
    concepts: ["quad.graph_read", "quad.equation_from"], kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "equation",
    complexity: { simple: 2, normal: 2, challenge: 3 }, tags: ["graph", "representation"],
    gen(r, lv) {
      const a = lv === "simple" ? fx(pick(r, [1, -1])) : fx(pick(r, [1, -1, 2, -2, "1/2", "-1/2", 3])), h = f(nz(r, -4, 4)), k = f(nz(r, -5, 5));
      if (eq(h, k) || eq(h, neg(k))) throw new Error("ambiguous");
      const p = { x: add(h, eq(M().fabs(a), "1/2") ? 2 : 1) }; p.y = add(k, mul(a, mul(sub(p.x, h), sub(p.x, h))));
      const spec = { fns: [{ a: sx(a), h: sx(h), k: sx(k) }], marks: { vertex: true }, points: [{ x: sx(p.x), y: sx(p.y), label: `(${sx(p.x)}, ${sx(p.y)})` }] };
      spec.window = gwin(spec);
      const W = (a2, h2, k2, why) => ({ key: `${sx(a2)},${sx(h2)},${sx(k2)}`, tex: `\\(${M().vertexTeX({ a: a2, h: h2, k: k2 })}\\)`, why });
      return mc(W(a, h, k), [W(a, neg(h), k, "Sign of h: a vertex at x = 2 gives (x − 2), not (x + 2)."), W(neg(a), h, k, "This would open the other way."), W(a, h, neg(k), "Check the vertex height."), W(mul(a, 2), h, k, "Use the marked point to find a: it isn't this steep.")], {
        q: `Which equation matches this graph? ${graphTok(spec, `${describeVertex(a, h, k)}, passing through (${sx(p.x)}, ${sx(p.y)})`)}`,
        e: R`The vertex is \(${M().pointTeX(h, k)}\), so \(y = a${M().shiftTeX(h)}^2 ${V(k) < 0 ? "-" : "+"} ${tx(M().fabs(k))}\). Use the point \(${M().pointTeX(p.x, p.y)}\): \(${tx(p.y)} = a${pp(sub(p.x, h))}^2 ${V(k) < 0 ? "-" : "+"} ${tx(M().fabs(k))}\), so \(a = ${tx(a)}\).`,
        hints: ["Read the vertex from the graph first.", "Then use the labelled point to work out a."],
      });
    },
  });

  // transformations: describe or build
  const TR = {
    describe(a, h, k) {
      const bits = [];
      if (V(a) < 0) bits.push("a reflection in the x-axis");
      const m = M().fabs(a);
      if (!eq(m, 1)) bits.push(V(m) > 1 ? `a vertical stretch by a factor of ${sx(m)}` : `a vertical compression by a factor of ${sx(m)}`);
      if (!eq(h, 0)) bits.push(`a shift ${sx(M().fabs(h))} ${V(h) > 0 ? "right" : "left"}`);
      if (!eq(k, 0)) bits.push(`a shift ${sx(M().fabs(k))} ${V(k) > 0 ? "up" : "down"}`);
      return bits.length ? bits.join(", ") : "no change";
    },
  };
  fam({
    id: "transform", title: "Transformations of y = x²", topic: "Graphing & transformations", subtopic: "Shifts, stretches and reflections",
    concepts: ["quad.transform"], kinds: ["mc", "wr"], modes: ["simple", "normal", "challenge"], answer: "description / equation",
    complexity: { simple: 1, normal: 2, challenge: 3 }, tags: ["transformations", "vertex form"],
    gen(r, lv, kind) {
      const a = lv === "simple" ? fx(pick(r, [1, -1])) : lv === "normal" ? fx(pick(r, [-1, 2, -2, 3, "1/2", "-1/3"])) : fx(pick(r, ["-3/2", "2/3", "-1/4", 4, -5])), h = hOf(r, lv === "simple" ? "simple" : "normal"), k = kOf(r, lv === "simple" ? "simple" : "normal");
      if (eq(k, 0) || eq(h, k)) throw new Error("plain");
      const t = M().vertexTeX({ a, h, k });
      const hints = ["Work inside-out: the bracket moves the graph left/right, a stretches or reflects, k moves it up/down.", R`\(x - 3\) inside the bracket shifts right 3. A negative \(a\) reflects in the x-axis.`];
      if (kind === "wr") {
        const parts = [{ key: "a", label: "", prompt: "Equation:", kind: "equation", form: "vertex", answer: M().vertexStr({ a, h, k }), marks: 2 }];
        checkWR(parts);
        const desc = TR.describe(a, h, k);
        return { kind: "wr", title: "Build the transformed equation", intro: `The graph of y = x² is transformed by ${desc}. Write the equation of the new parabola in vertex form.`, parts,
          solution: [R`Reflections and stretches set \(a = ${tx(a)}\). The horizontal shift sets \(h = ${tx(h)}\) (right is positive), and the vertical shift sets \(k = ${tx(k)}\).`, R`So \(${t}\).`],
          rubric: ["Correct a (stretch and reflection) — 1 mark; correct h and k — 1 mark"], hints };
      }
      const right = TR.describe(a, h, k);
      const ws = [[a, neg(h), k, "The horizontal shift goes the other way: (x − h) shifts right by h."], [neg(a), h, k, "Check the sign of a: negative means reflected in the x-axis."], [a, h, neg(k), "k is added after squaring, so +k moves up."], [lv === "simple" ? a : div(1, a), h, k, "Stretch vs compression: |a| > 1 stretches (narrower), |a| < 1 compresses (wider)."], [a, k, h, "The two shifts are mixed up."]]
        .map(([a2, h2, k2, why]) => ({ key: TR.describe(a2, h2, k2), tex: cap(TR.describe(a2, h2, k2)) + ".", why }));
      return mc({ key: right, tex: cap(right) + "." }, ws, { q: R`Which transformations of \(y = x^2\) give \(${t}\)?`, e: R`Compare with \(y = a\left(x - h\right)^2 + k\): \(a = ${tx(a)}\), \(h = ${tx(h)}\), \(k = ${tx(k)}\). That is ${right}.`, hints });
    },
  });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  fam({
    id: "predict", title: "Predict the change", topic: "Graphing & transformations", subtopic: "Effect of changing a parameter",
    concepts: ["quad.transform"], kinds: ["mc"], modes: ["normal", "challenge"], answer: "description",
    complexity: { normal: 2, challenge: 3 }, tags: ["parameters", "transformations", "reasoning"],
    gen(r, lv) {
      const a = fx(pick(r, [1, -1, 2, -2, 3])), h = f(nz(r, -5, 5)), k = f(nz(r, -6, 6));
      const changes = lv === "normal"
        ? [{ what: "k", d: nz(r, -6, 6) }, { what: "h", d: nz(r, -6, 6) }]
        : [{ what: "replace", d: nz(r, -5, 5) }, { what: "negate" }, { what: "c", d: nz(r, -6, 6) }, { what: "aflip" }];
      const ch = pick(r, changes);
      const s = stdOf(a, h, k);
      let stem, A2 = a, H2 = h, K2 = k;
      const ft = M().vertexTeX({ a, h, k }, "f(x)");
      if (ch.what === "k") { K2 = add(k, ch.d); stem = R`The \(k\) in \(${ft}\) changes from \(${tx(k)}\) to \(${tx(K2)}\). What happens to the graph?`; }
      else if (ch.what === "h") { H2 = add(h, ch.d); stem = R`In \(${ft}\), the value of \(h\) changes from \(${tx(h)}\) to \(${tx(H2)}\). What happens to the graph?`; }
      else if (ch.what === "replace") { H2 = add(h, ch.d); stem = R`For \(${ft}\), what does the graph of \(y = f\left(x ${ch.d > 0 ? "-" : "+"} ${Math.abs(ch.d)}\right)\) look like compared with \(y = f(x)\)?`; }
      else if (ch.what === "negate") { A2 = neg(a); K2 = neg(k); stem = R`For \(${ft}\), how does the graph of \(y = -f(x)\) compare with the graph of \(y = f(x)\)?`; }
      else if (ch.what === "c") { K2 = add(k, ch.d); stem = R`In \(${M().stdTeX(s, "f(x)")}\), the constant term changes from \(${tx(s.c)}\) to \(${tx(add(s.c, ch.d))}\). What happens to the graph?`; }
      else { A2 = neg(a); stem = R`In \(${ft}\), \(a\) changes from \(${tx(a)}\) to \(${tx(neg(a))}\). What happens to the vertex and the direction of opening?`; }
      const say = (A, H, K) => {
        const parts = [];
        const dx = sub(H, h), dy = sub(K, k);
        if (!eq(A, a)) parts.push(V(A) * V(a) < 0 ? "it flips to open the other way" : V(M().fabs(A)) > V(M().fabs(a)) ? "it gets narrower" : "it gets wider");
        if (!eq(dx, 0)) parts.push(`it moves ${sx(M().fabs(dx))} ${V(dx) > 0 ? "right" : "left"}`);
        if (!eq(dy, 0)) parts.push(`it moves ${sx(M().fabs(dy))} ${V(dy) > 0 ? "up" : "down"}`);
        if (!parts.length) parts.push("nothing changes");
        return { key: `${sx(A)},${sx(H)},${sx(K)}`, tex: cap(parts.join(" and ")) + ". " + R`New vertex \(${M().pointTeX(H, K)}\).` };
      };
      const right = say(A2, H2, K2);
      const ws = [say(A2, sub(mul(h, 2), H2), K2), say(A2, H2, sub(mul(k, 2), K2)), say(a, h, add(k, sub(H2, h))), say(neg(A2), H2, K2), say(A2, K2, H2), say(a, add(h, sub(K2, k)), k)]
        .map((w) => ({ ...w, why: "Track the vertex: work out the new (h, k) and the new a, then compare with the original." }));
      return mc(right, ws, { q: stem, e: R`Original: \(a = ${tx(a)}\), vertex \(${M().pointTeX(h, k)}\). After the change: \(a = ${tx(A2)}\), vertex \(${M().pointTeX(H2, K2)}\). ${right.tex}`, hints: ["Write down the vertex and a before and after the change.", ch.what === "replace" ? "Replacing x with x − d moves the graph d units right." : ch.what === "negate" ? "−f(x) multiplies every y-value by −1: a reflection in the x-axis." : "Compare the old and new vertex."] });
    },
  });

  fam({
    id: "readgraph", title: "Read the key features", topic: "Graphing & transformations", subtopic: "Reading features from a graph",
    concepts: ["quad.graph_read", "quad.intercepts", "quad.axis"], kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "several",
    complexity: { simple: 2, normal: 2, challenge: 3 }, tags: ["graph", "vertex", "intercepts", "axis"],
    gen(r, lv, kind) {
      const p = nz(r, -6, 5), d = 2 * rint(r, 1, 3), s = p + d;
      const a = lv === "simple" ? fx(pick(r, [1, -1])) : fx(pick(r, [1, -1, "1/2", "-1/2", 2, -2]));
      const std = M().fromFactored({ a, r: f(p), s: f(s) });
      const v = vxOf(std);
      if (!isInt(v.k) || !isInt(std.c) || Math.abs(V(v.k)) > 9 || Math.abs(V(std.c)) > 12 || p === 0 || s === 0) throw new Error("off grid");
      const spec = { fns: [{ a: sx(a), b: sx(std.b), c: sx(std.c) }] };
      spec.window = gwin(spec);
      const tok = graphTok(spec, `parabola through (${p}, 0) and (${s}, 0) with vertex (${sx(v.h)}, ${sx(v.k)}) and y-intercept ${sx(std.c)}`);
      const hints = ["Use the grid: every line is 1 unit.", "The axis of symmetry passes through the vertex, halfway between the x-intercepts."];
      if (kind === "mc") {
        return mc(ptChoice(v.h, v.k), [ptChoice(p, 0, "That's where the graph crosses the x-axis."), ptChoice(0, std.c, "That's the y-intercept."), ptChoice(v.k, v.h, "x and y are swapped."), ptChoice(v.h, neg(v.k), "Check whether the vertex is above or below the x-axis.")], { q: `What is the vertex of this parabola? ${tok}`, e: R`The turning point is at \(${M().pointTeX(v.h, v.k)}\), halfway between the x-intercepts \(x = ${p}\) and \(x = ${s}\).`, hints });
      }
      const parts = [
        { key: "a", label: "(a)", prompt: "Vertex:", kind: "point", role: "vertex", answer: { x: sx(v.h), y: sx(v.k) }, marks: 1 },
        { key: "b", label: "(b)", prompt: R`Axis of symmetry: \(x = \)`, kind: "number", answer: V(v.h), ansTex: tx(v.h), ansText: sx(v.h), marks: 1 },
        { key: "c", label: "(c)", prompt: "x-intercepts:", kind: "set", mode: "final", answer: [String(p), String(s)], marks: 1 },
        { key: "d", label: "(d)", prompt: "y-intercept:", kind: "number", answer: V(std.c), ansTex: tx(std.c), ansText: sx(std.c), marks: 1 },
      ];
      checkWR(parts);
      return { kind: "wr", title: "Read the graph", intro: `Use the graph to answer. ${tok}`, parts,
        solution: [R`Vertex (turning point): \(${M().pointTeX(v.h, v.k)}\).`, R`Axis of symmetry: \(x = ${tx(v.h)}\).`, R`x-intercepts (where the graph meets the x-axis): \(x = ${p}\) and \(x = ${s}\).`, R`y-intercept (where it meets the y-axis): \(y = ${tx(std.c)}\).`],
        rubric: ["1 mark for each feature read correctly"], hints };
    },
  });

  fam({
    id: "sketch", title: "Plot the parabola", topic: "Graphing & transformations", subtopic: "Sketching from key features",
    concepts: ["quad.sketch", "quad.vertex_form"], kinds: ["wr"], modes: ["simple", "normal", "challenge", "nightmare"], answer: "plot",
    complexity: { simple: 2, normal: 2, challenge: 3, nightmare: 3 }, tags: ["graph", "plot", "interactive"],
    gen(r, lv) {
      const a = lv === "simple" ? fx(pick(r, [1, -1])) : fx(pick(r, [1, -1, 2, -2, 3, -3])), h = f(nz(r, -4, 4)), k = f(nz(r, -5, 5));
      const std = stdOf(a, h, k);
      const useStd = hard(lv);
      if (useStd && (eq(std.b, 0) || Math.abs(V(std.c)) > 40)) throw new Error("messy");
      const t = useStd ? M().stdTeX(std) : M().vertexTeX({ a, h, k });
      const window = { x0: Math.min(-6, V(h) - 4), x1: Math.max(6, V(h) + 4), y0: Math.min(-6, V(k) - 5), y1: Math.max(6, V(k) + 5) };
      const parts = [{ key: "a", label: "", prompt: "Place the vertex, then one more point on the parabola.", kind: "plot", window, answer: { a: sx(a), h: sx(h), k: sx(k) }, marks: 2 }];
      checkWR(parts);
      return { kind: "wr", title: "Plot the parabola", intro: R`Plot \(${t}\) on the grid.`, parts,
        solution: [useStd ? R`Complete the square first: \(${t} = ${M().vertexTeX({ a, h, k }, "")}\).` : R`Read the vertex from vertex form: \(${M().pointTeX(h, k)}\).`, R`One unit right of the vertex, \(y\) changes by \(a = ${tx(a)}\), so the point \(${M().pointTeX(add(h, 1), add(k, a))}\) is on the graph.`],
        rubric: ["Vertex in the right place — 1 mark", "Correct shape (a second correct point) — 1 mark"], hints: ["Start with the vertex (h, k).", R`From the vertex, go 1 right and \(a\) up (or down if \(a < 0\)).`] };
    },
  });

  fam({
    id: "eqfromgraph", title: "Write the equation from a graph", topic: "Graphing & transformations", subtopic: "Equation from vertex and a point",
    concepts: ["quad.equation_from", "quad.graph_read"], prereqs: ["quad.vertex_form"], kinds: ["wr"], modes: ["normal", "challenge"], answer: "equation (vertex form)",
    complexity: { normal: 3, challenge: 3 }, tags: ["graph", "vertex form", "find a"],
    gen(r, lv) {
      const a = fx(pick(r, lv === "normal" ? [1, -1, 2, -2, "1/2", "-1/2"] : ["1/2", "-1/2", "1/3", "-2/3", 3, -3, "3/2"])), h = f(nz(r, -4, 4)), k = f(nz(r, -5, 5));
      const dx = isInt(a) ? fx(pick(r, [1, 2, -2])) : fx(pick(r, [2, -2, 3, -3]));
      const P = { x: add(h, dx), y: add(k, mul(a, mul(dx, dx))) };
      if (!isInt(P.y) || Math.abs(V(P.y)) > 12) throw new Error("off grid");
      const spec = { fns: [{ a: sx(a), h: sx(h), k: sx(k) }], marks: { vertex: true }, points: [{ x: sx(P.x), y: sx(P.y), label: `(${sx(P.x)}, ${sx(P.y)})` }] };
      spec.window = gwin(spec);
      const parts = [{ key: "a", label: "", prompt: "Equation in vertex form:", kind: "equation", form: "vertex", answer: M().vertexStr({ a, h, k }), marks: 2 }];
      checkWR(parts);
      return { kind: "wr", title: "Equation from a graph", intro: `The graph shows a parabola with its vertex marked and one labelled point. ${graphTok(spec, `${describeVertex(a, h, k)}, passing through (${sx(P.x)}, ${sx(P.y)})`)}`, parts,
        solution: [R`Vertex \(${M().pointTeX(h, k)}\), so \(y = a${M().shiftTeX(h)}^2 ${V(k) < 0 ? "-" : "+"} ${tx(M().fabs(k))}\).`, R`Substitute \(${M().pointTeX(P.x, P.y)}\): \(${tx(P.y)} = a${pp(dx)}^2 ${V(k) < 0 ? "-" : "+"} ${tx(M().fabs(k))}\), so \(${tx(sub(P.y, k))} = ${tx(mul(dx, dx))}a\) and \(a = ${tx(a)}\).`, R`\(${M().vertexTeX({ a, h, k })}\)`],
        rubric: ["Correct vertex in the equation — 1 mark", "Correct a from the second point — 1 mark"], hints: ["Read the vertex, then write y = a(x − h)² + k with a still unknown.", "Substitute the labelled point to solve for a."] };
    },
  });

  fam({
    id: "table", title: "Patterns in a table", topic: "Graphing & transformations", subtopic: "Tables of values",
    concepts: ["quad.graph_read", "quad.axis"], kinds: ["wr", "nr"], modes: ["normal", "challenge"], answer: "several",
    complexity: { normal: 2, challenge: 3 }, tags: ["table", "symmetry", "second differences", "representation"],
    gen(r, lv, kind) {
      const a = fx(pick(r, [1, -1, 2, -2, 3, "1/2"])), h = f(nz(r, -4, 4)), k = f(nz(r, -9, 9));
      const step = lv === "challenge" ? 1 : 1, off = lv === "challenge" ? rint(r, -2, 2) : 0;
      const xs = Array.from({ length: 6 }, (_, i) => add(add(h, -3 + off), i * step));
      const ys = xs.map((x) => add(k, mul(a, mul(sub(x, h), sub(x, h)))));
      if (ys.some((y) => !isInt(y) || Math.abs(V(y)) > 60)) throw new Error("table");
      if (lv === "challenge" && off === 0) throw new Error("make it off-centre");
      const table = `<table class="qtable"><tr><th>x</th>${xs.map((x) => `<td>${sx(x)}</td>`).join("")}</tr><tr><th>y</th>${ys.map((y) => `<td>${sx(y)}</td>`).join("")}</tr></table>`;
      const d2 = mul(2, a);
      const hints = ["Look for two x-values with the same y: the axis of symmetry is halfway between them.", "For a quadratic, the second differences are constant and equal to 2a (when x goes up by 1)."];
      if (kind === "nr") return { kind: "nr", q: `The table shows values of a quadratic function. What is the value of a in y = a(x − h)² + k? ${table}`, answer: V(a), ansTex: tx(a), fmt: "Number", e: R`First differences: ${ys.slice(1).map((y, i) => sx(sub(y, ys[i]))).join(", ")}. Second differences are all \(${tx(d2)}\), and second difference \(= 2a\), so \(a = ${tx(a)}\).`, hints };
      const parts = [
        { key: "a", label: "(a)", prompt: R`Axis of symmetry: \(x = \)`, kind: "number", answer: V(h), ansTex: tx(h), ansText: sx(h), marks: 1 },
        { key: "b", label: "(b)", prompt: "Vertex:", kind: "point", role: "vertex", answer: { x: sx(h), y: sx(k) }, marks: 1 },
        { key: "c", label: "(c)", prompt: "Equation in vertex form:", kind: "equation", form: "vertex", answer: M().vertexStr({ a, h, k }), marks: 2 },
      ];
      checkWR(parts);
      return { kind: "wr", title: "Read the table", intro: `The table shows values of a quadratic function. ${table}`, parts,
        solution: [R`Equal y-values come in pairs around \(x = ${tx(h)}\), so that's the axis.`, R`At \(x = ${tx(h)}\), \(y = ${tx(k)}\): the vertex is \(${M().pointTeX(h, k)}\)${xs.some((x) => eq(x, h)) ? "" : " (use the symmetry, or the equation)"}.`, R`Second differences are \(${tx(d2)} = 2a\), so \(a = ${tx(a)}\) and \(${M().vertexTeX({ a, h, k })}\).`],
        rubric: ["(a), (b) 1 mark each", "(c) correct a — 1 mark; correct equation — 1 mark"], hints };
    },
  });

  // ─── Intercepts and roots ─────────────────────────────────────
  fam({
    id: "yint", title: "y-intercept", topic: "Intercepts & roots", subtopic: "y-intercept",
    concepts: ["quad.intercepts"], kinds: ["nr", "mc"], modes: ["simple", "normal", "challenge"], answer: "number",
    complexity: { simple: 1, normal: 2, challenge: 2 }, tags: ["intercepts", "substitute x = 0"],
    gen(r, lv, kind) {
      const form = lv === "simple" ? "std" : pick(r, ["vertex", "factored", lv === "challenge" ? "vertex" : "std"]);
      let t, y0, e, trap;
      if (form === "std") { const s = { a: f(nz(r, -5, 5)), b: f(nz(r, -9, 9)), c: f(nz(r, -12, 12)) }; t = M().stdTeX(s); y0 = s.c; trap = s.b; e = R`At the y-axis \(x = 0\), so every \(x\)-term vanishes: \(y = ${tx(s.c)}\).`; }
      else if (form === "vertex") { const a = aOf(r, lv), h = f(nz(r, -6, 6)), k = f(nz(r, -9, 9)); t = M().vertexTeX({ a, h, k }); y0 = add(mul(a, mul(h, h)), k); trap = k; e = R`Set \(x = 0\): \(y = ${coefTeX(a)}${M().shiftTeX(h).replace(/x/, "0")}^2 ${V(k) < 0 ? "-" : "+"} ${tx(M().fabs(k))} = ${tx(y0)}\). (The y-intercept is not k.)`; }
      else { const a = nz(r, -3, 3), p = nz(r, -7, 7), q = nz(r, -7, 7); t = R`y = ${a === 1 ? "" : a === -1 ? "-" : a}\left(x ${p < 0 ? "+" : "-"} ${Math.abs(p)}\right)\left(x ${q < 0 ? "+" : "-"} ${Math.abs(q)}\right)`; y0 = f(a * p * q); trap = f(p + q); e = R`Set \(x = 0\): \(y = ${a}\left(0 - ${par(p)}\right)\left(0 - ${par(q)}\right) = ${tx(y0)}\).`; }
      if (eq(y0, trap)) throw new Error("trap equals answer");
      const hints = ["The y-intercept is where the graph crosses the y-axis, so x = 0.", "Substitute x = 0 and simplify."];
      if (kind === "nr") return { kind: "nr", q: R`What is the y-intercept of \(${t}\)?`, answer: V(y0), ansTex: tx(y0), fmt: "Number", e, hints };
      const ch = (v, why) => ({ key: sx(v), tex: `\\(${tx(v)}\\)`, why });
      return mc(ch(y0), [ch(trap, form === "vertex" ? "k is the y-coordinate of the vertex, not the y-intercept." : "Set x = 0: only the constant survives."), ch(neg(y0), "Sign slip: substitute carefully."), ch(add(y0, 1), "Recheck the arithmetic."), ch(mul(y0, 2), "Recheck the arithmetic.")], { q: R`What is the y-intercept of \(${t}\)?`, e, hints });
    },
  });

  fam({
    id: "zfactored", title: "Zeros from factored form", topic: "Intercepts & roots", subtopic: "x-intercepts from factored form",
    concepts: ["quad.factored_form", "quad.intercepts"], kinds: ["mc", "wr"], modes: ["simple", "normal", "challenge"], answer: "set",
    complexity: { simple: 1, normal: 2, challenge: 3 }, tags: ["zeros", "factored form", "sign trap"],
    gen(r, lv, kind) {
      const p = nz(r, -7, 7), q = nz(r, -7, 7);
      if (p === q || p === -q) throw new Error("ambiguous");
      const m = lv === "challenge" ? nz(r, 2, 3) : 1, a = lv === "simple" ? 1 : nz(r, -3, 3);
      // challenge: (m x − p)(x − q) → zero p/m
      const z1 = f(p, m), z2 = f(q);
      if (eq(z1, z2) || eq(z1, neg(z2))) throw new Error("repeated or mirrored zeros");
      const lin1 = m === 1 ? `\\left(x ${p < 0 ? "+" : "-"} ${Math.abs(p)}\\right)` : `\\left(${m}x ${p < 0 ? "+" : "-"} ${Math.abs(p)}\\right)`;
      const t = `y = ${a === 1 ? "" : a === -1 ? "-" : a}${lin1}\\left(x ${q < 0 ? "+" : "-"} ${Math.abs(q)}\\right)`;
      const e = R`A product is 0 when a factor is 0. ${m === 1 ? R`\(x - ${par(p)} = 0\) gives \(x = ${p}\)` : R`\(${m}x - ${par(p)} = 0\) gives \(x = ${tx(z1)}\)`}, and \(x - ${par(q)} = 0\) gives \(x = ${q}\).${a !== 1 ? ` The factor ${a} never makes y = 0.` : ""}`;
      const hints = ["Set each bracket equal to zero.", "x − 4 = 0 gives x = 4: the zero has the opposite sign to the number in the bracket."];
      if (kind === "wr") {
        const parts = [{ key: "a", label: "", prompt: "x-intercepts:", kind: "set", mode: "final", answer: [sx(z1), sx(z2)], marks: 1 }];
        checkWR(parts);
        return { kind: "wr", title: "Zeros from factored form", intro: R`Find the x-intercepts of \(${t}\).`, parts, solution: [e], rubric: ["Both zeros — 1 mark"], hints };
      }
      const S = (x, y, why) => ({ key: [sx(x), sx(y)].sort().join("|"), tex: R`\(x = ${tx(x)}\) and \(x = ${tx(y)}\)`, why });
      return mc(S(z1, z2), [S(neg(z1), neg(z2), "Each zero has the opposite sign to the number in its bracket."), S(f(p), z2, "Divide by the x-coefficient too: mx − p = 0 gives x = p/m."), S(neg(z1), z2, "Check the sign on the first factor."), S(f(a), z2, "The leading factor doesn't give a zero.")], { q: R`What are the x-intercepts of \(${t}\)?`, e, hints });
    },
  });

  fam({
    id: "solve", title: "Solve for the zeros", topic: "Intercepts & roots", subtopic: "Factoring and the quadratic formula",
    concepts: ["quad.formula", "quad.intercepts", "quad.factored_form"], prereqs: ["factoring.trinomials", "radicals.simplify"], kinds: ["wr", "mc"], modes: ["normal", "challenge", "nightmare"], answer: "set (exact)",
    complexity: { normal: 2, challenge: 3, nightmare: 4 }, tags: ["zeros", "quadratic formula", "radicals"],
    gen(r, lv, kind) {
      let s;
      if (lv === "normal" && r() < 0.6) { const p = nz(r, -8, 8), q = nz(r, -8, 8); if (p === q) throw new Error("double"); s = M().fromFactored({ a: f(1), r: f(p), s: f(q) }); }
      else { s = { a: f(lv === "normal" ? pick(r, [1, 1, 2]) : nz(r, -4, 4)), b: f(nz(r, -9, 9)), c: f(nz(r, -9, 9)) }; }
      const D = M().disc(s);
      if (V(D) <= 0) throw new Error("want two real roots");
      const rt = M().roots(s);
      if (lv === "challenge" && rt.rational && r() < 0.7) throw new Error("make it irrational");
      for (const v of rt.values) if (Math.abs(V(s.a) * v * v + V(s.b) * v + V(s.c)) > 1e-9) throw new Error("root check");
      const formula = R`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} = \frac{${tx(neg(s.b))} \pm \sqrt{${tx(D)}}}{${tx(mul(2, s.a))}}`;
      const steps = [R`Here \(a = ${tx(s.a)}\), \(b = ${tx(s.b)}\), \(c = ${tx(s.c)}\), and \(b^2 - 4ac = ${par(s.b)}^2 - 4${pp(s.a)}${pp(s.c)} = ${tx(D)}\).`, R`\(${formula}\)`, R`So \(x = ${rt.tex}\).`];
      const hints = [rt.rational ? "Try factoring first: find two numbers that multiply to ac and add to b." : "It doesn't factor nicely, so use the quadratic formula.", R`The discriminant is \(b^2 - 4ac = ${tx(D)}\).`];
      if (kind === "mc") {
        const S = (strs, why) => ({ key: strs.map((x) => Chk().read(x).value.toFixed(9)).sort().join("|"), tex: `\\(x = ${strs.map((x) => Chk().read(x).tex).join(",\\ x = ")}\\)`, why });
        const negR = M().roots({ a: s.a, b: neg(s.b), c: s.c });
        const halfA = M().roots({ a: mul(s.a, 2), b: s.b, c: s.c });
        const plusC = M().roots({ a: s.a, b: s.b, c: neg(s.c) });
        const cands = [negR.count === 2 ? S(negR.strs, "Sign slip: the formula starts with −b.") : null, halfA.count === 2 ? S(halfA.strs, "The whole numerator is divided by 2a.") : null, plusC.count === 2 ? S(plusC.strs, "Sign slip inside the discriminant: it's b² − 4ac.") : null, (() => { const dbl = M().roots({ a: div(s.a, 4), b: div(s.b, 2), c: s.c }); return dbl.count === 2 ? S(dbl.strs, "Divide by 2a, not by a.") : null; })()];
        return mc(S(rt.strs), cands, { q: R`Solve \(${M().stdTeX(s, "")} = 0\).`, e: steps.join(" "), hints });
      }
      const parts = [{ key: "a", label: "", prompt: "Exact solution(s):", kind: "set", mode: "final", answer: rt.strs, marks: 3 }];
      checkWR(parts);
      return { kind: "wr", title: "Find the zeros", intro: R`Find the exact x-intercepts of \(${M().stdTeX(s)}\).`, parts, solution: steps, rubric: ["Correct method (factoring or the formula with a, b, c substituted) — 1 mark", "Correct discriminant / factors — 1 mark", "Both exact zeros, simplified — 1 mark"], hints };
    },
  });

  fam({
    id: "zvertex", title: "Zeros from vertex form", topic: "Intercepts & roots", subtopic: "x-intercepts from vertex form",
    concepts: ["quad.intercepts", "quad.vertex_form"], prereqs: ["radicals.simplify"], kinds: ["wr"], modes: ["normal", "challenge"], answer: "set (exact)",
    complexity: { normal: 2, challenge: 3 }, tags: ["zeros", "square root", "radicals"],
    gen(r, lv) {
      const a = fx(pick(r, lv === "normal" ? [1, -1, 2, -2] : [2, -2, 3, -3, "1/2"])), h = f(nz(r, -6, 6));
      const sq = lv === "normal" ? pick(r, [1, 4, 9, 16, 25]) : pick(r, [2, 3, 5, 6, 7, 8, 12, 18, 20]);
      const k = mul(neg(a), sq);
      if (!isInt(k)) throw new Error("k");
      const s = stdOf(a, h, k);
      const rt = M().roots(s);
      if (rt.count !== 2) throw new Error("count");
      const parts = [{ key: "a", label: "", prompt: "Exact x-intercepts:", kind: "set", mode: "final", answer: rt.strs, marks: 3 }];
      checkWR(parts);
      const [ss, tt] = M().sqrtSplit(sq);
      const root = tt === 1 ? String(ss) : `${ss === 1 ? "" : ss}\\sqrt{${tt}}`;
      return { kind: "wr", title: "Zeros from vertex form", intro: R`Find the exact x-intercepts of \(${M().vertexTeX({ a, h, k })}\).`, parts,
        solution: [R`Set \(y = 0\): \(${coefTeX(a)}${M().shiftTeX(h)}^2 = ${tx(neg(k))}\), so \(${M().shiftTeX(h)}^2 = ${sq}\).`, R`Take square roots (both signs): \(x - ${par(h)} = \pm ${root}\).`, R`\(x = ${tx(h)} \pm ${root}\), i.e. \(x = ${rt.tex}\).`],
        rubric: ["Isolate the square — 1 mark", "± square root — 1 mark", "Both exact zeros — 1 mark"], hints: ["Set y = 0 and isolate the squared bracket.", "Don't forget ± when you take the square root."] };
    },
  });

  fam({
    id: "count", title: "How many x-intercepts?", topic: "Intercepts & roots", subtopic: "Number of real roots",
    concepts: ["quad.discriminant"], kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "choice",
    complexity: { simple: 1, normal: 2, challenge: 3 }, tags: ["discriminant", "reasoning", "vertex position"],
    gen(r, lv) {
      const n = pick(r, [0, 1, 2]);
      let t, e;
      if (lv !== "challenge" && r() < 0.6) {
        const a = aOf(r, lv === "simple" ? "simple" : "normal"), h = f(nz(r, -5, 5));
        const k = n === 1 ? f(0) : f((n === 2 ? -1 : 1) * Math.sign(V(a)) * rint(r, 1, 9));
        t = M().vertexTeX({ a, h, k });
        const toward = (V(k) < 0 && V(a) > 0) || (V(k) > 0 && V(a) < 0);
        e = R`The vertex is \(${M().pointTeX(h, k)}\) and the graph opens ${V(a) > 0 ? "up" : "down"}. ` + (n === 1 ? "The vertex sits on the x-axis, so the graph touches it exactly once." : toward ? `The vertex is ${V(k) < 0 ? "below" : "above"} the x-axis and the graph opens toward the axis, so it crosses twice.` : `The vertex is ${V(k) > 0 ? "above" : "below"} the x-axis and the graph opens away from it, so it never crosses.`);
      } else {
        const a = nz(r, -4, 4), b = nz(r, -10, 10);
        let c;
        if (n === 1) { if ((b * b) % (4 * a) !== 0) throw new Error("no exact c"); c = (b * b) / (4 * a); }
        else c = nz(r, -12, 12);
        const D = b * b - 4 * a * c;
        if ((D > 0 ? 2 : D === 0 ? 1 : 0) !== n) throw new Error("retry");
        t = M().stdTeX({ a: f(a), b: f(b), c: f(c) });
        e = R`Discriminant: \(b^2 - 4ac = ${par(b)}^2 - 4${pp(a)}${pp(c)} = ${D}\). ${D > 0 ? "Positive: two x-intercepts." : D === 0 ? "Zero: exactly one (the vertex touches the axis)." : "Negative: no real roots, so no x-intercepts."}`;
      }
      const ch = (m, why) => ({ key: String(m), tex: m === 0 ? "No x-intercepts" : m === 1 ? "Exactly one x-intercept" : "Two x-intercepts", why });
      return mc(ch(n), [0, 1, 2].filter((m) => m !== n).map((m) => ch(m, "Use the discriminant b² − 4ac (positive: 2, zero: 1, negative: 0), or picture where the vertex sits and which way the graph opens.")).concat([{ key: "x", tex: "It can't be decided without graphing", why: "It can: the discriminant (or the vertex and the direction) decides it." }]), {
        q: R`How many x-intercepts does \(${t}\) have?`, e,
        hints: ["Either compute b² − 4ac, or sketch the vertex and the direction of opening.", "b² − 4ac > 0: two · = 0: one · < 0: none."],
      });
    },
  });

  fam({
    id: "disc", title: "Discriminant", topic: "Intercepts & roots", subtopic: "Discriminant",
    concepts: ["quad.discriminant"], prereqs: ["quad.basics"], kinds: ["nr"], modes: ["normal", "challenge", "nightmare"], answer: "number",
    complexity: { normal: 2, challenge: 3, nightmare: 3 }, tags: ["discriminant", "parameter"],
    gen(r, lv) {
      if (lv === "normal") {
        const a = nz(r, -5, 5), b = nz(r, -11, 11), c = nz(r, -9, 9);
        const D = b * b - 4 * a * c;
        return { kind: "nr", q: R`What is the discriminant of \(${M().stdTeX({ a: f(a), b: f(b), c: f(c) }, "")} = 0\)?`, answer: D, fmt: "Integer", e: R`\(b^2 - 4ac = ${par(b)}^2 - 4${pp(a)}${pp(c)} = ${D}\).`, hints: ["Discriminant = b² − 4ac.", "Square b first (it's always non-negative), then subtract 4ac."] };
      }
      // parameter: exactly one root
      const form = pick(r, ["c", "b", "a"]);
      if (form === "c") { const a = nz(r, -4, 4), b = 2 * nz(r, -8, 8); const k = div(b * b, 4 * a); if (!isInt(k)) throw new Error("k"); return { kind: "nr", q: R`For what value of \(k\) does \(${M().stdTeX({ a: f(a), b: f(b), c: f(0) }, "y").replace(/$/, "")} + k\) have exactly one x-intercept?`, answer: V(k), ansTex: tx(k), fmt: "Number", e: R`One root means \(b^2 - 4ac = 0\): \(${par(b)}^2 - 4${pp(a)}k = 0\), so \(k = \frac{${b * b}}{${4 * a}} = ${tx(k)}\).`, hints: ["Exactly one x-intercept ⇔ discriminant = 0.", R`Set \(b^2 - 4ac = 0\) and solve for \(k\).`] }; }
      if (form === "a") { const b = nz(r, -10, 10), c = nz(r, -9, 9); const k = div(b * b, 4 * c); if (!isInt(k) || eq(k, 0)) throw new Error("k"); return { kind: "nr", q: R`For what value of \(k\) does \(y = kx^2 ${b < 0 ? "-" : "+"} ${Math.abs(b)}x ${c < 0 ? "-" : "+"} ${Math.abs(c)}\) have exactly one x-intercept?`, answer: V(k), ansTex: tx(k), fmt: "Number", e: R`Set the discriminant to 0: \(${par(b)}^2 - 4k${par(c)} = 0\), so \(k = \frac{${b * b}}{${4 * c}} = ${tx(k)}\).`, hints: ["Exactly one x-intercept ⇔ discriminant = 0.", "Here a is the unknown k."] }; }
      const a = nz(r, 1, 4), c = pick(r, [1, 4, 9, 16, 25, 36]);
      const k = 2 * Math.sqrt(a * c);
      if (!Number.isInteger(k)) throw new Error("k");
      return { kind: "nr", q: R`For what positive value of \(k\) does \(y = ${a === 1 ? "" : a}x^2 + kx + ${c}\) have exactly one x-intercept?`, answer: k, fmt: "Number", e: R`Set \(k^2 - 4${pp(a)}${pp(c)} = 0\): \(k^2 = ${4 * a * c}\), so \(k = \pm ${k}\). The positive value is \(${k}\).`, hints: ["Exactly one x-intercept ⇔ discriminant = 0.", R`\(k^2 = 4ac\); take the positive root.`] };
    },
  });

  fam({
    id: "projectile", title: "Projectile in flight", topic: "Mixed & applied", subtopic: "Projectiles",
    concepts: ["quad.applications", "quad.standard_vertex", "quad.formula"], prereqs: ["quad.standard_vertex"], kinds: ["wr"], modes: ["normal", "challenge"], answer: "numbers",
    complexity: { normal: 3, challenge: 4 }, tags: ["context", "max", "rounding"],
    gen(r, lv) {
      // h(t) = −5t² + vt + h0  (g ≈ 10 m/s², so the vertex is exact)
      const v = 10 * rint(r, 1, 4) + (lv === "challenge" ? 5 : 0), h0 = rint(r, 1, 30);
      const s = { a: f(-5), b: f(v), c: f(h0) };
      const vx = vxOf(s);
      const rt = M().roots(s);
      const land = Math.max(...rt.values);
      const land2 = Math.round(land * 100) / 100;
      const exact = rt.strs[rt.values.indexOf(land)];
      const t1 = 1, h1 = V(M().evalStd(s, t1));
      const parts = [
        { key: "a", label: "(a)", prompt: "Initial height (m):", kind: "number", answer: h0, marks: 1 },
        { key: "b", label: "(b)", prompt: "Time to reach the maximum height (s):", kind: "number", answer: V(vx.h), ansText: sx(vx.h), marks: 1 },
        { key: "c", label: "(c)", prompt: "Maximum height (m):", kind: "number", answer: V(vx.k), ansText: sx(vx.k), marks: 1 },
        { key: "d", label: "(d)", prompt: "When does it hit the ground? Round to the nearest hundredth of a second.", kind: "number", answer: land2, round: 2, exact, marks: 2 },
      ];
      checkWR(parts);
      return { kind: "wr", title: "Projectile", intro: R`A ball is thrown so that its height in metres after \(t\) seconds is \(h(t) = -5t^2 + ${v}t + ${h0}\).`, parts,
        solution: [R`(a) At \(t = 0\): \(h(0) = ${h0}\) m.`, R`(b) \(t = -\frac{b}{2a} = -\frac{${v}}{2\left(-5\right)} = ${tx(vx.h)}\) s.`, R`(c) \(h\left(${tx(vx.h)}\right) = -5${pp(vx.h)}^2 + ${v}${pp(vx.h)} + ${h0} = ${tx(vx.k)}\) m.`, R`(d) Solve \(-5t^2 + ${v}t + ${h0} = 0\): \(t = \frac{-${v} \pm \sqrt{${v * v} + ${20 * h0}}}{-10}\). Only the positive time makes sense: \(t \approx ${land2}\) s. (Check: \(h(${t1}) = ${h1}\) m, still in the air.)`],
        rubric: ["(a)–(c) 1 mark each", "(d) correct method with the quadratic formula — 1 mark; correct rounded positive time — 1 mark"], hints: ["The maximum is at the vertex: t = −b / (2a).", "It hits the ground when h(t) = 0. Reject the negative time."] };
    },
  });

  // ─── Mixed and applied ────────────────────────────────────────
  fam({
    id: "compare", title: "Compare two quadratics", topic: "Mixed & applied", subtopic: "Comparing functions",
    concepts: ["quad.vertex_form", "quad.standard_vertex", "quad.direction"], kinds: ["mc"], modes: ["normal", "challenge"], answer: "statement",
    complexity: { normal: 3, challenge: 4 }, tags: ["compare", "reasoning", "multiple representations"],
    gen(r, lv) {
      const a1 = fx(pick(r, [1, -1, 2, -2, 3])), h1 = f(nz(r, -5, 5)), k1 = f(nz(r, -8, 8));
      const a2 = fx(pick(r, [1, -1, 2, -2, "1/2"])), h2 = f(nz(r, -5, 5)), k2 = f(nz(r, -8, 8));
      const s2 = stdOf(a2, h2, k2);
      if (!isInt(s2.b) || !isInt(s2.c) || eq(h1, h2) || eq(k1, k2) || eq(M().fabs(a1), M().fabs(a2))) throw new Error("tie");
      const gDesc = lv === "challenge" ? `\\(${M().stdTeX(s2, "g(x)")}\\)` : `\\(${M().stdTeX(s2, "g(x)")}\\)`;
      const stmts = [
        { t: "f and g open in the same direction.", v: V(a1) * V(a2) > 0 },
        { t: "The vertex of f is to the right of the vertex of g.", v: V(h1) > V(h2) },
        { t: "The vertex of f is higher than the vertex of g.", v: V(k1) > V(k2) },
        { t: "f is narrower than g.", v: V(M().fabs(a1)) > V(M().fabs(a2)) },
        { t: "f and g have the same axis of symmetry.", v: eq(h1, h2) },
        { t: "g has a larger y-intercept than f.", v: V(s2.c) > V(add(mul(a1, mul(h1, h1)), k1)) },
      ];
      const trues = stmts.filter((x) => x.v), falses = stmts.filter((x) => !x.v);
      if (!trues.length || falses.length < 3) throw new Error("balance");
      const T0 = pick(r, trues);
      return mc({ key: T0.t, tex: T0.t }, shuffle(r, falses).map((x) => ({ key: x.t, tex: x.t, why: "Find each function's vertex, a, and y-intercept, then check this statement against them." })), {
        q: R`Let \(${M().vertexTeX({ a: a1, h: h1, k: k1 }, "f(x)")}\) and ${gDesc}. Which statement is true?`,
        e: R`f: vertex \(${M().pointTeX(h1, k1)}\), \(a = ${tx(a1)}\), y-intercept \(${tx(add(mul(a1, mul(h1, h1)), k1))}\). g: complete the square to get \(${M().vertexTeX({ a: a2, h: h2, k: k2 }, "g(x)")}\), vertex \(${M().pointTeX(h2, k2)}\), \(a = ${tx(a2)}\), y-intercept \(${tx(s2.c)}\). So "${T0.t}" is the true statement.`,
        hints: ["Put both functions in the same form so you can compare vertex, a and y-intercept.", "For g, use h = −b/(2a) to find its vertex."],
      });
    },
  });

  fam({
    id: "fixerror", title: "Find the error", topic: "Mixed & applied", subtopic: "Error analysis",
    concepts: ["quad.complete_square"], prereqs: ["quad.complete_square"], kinds: ["mc"], modes: ["normal", "challenge", "nightmare"], answer: "line",
    complexity: { normal: 3, challenge: 4, nightmare: 4 }, tags: ["error analysis", "completing the square"],
    gen(r, lv) {
      const a = fx(pick(r, lv === "normal" ? [2, 3, -2] : [2, 3, -2, -3, "1/2", 4])), h = f(nz(r, -5, 5)), k = f(nz(r, -9, 9));
      const s = stdOf(a, h, k);
      if (!isInt(s.b) || !isInt(s.c) || Math.abs(V(s.b)) > 40) throw new Error("messy");
      const ba = div(s.b, a), half = div(ba, 2), sq = mul(half, half);
      const sgn = (x) => (V(x) < 0 ? "-" : "+"), ab = (x) => tx(M().fabs(x)), abx = (x) => (eq(M().fabs(x), 1) ? "" : ab(x));
      const good = [
        R`y = ${tx(a)}\left(x^2 ${sgn(ba)} ${abx(ba)}x\right) ${sgn(s.c)} ${ab(s.c)}`,
        R`y = ${tx(a)}\left(x^2 ${sgn(ba)} ${abx(ba)}x + ${tx(sq)} - ${tx(sq)}\right) ${sgn(s.c)} ${ab(s.c)}`,
        R`y = ${tx(a)}${M().shiftTeX(h)}^2 ${sgn(neg(mul(a, sq)))} ${ab(mul(a, sq))} ${sgn(s.c)} ${ab(s.c)}`,
        R`${M().vertexTeX({ a, h, k })}`,
      ];
      const lines = good.slice();
      const err = rint(r, 1, 4);
      let why;
      if (err === 1) { lines[0] = R`y = ${tx(a)}\left(x^2 ${sgn(s.b)} ${abx(s.b)}x\right) ${sgn(s.c)} ${ab(s.c)}`; why = R`Line 1 factors \(${tx(a)}\) out of \(${tx(a)}x^2\) but not out of the \(x\)-term: inside the bracket it should be \(${tx(ba)}x\).`; if (eq(s.b, ba)) throw new Error("no visible error"); }
      if (err === 2) { lines[1] = R`y = ${tx(a)}\left(x^2 ${sgn(ba)} ${abx(ba)}x + ${tx(sq)}\right) ${sgn(s.c)} ${ab(s.c)}`; lines[2] = R`y = ${tx(a)}${M().shiftTeX(h)}^2 ${sgn(s.c)} ${ab(s.c)}`; lines[3] = R`${M().vertexTeX({ a, h, k: s.c })}`; why = R`Line 2 adds \(${tx(sq)}\) inside the bracket but never takes it away again, so the function changes. It needs \(- ${tx(sq)}\) inside too (worth \(${tx(neg(mul(a, sq)))}\) once it leaves the bracket).`; }
      if (err === 3) { lines[2] = R`y = ${tx(a)}${M().shiftTeX(h)}^2 - ${tx(sq)} ${sgn(s.c)} ${ab(s.c)}`; lines[3] = R`y = ${tx(a)}${M().shiftTeX(h)}^2 ${sgn(sub(s.c, sq))} ${ab(sub(s.c, sq))}`; why = R`Line 3 moves \(-${tx(sq)}\) out of the bracket without multiplying it by \(${tx(a)}\). It should be \(${tx(neg(mul(a, sq)))}\).`; if (eq(a, 1)) throw new Error("no visible error"); }
      if (err === 4) { lines[3] = M().vertexTeX({ a, h: neg(h), k }); why = R`Line 4 flips the sign inside the bracket: \(${M().shiftTeX(h)}^2\) has \(h = ${tx(h)}\), so it stays \(${M().shiftTeX(h)}\).`; }
      const work = `<div class="work"><span class="ln">Start</span>\\(${M().stdTeX(s)}\\)${lines.map((l, i) => `<span class="ln">Line ${i + 1}</span>\\(${l}\\)`).join("")}</div>`;
      const order = [err, ...[1, 2, 3, 4].filter((x) => x !== err)];
      return { kind: "mc", q: R`A student completed the square:${work}In which line is the <b>first</b> error?`, c: order.map((x) => `Line ${x}`), order: [1, 2, 3, 4].map((x) => order.indexOf(x)),
        why: [null, ...order.slice(1).map((x) => (x > err ? "This line follows correctly from the one before it. The error is earlier." : "This line is correct."))],
        e: why + R` The correct result is \(${M().vertexTeX({ a, h, k })}\).`, hints: ["Check each line by expanding it back to standard form.", "The usual slips: forgetting to divide b by a, squaring b instead of b/2, and not multiplying the subtracted square by a."], _lines: [M().stdTeX(s), ...lines], _err: err };
    },
  });

  fam({
    id: "fromroots", title: "Equation from the zeros", topic: "Mixed & applied", subtopic: "Equation from intercepts and a point",
    concepts: ["quad.equation_from", "quad.factored_form"], kinds: ["wr"], modes: ["normal", "challenge"], answer: "equation",
    complexity: { normal: 3, challenge: 4 }, tags: ["factored form", "find a", "multi-step"],
    gen(r, lv) {
      const p = nz(r, -6, 6), q = nz(r, -6, 6); if (p === q) throw new Error("double");
      const a = fx(pick(r, lv === "normal" ? [1, -1, 2, -2, 3] : ["1/2", "-1/2", "3/2", -3, "2/3"]));
      const px = nz(r, -4, 4); if (px === p || px === q) throw new Error("on root");
      const py = mul(a, (px - p) * (px - q));
      if (!isInt(py) || Math.abs(V(py)) > 60) throw new Error("big");
      const std = M().fromFactored({ a, r: f(p), s: f(q) });
      const v = vxOf(std);
      const facStr = `y=${eq(a, 1) ? "" : eq(a, -1) ? "-" : `(${sx(a)})`}(x${p < 0 ? "+" : "-"}${Math.abs(p)})(x${q < 0 ? "+" : "-"}${Math.abs(q)})`;
      const parts = [
        { key: "a", label: "(a)", prompt: "Equation (any form):", kind: "equation", form: "any", answer: facStr, marks: 2 },
        { key: "b", label: "(b)", prompt: "Vertex:", kind: "point", role: "vertex", answer: { x: sx(v.h), y: sx(v.k) }, marks: 1 },
      ];
      checkWR(parts);
      return { kind: "wr", title: "Equation from the zeros", intro: R`A parabola has x-intercepts \(${p}\) and \(${q}\) and passes through \(\left(${px}, ${tx(py)}\right)\).`, parts,
        solution: [R`Factored form: \(y = a\left(x - ${par(p)}\right)\left(x - ${par(q)}\right)\).`, R`Substitute \(\left(${px}, ${tx(py)}\right)\): \(${tx(py)} = a\left(${px} - ${par(p)}\right)\left(${px} - ${par(q)}\right) = ${(px - p) * (px - q)}a\), so \(a = ${tx(a)}\).`, R`\(${M().factoredTeX({ a, r: f(p), s: f(q) })}\)`, R`The vertex is halfway between the zeros at \(x = ${tx(v.h)}\), and \(y = ${tx(v.k)}\) there.`],
        rubric: ["(a) factored form with the zeros — 1 mark; correct a — 1 mark", "(b) correct vertex — 1 mark"], hints: ["Start from y = a(x − r)(x − s) using the two zeros.", "Substitute the given point to find a."] };
    },
  });

  fam({
    id: "mirror", title: "Mirror point", topic: "Vertex & axis", subtopic: "Symmetry of points",
    concepts: ["quad.axis"], kinds: ["nr"], modes: ["simple", "normal", "challenge"], answer: "number",
    complexity: { simple: 1, normal: 2, challenge: 2 }, tags: ["symmetry"],
    gen(r, lv) {
      const h = lv === "challenge" ? f(nz(r, -9, 9), 2) : f(nz(r, -6, 6)), x1 = add(h, nz(r, -6, 6)), y1 = nz(r, -15, 15);
      const x2 = sub(mul(h, 2), x1);
      return { kind: "nr", q: R`A parabola has its vertex at \(${M().pointTeX(h, f(rint(r, -9, 9)))}\) and passes through \(${M().pointTeX(x1, f(y1))}\). It also passes through \(\left(m, ${y1}\right)\) with \(m \ne ${tx(x1)}\). Find \(m\).`, answer: V(x2), ansTex: tx(x2), fmt: "Number",
        e: R`Points at the same height are mirror images across the axis \(x = ${tx(h)}\). \(${tx(x1)}\) is \(${tx(M().fabs(sub(x1, h)))}\) units from the axis, so \(m = ${tx(h)} ${V(sub(x1, h)) > 0 ? "-" : "+"} ${tx(M().fabs(sub(x1, h)))} = ${tx(x2)}\).`, hints: ["The axis of symmetry is x = h.", "The mirror point is the same distance from the axis on the other side: m = 2h − x."] };
    },
  });

  fam({
    id: "optimize", title: "Maximize it", topic: "Mixed & applied", subtopic: "Optimization in context",
    concepts: ["quad.applications"], prereqs: ["quad.standard_vertex"], kinds: ["wr"], modes: ["normal", "challenge"], answer: "numbers",
    complexity: { normal: 3, challenge: 4 }, tags: ["context", "max", "modelling"],
    gen(r, lv) {
      const kind = pick(r, ["fence", "revenue"]);
      if (kind === "fence") {
        const L = 4 * rint(r, 10, 60);
        // A(x) = x(L − 2x): width x perpendicular to the wall
        const s = { a: f(-2), b: f(L), c: f(0) }; const v = vxOf(s);
        const parts = [
          { key: "a", label: "(a)", prompt: R`For which widths is the area zero?`, kind: "set", mode: "final", answer: ["0", String(L / 2)], marks: 1 },
          { key: "b", label: "(b)", prompt: R`Width \(x\) (m) that gives the largest area:`, kind: "number", answer: V(v.h), ansText: sx(v.h), marks: 1 },
          { key: "c", label: "(c)", prompt: "Length of the side parallel to the wall (m):", kind: "number", answer: L - 2 * V(v.h), marks: 1 },
          { key: "d", label: "(d)", prompt: "Largest area (m²):", kind: "number", answer: V(v.k), ansText: sx(v.k), marks: 2 },
        ];
        checkWR(parts);
        return { kind: "wr", title: "Fence along a wall", intro: R`A farmer has ${L} m of fencing for a rectangular pen against a long wall (no fence needed on the wall side). With width \(x\) m (the two sides touching the wall), the area is \(A(x) = x\left(${L} - 2x\right)\).`, parts,
          solution: [R`(a) \(A(x) = x\left(${L} - 2x\right) = 0\) when \(x = 0\) or \(x = ${L / 2}\).`, R`(b) \(A(x) = -2x^2 + ${L}x\) opens down, so the maximum is at the vertex, halfway between the zeros: \(x = -\frac{${L}}{2\left(-2\right)} = ${tx(v.h)}\) m.`, R`(c) The parallel side is \(${L} - 2\cdot ${tx(v.h)} = ${L - 2 * V(v.h)}\) m.`, R`(d) \(A\left(${tx(v.h)}\right) = ${tx(v.h)}\left(${L} - 2\cdot ${tx(v.h)}\right) = ${tx(v.k)}\) m².`],
          rubric: ["(a) both zeros — 1 mark", "(b) vertex x-value — 1 mark", "(c) 1 mark", "(d) correct substitution — 1 mark; correct area — 1 mark"], hints: ["Expand A(x) to see a and b.", "The maximum is at the vertex."] };
      }
      const p = rint(r, 8, 20), n0 = 10 * rint(r, 20, 60), d = rint(r, 5, 20);
      // R(x) = (p + x)(n0 − d x), x = number of $1 increases
      const s = { a: f(-d), b: f(n0 - d * p), c: f(p * n0) };
      const v = vxOf(s);
      if (!isInt(v.h) || V(v.h) <= 0) throw new Error("want a whole positive increase");
      const parts = [
        { key: "a", label: "(a)", prompt: R`Number of \$1 increases \(x\) that maximizes revenue:`, kind: "number", answer: V(v.h), marks: 1 },
        { key: "b", label: "(b)", prompt: "Best ticket price ($):", kind: "number", answer: p + V(v.h), marks: 1 },
        { key: "c", label: "(c)", prompt: "Tickets sold at that price:", kind: "number", answer: n0 - d * V(v.h), marks: 1 },
        { key: "d", label: "(d)", prompt: "Maximum revenue ($):", kind: "number", answer: V(v.k), marks: 2 },
      ];
      checkWR(parts);
      return { kind: "wr", title: "Ticket pricing", intro: R`A theatre sells ${n0} tickets at $${p} each. For every $1 increase in price, ${d} fewer tickets are sold. With \(x\) one-dollar increases, revenue is \(R(x) = \left(${p} + x\right)\left(${n0} - ${d}x\right)\).`, parts,
        solution: [R`Expand: \(R(x) = ${M().stdTeX(s, "")}\).`, R`(a) Maximum at \(x = -\frac{${tx(s.b)}}{2\left(${-d}\right)} = ${tx(v.h)}\).`, R`(b) Price: \(${p} + ${tx(v.h)} = ${p + V(v.h)}\) dollars. (c) Tickets: \(${n0} - ${d}\cdot ${tx(v.h)} = ${n0 - d * V(v.h)}\).`, R`(d) \(R\left(${tx(v.h)}\right) = \left(${p + V(v.h)}\right)\left(${n0 - d * V(v.h)}\right) = ${tx(v.k)}\) dollars.`],
        rubric: ["(a) vertex — 1 mark", "(b), (c) 1 mark each", "(d) substitution — 1 mark; correct maximum — 1 mark"], hints: ["Expand R(x) into standard form.", "The best number of increases is at the vertex, x = −b/(2a). The price is p + x."] };
    },
  });

  // ═════════════════════════ NIGHTMARE: one connected gauntlet ═════════════════════════
  // Every stage is built from the same seed, so all five revolve around the same function f.
  function nmBase(seed) {
    for (let i = 0; i < 400; i++) {
      const r = rng(seed * 104729 + i * 7919 + 13);
      const a = fx(pick(r, [2, -2, 3, -3, 4, -4])), h = f(nz(r, -9, 9) | 1, 2), c = f(nz(r, -9, 9));
      const b = mul(mul(-2, a), h);
      const std = { a, b, c }, v = vxOf(std);
      if (!isInt(b) || eq(v.k, 0)) continue;
      const rt = M().roots(std);
      if (rt.count !== 2 || rt.rational) continue; // irrational zeros, so Stage 2 needs the formula
      const d = f(1, 2), e = add(v.k, nz(r, -4, 4));
      // g(x) = −f(x − ½) + e : vertex (h + ½, e − k) must land on the grid for the plot
      const g = { a: neg(a), h: add(v.h, d), k: sub(e, v.k) };
      if (!isInt(g.h) || !isInt(g.k) || Math.abs(V(g.k)) > 6 || Math.abs(V(g.h)) > 6) continue;
      // f(x) = g(x) must have two real solutions
      const diff = M().psub(M().polyOf(std), M().polyOf(stdOf(g.a, g.h, g.k)));
      const dq = { a: diff[2], b: diff[1], c: diff[0] };
      const meet = M().roots(dq);
      if (meet.count !== 2) continue;
      return { r, a, h: v.h, k: v.k, std, rt, d, e, g, dq, meet };
    }
    throw new Error("no nightmare base");
  }
  const nmIntro = (B) => R`Throughout this gauntlet, \(${M().stdTeX(B.std, "f(x)")}\).`;
  fam({ id: "nm1", title: "Stage 1 · Take it apart", topic: "Vertex & axis", subtopic: "Completing the square", concepts: ["quad.complete_square", "quad.vertex_form"], kinds: ["wr"], modes: ["nightmare"], answer: "several", complexity: { nightmare: 5 }, tags: ["nightmare", "connected"],
    gen(r, lv, kind, ctx) {
      const B = nmBase(ctx.seed);
      const v = { a: B.a, h: B.h, k: B.k };
      const parts = [
        { key: "a", label: "(a)", prompt: R`Write \(f\) in vertex form.`, kind: "equation", form: "vertex", answer: M().vertexStr(v), marks: 2 },
        { key: "b", label: "(b)", prompt: "Vertex of f:", kind: "point", role: "vertex", answer: { x: sx(B.h), y: sx(B.k) }, marks: 1 },
        { key: "c", label: "(c)", prompt: R`Axis of symmetry: \(x = \)`, kind: "number", answer: V(B.h), ansTex: tx(B.h), ansText: sx(B.h), marks: 1 },
        { key: "d", label: "(d)", prompt: `${V(B.a) > 0 ? "Minimum" : "Maximum"} value of f:`, kind: "number", answer: V(B.k), ansTex: tx(B.k), ansText: sx(B.k), marks: 1 },
      ];
      checkWR(parts);
      return { kind: "wr", title: "Stage 1 · Take it apart", intro: nmIntro(B), parts, solution: ctsSteps(B.std).concat([R`Vertex \(${M().pointTeX(B.h, B.k)}\); axis \(x = ${tx(B.h)}\); ${V(B.a) > 0 ? "minimum" : "maximum"} \(${tx(B.k)}\).`]), rubric: ["(a) method — 1 mark, answer — 1 mark", "(b)–(d) 1 mark each"], hints: [] };
    } });
  fam({ id: "nm2", title: "Stage 2 · Where it crosses", topic: "Intercepts & roots", subtopic: "Quadratic formula", concepts: ["quad.formula", "quad.intercepts", "radicals.simplify"], kinds: ["wr"], modes: ["nightmare"], answer: "several", complexity: { nightmare: 5 }, tags: ["nightmare", "connected", "radicals"],
    gen(r, lv, kind, ctx) {
      const B = nmBase(ctx.seed);
      const D = M().disc(B.std);
      const dist = mul(2, B.rt.q); // distance between the zeros: 2q√t
      const distStr = `${eq(dist, 1) ? "" : isInt(dist) ? sx(dist) : `(${sx(dist)})`}√${B.rt.t}`.replace(/^\((\d+)\/(\d+)\)√(\d+)$/, "$1√$3/$2");
      const parts = [
        { key: "a", label: "(a)", prompt: "y-intercept of f:", kind: "number", answer: V(B.std.c), marks: 1 },
        { key: "b", label: "(b)", prompt: "Exact x-intercepts of f:", kind: "set", mode: "final", answer: B.rt.strs, marks: 2 },
        { key: "c", label: "(c)", prompt: "Exact distance between the two x-intercepts (simplest form):", kind: "expr", form: "simplest", answer: distStr, marks: 2 },
      ];
      if (!close(Chk().read(distStr).value, B.rt.values[1] - B.rt.values[0])) throw new Error("distance");
      checkWR(parts);
      return { kind: "wr", title: "Stage 2 · Where it crosses", intro: nmIntro(B), parts,
        solution: [R`(a) \(f(0) = ${tx(B.std.c)}\).`, R`(b) \(b^2 - 4ac = ${par(B.std.b)}^2 - 4${pp(B.a)}${pp(B.std.c)} = ${tx(D)}\), so \(x = ${B.rt.tex}\).`, R`(c) The zeros are \(${tx(B.h)} \pm\) the same amount, so the distance is twice the radical part: \(${Chk().read(distStr).tex}\).`],
        rubric: ["(a) 1 mark", "(b) discriminant — 1 mark; both exact zeros — 1 mark", "(c) correct value — 1 mark; simplest form — 1 mark"], hints: [] };
    } });
  fam({ id: "nm3", title: "Stage 3 · Flip and shift", topic: "Graphing & transformations", subtopic: "Transformations of a function", concepts: ["quad.transform", "quad.sketch"], kinds: ["wr"], modes: ["nightmare"], answer: "several", complexity: { nightmare: 5 }, tags: ["nightmare", "connected", "plot"],
    gen(r, lv, kind, ctx) {
      const B = nmBase(ctx.seed);
      const g = B.g;
      const window = { x0: Math.min(-7, V(g.h) - 4), x1: Math.max(7, V(g.h) + 4), y0: Math.min(-7, V(g.k) - 5), y1: Math.max(7, V(g.k) + 5) };
      const parts = [
        { key: "a", label: "(a)", prompt: R`Write \(g\) in vertex form.`, kind: "equation", form: "vertex", answer: M().vertexStr(g), marks: 2 },
        { key: "b", label: "(b)", prompt: "Vertex of g:", kind: "point", role: "vertex", answer: { x: sx(g.h), y: sx(g.k) }, marks: 1 },
        { key: "c", label: "(c)", prompt: "Plot g: place its vertex and one more point.", kind: "plot", window, answer: { a: sx(g.a), h: sx(g.h), k: sx(g.k) }, marks: 2 },
      ];
      checkWR(parts);
      const eT = V(B.e) < 0 ? `- ${tx(M().fabs(B.e))}` : `+ ${tx(B.e)}`;
      return { kind: "wr", title: "Stage 3 · Flip and shift", intro: nmIntro(B) + R` Let \(g(x) = -f\left(x - \frac{1}{2}\right) ${eT}\).`, parts,
        solution: [R`Start from Stage 1: \(${M().vertexTeX({ a: B.a, h: B.h, k: B.k }, "f(x)")}\).`, R`\(f\left(x - \frac{1}{2}\right)\) moves the vertex \(\frac{1}{2}\) right, to \(x = ${tx(g.h)}\).`, R`The minus sign reflects in the x-axis: \(a \to ${tx(g.a)}\) and \(k \to ${tx(neg(B.k))}\). Then add \(${tx(B.e)}\): \(k = ${tx(g.k)}\).`, R`\(${M().vertexTeX(g, "g(x)")}\), vertex \(${M().pointTeX(g.h, g.k)}\).`],
        rubric: ["(a) reflection and stretch — 1 mark; both shifts — 1 mark", "(b) 1 mark", "(c) vertex — 1 mark; shape — 1 mark"], hints: [] };
    } });
  fam({ id: "nm4", title: "Stage 4 · Collision course", topic: "Mixed & applied", subtopic: "Solving f(x) = g(x)", concepts: ["quad.formula", "quad.discriminant", "quad.direction"], kinds: ["wr"], modes: ["nightmare"], answer: "several", complexity: { nightmare: 5 }, tags: ["nightmare", "connected", "reasoning"],
    gen(r, lv, kind, ctx) {
      const B = nmBase(ctx.seed);
      for (const x of B.meet.values) if (!close(V(B.a) * x * x + V(B.std.b) * x + V(B.std.c), V(B.g.a) * (x - V(B.g.h)) ** 2 + V(B.g.k))) throw new Error("meet check");
      const up = V(B.a) > 0;
      const parts = [
        { key: "a", label: "(a)", prompt: R`Solve \(f(x) = g(x)\) exactly.`, kind: "set", mode: "final", answer: B.meet.strs, marks: 2 },
        { key: "b", label: "(b)", prompt: R`The equation \(f(x) = m\) has exactly one solution when \(m = \)`, kind: "number", answer: V(B.k), ansTex: tx(B.k), ansText: sx(B.k), marks: 1 },
        { key: "c", label: "(c)", prompt: R`\(f(x) = m\) has <b>no</b> real solutions when:`, kind: "choice", choices: [`m < ${sx(B.k)}`, `m > ${sx(B.k)}`], answer: up ? `m < ${sx(B.k)}` : `m > ${sx(B.k)}`, marks: 1 },
      ];
      checkWR(parts);
      return { kind: "wr", title: "Stage 4 · Collision course", intro: nmIntro(B) + R` \(g\) is the function from Stage 3.`, parts,
        solution: [R`(a) Set \(f(x) - g(x) = 0\): \(${M().stdTeX(B.dq, "")} = 0\). The formula gives \(x = ${B.meet.tex}\).`, R`(b) The horizontal line \(y = m\) touches the parabola once only at the vertex height: \(m = ${tx(B.k)}\).`, R`(c) f opens ${up ? "up, so it never goes below" : "down, so it never goes above"} \(${tx(B.k)}\): no solutions when \(m ${up ? "<" : ">"} ${tx(B.k)}\).`],
        rubric: ["(a) correct quadratic — 1 mark; both exact solutions — 1 mark", "(b), (c) 1 mark each"], hints: [] };
    } });
  fam({ id: "nm5", title: "Stage 5 · The final check", topic: "Mixed & applied", subtopic: "Error analysis and symmetry", concepts: ["quad.complete_square", "quad.axis", "quad.equation_from"], kinds: ["wr"], modes: ["nightmare"], answer: "several", complexity: { nightmare: 5 }, tags: ["nightmare", "connected", "error analysis"],
    gen(r, lv, kind, ctx) {
      const B = nmBase(ctx.seed);
      const s = B.std, a = B.a, ba = div(s.b, a), half = div(ba, 2), sq = mul(half, half);
      const sgn = (x) => (V(x) < 0 ? "-" : "+"), ab = (x) => tx(M().fabs(x)), abx = (x) => (eq(M().fabs(x), 1) ? "" : ab(x));
      const err = 1 + (ctx.seed % 3);
      const L = [
        R`f(x) = ${tx(a)}\left(x^2 ${sgn(ba)} ${abx(ba)}x\right) ${sgn(s.c)} ${ab(s.c)}`,
        R`f(x) = ${tx(a)}\left(x^2 ${sgn(ba)} ${abx(ba)}x + ${tx(sq)}\right) - ${tx(sq)} ${sgn(s.c)} ${ab(s.c)}`,
        R`f(x) = ${tx(a)}${M().shiftTeX(B.h)}^2 ${sgn(sub(s.c, sq))} ${ab(sub(s.c, sq))}`,
      ];
      // the planted error is always the subtracted square not multiplied by a (line 2), shown at a varying position
      const lines = err === 1 ? [R`f(x) = ${tx(a)}\left(x^2 ${sgn(s.b)} ${abx(s.b)}x\right) ${sgn(s.c)} ${ab(s.c)}`, ...L.slice(1)] : err === 2 ? L : [L[0], R`f(x) = ${tx(a)}\left(x^2 ${sgn(ba)} ${abx(ba)}x + ${tx(sq)}\right) - ${tx(mul(a, sq))} ${sgn(s.c)} ${ab(s.c)}`, R`f(x) = ${tx(a)}${M().shiftTeX(neg(B.h))}^2 ${sgn(B.k)} ${ab(B.k)}`];
      const work = `<div class="work">${lines.map((l, i) => `<span class="ln">Line ${i + 1}</span>\\(${l}\\)`).join("")}</div>`;
      const px = add(B.h, f(3, 2)), mirror = sub(B.h, f(3, 2));
      // parabola with the same vertex through the origin
      const a0 = div(neg(B.k), mul(B.h, B.h));
      const parts = [
        { key: "a", label: "(a)", prompt: R`A student rewrote \(f\):${work}Which line has the first error?`, kind: "choice", choices: ["Line 1", "Line 2", "Line 3"], answer: `Line ${err}`, marks: 1 },
        { key: "b", label: "(b)", prompt: R`The point \(\left(${tx(px)}, f\left(${tx(px)}\right)\right)\) is on f. Another point on f has the same y-value. What is its x-coordinate?`, kind: "number", answer: V(mirror), ansTex: tx(mirror), ansText: sx(mirror), marks: 1 },
        { key: "c", label: "(c)", prompt: R`Write the equation, in vertex form, of the parabola with the same vertex as f that passes through the origin.`, kind: "equation", form: "vertex", answer: M().vertexStr({ a: a0, h: B.h, k: B.k }), marks: 2 },
      ];
      checkWR(parts);
      const why = err === 1 ? R`Line 1 doesn't divide b by a inside the bracket.` : err === 2 ? R`Line 2 subtracts \(${tx(sq)}\) outside the bracket without multiplying by \(${tx(a)}\).` : R`Line 3 flips the sign of h.`;
      return { kind: "wr", title: "Stage 5 · The final check", intro: nmIntro(B), parts,
        solution: [R`(a) ${why}`, R`(b) Mirror across \(x = ${tx(B.h)}\): \(2\cdot ${par(B.h)} - ${par(px)} = ${tx(mirror)}\).`, R`(c) \(y = a${M().shiftTeX(B.h)}^2 ${sgn(B.k)} ${ab(B.k)}\) through \(\left(0, 0\right)\): \(0 = a${pp(B.h)}^2 ${sgn(B.k)} ${ab(B.k)}\), so \(a = ${tx(a0)}\): \(${M().vertexTeX({ a: a0, h: B.h, k: B.k })}\).`],
        rubric: ["(a), (b) 1 mark each", "(c) method — 1 mark; answer — 1 mark"], hints: [] };
    } });
  function buildNightmare(rnd = Math.random) {
    for (let i = 0; i < 200; i++) {
      const seed = 1 + Math.floor(rnd() * 2147483646);
      try { return ["nm1", "nm2", "nm3", "nm4", "nm5"].map((id) => make(id, "wr", "nightmare", seed)); } catch { /* re-seed */ }
    }
    throw new Error("could not build the gauntlet");
  }

  // ═════════════════════════ assembly ═════════════════════════
  const byFam = new Map(FAMILIES.map((x) => [x.id, x]));
  // a float answer back to an exact fraction string (denominators up to 1000)
  function asFraction(x) {
    if (Number.isInteger(x)) return String(x);
    for (let d = 2; d <= 1000; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-12) return sx(f(n, d)); }
    return String(x);
  }
  function make(famId, kind, lv, seed) {
    const F = byFam.get(famId);
    if (!F) throw new Error("no family " + famId);
    if (!F.kinds.includes(kind)) throw new Error(`${famId} has no ${kind}`);
    if (!F.modes.includes(lv)) throw new Error(`${famId} not in ${lv}`);
    const r = rng(seed * 7919 + famId.length * 104729 + LV.indexOf(lv) * 31 + kind.length);
    const out = F.gen(r, lv, kind, { seed });
    if (out.kind !== kind) throw new Error("kind mismatch");
    const { kind: _k, ...q } = out;
    const id = `qd-${VERSION}-${famId}-${kind}-${LV_CODE[lv]}-${seed.toString(36)}`;
    const meta = { family: famId, mode: lv, subtopic: F.subtopic, prereqs: F.prereqs, answerFormat: F.answer, complexity: F.complexity[lv] || 2, tags: F.tags };
    const res = { ...q, id, topic: F.topic, concepts: F.concepts, meta, hints: q.hints || [] };
    if (kind === "mc") res.c = res.c.map((s) => (/^\\\(/.test(s) && !/\\displaystyle/.test(s) ? s.replace(/^\\\(/, "\\(\\displaystyle ") : s));
    if (kind === "nr" && !res.fmt) res.fmt = "Number";
    if (kind === "nr") {
      res.ansText = res.ansText || asFraction(res.answer);
      if (!res.ansTex) res.ansTex = tx(res.ansText);
      const g = Chk().grade({ kind: "number", answer: res.answer, marks: 1 }, res.ansText);
      if (g.verdict !== "right" || !close(V(res.ansText), res.answer)) throw new Error("nr key");
    }
    return res;
  }
  function generate(famId, kind, lv, rnd = Math.random) {
    for (let i = 0; i < 300; i++) {
      const seed = 1 + Math.floor(rnd() * 2147483646);
      try { return make(famId, kind, lv, seed); } catch { /* rejected: re-seed */ }
    }
    throw new Error(`could not build ${famId}/${kind}/${lv}`);
  }
  const cache = new Map();
  function byId(id) {
    if (cache.has(id)) return cache.get(id);
    const m = /^qd-(\d+)-([a-z0-9]+)-(mc|nr|wr)-([sncx])-([0-9a-z]+)$/.exec(id || "");
    if (!m || Number(m[1]) !== VERSION) return null;
    try { const q = make(m[2], m[3], CODE_LV[m[4]], parseInt(m[5], 36)); cache.set(id, q); return q; } catch { return null; }
  }

  // test layouts (marks: WR 4/5/2/3/5 = 19, NR 5, MC 10 → 34, like the unit test)
  // Simple: an easier assessment (not a tutorial) — foundational families at Simple values, shorter reasoning chains.
  // WR 4/2/2/1 = 9, NR 5, MC 10 → 24 marks.
  const WR_SLOTS = {
    simple: [["readgraph"], ["vform"], ["sketch", "transform"], ["zfactored"]],
    normal: [["readgraph"], ["cts"], ["sketch", "eqfromgraph"], ["solve", "zvertex", "fromroots_n"], ["projectile", "optimize"]],
    challenge: [["readgraph", "table"], ["cts"], ["sketch", "eqfromgraph"], ["solve", "zvertex"], ["projectile", "optimize"]],
  };
  const NR_POOL = { simple: ["coeffs", "axis", "maxmin", "yint", "mirror", "vform"], normal: ["coeffs", "axis", "vstd", "maxmin", "yint", "disc", "mirror", "vform"], challenge: ["axis", "vstd", "maxmin", "yint", "disc", "mirror", "table", "coeffs"] };
  const MC_POOL = { simple: ["identify", "coeffs", "direction", "vform", "axis", "maxmin", "features", "matchgraph", "graphtoeq", "transform", "readgraph", "yint", "zfactored", "count"],
    normal: ["identify", "direction", "width", "vform", "axis", "vstd", "features", "matchgraph", "graphtoeq", "transform", "predict", "readgraph", "zfactored", "count", "yint", "compare", "fixerror", "cts", "maxmin", "solve"],
    challenge: ["identify", "direction", "width", "vform", "vstd", "features", "matchgraph", "graphtoeq", "transform", "predict", "zfactored", "count", "compare", "fixerror", "cts", "solve", "axis", "coeffs"] };
  function buildTest(lv, rnd = Math.random) {
    const L = lv === "challenge" || lv === "simple" ? lv : "normal";
    const wr = WR_SLOTS[L].map((opts, i) => {
      let famId = opts[Math.floor(rnd() * opts.length)];
      if (famId === "fromroots_n") famId = "fromroots";
      // slot 4 must be worth 3 marks
      if (i === 3 && famId === "fromroots") famId = "fromroots";
      return generate(famId, "wr", L, rnd);
    });
    const pickN = (pool, n) => { const out = []; let bag = []; while (out.length < n) { if (!bag.length) bag = pool.slice().sort(() => rnd() - 0.5); out.push(bag.pop()); } return out; };
    const nr = pickN(NR_POOL[L], 5).map((fid) => generate(fid, "nr", L, rnd));
    const mcs = pickN(MC_POOL[L], 10).map((fid) => generate(fid, "mc", L, rnd));
    return { wr, nr, mc: mcs };
  }

  // Practice items for one concept: [kind, question, partKey] from every family tagged with it,
  // round-robin across families so a quiz mixes question types. Fresh instances every call.
  function practicePool(conceptId, lv = "normal", n = 8, rnd = Math.random, opts = {}) {
    const fams = FAMILIES.filter((F) => !F.id.startsWith("nm") && F.concepts.includes(conceptId) && (!opts.families || opts.families.includes(F.id)));
    const plan = [];
    for (const F of fams) {
      const mode = F.modes.includes(lv) ? lv : lv === "simple" && F.modes.includes("normal") ? "normal" : lv === "challenge" && F.modes.includes("normal") ? "normal" : F.modes[0];
      for (const kind of F.kinds) if (!opts.kinds || opts.kinds.includes(kind)) plan.push([F.id, kind, mode]);
    }
    if (!plan.length) return [];
    const out = [];
    let order = plan.slice().sort(() => rnd() - 0.5);
    for (let i = 0; out.length < n && i < n * 4; i++) {
      if (!order.length) order = plan.slice().sort(() => rnd() - 0.5);
      const [fid, kind, mode] = order.pop();
      try {
        const q = generate(fid, kind, mode, rnd);
        if (kind === "wr") { const p = q.parts[Math.floor(rnd() * q.parts.length)]; out.push(["wr", q, p.key]); }
        else out.push([kind, q, null]);
      } catch { /* skip */ }
    }
    return out;
  }
  // which concepts have practice, and in which modes (for honest UI labels)
  const conceptFamilies = (conceptId) => FAMILIES.filter((F) => !F.id.startsWith("nm") && F.concepts.includes(conceptId));

  const api = { VERSION, FAMILIES, byFam, make, generate, byId, buildTest, buildNightmare, practicePool, conceptFamilies, rng, LV, WR_SLOTS, NR_POOL, MC_POOL, ctsSteps };
  root.QuadBank = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
