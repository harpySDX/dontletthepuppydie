/*
 * PHYSCHECK — unit-aware answer checking for physics (plugs into MathCheck.grade and Bank.keyResponse).
 *
 *   qty    a number with a unit. The response is "value|unit" from the input widget (or free text like "12.4 m/s").
 *          The value is converted to SI with the chosen unit and compared with a relative tolerance (default 1 %,
 *          i.e. 3 significant figures; g = 9.8 vs 9.81 stays inside it). Never accepted "because it's close":
 *            • a unit of the wrong kind (seconds for a distance) is wrong, and says so;
 *            • a number that only fits a DIFFERENT unit than the one chosen is wrong ("convert, or change the unit");
 *            • the right size with the wrong sign is wrong (up is positive), unless spec.signed === false;
 *            • known wrong paths (sin/cos swapped, forgot ½, radians, wrong landing height …) are named, with a
 *              diagnostic category, only when the response actually matches that wrong value.
 *   pmc    one option out of several (conceptual, equation choice, error analysis, "can't be determined").
 *   order  steps put in order; the response is the order of step indices "2,0,1,3".
 *
 * Every result: { earned, max, verdict, note (English), noteKey, noteVars, cat } — cat is a diagnostic category
 * (sign · unit · numerical · equation · conceptual · algebra) or "" when the answer gives no evidence of why.
 */
