/*
 * BANK — the curriculum-wide question registry, generator kit and selection engine.
 *
 *  Families (one per kind of task) register with metadata and a generator:
 *    Bank.family({ id, sub, subs?, unit, title, concepts, kinds, modes, templates: [names], answer, complexity, tags,
 *                  gen(r, mode, kind, K) → { template, sig, ...question } })
 *  Every instance is validated before it is used (Bank.make): the key must grade as right with the real checker,
 *  MC options must be distinct, nothing may read NaN/undefined/Infinity. A failed instance is re-seeded, never served.
 *  Instances are rebuilt from their ids ("cb-<v>-<family>-<kind>-<mode>-<seed>"), so saved work always reopens.
 *
 *  The 30 quadratics families of js/quad-bank.js are adapted into the same registry (ids stay "qd-…").
 *
 *  Selection (Bank.select) — transparent and fixed to the chosen difficulty:
 *    • only families that support the selected mode; the mode is NEVER raised or lowered to fill a session
 *    • single subtopic: rotate across that subtopic's families (least recently used first) — never switch topic
 *    • mixed scope: rotate across subtopics, least-exposed first; every 4th pick revisits a recently missed subtopic
 *    • reject exact repeats (same canonical signature) from the recent history and near-repeats (same family +
 *      template) within the batch while an alternative exists; if a family has nothing fresh left, the question is
 *      flagged `revisit` so the UI can say so honestly
 *  History lives in localStorage "campfire-prep.qhist.v1" (last 600 questions: signature, template shape, family, subtopic).
 */
