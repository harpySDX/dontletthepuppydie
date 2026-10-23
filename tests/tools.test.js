// Calculator engine and translation table checks.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), path = require("path");
global.window = global;
const Calc = require("../js/calculator.js");
const I18N = require("../js/i18n.js");
require("../js/i18n-tour.js"); // onboarding strings register into the same table
require("../js/i18n-splus.js"); // Studio+ strings too
require("../js/i18n-goose.js"); // Goose Mode strings
require("../js/i18n-physics.js"); // Physics 11 strings
require("../js/i18n-phystest.js"); // Physics test strings
require("../js/i18n-cafe.js"); // Study Café strings (home, The Bar, accent, scene)

const ev = (s, o) => Calc.evaluate(s, o);
const val = (s, o) => { const r = ev(s, o); assert.ok(r.ok, `${s} → ${r.error}`); return r.value; };
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)), `${msg}: ${a} ≠ ${b}`);

test("calculator: precedence, associativity, unary minus and implicit multiplication", () => {
  near(val("2+3*4"), 14, "precedence");
  near(val("2^3^2"), 512, "right-assoc ^");
  near(val("-3^2"), -9, "unary minus binds below ^");
  near(val("(-3)^2"), 9, "bracketed negative");
  near(val("2(3+4)"), 14, "implicit 2(…)");
  near(val("(1+2)(3+4)"), 21, "implicit )(");
  near(val("2pi"), 2 * Math.PI, "implicit 2π");
  near(val("3!"), 6, "factorial");
  near(val("50%"), 0.5, "percent");
  near(val("12/3/2"), 2, "left-assoc /");
  near(val("2(3+4)^2/7 - sin(30)"), 13.5, "mixed, degrees");
});
test("calculator: functions, angle modes, roots and logs", () => {
  near(val("sin(30)"), 0.5, "deg default");
  near(val("sin(pi/2)", { angle: "rad" }), 1, "rad");
  near(val("asin(1)"), 90, "inverse in degrees");
  near(val("cos(60)"), 0.5, "cos");
  near(val("tan(45)"), 1, "tan");
  near(val("sqrt(16)"), 4, "sqrt");
  near(val("root(27,3)"), 3, "nth root");
  near(val("root(-8,3)"), -2, "odd root of a negative");
  near(val("log(1000)"), 3, "log10");
  near(val("ln(e)"), 1, "ln");
  near(val("Ans*2", { ans: 21 }), 42, "Ans");
});
test("calculator: errors are codes, never NaN/Infinity or code execution", () => {
  for (const [s, code] of [["1/0", "div0"], ["sqrt(-1)", "domain"], ["log(0)", "domain"], ["(2+3", "paren"], ["2+", "syntax"], ["alert(1)", "syntax"], ["constructor", "syntax"], ["10^400", "big"]]) {
    const r = ev(s);
    assert.strictEqual(r.ok, false, s);
    assert.strictEqual(r.error, code, `${s} → ${r.error}`);
  }
  assert.ok(ev("").empty);
});
test("calculator: display formatting trims float noise", () => {
  assert.strictEqual(Calc.format(0.1 + 0.2), "0.3");
  assert.strictEqual(Calc.format(val("sin(30)")), "0.5");
  assert.strictEqual(Calc.format(1e21).includes("e"), true);
});
test("i18n: every key has all five languages, non-empty, and no placeholder the English lacks", () => {
  assert.strictEqual(I18N.LANGS.length, 5);
  for (const k of I18N.keys()) {
    const row = I18N.T[k];
    assert.strictEqual(row.length, 5, k);
    const ph = (s) => s.match(/\{\w+\}/g) || [];
    const en = new Set(ph(row[0]));
    for (const s of row) { assert.ok(typeof s === "string" && s.trim(), `${k} empty`); for (const x of ph(s)) assert.ok(en.has(x), `${k}: ${x} not in English`); }
  }
});
test("i18n: every data-i18n key used in the page exists", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const used = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(";")) used.add(pair.split(":")[1]);
  const missing = [...used].filter((k) => !I18N.T[k]);
  assert.deepStrictEqual(missing, []);
});
