/*
 * Unit H — trigonometry: angles in standard position, reference and coterminal angles, exact values,
 * ratios from a point, simple equations, and the sine law, cosine law and ambiguous case.
 * Triangles are only generated when they are valid (sides positive, angle sums < 180°, case counts verified).
 */
(function (root) {
  "use strict";
  const B = root.Bank; if (!B) return;
  const { K } = B;
  const R = String.raw;
  const rad = (d) => (d * Math.PI) / 180, deg = (x) => (x * 180) / Math.PI;
  const norm360 = (t) => ((t % 360) + 360) % 360;
  const quad = (t) => { const u = norm360(t); return u < 90 ? 1 : u < 180 ? 2 : u < 270 ? 3 : 4; };
  const refAngle = (t) => { const u = norm360(t); return u <= 90 ? u : u <= 180 ? 180 - u : u <= 270 ? u - 180 : 360 - u; };
  const QN = ["I", "II", "III", "IV"];
  // exact values for 30/45/60 in quadrant I (typed answers and TeX)
  const EX = {
    30: { sin: ["1/2", R`\tfrac{1}{2}`], cos: ["√3/2", R`\tfrac{\sqrt{3}}{2}`], tan: ["√3/3", R`\tfrac{\sqrt{3}}{3}`] },
    45: { sin: ["√2/2", R`\tfrac{\sqrt{2}}{2}`], cos: ["√2/2", R`\tfrac{\sqrt{2}}{2}`], tan: ["1", "1"] },
    60: { sin: ["√3/2", R`\tfrac{\sqrt{3}}{2}`], cos: ["1/2", R`\tfrac{1}{2}`], tan: ["√3", R`\sqrt{3}`] },
  };
  const signOf = (fn, q) => (fn === "sin" ? (q <= 2 ? 1 : -1) : fn === "cos" ? (q === 1 || q === 4 ? 1 : -1) : q === 1 || q === 3 ? 1 : -1);
  const nonQuadrantal = (r, lo, hi) => { let t; do t = K.int(r, lo, hi); while (t % 90 === 0); return t; };

  B.family({
    id: "h_standard", unit: "H", sub: "H.standard", title: "Angles in standard position", concepts: ["trig.angles"],
    kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "quadrant", complexity: { simple: 1, normal: 2, challenge: 2 },
    templates: ["quadrant of a positive angle", "quadrant of a negative angle", "rotation direction"],
    gen(r, mode) {
      const T = mode === "simple" ? "pos" : mode === "normal" ? K.pick(r, ["pos", "neg"]) : K.pick(r, ["neg", "dir"]);
      if (T === "dir") {
        const t = nonQuadrantal(r, -350, -10);
        return { ...K.mc(`Clockwise, ${Math.abs(t)}° from the positive x-axis`, [`Counterclockwise, ${Math.abs(t)}° from the positive x-axis`, `Clockwise, ${Math.abs(t)}° from the positive y-axis`, `Counterclockwise, ${360 + t}° from the negative x-axis`]), template: "rotation direction", sig: `dir|${t}`,
          q: R`How is the angle \(\theta = ${t}^\circ\) drawn in standard position?`, e: "Standard position starts on the positive x-axis. Positive angles turn counterclockwise; negative angles turn clockwise.", hints: ["Negative angles rotate clockwise."] };
      }
      const t = T === "pos" ? nonQuadrantal(r, 1, mode === "simple" ? 359 : 719) : nonQuadrantal(r, -719, -1);
      const q = quad(t);
      return { ...K.mc(`Quadrant ${QN[q - 1]}`, QN.filter((_, i) => i !== q - 1).map((n) => `Quadrant ${n}`)), template: T === "pos" ? "quadrant of a positive angle" : "quadrant of a negative angle", sig: `${t}`,
        q: R`In which quadrant does the terminal arm of \(${t}^\circ\) lie?`,
        e: R`${t < 0 || t >= 360 ? `\\(${t}^\\circ\\) is coterminal with \\(${norm360(t)}^\\circ\\). ` : ""}\(${norm360(t)}^\circ\) is between ${(q - 1) * 90}° and ${q * 90}°, so quadrant ${QN[q - 1]}.`.replace(/\\\\/g, "\\"),
        hints: ["Add or subtract 360° until the angle is between 0° and 360°.", "Quadrants: I 0–90°, II 90–180°, III 180–270°, IV 270–360°."] };
    },
  });

  B.family({
    id: "h_reference", unit: "H", sub: "H.reference", title: "Reference angles", concepts: ["trig.angles"],
    kinds: ["nr", "mc"], modes: ["simple", "normal", "challenge"], answer: "degrees", complexity: { simple: 1, normal: 2, challenge: 2 },
    templates: ["reference angle of a positive angle", "reference angle of a negative or large angle", "angles that share a reference angle"],
    gen(r, mode, kind) {
      const t = mode === "simple" ? nonQuadrantal(r, 91, 359) : mode === "normal" ? nonQuadrantal(r, 1, 359) : K.coin(r) ? nonQuadrantal(r, -359, -1) : nonQuadrantal(r, 361, 719);
      const ra = refAngle(t), q = quad(t);
      const how = q === 1 ? `it is already acute` : q === 2 ? `180° − ${norm360(t)}° = ${ra}°` : q === 3 ? `${norm360(t)}° − 180° = ${ra}°` : `360° − ${norm360(t)}° = ${ra}°`;
      if (kind === "mc") {
        const others = [180 - ra, 180 + ra, 360 - ra].filter((x) => x !== norm360(t));
        const good = R`\(${norm360(t) === 180 - ra ? 180 + ra : 180 - ra}^\circ\)`;
        const wrong = [R`\(${ra + 90}^\circ\)`, R`\(${90 - ra === ra ? 90 + ra + 5 : 90 - ra}^\circ\)`, R`\(${2 * ra === ra ? ra + 10 : (2 * ra) % 360 || 15}^\circ\)`];
        void others;
        return { ...K.mc(good, wrong), template: "angles that share a reference angle", sig: `mc|${t}`, q: R`Which angle has the same reference angle as \(${norm360(t)}^\circ\)?`,
          e: R`The reference angle of \(${norm360(t)}^\circ\) is ${ra}°. Angles with reference angle ${ra}° are ${ra}°, ${180 - ra}°, ${180 + ra}° and ${360 - ra}°.`, hints: ["Find the acute angle between the terminal arm and the x-axis."] };
      }
      return { kind: "nr", template: mode === "challenge" ? "reference angle of a negative or large angle" : "reference angle of a positive angle", sig: `${t}`, answer: ra, ansText: String(ra), fmt: "Degrees",
        q: R`What is the reference angle of \(${t}^\circ\)? (degrees)`, e: R`${t < 0 || t >= 360 ? `Coterminal angle: \\(${norm360(t)}^\\circ\\) (quadrant ${QN[q - 1]}). ` : `Quadrant ${QN[q - 1]}: `}${how}.`.replace(/\\\\/g, "\\"),
        hints: ["The reference angle is the acute angle to the x-axis (never the y-axis).", "Q II: 180° − θ; Q III: θ − 180°; Q IV: 360° − θ."] };
    },
  });

  B.family({
    id: "h_coterminal", unit: "H", sub: "H.coterminal", title: "Coterminal angles", concepts: ["trig.angles"],
    kinds: ["nr", "mc"], modes: ["simple", "normal", "challenge"], answer: "degrees", complexity: { simple: 1, normal: 2, challenge: 2 },
    templates: ["smallest positive coterminal", "negative coterminal", "is it coterminal?"],
    gen(r, mode, kind) {
      if (kind === "mc") {
        const t = K.int(r, 10, 350), k = K.int(r, 1, 2);
        const good = R`\(${t - 360 * k}^\circ\)`;
        return { ...K.mc(good, [R`\(${-t}^\circ\)`, R`\(${t + 180}^\circ\)`, R`\(${360 - t}^\circ\)`]), template: "is it coterminal?", sig: `mc|${t}|${k}`, q: R`Which angle is coterminal with \(${t}^\circ\)?`,
          e: R`Coterminal angles differ by a multiple of 360°: \(${t}^\circ - ${360 * k}^\circ = ${t - 360 * k}^\circ\).`, hints: ["Add or subtract 360° (any number of times)."] };
      }
      const T = mode === "simple" ? "pos" : mode === "normal" ? K.pick(r, ["pos", "neg"]) : "neg";
      const t = T === "pos" ? (K.coin(r) ? K.int(r, 361, 1079) : -K.int(r, 1, 719)) : K.int(r, 1, 1079);
      if (t % 360 === 0) throw new Error("trivial");
      const ans = T === "pos" ? norm360(t) : norm360(t) - 360;
      return { kind: "nr", template: T === "pos" ? "smallest positive coterminal" : "negative coterminal", sig: `${T}|${t}`, answer: ans, ansText: String(ans), fmt: "Degrees",
        q: T === "pos" ? R`Find the smallest positive angle coterminal with \(${t}^\circ\).` : R`Find the coterminal angle of \(${t}^\circ\) between \(-360^\circ\) and \(0^\circ\).`,
        e: R`Add or subtract 360° until the angle is in range: \(${t}^\circ \to ${ans}^\circ\).`, hints: ["Coterminal angles differ by multiples of 360°."] };
    },
  });

  B.family({
    id: "h_special", unit: "H", sub: "H.special", title: "Exact values (special angles)", concepts: ["trig.ratios"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "exact value", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["quadrant I special angle", "special angle in another quadrant", "negative or large angle"],
    gen(r, mode, kind) {
      const ref = K.pick(r, [30, 45, 60]), fn = K.pick(r, ["sin", "cos", "tan"]);
      const q = mode === "simple" ? 1 : K.int(r, 1, 4);
      let t = q === 1 ? ref : q === 2 ? 180 - ref : q === 3 ? 180 + ref : 360 - ref;
      if (mode === "challenge") t += K.pick(r, [-360, 360]);
      const sg = signOf(fn, quad(t));
      const [s, tex] = EX[ref][fn];
      const ans = sg < 0 ? `-${s}` : s, ansTex = sg < 0 ? `-${tex}` : tex;
      if (kind === "mc") {
        const alt = (f) => EX[ref][f][1];
        const opts = [ansTex, sg < 0 ? tex : `-${tex}`, ...["sin", "cos", "tan"].filter((f) => f !== fn).map((f) => alt(f)), R`\tfrac{1}{2}`, R`-\tfrac{\sqrt{3}}{2}`];
        return { ...K.mc(R`\(${opts[0]}\)`, opts.slice(1).map((o) => R`\(${o}\)`)), template: mode === "simple" ? "quadrant I special angle" : mode === "challenge" ? "negative or large angle" : "special angle in another quadrant", sig: `mc|${fn}|${t}`,
          q: R`What is the exact value of \(\${fn}\,${t}^\circ\)?`, e: R`Reference angle ${ref}°, quadrant ${QN[quad(t) - 1]} where ${fn} is ${sg > 0 ? "positive" : "negative"} (CAST). \(\${fn}\,${ref}^\circ = ${tex}\), so \(\${fn}\,${t}^\circ = ${ansTex}\).`, hints: ["Find the reference angle and the quadrant.", "CAST: All positive in I, Sin in II, Tan in III, Cos in IV."] };
      }
      return { kind: "wr", template: mode === "simple" ? "quadrant I special angle" : mode === "challenge" ? "negative or large angle" : "special angle in another quadrant", sig: `wr|${fn}|${t}`, title: "Exact values", intro: R`Find the exact value of \(\${fn}\,${t}^\circ\).`,
        parts: [{ key: "a", label: "", prompt: "Exact value:", kind: "expr", form: "value", answer: ans, ansTex, marks: 2 }],
        solution: [R`Reference angle: ${ref}°. Quadrant ${QN[quad(t) - 1]}: ${fn} is ${sg > 0 ? "positive" : "negative"}.`, R`\(\${fn}\,${ref}^\circ = ${tex}\), so \(\${fn}\,${t}^\circ = ${ansTex}\).`],
        rubric: ["Value from the special triangle — 1", "Correct sign — 1"], hints: ["Use the 30-60-90 (1, √3, 2) or 45-45-90 (1, 1, √2) triangle.", "The sign comes from the quadrant (CAST)."] };
    },
  });

  B.family({
    id: "h_terminal", unit: "H", sub: "H.terminal", title: "Ratios from a point on the terminal arm", concepts: ["trig.ratios"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "exact ratios", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["Pythagorean triple point", "point giving a radical r", "given one ratio and the quadrant"],
    gen(r, mode) {
      const T = mode === "simple" ? "triple" : mode === "normal" ? K.pick(r, ["triple", "radical"]) : K.pick(r, ["given", "radical"]);
      const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10]];
      let x, y, rr, rTeX, rStr, steps = [], intro;
      if (T === "given") {
        const [a, b, c] = K.pick(r, triples.slice(0, 4));
        const q = K.int(r, 2, 4);
        x = (q === 2 || q === 3 ? -1 : 1) * b; y = (q === 3 || q === 4 ? -1 : 1) * a; rr = c;
        intro = R`Given \(\sin\theta = ${y < 0 ? "-" : ""}\tfrac{${a}}{${c}}\) and \(\theta\) in quadrant ${QN[q - 1]}:`;
        steps = [R`\(\sin\theta = \tfrac{y}{r}\): take \(y = ${y}\), \(r = ${c}\).`, R`\(x^2 = r^2 - y^2 = ${c * c - a * a}\), so \(x = ${x}\) (sign from quadrant ${QN[q - 1]}).`];
        return { kind: "wr", template: "given one ratio and the quadrant", sig: `g|${a}|${c}|${q}`, title: "Ratios from one ratio", intro,
          parts: [{ key: "a", label: "(a)", prompt: "cos θ (exact):", kind: "expr", form: "value", answer: `${x}/${rr}`, marks: 1 }, { key: "b", label: "(b)", prompt: "tan θ (exact):", kind: "expr", form: "value", answer: `${y}/${x}`, marks: 1 }],
          solution: [...steps, R`\(\cos\theta = \tfrac{${x}}{${rr}}\), \(\tan\theta = \tfrac{${y}}{${x}}\).`], rubric: ["cos — 1", "tan — 1"], hints: ["Draw the triangle in the right quadrant; use x² + y² = r².", "The signs of x and y come from the quadrant."] };
      }
      if (T === "triple") { const [a, b, c] = K.pick(r, triples); x = K.pick(r, [1, -1]) * a; y = K.pick(r, [1, -1]) * b; if (K.coin(r)) [x, y] = [y, x]; rr = c; rTeX = String(c); rStr = String(c); }
      else { x = K.nz(r, -4, 4); y = K.nz(r, -4, 4); const s = x * x + y * y; const [c0, t] = root.QuadMath.sqrtSplit(s); if (t === 1) throw new Error("integer"); rTeX = `${c0 === 1 ? "" : c0}\\sqrt{${t}}`; rStr = `${c0 === 1 ? "" : c0}√${t}`; rr = Math.sqrt(s); }
      return { kind: "wr", template: T === "triple" ? "Pythagorean triple point" : "point giving a radical r", sig: `${T}|${x}|${y}`, title: "Point on the terminal arm",
        intro: R`The point \(P(${x}, ${y})\) is on the terminal arm of an angle \(\theta\) in standard position.`,
        parts: [
          { key: "a", label: "(a)", prompt: "r (exact):", kind: "expr", form: "value", answer: rStr, marks: 1 },
          { key: "b", label: "(b)", prompt: "sin θ (exact):", kind: "expr", form: "value", answer: T === "triple" ? `${y}/${rr}` : `${y}/(${rStr})`, marks: 1 },
          { key: "c", label: "(c)", prompt: "cos θ (exact):", kind: "expr", form: "value", answer: T === "triple" ? `${x}/${rr}` : `${x}/(${rStr})`, marks: 1 },
        ],
        solution: [R`\(r = \sqrt{x^2 + y^2} = \sqrt{${x * x} + ${y * y}} = ${rTeX}\).`, R`\(\sin\theta = \tfrac{y}{r} = \tfrac{${y}}{${rTeX}}\), \(\cos\theta = \tfrac{x}{r} = \tfrac{${x}}{${rTeX}}\).`],
        rubric: ["r — 1", "sin — 1", "cos — 1"], hints: ["r = √(x² + y²) is always positive.", "sin θ = y/r, cos θ = x/r, tan θ = y/x."] };
    },
  });

  B.family({
    id: "h_equations", unit: "H", sub: "H.equations", title: "Simple trig equations", concepts: ["trig.ratios"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "set of angles", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["sin θ = k", "cos θ = k", "tan θ = k", "isolate first"],
    gen(r, mode) {
      const fn = mode === "simple" ? K.pick(r, ["sin", "cos"]) : K.pick(r, ["sin", "cos", "tan"]);
      const ref = K.pick(r, [30, 45, 60]);
      const sg = mode === "simple" ? 1 : K.pick(r, [1, -1]);
      const [, tex] = EX[ref][fn];
      const sols = [];
      for (let t = 0; t < 360; t++) if (t % 90 !== 0 && refAngle(t) === ref && signOf(fn, quad(t)) === sg) sols.push(t);
      let eq = R`\${fn}\,\theta = ${sg < 0 ? "-" : ""}${tex}`, steps = [];
      if (mode === "challenge") { const m = K.int(r, 2, 4); eq = R`${m}\${fn}\,\theta ${sg < 0 ? "+" : "-"} ${m}\left(${tex}\right) = 0`; steps.push(R`Isolate: \(\${fn}\,\theta = ${sg < 0 ? "-" : ""}${tex}\).`); }
      steps.push(R`Reference angle: ${ref}°. ${fn} is ${sg > 0 ? "positive" : "negative"} in quadrants ${[1, 2, 3, 4].filter((q) => signOf(fn, q) === sg).map((q) => QN[q - 1]).join(" and ")}.`, R`\(\theta = ${sols.join("^\\circ,\\ ")}^\circ\).`);
      return { kind: "wr", template: mode === "challenge" ? "isolate first" : `${fn} θ = k`, sig: `${fn}|${ref}|${sg}|${mode}|${eq}`, title: "Trig equations", intro: R`Solve \(${eq}\) for \(0^\circ \le \theta < 360^\circ\).`,
        parts: [{ key: "a", label: "", prompt: "θ (degrees, separated by commas):", kind: "set", mode: "final", answer: sols.map(String), marks: 2 }],
        solution: steps, rubric: ["Reference angle — 1", "Both angles in the right quadrants — 1"], hints: ["Find the reference angle from the special triangles.", "Use CAST to find the two quadrants with the right sign."] };
    },
  });

  // ───────── non-right triangles ─────────
  const r1 = (x) => Math.round(x * 10) / 10;
  B.family({
    id: "h_sine_law", unit: "H", sub: "H.sine_law", title: "Sine law", concepts: ["trig.laws"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "decimal", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["find a side (AAS)", "find an angle (unique case)", "word problem (two angles from bearings)"],
    gen(r, mode) {
      const T = mode === "simple" ? "side" : mode === "normal" ? K.pick(r, ["side", "angle"]) : K.pick(r, ["angle", "word"]);
      if (T === "side" || T === "word") {
        const A = K.int(r, 25, 80), Bg = K.int(r, 25, 150 - A), a = K.int(r, 6, 30);
        const b = (a * Math.sin(rad(Bg))) / Math.sin(rad(A));
        const Cg = 180 - A - Bg;
        const intro = T === "word"
          ? R`Two lookouts at B and C are ${a} km apart. They see a fire at A, with \(\angle ABC = ${Bg}^\circ\) and \(\angle ACB = ${Cg}^\circ\). How far is the fire from lookout C (side \(b = AC\)), to the nearest tenth of a km?`
          : R`In \(\triangle ABC\), \(\angle A = ${A}^\circ\), \(\angle B = ${Bg}^\circ\) and \(a = ${a}\). Find \(b\) to the nearest tenth.`;
        return { kind: "wr", template: T === "word" ? "word problem (two angles from bearings)" : "find a side (AAS)", sig: `${T}|${A}|${Bg}|${a}`, title: "Sine law", intro,
          parts: [{ key: "a", label: "", prompt: "b =", kind: "approx", answer: b, dp: 1, marks: 2, wrongs: [{ value: (a * Math.sin(rad(A))) / Math.sin(rad(Bg)), note: "The ratio is upside down: b/sin B = a/sin A, so b = a·sin B / sin A." }] }],
          solution: [...(T === "word" ? [R`First \(\angle A = 180^\circ - ${Bg}^\circ - ${Cg}^\circ = ${A}^\circ\) (opposite side a = BC).`] : []), R`\(\dfrac{b}{\sin B} = \dfrac{a}{\sin A}\), so \(b = \dfrac{${a}\sin ${Bg}^\circ}{\sin ${A}^\circ} \approx ${r1(b).toFixed(1)}\).`], rubric: ["Correct ratio set up — 1", "Answer — 1"], hints: ["Pair each side with the angle opposite it.", "Make sure your calculator is in degree mode."] };
      }
      // angle: a ≥ b ensures a unique (acute) B
      const A = K.int(r, 30, 110), a = K.int(r, 10, 30), b = K.int(r, 4, a);
      const Bv = deg(Math.asin((b * Math.sin(rad(A))) / a));
      if (A + Bv >= 178) throw new Error("degenerate");
      return { kind: "wr", template: "find an angle (unique case)", sig: `ang|${A}|${a}|${b}`, title: "Sine law", intro: R`In \(\triangle ABC\), \(\angle A = ${A}^\circ\), \(a = ${a}\) and \(b = ${b}\). Find \(\angle B\) to the nearest tenth of a degree.`,
        parts: [{ key: "a", label: "", prompt: "∠B (degrees) =", kind: "approx", answer: Bv, dp: 1, marks: 2 }],
        solution: [R`\(\dfrac{\sin B}{${b}} = \dfrac{\sin ${A}^\circ}{${a}}\), so \(\sin B = \dfrac{${b}\sin ${A}^\circ}{${a}} \approx ${((b * Math.sin(rad(A))) / a).toFixed(4)}\).`, R`\(B \approx ${r1(Bv).toFixed(1)}^\circ\). Since \(a \ge b\), B must be acute — only one triangle.`], rubric: ["Ratio — 1", "Angle — 1"], hints: ["Use sin B / b = sin A / a, then inverse sine.", "Degree mode!"] };
    },
  });

  B.family({
    id: "h_cosine_law", unit: "H", sub: "H.cosine_law", title: "Cosine law", concepts: ["trig.laws"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "decimal", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["find a side (SAS)", "find an angle (SSS)", "largest angle of a triangle"],
    gen(r, mode) {
      const T = mode === "simple" ? "side" : mode === "normal" ? K.pick(r, ["side", "angle"]) : K.pick(r, ["angle", "largest"]);
      if (T === "side") {
        const a = K.int(r, 5, 25), b = K.int(r, 5, 25), C = K.int(r, 20, 150);
        const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(C)));
        return { kind: "wr", template: "find a side (SAS)", sig: `s|${a}|${b}|${C}`, title: "Cosine law", intro: R`In \(\triangle ABC\), \(a = ${a}\), \(b = ${b}\) and \(\angle C = ${C}^\circ\). Find \(c\) to the nearest tenth.`,
          parts: [{ key: "a", label: "", prompt: "c =", kind: "approx", answer: c, dp: 1, marks: 2, wrongs: [{ value: Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(rad(C))), note: "Check the sign: c² = a² + b² − 2ab·cos C." }, { value: a * a + b * b - 2 * a * b * Math.cos(rad(C)), note: "That's c² — take the square root." }] }],
          solution: [R`\(c^2 = ${a}^2 + ${b}^2 - 2(${a})(${b})\cos ${C}^\circ \approx ${(c * c).toFixed(2)}\).`, R`\(c \approx ${r1(c).toFixed(1)}\).`], rubric: ["Substitution — 1", "Answer — 1"], hints: ["c² = a² + b² − 2ab cos C.", "Don't forget the square root."] };
      }
      let a, b, c; do { a = K.int(r, 4, 20); b = K.int(r, 4, 20); c = K.int(r, 4, 20); } while (a + b <= c || a + c <= b || b + c <= a);
      const which = T === "largest" ? (c >= a && c >= b ? "C" : a >= b ? "A" : "B") : "C";
      const [opp, x, y] = which === "C" ? [c, a, b] : which === "A" ? [a, b, c] : [b, a, c];
      const ang = deg(Math.acos((x * x + y * y - opp * opp) / (2 * x * y)));
      return { kind: "wr", template: T === "largest" ? "largest angle of a triangle" : "find an angle (SSS)", sig: `${T}|${a}|${b}|${c}`, title: "Cosine law",
        intro: T === "largest" ? R`A triangle has sides ${a}, ${b} and ${c}. Find its largest angle to the nearest tenth of a degree.` : R`In \(\triangle ABC\), \(a = ${a}\), \(b = ${b}\), \(c = ${c}\). Find \(\angle C\) to the nearest tenth of a degree.`,
        parts: [{ key: "a", label: "", prompt: "Angle (degrees) =", kind: "approx", answer: ang, dp: 1, marks: 2 }],
        solution: [...(T === "largest" ? [R`The largest angle is opposite the longest side, ${opp}.`] : []), R`\(\cos\theta = \dfrac{${x}^2 + ${y}^2 - ${opp}^2}{2(${x})(${y})} \approx ${((x * x + y * y - opp * opp) / (2 * x * y)).toFixed(4)}\).`, R`\(\theta \approx ${r1(ang).toFixed(1)}^\circ\).`],
        rubric: ["Rearranged cosine law — 1", "Angle — 1"], hints: ["cos C = (a² + b² − c²) / (2ab).", "The largest angle is opposite the longest side."] };
    },
  });

  B.family({
    id: "h_ambiguous", unit: "H", sub: "H.ambiguous", title: "The ambiguous case", concepts: ["trig.laws"],
    kinds: ["mc", "wr"], modes: ["normal", "challenge"], answer: "number of triangles / angles", complexity: { normal: 2, challenge: 3 },
    templates: ["how many triangles?", "both possible angles"],
    gen(r, mode, kind) {
      const A = K.int(r, 25, 70), b = K.int(r, 8, 30);
      const hgt = b * Math.sin(rad(A));
      if (kind === "mc") {
        const want = K.pick(r, [0, 1, 2]);
        let a;
        if (want === 0) a = Math.max(1, Math.floor(hgt) - K.int(r, 0, 2)); else if (want === 2) a = Math.ceil(hgt) + K.int(r, 0, Math.max(0, Math.floor(b - hgt) - 1)); else a = b + K.int(r, 1, 6);
        if (want === 0 && a >= hgt) throw new Error("x");
        if (want === 2 && !(a > hgt && a < b)) throw new Error("x");
        const n = a < hgt - 1e-9 ? 0 : Math.abs(a - hgt) < 1e-9 ? 1 : a >= b ? 1 : 2;
        if (n !== want) throw new Error("x");
        return { kind: "mc", c: [String(n), ...[0, 1, 2].filter((x) => x !== n).map(String), "It depends on side c"], template: "how many triangles?", sig: `${A}|${a}|${b}`,
          q: R`In \(\triangle ABC\), \(\angle A = ${A}^\circ\), \(a = ${a}\) and \(b = ${b}\). How many triangles are possible?`,
          e: R`Height \(h = b\sin A = ${b}\sin ${A}^\circ \approx ${hgt.toFixed(2)}\). ${n === 0 ? `a = ${a} < h: side a can't reach the base — no triangle.` : n === 2 ? `h < a < b (${hgt.toFixed(2)} < ${a} < ${b}): two triangles.` : `a ≥ b: one triangle.`}`,
          hints: ["Compare side a with the height h = b sin A and with b."] };
      }
      const a = Math.ceil(hgt) + K.int(r, 0, Math.max(0, Math.floor(b - hgt) - 1));
      if (!(a > hgt + 0.2 && a < b)) throw new Error("need two");
      const B1 = deg(Math.asin((b * Math.sin(rad(A))) / a)), B2 = 180 - B1;
      if (A + B2 >= 179.5) throw new Error("x");
      return { kind: "wr", template: "both possible angles", sig: `${A}|${a}|${b}`, title: "The ambiguous case", intro: R`In \(\triangle ABC\), \(\angle A = ${A}^\circ\), \(a = ${a}\) and \(b = ${b}\). Two triangles are possible. Find both possible measures of \(\angle B\) to the nearest tenth.`,
        parts: [{ key: "a", label: "(a)", prompt: "Acute ∠B:", kind: "approx", answer: B1, dp: 1, marks: 1 }, { key: "b", label: "(b)", prompt: "Obtuse ∠B:", kind: "approx", answer: B2, dp: 1, marks: 1 }],
        solution: [R`\(\sin B = \dfrac{${b}\sin ${A}^\circ}{${a}} \approx ${((b * Math.sin(rad(A))) / a).toFixed(4)}\), so \(B \approx ${r1(B1).toFixed(1)}^\circ\).`, R`The supplement also works: \(180^\circ - ${r1(B1).toFixed(1)}^\circ = ${r1(B2).toFixed(1)}^\circ\), and \(${A}^\circ + ${r1(B2).toFixed(1)}^\circ < 180^\circ\).`],
        rubric: ["Acute angle — 1", "Obtuse supplement — 1"], hints: ["sin B = sin(180° − B): the inverse sine only gives the acute one.", "Check that A + B < 180° for the obtuse answer."] };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