(function (root) {
  "use strict";
  const VERSION = 1;
  const HKEY = "campfire-prep.qhist.v1";
  const MODES = ["simple", "normal", "challenge", "nightmare"];
  const LV_CODE = { simple: "s", normal: "n", challenge: "c", nightmare: "x" };
  const CODE_LV = { s: "simple", n: "normal", c: "challenge", x: "nightmare" };
  const FAMS = [];
  const byFam = new Map();

  // ───────── generator kit ─────────
  function rng(seed) { let s = Math.abs(Math.floor(seed)) % 2147483647; if (s <= 0) s += 2147483646; for (let i = 0; i < 3; i++) s = (s * 16807) % 2147483647; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
  const K = {
    int: (r, a, b) => a + Math.floor(r() * (b - a + 1)),
    nz: (r, a, b) => { let v = 0; while (v === 0) v = a + Math.floor(r() * (b - a + 1)); return v; },
    pick: (r, arr) => arr[Math.floor(r() * arr.length)],
    coin: (r, p = 0.5) => r() < p,
    shuffle: (r, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    sample: (r, arr, n) => K.shuffle(r, arr).slice(0, n),
    gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
    // exact fractions / TeX from QuadMath
    F: (n, d) => root.QuadMath.F(n, d),
    ftex: (x) => root.QuadMath.ftex(x),
    fstr: (x) => root.QuadMath.fstr(x),
    // signed term helpers for writing polynomials
    sgn: (v, first) => (v < 0 ? (first ? "-" : " - ") : first ? "" : " + "),
    coef: (v, body) => (body && Math.abs(v) === 1 ? "" : String(Math.abs(v))),
    // a polynomial in x from integer coefficients [c0, c1, c2, …] → TeX and typed text
    polyTeX(cs, v = "x") {
      let out = "";
      for (let k = cs.length - 1; k >= 0; k--) {
        const c = cs[k]; if (!c) continue;
        const body = k === 0 ? "" : k === 1 ? v : `${v}^{${k}}`;
        out += K.sgn(c, !out) + K.coef(c, body) + body;
      }
      return out || "0";
    },
    polyStr(cs, v = "x") {
      let out = "";
      for (let k = cs.length - 1; k >= 0; k--) {
        const c = cs[k]; if (!c) continue;
        const body = k === 0 ? "" : k === 1 ? v : `${v}^${k}`;
        out += (c < 0 ? "-" : out ? "+" : "") + (body && Math.abs(c) === 1 ? "" : Math.abs(c)) + body;
      }
      return out || "0";
    },
    // (x − r) as TeX/text
    linTeX: (a, b, v = "x") => `${a === 1 ? "" : a === -1 ? "-" : a}${v}${b === 0 ? "" : b > 0 ? ` + ${b}` : ` - ${-b}`}`,
    linStr: (a, b, v = "x") => `${a === 1 ? "" : a === -1 ? "-" : a}${v}${b === 0 ? "" : b > 0 ? `+${b}` : `-${-b}`}`,
    pmul: (p, q) => { const out = new Array(p.length + q.length - 1).fill(0); p.forEach((a, i) => q.forEach((b, j) => { out[i + j] += a * b; })); return out; },
    // multiple choice: the first option is the key; distractors must differ (by text and, if numeric, by value)
    mc(correct, distractors, extra = {}) {
      const seen = new Set([norm(correct)]);
      const ds = [];
      for (const d of distractors) { const n = norm(d); if (!seen.has(n)) { seen.add(n); ds.push(d); } if (ds.length === 3) break; }
      if (ds.length < 3) throw new Error("not enough distinct distractors");
      return { kind: "mc", c: [correct, ...ds], ...extra };
    },
    round: (x, dp) => Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp),
    money: (x) => x.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    deg: (x) => (x * Math.PI) / 180,
  };
  const norm = (s) => String(s).replace(/\\left|\\right|\\displaystyle|\\,|\s+/g, "").replace(/\\dfrac|\\tfrac/g, "\\frac");

  // ───────── registry ─────────
  function family(F) {
    const f = { templates: [], complexity: {}, tags: [], prereqs: [], subs: [F.sub], ...F };
    if (!f.subs.includes(f.sub)) f.subs.unshift(f.sub);
    if (byFam.has(f.id)) throw new Error("duplicate family " + f.id);
    FAMS.push(f); byFam.set(f.id, f);
    return f;
  }
  const BAD = /NaN|undefined|Infinity|\[object/;
  function check(q, kind) {
    const C = root.MathCheck;
    const text = JSON.stringify(q);
    if (BAD.test(text)) throw new Error("bad text");
    if (kind === "mc") {
      if (!q.c || q.c.length < 4) throw new Error("mc options");
      if (new Set(q.c.map(norm)).size !== q.c.length) throw new Error("duplicate options");
      if (q.vals) { const v = q.vals.map((x) => Math.round(x * 1e9)); if (new Set(v).size !== v.length) throw new Error("equal-valued options"); }
    } else if (kind === "nr") {
      const g = C.grade({ kind: "number", answer: q.answer, marks: 1 }, q.ansText || String(q.answer));
      if (g.verdict !== "right") throw new Error("nr key");
    } else if (kind === "wr") {
      for (const p of q.parts) {
        const resp = keyResponse(p);
        const g = C.grade(p, resp);
        if (g.verdict !== "right") throw new Error(`wr key ${p.kind} ${resp}: ${g.note}`);
      }
      if (root.PhysCheck && q.parts.some((p) => root.PhysCheck.handles(p.kind))) root.PhysCheck.validate(q);
    }
  }
  function keyResponse(p) {
    if (root.AnswerCheck && root.AnswerCheck.handles(p.kind)) return root.AnswerCheck.keyResponse(p);
    if (root.PhysCheck && root.PhysCheck.handles(p.kind)) return root.PhysCheck.keyResponse(p);
    if (root.QuadCheck && root.QuadCheck.handles(p.kind)) return root.QuadCheck.keyResponse(p);
    if (p.kind === "set") return p.answer.length ? p.answer.join(", ") : "none";
    if (p.kind === "restriction") return `x${p.answer.op}${p.answer.value}`;
    return String(p.answer);
  }
  function make(famId, kind, mode, seed) {
    const F = byFam.get(famId);
    if (!F) throw new Error("no family " + famId);
    if (F.adapter) return F.adapter.make(kind, mode, seed);
    if (!F.kinds.includes(kind)) throw new Error(`${famId} has no ${kind}`);
    if (!F.modes.includes(mode)) throw new Error(`${famId} not in ${mode}`);
    const r = rng(seed * 7919 + famId.length * 104729 + MODES.indexOf(mode) * 31 + kind.length * 17);
    let out = F.gen(r, mode, kind, K, { seed });
    if (F.subject === "physics" && root.PhysKit) out = root.PhysKit.localizeDecimals(out);
    if (out.kind !== kind) throw new Error("kind mismatch");
    const { kind: _k, template, sig, vals, ...q } = out;
    check(out, kind);
    const id = `cb-${VERSION}-${famId}-${kind}-${LV_CODE[mode]}-${seed.toString(36)}`;
    const meta = { subject: F.subject || "math", family: famId, mode, unit: F.unit, sub: F.sub, subs: F.subs, template: template || "main", sig: `${famId}|${kind}|${sig || norm(q.q || q.intro || "")}`, complexity: (F.complexity && F.complexity[mode]) || 2, answerFormat: F.answer, tags: F.tags, prereqs: F.prereqs };
    const res = { ...q, id, topic: F.topicName || F.title, concepts: F.concepts, meta, hints: q.hints || [] };
    if (kind === "mc" && res.c) res.c = res.c.map((s) => (/^\\\(/.test(s) && !/\\displaystyle/.test(s) ? s.replace(/^\\\(/, "\\(\\displaystyle ") : s));
    if (kind === "nr" && !res.fmt) res.fmt = "Number";
    if (kind === "nr" && !res.ansTex) res.ansTex = res.ansText || String(res.answer);
    return res;
  }
  function generate(famId, kind, mode, rnd = Math.random, avoid) {
    // avoid(q): falsy = fine, "soft" = acceptable if nothing better turns up (e.g. same template again), true = exact repeat
    let last, soft;
    for (let i = 0; i < 300; i++) {
      const seed = 1 + Math.floor(rnd() * 2147483646);
      try {
        const q = make(famId, kind, mode, seed);
        const v = avoid ? avoid(q) : false;
        if (!v) return q;
        if (v === "soft") { if (!soft) soft = q; } else last = q;
      } catch (e) { if (root.__bankDebug) root.__bankDebug(famId, e); }
    }
    if (soft) return soft;
    if (last) { last.meta.revisit = true; return last; }
    throw new Error(`could not build ${famId}/${kind}/${mode}`);
  }
  const cache = new Map();
  function byId(id) {
    if (cache.has(id)) return cache.get(id);
    const m = /^cb-(\d+)-([a-z0-9_]+)-(mc|nr|wr)-([sncx])-([0-9a-z]+)$/.exec(id || "");
    if (!m || Number(m[1]) !== VERSION) return null;
    try { const q = make(m[2], m[3], CODE_LV[m[4]], parseInt(m[5], 36)); cache.set(id, q); return q; } catch { return null; }
  }

  // ───────── quadratics families (js/quad-bank.js) as adapters ─────────
  // which curriculum subtopic each quadratics family serves
  const QUAD_SUB = {
    identify: "F.forms", coeffs: "F.forms", direction: "F.direction", width: "F.direction", vform: "F.vertex", axis: "F.vertex",
    vstd: "F.vertex", cts: "F.std_to_vertex", maxmin: "F.maxmin", features: "F.vertex", matchgraph: "F.compare", graphtoeq: "F.graph_to_eq",
    transform: "F.transform", predict: "F.transform", readgraph: "F.tables", sketch: "F.graphing", eqfromgraph: "F.graph_to_eq",
    table: "F.tables", yint: "F.intercepts", zfactored: "F.intercepts", solve: "F.solve_formula", zvertex: "F.intercepts",
    count: "F.discriminant", disc: "F.discriminant", projectile: "F.modelling", compare: "F.compare", fixerror: "F.errors",
    fromroots: "F.graph_to_eq", mirror: "F.tables", optimize: "F.modelling",
    nm1: "F.std_to_vertex", nm2: "F.solve_formula", nm3: "F.transform", nm4: "F.modelling", nm5: "F.errors",
  };
  function adoptQuad() {
    const QB = root.QuadBank; if (!QB) return;
    for (const Q of QB.FAMILIES) {
      if (byFam.has(Q.id)) continue;
      family({
        id: Q.id, unit: "F", sub: QUAD_SUB[Q.id] || "F.forms", title: Q.title, topicName: Q.topic, concepts: Q.concepts, kinds: Q.kinds, modes: Q.modes,
        templates: [Q.subtopic], answer: Q.answer, complexity: Q.complexity, tags: Q.tags, prereqs: Q.prereqs, source: "quad-bank",
        adapter: {
          make: (kind, mode, seed) => {
            const q = QB.make(Q.id, kind, mode, seed);
            const stem = norm((q.q || q.intro || "") + "|" + (q.parts ? q.parts.map((p) => p.prompt + JSON.stringify(p.answer)).join("|") : "") + "|" + (q.c ? q.c.join("|") : ""));
            q.meta = { ...q.meta, family: Q.id, unit: "F", sub: QUAD_SUB[Q.id] || "F.forms", subs: [QUAD_SUB[Q.id] || "F.forms"], template: shapeOf(q.q || q.intro || q.title || ""), sig: `${Q.id}|${kind}|${stem}` };
            return q;
          },
        },
      });
    }
  }
  // ───────── carefully authored questions (the hand-written radicals-era banks, incl. Tim's) as families ─────────
  // One family per concept; an instance is one authored question (its own id), so history avoids repeats exactly.
  let authoredDone = false;
  function adoptAuthored() {
    if (authoredDone || !root.Concepts || !root.Curriculum || !root.MC_BANK) return;
    authoredDone = true;
    const C = root.Concepts;
    const pools = { normal: { mc: [...(root.MC_BANK || []), ...((root.CLASSMATE && root.CLASSMATE.mc) || [])], nr: [...(root.NR_BANK || []), ...((root.CLASSMATE && root.CLASSMATE.nr) || [])] }, challenge: { mc: root.CH_MC_BANK || [], nr: root.CH_NR_BANK || [] } };
    for (const c of C.CONCEPTS.filter((x) => x.unit !== "quadratics")) {
      const subs = root.Curriculum.subsForConcept(c.id);
      if (!subs.length) continue;
      const by = { normal: {}, challenge: {} };
      for (const mode of ["normal", "challenge"]) for (const kind of ["mc", "nr"]) { const xs = pools[mode][kind].filter((q) => C.conceptsFor(q).includes(c.id)); if (xs.length) by[mode][kind] = xs; }
      const modes = ["normal", "challenge"].filter((m) => Object.keys(by[m]).length);
      if (!modes.length) continue;
      const kinds = [...new Set(modes.flatMap((m) => Object.keys(by[m])))];
      const id = "auth_" + c.id.replace(/\./g, "_");
      family({
        id, unit: subs[0].split(".")[0], sub: subs[0], subs, title: `${c.title} (authored set)`, concepts: [c.id], kinds, modes, answer: "authored", source: "authored",
        templates: modes.flatMap((m) => Object.values(by[m]).flat()).map((q) => q.id), complexity: { normal: 2, challenge: 3 }, tags: ["authored"],
        adapter: {
          make: (kind, mode, seed) => {
            const list = (by[mode] || {})[kind]; if (!list || !list.length) throw new Error("none");
            const q = list[seed % list.length];
            return { ...q, meta: { family: id, mode, unit: subs[0].split(".")[0], sub: subs[0], subs, template: q.id, sig: `auth|${q.id}`, complexity: mode === "challenge" ? 3 : 2, authored: true, credit: q.credit } };
          },
        },
      });
    }
  }
  // structure without the numbers: two questions with the same shape are the same template
  const shapeOf = (s) => norm(String(s)).replace(/-?\d+(\.\d+)?/g, "#").slice(0, 160);

  // ───────── history ─────────
  // one history per subject: Physics never shares question history with Math
  const HKEYS = { math: HKEY, physics: "campfire-prep.phys.qhist.v1" };
  const hkey = (subject) => HKEYS[subject || "math"] || HKEY;
  const store = {
    get(subject) { try { const h = JSON.parse(root.localStorage.getItem(hkey(subject))); return h && Array.isArray(h.recent) ? h : { v: 1, recent: [] }; } catch { return { v: 1, recent: [] }; } },
    set(h, subject) { try { root.localStorage.setItem(hkey(subject), JSON.stringify(h)); } catch { /* storage off: selection still works, just without memory */ } },
  };
  const subjectOf = (F) => F.subject || "math";
  function remember(qs, subject) {
    const h = store.get(subject);
    const now = Date.now();
    for (const q of qs) h.recent.push({ s: q.meta.sig, h: q.meta.family + "|" + q.meta.template, f: q.meta.family, u: q.meta.sub, m: q.meta.mode, t: now });
    h.recent = h.recent.slice(-600);
    store.set(h, subject);
  }
  function exposure(subject) {
    const h = store.get(subject), by = {};
    for (const e of h.recent) by[e.u] = (by[e.u] || 0) + 1;
    return by;
  }

  // ───────── selection ─────────
  // opts: { subject?: "math" | "physics", subs: [subtopic ids] | null (all), concept?, families?: [ids], mode, n, kinds?, rnd?, missed?: Set(sub), record?: true }
  function select(opts) {
    adoptQuad(); adoptAuthored();
    const mode = opts.mode, n = opts.n || 8, rnd = opts.rnd || Math.random, subject = opts.subject || "math";
    const kinds = opts.kinds || ["mc", "nr", "wr"];
    const inScope = (F) => !F.id.startsWith("nm") && subjectOf(F) === subject && F.modes.includes(mode) && F.kinds.some((k) => kinds.includes(k)) &&
      (!opts.families || opts.families.includes(F.id)) &&
      (opts.concept ? F.concepts.includes(opts.concept) : !opts.subs || F.subs.some((s) => opts.subs.includes(s)));
    const fams = FAMS.filter(inScope);
    if (!fams.length) return { items: [], unavailable: true, mode };
    const subsOf = (F) => (opts.subs ? F.subs.filter((s) => opts.subs.includes(s)) : [F.sub]);
    const bySub = new Map();
    for (const F of fams) for (const s of subsOf(F)) { if (!bySub.has(s)) bySub.set(s, []); bySub.get(s).push(F); }
    const h = opts.history || store.get(subject);
    const recentSigs = new Set(h.recent.map((e) => e.s));
    const famUse = {}; h.recent.slice(-120).forEach((e) => { famUse[e.f] = (famUse[e.f] || 0) + 1; });
    const exp = {}; h.recent.forEach((e) => { exp[e.u] = (exp[e.u] || 0) + 1; });
    const session = { sigs: new Set(), shapes: new Map(), subCount: {}, famCount: {} };
    const out = [];
    const subs = [...bySub.keys()];
    let revisits = 0;
    for (let k = 0; k < n * 3 && out.length < n; k++) {
      // which subtopic: least used in this batch, then least exposed historically; missed ones get every 4th slot
      let sub;
      const missed = opts.missed ? subs.filter((s) => opts.missed.has(s)) : [];
      if (missed.length && subs.length > 1 && out.length % 4 === 3) sub = missed[Math.floor(rnd() * missed.length)];
      else sub = subs.slice().sort((a, b) => (session.subCount[a] || 0) - (session.subCount[b] || 0) || (exp[a] || 0) - (exp[b] || 0) || rnd() - 0.5)[0];
      // which family: least used in the batch, then least used recently
      const cand = bySub.get(sub).slice().sort((a, b) => (session.famCount[a.id] || 0) - (session.famCount[b.id] || 0) || (famUse[a.id] || 0) - (famUse[b.id] || 0) || rnd() - 0.5);
      let got = null, fallback = null;
      for (const F of cand) {
        const fk = F.kinds.filter((x) => kinds.includes(x));
        const kind = fk[Math.floor(rnd() * fk.length)];
        const altLeft = cand.length > 1;
        try {
          got = generate(F.id, kind, mode, rnd, (q) => {
            if (session.sigs.has(q.meta.sig) || recentSigs.has(q.meta.sig)) return true;          // exact repeat
            const shapeKey = q.meta.family + "|" + q.meta.template;
            if (altLeft && (session.shapes.get(shapeKey) || 0) >= 1) return "soft";                   // same template twice in one batch
            return false;
          });
        } catch { got = null; }
        if (got && got.meta.revisit) { if (!fallback) fallback = got; got = null; continue; }   // try the other families first
        if (got) break;
      }
      if (!got) got = fallback;
      if (!got) continue;
      if (got.meta.revisit) revisits++;
      session.sigs.add(got.meta.sig);
      const sk = got.meta.family + "|" + got.meta.template;
      session.shapes.set(sk, (session.shapes.get(sk) || 0) + 1);
      session.subCount[sub] = (session.subCount[sub] || 0) + 1;
      session.famCount[got.meta.family] = (session.famCount[got.meta.family] || 0) + 1;
      const kind = got.parts ? "wr" : got.c ? "mc" : "nr";
      const part = kind === "wr" ? got.parts[Math.floor(rnd() * got.parts.length)].key : null;
      out.push({ kind, q: got, part });
    }
    if (opts.record !== false) remember(out.map((x) => x.q), subject);
    return { items: out, mode, revisits, unavailable: false };
  }

  // ───────── catalogue facts (for coverage and honest labels) ─────────
  function familiesFor(sub, mode) { adoptQuad(); adoptAuthored(); return FAMS.filter((F) => F.subs.includes(sub) && (!mode || F.modes.includes(mode)) && !F.id.startsWith("nm")); }
  function stats() {
    adoptQuad(); adoptAuthored();
    const own = FAMS.filter((F) => !F.adapter);
    const auth = FAMS.filter((F) => F.source === "authored");
    return {
      families: FAMS.length,
      generators: own.length,
      quadAdapted: FAMS.filter((F) => F.source === "quad-bank").length,
      authoredFamilies: auth.length,
      authoredQuestions: auth.reduce((a, F) => a + F.templates.length, 0),
      declaredTemplates: own.reduce((a, F) => a + F.templates.length, 0),
      familyFormatMode: FAMS.reduce((a, F) => a + F.kinds.length * F.modes.length, 0),
      bySubject: FAMS.reduce((a, F) => { a[subjectOf(F)] = (a[subjectOf(F)] || 0) + 1; return a; }, {}),
    };
  }

  const api = { VERSION, MODES, K, family, make, generate, byId, select, remember, exposure, history: (subject) => store.get(subject), clearHistory: (subject) => store.set({ v: 1, recent: [] }, subject), subjectOf, familiesFor, stats, adoptQuad, shapeOf, norm, keyResponse, get FAMILIES() { adoptQuad(); adoptAuthored(); return FAMS; }, byFam: (id) => { adoptQuad(); adoptAuthored(); return byFam.get(id); }, rng };
  root.Bank = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
