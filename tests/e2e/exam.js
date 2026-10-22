// Exam-first checks: Physics uses the same home screen and test interface as Precalculus, active tests show only
// exam controls (no subject switcher, menus, labs, topic names, method-revealing formulas or tours), hints are off
// unless allowed, Math tests include quadratic transformations, and both subjects keep separate data.
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/exam.js
const { chromium } = require("playwright");
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const SHOTS = process.env.SHOTS;
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const DONE = { site: "completed", test: "completed", game: "completed" };

(async () => {
  const b = await chromium.launch();
  const mk = async (seed = {}, viewport = { width: 1440, height: 900 }) => {
    const ctx = await b.newContext({ viewport });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, "campfire-prep.prefs.v1": { mode: "normal" }, ...seed });
    await p.goto(BASE); await p.waitForTimeout(250);
    await p.click("#btn-enter"); await p.waitForTimeout(400);
    return p;
  };
  const screen = (p) => p.evaluate(() => document.body.dataset.screen);
  const sess = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.session.v2") || "null"));
  // every visible, enabled control on the page that is not part of the question or the exam controls
  const stray = (p) => p.evaluate(() => {
    const allowed = "#q-body, #question-card, #topbar-test, .q-nav, #nav-grid, #btn-prev, #btn-next, #btn-submit, #btn-flag, #btn-hint, #tools-btn, #tools-menu, #scratchpad, #calc-panel, #btn-navpop, .test-side, #test-info, #comp-body, #companion, #btn-camp-help, #btn-fuel, #btn-fire-off, .buddy-panel, #settings-pop, #btn-settings, #brand-link, #gz-hud";
    return [...document.querySelectorAll("button, a[href], select, input")].filter((e) => {
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) return false;
      const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none" || e.closest("[hidden]")) return false;
      return !e.closest(allowed);
    }).map((e) => (e.id || e.className || e.tagName) + ":" + (e.textContent || "").trim().slice(0, 20));
  });

  // ── 1. Physics uses the Precalculus home screen
  let p = await mk({ "campfire-prep.subject.v1": "physics" });
  ok("Physics home is the shared home screen", (await screen(p)) === "home" && await vis(p, "#screen-home #mode-track") && !(await vis(p, "#screen-phys")));
  ok("Same four difficulty cards and preview as Precalculus", (await p.locator("#mode-track .mode-card").count()) === 4 && await vis(p, "#mode-preview #btn-start") && await vis(p, "#mode-preview #btn-create"));
  ok("Physics content: greeting, current topic, quick actions", /projectile/i.test(await p.textContent("#home-greeting")) && /Projectile motion/.test(await p.textContent("#topic-card")) && /Lab \(optional\)/.test(await p.textContent("#dash .quick")) && /Lessons/.test(await p.textContent("#dash .quick")));
  ok("No lab, explorer or lesson path on the Physics home", !(await vis(p, "[data-tool-host]")) && !(await vis(p, ".ph-path")) && !(await vis(p, ".ph-tool-cards")));
  ok("Preview example is a real generated Physics question", /g = 9\.81|m\/s/.test(await p.textContent("#mode-preview .mp-ex-q")));
  if (SHOTS) await p.screenshot({ path: SHOTS + "/ex-phys-home.png" });
  await p.click("#mode-preview #btn-start"); await p.waitForTimeout(900);
  let s = await sess(p);
  ok("Start (no lab, no tutorial first) opens a real Physics test", (await screen(p)) === "test" && s && s.subject === "physics" && s.level === "normal");
  ok("Active Physics test: no subject switcher, island menu or other navigation", !(await vis(p, "#subject-btn")) && !(await vis(p, "#main-nav")) && (await stray(p)).length === 0, JSON.stringify(await stray(p)));
  ok("Active Physics test: topic name hidden (it would give away the method)", !(await vis(p, "#q-topic")));
  ok("Active Physics test: hints off by default (exam conditions)", !(await vis(p, "#btn-hint")) && s.hints === false);
  await p.click("#btn-settings"); await p.waitForTimeout(150);
  ok("Settings during a test hide the help tours", !(await vis(p, "#set-help")) && await vis(p, "#set-lang"));
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  await p.click("#brand-link"); await p.waitForTimeout(200);
  ok("The brand/home control asks before leaving the test", await p.evaluate(() => document.getElementById("dialog").open));
  await p.click("#dialog-cancel"); await p.waitForTimeout(150);
  ok("…and staying keeps the test", (await screen(p)) === "test");
  if (SHOTS) await p.screenshot({ path: SHOTS + "/ex-phys-test.png" });
  // finish quickly and check the review shows the topic
  await p.click("#btn-submit"); await p.waitForTimeout(150); await p.click("#dialog-ok"); await p.waitForTimeout(700);
  ok("Review shows each question's topic after submitting", (await screen(p)) === "results" && (await p.locator("#review-list .topic-tag").count()) > 0);
  await p.click("#btn-home"); await p.waitForTimeout(400);
  ok("Back home: the finished Physics test is in Recent activity", /Physics test/.test(await p.textContent("#activity")));
  await p.context().close();

  // ── 2. Studio layout: a general formula sheet for Physics, nothing question-specific for Math
  p = await mk({ "campfire-prep.subject.v1": "physics", "campfire-prep.ui.v1": { layout: "studio" } });
  await p.click("#mode-preview #btn-start"); await p.waitForTimeout(900);
  const sheet1 = await p.textContent("#test-info");
  await p.click("#btn-next"); await p.waitForTimeout(200);
  const sheet2 = await p.textContent("#test-info");
  ok("Physics (Studio): the formula sheet is the same for every question", /Formula sheet/.test(sheet1) && sheet1 === sheet2);
  await p.context().close();
  p = await mk({ "campfire-prep.ui.v1": { layout: "studio" } });
  await p.evaluate(() => { document.querySelector('#mode-track [data-mode="normal"]').click(); document.querySelector("#btn-start").click(); }); await p.waitForTimeout(900);
  ok("Math (Studio): no question-specific formulas during the test", (await p.textContent("#test-info")).trim() === "");
  ok("Math test: topic hidden and hints off by default too", !(await vis(p, "#q-topic")) && !(await vis(p, "#btn-hint")));
  ok("Math test: same exam controls (no stray navigation)", (await stray(p)).length === 0, JSON.stringify(await stray(p)));
  s = await sess(p);
  const tf = s.items.filter((it) => /^cb-1-ft_/.test(it.qid));
  const marks = await p.evaluate((items) => items.reduce((a, it) => { const q = window.Bank.byId(it.qid) || window.QuadBank.byId(it.qid); return a + (it.kind === "wr" ? q.parts.reduce((x, pp) => x + pp.marks, 0) : 1); }, 0), s.items);
  ok("Math unit test includes quadratic-transformation questions and stays 34 marks", tf.length >= 2 && marks === 34, `${tf.length} transformation items, ${marks} marks`);
  await p.context().close();

  // ── 3. Hints only when allowed in Test options; never in Nightmare
  p = await mk({ "campfire-prep.subject.v1": "physics" });
  await p.click("#mode-preview #btn-create"); await p.waitForTimeout(250);
  ok("Test options offer 'Allow hints' (off by default)", await vis(p, "#s-hints") && !(await p.isChecked("#s-hints")));
  await p.check("#s-hints"); await p.click("#s-go"); await p.waitForTimeout(900);
  ok("With hints allowed, Normal shows the hint button", (await screen(p)) === "test" && await vis(p, "#btn-hint") && (await sess(p)).hints === true);
  await p.click("#btn-quit"); await p.waitForTimeout(120); await p.click("#dialog-ok"); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#mode-track [data-mode="nightmare"]').click()); await p.waitForTimeout(200);
  await p.click("#mode-preview #btn-create"); await p.waitForTimeout(250);
  ok("Nightmare: 'Allow hints' is disabled", await p.isDisabled("#s-hints"));
  await p.click("#s-go"); await p.waitForTimeout(400); if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(800); }
  ok("Nightmare never shows hints, even with the preference on", (await screen(p)) === "test" && !(await vis(p, "#btn-hint")));
  await p.context().close();

  // ── 4. Simple stays guided practice (not a test); labs remain optional elsewhere
  p = await mk({ "campfire-prep.subject.v1": "physics", "campfire-prep.prefs.v1": { mode: "simple" } });
  ok("Simple preview starts guided practice", /guided/i.test(await p.textContent("#mode-preview #btn-start")));
  await p.click("#mode-preview #btn-start"); await p.waitForTimeout(500);
  ok("Simple opens the guided runner, not a timed test", (await screen(p)) === "phys" && !(await sess(p)));
  await p.evaluate(() => document.querySelector('#main-nav [data-go="studyroom"]').click()); await p.waitForTimeout(300);
  ok("The Lab is still available as an optional tool", await vis(p, '[data-tool-host="explorer"] svg'));
  await p.context().close();

  // ── 5. Math curriculum: transformations in Simple practice and the course map
  p = await mk({ "campfire-prep.prefs.v1": { mode: "simple" } });
  ok("Math Simple offers horizontal stretches as a skill", /Horizontal stretches and compressions/.test(await p.textContent("#simple-skill")));
  await p.evaluate(() => document.querySelector('#main-nav [data-go="practice"]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => { const t = [...document.querySelectorAll('[data-tabs] [data-go="course"]')].find((x) => x.offsetParent); if (t) t.click(); }); await p.waitForTimeout(400);
  const course = await p.evaluate(() => document.body.innerText);
  ok("Course map lists the four transformation subtopics", ["Vertical stretches, compressions and reflections", "Horizontal stretches and compressions", "Translations: reading h and k", "Combined transformations"].every((t) => course.includes(t)));
  await p.context().close();

  // ── 6. Studio+ and phone: same workspace for both subjects
  p = await mk({ "campfire-prep.subject.v1": "physics", "campfire-prep.ui.v1": { layout: "studioplus" } });
  ok("Studio+: Physics uses the shared workspace panels", await vis(p, "#splus .sp-diag") && await vis(p, "#splus .sp-launch") && await vis(p, "#splus .sp-curric") && !(await vis(p, "[data-tool-host]")));
  if (SHOTS) await p.screenshot({ path: SHOTS + "/ex-phys-splus.png" });
  await p.context().close();
  p = await mk({ "campfire-prep.subject.v1": "physics" }, { width: 390, height: 844 });
  ok("Phone: Physics home fits", (await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
  await p.context().close();

  ok("No page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
  await b.close();
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - fail}/${results.length} passed`);
  process.exit(fail ? 1 : 0);
})();
