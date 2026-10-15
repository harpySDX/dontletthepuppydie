/*
 * CAMPFIRE COMPANION — optional extras for the campfire minigame (learning first, game second).
 *
 * Layered on top of the existing heat/log simulation in js/campfire.js. Everything here is OFF unless the
 * student switches it on in Create test:
 *   Mechanics: vent · oxygen & bellows · kettle · wind & compass · puppy & tent
 *   Events:    a separate "Random events" switch, then individual events by category
 *
 * Fairness rules (kept deliberately gentle so the test stays the focus):
 *   • one disruptive event at a time; calm events (stars, fireflies) can overlap
 *   • the first event waits 2+ min; majors are 4–7 min apart; severe ones ≥ 8 min apart and capped per session
 *   • every event is announced, wind shifts are telegraphed with a grace period (never under 6 s)
 *   • events never push heat past 92 on their own; severe events only start when the fire is in a safe range
 *   • if the student is typing an answer, a new event waits (up to 45 s) until they pause
 *   • the puppy can't be lost: at 0 HP it shelters in the tent and recovers
 * The simulation only runs inside the existing campfire loop, so pausing, game over, turning the campfire
 * off or leaving the test stops it — there are no separate timers to leak.
 */
(function () {
  "use strict";

  // ───────── catalog (also drives the Create test UI) ─────────
  const MECHANICS = [
    { id: "vent", icon: "♨", name: "Vent", desc: "Open the vent to let extra heat out; close it once the fire is back in the green." },
    { id: "oxygen", icon: "◌", name: "Oxygen & bellows", desc: "Usually steady. Storms thin the air; low oxygen makes logs weaker. Pump the bellows." },
    { id: "kettle", icon: "☕", name: "Kettle", desc: "Builds pressure as the fire heats. The valve lets steam (and a little heat) out. Ignore it and the lid pops. Harmless!" },
    { id: "wind", icon: "🧭", name: "Wind & compass", desc: "Point the ventilation the way the wind blows. A mismatch heats the fire faster. Shifts are announced first." },
    { id: "tent", icon: "⛺", name: "Puppy & tent", desc: "Your puppy has 10 hearts and can rest in the tent to recover, but you can't tend the fire while it's inside." },
  ];
  const EVENTS = [
    { id: "clear", cat: "peaceful", icon: "☾", name: "Clear skies", desc: "The wind settles and the fire cools more slowly.", tag: "Fire", def: true },
    { id: "stars", cat: "peaceful", icon: "✦", name: "Shooting stars", desc: "A rare streak across the sky. Your puppy looks up.", tag: "Cosmetic", def: true },
    { id: "fireflies", cat: "peaceful", icon: "✧", name: "Firefly evening", desc: "Fireflies drift by. With the tent on, your puppy perks up (+1 heart).", tag: "Cosmetic", def: true },
    { id: "rain", cat: "moderate", icon: "☂", name: "Heavy rain", desc: "The fire cools faster. Add a log if it gets chilly.", tag: "Action", def: true },
    { id: "rogue", cat: "moderate", icon: "↻", name: "Rogue wind", desc: "The wind changes twice in quick succession, then settles.", tag: "Action", needs: "wind", def: true },
    { id: "frenzy", cat: "moderate", icon: "≋", name: "Wind frenzy", desc: "Shifts come more often, with shorter (but fair) warnings.", tag: "Action", needs: "wind", def: false },
    { id: "surge", cat: "moderate", icon: "▲", name: "Heat surge", desc: "The fire gets hotter on its own. Open the vent, then close it.", tag: "Action", needs: "vent", def: true },
    { id: "rattle", cat: "moderate", icon: "☕", name: "Kettle rattle", desc: "Pressure jumps toward the top. Use the valve before the lid pops.", tag: "Action", needs: "kettle", def: true },
    { id: "gust", cat: "moderate", icon: "✺", name: "Ember gust", desc: "A short flare of heat. Venting helps.", tag: "Fire", def: true },
    { id: "rainbreak", cat: "moderate", icon: "☼", name: "Rain break", desc: "Weather calms for a bit: steady air, slower cooling. A breather.", tag: "Fire", def: true },
    { id: "fog", cat: "moderate", icon: "≡", name: "Thick fog", desc: "The campsite goes misty. Meters stay readable.", tag: "Cosmetic", def: true },
    { id: "curious", cat: "moderate", icon: "?", name: "Puppy curiosity", desc: "Your puppy wanders off to sniff something. Call it back or let it explore.", tag: "Cosmetic", def: true },
    { id: "blizzard", cat: "severe", icon: "❄", name: "Blizzard", desc: "Faster cooling, thinner air, and the wind may turn.", tag: "Action", def: true },
    { id: "whiteout", cat: "severe", icon: "❅", name: "Whiteout", desc: "A rarer, stronger blizzard: low visibility, shaking compass, two wind turns.", tag: "Action", def: false },
    { id: "hail", cat: "severe", icon: "◆", name: "Hailstorm", desc: "Get the puppy into the tent. After a warning, it loses 1 heart per second outside.", tag: "Action", needs: "tent", def: false },
  ];
  const CATS = [["peaceful", "Peaceful"], ["moderate", "Moderate"], ["severe", "Severe (rare)"]];
  const BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
  const DIRS = ["N", "E", "S", "W"];
  const DIR_NAME = { N: "north", E: "east", S: "south", W: "west" };

  function defaults() {
    return { mech: { vent: false, oxygen: false, kettle: false, wind: false, tent: false }, events: false, picked: EVENTS.filter((e) => e.def).map((e) => e.id) };
  }
  // Remove impossible combinations (an event that needs a mechanic that's off can't run).
  function normalize(cfg) {
    const d = defaults();
    const c = { mech: { ...d.mech, ...((cfg && cfg.mech) || {}) }, events: !!(cfg && cfg.events), picked: Array.isArray(cfg && cfg.picked) ? cfg.picked.filter((id) => BY_ID[id]) : d.picked };
    c.active = c.events ? c.picked.filter((id) => !BY_ID[id].needs || c.mech[BY_ID[id].needs]) : [];
    c.any = Object.values(c.mech).some(Boolean) || c.active.length > 0;
    return c;
  }
  // The recommended preset when someone turns the minigame on: every mechanic and every event.
  function full() {
    return { mech: { vent: true, oxygen: true, kettle: true, wind: true, tent: true }, events: true, picked: EVENTS.map((e) => e.id) };
  }
  function isFull(cfg) {
    const c = normalize(cfg);
    return MECHANICS.every((m) => c.mech[m.id]) && c.events && c.active.length === EVENTS.length;
  }
  function summary(cfg) {
    if (isFull(cfg)) return "Full minigame";
    const c = normalize(cfg);
    const m = MECHANICS.filter((x) => c.mech[x.id]).length;
    return !c.any ? "" : [m ? `${m} extra mechanic${m === 1 ? "" : "s"}` : "", c.active.length ? `${c.active.length} event${c.active.length === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ");
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ───────── the companion ─────────
  class Companion {
    // fire: the Campfire instance; els: { slot, panel }; opts: { config, minutes, busy() }
    constructor(fire, els, opts = {}) {
      this.fire = fire;
      this.els = els;
      this.cfg = normalize(opts.config);
      this.minutes = opts.minutes || 60;
      this.busy = opts.busy || (() => false);
      this.s = {
        t: 0, oxygen: 85, pressure: 25, wind: "N", ventDir: "N", ventOpen: false, hp: 10, inTent: false, forced: false,
        wandering: 0, asking: 0, lidT: 0, lidPops: 0, events: 0, hailHits: 0, tentSeconds: 0, windShifts: 0,
        nextMajor: rand(120, 200), nextCalm: rand(150, 260), nextWind: rand(150, 240), windWarn: 0, windTo: null,
        last: {}, severe: 0, lastSevere: -1e9, major: null, calm: null, waited: 0, behaviorT: rand(25, 45), behavior: "",
        notice: "", noticeLevel: "", noticeT: 0,
      };
      if (!opts.headless) this._build();
    }
    get on() { return this.cfg.any; }
    has(m) { return !!this.cfg.mech[m]; }

    // restore/save (lives in session.buddy.comp)
    state() { const { notice, noticeLevel, noticeT, ...rest } = this.s; return JSON.parse(JSON.stringify(rest)); }
    restore(st) { if (st) Object.assign(this.s, st, { notice: "", noticeT: 0 }); this.render(true); }

    // ───── effects the campfire asks for ─────
    locked() { return this.has("tent") && this.s.inTent; }
    coolMul() {
      let m = 1;
      const ev = this.s.major && this.s.major.phase === "on" ? this.s.major.id : null;
      if (ev === "rain") m *= 1.8;
      if (ev === "blizzard") m *= 1.7;
      if (ev === "whiteout") m *= 2.1;
      if (ev === "rainbreak") m *= 0.8;
      if (this.s.calm && this.s.calm.id === "clear") m *= 0.7;
      if (this.has("oxygen")) m *= this.s.oxygen < 15 ? 1.5 : this.s.oxygen < 35 ? 1.25 : 1;
      return m;
    }
    logMul() { return this.has("oxygen") ? (this.s.oxygen < 15 ? 0.35 : this.s.oxygen < 35 ? 0.6 : 1) : 1; }
    // extra heat per second (positive = hotter). Event-driven gains stop at 92 so events alone never burn the camp.
    heatDelta(dt) {
      const s = this.s, h = this.fire.heat;
      let d = 0;
      if (this.has("vent") && s.ventOpen && h > 2) d -= 1.1;
      if (this.has("wind") && s.ventDir !== s.wind) d += 0.6;
      const ev = s.major && s.major.phase === "on" ? s.major : null;
      if (ev && ev.id === "surge" && h < 92) d += 0.8;
      if (ev && ev.id === "gust" && ev.left > ev.dur - 3 && h < 92) d += 4;
      return d * dt;
    }

    // ───── controls ─────
    act(what) {
      const s = this.s, f = this.fire;
      if (f.status !== "ok" && what !== "tent") return;
      if (this.locked() && what !== "tent") { this.notify("Your puppy's resting in the tent. Controls are back when it comes out.", "warn"); return; }
      if (what === "vent" && this.has("vent")) { s.ventOpen = !s.ventOpen; this.notify(s.ventOpen ? "Vent open: heat is escaping." : "Vent closed.", ""); }
      if (what === "bellows" && this.has("oxygen")) { s.oxygen = clamp(s.oxygen + 18, 0, 100); f.react("hop"); }
      if (what === "valve" && this.has("kettle")) { s.pressure = clamp(s.pressure - 25, 0, 100); f.heat = Math.max(0, f.heat - 3); s.lidT = 0; this._puff(); }
      if (what === "tent" && this.has("tent")) {
        if (s.inTent && s.forced) { this.notify("Your puppy is still recovering. It'll come out once it has 6 hearts.", "warn"); return; }
        s.inTent = !s.inTent; s.wandering = 0;
        this.notify(s.inTent ? "Your puppy curls up in the tent. Fire controls wait until it's back out." : "Your puppy trots back out to the fire.", "");
      }
      if (what === "water" && s.asking) { s.asking = 0; s.hp = Math.min(10, s.hp + 2); s.pressure = clamp(s.pressure - 10, 0, 100); f.react("happy"); this.notify("Your puppy laps up the warm water. +2 hearts.", "ok"); }
      if (what === "callback" && s.wandering) { s.wandering = 0; f.react("hop"); this.notify("Your puppy comes bounding back.", ""); if (s.major && s.major.id === "curious") s.major.left = 0; }
      if (what.startsWith("dir-") && this.has("wind")) { s.ventDir = what.slice(4); }
      this.render(true);
    }

    notify(text, level, secs = 6) { this.s.notice = text; this.s.noticeLevel = level || ""; this.s.noticeT = secs; this._paintNotice(); }

    // ───── simulation (called from the campfire loop, only while the fire is running) ─────
    tick(dt) {
      if (!this.on) return;
      const s = this.s, f = this.fire;
      s.t += dt;
      if (s.noticeT > 0) { s.noticeT -= dt; if (s.noticeT <= 0) { s.notice = ""; this._paintNotice(); } }
      const ev = s.major && s.major.phase === "on" ? s.major.id : null;

      if (this.has("oxygen")) {
        const drain = ev === "rain" ? 0.5 : ev === "blizzard" ? 0.9 : ev === "whiteout" ? 1.3 : 0;
        s.oxygen = drain ? clamp(s.oxygen - drain * dt, 0, 100) : s.oxygen + clamp(85 - s.oxygen, -0.5, 0.5) * dt * (ev === "rainbreak" ? 3 : 1);
      }
      if (this.has("kettle")) {
        const h = f.heat;
        const boost = ev === "rattle" ? 2.2 : 1;
        s.pressure = clamp(s.pressure + (h > 35 ? (h - 35) * 0.006 * boost : -0.15) * dt, 0, 100);
        if (s.pressure >= 100) { s.lidT += dt; if (s.lidT > 4) this._lidPop(); } else s.lidT = 0;
      }
      if (this.has("tent")) {
        if (s.inTent) {
          s.tentSeconds += dt;
          s.hp = Math.min(10, s.hp + 0.5 * dt);
          if (s.forced && s.hp >= 6) { s.forced = false; this.notify("Your puppy feels better. You can bring it out when you're ready.", "ok"); }
        }
        // gentle idle behaviours (mostly cosmetic)
        s.behaviorT -= dt;
        if (s.behaviorT <= 0 && !s.inTent && !s.wandering) {
          const opts = ["nap", "look", "sky"];
          if (this.has("kettle") && s.pressure >= 30 && s.pressure < 85 && s.hp < 10) opts.push("water", "water");
          s.behavior = opts[Math.floor(Math.random() * opts.length)];
          if (s.behavior === "water") { s.asking = 30; this.notify("Your puppy is eyeing the kettle. Warm water? (optional)", ""); }
          s.behaviorT = rand(40, 75);
          this._behaviorShown = 6;
        }
        if (this._behaviorShown > 0) { this._behaviorShown -= dt; if (this._behaviorShown <= 0) s.behavior = ""; }
        if (s.asking > 0) { s.asking -= dt; if (s.asking <= 0) s.asking = 0; }
      }
      if (s.wandering > 0) { s.wandering -= dt; if (s.wandering <= 0) { s.wandering = 0; this.notify("Your puppy wanders back on its own.", ""); } }

      if (this.has("wind")) this._windTick(dt);
      this._eventTick(dt);
    }

    _windTick(dt) {
      const s = this.s;
      if (s.windWarn > 0) {
        s.windWarn -= dt;
        if (s.windWarn <= 0) {
          s.wind = s.windTo; s.windTo = null; s.windShifts++;
          this.notify(`The wind is now from the ${DIR_NAME[s.wind]}.${s.ventDir !== s.wind ? " Turn the ventilation to match." : ""}`, s.ventDir !== s.wind ? "warn" : "");
          const ev = s.major && s.major.phase === "on" ? s.major : null;
          if (ev && ev.windLeft > 0) { ev.windLeft--; if (ev.windLeft > 0) this._shiftWind(ev.id === "rogue" ? 6 : 7); }
        }
        return;
      }
      if (s.calm && s.calm.id === "clear") return; // settled
      s.nextWind -= dt;
      const ev = s.major && s.major.phase === "on" ? s.major.id : null;
      if (s.nextWind <= 0) {
        const frenzy = ev === "frenzy" || ev === "whiteout";
        this._shiftWind(frenzy ? 7 : 12);
        s.nextWind = frenzy ? rand(22, 30) : rand(180, 300);
      }
    }
    _shiftWind(warn) {
      const s = this.s;
      const i = DIRS.indexOf(s.wind);
      s.windTo = DIRS[(i + (Math.random() < 0.5 ? 1 : 3)) % 4]; // a quarter turn, never a full flip
      s.windWarn = Math.max(6, warn);
      this.notify(`Wind shifting… toward the ${DIR_NAME[s.windTo]} in a few seconds.`, "warn", s.windWarn);
    }

    _eventTick(dt) {
      const s = this.s, f = this.fire;
      const pool = this.cfg.active;
      // calm events can overlap with anything
      if (s.calm) { s.calm.left -= dt; if (s.calm.left <= 0) s.calm = null; }
      else if (pool.some((id) => BY_ID[id].cat === "peaceful") && (s.nextCalm -= dt) <= 0) {
        const calm = pool.filter((id) => BY_ID[id].cat === "peaceful" && (s.t - (s.last[id] || -1e9) > 420) && !(id === "clear" && s.major));
        if (calm.length) {
          const id = calm[Math.floor(Math.random() * calm.length)];
          s.calm = { id, left: id === "stars" ? 6 : id === "fireflies" ? 40 : 75 };
          s.last[id] = s.t; s.events++;
          if (id === "stars") { s.behavior = "sky"; this._behaviorShown = 5; }
          if (id === "fireflies" && this.has("tent")) s.hp = Math.min(10, s.hp + 1);
          this.notify({ clear: "☾ Clear skies. The wind settles and the fire holds its heat.", stars: "✦ A shooting star! Your puppy looks up.", fireflies: "✧ Fireflies drift around the camp." }[id], "ok");
        }
        s.nextCalm = rand(300, 480);
      }
      // one disruptive event at a time
      const m = s.major;
      if (m) {
        if (m.phase === "warn") {
          m.warn -= dt;
          if (m.id === "hail" && m.warn <= 0) { m.phase = "on"; this.notify("◆ Hail! Outside, your puppy loses a heart each second.", "danger", 5); }
          else if (m.warn <= 0) m.phase = "on";
          return;
        }
        m.left -= dt;
        if (m.id === "hail" && this.has("tent") && !s.inTent) {
          m.acc = (m.acc || 0) + dt;
          while (m.acc >= 1) { m.acc -= 1; s.hp = Math.max(0, s.hp - 1); s.hailHits++; }
          if (s.hp <= 0) { s.inTent = true; s.forced = true; s.wandering = 0; this.notify("Your puppy dashed into the tent to shelter. It'll rest until it recovers.", "warn"); }
        }
        if (m.left <= 0) { s.major = null; s.nextMajor = s.t + rand(240, 420); this._endNotice(m.id); }
        return;
      }
      if (s.t < s.nextMajor) return;
      const majors = pool.filter((id) => BY_ID[id].cat !== "peaceful");
      if (!majors.length) return;
      // the student is mid-answer: wait (up to 45 s)
      if (this.busy() && s.waited < 45) { s.waited += dt; return; }
      s.waited = 0;
      const h = f.heat;
      const maxSevere = 1 + Math.floor(this.minutes / 40);
      const okNow = (id) => {
        const e = BY_ID[id];
        if (s.t - (s.last[id] || -1e9) < 600) return false; // cooldown
        if (e.cat === "severe" && (s.severe >= maxSevere || s.t - s.lastSevere < 480 || h < 35 || h > 75)) return false;
        if ((id === "surge" || id === "gust") && h > 70) return false;
        if ((id === "rain" || id === "blizzard" || id === "whiteout") && h < 30) return false;
        if (id === "curious" && s.inTent) return false;
        return true;
      };
      const choices = majors.filter(okNow);
      if (!choices.length) { s.nextMajor = s.t + 30; return; }
      const weight = (id) => (BY_ID[id].cat === "severe" ? (id === "whiteout" ? 0.25 : 0.5) : 2);
      let r = Math.random() * choices.reduce((a, id) => a + weight(id), 0), pick = choices[0];
      for (const id of choices) { r -= weight(id); if (r <= 0) { pick = id; break; } }
      this._startMajor(pick);
    }

    _startMajor(id) {
      const s = this.s;
      const dur = { rain: 60, rogue: 30, frenzy: 90, surge: 40, rattle: 30, gust: 8, rainbreak: 45, fog: 60, curious: 20, blizzard: 70, whiteout: 55, hail: 30 }[id];
      s.major = { id, dur, left: dur, phase: id === "hail" ? "warn" : "on", warn: id === "hail" ? 10 : 0 };
      s.last[id] = s.t; s.events++;
      if (BY_ID[id].cat === "severe") { s.severe++; s.lastSevere = s.t; }
      const text = {
        rain: "☂ Heavy rain. The fire will cool faster for a while.",
        rogue: "↻ Rogue wind incoming. It'll turn twice.",
        frenzy: "≋ Wind frenzy: shifts come faster for a minute or so.",
        surge: "▲ Heat surge. The fire's heating up on its own. Try the vent.",
        rattle: "☕ The kettle's starting to rattle…",
        gust: "✺ Ember gust! A quick flare of heat.",
        rainbreak: "☼ Rain break: steady air and a calmer fire for a bit.",
        fog: "≡ Thick fog rolls in.",
        curious: "? Your puppy is off to sniff something interesting.",
        blizzard: "❄ Blizzard! Faster cooling and thinner air.",
        whiteout: "❅ Whiteout! Keep an eye on the fire and the compass.",
        hail: "◆ Hail in 10 seconds. Get your puppy into the tent!",
      }[id];
      this.notify(text, BY_ID[id].cat === "severe" ? "danger" : BY_ID[id].tag === "Action" ? "warn" : "", id === "hail" ? 10 : 7);
      if (id === "rattle") s.pressure = Math.max(s.pressure, 72);
      if (id === "curious") s.wandering = 20;
      if (this.has("wind")) {
        if (id === "rogue") { s.major.windLeft = 2; this._shiftWind(8); }
        if (id === "blizzard") { s.major.windLeft = 1; this._shiftWind(10); }
        if (id === "whiteout") { s.major.windLeft = 2; this._shiftWind(9); }
        if (id === "frenzy") s.nextWind = Math.min(s.nextWind, 12);
      }
    }
    _endNotice(id) {
      const t = { rain: "The rain eases off.", frenzy: "The wind calms down.", surge: "The surge has passed. Close the vent if it's open.", blizzard: "The blizzard blows over.", whiteout: "The whiteout clears.", hail: "The hail stops. Safe to come out.", fog: "The fog lifts.", rainbreak: "The break is over." }[id];
      if (t) this.notify(t, "");
    }
    _lidPop() {
      const s = this.s;
      s.pressure = 35; s.lidT = 0; s.lidPops++;
      const sc = this.els.scene;
      if (sc) { sc.classList.remove("kettle-pop"); void sc.getBoundingClientRect(); sc.classList.add("kettle-pop"); clearTimeout(this._popT); this._popT = setTimeout(() => sc.classList.remove("kettle-pop"), 1600); }
      this.notify("Pop! The kettle lid flew off in a puff of steam. Harmless; it's back on and warming again.", "");
    }
    _puff() {
      const sc = this.els.scene;
      if (!sc) return;
      sc.classList.remove("kettle-puff"); void sc.getBoundingClientRect(); sc.classList.add("kettle-puff");
      clearTimeout(this._puffT); this._puffT = setTimeout(() => sc.classList.remove("kettle-puff"), 1200);
    }

    // ───── UI ─────
    _build() {
      const { panel, slot } = this.els;
      this.root = panel.querySelector("#companion");
      if (!this.on) { if (this.root) this.root.hidden = true; return; }
      this.root.hidden = false;
      this.root.innerHTML = `
        <button type="button" class="comp-toggle" aria-expanded="false" aria-controls="comp-body"><span>Camp controls</span><i class="comp-alert" hidden></i></button>
        <div class="comp-body" id="comp-body">
          ${this.has("wind") ? `<div class="comp-row comp-wind">
            <svg class="compass" viewBox="-30 -30 60 60" aria-hidden="true"><circle r="27" class="cmp-ring"/><text y="-17" class="cmp-l">N</text><text x="19" y="3" class="cmp-l">E</text><text y="23" class="cmp-l">S</text><text x="-19" y="3" class="cmp-l">W</text><g class="cmp-needle"><path d="M0,-15 L4,4 L0,1 L-4,4 Z"/></g></svg>
            <div class="comp-wind-r"><span class="comp-k">Wind <b class="cw-dir"></b></span>
              <div class="dir-seg" role="radiogroup" aria-label="Ventilation direction">${DIRS.map((d) => `<button type="button" role="radio" data-comp="dir-${d}" aria-label="Ventilate ${DIR_NAME[d]}">${d}</button>`).join("")}</div>
              <span class="cw-match faint"></span></div></div>` : ""}
          <div class="comp-meters">
            ${this.has("oxygen") ? meter("oxygen", "◌", "Oxygen") : ""}
            ${this.has("kettle") ? meter("pressure", "☕", "Kettle") : ""}
            ${this.has("tent") ? `<div class="comp-row comp-hp"><span class="comp-k">Puppy</span><span class="hearts" role="meter" aria-label="Puppy hearts" aria-valuemin="0" aria-valuemax="10"></span><span class="cm-state faint"></span></div>` : ""}
          </div>
          <div class="comp-ctrls">
            ${this.has("vent") ? `<button type="button" class="cbtn" data-comp="vent" aria-pressed="false" title="Open or close the vent (V)">♨ <span>Vent</span></button>` : ""}
            ${this.has("oxygen") ? `<button type="button" class="cbtn" data-comp="bellows" title="Pump the bellows (O)">◌ <span>Bellows</span></button>` : ""}
            ${this.has("kettle") ? `<button type="button" class="cbtn" data-comp="valve" title="Release kettle pressure (K)">☁ <span>Valve</span></button>` : ""}
            ${this.has("tent") ? `<button type="button" class="cbtn" data-comp="tent" aria-pressed="false" title="Send the puppy into the tent or call it out (T)">⛺ <span>Tent</span></button>` : ""}
            <button type="button" class="cbtn ctx" data-comp="water" hidden>💧 <span>Give water</span></button>
            <button type="button" class="cbtn ctx" data-comp="callback" hidden>↩ <span>Call back</span></button>
          </div>
        </div>`;
      function meter(key, icon, label) {
        return `<div class="comp-row comp-meter" data-m="${key}"><span class="comp-k">${icon} ${label}</span><span class="cm-bar" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100"><i></i></span><span class="cm-state"></span></div>`;
      }
      this._onClick = (e) => {
        const tg = e.target.closest(".comp-toggle");
        if (tg) { const open = !this.root.classList.contains("open"); this.root.classList.toggle("open", open); tg.setAttribute("aria-expanded", String(open)); return; }
        const b = e.target.closest("[data-comp]");
        if (b) this.act(b.dataset.comp);
      };
      this.root.addEventListener("click", this._onClick);
      // the notice pill sits on top of the scene (non-blocking, pointer-events: none)
      this.noticeEl = document.createElement("div");
      this.noticeEl.className = "comp-notice";
      this.noticeEl.setAttribute("role", "status");
      this.noticeEl.setAttribute("aria-live", "polite");
      slot.appendChild(this.noticeEl);
      this.els.scene = slot.querySelector(".scene");
      this.els.scene.classList.add("has-companion");
      this.render(true);
    }

    _paintNotice() {
      if (!this.noticeEl) return;
      const s = this.s;
      if (this.noticeEl.textContent !== s.notice) this.noticeEl.textContent = s.notice;
      this.noticeEl.dataset.level = s.noticeLevel;
      this.noticeEl.classList.toggle("show", !!s.notice);
    }

    render(force) {
      if (!this.on || !this.root) return;
      const now = performance.now();
      if (!force && now - (this._painted || 0) < 200) return; // ~5 updates a second is plenty
      this._painted = now;
      const s = this.s, f = this.fire, sc = this.els.scene;
      const ev = s.major && s.major.phase === "on" ? s.major.id : null;
      const warnEv = s.major && s.major.phase === "warn" ? s.major.id : null;
      const lockCtl = this.locked() || f.status !== "ok";
      // scene weather + puppy state (CSS-driven, cheap)
      if (sc) {
        const t = (c, on) => sc.classList.toggle(c, !!on);
        t("wx-rain", ev === "rain"); t("wx-snow", ev === "blizzard" || ev === "whiteout"); t("wx-whiteout", ev === "whiteout");
        t("wx-fog", ev === "fog" || ev === "whiteout"); t("wx-hail", ev === "hail"); t("wx-clear", s.calm && s.calm.id === "clear");
        t("wx-stars", s.calm && s.calm.id === "stars"); t("wx-fireflies", s.calm && s.calm.id === "fireflies"); t("wx-windy", s.windWarn > 0 || ev === "frenzy");
        t("pup-in-tent", this.has("tent") && s.inTent); t("pup-wander", s.wandering > 0); t("pup-sky", s.behavior === "sky"); t("pup-nap", s.behavior === "nap"); t("pup-look", s.behavior === "look");
        t("has-kettle", this.has("kettle")); t("kettle-rattle", this.has("kettle") && s.pressure >= 70);
        if (this.has("kettle")) sc.style.setProperty("--steam", (s.pressure / 100).toFixed(2));
      }
      const q = (sel) => this.root.querySelector(sel);
      if (this.has("wind")) {
        const deg = { N: 0, E: 90, S: 180, W: 270 }[s.wind];
        const needle = q(".cmp-needle"); if (needle) needle.setAttribute("transform", `rotate(${deg})`);
        q(".compass").classList.toggle("twitch", s.windWarn > 0); q(".compass").classList.toggle("shake", ev === "whiteout");
        q(".cw-dir").textContent = `from the ${DIR_NAME[s.wind]}${s.windWarn > 0 ? ` → ${DIR_NAME[s.windTo]} in ${Math.ceil(s.windWarn)} s` : ""}`;
        for (const b of this.root.querySelectorAll("[data-comp^='dir-']")) { const on = b.dataset.comp === "dir-" + s.ventDir; b.classList.toggle("active", on); b.setAttribute("aria-checked", String(on)); b.disabled = lockCtl; }
        const match = s.ventDir === s.wind;
        const cm = q(".cw-match"); cm.textContent = match ? "✓ Matched" : "⚠ Mismatch: heating faster"; cm.dataset.level = match ? "ok" : "warn";
      }
      const setMeter = (key, val, state, level) => {
        const row = q(`[data-m="${key}"]`); if (!row) return;
        row.querySelector(".cm-bar i").style.width = `${val.toFixed(1)}%`;
        row.querySelector(".cm-bar").setAttribute("aria-valuenow", Math.round(val));
        row.querySelector(".cm-bar").setAttribute("aria-valuetext", state);
        row.dataset.level = level;
        const st = row.querySelector(".cm-state"); if (st.textContent !== state) st.textContent = state;
      };
      if (this.has("oxygen")) setMeter("oxygen", s.oxygen, s.oxygen < 15 ? "Critical" : s.oxygen < 35 ? "Low" : s.oxygen < 55 ? "Thinning" : "Steady", s.oxygen < 15 ? "danger" : s.oxygen < 35 ? "warn" : "ok");
      if (this.has("kettle")) setMeter("pressure", s.pressure, s.pressure >= 100 ? "About to pop!" : s.pressure >= 85 ? "Hissing!" : s.pressure >= 70 ? "Rattling" : s.pressure >= 30 ? "Ready" : "Warming", s.pressure >= 85 ? "danger" : s.pressure >= 70 ? "warn" : "ok");
      if (this.has("tent")) {
        const hp = Math.round(s.hp * 10) / 10, full = Math.floor(hp);
        const h = q(".hearts");
        const html = Array.from({ length: 10 }, (_, i) => `<i class="${i < full ? "on" : i < hp ? "half" : ""}"></i>`).join("");
        if (h._last !== html) { h.innerHTML = html; h._last = html; }
        h.setAttribute("aria-valuenow", String(full));
        h.setAttribute("aria-valuetext", `${full} of 10 hearts${s.inTent ? ", resting in the tent" : ""}`);
        q(".comp-hp .cm-state").textContent = s.inTent ? (s.forced ? "Recovering…" : "In the tent") : warnEv === "hail" || ev === "hail" ? "Outside! ⚠" : s.wandering ? "Exploring" : "Outside";
        const tb = q('[data-comp="tent"]');
        tb.setAttribute("aria-pressed", String(s.inTent));
        tb.querySelector("span").textContent = s.inTent ? "Come out" : "Tent";
        tb.disabled = s.inTent && s.forced;
        tb.classList.toggle("urgent", (warnEv === "hail" || ev === "hail") && !s.inTent);
      }
      const vb = q('[data-comp="vent"]'); if (vb) { vb.setAttribute("aria-pressed", String(s.ventOpen)); vb.querySelector("span").textContent = s.ventOpen ? "Vent open" : "Vent"; vb.disabled = lockCtl; }
      const bb = q('[data-comp="bellows"]'); if (bb) bb.disabled = lockCtl;
      const kb = q('[data-comp="valve"]'); if (kb) { kb.disabled = lockCtl; kb.classList.toggle("urgent", s.pressure >= 85); }
      const wb = q('[data-comp="water"]'); wb.hidden = !s.asking || s.inTent;
      const cb = q('[data-comp="callback"]'); cb.hidden = !s.wandering;
      // fire's own controls wait while the puppy is in the tent
      if (this.fire.els.button) this.fire.els.button.disabled = this.fire.status === "burning" || this.locked();
      // collapsed (mobile) toggle shows a dot when something needs attention
      const alert = (this.has("kettle") && s.pressure >= 85) || (this.has("oxygen") && s.oxygen < 35) || (this.has("wind") && s.ventDir !== s.wind) || warnEv === "hail" || (ev === "hail" && !s.inTent);
      q(".comp-alert").hidden = !alert;
    }

    // keyboard shortcuts (only when not typing): V vent · O bellows (oxygen) · K valve · T tent
    key(k) {
      const map = { v: "vent", o: "bellows", k: "valve", t: "tent" };
      if (!map[k] || !this.on) return false;
      const need = { vent: "vent", bellows: "oxygen", valve: "kettle", tent: "tent" }[map[k]];
      if (!this.has(need)) return false;
      this.act(map[k]);
      return true;
    }

    snapshot() {
      const s = this.s;
      return { events: s.events, lidPops: s.lidPops, hailHits: s.hailHits, tentSeconds: Math.round(s.tentSeconds), windShifts: s.windShifts, mechanics: MECHANICS.filter((m) => this.has(m.id)).map((m) => m.name) };
    }

    destroy() {
      if (this.root) { this.root.removeEventListener("click", this._onClick); this.root.innerHTML = ""; this.root.hidden = true; this.root.classList.remove("open"); }
      if (this.noticeEl) this.noticeEl.remove();
      clearTimeout(this._popT); clearTimeout(this._puffT);
    }
  }

  window.Companion = { Companion, MECHANICS, EVENTS, CATS, defaults, full, isFull, normalize, summary, esc };
})();
