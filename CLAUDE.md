# CompTIA Cert Prep (study site)

Static study site for Mr. Flauto's CompTIA classes: flashcards and practice tests for A+ Core 1 (finished), then Network+ (which also has Command line, a typed command drill), then Core 2 and Security+. Plain HTML, CSS, and JavaScript modules with JSON content. No build step, no dependencies.

Read `docs/PLAN.md` (plan, site layout, sign-in and scoreboard design) and `docs/CONTENT-GUIDE.md` (content format and rules) before changing anything substantial.

## Two kinds of chat work in this folder

- **Website chats** build and fix the site. They do not write, extend, or "improve" questions or flashcards.
- **The content chat** writes questions, flashcards, and the Command line tool's commands and command bank under `data/`. Mr. Flauto starts it with the prompt in `docs/CONTENT-HANDOFF.md` (a Command line pass is its section "A Command line pass", and a Command bank pass its section "A Command bank pass"). It does not change the site (`assets/`, the HTML pages, `tools/`, `schemas/`); if content needs a site change, it stops and tells him.

A chat that was not started with that prompt, and has not been asked for content, is a website chat.

## Content

- Which units are written, and the order of the rest, is in `docs/PLAN.md` section 6.
- **Flashcards cover only what is testable** (Mr. Flauto, 2026-11-14: "The flashcards should really only focus what is testable. I dont want to confuse students."). The rule is rule 6 of `docs/CONTENT-HANDOFF.md`, with the guide's flashcard section. Any chat that edits the handoff, the guide, or the kit's briefs keeps it whole.
- The first-pass placeholder packs were deleted on 2026-11-10. Never reuse a `ph-` id: decks and tests saved on students' devices may still point at one.

## Sign-in

- **No sign-in and no scoreboard.** Mr. Flauto dropped both for now (2026-11-10). Do not build or propose them unless he raises it. The site is shared by link, and every page has a `noindex` tag to stay out of search results.
- Notes for if it comes back are in `docs/PLAN.md` section 5: school Google accounts in `thsnet.net` only, remember the device, **no Firebase**.

## Command line tool

A third tool, for Network+ only: a typed command drill. It was built one push at a time and switched on for students on 2026-11-20 by one line, `commandUnits` in `data/exams.json`, on Mr. Flauto's word. Taking that line out hides it again.

- The plan is `docs/COMMAND-LINE-PLAN.md`. **Read its section 14 first:** it says where the build stands, what waits on him, and the rules for a build chat. `docs/COMMAND-LINE-CHECKLISTS.md` has the proofs for each push.
- One push to a chat, working alone. Commit when the proofs pass. Never push to `main` without his word in that chat.
- **A day apart.** New exports are pushed at least a day before the code that imports them, and the switch at least a day after the last code push. GitHub Pages lets a browser keep a script for 10 minutes, and a new script that imports a name an old cached script does not export leaves the page on Loading.
- **His word of 2026-11-19** (section 14 of the plan): the rest of the build runs without him. It counts as his word for every push of this build, the chat that finishes phase 1c starts the content chat for the commands, and while the tool is hidden 30 minutes stand in for the day above. He gave his word for the switch the same night ("switch it on"): the last chat of the build makes it, a day after the last code push. On 2026-11-20 at 14:29 he waived the day and the class time for the switch ("Yes, switch now", section 14), so the switch chat makes it as soon as its proofs pass. The switch went out on 2026-11-20 and ended the build: a push from now on needs his word again, and the day above holds in full.
- A build chat uses ports 8081 to 8085 and 8091 to 8095 only. It never starts, stops, or opens port 8080, and its content check is http://localhost:8081/tools/validate.html. For a build chat this replaces what the Run and test section says about port 8080.
- Every change to the matcher (`assets/js/lib/command-match.js`) or its test lines (`tools/command-cases.json`) is run through the content check on port 8081 (the real packs) and port 8091 (the example pack), pushed alone, and its GitHub run is watched.
- A website chat never writes commands, tasks, outputs, questions, or the command bank's words. The content chat does, on his word, once phase 1c has given it the rules and the kit.

## Run and test

