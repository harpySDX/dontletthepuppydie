/*
 * Group tests without a server.
 *
 * A GROUP CODE (e.g. 7KQ2-M9XD-4TPA) packs: level, time limit, a random seed and an
 * optional shared start time. Everyone who enters the same code builds the exact same test
 * (same questions, same order, same choice order) and — if a start time is set —
 * runs on the same clock.
 *
 * A RESULT CODE carries one person's marks per question so friends can paste
 * them into a shared scoreboard.
 */
(function (root) {
  "use strict";

  const ALPHA = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32 (no I, L, O, U)
  const EPOCH = Date.UTC(2026, 0, 1);
  // index 2 was Tim's Test (retired); old codes with it still decode, so the app can explain they're outdated
  const LEVELS = ["normal", "challenge", "classmate", "nightmare"];

  const mask = (seed) => Math.imul(seed, 2654435761) >>> 5 & 0x7ffffff;

  function checksum(n) { // sum of 5-bit groups, mod 32
    let s = 0n;
    for (let i = 0; i < 11; i++) { s += n & 31n; n >>= 5n; }
    return s % 32n;
  }

  // minutes: 5–120 in steps of 5
  function encodeGroup({ level, seed, start, minutes = 60 }) {
    const startMin = start ? Math.max(1, Math.round((start - EPOCH) / 60000)) : 0;
    seed &= 0x7ffff;
    let n = 2n;                                              // version (2 bits)
    n = (n << 2n) | BigInt(LEVELS.indexOf(level));           // level (2)
    n = (n << 5n) | BigInt(Math.max(1, Math.min(24, Math.round(minutes / 5))));  // time limit ÷ 5 (5)
    n = (n << 19n) | BigInt(seed);                           // seed (19)
    n = (n << 27n) | BigInt((startMin ^ mask(seed)) & 0x7ffffff); // start minute (27), scrambled so codes look random
    n = (n << 5n) | checksum(n);                             // checksum (5) → 60 bits
    let out = "";
    for (let i = 0; i < 12; i++) { out = ALPHA[Number(n & 31n)] + out; n >>= 5n; }
    return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8)}`;
  }

  function normalize(code) {
    return String(code || "").toUpperCase().replace(/[\s-]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0").replace(/U/g, "V");
  }

  function decodeGroup(code) {
    const c = normalize(code);
    if (c.length !== 12 || [...c].some((ch) => !ALPHA.includes(ch))) return null;
    let n = 0n;
    for (const ch of c) n = (n << 5n) | BigInt(ALPHA.indexOf(ch));
    const check = n & 31n;
    const body = n >> 5n;
    if (checksum(body) !== check) return null;
    const seed = Number((body >> 27n) & 0x7ffffn);
    const startMin = (Number(body & 0x7ffffffn) ^ mask(seed)) & 0x7ffffff;
    const dur = Number((body >> 46n) & 31n);
    const lvl = Number((body >> 51n) & 3n);
    const ver = Number(body >> 53n);
    if (ver !== 2 || !LEVELS[lvl] || dur < 1 || dur > 24) return null;
    return {
      code: `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`,
      level: LEVELS[lvl], seed, minutes: dur * 5,
      start: startMin ? EPOCH + startMin * 60000 : 0,
    };
  }

  // Small, fast seeded random generator (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ───── result codes ─────
  const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
  const cleanName = (n) => String(n || "").replace(/[|\n\r]/g, " ").trim().slice(0, 18) || "Friend";

  function encodeResult({ group, name, earned, time }) {
    return "CP-" + b64([normalize(group), cleanName(name), earned.map((e) => Math.max(0, Math.min(9, Math.round(e)))).join(""), Math.round(time)].join("|"));
  }
  function decodeResult(code) {
    try {
      const s = String(code).trim();
      if (!s.startsWith("CP-")) return null;
      const [g, name, marks, time] = unb64(s.slice(3)).split("|");
      if (!g || !/^\d+$/.test(marks) || !/^\d+$/.test(time)) return null;
      return { group: g, name: cleanName(name), earned: [...marks].map(Number), time: Number(time) };
    } catch { return null; }
  }

  // ───── study rooms ─────
  // A ROOM CODE (16 chars, e.g. R7KQ-2M9X-D4TP-AB3C) packs everything a shared practice set needs,
  // so no server is involved: which concepts (a 16-bit mask over the concept list), how many questions,
  // pacing (self-paced, or synced to a shared start time with N seconds per question), whether hints
  // and the tutor are allowed, and a seed. Everyone with the code builds the identical set.
  const COUNTS = [5, 8, 10, 12], PACES = [60, 90, 120, 180];
  function roomChecksum(n) { let s = 0n; for (let i = 0; i < 15; i++) { s += (n & 31n) * BigInt(i + 1); n >>= 5n; } return s % 32n; }
  // version 3 = a room over the original 16 concepts; version 2 = a room over the Quadratic Functions concepts
  function encodeRoom({ concepts, count = 8, synced = false, pace = 90, hints = true, seed, start = 0, subject = "pc11" }) {
    const startMin = synced && start ? Math.max(1, Math.round((start - EPOCH) / 60000)) : 0;
    seed &= 0x7ffff;
    let n = subject === "quad" ? 2n : 3n;                           // version (2 bits): 3 = original concepts, 2 = quadratics
    n = (n << 1n) | (hints ? 1n : 0n);                              // hints (1)
    n = (n << 1n) | (synced ? 1n : 0n);                             // synced (1)
    n = (n << 2n) | BigInt(Math.max(0, PACES.indexOf(pace)));       // seconds per question (2)
    n = (n << 2n) | BigInt(Math.max(0, COUNTS.indexOf(count)));     // number of questions (2)
    n = (n << 16n) | BigInt(concepts & 0xffff);                         // concepts (16)
    n = (n << 19n) | BigInt(seed);                                  // seed (19)
    n = (n << 27n) | BigInt((startMin ^ mask(seed)) & 0x7ffffff);   // start minute (27)
    n = (n << 5n) | roomChecksum(n);                                // → 75 bits
    let out = "";
    for (let i = 0; i < 15; i++) { out = ALPHA[Number(n & 31n)] + out; n >>= 5n; }
    out = "R" + out;
    return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12)}`;
  }
  function decodeRoom(code) {
    const c = normalize(code);
    if (c.length !== 16 || c[0] !== "R" || [...c.slice(1)].some((ch) => !ALPHA.includes(ch))) return null;
    let n = 0n;
    for (const ch of c.slice(1)) n = (n << 5n) | BigInt(ALPHA.indexOf(ch));
    const check = n & 31n, body = n >> 5n;
    if (roomChecksum(body) !== check) return null;
    const seed = Number((body >> 27n) & 0x7ffffn);
    const startMin = (Number(body & 0x7ffffffn) ^ mask(seed)) & 0x7ffffff;
    const conceptMask = Number((body >> 46n) & 0xffffn);
    const count = COUNTS[Number((body >> 62n) & 3n)];
    const pace = PACES[Number((body >> 64n) & 3n)];
    const synced = ((body >> 66n) & 1n) === 1n;
    const hints = ((body >> 67n) & 1n) === 1n;
    const ver = Number(body >> 68n);
    if ((ver !== 3 && ver !== 2) || !conceptMask) return null;
    return { code: `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}-${c.slice(12)}`, mask: conceptMask, count, pace, synced, hints, seed, start: synced && startMin ? EPOCH + startMin * 60000 : 0, subject: ver === 2 ? "quad" : "pc11" };
  }
  // Room result: name + one character per question (1 right, 0 wrong, - unanswered). Nothing else.
  function encodeRoomResult({ room, name, marks }) {
    return "CR-" + b64([normalize(room), cleanName(name), marks.map((m) => (m === true ? "1" : m === false ? "0" : "-")).join("")].join("|"));
  }
  function decodeRoomResult(code) {
    try {
      const s = String(code).trim();
      if (!s.startsWith("CR-")) return null;
      const [room, name, marks] = unb64(s.slice(3)).split("|");
      if (!room || !/^[01-]+$/.test(marks || "")) return null;
      return { room, name: cleanName(name), marks: [...marks].map((m) => (m === "1" ? true : m === "0" ? false : null)) };
    } catch { return null; }
  }

  const api = { encodeGroup, decodeGroup, normalize, rng, encodeResult, decodeResult, LEVELS, encodeRoom, decodeRoom, encodeRoomResult, decodeRoomResult, ROOM_COUNTS: COUNTS, ROOM_PACES: PACES };
  root.Group = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
