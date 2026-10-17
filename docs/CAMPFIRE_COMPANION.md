# Campfire Companion: optional minigame extras

> **Update: one master switch.** *Create test* now has a single **Campfire minigame** switch.
> - **Off** is the default, for full concentration: no puppy, no fire, no timers.
> - **On** selects the **full campfire** (recommended): every mechanic and every event, with Chill or Normal pace. *Puppy can lose* and *Armadillo mode* stay off, because Armadillo changes the real test clock.
> - **Customize** (collapsed) holds the individual mechanics, the events and the two extra-challenge switches. *Back to full* restores the recommended set.
> - **Existing users:** a campfire that was on but never customised also gets the full set.
>
> The sections below describe the mechanics and rules, which are unchanged.

The Companion is an **upgrade of the existing campfire minigame**: the same puppy, fire, tent, heat gauge and *Add log*, in the same-width panel beside the test. It is learning first, game second. Every extra is off unless the student turns it on.

## How it's integrated

**Create test:** inside the existing *Campfire* section, below *Puppy can lose* and *Armadillo mode*:

- **Extra camp mechanics:** five checkboxes, all off by default.
- **Random events:** a switch, off by default. Turning it on reveals the events grouped as Peaceful / Moderate / Severe.
  - Each event shows an icon, a one-line description, and a tag: *Cosmetic*, *Fire* or *Action*.
  - Tools: All / None / Defaults.
  - Events that need a mechanic that's off are disabled and say so (e.g. "Needs Wind & compass"). They can never run.
- The choice is saved in the existing preferences (`campfire-prep.prefs.v1` → `companion`).
- Basecamp's setup summary shows a chip such as "3 extra mechanics · 9 events".
- With *No campfire* selected, the whole section is disabled.

**Test lifecycle:**

- `startTest()` copies the normalised config onto the session (`session.companion`, or `null` when nothing is on).
- `enterTest()` attaches a `Companion` to the existing `Campfire` only when the config has something on, the campfire is on, and it isn't the tour.
- The Companion runs **inside the existing campfire animation loop** (`Campfire.tick`), with no timers of its own. So it stops on pause, game over, *Turn off campfire*, leaving the test and submitting, exactly like the fire.
- Its state is saved with the fire (`session.buddy.comp`), so a reload or resume continues where it left off.

**Coupling to the fire** (in `js/campfire.js`):

- `coolMul()` scales the existing cooling (rain, blizzard, clear skies, low oxygen).
- `heatDelta()` adds the vent, wind mismatch, heat surge and ember gust.
- `logMul()` weakens logs when oxygen is low.
- `locked()` disables *Add log* while the puppy rests in the tent.

With every extra off, the campfire is numerically identical to before. A unit test checks this.

**Widget:**

- A compact block under the puppy's status line: compass, meters with words (not colour alone), hearts, and small buttons.
- Event notices are a small glass pill on top of the scene. It has `pointer-events: none`, so it never blocks anything.
- Weather and puppy states are CSS classes on the existing scene SVG (rain, hail, snow, fog, fireflies, shooting star, kettle, tent peek, tree sway).
- Below 980 px the block collapses into a "Camp controls" row, with a dot when something needs attention.
- The scratchpad's default position moves to bottom-centre when the Companion is on, so it doesn't cover the controls. A position the student dragged it to is kept.

## Fairness rules (all enforced in `js/companion.js`, covered by unit tests)

- **Spacing:** the first event comes after 2+ minutes, and disruptive events are 4–7 minutes apart, one at a time. Calm events (shooting stars, fireflies, clear skies) can overlap.
- **Severe events:** at most `1 + floor(minutes / 40)` per test, at least 8 minutes apart, and they only start when the fire is between 35 and 75.
- **Repeats:** the same event won't repeat within 10 minutes.
- **Warnings:** wind shifts are always announced at least 6 seconds ahead. Hail gives a 10-second warning.
- **Events alone never burn the camp:** event heat stops adding at 92. Heat surge and ember gust don't start above 70; rain and blizzards don't start below 30.
- **Typing:** if the student is typing an answer, a new event waits (up to 45 seconds).
- **The puppy:** at 0 hearts it shelters in the tent and recovers to 6, and it is never lost.
- **The kettle (rebalanced):** pressure builds 18 % faster than the original pace (Chill keeps the original pace). At full pressure an announced countdown starts (8 s, 12 s in Chill) with the valve still usable; if it runs out the kettle blows and the round ends through the same terminal state as freezing or burning (`Campfire.die("kettle")`). See [GOOSE_MODE.md](GOOSE_MODE.md#survival-rebalance).
- **Oxygen:** if it actually reaches 0 (not just a meter that rounds to 0) the fire smothers and the round ends (`Campfire.die("oxygen")`), once. A "critical" warning comes first at 15 %.
- **Game over:** with *Puppy can lose* on, a burnt camp, a frozen puppy, a kettle blowout or running out of oxygen shows the game-over dialog (one path for all four). Without it, each shows its recovery button (Thaw / Rebuild / Relight). The test always goes on and the mark is never affected.

Typical frequency with everything on in a 60-minute test (simulated): about 10 disruptive events, 0.5 severe, 8 calm moments and 16 wind shifts.

## Files changed

| File | Change |
|---|---|
| `js/companion.js` | **new**: the catalog, simulation, scheduler and widget |
| `js/campfire.js` | hooks for the Companion; destroyed when the campfire is turned off or the test ends |
| `js/app.js` | Create test UI, prefs, session config, attach/restore/save, keyboard shortcuts, setup summary, results line |
| `js/scratchpad.js` | default position avoids the controls; remembers a position the student chose |
| `index.html` | setup section, widget slot, scene additions (kettle, tent peek, weather layers), script tag |
| `css/style.css` | widget, scene effects, setup styles, mobile collapse |
| `tests/companion.test.js` | **new**: 15 unit tests |
| `tests/e2e/regressions.js` | 21 new browser checks |

## Tests run

| Suite | Result |
|---|---|
| `npm test` | **46 / 46 pass** (15 new) |
| `tests/e2e/regressions.js` | **55 / 55 pass** (21 new) |
| `tests/e2e/browser.js` | **69 / 69 pass** (unchanged) |

The unit tests cover:

- off by default, and identical behaviour when everything is off
- dependency filtering
- only selected events occur
- the events switch off while mechanics still work
- scheduler spacing and caps over 5 simulated hours
- wind warning length
- the hail warning, shelter, damage and recovery
- the tent lock
- the kettle pace (central `TUNING` in js/companion.js), valve, countdown and blowout
- oxygen
- vent and wind direction effects
- the event heat cap
- waiting while typing
- a "reasonable student" keeping the camp alive for an hour with everything on (5 runs)
- save/restore

The browser checks cover:

- the defaults in Create test, and disabled options when there's no campfire
- the classic campfire unchanged (no widget, no Companion object)
- dependency blocking
- the widget's width, and that the question area isn't shrunk
- vent click and the V key
- the tent lock
- the ventilation direction
- the non-blocking notice
- questions staying usable during an event
- pause freezing the simulation
- the reload keeping state
- the tutor still hidden
- the mobile collapse and expand
- *Turn off campfire* removing the Companion

## Not included

- **Sound:** there are no sound effects. The site has no sound system, and the spec asked for sound off by default.
- **Group tests:** each person uses their own Companion settings; nothing is synced.
- **The tour's sample test** never shows the Companion.
