/*
 * TUTOR — the floating, page-aware AI tutor.
 *
 * • Hidden completely while a test (or the tour's sample test) is on screen.
 * • While an unfinished test waits in Basecamp (paused or saved), the button shows a lock and can't open:
 *   pressing it explains why and offers Resume / Discard.
 * • Reads structured context for the page on screen at the moment a message is sent (never on navigation).
 * • Sends learning records only if the student turns them on; sends only the relevant pages of an attached file.
 * • Talks to /api/tutor (a serverless function holding the API key). If that isn't available, it says so.
 */
(function () {
  "use strict";
  let A = null;
  const CONV_KEY = "campfire-prep.tutor.v1", PREF_KEY = "campfire-prep.tutorprefs.v1", POS_KEY = "campfire-prep.tutorpos";
  const MODES = [
    { id: "explain", label: "Explain" }, { id: "hint", label: "Hint" }, { id: "guide", label: "Guide me" },
    { id: "example", label: "Worked example" }, { id: "quiz", label: "Quiz me" }, { id: "challenge", label: "Challenge me" },
  ];
  let conv = null, prefs = null, health = null, busy = false, docAttached = null, wasBlocked = false;

  const ss = { get: (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } } };
  const newConv = () => ({ id: "c" + Date.now().toString(36), started: Date.now(), messages: [], lastTitle: null });

  function init(api) {
    A = api;
    conv = A.store.get(CONV_KEY, null) || newConv();
    prefs = { mode: "explain", useLearning: false, code: "", ...A.store.get(PREF_KEY, {}) };
    A.$("#tutor-launcher").addEventListener("click", () => { markSeen(); if (locked()) return showLocked(!lockOpen()); setOpen(true); });
    A.$("#tutor-locked-close").addEventListener("click", () => showLocked(false));
    A.$("#tutor-locked-resume").addEventListener("click", () => { showLocked(false); A.resumeSaved(); });
    A.$("#tutor-locked-discard").addEventListener("click", async () => { if (await A.discardSaved()) { showLocked(false); refresh(); setOpen(true); } });
    A.$("#tutor-locked").addEventListener("keydown", (e) => { if (e.key === "Escape") { showLocked(false); A.$("#tutor-launcher").focus(); } });
    try { if (!localStorage.getItem("campfire-prep.tutorseen")) A.$("#tutor-launcher").classList.add("pulse"); } catch { /* ignore */ }
    A.$("#tutor-min").addEventListener("click", () => setOpen(false));
    A.$("#tutor-new").addEventListener("click", () => { conv = newConv(); docAttached = null; save(); renderAll(); A.$("#tutor-input").focus(); });
    A.$("#tutor-form").addEventListener("submit", (e) => { e.preventDefault(); sendFromInput(); });
    const input = A.$("#tutor-input");
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFromInput(); } });
    input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(120, input.scrollHeight) + "px"; });
    A.$("#tutor-panel").addEventListener("keydown", (e) => { if (e.key === "Escape") { setOpen(false); A.$("#tutor-launcher").focus(); } });
    A.$("#tutor-modes").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) { prefs.mode = b.dataset.mode; savePrefs(); renderModes(); } });
    A.$("#tutor-suggest").addEventListener("click", (e) => { const b = e.target.closest("[data-suggest]"); if (b) send(b.dataset.suggest); });
    A.$("#tutor-context").addEventListener("click", onContextClick);
    A.$("#tutor-context").addEventListener("change", (e) => { if (e.target.id === "tutor-uselearning") { prefs.useLearning = e.target.checked; savePrefs(); renderContext(); } });
    A.$("#tutor-log").addEventListener("click", onLogClick);
    bindDrag();
    window.addEventListener("resize", place);
    refresh();
  }

  const save = () => A.store.set(CONV_KEY, { ...conv, messages: conv.messages.slice(-40) });
  const savePrefs = () => A.store.set(PREF_KEY, prefs);
  const isOpen = () => !A.$("#tutor-panel").hidden;

  // ───────── visibility: never during an unfinished test ─────────
  function allowedHere() {
    const scr = document.body.dataset.screen;
    if (scr === "room") return !!(window.Rooms && window.Rooms.allowsTutor());
    return ["home", "library", "review", "learning", "results"].includes(scr);
  }
  const live = () => A.assessmentState() === "live" || !!(window.Tour && window.Tour.active);
  const locked = () => A.isAssessmentActive();          // live OR an unfinished test waiting in Basecamp
  const lockOpen = () => !A.$("#tutor-locked").hidden;
  function markSeen() { A.$("#tutor-launcher").classList.remove("pulse"); try { localStorage.setItem("campfire-prep.tutorseen", "1"); } catch { /* ignore */ } }
  function showLocked(on) {
    const box = A.$("#tutor-locked");
    if (on) {
      const st = A.assessmentState();
      A.$("#tutor-locked-text").textContent = `${st === "paused" ? "You have a paused test" : "You have an unfinished test"} in Basecamp. The tutor stays off until it's finished or discarded, so practice tests stay honest.`;
    }
    box.hidden = !on;
    if (on) A.$("#tutor-locked-resume").focus();
  }
  function closePanel() {
    if (isOpen()) { A.$("#tutor-panel").hidden = true; A.$("#tutor-launcher").hidden = false; A.$("#tutor-launcher").setAttribute("aria-expanded", "false"); }
  }
  function refresh() {
    if (!A) return;
    const root = A.$("#tutor");
    const isLive = live(), isLocked = !isLive && locked();
    if (isLive || !allowedHere()) {
      root.hidden = true;
      if (isLive) { closePanel(); showLocked(false); }
      wasBlocked = isLive || wasBlocked;
      return;
    }
    root.classList.toggle("locked", isLocked);
    A.$("#tutor-launcher").setAttribute("aria-label", isLocked ? "AI tutor (off while a test is unfinished)" : "Ask the AI tutor");
    A.$("#tutor-launcher").querySelector(".tl-tip").textContent = isLocked ? "Tutor is off during a test" : "Ask the tutor";
    if (isLocked) {
      closePanel();
      root.hidden = false;
      wasBlocked = true;
      return;
    }
    if (!isLocked && lockOpen()) showLocked(false);
    if (root.hidden) {
      root.hidden = false;
      const st = ss.get("campfire-prep.tutoropen");
      if (!wasBlocked && st) setOpen(true, true); // restore the student's choice within this visit
      wasBlocked = false;
    }
    if (isOpen()) renderContext();
  }

  function setOpen(open, silent) {
    if (open && (A.isAssessmentActive() || !allowedHere())) { if (!live() && allowedHere()) showLocked(true); return; }
    A.$("#tutor-panel").hidden = !open;
    A.$("#tutor-launcher").hidden = open;
    A.$("#tutor-launcher").setAttribute("aria-expanded", String(open));
    ss.set("campfire-prep.tutoropen", open);
    if (open) { renderAll(); place(); checkHealth(); if (!silent) A.$("#tutor-input").focus(); }
  }

  function open(opts = {}) {
    if (A.isAssessmentActive()) { if (!live() && allowedHere()) { A.$("#tutor").hidden = false; showLocked(true); } return; }
    markSeen();
    if (opts.mode) { prefs.mode = opts.mode; savePrefs(); }
    if (opts.useLearning) { prefs.useLearning = true; savePrefs(); }
    if (opts.document) docAttached = opts.document;
    setOpen(true);
    if (opts.prompt) {
      if (opts.send) send(opts.prompt);
      else { const i = A.$("#tutor-input"); i.value = opts.prompt; i.focus(); }
    }
  }

  function contextChanged() { if (isOpen()) renderContext(); }
  function forgetDocument(id) { if (docAttached && docAttached.id === id) { docAttached = null; renderContext(); } }

  // ───────── rendering ─────────
  function renderAll() { renderModes(); renderContext(); renderLog(); }

  function renderModes() {
    const modes = prefs.mode === "plan" ? [...MODES, { id: "plan", label: "Study analyst" }] : MODES;
    A.$("#tutor-modes").innerHTML = modes.map((m) => `<button type="button" role="radio" data-mode="${m.id}" class="${m.id === prefs.mode ? "active" : ""}" aria-checked="${m.id === prefs.mode}">${m.label}</button>`).join("");
  }

  function renderContext() {
    const ctx = safeContext();
    const chips = [`<span class="tctx-chip" title="The tutor can read this page">📄 ${A.esc(shortTitle(ctx.title))}</span>`];
    if (ctx.focus) chips.push(`<span class="tctx-chip focus">🎯 ${A.esc(ctx.focus.label || "Current question")}</span>`);
    if (docAttached) chips.push(`<span class="tctx-chip doc">📎 ${A.esc(docAttached.name)} <button type="button" class="tctx-x" data-detach aria-label="Stop using this file">×</button></span>`);
    A.$("#tutor-context").innerHTML = `<div class="tctx-row">${chips.join("")}</div>
      <label class="tctx-toggle"><input type="checkbox" id="tutor-uselearning" ${prefs.useLearning ? "checked" : ""}/> Use my learning records <span class="muted">(${prefs.useLearning ? "test & quiz results summary is shared" : "off: only this page is shared"})</span></label>
      ${statusLine()}`;
    renderSuggest(ctx);
    syncInput();
  }
  const shortTitle = (t) => String(t || "This page").replace(/^Concept Library lesson: /, "Lesson: ").slice(0, 60);

  function statusLine() {
    if (!health) return "";
    if (health.state === "unreachable") return `<p class="tctx-warn">The tutor isn't available on this copy of the site (no AI connection). Lessons, quizzes and your study plan still work.</p>`;
    if (health.state === "not_configured") return `<p class="tctx-warn">The tutor isn't connected yet: the site owner needs to add an AI key. Lessons, quizzes and your study plan still work.</p>`;
    if (health.state === "code" && !prefs.code) return `<form class="tctx-code" data-codeform><label for="tutor-code">Class access code</label><input id="tutor-code" class="text-input" type="password" autocomplete="off" /><button class="btn btn-secondary btn-sm" type="submit">Save</button></form>`;
    return "";
  }

  function renderSuggest(ctx) {
    const s = suggestionsFor(ctx);
    A.$("#tutor-suggest").innerHTML = conv.messages.length > 6 ? "" : s.map((t) => `<button type="button" class="chip chip-link" data-suggest="${A.esc(t)}">${A.esc(t)}</button>`).join("");
  }
  function suggestionsFor(ctx) {
    switch (ctx.type) {
      case "concept_lesson": return ["Explain the second example", "Explain this more simply", "Give me a practice question"];
      case "concept_quiz": return ctx.focus && ctx.focus.answered ? ["Why is this the answer?", "Show me a similar example"] : ["Give me a hint", "What's the first step?"];
      case "results": return ctx.focus ? ["Why did I lose marks?", "Is this a concept mistake or a slip?", "Show me the right method"] : ["What should I review first?", "Which mistakes cost me the most?"];
      case "basecamp": return ["Why is this recommendation appearing?", "What should I do in the next 30 minutes?"];
      case "review": return ctx.focus ? ["Why was this wrong?", "Give me a similar question to try"] : ["How does the review schedule work?", "Which mistakes should I fix first?"];
      case "review_session": case "study_room": return ctx.focus && ctx.focus.answered ? ["Why is this the answer?", "Show me a similar example"] : ["Give me a hint", "What's the first step?"];
      case "learning_profile": return docAttached ? ["Does this file cover my weak topics?", "Make me a revision order"] : ["Explain my study plan", "What should I do for 30 minutes?"];
      default: return ["What can you help me with?"];
    }
  }

  function renderLog() {
    const log = A.$("#tutor-log");
    if (!conv.messages.length) {
      log.innerHTML = `<div class="tutor-empty"><p><b>Hi! I'm your tutor.</b> Ask about anything on this page: a lesson, a question you got wrong, or your study plan.</p><p class="muted small">I'm an AI, so I can make mistakes. Answers marked from the answer key are checked; my own practice questions aren't.</p></div>`;
    } else {
      log.innerHTML = conv.messages.map((m, i) => m.role === "user"
        ? `<div class="tmsg user"><div class="tbubble">${A.esc(m.content).replace(/\n/g, "<br>")}</div></div>`
        : m.error
          ? `<div class="tmsg error"><div class="tbubble">${A.esc(m.content)} ${m.retry ? `<button type="button" class="btn btn-secondary btn-sm" data-retry="${i}">Try again</button>` : ""}</div></div>`
          : `<div class="tmsg bot"><div class="tbubble">${renderReply(m.content)}${m.truncated ? `<p class="muted small">(Answer cut short. Ask me to continue.)</p>` : ""}</div></div>`).join("");
    }
    if (busy) log.insertAdjacentHTML("beforeend", `<div class="tmsg bot"><div class="tbubble typing" aria-label="Tutor is thinking"><i></i><i></i><i></i></div></div>`);
    log.scrollTop = log.scrollHeight;
    syncInput();
  }
  // No AI connection → don't invite typing into a box that can't answer.
  function syncInput() {
    const off = !!health && (health.state === "not_configured" || health.state === "unreachable");
    const input = A.$("#tutor-input");
    input.disabled = off;
    input.placeholder = off ? "The tutor isn't connected on this site" : "Ask about this page…";
    A.$("#tutor-send").disabled = busy || off;
    A.$("#tutor-suggest").hidden = off;
  }

  // Light, safe rendering: escape everything, then math (KaTeX), **bold**, `code`, lists, paragraphs.
  function renderReply(text) {
    const math = [];
    const holder = String(text).replace(/\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$/g, (m, d1, inl, d2) => {
      math.push(d1 !== undefined || d2 !== undefined ? A.tex(d1 !== undefined ? d1 : d2, true) : A.tex(inl));
      return `\u0000${math.length - 1}\u0000`;
    });
    const blocks = A.esc(holder).split(/\n{2,}/).map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
        const ordered = /^\s*\d/.test(lines[0]);
        return `<${ordered ? "ol" : "ul"}>${lines.map((l) => `<li>${l.replace(/^\s*([-*•]|\d+[.)])\s+/, "")}</li>`).join("")}</${ordered ? "ol" : "ul"}>`;
      }
      return `<p>${lines.join("<br>")}</p>`;
    }).join("");
    return blocks.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/^<p>#{1,4}\s*(.+?)<\/p>/gm, "<p><b>$1</b></p>")
      .replace(/\u0000(\d+)\u0000/g, (m, i) => math[Number(i)]);
  }

  // ───────── context assembly (only at send time) ─────────
  function safeContext() {
    try { return A.pageContext() || { type: "page", title: document.title, text: "" }; }
    catch { return { type: "page", title: document.title, text: "", note: "Page content couldn't be read." }; }
  }

  function learningSummary() {
    const L = A.learningState();
    if (!L.records.length) return "No test or quiz results recorded yet.";
    const lines = [`Records: ${L.tests} tests and ${L.quizAnswers} concept-quiz answers (Challenge excluded). Statuses are computed by the app.`];
    for (const c of window.Concepts.CONCEPTS) {
      const p = L.prof[c.id];
      if (p.status === "not_attempted") continue;
      lines.push(`${c.title}: ${window.Learning.STATUS[p.status].label}; ${p.earned}/${p.max} marks over ${p.questions} questions in ${p.sessions} sessions${p.earlierAccuracy !== null ? `; earlier ${Math.round(p.earlierAccuracy * 100)}% → recent ${Math.round(p.recentAccuracy * 100)}%` : ""}; recurring errors: ${p.recurring ? "yes" : "no"}; ${p.distinct} different questions; last practised ${p.daysSince} days ago; ${window.Learning.scheduleText(p.schedule)}`);
    }
    lines.push("Top recommendations: " + L.recs.slice(0, 3).map((r) => `${r.title} (${r.label})`).join(", "));
    lines.push(`Spaced reviews due today: ${L.dueConcepts.map((p) => window.Concepts.get(p.id).title).join(", ") || "none"}.`);
    const open = L.mistakes.filter((m) => !m.fixed && !m.understood);
    const cats = {};
    for (const m of open) cats[m.category] = (cats[m.category] || 0) + 1;
    lines.push(`Mistake Notebook: ${open.length} open mistakes (${Object.entries(cats).map(([k, n]) => `${window.Learning.CATEGORIES[k]}: ${n}`).join("; ") || "none"}), ${L.mistakes.filter((m) => m.fixed).length} fixed after spaced retries.`);
    if (L.exam && L.exam.date) lines.push(`Exam date: ${L.exam.date}; units on the exam (student-provided): ${L.exam.units && L.exam.units.length ? L.exam.units.join(", ") : "not specified"}.`);
    return lines.join("\n");
  }

  async function buildPayload(question) {
    const ctx = safeContext();
    const pageChanged = conv.lastTitle && conv.lastTitle !== ctx.title;
    const concepts = (ctx.concepts || []).map((id) => window.Concepts.get(id)).filter(Boolean).map((c) => ({ id: c.id, title: c.title, summary: c.summary }));
    const context = {
      page: { type: ctx.type, title: ctx.title, text: String(ctx.text || "").slice(0, 12000), pageChanged: !!pageChanged, previousTitle: pageChanged ? conv.lastTitle : undefined },
      concepts,
    };
    if (ctx.focus) context.focus = ctx.focus;
    if (prefs.useLearning) context.learning = learningSummary();
    if (docAttached) {
      const d = await window.Docs.get(docAttached.id).catch(() => null);
      if (d) context.document = { name: d.name, unit: d.unit, pages: window.Learning.relevantPages(d.pages, question, 3).map((p) => ({ n: p.page, text: p.text.slice(0, 3000) })) };
      else docAttached = null;
    }
    conv.lastTitle = ctx.title;
    return context;
  }

  async function checkHealth() {
    if (health && health.state !== "unreachable") return;
    try {
      const r = await fetch("api/tutor", { method: "GET", headers: { accept: "application/json" } });
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || !ct.includes("json")) throw new Error("no api");
      const j = await r.json();
      health = { state: !j.configured ? "not_configured" : j.accessCodeRequired ? "code" : "ready" };
    } catch { health = { state: "unreachable" }; }
    if (isOpen()) renderContext();
  }

  function sendFromInput() {
    const i = A.$("#tutor-input");
    const t = i.value.trim();
    if (!t || busy) return;
    i.value = ""; i.style.height = "auto";
    send(t);
  }

  async function send(text) {
    if (busy || A.isAssessmentActive()) return;
    conv.messages = conv.messages.filter((m) => !m.error);
    conv.messages.push({ role: "user", content: text.slice(0, 2000), ts: Date.now() });
    busy = true; save(); renderLog();
    await request();
  }

  async function request() {
    let reply;
    try {
      const last = conv.messages.filter((m) => !m.error);
      const question = last[last.length - 1].content;
      const body = { mode: prefs.mode, messages: last.slice(-16).map((m) => ({ role: m.role, content: m.content })), context: await buildPayload(question) };
      const headers = { "content-type": "application/json" };
      if (prefs.code) headers["x-tutor-code"] = prefs.code;
      const r = await fetch("api/tutor", { method: "POST", headers, body: JSON.stringify(body) });
      const ct = r.headers.get("content-type") || "";
      const j = ct.includes("json") ? await r.json() : null;
      if (!j) { health = { state: "unreachable" }; reply = { role: "assistant", error: true, content: "The tutor isn't available on this copy of the site. Lessons, quizzes and your study plan still work." }; }
      else if (r.status === 401) { prefs.code = ""; savePrefs(); health = { state: "code" }; reply = { role: "assistant", error: true, content: "This tutor needs your class's access code. Enter it above, then try again.", retry: true }; }
      else if (!r.ok) { if (j.error === "not_configured") health = { state: "not_configured" }; reply = { role: "assistant", error: true, content: j.message || "Something went wrong.", retry: r.status !== 503 || j.error !== "not_configured" }; }
      else reply = { role: "assistant", content: String(j.reply || ""), truncated: !!j.truncated, ts: Date.now() };
    } catch {
      reply = { role: "assistant", error: true, content: "Couldn't reach the tutor. Check your connection.", retry: true };
    }
    busy = false;
    conv.messages.push(reply);
    save();
    if (isOpen()) { renderLog(); renderContext(); }
  }

  function onLogClick(e) {
    const r = e.target.closest("[data-retry]");
    if (r && !busy) { conv.messages = conv.messages.filter((m) => !m.error); busy = true; renderLog(); request(); }
  }
  function onContextClick(e) {
    if (e.target.closest("[data-detach]")) { docAttached = null; renderContext(); return; }
  }
  document.addEventListener("submit", (e) => {
    const f = e.target.closest && e.target.closest("[data-codeform]");
    if (!f) return;
    e.preventDefault();
    prefs.code = A.$("#tutor-code").value.trim();
    savePrefs(); health = { state: "ready" }; renderContext();
  });

  // ───────── position: draggable header on desktop, bottom sheet on phones ─────────
  const desktop = () => window.matchMedia("(min-width: 721px) and (pointer: fine)").matches;
  function place() {
    const panel = A.$("#tutor-panel");
    if (!desktop()) { panel.style.left = panel.style.top = ""; panel.classList.remove("placed"); return; }
    const pos = ss.get(POS_KEY);
    if (!pos) { panel.style.left = panel.style.top = ""; panel.classList.remove("placed"); return; }
    const w = panel.offsetWidth || 380, h = panel.offsetHeight || 520, m = 8;
    const x = Math.max(m, Math.min(pos.x, innerWidth - w - m)), y = Math.max(m, Math.min(pos.y, innerHeight - h - m));
    panel.style.left = x + "px"; panel.style.top = y + "px"; panel.classList.add("placed");
  }
  function bindDrag() {
    const head = A.$("#tutor-head"), panel = A.$("#tutor-panel");
    head.addEventListener("pointerdown", (e) => {
      if (!desktop() || e.button !== 0 || e.target.closest("button")) return;
      e.preventDefault();
      head.setPointerCapture(e.pointerId);
      const r = panel.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
      document.body.classList.add("tutor-dragging");
      const move = (ev) => { ss.set(POS_KEY, { x: r.left + ev.clientX - sx, y: r.top + ev.clientY - sy }); place(); };
      const up = () => { head.removeEventListener("pointermove", move); head.removeEventListener("pointerup", up); head.removeEventListener("pointercancel", up); document.body.classList.remove("tutor-dragging"); };
      head.addEventListener("pointermove", move); head.addEventListener("pointerup", up); head.addEventListener("pointercancel", up);
    });
    head.addEventListener("dblclick", () => { ss.set(POS_KEY, null); place(); });
  }

  window.Tutor = { init, refresh, open, contextChanged, forgetDocument, get isOpen() { return A ? isOpen() : false; }, _renderReply: (t) => renderReply(t) };
})();
