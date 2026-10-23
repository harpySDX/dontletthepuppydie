// Information-architecture checks: one navigation model for both subjects.
const enterIf = async (p) => { if (await p.locator("#btn-enter").isVisible().catch(() => false)) await p.click("#btn-enter"); }; // the app now opens on Home; kept for old saved states
//   island = Home · The Bar · Diagnostics (pinned on wide screens, collapsible on narrow ones)
//   The Bar → menu (topic practice, practice sets, lessons, formula sheet, Study Room / Labs) and tabs
//             The Bar / Skills / Whole course / Study Room (Math only); Lessons: Math Concept Library ·
//             Physics Lessons / Formula reference / Labs (optional)
//   Diagnostics → Overview (stats, diagnostics, goals, history) / Mistakes & review / Study plan (Math only)
// Tests start from Home's difficulty cards; labs are never on the way to a test; old routes still resolve.
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/ia.js
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
  const mk = async (seed = {}, viewport = { width: 1440, height: 900 }) => {
    const ctx = await b.newContext({ viewport });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, "campfire-prep.prefs.v1": { mode: "normal" }, ...seed });
    await p.goto(BASE); await p.waitForTimeout(250);
    await enterIf(p); await p.waitForTimeout(400);
    return p;
  };
  const screen = (p) => p.evaluate(() => document.body.dataset.screen);
  const island = (p) => p.$$eval("#main-nav [data-go]", (xs) => xs.map((x) => x.dataset.go).join());
  const tabs = (p) => p.$$eval(".screen:not([hidden]) [data-tabs] [data-go]", (xs) => xs.map((x) => x.dataset.go).join());
  const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  // route through the app's own [data-go] delegation, the way older links (Studio+, results, tours) do
  const legacy = async (p, where) => { await p.evaluate((w) => { const x = document.createElement("button"); x.dataset.go = w; x.hidden = true; document.body.appendChild(x); x.click(); x.remove(); }, where); await p.waitForTimeout(300); };

  for (const subject of ["math", "physics"]) {
    const P = subject === "physics";
    const p = await mk({ "campfire-prep.subject.v1": subject });
    const tag = P ? "Physics" : "Math";

    // ── shell
    ok(`${tag}: top bar has exactly Home · Tests · Game · The Bar · Diagnostics`, (await island(p)) === "home,take,game,bar,progress", await island(p));
    ok(`${tag}: on the café home the tiles replace the section links`, !(await vis(p, "#main-nav")) && (await p.$$eval(".hub-tiles [data-go]", (xs) => xs.map((x) => x.dataset.go).join())) === "game,take,progress");
    await toTake(p);
    ok(`${tag}: on other pages the section links are pinned (no hidden menu)`, await vis(p, "#main-nav") && await p.evaluate(() => document.getElementById("island").classList.contains("pinned")));
    ok(`${tag}: Take a Test has one primary path (difficulty cards + preview) and no Quick actions panel`, await vis(p, "#mode-track") && await vis(p, "#mode-preview #btn-start") && !(await vis(p, "#dash .quick")));
    await go(p, "home");
    ok(`${tag}: Home never shows a lab, explorer or lesson path`, !(await vis(p, "[data-tool-host]")) && !(await vis(p, ".ph-path")) && !(await vis(p, ".ph-tool-cards")));

    // ── Practice
    await go(p, "practice");
    ok(`${tag}: The Bar's tabs`, (await tabs(p)) === (P ? "bar,practice,course" : "bar,practice,course,studyroom"), await tabs(p));
    ok(`${tag}: Skills tab shows per-skill cards at every level`, P ? (await p.locator("#drills .phys-host [data-ph-fams]").count()) >= 8 : (await p.locator("#drills .drill").count()) >= 4);
    ok(`${tag}: no duplicate full-test row inside Practice`, !(await vis(p, "#drills .tests-row")));
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/ia-${subject}-practice.png` });
    await go(p, "course");
    ok(`${tag}: Whole course tab renders the course map`, (await screen(p)) === "course" && (P ? await vis(p, "#screen-course .phys-host .ph-legend") : (await p.textContent("#screen-course")).length > 200));

    // ── Learn
    await go(p, "library");
    if (P) {
      const lt = await p.$$eval("#phys-root [data-ph-ltab]", (xs) => [...new Set(xs.map((x) => x.dataset.phLtab))].join());
      ok("Physics: Learn has Lessons, Formula reference and optional Labs", (await screen(p)) === "phys" && lt === "lessons,formulas,labs", lt);
      await p.click('#phys-root [data-ph-ltab="labs"]'); await p.waitForTimeout(300);
      ok("Physics: Labs are labelled optional and mount the explorer", /optional/i.test(await p.textContent("#phys-root")) && await vis(p, '[data-tool-host="explorer"] svg'));
      ok("Physics: Lessons keep The Bar active in the island", (await p.getAttribute('#main-nav [data-go="bar"]', "aria-current")) === "page");
    } else {
      ok("Math: Learn opens the Concept Library", (await screen(p)) === "library" && await vis(p, "#lib-nav"));
    }

    // ── Progress
    await go(p, "progress");
    ok(`${tag}: Diagnostics tabs`, (await tabs(p)) === (P ? "progress,review" : "progress,review,learning"), await tabs(p));
    ok(`${tag}: Diagnostics holds the Goals`, P ? await vis(p, "#progress-phys .card h2:text-is('Goals'), #progress-phys .goals-card") || /Goals/.test(await p.textContent("#progress-phys")) : await vis(p, "#progress-math .goals-card #goals"));
    ok(`${tag}: only this subject's Diagnostics panel is shown`, P ? await vis(p, "#progress-phys") && !(await vis(p, "#progress-math")) : await vis(p, "#progress-math") && !(await vis(p, "#progress-phys")));
    if (P) ok("Physics: diagnostics and history live in Diagnostics", /Diagnostics by skill/.test(await p.textContent("#progress-phys")) && await vis(p, '#progress-phys [data-ph-start="diag"]'));
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/ia-${subject}-progress.png` });
    await go(p, "review");
    ok(`${tag}: Mistakes & review shows this subject's review`, P ? await vis(p, "#review-phys") && !(await vis(p, "#rv-body")) : await vis(p, "#rv-body") && !(await vis(p, "#review-phys")));

    // ── older links still land somewhere sensible
    await legacy(p, "studyroom");
    ok(`${tag}: old "studyroom" link resolves`, P ? (await screen(p)) === "phys" && await vis(p, '[data-tool-host="explorer"] svg') : (await screen(p)) === "studyroom");
    await legacy(p, "learning");
    ok(`${tag}: old "learning" link resolves`, (await screen(p)) === (P ? "progress" : "learning"));

    // ── the test is focused: no island, subject switcher, labs or tutor
    await go(p, "home");
    await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await p.waitForTimeout(150);
    await toTakeIf(p); await p.click("#mode-preview #btn-start"); await p.waitForTimeout(900);
    ok(`${tag}: Home → Normal starts the test directly (no lab, no extra page)`, (await screen(p)) === "test");
    ok(`${tag}: the test hides navigation, subject switching, labs and the tutor`, !(await vis(p, "#main-nav")) && !(await vis(p, "#subject-btn")) && !(await vis(p, "[data-tool-host]")) && !(await vis(p, "#tutor-launcher")));
    await p.click("#btn-quit"); await p.waitForTimeout(150); if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(300); }

    // ── phone width: every destination fits, island collapses
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
    ok(`${tag} phone: island collapses to a menu`, !(await p.evaluate(() => document.getElementById("island").classList.contains("pinned"))));
    const bad = [];
    for (const w of ["home", "bar", "practice", "course", "library", "progress", "review"]) { await go(p, w); if ((await overflow(p)) > 0) bad.push(w); }
    ok(`${tag} phone: no horizontal overflow on any destination`, !bad.length, bad.join(","));
    await p.context().close();
  }

  // ── Physics skill card → practice at that level, and back to Practice
  const p = await mk({ "campfire-prep.subject.v1": "physics" });
  await go(p, "practice");
  await p.click('#drills .phys-host [data-ph-fams][data-level="challenge"]'); await p.waitForTimeout(400);
  const run = await p.evaluate(() => window.PhysUI.current());
  ok("Physics: a skill card's Challenging button starts practice at Challenging", (await screen(p)) === "phys" && run && /-wr-c-/.test(run.id), run && run.id);
  await p.click("[data-ph-leave]").catch(() => {}); await p.waitForTimeout(300);
  if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(300); }
  ok("Physics: leaving practice returns to where it started (The Bar's Skills tab)", (await screen(p)) === "practice", await screen(p));
  await p.context().close();

  ok("No page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
  await b.close();
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - fail}/${results.length} passed`);
  process.exit(fail ? 1 : 0);
})();