(function (root) {
  "use strict";
  const M = () => root.PhysModel;
  const KINDS = new Set(["qty", "pmc", "order"]);
  const EN = {
    "ph.note.blank": "No answer.",
    "ph.note.number": "Write a number, e.g. 12.4, −3.5 or 1.2×10^3.",
    "ph.note.unit": "Choose a unit.",
    "ph.note.dim": "{unit} isn't a unit of {want}.",
    "ph.note.unitSlip": "Your number would fit {right}, but you chose {chosen}. Convert it, or change the unit.",
    "ph.note.sign": "Right size, wrong sign: with up as positive, check the direction.",
    "ph.note.magnitude": "A speed (or any magnitude) is never negative.",
    "ph.note.positive": "This quantity can't be negative here.",
    "ph.note.round": "Close. Check your rounding: keep 3 significant figures and don't round in the middle.",
    "ph.note.order": "Step {n} is out of place.",
    // named wrong paths (only reported when the typed value really matches that mistake)
    "ph.w.sincos": "That's the other component: sin and cos are swapped. Horizontal uses cos θ, vertical uses sin θ (θ from the horizontal).",
    "ph.w.radians": "Your calculator seems to be in radians. Switch it to degrees.",
    "ph.w.half": "The ½ in ½gt² is missing.",
    "ph.w.signG": "Gravity points down: with up positive, use −g (−9.81 m/s²).",
    "ph.w.earlyRoot": "That's the earlier time. The projectile reaches that height on the way up; it lands at the later time.",
    "ph.w.apexTime": "That's the time to the top only. Time of flight is the whole trip.",
    "ph.w.rangeFormula": "R = v₀² sin 2θ / g only works when launch and landing heights are equal. Solve the vertical motion for the landing time instead.",
    "ph.w.heightIgnored": "The launch height was left out. Measure heights from the same level throughout.",
    "ph.w.noSqrt": "Square root missing: t = √(2h / g).",
    "ph.w.vertical": "That's only the vertical part. The question asks for the full speed: √(vₓ² + v_y²).",
    "ph.w.horizontal": "That's only the horizontal part. Combine both components.",
    "ph.w.aboveLaunch": "That's the height above the launch point. The question asks for the height above the ground.",
    "ph.w.vxChanges": "The horizontal velocity doesn't change during the flight (no air resistance).",
    "ph.w.complement": "That's the angle from the vertical. Measure it from the horizontal.",
    "ph.w.noConvert": "Convert km/h to m/s first (÷ 3.6).",
  };
  const en = (key, vars) => (EN[key] || key).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
  const R = (max) => ({ earned: max, max, verdict: "right", note: "", noteKey: "", noteVars: null, cat: "" });
  const W = (max, key, vars, cat) => ({ earned: 0, max, verdict: "wrong", note: key ? (EN[key] ? en(key, vars) : (vars && vars.en) || "") : "", noteKey: key || "", noteVars: vars || null, cat: cat || "" });
  const near = (a, b, tol, abs) => Math.abs(a - b) <= Math.max(tol * Math.abs(b), abs);

  function grade(spec, response) {
    const max = spec.marks || 1;
    if (response === undefined || response === null || String(response).trim() === "" || /^\s*\|/.test(String(response))) return { earned: 0, max, verdict: "blank", note: "No answer.", noteKey: "ph.note.blank", noteVars: null, cat: "" };
    if (spec.kind === "pmc") {
      const r = Number(response);
      if (r === Number(spec.answer)) return R(max);
      const why = spec.why && spec.why[r];
      return W(max, why ? why.key : "", why ? why.vars : null, why ? why.cat : "conceptual");
    }
    if (spec.kind === "order") {
      const got = String(response).split(",").map(Number), want = spec.answer;
      if (got.length === want.length && got.every((x, i) => x === want[i])) return R(max);
      const first = got.findIndex((x, i) => x !== want[i]);
      return W(max, "ph.note.order", { n: first + 1 }, "equation");
    }
    if (spec.kind === "qty") {
      const P = M(), q = P.parseQty(response);
      if (!Number.isFinite(q.value)) return W(max, "ph.note.number", null, "");
      const units = spec.units || Object.keys(P.UNITS[spec.dim] || { "": 1 });
      let unit = q.unit;
      if (!unit) { if (spec.dim === "none") unit = ""; else if (units.length === 1) unit = units[0]; else return W(max, "ph.note.unit", null, "unit"); }
      const d = P.dimOf(unit);
      if (d !== spec.dim) return W(max, "ph.note.dim", { unit, want: spec.dim, wantKey: "ph.dim." + spec.dim }, "unit");
      const si = P.toSI(q.value, unit), ans = Number(spec.answer), tol = spec.tol === undefined ? 0.01 : spec.tol, abs = spec.abs === undefined ? 1e-9 : spec.abs;
      if (near(si, ans, tol, abs)) return R(max);
      if (spec.signed === false && near(Math.abs(si), Math.abs(ans), tol, abs)) return R(max);
      // the typed number fits the answer in another unit of the same kind: a conversion slip, not a right answer
      for (const u of Object.keys(P.UNITS[spec.dim])) if (u !== unit && near(P.toSI(q.value, u), ans, tol, abs)) return W(max, "ph.note.unitSlip", { right: u, chosen: unit }, "unit");
      if (ans !== 0 && near(-si, ans, tol, abs)) return W(max, spec.magnitude ? "ph.note.magnitude" : spec.positive ? "ph.note.positive" : "ph.note.sign", null, "sign");
      for (const w of spec.wrongs || []) if (Number.isFinite(w.value) && Math.abs(w.value - ans) > Math.max(tol * Math.abs(ans), abs) && near(si, w.value, tol, abs)) return W(max, w.key, w.vars, w.cat || "");
      if (near(si, ans, Math.max(0.04, 3 * tol), abs * 3)) return W(max, "ph.note.round", null, "numerical");
      return W(max, "", null, "");
    }
    throw new Error("PhysCheck can't grade " + spec.kind);
  }
  function keyResponse(spec) {
    if (spec.kind === "qty") { const P = M(), units = spec.units || Object.keys(P.UNITS[spec.dim]); const u = units[0]; return `${P.fromSI(Number(spec.answer), u)}|${u}`; }
    if (spec.kind === "pmc") return String(spec.answer);
    if (spec.kind === "order") return spec.answer.join(",");
    return String(spec.answer);
  }

  // Extra checks on every generated physics question (called by Bank before a question can be shown):
  // options are distinct, no "known wrong value" coincides with the key (so a correct answer is never mislabelled),
  // no other option of a pmc part is also correct by value, and every part has text in every language.
  function validate(q) {
    const LANGS = ["en", "fr", "es", "de", "zh"];
    const hasAll = (t) => t && (typeof t === "string" || LANGS.every((l) => typeof t[l] === "string" && t[l].length));
    if (!hasAll(q.stem)) throw new Error("stem text");
    for (const p of q.parts) {
      if (!hasAll(p.prompt)) throw new Error("prompt text " + p.key);
      if (p.kind === "pmc") {
        const keys = p.options.map((o) => (typeof o === "string" ? o : o.en));
        if (new Set(keys).size !== keys.length) throw new Error("duplicate options");
        if (p.values) { const v = p.values.map((x) => (Number.isFinite(x) ? Math.round(x * 1000) : String(x))); if (new Set(v).size !== v.length) throw new Error("equal-valued options"); }
        if (!(p.answer >= 0 && p.answer < p.options.length)) throw new Error("pmc key");
        if (!p.options.every(hasAll)) throw new Error("option text");
      }
      if (p.kind === "qty") {
        if (!Number.isFinite(Number(p.answer))) throw new Error("qty key");
        const tol = p.tol === undefined ? 0.01 : p.tol;
        for (const w of p.wrongs || []) if (Number.isFinite(w.value) && Math.abs(w.value - p.answer) <= Math.max(tol * Math.abs(p.answer), 1e-9)) throw new Error("a wrong path equals the key");
      }
      if (p.kind === "order" && (!Array.isArray(p.answer) || p.answer.length !== p.steps.length)) throw new Error("order key");
    }
    if (!Array.isArray(q.hints) || !q.hints.length || !q.hints.every(hasAll)) throw new Error("hints");
    if (!Array.isArray(q.solution) || !q.solution.length || !q.solution.every(hasAll)) throw new Error("solution");
  }

  const api = { KINDS, handles: (k) => KINDS.has(k), grade, keyResponse, validate, EN };
  root.PhysCheck = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
