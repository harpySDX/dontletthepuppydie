/*
 * Units C (radical operations and equations) and D (polynomial factoring).
 */
(function (root) {
  "use strict";
  const B = root.Bank; if (!B) return;
  const { K } = B;
  const R = String.raw;
  const SQF = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];             // square-free radicands
  const CF = [2, 3, 4, 5, 6, 7, 9, 10];                          // cube-free radicands for ∛
  const rad = (c, n, idx = 2) => (n === 1 ? String(c) : `${c === 1 ? "" : c === -1 ? "-" : c}${idx === 2 ? "√" : "∛"}${n}`);
  const radTeX = (c, n, idx = 2) => (n === 1 ? String(c) : `${c === 1 ? "" : c === -1 ? "-" : c}${idx === 2 ? `\\sqrt{${n}}` : `\\sqrt[3]{${n}}`}`);

  B.family({
    id: "c_simplify", unit: "C", sub: "C.simplify", title: "Simplify a radical", concepts: ["radicals.simplify"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "simplest radical", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["square root", "coefficient times a root", "cube root", "which is simplified"],
    gen(r, mode, kind) {
      const idx = mode === "challenge" && K.coin(r) ? 3 : 2;
      const k = idx === 2 ? K.int(r, 2, mode === "simple" ? 7 : 10) : K.int(r, 2, 4);
      const b = K.pick(r, idx === 2 ? SQF.slice(0, mode === "simple" ? 6 : 10) : CF);
      const c = mode === "simple" ? 1 : K.pick(r, [1, 1, 2, 3, -2]);
      const n = Math.pow(k, idx) * b;
      const ansC = c * k;
      if (kind === "mc") {
        const good = R`\(${radTeX(ansC, b, idx)}\)`;
        const wrong = [R`\(${radTeX(c * Math.pow(k, idx), b, idx)}\)`, R`\(${radTeX(c * k, b * k, idx)}\)`, R`\(${radTeX(c, n / b, idx)}\sqrt{${b}}\)`, R`\(${radTeX(c * (k + 1), b, idx)}\)`];
        return { ...K.mc(good, wrong), template: "which is simplified", sig: `mc|${c}|${n}|${idx}`, q: R`Which expression equals \(${radTeX(c, n, idx)}\) in simplest form?`,
          e: R`\(${n} = ${Math.pow(k, idx)} \times ${b}\), and \(${idx === 2 ? `\\sqrt{${k * k}}` : `\\sqrt[3]{${k ** 3}}`} = ${k}\). So \(${radTeX(c, n, idx)} = ${radTeX(ansC, b, idx)}\).`,
          hints: [`Find the largest perfect ${idx === 2 ? "square" : "cube"} that divides ${n}.`] };
      }
      return { kind: "wr", template: idx === 3 ? "cube root" : c === 1 ? "square root" : "coefficient times a root", sig: `wr|${c}|${n}|${idx}`,
        title: "Simplify a radical", intro: R`Simplify \(${radTeX(c, n, idx)}\).`,
        parts: [{ key: "a", label: "", prompt: "Simplest form:", kind: "expr", answer: rad(ansC, b, idx), form: "simplest", marks: 2 }],
        solution: [R`Largest perfect ${idx === 2 ? "square" : "cube"} factor: \(${n} = ${Math.pow(k, idx)} \times ${b}\).`, R`\(${radTeX(c, n, idx)} = ${c === 1 ? "" : c + " \\cdot "}${idx === 2 ? `\\sqrt{${k * k}}\\sqrt{${b}}` : `\\sqrt[3]{${k ** 3}}\\sqrt[3]{${b}}`} = ${radTeX(ansC, b, idx)}\).`],
        rubric: ["Correct value — 1", "Simplest form — 1"],
        hints: [`List perfect ${idx === 2 ? "squares (4, 9, 16, 25, 36, 49, …)" : "cubes (8, 27, 64, …)"} and find the biggest that divides ${n}.`, "Take its root outside and multiply by any coefficient already there."] };
    },
  });

  B.family({
    id: "c_mixed_entire", unit: "C", sub: "C.mixed_entire", title: "Mixed and entire radicals", concepts: ["radicals.mixed_entire"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "radical", complexity: { simple: 1, normal: 2, challenge: 2 },
    templates: ["mixed → entire", "entire → mixed", "is it mixed or entire?"],
    gen(r, mode, kind) {
      const idx = mode === "challenge" && K.coin(r) ? 3 : 2;
      const a = K.int(r, 2, mode === "simple" ? 5 : 9), b = K.pick(r, idx === 2 ? SQF : CF);
      const n = Math.pow(a, idx) * b;
      if (kind === "mc") {
        const good = R`\(${idx === 2 ? `\\sqrt{${n}}` : `\\sqrt[3]{${n}}`}\)`;
        return { ...K.mc(good, [R`\(${idx === 2 ? `\\sqrt{${a * b}}` : `\\sqrt[3]{${a * b}}`}\)`, R`\(${idx === 2 ? `\\sqrt{${a * a + b}}` : `\\sqrt[3]{${a * a * b}}`}\)`, R`\(${idx === 2 ? `\\sqrt{${2 * a * b}}` : `\\sqrt[3]{${a ** 3 + b}}`}\)`]), template: "is it mixed or entire?", sig: `mc|${a}|${b}|${idx}`,
          q: R`Which entire radical equals \(${radTeX(a, b, idx)}\)?`, e: R`Bring ${a} inside as \(${a}^{${idx}} = ${Math.pow(a, idx)}\): \(${Math.pow(a, idx)} \times ${b} = ${n}\).`, hints: [`The number outside goes inside raised to the power ${idx}.`] };
      }
      if (K.coin(r)) return { kind: "wr", template: "mixed → entire", sig: `me|${a}|${b}|${idx}`, title: "Mixed and entire radicals", intro: R`Write \(${radTeX(a, b, idx)}\) as an entire radical.`,
        parts: [{ key: "a", label: "", prompt: "Entire radical:", kind: "expr", answer: rad(1, n, idx), form: "entire", marks: 1 }],
        solution: [R`\(${radTeX(a, b, idx)} = ${idx === 2 ? `\\sqrt{${a}^2 \\cdot ${b}}` : `\\sqrt[3]{${a}^3 \\cdot ${b}}`} = ${radTeX(1, n, idx)}\).`], rubric: ["Entire radical — 1"], hints: [`Square ${idx === 3 ? "(cube) " : ""}the outside number and multiply it into the radicand.`] };
      return { kind: "wr", template: "entire → mixed", sig: `em|${a}|${b}|${idx}`, title: "Mixed and entire radicals", intro: R`Write \(${radTeX(1, n, idx)}\) as a mixed radical in simplest form.`,
        parts: [{ key: "a", label: "", prompt: "Mixed radical:", kind: "expr", answer: rad(a, b, idx), form: "simplest", marks: 1 }],
        solution: [R`\(${n} = ${Math.pow(a, idx)} \times ${b}\), so \(${radTeX(1, n, idx)} = ${radTeX(a, b, idx)}\).`], rubric: ["Simplest mixed radical — 1"], hints: [`Look for the largest perfect ${idx === 2 ? "square" : "cube"} factor of ${n}.`] };
    },
  });

  B.family({
    id: "c_add", unit: "C", sub: "C.add", title: "Combine like radicals", concepts: ["radicals.add_subtract"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "simplest radical", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["already like radicals", "simplify first, then combine", "unlike terms left over"],
    gen(r, mode) {
      const b = K.pick(r, SQF.slice(0, 6));
      const T = mode === "simple" ? "like" : mode === "normal" ? K.pick(r, ["simplify", "simplify", "like"]) : K.pick(r, ["leftover", "simplify"]);
      let tex, ans, steps;
      if (T === "like") {
        const p = K.int(r, 2, 9), q = K.int(r, 1, 8), s2 = K.coin(r) ? 1 : -1, t = K.int(r, 1, 5);
        const coef = p + s2 * q - t;
        if (coef === 0) throw new Error("zero");
        tex = R`${p}\sqrt{${b}} ${s2 > 0 ? "+" : "-"} ${q}\sqrt{${b}} - ${t}\sqrt{${b}}`;
        ans = rad(coef, b); steps = [R`All terms have \(\sqrt{${b}}\): combine the coefficients \(${p} ${s2 > 0 ? "+" : "-"} ${q} - ${t} = ${coef}\).`];
      } else {
        const k1 = K.int(r, 2, 5), k2 = K.int(r, 2, 6), p = K.int(r, 1, 4), q = K.int(r, 1, 3), sg = K.coin(r) ? 1 : -1;
        if (k1 === k2) throw new Error("same");
        const n1 = k1 * k1 * b, n2 = k2 * k2 * b;
        const coef = p * k1 + sg * q * k2;
        if (coef === 0) throw new Error("zero");
        if (T === "simplify") {
          tex = R`${p === 1 ? "" : p}\sqrt{${n1}} ${sg > 0 ? "+" : "-"} ${q === 1 ? "" : q}\sqrt{${n2}}`;
          ans = rad(coef, b);
          steps = [R`\(\sqrt{${n1}} = ${k1}\sqrt{${b}}\) and \(\sqrt{${n2}} = ${k2}\sqrt{${b}}\).`, R`\(${p * k1}\sqrt{${b}} ${sg > 0 ? "+" : "-"} ${q * k2}\sqrt{${b}} = ${radTeX(coef, b)}\).`];
        } else {
          let b2 = K.pick(r, SQF); if (b2 === b) b2 = b === 2 ? 3 : 2;
          const k3 = K.int(r, 2, 4), n3 = k3 * k3 * b2;
          tex = R`${p === 1 ? "" : p}\sqrt{${n1}} ${sg > 0 ? "+" : "-"} ${q === 1 ? "" : q}\sqrt{${n2}} + \sqrt{${n3}}`;
          ans = `${rad(coef, b)}+${rad(k3, b2)}`;
          steps = [R`Simplify each: \(\sqrt{${n1}} = ${k1}\sqrt{${b}}\), \(\sqrt{${n2}} = ${k2}\sqrt{${b}}\), \(\sqrt{${n3}} = ${k3}\sqrt{${b2}}\).`, R`Only like radicals combine: \(${radTeX(coef, b)} + ${radTeX(k3, b2)}\).`];
        }
      }
      return { kind: "wr", template: { like: "already like radicals", simplify: "simplify first, then combine", leftover: "unlike terms left over" }[T], sig: `${T}|${tex}`, title: "Combine radicals", intro: R`Simplify \(${tex}\).`,
        parts: [{ key: "a", label: "", prompt: "Simplest form:", kind: "expr", answer: ans, form: "simplest", marks: 2 }],
        solution: steps, rubric: ["Each radical simplified — 1", "Like radicals combined — 1"], hints: ["Simplify every radical first.", "You can only add radicals with the same radicand, like 3√2 + 5√2 = 8√2."] };
    },
  });

  B.family({
    id: "c_multiply", unit: "C", sub: "C.multiply", title: "Multiply and divide radicals", concepts: ["radicals.multiply"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "simplest radical", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["product of monomials", "distribute", "binomial × binomial", "quotient"],
    gen(r, mode) {
      const T = mode === "simple" ? K.pick(r, ["mono", "quot"]) : mode === "normal" ? K.pick(r, ["mono", "dist", "quot"]) : K.pick(r, ["dist", "binom"]);
      const QM = root.QuadMath;
      let tex, ans, steps;
      if (T === "mono") {
        const a = K.int(r, 1, 5), c = K.int(r, 1, 5), b = K.pick(r, [2, 3, 5, 6]), d = K.pick(r, [2, 3, 6, 10, 15]);
        const prod = b * d; let k = 1, s = prod; for (let f = 9; f >= 2; f--) while (s % (f * f) === 0) { s /= f * f; k *= f; }
        tex = R`\left(${radTeX(a, b)}\right)\left(${radTeX(c, d)}\right)`; ans = rad(a * c * k, s);
        steps = [R`Multiply outside numbers and radicands separately: \(${a * c}\sqrt{${prod}}\).`, R`Simplify: \(\sqrt{${prod}} = ${radTeX(k, s)}\), so the product is \(${radTeX(a * c * k, s)}\).`];
      } else if (T === "quot") {
        const b = K.pick(r, [2, 3, 5, 7]), m = K.pick(r, [2, 3, 6, 8, 12]), c = K.int(r, 1, 4), a = c * K.int(r, 1, 5);
        let k = 1, s = m; for (let f = 4; f >= 2; f--) while (s % (f * f) === 0) { s /= f * f; k *= f; }
        tex = R`\dfrac{${radTeX(a, b * m)}}{${radTeX(c, b)}}`; ans = rad((a / c) * k, s);
        steps = [R`Divide outside numbers and radicands: \(\dfrac{${a}}{${c}}\sqrt{\dfrac{${b * m}}{${b}}} = ${a / c}\sqrt{${m}}\).`, R`Simplify: \(${radTeX((a / c) * k, s)}\).`];
      } else if (T === "dist") {
        const a = K.int(r, 1, 4), b = K.pick(r, [2, 3, 5]), c = K.int(r, 1, 5), d = K.pick(r, [2, 3, 5, 6, 10].filter((x) => x !== b)), e = K.int(r, 1, 6);
        // a√b (c√d + e) = ac√(bd) + ae√b
        const prod = b * d; let k = 1, s = prod; for (let f = 9; f >= 2; f--) while (s % (f * f) === 0) { s /= f * f; k *= f; }
        tex = R`${radTeX(a, b)}\left(${radTeX(c, d)} + ${e}\right)`; ans = `${rad(a * c * k, s)}+${rad(a * e, b)}`;
        steps = [R`Distribute: \(${radTeX(a, b)} \cdot ${radTeX(c, d)} + ${radTeX(a, b)} \cdot ${e}\).`, R`\(= ${radTeX(a * c * k, s)} + ${radTeX(a * e, b)}\).`];
      } else {
        // (√b + p)(√b − q) = b − q√b + p√b − pq
        const b = K.pick(r, [2, 3, 5, 6, 7]), p = K.int(r, 1, 6), q = K.int(r, 1, 6);
        if (p === q) throw new Error("conj handled elsewhere");
        const cst = b - p * q, co = p - q;
        tex = R`\left(\sqrt{${b}} + ${p}\right)\left(\sqrt{${b}} - ${q}\right)`;
        ans = `${cst}${co > 0 ? "+" : "-"}${rad(Math.abs(co), b)}`.replace(/^0\+/, "").replace(/^0-/, "-");
        steps = [R`FOIL: \(\sqrt{${b}}\cdot\sqrt{${b}} - ${q}\sqrt{${b}} + ${p}\sqrt{${b}} - ${p * q}\).`, R`\(= ${b} - ${p * q} + ${co}\sqrt{${b}} = ${cst} ${co > 0 ? "+" : "-"} ${radTeX(Math.abs(co), b)}\).`];
        if (QM && cst === 0) throw new Error("degenerate");
      }
      return { kind: "wr", template: { mono: "product of monomials", quot: "quotient", dist: "distribute", binom: "binomial × binomial" }[T], sig: `${T}|${tex}`, title: "Multiply and divide radicals", intro: R`Simplify \(${tex}\).`,
        parts: [{ key: "a", label: "", prompt: "Simplest form:", kind: "expr", answer: ans, form: "simplest", marks: 2 }],
        solution: steps, rubric: ["Correct product — 1", "Simplest form — 1"], hints: ["√a · √b = √(ab); multiply coefficients with coefficients.", "Simplify the result at the end."] };
    },
  });

  B.family({
    id: "c_rationalize", unit: "C", sub: "C.rationalize", title: "Rationalize the denominator", concepts: ["radicals.rationalize", "radicals.conjugates"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "rationalized radical", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["monomial denominator", "monomial with coefficient", "binomial denominator (conjugate)"],
    gen(r, mode) {
      const T = mode === "simple" ? "mono" : mode === "normal" ? K.pick(r, ["mono", "coef"]) : "conj";
      let tex, ans, steps;
      if (T !== "conj") {
        const b = K.pick(r, [2, 3, 5, 6, 7]), a = K.int(r, 1, 12), c = T === "coef" ? K.int(r, 2, 4) : 1;
        const num = a, den = c * b, g = K.gcd(num, den);
        tex = R`\dfrac{${a}}{${radTeX(c, b)}}`;
        const n2 = num / g, d2 = den / g;
        ans = d2 === 1 ? rad(n2, b) : `${rad(n2, b)}/${d2}`;
        steps = [R`Multiply top and bottom by \(\sqrt{${b}}\): \(\dfrac{${a}\sqrt{${b}}}{${c === 1 ? "" : c}\cdot ${b}} = \dfrac{${a}\sqrt{${b}}}{${den}}\).`, g > 1 ? R`Reduce by ${g}: \(${d2 === 1 ? radTeX(n2, b) : `\\dfrac{${radTeX(n2, b)}}{${d2}}`}\).` : "Already reduced."];
      } else {
        const b = K.pick(r, [2, 3, 5, 6, 7]), p = K.int(r, 1, 5), a = K.int(r, 1, 9), sg = K.coin(r) ? 1 : -1;
        const den = p * p - b; if (den === 0) throw new Error("zero");
        // a / (p + sg√b) = a(p − sg√b) / (p² − b)
        tex = R`\dfrac{${a}}{${p} ${sg > 0 ? "+" : "-"} \sqrt{${b}}}`;
        const g = K.gcd(K.gcd(a * p, a), Math.abs(den));
        let n1 = (a * p) / g, n2 = (-sg * a) / g, d = den / g;
        if (d < 0) { n1 = -n1; n2 = -n2; d = -d; }
        const numStr = `${n1}${n2 > 0 ? "+" : "-"}${rad(Math.abs(n2), b)}`;
        ans = d === 1 ? numStr : `(${numStr})/${d}`;
        steps = [R`Multiply by the conjugate \(${p} ${sg > 0 ? "-" : "+"} \sqrt{${b}}\) on top and bottom.`, R`Denominator: \(${p}^2 - ${b} = ${den}\). Numerator: \(${a}(${p} ${sg > 0 ? "-" : "+"} \sqrt{${b}})\).`, R`Simplify: \(${d === 1 ? `${n1} ${n2 > 0 ? "+" : "-"} ${radTeX(Math.abs(n2), b)}` : `\\dfrac{${n1} ${n2 > 0 ? "+" : "-"} ${radTeX(Math.abs(n2), b)}}{${d}}`}\).`];
      }
      return { kind: "wr", template: { mono: "monomial denominator", coef: "monomial with coefficient", conj: "binomial denominator (conjugate)" }[T], sig: `${T}|${tex}`, title: "Rationalize the denominator", intro: R`Rationalize the denominator and simplify: \(${tex}\).`,
        parts: [{ key: "a", label: "", prompt: "Answer:", kind: "expr", answer: ans, form: "rationalized", marks: 2 }],
        solution: steps, rubric: ["Rationalized — 1", "Simplified — 1"], hints: T === "conj" ? ["Multiply by the conjugate: change the sign between the terms.", "(p + √b)(p − √b) = p² − b."] : ["Multiply top and bottom by the radical in the denominator."] };
    },
  });

  B.family({
    id: "c_restrict", unit: "C", sub: "C.restrict", title: "Restrictions on a radicand", concepts: ["radicals.restrictions"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "restriction", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["x plus a constant", "coefficient on x", "negative coefficient", "variable in a denominator"],
    gen(r, mode, kind) {
      const T = mode === "simple" ? "plain" : mode === "normal" ? K.pick(r, ["coef", "plain"]) : K.pick(r, ["neg", "denom"]);
      const a = T === "plain" ? 1 : K.int(r, 2, 6) * (T === "neg" ? -1 : 1), b = K.nz(r, -12, 12);
      const QM = root.QuadMath;
      const bound = QM.fdiv(QM.F(-b), QM.F(a)), bs = QM.fstr(bound);
      const op = a > 0 ? (T === "denom" ? ">" : ">=") : (T === "denom" ? "<" : "<=");
      const inner = `${a === 1 ? "" : a === -1 ? "-" : a}x ${b > 0 ? "+" : "-"} ${Math.abs(b)}`;
      const tex = T === "denom" ? R`\dfrac{5}{\sqrt{${inner}}}` : R`\sqrt{${inner}}`;
      const sym = { ">=": "\\ge", "<=": "\\le", ">": ">", "<": "<" }[op];
      if (kind === "mc") {
        const opts = [">=", "<=", ">", "<"].map((o) => R`\(x ${({ ">=": "\\ge", "<=": "\\le", ">": ">", "<": "<" })[o]} ${QM.ftex(bound)}\)`);
        const flipB = QM.ftex(QM.fneg(bound));
        const good = opts[[">=", "<=", ">", "<"].indexOf(op)];
        return { ...K.mc(good, [...opts.filter((o) => o !== good), R`\(x ${sym} ${flipB}\)`]), template: { plain: "x plus a constant", coef: "coefficient on x", neg: "negative coefficient", denom: "variable in a denominator" }[T], sig: `mc|${tex}`,
          q: R`For what values of \(x\) is \(${tex}\) a real number?`, e: R`Solve \(${inner} ${T === "denom" ? ">" : "\\ge"} 0\)${a < 0 ? " (dividing by a negative flips the inequality)" : ""}: \(x ${sym} ${QM.ftex(bound)}\).`,
          hints: ["The radicand can't be negative." + (T === "denom" ? " It also can't be 0 in a denominator." : "")] };
      }
      return { kind: "wr", template: { plain: "x plus a constant", coef: "coefficient on x", neg: "negative coefficient", denom: "variable in a denominator" }[T], sig: `wr|${tex}`, title: "Restrictions", intro: R`State the restriction on \(x\) so that \(${tex}\) is a real number.`,
        parts: [{ key: "a", label: "", prompt: "Restriction:", kind: "restriction", answer: { op, value: bs }, marks: 2 }],
        solution: [R`Set the radicand ${T === "denom" ? "greater than" : "greater than or equal to"} 0: \(${inner} ${T === "denom" ? ">" : "\\ge"} 0\).`, a < 0 ? R`Divide by ${a}; the inequality flips: \(x ${sym} ${QM.ftex(bound)}\).` : R`Solve: \(x ${sym} ${QM.ftex(bound)}\).`],
        rubric: ["Boundary — 1", "Direction and endpoint — 1"], hints: ["A square root of a negative isn't real: set the inside ≥ 0.", ...(T === "denom" ? ["In a denominator it can't be 0 either, so use > 0."] : []), ...(a < 0 ? ["Dividing by a negative flips the inequality."] : [])] };
    },
  });

  // radical equations with a real check for extraneous roots
  B.family({
    id: "c_equations", unit: "C", sub: "C.equations", title: "Solve a radical equation", concepts: ["radicals.equations"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "solution set", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["isolated root equals a number", "isolate then square", "root equals a linear expression (extraneous possible)", "no solution"],
    gen(r, mode) {
      const T = mode === "simple" ? "basic" : mode === "normal" ? K.pick(r, ["isolate", "basic", "none"]) : K.pick(r, ["linear", "linear", "isolate"]);
      let tex, sol, steps, cands, extra = [];
      if (T === "basic" || T === "none") {
        const a = K.int(r, 1, mode === "simple" ? 1 : 3), b = K.nz(r, -9, 9), c = K.int(r, 2, 9);
        // √(ax + b) = c  →  x = (c² − b)/a
        if ((c * c - b) % a) throw new Error("int");
        const x = (c * c - b) / a;
        if (T === "none") { tex = R`\sqrt{${a === 1 ? "" : a}x ${b > 0 ? "+" : "-"} ${Math.abs(b)}} = -${c}`; sol = []; steps = [R`A principal square root is never negative, so \(\sqrt{\ldots} = -${c}\) has no solution.`, R`(Squaring would give \(x = ${x}\), but it fails the check: \(\sqrt{${a * x + b}} = ${c} \ne -${c}\).)`]; cands = [String(x)]; }
        else { tex = R`\sqrt{${a === 1 ? "" : a}x ${b > 0 ? "+" : "-"} ${Math.abs(b)}} = ${c}`; sol = [String(x)]; steps = [R`Square both sides: \(${a === 1 ? "" : a}x ${b > 0 ? "+" : "-"} ${Math.abs(b)} = ${c * c}\).`, R`Solve: \(x = ${x}\). Check: \(\sqrt{${a * x + b}} = ${c}\) ✓.`]; }
      } else if (T === "isolate") {
        const k = K.int(r, 2, 4), b = K.nz(r, -6, 8), c = K.int(r, 1, 5), d = K.int(r, 1, 10);
        // k√(x + b) − d = k·c − d  → √(x + b) = c
        const rhs = k * c - d, x = c * c - b;
        tex = R`${k}\sqrt{x ${b > 0 ? "+" : "-"} ${Math.abs(b)}} - ${d} = ${rhs}`; sol = [String(x)];
        steps = [R`Isolate the root: \(${k}\sqrt{x ${b > 0 ? "+" : "-"} ${Math.abs(b)}} = ${rhs + d}\), so \(\sqrt{x ${b > 0 ? "+" : "-"} ${Math.abs(b)}} = ${c}\).`, R`Square: \(x ${b > 0 ? "+" : "-"} ${Math.abs(b)} = ${c * c}\), \(x = ${x}\). Check ✓.`];
      } else {
        // √(x + b) = x − d. Build from two integer candidates u < v of (x − d)² = x + b with v real, u maybe extraneous.
        const v = K.int(r, 1, 6), d = K.int(r, -3, 6);
        const xv = v + d; // root value v = x − d ≥ 0 at the real solution
        const u = -K.int(r, 1, 5); // other root of the quadratic in t = x − d: t² − t − (x+b) relation → choose b so that both t=v and t=u solve t² = t + d + b
        // t = x − d; equation (t)² = t + d + b; roots v and u ⇒ v + u = 1
        if (v + u !== 1) throw new Error("retry");
        const b = v * v - v - d;
        const xu = u + d;
        tex = R`\sqrt{x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}} = x ${d >= 0 ? "-" : "+"} ${Math.abs(d)}`.replace(" + 0}", "}").replace("x - 0", "x").replace("x + 0", "x");
        sol = [String(xv)]; cands = [String(xv), String(xu)];
        extra = [{ key: "b", label: "(b)", prompt: "Which candidate is extraneous?", kind: "set", mode: "extraneous", answer: [String(xu)], marks: 1 }];
        steps = [R`Square both sides: \(x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = (x ${d >= 0 ? "-" : "+"} ${Math.abs(d)})^2\).`, R`Expand and solve the quadratic: candidates \(x = ${xv}\) and \(x = ${xu}\).`, R`Check \(x = ${xu}\): the right side is \(${xu - d} < 0\), but a square root can't be negative — extraneous.`, R`Check \(x = ${xv}\): \(\sqrt{${xv + b}} = ${v}\) ✓. Solution: \(x = ${xv}\).`];
        if (xv + b < 0) throw new Error("bad");
      }
      const parts = [{ key: "a", label: extra.length ? "(a)" : "", prompt: "Solution(s) (type none if there are none):", kind: "set", mode: "final", answer: sol, marks: extra.length ? 2 : 2 }, ...extra];
      return { kind: "wr", template: { basic: "isolated root equals a number", isolate: "isolate then square", linear: "root equals a linear expression (extraneous possible)", none: "no solution" }[T], sig: `${T}|${tex}`, title: "Radical equations", intro: R`Solve \(${tex}\) and check your answer${cands && cands.length > 1 ? "s" : ""}.`,
        parts, solution: steps, rubric: ["Squared correctly — 1", "Checked; extraneous roots rejected — 1"], hints: ["Isolate the radical first, then square both sides.", "Always substitute back: squaring can create extraneous roots."] };
    },
  });

  B.family({
    id: "c_graphical", unit: "C", sub: "C.graphical", title: "Radical equations on a graph", concepts: ["radicals.equations"],
    kinds: ["mc", "nr"], modes: ["simple", "normal", "challenge"], answer: "number", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["read the intersection", "which graphs to draw", "why a squared solution fails"],
    gen(r, mode, kind) {
      const h = -K.int(r, 0, 5), c = K.int(r, 1, 4);
      const xsol = c * c + h; // √(x − h) = c
      const G = root.Graph;
      const T = kind === "nr" ? "read" : mode === "simple" ? "which" : K.pick(r, ["which", "fail"]);
      const eq = R`\sqrt{x ${h < 0 ? "+" : "-"} ${Math.abs(h)}} = ${c}`.replace(" - 0}", "}");
      if (T === "read") {
        const tok = G ? G.token({ fns: [{ type: "sqrt", a: 1, h, k: 0 }, { type: "line", m: 0, b: c }], labels: ["y = √(x − h)", `y = ${c}`], window: { x0: h - 2, x1: xsol + 4, y0: -2, y1: c + 3 }, points: [{ x: xsol, y: c }] }, `y = square root of (x ${h < 0 ? "+" : "-"} ${Math.abs(h)}) and the line y = ${c}, meeting at one point`) : "";
        return { kind: "nr", template: "read the intersection", sig: `nr|${h}|${c}`, answer: xsol, ansText: String(xsol), q: R`The graphs of \(y = \sqrt{x ${h < 0 ? "+" : "-"} ${Math.abs(h)}}\) and \(y = ${c}\) are shown. ${tok} What is the solution of \(${eq}\)?`,
          e: R`The solution is the x-coordinate where the graphs meet: \(x = ${xsol}\). Check: \(\sqrt{${xsol} ${h < 0 ? "+" : "-"} ${Math.abs(h)}} = \sqrt{${c * c}} = ${c}\) ✓.`, hints: ["Solving f(x) = g(x) graphically means finding where the two graphs intersect — read the x-coordinate."] };
      }
      if (T === "which") {
        const sq = R`\(y = \sqrt{x ${h < 0 ? "+" : "-"} ${Math.abs(h)}}\)`;
        return { kind: "mc", c: [R`Graph ${sq} and \(y = ${c}\); the solution is the x-coordinate where they meet`, R`Graph ${sq} and \(y = ${c}\); the solution is the y-coordinate where they meet`, R`Graph \(y = \sqrt{x ${h < 0 ? "+" : "-"} ${Math.abs(h)}} - ${c}\) and read its y-intercept`, R`Graph \(y = ${c}\) only and read its x-intercept`], template: "which graphs to draw", sig: `which|${h}|${c}`,
          q: R`How could you solve \(${eq}\) graphically?`, e: R`Each side becomes a function. The equation is true where the two graphs have the same y-value, i.e. at their intersection; the solution is its x-coordinate, \(x = ${xsol}\).`, hints: ["Turn each side of the equation into its own graph."] };
      }
      return { kind: "mc", c: [R`Because \(\sqrt{x ${h < 0 ? "+" : "-"} ${Math.abs(h)}} \ge 0\), its graph never reaches \(y = -${c}\): the graphs don't intersect`, R`Because the graphs intersect at \(x = ${xsol}\)`, R`Because \(x = ${xsol}\) makes the radicand negative`, R`Because the square-root graph is a straight line`], template: "why a squared solution fails", sig: `fail|${h}|${c}`,
        q: R`Squaring both sides of \(\sqrt{x ${h < 0 ? "+" : "-"} ${Math.abs(h)}} = -${c}\) gives \(x = ${xsol}\). Why is there actually no solution?`,
        e: R`The graph of a principal square root lies on or above the x-axis, and \(y = -${c}\) is below it. No intersection means no solution; \(x = ${xsol}\) is extraneous.`, hints: ["Think about where the graph of y = √(…) can be."] };
    },
  });

  // ───────── Unit D: factoring (exact polynomial checking; fully-factored form enforced) ─────────
  const lin = (a, b) => `(${K.linStr(a, b)})`;
  const linT = (a, b) => R`\left(${K.linTeX(a, b)}\right)`;
  function dFamily(id, sub, title, templates, modes, build) {
    B.family({ id, unit: "D", sub, title, concepts: ["factoring.trinomials", "factoring.special", "factoring.quadratic_form"].filter((c) => build.concepts ? build.concepts.includes(c) : c === "factoring.trinomials"), kinds: ["wr"], modes, answer: "factored polynomial", complexity: { simple: 1, normal: 2, challenge: 3 }, templates, gen: build });
  }
  dFamily("d_gcf", "D.gcf", "Greatest common factor", ["numeric GCF", "monomial GCF", "binomial common factor"], ["simple", "normal", "challenge"], function (r, mode) {
    const T = mode === "simple" ? "num" : mode === "normal" ? K.pick(r, ["mono", "num"]) : K.pick(r, ["binom", "mono"]);
    let tex, ans, steps;
    if (T === "num") {
      const g = K.int(r, 2, 9), a = K.int(r, 1, 7), b = K.nz(r, -9, 9);
      if (K.gcd(a, b) > 1) throw new Error("primitive");
      tex = K.polyTeX([g * b, g * a]); ans = `${g}${lin(a, b)}`;
      steps = [R`The greatest common factor of ${g * a} and ${Math.abs(g * b)} is ${g}.`, R`\(${tex} = ${g}${linT(a, b)}\).`];
    } else if (T === "mono") {
      const g = K.int(r, 2, 6), a = K.int(r, 1, 5), b = K.nz(r, -7, 7), c = K.nz(r, -7, 7);
      if (K.gcd(K.gcd(a, b), c) > 1) throw new Error("primitive");
      // g x (a x² + b x + c)
      const D = b * b - 4 * a * c; if (D >= 0 && Math.round(Math.sqrt(D)) ** 2 === D) throw new Error("would factor further");
      tex = K.polyTeX([0, g * c, g * b, g * a]); ans = `${g}x(${K.polyStr([c, b, a])})`;
      steps = [R`Every term has a factor \(${g}x\).`, R`\(${tex} = ${g}x\left(${K.polyTeX([c, b, a])}\right)\).`];
    } else {
      const p = K.nz(r, -6, 6), a = K.int(r, 2, 5), b = K.nz(r, -6, 6);
      // a x (x + p) + b (x + p) = (x + p)(a x + b)
      if (b % a === 0 || K.gcd(a, b) > 1) throw new Error("tidy");
      tex = R`${a}x\left(${K.linTeX(1, p)}\right) ${b > 0 ? "+" : "-"} ${Math.abs(b)}\left(${K.linTeX(1, p)}\right)`;
      ans = `${lin(1, p)}${lin(a, b)}`;
      steps = [R`The binomial \(\left(${K.linTeX(1, p)}\right)\) is common to both terms.`, R`Factor it out: \(${linT(1, p)}${linT(a, b)}\).`];
    }
    return { kind: "wr", template: { num: "numeric GCF", mono: "monomial GCF", binom: "binomial common factor" }[T], sig: `${T}|${tex}`, title: "Common factors", intro: R`Factor completely: \(${tex}\).`,
      parts: [{ key: "a", label: "", prompt: "Factored form:", kind: "poly", answer: ans, form: "factored", marks: 2 }], solution: steps, rubric: ["Correct GCF — 1", "Fully factored — 1"], hints: ["Find the largest factor (number and variable) every term shares.", "Check by expanding your answer."] };
  });
  dFamily("d_trinomials", "D.trinomials", "Factor x² + bx + c", ["two positive roots", "mixed signs", "with a common factor first"], ["simple", "normal", "challenge"], function (r, mode) {
    const m = mode === "simple" ? 9 : 12;
    let p = K.nz(r, -m, m), q = K.nz(r, -m, m);
    if (mode === "simple") { p = Math.abs(p); q = Math.abs(q); }
    if (p === q && mode !== "challenge") throw new Error("square handled in special");
    const g = mode === "challenge" ? K.int(r, 2, 5) : 1;
    const cs = K.pmul([p, 1], [q, 1]).map((c) => c * g);
    const tex = K.polyTeX(cs);
    return { kind: "wr", template: g > 1 ? "with a common factor first" : p > 0 && q > 0 ? "two positive roots" : "mixed signs", sig: `${g}|${[p, q].sort((a, b) => a - b).join(",")}`, title: "Factor a trinomial", intro: R`Factor completely: \(${tex}\).`,
      parts: [{ key: "a", label: "", prompt: "Factored form:", kind: "poly", answer: `${g > 1 ? g : ""}${lin(1, p)}${lin(1, q)}`, form: "factored", marks: 2 }],
      solution: [...(g > 1 ? [R`Common factor ${g}: \(${g}\left(${K.polyTeX(K.pmul([p, 1], [q, 1]))}\right)\).`] : []), R`Find two numbers that multiply to ${p * q} and add to ${p + q}: ${p} and ${q}.`, R`\(${g > 1 ? g : ""}${linT(1, p)}${linT(1, q)}\). Check by expanding.`],
      rubric: ["Correct pair — 1", "Fully factored — 1"], hints: [`Look for two numbers with product ${p * q} and sum ${p + q}.`, ...(g > 1 ? ["Take out the common factor first."] : [])] };
  });
  dFamily("d_trinomials_a", "D.trinomials_a", "Factor ax² + bx + c", ["a is prime", "a is composite", "negative leading coefficient"], ["simple", "normal", "challenge"], function (r, mode) {
    const a1 = mode === "simple" ? 1 : K.int(r, 2, mode === "normal" ? 3 : 5), a2 = K.int(r, 2, mode === "simple" ? 3 : 4);
    const b1 = K.nz(r, -7, 7), b2 = K.nz(r, -7, 7);
    if (K.gcd(a1, b1) > 1 || K.gcd(a2, b2) > 1) throw new Error("content");
    const neg = mode === "challenge" && K.coin(r);
    let cs = K.pmul([b1, a1], [b2, a2]);
    if (neg) cs = cs.map((c) => -c);
    const tex = K.polyTeX(cs);
    const ans = `${neg ? "-" : ""}${lin(a1, b1)}${lin(a2, b2)}`;
    const ac = cs[2] * cs[0];
    return { kind: "wr", template: neg ? "negative leading coefficient" : [2, 3, 5, 7].includes(cs[2]) ? "a is prime" : "a is composite", sig: `${neg}|${tex}`, title: "Factor a trinomial (a ≠ 1)", intro: R`Factor completely: \(${tex}\).`,
      parts: [{ key: "a", label: "", prompt: "Factored form:", kind: "poly", answer: ans, form: "factored", marks: 2 }],
      solution: [...(neg ? [R`Factor out −1 first.`] : []), R`Decomposition: \(a c = ${Math.abs(ac)}\). Find two numbers with product ${neg ? -ac : ac} and sum ${neg ? -cs[1] : cs[1]}: ${a1 * b2} and ${a2 * b1}.`, R`Split the middle term and group: \(${neg ? "-" : ""}${linT(a1, b1)}${linT(a2, b2)}\). Check by expanding.`],
      rubric: ["Correct factors — 1", "Fully factored — 1"], hints: ["Multiply a·c, then find two numbers with that product that add to b.", "Split the middle term and factor by grouping."] };
  });
  dFamily("d_special", "D.diff_squares", "Difference of squares and perfect squares", ["difference of squares", "perfect square trinomial", "two-step difference of squares"], ["simple", "normal", "challenge"], Object.assign(function (r, mode) {
    const T = mode === "simple" ? K.pick(r, ["dos", "psq"]) : mode === "normal" ? K.pick(r, ["dos", "psq", "dos2"]) : K.pick(r, ["dos2", "quart", "psq"]);
    let tex, ans, steps;
    if (T === "dos") { const a = K.int(r, 1, mode === "simple" ? 3 : 7), b = K.int(r, 1, 12); if (K.gcd(a, b) > 1) throw new Error("c"); tex = K.polyTeX([-b * b, 0, a * a]); ans = `${lin(a, -b)}${lin(a, b)}`; steps = [R`\(${tex} = (${a === 1 ? "" : a}x)^2 - ${b}^2\).`, R`Difference of squares: \(${linT(a, -b)}${linT(a, b)}\).`]; }
    else if (T === "psq") { const a = K.int(r, 1, 4), b = K.nz(r, -9, 9); if (K.gcd(a, b) > 1) throw new Error("c"); tex = K.polyTeX([b * b, 2 * a * b, a * a]); ans = `${lin(a, b)}^2`; steps = [R`First and last terms are squares: \((${a === 1 ? "" : a}x)^2\) and \(${b}^2\), and the middle is \(2(${a === 1 ? "" : a}x)(${b})\).`, R`So \(${tex} = ${linT(a, b)}^2\).`]; }
    else if (T === "dos2") { const g = K.int(r, 2, 5), a = K.int(r, 1, 3), b = K.int(r, 1, 6); if (K.gcd(a, b) > 1) throw new Error("c"); tex = K.polyTeX([-g * b * b, 0, g * a * a]); ans = `${g}${lin(a, -b)}${lin(a, b)}`; steps = [R`Common factor ${g}: \(${g}\left(${K.polyTeX([-b * b, 0, a * a])}\right)\).`, R`Then a difference of squares: \(${g}${linT(a, -b)}${linT(a, b)}\).`]; }
    else { const b = K.int(r, 1, 3); tex = K.polyTeX([-Math.pow(b, 4), 0, 0, 0, 1]); ans = `(x^2+${b * b})${lin(1, -b)}${lin(1, b)}`; steps = [R`\(x^4 - ${Math.pow(b, 4)} = (x^2 - ${b * b})(x^2 + ${b * b})\).`, R`Factor again: \((x - ${b})(x + ${b})(x^2 + ${b * b})\). The sum of squares doesn't factor over the reals.`]; }
    return { kind: "wr", template: { dos: "difference of squares", psq: "perfect square trinomial", dos2: "two-step difference of squares", quart: "two-step difference of squares" }[T], sig: `${T}|${tex}`, title: "Special products", intro: R`Factor completely: \(${tex}\).`,
      parts: [{ key: "a", label: "", prompt: "Factored form:", kind: "poly", answer: ans, form: "factored", marks: 2 }], solution: steps, rubric: ["Pattern recognised — 1", "Fully factored — 1"],
      hints: ["a² − b² = (a − b)(a + b).", "a² + 2ab + b² = (a + b)².", "Take out a common factor first, then look again."] };
  }, { concepts: ["factoring.special"] }));
  dFamily("d_substitution", "D.substitution", "Factor using substitution", ["repeated binomial", "quadratic in x²"], ["normal", "challenge"], Object.assign(function (r, mode) {
    const T = mode === "normal" ? "binom" : K.pick(r, ["binom", "quartic"]);
    const p = K.nz(r, -5, 5), q = K.nz(r, -5, 5);
    if (T === "binom") {
      const k = K.nz(r, -4, 4);
      // (x + k)² + s(x + k) + t with s = p + q, t = pq → (x + k + p)(x + k + q)
      const s = p + q, t = p * q;
      const tex = R`\left(${K.linTeX(1, k)}\right)^2 ${s >= 0 ? "+" : "-"} ${Math.abs(s) === 1 ? "" : Math.abs(s)}\left(${K.linTeX(1, k)}\right) ${t >= 0 ? "+" : "-"} ${Math.abs(t)}`.replace(/\+ 0\\left\([^)]*\)/, "");
      if (s === 0) throw new Error("tidy");
      return { kind: "wr", template: "repeated binomial", sig: `b|${k}|${[p, q].sort().join(",")}`, title: "Factor by substitution", intro: R`Factor completely: \(${tex}\).`,
        parts: [{ key: "a", label: "", prompt: "Factored form (in x):", kind: "poly", answer: `${lin(1, k + p)}${lin(1, k + q)}`, form: "factored", marks: 2 }],
        solution: [R`Let \(u = ${K.linTeX(1, k)}\): \(u^2 ${s >= 0 ? "+" : "-"} ${Math.abs(s)}u ${t >= 0 ? "+" : "-"} ${Math.abs(t)} = (u ${p >= 0 ? "+" : "-"} ${Math.abs(p)})(u ${q >= 0 ? "+" : "-"} ${Math.abs(q)})\).`, R`Substitute back: \(${linT(1, k + p)}${linT(1, k + q)}\).`],
        rubric: ["Factored in u — 1", "Back-substituted and simplified — 1"], hints: [R`Replace the repeated bracket with a single letter, factor, then put it back.`] };
    }
    const a = K.int(r, 1, 3), b = K.int(r, 2, 4); if (a === b) throw new Error("same");
    // x⁴ − (a² + b²)x² + a²b² = (x − a)(x + a)(x − b)(x + b)
    const cs = [a * a * b * b, 0, -(a * a + b * b), 0, 1];
    return { kind: "wr", template: "quadratic in x²", sig: `q|${a}|${b}`, title: "Factor by substitution", intro: R`Factor completely: \(${K.polyTeX(cs)}\).`,
      parts: [{ key: "a", label: "", prompt: "Factored form:", kind: "poly", answer: `${lin(1, -a)}${lin(1, a)}${lin(1, -b)}${lin(1, b)}`, form: "factored", marks: 2 }],
      solution: [R`Let \(u = x^2\): \(u^2 - ${a * a + b * b}u + ${a * a * b * b} = (u - ${a * a})(u - ${b * b})\).`, R`Back to x: \((x^2 - ${a * a})(x^2 - ${b * b})\), and each is a difference of squares: \((x - ${a})(x + ${a})(x - ${b})(x + ${b})\).`],
      rubric: ["Factored in u — 1", "Fully factored — 1"], hints: ["It's a quadratic in x²: let u = x².", "Then look for differences of squares."] };
  }, { concepts: ["factoring.quadratic_form"] }));
  // strategy and checking: which method, and is a given factoring correct?
  B.family({
    id: "d_strategy", unit: "D", sub: "D.strategy", title: "Choose a factoring strategy", concepts: ["factoring.trinomials", "factoring.special"],
    kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "choice", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["first step", "check by expanding", "is it fully factored?"],
    gen(r, mode) {
      const T = mode === "simple" ? "first" : K.pick(r, ["first", "check", "full"]);
      if (T === "first") {
        const kinds = [
          () => { const g = K.int(r, 2, 6), a = K.int(r, 1, 3), b = K.int(r, 1, 6); return { tex: K.polyTeX([-g * b * b, 0, g * a * a]), good: "Take out the common factor first" }; },
          () => { const b = K.int(r, 2, 11); return { tex: K.polyTeX([-b * b, 0, 1]), good: "Difference of squares" }; },
          () => { const p = K.nz(r, -8, 8), q = K.nz(r, -8, 8); if (p === q) throw new Error("x"); return { tex: K.polyTeX(K.pmul([p, 1], [q, 1])), good: "Find two numbers with the right product and sum" }; },
          () => { const b = K.nz(r, -7, 7); return { tex: K.polyTeX([b * b, 2 * b, 1]), good: "Perfect square trinomial" }; },
        ];
        const k = K.pick(r, kinds)();
        const all = ["Take out the common factor first", "Difference of squares", "Find two numbers with the right product and sum", "Perfect square trinomial", "Decomposition (split the middle term)"];
        return { ...K.mc(k.good, all.filter((x) => x !== k.good)), template: "first step", sig: `first|${k.tex}`, q: R`What is the best first step to factor \(${k.tex}\)?`, e: `Look for a common factor first, then count terms: two terms → difference of squares; three terms → product/sum (or a perfect square).`, hints: ["Always check for a GCF first.", "Two terms → difference of squares? Three terms → trinomial."] };
      }
      const p = K.nz(r, -7, 7), q = K.nz(r, -7, 7);
      if (p === -q || p === q) throw new Error("tidy");
      const cs = K.pmul([p, 1], [q, 1]), tex = K.polyTeX(cs);
      if (T === "check") {
        const good = R`\(${linT(1, p)}${linT(1, q)}\)`;
        return { ...K.mc(good, [R`\(${linT(1, -p)}${linT(1, -q)}\)`, R`\(${linT(1, p)}${linT(1, -q)}\)`, R`\(${linT(1, p + q)}${linT(1, 1)}\)`, R`\(${linT(1, p * q)}${linT(1, 1)}\)`]), template: "check by expanding", sig: `check|${tex}`,
          q: R`Which factorization of \(${tex}\) is correct? (Check by expanding.)`, e: R`Expand \(${linT(1, p)}${linT(1, q)} = x^2 + (${p} + ${q})x + ${p * q} = ${tex}\) ✓.`, hints: ["Expand each option: the middle term is the sum, the last term is the product."] };
      }
      const g = K.int(r, 2, 4);
      const full = R`\(${g}${linT(1, p)}${linT(1, q)}\)`;
      return { ...K.mc(full, [R`\(${linT(g, g * p)}${linT(1, q)}\)`, R`\(${g}\left(${K.polyTeX(cs)}\right)\)`, R`\(${linT(1, p)}\left(${K.linTeX(g, g * q)}\right)\)`]), template: "is it fully factored?", sig: `full|${g}|${tex}`,
        q: R`Which is the <b>fully</b> factored form of \(${K.polyTeX(cs.map((c) => c * g))}\)?`, e: R`Every option is equal, but only \(${g}${linT(1, p)}${linT(1, q)}\) has no factor left that can be factored again (no common factor inside a bracket, no trinomial left).`, hints: ["Equal isn't enough: nothing inside a bracket should still factor."] };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
