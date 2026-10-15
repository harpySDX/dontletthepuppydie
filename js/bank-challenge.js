/*
 * CHALLENGE banks — deliberately harder than the unit test.
 * Same 34-mark layout (WR Q1–Q5, 5 NR, 10 MC), same format as the normal banks:
 * MC c[0] is correct; WR parts are graded by js/mathcheck.js.
 */
(function () {
  const R = String.raw;
  const M = (s, ...v) => "\\(" + String.raw(s, ...v) + "\\)";
  const T = window.TOPICS;
  const { Q1, Q2, Q3, Q4, ex } = window.WR_BUILD;

  // ───────── Written response ─────────
  const tag = (q) => ({ ...q, challenge: true });
  const wr = [
    // Q1 — mixed & entire, with 4th roots, decimals, fractions and negatives
    Q1("ch-wr1-1",
      { tex: R`-3\sqrt[4]{2}`, type: "Mixed", ans: "-∜162", ansTex: R`-\sqrt[4]{162}`, why: R`<b>Mixed.</b> Raise the 3 to the 4th power: \(3^4 \cdot 2 = 162\). The negative must stay <i>outside</i>: \(\sqrt[4]{-162}\) isn't a real number because the index is even. So \(-3\sqrt[4]{2} = -\sqrt[4]{162}\).` },
      { tex: R`\sqrt[4]{1250}`, type: "Entire", ans: "5∜2", ansTex: R`5\sqrt[4]{2}`, why: R`<b>Entire.</b> Largest perfect 4th power factor: \(1250 = 625 \cdot 2 = 5^4 \cdot 2\). So \(\sqrt[4]{1250} = 5\sqrt[4]{2}\).` }),
    Q1("ch-wr1-2",
      { tex: R`2\sqrt[3]{-7}`, type: "Mixed", ans: "∛(-56)", ansTex: R`\sqrt[3]{-56}`, why: R`<b>Mixed.</b> \(2^3 = 8\), so \(2\sqrt[3]{-7} = \sqrt[3]{8 \cdot (-7)} = \sqrt[3]{-56}\).` },
      { tex: R`\sqrt{\dfrac{4}{45}}`, type: "Entire", ans: "2√5/15", ansTex: R`\dfrac{2\sqrt{5}}{15}`, why: R`<b>Entire.</b> \(\sqrt{\tfrac{4}{45}} = \dfrac{2}{\sqrt{45}} = \dfrac{2}{3\sqrt{5}}\). Rationalize: \(\dfrac{2\sqrt{5}}{15}\). Simplest form never leaves a radical in the denominator.` }),
    Q1("ch-wr1-3",
      { tex: R`\tfrac{2}{3}\sqrt{27}`, type: "Mixed", ans: "√12", ansTex: R`\sqrt{12}`, why: R`<b>Mixed</b> (a fraction is still a coefficient). \(\left(\tfrac{2}{3}\right)^2 \cdot 27 = \tfrac{4}{9}\cdot 27 = 12\), so it equals \(\sqrt{12}\).` },
      { tex: R`\sqrt[3]{-0.016}`, type: "Entire", ans: "-∛2/5", ansTex: R`-\dfrac{\sqrt[3]{2}}{5}`, why: R`<b>Entire.</b> \(-0.016 = -\tfrac{16}{1000}\). \(\sqrt[3]{-\tfrac{16}{1000}} = -\dfrac{\sqrt[3]{8 \cdot 2}}{10} = -\dfrac{2\sqrt[3]{2}}{10} = -\dfrac{\sqrt[3]{2}}{5}\).` }),
    Q1("ch-wr1-4",
      { tex: R`5\sqrt[4]{3}`, type: "Mixed", ans: "∜1875", ansTex: R`\sqrt[4]{1875}`, why: R`<b>Mixed.</b> \(5^4 = 625\), so \(5\sqrt[4]{3} = \sqrt[4]{625 \cdot 3} = \sqrt[4]{1875}\).` },
      { tex: R`\sqrt{0.0008}`, type: "Entire", ans: "√2/50", ansTex: R`\dfrac{\sqrt{2}}{50}`, why: R`<b>Entire.</b> \(0.0008 = \tfrac{8}{10000}\), so \(\sqrt{0.0008} = \dfrac{\sqrt{8}}{100} = \dfrac{2\sqrt{2}}{100} = \dfrac{\sqrt{2}}{50}\).` }),

    // Q2 — rationalizing: cube/4th roots, three-term denominators, sum/difference of cubes
    Q2("ch-wr2-1", [
      { tex: R`\dfrac{6}{\sqrt[3]{9}}`, ans: "2∛3", ansTex: R`2\sqrt[3]{3}`, why: R`You need a perfect cube: \(\sqrt[3]{9}\cdot\sqrt[3]{3} = \sqrt[3]{27} = 3\). So \(\dfrac{6\sqrt[3]{3}}{3} = 2\sqrt[3]{3}\).` },
      { tex: R`\dfrac{1}{\sqrt{2} + \sqrt{3} + \sqrt{5}}`, ans: "(2√3+3√2-√30)/12", ansTex: R`\dfrac{2\sqrt{3} + 3\sqrt{2} - \sqrt{30}}{12}`, why: R`Group as \((\sqrt{2} + \sqrt{3}) + \sqrt{5}\) and multiply by \((\sqrt{2} + \sqrt{3}) - \sqrt{5}\): denominator \((\sqrt{2} + \sqrt{3})^2 - 5 = 2\sqrt{6}\). Then multiply by \(\tfrac{\sqrt{6}}{\sqrt{6}}\): \(\dfrac{(\sqrt{2} + \sqrt{3} - \sqrt{5})\sqrt{6}}{12} = \dfrac{2\sqrt{3} + 3\sqrt{2} - \sqrt{30}}{12}\).` },
      { tex: R`\dfrac{1}{\sqrt[3]{2} - 1}`, ans: "∛4+∛2+1", ansTex: R`\sqrt[3]{4} + \sqrt[3]{2} + 1`, why: R`Use \(a^3 - b^3 = (a - b)(a^2 + ab + b^2)\) with \(a = \sqrt[3]{2}, b = 1\). Multiply by \(\sqrt[3]{4} + \sqrt[3]{2} + 1\): the denominator becomes \(2 - 1 = 1\).` },
    ]),
    Q2("ch-wr2-2", [
      { tex: R`\dfrac{15}{\sqrt[4]{27}}`, ans: "5∜3", ansTex: R`5\sqrt[4]{3}`, why: R`\(\sqrt[4]{27}\cdot\sqrt[4]{3} = \sqrt[4]{81} = 3\). So \(\dfrac{15\sqrt[4]{3}}{3} = 5\sqrt[4]{3}\).` },
      { tex: R`\dfrac{\sqrt{6} - \sqrt{2}}{\sqrt{6} + \sqrt{2}}`, ans: "2-√3", ansTex: R`2 - \sqrt{3}`, why: R`\(\dfrac{(\sqrt{6} - \sqrt{2})^2}{6 - 2} = \dfrac{8 - 2\sqrt{12}}{4} = \dfrac{8 - 4\sqrt{3}}{4} = 2 - \sqrt{3}\).` },
      { tex: R`\dfrac{4}{\sqrt[3]{3} + 1}`, ans: "∛9-∛3+1", ansTex: R`\sqrt[3]{9} - \sqrt[3]{3} + 1`, why: R`Use \(a^3 + b^3 = (a + b)(a^2 - ab + b^2)\). Multiply by \(\sqrt[3]{9} - \sqrt[3]{3} + 1\): the denominator becomes \(3 + 1 = 4\), which cancels the 4.` },
    ]),
    Q2("ch-wr2-3", [
      { tex: R`\dfrac{3}{2\sqrt[4]{8}}`, ans: "3∜2/4", ansTex: R`\dfrac{3\sqrt[4]{2}}{4}`, why: R`\(\sqrt[4]{8}\cdot\sqrt[4]{2} = \sqrt[4]{16} = 2\). So \(\dfrac{3\sqrt[4]{2}}{2 \cdot 2} = \dfrac{3\sqrt[4]{2}}{4}\).` },
      { tex: R`\dfrac{3\sqrt{2} - 2\sqrt{3}}{3\sqrt{2} + 2\sqrt{3}}`, ans: "5-2√6", ansTex: R`5 - 2\sqrt{6}`, why: R`\(\dfrac{(3\sqrt{2} - 2\sqrt{3})^2}{18 - 12} = \dfrac{18 - 12\sqrt{6} + 12}{6} = \dfrac{30 - 12\sqrt{6}}{6} = 5 - 2\sqrt{6}\).` },
      { tex: R`\dfrac{1}{1 + \sqrt{2} + \sqrt{3}}`, ans: "(2+√2-√6)/4", ansTex: R`\dfrac{2 + \sqrt{2} - \sqrt{6}}{4}`, why: R`Multiply by \((1 + \sqrt{2}) - \sqrt{3}\): denominator \((1 + \sqrt{2})^2 - 3 = 2\sqrt{2}\). Then by \(\tfrac{\sqrt{2}}{\sqrt{2}}\): \(\dfrac{(1 + \sqrt{2} - \sqrt{3})\sqrt{2}}{4} = \dfrac{\sqrt{2} + 2 - \sqrt{6}}{4}\).` },
    ]),
    Q2("ch-wr2-4", [
      { tex: R`\sqrt{\dfrac{3}{8}}`, ans: "√6/4", ansTex: R`\dfrac{\sqrt{6}}{4}`, why: R`\(\dfrac{\sqrt{3}}{\sqrt{8}} = \dfrac{\sqrt{3}}{2\sqrt{2}}\cdot\dfrac{\sqrt{2}}{\sqrt{2}} = \dfrac{\sqrt{6}}{4}\).` },
      { tex: R`\dfrac{\sqrt{5} + \sqrt{3}}{\sqrt{5} - \sqrt{3}} - \dfrac{\sqrt{5} - \sqrt{3}}{\sqrt{5} + \sqrt{3}}`, ans: "2√15", ansTex: R`2\sqrt{15}`, why: R`First fraction: \(\dfrac{(\sqrt{5} + \sqrt{3})^2}{2} = 4 + \sqrt{15}\). Second: \(\dfrac{(\sqrt{5} - \sqrt{3})^2}{2} = 4 - \sqrt{15}\). Difference: \(2\sqrt{15}\).` },
      { tex: R`\dfrac{2}{\sqrt[3]{4} + \sqrt[3]{2} + 1}`, ans: "2∛2-2", ansTex: R`2\sqrt[3]{2} - 2`, why: R`This is the second factor of \(a^3 - b^3\) with \(a = \sqrt[3]{2}, b = 1\). Multiply by \(\sqrt[3]{2} - 1\): the denominator becomes \(2 - 1 = 1\), leaving \(2(\sqrt[3]{2} - 1)\).` },
    ]),

    // Q3 — equations that need two squarings, or have two answers
    Q3("ch-wr3-1", R`\sqrt{x + 4} + \sqrt{x - 4} = 4`, ["5"], [R`Isolate one root: \(\sqrt{x + 4} = 4 - \sqrt{x - 4}\).`, R`Square: \(x + 4 = 16 - 8\sqrt{x - 4} + x - 4 \Rightarrow 8\sqrt{x - 4} = 8 \Rightarrow \sqrt{x - 4} = 1\).`, R`So \(x - 4 = 1\), \(x = 5\). Check: \(\sqrt{9} + \sqrt{1} = 4\) ✓.`]),
    Q3("ch-wr3-2", R`\sqrt[3]{x^2 - 8} = 2`, ["4", "-4"], [R`Cube both sides: \(x^2 - 8 = 8 \Rightarrow x^2 = 16 \Rightarrow x = \pm 4\).`, R`Cube roots never create extraneous roots, but check anyway: \(\sqrt[3]{16 - 8} = 2\) for both ✓.`, R`<b>\(x = 4\) or \(x = -4\)</b> — giving only one loses a mark.`]),
    Q3("ch-wr3-3", R`\sqrt{3x + 1} - \sqrt{x - 1} = 2`, ["1", "5"], [R`Isolate: \(\sqrt{3x + 1} = 2 + \sqrt{x - 1}\). Square: \(3x + 1 = 4 + 4\sqrt{x - 1} + x - 1\), so \(2x - 2 = 4\sqrt{x - 1}\), i.e. \(x - 1 = 2\sqrt{x - 1}\).`, R`Let \(u = \sqrt{x - 1}\): \(u^2 = 2u \Rightarrow u = 0\) or \(u = 2\), so \(x = 1\) or \(x = 5\). (Don't divide by \(u\) — you'd lose \(x = 1\)!)`, R`Check: \(x = 1\): \(2 - 0 = 2\) ✓. \(x = 5\): \(4 - 2 = 2\) ✓.`]),
    Q3("ch-wr3-4", R`x^{\frac{2}{3}} = 9`, ["27", "-27"], [R`\(x^{2/3} = \left(\sqrt[3]{x}\right)^2 = 9\), so \(\sqrt[3]{x} = \pm 3\).`, R`Cube: \(x = 27\) or \(x = -27\).`, R`Check: \((\sqrt[3]{-27})^2 = (-3)^2 = 9\) ✓. Raising both sides to the \(\tfrac{3}{2}\) power only finds 27 — a classic trap.`]),
    Q3("ch-wr3-5", R`\sqrt{5x + 6} = x + 2`, ["-1", "2"], [R`Square: \(5x + 6 = x^2 + 4x + 4 \Rightarrow x^2 - x - 2 = 0 \Rightarrow (x - 2)(x + 1) = 0\).`, R`Check \(x = 2\): \(\sqrt{16} = 4 = 2 + 2\) ✓. Check \(x = -1\): \(\sqrt{1} = 1 = -1 + 2\) ✓.`, R`<b>Both work.</b> A negative \(x\) isn't automatically extraneous — only the check decides.`]),

    // Q4 — candidates / solutions / extraneous, with double squaring
    Q4("ch-wr4-1", R`\sqrt{2x + 5} - \sqrt{x - 6} = 3`, ["10", "22"], ["10", "22"], [], [
      R`Isolate: \(\sqrt{2x + 5} = 3 + \sqrt{x - 6}\). Square: \(2x + 5 = 9 + 6\sqrt{x - 6} + x - 6\), so \(x + 2 = 6\sqrt{x - 6}\).`,
      R`Square again: \(x^2 + 4x + 4 = 36x - 216 \Rightarrow x^2 - 32x + 220 = 0 \Rightarrow (x - 10)(x - 22) = 0\).`,
      R`Check \(x = 10\): \(\sqrt{25} - \sqrt{4} = 3\) ✓. Check \(x = 22\): \(\sqrt{49} - \sqrt{16} = 3\) ✓.`,
      R`<b>Both are solutions; nothing is extraneous.</b>`]),
    Q4("ch-wr4-2", R`\sqrt{x + 2} + \sqrt{3x + 4} = 2`, ["-1", "7"], ["-1"], ["7"], [
      R`Isolate: \(\sqrt{3x + 4} = 2 - \sqrt{x + 2}\). Square: \(3x + 4 = 4 - 4\sqrt{x + 2} + x + 2\), so \(x - 1 = -2\sqrt{x + 2}\).`,
      R`Square again: \(x^2 - 2x + 1 = 4x + 8 \Rightarrow x^2 - 6x - 7 = 0 \Rightarrow (x - 7)(x + 1) = 0\).`,
      R`Check \(x = -1\): \(\sqrt{1} + \sqrt{1} = 2\) ✓. Check \(x = 7\): \(\sqrt{9} + \sqrt{25} = 8 \ne 2\) ✗ → extraneous.`,
      R`<b>Solution: \(x = -1\).</b>`]),
    Q4("ch-wr4-3", R`x - \sqrt{2x - 3} = 3`, ["2", "6"], ["6"], ["2"], [
      R`Isolate: \(x - 3 = \sqrt{2x - 3}\). Square: \(x^2 - 6x + 9 = 2x - 3 \Rightarrow x^2 - 8x + 12 = 0 \Rightarrow (x - 2)(x - 6) = 0\).`,
      R`Check \(x = 6\): \(6 - \sqrt{9} = 3\) ✓. Check \(x = 2\): \(2 - \sqrt{1} = 1 \ne 3\) ✗ → extraneous.`,
      R`<b>Solution: \(x = 6\).</b>`]),
    Q4("ch-wr4-4", R`\sqrt{3 - x} + \sqrt{x + 5} = 4`, ["-1"], ["-1"], [], [
      R`Isolate: \(\sqrt{x + 5} = 4 - \sqrt{3 - x}\). Square: \(x + 5 = 16 - 8\sqrt{3 - x} + 3 - x\), so \(x - 7 = -4\sqrt{3 - x}\).`,
      R`Square again: \(x^2 - 14x + 49 = 48 - 16x \Rightarrow x^2 + 2x + 1 = 0 \Rightarrow (x + 1)^2 = 0\), so the only candidate is \(x = -1\).`,
      R`Check: \(\sqrt{4} + \sqrt{4} = 4\) ✓. <b>Solution: \(x = -1\); nothing is extraneous.</b>`]),

    // Q5 — multi-step word problems
    {
      id: "ch-wr5-1", slot: 5, topic: T.app, title: "Word problem",
      intro: R`A rectangular box measures \(\sqrt{8}\) cm by \(\sqrt{18}\) cm by \(\sqrt{50}\) cm. Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "Find the volume of the box. (cm³)", "60√2", R`60\sqrt{2}\text{ cm}^3`, 2),
        ex("b", "(b)", "Find the length of the space diagonal (corner to opposite corner through the box). (cm)", "2√19", R`2\sqrt{19}\text{ cm}`, 2),
        ex("c", "(c)", "Find the total surface area. (cm²)", "124", R`124\text{ cm}^2`, 1),
      ],
      rubric: ["(a) Multiplied the three edges — 1 mark; simplified to 60√2 — 1 mark", "(b) d² = a² + b² + c² — 1 mark; simplified √76 = 2√19 — 1 mark", "(c) 2(12 + 20 + 30) = 124 — 1 mark"],
      solution: [
        R`Simplify first: \(2\sqrt{2},\ 3\sqrt{2},\ 5\sqrt{2}\).`,
        R`<b>(a)</b> \(V = (2\sqrt{2})(3\sqrt{2})(5\sqrt{2}) = 30 \cdot 2\sqrt{2} = 60\sqrt{2}\) cm³.`,
        R`<b>(b)</b> \(d = \sqrt{8 + 18 + 50} = \sqrt{76} = 2\sqrt{19}\) cm.`,
        R`<b>(c)</b> Faces: \(\sqrt{8 \cdot 18} = 12\), \(\sqrt{8 \cdot 50} = 20\), \(\sqrt{18 \cdot 50} = 30\). \(SA = 2(12 + 20 + 30) = 124\) cm².`,
      ],
    },
    {
      id: "ch-wr5-2", slot: 5, topic: T.app, title: "Word problem",
      intro: R`The area of an equilateral triangle with side \(s\) is \(A = \dfrac{\sqrt{3}}{4}s^2\). A triangular sign has an area of \(12\sqrt{3}\) cm². Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "Find the side length. (cm)", "4√3", R`4\sqrt{3}\text{ cm}`, 2),
        ex("b", "(b)", "Find the perimeter. (cm)", "12√3", R`12\sqrt{3}\text{ cm}`, 1),
        ex("c", "(c)", "Find the height of the triangle. (cm)", "6", R`6\text{ cm}`, 2),
      ],
      rubric: ["(a) Solved s² = 48 — 1 mark; s = 4√3 — 1 mark", "(b) 3s = 12√3 — 1 mark", "(c) Used Pythagoras or h = (√3/2)s — 1 mark; h = 6 — 1 mark"],
      solution: [
        R`<b>(a)</b> \(\tfrac{\sqrt{3}}{4}s^2 = 12\sqrt{3} \Rightarrow s^2 = 48 \Rightarrow s = \sqrt{48} = 4\sqrt{3}\) cm.`,
        R`<b>(b)</b> \(P = 3 \cdot 4\sqrt{3} = 12\sqrt{3}\) cm.`,
        R`<b>(c)</b> \(h^2 + (2\sqrt{3})^2 = (4\sqrt{3})^2 \Rightarrow h^2 = 48 - 12 = 36 \Rightarrow h = 6\) cm.`,
      ],
    },
    {
      id: "ch-wr5-3", slot: 5, topic: T.app, title: "Word problem",
      intro: R`The speed of a tsunami is \(v = \sqrt{9.8d}\) m/s, where \(d\) is the ocean depth in metres.`,
      parts: [
        ex("a", "(a)", R`Find the <b>exact</b> speed over water 4000 m deep, in simplest radical form. (m/s)`, "140√2", R`140\sqrt{2}\text{ m/s}`, 2),
        { key: "b", label: "(b)", prompt: "How deep is the water where a tsunami travels at 210 m/s? (m)", kind: "number", answer: 4500, marks: 2 },
        { key: "c", label: "(c)", prompt: "If the depth is multiplied by 9, the speed is multiplied by what number?", kind: "number", answer: 3, marks: 1 },
      ],
      rubric: ["(a) √39 200 — 1 mark; 140√2 — 1 mark", "(b) Squared: 9.8d = 44 100 — 1 mark; d = 4500 m — 1 mark", "(c) √9 = 3 — 1 mark"],
      solution: [
        R`<b>(a)</b> \(v = \sqrt{9.8 \cdot 4000} = \sqrt{39\,200} = \sqrt{19\,600 \cdot 2} = 140\sqrt{2}\) m/s.`,
        R`<b>(b)</b> \(210 = \sqrt{9.8d} \Rightarrow 44\,100 = 9.8d \Rightarrow d = 4500\) m.`,
        R`<b>(c)</b> \(\sqrt{9.8 \cdot 9d} = \sqrt{9}\cdot\sqrt{9.8d} = 3v\). The speed triples.`,
      ],
    },
    {
      id: "ch-wr5-4", slot: 5, topic: T.app, title: "Word problem",
      intro: R`Two square tiles with areas of 50 cm² and 18 cm² sit side by side on a line, bottoms lined up. Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "Find the total width of the two tiles. (cm)", "8√2", R`8\sqrt{2}\text{ cm}`, 2),
        { key: "b", label: "(b)", prompt: "What is the ratio of the large tile's perimeter to the small tile's perimeter? (as a single number or fraction)", kind: "expr", answer: "5/3", ansTex: R`\tfrac{5}{3}`, form: "simplest", marks: 1 },
        ex("c", "(c)", "Find the distance from the bottom-left corner of the large tile to the top-right corner of the small tile. (cm)", "√146", R`\sqrt{146}\text{ cm}`, 2),
      ],
      rubric: ["(a) Sides 5√2 and 3√2 — 1 mark; total 8√2 — 1 mark", "(b) 20√2 : 12√2 = 5/3 — 1 mark", "(c) Horizontal 8√2, vertical 3√2 — 1 mark; √(128 + 18) = √146 — 1 mark"],
      solution: [
        R`Sides: \(\sqrt{50} = 5\sqrt{2}\) and \(\sqrt{18} = 3\sqrt{2}\).`,
        R`<b>(a)</b> \(5\sqrt{2} + 3\sqrt{2} = 8\sqrt{2}\) cm.`,
        R`<b>(b)</b> \(\dfrac{4 \cdot 5\sqrt{2}}{4 \cdot 3\sqrt{2}} = \dfrac{5}{3}\).`,
        R`<b>(c)</b> Across \(8\sqrt{2}\), up \(3\sqrt{2}\): \(\sqrt{(8\sqrt{2})^2 + (3\sqrt{2})^2} = \sqrt{128 + 18} = \sqrt{146}\) cm (146 has no square factor).`,
      ],
    },
  ].map(tag);

  // ───────── Numerical response ─────────
  const nr = [
    { id: "ch-nr1", topic: T.simp, q: R`\(\sqrt{7 + 4\sqrt{3}} = a + \sqrt{b}\) where \(a\) and \(b\) are integers. What is \(a + b\)?`, answer: 5, fmt: "Whole number", e: R`Try \((a + \sqrt{b})^2 = a^2 + b + 2a\sqrt{b}\). Matching: \(a^2 + b = 7\), \(2a\sqrt{b} = 4\sqrt{3}\) → \(a = 2, b = 3\). Check: \((2 + \sqrt{3})^2 = 7 + 4\sqrt{3}\) ✓. So \(a + b = 5\).` },
    { id: "ch-nr2", topic: T.div, q: R`Evaluate \(\dfrac{1}{\sqrt{1} + \sqrt{2}} + \dfrac{1}{\sqrt{2} + \sqrt{3}} + \cdots + \dfrac{1}{\sqrt{99} + \sqrt{100}}\).`, answer: 9, fmt: "Whole number", e: R`Rationalize each term: \(\dfrac{1}{\sqrt{n} + \sqrt{n+1}} = \sqrt{n+1} - \sqrt{n}\). The sum telescopes: \(\sqrt{100} - \sqrt{1} = 10 - 1 = 9\).` },
    { id: "ch-nr3", topic: T.conj, q: R`If \(x = 2 + \sqrt{3}\), find the value of \(x^2 + \dfrac{1}{x^2}\).`, answer: 14, fmt: "Whole number", e: R`\(\dfrac{1}{x} = 2 - \sqrt{3}\) (conjugate), so \(x + \tfrac{1}{x} = 4\). Then \(x^2 + \tfrac{1}{x^2} = \left(x + \tfrac{1}{x}\right)^2 - 2 = 16 - 2 = 14\).` },
    { id: "ch-nr4", topic: T.conj, q: R`Evaluate \((\sqrt{5} + 2)^{2026}(\sqrt{5} - 2)^{2026}\).`, answer: 1, fmt: "Whole number", e: R`Same exponent → combine the bases: \(\big[(\sqrt{5} + 2)(\sqrt{5} - 2)\big]^{2026} = (5 - 4)^{2026} = 1\).` },
    { id: "ch-nr5", topic: T.exp, q: R`Solve \(2^{x + 3} - 2^{x} = 112\).`, answer: 4, fmt: "Value of x", e: R`Factor: \(2^x(2^3 - 1) = 112 \Rightarrow 7 \cdot 2^x = 112 \Rightarrow 2^x = 16 \Rightarrow x = 4\).` },
    { id: "ch-nr6", topic: T.simp, q: R`Evaluate \(\sqrt[3]{20 + 14\sqrt{2}} + \sqrt[3]{20 - 14\sqrt{2}}\).`, answer: 4, fmt: "Whole number", e: R`\((2 + \sqrt{2})^3 = 8 + 12\sqrt{2} + 12 + 2\sqrt{2} = 20 + 14\sqrt{2}\), and likewise \((2 - \sqrt{2})^3 = 20 - 14\sqrt{2}\). So the sum is \((2 + \sqrt{2}) + (2 - \sqrt{2}) = 4\).` },
    { id: "ch-nr7", topic: T.restr, q: R`How many integers \(x\) make \(\dfrac{\sqrt{x - 2}}{\sqrt{9 - x}}\) a real number?`, answer: 7, fmt: "Whole number", e: R`Need \(x - 2 \ge 0\) and \(9 - x > 0\) (it's in a denominator): \(2 \le x < 9\). Integers 2, 3, …, 8 → 7 of them.` },
    { id: "ch-nr8", topic: T.exp, q: R`If \(\sqrt{x} + \dfrac{1}{\sqrt{x}} = 3\), find \(x + \dfrac{1}{x}\).`, answer: 7, fmt: "Whole number", e: R`Square both sides: \(x + 2 + \tfrac{1}{x} = 9\), so \(x + \tfrac{1}{x} = 7\).` },
    { id: "ch-nr9", topic: T.exp, q: R`Evaluate \(27^{\frac{2}{3}} \cdot 16^{-\frac{3}{4}} \cdot 8^{\frac{1}{3}}\) as a decimal.`, answer: 2.25, fmt: "Decimal", e: R`\(27^{2/3} = 9\), \(16^{-3/4} = \tfrac{1}{8}\), \(8^{1/3} = 2\). Product: \(9 \cdot \tfrac{1}{8}\cdot 2 = \tfrac{9}{4} = 2.25\).` },
    { id: "ch-nr10", topic: T.div, q: R`\(\dfrac{\sqrt{3} + \sqrt{2}}{\sqrt{3} - \sqrt{2}} = a + b\sqrt{6}\). What is \(a + b\)?`, answer: 7, fmt: "Whole number", e: R`Multiply by the conjugate: \(\dfrac{(\sqrt{3} + \sqrt{2})^2}{3 - 2} = 5 + 2\sqrt{6}\). So \(a + b = 7\).` },
    { id: "ch-nr11", topic: T.exp, q: R`Evaluate \(\left(\sqrt{2}\cdot\sqrt[3]{2}\right)^{6}\).`, answer: 32, fmt: "Whole number", e: R`\(\sqrt{2}\cdot\sqrt[3]{2} = 2^{1/2 + 1/3} = 2^{5/6}\). Raised to the 6th: \(2^5 = 32\).` },
    { id: "ch-nr12", topic: T.eq, q: R`Solve \(\sqrt{x + 9} - \sqrt{x} = 1\).`, answer: 16, fmt: "Value of x", e: R`\(\sqrt{x + 9} = 1 + \sqrt{x}\). Square: \(x + 9 = 1 + 2\sqrt{x} + x \Rightarrow \sqrt{x} = 4 \Rightarrow x = 16\). Check: \(5 - 4 = 1\) ✓.` },
  ];

  // ───────── Multiple choice ─────────
  const mc = [
    { id: "ch-mc1", topic: T.simp, q: R`\(\sqrt{11 - 6\sqrt{2}}\) simplifies to:`, c: [M`3 - \sqrt{2}`, M`\sqrt{2} - 3`, M`3 + \sqrt{2}`, M`2\sqrt{2} - 1`],
      e: R`\((3 - \sqrt{2})^2 = 9 - 6\sqrt{2} + 2 = 11 - 6\sqrt{2}\). \(\sqrt{2} - 3\) squares to the same thing, but it's negative, and a principal square root is never negative.` },
    { id: "ch-mc2", topic: T.mixed, q: R`Which statement is true?`, c: [M`\sqrt{5} + \sqrt{7} < 2\sqrt{6}`, M`\sqrt{5} + \sqrt{7} > 2\sqrt{6}`, M`\sqrt{5} + \sqrt{7} = 2\sqrt{6}`, "It can't be determined without a calculator"],
      e: R`Compare squares (both sides positive): \((\sqrt{5} + \sqrt{7})^2 = 12 + 2\sqrt{35}\) and \((2\sqrt{6})^2 = 24 = 12 + 2\sqrt{36}\). Since \(\sqrt{35} < \sqrt{36}\), the left side is smaller.` },
    { id: "ch-mc3", topic: T.simp, q: R`For \(x < 3\), \(\sqrt{x^2 - 6x + 9}\) equals:`, c: [M`3 - x`, M`x - 3`, M`|x| - 3`, M`x + 3`],
      e: R`\(\sqrt{x^2 - 6x + 9} = \sqrt{(x - 3)^2} = |x - 3|\). When \(x < 3\), \(x - 3\) is negative, so \(|x - 3| = 3 - x\).` },
    { id: "ch-mc4", topic: T.conj, q: R`Which expression equals \(\dfrac{1}{\sqrt[3]{2} - 1}\)?`, c: [M`\sqrt[3]{4} + \sqrt[3]{2} + 1`, M`\sqrt[3]{2} + 1`, M`\sqrt[3]{4} - \sqrt[3]{2} + 1`, M`\sqrt[3]{4} + 1`],
      e: R`\(a^3 - b^3 = (a - b)(a^2 + ab + b^2)\). With \(a = \sqrt[3]{2}, b = 1\): \((\sqrt[3]{2} - 1)(\sqrt[3]{4} + \sqrt[3]{2} + 1) = 2 - 1 = 1\).` },
    { id: "ch-mc5", topic: T.eq, q: R`How many real solutions does \(\sqrt{x - 3} + \sqrt{3 - x} = 0\) have?`, c: ["Exactly one", "None", "Two", "Infinitely many"],
      e: R`Both roots must be defined, so \(x \ge 3\) and \(x \le 3\): only \(x = 3\), and it works (\(0 + 0 = 0\)).` },
    { id: "ch-mc6", topic: T.exp, q: R`Evaluate \(\left(\sqrt{2}\right)^{\sqrt{2}\cdot\sqrt{2}}\).`, c: [M`2`, M`4`, M`\sqrt{2}`, M`2\sqrt{2}`],
      e: R`The exponent is \(\sqrt{2}\cdot\sqrt{2} = 2\), so it's \((\sqrt{2})^2 = 2\).` },
    { id: "ch-mc7", topic: T.exp, q: R`For \(x > 0\), simplify \(\left(x^{\frac{1}{2}} + x^{-\frac{1}{2}}\right)^2 - \left(x^{\frac{1}{2}} - x^{-\frac{1}{2}}\right)^2\).`, c: [M`4`, M`0`, M`\dfrac{2}{x}`, M`4x`],
      e: R`\((a + b)^2 - (a - b)^2 = 4ab\), and \(ab = x^{1/2}\cdot x^{-1/2} = x^0 = 1\). So the answer is 4.` },
    { id: "ch-mc8", topic: T.restr, q: R`What is the domain of \(\dfrac{\sqrt{x - 2}}{\sqrt{5 - x}}\)?`, c: [M`2 \le x < 5`, M`2 < x < 5`, M`2 \le x \le 5`, M`x \ge 2`],
      e: R`Top: \(x \ge 2\). Bottom: \(5 - x > 0\) (it can't be zero in a denominator), so \(x < 5\).` },
    { id: "ch-mc9", topic: T.sets, q: R`Which number is <b>rational</b>?`, c: [M`\sqrt{3 + 2\sqrt{2}} - \sqrt{2}`, M`\sqrt{2} + \sqrt{8}`, M`\sqrt[3]{4}\cdot\sqrt[3]{4}`, M`(\sqrt{3} + 1)^2`],
      e: R`\(3 + 2\sqrt{2} = (1 + \sqrt{2})^2\), so the first is \(1 + \sqrt{2} - \sqrt{2} = 1\). The others: \(3\sqrt{2}\), \(\sqrt[3]{16} = 2\sqrt[3]{2}\), \(4 + 2\sqrt{3}\) — all irrational.` },
    { id: "ch-mc10", topic: T.exp, q: R`Solve \(2^{x + 2} - 2^{x} = 96\).`, c: [M`x = 5`, M`x = 4`, M`x = 6`, M`x = 3`],
      e: R`\(2^x(4 - 1) = 96 \Rightarrow 2^x = 32 \Rightarrow x = 5\).` },
    { id: "ch-mc11", topic: T.conj, q: R`If \(a = \sqrt{3} + \sqrt{2}\) and \(b = \sqrt{3} - \sqrt{2}\), what is \(a^2 + b^2\)?`, c: [M`10`, M`2`, M`10 + 4\sqrt{6}`, M`1`],
      e: R`\(a^2 = 5 + 2\sqrt{6}\), \(b^2 = 5 - 2\sqrt{6}\). The radicals cancel: \(a^2 + b^2 = 10\).` },
    { id: "ch-mc12", topic: T.err, q: R`A student solved \(x^{\frac{2}{3}} = 4\): <div class="work"><span class="ln">Line 1</span>\(\left(x^{\frac{2}{3}}\right)^{\frac{3}{2}} = 4^{\frac{3}{2}}\)<span class="ln">Line 2</span>\(x = 8\)</div>What went wrong?`,
      c: [R`They lost a solution: \((\sqrt[3]{x})^2 = 4\) means \(\sqrt[3]{x} = \pm 2\), so \(x = 8\) or \(x = -8\).`, R`\(4^{3/2}\) should be 6.`, R`They should have squared both sides first.`, "Nothing — x = 8 is the only solution."],
      e: R`Raising to the \(\tfrac{3}{2}\) power takes a square root, which hides the negative case. Check: \((-8)^{2/3} = (\sqrt[3]{-8})^2 = (-2)^2 = 4\) ✓.` },
    { id: "ch-mc13", topic: T.eq, q: R`How many real solutions does \(\sqrt{x + 1} = -x\) have?`, c: ["Exactly one", "None", "Two", "Infinitely many"],
      e: R`The right side must be \(\ge 0\), so \(x \le 0\). Squaring: \(x^2 - x - 1 = 0\), \(x = \tfrac{1 \pm \sqrt{5}}{2}\). Only \(\tfrac{1 - \sqrt{5}}{2} \approx -0.618\) satisfies \(x \le 0\).` },
    { id: "ch-mc14", topic: T.div, q: R`Simplify \(\dfrac{\sqrt{6} + \sqrt{2}}{\sqrt{6} - \sqrt{2}}\).`, c: [M`2 + \sqrt{3}`, M`2 - \sqrt{3}`, M`1 + \sqrt{3}`, M`4 + 2\sqrt{3}`],
      e: R`\(\dfrac{(\sqrt{6} + \sqrt{2})^2}{6 - 2} = \dfrac{8 + 4\sqrt{3}}{4} = 2 + \sqrt{3}\).` },
    { id: "ch-mc15", topic: T.sets, q: R`Which sets does \((\sqrt{2})^{4} - \sqrt{16}\) belong to?`, c: ["Whole numbers, integers, rational and real numbers (but not natural)", "Natural, whole, integers, rational and real numbers", "Irrational and real numbers", "Integers only"],
      e: R`\((\sqrt{2})^4 = 4\) and \(\sqrt{16} = 4\), so the value is 0. Zero is whole (so also an integer, rational and real) but not natural.` },
    { id: "ch-mc16", topic: T.simp, q: R`Evaluate \(\sqrt[3]{2 + \sqrt{5}} + \sqrt[3]{2 - \sqrt{5}}\).`, c: [M`1`, M`2`, M`\sqrt[3]{4}`, M`0`],
      e: R`\(\left(\tfrac{1 + \sqrt{5}}{2}\right)^3 = 2 + \sqrt{5}\) and \(\left(\tfrac{1 - \sqrt{5}}{2}\right)^3 = 2 - \sqrt{5}\). Adding the cube roots: \(\tfrac{1 + \sqrt{5}}{2} + \tfrac{1 - \sqrt{5}}{2} = 1\).` },
    { id: "ch-mc17", topic: T.simp, q: R`For \(y < 0\), simplify \(\sqrt[4]{81x^{8}y^{4}}\).`, c: [M`-3x^{2}y`, M`3x^{2}y`, M`3x^{4}y^{2}`, M`9x^{2}y`],
      e: R`\(\sqrt[4]{81x^8y^4} = 3x^2|y|\). Since \(y < 0\), \(|y| = -y\), giving \(-3x^2y\) (which is positive, as an even root must be).` },
    { id: "ch-mc18", topic: T.conj, q: R`Which expression is equal to \(\dfrac{1}{\sqrt{3} + \sqrt{2}}\)?`, c: [M`\sqrt{3} - \sqrt{2}`, M`\sqrt{3} + \sqrt{2}`, M`\dfrac{\sqrt{3} - \sqrt{2}}{5}`, M`\dfrac{1}{\sqrt{5}}`],
      e: R`\(\dfrac{\sqrt{3} - \sqrt{2}}{3 - 2} = \sqrt{3} - \sqrt{2}\). The denominator is 1, not 5.` },
  ];

  window.CH_WR_BANK = wr;
  window.CH_NR_BANK = nr;
  window.CH_MC_BANK = mc;
})();
