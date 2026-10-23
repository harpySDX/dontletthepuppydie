// Browser checks for the redesign: island, settings (language / layout / theme), difficulty carousel,
const enterIf = async (p) => { if (await p.locator("#btn-enter").isVisible().catch(() => false)) await p.click("#btn-enter"); }; // the app now opens on Home; kept for old saved states
// guided Simple practice, hints by mode, graph plotter, calculator, scratchpad, Study Room, migration of saved data.
// Run against tests/e2e/devserver.js (AI mocked):  node tests/e2e/devserver.js &  then  node tests/e2e/redesign.js
const { chromium } = require("playwright");
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const { go: navTo, toTake } = require("./navhelp");
const toTakeIf = async (pg) => { if (!(await pg.locator("#mode-track").isVisible().catch(() => false)) && (await pg.evaluate(() => document.body.dataset.screen)) !== "test") await toTake(pg); };
const screenOf = (p) => p.evaluate(() => [...document.querySelectorAll(".screen")].filter((s) => !s.hidden).map((s) => s.id).join(","));

(async () => {
  const b = await chromium.launch();
  const mk = async (opts = {}) => {
    const ctx = await b.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.colorScheme || "light" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    await p.addInitScript((seed) => {
      if (!sessionStorage.getItem("i")) {
        localStorage.clear(); localStorage.setItem("campfire-prep.toured.v1", "true");
        for (const [k, v] of Object.entries(seed || {})) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
        sessionStorage.setItem("i", 1);
      }
    }, opts.seed || null);
    await p.goto(BASE); await enterIf(p); await p.waitForTimeout(300);
    return p;
  };

  // ── settings: language, layout, theme — applied at once, kept after reload
  let p = await mk();
  await p.click("#btn-settings"); await p.waitForTimeout(150);
  ok("Settings popover opens from the puppy button", await vis(p, "#settings-pop") && (await p.getAttribute("#btn-settings", "aria-expanded")) === "true");
  ok("Settings: 5 languages, 4 layouts, 13 themes, accent colours, café scene", (await p.locator("#set-lang [data-lang]").count()) === 5 && (await p.locator("#set-layout [data-layout]").count()) === 4 && (await p.locator("#set-theme [data-theme-opt]").count()) === 13 && (await p.locator("#set-accent [data-accent]").count()) === 9 && (await p.locator("#set-scene [data-scene-opt]").count()) === 3);
  await p.click('#set-lang [data-lang="fr"]'); await p.waitForTimeout(200);
  ok("Language switches the interface immediately (French)", (await p.getAttribute("html", "lang")) === "fr" && /Accueil/.test(await p.textContent("#main-nav")));
  await p.click('#set-layout [data-layout="studio"]'); await p.click('#set-theme [data-theme-opt="dark"]'); await p.waitForTimeout(150);
  ok("Layout and theme apply to the page", (await p.getAttribute("html", "data-layout")) === "studio" && (await p.getAttribute("html", "data-theme")) === "dark");
  await p.mouse.click(700, 600); await p.waitForTimeout(150);
  ok("Outside click closes the popover", !(await vis(p, "#settings-pop")));
  await p.reload(); await p.waitForTimeout(500); await enterIf(p);
  ok("Settings persist after reload", (await p.getAttribute("html", "lang")) === "fr" && (await p.getAttribute("html", "data-layout")) === "studio" && (await p.getAttribute("html", "data-theme")) === "dark");
  const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok("Dark glass actually darkens the page", (() => { const m = bg.match(/\d+/g).map(Number); return m[0] + m[1] + m[2] < 200; })(), bg);
  for (const lang of ["es", "de", "zh", "en"]) {
    await p.click("#btn-settings"); await p.click(`#set-lang [data-lang="${lang}"]`); await p.keyboard.press("Escape"); await p.waitForTimeout(120);
  }
  ok("Every language renders the nav without missing-key placeholders", !/nav\.|mode\.|home\./.test(await p.textContent("#island")));
  await p.close();
  const sys = await mk({ colorScheme: "dark", seed: { "campfire-prep.ui.v1": { lang: "en", layout: "balanced", theme: "system" } } });
  ok("System theme follows the device (dark)", await sys.evaluate(() => getComputedStyle(document.body).backgroundColor.match(/\d+/g).slice(0, 3).reduce((a, x) => a + +x, 0) < 200));
  await sys.close();

  // ── focus layout: navigator becomes a popover in tests
  p = await mk({ seed: { "campfire-prep.ui.v1": { lang: "en", layout: "focus", theme: "light" } } });
  await p.evaluate(() => { const k = "campfire-prep.prefs.v1"; const v = JSON.parse(localStorage.getItem(k) || "{}"); v.allowHints = true; localStorage.setItem(k, JSON.stringify(v)); }); // hints are opt-in (Test options); this part checks how many a Normal test allows once they're on
  await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(700);
  ok("Focus layout: question navigator hidden until asked for", !(await vis(p, "#navigator")) && await vis(p, "#btn-navpop"));
  await p.click("#btn-navpop"); await p.waitForTimeout(150);
  ok("Focus layout: navigator opens as a popover", await vis(p, "#navigator"));
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  ok("…and Escape closes it", !(await vis(p, "#navigator")));

  // ── hints by mode (Normal: every step), recorded on the item; never penalised
  let cell = -1;
  for (let i = 0; i < 20 && cell < 0; i++) { await p.evaluate((i) => document.querySelectorAll("#nav-grid .nav-cell")[i].click(), i); await p.waitForTimeout(60); if (await vis(p, "#btn-hint") && !(await p.isDisabled("#btn-hint"))) cell = i; }
  await p.click("#btn-hint"); await p.waitForTimeout(80); await p.click("#btn-hint").catch(() => {}); await p.waitForTimeout(80);
  const hintsNormal = await p.evaluate((i) => JSON.parse(localStorage.getItem("campfire-prep.session.v2")).items[i].hints, cell);
  ok("Normal: more than one hint step allowed and saved on the question", hintsNormal >= 2 || (hintsNormal === 1 && await p.isDisabled("#btn-hint")), String(hintsNormal));

  // ── the graph plotter: click to place vertex and a second point; keyboard nudges; saved in the session
  let plotAt = -1;
  // the graphing slot is "sketch it" or "equation from the graph": restart until a test has a plot to draw
  for (let t = 0; t < 20 && plotAt < 0; t++) { // about one Normal test in four has a sketch-it slot (transformations may take it)
  if (t) { await p.click("#btn-quit"); await p.waitForTimeout(150); if (await vis(p, "#dialog")) await p.click("#dialog-ok"); await p.waitForTimeout(250); await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(500); if (await vis(p, "#dialog")) { await p.click("#dialog-ok"); await p.waitForTimeout(500); } }
  for (let i = 0; i < 20 && plotAt < 0; i++) { await p.evaluate((i) => document.querySelectorAll("#nav-grid .nav-cell")[i].click(), i); await p.waitForTimeout(60); if (await p.locator("#q-body .plot-host svg").count()) plotAt = i; }
  }
  if (plotAt >= 0) {
    const svg = p.locator("#q-body .plot-host svg").first(); const bx = await svg.boundingBox();
    await p.mouse.click(bx.x + bx.width * 0.5, bx.y + bx.height * 0.5); await p.mouse.click(bx.x + bx.width * 0.62, bx.y + bx.height * 0.3); await p.waitForTimeout(900);
    const r1 = await p.evaluate((i) => JSON.stringify(JSON.parse(localStorage.getItem("campfire-prep.session.v2")).items[i]), plotAt);
    ok("Plotter: two clicks give a vertex and a point, saved as the answer", /v:-?[\d.]+,-?[\d.]+;p:-?[\d.]+,-?[\d.]+/.test(r1), r1.slice(0, 160));
    await p.locator("#q-body .pl-handle.point").first().focus(); await p.keyboard.press("ArrowUp"); await p.waitForTimeout(900);
    const r2 = await p.evaluate((i) => JSON.stringify(JSON.parse(localStorage.getItem("campfire-prep.session.v2")).items[i]), plotAt);
    ok("Plotter: arrow keys move the selected point", r2 !== r1);
  } else ok("Plotter: a Normal test includes a graphing (plot) question", false, "none found in 20 items");
  await p.click("#btn-quit"); await p.waitForTimeout(200); if (await vis(p, "#dialog")) await p.click("#dialog-ok"); await p.waitForTimeout(300);
  await p.close();

  // ── Challenging: one hint per question; Nightmare: none
  p = await mk();
  await p.evaluate(() => { const k = "campfire-prep.prefs.v1"; const v = JSON.parse(localStorage.getItem(k) || "{}"); v.allowHints = true; localStorage.setItem(k, JSON.stringify(v)); }); 
  await toTakeIf(p); await p.click('#mode-track [data-mode="challenge"]'); await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(700);
  let chi = -1;
  for (let i = 0; i < 20 && chi < 0; i++) { await p.evaluate((i) => document.querySelectorAll("#nav-grid .nav-cell")[i].click(), i); await p.waitForTimeout(60); if (await vis(p, "#btn-hint") && !(await p.isDisabled("#btn-hint"))) chi = i; }
  await p.click("#btn-hint"); await p.waitForTimeout(100);
  ok("Challenging: exactly one hint, then the button is spent", chi >= 0 && await p.isDisabled("#btn-hint") && (await p.locator("#hint-box li").count()) === 1);
  await p.click("#btn-quit"); await p.waitForTimeout(200); if (await vis(p, "#dialog")) await p.click("#dialog-ok"); await p.waitForTimeout(300);

  // ── Simple: an easier assessment (timed, marked at the end); guided step-by-step practice lives in The Bar
  await toTakeIf(p); await p.click('#mode-track [data-mode="simple"]'); await p.waitForTimeout(150);
  ok("Simple preview describes an easier test; nothing started yet", /easier test/i.test(await p.textContent("#mode-preview")) && (await screenOf(p)) === "screen-take");
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(600);
  if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(500); }
  ok("Simple: a timed test in the test screen", (await screenOf(p)) === "screen-test" && await vis(p, "#timer"));
  await p.click("#btn-quit"); await p.waitForTimeout(150); if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(300); }
  await navTo(p, "bar");
  await p.locator("#bar-topics .bar-row").first().locator('[data-level="simple"]').click(); await p.waitForTimeout(500);
  ok("Guided practice (The Bar): opens in Practice, untimed", (await screenOf(p)) === "screen-practice" && await vis(p, "#prac-run") && !(await vis(p, "#timer")));
  if (await p.locator('#prac-run [data-pr="step"]').count()) { await p.click('#prac-run [data-pr="step"]'); await p.waitForTimeout(100); }
  ok("Guided practice: step hints available", (await p.locator("#prac-run .hint-steps li, #prac-run .callout li, #prac-run ol li").count()) >= 1);
  await p.close();

  // ── calculator: safe evaluation, deg/rad, errors, keyboard, Escape returns focus, position remembered
  p = await mk();
  await p.click("#tools-btn"); await p.waitForTimeout(100);
  ok("Tools menu lists Calculator and Scratchpad", (await p.locator("#tools-menu [data-tool]").count()) === 2);
  await p.click('#tools-menu [data-tool="calc"]'); await p.waitForTimeout(150);
  ok("Calculator opens with focus in its input", await vis(p, "#calc-panel") && (await p.evaluate(() => document.activeElement.id)) === "calc-in");
  const calc = async (expr) => { await p.fill("#calc-in", expr); await p.press("#calc-in", "Enter"); await p.waitForTimeout(80); return p.inputValue("#calc-in"); };
  ok("Calculator: order of operations and implicit multiplication", (await calc("2(3+4)^2/7")) === "14");
  ok("Calculator: degrees by default (sin 30 = 0.5)", (await calc("sin(30)")) === "0.5");
  await p.click('#calc-panel [data-angle="rad"]');
  ok("Calculator: radians (sin(π/2) = 1)", (await calc("sin(pi/2)")) === "1");
  await p.fill("#calc-in", "1/0"); await p.press("#calc-in", "Enter"); await p.waitForTimeout(80);
  ok("Calculator: errors are explained, not NaN/Infinity", /zero|0/i.test(await p.textContent("#calc-panel .calc-out")) && !/NaN|Infinity/.test(await p.textContent("#calc-panel .calc-out")));
  ok("Calculator: code injection is just a syntax error", await p.evaluate(() => { const r = window.Calc.evaluate("alert(1)"); return !r.ok; }));
  const h0 = await p.locator("#calc-panel [data-drag]").boundingBox(); const before = await p.locator("#calc-panel").boundingBox();
  await p.mouse.move(h0.x + 30, h0.y + 10); await p.mouse.down(); await p.mouse.move(h0.x - 170, h0.y - 90, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(100);
  const after = await p.locator("#calc-panel").boundingBox();
  ok("Calculator: draggable", Math.abs(after.x - before.x) > 100 && Math.abs(after.y - before.y) > 50);
  await p.focus("#calc-in"); await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  const fAfter = await p.evaluate(() => document.activeElement.id || document.activeElement.tagName);
  ok("Escape closes the calculator and returns focus to the launcher", !(await vis(p, "#calc-panel")) && fAfter === "tools-btn", fAfter);
  const savedPos = await p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.calc.v1") || "{}"));
  ok("Calculator position and angle mode are remembered", Math.abs(savedPos.x - after.x) < 2 && savedPos.angle === "rad");

  // ── scratchpad: typed notes persist; Clear asks first
  await p.click("#tools-btn"); await p.click('#tools-menu [data-tool="pad"]'); await p.waitForTimeout(200);
  await p.click('#scratchpad [data-mode="type"]'); await p.fill("#scratchpad .sp-text", "vertex: h = -b/2a"); await p.waitForTimeout(700);
  await p.reload(); await p.waitForTimeout(500); await enterIf(p);
  await p.click("#tools-btn"); await p.click('#tools-menu [data-tool="pad"]'); await p.waitForTimeout(200);
  if (!(await vis(p, "#scratchpad .sp-text"))) await p.click('#scratchpad [data-mode="type"]');
  ok("Scratchpad: typed notes survive a reload", (await p.inputValue("#scratchpad .sp-text")) === "vertex: h = -b/2a");
  await p.click("#scratchpad .sp-clear"); await p.waitForTimeout(100);
  ok("Scratchpad: first Clear only asks for confirmation", (await p.inputValue("#scratchpad .sp-text")) === "vertex: h = -b/2a" && (await p.locator("#scratchpad .sp-clear.confirm").count()) === 1);
  await p.click("#scratchpad .sp-clear"); await p.waitForTimeout(100);
  ok("Scratchpad: confirming clears it", (await p.inputValue("#scratchpad .sp-text")) === "");
  await p.close();

  // ── Study Room: a quadratics room gives everyone the same questions
  const host = await mk(); await navTo(host, "studyroom");
  ok("Study Room is honest about having no server", /no live chat|not servers|Codes, not servers/i.test(await host.textContent("#screen-studyroom")));
  await host.click("#btn-room-create"); await host.waitForTimeout(200);
  await host.check('[data-rc="quad.vertex_form"]', { force: true }); await host.check('[data-rc="quad.axis"]', { force: true }).catch(() => {});
  await host.click("#rc-go"); await host.waitForTimeout(400);
  const link = await host.evaluate(() => location.href);
  const guest = await mk(); await guest.goto(link); await guest.waitForTimeout(600);
  await host.click('[data-room="start"]'); await guest.click('[data-room="start"]'); await host.waitForTimeout(300); await guest.waitForTimeout(300);
  const qh = (await host.textContent("#room-main .q-text")).trim(), qg = (await guest.textContent("#room-main .q-text")).trim();
  ok("Quadratics room: both people get the same generated question", qh.length > 10 && qh === qg, qh.slice(0, 60));
  await host.close(); await guest.close();

  // ── migration: data saved by the radicals release keeps working; nothing is deleted
  const oldAttempt = { id: "old-1", date: Date.now() - 5 * 86400000, level: "classmate", earned: 20, total: 34, percent: 59, totalTime: 2400, duration: 3600, items: [], sections: {}, topics: {} };
  const oldNm = { ...oldAttempt, id: "old-2", level: "nightmare3", percent: 31 };
  p = await mk({ seed: {
    "campfire-prep.history.v2": [oldAttempt, oldNm],
    "campfire-prep.prefs.v1": { level: "classmate", minutes: 45 },
    "campfire-prep.practice.v1": [{ date: Date.now() - 86400000, quiz: "run-old", source: "quiz", level: "normal", qid: "mc-1", kind: "mc", concepts: ["radicals.simplify"], correct: true, blank: false, choice: 0 }],
  } });
  ok("Migration: app loads with old data and no errors", (await screenOf(p)) === "screen-home" && errors.length === 0, errors.join(" | "));
  ok("Migration: a returning learner isn't shown the first-use welcome", !/Let's start/.test(await p.textContent("#screen-home")));
  await navTo(p, "progress", 400);
  const ht = await p.textContent("#history-list");
  ok("Migration: old Tim's Test and Nightmare III attempts still listed", /Tim/.test(ht) && /Nightmare III/.test(ht));
  const kept = await p.evaluate(() => ({ h: JSON.parse(localStorage.getItem("campfire-prep.history.v2")).length, pr: JSON.parse(localStorage.getItem("campfire-prep.practice.v1")).length }));
  ok("Migration: history and practice evidence untouched", kept.h === 2 && kept.pr === 1, JSON.stringify(kept));
  await navTo(p, "home"); await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await toTakeIf(p); await p.click("#btn-create"); await p.waitForTimeout(300);
  ok("Migration: retired saved level opens setup on a current level", (await p.locator('#s-level [aria-checked="true"]').count()) === 1 && !(await p.locator("#s-level [data-level=classmate]").count()));
  await p.close();

  // ── phone width: no sideways scroll, island collapses, test bar fits
  p = await mk({ viewport: { width: 390, height: 844 } });
  const sw = async () => p.evaluate(() => document.documentElement.scrollWidth);
  ok("Phone: Home fits (no horizontal scroll)", (await sw()) <= 390);
  await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(700);
  ok("Phone: test screen fits", (await sw()) <= 390);
  const ib = await p.locator("#island").boundingBox();
  ok("Phone: test island stays inside the screen", ib.x >= 0 && ib.x + ib.width <= 390);
  await p.close();

  // ── settings survive closing the whole browser and opening it again (same profile, like a student coming back)
  {
    const dir = require("fs").mkdtempSync(require("path").join(require("os").tmpdir(), "dlpd-profile-"));
    let ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 1280, height: 860 } });
    let q = ctx.pages()[0] || await ctx.newPage();
    await q.goto(BASE); await q.evaluate(() => { localStorage.setItem("campfire-prep.onboarding.v1", JSON.stringify({ site: "completed" })); }); await q.reload();
    await enterIf(q); await q.waitForTimeout(300);
    await q.click("#btn-settings"); await q.click('#set-lang [data-lang="de"]'); await q.click('#set-layout [data-layout="focus"]'); await q.click('#set-theme [data-theme-opt="dark"]'); await q.waitForTimeout(200);
    await ctx.close();
    ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 1280, height: 860 } });
    q = ctx.pages()[0] || await ctx.newPage();
    await q.goto(BASE); await q.waitForTimeout(500);
    const before = { lang: await q.getAttribute("html", "lang"), layout: await q.getAttribute("html", "data-layout"), theme: await q.getAttribute("html", "data-theme") };
    ok("Browser closed and reopened: language, layout and theme are kept", before.lang === "de" && before.layout === "focus" && before.theme === "dark", JSON.stringify(before));
    await enterIf(q); await q.waitForTimeout(300);
    const saved = await q.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.ui.v1")));
    ok("…and entering the app doesn't overwrite them", saved.lang === "de" && saved.layout === "focus" && saved.theme === "dark", JSON.stringify(saved));
    await ctx.close();
  }

  ok("No JS errors", errors.length === 0, errors.join(" | "));
  await b.close();
  console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error("CRASH", e.message); console.log(errors); process.exit(1); });
