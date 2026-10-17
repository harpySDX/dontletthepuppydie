/*
 * GRAPH — accurate SVG graphs of quadratic functions, and an interactive plotter.
 *
 *   Graph.svg(spec)            → SVG markup: grid, axes, labelled ticks, parabolas (clipped to the window),
 *                                vertex / intercept markers, axis of symmetry, extra points. Theme-aware via CSS classes.
 *   Graph.token(spec, desc)    → "[[graph|…|desc]]": a text token questions can carry; renderMath turns it into an SVG
 *   Graph.render(str)          → replaces tokens in a string with SVG
 *   Graph.describe(str)        → replaces tokens with their plain description (for the tutor / screen readers)
 *   Graph.plotter(el, opts)    → place a vertex and one more point by click, drag or keyboard; reports "v:h,k;p:x,y"
 *
 * Coefficients may be numbers or fraction strings ("3/2").
 */
(function (root) {
  "use strict";
  const num = (v) => {
    if (typeof v === "number") return v;
    const s = String(v); const m = /^(-?\d+)\/(\d+)$/.exec(s);
    return m ? Number(m[1]) / Number(m[2]) : Number(s);
  };
  const fmt = (v) => { const r = Math.round(v * 100) / 100; return (r < 0 ? "−" : "") + Math.abs(r); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // normalise a function spec to {a, b, c} numbers
  function std(f) {
    // other curves for the wider course: y = a√(x − h) + k and straight lines y = mx + b
    if (f.type === "sqrt") { const a = num(f.a), h = num(f.h), k = num(f.k); return { type: "sqrt", a, h, k, y: (x) => (x < h ? NaN : a * Math.sqrt(x - h) + k) }; }
    if (f.type === "line") { const m = num(f.m), b = num(f.b); return { type: "line", a: 0, b: m, c: b, y: (x) => m * x + b }; }
    if ("h" in f) { const a = num(f.a), h = num(f.h), k = num(f.k); return { a, b: -2 * a * h, c: a * h * h + k }; }
    return { a: num(f.a), b: num(f.b || 0), c: num(f.c || 0) };
  }
  const yAt = (f, x) => (f.y ? f.y(x) : f.a * x * x + f.b * x + f.c);
  function keyPoints(f) {
    const h = -f.b / (2 * f.a), k = yAt(f, h), D = f.b * f.b - 4 * f.a * f.c;
    const xs = D < -1e-12 ? [] : Math.abs(D) < 1e-12 ? [h] : [(-f.b - Math.sqrt(D)) / (2 * f.a), (-f.b + Math.sqrt(D)) / (2 * f.a)].sort((p, q) => p - q);
    return { h, k, xs, yint: f.c };
  }

  // choose a readable window that contains every key feature
  function autoWindow(fns, points = []) {
    const xs = [0], ys = [0];
    for (const f of fns) {
      if (f.type === "sqrt") { xs.push(f.h, f.h + 9); ys.push(f.k, yAt(f, f.h + 9)); continue; }
      if (f.type === "line") { ys.push(f.c); continue; }
      const kp = keyPoints(f); xs.push(kp.h, ...kp.xs.filter((x) => Math.abs(x) < 40)); ys.push(kp.k, kp.yint);
    }
    for (const p of points) { xs.push(num(p.x)); ys.push(num(p.y)); }
    let x0 = Math.floor(Math.min(...xs) - 2), x1 = Math.ceil(Math.max(...xs) + 2);
    while (x1 - x0 < 10) { x0--; x1++; }
    // include the curve a little way past the vertex
    for (const f of fns) { if (f.type) continue; const kp = keyPoints(f); ys.push(yAt(f, kp.h + 1.5), yAt(f, kp.h - 1.5)); }
    let y0 = Math.floor(Math.min(...ys) - 1.5), y1 = Math.ceil(Math.max(...ys) + 1.5);
    while (y1 - y0 < 10) { y0--; y1++; }
    return { x0, x1, y0, y1 };
  }
  const stepFor = (span) => (span <= 14 ? 1 : span <= 28 ? 2 : span <= 70 ? 5 : span <= 140 ? 10 : 20);

  // scaffold shared by the static graph and the plotter
  function frame(win, W, H) {
    const P = { l: 30, r: 12, t: 12, b: 24 };
    const X = (x) => P.l + ((x - win.x0) / (win.x1 - win.x0)) * (W - P.l - P.r);
    const Y = (y) => P.t + (1 - (y - win.y0) / (win.y1 - win.y0)) * (H - P.t - P.b);
    const sx = stepFor(win.x1 - win.x0), sy = stepFor(win.y1 - win.y0);
    let grid = "", ticks = "";
    for (let x = Math.ceil(win.x0); x <= win.x1; x++) {
      grid += `<line class="g-grid${x % sx ? " minor" : ""}" x1="${X(x)}" x2="${X(x)}" y1="${Y(win.y0)}" y2="${Y(win.y1)}"/>`;
      if (x % sx === 0 && x !== 0) ticks += `<text class="g-tick" x="${X(x)}" y="${Math.min(H - P.b + 15, Math.max(P.t + 10, Y(0) + 14))}" text-anchor="middle">${fmt(x)}</text>`;
    }
    for (let y = Math.ceil(win.y0); y <= win.y1; y++) {
      grid += `<line class="g-grid${y % sy ? " minor" : ""}" x1="${X(win.x0)}" x2="${X(win.x1)}" y1="${Y(y)}" y2="${Y(y)}"/>`;
      if (y % sy === 0 && y !== 0) ticks += `<text class="g-tick" x="${Math.max(P.l - 4, Math.min(W - P.r - 4, X(0) - 5))}" y="${Y(y) + 3.5}" text-anchor="end">${fmt(y)}</text>`;
    }
    const axes = (win.y0 <= 0 && win.y1 >= 0 ? `<line class="g-axis" x1="${X(win.x0)}" x2="${X(win.x1)}" y1="${Y(0)}" y2="${Y(0)}"/><text class="g-axis-label" x="${X(win.x1) - 4}" y="${Y(0) - 5}" text-anchor="end">x</text>` : "")
      + (win.x0 <= 0 && win.x1 >= 0 ? `<line class="g-axis" x1="${X(0)}" x2="${X(0)}" y1="${Y(win.y0)}" y2="${Y(win.y1)}"/><text class="g-axis-label" x="${X(0) + 6}" y="${Y(win.y1) + 10}">y</text>` : "")
      + (win.x0 <= 0 && win.x1 >= 0 && win.y0 <= 0 && win.y1 >= 0 ? `<text class="g-tick" x="${X(0) - 5}" y="${Y(0) + 13}" text-anchor="end">0</text>` : "");
    return { X, Y, P, html: grid + axes + ticks };
  }
  function curvePath(f, win, X, Y) {
    const n = 240, pts = [];
    let pen = false;
    for (let i = 0; i <= n; i++) { const x = win.x0 + ((win.x1 - win.x0) * i) / n, y = yAt(f, x); if (!Number.isFinite(y)) { pen = false; continue; } pts.push(`${pen ? "L" : "M"}${X(x).toFixed(2)} ${Y(y).toFixed(2)}`); pen = true; }
    if (f.type === "sqrt" && win.x0 <= f.h) pts.unshift(`M${X(f.h).toFixed(2)} ${Y(f.k).toFixed(2)}`), pts[1] = pts[1].replace(/^M/, "L");
    return pts.join(" ");
  }
  let uid = 0;
  /*
   * spec: { fns: [{a,b,c} | {a,h,k}, …], styles?: ["", "alt", "dashed"], labels?: ["f", "g"],
   *         marks?: { vertex, axis, xint, yint } (booleans; default false), points?: [{x, y, label}],
   *         window?: {x0,x1,y0,y1}, w?, h?, title? }
   */
  function svg(spec) {
    const fns = (spec.fns || []).map(std);
    const win = spec.window || autoWindow(fns, spec.points || []);
    const W = spec.w || 360, H = spec.h || 280;
    const { X, Y, html } = frame(win, W, H);
    const id = `gclip${++uid}`;
    const m = spec.marks || {};
    let curves = "", dots = "", lines = "";
    fns.forEach((f, i) => {
      const cls = (spec.styles && spec.styles[i]) || (i ? "alt" : "");
      curves += `<path class="g-curve ${cls}" d="${curvePath(f, win, X, Y)}"/>`;
      if (f.type) {
        if (spec.labels && spec.labels[i]) { const lx = win.x1 - (win.x1 - win.x0) * 0.12, ly = yAt(f, lx); if (Number.isFinite(ly) && ly < win.y1 && ly > win.y0) dots += `<text class="g-label ${cls}" x="${X(lx) + 6}" y="${Y(ly) - 6}">${esc(spec.labels[i])}</text>`; }
        return;
      }
      const kp = keyPoints(f);
      if (m.axis) lines += `<line class="g-sym" x1="${X(kp.h)}" x2="${X(kp.h)}" y1="${Y(win.y0)}" y2="${Y(win.y1)}"/>`;
      if (m.vertex) dots += `<circle class="g-pt vertex" cx="${X(kp.h)}" cy="${Y(kp.k)}" r="4.2"/>`;
      if (m.xint) for (const x of kp.xs) dots += `<circle class="g-pt xint" cx="${X(x)}" cy="${Y(0)}" r="3.6"/>`;
      if (m.yint) dots += `<circle class="g-pt yint" cx="${X(0)}" cy="${Y(kp.yint)}" r="3.6"/>`;
      if (spec.labels && spec.labels[i]) {
        // label near the right end of the visible curve
        let lx = win.x1 - (win.x1 - win.x0) * 0.08; let ly = yAt(f, lx);
        for (let s = 0; s < 60 && (ly > win.y1 || ly < win.y0); s++) { lx -= (win.x1 - win.x0) / 80; ly = yAt(f, lx); }
        dots += `<text class="g-label ${cls}" x="${X(lx) + 6}" y="${Y(ly)}">${esc(spec.labels[i])}</text>`;
      }
    });
    for (const p of spec.points || []) {
      dots += `<circle class="g-pt given" cx="${X(num(p.x))}" cy="${Y(num(p.y))}" r="4"/>`;
      if (p.label) dots += `<text class="g-label pt" x="${X(num(p.x)) + 7}" y="${Y(num(p.y)) - 7}">${esc(p.label)}</text>`;
    }
    const title = spec.title ? `<title>${esc(spec.title)}</title>` : "";
    return `<svg class="qgraph" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.title || "Graph")}" preserveAspectRatio="xMidYMid meet">${title}
      <defs><clipPath id="${id}"><rect x="${X(win.x0)}" y="${Y(win.y1)}" width="${X(win.x1) - X(win.x0)}" height="${Y(win.y0) - Y(win.y1)}"/></clipPath></defs>
      <rect class="g-bg" x="0" y="0" width="${W}" height="${H}" rx="10"/>
      ${html}<g clip-path="url(#${id})">${lines}${curves}</g>${dots}</svg>`;
  }

  // ───────── tokens inside question text ─────────
  const token = (spec, desc) => `[[graph|${encodeURIComponent(JSON.stringify(spec))}|${String(desc || "graph").replace(/[|\]]/g, " ")}]]`;
  const TOKEN = /\[\[graph\|([^|\]]+)\|([^\]]*)\]\]/g;
  function render(str) {
    return String(str).replace(TOKEN, (_, j, d) => {
      try { const spec = JSON.parse(decodeURIComponent(j)); return `<figure class="qgraph-fig">${svg({ ...spec, title: spec.title || d })}</figure>`; }
      catch { return `<span class="muted">[graph unavailable]</span>`; }
    });
  }
  const describe = (str) => String(str).replace(TOKEN, (_, j, d) => `[graph: ${d}]`);
  const specOf = (str) => { const m = new RegExp(TOKEN.source).exec(String(str)); return m ? JSON.parse(decodeURIComponent(m[1])) : null; };

  // ───────── interactive plotter ─────────
  // opts: { window, value: "v:h,k;p:x,y" | "", onChange(str), disabled, labels: { vertex, point, place, reset } }
  function plotter(el, opts = {}) {
    const win = opts.window || { x0: -8, x1: 8, y0: -8, y1: 8 };
    const W = 360, H = 300;
    const L = Object.assign({ vertex: "Vertex", point: "Point", hintVertex: "Click the grid to place the vertex.", hintPoint: "Now click a second point on the parabola.", ready: "Drag either point to adjust. Arrow keys move the selected point.", reset: "Reset" }, opts.labels || {});
    let v = null, p = null;
    const m = /^v:(-?[\d.]+),(-?[\d.]+)(?:;p:(-?[\d.]+),(-?[\d.]+))?$/.exec(opts.value || "");
    if (m) { v = { x: +m[1], y: +m[2] }; if (m[3] !== undefined) p = { x: +m[3], y: +m[4] }; }
    const f = frame(win, W, H);
    el.classList.add("plotter");
    el.innerHTML = `<svg class="qgraph plot-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="Graph to plot on"><rect class="g-bg" x="0" y="0" width="${W}" height="${H}" rx="10"/>${f.html}<g class="pl-layer"></g></svg>
      <div class="pl-bar"><span class="pl-status" aria-live="polite"></span><button type="button" class="btn btn-ghost btn-sm pl-reset">${esc(L.reset)}</button></div>`;
    const svgEl = el.querySelector("svg"), layer = el.querySelector(".pl-layer"), status = el.querySelector(".pl-status");
    const snap = (val) => Math.round(val);
    const clampX = (x) => Math.max(Math.ceil(win.x0), Math.min(Math.floor(win.x1), x));
    const clampY = (y) => Math.max(Math.ceil(win.y0), Math.min(Math.floor(win.y1), y));
    const toData = (evt) => {
      const pt = svgEl.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
      const q = pt.matrixTransform(svgEl.getScreenCTM().inverse());
      const x = win.x0 + ((q.x - f.P.l) / (W - f.P.l - f.P.r)) * (win.x1 - win.x0);
      const y = win.y0 + (1 - (q.y - f.P.t) / (H - f.P.t - f.P.b)) * (win.y1 - win.y0);
      return { x: clampX(snap(x)), y: clampY(snap(y)) };
    };
    const value = () => (v ? `v:${v.x},${v.y}` + (p ? `;p:${p.x},${p.y}` : "") : "");
    function draw() {
      let s = "";
      if (v && p && p.x !== v.x) {
        const a = (p.y - v.y) / ((p.x - v.x) ** 2);
        s += `<path class="g-curve live" d="${curvePath({ a, b: -2 * a * v.x, c: a * v.x * v.x + v.y }, win, f.X, f.Y)}" clip-path="inset(0)"/>`;
      }
      if (v) s += `<g class="pl-handle vertex" tabindex="${opts.disabled ? -1 : 0}" role="button" data-h="v" aria-label="${esc(L.vertex)} (${fmt(v.x)}, ${fmt(v.y)})"><circle class="hit" cx="${f.X(v.x)}" cy="${f.Y(v.y)}" r="15"/><rect x="${f.X(v.x) - 6}" y="${f.Y(v.y) - 6}" width="12" height="12" rx="2" transform="rotate(45 ${f.X(v.x)} ${f.Y(v.y)})"/></g>`;
      if (p) s += `<g class="pl-handle point" tabindex="${opts.disabled ? -1 : 0}" role="button" data-h="p" aria-label="${esc(L.point)} (${fmt(p.x)}, ${fmt(p.y)})"><circle class="hit" cx="${f.X(p.x)}" cy="${f.Y(p.y)}" r="15"/><circle cx="${f.X(p.x)}" cy="${f.Y(p.y)}" r="6"/></g>`;
      layer.innerHTML = s;
      status.textContent = !v ? L.hintVertex : !p ? `${L.vertex} (${fmt(v.x)}, ${fmt(v.y)}). ${L.hintPoint}` : `${L.vertex} (${fmt(v.x)}, ${fmt(v.y)}) · ${L.point} (${fmt(p.x)}, ${fmt(p.y)}). ${L.ready}`;
    }
    function emit() { draw(); if (opts.onChange) opts.onChange(value()); }
    let drag = null;
    if (!opts.disabled) {
      svgEl.addEventListener("pointerdown", (e) => {
        const h = e.target.closest(".pl-handle");
        if (h) { drag = h.dataset.h; svgEl.setPointerCapture(e.pointerId); e.preventDefault(); return; }
        const d = toData(e);
        if (!v) v = d; else if (!p) { if (d.x === v.x) return; p = d; } else return;
        emit();
      });
      svgEl.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const d = toData(e);
        if (drag === "v") { if (p && d.x === p.x) return; v = d; } else { if (d.x === v.x) return; p = d; }
        draw();
      });
      const end = () => { if (drag) { drag = null; emit(); } };
      svgEl.addEventListener("pointerup", end);
      svgEl.addEventListener("pointercancel", end);
      el.addEventListener("keydown", (e) => {
        const h = e.target.closest && e.target.closest(".pl-handle"); if (!h) return;
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
        if (!d) return;
        e.preventDefault();
        const which = h.dataset.h, cur = which === "v" ? v : p;
        const nx = clampX(cur.x + d[0]), ny = clampY(cur.y + d[1]);
        const other = which === "v" ? p : v;
        if (other && nx === other.x && which === "p") return;
        if (other && nx === other.x && which === "v" && p) return;
        if (which === "v") v = { x: nx, y: ny }; else p = { x: nx, y: ny };
        emit();
        const again = el.querySelector(`.pl-handle[data-h="${which}"]`); if (again) again.focus();
      });
      el.querySelector(".pl-reset").addEventListener("click", () => { v = null; p = null; emit(); });
      // keyboard users can start by focusing the graph and pressing Enter: vertex at the origin
      svgEl.setAttribute("tabindex", "0");
      svgEl.addEventListener("keydown", (e) => {
        if (e.target !== svgEl || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        if (!v) v = { x: clampX(0), y: clampY(0) }; else if (!p) p = { x: clampX(v.x + 1), y: clampY(v.y + 1) };
        emit();
        const hs = el.querySelectorAll(".pl-handle"); if (hs.length) hs[hs.length - 1].focus();
      });
    } else el.querySelector(".pl-reset").hidden = true;
    draw();
    return { value, set(str) { const mm = /^v:(-?[\d.]+),(-?[\d.]+)(?:;p:(-?[\d.]+),(-?[\d.]+))?$/.exec(str || ""); v = mm ? { x: +mm[1], y: +mm[2] } : null; p = mm && mm[3] !== undefined ? { x: +mm[3], y: +mm[4] } : null; draw(); } };
  }

  // ───────── graph builder: construct a parabola on an EMPTY grid (the answer is never drawn before submission) ─────────
  // value "v:h,k;p:x,y|x,y…;c:1" — vertex, any number of plotted points, and whether the learner drew the curve.
  // The axis of symmetry is drawn through the learner's own vertex; the curve (when drawn) goes through the
  // learner's own vertex and points (least-squares a), so it shows THEIR graph, not the key.
  function builder(el, opts = {}) {
    const win = opts.window || { x0: -8, x1: 8, y0: -8, y1: 8 };
    const W = 360, H = 320;
    const L = Object.assign({ vertex: "Vertex", points: "Points", draw: "Draw curve", undraw: "Hide curve", reset: "Reset", tool: "Tool", hintVertex: "Place the vertex first.", hintPoints: "Now plot points on the parabola. Click a point again to remove it.", count: "points", axis: "Axis of symmetry", sel: "Selected" }, opts.labels || {});
    const parse = (str) => {
      const m = /^v:(-?[\d.]+),(-?[\d.]+)(?:;p:([^;]*))?(?:;c:(\d))?$/.exec(str || "");
      if (!m) return { v: null, pts: [], c: false };
      return { v: { x: +m[1], y: +m[2] }, pts: (m[3] || "").split("|").filter(Boolean).map((t) => { const [x, y] = t.split(",").map(Number); return { x, y }; }), c: m[4] === "1" };
    };
    let st = parse(opts.value), tool = st.v ? "points" : "vertex", sel = null;
    const f = frame(win, W, H);
    el.classList.add("plotter", "builder");
    el.innerHTML = `<div class="pl-tools" role="radiogroup" aria-label="${esc(L.tool)}">
        <button type="button" role="radio" data-tool="vertex">${esc(L.vertex)}</button><button type="button" role="radio" data-tool="points">${esc(L.points)}</button>
        <button type="button" class="pl-draw">${esc(L.draw)}</button><button type="button" class="btn btn-ghost btn-sm pl-reset">${esc(L.reset)}</button></div>
      <svg class="qgraph plot-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="Empty grid to graph on" tabindex="0"><rect class="g-bg" x="0" y="0" width="${W}" height="${H}" rx="10"/>${f.html}<g class="pl-layer"></g></svg>
      <div class="pl-bar"><span class="pl-status" aria-live="polite"></span></div>`;
    const svgEl = el.querySelector("svg"), layer = el.querySelector(".pl-layer"), status = el.querySelector(".pl-status");
    const clampX = (x) => Math.max(Math.ceil(win.x0), Math.min(Math.floor(win.x1), x));
    const clampY = (y) => Math.max(Math.ceil(win.y0), Math.min(Math.floor(win.y1), y));
    const toData = (evt) => {
      const pt = svgEl.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
      const q = pt.matrixTransform(svgEl.getScreenCTM().inverse());
      const x = win.x0 + ((q.x - f.P.l) / (W - f.P.l - f.P.r)) * (win.x1 - win.x0);
      const y = win.y0 + (1 - (q.y - f.P.t) / (H - f.P.t - f.P.b)) * (win.y1 - win.y0);
      return { x: clampX(Math.round(x)), y: clampY(Math.round(y)) };
    };
    const value = () => (st.v ? `v:${st.v.x},${st.v.y}` + (st.pts.length ? `;p:${st.pts.map((p) => `${p.x},${p.y}`).join("|")}` : "") + (st.c ? ";c:1" : "") : "");
    const fitA = () => { const o = st.pts.filter((p) => p.x !== st.v.x); const den = o.reduce((s, p) => s + (p.x - st.v.x) ** 4, 0); return den ? o.reduce((s, p) => s + (p.y - st.v.y) * (p.x - st.v.x) ** 2, 0) / den : null; };
    function draw() {
      let s = "";
      if (st.v) s += `<line class="g-sym learner" x1="${f.X(st.v.x)}" x2="${f.X(st.v.x)}" y1="${f.Y(win.y0)}" y2="${f.Y(win.y1)}"><title>${esc(L.axis)}</title></line>`;
      const a = st.v && st.c ? fitA() : null;
      if (a) s += `<path class="g-curve live" d="${curvePath({ a, b: -2 * a * st.v.x, c: a * st.v.x * st.v.x + st.v.y }, win, f.X, f.Y)}"/>`;
      st.pts.forEach((p, i) => { s += `<g class="pl-handle point${sel === i ? " sel" : ""}" tabindex="${opts.disabled ? -1 : 0}" role="button" data-h="p${i}" aria-label="${esc(L.points)} (${fmt(p.x)}, ${fmt(p.y)})"><circle class="hit" cx="${f.X(p.x)}" cy="${f.Y(p.y)}" r="13"/><circle cx="${f.X(p.x)}" cy="${f.Y(p.y)}" r="5.5"/></g>`; });
      if (st.v) s += `<g class="pl-handle vertex${sel === "v" ? " sel" : ""}" tabindex="${opts.disabled ? -1 : 0}" role="button" data-h="v" aria-label="${esc(L.vertex)} (${fmt(st.v.x)}, ${fmt(st.v.y)})"><circle class="hit" cx="${f.X(st.v.x)}" cy="${f.Y(st.v.y)}" r="15"/><rect x="${f.X(st.v.x) - 6}" y="${f.Y(st.v.y) - 6}" width="12" height="12" rx="2" transform="rotate(45 ${f.X(st.v.x)} ${f.Y(st.v.y)})"/></g>`;
      layer.innerHTML = s;
      for (const b of el.querySelectorAll("[data-tool]")) { b.classList.toggle("active", b.dataset.tool === tool); b.setAttribute("aria-checked", String(b.dataset.tool === tool)); }
      const db = el.querySelector(".pl-draw"); db.textContent = st.c ? L.undraw : L.draw; db.disabled = !st.v || !st.pts.length; db.setAttribute("aria-pressed", String(st.c));
      status.textContent = !st.v ? L.hintVertex : `${L.vertex} (${fmt(st.v.x)}, ${fmt(st.v.y)}) · ${st.pts.length} ${L.count}. ${st.pts.length < 2 ? L.hintPoints : ""}`;
    }
    function emit() { draw(); if (opts.onChange) opts.onChange(value()); }
    function place(d) {
      if (tool === "vertex" || !st.v) { st.v = d; st.pts = st.pts.filter((p) => !(p.x === d.x && p.y === d.y)); tool = "points"; sel = "v"; }
      else {
        if (d.x === st.v.x && d.y === st.v.y) return;
        const k = st.pts.findIndex((p) => p.x === d.x && p.y === d.y);
        if (k >= 0) { st.pts.splice(k, 1); sel = null; } else { st.pts.push(d); sel = st.pts.length - 1; }
      }
      emit();
    }
    if (!opts.disabled) {
      let drag = null;
      svgEl.addEventListener("pointerdown", (e) => {
        const h = e.target.closest(".pl-handle");
        if (h && h.dataset.h === "v") { drag = "v"; sel = "v"; svgEl.setPointerCapture(e.pointerId); e.preventDefault(); return; }
        if (h) { const i = Number(h.dataset.h.slice(1)); st.pts.splice(i, 1); sel = null; emit(); return; } // clicking a plotted point removes it
        place(toData(e));
      });
      svgEl.addEventListener("pointermove", (e) => { if (drag !== "v") return; const d = toData(e); st.v = d; draw(); });
      const end = () => { if (drag) { drag = null; emit(); } };
      svgEl.addEventListener("pointerup", end); svgEl.addEventListener("pointercancel", end);
      el.addEventListener("click", (e) => {
        const tb = e.target.closest("[data-tool]"); if (tb) { tool = tb.dataset.tool; draw(); return; }
        if (e.target.closest(".pl-draw")) { st.c = !st.c; emit(); return; }
        if (e.target.closest(".pl-reset")) { st = { v: null, pts: [], c: false }; tool = "vertex"; sel = null; emit(); }
      });
      // keyboard: Enter on the grid places at the cursor; arrows move the cursor or the selected handle; Delete removes
      let cur = { x: clampX(0), y: clampY(0) };
      svgEl.addEventListener("keydown", (e) => {
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
        const h = e.target.closest && e.target.closest(".pl-handle");
        if (d && h) {
          e.preventDefault();
          if (h.dataset.h === "v") st.v = { x: clampX(st.v.x + d[0]), y: clampY(st.v.y + d[1]) };
          else { const i = Number(h.dataset.h.slice(1)); st.pts[i] = { x: clampX(st.pts[i].x + d[0]), y: clampY(st.pts[i].y + d[1]) }; }
          emit(); const again = el.querySelector(`.pl-handle[data-h="${h.dataset.h}"]`); if (again) again.focus(); return;
        }
        if (h && (e.key === "Delete" || e.key === "Backspace") && h.dataset.h !== "v") { e.preventDefault(); st.pts.splice(Number(h.dataset.h.slice(1)), 1); emit(); svgEl.focus(); return; }
        if (e.target !== svgEl) return;
        if (d) { e.preventDefault(); cur = { x: clampX(cur.x + d[0]), y: clampY(cur.y + d[1]) }; status.textContent = `(${fmt(cur.x)}, ${fmt(cur.y)}) — Enter to place`; return; }
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); place({ ...cur }); svgEl.focus(); }
      });
    } else for (const b of el.querySelectorAll(".pl-tools button")) b.hidden = true;
    draw();
    return { value, set(str) { st = parse(str); draw(); } };
  }

  const api = { svg, token, render, describe, specOf, plotter, builder, autoWindow, keyPoints, std };
  root.Graph = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
