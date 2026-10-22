/*
 * PHYSICS TOOLS — interactive, deterministic models (no randomness; Goose Mode effects only touch the page around them).
 *   explorer  Projectile Explorer: speed, angle, launch height, landing height, g; play/pause/step/reset, scrub to any
 *             moment, mark points, velocity vector and components, ghost of the previous path, predict-then-reveal
 *   graphs    Motion Graph Lab: x–t, y–t, vₓ–t, v_y–t (or all four); inspect any moment (value, slope, area under
 *             velocity graphs), sketch a prediction and compare, data table alternative
 *   vector    Vector visualizer: drag the tip or use the sliders; components with signs
 * Every number comes from PhysModel.launch / stateAt — the same functions behind the questions and answer keys.
 * mount(kind, el, opts) → { unmount() } removes listeners and stops animation frames.
 */
(function () {
  "use strict";
  const M = () => window.PhysModel;
  const SKEY = "campfire-prep.phys.tools.v1";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const load = () => { try { return { v0: 18, angle: 40, h0: 0, yLand: 0, g: 9.81, mag: 15, vang: 35, ...JSON.parse(localStorage.getItem(SKEY) || "{}") }; } catch { return { v0: 18, angle: 40, h0: 0, yLand: 0, g: 9.81, mag: 15, vang: 35 }; } };
  const save = (p) => { try { localStorage.setItem(SKEY, JSON.stringify(p)); } catch { /* storage off */ } };
  const f3 = (x) => M().fmt(x, 3);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let uid = 0;

  const slider = (id, label, val, min, max, step, unit, t) => `<label class="pt-ctl"><span class="pt-l">${esc(t(label))}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" aria-describedby="${id}-n"/><span class="pt-num"><input type="number" id="${id}-n" min="${min}" max="${max}" step="${step}" value="${val}" aria-label="${esc(t(label))}"/> ${esc(unit)}</span></label>`;
  const G_OPTS = [[9.81, "pt.g.earth"], [1.62, "pt.g.moon"], [3.72, "pt.g.mars"], [24.8, "pt.g.jupiter"]];

  // ───────── Projectile Explorer ─────────
  function explorer(el, opts) {
    const t = opts.t, P = load(), id = "pe" + ++uid;
    let tt = 0, playing = false, raf = 0, last = 0, ghost = null, marks = [], predict = { on: false, qty: "range", value: "", revealed: false }, showComp = true;
    el.innerHTML = `<div class="pt-explorer${opts.compact ? " compact" : ""}">
      <div class="pt-controls" role="group" aria-label="${esc(t("pt.params"))}">
        ${slider(id + "-v", "pt.v0", P.v0, 0, 40, 0.5, "m/s", t)}${slider(id + "-a", "pt.angle", P.angle, -80, 85, 1, "°", t)}${slider(id + "-h", "pt.h0", P.h0, 0, 50, 0.5, "m", t)}${slider(id + "-y", "pt.yLand", P.yLand, -0, 40, 0.5, "m", t)}
        <label class="pt-ctl"><span class="pt-l">${esc(t("pt.g"))}</span><select id="${id}-g" class="text-input">${G_OPTS.map(([g, k]) => `<option value="${g}" ${Math.abs(g - P.g) < 1e-9 ? "selected" : ""}>${esc(t(k))} (${g} m/s²)</option>`).join("")}</select></label>
        <label class="pt-check"><input type="checkbox" id="${id}-c" checked/> ${esc(t("pt.showComp"))}</label>
      </div>
      <div class="pt-stage"><div class="pt-svg" id="${id}-s"></div>
        <div class="pt-time" role="group" aria-label="${esc(t("pt.time"))}"><button type="button" class="btn btn-sm btn-primary" id="${id}-play">${esc(t("pt.play"))}</button><button type="button" class="btn btn-sm btn-secondary" id="${id}-step">${esc(t("pt.step"))}</button><button type="button" class="btn btn-sm btn-quiet" id="${id}-reset">${esc(t("pt.reset"))}</button>
          <label class="pt-scrub"><span class="sr-only">${esc(t("pt.scrub"))}</span><input type="range" id="${id}-t" min="0" max="1" step="0.001" value="0" aria-label="${esc(t("pt.scrub"))}"/></label><button type="button" class="btn btn-sm btn-quiet" id="${id}-mark">${esc(t("pt.mark"))}</button></div>
        <p class="pt-msg" id="${id}-msg" role="status" aria-live="polite"></p>
      </div>
      <div class="pt-read"><h3>${esc(t("pt.now"))}</h3><dl class="pt-dl" id="${id}-now"></dl><h3>${esc(t("pt.whole"))}</h3><dl class="pt-dl" id="${id}-sum"></dl><ul class="pt-marks" id="${id}-marks"></ul>
        ${opts.compact ? "" : `<div class="pt-predict"><h3>${esc(t("pt.predict"))}</h3><p class="faint small">${esc(t("pt.predict.d"))}</p>
          <label class="pt-check"><input type="checkbox" id="${id}-pon"/> ${esc(t("pt.predict.on"))}</label>
          <div class="pt-prow"><select id="${id}-pq" class="text-input">${["range", "hmax", "tof"].map((k) => `<option value="${k}">${esc(t("pt.q." + k))}</option>`).join("")}</select><input type="text" inputmode="decimal" id="${id}-pv" class="text-input" placeholder="${esc(t("pt.yourGuess"))}" aria-label="${esc(t("pt.yourGuess"))}"/><button type="button" class="btn btn-sm btn-secondary" id="${id}-prev">${esc(t("pt.reveal"))}</button></div><p class="pt-presult" id="${id}-pres" role="status" aria-live="polite"></p></div>`}
      </div></div>`;
    const q = (s) => el.querySelector("#" + id + s);
    const model = () => M().launch({ v0: P.v0, angle: P.angle, h0: P.h0, yLand: P.yLand, g: P.g });
    const Tend = (p) => (p.ok ? p.tLand : Math.max(2 * p.tApex, 0.5));
    function draw() {
      const p = model(), T = Tend(p), now = M().stateAt(p, Math.min(tt, T));
      const pts = M().samples(p, 120, T);
      const xs = [0, ...pts.map((s) => s.x), ghost ? ghost.maxX : 0, -2], ys = [0, P.h0, P.yLand, ...pts.map((s) => s.y), ghost ? ghost.maxY : 0];
      const W = opts.compact ? 460 : 560, H = opts.compact ? 260 : 320;
      const F = window.PhysFig.frame(xs, ys, W, H, { l: 26, r: 18, t: 22, b: 28 });
      const hide = predict.on && !predict.revealed;
      let s = `<defs><marker id="${id}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-arrowhead"/></marker></defs>`;
      // grid every nice step
      const step = window.PhysFig.niceStep(Math.max(F.x1 - F.x0, F.y1 - F.y0));
      for (let x = Math.ceil(F.x0 / step) * step; x <= F.x1; x += step) s += `<line class="pf-grid" x1="${F.X(x)}" x2="${F.X(x)}" y1="${F.Y(F.y0)}" y2="${F.Y(F.y1)}"/><text class="pf-tick" x="${F.X(x)}" y="${H - 8}" text-anchor="middle">${f3(x)}</text>`;
      for (let y = Math.ceil(F.y0 / step) * step; y <= F.y1; y += step) s += `<line class="pf-grid" x1="${F.X(F.x0)}" x2="${F.X(F.x1)}" y1="${F.Y(y)}" y2="${F.Y(y)}"/><text class="pf-tick" x="6" y="${F.Y(y) + 3}">${f3(y)}</text>`;
      // ground: launch block and landing surface
      if (P.h0 > 0) s += `<rect class="pf-ground" x="${F.X(F.x0)}" y="${F.Y(P.h0)}" width="${F.X(0) - F.X(F.x0)}" height="${F.Y(F.y0) - F.Y(P.h0) + 30}"/>`;
      const lx = p.ok && P.yLand > 0 ? p.range * 0.6 : 0;
      s += `<rect class="pf-ground" x="${F.X(P.yLand > 0 ? lx : P.h0 > 0 ? 0 : F.x0)}" y="${F.Y(P.yLand)}" width="${F.X(F.x1) - F.X(P.yLand > 0 ? lx : P.h0 > 0 ? 0 : F.x0)}" height="${F.Y(F.y0) - F.Y(P.yLand) + 30}"/>`;
      if (ghost) s += `<path class="pt-ghost" d="${ghost.d(F)}"/>`;
      const upto = hide ? pts.filter((q2) => q2.t <= tt) : pts;
      s += `<path class="pf-path" d="${pts.map((q2, i) => `${i ? "L" : "M"}${F.X(q2.x).toFixed(1)},${F.Y(q2.y).toFixed(1)}`).join(" ")}" ${hide ? 'style="opacity:0"' : ""}/>`;
      s += `<path class="pt-done" d="${upto.filter((q2) => q2.t <= tt + 1e-9).map((q2, i) => `${i ? "L" : "M"}${F.X(q2.x).toFixed(1)},${F.Y(q2.y).toFixed(1)}`).join(" ")}"/>`;
      if (!hide && p.vy > 0) { const a = M().stateAt(p, p.tApex); s += `<circle class="pt-apex" cx="${F.X(a.x)}" cy="${F.Y(a.y)}" r="3.5"/><text class="pf-lbl" x="${F.X(a.x)}" y="${F.Y(a.y) - 8}" text-anchor="middle">${esc(t("pt.top"))}</text>`; }
      if (!hide && p.ok) s += `<circle class="pt-land" cx="${F.X(p.range)}" cy="${F.Y(P.yLand)}" r="4"/>`;
      for (const m of marks) { const st = M().stateAt(p, m); if (m <= T) s += `<circle class="pf-pt" cx="${F.X(st.x)}" cy="${F.Y(st.y)}" r="3.5"/>`; }
      // ball and velocity at the current moment (arrow length ∝ speed)
      const k = 2.2 * (40 / Math.max(10, P.v0));
      const bx = F.X(now.x), by = F.Y(now.y);
      if (showComp) s += `<line class="pf-comp" x1="${bx}" y1="${by}" x2="${bx + now.vx * k}" y2="${by}" marker-end="url(#${id}-ah)"/><line class="pf-comp" x1="${bx}" y1="${by}" x2="${bx}" y2="${by - now.vy * k}" marker-end="url(#${id}-ah)"/>`;
      s += `<line class="pf-vec" x1="${bx}" y1="${by}" x2="${bx + now.vx * k}" y2="${by - now.vy * k}" marker-end="url(#${id}-ah)"/><circle class="pf-ball" cx="${bx}" cy="${by}" r="6"/>`;
      q("-s").innerHTML = `<svg class="pf-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("pt.alt", { t: f3(now.t), x: f3(now.x), y: f3(now.y) }))}">${s}</svg>`;
      const dl = (rows) => rows.map(([k2, v]) => `<div><dt>${esc(t(k2))}</dt><dd>${v}</dd></div>`).join("");
      q("-now").innerHTML = dl([["pt.r.t", `${f3(now.t)} s`], ["pt.r.x", `${f3(now.x)} m`], ["pt.r.y", `${f3(now.y)} m`], ["pt.r.vx", `${f3(now.vx)} m/s`], ["pt.r.vy", `${f3(now.vy)} m/s`], ["pt.r.speed", `${f3(now.speed)} m/s`]]);
      q("-sum").innerHTML = hide ? `<p class="faint small">${esc(t("pt.hidden"))}</p>` : p.ok ? dl([["pt.q.tof", `${f3(p.tLand)} s`], ["pt.q.range", `${f3(p.range)} m`], ["pt.q.hmax", `${f3(p.yMax)} m`], ["pt.r.impact", `${f3(p.impact.speed)} m/s, ${f3(p.impact.angleBelow)}° ${esc(t("pt.below"))}`]]) : `<p class="pt-warn">${esc(t("pt.never"))}</p>`;
      q("-marks").innerHTML = marks.map((m, i) => { const st = M().stateAt(p, m); return `<li>${esc(t("pt.markN", { n: i + 1 }))}: t = ${f3(m)} s · (${f3(st.x)}, ${f3(st.y)}) m · v_y = ${f3(st.vy)} m/s <button type="button" class="icon-btn" data-pt-unmark="${i}" aria-label="${esc(t("pt.unmark"))}">×</button></li>`; }).join("");
      const sc = q("-t"); sc.max = String(T); sc.value = String(Math.min(tt, T));
      q("-play").textContent = t(playing ? "pt.pause" : "pt.play");
      q("-msg").textContent = !p.ok ? t("pt.never") : "";
    }
    function frame(ts) {
      if (!playing) return;
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      const T = Tend(model());
      tt = Math.min(T, tt + dt);
      if (tt >= T) playing = false;
      draw();
      if (playing) raf = requestAnimationFrame(frame);
    }
    function setPlaying(on) {
      playing = on; cancelAnimationFrame(raf);
      const T = Tend(model());
      if (on && tt >= T - 1e-9) tt = 0;
      if (on && reduced()) { tt = T; playing = false; draw(); return; }
      if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
      draw();
    }
    function snapGhost() { const p = model(), pts = M().samples(p, 80, Tend(p)); ghost = { maxX: Math.max(...pts.map((s) => s.x)), maxY: Math.max(...pts.map((s) => s.y)), d: (F) => pts.map((s, i) => `${i ? "L" : "M"}${F.X(s.x).toFixed(1)},${F.Y(s.y).toFixed(1)}`).join(" ") }; }
    const bind = (key, prop) => {
      const r = q(key), n = q(key + "-n");
      const set = (v) => { const x = Number(v); if (!Number.isFinite(x)) return; P[prop] = Math.max(Number(r.min), Math.min(Number(r.max), x)); r.value = n.value = P[prop]; save(P); tt = Math.min(tt, Tend(model())); predict.revealed = false; const pr = q("-pres"); if (pr) pr.textContent = ""; draw(); };
      const start = () => snapGhost();
      r.addEventListener("pointerdown", start); r.addEventListener("keydown", start, { once: false }); n.addEventListener("focus", start);
      r.addEventListener("input", () => set(r.value)); n.addEventListener("change", () => set(n.value));
    };
    bind("-v", "v0"); bind("-a", "angle"); bind("-h", "h0"); bind("-y", "yLand");
    q("-g").addEventListener("change", (e) => { snapGhost(); P.g = Number(e.target.value); save(P); draw(); });
    q("-c").addEventListener("change", (e) => { showComp = e.target.checked; draw(); });
    q("-play").addEventListener("click", () => setPlaying(!playing));
    q("-step").addEventListener("click", () => { setPlaying(false); tt = Math.min(Tend(model()), tt + 0.1); draw(); });
    q("-reset").addEventListener("click", () => { setPlaying(false); tt = 0; marks = []; draw(); });
    q("-t").addEventListener("input", (e) => { setPlaying(false); tt = Number(e.target.value); draw(); });
    q("-mark").addEventListener("click", () => { if (marks.length < 6) marks.push(tt); draw(); });
    el.addEventListener("click", (e) => { const u = e.target.closest("[data-pt-unmark]"); if (u) { marks.splice(Number(u.dataset.ptUnmark), 1); draw(); } });
    if (!opts.compact) {
      q("-pon").addEventListener("change", (e) => { predict.on = e.target.checked; predict.revealed = false; q("-pres").textContent = ""; draw(); });
      q("-prev").addEventListener("click", () => {
        const p = model(), guess = M().parseNumber(q("-pv").value), k2 = q("-pq").value;
        const actual = !p.ok ? NaN : k2 === "range" ? p.range : k2 === "hmax" ? p.yMax : p.tLand;
        predict.revealed = true;
        q("-pres").textContent = !Number.isFinite(actual) ? t("pt.never") : !Number.isFinite(guess) ? t("pt.actual", { v: f3(actual) }) : t("pt.compare", { g: f3(guess), v: f3(actual), d: f3(Math.abs(guess - actual) / Math.abs(actual) * 100) });
        draw();
      });
    }
    draw();
    return { unmount() { playing = false; cancelAnimationFrame(raf); el.innerHTML = ""; }, state: () => ({ P: { ...P }, t: tt, playing }) };
  }

  // ───────── Motion Graph Lab ─────────
  function graphs(el, opts) {
    const t = opts.t, P = load(), id = "pg" + ++uid;
    let series = "vy", tt = 0, all = false, sketch = null, showTable = false;
    const SER = ["x", "y", "vx", "vy"];
    el.innerHTML = `<div class="pt-graphs">
      <div class="pt-controls" role="group" aria-label="${esc(t("pt.params"))}">${slider(id + "-v", "pt.v0", P.v0, 0, 40, 0.5, "m/s", t)}${slider(id + "-a", "pt.angle", P.angle, -80, 85, 1, "°", t)}${slider(id + "-h", "pt.h0", P.h0, 0, 50, 0.5, "m", t)}</div>
      <div class="pt-gmain">
        <div class="segmented" role="radiogroup" aria-label="${esc(t("pt.graph"))}" id="${id}-sel">${SER.map((k) => `<button type="button" role="radio" data-s="${k}">${esc(t("pt.s." + k))}</button>`).join("")}<button type="button" role="radio" data-s="all">${esc(t("pt.s.all"))}</button></div>
        <div class="pt-gsvg" id="${id}-g"></div>
        <label class="pt-scrub"><span class="pt-l">${esc(t("pt.scrub"))}</span><input type="range" id="${id}-t" min="0" max="1" step="0.001" value="0"/></label>
        <dl class="pt-dl" id="${id}-read"></dl>
        <div class="pt-gbtns"><button type="button" class="btn btn-sm btn-secondary" id="${id}-sk">${esc(t("pt.sketch"))}</button><button type="button" class="btn btn-sm btn-quiet" id="${id}-tb">${esc(t("pt.table"))}</button></div>
        <p class="pt-presult" id="${id}-sr" role="status" aria-live="polite"></p><div id="${id}-tbl"></div>
      </div></div>`;
    const q = (s) => el.querySelector("#" + id + s);
    const model = () => M().launch({ v0: P.v0, angle: P.angle, h0: P.h0, yLand: 0, g: P.g });
    const val = (s, k) => ({ x: s.x, y: s.y, vx: s.vx, vy: s.vy }[k]);
    const UNIT = { x: "m", y: "m", vx: "m/s", vy: "m/s" };
    const SLOPE = { x: (s) => [s.vx, "m/s"], y: (s) => [s.vy, "m/s"], vx: () => [0, "m/s²"], vy: (s) => [s.ay, "m/s²"] };
    function plot(k, W, H, interactive) {
      const p = model(), T = p.ok ? p.tLand : Math.max(1, 2 * p.tApex), data = M().samples(p, 120, T);
      const vals = data.map((s) => val(s, k)); let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals); if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
      const pad = { l: 46, r: 12, t: 14, b: 30 };
      const X = (x) => pad.l + (x / T) * (W - pad.l - pad.r), Y = (y) => H - pad.b - ((y - lo) / (hi - lo)) * (H - pad.t - pad.b);
      const step = window.PhysFig.niceStep(hi - lo), ts = window.PhysFig.niceStep(T);
      let s = "";
      for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) s += `<line class="pf-grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="pf-tick" x="${pad.l - 4}" y="${Y(v) + 3}" text-anchor="end">${f3(v)}</text>`;
      for (let v = 0; v <= T + 1e-9; v += ts) s += `<text class="pf-tick" x="${X(v)}" y="${H - pad.b + 13}" text-anchor="middle">${f3(v)}</text>`;
      s += `<line class="pf-axis" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(0)}" y2="${Y(0)}"/><line class="pf-axis" x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${H - pad.b}"/>`;
      s += `<text class="pf-lbl" x="${W - pad.r}" y="${H - 4}" text-anchor="end">t (s)</text><text class="pf-lbl" x="4" y="${pad.t - 2}">${esc(t("pt.s." + k))} (${UNIT[k]})</text>`;
      const reveal = !(sketch && sketch.k === k && !sketch.revealed);
      const cur = M().stateAt(p, Math.min(tt, T));
      if (reveal && (k === "vx" || k === "vy")) { // area under the velocity graph up to t = displacement
        const upto = data.filter((d) => d.t <= tt);
        if (upto.length > 1) s += `<path class="pt-area" d="M${X(0)},${Y(0)} ${upto.map((d) => `L${X(d.t).toFixed(1)},${Y(val(d, k)).toFixed(1)}`).join(" ")} L${X(upto[upto.length - 1].t)},${Y(0)} Z"/>`;
      }
      if (reveal) s += `<path class="pf-curve" d="${data.map((d, i) => `${i ? "L" : "M"}${X(d.t).toFixed(1)},${Y(val(d, k)).toFixed(1)}`).join(" ")}"/>`;
      if (sketch && sketch.k === k) s += sketch.pts.map((pt) => `<circle class="pt-sk" cx="${X(pt[0])}" cy="${Y(pt[1])}" r="4"/>`).join("") + (sketch.pts.length > 1 ? `<path class="pt-skline" d="${sketch.pts.slice().sort((a, b) => a[0] - b[0]).map((pt, i) => `${i ? "L" : "M"}${X(pt[0])},${Y(pt[1])}`).join(" ")}"/>` : "");
      if (reveal) { const [sl] = SLOPE[k](cur); const x0 = X(cur.t), y0 = Y(val(cur, k)); const dtp = T * 0.12; s += `<line class="pt-tangent" x1="${X(Math.max(0, cur.t - dtp))}" y1="${Y(val(cur, k) - sl * Math.min(dtp, cur.t))}" x2="${X(Math.min(T, cur.t + dtp))}" y2="${Y(val(cur, k) + sl * Math.min(dtp, T - cur.t))}"/><circle class="pf-mark" cx="${x0}" cy="${y0}" r="4.5"/>`; }
      return { html: `<svg class="pf-svg pt-graph${interactive ? " interactive" : ""}" viewBox="0 0 ${W} ${H}" data-k="${k}" role="img" aria-label="${esc(t("pf.alt.graph", { s: t("pt.s." + k), u: UNIT[k], T: f3(T) }))}">${s}</svg>`, T, inv: (px, py) => [((px - pad.l) / (W - pad.l - pad.r)) * T, lo + ((H - pad.b - py) / (H - pad.t - pad.b)) * (hi - lo)] };
    }
    let invs = {};
    function draw() {
      const p = model(), T = p.ok ? p.tLand : Math.max(1, 2 * p.tApex), cur = M().stateAt(p, Math.min(tt, T));
      for (const b of el.querySelectorAll(`#${id}-sel [data-s]`)) { const on = all ? b.dataset.s === "all" : b.dataset.s === series; b.classList.toggle("active", on); b.setAttribute("aria-checked", String(on)); }
      invs = {};
      if (all) q("-g").innerHTML = `<div class="pt-grid4">${SER.map((k) => { const r = plot(k, 300, 180, false); invs[k] = r.inv; return r.html; }).join("")}</div>`;
      else { const r = plot(series, 600, 300, true); invs[series] = r.inv; q("-g").innerHTML = r.html; }
      const sc = q("-t"); sc.max = String(T); sc.value = String(Math.min(tt, T));
      const k = series, [sl, su] = SLOPE[k](cur);
      const area = k === "vx" ? cur.x : k === "vy" ? cur.y - P.h0 : null;
      q("-read").innerHTML = [["pt.r.t", `${f3(cur.t)} s`], ["pt.value", `${f3(val(cur, k))} ${UNIT[k]}`], ["pt.slope", `${f3(sl)} ${su}`], ...(area !== null ? [["pt.area", `${f3(area)} m`]] : [])].map(([a, b]) => `<div><dt>${esc(t(a))}</dt><dd>${b}</dd></div>`).join("");
      q("-sk").textContent = t(sketch && sketch.k === series && !sketch.revealed ? "pt.revealSketch" : "pt.sketch");
      if (showTable) { const data = M().samples(p, 10, T); q("-tbl").innerHTML = `<table class="pf-table"><caption>${esc(t("pt.s." + k))}</caption><thead><tr><th scope="col">t (s)</th><th scope="col">${esc(t("pt.s." + k))} (${UNIT[k]})</th></tr></thead><tbody>${data.map((d) => `<tr><td>${f3(d.t)}</td><td>${f3(val(d, k))}</td></tr>`).join("")}</tbody></table>`; } else q("-tbl").innerHTML = "";
    }
    const bind = (key, prop) => { const r = q(key), n = q(key + "-n"); const set = (v) => { const x = Number(v); if (!Number.isFinite(x)) return; P[prop] = Math.max(Number(r.min), Math.min(Number(r.max), x)); r.value = n.value = P[prop]; save(P); sketch = sketch && !sketch.revealed ? sketch : null; draw(); }; r.addEventListener("input", () => set(r.value)); n.addEventListener("change", () => set(n.value)); };
    bind("-v", "v0"); bind("-a", "angle"); bind("-h", "h0");
    q("-sel").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (!b) return; if (b.dataset.s === "all") all = true; else { all = false; series = b.dataset.s; } draw(); });
    q("-t").addEventListener("input", (e) => { tt = Number(e.target.value); draw(); });
    q("-g").addEventListener("click", (e) => {
      const svg = e.target.closest("svg.interactive"); if (!svg) return;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      const [tx, vy] = invs[series](loc.x, loc.y);
      if (sketch && sketch.k === series && !sketch.revealed) { sketch.pts.push([Math.max(0, tx), vy]); draw(); return; }
      tt = Math.max(0, tx); draw();
    });
    q("-sk").addEventListener("click", () => {
      if (!sketch || sketch.k !== series || sketch.revealed) { sketch = { k: series, pts: [], revealed: false }; q("-sr").textContent = t("pt.sketch.d"); draw(); return; }
      // reveal: compare the sketch with the model at the sketched times
      const p = model();
      if (sketch.pts.length < 2) { q("-sr").textContent = t("pt.sketch.more"); return; }
      const errs = sketch.pts.map(([tx, v]) => Math.abs(v - val(M().stateAt(p, tx), series)));
      const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
      sketch.revealed = true;
      q("-sr").textContent = t("pt.sketch.result", { e: f3(mean), u: UNIT[series], n: sketch.pts.length });
      draw();
    });
    q("-tb").addEventListener("click", () => { showTable = !showTable; draw(); });
    draw();
    return { unmount() { el.innerHTML = ""; }, state: () => ({ P: { ...P }, series, t: tt }) };
  }

  // ───────── Vector visualizer ─────────
  function vector(el, opts) {
    const t = opts.t, P = load(), id = "pv" + ++uid;
    el.innerHTML = `<div class="pt-vector"><div class="pt-controls" role="group" aria-label="${esc(t("pt.params"))}">${slider(id + "-m", "pt.mag", P.mag, 0, 40, 0.5, "m/s", t)}${slider(id + "-a", "pt.dir", P.vang, -180, 180, 1, "°", t)}</div>
      <div class="pt-vsvg" id="${id}-s"></div><dl class="pt-dl" id="${id}-r"></dl><p class="faint small" id="${id}-q"></p></div>`;
    const q = (s) => el.querySelector("#" + id + s);
    const W = 420, H = 320, cx = W / 2, cy = H / 2, S = 4;
    let dragging = false;
    function draw() {
      const c = M().components(P.mag, P.vang), ex = cx + c.x * S, ey = cy - c.y * S;
      let s = `<defs><marker id="${id}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pf-arrowhead"/></marker></defs>`;
      for (let g = -40; g <= 40; g += 10) s += `<line class="pf-grid" x1="${cx + g * S}" x2="${cx + g * S}" y1="0" y2="${H}"/><line class="pf-grid" x1="0" x2="${W}" y1="${cy - g * S}" y2="${cy - g * S}"/>`;
      s += `<line class="pf-axis" x1="0" x2="${W}" y1="${cy}" y2="${cy}"/><line class="pf-axis" x1="${cx}" x2="${cx}" y1="0" y2="${H}"/><text class="pf-lbl" x="${W - 22}" y="${cy - 6}">+x</text><text class="pf-lbl" x="${cx + 6}" y="14">+y</text>`;
      if (Math.abs(c.x) > 0.05) s += `<line class="pf-comp" x1="${cx}" y1="${cy}" x2="${ex}" y2="${cy}" marker-end="url(#${id}-ah)"/>`;
      if (Math.abs(c.y) > 0.05) s += `<line class="pf-comp" x1="${ex}" y1="${cy}" x2="${ex}" y2="${ey}" marker-end="url(#${id}-ah)"/>`;
      s += `<line class="pf-vec" x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" marker-end="url(#${id}-ah)"/><circle class="pt-handle" cx="${ex}" cy="${ey}" r="9" tabindex="-1"/>`;
      s += `<text class="pf-lbl" x="${(cx + ex) / 2}" y="${cy + (c.y >= 0 ? 16 : -8)}" text-anchor="middle">vₓ = ${f3(c.x)}</text><text class="pf-lbl" x="${ex + (c.x >= 0 ? 6 : -6)}" y="${(cy + ey) / 2}" text-anchor="${c.x >= 0 ? "start" : "end"}">v_y = ${f3(c.y)}</text>`;
      q("-s").innerHTML = `<svg class="pf-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("pf.alt.vector", { v: f3(P.mag), a: f3(P.vang) }))}">${s}</svg>`;
      q("-r").innerHTML = [["pt.mag", `${f3(P.mag)} m/s`], ["pt.dir", `${f3(P.vang)}°`], ["pt.r.vx", `${f3(c.x)} m/s`], ["pt.r.vy", `${f3(c.y)} m/s`]].map(([a, b]) => `<div><dt>${esc(t(a))}</dt><dd>${b}</dd></div>`).join("");
      const horiz = Math.abs(P.vang) <= 90 ? P.vang : (P.vang > 0 ? 180 - P.vang : -180 - P.vang);
      q("-q").textContent = t("pt.vnote", { h: f3(Math.abs(horiz)), ud: t(c.y >= 0 ? "pt.above" : "pt.below"), lr: t(c.x >= 0 ? "pt.right" : "pt.left") });
      q("-m").value = q("-m-n").value = P.mag; q("-a").value = q("-a-n").value = P.vang;
    }
    const bind = (key, prop) => { const r = q(key), n = q(key + "-n"); const set = (v) => { const x = Number(v); if (!Number.isFinite(x)) return; P[prop] = Math.max(Number(r.min), Math.min(Number(r.max), x)); save(P); draw(); }; r.addEventListener("input", () => set(r.value)); n.addEventListener("change", () => set(n.value)); };
    bind("-m", "mag"); bind("-a", "vang");
    const toVec = (e) => { const svg = q("-s").querySelector("svg"); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const l = pt.matrixTransform(svg.getScreenCTM().inverse()); const x = (l.x - cx) / S, y = (cy - l.y) / S; P.mag = Math.min(40, Math.round(Math.hypot(x, y) * 2) / 2); P.vang = Math.round(Math.atan2(y, x) * 180 / Math.PI); save(P); draw(); };
    const down = (e) => { if (!e.target.closest("svg")) return; dragging = true; try { e.target.setPointerCapture(e.pointerId); } catch { /* */ } toVec(e); };
    const move = (e) => { if (dragging) toVec(e); };
    const up = () => { dragging = false; };
    q("-s").addEventListener("pointerdown", down); q("-s").addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    draw();
    return { unmount() { window.removeEventListener("pointerup", up); el.innerHTML = ""; }, state: () => ({ ...P }) };
  }

  const KINDS = { explorer, graphs, vector };
  window.PhysTools = { mount: (kind, el, opts) => (KINDS[kind] ? KINDS[kind](el, opts) : null), load, KEY: SKEY };
})();
