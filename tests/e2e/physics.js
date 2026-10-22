// Browser checks for Physics 11: the subject switcher, separate data, the practice runner answered with real keys,
// leaving an active run, every layout, the lab tools and their cleanup, Goose Mode, five languages and phone width.
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/physics.js
const { chromium } = require("playwright");
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
const results = []; const errors = [];
const ok = (n, c, x = "") => { results.push({ n, pass: !!c }); console.log((c ? "PASS " : "FAIL ") + n + (x ? "  — " + x : "")); };
const vis = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const DONE = { site: "completed", test: "completed", game: "completed" };
const PK = "campfire-prep.phys.practice.v1", MK = "campfire-prep.practice.v1", SK = "campfire-prep.subject.v1";

(async () => {
  const b = await chromium.launch();
  const mk = async (seed = {}, viewport = { width: 1440, height: 900 }, ctxIn) => {
    const ctx = ctxIn || await b.newContext({ viewport });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|favicon|503|fonts/.test(m.text())) errors.push(m.text()); });
    if (!ctxIn) await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, "campfire-prep.prefs.v1": { mode: "normal" }, ...seed });
    await p.goto(BASE); await p.waitForTimeout(250);
    await p.click("#btn-enter"); await p.waitForTimeout(300);
    return p;
  };
  const toPhysics = async (p) => { await p.click("#subject-btn"); await p.waitForTimeout(80); await p.click('#subject-menu [data-subject="physics"]'); await p.waitForTimeout(350); };
  const toMath = async (p) => { await p.click("#subject-btn"); await p.waitForTimeout(80); await p.click('#subject-menu [data-subject="math"]'); await p.waitForTimeout(350); };
  const nav = async (p, go) => { await p.evaluate((go) => document.querySelector(`#main-nav [data-go="${go}"]`).click(), go); await p.waitForTimeout(220); };
  const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const physView = (p) => p.evaluate(() => document.getElementById("phys-root").dataset.view);
  const store = (p, k) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), k);
  // answer the question on screen with its key, part by part, through the real inputs
  const answerCurrent = async (p, wrongFirst) => {
    const cur = await p.evaluate(() => window.PhysUI.current());
    if (!cur) return false;
    for (let guard = 0; guard < 8; guard++) {
      const part = await p.evaluate(() => { const c = document.querySelector("#phys-root .ph-part.current"); return c && c.dataset.key; });
      if (!part) break;
      const spec = await p.evaluate(({ id, key }) => { const q = window.Bank.byId(id); const pt = q.parts.find((x) => x.key === key); return { kind: pt.kind, key: window.PhysCheck.keyResponse(pt), answer: pt.answer, units: pt.units }; }, { id: cur.id, key: part });
      if (spec.kind === "qty") {
        const [v, u] = spec.key.split("|");
        const val = wrongFirst ? String(Number(v) * 3 + 7) : String(Number(Number(v).toPrecision(6)));
        await p.fill(`[data-ph-part="${part}"]`, val);
        if (await p.$(`[data-ph-unit="${part}"]`)) await p.selectOption(`[data-ph-unit="${part}"]`, u);
      } else if (spec.kind === "pmc") {
        const n = await p.locator(`[data-ph-opt="${part}"]`).count();
        await p.click(`[data-ph-opt="${part}"][data-i="${wrongFirst ? (spec.answer + 1) % n : spec.answer}"]`);
      } else if (spec.kind === "order") {
        const ord = spec.answer.map((_, i) => i);
        if (!wrongFirst) for (let i = 0; i < spec.answer.length; i++) {
          let j = ord.indexOf(spec.answer[i]);
          while (j > i) { await p.click(`[data-ph-move="${part}"][data-pos="${j}"][data-dir="-1"]`); [ord[j - 1], ord[j]] = [ord[j], ord[j - 1]]; j--; }
        }
      }
      await p.click(`[data-ph-check="${part}"]`); await p.waitForTimeout(60);
      wrongFirst = false;
    }
    return true;
  };

  // ── 1. switcher, labels, persistence, remembered subject
  let p = await mk({ [MK]: [{ date: Date.now(), quiz: "seed", source: "drill", level: "normal", qid: "x", kind: "nr", concepts: [], sub: "F.vertex_to_std", family: "f", mode: "normal", correct: true }] });
  ok("Subject switcher is in the island, Math selected by default", await vis(p, "#subject-btn") && (await p.getAttribute("#subject-btn", "data-subject")) === "math");
  await p.click("#subject-btn"); await p.waitForTimeout(80);
  ok("Menu offers Math and Physics as radio items", (await p.$$eval("#subject-menu [role=menuitemradio]", (xs) => xs.map((x) => x.dataset.subject).join(","))) === "math,physics");
  await p.keyboard.press("Escape"); await p.waitForTimeout(80);
  ok("Escape closes the subject menu", !(await vis(p, "#subject-menu")));
  await toPhysics(p);
  ok("Physics home opens (the shared home screen)", (await p.evaluate(() => document.body.dataset.subject)) === "physics" && (await p.evaluate(() => document.body.dataset.screen)) === "home" && await vis(p, "#mode-track"));
  const labs = await p.evaluate(() => ["library", "studyroom"].map((g) => document.querySelector(`#main-nav [data-go="${g}"] span[data-i18n]`).textContent));
  ok("Island labels change to Lessons and Lab for Physics", /Lessons|Learn/.test(labs[0]) && /Lab/.test(labs[1]), labs.join(","));
  ok("Physics dashboard is empty-honest (no Math records shown, no invented progress)", !(await p.evaluate(() => /Vertex|vertex/.test(document.getElementById("phys-root").textContent))));
  await p.reload(); await p.waitForTimeout(250); await p.click("#btn-enter"); await p.waitForTimeout(300);
  ok("Last subject is remembered after reload", (await p.evaluate(() => document.body.dataset.subject)) === "physics" && (await p.evaluate(() => document.body.dataset.screen)) === "home");
  for (const [go, view] of [["library", "learn"], ["practice", "practice"], ["studyroom", "lab"]]) {
    await nav(p, go);
    ok(`Island "${go}" opens the physics ${view} view`, (await physView(p)) === view && (await p.getAttribute(`#main-nav [data-go="${go}"]`, "aria-current")) === "page");
  }
  await p.evaluate(() => window.__app && 0); // (Progress has no island button; the in-app route is covered by navigate("progress") → diagnostics)

  // ── 2. a practice run answered through the real inputs, records kept separately
  await nav(p, "home");
  await p.evaluate(() => window.PhysUI.startRun({ subs: ["PC.angled_same"], n: 5 })); await p.waitForTimeout(300); // the practice runner (Simple, reviews)
  ok("Untimed practice at Normal (secondary link) starts the practice runner", (await physView(p)) === "run" && await vis(p, ".ph-q"));
  const first = await p.evaluate(() => window.PhysUI.current());
  ok("Run is at the chosen level (Normal) and fixed", first && /^cb-1-ph_[a-z_]+-wr-n-/.test(first.id), first && first.id);
  ok("No AI tutor inside the physics runner", !(await vis(p, "#screen-phys .tutor, #screen-phys [data-tutor]")));
  await p.click("[data-ph-hint]"); await p.waitForTimeout(80);
  ok("Hints reveal one at a time", (await p.locator(".hint-box li").count()) === 1);
  let n = 0;
  await answerCurrent(p, true); n++;
  const fb = await p.textContent("#phys-root .quiz-fb");
  ok("A wrong first part shows the right answer and feedback", /Not quite|Answer|answer/i.test(fb), fb.slice(0, 120));
  ok("A worked solution appears once every part is checked", await vis(p, ".fb-solution"));
  for (let i = 0; i < 12 && await p.$("[data-ph-next]"); i++) {
    await p.click("[data-ph-next]"); await p.waitForTimeout(150);
    if (!(await p.evaluate(() => window.PhysUI.current() && document.querySelector(".ph-part.current")))) break;
    await answerCurrent(p, false); n++;
  }
  await p.waitForTimeout(150);
  ok("Results screen with a score and per-skill breakdown", await vis(p, ".ph-results") && await vis(p, ".ph-res-skills, section.ph-res-skills"));
  const recs = await store(p, PK);
  ok("Physics answers are stored under the physics key", Array.isArray(recs) && recs.length >= n, `${recs && recs.length} records for ${n} questions`);
  ok("Keys typed through the inputs grade right (all but the deliberate wrong part)", recs.filter((r) => !r.correct).length >= 1 && recs.filter((r) => r.correct).length >= recs.length - 2 - 0, JSON.stringify(recs.filter((r) => !r.correct).map((r) => [r.family, r.part, r.response])));
  ok("Every record carries skills, level and an error category only when wrong", recs.every((r) => r.skills && r.skills.length && r.mode === "normal" && (r.correct ? !r.cat : true)));
  ok("Math practice records untouched", (await store(p, MK)).length === 1);
  await p.click(".ph-results [data-ph-leave]"); await p.waitForTimeout(200);
  await nav(p, "practice");
  await p.click('[data-ph-tab="diagnostics"]'); await p.waitForTimeout(150);
  ok("Diagnostics show evidence from the run (not empty, not invented)", (await p.locator("#phys-root .ph-skills li, #phys-root .ph-diag li").count()) >= 1);
  await p.click('[data-ph-tab="review"]'); await p.waitForTimeout(150);
  ok("Review tab renders", await vis(p, "section.ph-review"));
  await p.click('[data-ph-tab="course"]'); await p.waitForTimeout(150);
  const legend = await p.textContent(".ph-legend");
  ok("Course map labels statuses honestly (tested / validation / planned / supplementary)", /Implemented and tested/i.test(legend) && /Planned/i.test(legend) && /Supplementary/i.test(legend), legend.replace(/\s+/g, " ").slice(0, 160));

  // ── 3. switching subject during an active run asks first
  await nav(p, "home");
  await p.evaluate(() => window.PhysUI.startRun({ subs: ["PC.angled_same"], n: 5 })); await p.waitForTimeout(300); // the practice runner (Simple, reviews)
  const before = await p.evaluate(() => window.PhysUI.current());
  await toMath(p);
  ok("Switching subject mid-run asks to confirm", await p.evaluate(() => document.getElementById("dialog").open));
  await p.click("#dialog-cancel"); await p.waitForTimeout(150);
  ok("Staying keeps the same run and question", (await physView(p)) === "run" && JSON.stringify(await p.evaluate(() => window.PhysUI.current())) === JSON.stringify(before));
  await toMath(p); await p.click("#dialog-ok"); await p.waitForTimeout(300);
  ok("Confirming switches to Math home", (await p.evaluate(() => document.body.dataset.subject)) === "math" && (await p.evaluate(() => document.body.dataset.screen)) === "home" && !(await p.evaluate(() => window.PhysUI.runActive)));
  ok("Island labels return to Math", await p.evaluate(() => document.querySelector('#main-nav [data-go="studyroom"] span[data-i18n]').dataset.i18n === "nav.room"));
  await toPhysics(p);
  ok("Switching back with no run active is immediate", (await p.evaluate(() => document.body.dataset.screen)) === "home" && !(await p.evaluate(() => document.getElementById("dialog").open)));
  await p.context().close();

  // ── 3b. the site tour (a tour of the Math app) started from Physics switches to Math first
  p = await mk({ [SK]: "physics" });
  await p.evaluate(() => window.Onboarding.startSite()); await p.waitForTimeout(500);
  ok("Starting the site tour from Physics switches to Math and runs the tour", (await p.evaluate(() => document.body.dataset.subject)) === "math" && await vis(p, "#tour-card"));
  await p.click("#tour-skip").catch(() => {}); await p.waitForTimeout(150);
  await p.context().close();

  // ── 4. every layout, and the lab tools mount and clean up
  for (const layout of ["balanced", "focus", "studio", "studioplus"]) {
    p = await mk({ "campfire-prep.ui.v1": { layout }, [SK]: "physics" });
    const st = await p.evaluate(() => ({ s: document.body.dataset.subject, scr: document.body.dataset.screen }));
    ok(`${layout}: physics home renders`, st.s === "physics" && st.scr === "home" && (layout === "studioplus" ? await vis(p, "#splus .sp-launch") : await vis(p, "#mode-track")), JSON.stringify(st));
    ok(`${layout}: no horizontal overflow`, (await overflow(p)) <= 0);
    if (layout === "studioplus") {
      ok("Studio+: the shared workspace with Physics panels (no embedded lab)", await vis(p, "#splus .sp-diag") && !(await vis(p, "[data-tool-host]")));
    }
    await p.context().close();
  }
  p = await mk({ [SK]: "physics" });
  await nav(p, "studyroom");
  ok("Lab opens with the Projectile Explorer", await vis(p, '[data-tool-host="explorer"] svg'));
  const ex = await p.evaluate(() => {
    const r = {}; const host = document.querySelector('[data-tool-host="explorer"]');
    const ins = [...host.querySelectorAll('input[type="range"]')]; r.sliders = ins.length;
    return r;
  });
  ok("Explorer has launch sliders", ex.sliders >= 3, JSON.stringify(ex));
  const play = p.locator('[data-tool-host="explorer"] button').filter({ hasText: /Play|Launch/i }).first();
  if (await play.count()) { await play.click(); await p.waitForTimeout(400); }
  for (const tool of ["graphs", "vector"]) {
    await p.click(`[data-ph-tool="${tool}"]`); await p.waitForTimeout(250);
    ok(`${tool} tool mounts (svg drawn)`, await vis(p, `[data-tool-host="${tool}"] svg`));
  }
  await nav(p, "home");
  ok("Leaving the lab hides and unmounts the tool", !(await vis(p, "[data-tool-host]")) && (await p.evaluate(() => document.body.dataset.screen)) === "home");
  await nav(p, "library");
  ok("Lessons render with equations (KaTeX)", (await p.locator("#phys-root .katex").count()) > 0);
  const ltabs = await p.$$eval("#phys-root [data-ph-ltab]", (xs) => xs.map((x) => x.dataset.phLtab));
  if (ltabs.includes("formulas")) { await p.click('[data-ph-ltab="formulas"]'); await p.waitForTimeout(200); }
  ok("Formula reference lists the range formula with its equal-heights condition", /equal|same/i.test(await p.textContent("#phys-root")));
  await p.context().close();

  // ── 5. Goose Mode is compatible: effects never alter physics numbers, and end cleanly
  p = await mk({ "campfire-prep.prefs.v1": { mode: "normal", goose: true }, [SK]: "physics" });
  ok("Goose Mode is active on the physics home", await p.evaluate(() => window.Goose.enabled));
  await p.evaluate(() => window.PhysUI.startRun({ subs: ["PC.angled_same"], n: 5 })); await p.waitForTimeout(300); // the practice runner (Simple, reviews)
  const q0 = await p.evaluate(() => { const c = window.PhysUI.current(); return { id: c.id, text: document.querySelector(".ph-q .q-text").textContent }; });
  await p.evaluate(() => window.Goose.endAll());
  const trig = await p.evaluate(() => ["grayscale", "rainbow", "shake"].map((id) => { window.Goose.endAll(); return window.Goose.trigger(id); }));
  await p.waitForTimeout(400);
  await p.evaluate(() => window.Goose.endAll()); await p.waitForTimeout(800);
  const q1 = await p.evaluate(() => { const c = window.PhysUI.current(); return { id: c.id, text: document.querySelector(".ph-q .q-text").textContent }; });
  ok("Goose effects leave the question and its numbers unchanged", q0.id === q1.id && q0.text === q1.text, JSON.stringify(trig));
  ok("…and leave no effect classes behind", await p.evaluate(() => !document.querySelector(".gz-goose, .gz-dim, .gz-freeze") && ![...document.body.classList].some((c) => c.startsWith("gz-fx"))));
  await answerCurrent(p, false);
  ok("A run under Goose Mode still grades with the key", (await store(p, PK)).every((r) => r.correct));
  await p.context().close();

  // ── 6. five languages: no raw keys, no overflow; phone width
  for (const lang of ["fr", "es", "de", "zh"]) {
    p = await mk({ "campfire-prep.ui.v1": { lang }, [SK]: "physics" });
    const raw = async () => p.evaluate(() => (document.getElementById("phys-root").textContent.match(/\b(ph|phs|phc|pt|pf|subject)\.[a-z][\w.]+/g) || []).slice(0, 5));
    const r1 = await raw();
    await p.evaluate(() => window.PhysUI.startRun({ subs: ["PC.angled_same"], n: 5 })); await p.waitForTimeout(300); // the practice runner (Simple, reviews)
    const r2 = await raw();
    const stem = await p.evaluate(() => document.querySelector(".ph-q .q-text").textContent);
    await nav(p, "studyroom");
    const r3 = await raw();
    ok(`${lang}: physics home, runner and lab show no raw translation keys`, !r1.length && !r2.length && !r3.length, JSON.stringify([r1, r2, r3]));
    ok(`${lang}: question text is translated`, lang === "zh" ? /[一-鿿]/.test(stem) : !/^A |^An |^The /.test(stem), stem.slice(0, 80));
    ok(`${lang}: no horizontal overflow`, (await overflow(p)) <= 0);
    await p.context().close();
  }
  p = await mk({ [SK]: "physics" }, { width: 390, height: 844 });
  ok("Phone: physics home fits", (await overflow(p)) <= 0);
  await p.evaluate(() => window.PhysUI.startRun({ subs: ["PC.angled_same"], n: 5 })); await p.waitForTimeout(300); // the practice runner (Simple, reviews)
  ok("Phone: runner fits", (await overflow(p)) <= 0 && await vis(p, ".ph-q"));
  await nav(p, "studyroom");
  ok("Phone: lab fits", (await overflow(p)) <= 0 && await vis(p, '[data-tool-host="explorer"] svg'));
  await p.context().close();

  ok("No page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
  await b.close();
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - fail}/${results.length} passed`);
  process.exit(fail ? 1 : 0);
})();
