/*
 * PHYSICS TESTS — what Physics supplies to the shared test engine in js/app.js.
 *
 * Normal, Challenging and Nightmare Physics tests run in the same test screen as Math (timer, pause, navigator,
 * flags, hints by level, calculator, scratchpad, campfire / Goose rules, submit, results and review). This module
 * only provides the physics parts of that pipeline:
 *   build(level, opts)      generated questions for a test (Bank, subject "physics", fixed level, chosen topic)
 *   questionHTML / handle*  rendering and input for physics answer formats (value + unit, choices, ordering)
 *   answered(p, raw)        whether a part counts as answered
 *   reviewHTML              question-by-question review with keys, diagnosed notes and the worked solution
 *   save / record           attempts in their own history; every graded part into the Physics records
 *                           (so diagnostics, the review queue and recent sessions update, and Math never changes)
 *   resultsHTML             per-skill performance, error types and follow-up recommendations for one attempt
 * Simple stays the guided practice runner in js/physics/ui.js.
 */
(function () {
  "use strict";
  const KEYS = { history: "campfire-prep.phys.history.v1", practice: "campfire-prep.phys.practice.v1", prefs: "campfire-prep.phys.prefs.v1" };
  // Simple is an easier assessment (accessible values, shorter chains), not the guided runner
  const TEST_LEVELS = ["simple", "normal", "challenge", "nightmare"];
  // defaults per level: number of questions and minutes (both can be changed in Test options)
  const DEFAULTS = { simple: { n: 6, minutes: 30 }, normal: { n: 6, minutes: 40 }, challenge: { n: 6, minutes: 50 }, nightmare: { n: 4, minutes: 50 } };
  const COUNTS = { simple: [4, 6, 8, 10], normal: [4, 6, 8, 10], challenge: [4, 6, 8, 10], nightmare: [3, 4, 5] };
  // Nightmare draws on the families whose Nightmare instances are genuinely multi-step: chained parts, inverse
  // problems, unequal heights, impact direction, error analysis and mixed scenarios.
  const NIGHTMARE_FAMS = ["ph_multistep", "ph_mixed", "ph_inverse", "ph_angled_diff", "ph_impact", "ph_downward", "ph_error", "ph_velocity_at", "ph_horizontal"];
  const MIX = "mix";

  const tr = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const lang = () => (window.I18N ? window.I18N.lang : "en");
  const loc = (t) => (!t ? "" : typeof t === "string" ? t : t[lang()] || t.en);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const store = { get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off */ } } };
  const B = () => window.Bank, C = () => window.PhysCurriculum, M = () => window.PhysModel, CT = () => window.PhysContent;
  const comma = (s) => (["fr", "es", "de"].includes(lang()) && window.PhysKit ? window.PhysKit.commaText(s) : s);

  const isPhys = (q) => !!(q && q.meta && q.meta.subject === "physics");

  // ───────── topics and options ─────────
  // A topic is offered at a level only if a generator really produces questions for it there.
  function topics(level) {
    const cov = C().coverage().filter((c) => c.families.length);
    const nm = level === "nightmare";
    const has = (c) => c.modes.includes(level) && (!nm || c.families.some((f) => NIGHTMARE_FAMS.includes(f)));
    const list = cov.map((c) => ({ id: c.id, unit: c.unit, title: c.title, ok: has(c) }));
    const mixOk = list.filter((t) => t.ok && t.unit === "PC").length > 1;
    return [{ id: MIX, unit: "PC", title: null, ok: mixOk }, ...list];
  }
  const testPrefs = () => ({ ...store.get(KEYS.prefs, {}) });
  function options(level) {
    const p = testPrefs(), d = DEFAULTS[level] || DEFAULTS.normal;
    const t = (p.tests || {})[level] || {};
    const tops = topics(level);
    const topic = tops.some((x) => x.id === t.topic && x.ok) ? t.topic : MIX;
    const n = COUNTS[level].includes(t.n) ? t.n : d.n;
    const minutes = t.minutes >= 10 && t.minutes <= 120 ? t.minutes : d.minutes;
    return { topic, n, minutes };
  }
  function setOptions(level, o) {
    const p = testPrefs();
    p.tests = { ...(p.tests || {}), [level]: { ...options(level), ...o } };
    store.set(KEYS.prefs, p);
  }
  const subsFor = (topic) => (topic === MIX ? C().SUBS.filter((s) => s.unit === "PC").map((s) => s.id) : [topic]);

  // ───────── building a test ─────────
  // A mixed test follows a blueprint, like a real unit test: mostly calculation problems, ordered from more
  // direct to more involved, with one reasoning question (concepts / graphs / equations / error analysis). Each slot
  // lists the families that may fill it; slots repeat in order for longer tests. (Balancing over subtopics instead
  // gave conceptual multiple choice about a sixth of every test, which made tests easier than intended.)
  const BLUEPRINT = {
    simple: [["ph_horizontal", "ph_vertical"], ["ph_components", "ph_units"], ["ph_angled_same", "ph_velocity_at"], ["ph_concepts", "ph_graphs", "ph_equations"], ["ph_vertical", "ph_horizontal"], ["ph_angled_same", "ph_angled_diff"],
      ["ph_velocity_at", "ph_components"], ["ph_units", "ph_equations"], ["ph_horizontal", "ph_angled_same"], ["ph_vertical", "ph_graphs"]],
    normal: [["ph_horizontal", "ph_vertical"], ["ph_angled_same", "ph_velocity_at", "ph_components"], ["ph_concepts", "ph_graphs", "ph_equations"], ["ph_angled_diff", "ph_downward"], ["ph_impact", "ph_inverse", "ph_multistep"], ["ph_angled_same", "ph_angled_diff", "ph_horizontal"],
      ["ph_vertical", "ph_velocity_at", "ph_downward"], ["ph_units", "ph_error", "ph_insufficient"], ["ph_multistep", "ph_mixed"], ["ph_horizontal", "ph_angled_diff"]],
    challenge: [["ph_horizontal", "ph_angled_same"], ["ph_angled_diff", "ph_downward"], ["ph_error", "ph_insufficient", "ph_graphs"], ["ph_inverse"], ["ph_multistep", "ph_mixed"], ["ph_impact", "ph_velocity_at", "ph_vertical"],
      ["ph_angled_diff", "ph_downward", "ph_horizontal"], ["ph_concepts", "ph_equations"], ["ph_mixed", "ph_inverse"], ["ph_multistep", "ph_angled_diff"]],
    nightmare: [["ph_angled_diff", "ph_downward"], ["ph_inverse", "ph_horizontal"], ["ph_multistep", "ph_mixed"], ["ph_impact", "ph_error", "ph_velocity_at"], ["ph_mixed", "ph_multistep", "ph_inverse"]],
  };
  function buildMixed(level, n, rnd) {
    const r = rnd || Math.random, seen = new Set(), used = {}, out = [];
    const recent = new Set(((B().history && B().history("physics")) || { recent: [] }).recent.map((e) => e.s));
    const slots = BLUEPRINT[level];
    for (let i = 0; out.length < n && i < n * 3; i++) {
      const fams = slots[out.length % slots.length].filter((f) => { const F = B().byFam(f); return F && F.modes.includes(level); });
      const order = fams.slice().sort((a, b) => (used[a] || 0) - (used[b] || 0) || r() - 0.5);
      let q = null;
      for (const f of order) { try { q = B().generate(f, "wr", level, r, (x) => (seen.has(x.meta.sig) ? true : recent.has(x.meta.sig) ? "soft" : false)); } catch { q = null; } if (q && !seen.has(q.meta.sig)) break; q = null; }
      if (!q) continue;
      seen.add(q.meta.sig); used[q.meta.family] = (used[q.meta.family] || 0) + 1; out.push(q);
    }
    return out;
  }
  function build(level, opts = {}) {
    if (!TEST_LEVELS.includes(level)) throw new Error("not a test level: " + level);
    const o = { ...options(level), ...opts };
    const subs = subsFor(o.topic);
    if (o.topic === MIX) {
      const qs = buildMixed(level, o.n, opts.rnd);
      if (!opts.preview && B().remember) B().remember(qs, "physics");
      return { questions: qs, opts: { topic: o.topic, n: o.n, minutes: o.minutes, subs } };
    }
    const famsAt = (F) => F.subject === "physics" && F.modes.includes(level) && F.subs.some((s) => subs.includes(s));
    let families = B().FAMILIES.filter(famsAt).map((F) => F.id);
    if (level === "nightmare") { const nm = families.filter((f) => NIGHTMARE_FAMS.includes(f)); if (nm.length) families = nm; }
    const got = B().select({ subject: "physics", mode: level, n: o.n, subs, families, kinds: ["wr"], rnd: opts.rnd, record: !opts.preview });
    const qs = got.items.map((x) => x.q);
    // the Bank prefers fresh templates; when a narrow topic can't fill the count with distinct ones, top up
    for (let k = 0; qs.length < o.n && k < 40; k++) {
      const F = families[k % families.length];
      try { const q = B().generate(F, "wr", level, opts.rnd || Math.random, (x) => qs.some((y) => y.meta.sig === x.meta.sig)); if (!qs.some((y) => y.meta.sig === q.meta.sig)) qs.push(q); } catch { /* try the next family */ }
    }
    return { questions: qs, opts: { topic: o.topic, n: o.n, minutes: o.minutes, subs } };
  }

  // ───────── rendering a question in the test ─────────
  const keyResp = (p) => window.PhysCheck.keyResponse(p);
  function answered(p, raw) {
    const s = String(raw == null ? "" : raw);
    if (p.kind === "qty") return !!s.split("|")[0].trim();
    return !!s.trim();
  }
  function figure(q) { return q.fig && window.PhysFig ? `<figure class="ph-fig">${window.PhysFig.render(q.fig)}</figure>` : ""; }
  function stemHTML(q, rm) {
    return `<div class="q-text">${rm(loc(q.stem))}</div>${q.work ? `<ol class="ph-work">${q.work.map((w) => `<li>${rm(loc(w))}</li>`).join("")}</ol>` : ""}${figure(q)}`;
  }
  function partInput(q, p, raw, item) {
    const key = esc(p.key);
    if (p.kind === "qty") {
      const [val, unit] = String(raw || "").split("|");
      const units = p.units || [];
      return `<div class="ph-qty"><input type="text" class="answer-input ph-num" inputmode="decimal" autocomplete="off" spellcheck="false" data-pt-val="${key}" aria-label="${esc(tr("ph.value"))} (${key})" placeholder="${esc(tr("ph.numPh"))}" value="${esc(val || "")}" />
        ${units.length > 1 ? `<select class="text-input ph-unit" data-pt-unit="${key}" aria-label="${esc(tr("ph.unit"))} (${key})">${units.map((u) => `<option value="${esc(u)}" ${u === (unit || units[0]) ? "selected" : ""}>${esc(u)}</option>`).join("")}</select>` : `<span class="ph-unit-fixed">${esc(units[0] || "")}</span>`}</div>`;
    }
    if (p.kind === "pmc") {
      return `<div class="choices ph-choices" role="radiogroup" aria-label="${esc(loc(p.prompt).replace(/\\\(|\\\)/g, ""))}">${p.options.map((o, i) => { const on = String(raw) === String(i); return `<button type="button" role="radio" aria-checked="${on}" class="choice${on ? " selected" : ""}" data-pt-opt="${key}" data-i="${i}"><span class="choice-letter">${"ABCDEF"[i]}</span><span class="choice-body">${item.rm(loc(o))}${p.figs && p.figs[i] ? `<span class="ph-opt-fig">${window.PhysFig.render(p.figs[i])}</span>` : ""}</span></button>`; }).join("")}</div>`;
    }
    if (p.kind === "order") {
      const ord = orderOf(p, raw);
      return `<ol class="ph-order">${ord.map((si, pos) => `<li><span class="ph-ord-t">${item.rm(loc(p.steps[si]))}</span><span class="ph-ord-btns"><button type="button" class="icon-btn" data-pt-move="${key}" data-pos="${pos}" data-dir="-1" aria-label="${esc(tr("ph.moveUp"))}" ${pos === 0 ? "disabled" : ""}>↑</button><button type="button" class="icon-btn" data-pt-move="${key}" data-pos="${pos}" data-dir="1" aria-label="${esc(tr("ph.moveDown"))}" ${pos === ord.length - 1 ? "disabled" : ""}>↓</button></span></li>`).join("")}</ol>
        ${raw ? `<p class="faint small">${esc(tr("pt.orderSaved"))}</p>` : `<button type="button" class="btn btn-secondary btn-sm" data-pt-keep="${key}">${esc(tr("pt.orderKeep"))}</button>`}`;
    }
    return "";
  }
  const orderOf = (p, raw) => { const r = String(raw || "").split(",").map(Number); return r.length === p.steps.length && r.every((x) => Number.isInteger(x)) ? r : p.steps.map((_, i) => i); };
  // the whole question body for the shared test screen
  function questionHTML(q, item, rm) {
    const ctx = { rm };
    const parts = q.parts.map((p) => `<div class="wr-part ph-part" data-key="${esc(p.key)}"><div class="part-head"><span class="part-label">(${esc(p.key)})</span><span class="part-prompt">${rm(loc(p.prompt))}</span><span class="marks-badge">${p.marks || 1} mark${(p.marks || 1) > 1 ? "s" : ""}</span></div>${partInput(q, p, item.responses[p.key], ctx)}</div>`).join("");
    return `${stemHTML(q, rm)}<div class="wr-parts">${parts}</div>
      <details class="work-box"${item.work ? " open" : ""}><summary>${esc(tr("pt.work"))}</summary><textarea class="work-input" data-field="work" rows="4" placeholder="${esc(tr("pt.workPh"))}">${esc(item.work || "")}</textarea></details>
      <p class="input-help">${esc(tr("pt.help"))}</p>`;
  }
  // input in the test body → update item.responses; returns "save" (just save) or "render" (save and redraw)
  function handleInput(e, item) {
    const t = e.target;
    const key = t.dataset.ptVal || t.dataset.ptUnit;
    if (!key) return null;
    const box = t.closest(".ph-qty");
    const v = box.querySelector("[data-pt-val]").value.trim(), u = box.querySelector("[data-pt-unit]");
    const unit = u ? u.value : (box.querySelector(".ph-unit-fixed") || {}).textContent || "";
    item.responses[key] = v ? `${v}|${unit}` : "";
    return "save";
  }
  function handleClick(e, item, q) {
    const opt = e.target.closest("[data-pt-opt]");
    if (opt) { item.responses[opt.dataset.ptOpt] = opt.dataset.i; return "render"; }
    const keep = e.target.closest("[data-pt-keep]");
    if (keep) { const p = q.parts.find((x) => x.key === keep.dataset.ptKeep); item.responses[p.key] = orderOf(p, item.responses[p.key]).join(","); return "render"; }
    const mv = e.target.closest("[data-pt-move]");
    if (mv) {
      const p = q.parts.find((x) => x.key === mv.dataset.ptMove), ord = orderOf(p, item.responses[p.key]);
      const pos = Number(mv.dataset.pos), to = pos + Number(mv.dataset.dir);
      if (to < 0 || to >= ord.length) return null;
      [ord[pos], ord[to]] = [ord[to], ord[pos]];
      item.responses[p.key] = ord.join(",");
      item._focus = `[data-pt-move="${p.key}"][data-pos="${to}"]`;
      return "render";
    }
    return null;
  }

  // ───────── review ─────────
  function keyText(p) {
    const P = M();
    if (p.kind === "qty") { const u = p.units[0]; return comma(`${P.fmt(P.fromSI(Number(p.answer), u), 3)} ${u}`); }
    if (p.kind === "pmc") return loc(p.options[p.answer]);
    if (p.kind === "order") return p.answer.map((i, k) => `${k + 1}. ${loc(p.steps[i])}`).join("<br>");
    return "";
  }
  function answerText(p, raw) {
    if (!answered(p, raw)) return `<span class="muted">(${esc(tr("pt.blank"))})</span>`;
    if (p.kind === "qty") { const [v, u] = String(raw).split("|"); return esc(`${v} ${u || ""}`.trim()); }
    if (p.kind === "pmc") return loc(p.options[Number(raw)]);
    if (p.kind === "order") return orderOf(p, raw).map((i, k) => `${k + 1}. ${loc(p.steps[i])}`).join("<br>");
    return esc(raw);
  }
  const catKey = (c) => ({ signs: "sign", units: "unit", decomp: "conceptual" }[c] || c);
  function noteText(g) {
    if (!g || !g.noteKey) return (g && g.note) || "";
    const v = { ...(g.noteVars || {}) };
    if (v.wantKey) v.want = tr(v.wantKey);
    const s = tr(g.noteKey, v);
    return s === g.noteKey ? g.note : s;
  }
  function reviewHTML(q, it, grade, rm) {
    const parts = q.parts.map((p, k) => {
      const g = grade.parts[k] || {};
      const cls = g.verdict === "right" ? "is-correct" : g.verdict === "blank" ? "" : "is-chosen-wrong";
      const note = g.verdict !== "right" && g.verdict !== "blank" ? noteText(g) : "";
      return `<div class="part-review ${cls}">
        <div class="part-head"><span class="part-label">(${esc(p.key)})</span><span class="part-prompt">${rm(loc(p.prompt))}</span><span class="marks-badge ${g.verdict}">${g.earned}/${g.max}</span></div>
        <div class="part-answers"><span><span class="cmp-label">${esc(tr("pt.you"))}</span>${rm(answerText(p, it.responses[p.key]))}</span>${g.verdict === "right" ? "" : `<span><span class="cmp-label">${esc(tr("pt.key"))}</span>${rm(keyText(p))}</span>`}</div>
        ${note ? `<p class="part-note">${esc(note)}</p>` : ""}${g.cat && g.verdict !== "right" ? `<p class="faint small">${esc(tr("ph.errType"))}: ${esc(tr("phc." + catKey(g.cat)))}</p>` : ""}
      </div>`;
    }).join("");
    return `${stemHTML(q, rm)}${parts}
      ${it.work ? `<div class="your-work"><span class="cmp-label">${esc(tr("pt.yourSteps"))}</span><pre>${esc(it.work)}</pre></div>` : ""}
      <details class="explain"${grade.earned < grade.max ? " open" : ""}><summary>${esc(tr("ph.solution"))}</summary><div><ol class="ph-worked">${q.solution.map((s) => `<li>${rm(loc(s))}</li>`).join("")}</ol></div></details>`;
  }
  function topic(q) { const s = C().get(q.meta.sub); return s ? loc(s.title) : q.topic; }
  const hints = (q) => (q.hints || []).map(loc).filter(Boolean);
  function lessonFor(q) { return CT().LESSONS.find((l) => l.families.includes(q.meta.family)) || null; }
  function learnRow(q) {
    const l = lessonFor(q);
    return `<div class="review-learn">${l ? `<button class="btn btn-secondary btn-sm" type="button" data-phys-lesson="${l.id}">${esc(tr("ph.lesson"))}: ${esc(loc(l.title))}</button>` : ""}<button class="btn btn-secondary btn-sm" type="button" data-phys-fams="${esc(q.meta.family)}">${esc(tr("pt.practiseSimilar"))}</button></div>`;
  }
  // Studio layout side panel during a test: the general kinematics formula sheet (the same for every question, so it
  // never hints at which equation a particular question needs)
  function formulaSheet(rm) {
    return `<p class="ti-k">${esc(tr("pt.sheet"))}</p>${CT().FORMULAS.map((f) => `<div class="ti-f"><div class="ti-tex">${rm(`\\[${f.tex}\\]`)}</div></div>`).join("")}<p class="ti-w">${esc(tr("pt.sheet.d"))}</p>`;
  }
  // Studio layout side panel: the formulas that this question's family uses
  function testInfo(q, rm) {
    const fs = CT().FORMULAS.filter((f) => f.related && f.related.families.includes(q.meta.family)).slice(0, 4);
    return fs.length ? `<p class="ti-k">${esc(tr("ph.formulas"))}</p>${fs.map((f) => `<div class="ti-f"><div class="ti-tex">${rm(`\\[${f.tex}\\]`)}</div><span class="ti-w">${rm(loc(f.when))}</span></div>`).join("")}` : "";
  }

  // ───────── results: separate history + Physics records ─────────
  const history = () => store.get(KEYS.history, []);
  function save(attempt) {
    const h = history().filter((a) => a.id !== attempt.id);
    h.push(attempt);
    store.set(KEYS.history, h.slice(-200));
  }
  // every graded part becomes a Physics record (diagnostics, review queue, recent sessions); Math is never touched
  function record(attempt, gradeItem, qOf) {
    const log = store.get(KEYS.practice, []).filter((r) => r.run !== attempt.id);
    for (const it of attempt.items) {
      const q = qOf(it); if (!isPhys(q)) continue;
      const g = gradeItem(it);
      q.parts.forEach((p, k) => {
        const pg = g.parts[k];
        if (!pg) return;
        log.push({ date: attempt.date, run: attempt.id, test: true, title: attempt.level, qid: q.id, part: p.key, family: q.meta.family, sub: q.meta.sub, subs: q.meta.subs, mode: attempt.level, skills: p.skills, earned: pg.earned, max: pg.max, correct: pg.earned >= pg.max, blank: pg.verdict === "blank" || undefined, cat: pg.earned >= pg.max ? "" : pg.cat || "", response: String(it.responses[p.key] || "").slice(0, 80), hints: it.hints || 0 });
      });
    }
    store.set(KEYS.practice, log.slice(-4000));
  }
  function resultsHTML(attempt) {
    const UI = window.PhysUI; if (!UI) return "";
    const rs = store.get(KEYS.practice, []).filter((r) => r.run === attempt.id);
    if (!rs.length) return "";
    const D = UI.diagnose(rs);
    const skills = D.skills.filter((s) => s.n).sort((a, b) => a.acc - b.acc);
    const pc = (x) => (x >= 75 ? "good" : x >= 50 ? "mid" : "low");
    const weak = skills.filter((s) => s.acc < 1).slice(0, 3);
    const cats = Object.entries(D.cats).sort((a, b) => b[1] - a[1]);
    return `<h3 class="sub-h">${esc(tr("ph.bySkill"))}</h3>
      ${skills.map((s) => { const pct = Math.round(s.acc * 100); return `<div class="topic-row"><div class="topic-row-head"><span>${esc(tr("phs." + s.id))}</span><span><b>${s.e}/${s.m}</b></span></div><div class="bar"><div class="bar-fill ${pc(pct)}" style="width:${pct}%"></div></div></div>`; }).join("")}
      ${cats.length ? `<p class="faint small">${esc(tr("ph.errTypes"))}: ${cats.map(([k, n]) => `${esc(tr("phc." + k))} × ${n}`).join(", ")}${D.unclassified ? ` · ${esc(tr("ph.unclassified", { n: D.unclassified }))}` : ""}</p>` : ""}
      <h3 class="sub-h">${esc(tr("ph.next"))}</h3>
      ${weak.length ? `<ul class="ph-recs">${weak.map((s) => { const m = UI.SKILL_MAP[s.id]; return `<li><b>${esc(tr("phs." + s.id))}</b><span class="ph-rec-act"><button type="button" class="btn btn-link btn-sm" data-phys-lesson="${m.lesson}">${esc(tr("ph.lesson"))}</button><button type="button" class="btn btn-sm btn-secondary" data-phys-fams="${m.fams.join(",")}">${esc(tr("ph.practise"))}</button></span></li>`; }).join("")}</ul>` : `<p>${esc(tr("ph.allRight"))}</p>`}
      <p class="faint small">${esc(tr("pt.evidenceNote"))}</p>`;
  }

  window.PhysTest = { formulaSheet, KEYS, TEST_LEVELS, DEFAULTS, COUNTS, NIGHTMARE_FAMS, MIX, isPhys, topics, options, setOptions, subsFor, build, answered, questionHTML, handleInput, handleClick, reviewHTML, keyText, answerText, noteText, topic, hints, learnRow, testInfo, history, save, record, resultsHTML, loc };
})();
