/*
 * Tour — one reusable guided-tour engine (spotlight + compact floating card) used by every tutorial:
 * the site tour, the test-taking tutorial and the campfire minigame tutorial (step lists live in js/onboarding.js).
 *
 *   Tour.start(steps, { id, startId, onStep(i, step), onEnd(result, info) })
 *     result: "completed" | "skipped" (left on the first step) | "exited" (left later) | "replaced"
 *
 *   step = {
 *     id,                         stable id (used to resume after a reload)
 *     target,                     CSS selector, array of selectors (spotlight covers their union) or () => Element
 *     title, body,                I18N keys; body may also be (t) => html for live content
 *     onEnter(), onExit(),        set up / tear down what the step shows (navigate, open a popover …)
 *     interactive,                let clicks through the spotlight so the user can try the real control
 *     allowKeys: ["f"],           keys that reach the page during an interactive step (all others are held back)
 *     advanceWhen(),              polled; the tour moves on by itself once it returns true (Next always works too)
 *     live,                       re-render the body when the user types/clicks (e.g. to show answer feedback)
 *     optional,                   if the target never shows up, skip the step instead of explaining it's missing
 *     when(),                     include the step only if this returns true (checked at start)
 *     actions: [{ label, run, primary }]   extra buttons in the card
 *     nextLabel, skipLabel,       I18N keys overriding the default button labels
 *     onNext()                    called before moving on (return false to stay)
 *   }
 *
 * Text comes only from I18N keys, so the card re-renders in place when the language changes ("i18n:change").
 * Esc exits; ← → move when focus is in the card; the spotlight follows its target every frame (scrolling,
 * resizing, popovers opening, a dragged panel). A target that never appears never traps anyone: the card says
 * so (or the step is skipped) and Next / Skip always work.
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const t = (k, v) => (window.I18N ? window.I18N.t(k, v) : k);
  const reduced = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const WAIT_MS = 1400; // how long to wait for a conditionally rendered target before giving up on it
  let T = null;         // the running tour

  const cur = () => T && T.steps[T.i];
  const visible = (el) => !!el && el.isConnected && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";

  function targetsOf(st) {
    if (!st || !st.target) return [];
    let list;
    try {
      if (typeof st.target === "function") list = [st.target()];
      else list = (Array.isArray(st.target) ? st.target : [st.target]).map((s) => document.querySelector(s));
    } catch { list = []; }
    return list.filter(visible);
  }
  function rectOf(els) {
    let l = Infinity, tp = Infinity, r = -Infinity, b = -Infinity;
    for (const el of els) { const q = el.getBoundingClientRect(); l = Math.min(l, q.left); tp = Math.min(tp, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
    return { left: l, top: tp, right: r, bottom: b, width: r - l, height: b - tp };
  }

  function start(steps, opts = {}) {
    if (T) finish("replaced");
    const list = steps.filter((s) => { try { return !s.when || s.when(); } catch { return false; } });
    if (!list.length) return;
    let i = 0;
    if (opts.startId) { const k = list.findIndex((s) => s.id === opts.startId); if (k >= 0) i = k; }
    T = { id: opts.id || "tour", steps: list, i, opts, dir: 1, lastFocus: document.activeElement, raf: 0, poll: 0, onInput: null };
    const root = $("#tour");
    root.hidden = false;
    root.dataset.tour = T.id;
    root.classList.toggle("reduced", reduced());
    document.body.classList.add("touring");
    $("#tour-next").onclick = () => next();
    $("#tour-back").onclick = () => back();
    $("#tour-skip").onclick = () => exit();
    $("#tour-exit").onclick = () => exit();
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("i18n:change", onLang);
    enter();
    loop();
  }

  function enter() {
    const st = cur();
    T.entered = performance.now();
    T.gaveUp = false;
    try { if (st.onEnter) st.onEnter(); } catch (e) { console.error("tour step", st.id, e); }
    render();
    const els = targetsOf(st);
    if (els.length) scrollToTargets(els);
    place();
    const want = st.focus && document.querySelector(st.focus);
    (want || $("#tour-next")).focus({ preventScroll: true });
    clearInterval(T.poll);
    if (st.advanceWhen) T.poll = setInterval(() => { let done = false; try { done = st.advanceWhen(); } catch { /* keep waiting */ } if (done && T && cur() === st) next(); }, 150);
    if (T.onInput) { document.removeEventListener("input", T.onInput, true); document.removeEventListener("click", T.onInput, true); T.onInput = null; }
    if (st.live) {
      T.onInput = () => setTimeout(() => { if (T && cur() === st) renderBody(); }, 0);
      document.addEventListener("input", T.onInput, true);
      document.addEventListener("click", T.onInput, true);
    }
    if (T.opts.onStep) try { T.opts.onStep(T.i, st); } catch { /* ignore */ }
  }
  function leave() {
    const st = cur();
    clearInterval(T.poll);
    try { if (st && st.onExit) st.onExit(); } catch (e) { console.error("tour step exit", st.id, e); }
  }

  function renderBody() {
    const st = cur();
    let html = "";
    try { html = typeof st.body === "function" ? st.body(t) : st.body ? t(st.body) : ""; } catch { html = ""; }
    if (T.gaveUp) html += `<p class="tour-missing">${t("tour.missing")}</p>`;
    $("#tour-text").innerHTML = html;
  }
  function render() {
    const st = cur(), n = T.steps.length, last = T.i === n - 1;
    $("#tour-title").textContent = t(st.title);
    renderBody();
    $("#tour-count").textContent = t("tour.stepOf", { n: T.i + 1, total: n });
    $("#tour-progress").innerHTML = T.steps.map((_, k) => `<i class="${k === T.i ? "on" : k < T.i ? "done" : ""}"></i>`).join("");
    $("#tour-back").hidden = T.i === 0 || !!st.noBack;
    $("#tour-back").textContent = t("tour.back");
    $("#tour-next").textContent = t(st.nextLabel || (last ? T.opts.finishLabel || "tour.finish" : "tour.next"));
    $("#tour-skip").textContent = t(st.skipLabel || (T.i === 0 ? T.opts.skipLabel || "tour.skip" : "tour.end"));
    $("#tour-exit").setAttribute("aria-label", t("tour.exit"));
    $("#tour-exit").title = t("tour.exit");
    const extra = $("#tour-extra");
    extra.innerHTML = "";
    for (const a of st.actions || []) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `btn btn-sm ${a.primary ? "btn-primary" : "btn-secondary"}`;
      b.textContent = t(a.label);
      if (a.id) b.dataset.tourAction = a.id;
      b.onclick = () => { try { a.run(); } catch (e) { console.error(e); } };
      extra.appendChild(b);
    }
    extra.hidden = !(st.actions && st.actions.length);
    $("#tour").classList.toggle("passthrough", !!st.interactive);
  }
  function onLang() { if (T) { render(); place(); } }

  function scrollToTargets(els) {
    const el = els[0];
    if (getComputedStyle(el).position === "fixed" || el.closest(".island, .pop, #tools, .fpanel")) return;
    const r = rectOf(els);
    if (r.top < 80 || r.bottom > window.innerHeight - 24) el.scrollIntoView({ block: r.height > window.innerHeight - 120 ? "start" : "center", inline: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }

  // The spotlight is recomputed every frame so it follows scrolling, resizing and moving elements.
  function loop() { if (!T) return; place(); T.raf = requestAnimationFrame(loop); }

  function place() {
    const st = cur(); if (!st) return;
    const spot = $("#tour-spot"), card = $("#tour-card"), block = $("#tour-block");
    const vw = window.innerWidth, vh = window.innerHeight, m = 12;
    const els = targetsOf(st);
    if (st.target && !els.length && !T.gaveUp && performance.now() - T.entered > WAIT_MS) {
      // the target never appeared: skip an optional step, otherwise say so (Next and Skip still work)
      if (st.optional) { const d = T.dir; return d < 0 && T.i > 0 ? back() : next(); }
      T.gaveUp = true; renderBody();
    }
    if (!els.length) {
      spot.style.cssText = "opacity:0;width:0;height:0";
      block.style.clipPath = "none";
      card.classList.add("centered");
      card.style.left = ""; card.style.top = "";
      return;
    }
    if (T.gaveUp) { T.gaveUp = false; renderBody(); }
    card.classList.remove("centered");
    const pad = 6, r = rectOf(els);
    const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
    const w = Math.max(0, Math.min(vw - 4, r.right + pad) - x), h = Math.max(0, Math.min(vh - 4, r.bottom + pad) - y);
    spot.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:1`;
    block.style.clipPath = `polygon(evenodd, 0 0, ${vw}px 0, ${vw}px ${vh}px, 0 ${vh}px, 0 0, ${x}px ${y}px, ${x + w}px ${y}px, ${x + w}px ${y + h}px, ${x}px ${y + h}px, ${x}px ${y}px)`;

    // card: beside the target if there's room, else below / above, else docked at the bottom (never off-screen)
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = 14;
    let cx, cy;
    if (x + w + gap + cw <= vw - m && ch <= vh - 2 * m) { cx = x + w + gap; cy = y; }
    else if (x - gap - cw >= m && ch <= vh - 2 * m) { cx = x - gap - cw; cy = y; }
    else if (y + h + gap + ch <= vh - m) { cx = x + w / 2 - cw / 2; cy = y + h + gap; }
    else if (y - gap - ch >= m) { cx = x + w / 2 - cw / 2; cy = y - gap - ch; }
    else { cx = (vw - cw) / 2; cy = vh - ch - m; }
    cx = Math.max(m, Math.min(cx, vw - cw - m));
    cy = Math.max(m, Math.min(cy, vh - ch - m));
    card.style.left = `${Math.round(cx)}px`; card.style.top = `${Math.round(cy)}px`;
  }

  function next() {
    if (!T) return;
    const st = cur();
    if (st.onNext) { let r; try { r = st.onNext(); } catch { r = true; } if (r === false) return; }
    if (!T) return;
    if (T.i >= T.steps.length - 1) return finish("completed");
    leave(); T.i++; T.dir = 1; enter();
  }
  function back() {
    if (!T || T.i === 0) return;
    leave(); T.i--; T.dir = -1; enter();
  }
  function goto(id) {
    if (!T) return;
    const k = T.steps.findIndex((s) => s.id === id); if (k < 0) return;
    leave(); T.dir = k >= T.i ? 1 : -1; T.i = k; enter();
  }
  function exit() { if (T) finish(T.i === 0 ? "skipped" : "exited"); }

  function finish(result) {
    if (!T) return;
    const done = T;
    leave();
    cancelAnimationFrame(done.raf);
    if (done.onInput) { document.removeEventListener("input", done.onInput, true); document.removeEventListener("click", done.onInput, true); }
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("i18n:change", onLang);
    T = null;
    const root = $("#tour");
    root.hidden = true;
    root.classList.remove("passthrough");
    delete root.dataset.tour;
    document.body.classList.remove("touring");
    if (done.lastFocus && done.lastFocus.isConnected && done.lastFocus.focus) try { done.lastFocus.focus({ preventScroll: true }); } catch { /* ignore */ }
    if (done.opts.onEnd) try { done.opts.onEnd(result, { index: done.i, id: done.steps[done.i] && done.steps[done.i].id, total: done.steps.length }); } catch (e) { console.error(e); }
  }

  function onKey(e) {
    if (!T) return;
    const st = cur();
    const inCard = !!(e.target.closest && e.target.closest("#tour-card"));
    if (document.querySelector("dialog[open]")) return; // a real dialog is on top: let it handle its own keys
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); exit(); return; }
    if (inCard && !e.target.matches("input, textarea, select")) {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); back(); return; }
    }
    if (e.key === "Tab") {
      // keep keyboard focus within the card, plus the highlighted target on interactive steps
      const scope = [...$("#tour-card").querySelectorAll("button:not([hidden]), [href], input, [tabindex]:not([tabindex='-1'])")].filter(visible);
      if (st.interactive) for (const el of targetsOf(st)) scope.push(...[el, ...el.querySelectorAll("button, input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((x) => visible(x) && !x.disabled && x.tabIndex >= 0));
      if (scope.length) {
        const k = scope.indexOf(document.activeElement);
        if (k < 0 || (e.shiftKey ? k === 0 : k === scope.length - 1)) { e.preventDefault(); scope[e.shiftKey ? scope.length - 1 : 0].focus(); }
      }
      return;
    }
    if (inCard) return;
    // Keys underneath (test shortcuts like F, H, P …) only get through on interactive steps, and only those allowed.
    const typing = e.target.matches && e.target.matches("input, textarea, select");
    if (!st.interactive) { e.stopPropagation(); return; }
    if (!typing && st.allowKeys && !st.allowKeys.includes(e.key.toLowerCase()) && !["Enter", " ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.stopPropagation();
    if (!typing && !st.allowKeys && e.key.length === 1) e.stopPropagation();
  }

  window.Tour = {
    start, next, back, goto, exit, end: finish,
    refresh: () => { if (T) { render(); place(); } },
    get active() { return !!T; },
    get id() { return T ? T.id : null; },
    get step() { return T ? cur() : null; },
    get index() { return T ? T.i : -1; },
  };
})();
