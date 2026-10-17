/*
 * Unit E — rational expressions and equations. Expressions are built from integer linear factors, so every
 * non-permissible value, cancellation and extraneous root is known exactly from the parameters.
 */
(function (root) {
  "use strict";
  const B = root.Bank; if (!B) return;
  const { K } = B;
  const R = String.raw;
  // factor (x − r) as text/TeX; products of factors
  const f = (r0) => `(x${r0 === 0 ? "" : r0 > 0 ? `-${r0}` : `+${-r0}`})`;
  const fT = (r0) => (r0 === 0 ? "x" : R`\left(x ${r0 > 0 ? "-" : "+"} ${Math.abs(r0)}\right)`);
  const prod = (rs) => rs.map(f).join("");
  const prodT = (rs) => rs.map(fT).join("");
  const expand = (rs, lead = 1) => rs.reduce((p, r0) => K.pmul(p, [-r0, 1]), [lead]);
  const distinct = (r, n, lo = -8, hi = 8, avoid = []) => { const out = []; let g = 0; while (out.length < n && g++ < 200) { const v = K.int(r, lo, hi); if (!out.includes(v) && !avoid.includes(v)) out.push(v); } if (out.length < n) throw new Error("distinct"); return out; };
  const setAns = (vals) => [...new Set(vals)].sort((a, b) => a - b).map(String);

  B.family({
    id: "e_npv", unit: "E", sub: "E.npv", title: "Non-permissible values", concepts: ["rational.expressions"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "set of values", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["linear denominator", "factored denominator", "trinomial denominator", "division of rational expressions"],
    gen(r, mode) {
      const T = mode === "simple" ? K.pick(r, ["lin", "fact"]) : mode === "normal" ? K.pick(r, ["tri", "fact"]) : "div";
      let tex, npv, steps;
      if (T === "lin") { const p = K.nz(r, -9, 9), a = K.int(r, 2, 5); tex = R`\dfrac{${a}x}{${fT(p).replace(/\\left\(|\\right\)/g, "")}}`; npv = [p]; steps = [R`The denominator is 0 when \(x = ${p}\).`]; }
      else if (T === "fact") { const [p, q] = distinct(r, 2); tex = R`\dfrac{x + ${K.int(r, 1, 9)}}{${prodT([p, q])}}`; npv = [p, q]; steps = [R`Each factor of the denominator can be 0: \(x = ${p}\) or \(x = ${q}\).`]; }
      else if (T === "tri") { const [p, q] = distinct(r, 2); tex = R`\dfrac{${K.int(r, 2, 6)}}{${K.polyTeX(expand([p, q]))}}`; npv = [p, q]; steps = [R`Factor the denominator: \(${prodT([p, q])}\).`, R`It is 0 when \(x = ${p}\) or \(x = ${q}\).`]; }
      else {
        const [p, q, s] = distinct(r, 3);
        // A/(x−p) ÷ (x−q)/(x−s): npvs p, s (denominators) and q (divisor's numerator)
        tex = R`\dfrac{3}{${fT(p)}} \div \dfrac{${fT(q)}}{${fT(s)}}`;
        npv = [p, q, s];
        steps = [R`Denominators can't be 0: \(x \ne ${p}\), \(x \ne ${s}\).`, R`Dividing means multiplying by the reciprocal \(\dfrac{${fT(s)}}{${fT(q)}}\), so \(x \ne ${q}\) too.`];
      }
      return { kind: "wr", template: { lin: "linear denominator", fact: "factored denominator", tri: "trinomial denominator", div: "division of rational expressions" }[T], sig: `${T}|${tex}`,
        title: "Non-permissible values", intro: R`State all non-permissible values for \(${tex}\).`,
        parts: [{ key: "a", label: "", prompt: "Non-permissible values (e.g. 3, -2):", kind: "set", mode: "final", answer: setAns(npv), marks: npv.length > 1 ? 2 : 1 }],
        solution: steps, rubric: ["Every value that makes a denominator 0"], hints: ["Set each denominator (factored) equal to 0.", ...(T === "div" ? ["When dividing, the numerator of the second fraction becomes a denominator."] : [])] };
    },
  });

  B.family({
    id: "e_simplify", unit: "E", sub: "E.simplify", title: "Simplify a rational expression", concepts: ["rational.expressions"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "simplified expression", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["common binomial factor", "factor both trinomials", "opposite factors (−1)", "which cancellation is valid"],
    gen(r, mode, kind) {
      const [p, q, s] = distinct(r, 3);
      if (kind === "mc") {
        if (K.coin(r)) {
          const n = K.int(r, 2, 9);
          const tex = R`\dfrac{x + ${n}}{x + ${n + 3}}`;
          return { ...K.mc("It can't be simplified: x is not a common factor of the whole numerator and denominator", [R`\(\dfrac{${n}}{${n + 3}}\)`, R`\(\dfrac{1}{3}\)`, R`\(\dfrac{x}{x + 3}\)`]), template: "which cancellation is valid", sig: `mc|${n}`,
            q: R`What is \(${tex}\) in simplest form?`, e: "You can only cancel common factors of the entire numerator and denominator, never terms. x + " + n + " and x + " + (n + 3) + " share no factor.", hints: ["Cancel factors (things multiplied), not terms (things added)."] };
        }
        const good = R`\(\dfrac{${fT(p)}}{${K.polyTeX(expand([p, q]))}}\)`;
        return { ...K.mc(good, [R`\(\dfrac{${fT(p)}}{${fT(q)}}\)`, R`\(\dfrac{x + ${Math.abs(p) + 1}}{x^2 + ${Math.abs(q) + 1}}\)`, R`\(\dfrac{${K.polyTeX(expand([p, s]))}}{${K.polyTeX(expand([q, s]))}}\)`]), template: "which expression simplifies to a given one", sig: `mc2|${p}|${q}|${s}`,
          q: R`Which expression simplifies to \(\dfrac{1}{${fT(q)}}\) (for permissible x)?`, e: R`Factor: \(\dfrac{${fT(p)}}{${prodT([p, q])}} = \dfrac{1}{${fT(q)}}\) after cancelling \(${fT(p)}\).`, hints: ["Factor each denominator and look for the factor that cancels."] };
      }
      const T = mode === "simple" ? "binom" : mode === "normal" ? K.pick(r, ["tri", "binom"]) : K.pick(r, ["tri", "opp"]);
      let tex, ans, npv, steps;
      if (T === "binom") {
        const a = K.int(r, 2, 6);
        tex = R`\dfrac{${a}${fT(p)}}{${fT(p)}${fT(q)}}`; ans = `${a}/${f(q)}`; npv = [p, q];
        steps = [R`Cancel the common factor \(${fT(p)}\): \(\dfrac{${a}}{${fT(q)}}\), with \(x \ne ${p}, ${q}\).`];
      } else if (T === "tri") {
        tex = R`\dfrac{${K.polyTeX(expand([p, q]))}}{${K.polyTeX(expand([p, s]))}}`; ans = `${f(q)}/${f(s)}`; npv = [p, s];
        steps = [R`Factor: \(\dfrac{${prodT([p, q])}}{${prodT([p, s])}}\).`, R`Cancel \(${fT(p)}\): \(\dfrac{${fT(q)}}{${fT(s)}}\), \(x \ne ${p}, ${s}\).`];
      } else {
        // (p − x)/((x − p)(x − q)) = −1/(x − q)
        tex = R`\dfrac{${p} - x}{${K.polyTeX(expand([p, q]))}}`; ans = `-1/${f(q)}`; npv = [p, q];
        steps = [R`\(${p} - x = -${fT(p)}\).`, R`Factor and cancel: \(\dfrac{-${fT(p)}}{${prodT([p, q])}} = -\dfrac{1}{${fT(q)}}\), \(x \ne ${p}, ${q}\).`];
      }
      return { kind: "wr", template: { binom: "common binomial factor", tri: "factor both trinomials", opp: "opposite factors (−1)" }[T], sig: `${T}|${tex}`, title: "Simplify", intro: R`Simplify \(${tex}\) and state the non-permissible values.`,
        parts: [{ key: "a", label: "(a)", prompt: "Simplified:", kind: "poly", answer: ans, form: "simplified", marks: 2 }, { key: "b", label: "(b)", prompt: "Non-permissible values:", kind: "set", mode: "final", answer: setAns(npv), marks: 1 }],
        solution: steps, rubric: ["Factored — 1", "Cancelled correctly — 1", "Non-permissible values from the ORIGINAL denominator — 1"],
        hints: ["Factor the numerator and denominator completely first.", "State the non-permissible values before you cancel."] };
    },
  });

  B.family({
    id: "e_muldiv", unit: "E", sub: "E.muldiv", title: "Multiply and divide rational expressions", concepts: ["rational.expressions"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "simplified expression", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["multiply and cancel", "divide by multiplying by the reciprocal", "factor trinomials then multiply"],
    gen(r, mode) {
      const [p, q, s, t] = distinct(r, 4);
      const T = mode === "simple" ? "mul" : mode === "normal" ? K.pick(r, ["mul", "div"]) : K.pick(r, ["tri", "div"]);
      let tex, ans, steps;
      if (T === "mul") { tex = R`\dfrac{${fT(p)}}{${fT(q)}} \cdot \dfrac{${fT(q)}}{${fT(s)}}`; ans = `${f(p)}/${f(s)}`; steps = [R`Cancel the common factor \(${fT(q)}\).`, R`Result: \(\dfrac{${fT(p)}}{${fT(s)}}\).`]; }
      else if (T === "div") { tex = R`\dfrac{${fT(p)}}{${fT(q)}} \div \dfrac{${fT(p)}${fT(s)}}{${fT(q)}${fT(t)}}`; ans = `${f(t)}/${f(s)}`; steps = [R`Multiply by the reciprocal: \(\dfrac{${fT(p)}}{${fT(q)}} \cdot \dfrac{${fT(q)}${fT(t)}}{${fT(p)}${fT(s)}}\).`, R`Cancel \(${fT(p)}\) and \(${fT(q)}\): \(\dfrac{${fT(t)}}{${fT(s)}}\).`]; }
      else { tex = R`\dfrac{${K.polyTeX(expand([p, q]))}}{${K.polyTeX(expand([s, t]))}} \cdot \dfrac{${K.polyTeX(expand([s, 0]))}}{${K.polyTeX(expand([q, 0]))}}`; ans = `${f(p)}/${f(t)}`; steps = [R`Factor everything: \(\dfrac{${prodT([p, q])}}{${prodT([s, t])}} \cdot \dfrac{${prodT([s, 0])}}{${prodT([q, 0])}}\).`, R`Cancel \(${fT(q)}\), \(${fT(s)}\) and \(x\): \(\dfrac{${fT(p)}}{${fT(t)}}\).`]; }
      return { kind: "wr", template: { mul: "multiply and cancel", div: "divide by multiplying by the reciprocal", tri: "factor trinomials then multiply" }[T], sig: `${T}|${tex}`, title: "Multiply and divide", intro: R`Simplify \(${tex}\).`,
        parts: [{ key: "a", label: "", prompt: "Simplified:", kind: "poly", answer: ans, form: "simplified", marks: 2 }],
        solution: steps, rubric: ["Factored / reciprocal — 1", "Cancelled to simplest form — 1"], hints: ["Factor first, then cancel common factors across the product.", "To divide, multiply by the reciprocal of the second fraction."] };
    },
  });

  B.family({
    id: "e_addsub", unit: "E", sub: "E.addsub", title: "Add and subtract rational expressions", concepts: ["rational.expressions"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "single simplified fraction", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["same denominator", "different linear denominators", "subtraction with a shared factor"],
    gen(r, mode) {
      const [p, q, s] = distinct(r, 3);
      const a = K.int(r, 1, 6), b = K.int(r, 1, 6) * (mode === "simple" ? 1 : K.coin(r) ? 1 : -1);
      const T = mode === "simple" ? "same" : mode === "normal" ? "diff" : K.pick(r, ["diff", "shared"]);
      let tex, ans, steps;
      if (T === "same") {
        tex = R`\dfrac{${a}x}{${fT(p)}} + \dfrac{${b}}{${fT(p)}}`; ans = `(${a}x+${b})/${f(p)}`;
        if (a * p + b === 0) throw new Error("would cancel");
        steps = [R`Same denominator: add the numerators, \(\dfrac{${a}x + ${b}}{${fT(p)}}\).`];
      } else if (T === "diff") {
        // a/(x−p) ± |b|/(x−q) = (a(x−q) + b(x−p)) / ((x−p)(x−q))
        tex = R`\dfrac{${a}}{${fT(p)}} ${b > 0 ? "+" : "-"} \dfrac{${Math.abs(b)}}{${fT(q)}}`;
        const num = [-a * q - b * p, a + b];
        if (num[1] === 0 && num[0] === 0) throw new Error("zero");
        if (num[1] !== 0 && (-num[0] / num[1] === p || -num[0] / num[1] === q)) throw new Error("would cancel");
        ans = `(${K.polyStr(num)})/(${f(p)}${f(q)})`;
        steps = [R`Common denominator \(${prodT([p, q])}\).`, R`Numerator: \(${a}${fT(q)} ${b > 0 ? "+" : "-"} ${Math.abs(b)}${fT(p)} = ${K.polyTeX(num)}\).`, R`Result: \(\dfrac{${K.polyTeX(num)}}{${prodT([p, q])}}\).`];
      } else {
        // a/((x−p)(x−q)) − b/(x−p) = (a − b(x−q)) / ((x−p)(x−q))
        const bb = Math.abs(b);
        tex = R`\dfrac{${a}}{${K.polyTeX(expand([p, q]))}} - \dfrac{${bb}}{${fT(p)}}`;
        const num = [a + bb * q, -bb];
        if (-num[0] / num[1] === p || -num[0] / num[1] === q) throw new Error("would cancel");
        ans = `(${K.polyStr(num)})/(${f(p)}${f(q)})`;
        steps = [R`Factor: \(${K.polyTeX(expand([p, q]))} = ${prodT([p, q])}\), which is the common denominator.`, R`Numerator: \(${a} - ${bb}${fT(q)} = ${K.polyTeX(num)}\).`, R`Result: \(\dfrac{${K.polyTeX(num)}}{${prodT([p, q])}}\).`];
      }
      return { kind: "wr", template: { same: "same denominator", diff: "different linear denominators", shared: "subtraction with a shared factor" }[T], sig: `${T}|${tex}`, title: "Add and subtract", intro: R`Write \(${tex}\) as a single fraction in simplest form.`,
        parts: [{ key: "a", label: "", prompt: "Single fraction:", kind: "poly", answer: ans, form: "simplified", marks: 2 }],
        solution: steps, rubric: ["Common denominator — 1", "Numerator combined and simplified — 1"], hints: ["Factor denominators and use the lowest common denominator.", "Subtracting: put the second numerator in brackets so the minus reaches every term."] };
    },
  });

  B.family({
    id: "e_equations", unit: "E", sub: "E.equations", title: "Solve a rational equation", concepts: ["rational.equations"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "solution set", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["proportion", "clear denominators (linear)", "quadratic with an extraneous root"],
    gen(r, mode) {
      const T = mode === "simple" ? "prop" : mode === "normal" ? K.pick(r, ["prop", "lin"]) : "quad";
      let tex, sol, ext = null, steps;
      if (T === "prop") {
        // a/(x − p) = b/(x − q) → a(x − q) = b(x − p) → x = (aq − bp)/(a − b)
        const [p, q] = distinct(r, 2), a = K.int(r, 1, 6), b = K.int(r, 1, 6);
        if (a === b || (a * q - b * p) % (a - b)) throw new Error("int");
        const x = (a * q - b * p) / (a - b); if (x === p || x === q) throw new Error("npv");
        tex = R`\dfrac{${a}}{${fT(p)}} = \dfrac{${b}}{${fT(q)}}`; sol = [x];
        steps = [R`Cross-multiply: \(${a}${fT(q)} = ${b}${fT(p)}\).`, R`\(${a - b}x = ${a * q - b * p}\), so \(x = ${x}\). It isn't a non-permissible value (${p}, ${q}), so it stands.`];
      } else if (T === "lin") {
        // x/(x − p) + c = k/(x − p)  → x + c(x − p) = k → x = (k + cp)/(1 + c)
        const p = K.nz(r, -6, 6), c = K.int(r, 1, 4);
        const x = K.nz(r, -8, 8); if (x === p) throw new Error("npv");
        const k = x * (1 + c) - c * p;
        tex = R`\dfrac{x}{${fT(p)}} + ${c} = \dfrac{${k}}{${fT(p)}}`; sol = [x];
        steps = [R`Multiply every term by \(${fT(p)}\) (\(x \ne ${p}\)): \(x + ${c}${fT(p)} = ${k}\).`, R`\(${1 + c}x = ${k + c * p}\), so \(x = ${x}\) ✓.`];
      } else {
        // x/(x − p) − a/(x − p)... construct: (x² ...)/(x − p) = ... with roots p (extraneous) and m
        const p = K.nz(r, -6, 6); let m = K.nz(r, -8, 8); if (m === p) throw new Error("same");
        // x²/(x − p) = (s x − t)/(x − p) where x² − s x + t = (x − p)(x − m)
        const s = p + m, t = p * m;
        tex = R`\dfrac{x^2}{${fT(p)}} = \dfrac{${K.polyTeX([-t, s])}}{${fT(p)}}`; sol = [m]; ext = [p];
        steps = [R`Multiply by \(${fT(p)}\), noting \(x \ne ${p}\): \(x^2 = ${K.polyTeX([-t, s])}\).`, R`\(${K.polyTeX([t, -s, 1])} = 0 \Rightarrow ${prodT([p, m])} = 0\), so \(x = ${p}\) or \(x = ${m}\).`, R`\(x = ${p}\) is non-permissible (it makes the denominator 0): extraneous. Solution: \(x = ${m}\).`];
      }
      const parts = [{ key: "a", label: ext ? "(a)" : "", prompt: "Solution(s) (none if there are none):", kind: "set", mode: "final", answer: setAns(sol), marks: 2 }];
      if (ext) parts.push({ key: "b", label: "(b)", prompt: "Extraneous root:", kind: "set", mode: "extraneous", answer: setAns(ext), marks: 1 });
      return { kind: "wr", template: { prop: "proportion", lin: "clear denominators (linear)", quad: "quadratic with an extraneous root" }[T], sig: `${T}|${tex}`, title: "Rational equations", intro: R`Solve \(${tex}\). Check for extraneous roots.`,
        parts, solution: steps, rubric: ["Cleared denominators — 1", "Solved and checked against non-permissible values — 1"], hints: ["State the non-permissible values first.", "Multiply every term by the lowest common denominator.", "Reject any answer that makes a denominator 0."] };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
