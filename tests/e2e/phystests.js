// Browser checks that Physics difficulty levels behave like Math's: Simple = guided practice; Normal, Challenging
const enterIf = async (p) => { if (await p.locator("#btn-enter").isVisible().catch(() => false)) await p.click("#btn-enter"); }; // the app now opens on Home; kept for old saved states
// and Nightmare = real tests in the shared test engine (options, topic constraint, answering, submission, grading,
// results, review, separate Physics history and diagnostics), and Math is unchanged.
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/phystests.js
const { chromium } = require("playwright");
const { evalNav, toTake, pickSubject } = require("./navhelp");
const toTakeIf = async (pg) => { if (!(await pg.locator("#mode-track").isVisible().catch(() => false)) && (await pg.evaluate(() => document.body.dataset.screen)) !== "test") await toTake(pg); };
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const SHOTS = process.env.SHOTS;
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const DONE = { site: "completed", test: "completed", game: "completed" };
const K = { sess: "campfire-prep.session.v2", phist: "campfire-prep.phys.history.v1", prec: "campfire-prep.phys.practice.v1", mhist: "campfire-prep.history.v2", mrec: "campfire-prep.practice.v1", subj: "campfire-prep.subject.v1" };

(async () => {
  const b = await chromium.launch();
  const mk = async (seed = {}, viewport = { width: 1440, height: 900 }) => {
    const ctx = await b.newContext({ viewport });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, "campfire-prep.prefs.v1": { mode: "normal" }, [K.subj]: "physics", ...seed });
    await p.goto(BASE); await p.waitForTimeout(250);
    await enterIf(p); await p.waitForTimeout(350);
    // tests start where they do in Math: Home → difficulty card → its preview (Start / Test options)
    return p;
  };
  const get = (p, k) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), k);
  const screen = (p) => p.evaluate(() => document.body.dataset.screen);
  const level = async (p, lv) => { await toTakeIf(p); await p.click(`#mode-track [data-mode="${lv}"]`); await p.waitForTimeout(200); };
  const chips = (p) => p.textContent("#mode-preview .mp-chips");
  const sess = (p) => get(p, K.sess);
  const fams = (s) => s.items.map((it) => it.qid.split("-")[2]);
  // answer the question on screen with its key (optionally one part deliberately wrong) through the real inputs
  const answer = async (p, wrongKey) => {
    const s = await sess(p);
    const qid = s.items[s.current].qid;
    const specs = await p.evaluate((id) => window.Bank.byId(id).parts.map((pt) => ({ key: pt.key, kind: pt.kind, r: window.PhysCheck.keyResponse(pt), answer: pt.answer, n: (pt.options || pt.steps || []).length })), qid);
    for (const sp of specs) {
      const wrong = sp.key === wrongKey;
      if (sp.kind === "qty") { const [v, u] = sp.r.split("|"); await p.fill(`[data-pt-val="${sp.key}"]`, wrong ? String(Number(v) * 3 + 11) : String(Number(Number(v).toPrecision(6)))); if (await p.$(`select[data-pt-unit="${sp.key}"]`)) await p.selectOption(`[data-pt-unit="${sp.key}"]`, u); }
      else if (sp.kind === "pmc") await p.click(`[data-pt-opt="${sp.key}"][data-i="${wrong ? (sp.answer + 1) % sp.n : sp.answer}"]`);
      else if (sp.kind === "order") {
        const ord = sp.answer.map((_, i) => i);
        if (!wrong) for (let a = 0; a < sp.answer.length; a++) { let j = ord.indexOf(sp.answer[a]); while (j > a) { await p.click(`[data-pt-move="${sp.key}"][data-pos="${j}"][data-dir="-1"]`); [ord[j - 1], ord[j]] = [ord[j], ord[j - 1]]; j--; } }
        if (await p.$(`[data-pt-keep="${sp.key}"]`)) await p.click(`[data-pt-keep="${sp.key}"]`);
      }
    }
    return { qid, specs };
  };
  const submit = async (p) => { await p.click("#btn-submit"); await p.waitForTimeout(150); await p.click("#dialog-ok"); await p.waitForTimeout(600); };

  // ── 1. Simple → an easier Physics TEST in the shared engine; guided step-by-step practice is in The Bar
  let p = await mk();
  await level(p, "simple");
  ok("Simple: the home preview is a test preview (length, time, hints) with Test options", /6 questions · 30 min/.test(await chips(p)) && /Hints only if you allow them/.test(await chips(p)) && await vis(p, "#mode-preview #btn-create"));
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(800);
  let s0 = await sess(p);
  ok("Simple: a timed test at Simple level (no scaffolds, no hints)", (await screen(p)) === "test" && s0.level === "simple" && s0.items.every((it) => /-wr-s-/.test(it.qid)) && !(await vis(p, ".ph-scaffold")) && !(await vis(p, "#btn-hint")));
  for (let i = 0; i < s0.items.length; i++) { await answer(p, null); if (i < s0.items.length - 1) { await p.click("#btn-next"); await p.waitForTimeout(120); } }
  await submit(p);
  const sAtt = (await get(p, K.phist)).pop();
  ok("Simple: answers with the keys score full marks, results recorded as Simple", sAtt && sAtt.level === "simple" && sAtt.earned === sAtt.total, sAtt && `${sAtt.earned}/${sAtt.total}`);
  await p.click("#btn-home"); await p.waitForTimeout(300);
  // guided practice: The Bar → Guided on a topic
  await p.evaluate(() => document.querySelector('#main-nav [data-go="bar"]').click()); await p.waitForTimeout(300);
  await p.locator("#bar-topics .bar-row").first().locator('[data-level="simple"]').click(); await p.waitForTimeout(400);
  ok("Guided practice: the Physics runner, untimed", (await screen(p)) === "phys" && (await p.evaluate(() => window.PhysUI.view)) === "run");
  ok("Guided practice: step-by-step scaffold shown", await vis(p, ".ph-scaffold"));
  const part = await p.evaluate(() => document.querySelector(".ph-part.current").dataset.key);
  await p.click(`[data-ph-check="${part}"]`); await p.waitForTimeout(80);
  await p.fill(`[data-ph-part="${part}"]`, "1").catch(() => {}); await p.click(`[data-ph-check="${part}"]`).catch(() => {}); await p.waitForTimeout(100);
  ok("Simple: feedback is immediate, part by part", await vis(p, "#phys-root .quiz-fb") || await vis(p, ".ph-blank-note"));
  await p.context().close();

  // ── 2. Normal → test-oriented preview, then a real timed test in the shared engine
  p = await mk();
  await level(p, "normal");
  ok("Normal: the shared home preview shows a start-test action and Test options", await vis(p, '#btn-start[data-start-mode="normal"]') && await vis(p, '#mode-preview #btn-create'));
  ok("Normal: the preview states length, time and hint policy", /6 questions · 40 min/.test(await chips(p)) && /Hints only if you allow them/.test(await chips(p)));
  ok("Normal: the primary action is not a concept-review start", !(await p.$("#mode-preview [data-ph-start]")));
  if (SHOTS) await p.screenshot({ path: SHOTS + "/pt-normal-home.png" });
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(800);
  let s = await sess(p);
  ok("Normal: opens the test screen with a running clock", (await screen(p)) === "test" && await vis(p, "#timer") && s && s.subject === "physics" && s.level === "normal" && s.duration === 40 * 60, JSON.stringify(s && { subject: s.subject, level: s.level, d: s.duration }));
  ok("Normal: 6 physics questions, all generated at Normal", s.items.length === 6 && s.items.every((it) => /^cb-1-ph_[a-z_]+-wr-n-/.test(it.qid)), s.items.map((x) => x.qid).join(" "));
  ok("Normal: every question is valid physics content (rebuilds, validates)", await p.evaluate((ids) => ids.every((id) => { const q = window.Bank.byId(id); try { window.PhysCheck.validate(q); return q.meta.subject === "physics"; } catch { return false; } }), s.items.map((x) => x.qid)));
  ok("Normal: hint button hidden — hints are off unless allowed in Test options", !(await vis(p, "#btn-hint")));
  ok("Normal: no AI tutor during the test", !(await vis(p, "#tutor-fab")) || !(await p.evaluate(() => { const t = document.querySelector("#tutor-fab"); return t && getComputedStyle(t).display !== "none"; })));
  ok("Normal: the navigator counts answered questions", /0\/6/.test(await p.textContent("#topbar-test")));
  // answer everything; Q1 part a deliberately wrong
  let wrongMarks = 0;
  for (let i = 0; i < s.items.length; i++) {
    const r = await answer(p, i === 0 ? "a" : null);
    if (i === 0) wrongMarks = 1;
    if (i < s.items.length - 1) { await p.click("#btn-next"); await p.waitForTimeout(120); }
  }
  ok("Normal: all questions count as answered", /6\/6/.test(await p.textContent("#topbar-test")));
  if (SHOTS) await p.screenshot({ path: SHOTS + "/pt-normal-test.png" });
  await submit(p);
  const ph = await get(p, K.phist);
  const att = ph && ph[ph.length - 1];
  ok("Normal: submitting grades the test and shows results", (await screen(p)) === "results" && att && att.subject === "physics" && att.level === "normal");
  ok("Normal: score reflects the one wrong part", att && att.earned === att.total - wrongMarks, att && `${att.earned}/${att.total}`);
  ok("Results: headline percent and marks", new RegExp(`${att.percent}%`).test(await p.textContent("#stat-grid")));
  ok("Results: question-by-question review with the key for the wrong part", (await p.locator("#review-list .review-item").count()) === 6 && /Key/.test(await p.textContent("#review-list .review-item >> nth=0")));
  ok("Results: worked solutions are present for every question", (await p.locator("#review-list details.explain").count()) === 6 && (await p.locator("#review-list details.explain ol li").count()) >= 6);
  ok("Results: skill performance and follow-ups for Physics", /by skill/i.test(await p.textContent("#topic-breakdown")) && (await p.locator('#topic-breakdown [data-phys-lesson], #topic-breakdown .ph-recs').count()) >= 1);
  if (SHOTS) await p.screenshot({ path: SHOTS + "/pt-normal-results.png" });
  const recs = await get(p, K.prec);
  const nParts = await p.evaluate((ids) => ids.reduce((a, id) => a + window.Bank.byId(id).parts.length, 0), att.items.map((x) => x.qid));
  ok("Diagnostics: every graded part became a Physics record", recs.filter((r) => r.run === att.id && r.test).length === nParts && recs.filter((r) => r.run === att.id && !r.correct).length === 1, `${recs.filter((r) => r.run === att.id).length}/${nParts}`);
  ok("Math history and Math records untouched", !(await get(p, K.mhist)) && !(await get(p, K.mrec)));
  await p.click("#btn-home"); await p.waitForTimeout(400);
  ok("Back home returns to the (shared) home in Physics", (await screen(p)) === "home" && (await p.evaluate(() => document.body.dataset.subject)) === "physics");
  ok("Home: the Physics card now shows measured coverage", /[1-9]\d*% of topics practised/.test(await p.textContent("#hub-subjects .s-physics")));
  await p.evaluate(() => document.querySelector('#main-nav [data-go="progress"]').click()); await p.waitForTimeout(300);
  ok("Diagnostics history lists the Physics test", /Normal Physics test/.test(await p.textContent("#progress-phys")));
  await p.click("#progress-phys [data-attempt]"); await p.waitForTimeout(400);
  ok("…and reopens its results", (await screen(p)) === "results");
  await p.click("#btn-home"); await p.waitForTimeout(300);
  await evalNav(p, "progress", 250);
  ok("Progress: Physics diagnostics now show evidence", (await p.locator("#progress-phys .ph-skills li").count()) >= 1);
  ok("Progress: test history lists the attempt", (await p.locator("#progress-phys [data-attempt]").count()) >= 1);
  await p.click('.screen:not([hidden]) [data-tabs] [data-go="review"]'); await p.waitForTimeout(250);
  ok("Mistakes & review: the queue picks up the missed family", (await p.locator("#review-phys .sp-queue li").count()) >= 1);
  await p.context().close();

  // ── 3. Challenging → a real Challenging test (fixed level, one hint)
  p = await mk();
  await level(p, "challenge");
  ok("Challenging: test preview", await vis(p, '#btn-start[data-start-mode="challenge"]') && /At most one hint/.test(await chips(p)));
  await p.evaluate(() => { const k = "campfire-prep.prefs.v1"; const v = JSON.parse(localStorage.getItem(k) || "{}"); v.allowHints = true; localStorage.setItem(k, JSON.stringify(v)); }); // hints allowed (Test options)
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(800);
  s = await sess(p);
  ok("Challenging: real test, every question generated at Challenging", (await screen(p)) === "test" && s.level === "challenge" && s.items.every((it) => /-wr-c-/.test(it.qid)));
  await p.click("#btn-hint"); await p.waitForTimeout(80);
  ok("Challenging (hints allowed): exactly one hint per question", (await p.locator("#hint-box li").count()) === 1 && await p.isDisabled("#btn-hint"));
  await p.click("#btn-quit"); await p.waitForTimeout(120); await p.click("#dialog-ok"); await p.waitForTimeout(400);
  ok("Leaving keeps the test: the Physics home offers to resume it", (await screen(p)) === "home" && await vis(p, "#resume-box #btn-resume"));
  await p.click("#resume-box #btn-resume"); await p.waitForTimeout(500);
  ok("Resume continues the same Challenging test", (await screen(p)) === "test" && JSON.stringify((await sess(p)).items.map((x) => x.qid)) === JSON.stringify(s.items.map((x) => x.qid)));
  await p.click("#btn-quit"); await p.waitForTimeout(120); await p.click("#dialog-ok"); await p.waitForTimeout(300);
  await pickSubject(p, "math", 400);
  ok("Math home doesn't offer the saved Physics test as a Math test", (await screen(p)) === "home" && !(await vis(p, "#btn-resume")));
  await p.context().close();

  // ── 4. Nightmare → a real multi-stage assessment, no hints
  p = await mk();
  await level(p, "nightmare");
  ok("Nightmare: assessment preview with no hints", await vis(p, '#btn-start[data-start-mode="nightmare"]') && /No hints/.test(await chips(p)));
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(800);
  s = await sess(p);
  const NM = await p.evaluate(() => window.PhysTest.NIGHTMARE_FAMS);
  ok("Nightmare: real test, all Nightmare-level, from the multi-step families", (await screen(p)) === "test" && s.level === "nightmare" && s.items.length === 4 && s.items.every((it) => /-wr-x-/.test(it.qid)) && fams(s).every((f) => NM.includes(f)), fams(s).join(","));
  ok("Nightmare: every question has several linked parts", await p.evaluate((ids) => ids.every((id) => window.Bank.byId(id).parts.length >= 2), s.items.map((x) => x.qid)));
  ok("Nightmare: hint button hidden; questions labelled as stages", !(await vis(p, "#btn-hint")) && /Stage 1/.test(await p.textContent("#q-label")));
  for (let i = 0; i < s.items.length; i++) { await answer(p, null); if (i < s.items.length - 1) { await p.click("#btn-next"); await p.waitForTimeout(120); } }
  await submit(p);
  const nm = (await get(p, K.phist)).pop();
  ok("Nightmare: answers with the keys score full marks (keys, tolerances and units agree)", nm && nm.level === "nightmare" && nm.earned === nm.total, nm && `${nm.earned}/${nm.total}`);
  await p.context().close();

  // ── 5–6. Options change the test; topics constrain generation
  p = await mk();
  await level(p, "normal");
  const offered = await p.$$eval("#pt-topic option:not([disabled])", (xs) => xs.map((x) => x.value));
  const real = await p.evaluate(() => window.PhysTest.topics("normal").filter((t) => t.ok).map((t) => t.id));
  ok("Topic list offers exactly the topics that generate at this level (plus mixed)", JSON.stringify(offered.slice().sort()) === JSON.stringify(real.slice().sort()), offered.join(","));
  await p.selectOption("#pt-topic", "PC.horizontal"); await p.waitForTimeout(200);
  await toTakeIf(p); await p.click('#mode-preview [data-pt-n="4"]'); await p.waitForTimeout(200);
  ok("Preview remembers the chosen options", /4 questions/.test(await chips(p)) && (await p.inputValue("#pt-topic")) === "PC.horizontal");
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(800);
  s = await sess(p);
  const horiz = await p.evaluate(() => window.PhysCurriculum.coverage().find((c) => c.id === "PC.horizontal").families);
  ok("Question count option: 4 questions", s.items.length === 4, String(s.items.length));
  ok("Topic option: every question belongs to Horizontal launches", fams(s).every((f) => horiz.includes(f)), fams(s).join(","));
  await p.click("#btn-quit"); await p.waitForTimeout(120); await p.click("#dialog-ok"); await p.waitForTimeout(300);
  await toTakeIf(p); await p.click("#mode-preview #btn-create"); await p.waitForTimeout(250); // after Exit we're on the shared home: its Test options button
  ok("Test options: the shared Create-test dialog opens with Physics options (no group test)", await vis(p, "#s-phys") && !(await vis(p, "#setup-dialog .group-section")) && /Physics/.test(await p.textContent("#setup-title")));
  await p.click('#s-phys-n [data-n="8"]');
  await p.selectOption("#s-phys-topic", "mix");
  await p.evaluate(() => { const r = document.querySelector("#s-time"); r.value = 25; r.dispatchEvent(new Event("input", { bubbles: true })); });
  await p.click("#s-go"); await p.waitForTimeout(400);
  if (await vis(p, "#dialog[open]")) { await p.click("#dialog-ok"); await p.waitForTimeout(600); }
  s = await sess(p);
  ok("Test options: 8 questions, mixed topics, 25-minute limit", s && s.items.length === 8 && s.duration === 25 * 60 && new Set(fams(s)).size >= 4, s && `${s.items.length} q, ${s.duration}s, ${new Set(fams(s)).size} families`);
  ok("Mixed test spans several projectile topics", await p.evaluate((ids) => new Set(ids.map((id) => window.Bank.byId(id).meta.sub)).size >= 3, s.items.map((x) => x.qid)));
  await p.context().close();

  // ── 11. Math is unchanged
  p = await mk({ [K.subj]: "math" });
  await toTake(p);
  ok("Math Take a Test still has its difficulty cards and preview", (await p.locator("#mode-track .mode-card").count()) === 4 && await vis(p, "#mode-preview #btn-start"));
  await toTakeIf(p); await p.evaluate(() => { document.querySelector('#mode-track [data-mode="normal"]').click(); });
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(800);
  s = await sess(p);
  ok("Math Normal still starts the Math unit test (34 marks, quadratics)", (await screen(p)) === "test" && s.subject === "quadratics" && s.items.some((it) => it.kind === "mc") && s.items.some((it) => it.kind === "nr"));
  await p.context().close();

  // ── 12. Layout: every layout and phone width
  for (const layout of ["balanced", "focus", "studio", "studioplus"]) {
    p = await mk({ "campfire-prep.ui.v1": { layout } });
    if (layout !== "studioplus") await toTake(p);
    ok(`${layout}: the test launcher renders without overflow`, await p.evaluate(() => [...document.querySelectorAll("#btn-start, #splus .btn-primary")].some((x) => x.offsetParent)) && (await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/pt-${layout}.png` });
    await p.context().close();
  }
  p = await mk({}, { width: 390, height: 844 });
  ok("Phone: launcher fits", (await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
  await toTakeIf(p); await p.click("#btn-start"); await p.waitForTimeout(800);
  ok("Phone: the physics test fits", (await screen(p)) === "test" && (await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
  if (SHOTS) await p.screenshot({ path: SHOTS + "/pt-phone-test.png" });
  await p.context().close();

  ok("No page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
  await b.close();
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - fail}/${results.length} passed`);
  process.exit(fail ? 1 : 0);
})();
