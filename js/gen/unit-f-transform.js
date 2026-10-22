/*
 * Unit F — transformations of the parent function y = x² (four subtopics, one family each):
 *   F.t_vertical    vertical stretches / compressions and reflections in the x-axis      y = a·x²
 *   F.t_horizontal  horizontal stretches / compressions                                  y = (b·x)²
 *   F.t_translate   translations: reading h and k, vertex and axis of symmetry            y = a(x − h)² + k
 *   F.t_combined    combinations of all of the above                                     y = a(b(x − h))² + k
 *
 * Conventions used in every question (and stated in the stems):
 *   • A "stretch / compression by a factor of s" multiplies distances from the axis by s (vertical: y-values,
 *     horizontal: x-values). y = (bx)² is a horizontal compression by a factor of 1/b when b > 1, a stretch when b < 1.
 *   • Order of transformations: stretches, compressions and reflections first, then translations.
 *   • y = (bx)² = b²x², so a horizontal scaling of y = x² gives the same graph as some vertical scaling — but it is a
 *     different transformation (and a different graph from y = bx²). Distractors never include a description that
 *     is also true.
 * Equations are graded by exact polynomial equality (QuadCheck): any equivalent form is accepted unless a part asks
 * for vertex form. Points, numbers (exact fractions) and choices are graded exactly.
 */
