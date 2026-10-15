(function () {
  "use strict";

  // ───────────────────────── exam layout ─────────────────────────
  // Matches the unit test outline: 34 marks in 60 minutes.
  const DEFAULT_SECONDS = 60 * 60;
  const durOf = (x) => (x && x.duration) || DEFAULT_SECONDS; // each test can have its own time limit
  const SECTIONS = [
    { key: "wr", name: "Written Response", short: "WR", count: 5, marks: 19 },
    { key: "nr", name: "Numerical Response", short: "NR", count: 5, marks: 5 },
    { key: "mc", name: "Multiple Choice", short: "MC", count: 10, marks: 10 },
  ];
  const TOTAL_MARKS = SECTIONS.reduce((s, x) => s + x.marks, 0);

  const KEYS = {
    history: "campfire-prep.history.v2",
    session: "campfire-prep.session.v2",
    prefs: "campfire-prep.prefs.v1",
    toured: "campfire-prep.toured.v1",
  };

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const MCB = window.MC_BANK, NRB = window.NR_BANK, WRB = window.WR_BANK;
  const CM = window.CLASSMATE || { wr: [], nr: [], mc: [] };
  const CHM = window.CH_MC_BANK || [], CHN = window.CH_NR_BANK || [], CHW = window.CH_WR_BANK || [];
  const BANKS = {
    mc: new Map([...MCB, ...CHM, ...CM.mc].map((q) => [q.id, q])),
    nr: new Map([...NRB, ...CHN, ...CM.nr].map((q) => [q.id, q])),
    wr: new Map([...WRB, ...CHW, ...CM.wr].map((q) => [q.id, q])),
  };
  const LEVELS = {
    classmate: { label: "Classmate's test", short: "Classmate", hint: "Your classmate's practice test: the same 20 questions every time. Your teacher says it's a bit softer than the real test." },
    normal: { label: "Normal", short: "Normal", hint: "Unit-test level, laid out like the real thing. Fresh questions every time." },
    challenge: { label: "Challenge", short: "Challenge", hint: "Much harder than the real test: nested radicals, cube-root conjugates, double squaring. A lower mark here is normal." },
  };
  const levelOf = (a) => (a && a.level) || "normal";
  const LETTERS = ["A", "B", "C", "D", "E", "F"];
  const Check = window.MathCheck;

  // ───────────────────────── storage ─────────────────────────
  const store = {
    get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* full or blocked */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
  };
  const getHistory = () => store.get(KEYS.history, []);
  const getPrefs = () => Object.assign({ buddyMode: "normal", level: "normal", name: "", minutes: 60, hardcore: false, drain: false }, store.get(KEYS.prefs, {}));
  const setPrefs = (p) => store.set(KEYS.prefs, { ...getPrefs(), ...p });

  // ───────────────────────── helpers ─────────────────────────
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function tex(t, display) {
    if (window.katex) { try { return window.katex.renderToString(t, { throwOnError: false, displayMode: !!display }); } catch { /* fall through */ } }
    return `<code>${esc(t)}</code>`;
  }
  function renderMath(str) {
    return String(str).split(/(\\\([\s\S]*?\\\))/).map((part) =>
      part.startsWith("\\(") && part.endsWith("\\)") ? tex(part.slice(2, -2)) : part).join("");
  }
  function shuffle(arr, rnd = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function clock(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; }
  function dur(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60), s = sec % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  function hoursMins(sec) {
    const m = Math.round(sec / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
  }
  function niceDate(ts, withTime = true) {
    const d = new Date(ts);
    const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    return withTime ? `${date} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : date;
  }
  const fmtMarks = (n) => (Math.round(n * 10) / 10).toString();
  const compareAttempts = (a, b) => b.percent - a.percent || a.totalTime - b.totalTime;

  // ───────────────────────── state ─────────────────────────
  let session = null, fire = null, timerId = null, lastTick = 0, lastSave = 0;
  let viewing = null, reviewFilter = "all";
  let pad = null;

  function show(name) {
    for (const s of $$(".screen")) s.hidden = s.id !== `screen-${name}`;
    $("#topbar-test").hidden = name !== "test";
    document.body.dataset.screen = name;
    window.scrollTo({ top: 0 });
  }
  const makeScene = () => $("#scene-template").content.firstElementChild.cloneNode(true);

  // ───────────────────────── title screen ─────────────────────────
  function renderTitle() {
    show("start");
    const hero = $("#hero-scene");
    if (!hero.firstChild) {
      const sc = makeScene();
      sc.classList.add("is-cozy");
      sc.style.setProperty("--heat", "58");
      hero.appendChild(sc);
    }
    const toured = store.get(KEYS.toured, false);
    $("#title-note").textContent = toured
      ? "Welcome back. Your tests and progress are waiting in Basecamp."
      : "First time? Entering Basecamp starts a short guided tour. You can skip it.";
  }

  // ───────────────────────── session timing ─────────────────────────
  // elapsed = seconds of test time used. The clock runs while the test is open or
  // closed without pausing (like a real exam); it stops only while paused.
  function normalizeSession(s) {
    if (!s) return s;
    if (typeof s.elapsed !== "number") { s.elapsed = (Date.now() - s.startedAt) / 1000; s.lastActive = Date.now(); }
    if (!s.lastActive) s.lastActive = Date.now();
    s.pauses = s.pauses || 0;
    return s;
  }
  function timeLeftOf(s) {
    if (s.group && s.group.scheduled) return durOf(s) - (Date.now() - s.group.start) / 1000;
    const away = s.paused ? 0 : (Date.now() - s.lastActive) / 1000;
    return durOf(s) - s.elapsed - away;
  }
  const savedSession = () => normalizeSession(store.get(KEYS.session, null));

  // ───────────────────────── Basecamp ─────────────────────────
  function goHome() {
    show("home");
    renderHome();
  }

  function renderHome() {
    const history = getHistory();
    const prefs = getPrefs();
    const lv = LEVELS[prefs.level] ? prefs.level : "normal";
    const analyze = (h) => window.Insights.analyze(h, qOf, (it) => gradeItem(it).parts);
    // Topic advice ignores Challenge tests so they don't drag your mastery down
    const core = analyze(history.filter((a) => levelOf(a) !== "challenge"));
    const atLevel = analyze(history.filter((a) => levelOf(a) === lv));
    const all = analyze(history);

    // In-progress test
    let saved = savedSession();
    if (saved && saved.items && timeLeftOf(saved) <= 0) { finishExpiredSession(saved); saved = null; }
    const box = $("#resume-box");
    if (saved && saved.items) {
      const answered = saved.items.filter(isAnswered).length;
      const grp = saved.group ? ` · group ${esc(saved.group.code)}` : "";
      box.innerHTML = `
        <div class="resume-card ${saved.paused ? "paused" : ""}">
          <div>
            <span class="resume-kicker">${saved.paused ? "⏸ Paused test" : "Test in progress"} · ${esc(LEVELS[levelOf(saved)].short)}</span>
            <span class="resume-meta"><b>${clock(timeLeftOf(saved))}</b> left · ${answered}/${saved.items.length} answered${saved.paused ? "" : " · clock is running"}${grp}</span>
          </div>
          <div class="resume-actions">
            <button class="btn btn-primary" id="btn-resume" type="button">Resume</button>
            <button class="btn btn-link" id="btn-discard" type="button">Discard</button>
          </div>
        </div>`;
      $("#btn-resume").onclick = resumeTest;
      $("#btn-discard").onclick = async () => {
        if (await confirmDialog("Discard this test?", "Your answers on the unfinished test will be deleted. It won't count in your history.", "Discard", "Keep it")) { store.del(KEYS.session); renderHome(); }
      };
    } else box.innerHTML = "";
    $("#btn-create").textContent = saved ? "Create a new test instead" : "Create test";
    $("#btn-create").classList.toggle("btn-primary", !saved);
    $("#btn-create").classList.toggle("btn-secondary", !!saved);

    // Pickers
    const fireOn = prefs.buddyMode !== "off";
    $("#setup-summary").innerHTML = [
      `<span><b>${esc(LEVELS[prefs.level] ? LEVELS[prefs.level].label : "Normal")}</b></span>`,
      `<span><b>${prefs.minutes}</b> min</span>`,
      `<span>${esc(window.Campfire.MODES[prefs.buddyMode].label)}${fireOn && prefs.buddyMode !== "off" ? " campfire" : ""}</span>`,
      fireOn && prefs.hardcore ? `<span class="on">Puppy can lose</span>` : "",
      fireOn && prefs.drain ? `<span class="on">Armadillo mode</span>` : "",
    ].join("");
    for (const b of $$("#level-pick button")) { const on = b.dataset.level === lv; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); }
    document.querySelector(".launch-card").dataset.level = prefs.level;

    // Greeting
    if (!all.count) {
      $("#home-greeting").textContent = "Welcome to Basecamp.";
      $("#home-sub").textContent = "This is home between tests. Take your first practice test and this page fills in with your scores, trends and the topics to work on.";
    } else {
      const weak = core.topics.find((t) => t.pct < 85);
      const bestNormal = history.filter((a) => levelOf(a) === "normal").sort(compareAttempts)[0];
      const bestCh = history.filter((a) => levelOf(a) === "challenge").sort(compareAttempts)[0];
      $("#home-greeting").textContent = all.count === 1 ? "One test down." : `${all.count} tests down.`;
      $("#home-sub").innerHTML = (bestNormal ? `Your best Normal test is <b>${bestNormal.percent}%</b>. ` : "") +
        (bestCh ? `Challenge best: <b>${bestCh.percent}%</b>. ` : "") +
        (weak ? `Today's focus: <b>${esc(weak.topic)}</b>.` : core.count ? "Every topic is looking strong." : "");
    }

    // Stat tiles (best / average are for the selected level)
    const ln = LEVELS[lv].short;
    $("#home-stats").innerHTML = `
      <div class="tile${all.count ? "" : " empty-tile"}"><span class="tile-value">${all.count || "—"}</span><span class="tile-label">tests taken</span></div>
      <div class="tile${atLevel.count ? "" : " empty-tile"}"><span class="tile-value">${atLevel.count ? atLevel.best.percent + "%" : "—"}</span><span class="tile-label">${esc(ln)} best</span></div>
      <div class="tile${atLevel.count ? "" : " empty-tile"}"><span class="tile-value">${atLevel.count ? atLevel.recentAvg + "%" : "—"}</span><span class="tile-label">${esc(ln)} average${atLevel.count ? `, last ${Math.min(5, atLevel.count)}` : ""}</span></div>
      <div class="tile${all.count ? "" : " empty-tile"}"><span class="tile-value">${all.count ? hoursMins(all.studySeconds) : "—"}</span><span class="tile-label">time practising</span></div>`;
    renderTrend(atLevel, LEVELS[lv].label);
    renderFocus(core);
    renderHabits(core);
    renderHistory(history);
    renderMastery(core);
  }

  // Score trend: one series, 0–100% scale, best and latest labelled, hover tooltip.
  function renderTrend(ins, levelName = "Normal") {
    const el = $("#trend");
    const pts = ins.trend;
    if (!pts.length) {
      el.innerHTML = `<div class="trend-empty"><svg viewBox="0 0 600 150" aria-hidden="true"><path d="M20 120 C 140 110, 220 80, 320 74 S 500 40, 580 30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 7"/></svg><p>Your ${esc(levelName)} score trend appears here after your first ${esc(levelName)} test.</p></div>`;
      return;
    }
    const W = 600, H = 200, L = 40, R = 18, T = 18, B = 30;
    const xs = (k) => pts.length === 1 ? (L + W - R) / 2 : L + (k * (W - L - R)) / (pts.length - 1);
    const ys = (v) => T + (1 - v / 100) * (H - T - B);
    const grid = [0, 25, 50, 75, 100].map((v) => `<line x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}" class="tg"/><text x="${L - 8}" y="${ys(v) + 4}" class="tl" text-anchor="end">${v}%</text>`).join("");
    const line = pts.map((p, k) => `${k ? "L" : "M"}${xs(k).toFixed(1)} ${ys(p.pct).toFixed(1)}`).join(" ");
    const area = pts.length > 1 ? `<path d="${line} L${xs(pts.length - 1)} ${ys(0)} L${xs(0)} ${ys(0)} Z" class="ta"/>` : "";
    const bestK = pts.findIndex((p) => p.id === ins.best.id), lastK = pts.length - 1;
    const label = (k, txt, above) => {
      const x = Math.min(W - R - 4, Math.max(L + 4, xs(k)));
      const anchor = x > W - 80 ? "end" : x < L + 60 ? "start" : "middle";
      return `<text x="${x}" y="${ys(pts[k].pct) + (above ? -12 : 20)}" class="tv" text-anchor="${anchor}">${txt}</text>`;
    };
    const labels = [label(bestK, `Best ${pts[bestK].pct}%`, pts[bestK].pct < 90 || true)];
    if (lastK !== bestK) labels.push(label(lastK, `Latest ${pts[lastK].pct}%`, pts[lastK].pct < pts[bestK].pct - 8 ? false : pts[lastK].pct < 15));
    const dots = pts.map((p, k) => `
      <g class="tdot${k === bestK ? " best" : ""}" tabindex="0" data-k="${k}" role="img" aria-label="Test ${k + 1}, ${niceDate(p.date, false)}: ${p.pct}% in ${clock(p.time)}">
        <circle cx="${xs(k)}" cy="${ys(p.pct)}" r="16" class="hit"/>
        <circle cx="${xs(k)}" cy="${ys(p.pct)}" r="${k === bestK ? 6 : 4.5}" class="mark"/>
      </g>`).join("");
    const xl = pts.length > 1 ? `<text x="${xs(0)}" y="${H - 8}" class="tl" text-anchor="start">Test 1</text><text x="${xs(lastK)}" y="${H - 8}" class="tl" text-anchor="end">Test ${pts.length}</text>` : `<text x="${xs(0)}" y="${H - 8}" class="tl" text-anchor="middle">Test 1</text>`;
    el.innerHTML = `
      <div class="trend-head"><span>${esc(levelName)} score by test</span><span class="muted small">${pts.length} test${pts.length > 1 ? "s" : ""}</span></div>
      <div class="trend-wrap">
        <svg viewBox="0 0 ${W} ${H}" class="trend-svg" role="group" aria-label="Score by test">${grid}${area}<path d="${line}" class="tline"/>${dots}${labels.join("")}${xl}</svg>
        <div class="trend-tip" id="trend-tip" hidden></div>
      </div>`;
    const tip = $("#trend-tip"), wrap = $(".trend-wrap", el), svg = $("svg", el);
    const showTip = (g) => {
      const p = pts[Number(g.dataset.k)];
      const c = $(".mark", g).getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      tip.innerHTML = `<b>${p.pct}%</b><span>${esc(niceDate(p.date, false))} · ${clock(p.time)}</span>`;
      tip.hidden = false;
      const x = c.left + c.width / 2 - wr.left, y = c.top - wr.top;
      tip.style.left = `${Math.min(wr.width - tip.offsetWidth / 2 - 4, Math.max(tip.offsetWidth / 2 + 4, x))}px`;
      tip.style.top = `${y - 8}px`;
    };
    for (const g of $$(".tdot", svg)) {
      g.addEventListener("pointerenter", () => showTip(g));
      g.addEventListener("focus", () => showTip(g));
      g.addEventListener("pointerleave", () => { tip.hidden = true; });
      g.addEventListener("blur", () => { tip.hidden = true; });
      g.addEventListener("click", () => { const a = getHistory().find((x) => x.id === pts[Number(g.dataset.k)].id); if (a) showResults(a, false); });
    }
  }

  function renderFocus(ins) {
    const el = $("#focus");
    if (!ins.count) { el.innerHTML = `<p class="empty-note">After your first test, the topics that cost you the most marks show up here, each with a tip for fixing it.</p>`; return; }
    const weak = ins.topics.filter((t) => t.pct < 85).slice(0, 3);
    const strong = ins.topics.filter((t) => t.pct >= 85).sort((a, b) => b.pct - a.pct).slice(0, 4);
    el.innerHTML = (weak.length ? weak.map((t, k) => `
      <div class="focus-item ${window.Insights.level(t.pct)}">
        <div class="focus-top">
          <span class="focus-rank">${k + 1}</span>
          <span class="focus-name">${esc(t.topic)}</span>
          <span class="level-pill ${window.Insights.level(t.pct)}">${window.Insights.levelLabel(t.pct)} · ${t.pct}%</span>
        </div>
        <div class="bar"><div class="bar-fill ${window.Insights.level(t.pct) === "low" ? "low" : "mid"}" style="width:${t.pct}%"></div></div>
        <p class="focus-meta">${fmtMarks(t.earned)} of ${t.max} marks across ${t.seen} question${t.seen > 1 ? "s" : ""}${t.lastPct !== null ? ` · last test ${t.lastPct}%` : ""}</p>
        <p class="focus-tip"><b>Try this:</b> ${esc(t.tip)}</p>
      </div>`).join("") : `<p class="empty-note">Nothing below 85% right now. Keep taking tests to stay sharp.</p>`) +
      (strong.length ? `<div class="strong-row"><span class="muted small">Strong:</span>${strong.map((t) => `<span class="chip chip-good">${esc(t.topic)} ${t.pct}%</span>`).join("")}</div>` : "");
  }

  function renderHabits(ins) {
    const el = $("#habits");
    if (!ins.count) { el.innerHTML = `<p class="empty-note">This tracks the habits that cost marks on written answers, like answers not in simplest form or extraneous roots you kept.</p>`; return; }
    const sec = SECTIONS.map((s) => {
      const v = ins.sections[s.key] || { earned: 0, max: 0 };
      const pct = v.max ? Math.round((v.earned / v.max) * 100) : 0;
      return `<div class="topic-row"><div class="topic-row-head"><span>${s.name}</span><span><b>${pct}%</b> <span class="muted">· ${fmtMarks(v.earned)}/${v.max} all time</span></span></div><div class="bar"><div class="bar-fill ${pct >= 85 ? "good" : pct >= 65 ? "mid" : "low"}" style="width:${pct}%"></div></div></div>`;
    }).join("");
    const habits = ins.habits.length ? `<ul class="habit-list">${ins.habits.map((h) => `
        <li><span class="habit-marks">−${fmtMarks(h.marks)}</span><span><b>${esc(h.label)}</b><span class="muted small"> · ${h.count} time${h.count > 1 ? "s" : ""}</span><br><span class="habit-tip">${esc(h.tip)}</span></span></li>`).join("")}</ul>`
      : `<p class="empty-note">No marks lost to form or checking habits. Nice and tidy.</p>`;
    const slow = ins.slowTopic ? `<p class="slow-note">⏱ <b>Time sink:</b> ${esc(ins.slowTopic.topic)} takes you about <b>${dur(ins.slowTopic.avgTime)}</b> per question.</p>` : "";
    el.innerHTML = `${habits}${slow}<h3 class="sub-h">By section</h3>${sec}`;
  }

  function renderMastery(ins) {
    const el = $("#mastery");
    const all = [...new Set([...WRB, ...NRB, ...MCB].map((q) => q.topic))];
    const seen = new Map(ins.topics.map((t) => [t.topic, t]));
    const rows = all.map((name) => seen.get(name) || { topic: name, pct: null }).sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
    el.innerHTML = `<div class="mastery-grid">${rows.map((t) => t.pct === null ? `
      <div class="mastery-row unseen"><span class="m-name">${esc(t.topic)}</span><span class="m-bar"><span class="bar"></span></span><span class="m-val muted">not yet</span></div>` : `
      <div class="mastery-row"><span class="m-name">${esc(t.topic)}</span><span class="m-bar"><span class="bar"><span class="bar-fill ${t.pct >= 85 ? "good" : t.pct >= 65 ? "mid" : "low"}" style="width:${t.pct}%"></span></span></span><span class="m-val"><b>${t.pct}%</b> <span class="level-pill ${window.Insights.level(t.pct)}">${window.Insights.levelLabel(t.pct)}</span></span></div>`).join("")}</div>`;
  }

  function renderHistory(h) {
    const list = $("#history-list");
    if (!h.length) { list.innerHTML = `<p class="empty-note">No tests yet. Your finished tests will be listed here with their marks and times.</p>`; return; }
    const bestIds = new Set(Object.keys(LEVELS).map((lv) => (h.filter((a) => levelOf(a) === lv).sort(compareAttempts)[0] || {}).id));
    const recent = h.slice().sort((a, b) => b.date - a.date);
    const sec = (a, k) => a.sections && a.sections[k] ? `${fmtMarks(a.sections[k].earned)}/${a.sections[k].max}` : "—";
    list.innerHTML = `
      <div class="table-scroll"><table class="history-table">
        <thead><tr><th>Date</th><th>Mark</th><th>WR</th><th>NR</th><th>MC</th><th>Time</th><th>Avg / Q</th><th class="sr-only">Review</th></tr></thead>
        <tbody>
          ${recent.map((a) => `
            <tr data-id="${esc(a.id)}" tabindex="0" title="Review this test">
              <td>${esc(niceDate(a.date))} <span class="pill pill-level ${levelOf(a)}">${esc(LEVELS[levelOf(a)].short)}</span>${a.group ? ' <span class="pill pill-group">Group</span>' : ""}${bestIds.has(a.id) ? ' <span class="pill pill-best">Best</span>' : ""}${a.timedOut ? ' <span class="pill">Timed out</span>' : ""}</td>
              <td><b>${a.percent}%</b> <span class="muted">${fmtMarks(a.earned)}/${a.total}</span></td>
              <td>${sec(a, "wr")}</td><td>${sec(a, "nr")}</td><td>${sec(a, "mc")}</td>
              <td>${clock(a.totalTime)}</td>
              <td>${dur(a.avgTime)}</td>
              <td class="row-go" aria-hidden="true">Review →</td>
            </tr>`).join("")}
        </tbody>
      </table></div>
      <button class="btn btn-link" id="btn-clear-history" type="button">Clear history</button>`;
    for (const tr of $$("tr[data-id]", list)) {
      const open = () => { const a = getHistory().find((x) => x.id === tr.dataset.id); if (a) showResults(a, false); };
      tr.addEventListener("click", open);
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
    }
    $("#btn-clear-history").addEventListener("click", async () => {
      if (await confirmDialog("Clear all saved tests?", "This deletes every saved score in this browser. It can't be undone.", "Clear history", "Cancel")) { store.del(KEYS.history); renderHome(); }
    });
  }

  function finishExpiredSession(saved) {
    session = saved;
    const attempt = buildAttempt(true);
    attempt.totalTime = durOf(saved);
    const h = getHistory(); h.push(attempt); store.set(KEYS.history, h);
    store.del(KEYS.session);
    session = null;
  }

  // ───────────────────────── building a test ─────────────────────────
  function spread(bank, n, rnd = Math.random) {
    const groups = new Map();
    for (const q of shuffle(bank, rnd)) { if (!groups.has(q.topic)) groups.set(q.topic, []); groups.get(q.topic).push(q); }
    const lists = shuffle([...groups.values()], rnd);
    const picked = [];
    while (picked.length < Math.min(n, bank.length)) for (const l of lists) if (l.length && picked.length < n) picked.push(l.shift());
    return shuffle(picked, rnd);
  }
  const wrItem = (q) => ({ kind: "wr", qid: q.id, responses: {}, work: "", time: 0, flagged: false });
  const nrItem = (q) => ({ kind: "nr", qid: q.id, response: "", time: 0, flagged: false });
  const mcItem = (q, rnd = Math.random) => ({ kind: "mc", qid: q.id, order: q.order ? q.order.slice() : shuffle(q.c.map((_, i) => i), rnd), chosen: null, time: 0, flagged: false });
  // rnd is seeded for group tests, so every device builds the identical test
  function buildTest(level = "normal", rnd = Math.random) {
    if (level === "classmate") return [...CM.wr.map(wrItem), ...CM.nr.map(nrItem), ...CM.mc.map((q) => mcItem(q))];
    const wr = level === "challenge" ? CHW : WRB, nr = level === "challenge" ? CHN : NRB, mc = level === "challenge" ? CHM : MCB;
    const items = [];
    for (const slot of window.WR_SLOTS) {
      const pool = wr.filter((q) => q.slot === slot.slot);
      items.push(wrItem(pool[Math.floor(rnd() * pool.length)]));
    }
    for (const q of spread(nr, 5, rnd)) items.push(nrItem(q));
    for (const q of spread(mc, 10, rnd)) items.push(mcItem(q, rnd));
    return items;
  }

  const qOf = (item) => BANKS[item.kind].get(item.qid);
  const maxMarks = (item) => item.kind === "wr" ? qOf(item).parts.reduce((s, p) => s + p.marks, 0) : 1;
  function answeredParts(item) {
    if (item.kind === "mc") return item.chosen !== null ? 1 : 0;
    if (item.kind === "nr") return String(item.response || "").trim() ? 1 : 0;
    return qOf(item).parts.filter((p) => String(item.responses[p.key] || "").trim()).length;
  }
  const totalParts = (item) => item.kind === "wr" ? qOf(item).parts.length : 1;
  const isAnswered = (item) => answeredParts(item) === totalParts(item);
  function labelOf(i, items = session.items) {
    const item = items[i];
    const sec = SECTIONS.find((s) => s.key === item.kind);
    const n = items.slice(0, i + 1).filter((x) => x.kind === item.kind).length;
    return { sec, n, text: item.kind === "wr" ? `Q${n}` : `${sec.short} ${n}` };
  }

  // opts.group = decoded group code + name → seeded questions and (optionally) a shared clock
  function startTest(opts = {}) {
    const now = Date.now();
    const g = opts.group || null;
    const level = g ? g.level : opts.level || getPrefs().level;
    const scheduled = !!(g && g.start);
    const prefs = getPrefs();
    const minutes = g ? g.minutes || 60 : opts.minutes || prefs.minutes || 60;
    const fireOn = prefs.buddyMode !== "off";
    session = {
      id: now.toString(36) + Math.random().toString(36).slice(2, 6),
      startedAt: scheduled ? g.start : now,
      elapsed: scheduled ? Math.max(0, (now - g.start) / 1000) : 0,
      lastActive: now, paused: false, pauses: 0, level,
      group: g ? { code: g.code, name: g.name || "", start: g.start, scheduled } : null,
      items: buildTest(level, g ? window.Group.rng(g.seed) : Math.random),
      current: 0, mode: prefs.buddyMode, buddy: null,
      duration: minutes * 60,
      hardcore: fireOn && !!prefs.hardcore,
      drain: fireOn && !!prefs.drain && !scheduled, // a shared clock can't drain for one person
      gameOvers: 0, turnedOff: false,
    };
    saveSession();
    enterTest();
  }
  function resumeTest() {
    const saved = savedSession();
    if (!saved) return goHome();
    session = saved;
    if (session.group && session.group.scheduled) session.elapsed = Math.max(0, (Date.now() - session.group.start) / 1000);
    else if (!session.paused) session.elapsed += Math.max(0, (Date.now() - session.lastActive) / 1000); // time away counts
    session.lastActive = Date.now();
    enterTest();
  }

  // ───────────────────────── test screen ─────────────────────────
  function enterTest() {
    show("test");
    document.body.classList.toggle("buddy-off", session.mode === "off");
    // A scheduled group test shares one clock, so it can't be paused
    $("#btn-pause").hidden = !!(session.group && session.group.scheduled);
    $("#seg-bar").innerHTML = SECTIONS.map((s) => `<span class="seg" style="flex:${s.count}" title="${s.name}"><span class="seg-fill" data-sec="${s.key}"></span></span>`).join("");

    const slot = $("#test-scene");
    slot.innerHTML = "";
    const scene = makeScene();
    slot.appendChild(scene);
    if (fire) fire.destroy();
    fire = new window.Campfire({ scene, gauge: $("#gauge"), button: $("#btn-fuel"), buttonText: $("#fuel-text"), status: $("#buddy-status") }, session.mode);
    if (session.buddy) {
      Object.assign(fire.stats, session.buddy.stats);
      fire.heat = session.buddy.heat;
      fire.status = session.buddy.status === "burning" ? "burnt" : session.buddy.status;
      fire.render();
    }
    if (location.hash === "#debug") window.__fire = fire;
    fire.onEvent = (kind) => { if (session && session.hardcore && !session.demo) showGameOver(kind); };
    $("#btn-fire-off").hidden = session.mode === "off" || !!session.demo;

    if (!pad && window.Scratchpad) {
      pad = new window.Scratchpad($("#scratchpad"));
      pad.onChange = () => { if (session && session.demo) return; clearTimeout(pad._saveT); pad._saveT = setTimeout(saveSession, 500); };
    }

    renderQuestion();
    lastTick = Date.now();
    clearInterval(timerId);
    timerId = setInterval(tick, 250);
    if (session.mode === "off" && session.turnedOff) document.body.classList.add("buddy-off");
    if (session.paused) showPause();
    else if (session.gameOver) { const k = session.gameOver; session.gameOver = null; session.gameOvers--; fire.status = k; fire.render(); showGameOver(k); }
    else { fire.start(); if (pad) pad.show(); }
    tick();
  }

  function tick() {
    if (!session) return;
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    if (!session.paused && !session.demo) {
      if (session.group && session.group.scheduled) session.elapsed = Math.max(0, (now - session.group.start) / 1000); // everyone shares one clock
      else if (!session.gameOver) session.elapsed += dt * drainRate();
      session.items[session.current].time += dt;
      session.lastActive = now;
    }
    const left = durOf(session) - session.elapsed;
    $("#timer-value").textContent = clock(left);
    const rate = session.paused || session.gameOver ? 1 : drainRate();
    const badge = $("#drain-badge");
    badge.hidden = rate === 1;
    if (rate > 1) { badge.textContent = `×${rate}`; badge.dataset.rate = rate; }
    $("#timer").title = rate > 1 ? `Armadillo mode: the clock is draining ${rate}× faster. Get the fire back in the green!` : "";
    $("#timer").dataset.level = session.paused ? "paused" : rate > 1 ? "drain" : left < 60 ? "danger" : left < 300 ? "warn" : "ok";
    if (left <= 0) return finishTest(true);
    if (now - lastSave > 3000) saveSession();
  }

  const drainRate = () => (session && session.drain && fire && !session.demo ? fire.drain() : 1);

  // ───────── Puppy can lose: game over, but the test always goes on ─────────
  function showGameOver(kind) {
    if (!session || session.gameOver) return;
    tick();
    session.gameOver = kind;
    session.gameOvers = (session.gameOvers || 0) + 1;
    if (fire) fire.stop();
    if (pad) pad.hide();
    const burnt = kind === "burnt";
    $("#go-icon").textContent = burnt ? "🔥" : "🧊";
    $("#go-title").textContent = burnt ? "The camp burned down." : "Your puppy froze solid.";
    $("#go-text").textContent = (session.group && session.group.scheduled)
      ? "Math comes first: your answers are safe and your mark isn't affected. (The group clock keeps running.)"
      : "Math comes first: your answers are safe and your mark isn't affected. The clock is stopped while you decide.";
    $("#gameover").hidden = false;
    $("#gameover").dataset.kind = kind;
    $("#screen-test").inert = true; $("#topbar-test").inert = true;
    $("#go-revive").focus();
    saveSession();
  }
  function closeGameOver() {
    $("#gameover").hidden = true;
    $("#screen-test").inert = false; $("#topbar-test").inert = false;
    session.gameOver = null;
    lastTick = Date.now();
    if (pad) pad.show();
    saveSession();
  }
  function reviveFire() { if (!session) return; if (fire) { fire.revive(); fire.start(); } closeGameOver(); }
  function turnOffCampfire() {
    if (!session || !fire) return;
    fire.turnOff();
    session.mode = "off";
    session.turnedOff = true;
    session.buddyAtOff = fire.snapshot();
    document.body.classList.add("buddy-off");
    $("#btn-fire-off").hidden = true;
    saveSession();
  }

  function saveSession() {
    if (!session || session.demo) return;
    if (fire) session.buddy = { heat: fire.heat, status: fire.status, stats: { ...fire.stats } };
    store.set(KEYS.session, session);
    lastSave = Date.now();
  }

  // ───────── pause lock ─────────
  function pauseTest() {
    if (!session || session.paused || session.demo || (session.group && session.group.scheduled)) return;
    tick();
    session.paused = true;
    session.pauses++;
    saveSession();
    showPause();
  }
  function showPause() {
    if (fire) fire.stop();
    if (pad) pad.hide();
    if (document.activeElement) document.activeElement.blur();
    $("#screen-test").inert = true;
    $("#topbar-test").inert = true;
    const sc = $("#pause-scene");
    sc.innerHTML = "";
    const scene = makeScene();
    scene.classList.add("is-sleeping");
    scene.style.setProperty("--heat", "34");
    sc.appendChild(scene);
    const answered = session.items.filter(isAnswered).length;
    $("#pause-time").textContent = clock(durOf(session) - session.elapsed);
    $("#pause-detail").innerHTML = `${answered} of ${session.items.length} answered, stopped on ${labelOf(session.current).text}. Your answers, scratch work and campfire are saved. You can close this tab and come back later — the timer stays frozen until you resume.`;
    $("#pause-overlay").hidden = false;
    document.body.classList.add("is-paused");
    $("#btn-unpause").focus();
  }
  function unpauseTest() {
    if (!session) return;
    session.paused = false;
    lastTick = Date.now();
    session.lastActive = lastTick;
    $("#pause-overlay").hidden = true;
    document.body.classList.remove("is-paused");
    $("#screen-test").inert = false;
    $("#topbar-test").inert = false;
    if (fire) fire.start();
    if (pad) pad.show();
    saveSession();
  }
  function pauseToHome() {
    saveSession();
    teardownTest();
    goHome();
  }
  function teardownTest() {
    clearInterval(timerId); timerId = null;
    if (fire) { fire.destroy(); fire = null; }
    if (pad) pad.hide();
    $("#pause-overlay").hidden = true;
    $("#gameover").hidden = true;
    document.body.classList.remove("is-paused", "buddy-off");
    $("#screen-test").inert = false;
    $("#topbar-test").inert = false;
    session = null;
  }

  function renderProgress() {
    const n = session.items.length;
    const answered = session.items.filter(isAnswered).length;
    const { sec, n: k } = labelOf(session.current);
    $("#q-counter").textContent = `${sec.name} · ${session.items[session.current].kind === "wr" ? "Q" : "#"}${k} of ${sec.count}`;
    $("#answered-counter").textContent = `${answered}/${n} answered`;
    for (const s of SECTIONS) {
      const xs = session.items.filter((it) => it.kind === s.key);
      const f = $(`.seg-fill[data-sec="${s.key}"]`);
      if (f) f.style.width = `${(xs.filter(isAnswered).length / xs.length) * 100}%`;
    }
  }

  function renderNav() {
    $("#nav-grid").innerHTML = SECTIONS.map((sec) => {
      const cells = session.items.map((it, i) => ({ it, i })).filter((x) => x.it.kind === sec.key).map(({ it, i }, k) => {
        const done = isAnswered(it), some = !done && answeredParts(it) > 0;
        return `<button type="button" class="nav-cell${i === session.current ? " current" : ""}${done ? " answered" : ""}${some ? " partial" : ""}${it.flagged ? " flagged" : ""}"
          data-i="${i}" aria-label="${sec.name} ${k + 1}${done ? ", answered" : some ? ", partly answered" : ""}${it.flagged ? ", flagged" : ""}">${sec.key === "wr" ? "Q" : ""}${k + 1}</button>`;
      }).join("");
      if (!cells) return "";
      return `<div class="nav-section"><div class="nav-section-head"><span>${sec.name}</span><span class="muted">${sec.marks} marks</span></div><div class="nav-cells${sec.key === "mc" ? " wide" : ""}">${cells}</div></div>`;
    }).join("");
  }

  function renderQuestion() {
    const item = session.items[session.current];
    const q = qOf(item);
    const { text } = labelOf(session.current);
    const marks = maxMarks(item);

    $("#q-topic").textContent = q.topic;
    $("#q-label").textContent = `${text} · ${marks} mark${marks > 1 ? "s" : ""}`;
    const flag = $("#btn-flag");
    flag.setAttribute("aria-pressed", item.flagged);
    flag.textContent = item.flagged ? "⚑ Flagged" : "⚐ Flag";

    const body = $("#q-body");
    if (item.kind === "mc") {
      body.innerHTML = `
        <div class="q-text">${renderMath(q.q)}</div>
        <div class="choices" role="radiogroup" aria-label="Answer choices">
          ${item.order.map((orig, i) => `
            <button type="button" class="choice${item.chosen === orig ? " selected" : ""}" role="radio" aria-checked="${item.chosen === orig}" data-orig="${orig}">
              <span class="choice-letter">${LETTERS[i]}</span>
              <span class="choice-body">${renderMath(q.c[orig])}</span>
            </button>`).join("")}
        </div>`;
    } else if (item.kind === "nr") {
      body.innerHTML = `
        <div class="q-text">${renderMath(q.q)}</div>
        <div class="nr-box">
          <label class="answer-label" for="nr-input">Your answer <span class="muted">· ${esc(q.fmt || "Number")}</span></label>
          <input class="answer-input nr-input" id="nr-input" data-field="nr" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${esc(item.response || "")}" placeholder="e.g. 45" />
          <div class="preview" data-preview="nr"></div>
        </div>`;
      updatePreview($("#nr-input"));
    } else {
      body.innerHTML = `
        <div class="q-text">${renderMath(q.intro)}</div>
        <div class="wr-parts">${q.parts.map((p) => partHTML(p, item.responses[p.key] || "")).join("")}</div>
        <details class="work-box"${item.work ? " open" : ""}>
          <summary>Type out your steps <span class="muted">(optional — saved with your review)</span></summary>
          <textarea class="work-input" data-field="work" rows="5" placeholder="Write your steps here, or use the scratchpad. Your teacher marks the steps — practise showing them!">${esc(item.work || "")}</textarea>
        </details>
        <p class="input-help">Type <kbd>√</kbd> with the buttons or as <code>sqrt</code>. Examples: <code>3√2</code>, <code>(6+2√5)/7</code>, <code>∛(-40)</code>. For equations, list solutions like <code>2, -3</code> or type <code>none</code>.</p>`;
      for (const inp of $$("[data-part]", body)) updatePreview(inp);
    }

    if (!item.sketch) item.sketch = [];
    if (pad) pad.setPage(item.sketch, text);
    $("#btn-prev").disabled = session.current === 0;
    $("#btn-next").disabled = session.current === session.items.length - 1;
    renderProgress();
    renderNav();
  }

  function partHTML(p, val) {
    const m = `<span class="marks-badge">${p.marks} mark${p.marks > 1 ? "s" : ""}</span>`;
    const head = `<div class="part-head">${p.label ? `<span class="part-label">${p.label}</span>` : ""}<span class="part-prompt">${renderMath(p.prompt)}</span>${m}</div>`;
    if (p.kind === "choice") {
      return `<div class="wr-part">${head}
        <div class="segmented paper-seg" role="radiogroup">
          ${p.choices.map((c) => `<button type="button" role="radio" data-choice="${esc(p.key)}" data-value="${esc(c)}" class="${val === c ? "active" : ""}" aria-checked="${val === c}">${esc(c)}</button>`).join("")}
        </div></div>`;
    }
    const ph = { set: "e.g.  2, -3   or   none", restriction: "e.g.  x ≥ 3", number: "e.g.  3.97" }[p.kind] || "e.g.  3√2   or   (6+2√5)/7";
    const keys = p.kind === "restriction" ? ["≥", "≤", ">", "<", "/"] : p.kind === "number" ? ["π", "/", "(", ")"] : ["√", "∛", "∜", "π", "(", ")", "/"];
    const titles = { "√": "Square root", "∛": "Cube root", "∜": "Fourth root", "π": "Pi", "(": "Open bracket", ")": "Close bracket", "/": "Divide", "≥": "Greater than or equal", "≤": "Less than or equal", ">": "Greater than", "<": "Less than" };
    return `<div class="wr-part">${head}
      <div class="input-row">
        <input class="answer-input" type="text" data-part="${esc(p.key)}" data-kind="${p.kind}" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(val)}" placeholder="${ph}" aria-label="Answer ${esc(p.label || "")}" />
        <div class="keypad" aria-label="Insert symbol">
          ${keys.map((k) => `<button type="button" data-ins="${k}" title="${titles[k]}">${k === "/" ? "÷" : k}</button>`).join("")}
        </div>
      </div>
      <div class="preview" data-preview="${esc(p.key)}"></div></div>`;
  }

  function updatePreview(inp) {
    const key = inp.dataset.part || "nr";
    const box = inp.closest(".wr-part, .nr-box").querySelector(`[data-preview="${CSS.escape(key)}"]`);
    const v = inp.value.trim();
    if (!v) { box.innerHTML = ""; box.className = "preview"; return; }
    const k = inp.dataset.kind;
    const r = k === "set" ? Check.readSet(v) : k === "restriction" ? Check.readRestriction(v) : Check.read(v);
    if (r.ok) { box.className = "preview ok"; box.innerHTML = `<span class="muted">Reads as</span> ${tex(r.tex)}`; }
    else { box.className = "preview err"; box.textContent = `⚠ ${r.error}`; }
  }

  function onInput(e) {
    const t = e.target;
    if (!session) return;
    const item = session.items[session.current];
    if (t.dataset.field === "nr") item.response = t.value;
    else if (t.dataset.field === "work") item.work = t.value;
    else if (t.dataset.part) item.responses[t.dataset.part] = t.value;
    else return;
    if (t.matches(".answer-input")) updatePreview(t);
    renderProgress();
    renderNav();
    clearTimeout(onInput._t);
    onInput._t = setTimeout(saveSession, 400);
  }

  function choose(orig) {
    session.items[session.current].chosen = orig;
    if (fire) fire.react("happy");
    saveSession();
    renderQuestion();
  }

  function go(i) {
    if (!session) return;
    i = Math.max(0, Math.min(session.items.length - 1, i));
    if (i === session.current) return;
    tick();
    session.current = i;
    renderQuestion();
    saveSession();
    const card = $("#question-card");
    card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    const r = card.getBoundingClientRect();
    if (r.top < 90 || r.top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + r.top - 96, behavior: "smooth" });
  }

  async function submitTest() {
    if (session.demo) return;
    const un = session.items.filter((i) => !isAnswered(i)).length;
    const fl = session.items.filter((i) => i.flagged).length;
    let body = "You can't change answers after submitting.";
    if (un) body = `<b>${un} question${un > 1 ? "s are" : " is"} not fully answered.</b> ` + body;
    if (fl) body += ` (${fl} still flagged.)`;
    if (await confirmDialog("Submit test?", body, "Submit", "Keep working")) finishTest(false);
  }

  // ───────────────────────── grading ─────────────────────────
  function gradeItem(item) {
    const q = qOf(item);
    if (!q) return { earned: 0, max: 0, parts: [] };
    if (item.kind === "mc") return { earned: item.chosen === 0 ? 1 : 0, max: 1, parts: [] };
    if (item.kind === "nr") { const g = Check.grade({ kind: "number", answer: q.answer, marks: 1 }, item.response); return { earned: g.earned, max: 1, parts: [g] }; }
    const parts = q.parts.map((p) => Check.grade(p, item.responses[p.key]));
    return { earned: parts.reduce((s, g) => s + g.earned, 0), max: parts.reduce((s, g) => s + g.max, 0), parts };
  }

  function buildAttempt(timedOut) {
    const items = session.items.map((it) => { const g = gradeItem(it); return { ...it, time: Math.round(it.time * 10) / 10, earned: g.earned, max: g.max }; });
    const earned = items.reduce((s, it) => s + it.earned, 0);
    const sections = {};
    for (const sec of SECTIONS) {
      const xs = items.filter((it) => it.kind === sec.key);
      sections[sec.key] = { earned: xs.reduce((s, it) => s + it.earned, 0), max: xs.reduce((s, it) => s + it.max, 0) };
    }
    const elapsed = Math.min(durOf(session), session.elapsed);
    const sumTime = items.reduce((s, it) => s + it.time, 0);
    let buddy = { mode: session.mode, fires: 0, freezes: 0, logs: 0, cozyPercent: 100 };
    if (session.turnedOff && session.buddyAtOff) buddy = { ...session.buddyAtOff, turnedOff: true };
    else if (fire) buddy = fire.snapshot();
    else if (session.buddy) {
      const s = session.buddy.stats;
      buddy = { mode: session.mode, fires: s.fires, freezes: s.freezes, logs: s.logs, cozyPercent: s.totalSeconds ? Math.round((s.cozySeconds / s.totalSeconds) * 100) : 100 };
    }
    return {
      id: session.id, date: Date.now(), total: TOTAL_MARKS, earned, percent: Math.round((earned / TOTAL_MARKS) * 1000) / 10,
      sections, totalTime: Math.round(elapsed), avgTime: Math.round((sumTime / items.length) * 10) / 10,
      timedOut, pauses: session.pauses || 0, buddy, items,
      level: session.level || "normal",
      duration: durOf(session), hardcore: !!session.hardcore, drain: !!session.drain, gameOvers: session.gameOvers || 0,
      group: session.group ? { code: session.group.code, name: session.group.name, scheduled: session.group.scheduled, friends: [] } : null,
    };
  }

  function finishTest(timedOut) {
    if (!session || session.demo) return;
    const now = Date.now();
    if (!session.paused) { const dt = Math.max(0, (now - lastTick) / 1000); session.items[session.current].time += dt; session.elapsed += dt; }
    if (fire) fire.stop();
    const attempt = buildAttempt(timedOut);
    const h = getHistory(); h.push(attempt); store.set(KEYS.history, h);
    store.del(KEYS.session);
    teardownTest();
    showResults(attempt, true);
  }

  async function leaveTest() {
    const ok = await confirmDialog("Leave the test?", "Your answers are saved, but the clock <b>keeps running</b> while you're away. To stop the clock, use <b>Pause</b> instead.", "Leave anyway", "Stay");
    if (!ok) return;
    saveSession();
    teardownTest();
    goHome();
  }

  // ───────────────────────── results ─────────────────────────
  function showResults(attempt, fresh) {
    viewing = attempt;
    reviewFilter = "all";
    show("results");

    const lvName = LEVELS[levelOf(attempt)].label;
    const h = getHistory().filter((a) => levelOf(a) === levelOf(attempt));
    const ranked = h.slice().sort(compareAttempts);
    const rank = ranked.findIndex((a) => a.id === attempt.id) + 1;
    const prevBest = ranked.filter((a) => a.id !== attempt.id)[0];
    const p = attempt.percent;

    $("#results-eyebrow").textContent = fresh ? (attempt.timedOut ? "Time's up!" : "Test complete") : "Past test";
    $("#results-title").textContent = p >= 90 ? "Outstanding." : p >= 75 ? "Strong work." : p >= 60 ? "Solid — keep pushing." : p >= 40 ? "Good practice. Review below." : "Every test teaches something.";
    $("#results-date").textContent = `${lvName} test · taken ${niceDate(attempt.date)}${attempt.pauses ? ` · paused ${attempt.pauses}×` : ""}${attempt.group ? ` · group ${attempt.group.code}` : ""}`;

    const banner = $("#best-banner");
    let html, kind = "info";
    if (!prevBest) {
      kind = "best";
      html = `<b>🏆 Your first ${esc(lvName)} test is on the board.</b> That makes it your best so far — next time, try to beat <b>${p}%</b> in <b>${clock(attempt.totalTime)}</b>.`;
    } else if (rank === 1) {
      kind = "best";
      const why = attempt.percent > prevBest.percent ? `${p}% beats your previous best of ${prevBest.percent}%.` : `Same ${p}% as your previous best, but ${dur(prevBest.totalTime - attempt.totalTime)} faster.`;
      html = `<b>🏆 ${fresh ? "New personal best!" : "Your personal best."}</b> Based on mark and time, this is the best of your ${h.length} ${esc(lvName)} tests. ${why}`;
    } else {
      const best = ranked[0];
      const gap = Math.round((best.percent - attempt.percent) * 10) / 10;
      html = `This test ranks <b>#${rank} of ${h.length}</b> ${esc(lvName)} tests by mark and time. Your best is <b>${best.percent}%</b> in ${clock(best.totalTime)} (${esc(niceDate(best.date, false))})` +
        (gap > 0 ? ` — you're ${gap} points away.` : ` — same mark, ${dur(attempt.totalTime - best.totalTime)} faster wins.`);
    }
    banner.className = `best-banner ${kind}`;
    banner.innerHTML = html;

    const times = attempt.items.map((it) => it.time);
    const maxT = Math.max(...times), minT = Math.min(...times);
    const lab = (i) => labelOf(i, attempt.items).text;
    const unanswered = attempt.items.filter((it) => answeredParts(it) === 0).length;
    $("#stat-grid").innerHTML = `
      <div class="stat stat-score">
        <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" class="ring-track" /><circle cx="60" cy="60" r="50" class="ring-fill" style="stroke-dasharray:${(p / 100) * 314.16} 314.16" /></svg>
        <div><span class="stat-value">${p}%</span><span class="stat-label">${fmtMarks(attempt.earned)} of ${attempt.total} marks</span></div>
      </div>
      <div class="stat"><span class="stat-value">${clock(attempt.totalTime)}</span><span class="stat-label">time used of ${clock(durOf(attempt))}${attempt.drain ? " · Armadillo" : ""}</span></div>
      <div class="stat"><span class="stat-value">${dur(attempt.avgTime)}</span><span class="stat-label">average per question</span></div>
      <div class="stat"><span class="stat-value">${dur(maxT)}</span><span class="stat-label">longest (${lab(times.indexOf(maxT))})</span></div>
      <div class="stat"><span class="stat-value">${dur(minT)}</span><span class="stat-label">quickest (${lab(times.indexOf(minT))})</span></div>
      <div class="stat"><span class="stat-value">${unanswered}</span><span class="stat-label">left blank</span></div>`;

    const secHTML = SECTIONS.map((sec) => {
      const s = attempt.sections[sec.key] || { earned: 0, max: sec.marks };
      const pct = s.max ? Math.round((s.earned / s.max) * 100) : 0;
      const tsec = attempt.items.filter((it) => it.kind === sec.key).reduce((a, it) => a + it.time, 0);
      return `<div class="topic-row"><div class="topic-row-head"><span><b>${sec.name}</b></span><span><b>${fmtMarks(s.earned)}/${s.max}</b> <span class="muted">· ${dur(tsec)}</span></span></div>
        <div class="bar"><div class="bar-fill ${pct >= 75 ? "good" : pct >= 50 ? "mid" : "low"}" style="width:${pct}%"></div></div></div>`;
    }).join("");
    const topics = new Map();
    for (const it of attempt.items) {
      const q = qOf(it); if (!q) continue;
      const t = topics.get(q.topic) || { e: 0, m: 0 };
      t.e += it.earned; t.m += it.max; topics.set(q.topic, t);
    }
    const topHTML = [...topics.entries()].sort((a, b) => a[1].e / a[1].m - b[1].e / b[1].m).map(([name, t]) => {
      const pct = Math.round((t.e / t.m) * 100);
      return `<div class="topic-row"><div class="topic-row-head"><span>${esc(name)}</span><span><b>${fmtMarks(t.e)}/${t.m}</b></span></div>
        <div class="bar"><div class="bar-fill ${pct >= 75 ? "good" : pct >= 50 ? "mid" : "low"}" style="width:${pct}%"></div></div></div>`;
    }).join("");
    $("#topic-breakdown").innerHTML = `${secHTML}<h3 class="sub-h">By topic <span class="muted small">(weakest first)</span></h3>${topHTML}`;

    const b = attempt.buddy || { mode: "off" };
    let verdict;
    if (b.turnedOff) verdict = "🧯 You turned the campfire off partway through to focus on the math. Smart call.";
    else if (b.mode === "off") verdict = "This test was taken in No campfire mode.";
    else if (attempt.gameOvers) verdict = `💀 Game over ${attempt.gameOvers === 1 ? "once" : attempt.gameOvers + " times"} — but you kept going with the test. Math first!`;
    else if (!b.fires && !b.freezes && b.cozyPercent >= 80) verdict = "🐶 Your puppy had a perfect night. Warm, cozy, and proud of you.";
    else if (!b.fires && !b.freezes) verdict = "🐶 No disasters — but your puppy got a little chilly or toasty at times.";
    else if (b.fires && b.freezes) verdict = "🐶 Fire <i>and</i> ice. Your puppy has been through a lot tonight.";
    else if (b.fires) verdict = `🔥 The camp burned down ${b.fires === 1 ? "once" : b.fires + " times"}. Easy on the logs!`;
    else verdict = `🧊 Your puppy froze ${b.freezes === 1 ? "once" : b.freezes + " times"}. Don't forget them while you calculate!`;
    $("#buddy-report").innerHTML = `<p class="buddy-verdict">${verdict}</p>${b.mode === "off" && !b.turnedOff ? "" : `
      <div class="mini-stats">
        <div><span class="stat-value">${b.cozyPercent}%</span><span class="stat-label">time cozy</span></div>
        <div><span class="stat-value">${b.logs}</span><span class="stat-label">logs added</span></div>
        <div><span class="stat-value">${b.fires}</span><span class="stat-label">fires</span></div>
        <div><span class="stat-value">${b.freezes}</span><span class="stat-label">freezes</span></div>
      </div>
      <p class="muted small">Mode: ${esc(window.Campfire.MODES[b.mode]?.label || b.mode)}. The buddy never affects your mark.</p>`}`;

    renderGroupBoard(attempt);
    for (const btn of $$("#review-filter button")) btn.classList.toggle("active", btn.dataset.filter === reviewFilter);
    renderReview();
  }

  function answerTeX(raw, kind) {
    if (!String(raw || "").trim()) return `<span class="muted">(blank)</span>`;
    const r = kind === "set" ? Check.readSet(raw) : kind === "restriction" ? Check.readRestriction(raw) : Check.read(raw);
    return r.ok ? tex(r.tex) : `<code>${esc(raw)}</code>`;
  }

  function renderReview() {
    const a = viewing;
    const maxT = Math.max(1, ...a.items.map((it) => it.time));
    let rows = a.items.map((it, i) => ({ it, i }));
    if (reviewFilter === "wrong") rows = rows.filter((r) => r.it.earned < r.it.max);
    if (reviewFilter === "flagged") rows = rows.filter((r) => r.it.flagged);
    if (reviewFilter === "slow") rows = rows.slice().sort((x, y) => y.it.time - x.it.time);
    if (!rows.length) {
      $("#review-list").innerHTML = `<p class="empty muted">${reviewFilter === "wrong" ? "Full marks — nothing to fix! 🎉" : "No flagged questions on this test."}</p>`;
      return;
    }
    let lastKind = null;
    $("#review-list").innerHTML = rows.map(({ it, i }) => {
      const q = qOf(it);
      const L = labelOf(i, a.items);
      let sectionHead = "";
      if (reviewFilter !== "slow" && it.kind !== lastKind) {
        const s = a.sections[it.kind];
        sectionHead = `<h3 class="review-section">${L.sec.name} <span class="muted">${s ? fmtMarks(s.earned) + "/" + s.max : ""}</span></h3>`;
        lastKind = it.kind;
      }
      if (!q) return sectionHead + `<div class="review-item"><p class="muted">${L.text} is no longer in the question bank.</p></div>`;
      const blank = answeredParts(it) === 0;
      const status = blank ? "skipped" : it.earned >= it.max ? "right" : it.earned > 0 ? "partial" : "wrong";
      const statusLabel = { right: "Full marks", partial: "Part marks", wrong: "No marks", skipped: "Blank" }[status];
      const head = `
        <header class="review-item-head">
          <span class="review-num">${L.text}</span>
          <span class="status-pill ${status}">${statusLabel} · ${fmtMarks(it.earned)}/${it.max}</span>
          ${it.flagged ? '<span class="pill">⚑ Flagged</span>' : ""}
          <span class="topic-tag">${esc(q.topic)}</span>
          <span class="review-time" title="Time spent on this question"><span class="time-bar"><span style="width:${(it.time / maxT) * 100}%"></span></span>${dur(it.time)}</span>
        </header>`;
      let bodyHTML = "";
      if (it.kind === "mc") {
        const choices = it.order.map((orig, di) => {
          const cls = orig === 0 ? "is-correct" : orig === it.chosen ? "is-chosen-wrong" : "";
          const tag = orig === 0 && orig === it.chosen ? "Your answer ✓" : orig === 0 ? "Correct answer" : orig === it.chosen ? "Your answer" : "";
          return `<li class="${cls}"><span class="choice-letter">${LETTERS[di]}</span><span class="choice-body">${renderMath(q.c[orig])}</span>${tag ? `<span class="choice-tag">${tag}</span>` : ""}</li>`;
        }).join("");
        bodyHTML = `<div class="q-text">${renderMath(q.q)}</div><ul class="review-choices">${choices}</ul>
          <details class="explain"${status !== "right" ? " open" : ""}><summary>How to solve it</summary><div>${renderMath(q.e)}</div></details>`;
      } else if (it.kind === "nr") {
        const ok = it.earned >= 1;
        bodyHTML = `<div class="q-text">${renderMath(q.q)}</div>
          <div class="answer-compare">
            <div class="${ok ? "is-correct" : blank ? "" : "is-chosen-wrong"}"><span class="cmp-label">Your answer</span>${answerTeX(it.response)}</div>
            ${ok ? "" : `<div class="is-correct"><span class="cmp-label">Correct answer</span>${tex(String(q.answer))}</div>`}
          </div>
          <details class="explain"${ok ? "" : " open"}><summary>How to solve it</summary><div>${renderMath(q.e)}</div></details>`;
      } else {
        const g = gradeItem(it);
        const parts = q.parts.map((p, k) => {
          const pg = g.parts[k];
          const raw = it.responses[p.key];
          const yours = p.kind === "choice" ? (raw ? esc(raw) : `<span class="muted">(blank)</span>`) : answerTeX(raw, p.kind);
          const correct = p.kind === "choice" ? esc(p.answer)
            : p.kind === "set" ? (p.answer.length ? tex(p.answer.map((x) => `x = ${Check.read(x).tex}`).join(",\\ ")) : tex("\\text{none}"))
            : p.kind === "restriction" ? tex(Check.readRestriction(`x${p.answer.op}${p.answer.value}`).tex)
            : p.kind === "number" ? tex(String(p.answer))
            : tex(p.ansTex || Check.read(p.answer).tex);
          const cls = pg.verdict === "right" ? "is-correct" : pg.verdict === "partial" ? "is-partial" : pg.verdict === "blank" ? "" : "is-chosen-wrong";
          return `<div class="part-review ${cls}">
            <div class="part-head">${p.label ? `<span class="part-label">${p.label}</span>` : ""}<span class="part-prompt">${renderMath(p.prompt)}</span><span class="marks-badge ${pg.verdict}">${fmtMarks(pg.earned)}/${pg.max}</span></div>
            <div class="part-answers"><span><span class="cmp-label">You</span>${yours}</span>${pg.verdict === "right" ? "" : `<span><span class="cmp-label">Key</span>${correct}</span>`}</div>
            ${pg.note && pg.verdict !== "right" && pg.verdict !== "blank" ? `<p class="part-note">${esc(pg.note)}</p>` : ""}
          </div>`;
        }).join("");
        bodyHTML = `<div class="q-text">${renderMath(q.intro)}</div>${parts}
          ${it.work ? `<div class="your-work"><span class="cmp-label">Your typed steps</span><pre>${esc(it.work)}</pre></div>` : ""}
          <details class="explain"${status !== "right" ? " open" : ""}><summary>Worked solution &amp; marking key</summary>
            <div>${q.solution.map((s) => `<p>${renderMath(s)}</p>`).join("")}
              <p class="rubric-title">Marking key</p><ul class="rubric">${q.rubric.map((r) => `<li>${renderMath(r)}</li>`).join("")}</ul></div>
          </details>`;
      }
      const sketch = it.sketch && it.sketch.length ? `<div class="sketch-review"><span class="cmp-label">Your scratch work</span><canvas data-sketch="${i}" aria-label="Your scratch work for ${L.text}"></canvas></div>` : "";
      bodyHTML = bodyHTML.replace(/<details class="explain"/, sketch + '<details class="explain"');
      return `${sectionHead}<article class="review-item ${status}">${head}${bodyHTML}</article>`;
    }).join("");
    if (window.Scratchpad) for (const cv of $$("canvas[data-sketch]")) window.Scratchpad.render(a.items[Number(cv.dataset.sketch)].sketch, cv);
  }

  // ───────────────────────── group tests ─────────────────────────
  let lobby = null;
  const inviteLink = (code) => `${location.origin}${location.pathname}#g-${window.Group.normalize(code)}`;

  async function copyText(text, inputEl, noteEl) {
    try {
      await navigator.clipboard.writeText(text);
      if (noteEl) noteEl.textContent = "Copied!";
    } catch {
      if (inputEl) { inputEl.focus(); inputEl.select(); }
      if (noteEl) noteEl.textContent = "Selected — press Ctrl+C (or ⌘C) to copy.";
    }
    if (noteEl) { clearTimeout(noteEl._t); noteEl._t = setTimeout(() => { noteEl.textContent = ""; }, 3000); }
  }

  function openLobby(g) {
    if (lobby && lobby.timer) clearInterval(lobby.timer);
    lobby = { g };
    show("lobby");
    const sc = $("#lobby-scene");
    sc.innerHTML = "";
    const scene = makeScene();
    scene.classList.add("is-cozy");
    scene.style.setProperty("--heat", "58");
    sc.appendChild(scene);
    $("#lobby-code").textContent = g.code;
    $("#lobby-link").value = inviteLink(g.code);
    $("#lobby-name").value = g.name || getPrefs().name || "";
    const bm = getPrefs().buddyMode;
    for (const b of $$("#lobby-buddy button")) { const on = b.dataset.mode === bm; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); }
    $("#copy-note").textContent = "";
    updateLobby();
    lobby.timer = setInterval(updateLobby, 250);
  }

  function updateLobby() {
    if (!lobby || document.body.dataset.screen !== "lobby") return;
    const g = lobby.g, now = Date.now();
    const lvl = LEVELS[g.level].label;
    const startBtn = $("#btn-lobby-start"), cd = $("#lobby-countdown");
    if (!g.start) {
      $("#lobby-title").textContent = "Ready when you are";
      $("#lobby-sub").innerHTML = `<b>${esc(lvl)}</b> group test. Everyone with this code gets the same questions in the same order. Each person's ${g.minutes || 60} minutes start when they press Start, and Pause still works.`;
      cd.hidden = true; startBtn.disabled = false; startBtn.textContent = "Start test";
      lobby.mode = "flex";
    } else if (now < g.start) {
      const left = (g.start - now) / 1000;
      $("#lobby-title").textContent = "Waiting for the group";
      $("#lobby-sub").innerHTML = `<b>${esc(lvl)}</b> group test, ${g.minutes || 60} minutes, with a shared clock: everyone starts together and finishes at the same moment. Share the code with your friends.`;
      cd.hidden = false;
      $("#cd-value").textContent = clock(left);
      $("#cd-at").textContent = `at ${new Date(g.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
      startBtn.disabled = true; startBtn.textContent = "Starts automatically";
      lobby.mode = "wait";
      if (left <= 0.3) startFromLobby();
    } else if (now < g.start + (g.minutes || 60) * 60000) {
      const left = (g.minutes || 60) * 60 - (now - g.start) / 1000;
      $("#lobby-title").textContent = "The group test is underway";
      $("#lobby-sub").innerHTML = `<b>${esc(lvl)}</b> group test. You'll join with <b>${clock(left)}</b> left, because the group shares one clock.`;
      cd.hidden = true; startBtn.disabled = false; startBtn.textContent = "Join now";
      lobby.mode = "late";
    } else {
      $("#lobby-title").textContent = "This group test has finished";
      $("#lobby-sub").innerHTML = `The group's hour is over, but you can still take the same <b>${esc(lvl)}</b> questions on your own clock and compare results with the group afterwards.`;
      cd.hidden = true; startBtn.disabled = false; startBtn.textContent = "Take it on my own clock";
      lobby.mode = "over";
    }
  }

  async function startFromLobby() {
    if (!lobby) return;
    const name = $("#lobby-name").value.trim().slice(0, 18);
    setPrefs({ name });
    const g = { ...lobby.g, name };
    if (lobby.mode === "over") g.start = 0;
    if (savedSession()) {
      if (lobby.mode === "wait") { store.del(KEYS.session); } // the countdown can't wait on a dialog
      else if (!(await confirmDialog("Start the group test?", "You have an unfinished test. Starting the group test will discard it.", "Start group test", "Cancel"))) return;
    }
    store.del(KEYS.session);
    clearInterval(lobby.timer);
    lobby = null;
    if (location.hash.startsWith("#g-")) history.replaceState(null, "", location.pathname + location.search);
    startTest({ group: g });
  }

  function leaveLobby() {
    if (lobby) clearInterval(lobby.timer);
    lobby = null;
    if (location.hash.startsWith("#g-")) history.replaceState(null, "", location.pathname + location.search);
    goHome();
  }

  // ───────── Create test (setup dialog) ─────────
  function openSetup(opts = {}) {
    const p = getPrefs();
    const d = $("#setup-dialog");
    const pick = (sel, attr, val) => { for (const b of $$(`${sel} button`)) { const on = b.dataset[attr] === String(val); b.classList.toggle("active", on); b.setAttribute("aria-checked", on); } };
    pick("#s-level", "level", LEVELS[p.level] ? p.level : "normal");
    pick("#s-buddy", "mode", p.buddyMode);
    pick("#s-start", "start", 0);
    $("#s-time").value = p.minutes || 60;
    $("#s-hardcore").checked = !!p.hardcore;
    $("#s-drain").checked = !!p.drain;
    $("#s-group").checked = !!opts.group;
    $("#s-name").value = p.name || "";
    syncSetup();
    d.returnValue = "cancel";
    d.showModal();
  }
  const activeVal = (sel, attr, dflt) => (($(`${sel} button.active`) || {}).dataset || {})[attr] ?? dflt;
  function syncSetup() {
    const level = activeVal("#s-level", "level", "normal");
    const mode = activeVal("#s-buddy", "mode", "normal");
    const group = $("#s-group").checked;
    const startMin = Number(activeVal("#s-start", "start", 0));
    const mins = Number($("#s-time").value);
    $("#s-time-out").textContent = `${mins} min`;
    $("#s-time").style.setProperty("--fill", `${((mins - 10) / 110) * 100}%`);
    $("#s-level-hint").textContent = LEVELS[level].hint;
    const fireOn = mode !== "off";
    $("#s-hardcore").disabled = !fireOn;
    $("#s-drain").disabled = !fireOn || (group && startMin > 0);
    $("#s-fire-switches").classList.toggle("disabled", !fireOn);
    $("#s-fire-note").textContent = !fireOn ? "Turn the campfire on to use these switches."
      : group && startMin > 0 ? "Armadillo mode is off for shared-clock group tests, so everyone's clock stays in sync." : "";
    $("#s-group-options").hidden = !group;
    $("#s-start-hint").textContent = startMin
      ? `Everyone starts together in ${startMin} minutes and finishes at the same moment. Pause is off so the clocks stay in sync.`
      : "Each person's clock starts when they press Start, and Pause still works.";
    $("#s-go").textContent = group ? "Create group test" : "Start test";
    $("#setup-title").textContent = group ? "Create a group test" : "Create test";
  }
  async function submitSetup() {
    const level = activeVal("#s-level", "level", "normal");
    const buddyMode = activeVal("#s-buddy", "mode", "normal");
    const minutes = Number($("#s-time").value) || 60;
    const group = $("#s-group").checked;
    const name = $("#s-name").value.trim().slice(0, 18);
    setPrefs({ level, buddyMode, minutes, hardcore: $("#s-hardcore").checked, drain: $("#s-drain").checked, ...(group ? { name } : {}) });
    if (group) {
      const startMin = Number(activeVal("#s-start", "start", 0));
      const seed = (crypto.getRandomValues(new Uint32Array(1))[0] & 0x7ffff) || 1;
      const start = startMin ? Math.ceil((Date.now() + startMin * 60000) / 60000) * 60000 : 0;
      const g = window.Group.decodeGroup(window.Group.encodeGroup({ level, seed, start, minutes }));
      return openLobby({ ...g, name });
    }
    if (savedSession() && !(await confirmDialog("Start over?", "You have an unfinished test. Starting a new one will discard it.", "Start new test", "Cancel"))) return;
    store.del(KEYS.session);
    startTest();
  }

  function joinGroup(code) {
    const g = window.Group.decodeGroup(code);
    if (!g) { $("#join-error").textContent = "That code isn't valid — check it for typos."; return; }
    $("#join-error").textContent = "";
    $("#join-code").value = "";
    openLobby(g);
  }

  function saveAttempt(a) {
    const h = getHistory();
    const k = h.findIndex((x) => x.id === a.id);
    if (k >= 0) { h[k] = a; store.set(KEYS.history, h); }
  }

  function renderGroupBoard(a) {
    const el = $("#group-board");
    if (!a.group) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    const G = window.Group;
    const myName = a.group.name || "You";
    const mine = { name: myName, earned: a.items.map((it) => it.earned), time: a.totalTime, me: true };
    const myCode = G.encodeResult({ group: a.group.code, name: myName, earned: mine.earned, time: mine.time });
    const friends = (a.group.friends || []).map((c) => ({ code: c, ...G.decodeResult(c) })).filter((f) => f.earned);
    const maxes = a.items.map((it) => it.max);
    const rows = [mine, ...friends].map((r) => ({ ...r, total: r.earned.reduce((x, y) => x + y, 0) }))
      .sort((x, y) => y.total - x.total || x.time - y.time);
    const labels = a.items.map((_, i) => labelOf(i, a.items).text);
    const missed = labels.filter((_, i) => rows.every((r) => (r.earned[i] || 0) < maxes[i]));
    const cell = (e, m) => e >= m ? `<td class="gc full" title="${e}/${m}">✓</td>` : e > 0 ? `<td class="gc part" title="${e}/${m}">${e}</td>` : `<td class="gc none" title="0/${m}">✗</td>`;

    el.innerHTML = `
      <div class="card-head"><h2>Group scoreboard</h2><span class="muted small">Group ${esc(a.group.code)}</span></div>
      <div class="gb-grid">
        <div class="gb-share">
          <p class="gb-step"><b>1.</b> Send your result code to the group chat:</p>
          <div class="join-row"><input class="text-input" id="my-result" readonly value="${esc(myCode)}" aria-label="Your result code" /><button class="btn btn-secondary" id="btn-copy-result" type="button">Copy</button></div>
          <p class="copy-note" id="result-note" role="status"></p>
          <p class="gb-step"><b>2.</b> Paste your friends' codes here (one per line):</p>
          <textarea class="text-input" id="friend-codes" rows="3" placeholder="CP-..."></textarea>
          <div class="gb-add"><button class="btn btn-primary" id="btn-add-friends" type="button">Add to scoreboard</button><span class="form-error" id="friend-error" role="alert"></span></div>
        </div>
        <div class="gb-board">
          <table class="score-table">
            <thead><tr><th>#</th><th>Name</th><th>Mark</th><th>Time</th><th class="sr-only">Remove</th></tr></thead>
            <tbody>${rows.map((r, k) => `
              <tr class="${r.me ? "me" : ""}"><td>${k + 1}</td><td>${esc(r.name)}${r.me ? ' <span class="muted small">(you)</span>' : ""}</td>
                <td><b>${Math.round((r.total / TOTAL_MARKS) * 1000) / 10}%</b> <span class="muted">${fmtMarks(r.total)}/${TOTAL_MARKS}</span></td>
                <td>${clock(r.time)}</td>
                <td>${r.me ? "" : `<button class="btn btn-link gb-remove" data-code="${esc(r.code)}" type="button" aria-label="Remove ${esc(r.name)}">Remove</button>`}</td></tr>`).join("")}
            </tbody>
          </table>
          ${friends.length ? "" : `<p class="muted small">Only you so far. Add your friends' codes to compare.</p>`}
        </div>
      </div>
      ${friends.length ? `
        <h3 class="sub-h">Question by question</h3>
        <div class="table-scroll"><table class="q-matrix">
          <thead><tr><th>Name</th>${labels.map((l) => `<th>${esc(l)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((r) => `<tr><th>${esc(r.name)}</th>${maxes.map((m, i) => cell(r.earned[i] || 0, m)).join("")}</tr>`).join("")}</tbody>
        </table></div>
        <p class="gb-discuss">${missed.length ? `🗣 <b>Talk these through together</b> — nobody got full marks: ${missed.map(esc).join(", ")}.` : "🎉 Between you, every question got full marks from someone. Teach each other!"}</p>` : ""}`;

    $("#btn-copy-result").onclick = () => copyText(myCode, $("#my-result"), $("#result-note"));
    $("#btn-add-friends").onclick = () => {
      const lines = $("#friend-codes").value.split(/\s+/).map((x) => x.trim()).filter(Boolean);
      const err = $("#friend-error");
      let added = 0, wrongGroup = 0, invalid = 0;
      for (const line of lines) {
        const r = G.decodeResult(line);
        if (!r) { invalid++; continue; }
        if (r.group !== G.normalize(a.group.code)) { wrongGroup++; continue; }
        if (line === myCode || (a.group.friends || []).includes(line)) continue;
        a.group.friends = [...(a.group.friends || []), line];
        added++;
      }
      saveAttempt(a);
      renderGroupBoard(a);
      const msgs = [];
      if (wrongGroup) msgs.push(`${wrongGroup} code${wrongGroup > 1 ? "s are" : " is"} from a different group test`);
      if (invalid) msgs.push(`${invalid} code${invalid > 1 ? "s" : ""} couldn't be read`);
      if (msgs.length) $("#friend-error").textContent = msgs.join("; ") + ".";
    };
    for (const b of $$(".gb-remove", el)) b.onclick = () => { a.group.friends = a.group.friends.filter((c) => c !== b.dataset.code); saveAttempt(a); renderGroupBoard(a); };
  }

  // ───────────────────────── guided tour (sample test, nothing saved) ─────────────────────────
  function startTour() {
    const now = Date.now();
    session = {
      id: "demo", demo: true, startedAt: now, elapsed: 0, lastActive: now, paused: false, pauses: 0,
      items: [
        { kind: "wr", qid: "wr2-1", responses: {}, work: "", time: 0, flagged: false },
        { kind: "nr", qid: "nr-1", response: "", time: 0, flagged: false },
        mcItem(BANKS.mc.get("sets-1")),
      ],
      current: 0, mode: getPrefs().buddyMode === "off" ? "normal" : getPrefs().buddyMode, buddy: null,
    };
    enterTest();
    const goTo = (k) => { if (session && session.current !== k) { session.current = k; renderQuestion(); } };
    const steps = [
      { title: "Welcome to Campfire Prep", html: `<p>This tour uses a <b>sample test</b>, so nothing here is saved or marked.</p><p>A real practice test is <b>34 marks in 60 minutes</b>, laid out like your unit test: Written Response (19), Numerical Response (5) and Multiple Choice (10).</p>` },
      { target: "#topbar-test", title: "Your progress stays on top", html: `<p>This bar sticks to the top while you scroll. It shows where you are, how much you've answered (one segment per section) and the time left.</p>` },
      { target: "#btn-pause", title: "Pause for dinner", html: `<p><b>Pause</b> (or <kbd>P</kbd>) freezes the clock and locks the test so nothing can be read or answered.</p><p>You can even close the tab. Come back later and resume from Basecamp with the same time left.</p>` },
      { target: "#question-card", title: "Answering questions", onEnter: () => goTo(2), html: `<p><b>Multiple choice:</b> click an answer or press <kbd>1</kbd>–<kbd>4</kbd>.</p><p><b>Numerical response:</b> type a single number.</p><p>Use <b>Flag</b> to mark anything you want to come back to.</p>` },
      {
        target: "#q-body .wr-part:nth-child(2)", title: "Typing math", interactive: true,
        onEnter: () => {
          goTo(0);
          const inp = $('#q-body input[data-part="b"]');
          if (inp && !inp.value) { inp.value = "(12+4√5)/4"; inp.dispatchEvent(new Event("input", { bubbles: true })); }
        },
        html: `<p>Written answers are typed: use the <b>√ ∛</b> buttons or type <code>sqrt</code>. <b>Reads as</b> shows how your answer was understood.</p><p>They're marked like your teacher would. This answer has the right value, but the fraction can still be reduced to \\(3 + \\sqrt{5}\\), so it would lose a mark.</p>`,
      },
      { target: ".navigator", title: "Jump around", html: `<p>Every question is here, grouped by section. Filled squares are answered, half-filled are partly answered, and a dot means flagged.</p><p>Press <b>Submit test</b> when you're done.</p>` },
      { target: ".buddy-panel", title: "Meet your puppy", html: `<p>Your puppy sits by the fire while you work. It wags when it's cozy, shivers and puffs breath when it's cold, pants when it's too hot, and hops when you add a log.</p>` },
      { target: ".heat-panel", title: "Keep the fire in the green", interactive: true, html: `<p>The fire cools over time. Press <b>Add log</b> (or <kbd>F</kbd>). Logs take a few seconds to catch, so don't spam it.</p><p>Above the top line the camp catches fire; below the bottom line your puppy freezes. <b>Try adding a log now.</b></p><p class="muted small">It never affects your mark. In <b>Create test</b> you can pick No campfire, let the puppy lose, or try Armadillo mode (the clock drains faster when the fire is neglected). <b>Turn off campfire</b> under this button stops the minigame mid-test.</p>` },
      {
        target: "#scratchpad", title: "Your scratchpad", interactive: true,
        onEnter: () => { if (pad) pad.open(); },
        html: `<p><b>Hold the left mouse button to write.</b> Try it now!</p><p>Drag the dark title bar to move it, pull the bottom-right corner to resize, use ⤢ to make it big, and – (or <kbd>N</kbd>) to tuck it away.</p><p>Each question gets its own page, and your scratch work shows up in the review.</p>`,
      },
      { title: "You're ready", html: `<p><b>Basecamp</b> is home between tests. Press <b>Create test</b> to pick the level (Classmate's, Normal or Challenge), the time limit and campfire options, or make a <b>group test</b> to share with friends.</p><p>Basecamp also shows past results and which topics to practise next.</p><p class="muted small">You can replay this tour any time from <b>How to play</b>.</p>` },
    ];
    for (const st of steps) st.html = renderMath(st.html);
    window.Tour.start(steps, {
      finishLabel: "Go to Basecamp",
      onEnd: () => {
        store.set(KEYS.toured, true);
        if (pad) pad.setPage([], "");
        teardownTest();
        goHome();
      },
    });
  }

  // ───────────────────────── dialog ─────────────────────────
  function confirmDialog(title, bodyHtml, okLabel, cancelLabel) {
    const d = $("#dialog");
    $("#dialog-title").textContent = title;
    $("#dialog-body").innerHTML = bodyHtml;
    $("#dialog-ok").textContent = okLabel;
    $("#dialog-cancel").textContent = cancelLabel;
    return new Promise((resolve) => {
      const done = () => { d.removeEventListener("close", done); resolve(d.returnValue === "ok"); };
      d.addEventListener("close", done);
      d.returnValue = "cancel";
      d.showModal();
      $("#dialog-cancel").focus();
    });
  }

  // ───────────────────────── wiring ─────────────────────────
  function insertAtCursor(input, text) {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, s) + text + input.value.slice(e);
    input.focus();
    input.setSelectionRange(s + text.length, s + text.length);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function init() {
    if (!MCB || !NRB || !WRB || !Check) { document.body.innerHTML = "<p style='padding:2rem'>The question bank failed to load.</p>"; return; }

    $("#btn-enter").addEventListener("click", () => (store.get(KEYS.toured, false) ? goHome() : startTour()));
    for (const b of $$("#level-pick button")) b.addEventListener("click", () => { setPrefs({ level: b.dataset.level }); renderHome(); });
    $("#btn-group-create").addEventListener("click", () => openSetup({ group: true }));
    $("#join-form").addEventListener("submit", (e) => { e.preventDefault(); joinGroup($("#join-code").value); });
    $("#btn-lobby-start").addEventListener("click", startFromLobby);
    $("#btn-lobby-leave").addEventListener("click", leaveLobby);
    $("#btn-copy-code").addEventListener("click", () => copyText($("#lobby-code").textContent, null, $("#copy-note")));
    $("#btn-copy-link").addEventListener("click", () => copyText($("#lobby-link").value, $("#lobby-link"), $("#copy-note")));
    for (const grp of ["#s-level", "#s-buddy", "#s-start"]) {
      $(grp).addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        for (const x of $$(`${grp} button`)) { x.classList.toggle("active", x === b); x.setAttribute("aria-checked", x === b); }
        syncSetup();
      });
    }
    for (const id of ["#s-time", "#s-group", "#s-hardcore", "#s-drain"]) $(id).addEventListener("input", syncSetup);
    $("#setup-dialog").addEventListener("close", () => { if ($("#setup-dialog").returnValue === "ok") submitSetup(); });
    $("#btn-create").addEventListener("click", () => openSetup());
    $("#lobby-buddy").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      setPrefs({ buddyMode: b.dataset.mode });
      for (const x of $$("#lobby-buddy button")) { x.classList.toggle("active", x === b); x.setAttribute("aria-checked", x === b); }
    });
    $("#go-revive").addEventListener("click", reviveFire);
    $("#go-off").addEventListener("click", () => { turnOffCampfire(); closeGameOver(); });
    $("#go-end").addEventListener("click", () => { $("#gameover").hidden = true; $("#screen-test").inert = false; $("#topbar-test").inert = false; session.gameOver = null; finishTest(false); });
    $("#btn-fire-off").addEventListener("click", async () => {
      if (await confirmDialog("Turn off the campfire?", "The puppy and fire go away for the rest of this test so you can focus on the math. Armadillo mode stops too. This can't be undone for this test.", "Turn it off", "Keep it")) turnOffCampfire();
    });
    $("#btn-tour").addEventListener("click", startTour);
    $("#btn-tour-2").addEventListener("click", startTour);
    $("#brand-link").addEventListener("click", (e) => {
      e.preventDefault();
      if (session && !session.demo) return leaveTest();
      if (window.Tour.active) return;
      if (lobby) return leaveLobby();
      goHome();
    });

    $("#btn-start").addEventListener("click", async () => {
      if (savedSession()) {
        if (!(await confirmDialog("Start over?", "You have an unfinished test. Starting a new one will discard it.", "Start new test", "Cancel"))) return;
      }
      store.del(KEYS.session);
      startTest();
    });


    const body = $("#q-body");
    body.addEventListener("click", (e) => {
      const c = e.target.closest(".choice");
      if (c) return choose(Number(c.dataset.orig));
      const seg = e.target.closest("[data-choice]");
      if (seg) {
        session.items[session.current].responses[seg.dataset.choice] = seg.dataset.value;
        if (fire) fire.react("happy");
        saveSession();
        for (const b of $$(`[data-choice="${CSS.escape(seg.dataset.choice)}"]`, body)) { const on = b === seg; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); }
        renderProgress(); renderNav();
        return;
      }
      const ins = e.target.closest("[data-ins]");
      if (ins) insertAtCursor(ins.closest(".wr-part").querySelector("input"), ins.dataset.ins);
    });
    body.addEventListener("input", onInput);
    body.addEventListener("mousedown", (e) => { if (e.target.closest("[data-ins]")) e.preventDefault(); });

    $("#nav-grid").addEventListener("click", (e) => { const b = e.target.closest(".nav-cell"); if (b) go(Number(b.dataset.i)); });
    $("#btn-prev").addEventListener("click", () => go(session.current - 1));
    $("#btn-next").addEventListener("click", () => go(session.current + 1));
    $("#btn-flag").addEventListener("click", () => { const it = session.items[session.current]; it.flagged = !it.flagged; saveSession(); renderQuestion(); });
    $("#btn-submit").addEventListener("click", submitTest);
    $("#btn-quit").addEventListener("click", leaveTest);
    $("#btn-pause").addEventListener("click", pauseTest);
    $("#btn-unpause").addEventListener("click", unpauseTest);
    $("#btn-pause-home").addEventListener("click", pauseToHome);
    $("#btn-again").addEventListener("click", async () => {
      if (savedSession() && !(await confirmDialog("Start over?", "You have an unfinished test. Starting a new one will discard it.", "Start new test", "Cancel"))) return;
      store.del(KEYS.session);
      startTest();
    });
    $("#btn-home").addEventListener("click", goHome);
    $("#review-filter").addEventListener("click", (e) => {
      const btn = e.target.closest("button"); if (!btn) return;
      reviewFilter = btn.dataset.filter;
      for (const b of $$("#review-filter button")) b.classList.toggle("active", b === btn);
      renderReview();
    });

    document.addEventListener("keydown", (e) => {
      if (!session || document.body.dataset.screen !== "test" || $("#dialog").open || session.paused || session.gameOver) return;
      const typing = e.target.matches("input, textarea");
      if ((e.metaKey || e.ctrlKey) && !typing && e.key.toLowerCase() === "z" && pad) { e.preventDefault(); return pad.undo(); }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing) {
        if (e.key === "Enter" && e.target.matches("input")) { e.preventDefault(); const ins = $$("#q-body input.answer-input"); const k = ins.indexOf(e.target); if (k >= 0 && k < ins.length - 1) ins[k + 1].focus(); }
        return;
      }
      const k = e.key.toLowerCase();
      const item = session.items[session.current];
      if (item.kind === "mc") {
        const idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
        if (idx >= 0 && idx < item.order.length) { e.preventDefault(); return choose(item.order[idx]); }
      }
      if (e.key === "ArrowRight") { e.preventDefault(); go(session.current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(session.current - 1); }
      else if (k === "f" && fire) { e.preventDefault(); fire.addFuel(); }
      else if (k === "n" && pad) { e.preventDefault(); pad.toggleMin(); }
      else if (k === "p") { e.preventDefault(); pauseTest(); }
    });

    window.addEventListener("pagehide", saveSession);
    document.addEventListener("visibilitychange", () => { if (document.hidden) saveSession(); });
    // Invite links look like  …/#g-XXXXXXXXXXXX
    const fromHash = () => {
      const m = location.hash.match(/^#g-([0-9A-Za-z]{12})$/);
      const g = m && window.Group.decodeGroup(m[1]);
      if (g && !session) { openLobby(g); return true; }
      return false;
    };
    window.addEventListener("hashchange", fromHash);
    if (!fromHash()) renderTitle();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
