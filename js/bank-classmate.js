/*
 * TIM'S TEST — a fixed 34-mark practice test written by our classmate Tim.
 * Credit: questions and marking guide by Tim (shared with permission for class study).
 * Internal level id stays "classmate" so saved history and group codes keep working.
 * The teacher said it's about the same difficulty as the unit test, a bit softer.
 * Multiple-choice options keep the original A–D order (`order` lists which c[] goes in each slot).
 * As in every bank, c[0] is the correct answer.
 */
(function () {
  const R = String.raw;
  const M = (s, ...v) => "\\(" + String.raw(s, ...v) + "\\)";
  const T = window.TOPICS;
  const ex = (key, label, prompt, answer, ansTex, marks, form = "simplest") => ({ key, label, prompt, kind: "expr", answer, ansTex, marks, form });

  const wr = [
    {
      id: "cm-wr1", slot: 1, topic: T.mixed, title: "Mixed and entire radicals",
      intro: "Convert each radical.",
      parts: [
        ex("a", "(a)", R`Convert \(3\sqrt{5}\) to an entire radical.`, "√45", R`\sqrt{45}`, 1, "entire"),
        ex("b", "(b)", R`Convert \(2\sqrt[3]{3}\) to an entire radical.`, "∛24", R`\sqrt[3]{24}`, 1, "entire"),
        ex("c", "(c)", R`Convert \(\sqrt{72}\) to a mixed radical in simplest form.`, "6√2", R`6\sqrt{2}`, 1),
        ex("d", "(d)", R`Convert \(\sqrt[3]{54}\) to a mixed radical in simplest form.`, "3∛2", R`3\sqrt[3]{2}`, 1),
      ],
      rubric: ["(a) √45 — 1 mark", "(b) ∛24 — 1 mark", "(c) 6√2 — 1 mark", "(d) 3∛2 — 1 mark"],
      solution: [
        R`<b>(a)</b> \(3\sqrt{5} = \sqrt{9 \cdot 5} = \sqrt{45}\).`,
        R`<b>(b)</b> \(2\sqrt[3]{3} = \sqrt[3]{8 \cdot 3} = \sqrt[3]{24}\).`,
        R`<b>(c)</b> \(\sqrt{72} = \sqrt{36 \cdot 2} = 6\sqrt{2}\).`,
        R`<b>(d)</b> \(\sqrt[3]{54} = \sqrt[3]{27 \cdot 2} = 3\sqrt[3]{2}\).`,
      ],
    },
    {
      id: "cm-wr2", slot: 2, topic: T.div, title: "Rationalizing the denominator",
      intro: "Rationalize the denominator and simplify each expression.",
      parts: [
        ex("a", "(a)", R`\(\dfrac{6}{\sqrt{3}}\)`, "2√3", R`2\sqrt{3}`, 1, "rationalized"),
        ex("b", "(b)", R`\(\dfrac{5}{3\sqrt{2}}\)`, "5√2/6", R`\dfrac{5\sqrt{2}}{6}`, 1, "rationalized"),
        ex("c", "(c)", R`\(\dfrac{\sqrt{7} + 2}{\sqrt{7} - 2}\)`, "(11+4√7)/3", R`\dfrac{11 + 4\sqrt{7}}{3}`, 3, "rationalized"),
      ],
      rubric: ["(a) 6√3/3 = 2√3 — 1 mark", "(b) 5√2/6 — 1 mark", "(c) Multiply by the conjugate (√7 + 2)/(√7 + 2) — 1 mark; numerator 11 + 4√7 and denominator 3 — 1 mark; answer (11 + 4√7)/3 — 1 mark"],
      solution: [
        R`<b>(a)</b> \(\dfrac{6}{\sqrt{3}}\cdot\dfrac{\sqrt{3}}{\sqrt{3}} = \dfrac{6\sqrt{3}}{3} = 2\sqrt{3}\).`,
        R`<b>(b)</b> \(\dfrac{5}{3\sqrt{2}}\cdot\dfrac{\sqrt{2}}{\sqrt{2}} = \dfrac{5\sqrt{2}}{6}\).`,
        R`<b>(c)</b> Multiply by \(\dfrac{\sqrt{7} + 2}{\sqrt{7} + 2}\). Numerator: \((\sqrt{7} + 2)^2 = 7 + 4\sqrt{7} + 4 = 11 + 4\sqrt{7}\). Denominator: \(7 - 4 = 3\). Answer: \(\dfrac{11 + 4\sqrt{7}}{3}\).`,
      ],
    },
    {
      id: "cm-wr3", slot: 3, topic: T.eq, title: "Solve the radical equation",
      intro: R`Solve \(\sqrt{3x - 2} = 4\). State the restriction on \(x\) and verify your solution.`,
      parts: [
        { key: "a", label: "(a)", prompt: "Restriction on x:", kind: "restriction", answer: { op: ">=", value: "2/3" }, marks: 1 },
        { key: "b", label: "(b)", prompt: "Solution:", kind: "set", answer: ["6"], mode: "final", marks: 1 },
      ],
      rubric: ["Restriction x ≥ 2/3 and squaring both sides: 3x − 2 = 16, so x = 6 — 1 mark", "Verify: √16 = 4 ✓ — 1 mark"],
      solution: [R`Restriction: \(3x - 2 \ge 0 \Rightarrow x \ge \tfrac{2}{3}\).`, R`Square both sides: \(3x - 2 = 16 \Rightarrow 3x = 18 \Rightarrow x = 6\).`, R`Verify: \(\sqrt{3(6) - 2} = \sqrt{16} = 4\) ✓.`],
    },
    {
      id: "cm-wr4", slot: 4, topic: T.eq, title: "Solve the radical equation",
      intro: R`Solve \(\sqrt{x + 6} = x\). State the restriction on \(x\) and verify each solution to identify any extraneous roots.`,
      parts: [
        { key: "a", label: "(a)", prompt: "Restriction on x (the right side can't be negative):", kind: "restriction", answer: { op: ">=", value: "0" }, marks: 1 },
        { key: "b", label: "(b)", prompt: "After squaring and factoring, list <b>every</b> value you get (before checking).", kind: "set", answer: ["3", "-2"], mode: "candidates", marks: 1 },
        { key: "c", label: "(c)", prompt: "Final answer after verifying:", kind: "set", answer: ["3"], mode: "final", marks: 1 },
      ],
      rubric: ["Restriction x ≥ 0; square both sides: x + 6 = x², so x² − x − 6 = 0 — 1 mark", "Factor (x − 3)(x + 2) = 0 — 1 mark", "Verify: x = 3 works, x = −2 is extraneous (√4 = 2, not −2). Answer x = 3 — 1 mark"],
      solution: [R`Restriction: \(\sqrt{x+6}\) is never negative, so \(x \ge 0\).`, R`Square: \(x + 6 = x^2 \Rightarrow x^2 - x - 6 = 0 \Rightarrow (x - 3)(x + 2) = 0\).`, R`Check \(x = 3\): \(\sqrt{9} = 3\) ✓. Check \(x = -2\): \(\sqrt{4} = 2 \ne -2\) ✗ → extraneous.`, R`<b>Answer: \(x = 3\).</b>`],
    },
    {
      id: "cm-wr5", slot: 5, topic: T.app, title: "Application",
      intro: R`The period \(T\) (time for one full swing, in seconds) of a pendulum of length \(L\) (in metres) is given by \(T = 2\pi\sqrt{\dfrac{L}{9.8}}\).`,
      parts: [
        ex("a", "(a)", R`Find the <b>exact</b> period of a pendulum that is 2.45 m long. (s)`, "π", R`\pi\text{ s}`, 2),
        { key: "b", label: "(b)", prompt: "A pendulum has a period of 4 s. Find its length to the nearest hundredth of a metre.", kind: "number", answer: 3.97, round: 2, exact: "39.2/π^2", marks: 3 },
      ],
      rubric: ["(a) T = 2π√(2.45/9.8) = 2π√0.25 — 1 mark; T = 2π(0.5) = π s — 1 mark", "(b) 4 = 2π√(L/9.8), so √(L/9.8) = 2/π — 1 mark; square both sides: L/9.8 = 4/π² — 1 mark; L = 39.2/π² ≈ 3.97 m — 1 mark"],
      solution: [
        R`<b>(a)</b> \(T = 2\pi\sqrt{\tfrac{2.45}{9.8}} = 2\pi\sqrt{0.25} = 2\pi(0.5) = \pi\) s (about 3.14 s).`,
        R`<b>(b)</b> \(4 = 2\pi\sqrt{\tfrac{L}{9.8}} \Rightarrow \sqrt{\tfrac{L}{9.8}} = \tfrac{2}{\pi}\). Square: \(\tfrac{L}{9.8} = \tfrac{4}{\pi^2}\), so \(L = \tfrac{39.2}{\pi^2} \approx 3.97\) m.`,
      ],
    },
  ];

  const nr = [
    { id: "cm-nr1", topic: T.simp, q: R`When \(\sqrt{200}\) is written in the form \(a\sqrt{b}\) (with \(b\) as small as possible), the value of \(a + b\) is ___.`, answer: 12, fmt: "Whole number", e: R`\(\sqrt{200} = 10\sqrt{2}\), so \(10 + 2 = 12\).` },
    { id: "cm-nr2", topic: T.eq, q: R`The solution to \(\sqrt{2x + 1} = 7\) is \(x = \) ___.`, answer: 24, fmt: "Value of x", e: R`\(2x + 1 = 49 \Rightarrow x = 24\).` },
    { id: "cm-nr3", topic: T.exp, q: R`The value of \(16^{\frac{3}{4}}\) is ___.`, answer: 8, fmt: "Whole number", e: R`\(16^{3/4} = (\sqrt[4]{16})^3 = 2^3 = 8\).` },
    { id: "cm-nr4", topic: T.restr, q: R`The expression \(\sqrt{5x - 10}\) is defined for \(x \ge\) ___.`, answer: 2, fmt: "Whole number", e: R`\(5x - 10 \ge 0 \Rightarrow x \ge 2\).` },
    { id: "cm-nr5", topic: T.mult, q: R`When \((3\sqrt{2})(4\sqrt{8})\) is simplified, the result is ___.`, answer: 48, fmt: "Whole number", e: R`\(3 \cdot 4 \cdot \sqrt{16} = 12 \cdot 4 = 48\).` },
  ];

  const mc = [
    { id: "cm-mc1", topic: T.mixed, q: R`The entire radical form of \(4\sqrt{3}\) is`, c: [M`\sqrt{48}`, M`\sqrt{12}`, M`\sqrt{144}`, M`\sqrt{19}`], order: [1, 0, 2, 3], e: R`\(4\sqrt{3} = \sqrt{16 \cdot 3} = \sqrt{48}\).` },
    { id: "cm-mc2", topic: T.mixed, q: R`The mixed radical form of \(\sqrt{98}\) is`, c: [M`7\sqrt{2}`, M`2\sqrt{7}`, M`14\sqrt{7}`, M`49\sqrt{2}`], order: [1, 0, 2, 3], e: R`\(\sqrt{98} = \sqrt{49 \cdot 2} = 7\sqrt{2}\).` },
    { id: "cm-mc3", topic: T.div, q: R`An equivalent expression for \(\dfrac{5}{\sqrt{10}}\) with a rationalized denominator is`, c: [M`\dfrac{\sqrt{10}}{2}`, M`5\sqrt{10}`, M`\dfrac{1}{2}`, M`\dfrac{\sqrt{10}}{5}`], order: [0, 1, 2, 3], e: R`\(\dfrac{5\sqrt{10}}{10} = \dfrac{\sqrt{10}}{2}\).` },
    { id: "cm-mc4", topic: T.restr, q: R`Which restriction applies to \(x\) in the expression \(\sqrt{4 - 2x}\)?`, c: [M`x \le 2`, M`x \ge 2`, M`x \ge -2`, M`x \le -2`], order: [1, 0, 2, 3], e: R`\(4 - 2x \ge 0 \Rightarrow -2x \ge -4 \Rightarrow x \le 2\) (dividing by \(-2\) flips the sign).` },
    { id: "cm-mc5", topic: T.ops, q: R`Simplified, \(3\sqrt{5} + 2\sqrt{20} - \sqrt{45}\) equals`, c: [M`4\sqrt{5}`, M`2\sqrt{5}`, M`5\sqrt{5}`, M`4\sqrt{20}`], order: [1, 0, 2, 3], e: R`\(3\sqrt{5} + 4\sqrt{5} - 3\sqrt{5} = 4\sqrt{5}\).` },
    { id: "cm-mc6", topic: T.mult, q: R`Simplified, \((2\sqrt{3})(\sqrt{6})\) equals`, c: [M`6\sqrt{2}`, M`12\sqrt{2}`, M`2\sqrt{18}`, M`6\sqrt{3}`], order: [0, 1, 2, 3], e: R`\(2\sqrt{18} = 2 \cdot 3\sqrt{2} = 6\sqrt{2}\). (C is equal in value but not simplified.)` },
    { id: "cm-mc7", topic: T.conj, q: R`To rationalize \(\dfrac{5}{2 + \sqrt{3}}\), multiply the numerator and denominator by`, c: [M`2 - \sqrt{3}`, M`2 + \sqrt{3}`, M`\sqrt{3}`, M`\sqrt{3} - 2`], order: [1, 0, 2, 3], e: R`Use the conjugate \(2 - \sqrt{3}\): \((2 + \sqrt{3})(2 - \sqrt{3}) = 4 - 3 = 1\).` },
    { id: "cm-mc8", topic: T.eq, q: R`The solution set of \(\sqrt{x + 2} = x\) is`, c: [M`\{2\}`, M`\{-1, 2\}`, M`\{-1\}`, "no solution"], order: [0, 1, 2, 3], e: R`Squaring gives \(x^2 - x - 2 = 0\), so \(x = 2\) or \(x = -1\). \(x = -1\) is extraneous (\(\sqrt{1} = 1 \ne -1\)).` },
    { id: "cm-mc9", topic: T.simp, q: R`The mixed radical form of \(\sqrt[3]{54}\) is`, c: [M`3\sqrt[3]{2}`, M`2\sqrt[3]{27}`, M`9\sqrt[3]{6}`, M`3\sqrt[3]{6}`], order: [0, 1, 2, 3], e: R`\(\sqrt[3]{54} = \sqrt[3]{27 \cdot 2} = 3\sqrt[3]{2}\).` },
    { id: "cm-mc10", topic: T.eq, q: R`The solution to \(\sqrt{x - 1} + 2 = 5\) is`, c: [M`10`, M`8`, M`26`, M`4`], order: [1, 0, 2, 3], e: R`\(\sqrt{x - 1} = 3 \Rightarrow x - 1 = 9 \Rightarrow x = 10\).` },
  ];

  window.CLASSMATE = { wr, nr, mc, title: "Tim's Test", credit: "Questions and marking guide by Tim." };
})();
