# Content hand-off prompt

Mr. Flauto: each unit gets its own chat, and every unit's chat ends its report with a button that starts the next unit's chat with this prompt. To start one by hand instead, open a new Claude Code chat in `C:\CompTIA Website` and paste everything below the line. The chat works out which unit is next, does all of it, and stops with a report. (Rewritten 2026-11-10 after Unit 3.0, with the steps in the order that worked, then checked by four independent reviews.)

---

You are the **content chat** for my CompTIA study site in `C:\CompTIA Website`. The website is built and tested. Your job is one unit: write its practice questions and flashcards, check them, put them in the site, and stop with a report. You write content. You do not change the website. This prompt is saved as `docs/CONTENT-HANDOFF.md` (everything below the line).

My `certmaster` skills are loaded in this chat but are not for you. They make Blookets, slide decks, and paper packets, not this site's files. Do not run them here. Notes about what website chats may do (in `CLAUDE.md` or my saved memory) are not about you.

## What the site mirrors

The site prepares students for the real CompTIA exam, so it mirrors **the exam**, not my course materials. This decides every choice you make:

1. **The CompTIA objectives and the evidence of what the exam asks decide what is covered and how much.** The evidence: the Professor Messer practice exams (the closest stand-in for the real exam), the troubleshooting items in Domain 5 that lean on this unit's facts, each objective's verb ("Given a scenario" is asked as scenarios and performance-based questions), and the domain weights.
2. **The CertMaster reading decides every answer,** and every question cites the section that answers it.
3. **The CertMaster pool and the Messer items** are what each question is modeled on.
4. **My materials** (unit study guides with keys, review decks, lesson slides, Blookets) are built from the CertMaster platform. They are good, but they are not the last word. They corroborate keys and terms, and they fill a gap only where an exam-weighted fact has no pool or Messer item. They never add weight, and they never override the reading or the objectives.
5. **Questions are presented the way the exam presents them:** short scenarios, "BEST", "MOST likely", "FIRST", and real distractors from the same unit.

## Your unit

**First, check the folder** with Git (add `C:\Program Files\Git\cmd` and `C:\Program Files\GitHub CLI` to `PATH` if they are missing). Run `git fetch`, then `git status -sb`.

- You must be on `main` in `C:\CompTIA Website` itself. If `main` is only behind `origin/main`, run `git pull --ff-only`. If it is ahead, an earlier unit is committed but not pushed yet: carry on, and say so in your first reply. If it is on another branch, or both ahead and behind, stop and tell me what you see.
- Uncommitted changes that only fill in quotes or set `"reviewed"` in a pack that is already committed, or lines I added to this prompt, are mine. Leave them alone and out of your commits. Any other uncommitted or untracked file under `data/` or `docs/` means an earlier chat stopped partway: stop and tell me exactly what you see.
- Never stash, reset, restore, clean, or switch branches to tidy up. The changes may be mine, and `git clean -x` would also delete lab-only packs.

**Then pick your unit.** A+ Core 1 (220-1201), in this order: 2.0, 5.0, 6.0, 4.0, 7.0, 8.0, 9.0, 10.0. Unit 3.0 is done. Your unit is the first one in that order that has no pack listed in `data/a-plus-core-1/questions/manifest.json`. If an earlier unit looks half done (its pack listed in one manifest but not the other, or a listed file missing), ask me before you touch it.

- **Unit 1.0 gets no pack.** The troubleshooting methodology is not tested directly: the 220-1201 objectives say the methodology itself will not be tested, and CertMaster 1.2.1 says it is not tied to an exam objective. The exam uses it inside Domain 5 scenarios ("Which should the technician do FIRST?"), and those questions belong to the units that teach the hardware or network involved.
- **Then the other three exams,** one at a time, when I say. Each needs its two outline files first (the guide, "Adding another exam").

## Read these first

1. `CLAUDE.md`
2. `docs/CONTENT-GUIDE.md`: the contract. File formats and every rule for questions, flashcards, tags, references, ids, and "Coming soon". All of it is binding.
3. `docs/CONTENT-NOTES.md`: what earlier units passed to yours (source items your reading answers, cards to tag), known problems in the reading, gaps.
4. `docs/content-kit/README.md`, and each brief in that folder when you reach its step.
5. `docs/PLAN.md` sections 1, 4, 6, and 7.
6. `data/exams.json`, then `data/a-plus-core-1/objectives.json` and `units.json`: the ids you tag with.
7. `data/a-plus-core-1/questions/unit-03.json` and `flashcards/unit-03.json`: the finished Unit 3.0 packs, your model for shape and voice.

