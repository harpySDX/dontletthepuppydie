/*
 * Units A (real number system) and B (powers with rational exponents).
 * Every family: constrained parameters per mode, several genuinely different templates, a deterministic key
 * checked by the real marker, hints and a worked explanation that use the actual numbers.
 */
(function (root) {
  "use strict";
  const B = root.Bank; if (!B) return;
  const { K } = B;
  const R = String.raw;
  const SETS = ["Natural numbers", "Whole numbers", "Integers", "Rational numbers", "Irrational numbers"];
  const SET_SYM = { N: "natural", W: "whole", Z: "integers", Q: "rational", I: "irrational", R: "real" };

  // A number to classify, written in a way that may hide what it is. cls: N | W | Z | Q | I
  function classifiable(r, mode) {
    const sq = K.int(r, 2, 12), cu = K.int(r, 2, 5), a = K.int(r, 2, 9), b = K.int(r, 2, 9);
    const nonsq = K.pick(r, [2, 3, 5, 6, 7, 10, 11, 13, 15, 17, 19]);
    const simple = [
      { tex: String(K.int(r, 1, 40)), cls: "N", why: "a counting number" },
      { tex: "0", cls: "W", why: "zero is whole but not natural" },
      { tex: String(-K.int(r, 1, 30)), cls: "Z", why: "a negative whole number is an integer" },
      { tex: `${K.int(r, 1, 9)}.${K.int(r, 1, 9)}${K.int(r, 1, 9)}`, cls: "Q", why: "a terminating decimal is a fraction of integers" },
      { tex: R`\pi`, cls: "I", why: "π never ends or repeats" },
      { tex: R`\sqrt{${nonsq}}`, cls: "I", why: `${nonsq} isn't a perfect square` },
    ];
    const normal = [
      { tex: R`\sqrt{${sq * sq}}`, cls: "N", why: `it equals ${sq}` },
      { tex: R`\sqrt[3]{-${cu ** 3}}`, cls: "Z", why: `it equals −${cu}` },
      { tex: R`\sqrt{\tfrac{${a * a}}{${b * b}}}`, cls: a % b === 0 ? "N" : "Q", why: `it equals ${a}/${b}` },
      { tex: R`0.\overline{${K.int(r, 1, 9)}}`, cls: "Q", why: "a repeating decimal is rational" },
      { tex: R`\sqrt{${nonsq * 4}}`, cls: "I", why: `it is 2√${nonsq}` },
      { tex: R`-\dfrac{${a * 3}}{3}`, cls: "Z", why: `it equals −${a}` },
      { tex: R`\sqrt{0}`, cls: "W", why: "it equals 0" },
    ];
    const chall = [
      { tex: R`\sqrt{${nonsq * 3}}\cdot\sqrt{${nonsq * 3}}`, cls: "N", why: `it equals ${nonsq * 3}` },
      { tex: R`\dfrac{\sqrt{${nonsq * a * a}}}{\sqrt{${nonsq}}}`, cls: "N", why: `it equals √${a * a} = ${a}` },
      { tex: R`\left(\sqrt{${nonsq}}\right)^{2} - ${nonsq + a}`, cls: "Z", why: `it equals −${a}` },
      { tex: R`${a} + \sqrt{${nonsq}}`, cls: "I", why: "a rational plus an irrational is irrational" },
      { tex: R`\dfrac{\pi}{${a}\pi}`, cls: "Q", why: `it equals 1/${a}` },
      { tex: R`\sqrt[3]{\tfrac{-${cu ** 3}}{${(cu + 1) ** 3}}}`, cls: "Q", why: `it equals −${cu}/${cu + 1}` },
    ];
    return K.pick(r, mode === "simple" ? simple : mode === "normal" ? normal : chall);
  }
  const CLS_IDX = { N: 0, W: 1, Z: 2, Q: 3, I: 4 };

  B.family({
    id: "a_classify", unit: "A", sub: "A.classify", subs: ["A.classify", "A.rat_irr"], title: "Classify a real number", concepts: ["numbers.sets"],
    kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "choice", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["smallest set", "odd one out", "which belongs to a set"],
    gen(r, mode) {
      const t = K.pick(r, ["smallest", "odd", "belongs"]);
      if (t === "smallest") {
        const x = classifiable(r, mode);
        const correct = SETS[CLS_IDX[x.cls]];
        return { ...K.mc(correct, SETS.filter((s) => s !== correct)), template: "smallest set", sig: `s|${x.tex}`,
          q: R`What is the <b>smallest</b> set that contains \(${x.tex}\)?`,
          e: R`Simplify first: \(${x.tex}\) is ${x.why}. So the smallest set is ${correct.toLowerCase()}${x.cls === "I" ? "" : " (and it also belongs to every larger set up to the reals)"}.`,
          hints: ["Simplify the number before you classify it.", "Natural ⊂ whole ⊂ integers ⊂ rational ⊂ real; irrational numbers are the reals that aren't rational."] };
      }
      if (t === "odd") {
        // three of one family, one of the other
        const wantI = K.coin(r);
        const pool = []; let guard = 0;
        while (pool.length < 12 && guard++ < 80) { const x = classifiable(r, mode); if (!pool.some((p) => p.tex === x.tex)) pool.push(x); }
        const odd = pool.find((x) => (x.cls === "I") === wantI), same = pool.filter((x) => (x.cls === "I") !== wantI).slice(0, 3);
        if (!odd || same.length < 3) throw new Error("pool");
        return { ...K.mc(R`\(${odd.tex}\)`, same.map((x) => R`\(${x.tex}\)`)), template: "odd one out", sig: `o|${odd.tex}|${same.map((x) => x.tex).sort().join(",")}`,
          q: wantI ? "Which number is irrational?" : "Which number is rational?",
          e: R`\(${odd.tex}\) is ${odd.why}. The others: ${same.map((x) => R`\(${x.tex}\) is ${x.why}`).join("; ")}.`,
          hints: ["Simplify each one: perfect squares and cubes come out exactly.", "Irrational means the decimal never ends or repeats."] };
      }
      // belongs: "Which number is an integer but not a whole number?" etc.
      const asks = mode === "simple" ? [["Z", "W", "an integer but not a whole number"], ["W", "N", "whole but not natural"], ["Q", "Z", "rational but not an integer"]]
        : [["Z", "W", "an integer but not a whole number"], ["Q", "Z", "rational but not an integer"], ["I", "Q", "real but not rational"], ["W", "N", "whole but not natural"]];
      const [inS, notS, phrase] = K.pick(r, asks);
      const order = ["N", "W", "Z", "Q"];
      const fits = (c) => (inS === "I" ? c === "I" : c !== "I" && order.indexOf(c) <= order.indexOf(inS)) && !(notS !== "Q" && c !== "I" && order.indexOf(c) <= order.indexOf(notS)) && !(notS === "Q" && c !== "I");
      const pool = []; let guard = 0;
      while (pool.length < 14 && guard++ < 120) { const x = classifiable(r, mode); if (!pool.some((p) => p.tex === x.tex)) pool.push(x); }
      const good = pool.find((x) => fits(x.cls)), bad = pool.filter((x) => !fits(x.cls)).slice(0, 3);
      if (!good || bad.length < 3) throw new Error("pool");
      return { ...K.mc(R`\(${good.tex}\)`, bad.map((x) => R`\(${x.tex}\)`)), template: "which belongs to a set", sig: `b|${phrase}|${good.tex}`,
        q: `Which number is ${phrase}?`, e: R`\(${good.tex}\) is ${good.why}.`, hints: ["Simplify each number, then place it in the smallest set it fits."] };
    },
  });

  // Repeating / terminating decimals → fractions (exact, reduced)
  B.family({
    id: "a_decimal", unit: "A", sub: "A.rat_irr", title: "Decimals as fractions", concepts: ["numbers.sets"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "fraction (lowest terms)", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["terminating → fraction", "pure repeating → fraction", "mixed repeating → fraction", "which decimal is irrational"],
    gen(r, mode, kind) {
      if (kind === "mc") {
        const n = K.int(r, 2, 9), m = K.int(r, 1, 9), k = K.pick(r, [2, 3, 5, 7]);
        const irr = mode === "simple" ? R`\sqrt{${k}} \approx ${Math.sqrt(k).toFixed(4)}\ldots` : R`0.1011011101111\ldots\ (\text{the 1s keep growing})`;
        return { ...K.mc(R`\(${irr}\)`, [R`\(0.${n}${m}\overline{${k}}\)`, R`\(${n}.${m}${k}\)`, R`\(0.\overline{${n}${m}}\)`, R`\(\tfrac{${n}}{${k + 4}}\)`]), template: "which decimal is irrational", sig: `mc|${mode}|${n}${m}${k}`,
          q: "Which decimal represents an irrational number?", e: "A decimal is rational when it terminates or repeats a fixed block. A pattern that never settles into a repeating block (or the root of a non-perfect square) is irrational.",
          hints: ["Terminating and repeating decimals can always be written as fractions."] };
      }
      const T = mode === "simple" ? "term" : mode === "normal" ? K.pick(r, ["term", "pure"]) : K.pick(r, ["pure", "mixed"]);
      let num, den, tex, steps;
      if (T === "term") {
        const places = mode === "simple" ? K.int(r, 1, 2) : K.int(r, 2, 3);
        let v = K.int(r, 1, Math.pow(10, places) - 1); if (v % 10 === 0) v += 1;
        num = v; den = Math.pow(10, places);
        tex = (v / den).toFixed(places);
        steps = [R`\(${tex} = \dfrac{${v}}{${den}}\) (${places} decimal place${places > 1 ? "s" : ""} → denominator ${den}).`];
      } else if (T === "pure") {
        const len = mode === "challenge" ? K.int(r, 2, 3) : K.int(r, 1, 2);
        let block = K.int(r, 1, Math.pow(10, len) - 2); if (String(block).length < len && len > 1) block = Number(String(block).padStart(len, "0"));
        const bs = String(block).padStart(len, "0");
        if (new Set(bs).size === 1 && len > 1) throw new Error("degenerate block");
        num = block; den = Math.pow(10, len) - 1; tex = R`0.\overline{${bs}}`;
        steps = [R`Let \(x = ${tex}\). Multiply by \(10^{${len}}\): \(${Math.pow(10, len)}x = ${bs}.\overline{${bs}}\).`, R`Subtract: \(${den}x = ${block}\), so \(x = \dfrac{${block}}{${den}}\).`];
      } else {
        const a = K.int(r, 1, 9), b = K.int(r, 0, 9);
        if (a === b) throw new Error("same digit");
        // 0.a(b repeating) = (10a + b − a) / 90
        num = 10 * a + b - a; den = 90; tex = R`0.${a}\overline{${b}}`;
        steps = [R`Let \(x = ${tex}\). Then \(10x = ${a}.\overline{${b}}\) and \(100x = ${a}${b}.\overline{${b}}\).`, R`Subtract: \(90x = ${10 * a + b} - ${a} = ${num}\), so \(x = \dfrac{${num}}{90}\).`];
      }
      const g = K.gcd(num, den), n2 = num / g, d2 = den / g;
      if (d2 === 1) throw new Error("integer");
      return { kind: "wr", template: { term: "terminating → fraction", pure: "pure repeating → fraction", mixed: "mixed repeating → fraction" }[T], sig: `${T}|${num}/${den}`,
        title: "Decimals as fractions", intro: R`Write \(${tex}\) as a fraction in lowest terms.`,
        parts: [{ key: "a", label: "", prompt: "Fraction:", kind: "expr", answer: `${n2}/${d2}`, form: "simplest", marks: 2 }],
        solution: [...steps, g > 1 ? R`Reduce by ${g}: \(\dfrac{${num}}{${den}} = \dfrac{${n2}}{${d2}}\).` : R`\(\dfrac{${n2}}{${d2}}\) is already in lowest terms.`],
        rubric: ["Correct fraction — 1", "Lowest terms — 1"],
        hints: T === "term" ? ["Count decimal places: that many zeros in the denominator.", "Then divide top and bottom by their GCF."] : ["Let x equal the decimal, multiply by a power of 10 so the repeating parts line up, then subtract.", "Reduce your fraction at the end."] };
    },
  });

  // Number-set relationships
  B.family({
    id: "a_sets", unit: "A", sub: "A.sets", title: "How the number sets fit together", concepts: ["numbers.sets"],
    kinds: ["mc"], modes: ["simple", "normal", "challenge"], answer: "choice", complexity: { simple: 1, normal: 2, challenge: 2 },
    templates: ["true statement about sets", "false statement about sets", "counterexample"],
    gen(r, mode) {
      const chain = ["N", "W", "Z", "Q", "R"];
      const subset = (x, y) => (x === "I" ? y === "I" || y === "R" : y === "I" ? false : chain.indexOf(x) <= chain.indexOf(y));
      const name = (s) => ({ N: "natural number", W: "whole number", Z: "integer", Q: "rational number", I: "irrational number", R: "real number" }[s]);
      const pairs = [];
      const all = mode === "simple" ? ["N", "W", "Z", "Q"] : ["N", "W", "Z", "Q", "I", "R"];
      for (const x of all) for (const y of all) if (x !== y) pairs.push([x, y]);
      const stmt = ([x, y]) => `Every ${name(x)} is a${/^[aeiou]/.test(name(y)) ? "n" : ""} ${name(y)}.`;
      const T = mode === "challenge" ? K.pick(r, ["true", "false", "counter"]) : K.pick(r, ["true", "false"]);
      if (T === "counter") {
        const [x, y] = K.pick(r, [["Q", "Z", R`\tfrac{1}{2}`], ["Z", "W", "-3"], ["W", "N", "0"], ["R", "Q", R`\sqrt{2}`]]);
        const ex = { "Q|Z": [R`\tfrac{1}{2}`, R`\tfrac{7}{4}`], "Z|W": ["-3", "-11"], "W|N": ["0"], "R|Q": [R`\sqrt{2}`, R`\pi`] }[`${x}|${y}`];
        const good = K.pick(r, ex);
        const bads = { "Q|Z": ["4", "-6", R`\tfrac{8}{2}`, "0"], "Z|W": ["5", "0", R`\sqrt{9}`], "W|N": ["7", "12", R`\sqrt{16}`], "R|Q": [R`\tfrac{3}{5}`, "0.25", R`\sqrt{25}`, "-4"] }[`${x}|${y}`];
        return { ...K.mc(R`\(${good}\)`, K.shuffle(r, bads).map((b) => R`\(${b}\)`)), template: "counterexample", sig: `c|${x}${y}|${good}`,
          q: `Which number shows that the statement “${stmt([x, y])}” is false?`, e: R`\(${good}\) is a ${name(x)} but not a ${name(y)}, so it is a counterexample.`, hints: ["A counterexample belongs to the first set but not the second."] };
      }
      const truth = T === "true";
      const good = K.pick(r, pairs.filter((p) => subset(...p) === truth));
      const bad = K.sample(r, pairs.filter((p) => subset(...p) !== truth), 3);
      return { ...K.mc(stmt(good), bad.map(stmt)), template: truth ? "true statement about sets" : "false statement about sets", sig: `${T}|${good.join("")}|${bad.map((b) => b.join("")).sort().join(",")}`,
        q: truth ? "Which statement is true?" : "Which statement is false?",
        e: `Natural ⊂ whole ⊂ integers ⊂ rational ⊂ real, and the irrational numbers are the real numbers that aren't rational. ${stmt(good)} is ${truth ? "true" : "false"}.`,
        hints: ["Picture the nested sets: N inside W inside Z inside Q inside R. Irrationals sit beside Q, inside R."] };
    },
  });

  // Ordering real numbers given in different forms
  B.family({
    id: "a_order", unit: "A", sub: "A.order", subs: ["A.order", "C.order"], title: "Order real numbers", concepts: ["numbers.sets", "radicals.mixed_entire"],
    kinds: ["mc", "nr"], modes: ["simple", "normal", "challenge"], answer: "ordering", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["increasing order", "greatest value", "between two integers"],
    gen(r, mode, kind) {
      const forms = () => {
        const out = [];
        const add = (tex, v) => { if (!out.some((o) => Math.abs(o.v - v) < (mode === "challenge" ? 0.02 : 0.08))) out.push({ tex, v }); };
        let guard = 0;
        while (out.length < 6 && guard++ < 200) {
          const t = K.int(r, 0, mode === "simple" ? 2 : 4);
          const base = mode === "challenge" ? K.int(r, 5, 9) : K.int(r, 2, 9);
          if (t === 0) { const v = base + K.int(r, 1, 9) / 10; add(v.toFixed(1), v); }
          else if (t === 1) { const d = K.int(r, 2, 9), n = base * d + K.int(r, 1, d - 1); add(R`\tfrac{${n}}{${d}}`, n / d); }
          else if (t === 2) { const n = K.int(r, base * base + 1, (base + 1) * (base + 1) - 1); if (Math.sqrt(n) % 1) add(R`\sqrt{${n}}`, Math.sqrt(n)); }
          else if (t === 3) { const a = K.int(r, 2, 4), b = K.pick(r, [2, 3, 5, 6, 7]); const v = a * Math.sqrt(b); if (v < 12) add(R`${a}\sqrt{${b}}`, v); }
          else { const v = base + K.int(r, 1, 8) / 9; add(R`${base}.\overline{${Math.round((v - base) * 9)}}`, v); }
        }
        return out;
      };
      const xs = K.sample(r, forms(), 4);
      if (xs.length < 4) throw new Error("not enough");
      if (kind === "nr") {
        // between which two consecutive integers is the largest?  → answer the lower integer
        const top = xs.slice().sort((a, b) => b.v - a.v)[0];
        const lo = Math.floor(top.v);
        return { kind: "nr", template: "between two integers", sig: `nr|${xs.map((x) => x.tex).sort().join(",")}`, answer: lo, ansText: String(lo),
          q: R`Of \(${xs.map((x) => x.tex).join(",\\ ")}\), the greatest lies between two consecutive integers \(n\) and \(n+1\). What is \(n\)?`,
          e: R`Approximate: ${xs.map((x) => R`\(${x.tex} \approx ${x.v.toFixed(3)}\)`).join(", ")}. The greatest is \(${top.tex}\), between ${lo} and ${lo + 1}.`,
          hints: ["Turn every number into a decimal (or square the radicals to compare).", "√n is between the square roots of the perfect squares around n."] };
      }
      const sorted = xs.slice().sort((a, b) => a.v - b.v);
      const list = (arr) => R`\(${arr.map((x) => x.tex).join(",\\ ")}\)`;
      const wrong = [sorted.slice().reverse(), [sorted[1], sorted[0], sorted[2], sorted[3]], [sorted[0], sorted[2], sorted[1], sorted[3]], [sorted[0], sorted[1], sorted[3], sorted[2]]];
      if (K.coin(r)) {
        const top = sorted[3];
        return { ...K.mc(R`\(${top.tex}\)`, sorted.slice(0, 3).map((x) => R`\(${x.tex}\)`)), template: "greatest value", sig: `g|${xs.map((x) => x.tex).sort().join(",")}`,
          q: R`Which number is the greatest?`, e: R`As decimals: ${sorted.map((x) => R`\(${x.tex} \approx ${x.v.toFixed(3)}\)`).join(", ")}.`, hints: ["Write a√b as an entire radical √(a²b) to compare roots, or use decimals."] };
      }
      return { ...K.mc(list(sorted), K.shuffle(r, wrong).map(list)), template: "increasing order", sig: `o|${xs.map((x) => x.tex).sort().join(",")}`,
        q: "Which list is in order from least to greatest?", e: R`As decimals: ${sorted.map((x) => R`\(${x.tex} \approx ${x.v.toFixed(3)}\)`).join(", ")}.`,
        hints: ["Convert each number to a decimal to two or three places.", "For a√b, square it: (a√b)² = a²b, then compare."] };
    },
  });

  // ───────── Unit B ─────────
  const sup = (e) => (e === 1 ? "" : `^{${e}}`);
  const mono = (c, ps) => { // ps: [[letter, exp]] → typed text with positive/negative exps
    let s = c === 1 ? "" : c === -1 ? "-" : String(c);
    for (const [v, e] of ps) if (e !== 0) s += e === 1 ? v : `${v}^${e < 0 ? `(${e})` : e}`;
    return s || "1";
  };
  const monoTeX = (c, ps) => {
    let s = c === 1 ? "" : c === -1 ? "-" : String(c);
    for (const [v, e] of ps) if (e !== 0) s += `${v}${sup(e)}`;
    return s || "1";
  };
  // positive-exponent answer as text: num/den
  const posAnswer = (c, ps) => {
    const num = ps.filter(([, e]) => e > 0), den = ps.filter(([, e]) => e < 0).map(([v, e]) => [v, -e]);
    const n = mono(c, num), d = mono(1, den);
    return den.length ? `${n === "" ? "1" : n === "-" ? "-1" : n}/(${d})` : n;
  };
  const posTeX = (c, ps) => {
    const num = ps.filter(([, e]) => e > 0), den = ps.filter(([, e]) => e < 0).map(([v, e]) => [v, -e]);
    const n = monoTeX(c, num);
    return den.length ? R`${c < 0 ? "-" : ""}\dfrac{${monoTeX(Math.abs(c), num) || "1"}}{${monoTeX(1, den)}}` : n;
  };

  B.family({
    id: "b_laws", unit: "B", sub: "B.laws", title: "Exponent laws", concepts: ["exponents.laws"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "expression", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["product of powers", "quotient of powers", "power of a product", "combined laws"],
    gen(r, mode) {
      const letters = K.sample(r, ["a", "b", "x", "y", "m", "n"], 2).sort();
      const T = mode === "simple" ? K.pick(r, ["product", "quotient", "power"]) : mode === "normal" ? K.pick(r, ["product", "quotient", "power", "combined"]) : K.pick(r, ["combined", "combined", "power", "quotient"]);
      const [u, v] = letters;
      let tex, c, eu, ev, steps;
      if (T === "product") {
        const c1 = K.int(r, 2, 6), c2 = K.int(r, 2, 6), a1 = K.int(r, 1, 6), a2 = K.int(r, 1, 6), b1 = mode === "simple" ? 0 : K.int(r, 1, 4), b2 = mode === "simple" ? 0 : K.int(r, 1, 4);
        tex = R`\left(${monoTeX(c1, [[u, a1], [v, b1]])}\right)\left(${monoTeX(c2, [[u, a2], [v, b2]])}\right)`;
        c = c1 * c2; eu = a1 + a2; ev = b1 + b2;
        steps = [R`Multiply the coefficients: \(${c1} \times ${c2} = ${c}\).`, R`Same base: add exponents, \(${u}^{${a1}+${a2}} = ${u}^{${eu}}\)${ev ? R`, \(${v}^{${b1}+${b2}} = ${v}^{${ev}}\)` : ""}.`];
      } else if (T === "quotient") {
        const c2 = K.int(r, 2, 5), c = K.int(r, 2, 6), c1 = c * c2;
        const a2 = K.int(r, 1, 5), eu0 = K.int(r, 1, 5), a1 = a2 + eu0;
        const b2 = mode === "simple" ? 0 : K.int(r, 1, 4), ev0 = mode === "simple" ? 0 : K.int(r, 1, 4), b1 = b2 + ev0;
        tex = R`\dfrac{${monoTeX(c1, [[u, a1], [v, b1]])}}{${monoTeX(c2, [[u, a2], [v, b2]])}}`;
        eu = eu0; ev = ev0;
        steps = [R`Divide the coefficients: \(${c1} \div ${c2} = ${c}\).`, R`Same base: subtract exponents, \(${u}^{${a1}-${a2}} = ${u}^{${eu}}\)${ev ? R`, \(${v}^{${b1}-${b2}} = ${v}^{${ev}}\)` : ""}.`];
        return out(T, tex, c, eu, ev, steps);
      } else if (T === "power") {
        const c0 = K.int(r, 2, mode === "simple" ? 3 : 4), a = K.int(r, 1, 4), b = mode === "simple" ? 0 : K.int(r, 1, 3), p = K.int(r, 2, 3);
        tex = R`\left(${monoTeX(c0, [[u, a], [v, b]])}\right)^{${p}}`;
        c = Math.pow(c0, p); eu = a * p; ev = b * p;
        steps = [R`Raise every factor to the power ${p}: \(${c0}^{${p}} = ${c}\) (the coefficient too).`, R`Power of a power: multiply exponents, \(${u}^{${a}\cdot${p}} = ${u}^{${eu}}\)${ev ? R`, \(${v}^{${b}\cdot${p}} = ${v}^{${ev}}\)` : ""}.`];
      } else {
        const c0 = K.int(r, 2, 3), a = K.int(r, 1, 3), b = K.int(r, 1, 3), p = 2, cd = K.pick(r, [2, 4]);
        const da = K.int(r, 1, 2 * a), db = K.int(r, 1, 2 * b);
        if ((Math.pow(c0, p)) % cd) throw new Error("coef");
        tex = R`\dfrac{\left(${monoTeX(c0, [[u, a], [v, b]])}\right)^{${p}}}{${monoTeX(cd, [[u, da], [v, db]])}}`;
        c = Math.pow(c0, p) / cd; eu = a * p - da; ev = b * p - db;
        if (eu < 0 || ev < 0 || (eu === 0 && ev === 0)) throw new Error("keep positive in this template");
        steps = [R`Numerator: \(\left(${monoTeX(c0, [[u, a], [v, b]])}\right)^{2} = ${monoTeX(c0 * c0, [[u, 2 * a], [v, 2 * b]])}\).`, R`Divide: \(${c0 * c0} \div ${cd} = ${c}\), \(${u}^{${2 * a}-${da}} = ${u}${sup(eu)}\), \(${v}^{${2 * b}-${db}} = ${v}${sup(ev)}\).`];
      }
      return out(T, tex, c, eu, ev, steps);
      function out(T, tex, c, eu, ev, steps) {
        const ps = [[u, eu], [v, ev]];
        return { kind: "wr", template: { product: "product of powers", quotient: "quotient of powers", power: "power of a product", combined: "combined laws" }[T], sig: `${T}|${tex}`,
          title: "Exponent laws", intro: R`Simplify \(${tex}\).`,
          parts: [{ key: "a", label: "", prompt: "Simplified:", kind: "mono", answer: mono(c, ps), form: "positive", marks: 2, ansTex: monoTeX(c, ps) }],
          solution: [...steps, R`Answer: \(${monoTeX(c, ps)}\).`], rubric: ["Coefficient — 1", "Exponents — 1"],
          hints: T === "power" ? ["Every factor inside the bracket gets the outside exponent — including the number.", "(xᵐ)ⁿ = xᵐⁿ."] : T === "quotient" ? ["Divide numbers; subtract exponents of the same base."] : ["Multiply numbers; add exponents of the same base."] };
      }
    },
  });

  B.family({
    id: "b_negative", unit: "B", sub: "B.negative", title: "Negative exponents", concepts: ["exponents.negative"],
    kinds: ["nr", "wr"], modes: ["simple", "normal", "challenge"], answer: "number / expression", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["evaluate a negative power", "rewrite with positive exponents", "negative power of a fraction"],
    gen(r, mode, kind) {
      if (kind === "nr") {
        const T = mode === "simple" ? "int" : K.pick(r, ["int", "frac"]);
        if (T === "int") {
          const b = K.int(r, 2, mode === "simple" ? 10 : 9), e = K.int(r, 1, mode === "simple" ? 2 : 3), c = mode === "challenge" ? K.int(r, 2, 5) : mode === "simple" ? K.int(r, 1, 3) : 1;
          if (Math.pow(b, e) > 1000 || (mode === "simple" && Math.pow(b, e) > 100)) throw new Error("size");
          const val = c / Math.pow(b, e);
          return { kind: "nr", template: "evaluate a negative power", sig: `int|${c}|${b}|${e}`, answer: val, ansText: `${c}/${Math.pow(b, e)}`,
            q: R`Evaluate \(${c === 1 ? "" : c}${b}^{-${e}}\). Give an exact answer (a fraction is fine).`,
            e: R`\(${b}^{-${e}} = \dfrac{1}{${b}^{${e}}} = \dfrac{1}{${Math.pow(b, e)}}\)${c === 1 ? "" : R`, so \(${c}${b}^{-${e}} = \dfrac{${c}}{${Math.pow(b, e)}}\)`}. The coefficient stays in the numerator.`,
            hints: ["A negative exponent means reciprocal: a⁻ⁿ = 1/aⁿ."] };
        }
        const p = K.int(r, 2, 5), q = K.int(r, 2, 7), e = K.int(r, 1, 2);
        if (p === q || K.gcd(p, q) > 1) throw new Error("reduce");
        const val = Math.pow(q / p, e);
        return { kind: "nr", template: "negative power of a fraction", sig: `frac|${p}/${q}|${e}`, answer: val, ansText: `${Math.pow(q, e)}/${Math.pow(p, e)}`,
          q: R`Evaluate \(\left(\dfrac{${p}}{${q}}\right)^{-${e}}\).`, e: R`Flip the fraction and make the exponent positive: \(\left(\dfrac{${q}}{${p}}\right)^{${e}} = \dfrac{${Math.pow(q, e)}}{${Math.pow(p, e)}}\).`,
          hints: ["(a/b)⁻ⁿ = (b/a)ⁿ."] };
      }
      const [u, v] = K.sample(r, ["a", "b", "x", "y"], 2).sort();
      const c = K.int(r, 2, 6), a = -K.int(r, 1, 4), b = K.int(r, 1, 4);
      let tex, ps, cc, steps;
      if (mode === "simple") { tex = monoTeX(c, [[u, a]]); ps = [[u, a]]; cc = c; steps = [R`\(${u}^{${a}} = \dfrac{1}{${u}^{${-a}}}\), and the ${c} is not affected.`]; }
      else if (mode === "normal") { tex = R`\dfrac{${monoTeX(c, [[u, a]])}}{${monoTeX(1, [[v, -b]])}}`; ps = [[u, a], [v, b]]; cc = c; steps = [R`A negative exponent moves a factor across the fraction bar: \(${u}^{${a}}\) goes down as \(${u}^{${-a}}\), \(${v}^{${-b}}\) goes up as \(${v}^{${b}}\).`]; }
      else {
        const p = -K.int(r, 2, 3), e1 = K.int(r, 1, 3), e2 = -K.int(r, 1, 3);
        tex = R`\left(${monoTeX(1, [[u, e1], [v, e2]])}\right)^{${p}}`; ps = [[u, e1 * p], [v, e2 * p]]; cc = 1;
        steps = [R`Multiply each exponent by ${p}: \(${u}^{${e1 * p}}\,${v}^{${e2 * p}}\).`, R`Move negative exponents below the bar.`];
      }
      return { kind: "wr", template: "rewrite with positive exponents", sig: `w|${mode}|${tex}`, title: "Negative exponents", intro: R`Write \(${tex}\) using only positive exponents.`,
        parts: [{ key: "a", label: "", prompt: "Answer:", kind: "mono", answer: posAnswer(cc, ps), form: "positive", marks: 1, ansTex: posTeX(cc, ps) }],
        solution: [...steps, R`Answer: \(${posTeX(cc, ps)}\).`], rubric: ["Positive exponents, equal value — 1"], hints: ["x⁻ⁿ = 1/xⁿ, and 1/x⁻ⁿ = xⁿ.", "Only the factor with the negative exponent moves."] };
    },
  });

  B.family({
    id: "b_rational", unit: "B", sub: "B.rational", title: "Evaluate rational exponents", concepts: ["exponents.rational"],
    kinds: ["nr", "mc"], modes: ["simple", "normal", "challenge"], answer: "number", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["unit fraction exponent", "m/n exponent", "negative fractional exponent of a fraction", "spot the error"],
    gen(r, mode, kind) {
      const n = mode === "simple" ? K.int(r, 2, 3) : K.int(r, 2, 4);
      const base = K.int(r, 2, n === 2 ? (mode === "simple" ? 15 : 9) : n === 3 ? (mode === "simple" ? 6 : 5) : 3);
      const m = mode === "simple" ? 1 : K.int(r, 2, 3);
      const neg = mode === "challenge";
      const qd = neg ? K.int(r, 2, n === 2 ? 5 : 3) : 1;
      if (neg && K.gcd(base, qd) > 1) throw new Error("reduce");
      const P = Math.pow(base, n), Q = Math.pow(qd, n);
      const val = neg ? Math.pow(qd / base, m) : Math.pow(base, m);
      const baseTeX = neg ? R`\left(\dfrac{${P}}{${Q}}\right)` : String(P);
      const expTeX = `${neg ? "-" : ""}${m === 1 ? `\\frac{1}{${n}}` : `\\frac{${m}}{${n}}`}`;
      const ans = neg ? `${Math.pow(qd, m)}/${Math.pow(base, m)}` : String(val);
      const steps = R`Take the root first: \(\sqrt[${n}]{${neg ? `\\tfrac{${P}}{${Q}}` : P}} = ${neg ? `\\tfrac{${base}}{${qd}}` : base}\). ${m > 1 ? R`Then raise to the power ${m}.` : ""} ${neg ? "The negative exponent flips the fraction." : ""}`;
      if (kind === "mc") {
        const wrongs = [neg ? Math.pow(base / qd, m) : P * m / n, neg ? -val : Math.pow(P, 1 / m), neg ? Math.pow(base, m) : (P * m) / n + 1, m === 1 ? P / n : Math.pow(base, m + 1)];
        const fmt = (x) => (Number.isInteger(x) ? String(x) : (() => { for (let d = 2; d <= 400; d++) { const k = Math.round(x * d); if (Math.abs(k / d - x) < 1e-9) return R`\tfrac{${k}}{${d}}`; } return x.toFixed(3); })());
        const opts = wrongs.map(fmt).map((s) => R`\(${s}\)`);
        return { ...K.mc(R`\(${fmt(val)}\)`, opts, { vals: undefined }), template: "spot the error", sig: `mc|${baseTeX}|${expTeX}`, q: R`Evaluate \(${baseTeX}^{${expTeX}}\).`, e: steps, hints: ["The denominator of the exponent is the root; the numerator is the power."] };
      }
      return { kind: "nr", template: neg ? "negative fractional exponent of a fraction" : m === 1 ? "unit fraction exponent" : "m/n exponent", sig: `${baseTeX}|${expTeX}`, answer: val, ansText: ans,
        q: R`Evaluate \(${baseTeX}^{${expTeX}}\) exactly.`, e: steps, hints: ["a^(m/n) = (ⁿ√a)ᵐ — take the root first to keep numbers small.", ...(neg ? ["A negative exponent means reciprocal."] : [])] };
    },
  });

  B.family({
    id: "b_convert", unit: "B", sub: "B.convert", title: "Powers ↔ radicals", concepts: ["exponents.rational"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "expression", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["power → radical", "radical → power", "simplify then convert"],
    gen(r, mode) {
      const v = K.pick(r, ["x", "a", "y", "b", "m", "t"]);
      const n = K.int(r, 2, 5), m = mode === "simple" ? 1 : K.int(r, 2, 7);
      if (m % n === 0 || K.gcd(m, n) > 1) throw new Error("reduce");
      const toRad = K.coin(r);
      const radTeX = n === 2 ? R`\sqrt{${v}${sup(m)}}` : R`\sqrt[${n}]{${v}${sup(m)}}`;
      const powTeX = R`${v}^{\frac{${m}}{${n}}}`;
      const c = mode === "challenge" ? K.int(r, 2, 5) : 1;
      if (toRad) {
        return { kind: "wr", template: "power → radical", sig: `pr|${c}|${v}|${m}/${n}`, title: "Powers and radicals", intro: R`Write \(${c === 1 ? "" : c}${powTeX}\) in radical form.`,
          parts: [{ key: "a", label: "", prompt: "Radical form:", kind: "mono", answer: `${c === 1 ? "" : c + "*"}root(${v}^${m},${n})`, form: "radical", marks: 1, ansTex: `${c === 1 ? "" : c}${radTeX}` }],
          solution: [R`The denominator ${n} is the index of the root and the numerator ${m} is the power: \(${powTeX} = ${radTeX}\).${c > 1 ? ` The coefficient ${c} stays outside.` : ""}`],
          rubric: ["Correct radical — 1"], hints: [R`a^(m/n) = ⁿ√(aᵐ). Type roots as root(x^3, 4) or √(…) for square roots.`] };
      }
      return { kind: "wr", template: "radical → power", sig: `rp|${c}|${v}|${m}/${n}`, title: "Powers and radicals", intro: R`Write \(${c === 1 ? "" : c}${radTeX}\) as a power with a rational exponent.`,
        parts: [{ key: "a", label: "", prompt: "Power form:", kind: "mono", answer: `${c === 1 ? "" : c + "*"}${v}^(${m}/${n})`, form: "power", marks: 1, ansTex: `${c === 1 ? "" : c}${powTeX}` }],
        solution: [R`\(\sqrt[n]{${v}^{m}} = ${v}^{m/n}\), so \(${radTeX} = ${powTeX}\).`], rubric: ["Correct power — 1"], hints: ["The index of the root goes in the denominator of the exponent. Type it as x^(3/4)."] };
    },
  });

  B.family({
    id: "b_order_ops", unit: "B", sub: "B.order_ops", title: "Order of operations with powers", concepts: ["exponents.laws"],
    kinds: ["nr", "mc"], modes: ["simple", "normal", "challenge"], answer: "number", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["negative base vs negative of a power", "powers in a fraction", "nested brackets"],
    gen(r, mode, kind) {
      const a = K.int(r, 2, 5), e = K.pick(r, [2, 4]), b = K.int(r, 2, 4), c = K.int(r, 2, 6);
      const T = mode === "simple" ? "neg" : mode === "normal" ? K.pick(r, ["neg", "frac"]) : K.pick(r, ["frac", "nest"]);
      let tex, val, steps, wrong;
      if (T === "neg") {
        tex = R`-${a}^{${e}} + (-${b})^{${e}} \times ${c}`;
        val = -Math.pow(a, e) + Math.pow(b, e) * c;
        steps = [R`\(-${a}^{${e}} = -${Math.pow(a, e)}\): the exponent applies only to ${a}.`, R`\((-${b})^{${e}} = ${Math.pow(b, e)}\): an even power of a negative is positive.`, R`Multiply before adding: \(-${Math.pow(a, e)} + ${Math.pow(b, e)} \times ${c} = ${val}\).`];
        wrong = [Math.pow(a, e) + Math.pow(b, e) * c, (-Math.pow(a, e) + Math.pow(b, e)) * c, -Math.pow(a, e) - Math.pow(b, e) * c];
      } else if (T === "frac") {
        const d = K.int(r, 2, 3), k = K.int(r, 1, 3);
        const num = Math.pow(a, 3) - Math.pow(b, 2) * k, den = Math.pow(d, 2) - 1 + k;
        if (num % den) throw new Error("nice");
        tex = R`\dfrac{${a}^{3} - ${k === 1 ? "" : k}${b}^{2}}{${d}^{2} - 1 + ${k}}`;
        val = num / den;
        steps = [R`Numerator: \(${Math.pow(a, 3)} - ${k * b * b} = ${num}\).`, R`Denominator: \(${d * d} - 1 + ${k} = ${den}\).`, R`Divide: \(${num} \div ${den} = ${val}\).`];
        wrong = [val + 1, -val, (Math.pow(a, 3) - b * b) / den + 2];
      } else {
        const p = K.int(r, 2, 3);
        tex = R`\left(${c} - ${b}^{2}\right)^{${p}} - 2\left(${a} - ${c}\right)^{2}`;
        val = Math.pow(c - b * b, p) - 2 * Math.pow(a - c, 2);
        steps = [R`Inside brackets first: \(${c} - ${b * b} = ${c - b * b}\) and \(${a} - ${c} = ${a - c}\).`, R`Powers: \((${c - b * b})^{${p}} = ${Math.pow(c - b * b, p)}\) and \((${a - c})^{2} = ${Math.pow(a - c, 2)}\).`, R`Then \(${Math.pow(c - b * b, p)} - 2(${Math.pow(a - c, 2)}) = ${val}\).`];
        wrong = [Math.pow(c - b * b, p) - Math.pow(2 * (a - c), 2), Math.pow(c - b * b, p) + 2 * Math.pow(a - c, 2), Math.pow(c, p) - b * b - 2 * Math.pow(a - c, 2)];
      }
      if (!Number.isInteger(val)) throw new Error("int");
      if (kind === "mc") return { ...K.mc(R`\(${val}\)`, wrong.map((w) => R`\(${w}\)`), { vals: [val, ...wrong.slice(0, 3)] }), template: { neg: "negative base vs negative of a power", frac: "powers in a fraction", nest: "nested brackets" }[T], sig: `mc|${tex}`, q: R`Evaluate \(${tex}\).`, e: steps.join(" "), hints: ["Brackets, then powers, then × ÷, then + −.", "−aⁿ is not (−a)ⁿ."] };
      return { kind: "nr", template: { neg: "negative base vs negative of a power", frac: "powers in a fraction", nest: "nested brackets" }[T], sig: `nr|${tex}`, answer: val, ansText: String(val), q: R`Evaluate \(${tex}\).`, e: steps.join(" "), hints: ["Brackets, then powers, then × ÷, then + −.", "−aⁿ is not (−a)ⁿ."] };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
