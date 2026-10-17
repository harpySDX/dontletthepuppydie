/*
 * CURRICULUM — the BC Pre-Calculus 11 map (source of truth: curriculum.gov.bc.ca/curriculum/mathematics/11/pre-calculus).
 *
 *   Unit (A–I) → subtopic (stable id like "F.vertex_to_std") with prerequisites and the library concept(s) it practises.
 *
 * Coverage is COMPUTED, never declared: a subtopic is "implemented" only when the question registry (js/engine/bank.js)
 * has at least one validated generator family for it, and "lessons" only when the Concept Library has a lesson.
 * Coverage (does the app have content?) is kept separate from mastery (does this learner know it?).
 */
(function (root) {
  "use strict";
  const U = (id, title, content, subs) => ({ id, title, content, subs: subs.map(([sid, t, concepts, prereqs]) => ({ id: `${id}.${sid}`, unit: id, title: t, concepts: concepts || [], prereqs: prereqs || [] })) });

  const UNITS = [
    U("A", "Real number system", "real number system", [
      ["classify", "Classifying real numbers", ["numbers.sets"]],
      ["rat_irr", "Rational and irrational numbers", ["numbers.sets"]],
      ["sets", "Relationships between number sets", ["numbers.sets"], ["A.classify"]],
      ["order", "Ordering and comparing real numbers", ["numbers.sets", "radicals.mixed_entire"], ["A.rat_irr"]],
    ]),
    U("B", "Powers with rational exponents", "powers with rational exponents", [
      ["laws", "Exponent laws (numerical and variable bases)", ["exponents.laws"]],
      ["negative", "Negative exponents", ["exponents.negative"], ["B.laws"]],
      ["rational", "Evaluating rational exponents", ["exponents.rational"], ["B.negative"]],
      ["convert", "Equivalent exponential and radical forms", ["exponents.rational"], ["B.rational"]],
      ["order_ops", "Order of operations with powers", ["exponents.laws"], ["B.laws"]],
    ]),
    U("C", "Radical operations and equations", "radical operations and equations", [
      ["simplify", "Simplifying radicals", ["radicals.simplify"]],
      ["mixed_entire", "Mixed and entire radicals", ["radicals.mixed_entire"], ["C.simplify"]],
      ["order", "Ordering irrational numbers", ["radicals.mixed_entire"], ["C.mixed_entire"]],
      ["add", "Adding and subtracting (combining like radicals)", ["radicals.add_subtract"], ["C.simplify"]],
      ["multiply", "Multiplying and dividing radicals", ["radicals.multiply"], ["C.simplify"]],
      ["rationalize", "Rationalizing denominators", ["radicals.rationalize", "radicals.conjugates"], ["C.multiply"]],
      ["restrict", "Domain restrictions", ["radicals.restrictions"]],
      ["equations", "Radical equations and extraneous roots", ["radicals.equations"], ["C.restrict", "D.trinomials"]],
      ["graphical", "Solving radical equations graphically", ["radicals.equations"], ["C.equations"]],
      ["applications", "Radicals in context (geometry, Pythagorean theorem, formulas)", ["radicals.applications"], ["C.equations"]],
    ]),
    U("D", "Polynomial factoring", "polynomial factoring", [
      ["gcf", "Greatest common factor", ["factoring.trinomials"]],
      ["trinomials", "Trinomials x² + bx + c", ["factoring.trinomials"], ["D.gcf"]],
      ["trinomials_a", "Trinomials ax² + bx + c (a ≠ 1)", ["factoring.trinomials"], ["D.trinomials"]],
      ["diff_squares", "Difference of squares and perfect squares", ["factoring.special"], ["D.gcf"]],
      ["substitution", "Repeated expressions and substitution", ["factoring.quadratic_form"], ["D.trinomials"]],
      ["strategy", "Choosing a strategy and checking by expanding", ["factoring.trinomials", "factoring.special"], ["D.trinomials_a", "D.diff_squares"]],
    ]),
    U("E", "Rational expressions and equations", "rational expressions and equations", [
      ["npv", "Non-permissible values", ["rational.expressions"], ["D.trinomials"]],
      ["simplify", "Simplifying rational expressions", ["rational.expressions"], ["E.npv"]],
      ["muldiv", "Multiplying and dividing", ["rational.expressions"], ["E.simplify"]],
      ["addsub", "Adding and subtracting", ["rational.expressions"], ["E.simplify"]],
      ["equations", "Rational equations and extraneous roots", ["rational.equations"], ["E.addsub"]],
    ]),
    U("F", "Quadratic functions and equations", "quadratic functions and equations", [
      ["forms", "Standard, vertex and factored forms; function notation", ["quad.basics"]],
      ["vertex_to_std", "Vertex form → standard form", ["quad.vertex_form", "quad.basics"], ["F.forms"]],
      ["std_to_vertex", "Standard form → vertex form (completing the square)", ["quad.complete_square"], ["F.vertex_to_std"]],
      ["std_factored", "Standard ↔ factored form", ["quad.factored_form"], ["D.trinomials"]],
      ["vertex", "Vertex and axis of symmetry", ["quad.vertex_form", "quad.axis", "quad.standard_vertex"], ["F.forms"]],
      ["direction", "Opening direction and vertical stretch", ["quad.direction", "quad.transform"], ["F.forms"]],
      ["domain_range", "Domain and range", ["quad.direction"], ["F.vertex"]],
      ["intercepts", "Intercepts and zeros", ["quad.intercepts", "quad.factored_form"], ["F.vertex"]],
      ["maxmin", "Maximum and minimum values", ["quad.direction", "quad.standard_vertex"], ["F.vertex"]],
      ["transform", "Transformations of y = x²", ["quad.transform"], ["F.vertex"]],
      ["graphing", "Graphing on an empty grid", ["quad.sketch"], ["F.vertex", "F.direction"]],
      ["graph_to_eq", "Equation from a graph or features", ["quad.equation_from", "quad.graph_read"], ["F.vertex"]],
      ["tables", "Tables of values and symmetry", ["quad.graph_read", "quad.axis"], ["F.vertex"]],
      ["compare", "Matching and comparing parabolas", ["quad.graph_read", "quad.transform"], ["F.transform"]],
      ["solve_factor", "Solving by factoring", ["quad.factored_form", "quad.intercepts"], ["D.trinomials"]],
      ["solve_sqrt", "Solving by square roots", ["quad.intercepts"], ["C.simplify"]],
      ["solve_formula", "Solving with the quadratic formula", ["quad.formula"], ["C.simplify"]],
      ["solve_graph", "Solving graphically (intersections)", ["quad.graph_read", "quad.intercepts"], ["F.intercepts"]],
      ["discriminant", "Discriminant and number of roots", ["quad.discriminant"], ["F.solve_formula"]],
      ["modelling", "Quadratic modelling and context", ["quad.applications"], ["F.maxmin"]],
      ["errors", "Finding errors in worked solutions", ["quad.complete_square"], ["F.std_to_vertex"]],
    ]),
    U("G", "Linear and quadratic inequalities", "linear and quadratic inequalities", [
      ["linear", "Linear inequalities", ["ineq.linear"]],
      ["interval", "Interval notation", ["ineq.linear"], ["G.linear"]],
      ["sign", "Where a quadratic is positive, negative or zero", ["ineq.quadratic"], ["F.intercepts"]],
      ["quadratic", "Quadratic inequalities", ["ineq.quadratic"], ["G.sign", "D.trinomials"]],
      ["context", "Inequalities and restrictions in context", ["ineq.quadratic"], ["G.quadratic"]],
    ]),
    U("H", "Trigonometry", "trigonometry: non-right triangles and angles in standard position", [
      ["standard", "Angles in standard position (positive and negative)", ["trig.angles"]],
      ["reference", "Reference angles", ["trig.angles"], ["H.standard"]],
      ["coterminal", "Coterminal angles", ["trig.angles"], ["H.standard"]],
      ["special", "Special angles and exact values (unit circle)", ["trig.ratios"], ["H.reference"]],
      ["terminal", "Ratios from a point on the terminal arm", ["trig.ratios"], ["H.reference"]],
      ["equations", "Simple trigonometric equations (0° ≤ θ < 360°)", ["trig.ratios"], ["H.special"]],
      ["sine_law", "Sine law", ["trig.laws"]],
      ["cosine_law", "Cosine law", ["trig.laws"]],
      ["ambiguous", "Ambiguous case of the sine law", ["trig.laws"], ["H.sine_law"]],
    ]),
    U("I", "Financial literacy", "financial literacy: compound interest, investments, loans", [
      ["compound", "Compound interest", ["finance.interest"]],
      ["investments", "Investments: comparing, doubling time, technology tables", ["finance.interest"], ["I.compound"]],
      ["loans", "Loans with regular payments", ["finance.loans"], ["I.compound"]],
      ["lease", "Buying versus leasing", ["finance.loans"], ["I.loans"]],
    ]),
  ];
  const SUBS = UNITS.flatMap((u) => u.subs);
  const bySub = new Map(SUBS.map((s) => [s.id, s]));
  const unitOf = (id) => UNITS.find((u) => u.id === String(id).split(".")[0]);

  // coverage computed from the live registry and library
  function coverage() {
    const B = root.Bank, C = root.Concepts;
    return SUBS.map((s) => {
      const fams = B ? B.familiesFor(s.id) : [];
      const modes = ["simple", "normal", "challenge"].filter((m) => fams.some((F) => F.modes.includes(m)));
      const lessons = C ? s.concepts.filter((id) => C.get(id)) : [];
      return { ...s, families: fams.map((F) => F.id), modes, implemented: fams.length > 0, lessons, status: !fams.length ? "missing" : modes.length < 3 ? "partial" : "implemented" };
    });
  }
  // the subtopics that practise a given library concept
  const subsForConcept = (cid) => SUBS.filter((s) => s.concepts.includes(cid)).map((s) => s.id);

  const api = { UNITS, SUBS, get: (id) => bySub.get(id), unitOf, coverage, subsForConcept, SOURCE: "https://curriculum.gov.bc.ca/curriculum/mathematics/11/pre-calculus" };
  root.Curriculum = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
