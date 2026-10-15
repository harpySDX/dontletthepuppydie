/*
 * Campfire Prep — Pre-Calculus 11 MULTIPLE CHOICE bank (1 mark each)
 * ------------------------------------------------
 * Each question:
 *   id     unique string (used to save history — don't rename existing ids)
 *   topic  shown on the card and used for the topic breakdown
 *   q      question text. Math goes inside \( ... \)  (rendered with KaTeX)
 *   c      choices — THE FIRST CHOICE IS ALWAYS THE CORRECT ONE.
 *          (Choices are shuffled every test, so order here doesn't matter.)
 *   e      explanation shown in review
 *
 * Helpers: R`...` keeps backslashes as typed. M`...` wraps the whole thing in math.
 */
(function () {
  const R = String.raw;
  const M = (s, ...v) => "\\(" + String.raw(s, ...v) + "\\)";

  const T = {
    simp: "Simplifying radicals",
    mixed: "Mixed & entire radicals",
    ops: "Adding & subtracting radicals",
    mult: "Multiplying radicals",
    conj: "Conjugates",
    div: "Dividing & rationalizing",
    restr: "Restrictions",
    eq: "Radical equations",
    fact: "Factoring",
    app: "Applications",
    sets: "Number systems",
    exp: "Exponent laws",
    err: "Find the mistake",
  };

  window.TOPICS = T;

  window.MC_BANK = [
    // ───────────── Simplifying radicals ─────────────
    {
      id: "simp-1", topic: T.simp,
      q: R`Simplify \(\sqrt{72}\).`,
      c: [M`6\sqrt{2}`, M`3\sqrt{8}`, M`2\sqrt{18}`, M`36\sqrt{2}`],
      e: R`Find the largest perfect-square factor: \(72 = 36 \cdot 2\), so \(\sqrt{72} = \sqrt{36}\sqrt{2} = 6\sqrt{2}\). Choices like \(3\sqrt{8}\) are equal in value but not fully simplified.`,
    },
    {
      id: "simp-2", topic: T.simp,
      q: R`Simplify \(3\sqrt{50}\).`,
      c: [M`15\sqrt{2}`, M`8\sqrt{2}`, M`15\sqrt{5}`, M`75\sqrt{2}`],
      e: R`\(\sqrt{50} = \sqrt{25 \cdot 2} = 5\sqrt{2}\), so \(3\sqrt{50} = 3 \cdot 5\sqrt{2} = 15\sqrt{2}\). Multiply the coefficients — don't add them.`,
    },
    {
      id: "simp-3", topic: T.simp,
      q: R`Simplify \(\sqrt[3]{-54}\).`,
      c: [M`-3\sqrt[3]{2}`, M`3\sqrt[3]{2}`, M`-3\sqrt[3]{6}`, "Not a real number"],
      e: R`Cube roots of negatives are real. \(-54 = -27 \cdot 2\) and \(\sqrt[3]{-27} = -3\), so \(\sqrt[3]{-54} = -3\sqrt[3]{2}\). For a cube root you need a perfect-cube factor (27), not a perfect square (9).`,
    },
    {
      id: "simp-4", topic: T.simp,
      q: R`Simplify \(\sqrt{48x^5y^2}\), where \(x \ge 0\) and \(y \ge 0\).`,
      c: [M`4x^2y\sqrt{3x}`, M`4x^2y\sqrt{3}`, M`16x^2y\sqrt{3x}`, M`4x^3y\sqrt{3x}`],
      e: R`\(48 = 16 \cdot 3\), \(x^5 = x^4 \cdot x\), \(y^2\) is a perfect square. Take out \(\sqrt{16x^4y^2} = 4x^2y\), leaving \(\sqrt{3x}\) inside: \(4x^2y\sqrt{3x}\).`,
    },
    {
      id: "simp-5", topic: T.simp,
      q: R`Simplify \(\sqrt[3]{24x^4}\).`,
      c: [M`2x\sqrt[3]{3x}`, M`2x^2\sqrt[3]{3}`, M`3x\sqrt[3]{2x}`, M`8x\sqrt[3]{3x}`],
      e: R`\(24 = 8 \cdot 3\) and \(x^4 = x^3 \cdot x\). \(\sqrt[3]{8x^3} = 2x\) comes out, leaving \(\sqrt[3]{3x}\): \(2x\sqrt[3]{3x}\).`,
    },
    {
      id: "simp-6", topic: T.simp,
      q: R`For all real numbers \(x\), \(\sqrt{x^2}\) is equal to:`,
      c: [M`|x|`, M`x`, M`-x`, M`\pm x`],
      e: R`The principal square root is never negative. If \(x = -5\), \(\sqrt{(-5)^2} = \sqrt{25} = 5 = |-5|\). So \(\sqrt{x^2} = |x|\).`,
    },
    {
      id: "simp-7", topic: T.simp,
      q: R`Which radical is a <b>like radical</b> to \(2\sqrt{3}\) (once simplified)?`,
      c: [M`\sqrt{12}`, M`\sqrt{18}`, M`\sqrt{6}`, M`\sqrt[3]{3}`],
      e: R`Like radicals have the same index and radicand. \(\sqrt{12} = 2\sqrt{3}\) ✓. \(\sqrt{18} = 3\sqrt{2}\), \(\sqrt{6}\) is already simplified, and \(\sqrt[3]{3}\) has a different index.`,
    },

    // ───────────── Mixed & entire radicals ─────────────
    {
      id: "mixed-1", topic: T.mixed,
      q: R`Write \(4\sqrt{3}\) as an entire radical.`,
      c: [M`\sqrt{48}`, M`\sqrt{12}`, M`\sqrt{24}`, M`\sqrt{192}`],
      e: R`Square the coefficient and move it inside: \(4\sqrt{3} = \sqrt{4^2 \cdot 3} = \sqrt{16 \cdot 3} = \sqrt{48}\).`,
    },
    {
      id: "mixed-2", topic: T.mixed,
      q: R`Write \(-2\sqrt[3]{5}\) as an entire radical.`,
      c: [M`\sqrt[3]{-40}`, M`\sqrt[3]{40}`, M`\sqrt[3]{-10}`, M`\sqrt[3]{-20}`],
      e: R`For a cube root, cube the coefficient: \((-2)^3 = -8\). So \(-2\sqrt[3]{5} = \sqrt[3]{-8 \cdot 5} = \sqrt[3]{-40}\). The negative can go inside because the index is odd.`,
    },
    {
      id: "mixed-3", topic: T.mixed,
      q: R`Order from <b>least to greatest</b>: \(3\sqrt{5},\ 4\sqrt{3},\ 2\sqrt{11},\ 5\sqrt{2}\)`,
      c: [
        M`2\sqrt{11},\ 3\sqrt{5},\ 4\sqrt{3},\ 5\sqrt{2}`,
        M`3\sqrt{5},\ 2\sqrt{11},\ 4\sqrt{3},\ 5\sqrt{2}`,
        M`2\sqrt{11},\ 3\sqrt{5},\ 5\sqrt{2},\ 4\sqrt{3}`,
        M`5\sqrt{2},\ 4\sqrt{3},\ 3\sqrt{5},\ 2\sqrt{11}`,
      ],
      e: R`Convert to entire radicals: \(3\sqrt{5} = \sqrt{45}\), \(4\sqrt{3} = \sqrt{48}\), \(2\sqrt{11} = \sqrt{44}\), \(5\sqrt{2} = \sqrt{50}\). Ordering \(44 < 45 < 48 < 50\) gives \(2\sqrt{11}, 3\sqrt{5}, 4\sqrt{3}, 5\sqrt{2}\).`,
    },

    // ───────────── Adding & subtracting ─────────────
    {
      id: "ops-1", topic: T.ops,
      q: R`Simplify \(2\sqrt{12} + 3\sqrt{27} - \sqrt{75}\).`,
      c: [M`8\sqrt{3}`, M`18\sqrt{3}`, M`6\sqrt{3}`, M`4\sqrt{3}`],
      e: R`\(2\sqrt{12} = 4\sqrt{3}\), \(3\sqrt{27} = 9\sqrt{3}\), \(\sqrt{75} = 5\sqrt{3}\). Then \(4\sqrt{3} + 9\sqrt{3} - 5\sqrt{3} = 8\sqrt{3}\).`,
    },
    {
      id: "ops-2", topic: T.ops,
      q: R`Simplify \(5\sqrt{8} - 3\sqrt{18} + \sqrt{32}\).`,
      c: [M`5\sqrt{2}`, M`-3\sqrt{2}`, M`23\sqrt{2}`, M`3\sqrt{22}`],
      e: R`\(5\sqrt{8} = 10\sqrt{2}\), \(3\sqrt{18} = 9\sqrt{2}\), \(\sqrt{32} = 4\sqrt{2}\). So \(10\sqrt{2} - 9\sqrt{2} + 4\sqrt{2} = 5\sqrt{2}\). You can never add radicands (\(3\sqrt{22}\) is a trap).`,
    },
    {
      id: "ops-3", topic: T.ops,
      q: R`Simplify \(2\sqrt[3]{16} + \sqrt[3]{54}\).`,
      c: [M`7\sqrt[3]{2}`, M`3\sqrt[3]{70}`, M`6\sqrt[3]{2}`, M`7\sqrt[3]{4}`],
      e: R`\(\sqrt[3]{16} = \sqrt[3]{8 \cdot 2} = 2\sqrt[3]{2}\), so \(2\sqrt[3]{16} = 4\sqrt[3]{2}\). \(\sqrt[3]{54} = \sqrt[3]{27 \cdot 2} = 3\sqrt[3]{2}\). Total: \(7\sqrt[3]{2}\).`,
    },
    {
      id: "ops-4", topic: T.ops,
      q: R`Simplify \(\sqrt{20x} + 3\sqrt{45x} - \sqrt{5x}\), where \(x \ge 0\).`,
      c: [M`10\sqrt{5x}`, M`12\sqrt{5x}`, M`8\sqrt{5x}`, M`3\sqrt{60x}`],
      e: R`\(\sqrt{20x} = 2\sqrt{5x}\), \(3\sqrt{45x} = 3 \cdot 3\sqrt{5x} = 9\sqrt{5x}\). Then \(2\sqrt{5x} + 9\sqrt{5x} - \sqrt{5x} = 10\sqrt{5x}\).`,
    },

    // ───────────── Multiplying ─────────────
    {
      id: "mult-1", topic: T.mult,
      q: R`Simplify \((2\sqrt{6})(3\sqrt{15})\).`,
      c: [M`18\sqrt{10}`, M`6\sqrt{21}`, M`18\sqrt{5}`, M`5\sqrt{90}`],
      e: R`Multiply coefficients and radicands: \(6\sqrt{90}\). Then \(\sqrt{90} = 3\sqrt{10}\), so \(6 \cdot 3\sqrt{10} = 18\sqrt{10}\).`,
    },
    {
      id: "mult-2", topic: T.mult,
      q: R`Simplify \(\sqrt{5} \cdot \sqrt{15}\).`,
      c: [M`5\sqrt{3}`, M`3\sqrt{5}`, M`\sqrt{20}`, M`75`],
      e: R`\(\sqrt{5 \cdot 15} = \sqrt{75} = \sqrt{25 \cdot 3} = 5\sqrt{3}\).`,
    },
    {
      id: "mult-3", topic: T.mult,
      q: R`Expand and simplify \(\sqrt{3}\,(4\sqrt{6} - 2\sqrt{3})\).`,
      c: [M`12\sqrt{2} - 6`, M`12\sqrt{2} - 6\sqrt{3}`, M`4\sqrt{2} - 6`, M`12\sqrt{2} + 6`],
      e: R`Distribute: \(4\sqrt{18} - 2\sqrt{9} = 4(3\sqrt{2}) - 2(3) = 12\sqrt{2} - 6\).`,
    },
    {
      id: "mult-4", topic: T.mult,
      q: R`Expand and simplify \((3 + \sqrt{5})(2 - \sqrt{5})\).`,
      c: [M`1 - \sqrt{5}`, M`11 - \sqrt{5}`, M`1 + \sqrt{5}`, M`1 - 5\sqrt{5}`],
      e: R`FOIL: \(6 - 3\sqrt{5} + 2\sqrt{5} - \sqrt{25} = 6 - \sqrt{5} - 5 = 1 - \sqrt{5}\).`,
    },
    {
      id: "mult-5", topic: T.mult,
      q: R`Expand and simplify \((2\sqrt{3} - \sqrt{2})^2\).`,
      c: [M`14 - 4\sqrt{6}`, M`10`, M`14 - 2\sqrt{6}`, M`10 - 4\sqrt{6}`],
      e: R`\((a-b)^2 = a^2 - 2ab + b^2\): \((2\sqrt{3})^2 - 2(2\sqrt{3})(\sqrt{2}) + (\sqrt{2})^2 = 12 - 4\sqrt{6} + 2 = 14 - 4\sqrt{6}\). Don't forget the middle term!`,
    },

    // ───────────── Conjugates ─────────────
    {
      id: "conj-1", topic: T.conj,
      q: R`What is the conjugate of \(5 - 2\sqrt{7}\)?`,
      c: [M`5 + 2\sqrt{7}`, M`-5 + 2\sqrt{7}`, M`-5 - 2\sqrt{7}`, M`5 + 7\sqrt{2}`],
      e: R`The conjugate keeps both terms and flips only the sign between them: \(5 - 2\sqrt{7} \to 5 + 2\sqrt{7}\).`,
    },
    {
      id: "conj-2", topic: T.conj,
      q: R`Simplify \((4 + \sqrt{3})(4 - \sqrt{3})\).`,
      c: [M`13`, M`19`, M`16 - \sqrt{3}`, M`13 - 8\sqrt{3}`],
      e: R`Conjugates form a difference of squares: \(4^2 - (\sqrt{3})^2 = 16 - 3 = 13\). The middle terms cancel.`,
    },
    {
      id: "conj-3", topic: T.conj,
      q: R`Simplify \((2\sqrt{5} + 3\sqrt{2})(2\sqrt{5} - 3\sqrt{2})\).`,
      c: [M`2`, M`38`, M`-2`, M`2\sqrt{10}`],
      e: R`\((2\sqrt{5})^2 - (3\sqrt{2})^2 = 4 \cdot 5 - 9 \cdot 2 = 20 - 18 = 2\).`,
    },
    {
      id: "conj-4", topic: T.conj,
      q: R`Why do we multiply by the conjugate to rationalize a denominator like \(\dfrac{1}{3 + \sqrt{2}}\)?`,
      c: [
        "The product is a difference of squares, so the radical disappears",
        "It makes the numerator equal to 1",
        "It doubles the denominator so it can be simplified",
        "Multiplying by any radical removes the radical in the denominator",
      ],
      e: R`\((3 + \sqrt{2})(3 - \sqrt{2}) = 9 - 2 = 7\). The middle terms cancel and squaring removes the root. Multiplying by just \(\sqrt{2}\) would give \(3\sqrt{2} + 2\) — still irrational.`,
    },
    {
      id: "conj-5", topic: T.conj,
      q: R`Factor \(x^2 - 7\) over the real numbers.`,
      c: [M`(x - \sqrt{7})(x + \sqrt{7})`, M`(x - 7)(x + 7)`, M`(x - \sqrt{7})^2`, "It cannot be factored"],
      e: R`It's a difference of squares because \(7 = (\sqrt{7})^2\): \(x^2 - (\sqrt{7})^2 = (x - \sqrt{7})(x + \sqrt{7})\) — a pair of conjugates! (It just can't be factored over the <i>integers</i>.)`,
    },

    // ───────────── Dividing & rationalizing ─────────────
    {
      id: "div-1", topic: T.div,
      q: R`Simplify \(\dfrac{12\sqrt{30}}{4\sqrt{6}}\).`,
      c: [M`3\sqrt{5}`, M`8\sqrt{5}`, M`3\sqrt{24}`, M`48\sqrt{5}`],
      e: R`Divide coefficients and radicands separately: \(\dfrac{12}{4} = 3\), \(\sqrt{\dfrac{30}{6}} = \sqrt{5}\). Result: \(3\sqrt{5}\).`,
    },
    {
      id: "div-2", topic: T.div,
      q: R`Simplify \(\dfrac{2\sqrt{3}}{\sqrt{6}}\).`,
      c: [M`\sqrt{2}`, M`2\sqrt{2}`, M`\dfrac{\sqrt{2}}{2}`, M`\sqrt{18}`],
      e: R`\(\dfrac{2\sqrt{3}}{\sqrt{6}} = 2\sqrt{\dfrac{3}{6}} = \dfrac{2}{\sqrt{2}} = \dfrac{2\sqrt{2}}{2} = \sqrt{2}\).`,
    },
    {
      id: "div-3", topic: T.div,
      q: R`Simplify \(\dfrac{\sqrt{18} + \sqrt{8}}{\sqrt{2}}\).`,
      c: [M`5`, M`5\sqrt{2}`, M`\sqrt{13}`, M`13`],
      e: R`Simplify the top first: \(3\sqrt{2} + 2\sqrt{2} = 5\sqrt{2}\). Then \(\dfrac{5\sqrt{2}}{\sqrt{2}} = 5\). (Or divide each term: \(\sqrt{9} + \sqrt{4} = 3 + 2\).)`,
    },
    {
      id: "div-4", topic: T.div,
      q: R`Rationalize the denominator: \(\dfrac{6}{\sqrt{3}}\)`,
      c: [M`2\sqrt{3}`, M`6\sqrt{3}`, M`\dfrac{\sqrt{3}}{2}`, M`3\sqrt{3}`],
      e: R`Multiply top and bottom by \(\sqrt{3}\): \(\dfrac{6\sqrt{3}}{3} = 2\sqrt{3}\).`,
    },
    {
      id: "div-5", topic: T.div,
      q: R`Rationalize the denominator: \(\dfrac{5}{2\sqrt{10}}\)`,
      c: [M`\dfrac{\sqrt{10}}{4}`, M`\dfrac{\sqrt{10}}{2}`, M`5\sqrt{10}`, M`\dfrac{\sqrt{10}}{20}`],
      e: R`Multiply by \(\dfrac{\sqrt{10}}{\sqrt{10}}\): \(\dfrac{5\sqrt{10}}{2 \cdot 10} = \dfrac{5\sqrt{10}}{20} = \dfrac{\sqrt{10}}{4}\).`,
    },
    {
      id: "div-6", topic: T.div,
      q: R`Rationalize the denominator: \(\dfrac{4}{3 - \sqrt{5}}\)`,
      c: [M`3 + \sqrt{5}`, M`3 - \sqrt{5}`, M`\dfrac{6 + 2\sqrt{5}}{7}`, M`12 + 4\sqrt{5}`],
      e: R`Multiply by the conjugate \(\dfrac{3 + \sqrt{5}}{3 + \sqrt{5}}\): \(\dfrac{4(3 + \sqrt{5})}{9 - 5} = \dfrac{4(3 + \sqrt{5})}{4} = 3 + \sqrt{5}\).`,
    },
    {
      id: "div-7", topic: T.div,
      q: R`Rationalize the denominator: \(\dfrac{\sqrt{6}}{\sqrt{3} + \sqrt{2}}\)`,
      c: [M`3\sqrt{2} - 2\sqrt{3}`, M`3\sqrt{2} + 2\sqrt{3}`, M`\dfrac{3\sqrt{2} - 2\sqrt{3}}{5}`, M`2\sqrt{3} - 3\sqrt{2}`],
      e: R`Multiply by \(\dfrac{\sqrt{3} - \sqrt{2}}{\sqrt{3} - \sqrt{2}}\). Denominator: \(3 - 2 = 1\). Numerator: \(\sqrt{18} - \sqrt{12} = 3\sqrt{2} - 2\sqrt{3}\).`,
    },
    {
      id: "div-8", topic: T.div,
      q: R`Simplify \(\dfrac{2 + \sqrt{3}}{2 - \sqrt{3}}\).`,
      c: [M`7 + 4\sqrt{3}`, M`7 - 4\sqrt{3}`, M`\dfrac{7 + 4\sqrt{3}}{7}`, M`1`],
      e: R`Multiply by \(\dfrac{2 + \sqrt{3}}{2 + \sqrt{3}}\). Denominator: \(4 - 3 = 1\). Numerator: \((2 + \sqrt{3})^2 = 4 + 4\sqrt{3} + 3 = 7 + 4\sqrt{3}\).`,
    },
    {
      id: "div-9", topic: T.div,
      q: R`Rationalize the denominator: \(\dfrac{6}{\sqrt[3]{2}}\)`,
      c: [M`3\sqrt[3]{4}`, M`3\sqrt[3]{2}`, M`6\sqrt[3]{4}`, M`3\sqrt{2}`],
      e: R`You need a perfect cube underneath, so multiply by \(\dfrac{\sqrt[3]{4}}{\sqrt[3]{4}}\): \(\dfrac{6\sqrt[3]{4}}{\sqrt[3]{8}} = \dfrac{6\sqrt[3]{4}}{2} = 3\sqrt[3]{4}\).`,
    },
    {
      id: "div-10", topic: T.div,
      q: R`Simplify \(\dfrac{x - 4}{\sqrt{x} - 2}\), where \(x \ge 0,\ x \ne 4\).`,
      c: [M`\sqrt{x} + 2`, M`\sqrt{x} - 2`, M`x + 2`, M`\dfrac{1}{\sqrt{x} + 2}`],
      e: R`Treat \(x - 4\) as a difference of squares: \(x - 4 = (\sqrt{x} - 2)(\sqrt{x} + 2)\). Cancel \((\sqrt{x} - 2)\) to get \(\sqrt{x} + 2\). (Multiplying by the conjugate gets the same result.)`,
    },

    // ───────────── Restrictions ─────────────
    {
      id: "restr-1", topic: T.restr,
      q: R`For what values of \(x\) is \(\sqrt{2x - 6}\) a real number?`,
      c: [M`x \ge 3`, M`x > 3`, M`x \ge -3`, M`x \le 3`],
      e: R`The radicand must be non-negative: \(2x - 6 \ge 0 \Rightarrow x \ge 3\). Zero is allowed, since \(\sqrt{0} = 0\).`,
    },
    {
      id: "restr-2", topic: T.restr,
      q: R`State the restriction on \(x\) for \(\dfrac{5}{\sqrt{x + 4}}\).`,
      c: [M`x > -4`, M`x \ge -4`, M`x > 4`, M`x \ne -4`],
      e: R`The radicand must be \(\ge 0\) <i>and</i> the denominator can't be 0, so \(x + 4 > 0 \Rightarrow x > -4\).`,
    },
    {
      id: "restr-3", topic: T.restr,
      q: R`For what values of \(x\) is \(\sqrt{5 - x}\) defined?`,
      c: [M`x \le 5`, M`x \ge 5`, M`x \ge -5`, M`x < 5`],
      e: R`\(5 - x \ge 0 \Rightarrow -x \ge -5 \Rightarrow x \le 5\). Remember to flip the inequality when dividing by \(-1\).`,
    },

    // ───────────── Radical equations ─────────────
    {
      id: "eq-1", topic: T.eq,
      q: R`Solve \(\sqrt{x + 5} = 7\).`,
      c: [M`x = 44`, M`x = 2`, M`x = 12`, M`x = 49`],
      e: R`Square both sides: \(x + 5 = 49 \Rightarrow x = 44\). Check: \(\sqrt{49} = 7\) ✓.`,
    },
    {
      id: "eq-2", topic: T.eq,
      q: R`Solve \(\sqrt{3x - 2} + 4 = 9\).`,
      c: [M`x = 9`, M`x = \dfrac{7}{3}`, M`x = \dfrac{23}{3}`, "No solution"],
      e: R`Isolate the radical first: \(\sqrt{3x - 2} = 5\). Square: \(3x - 2 = 25 \Rightarrow 3x = 27 \Rightarrow x = 9\). Check: \(\sqrt{25} + 4 = 9\) ✓.`,
    },
    {
      id: "eq-3", topic: T.eq,
      q: R`Solve \(\sqrt{x + 7} = x + 1\).`,
      c: [M`x = 2 \text{ only}`, M`x = -3 \text{ only}`, M`x = 2 \text{ and } x = -3`, "No solution"],
      e: R`Square: \(x + 7 = x^2 + 2x + 1 \Rightarrow x^2 + x - 6 = 0 \Rightarrow (x + 3)(x - 2) = 0\). Check \(x = 2\): \(\sqrt{9} = 3 = 2 + 1\) ✓. Check \(x = -3\): \(\sqrt{4} = 2\) but \(-3 + 1 = -2\) ✗, so \(-3\) is extraneous.`,
    },
    {
      id: "eq-4", topic: T.eq,
      q: R`Solve \(\sqrt{2x + 3} = \sqrt{x + 8}\).`,
      c: [M`x = 5`, M`x = \dfrac{11}{3}`, M`x = -5`, "No solution"],
      e: R`Square both sides: \(2x + 3 = x + 8 \Rightarrow x = 5\). Check: \(\sqrt{13} = \sqrt{13}\) ✓.`,
    },
    {
      id: "eq-5", topic: T.eq,
      q: R`Solve \(\sqrt{4x + 1} + 6 = 3\).`,
      c: ["No real solution", M`x = 2`, M`x = -2`, M`x = 2 \text{ and } x = -2`],
      e: R`Isolating gives \(\sqrt{4x + 1} = -3\). A principal square root can never be negative, so there's no solution. (Squaring anyway gives \(x = 2\), but checking: \(\sqrt{9} + 6 = 9 \ne 3\) — extraneous.)`,
    },
    {
      id: "eq-6", topic: T.eq,
      q: R`Solve \(\sqrt{x + 5} - \sqrt{x} = 1\).`,
      c: [M`x = 4`, M`x = 16`, M`x = 2`, M`x = 9`],
      e: R`Isolate one radical: \(\sqrt{x + 5} = 1 + \sqrt{x}\). Square: \(x + 5 = 1 + 2\sqrt{x} + x \Rightarrow 4 = 2\sqrt{x} \Rightarrow \sqrt{x} = 2 \Rightarrow x = 4\). Check: \(\sqrt{9} - \sqrt{4} = 1\) ✓.`,
    },
    {
      id: "eq-7", topic: T.eq,
      q: R`When solving \(\sqrt{x + 2} = x\), squaring gives the candidates \(x = 2\) and \(x = -1\). Which statement is true?`,
      c: [
        M`x = 2 \text{ is a solution; } x = -1 \text{ is extraneous}`,
        M`\text{Both are solutions}`,
        M`x = -1 \text{ is a solution; } x = 2 \text{ is extraneous}`,
        M`\text{Both are extraneous}`,
      ],
      e: R`Check each in the <b>original</b>: \(x = 2\): \(\sqrt{4} = 2\) ✓. \(x = -1\): \(\sqrt{1} = 1 \ne -1\) ✗. Squaring can create extraneous roots, so always check.`,
    },

    // ───────────── Factoring ─────────────
    {
      id: "fact-1", topic: T.fact,
      q: R`Factor \(x^2 - 5x - 24\).`,
      c: [M`(x - 8)(x + 3)`, M`(x + 8)(x - 3)`, M`(x - 6)(x + 4)`, M`(x - 12)(x + 2)`],
      e: R`Find two numbers that multiply to \(-24\) and add to \(-5\): \(-8\) and \(3\). So \((x - 8)(x + 3)\).`,
    },
    {
      id: "fact-2", topic: T.fact,
      q: R`Factor \(6x^2 + 7x - 3\).`,
      c: [M`(3x - 1)(2x + 3)`, M`(3x + 1)(2x - 3)`, M`(6x - 1)(x + 3)`, M`(3x - 3)(2x + 1)`],
      e: R`\(a \cdot c = -18\): numbers multiplying to \(-18\) and adding to \(7\) are \(9\) and \(-2\). \(6x^2 + 9x - 2x - 3 = 3x(2x + 3) - 1(2x + 3) = (3x - 1)(2x + 3)\).`,
    },
    {
      id: "fact-3", topic: T.fact,
      q: R`Factor completely: \(2x^3 - 18x\)`,
      c: [M`2x(x - 3)(x + 3)`, M`2x(x^2 - 9)`, M`2x(x - 3)^2`, M`2(x^3 - 9x)`],
      e: R`GCF first: \(2x(x^2 - 9)\). Then \(x^2 - 9\) is a difference of squares: \(2x(x - 3)(x + 3)\). "Completely" means nothing left can factor.`,
    },
    {
      id: "fact-4", topic: T.fact,
      q: R`Factor \(49a^2 - 16b^2\).`,
      c: [M`(7a - 4b)(7a + 4b)`, M`(7a - 4b)^2`, M`(7a + 4b)^2`, M`(49a + 16b)(a - b)`],
      e: R`Difference of squares: \((7a)^2 - (4b)^2 = (7a - 4b)(7a + 4b)\).`,
    },
    {
      id: "fact-5", topic: T.fact,
      q: R`Factor completely: \(x^4 - 13x^2 + 36\)`,
      c: [M`(x - 2)(x + 2)(x - 3)(x + 3)`, M`(x^2 - 4)(x^2 - 9)`, M`(x - 2)^2(x - 3)^2`, M`(x^2 + 4)(x^2 + 9)`],
      e: R`Quadratic form: let \(u = x^2\), so \(u^2 - 13u + 36 = (u - 4)(u - 9)\) → \((x^2 - 4)(x^2 - 9)\). Both are differences of squares: \((x - 2)(x + 2)(x - 3)(x + 3)\).`,
    },
    {
      id: "fact-6", topic: T.fact,
      q: R`Factor completely: \(x^4 - 81\)`,
      c: [M`(x^2 + 9)(x - 3)(x + 3)`, M`(x^2 - 9)(x^2 + 9)`, M`(x - 3)^2(x + 3)^2`, M`(x^2 + 9)(x - 3)^2`],
      e: R`\(x^4 - 81 = (x^2 - 9)(x^2 + 9)\). Then \(x^2 - 9 = (x - 3)(x + 3)\). A <i>sum</i> of squares \(x^2 + 9\) doesn't factor over the reals.`,
    },
    {
      id: "fact-7", topic: T.fact,
      q: R`Factor \((x + 1)^2 - 5(x + 1) + 6\).`,
      c: [M`(x - 1)(x - 2)`, M`(x - 2)(x - 3)`, M`(x + 3)(x + 4)`, M`(x + 1)(x - 5)`],
      e: R`Let \(u = x + 1\): \(u^2 - 5u + 6 = (u - 2)(u - 3)\). Substitute back: \((x + 1 - 2)(x + 1 - 3) = (x - 1)(x - 2)\). \((x - 2)(x - 3)\) is what you get if you forget to substitute back!`,
    },
    {
      id: "fact-8", topic: T.fact,
      q: R`Factor \(9x^2 - 30xy + 25y^2\).`,
      c: [M`(3x - 5y)^2`, M`(3x + 5y)^2`, M`(3x - 5y)(3x + 5y)`, M`(9x - 25y)(x - y)`],
      e: R`Perfect square trinomial: \((3x)^2 - 2(3x)(5y) + (5y)^2 = (3x - 5y)^2\).`,
    },
    {
      id: "fact-9", topic: T.fact,
      q: R`Factor completely: \((2x - 1)^2 - 9\)`,
      c: [M`4(x - 2)(x + 1)`, M`4(x + 2)(x - 1)`, M`(2x - 4)^2`, M`4(x - 2)(x - 1)`],
      e: R`Difference of squares with \(A = 2x - 1\), \(B = 3\): \((2x - 1 - 3)(2x - 1 + 3) = (2x - 4)(2x + 2)\). Pull out a 2 from each: \(4(x - 2)(x + 1)\).`,
    },
    {
      id: "fact-10", topic: T.fact,
      q: R`Factor \(4x^2 - 4xy - 15y^2\).`,
      c: [M`(2x - 5y)(2x + 3y)`, M`(2x + 5y)(2x - 3y)`, M`(4x - 5y)(x + 3y)`, M`(2x - 15y)(2x + y)`],
      e: R`\(a \cdot c = -60\); numbers that multiply to \(-60\) and add to \(-4\): \(-10\) and \(6\). \(4x^2 - 10xy + 6xy - 15y^2 = 2x(2x - 5y) + 3y(2x - 5y) = (2x - 5y)(2x + 3y)\).`,
    },
    {
      id: "fact-11", topic: T.fact,
      q: R`Which polynomial <b>cannot</b> be factored over the integers?`,
      c: [M`x^2 + 25`, M`x^2 - 25`, M`x^2 + 10x + 25`, M`4x^2 - 25`],
      e: R`\(x^2 - 25 = (x - 5)(x + 5)\), \(x^2 + 10x + 25 = (x + 5)^2\), \(4x^2 - 25 = (2x - 5)(2x + 5)\). A sum of squares like \(x^2 + 25\) has no real factors.`,
    },
    {
      id: "fact-12", topic: T.fact,
      q: R`Factor completely: \(12x^2 - 27\)`,
      c: [M`3(2x - 3)(2x + 3)`, M`3(4x^2 - 9)`, M`3(2x - 3)^2`, M`3(4x - 3)(x + 3)`],
      e: R`GCF of 3: \(3(4x^2 - 9)\). Then difference of squares: \(3(2x - 3)(2x + 3)\).`,
    },
    {
      id: "fact-13", topic: T.fact,
      q: R`Factor completely: \(3x^2 - 12x + 12\)`,
      c: [M`3(x - 2)^2`, M`3(x - 2)(x + 2)`, M`3(x^2 - 4x + 4)`, M`3(x + 2)^2`],
      e: R`GCF: \(3(x^2 - 4x + 4)\). The trinomial is a perfect square: \(3(x - 2)^2\).`,
    },
    {
      id: "fact-14", topic: T.fact,
      q: R`Simplify \(\dfrac{x^2 - 9}{x^2 + x - 6}\), where \(x \ne -3, 2\).`,
      c: [M`\dfrac{x - 3}{x - 2}`, M`\dfrac{x + 3}{x - 2}`, M`\dfrac{x - 3}{x + 2}`, M`\dfrac{-9}{x - 6}`],
      e: R`Factor both: \(\dfrac{(x - 3)(x + 3)}{(x + 3)(x - 2)}\). Cancel \((x + 3)\): \(\dfrac{x - 3}{x - 2}\). You can only cancel factors, never terms.`,
    },

    // ───────────── Applications ─────────────
    {
      id: "app-1", topic: T.app,
      q: R`A rectangle has side lengths \(3 + \sqrt{2}\) cm and \(3 - \sqrt{2}\) cm. What is its area?`,
      c: [M`7 \text{ cm}^2`, M`11 \text{ cm}^2`, M`9 - \sqrt{2} \text{ cm}^2`, M`6 \text{ cm}^2`],
      e: R`Area \(= (3 + \sqrt{2})(3 - \sqrt{2}) = 9 - 2 = 7\) cm². Conjugates make it rational!`,
    },
    {
      id: "app-2", topic: T.app,
      q: R`A square has an area of \(50\) m². What is its perimeter in simplest radical form?`,
      c: [M`20\sqrt{2} \text{ m}`, M`50 \text{ m}`, M`10\sqrt{2} \text{ m}`, M`4\sqrt{5} \text{ m}`],
      e: R`Side \(= \sqrt{50} = 5\sqrt{2}\) m. Perimeter \(= 4 \cdot 5\sqrt{2} = 20\sqrt{2}\) m.`,
    },
    {
      id: "app-3", topic: T.app,
      q: R`A right triangle has legs \(\sqrt{5}\) and \(\sqrt{11}\). What is the length of the hypotenuse?`,
      c: [M`4`, M`\sqrt{5} + \sqrt{11}`, M`16`, M`\sqrt{6}`],
      e: R`\(c^2 = (\sqrt{5})^2 + (\sqrt{11})^2 = 5 + 11 = 16\), so \(c = 4\). Note \(\sqrt{a + b} \ne \sqrt{a} + \sqrt{b}\).`,
    },
    {
      id: "geo-1", topic: T.app,
      q: R`A square has an area of \(98\text{ cm}^2\). What is its side length in simplest radical form?`,
      c: [M`7\sqrt{2}\text{ cm}`, M`49\text{ cm}`, M`2\sqrt{7}\text{ cm}`, M`49\sqrt{2}\text{ cm}`],
      e: R`Side \(= \sqrt{98} = \sqrt{49 \cdot 2} = 7\sqrt{2}\) cm.`,
    },
    {
      id: "geo-2", topic: T.app,
      q: R`A triangle has side lengths \(\sqrt{12}\), \(\sqrt{27}\) and \(\sqrt{75}\). What is its perimeter?`,
      c: [M`10\sqrt{3}`, M`\sqrt{114}`, M`9\sqrt{3}`, M`30\sqrt{3}`],
      e: R`Simplify each side first: \(2\sqrt{3} + 3\sqrt{3} + 5\sqrt{3} = 10\sqrt{3}\). You can't add the radicands (\(\sqrt{114}\) is a trap).`,
    },
    {
      id: "geo-3", topic: T.app,
      q: R`A rectangle is \(\sqrt{20}\) m long and \(\sqrt{5}\) m wide. What is its perimeter?`,
      c: [M`6\sqrt{5}\text{ m}`, M`10\text{ m}`, M`3\sqrt{5}\text{ m}`, M`4\sqrt{5}\text{ m}`],
      e: R`\(\sqrt{20} = 2\sqrt{5}\). Perimeter \(= 2(2\sqrt{5} + \sqrt{5}) = 2(3\sqrt{5}) = 6\sqrt{5}\) m. (10 m is the <i>area</i>: \(\sqrt{20}\cdot\sqrt{5} = \sqrt{100}\).)`,
    },
    {
      id: "geo-4", topic: T.app,
      q: R`A cube has a volume of \(54\text{ cm}^3\). What is its edge length in simplest radical form?`,
      c: [M`3\sqrt[3]{2}\text{ cm}`, M`3\sqrt{6}\text{ cm}`, M`18\text{ cm}`, M`2\sqrt[3]{3}\text{ cm}`],
      e: R`Edge \(= \sqrt[3]{54} = \sqrt[3]{27 \cdot 2} = 3\sqrt[3]{2}\) cm. Volume means a <i>cube</i> root, not a square root.`,
    },
    {
      id: "geo-5", topic: T.app,
      q: R`A rectangle has an area of \(24\sqrt{2}\) and a width of \(2\sqrt{6}\). What is its length?`,
      c: [M`4\sqrt{3}`, M`12\sqrt{3}`, M`6\sqrt{2}`, M`2\sqrt{3}`],
      e: R`Length \(= \dfrac{24\sqrt{2}}{2\sqrt{6}} = 12\sqrt{\dfrac{2}{6}} = \dfrac{12}{\sqrt{3}} = \dfrac{12\sqrt{3}}{3} = 4\sqrt{3}\). Check: \(4\sqrt{3}\cdot 2\sqrt{6} = 8\sqrt{18} = 24\sqrt{2}\) ✓.`,
    },
    {
      id: "geo-6", topic: T.app,
      q: R`What is the area of a rectangle with side lengths \(2\sqrt{3}\) and \(4\sqrt{6}\)?`,
      c: [M`24\sqrt{2}`, M`24\sqrt{3}`, M`24`, M`8\sqrt{6}`],
      e: R`\((2\sqrt{3})(4\sqrt{6}) = 8\sqrt{18} = 8 \cdot 3\sqrt{2} = 24\sqrt{2}\).`,
    },
    {
      id: "geo-7", topic: T.app,
      q: R`A circle has an area of \(18\pi\text{ cm}^2\). What is its radius in simplest radical form?`,
      c: [M`3\sqrt{2}\text{ cm}`, M`9\text{ cm}`, M`2\sqrt{3}\text{ cm}`, M`18\text{ cm}`],
      e: R`\(\pi r^2 = 18\pi \Rightarrow r^2 = 18 \Rightarrow r = \sqrt{18} = 3\sqrt{2}\) cm.`,
    },

    // ───────────── Number systems ─────────────
    {
      id: "sets-1", topic: T.sets,
      q: R`Which number sets does \(\sqrt[3]{-64}\) belong to?`,
      c: ["Integers, rational numbers and real numbers", "Natural, whole, integers, rational and real numbers", "Irrational and real numbers", "It is not a real number"],
      e: R`\(\sqrt[3]{-64} = -4\) (because \((-4)^3 = -64\)). It's negative, so it isn't natural or whole. It is an integer, so it's also rational (\(-\tfrac{4}{1}\)) and real — but not irrational.`,
    },
    {
      id: "sets-2", topic: T.sets,
      q: R`Which number sets does \(\sqrt{50}\) belong to?`,
      c: ["Irrational and real numbers", "Rational and real numbers", "Integers, rational and real numbers", "Natural, whole, integers, rational and real numbers"],
      e: R`50 is not a perfect square, so \(\sqrt{50} = 5\sqrt{2} \approx 7.0710678\ldots\) never terminates or repeats. That makes it irrational (and every irrational number is real).`,
    },
    {
      id: "sets-3", topic: T.sets,
      q: R`Which number is irrational?`,
      c: [M`\sqrt{12}`, M`\sqrt{49}`, M`\sqrt[3]{-27}`, M`0.\overline{3}`],
      e: R`\(\sqrt{49} = 7\), \(\sqrt[3]{-27} = -3\), and \(0.\overline{3} = \tfrac{1}{3}\) are all rational. \(\sqrt{12} = 2\sqrt{3}\) is not a perfect square root, so it's irrational.`,
    },
    {
      id: "sets-4", topic: T.sets,
      q: R`Which number sets does \(\sqrt{\dfrac{16}{25}}\) belong to?`,
      c: ["Rational and real numbers only", "Integers, rational and real numbers", "Irrational and real numbers", "Natural, whole, integers, rational and real numbers"],
      e: R`\(\sqrt{\tfrac{16}{25}} = \tfrac{4}{5} = 0.8\). It's a fraction of integers, so it's rational and real — but it isn't a whole number, so it's not an integer.`,
    },
    {
      id: "sets-5", topic: T.sets,
      q: R`Which statement is true?`,
      c: ["Every integer is a rational number", "Every rational number is an integer", "Every square root is irrational", "0 is a natural number"],
      e: R`Any integer \(n\) can be written as \(\tfrac{n}{1}\), so it's rational. But \(\tfrac{1}{2}\) is rational and not an integer; \(\sqrt{9} = 3\) is a rational square root; and natural numbers start at 1 (0 is whole, not natural).`,
    },
    {
      id: "sets-6", topic: T.sets,
      q: R`Which number sets does \(\sqrt[4]{16}\) belong to?`,
      c: ["Natural, whole, integers, rational and real numbers", "Integers, rational and real numbers only", "Irrational and real numbers", "Rational and real numbers only"],
      e: R`\(\sqrt[4]{16} = 2\) since \(2^4 = 16\). 2 is a natural number, so it belongs to every set that contains the naturals: whole, integers, rational and real.`,
    },
    {
      id: "sets-7", topic: T.sets,
      q: R`Which number is a whole number but <b>not</b> a natural number?`,
      c: [M`0`, M`1`, M`-1`, M`\sqrt{4}`],
      e: R`Natural numbers are \(1, 2, 3, \ldots\). Whole numbers are \(0, 1, 2, 3, \ldots\). The only whole number that isn't natural is 0.`,
    },
    {
      id: "sets-8", topic: T.sets,
      q: R`Which number sets does \(-\sqrt{9}\) belong to?`,
      c: ["Integers, rational numbers and real numbers", "Irrational and real numbers", "It is not a real number", "Natural, whole, integers, rational and real numbers"],
      e: R`\(-\sqrt{9} = -3\). The negative sign is <i>outside</i> the root, so it's real: a negative integer, which is also rational and real.`,
    },
    {
      id: "sets-9", topic: T.sets,
      q: R`Which of these is <b>not</b> a real number?`,
      c: [M`\sqrt{-16}`, M`\sqrt[3]{-16}`, M`-\sqrt{16}`, M`\sqrt{0.16}`],
      e: R`No real number squared gives \(-16\), so \(\sqrt{-16}\) is not real. But cube roots of negatives are real (\(\sqrt[3]{-16} = -2\sqrt[3]{2}\)), \(-\sqrt{16} = -4\), and \(\sqrt{0.16} = 0.4\).`,
    },

    // ───────────── Exponent laws ─────────────
    {
      id: "exp-1", topic: T.exp,
      q: R`Simplify \(\dfrac{x^{-3}y^{5}}{5^{-1}y^{-2}}\). Write with positive exponents.`,
      c: [M`\dfrac{5y^{7}}{x^{3}}`, M`\dfrac{y^{7}}{5x^{3}}`, M`\dfrac{5y^{3}}{x^{3}}`, M`\dfrac{y^{3}}{5x^{3}}`],
      e: R`A negative exponent moves a factor across the fraction bar: \(x^{-3}\) goes down as \(x^3\), \(5^{-1}\) comes up as \(5\). For \(y\): \(\dfrac{y^5}{y^{-2}} = y^{5-(-2)} = y^7\). Result: \(\dfrac{5y^7}{x^3}\).`,
    },
    {
      id: "exp-2", topic: T.exp,
      q: R`Simplify \((2a^{3}b^{-2})^{3}\). Write with positive exponents.`,
      c: [M`\dfrac{8a^{9}}{b^{6}}`, M`\dfrac{6a^{9}}{b^{6}}`, M`\dfrac{2a^{9}}{b^{6}}`, M`\dfrac{8a^{6}}{b^{5}}`],
      e: R`Raise every factor to the 3rd power: \(2^3 = 8\), \((a^3)^3 = a^9\), \((b^{-2})^3 = b^{-6} = \tfrac{1}{b^6}\). So \(\dfrac{8a^9}{b^6}\).`,
    },
    {
      id: "exp-3", topic: T.exp,
      q: R`Evaluate \(16^{\frac{3}{4}}\).`,
      c: [M`8`, M`12`, M`6`, M`64`],
      e: R`The denominator is the root, the numerator is the power: \(16^{3/4} = \left(\sqrt[4]{16}\right)^3 = 2^3 = 8\).`,
    },
    {
      id: "exp-4", topic: T.exp,
      q: R`Evaluate \(27^{-\frac{2}{3}}\).`,
      c: [M`\dfrac{1}{9}`, M`-9`, M`9`, M`-\dfrac{1}{9}`],
      e: R`\(27^{-2/3} = \dfrac{1}{27^{2/3}} = \dfrac{1}{\left(\sqrt[3]{27}\right)^2} = \dfrac{1}{3^2} = \dfrac{1}{9}\). A negative exponent makes a reciprocal — never a negative number.`,
    },
    {
      id: "exp-5", topic: T.exp,
      q: R`Which radical is equal to \(x^{\frac{2}{3}}\)?`,
      c: [M`\sqrt[3]{x^{2}}`, M`\sqrt{x^{3}}`, M`\sqrt[3]{2x}`, M`\dfrac{1}{\sqrt[3]{x^{2}}}`],
      e: R`\(x^{m/n} = \sqrt[n]{x^m}\): the denominator 3 is the index, the numerator 2 is the power. So \(x^{2/3} = \sqrt[3]{x^2}\).`,
    },
    {
      id: "exp-6", topic: T.exp,
      q: R`Simplify \((3x^{-2})^{-2}\). Write with positive exponents.`,
      c: [M`\dfrac{x^{4}}{9}`, M`9x^{4}`, M`\dfrac{1}{9x^{4}}`, M`\dfrac{x^{4}}{6}`],
      e: R`\(3^{-2} = \tfrac{1}{9}\) and \((x^{-2})^{-2} = x^{4}\). So \(\dfrac{x^4}{9}\).`,
    },
    {
      id: "exp-7", topic: T.exp,
      q: R`Write \(\sqrt{x} \cdot \sqrt[3]{x}\) as a single power of \(x\).`,
      c: [M`x^{\frac{5}{6}}`, M`x^{\frac{1}{6}}`, M`x^{\frac{1}{5}}`, M`x^{\frac{2}{5}}`],
      e: R`\(\sqrt{x}\cdot\sqrt[3]{x} = x^{1/2}\cdot x^{1/3} = x^{1/2 + 1/3} = x^{5/6}\). Same base → add the exponents.`,
    },
    {
      id: "exp-8", topic: T.exp,
      q: R`Simplify \(\dfrac{12a^{5}b^{-1}}{4a^{2}b^{3}}\). Write with positive exponents.`,
      c: [M`\dfrac{3a^{3}}{b^{4}}`, M`3a^{3}b^{2}`, M`\dfrac{8a^{3}}{b^{4}}`, M`\dfrac{3a^{7}}{b^{2}}`],
      e: R`Divide the coefficients (\(12 \div 4 = 3\)) and subtract exponents: \(a^{5-2} = a^3\), \(b^{-1-3} = b^{-4} = \tfrac{1}{b^4}\). Result: \(\dfrac{3a^3}{b^4}\).`,
    },
    {
      id: "exp-9", topic: T.exp,
      q: R`Evaluate \(5^{0} + 4^{-\frac{1}{2}}\).`,
      c: [M`\dfrac{3}{2}`, M`\dfrac{1}{2}`, M`-1`, M`3`],
      e: R`\(5^0 = 1\) (anything non-zero to the power 0 is 1). \(4^{-1/2} = \dfrac{1}{\sqrt{4}} = \dfrac{1}{2}\). Total: \(1 + \tfrac{1}{2} = \tfrac{3}{2}\).`,
    },

    // ───────────── Find the mistake ─────────────
    {
      id: "err-1", topic: T.err,
      q: R`A student simplified this: <div class="work"><span class="ln">Line 1</span>\(\sqrt{9 + 16} = \sqrt{9} + \sqrt{16}\)<span class="ln">Line 2</span>\(= 3 + 4\)<span class="ln">Line 3</span>\(= 7\)</div>What is the mistake?`,
      c: [
        R`Line 1: \(\sqrt{a + b} \ne \sqrt{a} + \sqrt{b}\). The answer is \(\sqrt{25} = 5\).`,
        R`Line 2: \(\sqrt{9}\) should be \(\pm 3\).`,
        R`Line 3: \(3 + 4\) should be 12.`,
        "There is no mistake.",
      ],
      e: R`A root doesn't split over addition. Add first: \(\sqrt{9 + 16} = \sqrt{25} = 5\). (It <i>does</i> split over multiplication: \(\sqrt{9 \cdot 16} = \sqrt{9}\cdot\sqrt{16}\).)`,
    },
    {
      id: "err-2", topic: T.err,
      q: R`A student simplified \(\sqrt{72}\): <div class="work"><span class="ln">Line 1</span>\(\sqrt{72} = \sqrt{9 \cdot 8}\)<span class="ln">Line 2</span>\(= 3\sqrt{8}\)</div>The teacher marked it "not simplest form." Why?`,
      c: [
        R`8 still has a perfect-square factor. Using 36 instead gives \(6\sqrt{2}\).`,
        R`\(\sqrt{9 \cdot 8}\) should be \(9\sqrt{8}\).`,
        R`\(\sqrt{72}\) was already in simplest form.`,
        R`It should be \(3\sqrt{8} = \sqrt{24}\).`,
      ],
      e: R`\(3\sqrt{8} = 3\cdot 2\sqrt{2} = 6\sqrt{2}\). Always pull out the <i>largest</i> perfect square (36), or keep simplifying until the radicand has no square factors.`,
    },
    {
      id: "err-3", topic: T.err,
      q: R`A student started rationalizing: <div class="work"><span class="ln">Line 1</span>\(\dfrac{4}{3 - \sqrt{5}} \cdot \dfrac{3 - \sqrt{5}}{3 - \sqrt{5}}\)<span class="ln">Line 2</span>\(= \dfrac{4(3 - \sqrt{5})}{9 - 6\sqrt{5} + 5}\)</div>What is the mistake?`,
      c: [
        R`Line 1: they should multiply by the conjugate \(\dfrac{3 + \sqrt{5}}{3 + \sqrt{5}}\).`,
        R`Line 2: \(9 - 6\sqrt{5} + 5\) should be \(9 - 5\).`,
        R`Line 1: they should multiply by \(\dfrac{\sqrt{5}}{\sqrt{5}}\).`,
        "There is no mistake — this is the right method.",
      ],
      e: R`Multiplying by the same binomial squares it, so the radical stays (\(14 - 6\sqrt{5}\)). The conjugate \(3 + \sqrt{5}\) makes a difference of squares: \(9 - 5 = 4\), giving \(3 + \sqrt{5}\).`,
    },
    {
      id: "err-4", topic: T.err,
      q: R`A student solved \(\sqrt{x + 7} = x + 1\): <div class="work"><span class="ln">Line 1</span>\(x + 7 = x^2 + 2x + 1\)<span class="ln">Line 2</span>\(x^2 + x - 6 = 0\)<span class="ln">Line 3</span>\((x + 3)(x - 2) = 0\)<span class="ln">Line 4</span>\(x = -3 \text{ or } x = 2\)</div>What is the mistake?`,
      c: [
        R`They didn't check: \(x = -3\) is extraneous, so the only solution is \(x = 2\).`,
        R`Line 1 should be \(x + 7 = x^2 + 1\).`,
        R`Line 3 should be \((x - 3)(x + 2) = 0\).`,
        "There is no mistake — both answers work.",
      ],
      e: R`The algebra is right, but squaring can create fake roots. Check: \(x = 2\): \(\sqrt{9} = 3 = 2 + 1\) ✓. \(x = -3\): \(\sqrt{4} = 2\) but \(-3 + 1 = -2\) ✗.`,
    },
    {
      id: "err-5", topic: T.err,
      q: R`A student simplified \((2\sqrt{3})^2\): <div class="work"><span class="ln">Line 1</span>\((2\sqrt{3})^2 = 2 \cdot 3\)<span class="ln">Line 2</span>\(= 6\)</div>What is the mistake?`,
      c: [
        R`Line 1: the 2 must be squared too: \(4 \cdot 3 = 12\).`,
        R`Line 1: it should be \(4\sqrt{3}\).`,
        R`Line 1: it should be \(2 \cdot 9 = 18\).`,
        "There is no mistake.",
      ],
      e: R`\((2\sqrt{3})^2 = 2^2 \cdot (\sqrt{3})^2 = 4 \cdot 3 = 12\). Squaring applies to every factor inside the brackets.`,
    },
    {
      id: "err-6", topic: T.err,
      q: R`A student wrote: <div class="work">\(2\sqrt{3} + 3\sqrt{2} = 5\sqrt{5}\)</div>What is the mistake?`,
      c: [
        R`\(\sqrt{3}\) and \(\sqrt{2}\) are unlike radicals, so they can't be combined. \(2\sqrt{3} + 3\sqrt{2}\) is already simplest.`,
        R`It should be \(5\sqrt{6}\).`,
        R`It should be \(6\sqrt{5}\).`,
        R`It should be \(6\sqrt{6}\).`,
      ],
      e: R`You can only add radicals with the same index and radicand (like terms), e.g. \(2\sqrt{3} + 4\sqrt{3} = 6\sqrt{3}\). Here the radicands differ, so nothing combines.`,
    },
    {
      id: "err-7", topic: T.err,
      q: R`A student started solving \(\sqrt{x + 3} + 2 = x\): <div class="work"><span class="ln">Line 1</span>\((x + 3) + 4 = x^2\)</div>What is the mistake?`,
      c: [
        R`They didn't isolate the radical first. \((a + b)^2 \ne a^2 + b^2\) — subtract 2 before squaring.`,
        R`\(x + 3\) should become \(\sqrt{x} + \sqrt{3}\).`,
        R`The 4 should be 2.`,
        "There is no mistake.",
      ],
      e: R`Squaring the left side properly gives \((\sqrt{x+3} + 2)^2 = x + 3 + 4\sqrt{x+3} + 4\) — the radical is still there. Isolate first: \(\sqrt{x + 3} = x - 2\), then square.`,
    },
    {
      id: "err-8", topic: T.err,
      q: R`A student simplified \(3x^{-2}\): <div class="work"><span class="ln">Line 1</span>\(3x^{-2} = -3x^{2}\)</div>What is the mistake?`,
      c: [
        R`A negative exponent means reciprocal, not negative: \(3x^{-2} = \dfrac{3}{x^2}\).`,
        R`It should be \(\dfrac{1}{3x^2}\).`,
        R`It should be \(-9x^2\).`,
        "There is no mistake.",
      ],
      e: R`\(x^{-2} = \dfrac{1}{x^2}\), and the exponent only applies to \(x\), not the 3. So \(3x^{-2} = \dfrac{3}{x^2}\).`,
    },
    {
      id: "err-9", topic: T.err,
      q: R`Two students simplified \(\sqrt{48}\) differently: <div class="work"><span class="ln">Ana</span>\(\sqrt{16 \cdot 3} = 4\sqrt{3}\)<span class="ln">Ben</span>\(\sqrt{4 \cdot 12} = 2\sqrt{12} = 2 \cdot 2\sqrt{3} = 4\sqrt{3}\)</div>Which statement is true?`,
      c: [
        "Both are correct — Ben just took an extra step",
        "Only Ana is correct",
        "Only Ben is correct",
        R`Both are wrong — the answer is \(2\sqrt{12}\)`,
      ],
      e: R`There's more than one path to simplest form. Using the largest perfect square (16) is fastest, but Ben kept simplifying until no square factor was left, so he reached the same \(4\sqrt{3}\).`,
    },

    // ───────────── Multiple ways ─────────────
    {
      id: "ways-1", topic: T.simp,
      q: R`Which expression is <b>not</b> equal to \(6\sqrt{2}\)?`,
      c: [M`4\sqrt{3}`, M`\sqrt{72}`, M`3\sqrt{8}`, M`2\sqrt{18}`],
      e: R`Convert to entire radicals: \(6\sqrt{2} = \sqrt{72}\), \(3\sqrt{8} = \sqrt{72}\), \(2\sqrt{18} = \sqrt{72}\). But \(4\sqrt{3} = \sqrt{48}\).`,
    },
    {
      id: "ways-2", topic: T.mult,
      q: R`Which is equal to \(\sqrt{12} \cdot \sqrt{6}\)?`,
      c: [M`6\sqrt{2}`, M`3\sqrt{2}`, M`18`, M`2\sqrt{3}`],
      e: R`Two ways: \(\sqrt{72} = 6\sqrt{2}\), or simplify first: \(2\sqrt{3}\cdot\sqrt{6} = 2\sqrt{18} = 2\cdot 3\sqrt{2} = 6\sqrt{2}\).`,
    },
    {
      id: "ways-3", topic: T.simp,
      q: R`Which shows a <b>correct</b> way to simplify \(\sqrt{200}\)?`,
      c: [
        M`\sqrt{100 \cdot 2} = 10\sqrt{2}`,
        M`\sqrt{25 \cdot 8} = 5\sqrt{8} = 10\sqrt{4}`,
        M`\sqrt{4 \cdot 50} = 2\sqrt{50} = 2 \cdot 25\sqrt{2}`,
        M`\sqrt{200} = 100\sqrt{2}`,
      ],
      e: R`\(\sqrt{100\cdot 2} = 10\sqrt{2}\). The others go wrong: \(5\sqrt{8} = 5\cdot 2\sqrt{2}\) (not \(10\sqrt{4}\)); \(\sqrt{50} = 5\sqrt{2}\) (not \(25\sqrt{2}\)); and you take the root of 100, not 100 itself.`,
    },
  ];
})();
