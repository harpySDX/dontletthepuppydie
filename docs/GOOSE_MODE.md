# Goose Mode and the survival rebalance

## Survival rebalance

All tuning lives in one object, `TUNING` in `js/companion.js`:

| Value | Meaning |
|---|---|
| `kettle.baseRate` 0.006 | the original pressure rise per degree of heat above 35, per second |
| `kettle.speedup` 1.18 | Normal is 18 % faster than that baseline |
| `kettle.modeMul.chill` 1/1.18 | Chill cancels the speed-up, so Chill keeps the original pace |
| `kettle.blowSeconds` 8 (Chill 12) | announced countdown at 100 % pressure; the valve still works during it |
| `kettle.afterRecover` 30 | pressure after Relight / Keep going, so the camp can't blow again at once |
| `oxygen.failAt` 0 / `criticalAt` 15 / `afterRecover` 85 | the real threshold (the value itself, clamped to exactly 0, not the rounded meter), the warning, the reset |

**One terminal-state path.** `Campfire.die(cause)` (`burnt`, `frozen`, `kettle`, `oxygen`) is the only way a round
ends. It is idempotent: once the status isn't `ok`, nothing can end the round again. While a round is over,
`tick()` does nothing (no heat, no kettle, no oxygen, no events), the game-over dialog stops the loop, and the
animation loop no longer restarts itself after `stop()` (this was a pre-existing leak). Recovery (`Thaw`, `Rebuild`,
`Relight`, or *Keep going*) goes through `_recover()`, which also resets the kettle and oxygen to safe values.
Results count kettle blowouts and smothered fires.

## Goose Mode

A gameplay **setting** (Settings → Gameplay → Goose Mode), not a difficulty. It replaces puppy survival with a
mischievous goose.

**Rules**
- Allowed on Normal, Challenging and Nightmare. On Simple the switch is disabled with a note; selecting Simple while
  it's on switches it off. Choosing any difficulty never switches it on.
- In a test under Goose rules: no campfire, kettle, oxygen, tent, wind, events or game over. The puppy's settings
  are put aside on the session (`preGoose`) — not deleted — and given back if Goose Mode is turned off mid-test
  (the campfire is rebuilt with its original mechanics and *Puppy can lose* choice). Turning it on mid-test stops
  every puppy system (no hidden timers). An unfinished test resumed after the setting changed follows the new setting.
- The mascot becomes the goose on the settings button and the island. Questions, answer checking, scoring, history
  and diagnostics are untouched; results note that the test was taken in Goose Mode.

**Event manager (`js/goose.js`)**
- One 250 ms timer for everything. It counts down to the next event (first after 8–14 s, then every 20–40 s,
  ≈ 30 s on average), ages active events and ends them on time.
- It only runs where there's a game (Home, a live test, Practice, Whole course) and holds — ending any running
  effect cleanly and freezing the countdown — when the tab is hidden, on other screens, during tours, while a dialog,
  Settings or the game-over dialog is open, or while the test is paused.
- Registry entries declare `id`, duration range, cooldown, severity, `channels` (colour · stage · panels · input ·
  overlay · goose), events they `exclude`, whether they involve motion or dimming, eligibility, and `start()` which
  returns the cleanup. The same event never runs twice in a row; two events only overlap when they share no
  channel and don't exclude each other (30 % chance of a combination, e.g. a colour shift + dancing panels, a shake +
  a theft, grayscale + a theft).
- Effects use different CSS properties so they can't fight: screen colour → `filter`, flip → `rotate`, shake →
  `translate` (on the screen section); dance → `transform`, position → `translate` (on panels).
- Every cleanup runs on expiry, on interruption and on disable; a generation token stops stale async steps; turning
  Goose Mode off also sweeps any remaining Goose class, overlay, `inert` or goose element.

**Events:** grayscale · rainbow shift · upside down (rotated about the visible centre) · earthquake (±6 px, the
screen section only) · panel dance · freeze (2–4 s) · soft dim (the "flash": a single dark fade, never white, never
repeated) · goose theft.

**Freeze.** The screen section becomes `inert` under a goose notice with a countdown. The island (Pause, Exit,
Settings) and the Goose bar (Turn off) stay usable. Test shortcuts wait, the test clock is held, and for 0.45 s after
the thaw a click or Enter is swallowed so nothing is submitted twice. Input always comes back (cleanup on expiry,
disable, navigation, hidden tab; a reload starts clean).

**Goose theft.** A movable panel is chosen at random (topic, activity, goals, quick actions, stats, the Studio+
panels, the test's question list or info panel, the practice test row, the course header — never settings,
navigation, the question card, a focused input, a dialog or a panel already animating). The goose walks in from the
nearer edge, grabs the panel's top edge (it bobs, the panel lifts), carries it along an arc, drops it on a spot that
avoids the question card, navigation, start buttons and tools, hops with a "HONK", and leaves. The panel never
changes parent — only its own `translate` — so its contents and state are untouched. In calm mode the goose fades
in, the panel fades to its new spot, and the goose fades out.

**Drag and drop (Goose Mode only).** Movable panels get a small ⠿ handle (pointer, touch or arrow keys; Home resets
one panel). Panels stay inside the window and below the navigation; the one you're moving comes to the front.
*Reset layout* on the Goose bar restores everything. Offsets live in memory for the current Goose session only:
the normal saved layout is never written, turning Goose Mode off restores it, and turning it on again (or
reloading) starts from the normal layout.

**Accessibility.** "Calmer goose" (on by default with `prefers-reduced-motion`) removes shaking, flipping, dancing
and dimming from the schedule; CSS also stops those animations under reduced motion. No white flashes or strobing
exist at all. All Goose text is translated (5 languages) and follows language changes live.

## Tests

- `tests/companion.test.js`: kettle pace (Normal 18 % faster, Chill unchanged, measured through the real loop),
  blowout after the countdown, valve during the countdown saves the camp, oxygen death at the real threshold only
  (0.4 % displayed as 0 isn't death), single death event, simulation stops while dead, recovery, freezing/burning
  through the same path.
- `tests/e2e/goose.js` (73 checks): the setting and Simple rules; mascot; events only when active and only on game
  screens; every event applies and restores; natural expiry; incompatible vs compatible combinations; theft keeps
  the same node and parent and lands on screen below the navigation; drag, clamping, keyboard, reset; no handles
  without Goose Mode in all four layouts; turning off restores layout and leaves nothing behind; saved layout never
  changed; language/theme/layout changes; reload mid-event; Normal/Challenging/Nightmare tests under Goose rules;
  freeze blocks input, keeps Pause/Exit usable, holds the clock and gives input back; Goose off/on mid-test restores
  and removes the campfire; kettle and oxygen game overs in a real test, once, with the loop stopped and recovery;
  reduced motion; phone width.
