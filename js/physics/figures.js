/*
 * PHYSICS FIGURES — SVG diagrams for questions, lessons and tools, drawn from the same PhysModel numbers.
 *   scene   launch point, landing surface, trajectory, optional v₀ arrow, angle, heights, wall/target/points
 *   vector  a velocity vector with its components (signs shown by direction)
 *   graph   x–t, y–t, vx–t, vy–t (from the model) or an unlabeled shape for "which graph?" options
 *   table   a small data table
 * Figures show only GIVEN information: unknowns are labelled "?" and never printed. Colours come from theme tokens
 * (CSS classes .pf-*), so every theme styles them. Each SVG has a text alternative (role="img" + aria-label).
 */
(function (root) {
  "use strict";
  const P = () => root.PhysModel;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const n3 = (x) => P().fmt(x, 3);
  const t = (k, v) => (root.I18N ? root.I18N.t(k, v) : k);
  const arrowDef = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-arrowhead"/></marker></defs>`;
  let uid = 0;

  function frame(xs, ys, W, H, pad) {
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (x1 - x0 < 1e-6) { x0 -= 1; x1 += 1; }
    if (y1 - y0 < 1e-6) { y0 -= 1; y1 += 1; }
    const sx = (W - pad.l - pad.r) / (x1 - x0), sy = (H - pad.t - pad.b) / (y1 - y0), s = Math.min(sx, sy);
    // centred horizontally; anchored to the bottom so spare height collects at the top (callers may crop it)
    const ox = pad.l + ((W - pad.l - pad.r) - s * (x1 - x0)) / 2, oy = pad.b;
    const used = Math.min(H, pad.t + pad.b + s * (y1 - y0));
    return { X: (x) => ox + (x - x0) * s, Y: (y) => H - oy - (y - y0) * s, s, x0, x1, y0, y1, top: H - used, used };
  }

  // ───────── scene ─────────
  function scene(f, opts = {}) {
    const M = P(), W = opts.width || 420, H = opts.height || 240, id = "pfa" + ++uid;
    const p = M.launch({ v0: f.v0, angle: f.angle, h0: f.h0 || 0, yLand: f.yLand || 0 });
    const end = p.ok ? p.tLand : Math.max(p.tApex * 2, 1);
    const pts = M.samples(p, 80, end);
    const extraX = [f.wall ? f.wall.x * 1.15 : 0, f.target ? f.target.x * 1.1 : 0, f.ledge ? f.ledge * 1.3 : 0, f.range ? f.range * 1.08 : 0];
    const xs = [0, ...pts.map((s) => s.x), ...extraX, -0.12 * Math.max(4, p.ok ? p.range : 4)];
    const ys = [0, f.h0 || 0, f.yLand || 0, ...pts.map((s) => s.y), f.wall ? f.wall.h : 0, f.target ? f.target.y + 1 : 0];
    if (Math.abs(f.angle) === 90) { xs.push(-2, 2); }
    const F = frame(xs, ys, W, H, { l: 18, r: 18, t: 22, b: 26 });
    const show = new Set(f.show || []);
    let s = arrowDef(id);
    // ground: launch side (x ≤ 0 region) at h0, landing side at yLand
    const xL = F.x0, xR = F.x1, gy0 = F.Y(Math.min(0, f.yLand || 0, f.h0 || 0));
    if ((f.h0 || 0) > 0) s += `<rect class="pf-ground" x="${F.X(xL)}" y="${F.Y(f.h0)}" width="${F.X(0) - F.X(xL)}" height="${gy0 - F.Y(f.h0) + 26}"/>`;
    const landX = f.yLand > 0 && p.ok ? Math.min(p.range * 0.55, p.range - 0.5) : f.ledge ? f.ledge : 0;
    s += `<rect class="pf-ground" x="${F.X(f.yLand > 0 || f.ledge ? landX : (f.h0 || 0) > 0 ? 0 : xL)}" y="${F.Y(f.yLand || 0)}" width="${F.X(xR) - F.X(f.yLand > 0 || f.ledge ? landX : (f.h0 || 0) > 0 ? 0 : xL)}" height="${gy0 - F.Y(f.yLand || 0) + 26}"/>`;
    if (f.yLand < 0 && false) s += "";
    if (f.wall) s += `<rect class="pf-wall" x="${F.X(f.wall.x) - 4}" y="${F.Y(f.wall.h)}" width="8" height="${F.Y(0) - F.Y(f.wall.h)}"/>${show.has("angle") ? `<text class="pf-lbl" x="${F.X(f.wall.x) + 8}" y="${F.Y(f.wall.h) + 12}">${esc(n3(f.wall.h))} m</text>` : ""}`;
    if (f.target) s += `<g class="pf-target"><line x1="${F.X(f.target.x) - 12}" x2="${F.X(f.target.x) + 12}" y1="${F.Y(f.target.y)}" y2="${F.Y(f.target.y)}"/><circle cx="${F.X(f.target.x)}" cy="${F.Y(f.target.y)}" r="3"/></g>`;
    // trajectory (dashed: the path, not a statement of any number)
    const path = pts.map((q, i) => `${i ? "L" : "M"}${F.X(q.x).toFixed(1)},${F.Y(q.y).toFixed(1)}`).join(" ");
    s += `<path class="pf-path" d="${path}"/>`;
    // launch point and v0 arrow
    const lx = F.X(0), ly = F.Y(f.h0 || 0);
    s += `<circle class="pf-ball" cx="${lx}" cy="${ly}" r="4.5"/>`;
    const L = 44, ang = (f.angle * Math.PI) / 180;
    if (show.has("v0") || show.has("angle")) {
      s += `<line class="pf-vec" x1="${lx}" y1="${ly}" x2="${lx + L * Math.cos(ang)}" y2="${ly - L * Math.sin(ang)}" marker-end="url(#${id})"/>`;
      if (show.has("v0")) s += `<text class="pf-lbl pf-strong" x="${lx + L * Math.cos(ang) + 6}" y="${ly - L * Math.sin(ang) - 4}">v₀ = ${esc(n3(f.v0))} m/s</text>`;
      if (show.has("angle") && Math.abs(f.angle) > 0.5 && Math.abs(f.angle) < 89.5) {
        const r = 22, a1 = -ang;
        s += `<line class="pf-guide" x1="${lx}" y1="${ly}" x2="${lx + 56}" y2="${ly}"/><path class="pf-arc" d="M${lx + r},${ly} A${r},${r} 0 0 ${f.angle > 0 ? 0 : 1} ${lx + r * Math.cos(a1)},${ly + r * Math.sin(a1)}"/><text class="pf-lbl" x="${lx + r + 6}" y="${ly + (f.angle > 0 ? -5 : 14)}">${esc(Math.round(Math.abs(f.angle) * 10) / 10)}°</text>`;
      }
    }
    if (show.has("h0") && (f.h0 || 0) > 0) s += `<line class="pf-dim" x1="${lx - 10}" x2="${lx - 10}" y1="${ly}" y2="${F.Y(0)}"/><text class="pf-lbl" x="${lx - 14}" y="${(ly + F.Y(0)) / 2}" text-anchor="end">${esc(n3(f.h0))} m</text>`;
    if (f.yLand > 0 && show.has("target") === false && f.roof) s += "";
    if (f.yLand > 0) s += `<text class="pf-lbl" x="${F.X(landX) + 4}" y="${F.Y(f.yLand) + 14}">${esc(n3(f.yLand))} m</text>`;
    if (show.has("range") && f.range) s += `<line class="pf-dim" x1="${lx}" x2="${F.X(f.range)}" y1="${F.Y(Math.min(0, f.yLand || 0)) + 14}" y2="${F.Y(Math.min(0, f.yLand || 0)) + 14}"/><text class="pf-lbl" x="${(lx + F.X(f.range)) / 2}" y="${F.Y(Math.min(0, f.yLand || 0)) + 24}" text-anchor="middle">${esc(n3(f.range))} m</text>`;
    // labelled points (equal time steps) and a marked moment
    for (const q of f.points || []) { const st = M.stateAt(p, q.t); s += `<circle class="pf-pt" cx="${F.X(st.x)}" cy="${F.Y(st.y)}" r="4"/><text class="pf-lbl pf-strong" x="${F.X(st.x) + 6}" y="${F.Y(st.y) - 6}">${esc(q.label)}</text>`; }
    if (f.mark !== undefined) { const st = M.stateAt(p, f.mark); s += `<circle class="pf-mark" cx="${F.X(st.x)}" cy="${F.Y(st.y)}" r="5"/><text class="pf-lbl" x="${F.X(st.x) + 7}" y="${F.Y(st.y) - 7}">t = ${esc(n3(f.mark))} s</text>`; }
    const label = t("pf.alt.scene", { v: n3(f.v0), a: Math.round(f.angle * 10) / 10, h: n3(f.h0 || 0), y: n3(f.yLand || 0) });
    const top = Math.max(0, F.top - 18);
    return `<svg class="pf-svg" viewBox="0 ${top} ${W} ${H - top}" role="img" aria-label="${esc(label)}">${s}</svg>`;
  }

  // ───────── vector with components ─────────
  function vector(f, opts = {}) {
    const W = opts.width || 260, H = opts.height || 200, id = "pfv" + ++uid;
    const a = (f.angle * Math.PI) / 180, cx = 70, cy = f.angle >= 0 ? H - 46 : 50, L = Math.min(150, W - 110);
    const ex = cx + L * Math.cos(a), ey = cy - L * Math.sin(a);
    const show = new Set(f.show || []);
    const comps = P().components(f.mag, f.angle);
    let s = arrowDef(id);
    s += `<line class="pf-axis" x1="20" x2="${W - 10}" y1="${cy}" y2="${cy}"/><line class="pf-axis" x1="${cx}" x2="${cx}" y1="10" y2="${H - 10}"/><text class="pf-lbl" x="${W - 16}" y="${cy - 6}">+x</text><text class="pf-lbl" x="${cx + 5}" y="20">+y</text>`;
    s += `<line class="pf-comp" x1="${cx}" y1="${cy}" x2="${ex}" y2="${cy}" marker-end="url(#${id})"/><line class="pf-comp" x1="${ex}" y1="${cy}" x2="${ex}" y2="${ey}" marker-end="url(#${id})"/>`;
    s += `<line class="pf-vec" x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" marker-end="url(#${id})"/>`;
    s += `<text class="pf-lbl" x="${(cx + ex) / 2}" y="${cy + (f.angle >= 0 ? 16 : -8)}" text-anchor="middle">vₓ = ${show.has("vx") ? esc(n3(comps.x)) + " m/s" : "?"}</text>`;
    s += `<text class="pf-lbl" x="${ex + 6}" y="${(cy + ey) / 2}">v_y = ${show.has("vy") ? esc(n3(comps.y)) + " m/s" : "?"}</text>`;
    s += `<text class="pf-lbl pf-strong" x="${(cx + ex) / 2 - 10}" y="${(cy + ey) / 2 - 8}" text-anchor="end">${show.has("mag") ? `v = ${esc(n3(f.mag))} ${esc(f.unit || "m/s")}` : "v"}</text>`;
    if (show.has("angle") || show.has("mag")) { const r = 26; s += `<path class="pf-arc" d="M${cx + r},${cy} A${r},${r} 0 0 ${f.angle >= 0 ? 0 : 1} ${cx + r * Math.cos(-a)},${cy + r * Math.sin(-a)}"/><text class="pf-lbl" x="${cx + r + 5}" y="${cy + (f.angle >= 0 ? -6 : 14)}">${show.has("angle") || show.has("mag") ? esc(Math.round(Math.abs(f.angle) * 10) / 10) + "°" : "θ"}</text>`; }
    const label = t("pf.alt.vector", { v: n3(f.mag), a: Math.round(f.angle * 10) / 10 });
    return `<svg class="pf-svg pf-vector" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${s}</svg>`;
  }

  // ───────── motion graphs ─────────
  const SERIES = {
    x: { get: (s) => s.x, unit: "m", name: "x" }, y: { get: (s) => s.y, unit: "m", name: "y" },
    vx: { get: (s) => s.vx, unit: "m/s", name: "vₓ" }, vy: { get: (s) => s.vy, unit: "m/s", name: "v_y" },
    ax: { get: (s) => s.ax, unit: "m/s²", name: "aₓ" }, ay: { get: (s) => s.ay, unit: "m/s²", name: "a_y" },
  };
  function graph(f, opts = {}) {
    const W = opts.width || (f.small ? 170 : 380), H = opts.height || (f.small ? 110 : 220);
    const pad = { l: f.small ? 22 : 54, r: 12, t: 12, b: f.small ? 18 : 34 };
    if (f.shape) {
      // a generic shape (no numbers): used for "which graph shows…?" options
      const shapes = { "rise-line": [[0, 0.1], [1, 0.9]], flat: [[0, 0.55], [1, 0.55]], "fall-line": [[0, 0.9], [1, 0.1]] };
      const X = (u) => pad.l + u * (W - pad.l - pad.r), Y = (v) => H - pad.b - v * (H - pad.t - pad.b);
      let d;
      if (f.shape === "arch") d = Array.from({ length: 31 }, (_, i) => { const u = i / 30; return `${i ? "L" : "M"}${X(u).toFixed(1)},${Y(0.1 + 3.2 * u * (1 - u)).toFixed(1)}`; }).join(" ");
      else d = `M${X(shapes[f.shape][0][0])},${Y(shapes[f.shape][0][1])} L${X(shapes[f.shape][1][0])},${Y(shapes[f.shape][1][1])}`;
      return `<svg class="pf-svg pf-graph small" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("pf.alt.shape." + f.shape))}"><line class="pf-axis" x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/><line class="pf-axis" x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${H - pad.b}"/><text class="pf-lbl" x="${W - pad.r}" y="${H - 4}" text-anchor="end">t</text><path class="pf-curve" d="${d}"/></svg>`;
    }
    const M = P(), p = M.launch(f.p), T = p.ok ? p.tLand : 2 * p.tApex, ser = SERIES[f.series];
    const data = M.samples(p, 100, T).map((s) => [s.t, ser.get(s)]);
    const vals = data.map((d) => d[1]);
    let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
    const X = (x) => pad.l + (x / T) * (W - pad.l - pad.r), Y = (y) => H - pad.b - ((y - lo) / (hi - lo)) * (H - pad.t - pad.b);
    let s = `<line class="pf-axis" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(0)}" y2="${Y(0)}"/><line class="pf-axis" x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${H - pad.b}"/>`;
    if (f.ticks !== false) {
      const step = niceStep(hi - lo);
      for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) s += `<line class="pf-grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="pf-tick" x="${pad.l - 5}" y="${Y(v) + 3}" text-anchor="end">${esc(n3(v))}</text>`;
      const ts = niceStep(T);
      for (let v = ts; v <= T + 1e-9; v += ts) s += `<text class="pf-tick" x="${X(v)}" y="${H - pad.b + 13}" text-anchor="middle">${esc(n3(v))}</text>`;
    }
    s += `<text class="pf-lbl" x="${W - pad.r}" y="${H - 4}" text-anchor="end">t (s)</text><text class="pf-lbl" x="6" y="${pad.t + 4}">${esc(ser.name)} (${esc(ser.unit)})</text>`;
    s += `<path class="pf-curve" d="${data.map((d, i) => `${i ? "L" : "M"}${X(d[0]).toFixed(1)},${Y(d[1]).toFixed(1)}`).join(" ")}"/>`;
    return `<svg class="pf-svg pf-graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("pf.alt.graph", { s: ser.name, u: ser.unit, T: n3(T) }))}">${s}</svg>`;
  }
  function niceStep(span) { const raw = span / 4, p10 = Math.pow(10, Math.floor(Math.log10(raw))); const m = raw / p10; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p10; }

  function table(f) {
    return `<table class="pf-table"><thead><tr>${f.head.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${f.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  function render(f, opts) {
    if (!f) return "";
    if (f.type === "scene") return scene(f, opts);
    if (f.type === "vector") return vector(f, opts);
    if (f.type === "graph") return graph(f, opts);
    if (f.type === "table") return table(f, opts);
    return "";
  }
  root.PhysFig = { render, scene, vector, graph, table, frame, niceStep, SERIES };
})(typeof window !== "undefined" ? window : globalThis);
