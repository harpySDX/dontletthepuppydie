/*
 * PHYSICS GENERATOR KIT — shared helpers for the physics question families (js/physics/gen-*.js).
 *
 * A physics question is a Bank "wr" question with:
 *   stem      localized text {en, fr, es, de, zh}
 *   fig       optional figure spec rendered by js/physics/figures.js (scene · vector · graph · table)
 *   parts     [{ key, kind: "qty" | "pmc" | "order", prompt (localized), skills: [skill ids], … }] — answered in order;
 *             later parts may use earlier results (multi-step problems)
 *   scaffold  localized guidance shown up front at Simple (the steps to follow)
 *   hints     localized, revealed one at a time on request
 *   solution  localized worked steps, built from the SAME model values as the keys
 * Every number comes from PhysModel (js/physics/model.js); generators choose parameters from valid ranges and use
 * the model (or an inverse solve) so every problem has exactly the answer the key says.
 */
(function (root) {
  "use strict";
  const LANGS = ["en", "fr", "es", "de", "zh"];
  const P = () => root.PhysModel;
  const L = (en, fr, es, de, zh) => ({ en, fr, es, de, zh });
  // fill {placeholders} per language; a placeholder value may itself be localized
  const fill = (t, vars = {}) => Object.fromEntries(LANGS.map((l) => [l, (typeof t === "string" ? t : t[l]).replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : typeof vars[k] === "object" ? vars[k][l] : String(vars[k])))]));
  const join = (...ts) => Object.fromEntries(LANGS.map((l) => [l, ts.filter(Boolean).map((t) => (typeof t === "string" ? t : t[l])).join(" ")]));
  const same = (s) => Object.fromEntries(LANGS.map((l) => [l, s])); // language-neutral text (maths)

  // numbers as students see them: 3 significant figures, proper minus
  const n3 = (x) => P().fmt(x, 3);
  const q = (x, unit) => `${n3(x)} ${unit}`;
  const tex = (x) => P().fmtTeX(x, 3);

  const DEFAULT_UNITS = { length: ["m", "cm", "km"], time: ["s", "ms"], speed: ["m/s", "km/h"], angle: ["°", "rad"], accel: ["m/s²"], none: [""] };
  // a quantity answer (SI value) with its unit menu, tolerance and named wrong paths
  function qty(key, prompt, dim, answer, o = {}) {
    return { key, kind: "qty", prompt, dim, answer, units: o.units || DEFAULT_UNITS[dim], marks: o.marks || 1, tol: o.tol, signed: o.signed, magnitude: o.magnitude, positive: o.positive, wrongs: (o.wrongs || []).filter((w) => Number.isFinite(w.value) && Math.abs(w.value - answer) > Math.max((o.tol === undefined ? 0.01 : o.tol) * 2 * Math.abs(answer), 1e-6)), skills: o.skills || [], label: o.label }; // a "mistake" that happens to give the right number isn't a mistake
  }
  // one choice from options (localized); the key is placed at a random position; `values` (numbers) let the validator
  // reject two options that are secretly equal
  // correct / each wrong option: localized text, or { t: text, v?: number, why?: {key, cat}, fig?: figure spec }
  function pmc(r, key, prompt, correct, wrongOpts, o = {}) {
    const wrap = (x, ok) => (x && x.t ? { ...x, ok } : { t: x, ok });
    const all = [wrap(correct, true), ...wrongOpts.map((w) => wrap(w, false))];
    if (o.value !== undefined) all[0].v = o.value;
    const sh = o.keepOrder ? all : shuffle(r, all);
    const why = {}; sh.forEach((x, i) => { if (x.why) why[i] = x.why; });
    const out = { key, kind: "pmc", prompt, options: sh.map((x) => x.t), answer: sh.findIndex((x) => x.ok), marks: o.marks || 1, skills: o.skills || [], why, label: o.label };
    if (sh.some((x) => x.fig)) out.figs = sh.map((x) => x.fig || null);
    if (sh.some((x) => Number.isFinite(x.v))) out.values = sh.map((x) => (Number.isFinite(x.v) ? x.v : String(x.t.en)));
    return out;
  }
  function order(r, key, prompt, steps, o = {}) {
    // steps given in the correct order; shown shuffled (never already in order)
    let idx = steps.map((_, i) => i), tries = 0;
    do { idx = shuffle(r, idx); tries++; } while (idx.every((x, i) => x === i) && tries < 20);
    return { key, kind: "order", prompt, steps: idx.map((i) => steps[i]), answer: steps.map((_, i) => idx.indexOf(i)), marks: o.marks || 1, skills: o.skills || [] };
  }
  function shuffle(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const between = (r, a, b, step = 1) => a + step * Math.floor(r() * (Math.floor((b - a) / step) + 1));

  // ───────── shared phrases ─────────
  const T = {
    model: L("Use g = 9.81 m/s² and ignore air resistance.", "Prenez g = 9,81 m/s² et négligez la résistance de l'air.", "Usa g = 9,81 m/s² e ignora la resistencia del aire.", "Verwende g = 9,81 m/s² und vernachlässige den Luftwiderstand.", "取 g = 9.81 m/s²，忽略空气阻力。"),
    upPos: L("Take up as positive.", "Prenez le haut comme sens positif.", "Toma hacia arriba como positivo.", "Nimm „nach oben“ als positiv.", "取向上为正方向。"),
    // part prompts
    vx: L("Horizontal component of the launch velocity, \\(v_{0x}\\)", "Composante horizontale de la vitesse initiale, \\(v_{0x}\\)", "Componente horizontal de la velocidad inicial, \\(v_{0x}\\)", "Horizontale Komponente der Anfangsgeschwindigkeit, \\(v_{0x}\\)", "初速度的水平分量 \\(v_{0x}\\)"),
    vy: L("Vertical component of the launch velocity, \\(v_{0y}\\)", "Composante verticale de la vitesse initiale, \\(v_{0y}\\)", "Componente vertical de la velocidad inicial, \\(v_{0y}\\)", "Vertikale Komponente der Anfangsgeschwindigkeit, \\(v_{0y}\\)", "初速度的竖直分量 \\(v_{0y}\\)"),
    tof: L("Time of flight (launch to landing)", "Durée du vol (du lancer à l'atterrissage)", "Tiempo de vuelo (del lanzamiento al aterrizaje)", "Flugzeit (vom Abwurf bis zur Landung)", "飞行时间（从抛出到落地）"),
    tApex: L("Time to reach the highest point", "Temps pour atteindre le point le plus haut", "Tiempo para llegar al punto más alto", "Zeit bis zum höchsten Punkt", "到达最高点所用的时间"),
    hMaxAboveLaunch: L("Maximum height above the launch point", "Hauteur maximale au-dessus du point de lancement", "Altura máxima sobre el punto de lanzamiento", "Maximale Höhe über dem Abwurfpunkt", "相对抛出点的最大高度"),
    hMaxAboveGround: L("Maximum height above the ground", "Hauteur maximale au-dessus du sol", "Altura máxima sobre el suelo", "Maximale Höhe über dem Boden", "相对地面的最大高度"),
    range: L("Horizontal distance travelled before landing", "Distance horizontale parcourue avant l'atterrissage", "Distancia horizontal recorrida antes de aterrizar", "Horizontale Strecke bis zur Landung", "落地前的水平位移"),
    impactSpeed: L("Speed just before landing", "Vitesse juste avant l'atterrissage", "Rapidez justo antes de aterrizar", "Geschwindigkeitsbetrag kurz vor der Landung", "落地前瞬间的速率"),
    impactAngle: L("Angle of the velocity below the horizontal just before landing", "Angle de la vitesse sous l'horizontale juste avant l'atterrissage", "Ángulo de la velocidad bajo la horizontal justo antes de aterrizar", "Winkel der Geschwindigkeit unter der Horizontalen kurz vor der Landung", "落地前瞬间速度与水平方向向下的夹角"),
    impactVy: L("Vertical velocity just before landing, \\(v_y\\) (up positive)", "Vitesse verticale juste avant l'atterrissage, \\(v_y\\) (haut positif)", "Velocidad vertical justo antes de aterrizar, \\(v_y\\) (arriba positivo)", "Vertikalgeschwindigkeit kurz vor der Landung, \\(v_y\\) (oben positiv)", "落地前瞬间的竖直速度 \\(v_y\\)（向上为正）"),
    vyAt: L("Vertical velocity \\(v_y\\) at t = {t} (up positive)", "Vitesse verticale \\(v_y\\) à t = {t} (haut positif)", "Velocidad vertical \\(v_y\\) en t = {t} (arriba positivo)", "Vertikalgeschwindigkeit \\(v_y\\) bei t = {t} (oben positiv)", "t = {t} 时的竖直速度 \\(v_y\\)（向上为正）"),
    vxAt: L("Horizontal velocity \\(v_x\\) at t = {t}", "Vitesse horizontale \\(v_x\\) à t = {t}", "Velocidad horizontal \\(v_x\\) en t = {t}", "Horizontalgeschwindigkeit \\(v_x\\) bei t = {t}", "t = {t} 时的水平速度 \\(v_x\\)"),
    speedAt: L("Speed at t = {t}", "Vitesse (norme) à t = {t}", "Rapidez en t = {t}", "Geschwindigkeitsbetrag bei t = {t}", "t = {t} 时的速率"),
    xAt: L("Horizontal position x at t = {t}", "Position horizontale x à t = {t}", "Posición horizontal x en t = {t}", "Horizontale Position x bei t = {t}", "t = {t} 时的水平位置 x"),
    yAt: L("Height above the launch point at t = {t} (up positive)", "Hauteur par rapport au point de lancement à t = {t} (haut positif)", "Altura respecto al punto de lanzamiento en t = {t} (arriba positivo)", "Höhe relativ zum Abwurfpunkt bei t = {t} (oben positiv)", "t = {t} 时相对抛出点的高度（向上为正）"),
    v0: L("Launch speed \\(v_0\\)", "Vitesse initiale \\(v_0\\)", "Rapidez de lanzamiento \\(v_0\\)", "Abwurfgeschwindigkeit \\(v_0\\)", "初速率 \\(v_0\\)"),
    theta: L("Launch angle above the horizontal, θ", "Angle de lancement au-dessus de l'horizontale, θ", "Ángulo de lanzamiento sobre la horizontal, θ", "Abwurfwinkel über der Horizontalen, θ", "抛射角（与水平方向的夹角）θ"),
    risingFalling: L("At that moment the object is…", "À cet instant, l'objet…", "En ese instante el objeto…", "In diesem Moment…", "此刻物体正在……"),
    rising: L("rising", "monte", "sube", "steigt es", "上升"),
    falling: L("falling", "descend", "baja", "fällt es", "下落"),
    atTop: L("exactly at the top", "est exactement au sommet", "está justo en el punto más alto", "ist es genau am höchsten Punkt", "正好在最高点"),
    stopped: L("not moving at all", "est immobile", "está quieto", "bewegt es sich gar nicht", "完全静止"),
  };
  // the skills the diagnostics track (ids → localized labels live in js/i18n-physics.js as "phs.<id>")
  const SKILLS = ["decomp", "signs", "horizontal", "vertical", "equations", "time", "maxh", "range", "unequal", "graphs", "units", "concepts"];

  // French, Spanish and German write decimals with a comma (the curriculum's own text already does): every localized
  // string in a finished question gets 12,5 in prose and 12{,}5 inside \( … \) so TeX doesn't add a space.
  // Answers are accepted either way (PhysModel.parseNumber reads a decimal comma).
  const COMMA = new Set(["fr", "es", "de"]);
  const commaText = (str) => String(str).split(/(\\\(.*?\\\)|\\\[.*?\\\])/s).map((seg, i) => seg.replace(/(\d)\.(\d)/g, i % 2 ? "$1{,}$2" : "$1,$2")).join("");
  function localizeDecimals(x) {
    if (Array.isArray(x)) return x.map(localizeDecimals);
    if (!x || typeof x !== "object") return x;
    if (typeof x.en === "string" && typeof x.fr === "string") { const o = { ...x }; for (const l of COMMA) if (typeof o[l] === "string") o[l] = commaText(o[l]); return o; }
    const o = {}; for (const [k, v] of Object.entries(x)) o[k] = k === "fig" || k === "figs" || k === "wrongs" ? v : localizeDecimals(v); return o;
  }
  root.PhysKit = { LANGS, L, fill, localizeDecimals, commaText, join, same, n3, q, tex, qty, pmc, order, shuffle, pick, between, T, SKILLS, DEFAULT_UNITS };
})(typeof window !== "undefined" ? window : globalThis);
