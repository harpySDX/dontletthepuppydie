# Navigation and information architecture

One navigation model for both subjects. The guiding rule: **simplify the experience, not the capability**.
Nothing was removed outright; duplicated entry points were collapsed and every feature now has one home that
matches what it is for.

## The model (the Study Café, see docs/CAFE.md)

```
Top bar (same in Math and Physics; links pinned on wide screens, a menu on narrow ones, hidden on the café home
where the tiles and "Visit The Bar" do the same job)
├── Home         where the app opens: subject cards (coverage, next up) · Recommended Practice · Game · Tests · Diagnostics
├── Tests        subject → difficulty → preview → Start / Test options
├── Game         optional, off by default: Campfire minigame (→ Test options with it on) · Goose Mode
├── The Bar      menu: Topic practice · Practice sets · Lessons · Formula sheet · Study Room (Math) · Labs (Physics, optional)
│                Find a topic (search, Guided / Practise / Lesson per topic)
│                tabs: The Bar · Skills · Whole course · Study Room (Math)
└── Diagnostics  Overview (stats, skills, goals, history) · Mistakes & review · Study plan (Math)
                 badge = reviews due today (Math)
Settings (puppy button)  language · layout · theme · accent colour · café scene · Goose Mode · help & tours
During a test            the island becomes the test bar; the café is hidden; only exam tools are reachable
```

Primary journey: **open → Home → Tests (subject, difficulty) → Start → focused test → results →
Diagnostics**. The Bar is for deliberate practice and study, and never sits between a student and a test.

The earlier four-item version of this model (Home · Practice · Learn · Progress) became three when the café
redesign merged Practice and Learn into **The Bar** (every resource for practising and studying, by subject and
topic) and renamed Progress to **Diagnostics**.

## What changed (audit → decision)

| Found | Decision |
|---|---|
| Destinations repeated up to four times: island menu, Quick actions panel, "View all" links, Studio+ tools | Quick actions panel removed from Home; the island is the one menu and is always visible on wide screens. "View all" links and Studio+ tools stay (they are shortcuts inside a panel, not menus). |
| Full tests launchable from Home, the Practice "Full tests" row, the Physics Practice launcher and Studio+ | Tests start from Home's difficulty cards (Studio+ keeps its launcher as the Home of that layout). The Practice "Full tests" row and the Physics launcher were removed. |
| Practice tabs mixed practice, review and tracking (Skills, Course, Review, Study plan, Progress) | Split by purpose: **Practice** = doing questions; **Progress** = results, mistakes, plans. |
| Study Room was a top-level island item though it is an occasional group feature | A Practice tab (Math). Its route still works from tours, invites and Studio+. |
| Physics renamed island items (Lessons / Lab) and had its own Practice screen with its own tabs (Practice / Diagnostics / Review / Course) | Physics uses the shared screens: Practice (skill cards in the Math card style, course map), Progress (stats, diagnostics, goals, history, review queue), Learn. Only content differs. |
| Physics labs presented next to tests (tool cards, lesson path, "Lab" in the island) | Labs live only under Learn → **Labs (optional)**; nothing on the way to a test mounts a tool. |
| Goals on Home competed with the primary action | Moved to Progress → Overview (both subjects). |
| Terminology drifted (Concepts / Concept Library / Lessons; Study Room / Lab) | Island uses verbs of purpose: Home, Practice, Learn, Progress. |

Feature placement:

| Feature | Where |
|---|---|
| Simple | Home: an easier assessment (24 marks / 6 Physics questions), like every difficulty |
| Guided practice (step by step) | The Bar: Guided on every topic, and the Simple button on skill cards |
| Normal / Challenging / Nightmare tests | Home difficulty cards → preview → Start or Test options |
| Test-taking tutorial ("How tests work") | Home preview link, Settings → Help |
| Site tour | offered on Home on a first visit, Settings → Help |
| Group tests (codes) | Test options dialog (Math) |
| Classmate's Test (Tim's Test, radicals unit, retired) | its attempts stay in Progress → test history with Tim's credit; group codes for it still open |
| Study Room (same questions for friends, by code) | Practice → Study Room (Math) |
| Challenging | the third difficulty card on Home, and a level on every Practice skill card |
| Diagnostics | Home (both subjects at a glance) and Diagnostics → Overview |
| Recommended practice | Home |
| Mistake Notebook, spaced review | Diagnostics → Mistakes & review |
| Study plan, exam planner, study files | Diagnostics → Study plan (Math) |
| Lessons, formula reference | The Bar → Lessons / Formula sheet |
| Physics Projectile Explorer, Motion Graph Lab, Vector visualizer | The Bar → Labs (optional) |

## Compatibility

- Old routes still resolve: `studyroom` (Physics → Learn → Labs), `learning` (Physics → Progress), `room`, `lab`,
  `review`, `progress`, `course`. Links in tours, results, Studio+ and saved invites keep working.
- No storage keys changed; Math and Physics data stay separate (see docs/PHYSICS.md).
- Assessment rules are unchanged: the test screen, hint policies, grading and review are the shared engine's.

## Tests

`tests/e2e/ia.js` checks the model for both subjects: five island items, pinned/collapsed behaviour, tabs per
destination, Goals on Progress, Learn contents, old routes, a focused test started straight from Home, phone-width
overflow, and Physics skill cards starting practice at the chosen level. The other suites share
`tests/e2e/navhelp.js` to navigate the same way.
