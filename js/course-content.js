/*
 * Lessons for the rest of BC Pre-Calculus 11: rational expressions and equations, inequalities, trigonometry and
 * financial literacy. Same structure as every other lesson (big idea, rules, worked examples, mistakes, strategies);
 * practice comes from the generator families tagged with each concept. Not yet reviewed by a teacher.
 */
(function (root) {
  "use strict";
  const R = String.raw;
  const SOURCE = "Written for DontLetThePuppyDie. Not yet reviewed by a teacher.";
  const C = (o) => ({ difficulty: 2, prereqs: [], related: [], source: SOURCE, reviewed: false, version: 1, notation: [], strategies: [], ...o });
  const UNITS = [
    { id: "rational", title: "Rational Expressions" },
    { id: "inequalities", title: "Inequalities" },
    { id: "trig", title: "Trigonometry" },
    { id: "finance", title: "Financial Literacy" },
  ];
  const CONCEPTS = [
    C({
      id: "rational.expressions", unit: "rational", title: "Rational expressions",
      summary: R`Simplify, multiply, divide, add and subtract fractions with polynomials — and track the non-permissible values.`,
      keywords: ["rational expression", "non-permissible", "npv", "simplify", "common denominator", "cancel", "reciprocal"],
      intuition: "A rational expression is a fraction whose top and bottom are polynomials. Everything you know about fractions still works, as long as you never divide by zero.",
      explanation: [
        R`A <b>non-permissible value</b> makes a denominator zero. Find them from the <i>original</i> expression, before you cancel anything.`,
        R`To <b>simplify</b>, factor the numerator and denominator completely, then cancel common <i>factors</i> (never terms): \(\dfrac{(x-2)(x+3)}{(x-2)(x-5)} = \dfrac{x+3}{x-5},\ x \ne 2, 5\).`,
        R`To <b>divide</b>, multiply by the reciprocal — and note that the numerator of the divisor becomes a new non-permissible value.`,
        R`To <b>add or subtract</b>, use the lowest common denominator; put the second numerator in brackets when subtracting.`,
      ],
      notation: [{ sym: "x ≠ 2", means: "a non-permissible value" }],
      rules: [{ name: "Cancel factors", tex: R`\dfrac{a\cdot c}{b \cdot c} = \dfrac{a}{b},\ c \ne 0` }, { name: "Divide", tex: R`\dfrac{a}{b} \div \dfrac{c}{d} = \dfrac{a}{b}\cdot\dfrac{d}{c}` }, { name: "Add", tex: R`\dfrac{a}{b} + \dfrac{c}{d} = \dfrac{ad + bc}{bd}` }],
      examples: [
        { title: R`Simplify \(\dfrac{x^2 - 9}{x^2 + 5x + 6}\).`, steps: [R`Factor: \(\dfrac{(x-3)(x+3)}{(x+2)(x+3)}\). Non-permissible: \(x \ne -2, -3\).`, R`Cancel \((x+3)\): \(\dfrac{x-3}{x+2}\).`], answer: R`\(\dfrac{x-3}{x+2},\ x \ne -2, -3\)` },
        { title: R`Write \(\dfrac{2}{x-1} - \dfrac{3}{x+2}\) as one fraction.`, steps: [R`LCD \((x-1)(x+2)\).`, R`Numerator: \(2(x+2) - 3(x-1) = -x + 7\).`], answer: R`\(\dfrac{-x+7}{(x-1)(x+2)}\)` },
      ],
      mistakes: [
        { wrong: "Cancelling terms: (x + 4)/(x + 7) = 4/7.", fix: "Only factors of the whole numerator and denominator cancel." },
        { wrong: "Stating non-permissible values after cancelling (missing x = 2 above).", fix: "Find them from the original denominators — and from the divisor's numerator when dividing." },
        { wrong: "Subtracting without brackets: 2(x+2) − 3x − 3.", fix: "The minus applies to every term: 2(x+2) − 3(x − 1)." },
      ],
      strategies: ["Factor everything first.", "Write the non-permissible values down before simplifying.", "Check by substituting a permissible number into both forms."],
      prereqs: ["factoring.trinomials"], related: ["rational.equations"],
      tr: { fr: { title: "Expressions rationnelles", summary: "Simplifier, multiplier, diviser, additionner et soustraire des fractions de polynômes, en suivant les valeurs interdites." }, es: { title: "Expresiones racionales", summary: "Simplificar, multiplicar, dividir, sumar y restar fracciones de polinomios, vigilando los valores no permitidos." }, de: { title: "Rationale Terme", summary: "Brüche mit Polynomen vereinfachen, multiplizieren, dividieren, addieren und subtrahieren – mit Blick auf die Definitionslücken." }, zh: { title: "有理式", summary: "化简、乘除、加减含多项式的分式，并注意不允许的取值。" } },
    }),
    C({
      id: "rational.equations", unit: "rational", title: "Rational equations",
      summary: R`Clear the denominators, solve, then reject any solution that is non-permissible (extraneous).`,
      keywords: ["rational equation", "extraneous", "lowest common denominator", "cross multiply", "check"],
      intuition: "Multiplying by the denominators turns the equation into one you know how to solve — but it can sneak in answers that would divide by zero in the original.",
      explanation: [
        R`List the non-permissible values first.`,
        R`Multiply <b>every term</b> by the lowest common denominator, solve the resulting polynomial equation.`,
        R`Any solution equal to a non-permissible value is <b>extraneous</b>: reject it.`,
      ],
      rules: [{ name: "Proportion", tex: R`\dfrac{a}{b} = \dfrac{c}{d} \Rightarrow ad = bc` }],
      examples: [
        { title: R`Solve \(\dfrac{x^2}{x-3} = \dfrac{9}{x-3}\).`, steps: [R`\(x \ne 3\). Multiply by \(x - 3\): \(x^2 = 9\), so \(x = \pm 3\).`, R`\(x = 3\) is non-permissible: extraneous.`], answer: R`\(x = -3\)` },
        { title: R`Solve \(\dfrac{4}{x+1} = \dfrac{2}{x-2}\).`, steps: [R`Cross-multiply: \(4(x-2) = 2(x+1)\), so \(2x = 10\).`, R`\(x = 5\), which is permissible.`], answer: R`\(x = 5\)` },
      ],
      mistakes: [{ wrong: "Multiplying only the fractions by the LCD, not the whole-number term.", fix: "Every term on both sides gets multiplied." }, { wrong: "Keeping an answer that makes a denominator zero.", fix: "Compare each solution with the non-permissible values." }],
      strategies: ["Non-permissible values first, then clear denominators, then check."],
      prereqs: ["rational.expressions"], related: ["radicals.equations"],
      tr: { fr: { title: "Équations rationnelles", summary: "Éliminer les dénominateurs, résoudre, puis rejeter toute solution interdite (étrangère)." }, es: { title: "Ecuaciones racionales", summary: "Eliminar denominadores, resolver y descartar las soluciones no permitidas (extrañas)." }, de: { title: "Bruchgleichungen", summary: "Nenner beseitigen, lösen und unzulässige (Schein-)Lösungen verwerfen." }, zh: { title: "分式方程", summary: "去分母、求解，再舍去使分母为零的增根。" } },
    }),
    C({
      id: "ineq.linear", unit: "inequalities", title: "Linear inequalities and interval notation",
      summary: R`Solve like an equation, but flip the sign when multiplying or dividing by a negative. Write answers in interval notation.`,
      keywords: ["inequality", "interval notation", "flip the sign", "number line", "infinity", "bracket"],
      intuition: "An inequality describes a whole stretch of the number line, not just one point.",
      explanation: [
        R`Solving \(ax + b < c\) works like an equation, with one extra rule: multiplying or dividing both sides by a <b>negative</b> reverses the inequality.`,
        R`<b>Interval notation</b>: square brackets include an endpoint, round brackets exclude it; \(\infty\) always gets a round bracket. \(x \le 3\) is \((-\infty, 3]\).`,
        R`Two separate pieces are joined with \(\cup\): \(x < -1\) or \(x \ge 4\) is \((-\infty, -1) \cup [4, \infty)\).`,
      ],
      rules: [{ name: "Flip", tex: R`-2x < 6 \Rightarrow x > -3` }, { name: "Brackets", tex: R`a < x \le b \iff (a, b]` }],
      examples: [
        { title: R`Solve \(5 - 3x \ge 11\).`, steps: [R`\(-3x \ge 6\).`, R`Divide by \(-3\) and flip: \(x \le -2\).`], answer: R`\((-\infty, -2]\)` },
        { title: R`Write \(-4 < x \le 7\) in interval notation.`, steps: [R`−4 is excluded (round), 7 is included (square).`], answer: R`\((-4, 7]\)` },
      ],
      mistakes: [{ wrong: "Forgetting to flip when dividing by a negative.", fix: "Any × or ÷ by a negative reverses <, ≤, >, ≥." }, { wrong: "Writing [3, ∞].", fix: "Infinity is never reached: (3, ∞) or [3, ∞)." }],
      strategies: ["Check with a test value from your answer."], related: ["ineq.quadratic"],
      tr: { fr: { title: "Inéquations linéaires et intervalles", summary: "Résoudre comme une équation, mais inverser le sens en multipliant ou divisant par un négatif. Réponses en notation d'intervalle." }, es: { title: "Inecuaciones lineales e intervalos", summary: "Resolver como una ecuación, invirtiendo el signo al multiplicar o dividir por un negativo. Respuestas en notación de intervalo." }, de: { title: "Lineare Ungleichungen und Intervalle", summary: "Wie eine Gleichung lösen, aber beim Multiplizieren/Dividieren mit Negativem das Zeichen umdrehen. Antworten in Intervallschreibweise." }, zh: { title: "一次不等式与区间", summary: "像解方程一样求解，但乘除负数时要变号；答案用区间表示。" } },
    }),
    C({
      id: "ineq.quadratic", unit: "inequalities", title: "Quadratic inequalities",
      summary: R`Find the zeros, then use the parabola's shape (or test points) to see where it is above or below the x-axis.`,
      keywords: ["quadratic inequality", "sign chart", "test point", "zeros", "positive", "negative", "between", "outside"],
      intuition: "A parabola crosses the x-axis at its zeros; between and outside those points it keeps one sign.",
      explanation: [
        R`Rearrange to \(f(x) > 0\) (or <, ≤, ≥) and find the zeros of \(f\).`,
        R`If \(a > 0\) the parabola opens up: negative <b>between</b> the zeros, positive <b>outside</b>. If \(a < 0\), the reverse.`,
        R`≤ and ≥ include the zeros; < and > exclude them. If there are no real zeros, the answer is all real numbers or no solution.`,
      ],
      rules: [{ name: "Opens up", tex: R`(x - p)(x - q) < 0 \iff p < x < q\ (p < q)` }],
      examples: [
        { title: R`Solve \(x^2 - x - 6 \le 0\).`, steps: [R`\((x - 3)(x + 2) \le 0\): zeros −2 and 3.`, R`Opens up, so it is ≤ 0 between the zeros, inclusive.`], answer: R`\([-2, 3]\)` },
        { title: R`Solve \(-x^2 + 4 < 0\).`, steps: [R`Zeros ±2; opens down, so negative outside the zeros.`], answer: R`\((-\infty, -2) \cup (2, \infty)\)` },
      ],
      mistakes: [{ wrong: "Solving as if it were an equation and stopping at the zeros.", fix: "The zeros are only the boundaries; decide which regions satisfy the inequality." }, { wrong: "Dividing both sides by a variable.", fix: "x could be negative: move everything to one side and factor instead." }],
      strategies: ["Sketch the parabola from its zeros and direction.", "Or use a sign chart with one test value per region."],
      prereqs: ["ineq.linear", "quad.intercepts"],
      tr: { fr: { title: "Inéquations du second degré", summary: "Trouver les zéros, puis utiliser la forme de la parabole (ou des valeurs tests) pour voir où elle est au-dessus ou au-dessous de l'axe." }, es: { title: "Inecuaciones cuadráticas", summary: "Hallar los ceros y usar la forma de la parábola (o puntos de prueba) para ver dónde está sobre o bajo el eje." }, de: { title: "Quadratische Ungleichungen", summary: "Nullstellen finden, dann an der Parabelform (oder mit Testwerten) ablesen, wo sie über oder unter der Achse liegt." }, zh: { title: "二次不等式", summary: "先求零点，再根据抛物线开口（或代入检验）判断图像在 x 轴上方还是下方。" } },
    }),
    C({
      id: "trig.angles", unit: "trig", title: "Angles in standard position",
      summary: R`Angles start on the positive x-axis; reference angles and coterminal angles connect every angle to 0°–90°.`,
      keywords: ["standard position", "terminal arm", "initial arm", "reference angle", "coterminal", "quadrant", "negative angle"],
      intuition: "Picture a clock hand pinned at the origin, starting on the positive x-axis: counterclockwise is positive, clockwise is negative.",
      explanation: [
        R`An angle in <b>standard position</b> has its vertex at the origin and its initial arm on the positive x-axis. Positive angles rotate counterclockwise; negative angles clockwise.`,
        R`The <b>reference angle</b> is the acute angle between the terminal arm and the x-axis: Q II \(180^\circ - \theta\), Q III \(\theta - 180^\circ\), Q IV \(360^\circ - \theta\).`,
        R`<b>Coterminal</b> angles share a terminal arm and differ by multiples of \(360^\circ\).`,
      ],
      rules: [{ name: "Coterminal", tex: R`\theta + 360^\circ k,\ k \in \mathbb{Z}` }],
      examples: [
        { title: R`Reference angle of \(215^\circ\).`, steps: [R`Quadrant III: \(215^\circ - 180^\circ = 35^\circ\).`], answer: R`\(35^\circ\)` },
        { title: R`Smallest positive angle coterminal with \(-500^\circ\).`, steps: [R`\(-500^\circ + 720^\circ = 220^\circ\).`], answer: R`\(220^\circ\)` },
      ],
      mistakes: [{ wrong: "Measuring the reference angle to the y-axis.", fix: "Always to the x-axis." }, { wrong: "Rotating negative angles counterclockwise.", fix: "Negative means clockwise." }],
      strategies: ["Sketch the angle before calculating anything."], related: ["trig.ratios"],
      tr: { fr: { title: "Angles en position standard", summary: "Les angles partent de l'axe des x positif ; angles de référence et angles coterminaux ramènent tout à 0°–90°." }, es: { title: "Ángulos en posición estándar", summary: "Los ángulos parten del eje x positivo; los ángulos de referencia y coterminales relacionan todo con 0°–90°." }, de: { title: "Winkel in Standardlage", summary: "Winkel beginnen auf der positiven x-Achse; Bezugswinkel und gleichliegende Winkel führen alles auf 0°–90° zurück." }, zh: { title: "标准位置角", summary: "角从 x 轴正半轴开始；参考角和终边相同的角把一切联系到 0°–90°。" } },
    }),
    C({
      id: "trig.ratios", unit: "trig", title: "Trig ratios of any angle",
      summary: R`With a point (x, y) on the terminal arm, sin θ = y/r, cos θ = x/r, tan θ = y/x; special angles give exact values.`,
      keywords: ["sine", "cosine", "tangent", "CAST", "special angles", "exact value", "unit circle", "terminal arm"],
      intuition: "Drop a right triangle from the point to the x-axis: the signs of x and y decide the signs of the ratios.",
      explanation: [
        R`For a point \((x, y)\) on the terminal arm, \(r = \sqrt{x^2 + y^2}\). Then \(\sin\theta = \tfrac{y}{r}\), \(\cos\theta = \tfrac{x}{r}\), \(\tan\theta = \tfrac{y}{x}\).`,
        R`<b>CAST</b>: All ratios positive in Q I, Sine in Q II, Tangent in Q III, Cosine in Q IV.`,
        R`Special triangles: 30-60-90 has sides \(1, \sqrt{3}, 2\); 45-45-90 has \(1, 1, \sqrt{2}\). Combined with the reference angle and CAST they give exact values for any angle.`,
      ],
      rules: [{ name: "Ratios", tex: R`\sin\theta = \tfrac{y}{r},\ \cos\theta = \tfrac{x}{r},\ \tan\theta = \tfrac{y}{x}` }, { name: "Exact", tex: R`\sin 30^\circ = \tfrac12,\ \cos 30^\circ = \tfrac{\sqrt3}{2},\ \tan 45^\circ = 1` }],
      examples: [
        { title: R`Exact value of \(\cos 150^\circ\).`, steps: [R`Reference angle 30°, Q II where cosine is negative.`], answer: R`\(-\tfrac{\sqrt{3}}{2}\)` },
        { title: R`Solve \(\sin\theta = -\tfrac{1}{2}\), \(0^\circ \le \theta < 360^\circ\).`, steps: [R`Reference 30°; sine negative in Q III and Q IV.`, R`\(180^\circ + 30^\circ\) and \(360^\circ - 30^\circ\).`], answer: R`\(210^\circ, 330^\circ\)` },
      ],
      mistakes: [{ wrong: "Using a negative r.", fix: "r is a distance: always positive. The signs live in x and y." }, { wrong: "Giving only one solution to sin θ = k.", fix: "There are usually two angles in 0°–360°: use CAST." }],
      strategies: ["Reference angle → special triangle → sign from CAST."], prereqs: ["trig.angles"], related: ["trig.laws"],
      tr: { fr: { title: "Rapports trigonométriques de tout angle", summary: "Avec un point (x, y) du côté terminal : sin = y/r, cos = x/r, tan = y/x ; les angles remarquables donnent des valeurs exactes." }, es: { title: "Razones trigonométricas de cualquier ángulo", summary: "Con un punto (x, y) del lado terminal: sen = y/r, cos = x/r, tan = y/x; los ángulos notables dan valores exactos." }, de: { title: "Trigonometrische Verhältnisse beliebiger Winkel", summary: "Mit einem Punkt (x, y) auf dem Endschenkel: sin = y/r, cos = x/r, tan = y/x; besondere Winkel liefern exakte Werte." }, zh: { title: "任意角的三角比", summary: "终边上取点 (x, y)：sin = y/r，cos = x/r，tan = y/x；特殊角有精确值。" } },
    }),
    C({
      id: "trig.laws", unit: "trig", title: "Sine law and cosine law",
      summary: R`Solve non-right triangles: the sine law for matching side–angle pairs, the cosine law for SAS and SSS.`,
      keywords: ["sine law", "cosine law", "oblique triangle", "ambiguous case", "SAS", "SSS", "AAS", "SSA"],
      intuition: "In any triangle, bigger angles face longer sides — the two laws make that exact.",
      explanation: [
        R`<b>Sine law</b>: \(\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}\). Use it when you know a side and its opposite angle.`,
        R`<b>Cosine law</b>: \(c^2 = a^2 + b^2 - 2ab\cos C\). Use it for two sides and the angle between them (SAS), or three sides (SSS).`,
        R`<b>Ambiguous case</b> (SSA): with \(h = b\sin A\), there are 0 triangles if \(a < h\), 1 if \(a = h\) or \(a \ge b\), and 2 if \(h < a < b\).`,
      ],
      rules: [{ name: "Sine law", tex: R`\dfrac{a}{\sin A} = \dfrac{b}{\sin B}` }, { name: "Cosine law", tex: R`c^2 = a^2 + b^2 - 2ab\cos C` }],
      examples: [
        { title: R`\(A = 40^\circ, B = 75^\circ, a = 12\). Find b.`, steps: [R`\(b = \dfrac{12\sin 75^\circ}{\sin 40^\circ} \approx 18.0\).`], answer: R`\(b \approx 18.0\)` },
        { title: R`\(a = 7, b = 9, C = 110^\circ\). Find c.`, steps: [R`\(c^2 = 49 + 81 - 126\cos 110^\circ \approx 173.1\).`, R`\(c \approx 13.2\).`], answer: R`\(c \approx 13.2\)` },
      ],
      mistakes: [{ wrong: "Calculator in radians.", fix: "Set degree mode before any trig." }, { wrong: "Forgetting the second (obtuse) angle in the ambiguous case.", fix: "sin B = sin(180° − B): check whether 180° − B also fits." }],
      strategies: ["Label sides opposite their angles.", "Choose the law from what you know: pair → sine; SAS/SSS → cosine."], prereqs: ["trig.ratios"],
      tr: { fr: { title: "Loi des sinus et loi des cosinus", summary: "Résoudre des triangles quelconques : loi des sinus pour un couple côté–angle, loi des cosinus pour CAC et CCC." }, es: { title: "Ley de senos y ley de cosenos", summary: "Resolver triángulos oblicuos: ley de senos con un par lado–ángulo, ley de cosenos para LAL y LLL." }, de: { title: "Sinus- und Kosinussatz", summary: "Allgemeine Dreiecke lösen: Sinussatz bei Seite–Gegenwinkel, Kosinussatz bei SWS und SSS." }, zh: { title: "正弦定理与余弦定理", summary: "解斜三角形：已知一组对边对角用正弦定理，SAS 与 SSS 用余弦定理。" } },
    }),
    C({
      id: "finance.interest", unit: "finance", title: "Compound interest and investments",
      summary: R`A = P(1 + r/n)^{nt}: interest earns interest. Compare investments by their growth, using tables or technology.`,
      keywords: ["compound interest", "principal", "future value", "present value", "investment", "doubling", "compounding period"],
      intuition: "Each period the balance is multiplied by the same growth factor, so money grows like a geometric sequence.",
      explanation: [
        R`\(A = P\left(1 + \tfrac{r}{n}\right)^{nt}\): \(P\) principal, \(r\) annual rate as a decimal, \(n\) compounding periods per year, \(t\) years.`,
        R`Interest earned is \(A - P\). To find the principal needed for a goal, divide: \(P = A \div (1 + \tfrac{r}{n})^{nt}\).`,
        R`To compare offers, compare growth factors; a spreadsheet or calculator table shows the balance year by year.`,
      ],
      rules: [{ name: "Compound", tex: R`A = P\left(1 + \tfrac{r}{n}\right)^{nt}` }, { name: "Simple", tex: R`A = P(1 + rt)` }],
      examples: [
        { title: R`$2000 at 4% compounded quarterly for 5 years.`, steps: [R`\(A = 2000(1 + 0.01)^{20} \approx 2440.38\).`], answer: R`\(\$2440.38\)` },
        { title: R`Principal needed for $10 000 in 8 years at 5% compounded annually.`, steps: [R`\(P = 10000 \div 1.05^{8} \approx 6768.39\).`], answer: R`\(\$6768.39\)` },
      ],
      mistakes: [{ wrong: "Using the annual rate every period.", fix: "Divide the annual rate by n, and multiply years by n." }, { wrong: "Typing 4 instead of 0.04.", fix: "Rates go in as decimals." }],
      strategies: ["Write i = r/n and N = nt first."], related: ["finance.loans"],
      tr: { fr: { title: "Intérêts composés et placements", summary: "A = P(1 + r/n)^{nt} : les intérêts rapportent des intérêts. Comparer des placements avec des tableaux ou la technologie." }, es: { title: "Interés compuesto e inversiones", summary: "A = P(1 + r/n)^{nt}: el interés genera interés. Comparar inversiones con tablas o tecnología." }, de: { title: "Zinseszins und Geldanlagen", summary: "A = P(1 + r/n)^{nt}: Zinsen bringen Zinsen. Anlagen mit Tabellen oder Technik vergleichen." }, zh: { title: "复利与投资", summary: "A = P(1 + r/n)^{nt}：利息生利息。借助表格或技术比较投资。" } },
    }),
    C({
      id: "finance.loans", unit: "finance", title: "Loans, payments, buying vs leasing",
      summary: R`Equal payments repay a loan with interest; total cost = payments × number of payments. Compare buying and leasing by net cost.`,
      keywords: ["loan", "payment", "amortization", "total interest", "lease", "buy", "resale value", "net cost"],
      intuition: "Each payment covers that month's interest first; the rest pays down what you owe.",
      explanation: [
        R`Monthly payment: \(\text{PMT} = \dfrac{P\,i}{1 - (1 + i)^{-N}}\), with \(i = \tfrac{r}{12}\) and \(N = 12t\).`,
        R`Total interest = \(\text{PMT} \times N - P\). Longer terms lower the payment but raise the total interest.`,
        R`Buying vs leasing: buying costs what you pay minus what you sell the car for; leasing costs the down payment plus all monthly payments, and you keep nothing.`,
      ],
      rules: [{ name: "Payment", tex: R`\text{PMT} = \dfrac{P\,i}{1 - (1+i)^{-N}}` }],
      examples: [
        { title: R`$15 000 at 6% compounded monthly over 4 years.`, steps: [R`\(i = 0.005\), \(N = 48\): \(\text{PMT} \approx 352.28\).`, R`Total interest \(\approx 48(352.28) - 15000 = 1909.44\).`], answer: R`\(\$352.28\) per month` },
        { title: R`Lease: $2000 down + $299 × 36. Buy: $24 000, resell for $13 000.`, steps: [R`Lease \(= \$12\,764\); buy (net) \(= \$11\,000\).`], answer: "Buying costs less here, and you end up owning the car's value until you sell." },
      ],
      mistakes: [{ wrong: "Dividing the total with simple interest by the number of months.", fix: "Use the payment formula: interest is charged on the shrinking balance." }, { wrong: "Ignoring the resale value when comparing with a lease.", fix: "Subtract what you get back when you sell." }],
      strategies: ["Write P, i and N before using the formula.", "Compare total costs, not monthly payments."], prereqs: ["finance.interest"],
      tr: { fr: { title: "Prêts, versements, acheter ou louer", summary: "Des versements égaux remboursent un prêt avec intérêts ; comparer achat et location par le coût net." }, es: { title: "Préstamos, pagos, comprar o arrendar", summary: "Pagos iguales devuelven un préstamo con intereses; comparar comprar y arrendar por el costo neto." }, de: { title: "Kredite, Raten, Kaufen oder Leasen", summary: "Gleiche Raten tilgen einen Kredit mit Zinsen; Kauf und Leasing über die Nettokosten vergleichen." }, zh: { title: "贷款、还款、购买还是租赁", summary: "等额还款连本带息偿还贷款；用净成本比较购买与租赁。" } },
    }),
  ];

  function register(Concepts) {
    if (!Concepts || Concepts._course) return;
    Concepts._course = true;
    for (const u of UNITS) if (!Concepts.UNITS.find((x) => x.id === u.id)) Concepts.UNITS.push(u);
    for (const c of CONCEPTS) { if (!Concepts.byId.has(c.id)) { Concepts.CONCEPTS.push(c); Concepts.byId.set(c.id, c); } }
    // generated questions ("qd-", "cb-") carry their own concept tags
    const base = Concepts.conceptsFor;
    Concepts.conceptsFor = function (q, partKey) {
      if (q && Array.isArray(q.concepts) && q.concepts.length && /^(qd|cb)-/.test(q.id || "")) return q.concepts.slice();
      return base(q, partKey);
    };
  }
  register(root.Concepts);
  const api = { UNITS, CONCEPTS, register };
  root.CourseContent = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
