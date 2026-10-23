// Browser checks for themes: the picker, live switching, persistence, System following the OS, no seasonal
const enterIf = async (p) => { if (await p.locator("#btn-enter").isVisible().catch(() => false)) await p.click("#btn-enter"); }; // the app now opens on Home; kept for old saved states
// auto-switching, and every theme across Math and Physics screens in all layouts (no errors, no overflow,
// readable text by measured contrast).
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/themes.js
const { chromium } = require("playwright");
const { evalNav, toTake, pickSubject } = require("./navhelp");
const toTakeIf = async (pg) => { if (!(await pg.locator("#mode-track").isVisible().catch(() => false)) && (await pg.evaluate(() => document.body.dataset.screen)) !== "test") await toTake(pg); };
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const SHOTS = process.env.SHOTS; // optional folder for screenshots
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const DONE = { site: "completed", test: "completed", game: "completed" };
const ALL = ["cafe", "light", "dark", "system", "cinnamon", "blush", "galaxy", "arctic", "beach", "halloween", "christmas", "graphite", "lime"];

// measured contrast of visible text against the colour actually behind it (alpha layers blended down to the page)
const CONTRAST = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) { const n = c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/); return n ? [n[1] * 255, n[2] * 255, n[3] * 255, n[4] === undefined ? 1 : +n[4]] : null; } const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v[3] === undefined ? 1 : v[3]]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const pageBg = parse(getComputedStyle(document.body).getPropertyValue("--bg").trim().replace(/^#(..)(..)(..)$/, (m, r, g, b) => `rgb(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)})`)) || [255, 255, 255, 1];
  const behind = (el) => {
    const layers = [];
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== "none" && e !== document.body && !/url\(/.test(cs.backgroundImage)) return null; // gradients: not measurable reliably, skip
      const c = parse(cs.backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.999) break; }
    }
    let base = pageBg.slice(0, 3);
    for (const c of layers.reverse()) base = base.map((v, i) => v * (1 - c[3]) + c[i] * c[3]);
    return base;
  };
  const bad = []; let n = 0;
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("svg, .scene, #hero-scene, .katex, .th-prev, .deploy-check, .gz-goose, [aria-hidden=true], .sr-only, canvas, .mode-ico, .qi-ico, .pup-mark")) continue;
    if (![...el.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim().length > 1)) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || +cs.opacity < 0.5) continue;
    if (el.closest("[disabled], .disabled, :disabled")) continue; // disabled controls are exempt (WCAG 1.4.3)
    const fg = parse(cs.color), bg = behind(el); if (!fg || !bg) continue;
    const blended = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
    const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.6 && +cs.fontWeight >= 700);
    const cr = ratio(blended, bg); n++;
    if (cr < (large ? 3 : 4.5)) bad.push(`${cr.toFixed(2)} ${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")} "${el.textContent.trim().slice(0, 24)}"`);
  }
  return { n, bad };
};

