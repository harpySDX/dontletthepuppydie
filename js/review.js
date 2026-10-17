/*
 * REVIEW — spaced repetition + the Mistake Notebook.
 *
 * Both are computed from the same evidence records as everything else (no separate copies of answers):
 *   • Concept reviews: Leitner steps (1 → 1 → 3 → 7 → 14 → 30 days), replayed from your sessions.
 *   • Mistakes: every wrong answer, once per question; retries step through 1 → 3 → 7 days; three spaced
 *     right answers in a row = fixed. Students can re-label the error type and mark a mistake understood.
 * Only the student's own edits (category, understood, note) are stored separately (KEYS.notebook).
 */
(function () {
  "use strict";
  let A = null;
  let view = "home"; // "home" | "session"
  const ui = { q: "", status: "open", concept: "", cat: "", open: null };

  function init(api) {
    A = api;
    const body = A.$("#rv-body");
    body.addEventListener("click", onClick);
    body.addEventListener("input", (e) => { if (e.target.id === "nb-search") { ui.q = e.target.value.trim().toLowerCase(); renderList(); } });
    body.addEventListener("change", onChange);
  }

  const C = () => window.Concepts;
  const L_ = () => window.Learning;
  const kindOf = (m) => m.kind || (A.BANKS.mc.has(m.qid) ? "mc" : A.BANKS.nr.has(m.qid) ? "nr" : A.BANKS.wr.has(m.qid) ? "wr" : null);
  const qFor = (m) => { const k = kindOf(m); return k ? A.BANKS[k].get(m.qid) : null; };
  const dayLabel = (ts) => { const d = Math.round((L_().startOfDay(ts) - L_().startOfDay(Date.now())) / L_().DAY); return d <= -2 ? `${-d} days ago` : d === -1 ? "yesterday" : d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`; };
  const srcLabel = (s) => ({ test: "Practice test", quiz: "Concept quiz", review: "Daily review", room: "Study room", mistake: "Notebook retry" }[s] || "Practice");

  function filterConcept(id) { ui.concept = id || ""; ui.status = "open"; view = "home"; render(); const el = A.$("#notebook"); if (el) el.scrollIntoView({ block: "start" }); }

  // ───────── home ─────────
  function render() {
    if (view === "session") return;
    window.Practice.stop(A.$("#rv-body"));
    const L = A.learningState();
    const dueM = L.dueMistakes, dueC = L.dueConcepts;
    const total = sessionPlan(L).length;
    const upcoming = upcomingDays(L);
    const anyEvidence = L.records.length > 0;
    A.$("#rv-body").innerHTML = `
      <div class="rv-top">
        <div class="card rv-today">
          <p class="eyebrow">Today's review</p>
          ${!anyEvidence ? `<h2 class="rv-big">Nothing to review yet</h2><p class="muted">Reviews are scheduled from your own answers. Take a concept quiz or a practice test, and the concepts you practise will come back here at the right time.</p><div class="lesson-actions"><button class="btn btn-primary" data-go="library" type="button">Open the Concept Library</button></div>`
            : total ? `<h2 class="rv-big">${total} question${total === 1 ? "" : "s"} · about ${Math.max(5, Math.round(total * 1.5))} min</h2>
              <ul class="rv-due">${dueC.length ? `<li><b>${dueC.length}</b> concept${dueC.length === 1 ? "" : "s"} due: ${dueC.slice(0, 4).map((p) => A.esc(C().get(p.id).title)).join(", ")}${dueC.length > 4 ? "…" : ""}</li>` : ""}${dueM.length ? `<li><b>${dueM.length}</b> mistake${dueM.length === 1 ? "" : "s"} ready for a retry</li>` : ""}</ul>
              <div class="lesson-actions"><button class="btn btn-primary btn-lg" data-rv="start" type="button">Start today's review</button></div>
              <p class="faint small">Mistakes come first (the exact question again), then one fresh question per due concept.</p>`
            : `<h2 class="rv-big">You're all caught up</h2><p class="muted">${upcoming.next ? `Next review: <b>${A.esc(upcoming.next)}</b>.` : "Nothing is scheduled yet."} New concepts aren't scheduled until you've practised them once.</p>
              ${L.mistakes.some((m) => !m.fixed && !m.understood) ? `<div class="lesson-actions"><button class="btn btn-secondary" data-rv="early" type="button">Retry mistakes early</button><span class="faint small">Early retries still count; a spaced one counts most.</span></div>` : ""}`}
        </div>
        <div class="card rv-week">
          <p class="eyebrow">Coming up</p>
          ${anyEvidence ? `<ol class="week">${upcoming.days.map((d) => `<li class="${d.n ? "has" : ""}"><span class="wk-d">${A.esc(d.label)}</span><span class="wk-bar"><i style="width:${Math.min(100, d.n * 18)}%"></i></span><span class="wk-n">${d.n || "—"}</span></li>`).join("")}</ol>
          <p class="faint small">Reviews per day, from your schedule. Steps: ${L_().INTERVALS.slice(1).join(" → ")} days. A score under 50% sends a concept back to tomorrow.</p>` : `<p class="muted small">Your 7-day review calendar appears after your first practice.</p>`}
        </div>
      </div>
      <section class="card notebook" id="notebook" aria-labelledby="nb-h">
        <div class="card-head"><div><h2 id="nb-h">Mistake Notebook</h2><p class="muted small nb-sub">Every question you got wrong, saved once, with what you wrote and the worked answer.</p></div>
          <button class="btn btn-accent btn-sm" data-rv="practise" type="button" id="nb-practise">Practise these</button></div>
        <div class="nb-tools">
          <input class="text-input nb-search" id="nb-search" type="search" placeholder="Search your mistakes…" value="${A.esc(ui.q)}" aria-label="Search mistakes" />
          <div class="segmented small-seg" role="group" aria-label="Show">${[["open", "Open"], ["due", "Due"], ["understood", "Understood"], ["fixed", "Fixed"], ["all", "All"]].map(([k, t]) => `<button type="button" data-nbs="${k}" class="${ui.status === k ? "active" : ""}" aria-pressed="${ui.status === k}">${t}</button>`).join("")}</div>
          <select class="text-input nb-select" id="nb-concept" aria-label="Concept"><option value="">All concepts</option>${C().CONCEPTS.map((c) => `<option value="${c.id}" ${ui.concept === c.id ? "selected" : ""}>${A.esc(c.title)}</option>`).join("")}</select>
          <select class="text-input nb-select" id="nb-cat" aria-label="Error type"><option value="">All error types</option>${Object.entries(L_().CATEGORIES).map(([k, t]) => `<option value="${k}" ${ui.cat === k ? "selected" : ""}>${A.esc(t)}</option>`).join("")}</select>
        </div>
        <div id="nb-list"></div>
      </section>`;
    renderList(L);
    updateBadge(L);
  }

  function upcomingDays(L) {
    const today = L_().startOfDay(Date.now()), DAY = L_().DAY;
    const days = [];
    let next = null;
    for (let d = 0; d < 7; d++) {
      const date = today + d * DAY;
      const n = Object.values(L.prof).filter((p) => p.schedule && p.schedule.due !== null && (d === 0 ? p.schedule.due <= date : L_().startOfDay(p.schedule.due) === date)).length
        + L.mistakes.filter((m) => !m.fixed && !m.understood && m.due !== null && (d === 0 ? m.due <= date : L_().startOfDay(m.due) === date)).length;
      days.push({ label: d === 0 ? "Today" : d === 1 ? "Tomorrow" : new Date(date).toLocaleDateString(undefined, { weekday: "short" }), n });
      if (n && next === null && d > 0) next = d === 1 ? "tomorrow" : new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    }
    if (next === null) {
      const later = [...Object.values(L.prof).map((p) => p.schedule && p.schedule.due).filter(Boolean), ...L.mistakes.filter((m) => !m.fixed && !m.understood && m.due).map((m) => m.due)].filter((d) => d > today).sort((a, b) => a - b)[0];
      if (later) next = new Date(later).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    }
    return { days, next };
  }

  function filtered(L) {
    return L.mistakes.filter((m) => {
      if (ui.status === "open" && (m.fixed || m.understood)) return false;
      if (ui.status === "due" && !(m.isDue && !m.understood)) return false;
      if (ui.status === "understood" && !m.understood) return false;
      if (ui.status === "fixed" && !m.fixed) return false;
      if (ui.concept && !m.concepts.includes(ui.concept)) return false;
      if (ui.cat && m.category !== ui.cat) return false;
      if (ui.q) {
        const q = qFor(m);
        const hay = [q ? (q.q || q.intro || "") : "", ...(m.concepts.map((c) => C().get(c) ? C().get(c).title : "")), L_().CATEGORIES[m.category], m.note].join(" ").toLowerCase();
        if (!ui.q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return !!qFor(m);
    });
  }

  function renderList(L) {
    L = L || A.learningState();
    const list = filtered(L);
    const btn = A.$("#nb-practise");
    const practisable = list.filter((m) => !m.fixed).length;
    if (btn) { btn.disabled = !practisable; btn.textContent = practisable ? `Practise these (${Math.min(8, practisable)})` : "Practise these"; }
    const el = A.$("#nb-list");
    if (!el) return;
    if (!L.mistakes.length) {
      el.innerHTML = `<div class="empty-state"><div class="es-icon" aria-hidden="true">✎</div><h3>Your notebook is empty</h3><p class="muted">When you get a question wrong in a test, quiz or review, it's saved here automatically with what you wrote and the correct method, so you can come back to it. Nothing to do yet.</p></div>`;
      return;
    }
    if (!list.length) { el.innerHTML = `<p class="empty-note">No mistakes match these filters.${ui.status === "open" ? " Everything open has been fixed or marked understood. Nice." : ""}</p>`; return; }
    el.innerHTML = `<p class="faint small nb-count">${list.length} mistake${list.length === 1 ? "" : "s"}</p><ul class="nb-items">${list.slice(0, 60).map(card).join("")}</ul>${list.length > 60 ? `<p class="faint small">Showing the 60 most recent. Use search or filters to find older ones.</p>` : ""}`;
  }

  function statusOf(m) {
    if (m.fixed) return `<span class="level-pill st-good">Fixed</span>`;
    if (m.understood) return `<span class="level-pill st-none">Marked understood</span>`;
    if (m.isDue) return `<span class="level-pill st-mid">Retry due</span>`;
    return `<span class="level-pill st-none">Next retry ${A.esc(dayLabel(m.due))}</span>`;
  }

  function answerHTML(m, q, resp) {
    const k = kindOf(m);
    if (k === "mc") return resp === null || resp === undefined || resp === "" ? `<span class="muted">(blank)</span>` : A.renderMath(q.c[Number(resp)] || "?");
    if (k === "nr") return A.answerTeX(resp, "number");
    const p = q.parts.find((x) => x.key === m.part);
    if (!p) return A.esc(String(resp || ""));
    return p.kind === "choice" ? (resp ? A.esc(resp) : `<span class="muted">(blank)</span>`) : A.answerTeX(resp, p.kind);
  }
  function keyHTML(m, q) {
    const k = kindOf(m);
    if (k === "mc") return A.renderMath(q.c[0]);
    if (k === "nr") return A.tex(String(q.answer));
    const p = q.parts.find((x) => x.key === m.part);
    return p ? A.keyTeX(p) : "";
  }

  function card(m) {
    const q = qFor(m), k = kindOf(m);
    const p = k === "wr" ? q.parts.find((x) => x.key === m.part) : null;
    const last = m.occurrences[m.occurrences.length - 1];
    const text = k === "wr" ? `${A.renderMath(q.intro)}${p ? `<div class="nb-part">${p.label ? `<b>${A.esc(p.label)}</b> ` : ""}${A.renderMath(p.prompt)}</div>` : ""}` : A.renderMath(q.q);
    const tries = m.events.length - 1;
    const expl = k === "wr" ? (Array.isArray(q.solution) ? q.solution : [q.solution]).map((x) => `<p>${A.renderMath(x)}</p>`).join("") : A.renderMath(q.e);
    const isOpen = ui.open === m.key;
    return `<li class="nb-item${m.fixed || m.understood ? " closed" : ""}" data-key="${A.esc(m.key)}">
      <div class="nb-head">
        <div class="nb-chips">${m.concepts.slice(0, 2).map((c) => `<button class="concept-chip" data-lesson="${c}" type="button">${A.esc(C().get(c).title)}</button>`).join("")}<span class="faint small">${A.esc(srcLabel(last.source))} · ${A.esc(dayLabel(last.date))}${m.times > 1 ? ` · wrong ${m.times}×` : ""}</span></div>
        ${statusOf(m)}
      </div>
      <div class="nb-q">${text}</div>
      <div class="nb-answers">
        <div class="nb-ans bad"><span class="cmp-label">You wrote</span><span>${answerHTML(m, q, last.response)}</span></div>
        <div class="nb-ans ok"><span class="cmp-label">Correct</span><span>${keyHTML(m, q)}</span></div>
      </div>
      ${last.note && last.note !== "No answer." ? `<p class="nb-note">Marker's note: ${A.esc(last.note)}</p>` : ""}
      <details class="nb-expl"${isOpen ? " open" : ""}><summary>How to solve it</summary><div>${expl}</div></details>
      <div class="nb-foot">
        <label class="nb-cat"><span class="faint small">Error type</span>
          <select class="text-input nb-select" data-cat="${A.esc(m.key)}">${Object.entries(L_().CATEGORIES).map(([ck, t]) => `<option value="${ck}" ${m.category === ck ? "selected" : ""}>${A.esc(t)}</option>`).join("")}</select>
          <span class="faint small">${m.catByYou ? "set by you" : m.autoSure ? "detected from the marking" : "couldn't tell automatically"}</span>
        </label>
        <span class="faint small nb-progress">${tries ? `Retried ${tries}× · right ${m.retriesRight}×` : "Not retried yet"}${m.fixed ? " · fixed after spaced retries" : ""}</span>
        <div class="nb-actions">
          ${!m.fixed ? `<button class="btn btn-secondary btn-sm" data-retry="${A.esc(m.key)}" type="button">Retry</button>` : ""}
          <button class="btn btn-quiet btn-sm" data-understood="${A.esc(m.key)}" type="button">${m.understood ? "Undo understood" : "Mark understood"}</button>
          <button class="btn btn-quiet btn-sm" data-askm="${A.esc(m.key)}" type="button">✦ Ask the tutor</button>
        </div>
      </div>
    </li>`;
  }

  function setNotebook(key, patch) {
    const nb = A.store.get(A.KEYS.notebook, {});
    nb[key] = { ...(nb[key] || {}), ...patch };
    for (const k of Object.keys(nb[key])) if (nb[key][k] === null || nb[key][k] === undefined || nb[key][k] === "") delete nb[key][k];
    if (!Object.keys(nb[key]).length) delete nb[key];
    A.store.set(A.KEYS.notebook, nb);
  }

  // ───────── sessions ─────────
  function itemForMistake(m) {
    const k = kindOf(m);
    return k ? window.Practice.itemFor(k, m.qid, m.part, { tag: "From your notebook", mistakeKey: m.key }) : null;
  }
  function freshFor(conceptId, avoid) {
    // every concept reviews with a fresh, verified question from the engine (Normal level, never a recent repeat)
    if (window.Bank) {
      const got = window.Bank.select({ concept: conceptId, mode: "normal", n: 1 }).items[0];
      if (got && !avoid.has(got.q.id)) { A.BANKS[got.kind].set(got.q.id, got.q); return window.Practice.makeItem(got.kind, got.q, got.part || undefined, { tag: `Review · ${C().get(conceptId).title}` }); }
    }
    const recent = new Set(A.store.get(A.KEYS.practice, []).filter((p) => Date.now() - p.date < 2 * L_().DAY).map((p) => p.qid));
    const pool = [...A.MC().map((q) => ["mc", q]), ...A.NR().map((q) => ["nr", q])].filter(([, q]) => C().conceptsFor(q).includes(conceptId) && !avoid.has(q.id));
    const fresh = pool.filter(([, q]) => !recent.has(q.id));
    const pick = A.shuffle(fresh.length ? fresh : pool)[0];
    return pick ? window.Practice.makeItem(pick[0], pick[1], undefined, { tag: `Review · ${C().get(conceptId).title}` }) : null;
  }
  function sessionPlan(L) {
    const items = [];
    const used = new Set();
    const ms = L.dueMistakes.slice().sort((a, b) => (a.due - b.due) || (b.times - a.times)).slice(0, 6);
    for (const m of ms) { const it = itemForMistake(m); if (it) { items.push(it); used.add(m.qid); } }
    for (const p of L.dueConcepts.slice(0, 10 - items.length)) {
      const it = freshFor(p.id, used);
      if (it) { items.push(it); used.add(it.q.id); }
    }
    return items.slice(0, 10);
  }

  function startSession(items, title, crumb) {
    if (!items.length) return;
    view = "session";
    A.$("#rv-body").scrollIntoView({ block: "start" });
    window.Practice.run(A.$("#rv-body"), {
      source: "review", level: "normal", crumb, title, items, exitLabel: "Back to Review",
      onExit: () => { view = "home"; render(); if (window.Tutor) window.Tutor.contextChanged(); },
      end: (r) => {
        const s = window.Practice.summary(r);
        const L = A.learningState();
        updateBadge(L);
        const touched = [...new Set(r.items.flatMap((it) => it.concepts))].slice(0, 6);
        return `<div class="pr"><p class="eyebrow">${A.esc(crumb)}</p><h1>${s.right} of ${s.n} correct</h1>
          <p class="lead">Your schedule has been updated from these answers.</p>
          <ul class="resched">${touched.map((id) => `<li><span>${A.esc(C().get(id).title)}</span><span class="faint small">${A.esc(L_().scheduleText(L.prof[id].schedule))}</span></li>`).join("")}</ul>
          ${window.Practice.reviewList(r)}
          <div class="lesson-actions"><button class="btn btn-primary" data-pr="exit" type="button">Back to Review</button></div></div>`;
      },
    });
  }

  function onClick(e) {
    const t = e.target;
    if (view === "session") return; // the Practice runner handles its own clicks
    const st = t.closest("[data-nbs]");
    if (st) { ui.status = st.dataset.nbs; for (const b of A.$$("[data-nbs]")) { const on = b === st; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); } return renderList(); }
    const rv = t.closest("[data-rv]");
    if (rv && rv.dataset.rv === "start") return startSession(sessionPlan(A.learningState()), "Today's review", "Daily review");
    if (rv && rv.dataset.rv === "early") {
      const L = A.learningState();
      const items = L.mistakes.filter((m) => !m.fixed && !m.understood).sort((a, b) => a.due - b.due).slice(0, 6).map(itemForMistake).filter(Boolean);
      return startSession(items, "Early retry", "Mistake Notebook");
    }
    if (rv && rv.dataset.rv === "practise") {
      const L = A.learningState();
      const items = filtered(L).filter((m) => !m.fixed).slice(0, 8).map(itemForMistake).filter(Boolean);
      return startSession(items, "Targeted practice", "Mistake Notebook");
    }
    const retry = t.closest("[data-retry]");
    if (retry) { const m = A.learningState().mistakes.find((x) => x.key === retry.dataset.retry); const it = m && itemForMistake(m); if (it) startSession([it], "Retry one mistake", "Mistake Notebook"); return; }
    const und = t.closest("[data-understood]");
    if (und) { const m = A.learningState().mistakes.find((x) => x.key === und.dataset.understood); setNotebook(und.dataset.understood, { understood: m && m.understood ? null : Date.now() }); return render(); }
    const ask = t.closest("[data-askm]");
    if (ask) { ui.open = ask.dataset.askm; return window.Tutor.open({ mode: "explain", prompt: "Explain the mistake I'm looking at in my notebook: what went wrong, and how do I avoid it next time?", send: true }); }
    const det = t.closest(".nb-expl summary");
    if (det) { const li = det.closest("[data-key]"); ui.open = li ? li.dataset.key : null; if (window.Tutor) window.Tutor.contextChanged(); }
  }

  function onChange(e) {
    const t = e.target;
    if (t.id === "nb-concept") { ui.concept = t.value; return renderList(); }
    if (t.id === "nb-cat") { ui.cat = t.value; return renderList(); }
    if (t.dataset.cat) {
      const m = A.learningState().mistakes.find((x) => x.key === t.dataset.cat);
      setNotebook(t.dataset.cat, { cat: m && t.value === m.autoCategory && !m.catByYou ? null : t.value });
      renderList();
    }
  }

  function updateBadge(L) {
    L = L || A.learningState();
    const n = sessionPlan(L).length;
    const b = A.$("#nav-review-badge");
    if (b) { b.hidden = !n; b.textContent = String(n); b.setAttribute("aria-label", `${n} due`); }
  }

  // Tutor context: what's on screen. In a session, the question; otherwise counts and the open mistake.
  function context() {
    if (view === "session") {
      const pc = window.Practice.context();
      return { type: "review_session", title: "Review session", text: "The student is doing a spaced-review / mistake-retry session (practice, tutoring allowed).", concepts: pc ? pc.concepts : [], focus: pc ? pc.focus : undefined };
    }
    const L = A.learningState();
    const list = filtered(L).slice(0, 5);
    const focusM = list.find((m) => m.key === ui.open) || list[0];
    const lines = [`Due today: ${L.dueConcepts.length} concepts, ${L.dueMistakes.length} mistakes.`, `Mistake Notebook (filter: ${ui.status}${ui.concept ? ", " + C().get(ui.concept).title : ""}): ${filtered(L).length} shown.`];
    let focus;
    if (focusM) {
      const q = qFor(focusM), k = kindOf(focusM);
      const last = focusM.occurrences[focusM.occurrences.length - 1];
      const p = k === "wr" ? q.parts.find((x) => x.key === focusM.part) : null;
      focus = {
        label: "Notebook mistake", kind: `Mistake from ${srcLabel(last.source)} (already answered)`, answered: true,
        question: k === "wr" ? `${A.texPlain(q.intro)} ${p ? A.texPlain(p.prompt) : ""}` : A.texPlain(q.q),
        studentAnswer: k === "mc" ? A.texPlain(q.c[Number(last.response)] || "(blank)") : String(last.response || "(blank)"),
        verifiedAnswer: k === "mc" ? A.texPlain(q.c[0]) : k === "nr" ? String(q.answer) : p ? window.Practice.plainKey(p) : "",
        verifiedExplanation: k === "wr" ? (Array.isArray(q.solution) ? q.solution : [q.solution]).map(A.texPlain).join(" ") : A.texPlain(q.e),
        markerNote: last.note || undefined, errorType: L_().CATEGORIES[focusM.category], timesWrong: focusM.times,
      };
    }
    return { type: "review", title: "Review (spaced repetition and Mistake Notebook)", text: lines.join("\n"), concepts: focusM ? focusM.concepts : [], focus };
  }

  function show() { view = "home"; render(); }

  window.Review = { init, render: show, context, filterConcept, updateBadge, sessionPlan };
})();