(function (root) {
  "use strict";
  const B = root.Bank; if (!B) return;
  const { K } = B;
  const R = String.raw;
  const QM = () => root.QuadMath;
  const fx = (s) => QM().fparse(String(s));
  const tx = (f) => QM().ftex(f);
  const sx = (f) => QM().fstr(f);
  const V = (f) => QM().fval(f);
  const abs = (f) => QM().fabs(f);
  const neg = (f) => QM().fneg(f);
  const mul = (a, b) => QM().fmul(a, b);
  const add = (a, b) => QM().fadd(a, b);
  const div = (a, b) => QM().fdiv(a, b);
  const one = () => QM().F(1);
  const isOne = (f) => QM().feq(f, one());

  // words. Wording is always consistent — "stretch" for a factor > 1, "compression" for a factor < 1 — so no
  // distractor can be read as correct under the other common convention ("stretch by a factor of 1/2").
  const scaleWord = (axis, f) => (V(f) > 1 ? R`a ${axis} stretch by a factor of \(${tx(f)}\)` : R`a ${axis} compression by a factor of \(${tx(f)}\)`);
  const vWord = (a) => { const m = abs(a); return isOne(m) ? "" : V(m) > 1 ? R`a vertical stretch by a factor of \(${tx(m)}\)` : R`a vertical compression by a factor of \(${tx(m)}\)`; };
  const refl = (a) => (V(a) < 0 ? "a reflection in the x-axis" : "");
  // horizontal factor s = 1/b for y = (bx)²
  const hWord = (b) => { const s = div(one(), b); return isOne(s) ? "" : V(s) > 1 ? R`a horizontal stretch by a factor of \(${tx(s)}\)` : R`a horizontal compression by a factor of \(${tx(s)}\)`; };
  const shiftWords = (h, k) => [V(h) ? R`a translation ${tx(abs(h))} unit${isOne(abs(h)) ? "" : "s"} ${V(h) > 0 ? "right" : "left"}` : "", V(k) ? R`a translation ${tx(abs(k))} unit${isOne(abs(k)) ? "" : "s"} ${V(k) > 0 ? "up" : "down"}` : ""].filter(Boolean);
  const listWords = (ws) => (ws.length <= 1 ? ws.join("") : ws.slice(0, -1).join(", ") + " and " + ws[ws.length - 1]);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // TeX
  const coefTeX = (a) => (isOne(a) ? "" : QM().feq(a, neg(one())) ? "-" : tx(a));
  const bxTeX = (b) => (QM().fint(b) ? `${tx(b)}x` : `${tx(b)}x`);
  const inner = (b, h) => { const sh = QM().shiftTeX(h); return isOne(b) ? sh : V(h) === 0 ? bxTeX(b) : `${tx(b)}${sh}`; };
  const eqTeX = (a, b, h, k) => { const kk = V(k) === 0 ? "" : V(k) > 0 ? ` + ${tx(k)}` : ` - ${tx(abs(k))}`; const sq = isOne(b) ? (V(h) === 0 ? "x^2" : `${QM().shiftTeX(h)}^2`) : `\\left(${inner(b, h)}\\right)^2`; return `y = ${coefTeX(a)}${sq}${kk}`; };
  // typed form (graded by polynomial equality)
  const eqStr = (a, b, h, k) => `y=${isOne(a) ? "" : V(a) === -1 ? "-" : `(${sx(a)})*`}((${sx(b)})*(x-(${sx(h)})))^2+(${sx(k)})`;
  const vertexStr = (A, h, k) => QM().vertexStr({ a: A, h, k });
  const pt = (x, y) => ({ x: sx(x), y: sx(y) });

  // values per level (difficulty comes from the reasoning, not from awkward numbers)
  const A_VALS = { simple: ["2", "3", "-1", "-2", "1/2"], normal: ["2", "3", "4", "-2", "-3", "1/2", "1/3", "-1/2"], challenge: ["3/2", "-2/3", "5/2", "-1/4", "2/5", "-3", "1/3"] };
  const B_VALS = { simple: ["2", "3", "1/2"], normal: ["2", "3", "1/2", "1/3", "4"], challenge: ["2", "3", "1/2", "1/3", "3/2", "2/3", "1/4"] };

  // ───────── F.t_vertical ─────────
  B.family({
    id: "ft_vertical", unit: "F", sub: "F.t_vertical", title: "Vertical stretches, compressions and reflections", concepts: ["quad.transform", "quad.direction"],
    kinds: ["mc", "wr"], modes: ["simple", "normal", "challenge"], answer: "description / equation / point", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["describe y = ax²", "build from a description", "map a point", "find a from a point"],
    gen(r, mode, kind) {
      const a = fx(K.pick(r, A_VALS[mode]));
      const desc = listWords([refl(a), vWord(a)].filter(Boolean));
      if (kind === "mc") {
        const m = abs(a);
        const wrong = isOne(m) ? ["No change", "A reflection in the y-axis", R`A vertical compression by a factor of \(\frac{1}{2}\) and a reflection in the x-axis`, R`A vertical stretch by a factor of 2 and a reflection in the x-axis`] : [
          listWords([V(a) < 0 ? "" : "a reflection in the x-axis", vWord(a)].filter(Boolean)) || "no change",
          listWords([refl(a), scaleWord("horizontal", m)].filter(Boolean)),
          listWords([refl(a), scaleWord("vertical", div(one(), m))].filter(Boolean)),
          listWords([refl(a) ? "a reflection in the y-axis" : "", vWord(a)].filter(Boolean)),
          listWords([refl(a), scaleWord("vertical", mul(m, m))].filter(Boolean)),
        ].map(cap);
        return { ...K.mc(cap(desc), wrong, {
          q: R`Which describes how the graph of \(${eqTeX(a, one(), QM().F(0), QM().F(0))}\) is obtained from \(y = x^2\)?`,
          e: R`Every y-value of \(y = x^2\) is multiplied by \(${tx(a)}\). ${V(m) > 1 ? "Multiplying by more than 1 stretches the graph vertically (narrower)." : "Multiplying by a number between 0 and 1 compresses it vertically (wider)."}${V(a) < 0 ? " The negative sign reflects it in the x-axis (opens down)." : ""}`,
          hints: ["Look at a in y = ax²: its size and its sign.", "|a| > 1 stretches vertically; 0 < |a| < 1 compresses; a < 0 reflects in the x-axis."] }), template: "describe y = ax²", sig: `mc|${sx(a)}` };
      }
      const T = mode === "challenge" ? K.pick(r, ["findA", "build"]) : K.pick(r, ["build", "map"]);
      const p = QM().F(K.nz(r, -3, 3));
      if (T === "findA") {
        const q = mul(a, mul(p, p));
        return { kind: "wr", template: "find a from a point", sig: `fa|${sx(a)}|${sx(p)}`, title: "Find the vertical stretch",
          intro: R`The graph of \(y = ax^2\) passes through \(\left(${tx(p)},\ ${tx(q)}\right)\).`,
          parts: [
            { key: "a", label: "(a)", prompt: R`The value of \(a\):`, kind: "number", answer: V(a), ansTex: tx(a), ansText: sx(a), marks: 1 },
            { key: "b", label: "(b)", prompt: "Compared with y = x², the graph is vertically…", kind: "choice", choices: ["stretched", "compressed"], answer: V(abs(a)) > 1 ? "stretched" : "compressed", marks: 1 },
            { key: "c", label: "(c)", prompt: "Is it reflected in the x-axis?", kind: "choice", choices: ["Yes", "No"], answer: V(a) < 0 ? "Yes" : "No", marks: 1 },
          ],
          solution: [R`Substitute the point: \(${tx(q)} = a\left(${tx(p)}\right)^2 = ${tx(mul(p, p))}a\), so \(a = ${tx(a)}\).`, R`\(|a| ${V(abs(a)) > 1 ? ">" : "<"} 1\): a vertical ${V(abs(a)) > 1 ? "stretch" : "compression"} by a factor of \(${tx(abs(a))}\).${V(a) < 0 ? " a < 0, so it is reflected in the x-axis." : " a > 0, so there is no reflection."}`],
          rubric: ["a — 1", "stretch/compression — 1", "reflection — 1"], hints: ["Substitute the point into y = ax² and solve for a.", "Compare |a| with 1, and look at its sign."] };
      }
      if (T === "map") {
        return { kind: "wr", template: "map a point", sig: `mp|${sx(a)}|${sx(p)}`, title: "Map a point",
          intro: R`The graph of \(y = x^2\) is transformed by ${desc} to give \(${eqTeX(a, one(), QM().F(0), QM().F(0))}\).`,
          parts: [
            { key: "a", label: "(a)", prompt: R`The point \(\left(${tx(p)},\ ${tx(mul(p, p))}\right)\) on \(y = x^2\) moves to:`, kind: "point", answer: pt(p, mul(a, mul(p, p))), marks: 1 },
            { key: "b", label: "(b)", prompt: "Compared with y = x², the new graph is…", kind: "choice", choices: ["narrower", "wider"], answer: V(abs(a)) > 1 ? "narrower" : "wider", marks: 1 },
          ],
          solution: [R`A vertical transformation keeps x and multiplies y by \(a = ${tx(a)}\): \(\left(${tx(p)},\ ${tx(mul(p, p))}\right) \to \left(${tx(p)},\ ${tx(mul(a, mul(p, p)))}\right)\).`, R`\(|a| ${V(abs(a)) > 1 ? "> 1" : "< 1"}\), so the graph is ${V(abs(a)) > 1 ? "narrower" : "wider"}.`],
          rubric: ["image point — 1", "narrower/wider — 1"], hints: ["Vertical changes act on y only: (x, y) → (x, a·y).", "|a| > 1 makes the graph narrower."] };
      }
      return { kind: "wr", template: "build from a description", sig: `bd|${sx(a)}`, title: "Build the equation",
        intro: R`The graph of \(y = x^2\) is transformed by ${desc}.`,
        parts: [{ key: "a", label: "", prompt: "Equation of the transformed graph:", kind: "equation", form: "any", answer: vertexStr(a, QM().F(0), QM().F(0)), marks: 1 }],
        solution: [R`A vertical stretch/compression by \(${tx(abs(a))}\)${V(a) < 0 ? " and a reflection in the x-axis" : ""} multiply y by \(${tx(a)}\): \(${eqTeX(a, one(), QM().F(0), QM().F(0))}\).`],
        rubric: ["correct a — 1"], hints: ["A vertical factor s gives y = s·x².", "A reflection in the x-axis makes the coefficient negative."] };
    },
  });

  // ───────── F.t_horizontal ─────────
  B.family({
    id: "ft_horizontal", unit: "F", sub: "F.t_horizontal", title: "Horizontal stretches and compressions", concepts: ["quad.hscale", "quad.transform"],
    kinds: ["mc", "wr"], modes: ["simple", "normal", "challenge"], answer: "description / number / point", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["describe y = (bx)²", "(bx)² vs bx²", "rewrite and map a point", "build from a horizontal factor"],
    gen(r, mode, kind) {
      const b = fx(K.pick(r, B_VALS[mode]));
      const s = div(one(), b), b2 = mul(b, b), comp = V(b) > 1;
      const yb = R`y = \left(${bxTeX(b)}\right)^2`;
      if (kind === "mc") {
        const T = mode === "simple" ? "describe" : K.pick(r, ["describe", "compare"]);
        if (T === "compare" && !QM().feq(b2, b)) {
          const key = R`\(${yb}\) is the same as \(y = ${tx(b2)}x^2\), so it is ${V(b2) > V(b) ? "narrower" : "wider"} than \(y = ${tx(b)}x^2\)`;
          const wrong = [R`\(${yb}\) and \(y = ${tx(b)}x^2\) are the same graph`, R`\(${yb}\) is the same as \(y = ${tx(b)}x^2\), ${scaleWord("vertical", b)}`, R`\(${yb}\) is ${V(b2) > V(b) ? "wider" : "narrower"} than \(y = ${tx(b)}x^2\)`, R`\(${yb}\) is a horizontal stretch by a factor of \(${tx(b)}\)`];
          return { ...K.mc(key, wrong, { q: R`Which statement about \(${yb}\) and \(y = ${tx(b)}x^2\) is true?`,
            e: R`Square the bracket: \(\left(${bxTeX(b)}\right)^2 = ${tx(b2)}x^2\). Its coefficient \(${tx(b2)}\) is ${V(b2) > V(b) ? "larger" : "smaller"} than \(${tx(b)}\), so it is ${V(b2) > V(b) ? "narrower" : "wider"}. They are different transformations: the factor inside the bracket acts on x; the factor outside acts on y.`,
            hints: ["Expand the bracket: (bx)² = b²x².", "Compare b² with b."] }), template: "(bx)² vs bx²", sig: `cmp|${sx(b)}` };
        }
        const key = cap(hWord(b));
        // the classic error is to use b itself; vertical factors b and 1/b are wrong too (the true vertical equivalent is b²)
        const wrong = [cap(scaleWord("horizontal", b)), cap(scaleWord("vertical", b)), cap(scaleWord("vertical", s)), cap(scaleWord("horizontal", b2))];
        return { ...K.mc(key, wrong, { q: R`Which horizontal transformation of \(y = x^2\) gives \(${yb}\)?`,
          e: R`Replacing \(x\) with \(${tx(b)}x\) divides every x-value by \(${tx(b)}\): the graph reaches each height ${comp ? "sooner" : "later"}, so it is ${comp ? "compressed" : "stretched"} horizontally by a factor of \(${tx(s)}\) (the reciprocal of the number inside). Horizontal changes feel "backwards" because they undo what is done to x.`,
          hints: ["A factor inside the bracket acts on x, not y.", "The horizontal factor is the reciprocal of the number multiplying x."] }), template: "describe y = (bx)²", sig: `hd|${sx(b)}` };
      }
      const T = mode === "challenge" ? K.pick(r, ["map", "build"]) : "map";
      if (T === "build") {
        const sc = s;
        return { kind: "wr", template: "build from a horizontal factor", sig: `hb|${sx(b)}`, title: "Horizontal scaling",
          intro: R`The graph of \(y = x^2\) is ${V(sc) > 1 ? "stretched" : "compressed"} horizontally by a factor of \(${tx(sc)}\).`,
          parts: [
            { key: "a", label: "(a)", prompt: "Equation of the transformed graph:", kind: "equation", form: "any", answer: eqStr(one(), b, QM().F(0), QM().F(0)), marks: 1 },
            { key: "b", label: "(b)", prompt: R`The same graph written as \(y = ax^2\): \(a =\)`, kind: "number", answer: V(b2), ansTex: tx(b2), ansText: sx(b2), marks: 1 },
            { key: "c", label: "(c)", prompt: R`Is this the same graph as \(y = ${tx(b)}x^2\)?`, kind: "choice", choices: ["Yes", "No"], answer: QM().feq(b2, b) ? "Yes" : "No", marks: 1 },
          ],
          solution: [R`A horizontal factor of \(${tx(sc)}\) replaces \(x\) with \(\dfrac{x}{${tx(sc)}} = ${tx(b)}x\): \(${yb}\).`, R`\(\left(${bxTeX(b)}\right)^2 = ${tx(b2)}x^2\), so \(a = ${tx(b2)}\).`, R`\(${tx(b2)} \ne ${tx(b)}\): not the same graph as \(y = ${tx(b)}x^2\).`],
          rubric: ["equation — 1", "a = b² — 1", "comparison — 1"], hints: ["A horizontal factor s replaces x with x/s.", "Square the bracket to compare with y = ax²."] };
      }
      const p = mul(b, QM().F(K.nz(r, -3, 3)));              // an x-value that maps to a whole number
      const parts = [
        { key: "a", label: "(a)", prompt: R`Write \(${yb}\) as \(y = ax^2\): \(a =\)`, kind: "number", answer: V(b2), ansTex: tx(b2), ansText: sx(b2), marks: 1 },
        { key: "b", label: "(b)", prompt: R`The point \(\left(${tx(p)},\ ${tx(mul(p, p))}\right)\) on \(y = x^2\) moves to:`, kind: "point", answer: pt(div(p, b), mul(p, p)), marks: 1 },
      ];
      if (mode !== "simple") parts.push({ key: "c", label: "(c)", prompt: "Compared with y = x², the graph is…", kind: "choice", choices: ["narrower", "wider"], answer: comp ? "narrower" : "wider", marks: 1 });
      return { kind: "wr", template: "rewrite and map a point", sig: `hm|${sx(b)}|${sx(p)}`, title: "Horizontal scaling",
        intro: R`Consider \(${yb}\), a horizontal ${comp ? "compression" : "stretch"} of \(y = x^2\) by a factor of \(${tx(s)}\).`,
        parts,
        solution: [R`\(\left(${bxTeX(b)}\right)^2 = ${tx(b2)}x^2\), so \(a = ${tx(b2)}\).`, R`Horizontal changes keep y and multiply x by \(${tx(s)}\): \(\left(${tx(p)},\ ${tx(mul(p, p))}\right) \to \left(${tx(div(p, b))},\ ${tx(mul(p, p))}\right)\).`, ...(mode !== "simple" ? [R`It is ${comp ? "narrower (compressed toward the y-axis)" : "wider (stretched away from the y-axis)"}.`] : [])],
        rubric: ["a — 1", "image point — 1", ...(mode !== "simple" ? ["narrower/wider — 1"] : [])], hints: ["(bx)² = b²x².", "Horizontal changes act on x only: (x, y) → (x/b, y)."] };
    },
  });

  // ───────── F.t_translate ─────────
  B.family({
    id: "ft_translate", unit: "F", sub: "F.t_translate", subs: ["F.t_translate", "F.vertex"], title: "Translations: h and k", concepts: ["quad.vertex_form", "quad.axis", "quad.transform"],
    kinds: ["mc", "wr"], modes: ["simple", "normal", "challenge"], answer: "point / number / equation", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["read h and k", "equation from translations", "translate a given parabola"],
    gen(r, mode, kind) {
      const a = mode === "simple" ? fx(K.pick(r, ["1", "-1"])) : fx(K.pick(r, A_VALS[mode === "challenge" ? "normal" : "simple"]));
      const h = QM().F(K.nz(r, -6, 6)), k = QM().F(K.int(r, -7, 7));
      if (kind === "mc") {
        const words = listWords(shiftWords(h, k));
        const key = R`\(${eqTeX(a, one(), h, k)}\)`;
        const wrong = [R`\(${eqTeX(a, one(), neg(h), k)}\)`, R`\(${eqTeX(a, one(), h, neg(k))}\)`, R`\(${eqTeX(a, one(), neg(h), neg(k))}\)`, R`\(${eqTeX(a, one(), k, h)}\)`];
        return { ...K.mc(key, wrong, { q: R`The graph of \(${eqTeX(a, one(), QM().F(0), QM().F(0))}\) is given ${words || "no translation"}. Which is the new equation?`,
          e: R`Moving right by \(d\) replaces \(x\) with \(x - d\); moving up by \(d\) adds \(d\). Here \(h = ${tx(h)}\) and \(k = ${tx(k)}\): \(${eqTeX(a, one(), h, k)}\).`,
          hints: ["Right is (x − h) with h > 0; left gives (x + …).", "Up adds k; down subtracts."] }), template: "equation from translations", sig: `tm|${sx(a)}|${sx(h)}|${sx(k)}` };
      }
      if (mode === "challenge" && K.coin(r)) {
        const dh = QM().F(K.nz(r, -4, 4)), dk = QM().F(K.nz(r, -5, 5));
        const H = add(h, dh), Kk = add(k, dk);
        return { kind: "wr", template: "translate a given parabola", sig: `tt|${sx(a)}|${sx(h)}|${sx(k)}|${sx(dh)}|${sx(dk)}`, title: "Translate a parabola",
          intro: R`The graph of \(${eqTeX(a, one(), h, k)}\) is translated ${listWords(shiftWords(dh, dk))}.`,
          parts: [
            { key: "a", label: "(a)", prompt: "New vertex:", kind: "point", role: "vertex", answer: pt(H, Kk), marks: 1 },
            { key: "b", label: "(b)", prompt: "New equation:", kind: "equation", form: "any", answer: vertexStr(a, H, Kk), marks: 1 },
            { key: "c", label: "(c)", prompt: R`New axis of symmetry: \(x =\)`, kind: "number", answer: V(H), ansTex: tx(H), ansText: sx(H), marks: 1 },
          ],
          solution: [R`The vertex moves with the graph: \(\left(${tx(h)},\ ${tx(k)}\right) \to \left(${tx(H)},\ ${tx(Kk)}\right)\).`, R`Same shape \(a = ${tx(a)}\): \(${eqTeX(a, one(), H, Kk)}\); axis \(x = ${tx(H)}\).`],
          rubric: ["vertex — 1", "equation — 1", "axis — 1"], hints: ["Translate the vertex; the shape (a) doesn't change.", "The axis passes through the new vertex."] };
      }
      return { kind: "wr", template: "read h and k", sig: `rh|${sx(a)}|${sx(h)}|${sx(k)}`, title: "Read the translation",
        intro: R`Consider \(${eqTeX(a, one(), h, k)}\). Describe it as a transformation of ${isOne(abs(a)) && V(a) > 0 ? R`\(y = x^2\)` : R`\(${eqTeX(a, one(), QM().F(0), QM().F(0))}\)`}.`,
        parts: [
          { key: "a", label: "(a)", prompt: "Vertex:", kind: "point", role: "vertex", answer: pt(h, k), marks: 1 },
          { key: "b", label: "(b)", prompt: R`Axis of symmetry: \(x =\)`, kind: "number", answer: V(h), ansTex: tx(h), ansText: sx(h), marks: 1 },
          { key: "c", label: "(c)", prompt: "Compared with the parent graph, it moves horizontally…", kind: "choice", choices: ["left", "right"], answer: V(h) > 0 ? "right" : "left", marks: 1 },
          { key: "d", label: "(d)", prompt: "Vertical translation (units; up positive, down negative):", kind: "number", answer: V(k), ansTex: tx(k), ansText: sx(k), marks: 1 },
        ],
        solution: [R`Compare with \(y = a(x - h)^2 + k\): \(h = ${tx(h)}\), \(k = ${tx(k)}\). Vertex \(\left(${tx(h)},\ ${tx(k)}\right)\), axis \(x = ${tx(h)}\).`, R`${cap(listWords(shiftWords(h, k)) || "no translation")}.`],
        rubric: ["vertex — 1", "axis — 1", "horizontal — 1", "vertical — 1"], hints: [R`\((x + 3)\) is \((x - (-3))\), so \(h = -3\): 3 units left.`, "k is the vertical translation."] };
    },
  });

  // ───────── F.t_combined ─────────
  B.family({
    id: "ft_combined", unit: "F", sub: "F.t_combined", subs: ["F.t_combined", "F.transform"], title: "Combined transformations", concepts: ["quad.transform", "quad.hscale", "quad.vertex_form"],
    kinds: ["mc", "wr"], modes: ["normal", "challenge"], answer: "description / equation / point / graph", complexity: { normal: 2, challenge: 3 },
    templates: ["describe in order", "rewrite in vertex form", "build from transformations", "map a point", "compare two", "graph it"],
    gen(r, mode, kind) {
      const a = fx(K.pick(r, mode === "normal" ? ["2", "-1", "-2", "3", "1/2", "-1/2"] : ["-3", "1/2", "-1/2", "2", "-2", "3/2"]));
      const b = fx(K.pick(r, mode === "normal" ? ["2", "1/2", "3"] : ["2", "3", "1/2", "1/3", "3/2"]));
      const h = QM().F(K.nz(r, -5, 5)), k = QM().F(K.int(r, -6, 6));
      const A = mul(a, mul(b, b));
      const E = eqTeX(a, b, h, k);
      const seq = (aa, bb, hh, kk) => cap(listWords([hWord(bb), vWord(aa), refl(aa)].filter(Boolean))) + (shiftWords(hh, kk).length ? ", then " + listWords(shiftWords(hh, kk)) : "");
      if (kind === "mc") {
        const key = seq(a, b, h, k);
        const wrong = [seq(a, b, neg(h), k), seq(a, div(one(), b), h, k), seq(a, b, k, h), seq(neg(a), b, h, k), seq(a, b, h, neg(k))];
        return { ...K.mc(key, wrong, {
          q: R`Which sequence of transformations maps \(y = x^2\) onto \(${E}\)? (Convention: stretches, compressions and reflections first, then translations.)`,
          e: R`Inside the bracket: the factor \(${tx(b)}\) on \(x - h\) is ${hWord(b)}; \(h = ${tx(h)}\) is ${shiftWords(h, QM().F(0))[0] || "no horizontal translation"}. Outside: \(a = ${tx(a)}\) is ${listWords([vWord(a), refl(a)].filter(Boolean))}; \(k = ${tx(k)}\) is ${shiftWords(QM().F(0), k)[0] || "no vertical translation"}.`,
          hints: ["Factors inside the bracket act on x (and are reciprocated); outside act on y.", "(x − h): right for h > 0. Then k: up for k > 0."] }), template: "describe in order", sig: `cd|${sx(a)}|${sx(b)}|${sx(h)}|${sx(k)}` };
      }
      const T = mode === "normal" ? K.pick(r, ["vertex", "build", "map"]) : K.pick(r, ["vertex", "build", "compare", "graph", "map"]);
      if (T === "vertex") {
        return { kind: "wr", template: "rewrite in vertex form", sig: `cv|${sx(a)}|${sx(b)}|${sx(h)}|${sx(k)}`, title: "Combined transformations",
          intro: R`Consider \(${E}\).`,
          parts: [
            { key: "a", label: "(a)", prompt: "Vertex:", kind: "point", role: "vertex", answer: pt(h, k), marks: 1 },
            { key: "b", label: "(b)", prompt: R`Axis of symmetry: \(x =\)`, kind: "number", answer: V(h), ansTex: tx(h), ansText: sx(h), marks: 1 },
            { key: "c", label: "(c)", prompt: R`Rewrite in vertex form \(y = a(x - h)^2 + k\):`, kind: "equation", form: "vertex", answer: vertexStr(A, h, k), marks: 2 },
          ],
          solution: [R`The horizontal factor doesn't move the vertex: it stays at \(\left(${tx(h)},\ ${tx(k)}\right)\), axis \(x = ${tx(h)}\).`, R`\(\left(${tx(b)}(x - h)\right)^2 = ${tx(mul(b, b))}(x - h)^2\), so \(a = ${tx(a)} \cdot ${tx(mul(b, b))} = ${tx(A)}\): \(${eqTeX(A, one(), h, k)}\).`],
          rubric: ["vertex — 1", "axis — 1", "a = a·b² — 1", "vertex form — 1"], hints: ["Square the factor inside the bracket and multiply it into a.", "Scalings about the axis don't move the vertex."] };
      }
      if (T === "build") {
        const words = seq(a, b, h, k);
        return { kind: "wr", template: "build from transformations", sig: `cb|${sx(a)}|${sx(b)}|${sx(h)}|${sx(k)}`, title: "Build the equation",
          intro: R`The graph of \(y = x^2\) is transformed by: ${words.charAt(0).toLowerCase() + words.slice(1)}.`,
          parts: [
            { key: "a", label: "(a)", prompt: "Equation of the transformed graph (any equivalent form):", kind: "equation", form: "any", answer: eqStr(a, b, h, k), marks: 2 },
            { key: "b", label: "(b)", prompt: "Vertex:", kind: "point", role: "vertex", answer: pt(h, k), marks: 1 },
          ],
          solution: [R`Horizontal factor \(${tx(div(one(), b))}\) → \(${tx(b)}x\) inside; then \(a = ${tx(a)}\); then the translations: \(${E}\).`, R`Equivalent vertex form: \(${eqTeX(A, one(), h, k)}\). Vertex \(\left(${tx(h)},\ ${tx(k)}\right)\).`],
          rubric: ["horizontal factor and a — 1", "translations — 1", "vertex — 1"], hints: ["A horizontal factor s puts 1/s next to x inside the bracket.", "Write y = a(b(x − h))² + k, then check the vertex."] };
      }
      if (T === "map") {
        const px = QM().F(K.pick(r, [-2, -1, 1, 2, 3])), py = mul(px, px);
        const X = add(div(px, b), h), Y = add(mul(a, py), k);
        return { kind: "wr", template: "map a point", sig: `cm|${sx(a)}|${sx(b)}|${sx(h)}|${sx(k)}|${sx(px)}`, title: "Follow a point",
          intro: R`The graph of \(y = x^2\) is transformed to \(${E}\).`,
          parts: [{ key: "a", label: "", prompt: R`Where does the point \(\left(${tx(px)},\ ${tx(py)}\right)\) on \(y = x^2\) end up?`, kind: "point", answer: pt(X, Y), marks: 2 }],
          solution: [R`x: divide by \(${tx(b)}\), then add \(h = ${tx(h)}\): \(${tx(px)} \div ${tx(b)} + ${tx(h)} = ${tx(X)}\).`, R`y: multiply by \(a = ${tx(a)}\), then add \(k = ${tx(k)}\): \(${tx(a)} \cdot ${tx(py)} + ${tx(k)} = ${tx(Y)}\).`],
          rubric: ["x-coordinate — 1", "y-coordinate — 1"], hints: ["(x, y) → (x/b + h, a·y + k).", "Scale first, then translate."] };
      }
      if (T === "compare") {
        // f(x) = b²·(x − h)² + k and g(x) = (b(x − h))² + k are identical; f is compared with c·(x − h)² + k
        const c = K.pick(r, ["2", "3", "4", "1/2"]).toString(), cf = fx(c);
        const b2 = mul(b, b), same = QM().feq(b2, cf);
        if (same) throw new Error("pick a different comparison");
        return { kind: "wr", template: "compare two", sig: `cc|${sx(b)}|${c}|${sx(h)}|${sx(k)}`, title: "Compare two parabolas",
          intro: R`Compare \(f(x) = \left(${inner(b, h)}\right)^2${V(k) === 0 ? "" : V(k) > 0 ? ` + ${tx(k)}` : ` - ${tx(abs(k))}`}\) and \(g(x) = ${tx(cf)}${QM().shiftTeX(h) === "x" ? "x^2" : `${QM().shiftTeX(h)}^2`}${V(k) === 0 ? "" : V(k) > 0 ? ` + ${tx(k)}` : ` - ${tx(abs(k))}`}\).`,
          parts: [
            { key: "a", label: "(a)", prompt: "Do they have the same vertex?", kind: "choice", choices: ["Yes", "No"], answer: "Yes", marks: 1 },
            { key: "b", label: "(b)", prompt: R`Written in vertex form, \(f\) has \(a =\)`, kind: "number", answer: V(b2), ansTex: tx(b2), ansText: sx(b2), marks: 1 },
            { key: "c", label: "(c)", prompt: "Which graph is narrower?", kind: "choice", choices: ["f", "g"], answer: V(b2) > V(cf) ? "f" : "g", marks: 1 },
          ],
          solution: [R`Both have vertex \(\left(${tx(h)},\ ${tx(k)}\right)\).`, R`\(\left(${tx(b)}(x - h)\right)^2 = ${tx(b2)}(x - h)^2\), so \(f\) has \(a = ${tx(b2)}\), compared with \(${tx(cf)}\) for \(g\).`, R`The larger \(|a|\) is narrower: ${V(b2) > V(cf) ? "f" : "g"}.`],
          rubric: ["vertex — 1", "a of f — 1", "narrower — 1"], hints: ["Expand the factor inside the bracket: (b(x − h))² = b²(x − h)².", "Larger |a| means narrower."] };
      }
      // graph it on the empty grid (vertex and two more points, one on each side): factors chosen so a·b² is a whole
      // number the grid can show, and the vertex stays well inside the window
      const [ga, gb] = K.pick(r, [["1/2", "2"], ["-1/2", "2"], ["1/4", "2"], ["-1/4", "2"], ["9", "1/3"], ["-9", "1/3"], ["4", "1/2"], ["-4", "1/2"], ["8", "1/2"]]).map(fx);
      const GA = mul(ga, mul(gb, gb)), GE = eqTeX(ga, gb, h, k);
      if (Math.abs(V(k)) > 5 || Math.abs(V(h)) > 5) throw new Error("keep the graph on the grid");
      return { kind: "wr", template: "graph it", sig: `cg|${sx(ga)}|${sx(gb)}|${sx(h)}|${sx(k)}`, title: "Graph the transformation",
        intro: R`Graph \(${GE}\) on the empty grid: place the vertex, then plot at least two more points (one each side of the axis of symmetry).`,
        parts: [{ key: "a", label: "", prompt: "Your graph:", kind: "graph", answer: { a: sx(GA), h: sx(h), k: sx(k) }, marks: 3, minPoints: 2, bothSides: true, snap: 1, window: { x0: -9, x1: 9, y0: -9, y1: 9 } }],
        solution: [R`The horizontal factor and \(a\) combine: \(${tx(ga)} \cdot ${tx(mul(gb, gb))} = ${tx(GA)}\), so the graph is \(${eqTeX(GA, one(), h, k)}\).`, R`Vertex \(\left(${tx(h)},\ ${tx(k)}\right)\); one unit either side of the axis, y changes by \(${tx(GA)}\).`],
        rubric: ["vertex — 1", "points on the curve — 1", "shape and direction — 1"], hints: ["Rewrite in vertex form first: a·b² is the vertical factor.", "From the vertex, step 1 right and 1 left."] };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
