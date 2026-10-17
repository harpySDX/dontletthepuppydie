/*
 * Unit G — linear and quadratic inequalities. Answers are compared as exact unions of intervals,
 * whether the learner writes interval notation (−∞, 3] ∪ [5, ∞) or inequalities (x ≤ 3 or x ≥ 5).
 */
(function (root) {
  "use strict";
  const B = root.Bank; if (!B) return;
  const { K } = B;
  const R = String.raw;
  const QM = () => root.QuadMath;
  const OPS = ["<", "<=", ">", ">="];
  const opTeX = { "<": "<", "<=": "\\le", ">": ">", ">=": "\\ge" };
  const flip = { "<": ">", "<=": ">=", ">": "<", ">=": "<=" };
  const fs = (f) => QM().fstr(f), ft = (f) => QM().ftex(f);
  const ray = (op, v) => (op === "<" ? `(-inf, ${v})` : op === "<=" ? `(-inf, ${v}]` : op === ">" ? `(${v}, inf)` : `[${v}, inf)`);

  B.family({
    id: "g_linear", unit: "G", sub: "G.linear", title: "Solve a linear inequality", concepts: ["ineq.linear"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "interval", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["one step", "variables on both sides", "dividing by a negative (flip)", "fractions"],
    gen(r, mode, kind) {
      const M = QM();
      const op = K.pick(r, OPS);
      let tex, a, rhs, steps, T;
      if (mode === "simple") { T = "one"; a = K.int(r, 2, 6); const b = K.nz(r, -9, 9), c = K.int(r, -12, 12); tex = R`${a}x ${b > 0 ? "+" : "-"} ${Math.abs(b)} ${opTeX[op]} ${c}`; rhs = M.F(c - b, a); steps = [R`Subtract ${b}: \(${a}x ${opTeX[op]} ${c - b}\).`, R`Divide by ${a} (positive, no flip): \(x ${opTeX[op]} ${ft(rhs)}\).`]; }
      else if (mode === "normal") { T = K.pick(r, ["both", "flip"]); a = T === "flip" ? -K.int(r, 2, 6) : K.int(r, 2, 6); const b = K.int(r, -9, 9), c = K.int(r, 1, 4) * (T === "flip" ? 1 : 0), d = K.int(r, -12, 12);
        const lhsA = a + c; tex = R`${lhsA === 1 ? "" : lhsA === -1 ? "-" : lhsA}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} ${opTeX[op]} ${c ? `${c === 1 ? "" : c}x ${d >= 0 ? "+" : "-"} ${Math.abs(d)}` : d}`;
        rhs = M.F(d - b, a); steps = [R`Collect x on the left: \(${a}x ${opTeX[op]} ${d - b}\).`, a < 0 ? R`Divide by ${a}: dividing by a negative flips the sign, \(x ${opTeX[flip[op]]} ${ft(rhs)}\).` : R`Divide by ${a}: \(x ${opTeX[op]} ${ft(rhs)}\).`]; }
      else { T = "frac"; const d = K.pick(r, [2, 3, 4]); const p = K.nz(r, -6, 6), c = K.int(r, -6, 6), sg = K.coin(r) ? -1 : 1;
        // sg·(x − p)/d  op  c   →  x − p  op'  sg·c·d   →  x op' sg·c·d + p
        tex = R`${sg < 0 ? "-" : ""}\dfrac{x ${p > 0 ? "-" : "+"} ${Math.abs(p)}}{${d}} ${opTeX[op]} ${c}`;
        rhs = M.F(sg * c * d + p); a = sg;
        steps = [R`Multiply both sides by ${sg * d}${sg < 0 ? " — a negative, so the sign flips" : ""}: \(x ${p > 0 ? "-" : "+"} ${Math.abs(p)} ${opTeX[sg < 0 ? flip[op] : op]} ${sg * c * d}\).`, R`${p > 0 ? "Add" : "Subtract"} ${Math.abs(p)}: \(x ${opTeX[sg < 0 ? flip[op] : op]} ${ft(rhs)}\).`]; }
      const finalOp = a < 0 ? flip[op] : op;
      const ans = ray(finalOp, fs(rhs));
      if (kind === "mc") {
        const wrong = [ray(flip[finalOp], fs(rhs)), ray(finalOp.length === 1 ? finalOp + "=" : finalOp[0], fs(rhs)), ray(finalOp, fs(M.fneg(rhs)))];
        const show = (s) => R`\(${root.AnswerCheck.intervalTeX(root.AnswerCheck.readInterval(s).set)}\)`;
        return { ...K.mc(show(ans), wrong.map(show)), template: { one: "one step", both: "variables on both sides", flip: "dividing by a negative (flip)", frac: "fractions" }[T], sig: `mc|${tex}`,
          q: R`Which interval is the solution of \(${tex}\)?`, e: steps.join(" "), hints: ["Solve like an equation, but flip the sign whenever you multiply or divide by a negative."] };
      }
      return { kind: "wr", template: { one: "one step", both: "variables on both sides", flip: "dividing by a negative (flip)", frac: "fractions" }[T], sig: `wr|${tex}`, title: "Linear inequalities", intro: R`Solve \(${tex}\). Write the answer in interval notation (or as an inequality).`,
        parts: [{ key: "a", label: "", prompt: "Solution:", kind: "interval", answer: ans, marks: 2 }], solution: steps, rubric: ["Boundary — 1", "Direction and endpoint — 1"],
        hints: ["Isolate x as you would in an equation.", "Multiplying or dividing by a negative reverses the inequality.", "< and > give round brackets; ≤ and ≥ give square brackets."] };
    },
  });

  B.family({
    id: "g_interval", unit: "G", sub: "G.interval", title: "Interval notation", concepts: ["ineq.linear"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "interval", complexity: { simple: 1, normal: 1, challenge: 2 },
    templates: ["inequality → interval", "double inequality", "union of two rays", "interval → inequality (choice)"],
    gen(r, mode, kind) {
      const a = K.int(r, -9, 5), b = a + K.int(r, 1, 8);
      const T = kind === "mc" ? "toineq" : mode === "simple" ? "ray" : mode === "normal" ? K.pick(r, ["ray", "double"]) : K.pick(r, ["double", "union"]);
      const lc = K.coin(r), rc = K.coin(r);
      if (T === "toineq") {
        const iv = `${lc ? "[" : "("}${a}, ${b}${rc ? "]" : ")"}`;
        const ineq = (l, rr) => R`\(${a} ${l ? "\\le" : "<"} x ${rr ? "\\le" : "<"} ${b}\)`;
        return { ...K.mc(ineq(lc, rc), [ineq(!lc, rc), ineq(lc, !rc), ineq(!lc, !rc), R`\(x ${lc ? "\\le" : "<"} ${a}\ \text{or}\ x ${rc ? "\\ge" : ">"} ${b}\)`]), template: "interval → inequality (choice)", sig: `mc|${iv}`,
          q: R`Which inequality describes \(${iv.replace("[", "\\left[").replace("(", "\\left(").replace("]", "\\right]").replace(")", "\\right)")}\)?`, e: "A square bracket includes the endpoint (≤ or ≥); a round bracket excludes it (< or >).", hints: ["[ ] means the endpoint is included."] };
      }
      let tex, ans;
      if (T === "ray") { const op = K.pick(r, OPS); tex = R`x ${opTeX[op]} ${a}`; ans = ray(op, a); }
      else if (T === "double") { tex = R`${a} ${lc ? "\\le" : "<"} x ${rc ? "\\le" : "<"} ${b}`; ans = `${lc ? "[" : "("}${a}, ${b}${rc ? "]" : ")"}`; }
      else { tex = R`x ${lc ? "\\le" : "<"} ${a}\ \text{or}\ x ${rc ? "\\ge" : ">"} ${b}`; ans = `(-inf, ${a}${lc ? "]" : ")"} U ${rc ? "[" : "("}${b}, inf)`; }
      return { kind: "wr", template: { ray: "inequality → interval", double: "double inequality", union: "union of two rays" }[T], sig: `${T}|${tex}`, title: "Interval notation", intro: R`Write \(${tex}\) in interval notation.`,
        parts: [{ key: "a", label: "", prompt: "Interval:", kind: "interval", answer: ans, marks: 1 }],
        solution: [R`Answer: \(${root.AnswerCheck.intervalTeX(root.AnswerCheck.readInterval(ans).set)}\). Square brackets include an endpoint; ∞ always gets a round bracket.`], rubric: ["Interval — 1"], hints: ["Type ∞ as inf, and ∪ as U."] };
    },
  });

  // sign of a quadratic: from its zeros and direction
  function quadParts(r, mode) {
    const p = K.int(r, -7, 5), q = p + K.int(r, 1, mode === "simple" ? 6 : 8);
    const a = mode === "simple" ? 1 : K.pick(r, [1, -1, 2, -2]);
    return { p, q, a, cs: K.pmul([-p, 1], [-q, 1]).map((c) => c * a) };
  }
  B.family({
    id: "g_sign", unit: "G", sub: "G.sign", title: "Where is it positive or negative?", concepts: ["ineq.quadratic"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "interval", complexity: { simple: 1, normal: 2, challenge: 2 },
    templates: ["from the graph", "from factored form", "sign chart"],
    gen(r, mode, kind) {
      const { p, q, a, cs } = quadParts(r, mode);
      const wantPos = K.coin(r);
      const outside = (a > 0) === wantPos;
      const ans = outside ? `(-inf, ${p}) U (${q}, inf)` : `(${p}, ${q})`;
      const fT = R`f(x) = ${a === 1 ? "" : a === -1 ? "-" : a}\left(x ${p > 0 ? "-" : "+"} ${Math.abs(p)}\right)\left(x ${q > 0 ? "-" : "+"} ${Math.abs(q)}\right)`.replace("x + 0", "x").replace("x - 0", "x");
      const G = root.Graph;
      if (kind === "mc") {
        const tok = G ? G.token({ fns: [{ a, b: cs[1], c: cs[0] }], marks: { xint: true } }, `parabola opening ${a > 0 ? "up" : "down"} with zeros ${p} and ${q}`) : "";
        const show = (s) => R`\(${root.AnswerCheck.intervalTeX(root.AnswerCheck.readInterval(s).set)}\)`;
        const other = outside ? `(${p}, ${q})` : `(-inf, ${p}) U (${q}, inf)`;
        return { ...K.mc(show(ans), [show(other), show(outside ? `(-inf, ${p}] U [${q}, inf)` : `[${p}, ${q}]`), show(`(${-q}, ${-p})`)]), template: "from the graph", sig: `mc|${a}|${p}|${q}|${wantPos}`,
          q: R`The graph of \(y = f(x)\) is shown. ${tok} For which x-values is \(f(x) ${wantPos ? ">" : "<"} 0\)?`,
          e: R`\(f(x) ${wantPos ? ">" : "<"} 0\) where the graph is ${wantPos ? "above" : "below"} the x-axis: ${outside ? `outside the zeros, x < ${p} or x > ${q}` : `between the zeros, ${p} < x < ${q}`}. The zeros themselves give 0, so they're excluded.`,
          hints: ["Positive means above the x-axis, negative means below."] };
      }
      return { kind: "wr", template: mode === "challenge" ? "sign chart" : "from factored form", sig: `wr|${a}|${p}|${q}|${wantPos}`, title: "Sign of a quadratic",
        intro: R`For \(${fT}\), find where \(f(x) ${wantPos ? ">" : "<"} 0\).`,
        parts: [{ key: "a", label: "", prompt: "Interval(s):", kind: "interval", answer: ans, marks: 2 }],
        solution: [R`Zeros: \(x = ${p}\) and \(x = ${q}\). They split the number line into three intervals.`, R`Test a value in each, or use the shape: it opens ${a > 0 ? "up" : "down"}, so it is ${a > 0 ? "positive outside and negative between" : "negative outside and positive between"} the zeros.`, R`So \(f(x) ${wantPos ? ">" : "<"} 0\) on \(${root.AnswerCheck.intervalTeX(root.AnswerCheck.readInterval(ans).set)}\).`],
        rubric: ["Zeros — 1", "Correct region(s) — 1"], hints: ["Find the zeros, then test one x-value in each interval.", "A parabola opening up is negative only between its zeros."] };
    },
  });

  B.family({
    id: "g_quadratic", unit: "G", sub: "G.quadratic", title: "Solve a quadratic inequality", concepts: ["ineq.quadratic"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "interval", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["factored and compared to 0", "trinomial ≤ 0 / ≥ 0", "rearrange first", "no zeros (all or none)"],
    gen(r, mode) {
      const op = K.pick(r, OPS);
      const T = mode === "simple" ? "fact" : mode === "normal" ? K.pick(r, ["tri", "fact"]) : K.pick(r, ["rearr", "none", "tri"]);
      if (T === "none") {
        const h = K.int(r, -4, 4), k = K.int(r, 1, 6);
        const cs = [h * h + k, -2 * h, 1];
        const always = op === ">" || op === ">=";
        return { kind: "wr", template: "no zeros (all or none)", sig: `none|${cs.join(",")}|${op}`, title: "Quadratic inequalities", intro: R`Solve \(${K.polyTeX(cs)} ${opTeX[op]} 0\).`,
          parts: [{ key: "a", label: "", prompt: "Solution (interval, all real numbers, or no solution):", kind: "interval", answer: always ? "(-inf, inf)" : "none", marks: 2 }],
          solution: [R`Complete the square: \(\left(x ${h > 0 ? "-" : "+"} ${Math.abs(h)}\right)^2 + ${k}\), which is always at least ${k} > 0.`.replace("x + 0", "x").replace("x - 0", "x"), always ? "So it is positive for every x: all real numbers." : "So it is never negative (or zero): no solution."],
          rubric: ["No real zeros — 1", "Conclusion — 1"], hints: ["Check the discriminant: no real zeros means the graph never crosses the x-axis."] };
      }
      const { p, q, a, cs } = quadParts(r, mode === "challenge" ? "normal" : mode);
      const inside = (a > 0) === (op[0] === "<");
      const cl = op.length === 2;
      const ans = inside ? `${cl ? "[" : "("}${p}, ${q}${cl ? "]" : ")"}` : `(-inf, ${p}${cl ? "]" : ")"} U ${cl ? "[" : "("}${q}, inf)`;
      let tex;
      if (T === "fact") tex = R`${a === 1 ? "" : a === -1 ? "-" : a}\left(x ${p > 0 ? "-" : "+"} ${Math.abs(p)}\right)\left(x ${q > 0 ? "-" : "+"} ${Math.abs(q)}\right) ${opTeX[op]} 0`.replace("x + 0", "x").replace("x - 0", "x");
      else if (T === "tri") tex = R`${K.polyTeX(cs)} ${opTeX[op]} 0`;
      else { const m = K.nz(r, -9, 9); tex = R`${K.polyTeX([cs[0] + m, cs[1], cs[2]])} ${opTeX[op]} ${m}`; }
      return { kind: "wr", template: { fact: "factored and compared to 0", tri: "trinomial ≤ 0 / ≥ 0", rearr: "rearrange first" }[T], sig: `${T}|${tex}`, title: "Quadratic inequalities",
        intro: R`Solve \(${tex}\). Give your answer in interval notation.`,
        parts: [{ key: "a", label: "", prompt: "Solution:", kind: "interval", answer: ans, marks: 3 }],
        solution: [...(T === "rearr" ? [R`Move everything to one side: \(${K.polyTeX(cs)} ${opTeX[op]} 0\).`] : []), R`Zeros: \(x = ${p}\) and \(x = ${q}\).`, R`The parabola opens ${a > 0 ? "up" : "down"}, so it is ${op[0] === "<" ? "below" : "above"} the axis ${inside ? "between" : "outside"} the zeros.`, R`${cl ? "The zeros satisfy the ≤/≥, so they're included" : "Strict inequality: the zeros are excluded"}: \(${root.AnswerCheck.intervalTeX(root.AnswerCheck.readInterval(ans).set)}\).`],
        rubric: ["Zeros — 1", "Correct region(s) — 1", "Endpoints included or not — 1"], hints: ["Get 0 on one side and find the zeros.", "Sketch the parabola (or test a point) to see where it is above or below the axis."] };
    },
  });

  B.family({
    id: "g_context", unit: "G", sub: "G.context", title: "Inequalities in context", concepts: ["ineq.quadratic"],
    kinds: ["wr"], modes: ["normal", "challenge"], answer: "interval", complexity: { normal: 2, challenge: 3 },
    templates: ["time above a height", "profit at least a target", "budget (linear)"],
    gen(r, mode) {
      const T = mode === "normal" ? K.pick(r, ["budget", "height"]) : K.pick(r, ["height", "profit"]);
      if (T === "budget") {
        const fee = K.int(r, 20, 60), per = K.pick(r, [4, 5, 6, 8]), budget = fee + per * K.int(r, 5, 25) + K.int(r, 0, per - 1);
        const n = Math.floor((budget - fee) / per);
        return { kind: "wr", template: "budget (linear)", sig: `b|${fee}|${per}|${budget}`, title: "Budget", intro: R`A climbing gym charges $${fee} to join plus $${per} per visit. You can spend at most $${budget}.`,
          parts: [{ key: "a", label: "(a)", prompt: "Solve the inequality for the number of visits v (as an interval):", kind: "interval", answer: `[0, ${budget - fee}/${per}]`, marks: 1, ansTex: R`0 \le v \le ${ft(QM().F(budget - fee, per))}` }, { key: "b", label: "(b)", prompt: "Greatest whole number of visits:", kind: "expr", form: "value", answer: String(n), marks: 1 }],
          solution: [R`\(${fee} + ${per}v \le ${budget}\), so \(v \le ${ft(QM().F(budget - fee, per))}\), and \(v \ge 0\).`, R`Visits are whole numbers: at most ${n}.`], rubric: ["Inequality solved — 1", "Interpreted — 1"], hints: ["Write cost ≤ budget, then solve for v.", "In context, v can't be negative and must be a whole number."] };
      }
      if (T === "height") {
        // h(t) = −5t² + bt + c ≥ H  with integer roots t1 < t2: −5(t − t1)(t − t2) + H
        const t1 = K.int(r, 1, 3), t2 = t1 + K.int(r, 1, 4), H = K.pick(r, [10, 15, 20, 25]);
        const cs = K.pmul([-t1, 1], [-t2, 1]).map((c) => -5 * c); cs[0] += H;
        if (cs[0] < 0) throw new Error("start below ground");
        return { kind: "wr", template: "time above a height", sig: `h|${t1}|${t2}|${H}`, title: "Time in the air", intro: R`A ball's height is \(h(t) = ${K.polyTeX(cs, "t")}\) metres after \(t\) seconds. During what time interval is the ball at least ${H} m high?`,
          parts: [{ key: "a", label: "", prompt: "Interval of t:", kind: "interval", answer: `[${t1}, ${t2}]`, marks: 2 }],
          solution: [R`Solve \(${K.polyTeX(cs, "t")} \ge ${H}\): \(-5t^2 ${cs[1] >= 0 ? "+" : "-"} ${Math.abs(cs[1])}t ${cs[0] - H >= 0 ? "+" : "-"} ${Math.abs(cs[0] - H)} \ge 0\), i.e. \(-5(t - ${t1})(t - ${t2}) \ge 0\).`, R`It opens down, so it is non-negative between the zeros: \(${t1} \le t \le ${t2}\).`],
          rubric: ["Inequality set up — 1", "Interval — 1"], hints: ["Set h(t) ≥ the height, move everything to one side and factor."] };
      }
      // profit P(x) = −(x − p)(x − q)·k ≥ 0 region between zeros, P measured in $100s
      const p = K.int(r, 2, 6), q = p + K.int(r, 3, 8), k = K.int(r, 2, 5), target = K.pick(r, [0]);
      const cs = K.pmul([-p, 1], [-q, 1]).map((c) => -k * c);
      return { kind: "wr", template: "profit at least a target", sig: `p|${p}|${q}|${k}`, title: "Profit", intro: R`A club's profit for a fundraiser is \(P(x) = ${K.polyTeX(cs)}\) dollars when tickets cost \(x\) dollars. For which prices is the profit at least $${target}?`,
        parts: [{ key: "a", label: "", prompt: "Prices (interval):", kind: "interval", answer: `[${p}, ${q}]`, marks: 2 }],
        solution: [R`\(P(x) = -${k}(x - ${p})(x - ${q})\). It opens down with zeros at ${p} and ${q}.`, R`So \(P(x) \ge 0\) for \(${p} \le x \le ${q}\).`], rubric: ["Zeros — 1", "Interval — 1"], hints: ["Factor P(x) and find where it is non-negative."] };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
