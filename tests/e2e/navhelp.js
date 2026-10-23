// Shared navigation helper for the e2e suites.
// The top bar holds Home · Tests · Game · The Bar · Diagnostics (data-go="progress"); on the café home its links are
// hidden (the home tiles do that job), so they are clicked in-page there.
// The Bar's tabs: The Bar (menu) / By topic (practice) / Whole course / Study Room (Math); its menu opens Lessons
// (library) and the formula sheet. Diagnostics' tabs: Overview / Mistakes & review / Study plan (Math).
const GROUP = { practice: "bar", course: "bar", studyroom: "bar", library: "bar", review: "progress", learning: "progress" };
async function go(p, where, wait = 300) {
  const top = GROUP[where] || where;
  // the café home hides the section links (its tiles do that job): use them where they're visible, else the tile/link
  const navVisible = await p.locator(`#main-nav [data-go="${top}"]`).isVisible().catch(() => false);
  if (!navVisible && (await p.evaluate(() => document.body.dataset.screen)) !== "home" && (await p.getAttribute("#brand-link", "aria-expanded")) !== "true") { await p.click("#brand-link"); await p.waitForTimeout(120); }
  if (await p.locator(`#main-nav [data-go="${top}"]`).isVisible().catch(() => false)) await p.click(`#main-nav [data-go="${top}"]`);
  else await p.evaluate((t) => document.querySelector(`#main-nav [data-go="${t}"]`).click(), top);
  await p.waitForTimeout(200);
  if (where === "library") await p.click('#bar-body .bar-item[data-go="library"]:not([data-go-arg])');
  else if (top !== where) await p.click(`.screen:not([hidden]) [data-tabs] [data-go="${where}"]`);
  await p.waitForTimeout(wait);
}
// the same route through in-page clicks (works whether or not the island is expanded)
async function evalNav(p, where, wait = 260) {
  await p.evaluate(([go, G]) => {
    const top = G[go] || go;
    document.querySelector(`#main-nav [data-go="${top}"]`).click();
    if (top === go) return;
    const el = go === "library" ? document.querySelector('#bar-body .bar-item[data-go="library"]:not([data-go-arg])') : document.querySelector(`.screen:not([hidden]) [data-tabs] [data-go="${go}"]`);
    el.click();
  }, [where, GROUP]);
  await p.waitForTimeout(wait);
}
// Take a Test: the page with the subject choice, difficulty cards and preview
const toTake = (p, wait = 250) => evalNav(p, "take", wait);
// switch subject the way a learner would: the subject cards on the café home, the switcher everywhere else
async function pickSubject(p, s, wait = 350) {
  if (await p.locator("#subject-btn").isVisible().catch(() => false)) { await p.click("#subject-btn"); await p.waitForTimeout(80); await p.click(`#subject-menu [data-subject="${s}"]`); }
  else if (await p.locator(`#hub-subjects .s-${s} [data-subject-pick]`).isVisible().catch(() => false)) await p.click(`#hub-subjects .s-${s} [data-subject-pick]`);
  else await p.evaluate((s) => document.querySelector(`#subject-menu [data-subject="${s}"]`).click(), s); // e.g. Studio+, whose home is the workspace
  await p.waitForTimeout(wait);
}
module.exports = { go, evalNav, toTake, pickSubject, GROUP };
