# CompTIA Cert Prep: the plan

_Last updated 2026-11-20._

_The third tool, Command line, a typed command drill for Network+ only, was switched on for students on 2026-11-20 (`commandUnits` in `data/exams.json`). This plan describes it in brief. Its build plan is `docs/COMMAND-LINE-PLAN.md`, whose section 14 says how the build went and what waits on you._

## 1. What this is

A study site for Mr. Flauto's CompTIA classes (A+ PC Tech 1, Networking+ 1, CompTIA Security+ 1). Three tools, the third only on an exam that has it:

- **Flashcards.** Pick terms from a table grouped by exam objective or by textbook unit, build a personal deck, flip, shuffle, and take cards out as you learn them.
- **Practice test.** Pick units/lessons or domains/objectives/sub-objectives and a question count. Students never pick exact questions: they get a random draw from what they chose. Multiple choice only, with immediate right/wrong feedback. Instead of an explanation, each answer shows where the textbook covers it ("Reading 3.2.6 RAID 0 and RAID 1") and a quote from the book. At the end, the missed questions are listed with a button to retry them.
- **Command line** (Network+ only, switched on 2026-11-20). One exam-style task at a time, above a prompt for the system it names (Windows, Linux, Router, Switch). The student types the command: a right one prints example output and the reading, a wrong one costs one of two tries, and a slip that is not a recall mistake costs nothing. A few commands ask a question about the output. An exam has the tool only when its entry in `data/exams.json` has `commandUnits`.

Order: A+ Core 1 first (finished 2026-11-14), then Network+ (Units 6.0, 5.0, and 4.0 first; Mr. Flauto decides the rest), then Core 2 and Security+. Hosting: GitHub Pages first, the school lab equipment later.

**Who does what.** Website chats build the site. Questions and flashcards are written in a separate content chat and dropped into `data/`. `docs/CONTENT-GUIDE.md` is the contract between the two, and `docs/CONTENT-HANDOFF.md` is the prompt that starts the content chat.

## 2. Where things stand

