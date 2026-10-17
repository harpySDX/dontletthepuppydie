/*
 * TOOLS — the floating tools menu (calculator + scratchpad) and the shared rules for floating panels:
 *   one launcher · panels stack (the one you touch comes to the front) · Escape closes the panel you're in
 *   and returns focus to whatever opened it · outside clicks close the menu · panels stay on screen.
 * The scratchpad instance is owned by the app (it pages per question in a test); Tools opens and closes it.
 */
(function () {
  "use strict";
  let A = null, calc = null, z = 60, lastOpener = null;
  const $ = (s) => document.querySelector(s);
  const t = (k) => (window.I18N ? window.I18N.t(k) : k);
  const PREF = "campfire-prep.calc.v1";
  const loadP = () => { try { return JSON.parse(localStorage.getItem(PREF)) || {}; } catch { return {}; } };
  const saveP = (p) => { try { const cur = loadP(); localStorage.setItem(PREF, JSON.stringify({ ...cur, ...p })); } catch { /* ignore */ } };

  function bringFront(el) { z += 1; el.style.zIndex = String(z); }
  // drag by [data-drag], resize by [data-resize]; keep the panel inside the viewport
  function makeFloating(el, defaults, save) {
    const p = Object.assign({}, defaults, loadP());
    const place = () => {
      const vw = window.innerWidth, vh = window.innerHeight, m = 8;
      const w = Math.max(260, Math.min(p.w, vw - m * 2)), h = Math.max(300, Math.min(p.h, vh - m * 2));
      let x = p.x === null || p.x === undefined ? vw - w - 24 : p.x, y = p.y === null || p.y === undefined ? vh - h - 96 : p.y;
      x = Math.max(m, Math.min(x, vw - w - m)); y = Math.max(m, Math.min(y, vh - 48));
      Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
      Object.assign(p, { x, y, w, h });
    };
    el.addEventListener("pointerdown", () => bringFront(el));
    el.addEventListener("pointerdown", (e) => {
      const handle = e.target.closest("[data-drag], [data-resize]");
      if (!handle || e.target.closest("button, input, select") || (e.pointerType === "mouse" && e.button !== 0)) return;
      e.preventDefault();
      const resize = handle.hasAttribute("data-resize");
      const start = { x: e.clientX, y: e.clientY, p: { ...p } };
      handle.setPointerCapture(e.pointerId);
      el.classList.add("moving");
      const move = (ev) => {
        const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        if (resize) { p.w = start.p.w + dx; p.h = start.p.h + dy; } else { p.x = start.p.x + dx; p.y = start.p.y + dy; }
        place();
      };
      const up = () => { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); handle.removeEventListener("pointercancel", up); el.classList.remove("moving"); save({ x: p.x, y: p.y, w: p.w, h: p.h }); };
      handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", up); handle.addEventListener("pointercancel", up);
    });
    window.addEventListener("resize", () => { if (!el.hidden) place(); });
    return { place };
  }

  function setMenu(open) {
    const m = $("#tools-menu"), b = $("#tools-btn");
    m.hidden = !open; b.setAttribute("aria-expanded", String(open));
    if (open) { syncMenu(); bringFront($("#tools")); const first = m.querySelector("button"); if (first) first.focus(); }
  }
  function syncMenu() {
    for (const b of document.querySelectorAll("#tools-menu [data-tool]")) b.setAttribute("aria-checked", String(isOpen(b.dataset.tool)));
    $("#tools-btn").classList.toggle("has-open", isOpen("calc") || isOpen("pad"));
  }
  const pad = () => (A && A.pad ? A.pad() : null);
  function isOpen(name) {
    if (name === "calc") return !!calc && !$("#calc-panel").hidden;
    const p = pad(); return !!p && !p.root.hidden && !p.prefs.min;
  }
  function open(name, opener) {
    lastOpener = opener || document.activeElement;
    if (name === "calc") {
      const el = $("#calc-panel");
      if (!calc) {
        calc = new window.Calc.Panel(el, { t, onClose: () => close("calc") });
        calc.floating = makeFloating(el, { w: 320, h: 470, x: null, y: null }, saveP);
      }
      el.hidden = false; calc.floating.place(); bringFront(el); calc.focus();
    } else {
      const p = pad(); if (!p) return;
      A.ensurePadPage();
      p.show(); if (p.prefs.min) p.toggleMin(); bringFront(p.root);
    }
    syncMenu();
  }
  function close(name) {
    if (name === "calc" && calc) $("#calc-panel").hidden = true;
    if (name === "pad") { const p = pad(); if (p) { if (A.inTest()) { if (!p.prefs.min) p.toggleMin(); } else p.hide(); } }
    syncMenu();
    if (lastOpener && document.contains(lastOpener) && lastOpener.offsetParent !== null) lastOpener.focus(); else $("#tools-btn").focus();
  }
  const toggle = (name, opener) => (isOpen(name) ? close(name) : open(name, opener));

  function init(api) {
    A = api;
    $("#tools-btn").addEventListener("click", (e) => { e.stopPropagation(); setMenu($("#tools-menu").hidden); });
    $("#tools-menu").addEventListener("click", (e) => { const b = e.target.closest("[data-tool]"); if (!b) return; setMenu(false); toggle(b.dataset.tool, $("#tools-btn")); });
    $("#tools-menu").addEventListener("keydown", (e) => {
      const items = [...document.querySelectorAll("#tools-menu [data-tool]")];
      const k = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(k + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus(); }
    });
    document.addEventListener("click", (e) => { if (!$("#tools-menu").hidden && !e.target.closest("#tools")) setMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#tools-menu").hidden) { setMenu(false); $("#tools-btn").focus(); e.preventDefault(); return; }
      const inCalc = e.target.closest && e.target.closest("#calc-panel");
      const inPad = e.target.closest && e.target.closest("#scratchpad");
      if (inCalc) { e.preventDefault(); close("calc"); }
      else if (inPad) { e.preventDefault(); close("pad"); }
    });
    document.addEventListener("i18n:change", () => { if (calc) { const open = !$("#calc-panel").hidden; calc.build(); if (open) calc.floating.place(); } });
  }
  // the launcher is hidden on screens where it would get in the way (title screen); shown everywhere else
  function setVisible(on) { $("#tools").hidden = !on; if (!on) { setMenu(false); } }

  window.Tools = { init, open, close, toggle, isOpen, setVisible, sync: syncMenu, bringFront };
})();
