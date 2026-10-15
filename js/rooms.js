/*
 * STUDY ROOMS — shared practice sets built on the existing server-free group-code system.
 *
 * A room code packs the concepts, number of questions, pacing, hint setting and a seed (js/group.js),
 * so everyone who opens it builds the identical practice set with the same choice order. Nothing is
 * sent to a server:
 *   • Self-paced: everyone works through the set on their own.
 *   • Together: a shared start time; each question has a fixed window, so everyone is on the same
 *     question at the same moment (good on a call). Late joiners start at the current question.
 * Answers stay on each device. At the end, a student can CHOOSE to share a result code that contains
 * only their name and which questions they got right; the group summary is built from pasted codes.
 * Room answers are saved as ordinary practice evidence (source "room") on the student's own device.
 */
(function () {
  "use strict";
  let A = null;
  let room = null;   // decoded room + items + local state
  let tick = null;

  function init(api) {
    A = api;
    A.$("#btn-room-create").addEventListener("click", openCreate);
    A.$("#room-form").addEventListener("submit", (e) => { e.preventDefault(); create(); });
    A.$("#room-form").addEventListener("click", onFormClick);
    A.$("#room-cancel").addEventListener("click", () => A.$("#room-dialog").close());
    A.$("#screen-room").addEventListener("click", onClick);
    A.$("#screen-room").addEventListener("input", (e) => { if (e.target.id === "room-name") { const st = state(); st.name = e.target.value.slice(0, 18); save(st); } });
  }

  const C = () => window.Concepts;
  const G = () => window.Group;
  const norm = (code) => G().normalize(code);
  const conceptsOf = (mask) => C().CONCEPTS.filter((_, i) => mask & (1 << i)).map((c) => c.id);

  // ───────── create ─────────
  const form = { concepts: new Set(), count: 8, synced: false, pace: 90, startIn: 2, hints: true };
  function openCreate() {
    const L = A.learningState();
    if (!form.concepts.size) for (const r of L.recs.filter((x) => ["needs_work", "early_warning", "developing", "review_due"].includes(x.status)).slice(0, 3)) form.concepts.add(r.concept);
    renderForm();
    A.$("#room-name-in").value = A.store.get(A.KEYS.prefs, {}).name || "";
    A.$("#room-dialog").showModal();
  }
  function renderForm() {
    A.$("#room-concepts").innerHTML = C().UNITS.map((u) => `<fieldset class="rc-unit"><legend>${A.esc(u.title)}</legend>${C().CONCEPTS.filter((c) => c.unit === u.id).map((c) => `<label class="check"><input type="checkbox" data-rc="${c.id}" ${form.concepts.has(c.id) ? "checked" : ""}/> ${A.esc(c.title)}</label>`).join("")}</fieldset>`).join("");
    const seg = (id, attr, val) => { for (const b of A.$$(`#${id} button`)) { const on = b.dataset[attr] === String(val); b.classList.toggle("active", on); b.setAttribute("aria-checked", String(on)); } };
    seg("rc-count", "count", form.count); seg("rc-pace-mode", "mode", form.synced ? "synced" : "self"); seg("rc-pace", "pace", form.pace); seg("rc-start", "start", form.startIn);
    A.$("#rc-synced-opts").hidden = !form.synced;
    A.$("#rc-hints").checked = form.hints;
    const n = poolFor([...form.concepts]).length;
    A.$("#rc-note").textContent = !form.concepts.size ? "Pick at least one concept." : n < form.count ? `Only ${n} question${n === 1 ? "" : "s"} exist for these concepts, so the room will have ${n}.` : `${form.count} questions from ${form.concepts.size} concept${form.concepts.size === 1 ? "" : "s"}.`;
    A.$("#rc-go").disabled = !form.concepts.size || !n;
  }
  function onFormClick(e) {
    const t = e.target;
    const rc = t.closest("[data-rc]");
    if (rc) { if (rc.checked) form.concepts.add(rc.dataset.rc); else form.concepts.delete(rc.dataset.rc); return renderForm(); }
    const b = t.closest("button[data-count], button[data-mode], button[data-pace], button[data-start]");
    if (b) {
      if (b.dataset.count) form.count = Number(b.dataset.count);
      if (b.dataset.mode) form.synced = b.dataset.mode === "synced";
      if (b.dataset.pace) form.pace = Number(b.dataset.pace);
      if (b.dataset.start) form.startIn = Number(b.dataset.start);
      return renderForm();
    }
    if (t.id === "rc-hints") { form.hints = t.checked; return; }
    if (t.id === "rc-weak") {
      const L = A.learningState();
      form.concepts = new Set(L.recs.filter((x) => ["needs_work", "early_warning", "developing", "review_due"].includes(x.status)).slice(0, 4).map((x) => x.concept));
      return renderForm();
    }
  }
  function create() {
    if (!form.concepts.size) return;
    const mask = C().CONCEPTS.reduce((m, c, i) => (form.concepts.has(c.id) ? m | (1 << i) : m), 0);
    const start = form.synced ? Math.ceil((Date.now() + form.startIn * 60000) / 60000) * 60000 : 0;
    const code = G().encodeRoom({ concepts: mask, count: form.count, synced: form.synced, pace: form.pace, hints: form.hints, seed: Math.floor(Math.random() * 0x7ffff), start });
    const name = A.$("#room-name-in").value.trim().slice(0, 18);
    if (name) A.store.set(A.KEYS.prefs, { ...A.store.get(A.KEYS.prefs, {}), name });
    A.$("#room-dialog").close();
    join(G().decodeRoom(code), { host: true, name });
  }

  // ───────── the practice set (identical for everyone) ─────────
  function poolFor(ids) {
    const tagged = (q) => C().conceptsFor(q).some((c) => ids.includes(c));
    return [...A.MC().filter(tagged).map((q) => ["mc", q]), ...A.NR().filter(tagged).map((q) => ["nr", q])].sort((a, b) => (a[1].id < b[1].id ? -1 : 1));
  }
  function buildItems(r) {
    const rnd = G().rng(r.seed);
    const pick = A.shuffle(poolFor(conceptsOf(r.mask)), rnd).slice(0, r.count);
    return pick.map(([k, q]) => window.Practice.makeItem(k, q, undefined, k === "mc" ? { order: A.shuffle(q.c.map((_, i) => i), rnd) } : {}));
  }

  // ───────── local state (survives refresh) ─────────
  function state() {
    const s = A.store.get(A.KEYS.room, null);
    return s && room && s.code === norm(room.code) ? s : { code: room ? norm(room.code) : "", name: A.store.get(A.KEYS.prefs, {}).name || "", answers: [], checked: [], started: 0, done: false, codes: [] };
  }
  function save(s) { A.store.set(A.KEYS.room, s); }

  function join(r, opts = {}) {
    clearInterval(tick);
    room = { ...r, items: null, host: !!opts.host };
    room.items = buildItems(room);
    const st = state();
    if (opts.name && !st.name) st.name = opts.name;
    save(st);
    try { history.replaceState(null, "", `#r-${norm(r.code)}`); } catch { /* ignore */ }
    show();
  }

  function show() {
    if (!room) { const s = A.store.get(A.KEYS.room, null); const r = s && G().decodeRoom(s.code); if (!r) return A.go("home"); return join(r); }
    A.show("room");
    render();
    clearInterval(tick);
    tick = setInterval(onTick, 1000);
  }

  const allowsTutor = () => !!(room && room.hints);
  const slotNow = () => Math.floor((Date.now() - room.start) / (room.pace * 1000));

  // ───────── rendering ─────────
  function render() {
    const st = state();
    const el = A.$("#room-main");
    const ids = conceptsOf(room.mask);
    A.$("#room-code").textContent = room.code;
    A.$("#room-meta").innerHTML = [
      `${room.items.length} questions`,
      ids.length <= 3 ? ids.map((id) => A.esc(C().get(id).title)).join(", ") : `${ids.length} concepts`,
      room.synced ? `Together · ${room.pace} s per question` : "Self-paced",
      room.hints ? "Hints and tutor on" : "No hints or tutor",
    ].map((t) => `<span>${t}</span>`).join("");
    if (document.body.dataset.screen !== "room") return;
    const finished = st.done || (room.synced && slotNow() >= room.items.length);
    if (finished) return renderEnd(st);
    if (room.synced && Date.now() < room.start) {
      window.Practice.stop(el);
      el.innerHTML = `<div class="room-wait card">
        <p class="eyebrow">Starts together</p>
        <div class="cd-value" id="room-cd">${A.clock((room.start - Date.now()) / 1000)}</div>
        <p class="muted">at ${new Date(room.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}. Everyone sees question 1 at the same moment, then a new question every ${room.pace} seconds. Answer in time; the explanation appears for everyone when time's up.</p>
        ${nameField(st)}</div>`;
      return;
    }
    if (!room.synced && !st.started) {
      window.Practice.stop(el);
      el.innerHTML = `<div class="room-wait card"><p class="eyebrow">Self-paced room</p><h2>${room.items.length} questions, at your own pace</h2>
        <p class="muted">Everyone with this code gets these exact questions in the same order, so you can talk them through. ${room.hints ? "Hints and the tutor are allowed." : "The host turned hints and the tutor off for this room."}</p>
        ${nameField(st)}<div class="lesson-actions"><button class="btn btn-primary" data-room="start" type="button">Start</button></div></div>`;
      return;
    }
    run(st);
  }
  function nameField(st) {
    return `<div class="field room-name"><label class="field-label" for="room-name">Your name <span class="faint small">(only used in a result code you choose to share)</span></label><input class="text-input" id="room-name" maxlength="18" value="${A.esc(st.name || "")}" placeholder="e.g. Aubrey" /></div>`;
  }

  function run(st) {
    const el = A.$("#room-main");
    if (el._run && el._run.roomCode === room.code) return syncRun(el._run);
    const r = window.Practice.run(el, {
      id: "room-" + norm(room.code), source: "room", level: "normal", room: norm(room.code),
      crumb: "Study room", title: room.synced ? "Together" : "Practice set", items: room.items, exitLabel: "Leave room",
      tutor: room.hints,
      hint: room.hints ? (it) => hintFor(it) : null,
      timer: room.synced ? (rr) => timerHTML(rr) : null,
      waiting: room.synced ? (rr) => (slotNow() <= rr.i && rr.i < rr.items.length - 1 ? `Next question in ${A.clock(room.start / 1000 + (rr.i + 1) * room.pace - Date.now() / 1000)}` : rr.i === rr.items.length - 1 && slotNow() < rr.items.length ? `Results in ${A.clock(room.start / 1000 + rr.items.length * room.pace - Date.now() / 1000)}` : null) : null,
      onChecked: (rr) => { const s = state(); s.answers = rr.answers.map((a) => (a ? { choice: a.choice, response: a.response, correct: !!a.correct } : null)); s.checked = rr.checked.slice(); save(s); },
      onExit: leave,
      end: () => { const s = state(); s.done = true; save(s); setTimeout(() => render(), 0); return ""; },
    });
    r.roomCode = room.code;
    // restore answers after a refresh (already recorded, so no double counting)
    st.checked.forEach((c, k) => { if (c && st.answers[k]) { r.answers[k] = { ...st.answers[k] }; r.checked[k] = true; } });
    if (room.synced) syncRun(r);
    else { r.i = Math.min(r.items.length, st.checked.filter(Boolean).length); window.Practice.refresh(r); }
  }

  // Together mode: keep everyone on the same question; time-outs are shown as unanswered (not saved as evidence).
  function syncRun(r) {
    const slot = Math.min(slotNow(), r.items.length);
    let changed = false;
    while (r.i < slot) {
      if (!r.checked[r.i]) { r.answers[r.i] = { timedOut: true, correct: false, blank: true }; r.checked[r.i] = true; }
      r.i++; changed = true;
    }
    if (changed || !r._painted) { r._painted = true; window.Practice.refresh(r); if (window.Tutor) window.Tutor.contextChanged(); }
    else { const tb = A.$("#room-timer"); if (tb) tb.outerHTML = timerHTML(r); const w = A.$("#room-main .quiz-nav button[disabled]"); if (w && r.waiting(r)) w.textContent = r.waiting(r); }
  }
  function timerHTML(r) {
    if (!room.synced || r.i >= r.items.length) return "";
    const end = room.start + (r.i + 1) * room.pace * 1000;
    const left = Math.max(0, (end - Date.now()) / 1000);
    return `<div class="room-timer" id="room-timer"><span>${r.checked[r.i] ? "Waiting for the group" : "Time left"}</span><span class="rt-bar"><i style="width:${(left / room.pace) * 100}%"></i></span><b>${A.clock(left)}</b></div>`;
  }
  function hintFor(it) {
    const c = C().get(it.concepts[0]);
    if (!c) return "Re-read the question and write down what it's asking for.";
    const r = c.rules[0];
    return `<b>Hint · ${A.esc(c.title)}:</b> ${A.esc(r.name)} ${A.tex(r.tex)}. <button class="btn-inline" data-lesson="${c.id}" type="button">Open the lesson</button>`;
  }

  function onTick() {
    if (document.body.dataset.screen !== "room" || !room) { clearInterval(tick); return; }
    if (!room.synced) return;
    const cd = A.$("#room-cd");
    if (cd) { if (Date.now() >= room.start) render(); else cd.textContent = A.clock((room.start - Date.now()) / 1000); return; }
    const el = A.$("#room-main");
    if (el._run && el._run.roomCode === room.code) {
      if (slotNow() >= room.items.length) { const s = state(); s.done = true; save(s); return render(); }
      syncRun(el._run);
    }
  }

  // ───────── results ─────────
  function marksOf(st) { return room.items.map((_, k) => (st.checked[k] && st.answers[k] && !st.answers[k].timedOut ? !!st.answers[k].correct : null)); }

  function renderEnd(st) {
    const el = A.$("#room-main");
    window.Practice.stop(el);
    const mine = marksOf(st);
    const right = mine.filter((m) => m === true).length;
    const myCode = G().encodeRoomResult({ room: room.code, name: st.name || "Me", marks: mine });
    const others = (st.codes || []).map((c) => G().decodeRoomResult(c)).filter((x) => x && x.room === norm(room.code));
    // one entry per name (the latest pasted code wins), plus me
    const byName = new Map();
    for (const o of others) byName.set(o.name.toLowerCase(), o);
    byName.delete((st.name || "Me").toLowerCase());
    const people = [{ name: st.name || "Me", marks: mine, me: true }, ...byName.values()];
    const perQ = room.items.map((it, k) => { const ans = people.map((p) => p.marks[k]).filter((m) => m !== null && m !== undefined); return { it, k, n: ans.length, right: ans.filter(Boolean).length }; });
    const weakQs = perQ.filter((x) => x.n && x.right / x.n < 0.6);
    const weakConcepts = [...new Set(weakQs.flatMap((x) => x.it.concepts))];
    el.innerHTML = `
      <div class="room-end">
        <section class="card">
          <p class="eyebrow">Your result · only on this device</p>
          <h2>${right} of ${room.items.length} correct</h2>
          ${window.Practice.reviewList({ items: room.items, answers: st.answers, checked: st.checked })}
          <p class="faint small">${mine.filter((m) => m === null).length ? `${mine.filter((m) => m === null).length} unanswered (time ran out or you joined late). ` : ""}Your answers here count toward your own mastery and review schedule.</p>
        </section>
        <section class="card">
          <p class="eyebrow">Group summary · only what people choose to share</p>
          <h2>Compare with your group</h2>
          <p class="small muted">Your result code contains <b>only your name and which questions you got right</b>. No answers, history or files. Share it only if you want to.</p>
          <div class="join-row"><input class="text-input code-input small-code" id="room-mycode" readonly value="${A.esc(myCode)}" aria-label="Your result code" /><button class="btn btn-secondary" data-room="copy" type="button">Copy</button></div>
          <p class="copy-note" id="room-copy-note" role="status"></p>
          <label class="field-label" for="room-codes">Paste friends' result codes (one per line)</label>
          <textarea class="text-input" id="room-codes" rows="3" placeholder="CR-...">${A.esc((st.codes || []).join("\n"))}</textarea>
          <div class="gb-add"><button class="btn btn-secondary btn-sm" data-room="add" type="button">Update the summary</button><span class="form-error" id="room-codes-err" role="alert"></span></div>
          ${people.length > 1 ? `
          <table class="score-table room-board"><thead><tr><th scope="col">Name</th><th scope="col">Correct</th></tr></thead><tbody>${people.slice().sort((a, b) => b.marks.filter(Boolean).length - a.marks.filter(Boolean).length).map((p) => `<tr class="${p.me ? "me" : ""}"><td>${A.esc(p.name)}${p.me ? " (you)" : ""}</td><td>${p.marks.filter(Boolean).length} / ${room.items.length}</td></tr>`).join("")}</tbody></table>
          <div class="table-scroll"><table class="q-matrix"><thead><tr><th></th>${room.items.map((_, k) => `<th scope="col">Q${k + 1}</th>`).join("")}</tr></thead><tbody>
            <tr><th scope="row">Group</th>${perQ.map((x) => `<td class="gc ${!x.n ? "" : x.right === x.n ? "full" : x.right ? "part" : "none"}">${x.n ? `${x.right}/${x.n}` : "–"}</td>`).join("")}</tr></tbody></table></div>
          ${weakConcepts.length ? `<div class="gb-discuss"><b>Concepts the group may need to review:</b> ${weakConcepts.map((id) => `<button class="concept-chip" data-lesson="${id}" type="button">${A.esc(C().get(id).title)}</button>`).join(" ")}<p class="faint small">Based on questions fewer than 60% of the group got right (${weakQs.map((x) => `Q${x.k + 1}`).join(", ")}).</p></div>` : `<p class="small muted">Everyone who shared did well on every question.</p>`}` : `<p class="faint small">Paste at least one friend's code to see the group summary.</p>`}
        </section>
        <div class="lesson-actions"><button class="btn btn-secondary" data-room="leave" type="button">Leave room</button>${!room.synced ? `<button class="btn btn-quiet" data-room="restart" type="button">Clear my answers and redo</button>` : ""}</div>
      </div>`;
    if (window.Tutor) window.Tutor.contextChanged();
  }

  function onClick(e) {
    const t = e.target.closest("[data-room]");
    if (!t) return;
    const act = t.dataset.room, st = state();
    if (act === "start") { st.started = Date.now(); st.name = (A.$("#room-name") || {}).value || st.name; save(st); render(); }
    else if (act === "copy-code") A.copyText(room.code, null, A.$("#room-share-note"));
    else if (act === "copy-link") A.copyText(location.origin + location.pathname + "#r-" + norm(room.code), null, A.$("#room-share-note"));
    else if (act === "copy") A.copyText(A.$("#room-mycode").value, A.$("#room-mycode"), A.$("#room-copy-note"));
    else if (act === "add") {
      const lines = A.$("#room-codes").value.split(/\s+/).map((x) => x.trim()).filter(Boolean);
      const ok = [], bad = [];
      for (const l of lines) { const d = G().decodeRoomResult(l); if (d && d.room === norm(room.code)) ok.push(l); else bad.push(l); }
      st.codes = [...new Set(ok)]; save(st);
      renderEnd(st);
      if (bad.length) A.$("#room-codes-err").textContent = `${bad.length} code${bad.length === 1 ? " isn't" : "s aren't"} from this room or ${bad.length === 1 ? "is" : "are"} damaged, so ${bad.length === 1 ? "it was" : "they were"} skipped.`;
    } else if (act === "leave") leave();
    else if (act === "restart") { A.store.del ? A.store.del(A.KEYS.room) : A.store.set(A.KEYS.room, null); const el = A.$("#room-main"); window.Practice.stop(el); render(); }
  }

  async function leave() {
    const st = state();
    if (!st.done && st.checked.some(Boolean) && !(await A.confirmDialog("Leave this room?", "Your answers so far stay saved on this device. You can come back with the same code.", "Leave", "Stay"))) return;
    clearInterval(tick);
    window.Practice.stop(A.$("#room-main"));
    room = null;
    try { history.replaceState(null, "", location.pathname); } catch { /* ignore */ }
    A.go("home");
  }

  function context() {
    if (!room) return { type: "room", title: "Study room", text: "" };
    const pc = window.Practice.context();
    return {
      type: "study_room", title: `Study room (${room.synced ? "together" : "self-paced"})`,
      text: `Shared practice set on: ${conceptsOf(room.mask).map((id) => C().get(id).title).join(", ")}. Hints and tutoring are allowed in this room. Other students' answers are not available.`,
      concepts: conceptsOf(room.mask), focus: pc ? pc.focus : undefined,
    };
  }

  window.Rooms = { init, join, show, context, allowsTutor, get active() { return room; } };
})();
