// Browser checks for Goose Mode and the survival rebalance (kettle / oxygen deaths through the one game-over path).
const enterIf = async (p) => { if (await p.locator("#btn-enter").isVisible().catch(() => false)) await p.click("#btn-enter"); }; // the app now opens on Home; kept for old saved states
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/goose.js
const { chromium } = require("playwright");
const { evalNav, toTake } = require("./navhelp");
const toTakeIf = async (pg) => { if (!(await pg.locator("#mode-track").isVisible().catch(() => false)) && (await pg.evaluate(() => document.body.dataset.screen)) !== "test") await toTake(pg); };
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const DONE = { site: "completed", test: "completed", game: "completed" };
const FULL = { mech: { vent: true, oxygen: true, kettle: true, wind: true, tent: true }, events: false, picked: [] };
const GZ_CLASSES = ["gz-gray", "gz-rainbow", "gz-flip", "gz-shake", "gz-frozen", "gz-dance", "gz-busy", "gz-carried"];
const leftovers = (p) => p.evaluate((cls) => ({
  classes: cls.filter((c) => document.querySelector("." + c)),
  overlays: document.querySelectorAll(".gz-freeze, .gz-dim, .gz-goose").length,
  inert: [...document.querySelectorAll("section.screen")].some((s) => s.inert),
  origin: [...document.querySelectorAll("section.screen")].some((s) => s.style.transformOrigin),
}), GZ_CLASSES);
const clean = (l) => !l.classes.length && !l.overlays && !l.inert;

