/*
 * Campfire buddy simulation.
 * Heat runs 0–100. It drops over time; each log adds heat gradually as it catches.
 *   heat ≥ 100 → the camp catches fire     heat ≤ 0 → the puppy freezes
 */
(function () {
  const MODES = {
    chill: { decay: 0.55, label: "Chill", hint: "The fire cools slowly — about one log every minute and a half." },
    normal: { decay: 1, label: "Normal", hint: "About one log every 45 seconds. Logs take a few seconds to catch." },
    off: { decay: 0, label: "No campfire", hint: "No buddy and no fire to tend — just you and the test." },
  };

  const LOG_HEAT = 18;       // heat added per log
  const LOG_BURN_IN = 3.2;   // seconds for a log to fully catch
  const BURN_SECONDS = 3.5;  // length of the "everything is on fire" animation
  const COZY_MIN = 25, COZY_MAX = 75;

  class Campfire {
    constructor(els, mode = "normal") {
      this.els = els;
      this.mode = MODES[mode] ? mode : "normal";
      this.heat = 55;
      this.pending = [];
      this.status = "ok"; // ok | burning | burnt | frozen
      this.burnTimer = 0;
      this.stats = { fires: 0, freezes: 0, logs: 0, cozySeconds: 0, totalSeconds: 0, minHeat: 55, maxHeat: 55 };
      this._raf = null;
      this._last = 0;
      this._lastMsg = "";
      this.onEvent = null; // called with "burnt" or "frozen" when the puppy loses
      this.comp = null;    // optional Campfire Companion extras (js/companion.js)
      this._onFuel = () => this.addFuel();
      els.button.addEventListener("click", this._onFuel);
      this.render();
    }

    static get MODES() { return MODES; }

    start() {
      if (this.mode === "off" || this._raf) return;
      this._last = performance.now();
      const loop = (t) => {
        // Clamp dt: when the tab is hidden, rAF pauses, so the fire pauses with it.
        const dt = Math.min(0.5, (t - this._last) / 1000);
        this._last = t;
        this.tick(dt);
        this.render();
        this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    }

    stop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;
    }

    destroy() {
      this.stop();
      if (this.comp) { this.comp.destroy(); this.comp = null; }
      this.els.button.removeEventListener("click", this._onFuel);
    }

    addFuel() {
      if (this.mode === "off") return;
      if (this.status === "frozen") { this.status = "ok"; this.heat = 45; this.pending = []; this.flash("thaw"); return this.render(); }
      if (this.status === "burnt") { this.status = "ok"; this.heat = 50; this.pending = []; this.flash("rebuild"); return this.render(); }
      if (this.status === "burning") return;
      if (this.comp && this.comp.locked()) { this.comp.notify("Your puppy's resting in the tent. The fire can wait a moment.", "warn"); return; }
      this.pending.push({ left: LOG_HEAT * (this.comp ? this.comp.logMul() : 1) });
      this.stats.logs++;
      this.heat = Math.min(100, this.heat + 1.5); // small instant flare
      this.flash("log");
      this.react("hop");
      this.render();
    }

    // Short puppy reactions: "hop" (a log went on) or "happy" (you answered something)
    react(kind) {
      const sc = this.els.scene;
      if (!sc || this.status !== "ok") return;
      const cls = `react-${kind}`;
      sc.classList.remove("react-hop", "react-happy");
      void sc.getBoundingClientRect();
      sc.classList.add(cls);
      clearTimeout(this._reactT);
      this._reactT = setTimeout(() => sc.classList.remove(cls), 900);
    }

    flash(kind) {
      const b = this.els.button;
      b.classList.remove("pop");
      void b.offsetWidth;
      b.classList.add("pop");
      b.dataset.last = kind;
    }

    // Armadillo mode: how fast the test clock drains right now
    drain() {
      if (this.mode === "off") return 1;
      if (this.status !== "ok") return 5;
      const h = this.heat;
      if (h < 12 || h > 88) return 3;
      if (h < COZY_MIN || h > COZY_MAX) return 2;
      return 1;
    }

    // Revive after a game over (used by "Keep going")
    revive() {
      this.status = "ok";
      this.heat = 50;
      this.pending = [];
      this.stats.revives = (this.stats.revives || 0) + 1;
      this.render();
    }

    // Switch the minigame off for the rest of the test
    turnOff() {
      this.stop();
      if (this.comp) { this._compSnap = this.comp.snapshot(); this.comp.destroy(); this.comp = null; }
      this.origMode = this.mode;
      this.turnedOff = true;
      this.mode = "off";
      this.status = "ok";
      this.pending = [];
      this.render();
    }

    get pendingHeat() { return this.pending.reduce((s, p) => s + p.left, 0); }

    tick(dt) {
      if (this.status === "burning") {
        this.burnTimer -= dt;
        if (this.burnTimer <= 0) { this.status = "burnt"; if (this.onEvent) this.onEvent("burnt"); }
        return;
      }
      if (this.status !== "ok") return;
      if (this.comp) this.comp.tick(dt);

      const m = MODES[this.mode].decay;
      const decay = (0.25 + this.heat * 0.003) * m * (this.comp ? this.comp.coolMul() : 1); // hotter fires burn faster
      this.heat -= decay * dt;
      if (this.comp) this.heat += this.comp.heatDelta(dt);

      const rate = LOG_HEAT / LOG_BURN_IN;
      for (const p of this.pending) {
        const add = Math.min(p.left, rate * dt);
        p.left -= add;
        this.heat += add;
      }
      this.pending = this.pending.filter((p) => p.left > 0.001);

      this.stats.totalSeconds += dt;
      if (this.heat >= COZY_MIN && this.heat <= COZY_MAX) this.stats.cozySeconds += dt;
      this.stats.minHeat = Math.min(this.stats.minHeat, this.heat);
      this.stats.maxHeat = Math.max(this.stats.maxHeat, this.heat);

      if (this.heat >= 100) {
        this.heat = 100;
        this.pending = [];
        this.status = "burning";
        this.burnTimer = BURN_SECONDS;
        this.stats.fires++;
      } else if (this.heat <= 0) {
        this.heat = 0;
        this.pending = [];
        this.status = "frozen";
        this.stats.freezes++;
        if (this.onEvent) this.onEvent("frozen");
      }
    }

    message() {
      const h = this.heat;
      switch (this.status) {
        case "burning": return ["🔥 FIRE! The whole camp is burning!", "danger"];
        case "burnt": return ["The camp burned down. Press Rebuild to set up again.", "danger"];
        case "frozen": return ["Your puppy froze into an ice cube! Press Thaw.", "danger"];
      }
      if (this.mode === "off") return ["", ""];
      if (h < 12) return ["Brrr! Your puppy is freezing — add a log!", "danger"];
      if (h < COZY_MIN) return ["Getting chilly… your puppy is shivering.", "warn"];
      if (h > 88) return ["Way too hot! Stop adding wood!", "danger"];
      if (h > COZY_MAX) return ["Pretty toasty… careful with the logs.", "warn"];
      return ["Your puppy is warm and cozy.", "ok"];
    }

    render() {
      const { scene, gauge, button, buttonText, status } = this.els;
      const h = this.mode === "off" ? 55 : this.heat;
      const pending = Math.min(100 - h, this.pendingHeat);

      if (scene) {
        scene.style.setProperty("--heat", h.toFixed(2));
        scene.classList.toggle("is-cold", this.status === "ok" && h < COZY_MIN);
        scene.classList.toggle("is-freezing", this.status === "ok" && h < 12);
        scene.classList.toggle("is-hot", this.status === "ok" && h > COZY_MAX);
        scene.classList.toggle("is-cozy", this.status === "ok" && h >= COZY_MIN && h <= COZY_MAX);
        scene.classList.toggle("is-frozen", this.status === "frozen");
        scene.classList.toggle("is-burning", this.status === "burning");
        scene.classList.toggle("is-burnt", this.status === "burnt");
      }
      if (gauge) {
        gauge.style.setProperty("--heat", h.toFixed(2));
        gauge.style.setProperty("--pending", pending.toFixed(2));
        gauge.setAttribute("aria-valuenow", Math.round(h));
        gauge.dataset.state = this.status !== "ok" ? "danger" : h < 12 || h > 88 ? "danger" : h < COZY_MIN || h > COZY_MAX ? "warn" : "ok";
      }
      if (button) {
        const label = this.status === "frozen" ? "Thaw puppy" : this.status === "burnt" ? "Rebuild camp" : this.status === "burning" ? "Burning…" : "Add log";
        if (buttonText.textContent !== label) buttonText.textContent = label;
        button.disabled = this.status === "burning" || !!(this.comp && this.comp.locked());
        button.dataset.state = this.status;
      }
      if (this.comp) this.comp.render();
      const [msg, level] = this.message();
      if (status && msg !== this._lastMsg) {
        status.textContent = msg;
        status.dataset.level = level;
        this._lastMsg = msg;
      }
    }

    snapshot() {
      const s = this.stats;
      return {
        mode: this.origMode || this.mode,
        turnedOff: !!this.turnedOff,
        fires: s.fires,
        freezes: s.freezes,
        logs: s.logs,
        cozyPercent: s.totalSeconds > 0 ? Math.round((s.cozySeconds / s.totalSeconds) * 100) : 100,
        revives: s.revives || 0,
        companion: this.comp && this.comp.on ? this.comp.snapshot() : this._compSnap,
      };
    }
  }

  window.Campfire = Campfire;
})();
