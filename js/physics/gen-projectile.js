/*
 * PHYSICS 11 — projectile motion question families (numeric, unit-aware). Text in en/fr/es/de/zh.
 * Every value comes from PhysModel.launch / stateAt; parameters are drawn from ranges that keep the scenario
 * physically valid (the landing surface is really reached, on the way down, at a sensible distance).
 */
(function (root) {
  "use strict";
  const B = root.Bank, P = root.PhysModel, K = root.PhysKit;
  if (!B || !P || !K) return;
  const { L, fill, join, n3, q, tex, qty, pmc, pick, between, T } = K;
  const G = P.G;
  const fam = (F) => B.family({ subject: "physics", unit: "PC", kinds: ["wr"], answer: "qty", tags: ["physics"], ...F });
  const LV = (mode) => ["simple", "normal", "challenge", "nightmare"].indexOf(mode);
  const deg = (x) => `${Math.round(x * 10) / 10}°`;

  // ───────── scenarios (who/what is launched, and from where) ─────────
  const HORIZ = [
    { id: "bench", h: [0.8, 1.5], v: [1, 4], t: L("A marble rolls off a lab bench {h} high at {v}.", "Une bille roule hors d'une paillasse de {h} de haut à {v}.", "Una canica rueda fuera de una mesa de laboratorio de {h} de altura a {v}.", "Eine Murmel rollt mit {v} von einem {h} hohen Labortisch.", "一颗弹珠以 {v} 的速度滚出 {h} 高的实验台。") },
    { id: "cliff", h: [12, 60], v: [4, 18], t: L("A stone is thrown horizontally at {v} from the top of a cliff {h} above the water.", "Une pierre est lancée horizontalement à {v} du haut d'une falaise à {h} au-dessus de l'eau.", "Se lanza una piedra horizontalmente a {v} desde lo alto de un acantilado a {h} sobre el agua.", "Ein Stein wird mit {v} waagerecht von einer Klippe {h} über dem Wasser geworfen.", "从高出水面 {h} 的悬崖顶以 {v} 的速度水平抛出一块石头。") },
    { id: "roof", h: [6, 25], v: [3, 12], t: L("A ball rolls off a flat roof {h} above the ground with a speed of {v}.", "Un ballon roule hors d'un toit plat à {h} du sol avec une vitesse de {v}.", "Una pelota rueda fuera de un techo plano a {h} del suelo con una rapidez de {v}.", "Ein Ball rollt mit {v} von einem flachen Dach {h} über dem Boden.", "一个球以 {v} 的速度从离地 {h} 的平屋顶滚落。") },
    { id: "drone", h: [15, 45], v: [5, 15], t: L("A drone flying level at {v}, {h} above a field, releases a parcel.", "Un drone volant à l'horizontale à {v}, à {h} au-dessus d'un champ, lâche un colis.", "Un dron que vuela horizontalmente a {v}, a {h} sobre un campo, suelta un paquete.", "Eine Drohne fliegt waagerecht mit {v} in {h} Höhe über einem Feld und lässt ein Paket fallen.", "一架无人机在离田地 {h} 的高度以 {v} 水平飞行，投下一个包裹。") },
    { id: "jump", h: [2, 6], v: [2, 7], t: L("A skateboarder rolls off a ledge {h} high at {v}.", "Un planchiste quitte une corniche de {h} de haut à {v}.", "Un skater sale de un borde de {h} de altura a {v}.", "Ein Skater fährt mit {v} über eine {h} hohe Kante.", "一名滑板运动员以 {v} 的速度从 {h} 高的台阶边缘冲出。") },
  ];
  const ANGLED = [
    { id: "kick", v: [12, 26], t: L("A soccer ball is kicked at {v} at {a} above the horizontal", "Un ballon de soccer est frappé à {v}, à {a} au-dessus de l'horizontale", "Se patea un balón a {v} con {a} sobre la horizontal", "Ein Fußball wird mit {v} unter {a} zur Horizontalen geschossen", "一个足球以 {v}、与水平方向成 {a} 的角度被踢出") },
    { id: "golf", v: [20, 40], t: L("A golf ball leaves the club at {v}, {a} above the horizontal", "Une balle de golf quitte le bâton à {v}, à {a} au-dessus de l'horizontale", "Una pelota de golf sale del palo a {v}, {a} sobre la horizontal", "Ein Golfball verlässt den Schläger mit {v} unter {a} zur Horizontalen", "高尔夫球以 {v}、与水平方向成 {a} 的角度离开球杆") },
    { id: "hose", v: [8, 16], t: L("Water leaves a hose nozzle at {v}, aimed {a} above the horizontal", "L'eau sort d'une lance d'arrosage à {v}, dirigée à {a} au-dessus de l'horizontale", "El agua sale de una manguera a {v}, apuntando {a} sobre la horizontal", "Wasser verlässt eine Schlauchdüse mit {v}, {a} über die Horizontale gerichtet", "水以 {v} 从水管喷嘴喷出，方向与水平方向成 {a}") },
    { id: "ball", v: [10, 22], t: L("A ball is thrown at {v} at {a} above the horizontal", "Une balle est lancée à {v} à {a} au-dessus de l'horizontale", "Se lanza una pelota a {v} con {a} sobre la horizontal", "Ein Ball wird mit {v} unter {a} zur Horizontalen geworfen", "一个球以 {v}、与水平方向成 {a} 的角度被抛出") },
    { id: "frog", v: [3, 6], t: L("A frog jumps at {v} at {a} above the horizontal", "Une grenouille saute à {v} à {a} au-dessus de l'horizontale", "Una rana salta a {v} con {a} sobre la horizontal", "Ein Frosch springt mit {v} unter {a} zur Horizontalen", "一只青蛙以 {v}、与水平方向成 {a} 的角度跳起") },
  ];
  const levelGround = L("from level ground and lands on level ground.", "depuis un sol plat et retombe sur le même sol plat.", "desde un suelo llano y cae al mismo suelo llano.", "vom ebenen Boden ab und landet wieder auf ihm.", "从水平地面出发，落回同一水平地面。");
  const fromHeight = L("from a point {h} above the ground, and lands on the ground below.", "depuis un point à {h} au-dessus du sol, et retombe sur le sol en contrebas.", "desde un punto a {h} sobre el suelo, y cae al suelo de abajo.", "von einem Punkt {h} über dem Boden ab und landet unten auf dem Boden.", "从离地 {h} 的位置出发，落到下方地面。");
  const ontoPlatform = L("from the ground and lands on top of a platform {h} high (on the way down).", "depuis le sol et retombe sur une plateforme de {h} de haut (en descendant).", "desde el suelo y cae sobre una plataforma de {h} de altura (de bajada).", "vom Boden ab und landet (im Fallen) auf einer {h} hohen Plattform.", "从地面出发，在下落过程中落到高 {h} 的平台上。");

  const units = (dim) => K.DEFAULT_UNITS[dim];
  const wrongsVxVy = (v0, a, which) => {
    const c = Math.cos(a * P.DEG), s = Math.sin(a * P.DEG);
    const vRad = which === "x" ? v0 * Math.cos(a) : v0 * Math.sin(a);
    return [{ value: which === "x" ? v0 * s : v0 * c, key: "ph.w.sincos", cat: "equation" }, { value: vRad, key: "ph.w.radians", cat: "units" }];
  };
  const hintsFor = {
    comp: [L("Draw the velocity vector and its two components as a right triangle.", "Dessinez le vecteur vitesse et ses deux composantes en triangle rectangle.", "Dibuja el vector velocidad y sus dos componentes como un triángulo rectángulo.", "Zeichne den Geschwindigkeitsvektor und seine zwei Komponenten als rechtwinkliges Dreieck.", "画出速度矢量及其两个分量，组成直角三角形。"),
      L("θ is measured from the horizontal, so \\(v_{0x} = v_0\\cos\\theta\\) and \\(v_{0y} = v_0\\sin\\theta\\).", "θ est mesuré depuis l'horizontale : \\(v_{0x} = v_0\\cos\\theta\\) et \\(v_{0y} = v_0\\sin\\theta\\).", "θ se mide desde la horizontal: \\(v_{0x} = v_0\\cos\\theta\\) y \\(v_{0y} = v_0\\sin\\theta\\).", "θ wird von der Horizontalen gemessen: \\(v_{0x} = v_0\\cos\\theta\\), \\(v_{0y} = v_0\\sin\\theta\\).", "θ 从水平方向量起，所以 \\(v_{0x} = v_0\\cos\\theta\\)，\\(v_{0y} = v_0\\sin\\theta\\)。")],
    vert: [L("Treat the vertical motion on its own: \\(a_y = -g\\).", "Traitez le mouvement vertical seul : \\(a_y = -g\\).", "Trata el movimiento vertical por separado: \\(a_y = -g\\).", "Betrachte die vertikale Bewegung für sich: \\(a_y = -g\\).", "单独分析竖直方向的运动：\\(a_y = -g\\)。"),
      L("At the highest point \\(v_y = 0\\). Landing: solve \\(y(t) = y_{\\text{land}}\\) and keep the later time.", "Au point le plus haut \\(v_y = 0\\). Atterrissage : résolvez \\(y(t) = y_{\\text{sol}}\\) et gardez le temps le plus tardif.", "En el punto más alto \\(v_y = 0\\). Aterrizaje: resuelve \\(y(t) = y_{\\text{suelo}}\\) y quédate con el tiempo mayor.", "Am höchsten Punkt ist \\(v_y = 0\\). Landung: löse \\(y(t) = y_{\\text{Boden}}\\) und nimm die spätere Zeit.", "最高点处 \\(v_y = 0\\)。落地：解 \\(y(t) = y_{\\text{地}}\\)，取较晚的时间。")],
    horiz: [L("The horizontal velocity stays the same the whole flight: \\(x = v_{0x} t\\).", "La vitesse horizontale reste la même pendant tout le vol : \\(x = v_{0x} t\\).", "La velocidad horizontal no cambia durante el vuelo: \\(x = v_{0x} t\\).", "Die Horizontalgeschwindigkeit bleibt im ganzen Flug gleich: \\(x = v_{0x} t\\).", "整个飞行过程中水平速度不变：\\(x = v_{0x} t\\)。"),
      L("Time links the two directions: find t from the vertical motion, then use it horizontally.", "Le temps relie les deux directions : trouvez t avec le mouvement vertical, puis utilisez-le à l'horizontale.", "El tiempo une las dos direcciones: halla t con el movimiento vertical y úsalo en la horizontal.", "Die Zeit verbindet beide Richtungen: bestimme t aus der Vertikalbewegung und nutze es horizontal.", "时间把两个方向联系起来：先由竖直运动求 t，再用于水平方向。")],
    impact: [L("Combine the components: speed \\(= \\sqrt{v_x^2 + v_y^2}\\), angle \\(= \\tan^{-1}(|v_y| / v_x)\\).", "Combinez les composantes : vitesse \\(= \\sqrt{v_x^2 + v_y^2}\\), angle \\(= \\tan^{-1}(|v_y| / v_x)\\).", "Combina las componentes: rapidez \\(= \\sqrt{v_x^2 + v_y^2}\\), ángulo \\(= \\tan^{-1}(|v_y| / v_x)\\).", "Kombiniere die Komponenten: Betrag \\(= \\sqrt{v_x^2 + v_y^2}\\), Winkel \\(= \\tan^{-1}(|v_y| / v_x)\\).", "合成两个分量：速率 \\(= \\sqrt{v_x^2 + v_y^2}\\)，角度 \\(= \\tan^{-1}(|v_y| / v_x)\\)。")],
  };
  const S = { // solution step templates
    comp: L("\\(v_{0x} = {v0}\\cos {a} = {vx}\\ \\text{m/s}\\), \\(v_{0y} = {v0}\\sin {a} = {vy}\\ \\text{m/s}\\).", "\\(v_{0x} = {v0}\\cos {a} = {vx}\\ \\text{m/s}\\), \\(v_{0y} = {v0}\\sin {a} = {vy}\\ \\text{m/s}\\).", "\\(v_{0x} = {v0}\\cos {a} = {vx}\\ \\text{m/s}\\), \\(v_{0y} = {v0}\\sin {a} = {vy}\\ \\text{m/s}\\).", "\\(v_{0x} = {v0}\\cos {a} = {vx}\\ \\text{m/s}\\), \\(v_{0y} = {v0}\\sin {a} = {vy}\\ \\text{m/s}\\).", "\\(v_{0x} = {v0}\\cos {a} = {vx}\\ \\text{m/s}\\)，\\(v_{0y} = {v0}\\sin {a} = {vy}\\ \\text{m/s}\\)。"),
    apex: L("Top: \\(v_y = 0\\), so \\(t_{\\text{top}} = v_{0y}/g = {ta}\\ \\text{s}\\) and the rise is \\(v_{0y}^2/2g = {rise}\\ \\text{m}\\).", "Sommet : \\(v_y = 0\\), donc \\(t_{\\text{haut}} = v_{0y}/g = {ta}\\ \\text{s}\\) et la montée vaut \\(v_{0y}^2/2g = {rise}\\ \\text{m}\\).", "Cima: \\(v_y = 0\\), así que \\(t_{\\text{alto}} = v_{0y}/g = {ta}\\ \\text{s}\\) y la subida es \\(v_{0y}^2/2g = {rise}\\ \\text{m}\\).", "Scheitel: \\(v_y = 0\\), also \\(t_{\\text{oben}} = v_{0y}/g = {ta}\\ \\text{s}\\), Steighöhe \\(v_{0y}^2/2g = {rise}\\ \\text{m}\\).", "最高点：\\(v_y = 0\\)，所以 \\(t_{\\text{顶}} = v_{0y}/g = {ta}\\ \\text{s}\\)，上升高度 \\(v_{0y}^2/2g = {rise}\\ \\text{m}\\)。"),
    land: L("Landing: \\({dy} = {vy}\\,t - \\tfrac12(9.81)t^2\\). The later root is \\(t = {T}\\ \\text{s}\\).", "Atterrissage : \\({dy} = {vy}\\,t - \\tfrac12(9.81)t^2\\). La racine la plus tardive est \\(t = {T}\\ \\text{s}\\).", "Aterrizaje: \\({dy} = {vy}\\,t - \\tfrac12(9.81)t^2\\). La raíz mayor es \\(t = {T}\\ \\text{s}\\).", "Landung: \\({dy} = {vy}\\,t - \\tfrac12(9.81)t^2\\). Die spätere Lösung ist \\(t = {T}\\ \\text{s}\\).", "落地：\\({dy} = {vy}\\,t - \\tfrac12(9.81)t^2\\)，取较晚的根 \\(t = {T}\\ \\text{s}\\)。"),
    rangeS: L("Horizontally: \\(x = v_{0x} t = {vx} \\times {T} = {R}\\ \\text{m}\\).", "À l'horizontale : \\(x = v_{0x} t = {vx} \\times {T} = {R}\\ \\text{m}\\).", "En horizontal: \\(x = v_{0x} t = {vx} \\times {T} = {R}\\ \\text{m}\\).", "Horizontal: \\(x = v_{0x} t = {vx} \\times {T} = {R}\\ \\text{m}\\).", "水平方向：\\(x = v_{0x} t = {vx} \\times {T} = {R}\\ \\text{m}\\)。"),
    impactS: L("At landing \\(v_y = v_{0y} - gt = {vyI}\\ \\text{m/s}\\); speed \\(= \\sqrt{{vx}^2 + ({vyI})^2} = {sp}\\ \\text{m/s}\\), {ang} below the horizontal.", "À l'atterrissage \\(v_y = v_{0y} - gt = {vyI}\\ \\text{m/s}\\) ; vitesse \\(= \\sqrt{{vx}^2 + ({vyI})^2} = {sp}\\ \\text{m/s}\\), {ang} sous l'horizontale.", "Al aterrizar \\(v_y = v_{0y} - gt = {vyI}\\ \\text{m/s}\\); rapidez \\(= \\sqrt{{vx}^2 + ({vyI})^2} = {sp}\\ \\text{m/s}\\), {ang} bajo la horizontal.", "Bei der Landung \\(v_y = v_{0y} - gt = {vyI}\\ \\text{m/s}\\); Betrag \\(= \\sqrt{{vx}^2 + ({vyI})^2} = {sp}\\ \\text{m/s}\\), {ang} unter der Horizontalen.", "落地时 \\(v_y = v_{0y} - gt = {vyI}\\ \\text{m/s}\\)；速率 \\(= \\sqrt{{vx}^2 + ({vyI})^2} = {sp}\\ \\text{m/s}\\)，方向在水平线下方 {ang}。"),
    hFall: L("Vertically it starts with \\(v_{0y} = 0\\): \\(-{h} = -\\tfrac12(9.81)t^2\\), so \\(t = \\sqrt{2({h})/9.81} = {T}\\ \\text{s}\\).", "Verticalement, \\(v_{0y} = 0\\) : \\(-{h} = -\\tfrac12(9.81)t^2\\), donc \\(t = \\sqrt{2({h})/9.81} = {T}\\ \\text{s}\\).", "En vertical empieza con \\(v_{0y} = 0\\): \\(-{h} = -\\tfrac12(9.81)t^2\\), así que \\(t = \\sqrt{2({h})/9.81} = {T}\\ \\text{s}\\).", "Vertikal beginnt es mit \\(v_{0y} = 0\\): \\(-{h} = -\\tfrac12(9.81)t^2\\), also \\(t = \\sqrt{2({h})/9.81} = {T}\\ \\text{s}\\).", "竖直方向 \\(v_{0y} = 0\\)：\\(-{h} = -\\tfrac12(9.81)t^2\\)，所以 \\(t = \\sqrt{2({h})/9.81} = {T}\\ \\text{s}\\)。"),
    check: L("Check: the numbers are sensible for the situation (positive time, landing below the launch, the horizontal speed never changes).", "Vérification : les valeurs sont plausibles (temps positif, atterrissage plus bas que le lancer, vitesse horizontale constante).", "Comprobación: los valores son razonables (tiempo positivo, aterriza más abajo, la velocidad horizontal no cambia).", "Probe: Die Werte sind plausibel (positive Zeit, Landung unterhalb des Abwurfs, Horizontalgeschwindigkeit konstant).", "检验：结果合理（时间为正，落点低于抛出点，水平速度不变）。"),
  };
  const fig = (p, o = {}) => ({ type: "scene", h0: p.h0, yLand: p.yLand, v0: p.v0, angle: p.angle, range: p.ok ? p.range : null, yMax: p.yMax, show: o.show || ["v0", "angle", "h0"], landLabel: o.landLabel });

  // ───────── 1. velocity components (vectors) ─────────
  fam({
    id: "ph_components", unit: "PA", sub: "PA.components", subs: ["PA.components", "PC.model"], title: "Velocity components", concepts: ["phys.vectors"], modes: ["simple", "normal", "challenge", "nightmare"],
    templates: ["resolve", "resolve-down", "combine", "kmh-down"], complexity: { simple: 1, normal: 2, challenge: 3, nightmare: 4 },
    gen(r, mode) {
      const lv = LV(mode), sc = pick(r, ANGLED);
      if (lv <= 1) {
        const v0 = between(r, sc.v[0], sc.v[1]), a = lv === 0 ? pick(r, [30, 37, 45, 53, 60]) : between(r, 15, 75);
        const vx = v0 * Math.cos(a * P.DEG), vy = v0 * Math.sin(a * P.DEG);
        return { kind: "wr", template: "resolve", sig: `res|${sc.id}|${v0}|${a}`,
          stem: join(fill(sc.t, { v: q(v0, "m/s"), a: deg(a) }), L(".", ".", ".", ".", "。"), L("Resolve the launch velocity into components.", "Décomposez la vitesse initiale en composantes.", "Descompón la velocidad inicial en componentes.", "Zerlege die Anfangsgeschwindigkeit in Komponenten.", "把初速度分解成分量。")),
          fig: { type: "vector", mag: v0, angle: a, unit: "m/s", show: ["mag", "angle"] },
          parts: [qty("a", T.vx, "speed", vx, { skills: ["decomp"], wrongs: wrongsVxVy(v0, a, "x") }), qty("b", T.vy, "speed", vy, { skills: ["decomp"], wrongs: wrongsVxVy(v0, a, "y") })],
          scaffold: lv === 0 ? [hintsFor.comp[1]] : null, hints: hintsFor.comp,
          solution: [fill(S.comp, { v0: n3(v0), a: `${a}^\\circ`, vx: tex(vx), vy: tex(vy) })] };
      }
      if (lv === 2 && r() < 0.5) {
        // given components (one negative) → magnitude and direction
        const vx = between(r, 4, 20), vy = -between(r, 3, 18);
        const sp = Math.hypot(vx, vy), ang = Math.atan2(-vy, vx) / P.DEG;
        return { kind: "wr", template: "combine", sig: `comb|${vx}|${vy}`,
          stem: L(`A ball's velocity has components \\(v_x = ${vx}\\ \\text{m/s}\\) and \\(v_y = ${n3(vy).replace("−", "-")}\\ \\text{m/s}\\) (up positive).`, `La vitesse d'une balle a pour composantes \\(v_x = ${vx}\\ \\text{m/s}\\) et \\(v_y = ${n3(vy).replace("−", "-")}\\ \\text{m/s}\\) (haut positif).`, `La velocidad de una pelota tiene componentes \\(v_x = ${vx}\\ \\text{m/s}\\) y \\(v_y = ${n3(vy).replace("−", "-")}\\ \\text{m/s}\\) (arriba positivo).`, `Die Geschwindigkeit eines Balls hat die Komponenten \\(v_x = ${vx}\\ \\text{m/s}\\) und \\(v_y = ${n3(vy).replace("−", "-")}\\ \\text{m/s}\\) (oben positiv).`, `一个球的速度分量为 \\(v_x = ${vx}\\ \\text{m/s}\\)、\\(v_y = ${n3(vy).replace("−", "-")}\\ \\text{m/s}\\)（向上为正）。`),
          fig: { type: "vector", mag: sp, angle: -ang, unit: "m/s", show: ["vx", "vy"] },
          parts: [qty("a", L("Speed (magnitude of the velocity)", "Vitesse (norme du vecteur vitesse)", "Rapidez (módulo de la velocidad)", "Geschwindigkeitsbetrag", "速率（速度的大小）"), "speed", sp, { skills: ["decomp"], magnitude: true, wrongs: [{ value: Math.abs(vx) + Math.abs(vy), key: "ph.w.horizontal", cat: "conceptual" }] }),
            qty("b", L("Direction: angle below the horizontal", "Direction : angle sous l'horizontale", "Dirección: ángulo bajo la horizontal", "Richtung: Winkel unter der Horizontalen", "方向：与水平方向向下的夹角"), "angle", ang, { skills: ["decomp", "signs"], signed: false, wrongs: [{ value: 90 - ang, key: "ph.w.complement", cat: "conceptual" }] })],
          hints: [hintsFor.impact[0], hintsFor.comp[0]],
          solution: [L(`\\(v = \\sqrt{${vx}^2 + (${vy})^2} = ${tex(sp)}\\ \\text{m/s}\\)`, `\\(v = \\sqrt{${vx}^2 + (${vy})^2} = ${tex(sp)}\\ \\text{m/s}\\)`, `\\(v = \\sqrt{${vx}^2 + (${vy})^2} = ${tex(sp)}\\ \\text{m/s}\\)`, `\\(v = \\sqrt{${vx}^2 + (${vy})^2} = ${tex(sp)}\\ \\text{m/s}\\)`, `\\(v = \\sqrt{${vx}^2 + (${vy})^2} = ${tex(sp)}\\ \\text{m/s}\\)`),
            L(`\\(\\theta = \\tan^{-1}(${-vy}/${vx}) = ${tex(ang)}^\\circ\\) below the horizontal (\\(v_y < 0\\)).`, `\\(\\theta = \\tan^{-1}(${-vy}/${vx}) = ${tex(ang)}^\\circ\\) sous l'horizontale (\\(v_y < 0\\)).`, `\\(\\theta = \\tan^{-1}(${-vy}/${vx}) = ${tex(ang)}^\\circ\\) bajo la horizontal (\\(v_y < 0\\)).`, `\\(\\theta = \\tan^{-1}(${-vy}/${vx}) = ${tex(ang)}^\\circ\\) unter der Horizontalen (\\(v_y < 0\\)).`, `\\(\\theta = \\tan^{-1}(${-vy}/${vx}) = ${tex(ang)}^\\circ\\)，在水平线下方（\\(v_y < 0\\)）。`)] };
      }
      // launched below the horizontal (challenge) / in km/h (nightmare)
      const kmh = lv === 3, a = -between(r, 10, 60), v0 = kmh ? between(r, 36, 108, 9) : between(r, 6, 24);
      const v0s = kmh ? v0 / 3.6 : v0, vx = v0s * Math.cos(a * P.DEG), vy = v0s * Math.sin(a * P.DEG);
      const W = (val) => (kmh ? [{ value: val * 3.6, key: "ph.w.noConvert", cat: "units" }] : []);
      return { kind: "wr", template: kmh ? "kmh-down" : "resolve-down", sig: `down|${v0}|${a}|${kmh}`,
        stem: L(`A ball is thrown from a balcony at ${kmh ? v0 + " km/h" : v0 + " m/s"}, aimed ${-a}° below the horizontal. Up is positive.`, `Une balle est lancée d'un balcon à ${kmh ? v0 + " km/h" : v0 + " m/s"}, dirigée à ${-a}° sous l'horizontale. Le haut est positif.`, `Se lanza una pelota desde un balcón a ${kmh ? v0 + " km/h" : v0 + " m/s"}, apuntando ${-a}° bajo la horizontal. Arriba es positivo.`, `Ein Ball wird von einem Balkon mit ${kmh ? v0 + " km/h" : v0 + " m/s"} geworfen, ${-a}° unter die Horizontale gerichtet. Oben ist positiv.`, `从阳台以 ${kmh ? v0 + " km/h" : v0 + " m/s"} 抛出一个球，方向在水平线下方 ${-a}°。向上为正。`),
        fig: { type: "vector", mag: v0s, angle: a, unit: "m/s", show: ["angle"] },
        parts: [qty("a", T.vx, "speed", vx, { skills: ["decomp", kmh ? "units" : "decomp"], wrongs: [...wrongsVxVy(v0s, -a, "x"), ...W(vx)] }), qty("b", T.vy, "speed", vy, { skills: ["decomp", "signs"], wrongs: [{ value: v0s * Math.cos(a * P.DEG), key: "ph.w.sincos", cat: "equation" }, ...W(vy)] })],
        hints: [...hintsFor.comp, L("Below the horizontal means the vertical component is negative.", "Sous l'horizontale : la composante verticale est négative.", "Bajo la horizontal: la componente vertical es negativa.", "Unter der Horizontalen: Die vertikale Komponente ist negativ.", "在水平线以下：竖直分量为负。")],
        solution: [...(kmh ? [L(`${v0} km/h ÷ 3.6 = ${tex(v0s)} m/s.`, `${v0} km/h ÷ 3,6 = ${tex(v0s)} m/s.`, `${v0} km/h ÷ 3,6 = ${tex(v0s)} m/s.`, `${v0} km/h ÷ 3,6 = ${tex(v0s)} m/s.`, `${v0} km/h ÷ 3.6 = ${tex(v0s)} m/s。`)] : []), fill(S.comp, { v0: tex(v0s), a: `(${a}^\\circ)`, vx: tex(vx), vy: tex(vy) })] };
    },
  });

  // ───────── 2. vertical launches (1-D projectile motion) ─────────
  fam({
    id: "ph_vertical", sub: "PC.vertical", subs: ["PC.vertical", "PC.time", "PC.max_height"], title: "Vertical launches", concepts: ["phys.vertical"], modes: ["simple", "normal", "challenge", "nightmare"],
    templates: ["up-ground", "up-height", "down-bridge", "window"], complexity: { simple: 1, normal: 2, challenge: 3, nightmare: 4 },
    gen(r, mode) {
      const lv = LV(mode);
      if (lv <= 1) {
        const v0 = between(r, 12, 44) / 2, h0 = lv === 0 ? 0 : between(r, 5, 35);
        const p = P.launch({ v0, angle: 90, h0, yLand: 0 });
        const who = pick(r, [0, 1, 2]);
        const WHO = [L("A ball", "Une balle", "Una pelota", "Ein Ball", "一个球"), L("A toy rocket", "Une fusée-jouet", "Un cohete de juguete", "Eine Spielzeugrakete", "一枚玩具火箭"), L("A tennis ball", "Une balle de tennis", "Una pelota de tenis", "Ein Tennisball", "一个网球")][who];
        const st0 = L(`A ball is thrown straight up at ${v0} m/s${h0 ? ` from a balcony ${h0} m above the ground` : " from ground level"}.`, `Une balle est lancée verticalement vers le haut à ${v0} m/s${h0 ? ` depuis un balcon à ${h0} m du sol` : " depuis le sol"}.`, `Se lanza una pelota verticalmente hacia arriba a ${v0} m/s${h0 ? ` desde un balcón a ${h0} m del suelo` : " desde el suelo"}.`, `Ein Ball wird mit ${v0} m/s senkrecht nach oben geworfen${h0 ? `, von einem Balkon ${h0} m über dem Boden` : ", vom Boden aus"}.`, `${h0 ? `从离地 ${h0} m 的阳台上` : "从地面"}以 ${v0} m/s 竖直向上抛出一个球。`);
        const st = who ? fill(L(st0.en.replace("A ball", "{w}"), st0.fr.replace("Une balle", "{w}"), st0.es.replace("Una pelota", "{w}"), st0.de.replace("Ein Ball", "{w}"), st0.zh.replace("一个球", "{w}")), { w: WHO }) : st0;
        const parts = [qty("a", T.tApex, "time", p.tApex, { skills: ["vertical", "time"], positive: true, wrongs: [{ value: v0 * G, key: "ph.w.signG", cat: "algebra" }] })];
        parts.push(qty("b", h0 ? T.hMaxAboveGround : T.hMaxAboveLaunch, "length", p.yMax, { skills: ["vertical", "maxh"], positive: true, wrongs: [{ value: (v0 * v0) / G, key: "ph.w.half", cat: "algebra" }, ...(h0 ? [{ value: p.yMax - h0, key: "ph.w.aboveLaunch", cat: "conceptual" }] : [])] }));
        if (lv === 1) parts.push(qty("c", T.impactVy, "speed", p.impact.vy, { skills: ["vertical", "signs"], wrongs: [{ value: v0, key: "ph.w.heightIgnored", cat: "conceptual" }] }));
        return { kind: "wr", template: h0 ? "up-height" : "up-ground", sig: `vert|${who}|${v0}|${h0}|${lv}`, stem: join(st, T.model, T.upPos), fig: { type: "scene", h0, yLand: 0, v0, angle: 90, show: ["v0", "h0"] }, parts,
          scaffold: lv === 0 ? [hintsFor.vert[1]] : null, hints: hintsFor.vert,
          solution: [fill(S.apex, { ta: tex(p.tApex), rise: tex(p.yMax - h0) }), ...(h0 ? [L(`Height above the ground: ${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m.`, `Hauteur au-dessus du sol : ${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m.`, `Altura sobre el suelo: ${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m.`, `Höhe über dem Boden: ${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m.`, `离地高度：${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m。`)] : []),
            ...(lv === 1 ? [L(`Landing (y = −${h0} m from the launch): \\(v_y = -\\sqrt{v_0^2 + 2gh} = ${tex(p.impact.vy)}\\ \\text{m/s}\\) (negative: moving down).`, `Atterrissage (y = −${h0} m) : \\(v_y = -\\sqrt{v_0^2 + 2gh} = ${tex(p.impact.vy)}\\ \\text{m/s}\\) (négatif : vers le bas).`, `Aterrizaje (y = −${h0} m): \\(v_y = -\\sqrt{v_0^2 + 2gh} = ${tex(p.impact.vy)}\\ \\text{m/s}\\) (negativo: hacia abajo).`, `Landung (y = −${h0} m): \\(v_y = -\\sqrt{v_0^2 + 2gh} = ${tex(p.impact.vy)}\\ \\text{m/s}\\) (negativ: nach unten).`, `落地（y = −${h0} m）：\\(v_y = -\\sqrt{v_0^2 + 2gh} = ${tex(p.impact.vy)}\\ \\text{m/s}\\)（负号表示向下）。`)] : [])] };
      }
      if (lv === 2) {
        const v0 = between(r, 3, 15), h = between(r, 15, 60);
        const p = P.launch({ v0, angle: -90, h0: h, yLand: 0 });
        const tWrong = (v0 + Math.sqrt(v0 * v0 + 2 * G * h)) / G; // treated "thrown down" as thrown up (wrong sign of v0y)
        return { kind: "wr", template: "down-bridge", sig: `vdown|${v0}|${h}`,
          stem: join(L(`A stone is thrown straight down at ${v0} m/s from a bridge ${h} m above a river.`, `Une pierre est lancée verticalement vers le bas à ${v0} m/s d'un pont à ${h} m au-dessus d'une rivière.`, `Se lanza una piedra verticalmente hacia abajo a ${v0} m/s desde un puente a ${h} m sobre un río.`, `Ein Stein wird mit ${v0} m/s senkrecht nach unten von einer Brücke ${h} m über einem Fluss geworfen.`, `从高出河面 ${h} m 的桥上以 ${v0} m/s 竖直向下扔出一块石头。`), T.model, T.upPos),
          fig: { type: "scene", h0: h, yLand: 0, v0, angle: -90, show: ["v0", "h0"] },
          parts: [qty("a", L("Time to reach the water", "Temps pour atteindre l'eau", "Tiempo hasta llegar al agua", "Zeit bis zum Wasser", "落到水面所用时间"), "time", p.tLand, { skills: ["vertical", "time", "signs"], positive: true, wrongs: [{ value: tWrong, key: "ph.w.signG", cat: "signs" }, { value: Math.sqrt((2 * h) / G), key: "ph.w.heightIgnored", cat: "conceptual" }] }),
            qty("b", T.impactVy, "speed", p.impact.vy, { skills: ["vertical", "signs"], wrongs: [] })],
          hints: [L("Thrown down means \\(v_{0y}\\) is negative: \\(v_{0y} = -" + v0 + "\\ \\text{m/s}\\).", "Lancée vers le bas : \\(v_{0y} = -" + v0 + "\\ \\text{m/s}\\).", "Hacia abajo: \\(v_{0y} = -" + v0 + "\\ \\text{m/s}\\).", "Nach unten: \\(v_{0y} = -" + v0 + "\\ \\text{m/s}\\).", "向下抛：\\(v_{0y} = -" + v0 + "\\ \\text{m/s}\\)。"), hintsFor.vert[1]],
          solution: [fill(S.land, { dy: `-${h}`, vy: `(-${v0})`, T: tex(p.tLand) }), L(`\\(v_y = -${v0} - 9.81(${tex(p.tLand)}) = ${tex(p.impact.vy)}\\ \\text{m/s}\\).`, `\\(v_y = -${v0} - 9.81(${tex(p.tLand)}) = ${tex(p.impact.vy)}\\ \\text{m/s}\\).`, `\\(v_y = -${v0} - 9.81(${tex(p.tLand)}) = ${tex(p.impact.vy)}\\ \\text{m/s}\\).`, `\\(v_y = -${v0} - 9.81(${tex(p.tLand)}) = ${tex(p.impact.vy)}\\ \\text{m/s}\\).`, `\\(v_y = -${v0} - 9.81(${tex(p.tLand)}) = ${tex(p.impact.vy)}\\ \\text{m/s}\\)。`)] };
      }
      // nightmare: when does it pass a window above the launch point on the way DOWN, and how fast
      const v0 = between(r, 12, 24), p = P.launch({ v0, angle: 90, h0: 0, yLand: 0 });
      const yw = Math.round((p.yMax * between(r, 35, 75)) / 100 * 10) / 10;
      const ts = P.timesAtHeight(p, yw);
      const vDown = P.stateAt(p, ts[1]).vy;
      return { kind: "wr", template: "window", sig: `win|${v0}|${yw}`,
        stem: join(L(`A ball is thrown straight up at ${v0} m/s from ground level. A window's sill is ${yw} m above the ground.`, `Une balle est lancée verticalement à ${v0} m/s depuis le sol. Le rebord d'une fenêtre est à ${yw} m du sol.`, `Se lanza una pelota hacia arriba a ${v0} m/s desde el suelo. El alféizar de una ventana está a ${yw} m del suelo.`, `Ein Ball wird vom Boden mit ${v0} m/s senkrecht nach oben geworfen. Ein Fenstersims liegt ${yw} m über dem Boden.`, `从地面以 ${v0} m/s 竖直向上抛出一个球。窗台离地 ${yw} m。`), T.model, T.upPos),
        parts: [qty("a", L("When does the ball pass the sill on the way DOWN?", "Quand la balle passe-t-elle devant le rebord en DESCENDANT ?", "¿Cuándo pasa la pelota por el alféizar al BAJAR?", "Wann passiert der Ball den Sims auf dem Weg NACH UNTEN?", "球在下落过程中何时经过窗台？"), "time", ts[1], { skills: ["vertical", "time", "equations"], positive: true, wrongs: [{ value: ts[0], key: "ph.w.earlyRoot", cat: "equation" }] }),
          qty("b", L("Its vertical velocity at that moment (up positive)", "Sa vitesse verticale à cet instant (haut positif)", "Su velocidad vertical en ese instante (arriba positivo)", "Seine Vertikalgeschwindigkeit in diesem Moment (oben positiv)", "此刻的竖直速度（向上为正）"), "speed", vDown, { skills: ["vertical", "signs"] })],
        hints: [L("Solve \\(" + yw + " = " + v0 + "t - 4.905t^2\\): there are two times.", "Résolvez \\(" + yw + " = " + v0 + "t - 4,905t^2\\) : il y a deux temps.", "Resuelve \\(" + yw + " = " + v0 + "t - 4,905t^2\\): hay dos tiempos.", "Löse \\(" + yw + " = " + v0 + "t - 4,905t^2\\): Es gibt zwei Zeiten.", "解 \\(" + yw + " = " + v0 + "t - 4.905t^2\\)：有两个时间。"), L("The later time is on the way down; \\(v_y\\) is negative then.", "Le temps le plus tardif correspond à la descente ; \\(v_y\\) est alors négatif.", "El tiempo mayor es de bajada; entonces \\(v_y\\) es negativa.", "Die spätere Zeit ist beim Fallen; dann ist \\(v_y\\) negativ.", "较晚的时间对应下落阶段，此时 \\(v_y\\) 为负。")],
        solution: [L(`\\(4.905t^2 - ${v0}t + ${yw} = 0 \\Rightarrow t = ${tex(ts[0])}\\ \\text{s}\\) (up) or \\(t = ${tex(ts[1])}\\ \\text{s}\\) (down).`, `\\(4,905t^2 - ${v0}t + ${yw} = 0 \\Rightarrow t = ${tex(ts[0])}\\ \\text{s}\\) (montée) ou \\(t = ${tex(ts[1])}\\ \\text{s}\\) (descente).`, `\\(4,905t^2 - ${v0}t + ${yw} = 0 \\Rightarrow t = ${tex(ts[0])}\\ \\text{s}\\) (subida) o \\(t = ${tex(ts[1])}\\ \\text{s}\\) (bajada).`, `\\(4,905t^2 - ${v0}t + ${yw} = 0 \\Rightarrow t = ${tex(ts[0])}\\ \\text{s}\\) (aufwärts) oder \\(t = ${tex(ts[1])}\\ \\text{s}\\) (abwärts).`, `\\(4.905t^2 - ${v0}t + ${yw} = 0 \\Rightarrow t = ${tex(ts[0])}\\ \\text{s}\\)（上升）或 \\(t = ${tex(ts[1])}\\ \\text{s}\\)（下落）。`),
          L(`\\(v_y = ${v0} - 9.81(${tex(ts[1])}) = ${tex(vDown)}\\ \\text{m/s}\\).`, `\\(v_y = ${v0} - 9,81(${tex(ts[1])}) = ${tex(vDown)}\\ \\text{m/s}\\).`, `\\(v_y = ${v0} - 9,81(${tex(ts[1])}) = ${tex(vDown)}\\ \\text{m/s}\\).`, `\\(v_y = ${v0} - 9,81(${tex(ts[1])}) = ${tex(vDown)}\\ \\text{m/s}\\).`, `\\(v_y = ${v0} - 9.81(${tex(ts[1])}) = ${tex(vDown)}\\ \\text{m/s}\\)。`)] };
    },
  });

  // ───────── 3. horizontal launches ─────────
  fam({
    id: "ph_horizontal", sub: "PC.horizontal", subs: ["PC.horizontal", "PC.time", "PC.range", "PC.impact"], title: "Horizontal launches", concepts: ["phys.horizontal"], modes: ["simple", "normal", "challenge", "nightmare"],
    templates: ["time-range", "with-impact", "needed-speed", "gap"], complexity: { simple: 1, normal: 2, challenge: 3, nightmare: 4 },
    gen(r, mode) {
      const lv = LV(mode), sc = pick(r, lv === 0 ? HORIZ.filter((s) => s.id !== "drone") : HORIZ);
      const h = sc.h[1] < 2 ? between(r, sc.h[0] * 10, sc.h[1] * 10) / 10 : between(r, sc.h[0], sc.h[1]);
      if (lv <= 2 && !(lv === 2 && r() < 0.5)) {
        const v = sc.v[1] <= 4 ? between(r, sc.v[0] * 10, sc.v[1] * 10, 5) / 10 : between(r, sc.v[0], sc.v[1]);
        const p = P.launch({ v0: v, angle: 0, h0: h, yLand: 0 });
        const parts = [qty("a", T.tof, "time", p.tLand, { skills: ["vertical", "time"], positive: true, wrongs: [{ value: (2 * h) / G, key: "ph.w.noSqrt", cat: "algebra" }, { value: Math.sqrt(h / G), key: "ph.w.half", cat: "algebra" }] }),
          qty("b", T.range, "length", p.range, { skills: ["horizontal", "range"], positive: true, wrongs: [{ value: v * (2 * h) / G, key: "ph.w.noSqrt", cat: "algebra" }] })];
        if (lv >= 1) parts.push(qty("c", T.impactSpeed, "speed", p.impact.speed, { skills: ["decomp", "vertical"], magnitude: true, wrongs: [{ value: Math.abs(p.impact.vy), key: "ph.w.vertical", cat: "conceptual" }, { value: v, key: "ph.w.horizontal", cat: "conceptual" }] }));
        if (lv === 2) parts.push(qty("d", T.impactAngle, "angle", p.impact.angleBelow, { skills: ["decomp"], signed: false, wrongs: [{ value: 90 - p.impact.angleBelow, key: "ph.w.complement", cat: "conceptual" }] }));
        return { kind: "wr", template: lv === 0 ? "time-range" : "with-impact", sig: `hz|${sc.id}|${h}|${v}|${lv}`,
          stem: join(fill(sc.t, { h: q(h, "m"), v: q(v, "m/s") }), T.model), fig: fig(p, { show: ["v0", "h0"] }), parts,
          scaffold: lv === 0 ? [L("1. Vertical: \\(v_{0y} = 0\\), so \\(h = \\tfrac12 g t^2\\) gives t.  2. Horizontal: \\(x = v_0 t\\).", "1. Vertical : \\(v_{0y} = 0\\), donc \\(h = \\tfrac12 g t^2\\) donne t.  2. Horizontal : \\(x = v_0 t\\).", "1. Vertical: \\(v_{0y} = 0\\), así \\(h = \\tfrac12 g t^2\\) da t.  2. Horizontal: \\(x = v_0 t\\).", "1. Vertikal: \\(v_{0y} = 0\\), also liefert \\(h = \\tfrac12 g t^2\\) die Zeit t.  2. Horizontal: \\(x = v_0 t\\).", "1. 竖直方向：\\(v_{0y} = 0\\)，由 \\(h = \\tfrac12 g t^2\\) 求 t。2. 水平方向：\\(x = v_0 t\\)。")] : null,
          hints: [...hintsFor.horiz, ...(lv >= 1 ? hintsFor.impact : [])],
          solution: [fill(S.hFall, { h: n3(h), T: tex(p.tLand) }), fill(S.rangeS, { vx: n3(v), T: tex(p.tLand), R: tex(p.range) }), ...(lv >= 1 ? [fill(S.impactS, { vyI: tex(p.impact.vy), vx: n3(v), sp: tex(p.impact.speed), ang: `${n3(p.impact.angleBelow)}°` })] : [])] };
      }
      if (lv === 2) {
        // inverse: what launch speed lands it a distance R away?
        const t = Math.sqrt((2 * h) / G), R = Math.round(between(r, 3, 9) * t * 10) / 10 + (sc.id === "bench" ? 0 : between(r, 1, 6));
        const v = P.horizontalSpeedFor(R, h);
        return { kind: "wr", template: "needed-speed", sig: `hzinv|${sc.id}|${h}|${R}`,
          stem: join(L(`An object is launched horizontally from ${n3(h)} m above level ground and lands ${n3(R)} m from the base.`, `Un objet est lancé horizontalement depuis ${n3(h)} m au-dessus d'un sol plat et atterrit à ${n3(R)} m de la base.`, `Un objeto se lanza horizontalmente desde ${n3(h)} m sobre suelo llano y cae a ${n3(R)} m de la base.`, `Ein Gegenstand wird aus ${n3(h)} m Höhe waagerecht geworfen und landet ${n3(R)} m vom Fußpunkt entfernt.`, `一个物体从离水平地面 ${n3(h)} m 处水平抛出，落在离底部 ${n3(R)} m 的地方。`), T.model),
          fig: { type: "scene", h0: h, yLand: 0, v0: v, angle: 0, range: R, show: ["h0", "range"] },
          parts: [qty("a", T.tof, "time", t, { skills: ["vertical", "time"], positive: true, wrongs: [{ value: (2 * h) / G, key: "ph.w.noSqrt", cat: "algebra" }] }), qty("b", T.v0, "speed", v, { skills: ["horizontal", "equations"], magnitude: true, wrongs: [{ value: R / ((2 * h) / G), key: "ph.w.noSqrt", cat: "algebra" }] })],
          hints: hintsFor.horiz, solution: [fill(S.hFall, { h: n3(h), T: tex(t) }), L(`\\(v_0 = x/t = ${n3(R)}/${tex(t)} = ${tex(v)}\\ \\text{m/s}\\).`, `\\(v_0 = x/t = ${n3(R)}/${tex(t)} = ${tex(v)}\\ \\text{m/s}\\).`, `\\(v_0 = x/t = ${n3(R)}/${tex(t)} = ${tex(v)}\\ \\text{m/s}\\).`, `\\(v_0 = x/t = ${n3(R)}/${tex(t)} = ${tex(v)}\\ \\text{m/s}\\).`, `\\(v_0 = x/t = ${n3(R)}/${tex(t)} = ${tex(v)}\\ \\text{m/s}\\)。`)] };
      }
      // nightmare: jump a gap onto a lower ledge — minimum speed, and the landing speed at that minimum
      const drop = between(r, 4, 16) / 2, gap = between(r, 6, 20) / 2;
      const t = Math.sqrt((2 * drop) / G), vmin = gap / t, pI = P.launch({ v0: vmin, angle: 0, h0: drop, yLand: 0 });
      return { kind: "wr", template: "gap", sig: `gap|${drop}|${gap}`,
        stem: join(L(`A stunt rider leaves a horizontal ramp and must clear a gap ${gap} m wide to land on a ledge ${drop} m lower.`, `Un cascadeur quitte une rampe horizontale et doit franchir un vide de ${gap} m pour atterrir sur un rebord ${drop} m plus bas.`, `Un acróbata sale de una rampa horizontal y debe salvar un hueco de ${gap} m para caer en un saliente ${drop} m más abajo.`, `Ein Stuntfahrer verlässt eine waagerechte Rampe und muss eine ${gap} m breite Lücke überwinden, um auf einem ${drop} m tieferen Absatz zu landen.`, `一名特技车手从水平坡道冲出，必须越过 ${gap} m 宽的空隙，落到低 ${drop} m 的平台上。`), T.model),
        fig: { type: "scene", h0: drop, yLand: 0, v0: vmin, angle: 0, range: gap, show: ["h0", "range"], ledge: gap },
        parts: [qty("a", L("Minimum take-off speed", "Vitesse minimale au décollage", "Rapidez mínima de despegue", "Mindestabfluggeschwindigkeit", "最小起跳速度"), "speed", vmin, { skills: ["horizontal", "vertical", "equations"], magnitude: true, wrongs: [{ value: gap / ((2 * drop) / G), key: "ph.w.noSqrt", cat: "algebra" }] }),
          qty("b", L("Landing speed at that minimum", "Vitesse à l'atterrissage pour ce minimum", "Rapidez de aterrizaje con ese mínimo", "Landegeschwindigkeit bei diesem Minimum", "以最小速度起跳时的落地速率"), "speed", pI.impact.speed, { skills: ["decomp"], magnitude: true, wrongs: [{ value: Math.abs(pI.impact.vy), key: "ph.w.vertical", cat: "conceptual" }, { value: vmin, key: "ph.w.vxChanges", cat: "conceptual" }] })],
        hints: [hintsFor.horiz[1], L("The fall of " + drop + " m fixes the time in the air; the gap then fixes the speed.", "La chute de " + drop + " m fixe le temps de vol ; le vide fixe alors la vitesse.", "La caída de " + drop + " m fija el tiempo en el aire; el hueco fija la rapidez.", "Die Fallhöhe von " + drop + " m legt die Flugzeit fest; die Lücke dann die Geschwindigkeit.", "下落 " + drop + " m 决定了飞行时间，空隙宽度再决定速度。"), ...hintsFor.impact],
        solution: [fill(S.hFall, { h: drop, T: tex(t) }), L(`\\(v_{\\min} = ${gap}/${tex(t)} = ${tex(vmin)}\\ \\text{m/s}\\).`, `\\(v_{\\min} = ${gap}/${tex(t)} = ${tex(vmin)}\\ \\text{m/s}\\).`, `\\(v_{\\min} = ${gap}/${tex(t)} = ${tex(vmin)}\\ \\text{m/s}\\).`, `\\(v_{\\min} = ${gap}/${tex(t)} = ${tex(vmin)}\\ \\text{m/s}\\).`, `\\(v_{\\min} = ${gap}/${tex(t)} = ${tex(vmin)}\\ \\text{m/s}\\)。`), fill(S.impactS, { vyI: tex(pI.impact.vy), vx: tex(vmin), sp: tex(pI.impact.speed), ang: `${n3(pI.impact.angleBelow)}°` })] };
    },
  });

  // ───────── 4. angled launches, same launch and landing height ─────────
  fam({
    id: "ph_angled_same", sub: "PC.angled_same", subs: ["PC.angled_same", "PC.time", "PC.max_height", "PC.range"], title: "Angled launches on level ground", concepts: ["phys.angled"], modes: ["simple", "normal", "challenge", "nightmare"],
    templates: ["full", "apex-speed", "inverse-RT", "complement"], complexity: { simple: 1, normal: 2, challenge: 3, nightmare: 4 },
    gen(r, mode) {
      const lv = LV(mode), sc = pick(r, ANGLED);
      const v0 = between(r, sc.v[0], sc.v[1]), a = lv === 0 ? pick(r, [30, 37, 45, 53, 60]) : between(r, 20, 70);
      const p = P.launch({ v0, angle: a, h0: 0, yLand: 0 });
      const stem = join(fill(sc.t, { v: q(v0, "m/s"), a: deg(a) }), levelGround, T.model);
      const solCore = [fill(S.comp, { v0: n3(v0), a: `${a}^\\circ`, vx: tex(p.vx), vy: tex(p.vy) }), fill(S.apex, { ta: tex(p.tApex), rise: tex(p.yMax) }),
        L(`Same height: the trip down takes as long as the trip up, so \\(T = 2t_{\\text{top}} = ${tex(p.tLand)}\\ \\text{s}\\).`, `Même hauteur : la descente dure autant que la montée, donc \\(T = 2t_{\\text{haut}} = ${tex(p.tLand)}\\ \\text{s}\\).`, `Misma altura: la bajada dura lo mismo que la subida, así \\(T = 2t_{\\text{alto}} = ${tex(p.tLand)}\\ \\text{s}\\).`, `Gleiche Höhe: Der Abstieg dauert so lange wie der Aufstieg, also \\(T = 2t_{\\text{oben}} = ${tex(p.tLand)}\\ \\text{s}\\).`, `起落同高：下落时间等于上升时间，所以 \\(T = 2t_{\\text{顶}} = ${tex(p.tLand)}\\ \\text{s}\\)。`),
        fill(S.rangeS, { vx: tex(p.vx), T: tex(p.tLand), R: tex(p.range) })];
      if (lv <= 2 && !(lv === 2 && r() < 0.4)) {
        const parts = [];
        if (lv === 0) parts.push(qty("a", T.vy, "speed", p.vy, { skills: ["decomp"], wrongs: wrongsVxVy(v0, a, "y") }));
        parts.push(qty(lv === 0 ? "b" : "a", T.tof, "time", p.tLand, { skills: ["vertical", "time"], positive: true, wrongs: [{ value: p.tApex, key: "ph.w.apexTime", cat: "conceptual" }, { value: (2 * v0 * Math.cos(a * P.DEG)) / G, key: "ph.w.sincos", cat: "equation" }] }));
        parts.push(qty(lv === 0 ? "c" : "b", T.hMaxAboveLaunch, "length", p.yMax, { skills: ["vertical", "maxh"], positive: true, wrongs: [{ value: (p.vy * p.vy) / G, key: "ph.w.half", cat: "algebra" }, { value: (v0 * v0) / (2 * G), key: "ph.w.vertical", cat: "conceptual" }] }));
        parts.push(qty(lv === 0 ? "d" : "c", T.range, "length", p.range, { skills: ["horizontal", "range"], positive: true, wrongs: [{ value: v0 * p.tLand, key: "ph.w.horizontal", cat: "decomp" === "x" ? "" : "equation" }, { value: p.vx * p.tApex, key: "ph.w.apexTime", cat: "conceptual" }] }));
        if (lv === 2) parts.push(qty("d", L("Speed at the highest point", "Vitesse au point le plus haut", "Rapidez en el punto más alto", "Geschwindigkeitsbetrag am höchsten Punkt", "最高点处的速率"), "speed", p.vx, { skills: ["horizontal", "concepts"], magnitude: true, wrongs: [] }));
        return { kind: "wr", template: lv === 2 ? "apex-speed" : "full", sig: `same|${sc.id}|${v0}|${a}|${lv}`, stem, fig: fig(p), parts,
          scaffold: lv === 0 ? [L("1. Components.  2. Time to the top: \\(v_{0y}/g\\).  3. Same height: total time is twice that.  4. Range: \\(v_{0x}T\\).", "1. Composantes.  2. Temps jusqu'au sommet : \\(v_{0y}/g\\).  3. Même hauteur : le temps total est le double.  4. Portée : \\(v_{0x}T\\).", "1. Componentes.  2. Tiempo hasta la cima: \\(v_{0y}/g\\).  3. Misma altura: el tiempo total es el doble.  4. Alcance: \\(v_{0x}T\\).", "1. Komponenten.  2. Zeit bis zum Scheitel: \\(v_{0y}/g\\).  3. Gleiche Höhe: Gesamtzeit doppelt so lang.  4. Weite: \\(v_{0x}T\\).", "1. 分解速度。2. 到达最高点：\\(v_{0y}/g\\)。3. 起落同高：总时间是它的两倍。4. 水平位移：\\(v_{0x}T\\)。")] : null,
          hints: [...hintsFor.comp, ...hintsFor.vert, hintsFor.horiz[1]], solution: [...solCore, ...(lv === 2 ? [L(`At the top only the horizontal component is left: speed = \\(v_{0x} = ${tex(p.vx)}\\ \\text{m/s}\\) (not zero).`, `Au sommet il ne reste que la composante horizontale : vitesse = \\(v_{0x} = ${tex(p.vx)}\\ \\text{m/s}\\) (pas zéro).`, `En la cima solo queda la componente horizontal: rapidez = \\(v_{0x} = ${tex(p.vx)}\\ \\text{m/s}\\) (no cero).`, `Am Scheitel bleibt nur die horizontale Komponente: Betrag = \\(v_{0x} = ${tex(p.vx)}\\ \\text{m/s}\\) (nicht null).`, `最高点只剩水平分量：速率 = \\(v_{0x} = ${tex(p.vx)}\\ \\text{m/s}\\)（不是零）。`)] : [])] };
      }
      if (lv === 2) {
        // which other angle gives the same range (complementary), as a reasoning question + the range
        const other = 90 - a;
        return { kind: "wr", template: "complement", sig: `compl|${sc.id}|${v0}|${a}`, stem, fig: fig(p),
          parts: [qty("a", T.range, "length", p.range, { skills: ["range"], positive: true, wrongs: [{ value: p.vx * p.tApex, key: "ph.w.apexTime", cat: "conceptual" }] }),
            pmc(r, "b", L("At the same speed, which other launch angle gives the same range on level ground?", "À la même vitesse, quel autre angle donne la même portée sur sol plat ?", "Con la misma rapidez, ¿qué otro ángulo da el mismo alcance en suelo llano?", "Welcher andere Winkel ergibt bei gleicher Geschwindigkeit auf ebenem Boden dieselbe Weite?", "速率相同时，在水平地面上哪个其他角度射程相同？"), K.same ? K.same(`${other}°`) : null, [K.same(`${Math.min(89, a + 10)}°`), K.same(`${Math.max(1, 2 * a > 90 ? 180 - 2 * a : 2 * a)}°`), K.same(`${Math.round(a / 2)}°`)].filter((o) => o.en !== `${other}°`).slice(0, 3), { skills: ["range", "concepts"], value: other })],
          hints: [L("The range on level ground is \\(R = v_0^2\\sin 2\\theta/g\\) (this special case only).", "Sur sol plat, \\(R = v_0^2\\sin 2\\theta/g\\) (ce cas particulier seulement).", "En suelo llano, \\(R = v_0^2\\sin 2\\theta/g\\) (solo este caso).", "Auf ebenem Boden gilt \\(R = v_0^2\\sin 2\\theta/g\\) (nur dieser Sonderfall).", "仅在起落同高时 \\(R = v_0^2\\sin 2\\theta/g\\)。"), L("\\(\\sin 2\\theta = \\sin(180^\\circ - 2\\theta)\\).", "\\(\\sin 2\\theta = \\sin(180^\\circ - 2\\theta)\\).", "\\(\\sin 2\\theta = \\sin(180^\\circ - 2\\theta)\\).", "\\(\\sin 2\\theta = \\sin(180^\\circ - 2\\theta)\\).", "\\(\\sin 2\\theta = \\sin(180^\\circ - 2\\theta)\\)。")],
          solution: [...solCore, L(`\\(\\sin(2\\cdot${a}^\\circ) = \\sin(2\\cdot${other}^\\circ)\\), so ${other}° gives the same range (a higher, slower path).`, `\\(\\sin(2\\cdot${a}^\\circ) = \\sin(2\\cdot${other}^\\circ)\\) : ${other}° donne la même portée (trajet plus haut).`, `\\(\\sin(2\\cdot${a}^\\circ) = \\sin(2\\cdot${other}^\\circ)\\): ${other}° da el mismo alcance (trayectoria más alta).`, `\\(\\sin(2\\cdot${a}^\\circ) = \\sin(2\\cdot${other}^\\circ)\\): ${other}° ergibt dieselbe Weite (höhere Bahn).`, `\\(\\sin(2\\cdot${a}^\\circ) = \\sin(2\\cdot${other}^\\circ)\\)，所以 ${other}° 射程相同（轨迹更高）。`)] };
      }
      // nightmare: from range and time of flight, recover the launch speed and angle
      const R = p.range, Tt = p.tLand;
      return { kind: "wr", template: "inverse-RT", sig: `invRT|${v0}|${a}`,
        stem: join(L(`A ball launched from level ground lands ${n3(R)} m away after ${n3(Tt)} s in the air.`, `Une balle lancée depuis un sol plat retombe à ${n3(R)} m après ${n3(Tt)} s de vol.`, `Una pelota lanzada desde suelo llano cae a ${n3(R)} m tras ${n3(Tt)} s en el aire.`, `Ein vom ebenen Boden geworfener Ball landet nach ${n3(Tt)} s Flugzeit ${n3(R)} m entfernt.`, `从水平地面抛出的球在空中飞行 ${n3(Tt)} s 后落在 ${n3(R)} m 外。`), T.model),
        parts: [qty("a", T.v0, "speed", v0, { skills: ["decomp", "equations"], magnitude: true, wrongs: [{ value: R / Tt, key: "ph.w.horizontal", cat: "conceptual" }] }),
          qty("b", T.theta, "angle", a, { skills: ["decomp", "equations"], signed: false, wrongs: [{ value: 90 - a, key: "ph.w.complement", cat: "conceptual" }] }),
          qty("c", T.hMaxAboveLaunch, "length", p.yMax, { skills: ["maxh"], positive: true, wrongs: [{ value: (p.vy * p.vy) / G, key: "ph.w.half", cat: "algebra" }] })],
        hints: [L("Horizontally \\(v_{0x} = R/T\\). Vertically, same height: \\(v_{0y} = gT/2\\).", "À l'horizontale \\(v_{0x} = R/T\\). Verticalement, même hauteur : \\(v_{0y} = gT/2\\).", "En horizontal \\(v_{0x} = R/T\\). En vertical, misma altura: \\(v_{0y} = gT/2\\).", "Horizontal \\(v_{0x} = R/T\\). Vertikal, gleiche Höhe: \\(v_{0y} = gT/2\\).", "水平：\\(v_{0x} = R/T\\)。竖直（起落同高）：\\(v_{0y} = gT/2\\)。"), hintsFor.impact[0]],
        solution: [L(`\\(v_{0x} = ${n3(R)}/${n3(Tt)} = ${tex(p.vx)}\\), \\(v_{0y} = 9.81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\).`, `\\(v_{0x} = ${n3(R)}/${n3(Tt)} = ${tex(p.vx)}\\), \\(v_{0y} = 9,81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\).`, `\\(v_{0x} = ${n3(R)}/${n3(Tt)} = ${tex(p.vx)}\\), \\(v_{0y} = 9,81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\).`, `\\(v_{0x} = ${n3(R)}/${n3(Tt)} = ${tex(p.vx)}\\), \\(v_{0y} = 9,81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\).`, `\\(v_{0x} = ${n3(R)}/${n3(Tt)} = ${tex(p.vx)}\\)，\\(v_{0y} = 9.81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\)。`),
          L(`\\(v_0 = \\sqrt{v_{0x}^2 + v_{0y}^2} = ${tex(v0)}\\ \\text{m/s}\\), \\(\\theta = \\tan^{-1}(v_{0y}/v_{0x}) = ${tex(a)}^\\circ\\).`, `\\(v_0 = \\sqrt{v_{0x}^2 + v_{0y}^2} = ${tex(v0)}\\ \\text{m/s}\\), \\(\\theta = \\tan^{-1}(v_{0y}/v_{0x}) = ${tex(a)}^\\circ\\).`, `\\(v_0 = \\sqrt{v_{0x}^2 + v_{0y}^2} = ${tex(v0)}\\ \\text{m/s}\\), \\(\\theta = \\tan^{-1}(v_{0y}/v_{0x}) = ${tex(a)}^\\circ\\).`, `\\(v_0 = \\sqrt{v_{0x}^2 + v_{0y}^2} = ${tex(v0)}\\ \\text{m/s}\\), \\(\\theta = \\tan^{-1}(v_{0y}/v_{0x}) = ${tex(a)}^\\circ\\).`, `\\(v_0 = \\sqrt{v_{0x}^2 + v_{0y}^2} = ${tex(v0)}\\ \\text{m/s}\\)，\\(\\theta = \\tan^{-1}(v_{0y}/v_{0x}) = ${tex(a)}^\\circ\\)。`),
          fill(S.apex, { ta: tex(p.tApex), rise: tex(p.yMax) })] };
    },
  });

  // ───────── 5. angled launches with different launch and landing heights ─────────
  fam({
    id: "ph_angled_diff", sub: "PC.angled_diff", subs: ["PC.angled_diff", "PC.time", "PC.range", "PC.max_height"], title: "Angled launches, different heights", concepts: ["phys.heights"], modes: ["simple", "normal", "challenge", "nightmare"],
    templates: ["cliff-up", "platform", "cliff-wrong-formula", "wall"], complexity: { simple: 2, normal: 3, challenge: 3, nightmare: 4 },
    gen(r, mode) {
      const lv = LV(mode), sc = pick(r, ANGLED.filter((s) => s.id !== "frog"));
      let tries = 0;
      while (tries++ < 50) {
        const v0 = between(r, sc.v[0], sc.v[1]), a = lv === 0 ? pick(r, [30, 37, 45, 53]) : between(r, 20, 65);
        const up = lv >= 2 && r() < 0.5;   // onto a higher platform (challenge+)
        const h0 = up ? 0 : between(r, 5, 40), yLand = up ? between(r, 2, 12) : 0;
        const p = P.launch({ v0, angle: a, h0, yLand });
        if (!p.ok || p.yMax - Math.max(h0, yLand) < 1.5 || p.range < 5) continue;
        const st = join(fill(sc.t, { v: q(v0, "m/s"), a: deg(a) }), fill(up ? ontoPlatform : fromHeight, { h: q(up ? yLand : h0, "m") }), T.model);
        const same = P.sameHeightRange(v0, a);
        const wrongT = [{ value: 2 * p.tApex, key: "ph.w.rangeFormula", cat: "equation" }, { value: (p.vy - Math.sqrt(Math.max(0, p.vy * p.vy + 2 * G * (h0 - yLand)))) / G, key: "ph.w.earlyRoot", cat: "equation" }];
        const parts = [];
        if (lv <= 1) parts.push(qty("a", T.hMaxAboveGround, "length", p.yMax, { skills: ["maxh", "unequal"], positive: true, wrongs: [{ value: p.yMax - h0, key: "ph.w.aboveLaunch", cat: "conceptual" }, { value: (p.vy * p.vy) / G + h0, key: "ph.w.half", cat: "algebra" }] }));
        parts.push(qty(String.fromCharCode(97 + parts.length), T.tof, "time", p.tLand, { skills: ["time", "unequal", "equations"], positive: true, wrongs: wrongT }));
        parts.push(qty(String.fromCharCode(97 + parts.length), T.range, "length", p.range, { skills: ["range", "unequal"], positive: true, wrongs: [{ value: same, key: "ph.w.rangeFormula", cat: "equation" }] }));
        if (lv >= 2) parts.push(pmc(r, String.fromCharCode(97 + parts.length), L("Why can't \\(R = v_0^2\\sin 2\\theta/g\\) be used here?", "Pourquoi ne peut-on pas utiliser \\(R = v_0^2\\sin 2\\theta/g\\) ici ?", "¿Por qué no se puede usar \\(R = v_0^2\\sin 2\\theta/g\\) aquí?", "Warum darf man hier \\(R = v_0^2\\sin 2\\theta/g\\) nicht verwenden?", "为什么这里不能用 \\(R = v_0^2\\sin 2\\theta/g\\)？"),
          L("It assumes the projectile lands at the same height it was launched from.", "Elle suppose que le projectile atterrit à la même hauteur que son départ.", "Supone que el proyectil cae a la misma altura desde la que salió.", "Sie setzt voraus, dass das Projektil auf Abwurfhöhe landet.", "它假设落点与抛出点高度相同。"),
          [{ t: L("It only works for angles below 45°.", "Elle ne vaut que pour des angles inférieurs à 45°.", "Solo vale para ángulos menores de 45°.", "Sie gilt nur für Winkel unter 45°.", "它只适用于小于 45° 的角。"), why: { key: "", cat: "conceptual" } },
            { t: L("It ignores the horizontal acceleration.", "Elle ignore l'accélération horizontale.", "Ignora la aceleración horizontal.", "Sie vernachlässigt die horizontale Beschleunigung.", "它忽略了水平加速度。"), why: { key: "ph.w.vxChanges", cat: "conceptual" } },
            { t: L("It can be used; the answer is the same.", "On peut l'utiliser ; le résultat est le même.", "Sí se puede usar; da lo mismo.", "Man kann sie verwenden; das Ergebnis ist gleich.", "可以用，结果一样。"), why: { key: "ph.w.rangeFormula", cat: "equation" } }], { skills: ["unequal", "concepts"] }));
        return { kind: "wr", template: up ? "platform" : lv >= 2 ? "cliff-wrong-formula" : "cliff-up", sig: `diff|${sc.id}|${v0}|${a}|${h0}|${yLand}|${lv}`, stem: st, fig: fig(p), parts,
          scaffold: lv === 0 ? [L("1. Components.  2. Vertical: solve \\(y_{\\text{land}} = y_0 + v_{0y}t - \\tfrac12 gt^2\\) for t (later root).  3. Range \\(= v_{0x}t\\).", "1. Composantes.  2. Vertical : résolvez \\(y_{\\text{sol}} = y_0 + v_{0y}t - \\tfrac12 gt^2\\) (racine la plus tardive).  3. Portée \\(= v_{0x}t\\).", "1. Componentes.  2. Vertical: resuelve \\(y_{\\text{suelo}} = y_0 + v_{0y}t - \\tfrac12 gt^2\\) (raíz mayor).  3. Alcance \\(= v_{0x}t\\).", "1. Komponenten.  2. Vertikal: löse \\(y_{\\text{Boden}} = y_0 + v_{0y}t - \\tfrac12 gt^2\\) (spätere Lösung).  3. Weite \\(= v_{0x}t\\).", "1. 分解速度。2. 竖直：解 \\(y_{\\text{地}} = y_0 + v_{0y}t - \\tfrac12 gt^2\\)（取较晚的根）。3. 水平位移 \\(= v_{0x}t\\)。")] : null,
          hints: [...hintsFor.comp.slice(1), hintsFor.vert[1], hintsFor.horiz[1]],
          solution: [fill(S.comp, { v0: n3(v0), a: `${a}^\\circ`, vx: tex(p.vx), vy: tex(p.vy) }), fill(S.apex, { ta: tex(p.tApex), rise: tex(p.yMax - h0) }), fill(S.land, { dy: tex(yLand - h0), vy: tex(p.vy), T: tex(p.tLand) }), fill(S.rangeS, { vx: tex(p.vx), T: tex(p.tLand), R: tex(p.range) })] };
      }
      throw new Error("no valid scenario");
    },
  });

  // ───────── 6. launched downward at an angle ─────────
  fam({
    id: "ph_downward", sub: "PC.downward", subs: ["PC.downward", "PC.impact", "PC.range"], title: "Launched below the horizontal", concepts: ["phys.heights"], modes: ["normal", "challenge", "nightmare"],
    templates: ["roof", "dive"], complexity: { normal: 2, challenge: 3, nightmare: 4 },
    gen(r, mode) {
      const lv = LV(mode), v0 = between(r, 5, 18), a = -between(r, 10, 50), h = between(r, 8, 45);
      const p = P.launch({ v0, angle: a, h0: h, yLand: 0 });
      const parts = [qty("a", T.tof, "time", p.tLand, { skills: ["time", "signs", "unequal"], positive: true, wrongs: [{ value: (-Math.abs(p.vy) + Math.sqrt(p.vy * p.vy + 2 * G * h)) / G * -1 + 2 * (Math.sqrt(p.vy * p.vy + 2 * G * h)) / G, key: "ph.w.signG", cat: "signs" }, { value: Math.sqrt((2 * h) / G), key: "ph.w.heightIgnored", cat: "conceptual" }] }),
        qty("b", T.range, "length", p.range, { skills: ["range"], positive: true })];
      if (lv >= 1) parts.push(qty("c", T.impactSpeed, "speed", p.impact.speed, { skills: ["decomp"], magnitude: true, wrongs: [{ value: Math.abs(p.impact.vy), key: "ph.w.vertical", cat: "conceptual" }] }));
      if (lv === 2) parts.push(qty("d", T.impactAngle, "angle", p.impact.angleBelow, { skills: ["decomp"], signed: false, wrongs: [{ value: 90 - p.impact.angleBelow, key: "ph.w.complement", cat: "conceptual" }] }));
      return { kind: "wr", template: "roof", sig: `downA|${v0}|${a}|${h}|${lv}`,
        stem: join(L(`A ball is thrown from a rooftop ${h} m above the ground at ${v0} m/s, aimed ${-a}° below the horizontal.`, `Une balle est lancée d'un toit à ${h} m du sol à ${v0} m/s, dirigée à ${-a}° sous l'horizontale.`, `Se lanza una pelota desde una azotea a ${h} m del suelo a ${v0} m/s, apuntando ${-a}° bajo la horizontal.`, `Ein Ball wird von einem Dach ${h} m über dem Boden mit ${v0} m/s geworfen, ${-a}° unter die Horizontale gerichtet.`, `从离地 ${h} m 的屋顶以 ${v0} m/s 抛出一个球，方向在水平线下方 ${-a}°。`), T.model, T.upPos),
        fig: fig(p), parts,
        hints: [L("Below the horizontal: \\(v_{0y} = v_0\\sin\\theta\\) is negative.", "Sous l'horizontale : \\(v_{0y} = v_0\\sin\\theta\\) est négatif.", "Bajo la horizontal: \\(v_{0y} = v_0\\sin\\theta\\) es negativo.", "Unter der Horizontalen ist \\(v_{0y} = v_0\\sin\\theta\\) negativ.", "在水平线以下：\\(v_{0y} = v_0\\sin\\theta\\) 为负。"), hintsFor.vert[1], ...hintsFor.impact],
        solution: [fill(S.comp, { v0: n3(v0), a: `(${a}^\\circ)`, vx: tex(p.vx), vy: tex(p.vy) }), fill(S.land, { dy: `-${h}`, vy: `(${tex(p.vy)})`, T: tex(p.tLand) }), fill(S.rangeS, { vx: tex(p.vx), T: tex(p.tLand), R: tex(p.range) }), ...(lv >= 1 ? [fill(S.impactS, { vyI: tex(p.impact.vy), vx: tex(p.vx), sp: tex(p.impact.speed), ang: `${n3(p.impact.angleBelow)}°` })] : [])] };
    },
  });

  // ───────── 7. velocity and position at a given time ─────────
  fam({
    id: "ph_velocity_at", sub: "PC.velocity_at", subs: ["PC.velocity_at", "PC.model"], title: "Velocity at a moment", concepts: ["phys.model"], modes: ["simple", "normal", "challenge", "nightmare"],
    templates: ["rising", "falling", "position"], complexity: { simple: 1, normal: 2, challenge: 3, nightmare: 3 },
    gen(r, mode) {
      const lv = LV(mode), sc = pick(r, ANGLED.filter((s) => s.id !== "frog")), v0 = between(r, Math.max(12, sc.v[0]), sc.v[1]), a = between(r, 30, 65);
      const p = P.launch({ v0, angle: a, h0: 0, yLand: 0 });
      const falling = lv >= 1 && r() < 0.6;
      const t = Math.round((falling ? p.tApex + (p.tLand - p.tApex) * (0.3 + 0.5 * r()) : p.tApex * (0.25 + 0.5 * r())) * 10) / 10;
      if (!(t > 0.05 && t < p.tLand) || Math.abs(t - p.tApex) < 0.15) throw new Error("t too close to the top");
      const s = P.stateAt(p, t), ts = `${n3(t)} s`;
      const parts = [qty("a", fill(T.vxAt, { t: ts }), "speed", s.vx, { skills: ["horizontal", "concepts"], wrongs: [{ value: v0 * Math.cos(a * P.DEG) - G * t, key: "ph.w.vxChanges", cat: "conceptual" }] }),
        qty("b", fill(T.vyAt, { t: ts }), "speed", s.vy, { skills: ["vertical", "signs"], wrongs: [{ value: p.vy + G * t, key: "ph.w.signG", cat: "signs" }] })];
      if (lv >= 1) parts.push(pmc(r, "c", T.risingFalling, s.vy > 0 ? T.rising : T.falling, [s.vy > 0 ? T.falling : T.rising, T.atTop, T.stopped], { skills: ["signs", "concepts"] }));
      if (lv >= 2) parts.push(qty("d", fill(T.speedAt, { t: ts }), "speed", s.speed, { skills: ["decomp"], magnitude: true, wrongs: [{ value: Math.abs(s.vy), key: "ph.w.vertical", cat: "conceptual" }] }));
      if (lv === 3) parts.push(qty("e", fill(T.yAt, { t: ts }), "length", s.y, { skills: ["vertical", "equations"], wrongs: [{ value: p.vy * t - G * t * t, key: "ph.w.half", cat: "algebra" }] }));
      return { kind: "wr", template: lv === 3 ? "position" : s.vy > 0 ? "rising" : "falling", sig: `vat|${sc.id}|${v0}|${a}|${t}|${lv}`,
        stem: join(fill(sc.t, { v: q(v0, "m/s"), a: deg(a) }), levelGround, T.model, T.upPos), fig: { ...fig(p), mark: t }, parts,
        scaffold: lv === 0 ? [L("\\(v_x\\) never changes. \\(v_y = v_{0y} - gt\\).", "\\(v_x\\) ne change jamais. \\(v_y = v_{0y} - gt\\).", "\\(v_x\\) nunca cambia. \\(v_y = v_{0y} - gt\\).", "\\(v_x\\) ändert sich nie. \\(v_y = v_{0y} - gt\\).", "\\(v_x\\) 始终不变。\\(v_y = v_{0y} - gt\\)。")] : null,
        hints: [hintsFor.horiz[0], L("\\(v_y = v_{0y} - gt\\); a negative \\(v_y\\) means it's on the way down.", "\\(v_y = v_{0y} - gt\\) ; un \\(v_y\\) négatif signifie qu'il descend.", "\\(v_y = v_{0y} - gt\\); una \\(v_y\\) negativa significa que baja.", "\\(v_y = v_{0y} - gt\\); ein negatives \\(v_y\\) heißt: Es fällt.", "\\(v_y = v_{0y} - gt\\)；\\(v_y\\) 为负表示正在下落。"), hintsFor.impact[0]],
        solution: [fill(S.comp, { v0: n3(v0), a: `${a}^\\circ`, vx: tex(p.vx), vy: tex(p.vy) }), L(`\\(v_x = ${tex(s.vx)}\\ \\text{m/s}\\) (unchanged); \\(v_y = ${tex(p.vy)} - 9.81(${n3(t)}) = ${tex(s.vy)}\\ \\text{m/s}\\).`, `\\(v_x = ${tex(s.vx)}\\ \\text{m/s}\\) (inchangée) ; \\(v_y = ${tex(p.vy)} - 9,81(${n3(t)}) = ${tex(s.vy)}\\ \\text{m/s}\\).`, `\\(v_x = ${tex(s.vx)}\\ \\text{m/s}\\) (sin cambio); \\(v_y = ${tex(p.vy)} - 9,81(${n3(t)}) = ${tex(s.vy)}\\ \\text{m/s}\\).`, `\\(v_x = ${tex(s.vx)}\\ \\text{m/s}\\) (unverändert); \\(v_y = ${tex(p.vy)} - 9,81(${n3(t)}) = ${tex(s.vy)}\\ \\text{m/s}\\).`, `\\(v_x = ${tex(s.vx)}\\ \\text{m/s}\\)（不变）；\\(v_y = ${tex(p.vy)} - 9.81(${n3(t)}) = ${tex(s.vy)}\\ \\text{m/s}\\)。`),
          ...(lv >= 2 ? [L(`Speed \\(= \\sqrt{v_x^2 + v_y^2} = ${tex(s.speed)}\\ \\text{m/s}\\).`, `Vitesse \\(= \\sqrt{v_x^2 + v_y^2} = ${tex(s.speed)}\\ \\text{m/s}\\).`, `Rapidez \\(= \\sqrt{v_x^2 + v_y^2} = ${tex(s.speed)}\\ \\text{m/s}\\).`, `Betrag \\(= \\sqrt{v_x^2 + v_y^2} = ${tex(s.speed)}\\ \\text{m/s}\\).`, `速率 \\(= \\sqrt{v_x^2 + v_y^2} = ${tex(s.speed)}\\ \\text{m/s}\\)。`)] : []),
          ...(lv === 3 ? [L(`\\(y = ${tex(p.vy)}(${n3(t)}) - \\tfrac12(9.81)(${n3(t)})^2 = ${tex(s.y)}\\ \\text{m}\\).`, `\\(y = ${tex(p.vy)}(${n3(t)}) - \\tfrac12(9,81)(${n3(t)})^2 = ${tex(s.y)}\\ \\text{m}\\).`, `\\(y = ${tex(p.vy)}(${n3(t)}) - \\tfrac12(9,81)(${n3(t)})^2 = ${tex(s.y)}\\ \\text{m}\\).`, `\\(y = ${tex(p.vy)}(${n3(t)}) - \\tfrac12(9,81)(${n3(t)})^2 = ${tex(s.y)}\\ \\text{m}\\).`, `\\(y = ${tex(p.vy)}(${n3(t)}) - \\tfrac12(9.81)(${n3(t)})^2 = ${tex(s.y)}\\ \\text{m}\\)。`)] : [])] };
    },
  });

  // ───────── 8. find the launch conditions (inverse problems, solved from the model) ─────────
  fam({
    id: "ph_inverse", sub: "PC.inverse", subs: ["PC.inverse", "PC.range"], title: "Finding launch speed or angle", concepts: ["phys.angled", "phys.horizontal"], modes: ["normal", "challenge", "nightmare"],
    templates: ["speed-from-range", "angle-from-time", "target"], complexity: { normal: 2, challenge: 3, nightmare: 4 },
    gen(r, mode) {
      const lv = LV(mode);
      if (lv === 1) {
        const a = pick(r, [30, 35, 40, 45, 50, 55, 60]), R = between(r, 20, 90);
        const v0 = Math.sqrt((R * G) / Math.sin(2 * a * P.DEG)), p = P.launch({ v0, angle: a });
        return { kind: "wr", template: "speed-from-range", sig: `invR|${a}|${R}`,
          stem: join(L(`A ball is launched from level ground at ${a}° above the horizontal and lands ${R} m away on the same level.`, `Une balle est lancée depuis un sol plat à ${a}° au-dessus de l'horizontale et retombe à ${R} m au même niveau.`, `Se lanza una pelota desde suelo llano a ${a}° sobre la horizontal y cae a ${R} m al mismo nivel.`, `Ein Ball wird vom ebenen Boden unter ${a}° geworfen und landet ${R} m entfernt auf gleicher Höhe.`, `从水平地面以与水平方向成 ${a}° 的角度抛出一个球，落在同一高度 ${R} m 外。`), T.model),
          fig: { type: "scene", h0: 0, yLand: 0, v0, angle: a, range: R, show: ["angle", "range"] },
          parts: [qty("a", T.v0, "speed", v0, { skills: ["range", "equations"], magnitude: true, wrongs: [{ value: (R * G) / Math.sin(2 * a * P.DEG), key: "ph.w.noSqrt", cat: "algebra" }] }), qty("b", T.tof, "time", p.tLand, { skills: ["time"], positive: true, wrongs: [{ value: p.tApex, key: "ph.w.apexTime", cat: "conceptual" }] })],
          hints: [L("Level ground, so \\(R = v_0^2\\sin 2\\theta / g\\) applies. Solve for \\(v_0\\).", "Sol plat : \\(R = v_0^2\\sin 2\\theta / g\\) s'applique. Isolez \\(v_0\\).", "Suelo llano: vale \\(R = v_0^2\\sin 2\\theta / g\\). Despeja \\(v_0\\).", "Ebener Boden: \\(R = v_0^2\\sin 2\\theta / g\\) gilt. Löse nach \\(v_0\\) auf.", "起落同高，可用 \\(R = v_0^2\\sin 2\\theta / g\\)，解出 \\(v_0\\)。")],
          solution: [L(`\\(v_0 = \\sqrt{Rg/\\sin 2\\theta} = \\sqrt{${R}(9.81)/\\sin ${2 * a}^\\circ} = ${tex(v0)}\\ \\text{m/s}\\).`, `\\(v_0 = \\sqrt{Rg/\\sin 2\\theta} = \\sqrt{${R}(9,81)/\\sin ${2 * a}^\\circ} = ${tex(v0)}\\ \\text{m/s}\\).`, `\\(v_0 = \\sqrt{Rg/\\sin 2\\theta} = \\sqrt{${R}(9,81)/\\sin ${2 * a}^\\circ} = ${tex(v0)}\\ \\text{m/s}\\).`, `\\(v_0 = \\sqrt{Rg/\\sin 2\\theta} = \\sqrt{${R}(9,81)/\\sin ${2 * a}^\\circ} = ${tex(v0)}\\ \\text{m/s}\\).`, `\\(v_0 = \\sqrt{Rg/\\sin 2\\theta} = \\sqrt{${R}(9.81)/\\sin ${2 * a}^\\circ} = ${tex(v0)}\\ \\text{m/s}\\)。`),
            L(`\\(T = 2v_0\\sin\\theta/g = ${tex(p.tLand)}\\ \\text{s}\\).`, `\\(T = 2v_0\\sin\\theta/g = ${tex(p.tLand)}\\ \\text{s}\\).`, `\\(T = 2v_0\\sin\\theta/g = ${tex(p.tLand)}\\ \\text{s}\\).`, `\\(T = 2v_0\\sin\\theta/g = ${tex(p.tLand)}\\ \\text{s}\\).`, `\\(T = 2v_0\\sin\\theta/g = ${tex(p.tLand)}\\ \\text{s}\\)。`)] };
      }
      if (lv === 2) {
        const v0 = between(r, 12, 30), Tt = Math.round(((2 * v0 * Math.sin(between(r, 20, 70) * P.DEG)) / G) * 10) / 10;
        const a = Math.asin((G * Tt) / (2 * v0)) / P.DEG, p = P.launch({ v0, angle: a });
        return { kind: "wr", template: "angle-from-time", sig: `invT|${v0}|${Tt}`,
          stem: join(L(`A ball launched from level ground at ${v0} m/s stays in the air for ${n3(Tt)} s before landing at the same level.`, `Une balle lancée d'un sol plat à ${v0} m/s reste ${n3(Tt)} s en l'air avant de retomber au même niveau.`, `Una pelota lanzada desde suelo llano a ${v0} m/s está ${n3(Tt)} s en el aire antes de caer al mismo nivel.`, `Ein vom ebenen Boden mit ${v0} m/s geworfener Ball ist ${n3(Tt)} s in der Luft und landet auf gleicher Höhe.`, `从水平地面以 ${v0} m/s 抛出的球在空中停留 ${n3(Tt)} s，落回同一高度。`), T.model),
          parts: [qty("a", T.vy, "speed", p.vy, { skills: ["vertical", "time"], wrongs: [{ value: G * Tt, key: "ph.w.apexTime", cat: "conceptual" }] }), qty("b", T.theta, "angle", a, { skills: ["decomp", "equations"], signed: false, wrongs: [{ value: 90 - a, key: "ph.w.complement", cat: "conceptual" }, { value: Math.asin((G * Tt) / (2 * v0)), key: "ph.w.radians", cat: "units" }] }), qty("c", T.range, "length", p.range, { skills: ["range"], positive: true })],
          hints: [L("Same height: \\(v_{0y} = gT/2\\). Then \\(\\sin\\theta = v_{0y}/v_0\\).", "Même hauteur : \\(v_{0y} = gT/2\\). Puis \\(\\sin\\theta = v_{0y}/v_0\\).", "Misma altura: \\(v_{0y} = gT/2\\). Luego \\(\\sin\\theta = v_{0y}/v_0\\).", "Gleiche Höhe: \\(v_{0y} = gT/2\\). Dann \\(\\sin\\theta = v_{0y}/v_0\\).", "起落同高：\\(v_{0y} = gT/2\\)，再由 \\(\\sin\\theta = v_{0y}/v_0\\) 求角。")],
          solution: [L(`\\(v_{0y} = 9.81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\); \\(\\theta = \\sin^{-1}(${tex(p.vy)}/${v0}) = ${tex(a)}^\\circ\\).`, `\\(v_{0y} = 9,81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\) ; \\(\\theta = \\sin^{-1}(${tex(p.vy)}/${v0}) = ${tex(a)}^\\circ\\).`, `\\(v_{0y} = 9,81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\); \\(\\theta = \\sin^{-1}(${tex(p.vy)}/${v0}) = ${tex(a)}^\\circ\\).`, `\\(v_{0y} = 9,81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\); \\(\\theta = \\sin^{-1}(${tex(p.vy)}/${v0}) = ${tex(a)}^\\circ\\).`, `\\(v_{0y} = 9.81(${n3(Tt)})/2 = ${tex(p.vy)}\\ \\text{m/s}\\)；\\(\\theta = \\sin^{-1}(${tex(p.vy)}/${v0}) = ${tex(a)}^\\circ\\)。`),
            fill(S.rangeS, { vx: tex(p.vx), T: n3(Tt), R: tex(p.range) })] };
      }
      // nightmare: hit a target at (D, H) with a fixed launch angle — the speed needed (only when D·tanθ > H)
      let tries = 0;
      while (tries++ < 40) {
        const a = between(r, 25, 60), D = between(r, 10, 40), H = between(r, -6, 8);
        const tn = D * Math.tan(a * P.DEG) - H;
        if (tn < 2) continue;
        const v0 = (D / Math.cos(a * P.DEG)) * Math.sqrt(G / (2 * tn));
        const p = P.launch({ v0, angle: a, h0: 0, yLand: H });
        if (!p.ok || Math.abs(p.range - D) > 1e-6 * D) continue;
        const t = D / p.vx;
        return { kind: "wr", template: "target", sig: `target|${a}|${D}|${H}`,
          stem: join(L(`A basketball is launched at ${a}° above the horizontal. The hoop is ${D} m away horizontally and ${H >= 0 ? `${H} m above` : `${-H} m below`} the release point; the ball goes through it on the way down.`, `Un ballon de basket est lancé à ${a}° au-dessus de l'horizontale. Le panier est à ${D} m à l'horizontale et ${H >= 0 ? `${H} m au-dessus` : `${-H} m sous`} le point de lâcher ; le ballon y entre en descendant.`, `Se lanza un balón de baloncesto a ${a}° sobre la horizontal. El aro está a ${D} m en horizontal y ${H >= 0 ? `${H} m por encima` : `${-H} m por debajo`} del punto de lanzamiento; entra de bajada.`, `Ein Basketball wird unter ${a}° geworfen. Der Korb ist horizontal ${D} m entfernt und ${H >= 0 ? `${H} m über` : `${-H} m unter`} dem Abwurfpunkt; der Ball fällt hinein.`, `一个篮球以与水平方向成 ${a}° 的角度投出。篮筐水平距离 ${D} m，${H >= 0 ? `比出手点高 ${H} m` : `比出手点低 ${-H} m`}，球在下落时进筐。`), T.model),
          fig: { type: "scene", h0: 0, yLand: H, v0, angle: a, range: D, show: ["angle", "range", "target"], target: { x: D, y: H } },
          parts: [qty("a", T.v0, "speed", v0, { skills: ["equations", "unequal"], magnitude: true, wrongs: [{ value: Math.sqrt((D * G) / Math.sin(2 * a * P.DEG)), key: "ph.w.rangeFormula", cat: "equation" }] }), qty("b", L("Time to reach the hoop", "Temps pour atteindre le panier", "Tiempo hasta el aro", "Zeit bis zum Korb", "到达篮筐的时间"), "time", t, { skills: ["time"], positive: true })],
          hints: [L("Write both directions with the same t: \\(D = v_0\\cos\\theta\\,t\\) and \\(H = v_0\\sin\\theta\\,t - \\tfrac12 gt^2\\).", "Écrivez les deux directions avec le même t : \\(D = v_0\\cos\\theta\\,t\\) et \\(H = v_0\\sin\\theta\\,t - \\tfrac12 gt^2\\).", "Escribe ambas direcciones con el mismo t: \\(D = v_0\\cos\\theta\\,t\\) y \\(H = v_0\\sin\\theta\\,t - \\tfrac12 gt^2\\).", "Schreibe beide Richtungen mit demselben t: \\(D = v_0\\cos\\theta\\,t\\) und \\(H = v_0\\sin\\theta\\,t - \\tfrac12 gt^2\\).", "两个方向用同一个 t：\\(D = v_0\\cos\\theta\\,t\\)，\\(H = v_0\\sin\\theta\\,t - \\tfrac12 gt^2\\)。"), L("Substitute \\(t = D/(v_0\\cos\\theta)\\) into the vertical equation and solve for \\(v_0\\).", "Remplacez \\(t = D/(v_0\\cos\\theta)\\) dans l'équation verticale et isolez \\(v_0\\).", "Sustituye \\(t = D/(v_0\\cos\\theta)\\) en la ecuación vertical y despeja \\(v_0\\).", "Setze \\(t = D/(v_0\\cos\\theta)\\) in die vertikale Gleichung ein und löse nach \\(v_0\\).", "把 \\(t = D/(v_0\\cos\\theta)\\) 代入竖直方程，解出 \\(v_0\\)。")],
          solution: [L(`\\(H = D\\tan\\theta - \\dfrac{gD^2}{2v_0^2\\cos^2\\theta} \\Rightarrow v_0 = \\dfrac{D}{\\cos\\theta}\\sqrt{\\dfrac{g}{2(D\\tan\\theta - H)}} = ${tex(v0)}\\ \\text{m/s}\\).`, `\\(H = D\\tan\\theta - \\dfrac{gD^2}{2v_0^2\\cos^2\\theta} \\Rightarrow v_0 = \\dfrac{D}{\\cos\\theta}\\sqrt{\\dfrac{g}{2(D\\tan\\theta - H)}} = ${tex(v0)}\\ \\text{m/s}\\).`, `\\(H = D\\tan\\theta - \\dfrac{gD^2}{2v_0^2\\cos^2\\theta} \\Rightarrow v_0 = \\dfrac{D}{\\cos\\theta}\\sqrt{\\dfrac{g}{2(D\\tan\\theta - H)}} = ${tex(v0)}\\ \\text{m/s}\\).`, `\\(H = D\\tan\\theta - \\dfrac{gD^2}{2v_0^2\\cos^2\\theta} \\Rightarrow v_0 = \\dfrac{D}{\\cos\\theta}\\sqrt{\\dfrac{g}{2(D\\tan\\theta - H)}} = ${tex(v0)}\\ \\text{m/s}\\).`, `\\(H = D\\tan\\theta - \\dfrac{gD^2}{2v_0^2\\cos^2\\theta} \\Rightarrow v_0 = \\dfrac{D}{\\cos\\theta}\\sqrt{\\dfrac{g}{2(D\\tan\\theta - H)}} = ${tex(v0)}\\ \\text{m/s}\\)。`),
            L(`\\(t = D/(v_0\\cos\\theta) = ${tex(t)}\\ \\text{s}\\). Check: this is after the top (\\(t > ${tex(p.tApex)}\\ \\text{s}\\)), so it really goes in on the way down.`, `\\(t = D/(v_0\\cos\\theta) = ${tex(t)}\\ \\text{s}\\). Vérification : après le sommet (\\(t > ${tex(p.tApex)}\\ \\text{s}\\)), donc en descendant.`, `\\(t = D/(v_0\\cos\\theta) = ${tex(t)}\\ \\text{s}\\). Comprobación: es después de la cima (\\(t > ${tex(p.tApex)}\\ \\text{s}\\)), así que entra de bajada.`, `\\(t = D/(v_0\\cos\\theta) = ${tex(t)}\\ \\text{s}\\). Probe: nach dem Scheitel (\\(t > ${tex(p.tApex)}\\ \\text{s}\\)), also im Fallen.`, `\\(t = D/(v_0\\cos\\theta) = ${tex(t)}\\ \\text{s}\\)。检验：晚于最高点时刻（\\(t > ${tex(p.tApex)}\\ \\text{s}\\)），确实是下落时进筐。`)] };
      }
      throw new Error("no target");
    },
  });

  // ───────── 9. multi-step problem (linked intermediate results) ─────────
  fam({
    id: "ph_multistep", sub: "PC.multistep", subs: ["PC.multistep", "PC.angled_diff", "PC.max_height", "PC.range", "PC.impact"], title: "Multi-step projectile problem", concepts: ["phys.heights"], modes: ["normal", "challenge", "nightmare"],
    templates: ["chain"], complexity: { normal: 3, challenge: 4, nightmare: 4 },
    gen(r, mode) {
      const lv = LV(mode), sc = pick(r, ANGLED.filter((s) => s.id === "ball" || s.id === "kick" || s.id === "golf"));
      for (let k = 0; k < 40; k++) {
        const v0 = between(r, 14, 28), a = between(r, 25, 60), h0 = between(r, 3, 30);
        const p = P.launch({ v0, angle: a, h0, yLand: 0 });
        if (!p.ok || p.range < 10) continue;
        const parts = [qty("a", T.vx, "speed", p.vx, { skills: ["decomp"], wrongs: wrongsVxVy(v0, a, "x"), label: "(a)" }), qty("b", T.vy, "speed", p.vy, { skills: ["decomp"], wrongs: wrongsVxVy(v0, a, "y") }),
          qty("c", T.tApex, "time", p.tApex, { skills: ["vertical", "time"], positive: true }), qty("d", T.hMaxAboveGround, "length", p.yMax, { skills: ["maxh", "unequal"], positive: true, wrongs: [{ value: p.yMax - h0, key: "ph.w.aboveLaunch", cat: "conceptual" }] }),
          qty("e", T.tof, "time", p.tLand, { skills: ["time", "unequal"], positive: true, wrongs: [{ value: 2 * p.tApex, key: "ph.w.rangeFormula", cat: "equation" }] }),
          qty("f", T.range, "length", p.range, { skills: ["range", "unequal"], positive: true, wrongs: [{ value: P.sameHeightRange(v0, a), key: "ph.w.rangeFormula", cat: "equation" }] })];
        if (lv >= 2) parts.push(qty("g", T.impactSpeed, "speed", p.impact.speed, { skills: ["decomp"], magnitude: true, wrongs: [{ value: Math.abs(p.impact.vy), key: "ph.w.vertical", cat: "conceptual" }] }));
        if (lv === 3) parts.splice(0, 2); // nightmare: no component scaffolding
        return { kind: "wr", template: "chain", sig: `chain|${sc.id}|${v0}|${a}|${h0}|${lv}`, multistep: true,
          stem: join(fill(sc.t, { v: q(v0, "m/s"), a: deg(a) }), fill(fromHeight, { h: q(h0, "m") }), T.model, L("Answer the parts in order; each uses the ones before.", "Répondez aux parties dans l'ordre ; chacune utilise les précédentes.", "Responde las partes en orden; cada una usa las anteriores.", "Beantworte die Teile der Reihe nach; jeder nutzt die vorherigen.", "按顺序作答，每一小问都用到前面的结果。")),
          fig: fig(p), parts,
          hints: [...hintsFor.comp.slice(1), ...hintsFor.vert, hintsFor.horiz[1], ...hintsFor.impact],
          solution: [fill(S.comp, { v0: n3(v0), a: `${a}^\\circ`, vx: tex(p.vx), vy: tex(p.vy) }), fill(S.apex, { ta: tex(p.tApex), rise: tex(p.yMax - h0) }), L(`Above the ground: ${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m.`, `Au-dessus du sol : ${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m.`, `Sobre el suelo: ${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m.`, `Über dem Boden: ${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m.`, `离地：${h0} + ${n3(p.yMax - h0)} = ${n3(p.yMax)} m。`),
            fill(S.land, { dy: `-${h0}`, vy: tex(p.vy), T: tex(p.tLand) }), fill(S.rangeS, { vx: tex(p.vx), T: tex(p.tLand), R: tex(p.range) }), ...(lv >= 2 ? [fill(S.impactS, { vyI: tex(p.impact.vy), vx: tex(p.vx), sp: tex(p.impact.speed), ang: `${n3(p.impact.angleBelow)}°` })] : [])] };
      }
      throw new Error("no chain");
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
