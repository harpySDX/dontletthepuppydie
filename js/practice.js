/*
 * PRACTICE — one shared question runner for every practice mode:
 *   concept quizzes (Library) · daily review + Mistake Notebook retries (Review) · study rooms.
 *
 * Questions come from the existing verified banks. Every checked answer is saved once to the
 * practice log (KEYS.practice) with the response, so it feeds the mastery model, the spaced-repetition
 * schedule and the Mistake Notebook. Nothing here calls the AI.
 */
(function () {
  "use strict";
  let A = null;
  let active = null; // the run on screen (for the tutor's page context)

  function init(api) { A = api; }
  const C = () => window.Concepts;

  // ───────── items ─────────
  function makeItem(kind, q, partKey, extra = {}) {
    const part = kind === "wr" ? q.parts.find((p) => p.key === partKey) : null;
    if (kind === "wr" && !part) return null;
    return {
      kind, q, part, partKey: part ? part.key : null,
      order: kind === "mc" ? A.shuffle(q.c.map((_, i) => i)) : null,
      concepts: C().conceptsFor(q, part ? part.key : undefined),
      ...extra,
    };
  }
  // A saved record (or mistake) → an item for the same question, if it still exists in the banks
  function itemFor(kind, qid, partKey, extra) {
    const q = A.BANKS[kind] && A.BANKS[kind].get(qid);
    return q ? makeItem(kind, q, partKey, extra) : null;
  }

  // ───────── grading & saving ─────────
  function grade(item, ans) {
    if (!ans) return { correct: false, earned: 0, max: 1, note: "", blank: true };
    if (item.kind === "mc") return { correct: ans.choice === 0, earned: ans.choice === 0 ? 1 : 0, max: 1, note: "", blank: ans.choice === undefined };
    if (item.kind === "nr") {
      const g = A.Check.grade({ kind: "number", answer: item.q.answer, marks: 1 }, ans.response);
      return { correct: g.earned >= 1, earned: g.earned, max: 1, note: g.note || "", blank: g.verdict === "blank" };
    }
    const g = A.Check.grade(item.part, ans.response);
    return { correct: g.earned >= g.max, earned: g.earned, max: g.max, note: g.note || "", blank: g.verdict === "blank", verdict: g.verdict };
  }

  function record(item, ans, meta) {
    const log = A.store.get(A.KEYS.practice, []);
    // one record per question per run: re-checking can't double-count
    if (log.some((x) => x.quiz === meta.id && x.qid === item.q.id && (x.part || null) === (item.partKey || null))) return;
    log.push({
      date: Date.now(), quiz: meta.id, source: meta.source || "quiz", level: meta.level || "normal", room: meta.room || undefined,
      qid: item.q.id, part: item.partKey || undefined, kind: item.kind, concepts: item.concepts,
      correct: ans.correct, note: ans.note || undefined, blank: !!ans.blank,
      response: item.kind === "mc" ? undefined : String(ans.response || "").slice(0, 200),
      choice: item.kind === "mc" ? ans.choice : undefined,
    });
    A.store.set(A.KEYS.practice, log.slice(-4000));
  }

  // ───────── rendering ─────────
  function questionHTML(item, ans, checked) {
    const q = item.q;
    if (item.kind === "mc") {
      return `<div class="q-text">${A.renderMath(q.q)}</div><div class="choices">${item.order.map((o, k) => {
        const cls = ["choice", ans && ans.choice === o ? "selected" : "", checked && o === 0 ? "is-correct" : "", checked && ans && ans.choice === o && o !== 0 ? "is-wrong" : ""].join(" ");
        return `<button type="button" class="${cls}" data-mc="${o}" ${checked ? "disabled" : ""}><span class="choice-letter">${A.LETTERS[k]}</span><span class="choice-body">${A.renderMath(q.c[o])}</span></button>`;
      }).join("")}</div>`;
    }
    if (item.kind === "nr") {
      return `<div class="q-text">${A.renderMath(q.q)}</div>
        <div class="nr-box"><label class="answer-label" for="pr-nr">Your answer <span class="muted">· ${A.esc(q.fmt || "Number")}</span></label>
        <input class="answer-input nr-input" id="pr-nr" data-kind="number" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${A.esc(ans ? ans.response || "" : "")}" ${checked ? "disabled" : ""} />
        <div class="preview" data-preview="nr"></div></div>`;
    }
    const intro = `<div class="q-text q-intro">${A.renderMath(q.intro)}</div>`;
    let part = A.partHTML(item.part, ans ? ans.response || "" : "");
    if (checked) part = part.replace(/<input /g, "<input disabled ").replace(/<button type="button" data-ins/g, '<button type="button" disabled data-ins').replace(/role="radio" data-choice/g, 'role="radio" disabled data-choice');
    return intro + `<div class="wr-parts">${part}</div>`;
  }

  function feedbackHTML(item, ans, opts = {}) {
    const q = item.q;
    let key = "";
    if (!ans.correct) {
      if (item.kind === "nr") key = `<p class="fb-key"><span class="cmp-label">Answer</span> ${A.tex(String(q.answer))}</p>`;
      if (item.kind === "wr") key = `<p class="fb-key"><span class="cmp-label">Answer</span> ${A.keyTeX(item.part)}</p>`;
    }
    const why = item.kind === "wr"
      ? `<details class="fb-solution"${ans.correct ? "" : " open"}><summary>Worked solution</summary><div>${(Array.isArray(q.solution) ? q.solution : [q.solution]).map((x) => `<p>${A.renderMath(x)}</p>`).join("")}</div></details>`
      : `<div class="quiz-why">${A.renderMath(q.e)}</div>`;
    const lesson = item.concepts[0];
    return `<div class="quiz-fb ${ans.correct ? "ok" : "bad"}" role="status">
      <p class="fb-title"><b>${ans.correct ? "Correct." : ans.blank ? "No answer." : item.kind === "wr" && ans.earned > 0 ? "Partly right." : "Not quite."}</b>${ans.note ? ` <span class="fb-note">${A.esc(ans.note)}</span>` : ""}</p>
      ${!ans.correct && item.kind === "mc" && q.why && q.why[ans.choice] ? `<p class="fb-note">Likely slip: ${A.renderMath(q.why[ans.choice])}</p>` : ""}
      ${key}${why}
      <div class="quiz-fb-actions">
        ${opts.tutor !== false ? `<button class="btn btn-quiet btn-sm" data-pr="explain" type="button">✦ Explain with the tutor</button>` : ""}
        ${!ans.correct && lesson && opts.lessonLinks !== false ? `<button class="btn btn-quiet btn-sm" data-lesson="${lesson}" type="button">Open the lesson: ${A.esc(C().get(lesson).title)}</button>` : ""}
      </div>
    </div>`;
  }

  // ───────── a run ─────────
  // opts: { id, source, level, title, crumb, items, tutor, hint(item)→html, end(run)→html, onAct(act, run), onExit() }
  function run(container, opts) {
    const r = { ...opts, container, i: 0, answers: [], checked: [], hintShown: [], id: opts.id || "run-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) };
    active = r;
    if (!container.dataset.prBound) bind(container);
    container._run = r;
    render(r);
    if (window.Tutor) window.Tutor.contextChanged();
    return r;
  }

  function bind(container) {
    container.dataset.prBound = "1";
    container.addEventListener("click", (e) => {
      const r = container._run;
      if (!r) return;
      const it = r.items[r.i];
      const mc = e.target.closest("[data-mc]");
      if (mc && !r.checked[r.i]) { r.answers[r.i] = { choice: Number(mc.dataset.mc) }; return render(r); }
      const seg = e.target.closest("[data-choice][data-value]");
      if (seg && !r.checked[r.i]) { r.answers[r.i] = { response: seg.dataset.value }; return render(r); }
      const ins = e.target.closest("[data-ins]");
      if (ins && !r.checked[r.i]) { const inp = container.querySelector(".wr-part input, #pr-nr"); if (inp) A.insertAtCursor(inp, ins.dataset.ins); return; }
      const b = e.target.closest("[data-pr]");
      if (!b) return;
      const act = b.dataset.pr;
      if (act === "check") check(r);
      else if (act === "next" && r.waiting && r.waiting(r)) return;
      else if (act === "next") { r.i++; render(r); if (window.Tutor) window.Tutor.contextChanged(); }
      else if (act === "hint") { r.hintShown[r.i] = true; render(r); }
      else if (act === "exit") { if (r.onExit) r.onExit(r); }
      else if (act === "explain") {
        const ans = r.answers[r.i] || {};
        window.Tutor.open({ mode: "explain", prompt: ans.correct ? "Can you explain why this answer is right, step by step?" : "Why was my answer wrong? Explain the right method.", send: true });
      } else if (r.onAct) r.onAct(act, r, b);
    });
    container.addEventListener("mousedown", (e) => { if (e.target.closest("[data-ins]")) e.preventDefault(); });
    container.addEventListener("input", (e) => {
      const r = container._run;
      if (!r || r.checked[r.i]) return;
      const t = e.target;
      if (t.matches("#pr-nr, .wr-part input")) {
        r.answers[r.i] = t.value.trim() ? { response: t.value } : undefined;
        A.updatePreview(t);
        const btn = container.querySelector('[data-pr="check"]'); if (btn) btn.disabled = !t.value.trim();
      }
    });
    container.addEventListener("keydown", (e) => {
      const r = container._run;
      if (!r || e.key !== "Enter" || !e.target.matches("#pr-nr, .wr-part input")) return;
      e.preventDefault();
      if (!r.checked[r.i]) check(r); else if (!(r.waiting && r.waiting(r))) { r.i++; render(r); }
    });
  }

  function check(r) {
    const it = r.items[r.i], ans = r.answers[r.i];
    if (!ans || r.checked[r.i]) return;
    Object.assign(ans, grade(it, ans));
    r.checked[r.i] = true;
    record(it, ans, r);
    if (r.onChecked) r.onChecked(r, it, ans);
    render(r);
    if (window.Tutor) window.Tutor.contextChanged();
  }

  function render(r) {
    const el = r.container;
    if (r.i >= r.items.length) {
      el.innerHTML = r.end ? r.end(r) : defaultEnd(r);
      return;
    }
    const it = r.items[r.i], ans = r.answers[r.i], checked = !!r.checked[r.i];
    const tag = it.tag ? `<span class="pr-tag">${A.esc(it.tag)}</span>` : "";
    const concept = C().get(it.concepts[0]);
    el.innerHTML = `
      <div class="pr">
        <div class="pr-head">
          <div><p class="eyebrow">${A.esc(r.crumb || "Practice")}</p><h1 class="pr-title">${A.esc(r.title || "Practice")}</h1></div>
          <button class="btn btn-ghost btn-sm" data-pr="exit" type="button">${r.exitLabel || "Leave"}</button>
        </div>
        <div class="pr-progress"><span class="pr-count">Question ${r.i + 1} of ${r.items.length}</span>
          <div class="quiz-dots" aria-hidden="true">${r.items.map((_, k) => `<i class="${k < r.i || (k === r.i && checked) ? (r.answers[k] && r.answers[k].correct ? "ok" : "bad") : k === r.i ? "on" : ""}"></i>`).join("")}</div>
        </div>
        ${r.timer ? r.timer(r) : ""}
        <article class="paper quiz-card">
          <div class="pr-meta">${tag}${concept ? `<span class="pr-concept">${A.esc(concept.title)}</span>` : ""}</div>
          ${questionHTML(it, ans, checked)}
        </article>
        ${!checked && r.hint && !r.hintShown[r.i] ? `<button class="btn btn-quiet btn-sm pr-hint-btn" data-pr="hint" type="button">Show a hint</button>` : ""}
        ${!checked && r.hint && r.hintShown[r.i] ? `<div class="callout tip">${r.hint(it)}</div>` : ""}
        ${checked ? feedbackHTML(it, ans, { tutor: r.tutor }) : ""}
        <div class="quiz-nav">${checked && r.waiting && r.waiting(r)
          ? `<button class="btn btn-secondary" type="button" disabled>${A.esc(r.waiting(r))}</button>`
          : checked
          ? `<button class="btn btn-primary" data-pr="next" type="button">${r.i === r.items.length - 1 ? "See results" : "Next question"}</button>`
          : `<button class="btn btn-primary" data-pr="check" type="button" ${ans && (ans.choice !== undefined || String(ans.response || "").trim()) ? "" : "disabled"}>Check answer</button>`}</div>
      </div>`;
    const inp = el.querySelector("#pr-nr, .wr-part input");
    if (inp) { if (inp.value) A.updatePreview(inp); if (!checked) inp.focus({ preventScroll: true }); }
  }

  function summary(r) {
    const done = r.answers.map((a, k) => (r.checked[k] ? a : null));
    const right = done.filter((a) => a && a.correct).length;
    return { right, n: r.items.length, answered: done.filter(Boolean).length };
  }

  function reviewList(r) {
    return `<ul class="quiz-review">${r.items.map((it, k) => {
      const a = r.answers[k];
      const ok = a && r.checked[k] && a.correct;
      const text = it.kind === "wr" ? `${A.renderMath(it.q.intro)} <span class="muted">${A.renderMath(it.part.prompt)}</span>` : A.renderMath(it.q.q);
      return `<li class="${ok ? "ok" : "bad"}"><span>${ok ? "✓" : r.checked[k] ? "✗" : "–"}</span><span>${text}</span></li>`;
    }).join("")}</ul>`;
  }

  function defaultEnd(r) {
    const s = summary(r);
    return `<div class="pr"><p class="eyebrow">${A.esc(r.crumb || "Practice")}</p><h1>${s.right} / ${s.n} correct</h1>${reviewList(r)}
      <div class="lesson-actions"><button class="btn btn-primary" data-pr="exit" type="button">Done</button></div></div>`;
  }

  // Tutor context for whatever question is on screen. The verified answer is only shared after checking.
  function context() {
    const r = active;
    if (!r || !r.container.isConnected || r.container.closest("[hidden]") || r.i >= r.items.length) return null;
    const it = r.items[r.i], ans = r.answers[r.i], checked = !!r.checked[r.i];
    const q = it.q;
    const focus = {
      kind: `${r.title || "Practice"}: question ${r.i + 1} of ${r.items.length} (practice, tutoring allowed)`,
      question: it.kind === "wr" ? `${A.texPlain(q.intro)} ${A.texPlain(it.part.prompt)}` : A.texPlain(q.q),
      choices: it.kind === "mc" ? it.order.map((o, k) => `${A.LETTERS[k]}. ${A.texPlain(q.c[o])}`) : undefined,
      answered: checked,
    };
    if (checked) {
      focus.studentAnswer = it.kind === "mc" ? `${A.LETTERS[it.order.indexOf(ans.choice)]}. ${A.texPlain(q.c[ans.choice])}` : ans.response;
      focus.verifiedAnswer = it.kind === "mc" ? `${A.LETTERS[it.order.indexOf(0)]}. ${A.texPlain(q.c[0])}` : it.kind === "nr" ? String(q.answer) : plainKey(it.part);
      focus.verifiedExplanation = it.kind === "wr" ? (Array.isArray(q.solution) ? q.solution : [q.solution]).map(A.texPlain).join(" ") : A.texPlain(q.e);
      if (ans.note) focus.markerNote = ans.note;
    }
    return { focus, concepts: it.concepts, title: r.title };
  }

  const plainKey = (p) => p.kind === "set" ? (p.answer.join(", ") || "none") : p.kind === "restriction" ? `x ${p.answer.op} ${p.answer.value}` : String(p.ansTex || p.answer);
  function stop(container) { if (container && container._run === active) active = null; if (container) container._run = null; }

  window.Practice = { refresh: (r) => render(r), plainKey, init, makeItem, itemFor, grade, record, questionHTML, feedbackHTML, run, summary, reviewList, context, stop, get active() { return active; } };
})();
