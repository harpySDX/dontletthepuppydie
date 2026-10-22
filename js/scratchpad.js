/*
 * Scratchpad — a floating, draggable, resizable drawing pad.
 * Draw with the left mouse button, a pen or a finger. One page per question:
 * the app hands in that question's stroke array via setPage().
 *
 * Stroke format (kept small so it fits in localStorage):
 *   { c: "#color", w: width, e: 1 if eraser, p: [x0, y0, x1, y1, ...] }  (CSS px, integers)
 */
(function () {
  "use strict";

  const COLORS = [
    { c: "#24201b", name: "Pencil" },
    { c: "#2f6fd6", name: "Blue" },
    { c: "#d6453a", name: "Red" },
  ];
  const SIZES = [2, 4, 8];
  const PREF_KEY = "campfire-prep.scratchpad.v1";

  const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; } };
  const savePrefs = (p) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* ignore */ } };

  // "Pencil" is drawn in the theme's paper ink, so it stays readable on dark paper (saved strokes keep the hex as an id)
  let pencilInk = null;
  const inkOf = (c) => {
    if (c !== COLORS[0].c) return c;
    if (!pencilInk) { try { pencilInk = getComputedStyle(document.documentElement).getPropertyValue("--paper-ink").trim() || c; } catch { pencilInk = c; } }
    return pencilInk;
  };
  const pads = new Set();
  document.addEventListener("theme:change", () => { pencilInk = null; requestAnimationFrame(() => { for (const sp of pads) try { sp.redraw(); } catch { /* detached */ } }); });
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { pencilInk = null; for (const sp of pads) try { sp.redraw(); } catch { /* detached */ } }); } catch { /* old browsers */ }

  function drawStroke(ctx, s) {
    const p = s.p;
    if (!p || p.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = s.e ? "destination-out" : "source-over";
    ctx.strokeStyle = inkOf(s.c);
    ctx.fillStyle = inkOf(s.c);
    ctx.lineWidth = s.w;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (p.length === 2) { // a dot
      ctx.beginPath();
      ctx.arc(p[0], p[1], s.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Smooth through midpoints with quadratic curves
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length - 2; i += 2) {
        const mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2;
        ctx.quadraticCurveTo(p[i], p[i + 1], mx, my);
      }
      ctx.lineTo(p[p.length - 2], p[p.length - 1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  class Scratchpad {
    constructor(root) {
      this.root = root;
      pads.add(this);
      this.canvas = root.querySelector(".sp-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.surface = root.querySelector(".sp-surface");
      this.strokes = [];
      this.cleared = null;
      this.page = null;      // object holding .notes (typed working) for this page
      this.text = root.querySelector(".sp-text");
      this.mode = "draw";
      this.onChange = () => {};
      this.tool = { color: COLORS[0].c, size: SIZES[0], eraser: false };
      // starts tucked away as a small pill; it opens from the pill, the Tools menu or N
      this.prefs = Object.assign({ x: null, y: null, w: 340, h: 300, min: true, big: false }, loadPrefs());
      this._buildToolbar();
      this._bindText();
      this._bindDrawing();
      this._bindWindow();
      new ResizeObserver(() => this._fitCanvas()).observe(this.surface);
      window.addEventListener("resize", () => this._place());
    }

    // ───────── public ─────────
    show() { this.root.hidden = false; this._place(); this._applyMin(); this._fitCanvas(); }
    hide() { this.root.hidden = true; }
    // Make sure the pad is open, normal-sized and on screen (used by the tour).
    open() {
      this.prefs.min = false;
      this.prefs.big = false;
      savePrefs(this.prefs);
      this._applyMin();
      this._place();
      this._fitCanvas();
    }
    toggleMin() { this.prefs.min = !this.prefs.min; savePrefs(this.prefs); this._applyMin(); if (!this.prefs.min) this._fitCanvas(); }
    setPage(strokes, label, page) {
      this.strokes = strokes;
      this.cleared = null;
      this.page = page || null;
      if (this.text) { this.text.value = (page && page.notes) || ""; this.text.disabled = !page; }
      this._setMode(this.mode);
      this.root.querySelector(".sp-page").textContent = label ? `· ${label}` : "";
      this.root.querySelector(".sp-mini-page").textContent = label || "";
      this._updateCount();
      this.redraw();
    }
    redraw() {
      const dpr = window.devicePixelRatio || 1;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const s of this.strokes) drawStroke(this.ctx, s);
    }

    // Draw saved strokes into a canvas, cropped and scaled to fit (used in the review).
    static render(strokes, canvas, maxW = 640, maxH = 360) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const s of strokes) for (let i = 0; i < s.p.length; i += 2) {
        x0 = Math.min(x0, s.p[i] - s.w); y0 = Math.min(y0, s.p[i + 1] - s.w);
        x1 = Math.max(x1, s.p[i] + s.w); y1 = Math.max(y1, s.p[i + 1] + s.w);
      }
      if (!isFinite(x0)) return false;
      const pad = 12, bw = x1 - x0 + pad * 2, bh = y1 - y0 + pad * 2;
      const scale = Math.min(1, maxW / bw, maxH / bh);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.ceil(bw * scale * dpr);
      canvas.height = Math.ceil(bh * scale * dpr);
      canvas.style.width = `${Math.ceil(bw * scale)}px`;
      canvas.style.aspectRatio = `${bw} / ${bh}`;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, (pad - x0) * scale * dpr, (pad - y0) * scale * dpr);
      for (const s of strokes) drawStroke(ctx, s);
      return true;
    }

    // ───────── typed working ─────────
    _bindText() {
      if (!this.text) return;
      this.text.addEventListener("input", () => { if (this.page) { this.page.notes = this.text.value; this._updateCount(); this.onChange(); } });
      this.text.addEventListener("keydown", (e) => e.stopPropagation()); // typing here never triggers test shortcuts
    }
    _setMode(m) {
      this.mode = m;
      this.root.classList.toggle("typing", m === "type");
      for (const b of this.root.querySelectorAll("[data-mode]")) { const on = b.dataset.mode === m; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); }
      if (m === "draw") this._fitCanvas();
    }
    // ───────── toolbar ─────────
    _buildToolbar() {
      const bar = this.root.querySelector(".sp-tools");
      const t = (k, en) => (window.I18N ? window.I18N.t(k) : en);
      bar.innerHTML = `
        <span class="sp-modes" role="group" aria-label="Scratchpad mode"><button type="button" data-mode="draw" class="active" aria-pressed="true">${t("pad.draw", "Draw")}</button><button type="button" data-mode="type" aria-pressed="false">${t("pad.type", "Type")}</button></span>
        <span class="sp-sep"></span>
        ${COLORS.map((c, i) => `<button type="button" class="sp-color${i === 0 ? " active" : ""}" data-color="${c.c}" title="${c.name}" aria-label="${c.name}" style="--swatch:${i === 0 ? "var(--paper-ink)" : c.c}"></button>`).join("")}
        <span class="sp-sep"></span>
        ${SIZES.map((s, i) => `<button type="button" class="sp-size${i === 0 ? " active" : ""}" data-size="${s}" title="${["Fine", "Medium", "Thick"][i]} line" aria-label="${["Fine", "Medium", "Thick"][i]} line"><i style="width:${s + 2}px;height:${s + 2}px"></i></button>`).join("")}
        <span class="sp-sep"></span>
        <button type="button" class="sp-btn sp-eraser" data-act="eraser" title="Eraser" aria-label="Eraser" aria-pressed="false">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M16.2 3.8a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L10 18H6l-2.2-2.2a2 2 0 0 1 0-2.8zM8 11l5 5M6 21h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button type="button" class="sp-btn" data-act="undo" title="${t("pad.undo", "Undo")} (Ctrl+Z)" aria-label="${t("pad.undo", "Undo")}">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button type="button" class="sp-btn sp-clear" data-act="clear" title="${t("pad.clear", "Clear")}" aria-label="${t("pad.clear", "Clear")}">${t("pad.clear", "Clear")}</button>`;
      bar.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.mode) { this._setMode(b.dataset.mode); if (b.dataset.mode === "type" && this.text) this.text.focus(); return; }
        if (b.dataset.color) {
          this.tool.color = b.dataset.color;
          this._setEraser(false);
          for (const x of bar.querySelectorAll(".sp-color")) x.classList.toggle("active", x === b);
        } else if (b.dataset.size) {
          this.tool.size = Number(b.dataset.size);
          for (const x of bar.querySelectorAll(".sp-size")) x.classList.toggle("active", x === b);
        } else if (b.dataset.act === "eraser") this._setEraser(!this.tool.eraser);
        else if (b.dataset.act === "undo") this.undo();
        else if (b.dataset.act === "clear") this._clear(b);
      });
    }
    _setEraser(on) {
      this.tool.eraser = on;
      const b = this.root.querySelector(".sp-eraser");
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on);
      this.surface.classList.toggle("erasing", on);
    }
    undo() {
      if (this.mode === "type") {
        if (!this.text) return;
        if (!this.text.value && this.lastText) { this.text.value = this.lastText; this.lastText = null; if (this.page) this.page.notes = this.text.value; this._updateCount(); this.onChange(); return; }
        this.text.focus(); try { document.execCommand("undo"); } catch { /* not supported */ }
        return;
      }
      if (this.strokes.length) this.strokes.pop();
      else if (this.cleared) { this.strokes.push(...this.cleared); this.cleared = null; }
      else return;
      this.redraw(); this._updateCount(); this.onChange();
    }
    _clear(btn) {
      const t = (k, en) => (window.I18N ? window.I18N.t(k) : en);
      const typing = this.mode === "type";
      // nothing meaningful to lose → nothing to confirm
      if (typing ? !(this.text && this.text.value.trim()) : !this.strokes.length) return;
      if (!btn.classList.contains("confirm")) {
        btn.classList.add("confirm");
        btn.textContent = t("pad.sure", "Clear this page?");
        clearTimeout(this._clrT);
        this._clrT = setTimeout(() => { btn.classList.remove("confirm"); btn.textContent = t("pad.clear", "Clear"); }, 3000);
        return;
      }
      clearTimeout(this._clrT);
      btn.classList.remove("confirm"); btn.textContent = t("pad.clear", "Clear");
      if (typing) { this.lastText = this.text.value; this.text.value = ""; if (this.page) this.page.notes = ""; }
      else this.cleared = this.strokes.splice(0);
      this.redraw(); this._updateCount(); this.onChange();
    }
    _updateCount() {
      this.root.querySelector(".sp-mini").classList.toggle("has-ink", this.strokes.length > 0 || !!(this.text && this.text.value.trim()));
      this.root.querySelector(".sp-hint").hidden = this.strokes.length > 0;
    }

    // ───────── drawing ─────────
    _bindDrawing() {
      const c = this.canvas;
      let cur = null;
      const pt = (e) => {
        const r = c.getBoundingClientRect();
        return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)];
      };
      c.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return; // left button only
        e.preventDefault();
        c.setPointerCapture(e.pointerId);
        const [x, y] = pt(e);
        cur = { c: this.tool.color, w: this.tool.eraser ? this.tool.size * 4 + 8 : this.tool.size, p: [x, y] };
        if (this.tool.eraser) cur.e = 1;
        this.strokes.push(cur);
        this.cleared = null;
        this.redrawLast();
      });
      c.addEventListener("pointermove", (e) => {
        if (!cur) return;
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of evs) {
          const [x, y] = pt(ev);
          const n = cur.p.length;
          if (Math.abs(x - cur.p[n - 2]) + Math.abs(y - cur.p[n - 1]) < 2) continue;
          cur.p.push(x, y);
        }
        this.redrawLast();
      });
      const end = () => {
        if (!cur) return;
        cur = null;
        this._updateCount();
        this.onChange();
      };
      c.addEventListener("pointerup", end);
      c.addEventListener("pointercancel", end);
      c.addEventListener("contextmenu", (e) => e.preventDefault());
      this.root.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.stopPropagation(); this.undo(); }
      });
    }
    // Live drawing: redraw everything (eraser needs it) — fast enough for a scratch page.
    redrawLast() { this.redraw(); }

    _fitCanvas() {
      if (this.root.hidden || this.prefs.min) return;
      const r = this.surface.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w; this.canvas.height = h;
        this.canvas.style.width = `${r.width}px`; this.canvas.style.height = `${r.height}px`;
      }
      this.redraw();
    }

    // ───────── window: drag, resize, minimize, expand ─────────
    _bindWindow() {
      const head = this.root.querySelector(".sp-head");
      const grip = this.root.querySelector(".sp-resize");
      const drag = (handle, onMove) => {
        handle.addEventListener("pointerdown", (e) => {
          if (e.target.closest("button") || (e.pointerType === "mouse" && e.button !== 0)) return;
          e.preventDefault();
          handle.setPointerCapture(e.pointerId);
          const start = { x: e.clientX, y: e.clientY, r: this.root.getBoundingClientRect() };
          this.root.classList.add("moving");
          const move = (ev) => onMove(ev.clientX - start.x, ev.clientY - start.y, start.r);
          const up = () => {
            handle.removeEventListener("pointermove", move);
            handle.removeEventListener("pointerup", up);
            handle.removeEventListener("pointercancel", up);
            this.root.classList.remove("moving");
            savePrefs(this.prefs);
          };
          handle.addEventListener("pointermove", move);
          handle.addEventListener("pointerup", up);
          handle.addEventListener("pointercancel", up);
        });
      };
      drag(head, (dx, dy, r) => { this.prefs.x = r.left + dx; this.prefs.y = r.top + dy; this.prefs.moved = true; this._place(); });
      drag(grip, (dx, dy, r) => {
        this.prefs.big = false;
        this.root.classList.remove("big");
        this.prefs.w = r.width + dx; this.prefs.h = r.height + dy;
        this.prefs.x = r.left; this.prefs.y = r.top;
        this._place();
      });
      head.addEventListener("dblclick", (e) => { if (!e.target.closest("button")) this._toggleBig(); });
      this.root.querySelector('[data-win="min"]').addEventListener("click", () => this.toggleMin());
      this.root.querySelector('[data-win="big"]').addEventListener("click", () => this._toggleBig());
      this.root.querySelector(".sp-mini").addEventListener("click", () => this.toggleMin());
    }
    _toggleBig() {
      this.prefs.big = !this.prefs.big;
      savePrefs(this.prefs);
      this._place();
      this._fitCanvas();
    }
    _applyMin() {
      this.root.classList.toggle("minimized", !!this.prefs.min);
      this.root.querySelector('[data-win="min"]').setAttribute("aria-label", this.prefs.min ? "Open scratchpad" : "Minimize scratchpad");
    }
    _place() {
      const vw = window.innerWidth, vh = window.innerHeight, m = 8;
      const p = this.prefs;
      this.root.classList.toggle("big", !!p.big);
      let w, h, x, y;
      if (p.big) {
        w = Math.min(vw - m * 2, Math.max(560, vw * 0.7));
        h = Math.min(vh - m * 2, Math.max(420, vh * 0.72));
        x = (vw - w) / 2; y = (vh - h) / 2;
      } else {
        w = Math.max(260, Math.min(p.w, vw - m * 2));
        h = Math.max(220, Math.min(p.h, vh - m * 2));
        // Default home: bottom-left, under the puppy, clear of the heat bar and Add log button.
        // With the Campfire Companion controls under the puppy, it starts bottom-centre instead.
        x = p.moved ? p.x : this.avoidLeft ? (vw - w) / 2 : 20;
        y = p.moved ? p.y : vh - h - 24;
        x = Math.max(m, Math.min(x, vw - w - m));
        y = Math.max(m, Math.min(y, vh - 48));
        p.w = w; p.h = h; p.x = x; p.y = y;
      }
      Object.assign(this.root.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    }
  }

  window.Scratchpad = Scratchpad;
})();
