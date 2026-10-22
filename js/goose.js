/*
 * GOOSE MODE — an alternative gameplay ruleset: no puppy survival, a mischievous goose instead.
 *
 * One manager owns everything Goose Mode does to the page:
 *   • a single 250 ms scheduler timer (no per-effect timers): it counts down to the next event, ages active events,
 *     and pauses whenever Goose Mode doesn't apply (other screens, hidden tab, open dialog, paused test, tours);
 *   • an event REGISTRY: each event declares id, duration, cooldown, severity, the "channels" it uses (one owner per
 *     channel at a time, so two effects never fight over the same CSS property), events it must not combine with,
 *     whether it involves motion or dimming, eligibility, and a start() that returns its cleanup;
 *   • panel offsets for goose thefts and the Goose-only drag-and-drop, held in memory for this Goose session only —
 *     the normal saved layout is never touched, and turning Goose Mode off (or reloading) restores it.
 *
 * Effects use separate CSS properties so they compose safely: stage colour → `filter`, stage flip → `rotate`,
 * stage shake → `translate` (all on the active screen section); panel dance → `transform`; panel position →
 * `translate` (on the panel). Every effect is removed by its cleanup, which also runs when the event is
 * interrupted (disable, navigation, hidden tab). A generation token makes stale async steps do nothing.
 *
 * The goose never touches the math engine, answers, records or question state; it only changes presentation and,
 * during a freeze, blocks input for a few seconds (the test clock is held meanwhile, see app.js tick()).
 */
