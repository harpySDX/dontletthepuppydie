#!/usr/bin/env node
// Theme token generator. Each theme below is a short palette; derive() turns it into the full token set the app
// uses (the same variables Light Glass and Dark Glass define in css/glass.css), and `node tools/themes.js` writes
// css/themes.css. Edit a palette here, re-run, commit both files. tests/themes.test.js checks contrast for every theme.
//
// Seasonal themes (Halloween, Christmas) are ordinary choices: nothing switches to them automatically.
const fs = require("fs");
const path = require("path");

// ───────── colour helpers ─────────
const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const rgba = (h, a) => `rgba(${hex(h).join(", ")}, ${a})`;
const lum = (h) => { const [r, g, b] = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// ───────── palettes ─────────
// tone: which base the theme builds on (light or dark surfaces). accentInk/emberInk: text on filled buttons.
// second: the secondary hue (charts, vector components, highlights). tints: three soft background glows.
const THEMES = {
  // the default: boutique café meets dark academia — espresso and walnut, parchment text, brass accent, sage
  cafe: {
    name: "Study Café", tone: "dark",
    bg: "#16100b", surface: "#241a13", ink: "#f3e9d6", muted: "#cdbb9f",
    accent: "#d4ac5e", accentInk: "#1d1309", second: "#a3bb95", ember: "#d4ac5e", emberInk: "#1d1309",
    good: "#9fd08f", mid: "#e6c47c", bad: "#f2957f",
    tints: ["#b8913f", "#6f8a63", "#6b2f22"],
  },
  cinnamon: {
    name: "Cinnamon", tone: "light",
    bg: "#f5ebe1", surface: "#fffaf4", ink: "#2d1b10", muted: "#6a4e3c",
    accent: "#a94b1f", accentInk: "#ffffff", second: "#7d5a2e", ember: "#b8541f", emberInk: "#ffffff",
    good: "#2f7d3e", mid: "#9a6a00", bad: "#b3261e",
    tints: ["#e3a36f", "#c9875a", "#f2c99a"], paper: "#fffdf9",
  },
  blush: {
    name: "Blush", tone: "light",
    bg: "#fbedf1", surface: "#fff8fa", ink: "#37151f", muted: "#76495a",
    accent: "#b4325f", accentInk: "#ffffff", second: "#8a52c2", ember: "#c03f6b", emberInk: "#ffffff",
    good: "#23805a", mid: "#966100", bad: "#b52b2b",
    tints: ["#f4a7bf", "#d9b2f0", "#ffd0dc"], paper: "#fffcfd",
  },
  galaxy: {
    name: "Galaxy", tone: "dark",
    bg: "#0b0820", surface: "#151033", ink: "#ece8ff", muted: "#b3abda",
    accent: "#a993ff", accentInk: "#120a2c", second: "#5ccfff", ember: "#ff8ad8", emberInk: "#2a0820",
    good: "#5ee0a6", mid: "#f1cd6b", bad: "#ff8f9c",
    tints: ["#6a3dff", "#d346c8", "#2a8cff"], stars: true,
  },
  arctic: {
    name: "Arctic", tone: "light",
    bg: "#e8f3f8", surface: "#f8fcfe", ink: "#0a2431", muted: "#3f5c6b",
    accent: "#0b6f95", accentInk: "#ffffff", second: "#4a63c9", ember: "#0b6c8f", emberInk: "#ffffff",
    good: "#147a57", mid: "#8a6200", bad: "#b8303a",
    tints: ["#9fd8f0", "#c3d4ff", "#d8f5ff"], paper: "#ffffff",
  },
  beach: {
    name: "Beach", tone: "light",
    bg: "#f6eedc", surface: "#fffcf3", ink: "#1d2a2c", muted: "#53605c",
    accent: "#00777c", accentInk: "#ffffff", second: "#d0603a", ember: "#a94824", emberInk: "#ffffff",
    good: "#257a43", mid: "#8b6300", bad: "#b3302c",
    tints: ["#7fd3d1", "#ffb48f", "#f8dc9c"], paper: "#fffdf6",
  },
  halloween: {
    name: "Halloween", tone: "dark",
    bg: "#110b12", surface: "#1c131e", ink: "#f7ece1", muted: "#c9b5a9",
    accent: "#ff8c2e", accentInk: "#1d0c00", second: "#b884ff", ember: "#ff8c2e", emberInk: "#1d0c00",
    good: "#8fdc6e", mid: "#f6c95a", bad: "#ff8080",
    tints: ["#ff7a1a", "#8a3dd6", "#3f6b1f"],
  },
  christmas: {
    name: "Christmas", tone: "dark",
    bg: "#0a1912", surface: "#11251b", ink: "#f3f6ef", muted: "#b9cbbd",
    accent: "#f0c760", accentInk: "#1d1500", second: "#ff6b6b", ember: "#c13434", emberInk: "#ffffff",
    good: "#7fdc9a", mid: "#f0c760", bad: "#ff8f8a",
    tints: ["#c62f2f", "#2f8f4e", "#f0c760"],
  },
  graphite: {
    name: "Graphite", tone: "dark",
    bg: "#121314", surface: "#1b1c1e", ink: "#ececed", muted: "#a8abaf",
    accent: "#c5ccd6", accentInk: "#121314", second: "#8fa3b8", ember: "#d9dde3", emberInk: "#121314",
    good: "#7fcf9f", mid: "#e2c27a", bad: "#f08c8c",
    tints: ["#5a6370", "#3d434c", "#6b7480"],
  },
  lime: {
    name: "Lime", tone: "light",
    bg: "#eff7e3", surface: "#fbfdf5", ink: "#17230b", muted: "#4b5a3d",
    accent: "#3b730a", accentInk: "#ffffff", second: "#0f7f74", ember: "#3e720b", emberInk: "#ffffff",
    good: "#1f7a3c", mid: "#866000", bad: "#b3302c",
    tints: ["#bfe66b", "#8fd6b5", "#e3f59a"], paper: "#fefffa",
  },
};

// ───────── palette → full token set ─────────
// the faintest text colour that still reads at AA (4.5:1) on the page background, sunken wells and raised cards
function faintFor(p, L) {
  const sunken = L ? mix(p.bg, p.ink, 0.035) : mix(p.bg, "#000000", 0.15);
  const elevated = L ? mix(p.surface, "#ffffff", 0.6) : mix(p.surface, p.ink, 0.06);
  for (let t = 0.4; t > 0; t -= 0.02) { const f = mix(p.muted, p.surface, t); if ([p.bg, sunken, p.surface, elevated].every((b) => contrast(f, b) >= 4.6)) return f; }
  return p.muted;
}
function derive(p) {
  const L = p.tone === "light";
  const W = "#ffffff", K = "#000000";
  const paper = p.paper || (L ? mix(p.surface, W, 0.7) : mix(p.surface, p.bg, 0.35));
  const shadowTint = mix(p.ink, p.accent, 0.35);
  const t = {
    "color-scheme": L ? "light" : "dark",
    "--bg": p.bg,
    "--bg-tint-1": rgba(p.tints[0], L ? 0.2 : 0.2), "--bg-tint-2": rgba(p.tints[1], L ? 0.14 : 0.13), "--bg-tint-3": rgba(p.tints[2], L ? 0.16 : 0.1),
    "--sunken": L ? mix(p.bg, p.ink, 0.035) : mix(p.bg, K, 0.15),
    "--surface": p.surface,
    "--elevated": L ? mix(p.surface, W, 0.6) : mix(p.surface, p.ink, 0.06),
    "--hover": mix(p.surface, p.accent, L ? 0.06 : 0.1),
    "--glass": rgba(p.surface, L ? 0.64 : 0.6), "--glass-strong": rgba(p.surface, L ? 0.86 : 0.88),
    "--glass-border": L ? rgba(W, 0.72) : rgba(p.ink, 0.12),
    "--glass-rim": L
      ? `linear-gradient(135deg, ${rgba(W, 0.95)}, ${rgba(mix(p.surface, p.accent, 0.25), 0.55)} 45%, ${rgba(W, 0.85)})`
      : `linear-gradient(135deg, ${rgba(p.accent, 0.3)}, ${rgba(p.surface, 0.08)} 45%, ${rgba(p.second, 0.18)})`,
    "--line": mix(p.surface, p.ink, L ? 0.13 : 0.14), "--line-soft": rgba(p.ink, L ? 0.13 : 0.12), "--line-strong": mix(p.surface, p.ink, L ? 0.22 : 0.22),
    "--ink": p.ink, "--muted": p.muted, "--faint": faintFor(p, L),
    "--accent": p.accent, "--accent-strong": mix(p.accent, L ? K : K, L ? 0.14 : 0.16), "--accent-soft": rgba(p.accent, L ? 0.1 : 0.14), "--accent-line": rgba(p.accent, L ? 0.34 : 0.4), "--accent-ink": p.accentInk,
    "--violet": p.second, "--violet-soft": rgba(p.second, L ? 0.12 : 0.15),
    "--ember": p.ember, "--ember-2": mix(p.ember, W, 0.3), "--ember-ink": p.emberInk, "--ember-soft": rgba(p.ember, L ? 0.1 : 0.14),
    "--good": p.good, "--mid": p.mid, "--bad": p.bad,
    "--good-soft": rgba(p.good, L ? 0.1 : 0.13), "--mid-soft": rgba(p.mid, L ? 0.12 : 0.13), "--bad-soft": rgba(p.bad, L ? 0.09 : 0.13),
    "--good-ink": L ? mix(p.good, K, 0.25) : mix(p.good, W, 0.45), "--mid-ink": L ? mix(p.mid, K, 0.18) : mix(p.mid, W, 0.4), "--bad-ink": L ? mix(p.bad, K, 0.18) : mix(p.bad, W, 0.45),
    "--on-good": L ? W : mix(p.bg, K, 0.4), "--on-bad": L ? W : mix(p.bg, K, 0.4),
    "--ice": mix(p.accent, W, L ? 0.3 : 0.2),
    "--paper": paper, "--paper-line": mix(paper, p.ink, 0.1), "--paper-ink": L ? p.ink : mix(p.ink, W, 0.2), "--paper-muted": p.muted,
    "--sheet-2": mix(paper, p.accent, L ? 0.03 : 0.05), "--sheet-3": mix(paper, p.accent, L ? 0.06 : 0.09), "--sheet-line": mix(paper, p.ink, 0.12),
    "--tag-bg": L ? mix(paper, p.accent, 0.1) : rgba(p.accent, 0.16), "--tag-ink": L ? mix(p.accent, K, 0.25) : mix(p.accent, W, 0.4),
    "--graph-bg": L ? mix(paper, p.bg, 0.25) : mix(paper, p.bg, 0.3), "--graph-grid": mix(paper, p.ink, L ? 0.1 : 0.12), "--graph-grid-minor": mix(paper, p.ink, L ? 0.05 : 0.06), "--graph-axis": p.muted,
    "--shadow-1": L ? `0 1px 2px ${rgba(shadowTint, 0.06)}, 0 10px 28px -16px ${rgba(shadowTint, 0.24)}` : `0 1px 0 ${rgba(W, 0.03)} inset, 0 12px 30px -16px ${rgba(K, 0.7)}`,
    "--shadow-2": L ? `0 2px 6px ${rgba(shadowTint, 0.07)}, 0 24px 60px -24px ${rgba(shadowTint, 0.34)}` : `0 24px 60px -24px ${rgba(K, 0.8)}`,
    "--shadow-float": L ? `0 1px 0 ${rgba(W, 0.9)} inset, 0 18px 50px -18px ${rgba(shadowTint, 0.36)}, 0 0 0 1px ${rgba(W, 0.6)}` : `0 1px 0 ${rgba(p.accent, 0.08)} inset, 0 24px 60px -18px ${rgba(K, 0.8)}, 0 0 0 1px ${rgba(p.accent, 0.08)}`,
    "--rim": L ? `inset 0 1px 0 ${rgba(W, 0.95)}, inset 0 0 0 1px ${rgba(W, 0.55)}` : `inset 0 1px 0 ${rgba(p.accent, 0.1)}, inset 0 0 0 1px ${rgba(p.accent, 0.07)}`,
    // physics figures and simulations
    "--fig-path": p.accent, "--fig-curve": p.accent, "--fig-ball": p.ember, "--fig-comp": p.second, "--fig-vec": p.ink, "--fig-mark": p.mid,
    // swatches for the theme picker
    "--th-a": p.accent, "--th-b": p.second, "--th-c": p.bg, "--th-d": p.surface,
  };
  return t;
}

function css() {
  const out = ["/* Generated by tools/themes.js — edit the palettes there and re-run `node tools/themes.js`. */",
    "/* Each block is a complete token set; html[data-tone] is set by the app so tone-specific rules (dialogs, overlays) follow. */"];
  for (const [id, p] of Object.entries(THEMES)) {
    const t = derive(p);
    out.push(`:root[data-theme="${id}"] {\n` + Object.entries(t).map(([k, v]) => `  ${k}: ${v};`).join("\n") + "\n}");
    out.push(`.th-card[data-theme-opt="${id}"] { --pv-bg: ${p.bg}; --pv-surface: ${p.surface}; --pv-ink: ${p.ink}; --pv-muted: ${p.muted}; --pv-accent: ${p.accent}; --pv-accent-ink: ${p.accentInk}; --pv-second: ${p.second}; --pv-ember: ${p.ember}; --pv-line: ${t["--line"]}; }`);
    if (p.stars) out.push(`/* ${p.name}: a static star field on the page background (no motion) */\n:root[data-theme="${id}"] body {\n  background:\n    radial-gradient(1.2px 1.2px at 12% 18%, ${rgba(W_, 0.55)}, transparent 60%),\n    radial-gradient(1px 1px at 28% 72%, ${rgba(W_, 0.45)}, transparent 60%),\n    radial-gradient(1.4px 1.4px at 47% 34%, ${rgba(W_, 0.5)}, transparent 60%),\n    radial-gradient(1px 1px at 63% 86%, ${rgba(W_, 0.4)}, transparent 60%),\n    radial-gradient(1.2px 1.2px at 78% 22%, ${rgba(W_, 0.55)}, transparent 60%),\n    radial-gradient(1px 1px at 91% 61%, ${rgba(W_, 0.45)}, transparent 60%),\n    radial-gradient(900px 520px at 8% -8%, var(--bg-tint-1), transparent 65%),\n    radial-gradient(760px 480px at 100% 0%, var(--bg-tint-2), transparent 62%),\n    radial-gradient(900px 600px at 60% 110%, var(--bg-tint-3), transparent 60%),\n    var(--bg);\n  background-size: 340px 340px, 420px 420px, 380px 380px, 460px 460px, 400px 400px, 360px 360px, auto, auto, auto, auto;\n  background-attachment: fixed;\n}`);
  }
  return out.join("\n\n") + "\n";
}
const W_ = "#ffffff";

// the Study Café is the default and comes first in the picker
const IDS = ["cafe", "light", "dark", "system", ...Object.keys(THEMES).filter((k) => k !== "cafe")];
const DEFAULT = "cafe";
const TONE = { light: "light", dark: "dark", ...Object.fromEntries(Object.entries(THEMES).map(([k, p]) => [k, p.tone])) };
module.exports = { THEMES, derive, contrast, mix, IDS, TONE, DEFAULT, css };

if (require.main === module) {
  const file = path.join(__dirname, "..", "css", "themes.css");
  fs.writeFileSync(file, css());
  // a quick contrast report
  for (const [id, p] of Object.entries(THEMES)) {
    const t = derive(p);
    const pairs = { "ink/bg": [t["--ink"], t["--bg"]], "muted/surface": [t["--muted"], t["--surface"]], "accent/surface": [t["--accent"], t["--surface"]], "accent-ink/accent": [t["--accent-ink"], t["--accent"]], "ember-ink/ember": [t["--ember-ink"], t["--ember"]], "bad-ink/surface": [t["--bad-ink"], t["--surface"]], "good-ink/surface": [t["--good-ink"], t["--surface"]], "paper-ink/paper": [t["--paper-ink"], t["--paper"]], "faint/surface": [t["--faint"], t["--surface"]], "good/surface": [t["--good"], t["--surface"]], "mid/surface": [t["--mid"], t["--surface"]], "bad/surface": [t["--bad"], t["--surface"]], "muted/paper": [t["--paper-muted"], t["--paper"]] };
    console.log(id.padEnd(10), Object.entries(pairs).map(([k, [a, b]]) => `${k} ${contrast(a, b).toFixed(1)}`).join("  "));
  }
  console.log("wrote", path.relative(process.cwd(), file));
  console.log("tones (keep js/app.js THEME_TONE and the <head> script in index.html in step):", JSON.stringify(TONE));
}