| Area | Status |
|---|---|
| Flashcards: term table, search, deck (flip, next, take out, shuffle, put back), saved on the device | Built and tested |
| Practice test: topic picker, random draw, instant feedback, reading reference and quote, choose-two questions, resume after refresh | Built and tested |
| Results: score, review of the missed questions or the full test (right, missed, not answered), "Retry missed" rounds, breakdown by lesson or objective | Built and tested |
| Recent history: every finished test is logged on the device with the date and time it finished; a side panel shows recent scores, a breakdown by textbook unit and lesson or by exam domain and objective (a switch), and the tests by date with each one's time, a View button that shows the whole test again, and a two-click minus that discards that test | Built and tested |
| Command line (Network+ only): a drill of typed commands picked by unit, two counted tries, no try lost on a slip that is not a recall mistake, example output and the reading, a question about the output on three commands, a Command bank (a right command after opening it reads Correct with bank), results with Retry missed, and the drill saved on the device | Built and tested; switched on for students 2026-11-20 |
| Home: **Resume deck** and **Resume test** buttons when one is unfinished on the device, each with a minus that discards it (one click turns it red, a second click discards) | Built and tested |
| "Coming soon" labels on anything without content (exam, study mode, unit, lesson, objective, and inside Command line a unit or the extra set with no commands) | Built and tested |
| Light and dark mode toggle (follows the device until the student chooses) | Built and tested |
| Phone layout: two-row header (on a page with three tabs, the tabs have a row of their own up to 740 px wide), docked Build/Start bar, finger-size targets, no sideways scrolling at 320 px | Built and tested |
| UI cleanup: no emoji, labels instead of instructions | Done |
| A+ Core 1 outline: 27 objectives and 131 bullets (official v4.0), 10 units, 32 lessons, 223 reading sections | Done |
| Network+ outline: 25 objectives and 135 bullets (N10-009, transcribed twice and compared), 14 units, 67 lessons, 206 reading sections in Units 1.0 to 7.0 (Units 8.0 to 14.0 get theirs once printed) | Done (2026-11-15) |
| Local test server (`serve.cmd`), content check, quote helper, GitHub Pages deploy file | Done (first deploy ran 2026-11-10) |
| **Content** | **A+ Core 1 is finished: Units 2.0 to 10.0 written** (Unit 1.0 is not on the exam). Unit 3.0 (2026-11-10): 62 questions (8 choose-two or choose-three) and 61 flashcards. Unit 2.0 (2026-11-12): 44 questions (1 choose-two) and 39 flashcards. Unit 5.0 (2026-11-12): 58 questions (3 choose-two) and 66 flashcards. Unit 6.0 (2026-11-12): 55 questions (6 choose-two or choose-three) and 49 flashcards. Unit 4.0 (2026-11-13): 72 questions (6 choose-two) and 51 flashcards. Unit 7.0 (2026-11-13): 39 questions (none choose-two) and 25 flashcards. Unit 8.0 (2026-11-14): 32 questions (1 choose-two, 1 choose-three) and 25 flashcards. Unit 9.0 (2026-11-14): 58 questions (3 choose-two, 1 choose-three) and 51 flashcards; two questions are written from the reading, where the exam asks a fact no pool or Messer item covers. Unit 10.0 (2026-11-14): 54 questions (2 choose-two) and 65 flashcards; nine questions are written from the reading the same way, and its cards cover only testable terms. All nine are weighted by exam evidence, keyed to the reading, and checked by independent agents. None is marked reviewed yet; book quotes still to add. The placeholder packs are deleted. Unit 1.0 reads "Not on the exam". **Network+ is live with Units 3.0, 4.0, 5.0, and 6.0.** Unit 3.0 (2026-11-21): 58 questions (5 choose-two or choose-three) and 41 flashcards; one of its questions comes from your Unit 3.0 study guide, where the exam asks a fact no pool or practice exam item covers. Unit 6.0 (2026-11-15): 107 questions (13 choose-two or choose-three, 4 with an exhibit) and 69 flashcards; five questions were added on 2026-11-20, three of them from your new Unit 6.0 Blooket, where the exam asks a port no pool or practice exam item covers. Unit 5.0 (2026-11-15): 74 questions (10 choose-two or choose-three, 8 with an exhibit) and 49 flashcards; two of its questions come from your Unit 5.0 review deck, where the exam asks a fact no pool or practice exam item covers. Unit 4.0 (2026-11-15): 61 questions (9 choose-two or choose-three, 5 with an exhibit) and 44 flashcards; one of its questions comes from your Unit 4.0 Blooket, where the exam asks a fact no pool or practice exam item covers. All four units are weighted by the practice exam book's evidence, keyed to the CertMaster 9.1 reading, and checked by independent agents; not reviewed yet, quotes still to add. Its Command line has 25 commands for Units 4.0 to 6.0 (2026-11-20: 19 Windows, 3 Linux, 3 router or switch), each the typed form of a published question or card, and a command bank of 13 commands and 51 switches; not reviewed yet, quotes still to add. Its other units say "Coming soon", as do Core 2 and Security+. |
| Kept out of search results ("do not list" tag on every page) | Done |
| Sign-in and scoreboard | **Not building for now** (decided 2026-11-10). Notes for later are in section 5. |
| Published anywhere | Yes, since 2026-11-10: https://l-e-f-t.github.io/Mr-Flautos-Study-Material-Site/ (repository `L-E-F-T/Mr-Flautos-Study-Material-Site`, public). Every push to `main` runs the content check and redeploys. |

## 3. Site layout

### Pages

```
Home (index.html)                 the exams; exams not built yet show "Coming soon"
├─ Flashcards (flashcards.html)   1. choose terms   2. your deck
├─ Practice test (practice.html)  1. topics and number of questions   2. questions   3. results
│                                 Recent history side panel (opens from 1 and 3)
└─ Command line (commands.html)   1. units and number of commands   2. commands   3. results
                                  only for an exam with commandUnits (Network+)

Teacher tools (local only, never published)
├─ tools/validate.html            content check
└─ tools/quotes.html              quote helper
```

Each exam uses the same pages with `?exam=…` in the address, so adding Core 2, Network+, or Security+ adds no new pages. Command line serves only an exam that has `commandUnits`: for any other exam its address goes to the home page, and it has no tab and no button.

### Header

