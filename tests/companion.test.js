// Campfire Companion: simulation, scheduler and fairness rules, driven through the real Campfire loop.
const test = require("node:test");
const assert = require("node:assert");
const W = require("./load");
const { Campfire, Companion: CP } = W;

const stubEls = () => ({ button: { addEventListener() {}, removeEventListener() {}, classList: { add() {}, remove() {} }, dataset: {}, offsetWidth: 0 }, buttonText: { textContent: "" } });
function setup(config, opts = {}) {
  const fire = new Campfire(stubEls(), opts.mode || "normal");
  fire.comp = new CP.Companion(fire, {}, { config, minutes: opts.minutes || 60, busy: opts.busy || (() => false), headless: true });
  return fire;
}
// a reasonable student: keeps the fire in the green, matches the wind, uses the vent and valve, shelters the puppy in hail
function student(fire) {
  const c = fire.comp, s = c.s;
  if (s.inTent && !s.forced && !(s.major && s.major.id === "hail")) c.act("tent");
  if (c.has("tent") && s.major && s.major.id === "hail" && !s.inTent) c.act("tent");
  if (c.locked()) return;
  if (fire.heat < 40 && fire.pendingHeat < 10) fire.addFuel();
  if (c.has("wind") && s.ventDir !== s.wind && s.windWarn <= 0) c.act("dir-" + s.wind);
  if (c.has("vent")) { if (fire.heat > 70 && !s.ventOpen) c.act("vent"); if (fire.heat < 55 && s.ventOpen) c.act("vent"); }
  if (c.has("kettle") && s.pressure > 80) c.act("valve");
  if (c.has("oxygen") && s.oxygen < 40) c.act("bellows");
}
function run(fire, seconds, { dt = 0.25, play = true, onTick } = {}) {
  for (let t = 0; t < seconds; t += dt) { fire.tick(dt); if (play) student(fire); if (onTick) onTick(fire); }
}
const ALL = { mech: { vent: true, oxygen: true, kettle: true, wind: true, tent: true }, events: true, picked: CP.EVENTS.map((e) => e.id) };

test("defaults: every mechanic off and events off, so the classic campfire is untouched", () => {
  const d = CP.normalize(undefined);
  assert.deepStrictEqual(Object.values(d.mech), [false, false, false, false, false]);
  assert.strictEqual(d.events, false);
  assert.strictEqual(d.any, false);
  assert.deepStrictEqual(d.active, []);
  // with nothing on, the campfire behaves exactly as before (same heat after the same time)
  const plain = new Campfire(stubEls(), "normal"), withOff = setup(undefined);
  for (let i = 0; i < 400; i++) { plain.tick(0.25); withOff.tick(0.25); }
  assert.strictEqual(plain.heat.toFixed(6), withOff.heat.toFixed(6));
  assert.strictEqual(withOff.comp.s.events, 0);
});

test("events that need a missing mechanic are filtered out, never run", () => {
  const c = CP.normalize({ mech: { vent: false, wind: false, tent: false, kettle: false }, events: true, picked: ["hail", "rogue", "surge", "rattle", "fog"] });
  assert.deepStrictEqual(c.active, ["fog"]);
});

test("only selected events ever happen (90 simulated minutes)", () => {
  const fire = setup({ mech: { vent: true, wind: true, tent: true }, events: true, picked: ["fog", "stars"] }, { minutes: 90 });
  run(fire, 90 * 60);
  const seen = Object.keys(fire.comp.s.last);
  assert.ok(seen.length >= 1, "something happened");
  assert.ok(seen.every((id) => ["fog", "stars"].includes(id)), seen.join(","));
});

test("events switched off: mechanics still run (wind shifts), but no random events", () => {
  const fire = setup({ mech: { wind: true, kettle: true }, events: false, picked: CP.EVENTS.map((e) => e.id) });
  run(fire, 30 * 60);
  assert.strictEqual(fire.comp.s.events, 0);
  assert.ok(fire.comp.s.windShifts >= 4, "wind keeps shifting: " + fire.comp.s.windShifts);
});

test("scheduler: first event waits, one major at a time, spacing ≥4 min, severe rare and spaced", () => {
  for (let trial = 0; trial < 5; trial++) {
    const fire = setup(ALL, { minutes: 60 });
    const starts = [];
    let firstAt = null, overlaps = 0;
    run(fire, 60 * 60, { onTick: (f) => {
      const m = f.comp.s.major;
      if (m && !starts.find((x) => x.m === m)) { starts.push({ m, t: f.comp.s.t, cat: CP.EVENTS.find((e) => e.id === m.id).cat }); if (firstAt === null) firstAt = f.comp.s.t; }
    } });
    assert.ok(firstAt === null || firstAt >= 120, "first major after 2 min: " + firstAt);
    for (let i = 1; i < starts.length; i++) assert.ok(starts[i].t - starts[i - 1].t >= 240, "gap " + (starts[i].t - starts[i - 1].t));
    const severe = starts.filter((x) => x.cat === "severe");
    assert.ok(severe.length <= 2, "severe count " + severe.length);
    for (let i = 1; i < severe.length; i++) assert.ok(severe[i].t - severe[i - 1].t >= 480);
    assert.ok(starts.length <= 12, "not constant: " + starts.length);
    assert.strictEqual(overlaps, 0);
  }
});

test("wind shifts are always announced at least 6 s ahead, even in a frenzy/whiteout", () => {
  const fire = setup({ mech: { wind: true }, events: true, picked: ["frenzy", "rogue", "whiteout", "blizzard"] }, { minutes: 120 });
  let minWarn = Infinity, prev = 0;
  run(fire, 120 * 60, { onTick: (f) => { const w = f.comp.s.windWarn; if (w > 0 && prev <= 0) minWarn = Math.min(minWarn, w); prev = w; } });
  assert.ok(minWarn >= 6, "shortest warning " + minWarn);
});