(async () => {
  const b = await chromium.launch();
  const mk = async (seed = {}, opts = {}) => {
    const ctx = await b.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.scheme || "light", reducedMotion: opts.reduced || "no-preference" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    p.on("dialog", (d) => d.accept());
    if (opts.clock) await p.clock.setFixedTime(opts.clock);
    await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, "campfire-prep.prefs.v1": { mode: "normal" }, ...seed });
    await p.goto(BASE); await p.waitForTimeout(200);
    if (!opts.title) { await enterIf(p); await p.waitForTimeout(250); }
    return p;
  };
  const attr = (p) => p.evaluate(() => ({ theme: document.documentElement.dataset.theme, tone: document.documentElement.dataset.tone, bg: getComputedStyle(document.body).backgroundColor, ink: getComputedStyle(document.body).color, saved: JSON.parse(localStorage.getItem("campfire-prep.ui.v1") || "{}").theme }));
  const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const nav = (p, go) => evalNav(p, go, 220);

  // ── 1. picker
  let p = await mk();
  await p.click("#btn-settings"); await p.waitForTimeout(150);
  const cards = await p.$$eval("#set-theme [data-theme-opt]", (xs) => xs.map((x) => ({ id: x.dataset.themeOpt, name: x.querySelector(".th-name").textContent.trim(), dots: x.querySelectorAll(".th-dots i").length, prev: !!x.querySelector(".th-prev"), checked: x.getAttribute("aria-checked"), role: x.getAttribute("role") })));
  ok("Settings list thirteen themes in order (Study Café first)", JSON.stringify(cards.map((c) => c.id)) === JSON.stringify(ALL), cards.map((c) => c.id).join(","));
  ok("Each card has a name, a mini preview and four palette swatches", cards.every((c) => c.name && c.prev && c.dots === 4));
  ok("Cards are radio buttons; Study Café selected by default", cards.every((c) => c.role === "radio") && cards.filter((c) => c.checked === "true").map((c) => c.id).join() === "cafe");
  ok("Seasonal themes are labelled as seasonal", /Seasonal/.test(cards.find((c) => c.id === "halloween").name) && /Seasonal/.test(cards.find((c) => c.id === "christmas").name) && !/Seasonal/.test(cards.find((c) => c.id === "galaxy").name));
  const prevBg = await p.$$eval("#set-theme .th-prev", (xs) => xs.map((x) => getComputedStyle(x).backgroundColor + getComputedStyle(x).backgroundImage));
  ok("Each preview shows its own colours", new Set(prevBg).size >= 11, String(new Set(prevBg).size));
  const pop = await p.evaluate(() => { const r = document.getElementById("settings-pop").getBoundingClientRect(); return { bottom: r.bottom, h: innerHeight, scroll: document.getElementById("settings-pop").scrollHeight > document.getElementById("settings-pop").clientHeight }; });
  ok("Settings panel fits the window (scrolls inside if needed)", pop.bottom <= pop.h + 1, JSON.stringify(pop));
  if (SHOTS) { await p.locator("#set-theme").scrollIntoViewIfNeeded(); await p.screenshot({ path: SHOTS + "/th-picker.png" }); }

  // ── 2. live switching and persistence
  const seen = new Set();
  for (const id of ALL) {
    await p.click(`#set-theme [data-theme-opt="${id}"]`); await p.waitForTimeout(80);
    const a = await attr(p);
    seen.add(a.bg + "|" + a.ink);
    const sel = await p.$$eval('#set-theme [aria-checked="true"]', (xs) => xs.map((x) => x.dataset.themeOpt));
    ok(`${id}: applies at once and is saved`, a.theme === id && a.saved === id && sel.join() === id && (id === "system" || a.tone), JSON.stringify(a));
  }
  ok("Themes look different from one another (page colours)", seen.size >= 10, String(seen.size));
  await p.click('#set-theme [data-theme-opt="galaxy"]'); await p.keyboard.press("Escape");
  await p.reload(); await p.waitForTimeout(200);
  ok("Theme persists after reload, before entering (no flash: set in <head>)", (await attr(p)).theme === "galaxy" && (await attr(p)).tone === "dark");
  const st = await p.context().storageState(); await p.context().close();
  const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 }, storageState: st }); p = await ctx2.newPage(); await p.goto(BASE); await p.waitForTimeout(200);
  ok("Theme persists after a browser restart", (await attr(p)).theme === "galaxy");
  await ctx2.close();
  p = await mk({ "campfire-prep.ui.v1": { theme: "neon-unicorn" } });
  ok("An unknown saved theme falls back to the default (Study Café)", (await attr(p)).theme === "cafe");
  await p.context().close();

  // ── 3. System follows the OS, live; seasonal themes never switch on by date
  p = await mk({ "campfire-prep.ui.v1": { theme: "system" } }, { scheme: "dark" });
  ok("System: dark OS → dark tone", (await attr(p)).tone === "dark");
  await p.emulateMedia({ colorScheme: "light" }); await p.waitForTimeout(150);
  { const t0 = Date.now(); let tn = ""; for (let i = 0; i < 40 && (tn = (await attr(p)).tone) !== "light"; i++) await p.waitForTimeout(50); ok("System: follows a live OS change to light", tn === "light", `${Date.now() - t0 + 150} ms`); }
  ok("System: the saved choice stays 'system'", (await attr(p)).saved === "system");
  await p.context().close();
  for (const day of ["2026-10-31T12:00:00", "2026-12-25T12:00:00"]) {
    p = await mk({}, { clock: new Date(day) });
    ok(`No automatic seasonal theme on ${day.slice(0, 10)}`, (await attr(p)).theme === "cafe");
    await p.context().close();
  }

  // ── 4. every theme across screens and layouts: no errors, no overflow, readable text
  const LAY = ["balanced", "focus", "studio", "studioplus"];
  for (const [i, id] of ALL.entries()) {
    const layout = LAY[i % 4];
    p = await mk({ "campfire-prep.ui.v1": { theme: id, layout } }, { scheme: i % 2 ? "dark" : "light" });
    const report = []; let measured = 0;
    const check = async (screen) => { const c = await p.evaluate(CONTRAST); measured += c.n; for (const x of c.bad) report.push(screen + ": " + x); if ((await overflow(p)) > 0) report.push(screen + ": horizontal overflow"); if (SHOTS && ["home", "physrun", "test"].includes(screen)) await p.screenshot({ path: `${SHOTS}/th-${id}-${screen}.png` }); };
    await check("home");
    await p.click("#btn-settings"); await p.waitForTimeout(120); await check("settings"); await p.keyboard.press("Escape"); await p.waitForTimeout(80);
    await nav(p, "bar"); await check("bar");
    await nav(p, "library"); await check("library");
    await nav(p, "practice"); await check("practice");
    await nav(p, "progress"); await check("diagnostics");
    await nav(p, "home");
    await toTakeIf(p); await p.evaluate(() => { document.querySelector('#mode-track [data-mode="normal"]').click(); document.querySelector("#btn-start").click(); }); await p.waitForTimeout(600);
    if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(400); }
    await p.click("#tools-btn"); await p.waitForTimeout(80); await p.click('#tools-menu [data-tool="calc"]'); await p.waitForTimeout(120);
    await check("test");
    await p.keyboard.press("Escape");
    await p.click("#btn-quit").catch(() => {}); await p.waitForTimeout(150); if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(250); }
    await pickSubject(p, "physics", 300);
    await check("physhome");
    await p.evaluate(() => window.PhysUI.startRun({ subs: ["PC.angled_same"], n: 5 })); await p.waitForTimeout(300); await check("physrun");
    await nav(p, "library"); await p.click('#phys-root [data-ph-ltab="labs"]'); await p.waitForTimeout(250); await check("physlab");
    const figOk = await p.evaluate(() => { const path = document.querySelector('[data-tool-host="explorer"] .pf-curve, [data-tool-host="explorer"] .pf-path, [data-tool-host="explorer"] .pt-done'); return path ? getComputedStyle(path).stroke : "none"; });
    ok(`${id} (${layout}): screens render with no overflow and readable text (${measured} text nodes measured)`, report.length === 0, report.slice(0, 6).join(" | "));
    ok(`${id}: physics simulation uses the theme's colours`, figOk !== "none" && figOk !== "", figOk);
    await p.context().close();
  }

  // ── 5. phone width and reduced motion
  p = await mk({ "campfire-prep.ui.v1": { theme: "beach" } }, { viewport: { width: 390, height: 844 }, reduced: "reduce" });
  await p.click("#btn-settings"); await p.waitForTimeout(150);
  ok("Phone: theme picker fits without horizontal scrolling", (await overflow(p)) <= 0 && await p.evaluate(() => { const r = document.querySelector("#set-theme").getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= -1; }));
  await p.click('#set-theme [data-theme-opt="halloween"]'); await p.waitForTimeout(80);
  ok("Phone: switching works", (await attr(p)).theme === "halloween");
  ok("Reduced motion: theme change starts no animations", await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest(".scene, .pup, #hero-scene, .gz-goose"))).length === 0));
  await p.context().close();

  ok("No page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
  await b.close();
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - fail}/${results.length} passed`);
  process.exit(fail ? 1 : 0);
})();
