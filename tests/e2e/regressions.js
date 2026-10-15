const { chromium } = require("playwright");
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
// Create test: switch the campfire minigame on (if needed) and open "Customize"
const campOn = async (p) => { if (!(await p.isChecked("#s-camp"))) await p.check("#s-camp", { force: true }); await p.evaluate(() => { document.querySelector("#s-camp-custom").open = true; }); await p.waitForTimeout(100); };
(async () => {
  const b = await chromium.launch();
  const mk = async (base) => {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503/.test(m.text())) errors.push(m.text()); });
    await p.addInitScript(() => { if (!sessionStorage.getItem("i")) { localStorage.clear(); localStorage.setItem("campfire-prep.toured.v1", "true"); sessionStorage.setItem("i", 1); } });
    await p.goto(base); await p.click("#btn-enter"); await p.waitForTimeout(300); return p;
  };
  // not configured
  let p = await mk(process.env.BASE_OFF || "http://localhost:8767/");
  await p.click("#tutor-launcher"); await p.waitForTimeout(600);
  const t = await p.textContent("#tutor-panel");
  ok("Not-configured: honest notice, input disabled", /isn't connected|not connected|ANTHROPIC_API_KEY|isn't available/i.test(t) && await p.locator("#tutor-input").isDisabled(), t.replace(/\s+/g, " ").slice(0, 160));
  await p.screenshot({ path: "12-not-configured.png" });

  // group test + armadillo + hardcore
  p = await mk((process.env.BASE || "http://localhost:8766/"));
  await p.click("#btn-create"); await p.waitForTimeout(300);
  await p.check("#s-group", { force: true }); await p.fill("#s-name", "Aubrey");
  await p.click("#s-go"); await p.waitForTimeout(500);
  ok("Group: lobby shown with code", await vis(p, "#screen-lobby") && /\w{4}/.test(await p.textContent("#lobby-code")));
  ok("Group lobby: tutor hidden", !(await vis(p, "#tutor-launcher")));
  let link = "";
  const p2 = await mk((process.env.BASE || "http://localhost:8766/"));
  const lk = await p.inputValue("#lobby-link"); link = lk; await p2.goto(lk); await p2.waitForTimeout(600);
  ok("Group: invite link opens lobby", await vis(p2, "#screen-lobby"), link.trim());
  await p.click("#btn-lobby-start"); await p.waitForTimeout(600);
  ok("Group: test starts", await vis(p, "#screen-test"));
  ok("Group test: tutor hidden", !(await vis(p, "#tutor-launcher")));
  await p.click("#btn-quit"); await p.waitForTimeout(300);
  if (await vis(p, "#dialog")) await p.click("#dialog-ok"); await p.waitForTimeout(300);

  // Armadillo + hardcore
  await p.evaluate(() => { localStorage.removeItem("campfire-prep.session.v2"); });
  await p.click("#brand-link").catch(() => {}); await p.waitForTimeout(300);
  await p.click("#btn-create"); await p.waitForTimeout(300);
  if (await p.isChecked("#s-group")) await p.uncheck("#s-group", { force: true });
  await campOn(p);
  await p.check("#s-hardcore", { force: true }); await p.check("#s-drain", { force: true });
  await p.click("#s-go"); await p.waitForTimeout(600);
  ok("Armadillo: drain on for session", await p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.session.v2")).drain === true));
  // force the fire to burn out → game over
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("campfire-prep.session.v2")); return !!s.hardcore; }).then((h) => ok("Hardcore saved on session", h));
  // simulate long play: fast-forward by waiting a bit; check no errors and the clock ticks
  const t1 = await p.textContent("#timer-value"); await p.waitForTimeout(2200); const t2 = await p.textContent("#timer-value");
  ok("Timer ticks", t1 !== t2, `${t1} → ${t2}`);
  ok("Tutor hidden during Armadillo test", !(await vis(p, "#tutor-launcher")));
  // discard from the tutor's lock notice → tutor unlocks and opens
  await p.click("#btn-pause"); await p.waitForTimeout(200); await p.click("#btn-pause-home"); await p.waitForTimeout(300);
  await p.click("#tutor-launcher"); await p.waitForTimeout(150);
  await p.click("#tutor-locked-discard"); await p.waitForTimeout(200); await p.click("#dialog-ok"); await p.waitForTimeout(500);
  ok("Discard from lock notice unlocks and opens the tutor", await p.locator("#tutor.locked").count() === 0 && await vis(p, "#tutor-panel") && !(await p.evaluate(() => localStorage.getItem("campfire-prep.session.v2"))));
  // expired saved test does not lock the tutor
  await p.evaluate(() => { const s = { items: [{ kind: "mc", qid: "x", chosen: null, order: [0,1,2,3], time: 0 }], paused: false, elapsed: 0, lastActive: Date.now() - 3 * 3600e3, startedAt: Date.now() - 3 * 3600e3, duration: 3600, level: "normal" }; localStorage.setItem("campfire-prep.session.v2", JSON.stringify(s)); window.Tutor.refresh(); });
  ok("Expired saved test doesn't lock the tutor", await p.evaluate(() => !document.querySelector("#tutor").classList.contains("locked")));
  await p.evaluate(() => localStorage.removeItem("campfire-prep.session.v2"));
  // ── "Puppy can lose": overfeed the fire until the camp burns, then continue the test
  await p.click("#btn-create"); await p.waitForTimeout(300);
  if (await p.isChecked("#s-group")) await p.uncheck("#s-group", { force: true });
  await campOn(p);
  await p.check("#s-hardcore", { force: true }); if (await p.isChecked("#s-drain")) await p.uncheck("#s-drain", { force: true });
  await p.click("#s-go"); await p.waitForTimeout(500);
  for (let i = 0; i < 40 && !(await vis(p, "#gameover")); i++) { await p.click("#btn-fuel").catch(() => {}); await p.waitForTimeout(400); }
  ok("Puppy can lose: overfeeding ends in game over", await vis(p, "#gameover"));
  ok("Game over: tutor still hidden", !(await vis(p, "#tutor-launcher")));
  if (await vis(p, "#go-off")) await p.click("#go-off"); else if (await vis(p, "#go-revive")) await p.click("#go-revive");
  await p.waitForTimeout(300);
  ok("Game over: the test goes on", await vis(p, "#screen-test") && !(await vis(p, "#gameover")));
  await p.click("#btn-quit"); await p.waitForTimeout(200); if (await vis(p, "#dialog")) await p.click("#dialog-ok"); await p.waitForTimeout(300);
  await p.evaluate(() => localStorage.removeItem("campfire-prep.session.v2"));

  // ── Study rooms: self-paced, two people, result codes, refresh
  const BASE = process.env.BASE || "http://localhost:8766/";
  const host = await mk(BASE);
  await host.click("#btn-room-create"); await host.waitForTimeout(300);
  await host.check('[data-rc="radicals.rationalize"]'); await host.click('#rc-count [data-count="5"]');
  await host.fill("#room-name-in", "Host"); await host.click("#rc-go"); await host.waitForTimeout(500);
  ok("Room: room screen with a 16-char code", await vis(host, "#screen-room") && /^R\w{3}-\w{4}-\w{4}-\w{4}$/.test((await host.textContent("#room-code")).trim()));
  ok("Room with hints: tutor available", await vis(host, "#tutor-launcher"));
  const roomLink = await host.evaluate(() => location.href);
  const guest = await mk(BASE);
  await guest.goto(roomLink); await guest.waitForTimeout(600);
  ok("Room: invite link opens the room", await vis(guest, "#screen-room"));
  await host.click('[data-room="start"]'); await guest.fill("#room-name", "Guest"); await guest.click('[data-room="start"]'); await host.waitForTimeout(300); await guest.waitForTimeout(300);
  const q1h = await host.textContent("#room-main .q-text"), q1g = await guest.textContent("#room-main .q-text");
  const ord = async (pg) => pg.$$eval("#room-main [data-mc]", (els) => els.map((e) => e.dataset.mc).join(""));
  ok("Room: both get the identical first question and choice order", q1h === q1g && (await ord(host)) === (await ord(guest)));
  ok("Room: hint available", await vis(host, '[data-pr="hint"]'));
  const answer = async (pg, right) => {
    for (let i = 0; i < 5; i++) {
      if (await pg.locator("#room-main [data-mc]").count()) await pg.locator(right ? '#room-main [data-mc="0"]' : '#room-main [data-mc]:not([data-mc="0"])').first().click();
      else { const a = await pg.evaluate(() => String(window.Practice.active.items[window.Practice.active.i].q.answer)); await pg.fill("#pr-nr", right ? a : "12345"); }
      await pg.click('#room-main [data-pr="check"]'); await pg.waitForTimeout(80);
      if (!right && i === 1) { await pg.reload(); await pg.waitForTimeout(700); if (await vis(pg, "#btn-enter")) { await pg.click("#btn-enter"); } await pg.waitForTimeout(300);
        ok("Room: refresh keeps your answers and place", (await pg.evaluate(() => window.Practice.active && window.Practice.active.i)) === 2 || (await pg.textContent("#room-main")).includes("Question 3")); continue; }
      await pg.click('#room-main [data-pr="next"]'); await pg.waitForTimeout(80);
    }
  };
  await answer(host, true); await answer(guest, false);
  await host.waitForTimeout(300); await guest.waitForTimeout(300);
  ok("Room: end screen with your own result", /5 of 5 correct/.test(await host.textContent("#room-main")));
  const guestCode = await guest.inputValue("#room-mycode");
  ok("Room result code holds only name + marks", /^CR-/.test(guestCode) && !/12345/.test(Buffer.from(guestCode.slice(3).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()));
  await host.fill("#room-codes", guestCode + "\n" + guestCode + "\nCR-garbage"); await host.click('[data-room="add"]'); await host.waitForTimeout(300);
  const board = await host.textContent("#room-main");
  ok("Room: group summary dedupes and rejects bad codes", (await host.locator(".room-board tbody tr").count()) === 2 && /skipped/.test(board));
  ok("Room: group review concepts listed", /may need to review/.test(board));
  const pr = await host.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.practice.v1") || "[]").filter((x) => x.source === "room").length);
  ok("Room answers saved once as your own practice evidence", pr === 5, String(pr));

  // ── Study room with hints off: no tutor; synced pacing with a fake clock
  const ctx3 = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const s3 = await ctx3.newPage();
  s3.on("pageerror", (e) => errors.push(e.message));
  await s3.clock.install({ time: new Date("2026-10-20T15:00:10") });
  await s3.addInitScript(() => { if (!sessionStorage.getItem("i")) { localStorage.clear(); localStorage.setItem("campfire-prep.toured.v1", "true"); sessionStorage.setItem("i", 1); } });
  await s3.goto(BASE); await s3.click("#btn-enter"); await s3.waitForTimeout(200);
  await s3.click("#btn-room-create"); await s3.check('[data-rc="exponents.laws"]'); await s3.check('[data-rc="exponents.negative"]');
  await s3.click('#rc-pace-mode [data-mode="synced"]'); await s3.click('#rc-pace [data-pace="60"]'); await s3.click('#rc-start [data-start="1"]'); await s3.click('#rc-count [data-count="5"]');
  await s3.uncheck("#rc-hints", { force: true }); await s3.click("#rc-go"); await s3.waitForTimeout(300);
  ok("Synced room: countdown before start", await vis(s3, "#room-cd"));
  ok("No-hints room: tutor hidden", !(await vis(s3, "#tutor-launcher")));
  await s3.clock.fastForward(120000); await s3.waitForTimeout(300);
  ok("Synced room: question 1 appears at the start time with a timer", await vis(s3, "#room-timer") && /Question 1 of 5/.test(await s3.textContent("#room-main")));
  ok("No-hints room: no hint button", !(await vis(s3, '[data-pr="hint"]')));
  await s3.clock.fastForward(61000); await s3.waitForTimeout(300);
  ok("Synced room: moves on together; the missed question counts as unanswered", /Question 2 of 5/.test(await s3.textContent("#room-main")) && (await s3.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.practice.v1") || "[]").length)) === 0);
  if (await s3.locator("#room-main [data-mc]").count()) await s3.locator('#room-main [data-mc="0"]').click(); else { const a = await s3.evaluate(() => String(window.Practice.active.items[window.Practice.active.i].q.answer)); await s3.fill("#pr-nr", a); }
  await s3.click('#room-main [data-pr="check"]'); await s3.waitForTimeout(200);
  ok("Synced room: after answering you wait for the group", /Next question in/.test(await s3.textContent("#room-main .quiz-nav")));
  await s3.clock.fastForward(4 * 61000); await s3.waitForTimeout(400);
  ok("Synced room: results when the last window closes", /of 5 correct/.test(await s3.textContent("#room-main")));

  // ── Campfire Companion (optional extras)
  const cc = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const c1 = await cc.newPage();
  c1.on("pageerror", (e) => errors.push(e.message));
  await c1.addInitScript(() => { if (!sessionStorage.getItem("i")) { localStorage.clear(); localStorage.setItem("campfire-prep.toured.v1", "true"); sessionStorage.setItem("i", 1); } });
  await c1.goto(BASE + "#debug"); await c1.click("#btn-enter"); await c1.waitForTimeout(200);
  await c1.click("#btn-create"); await c1.waitForTimeout(200);
  ok("Master switch: the campfire minigame is off by default", !(await c1.isChecked("#s-camp")) && !(await vis(c1, "#s-camp-body")));
  await c1.check("#s-camp", { force: true }); await c1.waitForTimeout(150);
  ok("Switching it on selects the full minigame: every mechanic and every event", (await c1.$$eval("#s-comp-mech input", (els) => els.filter((e) => e.checked).length)) === 5 && await c1.isChecked("#s-comp-events") && /15 of 15/.test(await c1.textContent("#s-comp-count")));
  ok("Full campfire is shown as recommended, details tucked under Customize", await vis(c1, "#s-camp-full .rec-pill") && !(await vis(c1, "#s-comp-mech")) && !(await vis(c1, "#s-camp-reset")));
  ok("Extra challenge (Puppy can lose, Armadillo) stays off", !(await c1.isChecked("#s-hardcore")) && !(await c1.isChecked("#s-drain")));
  await c1.evaluate(() => { document.querySelector("#s-camp-custom").open = true; });
  await c1.uncheck('[data-ev="fog"]'); await c1.waitForTimeout(100);
  ok("Customizing marks it as customized and offers 'Back to full'", await vis(c1, "#s-camp-reset") && (await c1.locator("#s-camp-full.is-custom").count()) === 1);
  await c1.click("#s-camp-reset"); await c1.waitForTimeout(100);
  ok("'Back to full' restores everything", /15 of 15/.test(await c1.textContent("#s-comp-count")) && !(await vis(c1, "#s-camp-reset")));
  await c1.uncheck("#s-camp", { force: true }); await c1.waitForTimeout(100);
  await c1.click("#s-go"); await c1.waitForTimeout(500);
  ok("Minigame off: no campfire, no puppy, no companion during the test", !(await vis(c1, ".buddy-panel")) && !(await vis(c1, "#companion")) && (await c1.evaluate(() => window.__fire && window.__fire.comp)) === null);
  await c1.click("#btn-quit"); await c1.waitForTimeout(200); if (await vis(c1, "#dialog")) await c1.click("#dialog-ok"); await c1.waitForTimeout(300);
  await c1.evaluate(() => localStorage.removeItem("campfire-prep.session.v2"));
  await c1.click("#brand-link").catch(() => {}); await c1.waitForTimeout(200);
  await c1.click("#btn-create"); await c1.waitForTimeout(200);
  await campOn(c1);
  for (const m of ["vent", "oxygen", "kettle", "wind", "tent"]) await c1.uncheck(`[data-mech="${m}"]`);
  await c1.uncheck("#s-comp-events", { force: true });
  await c1.click("#s-go"); await c1.waitForTimeout(500);
  ok("Customized down to nothing: the classic campfire, unchanged", await vis(c1, ".buddy-panel") && !(await vis(c1, "#companion")) && (await c1.locator("#test-scene .scene.has-companion").count()) === 0 && (await c1.evaluate(() => window.__fire && window.__fire.comp)) === null);
  await c1.click("#btn-quit"); await c1.waitForTimeout(200); if (await vis(c1, "#dialog")) await c1.click("#dialog-ok"); await c1.waitForTimeout(300);
  await c1.evaluate(() => localStorage.removeItem("campfire-prep.session.v2"));
  await c1.click("#brand-link").catch(() => {}); await c1.waitForTimeout(200);
  await c1.click("#btn-create"); await c1.waitForTimeout(200);
  await campOn(c1);
  await c1.check('[data-mech="vent"]'); await c1.check('[data-mech="tent"]'); await c1.check('[data-mech="wind"]');
  await c1.check("#s-comp-events", { force: true }); await c1.waitForTimeout(100);
  ok("Events list: Hailstorm available once Puppy & tent is on; Kettle rattle blocked without the kettle", !(await c1.locator('[data-ev="hail"]').isDisabled()) && await c1.locator('[data-ev="rattle"]').isDisabled());
  await c1.click('[data-cs="none"]'); await c1.check('[data-ev="fog"]');
  ok("Events: None + pick one updates the count", /1 of 15/.test(await c1.textContent("#s-comp-count")));
  await c1.click("#s-go"); await c1.waitForTimeout(500);
  ok("Companion widget shows inside the existing buddy panel", await vis(c1, "#companion") && (await c1.locator(".buddy-panel #companion").count()) === 1);
  const pw = await c1.locator(".buddy-panel").boundingBox(), qw = await c1.locator("#question-card").boundingBox();
  ok("Widget stays the same width as before and the question area isn't shrunk", pw.width <= 310 && qw.width >= 860, `${Math.round(pw.width)} / ${Math.round(qw.width)}`);
  await c1.click('[data-comp="vent"]');
  ok("Vent toggles", (await c1.getAttribute('[data-comp="vent"]', "aria-pressed")) === "true");
  await c1.click("body", { position: { x: 700, y: 20 } }).catch(() => {}); await c1.keyboard.press("v");
  ok("Keyboard V toggles the vent back", (await c1.getAttribute('[data-comp="vent"]', "aria-pressed")) === "false");
  await c1.click('[data-comp="tent"]'); await c1.waitForTimeout(250);
  ok("Puppy in the tent: Add log and vent wait", await c1.isDisabled("#btn-fuel") && await c1.isDisabled('[data-comp="vent"]') && (await c1.locator("#test-scene .scene.pup-in-tent").count()) === 1);
  await c1.click('[data-comp="tent"]'); await c1.waitForTimeout(250);
  ok("…and come back when it's out", !(await c1.isDisabled("#btn-fuel")));
  await c1.click('[data-comp="dir-E"]');
  ok("Ventilation direction selectable", (await c1.getAttribute('[data-comp="dir-E"]', "aria-checked")) === "true");
  await c1.evaluate(() => { const c = window.__fire.comp; c._startMajor("fog"); });
  await c1.waitForTimeout(400);
  ok("Event notice is a small non-blocking pill over the scene", await c1.locator("#test-scene .comp-notice.show").count() === 1 && (await c1.$eval("#test-scene .comp-notice", (e) => getComputedStyle(e).pointerEvents)) === "none");
  const typed = await c1.locator("#q-body input, #q-body .choice").count();
  ok("Questions stay usable during an event", typed > 0 && !(await c1.locator("#screen-test[inert]").count()));
  // pause stops the companion; reload keeps its state
  const ct0 = await c1.evaluate(() => window.__fire.comp.s.t);
  await c1.click("#btn-pause"); await c1.waitForTimeout(1500);
  const ct1 = await c1.evaluate(() => window.__fire.comp.s.t);
  ok("Pause freezes the companion simulation", Math.abs(ct1 - ct0) < 0.6, `${ct0.toFixed(1)} → ${ct1.toFixed(1)}`);
  await c1.click("#btn-unpause"); await c1.waitForTimeout(300);
  await c1.evaluate(() => { window.__fire.comp.s.hp = 4; }); await c1.click("#btn-pause"); await c1.waitForTimeout(200);
  await c1.reload(); await c1.waitForTimeout(600); if (await vis(c1, "#btn-enter")) await c1.click("#btn-enter");
  await c1.click("#tutor-launcher").catch(() => {}); if (await vis(c1, "#tutor-locked-resume")) await c1.click("#tutor-locked-resume"); else await c1.click("#btn-resume").catch(() => {});
  await c1.waitForTimeout(400); if (await vis(c1, "#btn-unpause")) await c1.click("#btn-unpause"); await c1.waitForTimeout(400);
  ok("Reload/resume keeps the companion state (hearts, vent direction)", await c1.evaluate(() => { const s = window.__fire && window.__fire.comp && window.__fire.comp.s; return s && Math.round(s.hp) >= 4 && s.ventDir === "E"; }));
  ok("Tutor still hidden during the test with the companion on", !(await vis(c1, "#tutor-launcher")));
  await c1.setViewportSize({ width: 390, height: 844 }); await c1.waitForTimeout(300);
  ok("Mobile: companion collapses to a small expandable row", await vis(c1, ".comp-toggle") && !(await vis(c1, ".comp-body")) && (await c1.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await c1.click(".comp-toggle"); await c1.waitForTimeout(150);
  ok("Mobile: expands on tap", await vis(c1, ".comp-body"));
  await c1.setViewportSize({ width: 1440, height: 900 });
  await c1.click("#btn-fire-off"); await c1.waitForTimeout(150); await c1.click("#dialog-ok"); await c1.waitForTimeout(300);
  ok("Turning the campfire off removes the companion completely", !(await vis(c1, "#companion")) && (await c1.evaluate(() => window.__fire.comp)) === null);

  ok("No JS errors", errors.length === 0, errors.join(" | "));
  await b.close();
  console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error("CRASH", e.message); console.log(errors); process.exit(1); });
