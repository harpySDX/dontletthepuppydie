/*
 * PHYSICS UI — the Physics 11 workspace inside the existing app shell (one screen, #screen-phys, with views):
 *   home      dashboard for every layout (Studio+ = a physics workbench with the Projectile Explorer embedded)
 *   learn     lessons (computed worked examples, quick checks) and the formula reference
 *   practice  launcher at the app's saved difficulty, course map with coverage statuses, diagnostics, review queue
 *   lab       Projectile Explorer, Motion Graph Lab, Vector visualizer (js/physics/tools.js)
 *   run       the physics question runner (multi-part, unit-aware, hints, worked solutions, results by skill)
 * Physics data is stored apart from Math: records "campfire-prep.phys.practice.v1", question history
 * "campfire-prep.phys.qhist.v1" (Bank), view state "campfire-prep.phys.prefs.v1". Nothing here reads or writes Math data.
 */
(function () {
  "use strict";
  const KEYS = { practice: "campfire-prep.phys.practice.v1", prefs: "campfire-prep.phys.prefs.v1" };
  const LEVELS = ["simple", "normal", "challenge", "nightmare"];
  let A = null, view = "home", sub = {}, run = null, mounted = null;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const tr = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const lang = () => (window.I18N ? window.I18N.lang : "en");
  const loc = (t) => (!t ? "" : typeof t === "string" ? t : t[lang()] || t.en);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const rm = (s) => (A ? A.renderMath(s) : esc(s));
  const M = () => window.PhysModel, C = () => window.PhysCurriculum, CT = () => window.PhysContent, B = () => window.Bank;
  const store = { get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off */ } } };
  const prefs = () => ({ courseOpen: "PC", learnTab: "lessons", lesson: "phys.angled", practiceTab: "practise", tool: "explorer", sub: "PC.angled_same", ...store.get(KEYS.prefs, {}) });
  const setPrefs = (p) => store.set(KEYS.prefs, { ...prefs(), ...p });
  const records = () => store.get(KEYS.practice, []);
  const level = () => (A ? A.selectedMode() : "normal");
  const rel = (ts) => (A && A.rel ? A.rel(ts) : new Date(ts).toLocaleDateString());
  const pctCls = (x) => (x >= 75 ? "good" : x >= 50 ? "mid" : "low");

  // ───────── skills (diagnostics) → where to learn and practise each one ─────────
  const SKILL_MAP = {
    decomp: { lesson: "phys.vectors", fams: ["ph_components"], tool: "vector" },
    signs: { lesson: "phys.model", fams: ["ph_velocity_at", "ph_downward"], tool: "vector" },
    horizontal: { lesson: "phys.horizontal", fams: ["ph_horizontal"], tool: "explorer" },
    vertical: { lesson: "phys.vertical", fams: ["ph_vertical"], tool: "graphs" },
    equations: { lesson: "phys.model", fams: ["ph_equations", "ph_error"], tool: null },
    time: { lesson: "phys.angled", fams: ["ph_angled_same", "ph_horizontal"], tool: "explorer" },
    maxh: { lesson: "phys.vertical", fams: ["ph_vertical", "ph_angled_same"], tool: "graphs" },
    range: { lesson: "phys.angled", fams: ["ph_angled_same", "ph_inverse"], tool: "explorer" },
    unequal: { lesson: "phys.heights", fams: ["ph_angled_diff", "ph_multistep"], tool: "explorer" },
    graphs: { lesson: "phys.graphs", fams: ["ph_graphs"], tool: "graphs" },
    units: { lesson: "phys.units", fams: ["ph_units"], tool: null },
    concepts: { lesson: "phys.model", fams: ["ph_concepts", "ph_insufficient"], tool: "explorer" },
  };
  const CATS = ["conceptual", "equation", "algebra", "sign", "signs", "unit", "units", "numerical", "decomp"];
  const catKey = (c) => ({ signs: "sign", units: "unit", decomp: "conceptual" }[c] || c);

  function diagnose(rs = records()) {
    const skills = {}, cats = {}, subs = {};
    let unclassified = 0;
    for (const r of rs) {
      for (const s of r.skills || []) { const k = skills[s] || (skills[s] = { n: 0, e: 0, m: 0 }); k.n++; k.e += r.earned; k.m += r.max; }
      for (const su of r.subs || [r.sub]) { if (!su) continue; const k = subs[su] || (subs[su] = { n: 0, e: 0, m: 0, last: 0 }); k.n++; k.e += r.earned; k.m += r.max; k.last = Math.max(k.last, r.date); }
      if (!r.correct) { if (r.cat) cats[catKey(r.cat)] = (cats[catKey(r.cat)] || 0) + 1; else unclassified++; }
    }
    const status = (k) => (!k ? "none" : k.n < 3 ? "few" : k.e / k.m >= 0.85 ? "strong" : k.e / k.m >= 0.6 ? "developing" : "needs");
    const list = Object.keys(SKILL_MAP).map((id) => ({ id, ...(skills[id] || { n: 0, e: 0, m: 0 }), acc: skills[id] && skills[id].m ? skills[id].e / skills[id].m : null, status: status(skills[id]) }));
    const weak = list.filter((s) => s.n >= 3 && s.acc < 0.8).sort((a, b) => a.acc - b.acc);
    return { skills: list, cats, unclassified, subs, weak, total: rs.length };
  }
  function reviewQueue(rs = records()) {
    const by = {};
    for (const r of rs.slice().sort((a, b) => a.date - b.date)) {
      const f = by[r.family] || (by[r.family] = { family: r.family, sub: r.sub, misses: 0, lastMiss: 0, missRun: null, rightRuns: new Set(), rightAfter: 0, last: 0 });
      f.last = r.date;
      // a miss is cleared by getting the family right in two LATER sessions (other parts of the same question don't count)
      if (!r.correct) { f.misses++; f.lastMiss = r.date; f.missRun = r.run; f.rightRuns = new Set(); f.rightAfter = 0; }
      else if (f.lastMiss && r.run !== f.missRun && !f.rightRuns.has(r.run)) { f.rightRuns.add(r.run); f.rightAfter++; }
    }
    const now = Date.now();
    return Object.values(by).filter((f) => f.lastMiss && f.rightAfter < 2 && now - f.lastMiss < 30 * 86400000)
      .map((f) => ({ ...f, due: now - f.last >= 20 * 3600000 })).sort((a, b) => Number(b.due) - Number(a.due) || a.lastMiss - b.lastMiss);
  }
  function famTitle(id) {
    const F = B().byFam(id); if (!F) return id;
    const s = C().get(F.sub); return s ? loc(s.title) : F.title;
  }
  function runsOf(rs = records()) {
    const runs = new Map();
    for (const r of rs) { const x = runs.get(r.run) || { run: r.run, date: 0, n: 0, e: 0, m: 0, subs: new Set(), mode: r.mode, diag: r.diag, title: r.title, test: !!r.test }; x.date = Math.max(x.date, r.date); x.n++; x.e += r.earned; x.m += r.max; if (r.sub) x.subs.add(r.sub); runs.set(r.run, x); }
    return [...runs.values()].sort((a, b) => b.date - a.date);
  }

  // ───────── shell ─────────
  function root() { return $("#phys-root"); }
  const VIEW_NAV = { home: "home", learn: "library", practice: "practice", lab: "studyroom", run: "practice" };
  function open(v, arg) {
    if (v === "home") { if (run && run.active) stopRun(); return A.goHome(); } // Physics uses the shared home screen
    if (run && v !== "run" && run.active) { stopRun(); }
    view = v;
    A.show("phys");
    A.markNav(VIEW_NAV[v], tr("ph.ctx." + v));
    if (arg) Object.assign(sub, arg);
    render();
  }
  function unmountTool() { if (mounted) { try { mounted.unmount(); } catch { /* already gone */ } mounted = null; } }
  function render() {
    const el = root(); if (!el) return;
    unmountTool();
    el.dataset.view = view;
    if (view === "run" && run) return renderRun();
    if (view === "learn") el.innerHTML = renderLearn();
    else if (view === "practice") el.innerHTML = renderPractice();
    else if (view === "lab") el.innerHTML = renderLab();
    afterRender();
  }
  function afterRender() {
    const el = root();
    const host = el.querySelector("[data-tool-host]");
    if (host && window.PhysTools) mounted = window.PhysTools.mount(host.dataset.toolHost, host, { compact: host.dataset.compact === "1", t: tr, renderMath: rm });
  }
  const levelSeg = (cur) => `<div class="segmented ph-levels" role="radiogroup" aria-label="${esc(tr("ph.level"))}">${LEVELS.map((m) => `<button type="button" role="radio" data-ph-level="${m}" aria-checked="${m === cur}" class="${m === cur ? "active" : ""}">${esc(tr("mode." + m))}</button>`).join("")}</div>`;
  const subtopicOptions = (cur) => {
    const cov = C().coverage().filter((c) => c.families.length);
    return C().UNITS.map((u) => { const rows = cov.filter((c) => c.unit === u.id); return rows.length ? `<optgroup label="${esc(loc(u.title))}">${rows.map((c) => `<option value="${c.id}" ${c.id === cur ? "selected" : ""} ${c.modes.includes(level()) ? "" : "disabled"}>${esc(loc(c.title))}${c.modes.includes(level()) ? "" : " — " + esc(tr("ph.notAtLevel"))}</option>`).join("")}</optgroup>` : ""; }).join("");
  };
  // The launcher follows the selected difficulty exactly like the Math home: Simple = guided practice;
  // Normal / Challenging / Nightmare = a real Physics test in the shared test engine (js/app.js + js/physics/test.js).
  const T = () => window.PhysTest;
  const TEST = (lv) => lv !== "simple" && !!T();
  function resumeCard() {
    if (!A.savedSession) return "";
    A.finishExpired && A.finishExpired();
    const s = A.savedSession();
    if (!(s && s.items && s.subject === "physics")) return "";
    const answered = s.items.filter((it) => { const q = window.Bank.byId(it.qid); return q && q.parts.every((p) => T().answered(p, it.responses[p.key])); }).length;
    return `<div class="resume-card glass ph-resume${s.paused ? " paused" : ""}"><div><span class="resume-kicker">${s.paused ? "⏸ " : ""}${esc(tr("home.resumeTitle"))} · ${esc(tr("subject.physics"))} · ${esc(tr("mode." + s.level))}</span>
      <span class="resume-meta">${esc(tr("home.left", { time: A.clock(A.timeLeftOf(s)), answered, total: s.items.length }))}</span></div>
      <div class="resume-actions"><button class="btn btn-primary btn-sm" type="button" data-pt-resume>${esc(tr("home.resume"))}</button><button class="btn btn-link btn-sm" type="button" data-pt-discard>${esc(tr("home.discard"))}</button></div></div>`;
  }
  function testTopicSelect(lv, cur) {
    const tops = T().topics(lv);
    return `<select class="text-input" id="ph-test-topic"><option value="${T().MIX}" ${cur === T().MIX ? "selected" : ""} ${tops[0].ok ? "" : "disabled"}>${esc(tr("pt.mixAll"))}</option>${C().UNITS.map((u) => { const rows = tops.filter((t) => t.id !== T().MIX && t.unit === u.id && t.ok); return rows.length ? `<optgroup label="${esc(loc(u.title))}">${rows.map((t) => `<option value="${t.id}" ${t.id === cur ? "selected" : ""}>${esc(loc(t.title))}</option>`).join("")}</optgroup>` : ""; }).join("")}</select>`;
  }
  function launcher(compact) {
    const p = prefs(), lv = level();
    const icon = (A.MODE_ICON && A.MODE_ICON()[lv]) || "";
    const head = `<span class="field-label">${esc(tr("ph.levelFixed"))}</span>${levelSeg(lv)}
      <div class="ph-mode p-${lv}"><span class="mode-ico" aria-hidden="true">${icon}</span><div><h3>${esc(tr("pt.title." + lv))}</h3>${compact === "bench" ? "" : `<p>${esc(tr("pt.mode." + lv))}</p>`}</div></div>`;
    const bench = compact === "bench";
    if (!TEST(lv)) {
      const cov = C().coverage(), cur = cov.find((c) => c.id === p.sub);
      const ok = cur && cur.modes.includes(lv);
      return `<div class="ph-launch-body" data-launch="guided">${resumeCard()}${head}
        <ul class="mp-chips">${[1, 2, 3].map((k) => `<li>${esc(tr("pt.f.simple" + k))}</li>`).join("")}</ul>
        <label class="ph-field"><span>${esc(tr("ph.topic"))}</span><select class="text-input" id="ph-sub">${subtopicOptions(p.sub)}</select></label>
        <div class="ph-actions">
          <button type="button" class="btn btn-primary" data-ph-start="sub" ${ok ? "" : "disabled"}>${esc(tr("mode.start.simple"))}</button>
          <button type="button" class="btn btn-secondary" data-ph-start="mixed">${esc(tr("ph.mixed"))}</button>
          ${compact ? "" : `<button type="button" class="btn btn-quiet" data-ph-start="diag">${esc(tr("ph.runDiag"))}</button>`}
        </div>
        ${ok ? "" : `<p class="faint small">${esc(tr("ph.notAtLevelNote", { mode: tr("mode." + lv) }))}</p>`}
      </div>`;
    }
    const o = T().options(lv), hint = { normal: "pt.hints.normal", challenge: "pt.hints.challenge", nightmare: "pt.hints.nightmare" }[lv];
    return `<div class="ph-launch-body" data-launch="test">${resumeCard()}${head}
      <ul class="mp-chips"><li>${esc(tr("pt.f.len", { n: o.n, min: o.minutes }))}</li><li>${esc(tr(hint))}</li>${bench ? "" : `<li>${esc(tr("pt.f.results"))}</li>`}</ul>
      ${bench ? `<div class="ph-actions"><button type="button" class="btn btn-primary" data-pt-start="${lv}">${esc(tr("pt.start." + lv))}</button><button type="button" class="btn btn-secondary" data-pt-options="${lv}">${esc(tr("mode.options"))}</button></div>` : ""}
      <label class="ph-field"><span>${esc(tr("ph.topic"))}</span>${testTopicSelect(lv, o.topic)}</label>
      <div class="ph-field"><span id="pt-n-l">${esc(tr("pt.count"))}</span><div class="segmented small-seg" role="radiogroup" aria-labelledby="pt-n-l">${T().COUNTS[lv].map((n) => `<button type="button" role="radio" data-pt-n="${n}" aria-checked="${n === o.n}" class="${n === o.n ? "active" : ""}">${n}</button>`).join("")}</div></div>
      ${bench ? "" : `<div class="ph-actions">
        <button type="button" class="btn btn-primary" data-pt-start="${lv}">${esc(tr("pt.start." + lv))}</button>
        <button type="button" class="btn btn-secondary" data-pt-options="${lv}">${esc(tr("mode.options"))}</button>
      </div>`}
    </div>`;
  }
  function lessonPath() {
    const D = diagnose(), rs = records();
    return `<ol class="ph-path">${CT().LESSONS.map((l, i) => {
      const fams = new Set(l.families), mine = rs.filter((r) => fams.has(r.family)), acc = mine.length ? Math.round((mine.reduce((a, r) => a + r.earned, 0) / mine.reduce((a, r) => a + r.max, 0)) * 100) : null;
      const here = l.id === "phys.angled";
      return `<li class="ph-step${here ? " here" : ""}"><button type="button" class="ph-step-btn" data-ph-lesson="${l.id}"><span class="ph-step-n">${i + 1}</span><span class="ph-step-t"><b>${esc(loc(l.title))}</b><small>${mine.length ? esc(tr("ph.answered", { n: mine.length })) + ` · <span class="sp-pct ${pctCls(acc)}">${acc}%</span>` : esc(tr("ph.notStarted"))}${here ? ` · <span class="ph-here">${esc(tr("ph.classHere"))}</span>` : ""}</small></span></button></li>`;
    }).join("")}</ol>`;
  }
  function diagPanel(compact) {
    const D = diagnose();
    if (!D.total) return `<p class="empty-note">${esc(tr("ph.diag.empty"))}</p>`;
    const rows = D.skills.filter((s) => s.n).sort((a, b) => (a.acc ?? 1) - (b.acc ?? 1)).slice(0, compact ? 6 : 12);
    const cats = Object.entries(D.cats).sort((a, b) => b[1] - a[1]);
    return `<ul class="ph-skills">${rows.map((s) => `<li><span class="ph-sk-t">${esc(tr("phs." + s.id))}</span><span class="bar"><span class="bar-fill ${s.acc === null ? "" : pctCls(s.acc * 100)}" style="width:${Math.round((s.acc || 0) * 100)}%"></span></span><span class="sp-pct ${s.acc === null ? "" : pctCls(s.acc * 100)}">${s.acc === null ? "—" : Math.round(s.acc * 100) + "%"}</span><small class="faint">${s.status === "few" ? esc(tr("ph.few", { n: s.n })) : esc(tr("ph.st." + s.status))}</small></li>`).join("")}</ul>
      ${compact ? "" : `<h3 class="sp-sec-h">${esc(tr("ph.errTypes"))}</h3>${cats.length ? `<ul class="sp-list">${cats.map(([k, n]) => `<li><span>${esc(tr("phc." + k))}</span><b class="sp-num">${n}</b></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("ph.errNone"))}</p>`}${D.unclassified ? `<p class="faint small">${esc(tr("ph.unclassified", { n: D.unclassified }))}</p>` : ""}`}
      ${D.weak.length ? `<h3 class="sp-sec-h">${esc(tr("ph.next"))}</h3><ul class="ph-recs">${D.weak.slice(0, 3).map((s) => { const m = SKILL_MAP[s.id]; return `<li><b>${esc(tr("phs." + s.id))}</b> <span class="faint">${Math.round(s.acc * 100)}%</span><span class="ph-rec-act"><button type="button" class="btn btn-link btn-sm" data-ph-lesson="${m.lesson}">${esc(tr("ph.lesson"))}</button><button type="button" class="btn btn-sm btn-secondary" data-ph-fams="${m.fams.join(",")}">${esc(tr("ph.practise"))}</button>${m.tool ? `<button type="button" class="btn btn-link btn-sm" data-ph-tool="${m.tool}">${esc(tr("ph.tool." + m.tool))}</button>` : ""}</span></li>`; }).join("")}</ul>` : ""}`;
  }
  function reviewPanel() {
    const Q = reviewQueue();
    if (!Q.length) return `<p class="empty-note">${esc(tr("ph.review.empty"))}</p>`;
    return `<ul class="sp-queue">${Q.slice(0, 6).map((f) => `<li><span class="sp-q-k"><b>${esc(famTitle(f.family))}</b><small>${esc(tr("ph.review.why", { n: f.misses, when: rel(f.lastMiss) }))}${f.due ? " · " + esc(tr("ph.review.due")) : ""}</small></span><button type="button" class="btn btn-sm btn-secondary" data-ph-fams="${f.family}">${esc(tr("ph.practise"))}</button></li>`).join("")}</ul>
      <div class="ph-actions"><button type="button" class="btn btn-primary btn-sm" data-ph-fams="${Q.map((f) => f.family).join(",")}">${esc(tr("ph.review.all"))}</button></div><p class="faint small">${esc(tr("ph.review.note"))}</p>`;
  }

  const panel = (cls, key, body, link) => `<section class="glass panel ${cls}" aria-labelledby="${cls}-h"><div class="panel-head sm"><h2 id="${cls}-h">${esc(tr(key))}</h2>${link || ""}</div><div class="ph-panel-body">${body}</div></section>`;

  // (the Physics home is the shared home screen: js/physics/home.js supplies its content)

  // ───────── learn: lessons + formula reference ─────────
  function renderLearn() {
    const p = prefs(), tab = sub.ltab || p.learnTab;
    const tabs = `<div class="tabbar" role="tablist">${["lessons", "formulas"].map((k) => `<button type="button" role="tab" data-ph-ltab="${k}" aria-selected="${k === tab}" class="${k === tab ? "active" : ""}">${esc(tr("ph.learn." + k))}</button>`).join("")}</div>`;
    const head = `<div class="page-head"><div><p class="eyebrow">${esc(tr("ph.kicker"))}</p><h1>${esc(tr("ph.learn.title"))}</h1></div></div><div class="prac-tabs">${tabs}</div>`;
    if (tab === "formulas") return head + renderFormulas(sub.formula);
    const lid = sub.lesson || p.lesson, les = CT().get(lid) || CT().LESSONS[0];
    const nav = `<nav class="ph-lnav glass" aria-label="${esc(tr("ph.learn.lessons"))}"><ol>${CT().LESSONS.map((l, i) => `<li><button type="button" class="${l.id === les.id ? "active" : ""}" data-ph-lesson="${l.id}" ${l.id === les.id ? 'aria-current="page"' : ""}><span class="ph-step-n">${i + 1}</span>${esc(loc(l.title))}</button></li>`).join("")}</ol></nav>`;
    return head + `<div class="ph-learn">${nav}<article class="ph-lesson glass panel">${renderLesson(les)}</article></div>`;
  }
  function renderLesson(l) {
    const ex = CT().workedExample(l);
    const fig = l.example ? window.PhysFig.render(l.tool === "vector" ? { type: "vector", mag: l.example.v0, angle: l.example.angle, unit: "m/s", show: ["mag", "angle"] } : { type: "scene", v0: l.example.v0, angle: l.example.angle, h0: l.example.h0 || 0, yLand: 0, show: ["v0", "angle", "h0"] }) : "";
    const sec = (key, body) => `<section class="lesson-sec ph-sec"><h2>${esc(tr(key))}</h2>${body}</section>`;
    const pre = l.prereqs.map((id) => CT().get(id)).filter(Boolean);
    const cur = C().get(l.sub);
    const fams = l.families.filter((id) => B().byFam(id));
    const lv = level();
    return `<p class="eyebrow">${esc(cur ? loc(cur.title) : "")}</p><h1>${esc(loc(l.title))}</h1><p class="lead">${rm(loc(l.summary))}</p>
      ${pre.length ? `<p class="faint small">${esc(tr("ph.before"))} ${pre.map((p) => `<button type="button" class="btn btn-link btn-sm" data-ph-lesson="${p.id}">${esc(loc(p.title))}</button>`).join(" · ")}</p>` : ""}
      ${sec("ph.sec.intro", `<p>${rm(loc(l.intro))}</p>${fig ? `<figure class="ph-fig">${fig}</figure>` : ""}`)}
      ${sec("ph.sec.ideas", `<ul class="ph-ideas">${l.ideas.map((i) => `<li>${rm(loc(i))}</li>`).join("")}</ul>`)}
      ${sec("ph.sec.eqs", `<div class="ph-eqs">${l.eqs.map((e) => `<div class="math-display">${rm(`\\[${e}\\]`)}</div>`).join("")}</div><button type="button" class="btn btn-link btn-sm" data-ph-go="learn" data-ph-ltab="formulas">${esc(tr("ph.formulas"))} →</button>`)}
      ${ex ? sec("ph.sec.example", `<ol class="ph-worked">${ex.map((s) => `<li>${rm(loc(s))}</li>`).join("")}</ol>`) : ""}
      ${sec("ph.sec.mistakes", `<ul class="ph-mistakes">${l.mistakes.map((m) => `<li>${rm(loc(m))}</li>`).join("")}</ul>`)}
      ${l.check ? sec("ph.sec.check", `<p>${rm(loc(l.check.q))}</p><div class="ph-check" data-ok="0">${shuffleFixed([{ t: l.check.ok, ok: 1 }, ...l.check.no.map((t) => ({ t, ok: 0 }))], l.id).map((o) => `<button type="button" class="choice" data-ph-check="${o.ok}"><span class="choice-body">${rm(loc(o.t))}</span></button>`).join("")}</div><p class="ph-check-fb" role="status" aria-live="polite"></p>`) : ""}
      ${sec("ph.sec.practice", `<div class="ph-actions">${fams.length ? `<button type="button" class="btn btn-primary" data-ph-fams="${fams.join(",")}">${esc(tr("ph.practiseAt", { mode: tr("mode." + lv) }))}</button>` : ""}${l.tool ? `<button type="button" class="btn btn-secondary" data-ph-tool="${l.tool}">${esc(tr("ph.tryTool", { tool: tr("ph.tool." + l.tool) }))}</button>` : ""}</div>`)}
      <p class="ph-close">${rm(loc(l.close))}</p>
      <p class="faint small">${esc(tr("ph.notReviewed"))}</p>`;
  }
  function shuffleFixed(arr, seed) { let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function renderFormulas(focus) {
    return `<div class="ph-formula-grid">${CT().FORMULAS.map((f) => `<article class="glass panel ph-formula${f.id === focus ? " focus" : ""}" id="phf-${f.id}">
      <div class="math-display">${rm(`\\[${f.tex}\\]`)}</div>
      <table class="ph-vars"><caption class="sr-only">${esc(tr("ph.f.vars"))}</caption><thead><tr><th scope="col">${esc(tr("ph.f.sym"))}</th><th scope="col">${esc(tr("ph.f.meaning"))}</th><th scope="col">${esc(tr("ph.f.unit"))}</th></tr></thead><tbody>${f.vars.map((v) => `<tr><td>${rm(`\\(${v.sym}\\)`)}</td><td>${esc(loc(v.d))}</td><td>${esc(v.unit)}</td></tr>`).join("")}</tbody></table>
      <p><b>${esc(tr("ph.f.when"))}</b> ${rm(loc(f.when))}</p>
      ${f.rearr.length ? `<p><b>${esc(tr("ph.f.rearr"))}</b> ${f.rearr.map((r) => rm(`\\(${r}\\)`)).join(" · ")}</p>` : ""}
      <p><b>${esc(tr("ph.f.example"))}</b> ${rm(loc(f.ex))}</p>
      <p><b>${esc(tr("ph.f.mistakes"))}</b> ${f.mistakes.map((m) => rm(loc(m))).join("; ")}</p>
      <div class="ph-actions"><button type="button" class="btn btn-link btn-sm" data-ph-lesson="${f.related.lesson}">${esc(tr("ph.lesson"))}: ${esc(loc(CT().get(f.related.lesson).title))}</button><button type="button" class="btn btn-sm btn-secondary" data-ph-fams="${f.related.families.join(",")}">${esc(tr("ph.practise"))}</button>${f.related.tool ? `<button type="button" class="btn btn-link btn-sm" data-ph-tool="${f.related.tool}">${esc(tr("ph.tool." + f.related.tool))}</button>` : ""}</div>
    </article>`).join("")}</div>`;
  }

  // ───────── practice: launcher · course map · diagnostics · review ─────────
  function renderPractice() {
    const p = prefs(), tab = sub.tab || p.practiceTab;
    const tabs = `<div class="tabbar" role="tablist">${["practise", "course", "diagnostics", "review"].map((k) => `<button type="button" role="tab" data-ph-tab="${k}" aria-selected="${k === tab}" class="${k === tab ? "active" : ""}">${esc(tr("ph.tab." + k))}</button>`).join("")}</div>`;
    const head = `<div class="page-head"><div><p class="eyebrow">${esc(tr("ph.kicker"))}</p><h1>${esc(tr("ph.practice.title"))}</h1></div></div><div class="prac-tabs">${tabs}</div>`;
    if (tab === "course") return head + renderCourse();
    if (tab === "diagnostics") return head + `<div class="ph-two">${panel("ph-diag", "ph.diag", diagPanel(false))}${panel("ph-diag-run", "ph.diag.title", `<p>${esc(tr("ph.diag.explain"))}</p>${levelSeg(level())}<div class="ph-actions"><button type="button" class="btn btn-primary" data-ph-start="diag">${esc(tr("ph.runDiag"))}</button></div>`)}</div>`;
    if (tab === "review") return head + panel("ph-review", "ph.review", reviewPanel());
    return head + `<div class="ph-two">${panel("ph-launch", "ph.launch", launcher(false))}${panel("ph-pathp", "ph.path", lessonPath())}</div>`;
  }
  function renderCourse() {
    const cov = C().coverage(), D = diagnose(), open = prefs().courseOpen, lv = level();
    const counts = { tested: 0, validation: 0, planned: 0, supplementary: 0 };
    cov.forEach((c) => counts[c.status]++);
    const chip = (st) => `<span class="chip ph-st-${st}">${esc(tr("ph.status." + st))}</span>`;
    return `<section class="glass panel ph-course-top"><p>${esc(tr("ph.course.intro"))} <a href="${C().SOURCE}" target="_blank" rel="noopener">${esc(tr("course.source"))}</a></p>
      <ul class="ph-legend">${Object.entries(counts).map(([k, n]) => `<li>${chip(k)} <b>${n}</b> <small class="faint">${esc(tr("ph.status." + k + ".d"))}</small></li>`).join("")}</ul>${levelSeg(lv)}</section>
      ${C().UNITS.map((u) => {
        const rows = cov.filter((c) => c.unit === u.id);
        return `<details class="course-unit glass" data-ph-unit="${u.id}" ${open === u.id ? "open" : ""}><summary><span class="cu-letter">${u.id.slice(1)}</span><span class="cu-title">${esc(loc(u.title))}</span><span class="cu-meta">${rows.filter((r) => r.status === "tested").length}/${rows.length}</span></summary>
          <ul class="sub-list">${rows.map((c) => { const s = D.subs[c.id], has = c.modes.includes(lv);
            return `<li class="sub-row"><span class="sub-t"><b>${esc(loc(c.title))}</b>${chip(c.status)}${c.families.length && c.modes.length < 4 ? `<span class="chip chip-partial">${esc(c.modes.map((m) => tr("mode." + m)).join(" · "))}</span>` : ""}</span>
              <span class="sub-mine${s ? "" : " faint"}">${s ? esc(tr("ph.mine", { n: s.n, pct: Math.round((s.e / s.m) * 100) })) : esc(tr("course.notYet"))}</span>
              <span class="sub-act">${c.lessons[0] ? `<button type="button" class="btn btn-link btn-sm" data-ph-lesson="${c.lessons[0]}">${esc(tr("ph.lesson"))}</button>` : ""}${c.tool ? `<button type="button" class="btn btn-link btn-sm" data-ph-tool="${c.tool}">${esc(tr("ph.tool." + c.tool))}</button>` : ""}${c.families.length ? `<button type="button" class="btn btn-sm ${has ? "btn-primary" : "btn-secondary"}" data-ph-subrun="${c.id}" ${has ? "" : `disabled title="${esc(tr("ph.notAtLevelNote", { mode: tr("mode." + lv) }))}"`}>${esc(tr("ph.practise"))}</button>` : ""}</span></li>`; }).join("")}</ul></details>`;
      }).join("")}`;
  }

  // ───────── lab ─────────
  function renderLab() {
    const tool = sub.tool || prefs().tool;
    const tabs = `<div class="tabbar" role="tablist">${["explorer", "graphs", "vector"].map((k) => `<button type="button" role="tab" data-ph-tool="${k}" aria-selected="${k === tool}" class="${k === tool ? "active" : ""}">${esc(tr("ph.tool." + k))}</button>`).join("")}</div>`;
    return `<div class="page-head"><div><p class="eyebrow">${esc(tr("ph.kicker"))}</p><h1>${esc(tr("ph.lab.title"))}</h1><p class="lead">${esc(tr("ph.tool." + tool + ".d"))}</p></div></div><div class="prac-tabs">${tabs}</div>
      <section class="glass panel ph-lab"><div class="ph-tool-host" data-tool-host="${tool}"></div></section>`;
  }

  // ───────── runner ─────────
  function startRun(opts) {
    const lv = level();
    let items, revisits = 0;
    if (opts.diag) {
      // one fresh question per tracked skill area, all at the chosen level
      const fams = ["ph_components", "ph_vertical", "ph_horizontal", "ph_angled_same", "ph_angled_diff", "ph_graphs", "ph_equations", "ph_concepts", "ph_units"];
      const got = B().select({ subject: "physics", families: fams, mode: lv, n: 8, kinds: ["wr"] });
      items = got.items.map((x) => x.q);
    } else {
      const got = B().select({ subject: "physics", subs: opts.subs, families: opts.families, mode: lv, n: opts.n || 5, kinds: ["wr"] });
      if (got.unavailable || !got.items.length) { A.confirmDialog(tr("prac.unavailTitle"), esc(tr("ph.notAtLevelNote", { mode: tr("mode." + lv) })), tr("common.ok"), tr("common.close")); return; }
      items = got.items.map((x) => x.q);
      revisits = got.revisits;
    }
    if (!items.length) return;
    run = { active: true, id: "ph-" + Date.now().toString(36), items, i: 0, ans: items.map(() => ({})), order: {}, hints: items.map(() => 0), mode: lv, revisits, diag: !!opts.diag, back: view === "run" ? (run && run.back) || "practice" : view, opts, title: opts.title || "" };
    view = "run";
    A.show("phys"); A.markNav("practice", tr("ph.ctx.run"));
    render();
  }
  function stopRun() { if (run) run.active = false; run = null; }
  function curPart(q, a) { return q.parts.findIndex((p) => !a[p.key] || !a[p.key].checked); }
  function partInput(q, p, a) {
    const st = a[p.key] || {}, done = !!st.checked, dis = done ? "disabled" : "";
    if (p.kind === "qty") {
      const [val, unit] = String(st.response || "").split("|");
      const units = p.units;
      return `<div class="ph-qty"><input type="text" class="answer-input ph-num" inputmode="decimal" autocomplete="off" spellcheck="false" data-ph-part="${p.key}" aria-label="${esc(tr("ph.value"))}" placeholder="${esc(tr("ph.numPh"))}" value="${esc(val || "")}" ${dis}/>
        ${units.length > 1 ? `<select class="text-input ph-unit" data-ph-unit="${p.key}" aria-label="${esc(tr("ph.unit"))}" ${dis}>${units.map((u) => `<option value="${esc(u)}" ${u === (unit || units[0]) ? "selected" : ""}>${esc(u)}</option>`).join("")}</select>` : `<span class="ph-unit-fixed">${esc(units[0])}</span>`}</div>`;
    }
    if (p.kind === "pmc") return `<div class="choices ph-choices" role="radiogroup" aria-label="${esc(loc(p.prompt).replace(/\\\(|\\\)/g, ""))}">${p.options.map((o, i) => `<button type="button" role="radio" aria-checked="${String(st.response) === String(i)}" class="choice${String(st.response) === String(i) ? " selected" : ""}${done && i === p.answer ? " is-correct" : ""}${done && String(st.response) === String(i) && i !== p.answer ? " is-wrong" : ""}" data-ph-opt="${p.key}" data-i="${i}" ${dis}><span class="choice-letter">${"ABCDEF"[i]}</span><span class="choice-body">${rm(loc(o))}${p.figs && p.figs[i] ? `<span class="ph-opt-fig">${window.PhysFig.render(p.figs[i])}</span>` : ""}</span></button>`).join("")}</div>`;
    if (p.kind === "order") {
      const ord = run.order[q.id + p.key] || (run.order[q.id + p.key] = p.steps.map((_, i) => i));
      return `<ol class="ph-order">${ord.map((si, pos) => `<li><span class="ph-ord-t">${rm(loc(p.steps[si]))}</span><span class="ph-ord-btns"><button type="button" class="icon-btn" data-ph-move="${p.key}" data-pos="${pos}" data-dir="-1" aria-label="${esc(tr("ph.moveUp"))}" ${dis || (pos === 0 ? "disabled" : "")}>↑</button><button type="button" class="icon-btn" data-ph-move="${p.key}" data-pos="${pos}" data-dir="1" aria-label="${esc(tr("ph.moveDown"))}" ${dis || (pos === ord.length - 1 ? "disabled" : "")}>↓</button></span></li>`).join("")}</ol>`;
    }
    return "";
  }
  function keyText(p) { const t = keyTextRaw(p); return window.PhysKit && ["fr", "es", "de"].includes((window.I18N || {}).lang) ? window.PhysKit.commaText(t) : t; }
  function keyTextRaw(p) {
    const P = M();
    if (p.kind === "qty") { const u = p.units[0]; return `${P.fmt(P.fromSI(Number(p.answer), u), 3)} ${u}`; }
    if (p.kind === "pmc") return loc(p.options[p.answer]);
    if (p.kind === "order") return p.answer.map((i) => loc(p.steps[i])).join(" → ");
    return "";
  }
  function noteText(g) {
    if (!g.noteKey) return g.note || "";
    const v = { ...(g.noteVars || {}) };
    if (v.wantKey) v.want = tr(v.wantKey);
    const s = tr(g.noteKey, v);
    return s === g.noteKey ? g.note : s;
  }
  function renderRun() {
    const el = root(), r = run;
    if (r.i >= r.items.length) return renderResults();
    const q = r.items[r.i], a = r.ans[r.i], cp = curPart(q, a), allDone = cp < 0;
    const lvl = q.meta.mode, hintMax = q.hints.length, shown = r.hints[r.i];
    const parts = q.parts.map((p, k) => {
      if (cp >= 0 && k > cp) return "";
      const st = a[p.key] || {};
      const fb = st.checked ? `<div class="quiz-fb ${st.g.verdict === "right" ? "ok" : "bad"}" role="status"><p class="fb-title"><b>${esc(tr(st.g.verdict === "right" ? "ph.right" : st.g.verdict === "blank" ? "ph.blank" : "ph.wrong"))}</b> ${esc(noteText(st.g))}</p>${st.g.verdict !== "right" ? `<p class="fb-key"><span class="cmp-label">${esc(tr("ph.answer"))}</span> ${rm(keyText(p))}</p>` : ""}${st.g.cat && st.g.verdict !== "right" ? `<p class="faint small">${esc(tr("ph.errType"))}: ${esc(tr("phc." + catKey(st.g.cat)))}</p>` : ""}</div>` : "";
      return `<div class="ph-part${k === cp ? " current" : ""}" data-key="${p.key}"><p class="ph-prompt"><span class="ph-plabel">(${p.key})</span> ${rm(loc(p.prompt))}</p>${partInput(q, p, a)}
        ${!st.checked && k === cp ? `<div class="ph-actions"><button type="button" class="btn btn-primary" data-ph-check="${p.key}">${esc(tr("ph.checkPart"))}</button></div>` : ""}${fb}</div>`;
    }).join("");
    el.innerHTML = `<div class="ph-run">
      <div class="pr-head"><div><p class="eyebrow">${esc(r.diag ? tr("ph.diag.title") : tr("ph.kicker"))} · ${esc(tr("mode." + lvl))}</p><h1 class="pr-title">${esc(famTitle(q.meta.family))}</h1></div><button class="btn btn-ghost btn-sm" type="button" data-ph-leave>${esc(tr("common.close"))}</button></div>
      <div class="pr-progress"><span class="pr-count">${esc(tr("ph.qOf", { i: r.i + 1, n: r.items.length }))}</span><span class="pr-bar"><span style="width:${(r.i / r.items.length) * 100}%"></span></span></div>
      <article class="paper canvas ph-q">
        <div class="q-text">${rm(loc(q.stem))}</div>
        ${q.work ? `<ol class="ph-work">${q.work.map((w) => `<li>${rm(w)}</li>`).join("")}</ol>` : ""}
        ${q.fig ? `<figure class="ph-fig">${window.PhysFig.render(q.fig)}</figure>` : ""}
        ${q.scaffold && lvl === "simple" ? `<div class="ph-scaffold"><b>${esc(tr("ph.steps"))}</b> ${q.scaffold.map((s) => rm(loc(s))).join(" ")}</div>` : ""}
        ${parts}
        ${shown ? `<div class="hint-box"><b>${esc(tr("ph.hints"))}</b><ol>${q.hints.slice(0, shown).map((h) => `<li>${rm(loc(h))}</li>`).join("")}</ol></div>` : ""}
        ${!allDone && shown < hintMax ? `<button type="button" class="btn btn-quiet btn-sm" data-ph-hint>${esc(tr(shown ? "ph.hintMore" : "ph.hint"))} (${shown}/${hintMax})</button>` : ""}
        ${allDone ? `<details class="fb-solution" open><summary>${esc(tr("ph.solution"))}</summary><ol>${q.solution.map((s) => `<li>${rm(loc(s))}</li>`).join("")}</ol></details>` : ""}
      </article>
      ${allDone ? `<div class="ph-actions"><button type="button" class="btn btn-primary" data-ph-next>${esc(tr(r.i === r.items.length - 1 ? "ph.results" : "ph.nextQ"))}</button></div>` : ""}
    </div>`;
    const inp = el.querySelector(".ph-part.current .ph-num, .ph-part.current .choice"); if (inp && !inp.disabled) inp.focus({ preventScroll: true });
  }
  function responseOf(q, p) {
    const el = root();
    if (p.kind === "qty") { const v = el.querySelector(`[data-ph-part="${p.key}"]`), u = el.querySelector(`[data-ph-unit="${p.key}"]`); return `${v ? v.value.trim() : ""}|${u ? u.value : p.units[0]}`; }
    if (p.kind === "pmc") { const a = run.ans[run.i][p.key]; return a && a.response !== undefined ? String(a.response) : ""; }
    if (p.kind === "order") return (run.order[q.id + p.key] || []).join(",");
    return "";
  }
  function checkPart(key) {
    const r = run, q = r.items[r.i], p = q.parts.find((x) => x.key === key), a = r.ans[r.i];
    const resp = responseOf(q, p);
    const g = window.MathCheck.grade(p, resp);
    if (g.verdict === "blank") { a[key] = { response: resp }; const live = root().querySelector(".ph-part.current"); if (live) { let n = live.querySelector(".ph-blank-note"); if (!n) { n = document.createElement("p"); n.className = "ph-blank-note faint small"; n.setAttribute("role", "status"); live.appendChild(n); } n.textContent = tr("ph.blankNote"); } return; }
    a[key] = { response: resp, checked: true, g };
    const log = records();
    log.push({ date: Date.now(), run: r.id, qid: q.id, part: key, family: q.meta.family, sub: q.meta.sub, subs: q.meta.subs, mode: q.meta.mode, skills: p.skills, earned: g.earned, max: g.max, correct: g.earned >= g.max, cat: g.earned >= g.max ? "" : g.cat || "", response: String(resp).slice(0, 80), hints: r.hints[r.i], diag: r.diag || undefined });
    store.set(KEYS.practice, log.slice(-4000));
    renderRun();
  }
  function renderResults() {
    const r = run, el = root(), rs = records().filter((x) => x.run === r.id);
    const D = diagnose(rs), e = rs.reduce((s, x) => s + x.earned, 0), m = rs.reduce((s, x) => s + x.max, 0);
    const skills = D.skills.filter((s) => s.n);
    el.innerHTML = `<div class="ph-run ph-results"><p class="eyebrow">${esc(r.diag ? tr("ph.diag.title") : tr("ph.kicker"))} · ${esc(tr("mode." + r.mode))}</p><h1>${e} / ${m}</h1>
      ${r.revisits ? `<p class="faint small">${esc(tr("prac.revisit", { n: r.revisits }))}</p>` : ""}
      <div class="ph-two">${panel("ph-res-skills", "ph.bySkill", skills.length ? `<ul class="ph-skills">${skills.map((s) => `<li><span class="ph-sk-t">${esc(tr("phs." + s.id))}</span><span class="bar"><span class="bar-fill ${pctCls(s.acc * 100)}" style="width:${Math.round(s.acc * 100)}%"></span></span><span class="sp-pct ${pctCls(s.acc * 100)}">${s.e}/${s.m}</span></li>`).join("")}</ul>` : "")}
      ${panel("ph-res-next", "ph.next", (D.weak.length || skills.some((s) => s.acc < 1) ? `<ul class="ph-recs">${(D.weak.length ? D.weak : skills.filter((s) => s.acc < 1).sort((a, b) => a.acc - b.acc)).slice(0, 3).map((s) => { const mm = SKILL_MAP[s.id]; return `<li><b>${esc(tr("phs." + s.id))}</b><span class="ph-rec-act"><button type="button" class="btn btn-link btn-sm" data-ph-lesson="${mm.lesson}">${esc(tr("ph.lesson"))}</button><button type="button" class="btn btn-sm btn-secondary" data-ph-fams="${mm.fams.join(",")}">${esc(tr("ph.practise"))}</button>${mm.tool ? `<button type="button" class="btn btn-link btn-sm" data-ph-tool="${mm.tool}">${esc(tr("ph.tool." + mm.tool))}</button>` : ""}</span></li>`; }).join("")}</ul>` : `<p>${esc(tr("ph.allRight"))}</p>`) + (Object.keys(D.cats).length ? `<p class="faint small">${esc(tr("ph.errTypes"))}: ${Object.entries(D.cats).map(([k, n]) => `${esc(tr("phc." + k))} × ${n}`).join(", ")}</p>` : "") + `<p class="faint small">${esc(tr("ph.diagHonest"))}</p>`)}</div>
      <div class="ph-actions"><button type="button" class="btn btn-primary" data-ph-again>${esc(tr("prac.again"))}</button><button type="button" class="btn btn-quiet" data-ph-leave>${esc(tr("common.close"))}</button></div></div>`;
  }

  // ───────── events ─────────
  function onClick(e) {
    const t = e.target.closest("button, [data-ph-ltab], [data-ph-tab]"); if (!t || !root() || !root().contains(t)) return;
    const d = t.dataset;
    if (d.phLevel) { A.setMode(d.phLevel); return render(); }
    // Physics tests (shared engine)
    if (d.ptStart) return A.startPhysTest(d.ptStart, T().options(d.ptStart));
    if (d.ptOptions) return A.openPhysSetup(d.ptOptions);
    if (d.ptN) { T().setOptions(level(), { n: Number(d.ptN) }); return render(); }
    if (d.ptResume !== undefined) return A.resumeSaved();
    if (d.ptDiscard !== undefined) { A.discardSaved().then(() => render()); return; }
    if (d.ptAttempt) { const a = T().history().find((x) => x.id === d.ptAttempt); if (a) A.showResults(a, false); return; }
    if (d.phLesson !== undefined) { setPrefs({ lesson: d.phLesson, learnTab: "lessons" }); sub = { lesson: d.phLesson, ltab: "lessons" }; return open("learn"); }
    if (d.phTool) { setPrefs({ tool: d.phTool }); sub = { tool: d.phTool }; return open("lab"); }
    if (d.phFormula) { sub = { ltab: "formulas", formula: d.phFormula }; open("learn"); const f = document.getElementById("phf-" + d.phFormula); if (f) f.scrollIntoView({ block: "center" }); return; }
    if (d.phGo) { sub = { tab: d.phTab, ltab: d.phLtab }; if (d.phTab) setPrefs({ practiceTab: d.phTab }); if (d.phLtab) setPrefs({ learnTab: d.phLtab }); return open(d.phGo); }
    if (d.phLtab && view === "learn") { setPrefs({ learnTab: d.phLtab }); sub = { ...sub, ltab: d.phLtab }; return render(); }
    if (d.phTab && view === "practice") { setPrefs({ practiceTab: d.phTab }); sub = { tab: d.phTab }; return render(); }
    if (d.phStart) {
      if (d.phStart === "diag") return startRun({ diag: true });
      if (d.phStart === "mixed") return startRun({ subs: C().SUBS.filter((s) => s.unit === "PC").map((s) => s.id), n: 8 });
      if (d.phStart === "pt-practice") return startRun({ subs: T().subsFor(T().options(level()).topic), n: 5 });
      const sid = ($("#ph-sub") || {}).value || prefs().sub; setPrefs({ sub: sid }); return startRun({ subs: [sid], n: 5 });
    }
    if (d.phSubrun) { setPrefs({ sub: d.phSubrun }); return startRun({ subs: [d.phSubrun], n: 5 }); }
    if (d.phFams) return startRun({ families: d.phFams.split(",").filter((f) => B().byFam(f)), n: 5 });
    if (d.phCheck !== undefined && t.closest(".ph-check")) {
      const box = t.closest(".ph-check"), fb = box.nextElementSibling;
      for (const b of box.querySelectorAll(".choice")) { b.classList.remove("is-correct", "is-wrong"); }
      t.classList.add(d.phCheck === "1" ? "is-correct" : "is-wrong");
      if (fb) fb.textContent = tr(d.phCheck === "1" ? "ph.check.ok" : "ph.check.no");
      return;
    }
    if (!run) return;
    if (d.phCheck) return checkPart(d.phCheck);
    if (d.phOpt) { const a = run.ans[run.i]; if (!(a[d.phOpt] && a[d.phOpt].checked)) { a[d.phOpt] = { response: d.i }; renderRun(); } return; }
    if (d.phMove) { const q = run.items[run.i], k = q.id + d.phMove, ord = run.order[k], pos = Number(d.pos), to = pos + Number(d.dir); if (to < 0 || to >= ord.length) return; [ord[pos], ord[to]] = [ord[to], ord[pos]]; renderRun(); const b = root().querySelector(`[data-ph-move="${d.phMove}"][data-pos="${to}"][data-dir="${d.dir}"]`) || root().querySelector(`[data-ph-move="${d.phMove}"][data-pos="${to}"]`); if (b && !b.disabled) b.focus(); return; }
    if (d.phHint !== undefined) { run.hints[run.i] = Math.min(run.items[run.i].hints.length, run.hints[run.i] + 1); return renderRun(); }
    if (d.phNext !== undefined) { run.i++; return renderRun(); }
    if (d.phAgain !== undefined) return startRun(run.opts);
    if (d.phLeave !== undefined) { const back = run.back || "practice"; stopRun(); return open(back === "run" ? "practice" : back); }
  }
  function onKey(e) {
    if (e.key !== "Enter" || !run || !e.target.matches || !e.target.matches(".ph-num")) return;
    e.preventDefault(); checkPart(e.target.dataset.phPart);
  }
  function onChange(e) {
    if (e.target.id === "ph-sub") { setPrefs({ sub: e.target.value }); render(); }
    if (e.target.id === "ph-test-topic") { T().setOptions(level(), { topic: e.target.value }); render(); }
  }
  document.addEventListener("toggle", (e) => { const d = e.target; if (d.dataset && d.dataset.phUnit && d.open) setPrefs({ courseOpen: d.dataset.phUnit }); }, true);

  window.PhysUI = {
    init(api) { A = api; const r = root(); if (r) { r.addEventListener("click", onClick); r.addEventListener("keydown", onKey); r.addEventListener("change", onChange); } },
    open, render, startRun, stopRun,
    // read-only view of the question on screen (used by the browser tests to answer with the key)
    current() { return run && run.items[run.i] ? { id: run.items[run.i].id, i: run.i, n: run.items.length } : null; },
    get view() { return view; }, get runActive() { return !!(run && run.active && view === "run"); },
    leave() { stopRun(); unmountTool(); },
    diagnose, reviewQueue, records, KEYS, SKILL_MAP, prefs, runsOf, famTitle, setSub: (id) => setPrefs({ sub: id }),
  };
})();
