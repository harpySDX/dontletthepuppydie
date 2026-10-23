// Browser checks for onboarding: the site tour, the test-taking tutorial and the campfire minigame tutorial.
const enterIf = async (p) => { if (await p.locator("#btn-enter").isVisible().catch(() => false)) await p.click("#btn-enter"); }; // the app now opens on Home; kept for old saved states
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/onboarding.js
const { chromium } = require("playwright");
const { evalNav, toTake } = require("./navhelp");
const toTakeIf = async (pg) => { if (!(await pg.locator("#mode-track").isVisible().catch(() => false)) && (await pg.evaluate(() => document.body.dataset.screen)) !== "test") await toTake(pg); };
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const KEY = "campfire-prep.onboarding.v1";
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const step = (p) => p.evaluate(() => (window.Tour.step ? window.Tour.step.id : null));
const st = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}"), KEY);
// the spotlight animates into place: poll briefly until it covers the target
const spotOn = async (p, sel) => {
  for (let k = 0; k < 15; k++) {
    const hit = await p.evaluate((sel) => {
      const s = document.querySelector("#tour-spot").getBoundingClientRect(), el = document.querySelector(sel); if (!el) return false;
      const r = el.getBoundingClientRect();
      return s.width > 0 && s.left <= r.left + 1 && s.top <= r.top + 1 && s.right >= r.right - 1 && s.bottom >= r.bottom - 1;
    }, sel);
    if (hit) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const quit = async (p) => { await p.click("#btn-quit"); await p.waitForTimeout(250); if (await vis(p, "#dialog")) await p.click("#dialog-ok"); await p.waitForTimeout(300); await p.evaluate(() => localStorage.removeItem("campfire-prep.session.v2")); };
const cardOnScreen = (p) => p.evaluate(() => { const r = document.querySelector("#tour-card").getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5; });

(async () => {
  const b = await chromium.launch();
  const mk = async (seed, opts = {}) => {
    const ctx = await b.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, reducedMotion: opts.reducedMotion || "no-preference" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    p.on("dialog", (d) => d.accept());
    await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed || {})) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, seed || {});
    await p.goto(BASE + (opts.hash || "")); await p.waitForTimeout(300);
    return p;
  };

  // ── 1. first visit: the site tour is offered on Home; skipping at the start is remembered and never blocks the app
  let p = await mk();
  await enterIf(p); await p.waitForTimeout(500);
  ok("First visit: site tour opens on Home with a welcome card", (await step(p)) === "welcome" && (await p.evaluate(() => document.body.dataset.screen)) === "home");
  ok("Welcome offers the full tour, the essentials and Skip", /full tour/i.test(await p.textContent("#tour-next")) && await vis(p, '[data-tour-action="essentials"]') && /Skip/.test(await p.textContent("#tour-skip")));
  ok("Step counter shows position", /^1 of \d+$/.test((await p.textContent("#tour-count")).trim()));
  ok("Welcome never mentions the campfire minigame", !/campfire|log|puppy freezes/i.test(await p.textContent("#tour-card")));
  await p.click("#tour-skip"); await p.waitForTimeout(200);
  ok("Skip at the start closes the tour and records 'skipped'", !(await vis(p, "#tour")) && (await st(p)).site === "skipped");
  await toTakeIf(p); await p.click('#mode-track [data-mode="challenge"]'); await p.waitForTimeout(150);
  ok("App is fully usable after skipping", /Challenging/.test(await p.textContent("#mode-preview")));
  await p.reload(); await p.waitForTimeout(400); await enterIf(p); await p.waitForTimeout(400);
  ok("Skipped tour isn't forced again on the next visit", !(await p.evaluate(() => window.Tour.active)));

  // ── 2. replay from Settings → Help; essentials path; Escape midway; independent states
  await p.click("#btn-settings"); await p.click('#set-help [data-onboard="site"]'); await p.waitForTimeout(400);
  ok("Replay from Settings → Help starts the site tour", (await step(p)) === "welcome");
  await p.click('[data-tour-action="essentials"]'); await p.waitForTimeout(1100);
  const essN = Number((await p.textContent("#tour-count")).match(/of (\d+)/)[1]);
  ok("'Just the essentials' is a short path", essN <= 7 && (await step(p)) === "nav", `${essN} steps`);
  ok("Island step: the island opens and is highlighted", await p.evaluate(() => document.querySelector("#island").classList.contains("open")) && await spotOn(p, "#island"));
  await evalNav(p, "practice", 300);
  ok("Island step is interactive: switching section works during the tour", (await p.evaluate(() => document.body.dataset.screen)) === "practice" && (await step(p)) === "nav");
  await p.click("#tour-next"); await p.waitForTimeout(500);
  ok("Modes step opens Take a Test and highlights the carousel", (await p.evaluate(() => document.body.dataset.screen)) === "take" && await spotOn(p, "#mode-track"));
  await toTakeIf(p); await p.click('#mode-track [data-mode="nightmare"]'); await p.waitForTimeout(200);
  ok("Selecting a mode during the tour only previews it", /Nightmare/.test(await p.textContent("#mode-preview")) && !(await p.evaluate(() => localStorage.getItem("campfire-prep.session.v2"))) && (await p.evaluate(() => document.body.dataset.screen)) === "take");
  await p.click("#tour-next"); await p.waitForTimeout(400);
  ok("Settings step highlights the puppy button", (await step(p)) === "settings" && await spotOn(p, "#btn-settings"));
  await p.click("#btn-settings"); await p.waitForTimeout(500);
  ok("Opening Settings advances to the language step", (await step(p)) === "language" && await vis(p, "#settings-pop") && await spotOn(p, "#set-lang"), JSON.stringify([await step(p), await vis(p, "#settings-pop"), await spotOn(p, "#set-lang")]));
  await p.click('#set-lang [data-lang="fr"]'); await p.waitForTimeout(300);
  ok("Language change during the tour: same step, card re-rendered in French", (await step(p)) === "language" && /Changer de langue/.test(await p.textContent("#tour-title")) && /Suivant/.test(await p.textContent("#tour-next")) && /sur/.test(await p.textContent("#tour-count")));
  ok("…the interface changed too (Settings and nav)", /Réglages/.test(await p.textContent("#settings-pop")) && (await p.getAttribute("html", "lang")) === "fr");
  ok("…the spotlight still finds its (re-rendered) target", await spotOn(p, "#set-lang"));
  ok("Clicking the tour card doesn't close the Settings popover", await (async () => { await p.click("#tour-title"); await p.waitForTimeout(100); return vis(p, "#settings-pop"); })());
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  ok("Escape exits the tour midway", !(await p.evaluate(() => window.Tour.active)));
  ok("Language choice survives the tour", (await p.getAttribute("html", "lang")) === "fr" && JSON.parse(await p.evaluate(() => localStorage.getItem("campfire-prep.ui.v1"))).lang === "fr");
  const s2 = await st(p);
  ok("Exiting midway records the site tour only (test/game untouched)", s2.site === "skipped" && !s2.test && !s2.game);
  await p.click("#btn-settings"); await p.click('#set-lang [data-lang="en"]'); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  await p.close();

  // ── 3. full site tour, every target present, card on screen, completion recorded; reload mid-tour resumes
  p = await mk();
  await enterIf(p); await p.waitForTimeout(500);
  const seen = [];
  for (let k = 0; k < 20 && (await p.evaluate(() => window.Tour.active)); k++) {
    const id = await step(p); seen.push(id);
    const miss = await p.locator(".tour-missing").count(), onScreen = await cardOnScreen(p);
    if (miss || !onScreen) ok(`Site step '${id}' has its target and an on-screen card`, false);
    if (id === "library") { await p.reload(); await p.waitForTimeout(900); await enterIf(p);await p.waitForTimeout(700); ok("Reload mid-tour: reopening resumes at the same step", (await step(p)) === "library"); }
    await p.click("#tour-next"); await p.waitForTimeout(450);
  }
  ok("Full site tour visits every section in order", ["welcome", "dash", "activity", "nav", "modes", "preview", "library", "lesson", "settings", "language", "look", "tests", "room", "tools", "done"].every((x) => seen.includes(x)), seen.join(","));
  ok("Completing records 'completed' and lands on Home", (await st(p)).site === "completed" && (await p.evaluate(() => document.body.dataset.screen)) === "home");
  ok("Completing the site tour doesn't mark the test tutorial", !(await st(p)).test);
  ok("No tour step targets the campfire", !seen.some((x) => /camp|fire|gm/.test(x)));
  await p.close();

  // ── 4. test-taking tutorial: practice copy, live checking with the real engine, nothing recorded
  p = await mk({ [KEY]: { site: "completed" } });
  await enterIf(p); await p.waitForTimeout(300);
  await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await p.waitForTimeout(150);
  await toTakeIf(p); await p.click('#mode-preview [data-onboard="test"]'); await p.waitForTimeout(700);
  ok("Test tutorial opens from a mode's preview on a practice test", (await step(p)) === "intro" && (await p.evaluate(() => document.body.dataset.screen)) === "test");
  ok("Test tutorial shows no campfire minigame", !(await vis(p, ".buddy-panel")) && !(await vis(p, ".heat-panel")) && !(await vis(p, "#btn-fuel")));
  const ids = [];
  for (let k = 0; k < 20 && (await p.evaluate(() => window.Tour.active)); k++) {
    const id = await step(p); ids.push(id);
    if (await p.locator(".tour-missing").count()) ok(`Test step '${id}' found its target`, false);
    if (id === "answer") {
      await p.fill("#q-body .wr-part input", "(0, 0)"); await p.waitForTimeout(250);
      ok("Live check marks a wrong answer with the real engine", /0\/\d/.test(await p.textContent(".tour-check")));
      await p.click('[data-tour-action="fill"]'); await p.waitForTimeout(300);
      ok("…and a right one as correct", /Correct/.test(await p.textContent(".tour-check")));
    }
    if (id === "plot") { const bx = await p.locator("#q-body .plot-host svg").boundingBox(); await p.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.click(bx.x + bx.width * 0.6, bx.y + bx.height * 0.4); await p.waitForTimeout(150); ok("Plotting works inside the tutorial", (await p.locator("#q-body .pl-handle").count()) === 2); }
    if (id === "hint") { await p.click("#btn-hint"); await p.waitForTimeout(150); ok("Hint can be revealed during the tutorial", (await p.locator("#hint-box li").count()) >= 1); }
    if (id === "graph") { await p.keyboard.press("p"); await p.waitForTimeout(150); ok("Test shortcuts that aren't part of the step are held back (P doesn't pause)", !(await vis(p, "#pause-overlay"))); }
    await p.click("#tour-next"); await p.waitForTimeout(450);
  }
  ok("Test tutorial covers bar, reading, answering, plotting, submitting, hints, navigation, tools, progress, pause", ["bar", "read", "answer", "plot", "submit", "hint", "nav", "tools", "progress", "pause"].every((x) => ids.includes(x)), ids.join(","));
  const rec = await p.evaluate(() => ["campfire-prep.session.v2", "campfire-prep.history.v2", "campfire-prep.practice.v1"].map((k) => localStorage.getItem(k)));
  ok("Nothing from the practice copy is saved (no session, history or practice records)", rec.every((x) => x === null || x === "[]"), JSON.stringify(rec));
  ok("Test tutorial recorded separately; site state untouched", (await st(p)).test === "completed" && (await st(p)).site === "completed" && !(await st(p)).game);
  ok("After the tutorial you're back where you started (Take a Test)", (await p.evaluate(() => document.body.dataset.screen)) === "take");
  await p.close();

  // ── 5. campfire minigame: first launch shows only the intro; clock held; one log; replay; no re-prompt after skip
  const startCamp = async (pg, extra = {}) => {
    await toTakeIf(pg); await pg.click('#mode-track [data-mode="normal"]'); await toTakeIf(pg); await pg.click("#btn-create"); await pg.waitForTimeout(250);
    await pg.check("#s-camp", { force: true });
    await pg.evaluate(() => { document.querySelector("#s-camp-custom").open = true; });
    if (extra.hardcore) await pg.check("#s-hardcore", { force: true });
    await pg.click("#s-go"); await pg.waitForTimeout(1100);
  };
  p = await mk({ [KEY]: { site: "completed" } }, { hash: "#debug" });
  await enterIf(p); await p.waitForTimeout(300);
  await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(800);
  ok("A test without the campfire never shows the minigame tutorial", !(await p.evaluate(() => window.Tour.active)) && !(await st(p)).gameOpened);
  await quit(p);
  await startCamp(p, { hardcore: true });
  ok("First campfire test: only the minigame intro appears", (await step(p)) === "intro" && (await p.evaluate(() => window.Tour.id)) === "game");
  ok("Intro offers 'Start tutorial' and 'Skip tutorial and play'", /Start tutorial/.test(await p.textContent("#tour-next")) && /Skip tutorial and play/.test(await p.textContent("#tour-skip")));
  ok("Site tour was not restarted", (await st(p)).site === "completed" && (await st(p)).gameOpened === true);
  const e0 = await p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.session.v2")).elapsed);
  await p.click("#tour-next"); await p.waitForTimeout(400);
  const gids = [];
  for (let k = 0; k < 20 && (await p.evaluate(() => window.Tour.active)); k++) {
    const id = await step(p); gids.push(id);
    if (await p.locator(".tour-missing").count()) ok(`Game step '${id}' found its target`, false);
    if (id === "log") {
      await p.click("#btn-fuel"); await p.waitForTimeout(300);
      await p.click("#btn-fuel", { timeout: 1000 }).catch(() => {}); await p.keyboard.press("f"); await p.waitForTimeout(2300);
      ok("Try-it step: one log is added, extra presses are held back, then it moves on", (await p.evaluate(() => window.__fire.stats.logs)) === 1 && (await step(p)) !== "log");
      continue;
    }
    await p.click("#tour-next"); await p.waitForTimeout(350);
  }
  const e1 = await p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.session.v2")).elapsed);
  ok("Game tutorial explains the real controls present (gauge, log, companion, lose, off, pause)", ["goal", "gauge", "log", "wind", "oxygen", "kettle", "vent", "tent", "lose", "off", "pause", "done"].every((x) => gids.includes(x)), gids.join(","));
  ok("The test clock is held during the minigame tutorial", e1 - e0 < 3, `${e0} → ${e1}`);
  ok("Game tutorial completion recorded; fire running again", (await st(p)).game === "completed" && await p.evaluate(() => !!window.__fire._raf));
  await p.click("#btn-camp-help"); await p.waitForTimeout(400);
  ok("Replay from the ? button by the campfire", (await p.evaluate(() => window.Tour.id)) === "game" && (await step(p)) === "goal");
  await p.click("#tour-exit"); await p.waitForTimeout(200);
  await quit(p);
  await startCamp(p);
  ok("Second campfire test: no interruption", !(await p.evaluate(() => window.Tour.active)));
  await p.close();

  p = await mk({ [KEY]: { site: "completed" } }, { hash: "#debug" });
  await enterIf(p); await p.waitForTimeout(300);
  await startCamp(p);
  await p.click("#tour-skip"); await p.waitForTimeout(300);
  ok("'Skip tutorial and play' records skipped and the game runs", (await st(p)).game === "skipped" && await p.evaluate(() => !!window.__fire._raf));
  await quit(p);
  await startCamp(p);
  ok("After skipping, later launches aren't interrupted", !(await p.evaluate(() => window.Tour.active)));
  await quit(p);
  await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await toTakeIf(p); await p.click("#btn-create"); await p.waitForTimeout(250);
  await p.check("#s-camp", { force: true }); await p.click('[data-onboard="game-next"]'); await p.waitForTimeout(100);
  ok("Setup offers 'show the campfire tutorial when the test starts'", await vis(p, "#s-camp-tut-note"));
  await p.click("#s-go"); await p.waitForTimeout(1100);
  ok("…and it shows when that test starts", (await p.evaluate(() => window.Tour.id)) === "game");
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  ok("Settings → Help is disabled while a test is open", await (async () => { await p.click("#btn-settings"); await p.waitForTimeout(150); const d = await p.isDisabled('#set-help [data-onboard="site"]'); await p.keyboard.press("Escape"); return d; })());
  await p.close();

  // ── 6. phone width, reduced motion, keyboard
  p = await mk({}, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await enterIf(p); await p.waitForTimeout(500);
  let phoneOk = true;
  for (let k = 0; k < 16 && (await p.evaluate(() => window.Tour.active)); k++) {
    if (!(await cardOnScreen(p))) { phoneOk = false; console.log("  off-screen at", await step(p)); }
    if ((await p.evaluate(() => document.documentElement.scrollWidth)) > 390) { phoneOk = false; console.log("  overflow at", await step(p)); }
    await p.keyboard.press("ArrowRight"); await p.waitForTimeout(400);
  }
  ok("Phone: every card stays on screen, no sideways scroll; ArrowRight moves on", phoneOk && (await st(p)).site === "completed");
  ok("Reduced motion: transitions off", await p.evaluate(() => getComputedStyle(document.querySelector("#tour-card")).transitionDuration.split(",").every((x) => parseFloat(x) === 0)));
  await p.close();

  p = await mk({ [KEY]: { site: "completed" } });
  await enterIf(p); await p.waitForTimeout(300);
  await p.click("#btn-settings"); await p.waitForTimeout(150); // "How it works" lives in Settings → Help (Home no longer has a Quick actions panel)
  await p.focus('#settings-pop [data-onboard="site"]'); await p.keyboard.press("Enter"); await p.waitForTimeout(400);
  ok("Keyboard: How it works opens the tour with focus on Next", (await step(p)) === "welcome" && (await p.evaluate(() => document.activeElement.id)) === "tour-next");
  await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.keyboard.press("Tab");
  ok("Keyboard: Tab stays inside the tour card", await p.evaluate(() => !!document.activeElement.closest("#tour-card")));
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  ok("Keyboard: Escape closes and focus returns to the opener", !(await p.evaluate(() => window.Tour.active)) && (await p.evaluate(() => document.activeElement.id)) === "btn-settings");
  await p.close();

  ok("No JS errors", errors.length === 0, errors.join(" | "));
  await b.close();
  console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error("CRASH", e.message); console.log(errors); process.exit(1); });