- **Wide screens:** a home icon and the site name, the exam name and code, then the Flashcards / Practice test tabs (and Command line, on an exam that has it) and the light/dark button on the right.
- **Phones:** two rows. Row 1 is the home icon and the exam name. Row 2 is the two tabs, full width, with the light/dark button at the end.
- **Pages with three tabs** keep two rows up to 740 px wide: row 1 is the home icon, the exam name, and the light/dark button, and row 2 is the three tabs. At 320 px Practice test and Command line wrap to two lines; from 360 px all three fit on one line. Pages with two tabs keep the header above.

### Each page, top to bottom

| Page | Layout |
|---|---|
| Home | One card per exam, filled with that exam's class color, with Flashcards and Practice test buttons on live exams. An exam that has Command line gets a third button, Command line, on a row of its own (it reads Coming soon until the exam has a command pack). When a deck or a test is unfinished on the device, **Resume deck** and **Resume test** sit above them, one row each, and go straight back in. A minus at the right end of each discards it: the first click turns the minus red, and a second click on the red minus discards, leaving the card as a new student sees it. No scores are shown here. |
| Flashcards: choose terms | Group-by switch (exam objective, the default, or textbook unit), search, then the term table with a checkbox per term and per group. A bar docked to the bottom of the screen shows the number selected and holds **Build deck**. |
| Flashcards: your deck | Title and counts on one line, the card, four main buttons (Previous, Flip, Next, Take out), then the secondary ones (side shown first, Shuffle, Put all back, Choose cards), then the taken-out list. |
| Practice: setup | **Recent history** button beside the title. Above the topics, a banner when there is one: **Test in progress** (Resume, and the two-click minus that discards it) or **Last test** (the score, **Results**, and the two-click minus that dismisses it; the test stays in Recent history). **Topics** (tree by exam objective, the default, or by textbook unit, with question counts; the page remembers the switch only once a student uses it) and **Questions** (how many). On wide screens they sit side by side; on phones Questions follows Topics and **Start** is docked to the bottom of the screen. |
| Practice: question | Progress and running score, the question, the choices, **Check**, then right/wrong with the reading reference, then **Next**. |
| Practice: results | Score, then **Review** with a **Missed (N) / Full test (M)** switch. Missed: each missed question as the student saw it, with their pick, the right answer, and the reading. Full test: every question in order, tagged **Right**, **Missed**, or **Not answered**, each with the same marks and reading. **Retry missed** sits above and below the list and starts a round of only those questions; rounds repeat until nothing is missed. Then the breakdown by lesson or objective, with a bar that is green for the share correct and red for the share missed. **Recent history** sits with New test and Change topics. |
| Recent history (side panel) | Named "Recent" because it lives in the browser's saved data, which a device can clear. Slides in from the right; full screen on phones. Closes with Close, Escape, a tap outside, or the Back button. Top to bottom: tests taken, average, and the latest score (or the last 5 with Up/Down/Steady once there are more than five); **Recent scores**, one bar per test; the breakdown, with a **Exam objective / Textbook unit** switch in its header (it starts the way the practice setup picks topics, then remembers the student's pick on the device): **By unit**, each unit opening to its lessons, or **By domain**, each exam domain opening to its objectives, with percent, a green/red bar, the count, and its own trend, and the weakest lesson or objective called out; **Tests by date**, newest first: a heading per day ("Tue, Nov 10"; the year shows for older tests), then one row per test with its time, score, **View** (shows the whole test in the panel: every question tagged Right, Missed, or Not answered, with the right answer and the reading, then **Back**; only on tests that kept their questions), and the two-click minus that discards that test, and under them the count, the lessons or objectives it covered (following the switch; scores in a tooltip), and a Retry or Ended early tag; **Clear history**. Retry rounds are listed but left out of the averages. |

### Rules every page follows

