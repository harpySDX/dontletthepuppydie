// Themes: every palette produces a complete, readable token set; the app, the no-flash <head> script, the generated
// CSS and the translations all list the same themes.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const T = require("../tools/themes.js");
const I18N = require("../js/i18n.js");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

const LIGHT_KEYS = [...read("css/glass.css").match(/:root, :root\[data-theme="light"\] \{([\s\S]*?)\n\}/)[1].matchAll(/(--[\w-]+):/g)].map((m) => m[1]);

test("at least twelve themes, the three originals kept", () => {
  assert.ok(T.IDS.length >= 12, T.IDS.join(","));
  for (const id of ["light", "dark", "system", "cinnamon", "blush", "galaxy", "arctic", "beach", "halloween", "christmas", "graphite", "lime"]) assert.ok(T.IDS.includes(id), id);
});
test("each generated theme defines every token Light Glass defines (no gaps falling back to another theme)", () => {
  for (const [id, p] of Object.entries(T.THEMES)) {
    const t = T.derive(p);
    for (const k of LIGHT_KEYS) if (!["--blur", "--font-display", "--focus", "--radius", "--radius-sm", "--radius-lg"].includes(k)) assert.ok(t[k], `${id} lacks ${k}`);
    for (const k of ["--fig-path", "--fig-ball", "--fig-comp", "--fig-vec", "--on-good", "--on-bad"]) assert.ok(t[k], `${id} lacks ${k}`);
  }
});
test("contrast: body text, muted text, links, buttons and feedback meet WCAG AA in every theme", () => {
  const C = T.contrast;
  for (const [id, p] of Object.entries(T.THEMES)) {
    const t = T.derive(p);
    const need = [
      ["ink on bg", t["--ink"], t["--bg"], 7], ["ink on surface", t["--ink"], t["--surface"], 7], ["muted on surface", t["--muted"], t["--surface"], 4.5],
      ["muted on bg", t["--muted"], t["--bg"], 4.5], ["faint on surface", t["--faint"], t["--surface"], 4.5], ["faint on bg", t["--faint"], t["--bg"], 4.5], ["faint on raised cards", t["--faint"], t["--elevated"], 4.5], ["accent text on surface", t["--accent"], t["--surface"], 4.5],
      ["button text on accent", t["--accent-ink"], t["--accent"], 4.5], ["text on ember", t["--ember-ink"], t["--ember"], 4.5],
      ["paper ink", t["--paper-ink"], t["--paper"], 7], ["paper muted", t["--paper-muted"], t["--paper"], 4.5],
      ["good ink", t["--good-ink"], t["--surface"], 4.5], ["mid ink", t["--mid-ink"], t["--surface"], 4.5], ["bad ink", t["--bad-ink"], t["--surface"], 4.5],
      ["good on surface (icons, bars)", t["--good"], t["--surface"], 3], ["bad on surface", t["--bad"], t["--surface"], 3], ["mid on surface", t["--mid"], t["--surface"], 3],
      ["text on good", t["--on-good"], t["--good"], 4.5], ["text on bad", t["--on-bad"], t["--bad"], 3],
      ["graph axis on graph bg", t["--graph-axis"], t["--graph-bg"], 3], ["figure path on graph bg", t["--fig-path"], t["--graph-bg"], 3],
    ];
    for (const [what, a, b, min] of need) assert.ok(C(a, b) >= min, `${id}: ${what} ${C(a, b).toFixed(2)} < ${min}`);
  }
});
test("css/themes.css is up to date with tools/themes.js", () => {
  assert.strictEqual(read("css/themes.css"), T.css(), "run: node tools/themes.js");
});
test("the app, the <head> script and the generator agree on themes and tones", () => {
  const app = read("js/app.js"), html = read("index.html");
  const appList = JSON.parse(app.match(/const THEMES = (\[[^\]]+\])/)[1]);
  assert.deepStrictEqual(appList, T.IDS);
  const tone = (src) => Object.fromEntries([...src.matchAll(/(\w+): "(light|dark)"/g)].map((m) => [m[1], m[2]]));
  assert.deepStrictEqual(tone(app.match(/const THEME_TONE = \{[^}]+\}/)[0]), T.TONE);
  assert.deepStrictEqual(tone(html.match(/var T = \{[^}]+\}/)[0]), T.TONE);
  assert.ok(html.includes('href="css/themes.css"'));
  // seasonal themes are never chosen by date
  assert.ok(!/getMonth\(\)[\s\S]{0,200}(halloween|christmas)/i.test(app));
});
test("every theme has a name and description in five languages", () => {
  for (const id of T.IDS) for (const k of ["theme." + id, "theme." + id + ".d"]) {
    assert.ok(I18N.T[k], k);
    assert.strictEqual(I18N.T[k].length, 5, k);
  }
});
