/*
 * Insights — turns saved test history into "what to work on".
 * Pure functions: give it the history, a question lookup and a part grader.
 */
(function (root) {
  "use strict";

  // One practical tip per topic, shown when that topic needs work.
  const TIPS = {
    "Simplifying radicals": "Pull out the largest perfect square (or cube) in one step, then check that nothing under the root still has a square factor.",
    "Mixed & entire radicals": "Mixed → entire: square (or cube) the coefficient and multiply it inside. Entire → mixed: take out the largest perfect power.",
    "Adding & subtracting radicals": "Simplify every radical first, then combine only like radicals. Never add the radicands.",
    "Multiplying radicals": "Coefficients times coefficients, radicands times radicands, then simplify. When you FOIL, don't drop the middle terms.",
    "Conjugates": "A conjugate flips only the middle sign: (a + √b)(a − √b) = a² − b. That's why it clears the radical.",
    "Dividing & rationalizing": "One-term denominator: multiply by the radical. Two-term denominator: multiply by its conjugate. Then reduce the fraction.",
    "Restrictions": "Even roots need radicand ≥ 0. If the radical is in a denominator, it has to be > 0.",
    "Radical equations": "Isolate the radical before you square, then plug every answer back into the original equation to catch extraneous roots.",
    "Factoring": "GCF first, then look for a difference of squares, a trinomial, or quadratic form (let u = x²).",
    "Applications": "Sketch it, write the formula (perimeter, area or Pythagoras), substitute, then simplify the radical at the end.",
    "Number systems": "Evaluate the number first (∛−64 = −4), then walk the chain: natural ⊂ whole ⊂ integer ⊂ rational ⊂ real. Irrational is its own branch.",
    "Exponent laws": "A negative exponent means reciprocal. In a fractional exponent, the denominator is the root and the numerator is the power.",
    "Find the mistake": "Redo each line yourself and compare. Usual traps: √(a + b) ≠ √a + √b, not squaring the coefficient, and not checking roots.",
  };

  const HABITS = {
    simplest: { label: "Right value, not in simplest form", tip: "Before moving on, check: radicals simplified, like terms combined, fraction reduced." },
    rationalize: { label: "Denominator left with a radical", tip: "A rationalizing answer earns nothing until the denominator is radical-free." },
    extraneous: { label: "Kept an extraneous root", tip: "Squaring creates fake solutions. Substitute every value into the original equation." },
    entire: { label: "Entire radical written as mixed", tip: "An entire radical has nothing outside the root: 5√3 = √75." },
    blank: { label: "Questions left blank", tip: "A partial answer can still earn method marks. Write something for every part." },
  };

  function classifyNote(g) {
    if (!g || g.earned >= g.max) return null;
    if (g.verdict === "blank") return "blank";
    const n = g.note || "";
    if (/isn't rationalized/.test(n)) return "rationalize";
    if (/not in simplest form/.test(n)) return "simplest";
    if (/extraneous|doesn't check/.test(n)) return "extraneous";
    if (/entire radical/.test(n)) return "entire";
    return null;
  }

  /*
   * history: saved attempts
   * lookup(item) → question object or undefined
   * gradeParts(item) → [{earned, max, verdict, note}] for written-response items
   */
  function analyze(history, lookup, gradeParts) {
    const tests = history.slice().sort((a, b) => a.date - b.date);
    const out = {
      count: tests.length,
      trend: tests.map((t) => ({ id: t.id, date: t.date, pct: t.percent, time: t.totalTime })),
      best: null, avgPct: null, recentAvg: null, studySeconds: 0,
      sections: {}, topics: [], habits: [], slowTopic: null, improving: null,
    };
    if (!tests.length) return out;

    out.best = tests.slice().sort((a, b) => b.percent - a.percent || a.totalTime - b.totalTime)[0];
    out.avgPct = Math.round(tests.reduce((s, t) => s + t.percent, 0) / tests.length * 10) / 10;
    const recent = tests.slice(-5);
    out.recentAvg = Math.round(recent.reduce((s, t) => s + t.percent, 0) / recent.length * 10) / 10;
    out.studySeconds = tests.reduce((s, t) => s + t.totalTime, 0);
    if (tests.length >= 2) out.improving = Math.round((tests[tests.length - 1].percent - tests[0].percent) * 10) / 10;

    // Sections
    for (const t of tests) for (const [k, v] of Object.entries(t.sections || {})) {
      const s = out.sections[k] || { earned: 0, max: 0 };
      s.earned += v.earned; s.max += v.max; out.sections[k] = s;
    }

    // Topics — recent tests weigh more (each older test counts 85% of the next)
    const topics = new Map();
    const habits = {};
    tests.forEach((t, ti) => {
      const w = Math.pow(0.85, tests.length - 1 - ti);
      for (const it of t.items || []) {
        const q = lookup(it);
        if (!q) continue;
        const k = topics.get(q.topic) || { topic: q.topic, wE: 0, wM: 0, earned: 0, max: 0, seen: 0, time: 0, last: null };
        k.wE += w * it.earned; k.wM += w * it.max;
        k.earned += it.earned; k.max += it.max; k.seen++; k.time += it.time || 0;
        if (ti === tests.length - 1) k.last = (k.last || { e: 0, m: 0 }), k.last.e += it.earned, k.last.m += it.max;
        topics.set(q.topic, k);

        // Habits
        if (it.kind === "wr") {
          for (const g of gradeParts(it)) {
            const h = classifyNote(g);
            if (h) { habits[h] = habits[h] || { marks: 0, count: 0 }; habits[h].marks += g.max - g.earned; habits[h].count++; }
          }
        } else if (it.earned < it.max && (it.kind === "nr" ? !String(it.response || "").trim() : it.chosen === null)) {
          habits.blank = habits.blank || { marks: 0, count: 0 }; habits.blank.marks += it.max; habits.blank.count++;
        }
      }
    });
    out.topics = [...topics.values()].map((k) => ({
      topic: k.topic,
      pct: k.wM ? Math.round((k.wE / k.wM) * 100) : 0,
      earned: k.earned, max: k.max, seen: k.seen,
      avgTime: k.seen ? k.time / k.seen : 0,
      lastPct: k.last && k.last.m ? Math.round((k.last.e / k.last.m) * 100) : null,
      tip: TIPS[k.topic] || "",
    })).sort((a, b) => a.pct - b.pct || b.max - a.max);

    out.habits = Object.entries(habits).map(([key, v]) => ({ key, ...HABITS[key], ...v })).sort((a, b) => b.marks - a.marks);

    // Slowest topic per question (only topics seen at least twice)
    const timed = out.topics.filter((t) => t.seen >= 2);
    if (timed.length) out.slowTopic = timed.slice().sort((a, b) => b.avgTime - a.avgTime)[0];
    return out;
  }

  const level = (pct) => (pct >= 85 ? "strong" : pct >= 65 ? "mid" : "low");
  const levelLabel = (pct) => ({ strong: "Strong", mid: "Getting there", low: "Needs work" }[level(pct)]);

  const api = { analyze, level, levelLabel, TIPS };
  root.Insights = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
