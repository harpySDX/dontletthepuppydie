// Loads the browser scripts into Node for testing (they attach to `window`).
global.window = global;
const path = require("path");
const base = path.join(__dirname, "..", "js");
for (const f of ["mathcheck", "bank-mc", "bank-nr", "bank-wr", "bank-classmate", "bank-challenge", "group", "concepts", "learning", "campfire", "companion"]) {
  try { require(path.join(base, f + ".js")); } catch (e) { if (!/Cannot find module/.test(e.message)) throw e; }
}
module.exports = global;