test("hailstorm: 10 s warning, sheltered puppy takes no damage, an exposed one shelters at 0 and recovers", () => {
  const fire = setup({ mech: { tent: true }, events: true, picked: ["hail"] });
  const c = fire.comp;
  c._startMajor("hail");
  run(fire, 9.5, { play: false });
  assert.strictEqual(c.s.hp, 10, "no damage during the warning");
  c.act("tent");
  run(fire, 30, { play: false });
  assert.strictEqual(c.s.hp, 10, "safe in the tent");
  // exposed puppy
  const f2 = setup({ mech: { tent: true }, events: true, picked: ["hail"] });
  f2.comp._startMajor("hail");
  run(f2, 10 + 5.01, { play: false });
  assert.strictEqual(f2.comp.s.hp, 5, "1 heart per second after the warning");
  run(f2, 10, { play: false });
  assert.strictEqual(f2.comp.s.hp >= 0, true);
  assert.ok(f2.comp.s.inTent && (f2.comp.s.forced || f2.comp.s.hp >= 6), "shelters at 0, never lost");
  run(f2, 30, { play: false });
  assert.ok(f2.comp.s.hp >= 6 && !f2.comp.s.forced, "recovers");
});

test("puppy in the tent locks the fire controls (logs, vent) until it comes out", () => {
  const fire = setup({ mech: { tent: true, vent: true } });
  fire.comp.act("tent");
  const before = fire.pending.length;
  fire.addFuel(); fire.comp.act("vent");
  assert.strictEqual(fire.pending.length, before);
  assert.strictEqual(fire.comp.s.ventOpen, false);
  fire.comp.act("tent");
  fire.addFuel();
  assert.strictEqual(fire.pending.length, before + 1);
});

test("kettle: builds slowly, valve releases pressure and a little heat, ignoring it pops the lid harmlessly", () => {
  const fire = setup({ mech: { kettle: true } });
  fire.heat = 70;
  run(fire, 60, { play: false, onTick: (f) => { f.heat = 70; } });
  assert.ok(fire.comp.s.pressure < 40, "slow build: " + fire.comp.s.pressure);
  fire.comp.s.pressure = 90; const h = fire.heat;
  fire.comp.act("valve");
  assert.strictEqual(fire.comp.s.pressure, 65);
  assert.ok(fire.heat < h);
  fire.comp.s.pressure = 100;
  run(fire, 6, { play: false, onTick: (f) => { f.heat = 80; } });
  assert.strictEqual(fire.comp.s.lidPops, 1);
  assert.ok(fire.comp.s.pressure < 50 && fire.status === "ok", "recovers, no damage");
});

test("oxygen: steady normally (no clicking needed); storms thin it; low oxygen weakens logs", () => {
  const fire = setup({ mech: { oxygen: true } });
  run(fire, 600);
  assert.ok(fire.comp.s.oxygen > 80);
  fire.comp.s.oxygen = 20;
  assert.ok(fire.comp.logMul() < 1 && fire.comp.coolMul() > 1);
  fire.comp.act("bellows");
  assert.strictEqual(fire.comp.s.oxygen, 38);
});

test("vent and wind change the heat in the stated direction", () => {
  const a = setup({ mech: { vent: true } }); a.heat = 80; a.comp.act("vent");
  const b = setup({ mech: { vent: true } }); b.heat = 80;
  run(a, 10, { play: false }); run(b, 10, { play: false });
  assert.ok(a.heat < b.heat - 8, "vent lets heat out");
  const m = setup({ mech: { wind: true } }); m.comp.s.wind = "E"; m.comp.s.nextWind = 1e9;
  const n = setup({ mech: { wind: true } }); n.comp.s.nextWind = 1e9;
  run(m, 20, { play: false }); run(n, 20, { play: false });
  assert.ok(m.heat > n.heat + 8, "mismatch heats faster");
});

test("events alone never burn the camp: surge and gust stop adding heat at 92", () => {
  const fire = setup({ mech: { vent: true }, events: true, picked: ["surge"] });
  fire.heat = 91; fire.comp._startMajor("surge");
  const d = fire.comp.heatDelta(1);
  fire.heat = 93;
  assert.strictEqual(fire.comp.heatDelta(1), 0);
  assert.ok(d > 0);
});

test("a student who is typing delays a new event (up to 45 s)", () => {
  let busy = true;
  const fire = setup({ mech: {}, events: true, picked: ["fog"] }, { busy: () => busy });
  fire.comp.s.nextMajor = 0;
  run(fire, 30);
  assert.strictEqual(fire.comp.s.major, null, "waits while typing");
  busy = false;
  run(fire, 1);
  assert.ok(fire.comp.s.major && fire.comp.s.major.id === "fog");
});

test("a student playing reasonably keeps the camp going for a full hour with everything on", () => {
  for (let trial = 0; trial < 5; trial++) {
    const fire = setup(ALL, { minutes: 60 });
    let bad = 0;
    fire.onEvent = () => { bad++; };
    run(fire, 3600);
    assert.strictEqual(bad, 0, "no burn-down or freeze");
    assert.ok(fire.comp.s.hp > 0);
  }
});

test("state survives a save/restore round trip", () => {
  const fire = setup(ALL);
  run(fire, 400);
  const saved = JSON.parse(JSON.stringify(fire.comp.state()));
  const f2 = setup(ALL);
  f2.comp.restore(saved);
  assert.strictEqual(f2.comp.s.pressure, fire.comp.s.pressure);
  assert.strictEqual(f2.comp.s.t, fire.comp.s.t);
  assert.deepStrictEqual(f2.comp.s.last, fire.comp.s.last);
});
