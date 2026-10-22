/*
 * ONBOARDING — three independent tutorials on the one tour engine (js/tour.js):
 *   site  — the general site tour (welcome, dashboard, island, modes, library, settings, language, layout/theme,
 *           practice & tests, Study Room, tools, done). "Just the essentials" runs a 6-step subset.
 *   test  — the test-taking tutorial, on a practice copy of a test (session.demo: nothing saved or marked).
 *           Answers typed during it are checked live by the real marking engine, without recording anything.
 *   game  — the campfire minigame tutorial: offered the first time a test starts with the campfire on.
 *           The test clock and the fire are held while it runs.
 * None of them mentions or starts the others' content: the site tour and the test tutorial never show the minigame.
 *
 * State (localStorage "campfire-prep.onboarding.v1"), each tutorial independent:
 *   { site, test, game: null | "completed" | "skipped",  siteAt/testAt/gameAt: timestamps,
 *     gameOpened: bool, gameOpenedAt, resume: { tour: "site", step, variant } }
 * Language, layout and theme stay in their own key (campfire-prep.ui.v1); tutorials never reset them.
 * Users who finished the old tour (campfire-prep.toured.v1) aren't shown the site tour automatically.
 */
(function () {
  "use strict";
  const KEY = "campfire-prep.onboarding.v1";
  const LEGACY = "campfire-prep.toured.v1";
  let A = null;
  const $ = (s) => document.querySelector(s);
  const t = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ───────── state ─────────
  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { s = {}; }
    if (!s.site) { try { if (JSON.parse(localStorage.getItem(LEGACY) || "false") === true) s.site = "completed"; } catch { /* ignore */ } }
    return s;
  }
  function save(patch) {
    const s = { ...load(), ...patch, v: 1 };
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: tutorials still work, just aren't remembered */ }
    return s;
  }
  const state = () => load();
  const shouldOfferSite = () => !load().site;

  // ───────── site tour ─────────
  function siteSteps() {
    const home = () => { A.setSettings(false); if (document.body.dataset.screen !== "home") A.go("home"); };
    return [
      { id: "welcome", essential: true, title: "site.welcome.t", body: "site.welcome.b", nextLabel: "site.full",
        onEnter: () => { A.setSettings(false); A.setIsland(false); },
        actions: [{ id: "essentials", label: "site.essentials", run: () => startSite({ variant: "essentials", startId: "nav" }) }] },
      { id: "dash", title: "site.dash.t", body: "site.dash.b", target: "#topic-card", onEnter: home },
      { id: "activity", title: "site.activity.t", body: "site.activity.b", target: ".dash-row", onEnter: home },
      { id: "nav", essential: true, title: "site.nav.t", body: "site.nav.b", target: "#island", interactive: true,
        onEnter: () => { home(); setTimeout(() => { if (window.Tour.step && window.Tour.step.id === "nav") A.setIsland(true); }, 250); },
        onExit: () => A.setIsland(false) },
      { id: "modes", essential: true, title: "site.modes.t", body: "site.modes.b", target: "#mode-track", interactive: true, onEnter: home },
      { id: "preview", title: "site.preview.t", body: "site.preview.b", target: "#mode-preview", onEnter: home },
      { id: "library", title: "site.lib.t", body: "site.lib.b", target: "#lib-side, .lib-side", onEnter: () => { A.setSettings(false); A.go("library"); } },
      { id: "lesson", title: "site.lesson.t", body: "site.lesson.b", target: "#lib-main .lesson-head", onEnter: () => { A.setSettings(false); A.go("library", "quad.vertex_form"); window.scrollTo(0, 0); } },
      { id: "settings", essential: true, title: "site.settings.t", body: "site.settings.b", target: "#btn-settings", interactive: true,
        onEnter: () => { home(); A.setSettings(false); },
        advanceWhen: () => !$("#settings-pop").hidden,
        onNext: () => { A.setSettings(true); } },
      { id: "language", essential: true, title: "site.lang.t", target: "#set-lang", interactive: true,
        body: (tt) => tt("site.lang.b") + `<p class="tour-note">${esc(tt("site.lang.note"))}</p>`,
        onEnter: () => A.setSettings(true) },
      { id: "look", title: "site.look.t", body: "site.look.b", target: ["#set-layout", "#set-theme"], interactive: true,
        onEnter: () => A.setSettings(true) },
      { id: "tests", title: "site.tests.t", body: "site.tests.b", target: ".tests-row",
        onEnter: () => { A.setSettings(false); A.go("practice"); window.scrollTo(0, 0); },
        actions: [{ id: "test-tutorial", label: "site.tests.go", primary: true, run: () => handoffToTest() }] },
      { id: "room", title: "site.room.t", body: "site.room.b", target: "#group-card", onEnter: () => { A.setSettings(false); A.go("studyroom"); } },
      { id: "tools", title: "site.tools.t", body: "site.tools.b", target: "#tools-btn", onEnter: home },
      { id: "done", essential: true, title: "site.done.t", body: "site.done.b", nextLabel: "site.done.go", onEnter: home },
    ];
  }
  // the tours walk through the Math app: from Physics, switch to Math first (which asks if a run is open)
  function viaMath(fn, opts) {
    if (!A || !A.getSubject || A.getSubject() !== "physics") return false;
    A.switchSubject("math").then(() => { if (A.getSubject() === "math") fn(opts); });
    return true;
  }
  function startSite(opts = {}) {
    if (!A || A.inLiveTest()) return false;
    if (viaMath(startSite, opts)) return true;
    const variant = opts.variant || "full";
    let steps = siteSteps();
    if (variant === "essentials") steps = steps.filter((s) => s.essential);
    if (document.body.dataset.screen === "start" || !document.body.dataset.screen) A.go("home");
    window.Tour.start(steps, {
      id: "site", startId: opts.startId,
      onStep: (i, st) => save({ resume: { tour: "site", step: st.id, variant } }),
      onEnd: (result) => {
        if (result === "replaced") return;
        if (result === "handoff") return;
        save({ site: result === "completed" ? "completed" : "skipped", siteAt: Date.now(), resume: null });
        A.setSettings(false); A.setIsland(false);
        if (result === "completed") A.go("home");
      },
    });
    return true;
  }
  // From the site tour's "Practice and tests" step: run the test tutorial, then come back to the next site step.
  function handoffToTest() {
    const variant = (load().resume || {}).variant || "full";
    window.Tour.end("handoff");
    startTest({ after: () => startSite({ variant, startId: "room" }) });
  }

  // ───────── test-taking tutorial (practice copy; nothing saved) ─────────
  function testSteps(d) {
    const go = (k) => () => d.goTo(k);
    const live = (k, part) => (tt) => {
      const base = tt("tt.answer.b");
      const r = d.check(k, part);
      const line = !r || r.blank ? `<span class="faint">${esc(tt("tt.check.empty"))}</span>`
        : r.earned >= r.max ? `<b class="tour-ok">${esc(tt("tt.check.ok", { earned: r.earned, max: r.max }))}</b>`
        : r.earned > 0 ? `<b class="tour-mid">${esc(tt("tt.check.partial", { earned: r.earned, max: r.max }))}</b>`
        : `<b class="tour-bad">${esc(tt("tt.check.wrong", { max: r.max }))}</b>`;
      const note = r && !r.blank && r.note ? `<br><span class="small">${esc(window.I18N ? window.I18N.note(r.note) : r.note)}</span>` : "";
      return `${base}<div class="tour-check" role="status"><span class="kicker">${esc(tt("tt.check.label"))}</span> ${line}${note}</div>`;
    };
    return [
      { id: "intro", title: "tt.intro.t", body: "tt.intro.b", onEnter: go(0) },
      { id: "bar", title: "tt.bar.t", body: "tt.bar.b", target: "#topbar-test", onEnter: go(0) },
      { id: "read", title: "tt.read.t", body: "tt.read.b", target: "#question-card .paper-head", onEnter: go(0) },
      { id: "graph", title: "tt.graph.t", body: "tt.graph.b", target: "#q-body .choices", interactive: true, allowKeys: ["1", "2", "3", "4", "a", "b", "c", "d"], onEnter: go(3), optional: true },
      { id: "answer", title: "tt.answer.t", body: live(0, d.firstPart(0)), live: true, interactive: true, allowKeys: [],
        target: () => document.querySelector("#q-body .wr-part"), onEnter: go(0), focus: "#q-body .wr-part input",
        actions: [{ id: "fill", label: "tt.fill", run: () => { d.fill(0, d.firstPart(0)); window.Tour.refresh(); } }] },
      { id: "plot", title: "tt.plot.t", body: "tt.plot.b", target: () => document.querySelector("#q-body .plot-part"), interactive: true, allowKeys: [], onEnter: go(1), optional: true },
      { id: "submit", title: "tt.submit.t", body: "tt.submit.b", target: () => { const s = $("#btn-submit"); return s && s.getClientRects().length ? s : $("#btn-navpop"); }, onEnter: go(3) },
      { id: "hint", title: "tt.hint.t", body: "tt.hint.b", target: "#btn-hint", interactive: true, allowKeys: ["h"], onEnter: go(0), optional: true },
      { id: "nav", title: "tt.nav.t", body: "tt.nav.b", target: () => { const n = $("#navigator"); return n && n.getClientRects().length ? n : $(".q-nav"); }, onEnter: go(0) },
      { id: "tools", title: "tt.tools.t", body: "tt.tools.b", target: "#tools-btn" },
      { id: "progress", title: "tt.progress.t", body: "tt.progress.b", target: "#topbar-test .tb-progress" },
      { id: "pause", title: "tt.pause.t", body: "tt.pause.b", target: ["#btn-pause", "#btn-quit"] },
      { id: "done", title: "tt.done.t", body: "tt.done.b" },
    ];
  }
  function startTest(opts = {}) {
    if (!A || A.inLiveTest()) return false;
    if (viaMath(startTest, opts)) return true;
    const origin = document.body.dataset.screen && document.body.dataset.screen !== "start" ? document.body.dataset.screen : "home";
    A.setSettings(false); A.setIsland(false);
    const d = A.demo.start();
    if (!d) return false;
    window.Tour.start(testSteps(A.demo), {
      id: "test",
      onEnd: (result) => {
        A.demo.end();
        if (result === "replaced") return;
        save({ test: result === "completed" ? "completed" : "skipped", testAt: Date.now() });
        if (opts.after) opts.after(); else A.go(origin === "test" ? "home" : origin);
      },
    });
    return true;
  }

  // ───────── campfire minigame tutorial (real test; clock and fire held) ─────────
  function gameSteps(g, replay) {
    const has = (m) => !!(g.cfg().mech || {})[m];
    const openControls = () => { const tg = $("#companion .comp-toggle"); if (tg && tg.getAttribute("aria-expanded") === "false" && tg.getClientRects().length) tg.click(); };
    let logs0 = 0;
    const steps = [
      { id: "goal", title: "gm.goal.t", body: "gm.goal.b", target: [".buddy-panel #test-scene", "#buddy-status"] },
      { id: "gauge", title: "gm.gauge.t", body: "gm.gauge.b", target: "#gauge" },
      { id: "log", title: "gm.log.t", target: "#btn-fuel", interactive: true, allowKeys: ["f"], live: true,
        onEnter() { logs0 = g.logs(); this.interactive = true; this.doneAt = 0; },
        body: (tt) => tt("gm.log.b") + (g.logs() > logs0 ? `<p class="tour-ok">${esc(tt("gm.log.done"))}</p>` : ""),
        // one log is the lesson: after it, the button is closed off again (no accidental fire-starting) and we move on
        advanceWhen() {
          if (g.logs() <= logs0) return false;
          if (!this.doneAt) { this.doneAt = Date.now(); this.interactive = false; window.Tour.refresh(); }
          return Date.now() - this.doneAt > 1800;
        } },
      { id: "wind", when: () => has("wind"), optional: true, title: "gm.wind.t", body: "gm.wind.b", target: "#companion .comp-wind", onEnter: openControls },
      { id: "oxygen", when: () => has("oxygen"), optional: true, title: "gm.oxygen.t", body: "gm.oxygen.b", target: ['#companion .comp-meter[data-m="oxygen"]', '#companion [data-comp="bellows"]'], onEnter: openControls },
      { id: "kettle", when: () => has("kettle"), optional: true, title: "gm.kettle.t", body: "gm.kettle.b", target: ['#companion .comp-meter[data-m="pressure"]', '#companion [data-comp="valve"]'], onEnter: openControls },
      { id: "vent", when: () => has("vent"), optional: true, title: "gm.vent.t", body: "gm.vent.b", target: '#companion [data-comp="vent"]', onEnter: openControls },
      { id: "tent", when: () => has("tent"), optional: true, title: "gm.tent.t", body: "gm.tent.b", target: ["#companion .comp-hp", '#companion [data-comp="tent"]'], onEnter: openControls },
      { id: "events", when: () => !!g.cfg().events, title: "gm.events.t", body: "gm.events.b", target: ".buddy-panel #test-scene" },
      { id: "lose", when: () => !!g.cfg().hardcore, title: "gm.lose.t", body: "gm.lose.b", target: "#btn-fuel" },
      { id: "drain", when: () => !!g.cfg().drain, title: "gm.drain.t", body: "gm.drain.b", target: "#timer" },
      { id: "off", title: "gm.off.t", body: "gm.off.b", target: "#btn-fire-off", optional: true },
      { id: "pause", title: "gm.pause.t", body: "gm.pause.b", target: ["#btn-pause", "#btn-camp-help"] },
      { id: "done", title: "gm.done.t", body: "gm.done.b", nextLabel: "gm.play" },
    ];
    if (!replay) steps.unshift({ id: "intro", title: "gm.intro.t", body: "gm.intro.b", nextLabel: "gm.start", skipLabel: "gm.skipPlay", target: ".buddy-panel" });
    return steps;
  }
  function startGame(opts = {}) {
    const g = A && A.game;
    if (!g || !g.active() || window.Tour.active) return false;
    g.hold(true);
    window.Tour.start(gameSteps(g, !!opts.replay), {
      id: "game",
      onEnd: (result) => {
        g.hold(false);
        if (result === "replaced") return;
        // leaving on the first card ("Skip tutorial and play") or later both count as dismissed: no re-prompting
        save({ game: result === "completed" ? "completed" : "skipped", gameAt: Date.now() });
      },
    });
    return true;
  }
  // Called by the app whenever a test is on screen with the campfire running (not the demo, not paused).
  function onGameOpen() {
    const s = load();
    if (!s.gameOpened) save({ gameOpened: true, gameOpenedAt: Date.now() });
    if (s.game || window.Tour.active) return;
    setTimeout(() => { if (!load().game && A.game.active() && !window.Tour.active) startGame(); }, 350);
  }

  // ───────── entry points ─────────
  // Title screen "Enter": a first visit (or a site tour interrupted by a reload) gets the site tour on Home.
  function onEnter() {
    const s = load();
    if (s.resume && s.resume.tour === "site" && !s.site) { A.go("home"); return startSite({ variant: s.resume.variant, startId: s.resume.step }); }
    if (!s.site) { A.go("home"); return startSite(); }
    return false;
  }
  function renderHelp() {
    const inTest = A.inLiveTest(), busy = inTest || window.Tour.active;
    for (const b of document.querySelectorAll("#set-help [data-onboard]")) b.disabled = busy;
    const n = $("#help-busy"); if (n) n.hidden = !inTest;
  }
  function init(api) {
    A = api;
    // A reload during the site tour can land straight on a deep-linked screen (e.g. a lesson's #c-… link) without
    // the title screen: resume the tour there too. (On the title screen, Enter resumes it.)
    setTimeout(() => {
      const s = load();
      const scr = document.body.dataset.screen;
      if (s.resume && s.resume.tour === "site" && !s.site && scr && scr !== "start" && scr !== "test" && !window.Tour.active) startSite({ variant: s.resume.variant, startId: s.resume.step });
    }, 600);
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-onboard]");
      if (!b || b.disabled) return;
      e.preventDefault();
      const kind = b.dataset.onboard;
      if (kind === "site") { A.setSettings(false); startSite(); }
      else if (kind === "test") { A.setSettings(false); startTest(); }
      else if (kind === "game") startGame({ replay: true });
      else if (kind === "game-next") { save({ game: null }); const q = $("#s-camp-tut-note"); if (q) q.hidden = false; }
    });
  }

  window.Onboarding = { init, state, save, startSite, startTest, startGame, onGameOpen, onEnter, shouldOfferSite, renderHelp, KEY };
})();
