/*
 * PHYSICS 11 CURRICULUM MAP — built from the official BC Physics 11 content
 * (https://curriculum.gov.bc.ca/curriculum/science/11/physics): vectors and scalars · horizontal (1-D) motion ·
 * projectile motion (vertical, horizontal and angled launches) · contact forces · Newton's laws · forces in systems ·
 * energy and work · power and efficiency · simple machines · DC electricity · thermal equilibrium · waves · sound —
 * plus the curricular competencies on measurement (SI units, significant figures, scientific notation, uncertainty).
 * The unit letters below are this app's own grouping, not an official division of the course.
 *
 * Coverage statuses are COMPUTED, never declared complete:
 *   tested      — has generated question families (each covered by automated generator tests)
 *   validation  — has a lesson or tool but no practice questions yet, or needs teacher review before relying on it
 *   planned     — in the verified curriculum, not built yet
 *   supplementary — outside the core Physics 11 content (offered or noted as enrichment only)
 */
(function (root) {
  "use strict";
  const L = (en, fr, es, de, zh) => ({ en, fr, es, de, zh });
  const U = (id, title, subs, note) => ({ id, title, subs: subs.map(([sid, t, lessons = [], extra = {}]) => ({ id: `${id}.${sid}`, unit: id, title: t, lessons, ...extra })), note });
  const UNITS = [
    U("PA", L("Vectors, measurement and units", "Vecteurs, mesure et unités", "Vectores, medición y unidades", "Vektoren, Messen und Einheiten", "矢量、测量与单位"), [
      ["scalar_vector", L("Scalars and vectors", "Scalaires et vecteurs", "Escalares y vectores", "Skalare und Vektoren", "标量与矢量"), ["phys.vectors"], { tool: "vector" }],
      ["components", L("Vector components (right-triangle trigonometry)", "Composantes d'un vecteur (trigonométrie)", "Componentes de un vector (trigonometría)", "Vektorkomponenten (Trigonometrie)", "矢量的分量（直角三角形三角函数）"), ["phys.vectors"], { tool: "vector" }],
      ["addition", L("Adding and subtracting vectors", "Addition et soustraction de vecteurs", "Suma y resta de vectores", "Vektoren addieren und subtrahieren", "矢量的加减")],
      ["units", L("SI units, conversions, significant figures, scientific notation", "Unités SI, conversions, chiffres significatifs, notation scientifique", "Unidades SI, conversiones, cifras significativas, notación científica", "SI-Einheiten, Umrechnungen, signifikante Stellen, wissenschaftliche Schreibweise", "SI 单位、换算、有效数字、科学记数法"), ["phys.units"]],
      ["uncertainty", L("Uncertainty and percent error", "Incertitude et pourcentage d'erreur", "Incertidumbre y error porcentual", "Messunsicherheit und prozentualer Fehler", "不确定度与百分误差")],
    ]),
    U("PB", L("Horizontal motion (1-D kinematics)", "Mouvement horizontal (cinématique 1-D)", "Movimiento horizontal (cinemática 1-D)", "Horizontale Bewegung (1-D-Kinematik)", "水平运动（一维运动学）"), [
      ["uniform", L("Uniform motion", "Mouvement uniforme", "Movimiento uniforme", "Gleichförmige Bewegung", "匀速运动")],
      ["accelerated", L("Uniformly accelerated motion", "Mouvement uniformément accéléré", "Movimiento uniformemente acelerado", "Gleichmäßig beschleunigte Bewegung", "匀变速运动")],
      ["graphs", L("Motion graphs: gradients and areas", "Graphiques du mouvement : pentes et aires", "Gráficas del movimiento: pendientes y áreas", "Bewegungsdiagramme: Steigungen und Flächen", "运动图像：斜率与面积"), ["phys.graphs"], { tool: "graphs" }],
    ]),
    U("PC", L("Projectile motion", "Mouvement des projectiles", "Movimiento de proyectiles", "Wurfbewegungen", "抛体运动"), [
      ["model", L("The independent-axes model", "Le modèle des axes indépendants", "El modelo de ejes independientes", "Das Modell unabhängiger Achsen", "两个方向相互独立的模型"), ["phys.model"], { tool: "explorer" }],
      ["concepts", L("Conceptual reasoning: claim and reason", "Raisonnement conceptuel : affirmation et justification", "Razonamiento conceptual: afirmación y razón", "Begriffliches Denken: Aussage und Begründung", "概念推理：结论与理由"), ["phys.model"]],
      ["vertical", L("Vertical launches (1-D)", "Lancers verticaux (1-D)", "Lanzamientos verticales (1-D)", "Senkrechte Würfe (1-D)", "竖直上抛与下抛（一维）"), ["phys.vertical"], { tool: "graphs" }],
      ["horizontal", L("Horizontal launches", "Lancers horizontaux", "Lanzamientos horizontales", "Waagerechte Würfe", "平抛运动"), ["phys.horizontal"], { tool: "explorer" }],
      ["angled_same", L("Angled launches, same launch and landing height", "Lancers obliques, même hauteur de départ et d'arrivée", "Lanzamientos oblicuos, misma altura de salida y llegada", "Schräge Würfe, gleiche Abwurf- und Landehöhe", "斜抛：起落同高"), ["phys.angled"], { tool: "explorer" }],
      ["angled_diff", L("Angled launches, different heights", "Lancers obliques, hauteurs différentes", "Lanzamientos oblicuos, alturas distintas", "Schräge Würfe, verschiedene Höhen", "斜抛：起落不同高"), ["phys.heights"], { tool: "explorer" }],
      ["downward", L("Launched below the horizontal", "Lancers sous l'horizontale", "Lanzamientos bajo la horizontal", "Würfe unter die Horizontale", "向下斜抛"), ["phys.heights"]],
      ["time", L("Time of flight", "Durée du vol", "Tiempo de vuelo", "Flugzeit", "飞行时间"), ["phys.angled"]],
      ["max_height", L("Maximum height", "Hauteur maximale", "Altura máxima", "Maximale Höhe", "最大高度"), ["phys.vertical"]],
      ["range", L("Horizontal range", "Portée horizontale", "Alcance horizontal", "Wurfweite", "水平射程"), ["phys.angled"]],
      ["velocity_at", L("Velocity components at a moment", "Composantes de la vitesse à un instant", "Componentes de la velocidad en un instante", "Geschwindigkeitskomponenten zu einem Zeitpunkt", "某一时刻的速度分量"), ["phys.model"], { tool: "graphs" }],
      ["impact", L("Impact velocity and direction", "Vitesse et direction à l'impact", "Velocidad y dirección de impacto", "Aufprallgeschwindigkeit und -richtung", "落地速度的大小与方向"), ["phys.heights"]],
      ["inverse", L("Finding launch speed or angle", "Trouver la vitesse ou l'angle de lancement", "Hallar la rapidez o el ángulo de lanzamiento", "Abwurfgeschwindigkeit oder -winkel bestimmen", "求初速率或抛射角"), ["phys.angled"]],
      ["representations", L("Graphs, tables and diagrams", "Graphiques, tableaux et schémas", "Gráficas, tablas y diagramas", "Graphen, Tabellen und Skizzen", "图像、表格与示意图"), ["phys.graphs"], { tool: "graphs" }],
      ["equations", L("Choosing equations and planning a solution", "Choisir les équations et planifier", "Elegir ecuaciones y planificar", "Gleichungen wählen und planen", "选择方程与规划解题"), ["phys.model"]],
      ["multistep", L("Multi-step problems", "Problèmes en plusieurs étapes", "Problemas de varios pasos", "Mehrschrittige Aufgaben", "多步骤问题"), ["phys.heights"]],
      ["errors", L("Error analysis", "Analyse d'erreurs", "Análisis de errores", "Fehleranalyse", "错误分析"), ["phys.heights"]],
      ["insufficient", L("Missing information and assumptions", "Informations manquantes et hypothèses", "Información faltante y suposiciones", "Fehlende Angaben und Annahmen", "信息不足与假设"), ["phys.model"]],
      ["mixed", L("Mixed problems: choose the approach", "Problèmes variés : choisir l'approche", "Problemas mixtos: elige el método", "Gemischte Aufgaben: Ansatz wählen", "综合问题：选择方法"), ["phys.heights"]],
    ]),
    U("PD", L("Forces and Newton's laws", "Forces et lois de Newton", "Fuerzas y leyes de Newton", "Kräfte und newtonsche Gesetze", "力与牛顿定律"), [
      ["contact", L("Contact forces: normal, spring, tension, friction", "Forces de contact : normale, ressort, tension, frottement", "Fuerzas de contacto: normal, resorte, tensión, rozamiento", "Kontaktkräfte: Normal-, Feder-, Seil-, Reibungskraft", "接触力：支持力、弹力、拉力、摩擦力")],
      ["weight", L("Mass, gravity and apparent weight", "Masse, gravité et poids apparent", "Masa, gravedad y peso aparente", "Masse, Gravitation und scheinbares Gewicht", "质量、重力与视重")],
      ["newton", L("Newton's three laws and free-body diagrams", "Les trois lois de Newton et diagrammes de forces", "Las tres leyes de Newton y diagramas de cuerpo libre", "Die drei newtonschen Gesetze und Kräfteskizzen", "牛顿三定律与受力分析图")],
      ["systems", L("Forces in systems: inclines, angled forces, elevators", "Forces dans les systèmes : plans inclinés, forces obliques, ascenseurs", "Fuerzas en sistemas: planos inclinados, fuerzas oblicuas, ascensores", "Kräfte in Systemen: schiefe Ebene, schräge Kräfte, Aufzüge", "系统中的力：斜面、斜向力、电梯")],
    ]),
    U("PE", L("Energy, work, power and machines", "Énergie, travail, puissance et machines", "Energía, trabajo, potencia y máquinas", "Energie, Arbeit, Leistung und Maschinen", "能量、功、功率与机械"), [
      ["work_energy", L("Work and the work–energy principle", "Travail et théorème de l'énergie", "Trabajo y principio trabajo–energía", "Arbeit und Arbeitssatz", "功与动能定理")],
      ["conservation", L("Conservation of energy", "Conservation de l'énergie", "Conservación de la energía", "Energieerhaltung", "能量守恒")],
      ["power", L("Power and efficiency", "Puissance et rendement", "Potencia y eficiencia", "Leistung und Wirkungsgrad", "功率与效率")],
      ["machines", L("Simple machines and mechanical advantage", "Machines simples et avantage mécanique", "Máquinas simples y ventaja mecánica", "Einfache Maschinen und Kraftverhältnis", "简单机械与机械利益")],
    ]),
    U("PF", L("DC electricity", "Électricité en courant continu", "Electricidad de corriente continua", "Gleichstromkreise", "直流电"), [
      ["ohm", L("Current, voltage, resistance and Ohm's law", "Courant, tension, résistance et loi d'Ohm", "Corriente, voltaje, resistencia y ley de Ohm", "Strom, Spannung, Widerstand und ohmsches Gesetz", "电流、电压、电阻与欧姆定律")],
      ["kirchhoff", L("Series and parallel circuits, Kirchhoff's laws", "Circuits série et parallèle, lois de Kirchhoff", "Circuitos en serie y paralelo, leyes de Kirchhoff", "Reihen- und Parallelschaltung, kirchhoffsche Regeln", "串并联电路与基尔霍夫定律")],
      ["practical", L("Terminal voltage vs EMF, fuses, breakers, short circuits", "Tension aux bornes et f.é.m., fusibles, disjoncteurs, courts-circuits", "Tensión en bornes y fem, fusibles, disyuntores, cortocircuitos", "Klemmenspannung und EMK, Sicherungen, Kurzschlüsse", "端电压与电动势、保险丝、断路器、短路")],
    ]),
    U("PG", L("Thermal equilibrium", "Équilibre thermique", "Equilibrio térmico", "Thermisches Gleichgewicht", "热平衡"), [
      ["calorimetry", L("Specific heat capacity and calorimetry", "Capacité thermique massique et calorimétrie", "Calor específico y calorimetría", "Spezifische Wärmekapazität und Kalorimetrie", "比热容与量热")],
    ]),
    U("PH", L("Waves and sound", "Ondes et son", "Ondas y sonido", "Wellen und Schall", "波与声"), [
      ["generation", L("Transverse and longitudinal waves", "Ondes transversales et longitudinales", "Ondas transversales y longitudinales", "Transversal- und Longitudinalwellen", "横波与纵波")],
      ["properties", L("Wave properties: speed, frequency, wavelength, behaviours", "Propriétés des ondes : vitesse, fréquence, longueur d'onde, comportements", "Propiedades: rapidez, frecuencia, longitud de onda, comportamientos", "Welleneigenschaften: Geschwindigkeit, Frequenz, Wellenlänge, Verhalten", "波的性质：波速、频率、波长、传播现象")],
      ["sound", L("Sound: pitch, loudness, speed, Doppler effect", "Son : hauteur, intensité, vitesse, effet Doppler", "Sonido: tono, intensidad, rapidez, efecto Doppler", "Schall: Tonhöhe, Lautstärke, Geschwindigkeit, Doppler-Effekt", "声：音调、响度、声速、多普勒效应")],
      ["resonance", L("Standing waves and resonance", "Ondes stationnaires et résonance", "Ondas estacionarias y resonancia", "Stehende Wellen und Resonanz", "驻波与共振")],
    ]),
    U("PX", L("Supplementary (outside core Physics 11)", "Complémentaire (hors du programme de base)", "Complementario (fuera del núcleo de Física 11)", "Ergänzend (außerhalb des Kerns)", "拓展（不属于物理 11 核心内容）"), [
      ["momentum", L("Momentum and impulse", "Quantité de mouvement et impulsion", "Momento lineal e impulso", "Impuls und Kraftstoß", "动量与冲量"), [], { supplementary: true }],
    ]),
  ];
  const SUBS = UNITS.flatMap((u) => u.subs);
  const bySub = new Map(SUBS.map((s) => [s.id, s]));
  // subtopics whose generated questions are covered by the automated physics generator tests (tests/physics.test.js asserts it)
  const TESTED = new Set(["PA.components", "PA.units", "PC.model", "PC.concepts", "PC.vertical", "PC.horizontal", "PC.angled_same", "PC.angled_diff", "PC.downward", "PC.time", "PC.max_height", "PC.range", "PC.velocity_at", "PC.impact", "PC.inverse", "PC.representations", "PC.equations", "PC.multistep", "PC.errors", "PC.insufficient", "PC.mixed"]);

  function coverage() {
    const B = root.Bank;
    return SUBS.map((s) => {
      const fams = B ? B.FAMILIES.filter((F) => F.subject === "physics" && F.subs.includes(s.id)) : [];
      const modes = ["simple", "normal", "challenge", "nightmare"].filter((m) => fams.some((F) => F.modes.includes(m)));
      const status = s.supplementary ? "supplementary" : fams.length && TESTED.has(s.id) ? "tested" : fams.length || s.lessons.length || s.tool ? "validation" : "planned";
      return { ...s, families: fams.map((F) => F.id), modes, status };
    });
  }
  const api = { UNITS, SUBS, get: (id) => bySub.get(id), coverage, TESTED, SOURCE: "https://curriculum.gov.bc.ca/curriculum/science/11/physics" };
  root.PhysCurriculum = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
