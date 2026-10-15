/*
 * CONCEPTS — the shared taxonomy behind the Concept Library, the Learning Analyst and the Tutor.
 *
 *   Course → Unit → Concept (stable id, e.g. "radicals.rationalize")
 *
 * Every question in every bank is tagged to concepts by conceptsFor(question, partKey).
 * Lessons are written for Campfire Prep and are NOT teacher-reviewed (see `source`/`reviewed`).
 * New courses can be added to COURSES without changing the rest of the app.
 */
(function (root) {
  "use strict";
  const R = String.raw;
  const SOURCE = "Written for Campfire Prep. Not yet reviewed by a teacher.";

  const UNITS = [
    { id: "numbers", title: "Number Systems" },
    { id: "exponents", title: "Exponents" },
    { id: "radicals", title: "Radicals" },
    { id: "factoring", title: "Factoring" },
  ];

  const C = (o) => ({ difficulty: 1, prereqs: [], related: [], source: SOURCE, reviewed: false, version: 1, ...o });

  const CONCEPTS = [
    // ─────────────── Number systems ───────────────
    C({
      id: "numbers.sets", unit: "numbers", title: "Classifying real numbers",
      summary: "Sort a number into natural, whole, integer, rational, irrational and real.",
      keywords: ["natural number", "whole number", "integer", "rational number", "irrational", "real number", "number system", "classify", "terminating", "repeating decimal"],
      explanation: [
        R`The real numbers split into two families. <b>Rational</b> numbers can be written as a fraction of integers \(\tfrac{a}{b}\) (with \(b \ne 0\)); their decimals end or repeat. <b>Irrational</b> numbers can't; their decimals go on forever without repeating, like \(\pi\) or \(\sqrt{2}\).`,
        R`Inside the rationals there's a chain: <b>natural</b> \(\{1, 2, 3, \ldots\}\) ⊂ <b>whole</b> \(\{0, 1, 2, \ldots\}\) ⊂ <b>integers</b> \(\{\ldots, -1, 0, 1, \ldots\}\) ⊂ <b>rational</b> ⊂ <b>real</b>. A number belongs to every set above the smallest one it fits in.`,
        R`Always <b>simplify first</b>. \(\sqrt[3]{-64}\) looks complicated, but it's \(-4\), an integer.`,
      ],
      intuition: "Think of nested boxes: once a number fits in a small box (like the integers), it automatically sits inside all the bigger boxes too.",
      rules: [
        { name: "Rational", tex: R`\dfrac{a}{b},\ a, b \in \mathbb{Z},\ b \ne 0` },
        { name: "Chain", tex: R`\mathbb{N} \subset \mathbb{W} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R}` },
        { name: "Square roots", tex: R`\sqrt{n} \text{ is rational only when } n \text{ is a perfect square}` },
      ],
      examples: [
        { title: "Classify \\(\\sqrt[3]{-64}\\)", steps: [R`Simplify: \((-4)^3 = -64\), so \(\sqrt[3]{-64} = -4\).`, R`\(-4\) is negative, so it's not natural or whole.`, R`It is an integer, so it is also rational (\(-\tfrac{4}{1}\)) and real.`], answer: "Integers, rational numbers, real numbers" },
        { title: "Classify \\(\\sqrt{\\tfrac{16}{25}}\\) and \\(\\sqrt{50}\\)", steps: [R`\(\sqrt{\tfrac{16}{25}} = \tfrac{4}{5} = 0.8\): a fraction of integers, so rational and real, but not an integer.`, R`50 is not a perfect square, so \(\sqrt{50} = 5\sqrt{2}\) is irrational (and real).`], answer: "4/5 is rational; √50 is irrational" },
      ],
      mistakes: [
        { wrong: "Calling 0 a natural number.", fix: "Natural numbers start at 1. Zero is the first whole number." },
        { wrong: "Thinking every square root is irrational.", fix: "√9 = 3 and √0.16 = 0.4 are rational. Only non-perfect squares give irrational roots." },
        { wrong: "Saying √(−16) is irrational.", fix: "It isn't a real number at all. No real number squared is negative." },
      ],
      related: ["radicals.simplify"],
    }),

    // ─────────────── Exponents ───────────────
    C({
      id: "exponents.laws", unit: "exponents", title: "Exponent laws",
      summary: "Multiply, divide and raise powers with the product, quotient, power and zero laws.",
      keywords: ["exponent law", "product law", "quotient law", "power law", "power of a power", "zero exponent", "simplify powers", "same base"],
      explanation: [
        R`When the <b>bases match</b>, exponents follow simple rules: multiplying adds exponents, dividing subtracts them, and raising a power to a power multiplies them.`,
        R`A power of a product spreads to every factor: \((2a^3)^3 = 2^3a^9 = 8a^9\). Coefficients get raised too — that's where most slips happen.`,
        R`Anything non-zero to the power 0 is 1, because \(\tfrac{x^n}{x^n} = x^{n-n} = x^0\) and also equals 1.`,
      ],
      intuition: "An exponent counts how many copies of the base are multiplied. Laws are just shortcuts for counting copies.",
      rules: [
        { name: "Product", tex: R`x^m \cdot x^n = x^{m+n}` },
        { name: "Quotient", tex: R`\dfrac{x^m}{x^n} = x^{m-n}` },
        { name: "Power of a power", tex: R`(x^m)^n = x^{mn}` },
        { name: "Power of a product", tex: R`(xy)^n = x^ny^n` },
        { name: "Zero exponent", tex: R`x^0 = 1\ (x \ne 0)` },
      ],
      examples: [
        { title: "Simplify \\((2a^3b^{-2})^3\\)", steps: [R`Raise every factor to the 3rd power: \(2^3 = 8\), \((a^3)^3 = a^9\), \((b^{-2})^3 = b^{-6}\).`, R`Write with positive exponents: \(b^{-6} = \tfrac{1}{b^6}\).`], answer: R`\(\dfrac{8a^9}{b^6}\)` },
        { title: "Simplify \\(\\dfrac{12a^5b^{-1}}{4a^2b^3}\\)", steps: [R`Coefficients: \(12 \div 4 = 3\).`, R`\(a^{5-2} = a^3\) and \(b^{-1-3} = b^{-4} = \tfrac{1}{b^4}\).`], answer: R`\(\dfrac{3a^3}{b^4}\)` },
      ],
      mistakes: [
        { wrong: "(2a³)³ = 2a⁹", fix: "The 2 is cubed too: 8a⁹." },
        { wrong: "x³ · x⁴ = x¹²", fix: "Multiplying powers adds exponents: x⁷." },
        { wrong: "12 ÷ 4 written as 12 − 4 when dividing coefficients.", fix: "Exponents subtract; coefficients divide." },
      ],
      related: ["exponents.negative", "exponents.rational"],
    }),
    C({
      id: "exponents.negative", unit: "exponents", title: "Negative exponents",
      summary: "A negative exponent means reciprocal, never a negative number.",
      keywords: ["negative exponent", "reciprocal", "positive exponents", "x^-"],
      explanation: [
        R`\(x^{-n} = \dfrac{1}{x^n}\). A negative exponent flips the factor to the other side of the fraction bar; the sign of the number doesn't change.`,
        R`It only applies to the base it's attached to: in \(3x^{-2}\), only \(x\) moves, giving \(\tfrac{3}{x^2}\).`,
        R`A factor with a negative exponent in the <i>denominator</i> moves up: \(\dfrac{1}{5^{-1}} = 5\).`,
      ],
      intuition: "Each step down in the exponent divides by the base once more: 2² = 4, 2¹ = 2, 2⁰ = 1, 2⁻¹ = ½, 2⁻² = ¼.",
      rules: [
        { name: "Definition", tex: R`x^{-n} = \dfrac{1}{x^n}` },
        { name: "Moving across", tex: R`\dfrac{1}{x^{-n}} = x^n` },
        { name: "Fractions", tex: R`\left(\dfrac{a}{b}\right)^{-n} = \left(\dfrac{b}{a}\right)^{n}` },
      ],
      examples: [
        { title: "Simplify \\(\\dfrac{x^{-3}y^{5}}{5^{-1}y^{-2}}\\)", steps: [R`\(x^{-3}\) moves down as \(x^3\); \(5^{-1}\) moves up as \(5\).`, R`For \(y\): \(\dfrac{y^5}{y^{-2}} = y^{5-(-2)} = y^7\).`], answer: R`\(\dfrac{5y^7}{x^3}\)` },
        { title: "Simplify \\((3x^{-2})^{-2}\\)", steps: [R`\(3^{-2} = \tfrac{1}{9}\).`, R`\((x^{-2})^{-2} = x^{4}\).`], answer: R`\(\dfrac{x^4}{9}\)` },
      ],
      mistakes: [
        { wrong: "3x⁻² = −3x²", fix: "Negative exponent means reciprocal: 3/x²." },
        { wrong: "3x⁻² = 1/(3x²)", fix: "The exponent belongs only to x, so the 3 stays on top." },
        { wrong: "27^(−2/3) = −9", fix: "Take the reciprocal: 1/27^(2/3) = 1/9." },
      ],
      prereqs: ["exponents.laws"], related: ["exponents.rational"],
    }),
    C({
      id: "exponents.rational", unit: "exponents", title: "Rational exponents",
      summary: "Read a fractional exponent as a root (denominator) and a power (numerator).",
      keywords: ["rational exponent", "fractional exponent", "x^(1/2)", "x^(2/3)", "root and power", "16^(3/4)"],
      explanation: [
        R`\(x^{\frac{m}{n}} = \left(\sqrt[n]{x}\right)^m = \sqrt[n]{x^m}\). The <b>denominator is the root</b>, the <b>numerator is the power</b>.`,
        R`Take the root first when evaluating; the numbers stay small: \(16^{3/4} = (\sqrt[4]{16})^3 = 2^3 = 8\).`,
        R`All the exponent laws still work, so \(\sqrt{x}\cdot\sqrt[3]{x} = x^{1/2}\cdot x^{1/3} = x^{5/6}\).`,
        R`Careful with even powers: \(x^{2/3} = 9\) means \((\sqrt[3]{x})^2 = 9\), so \(\sqrt[3]{x} = \pm 3\) and \(x = \pm 27\).`,
      ],
      intuition: "x^(1/2) has to be √x, because (x^(1/2))² = x¹ = x by the power law.",
      rules: [
        { name: "Unit fraction", tex: R`x^{\frac{1}{n}} = \sqrt[n]{x}` },
        { name: "General", tex: R`x^{\frac{m}{n}} = \left(\sqrt[n]{x}\right)^m` },
        { name: "Negative + rational", tex: R`x^{-\frac{m}{n}} = \dfrac{1}{x^{m/n}}` },
      ],
      examples: [
        { title: "Evaluate \\(27^{-\\frac{2}{3}}\\)", steps: [R`Negative exponent → reciprocal: \(\dfrac{1}{27^{2/3}}\).`, R`\(27^{2/3} = (\sqrt[3]{27})^2 = 3^2 = 9\).`], answer: R`\(\tfrac{1}{9}\)` },
        { title: "Write \\(\\sqrt{x}\\cdot\\sqrt[3]{x}\\) as one power", steps: [R`\(x^{1/2}\cdot x^{1/3}\).`, R`Add exponents: \(\tfrac{1}{2} + \tfrac{1}{3} = \tfrac{5}{6}\).`], answer: R`\(x^{5/6}\)` },
      ],
      mistakes: [
        { wrong: "16^(3/4) = 16 · 3/4 = 12", fix: "It's a root and a power, not multiplication: 8." },
        { wrong: "x^(2/3) = √(x³)", fix: "The denominator (3) is the index: ∛(x²)." },
        { wrong: "Solving x^(2/3) = 9 and giving only x = 27.", fix: "The square hides a negative: x = 27 or −27." },
      ],
      prereqs: ["exponents.laws", "radicals.simplify"], related: ["exponents.negative"], difficulty: 2,
    }),

    // ─────────────── Radicals ───────────────
    C({
      id: "radicals.simplify", unit: "radicals", title: "Simplifying radicals",
      summary: "Pull the largest perfect square (or cube) out from under the root.",
      keywords: ["simplify radical", "simplest radical form", "perfect square", "perfect cube", "largest perfect square factor", "radicand", "square root", "cube root", "simplest form"],
      explanation: [
        R`A radical is in simplest form when the radicand has <b>no perfect-square factors</b> (for \(\sqrt{\ }\)) or <b>no perfect-cube factors</b> (for \(\sqrt[3]{\ }\)), and no fractions sit under the root.`,
        R`Use \(\sqrt{ab} = \sqrt{a}\sqrt{b}\): split the radicand into (largest perfect square) × (what's left), then take the root of the perfect square.`,
        R`If you don't spot the largest square straight away, keep simplifying: \(\sqrt{72} = 3\sqrt{8} = 3 \cdot 2\sqrt{2} = 6\sqrt{2}\).`,
        R`For even roots of a variable squared, \(\sqrt{x^2} = |x|\), because a principal square root is never negative.`,
      ],
      intuition: "Perfect squares are the parts that 'escape' the square root. Everything else has to stay inside.",
      rules: [
        { name: "Product rule", tex: R`\sqrt{ab} = \sqrt{a}\,\sqrt{b}\quad (a, b \ge 0)` },
        { name: "Cube roots", tex: R`\sqrt[3]{ab} = \sqrt[3]{a}\,\sqrt[3]{b}` },
        { name: "Absolute value", tex: R`\sqrt{x^2} = |x|` },
      ],
      examples: [
        { title: "Simplify \\(\\sqrt{72}\\)", steps: [R`Largest perfect square factor of 72 is 36: \(72 = 36 \cdot 2\).`, R`\(\sqrt{36 \cdot 2} = \sqrt{36}\sqrt{2} = 6\sqrt{2}\).`], answer: R`\(6\sqrt{2}\)` },
        { title: "Simplify \\(\\sqrt[3]{-54}\\) and \\(\\sqrt{48x^5y^2}\\) (x, y ≥ 0)", steps: [R`\(-54 = -27 \cdot 2\), and \(\sqrt[3]{-27} = -3\), so \(\sqrt[3]{-54} = -3\sqrt[3]{2}\).`, R`\(48x^5y^2 = (16x^4y^2)(3x)\), so \(\sqrt{48x^5y^2} = 4x^2y\sqrt{3x}\).`], answer: R`\(-3\sqrt[3]{2}\) and \(4x^2y\sqrt{3x}\)` },
      ],
      mistakes: [
        { wrong: "√(9 + 16) = √9 + √16 = 7", fix: "Roots split over multiplication, not addition: √25 = 5." },
        { wrong: "Stopping at 3√8.", fix: "8 still has the square factor 4: 3√8 = 6√2." },
        { wrong: "Using a perfect square for a cube root (−54 = 9 · −6).", fix: "Cube roots need perfect cubes: 8, 27, 64, 125…" },
      ],
      related: ["radicals.mixed_entire", "radicals.add_subtract", "numbers.sets"],
    }),
    C({
      id: "radicals.mixed_entire", unit: "radicals", title: "Mixed and entire radicals",
      summary: "Convert between forms like 5√3 (mixed) and √75 (entire), and use them to compare radicals.",
      keywords: ["mixed radical", "entire radical", "convert", "compare radicals", "order radicals", "coefficient"],
      explanation: [
        R`A <b>mixed radical</b> has a coefficient outside the root (\(5\sqrt{3}\)). An <b>entire radical</b> has everything inside (\(\sqrt{75}\)).`,
        R`<b>Mixed → entire:</b> raise the coefficient to the index and multiply it in. \(5\sqrt{3} = \sqrt{5^2 \cdot 3} = \sqrt{75}\); for cube roots, cube it: \(-2\sqrt[3]{5} = \sqrt[3]{-8 \cdot 5} = \sqrt[3]{-40}\).`,
        R`<b>Entire → mixed:</b> that's just simplifying: \(\sqrt{98} = 7\sqrt{2}\).`,
        R`To <b>order</b> radicals, convert them all to entire radicals and compare the radicands: \(2\sqrt{11} = \sqrt{44} < 3\sqrt{5} = \sqrt{45}\).`,
      ],
      intuition: "Moving a number inside a square root means it has to 'pay' by being squared first.",
      rules: [
        { name: "Square roots", tex: R`a\sqrt{b} = \sqrt{a^2 b}\quad (a \ge 0)` },
        { name: "Cube roots", tex: R`a\sqrt[3]{b} = \sqrt[3]{a^3 b}` },
        { name: "Even index, negative coefficient", tex: R`-3\sqrt[4]{2} = -\sqrt[4]{162}\ \text{(the sign stays outside)}` },
      ],
      examples: [
        { title: "Write \\(4\\sqrt{3}\\) as an entire radical", steps: [R`Square the coefficient: \(4^2 = 16\).`, R`\(\sqrt{16 \cdot 3} = \sqrt{48}\).`], answer: R`\(\sqrt{48}\)` },
        { title: "Order \\(3\\sqrt{5},\\ 4\\sqrt{3},\\ 2\\sqrt{11},\\ 5\\sqrt{2}\\)", steps: [R`Entire forms: \(\sqrt{45},\ \sqrt{48},\ \sqrt{44},\ \sqrt{50}\).`, R`Compare radicands: \(44 < 45 < 48 < 50\).`], answer: R`\(2\sqrt{11},\ 3\sqrt{5},\ 4\sqrt{3},\ 5\sqrt{2}\)` },
      ],
      mistakes: [
        { wrong: "4√3 = √12", fix: "Square the 4 before moving it in: √48." },
        { wrong: "−2∛5 = ∛(−10)", fix: "Cube the coefficient: (−2)³ = −8, so ∛(−40)." },
        { wrong: "Writing an entire radical as 5√3 'because it's simpler'.", fix: "If the question says entire, nothing may sit outside the root." },
      ],
      prereqs: ["radicals.simplify"], related: ["radicals.add_subtract"],
    }),
    C({
      id: "radicals.add_subtract", unit: "radicals", title: "Adding and subtracting radicals",
      summary: "Simplify first, then combine only like radicals (same index, same radicand).",
      keywords: ["like radicals", "add radicals", "subtract radicals", "combine radicals", "collect like terms"],
      explanation: [
        R`Like radicals have the <b>same index and the same radicand</b>. You combine them the way you combine like terms: \(4\sqrt{3} + 9\sqrt{3} = 13\sqrt{3}\).`,
        R`Radicals that look different may become alike after simplifying, so <b>always simplify every radical first</b>: \(2\sqrt{12} + 3\sqrt{27} = 4\sqrt{3} + 9\sqrt{3}\).`,
        R`Unlike radicals (\(2\sqrt{3} + 3\sqrt{2}\)) can't be combined. That expression is already simplest.`,
      ],
      intuition: "√3 behaves like a unit, like 'apples'. 4 apples + 9 apples = 13 apples, but apples + oranges stay separate.",
      rules: [
        { name: "Combine coefficients", tex: R`a\sqrt{n} + b\sqrt{n} = (a + b)\sqrt{n}` },
        { name: "Not allowed", tex: R`\sqrt{a} + \sqrt{b} \ne \sqrt{a + b}` },
      ],
      examples: [
        { title: "Simplify \\(2\\sqrt{12} + 3\\sqrt{27} - \\sqrt{75}\\)", steps: [R`\(2\sqrt{12} = 4\sqrt{3}\), \(3\sqrt{27} = 9\sqrt{3}\), \(\sqrt{75} = 5\sqrt{3}\).`, R`\(4\sqrt{3} + 9\sqrt{3} - 5\sqrt{3} = 8\sqrt{3}\).`], answer: R`\(8\sqrt{3}\)` },
        { title: "Simplify \\(2\\sqrt[3]{16} + \\sqrt[3]{54}\\)", steps: [R`\(2\sqrt[3]{16} = 2\cdot 2\sqrt[3]{2} = 4\sqrt[3]{2}\).`, R`\(\sqrt[3]{54} = 3\sqrt[3]{2}\). Total \(7\sqrt[3]{2}\).`], answer: R`\(7\sqrt[3]{2}\)` },
      ],
      mistakes: [
        { wrong: "2√3 + 3√2 = 5√5", fix: "Unlike radicals don't combine. Leave it as is." },
        { wrong: "5√8 − 3√18 = 2√−10", fix: "Never subtract radicands. Simplify each: 10√2 − 9√2 = √2." },
      ],
      prereqs: ["radicals.simplify"], related: ["radicals.multiply"],
    }),
    C({
      id: "radicals.multiply", unit: "radicals", title: "Multiplying radicals",
      summary: "Multiply coefficients with coefficients and radicands with radicands, then simplify.",
      keywords: ["multiply radicals", "product of radicals", "distribute", "foil", "expand", "binomial radical", "square a binomial"],
      explanation: [
        R`\((a\sqrt{m})(b\sqrt{n}) = ab\sqrt{mn}\) for radicals with the same index. Then simplify the result.`,
        R`With brackets, distribute or FOIL exactly as in algebra, and simplify each product: \(\sqrt{3}(4\sqrt{6} - 2\sqrt{3}) = 4\sqrt{18} - 2\sqrt{9} = 12\sqrt{2} - 6\).`,
        R`Squaring a binomial has a middle term: \((a - b)^2 = a^2 - 2ab + b^2\). And remember \((\sqrt{n})^2 = n\).`,
      ],
      intuition: "Multiplying is the friendly operation for radicals: unlike adding, any two square roots can be multiplied together.",
      rules: [
        { name: "Product", tex: R`a\sqrt{m}\cdot b\sqrt{n} = ab\sqrt{mn}` },
        { name: "Square", tex: R`(a\sqrt{n})^2 = a^2 n` },
        { name: "Binomial square", tex: R`(a - b)^2 = a^2 - 2ab + b^2` },
      ],
      examples: [
        { title: "Simplify \\((2\\sqrt{6})(3\\sqrt{15})\\)", steps: [R`\(2 \cdot 3 = 6\) and \(\sqrt{6 \cdot 15} = \sqrt{90}\).`, R`\(\sqrt{90} = 3\sqrt{10}\), so \(6 \cdot 3\sqrt{10} = 18\sqrt{10}\).`], answer: R`\(18\sqrt{10}\)` },
        { title: "Expand \\((2\\sqrt{3} - \\sqrt{2})^2\\)", steps: [R`\((2\sqrt{3})^2 = 12\), \((\sqrt{2})^2 = 2\).`, R`Middle term: \(-2(2\sqrt{3})(\sqrt{2}) = -4\sqrt{6}\).`, R`\(12 - 4\sqrt{6} + 2 = 14 - 4\sqrt{6}\).`], answer: R`\(14 - 4\sqrt{6}\)` },
      ],
      mistakes: [
        { wrong: "(2√3)² = 6", fix: "Square the coefficient too: 4 · 3 = 12." },
        { wrong: "(2√3 − √2)² = 12 − 2 = 10", fix: "Don't forget the middle term −4√6." },
        { wrong: "2√6 · 3√15 = 6√21", fix: "Multiply radicands (6 · 15 = 90), don't add them." },
      ],
      prereqs: ["radicals.simplify"], related: ["radicals.conjugates"],
    }),
    C({
      id: "radicals.rationalize", unit: "radicals", title: "Dividing radicals and rationalizing",
      summary: "Divide radicals, and clear a single radical from a denominator.",
      keywords: ["rationalize", "rationalizing the denominator", "rational denominator", "divide radicals", "quotient of radicals", "denominator"],
      explanation: [
        R`Dividing works like multiplying: \(\dfrac{a\sqrt{m}}{b\sqrt{n}} = \dfrac{a}{b}\sqrt{\dfrac{m}{n}}\).`,
        R`Simplest form never leaves a radical in a denominator. For a <b>single-term</b> denominator, multiply top and bottom by the radical that makes it a perfect power: \(\dfrac{6}{\sqrt{3}}\cdot\dfrac{\sqrt{3}}{\sqrt{3}} = \dfrac{6\sqrt{3}}{3} = 2\sqrt{3}\).`,
        R`Only multiply by the radical part: for \(\dfrac{10}{3\sqrt{5}}\), use \(\tfrac{\sqrt{5}}{\sqrt{5}}\), then <b>reduce the fraction</b>: \(\dfrac{10\sqrt{5}}{15} = \dfrac{2\sqrt{5}}{3}\).`,
        R`For cube roots you need a perfect cube: \(\dfrac{6}{\sqrt[3]{2}}\cdot\dfrac{\sqrt[3]{4}}{\sqrt[3]{4}} = \dfrac{6\sqrt[3]{4}}{2} = 3\sqrt[3]{4}\).`,
      ],
      intuition: "Multiplying by √3/√3 is multiplying by 1: the value doesn't change, only how it looks.",
      rules: [
        { name: "Quotient", tex: R`\dfrac{\sqrt{a}}{\sqrt{b}} = \sqrt{\dfrac{a}{b}}` },
        { name: "Rationalize", tex: R`\dfrac{a}{\sqrt{b}} = \dfrac{a\sqrt{b}}{b}` },
      ],
      examples: [
        { title: "Rationalize \\(\\dfrac{5}{2\\sqrt{10}}\\)", steps: [R`Multiply by \(\tfrac{\sqrt{10}}{\sqrt{10}}\): \(\dfrac{5\sqrt{10}}{2\cdot 10} = \dfrac{5\sqrt{10}}{20}\).`, R`Reduce: \(\dfrac{\sqrt{10}}{4}\).`], answer: R`\(\dfrac{\sqrt{10}}{4}\)` },
        { title: "Simplify \\(\\dfrac{12\\sqrt{30}}{4\\sqrt{6}}\\)", steps: [R`\(\tfrac{12}{4} = 3\) and \(\sqrt{\tfrac{30}{6}} = \sqrt{5}\).`], answer: R`\(3\sqrt{5}\)` },
      ],
      mistakes: [
        { wrong: "Leaving 5/√3 as the final answer.", fix: "Rationalize: 5√3/3. A radical in the denominator usually earns 0 for that part." },
        { wrong: "Stopping at 5√10/20.", fix: "Reduce the fraction: √10/4." },
        { wrong: "Multiplying 10/(3√5) by 3√5/3√5.", fix: "Only the radical needs clearing. Use √5/√5." },
      ],
      prereqs: ["radicals.multiply"], related: ["radicals.conjugates"],
    }),
    C({
      id: "radicals.conjugates", unit: "radicals", title: "Conjugates and binomial denominators",
      summary: "Use the conjugate (flip the middle sign) to clear a two-term denominator.",
      keywords: ["conjugate", "binomial denominator", "difference of squares", "rationalize binomial", "a + √b", "a − √b"],
      explanation: [
        R`The <b>conjugate</b> of \(a + \sqrt{b}\) is \(a - \sqrt{b}\): same terms, opposite middle sign.`,
        R`Their product is a difference of squares, so the radical disappears: \((a + \sqrt{b})(a - \sqrt{b}) = a^2 - b\).`,
        R`To rationalize \(\dfrac{4}{3 - \sqrt{5}}\), multiply top and bottom by the conjugate \(3 + \sqrt{5}\): the denominator becomes \(9 - 5 = 4\), and \(\dfrac{4(3 + \sqrt{5})}{4} = 3 + \sqrt{5}\).`,
        R`For cube roots, use sum/difference of cubes: \(\dfrac{1}{\sqrt[3]{2} - 1}\cdot\dfrac{\sqrt[3]{4} + \sqrt[3]{2} + 1}{\sqrt[3]{4} + \sqrt[3]{2} + 1} = \sqrt[3]{4} + \sqrt[3]{2} + 1\).`,
      ],
      intuition: "The middle terms of (a + √b)(a − √b) cancel each other out, leaving only squares, and squares of square roots are plain numbers.",
      rules: [
        { name: "Conjugate product", tex: R`(a + \sqrt{b})(a - \sqrt{b}) = a^2 - b` },
        { name: "Two radicals", tex: R`(\sqrt{a} + \sqrt{b})(\sqrt{a} - \sqrt{b}) = a - b` },
      ],
      examples: [
        { title: "Rationalize \\(\\dfrac{\\sqrt{6}}{\\sqrt{3} + \\sqrt{2}}\\)", steps: [R`Multiply by \(\dfrac{\sqrt{3} - \sqrt{2}}{\sqrt{3} - \sqrt{2}}\). Denominator: \(3 - 2 = 1\).`, R`Numerator: \(\sqrt{18} - \sqrt{12} = 3\sqrt{2} - 2\sqrt{3}\).`], answer: R`\(3\sqrt{2} - 2\sqrt{3}\)` },
        { title: "Simplify \\(\\dfrac{2 + \\sqrt{3}}{2 - \\sqrt{3}}\\)", steps: [R`Multiply by \(\dfrac{2 + \sqrt{3}}{2 + \sqrt{3}}\). Denominator: \(4 - 3 = 1\).`, R`Numerator: \((2 + \sqrt{3})^2 = 7 + 4\sqrt{3}\).`], answer: R`\(7 + 4\sqrt{3}\)` },
      ],
      mistakes: [
        { wrong: "Multiplying by (3 − √5)/(3 − √5) to rationalize 4/(3 − √5).", fix: "That squares the denominator and keeps the radical. Use the conjugate 3 + √5." },
        { wrong: "Conjugate of 5 − 2√7 = −5 + 2√7", fix: "Only the middle sign flips: 5 + 2√7." },
        { wrong: "Leaving (12 + 4√5)/4.", fix: "Reduce: 3 + √5." },
      ],
      prereqs: ["radicals.rationalize", "factoring.special"], related: ["radicals.multiply"], difficulty: 2,
    }),
    C({
      id: "radicals.restrictions", unit: "radicals", title: "Restrictions on radicals",
      summary: "Find the values of x that keep an even root real (and a denominator non-zero).",
      keywords: ["restriction", "domain", "defined", "radicand", "non-negative", "x ≥", "real number"],
      explanation: [
        R`An even root (\(\sqrt{\ }\), \(\sqrt[4]{\ }\)) is only real when its radicand is <b>≥ 0</b>. Set the radicand \(\ge 0\) and solve.`,
        R`If the radical is in a <b>denominator</b>, it also can't be 0, so use \(> 0\).`,
        R`When you divide an inequality by a negative, flip the sign: \(5 - x \ge 0 \Rightarrow x \le 5\).`,
        R`In equations like \(\sqrt{x + 6} = x\), the right side must also be \(\ge 0\) because a principal root is never negative.`,
        R`Odd roots (\(\sqrt[3]{\ }\)) have <b>no</b> restriction: \(\sqrt[3]{-8} = -2\).`,
      ],
      intuition: "You can't take the square root of a negative number in the reals, so the restriction just keeps the inside from going negative.",
      rules: [
        { name: "Even root", tex: R`\sqrt{f(x)}\ \text{real} \iff f(x) \ge 0` },
        { name: "In a denominator", tex: R`\dfrac{1}{\sqrt{f(x)}}\ \text{needs}\ f(x) > 0` },
      ],
      examples: [
        { title: "Restriction for \\(\\sqrt{2x - 6}\\)", steps: [R`\(2x - 6 \ge 0\).`, R`\(2x \ge 6 \Rightarrow x \ge 3\).`], answer: R`\(x \ge 3\)` },
        { title: "Domain of \\(\\dfrac{\\sqrt{x - 2}}{\\sqrt{5 - x}}\\)", steps: [R`Top: \(x - 2 \ge 0 \Rightarrow x \ge 2\).`, R`Bottom: \(5 - x > 0 \Rightarrow x < 5\).`], answer: R`\(2 \le x < 5\)` },
      ],
      mistakes: [
        { wrong: "√(5 − x): x ≥ 5", fix: "Dividing by −1 flips the sign: x ≤ 5." },
        { wrong: "5/√(x + 4): x ≥ −4", fix: "A denominator can't be 0, so x > −4." },
      ],
      related: ["radicals.equations"],
    }),
    C({
      id: "radicals.equations", unit: "radicals", title: "Radical equations and extraneous roots",
      summary: "Isolate the radical, square both sides, solve, then check every answer.",
      keywords: ["radical equation", "solve", "extraneous", "extraneous root", "square both sides", "verify", "check your solution", "isolate the radical"],
      explanation: [
        R`<b>1. Isolate</b> the radical. <b>2. Square</b> both sides (cube for cube roots). <b>3. Solve</b> the resulting equation. <b>4. Check</b> every answer in the <i>original</i> equation.`,
        R`Squaring can create <b>extraneous roots</b>: values that solve the squared equation but not the original. For \(\sqrt{x + 7} = x + 1\), squaring gives \(x = 2\) or \(x = -3\), but \(x = -3\) makes the right side \(-2\) while the left side is \(2\).`,
        R`If two radicals remain, isolate one, square, isolate the other, and square again.`,
        R`If isolating gives \(\sqrt{\ \ } = \text{negative}\), there's no solution, because a principal root is never negative.`,
      ],
      intuition: "Squaring loses the sign: 2² and (−2)² are both 4. The check catches the solutions that only worked because the sign got erased.",
      rules: [
        { name: "Squaring", tex: R`\sqrt{A} = B \Rightarrow A = B^2\ \text{(then check } B \ge 0\text{)}` },
        { name: "Isolate first", tex: R`(\sqrt{A} + c)^2 \ne A + c^2` },
      ],
      examples: [
        { title: "Solve \\(\\sqrt{3x - 2} + 4 = 9\\)", steps: [R`Isolate: \(\sqrt{3x - 2} = 5\).`, R`Square: \(3x - 2 = 25 \Rightarrow x = 9\).`, R`Check: \(\sqrt{25} + 4 = 9\) ✓.`], answer: R`\(x = 9\)` },
        { title: "Solve \\(\\sqrt{x + 7} = x + 1\\)", steps: [R`Square: \(x + 7 = x^2 + 2x + 1 \Rightarrow x^2 + x - 6 = 0\).`, R`Factor: \((x + 3)(x - 2) = 0\), so \(x = -3\) or \(x = 2\).`, R`Check \(x = 2\): \(\sqrt{9} = 3 = 2 + 1\) ✓. Check \(x = -3\): \(\sqrt{4} = 2 \ne -2\) ✗, so it's extraneous.`], answer: R`\(x = 2\)` },
      ],
      mistakes: [
        { wrong: "Squaring √(x + 3) + 2 = x as (x + 3) + 4 = x².", fix: "Isolate the radical before squaring." },
        { wrong: "Keeping both roots without checking.", fix: "Substitute each one into the original equation." },
        { wrong: "Assuming a negative answer must be extraneous.", fix: "Only the check decides. √(5x + 6) = x + 2 has the valid solution x = −1." },
      ],
      prereqs: ["radicals.restrictions", "factoring.trinomials"], related: ["exponents.rational"], difficulty: 2,
    }),
    C({
      id: "radicals.applications", unit: "radicals", title: "Radicals in geometry and formulas",
      summary: "Perimeter, area, Pythagoras and formulas like T = 2π√(L/9.8), with exact and rounded answers.",
      keywords: ["perimeter", "area", "pythagorean", "hypotenuse", "diagonal", "side length", "pendulum", "formula", "exact value", "nearest hundredth", "word problem", "application"],
      explanation: [
        R`<b>Perimeter</b> adds lengths, so simplify each side and combine like radicals. <b>Area</b> multiplies lengths, so multiply radicals.`,
        R`<b>Pythagoras:</b> \(c^2 = a^2 + b^2\). With radical legs, squaring removes the roots: legs \(\sqrt{5}\) and \(\sqrt{11}\) give \(c = \sqrt{16} = 4\).`,
        R`<b>Exact vs rounded:</b> "exact" means keep \(\pi\) and radicals (\(T = \pi\) s). "To the nearest hundredth" means use a calculator at the end (\(L \approx 3.97\) m).`,
        R`For a formula, substitute and simplify; to solve for the variable under the root, isolate the root, then square.`,
      ],
      intuition: "Every geometry rule you know still works. Radicals just ride along, and you simplify at the end.",
      rules: [
        { name: "Pythagoras", tex: R`c = \sqrt{a^2 + b^2}` },
        { name: "Square from area", tex: R`s = \sqrt{A}` },
        { name: "Pendulum", tex: R`T = 2\pi\sqrt{\dfrac{L}{9.8}}` },
      ],
      examples: [
        { title: "Rectangle \\(\\sqrt{48}\\) by \\(\\sqrt{12}\\)", steps: [R`Simplify: \(4\sqrt{3}\) and \(2\sqrt{3}\).`, R`Perimeter \(= 2(4\sqrt{3} + 2\sqrt{3}) = 12\sqrt{3}\).`, R`Area \(= \sqrt{48 \cdot 12} = \sqrt{576} = 24\). Diagonal \(= \sqrt{48 + 12} = \sqrt{60} = 2\sqrt{15}\).`], answer: R`\(P = 12\sqrt{3},\ A = 24,\ d = 2\sqrt{15}\)` },
        { title: "Pendulum with period 4 s", steps: [R`\(4 = 2\pi\sqrt{\tfrac{L}{9.8}} \Rightarrow \sqrt{\tfrac{L}{9.8}} = \tfrac{2}{\pi}\).`, R`Square: \(\tfrac{L}{9.8} = \tfrac{4}{\pi^2} \Rightarrow L = \tfrac{39.2}{\pi^2} \approx 3.97\) m.`], answer: R`\(L \approx 3.97\text{ m}\)` },
      ],
      mistakes: [
        { wrong: "Hypotenuse of legs √5 and √11 = √5 + √11", fix: "Square, add, then root: √(5 + 11) = 4." },
        { wrong: "Giving 3.14 when the question asks for the exact period.", fix: "Exact means keep π: T = π s." },
      ],
      prereqs: ["radicals.simplify", "radicals.multiply"], related: ["radicals.add_subtract"],
    }),

    // ─────────────── Factoring ───────────────
    C({
      id: "factoring.trinomials", unit: "factoring", title: "Common factors and trinomials",
      summary: "Take out the GCF, then factor x² + bx + c and ax² + bx + c.",
      keywords: ["factor", "factoring", "gcf", "greatest common factor", "trinomial", "ax^2 + bx + c", "decomposition", "factor completely"],
      explanation: [
        R`<b>Always start with the GCF</b>: \(2x^3 - 18x = 2x(x^2 - 9)\).`,
        R`For \(x^2 + bx + c\), find two numbers that <b>multiply to c</b> and <b>add to b</b>: \(x^2 - 5x - 24 = (x - 8)(x + 3)\).`,
        R`For \(ax^2 + bx + c\), use decomposition: find numbers that multiply to \(ac\) and add to \(b\), split the middle term, then group. \(6x^2 + 7x - 3\): \(ac = -18\), numbers \(9, -2\), so \(3x(2x + 3) - 1(2x + 3) = (3x - 1)(2x + 3)\).`,
        R`"Factor completely" means keep going until nothing factors further.`,
      ],
      intuition: "Factoring is expanding in reverse. You can always check by multiplying your factors back out.",
      rules: [
        { name: "Simple trinomial", tex: R`x^2 + (m + n)x + mn = (x + m)(x + n)` },
        { name: "Decomposition", tex: R`ax^2 + bx + c:\ mn = ac,\ m + n = b` },
      ],
      examples: [
        { title: "Factor \\(4x^2 - 4xy - 15y^2\\)", steps: [R`\(ac = -60\); numbers that multiply to \(-60\) and add to \(-4\): \(-10\) and \(6\).`, R`\(4x^2 - 10xy + 6xy - 15y^2 = 2x(2x - 5y) + 3y(2x - 5y)\).`], answer: R`\((2x - 5y)(2x + 3y)\)` },
        { title: "Factor completely \\(3x^2 - 12x + 12\\)", steps: [R`GCF 3: \(3(x^2 - 4x + 4)\).`, R`The trinomial is a perfect square: \((x - 2)^2\).`], answer: R`\(3(x - 2)^2\)` },
      ],
      mistakes: [
        { wrong: "Stopping at 2x(x² − 9).", fix: "x² − 9 factors further: 2x(x − 3)(x + 3)." },
        { wrong: "x² − 5x − 24 = (x + 8)(x − 3)", fix: "Check the sum: +8 − 3 = +5, but you need −5. Swap the signs." },
      ],
      related: ["factoring.special", "factoring.quadratic_form", "radicals.equations"],
    }),
    C({
      id: "factoring.special", unit: "factoring", title: "Difference of squares and perfect squares",
      summary: "Spot a² − b² and a² ± 2ab + b², including over the reals with radicals.",
      keywords: ["difference of squares", "perfect square trinomial", "a^2 - b^2", "sum of squares", "special product"],
      explanation: [
        R`<b>Difference of squares:</b> \(a^2 - b^2 = (a - b)(a + b)\). Both terms must be perfect squares with a minus between them: \(49a^2 - 16b^2 = (7a - 4b)(7a + 4b)\).`,
        R`<b>Perfect square trinomials:</b> \(a^2 \pm 2ab + b^2 = (a \pm b)^2\). Check that the middle term is exactly \(2ab\).`,
        R`A <b>sum of squares</b> \(x^2 + 25\) doesn't factor over the reals.`,
        R`Over the reals, any positive number is a square: \(x^2 - 7 = (x - \sqrt{7})(x + \sqrt{7})\), a pair of conjugates.`,
      ],
      intuition: "In (a − b)(a + b) the middle terms −ab and +ab cancel, which is exactly why conjugates clear radicals.",
      rules: [
        { name: "Difference of squares", tex: R`a^2 - b^2 = (a - b)(a + b)` },
        { name: "Perfect square", tex: R`a^2 \pm 2ab + b^2 = (a \pm b)^2` },
      ],
      examples: [
        { title: "Factor completely \\(x^4 - 81\\)", steps: [R`\(x^4 - 81 = (x^2 - 9)(x^2 + 9)\).`, R`\(x^2 - 9 = (x - 3)(x + 3)\); \(x^2 + 9\) doesn't factor.`], answer: R`\((x^2 + 9)(x - 3)(x + 3)\)` },
        { title: "Factor completely \\((2x - 1)^2 - 9\\)", steps: [R`Difference of squares with \(A = 2x - 1\), \(B = 3\): \((2x - 4)(2x + 2)\).`, R`Take out a 2 from each: \(4(x - 2)(x + 1)\).`], answer: R`\(4(x - 2)(x + 1)\)` },
      ],
      mistakes: [
        { wrong: "x² + 25 = (x + 5)(x + 5)", fix: "(x + 5)² = x² + 10x + 25. A sum of squares doesn't factor over the reals." },
        { wrong: "49a² − 16b² = (7a − 4b)²", fix: "A difference of squares gives conjugate factors: (7a − 4b)(7a + 4b)." },
      ],
      prereqs: ["factoring.trinomials"], related: ["radicals.conjugates", "factoring.quadratic_form"],
    }),
    C({
      id: "factoring.quadratic_form", unit: "factoring", title: "Quadratic form and substitution",
      summary: "Factor expressions like x⁴ − 13x² + 36 or (x + 1)² − 5(x + 1) + 6 by substituting u.",
      keywords: ["quadratic form", "substitution", "let u", "x^4", "factor by substitution", "rational expression", "simplify rational expression"],
      explanation: [
        R`If an expression looks like a quadratic in some chunk, replace the chunk with \(u\). For \(x^4 - 13x^2 + 36\), let \(u = x^2\): \(u^2 - 13u + 36 = (u - 4)(u - 9)\).`,
        R`<b>Substitute back</b> and keep factoring: \((x^2 - 4)(x^2 - 9) = (x - 2)(x + 2)(x - 3)(x + 3)\).`,
        R`The same idea works for a repeated binomial: \((x + 1)^2 - 5(x + 1) + 6\) with \(u = x + 1\) gives \((u - 2)(u - 3) = (x - 1)(x - 2)\).`,
        R`Factoring also simplifies rational expressions: factor top and bottom, then cancel common <b>factors</b> (never terms).`,
      ],
      intuition: "u is a temporary disguise that turns a scary expression into a trinomial you already know how to factor.",
      rules: [
        { name: "Substitution", tex: R`a(\square)^2 + b(\square) + c,\ \ u = \square` },
      ],
      examples: [
        { title: "Factor \\((x + 1)^2 - 5(x + 1) + 6\\)", steps: [R`Let \(u = x + 1\): \(u^2 - 5u + 6 = (u - 2)(u - 3)\).`, R`Back-substitute: \((x + 1 - 2)(x + 1 - 3)\).`], answer: R`\((x - 1)(x - 2)\)` },
        { title: "Simplify \\(\\dfrac{x^2 - 9}{x^2 + x - 6}\\)", steps: [R`Factor: \(\dfrac{(x - 3)(x + 3)}{(x + 3)(x - 2)}\).`, R`Cancel \((x + 3)\), noting \(x \ne -3, 2\).`], answer: R`\(\dfrac{x - 3}{x - 2}\)` },
      ],
      mistakes: [
        { wrong: "Giving (u − 2)(u − 3) as (x − 2)(x − 3).", fix: "Substitute back: u = x + 1." },
        { wrong: "Stopping at (x² − 4)(x² − 9).", fix: "Both are differences of squares, so factor completely." },
      ],
      prereqs: ["factoring.trinomials", "factoring.special"], difficulty: 2,
    }),
  ];

  // ─────────────── Question → concept tagging ───────────────
  // Topic defaults, then per-question overrides, then per-part overrides ("id:part").
  const TOPIC_DEFAULT = {
    "Simplifying radicals": ["radicals.simplify"],
    "Mixed & entire radicals": ["radicals.mixed_entire"],
    "Adding & subtracting radicals": ["radicals.add_subtract"],
    "Multiplying radicals": ["radicals.multiply"],
    "Conjugates": ["radicals.conjugates"],
    "Dividing & rationalizing": ["radicals.rationalize"],
    "Restrictions": ["radicals.restrictions"],
    "Radical equations": ["radicals.equations"],
    "Factoring": ["factoring.trinomials"],
    "Applications": ["radicals.applications"],
    "Number systems": ["numbers.sets"],
    "Exponent laws": ["exponents.laws"],
    "Find the mistake": ["radicals.simplify"],
  };
  const Q = {
    "simp-7": ["radicals.simplify", "radicals.add_subtract"],
    "conj-5": ["radicals.conjugates", "factoring.special"],
    "div-6": ["radicals.conjugates"], "div-7": ["radicals.conjugates"], "div-8": ["radicals.conjugates"],
    "div-10": ["radicals.conjugates", "factoring.special"],
    "fact-3": ["factoring.trinomials", "factoring.special"], "fact-4": ["factoring.special"],
    "fact-5": ["factoring.quadratic_form", "factoring.special"], "fact-6": ["factoring.special"],
    "fact-7": ["factoring.quadratic_form"], "fact-8": ["factoring.special"],
    "fact-9": ["factoring.special", "factoring.quadratic_form"], "fact-11": ["factoring.special"],
    "fact-12": ["factoring.trinomials", "factoring.special"], "fact-13": ["factoring.trinomials", "factoring.special"],
    "fact-14": ["factoring.quadratic_form", "factoring.special"],
    "exp-1": ["exponents.negative"], "exp-2": ["exponents.laws", "exponents.negative"], "exp-3": ["exponents.rational"],
    "exp-4": ["exponents.rational", "exponents.negative"], "exp-5": ["exponents.rational"],
    "exp-6": ["exponents.negative", "exponents.laws"], "exp-7": ["exponents.rational"],
    "exp-8": ["exponents.laws", "exponents.negative"], "exp-9": ["exponents.rational", "exponents.negative"],
    "err-1": ["radicals.simplify"], "err-2": ["radicals.simplify"], "err-3": ["radicals.conjugates"],
    "err-4": ["radicals.equations"], "err-5": ["radicals.multiply"], "err-6": ["radicals.add_subtract"],
    "err-7": ["radicals.equations"], "err-8": ["exponents.negative"], "err-9": ["radicals.simplify"],
    "ways-1": ["radicals.mixed_entire"], "ways-2": ["radicals.multiply"], "ways-3": ["radicals.simplify"],
    "geo-1": ["radicals.applications", "radicals.simplify"], "geo-4": ["radicals.applications", "radicals.simplify"],
    "nr-8": ["radicals.conjugates"], "nr-11": ["exponents.rational"], "nr-12": ["exponents.negative", "exponents.laws"],
    "nr-15": ["radicals.conjugates"], "nr-19": ["exponents.rational", "exponents.negative"],
    "nr-22": ["radicals.multiply"], "nr-23": ["radicals.conjugates"],
    "ch-nr2": ["radicals.conjugates"], "ch-nr5": ["exponents.laws"], "ch-nr8": ["exponents.rational"],
    "ch-nr9": ["exponents.rational", "exponents.negative"], "ch-nr11": ["exponents.rational"],
    "ch-mc6": ["exponents.laws"], "ch-mc7": ["exponents.rational", "exponents.negative"], "ch-mc10": ["exponents.laws"],
    "ch-mc12": ["exponents.rational", "radicals.equations"],
    "cm-nr3": ["exponents.rational"], "cm-wr3": ["radicals.equations", "radicals.restrictions"],
    "cm-wr4": ["radicals.equations", "radicals.restrictions"],
  };
  const MONO_PART = ["radicals.rationalize"], BIN_PART = ["radicals.conjugates"];
  const PART = {};
  for (const id of ["wr2-1", "wr2-2", "wr2-3", "wr2-4", "wr2-5", "ch-wr2-1", "ch-wr2-2", "ch-wr2-3", "ch-wr2-4"]) {
    PART[`${id}:a`] = MONO_PART; PART[`${id}:b`] = BIN_PART; PART[`${id}:c`] = BIN_PART;
  }
  PART["cm-wr2:a"] = MONO_PART; PART["cm-wr2:b"] = MONO_PART; PART["cm-wr2:c"] = BIN_PART;
  PART["cm-wr3:a"] = ["radicals.restrictions"]; PART["cm-wr3:b"] = ["radicals.equations"];
  PART["cm-wr4:a"] = ["radicals.restrictions"]; PART["cm-wr4:b"] = ["radicals.equations"]; PART["cm-wr4:c"] = ["radicals.equations"];
  for (const id of ["wr1-1", "wr1-2", "wr1-3", "wr1-4", "wr1-5", "wr1-6", "ch-wr1-1", "ch-wr1-2", "ch-wr1-3", "ch-wr1-4"]) {
    PART[`${id}:a1`] = PART[`${id}:b1`] = ["radicals.mixed_entire"];
    PART[`${id}:a2`] = PART[`${id}:b2`] = ["radicals.mixed_entire", "radicals.simplify"];
  }

  function conceptsFor(q, partKey) {
    if (!q) return [];
    if (partKey && PART[`${q.id}:${partKey}`]) return PART[`${q.id}:${partKey}`];
    if (Q[q.id]) return Q[q.id];
    if (partKey === undefined && q.parts) {
      const set = new Set();
      for (const p of q.parts) for (const c of conceptsFor(q, p.key)) set.add(c);
      if (set.size) return [...set];
    }
    return TOPIC_DEFAULT[q.topic] || [];
  }

  const byId = new Map(CONCEPTS.map((c) => [c.id, c]));
  const COURSES = [{ id: "pc11", title: "Pre-Calculus 11", units: UNITS, concepts: CONCEPTS }];

  const api = { COURSES, UNITS, CONCEPTS, byId, get: (id) => byId.get(id), conceptsFor, TOPIC_DEFAULT };
  root.Concepts = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
