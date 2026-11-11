# CompTIA Cert Prep (study site)

Static study site for Mr. Flauto's CompTIA classes: flashcards and practice tests for A+ Core 1 first, then Core 2, Network+, Security+. Plain HTML, CSS, and JavaScript modules with JSON content. No build step, no dependencies.

Read `docs/PLAN.md` (plan, site layout, sign-in and scoreboard design) and `docs/CONTENT-GUIDE.md` (content format and rules) before changing anything substantial.

## Two kinds of chat work in this folder

- **Website chats** build and fix the site. They do not write, extend, or "improve" questions or flashcards.
- **The content chat** writes questions and flashcards under `data/`. Mr. Flauto starts it with the prompt in `docs/CONTENT-HANDOFF.md`. It does not change the site (`assets/`, the HTML pages, `tools/`, `schemas/`); if content needs a site change, it stops and tells him.

A chat that was not started with that prompt, and has not been asked for content, is a website chat.

## Content

- Which units are written, and the order of the rest, is in `docs/PLAN.md` section 6.
- The first-pass placeholder packs were deleted on 2026-11-10. Never reuse a `ph-` id: decks and tests saved on students' devices may still point at one.

## Sign-in

- **No sign-in and no scoreboard.** Mr. Flauto dropped both for now (2026-11-10). Do not build or propose them unless he raises it. The site is shared by link, and every page has a `noindex` tag to stay out of search results.
- Notes for if it comes back are in `docs/PLAN.md` section 5: school Google accounts in `thsnet.net` only, remember the device, **no Firebase**.

## Run and test

- Double-click `serve.cmd`, or start the preview server named `study-site` (`.claude/launch.json`). The site is at http://localhost:8080/.
- Content check: http://localhost:8080/tools/validate.html (same rules as `tools/validate-cli.mjs`, which GitHub Actions runs before deploying).
- **Automated browser tests use port 8081**: start the preview server named `study-site-test` and test at http://localhost:8081/. The same server also answers on 8082 to 8085, so parallel reviewers each get a port (and saved data) of their own. It serves the same files, but a different port is a different site to the browser, so tests never touch the decks, tests, and history Mr. Flauto has saved on port 8080. Never clear or seed saved data on port 8080.
- As of November 10, 2026 this PC has Git and the GitHub CLI (`gh`, signed in to the account that owns the repository), but no Node or Python. Check before assuming a tool exists. In a chat that was already open when Git was installed, the tools may be missing from `PATH`: they are in `C:\Program Files\Git\cmd` and `C:\Program Files\GitHub CLI`.
- **Published** at https://l-e-f-t.github.io/Mr-Flautos-Study-Material-Site/ (repository `L-E-F-T/Mr-Flautos-Study-Material-Site`). Every push to `main` runs the content check and redeploys; other branches do not deploy.

## Conventions

- **The UI is labels, not instructions.** No how-to paragraphs, tips, welcome text, or "check back soon" filler. If a control needs explaining, rename the control. Keep every label as short as it can be.
- **No emoji or symbol characters in the UI** (no party poppers, books, flames, check marks, or arrow glyphs). Use `icon()` from `assets/js/lib/dom.js` or a CSS shape, and pair every icon with text.
- **Anything without content is labeled "Coming soon", and the site works that out from the data.** An exam that is not `live`, a study mode with no packs (home card), any unit, lesson, domain, or objective with no items (both pickers), and any bullet with no questions (the practice-test list by objective, the only list that shows bullets). Never type "coming soon" into a data file, and never leave an empty state that says anything else.
- **No scores on the home page.** The home card only links to the two study modes and offers Resume deck / Resume test. A minus at the right end of each Resume button discards it: the first click turns the minus red, a second click on the red minus discards. That minus is the one icon without text and the one red outside right and wrong, by Mr. Flauto's choice. Scores and trends live in the Recent history panel on the practice page (`assets/js/components/history-panel.js`, log written by `assets/js/lib/progress.js`). It is called "Recent" because the browser can clear it; never label it as if it were kept for good.
- Every page must work on a phone (320px wide, touch) and in both light and dark mode.
- Colors are tokens in `assets/css/site.css`. Light/dark is `<html data-theme>`; course color is `<html data-exam-theme>`.
- **The class color is the highlight color.** Main buttons, checked controls, selection, hover, and focus all use the `--accent*` tokens (A+ graphite, Network+ green, Security+ teal-navy). Never hard-code another emphasis color. Green and red mean right and wrong only.
- Hover styles live in one `@media (hover: hover)` block so they never stick after a tap on a phone.
- Text from data files is inserted as text nodes (`h()` in `assets/js/lib/dom.js`), never as HTML.
- House style for student-facing text: plain 10th-grade wording, no em dashes, citations read "Reading 3.2.6".
- All URLs are relative: the site runs from a sub-path on GitHub Pages and later from a lab server.
