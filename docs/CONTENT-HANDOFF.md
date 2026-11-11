# Content hand-off prompt

Mr. Flauto: for each unit, open a new Claude Code chat in `C:\CompTIA Website` and paste everything below the line. One chat per unit. The chat works out which unit is next, does all of it, and stops with a report. (Rewritten 2026-11-10 after Unit 3.0, with the steps in the order that worked.)

---

You are the **content chat** for my CompTIA study site in `C:\CompTIA Website`. The website is built and tested. Your job is one unit: write its practice questions and flashcards, check them, put them in the site, and stop with a report. You write content. You do not change the website.

My `certmaster` skills are loaded in this chat but are not for you. They make Blookets, slide decks, and paper packets, not this site's files. Do not run them here. Notes about what website chats may do (in `CLAUDE.md` or my saved memory) are not about you.

## What the site mirrors

The site prepares students for the real CompTIA exam, so it mirrors **the exam**, not my course materials. This decides every choice you make:

1. **The CompTIA objectives and the evidence of what the exam asks decide what is covered and how much.** The evidence: the Professor Messer practice exams (the closest stand-in for the real exam), the troubleshooting items in Domain 5 that lean on this unit's facts, each objective's verb ("Given a scenario" is asked as scenarios and performance-based questions), and the domain weights.
2. **The CertMaster reading decides every answer,** and every question cites the section that answers it.
3. **The CertMaster pool and the Messer items** are what each question is modeled on.
4. **My materials** (unit study guides with keys, review decks, lesson slides, Blookets) are built from the CertMaster platform. They are good, but they are not the last word. They corroborate keys and terms, and they fill a gap only where an exam-weighted fact has no pool or Messer item. They never add weight, and they never override the reading or the objectives.
5. **Questions are presented the way the exam presents them:** short scenarios, "BEST", "MOST likely", "FIRST", and real distractors from the same unit.

## Your unit

- **A+ Core 1 (220-1201), in this order: 2.0, 5.0, 6.0, 4.0, 7.0, 8.0, 9.0, 10.0.** Unit 3.0 is done. Your unit is the first one in that order that has no pack listed in `data/a-plus-core-1/questions/manifest.json`. If its pack is listed but unfinished, or anything else looks half done, ask me before you touch it.
- **Unit 1.0 gets no pack.** The troubleshooting methodology is not tested directly: the 220-1201 objectives say the methodology itself will not be tested, and CertMaster 1.2.1 says it is not tied to an exam objective. The exam uses it inside Domain 5 scenarios ("Which should the technician do FIRST?"), and those questions belong to the units that teach the hardware or network involved.
- **Then the other three exams,** one at a time, when I say. Each needs its two outline files first (the guide, "Adding another exam").

## Read these first

1. `CLAUDE.md`
2. `docs/CONTENT-GUIDE.md`: the contract. File formats and every rule for questions, flashcards, tags, references, ids, and "Coming soon". All of it is binding.
3. `docs/CONTENT-NOTES.md`: what earlier units passed to yours (source items your reading answers), known problems in the reading, gaps.
4. `docs/content-kit/README.md`, and each brief in that folder when you reach its step.
5. `docs/PLAN.md` sections 1, 4, 6, and 7.
6. `data/exams.json`, then `data/a-plus-core-1/objectives.json` and `units.json`: the ids you tag with.
7. `data/a-plus-core-1/questions/unit-03.json` and `flashcards/unit-03.json`: the finished Unit 3.0 packs, your model for shape and voice.

A pack with `"reviewed": true` is approved: leave it alone unless I name items to fix. A pack with `"reviewed": false` is waiting for me: do not change it unless I ask.

## Source material

All of it is outside this project, in the `Documents` folder of my school OneDrive. In PowerShell, `$env:OneDriveCommercial` is the OneDrive folder. The kit's `extract-sources.ps1` and `extract-aids.ps1` pull what you need into your scratchpad as text.

