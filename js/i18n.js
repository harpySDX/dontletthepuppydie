/*
 * I18N — interface localization for English, French, Spanish, German and Simplified Chinese.
 *
 *   I18N.t(key, vars)       translated string (falls back to English, then to the key)
 *   I18N.apply(root)        fills  data-i18n="key"  (text) and  data-i18n-attr="placeholder:key;title:key"
 *   I18N.set(lang)          switch language (persisted by the app), re-applies the page, fires "i18n:change"
 *   I18N.note(englishNote)  translate a known checker/validation note, else return it unchanged
 *   I18N.num(n, opts)       locale number formatting
 *
 * Mathematical notation is never translated. Lesson bodies and question text are English; the UI says so.
 */
(function (root) {
  "use strict";
  const LANGS = [
    { id: "en", name: "English", native: "English", html: "en" },
    { id: "fr", name: "French", native: "Français", html: "fr" },
    { id: "es", name: "Spanish", native: "Español", html: "es" },
    { id: "de", name: "German", native: "Deutsch", html: "de" },
    { id: "zh", name: "Chinese (Simplified)", native: "简体中文", html: "zh-Hans" },
  ];

  // key: [en, fr, es, de, zh]
  const T = {
    "app.name": ["DontLetThePuppyDie", "DontLetThePuppyDie", "DontLetThePuppyDie", "DontLetThePuppyDie", "DontLetThePuppyDie"],
    "app.tagline": ["Pre-Calc 11 · Quadratic functions", "Pré-calcul 11 · Fonctions quadratiques", "Precálculo 11 · Funciones cuadráticas", "Pre-Calc 11 · Quadratische Funktionen", "预备微积分 11 · 二次函数"],
    // navigation
    "nav.home": ["Home", "Accueil", "Inicio", "Start", "首页"],
    "nav.practice": ["Practice", "Pratique", "Práctica", "Üben", "练习"],
    "nav.concepts": ["Concepts", "Notions", "Conceptos", "Konzepte", "概念"],
    "nav.room": ["Study Room", "Salle d'étude", "Sala de estudio", "Lernraum", "自习室"],
    "nav.open": ["Open navigation", "Ouvrir la navigation", "Abrir navegación", "Navigation öffnen", "打开导航"],
    "nav.close": ["Close navigation", "Fermer la navigation", "Cerrar navegación", "Navigation schließen", "关闭导航"],
    "nav.settings": ["Settings", "Réglages", "Ajustes", "Einstellungen", "设置"],
    "nav.results": ["Results", "Résultats", "Resultados", "Ergebnisse", "结果"],
    "nav.lobby": ["Group test", "Test de groupe", "Prueba en grupo", "Gruppentest", "小组测试"],
    "nav.test": ["Test in progress", "Test en cours", "Prueba en curso", "Test läuft", "测试进行中"],
    "nav.title": ["Welcome", "Bienvenue", "Bienvenida", "Willkommen", "欢迎"],
    // settings
    "set.title": ["Settings", "Réglages", "Ajustes", "Einstellungen", "设置"],
    "set.language": ["Language", "Langue", "Idioma", "Sprache", "语言"],
    "set.layout": ["Layout", "Disposition", "Diseño", "Layout", "布局"],
    "set.theme": ["Theme", "Thème", "Tema", "Design", "主题"],
    "set.saved": ["Saved on this device. No account needed.", "Enregistré sur cet appareil. Aucun compte requis.", "Guardado en este dispositivo. Sin cuenta.", "Auf diesem Gerät gespeichert. Kein Konto nötig.", "保存在此设备上，无需账户。"],
    "set.contentNote": ["Lessons and question text are in English; the interface is translated.", "Les leçons et les énoncés sont en anglais ; l'interface est traduite.", "Las lecciones y los enunciados están en inglés; la interfaz está traducida.", "Lektionen und Aufgabentexte sind auf Englisch; die Oberfläche ist übersetzt.", "课程与题目为英文；界面已翻译。"],
    "layout.balanced": ["Balanced", "Équilibrée", "Equilibrado", "Ausgewogen", "均衡"],
    "layout.balanced.d": ["Main workspace with compact side panels", "Espace principal et panneaux latéraux compacts", "Espacio principal con paneles laterales compactos", "Hauptbereich mit kompakten Seitenleisten", "主工作区配紧凑侧栏"],
    "layout.focus": ["Focus", "Concentration", "Enfoque", "Fokus", "专注"],
    "layout.focus.d": ["Just the question; everything else on request", "Seulement la question ; le reste sur demande", "Solo la pregunta; lo demás a petición", "Nur die Aufgabe; alles andere auf Abruf", "只显示题目，其余按需打开"],
    "layout.studio": ["Studio", "Studio", "Estudio", "Studio", "工作室"],
    "layout.studio.d": ["Dense: more context, progress and tools in view", "Dense : plus de contexte, de progrès et d'outils", "Denso: más contexto, progreso y herramientas", "Dicht: mehr Kontext, Fortschritt und Werkzeuge", "紧凑：显示更多信息、进度与工具"],
    "theme.light": ["Light Glass", "Verre clair", "Cristal claro", "Helles Glas", "浅色玻璃"],
    "theme.dark": ["Dark Glass", "Verre sombre", "Cristal oscuro", "Dunkles Glas", "深色玻璃"],
    "theme.system": ["System", "Système", "Sistema", "System", "跟随系统"],
    "theme.cinnamon": ["Cinnamon", "Cannelle", "Canela", "Zimt", "肉桂"],
    "theme.blush": ["Blush", "Rose poudré", "Rubor", "Rosé", "腮红粉"],
    "theme.galaxy": ["Galaxy", "Galaxie", "Galaxia", "Galaxie", "星河"],
    "theme.arctic": ["Arctic", "Arctique", "Ártico", "Arktis", "极地"],
    "theme.beach": ["Beach", "Plage", "Playa", "Strand", "海滩"],
    "theme.halloween": ["Halloween", "Halloween", "Halloween", "Halloween", "万圣节"],
    "theme.christmas": ["Christmas", "Noël", "Navidad", "Weihnachten", "圣诞"],
    "theme.graphite": ["Graphite", "Graphite", "Grafito", "Graphit", "石墨"],
    "theme.lime": ["Lime", "Citron vert", "Lima", "Limette", "青柠"],
    "theme.seasonal": ["Seasonal", "Saisonnier", "De temporada", "Saisonal", "节日"],
    "theme.light.d": ["Bright frosted glass on a cool blue background", "Verre dépoli lumineux sur fond bleu frais", "Cristal esmerilado claro sobre fondo azul", "Helles Milchglas auf kühlem Blau", "清爽蓝底上的明亮磨砂玻璃"],
    "theme.dark.d": ["Deep navy glass, easy on the eyes at night", "Verre bleu nuit, reposant le soir", "Cristal azul marino, cómodo de noche", "Tiefblaues Glas, augenschonend am Abend", "深海军蓝玻璃，夜间更护眼"],
    "theme.system.d": ["Follows your device: light by day, dark at night", "Suit votre appareil : clair ou sombre", "Sigue tu dispositivo: claro u oscuro", "Folgt deinem Gerät: hell oder dunkel", "跟随设备的浅色或深色设置"],
    "theme.cinnamon.d": ["Warm cream and spice browns", "Crème chaude et bruns épicés", "Crema cálida y marrones especiados", "Warme Creme- und Gewürztöne", "暖奶油色与香料棕"],
    "theme.blush.d": ["Soft pinks with a rose accent", "Roses doux et accent framboise", "Rosas suaves con acento frambuesa", "Sanfte Rosatöne mit Himbeer-Akzent", "柔和粉色配玫红点缀"],
    "theme.galaxy.d": ["Deep space purple with nebula glows and stars", "Violet spatial, nébuleuses et étoiles", "Púrpura espacial con nebulosas y estrellas", "Weltraumviolett mit Nebeln und Sternen", "深空紫，星云微光与星点"],
    "theme.arctic.d": ["Icy whites and glacier blues", "Blancs glacés et bleus de glacier", "Blancos helados y azules glaciares", "Eisweiß und Gletscherblau", "冰白与冰川蓝"],
    "theme.beach.d": ["Sand, sea-glass teal and coral", "Sable, turquoise et corail", "Arena, turquesa y coral", "Sand, Türkis und Koralle", "沙色、海玻璃青与珊瑚色"],
    "theme.halloween.d": ["Night purple with pumpkin orange", "Violet nocturne et orange citrouille", "Púrpura nocturno y naranja calabaza", "Nachtviolett mit Kürbisorange", "夜紫配南瓜橙"],
    "theme.christmas.d": ["Pine green with cranberry and gold", "Vert sapin, canneberge et or", "Verde pino, arándano y oro", "Tannengrün mit Preiselbeere und Gold", "松绿配蔓越莓红与金色"],
    "theme.graphite.d": ["Quiet neutral greys, no colour cast", "Gris neutres et sobres", "Grises neutros y sobrios", "Ruhige neutrale Grautöne", "安静的中性灰"],
    "theme.lime.d": ["Fresh greens on a light background", "Verts frais sur fond clair", "Verdes frescos sobre fondo claro", "Frisches Grün auf hellem Grund", "浅底上的清新绿色"],
    // dashboard
    "home.kicker.back": ["Welcome back", "Bon retour", "Bienvenido de nuevo", "Willkommen zurück", "欢迎回来"],
    "home.kicker.first": ["Welcome", "Bienvenue", "Bienvenido", "Willkommen", "欢迎"],
    "home.title.back": ["Keep building that progress.", "Continuez sur votre lancée.", "Sigue construyendo ese progreso.", "Bleib dran.", "继续保持进步。"],
    "home.title.first": ["Let's start with quadratic functions.", "Commençons par les fonctions quadratiques.", "Empecemos con las funciones cuadráticas.", "Fangen wir mit quadratischen Funktionen an.", "从二次函数开始吧。"],
    "home.sub.first": ["Pick a difficulty below. Simple is a gentle, guided start; your progress fills this page in as you go.", "Choisissez un niveau ci-dessous. Simple est un départ guidé ; cette page se remplit au fil de vos progrès.", "Elige una dificultad abajo. Simple es un comienzo guiado; esta página se completa con tu progreso.", "Wähle unten einen Schwierigkeitsgrad. Einfach ist ein geführter Einstieg; diese Seite füllt sich mit deinem Fortschritt.", "在下方选择难度。“简单”是循序渐进的开始；这个页面会随你的进步而充实。"],
    "home.sub.back": ["{answers} answers so far. Today's focus: {topic}.", "{answers} réponses jusqu'ici. Objectif du jour : {topic}.", "{answers} respuestas hasta ahora. Enfoque de hoy: {topic}.", "Bisher {answers} Antworten. Heutiger Fokus: {topic}.", "目前已作答 {answers} 次。今日重点：{topic}。"],
    "home.topic": ["Current topic", "Sujet actuel", "Tema actual", "Aktuelles Thema", "当前主题"],
    "home.topicName": ["Quadratic Functions", "Fonctions quadratiques", "Funciones cuadráticas", "Quadratische Funktionen", "二次函数"],
    "home.mastery": ["Mastery progress", "Progression de la maîtrise", "Progreso de dominio", "Lernfortschritt", "掌握进度"],
    "home.masteryNone": ["No evidence yet", "Pas encore de données", "Aún sin datos", "Noch keine Daten", "暂无记录"],
    "home.resumeTitle": ["Test in progress", "Test en cours", "Prueba en curso", "Test läuft", "测试进行中"],
    "home.resume": ["Resume", "Reprendre", "Reanudar", "Fortsetzen", "继续"],
    "home.discard": ["Discard", "Abandonner", "Descartar", "Verwerfen", "放弃"],
    "home.left": ["{time} left · {answered}/{total} answered", "{time} restant · {answered}/{total} répondues", "Quedan {time} · {answered}/{total} respondidas", "{time} übrig · {answered}/{total} beantwortet", "剩余 {time} · 已答 {answered}/{total}"],
    "diff.kicker": ["Choose your difficulty", "Choisissez votre niveau", "Elige tu dificultad", "Wähle deinen Schwierigkeitsgrad", "选择难度"],
    "diff.title": ["Find your level.", "Trouvez votre niveau.", "Encuentra tu nivel.", "Finde dein Niveau.", "找到你的水平。"],
    "diff.slide": ["Slide to explore", "Faites défiler", "Desliza para explorar", "Zum Erkunden wischen", "滑动浏览"],
    "diff.prev": ["Previous mode", "Mode précédent", "Modo anterior", "Vorheriger Modus", "上一个"],
    "diff.next": ["Next mode", "Mode suivant", "Modo siguiente", "Nächster Modus", "下一个"],
    "mode.simple": ["Simple", "Simple", "Sencillo", "Einfach", "简单"],
    "mode.normal": ["Normal", "Normal", "Normal", "Normal", "普通"],
    "mode.challenge": ["Challenging", "Difficile", "Desafiante", "Anspruchsvoll", "挑战"],
    "mode.nightmare": ["Nightmare", "Cauchemar", "Pesadilla", "Albtraum", "噩梦"],
    "mode.simple.tag": ["Guided practice", "Pratique guidée", "Práctica guiada", "Geführtes Üben", "引导练习"],
    "mode.normal.tag": ["Core mastery", "Maîtrise de base", "Dominio esencial", "Grundlagen sichern", "核心掌握"],
    "mode.challenge.tag": ["Advanced reasoning", "Raisonnement avancé", "Razonamiento avanzado", "Fortgeschrittenes Denken", "进阶推理"],
    "mode.nightmare.tag": ["Mastery gauntlet", "Épreuve de maîtrise", "Prueba de maestría", "Meister-Parcours", "终极试炼"],
    "mode.simple.d": ["Build confidence one skill at a time, with step-by-step hints.", "Prenez confiance une compétence à la fois, avec des indices pas à pas.", "Gana confianza habilidad por habilidad, con pistas paso a paso.", "Baue Sicherheit auf, eine Fähigkeit nach der anderen, mit Schritt-für-Schritt-Hinweisen.", "一次掌握一个技能，配有分步提示。"],
    "mode.normal.d": ["Everyday practice laid out like the unit test, with optional hints.", "La pratique quotidienne, présentée comme l'examen, avec indices facultatifs.", "Práctica diaria con el formato del examen y pistas opcionales.", "Tägliches Üben im Format der Klassenarbeit, mit optionalen Hinweisen.", "按单元测验格式的日常练习，可选提示。"],
    "mode.challenge.d": ["Combine skills, spot traps and work with fewer scaffolds.", "Combinez les compétences, repérez les pièges, avec moins d'aide.", "Combina habilidades, detecta trampas y trabaja con menos ayuda.", "Fähigkeiten kombinieren, Fallen erkennen, mit weniger Hilfe.", "综合运用技能、识别陷阱，提示更少。"],
    "mode.nightmare.d": ["One demanding gauntlet of connected stages about a single function.", "Une épreuve exigeante en étapes liées autour d'une seule fonction.", "Una prueba exigente de etapas conectadas sobre una sola función.", "Ein anspruchsvoller Parcours aus verbundenen Etappen zu einer einzigen Funktion.", "围绕同一个函数、环环相扣的高强度挑战。"],
    "mode.preview": ["Preview", "Aperçu", "Vista previa", "Vorschau", "预览"],
    "mode.selected": ["Selected", "Sélectionné", "Seleccionado", "Ausgewählt", "已选择"],
    "mode.previewTitle": ["{mode} mode preview", "Aperçu du mode {mode}", "Vista previa del modo {mode}", "Vorschau: Modus {mode}", "{mode}模式预览"],
    "mode.example": ["Example question", "Exemple de question", "Pregunta de ejemplo", "Beispielaufgabe", "例题"],
    "mode.recommended": ["Recommended", "Recommandé", "Recomendado", "Empfohlen", "推荐"],
    "mode.f.simple1": ["Step-by-step hints", "Indices pas à pas", "Pistas paso a paso", "Schritt-für-Schritt-Hinweise", "分步提示"],
    "mode.f.simple2": ["One skill per session", "Une compétence par séance", "Una habilidad por sesión", "Eine Fähigkeit pro Sitzung", "每次一个技能"],
    "mode.f.simple3": ["Instant feedback", "Retour immédiat", "Corrección inmediata", "Sofortiges Feedback", "即时反馈"],
    "setup.hints": ["Allow hints", "Autoriser les indices", "Permitir pistas", "Hinweise erlauben", "允许提示"],
    "setup.hints.d": ["Off: exam conditions. On: Normal shows hints when asked, Challenging one per question; every hint is noted in your review. Nightmare never has hints.", "Désactivé : conditions d'examen. Activé : en Normal, indices sur demande ; en Difficile, un par question ; chaque indice est noté dans le corrigé. Jamais d'indices en Cauchemar.", "Desactivado: condiciones de examen. Activado: en Normal, pistas si las pides; en Desafiante, una por pregunta; cada pista queda anotada. Pesadilla nunca tiene pistas.", "Aus: Prüfungsbedingungen. An: Normal zeigt Hinweise auf Wunsch, Anspruchsvoll einen pro Aufgabe; jeder Hinweis wird vermerkt. Albtraum hat nie Hinweise.", "关闭：考试条件。开启：普通难度可按需查看提示，挑战难度每题一条；所有提示都会在回顾中注明。噩梦难度从不提供提示。"],
    "mode.f.normal1": ["34 marks · test layout", "34 points · format examen", "34 puntos · formato examen", "34 Punkte · Testformat", "34 分 · 测验格式"],
    "mode.f.normal2": ["Hints only if you allow them", "Indices seulement si vous les activez", "Pistas solo si las activas", "Hinweise nur, wenn erlaubt", "仅在允许时提供提示"],
    "mode.f.normal3": ["Graphs, tables and equations", "Graphiques, tableaux, équations", "Gráficas, tablas y ecuaciones", "Graphen, Tabellen, Gleichungen", "图像、表格与方程"],
    "mode.f.challenge1": ["At most one hint, if allowed", "Au plus un indice, si activé", "Como máximo una pista, si se permite", "Höchstens ein Hinweis, falls erlaubt", "最多一条提示（需允许）"],
    "mode.f.challenge2": ["Fractions and disguised forms", "Fractions et formes déguisées", "Fracciones y formas disfrazadas", "Brüche und versteckte Formen", "分数与变形"],
    "mode.f.challenge3": ["Error analysis", "Analyse d'erreurs", "Análisis de errores", "Fehleranalyse", "错误分析"],
    "mode.f.nightmare1": ["5 connected stages", "5 étapes liées", "5 etapas conectadas", "5 verbundene Etappen", "5 个相连阶段"],
    "mode.f.nightmare2": ["No hints", "Aucun indice", "Sin pistas", "Keine Hinweise", "无提示"],
    "mode.f.nightmare3": ["Exact answers only", "Réponses exactes seulement", "Solo respuestas exactas", "Nur exakte Antworten", "只接受精确答案"],
    "mode.start.simple": ["Start guided practice", "Commencer la pratique guidée", "Empezar práctica guiada", "Geführtes Üben starten", "开始引导练习"],
    "mode.start.normal": ["Start a Normal test", "Commencer un test Normal", "Empezar prueba Normal", "Normalen Test starten", "开始普通测验"],
    "mode.start.challenge": ["Start a Challenging test", "Commencer un test Difficile", "Empezar prueba Desafiante", "Anspruchsvollen Test starten", "开始挑战测验"],
    "mode.start.nightmare": ["Enter the Nightmare", "Entrer dans le Cauchemar", "Entrar en la Pesadilla", "Den Albtraum betreten", "进入噩梦模式"],
    "mode.options": ["Test options", "Options du test", "Opciones de la prueba", "Testoptionen", "测验选项"],
    "mode.newExample": ["Another example", "Autre exemple", "Otro ejemplo", "Anderes Beispiel", "换一题"],
    "mode.simpleTopic": ["Skill:", "Compétence :", "Habilidad:", "Fähigkeit:", "技能："],
    "act.title": ["Recent activity", "Activité récente", "Actividad reciente", "Letzte Aktivität", "最近活动"],
    "act.empty": ["Nothing yet. Your tests and practice sessions will show up here.", "Rien pour l'instant. Vos tests et séances apparaîtront ici.", "Nada aún. Tus pruebas y prácticas aparecerán aquí.", "Noch nichts. Deine Tests und Übungen erscheinen hier.", "暂无记录。你的测验和练习会显示在这里。"],
    "act.test": ["{mode} test", "Test {mode}", "Prueba {mode}", "{mode}-Test", "{mode}测验"],
    "act.practice": ["Practice: {topic}", "Pratique : {topic}", "Práctica: {topic}", "Übung: {topic}", "练习：{topic}"],
    "act.viewAll": ["View all", "Tout voir", "Ver todo", "Alle anzeigen", "查看全部"],
    "goals.title": ["Goals", "Objectifs", "Metas", "Ziele", "目标"],
    "goals.empty": ["Goals appear once you've answered a few questions.", "Les objectifs apparaissent après quelques réponses.", "Las metas aparecen tras unas cuantas respuestas.", "Ziele erscheinen nach ein paar Antworten.", "回答几道题后会出现目标。"],
    "goals.master": ["Make {concept} confident", "Maîtriser : {concept}", "Dominar: {concept}", "Sicher werden: {concept}", "掌握：{concept}"],
    "goals.overall": ["Reach 80% overall mastery", "Atteindre 80 % de maîtrise globale", "Llegar al 80 % de dominio global", "80 % Gesamtbeherrschung erreichen", "总体掌握度达到 80%"],
    "goals.coverage": ["Try every quadratics concept", "Essayer toutes les notions", "Probar todos los conceptos", "Jedes Konzept ausprobieren", "尝试所有二次函数概念"],
    "goals.criteria": ["{done} of 4 checks", "{done} critères sur 4", "{done} de 4 criterios", "{done} von 4 Kriterien", "已满足 4 项中的 {done} 项"],
    "goals.tried": ["{done} of {total} tried", "{done} sur {total} essayées", "{done} de {total} probados", "{done} von {total} versucht", "已尝试 {done}/{total}"],
    "stats.title": ["Your stats", "Vos statistiques", "Tus estadísticas", "Deine Statistik", "你的数据"],
    "stats.overall": ["Overall mastery", "Maîtrise globale", "Dominio global", "Gesamtbeherrschung", "总体掌握"],
    "stats.none": ["—", "—", "—", "—", "—"],
    "stats.streak": ["{n}-day streak", "Série de {n} jours", "Racha de {n} días", "{n} Tage in Folge", "连续 {n} 天"],
    "stats.streakKeep": ["Practise today to keep it going", "Pratiquez aujourd'hui pour la garder", "Practica hoy para mantenerla", "Übe heute, um sie zu halten", "今天练习来保持"],
    "stats.streakToday": ["You practised today", "Vous avez pratiqué aujourd'hui", "Has practicado hoy", "Du hast heute geübt", "今天已练习"],
    "quick.title": ["Quick actions", "Actions rapides", "Acciones rápidas", "Schnellzugriff", "快捷操作"],
    "quick.practice": ["Start practice", "Commencer à pratiquer", "Empezar a practicar", "Üben starten", "开始练习"],
    "quick.practice.d": ["Practise any skill at any level", "Toute compétence, tout niveau", "Cualquier habilidad y nivel", "Jede Fähigkeit, jedes Niveau", "任意技能、任意难度"],
    "quick.room": ["Study Room", "Salle d'étude", "Sala de estudio", "Lernraum", "自习室"],
    "quick.room.d": ["Learn together with a code", "Apprendre ensemble avec un code", "Aprende en grupo con un código", "Gemeinsam lernen per Code", "用代码一起学习"],
    "quick.library": ["Concept Library", "Bibliothèque de notions", "Biblioteca de conceptos", "Konzeptbibliothek", "概念库"],
    "quick.library.d": ["Lessons, graphs and formulas", "Leçons, graphiques, formules", "Lecciones, gráficas y fórmulas", "Lektionen, Graphen, Formeln", "课程、图像与公式"],
    "quick.progress": ["View progress", "Voir la progression", "Ver progreso", "Fortschritt ansehen", "查看进度"],
    "quick.progress.d": ["Tests, mastery and habits", "Tests, maîtrise, habitudes", "Pruebas, dominio y hábitos", "Tests, Beherrschung, Gewohnheiten", "测验、掌握与习惯"],
    "quick.tour": ["How it works", "Comment ça marche", "Cómo funciona", "So funktioniert's", "使用说明"],
    // practice hub
    "prac.kicker": ["Practice", "Pratique", "Práctica", "Üben", "练习"],
    "prac.title": ["Practise any skill, at any level", "Pratiquez toute compétence, à tout niveau", "Practica cualquier habilidad, a cualquier nivel", "Übe jede Fähigkeit auf jedem Niveau", "任意技能，任意难度"],
    "prac.tab.drills": ["Skills", "Compétences", "Habilidades", "Fähigkeiten", "技能"],
    "prac.tab.review": ["Review", "Révision", "Repaso", "Wiederholung", "复习"],
    "prac.tab.plan": ["Study plan", "Plan d'étude", "Plan de estudio", "Lernplan", "学习计划"],
    "prac.tab.progress": ["Progress", "Progression", "Progreso", "Fortschritt", "进度"],
    "prac.tests": ["Full tests", "Tests complets", "Pruebas completas", "Ganze Tests", "完整测验"],
    "prac.drill": ["5 questions", "5 questions", "5 preguntas", "5 Aufgaben", "5 道题"],
    "prac.lesson": ["Lesson", "Leçon", "Lección", "Lektion", "课程"],
    "prac.legacy": ["Earlier units (radicals, exponents, factoring) are still in the Concept Library.", "Les unités précédentes (radicaux, exposants, factorisation) restent dans la bibliothèque.", "Las unidades anteriores (radicales, exponentes, factorización) siguen en la biblioteca.", "Frühere Einheiten (Wurzeln, Potenzen, Faktorisieren) bleiben in der Bibliothek.", "之前的单元（根式、指数、因式分解）仍在概念库中。"],
    // test workspace
    "test.pause": ["Pause", "Pause", "Pausa", "Pause", "暂停"],
    "test.exit": ["Exit", "Quitter", "Salir", "Verlassen", "退出"],
    "test.timeLeft": ["Time left", "Temps restant", "Tiempo restante", "Restzeit", "剩余时间"],
    "test.answered": ["{a}/{n} answered", "{a}/{n} répondues", "{a}/{n} respondidas", "{a}/{n} beantwortet", "已答 {a}/{n}"],
    "test.prev": ["Previous", "Précédente", "Anterior", "Zurück", "上一题"],
    "test.next": ["Next", "Suivante", "Siguiente", "Weiter", "下一题"],
    "test.submit": ["Submit test", "Remettre le test", "Entregar prueba", "Test abgeben", "提交测验"],
    "test.counter": ["{s} · {q}{k} of {n}", "{s} · {q}{k} sur {n}", "{s} · {q}{k} de {n}", "{s} · {q}{k} von {n}", "{s} · 第 {k}/{n} 题"],
    "sec.wr": ["Written Response", "Réponse écrite", "Respuesta escrita", "Schriftliche Antwort", "书面作答"],
    "sec.nr": ["Numerical Response", "Réponse numérique", "Respuesta numérica", "Numerische Antwort", "数值作答"],
    "sec.mc": ["Multiple Choice", "Choix multiple", "Opción múltiple", "Multiple Choice", "选择题"],
    "test.flag": ["Flag", "Marquer", "Marcar", "Markieren", "标记"],
    "test.flagged": ["Flagged", "Marquée", "Marcada", "Markiert", "已标记"],
    "test.hint": ["Hint", "Indice", "Pista", "Hinweis", "提示"],
    "test.hintMore": ["Next step", "Étape suivante", "Siguiente paso", "Nächster Schritt", "下一步"],
    "test.hintsOff": ["No hints in this mode", "Pas d'indices dans ce mode", "Sin pistas en este modo", "Keine Hinweise in diesem Modus", "此模式没有提示"],
    "test.hintsUsed": ["Hints used: {n}", "Indices utilisés : {n}", "Pistas usadas: {n}", "Hinweise genutzt: {n}", "已用提示：{n}"],
    "test.questions": ["Questions", "Questions", "Preguntas", "Aufgaben", "题目"],
    "test.stage": ["Stage {n}", "Étape {n}", "Etapa {n}", "Etappe {n}", "第 {n} 阶段"],
    "test.answer": ["Your answer", "Votre réponse", "Tu respuesta", "Deine Antwort", "你的答案"],
    "test.readsAs": ["Reads as", "Lu comme", "Se lee como", "Gelesen als", "识别为"],
    "test.plotHelp": ["Click the grid to place the vertex, then a second point. Drag to adjust; arrow keys move the selected point.", "Cliquez pour placer le sommet, puis un second point. Faites glisser pour ajuster ; les flèches déplacent le point.", "Haz clic para colocar el vértice y luego otro punto. Arrastra para ajustar; las flechas mueven el punto.", "Klicke, um den Scheitelpunkt und dann einen zweiten Punkt zu setzen. Ziehen zum Anpassen; Pfeiltasten verschieben.", "点击网格先放顶点，再放第二个点；拖动或用方向键调整。"],
    "test.equationHelp": ["Type equations like y = 2(x − 3)^2 + 1 or y = x^2 − 4x + 5. Points like (3, −2).", "Écrivez y = 2(x − 3)^2 + 1 ou y = x^2 − 4x + 5. Points : (3, −2).", "Escribe y = 2(x − 3)^2 + 1 o y = x^2 − 4x + 5. Puntos: (3, −2).", "Gleichungen wie y = 2(x − 3)^2 + 1 oder y = x^2 − 4x + 5. Punkte wie (3, −2).", "方程写作 y = 2(x − 3)^2 + 1 或 y = x^2 − 4x + 5；点写作 (3, −2)。"],
    "test.legend": ["answered · partly · flagged", "répondue · partielle · marquée", "respondida · parcial · marcada", "beantwortet · teilweise · markiert", "已答 · 部分 · 标记"],
    // tools
    "tools.title": ["Tools", "Outils", "Herramientas", "Werkzeuge", "工具"],
    "tools.calc": ["Calculator", "Calculatrice", "Calculadora", "Rechner", "计算器"],
    "tools.pad": ["Scratchpad", "Brouillon", "Borrador", "Notizblock", "草稿板"],
    "calc.deg": ["Deg", "Deg", "Grad", "Grad", "角度"],
    "calc.rad": ["Rad", "Rad", "Rad", "Rad", "弧度"],
    "calc.clear": ["Clear", "Effacer", "Borrar", "Löschen", "清除"],
    "calc.back": ["Backspace", "Retour", "Retroceso", "Rücktaste", "退格"],
    "calc.close": ["Close calculator", "Fermer la calculatrice", "Cerrar calculadora", "Rechner schließen", "关闭计算器"],
    "calc.placeholder": ["Type an expression", "Saisissez une expression", "Escribe una expresión", "Ausdruck eingeben", "输入算式"],
    "calc.history": ["History", "Historique", "Historial", "Verlauf", "历史"],
    "calc.err.syntax": ["Check the expression", "Vérifiez l'expression", "Revisa la expresión", "Ausdruck prüfen", "请检查算式"],
    "calc.err.paren": ["A bracket isn't closed", "Une parenthèse n'est pas fermée", "Falta cerrar un paréntesis", "Eine Klammer ist nicht geschlossen", "括号未闭合"],
    "calc.err.domain": ["Not defined for that value", "Non défini pour cette valeur", "No definido para ese valor", "Für diesen Wert nicht definiert", "该值无定义"],
    "calc.err.div0": ["Can't divide by zero", "Division par zéro impossible", "No se puede dividir entre cero", "Division durch null", "不能除以零"],
    "calc.err.big": ["Number too large", "Nombre trop grand", "Número demasiado grande", "Zahl zu groß", "数值过大"],
    "calc.note": ["Numeric calculator, not a symbolic algebra system.", "Calculatrice numérique, pas un système de calcul formel.", "Calculadora numérica, no un sistema de álgebra simbólica.", "Numerischer Rechner, kein Computeralgebrasystem.", "数值计算器，不是符号代数系统。"],
    "pad.draw": ["Draw", "Dessiner", "Dibujar", "Zeichnen", "手写"],
    "pad.type": ["Type", "Écrire", "Escribir", "Tippen", "打字"],
    "pad.clear": ["Clear", "Effacer", "Borrar", "Löschen", "清除"],
    "pad.undo": ["Undo", "Annuler", "Deshacer", "Rückgängig", "撤销"],
    "pad.sure": ["Clear this page?", "Effacer cette page ?", "¿Borrar esta página?", "Diese Seite löschen?", "清除此页？"],
    "pad.min": ["Minimize", "Réduire", "Minimizar", "Minimieren", "最小化"],
    "pad.expand": ["Expand", "Agrandir", "Ampliar", "Vergrößern", "放大"],
    "pad.hint": ["Hold the left mouse button to write. Each question gets its own page, and your work shows up in the review.", "Maintenez le bouton gauche pour écrire. Chaque question a sa page, visible dans la correction.", "Mantén el botón izquierdo para escribir. Cada pregunta tiene su página, que aparece en la revisión.", "Linke Maustaste halten zum Schreiben. Jede Aufgabe hat eine eigene Seite, die in der Auswertung erscheint.", "按住鼠标左键书写。每道题一页，复盘时可查看。"],
    "pad.typeHint": ["Type your working here. It's saved with this page.", "Écrivez votre démarche ici. Elle est enregistrée avec la page.", "Escribe tu procedimiento aquí. Se guarda con esta página.", "Schreibe deinen Rechenweg hier. Er wird mit der Seite gespeichert.", "在这里输入解题过程，会随此页保存。"],
    "pad.general": ["Notes", "Notes", "Notas", "Notizen", "笔记"],
    // library
    "lib.search": ["Search concepts", "Rechercher une notion", "Buscar conceptos", "Konzepte suchen", "搜索概念"],
    "lib.all": ["All", "Toutes", "Todos", "Alle", "全部"],
    "lib.attention": ["Attention", "À revoir", "Atención", "Achtung", "需关注"],
    "lib.due": ["Due", "À réviser", "Pendientes", "Fällig", "待复习"],
    "lib.new": ["New", "Nouvelles", "Nuevos", "Neu", "新"],
    "lib.formulas": ["Formula reference", "Formulaire", "Fórmulas", "Formelsammlung", "公式参考"],
    "lib.explorer": ["Explore a, h and k", "Explorer a, h et k", "Explora a, h y k", "a, h und k erkunden", "探索 a、h、k"],
    "lib.englishOnly": ["This lesson is in English.", "Cette leçon est en anglais.", "Esta lección está en inglés.", "Diese Lektion ist auf Englisch.", "本课为英文。"],
    // study room
    "room.kicker": ["Study Room", "Salle d'étude", "Sala de estudio", "Lernraum", "自习室"],
    "room.title": ["Learn together", "Apprendre ensemble", "Aprender juntos", "Gemeinsam lernen", "一起学习"],
    "room.create": ["Open a study room", "Ouvrir une salle", "Abrir una sala", "Lernraum öffnen", "创建自习室"],
    "room.group": ["Create a group test", "Créer un test de groupe", "Crear prueba en grupo", "Gruppentest erstellen", "创建小组测验"],
    "room.join": ["Join with a code", "Rejoindre avec un code", "Unirse con un código", "Mit Code beitreten", "用代码加入"],
    "room.joinBtn": ["Join", "Rejoindre", "Unirse", "Beitreten", "加入"],
    "room.resume": ["Resume your room", "Reprendre votre salle", "Reanudar tu sala", "Raum fortsetzen", "继续你的自习室"],
    "room.codePh": ["Group or room code", "Code de groupe ou de salle", "Código de grupo o sala", "Gruppen- oder Raumcode", "小组或自习室代码"],
    "room.honest": ["Codes, not servers: everyone with the same code gets the same questions in the same order. Answers stay on each device; to compare, people paste each other's result codes. There's no live chat or shared drawing yet.", "Des codes, pas de serveur : le même code donne les mêmes questions dans le même ordre. Les réponses restent sur chaque appareil ; pour comparer, on échange des codes de résultat. Pas encore de discussion en direct ni de dessin partagé.", "Códigos, no servidores: el mismo código da las mismas preguntas en el mismo orden. Las respuestas se quedan en cada dispositivo; para comparar se intercambian códigos de resultado. Aún no hay chat en vivo ni dibujo compartido.", "Codes statt Server: Derselbe Code liefert dieselben Aufgaben in derselben Reihenfolge. Antworten bleiben auf jedem Gerät; zum Vergleichen tauscht man Ergebniscodes. Live-Chat oder gemeinsames Zeichnen gibt es noch nicht.", "使用代码而非服务器：相同代码得到相同顺序的相同题目。答案只保存在各自设备上；比较成绩需互相粘贴结果代码。目前还没有实时聊天或共享画板。"],
    "room.shared": ["Shared with the room", "Partagé avec la salle", "Compartido con la sala", "Mit dem Raum geteilt", "与全员共享"],
    "room.private": ["Private to you", "Privé", "Solo para ti", "Nur für dich", "仅自己可见"],
    "room.sharedList": ["The questions and their order · the pace · the result codes you choose to paste", "Les questions et leur ordre · le rythme · les codes de résultat que vous collez", "Las preguntas y su orden · el ritmo · los códigos que decidas pegar", "Die Aufgaben und ihre Reihenfolge · das Tempo · Ergebniscodes, die du einfügst", "题目及顺序 · 节奏 · 你选择粘贴的结果代码"],
    "room.privateList": ["Your answers · your scratchpad · your history and files", "Vos réponses · votre brouillon · votre historique et vos fichiers", "Tus respuestas · tu borrador · tu historial y archivos", "Deine Antworten · dein Notizblock · dein Verlauf und deine Dateien", "你的答案 · 你的草稿 · 你的记录与文件"],
    // results / misc
    "res.again": ["New test", "Nouveau test", "Nueva prueba", "Neuer Test", "新测验"],
    "res.home": ["Back to Home", "Retour à l'accueil", "Volver al inicio", "Zurück zum Start", "返回首页"],
    "res.hints": ["Hints were used on {n} question(s).", "Des indices ont servi pour {n} question(s).", "Se usaron pistas en {n} pregunta(s).", "Bei {n} Aufgabe(n) wurden Hinweise genutzt.", "{n} 道题使用了提示。"],
    "start.enter": ["Enter", "Entrer", "Entrar", "Los geht's", "进入"],
    "start.tour": ["How it works", "Comment ça marche", "Cómo funciona", "So funktioniert's", "使用说明"],
    "start.title": ["Don't let the puppy die.", "Ne laissez pas le chiot mourir.", "No dejes morir al cachorro.", "Lass den Welpen nicht sterben.", "别让小狗死掉。"],
    "start.lead": ["Practise quadratic functions and graphing, from guided basics to a Nightmare gauntlet. A puppy and a campfire keep you company, if you want them.", "Entraînez-vous aux fonctions quadratiques, des bases guidées au Cauchemar. Un chiot et un feu de camp vous tiennent compagnie, si vous le souhaitez.", "Practica funciones cuadráticas y gráficas, desde lo básico guiado hasta la Pesadilla. Un cachorro y una fogata te acompañan, si quieres.", "Übe quadratische Funktionen und Graphen, von geführten Grundlagen bis zum Albtraum. Ein Welpe und ein Lagerfeuer leisten dir Gesellschaft, wenn du willst.", "练习二次函数与图像，从引导入门到噩梦挑战。如果你愿意，小狗和篝火会陪着你。"],
    "dlg.cancel": ["Cancel", "Annuler", "Cancelar", "Abbrechen", "取消"],
    "common.close": ["Close", "Fermer", "Cerrar", "Schließen", "关闭"],
    "common.ok": ["OK", "OK", "Aceptar", "OK", "好"],
    "prac.tab.course": ["Whole course", "Tout le cours", "Curso completo", "Ganzer Kurs", "全部课程"],
    "prac.unavailTitle": ["Not available at this level", "Pas disponible à ce niveau", "No disponible en este nivel", "Auf dieser Stufe nicht verfügbar", "此难度暂无题目"],
    "prac.unavail": ["There are no {mode} questions for this topic yet. Choose another level yourself — the app never changes your level for you.", "Il n'y a pas encore de questions {mode} pour ce thème. Choisissez un autre niveau vous-même : l'application ne change jamais votre niveau.", "Aún no hay preguntas de nivel {mode} para este tema. Elige otro nivel tú mismo: la app nunca cambia tu nivel.", "Für dieses Thema gibt es noch keine Aufgaben auf der Stufe {mode}. Wähle selbst eine andere Stufe – die App ändert sie nie für dich.", "此主题暂无“{mode}”难度的题目。请自行选择其他难度——应用不会替你更改难度。"],
    "prac.revisit": ["{n} of these came from a question type with only a few variations, so you may have seen something similar recently.", "{n} de ces questions viennent d'un type à peu de variantes : vous en avez peut-être vu une semblable récemment.", "{n} de estas preguntas vienen de un tipo con pocas variantes; puede que hayas visto una parecida hace poco.", "{n} dieser Aufgaben stammen aus einem Typ mit wenigen Varianten – vielleicht hast du kürzlich eine ähnliche gesehen.", "其中 {n} 道来自变化较少的题型，你最近可能见过类似的题。"],
    "prac.again": ["Another round", "Encore une série", "Otra ronda", "Noch eine Runde", "再来一轮"],
    "course.title": ["The whole course", "Tout le cours", "Todo el curso", "Der ganze Kurs", "全部课程"],
    "course.level": ["Difficulty", "Difficulté", "Dificultad", "Schwierigkeit", "难度"],
    "course.fixed": ["Questions stay at exactly this level, however well you do. Change it here whenever you like.", "Les questions restent exactement à ce niveau, quels que soient vos résultats. Changez-le ici quand vous voulez.", "Las preguntas se mantienen exactamente en este nivel, te vaya como te vaya. Cámbialo aquí cuando quieras.", "Die Aufgaben bleiben genau auf dieser Stufe, egal wie gut es läuft. Ändere sie hier, wann du willst.", "无论成绩如何，题目始终保持这一难度。可随时在这里更改。"],
    "course.full": ["Full-course review (20)", "Révision de tout le cours (20)", "Repaso de todo el curso (20)", "Wiederholung des ganzen Kurses (20)", "全课程复习（20 题）"],
    "course.coverage": ["{impl} of {total} subtopics have questions; {lessons} have lessons.", "{impl} sous-thèmes sur {total} ont des questions ; {lessons} ont des leçons.", "{impl} de {total} subtemas tienen preguntas; {lessons} tienen lecciones.", "{impl} von {total} Unterthemen haben Aufgaben; {lessons} haben Lektionen.", "{total} 个子主题中有 {impl} 个有题目，{lessons} 个有课程。"],
    "course.source": ["Curriculum source", "Source du programme", "Fuente del currículo", "Quelle: Lehrplan", "课程标准来源"],
    "course.unitMeta": ["{ready} of {n} subtopics at this level", "{ready} sur {n} sous-thèmes à ce niveau", "{ready} de {n} subtemas en este nivel", "{ready} von {n} Unterthemen auf dieser Stufe", "此难度下 {ready}/{n} 个子主题"],
    "course.mixUnit": ["Mix this unit (10)", "Mélange de l'unité (10)", "Mezcla de la unidad (10)", "Einheit gemischt (10)", "本单元混合（10 题）"],
    "course.practise": ["Practise", "S'entraîner", "Practicar", "Üben", "练习"],
    "course.missing": ["No questions yet", "Pas encore de questions", "Aún sin preguntas", "Noch keine Aufgaben", "暂无题目"],
    "course.partial": ["Not every level", "Pas à tous les niveaux", "No en todos los niveles", "Nicht auf jeder Stufe", "并非所有难度"],
    "course.levels": ["Available at: {modes}", "Disponible : {modes}", "Disponible en: {modes}", "Verfügbar: {modes}", "可用难度：{modes}"],
    "course.noLevel": ["No {mode} questions for this subtopic yet", "Pas encore de questions {mode} pour ce sous-thème", "Aún no hay preguntas {mode} para este subtema", "Noch keine {mode}-Aufgaben für dieses Unterthema", "此子主题暂无“{mode}”题目"],
    "course.mine": ["You: {right}/{n} right", "Vous : {right}/{n} justes", "Tú: {right}/{n} bien", "Du: {right}/{n} richtig", "你：{right}/{n} 正确"],
    "course.notYet": ["Not practised yet", "Pas encore pratiqué", "Aún sin practicar", "Noch nicht geübt", "尚未练习"],
    "common.more": ["More", "Plus", "Más", "Mehr", "更多"],
    "common.min": ["{n} min", "{n} min", "{n} min", "{n} Min.", "{n} 分钟"],
    // checker notes (shown as feedback)
    "note.blank": ["No answer.", "Pas de réponse.", "Sin respuesta.", "Keine Antwort.", "未作答。"],
    "note.swapped": ["The coordinates look swapped: a point is (x, y).", "Les coordonnées semblent inversées : un point s'écrit (x, y).", "Las coordenadas parecen invertidas: un punto es (x, y).", "Die Koordinaten scheinen vertauscht: ein Punkt ist (x, y).", "坐标好像写反了：点应写作 (x, y)。"],
    "note.hsign": ["Check the sign of h: y = a(x − h)² + k has its vertex at (h, k), so (x − 3) means h = 3.", "Vérifiez le signe de h : y = a(x − h)² + k a pour sommet (h, k), donc (x − 3) signifie h = 3.", "Revisa el signo de h: y = a(x − h)² + k tiene vértice (h, k), así que (x − 3) significa h = 3.", "Prüfe das Vorzeichen von h: y = a(x − h)² + k hat den Scheitelpunkt (h, k), also bedeutet (x − 3) h = 3.", "注意 h 的符号：y = a(x − h)² + k 的顶点是 (h, k)，所以 (x − 3) 表示 h = 3。"],
    "note.yWrong": ["The x-coordinate is right; recheck the y-coordinate.", "L'abscisse est juste ; revérifiez l'ordonnée.", "La coordenada x es correcta; revisa la y.", "Die x-Koordinate stimmt; prüfe die y-Koordinate.", "x 坐标正确，请检查 y 坐标。"],
    "note.form": ["Same function, but the question asks for {form}.", "Même fonction, mais la question demande la {form}.", "Misma función, pero la pregunta pide la {form}.", "Dieselbe Funktion, aber gefragt ist die {form}.", "函数相同，但题目要求写成{form}。"],
    "note.hShift": ["The horizontal shift has the wrong sign: (x − h) moves the graph h units to the right.", "La translation horizontale a le mauvais signe : (x − h) déplace le graphe de h vers la droite.", "El desplazamiento horizontal tiene el signo cambiado: (x − h) mueve la gráfica h unidades a la derecha.", "Die waagerechte Verschiebung hat das falsche Vorzeichen: (x − h) verschiebt um h nach rechts.", "水平平移符号反了：(x − h) 表示向右平移 h 个单位。"],
    "note.stretch": ["The vertex is right, but the stretch a isn't. Use a second point to find a.", "Le sommet est juste, mais pas a. Utilisez un second point pour trouver a.", "El vértice es correcto, pero a no. Usa otro punto para hallar a.", "Der Scheitelpunkt stimmt, a nicht. Bestimme a mit einem zweiten Punkt.", "顶点正确，但 a 不对。用另一个点求 a。"],
    "note.kShift": ["Check the vertical shift k.", "Vérifiez la translation verticale k.", "Revisa el desplazamiento vertical k.", "Prüfe die senkrechte Verschiebung k.", "检查竖直平移 k。"],
    "note.decimal": ["That's a decimal approximation — the question wants the exact value.", "C'est une valeur approchée : la question demande la valeur exacte.", "Es una aproximación decimal: la pregunta pide el valor exacto.", "Das ist eine Näherung – gefragt ist der exakte Wert.", "这是小数近似值——题目要求精确值。"],
    "form.vertex": ["vertex form y = a(x − h)² + k", "forme canonique y = a(x − h)² + k", "forma vértice y = a(x − h)² + k", "Scheitelpunktform y = a(x − h)² + k", "顶点式 y = a(x − h)² + k"],
    "form.standard": ["standard form y = ax² + bx + c", "forme développée y = ax² + bx + c", "forma estándar y = ax² + bx + c", "Normalform y = ax² + bx + c", "一般式 y = ax² + bx + c"],
    "form.factored": ["factored form y = a(x − r)(x − s)", "forme factorisée y = a(x − r)(x − s)", "forma factorizada y = a(x − r)(x − s)", "faktorisierte Form y = a(x − r)(x − s)", "交点式 y = a(x − r)(x − s)"],
  };
  const IDX = { en: 0, fr: 1, es: 2, de: 3, zh: 4 };
  let lang = "en";

  function t(key, vars) {
    const row = T[key];
    let s = row ? (row[IDX[lang]] || row[0]) : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  }
  function apply(rootEl = document) {
    for (const el of rootEl.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
    for (const el of rootEl.querySelectorAll("[data-i18n-attr]")) {
      for (const pair of el.dataset.i18nAttr.split(";")) { const [attr, key] = pair.split(":"); if (attr && key) el.setAttribute(attr.trim(), t(key.trim())); }
    }
  }
  function set(next) {
    if (!IDX.hasOwnProperty(next)) next = "en";
    lang = next;
    const L = LANGS.find((x) => x.id === next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = L.html;
      apply(document);
      document.dispatchEvent(new CustomEvent("i18n:change", { detail: { lang } }));
    }
  }
  // known English checker notes → keys (others pass through untouched)
  const NOTE_KEYS = {
    "No answer.": "note.blank",
    "The coordinates look swapped: a point is (x, y).": "note.swapped",
    "Check the sign of h: y = a(x − h)² + k has its vertex at (h, k), so (x − 3) means h = 3.": "note.hsign",
    "The x-coordinate is right; recheck the y-coordinate.": "note.yWrong",
    "The horizontal shift has the wrong sign: (x − h) moves the graph h units to the right.": "note.hShift",
    "The vertex is right, but the stretch a isn't. Use a second point to find a.": "note.stretch",
    "Check the vertical shift k.": "note.kShift",
    "That's a decimal approximation — the question wants the exact value.": "note.decimal",
  };
  function note(s) {
    if (!s || lang === "en") return s;
    if (NOTE_KEYS[s]) return t(NOTE_KEYS[s]);
    const m = /^Same function, but the question asks for (.+)\.$/.exec(s);
    if (m) { const fk = { "vertex form y = a(x − h)² + k": "form.vertex", "standard form y = ax² + bx + c": "form.standard", "factored form y = a(x − r)(x − s)": "form.factored" }[m[1]]; if (fk) return t("note.form", { form: t(fk) }); }
    return s;
  }
  const num = (n, opts) => { try { return new Intl.NumberFormat(LANGS.find((x) => x.id === lang).html, opts).format(n); } catch { return String(n); } };
  // add(table): register more strings (e.g. js/i18n-tour.js) into the same table — one translation mechanism
  const add = (table) => { for (const [k, row] of Object.entries(table)) T[k] = row; };
  const api = { LANGS, T, t, apply, set, note, num, add, get lang() { return lang; }, keys: () => Object.keys(T) };
  root.I18N = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