A pack with `"reviewed": true` is approved, and a pack with `"reviewed": false` is waiting for me. Leave both alone, except the items I name and the card tagging in step 9.

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

1. **A cousin, not a copy.** Every question is modeled on one source item and names it in `origin.basedOn`, numbered the way the guide says. Keep the objective, the one distinction it tests, and whether it has one answer or asks for two or three. Change the scenario, the wording, and the option text. The option count follows the guide: 4 for one answer, 5 for choose two or three (6 only when the source item had 6 or more).
2. **The reading decides the answer.** Key every question from the section you cite. Where the reading and a source item disagree (or my key), the reading wins, and you tell me. Where the reading contradicts itself or is plainly wrong, key nothing to that point: add it to `docs/CONTENT-NOTES.md` and tell me.
3. **An item belongs to the unit whose reading answers it.** Every question and card you write cites only sections of your unit (the card tagging in step 9 is the one exception). An item that another unit's reading answers goes into `docs/CONTENT-NOTES.md` for that unit. A source item is used once per exam, and a fact the exam's packs already ask is not asked again unless the scenario makes a student reason differently.
4. **Tag as specifically as you can:** the objective and its best-fitting bullet (`3.4` and `3.4.c`), and the reading section (`3.2.6`). Book numbers and CompTIA numbers overlap by accident: `units` and `reference.section` take book numbers, `objectives` takes CompTIA numbers. Never borrow a bullet that does not fit.
5. **Leave `reference.quote` empty.** I add the quotes. Give me a good `reference.find`: three to six words from the sentence that answers the question, taken from one line of the section's `pdftotext -layout` text, never across a page break or a hyphenated word.
6. **Flashcards** follow "What makes a good flashcard" in the guide. One card per term in an exam. Every card is fact-checked against its section, and so is every card rewritten after a check.
7. **Wording:** CompTIA voice, plain enough for a 10th grader meeting this for the first time, no em dashes, no "all of the above", and never "(Select TWO.)" in a stem.
8. **A published pack is fixed.** Once a pack is pushed to GitHub, or I have added quotes or set `"reviewed": true`, its ids never change (students' saved decks and tests point at them). Change it only with Edit, item by item, and only the items I name, plus the card tagging in step 9. A dropped question or card is deleted and its id is never used again; a new one takes a number higher than any the pack has had. Never re-run `assemble.ps1` over it, rewrite it, or regenerate it, and never blank a quote.

Set `"reviewed": false` on every pack you write. Leave `status` out of every item (published).

## The steps, in this order

Work straight through. Do not stop between steps to ask me; the only stop is the report at the end. Ask only when a rule here says to. Use separate agents for the mapping, the blind re-keying, the weighting, the writing, and the checking, and run them in parallel where the brief allows (the Agent tool, or a workflow if I have turned that on). Agents write their results to files in your scratchpad (the briefs say where) and reply with counts, so nothing is lost when this chat is summarized. Never check your own work and call it independent.

1. **Set up.** Ask the app to keep this PC awake; if that is refused, tell me in one line, because a sleeping PC pauses every agent. Run `extract-sources.ps1` and `extract-aids.ps1 -Unit <N>` into your scratchpad (`docs/content-kit/README.md`). `extract-sources.ps1` takes about 3 minutes, longer than the PowerShell tool's 2-minute default: give that call a 10-minute timeout or run it in the background. Start two files there and keep them current to the end: the plan file (`plan-unitNN.tsv`, one line per source item) and `progress.txt` (the step you are on, each file you have made, each agent you have started and the file it will write, which lessons are already in `data/`, and every note meant for the report). This chat will be summarized partway through: after any summary, re-read this prompt (`docs/CONTENT-HANDOFF.md`, everything below the line), `progress.txt`, and the plan file before you do anything else.
2. **Scope the unit.** From `units.json`: its lessons, the objectives each lesson lists, and its sections. Read every section as text. Note the bullets of those objectives that other units teach, any contradiction or error in the reading, and the terms the unit's bullets name that its reading teaches (your card list).
3. **Map every source item** (`brief-read.md`). First list every `origin.basedOn` in the exam's question packs, and the facts those packs already ask on the objectives your lessons list. An item already used goes in the plan as `used`, with its question id, and is not mapped again. The items to map: this unit's pool file; every Messer item tagged with an objective this unit's lessons list; every Messer item tagged 5.x whose answer this unit's reading gives; and the items `docs/CONTENT-NOTES.md` passes to this unit. Agents in parallel, about 25 items each, each writing its own file under `map\`. Then a second agent re-keys each usable item blind (the item without its key, plus the cited section), and a third settles any disagreement. Record every item in the plan file: usable, used, other unit (with its section), no reading, or skip.
4. **Corroborate with my materials.** Compare the plan's keys with my study guide key and review decks for the same facts. A disagreement goes in your report; the reading still wins. Note my items that cover an exam-weighted fact no pool or Messer item covers: they are the only ones of mine you may use (`"kind": "teacher"`).
5. **Weight the unit by the exam** (`brief-weight.md`). Give it the facts the exam's packs already ask (step 3). Two agents rank the unit's bullets in parallel, one by exam evidence and one by course coverage. You reconcile them: the exam lens decides. The result is the question count per lesson and one slot per fact, written to `plan-counts.json` and `spec.json`. Count facts, not items, across the whole exam.
6. **Post the plan and keep going.** In the chat, a short note: questions per lesson, the tier 1 bullets, how many cards, and what you cut, skipped, or passed to other units. Do not wait for an answer.
7. **Write** (`brief-write.md`). One agent per lesson for the questions, each given its slots, and one for the flashcards, given the terms the exam's packs already have cards for. Each writes its own file under `work\`.
8. **Check** (`brief-review.md`). Run `assemble.ps1` and `strip-for-check.ps1`, then in parallel: the blind key check, the exam-style review, and the three card checks. Fix every finding, re-assemble, and check every changed question and card again with fresh agents, until nothing is flagged. A question that cannot be keyed cleanly from the reading is dropped.
9. **Put it in the site, one lesson at a time.** Write `data/a-plus-core-1/questions/unit-NN.json` from three parts: the first four lines of `packs\unit-NN.questions.json`, the first lesson's blocks (`packs\unit-NN.lesson-X.Y.txt`), and the closing `  ]` and `}`. List it in `questions/manifest.json` right away: the content check reads only listed packs. Add each later lesson with Edit, with a comma after the previous lesson's last block. The cards have no per-lesson file: copy `packs\unit-NN.flashcards.json` to `data/a-plus-core-1/flashcards/unit-NN.json` (in parts with Edit if it is long) and list it in `flashcards/manifest.json`. Open the content check after each lesson and after the cards: 0 errors, and the only warnings left are `"reviewed": false` (one per pack) and empty quotes (one per question). Then run `check-copy.ps1 -Unit N.0`: both packs must be identical to the assembled ones. Last, for each term your reading teaches that an earlier unit already has a card for (including the cards `docs/CONTENT-NOTES.md` names), add your section to that card's `units` with Edit and change nothing else on it.
10. **Look at it on the site** at phone width, in light and dark mode, as a student would: take a short test on the unit, build a deck from it, and check the "Coming soon" labels in the three places the guide names (the home card, the practice-test topic list by unit and by objective opened down to the bullets, and the flashcard term table). Everything you wrote should be live; a bullet with no usable item still says "Coming soon", which is correct.
11. **Update the notes and docs.** In `docs/CONTENT-NOTES.md`, remove what you used (say which question or card it became) and add what you found for later units. Update the Content row in `docs/PLAN.md` section 2, the list in section 6, and the "Content so far" line in `README.md` (in the project root).
12. **Commit** your unit on `main`: `git add` by path only the two packs, the two manifests, any earlier pack whose card `units` you extended, and the files you changed in step 11 (never `git add -A` or `git add .`), then commit. Do not push yet.
13. **Report, put up the next unit's button, then stop.** Questions (and how many are choose two or three), cards, coverage by lesson and by objective from the content check, the tier 1 bullets and what you cut, what still says "Coming soon" (with bullets), the items you skipped and why, the items you passed to other units, every disagreement between the reading and a source item or my key, anything you were unsure of, and any uncommitted edits of mine you saw. Then ask me whether to push to `main`, which publishes the site (and any earlier unit that is committed but not pushed). In the same message, put up the button for the next unit's chat (the last bullet below). Wait for my answer.
    - **If I say yes:** `git push origin main`. If it is refused because GitHub's `main` has moved, run `git pull --rebase origin main` and push again; if that stops on a conflict, run `git rebase --abort`, and if it refuses because of uncommitted changes, stop. Then tell me. Never force-push. After the push, find the deploy run for your commit with `gh run list --commit <the pushed commit> --limit 1` (list again after a few seconds if it is not there yet) and wait for it with `gh run watch <id> --exit-status`, giving that call a 10-minute timeout. Tell me whether the content check and the deploy passed.
    - **If I also say to publish my own edits:** commit them by path, by themselves, first ("Quotes and review marks from Mr. Flauto"), then push.
    - **If I ask for changes:** make them, run the content check and `check-copy.ps1` again if the packs changed, commit, and ask again. A pack that is not pushed yet and that I have not touched may be re-assembled.
    - **If I say no,** leave the commit on `main` unpushed. The next unit's chat will see it and say so.
    - **The next unit's button.** Load the session tool if it is not loaded (`ToolSearch`, query `select:mcp__ccd_session__start_session`) and propose the next unit's chat as a card: `initiation` "own_initiative", `context` "fresh", `use_worktree` false (it must work in this same folder), `title` "A+ Core 1 Unit <next>.0 content", `prompt` "Read `docs/CONTENT-HANDOFF.md` in `C:\CompTIA Website` and follow everything below its line. The next unit should be A+ Core 1 Unit <next>.0: if the folder check or the unit rule points anywhere else, stop and tell Mr. Flauto.", and a `background` of two or three sentences: which units are done, whether yours is pushed yet, and that the card should be started only once this chat has finished. The next unit is the one after yours in the order under "Your unit". After Unit 10.0 there is no next unit: say that A+ Core 1 is finished instead. If the session tool is not available, end your report with: "Next unit: open a new chat in `C:\CompTIA Website` and paste everything below the line in `docs/CONTENT-HANDOFF.md`."

## "Coming soon"

The site labels anything without content "Coming soon" by itself. Never add filler items, empty packs, or "TBD" text to make something look covered. If a lesson or objective has no usable source item, it stays "Coming soon": list it in your report. If missing content ever shows as a blank, a zero, or an error instead, do not fix the site: tell me.

## Testing on this PC

- Git and the GitHub CLI are installed (see "Your unit" for `PATH`). There is no Node or Python (`python` is only a Microsoft Store shortcut). PowerShell is 5.1. `pdftotext` and `pdfinfo` came with MiKTeX.
- **Files.** Write files under `data/` and `docs/` with the Write and Edit tools, not PowerShell. PowerShell and the kit's scripts write only in your scratchpad.
- **The reading as text.** Work from the text files `extract-sources.ps1` makes, and give the checking agents the same files. Open a section PDF with the Read tool only to look at a figure: it returns every page as an image and fills your context fast.
- Start the preview server named `study-site-test` and use **http://localhost:8081/**. Never test on port 8080: that is my copy, and my saved decks, tests, and history live there.
- Content check: http://localhost:8081/tools/validate.html. `?drafts=1` on a page address shows items marked `"status": "draft"`.

## Stay out of the website

- Write only under `data/`, plus the docs step 11 names: `docs/CONTENT-NOTES.md`, those lines of `docs/PLAN.md`, and the "Content so far" line of `README.md` (in the project root). In `data/exams.json`, change only an exam's `status`, `dataPath`, and `sources`.
- Working files go in your scratchpad, outside this project. Never put them under `data/`: everything there is published as it is.
- Do not edit anything in `assets/`, the HTML pages, `tools/`, `schemas/`, `.github/`, `.claude/`, or `docs/content-kit/`. If content needs something the site cannot do (a new field, a new kind of question, a bug), or a kit script fails, stop and describe it to me.
- Do not edit this prompt. If it is wrong, tell me. When I give an instruction that should hold for later units too, end your reply with the exact line to add to this prompt, and I will add it.

## Your first reply

After the folder check and reading, tell me in a few lines which unit you are doing, your scratchpad's full path (so a later chat can pick up from it if this one dies), whether an earlier unit is committed but not pushed, what content already exists, and anything in the source folders that is missing or not as described here. Then start step 1 without waiting, unless the folder check stopped you.