- **Labels, not instructions.** No how-to paragraphs, tips, or welcome text. If a control needs explaining, rename the control.
- **No emoji or symbol characters.** Right/wrong marks and arrows are drawn icons, so they look the same on every device.
- **Anything without content says "Coming soon".** The site works this out from the data, so nobody types it: an exam whose status is not `live`, a study mode with no packs (on the home card), any unit, lesson, domain, or objective with no items (in both pickers), and any bullet with no questions (in the practice-test list by objective, the only list that shows bullets). Those rows are greyed out and cannot be picked. A tool an exam does not have is not shown at all (Command line without `commandUnits` in `data/exams.json`), and inside Command line a unit with no commands and the Extra commands control read Coming soon until they have commands. A unit marked `"notOnExam": true` in `units.json` (A+ Core 1 Unit 1.0) reads "Not on the exam" instead.
- Works at 320 px wide with no sideways scrolling, and with touch (targets sized for fingers).
- Works in light and dark mode. The choice is remembered on the device; until a student chooses, the site follows the device setting.
- **The class color is the highlight color.** Main buttons, checked boxes, the selected option, the picked answer, hover and focus highlights, and the exam cards on the home page all use it: A+ warm graphite `#55504A`, Network+ forest green `#15654A`, Security+ teal-navy `#0B4F6C` (from the class slide decks). In dark mode the fill is the same hue lifted slightly so white text on it stays readable. Green and red are reserved for right and wrong; the one exception is the two-click minus (home card, practice page banners), which turns red before it acts.
- Keyboard and screen-reader friendly (focus is managed after every action, results are announced, right/wrong never depends on color alone).

## 4. How it is built

**Static site, no build step.** Plain HTML, CSS, and JavaScript modules, with all content in JSON files. There is nothing to compile and nothing to keep updated, any web server can host it (GitHub Pages now, the lab server later), and it makes no outside requests, so it works on a filtered school network.

**Content model.** Each exam has two outlines and any number of packs:

```
objectives.json   1.0 domain → 1.1 objective → 1.1.a bullet      (CompTIA, verbatim)
units.json        3.0 unit   → 3.2 lesson    → 3.2.4 section     (CertMaster Learn, verbatim)
questions/*.json  packs of questions, tagged with objective ids and reading-section ids
flashcards/*.json packs of term/definition pairs, tagged the same way
commands/*.json   packs of typed commands for Command line, tagged the same way (Network+)
```

Items can be tagged at any level and the pickers roll tags up: a question tagged `3.2.6` appears under lesson 3.2 and unit 3.0. The counts beside every checkbox come from the tags, so the site always shows what exists and labels what does not yet "Coming soon".

**Saved progress.** Decks, unfinished tests, the test history, Command line's setup and drill (the lines typed, the output version shown, and the answer to its question), and the light/dark choice are saved in each student's browser. Nothing leaves the device. Every checked practice-test answer and every finished test passes through one module (`assets/js/lib/progress.js`), which is where sign-in and a scoreboard would plug in. A Command line drill does not: it writes nothing to the test history.

