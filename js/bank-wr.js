/*
 * WRITTEN RESPONSE bank — five slots that match the exam outline:
 *   Q1  Identifying mixed/entire radicals & converting   (4 marks)
 *   Q2  Rationalizing the denominator — 3 questions       (5 marks)
 *   Q3  Solve the radical equation                        (2 marks)
 *   Q4  Solve the radical equation (extraneous roots)     (3 marks)
 *   Q5  Word problem                                      (5 marks)
 * Each test picks one variant per slot.
 *
 * Part kinds (graded by js/mathcheck.js):
 *   choice  pick one of `choices`
 *   expr    typed expression; form: "simplest" | "rationalized" | "entire" | "value"
 *           (right value but not simplest → loses 1 mark)
 *   set     list of solutions or "none"
 */
(function () {
  const R = String.raw;
  const T = window.TOPICS;

  // ───────── builders ─────────
  function Q1(id, A, B) {
    const part = (k, X) => [
      { key: k + "1", label: `(${k})`, prompt: R`Is \(${X.tex}\) a <b>mixed</b> or <b>entire</b> radical?`, kind: "choice", choices: ["Mixed", "Entire"], answer: X.type, marks: 1 },
      { key: k + "2", label: "", prompt: X.type === "Mixed" ? R`Write \(${X.tex}\) as an entire radical.` : R`Write \(${X.tex}\) as a mixed radical in simplest form.`, kind: "expr", answer: X.ans, ansTex: X.ansTex, form: X.type === "Mixed" ? "entire" : "simplest", marks: 1 },
    ];
    return {
      id, slot: 1, topic: T.mixed, title: "Mixed & entire radicals",
      intro: "For each radical, identify it as mixed or entire, then convert it to the other form.",
      parts: [...part("a", A), ...part("b", B)],
      rubric: ["(a) Correct identification — 1 mark", "(a) Correct conversion — 1 mark", "(b) Correct identification — 1 mark", "(b) Correct conversion (simplest form) — 1 mark"],
      solution: [R`<b>(a)</b> ${A.why}`, R`<b>(b)</b> ${B.why}`],
    };
  }

  function Q2(id, items) {
    const labels = ["a", "b", "c"], marks = [1, 2, 2];
    return {
      id, slot: 2, topic: T.div, title: "Rationalizing the denominator",
      intro: "Rationalize each denominator. Give answers in simplest form.",
      parts: items.map((it, i) => ({
        key: labels[i], label: `(${labels[i]})`, prompt: R`\(${it.tex}\)`, kind: "expr", answer: it.ans, ansTex: it.ansTex, form: "rationalized", marks: marks[i],
      })),
      rubric: [
        "(a) Denominator rationalized and simplified — 1 mark",
        "(b) Multiplied by the conjugate, correct value — 1 mark; fully simplified — 1 mark",
        "(c) Multiplied by the conjugate, correct value — 1 mark; fully simplified — 1 mark",
        "An answer that still has a radical in the denominator earns 0 for that part.",
      ],
      solution: items.map((it, i) => R`<b>(${labels[i]})</b> ${it.why}`),
    };
  }

  function Q3(id, eq, ans, why) {
    return {
      id, slot: 3, topic: T.eq, title: "Solve the radical equation",
      intro: R`Solve algebraically: \(${eq}\)`,
      parts: [{ key: "a", label: "", prompt: "Solution(s):", kind: "set", answer: ans, mode: "final", marks: 2 }],
      rubric: ["Radical isolated and both sides squared correctly — 1 mark", "Correct solution, checked — 1 mark", "Keeping an incorrect or extraneous value costs 1 mark."],
      solution: why,
    };
  }

  function Q4(id, eq, cand, fin, ext, why) {
    return {
      id, slot: 4, topic: T.eq, title: "Solve the radical equation",
      intro: R`Solve \(${eq}\). Show your check for extraneous roots.`,
      parts: [
        { key: "a", label: "(a)", prompt: "After squaring and solving, list <b>every</b> value you get (before checking).", kind: "set", answer: cand, mode: "candidates", marks: 1 },
        { key: "b", label: "(b)", prompt: "After checking, what are the <b>solution(s)</b>?", kind: "set", answer: fin, mode: "final", marks: 1 },
        { key: "c", label: "(c)", prompt: "Which value(s) are <b>extraneous</b>? Type <i>none</i> if there aren't any.", kind: "set", answer: ext, mode: "extraneous", marks: 1 },
      ],
      rubric: ["(a) Squared correctly, rearranged and factored to get both candidates — 1 mark", "(b) Correct solution(s) after verifying — 1 mark", "(c) Correctly identified extraneous root(s) — 1 mark"],
      solution: why,
    };
  }

  const ex = (key, label, prompt, answer, ansTex, marks, form = "simplest") => ({ key, label, prompt, kind: "expr", answer, ansTex, marks, form });

  window.WR_BUILD = { Q1, Q2, Q3, Q4, ex };

  window.WR_SLOTS = [
    { slot: 1, title: "Mixed & entire radicals", marks: 4 },
    { slot: 2, title: "Rationalizing the denominator", marks: 5 },
    { slot: 3, title: "Radical equation", marks: 2 },
    { slot: 4, title: "Radical equation", marks: 3 },
    { slot: 5, title: "Word problem", marks: 5 },
  ];

  window.WR_BANK = [
    // ───────── Q1 ─────────
    Q1("wr1-1",
      { tex: R`5\sqrt{3}`, type: "Mixed", ans: "√75", ansTex: R`\sqrt{75}`, why: R`\(5\sqrt{3}\) has a coefficient outside the root, so it's <b>mixed</b>. \(5\sqrt{3} = \sqrt{5^2 \cdot 3} = \sqrt{25 \cdot 3} = \sqrt{75}\).` },
      { tex: R`\sqrt{98}`, type: "Entire", ans: "7√2", ansTex: R`7\sqrt{2}`, why: R`\(\sqrt{98}\) has everything under the root, so it's <b>entire</b>. Largest perfect square factor: \(98 = 49 \cdot 2\), so \(\sqrt{98} = 7\sqrt{2}\).` }),
    Q1("wr1-2",
      { tex: R`\sqrt{180}`, type: "Entire", ans: "6√5", ansTex: R`6\sqrt{5}`, why: R`<b>Entire.</b> \(180 = 36 \cdot 5\), so \(\sqrt{180} = 6\sqrt{5}\).` },
      { tex: R`-2\sqrt[3]{5}`, type: "Mixed", ans: "∛(-40)", ansTex: R`\sqrt[3]{-40}`, why: R`<b>Mixed.</b> Cube the coefficient: \((-2)^3 = -8\), so \(-2\sqrt[3]{5} = \sqrt[3]{-8 \cdot 5} = \sqrt[3]{-40}\). The negative may go inside because the index is odd.` }),
    Q1("wr1-3",
      { tex: R`3\sqrt[3]{4}`, type: "Mixed", ans: "∛108", ansTex: R`\sqrt[3]{108}`, why: R`<b>Mixed.</b> \(3^3 = 27\), so \(3\sqrt[3]{4} = \sqrt[3]{27 \cdot 4} = \sqrt[3]{108}\).` },
      { tex: R`\sqrt{128}`, type: "Entire", ans: "8√2", ansTex: R`8\sqrt{2}`, why: R`<b>Entire.</b> \(128 = 64 \cdot 2\), so \(\sqrt{128} = 8\sqrt{2}\). (\(4\sqrt{8}\) isn't simplest — 8 still has a square factor.)` }),
    Q1("wr1-4",
      { tex: R`4\sqrt{6}`, type: "Mixed", ans: "√96", ansTex: R`\sqrt{96}`, why: R`<b>Mixed.</b> \(4\sqrt{6} = \sqrt{16 \cdot 6} = \sqrt{96}\).` },
      { tex: R`\sqrt[3]{-250}`, type: "Entire", ans: "-5∛2", ansTex: R`-5\sqrt[3]{2}`, why: R`<b>Entire.</b> Largest perfect cube factor: \(-250 = -125 \cdot 2\), and \(\sqrt[3]{-125} = -5\). So \(\sqrt[3]{-250} = -5\sqrt[3]{2}\).` }),
    Q1("wr1-5",
      { tex: R`\sqrt{300}`, type: "Entire", ans: "10√3", ansTex: R`10\sqrt{3}`, why: R`<b>Entire.</b> \(300 = 100 \cdot 3\), so \(\sqrt{300} = 10\sqrt{3}\).` },
      { tex: R`2\sqrt{11}`, type: "Mixed", ans: "√44", ansTex: R`\sqrt{44}`, why: R`<b>Mixed.</b> \(2\sqrt{11} = \sqrt{4 \cdot 11} = \sqrt{44}\).` }),
    Q1("wr1-6",
      { tex: R`6\sqrt{2}`, type: "Mixed", ans: "√72", ansTex: R`\sqrt{72}`, why: R`<b>Mixed.</b> \(6\sqrt{2} = \sqrt{36 \cdot 2} = \sqrt{72}\).` },
      { tex: R`\sqrt[3]{54}`, type: "Entire", ans: "3∛2", ansTex: R`3\sqrt[3]{2}`, why: R`<b>Entire.</b> \(54 = 27 \cdot 2\), so \(\sqrt[3]{54} = 3\sqrt[3]{2}\).` }),

    // ───────── Q2 ─────────
    Q2("wr2-1", [
      { tex: R`\dfrac{5}{\sqrt{3}}`, ans: "5√3/3", ansTex: R`\dfrac{5\sqrt{3}}{3}`, why: R`\(\dfrac{5}{\sqrt{3}} \cdot \dfrac{\sqrt{3}}{\sqrt{3}} = \dfrac{5\sqrt{3}}{3}\).` },
      { tex: R`\dfrac{4}{3 - \sqrt{5}}`, ans: "3+√5", ansTex: R`3 + \sqrt{5}`, why: R`Multiply by the conjugate: \(\dfrac{4(3 + \sqrt{5})}{(3 - \sqrt{5})(3 + \sqrt{5})} = \dfrac{4(3 + \sqrt{5})}{9 - 5} = \dfrac{4(3 + \sqrt{5})}{4} = 3 + \sqrt{5}\).` },
      { tex: R`\dfrac{\sqrt{6}}{\sqrt{3} + \sqrt{2}}`, ans: "3√2-2√3", ansTex: R`3\sqrt{2} - 2\sqrt{3}`, why: R`\(\dfrac{\sqrt{6}(\sqrt{3} - \sqrt{2})}{3 - 2} = \sqrt{18} - \sqrt{12} = 3\sqrt{2} - 2\sqrt{3}\).` },
    ]),
    Q2("wr2-2", [
      { tex: R`\dfrac{8}{\sqrt{2}}`, ans: "4√2", ansTex: R`4\sqrt{2}`, why: R`\(\dfrac{8\sqrt{2}}{2} = 4\sqrt{2}\).` },
      { tex: R`\dfrac{3}{\sqrt{7} + 2}`, ans: "√7-2", ansTex: R`\sqrt{7} - 2`, why: R`\(\dfrac{3(\sqrt{7} - 2)}{7 - 4} = \dfrac{3(\sqrt{7} - 2)}{3} = \sqrt{7} - 2\).` },
      { tex: R`\dfrac{2 + \sqrt{3}}{2 - \sqrt{3}}`, ans: "7+4√3", ansTex: R`7 + 4\sqrt{3}`, why: R`\(\dfrac{(2 + \sqrt{3})(2 + \sqrt{3})}{4 - 3} = 4 + 4\sqrt{3} + 3 = 7 + 4\sqrt{3}\).` },
    ]),
    Q2("wr2-3", [
      { tex: R`\dfrac{10}{3\sqrt{5}}`, ans: "2√5/3", ansTex: R`\dfrac{2\sqrt{5}}{3}`, why: R`\(\dfrac{10\sqrt{5}}{3 \cdot 5} = \dfrac{10\sqrt{5}}{15} = \dfrac{2\sqrt{5}}{3}\). Only multiply by \(\sqrt{5}\), not \(3\sqrt{5}\).` },
      { tex: R`\dfrac{6}{\sqrt{5} - \sqrt{2}}`, ans: "2√5+2√2", ansTex: R`2\sqrt{5} + 2\sqrt{2}`, why: R`\(\dfrac{6(\sqrt{5} + \sqrt{2})}{5 - 2} = 2(\sqrt{5} + \sqrt{2}) = 2\sqrt{5} + 2\sqrt{2}\).` },
      { tex: R`\dfrac{\sqrt{3} + 1}{\sqrt{3} - 1}`, ans: "2+√3", ansTex: R`2 + \sqrt{3}`, why: R`\(\dfrac{(\sqrt{3} + 1)^2}{3 - 1} = \dfrac{3 + 2\sqrt{3} + 1}{2} = \dfrac{4 + 2\sqrt{3}}{2} = 2 + \sqrt{3}\).` },
    ]),
    Q2("wr2-4", [
      { tex: R`\dfrac{7}{\sqrt{7}}`, ans: "√7", ansTex: R`\sqrt{7}`, why: R`\(\dfrac{7\sqrt{7}}{7} = \sqrt{7}\).` },
      { tex: R`\dfrac{5}{4 + \sqrt{6}}`, ans: "(4-√6)/2", ansTex: R`\dfrac{4 - \sqrt{6}}{2}`, why: R`\(\dfrac{5(4 - \sqrt{6})}{16 - 6} = \dfrac{5(4 - \sqrt{6})}{10} = \dfrac{4 - \sqrt{6}}{2}\).` },
      { tex: R`\dfrac{2\sqrt{3}}{\sqrt{6} - \sqrt{2}}`, ans: "(3√2+√6)/2", ansTex: R`\dfrac{3\sqrt{2} + \sqrt{6}}{2}`, why: R`\(\dfrac{2\sqrt{3}(\sqrt{6} + \sqrt{2})}{6 - 2} = \dfrac{2\sqrt{18} + 2\sqrt{6}}{4} = \dfrac{6\sqrt{2} + 2\sqrt{6}}{4} = \dfrac{3\sqrt{2} + \sqrt{6}}{2}\).` },
    ]),
    Q2("wr2-5", [
      { tex: R`\dfrac{9}{2\sqrt{3}}`, ans: "3√3/2", ansTex: R`\dfrac{3\sqrt{3}}{2}`, why: R`\(\dfrac{9\sqrt{3}}{2 \cdot 3} = \dfrac{9\sqrt{3}}{6} = \dfrac{3\sqrt{3}}{2}\).` },
      { tex: R`\dfrac{2}{\sqrt{5} + 1}`, ans: "(√5-1)/2", ansTex: R`\dfrac{\sqrt{5} - 1}{2}`, why: R`\(\dfrac{2(\sqrt{5} - 1)}{5 - 1} = \dfrac{2(\sqrt{5} - 1)}{4} = \dfrac{\sqrt{5} - 1}{2}\).` },
      { tex: R`\dfrac{\sqrt{5} + \sqrt{2}}{\sqrt{5} - \sqrt{2}}`, ans: "(7+2√10)/3", ansTex: R`\dfrac{7 + 2\sqrt{10}}{3}`, why: R`\(\dfrac{(\sqrt{5} + \sqrt{2})^2}{5 - 2} = \dfrac{5 + 2\sqrt{10} + 2}{3} = \dfrac{7 + 2\sqrt{10}}{3}\).` },
    ]),

    // ───────── Q3 ─────────
    Q3("wr3-1", R`\sqrt{3x - 2} + 4 = 9`, ["9"], [R`Isolate: \(\sqrt{3x - 2} = 5\).`, R`Square: \(3x - 2 = 25 \Rightarrow 3x = 27 \Rightarrow x = 9\).`, R`Check: \(\sqrt{25} + 4 = 9\) ✓. <b>\(x = 9\)</b>`]),
    Q3("wr3-2", R`2\sqrt{x + 1} = 8`, ["15"], [R`Divide by 2: \(\sqrt{x + 1} = 4\).`, R`Square: \(x + 1 = 16 \Rightarrow x = 15\).`, R`Check: \(2\sqrt{16} = 8\) ✓. <b>\(x = 15\)</b>`]),
    Q3("wr3-3", R`\sqrt{5x + 1} - 3 = 3`, ["7"], [R`Isolate: \(\sqrt{5x + 1} = 6\).`, R`Square: \(5x + 1 = 36 \Rightarrow x = 7\).`, R`Check: \(\sqrt{36} - 3 = 3\) ✓. <b>\(x = 7\)</b>`]),
    Q3("wr3-4", R`\sqrt[3]{2x - 1} = 3`, ["14"], [R`Cube both sides: \(2x - 1 = 27\).`, R`\(2x = 28 \Rightarrow x = 14\).`, R`Check: \(\sqrt[3]{27} = 3\) ✓. <b>\(x = 14\)</b>`]),
    Q3("wr3-5", R`\sqrt{2x + 3} = \sqrt{x + 8}`, ["5"], [R`Square both sides: \(2x + 3 = x + 8\).`, R`\(x = 5\).`, R`Check: \(\sqrt{13} = \sqrt{13}\) ✓. <b>\(x = 5\)</b>`]),
    Q3("wr3-6", R`3 + \sqrt{4x - 3} = 6`, ["3"], [R`Isolate: \(\sqrt{4x - 3} = 3\).`, R`Square: \(4x - 3 = 9 \Rightarrow 4x = 12 \Rightarrow x = 3\).`, R`Check: \(3 + \sqrt{9} = 6\) ✓. <b>\(x = 3\)</b>`]),

    // ───────── Q4 ─────────
    Q4("wr4-1", R`\sqrt{x + 7} = x + 1`, ["2", "-3"], ["2"], ["-3"], [
      R`Square: \(x + 7 = x^2 + 2x + 1\).`, R`Rearrange: \(x^2 + x - 6 = 0 \Rightarrow (x + 3)(x - 2) = 0\), so \(x = -3\) or \(x = 2\).`,
      R`Check \(x = 2\): \(\sqrt{9} = 3\) and \(2 + 1 = 3\) ✓.`, R`Check \(x = -3\): \(\sqrt{4} = 2\) but \(-3 + 1 = -2\) ✗ → extraneous.`, R`<b>Solution: \(x = 2\).</b>`]),
    Q4("wr4-2", R`\sqrt{x + 12} = x`, ["4", "-3"], ["4"], ["-3"], [
      R`Square: \(x + 12 = x^2\).`, R`\(x^2 - x - 12 = 0 \Rightarrow (x - 4)(x + 3) = 0\), so \(x = 4\) or \(x = -3\).`,
      R`Check \(x = 4\): \(\sqrt{16} = 4\) ✓.`, R`Check \(x = -3\): \(\sqrt{9} = 3 \ne -3\) ✗ → extraneous.`, R`<b>Solution: \(x = 4\).</b>`]),
    Q4("wr4-3", R`\sqrt{2x + 7} = x + 2`, ["1", "-3"], ["1"], ["-3"], [
      R`Square: \(2x + 7 = x^2 + 4x + 4\).`, R`\(x^2 + 2x - 3 = 0 \Rightarrow (x + 3)(x - 1) = 0\), so \(x = -3\) or \(x = 1\).`,
      R`Check \(x = 1\): \(\sqrt{9} = 3\) and \(1 + 2 = 3\) ✓.`, R`Check \(x = -3\): \(\sqrt{1} = 1\) but \(-3 + 2 = -1\) ✗ → extraneous.`, R`<b>Solution: \(x = 1\).</b>`]),
    Q4("wr4-4", R`\sqrt{3x + 1} = x - 3`, ["1", "8"], ["8"], ["1"], [
      R`Square: \(3x + 1 = x^2 - 6x + 9\).`, R`\(x^2 - 9x + 8 = 0 \Rightarrow (x - 1)(x - 8) = 0\), so \(x = 1\) or \(x = 8\).`,
      R`Check \(x = 8\): \(\sqrt{25} = 5\) and \(8 - 3 = 5\) ✓.`, R`Check \(x = 1\): \(\sqrt{4} = 2\) but \(1 - 3 = -2\) ✗ → extraneous.`, R`<b>Solution: \(x = 8\).</b>`]),
    Q4("wr4-5", R`\sqrt{x + 3} + 3 = x`, ["1", "6"], ["6"], ["1"], [
      R`Isolate first: \(\sqrt{x + 3} = x - 3\).`, R`Square: \(x + 3 = x^2 - 6x + 9 \Rightarrow x^2 - 7x + 6 = 0 \Rightarrow (x - 1)(x - 6) = 0\).`,
      R`Check \(x = 6\): \(\sqrt{9} + 3 = 6\) ✓.`, R`Check \(x = 1\): \(\sqrt{4} + 3 = 5 \ne 1\) ✗ → extraneous.`, R`<b>Solution: \(x = 6\).</b>`]),
    Q4("wr4-6", R`\sqrt{5x - 1} = x + 1`, ["1", "2"], ["1", "2"], [], [
      R`Square: \(5x - 1 = x^2 + 2x + 1\).`, R`\(x^2 - 3x + 2 = 0 \Rightarrow (x - 1)(x - 2) = 0\), so \(x = 1\) or \(x = 2\).`,
      R`Check \(x = 1\): \(\sqrt{4} = 2\) and \(1 + 1 = 2\) ✓.`, R`Check \(x = 2\): \(\sqrt{9} = 3\) and \(2 + 1 = 3\) ✓.`, R`<b>Both work: \(x = 1\) and \(x = 2\). Nothing is extraneous</b> — checking is still required!`]),

    // ───────── Q5 word problems ─────────
    {
      id: "wr5-1", slot: 5, topic: T.app, title: "Word problem",
      intro: R`A rectangular garden is \(\sqrt{48}\) m long and \(\sqrt{12}\) m wide. Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "What is the perimeter of the garden? (m)", "12√3", R`12\sqrt{3}\text{ m}`, 2),
        ex("b", "(b)", "What is the area of the garden? (m²)", "24", R`24\text{ m}^2`, 1),
        ex("c", "(c)", "A path runs diagonally from corner to corner. How long is it? (m)", "2√15", R`2\sqrt{15}\text{ m}`, 2),
      ],
      rubric: ["(a) Correct perimeter — 1 mark; simplified — 1 mark", "(b) Correct area — 1 mark", "(c) Pythagorean theorem, correct value — 1 mark; simplified — 1 mark"],
      solution: [
        R`Simplify first: \(\sqrt{48} = 4\sqrt{3}\), \(\sqrt{12} = 2\sqrt{3}\).`,
        R`<b>(a)</b> \(P = 2(4\sqrt{3} + 2\sqrt{3}) = 2(6\sqrt{3}) = 12\sqrt{3}\) m.`,
        R`<b>(b)</b> \(A = \sqrt{48}\cdot\sqrt{12} = \sqrt{576} = 24\) m².`,
        R`<b>(c)</b> \(d = \sqrt{48 + 12} = \sqrt{60} = 2\sqrt{15}\) m.`,
      ],
    },
    {
      id: "wr5-2", slot: 5, topic: T.app, title: "Word problem",
      intro: R`A square poster has an area of \(50\text{ cm}^2\). Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "What is the side length of the poster? (cm)", "5√2", R`5\sqrt{2}\text{ cm}`, 1),
        ex("b", "(b)", "What is the perimeter of the poster? (cm)", "20√2", R`20\sqrt{2}\text{ cm}`, 2),
        ex("c", "(c)", "What is the length of the poster's diagonal? (cm)", "10", R`10\text{ cm}`, 2),
      ],
      rubric: ["(a) Correct side in simplest form — 1 mark", "(b) Correct perimeter — 1 mark; simplified — 1 mark", "(c) Pythagorean theorem, correct value — 1 mark; simplified — 1 mark"],
      solution: [
        R`<b>(a)</b> \(s = \sqrt{50} = \sqrt{25 \cdot 2} = 5\sqrt{2}\) cm.`,
        R`<b>(b)</b> \(P = 4 \cdot 5\sqrt{2} = 20\sqrt{2}\) cm.`,
        R`<b>(c)</b> \(d^2 = (5\sqrt{2})^2 + (5\sqrt{2})^2 = 50 + 50 = 100\), so \(d = 10\) cm.`,
      ],
    },
    {
      id: "wr5-3", slot: 5, topic: T.app, title: "Word problem",
      intro: R`A rectangular picture frame measures \((3 + \sqrt{2})\) cm by \((3 - \sqrt{2})\) cm. Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "What is the perimeter of the frame? (cm)", "12", R`12\text{ cm}`, 2),
        ex("b", "(b)", "What is the area of the frame? (cm²)", "7", R`7\text{ cm}^2`, 1),
        ex("c", "(c)", "What is the length of the frame's diagonal? (cm)", "√22", R`\sqrt{22}\text{ cm}`, 2),
      ],
      rubric: ["(a) Correct perimeter — 2 marks (like terms combined)", "(b) Correct area using conjugates — 1 mark", "(c) Squared both binomials correctly — 1 mark; correct diagonal — 1 mark"],
      solution: [
        R`<b>(a)</b> \(P = 2\big[(3 + \sqrt{2}) + (3 - \sqrt{2})\big] = 2(6) = 12\) cm — the radicals cancel.`,
        R`<b>(b)</b> \(A = (3 + \sqrt{2})(3 - \sqrt{2}) = 9 - 2 = 7\) cm² (conjugates!).`,
        R`<b>(c)</b> \((3 + \sqrt{2})^2 = 11 + 6\sqrt{2}\) and \((3 - \sqrt{2})^2 = 11 - 6\sqrt{2}\). Add: \(22\). So \(d = \sqrt{22}\) cm.`,
      ],
    },
    {
      id: "wr5-4", slot: 5, topic: T.app, title: "Word problem",
      intro: R`A cube-shaped storage box has a volume of \(54\text{ cm}^3\). Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "What is the edge length of the box? (cm)", "3∛2", R`3\sqrt[3]{2}\text{ cm}`, 2),
        ex("b", "(b)", "What is the area of one face? (cm²)", "9∛4", R`9\sqrt[3]{4}\text{ cm}^2`, 2),
        ex("c", "(c)", "What is the total surface area of the box? (cm²)", "54∛4", R`54\sqrt[3]{4}\text{ cm}^2`, 1),
      ],
      rubric: ["(a) Cube root of the volume — 1 mark; simplified — 1 mark", "(b) Squared the edge correctly — 1 mark; simplified — 1 mark", "(c) Six faces — 1 mark"],
      solution: [
        R`<b>(a)</b> \(s = \sqrt[3]{54} = \sqrt[3]{27 \cdot 2} = 3\sqrt[3]{2}\) cm.`,
        R`<b>(b)</b> \(s^2 = (3\sqrt[3]{2})^2 = 9\sqrt[3]{4}\) cm².`,
        R`<b>(c)</b> \(SA = 6 \cdot 9\sqrt[3]{4} = 54\sqrt[3]{4}\) cm².`,
      ],
    },
    {
      id: "wr5-5", slot: 5, topic: T.app, title: "Word problem",
      intro: R`A wheelchair ramp has a horizontal run of \(4\sqrt{3}\) m and a vertical rise of \(2\sqrt{3}\) m. Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "How long is the ramp's sloped surface? (m)", "2√15", R`2\sqrt{15}\text{ m}`, 2),
        ex("b", "(b)", "What is the slope of the ramp (rise ÷ run)?", "1/2", R`\tfrac{1}{2}`, 1),
        ex("c", "(c)", "The side of the ramp is a right triangle. What is its area? (m²)", "12", R`12\text{ m}^2`, 2),
      ],
      rubric: ["(a) Pythagorean theorem, correct value — 1 mark; simplified — 1 mark", "(b) Correct slope — 1 mark", "(c) Used ½ × base × height — 1 mark; correct area — 1 mark"],
      solution: [
        R`<b>(a)</b> \(L^2 = (4\sqrt{3})^2 + (2\sqrt{3})^2 = 48 + 12 = 60\), so \(L = \sqrt{60} = 2\sqrt{15}\) m.`,
        R`<b>(b)</b> \(\dfrac{2\sqrt{3}}{4\sqrt{3}} = \dfrac{1}{2}\).`,
        R`<b>(c)</b> \(A = \tfrac{1}{2}(4\sqrt{3})(2\sqrt{3}) = \tfrac{1}{2}(8 \cdot 3) = 12\) m².`,
      ],
    },
    {
      id: "wr5-6", slot: 5, topic: T.app, title: "Word problem",
      intro: R`A square floor tile has a diagonal of \(6\) cm. Give exact answers in simplest form.`,
      parts: [
        ex("a", "(a)", "What is the side length of the tile? (cm)", "3√2", R`3\sqrt{2}\text{ cm}`, 2, "rationalized"),
        ex("b", "(b)", "What is the perimeter of the tile? (cm)", "12√2", R`12\sqrt{2}\text{ cm}`, 1),
        ex("c", "(c)", "What is the area of the tile? (cm²)", "18", R`18\text{ cm}^2`, 2),
      ],
      rubric: ["(a) Set up \(s^2 + s^2 = 36\) — 1 mark; rationalized/simplified side — 1 mark", "(b) Correct perimeter — 1 mark", "(c) Correct area — 2 marks"],
      solution: [
        R`<b>(a)</b> \(s^2 + s^2 = 6^2 \Rightarrow 2s^2 = 36 \Rightarrow s^2 = 18 \Rightarrow s = \sqrt{18} = 3\sqrt{2}\) cm. (Or \(s = \tfrac{6}{\sqrt{2}} = \tfrac{6\sqrt{2}}{2} = 3\sqrt{2}\).)`,
        R`<b>(b)</b> \(P = 4 \cdot 3\sqrt{2} = 12\sqrt{2}\) cm.`,
        R`<b>(c)</b> \(A = s^2 = 18\) cm².`,
      ],
    },
    {
      id: "wr5-7", slot: 5, topic: T.app, title: "Word problem",
      intro: R`The period \(T\) (time for one full swing, in seconds) of a pendulum of length \(L\) metres is \(T = 2\pi\sqrt{\dfrac{L}{9.8}}\).`,
      parts: [
        ex("a", "(a)", R`Find the <b>exact</b> period of a pendulum that is 39.2 m long. (s)`, "4π", R`4\pi\text{ s}`, 2),
        { key: "b", label: "(b)", prompt: "A pendulum has a period of 3 s. Find its length to the nearest hundredth of a metre.", kind: "number", answer: 2.23, round: 2, exact: "22.05/π^2", marks: 3 },
      ],
      rubric: ["(a) Substituted and simplified the root (√4 = 2) — 1 mark; exact answer 4π — 1 mark (a decimal loses this mark)", "(b) Isolated the root: √(L/9.8) = 3/(2π) — 1 mark; squared both sides — 1 mark; L ≈ 2.23 m — 1 mark"],
      solution: [
        R`<b>(a)</b> \(T = 2\pi\sqrt{\tfrac{39.2}{9.8}} = 2\pi\sqrt{4} = 2\pi(2) = 4\pi\) s (about 12.57 s, but the question asks for exact).`,
        R`<b>(b)</b> \(3 = 2\pi\sqrt{\tfrac{L}{9.8}} \Rightarrow \sqrt{\tfrac{L}{9.8}} = \tfrac{3}{2\pi}\). Square: \(\tfrac{L}{9.8} = \tfrac{9}{4\pi^2}\), so \(L = \tfrac{88.2}{4\pi^2} = \tfrac{22.05}{\pi^2} \approx 2.23\) m.`,
      ],
    },
    {
      id: "wr5-8", slot: 5, topic: T.app, title: "Word problem",
      intro: R`An object dropped from a height of \(h\) metres takes \(t = \sqrt{\dfrac{h}{4.9}}\) seconds to reach the ground.`,
      parts: [
        ex("a", "(a)", R`Find the <b>exact</b> time for an object dropped from 245 m, in simplest radical form. (s)`, "5√2", R`5\sqrt{2}\text{ s}`, 2),
        { key: "b", label: "(b)", prompt: "How long does it take to fall 100 m? Round to the nearest hundredth of a second.", kind: "number", answer: 4.52, round: 2, exact: "sqrt(100/4.9)", marks: 2 },
        { key: "c", label: "(c)", prompt: "From what height does a fall take exactly 3 s? (m)", kind: "number", answer: 44.1, marks: 1 },
      ],
      rubric: ["(a) Substituted (245 ÷ 4.9 = 50) — 1 mark; simplified √50 = 5√2 — 1 mark", "(b) Correct substitution — 1 mark; rounded to 4.52 s — 1 mark", "(c) Squared both sides: h = 4.9t² = 44.1 m — 1 mark"],
      solution: [
        R`<b>(a)</b> \(t = \sqrt{\tfrac{245}{4.9}} = \sqrt{50} = \sqrt{25 \cdot 2} = 5\sqrt{2}\) s.`,
        R`<b>(b)</b> \(t = \sqrt{\tfrac{100}{4.9}} \approx \sqrt{20.408} \approx 4.52\) s.`,
        R`<b>(c)</b> \(3 = \sqrt{\tfrac{h}{4.9}} \Rightarrow 9 = \tfrac{h}{4.9} \Rightarrow h = 44.1\) m.`,
      ],
    },
  ];
})();