(async () => {
  const b = await chromium.launch();
  const mk = async (seed = {}, opts = {}) => {
    const ctx = await b.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, reducedMotion: opts.reducedMotion || "no-preference" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    p.on("dialog", (d) => d.accept());
    await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, ...seed });
    await p.goto(BASE + (opts.hash || "")); await p.waitForTimeout(300);
    await enterIf(p); await p.waitForTimeout(350);
    return p;
  };
  const prefs = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.prefs.v1") || "{}"));
  const sess = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.session.v2") || "null"));
  const openSettings = async (p) => { if (await p.evaluate(() => document.querySelector("#settings-pop").hidden)) await p.click("#btn-settings"); await p.waitForTimeout(120); };
  const closeSettings = async (p) => { if (!(await p.evaluate(() => document.querySelector("#settings-pop").hidden))) await p.click("#btn-settings"); await p.waitForTimeout(150); };
  const toggleGoose = async (p) => { await openSettings(p); await p.click("#goose-toggle"); await p.waitForTimeout(150); await closeSettings(p); await p.waitForTimeout(300); };
  const quit = async (p) => { await p.click("#btn-quit"); await p.waitForTimeout(250); if (await vis(p, "#dialog")) await p.click("#dialog-ok"); await p.waitForTimeout(300); await p.evaluate(() => localStorage.removeItem("campfire-prep.session.v2")); };
  const home = (p) => p.evaluate(() => document.querySelector('#main-nav [data-go="home"]').click()).then(() => p.waitForTimeout(300));

  // ── 1. setting: separate from difficulty, not on Simple
  let p = await mk();
  await openSettings(p);
  ok("Goose Mode is a gameplay setting in Settings (not a difficulty)", await vis(p, "#goose-toggle") && !(await p.$('#mode-track [data-mode="goose"]')) && /Goose Mode/.test(await p.textContent("#set-goose")));
  ok("Not available on Simple (switch disabled, note shown)", await p.isDisabled("#goose-toggle") && /Not available on Simple/.test(await p.textContent("#set-goose")));
  ok("The description says it replaces puppy survival", /replaces puppy survival/i.test(await p.textContent("#goose-d")));
  await closeSettings(p);
  await toTakeIf(p); await p.click('#mode-track [data-mode="normal"]'); await p.waitForTimeout(150);
  ok("Choosing a difficulty never switches Goose Mode on", !(await prefs(p)).goose && !(await p.evaluate(() => window.Goose.enabled)));
  await toggleGoose(p);
  ok("On Normal it can be switched on", (await prefs(p)).goose === true && await p.evaluate(() => window.Goose.enabled));
  ok("Mascot becomes the goose (settings button and island)", (await p.getAttribute("#btn-settings use", "href")) === "#goose-head" && (await p.getAttribute("#brand-link .pup-mark use", "href")) === "#goose-head");
  ok("Goose bar with Reset layout and Turn off is shown", await vis(p, "#gz-hud") && await vis(p, '#gz-hud [data-gz="off"]'));
  await toTakeIf(p); await p.click('#mode-track [data-mode="challenge"]'); await p.waitForTimeout(150);
  ok("Switching to Challenging keeps it on", (await prefs(p)).goose === true);
  await toTakeIf(p); await p.click('#mode-track [data-mode="simple"]'); await p.waitForTimeout(200);
  ok("Selecting Simple disables Goose Mode and restores the puppy", (await prefs(p)).goose === false && !(await p.evaluate(() => window.Goose.enabled)) && (await p.getAttribute("#btn-settings use", "href")) === "#pup" && !(await p.$("#gz-hud")));
  await toTakeIf(p); await p.click('#mode-track [data-mode="nightmare"]'); await p.waitForTimeout(150);
  ok("…and choosing Nightmare afterwards doesn't silently re-enable it", (await prefs(p)).goose === false);
  await p.context().close();

  // ── 2. events run only while Goose Mode is active, and only where it applies
  p = await mk({ "campfire-prep.prefs.v1": { mode: "normal" } });
  await p.evaluate(() => window.Goose.setNext(0.2)); await p.waitForTimeout(800);
  ok("With Goose Mode off nothing is scheduled or triggerable", (await p.evaluate(() => window.Goose.log().length)) === 0 && !(await p.evaluate(() => window.Goose.trigger("grayscale"))));
  ok("Without Goose Mode no panel is draggable (Balanced)", (await p.locator(".gz-handle").count()) === 0);
  for (const lay of ["focus", "studio", "studioplus"]) {
    await openSettings(p); await p.click(`#set-layout [data-layout="${lay}"]`); await closeSettings(p);
    ok(`Without Goose Mode no panel is draggable (${lay})`, (await p.locator(".gz-handle").count()) === 0 && (await p.locator(".gz-moved").count()) === 0);
  }
  await openSettings(p); await p.click('#set-layout [data-layout="balanced"]'); await closeSettings(p);
  const uiBefore = await p.evaluate(() => localStorage.getItem("campfire-prep.ui.v1"));
  await toggleGoose(p);
  await p.evaluate(() => window.Goose.setNext(0.2)); await p.waitForTimeout(900);
  ok("With Goose Mode on the scheduler starts events by itself", (await p.evaluate(() => window.Goose.log().length)) >= 1, JSON.stringify(await p.evaluate(() => window.Goose.log().map((x) => x.id))));
  await p.evaluate(() => window.Goose.endAll());
  ok("Scheduler intervals are randomized around 30 s (20–40 s)", JSON.stringify(await p.evaluate(() => window.Goose.CFG.interval)) === "[20,40]");
  await evalNav(p, "library", 300);
  ok("No events on screens without a game (Library)", !(await p.evaluate(() => window.Goose.trigger("grayscale"))) && !(await vis(p, "#gz-hud")));
  await home(p);

  // ── 3. every event ends and restores the original presentation
  for (const id of ["grayscale", "rainbow", "flip", "shake", "dance", "dim"]) {
    await p.evaluate(() => window.Goose.endAll()); await p.waitForTimeout(150);
    const started = await p.evaluate((id) => window.Goose.trigger(id), id);
    await p.waitForTimeout(400);
    const during = await leftovers(p);
    await p.evaluate(() => window.Goose.endAll()); await p.waitForTimeout(800);
    const after = await leftovers(p);
    ok(`${id}: applies, then restores everything`, started && (during.classes.length || during.overlays) && clean(after) && !after.origin, JSON.stringify({ during, after }));
  }
  await p.evaluate(() => window.Goose.trigger("shake")); await p.waitForTimeout(2700);
  ok("Events also end on their own when their time is up", !(await p.evaluate(() => window.Goose.active().includes("shake"))) && clean(await leftovers(p)));
  await p.evaluate(() => window.Goose.trigger("grayscale"));
  ok("Incompatible events can't run together (two stage transforms)", (await p.evaluate(() => window.Goose.trigger("flip"))) && !(await p.evaluate(() => window.Goose.trigger("shake"))));
  ok("Compatible ones can (colour + panels)", await p.evaluate(() => window.Goose.endAll() || (window.Goose.trigger("rainbow") && window.Goose.trigger("dance"))));
  await p.evaluate(() => window.Goose.endAll()); await p.waitForTimeout(700);

  // ── 4. goose theft keeps the panel's node and state; the drop stays on screen
  await p.evaluate(() => { for (const el of document.querySelectorAll("#topic-card, #hub-subjects, #dash .hub-tiles")) { el.__mark = el.parentElement; } });
  await p.evaluate(() => window.Goose.trigger("theft")); await p.waitForTimeout(400);
  ok("The goose appears (animated, not teleporting)", (await p.locator(".gz-goose").count()) === 1);
  await p.waitForTimeout(6600);
  const theft = await p.evaluate(() => {
    const keys = Object.keys(window.Goose.offsets()); const el = keys.length ? document.querySelector(`[data-gz-key="${keys[0]}"]`) : null;
    if (!el) return null; const r = el.getBoundingClientRect(), isl = document.querySelector("#island-wrap").getBoundingClientRect();
    return { key: keys[0], same: el.__mark === el.parentElement, translate: el.style.translate, inX: r.left >= 0 && r.right <= innerWidth, belowIsland: r.top >= isl.bottom - 1, goose: document.querySelectorAll(".gz-goose").length };
  });
  ok("A panel was carried to a new place", theft && /px/.test(theft.translate), JSON.stringify(theft));
  ok("…it's the same element in the same parent (state kept)", theft && theft.same);
  ok("…it stays inside the window and below the navigation", theft && theft.inX && theft.belowIsland);
  ok("…and the goose has left", theft && theft.goose === 0);

  // ── 5. drag and drop (Goose only), clamped, with reset
  await p.evaluate(() => { window.Goose.setNext(1e9); window.Goose.endAll(); window.Goose.resetLayout(); window.scrollTo(0, 0); }); await p.waitForTimeout(300);
  const h = p.locator('[data-gz-key="subjects"] > .gz-handle');
  ok("In Goose Mode panels get a drag handle", (await p.locator(".gz-handle").count()) >= 3 && await h.count() === 1);
  const hb = await h.boundingBox();
  await p.mouse.move(hb.x + 10, hb.y + 10); await p.mouse.down(); await p.mouse.move(hb.x + 300, hb.y + 120, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(150);
  const dragged = await p.evaluate(() => window.Goose.offsets().subjects);
  ok("Dragging the handle moves the panel", dragged && dragged.x > 250 && dragged.y > 60, JSON.stringify(dragged));
  const hb2 = await h.boundingBox();
  await p.mouse.move(hb2.x + 10, hb2.y + 10); await p.mouse.down(); await p.mouse.move(hb2.x + 3000, hb2.y - 3000, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
  const clampd = await p.evaluate(() => { const r = document.querySelector('[data-gz-key="subjects"]').getBoundingClientRect(), isl = document.querySelector("#island-wrap").getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= 0 && r.top >= isl.bottom - 1; });
  ok("Panels can't be dragged off-screen or behind the navigation", clampd);
  await h.focus(); await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(80);
  ok("Keyboard: arrow keys move the focused handle's panel", (await p.evaluate(() => window.Goose.offsets().subjects.x)) < (await p.evaluate(() => innerWidth)));
  await p.click('#gz-hud [data-gz="reset"]'); await p.waitForTimeout(150);
  ok("Reset layout puts every panel back", JSON.stringify(await p.evaluate(() => window.Goose.offsets())) === "{}" && (await p.locator(".gz-moved").count()) === 0);
  await p.evaluate(() => window.Goose.trigger("theft")); await p.waitForTimeout(7000);

  // ── 6. leaving Goose Mode restores the normal layout and saved settings
  await p.click('#gz-hud [data-gz="off"]'); await p.waitForTimeout(300);
  const restored = await p.evaluate(() => ({ handles: document.querySelectorAll(".gz-handle").length, moved: document.querySelectorAll(".gz-moved, [style*='translate']").length, hud: !!document.querySelector("#gz-hud") }));
  ok("Turning it off restores every panel, removes handles and the goose bar", restored.handles === 0 && restored.moved === 0 && !restored.hud, JSON.stringify(restored));
  ok("…the normal saved layout was never changed", (await p.evaluate(() => localStorage.getItem("campfire-prep.ui.v1"))) === uiBefore);
  ok("…and no effect is left behind", clean(await leftovers(p)));
  await toggleGoose(p);
  ok("Re-entering Goose Mode starts from the normal layout", JSON.stringify(await p.evaluate(() => window.Goose.offsets())) === "{}");

  // ── 7. layouts, themes and languages during events
  await p.evaluate(() => { window.Goose.trigger("grayscale"); window.Goose.trigger("theft"); }); await p.waitForTimeout(500);
  await openSettings(p);
  await p.click('#set-theme [data-theme-opt="dark"]'); await p.click('#set-lang [data-lang="fr"]'); await p.click('#set-layout [data-layout="studioplus"]');
  await p.waitForTimeout(200);
  ok("Opening Settings pauses the goose cleanly (effects end)", (await p.evaluate(() => window.Goose.active().length)) === 0 && clean(await leftovers(p)));
  await closeSettings(p); await p.waitForTimeout(400);
  ok("Goose text follows the language (French)", /Mode Oie/.test(await p.textContent("#gz-hud")));
  ok("Studio+ panels become draggable in Goose Mode", (await p.locator("#splus .gz-handle").count()) >= 4);
  await p.evaluate(() => window.Goose.trigger("theft")); await p.waitForTimeout(7000);
  ok("Theft works in Studio+ too", Object.keys(await p.evaluate(() => window.Goose.offsets())).some((k) => /^sp-/.test(k)), JSON.stringify(await p.evaluate(() => window.Goose.offsets())));
  ok("Events still run after switching layout/theme/language", await p.evaluate(() => window.Goose.trigger("rainbow")));
  await p.evaluate(() => window.Goose.trigger("freeze")); await p.waitForTimeout(300);

  // ── 8. reload mid-event: no stale effects or layout
  await p.goto(BASE); await p.waitForTimeout(400); await enterIf(p); await p.waitForTimeout(500);
  const afterReload = await leftovers(p);
  ok("Reload during a freeze + rainbow leaves nothing stale", clean(afterReload) && JSON.stringify(await p.evaluate(() => window.Goose.offsets())) === "{}" && !(await p.evaluate(() => window.Goose.frozen())), JSON.stringify(afterReload));
  ok("…and Goose Mode is still on (setting saved)", await p.evaluate(() => window.Goose.enabled) && /Mode Oie/.test(await p.textContent("#gz-hud")));
  await openSettings(p); await p.click('#set-lang [data-lang="en"]'); await p.click('#set-theme [data-theme-opt="light"]'); await p.click('#set-layout [data-layout="balanced"]'); await closeSettings(p);
  await p.context().close();

  // ── 9. tests: Goose replaces the campfire on Normal, Challenging and Nightmare; the maths is untouched
  p = await mk({ "campfire-prep.prefs.v1": { mode: "normal", goose: true, buddyMode: "normal", hardcore: true, companion: FULL } }, { hash: "#debug" });
  for (const lv of ["normal", "challenge", "nightmare"]) {
    await p.evaluate(() => document.querySelector('#main-nav [data-go="home"]').click()); await p.waitForTimeout(250); // full tests start from Home's difficulty cards
    await toTakeIf(p); await p.click(`#mode-track [data-mode="${lv}"]`); await p.waitForTimeout(150);
    await toTakeIf(p); await p.click(`#mode-preview #btn-start`); await p.waitForTimeout(600);
    const s = await sess(p);
    ok(`${lv}: test runs under Goose rules (no campfire, kettle, oxygen or game over)`, s && s.goose && s.mode === "off" && !s.companion && !s.hardcore && await p.evaluate(() => document.body.classList.contains("buddy-off") && !window.__fire.comp && !window.__fire._raf) && s.preGoose && s.preGoose.mode === "normal");
    ok(`${lv}: goose events work in the test`, await p.evaluate(() => window.Goose.trigger("grayscale")));
    await p.evaluate(() => window.Goose.endAll());
    if (lv !== "nightmare") await quit(p);
  }
  // freeze in a live test: input blocked, clock held, input back afterwards
  const inp = p.locator("#q-body input.answer-input").first();
  const hasInput = (await inp.count()) > 0;
  const clockS = () => p.evaluate(() => { const [m, s] = document.querySelector("#timer-value").textContent.split(":").map(Number); return m * 60 + s; });
  const c0 = await clockS(), w0 = Date.now();
  await p.evaluate(() => { window.Goose.setNext(1e9); window.Goose.endAll(); window.Goose.trigger("freeze"); }); await p.waitForTimeout(200); // no random event may start mid-check
  const blocked = await p.evaluate(() => document.querySelector("#screen-test").inert && document.querySelector(".gz-freeze") !== null);
  if (hasInput) await inp.click({ timeout: 800, force: true }).catch(() => {});
  ok("Freeze blocks the game area with a visible goose notice", blocked);
  ok("…typing can't reach the answer while frozen", !hasInput || !(await p.evaluate(() => document.activeElement && document.activeElement.matches("#q-body input"))));
  ok("…the Exit and Pause buttons stay usable", !(await p.evaluate(() => document.querySelector("#topbar-test").inert)) && await p.isEnabled("#btn-pause"));
  for (let i = 0; i < 30 && await p.evaluate(() => window.Goose.frozen()); i++) await p.waitForTimeout(200);
  const c1 = await clockS(), wall = (Date.now() - w0) / 1000;
  ok("Freeze ends by itself and input comes back", !(await p.evaluate(() => window.Goose.frozen())) && !(await p.evaluate(() => document.querySelector("#screen-test").inert)) && clean(await leftovers(p)), JSON.stringify(await leftovers(p)) + " frozen=" + (await p.evaluate(() => window.Goose.frozen())));
  if (hasInput) { await p.waitForTimeout(500); await inp.fill("(1, 2)"); ok("…answers can be typed again", (await inp.inputValue()) === "(1, 2)"); }
  ok("The test clock is held during the freeze", wall >= 2 && c0 - c1 <= 1.5, `clock moved ${c0 - c1} s over ${wall.toFixed(1)} s`);
  // turning Goose off mid-test brings the selected puppy rules back; on again puts them away
  await toggleGoose(p);
  let s2 = await sess(p);
  ok("Goose off mid-test restores the campfire with its original rules", !s2.goose && s2.mode === "normal" && !!s2.companion && s2.hardcore && await vis(p, "#companion") && await p.evaluate(() => !!window.__fire.comp));
  await toggleGoose(p);
  s2 = await sess(p);
  ok("Goose on mid-test stops every puppy system (no hidden timers)", s2.goose && s2.mode === "off" && await p.evaluate(() => !window.__fire._raf && !window.__fire.comp));
  await p.click("#btn-quit"); await p.waitForTimeout(250); if (await vis(p, "#dialog")) await p.click("#dialog-ok"); await p.waitForTimeout(300);
  await p.context().close();

  // ── 10. kettle and oxygen deaths in the real game (puppy rules, Hardcore → game over dialog)
  p = await mk({ "campfire-prep.prefs.v1": { mode: "normal", buddyMode: "normal", hardcore: true, companion: FULL } }, { hash: "#debug" });
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(700);
  await p.evaluate(() => { const f = window.__fire; f.heat = 60; f.comp.s.pressure = 100; });
  await p.waitForTimeout(3000);
  ok("Kettle at full pressure counts down first (not instant)", (await p.evaluate(() => window.__fire.status)) === "ok" && /Blows in/.test(await p.textContent('#companion [data-m="pressure"]')));
  await p.waitForTimeout(6500);
  ok("Ignoring the kettle ends the round: game over (kettle)", (await p.evaluate(() => window.__fire.status)) === "kettle" && await vis(p, "#gameover") && /kettle blew/i.test(await p.textContent("#go-title")));
  const t0 = await p.evaluate(() => window.__fire.comp.s.t); await p.waitForTimeout(1200);
  ok("Death stops the survival simulation", (await p.evaluate(() => window.__fire.comp.s.t)) === t0 && !(await p.evaluate(() => window.__fire._raf)), JSON.stringify(await p.evaluate(() => ({ t: window.__fire.comp.s.t, raf: window.__fire._raf, st: window.__fire.status }))) + " t0=" + t0);
  await p.click("#go-revive"); await p.waitForTimeout(300);
  ok("Keep going restores a safe camp", (await p.evaluate(() => window.__fire.status)) === "ok" && (await p.evaluate(() => window.__fire.comp.s.pressure)) <= 31 && !(await vis(p, "#gameover")), JSON.stringify(await p.evaluate(() => ({ st: window.__fire.status, pr: window.__fire.comp.s.pressure }))));
  await p.evaluate(() => { const c = window.__fire.comp; c.s.major = { id: "whiteout", phase: "on", left: 999, dur: 999 }; c.s.oxygen = 1; c.s.nextWind = 1e9; window.__fire.heat = 50; });
  await p.waitForTimeout(2200);
  ok("Oxygen running out ends the round: game over (oxygen)", (await p.evaluate(() => window.__fire.status)) === "oxygen" && /oxygen/i.test(await p.textContent("#go-title")));
  const gos = (await sess(p)).gameOvers;
  await p.waitForTimeout(1500);
  ok("…exactly once (no repeated deaths)", (await sess(p)).gameOvers === gos && gos === 2, String(gos));
  await p.click("#go-revive"); await p.waitForTimeout(300);
  ok("…and recovery works again", (await p.evaluate(() => window.__fire.status)) === "ok" && (await p.evaluate(() => window.__fire.comp.s.oxygen)) >= 80);
  await p.context().close();

  // ── 11. reduced motion: no shaking/flipping/dancing/dimming; phone width
  p = await mk({ "campfire-prep.prefs.v1": { mode: "normal", goose: true } }, { reducedMotion: "reduce" });
  await openSettings(p);
  ok("Reduced motion: 'Calmer goose' is on by default", await p.isChecked("#goose-calm"));
  await closeSettings(p);
  for (let i = 0; i < 12; i++) { await p.evaluate(() => window.Goose.setNext(0.05)); await p.waitForTimeout(350); await p.evaluate(() => window.Goose.endAll()); }
  const picked = await p.evaluate(() => window.Goose.log().map((x) => x.id));
  ok("Reduced motion: only calm events are chosen", picked.length >= 2 && picked.every((id) => !["flip", "shake", "dance", "dim"].includes(id)), picked.join(","));
  await p.context().close();
  p = await mk({ "campfire-prep.prefs.v1": { mode: "normal", goose: true } }, { viewport: { width: 390, height: 844 } });
  await p.evaluate(() => window.Goose.trigger("theft")); await p.waitForTimeout(7000);
  const phone = await p.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, hud: (() => { const r = document.querySelector("#gz-hud").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })(), moved: Object.keys(window.Goose.offsets()).map((k) => { const r = document.querySelector(`[data-gz-key="${k}"]`).getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; }) }));
  ok("Phone: goose bar fits, stolen panel stays on screen, no sideways scroll", !phone.overflow && phone.hud && phone.moved.every(Boolean), JSON.stringify(phone));
  await p.context().close();

  ok("No page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await b.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
