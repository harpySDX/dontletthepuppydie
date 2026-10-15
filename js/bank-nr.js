/*
 * NUMERICAL RESPONSE bank (1 mark each).
 * The student types a single number (integers, decimals, negatives or fractions like 1/4).
 *   answer  the number
 *   fmt     short hint shown under the box
 */
(function () {
  const R = String.raw;
  const T = window.TOPICS;

  window.NR_BANK = [
    { id: "nr-1", topic: T.mixed, q: R`If \(3\sqrt{5} = \sqrt{n}\), what is the value of \(n\)?`, answer: 45, fmt: "Whole number",
      e: R`\(3\sqrt{5} = \sqrt{3^2 \cdot 5} = \sqrt{45}\), so \(n = 45\).` },
    { id: "nr-2", topic: T.simp, q: R`\(\sqrt{200}\) written in simplest form is \(a\sqrt{2}\). What is \(a\)?`, answer: 10, fmt: "Whole number",
      e: R`\(\sqrt{200} = \sqrt{100 \cdot 2} = 10\sqrt{2}\).` },
    { id: "nr-3", topic: T.mixed, q: R`If \(2\sqrt[3]{3} = \sqrt[3]{n}\), what is \(n\)?`, answer: 24, fmt: "Whole number",
      e: R`Cube the coefficient: \(2^3 \cdot 3 = 8 \cdot 3 = 24\).` },
    { id: "nr-4", topic: T.mixed, q: R`If \(-3\sqrt[3]{2} = \sqrt[3]{n}\), what is \(n\)?`, answer: -54, fmt: "Integer (can be negative)",
      e: R`\((-3)^3 \cdot 2 = -27 \cdot 2 = -54\). The negative can move inside a cube root.` },
    { id: "nr-5", topic: T.eq, q: R`Solve \(\sqrt{x - 3} = 4\).`, answer: 19, fmt: "Value of x",
      e: R`Square: \(x - 3 = 16 \Rightarrow x = 19\). Check: \(\sqrt{16} = 4\) ✓.` },
    { id: "nr-6", topic: T.eq, q: R`Solve \(\sqrt{2x + 1} = 7\).`, answer: 24, fmt: "Value of x",
      e: R`Square: \(2x + 1 = 49 \Rightarrow 2x = 48 \Rightarrow x = 24\). Check: \(\sqrt{49} = 7\) ✓.` },
    { id: "nr-7", topic: T.mult, q: R`\((2\sqrt{3})(5\sqrt{6})\) simplifies to \(a\sqrt{2}\). What is \(a\)?`, answer: 30, fmt: "Whole number",
      e: R`\(10\sqrt{18} = 10 \cdot 3\sqrt{2} = 30\sqrt{2}\).` },
    { id: "nr-8", topic: T.conj, q: R`Evaluate \((4 + \sqrt{7})(4 - \sqrt{7})\).`, answer: 9, fmt: "Whole number",
      e: R`Difference of squares: \(16 - 7 = 9\).` },
    { id: "nr-9", topic: T.div, q: R`\(\dfrac{12}{\sqrt{6}}\) written with a rational denominator is \(a\sqrt{6}\). What is \(a\)?`, answer: 2, fmt: "Whole number",
      e: R`\(\dfrac{12\sqrt{6}}{6} = 2\sqrt{6}\).` },
    { id: "nr-10", topic: T.ops, q: R`\(\sqrt{12} + \sqrt{75} - \sqrt{27} = a\sqrt{3}\). What is \(a\)?`, answer: 4, fmt: "Whole number",
      e: R`\(2\sqrt{3} + 5\sqrt{3} - 3\sqrt{3} = 4\sqrt{3}\).` },
    { id: "nr-11", topic: T.exp, q: R`Evaluate \(27^{\frac{2}{3}}\).`, answer: 9, fmt: "Whole number",
      e: R`\(\left(\sqrt[3]{27}\right)^2 = 3^2 = 9\).` },
    { id: "nr-12", topic: T.exp, q: R`\(\dfrac{x^{-3}y^{5}}{5^{-1}y^{-2}}\) simplifies to \(\dfrac{a\,y^{b}}{x^{c}}\) with positive exponents. What is \(a + b + c\)?`, answer: 15, fmt: "Whole number",
      e: R`It simplifies to \(\dfrac{5y^7}{x^3}\), so \(a + b + c = 5 + 7 + 3 = 15\).` },
    { id: "nr-13", topic: T.app, q: R`A square has an area of \(72\text{ cm}^2\). Its side length is \(a\sqrt{2}\) cm. What is \(a\)?`, answer: 6, fmt: "Whole number",
      e: R`\(\sqrt{72} = \sqrt{36 \cdot 2} = 6\sqrt{2}\).` },
    { id: "nr-14", topic: T.app, q: R`A right triangle has legs \(2\sqrt{3}\) and \(6\). The hypotenuse is \(a\sqrt{3}\). What is \(a\)?`, answer: 4, fmt: "Whole number",
      e: R`\(c^2 = 12 + 36 = 48\), so \(c = \sqrt{48} = 4\sqrt{3}\).` },
    { id: "nr-15", topic: T.div, q: R`\(\dfrac{6}{\sqrt{5} - \sqrt{2}} = a(\sqrt{5} + \sqrt{2})\). What is \(a\)?`, answer: 2, fmt: "Whole number",
      e: R`Multiply by the conjugate: \(\dfrac{6(\sqrt{5} + \sqrt{2})}{5 - 2} = 2(\sqrt{5} + \sqrt{2})\).` },
    { id: "nr-16", topic: T.eq, q: R`Solve \(\sqrt{x + 6} = x\).`, answer: 3, fmt: "Value of x",
      e: R`\(x + 6 = x^2 \Rightarrow (x - 3)(x + 2) = 0\). \(x = 3\) checks (\(\sqrt{9} = 3\)); \(x = -2\) is extraneous (\(\sqrt{4} \ne -2\)).` },
    { id: "nr-17", topic: T.sets, q: R`How many of these numbers are irrational? <div class="work">\(\sqrt{16},\quad \sqrt{20},\quad \sqrt[3]{27},\quad \pi,\quad 0.25,\quad \sqrt{\tfrac{2}{8}}\)</div>`, answer: 2, fmt: "Whole number",
      e: R`\(\sqrt{16} = 4\), \(\sqrt[3]{27} = 3\), \(0.25\), and \(\sqrt{\tfrac{2}{8}} = \sqrt{\tfrac{1}{4}} = \tfrac{1}{2}\) are rational. Only \(\sqrt{20}\) and \(\pi\) are irrational.` },
    { id: "nr-18", topic: T.simp, q: R`Evaluate \(\sqrt[3]{-125} + \sqrt{49}\).`, answer: 2, fmt: "Integer",
      e: R`\(-5 + 7 = 2\).` },
    { id: "nr-19", topic: T.exp, q: R`Evaluate \(16^{-\frac{1}{2}}\) as a decimal.`, answer: 0.25, fmt: "Decimal",
      e: R`\(16^{-1/2} = \dfrac{1}{\sqrt{16}} = \dfrac{1}{4} = 0.25\).` },
    { id: "nr-20", topic: T.app, q: R`A rectangle is \(\sqrt{18}\) m by \(\sqrt{8}\) m. Its perimeter is \(a\sqrt{2}\) m. What is \(a\)?`, answer: 10, fmt: "Whole number",
      e: R`\(2(3\sqrt{2} + 2\sqrt{2}) = 2(5\sqrt{2}) = 10\sqrt{2}\).` },
    { id: "nr-21", topic: T.restr, q: R`\(\sqrt{3x - 12}\) is a real number when \(x \ge a\). What is \(a\)?`, answer: 4, fmt: "Whole number",
      e: R`\(3x - 12 \ge 0 \Rightarrow x \ge 4\).` },
    { id: "nr-22", topic: T.mult, q: R`\((\sqrt{5} + \sqrt{3})^2 = a + b\sqrt{15}\). What is \(a + b\)?`, answer: 10, fmt: "Whole number",
      e: R`\(5 + 2\sqrt{15} + 3 = 8 + 2\sqrt{15}\), so \(a + b = 8 + 2 = 10\).` },
    { id: "nr-23", topic: T.div, q: R`\(\dfrac{2 + \sqrt{3}}{2 - \sqrt{3}} = a + b\sqrt{3}\). What is \(a + b\)?`, answer: 11, fmt: "Whole number",
      e: R`Multiply by \(2 + \sqrt{3}\): numerator \(7 + 4\sqrt{3}\), denominator \(4 - 3 = 1\). So \(a + b = 7 + 4 = 11\).` },
    { id: "nr-24", topic: T.app, q: R`What is the area of a square with side length \(3\sqrt{2}\) cm, in cm²?`, answer: 18, fmt: "Whole number",
      e: R`\((3\sqrt{2})^2 = 9 \cdot 2 = 18\).` },
  ];
})();