- Double-click `serve.cmd`, or start the preview server named `study-site` (`.claude/launch.json`). The site is at http://localhost:8080/.
- Content check: http://localhost:8080/tools/validate.html (same rules as `tools/validate-cli.mjs`, which GitHub Actions runs before deploying).
- **Automated browser tests use port 8081**: start the preview server named `study-site-test` and test at http://localhost:8081/. The same server also answers on 8082 to 8085, so parallel reviewers each get a port (and saved data) of their own. It serves the same files, but a different port is a different site to the browser, so tests never touch the decks, tests, and history Mr. Flauto has saved on port 8080. Never clear or seed saved data on port 8080.
- **Test data uses ports 8091 to 8095**: start the preview server named `study-site-fixture`. It serves the same site files, but on each of those ports a request under `data/` is answered first from one folder of `tools/test-data` (the port list is in `tools/test-data/README.md`). That is how the Command line tool (`docs/COMMAND-LINE-PLAN.md`) is tested before launch without changing `data/exams.json`. Test data never goes under `data/`, and ports 8080 to 8085 never serve it. Everything in `tools/test-data` is fake test data with plainly fake wording, never content: nothing in it is ever copied into a pack.
- As of November 10, 2026 this PC has Git and the GitHub CLI (`gh`, signed in to the account that owns the repository), but no Node or Python. Check before assuming a tool exists. In a chat that was already open when Git was installed, the tools may be missing from `PATH`: they are in `C:\Program Files\Git\cmd` and `C:\Program Files\GitHub CLI`.
- **Published** at https://l-e-f-t.github.io/Mr-Flautos-Study-Material-Site/ (repository `L-E-F-T/Mr-Flautos-Study-Material-Site`). Every push to `main` runs the content check and redeploys; other branches do not deploy.

## Conventions

- **The UI is labels, not instructions.** No how-to paragraphs, tips, welcome text, or "check back soon" filler. If a control needs explaining, rename the control. Keep every label as short as it can be.
- **No emoji or symbol characters in the UI** (no party poppers, books, flames, check marks, or arrow glyphs). Use `icon()` from `assets/js/lib/dom.js` or a CSS shape, and pair every icon with text. A command prompt (`C:\>`, `$`, `Router#`, `Switch#`) is not a symbol: it is the system's own text, set in code.
- **Anything without content is labeled "Coming soon", and the site works that out from the data.** An exam that is not `live`, a study mode with no packs (home card), any unit, lesson, domain, or objective with no items (both pickers), and any bullet with no questions (the practice-test list by objective, the only list that shows bullets). A tool an exam does not have is not shown at all (Command line without `commandUnits` in `data/exams.json`), and inside Command line a unit with no commands, the Extra commands control, and the Command bank of a system with no bank entry read Coming soon until they have content. Never type "coming soon" into a data file, and never leave an empty state that says anything else. The one exception: a unit marked `"notOnExam": true` in `units.json` (A+ Core 1 Unit 1.0, by Mr. Flauto's choice) reads "Not on the exam" instead, and its lessons inherit it.
- **No scores on the home page.** The home card only links to the study modes and offers Resume deck / Resume test. Network+ has a third button, Command line, on a row of its own, and still no score. A minus at the right end of each Resume button discards it: the first click turns the minus red, a second click on the red minus discards. The same two-click minus (`assets/js/components/discard-button.js`) dismisses the practice page's Last test banner and discards its Test in progress banner, and discards one test in Recent history; reuse it for any other discard. That minus is the one icon without text and the one red outside right and wrong, by Mr. Flauto's choice. Scores and trends live in the Recent history panel on the practice page (`assets/js/components/history-panel.js`, log written by `assets/js/lib/progress.js`). It is called "Recent" because the browser can clear it; never label it as if it were kept for good.
- Every page must work on a phone (320px wide, touch) and in both light and dark mode.
- Colors are tokens in `assets/css/site.css`. Light/dark is `<html data-theme>`; course color is `<html data-exam-theme>`.
- **The class color is the highlight color.** Main buttons, checked controls, selection, hover, and focus all use the `--accent*` tokens (A+ graphite, Network+ green, Security+ teal-navy). Never hard-code another emphasis color. Green and red mean right and wrong only.
- Hover styles live in one `@media (hover: hover)` block so they never stick after a tap on a phone.
- Text from data files is inserted as text nodes (`h()` in `assets/js/lib/dom.js`), never as HTML.
- House style for student-facing text: plain 10th-grade wording, no em dashes, citations read "Reading 3.2.6".
- All URLs are relative: the site runs from a sub-path on GitHub Pages and later from a lab server.
