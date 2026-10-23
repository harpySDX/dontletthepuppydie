/*
 * PHYSICS HOME — Physics content for the SAME home screen Precalculus uses (#screen-home in index.html, rendered by
 * renderHome in js/app.js). The layout, cards, difficulty carousel, preview, quick actions, stats and Studio+ workspace
 * are shared; this module only supplies what is physics-specific:
 *   welcome()            kicker / greeting / sub line
 *   topicCard(A)         current topic (Projectile motion) with measured accuracy (never "mastery" without evidence)
 *   cardDesc(m)          one-line description for each difficulty card
 *   preview(m, A, seed)  the selected level's preview: Simple → guided practice; Normal/Challenging/Nightmare → a
 *                        real Physics test (length, time, hint rule, topic, number of questions, start, Test options)
 *   activity(A) · goals(A) · concepts() · stats(A) · studioPlus(A)
 * Everything reads Physics records only (js/physics/ui.js, js/physics/test.js). Labs are optional tools reached from
 * Quick actions or the Lab destination; nothing here makes them part of starting a test.
 */
(function () {
  "use strict";
  const tr = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const lang = () => (window.I18N ? window.I18N.lang : "en");
  const loc = (t) => (!t ? "" : typeof t === "string" ? t : t[lang()] || t.en);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const UI = () => window.PhysUI, PT = () => window.PhysTest, C = () => window.PhysCurriculum, CT = () => window.PhysContent, B = () => window.Bank;
  const pctCls = (x) => (x >= 75 ? "good" : x >= 50 ? "mid" : "low");
  const acc = (rs) => { const m = rs.reduce((a, r) => a + r.max, 0); return m ? Math.round((rs.reduce((a, r) => a + r.earned, 0) / m) * 100) : null; };
  const recs = () => UI().records();

  function welcome() {
    const rs = recs(), first = !rs.length && !PT().history().length;
    return {
      kicker: tr(first ? "home.kicker.first" : "home.kicker.back"),
      title: tr(first ? "ph.greet.first" : "home.title.back"),
      sub: first ? tr("ph.sub.first") : tr("ph.sub.back", { n: rs.length }),
    };
  }
  function topicCard() {
    const pc = recs().filter((r) => /^PC\./.test(r.sub || "")), a = acc(pc);
    return `
      <button type="button" class="topic-main" data-phys-lesson="phys.angled">
        <span class="topic-ico" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 26 Q14 2 28 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 3"/><circle cx="4" cy="26" r="2.4" fill="currentColor"/></svg></span>
        <span class="topic-t"><small id="topic-card-h">${esc(tr("home.topic"))}</small><b>${esc(tr("ph.home.title"))}</b></span><span class="qi-go" aria-hidden="true">›</span>
      </button>
      <div class="bar bar-lg" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${a || 0}" aria-label="${esc(tr("ph.m.acc"))}"><div class="bar-fill" style="width:${a || 0}%"></div></div>
      <div class="topic-foot"><span>${esc(tr("ph.m.acc"))}</span><b>${a === null ? esc(tr("home.masteryNone")) : a + "%"}</b></div>`;
  }
  const cardDesc = (m) => tr("ph.card." + m + ".d");

  // ───────── the selected level's preview (same structure and classes as the Math preview) ─────────
  function example(m, seed) {
    try { const { questions } = PT().build(m, { n: 1, rnd: B().rng(seed * 7919 + m.length), preview: true }); return questions[0] || null; } catch { return null; }
  }
  function topicSelect(lv, cur, id = "pt-topic") {
    const tops = PT().topics(lv);
    return `<select class="text-input" id="${id}"><option value="${PT().MIX}" ${cur === PT().MIX ? "selected" : ""} ${tops[0].ok ? "" : "disabled"}>${esc(tr("pt.mixAll"))}</option>${C().UNITS.map((u) => { const rows = tops.filter((t) => t.id !== PT().MIX && t.unit === u.id && t.ok); return rows.length ? `<optgroup label="${esc(loc(u.title))}">${rows.map((t) => `<option value="${t.id}" ${t.id === cur ? "selected" : ""}>${esc(loc(t.title))}</option>`).join("")}</optgroup>` : ""; }).join("")}</select>`;
  }
  function preview(m, A, seed) {
    const ex = example(m, seed);
    const head = `<div class="mp-head"><span class="mode-ico" aria-hidden="true">${A.MODE_ICON()[m]}</span><div><h3>${esc(tr("mode.previewTitle", { mode: tr("mode." + m) }))}</h3><p>${esc(tr("pt.mode." + m))}</p></div></div>`;
    let body;
    {
      const o = PT().options(m);
      const hint = { simple: "pt.hints.simple", normal: "pt.hints.normal", challenge: "pt.hints.challenge", nightmare: "pt.hints.nightmare" }[m];
      body = `<ul class="mp-chips"><li>${esc(tr("pt.f.len", { n: o.n, min: o.minutes }))}</li><li>${esc(tr(hint))}</li><li>${esc(tr("pt.f.results"))}</li></ul>
        <div class="mp-pt-opts"><label class="mp-skill"><span>${esc(tr("ph.topic"))}</span>${topicSelect(m, o.topic)}</label>
        <div class="mp-skill"><span id="pt-n-l">${esc(tr("pt.count"))}</span><div class="segmented small-seg" role="radiogroup" aria-labelledby="pt-n-l">${PT().COUNTS[m].map((n) => `<button type="button" role="radio" data-pt-n="${n}" aria-checked="${n === o.n}" class="${n === o.n ? "active" : ""}">${n}</button>`).join("")}</div></div></div>
        <div class="mp-actions"><button type="button" class="btn btn-primary" id="btn-start" data-start-mode="${m}">${esc(tr("mode.start." + m))}</button><button type="button" class="btn btn-secondary" id="btn-create" data-setup-mode="${m}">${esc(tr("mode.options"))}</button></div>
        <button type="button" class="btn btn-link btn-sm mp-howto" data-onboard="test">${esc(tr("onboard.testNudge"))}</button>`;
    }
    const tags = ex ? [PT().topic(ex), tr("mode." + m)] : [];
    return `<div class="mp-left">${head}${body}</div>
      <div class="mp-example">
        <div class="mp-ex-head"><span class="kicker">${esc(tr("mode.example"))}</span><button type="button" class="btn btn-link btn-sm" id="btn-new-example">${esc(tr("mode.newExample"))}</button></div>
        <div class="mp-ex-q">${ex ? A.renderMath(loc(ex.stem)) : ""}</div>
        ${ex ? `<div class="mp-tags">${tags.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
      </div>`;
  }

  // ───────── dashboard panels ─────────
  function activityItems() {
    const runs = UI().runsOf(recs());
    return runs.map((r) => ({ id: r.run, test: !!r.test, date: r.date, pct: r.m ? Math.round((r.e / r.m) * 100) : 0, mode: r.mode,
      title: r.test ? tr("pt.recentTest", { mode: tr("mode." + r.mode) }) : r.diag ? tr("ph.diag.title") : r.subs.size === 1 ? loc((C().get([...r.subs][0]) || {}).title) : tr("ph.mixedSet"),
      sub: `${tr("ph.parts", { n: r.n })} · ${tr("mode." + r.mode)}` }));
  }
  function actList(items, A) {
    return `<ul class="act-list">${items.map((a) => `
      <li><${a.test ? `button type="button" class="act-item" data-attempt="${esc(a.id)}"` : 'div class="act-item"'}>
        <span class="act-ico ${a.test ? "test" : "practice"}" aria-hidden="true">${a.test ? "✓" : "◎"}</span>
        <span class="act-t"><b>${esc(a.title)}</b><small>${esc(a.sub)}</small></span>
        <span class="act-pct ${pctCls(a.pct)}">${a.pct}%</span>
        <span class="act-when">${esc(A.rel(a.date))}</span></${a.test ? "button" : "div"}></li>`).join("")}</ul>`;
  }
  function activity(A) { const it = activityItems().slice(0, 4); return it.length ? actList(it, A) : `<p class="empty-note">${esc(tr("act.empty"))}</p>`; }
  // goals: lessons you've started that aren't secure yet (measured accuracy on their question families)
  function goals(A) {
    const rs = recs();
    const gs = CT().LESSONS.map((l) => { const mine = rs.filter((r) => l.families.includes(r.family)); return { l, n: mine.length, pct: acc(mine) }; }).filter((g) => g.n && g.pct < 85).sort((a, b) => a.pct - b.pct).slice(0, 4);
    return gs.length ? `<ul class="goal-list">${gs.map((g) => `<li><button type="button" class="goal-item" data-phys-lesson="${g.l.id}">${A.miniRing(g.pct)}<span class="act-t"><b>${esc(loc(g.l.title))}</b><small>${esc(tr("ph.answered", { n: g.n }))}</small></span><span class="goal-pct">${g.pct}%</span></button></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("goals.empty"))}</p>`;
  }
  // Studio layout: every assessed physics skill at a glance (only skills with questions behind them)
  function concepts() {
    const D = UI().diagnose();
    const tone = { strong: "good", developing: "mid", needs: "low", few: "none", none: "none" };
    return `<h2 class="panel-title">${esc(tr("ph.bySkill"))}</h2><ul class="concept-dots">${D.skills.map((s) => `<li><button type="button" data-phys-lesson="${UI().SKILL_MAP[s.id].lesson}"><i class="dot-st st-${tone[s.status]}" aria-hidden="true"></i>${esc(tr("phs." + s.id))}<span class="cd-p">${s.acc === null ? "—" : Math.round(s.acc * 100) + "%"}</span></button></li>`).join("")}</ul>`;
  }
  function streak() {
    const days = new Set([...recs().map((r) => r.date), ...PT().history().map((a) => a.date)].map((d) => new Date(d).toDateString()));
    const day = (k) => { const d = new Date(); d.setDate(d.getDate() - k); return d.toDateString(); };
    const today = days.has(day(0)); let n = 0;
    for (let k = today ? 0 : 1; days.has(day(k)); k++) n++;
    return { n, today };
  }
  function stats(A) {
    const rs = recs(), all = acc(rs), st = streak();
    const groups = CT().LESSONS.filter((l) => l.families.length).map((l) => ({ name: loc(l.title), pct: acc(rs.filter((r) => l.families.includes(r.family))) }));
    return `
      <div class="panel-head sm"><h2 id="stats-h">${esc(tr("stats.title"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="progress">${esc(tr("act.viewAll"))}</button></div>
      <div class="stats-body">
        <div class="ring-wrap">${A.ring(all)}<span class="ring-v"><b>${all === null ? "—" : all + "%"}</b><small>${esc(tr("ph.m.acc"))}</small></span></div>
        <ul class="topic-bars">${groups.map((g) => `<li><span class="tb-name">${esc(g.name)}</span><span class="tb-v">${g.pct === null ? "—" : g.pct + "%"}</span><span class="bar"><span class="bar-fill" style="width:${g.pct || 0}%"></span></span></li>`).join("")}</ul>
      </div>
      ${st.n ? `<div class="streak"><span class="streak-ico" aria-hidden="true">🔥</span><span><b>${esc(tr("stats.streak", { n: st.n }))}</b><small>${esc(tr(st.today ? "stats.streakToday" : "stats.streakKeep"))}</small></span></div>` : ""}`;
  }

  // ───────── Studio+ (same panels and classes as the Math Studio+ workspace) ─────────
  function studioPlus(A, saved) {
    const rs = recs(), D = UI().diagnose(rs), Q = UI().reviewQueue(rs), mode = A.selectedMode(), cov = C().coverage();
    const runs = UI().runsOf(rs), tests = PT().history().length, a = acc(rs), st = streak();
    const metric = (v, k) => `<div class="sp-metric${v === null ? " none" : ""}"><b>${v === null ? "—" : esc(String(v))}</b><span>${esc(tr(k))}</span></div>`;
    const covered = new Set(rs.map((r) => r.sub)).size, assessed = cov.filter((c) => c.families.length).length;
    const skills = D.skills.filter((s) => s.n);
    const errRows = Object.entries(D.cats).sort((x, y) => y[1] - x[1]);
    const diag = !rs.length ? `<p class="empty-note">${esc(tr("ph.diag.empty"))}</p>` : `
      <div class="sp-sec"><h3>${esc(tr("ph.bySkill"))}</h3><ul class="sp-list">${skills.sort((x, y) => x.acc - y.acc).map((s) => `<li><button type="button" class="sp-link" data-phys-lesson="${UI().SKILL_MAP[s.id].lesson}">${esc(tr("phs." + s.id))}</button><span class="sp-pct ${pctCls(s.acc * 100)}">${Math.round(s.acc * 100)}%</span><small class="faint">${s.status === "few" ? esc(tr("ph.few", { n: s.n })) : esc(tr("ph.st." + s.status))}</small></li>`).join("")}</ul></div>
      <div class="sp-sec"><h3>${esc(tr("ph.errTypes"))}</h3>${errRows.length ? `<ul class="sp-list">${errRows.map(([k, n]) => `<li><span>${esc(tr("phc." + k))}</span><b class="sp-num">${n}</b></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("ph.errNone"))}</p>`}${D.unclassified ? `<p class="faint small">${esc(tr("ph.unclassified", { n: D.unclassified }))}</p>` : ""}</div>
      <p class="faint small">${esc(tr("ph.diagHonest"))}</p>`;
    const isTest = true; // every level is a test
    const o = isTest ? PT().options(mode) : null;
    const launch = `
      <span class="field-label" id="sp-level-l">${esc(tr("sp.level"))}</span>
      <div class="segmented sp-levels" role="radiogroup" aria-labelledby="sp-level-l">${["simple", "normal", "challenge", "nightmare"].map((m) => `<button type="button" role="radio" data-sp-mode="${m}" aria-checked="${m === mode}" class="${m === mode ? "active" : ""}">${esc(tr("mode." + m))}</button>`).join("")}</div>
      <p class="faint small">${esc(tr("pt.mode." + mode))}</p>
      <div class="sp-launch-row">
        <button type="button" class="btn btn-primary" data-start-mode="${mode}">${esc(tr("mode.start." + mode))}</button>
        ${isTest ? `<button type="button" class="btn btn-secondary" data-setup-mode="${mode}">${esc(tr("mode.options"))}</button>` : ""}
        ${saved && saved.items ? `<button type="button" class="btn btn-secondary" id="sp-resume">${esc(tr("sp.resume"))}</button>` : ""}
      </div>
      ${isTest ? `<div class="sp-topic"><label><span>${esc(tr("ph.topic"))}</span>${topicSelect(mode, o.topic, "sp-pt-topic")}</label>
        <div class="mp-skill"><span id="sp-pt-n-l">${esc(tr("pt.count"))}</span><div class="segmented small-seg" role="radiogroup" aria-labelledby="sp-pt-n-l">${PT().COUNTS[mode].map((n) => `<button type="button" role="radio" data-pt-n="${n}" aria-checked="${n === o.n}" class="${n === o.n ? "active" : ""}">${n}</button>`).join("")}</div></div></div>
        <p class="faint small">${esc(tr("pt.f.len", { n: o.n, min: o.minutes }))} · ${esc(tr("pt.hints." + mode))}</p>` : ""}`;
    const queue = Q.length ? `<ul class="sp-queue">${Q.slice(0, 6).map((f) => `<li><span class="sp-q-k"><b>${esc(UI().famTitle(f.family))}</b><small>${esc(tr("ph.review.why", { n: f.misses, when: A.rel(f.lastMiss) }))}${f.due ? " · " + esc(tr("ph.review.due")) : ""}</small></span><button type="button" class="btn btn-sm btn-secondary" data-phys-fams="${esc(f.family)}">${esc(tr("ph.practise"))}</button></li>`).join("")}</ul><p class="faint small">${esc(tr("ph.review.note"))}</p>` : `<p class="empty-note">${esc(tr("ph.review.empty"))}</p>`;
    const curric = `<ul class="sp-units">${C().UNITS.map((u) => {
      const rows = cov.filter((c) => c.unit === u.id), tested = rows.filter((c) => c.status === "tested"), mine = rs.filter((r) => rows.some((c) => c.id === r.sub)), ua = acc(mine), prac = new Set(mine.map((r) => r.sub)).size;
      const pct = tested.length ? Math.round((prac / tested.length) * 100) : 0;
      return `<li><button type="button" class="sp-unit" data-go="course"><span class="cu-letter">${esc(u.id.slice(1))}</span><span class="sp-ut"><b>${esc(loc(u.title))}</b><small>${tested.length ? esc(tr("sp.practised", { n: prac, total: tested.length })) : esc(tr("ph.status.planned"))}</small></span>
        <span class="bar" role="meter" aria-valuemin="0" aria-valuemax="${tested.length}" aria-valuenow="${prac}" aria-label="${esc(loc(u.title))}"><span class="bar-fill" style="width:${pct}%"></span></span>
        <span class="sp-pct ${ua === null ? "" : pctCls(ua)}">${ua === null ? "—" : ua + "%"}</span></button></li>`;
    }).join("")}</ul><p class="faint small">${esc(tr("ph.course.intro"))}</p>`;
    const hist = runs.length ? actList(activityItems().slice(0, 12), A) : `<p class="empty-note">${esc(tr("ph.recent.empty"))}</p>`;
    const tool = (attr, label, ico) => `<button type="button" class="sp-tool" ${attr}><span aria-hidden="true">${ico}</span>${esc(label)}</button>`;
    return `
      <header class="sp-top glass">
        <div class="sp-hello"><p class="eyebrow">${esc(tr("ph.kicker"))} · ${esc(tr("sp.kicker"))}</p><h1>${esc(tr("ph.home.title"))}</h1></div>
        <div class="sp-metrics">${metric(rs.length || null, "ph.m.parts")}${metric(a === null ? null : a + "%", "ph.m.acc")}${metric(tests || null, "sp.m.tests")}${metric(st.n || null, "sp.m.streak")}${metric(Q.length || null, "ph.m.review")}${metric(`${covered}/${assessed}`, "ph.m.covered")}</div>
        <nav class="sp-tools" aria-label="${esc(tr("sp.tools"))}">${tool('data-sp-tool="calc"', tr("sp.calc"), "▦")}${tool('data-sp-tool="pad"', tr("sp.pad"), "✎")}${tool('data-go="library"', tr("ph.quick.learn"), "❒")}${tool('data-go="studyroom"', tr("ph.quick.lab"), "⤴")}${tool('data-sp-tool="settings"', tr("sp.settings"), "⚙")}${tool('data-sp-tool="lang"', tr("sp.lang"), "文")}</nav>
      </header>
      <section class="sp-panel glass sp-diag" aria-labelledby="sp-diag-h"><div class="panel-head sm"><h2 id="sp-diag-h">${esc(tr("ph.diag"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="progress">${esc(tr("act.viewAll"))}</button></div><div class="sp-scroll">${diag}</div></section>
      <section class="sp-panel glass sp-launch" aria-labelledby="sp-launch-h"><div class="panel-head sm"><h2 id="sp-launch-h">${esc(tr("sp.launch"))}</h2></div><div class="sp-scroll">${launch}</div></section>
      <section class="sp-panel glass sp-queue-p" aria-labelledby="sp-queue-h"><div class="panel-head sm"><h2 id="sp-queue-h">${esc(tr("ph.review"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="review">${esc(tr("act.viewAll"))}</button></div><div class="sp-scroll">${queue}</div></section>
      <section class="sp-panel glass sp-curric" aria-labelledby="sp-curric-h"><div class="panel-head sm"><h2 id="sp-curric-h">${esc(tr("sp.curric"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="course">${esc(tr("prac.tab.course"))}</button></div><div class="sp-scroll">${curric}</div></section>
      <section class="sp-panel glass sp-hist-p" aria-labelledby="sp-hist-h"><div class="panel-head sm"><h2 id="sp-hist-h">${esc(tr("sp.hist"))}</h2><button type="button" class="btn btn-link btn-sm" data-go="progress">${esc(tr("act.viewAll"))}</button></div><div class="sp-scroll">${hist}</div></section>`;
  }

  // ───────── Practice › By topic: the same topic cards as Math (one per lesson), each with untimed practice at
  // Simple / Normal / Challenging and a link to the lesson ─────────
  const DRILL_GROUPS = [["ph.grp.foundations", ["phys.vectors", "phys.units", "phys.model"]], ["ph.grp.launches", ["phys.vertical", "phys.horizontal", "phys.angled", "phys.heights"]], ["ph.grp.representations", ["phys.graphs"]]];
  function drills(A) {
    const rs = recs();
    const card = (l) => {
      const mine = rs.filter((r) => l.families.includes(r.family)), a = acc(mine);
      const st = !mine.length ? ["none", tr("ph.st.none")] : mine.length < 3 ? ["none", tr("ph.few", { n: mine.length })] : a >= 85 ? ["good", tr("ph.st.strong")] : a >= 60 ? ["mid", tr("ph.st.developing")] : ["low", tr("ph.st.needs")];
      const fams = l.families.filter((f) => B().byFam(f));
      const at = (m) => fams.filter((f) => B().byFam(f).modes.includes(m));
      return `<article class="drill glass">
        <header><span class="level-pill st-${st[0]}">${esc(st[1])}</span><span class="drill-pct">${a === null ? "" : a + "%"}</span></header>
        <h3>${esc(loc(l.title))}</h3>
        <p class="small muted">${A.renderMath(loc(l.summary))}</p>
        <div class="drill-actions">${["simple", "normal", "challenge"].map((m) => `<button type="button" class="btn btn-sm ${m === "normal" ? "btn-primary" : "btn-secondary"}" data-ph-fams="${at(m).join(",")}" data-level="${m}" ${at(m).length ? "" : `disabled title="${esc(tr("ph.notAtLevelNote", { mode: tr("mode." + m) }))}"`}>${esc(tr("mode." + m))}</button>`).join("")}<button type="button" class="btn btn-link btn-sm" data-ph-lesson="${l.id}">${esc(tr("prac.lesson"))}</button></div>
      </article>`;
    };
    return `<div class="phys-host">${DRILL_GROUPS.map(([k, ids]) => `<section class="drill-group"><h2 class="sub-h">${esc(tr(k))}</h2><div class="drill-grid">${ids.map((id) => card(CT().get(id))).join("")}</div></section>`).join("")}
      <p class="faint small">${esc(tr("ph.drills.note"))}</p></div>`;
  }

  // ───────── Progress › Overview (same cards as the Math Progress page) and › Mistakes & review ─────────
  function progress(A) {
    const hist = PT().history(), rs = recs();
    const norm = hist.filter((h) => h.level === "normal"), best = norm.length ? Math.max(...norm.map((h) => h.percent)) : null;
    const last = hist.slice(-5), avg = last.length ? Math.round(last.reduce((x, h) => x + h.percent, 0) / last.length) : null;
    const tile = (v, k) => `<div class="tile${v === null ? " empty-tile" : ""}"><span class="tile-value">${v === null ? "—" : esc(String(v))}</span><span class="tile-label">${esc(tr(k))}</span></div>`;
    const histList = hist.length ? `<ul class="act-list">${hist.slice().reverse().slice(0, 20).map((h) => `<li><button type="button" class="act-item" data-attempt="${esc(h.id)}"><span class="act-ico test" aria-hidden="true">✓</span><span class="act-t"><b>${esc(tr("pt.recentTest", { mode: tr("mode." + h.level) }))}</b><small>${esc(A.niceDate(h.date))}</small></span><span class="act-pct ${pctCls(h.percent)}">${Math.round(h.percent)}%</span><span class="act-when">${esc(A.rel(h.date))}</span></button></li>`).join("")}</ul>` : `<p class="empty-note">${esc(tr("ph.hist.empty"))}</p>`;
    return `<div class="progress-grid">
      <div class="card stats-card"><div class="card-head progress-head"><h2>${esc(tr("ph.prog.tests"))}</h2></div>
        <div class="stat-tiles">${tile(hist.length || null, "ph.prog.taken")}${tile(best === null ? null : Math.round(best) + "%", "ph.prog.best")}${tile(avg === null ? null : avg + "%", "ph.prog.avg")}${tile(rs.length || null, "ph.m.parts")}</div></div>
      <div class="card"><div class="card-head"><h2>${esc(tr("ph.diag"))}</h2></div>${UI().diagPanel(false)}</div>
      <div class="card goals-card"><div class="card-head"><h2>${esc(tr("goals.title"))}</h2></div>${goals(A)}</div>
      <div class="card"><div class="card-head"><h2>${esc(tr("ph.diag.title"))}</h2></div><p>${esc(tr("ph.diag.explain"))}</p><div class="ph-actions"><button type="button" class="btn btn-primary" data-ph-start="diag">${esc(tr("ph.runDiag"))}</button></div><p class="faint small">${esc(tr("ph.diag.levelNote", { mode: tr("mode." + A.selectedMode()) }))}</p></div>
      <div class="card history-card"><div class="card-head"><h2>${esc(tr("ph.prog.history"))}</h2><span class="muted small">${esc(tr("ph.prog.historyD"))}</span></div>${histList}</div>
    </div>`;
  }
  function review() {
    return `<div class="progress-grid"><div class="card history-card"><div class="card-head"><h2>${esc(tr("ph.review"))}</h2></div>${UI().reviewPanel()}</div></div>`;
  }

  // ───────── café home: Diagnostics row, Recommended practice, The Bar's topic list ─────────
  function summary() {
    const rs = recs();
    const groups = CT().LESSONS.filter((l) => l.families.length).map((l) => { const mine = rs.filter((r) => l.families.includes(r.family)); return { name: loc(l.title), pct: mine.length >= 3 ? acc(mine) : null }; });
    const known = groups.filter((g) => g.pct !== null).sort((a, b) => b.pct - a.pct);
    return { acc: acc(rs), tests: PT().history().length, answers: rs.length, best: known.length > 1 ? known[0] : null, worst: known.length > 1 ? known[known.length - 1] : null };
  }
  const lessonOf = (fam) => CT().LESSONS.find((l) => l.families.includes(fam));
  // the most useful Physics topic to practise next, from real answers only; null = not enough to go on
  function recommend(A) {
    const rs = recs();
    if (!rs.length && !PT().history().length) return null;
    const Q = UI().reviewQueue(rs);
    if (Q.length) {
      const f = Q[0], mine = rs.filter((r) => r.family === f.family), l = lessonOf(f.family);
      return { topic: UI().famTitle(f.family), why: tr("rec.ph.missed", { n: f.misses, when: A.rel(f.lastMiss) }), acc: acc(mine), n: mine.length,
        start: `data-ph-fams="${esc(f.family)}" data-level="normal"`, lesson: l ? `data-ph-lesson="${l.id}"` : "", levelNote: tr("rec.ph.fresh") };
    }
    const D = UI().diagnose(rs);
    if (D.weak.length) {
      const s = D.weak[0], m = UI().SKILL_MAP[s.id], level = s.acc < 0.6 ? "simple" : "normal";
      return { topic: tr("phs." + s.id), why: tr("rec.ph.weak", { pct: Math.round(s.acc * 100), n: s.n }), acc: Math.round(s.acc * 100), n: s.n,
        start: `data-ph-fams="${m.fams.join(",")}" data-level="${level}"`, lesson: `data-ph-lesson="${m.lesson}"`, levelNote: tr(level === "simple" ? "rec.guided" : "rec.normal") };
    }
    const untried = CT().LESSONS.find((l) => l.families.length && !rs.some((r) => l.families.includes(r.family)));
    if (untried) return { topic: loc(untried.title), why: tr("rec.notTried"), acc: null, n: 0, start: `data-ph-fams="${untried.families.filter((f) => B().byFam(f)).join(",")}" data-level="normal"`, lesson: `data-ph-lesson="${untried.id}"`, levelNote: tr("rec.normal") };
    const lowest = CT().LESSONS.filter((l) => l.families.length).map((l) => ({ l, a: acc(rs.filter((r) => l.families.includes(r.family))) })).sort((x, y) => x.a - y.a)[0];
    return lowest ? { topic: loc(lowest.l.title), why: tr("rec.ph.lowest", { pct: lowest.a }), acc: lowest.a, n: rs.filter((r) => lowest.l.families.includes(r.family)).length, start: `data-ph-fams="${lowest.l.families.join(",")}" data-level="challenge"`, lesson: `data-ph-lesson="${lowest.l.id}"`, levelNote: tr("rec.stretch") } : null;
  }
  // share of the tested Physics subtopics with at least one of your answers (coverage, not mastery)
  function coverage() {
    const rs = recs(), tested = C().coverage().filter((c) => c.status === "tested");
    return tested.length ? Math.round((tested.filter((c) => rs.some((r) => r.sub === c.id || (r.subs || []).includes(c.id))).length / tested.length) * 100) : 0;
  }
  function barTopics() {
    const rs = recs();
    return DRILL_GROUPS.map(([k, ids]) => {
      const rows = ids.map((id) => CT().get(id)).filter(Boolean).map((l) => {
        const mine = rs.filter((r) => l.families.includes(r.family)), a = acc(mine);
        const fams = l.families.filter((f) => B().byFam(f)), at = (m) => fams.filter((f) => B().byFam(f).modes.includes(m));
        const st = !mine.length ? tr("ph.st.none") : mine.length < 3 ? tr("ph.few", { n: mine.length }) : a >= 85 ? tr("ph.st.strong") : a >= 60 ? tr("ph.st.developing") : tr("ph.st.needs");
        return `<li class="bar-row" data-find="${esc((loc(l.title) + " " + tr(k)).toLowerCase())}"><span class="br-t"><b>${esc(loc(l.title))}</b><small>${esc(st)}${a === null ? "" : ` · ${a}%`}</small></span>
          <span class="br-acts">${at("simple").length ? `<button type="button" class="btn btn-sm btn-secondary" data-ph-fams="${at("simple").join(",")}" data-level="simple">${esc(tr("bar.guided"))}</button>` : ""}${at("normal").length ? `<button type="button" class="btn btn-sm btn-primary" data-ph-fams="${at("normal").join(",")}" data-level="normal">${esc(tr("bar.practise"))}</button>` : ""}<button type="button" class="btn btn-sm btn-link" data-ph-lesson="${l.id}">${esc(tr("prac.lesson"))}</button></span></li>`;
      }).join("");
      return rows ? `<div class="bar-group"><h3>${esc(tr(k))}</h3><ul class="bar-list">${rows}</ul></div>` : "";
    }).join("");
  }

  window.PhysHome = { welcome, topicCard, cardDesc, preview, activity, goals, concepts, stats, studioPlus, drills, progress, review, summary, recommend, barTopics, coverage };
})();
