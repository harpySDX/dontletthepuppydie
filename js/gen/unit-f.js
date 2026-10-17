/*
 * Unit F — new quadratics families (the 30 existing families in js/quad-bank.js are adapted into the same registry):
 * vertex ↔ standard conversion, standard ↔ factored, domain and range, function notation, solving by factoring,
 * by square roots and graphically, and building a graph on an EMPTY grid.
 * Algebraic answers are graded by exact polynomial equality (QuadCheck/AnswerCheck), never by text.
 */
(function (root) {
  "use strict";
  const B = root.Bank; if (!B) return;
  const { K } = B;
  const R = String.raw;
  const QM = () => root.QuadMath;
  const fx = (s) => QM().fparse(String(s));

  // a for each mode: Simple keeps |a| = 1; Normal small integers; Challenge adds fractions
  const pickA = (r, mode) => (mode === "simple" ? K.pick(r, [1, -1]) : mode === "normal" ? K.pick(r, [2, -2, 3, -3, -1, 1, 4]) : K.pick(r, ["1/2", "-1/2", "3/2", "-2", "3", "-3", "1/3"]));

  B.family({
    id: "f_vertex_to_std", unit: "F", sub: "F.vertex_to_std", title: "Vertex form → standard form", concepts: ["quad.vertex_form", "quad.basics"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "equation (standard form)", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["expand vertex form", "expand and state c (y-intercept)", "find the expansion error"],
    gen(r, mode, kind) {
      const M = QM();
      const a = fx(pickA(r, mode)), h = M.F(K.nz(r, -6, 6)), k = M.F(K.int(r, -9, 9));
      const std = M.toStandard({ a, h, k });
      const vTeX = M.vertexTeX({ a, h, k }), sTeX = M.stdTeX(std);
      const hh = M.fval(h);
      if (kind === "mc") {
        // common slips: forgetting to multiply k? forgetting 2hx, sign of h, not distributing a
        const w1 = { a, b: M.fmul(M.fmul(-2, a), M.fneg(h)), c: std.c };                  // sign of h
        const w2 = { a, b: M.fmul(-2, h), c: M.fadd(M.fmul(h, h), k) };                    // a not distributed
        const w3 = { a, b: M.F(0), c: M.fadd(M.fmul(a, M.fmul(h, h)), k) };                // (x − h)² = x² − h²... missing middle
        const w4 = { a, b: std.b, c: M.fadd(M.fmul(a, M.fmul(h, h)), M.fneg(k)) };          // sign of k
        const opts = [w1, w2, w3, w4].map((w) => R`\(${M.stdTeX(w)}\)`);
        return { ...K.mc(R`\(${sTeX}\)`, opts), template: "find the expansion error", sig: `mc|${vTeX}`,
          q: R`Which is \(${vTeX}\) in standard form?`,
          e: R`\(\left(x ${hh > 0 ? "-" : "+"} ${Math.abs(hh)}\right)^2 = x^2 ${hh > 0 ? "-" : "+"} ${2 * Math.abs(hh)}x + ${hh * hh}\). Multiply every term by \(a\), then add \(k\): \(${sTeX}\).`,
          hints: ["Expand the square first: (x − h)² = x² − 2hx + h².", "Then distribute a to every term, then add k."] };
      }
      const twoPart = mode !== "simple" && K.coin(r);
      const parts = [{ key: "a", label: twoPart ? "(a)" : "", prompt: "Standard form:", kind: "equation", form: "standard", answer: M.stdStr(std), marks: 2 }];
      if (twoPart) parts.push({ key: "b", label: "(b)", prompt: "y-intercept (the value of c):", kind: "expr", form: "value", answer: M.fstr(std.c), marks: 1 });
      return { kind: "wr", template: twoPart ? "expand and state c (y-intercept)" : "expand vertex form", sig: `${vTeX}|${twoPart}`,
        title: "Vertex form to standard form", intro: R`Rewrite \(${vTeX}\) in standard form \(y = ax^2 + bx + c\).`,
        parts,
        solution: [R`Expand the square: \(\left(x ${hh > 0 ? "-" : "+"} ${Math.abs(hh)}\right)^2 = x^2 ${hh > 0 ? "-" : "+"} ${2 * Math.abs(hh)}x + ${hh * hh}\).`, R`Multiply by \(a = ${M.ftex(a)}\) and add \(k = ${M.ftex(k)}\): \(${sTeX}\).`, ...(twoPart ? [R`The y-intercept is \(c = ${M.ftex(std.c)}\) (set x = 0).`] : [])],
        rubric: ["Square expanded — 1", "a distributed and k added — 1"], hints: ["(x − h)² = x² − 2hx + h². Don't forget the middle term.", "Multiply every term of the expansion by a, then add k."] };
    },
  });

  B.family({
    id: "f_std_factored", unit: "F", sub: "F.std_factored", subs: ["F.std_factored", "F.solve_factor"], title: "Standard ↔ factored form", concepts: ["quad.factored_form"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "equation (factored / standard)", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["factor y = x² + bx + c", "factor with a ≠ 1", "expand factored form", "does it factor? (discriminant)"],
    gen(r, mode) {
      const M = QM();
      const T = mode === "simple" ? K.pick(r, ["factor1", "expand"]) : mode === "normal" ? K.pick(r, ["factor1", "expand", "factorA"]) : K.pick(r, ["factorA", "notfact", "expand"]);
      if (T === "notfact") {
        // a quadratic whose discriminant isn't a perfect square: it has no integer factored form — answer: zeros exact
        const b = K.nz(r, -8, 8), c = K.nz(r, -9, 9);
        const D = b * b - 4 * c; const s = Math.round(Math.sqrt(Math.max(D, 0)));
        if (D <= 0 || s * s === D) throw new Error("need irrational roots");
        const rt = M.roots({ a: M.F(1), b: M.F(b), c: M.F(c) });
        return { kind: "wr", template: "does it factor? (discriminant)", sig: `nf|${b}|${c}`, title: "Factored form", intro: R`Consider \(y = ${K.polyTeX([c, b, 1])}\).`,
          parts: [
            { key: "a", label: "(a)", prompt: "The discriminant b² − 4ac:", kind: "expr", form: "value", answer: String(D), marks: 1 },
            { key: "b", label: "(b)", prompt: "The zeros, exactly (they don't come from integer factors):", kind: "set", mode: "final", answer: rt.strs, marks: 2 },
          ],
          solution: [R`\(b^2 - 4ac = ${b * b} - 4(${c}) = ${D}\), which isn't a perfect square, so there are no integer factors.`, R`Use the formula: \(x = ${rt.tex}\).`], rubric: ["Discriminant — 1", "Exact zeros — 2"],
          hints: ["If b² − 4ac isn't a perfect square, the quadratic doesn't factor over the integers.", "Then use x = (−b ± √(b² − 4ac)) / 2a."] };
      }
      const a = T === "factorA" ? K.pick(r, [2, 3, -2, 4, 5]) : T === "expand" && mode !== "simple" ? K.pick(r, [1, -1, 2, 3, -2]) : 1;
      let p = K.nz(r, -8, 8), q = K.nz(r, -8, 8);
      if (T !== "expand" && p === q) throw new Error("square");
      // y = a(x − p)(x − q)
      const std = M.toStandard({ a: M.F(a), h: M.F(0), k: M.F(0) }); // placeholder (unused)
      const cs = K.pmul([-p, 1], [-q, 1]).map((c) => c * a);
      const sTeX = "y = " + K.polyTeX(cs), fTeX = M.factoredTeX({ a: M.F(a), r: M.F(p), s: M.F(q) });
      const fStr = `y=${a === 1 ? "" : a === -1 ? "-" : a}(x${p > 0 ? "-" : "+"}${Math.abs(p)})(x${q > 0 ? "-" : "+"}${Math.abs(q)})`;
      void std;
      if (T === "expand") return { kind: "wr", template: "expand factored form", sig: `ex|${a}|${[p, q].sort().join(",")}`, title: "Factored to standard", intro: R`Write \(${fTeX}\) in standard form.`,
        parts: [{ key: "a", label: "", prompt: "Standard form:", kind: "equation", form: "standard", answer: "y=" + K.polyStr(cs), marks: 2 }],
        solution: [R`FOIL: \(\left(x ${p > 0 ? "-" : "+"} ${Math.abs(p)}\right)\left(x ${q > 0 ? "-" : "+"} ${Math.abs(q)}\right) = ${K.polyTeX(K.pmul([-p, 1], [-q, 1]))}\).`, ...(a !== 1 ? [R`Multiply by ${a}: \(${sTeX}\).`] : [R`So \(${sTeX}\).`])],
        rubric: ["Expanded — 1", "Simplified — 1"], hints: ["Multiply the brackets (FOIL), collect like terms, then multiply by the leading number."] };
      return { kind: "wr", template: T === "factorA" ? "factor with a ≠ 1" : "factor y = x² + bx + c", sig: `fa|${a}|${[p, q].sort().join(",")}`, title: "Standard to factored", intro: R`Write \(${sTeX}\) in factored form, then state its zeros.`,
        parts: [
          { key: "a", label: "(a)", prompt: "Factored form:", kind: "equation", form: "factored", answer: fStr, marks: 2 },
          { key: "b", label: "(b)", prompt: "Zeros:", kind: "set", mode: "final", answer: [...new Set([String(p), String(q)])], marks: 1 },
        ],
        solution: [...(a !== 1 ? [R`Common factor ${a}: \(y = ${a}\left(${K.polyTeX(K.pmul([-p, 1], [-q, 1]))}\right)\).`] : []), R`Two numbers with product ${p * q} and sum ${-(p + q)}: ${-p} and ${-q}.`, R`\(${fTeX}\), so the zeros are \(x = ${p}\) and \(x = ${q}\).`],
        rubric: ["Factored form — 2", "Zeros — 1"], hints: ["Take out a common factor first if there is one.", "The zeros have the opposite signs of the numbers in the brackets."] };
    },
  });

  B.family({
    id: "f_domain_range", unit: "F", sub: "F.domain_range", title: "Domain and range", concepts: ["quad.direction"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "interval", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["range from vertex form", "range from standard form", "range from a graph", "domain and range in context"],
    gen(r, mode, kind) {
      const M = QM();
      const a = fx(pickA(r, mode)), h = M.F(K.int(r, -6, 6)), k = M.F(K.int(r, -9, 9));
      const up = M.fval(a) > 0, kv = M.fval(k);
      const range = up ? `[${M.fstr(k)}, inf)` : `(-inf, ${M.fstr(k)}]`;
      const rangeTeX = up ? R`y \ge ${M.ftex(k)}` : R`y \le ${M.ftex(k)}`;
      const T = kind === "mc" ? "graph" : mode === "simple" ? "vertex" : mode === "normal" ? K.pick(r, ["vertex", "std"]) : K.pick(r, ["std", "context"]);
      if (T === "graph") {
        const G = root.Graph;
        const tok = G ? G.token({ fns: [{ a: M.fstr(a), h: M.fstr(h), k: M.fstr(k) }], marks: { vertex: true } }, `a parabola opening ${up ? "up" : "down"} with vertex (${M.fstr(h)}, ${M.fstr(k)})`) : "";
        const opts = [R`\(\{y \mid y ${up ? "\\ge" : "\\le"} ${M.ftex(k)},\ y \in \mathbb{R}\}\)`, R`\(\{y \mid y ${up ? "\\le" : "\\ge"} ${M.ftex(k)},\ y \in \mathbb{R}\}\)`, R`\(\{y \mid y ${up ? "\\ge" : "\\le"} ${M.ftex(h)},\ y \in \mathbb{R}\}\)`, R`\(\{y \mid y \in \mathbb{R}\}\)`, R`\(\{x \mid x ${up ? "\\ge" : "\\le"} ${M.ftex(h)},\ x \in \mathbb{R}\}\)`];
        return { ...K.mc(opts[0], opts.slice(1)), template: "range from a graph", sig: `g|${M.fstr(a)}|${M.fstr(h)}|${M.fstr(k)}`, q: R`What is the range of the function shown? ${tok}`,
          e: R`The parabola opens ${up ? "up" : "down"}, so its ${up ? "lowest" : "highest"} point is the vertex \((${M.ftex(h)}, ${M.ftex(k)})\). The range is \(${rangeTeX}\); the domain is all real numbers.`, hints: ["Range is about y-values: where is the highest or lowest point?"] };
      }
      if (T === "context") {
        // a ball: h(t) = −5(t − p)² + m, from t = 0 until it lands
        const p = K.int(r, 1, 3), m = 5 * p * p + K.int(r, 5, 40);
        const h0 = m - 5 * p * p, land = p + Math.sqrt(m / 5);
        const dp = 2;
        return { kind: "wr", template: "domain and range in context", sig: `c|${p}|${m}`, title: "Domain and range in context",
          intro: R`A ball's height in metres is \(h(t) = -5(t - ${p})^2 + ${m}\), where \(t\) is the time in seconds after it is thrown from a height of ${h0} m. It lands at \(t \approx ${land.toFixed(2)}\).`,
          parts: [
            { key: "a", label: "(a)", prompt: "Range (heights reached), as an interval:", kind: "interval", answer: `[0, ${m}]`, marks: 2 },
            { key: "b", label: "(b)", prompt: "Domain: the latest time t (seconds, 2 decimals):", kind: "approx", answer: land, dp, marks: 1 },
          ],
          solution: [R`Highest point: the vertex, \(${m}\) m at \(t = ${p}\). Lowest height in context: 0 m (the ground), so the range is \([0, ${m}]\).`, R`Domain: \(0 \le t \le ${land.toFixed(2)}\); it lands when \(h = 0\): \(t = ${p} + \sqrt{${m}/5} \approx ${land.toFixed(2)}\).`],
          rubric: ["Range in context — 2", "Domain end point — 1"], hints: ["In context, the function only makes sense from the start until the ball lands.", "The range runs from the ground (0) up to the vertex height."] };
      }
      let given, steps;
      if (T === "vertex") { given = M.vertexTeX({ a, h, k }); steps = [R`Vertex form gives the vertex \((${M.ftex(h)}, ${M.ftex(k)})\) directly.`]; }
      else { const std = M.toStandard({ a, h, k }); given = M.stdTeX(std); steps = [R`Vertex: \(x = -\dfrac{b}{2a} = ${M.ftex(h)}\), and \(y = ${M.ftex(k)}\) there.`]; }
      return { kind: "wr", template: T === "vertex" ? "range from vertex form" : "range from standard form", sig: `${T}|${given}`, title: "Domain and range", intro: R`For \(${given}\):`,
        parts: [
          { key: "a", label: "(a)", prompt: "Domain (interval notation):", kind: "interval", answer: "(-inf, inf)", marks: 1 },
          { key: "b", label: "(b)", prompt: "Range (interval notation):", kind: "interval", answer: range, marks: 2 },
        ],
        solution: [...steps, R`Every x-value can be used: domain \((-\infty, \infty)\).`, R`It opens ${up ? "up (a > 0)" : "down (a < 0)"}, so the range is \(${up ? `[${M.ftex(k)}, \\infty)` : `(-\\infty, ${M.ftex(k)}]`}\).`],
        rubric: ["Domain — 1", "Range: endpoint — 1, direction/bracket — 1"], hints: ["A quadratic accepts every x: domain is all real numbers.", `The range starts at the vertex's y-value and goes ${up ? "up" : "down"} if a is ${up ? "positive" : "negative"}.`, "Use a square bracket: the vertex value is reached."] , vals: [kv] };
    },
  });

  B.family({
    id: "f_function_notation", unit: "F", sub: "F.forms", title: "Function notation", concepts: ["quad.basics"],
    kinds: ["nr", "wr"], modes: ["simple", "normal", "challenge"], answer: "number / set", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["evaluate f(a)", "solve f(x) = k", "compare f(a) and f(b)"],
    gen(r, mode, kind) {
      const a = mode === "simple" ? 1 : K.pick(r, [1, 2, -1, 3, -2]), b = K.int(r, -6, 6), c = K.int(r, -9, 9);
      const fTeX = R`f(x) = ${K.polyTeX([c, b, a])}`;
      const f = (x) => a * x * x + b * x + c;
      if (kind === "nr") {
        const T = mode === "challenge" ? "compare" : "eval";
        if (T === "eval") {
          const x0 = K.int(r, -5, 5);
          return { kind: "nr", template: "evaluate f(a)", sig: `e|${a}|${b}|${c}|${x0}`, answer: f(x0), ansText: String(f(x0)), q: R`Given \(${fTeX}\), find \(f(${x0})\).`,
            e: R`Substitute \(x = ${x0}\): \(${a}(${x0})^2 + ${b}(${x0}) + ${c} = ${f(x0)}\). Brackets around negatives keep the signs right.`, hints: ["Replace every x with the number, in brackets.", "Square before multiplying by a."] };
        }
        const x1 = K.int(r, -4, 4), x2 = K.int(r, -4, 4); if (x1 === x2) throw new Error("same");
        return { kind: "nr", template: "compare f(a) and f(b)", sig: `c|${a}|${b}|${c}|${x1}|${x2}`, answer: f(x1) - f(x2), ansText: String(f(x1) - f(x2)), q: R`Given \(${fTeX}\), evaluate \(f(${x1}) - f(${x2})\).`,
          e: R`\(f(${x1}) = ${f(x1)}\) and \(f(${x2}) = ${f(x2)}\), so the difference is \(${f(x1) - f(x2)}\).`, hints: ["Evaluate each value separately, then subtract."] };
      }
      // solve f(x) = k with integer roots
      const p = K.int(r, -6, 6), q = K.int(r, -6, 6), aa = mode === "simple" ? 1 : K.pick(r, [1, 2, -1]);
      const k0 = K.int(r, -8, 8);
      const cs = K.pmul([-p, 1], [-q, 1]).map((v) => v * aa); cs[0] += k0;
      return { kind: "wr", template: "solve f(x) = k", sig: `s|${cs.join(",")}|${k0}`, title: "Function notation", intro: R`Given \(f(x) = ${K.polyTeX(cs)}\), find all \(x\) such that \(f(x) = ${k0}\).`,
        parts: [{ key: "a", label: "", prompt: "x =", kind: "set", mode: "final", answer: [...new Set([String(p), String(q)])], marks: 2 }],
        solution: [R`Set \(${K.polyTeX(cs)} = ${k0}\), so \(${K.polyTeX(K.pmul([-p, 1], [-q, 1]).map((v) => v * aa))} = 0\).`, R`Factor: \(${aa === 1 ? "" : aa}\left(x ${p > 0 ? "-" : "+"} ${Math.abs(p)}\right)\left(x ${q > 0 ? "-" : "+"} ${Math.abs(q)}\right) = 0\), so \(x = ${p}\) or \(x = ${q}\).`.replace("x + 0", "x").replace("x - 0", "x")],
        rubric: ["Equation set to zero — 1", "Both solutions — 1"], hints: ["f(x) = k is an equation in x: move k across to get 0 on one side.", "Then factor."] };
    },
  });

  B.family({
    id: "f_solve_factor", unit: "F", sub: "F.solve_factor", title: "Solve by factoring", concepts: ["quad.factored_form", "quad.intercepts"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "solution set", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["solve x² + bx + c = 0", "rearrange first", "a ≠ 1 with fractional roots", "zero-product error"],
    gen(r, mode, kind) {
      const M = QM();
      if (kind === "mc") {
        const p = K.nz(r, -7, 7), q = K.nz(r, -7, 7), k = K.int(r, 2, 9); if (p === q) throw new Error("x");
        // x² − (p+q)x + pq = k  — wrong: factoring before moving k
        const cs = K.pmul([-p, 1], [-q, 1]);
        const tex = R`${K.polyTeX(cs)} = ${k}`;
        return { kind: "mc", c: ["Move the constant first so the right side is 0, then factor", R`Factor the left side and set each factor equal to ${k}`, R`Divide both sides by x`, "Take the square root of both sides"], template: "zero-product error", sig: `mc|${tex}`,
          q: R`What is the right first step to solve \(${tex}\) by factoring?`, e: R`The zero-product property only works when the product equals 0: rewrite as \(${K.polyTeX([cs[0] - k, cs[1], 1])} = 0\) first. (Dividing by x loses a solution.)`, hints: ["A product equal to 0 means a factor is 0. A product equal to 5 tells you nothing about each factor."] };
      }
      const T = mode === "simple" ? "basic" : mode === "normal" ? K.pick(r, ["basic", "rearr"]) : K.pick(r, ["frac", "rearr"]);
      let tex, sol, steps;
      if (T === "frac") {
        const a1 = K.pick(r, [2, 3]), b1 = K.nz(r, -5, 5), q = K.nz(r, -6, 6);
        if (K.gcd(a1, b1) > 1) throw new Error("c");
        const cs = K.pmul([b1, a1], [-q, 1]);
        tex = R`${K.polyTeX(cs)} = 0`; sol = [M.fstr(M.F(-b1, a1)), String(q)];
        steps = [R`Factor: \(\left(${K.linTeX(a1, b1)}\right)\left(x ${q > 0 ? "-" : "+"} ${Math.abs(q)}\right) = 0\).`, R`\(${K.linTeX(a1, b1)} = 0 \Rightarrow x = ${M.ftex(M.F(-b1, a1))}\); \(x = ${q}\).`];
      } else {
        const p = K.nz(r, -9, 9), q = K.nz(r, -9, 9); if (p === q) throw new Error("x");
        const cs = K.pmul([-p, 1], [-q, 1]);
        if (T === "basic") { tex = R`${K.polyTeX(cs)} = 0`; steps = [R`Factor: \(\left(x ${p > 0 ? "-" : "+"} ${Math.abs(p)}\right)\left(x ${q > 0 ? "-" : "+"} ${Math.abs(q)}\right) = 0\).`]; }
        else { const m = K.nz(r, -6, 6); tex = R`${K.polyTeX([0, cs[1], 1])} = ${K.polyTeX([-cs[0] + m, 0])} ${m >= 0 ? "-" : "+"} ${Math.abs(m)}`.replace(/= (-?\d+) [-+] 0$/, "= $1"); steps = [R`Rearrange to \(${K.polyTeX(cs)} = 0\).`, R`Factor: \(\left(x ${p > 0 ? "-" : "+"} ${Math.abs(p)}\right)\left(x ${q > 0 ? "-" : "+"} ${Math.abs(q)}\right) = 0\).`]; }
        sol = [String(p), String(q)];
        steps.push(R`Zero-product property: \(x = ${p}\) or \(x = ${q}\).`);
      }
      return { kind: "wr", template: { basic: "solve x² + bx + c = 0", rearr: "rearrange first", frac: "a ≠ 1 with fractional roots" }[T], sig: `${T}|${tex}`, title: "Solve by factoring", intro: R`Solve \(${tex}\) by factoring.`,
        parts: [{ key: "a", label: "", prompt: "x =", kind: "set", mode: "final", answer: sol, marks: 2 }], solution: steps, rubric: ["Factored — 1", "Both roots — 1"], hints: ["Get 0 on one side first.", "Set each factor equal to 0."] };
    },
  });

  B.family({
    id: "f_solve_sqrt", unit: "F", sub: "F.solve_sqrt", title: "Solve by square roots", concepts: ["quad.intercepts"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "exact solution set", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["x² = k", "a(x − h)² + k = 0 with rational roots", "a(x − h)² + k = 0 with radical roots", "no real roots"],
    gen(r, mode) {
      const T = mode === "simple" ? K.pick(r, ["plain", "rat"]) : mode === "normal" ? K.pick(r, ["rat", "rad", "plain"]) : K.pick(r, ["rad", "rad", "none"]);
      const h = K.int(r, -6, 6), a = mode === "simple" ? 1 : K.pick(r, [1, 2, 3, -2]);
      let m, sol, tex, steps;
      if (T === "plain") { const s = K.int(r, 2, 12); m = s * s; tex = R`x^2 = ${m}`; sol = [String(-s), String(s)]; steps = [R`Take the square root of both sides — both signs: \(x = \pm\sqrt{${m}} = \pm ${s}\).`]; }
      else if (T === "rat") { const s = K.int(r, 1, 7); m = s * s; const k = -a * m; tex = R`${a === 1 ? "" : a}\left(x ${h > 0 ? "-" : "+"} ${Math.abs(h)}\right)^2 ${k >= 0 ? "+" : "-"} ${Math.abs(k)} = 0`.replace("x + 0", "x").replace("x - 0", "x"); sol = [String(h - s), String(h + s)]; steps = [R`Isolate the square: \(\left(x ${h > 0 ? "-" : "+"} ${Math.abs(h)}\right)^2 = ${m}\).`, R`Square root (±): \(x ${h > 0 ? "-" : "+"} ${Math.abs(h)} = \pm ${s}\), so \(x = ${h - s}\) or \(x = ${h + s}\).`]; }
      else if (T === "rad") {
        const t = K.pick(r, [2, 3, 5, 6, 7, 10, 12, 18, 20]); const [c0, rr] = QM().sqrtSplit(t);
        const k = -a * t; tex = R`${a === 1 ? "" : a}\left(x ${h > 0 ? "-" : "+"} ${Math.abs(h)}\right)^2 ${k >= 0 ? "+" : "-"} ${Math.abs(k)} = 0`.replace("x + 0", "x").replace("x - 0", "x");
        const radS = `${c0 === 1 ? "" : c0}√${rr}`;
        sol = h === 0 ? [`-${radS}`, radS] : [`${h}-${radS}`, `${h}+${radS}`];
        steps = [R`Isolate the square: \(\left(x ${h > 0 ? "-" : "+"} ${Math.abs(h)}\right)^2 = ${t}\).`, R`\(x ${h > 0 ? "-" : "+"} ${Math.abs(h)} = \pm\sqrt{${t}} = \pm ${c0 === 1 ? "" : c0}\sqrt{${rr}}\), so \(x = ${h === 0 ? "" : h} \pm ${c0 === 1 ? "" : c0}\sqrt{${rr}}\).`];
      } else { const t = K.int(r, 1, 9); const aa = Math.abs(a); tex = R`${aa === 1 ? "" : aa}\left(x ${h > 0 ? "-" : "+"} ${Math.abs(h)}\right)^2 + ${aa * t} = 0`.replace("x + 0", "x").replace("x - 0", "x"); sol = []; steps = [R`Isolate: \(\left(x ${h > 0 ? "-" : "+"} ${Math.abs(h)}\right)^2 = -${t}\).`, R`A square is never negative, so there are no real solutions.`]; }
      return { kind: "wr", template: { plain: "x² = k", rat: "a(x − h)² + k = 0 with rational roots", rad: "a(x − h)² + k = 0 with radical roots", none: "no real roots" }[T], sig: `${T}|${tex}`, title: "Square-root method", intro: R`Solve \(${tex}\). Give exact answers (type none if there are none).`,
        parts: [{ key: "a", label: "", prompt: "x =", kind: "set", mode: "final", answer: sol, marks: 2 }], solution: steps, rubric: ["Square isolated — 1", "± roots, exact — 1"],
        hints: ["Isolate the squared bracket, then take the square root of both sides.", "Remember ±: a positive number has two square roots.", "Leave radicals exact, in simplest form."] };
    },
  });

  B.family({
    id: "f_solve_graph", unit: "F", sub: "F.solve_graph", title: "Solve graphically", concepts: ["quad.graph_read", "quad.intercepts"],
    kinds: ["nr", "mc"], modes: ["simple", "normal", "challenge"], answer: "number / choice", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["zeros from the graph", "intersection of a parabola and a line", "how many solutions"],
    gen(r, mode, kind) {
      const G = root.Graph;
      const p = K.int(r, -5, 4), q = p + K.int(r, 1, 6), a = mode === "simple" ? 1 : K.pick(r, [1, -1]);
      const h = (p + q) / 2, k = -a * Math.pow((q - p) / 2, 2);
      if (!Number.isInteger(h * 2)) throw new Error("x");
      if (kind === "nr") {
        if (mode === "challenge") {
          // intersections of y = a(x − p)(x − q) and a horizontal line y = m that meets at integer x
          const t = K.int(r, 1, 3); const x1 = p - t, x2 = q + t; const m = a * (x1 - p) * (x1 - q);
          const tok = G ? G.token({ fns: [{ a, b: -a * (p + q), c: a * p * q }, { type: "line", m: 0, b: m }], labels: ["f", `y = ${m}`], points: [{ x: x1, y: m }, { x: x2, y: m }] }, `parabola with zeros ${p} and ${q}, and the line y = ${m}`) : "";
          return { kind: "nr", template: "intersection of a parabola and a line", sig: `i|${a}|${p}|${q}|${t}`, answer: x1 + x2, ansText: String(x1 + x2),
            q: R`The graph shows \(f(x) = ${K.polyTeX([a * p * q, -a * (p + q), a])}\) and the line \(y = ${m}\). ${tok} What is the sum of the solutions of \(f(x) = ${m}\)?`,
            e: R`The solutions are the x-coordinates of the intersection points: \(x = ${x1}\) and \(x = ${x2}\). Their sum is ${x1 + x2} (check: they are symmetric about \(x = ${h}\)).`, hints: ["Solutions of f(x) = m are where the line y = m meets the graph.", "Read the x-coordinates of both points."] };
        }
        const tok = G ? G.token({ fns: [{ a, b: -a * (p + q), c: a * p * q }], marks: { xint: true } }, `parabola crossing the x-axis at ${p} and ${q}`) : "";
        return { kind: "nr", template: "zeros from the graph", sig: `z|${a}|${p}|${q}`, answer: Math.max(p, q), ansText: String(Math.max(p, q)),
          q: R`The graph of \(y = ${K.polyTeX([a * p * q, -a * (p + q), a])}\) is shown. ${tok} What is the larger solution of \(${K.polyTeX([a * p * q, -a * (p + q), a])} = 0\)?`,
          e: R`The solutions of \(f(x) = 0\) are the x-intercepts: \(${p}\) and \(${q}\). The larger is ${q}.`, hints: ["The solutions of f(x) = 0 are the x-intercepts."] };
      }
      // how many solutions: f(x) = m against the vertex height
      const tok = G ? G.token({ fns: [{ a, b: -a * (p + q), c: a * p * q }], marks: { vertex: true } }, `parabola with vertex (${h}, ${k})`) : "";
      const which = K.pick(r, [0, 1, 2]);
      const m = which === 1 ? k : which === 2 ? k + a * K.int(r, 1, 4) : k - a * K.int(r, 1, 4);
      const c = [`${which}`, ...[0, 1, 2].filter((x) => x !== which).map(String), "Infinitely many"];
      return { kind: "mc", c: [c[0] + (which === 1 ? " (the line touches at the vertex)" : ""), c[1], c[2], c[3]], template: "how many solutions", sig: `n|${a}|${p}|${q}|${m}`,
        q: R`The graph of \(y = f(x)\) is shown. ${tok} How many solutions does \(f(x) = ${m}\) have?`,
        e: R`Picture the horizontal line \(y = ${m}\). The vertex is at height ${k} and the parabola opens ${a > 0 ? "up" : "down"}, so the line meets it ${which === 0 ? "nowhere" : which === 1 ? "only at the vertex" : "twice"}.`, hints: ["Draw the horizontal line y = m and count the meeting points."] };
    },
  });

  // build a parabola on an EMPTY grid — the key graph is never drawn before the answer is submitted
  B.family({
    id: "f_graph_build", unit: "F", sub: "F.graphing", title: "Graph it on an empty grid", concepts: ["quad.sketch", "quad.vertex_form"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "constructed graph", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["from vertex form", "from standard form", "from factored form"],
    gen(r, mode) {
      const M = QM();
      const a = mode === "simple" ? K.pick(r, [1, -1]) : mode === "normal" ? K.pick(r, [1, -1, 2, -2]) : K.pick(r, ["1/2", "-1/2", "2", "-2", "-1"]);
      const T = mode === "simple" ? "vertex" : mode === "normal" ? K.pick(r, ["vertex", "standard"]) : K.pick(r, ["standard", "factored", "vertex"]);
      let h = K.int(r, -4, 4), k = K.int(r, -5, 5);
      const A = M.fval(fx(a));
      if (T === "factored") { const s = K.pick(r, [1, 2]) * (A === 0.5 || A === -0.5 ? 2 : 1); k = -A * s * s; h = K.int(r, -4, 4); if (!Number.isInteger(k)) throw new Error("k"); }
      if (Math.abs(k) > 7) throw new Error("window");
      const given = T === "vertex" ? M.vertexTeX({ a: fx(a), h: M.F(h), k: M.F(k) }) : T === "standard" ? M.stdTeX(M.toStandard({ a: fx(a), h: M.F(h), k: M.F(k) })) : (() => { const s = Math.sqrt(-k / A); return M.factoredTeX({ a: fx(a), r: M.F(h - s), s: M.F(h + s) }); })();
      const step = Math.abs(A) === 0.5 ? 2 : 1;
      const pts = [[h - step, k + A * step * step], [h + step, k + A * step * step], [h - 2 * step, k + A * 4 * step * step], [h + 2 * step, k + A * 4 * step * step]];
      const win = { x0: -9, x1: 9, y0: -9, y1: 9 };
      return { kind: "wr", template: { vertex: "from vertex form", standard: "from standard form", factored: "from factored form" }[T], sig: `${T}|${a}|${h}|${k}`, title: "Graph a quadratic",
        intro: R`Graph \(${given}\) on the empty grid: place the vertex, then plot at least two more points (one each side of the axis of symmetry), then draw the curve.`,
        parts: [{ key: "a", label: "", prompt: "Your graph:", kind: "graph", answer: { a: String(a), h: String(h), k: String(k) }, marks: 3, minPoints: 2, bothSides: mode !== "simple", snap: 1, window: win }],
        solution: [
          T === "vertex" ? R`Vertex form gives the vertex \((${h}, ${k})\) directly.` : T === "standard" ? R`Vertex: \(x = -\dfrac{b}{2a} = ${h}\), and \(y(${h}) = ${k}\).` : R`The zeros are at \(x = ${h - Math.sqrt(-k / A)}\) and \(x = ${h + Math.sqrt(-k / A)}\); the vertex is halfway between, at \(x = ${h}\), with \(y = ${k}\).`,
          R`Axis of symmetry: \(x = ${h}\). It opens ${A > 0 ? "up" : "down"} (a = ${a}).`,
          R`From the vertex: ${step} step${step > 1 ? "s" : ""} right/left → ${A * step * step > 0 ? "up" : "down"} ${Math.abs(A * step * step)}; ${2 * step} steps → ${Math.abs(A * 4 * step * step)}. Points: ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(", ")}.`,
        ],
        rubric: ["Vertex — 1", "Points on the curve — 1", "Shape and direction — 1"],
        hints: ["Find the vertex first.", "Use the step pattern: 1 → a, 2 → 4a, 3 → 9a from the vertex.", "Mirror each point across the axis of symmetry."] };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
