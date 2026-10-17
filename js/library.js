/*
 * CONCEPT LIBRARY — browse/search/filter lessons; each lesson follows one instructional structure:
 *   1 overview & big idea · 2 rules · 3 worked examples · 4 common mistakes · 5 connected concepts
 *   6 targeted practice · 7 mastery check & next review
 * The right-hand panel shows the student's own evidence for the concept (never invented).
 * Concept quizzes run on the shared Practice runner, so answers feed mastery, reviews and the notebook.
 */
(function () {
  "use strict";
  let A = null;
  let current = null;     // concept id on screen
  let mode = "lesson";    // "lesson" | "quiz"
  let query = "";
  let filter = "all";
  const LAST_QUIZ = "campfire-prep.lastquiz.v1";
  const COLLAPSE = "campfire-prep.libcollapsed";
  let this_narrow = () => false;

  function init(api) {
    A = api;
    const search = A.$("#lib-search");
    search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); renderNav(); });
    search.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const first = A.$("#lib-nav [data-concept]"); if (first) open(first.dataset.concept); }
    });
    A.$("#lib-nav").addEventListener("click", (e) => {
      const b = e.target.closest("[data-concept]");
      if (!b) return;
      open(b.dataset.concept);
      if (this_narrow()) { setCollapsed(true, true); A.$("#lib-main").scrollIntoView({ block: "start" }); }
    });
    A.$("#lib-filter").addEventListener("click", (e) => { const b = e.target.closest("[data-filter]"); if (b) { filter = b.dataset.filter; renderNav(); } });
    A.$("#lib-formulas").addEventListener("click", () => { openFormulas(); if (this_narrow()) setCollapsed(true, true); });
    A.$("#lib-main").addEventListener("input", (e) => { if (e.target.closest(".explorer")) updateExplorer(e.target.closest(".explorer")); });
    A.$("#lib-collapse").addEventListener("click", () => setCollapsed(!A.$("#lib").classList.contains("collapsed")));
    A.$("#lib-main").addEventListener("click", onMainClick);
    A.$("#lib-ctx").addEventListener("click", onMainClick);
    const narrow = () => window.matchMedia("(max-width: 900px)").matches;
    this_narrow = narrow;
    try { const saved = localStorage.getItem(COLLAPSE); setCollapsed(saved === null ? narrow() : saved === "1", true); } catch { setCollapsed(narrow(), true); }
  }
  function setCollapsed(on, quiet) {
    A.$("#lib").classList.toggle("collapsed", on);
    A.$("#lib-collapse").setAttribute("aria-expanded", String(!on));
    A.$("#lib-collapse").setAttribute("aria-label", on ? "Show the concept list" : "Hide the concept list");
    if (!quiet) try { localStorage.setItem(COLLAPSE, on ? "1" : "0"); } catch { /* ignore */ }
  }

  const C = () => window.Concepts;
  const lang = () => (window.I18N ? window.I18N.lang : "en");
  const titleOf = (c) => (lang() !== "en" && c.tr && c.tr[lang()] ? c.tr[lang()].title : c.title);
  const summaryOf = (c) => (lang() !== "en" && c.tr && c.tr[lang()] ? A.esc(c.tr[lang()].summary) : A.renderMath(c.summary));
  const S = () => window.Learning.STATUS;

  function matches(c, L) {
    if (filter !== "all") {
      const p = L.prof[c.id], grp = S()[p.status].group;
      if (filter === "attention" && grp !== "attention" && !(L.mistakeCounts[c.id] > 0)) return false;
      if (filter === "due" && !(p.schedule && p.schedule.isDue)) return false;
      if (filter === "new" && p.status !== "not_attempted") return false;
    }
    if (!query) return true;
    const hay = [c.title, c.summary, c.keywords.join(" "), c.explanation.join(" "), c.mistakes.map((m) => m.wrong + " " + m.fix).join(" ")].join(" ").toLowerCase();
    return query.split(/\s+/).every((w) => hay.includes(w));
  }

  function renderNav() {
    const L = A.learningState();
    for (const b of A.$$("#lib-filter [data-filter]")) { const on = b.dataset.filter === filter; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); }
    const html = C().UNITS.map((u) => {
      const cs = C().CONCEPTS.filter((c) => c.unit === u.id && matches(c, L));
      if (!cs.length) return "";
      return `<div class="lib-unit"><p class="lib-unit-title">${A.esc(u.title)}</p>${cs.map((c) => {
        const p = L.prof[c.id], st = S()[p.status];
        const due = p.schedule && p.schedule.isDue;
        return `<button type="button" class="lib-link${c.id === current ? " active" : ""}" data-concept="${c.id}" aria-current="${c.id === current ? "page" : "false"}" title="${A.esc(st.label)}${due ? " · review due" : ""}">
          <i class="dot-st st-${st.tone}" aria-hidden="true"></i><span class="lib-link-t">${A.esc(titleOf(c))}</span>${due ? `<span class="lib-due" aria-label="review due">↻</span>` : ""}${L.mistakeCounts[c.id] ? `<span class="lib-count" title="Open mistakes">${L.mistakeCounts[c.id]}</span>` : ""}</button>`;
      }).join("")}</div>`;
    }).join("");
    A.$("#lib-formulas").classList.toggle("active", current === "formulas");
    A.$("#lib-nav").innerHTML = html || `<p class="muted small lib-empty">${query ? `No concepts match “${A.esc(query)}”. Try “conjugate” or “exponent”.` : "Nothing here yet. Try another filter."}</p>`;
  }

  function open(id, opts = {}) {
    if (id === "formulas") return openFormulas();
    if (!id || !C().get(id)) id = current && current !== "formulas" ? current : C().CONCEPTS[0].id;
    current = id;
    try { if (location.hash !== `#c-${id}`) history.replaceState(null, "", `#c-${id}`); } catch { /* ignore */ }
    renderNav();
    if (opts.quiz) startQuiz(!!opts.harder); else { mode = "lesson"; window.Practice.stop(A.$("#lib-main")); renderLesson(); }
    if (window.Tutor) window.Tutor.contextChanged();
  }

  // ───────── lesson ─────────
  function renderLesson() {
    const c = C().get(current), unit = C().UNITS.find((u) => u.id === c.unit);
    const L = A.learningState();
    const p = L.prof[c.id], st = S()[p.status];
    const fb = (A.store.get(A.KEYS.feedback, {}))[c.id];
    const link = (id) => `<button type="button" class="concept-chip" data-concept-link="${id}"><i class="dot-st st-${S()[L.prof[id].status].tone}"></i>${A.esc(titleOf(C().get(id)))}</button>`;
    const quad = c.unit === "quadratics";
    const G = window.Graph;
    const myMistakes = L.mistakeCounts[c.id] || 0;
    A.$("#lib-main").innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><span>Pre-Calculus 11</span><span aria-hidden="true">/</span><span>${A.esc(unit.title)}</span><span aria-hidden="true">/</span><span class="crumb-here">${A.esc(titleOf(c))}</span></nav>
      <header class="lesson-head">
        <h1>${A.esc(titleOf(c))}</h1>
        <p class="lead">${summaryOf(c)}</p>
        ${lang() !== "en" ? `<p class="lang-note">${A.esc(window.I18N.t("lib.englishOnly"))}</p>` : ""}
        <div class="lesson-meta"><span class="level-pill st-${st.tone}">${A.esc(st.label)}</span><span class="meta-dot">Difficulty ${"●".repeat(c.difficulty || 1)}${"○".repeat(3 - (c.difficulty || 1))}</span><span class="meta-dot">~${Math.max(4, Math.round((c.explanation.join(" ").length + c.examples.length * 300) / 900) * 2)} min read</span></div>
      </header>

      <section class="lesson-sec" aria-labelledby="sec-1">
        <h2 id="sec-1"><span class="sec-n">1</span> Overview</h2>
        <aside class="callout idea"><span class="callout-k">The big idea</span><div>${A.renderMath(c.intuition)}</div></aside>
        ${c.graph && G ? `<figure class="lesson-graph">${G.svg({ ...c.graph, title: c.title })}</figure>` : ""}
        ${c.explanation.map((x) => `<p>${A.renderMath(x)}</p>`).join("")}
        ${c.explorer && G ? explorerHTML() : ""}
      </section>

      <section class="lesson-sec" aria-labelledby="sec-2">
        <h2 id="sec-2"><span class="sec-n">2</span> Key rules</h2>
        <div class="rules-grid">${c.rules.map((r) => `<div class="rule"><span class="rule-name">${A.esc(r.name)}</span><div class="rule-tex">${A.tex(r.tex, true)}</div></div>`).join("")}</div>
        ${c.notation && c.notation.length ? `<dl class="notation">${c.notation.map((n) => `<div><dt>${A.esc(n.sym)}</dt><dd>${A.esc(n.means)}</dd></div>`).join("")}</dl>` : ""}
        ${quad ? relatedFormulas(c.id) : ""}
      </section>

      <section class="lesson-sec" aria-labelledby="sec-3">
        <h2 id="sec-3"><span class="sec-n">3</span> Worked examples</h2>
        ${c.examples.map((ex, k) => `
        <details class="example"${k === 0 ? " open" : ""}>
          <summary><span class="ex-num">Example ${k + 1}</span><span class="ex-title">${A.renderMath(ex.title)}</span><span class="ex-toggle" aria-hidden="true"></span></summary>
          <ol class="ex-steps">${ex.steps.map((s2) => `<li><div>${A.renderMath(s2)}</div></li>`).join("")}</ol>
          <p class="ex-answer"><span class="cmp-label">Answer</span> ${A.renderMath(ex.answer)}</p>
        </details>`).join("")}
      </section>

      <section class="lesson-sec" aria-labelledby="sec-4">
        <h2 id="sec-4"><span class="sec-n">4</span> Common mistakes</h2>
        <ul class="mistakes">${c.mistakes.map((m) => `<li class="callout warn"><span class="mk-wrong"><b>Watch out:</b> ${A.esc(m.wrong)}</span><span class="mk-fix"><b>Instead:</b> ${A.esc(m.fix)}</span></li>`).join("")}</ul>
        ${c.strategies && c.strategies.length ? `<div class="callout tip"><span class="callout-k">Strategies</span><ul>${c.strategies.map((x) => `<li>${A.renderMath(x)}</li>`).join("")}</ul></div>` : ""}
      </section>

      ${c.prereqs.length || c.related.length ? `<section class="lesson-sec" aria-labelledby="sec-5">
        <h2 id="sec-5"><span class="sec-n">5</span> Connected concepts</h2>
        ${c.prereqs.length ? `<div class="conn"><span class="conn-k">Builds on</span><div class="conn-v">${c.prereqs.map(link).join("")}</div></div>` : ""}
        ${c.related.length ? `<div class="conn"><span class="conn-k">Related</span><div class="conn-v">${c.related.map(link).join("")}</div></div>` : ""}
      </section>` : ""}

      <section class="lesson-sec practice-block" aria-labelledby="sec-6">
        <h2 id="sec-6"><span class="sec-n">6</span> Practise it</h2>
        <p class="muted">${quad ? "Five freshly generated, checked questions, with hints and the worked explanation after each one." : "Five questions from the practice banks, with the worked explanation after each one."} Every answer updates your evidence and review schedule.</p>
        <div class="lesson-actions">
          <button class="btn btn-primary" data-act="quiz" type="button">Start 5 questions</button>
          <button class="btn btn-secondary" data-act="quiz-hard" type="button">Harder questions</button>
          ${myMistakes ? `<button class="btn btn-accent" data-go-review="${c.id}" type="button">Revisit my ${myMistakes} mistake${myMistakes === 1 ? "" : "s"}</button>` : ""}
        </div>
      </section>

      <section class="lesson-sec" aria-labelledby="sec-7">
        <h2 id="sec-7"><span class="sec-n">7</span> Mastery check</h2>
        ${masteryChecklist(p)}
        <p class="muted small">${A.esc(window.Learning.scheduleText(p.schedule))}</p>
      </section>

      <footer class="lesson-foot">
        <div class="fb" id="lesson-fb">
          <span>Was this lesson helpful?</span>
          <button class="btn btn-secondary btn-sm" data-fb="helpful" type="button">Helpful</button>
          <button class="btn btn-secondary btn-sm" data-fb="confusing" type="button">Confusing</button>
          ${fb ? `<span class="muted small">You voted ${fb.helpful ? `helpful ×${fb.helpful}` : ""}${fb.helpful && fb.confusing ? ", " : ""}${fb.confusing ? `confusing ×${fb.confusing}` : ""}.</span>` : ""}
        </div>
        <p class="faint small">${A.esc(c.source)} Version ${c.version}.${quad ? "" : " Practice questions include ones from Tim's Test (credit: Tim)."}</p>
      </footer>`;
    renderCtx(L);
    const ex = A.$("#lib-main .explorer"); if (ex) updateExplorer(ex);
    A.$("#lib-main").scrollTop = 0;
  }

  // ───────── interactive a, h, k explorer (vertex form) ─────────
  function explorerHTML() {
    const t = (k) => (window.I18N ? window.I18N.t(k) : k);
    const sl = (n, min, max, val) => `<label class="ex-sl"><span class="ex-k">${n}</span><input type="range" min="${min}" max="${max}" step="0.5" value="${val}" data-p="${n}" aria-label="${n}" /><output data-o="${n}">${val}</output></label>`;
    return `<section class="explorer glass" aria-label="${A.esc(t("lib.explorer"))}">
      <h3>${A.esc(t("lib.explorer"))}</h3>
      <div class="ex-grid"><div class="ex-controls">${sl("a", -3, 3, 1)}${sl("h", -5, 5, 2)}${sl("k", -5, 5, -1)}<div class="ex-eq" aria-live="polite"></div><p class="ex-facts small muted"></p></div><div class="ex-graph"></div></div>
    </section>`;
  }
  function updateExplorer(el) {
    const v = (n) => Number(el.querySelector(`[data-p="${n}"]`).value);
    let a = v("a"); if (a === 0) { a = 0.5; el.querySelector('[data-p="a"]').value = 0.5; }
    const h = v("h"), k = v("k");
    for (const n of ["a", "h", "k"]) el.querySelector(`[data-o="${n}"]`).textContent = String(n === "a" ? a : v(n));
    const M = window.QuadMath, F = (x) => M.fparse(String(x));
    el.querySelector(".ex-eq").innerHTML = A.tex(M.vertexTeX({ a: F(a), h: F(h), k: F(k) }), true);
    el.querySelector(".ex-facts").textContent = `Vertex (${h}, ${k}) · axis x = ${h} · opens ${a > 0 ? "up (minimum " + k + ")" : "down (maximum " + k + ")"} · ${Math.abs(a) > 1 ? "narrower than y = x²" : Math.abs(a) < 1 ? "wider than y = x²" : "same width as y = x²"}`;
    el.querySelector(".ex-graph").innerHTML = window.Graph.svg({ fns: [{ a: 1, h: 0, k: 0 }, { a, h, k }], styles: ["dashed", ""], labels: ["y = x²", ""], marks: { vertex: true, axis: true }, window: { x0: -8, x1: 8, y0: -8, y1: 8 }, title: `Parabola y = ${a}(x − ${h})² + ${k}` });
  }

  // ───────── formula reference ─────────
  function formulaCard(f, L) {
    return `<article class="formula glass" id="f-${f.id}">
      <header><h3>${A.esc(f.name)}</h3></header>
      <div class="f-tex">${A.tex(f.tex, true)}</div>
      <dl class="f-sym">${f.symbols.map(([sym, m]) => `<div><dt>${A.esc(sym)}</dt><dd>${A.esc(m)}</dd></div>`).join("")}</dl>
      <p><b>When it's useful:</b> ${A.esc(f.when)}</p>
      <p><b>Conditions:</b> ${A.esc(f.conditions)}</p>
      <p class="f-ex"><b>Example:</b> ${A.renderMath(f.example)}</p>
      <div class="conn-v">${f.related.map((id) => `<button type="button" class="concept-chip" data-concept-link="${id}"><i class="dot-st st-${S()[L.prof[id].status].tone}"></i>${A.esc(titleOf(C().get(id)))}</button>`).join("")}</div>
    </article>`;
  }
  function relatedFormulas(id) {
    const fs = (C().FORMULAS || []).filter((f) => f.related.includes(id));
    return fs.length ? `<p class="small"><b>Formula reference:</b> ${fs.map((f) => `<button type="button" class="btn-inline" data-formula="${f.id}">${A.esc(f.name)}</button>`).join(" · ")}</p>` : "";
  }
  function openFormulas(focusId) {
    mode = "lesson";
    current = "formulas";
    window.Practice.stop(A.$("#lib-main"));
    try { if (location.hash !== "#c-formulas") history.replaceState(null, "", "#c-formulas"); } catch { /* ignore */ }
    renderNav();
    const L = A.learningState();
    const t = (k) => (window.I18N ? window.I18N.t(k) : k);
    A.$("#lib-main").innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb"><span>Pre-Calculus 11</span><span aria-hidden="true">/</span><span>Quadratic Functions</span><span aria-hidden="true">/</span><span class="crumb-here">${A.esc(t("lib.formulas"))}</span></nav>
      <header class="lesson-head"><h1>${A.esc(t("lib.formulas"))}</h1><p class="lead">Every formula in the quadratics unit: what each symbol means, when to use it, its limits, and a worked example.</p>${lang() !== "en" ? `<p class="lang-note">${A.esc(t("lib.englishOnly"))}</p>` : ""}</header>
      <div class="formula-grid">${(C().FORMULAS || []).map((f) => formulaCard(f, L)).join("")}</div>`;
    A.$("#lib-ctx").innerHTML = `<nav class="ctx-card ctx-toc" aria-label="Formulas"><p class="ctx-k">${A.esc(t("lib.formulas"))}</p>${(C().FORMULAS || []).map((f) => `<a href="#f-${f.id}" data-toc="f-${f.id}">${A.esc(f.name)}</a>`).join("")}</nav>`;
    if (focusId) { const el = document.getElementById("f-" + focusId); if (el) el.scrollIntoView({ block: "start" }); } else A.$("#lib-main").scrollTop = 0;
    if (window.Tutor) window.Tutor.contextChanged();
  }

  // The four conditions for "Confident", shown honestly with what's done and what's missing.
  function masteryChecklist(p) {
    const items = [
      { ok: p.questions >= 3 && p.sessions >= 2, t: `At least 3 answers over 2 separate sessions <span class="faint">(${p.questions} answer${p.questions === 1 ? "" : "s"}, ${p.sessions} session${p.sessions === 1 ? "" : "s"})</span>` },
      { ok: p.distinct >= 3, t: `Right on 3 different questions <span class="faint">(${p.distinct} different so far)</span>` },
      { ok: p.accuracy !== null && p.accuracy >= 0.85 && (p.recentAccuracy === null || p.recentAccuracy >= 0.8), t: `About 85% overall and 80% recently <span class="faint">(${p.max ? `${p.earned}/${p.max} marks` : "no marks yet"})</span>` },
      { ok: p.retrievals >= 1, t: "A good session at least 2 days after the previous one (shows it stuck)" },
    ];
    return `<ul class="checklist">${items.map((x) => `<li class="${x.ok ? "ok" : ""}"><span class="ck" aria-hidden="true">${x.ok ? "✓" : ""}</span><span>${x.t}</span><span class="sr-only">${x.ok ? "done" : "not yet"}</span></li>`).join("")}</ul>`;
  }

  // Right-hand context panel: the student's own evidence for this concept
  function renderCtx(L) {
    const c = C().get(current), p = L.prof[c.id], st = S()[p.status];
    const ms = L.mistakes.filter((m) => m.concepts.includes(c.id) && !m.fixed && !m.understood);
    A.$("#lib-ctx").innerHTML = `
      <div class="ctx-card">
        <p class="ctx-k">Your evidence</p>
        <span class="level-pill st-${st.tone}">${A.esc(st.label)}</span>
        <p class="ctx-why">${A.esc(window.Learning.explain(p))}</p>
        <dl class="ctx-stats">
          <div><dt>Answers</dt><dd>${p.questions}</dd></div>
          <div><dt>Sessions</dt><dd>${p.sessions}</dd></div>
          <div><dt>Different Qs</dt><dd>${p.distinct}</dd></div>
        </dl>
        <p class="ctx-sched"><span aria-hidden="true">↻</span> ${A.esc(window.Learning.scheduleText(p.schedule))}</p>
        <button class="btn btn-quiet btn-sm btn-block" data-inspect="${c.id}" type="button">See the answers behind this</button>
      </div>
      ${ms.length ? `<div class="ctx-card"><p class="ctx-k">Mistake Notebook</p><p class="small">${ms.length} open mistake${ms.length === 1 ? "" : "s"} on this concept${ms.filter((m) => m.isDue).length ? `, ${ms.filter((m) => m.isDue).length} due for a retry` : ""}.</p><button class="btn btn-secondary btn-sm btn-block" data-go-review="${c.id}" type="button">Open in Review</button></div>` : ""}
      <div class="ctx-card">
        <p class="ctx-k">Stuck?</p>
        <button class="btn btn-secondary btn-sm btn-block" data-act="tutor" type="button">✦ Ask the tutor about this lesson</button>
      </div>
      <nav class="ctx-card ctx-toc" aria-label="On this page"><p class="ctx-k">On this page</p>
        ${["Overview", "Key rules", "Worked examples", "Common mistakes", c.prereqs.length || c.related.length ? "Connected concepts" : null, "Practise it", "Mastery check"].map((t, k) => t ? `<a href="#sec-${k + 1}" data-toc="sec-${k + 1}">${t}</a>` : "").join("")}
      </nav>`;
  }

  // ───────── concept quiz (shared Practice runner) ─────────
  function poolFor(id, harder) {
    // every concept now draws from the question engine: generator families plus the authored set for that concept,
    // at a fixed difficulty, avoiding questions this learner has seen recently (js/engine/bank.js)
    if (window.Bank) {
      const got = window.Bank.select({ concept: id, mode: harder ? "challenge" : "normal", n: 5 });
      const pool = got.items.map(({ kind, q, part }) => { A.BANKS[kind].set(q.id, q); return [kind, q, part]; });
      return { pool, mixed: false, revisits: got.revisits || 0, unavailable: got.unavailable };
    }
    const tagged = (arr) => arr.filter((q) => C().conceptsFor(q).includes(id));
    const mc = harder ? A.CHMC() : A.MC(), nr = harder ? A.CHNR() : A.NR();
    return { pool: [...tagged(mc).map((q) => ["mc", q]), ...tagged(nr).map((q) => ["nr", q])], mixed: false };
  }

  function startQuiz(harder) {
    mode = "quiz";
    const { pool, mixed, revisits } = poolFor(current, harder);
    const pick = pool.slice(0, 5);
    const store = A.store.get(LAST_QUIZ, {}); store[current] = pick.map(([, q]) => q.id); A.store.set(LAST_QUIZ, store);
    const c = C().get(current);
    const items = pick.map(([k, q, part]) => window.Practice.makeItem(k, q, part || undefined)).filter(Boolean);
    if (!items.length) return;
    const repeated = revisits || 0;
    window.Practice.run(A.$("#lib-main"), {
      source: "quiz", level: harder ? "challenge" : "normal", hintPolicy: harder ? "one" : "steps", crumb: `Concept quiz${harder ? " · harder" : ""}`, title: titleOf(c),
      items, exitLabel: "Back to lesson",
      onExit: () => { mode = "lesson"; window.Practice.stop(A.$("#lib-main")); renderNav(); renderLesson(); if (window.Tutor) window.Tutor.contextChanged(); },
      onChecked: () => renderNav(),
      onAct: (act) => { if (act === "again") startQuiz(false); if (act === "harder") startQuiz(true); },
      end: (r) => quizEnd(r, c, harder, mixed, repeated),
    });
    renderCtx(A.learningState());
  }

  function quizEnd(r, c, harder, mixed, repeated) {
    const s = window.Practice.summary(r);
    const p = A.learningState().prof[c.id], st = S()[p.status];
    renderNav(); renderCtx(A.learningState());
    const good = s.right >= Math.ceil(s.n * 0.8);
    return `<div class="pr">
      <p class="eyebrow">Concept quiz · ${A.esc(c.title)}</p>
      <h1>${s.right} of ${s.n} correct</h1>
      <p class="lead">${good ? "Good evidence that this is clicking. It's now scheduled for a spaced review, which is what moves it toward Confident." : "This one needs another look. Your misses were saved to the Mistake Notebook, so you can retry them later."}</p>
      <div class="result-strip"><div><span class="rs-k">This quiz</span><span class="rs-v">${s.right}/${s.n}</span></div><div><span class="rs-k">Status now</span><span class="level-pill st-${st.tone}">${A.esc(st.label)}</span></div><div><span class="rs-k">Next review</span><span class="rs-v small">${A.esc(window.Learning.scheduleText(p.schedule))}</span></div></div>
      ${harder ? `<p class="faint small">Harder (Challenge) answers count as extra variety, but never lower your accuracy.${mixed ? " There weren't five Challenge questions on this concept, so some were Normal-level." : ""}</p>` : ""}
      ${window.Practice.reviewList(r)}
      <div class="lesson-actions">
        <button class="btn btn-primary" data-pr="again" type="button">Try 5 different questions</button>
        ${good ? `<button class="btn btn-secondary" data-pr="harder" type="button">Try harder questions</button>` : `<button class="btn btn-secondary" data-pr="exit" type="button">Back to the lesson</button>`}
        <button class="btn btn-quiet" data-go="learning" type="button">See my study plan</button>
      </div>
      ${repeated > 0 ? `<p class="faint small">This concept has a limited question bank, so ${repeated} question${repeated > 1 ? "s were" : " was"} repeated from your last quiz.</p>` : ""}
    </div>`;
  }

  function onMainClick(e) {
    const link = e.target.closest("[data-concept-link]");
    if (link) return open(link.dataset.conceptLink);
    const fl = e.target.closest("[data-formula]");
    if (fl) return openFormulas(fl.dataset.formula);
    const toc = e.target.closest("[data-toc]");
    if (toc) { e.preventDefault(); const t = document.getElementById(toc.dataset.toc); if (t) t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); return; }
    const insp = e.target.closest("[data-inspect]");
    if (insp) return window.Analyst.inspect(insp.dataset.inspect);
    const rv = e.target.closest("[data-go-review]");
    if (rv) { A.go("review"); return window.Review.filterConcept(rv.dataset.goReview); }
    const fb = e.target.closest("[data-fb]");
    if (fb) {
      const all = A.store.get(A.KEYS.feedback, {});
      const f = all[current] || { helpful: 0, confusing: 0 };
      f[fb.dataset.fb]++; f.last = Date.now(); all[current] = f; A.store.set(A.KEYS.feedback, all);
      A.$("#lesson-fb").innerHTML = fb.dataset.fb === "helpful"
        ? `<span>Thanks! Glad it helped.</span>`
        : `<span>Thanks for telling us. This concept will rank higher in your study plan.</span> <button class="btn btn-secondary btn-sm" data-act="tutor-simpler" type="button">Ask the tutor to explain it differently</button>`;
      return;
    }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const a = act.dataset.act, c = C().get(current);
    if (a === "quiz") startQuiz(false);
    else if (a === "quiz-hard") startQuiz(true);
    else if (a === "tutor") window.Tutor.open({ mode: "explain" });
    else if (a === "tutor-simpler") window.Tutor.open({ mode: "explain", prompt: `I found the lesson on ${c.title} confusing. Can you explain it more simply, with a different example?`, send: true });
  }

  // Structured page context for the tutor
  function context() {
    if (current === "formulas") return { type: "formula_reference", title: "Formula reference (quadratics)", text: (C().FORMULAS || []).map((f) => `${f.name}: \\(${f.tex}\\). When: ${f.when} Conditions: ${f.conditions}`).join("\n"), concepts: [] };
    const c = C().get(current || C().CONCEPTS[0].id);
    const lessonText = [
      `Summary: ${c.summary}`, `Big idea: ${c.intuition}`, `Explanation: ${c.explanation.map(A.texPlain).join(" ")}`,
      `Rules: ${c.rules.map((r) => `${r.name}: \\(${r.tex}\\)`).join("; ")}`,
      ...c.examples.map((ex, k) => `Example ${k + 1} (${A.texPlain(ex.title)}): ${ex.steps.map(A.texPlain).join(" ")} Answer: ${A.texPlain(ex.answer)}`),
      `Common mistakes: ${c.mistakes.map((m) => `WRONG: ${m.wrong} FIX: ${m.fix}`).join(" | ")}`,
    ].join("\n");
    const ctx = { type: mode === "quiz" ? "concept_quiz" : "concept_lesson", title: `Concept Library lesson: ${c.title}`, text: lessonText, concepts: [c.id] };
    if (mode === "quiz") { const pc = window.Practice.context(); if (pc) ctx.focus = pc.focus; }
    return ctx;
  }

  window.Library = { init, open, context, renderNav, checklist: masteryChecklist, get current() { return current; } };
})();