(function () {
  "use strict";

  // ───────── timing (all configurable) ─────────
  const CFG = {
    tickMs: 250,
    firstDelay: [8, 14],       // seconds before the first event after Goose Mode starts applying
    interval: [20, 40],        // seconds between events (≈ 30 s on average, never exact)
    comboChance: 0.3,          // chance that a compatible second event joins
    thawGuardMs: 450,          // clicks/Enter swallowed right after a freeze, so nothing is submitted twice
  };

  // ───────── registry ─────────
  // channels: color · stage · panels · input · overlay · goose
  const EVENTS = [
    { id: "grayscale", channels: ["color"], dur: [7, 11], cooldown: 45, severity: 1, motion: false,
      start: (c) => c.stageClass("gz-gray") },
    { id: "rainbow", channels: ["color"], dur: [6, 10], cooldown: 45, severity: 1, motion: false,
      start: (c) => c.stageClass("gz-rainbow") },
    { id: "flip", channels: ["stage"], excludes: ["theft", "freeze", "dance"], dur: [4, 6], cooldown: 75, severity: 3, motion: true,
      start: (c) => { c.stage.style.transformOrigin = c.visibleOrigin(); const off = c.stageClass("gz-flip"); return () => { off(); c.later(() => { if (!c.stage.classList.contains("gz-flip")) c.stage.style.transformOrigin = ""; }, 700); }; } },
    { id: "shake", channels: ["stage"], dur: [1.4, 2.2], cooldown: 40, severity: 2, motion: true,
      start: (c) => c.stageClass("gz-shake") },
    { id: "dance", channels: ["panels"], excludes: ["flip"], dur: [4, 7], cooldown: 50, severity: 2, motion: true,
      eligible: (c) => c.panels().length > 0,
      start: (c) => { const ps = c.panels().slice(0, 6); ps.forEach((p, i) => { p.style.setProperty("--gz-delay", `${(i % 3) * 0.12}s`); p.classList.add("gz-dance", i % 2 ? "gz-dance-b" : "gz-dance-a"); }); return () => ps.forEach((p) => { p.classList.remove("gz-dance", "gz-dance-a", "gz-dance-b"); p.style.removeProperty("--gz-delay"); }); } },
    { id: "freeze", channels: ["input"], excludes: ["flip"], dur: [2, 4], cooldown: 60, severity: 3, motion: false,
      start: (c, ev) => c.freeze(ev) },
    { id: "dim", channels: ["overlay"], dur: [0.9, 1.2], cooldown: 40, severity: 1, motion: false, dims: true,
      start: (c) => c.dim() },
    { id: "theft", channels: ["panels", "goose"], excludes: ["flip"], dur: [6.5, 6.5], cooldown: 35, severity: 2, motion: false,
      eligible: (c) => c.panels().length > 0,
      start: (c) => c.theft() },
  ];
  const BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

  // Movable panels (never: settings, navigation, the question card, answer inputs, dialogs, Goose controls)
  const PANELS = [
    ["topic", "#topic-card"], ["activity", "#dash .dash-row > section:nth-child(1)"], ["goals", "#dash .dash-row > section:nth-child(2)"],
    ["quick", "#dash .quick"], ["stats", "#stats-panel"], ["concepts", "#studio-concepts"],
    ["sp-diag", "#splus .sp-diag"], ["sp-launch", "#splus .sp-launch"], ["sp-queue", "#splus .sp-queue-p"], ["sp-curric", "#splus .sp-curric"], ["sp-hist", "#splus .sp-hist-p"],
    ["navigator", "#screen-test .navigator"], ["test-info", "#screen-test .test-info"],
    ["tests-row", "#drills .tests-row"], ["course-top", "#course-body .course-top"],
    ["ph-path", "#screen-phys section.ph-pathp"], ["ph-launch", "#screen-phys section.ph-launch"], ["ph-diag", "#screen-phys section.ph-diag"], ["ph-review", "#screen-phys section.ph-review"],
    ["ph-recent", "#screen-phys section.ph-recent"], ["ph-tools", "#screen-phys section.ph-tools"], ["ph-formulas", "#screen-phys section.ph-formulas"],
  ];

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const $ = (s, r = document) => r.querySelector(s);

  let host = null;            // provided by app.js: { t, applicable(), stageEl(), essentials(), calm() }
  let enabled = false, timer = null, lastNow = 0, nextIn = 0, gen = 0;
  const active = new Map();   // id → { ev, left, cleanup }
  const lastAt = {};          // id → performance.now() seconds of last start
  let lastId = null, frozen = false, hud = null, gooseEl = null, msgT = null, zTop = 10;
  const offsets = new Map();  // panel key → { x, y } (this Goose session only)
  const pending = new Set();  // deferred cleanups (setTimeout ids) owned by the manager
  let log = [];               // recent event starts, for tests and debugging

  const now = () => performance.now() / 1000;
  const t = (k) => (host && host.t ? host.t(k) : k);
  const calm = () => !!(host && host.calm && host.calm());
  const later = (fn, ms) => { const g = gen; const id = setTimeout(() => { pending.delete(id); if (g === gen && enabled) fn(); }, ms); pending.add(id); return id; };

  // ───────── panels ─────────
  function panelEls() {
    const out = [];
    for (const [key, sel] of PANELS) for (const el of document.querySelectorAll(sel)) { if (!el.dataset.gzKey) el.dataset.gzKey = key; out.push(el); }
    return out;
  }
  function visiblePanel(el) {
    if (!el.isConnected || el.closest("[hidden], dialog, [aria-modal='true']")) return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed") return false;
    const r = el.getBoundingClientRect();
    if (r.width < 60 || r.height < 40) return false;
    const vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    return vis >= Math.min(120, r.height * 0.5) && r.width * r.height < innerWidth * innerHeight * 0.7;
  }
  // panels the goose may take right now
  function stealable() {
    const ae = document.activeElement;
    return panelEls().filter((el) => visiblePanel(el) && !el.classList.contains("gz-busy") && !el.classList.contains("gz-dance") && !(ae && el.contains(ae) && ae.matches("input, textarea, select")));
  }
  function applyOffset(el) {
    const o = offsets.get(el.dataset.gzKey);
    const want = o ? `${Math.round(o.x)}px ${Math.round(o.y)}px` : "";
    if (el.style.translate !== want) el.style.translate = want;
    el.classList.toggle("gz-moved", !!o);
    if (o && o.z) el.style.zIndex = String(o.z); else if (!o) el.style.zIndex = "";
  }
  function syncPanels() {
    for (const el of panelEls()) {
      applyOffset(el);
      el.classList.add("gz-drag");
      if (!el.querySelector(":scope > .gz-handle")) {
        const h = document.createElement("button");
        h.type = "button"; h.className = "gz-handle"; h.setAttribute("aria-label", t("goose.move")); h.title = t("goose.move");
        h.innerHTML = '<span aria-hidden="true">⠿</span>';
        el.appendChild(h);
      }
    }
  }
  function clearPanels() {
    for (const el of document.querySelectorAll("[data-gz-key]")) {
      el.style.translate = ""; el.style.zIndex = ""; el.style.removeProperty("--gz-delay");
      el.classList.remove("gz-moved", "gz-drag", "gz-busy", "gz-carried", "gz-dance", "gz-dance-a", "gz-dance-b");
      const h = el.querySelector(":scope > .gz-handle"); if (h) h.remove();
    }
  }
  const topSafe = () => { const isl = $("#island-wrap"); const r = isl ? isl.getBoundingClientRect() : { bottom: 0 }; return Math.max(0, r.bottom) + 6; };
  // keep a panel fully inside the window horizontally and below the island, never lost off-screen
  function clampOffset(el, x, y) {
    const r = el.getBoundingClientRect(), o = offsets.get(el.dataset.gzKey) || { x: 0, y: 0 };
    const baseL = r.left - o.x, baseT = r.top - o.y;
    const minX = 6 - baseL, maxX = innerWidth - 6 - r.width - baseL;
    const minY = topSafe() - baseT, maxY = innerHeight - Math.min(r.height, 120) - baseT;
    return { x: minX > maxX ? (minX + maxX) / 2 : clamp(x, minX, maxX), y: minY > maxY ? minY : clamp(y, minY, maxY) };
  }

  // ───────── drag (Goose Mode only: handles exist only while enabled) ─────────
  let drag = null;
  function onPointerDown(e) {
    const h = e.target.closest && e.target.closest(".gz-handle");
    if (!h || !enabled || frozen) return;
    const el = h.parentElement; if (!el || !el.dataset.gzKey || el.classList.contains("gz-busy")) return;
    e.preventDefault();
    const o = offsets.get(el.dataset.gzKey) || { x: 0, y: 0 };
    drag = { el, h, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y };
    try { h.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    el.classList.add("gz-dragging");
    offsets.set(el.dataset.gzKey, { x: o.x, y: o.y, z: ++zTop + 20 });
    applyOffset(el);
  }
  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const want = { x: drag.ox + e.clientX - drag.sx, y: drag.oy + e.clientY - drag.sy };
    const c = clampOffset(drag.el, want.x, want.y);
    const o = offsets.get(drag.el.dataset.gzKey);
    offsets.set(drag.el.dataset.gzKey, { ...o, x: c.x, y: c.y });
    applyOffset(drag.el);
  }
  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.el.classList.remove("gz-dragging");
    drag = null;
  }
  function onHandleKey(e) {
    const h = e.target.closest && e.target.closest(".gz-handle"); if (!h || !enabled) return;
    const d = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key];
    const el = h.parentElement;
    if (e.key === "Home") { e.preventDefault(); offsets.delete(el.dataset.gzKey); applyOffset(el); return; }
    if (!d) return;
    e.preventDefault();
    const o = offsets.get(el.dataset.gzKey) || { x: 0, y: 0 };
    const c = clampOffset(el, o.x + d[0], o.y + d[1]);
    offsets.set(el.dataset.gzKey, { x: c.x, y: c.y, z: ++zTop + 20 });
    applyOffset(el);
  }

  // ───────── HUD: always reachable, never stolen, above every effect ─────────
  function buildHud() {
    if (hud) return;
    hud = document.createElement("div");
    hud.id = "gz-hud"; hud.className = "gz-hud";
    hud.innerHTML = `<span class="gz-hud-name"><svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><use href="#goose-head"/></svg><b></b></span>
      <span class="gz-msg" role="status" aria-live="polite"></span>
      <button type="button" class="btn btn-sm btn-quiet" data-gz="reset"></button>
      <button type="button" class="btn btn-sm btn-secondary" data-gz="off"></button>`;
    hud.addEventListener("click", (e) => {
      const b = e.target.closest("[data-gz]"); if (!b) return;
      if (b.dataset.gz === "reset") resetLayout();
      if (b.dataset.gz === "off" && host && host.turnOff) host.turnOff();
    });
    document.body.appendChild(hud);
    paintHud();
  }
  function paintHud() {
    if (!hud) return;
    hud.querySelector(".gz-hud-name b").textContent = t("goose.hud");
    hud.querySelector('[data-gz="reset"]').textContent = t("goose.reset");
    hud.querySelector('[data-gz="off"]').textContent = t("goose.turnOff");
    for (const h of document.querySelectorAll(".gz-handle")) { h.setAttribute("aria-label", t("goose.move")); h.title = t("goose.move"); }
    hud.hidden = !applicable();
  }
  function say(key) {
    if (!hud) return;
    const m = hud.querySelector(".gz-msg");
    m.textContent = t(key); m.dataset.key = key;
    clearTimeout(msgT); msgT = setTimeout(() => { m.textContent = ""; m.dataset.key = ""; }, 5000);
  }

  // ───────── effect helpers handed to events ─────────
  function ctx() {
    const stage = host.stageEl();
    return {
      stage, later,
      panels: stealable,
      stageClass: (cls) => { stage.classList.add(cls); return () => stage.classList.remove(cls); },
      visibleOrigin: () => { const r = stage.getBoundingClientRect(); return `50% ${Math.round(innerHeight / 2 - r.top)}px`; },
      freeze: (ev) => freezeOn(stage, ev),
      dim: () => dimOn(),
      theft: () => theftOn(),
    };
  }
  function freezeOn(stage, ev) {
    frozen = true;
    stage.inert = true;
    stage.classList.add("gz-frozen");
    const ov = document.createElement("div");
    ov.className = "gz-freeze"; ov.setAttribute("role", "status");
    ov.innerHTML = `<div class="gz-ice"><svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true"><use href="#goose-head"/></svg><b>❄ ${esc(t("goose.frozen"))}</b><span class="gz-count"></span></div>`;
    ov.style.top = `${topSafe()}px`;
    document.body.appendChild(ov);
    const count = () => { const a = active.get("freeze"); const left = a ? Math.max(1, Math.ceil(a.left)) : 0; const el = ov.querySelector(".gz-count"); if (el) el.textContent = left ? String(left) : ""; };
    count();
    ev.onTick = count;
    return () => {
      ov.remove();
      stage.inert = false;
      stage.classList.remove("gz-frozen");
      frozen = false;
      // swallow the click / Enter that was "queued up" during the freeze
      const guard = (e) => { if (e.type === "click" || e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); } };
      stage.addEventListener("click", guard, true); stage.addEventListener("keydown", guard, true);
      setTimeout(() => { stage.removeEventListener("click", guard, true); stage.removeEventListener("keydown", guard, true); }, CFG.thawGuardMs);
    };
  }
  function dimOn() {
    const ov = document.createElement("div");
    ov.className = "gz-dim";
    ov.style.top = `${topSafe()}px`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("on"));
    return () => { ov.classList.remove("on"); setTimeout(() => ov.remove(), 400); };
  }
  // The goose walks in, grabs a panel by the top edge, carries it, drops it somewhere safe, and leaves.
  function theftOn() {
    const pool = stealable();
    if (!pool.length) return () => {};
    const el = pool[Math.floor(Math.random() * pool.length)];
    const key = el.dataset.gzKey, before = offsets.get(key) || { x: 0, y: 0 };
    const myGen = gen, anims = [];
    let cancelled = false;
    el.classList.add("gz-busy");
    const g = document.createElement("div");
    g.className = "gz-goose"; g.setAttribute("aria-hidden", "true");
    g.innerHTML = '<svg viewBox="0 0 64 64" width="84" height="84"><use href="#goose"/></svg><span class="gz-honk">HONK</span>';
    document.body.appendChild(g); gooseEl = g;
    const SIZE = 84, BEAK = { x: 61 / 64 * SIZE, y: 17 / 64 * SIZE };
    const r = el.getBoundingClientRect();
    const grab = { x: r.left + Math.min(r.width / 2, 160), y: Math.max(r.top, topSafe() + 4) + 6 };
    const fromLeft = grab.x > innerWidth / 2 ? false : true;
    const startX = fromLeft ? -SIZE - 10 : innerWidth + 10;
    const at = (x, y, face) => `translate(${Math.round(x - (face > 0 ? BEAK.x : SIZE - BEAK.x))}px, ${Math.round(y - BEAK.y)}px) scaleX(${face})`;
    const faceIn = fromLeft ? 1 : -1;
    // destination: sample places, prefer ones that cover nothing essential, keep inside the window
    const ess = host.essentials ? host.essentials() : [];
    let best = null;
    for (let i = 0; i < 18; i++) {
      const want = { x: before.x + rand(-0.6, 0.6) * innerWidth * 0.6, y: before.y + rand(-0.5, 0.5) * innerHeight * 0.6 };
      const c = clampOffset(el, want.x, want.y);
      const dx = c.x - before.x, dy = c.y - before.y;
      const nr = { left: r.left + dx, top: r.top + dy, right: r.right + dx, bottom: r.bottom + dy };
      const cover = ess.reduce((a, e) => a + Math.max(0, Math.min(nr.right, e.right) - Math.max(nr.left, e.left)) * Math.max(0, Math.min(nr.bottom, e.bottom) - Math.max(nr.top, e.top)), 0);
      const score = cover - Math.min(Math.hypot(dx, dy), 400) * 2;
      if (!best || score < best.score) best = { c, dx, dy, score };
    }
    const dest = best.c, dx = best.dx, dy = best.dy;
    const faceCarry = dx >= 0 ? 1 : -1;
    const run = async () => {
      const reduced = calm() || matchMedia("(prefers-reduced-motion: reduce)").matches;
      const A = (target, frames, opts) => { const a = target.animate(frames, { fill: "forwards", ...opts }); anims.push(a); return a.finished; };
      if (reduced) {
        g.style.transform = at(grab.x, grab.y, faceIn);
        await A(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
        if (cancelled || myGen !== gen) return;
        await A(el, [{ opacity: 1 }, { opacity: 0.15 }], { duration: 250 });
        offsets.set(key, { x: dest.x, y: dest.y, z: ++zTop + 20 }); applyOffset(el);
        await A(el, [{ opacity: 0.15 }, { opacity: 1 }], { duration: 250 });
        if (cancelled || myGen !== gen) return;
        await A(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
        return;
      }
      // 1. walk in   2. grab (bob)   3. carry   4. drop + victory hop   5. leave
      await A(g, [{ transform: at(startX + (fromLeft ? BEAK.x : SIZE - BEAK.x), grab.y, faceIn) }, { transform: at(grab.x, grab.y, faceIn) }], { duration: 1300, easing: "cubic-bezier(.3,.7,.4,1)" });
      if (cancelled || myGen !== gen) return;
      g.classList.add("grab");
      await A(g, [{ transform: at(grab.x, grab.y, faceIn) }, { transform: at(grab.x, grab.y + 8, faceIn) }, { transform: at(grab.x, grab.y, faceCarry) }], { duration: 380 });
      if (cancelled || myGen !== gen) return;
      el.classList.add("gz-carried");
      el.style.zIndex = String(++zTop + 20);
      const ease = { duration: 1600, easing: "cubic-bezier(.45,.05,.35,1)" };
      await Promise.all([
        A(g, [{ transform: at(grab.x, grab.y, faceCarry) }, { transform: at(grab.x + dx / 2, grab.y + dy / 2 - 18, faceCarry) }, { transform: at(grab.x + dx, grab.y + dy, faceCarry) }], ease),
        A(el, [{ translate: `${before.x}px ${before.y}px` }, { translate: `${before.x + dx / 2}px ${before.y + dy / 2 - 18}px` }, { translate: `${dest.x}px ${dest.y}px` }], ease),
      ]);
      if (cancelled || myGen !== gen) return;
      offsets.set(key, { x: dest.x, y: dest.y, z: zTop + 20 }); applyOffset(el);
      el.classList.remove("gz-carried");
      g.classList.remove("grab"); g.classList.add("honk");
      const gx = grab.x + dx, gy = grab.y + dy;
      await A(g, [{ transform: at(gx, gy, faceCarry) }, { transform: at(gx, gy - 14, faceCarry) }, { transform: at(gx, gy, faceCarry) }], { duration: 420 });
      if (cancelled || myGen !== gen) return;
      const exitRight = gx > innerWidth / 2;
      await A(g, [{ transform: at(gx, gy, exitRight ? 1 : -1) }, { transform: at(exitRight ? innerWidth + SIZE + 20 : -SIZE - 20, gy - 30, exitRight ? 1 : -1) }], { duration: 1000, easing: "ease-in" });
    };
    run().catch(() => { /* cancelled animations reject; cleanup handles the rest */ });
    return () => {
      cancelled = true;
      for (const a of anims) { try { a.cancel(); } catch { /* already gone */ } }
      // if the drop hadn't happened yet, the panel goes back where it was; otherwise it stays where the goose left it
      if (!(offsets.get(key) && offsets.get(key).x === dest.x && offsets.get(key).y === dest.y)) { if (before.x || before.y) offsets.set(key, before); else offsets.delete(key); }
      el.classList.remove("gz-busy", "gz-carried");
      el.style.opacity = "";
      applyOffset(el);
      g.remove(); if (gooseEl === g) gooseEl = null;
    };
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ───────── scheduler ─────────
  function applicable() { return enabled && !!host && !document.hidden && host.applicable(); }
  function compatible(ev, others) {
    for (const o of others) {
      if (ev.channels.some((ch) => o.channels.includes(ch))) return false;
      if ((ev.excludes || []).includes(o.id) || (o.excludes || []).includes(ev.id)) return false;
    }
    return true;
  }
  function candidates(extraActive = []) {
    const c = ctx(), nowS = now(), running = [...[...active.values()].map((a) => a.ev), ...extraActive];
    const quiet = calm() || matchMedia("(prefers-reduced-motion: reduce)").matches;
    return EVENTS.filter((ev) => !active.has(ev.id) && !extraActive.includes(ev)
      && ev.id !== lastId
      && nowS - (lastAt[ev.id] || -1e9) >= ev.cooldown
      && !(quiet && (ev.motion || ev.dims))
      && (!ev.eligible || ev.eligible(c))
      && compatible(ev, running));
  }
  function startEvent(ev) {
    const c = ctx();
    const rec = { ev, left: rand(ev.dur[0], ev.dur[1]), cleanup: null, onTick: null };
    active.set(ev.id, rec);
    lastAt[ev.id] = now(); lastId = ev.id;
    log.push({ id: ev.id, at: Date.now() }); log = log.slice(-50);
    try { rec.cleanup = ev.start(c, rec) || null; } catch (e) { active.delete(ev.id); return; }
    say("goose.ev." + ev.id);
  }
  function endEvent(id) {
    const rec = active.get(id); if (!rec) return;
    active.delete(id);
    try { if (rec.cleanup) rec.cleanup(); } catch { /* cleanup must never throw the scheduler */ }
  }
  function endAll() { for (const id of [...active.keys()]) endEvent(id); }
  function fireNext() {
    const pool = candidates();
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    startEvent(pick);
    if (Math.random() < CFG.comboChance) {
      const extra = candidates().filter((e) => e.severity <= 2);
      if (extra.length) startEvent(extra[Math.floor(Math.random() * extra.length)]);
    }
  }
  let wasApplicable = false;
  function tick() {
    const n = now(), dt = Math.min(1, n - lastNow); lastNow = n;
    const ok = applicable();
    if (hud) hud.hidden = !ok;
    if (!ok) {
      // suspended: end what's running (cleanly), keep the countdown where it is
      if (active.size) endAll();
      if (drag) { drag.el.classList.remove("gz-dragging"); drag = null; }
      wasApplicable = false;
      return;
    }
    if (!wasApplicable) { wasApplicable = true; syncPanels(); }
    for (const [id, rec] of [...active]) { rec.left -= dt; if (rec.onTick) rec.onTick(); if (rec.left <= 0) endEvent(id); }
    syncPanels();
    nextIn -= dt;
    if (nextIn <= 0) { fireNext(); nextIn = rand(CFG.interval[0], CFG.interval[1]); }
  }

  // ───────── lifecycle ─────────
  function enable() {
    if (enabled || !host) return;
    enabled = true; gen++;
    nextIn = rand(CFG.firstDelay[0], CFG.firstDelay[1]);
    lastNow = now(); wasApplicable = false;
    buildHud();
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
    document.addEventListener("keydown", onHandleKey, true);
    timer = setInterval(tick, CFG.tickMs);
    tick();
  }
  function disable() {
    if (!enabled) return;
    endAll();
    enabled = false; gen++;
    clearInterval(timer); timer = null;
    for (const id of pending) clearTimeout(id); pending.clear();
    clearTimeout(msgT);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerUp, true);
    document.removeEventListener("keydown", onHandleKey, true);
    drag = null; frozen = false;
    // belt and braces: nothing Goose-made survives
    offsets.clear(); clearPanels();
    for (const el of document.querySelectorAll(".gz-gray, .gz-rainbow, .gz-flip, .gz-shake, .gz-frozen")) { el.classList.remove("gz-gray", "gz-rainbow", "gz-flip", "gz-shake", "gz-frozen"); el.style.transformOrigin = ""; if (el.inert && el.matches("section.screen")) el.inert = false; }
    for (const el of document.querySelectorAll(".gz-freeze, .gz-dim, .gz-goose")) el.remove();
    if (hud) { hud.remove(); hud = null; }
    gooseEl = null;
  }
  function resetLayout() { offsets.clear(); for (const el of document.querySelectorAll("[data-gz-key]")) applyOffset(el); }

  window.Goose = {
    CFG, EVENTS, PANELS,
    init(h) { host = h; document.addEventListener("i18n:change", paintHud); document.addEventListener("visibilitychange", () => { if (document.hidden && enabled) tick(); }); },
    enable, disable, resetLayout,
    get enabled() { return enabled; },
    frozen: () => frozen,
    active: () => [...active.keys()],
    offsets: () => Object.fromEntries([...offsets].map(([k, v]) => [k, { x: v.x, y: v.y }])),
    // for tests and debugging: start an event now (respecting compatibility), end everything, read the log
    trigger(id) { if (!applicable()) return false; const ev = BY_ID[id]; if (!ev || active.has(id) || !compatible(ev, [...active.values()].map((a) => a.ev))) return false; startEvent(ev); return true; },
    endAll, log: () => log.slice(), setNext(s) { nextIn = s; },
  };
})();
