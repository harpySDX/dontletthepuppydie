/*
 * PHYSICS MODEL — the one source of truth for projectile motion, units and numbers.
 * Used by the question generators, the answer keys, the Projectile Explorer and the Motion Graph Lab, so they can't drift.
 *
 * Ideal projectile model near Earth's surface: no air resistance, constant g, flat ground.
 * Coordinates: x horizontal (positive in the direction of launch), y vertical with UP POSITIVE.
 *   a_x = 0, a_y = −g     x = x0 + v0x·t     y = y0 + v0y·t − ½·g·t²     v_y = v0y − g·t
 *   v0x = v0·cos θ, v0y = v0·sin θ   (θ measured from the horizontal; negative θ = launched downward)
 * Landing: solve y(t) = y_land for the LATER root (the projectile comes down onto the surface); range = v0x·t_land.
 * No single "range formula" is used: R = v0²·sin2θ/g is only the special case y_land = y0 (see sameHeightRange()).
 */
(function (root) {
  "use strict";
  const G = 9.81;
  const DEG = Math.PI / 180;
  const finite = (x) => typeof x === "number" && Number.isFinite(x);

  // ───────── projectile ─────────
  // opts: { v0 (m/s, ≥ 0), angle (degrees, −90…90), h0 (launch height, m), yLand (landing surface height, m), g (m/s², > 0) }
  // returns { ok, error?, ...results }. error codes: "input" | "never-reaches" (the landing surface is above the highest point)
  function launch(opts) {
    const v0 = Number(opts.v0), angle = Number(opts.angle), h0 = Number(opts.h0 || 0), yLand = Number(opts.yLand || 0), g = opts.g === undefined ? G : Number(opts.g);
    if (![v0, angle, h0, yLand, g].every(finite) || v0 < 0 || g <= 0 || angle < -90 || angle > 90) return { ok: false, error: "input" };
    const vx = v0 * Math.cos(angle * DEG), vy = v0 * Math.sin(angle * DEG);
    const vx0 = Math.abs(vx) < 1e-12 ? 0 : vx, vy0 = Math.abs(vy) < 1e-12 ? 0 : vy;
    const tApex = vy0 > 0 ? vy0 / g : 0;
    const yMax = vy0 > 0 ? h0 + (vy0 * vy0) / (2 * g) : h0;
    const disc = vy0 * vy0 + 2 * g * (h0 - yLand);
    const base = { v0, angle, h0, yLand, g, vx: vx0, vy: vy0, tApex, yMax, apexX: vx0 * tApex };
    if (disc < -1e-12) return { ok: false, error: "never-reaches", ...base };
    const tLand = (vy0 + Math.sqrt(Math.max(0, disc))) / g;
    if (!(tLand > 1e-9)) return { ok: false, error: "never-reaches", ...base };
    const vyI = vy0 - g * tLand;
    const speedI = Math.hypot(vx0, vyI);
    return {
      ok: true, ...base,
      tLand, range: vx0 * tLand,
      impact: { vx: vx0, vy: vyI, speed: speedI, angleBelow: Math.atan2(-vyI, vx0) / DEG },
      dy: yLand - h0,
    };
  }
  function stateAt(p, t) {
    const y = p.h0 + p.vy * t - 0.5 * p.g * t * t, vy = p.vy - p.g * t;
    return { t, x: p.vx * t, y, vx: p.vx, vy, ax: 0, ay: -p.g, speed: Math.hypot(p.vx, vy) };
  }
  // both times at which the projectile is at height y (null when it never gets there)
  function timesAtHeight(p, y) {
    const disc = p.vy * p.vy + 2 * p.g * (p.h0 - y);
    if (disc < 0) return null;
    const s = Math.sqrt(disc);
    return [(p.vy - s) / p.g, (p.vy + s) / p.g].filter((t) => t >= -1e-12);
  }
  function samples(p, n = 120, tEnd) {
    const T = tEnd === undefined ? (p.ok ? p.tLand : Math.max(p.tApex * 2, 1)) : tEnd;
    return Array.from({ length: n + 1 }, (_, i) => stateAt(p, (T * i) / n));
  }
  // special case only (equal launch and landing heights)
  const sameHeightRange = (v0, angle, g = G) => (v0 * v0 * Math.sin(2 * angle * DEG)) / g;
  // 1-D vertical launch (angle 90 or straight down): same model, x stays 0
  const vertical = (v0, h0 = 0, yLand = 0, g = G) => launch({ v0: Math.abs(v0), angle: v0 >= 0 ? 90 : -90, h0, yLand, g });
  // inverse problems
  const speedFromComponents = (vx, vy) => Math.hypot(vx, vy);
  const angleFromComponents = (vx, vy) => Math.atan2(vy, vx) / DEG;
  // launch speed for a horizontal launch to land a distance R below by h: t = √(2h/g), v = R/t
  const horizontalSpeedFor = (R, h, g = G) => R / Math.sqrt((2 * h) / g);

  // ───────── vectors ─────────
  const components = (mag, angleDeg) => ({ x: mag * Math.cos(angleDeg * DEG), y: mag * Math.sin(angleDeg * DEG) });

  // ───────── units (SI base per dimension) ─────────
  const UNITS = {
    length: { m: 1, cm: 0.01, mm: 0.001, km: 1000 },
    time: { s: 1, ms: 0.001, min: 60 },
    speed: { "m/s": 1, "km/h": 1 / 3.6, "cm/s": 0.01 },
    accel: { "m/s²": 1 },
    angle: { "°": 1, rad: 180 / Math.PI },
    none: { "": 1 },
  };
  const UNIT_ALIASES = { "m/s^2": "m/s²", "m/s2": "m/s²", "deg": "°", "degrees": "°", "degree": "°", "kmh": "km/h", "kph": "km/h", "km/hr": "km/h", "sec": "s", "seconds": "s", "metres": "m", "meters": "m", "metre": "m", "meter": "m", "ms-1": "m/s", "m s-1": "m/s", "mps": "m/s", "radians": "rad" };
  const normUnit = (u) => { const s = String(u || "").trim().replace(/\s+/g, " "); return UNIT_ALIASES[s.toLowerCase()] || s; };
  function dimOf(unit) { for (const [d, us] of Object.entries(UNITS)) if (Object.prototype.hasOwnProperty.call(us, unit)) return d; return null; }
  const toSI = (value, unit) => { const d = dimOf(unit); return d ? value * UNITS[d][unit] : NaN; };
  const fromSI = (value, unit) => { const d = dimOf(unit); return d ? value / UNITS[d][unit] : NaN; };

  // ───────── numbers ─────────
  // accepts 12.5, -3, −3, 1.2e3, 1.2E-3, 1.2×10^3, 1.2 x 10^-3, 1.2*10^3, 1.2·10³, 12,5 (decimal comma)
  const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
  function parseNumber(str) {
    let s = String(str == null ? "" : str).trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
    if (!s) return NaN;
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => "^" + [...m].map((c) => SUP[c]).join(""));
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
    let m = /^([+-]?(?:\d+\.?\d*|\.\d+))(?:[x×*·]10\^?\(?([+-]?\d+)\)?)?$/i.exec(s);
    if (m) return Number(m[1]) * (m[2] !== undefined ? Math.pow(10, Number(m[2])) : 1);
    m = /^[+-]?(?:\d+\.?\d*|\.\d+)e[+-]?\d+$/i.exec(s);
    if (m) return Number(s);
    return NaN;
  }
  // "12.4 m/s", "45°", "3,2 s", "1.2×10^3 m" → { value, unit } (unit "" when absent); a "|" separates value|unit from the input widget
  const ALL_UNITS = () => [...Object.values(UNITS).flatMap((u) => Object.keys(u)), ...Object.keys(UNIT_ALIASES)].filter(Boolean).sort((a, b) => b.length - a.length);
  function parseQty(str) {
    const raw = String(str == null ? "" : str).trim().replace(/[−–]/g, "-");
    if (raw.includes("|")) { const [v, u] = raw.split("|"); return { value: parseNumber(v), unit: normUnit(u) }; }
    // try the longest unit names first, so "m/s" isn't read as "m" and the "e" of 1.2e3 is never taken for a unit
    for (const u of ALL_UNITS()) {
      if (raw.length > u.length && raw.toLowerCase().endsWith(u.toLowerCase()) && (u.length > 1 || raw.endsWith(u))) {
        const v = parseNumber(raw.slice(0, raw.length - u.length));
        if (Number.isFinite(v)) return { value: v, unit: normUnit(raw.slice(raw.length - u.length)) };
      }
    }
    return { value: parseNumber(raw), unit: "" };
  }
  // significant figures
  function roundSig(x, n = 3) { if (!finite(x) || x === 0) return x; const p = Math.ceil(Math.log10(Math.abs(x))); const f = Math.pow(10, n - p); return Math.round(x * f) / f; }
  function sigFigs(str) {
    const s = String(str).trim().replace(/^[+-]/, "").replace(/[x×*·]10\^?.*$|e.*$/i, "");
    if (!/^\d*\.?\d*$/.test(s) || !/\d/.test(s)) return null;
    const digits = s.replace(".", "").replace(/^0+/, "");
    if (s.includes(".")) return digits.length || 1;
    return digits.replace(/0+$/, "").length || 1; // trailing zeros without a decimal point are ambiguous: not counted
  }
  // a tidy display value: n significant figures, no float noise, minus sign as −
  function fmt(x, n = 3) {
    if (!finite(x)) return "—";
    const r = roundSig(x, n), a = Math.abs(r);
    let s;
    if (a !== 0 && (a >= 1e6 || a < 1e-3)) s = r.toExponential(n - 1).replace(/e\+?(-?)(\d+)/, "×10^$1$2");
    else s = r.toFixed(a === 0 ? 0 : Math.max(0, n - Math.floor(Math.log10(a)) - 1));
    return s.replace(/^-/, "−");
  }
  const fmtTeX = (x, n = 3) => fmt(x, n).replace(/×10\^(−?-?\d+)/, (m, e) => `\\times 10^{${e.replace("−", "-")}}`).replace(/−/g, "-");

  const api = { G, DEG, launch, stateAt, timesAtHeight, samples, sameHeightRange, vertical, speedFromComponents, angleFromComponents, horizontalSpeedFor, components, UNITS, normUnit, dimOf, toSI, fromSI, parseNumber, parseQty, roundSig, sigFigs, fmt, fmtTeX };
  root.PhysModel = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
