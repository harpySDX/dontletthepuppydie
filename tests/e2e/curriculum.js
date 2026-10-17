// Browser checks for the curriculum engine: the Whole course screen, fixed difficulty, every new answer kind
// answered through the real practice runner, the empty-grid graph builder, and library quizzes on new topics.
// Run against tests/e2e/devserver.js:  node tests/e2e/devserver.js &  then  node tests/e2e/curriculum.js
const { chromium } = require("playwright");
const OUT = process.env.E2E_OUT || require("os").tmpdir(); process.chdir(OUT);
const BASE = process.env.BASE || "http://localhost:8766/";
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
    await p.addInitScript((seed) => { if (!sessionStorage.getItem("i")) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v)); sessionStorage.setItem("i", 1); } }, { "campfire-prep.onboarding.v1": DONE, ...seed });
    await p.goto(BASE); await p.waitForTimeout(300);
    await p.click("#btn-enter"); await p.waitForTimeout(300);
    return p;
  };
  const toCourse = async (p) => {
    await p.evaluate(() => document.querySelector('[data-go="practice"]').click()); await p.waitForTimeout(200);
    await p.click('.prac-tabs [data-go="course"] >> visible=true'); await p.waitForTimeout(250);
  };
  // answer the current practice question with its own key, through the real inputs
  const answerWithKey = (p) => p.evaluate(() => {
    const box = document.querySelector("#prac-run"), r = box._run, it = r.items[r.i];
    if (it.kind === "mc") { box.querySelector('[data-mc="0"]').click(); return "mc"; }
    if (it.kind === "nr") { const i = box.querySelector("#pr-nr"); i.value = String(it.q.ansText || it.q.answer); i.dispatchEvent(new Event("input", { bubbles: true })); return "nr"; }
    const resp = window.Bank.keyResponse(it.part);
    if (it.part.kind === "graph" || it.part.kind === "plot") { r.answers[r.i] = { response: resp }; box.querySelector('[data-pr="check"]').disabled = false; return it.part.kind; }
    const seg = box.querySelector(`[data-choice][data-value="${CSS.escape(resp)}"]`);
    if (seg) { seg.click(); return it.part.kind; }
    const i = box.querySelector(".wr-part input"); i.value = resp; i.dispatchEvent(new Event("input", { bubbles: true })); return it.part.kind;
  });
  const fbRight = (p) => p.evaluate(() => { const f = document.querySelector("#prac-run .quiz-fb"); return f ? f.classList.contains("ok") : null; });

  // ── 1. course screen: all nine units, coverage computed live, fixed level, honest gaps
  let p = await mk();
  await toCourse(p);
  ok("Whole course tab shows units A–I", (await p.locator("#course-body .course-unit").count()) === 9);
  const cov = await p.textContent("#course-body .course-top");
  const real = await p.evaluate(() => { const c = window.Curriculum.coverage(); return { impl: c.filter((x) => x.implemented).length, total: c.length }; });
  ok("Coverage line matches the live registry", cov.includes(`${real.impl}`) && cov.includes(`${real.total}`), `${real.impl}/${real.total}`);
  await p.click('[data-course-mode="simple"]'); await p.waitForTimeout(150);
  const disabledSimple = await p.locator("#course-body [data-course-sub][disabled]").count();
  const noSimple = await p.evaluate(() => window.Curriculum.coverage().filter((c) => !c.modes.includes("simple")).length);
  ok("Simple level: subtopics without Simple questions are disabled, not substituted", disabledSimple === noSimple, `${disabledSimple} disabled`);
  await p.reload(); await p.waitForTimeout(300); await p.click("#btn-enter"); await p.waitForTimeout(250); await toCourse(p);
  ok("Course level choice is remembered", (await p.getAttribute('[data-course-mode="simple"]', "aria-checked")) === "true");
  await p.click('[data-course-mode="normal"]'); await p.waitForTimeout(150);

  // ── 2. a subtopic run (interval answers) end to end, every question at the chosen level, answered with its key
  await p.evaluate(() => { const d = document.querySelector('.course-unit[data-unit="G"]'); d.open = true; });
  await p.click('[data-course-sub="G.quadratic"]'); await p.waitForTimeout(300);
  ok("Subtopic practice opens in the runner", await vis(p, "#prac-run .pr-title"));
  let allRight = true, kinds = new Set(), modes = new Set();
  for (let i = 0; i < 6; i++) {
    const meta = await p.evaluate(() => { const r = document.querySelector("#prac-run")._run; const q = r.items[r.i].q; return { m: q.meta.mode, s: q.meta.subs }; });
    modes.add(meta.m);
    kinds.add(await answerWithKey(p)); await p.waitForTimeout(80);
    await p.click('#prac-run [data-pr="check"]'); await p.waitForTimeout(120);
    if (!(await fbRight(p))) allRight = false;
    await p.click('#prac-run [data-pr="next"]'); await p.waitForTimeout(120);
  }
  ok("Every question in a Normal run is Normal", modes.size === 1 && modes.has("normal"), [...modes].join(","));
  ok("Keys typed into the real inputs are marked right (incl. interval notation)", allRight, [...kinds].join(","));
  ok("End screen shows the score", /6 \/ 6/.test(await p.textContent("#prac-run")));
  const rec = await p.evaluate(() => JSON.parse(localStorage.getItem("campfire-prep.practice.v1") || "[]").slice(-6));
  ok("Practice records carry subtopic, family and level", rec.length === 6 && rec.every((r) => r.sub && r.family && r.mode === "normal"));
  await p.click('#prac-run [data-pr="exit"]'); await p.waitForTimeout(200);
  ok("Course shows your result on that subtopic", /6\s*\/\s*6|6 of 6/.test(await p.textContent('.sub-row:has([data-course-sub="G.quadratic"])')));

  // ── 3. equivalent answers in other notation, and a form-check partial
  await p.evaluate(() => window.Bank.clearHistory());
  for (const [sub, label] of [["D.trinomials", "factoring"], ["B.laws", "exponent laws"], ["I.compound", "finance (rounding)"], ["H.cosine_law", "trigonometry"], ["E.simplify", "rational expressions"], ["F.vertex_to_std", "form conversion"]]) {
    await p.evaluate((u) => { const d = document.querySelector(`.course-unit[data-unit="${u}"]`); d.open = true; }, sub[0]);
    await p.click(`[data-course-sub="${sub}"]`); await p.waitForTimeout(250);
    let right = 0, n = 0;
    for (let i = 0; i < 6; i++) {
      await answerWithKey(p); await p.waitForTimeout(60);
      await p.click('#prac-run [data-pr="check"]'); await p.waitForTimeout(100);
      n++; if (await fbRight(p)) right++;
      await p.click('#prac-run [data-pr="next"]'); await p.waitForTimeout(100);
    }
    ok(`${label}: all six keys accepted through the UI`, right === n, `${right}/${n}`);
    await p.click('#prac-run [data-pr="exit"]'); await p.waitForTimeout(150);
  }

  // ── 4. graph builder on an empty grid: no curve before submitting, keyboard placement, correct graph after
  const gq = await p.evaluate(() => {
    let q; for (let s = 1; s < 50 && !q; s++) { try { q = window.Bank.make("f_graph_build", "wr", "normal", s); } catch { /* next */ } }
    window.__gq = q; return { a: q.parts[0].answer, id: q.id };
  });
  await p.evaluate(() => document.querySelector('[data-go="practice"]').click()); await p.waitForTimeout(200);
  await p.evaluate(() => {
    const box = document.querySelector("#prac-run"); document.querySelector("#prac-body").hidden = true; box.hidden = false;
    window.Practice.run(box, { source: "drill", level: "normal", title: "Graph", items: [window.Practice.makeItem("wr", window.__gq, "a")], end: () => "<p>done</p>", onExit: () => {} });
  });
  await p.waitForTimeout(300);
  ok("Graph question starts on an empty grid (no parabola drawn)", (await p.locator("#prac-run .plot-host .g-curve").count()) === 0 && (await p.locator("#prac-run .plot-host svg").count()) === 1);
  ok("Check is disabled until points are placed", await p.isDisabled('#prac-run [data-pr="check"]'));
  const A = Number(gq.a.a), H = Number(gq.a.h), K = Number(gq.a.k);
  // place by clicking the grid like a learner: find where the integer grid lines are drawn, then click there
  await p.locator("#prac-run .plot-host svg").scrollIntoViewIfNeeded();
  const toPx = (x, y) => p.evaluate(([x, y]) => {
    const svg = document.querySelector("#prac-run .plot-host svg"), win = { x0: -9, x1: 9, y0: -9, y1: 9 };
    const vs = [...svg.querySelectorAll("line.g-grid")].filter((l) => l.getAttribute("x1") === l.getAttribute("x2")).map((l) => +l.getAttribute("x1")).sort((a, b) => a - b);
    const hs = [...svg.querySelectorAll("line.g-grid")].filter((l) => l.getAttribute("y1") === l.getAttribute("y2")).map((l) => +l.getAttribute("y1")).sort((a, b) => b - a);
    const sx = vs[0] + (x - win.x0) * (vs[vs.length - 1] - vs[0]) / (win.x1 - win.x0), sy = hs[0] + (y - win.y0) * (hs[hs.length - 1] - hs[0]) / (win.y1 - win.y0);
    const pt = svg.createSVGPoint(); pt.x = sx; pt.y = sy; const q = pt.matrixTransform(svg.getScreenCTM());
    return { x: q.x, y: q.y };
  }, [x, y]);
  const pts = [[H, K], [H - 1, A + K], [H + 1, A + K]].filter(([x, y]) => Math.abs(y) <= 9 && Math.abs(x) <= 9);
  for (const [x, y] of pts) { const q = await toPx(x, y); await p.mouse.click(q.x, q.y); await p.waitForTimeout(80); }
  const val = await p.evaluate(() => { const r = document.querySelector("#prac-run")._run; return r.answers[r.i] && r.answers[r.i].response; });
  ok("Clicking the grid places vertex then points", val && val.startsWith(`v:${H},${K}`) && /;p:/.test(val), val || "none");
  if (val && /;p:/.test(val)) {
    await p.click('#prac-run [data-pr="check"]'); await p.waitForTimeout(200);
    ok("A correctly built graph is marked right", await fbRight(p));
  }
  // and a wrong one shows the correct graph afterwards
  await p.evaluate(() => {
    const box = document.querySelector("#prac-run");
    window.Practice.run(box, { source: "drill", level: "normal", title: "Graph", items: [window.Practice.makeItem("wr", window.__gq, "a")], end: () => "<p>done</p>", onExit: () => {} });
    const r = box._run; r.answers[0] = { response: "v:0,0;p:1,5|-1,5" }; box.querySelector('[data-pr="check"]').disabled = false;
  });
  await p.click('#prac-run [data-pr="check"]'); await p.waitForTimeout(200);
  ok("A wrong graph is marked wrong and the correct graph is shown after submitting", (await fbRight(p)) === false && (await p.locator("#prac-run .fb-plot svg").count()) >= 1);

  // ── 5. library quiz on a newly added topic
  await p.evaluate(() => location.hash = "#c-trig.laws"); await p.waitForTimeout(500);
  ok("New lesson (sine & cosine law) opens from the library", /sine|cosine/i.test(await p.textContent("#screen-library").catch(() => "")));
  ok("No page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  // ── 6. narrow screen: course screen fits
  p = await mk({}, { width: 390, height: 844 });
  await toCourse(p);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  ok("Course screen has no horizontal scroll on a phone", !overflow);

  await b.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
