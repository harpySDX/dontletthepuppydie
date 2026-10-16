// A tiny, independent LaTeX evaluator for the shapes Nightmare questions use:
// \frac/\dfrac/\tfrac, \left( \right), ( ), \sqrt{}, \sqrt[n]{}, ^{...}, \cdot, numbers, single-letter variables.
// It shares no code with js/nightmare.js, so it can check generated questions from the outside.
function evalTeX(src, vars = {}) {
  const s = String(src).replace(/\\displaystyle|\\left|\\right|\\,|\\;|\\!|\\ /g, "").replace(/\s+/g, "");
  let i = 0;
  const peek = () => s[i];
  const eat = (str) => { if (s.startsWith(str, i)) { i += str.length; return true; } return false; };
  const need = (str) => { if (!eat(str)) throw new Error(`expected ${str} at ${i} in ${s}`); };
  function group() { need("{"); const v = expr(); need("}"); return v; }
  function expr() {
    let v = 0, sign = 1, first = true;
    for (;;) {
      if (eat("+")) sign = 1; else if (eat("-")) sign = -1; else if (!first) break;
      v += sign * term(); sign = 1; first = false;
      if (i >= s.length || peek() === "}" || peek() === ")" || peek() === "]") break;
    }
    return v;
  }
  function term() {
    let v = power();
    for (;;) {
      if (eat("\\cdot") || eat("\\times")) { v *= power(); continue; }
      const c = peek();
      if (c === undefined || "+-})]".includes(c)) return v;
      v *= power();
    }
  }
  function power() {
    let b = atom();
    while (eat("^")) {
      let e;
      if (peek() === "{") e = group();
      else if (s.startsWith("\\frac", i) || s.startsWith("\\tfrac", i) || s.startsWith("\\dfrac", i)) e = atom();
      else if (/[0-9]/.test(peek())) e = Number(s[i++]);
      else if (eat("-")) e = -atom();
      else e = atom();
      b = Math.pow(b, e);
    }
    return b;
  }
  function atom() {
    if (eat("\\dfrac") || eat("\\tfrac") || eat("\\frac")) { const a = group(), b = group(); return a / b; }
    if (eat("\\sqrt")) {
      let n = 2;
      if (eat("[")) { n = expr(); need("]"); }
      const v = group();
      return v < 0 && n % 2 === 1 ? -Math.pow(-v, 1 / n) : Math.pow(v, 1 / n);
    }
    if (eat("(")) { const v = expr(); need(")"); return v; }
    if (peek() === "{") return group();
    const num = /^[0-9]+(\.[0-9]+)?/.exec(s.slice(i));
    if (num) { i += num[0].length; return Number(num[0]); }
    const c = peek();
    if (c && /[a-zA-Z]/.test(c) && c in vars) { i++; return vars[c]; }
    throw new Error(`unexpected '${s.slice(i, i + 12)}' in ${s}`);
  }
  const v = expr();
  if (i !== s.length) throw new Error(`trailing '${s.slice(i)}' in ${s}`);
  return v;
}
module.exports = { evalTeX };
