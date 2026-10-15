/*
 * LEARNING — deterministic learning evidence, concept status and recommendations.
 * No AI here: every number shown to the student is computed from real records.
 *
 *   evidence records ← test attempts (per question / per written part) + concept-quiz answers
 *   profile          ← per-concept counts, accuracy, recent vs earlier, recurring errors, recency
 *   recommendations  ← ranked, explainable, with time estimates and a way to verify learning
 *   documents        ← keyword/pattern coverage of uploaded study material against the concepts
 */
(function (root) {
  "use strict";

  const DAY = 86400000;

  // ───────── evidence ─────────
  // deps: { qOf(item), gradeParts(item) → [{earned,max,verdict,note}], conceptsFor(q, partKey) }
  // One record per answered question (or written-response part). Records carry the response so the
  // Mistake Notebook can show what was written, and `level` so harder evidence is kept separate.
  function buildEvidence(history, practice, deps) {
    const recs = [];
    for (const t of history || []) {
      for (const it of t.items || []) {
        const q = deps.qOf(it);
        if (!q) continue;
        const base = { date: t.date, session: t.id, source: "test", level: t.level || "normal", qid: q.id, kind: it.kind, attempt: t.id };
        if (it.kind === "wr" && q.parts) {
          const grades = deps.gradeParts(it);
          q.parts.forEach((p, k) => {
            const g = grades[k];
            if (!g) return;
            recs.push({ ...base, part: p.key, concepts: deps.conceptsFor(q, p.key), earned: g.earned, max: g.max, blank: g.verdict === "blank", verdict: g.verdict, note: g.note || "", response: (it.responses || {})[p.key] || "" });
          });
        } else {
          const blank = it.kind === "mc" ? it.chosen === null : !String(it.response || "").trim();
          recs.push({ ...base, concepts: deps.conceptsFor(q), earned: it.earned, max: it.max || 1, blank, verdict: blank ? "blank" : it.earned >= (it.max || 1) ? "right" : "wrong", response: it.kind === "mc" ? it.chosen : it.response || "" });
        }
      }
    }
    for (const p of practice || []) {
      const blank = p.blank === true;
      recs.push({
        date: p.date, session: p.room ? "room-" + p.room : p.quiz, source: p.source || "quiz", level: p.level || "normal", qid: p.qid, part: p.part, kind: p.kind,
        concepts: p.concepts, earned: p.correct ? 1 : 0, max: 1, blank, verdict: p.correct ? "right" : blank ? "blank" : "wrong", note: p.note || "",
        response: p.kind === "mc" || p.choice !== undefined ? p.choice : p.response, attempt: p.quiz,
      });
    }
    return recs.sort((a, b) => a.date - b.date);
  }

  // ───────── spaced repetition (per concept) ─────────
  // A transparent Leitner-style schedule, replayed from the evidence every time (so it reschedules
  // itself whenever new answers arrive). Each practice session on a concept moves it between steps:
  //   session score ≥ 80% → up one step · 50–79% → stay (at least step 1) · < 50% → back to step 0
  // Step → days until the next review.
  const INTERVALS = [1, 1, 3, 7, 14, 30];
  function scheduleFor(rs, now) {
    // rs: this concept's core (non-Challenge) records, oldest first
    const sessions = [];
    for (const r of rs) {
      let s = sessions.find((x) => x.id === r.session);
      if (!s) { s = { id: r.session, date: r.date, earned: 0, max: 0 }; sessions.push(s); }
      s.earned += r.earned; s.max += r.max; s.date = Math.max(s.date, r.date);
    }
    sessions.sort((a, b) => a.date - b.date);
    if (!sessions.length) return { state: "new", step: null, due: null, overdueDays: null, history: [] };
    let step = 0;
    const history = [];
    for (const s of sessions) {
      const score = s.max ? s.earned / s.max : 0;
      step = score >= 0.8 ? Math.min(5, step + 1) : score >= 0.5 ? Math.max(1, step) : 0;
      history.push({ date: s.date, earned: s.earned, max: s.max, step });
    }
    const last = sessions[sessions.length - 1].date;
    const interval = INTERVALS[step];
    const due = startOfDay(last) + interval * DAY;
    const overdueDays = Math.floor((startOfDay(now) - due) / DAY);
    return { state: step <= 1 ? "learning" : "review", step, interval, last, due, overdueDays, isDue: overdueDays >= 0, history };
  }
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

  // ───────── profile (evidence-based mastery) ─────────
  // Confident requires ALL of: moderate+ evidence (≥3 answers over ≥2 sessions), ≥3 different questions,
  // ≥85% overall and ≥80% recently, and at least one successful session after a gap of 2+ days
  // (proof it was remembered, not just fresh). Missing only the variety or the delayed check → "consolidating".
  const GAP = 2 * DAY;
  function profile(records, conceptIds, now = Date.now()) {
    const out = {};
    for (const id of conceptIds) out[id] = { id, records: [] };
    for (const r of records) for (const c of r.concepts || []) if (out[c]) out[c].records.push(r);

    for (const id of conceptIds) {
      const p = out[id];
      const all = p.records.sort((a, b) => a.date - b.date);
      const rs = all.filter((r) => r.level !== "challenge");
      const hard = all.filter((r) => r.level === "challenge");
      const sum = (xs, k) => xs.reduce((s, r) => s + r[k], 0);
      p.questions = rs.length;
      p.earned = sum(rs, "earned");
      p.max = sum(rs, "max");
      p.accuracy = p.max ? p.earned / p.max : null;
      const sessions = [...new Set(rs.map((r) => r.session))];
      p.sessions = sessions.length;
      const lastSessions = new Set(sessions.slice(-2));
      const recent = rs.filter((r) => lastSessions.has(r.session)), earlier = rs.filter((r) => !lastSessions.has(r.session));
      p.recentAccuracy = sum(recent, "max") ? sum(recent, "earned") / sum(recent, "max") : null;
      p.earlierAccuracy = sum(earlier, "max") ? sum(earlier, "earned") / sum(earlier, "max") : null;
      const lossSessions = new Set(rs.filter((r) => r.earned < r.max).map((r) => r.session));
      p.lossSessions = lossSessions.size;
      p.recurring = lossSessions.size >= 2;
      p.blanks = rs.filter((r) => r.blank).length;
      p.distinct = new Set([...rs, ...hard.filter((r) => r.earned >= r.max)].map((r) => r.qid + (r.part ? "#" + r.part : ""))).size;
      p.hardRight = hard.filter((r) => r.earned >= r.max).length;
      p.hardTotal = hard.length;
      p.lastPractised = all.length ? all[all.length - 1].date : null;
      p.daysSince = p.lastPractised ? Math.floor((now - p.lastPractised) / DAY) : null;
      p.quizAttempts = rs.filter((r) => r.source !== "test").length;
      p.schedule = scheduleFor(rs, now);
      // delayed retrievals: a session scoring ≥ 80% that came 2+ days after the previous session on this concept
      const hist = p.schedule.history;
      p.retrievals = hist.filter((h, i) => i > 0 && h.max && h.earned / h.max >= 0.8 && h.date - hist[i - 1].date >= GAP).length;

      p.evidence = !rs.length ? "none" : rs.length >= 6 && p.sessions >= 3 ? "strong" : rs.length >= 3 && p.sessions >= 2 ? "moderate" : "low";
      p.status = statusOf(p);
      p.log = all.slice(-40).map((r) => ({ date: r.date, source: r.source, level: r.level, qid: r.qid, part: r.part, earned: r.earned, max: r.max, session: r.session }));
      delete p.records;
    }
    return out;
  }

  function statusOf(p) {
    if (p.evidence === "none") return "not_attempted";
    if (p.evidence === "low") return p.accuracy < 0.5 ? "early_warning" : "insufficient";
    if (p.earlierAccuracy !== null && p.recentAccuracy !== null && p.earlierAccuracy < 0.7 && p.recentAccuracy - p.earlierAccuracy >= 0.2) return "improving";
    if (p.accuracy < 0.6 || (p.recurring && p.recentAccuracy !== null && p.recentAccuracy < 0.75)) return "needs_work";
    if (p.accuracy >= 0.85 && (p.recentAccuracy === null || p.recentAccuracy >= 0.8)) {
      const proven = p.distinct >= 3 && p.retrievals >= 1;
      if (p.schedule.isDue && p.schedule.overdueDays >= 1) return "review_due";
      return proven ? "confident" : "consolidating";
    }
    return "developing";
  }

  const STATUS = {
    needs_work: { label: "Needs work", tone: "low", group: "attention" },
    early_warning: { label: "Early warning", tone: "low", group: "attention" },
    developing: { label: "Developing", tone: "mid", group: "progress" },
    improving: { label: "Improving", tone: "good", group: "progress" },
    consolidating: { label: "Strong, not yet proven", tone: "good", group: "progress" },
    review_due: { label: "Due for review", tone: "mid", group: "progress" },
    confident: { label: "Confident", tone: "good", group: "mastered" },
    insufficient: { label: "Not enough evidence", tone: "none", group: "unknown" },
    not_attempted: { label: "Not started", tone: "none", group: "unknown" },
  };

  const pct = (x) => (x === null || x === undefined ? "—" : `${Math.round(x * 100)}%`);

  function explain(p) {
    const base = `${p.earned}/${p.max} marks across ${p.questions} question${p.questions === 1 ? "" : "s"} in ${p.sessions} session${p.sessions === 1 ? "" : "s"}`;
    const hard = p.hardRight ? ` You also got ${p.hardRight} harder (Challenge) question${p.hardRight === 1 ? "" : "s"} right.` : "";
    switch (p.status) {
      case "needs_work": return `${base} (${pct(p.accuracy)}).${p.recurring ? ` Marks were lost in ${p.lossSessions} different sessions, so this looks like a recurring error, not a one-off slip.` : ""}`;
      case "early_warning": return `${base} (${pct(p.accuracy)}). That's not much evidence yet, but it's an early sign of trouble.`;
      case "developing": return `${base} (${pct(p.accuracy)}). Getting there; a little more practice should firm it up.${hard}`;
      case "improving": return `Up from ${pct(p.earlierAccuracy)} earlier to ${pct(p.recentAccuracy)} in your latest sessions. One more check will show whether it's stuck.`;
      case "consolidating": {
        const need = [];
        if (p.distinct < 3) need.push(`right answers on ${3 - p.distinct} more different question${3 - p.distinct === 1 ? "" : "s"}`);
        if (p.retrievals < 1) need.push("a good score after a gap of at least 2 days");
        return `${base} (${pct(p.accuracy)}). Strong so far. To count as Confident it still needs ${need.join(" and ")}.${hard}`;
      }
      case "review_due": return `${base} (${pct(p.accuracy)}). Its review was due ${p.schedule.overdueDays === 0 ? "today" : `${p.schedule.overdueDays} day${p.schedule.overdueDays === 1 ? "" : "s"} ago`}. A quick quiz shows whether it stuck.`;
      case "confident": return `${base} (${pct(p.accuracy)}), on ${p.distinct} different questions, and still right after a gap.${hard}`;
      case "insufficient": return `Only ${p.questions} question${p.questions === 1 ? "" : "s"} so far (${pct(p.accuracy)}). That's too few to tell either way.${hard}`;
      default: return "You haven't answered any questions on this yet.";
    }
  }

  // Plain-language description of the review schedule.
  function scheduleText(sc) {
    if (!sc || sc.state === "new") return "Not scheduled: no practice yet.";
    const when = sc.overdueDays > 0 ? `overdue by ${sc.overdueDays} day${sc.overdueDays === 1 ? "" : "s"}` : sc.overdueDays === 0 ? "due today" : `next review in ${-sc.overdueDays} day${sc.overdueDays === -1 ? "" : "s"}`;
    return `Review step ${sc.step} of 5 (every ${sc.interval} day${sc.interval === 1 ? "" : "s"}): ${when}.`;
  }

  // Concepts due for review today, most overdue first (only ones already practised).
  function dueConcepts(prof, opts = {}) {
    const scope = opts.scopeUnits && opts.scopeUnits.length ? new Set(opts.scopeUnits) : null;
    return Object.values(prof)
      .filter((p) => p.schedule && p.schedule.isDue && (!scope || !opts.unitOf || scope.has(opts.unitOf(p.id))))
      .sort((a, b) => b.schedule.overdueDays - a.schedule.overdueDays || (a.accuracy || 0) - (b.accuracy || 0));
  }

  // ───────── Mistake Notebook ─────────
  // Built from the same evidence records, deduplicated by question (+ part). Later attempts of the
  // same question count as retries: right → next revisit step (1, 3, 7 days), wrong → back to the start.
  // Three right retries in a row (after spacing) = fixed.
  const MISTAKE_STEPS = [1, 3, 7];
  const CATEGORIES = {
    conceptual: "Concept misunderstanding",
    rule: "Used the wrong rule or method",
    sign: "Sign or inequality error",
    calculation: "Calculation slip",
    form: "Not in the required form",
    checking: "Didn't check the solutions",
    blank: "Left blank",
    unknown: "Not sure yet",
  };
  function autoCategory(r, answer) {
    if (r.blank || r.verdict === "blank") return { cat: "blank", sure: true };
    const n = r.note || "";
    if (/isn't rationalized|not in simplest form|entire radical|decimal approximation|round to/i.test(n)) return { cat: "form", sure: true };
    if (/extraneous|doesn't check|every candidate fails/i.test(n)) return { cat: "checking", sure: true };
    if (/points the wrong way|endpoint/i.test(n)) return { cat: "sign", sure: true };
    if (typeof answer === "number" && r.response !== undefined && r.response !== "" && Number(r.response) === -answer && answer !== 0) return { cat: "sign", sure: true };
    return { cat: "unknown", sure: false };
  }
  function mistakes(records, opts = {}) {
    const now = opts.now || Date.now();
    const byKey = new Map();
    for (const r of records) {
      if (!r.qid) continue;
      const key = r.qid + (r.part ? "#" + r.part : "");
      let m = byKey.get(key);
      const wrong = r.earned < r.max;
      if (!m && !wrong) continue;
      if (!m) {
        m = { key, qid: r.qid, part: r.part || null, kind: r.kind || null, concepts: r.concepts || [], occurrences: [], events: [], level: r.level };
        byKey.set(key, m);
      }
      m.events.push({ date: r.date, right: !wrong, source: r.source, attempt: r.attempt, response: r.response, earned: r.earned, max: r.max });
      if (wrong) {
        const ans = opts.answerOf ? opts.answerOf(r) : undefined;
        m.occurrences.push({ date: r.date, source: r.source, attempt: r.attempt, response: r.response, earned: r.earned, max: r.max, note: r.note || "", auto: autoCategory(r, ans) });
      }
    }
    const out = [];
    for (const m of byKey.values()) {
      let step = 0, last = m.events[0].date, rightInRow = 0;
      for (const e of m.events) {
        if (e.right) { step = Math.min(MISTAKE_STEPS.length, step + 1); rightInRow++; } else { step = 0; rightInRow = 0; }
        last = e.date;
      }
      const lastWrong = m.occurrences[m.occurrences.length - 1];
      m.first = m.occurrences[0].date;
      m.lastWrong = lastWrong.date;
      m.times = m.occurrences.length;
      m.retriesRight = m.events.filter((e) => e.right).length;
      m.improved = rightInRow > 0;
      m.fixed = step >= MISTAKE_STEPS.length;
      m.step = step;
      m.due = m.fixed ? null : startOfDay(last) + MISTAKE_STEPS[Math.min(step, MISTAKE_STEPS.length - 1)] * DAY;
      m.isDue = !m.fixed && m.due <= startOfDay(now);
      // most specific automatic category across occurrences
      const sure = m.occurrences.map((o) => o.auto).filter((a) => a.sure);
      m.autoCategory = sure.length ? sure[sure.length - 1].cat : "unknown";
      m.autoSure = sure.length > 0;
      out.push(m);
    }
    return out.sort((a, b) => b.lastWrong - a.lastWrong);
  }

  // ───────── recommendations ─────────
  // opts: { concepts (array of concept objects), feedback {id:{confusing}}, docConcepts Set, scopeUnits [], done {id: ts}, now }
  function recommend(prof, opts) {
    const now = opts.now || Date.now();
    const scope = opts.scopeUnits && opts.scopeUnits.length ? new Set(opts.scopeUnits) : null;
    const byId = new Map(opts.concepts.map((c) => [c.id, c]));
    const recs = [];
    for (const c of opts.concepts) {
      if (scope && !scope.has(c.unit)) continue;
      const p = prof[c.id];
      if (!p) continue;
      let score = { needs_work: 100, early_warning: 75, developing: 55, improving: 40, review_due: 45, consolidating: 30, insufficient: 25, not_attempted: 15, confident: 0 }[p.status];
      if (p.status === "needs_work") score += (1 - p.accuracy) * 40 + (p.recurring ? 20 : 0);
      if (p.status === "developing" || p.status === "early_warning") score += (1 - p.accuracy) * 25;
      const reasons = [];
      const fb = opts.feedback && opts.feedback[c.id];
      if (fb && fb.confusing > (fb.helpful || 0)) { score += 15; reasons.push("You marked this lesson as confusing."); }
      if (p.schedule && p.schedule.isDue && p.status !== "review_due") { score += 10; reasons.push("Its spaced review is due."); }
      if (opts.priorities && opts.priorities.includes(c.id)) { score += 20; reasons.push("You marked it as a priority."); }
      if (opts.mistakeCounts && opts.mistakeCounts[c.id]) { score += Math.min(15, opts.mistakeCounts[c.id] * 5); reasons.push(`${opts.mistakeCounts[c.id]} open mistake${opts.mistakeCounts[c.id] === 1 ? "" : "s"} in your notebook.`); }
      const inDocs = opts.docConcepts && opts.docConcepts.has(c.id);
      if (inDocs && p.status !== "confident") { score += p.status === "not_attempted" ? 30 : 10; reasons.push("It appears in your uploaded study material."); }
      if (score <= 0) continue;
      const doneAt = opts.done && opts.done[c.id];
      const minutes = ["review_due", "improving", "insufficient", "consolidating"].includes(p.status) ? 5 : 15;
      recs.push({
        concept: c.id, title: c.title, unit: c.unit, status: p.status, label: STATUS[p.status].label, tone: STATUS[p.status].tone,
        score, why: explain(p), extra: reasons, evidence: p,
        minutes, // estimate
        activity: minutes === 5 ? "quiz" : "lesson+quiz",
        verify: p.status === "consolidating" ? "Score 4/5 or better on a quiz at least 2 days after your last session." : "Score 4/5 or better on a fresh concept quiz.",
        doneToday: !!(doneAt && now - doneAt < DAY),
      });
    }
    // Prerequisite rule: if a weak concept's prerequisite is also weak, study the prerequisite first.
    const weak = new Set(recs.filter((r) => r.status === "needs_work" || r.status === "early_warning").map((r) => r.concept));
    for (const r of recs) {
      const c = byId.get(r.concept);
      for (const pre of c.prereqs || []) {
        if (weak.has(r.concept) && weak.has(pre)) {
          const pr = recs.find((x) => x.concept === pre);
          if (pr && pr.score <= r.score) { pr.score = r.score + 1; pr.extra.push(`It's a prerequisite for ${c.title}, which also needs work.`); }
        }
      }
    }
    return recs.sort((a, b) => b.score - a.score);
  }

  // Fit ranked recommendations into a time budget (minutes are estimates).
  function plan(recs, budget) {
    const out = [];
    let left = budget;
    for (const r of recs) {
      if (r.doneToday) continue;
      if (r.minutes <= left) { out.push({ ...r, step: r.activity }); left -= r.minutes; }
      else if (left >= 5) { out.push({ ...r, step: "quiz", minutes: 5 }); left -= 5; }
      if (left < 5) break;
    }
    return { items: out, used: budget - left };
  }

  // ───────── adaptive exam preparation ─────────
  // Re-planned from TODAY every time it is shown, using current evidence, so missed days and new results
  // re-balance it automatically. Never promises a grade; scope is only "on the exam" when the student said so.
  // opts: { prof, recs, concepts, unitOf, exam: {date, units, minutesPerDay, days:[0-6], priorities}, docConcepts, mistakesDue, now }
  function examPlan(opts) {
    const now = opts.now || Date.now();
    const exam = opts.exam || {};
    const perDay = Math.max(10, Math.min(240, Number(exam.minutesPerDay) || 30));
    const studyDays = exam.days && exam.days.length ? exam.days : [0, 1, 2, 3, 4, 5, 6];
    const today = startOfDay(now);
    const examDay = exam.date ? startOfDay(new Date(exam.date + "T00:00").getTime()) : null;
    const daysLeft = examDay !== null ? Math.round((examDay - today) / DAY) : null;
    const horizon = examDay !== null ? Math.max(0, Math.min(daysLeft, 21)) : 7;
    const scopeSet = exam.units && exam.units.length ? new Set(exam.units) : null;
    const scopeOf = (id) => scopeSet ? (scopeSet.has(opts.unitOf(id)) ? "known" : "out") : (opts.docConcepts && opts.docConcepts.has(id) ? "inferred" : "unset");
    const notes = [];
    if (examDay !== null && daysLeft < 0) return { days: [], daysLeft, notes: ["Your exam date has passed. Set a new date to plan again."], perDay };

    // Work queue from the recommendations (already ranked by evidence, priorities, mistakes, reviews).
    const queue = opts.recs.filter((r) => scopeOf(r.concept) !== "out" && r.status !== "confident")
      .map((r) => ({ concept: r.concept, title: r.title, status: r.status, label: r.label, tone: r.tone, minutes: r.status === "not_attempted" ? 15 : r.minutes, why: [r.why, ...r.extra].join(" "), scope: scopeOf(r.concept), weak: ["needs_work", "early_warning", "developing"].includes(r.status) }));
    const days = [];
    const dayList = [];
    for (let d = 0; d <= horizon; d++) {
      const date = today + d * DAY;
      if (examDay !== null && date >= examDay) break;
      if (!studyDays.includes(new Date(date).getDay())) continue;
      dayList.push(date);
    }
    if (!dayList.length) notes.push(examDay !== null && daysLeft === 0 ? "Your exam is today. A light review of your notebook is the best use of time now." : "None of your study days fall before the exam. Add more study days to get a plan.");
    let qi = 0;
    const revisit = []; // weak concepts come back 2 days later for a quiz
    dayList.forEach((date, k) => {
      const tasks = [];
      let left = perDay;
      const daysToExam = examDay !== null ? Math.round((examDay - date) / DAY) : null;
      // 1. reviews due by this date (first day uses the real due list; later days use scheduled due dates)
      const dueHere = Object.values(opts.prof).filter((p) => p.schedule && p.schedule.due !== null && (k === 0 ? p.schedule.due <= date : p.schedule.due > dayList[k - 1] && p.schedule.due <= date) && scopeOf(p.id) !== "out");
      const mist = k === 0 ? (opts.mistakesDue || 0) : 0;
      if (dueHere.length || mist) {
        const m = Math.min(left, 5 + Math.min(10, dueHere.length * 2 + mist));
        tasks.push({ type: "review", minutes: m, title: "Daily review", detail: [dueHere.length ? `${dueHere.length} concept${dueHere.length === 1 ? "" : "s"} due` : "", mist ? `${mist} mistake${mist === 1 ? "" : "s"} to revisit` : ""].filter(Boolean).join(" · "), why: "Spaced reviews are scheduled from your past answers; doing them on time is what moves a concept to Confident." });
        left -= m;
      }
      // 2. final days: a full practice test if there is time
      if (daysToExam !== null && daysToExam <= 2 && daysToExam >= 1 && left >= 45 && !days.some((x) => x.tasks.some((t) => t.type === "test"))) {
        tasks.push({ type: "test", minutes: Math.min(60, left), title: "Full practice test", detail: "Normal level, timed", why: "A timed test close to the exam checks everything together and shows what to skim one last time." });
        left -= Math.min(60, left);
      }
      // 3. revisits from 2 days ago
      for (let i = 0; i < revisit.length && left >= 5; i++) {
        if (revisit[i].on <= date && !revisit[i].done) { tasks.push({ type: "quiz", concept: revisit[i].concept, title: revisit[i].title, minutes: 5, detail: "Follow-up quiz", why: "Checking a weak concept again two days later shows whether the fix stuck.", scope: revisit[i].scope }); left -= 5; revisit[i].done = true; }
      }
      // 4. new work from the queue
      while (left >= 5 && qi < queue.length) {
        const w = queue[qi];
        const m = Math.min(w.minutes, left);
        if (m < w.minutes && m < 10) break;
        tasks.push({ type: w.minutes >= 15 && m >= 15 ? "lesson" : "quiz", concept: w.concept, title: w.title, minutes: m, status: w.status, label: w.label, tone: w.tone, detail: m >= 15 ? "Lesson + quiz" : "Quiz", why: w.why, scope: w.scope });
        left -= m; qi++;
        if (w.weak) revisit.push({ concept: w.concept, title: w.title, scope: w.scope, on: date + 2 * DAY });
      }
      days.push({ date, daysToExam, tasks, used: perDay - left });
    });
    const unplanned = queue.length - qi;
    if (unplanned > 0 && examDay !== null) notes.push(`${unplanned} lower-priority concept${unplanned === 1 ? "" : "s"} didn't fit before the exam with ${perDay} minutes a day. They're ordered by your evidence, so the most important ones come first.`);
    if (!scopeSet) notes.push("You haven't said which units are on the exam, so the plan covers every unit. Units suggested by your uploaded files are marked “from your file”.");
    return { days, daysLeft, perDay, notes, unplanned: Math.max(0, unplanned) };
  }

  // ───────── documents ─────────
  // Extra patterns per concept, beyond the concept keywords (symbols and common phrasings in study sheets).
  const PATTERNS = {
    "numbers.sets": [/\birrational\b/i, /\bnatural numbers?\b/i, /\bwhole numbers?\b/i, /\bintegers?\b/i],
    "exponents.laws": [/\bexponent laws?\b/i, /\bpower of a power\b/i, /\bzero exponent\b/i, /\b[a-z]\^\d+\s*[·*×]\s*[a-z]\^\d+/i],
    "exponents.negative": [/negative exponents?/i, /\^\s*\(?-\s*\d/, /\breciprocal\b/i],
    "exponents.rational": [/rational exponents?/i, /fractional exponents?/i, /\^\s*\(\s*\d+\s*\/\s*\d+\s*\)/, /\^\s*\d\/\d/],
    "radicals.simplify": [/simplif\w* radical/i, /simplest radical form/i, /perfect squares?/i, /perfect cubes?/i, /√\s*\(?\s*\d{2,}/, /simplify\s*√/i],
    "radicals.mixed_entire": [/mixed radicals?/i, /entire radicals?/i],
    "radicals.add_subtract": [/like radicals?/i, /add(ing)? (and|&) subtract(ing)? radicals?/i, /\d√\d+\s*[+−-]\s*\d*√\d+/],
    "radicals.multiply": [/multiply(ing)? radicals?/i, /\bfoil\b/i, /\(\s*\d*√\d+\s*\)\s*\(\s*\d*√\d+\s*\)/],
    "radicals.rationalize": [/rationali[sz]/i, /rational denominator/i, /\/\s*√\d+/],
    "radicals.conjugates": [/conjugates?/i, /\/\s*\(\s*\d+\s*[+−-]\s*√\d+\s*\)/],
    "radicals.restrictions": [/restrictions?/i, /\bdomain\b/i, /\bdefined (for|when)\b/i, /x\s*(≥|>=)\s*-?\d/],
    "radicals.equations": [/radical equations?/i, /extraneous/i, /square both sides/i, /√\s*\(?[^=]{1,15}\)?\s*=\s*/],
    "radicals.applications": [/pythag/i, /hypotenuse/i, /perimeter/i, /\barea\b/i, /pendulum/i, /word problems?/i, /nearest (tenth|hundredth)/i],
    "factoring.trinomials": [/\bgcf\b/i, /greatest common factor/i, /trinomials?/i, /decomposition/i, /factor(ing)? completely/i],
    "factoring.special": [/difference of (two )?squares/i, /perfect square trinomials?/i],
    "factoring.quadratic_form": [/quadratic form/i, /substitution/i, /\blet u\b/i, /rational expressions?/i],
  };

  function analyzeDocument(pages, concepts) {
    const byConcept = {};
    for (const c of concepts) {
      const pats = [...(PATTERNS[c.id] || []), ...c.keywords.map((k) => new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "i"))];
      const hits = [];
      const matchedPatterns = new Set();
      pages.forEach((text, i) => {
        for (const re of pats) {
          const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
          const g = new RegExp(re.source, flags);
          let m, n = 0;
          while ((m = g.exec(text)) && n < 5) {
            n++;
            matchedPatterns.add(re.source);
            if (hits.length < 40) {
              const s = Math.max(0, m.index - 60), e = Math.min(text.length, m.index + m[0].length + 60);
              hits.push({ page: i + 1, match: m[0], snippet: text.slice(s, e).replace(/\s+/g, " ").trim() });
            }
            if (m[0].length === 0) g.lastIndex++;
          }
        }
      });
      const pagesHit = [...new Set(hits.map((h) => h.page))];
      const level = hits.length >= 3 && (matchedPatterns.size >= 2 || pagesHit.length >= 2) ? "covered" : hits.length ? "possible" : "missing";
      byConcept[c.id] = { level, hits: hits.length, pages: pagesHit, distinct: matchedPatterns.size, samples: hits.slice(0, 3) };
    }
    const ids = concepts.map((c) => c.id);
    return {
      byConcept,
      covered: ids.filter((id) => byConcept[id].level === "covered"),
      possible: ids.filter((id) => byConcept[id].level === "possible"),
      missing: ids.filter((id) => byConcept[id].level === "missing"),
    };
  }

  // Pick the most relevant pages of a document for a question (simple term overlap).
  function relevantPages(pages, query, k = 3) {
    const terms = String(query).toLowerCase().match(/[a-z√∛]{3,}|\d+/g) || [];
    const scored = pages.map((t, i) => {
      const lt = t.toLowerCase();
      let s = 0;
      for (const term of terms) { const n = lt.split(term).length - 1; s += Math.min(n, 5); }
      return { page: i + 1, score: s, text: t };
    });
    const top = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
    return top.length ? top.sort((a, b) => a.page - b.page) : scored.slice(0, Math.min(k, scored.length));
  }

  const api = { buildEvidence, profile, recommend, plan, analyzeDocument, relevantPages, STATUS, explain, scheduleText, dueConcepts, mistakes, CATEGORIES, examPlan, INTERVALS, MISTAKE_STEPS, startOfDay, DAY };
  root.Learning = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
