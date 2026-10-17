/*
 * Goose Mode strings, registered into the app's translation table (js/i18n.js). Order per key: [en, fr, es, de, zh].
 */
(function (root) {
  "use strict";
  const T = {
    "goose.set.title": ["Gameplay", "Jeu", "Juego", "Spielmodus", "玩法"],
    "goose.name": ["Goose Mode", "Mode Oie", "Modo Ganso", "Gänse-Modus", "大鹅模式"],
    "goose.desc": [
      "Replaces puppy survival with a mischievous goose: no campfire, kettle or oxygen to manage — instead, random disruptive events, and the goose steals panels (drag them back). Your questions, marks and progress work exactly as usual.",
      "Remplace la survie du chiot par une oie espiègle : pas de feu, de bouilloire ni d'oxygène à gérer, mais des événements aléatoires, et l'oie vole des panneaux (faites-les glisser à leur place). Questions, notes et progrès fonctionnent comme d'habitude.",
      "Sustituye la supervivencia del cachorro por un ganso travieso: sin fogata, tetera ni oxígeno que cuidar; en su lugar, eventos aleatorios, y el ganso roba paneles (arrástralos de vuelta). Las preguntas, notas y progreso funcionan igual.",
      "Ersetzt das Welpen-Überleben durch eine freche Gans: kein Feuer, Kessel oder Sauerstoff – stattdessen zufällige Störungen, und die Gans klaut Bereiche (zieh sie zurück). Fragen, Noten und Fortschritt funktionieren wie immer.",
      "用一只调皮的大鹅取代小狗生存：不用管营火、水壶和氧气，取而代之的是随机捣乱事件，大鹅还会叼走面板（可拖回原处）。题目、评分和进度照常运作。",
    ],
    "goose.on": ["On", "Activé", "Activado", "An", "开"],
    "goose.off": ["Off", "Désactivé", "Desactivado", "Aus", "关"],
    "goose.simpleNote": ["Not available on Simple. Choose Normal, Challenging or Nightmare to use Goose Mode.", "Indisponible en Simple. Choisissez Normal, Difficile ou Cauchemar pour utiliser le mode Oie.", "No disponible en Simple. Elige Normal, Desafiante o Pesadilla para usar el Modo Ganso.", "Nicht auf Einfach. Wähle Normal, Fordernd oder Albtraum für den Gänse-Modus.", "简单难度不可用。请选择普通、挑战或噩梦以使用大鹅模式。"],
    "goose.calm": ["Calmer goose (no shaking, flipping, dancing or dimming)", "Oie plus calme (sans secousses, retournements, danses ni assombrissement)", "Ganso más tranquilo (sin temblores, giros, bailes ni oscurecimiento)", "Ruhigere Gans (kein Wackeln, Umdrehen, Tanzen oder Abdunkeln)", "温和大鹅（不摇晃、不翻转、不跳舞、不变暗）"],
    "goose.hud": ["Goose Mode", "Mode Oie", "Modo Ganso", "Gänse-Modus", "大鹅模式"],
    "goose.reset": ["Reset layout", "Réinitialiser", "Restablecer", "Layout zurücksetzen", "重置布局"],
    "goose.turnOff": ["Turn off", "Désactiver", "Desactivar", "Ausschalten", "关闭"],
    "goose.move": ["Move panel (drag, or use the arrow keys)", "Déplacer le panneau (glisser, ou flèches)", "Mover panel (arrastra o usa las flechas)", "Bereich verschieben (ziehen oder Pfeiltasten)", "移动面板（拖动或用方向键）"],
    "goose.frozen": ["Frozen by the goose", "Gelé par l'oie", "Congelado por el ganso", "Von der Gans eingefroren", "被大鹅冻住了"],
    "goose.ev.grayscale": ["The goose stole all the colours!", "L'oie a volé toutes les couleurs !", "¡El ganso robó todos los colores!", "Die Gans hat alle Farben geklaut!", "大鹅偷走了所有颜色！"],
    "goose.ev.rainbow": ["The goose found a rainbow.", "L'oie a trouvé un arc-en-ciel.", "El ganso encontró un arcoíris.", "Die Gans hat einen Regenbogen gefunden.", "大鹅找到了一道彩虹。"],
    "goose.ev.flip": ["The goose turned everything upside down!", "L'oie a tout mis à l'envers !", "¡El ganso puso todo patas arriba!", "Die Gans hat alles auf den Kopf gestellt!", "大鹅把一切都倒过来了！"],
    "goose.ev.shake": ["Goose stomp! Earthquake!", "Coup de patte de l'oie ! Tremblement de terre !", "¡Pisotón de ganso! ¡Terremoto!", "Gänse-Stampfer! Erdbeben!", "大鹅跺脚！地震了！"],
    "goose.ev.dance": ["The goose taught your panels to dance.", "L'oie a appris à vos panneaux à danser.", "El ganso enseñó a bailar a tus paneles.", "Die Gans bringt deinen Bereichen das Tanzen bei.", "大鹅教你的面板跳舞了。"],
    "goose.ev.freeze": ["Honk! The goose froze the game for a moment.", "Honk ! L'oie a gelé le jeu un instant.", "¡Cuac! El ganso congeló el juego un momento.", "Tröt! Die Gans friert das Spiel kurz ein.", "嘎！大鹅把游戏冻住了一会儿。"],
    "goose.ev.dim": ["The goose flapped in front of the lights.", "L'oie a battu des ailes devant la lumière.", "El ganso aleteó delante de las luces.", "Die Gans flattert vor dem Licht herum.", "大鹅在灯前扑腾了一下。"],
    "goose.ev.theft": ["The goose grabbed a panel! Drag it back if you like.", "L'oie a attrapé un panneau ! Remettez-le en place si vous voulez.", "¡El ganso agarró un panel! Arrástralo de vuelta si quieres.", "Die Gans hat einen Bereich geschnappt! Zieh ihn zurück, wenn du magst.", "大鹅叼走了一个面板！想放回去就拖回来吧。"],
    "goose.ev.end": ["Back to normal.", "Retour à la normale.", "Todo vuelve a la normalidad.", "Wieder normal.", "恢复正常。"],
  };
  if (root.I18N && root.I18N.add) root.I18N.add(T);
  if (typeof module !== "undefined") module.exports = T;
})(typeof window !== "undefined" ? window : globalThis);
