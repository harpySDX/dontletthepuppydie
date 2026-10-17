(function () {
  "use strict";

  // ───────────────────────── exam layout ─────────────────────────
  // Normal and Challenging match the unit test outline (34 marks: WR 19, NR 5, MC 10). Nightmare is one
  // gauntlet of written stages, so sections, counts and marks are worked out from the test itself.
  const DEFAULT_SECONDS = 60 * 60;
  const durOf = (x) => (x && x.duration) || DEFAULT_SECONDS; // each test can have its own time limit
  const SECTIONS = [
    { key: "wr", name: "Written Response", short: "WR" },
    { key: "nr", name: "Numerical Response", short: "NR" },
    { key: "mc", name: "Multiple Choice", short: "MC" },
  ];
  // the sections a given test actually has, with counts and marks
  function sectionsOf(items) {
    return SECTIONS.map((s) => { const xs = items.filter((it) => it.kind === s.key); return { ...s, name: window.I18N ? window.I18N.t("sec." + s.key) : s.name, count: xs.length, marks: xs.reduce((a, it) => a + (it.max !== undefined ? it.max : maxMarks(it)), 0) }; }).filter((s) => s.count);
  }
  const tr = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);

  const KEYS = {
    history: "campfire-prep.history.v2",
    session: "campfire-prep.session.v2",
    prefs: "campfire-prep.prefs.v1",
    toured: "campfire-prep.toured.v1",
    practice: "campfire-prep.practice.v1",   // concept-quiz answers (learning evidence)
    feedback: "campfire-prep.feedback.v1",   // helpful / confusing votes per lesson
    done: "campfire-prep.done.v1",           // study-plan items marked done
    exam: "campfire-prep.exam.v1",           // exam date, units in scope, minutes/day, study days, priorities
    notebook: "campfire-prep.notebook.v1",   // Mistake Notebook: { key: { understood, cat, note } } (answers themselves come from history)
    room: "campfire-prep.room.v1",           // the study room you're in (answers so far), survives refresh
    roomBoards: "campfire-prep.roomboards.v1", // result codes you've pasted, per room
    ui: "campfire-prep.ui.v1",               // { lang, layout, theme }
    pad: "campfire-prep.pad.global.v1",      // scratchpad page outside tests: { strokes, notes }
  };

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const MCB = window.MC_BANK, NRB = window.NR_BANK, WRB = window.WR_BANK;
  const CM = window.CLASSMATE || { wr: [], nr: [], mc: [] };
  const CHM = window.CH_MC_BANK || [], CHN = window.CH_NR_BANK || [], CHW = window.CH_WR_BANK || [];
  const BANKS = {
    mc: new Map([...MCB, ...CHM, ...CM.mc].map((q) => [q.id, q])),
    nr: new Map([...NRB, ...CHN, ...CM.nr].map((q) => [q.id, q])),
    wr: new Map([...WRB, ...CHW, ...CM.wr].map((q) => [q.id, q])),
  };
  // Generated questions (quadratics "qd-…", and the retired radicals Nightmare "nm-…") are rebuilt exactly
  // from their id, so saved tests, reviews and history never need to store the question itself.
  for (const m of Object.values(BANKS)) {
    const get = m.get.bind(m), has = m.has.bind(m);
    m.get = (id) => {
      let q = get(id);
      if (!q && /^qd-/.test(id || "") && window.QuadBank) { q = window.QuadBank.byId(id); if (q) m.set(id, q); }
      if (!q && /^nm-/.test(id || "") && window.Nightmare) { q = window.Nightmare.byId(id); if (q) m.set(id, q); }
      if (!q && /^cb-/.test(id || "") && window.Bank) { q = window.Bank.byId(id); if (q) m.set(id, q); }
      return q;
    };
    m.has = (id) => has(id) || !!m.get(id);
  }
  const LEVELS = {
    simple: { label: "Simple", short: "Simple", practice: true, hint: "Guided practice: one skill at a time with step-by-step hints and instant feedback. Not timed." },
    normal: { label: "Normal", short: "Normal", hint: "Unit-test level: 34 marks laid out like the real test, fresh verified questions every time. Hints are there if you ask (they're noted in your review)." },
    challenge: { label: "Challenging", short: "Challenging", hint: "Harder than the unit test: fractions, disguised forms, traps and combined skills. One strategy hint per question." },
    nightmare: { label: "Nightmare", short: "Nightmare", hint: "One connected gauntlet: five stages about a single function. No hints, exact answers only." },
    // retired levels, kept so earlier history still displays (radicals unit)
    classmate: { label: "Tim's Test (radicals, retired)", short: "Tim's", legacy: true, hint: "" },
    nightmare1: { label: "Nightmare I (radicals, retired)", short: "Nightmare I", legacy: true, hint: "" },
    nightmare2: { label: "Nightmare II (radicals, retired)", short: "Nightmare II", legacy: true, hint: "" },
    nightmare3: { label: "Nightmare III (radicals, retired)", short: "Nightmare III", legacy: true, hint: "" },
  };
  const TEST_LEVELS = ["normal", "challenge", "nightmare"];
  const levelOf = (a) => (a && a.level) || "normal";
  const levelName = (lv) => (LEVELS[lv] && !LEVELS[lv].legacy ? tr(`mode.${lv}`) : (LEVELS[lv] || LEVELS.normal).label);
  // tests taken before the switch to quadratics have no subject; they were the radicals unit
  const subjectOf = (a) => (a && a.subject) || "radicals";
  // Harder-than-the-test levels: kept out of accuracy, recommendations and the notebook (they'd skew them)
  const isHard = (lv) => lv === "challenge" || /^nightmare/.test(lv || "");
  const LETTERS = ["A", "B", "C", "D", "E", "F"];
  const Check = window.MathCheck;

  // ───────────────────────── storage ─────────────────────────
  const store = {
    get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* full or blocked */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
  };
  const getHistory = () => store.get(KEYS.history, []);
  const getPrefs = () => {
    const p = Object.assign({ buddyMode: "off", level: "normal", mode: null, name: "", minutes: 60, hardcore: false, drain: false }, store.get(KEYS.prefs, {}));
    if (!TEST_LEVELS.includes(p.level)) p.level = /^nightmare/.test(p.level) ? "nightmare" : "normal"; // retired levels → nearest current one
    return p;
  };
  // Goose Mode is its own gameplay ruleset, never a difficulty: choosing Simple switches it off (and restores the
  // standard rules); choosing any other difficulty never switches it on.
  const setPrefs = (p) => {
    const was = getPrefs();
    const next = { ...was, ...p };
    if (next.mode === "simple" && next.goose) next.goose = false;
    store.set(KEYS.prefs, next);
    if (!!was.goose !== !!next.goose && typeof applyGoose === "function") applyGoose();
  };

  // ───────────────────────── helpers ─────────────────────────
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function tex(t, display) {
    if (window.katex) { try { return window.katex.renderToString(t, { throwOnError: false, displayMode: !!display }); } catch { /* fall through */ } }
    return `<code>${esc(t)}</code>`;
  }
  function renderMath(str) {
    // graphs travel inside question text as tokens; draw them first (their SVG holds no TeX)
    if (window.Graph && String(str).includes("[[graph|")) str = window.Graph.render(str);
    return String(str).split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/).map((part) =>
      part.startsWith("\\(") && part.endsWith("\\)") ? tex(part.slice(2, -2))
        : part.startsWith("\\[") && part.endsWith("\\]") ? `<span class="math-display">${tex(part.slice(2, -2), true)}</span>` : part).join("");
  }
  function shuffle(arr, rnd = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function clock(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; }
  function dur(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60), s = sec % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  function hoursMins(sec) {
    const m = Math.round(sec / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
  }
  const locale = () => (window.I18N ? (window.I18N.LANGS.find((l) => l.id === window.I18N.lang) || {}).html : undefined);
  function niceDate(ts, withTime = true) {
    const d = new Date(ts);
    const date = d.toLocaleDateString(locale(), { weekday: "short", month: "short", day: "numeric" });
    return withTime ? `${date} · ${d.toLocaleTimeString(locale(), { hour: "numeric", minute: "2-digit" })}` : date;
  }
  const fmtMarks = (n) => (Math.round(n * 10) / 10).toString();
  const compareAttempts = (a, b) => b.percent - a.percent || a.totalTime - b.totalTime;

  // ───────────────────────── state ─────────────────────────
  let session = null, fire = null, timerId = null, lastTick = 0, lastSave = 0, lastTyped = 0;
  let viewing = null, reviewFilter = "all";
  let pad = null;

  // which island item a screen belongs to, and the short label the collapsed island shows
  const NAV_OF = { home: "home", results: "home", practice: "practice", course: "practice", review: "practice", learning: "practice", progress: "practice", library: "library", studyroom: "studyroom", room: "studyroom", lobby: "studyroom" };
  const CTX_KEY = { home: "nav.home", practice: "nav.practice", course: "prac.tab.course", review: "prac.tab.review", learning: "prac.tab.plan", progress: "prac.tab.progress", library: "nav.concepts", studyroom: "nav.room", room: "nav.room", lobby: "nav.lobby", results: "nav.results", test: "nav.test", start: "nav.title" };
  function show(name) {
    for (const s of $$(".screen")) s.hidden = s.id !== `screen-${name}`;
    $("#topbar-test").hidden = name !== "test";
    const isl = $("#island");
    isl.dataset.screen = name;
    isl.classList.toggle("in-test", name === "test");
    setIsland(false);
    for (const b of $$("#main-nav button")) {
      const on = b.dataset.go === NAV_OF[name];
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    }
    $("#island-ctx").textContent = tr(CTX_KEY[name] || "nav.home");
    document.body.dataset.screen = name;
    renderTabs(name);
    if (window.Tools) window.Tools.setVisible(name !== "start");
    // outside a test the scratchpad is one general notes page
    if (name !== "test" && pad && !pad.root.hidden) usePadGeneral();
    window.scrollTo({ top: 0 });
    if (window.Review && name !== "test") window.Review.updateBadge();
    if (window.Tutor) window.Tutor.refresh();
  }

  // ───────── Practice tabs (Skills · Review · Study plan · Progress) ─────────
  const TABS = [["practice", "prac.tab.drills"], ["course", "prac.tab.course"], ["review", "prac.tab.review"], ["learning", "prac.tab.plan"], ["progress", "prac.tab.progress"]];
  function renderTabs(name) {
    for (const el of $$("[data-tabs]")) {
      if (el.closest(".screen").hidden) continue;
      el.innerHTML = `<div class="tabbar" role="tablist" aria-label="${esc(tr("nav.practice"))}">${TABS.map(([id, key]) => `<button type="button" role="tab" data-go="${id}" aria-selected="${id === name}" class="${id === name ? "active" : ""}">${esc(tr(key))}${id === "review" ? `<span class="nav-badge tab-badge" data-badge="review" hidden></span>` : ""}</button>`).join("")}</div>`;
    }
  }

  // ───────── Dynamic island ─────────
  function setIsland(open) {
    const isl = $("#island"), btn = $("#brand-link");
    if (isl.classList.contains("in-test")) open = false;
    isl.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", tr(open ? "nav.close" : "nav.open"));
    for (const b of $$("#main-nav button")) b.tabIndex = open ? 0 : -1;
  }
  function onIslandKey(e) {
    const items = $$("#main-nav button");
    const k = items.indexOf(document.activeElement);
    if (k < 0) return;
    const go = (i) => { e.preventDefault(); items[(i + items.length) % items.length].focus(); };
    if (e.key === "ArrowRight" || e.key === "ArrowDown") go(k + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(k - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
  }

  // ───────── Settings: language, layout, theme (saved on this device) ─────────
  const LAYOUTS = ["balanced", "focus", "studio", "studioplus"], THEMES = ["light", "dark", "system"];
  const getUI = () => { const u = store.get(KEYS.ui, {}); return { lang: (window.I18N && window.I18N.LANGS.some((l) => l.id === u.lang)) ? u.lang : "en", layout: LAYOUTS.includes(u.layout) ? u.layout : "balanced", theme: THEMES.includes(u.theme) ? u.theme : "light" }; };
  function applyUI(change) {
    const u = { ...getUI(), ...(change || {}) };
    // only write when the user changes something: applying on start-up never rewrites (or "repairs") saved choices
    if (change) store.set(KEYS.ui, { ...store.get(KEYS.ui, {}), ...u });
    const d = document.documentElement;
    d.dataset.theme = u.theme;
    d.dataset.layout = u.layout;
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = u.theme === "dark" ? "dark" : u.theme === "light" ? "light" : "light dark";
    if (window.I18N && window.I18N.lang !== u.lang) window.I18N.set(u.lang);
    renderSettings();
    return u;
  }
  const LAYOUT_ICON = {
    balanced: '<svg viewBox="0 0 48 32" aria-hidden="true"><rect x="1" y="1" width="46" height="30" rx="4" class="lo-frame"/><rect x="5" y="5" width="9" height="22" rx="2" class="lo-side"/><rect x="17" y="5" width="16" height="22" rx="2" class="lo-main"/><rect x="36" y="5" width="7" height="22" rx="2" class="lo-side"/></svg>',
    focus: '<svg viewBox="0 0 48 32" aria-hidden="true"><rect x="1" y="1" width="46" height="30" rx="4" class="lo-frame"/><rect x="9" y="5" width="30" height="22" rx="2" class="lo-main"/></svg>',
    studio: '<svg viewBox="0 0 48 32" aria-hidden="true"><rect x="1" y="1" width="46" height="30" rx="4" class="lo-frame"/><rect x="5" y="5" width="8" height="22" rx="2" class="lo-side"/><rect x="15" y="5" width="13" height="22" rx="2" class="lo-main"/><rect x="30" y="5" width="13" height="10" rx="2" class="lo-side"/><rect x="30" y="17" width="13" height="10" rx="2" class="lo-side"/></svg>',
    studioplus: '<svg viewBox="0 0 48 32" aria-hidden="true"><rect x="1" y="1" width="46" height="30" rx="4" class="lo-frame"/><rect x="4" y="4" width="40" height="4" rx="1.5" class="lo-side"/><rect x="4" y="10" width="15" height="18" rx="2" class="lo-main"/><rect x="21" y="10" width="11" height="8" rx="2" class="lo-side"/><rect x="21" y="20" width="11" height="8" rx="2" class="lo-side"/><rect x="34" y="10" width="10" height="18" rx="2" class="lo-side"/></svg>',
  };
  function renderSettings() {
    if (window.Onboarding) window.Onboarding.renderHelp();
    const u = getUI();
    if (!$("#set-lang") || !window.I18N) return;
    $("#set-lang").innerHTML = window.I18N.LANGS.map((l) => `<button type="button" role="radio" aria-checked="${u.lang === l.id}" class="${u.lang === l.id ? "active" : ""}" data-lang="${l.id}" lang="${l.html}">${esc(l.native)}</button>`).join("");
    $("#set-layout").innerHTML = LAYOUTS.map((l) => `<button type="button" role="radio" aria-checked="${u.layout === l}" class="layout-opt${u.layout === l ? " active" : ""}" data-layout="${l}">${LAYOUT_ICON[l]}<span class="lo-t"><b>${esc(tr("layout." + l))}</b><small>${esc(tr("layout." + l + ".d"))}</small></span></button>`).join("");
    $("#set-theme").innerHTML = THEMES.map((th) => `<button type="button" role="radio" aria-checked="${u.theme === th}" class="theme-opt th-${th}${u.theme === th ? " active" : ""}" data-theme-opt="${th}"><span class="th-swatch" aria-hidden="true"></span>${esc(tr("theme." + th))}</button>`).join("");
    $("#set-content-note").hidden = u.lang === "en";
    renderGooseSetting();
  }
  // ───────── Goose Mode setting (a gameplay ruleset, separate from difficulty) ─────────
  function gooseCalmPref() { const p = getPrefs(); return p.gooseCalm === undefined ? matchMedia("(prefers-reduced-motion: reduce)").matches : !!p.gooseCalm; }
  function renderGooseSetting() {
    const box = $("#set-goose"); if (!box) return;
    const p = getPrefs(), simple = selectedMode() === "simple", on = !!p.goose;
    box.innerHTML = `<div class="goose-set">
      <div class="goose-row"><svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><use href="#goose-head"/></svg><b id="goose-l">${esc(tr("goose.name"))}</b>
        <button type="button" class="goose-switch" id="goose-toggle" role="switch" aria-checked="${on}" aria-labelledby="goose-l" aria-describedby="goose-d${simple ? " goose-simple" : ""}" ${simple && !on ? "disabled" : ""}><span class="sr-only">${esc(tr(on ? "goose.on" : "goose.off"))}</span></button></div>
      <p class="set-note" id="goose-d">${esc(tr("goose.desc"))}</p>
      ${simple ? `<p class="set-note warn" id="goose-simple">${esc(tr("goose.simpleNote"))}</p>` : ""}
      ${on ? `<label class="goose-calm"><input type="checkbox" id="goose-calm" ${gooseCalmPref() ? "checked" : ""}/> <span>${esc(tr("goose.calm"))}</span></label>` : ""}
    </div>`;
  }
  const MASCOT = { on: { pup: "#goose-head", brand: "#goose-head" }, off: { pup: "#pup", brand: "#paw" } };
  function applyGoose() {
    const on = !!getPrefs().goose;
    document.body.classList.toggle("goose-on", on);
    const m = MASCOT[on ? "on" : "off"];
    const pu = $("#btn-settings use"); if (pu) pu.setAttribute("href", m.pup);
    const bu = $("#brand-link .pup-mark use"); if (bu) { bu.setAttribute("href", m.brand); bu.parentElement.setAttribute("viewBox", on ? "0 0 32 32" : "0 0 24 24"); }
    if (window.Goose) { if (on) window.Goose.enable(); else window.Goose.disable(); }
    if (session && !session.demo && fire) syncGooseSession();
    renderGooseSetting();
  }
  let popOpener = null;
  function setSettings(open) {
    const pop = $("#settings-pop"), btn = $("#btn-settings");
    if (open === !pop.hidden) return;
    pop.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    if (open) { popOpener = document.activeElement; renderSettings(); setIsland(false); const first = pop.querySelector(".active") || pop.querySelector("button"); if (first) first.focus(); }
    else if (popOpener && document.contains(popOpener)) popOpener.focus();
  }
  // radio groups inside the popover: arrow keys move between options
  function onRadioKeys(e) {
    const grp = e.target.closest('[role="radiogroup"]'); if (!grp) return;
    const items = $$('[role="radio"]', grp), k = items.indexOf(e.target); if (k < 0) return;
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (next) { e.preventDefault(); const idx = (k + next + items.length) % items.length; items[idx].click(); const fresh = $$('[role="radio"]', grp)[idx]; if (fresh) fresh.focus(); }
  }
  // re-render whatever is on screen in the new language
  function rerenderScreen() {
    const scr = document.body.dataset.screen;
    $("#island-ctx").textContent = tr(CTX_KEY[scr] || "nav.home");
    setIsland($("#island").classList.contains("open"));
    if (scr === "home") renderHome();
    else if (scr === "practice") { if ($("#prac-run").hidden) renderDrills(); }
    else if (scr === "progress") renderProgressScreen();
    else if (scr === "course") renderCourse();
    else if (scr === "studyroom") renderStudyRoom();
    else if (scr === "test" && session) { renderQuestion(); }
    else if (scr === "results" && viewing) showResults(viewing, false);
    renderTabs(scr);
    if (scr === "library" && window.Library) window.Library.renderNav();
  }

  // ───────── learning evidence (shared by Basecamp, Library, My Learning, Tutor) ─────────
  // Challenge tests are excluded so harder-than-the-test questions don't drag down mastery.
  // Challenge evidence is included but kept separate by the mastery model: it can add variety and
  // "harder questions right", but never lowers accuracy (it's much harder than the real test).
  function learningState() {
    const histAll = getHistory().map((a) => ({ ...a, level: isHard(levelOf(a)) ? "challenge" : levelOf(a) }));
    const practice = store.get(KEYS.practice, []);
    const allRecords = window.Learning.buildEvidence(histAll, practice, { qOf, gradeParts: (it) => gradeItem(it).parts, conceptsFor: window.Concepts.conceptsFor });
    // Blank answers only count as evidence (and as notebook mistakes) when the test was a genuine
    // attempt (at least half answered), so an abandoned or submitted-empty test doesn't read as "doesn't know it".
    const att = {};
    for (const r of allRecords) if (r.source === "test") { const a = att[r.attempt] || (att[r.attempt] = { n: 0, blank: 0 }); a.n++; if (r.blank) a.blank++; }
    const genuine = (r) => r.source !== "test" || !r.blank || (att[r.attempt] && att[r.attempt].blank / att[r.attempt].n <= 0.5);
    const records = allRecords.filter(genuine);
    const ids = window.Concepts.CONCEPTS.map((c) => c.id);
    const prof = window.Learning.profile(records, ids);
    const docConcepts = new Set(Object.values(store.get("campfire-prep.docindex.v1", {})).flat());
    const exam = { date: "", units: [], minutesPerDay: 30, days: [], priorities: [], ...store.get(KEYS.exam, {}) };
    const notebook = store.get(KEYS.notebook, {});
    const mistakes = window.Learning.mistakes(records.filter((r) => r.level !== "challenge"), { answerOf: (r) => { if (r.kind !== "nr") return undefined; const q = BANKS.nr.get(r.qid); return q ? Number(q.answer) : undefined; } })
      .map((m) => { const st = notebook[m.key] || {}; return { ...m, category: st.cat || m.autoCategory, catByYou: !!st.cat, understood: st.understood || null, note: st.note || "" }; });
    const open = mistakes.filter((m) => !m.fixed && !m.understood);
    const mistakeCounts = {};
    for (const m of open) for (const c of m.concepts) mistakeCounts[c] = (mistakeCounts[c] || 0) + 1;
    const recs = window.Learning.recommend(prof, { concepts: window.Concepts.CONCEPTS, feedback: store.get(KEYS.feedback, {}), docConcepts, scopeUnits: exam.units, done: store.get(KEYS.done, {}), priorities: exam.priorities, mistakeCounts });
    const unitOf = (id) => window.Concepts.get(id).unit;
    const dueConcepts = window.Learning.dueConcepts(prof, { scopeUnits: exam.units, unitOf });
    // mistakes due for a revisit: spaced steps, and not already marked understood
    const dueMistakes = mistakes.filter((m) => m.isDue && !m.understood);
    return {
      skippedBlanks: allRecords.length - records.length,
      prof, recs, records, mistakes, dueMistakes, dueConcepts, mistakeCounts, docConcepts, exam, unitOf,
      tests: histAll.filter((a) => a.level !== "challenge").length, challengeTests: histAll.filter((a) => a.level === "challenge").length,
      quizAnswers: practice.filter((p) => p.level !== "challenge").length,
    };
  }

  // Is any assessment unfinished (running OR paused OR saved)? The tutor is unavailable while it is.
  // "live"   = a test (or the tour's sample test) is open on screen
  // "paused" / "saved" = an unfinished test is waiting in Basecamp
  // null     = no assessment, tutor allowed
  function assessmentState() {
    if (session) return "live";
    const s = store.get(KEYS.session, null);
    if (!(s && s.items)) return null;
    const n = normalizeSession(s);
    if (timeLeftOf(n) <= 0) return null; // time is up: it is marked as soon as Basecamp renders
    return n.paused ? "paused" : "saved";
  }
  const isAssessmentActive = () => !!assessmentState();
  async function discardSaved() {
    if (!(await confirmDialog("Discard this test?", "Your answers on the unfinished test will be deleted. It won't count in your history.", "Discard", "Keep it"))) return false;
    store.del(KEYS.session);
    if (document.body.dataset.screen === "home") renderHome();
    if (window.Tutor) window.Tutor.refresh();
    return true;
  }

  function navigate(where, arg) {
    if (isAssessmentActive() && session) return; // never navigate away from a running test via the nav
    if (lobby) { clearInterval(lobby.timer); lobby = null; }
    if (where !== "practice") stopGuided();
    if (where === "library") { show("library"); window.Library.open(arg); }
    else if (where === "learning") { show("learning"); window.Analyst.render(); }
    else if (where === "review") { show("review"); window.Review.render(); }
    else if (where === "practice") { show("practice"); stopGuided(); renderDrills(); }
    else if (where === "progress") { show("progress"); renderProgressScreen(); }
    else if (where === "course") { show("course"); renderCourse(); }
    else if (where === "studyroom") { show("studyroom"); renderStudyRoom(); }
    else if (where === "room" && window.Rooms) { window.Rooms.show(); }
    else goHome();
  }
  const makeScene = () => $("#scene-template").content.firstElementChild.cloneNode(true);

  // ───────────────────────── title screen ─────────────────────────
  function renderTitle() {
    show("start");
    const hero = $("#hero-scene");
    if (!hero.firstChild) {
      const sc = makeScene();
      sc.classList.add("is-cozy");
      sc.style.setProperty("--heat", "58");
      hero.appendChild(sc);
    }
    const fresh = window.Onboarding ? window.Onboarding.shouldOfferSite() : !store.get(KEYS.toured, false);
    $("#title-note").dataset.i18n = fresh ? "start.noteNew" : "start.noteBack";
    $("#title-note").textContent = tr(fresh ? "start.noteNew" : "start.noteBack");
  }

  // ───────────────────────── session timing ─────────────────────────
  // elapsed = seconds of test time used. The clock runs while the test is open or
  // closed without pausing (like a real exam); it stops only while paused.
  function normalizeSession(s) {
    if (!s) return s;
    if (typeof s.elapsed !== "number") { s.elapsed = (Date.now() - s.startedAt) / 1000; s.lastActive = Date.now(); }
    if (!s.lastActive) s.lastActive = Date.now();
    s.pauses = s.pauses || 0;
    return s;
  }
  function timeLeftOf(s) {
    if (s.group && s.group.scheduled) return durOf(s) - (Date.now() - s.group.start) / 1000;
    const away = s.paused ? 0 : (Date.now() - s.lastActive) / 1000;
    return durOf(s) - s.elapsed - away;
  }
  const savedSession = () => normalizeSession(store.get(KEYS.session, null));

  // ───────────────────────── Basecamp ─────────────────────────
  function goHome() {
    stopGuided();
    show("home");
    renderHome();
  }

  // ───────── quadratics evidence, summarised for the dashboard (all from real records) ─────────
  const quadConcepts = () => window.Concepts.CONCEPTS.filter((c) => c.unit === "quadratics");
  const conceptTitle = (c) => { const L = window.I18N ? window.I18N.lang : "en"; return (L !== "en" && c.tr && c.tr[L] && c.tr[L].title) || c.title; };
  const TOPIC_GROUPS = [
    ["Quadratic basics", ["quad.basics", "quad.direction"]],
    ["Vertex & axis", ["quad.vertex_form", "quad.axis", "quad.standard_vertex", "quad.complete_square"]],
    ["Graphing", ["quad.transform", "quad.graph_read", "quad.sketch", "quad.equation_from"]],
    ["Intercepts & roots", ["quad.intercepts", "quad.factored_form", "quad.formula", "quad.discriminant"]],
    ["Applications", ["quad.applications"]],
  ];
  function quadSummary(L) {
    const qs = quadConcepts();
    const seen = qs.filter((c) => L.prof[c.id].accuracy !== null);
    const overall = seen.length ? Math.round((seen.reduce((a, c) => a + L.prof[c.id].accuracy, 0) / seen.length) * 100) : null;
    const confident = qs.filter((c) => L.prof[c.id].status === "confident").length;
    const groups = TOPIC_GROUPS.map(([name, ids]) => { const ps = ids.map((id) => L.prof[id]).filter((p) => p && p.accuracy !== null); return { name, pct: ps.length ? Math.round((ps.reduce((a, p) => a + p.accuracy, 0) / ps.length) * 100) : null }; });
    const answers = L.records.filter((r) => (r.concepts || []).some((c) => /^quad\./.test(c))).length;
    return { qs, seen, overall, confident, groups, answers };
  }
  // consecutive days with any test or practice answer, ending today (or yesterday: still alive)
  function streakInfo() {
    const days = new Set([...getHistory().map((a) => a.date), ...store.get(KEYS.practice, []).map((p) => p.date)].map((d) => new Date(d).toDateString()));
    const day = (k) => { const d = new Date(); d.setDate(d.getDate() - k); return d.toDateString(); };
    const today = days.has(day(0));
    let n = 0;
    for (let k = today ? 0 : 1; days.has(day(k)); k++) n++;
    return { n, today };
  }
  const rel = (ts) => {
    const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
    const rtf = (v, u) => { try { return new Intl.RelativeTimeFormat(locale(), { numeric: "auto", style: "short" }).format(-v, u); } catch { return `${v} ${u} ago`; } };
    return s < 3600 ? rtf(Math.max(1, Math.round(s / 60)), "minute") : s < 86400 ? rtf(Math.round(s / 3600), "hour") : rtf(Math.round(s / 86400), "day");
  };
  function recentActivity(limit = 4) {
    const items = getHistory().map((a) => ({ date: a.date, kind: "test", title: tr("act.test", { mode: levelName(levelOf(a)) }), sub: subjectOf(a) === "quadratics" ? tr("home.topicName") : "Radicals", pct: a.percent, attempt: a.id }));
    const runs = new Map();
    for (const p of store.get(KEYS.practice, [])) { const r = runs.get(p.quiz) || { date: p.date, n: 0, right: 0, concepts: new Set(), source: p.source }; r.date = Math.max(r.date, p.date); r.n++; if (p.correct) r.right++; (p.concepts || []).forEach((c) => r.concepts.add(c)); runs.set(p.quiz, r); }
    for (const r of runs.values()) {
      const c = window.Concepts.get([...r.concepts][0]);
      items.push({ date: r.date, kind: "practice", title: tr("act.practice", { topic: c ? conceptTitle(c) : "" }), sub: `${r.right}/${r.n}`, pct: Math.round((r.right / r.n) * 100), concept: c && c.id });
    }
    return items.sort((a, b) => b.date - a.date).slice(0, limit);
  }
  // goals are measured, never invented: each one shows real progress toward a clear target
  function goalsFor(L, Q) {
    if (!L.records.length) return [];
    const out = [];
    const focus = L.recs.find((r) => /^quad\./.test(r.concept) && r.status !== "confident" && r.status !== "not_attempted") || L.recs.find((r) => /^quad\./.test(r.concept) && r.status !== "confident");
    if (focus) {
      const p = L.prof[focus.concept];
      const checks = [p.questions >= 3 && p.sessions >= 2, p.distinct >= 3, p.accuracy !== null && p.accuracy >= 0.85 && (p.recentAccuracy === null || p.recentAccuracy >= 0.8), p.retrievals >= 1].filter(Boolean).length;
      out.push({ title: tr("goals.master", { concept: conceptTitle(window.Concepts.get(focus.concept)) }), sub: tr("goals.criteria", { done: checks }), pct: Math.round((checks / 4) * 100), lesson: focus.concept });
    }
    out.push({ title: tr("goals.overall"), sub: Q.overall === null ? tr("home.masteryNone") : `${Q.overall}%`, pct: Q.overall === null ? 0 : Math.min(100, Math.round((Q.overall / 80) * 100)) });
    out.push({ title: tr("goals.coverage"), sub: tr("goals.tried", { done: Q.seen.length, total: Q.qs.length }), pct: Math.round((Q.seen.length / Q.qs.length) * 100) });
    return out;
  }
  const ring = (pct, size = 92) => {
    const r = size / 2 - 8, c = 2 * Math.PI * r;
    return `<svg class="ring2" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-track"/>${pct ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fill" style="stroke-dasharray:${(pct / 100) * c} ${c}"/>` : ""}</svg>`;
  };
  const miniRing = (pct) => { const r = 13, c = 2 * Math.PI * r; return `<svg class="ring-mini" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><circle cx="16" cy="16" r="${r}" class="ring-track"/>${pct ? `<circle cx="16" cy="16" r="${r}" class="ring-fill" style="stroke-dasharray:${(pct / 100) * c} ${c}"/>` : ""}</svg>`; };

  function renderHome() {
    const L = learningState();
    const Q = quadSummary(L);
    const prefs = getPrefs();
    const first = !L.records.length && !getHistory().length;
    $("#home-kicker").textContent = tr(first ? "home.kicker.first" : "home.kicker.back");
    $("#home-greeting").textContent = tr(first ? "home.title.first" : "home.title.back");
    const focusRec = L.recs.find((r) => /^quad\./.test(r.concept) && r.status !== "confident");
    $("#home-sub").textContent = first ? tr("home.sub.first") : tr("home.sub.back", { answers: Q.answers, topic: focusRec ? conceptTitle(window.Concepts.get(focusRec.concept)) : tr("home.topicName") });

    // in-progress test
    let saved = savedSession();
    if (saved && saved.items && timeLeftOf(saved) <= 0) { finishExpiredSession(saved); saved = null; }
    const box = $("#resume-box");
    if (saved && saved.items) {
      const answered = saved.items.filter(isAnswered).length;
      const grp = saved.group ? ` · group ${esc(saved.group.code)}` : "";
      box.innerHTML = `
        <div class="resume-card glass ${saved.paused ? "paused" : ""}">
          <div>
            <span class="resume-kicker">${saved.paused ? "⏸ " : ""}${esc(tr("home.resumeTitle"))} · ${esc(levelName(levelOf(saved)))}</span>
            <span class="resume-meta">${esc(tr("home.left", { time: clock(timeLeftOf(saved)), answered, total: saved.items.length }))}${grp}</span>
          </div>
          <div class="resume-actions">
            <button class="btn btn-primary btn-sm" id="btn-resume" type="button">${esc(tr("home.resume"))}</button>
            <button class="btn btn-link btn-sm" id="btn-discard" type="button">${esc(tr("home.discard"))}</button>
          </div>
        </div>`;
      $("#btn-resume").onclick = resumeTest;
      $("#btn-discard").onclick = async () => {
        if (await confirmDialog("Discard this test?", "Your answers on the unfinished test will be deleted. It won't count in your history.", "Discard", "Keep it")) { store.del(KEYS.session); renderHome(); }
      };
    } else box.innerHTML = "";

    // current topic + mastery
    $("#topic-card").innerHTML = `
      <button type="button" class="topic-main" data-lesson="quad.vertex_form">
        <span class="topic-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 26 Q16 -6 28 26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="10" r="2.4" fill="currentColor"/></svg></span>
        <span class="topic-t"><small id="topic-card-h">${esc(tr("home.topic"))}</small><b>${esc(tr("home.topicName"))}</b></span><span class="qi-go" aria-hidden="true">›</span>
      </button>
      <div class="bar bar-lg" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Q.overall || 0}" aria-label="${esc(tr("home.mastery"))}"><div class="bar-fill" style="width:${Q.overall || 0}%"></div></div>
      <div class="topic-foot"><span>${esc(tr("home.mastery"))}</span><b>${Q.overall === null ? esc(tr("home.masteryNone")) : Q.overall + "%"}</b></div>`;

    renderModes();
    // recent activity
    const acts = recentActivity();
    $("#activity").innerHTML = acts.length ? `<ul class="act-list">${acts.map((a) => `
      <li><button type="button" class="act-item" ${a.attempt ? `data-attempt="${esc(a.attempt)}"` : a.concept ? `data-lesson="${a.concept}"` : ""}>
        <span class="act-ico ${a.kind}" aria-hidden="true">${a.kind === "test" ? "✓" : "◎"}</span>
        <span class="act-t"><b>${esc(a.title)}</b><small>${esc(a.sub)}</small></span>
        <span class="act-pct ${a.pct >= 75 ? "good" : a.pct >= 50 ? "mid" : "low"}">${Math.round(a.pct)}%</span>
        <span class="act-when">${esc(rel(a.date))}</span></button></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("act.empty"))}</p>`;
    // goals
    const goals = goalsFor(L, Q);
    $("#goals").innerHTML = goals.length ? `<ul class="goal-list">${goals.map((g) => `
      <li><button type="button" class="goal-item" ${g.lesson ? `data-lesson="${g.lesson}"` : 'data-go="progress"'}>${miniRing(g.pct)}<span class="act-t"><b>${esc(g.title)}</b><small>${esc(g.sub)}</small></span><span class="goal-pct">${g.pct}%</span></button></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("goals.empty"))}</p>`;
    // Studio layout: every quadratics concept at a glance
    $("#studio-concepts").innerHTML = `<h2 class="panel-title">${esc(tr("nav.concepts"))}</h2><ul class="concept-dots">${Q.qs.map((c) => { const p = L.prof[c.id]; const stt = window.Learning.STATUS[p.status]; return `<li><button type="button" data-lesson="${c.id}"><i class="dot-st st-${stt.tone}" aria-hidden="true"></i>${esc(conceptTitle(c))}<span class="cd-p">${p.accuracy === null ? "—" : Math.round(p.accuracy * 100) + "%"}</span></button></li>`; }).join("")}</ul>`;
    // stats
    const st = streakInfo();
    $("#stats-panel").innerHTML = `
      <div class="panel-head sm"><h2 id="stats-h">${esc(tr("stats.title"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="progress">${esc(tr("act.viewAll"))}</button></div>
      <div class="stats-body">
        <div class="ring-wrap">${ring(Q.overall)}<span class="ring-v"><b>${Q.overall === null ? "—" : Q.overall + "%"}</b><small>${esc(tr("stats.overall"))}</small></span></div>
        <ul class="topic-bars">${Q.groups.map((g) => `<li><span class="tb-name">${esc(g.name)}</span><span class="tb-v">${g.pct === null ? "—" : g.pct + "%"}</span><span class="bar"><span class="bar-fill" style="width:${g.pct || 0}%"></span></span></li>`).join("")}</ul>
      </div>
      ${st.n ? `<div class="streak"><span class="streak-ico" aria-hidden="true">🔥</span><span><b>${esc(tr("stats.streak", { n: st.n }))}</b><small>${esc(tr(st.today ? "stats.streakToday" : "stats.streakKeep"))}</small></span></div>` : ""}`;
    if (getUI().layout === "studioplus") renderStudioPlus(L, saved); else $("#splus").innerHTML = "";
  }

  // ───────── Studio+ : a full-viewport workspace built only from what is really recorded on this device ─────────
  const SP_PRACTICE_MODES = ["simple", "normal", "challenge"];
  function spUnitOfConcept(cid) { const s = window.Curriculum ? window.Curriculum.subsForConcept(cid)[0] : null; return s ? s.split(".")[0] : null; }
  function studioPlusData(L) {
    const practice = store.get(KEYS.practice, []), hist = getHistory();
    const R = L.records;
    const sum = (xs, k) => xs.reduce((a, r) => a + (r[k] || 0), 0);
    const acc = sum(R, "max") ? Math.round((sum(R, "earned") / sum(R, "max")) * 100) : null;
    // sessions: one test attempt or one practice run each, in time order
    const bySession = new Map();
    for (const r of R) { const k = r.session || r.attempt || r.quiz; if (!k) continue; const b = bySession.get(k) || { date: 0, earned: 0, max: 0, source: r.source }; b.date = Math.max(b.date, r.date); b.earned += r.earned; b.max += r.max; bySession.set(k, b); }
    const sessions = [...bySession.values()].filter((b) => b.max).sort((a, b) => a.date - b.date).slice(-12);
    const tried = Object.values(L.prof).filter((p) => p.questions >= 3 && p.accuracy !== null);
    const strongest = tried.slice().sort((a, b) => b.accuracy - a.accuracy || b.questions - a.questions).filter((p) => p.accuracy >= 0.7).slice(0, 3);
    const weakest = tried.slice().sort((a, b) => a.accuracy - b.accuracy || b.questions - a.questions).filter((p) => p.accuracy < 0.8).slice(0, 4);
    const stale = Object.values(L.prof).filter((p) => p.daysSince !== null && p.daysSince >= 7).sort((a, b) => b.daysSince - a.daysSince).slice(0, 4);
    const errs = {};
    for (const m of L.mistakes.filter((m) => !m.fixed && !m.understood)) errs[m.category] = (errs[m.category] || 0) + 1;
    // curriculum: coverage (subtopics with any answer) is kept apart from accuracy (marks in that unit)
    const subSt = subStats(), cov = window.Curriculum ? window.Curriculum.coverage() : [];
    const unitAcc = {};
    for (const p of Object.values(L.prof)) { const u = spUnitOfConcept(p.id); if (!u || !p.max) continue; const a = unitAcc[u] || (unitAcc[u] = { e: 0, m: 0 }); a.e += p.earned; a.m += p.max; }
    for (const r of practice) if (r.sub && r.level === "challenge") { /* challenge answers are shown in history, not in unit accuracy (same rule as mastery) */ }
    const units = window.Curriculum ? window.Curriculum.UNITS.map((u) => {
      const rows = cov.filter((c) => c.unit === u.id);
      return { id: u.id, title: u.title, total: rows.length, practised: rows.filter((c) => subSt[c.id]).length, modes: rows, acc: unitAcc[u.id] && unitAcc[u.id].m ? Math.round((unitAcc[u.id].e / unitAcc[u.id].m) * 100) : null };
    }) : [];
    // history: real tests and real practice runs (grouped by run id)
    const runs = new Map();
    for (const p of practice) {
      const r = runs.get(p.quiz) || { date: 0, n: 0, right: 0, subs: new Set(), concepts: new Set(), mode: p.mode || p.level, source: p.source };
      r.date = Math.max(r.date, p.date); r.n++; if (p.correct) r.right++; if (p.sub) r.subs.add(p.sub); (p.concepts || []).forEach((c) => r.concepts.add(c)); runs.set(p.quiz, r);
    }
    const items = [
      ...hist.map((a) => ({ kind: "test", date: a.date, title: tr("sp.test", { mode: levelName(levelOf(a)) }), sub: tr("sp.qs", { n: (a.items || []).length }), pct: Math.round(a.percent), attempt: a.id })),
      ...[...runs.values()].map((r) => {
        const subs = [...r.subs], c = window.Concepts.get([...r.concepts][0]);
        const units = [...new Set(subs.map((s) => s.split(".")[0]))];
        const title = subs.length === 1 && window.Curriculum.get(subs[0]) ? window.Curriculum.get(subs[0]).title : units.length === 1 ? window.Curriculum.UNITS.find((u) => u.id === units[0]).title : units.length > 1 ? tr("course.full") : c ? conceptTitle(c) : tr("nav.practice");
        return { kind: "practice", date: r.date, title, sub: `${r.right}/${r.n}${r.mode ? " · " + (["simple", "normal", "challenge"].includes(r.mode) ? tr("mode." + r.mode) : r.mode) : ""}`, pct: Math.round((r.right / r.n) * 100), concept: c && c.id };
      }),
    ].sort((a, b) => b.date - a.date).slice(0, 10);
    const due = L.dueConcepts.slice(0, 4);
    const dueIds = new Set(due.map((p) => p.id));
    const nexts = L.recs.filter((r) => r.status !== "confident" && !dueIds.has(r.concept)).slice(0, 3);
    const coveredSubs = cov.filter((c) => subSt[c.id]).length;
    return { dueCount: L.dueConcepts.length, acc, sessions, strongest, weakest, stale, errs, units, items, due, nexts, coveredSubs, totalSubs: cov.length, tests: hist.length, answers: R.length, streak: streakInfo(), dueMistakes: L.dueMistakes.length, openMistakes: L.mistakes.filter((m) => !m.fixed && !m.understood).length };
  }
  function spDrillBtn(cid, mode, label) {
    const ok = SP_PRACTICE_MODES.includes(mode) && conceptHasMode(cid, mode);
    return `<button type="button" class="btn btn-sm ${ok ? "btn-secondary" : "btn-quiet"}" data-sp-drill="${cid}" ${ok ? "" : `disabled title="${esc(tr("sp.noLevel", { mode: tr("mode." + mode) }))}"`}>${esc(label || tr("sp.practise"))}</button>`;
  }
  function renderStudioPlus(L, saved) {
    const D = studioPlusData(L), mode = selectedMode(), CU = window.Curriculum;
    const empty = !D.answers;
    const metric = (v, k, d) => `<div class="sp-metric${v === null || v === "—" ? " none" : ""}"${d ? ` title="${esc(tr(d))}"` : ""}><b>${v === null ? "—" : esc(String(v))}</b><span>${esc(tr(k))}</span></div>`;
    const pctCls = (x) => (x >= 75 ? "good" : x >= 50 ? "mid" : "low");
    const trend = D.sessions.length ? `<div class="sp-trend" role="img" aria-label="${esc(tr("sp.trend", { n: D.sessions.length }))}: ${D.sessions.map((s) => Math.round((s.earned / s.max) * 100) + "%").join(", ")}">${D.sessions.map((s) => { const pc = Math.round((s.earned / s.max) * 100); return `<span class="sp-bar ${pctCls(pc)}" style="height:${Math.max(4, pc)}%" title="${pc}% · ${esc(niceDate(s.date))}"></span>`; }).join("")}</div>` : "";
    const plist = (ps, empt) => ps.length ? `<ul class="sp-list">${ps.map((p) => `<li><button type="button" class="sp-link" data-lesson="${p.id}">${esc(conceptTitle(window.Concepts.get(p.id)))}</button><span class="sp-pct ${pctCls(p.accuracy * 100)}">${Math.round(p.accuracy * 100)}%</span><small class="faint">${p.questions}</small></li>`).join("")}</ul>` : `<p class="empty-note">${esc(empt)}</p>`;
    const weakList = D.weakest.length ? `<ul class="sp-list">${D.weakest.map((p) => `<li><button type="button" class="sp-link" data-lesson="${p.id}">${esc(conceptTitle(window.Concepts.get(p.id)))}</button><span class="sp-pct ${pctCls(p.accuracy * 100)}">${Math.round(p.accuracy * 100)}%</span>${spDrillBtn(p.id, mode)}</li>`).join("")}</ul>` : `<p class="empty-note">—</p>`;
    const errRows = Object.entries(D.errs).sort((a, b) => b[1] - a[1]);
    const diag = empty ? `<p class="empty-note">${esc(tr("sp.diag.empty"))}</p>` : `
      <div class="sp-sec"><h3>${esc(tr("sp.trend", { n: D.sessions.length }))}</h3>${trend}<p class="faint small">${esc(tr("sp.trend.d"))}</p></div>
      <div class="sp-two"><div class="sp-sec"><h3>${esc(tr("sp.weak"))}</h3>${weakList}</div><div class="sp-sec"><h3>${esc(tr("sp.strong"))}</h3>${plist(D.strongest, "—")}</div></div>
      <p class="faint small">${esc(tr("sp.minQ"))}</p>
      <div class="sp-two"><div class="sp-sec"><h3>${esc(tr("sp.errors"))}</h3>${errRows.length ? `<ul class="sp-list">${errRows.map(([k, n]) => `<li><span>${esc(window.Learning.CATEGORIES[k] || k)}</span><b class="sp-num">${n}</b></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("sp.errors.none"))}</p>`}</div>
        <div class="sp-sec"><h3>${esc(tr("sp.stale"))}</h3>${D.stale.length ? `<ul class="sp-list">${D.stale.map((p) => `<li><button type="button" class="sp-link" data-lesson="${p.id}">${esc(conceptTitle(window.Concepts.get(p.id)))}</button><small class="faint">${esc(tr("sp.days", { n: p.daysSince }))}</small></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("sp.stale.none"))}</p>`}</div></div>`;
    const weakest = D.weakest[0] || (L.recs.find((r) => r.status !== "not_attempted" && r.status !== "confident") ? L.prof[L.recs.find((r) => r.status !== "not_attempted" && r.status !== "confident").concept] : null);
    const unitSel = getPrefs().spUnit && CU.UNITS.some((u) => u.id === getPrefs().spUnit) ? getPrefs().spUnit : "F";
    const unitSubs = CU.SUBS.filter((s) => s.id.startsWith(unitSel + "."));
    const topicOK = SP_PRACTICE_MODES.includes(mode);
    const covMap = new Map(CU.coverage().map((c) => [c.id, c]));
    const launch = `
      <span class="field-label" id="sp-level-l">${esc(tr("sp.level"))}</span>
      <div class="segmented sp-levels" role="radiogroup" aria-labelledby="sp-level-l">${MODES.map((m) => `<button type="button" role="radio" data-sp-mode="${m}" aria-checked="${m === mode}" class="${m === mode ? "active" : ""}">${esc(tr("mode." + m))}</button>`).join("")}</div>
      <div class="sp-launch-row">
        <button type="button" class="btn btn-primary" data-start-mode="${mode}">${esc(tr("mode.start." + mode))}</button>
        ${saved && saved.items ? `<button type="button" class="btn btn-secondary" id="sp-resume">${esc(tr("sp.resume"))}</button>` : ""}
      </div>
      <div class="sp-launch-row">
        ${weakest ? spDrillBtn(weakest.id, mode, `${tr("sp.weakest")}: ${conceptTitle(window.Concepts.get(weakest.id))}`) : ""}
        <button type="button" class="btn btn-sm btn-secondary" data-go="review">${esc(tr("sp.reviewWrong"))}${D.openMistakes ? ` <span class="sp-count">${D.openMistakes}</span>` : ""}</button>
      </div>
      <div class="sp-launch-row"><span class="faint small">${esc(tr("sp.tests"))}:</span>${["normal", "challenge", "nightmare"].map((m) => `<button type="button" class="btn btn-sm btn-quiet" data-start-mode="${m}">${esc(tr("mode." + m))}</button>`).join("")}</div>
      <div class="sp-topic">
        <label><span>${esc(tr("sp.topic"))}</span><select id="sp-unit" class="text-input">${CU.UNITS.map((u) => `<option value="${u.id}" ${u.id === unitSel ? "selected" : ""}>${u.id} · ${esc(u.title)}</option>`).join("")}<option value="*" ${unitSel === "*" ? "selected" : ""}>${esc(tr("sp.wholeCourse"))}</option></select></label>
        <label><span>${esc(tr("sp.sub"))}</span><select id="sp-sub" class="text-input"><option value="">${esc(tr("sp.allSubs"))}</option>${unitSubs.map((s) => `<option value="${s.id}" ${topicOK && !covMap.get(s.id).modes.includes(mode) ? "disabled" : ""}>${esc(s.title)}</option>`).join("")}</select></label>
        <button type="button" class="btn btn-sm btn-primary" id="sp-go-topic" ${topicOK ? "" : "disabled"}>${esc(tr("sp.practiseTopic"))}</button>
      </div>
      ${topicOK ? "" : `<p class="faint small">${esc(tr("sp.nightmareNote"))}</p>`}`;
    const curric = `<p class="faint small">${esc(tr("sp.curric.criteria"))}</p><ul class="sp-units">${D.units.map((u) => {
      const ready = u.modes.filter((c) => c.modes.includes(mode)).length;
      const pct = u.total ? Math.round((u.practised / u.total) * 100) : 0;
      return `<li><button type="button" class="sp-unit" data-sp-unit="${u.id}"><span class="cu-letter">${u.id}</span><span class="sp-ut"><b>${esc(u.title)}</b><small>${esc(tr("sp.practised", { n: u.practised, total: u.total }))}${topicOK ? " · " + esc(tr("sp.ready", { n: ready })) : ""}</small></span>
        <span class="bar" role="meter" aria-valuemin="0" aria-valuemax="${u.total}" aria-valuenow="${u.practised}" aria-label="${esc(tr("sp.practised", { n: u.practised, total: u.total }))}"><span class="bar-fill" style="width:${pct}%"></span></span>
        <span class="sp-pct ${u.acc === null ? "" : pctCls(u.acc)}">${u.acc === null ? "—" : u.acc + "%"}</span></button></li>`;
    }).join("")}</ul>`;
    const histH = D.items.length ? `<ul class="act-list sp-hist">${D.items.map((a) => `<li><button type="button" class="act-item" ${a.attempt ? `data-attempt="${esc(a.attempt)}"` : a.concept ? `data-lesson="${a.concept}"` : ""}>
        <span class="act-ico ${a.kind}" aria-hidden="true">${a.kind === "test" ? "✓" : "◎"}</span><span class="act-t"><b>${esc(a.title)}</b><small>${esc(a.sub)}</small></span>
        <span class="act-pct ${pctCls(a.pct)}">${a.pct}%</span><span class="act-when">${esc(rel(a.date))}</span></button></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("sp.hist.empty"))}</p>`;
    const queue = (D.due.length || D.dueMistakes || D.nexts.length) ? `<ul class="sp-queue">
        ${D.dueMistakes ? `<li><span class="sp-q-k">${esc(tr("sp.mistakesDue", { n: D.dueMistakes }))}</span><button type="button" class="btn btn-sm btn-secondary" data-go="review">${esc(tr("prac.tab.review"))}</button></li>` : ""}
        ${D.due.map((p) => `<li><span class="sp-q-k"><b>${esc(conceptTitle(window.Concepts.get(p.id)))}</b><small>${esc(tr("sp.dueReview"))} · ${esc(p.schedule.overdueDays > 0 ? tr("sp.overdue", { n: p.schedule.overdueDays }) : tr("sp.dueToday"))}</small></span>${spDrillBtn(p.id, mode)}</li>`).join("")}
        ${D.nexts.map((r) => `<li><span class="sp-q-k"><b>${esc(conceptTitle(window.Concepts.get(r.concept)))}</b><small>${esc(r.label)} · ${esc([r.why, ...r.extra].filter(Boolean)[0] || "")}</small></span><button type="button" class="btn btn-sm btn-quiet" data-lesson="${r.concept}">${esc(tr("prac.lesson"))}</button>${spDrillBtn(r.concept, mode)}</li>`).join("")}
      </ul><p class="faint small">${esc(tr("sp.queue.note"))}</p>` : `<p class="empty-note">${esc(tr("sp.queue.empty"))}</p><p class="faint small">${esc(tr("sp.queue.note"))}</p>`;
    const tool = (attr, label, ico) => `<button type="button" class="sp-tool" ${attr}><span aria-hidden="true">${ico}</span>${esc(label)}</button>`;
    $("#splus").innerHTML = `
      <header class="sp-top glass">
        <div class="sp-hello"><p class="eyebrow">${esc(tr("sp.kicker"))}</p><h1>${esc($("#home-greeting").textContent)}</h1></div>
        <div class="sp-metrics">
          ${metric(D.answers || null, "sp.m.answers")}${metric(D.acc === null ? null : D.acc + "%", "sp.m.accuracy", "sp.m.accuracy.d")}${metric(D.tests || null, "sp.m.tests")}
          ${metric(D.streak.n || null, "sp.m.streak")}${metric(D.dueCount + D.dueMistakes || null, "sp.m.due")}${metric(`${D.coveredSubs}/${D.totalSubs}`, "sp.m.covered")}
        </div>
        <nav class="sp-tools" aria-label="${esc(tr("sp.tools"))}">
          ${tool('data-sp-tool="calc"', tr("sp.calc"), "▦")}${tool('data-sp-tool="pad"', tr("sp.pad"), "✎")}${tool('data-go="library"', tr("quick.library"), "❒")}${tool('data-go="studyroom"', tr("quick.room"), "◍")}${tool('data-sp-tool="settings"', tr("sp.settings"), "⚙")}${tool('data-sp-tool="lang"', tr("sp.lang"), "文")}${tool('data-onboard="site"', tr("quick.tour"), "?")}
        </nav>
      </header>
      <section class="sp-panel glass sp-diag" aria-labelledby="sp-diag-h"><div class="panel-head sm"><h2 id="sp-diag-h">${esc(tr("sp.diag"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="learning">${esc(tr("prac.tab.plan"))}</button></div><div class="sp-scroll">${diag}</div></section>
      <section class="sp-panel glass sp-launch" aria-labelledby="sp-launch-h"><div class="panel-head sm"><h2 id="sp-launch-h">${esc(tr("sp.launch"))}</h2></div><div class="sp-scroll">${launch}</div></section>
      <section class="sp-panel glass sp-queue-p" aria-labelledby="sp-queue-h"><div class="panel-head sm"><h2 id="sp-queue-h">${esc(tr("sp.queue"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="review">${esc(tr("act.viewAll"))}</button></div><div class="sp-scroll">${queue}</div></section>
      <section class="sp-panel glass sp-curric" aria-labelledby="sp-curric-h"><div class="panel-head sm"><h2 id="sp-curric-h">${esc(tr("sp.curric"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="course">${esc(tr("prac.tab.course"))}</button></div><div class="sp-scroll">${curric}</div></section>
      <section class="sp-panel glass sp-hist-p" aria-labelledby="sp-hist-h"><div class="panel-head sm"><h2 id="sp-hist-h">${esc(tr("sp.hist"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="progress">${esc(tr("act.viewAll"))}</button></div><div class="sp-scroll">${histH}</div></section>`;
    const rs = $("#sp-resume"); if (rs) rs.onclick = resumeTest;
  }
  function spStartTopic() {
    const mode = selectedMode(); if (!SP_PRACTICE_MODES.includes(mode)) return;
    const CU = window.Curriculum, unit = $("#sp-unit").value, sub = $("#sp-sub").value;
    const back = () => goHome();
    if (unit === "*") return runPractice({ subs: CU.SUBS.map((s) => s.id), level: mode, n: 20, title: tr("course.full"), crumb: `${tr("prac.tab.course")} · ${tr("mode." + mode)}`, scope: "mixed", onDone: back });
    if (sub) return runPractice({ subs: [sub], level: mode, n: 6, title: CU.get(sub).title, crumb: `${tr("prac.tab.course")} · ${tr("mode." + mode)}`, onDone: back });
    const u = CU.UNITS.find((x) => x.id === unit);
    return runPractice({ subs: u.subs.map((s) => s.id), level: mode, n: 10, title: u.title, crumb: `${tr("course.mixUnit")} · ${tr("mode." + mode)}`, scope: "mixed", onDone: back });
  }

  // ───────── difficulty carousel + preview (previewing never starts anything) ─────────
  const MODES = ["simple", "normal", "challenge", "nightmare"];
  const MODE_ICON = {
    simple: '<svg viewBox="0 0 24 24"><path d="M12 21V11M12 11c0-4 3-7 7-7 0 4-3 7-7 7zM12 13c0-3.3-2.5-6-6-6 0 3.3 2.5 6 6 6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    normal: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    challenge: '<svg viewBox="0 0 24 24"><path d="M13 3L5 14h6l-1 7 8-11h-6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    nightmare: '<svg viewBox="0 0 24 24"><path d="M12 3c3 4 6 6.5 6 10.5A6 6 0 0 1 6 13.5c0-2 1-3.6 2.4-4.9.2 1.8 1 3 2.2 3.4C10.5 8.4 11 5.6 12 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  };
  let previewSeed = 1;
  // The selected difficulty is whatever the learner chose last; with no choice yet it is Simple, and it is saved the
  // first time it is shown, so it can never drift (it used to switch to Normal once any records existed).
  const selectedMode = () => { const p = getPrefs(); if (MODES.includes(p.mode)) return p.mode; setPrefs({ mode: "simple" }); return "simple"; };
  function recommendedMode(L) { const Q = quadSummary(L); return !L.records.length || Q.overall === null || Q.overall < 60 ? "simple" : Q.overall < 80 ? "normal" : "challenge"; }
  function renderModes() {
    const sel = selectedMode();
    $("#mode-track").innerHTML = MODES.map((m) => `
      <div class="mode-card m-${m}${m === sel ? " active" : ""}" role="radio" aria-checked="${m === sel}" tabindex="${m === sel ? 0 : -1}" data-mode="${m}" aria-label="${esc(tr("mode." + m))}: ${esc(tr("mode." + m + ".tag"))}">
        <span class="mode-ico" aria-hidden="true">${MODE_ICON[m]}</span>
        <b class="mode-name">${esc(tr("mode." + m))}</b>
        <span class="mode-tag">${esc(tr("mode." + m + ".tag"))}</span>
        <span class="mode-desc">${esc(tr("mode." + m + ".d"))}</span>
        <span class="mode-sel">${m === sel ? `✓ ${esc(tr("mode.selected"))}` : esc(tr("mode.preview"))}</span>
      </div>`).join("");
    renderPreview();
  }
  function selectMode(m, focus) {
    if (!MODES.includes(m)) return;
    setPrefs({ mode: m });
    previewSeed = 1;
    renderModes();
    const card = $(`#mode-track [data-mode="${m}"]`);
    if (card) { card.scrollIntoView({ block: "nearest", inline: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); if (focus) card.focus(); }
  }
  function previewExample(m) {
    const QB = window.QuadBank; if (!QB) return null;
    const rnd = window.Group.rng(previewSeed * 7919 + MODES.indexOf(m));
    try {
      if (m === "nightmare") { const st = QB.buildNightmare(rnd); return { stem: st[0].intro, tags: st.map((x) => x.title.replace(/^Stage (\d) · /, "$1 · ")) }; }
      const pickF = { simple: ["vform", "mc"], normal: ["vstd", "mc"], challenge: ["cts", "mc"] }[m];
      const q = QB.generate(pickF[0], pickF[1], m, rnd);
      return { stem: q.q, tags: [q.topic, q.meta.subtopic] };
    } catch { return null; }
  }
  // concepts that really have questions at a level (no level substitution anywhere)
  const conceptHasMode = (cid, m) => window.Bank.FAMILIES.some((F) => !F.id.startsWith("nm") && F.concepts.includes(cid) && F.modes.includes(m));
  const simpleConcepts = () => quadConcepts().filter((c) => conceptHasMode(c.id, "simple"));
  function simpleSkill(L) {
    const p = getPrefs();
    if (p.simpleSkill && window.Concepts.get(p.simpleSkill) && conceptHasMode(p.simpleSkill, "simple")) return p.simpleSkill;
    const order = simpleConcepts().map((c) => c.id);
    return order.find((id) => L.prof[id].status === "not_attempted" || L.prof[id].status === "needs_work" || L.prof[id].status === "early_warning") || order[0];
  }
  function renderPreview() {
    const m = selectedMode(), L = learningState();
    const ex = previewExample(m);
    const rec = recommendedMode(L) === m;
    const skill = simpleSkill(L);
    $("#mode-preview").className = `mode-preview p-${m}`;
    $("#mode-preview").innerHTML = `
      <div class="mp-left">
        <div class="mp-head"><span class="mode-ico" aria-hidden="true">${MODE_ICON[m]}</span><div><h3>${esc(tr("mode.previewTitle", { mode: tr("mode." + m) }))}${rec ? ` <span class="rec-pill">${esc(tr("mode.recommended"))}</span>` : ""}</h3><p>${esc(tr("mode." + m + ".d"))}</p></div></div>
        <ul class="mp-chips">${[1, 2, 3].map((k) => `<li>${esc(tr(`mode.f.${m}${k}`))}</li>`).join("")}</ul>
        ${m === "simple" ? `<label class="mp-skill"><span>${esc(tr("mode.simpleTopic"))}</span><select id="simple-skill" class="text-input">${simpleConcepts().map((c) => `<option value="${c.id}" ${c.id === skill ? "selected" : ""}>${esc(conceptTitle(c))}</option>`).join("")}</select></label>` : ""}
        <div class="mp-actions">
          <button type="button" class="btn btn-primary" id="btn-start" data-start-mode="${m}">${esc(tr("mode.start." + m))}</button>
          ${m !== "simple" ? `<button type="button" class="btn btn-secondary" id="btn-create" data-setup-mode="${m}">${esc(tr("mode.options"))}</button>` : ""}
        </div>
        ${m !== "simple" ? `<button type="button" class="btn btn-link btn-sm mp-howto" data-onboard="test">${esc(tr("onboard.testNudge"))}</button>` : ""}
      </div>
      <div class="mp-example">
        <div class="mp-ex-head"><span class="kicker">${esc(tr("mode.example"))}</span><button type="button" class="btn btn-link btn-sm" id="btn-new-example">${esc(tr("mode.newExample"))}</button></div>
        <div class="mp-ex-q">${ex ? renderMath(ex.stem) : ""}</div>
        ${ex ? `<div class="mp-tags">${ex.tags.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
      </div>`;
  }
  async function startMode(m) {
    if (m === "simple") return startGuided(($("#simple-skill") || {}).value || simpleSkill(learningState()));
    if (savedSession() && !(await confirmDialog("Start over?", "You have an unfinished test. Starting a new one will discard it.", "Start new test", "Cancel"))) return;
    store.del(KEYS.session);
    setPrefs({ level: m });
    startTest({ level: m });
  }

  // ───────── guided practice (Simple) and skill drills share the practice runner ─────────
  const HINT_POLICY = { simple: "steps", normal: "steps", challenge: "one", nightmare: "none" };
  // Difficulty is exactly the one chosen: the engine never substitutes another mode, and nothing here depends on
  // streaks, mastery or how much has been practised (that only affects which TOPICS are suggested, never how hard).
  function runPractice({ conceptId, subs, level, n, title, crumb, onDone, scope }) {
    const got = window.Bank.select({ concept: subs ? undefined : conceptId, subs: subs || undefined, mode: level, n, missed: scope === "mixed" ? missedSubs() : undefined });
    if (got.unavailable || !got.items.length) {
      confirmDialog(tr("prac.unavailTitle"), esc(tr("prac.unavail", { mode: tr("mode." + level) })), tr("common.ok"), tr("common.close"));
      return;
    }
    const items = got.items.map(({ kind, q, part }) => { BANKS[kind].set(q.id, q); return window.Practice.makeItem(kind, q, part || undefined); }).filter(Boolean);
    if (!items.length) return;
    show("practice");
    $("#prac-body").hidden = true;
    const box = $("#prac-run");
    box.hidden = false;
    window.Practice.run(box, {
      source: level === "simple" ? "guided" : "drill", level: level === "challenge" ? "challenge" : "normal", hintPolicy: HINT_POLICY[level],
      crumb, title, items, exitLabel: tr("common.close"),
      onExit: () => { stopGuided(); if (onDone) onDone(); else { renderDrills(); } },
      onAct: (act) => { if (act === "again") runPractice({ conceptId, subs, level, n, title, crumb, onDone, scope }); },
      end: (r) => {
        const sm = window.Practice.summary(r);
        const p = conceptId ? learningState().prof[conceptId] : null, stt = p ? window.Learning.STATUS[p.status] : null;
        const revisitNote = got.revisits ? `<p class="faint small">${esc(tr("prac.revisit", { n: got.revisits }))}</p>` : "";
        if (!p) return `<div class="pr"><p class="eyebrow">${esc(crumb)}</p><h1>${sm.right} / ${sm.n}</h1>${revisitNote}${window.Practice.reviewList(r)}
          <div class="lesson-actions"><button class="btn btn-primary" data-pr="again" type="button">${esc(tr("prac.again"))}</button><button class="btn btn-quiet" data-pr="exit" type="button">${esc(tr("common.close"))}</button></div></div>`;
        return `<div class="pr"><p class="eyebrow">${esc(crumb)}</p><h1>${sm.right} / ${sm.n}</h1>${revisitNote}
          <p class="lead">${sm.right >= Math.ceil(sm.n * 0.8) ? "That's clicking. When you want more of a stretch, choose a higher level yourself — it never changes on its own." : "Worth another round: the misses are saved in your Mistake Notebook."}</p>
          <div class="result-strip"><div><span class="rs-k">Status now</span><span class="level-pill st-${stt.tone}">${esc(stt.label)}</span></div><div><span class="rs-k">Next review</span><span class="rs-v small">${esc(window.Learning.scheduleText(p.schedule))}</span></div></div>
          ${window.Practice.reviewList(r)}
          <div class="lesson-actions"><button class="btn btn-primary" data-pr="again" type="button">Another round</button><button class="btn btn-secondary" data-lesson="${conceptId}" type="button">${esc(tr("prac.lesson"))}</button><button class="btn btn-quiet" data-pr="exit" type="button">${esc(tr("common.close"))}</button></div></div>`;
      },
    });
  }
  function missedSubs() {
    const out = new Set(), C = window.Curriculum; if (!C) return out;
    const recent = store.get(KEYS.practice, []).filter((p) => !p.correct && Date.now() - p.date < 14 * 86400000);
    for (const p of recent) for (const c of p.concepts || []) for (const sid of C.subsForConcept(c)) out.add(sid);
    return out;
  }
  function startGuided(conceptId) {
    const c = window.Concepts.get(conceptId); if (!c) return;
    setPrefs({ simpleSkill: conceptId });
    runPractice({ conceptId, level: "simple", n: 6, title: conceptTitle(c), crumb: `${tr("mode.simple")} · ${tr("mode.simple.tag")}`, onDone: goHome });
  }
  function stopGuided() {
    const box = $("#prac-run");
    if (!box || box.hidden) return;
    window.Practice.stop(box);
    box.hidden = true; box.innerHTML = "";
    $("#prac-body").hidden = false;
  }
  function renderDrills() {
    const L = learningState(), QB = window.QuadBank;
    const card = (c) => {
      const p = L.prof[c.id], stt = window.Learning.STATUS[p.status];
      const modes = new Set(["simple", "normal", "challenge"].filter((m) => conceptHasMode(c.id, m)));
      const pct = p.accuracy === null ? null : Math.round(p.accuracy * 100);
      return `<article class="drill glass">
        <header><span class="level-pill st-${stt.tone}">${esc(stt.label)}</span><span class="drill-pct">${pct === null ? "" : pct + "%"}</span></header>
        <h3>${esc(conceptTitle(c))}</h3>
        <p class="small muted">${renderMath((window.I18N && window.I18N.lang !== "en" && c.tr && c.tr[window.I18N.lang]) ? esc(c.tr[window.I18N.lang].summary) : c.summary)}</p>
        <div class="drill-actions">${["simple", "normal", "challenge"].map((m) => `<button type="button" class="btn btn-sm ${m === "normal" ? "btn-primary" : "btn-secondary"}" data-drill="${c.id}" data-level="${m}" ${modes.has(m) ? "" : `disabled title="${esc(tr("course.noLevel", { mode: tr("mode." + m) }))}"`}>${esc(tr("mode." + m))}</button>`).join("")}<button type="button" class="btn btn-link btn-sm" data-lesson="${c.id}">${esc(tr("prac.lesson"))}</button></div>
      </article>`;
    };
    $("#drills").innerHTML = `
      <section class="tests-row glass panel" aria-labelledby="tests-h"><div class="panel-head sm"><h2 id="tests-h">${esc(tr("prac.tests"))}</h2><button type="button" class="btn btn-link btn-sm" data-onboard="test">${esc(tr("onboard.testNudge"))}</button></div>
        <div class="tests-btns">${["normal", "challenge", "nightmare"].map((m) => `<button type="button" class="test-tile m-${m}" data-start-mode="${m}"><span class="mode-ico" aria-hidden="true">${MODE_ICON[m]}</span><span><b>${esc(tr("mode." + m))}</b><small>${esc(tr("mode." + m + ".tag"))}</small></span></button>`).join("")}</div>
      </section>
      ${TOPIC_GROUPS.map(([name, ids]) => `<section class="drill-group"><h2 class="sub-h">${esc(name)}</h2><div class="drill-grid">${ids.map((id) => card(window.Concepts.get(id))).join("")}</div></section>`).join("")}
      <p class="faint small">${esc(tr("prac.legacy"))} · ${esc(tr("prac.drill"))}</p>`;
  }
  // ───────── the whole course: BC Pre-Calc 11 units → subtopics, fixed difficulty, honest coverage ─────────
  const COURSE_MODES = ["simple", "normal", "challenge"];
  const courseMode = () => { const m = getPrefs().courseMode; return COURSE_MODES.includes(m) ? m : "normal"; };
  function subStats() {
    const by = {};
    for (const p of store.get(KEYS.practice, [])) { if (!p.sub) continue; const b = by[p.sub] || (by[p.sub] = { n: 0, right: 0, last: 0 }); b.n++; if (p.correct) b.right++; b.last = Math.max(b.last, p.date); }
    return by;
  }
  function renderCourse() {
    const CU = window.Curriculum; if (!CU) return;
    const mode = courseMode(), cov = CU.coverage(), st = subStats();
    const impl = cov.filter((c) => c.implemented).length, withLessons = cov.filter((c) => c.lessons.length).length;
    const open = getPrefs().courseOpen || "F";
    const unitBlock = (u) => {
      const rows = cov.filter((c) => c.unit === u.id);
      const ok = rows.filter((c) => c.modes.includes(mode));
      return `<details class="course-unit glass" data-unit="${u.id}" ${open === u.id ? "open" : ""}>
        <summary><span class="cu-letter">${u.id}</span><span class="cu-title">${esc(u.title)}</span><span class="cu-meta">${esc(tr("course.unitMeta", { n: rows.length, ready: ok.length }))}</span></summary>
        <div class="cu-actions"><button type="button" class="btn btn-secondary btn-sm" data-course-mix="${u.id}" ${ok.length ? "" : "disabled"}>${esc(tr("course.mixUnit"))}</button></div>
        <ul class="sub-list">${rows.map((c) => {
          const s = st[c.id], has = c.modes.includes(mode);
          const status = c.status === "missing" ? `<span class="chip chip-missing">${esc(tr("course.missing"))}</span>` : c.status === "partial" ? `<span class="chip chip-partial" title="${esc(tr("course.levels", { modes: c.modes.map((m) => tr("mode." + m)).join(", ") }))}">${esc(tr("course.partial"))}</span>` : "";
          const mine = s ? `<span class="sub-mine">${esc(tr("course.mine", { right: s.right, n: s.n }))} · ${esc(rel(s.last))}</span>` : `<span class="sub-mine faint">${esc(tr("course.notYet"))}</span>`;
          const lesson = c.lessons[0];
          return `<li class="sub-row"><span class="sub-t"><b>${esc(c.title)}</b>${status}</span>${mine}
            <span class="sub-act">${lesson ? `<button type="button" class="btn btn-link btn-sm" data-lesson="${lesson}">${esc(tr("prac.lesson"))}</button>` : ""}<button type="button" class="btn btn-sm ${has ? "btn-primary" : "btn-secondary"}" data-course-sub="${c.id}" ${has ? "" : `disabled title="${esc(tr("course.noLevel", { mode: tr("mode." + mode) }))}"`}>${esc(tr("course.practise"))}</button></span></li>`;
        }).join("")}</ul></details>`;
    };
    $("#course-body").innerHTML = `
      <section class="glass panel course-top">
        <div class="ct-left"><span class="field-label" id="course-mode-l">${esc(tr("course.level"))}</span>
          <div class="segmented" role="radiogroup" aria-labelledby="course-mode-l" id="course-mode">${COURSE_MODES.map((m) => `<button type="button" role="radio" data-course-mode="${m}" aria-checked="${m === mode}" class="${m === mode ? "active" : ""}">${esc(tr("mode." + m))}</button>`).join("")}</div>
          <p class="faint small">${esc(tr("course.fixed"))}</p></div>
        <div class="ct-right"><button type="button" class="btn btn-primary" data-course-all="1">${esc(tr("course.full"))}</button>
          <p class="faint small">${esc(tr("course.coverage", { impl, total: cov.length, lessons: withLessons }))} <a href="${window.Curriculum.SOURCE}" target="_blank" rel="noopener">${esc(tr("course.source"))}</a></p></div>
      </section>
      ${CU.UNITS.map(unitBlock).join("")}`;
  }
  function startCourse({ sub, unit, all }) {
    const CU = window.Curriculum, mode = courseMode();
    if (sub) { const c = CU.get(sub); return runPractice({ subs: [sub], level: mode, n: 6, title: c.title, crumb: `${tr("prac.tab.course")} · ${tr("mode." + mode)}`, onDone: () => navigate("course") }); }
    if (unit) { const u = CU.UNITS.find((x) => x.id === unit); return runPractice({ subs: u.subs.map((s) => s.id), level: mode, n: 10, title: u.title, crumb: `${tr("course.mixUnit")} · ${tr("mode." + mode)}`, scope: "mixed", onDone: () => navigate("course") }); }
    if (all) return runPractice({ subs: CU.SUBS.map((s) => s.id), level: mode, n: 20, title: tr("course.full"), crumb: `${tr("prac.tab.course")} · ${tr("mode." + mode)}`, scope: "mixed", onDone: () => navigate("course") });
  }
  function startDrill(conceptId, level, onDone) {
    const c = window.Concepts.get(conceptId); if (!c) return;
    runPractice({ conceptId, level, n: 5, title: conceptTitle(c), crumb: `${tr("prac.kicker")} · ${tr("mode." + level)}`, onDone });
  }

  // ───────── progress (tests, mastery, habits) ─────────
  function renderProgressScreen() {
    const history = getHistory();
    const prefs = getPrefs();
    const lv = TEST_LEVELS.includes(prefs.level) ? prefs.level : "normal";
    const analyze = (h) => window.Insights.analyze(h, qOf, (it) => gradeItem(it).parts);
    const quad = history.filter((a) => subjectOf(a) === "quadratics");
    const core = analyze(quad.filter((a) => !isHard(levelOf(a))));
    const atLevel = analyze(quad.filter((a) => levelOf(a) === lv));
    const all = analyze(quad);
    for (const b of $$("#level-pick button")) { const on = b.dataset.level === lv; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); b.textContent = levelName(b.dataset.level); }
    const ln = levelName(lv);
    $("#home-stats").innerHTML = `
      <div class="tile${all.count ? "" : " empty-tile"}"><span class="tile-value">${all.count || "—"}</span><span class="tile-label">tests taken</span></div>
      <div class="tile${atLevel.count ? "" : " empty-tile"}"><span class="tile-value">${atLevel.count ? atLevel.best.percent + "%" : "—"}</span><span class="tile-label">${esc(ln)} best</span></div>
      <div class="tile${atLevel.count ? "" : " empty-tile"}"><span class="tile-value">${atLevel.count ? atLevel.recentAvg + "%" : "—"}</span><span class="tile-label">${esc(ln)} average${atLevel.count ? `, last ${Math.min(5, atLevel.count)}` : ""}</span></div>
      <div class="tile${all.count ? "" : " empty-tile"}"><span class="tile-value">${all.count ? hoursMins(all.studySeconds) : "—"}</span><span class="tile-label">time practising</span></div>`;
    renderTrend(atLevel, ln);
    renderFocus();
    renderHabits(core);
    renderHistory(history);
    renderMastery();
  }

  // ───────── Study Room landing ─────────
  function renderStudyRoom() {
    const s = store.get(KEYS.room, null);
    const r = s && window.Group.decodeRoom(s.code);
    $("#room-resume-box").innerHTML = r ? `<button class="btn btn-secondary btn-block" type="button" data-go="room">${esc(tr("room.resume"))} · ${esc(r.code)}</button>` : "";
  }

  // Score trend: one series, 0–100% scale, best and latest labelled, hover tooltip.
  function renderTrend(ins, levelName = "Normal") {
    const el = $("#trend");
    const pts = ins.trend;
    if (!pts.length) {
      el.innerHTML = `<div class="trend-empty"><svg viewBox="0 0 600 150" aria-hidden="true"><path d="M20 120 C 140 110, 220 80, 320 74 S 500 40, 580 30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 7"/></svg><p>Your ${esc(levelName)} score trend appears here after your first ${esc(levelName)} test.</p></div>`;
      return;
    }
    const W = 600, H = 200, L = 40, R = 18, T = 18, B = 30;
    const xs = (k) => pts.length === 1 ? (L + W - R) / 2 : L + (k * (W - L - R)) / (pts.length - 1);
    const ys = (v) => T + (1 - v / 100) * (H - T - B);
    const grid = [0, 25, 50, 75, 100].map((v) => `<line x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}" class="tg"/><text x="${L - 8}" y="${ys(v) + 4}" class="tl" text-anchor="end">${v}%</text>`).join("");
    const line = pts.map((p, k) => `${k ? "L" : "M"}${xs(k).toFixed(1)} ${ys(p.pct).toFixed(1)}`).join(" ");
    const area = pts.length > 1 ? `<path d="${line} L${xs(pts.length - 1)} ${ys(0)} L${xs(0)} ${ys(0)} Z" class="ta"/>` : "";
    const bestK = pts.findIndex((p) => p.id === ins.best.id), lastK = pts.length - 1;
    const label = (k, txt, above) => {
      const x = Math.min(W - R - 4, Math.max(L + 4, xs(k)));
      const anchor = x > W - 80 ? "end" : x < L + 60 ? "start" : "middle";
      return `<text x="${x}" y="${ys(pts[k].pct) + (above ? -12 : 20)}" class="tv" text-anchor="${anchor}">${txt}</text>`;
    };
    const labels = [label(bestK, `Best ${pts[bestK].pct}%`, pts[bestK].pct < 90 || true)];
    if (lastK !== bestK) labels.push(label(lastK, `Latest ${pts[lastK].pct}%`, pts[lastK].pct < pts[bestK].pct - 8 ? false : pts[lastK].pct < 15));
    const dots = pts.map((p, k) => `
      <g class="tdot${k === bestK ? " best" : ""}" tabindex="0" data-k="${k}" role="img" aria-label="Test ${k + 1}, ${niceDate(p.date, false)}: ${p.pct}% in ${clock(p.time)}">
        <circle cx="${xs(k)}" cy="${ys(p.pct)}" r="16" class="hit"/>
        <circle cx="${xs(k)}" cy="${ys(p.pct)}" r="${k === bestK ? 6 : 4.5}" class="mark"/>
      </g>`).join("");
    const xl = pts.length > 1 ? `<text x="${xs(0)}" y="${H - 8}" class="tl" text-anchor="start">Test 1</text><text x="${xs(lastK)}" y="${H - 8}" class="tl" text-anchor="end">Test ${pts.length}</text>` : `<text x="${xs(0)}" y="${H - 8}" class="tl" text-anchor="middle">Test 1</text>`;
    el.innerHTML = `
      <div class="trend-head"><span>${esc(levelName)} score by test</span><span class="muted small">${pts.length} test${pts.length > 1 ? "s" : ""}</span></div>
      <div class="trend-wrap">
        <svg viewBox="0 0 ${W} ${H}" class="trend-svg" role="group" aria-label="Score by test">${grid}${area}<path d="${line}" class="tline"/>${dots}${labels.join("")}${xl}</svg>
        <div class="trend-tip" id="trend-tip" hidden></div>
      </div>`;
    const tip = $("#trend-tip"), wrap = $(".trend-wrap", el), svg = $("svg", el);
    const showTip = (g) => {
      const p = pts[Number(g.dataset.k)];
      const c = $(".mark", g).getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      tip.innerHTML = `<b>${p.pct}%</b><span>${esc(niceDate(p.date, false))} · ${clock(p.time)}</span>`;
      tip.hidden = false;
      const x = c.left + c.width / 2 - wr.left, y = c.top - wr.top;
      tip.style.left = `${Math.min(wr.width - tip.offsetWidth / 2 - 4, Math.max(tip.offsetWidth / 2 + 4, x))}px`;
      tip.style.top = `${y - 8}px`;
    };
    for (const g of $$(".tdot", svg)) {
      g.addEventListener("pointerenter", () => showTip(g));
      g.addEventListener("focus", () => showTip(g));
      g.addEventListener("pointerleave", () => { tip.hidden = true; });
      g.addEventListener("blur", () => { tip.hidden = true; });
      g.addEventListener("click", () => { const a = getHistory().find((x) => x.id === pts[Number(g.dataset.k)].id); if (a) showResults(a, false); });
    }
  }

  function renderFocus() {
    const el = $("#focus");
    const L = learningState();
    if (!L.records.length) {
      el.innerHTML = `<p class="empty-note">No learning records yet. Try Simple guided practice or a Normal test, or a concept quiz in the <button class="btn-inline" data-go="library" type="button">Concept Library</button>, and your recommendations will appear here.</p>`;
      return;
    }
    const top = L.recs.filter((r) => r.status !== "not_attempted").slice(0, 3);
    const docs = Object.keys(store.get("campfire-prep.docindex.v1", {})).length;
    el.innerHTML = (top.length ? `<p class="next-action"><b>Next step:</b> ${esc(top[0].title)} — ${top[0].activity === "quiz" ? "take a 5-question quiz" : "read the lesson, then take the quiz"} (about ${top[0].minutes} min, estimate).</p>` + top.map((r, k) => `
      <div class="focus-item ${r.tone}">
        <div class="focus-top">
          <span class="focus-rank">${k + 1}</span>
          <span class="focus-name">${esc(r.title)}</span>
          <span class="level-pill ${r.tone === "good" ? "strong" : r.tone === "none" ? "mid" : r.tone}">${esc(r.label)}</span>
        </div>
        <p class="focus-meta">${esc(r.why)}</p>
        ${r.extra.length ? `<p class="focus-meta">${r.extra.map(esc).join(" ")}</p>` : ""}
        <div class="focus-actions">
          <button class="btn btn-secondary btn-sm" data-lesson="${r.concept}" type="button">Open lesson</button>
          <button class="btn btn-secondary btn-sm" data-quiz="${r.concept}" type="button">Quiz me (5)</button>
        </div>
      </div>`).join("") : `<p class="empty-note">Nothing needs urgent work based on your records. Keep your streak going with a quiz on something you haven't tried yet.</p>`) +
      `<p class="focus-foot"><button class="btn-inline" data-go="learning" type="button">See your full study plan</button>${docs ? ` · ${docs} study file${docs > 1 ? "s" : ""} uploaded` : ""}</p>`;
  }

  function renderHabits(ins) {
    const el = $("#habits");
    if (!ins.count) { el.innerHTML = `<p class="empty-note">This tracks the habits that cost marks on written answers, like answers not in simplest form or extraneous roots you kept.</p>`; return; }
    const sec = SECTIONS.filter((s) => ins.sections[s.key] && ins.sections[s.key].max).map((s) => {
      const v = ins.sections[s.key] || { earned: 0, max: 0 };
      const pct = v.max ? Math.round((v.earned / v.max) * 100) : 0;
      return `<div class="topic-row"><div class="topic-row-head"><span>${s.name}</span><span><b>${pct}%</b> <span class="muted">· ${fmtMarks(v.earned)}/${v.max} all time</span></span></div><div class="bar"><div class="bar-fill ${pct >= 85 ? "good" : pct >= 65 ? "mid" : "low"}" style="width:${pct}%"></div></div></div>`;
    }).join("");
    const habits = ins.habits.length ? `<ul class="habit-list">${ins.habits.map((h) => `
        <li><span class="habit-marks">−${fmtMarks(h.marks)}</span><span><b>${esc(h.label)}</b><span class="muted small"> · ${h.count} time${h.count > 1 ? "s" : ""}</span><br><span class="habit-tip">${esc(h.tip)}</span></span></li>`).join("")}</ul>`
      : `<p class="empty-note">No marks lost to form or checking habits. Nice and tidy.</p>`;
    const slow = ins.slowTopic ? `<p class="slow-note">⏱ <b>Time sink:</b> ${esc(ins.slowTopic.topic)} takes you about <b>${dur(ins.slowTopic.avgTime)}</b> per question.</p>` : "";
    el.innerHTML = `${habits}${slow}<h3 class="sub-h">By section</h3>${sec}`;
  }

  function renderMastery() {
    const el = $("#mastery");
    const { prof } = learningState();
    const S = window.Learning.STATUS;
    el.innerHTML = window.Concepts.UNITS.map((u) => `
      <div class="mastery-unit"><h3 class="sub-h">${esc(u.title)}</h3><div class="mastery-grid">${window.Concepts.CONCEPTS.filter((c) => c.unit === u.id).map((c) => {
        const p = prof[c.id], st = S[p.status];
        const pc = p.accuracy === null ? null : Math.round(p.accuracy * 100);
        return `<div class="mastery-row${pc === null ? " unseen" : ""}"><button class="m-name btn-inline" data-lesson="${c.id}" type="button">${esc(c.title)}</button><span class="m-bar"><span class="bar">${pc === null ? "" : `<span class="bar-fill ${st.tone === "good" ? "good" : st.tone === "low" ? "low" : "mid"}" style="width:${pc}%"></span>`}</span></span><span class="m-val">${pc === null ? "" : `<b>${pc}%</b>`} <span class="level-pill st-${st.tone}" title="${esc(window.Learning.explain(p))}">${esc(st.label)}</span></span></div>`;
      }).join("")}</div></div>`).join("");
  }

  function renderHistory(h) {
    const list = $("#history-list");
    if (!h.length) { list.innerHTML = `<p class="empty-note">No tests yet. Your finished tests will be listed here with their marks and times.</p>`; return; }
    const bestIds = new Set(Object.keys(LEVELS).map((lv) => (h.filter((a) => levelOf(a) === lv).sort(compareAttempts)[0] || {}).id));
    const recent = h.slice().sort((a, b) => b.date - a.date);
    const sec = (a, k) => a.sections && a.sections[k] ? `${fmtMarks(a.sections[k].earned)}/${a.sections[k].max}` : "—";
    list.innerHTML = `
      <div class="table-scroll"><table class="history-table">
        <thead><tr><th>Date</th><th>Mark</th><th>WR</th><th>NR</th><th>MC</th><th>Time</th><th>Avg / Q</th><th class="sr-only">Review</th></tr></thead>
        <tbody>
          ${recent.map((a) => `
            <tr data-id="${esc(a.id)}" tabindex="0" title="Review this test">
              <td>${esc(niceDate(a.date))} <span class="pill pill-level ${levelOf(a)}">${esc(LEVELS[levelOf(a)] && !LEVELS[levelOf(a)].legacy ? levelName(levelOf(a)) : (LEVELS[levelOf(a)] || LEVELS.normal).short)}</span>${subjectOf(a) === "radicals" ? ' <span class="pill pill-legacy" title="Taken during the radicals unit">Radicals</span>' : ""}${a.group ? ' <span class="pill pill-group">Group</span>' : ""}${bestIds.has(a.id) ? ' <span class="pill pill-best">Best</span>' : ""}${a.timedOut ? ' <span class="pill">Timed out</span>' : ""}</td>
              <td><b>${a.percent}%</b> <span class="muted">${fmtMarks(a.earned)}/${a.total}</span></td>
              <td>${sec(a, "wr")}</td><td>${sec(a, "nr")}</td><td>${sec(a, "mc")}</td>
              <td>${clock(a.totalTime)}</td>
              <td>${dur(a.avgTime)}</td>
              <td class="row-go" aria-hidden="true">Review →</td>
            </tr>`).join("")}
        </tbody>
      </table></div>
      <button class="btn btn-link" id="btn-clear-history" type="button">Clear history</button>`;
    for (const tr of $$("tr[data-id]", list)) {
      const open = () => { const a = getHistory().find((x) => x.id === tr.dataset.id); if (a) showResults(a, false); };
      tr.addEventListener("click", open);
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
    }
    $("#btn-clear-history").addEventListener("click", async () => {
      if (await confirmDialog("Clear all saved tests?", "This deletes every saved score in this browser. It can't be undone.", "Clear history", "Cancel")) { store.del(KEYS.history); renderHome(); }
    });
  }

  function finishExpiredSession(saved) {
    session = saved;
    const attempt = buildAttempt(true);
    attempt.totalTime = durOf(saved);
    const h = getHistory(); h.push(attempt); store.set(KEYS.history, h);
    store.del(KEYS.session);
    session = null;
  }

  // ───────────────────────── building a test ─────────────────────────
  function spread(bank, n, rnd = Math.random) {
    const groups = new Map();
    for (const q of shuffle(bank, rnd)) { if (!groups.has(q.topic)) groups.set(q.topic, []); groups.get(q.topic).push(q); }
    const lists = shuffle([...groups.values()], rnd);
    const picked = [];
    while (picked.length < Math.min(n, bank.length)) for (const l of lists) if (l.length && picked.length < n) picked.push(l.shift());
    return shuffle(picked, rnd);
  }
  const wrItem = (q) => ({ kind: "wr", qid: q.id, responses: {}, work: "", time: 0, flagged: false });
  const nrItem = (q) => ({ kind: "nr", qid: q.id, response: "", time: 0, flagged: false });
  const mcItem = (q, rnd = Math.random) => ({ kind: "mc", qid: q.id, order: q.order ? q.order.slice() : shuffle(q.c.map((_, i) => i), rnd), chosen: null, time: 0, flagged: false });
  // rnd is seeded for group tests, so every device builds the identical test.
  // Quadratics tests are generated and verified by QuadBank; the old radicals banks stay loaded for history.
  function buildTest(level = "normal", rnd = Math.random) {
    const QB = window.QuadBank;
    const reg = (q, kind) => { BANKS[kind].set(q.id, q); return q; };
    if (level === "nightmare") return QB.buildNightmare(rnd).map((q) => wrItem(reg(q, "wr")));
    const t = QB.buildTest(level === "challenge" ? "challenge" : "normal", rnd);
    return [...t.wr.map((q) => wrItem(reg(q, "wr"))), ...t.nr.map((q) => nrItem(reg(q, "nr"))), ...t.mc.map((q) => mcItem(reg(q, "mc"), rnd))];
  }

  const qOf = (item) => BANKS[item.kind].get(item.qid);
  const maxMarks = (item) => item.kind === "wr" ? qOf(item).parts.reduce((s, p) => s + p.marks, 0) : 1;
  function answeredParts(item) {
    if (item.kind === "mc") return item.chosen !== null ? 1 : 0;
    if (item.kind === "nr") return String(item.response || "").trim() ? 1 : 0;
    return qOf(item).parts.filter((p) => String(item.responses[p.key] || "").trim()).length;
  }
  const totalParts = (item) => item.kind === "wr" ? qOf(item).parts.length : 1;
  const isAnswered = (item) => answeredParts(item) === totalParts(item);
  function labelOf(i, items = session.items, level = session ? session.level : null) {
    const item = items[i];
    const sec = sectionsOf(items).find((s) => s.key === item.kind);
    const n = items.slice(0, i + 1).filter((x) => x.kind === item.kind).length;
    const stage = level === "nightmare" || (item.qid && /-nm\d-/.test(item.qid));
    return { sec, n, text: stage ? tr("test.stage", { n }) : item.kind === "wr" ? `Q${n}` : `${sec.short} ${n}` };
  }

  // opts.group = decoded group code + name → seeded questions and (optionally) a shared clock
  function startTest(opts = {}) {
    const now = Date.now();
    const g = opts.group || null;
    const level = g ? g.level : opts.level || getPrefs().level;
    if (!TEST_LEVELS.includes(level)) return startTest({ ...opts, level: /^nightmare/.test(level || "") ? "nightmare" : "normal" });
    const scheduled = !!(g && g.start);
    const prefs = getPrefs();
    const minutes = g ? g.minutes || 60 : opts.minutes || prefs.minutes || 60;
    const fireOn = prefs.buddyMode !== "off";
    session = {
      id: now.toString(36) + Math.random().toString(36).slice(2, 6),
      startedAt: scheduled ? g.start : now,
      elapsed: scheduled ? Math.max(0, (now - g.start) / 1000) : 0,
      lastActive: now, paused: false, pauses: 0, level, subject: "quadratics",
      group: g ? { code: g.code, name: g.name || "", start: g.start, scheduled } : null,
      items: buildTest(level, g ? window.Group.rng(g.seed) : Math.random),
      current: 0, mode: prefs.buddyMode, buddy: null,
      duration: minutes * 60,
      hardcore: fireOn && !!prefs.hardcore,
      drain: fireOn && !!prefs.drain && !scheduled, // a shared clock can't drain for one person
      companion: fireOn && window.Companion ? (() => { const c = window.Companion.normalize(prefs.companion || window.Companion.full()); return c.any ? c : null; })() : null, // campfire on = full minigame unless customised
      gameOvers: 0, turnedOff: false,
    };
    if (prefs.goose) gooseRules(session);
    saveSession();
    enterTest();
  }
  // ───────── Goose Mode ↔ puppy survival: mutually exclusive rulesets inside a test ─────────
  // The puppy's settings are put aside (not lost) while the goose is in charge, then given back.
  function gooseRules(sess) {
    if (sess.goose || sess.demo) return;
    sess.preGoose = { mode: sess.mode, hardcore: sess.hardcore, drain: sess.drain, companion: sess.companion, buddy: sess.buddy || null, turnedOff: !!sess.turnedOff, buddyAtOff: sess.buddyAtOff || null, gameOver: sess.gameOver || null };
    Object.assign(sess, { goose: true, mode: "off", hardcore: false, drain: false, companion: null, buddy: null, gameOver: null });
  }
  function puppyRules(sess) {
    if (!sess.goose) return;
    const p = sess.preGoose || {};
    Object.assign(sess, { goose: false, mode: p.mode || "off", hardcore: !!p.hardcore, drain: !!p.drain, companion: p.companion || null, buddy: p.buddy || null, turnedOff: !!p.turnedOff, buddyAtOff: p.buddyAtOff || null });
    delete sess.preGoose;
  }
  // A live test follows the current Goose setting (also when an unfinished test is resumed after the setting changed).
  function syncGooseSession() {
    if (!session || session.demo) return;
    const want = !!getPrefs().goose;
    if (want === !!session.goose) return;
    if (fire) { saveSession(); fire.stop(); }
    if (want) {
      if (session.gameOver) { $("#gameover").hidden = true; $("#screen-test").inert = false; $("#topbar-test").inert = false; }
      gooseRules(session);
    } else puppyRules(session);
    buildBuddy();
    if (!session.paused) { fire.start(); }
    saveSession();
  }
  function resumeTest() {
    const saved = savedSession();
    if (!saved) return goHome();
    session = saved;
    if (session.group && session.group.scheduled) session.elapsed = Math.max(0, (Date.now() - session.group.start) / 1000);
    else if (!session.paused) session.elapsed += Math.max(0, (Date.now() - session.lastActive) / 1000); // time away counts
    session.lastActive = Date.now();
    enterTest();
  }

  // ───────────────────────── test screen ─────────────────────────
  function enterTest() {
    show("test");
    document.body.classList.toggle("buddy-off", session.mode === "off");
    // the mode is always on show; legacy (radicals) sessions keep their old names
    $("#tb-level").hidden = !!session.demo;
    $("#tb-level").textContent = `${/^nightmare/.test(session.level) ? "☠ " : ""}${levelName(session.level)}`;
    $("#tb-level").dataset.level = session.level;
    // A scheduled group test shares one clock, so it can't be paused
    $("#btn-pause").hidden = !!(session.group && session.group.scheduled);
    $("#seg-bar").innerHTML = sectionsOf(session.items).map((s) => `<span class="seg" style="flex:${s.count}" title="${s.name}"><span class="seg-fill" data-sec="${s.key}"></span></span>`).join("");

    buildBuddy();

    ensurePad();
    if (pad) { pad.avoidLeft = !!(fire && fire.comp && fire.comp.on); if (pad._place) pad._place(); }
    renderQuestion();
    lastTick = Date.now();
    clearInterval(timerId);
    timerId = setInterval(tick, 250);
    if (session.mode === "off" && session.turnedOff) document.body.classList.add("buddy-off");
    if (session.paused) showPause();
    else if (session.gameOver) { const k = session.gameOver; session.gameOver = null; session.gameOvers--; fire.status = k; fire.render(); showGameOver(k); }
    else { fire.start(); if (pad) pad.show(); }
    syncGooseSession();
    tick();
    maybeGameTutorial();
  }

  // The campfire (or nothing, under Goose rules / No campfire) for the current session
  function buildBuddy() {
    document.body.classList.toggle("buddy-off", session.mode === "off");
    const slot = $("#test-scene");
    slot.innerHTML = "";
    const scene = makeScene();
    slot.appendChild(scene);
    if (fire) fire.destroy();
    fire = new window.Campfire({ scene, gauge: $("#gauge"), button: $("#btn-fuel"), buttonText: $("#fuel-text"), status: $("#buddy-status") }, session.mode);
    if (session.buddy) {
      Object.assign(fire.stats, session.buddy.stats);
      fire.heat = session.buddy.heat;
      fire.status = session.buddy.status === "burning" ? "burnt" : session.buddy.status;
      fire.render();
    }
    if (location.hash === "#debug") window.__fire = fire;
    fire.onEvent = (kind) => { if (session && session.hardcore && !session.demo) showGameOver(kind); };
    // Campfire Companion extras: only when chosen in Create test, never in the tour or with the campfire off
    const compOn = session.companion && session.mode !== "off" && !session.demo && window.Companion;
    if (compOn) {
      fire.comp = new window.Companion.Companion(fire, { panel: $(".buddy-panel"), slot }, { config: session.companion, minutes: durOf(session) / 60, busy: () => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest("#q-body") && Date.now() - lastTyped < 6000) });
      if (session.buddy && session.buddy.comp) fire.comp.restore(session.buddy.comp);
    }
    const ck = compOn ? [["vent", "V", "vent"], ["oxygen", "O", "bellows"], ["kettle", "K", "valve"], ["tent", "T", "tent"]].filter(([m]) => session.companion.mech[m]).map(([, k, t]) => `<kbd>${k}</kbd> ${t}`) : [];
    $("#kbd-comp").innerHTML = ck.length ? " · " + ck.join(" · ") : "";
    $("#btn-fire-off").hidden = session.mode === "off" || !!session.demo;
    if (pad) pad.avoidLeft = !!(fire && fire.comp && fire.comp.on);
  }

  function tick() {
    if (!session) return;
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    const gooseHold = !!(window.Goose && window.Goose.frozen());
    if (!session.paused && !session.demo && !tutorialHold && !gooseHold) {
      if (session.group && session.group.scheduled) session.elapsed = Math.max(0, (now - session.group.start) / 1000); // everyone shares one clock
      else if (!session.gameOver) session.elapsed += dt * drainRate();
      session.items[session.current].time += dt;
      session.lastActive = now;
    }
    const left = durOf(session) - session.elapsed;
    $("#timer-value").textContent = clock(left);
    const rate = session.paused || session.gameOver || tutorialHold ? 1 : drainRate();
    const badge = $("#drain-badge");
    badge.hidden = rate === 1;
    if (rate > 1) { badge.textContent = `×${rate}`; badge.dataset.rate = rate; }
    $("#timer").title = rate > 1 ? `Armadillo mode: the clock is draining ${rate}× faster. Get the fire back in the green!` : "";
    $("#timer").dataset.level = session.paused ? "paused" : rate > 1 ? "drain" : left < 60 ? "danger" : left < 300 ? "warn" : "ok";
    if (left <= 0) return finishTest(true);
    if (now - lastSave > 3000) saveSession();
  }

  const drainRate = () => (session && session.drain && fire && !session.demo ? fire.drain() : 1);

  // ───────── Puppy can lose: game over, but the test always goes on ─────────
  function showGameOver(kind) {
    if (!session || session.gameOver) return;
    tick();
    session.gameOver = kind;
    session.gameOvers = (session.gameOvers || 0) + 1;
    if (fire) fire.stop();
    if (pad) pad.hide();
    const GO = { burnt: ["🔥", "The camp burned down."], frozen: ["🧊", "Your puppy froze solid."], kettle: ["💥", "The kettle blew."], oxygen: ["◌", "The fire ran out of oxygen."] }[kind] || ["🔥", "Game over."];
    $("#go-icon").textContent = GO[0];
    $("#go-title").textContent = GO[1];
    $("#go-text").textContent = (session.group && session.group.scheduled)
      ? "Math comes first: your answers are safe and your mark isn't affected. (The group clock keeps running.)"
      : "Math comes first: your answers are safe and your mark isn't affected. The clock is stopped while you decide.";
    $("#gameover").hidden = false;
    $("#gameover").dataset.kind = kind;
    $("#screen-test").inert = true; $("#topbar-test").inert = true;
    $("#go-revive").focus();
    saveSession();
  }
  function closeGameOver() {
    $("#gameover").hidden = true;
    $("#screen-test").inert = false; $("#topbar-test").inert = false;
    session.gameOver = null;
    lastTick = Date.now();
    if (pad) pad.show();
    saveSession();
  }
  function reviveFire() { if (!session) return; if (fire) { fire.revive(); fire.start(); } closeGameOver(); }
  function turnOffCampfire() {
    if (!session || !fire) return;
    fire.turnOff();
    session.mode = "off";
    session.turnedOff = true;
    session.buddyAtOff = fire.snapshot();
    document.body.classList.add("buddy-off");
    $("#btn-fire-off").hidden = true;
    saveSession();
  }

  function saveSession() {
    if (!session || session.demo) return;
    if (fire) session.buddy = { heat: fire.heat, status: fire.status, stats: { ...fire.stats }, comp: fire.comp ? fire.comp.state() : undefined };
    store.set(KEYS.session, session);
    lastSave = Date.now();
  }

  // ───────── pause lock ─────────
  function pauseTest() {
    if (!session || session.paused || session.demo || (session.group && session.group.scheduled)) return;
    tick();
    session.paused = true;
    session.pauses++;
    saveSession();
    showPause();
  }
  function showPause() {
    if (fire) fire.stop();
    if (pad) pad.hide();
    if (document.activeElement) document.activeElement.blur();
    $("#screen-test").inert = true;
    $("#topbar-test").inert = true;
    const sc = $("#pause-scene");
    sc.innerHTML = "";
    const scene = makeScene();
    scene.classList.add("is-sleeping");
    scene.style.setProperty("--heat", "34");
    sc.appendChild(scene);
    const answered = session.items.filter(isAnswered).length;
    $("#pause-time").textContent = clock(durOf(session) - session.elapsed);
    $("#pause-detail").innerHTML = `${answered} of ${session.items.length} answered, stopped on ${labelOf(session.current).text}. Your answers, scratch work and campfire are saved. You can close this tab and come back later — the timer stays frozen until you resume.`;
    $("#pause-overlay").hidden = false;
    document.body.classList.add("is-paused");
    $("#btn-unpause").focus();
  }
  function unpauseTest() {
    if (!session) return;
    session.paused = false;
    lastTick = Date.now();
    session.lastActive = lastTick;
    $("#pause-overlay").hidden = true;
    document.body.classList.remove("is-paused");
    $("#screen-test").inert = false;
    $("#topbar-test").inert = false;
    if (fire) fire.start();
    if (pad) pad.show();
    saveSession();
    maybeGameTutorial();
  }
  function pauseToHome() {
    saveSession();
    teardownTest();
    goHome();
  }
  function teardownTest() {
    tutorialHold = false;
    if (window.Tour && window.Tour.active && window.Tour.id === "game") window.Tour.end("replaced");
    clearInterval(timerId); timerId = null;
    if (fire) { fire.destroy(); fire = null; }
    if (pad) pad.hide();
    $("#pause-overlay").hidden = true;
    $("#gameover").hidden = true;
    document.body.classList.remove("is-paused", "buddy-off");
    $("#screen-test").inert = false;
    $("#topbar-test").inert = false;
    session = null;
  }

  function renderProgress() {
    const n = session.items.length;
    const answered = session.items.filter(isAnswered).length;
    const { sec, n: k, text } = labelOf(session.current);
    $("#q-counter").textContent = session.level === "nightmare" ? `${text} / ${sec.count}` : tr("test.counter", { s: sec.name, q: session.items[session.current].kind === "wr" ? "Q" : "#", k, n: sec.count });
    $("#answered-counter").textContent = tr("test.answered", { a: answered, n });
    $("#navpop-count").textContent = `${answered}/${n}`;
    for (const s of sectionsOf(session.items)) {
      const xs = session.items.filter((it) => it.kind === s.key);
      const f = $(`.seg-fill[data-sec="${s.key}"]`);
      if (f) f.style.width = `${(xs.filter(isAnswered).length / xs.length) * 100}%`;
    }
  }

  function renderNav() {
    const stageNames = session.level === "nightmare";
    $("#nav-grid").innerHTML = sectionsOf(session.items).map((sec) => {
      const cells = session.items.map((it, i) => ({ it, i })).filter((x) => x.it.kind === sec.key).map(({ it, i }, k) => {
        const done = isAnswered(it), some = !done && answeredParts(it) > 0;
        return `<button type="button" class="nav-cell${i === session.current ? " current" : ""}${done ? " answered" : ""}${some ? " partial" : ""}${it.flagged ? " flagged" : ""}"
          data-i="${i}" aria-label="${stageNames ? tr("test.stage", { n: k + 1 }) : `${sec.name} ${k + 1}`}${done ? ", answered" : some ? ", partly answered" : ""}${it.flagged ? ", flagged" : ""}">${stageNames ? "S" : sec.key === "wr" ? "Q" : ""}${k + 1}</button>`;
      }).join("");
      if (!cells) return "";
      return `<div class="nav-section"><div class="nav-section-head"><span>${stageNames ? "Nightmare gauntlet" : sec.name}</span><span class="muted">${sec.marks} marks</span></div><div class="nav-cells${sec.key === "mc" ? " wide" : ""}">${cells}</div></div>`;
    }).join("");
  }

  function renderQuestion() {
    const item = session.items[session.current];
    const q = qOf(item);
    const { text } = labelOf(session.current);
    const marks = maxMarks(item);

    $("#q-topic").textContent = q.topic;
    $("#q-label").textContent = `${text} · ${marks} mark${marks > 1 ? "s" : ""}`;
    const flag = $("#btn-flag");
    flag.setAttribute("aria-pressed", item.flagged);
    flag.textContent = item.flagged ? `⚑ ${tr("test.flagged")}` : `⚐ ${tr("test.flag")}`;
    renderHint(item, q);

    const body = $("#q-body");
    if (item.kind === "mc") {
      body.innerHTML = `
        <div class="q-text">${renderMath(q.q)}</div>
        <div class="choices" role="radiogroup" aria-label="Answer choices">
          ${item.order.map((orig, i) => `
            <button type="button" class="choice${item.chosen === orig ? " selected" : ""}" role="radio" aria-checked="${item.chosen === orig}" data-orig="${orig}">
              <span class="choice-letter">${LETTERS[i]}</span>
              <span class="choice-body">${renderMath(q.c[orig])}</span>
            </button>`).join("")}
        </div>`;
    } else if (item.kind === "nr") {
      body.innerHTML = `
        <div class="q-text">${renderMath(q.q)}</div>
        <div class="nr-box">
          <label class="answer-label" for="nr-input">Your answer <span class="muted">· ${esc(q.fmt || "Number")}</span></label>
          <input class="answer-input nr-input" id="nr-input" data-field="nr" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${esc(item.response || "")}" placeholder="e.g. 45" />
          <div class="preview" data-preview="nr"></div>
        </div>`;
      updatePreview($("#nr-input"));
    } else {
      body.innerHTML = `
        <div class="q-text">${renderMath(q.intro)}</div>
        <div class="wr-parts">${q.parts.map((p) => partHTML(p, item.responses[p.key] || "")).join("")}</div>
        <details class="work-box"${item.work ? " open" : ""}>
          <summary>Type out your steps <span class="muted">(optional — saved with your review)</span></summary>
          <textarea class="work-input" data-field="work" rows="5" placeholder="Write your steps here, or use the scratchpad. Your teacher marks the steps — practise showing them!">${esc(item.work || "")}</textarea>
        </details>
        <p class="input-help">${q.parts.some((p) => ["equation", "point"].includes(p.kind)) ? esc(tr("test.equationHelp")) + " " : ""}${q.parts.some((p) => p.kind === "plot") ? esc(tr("test.plotHelp")) + " " : ""}${q.parts.some((p) => ["set", "expr"].includes(p.kind)) ? "Exact values: type <kbd>√</kbd> with the buttons or as <code>sqrt</code>, e.g. <code>(3+√5)/2</code>. List several solutions like <code>2, -3</code>, or type <code>none</code>." : ""}</p>`;
      for (const inp of $$("[data-part]", body)) updatePreview(inp);
      hydratePlots(body, item.responses, (key, v) => { item.responses[key] = v; renderProgress(); renderNav(); clearTimeout(onInput._t); onInput._t = setTimeout(saveSession, 300); }, false);
    }

    if (!item.sketch) item.sketch = [];
    if (pad) pad.setPage(item.sketch, text, item);
    renderTestInfo(q);
    $("#btn-prev").disabled = session.current === 0;
    $("#btn-next").disabled = session.current === session.items.length - 1;
    renderProgress();
    renderNav();
  }

  function partHTML(p, val) {
    const m = `<span class="marks-badge">${p.marks} mark${p.marks > 1 ? "s" : ""}</span>`;
    const head = `<div class="part-head">${p.label ? `<span class="part-label">${p.label}</span>` : ""}<span class="part-prompt">${renderMath(p.prompt)}</span>${m}</div>`;
    if (p.kind === "choice") {
      return `<div class="wr-part">${head}
        <div class="segmented paper-seg" role="radiogroup">
          ${p.choices.map((c) => `<button type="button" role="radio" data-choice="${esc(p.key)}" data-value="${esc(c)}" class="${val === c ? "active" : ""}" aria-checked="${val === c}">${esc(c)}</button>`).join("")}
        </div></div>`;
    }
    if (p.kind === "plot") {
      return `<div class="wr-part plot-part">${head}<div class="plot-host" data-plot="${esc(p.key)}" data-win="${esc(JSON.stringify(p.window || {}))}"></div></div>`;
    }
    // build a parabola on an empty grid (the key is never drawn before the answer is marked)
    if (p.kind === "graph") {
      return `<div class="wr-part plot-part graph-part">${head}<div class="plot-host" data-plot="${esc(p.key)}" data-builder="1" data-win="${esc(JSON.stringify(p.window || {}))}"></div></div>`;
    }
    const ph = { set: "e.g.  2, -3   or   none", restriction: "e.g.  x ≥ 3", number: "e.g.  3.97", point: "e.g.  (3, -2)", equation: "e.g.  y = 2(x - 3)^2 + 1",
      poly: p.form === "factored" ? "e.g.  (x - 2)(3x + 1)" : p.form === "simplified" ? "e.g.  (x + 1)/(x - 3)" : "e.g.  2x^2 - 12x + 23", mono: p.form === "radical" ? "e.g.  root(x^3, 4)" : p.form === "power" ? "e.g.  x^(3/4)" : "e.g.  8a^9/b^6",
      interval: "e.g.  (-inf, 3] U [5, inf)   or   x ≤ 3 or x ≥ 5", approx: `e.g.  ${p.dp === 1 ? "12.4" : p.dp === 0 ? "12" : "12.47"}` }[p.kind] || "e.g.  3√2   or   (6+2√5)/7";
    const keys = p.kind === "restriction" ? ["≥", "≤", ">", "<", "/"] : p.kind === "number" ? ["/", "(", ")", "√"] : p.kind === "point" ? ["(", ")", ",", "/", "√"] : p.kind === "equation" ? ["x", "x²", "(", ")", "/"]
      : p.kind === "poly" ? ["x", "x²", "^", "(", ")", "/"] : p.kind === "mono" ? ["^", "(", ")", "/", "√"] : p.kind === "interval" ? ["(", ")", "[", "]", "∞", "∪", "≤", "≥"] : p.kind === "approx" ? ["."] : ["√", "∛", "∜", "π", "(", ")", "/"];
    const titles = { "√": "Square root", "∛": "Cube root", "∜": "Fourth root", "π": "Pi", "(": "Open bracket", ")": "Close bracket", "/": "Divide", "≥": "Greater than or equal", "≤": "Less than or equal", ">": "Greater than", "<": "Less than", ",": "Comma", "x": "x", "x²": "x squared", "^": "Power", "[": "Open (included)", "]": "Close (included)", "∞": "Infinity", "∪": "Union", ".": "Decimal point" };
    return `<div class="wr-part">${head}
      <div class="input-row">
        <input class="answer-input" type="text" data-part="${esc(p.key)}" data-kind="${p.kind}" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(val)}" placeholder="${ph}" aria-label="Answer ${esc(p.label || "")}" />
        <div class="keypad" aria-label="Insert symbol">
          ${keys.map((k) => `<button type="button" data-ins="${k}" title="${titles[k]}">${k === "/" ? "÷" : k}</button>`).join("")}
        </div>
      </div>
      <div class="preview" data-preview="${esc(p.key)}"></div></div>`;
  }

  function updatePreview(inp) {
    const key = inp.dataset.part || "nr";
    const box = inp.closest(".wr-part, .nr-box").querySelector(`[data-preview="${CSS.escape(key)}"]`);
    const v = inp.value.trim();
    if (!v) { box.innerHTML = ""; box.className = "preview"; return; }
    const k = inp.dataset.kind;
    const r = k === "set" ? Check.readSet(v) : k === "restriction" ? Check.readRestriction(v) : window.QuadCheck && window.QuadCheck.handles(k) ? window.QuadCheck.read(k, v) : window.AnswerCheck && window.AnswerCheck.handles(k) ? window.AnswerCheck.read(k, v) : Check.read(v);
    if (r.ok) { box.className = "preview ok"; box.innerHTML = `<span class="muted">${esc(tr("test.readsAs"))}</span> ${tex(r.tex)}`; }
    else { box.className = "preview err"; box.textContent = `⚠ ${r.error}`; }
  }

  function onInput(e) {
    const t = e.target;
    if (!session) return;
    const item = session.items[session.current];
    if (t.dataset.field === "nr") item.response = t.value;
    else if (t.dataset.field === "work") item.work = t.value;
    else if (t.dataset.part) item.responses[t.dataset.part] = t.value;
    else return;
    if (t.matches(".answer-input")) updatePreview(t);
    renderProgress();
    renderNav();
    clearTimeout(onInput._t);
    onInput._t = setTimeout(saveSession, 400);
  }

  // ───────── plots: interactive in a test or practice, static (with the key) in a review ─────────
  function hydratePlots(root, responses, onChange, disabled) {
    if (!window.Graph) return;
    for (const host of $$("[data-plot]", root)) {
      let win = null; try { win = JSON.parse(host.dataset.win); } catch { /* default */ }
      if (host.dataset.builder) {
        window.Graph.builder(host, { window: win && win.x0 !== undefined ? win : undefined, value: responses[host.dataset.plot] || "", disabled, onChange: (v) => onChange(host.dataset.plot, v),
          labels: { vertex: tr("graph.vertex"), points: tr("graph.points"), draw: tr("graph.draw"), undraw: tr("graph.undraw"), reset: tr("graph.reset"), hintVertex: tr("graph.hintVertex"), hintPoints: tr("graph.hintPoints"), count: tr("graph.count"), axis: tr("graph.axis") } });
        continue;
      }
      window.Graph.plotter(host, { window: win && win.x0 !== undefined ? win : undefined, value: responses[host.dataset.plot] || "", disabled, onChange: (v) => onChange(host.dataset.plot, v),
        labels: { vertex: "Vertex", point: "Point", reset: "Reset" } });
    }
  }
  // ───────── hints: what each mode allows ─────────
  const hintPolicy = (lv) => (session && session.demo ? "steps" : HINT_POLICY[lv] || "none");
  function renderHint(item, q) {
    const pol = hintPolicy(session.level), hints = (q.hints || []).filter(Boolean);
    const allowed = pol === "none" ? 0 : pol === "one" ? Math.min(1, hints.length) : hints.length;
    const used = Math.min(item.hints || 0, allowed);
    const btn = $("#btn-hint"), box = $("#hint-box");
    btn.hidden = !hints.length || pol === "none";
    btn.disabled = used >= allowed;
    $("#hint-label").textContent = used ? `${tr("test.hintMore")} (${used}/${allowed})` : tr("test.hint");
    btn.title = pol === "none" ? tr("test.hintsOff") : "";
    box.hidden = !used;
    box.innerHTML = used ? `<ol class="hint-list">${hints.slice(0, used).map((h) => `<li>${renderMath(h)}</li>`).join("")}</ol>` : "";
    if (pol === "none" && session.level === "nightmare") { btn.hidden = true; }
  }
  function useHint() {
    if (!session || session.paused) return;
    const item = session.items[session.current], q = qOf(item);
    const pol = hintPolicy(session.level), n = (q.hints || []).length;
    const allowed = pol === "none" ? 0 : pol === "one" ? Math.min(1, n) : n;
    if ((item.hints || 0) >= allowed) return;
    item.hints = (item.hints || 0) + 1;
    saveSession();
    renderHint(item, q);
  }
  // Focus layout keeps the question navigator tucked away until asked for
  function setNavPop(open) {
    document.body.classList.toggle("navpop-open", open);
    $("#btn-navpop").setAttribute("aria-expanded", String(open));
    if (open) { const cur = $("#nav-grid .nav-cell.current") || $("#nav-grid .nav-cell"); if (cur) cur.focus(); }
  }
  // ───────── Studio: formula reference for the concepts in this question ─────────
  function renderTestInfo(q) {
    const el = $("#test-info"); if (!el) return;
    const cids = window.Concepts.conceptsFor(q);
    const fs = (window.Concepts.FORMULAS || []).filter((f) => f.related.some((r) => cids.includes(r))).slice(0, 4);
    el.innerHTML = fs.length ? `<p class="ti-k">${esc(tr("lib.formulas"))}</p>${fs.map((f) => `<div class="ti-f"><span class="ti-n">${esc(f.name)}</span><div class="ti-tex">${tex(f.tex, true)}</div><span class="ti-w">${esc(f.when)}</span></div>`).join("")}` : "";
  }
  // ───────── scratchpad: per question in a test, one general page elsewhere ─────────
  function ensurePad() {
    if (!pad && window.Scratchpad) {
      pad = new window.Scratchpad($("#scratchpad"));
      pad.onChange = () => {
        if (session && session.demo) return;
        if (session) { clearTimeout(pad._saveT); pad._saveT = setTimeout(saveSession, 500); }
        else if (pad.page && pad.page.general) { clearTimeout(pad._saveT); pad._saveT = setTimeout(() => store.set(KEYS.pad, { strokes: pad.strokes, notes: pad.page.notes || "" }), 400); }
      };
    }
    return pad;
  }
  function usePadGeneral() {
    if (!ensurePad()) return;
    const saved = store.get(KEYS.pad, { strokes: [], notes: "" });
    const page = { general: true, notes: saved.notes || "" };
    pad.setPage(Array.isArray(saved.strokes) ? saved.strokes : [], tr("pad.general"), page);
  }

  function choose(orig) {
    session.items[session.current].chosen = orig;
    if (fire) fire.react("happy");
    saveSession();
    renderQuestion();
  }

  function go(i) {
    if (!session) return;
    i = Math.max(0, Math.min(session.items.length - 1, i));
    if (i === session.current) return;
    tick();
    session.current = i;
    renderQuestion();
    saveSession();
    const card = $("#question-card");
    card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    const r = card.getBoundingClientRect();
    if (r.top < 90 || r.top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + r.top - 96, behavior: "smooth" });
  }

  async function submitTest() {
    if (session.demo) return;
    const un = session.items.filter((i) => !isAnswered(i)).length;
    const fl = session.items.filter((i) => i.flagged).length;
    let body = "You can't change answers after submitting.";
    if (un) body = `<b>${un} question${un > 1 ? "s are" : " is"} not fully answered.</b> ` + body;
    if (fl) body += ` (${fl} still flagged.)`;
    if (await confirmDialog("Submit test?", body, "Submit", "Keep working")) finishTest(false);
  }

  // ───────────────────────── grading ─────────────────────────
  function gradeItem(item) {
    const q = qOf(item);
    if (!q) return { earned: 0, max: 0, parts: [] };
    if (item.kind === "mc") return { earned: item.chosen === 0 ? 1 : 0, max: 1, parts: [] };
    if (item.kind === "nr") { const g = Check.grade({ kind: "number", answer: q.answer, marks: 1 }, item.response); return { earned: g.earned, max: 1, parts: [g] }; }
    const parts = q.parts.map((p) => Check.grade(p, item.responses[p.key]));
    return { earned: parts.reduce((s, g) => s + g.earned, 0), max: parts.reduce((s, g) => s + g.max, 0), parts };
  }

  function buildAttempt(timedOut) {
    const items = session.items.map((it) => { const g = gradeItem(it); return { ...it, time: Math.round(it.time * 10) / 10, earned: g.earned, max: g.max }; });
    const earned = items.reduce((s, it) => s + it.earned, 0);
    const sections = {};
    for (const sec of sectionsOf(items)) {
      const xs = items.filter((it) => it.kind === sec.key);
      sections[sec.key] = { earned: xs.reduce((s, it) => s + it.earned, 0), max: xs.reduce((s, it) => s + it.max, 0) };
    }
    const total = items.reduce((s, it) => s + it.max, 0);
    const elapsed = Math.min(durOf(session), session.elapsed);
    const sumTime = items.reduce((s, it) => s + it.time, 0);
    let buddy = { mode: session.mode, fires: 0, freezes: 0, logs: 0, cozyPercent: 100 };
    if (session.turnedOff && session.buddyAtOff) buddy = { ...session.buddyAtOff, turnedOff: true };
    else if (fire) buddy = fire.snapshot();
    else if (session.buddy) {
      const s = session.buddy.stats;
      buddy = { mode: session.mode, fires: s.fires, freezes: s.freezes, logs: s.logs, cozyPercent: s.totalSeconds ? Math.round((s.cozySeconds / s.totalSeconds) * 100) : 100 };
    }
    return {
      id: session.id, date: Date.now(), total, earned, percent: total ? Math.round((earned / total) * 1000) / 10 : 0,
      subject: session.subject || "radicals", hintsUsed: items.reduce((s, it) => s + (it.hints || 0), 0),
      sections, totalTime: Math.round(elapsed), avgTime: Math.round((sumTime / items.length) * 10) / 10,
      timedOut, pauses: session.pauses || 0, buddy, items,
      level: session.level || "normal",
      duration: durOf(session), hardcore: !!session.hardcore, drain: !!session.drain, gameOvers: session.gameOvers || 0, goose: !!session.goose,
      group: session.group ? { code: session.group.code, name: session.group.name, scheduled: session.group.scheduled, friends: [] } : null,
    };
  }

  function finishTest(timedOut) {
    if (!session || session.demo) return;
    const now = Date.now();
    if (!session.paused) { const dt = Math.max(0, (now - lastTick) / 1000); session.items[session.current].time += dt; session.elapsed += dt; }
    if (fire) fire.stop();
    const attempt = buildAttempt(timedOut);
    const h = getHistory(); h.push(attempt); store.set(KEYS.history, h);
    store.del(KEYS.session);
    teardownTest();
    showResults(attempt, true);
  }

  async function leaveTest() {
    const ok = await confirmDialog("Leave the test?", "Your answers are saved, but the clock <b>keeps running</b> while you're away. To stop the clock, use <b>Pause</b> instead.", "Leave anyway", "Stay");
    if (!ok) return;
    saveSession();
    teardownTest();
    goHome();
  }

  // ───────────────────────── results ─────────────────────────
  function showResults(attempt, fresh) {
    viewing = attempt;
    reviewFilter = "all";
    show("results");

    const lvName = levelName(levelOf(attempt));
    const h = getHistory().filter((a) => levelOf(a) === levelOf(attempt));
    const ranked = h.slice().sort(compareAttempts);
    const rank = ranked.findIndex((a) => a.id === attempt.id) + 1;
    const prevBest = ranked.filter((a) => a.id !== attempt.id)[0];
    const p = attempt.percent;

    $("#results-eyebrow").textContent = fresh ? (attempt.timedOut ? "Time's up!" : "Test complete") : "Past test";
    $("#results-title").textContent = p >= 90 ? "Outstanding." : p >= 75 ? "Strong work." : p >= 60 ? "Solid — keep pushing." : p >= 40 ? "Good practice. Review below." : "Every test teaches something.";
    $("#results-date").textContent = `${lvName} test${subjectOf(attempt) === "radicals" ? " (radicals unit)" : ""} · taken ${niceDate(attempt.date)}${attempt.pauses ? ` · paused ${attempt.pauses}×` : ""}${attempt.group ? ` · group ${attempt.group.code}` : ""}${attempt.hintsUsed ? ` · ${tr("test.hintsUsed", { n: attempt.hintsUsed })}` : ""}`;

    const banner = $("#best-banner");
    let html, kind = "info";
    if (!prevBest) {
      kind = "best";
      html = `<b>🏆 Your first ${esc(lvName)} test is on the board.</b> That makes it your best so far — next time, try to beat <b>${p}%</b> in <b>${clock(attempt.totalTime)}</b>.`;
    } else if (rank === 1) {
      kind = "best";
      const why = attempt.percent > prevBest.percent ? `${p}% beats your previous best of ${prevBest.percent}%.` : `Same ${p}% as your previous best, but ${dur(prevBest.totalTime - attempt.totalTime)} faster.`;
      html = `<b>🏆 ${fresh ? "New personal best!" : "Your personal best."}</b> Based on mark and time, this is the best of your ${h.length} ${esc(lvName)} tests. ${why}`;
    } else {
      const best = ranked[0];
      const gap = Math.round((best.percent - attempt.percent) * 10) / 10;
      html = `This test ranks <b>#${rank} of ${h.length}</b> ${esc(lvName)} tests by mark and time. Your best is <b>${best.percent}%</b> in ${clock(best.totalTime)} (${esc(niceDate(best.date, false))})` +
        (gap > 0 ? ` — you're ${gap} points away.` : ` — same mark, ${dur(attempt.totalTime - best.totalTime)} faster wins.`);
    }
    banner.className = `best-banner ${kind}`;
    banner.innerHTML = html;

    const times = attempt.items.map((it) => it.time);
    const maxT = Math.max(...times), minT = Math.min(...times);
    const lab = (i) => labelOf(i, attempt.items, levelOf(attempt)).text;
    const unanswered = attempt.items.filter((it) => answeredParts(it) === 0).length;
    $("#stat-grid").innerHTML = `
      <div class="stat stat-score">
        <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" class="ring-track" /><circle cx="60" cy="60" r="50" class="ring-fill" style="stroke-dasharray:${(p / 100) * 314.16} 314.16" /></svg>
        <div><span class="stat-value">${p}%</span><span class="stat-label">${fmtMarks(attempt.earned)} of ${attempt.total} marks</span></div>
      </div>
      <div class="stat"><span class="stat-value">${clock(attempt.totalTime)}</span><span class="stat-label">time used of ${clock(durOf(attempt))}${attempt.drain ? " · Armadillo" : ""}</span></div>
      <div class="stat"><span class="stat-value">${dur(attempt.avgTime)}</span><span class="stat-label">average per question</span></div>
      <div class="stat"><span class="stat-value">${dur(maxT)}</span><span class="stat-label">longest (${lab(times.indexOf(maxT))})</span></div>
      <div class="stat"><span class="stat-value">${dur(minT)}</span><span class="stat-label">quickest (${lab(times.indexOf(minT))})</span></div>
      <div class="stat"><span class="stat-value">${unanswered}</span><span class="stat-label">left blank</span></div>`;

    const secHTML = sectionsOf(attempt.items).map((sec) => {
      const s = attempt.sections[sec.key] || { earned: 0, max: sec.marks };
      const pct = s.max ? Math.round((s.earned / s.max) * 100) : 0;
      const tsec = attempt.items.filter((it) => it.kind === sec.key).reduce((a, it) => a + it.time, 0);
      return `<div class="topic-row"><div class="topic-row-head"><span><b>${sec.name}</b></span><span><b>${fmtMarks(s.earned)}/${s.max}</b> <span class="muted">· ${dur(tsec)}</span></span></div>
        <div class="bar"><div class="bar-fill ${pct >= 75 ? "good" : pct >= 50 ? "mid" : "low"}" style="width:${pct}%"></div></div></div>`;
    }).join("");
    const topics = new Map();
    for (const it of attempt.items) {
      const q = qOf(it); if (!q) continue;
      const t = topics.get(q.topic) || { e: 0, m: 0 };
      t.e += it.earned; t.m += it.max; topics.set(q.topic, t);
    }
    const topHTML = [...topics.entries()].sort((a, b) => a[1].e / a[1].m - b[1].e / b[1].m).map(([name, t]) => {
      const pct = Math.round((t.e / t.m) * 100);
      return `<div class="topic-row"><div class="topic-row-head"><span>${esc(name)}</span><span><b>${fmtMarks(t.e)}/${t.m}</b></span></div>
        <div class="bar"><div class="bar-fill ${pct >= 75 ? "good" : pct >= 50 ? "mid" : "low"}" style="width:${pct}%"></div></div></div>`;
    }).join("");
    $("#topic-breakdown").innerHTML = `${secHTML}<h3 class="sub-h">By topic <span class="muted small">(weakest first)</span></h3>${topHTML}`;

    const b = attempt.buddy || { mode: "off" };
    const noBuddy = b.mode === "off" && !b.turnedOff && !attempt.goose;
    $("#buddy-card").hidden = noBuddy; $("#results-grid").classList.toggle("solo", noBuddy);
    let verdict;
    if (attempt.goose) verdict = "🪿 Goose Mode: no campfire to tend this time — just the goose and its mischief.";
    else if (b.turnedOff) verdict = "🧯 You turned the campfire off partway through to focus on the math. Smart call.";
    else if (b.mode === "off") verdict = "This test was taken in No campfire mode.";
    else if (attempt.gameOvers) verdict = `💀 Game over ${attempt.gameOvers === 1 ? "once" : attempt.gameOvers + " times"} — but you kept going with the test. Math first!`;
    else if (b.kettleDeaths || b.oxygenDeaths) verdict = `💥 ${[b.kettleDeaths ? `The kettle blew ${b.kettleDeaths === 1 ? "once" : b.kettleDeaths + " times"}` : "", b.oxygenDeaths ? `the fire smothered ${b.oxygenDeaths === 1 ? "once" : b.oxygenDeaths + " times"}` : ""].filter(Boolean).join(" and ")}. Keep an eye on the valve and the bellows!`;
    else if (!b.fires && !b.freezes && b.cozyPercent >= 80) verdict = "🐶 Your puppy had a perfect night. Warm, cozy, and proud of you.";
    else if (!b.fires && !b.freezes) verdict = "🐶 No disasters — but your puppy got a little chilly or toasty at times.";
    else if (b.fires && b.freezes) verdict = "🐶 Fire <i>and</i> ice. Your puppy has been through a lot tonight.";
    else if (b.fires) verdict = `🔥 The camp burned down ${b.fires === 1 ? "once" : b.fires + " times"}. Easy on the logs!`;
    else verdict = `🧊 Your puppy froze ${b.freezes === 1 ? "once" : b.freezes + " times"}. Don't forget them while you calculate!`;
    $("#buddy-report").innerHTML = `<p class="buddy-verdict">${verdict}</p>${b.mode === "off" && !b.turnedOff ? "" : `
      <div class="mini-stats">
        <div><span class="stat-value">${b.cozyPercent}%</span><span class="stat-label">time cozy</span></div>
        <div><span class="stat-value">${b.logs}</span><span class="stat-label">logs added</span></div>
        <div><span class="stat-value">${b.fires}</span><span class="stat-label">fires</span></div>
        <div><span class="stat-value">${b.freezes}</span><span class="stat-label">freezes</span></div>
      </div>
      ${b.companion ? `<p class="small comp-report">Companion: ${b.companion.events} event${b.companion.events === 1 ? "" : "s"} weathered${b.companion.windShifts ? ` · ${b.companion.windShifts} wind shift${b.companion.windShifts === 1 ? "" : "s"}` : ""}${b.companion.lidPops ? ` · ${b.companion.lidPops} kettle blowout${b.companion.lidPops === 1 ? "" : "s"}` : ""}${b.companion.hailHits ? ` · ${b.companion.hailHits} hail bump${b.companion.hailHits === 1 ? "" : "s"}` : ""}${b.companion.tentSeconds ? ` · ${b.companion.tentSeconds}s of puppy naps in the tent` : ""}.</p>` : ""}
      <p class="muted small">Mode: ${esc(window.Campfire.MODES[b.mode]?.label || b.mode)}. The buddy never affects your mark.</p>`}`;

    renderGroupBoard(attempt);
    for (const btn of $$("#review-filter button")) btn.classList.toggle("active", btn.dataset.filter === reviewFilter);
    renderReview();
  }

  function keyTeX(p) {
    if (window.QuadCheck && window.QuadCheck.handles(p.kind)) return p.kind === "plot" ? plotSVG(null, p) : tex(window.QuadCheck.keyTeX(p));
    if (p.kind === "graph") return plotSVG(null, p);
    if (window.AnswerCheck && window.AnswerCheck.handles(p.kind)) return tex(window.AnswerCheck.keyTeX(p));
    return p.kind === "choice" ? esc(p.answer)
      : p.kind === "set" ? (p.answer.length ? tex(p.answer.map((x) => `x = ${Check.read(x).tex}`).join(",\\ ")) : tex("\\text{none}"))
      : p.kind === "restriction" ? tex(Check.readRestriction(`x${p.answer.op}${p.answer.value}`).tex)
      : p.kind === "number" ? tex(p.ansTex || String(p.answer))
      : tex(p.ansTex || Check.read(p.answer).tex);
  }
  function answerTeX(raw, kind, part) {
    if (!String(raw || "").trim()) return `<span class="muted">(blank)</span>`;
    if (kind === "plot" || kind === "graph") return plotSVG(raw, part);
    if (window.AnswerCheck && window.AnswerCheck.handles(kind)) { const r = window.AnswerCheck.read(kind, raw); return r.ok ? tex(r.tex) : `<code>${esc(raw)}</code>`; }
    const r = kind === "set" ? Check.readSet(raw) : kind === "restriction" ? Check.readRestriction(raw) : window.QuadCheck && window.QuadCheck.handles(kind) ? window.QuadCheck.read(kind, raw) : Check.read(raw);
    return r.ok ? tex(r.tex) : `<code>${esc(raw)}</code>`;
  }
  // a small graph of a plotted answer (solid) over the key (dashed); either may be missing
  function plotSVG(raw, part) {
    if (!window.Graph || !part) return "";
    const fns = [], styles = [];
    if (part.kind === "graph") {
      const g = raw ? window.AnswerCheck.readGraph(raw) : null;
      const pts = [];
      if (g && g.ok) { pts.push({ x: g.h, y: g.k, label: "V" }, ...g.pts.map((q) => ({ x: q[0], y: q[1] }))); }
      // after marking, the correct parabola (dashed) is drawn under the learner's points so differences show
      return `<span class="plot-mini">${window.Graph.svg({ fns: [part.answer], styles: ["alt"], points: pts, window: part.window && part.window.x0 !== undefined ? part.window : undefined, marks: { vertex: !raw, axis: !raw }, w: 240, h: 200, title: raw ? "Your points over the correct parabola (dashed)" : "The correct parabola" })}</span>`;
    }
    const r = raw ? window.QuadCheck.readPlot(raw) : null;
    if (r && r.ok) { fns.push({ a: window.QuadMath.fstr(r.a), h: window.QuadMath.fstr(r.h), k: window.QuadMath.fstr(r.k) }); styles.push(""); }
    if (!raw) { fns.push(part.answer); styles.push("alt"); }
    if (!fns.length) return `<code>${esc(raw)}</code>`;
    return `<span class="plot-mini">${window.Graph.svg({ fns, styles, window: part.window && part.window.x0 !== undefined ? part.window : undefined, marks: { vertex: true }, w: 240, h: 190, title: raw ? "Your parabola" : "The correct parabola" })}</span>`;
  }

  function renderReview() {
    const a = viewing;
    const maxT = Math.max(1, ...a.items.map((it) => it.time));
    let rows = a.items.map((it, i) => ({ it, i }));
    if (reviewFilter === "wrong") rows = rows.filter((r) => r.it.earned < r.it.max);
    if (reviewFilter === "flagged") rows = rows.filter((r) => r.it.flagged);
    if (reviewFilter === "slow") rows = rows.slice().sort((x, y) => y.it.time - x.it.time);
    if (!rows.length) {
      $("#review-list").innerHTML = `<p class="empty muted">${reviewFilter === "wrong" ? "Full marks — nothing to fix! 🎉" : "No flagged questions on this test."}</p>`;
      return;
    }
    let lastKind = null;
    $("#review-list").innerHTML = rows.map(({ it, i }) => {
      const q = qOf(it);
      const L = labelOf(i, a.items, levelOf(a));
      let sectionHead = "";
      if (reviewFilter !== "slow" && it.kind !== lastKind) {
        const s = a.sections[it.kind];
        sectionHead = `<h3 class="review-section">${L.sec.name} <span class="muted">${s ? fmtMarks(s.earned) + "/" + s.max : ""}</span></h3>`;
        lastKind = it.kind;
      }
      if (!q) return sectionHead + `<div class="review-item"><p class="muted">${L.text} is no longer in the question bank.</p></div>`;
      const blank = answeredParts(it) === 0;
      const status = blank ? "skipped" : it.earned >= it.max ? "right" : it.earned > 0 ? "partial" : "wrong";
      const statusLabel = { right: "Full marks", partial: "Part marks", wrong: "No marks", skipped: "Blank" }[status];
      const head = `
        <header class="review-item-head">
          <span class="review-num">${L.text}</span>
          <span class="status-pill ${status}">${statusLabel} · ${fmtMarks(it.earned)}/${it.max}</span>
          ${it.flagged ? '<span class="pill">⚑ Flagged</span>' : ""}${it.hints ? `<span class="pill pill-hint">${esc(tr("test.hintsUsed", { n: it.hints }))}</span>` : ""}
          <span class="topic-tag">${esc(q.topic)}</span>
          <span class="review-time" title="Time spent on this question"><span class="time-bar"><span style="width:${(it.time / maxT) * 100}%"></span></span>${dur(it.time)}</span>
        </header>`;
      let bodyHTML = "";
      if (it.kind === "mc") {
        const choices = it.order.map((orig, di) => {
          const cls = orig === 0 ? "is-correct" : orig === it.chosen ? "is-chosen-wrong" : "";
          const tag = orig === 0 && orig === it.chosen ? "Your answer ✓" : orig === 0 ? "Correct answer" : orig === it.chosen ? "Your answer" : "";
          return `<li class="${cls}"><span class="choice-letter">${LETTERS[di]}</span><span class="choice-body">${renderMath(q.c[orig])}</span>${tag ? `<span class="choice-tag">${tag}</span>` : ""}</li>`;
        }).join("");
        const slip = it.chosen !== null && it.chosen !== 0 && q.why && q.why[it.chosen] ? `<p class="part-note">Likely slip: ${renderMath(q.why[it.chosen])}</p>` : "";
        bodyHTML = `<div class="q-text">${renderMath(q.q)}</div><ul class="review-choices">${choices}</ul>${slip}
          <details class="explain"${status !== "right" ? " open" : ""}><summary>How to solve it</summary><div>${renderMath(q.e)}</div></details>`;
      } else if (it.kind === "nr") {
        const ok = it.earned >= 1;
        bodyHTML = `<div class="q-text">${renderMath(q.q)}</div>
          <div class="answer-compare">
            <div class="${ok ? "is-correct" : blank ? "" : "is-chosen-wrong"}"><span class="cmp-label">Your answer</span>${answerTeX(it.response)}</div>
            ${ok ? "" : `<div class="is-correct"><span class="cmp-label">Correct answer</span>${tex(q.ansTex || String(q.answer))}</div>`}
          </div>
          <details class="explain"${ok ? "" : " open"}><summary>How to solve it</summary><div>${renderMath(q.e)}</div></details>`;
      } else {
        const g = gradeItem(it);
        const parts = q.parts.map((p, k) => {
          const pg = g.parts[k];
          const raw = it.responses[p.key];
          const yours = p.kind === "choice" ? (raw ? esc(raw) : `<span class="muted">(blank)</span>`) : answerTeX(raw, p.kind, p);
          const correct = keyTeX(p);
          const cls = pg.verdict === "right" ? "is-correct" : pg.verdict === "partial" ? "is-partial" : pg.verdict === "blank" ? "" : "is-chosen-wrong";
          return `<div class="part-review ${cls}">
            <div class="part-head">${p.label ? `<span class="part-label">${p.label}</span>` : ""}<span class="part-prompt">${renderMath(p.prompt)}</span><span class="marks-badge ${pg.verdict}">${fmtMarks(pg.earned)}/${pg.max}</span></div>
            <div class="part-answers"><span><span class="cmp-label">You</span>${yours}</span>${pg.verdict === "right" ? "" : `<span><span class="cmp-label">Key</span>${correct}</span>`}</div>
            ${pg.note && pg.verdict !== "right" && pg.verdict !== "blank" ? `<p class="part-note">${esc(window.I18N ? window.I18N.note(pg.note) : pg.note)}</p>` : ""}
          </div>`;
        }).join("");
        bodyHTML = `<div class="q-text">${renderMath(q.intro)}</div>${parts}
          ${it.work ? `<div class="your-work"><span class="cmp-label">Your typed steps</span><pre>${esc(it.work)}</pre></div>` : ""}
          <details class="explain"${status !== "right" ? " open" : ""}><summary>Worked solution &amp; marking key</summary>
            <div>${q.solution.map((s) => `<p>${renderMath(s)}</p>`).join("")}
              <p class="rubric-title">Marking key</p><ul class="rubric">${q.rubric.map((r) => `<li>${renderMath(r)}</li>`).join("")}</ul></div>
          </details>`;
      }
      const cids = window.Concepts.conceptsFor(q);
      const learnRow = `<div class="review-learn">${cids.map((c) => `<button class="btn btn-secondary btn-sm" data-lesson="${c}" type="button">Lesson: ${esc(window.Concepts.get(c).title)}</button>`).join("")}${it.earned < it.max ? `<button class="btn btn-primary btn-sm" data-explain="${i}" type="button">Explain my mistake</button>` : `<button class="btn btn-secondary btn-sm" data-explain="${i}" type="button">Ask the tutor</button>`}</div>`;
      bodyHTML += learnRow;
      const sketch = it.sketch && it.sketch.length ? `<div class="sketch-review"><span class="cmp-label">Your scratch work</span><canvas data-sketch="${i}" aria-label="Your scratch work for ${L.text}"></canvas></div>` : "";
      bodyHTML = bodyHTML.replace(/<details class="explain"/, sketch + '<details class="explain"');
      return `${sectionHead}<article class="review-item ${status}">${head}${bodyHTML}</article>`;
    }).join("");
    if (window.Scratchpad) for (const cv of $$("canvas[data-sketch]")) window.Scratchpad.render(a.items[Number(cv.dataset.sketch)].sketch, cv);
  }

  // ───────────────────────── group tests ─────────────────────────
  let lobby = null;
  const inviteLink = (code) => `${location.origin}${location.pathname}#g-${window.Group.normalize(code)}`;

  async function copyText(text, inputEl, noteEl) {
    try {
      await navigator.clipboard.writeText(text);
      if (noteEl) noteEl.textContent = "Copied!";
    } catch {
      if (inputEl) { inputEl.focus(); inputEl.select(); }
      if (noteEl) noteEl.textContent = "Selected — press Ctrl+C (or ⌘C) to copy.";
    }
    if (noteEl) { clearTimeout(noteEl._t); noteEl._t = setTimeout(() => { noteEl.textContent = ""; }, 3000); }
  }

  function openLobby(g) {
    if (lobby && lobby.timer) clearInterval(lobby.timer);
    lobby = { g };
    show("lobby");
    const sc = $("#lobby-scene");
    sc.innerHTML = "";
    const scene = makeScene();
    scene.classList.add("is-cozy");
    scene.style.setProperty("--heat", "58");
    sc.appendChild(scene);
    $("#lobby-code").textContent = g.code;
    $("#lobby-link").value = inviteLink(g.code);
    $("#lobby-name").value = g.name || getPrefs().name || "";
    const bm = getPrefs().buddyMode;
    for (const b of $$("#lobby-buddy button")) { const on = b.dataset.mode === bm; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); }
    $("#copy-note").textContent = "";
    updateLobby();
    lobby.timer = setInterval(updateLobby, 250);
  }

  function updateLobby() {
    if (!lobby || document.body.dataset.screen !== "lobby") return;
    const g = lobby.g, now = Date.now();
    const lvl = levelName(g.level);
    const startBtn = $("#btn-lobby-start"), cd = $("#lobby-countdown");
    if (!g.start) {
      $("#lobby-title").textContent = "Ready when you are";
      $("#lobby-sub").innerHTML = `<b>${esc(lvl)}</b> group test. Everyone with this code gets the same questions in the same order. Each person's ${g.minutes || 60} minutes start when they press Start, and Pause still works.`;
      cd.hidden = true; startBtn.disabled = false; startBtn.textContent = "Start test";
      lobby.mode = "flex";
    } else if (now < g.start) {
      const left = (g.start - now) / 1000;
      $("#lobby-title").textContent = "Waiting for the group";
      $("#lobby-sub").innerHTML = `<b>${esc(lvl)}</b> group test, ${g.minutes || 60} minutes, with a shared clock: everyone starts together and finishes at the same moment. Share the code with your friends.`;
      cd.hidden = false;
      $("#cd-value").textContent = clock(left);
      $("#cd-at").textContent = `at ${new Date(g.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
      startBtn.disabled = true; startBtn.textContent = "Starts automatically";
      lobby.mode = "wait";
      if (left <= 0.3) startFromLobby();
    } else if (now < g.start + (g.minutes || 60) * 60000) {
      const left = (g.minutes || 60) * 60 - (now - g.start) / 1000;
      $("#lobby-title").textContent = "The group test is underway";
      $("#lobby-sub").innerHTML = `<b>${esc(lvl)}</b> group test. You'll join with <b>${clock(left)}</b> left, because the group shares one clock.`;
      cd.hidden = true; startBtn.disabled = false; startBtn.textContent = "Join now";
      lobby.mode = "late";
    } else {
      $("#lobby-title").textContent = "This group test has finished";
      $("#lobby-sub").innerHTML = `The group's hour is over, but you can still take the same <b>${esc(lvl)}</b> questions on your own clock and compare results with the group afterwards.`;
      cd.hidden = true; startBtn.disabled = false; startBtn.textContent = "Take it on my own clock";
      lobby.mode = "over";
    }
  }

  async function startFromLobby() {
    if (!lobby) return;
    const name = $("#lobby-name").value.trim().slice(0, 18);
    setPrefs({ name });
    const g = { ...lobby.g, name };
    if (lobby.mode === "over") g.start = 0;
    if (savedSession()) {
      if (lobby.mode === "wait") { store.del(KEYS.session); } // the countdown can't wait on a dialog
      else if (!(await confirmDialog("Start the group test?", "You have an unfinished test. Starting the group test will discard it.", "Start group test", "Cancel"))) return;
    }
    store.del(KEYS.session);
    clearInterval(lobby.timer);
    lobby = null;
    if (location.hash.startsWith("#g-")) history.replaceState(null, "", location.pathname + location.search);
    startTest({ group: g });
  }

  function leaveLobby() {
    if (lobby) clearInterval(lobby.timer);
    lobby = null;
    if (location.hash.startsWith("#g-")) history.replaceState(null, "", location.pathname + location.search);
    goHome();
  }

  // ───────── Create test (setup dialog) ─────────
  function openSetup(opts = {}) {
    const p = getPrefs();
    const d = $("#setup-dialog");
    const pick = (sel, attr, val) => { for (const b of $$(`${sel} button`)) { const on = b.dataset[attr] === String(val); b.classList.toggle("active", on); b.setAttribute("aria-checked", on); } };
    pick("#s-level", "level", TEST_LEVELS.includes(opts.level) ? opts.level : p.level);
    pick("#s-buddy", "mode", p.buddyMode === "off" ? "normal" : p.buddyMode);
    $("#s-camp").checked = p.buddyMode !== "off";
    $("#s-camp-custom").open = false;
    pick("#s-start", "start", 0);
    $("#s-time").value = p.minutes || 60;
    $("#s-hardcore").checked = !!p.hardcore;
    $("#s-drain").checked = !!p.drain;
    $("#s-group").checked = !!opts.group;
    $("#s-name").value = p.name || "";
    if (window.Companion) {
      // a campfire that's on but was never customised starts as the full minigame
      const c = p.buddyMode !== "off" && p.companion ? window.Companion.normalize(p.companion) : window.Companion.normalize(window.Companion.full());
      compDraft = { mech: { ...c.mech }, events: c.events, picked: [...c.picked] };
      renderCompSetup();
    }
    syncSetup();
    d.returnValue = "cancel";
    d.showModal();
  }
  // ───────── Campfire minigame setup (inside Create test) ─────────
  // One master switch: off = no campfire at all; on = the full minigame (every mechanic and event),
  // with "Customize" for anyone who wants less. The two ends are what we steer people toward.
  let compDraft = null;
  const campMode = () => ($("#s-camp").checked ? activeVal("#s-buddy", "mode", "normal") : "off");
  function onCampMaster() {
    const on = $("#s-camp").checked;
    if (on && window.Companion) { compDraft = window.Companion.full(); $("#s-hardcore").checked = false; $("#s-drain").checked = false; $("#s-camp-custom").open = false; }
    renderCompSetup();
    syncSetup();
  }
  function renderCompSetup() {
    const CP = window.Companion;
    if (!CP) { $("#s-comp").hidden = true; return; }
    const c = CP.normalize(compDraft);
    $("#s-comp-mech").innerHTML = CP.MECHANICS.map((m) => `<label class="cs-mech-row${c.mech[m.id] ? " on" : ""}"><input type="checkbox" data-mech="${m.id}" ${c.mech[m.id] ? "checked" : ""} /><span class="cs-ico" aria-hidden="true">${m.icon}</span><span class="cs-t"><b>${esc(m.name)}</b><small>${esc(m.desc)}</small></span></label>`).join("");
    $("#s-comp-events").checked = c.events;
    $("#s-comp-ev").hidden = !c.events;
    const picked = new Set(c.picked);
    const openCats = $$("#s-comp-list details").length ? new Set($$("#s-comp-list details[open]").map((d) => d.dataset.cat)) : new Set(["peaceful", "moderate"]);
    $("#s-comp-list").innerHTML = CP.CATS.map(([cat, title]) => `<details class="cs-cat" data-cat="${cat}" ${openCats.has(cat) ? "open" : ""}><summary>${esc(title)} <span class="faint">${CP.EVENTS.filter((e) => e.cat === cat && c.active.includes(e.id)).length}/${CP.EVENTS.filter((e) => e.cat === cat).length}</span></summary>
      ${CP.EVENTS.filter((e) => e.cat === cat).map((e) => { const blocked = e.needs && !c.mech[e.needs]; const needName = blocked ? CP.MECHANICS.find((m) => m.id === e.needs).name : ""; return `<label class="cs-ev-row${blocked ? " blocked" : ""}" ${blocked ? `title="Turn on ${esc(needName)} to use this event"` : ""}><input type="checkbox" data-ev="${e.id}" ${picked.has(e.id) && !blocked ? "checked" : ""} ${blocked ? "disabled" : ""} /><span class="cs-ico" aria-hidden="true">${e.icon}</span><span class="cs-t"><span class="cs-line"><b>${esc(e.name)}</b> <i class="cs-tag t-${e.tag.toLowerCase()}">${esc(e.tag)}</i></span><small>${esc(e.desc)}${blocked ? ` <em>Needs ${esc(needName)}.</em>` : ""}</small></span></label>`; }).join("")}</details>`).join("");
    $("#s-comp-count").textContent = `${c.active.length} of ${CP.EVENTS.length} can happen`;
    const full = CP.isFull(c);
    $("#s-camp-full").classList.toggle("is-custom", !full);
    $("#s-camp-reset").hidden = full;
    $("#s-camp-full-text").textContent = full ? "Your puppy, the fire and every mechanic and event. The most fun way to play. Math still comes first: events never pause the test." : `Customized: ${CP.summary(c) || "classic campfire (heat and logs only)"}. The full set is the recommended way to play.`;
    $("#s-camp-custom-sum").textContent = full ? "· everything on" : "· " + (CP.summary(c) || "heat and logs only");
    for (const el of $$("#s-comp input, #s-comp button")) el.disabled = !!(el.dataset.ev && el.closest(".blocked"));
    $("#s-comp-sum").textContent = c.any ? `Selected: ${CP.summary(c)}. Math comes first: events wait while you're typing an answer.` : "Classic campfire: just heat and logs.";
  }
  function onCompSetup(e) {
    const CP = window.Companion;
    const t = e.target;
    if (t.dataset.mech) { compDraft.mech[t.dataset.mech] = t.checked; return renderCompSetup(); }
    if (t.id === "s-comp-events") { compDraft.events = t.checked; return renderCompSetup(); }
    if (t.dataset.ev) { const set = new Set(compDraft.picked); if (t.checked) set.add(t.dataset.ev); else set.delete(t.dataset.ev); compDraft.picked = [...set]; return renderCompSetup(); }
    const tool = t.closest && t.closest("[data-cs]");
    if (tool) {
      if (tool.dataset.cs === "all") compDraft.picked = CP.EVENTS.map((x) => x.id);
      if (tool.dataset.cs === "none") compDraft.picked = [];
      if (tool.dataset.cs === "reset") compDraft = CP.full();
      renderCompSetup();
    }
  }
  const activeVal = (sel, attr, dflt) => (($(`${sel} button.active`) || {}).dataset || {})[attr] ?? dflt;
  function syncSetup() {
    const picked = activeVal("#s-level", "level", "normal");
    const isNm = picked === "nightmare";
    const level = picked;
    const mode = campMode();
    const group = $("#s-group").checked;
    const startMin = Number(activeVal("#s-start", "start", 0));
    const mins = Number($("#s-time").value);
    $("#s-time-out").textContent = `${mins} min`;
    $("#s-time").style.setProperty("--fill", `${((mins - 10) / 110) * 100}%`);
    $("#s-level-hint").textContent = LEVELS[level].hint;
    const fireOn = mode !== "off";
    $("#s-hardcore").disabled = !fireOn;
    $("#s-drain").disabled = !fireOn || (group && startMin > 0);
    $("#s-camp-body").hidden = !fireOn;
    $("#s-camp-hint").textContent = fireOn ? "On: a puppy and a campfire to look after while you work. Never affects your mark." : "Off: just you and the test. Best when you want to concentrate.";
    $("#s-fire-note").textContent = !fireOn ? ""
      : group && startMin > 0 ? "Armadillo mode is off for shared-clock group tests, so everyone's clock stays in sync." : "";
    $("#s-group-options").hidden = !group;
    $("#s-start-hint").textContent = startMin
      ? `Everyone starts together in ${startMin} minutes and finishes at the same moment. Pause is off so the clocks stay in sync.`
      : "Each person's clock starts when they press Start, and Pause still works.";
    $("#s-go").textContent = group ? "Create group test" : isNm ? tr("mode.start.nightmare") : "Start test";
    $("#setup-title").textContent = group ? "Create a group test" : "Create test";
  }
  async function submitSetup() {
    const level = activeVal("#s-level", "level", "normal");
    if (!TEST_LEVELS.includes(level)) return;
    const buddyMode = campMode();
    const minutes = Number($("#s-time").value) || 60;
    const group = $("#s-group").checked;
    const name = $("#s-name").value.trim().slice(0, 18);
    setPrefs({ level, mode: level, buddyMode, minutes, hardcore: $("#s-hardcore").checked, drain: $("#s-drain").checked, ...(compDraft ? { companion: compDraft } : {}), ...(group ? { name } : {}) });
    if (group) {
      const startMin = Number(activeVal("#s-start", "start", 0));
      const seed = (crypto.getRandomValues(new Uint32Array(1))[0] & 0x7ffff) || 1;
      const start = startMin ? Math.ceil((Date.now() + startMin * 60000) / 60000) * 60000 : 0;
      const g = window.Group.decodeGroup(window.Group.encodeGroup({ level, seed, start, minutes }));
      return openLobby({ ...g, name });
    }
    if (savedSession() && !(await confirmDialog("Start over?", "You have an unfinished test. Starting a new one will discard it.", "Start new test", "Cancel"))) return;
    store.del(KEYS.session);
    startTest();
  }

  function joinGroup(code) {
    const room = window.Group.decodeRoom(code);
    if (room && window.Rooms) { $("#join-error").textContent = ""; $("#join-code").value = ""; return window.Rooms.join(room); }
    const g = window.Group.decodeGroup(code);
    if (!g) { $("#join-error").textContent = "That code isn't valid — check it for typos."; return; }
    if (!TEST_LEVELS.includes(g.level)) { $("#join-error").textContent = "That code is for Tim's Test, which was retired when the class moved on to quadratics. Ask for a new code."; return; }
    $("#join-error").textContent = "";
    $("#join-code").value = "";
    openLobby(g);
  }

  function saveAttempt(a) {
    const h = getHistory();
    const k = h.findIndex((x) => x.id === a.id);
    if (k >= 0) { h[k] = a; store.set(KEYS.history, h); }
  }

  function renderGroupBoard(a) {
    const el = $("#group-board");
    if (!a.group) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    const G = window.Group;
    const myName = a.group.name || "You";
    const mine = { name: myName, earned: a.items.map((it) => it.earned), time: a.totalTime, me: true };
    const myCode = G.encodeResult({ group: a.group.code, name: myName, earned: mine.earned, time: mine.time });
    const friends = (a.group.friends || []).map((c) => ({ code: c, ...G.decodeResult(c) })).filter((f) => f.earned);
    const maxes = a.items.map((it) => it.max);
    const rows = [mine, ...friends].map((r) => ({ ...r, total: r.earned.reduce((x, y) => x + y, 0) }))
      .sort((x, y) => y.total - x.total || x.time - y.time);
    const labels = a.items.map((_, i) => labelOf(i, a.items, levelOf(a)).text);
    const missed = labels.filter((_, i) => rows.every((r) => (r.earned[i] || 0) < maxes[i]));
    const cell = (e, m) => e >= m ? `<td class="gc full" title="${e}/${m}">✓</td>` : e > 0 ? `<td class="gc part" title="${e}/${m}">${e}</td>` : `<td class="gc none" title="0/${m}">✗</td>`;

    el.innerHTML = `
      <div class="card-head"><h2>Group scoreboard</h2><span class="muted small">Group ${esc(a.group.code)}</span></div>
      <div class="gb-grid">
        <div class="gb-share">
          <p class="gb-step"><b>1.</b> Send your result code to the group chat:</p>
          <div class="join-row"><input class="text-input" id="my-result" readonly value="${esc(myCode)}" aria-label="Your result code" /><button class="btn btn-secondary" id="btn-copy-result" type="button">Copy</button></div>
          <p class="copy-note" id="result-note" role="status"></p>
          <p class="gb-step"><b>2.</b> Paste your friends' codes here (one per line):</p>
          <textarea class="text-input" id="friend-codes" rows="3" placeholder="CP-..."></textarea>
          <div class="gb-add"><button class="btn btn-primary" id="btn-add-friends" type="button">Add to scoreboard</button><span class="form-error" id="friend-error" role="alert"></span></div>
        </div>
        <div class="gb-board">
          <table class="score-table">
            <thead><tr><th>#</th><th>Name</th><th>Mark</th><th>Time</th><th class="sr-only">Remove</th></tr></thead>
            <tbody>${rows.map((r, k) => `
              <tr class="${r.me ? "me" : ""}"><td>${k + 1}</td><td>${esc(r.name)}${r.me ? ' <span class="muted small">(you)</span>' : ""}</td>
                <td><b>${Math.round((r.total / a.total) * 1000) / 10}%</b> <span class="muted">${fmtMarks(r.total)}/${a.total}</span></td>
                <td>${clock(r.time)}</td>
                <td>${r.me ? "" : `<button class="btn btn-link gb-remove" data-code="${esc(r.code)}" type="button" aria-label="Remove ${esc(r.name)}">Remove</button>`}</td></tr>`).join("")}
            </tbody>
          </table>
          ${friends.length ? "" : `<p class="muted small">Only you so far. Add your friends' codes to compare.</p>`}
        </div>
      </div>
      ${friends.length ? `
        <h3 class="sub-h">Question by question</h3>
        <div class="table-scroll"><table class="q-matrix">
          <thead><tr><th>Name</th>${labels.map((l) => `<th>${esc(l)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((r) => `<tr><th>${esc(r.name)}</th>${maxes.map((m, i) => cell(r.earned[i] || 0, m)).join("")}</tr>`).join("")}</tbody>
        </table></div>
        <p class="gb-discuss">${missed.length ? `🗣 <b>Talk these through together</b> — nobody got full marks: ${missed.map(esc).join(", ")}.` : "🎉 Between you, every question got full marks from someone. Teach each other!"}</p>` : ""}`;

    $("#btn-copy-result").onclick = () => copyText(myCode, $("#my-result"), $("#result-note"));
    $("#btn-add-friends").onclick = () => {
      const lines = $("#friend-codes").value.split(/\s+/).map((x) => x.trim()).filter(Boolean);
      const err = $("#friend-error");
      let added = 0, wrongGroup = 0, invalid = 0;
      for (const line of lines) {
        const r = G.decodeResult(line);
        if (!r) { invalid++; continue; }
        if (r.group !== G.normalize(a.group.code)) { wrongGroup++; continue; }
        if (line === myCode || (a.group.friends || []).includes(line)) continue;
        a.group.friends = [...(a.group.friends || []), line];
        added++;
      }
      saveAttempt(a);
      renderGroupBoard(a);
      const msgs = [];
      if (wrongGroup) msgs.push(`${wrongGroup} code${wrongGroup > 1 ? "s are" : " is"} from a different group test`);
      if (invalid) msgs.push(`${invalid} code${invalid > 1 ? "s" : ""} couldn't be read`);
      if (msgs.length) $("#friend-error").textContent = msgs.join("; ") + ".";
    };
    for (const b of $$(".gb-remove", el)) b.onclick = () => { a.group.friends = a.group.friends.filter((c) => c !== b.dataset.code); saveAttempt(a); renderGroupBoard(a); };
  }

  // ───────── practice copy of a test for the test-taking tutorial (session.demo: never saved, marked or recorded) ─────────
  // No campfire: the minigame has its own tutorial and is never part of this one.
  let demoState = null;
  const demo = {
    start() {
      if (session && !session.demo) return null;
      const now = Date.now();
      const QB = window.QuadBank, rnd = window.Group.rng(20261016);
      const reg = (q, kind) => { BANKS[kind].set(q.id, q); return q; };
      const wr = reg(QB.generate("vform", "wr", "normal", rnd), "wr"), plot = reg(QB.generate("sketch", "wr", "normal", rnd), "wr");
      const nr = reg(QB.generate("yint", "nr", "normal", rnd), "nr"), mcq = reg(QB.generate("matchgraph", "mc", "simple", rnd), "mc");
      session = {
        id: "demo", demo: true, startedAt: now, elapsed: 0, lastActive: now, paused: false, pauses: 0, level: "normal", subject: "quadratics",
        items: [wrItem(wr), wrItem(plot), nrItem(nr), mcItem(mcq, rnd)], current: 0, mode: "off", buddy: null,
      };
      demoState = { qs: [wr, plot, nr, mcq] };
      enterTest();
      return demoState;
    },
    goTo(k) { if (session && session.demo && session.current !== k) { session.current = k; renderQuestion(); } },
    firstPart(k) { const q = demoState && demoState.qs[k]; return q && q.parts ? q.parts[0].key : null; },
    // grade one part with the real marking engine; nothing is stored
    check(k, partKey) {
      if (!session || !session.demo) return null;
      const item = session.items[k], q = qOf(item); if (!q || !q.parts) return null;
      const part = q.parts.find((p) => p.key === partKey) || q.parts[0];
      const resp = (item.responses || {})[part.key] || "";
      if (!String(resp).trim()) return { blank: true, max: part.marks };
      const g = Check.grade(part, resp);
      return { earned: g.earned, max: g.max, note: g.note || "", blank: g.verdict === "blank" };
    },
    fill(k, partKey) {
      if (!session || !session.demo) return;
      const item = session.items[k], q = qOf(item); const part = q.parts.find((p) => p.key === partKey) || q.parts[0];
      const v = window.QuadCheck && window.QuadCheck.handles(part.kind) ? window.QuadCheck.keyResponse(part) : String(part.answer);
      item.responses[part.key] = v;
      session.current = k; renderQuestion();
      const inp = $(`#q-body input[data-part="${part.key}"]`); if (inp) { inp.value = v; inp.dispatchEvent(new Event("input", { bubbles: true })); }
    },
    end() {
      if (!session || !session.demo) return;
      if (pad) pad.setPage([], "");
      teardownTest();
      demoState = null;
    },
  };

  // ───────── campfire hooks for the minigame tutorial: hold the clock and the fire while it runs ─────────
  let tutorialHold = false;
  const game = {
    active: () => !!(session && !session.demo && fire && session.mode !== "off" && document.body.dataset.screen === "test" && !session.paused && !session.gameOver),
    cfg: () => ({ mech: (session && session.companion && session.companion.mech) || {}, events: !!(session && session.companion && session.companion.events && (session.companion.active || session.companion.picked || []).length), hardcore: !!(session && session.hardcore), drain: !!(session && session.drain) }),
    logs: () => (fire ? fire.stats.logs : 0),
    hold(on) {
      tutorialHold = !!on;
      if (!session) return;
      tick();
      lastTick = Date.now();
      if (on) { if (fire) fire.stop(); }
      else if (fire && !session.paused && !session.gameOver && session.mode !== "off") fire.start();
    },
  };
  function maybeGameTutorial() { if (window.Onboarding && game.active()) window.Onboarding.onGameOpen(); }

  // ───────────────────────── dialog ─────────────────────────
  function confirmDialog(title, bodyHtml, okLabel, cancelLabel) {
    const d = $("#dialog");
    $("#dialog-title").textContent = title;
    $("#dialog-body").innerHTML = bodyHtml;
    $("#dialog-ok").textContent = okLabel;
    $("#dialog-cancel").textContent = cancelLabel;
    return new Promise((resolve) => {
      const done = () => { d.removeEventListener("close", done); resolve(d.returnValue === "ok"); };
      d.addEventListener("close", done);
      d.returnValue = "cancel";
      d.showModal();
      $("#dialog-cancel").focus();
    });
  }

  // ───────────────────────── wiring ─────────────────────────
  function insertAtCursor(input, text) {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, s) + text + input.value.slice(e);
    input.focus();
    input.setSelectionRange(s + text.length, s + text.length);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // ───────── context for the tutor: structured data for the page on screen ─────────
  let tutorFocus = null; // a specific question the student asked about from the review
  function explainMistake(i) {
    const a = viewing, it = a.items[i], q = qOf(it);
    if (!q) return;
    const L = labelOf(i, a.items, levelOf(a));
    tutorFocus = { attemptId: a.id, label: L.text, ...questionForTutor(it, q) };
    window.Tutor.open({ mode: "explain", prompt: it.earned < it.max ? `Why did I lose marks on ${L.text}?` : `Can you explain ${L.text}?`, send: true });
  }
  const plain = (html) => { const d = document.createElement("div"); d.innerHTML = String(html).replace(/\\\(|\\\)/g, " "); return (d.textContent || "").replace(/\s+/g, " ").trim(); };
  const texPlain = (s) => String(window.Graph ? window.Graph.describe(s) : s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); // keeps \( LaTeX \) for the model
  function questionForTutor(it, q) {
    if (it.kind === "mc") {
      return { kind: "Multiple choice", question: texPlain(q.q), choices: it.order.map((o, k) => `${LETTERS[k]}. ${texPlain(q.c[o])}`), studentAnswer: it.chosen === null ? "(blank)" : `${LETTERS[it.order.indexOf(it.chosen)]}. ${texPlain(q.c[it.chosen])}`, verifiedAnswer: `${LETTERS[it.order.indexOf(0)]}. ${texPlain(q.c[0])}`, verifiedExplanation: texPlain(q.e), marks: `${it.earned}/${it.max}` };
    }
    if (it.kind === "nr") return { kind: "Numerical response", question: texPlain(q.q), studentAnswer: it.response || "(blank)", verifiedAnswer: q.ansText || String(q.answer), verifiedExplanation: texPlain(q.e), marks: `${it.earned}/${it.max}` };
    const g = gradeItem(it);
    return {
      kind: "Written response", question: texPlain(q.intro), marks: `${it.earned}/${it.max}`,
      parts: q.parts.map((p, k) => ({ part: p.label || p.key, prompt: texPlain(p.prompt), studentAnswer: it.responses[p.key] || "(blank)", verifiedAnswer: p.kind === "set" ? (p.answer.join(", ") || "none") : p.kind === "restriction" ? `x ${p.answer.op} ${p.answer.value}` : window.QuadCheck && window.QuadCheck.handles(p.kind) ? window.QuadCheck.keyTeX(p) : String(p.ansTex ? p.ansTex : p.answer), marks: `${g.parts[k].earned}/${g.parts[k].max}`, markerNote: g.parts[k].note || "" })),
      verifiedSolution: q.solution.map(texPlain).join(" "), markingKey: q.rubric.map(texPlain),
    };
  }
  function pageContext() {
    const scr = document.body.dataset.screen;
    if (scr === "library") return window.Library.context();
    if (scr === "learning") return window.Analyst.context();
    if (scr === "review") return window.Review.context();
    if (scr === "room" && window.Rooms) return window.Rooms.context();
    if (scr === "home") {
      const L = learningState();
      return {
        type: "basecamp", title: "Home dashboard",
        text: [plain($("#home-sub").innerHTML), "Recommendations: " + L.recs.filter((r) => r.status !== "not_attempted").slice(0, 3).map((r) => `${r.title} [${r.label}]: ${r.why}`).join(" | "), "Stats panel: " + plain($("#stats-panel").innerHTML), "Goals: " + plain($("#goals").innerHTML), "Selected mode preview: " + plain($("#mode-preview").innerHTML)].join("\n"),
        concepts: L.recs.slice(0, 3).map((r) => r.concept),
      };
    }
    if (scr === "results" && viewing) {
      const a = viewing;
      const lost = a.items.map((it, i) => ({ it, i })).filter((x) => x.it.earned < x.it.max).map(({ it, i }) => `${labelOf(i, a.items, levelOf(a)).text} (${(qOf(it) || {}).topic}): ${it.earned}/${it.max}`);
      const ctx = { type: "results", title: `Test results and review (${levelName(levelOf(a))}, ${a.percent}%)`, text: `Mark ${a.earned}/${a.total}. Sections: ${sectionsOf(a.items).map((s) => `${s.name} ${a.sections[s.key].earned}/${a.sections[s.key].max}`).join(", ")}. Questions with lost marks: ${lost.join("; ") || "none"}.`, concepts: [] };
      if (tutorFocus && tutorFocus.attemptId === a.id) { ctx.focus = tutorFocus; ctx.concepts = window.Concepts.conceptsFor(qOf(a.items.find((x, k) => labelOf(k, a.items, levelOf(a)).text === tutorFocus.label))); }
      return ctx;
    }
    // Fallback: readable text of the visible screen only
    const el = document.querySelector(`#screen-${scr}`);
    return { type: scr || "page", title: document.title, text: el ? (el.innerText || "").slice(0, 4000) : "" };
  }

  const API = {
    $, $$, esc, tex, renderMath, show, store, KEYS, getHistory, qOf, gradeItem, LEVELS, levelOf, shuffle, clock, dur, niceDate,
    Check, confirmDialog, partHTML, answerTeX, keyTeX, insertAtCursor, updatePreview, LETTERS, isAssessmentActive, assessmentState, discardSaved, resumeSaved: () => resumeTest(), learningState, pageContext, go: navigate, plain, texPlain,
    BANKS, MC: () => [...MCB, ...CM.mc], NR: () => [...NRB, ...CM.nr], CHMC: () => CHM, CHNR: () => CHN,
    setTutorFocus: (f) => { tutorFocus = f; },
    openSheet, closeSheet, copyText, getPrefs, hydratePlots, tr,
    pad: () => ensurePad(), inTest: () => !!session && document.body.dataset.screen === "test",
    setIsland, setSettings, selectMode, demo, game, inLiveTest: () => !!(session && !session.demo),
    ensurePadPage: () => { if (!(session && document.body.dataset.screen === "test")) usePadGeneral(); },
  };

  // A modal sheet for detail views (evidence inspector). Closes on Esc, the × button or a backdrop click.
  function openSheet(title, html) {
    const d = $("#sheet");
    $("#sheet-title").textContent = title;
    $("#sheet-body").innerHTML = html;
    if (!d.open) d.showModal();
    $("#sheet-close").focus();
  }
  function closeSheet() { const d = $("#sheet"); if (d.open) d.close(); }

  function init() {
    if (!MCB || !NRB || !WRB || !Check) { document.body.innerHTML = "<p style='padding:2rem'>The question bank failed to load.</p>"; return; }

    $("#btn-enter").addEventListener("click", () => { goHome(); if (window.Onboarding) window.Onboarding.onEnter(); });
    for (const b of $$("#level-pick button")) b.addEventListener("click", () => { setPrefs({ level: b.dataset.level }); renderProgressScreen(); });
    $("#btn-group-create").addEventListener("click", () => openSetup({ group: true }));
    $("#join-form").addEventListener("submit", (e) => { e.preventDefault(); joinGroup($("#join-code").value); });
    $("#btn-lobby-start").addEventListener("click", startFromLobby);
    $("#btn-lobby-leave").addEventListener("click", leaveLobby);
    $("#btn-copy-code").addEventListener("click", () => copyText($("#lobby-code").textContent, null, $("#copy-note")));
    $("#btn-copy-link").addEventListener("click", () => copyText($("#lobby-link").value, $("#lobby-link"), $("#copy-note")));
    for (const grp of ["#s-level", "#s-buddy", "#s-start"]) {
      $(grp).addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        for (const x of $$(`${grp} button`)) { x.classList.toggle("active", x === b); x.setAttribute("aria-checked", x === b); }
        syncSetup();
      });
    }
    for (const id of ["#s-time", "#s-group", "#s-hardcore", "#s-drain"]) $(id).addEventListener("input", syncSetup);
    $("#s-comp").addEventListener("change", onCompSetup);
    $("#s-camp").addEventListener("change", onCampMaster);
    $("#s-camp-reset").addEventListener("click", () => { compDraft = window.Companion.full(); renderCompSetup(); });
    $("#s-comp").addEventListener("click", (e) => { if (e.target.closest("[data-cs]")) onCompSetup(e); });
    $("#setup-dialog").addEventListener("close", () => { if ($("#setup-dialog").returnValue === "ok") submitSetup(); });
    // home: difficulty carousel and preview (the preview's buttons are re-rendered, so delegate)
    $("#mode-track").addEventListener("click", (e) => { const c = e.target.closest("[data-mode]"); if (c) selectMode(c.dataset.mode, true); });
    $("#mode-track").addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      selectMode(MODES[(MODES.indexOf(selectedMode()) + d + MODES.length) % MODES.length], true);
    });
    $("#mode-prev").addEventListener("click", () => selectMode(MODES[(MODES.indexOf(selectedMode()) + MODES.length - 1) % MODES.length]));
    $("#mode-next").addEventListener("click", () => selectMode(MODES[(MODES.indexOf(selectedMode()) + 1) % MODES.length]));
    document.addEventListener("click", (e) => {
      const st = e.target.closest("[data-start-mode]"); if (st) { e.preventDefault(); return startMode(st.dataset.startMode); }
      const su = e.target.closest("[data-setup-mode]"); if (su) { e.preventDefault(); return openSetup({ level: su.dataset.setupMode }); }
      const dr = e.target.closest("[data-drill]"); if (dr) { e.preventDefault(); return startDrill(dr.dataset.drill, dr.dataset.level); }
      const cm = e.target.closest("[data-course-mode]"); if (cm) { setPrefs({ courseMode: cm.dataset.courseMode }); return renderCourse(); }
      const cs = e.target.closest("[data-course-sub]"); if (cs) { e.preventDefault(); return startCourse({ sub: cs.dataset.courseSub }); }
      const cx = e.target.closest("[data-course-mix]"); if (cx) { e.preventDefault(); return startCourse({ unit: cx.dataset.courseMix }); }
      const ca = e.target.closest("[data-course-all]"); if (ca) { e.preventDefault(); return startCourse({ all: true }); }
      // Studio+ workspace
      const spm = e.target.closest("[data-sp-mode]"); if (spm) { setPrefs({ mode: spm.dataset.spMode }); previewSeed = 1; renderHome(); const b = $(`[data-sp-mode="${spm.dataset.spMode}"]`); if (b) b.focus(); return; }
      const spd = e.target.closest("[data-sp-drill]"); if (spd) { e.preventDefault(); return startDrill(spd.dataset.spDrill, selectedMode(), goHome); }
      const spu = e.target.closest("[data-sp-unit]"); if (spu) { setPrefs({ courseOpen: spu.dataset.spUnit, courseMode: SP_PRACTICE_MODES.includes(selectedMode()) ? selectedMode() : courseMode() }); return navigate("course"); }
      if (e.target.closest("#sp-go-topic")) return spStartTopic();
      const spt = e.target.closest("[data-sp-tool]"); if (spt) {
        const t = spt.dataset.spTool;
        if ((t === "calc" || t === "pad") && window.Tools) return window.Tools.open(t, spt);
        setSettings(true);
        if (t === "lang") { const l = $("#set-lang .active") || $("#set-lang button"); if (l) l.focus(); }
        return;
      }
      const at = e.target.closest("[data-attempt]"); if (at) { e.preventDefault(); const a = getHistory().find((x) => x.id === at.dataset.attempt); if (a) showResults(a, false); return; }
      if (e.target.id === "btn-new-example") { previewSeed++; return renderPreview(); }
    });
    document.addEventListener("toggle", (e) => { const d = e.target; if (d.classList && d.classList.contains("course-unit") && d.open) setPrefs({ courseOpen: d.dataset.unit }); }, true);
    $("#mode-preview").addEventListener("change", (e) => { if (e.target.id === "simple-skill") setPrefs({ simpleSkill: e.target.value }); });
    $("#splus").addEventListener("change", (e) => { if (e.target.id === "sp-unit") { setPrefs({ spUnit: e.target.value }); renderHome(); const u = $("#sp-unit"); if (u) u.focus(); } });

    // island navigation + puppy settings
    $("#brand-link").addEventListener("click", (e) => {
      e.preventDefault();
      if (session && !session.demo) return leaveTest();
      if (session && session.demo) return;
      setIsland(!$("#island").classList.contains("open"));
      if ($("#island").classList.contains("open")) { const a = $("#main-nav button.active") || $("#main-nav button"); if (a) a.focus(); }
    });
    $("#main-nav").addEventListener("keydown", onIslandKey);
    $("#main-nav").addEventListener("click", () => setIsland(false));
    $("#btn-settings").addEventListener("click", (e) => { e.stopPropagation(); setSettings($("#settings-pop").hidden); });
    $("#settings-pop").addEventListener("click", (e) => {
      if (e.target.closest("[data-close-pop]")) return setSettings(false);
      // scoped selectors: <html> itself carries data-layout / data-theme
      const l = e.target.closest("#set-lang [data-lang]"); if (l) { applyUI({ lang: l.dataset.lang }); return; }
      const lo = e.target.closest("#set-layout [data-layout]"); if (lo) { applyUI({ layout: lo.dataset.layout }); if (document.body.dataset.screen === "home") renderHome(); if (session && pad && pad._place) pad._place(); return; }
      const th = e.target.closest("#set-theme [data-theme-opt]"); if (th) { applyUI({ theme: th.dataset.themeOpt }); }
      if (e.target.closest("#goose-toggle")) { if (selectedMode() === "simple" && !getPrefs().goose) return; setPrefs({ goose: !getPrefs().goose }); renderSettings(); const b = $("#goose-toggle"); if (b) b.focus(); return; }
    });
    $("#settings-pop").addEventListener("change", (e) => { if (e.target.id === "goose-calm") setPrefs({ gooseCalm: e.target.checked }); });
    $("#settings-pop").addEventListener("keydown", onRadioKeys);
    document.addEventListener("pointerdown", (e) => {
      if (e.target.closest("#tour-card")) return; // using the tour card never closes what the tour is showing
      if (!$("#settings-pop").hidden && !e.target.closest("#settings-pop, #btn-settings")) setSettings(false);
      if ($("#island").classList.contains("open") && !e.target.closest("#island")) setIsland(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#settings-pop").hidden) { e.preventDefault(); setSettings(false); }
      else if ($("#island").classList.contains("open")) { e.preventDefault(); setIsland(false); $("#brand-link").focus(); }
      else if (document.body.classList.contains("navpop-open")) { e.preventDefault(); setNavPop(false); $("#btn-navpop").focus(); }
    });
    document.addEventListener("i18n:change", () => { renderSettings(); rerenderScreen(); if (window.Tools) window.Tools.sync(); });
    // Focus layout: the question navigator opens on request
    $("#btn-navpop").addEventListener("click", () => setNavPop(!document.body.classList.contains("navpop-open")));
    $("#nav-grid").addEventListener("click", () => { if (document.body.classList.contains("navpop-open")) setNavPop(false); });
    $("#btn-hint").addEventListener("click", useHint);
    $("#lobby-buddy").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      setPrefs({ buddyMode: b.dataset.mode });
      for (const x of $$("#lobby-buddy button")) { x.classList.toggle("active", x === b); x.setAttribute("aria-checked", x === b); }
    });
    $("#go-revive").addEventListener("click", reviveFire);
    $("#go-off").addEventListener("click", () => { turnOffCampfire(); closeGameOver(); });
    $("#go-end").addEventListener("click", () => { $("#gameover").hidden = true; $("#screen-test").inert = false; $("#topbar-test").inert = false; session.gameOver = null; finishTest(false); });
    $("#btn-fire-off").addEventListener("click", async () => {
      if (await confirmDialog("Turn off the campfire?", "The puppy and fire go away for the rest of this test so you can focus on the math. Armadillo mode stops too. This can't be undone for this test.", "Turn it off", "Keep it")) turnOffCampfire();
    });
    // "How it works" (title screen and Home) replays the site tour: handled by [data-onboard] in js/onboarding.js


    const body = $("#q-body");
    body.addEventListener("click", (e) => {
      const c = e.target.closest(".choice");
      if (c) return choose(Number(c.dataset.orig));
      const seg = e.target.closest("[data-choice]");
      if (seg) {
        session.items[session.current].responses[seg.dataset.choice] = seg.dataset.value;
        if (fire) fire.react("happy");
        saveSession();
        for (const b of $$(`[data-choice="${CSS.escape(seg.dataset.choice)}"]`, body)) { const on = b === seg; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); }
        renderProgress(); renderNav();
        return;
      }
      const ins = e.target.closest("[data-ins]");
      if (ins) insertAtCursor(ins.closest(".wr-part").querySelector("input"), ins.dataset.ins);
    });
    body.addEventListener("input", onInput);
    body.addEventListener("input", () => { lastTyped = Date.now(); });
    body.addEventListener("mousedown", (e) => { if (e.target.closest("[data-ins]")) e.preventDefault(); });

    $("#nav-grid").addEventListener("click", (e) => { const b = e.target.closest(".nav-cell"); if (b) go(Number(b.dataset.i)); });
    $("#btn-prev").addEventListener("click", () => go(session.current - 1));
    $("#btn-next").addEventListener("click", () => go(session.current + 1));
    $("#btn-flag").addEventListener("click", () => { const it = session.items[session.current]; it.flagged = !it.flagged; saveSession(); renderQuestion(); });
    $("#btn-submit").addEventListener("click", submitTest);
    $("#btn-quit").addEventListener("click", leaveTest);
    $("#btn-pause").addEventListener("click", pauseTest);
    $("#btn-unpause").addEventListener("click", unpauseTest);
    $("#btn-pause-home").addEventListener("click", pauseToHome);
    $("#btn-again").addEventListener("click", async () => {
      if (savedSession() && !(await confirmDialog("Start over?", "You have an unfinished test. Starting a new one will discard it.", "Start new test", "Cancel"))) return;
      store.del(KEYS.session);
      startTest();
    });
    $("#btn-home").addEventListener("click", goHome);
    $("#review-filter").addEventListener("click", (e) => {
      const btn = e.target.closest("button"); if (!btn) return;
      reviewFilter = btn.dataset.filter;
      for (const b of $$("#review-filter button")) b.classList.toggle("active", b === btn);
      renderReview();
    });

    document.addEventListener("keydown", (e) => {
      if (!session || document.body.dataset.screen !== "test" || $("#dialog").open || session.paused || session.gameOver || e.defaultPrevented) return;
      // the goose has the game frozen: answer shortcuts wait (Pause and Exit stay on the top bar)
      if (window.Goose && window.Goose.frozen() && e.key.toLowerCase() !== "p") { if (!e.target.closest || !e.target.closest(".island-wrap, #gz-hud")) e.preventDefault(); return; }
      const typing = e.target.matches("input, textarea");
      if ((e.metaKey || e.ctrlKey) && !typing && e.key.toLowerCase() === "z" && pad) { e.preventDefault(); return pad.undo(); }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing) {
        if (e.key === "Enter" && e.target.matches("input")) { e.preventDefault(); const ins = $$("#q-body input.answer-input"); const k = ins.indexOf(e.target); if (k >= 0 && k < ins.length - 1) ins[k + 1].focus(); }
        return;
      }
      const k = e.key.toLowerCase();
      const item = session.items[session.current];
      if (item.kind === "mc") {
        const idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
        if (idx >= 0 && idx < item.order.length) { e.preventDefault(); return choose(item.order[idx]); }
      }
      if (e.key === "ArrowRight") { e.preventDefault(); go(session.current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(session.current - 1); }
      else if (k === "f" && fire) { e.preventDefault(); fire.addFuel(); }
      else if (fire && fire.comp && fire.comp.key(k)) { e.preventDefault(); }
      else if (k === "n" && pad) { e.preventDefault(); pad.toggleMin(); if (window.Tools) window.Tools.sync(); }
      else if (k === "h") { e.preventDefault(); useHint(); }
      else if (k === "p") { e.preventDefault(); pauseTest(); }
    });

    // Shared links: data-go / data-lesson / data-quiz / data-explain anywhere in the app
    document.addEventListener("click", (e) => {
      const g = e.target.closest("[data-go]");
      if (g && !e.target.closest("#tutor")) { e.preventDefault(); return navigate(g.dataset.go); }
      const l = e.target.closest("[data-lesson]");
      if (l) { e.preventDefault(); return navigate("library", l.dataset.lesson); }
      const qz = e.target.closest("[data-quiz]");
      if (qz) { e.preventDefault(); if (session) return; show("library"); return window.Library.open(qz.dataset.quiz, { quiz: true }); }
      const ex = e.target.closest("[data-explain]");
      if (ex && viewing) { e.preventDefault(); return explainMistake(Number(ex.dataset.explain)); }
    });

    window.addEventListener("pagehide", saveSession);
    document.addEventListener("visibilitychange", () => { if (document.hidden) saveSession(); });
    // Invite links look like  …/#g-XXXXXXXXXXXX
    const fromHash = () => {
      if (location.hash === "#c-formulas" && !session) { navigate("library", "formulas"); return true; }
      const cm = location.hash.match(/^#c-([a-z]+\.[a-z_]+)$/);
      if (cm && window.Concepts.get(cm[1]) && !session) { navigate("library", cm[1]); return true; }
      const m = location.hash.match(/^#g-([0-9A-Za-z]{12})$/);
      const g = m && window.Group.decodeGroup(m[1]);
      if (g && !session) { openLobby(g); return true; }
      const rm = location.hash.match(/^#r-([0-9A-Za-z]{16})$/);
      const room = rm && window.Group.decodeRoom(rm[1]);
      if (room && !session && window.Rooms) { window.Rooms.join(room); return true; }
      return false;
    };
    window.addEventListener("hashchange", fromHash);
    window.Practice.init(API);
    window.Library.init(API);
    window.Review.init(API);
    if (window.Rooms) window.Rooms.init(API);
    $("#sheet-close").addEventListener("click", closeSheet);
    $("#sheet").addEventListener("click", (e) => { if (e.target === $("#sheet")) closeSheet(); });
    window.Analyst.init(API);
    window.Tutor.init(API);
    if (window.Tools) window.Tools.init(API);
    if (window.Onboarding) window.Onboarding.init(API);
    if (window.Goose) window.Goose.init({
      t: tr,
      // the goose only plays where there's a game to disrupt, never over tours, dialogs, settings or a paused test
      applicable: () => {
        const scr = document.body.dataset.screen;
        if (!["home", "test", "practice", "course"].includes(scr)) return false;
        if ((window.Tour && window.Tour.active) || $("#dialog").open || !$("#settings-pop").hidden || !$("#gameover").hidden) return false;
        if (scr === "test" && (!session || session.demo || session.paused || session.gameOver)) return false;
        return true;
      },
      stageEl: () => $(`#screen-${document.body.dataset.screen}`),
      // what a stolen panel must not land on
      essentials: () => ["#question-card", ".q-nav", "#btn-start", "#mode-track", "#prac-run .quiz-fb-actions", "#prac-run [data-pr]", "#splus .sp-launch .btn-primary", "#tools-btn"].flatMap((sel) => [...document.querySelectorAll(sel)]).filter((el) => el.offsetParent).map((el) => el.getBoundingClientRect()),
      calm: () => { const p = getPrefs(); return p.gooseCalm === undefined ? matchMedia("(prefers-reduced-motion: reduce)").matches : !!p.gooseCalm; },
      turnOff: () => setPrefs({ goose: false }),
    });
    applyGoose();
    applyUI();
    if (window.I18N) window.I18N.apply(document);
    // follow the OS theme live when "System" is chosen (CSS handles it; this keeps the colour-scheme hint honest)
    try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (getUI().theme === "system") applyUI(); }); } catch { /* old browsers */ }
    if (!fromHash()) renderTitle();
    setInterval(() => window.Tutor.refresh(), 1000); // belt-and-braces: hide the tutor the moment a test exists
  }

  document.addEventListener("DOMContentLoaded", init);
})();
