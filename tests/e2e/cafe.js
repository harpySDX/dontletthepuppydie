// The Study Café: home (Recommended practice · Take a test · Diagnostics), The Bar, the 3D scene and its
const enterIf = async (p) => { if (await p.locator("#btn-enter").isVisible().catch(() => false)) await p.click("#btn-enter"); }; // the app now opens on Home; kept for old saved states
// fallbacks, the café theme, accent colours across themes, Simple as a real assessment, and the focused test.
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/cafe.js
const { chromium } = require("playwright");
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const SHOTS = process.env.SHOTS;
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const DONE = { site: "completed", test: "completed", game: "completed" };
const { go, toTake } = require("./navhelp");
const toTakeIf = async (pg) => { if (!(await pg.locator("#mode-track").isVisible().catch(() => false)) && (await pg.evaluate(() => document.body.dataset.screen)) !== "test") await toTake(pg); };

(async () => {
  const b = await chromium.launch();
  const mk = async (seed = {}, opts = {}) => {
    const ctx = await b.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, reducedMotion: opts.reducedMotion || "no-preference" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, "campfire-prep.toured.v1": true, ...seed });
    await p.goto(BASE); await p.waitForTimeout(250);
    await enterIf(p); await p.waitForTimeout(450);
    return p;
  };
  const screen = (p) => p.evaluate(() => document.body.dataset.screen);
  const sess = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.session.v2") || "null"));
  const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const lum = (c) => { const [r, g, bb] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * bb; };
  const ratio = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const tokens = (p, names) => p.evaluate((names) => { const cs = getComputedStyle(document.documentElement); const rgb = (h) => { h = h.trim(); const m = /^#([0-9a-f]{6})$/i.exec(h); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null; }; return Object.fromEntries(names.map((n) => [n, rgb(cs.getPropertyValue(n))])); }, names);

  // ── 1. first visit: the café, its theme, three destinations, the three home cards
  let p = await mk();
  ok("Study Café is the default theme (dark tone)", (await p.evaluate(() => [document.documentElement.dataset.theme, document.documentElement.dataset.tone].join())) === "cafe,dark");
  ok("Opens straight onto the café home (no splash, no game)", (await screen(p)) === "home" && !(await vis(p, "#btn-enter")) && !(await vis(p, "#companion")) && !(await p.evaluate(() => window.Tour.active)));
  ok("Fresh install: campfire minigame and Goose Mode are off", await p.evaluate(() => { const pr = JSON.parse(localStorage.getItem("campfire-prep.prefs.v1") || "{}"); return (pr.buddyMode || "off") === "off" && !pr.goose && !document.body.classList.contains("goose-on"); }));
  ok("Top bar: Home · Tests · Game · The Bar · Diagnostics", (await p.$$eval("#main-nav [data-go]", (xs) => xs.map((x) => x.dataset.go + ":" + x.textContent.trim()).join())).startsWith("home:Home,take:Tests,game:Game,bar:The Bar,progress:Diagnostics"));
  ok("Brand: The Study Café, Better every day.", /The Study Café/.test(await p.textContent("#brand-link")) && /Better every day/.test(await p.textContent("#island-ctx")));
  ok("The room sits behind the interface (scene host, painted fallback, theme veil)", await p.evaluate(() => { const h = document.getElementById("cafe-bg"); return !!h && getComputedStyle(h).position === "fixed" && !!h.querySelector(".cafe-paint") && !!h.querySelector(".cafe-veil"); }));
  ok("Default backdrop is the café photograph", (await p.evaluate(() => [window.Cafe.mode(), document.documentElement.dataset.scene].join())) === "photo,photo" && await p.evaluate(() => /assets\/cafe\.jpg/.test(getComputedStyle(document.querySelector(".cafe-photo")).backgroundImage)));
  ok("Home: welcome, two subject cards, Recommended Practice and Game · Tests · Diagnostics", /What would you like to focus on today\?/.test(await p.textContent("#home-greeting")) && (await p.locator("#hub-subjects .subj-card").count()) === 2 && await vis(p, "#topic-card.rec-card")
    && (await p.$$eval(".hub-tiles .hub-tile", (xs) => xs.map((x) => x.dataset.go).join())) === "game,take,progress");
  ok("Home shows none of The Bar's contents (no board, no concept list, no Bar items)", await p.evaluate(() => !document.querySelector("#bar-board, #studio-concepts") && !document.querySelector("#screen-home .bar-item, #screen-home .bar-row, #screen-home .concept-row")));
  ok("Home fits a 1440×900 window without scrolling", await p.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), String(await p.evaluate(() => document.documentElement.scrollHeight)));
  ok("Subject cards: honest coverage (0%) and what's next", /0% of topics practised/.test(await p.textContent("#hub-subjects .s-math")) && /Next up: Quadratic Functions/i.test(await p.textContent("#hub-subjects .s-math")) && /Next up: Projectile motion/.test(await p.textContent("#hub-subjects .s-physics")));
  await p.click('.hub-tile[data-go="take"]'); await p.waitForTimeout(300);
  ok("Take a Test tile opens the test page", (await screen(p)) === "take" && await vis(p, ".test-card #mode-track"));
  ok("Take a test: subject choice (Pre-Calculus 11 | Physics 11) and four difficulty cards", (await p.$$eval("#test-subject [data-subject-pick]", (xs) => xs.map((x) => x.dataset.subjectPick).join())) === "math,physics" && (await p.locator("#mode-track .mode-card").count()) === 4);
  await p.click('#main-nav [data-go="home"]'); await p.waitForTimeout(300);
  ok("No evidence: Recommended practice offers a baseline test instead of a guess", /Set a baseline/.test(await p.textContent("#topic-card")) && await vis(p, '#topic-card [data-start-mode="normal"]'));
  ok("Visit The Bar: one quiet action in the top bar", await vis(p, "#btn-visit-bar") && (await p.locator("#screen-home [data-go='bar']").count()) === 0);
  await p.click("#btn-visit-bar"); await p.waitForTimeout(350);
  ok("…opens The Bar as its own page (the café home is gone)", (await screen(p)) === "bar" && !(await vis(p, "#hub-subjects")) && !(await vis(p, "#btn-visit-bar")) && await vis(p, "#bar-body .bar-menu"));
  await p.click("#screen-bar .crumb-back"); await p.waitForTimeout(350);
  ok("…and Back to the café returns home", (await screen(p)) === "home" && await vis(p, "#hub-subjects"));
  // Game: its own page; nothing starts until chosen
  await p.click('.hub-tile[data-go="game"]'); await p.waitForTimeout(350);
  ok("Game tile opens the Game page (campfire minigame, Goose Mode), both off", (await screen(p)) === "game" && (await p.locator("#game-body .game-card").count()) === 2 && (await p.$$eval("#game-body .game-state", (xs) => xs.map((x) => x.textContent).join("|"))).split("|")[0] === "Off");
  await p.click('#game-body [data-game="camp"]'); await p.waitForTimeout(350);
  ok("Campfire: opens Test options with the minigame switched on (still a real, marked test)", await vis(p, "#setup-dialog[open]") && await p.isChecked("#s-camp"));
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  await p.click('#screen-game .crumb-back'); await p.waitForTimeout(300);
  ok("Game → Back to the café", (await screen(p)) === "home");
  if (SHOTS) await p.screenshot({ path: SHOTS + "/cafe-home.png" });

  // ── 2. Simple is a real, independent assessment; the café steps back during the test
  await toTakeIf(p); await p.click('#mode-track [data-mode="simple"]'); await p.waitForTimeout(150);
  ok("Simple preview: a test (24 marks · 40 min) with Test options", /24 marks · 40 min/.test(await p.textContent("#mode-preview")) && await vis(p, "#mode-preview #btn-create"));
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(900);
  let s = await sess(p);
  ok("Simple starts a timed test in the shared engine", (await screen(p)) === "test" && s && s.level === "simple" && s.duration === 40 * 60 && s.items.length === 19, s && `${s.level} ${s.items.length} ${s.duration}`);
  ok("Every Simple question is generated at Simple level", s.items.every((it) => /-s-/.test(it.qid)));
  ok("No hints unless allowed, no scaffolds, no tutor", !(await vis(p, "#btn-hint")) && !(await vis(p, ".ph-scaffold, .hint-box li")) && !(await vis(p, "#tutor-launcher")));
  for (const [w, h] of [[1100, 800], [1536, 900], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(200);
    const al = await p.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const i = r("#island"), c = r("#question-card"), l = r("#test-layout"); return { i: [i.left, i.right], c: [c.left, c.right], l: [l.left, l.right], vw: document.documentElement.clientWidth }; });
    const near = (a, b) => Math.abs(a - b) <= 1.5;
    ok(`Test at ${w}px: top bar, question and layout share one centred column`, near(al.i[0], al.c[0]) && near(al.i[1], al.c[1]) && near(al.l[0], al.c[0]) && near(al.c[0], al.vw - al.c[1]), JSON.stringify(al));
  }
  await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(150);
  ok("During the test the café is hidden (nothing rendered) and the island is the test bar", await p.evaluate(() => getComputedStyle(document.getElementById("cafe-bg")).display === "none") && !(await vis(p, "#main-nav")) && !(await vis(p, "#subject-btn")));
  await p.click("#btn-quit"); await p.waitForTimeout(150); if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(300); }
  ok("Leaving the test brings the café back", await p.evaluate(() => getComputedStyle(document.getElementById("cafe-bg")).display !== "none"));
  // Test options: Simple can't be a group test (two-bit level field in group codes)
  await toTakeIf(p); await p.click('#mode-track [data-mode="simple"]'); await p.waitForTimeout(150);
  await toTakeIf(p); await p.click("#mode-preview #btn-create"); await p.waitForTimeout(250);
  ok("Test options: Simple selected, 40-minute default, group test unavailable", (await p.getAttribute('#s-level [data-level="simple"]', "aria-checked")) === "true" && (await p.inputValue("#s-time")) === "40" && await p.isDisabled("#s-group"));
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);

  // ── 3. subject choice inside Take a test; Physics baseline is the diagnostic
  await p.click('#test-subject [data-subject-pick="physics"]'); await p.waitForTimeout(400);
  ok("Choosing Physics in Take a test switches the subject", (await p.evaluate(() => document.body.dataset.subject)) === "physics" && (await p.getAttribute('#test-subject [data-subject-pick="physics"]', "aria-checked")) === "true");
  await p.click('#main-nav [data-go="home"]'); await p.waitForTimeout(300);
  ok("Physics baseline: the eight-question diagnostic (or a Normal test)", await vis(p, '#topic-card [data-ph-start="diag"]') && await vis(p, '#topic-card [data-start-mode="normal"]'));
  await toTakeIf(p); await p.click('#mode-track [data-mode="simple"]'); await p.waitForTimeout(200);
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(400);
  if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(700); } // the unfinished Math test is discarded only after asking
  s = await sess(p);
  ok("Physics Simple: a 6-question, 30-minute test at Simple level (no lab first)", (await screen(p)) === "test" && s.subject === "physics" && s.level === "simple" && s.items.length === 6 && s.duration === 30 * 60 && s.items.every((it) => /-wr-s-/.test(it.qid)));
  await p.click("#btn-quit"); await p.waitForTimeout(150); if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(300); }
  await p.context().close();

  // ── 4. Recommended practice from real evidence (both subjects)
  p = await mk();
  await p.evaluate(() => {
    const now = Date.now(), rec = [];
    for (let i = 0; i < 4; i++) { const q = window.QuadBank.generate("vform", "nr", "normal"); rec.push({ date: now - 3600e3 * (i + 1), quiz: "seed" + (i % 2), source: "drill", level: "normal", qid: q.id, kind: "nr", response: "999", concepts: ["quad.vertex_form"], sub: window.Curriculum.subsForConcept("quad.vertex_form")[0], correct: false }); }
    localStorage.setItem("campfire-prep.practice.v1", JSON.stringify(rec));
    const ph = []; for (let i = 0; i < 4; i++) ph.push({ date: now - 3600e3 * (i + 2), run: "r" + (i % 2), family: "ph_horizontal", sub: "PC.horizontal", subs: ["PC.horizontal"], skills: ["horizontal"], part: "a", earned: 0, max: 1, correct: false, mode: "normal" });
    localStorage.setItem("campfire-prep.phys.practice.v1", JSON.stringify(ph));
  });
  await p.reload(); await p.waitForTimeout(300); await enterIf(p); await p.waitForTimeout(500);
  const recText = await p.textContent("#topic-card");
  ok("Math: recommends the weak concept, says why, starts practice on it", /Vertex form/.test(recText) && (await p.locator("#topic-card .rec-why").textContent()).trim().length > 20 && (await p.getAttribute("#topic-card .btn-primary", "data-drill")) === "quad.vertex_form", recText.replace(/\s+/g, " ").slice(0, 160));
  ok("Low accuracy → the recommendation starts as guided practice", (await p.getAttribute("#topic-card .btn-primary", "data-level")) === "simple");
  ok("Subject cards now show measured coverage for both subjects", /[1-9]\d*% of topics practised/.test(await p.textContent("#hub-subjects .s-math")) && /[1-9]\d*% of topics practised/.test(await p.textContent("#hub-subjects .s-physics")));
  ok("Next up names the recommended topic", /Next up: Vertex form/.test(await p.textContent("#hub-subjects .s-math")));
  await p.click("#topic-card .btn-primary"); await p.waitForTimeout(500);
  ok("Start practice opens the practice runner on that concept", (await screen(p)) === "practice" && await vis(p, "#prac-run"));
  await go(p, "home");
  await p.click('#hub-subjects .s-physics [data-subject-pick]'); await p.waitForTimeout(400);
  ok("Physics: recommends the missed family with a fresh-question review", /Horizontal/.test(await p.textContent("#topic-card")) && /Missed 4×/.test(await p.textContent("#topic-card")) && (await p.getAttribute("#topic-card .btn-primary", "data-ph-fams")) === "ph_horizontal");
  await p.click("#topic-card .btn-primary"); await p.waitForTimeout(500);
  ok("…and starts a Physics practice run on it", (await screen(p)) === "phys" && await p.evaluate(() => /ph_horizontal/.test((window.PhysUI.current() || {}).id || "")));
  await p.context().close();

  // ── 5. The Bar: categories by subject, topic search, real resources
  p = await mk();
  await go(p, "bar");
  ok("The Bar: menu of Topic practice, Practice sets, Lessons, Formula sheet, Study Room", (await p.$$eval("#bar-body .bar-item", (xs) => xs.map((x) => x.querySelector("b").textContent).join("|"))) === "Topic practice|Practice sets|Lessons|Formula sheet|Study Room");
  ok("The Bar's tabs: The Bar · Skills · Whole course · Study Room", (await p.$$eval(".screen:not([hidden]) [data-tabs] [data-go]", (xs) => xs.map((x) => x.dataset.go).join())) === "bar,practice,course,studyroom");
  const nTopics = await p.locator("#bar-topics [data-find]").count();
  await p.fill("#bar-find", "vertex"); await p.waitForTimeout(150);
  const shown = await p.locator("#bar-topics [data-find]:not([hidden])").count();
  ok("Find a topic filters the list", nTopics >= 14 && shown >= 1 && shown < nTopics, `${shown}/${nTopics}`);
  await p.fill("#bar-find", "zzzz"); await p.waitForTimeout(150);
  ok("…and says when nothing matches", await vis(p, "#bar-none"));
  await p.fill("#bar-find", ""); await p.waitForTimeout(100);
  await p.click('#bar-body .bar-item[data-go-arg="formulas"]'); await p.waitForTimeout(400);
  ok("Formula sheet opens the real formula reference", (await screen(p)) === "library" && (await p.locator("#lib-main .formula").count()) >= 10);
  ok("Lessons and formulas belong to The Bar in the island", (await p.getAttribute('#main-nav [data-go="bar"]', "aria-current")) === "page");
  await go(p, "bar");
  await p.locator("#bar-topics .bar-row").first().locator('[data-level="simple"]').click(); await p.waitForTimeout(500);
  ok("Guided starts step-by-step practice (the old Simple)", (await screen(p)) === "practice" && await vis(p, "#prac-run"));
  await go(p, "bar");
  await p.click('[data-subject-seg] [data-subject-pick="physics"]'); await p.waitForTimeout(400);
  ok("Switching subject in The Bar stays in The Bar, now Physics", (await screen(p)) === "bar" && (await p.evaluate(() => document.body.dataset.subject)) === "physics");
  ok("Physics Bar: labs are listed and marked optional", /Labs/.test(await p.textContent("#bar-body .bar-menu")) && /Optional/.test(await p.textContent("#bar-body .bar-menu")));
  await p.click('#bar-body .bar-item[data-go-arg="labs"]'); await p.waitForTimeout(500);
  ok("Labs open in Learn, outside any test flow", (await screen(p)) === "phys" && await vis(p, '[data-tool-host="explorer"]'));
  await p.context().close();

  // ── 6. accent colour: every theme, readable, saved, before first paint
  p = await mk();
  for (const th of ["cafe", "light", "arctic", "galaxy", "cinnamon"]) {
    await p.click("#btn-settings"); await p.waitForTimeout(100);
    await p.click(`#set-theme [data-theme-opt="${th}"]`); await p.waitForTimeout(100);
    await p.click('#set-accent [data-accent="teal"]'); await p.waitForTimeout(120);
    await p.keyboard.press("Escape"); await p.waitForTimeout(80);
    const t = await tokens(p, ["--accent", "--accent-ink", "--accent-strong", "--surface", "--bg"]);
    const r = ratio(t["--accent"], t["--surface"]), r2 = ratio(t["--accent"], t["--bg"]), ri = Math.min(ratio(t["--accent-ink"], t["--accent"]), ratio(t["--accent-ink"], t["--accent-strong"]));
    ok(`${th}: teal accent reads on the theme (accent ${r.toFixed(1)}:1, on accent ${ri.toFixed(1)}:1)`, r >= 4.5 && r2 >= 4.5 && ri >= 4.5);
  }
  const btnBg = await p.evaluate(() => getComputedStyle(document.querySelector("#mode-preview #btn-start")).backgroundImage);
  ok("Buttons follow the accent", /linear-gradient/.test(btnBg));
  await p.reload(); await p.waitForTimeout(50);
  ok("Accent survives reload and is applied before the app starts", await p.evaluate(() => !!document.documentElement.style.getPropertyValue("--accent")) && (await p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.ui.v1")).accent)) === "teal");
  await enterIf(p); await p.waitForTimeout(300);
  await p.click("#btn-settings"); await p.click('#set-accent [data-accent="theme"]'); await p.waitForTimeout(100); await p.keyboard.press("Escape");
  ok("Theme's own accent removes the override", !(await p.evaluate(() => document.documentElement.style.getPropertyValue("--accent"))));
  // café scene setting
  await p.click("#btn-settings"); await p.click('#set-scene [data-scene-opt="off"]'); await p.waitForTimeout(150); await p.keyboard.press("Escape");
  ok("Café scene: Plain turns the backdrop off", (await p.evaluate(() => document.documentElement.dataset.scene)) === "off" && await p.evaluate(() => !document.querySelector("#cafe-bg.ready")));
  await p.reload(); await p.waitForTimeout(200);
  ok("…and is remembered", (await p.evaluate(() => document.documentElement.dataset.scene)) === "off");
  await p.context().close();

  // ── 7. calm by default when the user prefers reduced motion; phone width
  p = await mk({}, { reducedMotion: "reduce" });
  ok("Reduced motion: the café photo stays still (no drift)", (await p.evaluate(() => window.Cafe.effective())) === "photo" && await p.evaluate(() => document.querySelector(".cafe-photo").getAnimations().length === 0));
  await p.context().close();
  for (const subject of ["math", "physics"]) {
    p = await mk({ "campfire-prep.subject.v1": subject }, { viewport: { width: 390, height: 844 } });
    const bad = [];
    for (const w of ["home", "bar", "progress"]) { await go(p, w); if ((await overflow(p)) > 0) bad.push(w); }
    ok(`Phone (${subject}): home, The Bar and Diagnostics fit`, !bad.length, bad.join());
    ok(`Phone (${subject}): the island stays on one row`, await p.evaluate(() => { const r = [...document.querySelectorAll("#island > :not([hidden])")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => Math.round(e.getBoundingClientRect().top)); return Math.max(...r) - Math.min(...r) < 20; }));
    await p.context().close();
  }

  ok("No page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
  await b.close();
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - fail}/${results.length} passed`);
  process.exit(fail ? 1 : 0);
})();
