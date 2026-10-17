/*
 * QUAD CONTENT — the Quadratic Functions unit of the Concept Library, and the formula reference.
 *
 * Concepts follow the same schema as js/concepts.js (id, unit, title, summary, keywords, explanation,
 * intuition, rules, examples, mistakes, prereqs, related) plus:
 *   notation    what each symbol means
 *   strategies  how to attack common question types
 *   graph       a Graph.svg spec drawn in the lesson
 *   explorer    true → the lesson shows the interactive a/h/k explorer
 *   tr          translated title + summary (fr, es, de, zh). The lesson body is English (marked in the UI).
 * Practice questions are linked through the question families' concept tags (js/quad-bank.js).
 */
(function (root) {
  "use strict";
  const R = String.raw;
  const SOURCE = "Written for DontLetThePuppyDie. Not yet reviewed by a teacher.";
  const C = (o) => ({ difficulty: 1, prereqs: [], related: [], source: SOURCE, reviewed: false, version: 1, notation: [], strategies: [], ...o });

  const UNIT = { id: "quadratics", title: "Quadratic Functions" };

  const CONCEPTS = [
    C({
      id: "quad.basics", unit: "quadratics", title: "What makes a function quadratic",
      summary: R`A quadratic function can be written as \(y = ax^2 + bx + c\) with \(a \ne 0\). The same function has several useful forms.`,
      keywords: ["quadratic function", "standard form", "coefficient", "degree", "a b c", "polynomial", "identify quadratic"],
      intuition: "A quadratic is any function whose highest power of x is exactly 2 once everything is expanded. Its graph is always a parabola.",
      explanation: [
        R`A <b>quadratic function</b> has the form \(f(x) = ax^2 + bx + c\), where \(a\), \(b\), \(c\) are numbers and \(a \ne 0\). If \(a\) were 0, the \(x^2\) term would vanish and you'd have a line.`,
        R`The letters have names: \(a\) is the <b>leading coefficient</b> (goes with \(x^2\)), \(b\) is the coefficient of \(x\), and \(c\) is the <b>constant term</b>. Read each one together with the sign in front of it.`,
        R`The same function can be written three ways. <b>Standard form</b> \(y = ax^2 + bx + c\) shows the y-intercept \(c\). <b>Vertex form</b> \(y = a(x - h)^2 + k\) shows the vertex. <b>Factored form</b> \(y = a(x - r)(x - s)\) shows the zeros. They all describe the same parabola; you switch forms to read off different features.`,
        R`To decide whether something is quadratic, expand and collect like terms first. \(\left(x + 2\right)^2 - x^2\) looks quadratic, but it simplifies to \(4x + 4\), a line.`,
      ],
      notation: [{ sym: "f(x)", means: "the output (y-value) of the function f at input x" }, { sym: "a", means: "leading coefficient: the number multiplying x²; never 0" }, { sym: "b", means: "the number multiplying x" }, { sym: "c", means: "the constant term (also the y-intercept)" }],
      rules: [
        { name: "Standard form", tex: R`y = ax^2 + bx + c,\quad a \ne 0` },
        { name: "Vertex form", tex: R`y = a\left(x - h\right)^2 + k` },
        { name: "Factored form", tex: R`y = a\left(x - r\right)\left(x - s\right)` },
      ],
      examples: [
        { title: R`Find \(a\), \(b\), \(c\) for \(y = 5 + 3x - 2x^2\)`, steps: [R`Reorder by power: \(y = -2x^2 + 3x + 5\).`, R`Keep each sign with its term: \(a = -2\), \(b = 3\), \(c = 5\).`], answer: R`\(a = -2,\ b = 3,\ c = 5\)` },
        { title: R`Is \(y = \left(2x + 1\right)^2 - 4x^2\) quadratic?`, steps: [R`Expand: \(\left(2x + 1\right)^2 = 4x^2 + 4x + 1\).`, R`Subtract \(4x^2\): \(y = 4x + 1\).`, R`The \(x^2\) terms cancel, so the highest power is 1.`], answer: "No. It's linear." },
      ],
      mistakes: [
        { wrong: "Reading b as the second number written, even when the terms are out of order.", fix: "Rearrange into the order x², x, constant first, then read a, b, c with their signs." },
        { wrong: "Calling anything with an x² in it quadratic.", fix: "Expand and collect like terms. x² terms can cancel, and an x³ term makes it cubic." },
      ],
      strategies: ["Expand brackets before you decide anything.", "Write the function in the order ax² + bx + c before naming coefficients."],
      graph: { fns: [{ a: 1, h: 0, k: 0 }], marks: { vertex: true }, window: { x0: -5, x1: 5, y0: -2, y1: 8 } },
      related: ["quad.direction", "quad.vertex_form", "quad.factored_form"], difficulty: 1,
      tr: {
        fr: { title: "Qu'est-ce qu'une fonction quadratique", summary: "Une fonction quadratique s'écrit y = ax² + bx + c avec a ≠ 0. La même fonction a plusieurs formes utiles." },
        es: { title: "Qué hace cuadrática a una función", summary: "Una función cuadrática se escribe y = ax² + bx + c con a ≠ 0. La misma función tiene varias formas útiles." },
        de: { title: "Was eine Funktion quadratisch macht", summary: "Eine quadratische Funktion lässt sich als y = ax² + bx + c mit a ≠ 0 schreiben. Dieselbe Funktion hat mehrere nützliche Formen." },
        zh: { title: "什么是二次函数", summary: "二次函数可以写成 y = ax² + bx + c（a ≠ 0）。同一个函数有几种有用的形式。" },
      },
    }),
    C({
      id: "quad.direction", unit: "quadratics", title: "Opening direction, maximum and minimum",
      summary: R`The sign of \(a\) decides whether the parabola opens up (a minimum) or down (a maximum).`,
      keywords: ["opens up", "opens down", "maximum", "minimum", "leading coefficient", "concave", "max value", "min value"],
      intuition: "Think of a = +1 as a smile and a = −1 as a frown. The vertex is the bottom of the smile or the top of the frown.",
      explanation: [
        R`If \(a > 0\), the \(ax^2\) term becomes large and positive as you move away from the vertex in either direction, so the graph rises on both sides: it <b>opens up</b> and the vertex is the <b>minimum</b>.`,
        R`If \(a < 0\), the graph falls on both sides: it <b>opens down</b> and the vertex is the <b>maximum</b>.`,
        R`The maximum or minimum <b>value</b> is a y-value: the y-coordinate \(k\) of the vertex. It happens at \(x = h\).`,
        R`Only \(a\) matters for direction. In \(y = 7 - x^2 + 4x\), the \(x^2\) term is \(-x^2\) even though it's written second, so it opens down.`,
      ],
      notation: [{ sym: "a > 0", means: "opens up, has a minimum" }, { sym: "a < 0", means: "opens down, has a maximum" }],
      rules: [{ name: "Up", tex: R`a > 0 \Rightarrow \text{minimum value } k` }, { name: "Down", tex: R`a < 0 \Rightarrow \text{maximum value } k` }],
      examples: [
        { title: R`Describe \(y = -2\left(x - 1\right)^2 + 5\)`, steps: [R`\(a = -2 < 0\): opens down.`, R`The vertex \(\left(1, 5\right)\) is the highest point.`], answer: R`Maximum value 5 at \(x = 1\)` },
        { title: R`Describe \(y = -\left(x - 2\right)\left(4 - x\right)\)`, steps: [R`Multiply the \(x\)-terms only: \(-\left(x\right)\left(-x\right) = +x^2\).`, R`So \(a = 1 > 0\): it opens up.`], answer: "Opens up, has a minimum" },
      ],
      mistakes: [
        { wrong: "Giving the maximum value as the x-coordinate of the vertex.", fix: "A maximum or minimum value is a y-value: k." },
        { wrong: "Deciding the direction from the first term written.", fix: "Find the x² term wherever it is, and use its sign." },
      ],
      strategies: ["Find the sign of the x² coefficient (multiply out just the x-terms if it's factored)."],
      graph: { fns: [{ a: 1, h: -2, k: -2 }, { a: -1, h: 2, k: 3 }], labels: ["a > 0", "a < 0"], marks: { vertex: true }, window: { x0: -6, x1: 6, y0: -5, y1: 6 } },
      prereqs: ["quad.basics"], related: ["quad.vertex_form", "quad.applications"], difficulty: 1,
      tr: {
        fr: { title: "Sens d'ouverture, maximum et minimum", summary: "Le signe de a indique si la parabole s'ouvre vers le haut (minimum) ou vers le bas (maximum)." },
        es: { title: "Dirección de apertura, máximo y mínimo", summary: "El signo de a decide si la parábola abre hacia arriba (mínimo) o hacia abajo (máximo)." },
        de: { title: "Öffnungsrichtung, Maximum und Minimum", summary: "Das Vorzeichen von a entscheidet, ob die Parabel nach oben (Minimum) oder nach unten (Maximum) geöffnet ist." },
        zh: { title: "开口方向、最大值与最小值", summary: "a 的符号决定抛物线开口向上（有最小值）还是向下（有最大值）。" },
      },
    }),
    C({
      id: "quad.vertex_form", unit: "quadratics", title: "Vertex form",
      summary: R`In \(y = a(x - h)^2 + k\), the vertex is \((h, k)\) and the axis of symmetry is \(x = h\).`,
      keywords: ["vertex form", "vertex", "h", "k", "turning point", "a(x-h)^2+k"],
      intuition: "A squared bracket is never negative, so it's smallest (zero) when x = h. That's where the turning point is, at height k.",
      explanation: [
        R`In \(y = a\left(x - h\right)^2 + k\), the bracket \(\left(x - h\right)^2\) is 0 when \(x = h\) and positive everywhere else. So the graph turns at \(x = h\), where \(y = k\): the <b>vertex</b> is \(\left(h, k\right)\).`,
        R`Read \(h\) carefully: it appears with a minus sign. \(\left(x - 3\right)^2\) means \(h = 3\), while \(\left(x + 3\right)^2 = \left(x - \left(-3\right)\right)^2\) means \(h = -3\). The \(k\) outside keeps its sign.`,
        R`\(a\) does two jobs: its sign sets the direction and its size sets the width. From the vertex, moving 1 unit sideways changes \(y\) by \(a\); moving 2 units changes it by \(4a\); 3 units by \(9a\).`,
        R`Use the explorer below to change \(a\), \(h\) and \(k\) and watch the parabola respond.`,
      ],
      notation: [{ sym: "(h, k)", means: "the vertex" }, { sym: "x = h", means: "the axis of symmetry" }, { sym: "k", means: "the maximum or minimum value" }],
      rules: [{ name: "Vertex", tex: R`y = a\left(x - h\right)^2 + k \;\Rightarrow\; \text{vertex } \left(h, k\right)` }, { name: "Axis", tex: R`x = h` }],
      examples: [
        { title: R`Vertex of \(y = 2\left(x + 4\right)^2 - 7\)`, steps: [R`Rewrite the bracket: \(x + 4 = x - \left(-4\right)\), so \(h = -4\).`, R`\(k = -7\).`], answer: R`\(\left(-4, -7\right)\), axis \(x = -4\)` },
        { title: R`Vertex of \(y = 3 - \left(5 - x\right)^2\)`, steps: [R`\(\left(5 - x\right)^2 = \left(x - 5\right)^2\) (squaring removes the sign).`, R`So \(y = -\left(x - 5\right)^2 + 3\).`], answer: R`\(\left(5, 3\right)\), a maximum` },
      ],
      mistakes: [
        { wrong: "Taking h straight from the bracket: (x + 4) → h = 4.", fix: "h has the opposite sign to the number in the bracket: (x + 4) means h = −4." },
        { wrong: "Flipping the sign of k as well.", fix: "Only h flips. k is read exactly as written." },
      ],
      strategies: ["Rewrite the bracket as (x − h) before reading h.", "Check: substituting x = h should give y = k."],
      graph: { fns: [{ a: 1, h: 2, k: -3 }], marks: { vertex: true, axis: true }, window: { x0: -4, x1: 7, y0: -5, y1: 7 } },
      explorer: true,
      prereqs: ["quad.basics"], related: ["quad.axis", "quad.transform", "quad.sketch", "quad.complete_square"], difficulty: 1,
      tr: {
        fr: { title: "Forme canonique", summary: "Dans y = a(x − h)² + k, le sommet est (h, k) et l'axe de symétrie est x = h." },
        es: { title: "Forma vértice", summary: "En y = a(x − h)² + k, el vértice es (h, k) y el eje de simetría es x = h." },
        de: { title: "Scheitelpunktform", summary: "In y = a(x − h)² + k ist der Scheitelpunkt (h, k) und die Symmetrieachse x = h." },
        zh: { title: "顶点式", summary: "在 y = a(x − h)² + k 中，顶点是 (h, k)，对称轴是 x = h。" },
      },
    }),
    C({
      id: "quad.axis", unit: "quadratics", title: "Axis of symmetry and mirror points",
      summary: R`Every parabola is symmetric about the vertical line \(x = h\). Points at the same height are mirror images.`,
      keywords: ["axis of symmetry", "symmetry", "mirror", "midpoint", "x = h", "same y-value"],
      intuition: "Fold the graph along the axis and the two halves match exactly, so anything at the same height sits the same distance either side.",
      explanation: [
        R`The <b>axis of symmetry</b> is the vertical line through the vertex, \(x = h\).`,
        R`If two points of the parabola have the same y-value, the axis is exactly halfway between their x-values: \(h = \frac{x_1 + x_2}{2}\). The x-intercepts are one such pair.`,
        R`Going the other way, the mirror image of \(x_1\) is \(x_2 = 2h - x_1\).`,
        R`In standard form, the axis is \(x = -\frac{b}{2a}\).`,
      ],
      notation: [{ sym: "x = h", means: "equation of the axis (a vertical line)" }, { sym: "2h − x₁", means: "mirror image of x₁ across the axis" }],
      rules: [{ name: "Midpoint", tex: R`h = \frac{x_1 + x_2}{2} \text{ when } f(x_1) = f(x_2)` }, { name: "Mirror", tex: R`x_2 = 2h - x_1` }, { name: "From standard form", tex: R`x = -\frac{b}{2a}` }],
      examples: [
        { title: R`\(f(-1) = f(7) = 12\). Find the axis.`, steps: [R`Same height, so the axis is halfway: \(\frac{-1 + 7}{2} = 3\).`], answer: R`\(x = 3\)` },
        { title: R`Vertex \(\left(2, 5\right)\), and \(\left(-1, 8\right)\) is on the graph. Find another point with \(y = 8\).`, steps: [R`Mirror across \(x = 2\): \(2\left(2\right) - \left(-1\right) = 5\).`], answer: R`\(\left(5, 8\right)\)` },
      ],
      mistakes: [{ wrong: "Writing the axis as y = h or just h.", fix: "It's a vertical line: x = h." }, { wrong: "Forgetting to divide by 2 when finding the midpoint.", fix: "Average the two x-values: add them, then halve." }],
      strategies: ["Look for any two points at the same height.", "Once you know h, mirror points to plot both sides quickly."],
      graph: { fns: [{ a: 1, h: 1, k: -4 }], marks: { vertex: true, axis: true, xint: true }, window: { x0: -4, x1: 6, y0: -5, y1: 6 } },
      prereqs: ["quad.vertex_form"], related: ["quad.standard_vertex", "quad.sketch"], difficulty: 1,
      tr: {
        fr: { title: "Axe de symétrie et points symétriques", summary: "Toute parabole est symétrique par rapport à la droite x = h. Les points de même hauteur sont symétriques." },
        es: { title: "Eje de simetría y puntos simétricos", summary: "Toda parábola es simétrica respecto de la recta x = h. Los puntos a la misma altura son imágenes espejo." },
        de: { title: "Symmetrieachse und Spiegelpunkte", summary: "Jede Parabel ist symmetrisch zur Geraden x = h. Punkte auf gleicher Höhe liegen spiegelbildlich." },
        zh: { title: "对称轴与对称点", summary: "每条抛物线都关于竖直线 x = h 对称；同一高度的点互为镜像。" },
      },
    }),
    C({
      id: "quad.standard_vertex", unit: "quadratics", title: "Vertex from standard form",
      summary: R`For \(y = ax^2 + bx + c\), the vertex is at \(x = -\frac{b}{2a}\); substitute to get the y-coordinate.`,
      keywords: ["-b/2a", "vertex from standard form", "h = -b/2a", "substitute", "find the vertex"],
      intuition: "The vertex sits halfway between any two points at the same height, and −b/(2a) is exactly that halfway point.",
      explanation: [
        R`The points where \(y = c\) are \(x = 0\) and \(x = -\frac{b}{a}\) (solve \(ax^2 + bx = 0\)). The axis is halfway between them: \(h = -\frac{b}{2a}\).`,
        R`Then substitute \(h\) into the function: \(k = f(h)\). You can also use \(k = c - \frac{b^2}{4a}\).`,
        R`Watch the minus signs: if \(b = -12\) and \(a = 2\), then \(h = -\frac{-12}{4} = 3\).`,
      ],
      rules: [{ name: "x-coordinate", tex: R`h = -\frac{b}{2a}` }, { name: "y-coordinate", tex: R`k = f(h) = c - \frac{b^2}{4a}` }],
      examples: [
        { title: R`Vertex of \(y = 2x^2 - 12x + 19\)`, steps: [R`\(h = -\frac{-12}{2\left(2\right)} = 3\).`, R`\(k = 2\left(3\right)^2 - 12\left(3\right) + 19 = 18 - 36 + 19 = 1\).`], answer: R`\(\left(3, 1\right)\), a minimum` },
        { title: R`Maximum value of \(y = -x^2 + 5x - 2\)`, steps: [R`\(h = -\frac{5}{2\left(-1\right)} = \frac{5}{2}\).`, R`\(k = -\left(\frac{5}{2}\right)^2 + 5\left(\frac{5}{2}\right) - 2 = -\frac{25}{4} + \frac{50}{4} - \frac{8}{4} = \frac{17}{4}\).`], answer: R`\(\frac{17}{4}\)` },
      ],
      mistakes: [{ wrong: "Using h = b/(2a) (dropping the minus sign).", fix: "h = −b/(2a). With b negative, h usually comes out positive." }, { wrong: "Using c as the y-coordinate of the vertex.", fix: "c is the y-intercept. Substitute h to get k." }],
      strategies: ["Write a and b with their signs before you substitute.", "Check with symmetry: f(h − 1) should equal f(h + 1)."],
      prereqs: ["quad.vertex_form", "quad.axis"], related: ["quad.complete_square", "quad.applications"], difficulty: 2,
      tr: {
        fr: { title: "Sommet à partir de la forme développée", summary: "Pour y = ax² + bx + c, le sommet est en x = −b/(2a) ; on remplace pour obtenir l'ordonnée." },
        es: { title: "Vértice desde la forma estándar", summary: "Para y = ax² + bx + c, el vértice está en x = −b/(2a); sustituye para obtener la coordenada y." },
        de: { title: "Scheitelpunkt aus der Normalform", summary: "Für y = ax² + bx + c liegt der Scheitelpunkt bei x = −b/(2a); einsetzen ergibt die y-Koordinate." },
        zh: { title: "由一般式求顶点", summary: "对 y = ax² + bx + c，顶点横坐标 x = −b/(2a)，代入求纵坐标。" },
      },
    }),
    C({
      id: "quad.complete_square", unit: "quadratics", title: "Completing the square",
      summary: R`Rewrite \(ax^2 + bx + c\) as \(a(x - h)^2 + k\) by adding and subtracting \(\left(\frac{b}{2a}\right)^2\) inside a bracket.`,
      keywords: ["completing the square", "complete the square", "convert to vertex form", "perfect square", "half the coefficient"],
      intuition: "x² + 6x is almost (x + 3)² = x² + 6x + 9. Add the missing 9, then take it away again so nothing changes.",
      explanation: [
        R`A perfect square looks like \(\left(x + p\right)^2 = x^2 + 2px + p^2\). So \(x^2 + bx\) becomes a perfect square once you add \(\left(\frac{b}{2}\right)^2\).`,
        R`<b>Steps.</b> (1) Factor \(a\) out of the \(x^2\) and \(x\) terms. (2) Inside the bracket, add and subtract half the \(x\)-coefficient, squared. (3) The first three terms form \(\left(x - h\right)^2\). (4) Move the subtracted square out of the bracket, <b>multiplying it by \(a\)</b>. (5) Combine constants.`,
        R`Adding and subtracting the same number changes nothing, which is why the function stays equal at every step. You can check any line by expanding it back.`,
      ],
      rules: [{ name: "Key identity", tex: R`x^2 + bx = \left(x + \frac{b}{2}\right)^2 - \left(\frac{b}{2}\right)^2` }, { name: "Result", tex: R`ax^2 + bx + c = a\left(x + \frac{b}{2a}\right)^2 + c - \frac{b^2}{4a}` }],
      examples: [
        { title: R`Write \(y = x^2 - 6x + 11\) in vertex form`, steps: [R`Half of \(-6\) is \(-3\); \(\left(-3\right)^2 = 9\).`, R`\(y = x^2 - 6x + 9 - 9 + 11\).`, R`\(y = \left(x - 3\right)^2 + 2\).`], answer: R`\(y = \left(x - 3\right)^2 + 2\), vertex \(\left(3, 2\right)\)` },
        { title: R`Write \(y = 2x^2 + 6x - 1\) in vertex form`, steps: [R`Factor 2 from the \(x\)-terms: \(y = 2\left(x^2 + 3x\right) - 1\).`, R`Half of 3 is \(\frac{3}{2}\); squared, \(\frac{9}{4}\): \(y = 2\left(x^2 + 3x + \frac{9}{4} - \frac{9}{4}\right) - 1\).`, R`Take \(-\frac{9}{4}\) out, times 2: \(y = 2\left(x + \frac{3}{2}\right)^2 - \frac{9}{2} - 1\).`, R`\(y = 2\left(x + \frac{3}{2}\right)^2 - \frac{11}{2}\).`], answer: R`Vertex \(\left(-\frac{3}{2}, -\frac{11}{2}\right)\)` },
      ],
      mistakes: [
        { wrong: "Forgetting to multiply the subtracted square by a when it leaves the bracket.", fix: "Everything inside the bracket is multiplied by a, so −9/4 becomes −9/2 when a = 2." },
        { wrong: "Squaring the whole x-coefficient instead of half of it.", fix: "Use (b/2)², or (b/2a)² after factoring out a." },
        { wrong: "Adding the square without subtracting it.", fix: "Add and subtract the same amount so the function doesn't change." },
      ],
      strategies: ["Check by expanding your answer: you should get the original.", "With fractions, keep them as fractions; decimals hide mistakes."],
      prereqs: ["quad.vertex_form", "factoring.special"], related: ["quad.standard_vertex", "quad.formula"], difficulty: 3,
      tr: {
        fr: { title: "Compléter le carré", summary: "Réécrire ax² + bx + c sous la forme a(x − h)² + k en ajoutant et retirant (b/2a)² dans une parenthèse." },
        es: { title: "Completar el cuadrado", summary: "Reescribe ax² + bx + c como a(x − h)² + k sumando y restando (b/2a)² dentro de un paréntesis." },
        de: { title: "Quadratische Ergänzung", summary: "ax² + bx + c wird zu a(x − h)² + k, indem man (b/2a)² in einer Klammer addiert und wieder subtrahiert." },
        zh: { title: "配方法", summary: "在括号内加上并减去 (b/2a)²，把 ax² + bx + c 写成 a(x − h)² + k。" },
      },
    }),
    C({
      id: "quad.transform", unit: "quadratics", title: "Transformations of y = x²",
      summary: R`\(a\) stretches, compresses or reflects; \(h\) shifts left or right; \(k\) shifts up or down.`,
      keywords: ["transformation", "translation", "shift", "stretch", "compression", "reflection", "f(x - d)", "-f(x)", "narrower", "wider"],
      intuition: "Start from y = x² and apply the changes one at a time: squash or stretch it, flip it, then slide it into place.",
      explanation: [
        R`<b>Vertical stretch or compression.</b> \(y = ax^2\) multiplies every y-value by \(|a|\). If \(|a| > 1\) the graph is narrower (stretched); if \(0 < |a| < 1\) it's wider (compressed).`,
        R`<b>Reflection.</b> A negative \(a\) flips the graph over the x-axis.`,
        R`<b>Horizontal shift.</b> Replacing \(x\) with \(x - h\) moves the graph \(h\) units right (left if \(h\) is negative). In general \(y = f(x - d)\) is \(f\) moved \(d\) units right.`,
        R`<b>Vertical shift.</b> Adding \(k\) moves the graph \(k\) units up.`,
        R`\(y = -f(x)\) reflects \(f\) in the x-axis, so its vertex \(\left(h, k\right)\) becomes \(\left(h, -k\right)\).`,
      ],
      rules: [{ name: "Vertex form", tex: R`y = a\left(x - h\right)^2 + k` }, { name: "Shift right d", tex: R`f(x) \to f(x - d)` }, { name: "Reflect", tex: R`f(x) \to -f(x)` }],
      examples: [
        { title: R`Describe \(y = -3\left(x + 2\right)^2 + 5\) from \(y = x^2\)`, steps: [R`\(a = -3\): reflection in the x-axis and a vertical stretch by 3.`, R`\(h = -2\): shift 2 left. \(k = 5\): shift 5 up.`], answer: "Reflect, stretch by 3, left 2, up 5" },
        { title: R`\(y = x^2\) is compressed by \(\frac{1}{2}\), moved 4 right and 1 down`, steps: [R`\(a = \frac{1}{2}\), \(h = 4\), \(k = -1\).`], answer: R`\(y = \frac{1}{2}\left(x - 4\right)^2 - 1\)` },
      ],
      mistakes: [{ wrong: "Thinking (x + 2) moves the graph right.", fix: "(x + 2) = (x − (−2)), so it moves 2 left." }, { wrong: "Calling a = 1/3 a stretch.", fix: "|a| < 1 is a vertical compression: the graph gets wider." }],
      strategies: ["Track the vertex and a separately.", "Use the explorer in Vertex form to test a guess."],
      graph: { fns: [{ a: 1, h: 0, k: 0 }, { a: -2, h: 2, k: 3 }], labels: ["y = x²", "transformed"], styles: ["dashed", ""], marks: { vertex: true }, window: { x0: -5, x1: 6, y0: -4, y1: 7 } },
      prereqs: ["quad.vertex_form"], related: ["quad.direction", "quad.sketch"], difficulty: 2,
      tr: {
        fr: { title: "Transformations de y = x²", summary: "a étire, comprime ou réfléchit ; h translate à gauche ou à droite ; k translate vers le haut ou le bas." },
        es: { title: "Transformaciones de y = x²", summary: "a estira, comprime o refleja; h desplaza a izquierda o derecha; k desplaza arriba o abajo." },
        de: { title: "Transformationen von y = x²", summary: "a streckt, staucht oder spiegelt; h verschiebt nach links oder rechts; k nach oben oder unten." },
        zh: { title: "y = x² 的变换", summary: "a 控制伸缩或翻折；h 左右平移；k 上下平移。" },
      },
    }),
    C({
      id: "quad.graph_read", unit: "quadratics", title: "Reading graphs and tables",
      summary: "Read the vertex, axis, intercepts and direction from a graph; use symmetry and second differences in a table.",
      keywords: ["read graph", "table of values", "second differences", "finite differences", "key features", "interpret graph"],
      intuition: "A graph and a table are the same function in pictures and numbers. Symmetry is your best tool in both.",
      explanation: [
        R`On a graph: the <b>vertex</b> is the turning point; the <b>axis</b> is the vertical line through it; the <b>x-intercepts</b> are where it meets the x-axis (\(y = 0\)); the <b>y-intercept</b> is where it meets the y-axis (\(x = 0\)).`,
        R`In a table with equally spaced x-values, matching y-values come in pairs around the axis. The vertex is at the centre of the pattern.`,
        R`For a quadratic, the <b>second differences</b> are constant. When x goes up by 1 each step, the second difference equals \(2a\).`,
      ],
      rules: [{ name: "Second differences", tex: R`\Delta^2 y = 2a \quad (\Delta x = 1)` }],
      examples: [
        { title: "Table: x = 0, 1, 2, 3, 4 gives y = 7, 1, −1, 1, 7", steps: ["y = 1 at x = 1 and x = 3, so the axis is x = 2.", R`Vertex \(\left(2, -1\right)\).`, "First differences: −6, −2, 2, 6. Second differences: 4, 4, 4, so 2a = 4 and a = 2."], answer: R`\(y = 2\left(x - 2\right)^2 - 1\)` },
        { title: R`Read the graph of \(y = x^2 - 2x - 3\) (shown above)`, steps: [R`It crosses the x-axis at \(x = -1\) and \(x = 3\).`, R`Axis halfway: \(x = 1\). Vertex \(\left(1, -4\right)\).`, R`It crosses the y-axis at \(y = -3\).`], answer: R`Vertex \(\left(1, -4\right)\), zeros \(-1, 3\), y-intercept \(-3\)` },
      ],
      mistakes: [{ wrong: "Reading the y-intercept as the vertex.", fix: "The y-intercept is on the y-axis (x = 0). The vertex is the turning point." }, { wrong: "Using first differences to find a.", fix: "First differences change; use the constant second difference = 2a." }],
      strategies: ["Find matching y-values first.", "Count grid squares carefully: check what each gridline represents."],
      graph: { fns: [{ a: 1, b: -2, c: -3 }], marks: { vertex: true, xint: true, yint: true, axis: true }, window: { x0: -4, x1: 6, y0: -5, y1: 6 } },
      prereqs: ["quad.vertex_form", "quad.axis"], related: ["quad.intercepts", "quad.equation_from"], difficulty: 2,
      tr: {
        fr: { title: "Lire des graphiques et des tableaux", summary: "Lire sommet, axe, intersections et sens d'ouverture sur un graphique ; utiliser la symétrie et les différences secondes dans un tableau." },
        es: { title: "Leer gráficas y tablas", summary: "Lee el vértice, el eje, los interceptos y la dirección en una gráfica; usa la simetría y las segundas diferencias en una tabla." },
        de: { title: "Graphen und Tabellen lesen", summary: "Scheitelpunkt, Achse, Achsenschnittpunkte und Richtung aus dem Graphen ablesen; in Tabellen Symmetrie und zweite Differenzen nutzen." },
        zh: { title: "读图与读表", summary: "从图像读出顶点、对称轴、截距和开口方向；在表格中利用对称性和二阶差分。" },
      },
    }),
    C({
      id: "quad.sketch", unit: "quadratics", title: "Sketching a parabola",
      summary: "Plot the vertex, then use a and symmetry: from the vertex, step 1 across and a up, 2 across and 4a up.",
      keywords: ["sketch", "plot", "graph a parabola", "step pattern", "1 3 5", "draw"],
      intuition: "Every parabola is y = x² stretched and moved, so the same step pattern works from any vertex.",
      explanation: [
        R`<b>1.</b> Plot the vertex \(\left(h, k\right)\). <b>2.</b> From the vertex, 1 step right changes \(y\) by \(a\), 2 steps by \(4a\), 3 steps by \(9a\). <b>3.</b> Mirror those points across the axis. <b>4.</b> Add intercepts if you know them. <b>5.</b> Draw a smooth U through the points (never a V).`,
        R`In standard form, find the vertex first with \(h = -\frac{b}{2a}\), or complete the square.`,
        R`In the plotter, place the vertex and then one more point: those two points pin down the whole parabola.`,
      ],
      rules: [{ name: "Step pattern", tex: R`\left(h \pm 1,\ k + a\right),\ \left(h \pm 2,\ k + 4a\right)` }],
      examples: [{ title: R`Sketch \(y = -2\left(x - 1\right)^2 + 3\)`, steps: [R`Vertex \(\left(1, 3\right)\), opens down.`, R`1 step: \(y = 3 - 2 = 1\), at \(x = 0\) and \(x = 2\).`, R`2 steps: \(y = 3 - 8 = -5\), at \(x = -1\) and \(x = 3\).`], answer: "Smooth downward curve through (−1, −5), (0, 1), (1, 3), (2, 1), (3, −5)" },
        { title: R`Sketch \(y = x^2 - 4x + 1\)`, steps: [R`Vertex: \(h = -\frac{-4}{2\left(1\right)} = 2\), \(k = 4 - 8 + 1 = -3\).`, R`1 step: \(y = -3 + 1 = -2\) at \(x = 1, 3\). 2 steps: \(y = -3 + 4 = 1\) at \(x = 0, 4\).`], answer: "Upward curve through (0, 1), (1, −2), (2, −3), (3, −2), (4, 1)" }],
      mistakes: [{ wrong: "Using the same step for every point (1 across, a up, again 1 across, a up).", fix: "Measure each point from the vertex: 1 → a, 2 → 4a, 3 → 9a." }, { wrong: "Drawing a pointed V at the vertex.", fix: "A parabola is smooth and rounded at the vertex." }],
      strategies: ["Vertex first, then the 1-step points, then mirror."],
      graph: { fns: [{ a: -2, h: 1, k: 3 }], marks: { vertex: true, axis: true }, points: [{ x: 0, y: 1 }, { x: 2, y: 1 }, { x: -1, y: -5 }, { x: 3, y: -5 }], window: { x0: -3, x1: 5, y0: -6, y1: 5 } },
      prereqs: ["quad.vertex_form", "quad.axis"], related: ["quad.transform", "quad.graph_read"], difficulty: 2,
      tr: {
        fr: { title: "Tracer une parabole", summary: "Placer le sommet, puis utiliser a et la symétrie : 1 pas → a, 2 pas → 4a." },
        es: { title: "Trazar una parábola", summary: "Ubica el vértice y usa a y la simetría: 1 paso → a, 2 pasos → 4a." },
        de: { title: "Eine Parabel skizzieren", summary: "Scheitelpunkt einzeichnen, dann a und Symmetrie nutzen: 1 Schritt → a, 2 Schritte → 4a." },
        zh: { title: "画抛物线", summary: "先画顶点，再利用 a 和对称性：走 1 步变化 a，走 2 步变化 4a。" },
      },
    }),
    C({
      id: "quad.intercepts", unit: "quadratics", title: "Intercepts of a parabola",
      summary: R`The y-intercept is \(f(0)\). The x-intercepts (zeros) solve \(f(x) = 0\).`,
      keywords: ["intercepts", "x-intercept", "y-intercept", "zeros", "roots", "solutions", "where it crosses"],
      intuition: "Intercepts are where the graph touches an axis: on the y-axis x is 0, on the x-axis y is 0.",
      explanation: [
        R`<b>y-intercept:</b> set \(x = 0\). In standard form it's simply \(c\). In vertex form it's \(ah^2 + k\) (not \(k\)!). In factored form it's \(a\cdot r \cdot s\).`,
        R`<b>x-intercepts</b> (also called zeros or roots): set \(y = 0\) and solve. Use factoring, the vertex form (isolate the square), or the quadratic formula.`,
        R`A parabola has 0, 1 or 2 x-intercepts, but always exactly one y-intercept.`,
        R`In context, intercepts have meaning: the x-intercept of a height function is when the object hits the ground; the y-intercept is the starting height.`,
      ],
      rules: [{ name: "y-intercept", tex: R`f(0) = c = ah^2 + k = a\,r\,s` }, { name: "x-intercepts", tex: R`f(x) = 0` }],
      examples: [{ title: R`Intercepts of \(y = 2\left(x - 1\right)^2 - 8\)`, steps: [R`y-intercept: \(2\left(0 - 1\right)^2 - 8 = -6\).`, R`x-intercepts: \(2\left(x - 1\right)^2 = 8\), \(\left(x - 1\right)^2 = 4\), \(x - 1 = \pm 2\).`], answer: R`\(\left(0, -6\right)\); \(x = -1\) and \(x = 3\)` },
        { title: R`Intercepts of \(y = -\left(x - 4\right)\left(x + 2\right)\)`, steps: [R`y-intercept: \(-\left(0 - 4\right)\left(0 + 2\right) = 8\).`, R`x-intercepts: \(x = 4\) and \(x = -2\).`], answer: R`\(\left(0, 8\right)\); \(x = -2\) and \(x = 4\)` }],
      mistakes: [{ wrong: "Using k as the y-intercept in vertex form.", fix: "Substitute x = 0: the y-intercept is a·h² + k." }, { wrong: "Taking only the positive square root.", fix: "x − h = ±√(…): there are two solutions when the right side is positive." }],
      strategies: ["Always substitute: x = 0 for the y-intercept, y = 0 for the x-intercepts."],
      graph: { fns: [{ a: 2, h: 1, k: -8 }], marks: { xint: true, yint: true }, window: { x0: -4, x1: 6, y0: -9, y1: 6 } },
      prereqs: ["quad.basics"], related: ["quad.factored_form", "quad.formula", "quad.discriminant"], difficulty: 1,
      tr: {
        fr: { title: "Intersections avec les axes", summary: "L'ordonnée à l'origine est f(0). Les zéros résolvent f(x) = 0." },
        es: { title: "Interceptos de una parábola", summary: "El intercepto y es f(0). Los interceptos x (ceros) resuelven f(x) = 0." },
        de: { title: "Achsenschnittpunkte einer Parabel", summary: "Der y-Achsenabschnitt ist f(0). Die Nullstellen lösen f(x) = 0." },
        zh: { title: "抛物线的截距", summary: "y 轴截距是 f(0)；x 轴截距（零点）满足 f(x) = 0。" },
      },
    }),
    C({
      id: "quad.factored_form", unit: "quadratics", title: "Factored form and zeros",
      summary: R`In \(y = a(x - r)(x - s)\), the zeros are \(x = r\) and \(x = s\), and the vertex is halfway between them.`,
      keywords: ["factored form", "zeros", "roots", "zero product property", "intercept form", "(x - r)(x - s)"],
      intuition: "A product is zero only if one of its factors is zero, so each bracket gives one x-intercept.",
      explanation: [
        R`<b>Zero product property:</b> if \(PQ = 0\) then \(P = 0\) or \(Q = 0\). So \(a\left(x - r\right)\left(x - s\right) = 0\) when \(x = r\) or \(x = s\).`,
        R`Each zero has the opposite sign to the number in its bracket: \(\left(x + 5\right)\) gives \(x = -5\). If the bracket is \(\left(2x - 3\right)\), solve \(2x - 3 = 0\) to get \(x = \frac{3}{2}\).`,
        R`The vertex lies halfway between the zeros: \(h = \frac{r + s}{2}\). Substitute \(h\) to get \(k\).`,
        R`The factor \(a\) stretches the graph but never creates a zero.`,
      ],
      rules: [{ name: "Zeros", tex: R`y = a\left(x - r\right)\left(x - s\right) \Rightarrow x = r,\ x = s` }, { name: "Axis", tex: R`h = \frac{r + s}{2}` }],
      examples: [{ title: R`Analyse \(y = -\left(x + 1\right)\left(x - 5\right)\)`, steps: [R`Zeros: \(x = -1\), \(x = 5\).`, R`Axis: \(h = \frac{-1 + 5}{2} = 2\).`, R`\(k = -\left(2 + 1\right)\left(2 - 5\right) = 9\).`], answer: R`Vertex \(\left(2, 9\right)\), opens down` },
        { title: R`Zeros of \(y = 3\left(2x - 5\right)\left(x + 1\right)\)`, steps: [R`\(2x - 5 = 0\) gives \(x = \frac{5}{2}\).`, R`\(x + 1 = 0\) gives \(x = -1\). The 3 never gives a zero.`], answer: R`\(x = \frac{5}{2}\) and \(x = -1\)` }],
      mistakes: [{ wrong: "Reading (x + 5) as the zero x = 5.", fix: "Solve x + 5 = 0: x = −5." }, { wrong: "Forgetting to divide by the x-coefficient in (2x − 3).", fix: "2x − 3 = 0 gives x = 3/2." }],
      strategies: ["Set each factor to zero and solve it on its own.", "Use the midpoint of the zeros to find the vertex fast."],
      graph: { fns: [{ a: -1, b: 4, c: 5 }], marks: { xint: true, vertex: true, axis: true }, window: { x0: -3, x1: 7, y0: -3, y1: 10 } },
      prereqs: ["quad.intercepts", "factoring.trinomials"], related: ["quad.axis", "quad.formula", "quad.equation_from"], difficulty: 2,
      tr: {
        fr: { title: "Forme factorisée et zéros", summary: "Dans y = a(x − r)(x − s), les zéros sont r et s, et le sommet est au milieu." },
        es: { title: "Forma factorizada y ceros", summary: "En y = a(x − r)(x − s), los ceros son r y s, y el vértice está a medio camino." },
        de: { title: "Faktorisierte Form und Nullstellen", summary: "In y = a(x − r)(x − s) sind r und s die Nullstellen; der Scheitelpunkt liegt in der Mitte." },
        zh: { title: "交点式与零点", summary: "在 y = a(x − r)(x − s) 中，零点是 r 和 s，顶点位于两者中间。" },
      },
    }),
    C({
      id: "quad.formula", unit: "quadratics", title: "The quadratic formula",
      summary: R`The solutions of \(ax^2 + bx + c = 0\) are \(x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}\). Give exact answers in simplest radical form.`,
      keywords: ["quadratic formula", "solve quadratic", "exact roots", "radical roots", "irrational zeros"],
      intuition: "It's completing the square done once, for every quadratic at the same time.",
      explanation: [
        R`The formula comes from completing the square on \(ax^2 + bx + c = 0\). It works for every quadratic, including ones that don't factor.`,
        R`<b>Steps.</b> Write the equation as \(= 0\). Read \(a\), \(b\), \(c\) with signs. Compute the discriminant \(b^2 - 4ac\) first. Then substitute and simplify the radical.`,
        R`<b>Exact form.</b> Simplify the square root, then reduce: \(\frac{4 \pm 2\sqrt{3}}{2} = 2 \pm \sqrt{3}\). Only divide if every term on top shares the factor.`,
        R`The two answers are symmetric about the axis \(x = -\frac{b}{2a}\): the formula is "axis ± a distance".`,
      ],
      rules: [{ name: "Quadratic formula", tex: R`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}` }],
      examples: [{ title: R`Solve \(2x^2 - 4x - 3 = 0\)`, steps: [R`\(a = 2\), \(b = -4\), \(c = -3\).`, R`\(b^2 - 4ac = 16 + 24 = 40\).`, R`\(x = \frac{4 \pm \sqrt{40}}{4} = \frac{4 \pm 2\sqrt{10}}{4} = \frac{2 \pm \sqrt{10}}{2}\).`], answer: R`\(x = \frac{2 \pm \sqrt{10}}{2}\)` },
        { title: R`Solve \(x^2 + 6x + 4 = 0\)`, steps: [R`\(b^2 - 4ac = 36 - 16 = 20\).`, R`\(x = \frac{-6 \pm \sqrt{20}}{2} = \frac{-6 \pm 2\sqrt{5}}{2} = -3 \pm \sqrt{5}\).`], answer: R`\(x = -3 \pm \sqrt{5}\)` }],
      mistakes: [{ wrong: "Writing −b as −4 when b = −4.", fix: "−b = −(−4) = 4. Put b in brackets when you substitute." }, { wrong: "Dividing only the first term by 2a.", fix: "The fraction bar covers the whole numerator −b ± √(…)." }, { wrong: "Leaving √40 unsimplified.", fix: "√40 = 2√10; then reduce the whole fraction." }],
      strategies: ["Compute b² − 4ac separately before anything else.", "Try factoring first; use the formula when it doesn't factor nicely."],
      prereqs: ["quad.intercepts", "radicals.simplify"], related: ["quad.discriminant", "quad.complete_square"], difficulty: 2,
      tr: {
        fr: { title: "La formule quadratique", summary: "Les solutions de ax² + bx + c = 0 sont x = (−b ± √(b² − 4ac)) / (2a). Donner des valeurs exactes." },
        es: { title: "La fórmula cuadrática", summary: "Las soluciones de ax² + bx + c = 0 son x = (−b ± √(b² − 4ac)) / (2a). Da respuestas exactas." },
        de: { title: "Die Lösungsformel", summary: "Die Lösungen von ax² + bx + c = 0 sind x = (−b ± √(b² − 4ac)) / (2a). Exakte Werte angeben." },
        zh: { title: "求根公式", summary: "ax² + bx + c = 0 的解为 x = (−b ± √(b² − 4ac)) / (2a)，要给出精确值。" },
      },
    }),
    C({
      id: "quad.discriminant", unit: "quadratics", title: "The discriminant and the number of roots",
      summary: R`\(b^2 - 4ac\) tells you how many x-intercepts a parabola has: positive → 2, zero → 1, negative → 0.`,
      keywords: ["discriminant", "b^2-4ac", "number of roots", "real roots", "no solution", "one solution", "tangent"],
      intuition: "The discriminant is what sits under the square root in the formula. You can't take the square root of a negative, so then there are no real roots.",
      explanation: [
        R`In the quadratic formula, \(\sqrt{b^2 - 4ac}\) decides everything. If it's positive, "\(\pm\)" gives two different answers. If it's zero, both answers are the same. If it's negative, there are no real answers.`,
        R`Graph view: the vertex position and direction tell the same story. Vertex below the x-axis and opening up → 2 crossings. Vertex on the axis → 1. Vertex above the axis and opening up → 0.`,
        R`<b>Parameter questions.</b> "For what k is there exactly one root?" means set \(b^2 - 4ac = 0\) and solve for k.`,
      ],
      rules: [{ name: "Discriminant", tex: R`D = b^2 - 4ac` }, { name: "Cases", tex: R`D > 0: 2 \quad D = 0: 1 \quad D < 0: 0` }],
      examples: [{ title: R`For what \(k\) does \(x^2 + 6x + k = 0\) have one root?`, steps: [R`Set \(D = 0\): \(6^2 - 4\left(1\right)k = 0\).`, R`\(36 = 4k\).`], answer: R`\(k = 9\)` },
        { title: R`How many x-intercepts does \(y = 2x^2 - 3x + 5\) have?`, steps: [R`\(D = \left(-3\right)^2 - 4\left(2\right)\left(5\right) = 9 - 40 = -31\).`, "Negative, so no real roots."], answer: "None" }],
      mistakes: [{ wrong: "Computing b² as −b² when b is negative.", fix: "Squares are never negative: (−6)² = 36." }, { wrong: "Thinking D < 0 means the equation has negative roots.", fix: "D < 0 means no real roots at all." }],
      strategies: ["When the question is 'how many', you don't need the roots, only the sign of D."],
      graph: { fns: [{ a: 1, h: 0, k: -3 }, { a: 1, h: 0, k: 0 }, { a: 1, h: 0, k: 2 }], labels: ["D > 0", "D = 0", "D < 0"], styles: ["", "alt", "dashed"], window: { x0: -4, x1: 4, y0: -4, y1: 6 } },
      prereqs: ["quad.formula"], related: ["quad.intercepts", "quad.direction"], difficulty: 2,
      tr: {
        fr: { title: "Le discriminant et le nombre de racines", summary: "b² − 4ac indique le nombre d'intersections avec l'axe des x : positif → 2, nul → 1, négatif → 0." },
        es: { title: "El discriminante y el número de raíces", summary: "b² − 4ac indica cuántos interceptos x hay: positivo → 2, cero → 1, negativo → 0." },
        de: { title: "Diskriminante und Anzahl der Nullstellen", summary: "b² − 4ac zeigt, wie viele Nullstellen es gibt: positiv → 2, null → 1, negativ → 0." },
        zh: { title: "判别式与根的个数", summary: "b² − 4ac 决定 x 轴交点个数：正 → 2，零 → 1，负 → 0。" },
      },
    }),
    C({
      id: "quad.equation_from", unit: "quadratics", title: "Writing the equation from features",
      summary: "Choose the form that matches what you know (vertex or zeros), then use one more point to find a.",
      keywords: ["write the equation", "find the equation", "find a", "vertex and a point", "zeros and a point", "model"],
      intuition: "The vertex or the zeros fix where the parabola is; one extra point fixes how steep it is.",
      explanation: [
        R`<b>Know the vertex?</b> Start with \(y = a\left(x - h\right)^2 + k\). Substitute another point \(\left(x, y\right)\) and solve for \(a\).`,
        R`<b>Know the zeros?</b> Start with \(y = a\left(x - r\right)\left(x - s\right)\). Substitute another point to find \(a\).`,
        R`<b>Have a table?</b> Use symmetry for the vertex and second differences (\(2a\)) for \(a\).`,
        R`Always check: your equation should give the right y-value at every point you used.`,
      ],
      rules: [{ name: "From the vertex", tex: R`a = \frac{y - k}{\left(x - h\right)^2}` }, { name: "From the zeros", tex: R`a = \frac{y}{\left(x - r\right)\left(x - s\right)}` }],
      examples: [{ title: R`Vertex \(\left(1, -4\right)\), through \(\left(3, 4\right)\)`, steps: [R`\(y = a\left(x - 1\right)^2 - 4\).`, R`\(4 = a\left(3 - 1\right)^2 - 4\), so \(8 = 4a\) and \(a = 2\).`], answer: R`\(y = 2\left(x - 1\right)^2 - 4\)` },
        { title: R`Zeros \(-3\) and \(1\), through \(\left(0, 6\right)\)`, steps: [R`\(y = a\left(x + 3\right)\left(x - 1\right)\).`, R`\(6 = a\left(0 + 3\right)\left(0 - 1\right) = -3a\), so \(a = -2\).`], answer: R`\(y = -2\left(x + 3\right)\left(x - 1\right)\)` }],
      mistakes: [{ wrong: "Substituting the vertex itself to find a.", fix: "The vertex always works for any a. Use a different point." }, { wrong: "Forgetting a altogether and writing y = (x − h)² + k.", fix: "a is only 1 if the extra point says so. Always solve for it." }],
      strategies: ["Pick the form from the information given, then solve for a last."],
      graph: { fns: [{ a: 2, h: 1, k: -4 }], marks: { vertex: true }, points: [{ x: 3, y: 4, label: "(3, 4)" }], window: { x0: -3, x1: 5, y0: -5, y1: 6 } },
      prereqs: ["quad.vertex_form", "quad.factored_form"], related: ["quad.graph_read", "quad.applications"], difficulty: 2,
      tr: {
        fr: { title: "Écrire l'équation à partir de caractéristiques", summary: "Choisir la forme adaptée (sommet ou zéros), puis utiliser un autre point pour trouver a." },
        es: { title: "Escribir la ecuación a partir de características", summary: "Elige la forma que encaja (vértice o ceros) y usa un punto más para hallar a." },
        de: { title: "Die Gleichung aus Merkmalen aufstellen", summary: "Die passende Form wählen (Scheitelpunkt oder Nullstellen) und mit einem weiteren Punkt a bestimmen." },
        zh: { title: "由特征写出方程", summary: "根据已知（顶点或零点）选择形式，再用另一个点求 a。" },
      },
    }),
    C({
      id: "quad.applications", unit: "quadratics", title: "Maximum and minimum problems",
      summary: "In context, the vertex answers 'how high?', 'how much?' and 'when?': k is the best value and h is where it happens.",
      keywords: ["optimization", "projectile", "maximum height", "maximum area", "revenue", "word problem", "context", "applications"],
      intuition: "Whenever something rises then falls (or falls then rises), the turning point is the best (or worst) case.",
      explanation: [
        R`<b>Projectile:</b> for \(h(t) = -5t^2 + vt + h_0\), the maximum height is at \(t = -\frac{b}{2a}\) and equals the vertex's y-value. It lands when \(h(t) = 0\); keep only the positive time.`,
        R`<b>Area:</b> with a fixed amount of fencing, the area is a downward parabola in the width. The best width is the vertex.`,
        R`<b>Revenue:</b> revenue = price × quantity. If raising the price lowers sales steadily, revenue is a downward parabola.`,
        R`Units and sense-checks matter: time can't be negative, and lengths must be positive.`,
      ],
      rules: [{ name: "Best value", tex: R`\text{at } x = -\frac{b}{2a}` }],
      examples: [{ title: R`A ball's height is \(h(t) = -5t^2 + 20t + 1\). Find its maximum height.`, steps: [R`\(t = -\frac{20}{2\left(-5\right)} = 2\) s.`, R`\(h(2) = -20 + 40 + 1 = 21\) m.`], answer: "21 m, after 2 s" },
        { title: R`60 m of fence, three sides of a pen against a wall. Best width?`, steps: [R`\(A(x) = x\left(60 - 2x\right) = -2x^2 + 60x\).`, R`\(x = -\frac{60}{2\left(-2\right)} = 15\) m, so \(A = 15\left(30\right) = 450\) m².`], answer: "Width 15 m, area 450 m²" }],
      mistakes: [{ wrong: "Answering with t when the question asks for the height.", fix: "Read the question: 'when' is h (the x-value), 'how high' is k (the y-value)." }, { wrong: "Keeping a negative time.", fix: "Reject solutions that don't make sense in the situation." }],
      strategies: ["Write the function in standard form, find the vertex, then answer in words with units."],
      graph: { fns: [{ a: -5, b: 20, c: 1 }], marks: { vertex: true }, window: { x0: -1, x1: 5, y0: -2, y1: 24 } },
      prereqs: ["quad.standard_vertex", "quad.direction"], related: ["quad.formula", "quad.intercepts"], difficulty: 3,
      tr: {
        fr: { title: "Problèmes de maximum et de minimum", summary: "En contexte, le sommet répond à « combien ? » et « quand ? » : k est la meilleure valeur, h l'endroit où elle est atteinte." },
        es: { title: "Problemas de máximo y mínimo", summary: "En contexto, el vértice responde «¿cuánto?» y «¿cuándo?»: k es el mejor valor y h donde ocurre." },
        de: { title: "Extremwertaufgaben", summary: "Im Kontext beantwortet der Scheitelpunkt „wie viel?“ und „wann?“: k ist der beste Wert, h die Stelle." },
        zh: { title: "最值应用题", summary: "在实际问题中，顶点回答“最多多少”和“何时”：k 是最值，h 是取得最值的位置。" },
      },
    }),
  ];

  // ───────── formula reference ─────────
  const FORMULAS = [
    { id: "f.standard", name: "Standard form", tex: R`y = ax^2 + bx + c`, symbols: [["a", "leading coefficient, a ≠ 0"], ["b", "coefficient of x"], ["c", "constant term = y-intercept"]], when: "Reading the y-intercept; using the formula or the discriminant.", conditions: "a ≠ 0, otherwise it's linear.", example: R`\(y = 2x^2 - 12x + 19\): \(a = 2,\ b = -12,\ c = 19\).`, related: ["quad.basics"] },
    { id: "f.vertex", name: "Vertex form", tex: R`y = a\left(x - h\right)^2 + k`, symbols: [["(h, k)", "vertex"], ["x = h", "axis of symmetry"], ["a", "direction and width"]], when: "Reading the vertex, sketching, describing transformations.", conditions: "h appears with a minus sign: (x + 3) means h = −3.", example: R`\(y = 2\left(x - 3\right)^2 + 1\): vertex \(\left(3, 1\right)\).`, related: ["quad.vertex_form", "quad.transform"] },
    { id: "f.factored", name: "Factored form", tex: R`y = a\left(x - r\right)\left(x - s\right)`, symbols: [["r, s", "zeros (x-intercepts)"], ["a", "leading coefficient"]], when: "Reading zeros; writing an equation from intercepts.", conditions: "Only possible over the reals when the parabola has real zeros.", example: R`\(y = -\left(x + 1\right)\left(x - 5\right)\): zeros \(-1\) and \(5\).`, related: ["quad.factored_form", "quad.equation_from"] },
    { id: "f.h", name: "Vertex from standard form", tex: R`h = -\frac{b}{2a},\qquad k = f(h) = c - \frac{b^2}{4a}`, symbols: [["h", "x-coordinate of the vertex"], ["k", "y-coordinate: the max/min value"]], when: "Finding the vertex or the max/min without completing the square.", conditions: "Watch the signs of a and b.", example: R`\(y = 2x^2 - 12x + 19\): \(h = 3\), \(k = 1\).`, related: ["quad.standard_vertex", "quad.applications"] },
    { id: "f.axis", name: "Axis of symmetry", tex: R`x = h = \frac{x_1 + x_2}{2}`, symbols: [["x₁, x₂", "x-values of two points at the same height (e.g. the zeros)"]], when: "Finding the axis from zeros, a table, or matching y-values.", conditions: "The two points must have equal y-values.", example: R`Zeros \(-2\) and \(6\): axis \(x = 2\).`, related: ["quad.axis"] },
    { id: "f.mirror", name: "Mirror point", tex: R`x_2 = 2h - x_1`, symbols: [["x₁", "a known x-value"], ["x₂", "the x-value at the same height on the other side"]], when: "Plotting points by symmetry; finding a matching point.", conditions: "Uses the axis x = h.", example: R`Axis \(x = 2\), point at \(x = -1\): mirror at \(x = 5\).`, related: ["quad.axis", "quad.sketch"] },
    { id: "f.cts", name: "Completing the square", tex: R`x^2 + bx = \left(x + \frac{b}{2}\right)^2 - \left(\frac{b}{2}\right)^2`, symbols: [["b/2", "half the x-coefficient"]], when: "Converting standard form to vertex form.", conditions: "Factor out a first when a ≠ 1; multiply the subtracted square by a.", example: R`\(x^2 - 6x + 11 = \left(x - 3\right)^2 + 2\).`, related: ["quad.complete_square"] },
    { id: "f.formula", name: "Quadratic formula", tex: R`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`, symbols: [["±", "gives the two solutions"], ["b² − 4ac", "the discriminant"]], when: "Solving any ax² + bx + c = 0, especially when it doesn't factor.", conditions: "The equation must be set equal to 0 first.", example: R`\(2x^2 - 4x - 3 = 0\): \(x = \frac{2 \pm \sqrt{10}}{2}\).`, related: ["quad.formula"] },
    { id: "f.disc", name: "Discriminant", tex: R`D = b^2 - 4ac`, symbols: [["D > 0", "two real roots"], ["D = 0", "one real root (vertex on the x-axis)"], ["D < 0", "no real roots"]], when: "Deciding how many x-intercepts there are; parameter questions.", conditions: "Uses a, b, c from standard form.", example: R`\(x^2 + 6x + 9\): \(D = 36 - 36 = 0\), one root.`, related: ["quad.discriminant"] },
    { id: "f.vzeros", name: "Zeros from vertex form", tex: R`x = h \pm \sqrt{-\frac{k}{a}}`, symbols: [["−k/a", "must be ≥ 0 for real zeros"]], when: "Finding x-intercepts straight from vertex form.", conditions: "Real only when k and a have opposite signs (or k = 0).", example: R`\(y = 2\left(x - 1\right)^2 - 8\): \(x = 1 \pm 2\).`, related: ["quad.intercepts", "quad.vertex_form"] },
    { id: "f.yint", name: "y-intercept in each form", tex: R`f(0) = c = ah^2 + k = a\,r\,s`, symbols: [["c", "standard form"], ["ah² + k", "vertex form"], ["a·r·s", "factored form"]], when: "Finding where the graph crosses the y-axis.", conditions: "Always substitute x = 0.", example: R`\(y = 2\left(x - 1\right)^2 - 8\): \(2 - 8 = -6\).`, related: ["quad.intercepts"] },
    { id: "f.sumprod", name: "Sum and product of roots", tex: R`r + s = -\frac{b}{a},\qquad r s = \frac{c}{a}`, symbols: [["r, s", "the two roots"]], when: "Checking roots quickly; building a quadratic from its roots.", conditions: "Holds for both roots of ax² + bx + c = 0 (real or not).", example: R`\(x^2 - 5x + 6\): roots 2 and 3, sum 5, product 6.`, related: ["quad.factored_form"] },
    { id: "f.step", name: "Step pattern from the vertex", tex: R`f(h \pm n) = k + a n^2`, symbols: [["n", "steps away from the vertex"]], when: "Sketching quickly; reading a from a graph.", conditions: "n is a horizontal distance from the vertex.", example: R`\(a = -2\), vertex \(\left(1, 3\right)\): \(f(3) = 3 - 8 = -5\).`, related: ["quad.sketch", "quad.equation_from"] },
    { id: "f.diff", name: "Second differences", tex: R`\Delta^2 y = 2a\ (\Delta x = 1)`, symbols: [["Δ²y", "difference of the differences in a table"]], when: "Finding a from a table of values.", conditions: "x-values must be equally spaced by 1 (by d: Δ²y = 2ad²).", example: R`y: 7, 1, −1, 1, 7 → differences −6, −2, 2, 6 → second differences 4: \(a = 2\).`, related: ["quad.graph_read"] },
    { id: "f.proj", name: "Projectile model", tex: R`h(t) = -\tfrac{1}{2}g t^2 + v_0 t + h_0`, symbols: [["g ≈ 9.8 m/s² (≈ 10 in many textbook models)", "gravity"], ["v₀", "initial upward speed"], ["h₀", "starting height"]], when: "Height of a thrown object over time.", conditions: "Ignores air resistance; only t ≥ 0 makes sense.", example: R`\(h(t) = -5t^2 + 20t + 1\): top at \(t = 2\) s, height 21 m.`, related: ["quad.applications"] },
  ];

  // ───────── register into the shared concept system ─────────
  function register(Concepts) {
    if (!Concepts || Concepts._quad) return;
    Concepts._quad = true;
    if (!Concepts.UNITS.find((u) => u.id === UNIT.id)) Concepts.UNITS.unshift(UNIT);
    for (const c of CONCEPTS) { Concepts.CONCEPTS.push(c); Concepts.byId.set(c.id, c); }
    // generated questions carry their own concept tags
    const base = Concepts.conceptsFor;
    Concepts.conceptsFor = function (q, partKey) {
      if (q && Array.isArray(q.concepts) && q.concepts.length && /^qd-/.test(q.id || "")) return q.concepts.slice();
      return base(q, partKey);
    };
    Concepts.FORMULAS = FORMULAS;
  }
  register(root.Concepts);
  const api = { UNIT, CONCEPTS, FORMULAS, register };
  root.QuadContent = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
