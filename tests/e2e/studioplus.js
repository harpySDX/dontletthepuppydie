// Browser checks for the Studio+ layout: settings, persistence, data integrity, quick actions, viewport use,
const enterIf = async (p) => { if (await p.locator("#btn-enter").isVisible().catch(() => false)) await p.click("#btn-enter"); }; // the app now opens on Home; kept for old saved states
// empty vs populated states, the tour, and that test-taking is unaffected.
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/studioplus.js
const { chromium } = require("playwright");
const { evalNav, toTake } = require("./navhelp");
const toTakeIf = async (pg) => { if (!(await pg.locator("#mode-track").isVisible().catch(() => false)) && (await pg.evaluate(() => document.body.dataset.screen)) !== "test") await toTake(pg); };
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const DONE = { site: "completed", test: "completed", game: "completed" };

// realistic practice records, made from real generated questions (no invented numbers)
const seedPractice = () => {
  const log = []; const now = Date.now();
  const plan = [["F.vertex_to_std", 9, 5], ["G.quadratic", 8, 2], ["D.trinomials", 6, 4], ["H.cosine_law", 5, 1], ["I.compound", 3, 6], ["B.laws", 2, 3]];
  plan.forEach(([sub, d, right], i) => {
    window.Bank.select({ subs: [sub], mode: "normal", n: 6, record: false }).items.forEach((it, j) => {
      const okk = j < right;
      log.push({ date: now - d * 86400000 + j * 60000, quiz: "seed" + i, source: "drill", level: "normal", qid: it.q.id, part: it.part || undefined, kind: it.kind, concepts: window.Concepts.conceptsFor(it.q, it.part || undefined), sub: it.q.meta.sub, family: it.q.meta.family, mode: "normal", correct: okk, blank: false, response: it.kind === "mc" ? undefined : okk ? "k" : "w", choice: it.kind === "mc" ? (okk ? 0 : 1) : undefined });
    });
  });
  localStorage.setItem("campfire-prep.practice.v1", JSON.stringify(log));
  return log.length;
};

