/*
 * The Study Café — the room behind the interface.
 *
 * By default the backdrop is a photograph of the café (assets/cafe.jpg) with a very slow drift (none under reduced
 * motion). Settings → Café scene can switch to the 3D room below, or to a light painted backdrop.
 *
 * Atmosphere only: nothing in the room is interactive. The scene is built from procedural geometry and canvas
 * textures (no model or image downloads), with three.js r149 (vendor/three/three.min.js, ~150 KB gzipped) loaded
 * lazily after the app is usable. The interface never waits for it.
 *
 * Modes (Settings → Café scene, saved in campfire-prep.ui.v1 → scene):
 *   "live"  gentle camera drift, dust in the lamplight, flickering candle (default)
 *   "still" one rendered frame, re-rendered only on resize or theme change (default under reduced motion,
 *           Save-Data, or when the device can't keep up)
 *   "off"   no WebGL at all: a painted CSS backdrop with the same palette
 * Without WebGL the painted backdrop is used automatically. During a test the scene is hidden and not rendered.
 */
(function () {
  "use strict";
  const KEY = "campfire-prep.ui.v1";
  const SRC = "vendor/three/three.min.js";
  const MODES = ["photo", "room", "off"];
  const PHOTO = "assets/cafe.jpg";
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowPower = () => !!((navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory < 4));
  // saved choice; the 3D room's old "live"/"still" values now mean "room"
  const pref = () => { try { let m = (JSON.parse(localStorage.getItem(KEY) || "{}") || {}).scene; if (m === "live" || m === "still") m = "room"; return MODES.includes(m) ? m : null; } catch { return null; } };
  const kind = () => pref() || "photo";
  // the room's motion: live unless the device or the user prefers calm
  const roomMotion = () => (reduced() || lowPower() ? "still" : "live");
  const effective = () => kind();

  let host = null, canvas = null, renderer = null, scene = null, camera = null, raf = 0, last = 0;
  let mode = "off", suspended = false, failed = false, loading = null, built = false, software = false;
  const anim = { dust: null, candles: [], t0: 0, slow: 0, frames: 0, look: { x: 0, y: 0 }, aim: { x: 0, y: 0 } };

  function webglOK() {
    try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch { return false; }
  }
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = SRC; s.async = true;
      s.onload = () => (window.THREE ? res(window.THREE) : rej(new Error("three missing")));
      s.onerror = () => rej(new Error("three failed to load"));
      document.head.appendChild(s);
    });
    return loading;
  }

  // ───────── canvas textures ─────────
  function tex(w, h, draw, repeat) {
    const T = window.THREE, c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  const rnd = (() => { let s = 20240917; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  // dark oak planks with grain and worn highlights
  function woodFloor(ctx, w, h) {
    const rows = 10, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * w * 0.5;
      while (x < w) {
        const len = w * (0.3 + rnd() * 0.4), k = rnd();
        ctx.fillStyle = `rgb(${Math.round(52 + k * 22)},${Math.round(34 + k * 14)},${Math.round(22 + k * 9)})`;
        ctx.fillRect(x, r * rh, len, rh);
        for (let g = 0; g < 30; g++) {
          const y = r * rh + rnd() * rh;
          ctx.strokeStyle = `rgba(${rnd() < 0.5 ? "20,12,6" : "130,92,58"},${0.06 + rnd() * 0.12})`;
          ctx.lineWidth = 0.5 + rnd() * 1.5;
          ctx.beginPath(); ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + len * 0.3, y + (rnd() - 0.5) * 5, x + len * 0.7, y + (rnd() - 0.5) * 5, x + len, y + (rnd() - 0.5) * 3);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(10,6,3,0.6)"; ctx.fillRect(x, r * rh, 2, rh);
        x += len;
      }
      ctx.fillStyle = "rgba(10,6,3,0.65)"; ctx.fillRect(0, r * rh, w, 2);
    }
  }
  function plaster(base) {
    return (ctx, w, h) => {
      ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(${rnd() < 0.5 ? "0,0,0" : "255,235,200"},${rnd() * 0.04})`; const s = 1 + rnd() * 4; ctx.fillRect(rnd() * w, rnd() * h, s, s); }
      // damp, aged patches
      for (let i = 0; i < 18; i++) { const g = ctx.createRadialGradient(rnd() * w, rnd() * h, 0, rnd() * w, rnd() * h, 40 + rnd() * 120); g.addColorStop(0, "rgba(40,24,12,0.12)"); g.addColorStop(1, "rgba(40,24,12,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
    };
  }
  function oak(ctx, w, h) {
    ctx.fillStyle = "#5b3a20"; ctx.fillRect(0, 0, w, h);
    for (let g = 0; g < 90; g++) {
      const y = rnd() * h; ctx.strokeStyle = `rgba(${rnd() < 0.5 ? "30,16,6" : "150,104,62"},${0.08 + rnd() * 0.14})`; ctx.lineWidth = 0.6 + rnd() * 2;
      ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= w; x += w / 8) ctx.lineTo(x, y + Math.sin(x * 0.02 + g) * 4 + (rnd() - 0.5) * 3); ctx.stroke();
    }
  }
  function marble(ctx, w, h) {
    ctx.fillStyle = "#e3d9c6"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(${110 + rnd() * 40},${100 + rnd() * 30},${90 + rnd() * 30},${0.08 + rnd() * 0.18})`;
      ctx.lineWidth = 0.5 + rnd() * 2;
      ctx.beginPath(); let x = rnd() * w, y = rnd() * h; ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (rnd() - 0.3) * w * 0.25; y += (rnd() - 0.5) * h * 0.25; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  // the street outside: golden-hour sky, a domed building, cream façades and trees in the low sun
  function street(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#f6dcae"); g.addColorStop(0.45, "#fbe7c2"); g.addColorStop(0.7, "#f3cf98"); g.addColorStop(1, "#d9a86a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const sun = ctx.createRadialGradient(w * 0.55, h * 0.3, 0, w * 0.55, h * 0.3, w * 0.5); sun.addColorStop(0, "rgba(255,250,230,1)"); sun.addColorStop(1, "rgba(255,240,200,0)"); ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
    // façades
    const fac = (x, y, bw, bh, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, bw, bh); ctx.fillStyle = "rgba(120,90,60,0.35)"; for (let r = y + 14; r < y + bh - 10; r += 26) for (let c2 = x + 8; c2 < x + bw - 12; c2 += 22) ctx.fillRect(c2, r, 10, 16); };
    fac(w * 0.05, h * 0.38, w * 0.28, h * 0.5, "#e9d3ae"); fac(w * 0.6, h * 0.42, w * 0.35, h * 0.46, "#e4c9a0");
    // the dome
    ctx.fillStyle = "#b8a68e"; ctx.fillRect(w * 0.36, h * 0.3, w * 0.18, h * 0.4);
    ctx.fillStyle = "#8a7a6a"; ctx.beginPath(); ctx.ellipse(w * 0.45, h * 0.3, w * 0.09, h * 0.11, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(w * 0.445, h * 0.13, w * 0.01, h * 0.07);
    // trees and blossoms in the low sun
    for (let i = 0; i < 70; i++) { const x = rnd() * w, y = h * (0.55 + rnd() * 0.45), r = 10 + rnd() * 34; ctx.fillStyle = rnd() < 0.25 ? `rgba(245,236,220,${0.5 + rnd() * 0.4})` : `rgba(${70 + rnd() * 50},${90 + rnd() * 50},${40 + rnd() * 20},${0.55 + rnd() * 0.4})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    // haze
    ctx.fillStyle = "rgba(255,230,190,0.25)"; ctx.fillRect(0, 0, w, h);
  }
  function glowSprite(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,226,170,1)"); g.addColorStop(0.25, "rgba(255,190,110,0.45)"); g.addColorStop(1, "rgba(255,160,80,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function dustSprite(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,235,200,0.9)"); g.addColorStop(1, "rgba(255,235,200,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  // a sunbeam: bright at the window, fading into the room
  function beam(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "rgba(255,214,150,0.9)"); g.addColorStop(1, "rgba(255,200,130,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const v = ctx.createLinearGradient(0, 0, 0, h); v.addColorStop(0, "rgba(0,0,0,1)"); v.addColorStop(0.15, "rgba(0,0,0,0)"); v.addColorStop(0.85, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = v; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "source-over";
  }
  // chalk menu board: "Good Coffee, Better Grades"
  function chalk(ctx, w, h) {
    ctx.fillStyle = "#1c201c"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 600; i++) { ctx.fillStyle = `rgba(230,225,210,${rnd() * 0.04})`; ctx.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 30, 1 + rnd() * 3); }
    ctx.fillStyle = "rgba(236,226,200,0.92)"; ctx.textBaseline = "top";
    ctx.font = "italic 600 54px Georgia, 'Times New Roman', serif"; ctx.fillText("Good Coffee", 34, 34);
    ctx.font = "italic 46px Georgia, 'Times New Roman', serif"; ctx.fillText("Better Grades", 34, 100);
    ctx.fillStyle = "rgba(236,226,200,0.7)"; ctx.font = "italic 26px Georgia, serif";
    ["Espresso", "Americano", "Latte", "Cappuccino", "Cold Brew", "Matcha Latte"].forEach((t, i) => ctx.fillText(t, 38, 190 + i * 40));
    ctx.strokeStyle = "rgba(170,190,140,0.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w - 70, h - 30); ctx.lineTo(w - 70, 200); ctx.stroke();
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(w - 70 + (i % 2 ? 14 : -14), 220 + i * 26, 14, 5, (i % 2 ? -0.6 : 0.6), 0, Math.PI * 2); ctx.stroke(); }
  }
  // a worn Persian rug
  function rug(ctx, w, h) {
    ctx.fillStyle = "#4e2620"; ctx.fillRect(0, 0, w, h);
    const band = (m, c) => { ctx.strokeStyle = c; ctx.lineWidth = m[1]; ctx.strokeRect(m[0], m[0], w - 2 * m[0], h - 2 * m[0]); };
    band([18, 22], "#2e1c1a"); band([44, 10], "#8e6c48"); band([64, 18], "#3a2a3a"); band([90, 6], "#94784e");
    for (let i = 0; i < 40; i++) { const x = 30 + (i % 20) * ((w - 60) / 20), y = i < 20 ? 30 : h - 30; ctx.fillStyle = "#c9a46a"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    // the medallion and field motifs
    ctx.save(); ctx.translate(w / 2, h / 2);
    for (let r = 6; r > 0; r--) { ctx.fillStyle = ["#241a24", "#5a2c22", "#8a7048", "#2f3a2c", "#6a3424", "#a08a68"][r - 1]; ctx.beginPath(); for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) { const rr = r * 26 * (a / (Math.PI / 8) % 2 ? 0.8 : 1); ctx.lineTo(Math.cos(a) * rr * 1.5, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 160; i++) { const x = 110 + rnd() * (w - 220), y = 110 + rnd() * (h - 220); ctx.fillStyle = ["rgba(201,164,106,0.5)", "rgba(46,30,40,0.5)", "rgba(70,90,70,0.45)"][i % 3]; ctx.fillRect(x, y, 6 + rnd() * 10, 3 + rnd() * 6); }
    // wear
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(${rnd() < 0.5 ? "0,0,0" : "220,190,150"},${rnd() * 0.06})`; ctx.fillRect(rnd() * w, rnd() * h, 2, 2); }
  }
  function latte(ctx, w, h) {
    ctx.fillStyle = "#8a5a32"; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, "#b07a48"); g.addColorStop(1, "#5a3418"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // rosetta
    ctx.fillStyle = "#f3e6d0";
    for (let i = 0; i < 7; i++) { const y = h * 0.28 + i * h * 0.065, s = 1 - i * 0.1; ctx.beginPath(); ctx.ellipse(w / 2, y, w * 0.2 * s, h * 0.05, 0, 0, Math.PI); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(w / 2 - 2, h * 0.2); ctx.lineTo(w / 2 + 2, h * 0.2); ctx.lineTo(w / 2 + 1, h * 0.82); ctx.lineTo(w / 2 - 1, h * 0.82); ctx.fill();
    ctx.beginPath(); ctx.arc(w / 2, h * 0.24, w * 0.07, 0, Math.PI * 2); ctx.fill();
  }
  function leather(ctx, w, h) {
    ctx.fillStyle = "#2a1c14"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { ctx.fillStyle = `rgba(${rnd() < 0.5 ? "0,0,0" : "120,90,60"},${rnd() * 0.08})`; ctx.fillRect(rnd() * w, rnd() * h, 2, 2); }
    ctx.strokeStyle = "rgba(160,120,70,0.5)"; ctx.setLineDash([6, 5]); ctx.strokeRect(10, 10, w - 20, h - 20);
  }

  // ───────── the room ─────────
  // Golden-hour sun through tall arched windows on the left; the bar with a pastry case and a chalk menu on the right;
  // brass pendants and hanging plants; a rug; and, close by, your table: a latte, a notebook, a few flowers.
  function build(T) {
    scene = new T.Scene();
    scene.background = new T.Color("#1a120b");
    scene.fog = new T.FogExp2("#2a1c11", 0.028);

    const M = (o) => new T.MeshStandardMaterial(o);
    const oakMat = M({ map: tex(512, 256, oak), roughness: 0.55 });
    const walnut = M({ color: "#3c2414", roughness: 0.5 });
    const walnutDark = M({ color: "#24150b", roughness: 0.6 });
    const brass = M({ color: "#c09445", roughness: 0.3, metalness: 0.9 });
    const cream = M({ color: "#efe6d6", roughness: 0.35 });
    const marbleMat = M({ map: tex(512, 512, marble), roughness: 0.22 });
    const sage = M({ color: "#5f7a4c", roughness: 0.7 });
    const sageDark = M({ color: "#3f5a35", roughness: 0.75 });
    const terracotta = M({ color: "#9a5636", roughness: 0.85 });
    const velvet = M({ color: "#2f3d2c", roughness: 0.95 });
    const wallMat = M({ map: tex(1024, 512, plaster("#4c3a2a"), [2, 1]), roughness: 0.95 });
    const wallWarm = M({ map: tex(1024, 512, plaster("#5a4430"), [2, 1]), roughness: 0.95 });
    const add = (geo, mat, x, y, z, o = {}) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; m.castShadow = o.cast !== false; m.receiveShadow = true; (o.to || scene).add(m); return m; };
    const box = (w, h, d) => new T.BoxGeometry(w, h, d);
    const cyl = (rt, rb, h, s = 24) => new T.CylinderGeometry(rt, rb, h, s);

    // room: x −4.2 (windows) .. 5 (bar wall), z −10 (back) .. 4, ceiling 4.4
    const floor = add(new T.PlaneGeometry(10, 15), M({ map: tex(1024, 1024, woodFloor, [4, 6]), roughness: 0.38, metalness: 0.05 }), 0.4, 0, -3, { rx: -Math.PI / 2, cast: false });
    floor.receiveShadow = true;
    add(new T.PlaneGeometry(3.6, 2.6), M({ map: tex(1024, 768, rug), roughness: 0.95, color: "#b8a090" }), 0.6, 0.004, 0.3, { rx: -Math.PI / 2, cast: false });
    add(new T.PlaneGeometry(10, 15), M({ color: "#1c120a", roughness: 1 }), 0.4, 4.4, -3, { rx: Math.PI / 2, cast: false });
    for (let z = -9.5; z <= 3.5; z += 1.6) add(box(9.4, 0.24, 0.2), walnutDark, 0.4, 4.28, z);
    // back wall with a wide archway into the back room (shelves and lamps)
    add(box(3.2, 4.4, 0.3), wallWarm, -2.6, 2.2, -10);
    add(box(3.4, 4.4, 0.3), wallWarm, 3.3, 2.2, -10);
    add(box(2.6, 1.0, 0.3), wallWarm, 0.3, 3.9, -10);
    const arch = add(new T.TorusGeometry(1.3, 0.12, 10, 32, Math.PI), walnut, 0.3, 3.2, -9.85, { cast: false });
    add(box(6, 4.4, 0.2), wallMat, 0.3, 2.2, -12.6, { cast: false });
    for (let s = 0; s < 5; s++) add(box(2.4, 0.05, 0.4), walnut, 0.3, 0.6 + s * 0.6, -12.3);
    for (let i = 0; i < 40; i++) { const h = 0.12 + rnd() * 0.18; add(cyl(0.05, 0.05, h, 10), M({ color: ["#7a4a2a", "#c9b27a", "#3d4a3a", "#8a6a3a", "#e8dcc4"][i % 5], roughness: 0.3, transparent: true, opacity: 0.9 }), -0.8 + (i % 10) * 0.24, 0.62 + Math.floor(i / 10) * 0.6 + h / 2, -12.25); }
    // the window wall: piers between three tall arched windows, so the sun throws window shadows into the room
    const winZ = [-7.4, -4.2, -1.0], winW = 1.9;
    let z0 = -10.2;
    for (const wz of winZ) { const zA = wz - winW / 2; add(box(0.35, 4.4, zA - z0), wallMat, -4.2, 2.2, (z0 + zA) / 2); z0 = wz + winW / 2; }
    add(box(0.35, 4.4, 4.2 - z0), wallMat, -4.2, 2.2, (z0 + 4.2) / 2);
    for (const wz of winZ) {
      add(box(0.35, 0.7, winW), wallMat, -4.2, 0.35, wz);                 // below the sill
      add(box(0.35, 0.5, winW), wallMat, -4.2, 4.15, wz);                 // above the arch
      add(box(0.5, 0.06, winW + 0.1), walnut, -4.0, 0.72, wz);            // sill
      for (const dz of [-winW / 2 + 0.04, 0, winW / 2 - 0.04]) add(box(0.08, 3.2, 0.06), walnutDark, -4.1, 2.3, wz + dz);
      for (const y of [1.5, 2.4, 3.3]) add(box(0.08, 0.05, winW), walnutDark, -4.1, y, wz);
      add(new T.TorusGeometry(winW / 2, 0.05, 8, 24, Math.PI), walnutDark, -4.1, 3.75, wz, { ry: Math.PI / 2 });
      // flowers on the sill
      for (let k = 0; k < 3; k++) { const fz = wz - 0.5 + k * 0.5; add(cyl(0.07, 0.05, 0.14, 12), terracotta, -3.95, 0.82, fz); for (let f = 0; f < 6; f++) add(new T.SphereGeometry(0.035, 8, 6), M({ color: ["#f4ead8", "#e8c6b0", "#f7f0e2"][f % 3], roughness: 0.8 }), -3.95 + (rnd() - 0.5) * 0.12, 0.95 + rnd() * 0.12, fz + (rnd() - 0.5) * 0.12, { cast: false }); }
    }
    const outside = new T.MeshBasicMaterial({ map: tex(1024, 512, street), toneMapped: false });
    add(new T.PlaneGeometry(18, 7), outside, -7.5, 2.6, -4, { ry: Math.PI / 2, cast: false });
    // right wall behind the bar, with shelves and the chalk menu
    add(box(0.3, 4.4, 14), wallMat, 5.1, 2.2, -3);
    add(new T.PlaneGeometry(1.05, 1.5), M({ map: tex(512, 720, chalk), roughness: 0.95 }), 4.9, 3.1, -0.3, { ry: -Math.PI / 2, cast: false });
    add(box(0.06, 1.6, 1.15), walnut, 4.94, 3.1, -0.3);
    for (const y of [1.6, 2.15, 2.7]) add(box(0.35, 0.04, 4.4), walnut, 4.85, y, -3.6);
    const glassCols = ["#4a6b3a", "#6b3a22", "#c8b27a", "#2f4a5a", "#7a2a2a", "#d8c8a0"];
    for (let i = 0; i < 39; i++) { const y = [1.62, 2.17, 2.72][i % 3], z = -5.6 + Math.floor(i / 3) * 0.32, h = 0.18 + rnd() * 0.14; add(cyl(0.04, 0.045, h, 12), M({ color: glassCols[i % 6], roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }), 4.82, y + h / 2, z); }

    // the bar: panelled walnut front, marble top, brass rail, pastry case and espresso machine
    const barX = 3.4, barZ = -2.8, barLen = 6.4;
    add(box(0.9, 1.05, barLen), walnut, barX, 0.52, barZ);
    for (let k = -barLen / 2 + 0.3; k < barLen / 2; k += 0.6) add(box(0.04, 0.7, 0.5), walnutDark, barX - 0.46, 0.55, barZ + k);
    add(box(1.05, 0.06, barLen + 0.1), marbleMat, barX, 1.08, barZ);
    add(cyl(0.025, 0.025, barLen, 12), brass, barX - 0.62, 0.2, barZ, { rx: Math.PI / 2 });
    // pastry case: glass box with croissants and buns on two trays, lit from inside
    const pc = new T.Group(); pc.position.set(barX - 0.05, 1.11, barZ + 2.2); scene.add(pc);
    add(box(0.75, 0.04, 1.3), brass, 0, 0, 0, { to: pc });
    add(box(0.75, 0.55, 1.3), new T.MeshPhysicalMaterial({ color: "#ffffff", transmission: 0.9, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }), 0, 0.3, 0, { to: pc, cast: false });
    add(box(0.7, 0.02, 1.25), brass, 0, 0.28, 0, { to: pc, cast: false });
    for (const [ex, ez] of [[-0.37, -0.64], [0.37, -0.64], [-0.37, 0.64], [0.37, 0.64]]) add(box(0.02, 0.56, 0.02), brass, ex, 0.3, ez, { to: pc, cast: false });
    add(box(0.76, 0.02, 1.32), brass, 0, 0.58, 0, { to: pc, cast: false });
    const pastry = M({ color: "#c98a3e", roughness: 0.55 });
    for (let tray = 0; tray < 2; tray++) for (let i = 0; i < 6; i++) { const p = add(new T.SphereGeometry(0.07, 14, 10), pastry, -0.15 + (i % 2) * 0.3, 0.07 + tray * 0.28, -0.45 + Math.floor(i / 2) * 0.42, { to: pc }); p.scale.set(1.5, 0.6, 1); p.rotation.y = rnd(); }
    const caseLight = new T.PointLight("#ffd29a", 0.6, 1.6, 2); caseLight.position.set(0, 0.5, 0); pc.add(caseLight);
    const em = new T.Group(); em.position.set(barX + 0.05, 1.11, barZ - 1.4); scene.add(em);
    add(box(0.55, 0.42, 0.38), M({ color: "#cfc8bc", roughness: 0.18, metalness: 0.95 }), 0, 0.21, 0, { to: em });
    add(box(0.57, 0.05, 0.4), brass, 0, 0.44, 0, { to: em });
    for (let k = 0; k < 4; k++) add(cyl(0.045, 0.035, 0.07, 16), cream, -0.18 + k * 0.11, 0.5, 0.1, { to: em });
    // bar stools
    for (const k of [-2.4, -1.4, -0.4, 0.6]) { add(cyl(0.19, 0.19, 0.06, 24), M({ color: "#3b2416", roughness: 0.5 }), barX - 0.85, 0.78, barZ + k); add(cyl(0.025, 0.03, 0.76, 10), brass, barX - 0.85, 0.38, barZ + k); }

    // pendants: brass domes over the bar and the room
    const glow = new T.SpriteMaterial({ map: tex(128, 128, glowSprite), color: "#ffd9a0", transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    const pendant = (x, z, drop, power) => {
      add(cyl(0.006, 0.006, drop, 6), M({ color: "#111", roughness: 0.9 }), x, 4.4 - drop / 2, z, { cast: false });
      const shade = add(new T.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M({ color: "#c09445", roughness: 0.3, metalness: 0.85, side: T.DoubleSide }), x, 4.4 - drop, z, { cast: false });
      shade.material.emissive = new T.Color("#2a1806");
      add(new T.SphereGeometry(0.07, 16, 12), new T.MeshBasicMaterial({ color: "#fff3dc", toneMapped: false }), x, 4.4 - drop - 0.04, z, { cast: false });
      const s = new T.Sprite(glow); s.position.set(x, 4.4 - drop - 0.08, z); s.scale.set(1.1, 1.1, 1); scene.add(s);
      const L = new T.PointLight("#ffb46b", power, 7, 1.8); L.position.set(x, 4.4 - drop - 0.2, z); scene.add(L);
    };
    pendant(barX - 0.2, barZ - 2.0, 1.5, 0.9); pendant(barX - 0.2, barZ + 0.4, 1.5, 0.9);
    pendant(0.3, -8.6, 1.4, 0.8); pendant(-1.6, -5.2, 1.6, 0.7); pendant(0.8, -2.2, 1.7, 0.6);

    // hanging plants: trailing vines from the beams
    const vine = (x, z, len) => {
      add(cyl(0.12, 0.09, 0.16, 14), terracotta, x, 4.0, z, { cast: false });
      add(cyl(0.004, 0.004, 0.4, 4), M({ color: "#222" }), x, 4.22, z, { cast: false });
      for (let s = 0; s < 4; s++) { const a = (s / 4) * Math.PI * 2 + rnd(); let px = x + Math.cos(a) * 0.1, pz = z + Math.sin(a) * 0.1;
        for (let k = 0; k < len; k++) { px += (rnd() - 0.5) * 0.05; pz += (rnd() - 0.5) * 0.05; const leaf = add(new T.SphereGeometry(0.045, 8, 6), k % 3 ? sage : sageDark, px, 3.95 - k * 0.09, pz, { cast: false }); leaf.scale.set(1, 0.4, 0.7); leaf.rotation.set(rnd() * 2, rnd() * 3, 0); } }
    };
    vine(-3.2, -6.0, 14); vine(-3.2, -2.6, 12); vine(1.8, -6.5, 10); vine(-3.3, 0.6, 16); vine(4.2, -6.4, 12);

    // tables by the windows, a green velvet armchair, a big plant in the corner
    const chair = (x, z, ry) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      add(cyl(0.22, 0.22, 0.05, 24), walnut, 0, 0.47, 0, { to: g });
      for (const [dx, dz] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) add(cyl(0.018, 0.014, 0.47, 8), walnutDark, dx, 0.235, dz, { to: g });
      add(new T.TorusGeometry(0.2, 0.018, 8, 24, Math.PI), walnutDark, 0, 0.72, -0.19, { to: g });
      add(cyl(0.016, 0.016, 0.28, 8), walnutDark, -0.2, 0.62, -0.19, { to: g }); add(cyl(0.016, 0.016, 0.28, 8), walnutDark, 0.2, 0.62, -0.19, { to: g });
    };
    const table = (x, z, r) => { add(cyl(r, r, 0.04, 40), oakMat, x, 0.76, z); add(cyl(0.035, 0.05, 0.72, 12), walnutDark, x, 0.38, z); add(cyl(0.22, 0.26, 0.03, 24), walnutDark, x, 0.015, z); };
    const smallCup = (x, z) => { add(cyl(0.07, 0.07, 0.012, 24), cream, x, 0.786, z); add(cyl(0.042, 0.033, 0.06, 20), cream, x, 0.82, z); };
    table(-2.9, -7.4, 0.42); chair(-2.9, -6.8, Math.PI); chair(-2.3, -7.5, -Math.PI / 2); smallCup(-2.8, -7.3);
    table(-2.9, -4.2, 0.42); chair(-2.3, -4.2, -Math.PI / 2); chair(-2.9, -3.6, Math.PI); smallCup(-3.0, -4.1); smallCup(-2.75, -4.3);
    table(0.6, -5.6, 0.4); chair(1.2, -5.6, -Math.PI / 2); chair(0.0, -5.6, Math.PI / 2);
    const ac = new T.Group(); ac.position.set(-3.2, 0, -2.4); ac.rotation.y = Math.PI / 2 + 0.25; scene.add(ac);
    add(box(0.85, 0.4, 0.8), velvet, 0, 0.32, 0, { to: ac }); add(box(0.85, 0.7, 0.18), velvet, 0, 0.78, -0.33, { to: ac });
    add(box(0.16, 0.32, 0.8), velvet, -0.42, 0.62, 0, { to: ac }); add(box(0.16, 0.32, 0.8), velvet, 0.42, 0.62, 0, { to: ac });
    const plant = (x, z, s) => {
      add(cyl(0.2 * s, 0.15 * s, 0.36 * s, 20), terracotta, x, 0.18 * s, z);
      for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, rr = rnd() * 0.24 * s, y = 0.45 * s + rnd() * 0.9 * s; const leaf = add(new T.SphereGeometry(0.12 * s, 10, 8), rnd() < 0.5 ? sage : sageDark, x + Math.cos(a) * rr, y, z + Math.sin(a) * rr); leaf.scale.set(1, 0.32, 0.55); leaf.rotation.set(rnd(), a, rnd() * 0.8); }
    };
    plant(-3.6, -9.2, 1.6); plant(4.3, 1.0, 1.2); plant(-1.2, -9.4, 1.0);

    // your table, close by: oak top, a latte with a rosetta, a leather notebook and pen, flowers in a vase
    const near = { x: -1.05, z: 1.75 };
    add(cyl(0.78, 0.78, 0.05, 48), oakMat, near.x, 0.76, near.z);
    add(cyl(0.05, 0.07, 0.72, 14), walnutDark, near.x, 0.38, near.z);
    add(cyl(0.006, 0.006, 0.01, 4), walnut, near.x, 0.79, near.z);
    const cx = near.x + 0.3, cz = near.z + 0.28;
    add(cyl(0.13, 0.12, 0.014, 32), cream, cx, 0.792, cz);
    add(cyl(0.065, 0.048, 0.085, 28), cream, cx, 0.84, cz);
    add(new T.CircleGeometry(0.061, 28), M({ map: tex(256, 256, latte), roughness: 0.35 }), cx, 0.881, cz, { rx: -Math.PI / 2, cast: false });
    add(new T.TorusGeometry(0.03, 0.008, 8, 16), cream, cx + 0.07, 0.845, cz);
    add(box(0.11, 0.004, 0.012), M({ color: "#d8d0c0", metalness: 0.9, roughness: 0.2 }), cx + 0.02, 0.8, cz + 0.1, { ry: 0.4 });
    add(box(0.34, 0.025, 0.25), M({ map: tex(256, 192, leather), roughness: 0.6 }), near.x + 0.05, 0.795, near.z - 0.22, { ry: 0.35 });
    add(cyl(0.006, 0.006, 0.2, 8), M({ color: "#1a1a1a", metalness: 0.6, roughness: 0.3 }), near.x + 0.12, 0.815, near.z - 0.12, { rz: Math.PI / 2, ry: 0.9 });
    const vase = add(cyl(0.05, 0.07, 0.2, 20), M({ color: "#d9d4c8", roughness: 0.1, transparent: true, opacity: 0.55 }), near.x - 0.35, 0.88, near.z - 0.1);
    for (let f = 0; f < 9; f++) { const a = rnd() * Math.PI * 2, r = rnd() * 0.08; const fx = near.x - 0.35 + Math.cos(a) * r, fz = near.z - 0.1 + Math.sin(a) * r, fy = 1.05 + rnd() * 0.18;
      add(cyl(0.003, 0.003, fy - 0.9, 4), sageDark, (fx + near.x - 0.35) / 2, (fy + 0.9) / 2, (fz + near.z - 0.1) / 2, { cast: false });
      for (let p = 0; p < 5; p++) add(new T.SphereGeometry(0.018, 8, 6), M({ color: f % 3 ? "#f6efe2" : "#efd9c0", roughness: 0.8 }), fx + Math.cos(p * 1.26) * 0.022, fy, fz + Math.sin(p * 1.26) * 0.022, { cast: false }); }
    void vase; void arch;

    // light: the low sun through the windows (soft shadows of mullions and piers), warm fill, sunbeams
    scene.add(new T.HemisphereLight("#ffe6c0", "#20140b", 0.2));
    const sunL = new T.DirectionalLight("#ffc77e", 2.5);
    sunL.position.set(-11, 6.5, 1.5); sunL.target.position.set(0.5, 0, -3.5);
    sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); sunL.shadow.bias = -0.0008; sunL.shadow.normalBias = 0.02; sunL.shadow.radius = 3;
    Object.assign(sunL.shadow.camera, { left: -9, right: 9, top: 7, bottom: -7, near: 1, far: 30 });
    scene.add(sunL, sunL.target);
    const fill = new T.PointLight("#ffcf99", 0.5, 9, 1.5); fill.position.set(-1.5, 2.2, 2.5); scene.add(fill);
    const winGlow = new T.SpriteMaterial({ map: tex(128, 128, glowSprite), color: "#ffe2b0", transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending });
    for (const wz of winZ) { const g = new T.Sprite(winGlow); g.position.set(-3.9, 2.3, wz); g.scale.set(3.2, 3.6, 1); scene.add(g); }
    const beamTex = tex(256, 64, beam);
    for (const wz of winZ) {
      const bm = new T.Mesh(new T.PlaneGeometry(6.5, 1.5), new T.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.16, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false }));
      bm.position.set(-1.1, 1.7, wz + 1.0); bm.rotation.set(0, -0.32, -0.42); scene.add(bm);
    }

    // dust in the sunbeams
    const N = 140, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = -3.6 + rnd() * 3.6; pos[i * 3 + 1] = 0.6 + rnd() * 2.6; pos[i * 3 + 2] = -7 + rnd() * 8; }
    const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(pos, 3));
    anim.dust = new T.Points(dg, new T.PointsMaterial({ map: tex(32, 32, dustSprite), size: 0.025, transparent: true, opacity: 0.45, depthWrite: false, blending: T.AdditiveBlending, color: "#ffe4b8" }));
    scene.add(anim.dust);

    camera = new T.PerspectiveCamera(56, 1, 0.05, 40);
    built = true;
  }

  // ───────── camera, sizing and the render loop ─────────
  // Standing just inside the door: your table at bottom left, the windows on the left, the bar on the right.
  function aimCamera(t) {
    if (!camera) return;
    const w = innerWidth, narrow = w < 700;
    const base = narrow ? { x: 0.0, y: 1.6, z: 3.7, fov: 70 } : { x: 0.25, y: 1.6, z: 3.25, fov: 58 };
    const dx = mode === "live" ? Math.sin(t * 0.00006) * 0.12 + anim.look.x * 0.1 : 0;
    const dy = mode === "live" ? Math.sin(t * 0.0001) * 0.03 + anim.look.y * 0.04 : 0;
    camera.position.set(base.x + dx, base.y + dy, base.z);
    if (camera.fov !== base.fov) { camera.fov = base.fov; camera.updateProjectionMatrix(); }
    camera.lookAt(0.15 + dx * 0.4, 1.12, -6);
  }
  function resize() {
    if (!renderer || !camera) return;
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mode === "live" ? 1.5 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    draw(performance.now());
  }
  function draw(t) {
    if (!renderer || !built || suspended || kind() !== "room") return;
    aimCamera(t);
    renderer.render(scene, camera);
  }
  function tick(t) {
    raf = 0;
    if (suspended || mode !== "live" || document.hidden) return;
    raf = requestAnimationFrame(tick);
    if (t - last < 33) return; // about 30 fps is plenty for drifting dust
    const dt = last ? t - last : 33; last = t;
    // frames arriving far apart mean the device is struggling (whatever the cause): settle on a still frame
    if (dt > 120) anim.slow = anim.slow * 0.9 + 0.1;
    anim.look.x += (anim.aim.x - anim.look.x) * 0.04; anim.look.y += (anim.aim.y - anim.look.y) * 0.04;
    if (anim.dust) { const p = anim.dust.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) + 0.00012 * dt * (0.4 + (i % 7) / 7); if (y > 3.3) y = 0.6; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t * 0.0004 + i) * 0.0004); } p.needsUpdate = true; }
    for (const c of anim.candles || []) { const f = 0.85 + Math.sin(t * 0.013) * 0.06 + Math.sin(t * 0.031 + 1) * 0.05 + (Math.random() - 0.5) * 0.04; c.light.intensity = 0.5 * f; c.sprite.scale.set(0.12 * f, 0.16 * f, 1); }
    const t0 = performance.now();
    draw(t);
    // a device that can't keep up gets a still frame instead of a stuttering one
    const cost = performance.now() - t0;
    anim.frames++; anim.slow = anim.slow * 0.9 + (cost > 40 ? 0.1 : 0);
    if (anim.frames > 10 && anim.slow > 0.5) { mode = "still"; document.documentElement.dataset.scene = "still"; draw(t); }
  }
  function startLoop() { if (!raf && mode === "live" && !suspended && built && kind() === "room") { last = 0; raf = requestAnimationFrame(tick); } }

  // software-rendered WebGL (no GPU): even one frame costs seconds of CPU, so the painted room is used unless the
  // learner explicitly chose Live or Still in Settings
  let photoState = "none"; // none | loading | ready | failed
  function showPhoto() {
    let el = host.querySelector(".cafe-photo");
    if (!el) { el = document.createElement("div"); el.className = "cafe-photo"; el.setAttribute("aria-hidden", "true"); host.insertBefore(el, host.firstChild); }
    if (photoState === "ready") { host.classList.add("photo-ready"); return; }
    if (photoState === "loading") return;
    photoState = "loading";
    const img = new Image();
    img.onload = () => { photoState = "ready"; el.style.backgroundImage = `url("${PHOTO}")`; if (kind() === "photo") host.classList.add("photo-ready"); };
    img.onerror = () => { photoState = "failed"; if (kind() === "photo") document.documentElement.dataset.scene = "painted"; };
    img.src = PHOTO;
  }
  async function mount() {
    host = document.getElementById("cafe-bg");
    if (!host) return;
    const k = kind();
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    host.classList.remove("photo-ready", "ready");
    if (k === "off") { mode = "off"; document.documentElement.dataset.scene = "off"; return; }
    if (k === "photo") { mode = "photo"; document.documentElement.dataset.scene = photoState === "failed" ? "painted" : "photo"; showPhoto(); return; }
    mode = roomMotion();
    document.documentElement.dataset.scene = mode;
    if (!webglOK()) { failed = true; document.documentElement.dataset.scene = "painted"; return; }
    try {
      const T = await loadThree();
      if (kind() !== "room") return;
      if (!renderer) {
        canvas = document.createElement("canvas");
        canvas.className = "cafe-canvas";
        canvas.setAttribute("aria-hidden", "true");
        renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power", alpha: false });
        renderer.outputEncoding = T.sRGBEncoding;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFSoftShadowMap;
        host.insertBefore(canvas, host.firstChild);
        try { const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info"); software = /swiftshader|llvmpipe|software|basic render/i.test(String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "")); } catch { /* unknown: assume hardware */ }
        addEventListener("resize", resize);
        addEventListener("pointermove", (e) => { anim.aim.x = (e.clientX / innerWidth - 0.5) * 2; anim.aim.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
        document.addEventListener("visibilitychange", () => { if (!document.hidden) startLoop(); });
        canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); failed = true; document.documentElement.dataset.scene = "painted"; host.classList.remove("ready"); });
      }
      // software-rendered WebGL is slow: the room still runs (it was chosen), but as a single still frame
      if (software) mode = "still";
      document.documentElement.dataset.scene = mode;
      if (!built) build(T);
      resize();
      requestAnimationFrame(() => { host.classList.add("ready"); });
      startLoop();
    } catch (e) {
      failed = true;
      document.documentElement.dataset.scene = "painted";
    }
  }
  // the test screen hides the café entirely; leaving it brings the room back
  function setSuspended(on) {
    suspended = !!on;
    if (host) host.classList.toggle("suspended", suspended);
    if (!suspended) { draw(performance.now()); startLoop(); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function setMode(m) {
    if (!MODES.includes(m)) m = null;
    try { const u = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; if (m) u.scene = m; else delete u.scene; localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* storage off */ }
    if (kind() === "room" && failed) { if (raf) { cancelAnimationFrame(raf); raf = 0; } document.documentElement.dataset.scene = "painted"; return; }
    return void mount();
  }
  // start once the interface is up and the browser is idle: the room never delays the first screen
  function boot() {
    const go = () => mount();
    if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 300);
  }
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", () => { if (kind() === "room") mount(); });

  window.Cafe = { boot, setMode, setSuspended, mode: () => (kind() === "room" && failed ? "painted" : kind() === "photo" && photoState === "failed" ? "painted" : mode), choice: () => kind(), effective, MODES, ready: () => !!(host && (host.classList.contains("ready") || host.classList.contains("photo-ready"))), software: () => software };
})();