**Test history.** When a test ends, one entry is added to a log on the device: the date and time it finished, the score, and a tally per unit, lesson, exam domain, and objective (whichever way the topics were picked; tests logged before 2026-11-12 have no domain tally, so the panel adds up their objectives instead). The latest 30 tests also keep every question (its choice order and the student's pick) so **View** can show the whole test again; older tests keep only their totals, and tests logged before 2026-11-13 have no questions to view. The log keeps the latest 200 tests per exam. The Recent history panel (`assets/js/components/history-panel.js`) reads it; the two-click minus on a test takes that one test out, and **Clear history** empties it.

**Content check.** One set of rules (`assets/js/lib/validate-core.js`) checks ids, tags, answer keys, references, quote length, house style, copied items, and placeholder packs. It runs in the browser at `tools/validate.html` and on GitHub before each deploy. Errors block the deploy.

**Placeholder flag.** A pack marked `"placeholder": true` loads normally so the site can be tested, but the site shows a "Test content" banner, the content check says "not ready for students", and its items do not count as written content.

## 5. Sign-in and scoreboard (not building for now)

**Decision, 2026-11-10: the site launches with no sign-in and no scoreboard.** Both are dropped for now. This section is kept as notes for when the question comes back.

Why they were dropped:

- **Keeping non-school visitors out** matters little here. The content is practice questions written for the class, not anything private, and the link only goes out through Google Classroom. Every page carries a "do not list" tag so search engines skip the site.
- **The scoreboard** was the real reason to have accounts. It depends on school IT, adds something to keep running, and means storing student names and scores.

What is in place instead: each student's own test history and trends are kept on their device with no account. Nothing built so far has to change to add sign-in later, because answers are recorded in one place in the code. A natural time to revisit is when the lab server is up: a server can require school Google sign-in for the whole site before any page loads, which is simpler and stronger than doing it inside the page.

### What was wanted, if it is ever built

1. Students sign in with their school Google accounts (`thsnet.net`).
2. Only accounts in the school's domain can sign in and see the site.
3. The device is remembered: after the first sign-in, no asking again.
4. A scoreboard of correct answers.
5. Google only, no Firebase.

### The Google-only design

_Researched against Google's documentation on 2026-11-10. Re-check before building: these rules change._

"Sign in with Google" needs no Firebase, only a free client ID from Google. But a sign-in button alone only hides the pages on a static site: the question files stay public, and there is nowhere to keep scores. Something has to check the sign-in before handing over data. The Google-only way to do that is **Google Apps Script with a Google Sheet** in your school Drive:

- The student taps **Sign in with Google** and picks their school account.
- A small Apps Script checks with Google that the account is real and in `thsnet.net`, then hands the site the questions and records scores.
- Scores land in a Google Sheet you own, so you can open, sort, and export them. Student names and scores stay inside the school's Google Workspace.
- The site remembers the device after that first sign-in, until the student signs out or the browser's saved data is erased.

What it costs:

- **School IT has to allow it.** Google blocks students under 18 from signing in to apps the school has not approved (Admin console → Security → Access and data control → API controls), and the script has to be reachable from the site. Both are settings only the school's Google admin can change.
- Sign-in, loading questions, and the scoreboard each take a second or two (Apps Script is slow), and it handles about 30 requests at the same moment, so the site would keep a copy of the questions on the device.
- More to build and maintain than anything else on the site: about three days of work, plus the Apps Script to keep an eye on.

Where the device forgets, on any design: iPhone Safari after 7 days without a visit, private windows when closed, and Chromebooks that IT wipes at sign-out. Signing back in is one tap.

### Other routes

| Option | What you get | Catch |
|---|---|---|
| Whole site as a Google Apps Script web app limited to `thsnet.net` | Google itself enforces the domain; nothing for IT to approve; scores in a Sheet | The site has to be repackaged to live inside Apps Script, with a long Google address, and it no longer runs from GitHub Pages or the lab server |
| Lab server with a sign-in proxy | Whole site locked to school Google accounts on school hardware; remembered for about a year | Needs the lab server reachable from student devices |
| Firebase (Google's app service) | Sign-in, a real lock, and a fast scoreboard with the least custom code | A separate Google service with its own console; ruled out for now |

Open question for IT if this goes ahead: is `ths.org` an alias of `thsnet.net` in Google Workspace, and which one do student accounts report as their domain?

## 6. Roadmap

**Website (this folder)**

1. Done: flashcards, practice tests, missed-question retry, light/dark toggle, phone layout, placeholder flag, UI cleanup, test history panel, resume buttons, "Coming soon" labels.
2. Done (2026-11-10): Git and the GitHub CLI installed, repository created, Pages set to "GitHub Actions", first deploy passed.
3. Done (2026-11-20): Command line, a typed command drill for Network+, built from 2026-11-19 and switched on for students on 2026-11-20 (`docs/COMMAND-LINE-PLAN.md`, section 14).
4. Later ideas: exam mode (90 questions in 90 minutes, weighted by domain, feedback at the end), a "practice this lesson" button on the weakest lesson in Recent history, add-to-Home-Screen and offline support, CSV import so items can be written in a spreadsheet.

**Content (separate chat)**

1. Done: A+ Core 1 Unit 3.0 (2026-11-10: 62 questions, 61 flashcards; placeholder packs deleted), Unit 2.0 (2026-11-12: 44 questions, 39 flashcards), Unit 5.0 (2026-11-12: 58 questions, 66 flashcards), Unit 6.0 (2026-11-12: 55 questions, 49 flashcards), Unit 4.0 (2026-11-13: 72 questions, 51 flashcards), Unit 7.0 (2026-11-13: 39 questions, 25 flashcards), Unit 8.0 (2026-11-14: 32 questions, 25 flashcards), Unit 9.0 (2026-11-14: 58 questions, 51 flashcards), and Unit 10.0 (2026-11-14: 54 questions, 65 flashcards). A+ Core 1 is finished.
2. Each unit was written in its own chat (started with `docs/CONTENT-HANDOFF.md`), which read `docs/CONTENT-NOTES.md` first and added to it before it ended, committed its unit on `main`, and asked before pushing.
3. Unit 1.0 gets no pack, and the site labels it "Not on the exam" (`"notOnExam": true` in `units.json`, 2026-11-14). Its troubleshooting methodology is not tested directly: the 220-1201 objectives say "the methodology itself will not be tested", and CertMaster 1.2.1 says it is not tied to an exam objective. The exam uses it only inside Domain 5 scenarios ("which should the technician do FIRST?"), and those questions belong to the units that teach the hardware.
4. You read each unit on the local site, add the book quotes with the quote helper, and mark the pack reviewed.
5. Network+ (N10-009): Unit 6.0 done (2026-11-15: 102 questions, 69 flashcards; five more questions on 2026-11-20, so 107), then Unit 5.0 (2026-11-15: 74 questions, 49 flashcards), then Unit 4.0 (2026-11-15: 61 questions, 44 flashcards), then Unit 3.0 (2026-11-21: 58 questions, 41 flashcards; its Command line pass, for the device show commands, is next, in a chat of its own). The 25 Command line commands of Units 4.0 to 6.0 were written on 2026-11-20 in a Command line pass, and the command bank in a Command bank pass. Unit 6.0's chat also built the exam's outline: `objectives.json` from B.1.3, transcribed twice and compared, and `units.json` for all 14 units (Units 8.0 to 14.0 get their sections once you print them). You decide which Network+ unit comes next; Core 2 and Security+ after that, one exam at a time. The handoff was rewritten for Network+ on 2026-11-14 after a six-part audit.

**Hosting and more exams**

- Lab hosting: copy the folder to the lab server and serve it with IIS (Windows Server) or Caddy/nginx (Linux). Lab-only packs live only there.
- Core 2, Network+, Security+: add a data folder per exam (objectives, units, packs) and switch its status to `live`. No code changes. The same holds for Command line: an exam gets it once it has command packs and a website chat adds `commandUnits` to its entry in `data/exams.json`.
  - Security+: SY0-701 (your class) retires June 11, 2027. SY0-801 was expected to launch about November 17, 2026. Build SY0-701 first and add SY0-801 as a second entry when you switch.
  - Network+: N10-009 is current; N10-010 objectives are only in draft.
  - Core 2 (220-1202): Modules 11 to 22 of CertMaster Learn; domains weigh 28 / 28 / 23 / 21 %.

## 7. Decisions on record

1. **Questions are rewritten as variations, never copied** ("a cousin, not a copy"). A published site is public, and each item records its source. The content check blocks any item marked as copied outside a lab-only folder.
2. **Answer keys come from the reading.** The CertMaster pool export has no key.
3. **Book quotes are added by you.** Each question carries the section and a search phrase; the quote helper opens that section's PDF beside the question. Quotes are capped at 40 words.
4. **Citations match your papers:** "Reading 3.2.6", no product name.
5. **"Select all that apply" becomes "Choose two/three."** The real exam always states the count. A practice-exam item whose key gives only one answer becomes a one-answer item, and one with four or more answers is used only if it still works as a choose two or three (2026-11-14).
6. **Lab-only packs** (`private/` folders) hold anything that must never be public. Git ignores them and the deploy step strips them.
7. **Content is written in a separate chat** and anything first-pass is flagged as placeholder until you approve a replacement.
8. **The UI is labels only:** no emoji, no how-to text.
9. **No sign-in and no scoreboard for now** (2026-11-10). The site is shared by link and kept out of search results. If sign-in is ever built: Google only, no Firebase.
10. **No saved score on the home page** (2026-11-10). Scores live in the Recent history panel on the practice page; the home card only offers to resume.
11. **Anything without content is labeled "Coming soon"** (2026-11-10), worked out from the data.
12. **The exam leads, the reading keys, your materials support** (2026-11-10). What each unit covers, and how much, follows the CompTIA objectives and evidence of what the exam asks (each exam's keyed practice exam: the Messer practice exams for A+ Core 1, the practice tests book for Network+; Domain 5 links), and questions are written the way the exam presents them. The CertMaster reading decides every answer. Your study guides, slides, and Blookets corroborate the keys and fill gaps; they never set the weight.
13. **Flashcards cover only what is testable** (2026-11-14). A term gets a card only when the unit's reading teaches it and it passes one of three tests: the objectives name it; they name a group it is one kind of without listing the group's members; or a keyed practice-exam item asks about it or has it as its correct answer (never only a wrong choice, an explanation, or a mention in a scenario or command output). The full rule is `docs/CONTENT-HANDOFF.md` rule 6 and the guide's "Which terms get a card". Reading-only detail stays off the backs too. A fourth card check, the testable check, enforces it.
14. **The re-check loop stops after three rounds** (2026-11-14). Whatever the third round still flags is dropped and listed in the unit's report; every changed question still gets a blind key check.
15. **Network+ command-output questions carry a short text exhibit** (2026-11-14), written fresh for each question and never copied from a source.
16. **A lesson's objectives, for Network+, are its "Exam Objectives Covered" box plus every objective CertMaster's Lesson Index (B.1.3) ties to it** (2026-11-14).
17. **Command line, a typed command drill, for Network+ only** (2026-11-19, switched on 2026-11-20). Its launch set is every command line a published Network+ question or card already asks, each read through that item's source, so a source item is still used once per exam; other lines the reading teaches wait for your word as an extra set. It accepts what the real system accepts, with two counted tries, and a wrong command prints no output. An exam has the tool only when its entry in `data/exams.json` has `commandUnits`. The rules for writing commands are the guide's "A command (the Command line tool)" (2026-11-20).
18. **The command bank** (2026-11-20). Under each command, closed until the student opens it: the commands the tool covers on that system, with every switch the reading teaches. A right command after opening it reads Correct with bank, does not count on the first try, and comes back in Retry missed.
19. **A Windows switch one letter off costs no try** (2026-11-20). The tool reads it as Misspelled switch and keeps the line in the field. A Linux switch or a device word one letter off still costs a try.

## 8. What I need from you

**Publishing:** done 2026-11-10. The repository is owned by the `L-E-F-T` GitHub account. To move it to a school-owned account later, use GitHub's repository transfer; the site address changes with the owner.

## 9. Tools to install

All are free and install from a terminal with `winget` (already on this PC). Run the lines one at a time:

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id Python.Python.3.12 -e
```

| Tool | Why |
|---|---|
| **Git** | Required to push to GitHub. It also gives full history and an undo for every edit, and lets Claude commit and push for you. |
| **GitHub CLI (`gh`)** | Lets Claude create the repository, turn on Pages, and watch deploys without you clicking through settings. |
| **Node.js LTS** | Runs the same content check GitHub runs before you push, and unlocks automated browser tests. |
| **VS Code** | Edits the JSON files with live error highlighting (already wired up in `.vscode/settings.json`) and spell-check for question text. |
| **Python 3** | Your current `python` is only a Microsoft Store shortcut. Real Python makes PDF and question-pool processing simpler. |
| GitHub Desktop (optional) | A point-and-click way to commit and push: `winget install --id GitHub.GitHubDesktop -e` |

Also worth doing: apply for **GitHub Education as a teacher** (free private repositories; the published Pages site is public either way).

## Appendix: A+ Core 1 source material on hand

| Source | What it gives | Notes |
|---|---|---|
| CertMaster Learn 15.0 printout (`CompTIAA+\Book\bySubunit`, 581 pages) | The reading: 223 sections | Section numbers skip where CertMaster has a video, lab, or activity |
| CertMaster question pool (`2.0.txt` to `10.0.txt`) | 659 items: 580 single answer, 79 multiple response | No answer key. Items run in lesson order. No pool for Unit 1. |
| Professor Messer 220-1201 Practice Exams v1.12 | 255 multiple-choice items (plus 15 performance-based, not used) | Key, explanations, and an objective tag on every item |
| CompTIA 220-1201 objectives v4.0 | The objective tree | Domain weights: 13 / 23 / 25 / 11 / 28 % |
