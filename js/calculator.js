/*
 * CALCULATOR — a numeric scientific calculator.
 *
 *   Calc.evaluate(src, { angle: "deg" | "rad", ans })  → { ok, value } | { ok: false, error: "syntax"|"paren"|"domain"|"div0"|"big" }
 *   new Calc.Panel(el, { t })                            the floating panel (drag, resize, keyboard, history)
 *
 * A small recursive-descent parser: no eval, no Function. Precedence, high → low:
 *   postfix  !  %          · power ^ (right-assoc, binds tighter than unary minus: −2^2 = −4)
 *   unary −  √  ∛          · implicit and explicit × ÷ (left-assoc) · + −
 * Functions: sin cos tan asin acos atan (degree mode applies), sqrt cbrt ln log (base 10) log2 abs exp,
 * root(x, n) for the n-th root. Constants: π (pi), e, Ans.
 */
(function (root) {
  "use strict";
  const FUNCS = {
    sin: (x, m) => Math.sin(m === "deg" ? (x * Math.PI) / 180 : x),
    cos: (x, m) => Math.cos(m === "deg" ? (x * Math.PI) / 180 : x),
    tan: (x, m) => { const r = m === "deg" ? (x * Math.PI) / 180 : x; if (Math.abs(Math.cos(r)) < 1e-12) throw err("domain"); return Math.tan(r); },
    asin: (x, m) => { if (x < -1 || x > 1) throw err("domain"); const r = Math.asin(x); return m === "deg" ? (r * 180) / Math.PI : r; },
    acos: (x, m) => { if (x < -1 || x > 1) throw err("domain"); const r = Math.acos(x); return m === "deg" ? (r * 180) / Math.PI : r; },
    atan: (x, m) => { const r = Math.atan(x); return m === "deg" ? (r * 180) / Math.PI : r; },
    sqrt: (x) => { if (x < 0) throw err("domain"); return Math.sqrt(x); },
    cbrt: (x) => Math.cbrt(x),
    ln: (x) => { if (x <= 0) throw err("domain"); return Math.log(x); },
    log: (x) => { if (x <= 0) throw err("domain"); return Math.log10(x); },
    log2: (x) => { if (x <= 0) throw err("domain"); return Math.log2(x); },
    abs: (x) => Math.abs(x),
    exp: (x) => Math.exp(x),
  };
  const err = (code) => { const e = new Error(code); e.calc = code; return e; };

  function tokenize(src) {
    const s = String(src).replace(/[−–—]/g, "-").replace(/[×·∙⋅]/g, "*").replace(/÷/g, "/").replace(/²/g, "^2").replace(/³/g, "^3").replace(/\*\*/g, "^")
      .replace(/sin⁻¹/g, "asin").replace(/cos⁻¹/g, "acos").replace(/tan⁻¹/g, "atan").replace(/,/g, " , ");
    const out = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { if (s.slice(i).startsWith(" , ")) { out.push({ k: "," }); i += 3; continue; } i++; continue; }
      const rest = s.slice(i);
      let m;
      if ((m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(rest))) { out.push({ k: "num", v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = /^(asin|acos|atan|sqrt|cbrt|log2|sin|cos|tan|ln|log|abs|exp|root)/i.exec(rest))) { out.push({ k: "fn", v: m[1].toLowerCase() }); i += m[1].length; continue; }
      if ((m = /^(pi|π)/i.exec(rest))) { out.push({ k: "num", v: Math.PI }); i += m[1].length; continue; }
      if ((m = /^ans/i.exec(rest))) { out.push({ k: "ans" }); i += 3; continue; }
      if (ch === "e" || ch === "ℯ") { out.push({ k: "num", v: Math.E }); i++; continue; }
      if (ch === "√") { out.push({ k: "fn", v: "sqrt", pre: true }); i++; continue; }
      if (ch === "∛") { out.push({ k: "fn", v: "cbrt", pre: true }); i++; continue; }
      if ("+-*/^()!%".includes(ch)) { out.push({ k: ch }); i++; continue; }
      if (ch === "[" ) { out.push({ k: "(" }); i++; continue; }
      if (ch === "]") { out.push({ k: ")" }); i++; continue; }
      throw err("syntax");
    }
    return out;
  }

  function evaluate(src, opts = {}) {
    const angle = opts.angle === "rad" ? "rad" : "deg";
    try {
      const toks = tokenize(src);
      if (!toks.length) return { ok: false, error: "syntax", empty: true };
      let i = 0;
      const peek = () => toks[i];
      const eat = (k) => (toks[i] && toks[i].k === k ? toks[i++] : null);
      const startsAtom = (t) => t && (t.k === "num" || t.k === "fn" || t.k === "(" || t.k === "ans");
      function expr() { let v = term(); for (;;) { if (eat("+")) v += term(); else if (eat("-")) v -= term(); else return v; } }
      function term() {
        let v = unary();
        for (;;) {
          if (eat("*")) v *= unary();
          else if (eat("/")) { const d = unary(); if (d === 0) throw err("div0"); v /= d; }
          else if (startsAtom(peek())) v *= unary();
          else return v;
        }
      }
      function unary() { if (eat("-")) return -unary(); if (eat("+")) return unary(); return power(); }
      function power() {
        const b = postfix();
        if (eat("^")) {
          const e = unary();
          if (b < 0 && !Number.isInteger(e)) {
            // odd roots of negatives: (−8)^(1/3) = −2
            const inv = 1 / e;
            if (Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2) return -Math.pow(-b, e);
            throw err("domain");
          }
          if (b === 0 && e < 0) throw err("div0");
          return Math.pow(b, e);
        }
        return b;
      }
      function postfix() {
        let v = atom();
        for (;;) {
          if (eat("!")) { if (v < 0 || !Number.isInteger(v)) throw err("domain"); if (v > 170) throw err("big"); let f = 1; for (let k = 2; k <= v; k++) f *= k; v = f; }
          else if (eat("%")) v /= 100;
          else return v;
        }
      }
      function atom() {
        const t = toks[i++];
        if (!t) throw err("syntax");
        if (t.k === "num") return t.v;
        if (t.k === "ans") { if (typeof opts.ans !== "number") throw err("syntax"); return opts.ans; }
        if (t.k === "(") { const v = expr(); if (!eat(")")) throw err("paren"); return v; }
        if (t.k === "fn") {
          if (t.pre && peek() && peek().k !== "(") return FUNCS[t.v](postfix(), angle); // √9, √2π reads as √(2)·π? keep it tight: √ applies to the next atom
          if (!eat("(")) throw err("syntax");
          const a = expr();
          if (t.v === "root") {
            if (!eat(",")) throw err("syntax");
            const n = expr();
            if (!eat(")")) throw err("paren");
            if (!Number.isInteger(n) || n === 0) throw err("domain");
            if (a < 0 && n % 2 === 0) throw err("domain");
            return a < 0 ? -Math.pow(-a, 1 / n) : Math.pow(a, 1 / n);
          }
          if (!eat(")")) throw err("paren");
          return FUNCS[t.v](a, angle);
        }
        if (t.k === ")") throw err("paren");
        throw err("syntax");
      }
      const v = expr();
      if (i < toks.length) throw err(toks[i].k === ")" ? "paren" : "syntax");
      if (!Number.isFinite(v)) throw err(Math.abs(v) === Infinity ? "big" : "domain");
      return { ok: true, value: v };
    } catch (e) {
      return { ok: false, error: e.calc || "syntax" };
    }
  }
  // display: up to 12 significant digits, no float noise (0.1 + 0.2 → 0.3)
  function format(v) {
    if (Object.is(v, -0) || Math.abs(v) < 1e-13) return "0";
    const a = Math.abs(v);
    if (a >= 1e12 || a < 1e-6) return v.toExponential(8).replace(/\.?0+e/, "e");
    return String(parseFloat(v.toPrecision(12)));
  }

  // ───────── the floating panel ─────────
  const KEYS = [
    ["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["(", "("], [")", ")"], ["⌫", "back"],
    ["sin⁻¹", "asin("], ["cos⁻¹", "acos("], ["tan⁻¹", "atan("], ["x²", "^2"], ["xʸ", "^"], ["C", "clear"],
    ["ln", "ln("], ["log", "log("], ["√", "√("], ["∛", "∛("], ["ⁿ√", "root("], ["÷", "÷"],
    ["7", "7"], ["8", "8"], ["9", "9"], ["π", "π"], ["e", "e"], ["×", "×"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["!", "!"], [",", ","], ["−", "−"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["Ans", "Ans"], ["%", "%"], ["+", "+"],
    ["0", "0"], [".", "."], ["±", "neg"], ["=", "eval"],
  ];
  const PREF = "campfire-prep.calc.v1";
  const loadP = () => { try { return JSON.parse(localStorage.getItem(PREF)) || {}; } catch { return {}; } };
  const saveP = (p) => { try { localStorage.setItem(PREF, JSON.stringify(p)); } catch { /* ignore */ } };

  class Panel {
    constructor(el, opts = {}) {
      this.el = el;
      this.t = opts.t || ((k) => k);
      this.prefs = Object.assign({ angle: "deg", x: null, y: null, w: 320, h: 470, hist: [] }, loadP());
      this.ans = this.prefs.hist.length ? this.prefs.hist[0].v : undefined;
      this.onClose = opts.onClose || (() => {});
      this.build();
    }
    build() {
      const t = this.t;
      this.el.innerHTML = `
        <div class="fp-head" data-drag><span class="fp-title">${t("tools.calc")}</span>
          <span class="fp-actions"><span class="seg-mini" role="radiogroup" aria-label="Angle mode"><button type="button" data-angle="deg">${t("calc.deg")}</button><button type="button" data-angle="rad">${t("calc.rad")}</button></span>
          <button type="button" class="fp-x" data-close aria-label="${t("calc.close")}">×</button></span></div>
        <div class="calc-display">
          <ol class="calc-hist" aria-label="${t("calc.history")}"></ol>
          <label class="sr-only" for="calc-in">${t("calc.placeholder")}</label>
          <input id="calc-in" class="calc-in" type="text" inputmode="none" autocomplete="off" spellcheck="false" placeholder="${t("calc.placeholder")}" />
          <output class="calc-out" aria-live="polite"></output>
        </div>
        <div class="calc-keys">${KEYS.map(([lab, v]) => `<button type="button" class="ckey${/^[0-9.]$/.test(lab) ? " num" : ""}${v === "eval" ? " eq" : ""}${["clear", "back"].includes(v) ? " fn2" : ""}" data-k="${v}" ${v === "back" ? `aria-label="${t("calc.back")}"` : v === "clear" ? `aria-label="${t("calc.clear")}"` : ""}>${lab}</button>`).join("")}</div>
        <p class="calc-note">${t("calc.note")}</p>
        <div class="fp-resize" data-resize aria-hidden="true"></div>`;
      this.input = this.el.querySelector(".calc-in");
      this.out = this.el.querySelector(".calc-out");
      this.histEl = this.el.querySelector(".calc-hist");
      this.renderAngle(); this.renderHist();
      this.el.querySelector(".calc-keys").addEventListener("mousedown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
      this.el.querySelector(".calc-keys").addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) this.key(b.dataset.k); });
      this.el.querySelector(".seg-mini").addEventListener("click", (e) => { const b = e.target.closest("[data-angle]"); if (!b) return; this.prefs.angle = b.dataset.angle; saveP(this.prefs); this.renderAngle(); this.preview(); });
      this.el.querySelector("[data-close]").addEventListener("click", () => this.onClose());
      this.histEl.addEventListener("click", (e) => { const li = e.target.closest("[data-v]"); if (li) this.insert(li.dataset.v); });
      this.input.addEventListener("input", () => this.preview());
      this.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === "=") { e.preventDefault(); this.key("eval"); }
        // Escape is left to the panel system (it closes the calculator, like every popover); C or Delete clears
        else if (e.key === "Delete" && this.input.selectionStart === this.input.value.length) { e.preventDefault(); this.key("clear"); }
      });
    }
    renderAngle() { for (const b of this.el.querySelectorAll("[data-angle]")) { const on = b.dataset.angle === this.prefs.angle; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); b.setAttribute("role", "radio"); } }
    renderHist() { this.histEl.innerHTML = this.prefs.hist.slice(0, 4).reverse().map((h) => `<li data-v="${format(h.v)}" title="Insert ${format(h.v)}"><span class="ch-e">${esc(h.e)}</span><span class="ch-v">= ${format(h.v)}</span></li>`).join(""); }
    insert(s) {
      const inp = this.input, a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? inp.value.length;
      inp.value = inp.value.slice(0, a) + s + inp.value.slice(b);
      const pos = a + s.length; inp.focus(); inp.setSelectionRange(pos, pos); this.preview();
    }
    key(k) {
      const inp = this.input;
      if (k === "clear") { inp.value = ""; this.out.textContent = ""; this.out.className = "calc-out"; inp.focus(); return; }
      if (k === "back") { const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a; if (a !== b) inp.value = inp.value.slice(0, a) + inp.value.slice(b); else if (a > 0) { inp.value = inp.value.slice(0, a - 1) + inp.value.slice(a); inp.setSelectionRange(a - 1, a - 1); } inp.focus(); this.preview(); return; }
      if (k === "neg") { inp.value = inp.value ? `-(${inp.value})` : "-"; inp.focus(); this.preview(); return; }
      if (k === "eval") {
        const r = evaluate(inp.value, { angle: this.prefs.angle, ans: this.ans });
        if (r.ok) {
          this.ans = r.value;
          this.prefs.hist.unshift({ e: inp.value, v: r.value }); this.prefs.hist = this.prefs.hist.slice(0, 12); saveP(this.prefs);
          this.renderHist();
          inp.value = format(r.value); this.out.textContent = ""; this.out.className = "calc-out";
        } else if (!r.empty) { this.out.textContent = this.t("calc.err." + r.error); this.out.className = "calc-out err"; }
        inp.focus(); return;
      }
      this.insert(k);
    }
    preview() {
      const r = evaluate(this.input.value, { angle: this.prefs.angle, ans: this.ans });
      this.out.className = "calc-out";
      this.out.textContent = r.ok && /[^\d.\s]/.test(this.input.value) ? `= ${format(r.value)}` : "";
    }
    focus() { this.input.focus(); }
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const api = { evaluate, format, Panel };
  root.Calc = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