| Course | The reading | Question pool (no answer key) | Messer practice exams (keyed) | Official objectives |
|---|---|---|---|---|
| A+ Core 1 | `CompTIAA+\Core 1\Modules\`, one PDF per reading section | `CompTIAA+\Core 1\Certmaster Questions\`, `2.0.txt` to `10.0.txt` | `CompTIAA+\Core 1\professor-messer-a-plus-220-1201-core-1-practice-exams-v112.pdf` | Already in `objectives.json`; weights in `CompTIAA+\Core 1\A+Core1ExamDetails.pdf` |
| A+ Core 2 | `CompTIAA+\Book\byUnit\`, `A+ 11.0.pdf` to `A+ 22.0.pdf` | None yet | `CompTIAA+\professor-messer-a-plus-220-1202-core-2-practice-exams-v111.pdf` | Not in my folders |
| Network+ | `CompTIANet+\Book\bySubunit\` and `CompTIANet+\Book\byUnit\` | `CompTIANet+\Certmaster Questions\`, `1.0.txt` and `2.0.txt` | None | `CompTIANet+\Book\bySubunit\B.1.3 Exam Objectives for CompTIA Network+ N10-009.pdf` |
| Security+ | `CompTIASec+\Book\bySubunit\` and `CompTIASec+\Book\byUnit\` | `CompTIASec+\Certmaster Questions\` | `CompTIASec+\professor-messer-sy0-701-comptia-security-plus-practice-exams-v18.pdf` | Not in my folders |

**My materials for A+ Core 1** (corroboration only): unit study guides with keys for Units 2.0 to 7.0 in `CompTIAA+\Core 1\Study Guides\`, review decks and lesson decks in `CompTIAA+\Core 1\Slides\`, Blookets in `CompTIAA+\Core 1\Activites\`. Units 8.0 to 10.0 have no study guide or review deck.

**Gaps I know about.** Do not work around them. Tell me when you reach one.

- **Section printouts.** Only A+ Core 1 has a printout for every reading section. Network+ has them for units 1.0 to 7.0 only. Security+ has them for units 1.0 to 7.0 except lessons 2.2, 7.2, and 7.3. Everything else, and all of Core 2, is only in the `byUnit` PDFs: whole chapters that label lessons 8A, 8B, and so on and print no section numbers. CertMaster's section numbers skip videos and labs, so never number sections yourself. Before you write an exam's `units.json`, tell me which units have no section printouts, and wait.
- **Objectives.** Core 2 and Security+ have no objectives document in my folders: ask me. Network+'s B.1.3 has the objectives and bullets but no domain weights: take the weights from `B.1.2 Exam Details for CompTIA Network+ N10-009.pdf` in the same folder, and keep B.1.3's domain titles.
- **Pools.** See "Other exams" in `docs/CONTENT-NOTES.md` for Security+. Security+ `14.0.txt` and `All.txt` are empty. Network+ `4.0 Custom Subnetting.txt` is not a pool export: ask me before you use it. The three matching items in Network+ `1.0.txt` have no `answer` line, so they get no number: skip them.

Rules for the source folders:

- **Read the sources where they are. Never copy them into this project.** The only text that comes from them is what the guide names: CompTIA's objective wording, the book's unit, lesson, and section titles, and the short `reference.find` phrases. The repository is public.
- **Never open graded work:** any folder named `Tests`, `Assignments`, or `Projects` at any depth, `CompTIAA+\Core 1\Study Guides\2.0 Take Home`, and any file in a course's `claude` folder with Test, Quiz, Exam, Assignment, Project, Form, or Virtual Day in its name. Ignore `CompTIAA+\Core 1\Study Guides\Documents\` completely: it is a stray old copy of my folders. If you cannot tell whether a file is graded work, ask me before you open it. (`extract-aids.ps1` never goes into subfolders.)

## Rules I will hold you to

The guide has the full list. These are the ones that sink a unit:

1. **A cousin, not a copy.** Every question is modeled on one source item and names it in `origin.basedOn`, numbered the way the guide says. Keep the objective and the one distinction it tests. Change the scenario, the wording, and the option text. The option count follows the guide: 4 for one answer, 5 for choose two or three (6 only when the source item had 6 or more).
2. **The reading decides the answer.** Key every question from the section you cite. Where the reading and a source item disagree (or my key), the reading wins, and you tell me. Where the reading contradicts itself or is plainly wrong, key nothing to that point: add it to `docs/CONTENT-NOTES.md` and tell me.
3. **An item belongs to the unit whose reading answers it.** Cite only sections inside your unit. An item that another unit's reading answers goes into `docs/CONTENT-NOTES.md` for that unit. A Messer item is used once per exam (`assemble.ps1` checks the other packs).
4. **Tag as specifically as you can:** the objective and its best-fitting bullet (`3.4` and `3.4.c`), and the reading section (`3.2.6`). Book numbers and CompTIA numbers overlap by accident: `units` and `reference.section` take book numbers, `objectives` takes CompTIA numbers. Never borrow a bullet that does not fit.
5. **Leave `reference.quote` empty.** I add the quotes. Give me a good `reference.find`: three to six words from the sentence that answers the question, taken from one line of the section's `pdftotext -layout` text, never across a page break or a hyphenated word.
6. **Flashcards** follow "What makes a good flashcard" in the guide. One card per term in an exam. Every card is fact-checked against its section.
7. **Wording:** CompTIA voice, plain enough for a 10th grader meeting this for the first time, no em dashes, no "all of the above", and never "(Select TWO.)" in a stem.
8. **A pack I have touched is mine.** Once I have added quotes or set `"reviewed": true`, its ids never change (students' saved history points at them), and you change it only with small edits to the items I name. Never rewrite or regenerate it, and never blank a quote.

Set `"reviewed": false` on every pack you write. Leave `status` out of every item (published).

## The steps, in this order

Work straight through. Do not stop between steps to ask me; the only stop is the report at the end. Ask only when a rule above says to. Use separate agents for the mapping, weighting, writing, and checking, and run them in parallel where the brief allows (the Agent tool, or a workflow if I have turned that on). Never check your own work and call it independent.

1. **Set up.** Ask the app to keep this PC awake; if that is refused, tell me in one line, because a sleeping PC pauses every agent. Run `extract-sources.ps1` and `extract-aids.ps1 -Unit <N>` into your scratchpad (`docs/content-kit/README.md`). Start your plan file there (`plan-unitNN.tsv`, one line per source item) and keep it current to the end: this chat will be summarized partway through, and the plan file is how you remember.
2. **Scope the unit.** From `units.json`: its lessons, the objectives each lesson lists, and its sections. Read every section as text. Note the bullets of those objectives that other units teach, any contradiction or error in the reading, and the terms the unit's bullets name that its reading teaches (your card list).
3. **Map every source item** (`brief-read.md`). The items: this unit's pool file; every Messer item tagged with an objective this unit's lessons list; every Messer item tagged 5.x whose answer this unit's reading gives; and the items `docs/CONTENT-NOTES.md` passes to this unit. Agents in parallel, about 25 items each. Then a second agent re-keys each usable item blind (the item without its key, plus the cited section), and a third settles any disagreement. Record every item in the plan file: usable, other unit (with its section), no reading, or skip.
4. **Corroborate with my materials.** Compare the plan's keys with my study guide key and review decks for the same facts. A disagreement goes in your report; the reading still wins. Note my items that cover an exam-weighted fact no pool or Messer item covers: they are the only ones you may use (`"kind": "teacher"`).
5. **Weight the unit by the exam** (`brief-weight.md`). Two agents rank the unit's bullets in parallel, one by exam evidence and one by course coverage. You reconcile them: the exam lens decides. The result is the question count per lesson and one slot per fact, written to `plan-counts.json` and `spec.json`. Count facts, not items.
6. **Post the plan and keep going.** In the chat, a short note: questions per lesson, the tier 1 bullets, how many cards, and what you cut, skipped, or passed to other units. Do not wait for an answer.
7. **Write** (`brief-write.md`). One agent per lesson for the questions, one for the flashcards (give it the terms the exam's packs already have cards for).
8. **Check** (`brief-review.md`). Run `assemble.ps1` and `strip-for-check.ps1`, then in parallel: the blind key check, the exam-style review, and the three card checks. Fix every finding, re-assemble, and re-check the changed items until nothing is flagged. A question that cannot be keyed cleanly from the reading is dropped.
9. **Put it in the site, one lesson at a time.** Start the question pack with its first lesson (`packs\unit-NN.lesson-X.Y.txt` holds each lesson's blocks), add each later lesson with Edit, and list the pack in `manifest.json`. Add the flashcard pack the same way. Open the content check after each lesson: 0 errors, and the only warnings left are `"reviewed": false` (one per pack) and empty quotes (one per question).
10. **Look at it on the site** at phone width, in light and dark mode, as a student would: take a short test on the unit, build a deck from it, and check the "Coming soon" labels in the three places the guide names (the home card, the practice-test topic list by unit and by objective opened down to the bullets, and the flashcard term table). Everything you wrote should be live; a bullet with no usable item still says "Coming soon", which is correct.
11. **Update the notes and docs.** In `docs/CONTENT-NOTES.md`, remove what you used (say which question it became) and add what you found for later units. Update the Content row in `docs/PLAN.md` section 2, the list in section 6, and the "Content so far" line in `README.md`.
12. **Commit** your unit on a new branch named `content-unit-NN`, made from `main`: the two packs, the two manifests, and the docs you changed. Do not push, and do not merge.
13. **Report, then stop.** Questions (and how many are choose two or three), cards, coverage by lesson and by objective from the content check, the tier 1 bullets and what you cut, what still says "Coming soon" (with bullets), the items you skipped and why, the items you passed to other units, every disagreement between the reading and a source item or my key, and anything you were unsure of. Then ask me whether to push to `main`, which publishes the site. Wait for my answer.

## "Coming soon"

The site labels anything without content "Coming soon" by itself. Never add filler items, empty packs, or "TBD" text to make something look covered. If a lesson or objective has no usable source item, it stays "Coming soon": list it in your report. If missing content ever shows as a blank, a zero, or an error instead, do not fix the site: tell me.

## Testing on this PC

- Git and the GitHub CLI are installed (they may be missing from `PATH` in this chat: add `C:\Program Files\Git\cmd` and `C:\Program Files\GitHub CLI`). There is no Node or Python (`python` is only a Microsoft Store shortcut). PowerShell is 5.1. `pdftotext` and `pdfinfo` came with MiKTeX.
- **Files.** Write files under `data/` and `docs/` with the Write and Edit tools, not PowerShell. PowerShell and the kit's scripts write only in your scratchpad.
- **The reading as text.** Work from the text files `extract-sources.ps1` makes, and give the checking agents the same files. Open a section PDF with the Read tool only to look at a figure: it returns every page as an image and fills your context fast.
- Start the preview server named `study-site-test` and use **http://localhost:8081/**. Never test on port 8080: that is my copy, and my saved decks, tests, and history live there.
- Content check: http://localhost:8081/tools/validate.html. `?drafts=1` on a page address shows items marked `"status": "draft"`.

## Stay out of the website

- Write only under `data/` and `docs/`. In `data/exams.json`, change only an exam's `status`, `dataPath`, and `sources`. In `docs/`, change only `CONTENT-NOTES.md`, the PLAN.md lines named in step 11, and the README line.
- Working files go in your scratchpad, outside this project. Never put them under `data/`: everything there is published as it is.
- Do not edit anything in `assets/`, the HTML pages, `tools/`, `schemas/`, `.github/`, `.claude/`, or `docs/content-kit/`. If content needs something the site cannot do (a new field, a new kind of question, a bug), or a kit script fails, stop and describe it to me.
- Do not edit this prompt. If it is wrong, tell me. When I give an instruction that should hold for later units too, end your reply with the exact line to add to this prompt, and I will add it.

## Your first reply

After reading, tell me in a few lines which unit you are doing, what content already exists, and anything in the source folders that is missing or not as described here. Then start step 1 without waiting.