(async () => {
  const b = await chromium.launch();
  const mk = async (seed = {}, viewport = { width: 1440, height: 900 }, ctxIn) => {
    const ctx = ctxIn || await b.newContext({ viewport });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    p.on("dialog", (d) => d.accept());
    if (!ctxIn) await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, ...seed });
    await p.goto(BASE); await p.waitForTimeout(300);
    return p;
  };
  const enter = async (p) => { await enterIf(p); await p.waitForTimeout(350); };

  // ── 1. settings offer four layouts; choosing Studio+ swaps the Home workspace and persists
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((d) => { if (!localStorage.getItem("campfire-prep.onboarding.v1")) localStorage.setItem("campfire-prep.onboarding.v1", JSON.stringify(d)); }, DONE);
  let p = await mk({}, null, ctx);
  await enter(p);
  await p.click("#btn-settings"); await p.waitForTimeout(150);
  const lays = await p.$$eval("#set-layout [data-layout]", (xs) => xs.map((x) => x.dataset.layout));
  ok("Settings list four layouts: Balanced, Focus, Studio, Studio+", JSON.stringify(lays) === JSON.stringify(["balanced", "focus", "studio", "studioplus"]), lays.join(","));
  ok("Studio+ is described as a layout (not a difficulty)", /Studio\+/.test(await p.textContent('#set-layout [data-layout="studioplus"]')));
  await p.click('#set-layout [data-layout="studioplus"]'); await p.waitForTimeout(200);
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  ok("Studio+ replaces the Home dashboard with the workspace", await vis(p, "#splus .sp-top") && !(await vis(p, "#dash")));
  ok("Studio+ is selected in Settings (aria-checked)", await p.evaluate(() => { document.querySelector("#btn-settings").click(); const r = document.querySelector('#set-layout [data-layout="studioplus"]').getAttribute("aria-checked"); document.querySelector("#btn-settings").click(); return r === "true"; }));
  await p.reload(); await p.waitForTimeout(300); await enter(p);
  ok("Layout persists after reload", await vis(p, "#splus .sp-top"));
  const st = await ctx.storageState(); await ctx.close();
  const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 }, storageState: st });
  p = await mk({}, null, ctx2); await enter(p);
  ok("Layout persists after a full browser restart", await vis(p, "#splus .sp-top"));

  // ── 2. empty state is honest
  const diagEmpty = await p.textContent("#splus .sp-diag");
  ok("Empty: diagnostics say there's no data and show no invented numbers", /No answers yet/.test(diagEmpty) && !/\d+%/.test(diagEmpty));
  const metrics = await p.$$eval("#splus .sp-metric b", (xs) => xs.map((x) => x.textContent));
  ok("Empty: metrics show dashes (and 0 of N subtopics)", metrics.slice(0, 5).every((m) => m === "—") && /^0\/\d+$/.test(metrics[5]), metrics.join(" "));
  ok("Empty: history explains what will appear", /will be listed here/.test(await p.textContent("#splus .sp-hist-p")));
  await ctx2.close();

  // ── 3. populated: every number traces back to stored records
  p = await mk({ "campfire-prep.ui.v1": { layout: "studioplus" } });
  const n = await p.evaluate(seedPractice);
  await p.reload(); await p.waitForTimeout(300); await enter(p);
  const truth = await p.evaluate(() => {
    const log = JSON.parse(localStorage.getItem("campfire-prep.practice.v1"));
    const subs = new Set(log.map((r) => r.sub)).size;
    return { subs, total: window.Curriculum.SUBS.length };
  });
  const m2 = await p.$$eval("#splus .sp-metric b", (xs) => xs.map((x) => x.textContent));
  ok("Answers marked = stored answers", Number(m2[0]) === n, `${m2[0]} vs ${n}`);
  ok("Subtopics practised = distinct subtopics in the records", m2[5] === `${truth.subs}/${truth.total}`, m2[5]);
  ok("Tests taken stays '—' with no tests", m2[2] === "—");
  ok("Trend has one bar per real session", (await p.locator("#splus .sp-bar").count()) === 6);
  const weak = await p.$$eval("#splus .sp-diag .sp-list:first-of-type .sp-link", (xs) => xs.map((x) => x.textContent));
  ok("Weakest list is populated from real accuracy", weak.length >= 1, weak.join(" | "));
  const unitG = await p.textContent('#splus [data-sp-unit="G"]');
  ok("Curriculum overview counts practised subtopics per unit", /1\/5/.test(unitG), unitG.replace(/\s+/g, " ").trim());
  const hist = await p.locator("#splus .sp-hist .act-item").count();
  ok("History lists the six real sessions", hist === 6, hist + "");

  // ── 4. quick actions
  await p.click('[data-sp-mode="normal"]'); await p.waitForTimeout(150);
  ok("Launcher level click selects Normal and saves it", (await p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.prefs.v1") || "{}").mode)) === "normal" && (await p.getAttribute('[data-sp-mode="normal"]', "aria-checked")) === "true");
  await p.selectOption("#sp-unit", "G"); await p.waitForTimeout(150);
  await p.selectOption("#sp-sub", "G.interval");
  await p.click("#sp-go-topic"); await p.waitForTimeout(350);
  const run = await p.evaluate(() => { const r = document.querySelector("#prac-run")._run; return r ? r.items.map((it) => ({ m: it.q.meta.mode, s: it.q.meta.subs })) : null; });
  ok("Topic launcher starts that subtopic at exactly the chosen level", run && run.length && run.every((x) => x.m === "normal" && x.s.includes("G.interval")), run ? run.length + " questions" : "no run");
  await p.click('#prac-run [data-pr="exit"]'); await p.waitForTimeout(250);
  ok("Leaving returns to the Studio+ workspace", await vis(p, "#splus .sp-top"));
  await p.click('[data-sp-mode="nightmare"]'); await p.waitForTimeout(150);
  ok("Nightmare: topic practice is disabled with an honest note", await p.isDisabled("#sp-go-topic") && /test-only/.test(await p.textContent("#splus .sp-launch")));
  await p.click('[data-sp-mode="normal"]'); await p.waitForTimeout(150);
  const wk = p.locator("#splus .sp-launch [data-sp-drill]").first();
  if (await wk.count() && !(await wk.isDisabled())) {
    const cid = await wk.getAttribute("data-sp-drill");
    await wk.click(); await p.waitForTimeout(300);
    const ok2 = await p.evaluate((cid) => { const r = document.querySelector("#prac-run")._run; return r && r.items.every((it) => it.q.meta.mode === "normal" && it.concepts.includes(cid)); }, cid);
    ok("Weakest-skill button practises that concept at the chosen level", ok2, cid);
    await p.click('#prac-run [data-pr="exit"]'); await p.waitForTimeout(300);
    ok("…and leaving it returns to the workspace", await vis(p, "#splus .sp-top"));
  } else ok("Weakest-skill button practises that concept at the chosen level", false, "no button");
  if (!(await vis(p, "#splus .sp-top"))) { await p.evaluate(() => document.querySelector('#main-nav [data-go="home"]').click()); await p.waitForTimeout(300); }
  await p.click('#splus .sp-launch [data-go="review"]'); await p.waitForTimeout(300);
  ok("Review incorrect answers opens Review", (await p.evaluate(() => document.body.dataset.screen)) === "review");
  await p.evaluate(() => document.querySelector('#main-nav [data-go="home"]').click()); await p.waitForTimeout(300);
  await p.click('#splus [data-sp-tool="calc"]'); await p.waitForTimeout(250);
  ok("Calculator opens from the tools strip", await vis(p, "#calc-panel"));
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  await p.click('#splus [data-sp-tool="lang"]'); await p.waitForTimeout(200);
  ok("Language opens Settings with the language picker focused", await p.evaluate(() => !document.querySelector("#settings-pop").hidden && document.activeElement.closest("#set-lang") !== null));
  await p.click('#set-lang [data-lang="fr"]'); await p.waitForTimeout(250); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  ok("Workspace re-renders in the chosen language", /Diagnostic d'apprentissage/.test(await p.textContent("#splus")));
  await p.evaluate(() => { document.querySelector("#btn-settings").click(); document.querySelector('#set-lang [data-lang="en"]').click(); document.querySelector("#btn-settings").click(); }); await p.waitForTimeout(200);
  await p.click('#splus [data-sp-unit="H"]'); await p.waitForTimeout(300);
  ok("A unit row opens the course screen on that unit", (await p.evaluate(() => document.body.dataset.screen)) === "course" && (await p.evaluate(() => document.querySelector('.course-unit[data-unit="H"]').open)));
  await p.evaluate(() => document.querySelector('#main-nav [data-go="home"]').click()); await p.waitForTimeout(300);

  // ── 5. viewport use: fills the screen on desktop, panels scroll inside, no sideways scroll on a phone
  const geo = await p.evaluate(() => { const r = document.querySelector("#splus").getBoundingClientRect(); return { bottom: r.bottom, h: innerHeight, w: r.width, vw: innerWidth, docH: document.documentElement.scrollHeight }; });
  ok("Desktop: workspace fills the viewport height and width", geo.bottom <= geo.h + 2 && geo.bottom >= geo.h - 40 && geo.w >= geo.vw - 60, JSON.stringify(geo));
  // ── 6. test-taking is unaffected: the test screen looks exactly as in Balanced
  const testCols = async (page) => page.evaluate(() => getComputedStyle(document.querySelector(".test-layout")).gridTemplateColumns);
  await p.click('#splus .sp-launch [data-start-mode="normal"]'); await p.waitForTimeout(600);
  ok("Practice test starts from the launcher", (await p.evaluate(() => document.body.dataset.screen)) === "test");
  const colsPlus = await testCols(p);
  ok("Tutor stays hidden during the test", !(await vis(p, "#tutor-launcher")));
  const pb = await mk({ "campfire-prep.ui.v1": { layout: "balanced" }, "campfire-prep.prefs.v1": { mode: "normal" } }); await enter(pb);
  await toTakeIf(pb); await pb.click("#btn-start");
  await pb.waitForTimeout(600);
  ok("Test layout under Studio+ matches Balanced", colsPlus === (await testCols(pb)), colsPlus);
  await pb.close();

  // ── 7. the site tour shows the classic dashboard it explains, then gives Studio+ back
  const pt = await mk({ "campfire-prep.ui.v1": { layout: "studioplus" } }); await enter(pt);
  await pt.click('#splus [data-onboard="site"]'); await pt.waitForTimeout(500);
  ok("During the site tour the classic dashboard is shown", await vis(pt, "#dash") && !(await vis(pt, "#splus")));
  await pt.keyboard.press("Escape"); await pt.waitForTimeout(300);
  ok("After the tour Studio+ is back", await vis(pt, "#splus .sp-top") && !(await vis(pt, "#dash")));
  await pt.click("#btn-settings"); await pt.click('#set-layout [data-layout="balanced"]'); await pt.waitForTimeout(200); await pt.keyboard.press("Escape");
  ok("Switching back to Balanced restores the dashboard", await vis(pt, "#dash") && !(await vis(pt, "#splus")));

  // ── 8. phone
  const pp = await mk({ "campfire-prep.ui.v1": { layout: "studioplus" } }, { width: 390, height: 844 });
  await pp.evaluate(seedPractice); await pp.reload(); await pp.waitForTimeout(300); await enter(pp);
  ok("Phone: no horizontal scroll, panels stacked", await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1) && await vis(pp, "#splus .sp-hist-p"));

  ok("No page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await b.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
