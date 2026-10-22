// Loads the browser scripts into Node for testing (they attach to `window`).
global.window = global;
const path = require("path");
const base = path.join(__dirname, "..", "js");
for (const f of ["mathcheck", "bank-mc", "bank-nr", "bank-wr", "bank-classmate", "bank-challenge", "group", "concepts", "learning", "campfire", "companion", "quad-engine", "graph", "quad-bank", "quad-content", "course-content", "engine/answers", "engine/bank", "curriculum", "gen/unit-ab", "gen/unit-cd", "gen/unit-e", "gen/unit-f", "gen/unit-f-transform", "gen/unit-g", "gen/unit-h", "gen/unit-i", "physics/model", "physics/check", "physics/gen-kit", "physics/gen-projectile", "physics/gen-reasoning"]) {
  try { require(path.join(base, f + ".js")); } catch (e) { if (!/Cannot find module/.test(e.message)) throw e; }
}
module.exports = global;
