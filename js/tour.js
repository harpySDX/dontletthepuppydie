/*
 * Tour — a skippable step-by-step spotlight.
 *   Tour.start(steps, { onEnd(completed) })
 *   step: { target: "css selector" | null, title, html, onEnter?(), interactive?: true }
 * The highlighted element stays usable (the blocker has a hole cut around it);
 * everything else is blocked until the tour moves on or is skipped.
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  let steps = [], i = 0, opts = {}, raf = 0, lastFocus = null;

  function start(list, options = {}) {
    steps = list; i = 0; opts = options;
    lastFocus = document.activeElement;
    $("#tour").hidden = false;
    document.body.classList.add("touring");
    $("#tour-next").onclick = next;
    $("#tour-back").onclick = back;
    $("#tour-skip").onclick = () => end(false);
    document.addEventListener("keydown", onKey, true);
    show();
    loop();
  }

  function onKey(e) {
    if ($("#tour").hidden) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); end(false); }
    else if (e.key === "Enter" && !e.target.matches("input, textarea")) { e.preventDefault(); e.stopPropagation(); next(); }
    else if (!steps[i].interactive) e.stopPropagation(); // don't trigger test shortcuts underneath
  }

  function show() {
    const st = steps[i];
    if (st.onEnter) st.onEnter();
    // Interactive steps let clicks through the spotlight hole; others block everything.
    $("#tour").classList.toggle("passthrough", !!st.interactive);
    $("#tour-title").textContent = st.title;
    $("#tour-text").innerHTML = st.html;
    $("#tour-progress").innerHTML = steps.map((_, k) => `<i class="${k === i ? "on" : k < i ? "done" : ""}"></i>`).join("") + `<span>${i + 1} of ${steps.length}</span>`;
    $("#tour-back").hidden = i === 0;
    $("#tour-next").textContent = i === steps.length - 1 ? (opts.finishLabel || "Finish") : "Next";
    const el = st.target && document.querySelector(st.target);
    if (el && getComputedStyle(el).position !== "fixed") {
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 20) el.scrollIntoView({ block: "center", inline: "nearest" });
    }
    place(true);
    $("#tour-next").focus({ preventScroll: true });
  }

  // Recompute every frame so the spotlight follows things like a dragged scratchpad.
  function loop() { place(false); raf = requestAnimationFrame(loop); }

  function place(force) {
    const st = steps[i];
    const el = st && st.target && document.querySelector(st.target);
    const spot = $("#tour-spot"), card = $("#tour-card"), block = $("#tour-block");
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!el || el.offsetParent === null && getComputedStyle(el).position !== "fixed") {
      spot.style.cssText = `left:${vw / 2}px;top:${vh / 2}px;width:0;height:0;opacity:0`;
      block.style.clipPath = "none";
      card.classList.add("centered");
      card.style.left = ""; card.style.top = "";
      return;
    }
    card.classList.remove("centered");
    const pad = 8;
    const r = el.getBoundingClientRect();
    const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
    const w = Math.min(vw - 8, r.right + pad) - x, h = Math.min(vh - 8, r.bottom + pad) - y;
    spot.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:1`;
    block.style.clipPath = `polygon(evenodd, 0 0, ${vw}px 0, ${vw}px ${vh}px, 0 ${vh}px, 0 0, ${x}px ${y}px, ${x + w}px ${y}px, ${x + w}px ${y + h}px, ${x}px ${y + h}px, ${x}px ${y}px)`;

    // Card: right of the target, else left, else below, else above, else centered at the bottom.
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = 14, m = 12;
    let cx, cy;
    if (x + w + gap + cw <= vw - m) { cx = x + w + gap; cy = y; }
    else if (x - gap - cw >= m) { cx = x - gap - cw; cy = y; }
    else if (y + h + gap + ch <= vh - m) { cx = x + w / 2 - cw / 2; cy = y + h + gap; }
    else if (y - gap - ch >= m) { cx = x + w / 2 - cw / 2; cy = y - gap - ch; }
    else { cx = (vw - cw) / 2; cy = vh - ch - m; }
    cx = Math.max(m, Math.min(cx, vw - cw - m));
    cy = Math.max(m, Math.min(cy, vh - ch - m));
    card.style.left = `${cx}px`; card.style.top = `${cy}px`;
  }

  function next() { if (i < steps.length - 1) { i++; show(); } else end(true); }
  function back() { if (i > 0) { i--; show(); } }

  function end(completed) {
    cancelAnimationFrame(raf);
    $("#tour").hidden = true;
    document.body.classList.remove("touring");
    document.removeEventListener("keydown", onKey, true);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch { /* ignore */ }
    if (opts.onEnd) opts.onEnd(completed);
  }

  window.Tour = { start, get active() { return !$("#tour").hidden; } };
})();
