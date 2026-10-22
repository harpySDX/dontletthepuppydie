// quick generator health check: node tools/gen-check.js [familyPrefix] [N]
require("../tests/load.js");
const B = global.Bank;
let fails = {};
global.__bankDebug = (f, e) => { const k = f + ": " + e.message.slice(0, 90); fails[k] = (fails[k] || 0) + 1; };
const pre = process.argv[2] || "", N = Number(process.argv[3] || 150);
const rows = [];
for (const F of B.FAMILIES.filter((F) => !F.adapter && F.id.startsWith(pre))) for (const kind of F.kinds) for (const mode of F.modes) {
  const sigs = new Set(), tpl = new Set(); let ok = 0, err = 0;
  for (let i = 0; i < N; i++) { try { const q = B.generate(F.id, kind, mode); ok++; sigs.add(q.meta.sig); tpl.add(q.meta.template); } catch (e) { err++; } }
  rows.push(`${F.id.padEnd(16)} ${kind} ${mode.padEnd(9)} ok ${ok} err ${err} distinct ${sigs.size} templates ${[...tpl].length}`);
}
console.log(rows.join("\n"));
const top = Object.entries(fails).sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log("\nrejections (re-seeded):"); for (const [k, v] of top) console.log(v, k);
