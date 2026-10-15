/*
 * MY LEARNING — the Personal Learning Analyst dashboard, organised around one question:
 *   "What should I do next, and why?"
 * Everything here is computed from real records (js/learning.js): the next action, status counts,
 * the today plan, the adaptive exam plan, and the concept profile. The optional AI step only
 * interprets this evidence; it never supplies numbers.
 */
(function () {
  "use strict";
  let A = null;
  let budget = 30;
  let planTab = "today";       // "today" | "exam"
  let showAllDays = false;
  let profFilter = "all";      // all | attention | progress | mastered | unknown
  let sort = { key: "unit", dir: 1 };
  let selectedDoc = null;
  let docsCache = [];
  let uploads = [];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function init(api) {
    A = api;
    const body = A.$("#ml-body");
    body.addEventListener("click", onClick);
    body.addEventListener("change", onChange);
    body.addEventListener("dragover", (e) => { const z = e.target.closest(".dropzone"); if (z) { e.preventDefault(); z.classList.add("over"); } });
    body.addEventListener("dragleave", (e) => { const z = e.target.closest(".dropzone"); if (z) z.classList.remove("over"); });
    body.addEventListener("drop", (e) => { const z = e.target.closest(".dropzone"); if (z) { e.preventDefault(); z.classList.remove("over"); handleFiles(e.dataTransfer.files); } });
    A.$("#sheet-body").addEventListener("click", (e) => { if (e.target.closest("[data-lesson], [data-quiz], [data-go]")) A.closeSheet(); });
  }

  const C = () => window.Concepts;
  const S = () => window.Learning.STATUS;
  const ago = (ts) => { if (!ts) return "—"; const d = Math.floor((Date.now() - ts) / 86400000); return d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };
  const examOf = (L) => ({ date: "", units: [], minutesPerDay: 30, days: [], priorities: [], ...(L.exam || {}) });
  const saveExam = (patch) => { const cur = { date: "", units: [], minutesPerDay: 30, days: [], priorities: [], ...A.store.get(A.KEYS.exam, {}) }; A.store.set(A.KEYS.exam, { ...cur, ...patch }); };
  const daysUntil = (date) => (date ? Math.round((window.Learning.startOfDay(new Date(date + "T00:00").getTime()) - window.Learning.startOfDay(Date.now())) / 86400000) : null);

  async function render() {
    docsCache = await window.Docs.list().catch(() => []);
    const L = A.learningState();
    const has = L.records.length > 0;
    A.$("#ml-sources").innerHTML = has
      ? `From <b>${L.tests}</b> test${L.tests === 1 ? "" : "s"} and <b>${L.quizAnswers}</b> practice answer${L.quizAnswers === 1 ? "" : "s"} saved in this browser.${L.skippedBlanks ? " Blank answers from mostly-empty tests aren't counted." : ""} Nothing is sent anywhere unless you ask the tutor.`
      : "Built only from your own test and practice answers, saved in this browser.";
    A.$("#ml-body").innerHTML = `
      ${hero(L, has)}
      ${has ? summaryCards(L) : ""}
      <div class="ml-grid">
        <section class="card plan-card" aria-labelledby="plan-h">
          <div class="card-head">
            <h2 id="plan-h">Study plan</h2>
            <div class="segmented small-seg" role="tablist" aria-label="Plan view">
              <button type="button" role="tab" data-tab="today" class="${planTab === "today" ? "active" : ""}" aria-selected="${planTab === "today"}">Today</button>
              <button type="button" role="tab" data-tab="exam" class="${planTab === "exam" ? "active" : ""}" aria-selected="${planTab === "exam"}">Until the exam</button>
            </div>
          </div>
          ${planTab === "today" ? todayPlan(L, has) : examPlanHTML(L, has)}
          ${has ? `<div class="ai-row"><button class="btn btn-accent btn-sm" data-act="ai-analyst" type="button">✦ Ask the AI analyst to interpret this</button><span class="faint small">Shares this page's summary numbers with the tutor for that conversation. Not your answers or files.</span></div>` : ""}
        </section>
        ${settingsCard(L)}
      </div>
      ${profileCard(L)}
      ${docsCard(L)}`;
  }

  // ───────── 1. next action ─────────
  function hero(L, has) {
    const exam = examOf(L), dl = daysUntil(exam.date);
    const examBox = exam.date
      ? `<div class="hero-exam"><span class="he-k">Exam</span><span class="he-v">${dl > 0 ? `${dl} day${dl === 1 ? "" : "s"}` : dl === 0 ? "Today" : "Passed"}</span><span class="faint small">${new Date(exam.date + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${exam.units.length ? exam.units.map((u) => A.esc(C().UNITS.find((x) => x.id === u).title)).join(", ") : "scope not set"}</span></div>`
      : `<div class="hero-exam empty"><span class="he-k">Exam</span><button class="btn btn-quiet btn-sm" data-focus="ml-exam" type="button">Set your exam date</button></div>`;
    if (!has) {
      return `<section class="card hero" aria-label="Next step"><div class="hero-main">
        <p class="eyebrow">Start here</p><h2 class="hero-title">No learning records yet</h2>
        <p class="muted">Your plan appears once you've answered some questions, so nothing here is guessed. Two good ways to start:</p>
        <div class="lesson-actions"><button class="btn btn-primary" data-act="diagnostic" type="button">Take Tim's Test as a diagnostic</button><button class="btn btn-secondary" data-go="library" type="button">Try a concept quiz</button></div>
      </div>${examBox}</section>`;
    }
    const reviewN = window.Review.sessionPlan(L).length;
    let main;
    if (reviewN) {
      main = `<p class="eyebrow">Next up</p><h2 class="hero-title">Today's review: ${reviewN} question${reviewN === 1 ? "" : "s"}</h2>
        <p class="muted">${L.dueConcepts.length ? `${L.dueConcepts.length} concept${L.dueConcepts.length === 1 ? " is" : "s are"} due for spaced review` : ""}${L.dueConcepts.length && L.dueMistakes.length ? " and " : ""}${L.dueMistakes.length ? `${L.dueMistakes.length} mistake${L.dueMistakes.length === 1 ? " is" : "s are"} ready to retry` : ""}. Reviews done on time are what move a concept to Confident.</p>
        <div class="lesson-actions"><button class="btn btn-primary" data-go="review" type="button">Start today's review</button>${L.recs[0] ? `<span class="faint small">Then: ${A.esc(L.recs[0].title)}</span>` : ""}</div>`;
    } else if (L.recs[0] && L.recs[0].status !== "confident") {
      const r = L.recs[0];
      main = `<p class="eyebrow">Next up</p><h2 class="hero-title">${A.esc(r.title)} <span class="level-pill st-${r.tone}">${A.esc(r.label)}</span></h2>
        <p class="muted">${A.esc(r.why)} ${r.extra.map(A.esc).join(" ")}</p>
        <div class="lesson-actions">${r.activity !== "quiz" ? `<button class="btn btn-primary" data-lesson="${r.concept}" type="button">Open the lesson</button><button class="btn btn-secondary" data-quiz="${r.concept}" type="button">Quiz (5 questions)</button>` : `<button class="btn btn-primary" data-quiz="${r.concept}" type="button">Take a 5-question quiz</button>`}<span class="faint small">≈ ${r.minutes} min · ${A.esc(r.verify)}</span></div>`;
    } else {
      main = `<p class="eyebrow">Next up</p><h2 class="hero-title">You're in good shape</h2><p class="muted">Nothing in your records needs work right now. A timed practice test is a good check, or try a harder quiz.</p><div class="lesson-actions"><button class="btn btn-primary" data-go="home" type="button">Go to Basecamp</button></div>`;
    }
    return `<section class="card hero" aria-label="Next step"><div class="hero-main">${main}</div>${examBox}</section>`;
  }

  // ───────── 2. summary ─────────
  function summaryCards(L) {
    const groups = { attention: [], progress: [], mastered: [], unknown: [] };
    for (const c of C().CONCEPTS) groups[S()[L.prof[c.id].status].group].push(c);
    const card = (key, title, tone, hint) => `<button type="button" class="sum-card ${profFilter === key ? "active" : ""}" data-pf="${key}" aria-pressed="${profFilter === key}">
      <span class="sum-k"><i class="dot-st st-${tone}"></i>${title}</span><span class="sum-v">${groups[key].length}</span>
      <span class="sum-list">${groups[key].length ? groups[key].slice(0, 2).map((c) => A.esc(c.title)).join(", ") + (groups[key].length > 2 ? ` +${groups[key].length - 2}` : "") : hint}</span></button>`;
    return `<div class="sum-row" role="group" aria-label="Concepts by status (filters the profile below)">
      ${card("attention", "Needs attention", "low", "None right now")}
      ${card("progress", "In progress", "mid", "None yet")}
      ${card("mastered", "Confident", "good", "Needs varied answers and a review after a gap")}
      ${card("unknown", "Not enough evidence", "none", "—")}
    </div>`;
  }

  // ───────── 3a. today plan ─────────
  function todayPlan(L, has) {
    if (!has) return `<p class="empty-note">Your ranked plan appears here once you have some results.</p>`;
    const p = window.Learning.plan(L.recs.filter((r) => r.status !== "not_attempted" || L.docConcepts.has(r.concept) || (examOf(L).priorities || []).includes(r.concept)), budget);
    const reviewN = window.Review.sessionPlan(L).length;
    return `<div class="plan-tools"><span class="faint small">Time I have</span>
        <div class="segmented small-seg" role="radiogroup" aria-label="Time available">${[10, 30, 60, 90].map((m) => `<button type="button" role="radio" data-budget="${m}" class="${m === budget ? "active" : ""}" aria-checked="${m === budget}">${m} min</button>`).join("")}</div></div>
      ${reviewN ? `<div class="plan-item review-first"><div class="plan-top"><span class="focus-rank">↻</span><span class="focus-name">Today's review</span><span class="plan-time">${reviewN} question${reviewN === 1 ? "" : "s"} · do this first</span></div><div class="focus-actions"><button class="btn btn-secondary btn-sm" data-go="review" type="button">Open Review</button></div></div>` : ""}
      ${p.items.length ? `<ol class="plan-list">${p.items.map((r, k) => `
        <li class="plan-item${r.doneToday ? " done" : ""}">
          <div class="plan-top"><span class="focus-rank">${k + 1}</span><span class="focus-name">${A.esc(r.title)}</span><span class="level-pill st-${r.tone}">${A.esc(r.label)}</span><span class="plan-time">≈ ${r.minutes} min · ${r.step === "quiz" ? "Quiz" : "Lesson + quiz"}</span></div>
          <p class="plan-why"><b>Why:</b> ${A.esc(r.why)} ${r.extra.map(A.esc).join(" ")}</p>
          <p class="plan-verify"><b>How you'll know:</b> ${A.esc(r.verify)}</p>
          <div class="focus-actions">
            ${r.step !== "quiz" ? `<button class="btn btn-secondary btn-sm" data-lesson="${r.concept}" type="button">Open lesson</button>` : ""}
            <button class="btn btn-secondary btn-sm" data-quiz="${r.concept}" type="button">Start quiz</button>
            <button class="btn btn-quiet btn-sm" data-ask="${r.concept}" type="button">✦ Ask the tutor</button>
            <button class="btn btn-link btn-sm" data-done="${r.concept}" type="button">${r.doneToday ? "Done today ✓" : "Mark done"}</button>
          </div>
        </li>`).join("")}</ol><p class="faint small">Ranked by your evidence. Times are estimates; this fits about ${p.used} of your ${budget} minutes.</p>` : `<p class="empty-note">Nothing in your records needs work right now. Try a concept you haven't started, or a harder quiz.</p>`}`;
  }

  // ───────── 3b. adaptive exam plan ─────────
  function examPlanHTML(L, has) {
    const exam = examOf(L);
    if (!exam.date) return `<div class="empty-state small-es"><h3>Add your exam date</h3><p class="muted">Set the date, the units on the exam and how much time you have each day (on the right). The plan then schedules reviews, weak concepts and a final practice test, and re-plans from today whenever your results change or you miss a day.</p><button class="btn btn-secondary btn-sm" data-focus="ml-exam" type="button">Set the exam date</button></div>`;
    if (!has) return `<p class="empty-note">The exam plan needs some results first. Take Tim's Test as a diagnostic, then come back.</p>`;
    const plan = window.Learning.examPlan({ prof: L.prof, recs: L.recs, concepts: C().CONCEPTS, unitOf: L.unitOf, exam, docConcepts: L.docConcepts, mistakesDue: L.dueMistakes.length });
    const done = A.store.get(A.KEYS.done, {});
    const scopeTag = (s) => s === "inferred" ? `<span class="scope-tag inferred" title="Suggested because it appears in an uploaded file. Not confirmed as on the exam.">from your file</span>` : s === "known" ? `<span class="scope-tag known" title="In a unit you said is on the exam">on your exam</span>` : "";
    const fmt = (d) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    return `<p class="faint small">Re-planned from today using your latest results${plan.daysLeft !== null ? ` · ${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"} to go` : ""} · ${plan.perDay} min per study day. It can't promise a grade; it puts your time where the evidence says it matters most.</p>
      ${plan.notes.map((n) => `<p class="callout note small">${A.esc(n)}</p>`).join("")}
      <ol class="exam-days">${plan.days.slice(0, showAllDays ? 99 : 4).map((d, k) => `
        <li class="exam-day${k === 0 ? " today" : ""}">
          <div class="ed-head"><span class="ed-date">${k === 0 && window.Learning.startOfDay(Date.now()) === d.date ? "Today" : fmt(d.date)}</span><span class="faint small">${d.used} min${d.daysToExam !== null ? ` · ${d.daysToExam} day${d.daysToExam === 1 ? "" : "s"} before` : ""}</span></div>
          ${d.tasks.length ? `<ul class="ed-tasks">${d.tasks.map((t) => {
            const isDone = t.concept && done[t.concept] && window.Learning.startOfDay(done[t.concept]) === d.date;
            const action = t.type === "review" ? `<button class="btn btn-quiet btn-sm" data-go="review" type="button">Open</button>` : t.type === "test" ? `<button class="btn btn-quiet btn-sm" data-go="home" type="button">Basecamp</button>` : t.type === "lesson" ? `<button class="btn btn-quiet btn-sm" data-lesson="${t.concept}" type="button">Lesson</button>` : `<button class="btn btn-quiet btn-sm" data-quiz="${t.concept}" type="button">Quiz</button>`;
            return `<li class="ed-task t-${t.type}${isDone ? " done" : ""}"><span class="ed-ico" aria-hidden="true">${{ review: "↻", test: "◷", lesson: "▤", quiz: "✓" }[t.type]}</span>
              <span class="ed-main"><span class="ed-title">${A.esc(t.title)}</span> ${t.label ? `<span class="level-pill st-${t.tone}">${A.esc(t.label)}</span>` : ""} ${scopeTag(t.scope)}<span class="ed-why faint small">${A.esc(t.detail || "")}${t.why ? ` — ${A.esc(t.why)}` : ""}</span></span>
              <span class="ed-min faint small">${t.minutes} min</span>${k === 0 ? action : ""}</li>`;
          }).join("")}</ul>` : `<p class="faint small">Free day: nothing scheduled.</p>`}
        </li>`).join("")}</ol>
      ${plan.days.length > 4 ? `<button class="btn btn-quiet btn-sm" data-alldays type="button">${showAllDays ? "Show fewer days" : `Show all ${plan.days.length} days`}</button>` : ""}`;
  }

  // ───────── settings ─────────
  function settingsCard(L) {
    const exam = examOf(L);
    const pr = exam.priorities || [];
    return `<aside class="card exam-card" aria-labelledby="exam-h">
      <h2 id="exam-h">Exam &amp; schedule</h2>
      <div class="field"><label class="field-label" for="ml-exam">Exam date</label><input class="text-input" type="date" id="ml-exam" value="${A.esc(exam.date || "")}" /></div>
      <div class="field"><span class="field-label">Units on the exam</span>
        <div class="unit-checks">${C().UNITS.map((u) => `<label class="check"><input type="checkbox" data-unit="${u.id}" ${!exam.units.length || exam.units.includes(u.id) ? "checked" : ""}/> ${A.esc(u.title)}</label>`).join("")}</div>
        <span class="field-hint">${exam.units.length ? "Only these units are planned as “on your exam”." : "All checked = scope not set. Untick units that aren't on the exam."}</span>
      </div>
      <div class="field"><span class="field-label">Minutes per study day</span>
        <div class="segmented small-seg" role="radiogroup" aria-label="Minutes per day">${[15, 30, 45, 60, 90].map((m) => `<button type="button" role="radio" data-mpd="${m}" class="${Number(exam.minutesPerDay) === m ? "active" : ""}" aria-checked="${Number(exam.minutesPerDay) === m}">${m}</button>`).join("")}</div>
      </div>
      <div class="field"><span class="field-label">Study days</span>
        <div class="day-toggles" role="group" aria-label="Study days">${[1, 2, 3, 4, 5, 6, 0].map((d) => { const on = !exam.days.length || exam.days.includes(d); return `<button type="button" data-day="${d}" class="day-t${on ? " on" : ""}" aria-pressed="${on}">${DAYS[d]}</button>`; }).join("")}</div>
      </div>
      <div class="field"><span class="field-label">Your priorities</span>
        <span class="field-hint">${pr.length ? pr.map((id) => `<button class="concept-chip" data-star="${id}" type="button" title="Remove priority">★ ${A.esc(C().get(id).title)}</button>`).join(" ") : "Star concepts in the profile below to plan them sooner."}</span>
      </div>
    </aside>`;
  }

  // ───────── 4. concept profile ─────────
  function profileCard(L) {
    const pr = examOf(L).priorities || [];
    const rows = C().CONCEPTS.map((c, idx) => ({ c, idx, p: L.prof[c.id] })).filter(({ p }) => profFilter === "all" || S()[p.status].group === profFilter);
    const ord = { needs_work: 0, early_warning: 1, review_due: 2, developing: 3, improving: 4, consolidating: 5, confident: 6, insufficient: 7, not_attempted: 8 };
    const key = {
      unit: (r) => r.idx, name: (r) => r.c.title.toLowerCase(), status: (r) => ord[r.p.status],
      evidence: (r) => r.p.questions, next: (r) => (r.p.schedule.due === null ? Infinity : r.p.schedule.due), last: (r) => -(r.p.lastPractised || 0),
    }[sort.key];
    rows.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : a.idx - b.idx) * sort.dir);
    const th = (k, t) => `<th scope="col"><button type="button" class="th-sort${sort.key === k ? " on" : ""}" data-sort="${k}" aria-sort="${sort.key === k ? (sort.dir > 0 ? "ascending" : "descending") : "none"}">${t}${sort.key === k ? (sort.dir > 0 ? " ↑" : " ↓") : ""}</button></th>`;
    const nextTxt = (sc) => (sc.due === null ? "—" : sc.overdueDays > 0 ? `<span class="od">${sc.overdueDays}d overdue</span>` : sc.overdueDays === 0 ? `<span class="od">today</span>` : `in ${-sc.overdueDays}d`);
    return `<section class="card" aria-labelledby="prof-h">
      <div class="card-head"><div><h2 id="prof-h">Concept profile</h2><p class="faint small">Select a concept to see every answer behind its status. Confident needs varied questions, 2+ sessions and a good score after a gap.</p></div>
        <div class="segmented small-seg" role="group" aria-label="Filter">${[["all", "All"], ["attention", "Attention"], ["progress", "In progress"], ["mastered", "Confident"], ["unknown", "No evidence"]].map(([k, t]) => `<button type="button" data-pf="${k}" class="${profFilter === k ? "active" : ""}" aria-pressed="${profFilter === k}">${t}</button>`).join("")}</div></div>
      <div class="table-scroll"><table class="profile-table">
        <thead><tr><th scope="col" class="star-col"><span class="sr-only">Priority</span></th>${th("name", "Concept")}${th("status", "Status")}${th("evidence", "Evidence")}${th("next", "Next review")}${th("last", "Last practised")}</tr></thead>
        <tbody>${rows.length ? rows.map(({ c, p }) => {
          const st = S()[p.status], starred = pr.includes(c.id);
          return `<tr><td class="star-col"><button type="button" class="star${starred ? " on" : ""}" data-star="${c.id}" aria-pressed="${starred}" aria-label="${starred ? "Remove" : "Mark"} ${A.esc(c.title)} as a priority">${starred ? "★" : "☆"}</button></td>
            <td><button class="row-link" data-inspect="${c.id}" type="button">${A.esc(c.title)}</button><span class="faint small row-unit">${A.esc(C().UNITS.find((u) => u.id === c.unit).title)}</span></td>
            <td><span class="level-pill st-${st.tone}">${A.esc(st.label)}</span></td>
            <td>${p.max ? `${p.earned}/${p.max} marks <span class="faint">· ${p.sessions} session${p.sessions === 1 ? "" : "s"}</span>` : `<span class="faint">none yet</span>`}</td>
            <td>${nextTxt(p.schedule)}</td><td>${ago(p.lastPractised)}</td></tr>`;
        }).join("") : `<tr><td colspan="6" class="empty-note">No concepts in this group.</td></tr>`}</tbody>
      </table></div>
    </section>`;
  }

  // ───────── evidence inspector (shared with the Library) ─────────
  function inspect(id) {
    const L = A.learningState(), c = C().get(id), p = L.prof[id], st = S()[p.status];
    const src = { test: "Practice test", quiz: "Concept quiz", review: "Daily review", room: "Study room" };
    const qText = (r) => { const k = A.BANKS.mc.has(r.qid) ? "mc" : A.BANKS.nr.has(r.qid) ? "nr" : "wr"; const q = A.BANKS[k].get(r.qid); if (!q) return r.qid; const t = k === "wr" ? q.title + (r.part ? ` (${r.part})` : "") : A.texPlain(q.q).replace(/\\\(|\\\)/g, ""); return t.length > 70 ? t.slice(0, 68) + "…" : t; };
    const ms = L.mistakes.filter((m) => m.concepts.includes(id));
    A.openSheet(c.title, `
      <div class="insp-top"><span class="level-pill st-${st.tone}">${A.esc(st.label)}</span><p>${A.esc(window.Learning.explain(p))}</p></div>
      <h3>What “Confident” needs</h3>${window.Library.checklist(p)}
      <h3>Review schedule</h3><p class="small">${A.esc(window.Learning.scheduleText(p.schedule))}</p>
      ${p.schedule.history.length ? `<table class="insp-table"><thead><tr><th>Session</th><th>Marks</th><th>Review step after</th></tr></thead><tbody>${p.schedule.history.slice(-8).reverse().map((h) => `<tr><td>${A.esc(A.niceDate(h.date, false))}</td><td>${h.earned}/${h.max}</td><td>${h.step} → every ${window.Learning.INTERVALS[h.step]} day${window.Learning.INTERVALS[h.step] === 1 ? "" : "s"}</td></tr>`).join("")}</tbody></table>` : ""}
      <h3>Answers behind it <span class="faint small">(${p.log.length}${p.log.length === 40 ? ", most recent" : ""})</span></h3>
      ${p.log.length ? `<table class="insp-table"><thead><tr><th>When</th><th>Where</th><th>Question</th><th>Result</th></tr></thead><tbody>${p.log.slice().reverse().map((r) => `<tr><td>${A.esc(A.niceDate(r.date, false))}</td><td>${A.esc(src[r.source] || "Practice")}${r.level === "challenge" ? ' <span class="faint">(harder, not in accuracy)</span>' : ""}</td><td>${A.esc(qText(r))}</td><td class="${r.earned >= r.max ? "res-ok" : "res-bad"}">${r.earned}/${r.max}</td></tr>`).join("")}</tbody></table>` : `<p class="muted small">No answers yet.</p>`}
      ${ms.length ? `<h3>In your Mistake Notebook</h3><p class="small">${ms.filter((m) => !m.fixed && !m.understood).length} open, ${ms.filter((m) => m.fixed).length} fixed.</p>` : ""}
      <div class="lesson-actions"><button class="btn btn-secondary btn-sm" data-lesson="${id}" type="button">Open the lesson</button><button class="btn btn-secondary btn-sm" data-quiz="${id}" type="button">Take a quiz</button></div>
      <p class="faint small">All of this is computed in your browser from your saved answers. Percentages are rounded and based on few answers, so treat them as rough.</p>`);
  }

  // ───────── 5. study materials ─────────
  function docsCard(L) {
    return `<section class="card docs-card" aria-labelledby="docs-h">
      <div class="card-head"><h2 id="docs-h">Study materials</h2><span class="faint small">Files are read and stored only in this browser.</span></div>
      <label class="dropzone" for="ml-file">
        <input id="ml-file" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" multiple />
        <span class="dz-icon" aria-hidden="true">⇪</span>
        <span class="dz-main">Drop a PDF, .txt or .md file, or <u>choose a file</u></span>
        <span class="faint small">Up to 10 MB and ${window.Docs.MAX_PAGES} pages. Text-based PDFs only (scanned pages can't be read yet).</span>
      </label>
      ${uploads.length ? `<ul class="upload-list">${uploads.map((u) => `<li class="${u.error ? "err" : ""}"><b>${A.esc(u.name)}</b> — ${u.error ? A.esc(u.error) : `${A.esc(u.status)} <span class="bar up-bar"><span class="bar-fill good" style="width:${Math.round(u.frac * 100)}%"></span></span>`}</li>`).join("")}</ul>` : ""}
      ${docsCache.length ? `<ul class="doc-list">${docsCache.map((d) => `
        <li class="${d.id === selectedDoc ? "active" : ""}">
          <div class="doc-name"><span class="doc-ico" aria-hidden="true">${d.kind === "pdf" ? "PDF" : "TXT"}</span><div><b>${A.esc(d.name)}</b><span class="faint small">${d.pages.length} ${d.unit}${d.pages.length === 1 ? "" : "s"} · ${d.size < 1024 ? d.size + " bytes" : d.size < 1048576 ? Math.round(d.size / 1024) + " KB" : (d.size / 1048576).toFixed(1) + " MB"} · added ${ago(d.added)} · ${d.analysis.covered.length} concept${d.analysis.covered.length === 1 ? "" : "s"} covered</span></div></div>
          <div class="focus-actions">
            <button class="btn btn-secondary btn-sm" data-doc-open="${d.id}" type="button">${d.id === selectedDoc ? "Hide analysis" : "View analysis"}</button>
            <button class="btn btn-quiet btn-sm" data-doc-ask="${d.id}" type="button">✦ Ask the tutor about it</button>
            <button class="btn btn-quiet btn-sm danger" data-doc-del="${d.id}" type="button">Delete</button>
          </div>
        </li>`).join("")}</ul>` : `<p class="empty-note">No files yet. Upload a review package or your notes to see which concepts it covers, and how that lines up with your weak spots.</p>`}
      <div id="doc-analysis">${selectedDoc ? docReport(docsCache.find((d) => d.id === selectedDoc), L) : ""}</div>
      ${!window.Docs.persistent() ? `<p class="form-error">This browser blocks offline storage, so files will disappear when you close the tab.</p>` : ""}
    </section>`;
  }

  function docReport(d, L) {
    if (!d) return "";
    const a = d.analysis, name = (id) => C().get(id).title;
    const weakSet = new Set(Object.values(L.prof).filter((p) => ["needs_work", "early_warning", "developing"].includes(p.status)).map((p) => p.id));
    const overlap = [...a.covered, ...a.possible].filter((id) => weakSet.has(id)).sort((x, y) => (L.recs.findIndex((r) => r.concept === x)) - (L.recs.findIndex((r) => r.concept === y)));
    const weakMissing = [...weakSet].filter((id) => a.missing.includes(id));
    const ref = (id) => { const b = a.byConcept[id]; return `${d.unit}${b.pages.length > 1 ? "s" : ""} ${b.pages.join(", ")}`; };
    const row = (id, showSample) => `<li><button class="btn-inline" data-lesson="${id}" type="button">${A.esc(name(id))}</button> <span class="faint small">(${ref(id)})</span>${showSample && a.byConcept[id].samples[0] ? `<span class="snippet">“…${A.esc(a.byConcept[id].samples[0].snippet)}…”</span>` : ""}</li>`;
    let advice;
    if (overlap.length) advice = `This file covers ${overlap.map((id) => `<b>${A.esc(name(id))}</b>`).join(", ")}, which your results show you're working on. Start with <b>${A.esc(name(overlap[0]))}</b>: read that part of the file next to the lesson, then take the 5-question quiz.`;
    else if (!L.records.length) advice = "Once you have some test or quiz results, this report will also show where the file overlaps with your weak spots.";
    else advice = "None of your current weak spots clearly appear in this file, so use it for review and lean on the Concept Library for your weaker topics.";
    return `
      <div class="doc-report">
        <h3>${A.esc(d.name)}</h3>
        <p class="faint small"><b>Scope:</b> this compares the text extracted from this file with the ${C().CONCEPTS.length} concepts configured in Campfire Prep. It is not a check against the whole Pre-Calculus 11 curriculum, and it matches words and notation, so a topic taught without its usual vocabulary may be missed. Topics found here are only suggestions for your exam plan, never confirmed exam content.</p>
        <p class="doc-advice">${advice}</p>
        ${weakMissing.length ? `<p class="muted"><b>Weak spots I couldn't find in this file:</b> ${weakMissing.map((id) => `<button class="btn-inline" data-lesson="${id}" type="button">${A.esc(name(id))}</button>`).join(", ")}. Use the Concept Library for these.</p>` : ""}
        <div class="cov-grid">
          <div><h4 class="cov-h ok">Clearly covered (${a.covered.length})</h4><ul class="cov-list">${a.covered.map((id) => row(id, true)).join("") || "<li class='muted'>None</li>"}</ul></div>
          <div><h4 class="cov-h mid">Possibly covered: check these (${a.possible.length})</h4><ul class="cov-list">${a.possible.map((id) => row(id, true)).join("") || "<li class='muted'>None</li>"}</ul></div>
          <div><h4 class="cov-h none">Not found in the extracted text (${a.missing.length})</h4><ul class="cov-list">${a.missing.map((id) => `<li><button class="btn-inline" data-lesson="${id}" type="button">${A.esc(name(id))}</button></li>`).join("") || "<li class='muted'>None</li>"}</ul></div>
        </div>
      </div>`;
  }

  async function handleFiles(files) {
    for (const f of files) {
      const u = { name: f.name, status: "Starting…", frac: 0 };
      uploads.push(u);
      render();
      try {
        const doc = await window.Docs.add(f, (status, frac) => { u.status = status; u.frac = frac; const el = A.$("#ml-body .upload-list"); if (el) render(); });
        uploads = uploads.filter((x) => x !== u);
        selectedDoc = doc.id;
      } catch (e) {
        u.error = e.message || "Something went wrong reading that file.";
      }
      render();
    }
  }

  async function onClick(e) {
    const t = e.target;
    if (t.closest("[data-alldays]")) { showAllDays = !showAllDays; return render(); }
    const tab = t.closest("[data-tab]");
    if (tab) { planTab = tab.dataset.tab; return render(); }
    const b = t.closest("[data-budget]");
    if (b) { budget = Number(b.dataset.budget); return render(); }
    const pf = t.closest("[data-pf]");
    if (pf) { profFilter = profFilter === pf.dataset.pf && pf.classList.contains("sum-card") ? "all" : pf.dataset.pf; await render(); if (pf.classList.contains("sum-card")) A.$("#prof-h").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    const so = t.closest("[data-sort]");
    if (so) { sort = sort.key === so.dataset.sort ? { key: sort.key, dir: -sort.dir } : { key: so.dataset.sort, dir: 1 }; return render(); }
    const star = t.closest("[data-star]");
    if (star) { const pr = new Set(examOf(A.learningState()).priorities || []); if (pr.has(star.dataset.star)) pr.delete(star.dataset.star); else pr.add(star.dataset.star); saveExam({ priorities: [...pr] }); return render(); }
    const insp = t.closest("[data-inspect]");
    if (insp) return inspect(insp.dataset.inspect);
    const mpd = t.closest("[data-mpd]");
    if (mpd) { saveExam({ minutesPerDay: Number(mpd.dataset.mpd) }); return render(); }
    const day = t.closest("[data-day]");
    if (day) {
      const ex = examOf(A.learningState());
      let days = ex.days.length ? new Set(ex.days) : new Set([0, 1, 2, 3, 4, 5, 6]);
      const d = Number(day.dataset.day);
      if (days.has(d)) days.delete(d); else days.add(d);
      if (!days.size) days = new Set([d]);
      saveExam({ days: days.size === 7 ? [] : [...days] });
      return render();
    }
    const fo = t.closest("[data-focus]");
    if (fo) { const el = A.$("#" + fo.dataset.focus); if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.focus(); } return; }
    const done = t.closest("[data-done]");
    if (done) { const all = A.store.get(A.KEYS.done, {}); if (all[done.dataset.done] && Date.now() - all[done.dataset.done] < 86400000) delete all[done.dataset.done]; else all[done.dataset.done] = Date.now(); A.store.set(A.KEYS.done, all); return render(); }
    const ask = t.closest("[data-ask]");
    if (ask) { const c = C().get(ask.dataset.ask); return window.Tutor.open({ mode: "explain", prompt: `Help me get better at ${c.title}. Where should I start?` }); }
    const open = t.closest("[data-doc-open]");
    if (open) { selectedDoc = selectedDoc === open.dataset.docOpen ? null : open.dataset.docOpen; render(); if (window.Tutor) window.Tutor.contextChanged(); return; }
    const dask = t.closest("[data-doc-ask]");
    if (dask) { const d = docsCache.find((x) => x.id === dask.dataset.docAsk); return window.Tutor.open({ mode: "explain", document: { id: d.id, name: d.name }, prompt: `What does "${d.name}" cover, and what should I focus on?` }); }
    const del = t.closest("[data-doc-del]");
    if (del) {
      const d = docsCache.find((x) => x.id === del.dataset.docDel);
      if (await A.confirmDialog("Delete this file?", `<b>${A.esc(d.name)}</b>, its extracted text and its analysis will be removed from this browser.`, "Delete", "Keep")) {
        await window.Docs.remove(d.id);
        if (selectedDoc === d.id) selectedDoc = null;
        if (window.Tutor) window.Tutor.forgetDocument(d.id);
        render();
      }
      return;
    }
    const act = t.closest("[data-act]");
    if (!act) return;
    if (act.dataset.act === "diagnostic") { A.store.set(A.KEYS.prefs, { ...A.store.get(A.KEYS.prefs, {}), level: "classmate" }); A.go("home"); setTimeout(() => A.$("#btn-create").click(), 50); }
    if (act.dataset.act === "ai-analyst") window.Tutor.open({ mode: "plan", useLearning: true, prompt: "Look at my learning profile. What should I focus on first, what do my mistakes suggest, and what would a good 30-minute session look like?", send: true });
  }

  function onChange(e) {
    if (e.target.id === "ml-file") { handleFiles(e.target.files); e.target.value = ""; return; }
    if (e.target.id === "ml-exam" || e.target.dataset.unit) {
      const units = A.$$("#ml-body [data-unit]").filter((x) => x.checked).map((x) => x.dataset.unit);
      saveExam({ date: A.$("#ml-exam").value, units: units.length === C().UNITS.length ? [] : units });
      if (e.target.id === "ml-exam" && e.target.value) planTab = "exam";
      render();
    }
  }

  // Page context for the tutor: what's on screen (next step, plan, open file analysis), never raw file text.
  function context() {
    const L = A.learningState();
    const p = window.Learning.plan(L.recs.filter((r) => r.status !== "not_attempted" || L.docConcepts.has(r.concept)), budget);
    const exam = examOf(L);
    const lines = [
      `Due today: ${L.dueConcepts.length} concept reviews, ${L.dueMistakes.length} mistakes to retry.`,
      exam.date ? `Exam on ${exam.date} (${daysUntil(exam.date)} days); units on exam: ${exam.units.length ? exam.units.join(", ") : "not set (all units)"}; ${exam.minutesPerDay} min per study day.` : "No exam date set.",
      `Study plan for ${budget} minutes:`, ...p.items.map((r, k) => `${k + 1}. ${r.title} [${r.label}] ≈${r.minutes} min. Why: ${r.why} ${r.extra.join(" ")}`),
    ];
    const d = docsCache.find((x) => x.id === selectedDoc);
    if (d) lines.push(`Open file analysis "${d.name}": clearly covered = ${d.analysis.covered.map((id) => C().get(id).title).join(", ") || "none"}; possibly covered = ${d.analysis.possible.map((id) => C().get(id).title).join(", ") || "none"}; not found = ${d.analysis.missing.map((id) => C().get(id).title).join(", ")}.`);
    return { type: "learning_profile", title: "My Learning (study plan and concept profile)", text: lines.join("\n"), concepts: p.items.slice(0, 3).map((r) => r.concept) };
  }

  window.Analyst = { init, render, context, inspect };
})();
