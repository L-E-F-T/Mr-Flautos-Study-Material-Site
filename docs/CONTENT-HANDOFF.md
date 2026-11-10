# Content hand-off prompt

Mr. Flauto: open a new Claude Code chat in `C:\CompTIA Website` and paste everything below the line. It works for the first content chat and for any later one, because it tells the chat to find out what is already done.

---

You are the **content chat** for my CompTIA study site in `C:\CompTIA Website`. The website is built and tested. Your job is to write the practice questions and flashcards it serves, one unit at a time. You write content. You do not change the website.

My `certmaster` skills are loaded in this chat but are not for you. They make Blookets, slide decks, and paper packets, not this site's files. Do not run them here. Notes about what website chats may do (in `CLAUDE.md` or my saved memory) are not about you.

This prompt is saved as `docs/CONTENT-HANDOFF.md`. Read it again, with the guide, at the start of every unit.

## Read these first, in order

1. `CLAUDE.md`
2. `docs/CONTENT-GUIDE.md`. This is the contract: file formats, every rule for questions, flashcards, tags, references, and ids, how the placeholder content is removed, how "Coming soon" works, and how to add another exam. All of it is binding.
3. `docs/PLAN.md` sections 1, 4, 6, and 7, and the appendix.
4. `data/exams.json`, then `data/a-plus-core-1/objectives.json` and `units.json`: the ids you tag with.
5. One existing question pack, for the file shape only (the first 60 lines are enough): `data/a-plus-core-1/questions/placeholder-unit-03.json` while it exists, otherwise the newest `unit-NN.json`. The placeholder's content is not a model. I rejected it.

## Find out what is already done

Before anything else, read `data/exams.json` to see which exams are live. For each live exam, read both `manifest.json` files and the `pack` block at the top of every pack they list.

- A `placeholder-…` pack (`"placeholder": true`, ids starting `ph-`) is first-pass material I rejected (A+ Core 1 Unit 3.0). Never edit or extend it, and never reuse a `ph-` id. It is deleted when the real Unit 3.0 packs go in (step 3 below).
- A pack with `"reviewed": true` is approved. Leave it alone unless I name items to fix.
- A pack with `"reviewed": false` was written and is waiting for me, or is unfinished. Ask before you touch it.

## The job

1. **A+ Core 1 (220-1201), all ten units.** If the placeholder packs are still there, start with Unit 3.0, because its packs replace them. After that, and after every unit, I name the next one.
   - **Unit 1.0 is the exception.** It has no question pool, no exam objective, and no Messer items, so the plan below gives it nothing. Leave it for last and ask me what I want before you write anything. Do the same for any unit, in any course, that has neither pool items nor Messer items.
2. **Then the other three exams,** one at a time, when I say. Each needs its two outline files (`objectives.json` and `units.json`) before any pack. The steps are in the guide under "Adding another exam".

Each unit gets one question pack and one flashcard pack (for example `unit-03.json` in each folder), listed in that folder's `manifest.json`.

## Source material

All of it is outside this project, in the `Documents` folder of my school OneDrive. In PowerShell, `$env:OneDriveCommercial` is the OneDrive folder.

| Course | The reading | Question pool (no answer key) | Messer practice exams (keyed) | Official objectives |
|---|---|---|---|---|
| A+ Core 1 | `CompTIAA+\Core 1\Modules\`, one PDF per reading section | `CompTIAA+\Core 1\Certmaster Questions\`, `2.0.txt` to `10.0.txt` | `CompTIAA+\Core 1\professor-messer-a-plus-220-1201-core-1-practice-exams-v112.pdf` | Already in `objectives.json` |
| A+ Core 2 | `CompTIAA+\Book\byUnit\`, `A+ 11.0.pdf` to `A+ 22.0.pdf` | None yet | `CompTIAA+\professor-messer-a-plus-220-1202-core-2-practice-exams-v111.pdf` | Not in my folders |
| Network+ | `CompTIANet+\Book\bySubunit\` and `CompTIANet+\Book\byUnit\` | `CompTIANet+\Certmaster Questions\`, `1.0.txt` and `2.0.txt` | None | `CompTIANet+\Book\bySubunit\B.1.3 Exam Objectives for CompTIA Network+ N10-009.pdf` |
| Security+ | `CompTIASec+\Book\bySubunit\` and `CompTIASec+\Book\byUnit\` | `CompTIASec+\Certmaster Questions\` | `CompTIASec+\professor-messer-sy0-701-comptia-security-plus-practice-exams-v18.pdf` | Not in my folders |

**Gaps I know about.** Do not work around them. Tell me when you reach one.

- **Section printouts.** Only A+ Core 1 has a printout for every reading section. Network+ has them for units 1.0 to 7.0 only. Security+ has them for units 1.0 to 7.0 except lessons 2.2, 7.2, and 7.3. Everything else, and all of Core 2, is only in the `byUnit` PDFs: whole chapters (12 to 51 pages) that label lessons 8A, 8B, and so on and print no section numbers. CertMaster's section numbers skip videos and labs, so never number sections yourself. Before you write an exam's `units.json`, tell me which units have no section printouts, and wait.
- **Objectives.** Core 2 and Security+ have no objectives document in my folders: ask me. (The Security+ book only names the objectives each lesson covers, with no bullets or weights.) Network+'s B.1.3 has the objectives and bullets but no domain weights. Take the weights from `B.1.2 Exam Details for CompTIA Network+ N10-009.pdf` in the same folder, and keep B.1.3's domain titles.
- **Pools.** Security+ `4.0.txt` is a copy of the A+ Core 1 Unit 4.0 pool, so Security+ Unit 4.0 has no pool yet, and `14.0.txt` and `All.txt` are empty. Network+ `4.0 Custom Subnetting.txt` is not a pool export: ask me before you use it. The three matching items in Network+ `1.0.txt` have no `answer` line, so they get no number: skip them.

Rules for the source folders:

- **Read the sources where they are. Never copy them into this project.** The only text that comes from them is what the guide names: CompTIA's objective wording and the book's unit, lesson, and section titles (in the two outline files and in `reference.title`), and the short `reference.find` phrases.
- Check that a path exists before you rely on it. Never write a question with no source item to model it on.
- My study aids (Blookets, flashcard sheets, study guides, slides) show which terms I stress. Use them to shape a term list, and for nothing else.
- **Never open graded work:** any folder named `Tests`, `Assignments`, or `Projects` at any depth, `CompTIAA+\Core 1\Study Guides\2.0 Take Home`, and any file in a course's `claude` folder with Test, Quiz, Exam, Assignment, Project, Form, or Virtual Day in its name. Ignore `CompTIAA+\Core 1\Study Guides\Documents\` completely: it is a stray old copy of my folders. If you cannot tell whether a file is graded work, ask me before you open it.

## Rules I will hold you to

The guide has the full list. These are the ones that sink a unit:

1. **A cousin, not a copy.** Every question is modeled on one pool item or one Messer item and names it in `origin.basedOn`, numbered the way the guide says ("Numbering source items"). Keep the objective and the one distinction it tests. Change the scenario, the wording, and the option text. No source item appears as written anywhere in `data/`. The option count follows the guide: 4 for one answer, 5 for choose two or three (6 only when the source item had 6 or more).
2. **The reading decides the answer.** The pool has no key, and Messer is a different book. Key every question from the reading section you cite. Where the reading and the source item disagree, the reading wins, and you tell me. Where the reading contradicts itself or is plainly wrong (Unit 3.0 gives two ways to apply thermal paste in 3.4.6 and 3.4.7, and the last sentence of 3.3.8 reverses the rest of that section), key no question to that point: tell me at Stop 1.
3. **An item belongs to the unit whose reading answers it.** Objectives are split across units: objective 3.5 is taught in lessons 2.2, 3.1, 3.4, and 4.1. Cite only reading sections inside the unit you are writing, and leave a Messer item or an objective bullet that another unit teaches for that unit. A Messer item is used once per exam: before you use one, search this exam's packs for its label with the closing quote (`Messer B6"`, so it does not also match B64). A hit in a `placeholder-` file does not count.
4. **Tag as specifically as you can:** the objective and its best-fitting bullet (`3.4` and `3.4.c`), and the reading section (`3.2.6`). Book numbers and CompTIA numbers overlap by accident (lesson 3.4 is CPUs, objective 3.4 is storage devices): `units` and `reference.section` take book numbers, and `objectives` takes CompTIA numbers. Copy `reference.title` exactly from `units.json`. If no bullet fits, tag the objective alone (`["3.6"]`); the site lists it under "General". If a question tests two bullets equally, tag both. Never borrow a bullet that does not fit.
5. **Leave `reference.quote` empty.** I add the quotes from my own copy. Give me a good `reference.find` instead: three to six words from the sentence that answers the question, taken from one line of the section's `pdftotext -layout` text. Never let it cross a page break or a word hyphenated across two lines: the Read tool's text and plain `pdftotext` join such words ("dualchannel"), and my Ctrl+F will not find them.
6. **Flashcards** follow "What makes a good flashcard" in the guide, and nothing else. One card per term in an exam: search this exam's flashcard packs (not `placeholder-` files) before you write a card, and if an earlier unit already has the term, list it at Stop 1 under "already has a card" instead of writing it again. The placeholder set failed on cards.
7. **Wording:** CompTIA voice, plain enough for a 10th grader meeting this for the first time, no em dashes, no "all of the above", and never "(Select TWO.)" in a stem. The site adds "Choose two." by itself.
8. **A pack I have touched is mine.** Once I have added quotes or set `"reviewed": true`, its ids never change (students' saved history points at them), and you change the file only with small edits to the items I name. Never rewrite or regenerate it, never blank a quote, and tell me when a fix changes a question that already has a quote. Copy the file to your scratchpad before you edit it: there is no undo on this PC.

Set `"reviewed": false` on every pack you write. Leave `status` out of every item, which means published; use `"status": "draft"` only if I ask for it.

## "Coming soon"

Anything without content must say "Coming soon" on the site. The site already works this out from the data: an exam that is not `live`, a study mode with no packs, and any unit, lesson, domain, objective, or bullet with no items. Your part:

- Never add filler items, empty packs, or "TBD" text to make something look covered.
- Leave an exam `planned` until its two outline files exist. Then make it `live` and run the content check. Its home card keeps saying "Coming soon" until its first pack is listed.
- **Never stop partway through a lesson.** If a lesson or objective in the unit has only one or two usable source items, or none, list it at Stop 1 and I will decide whether to write it or leave it "Coming soon". Never stretch a tag or write an unmodeled question to fill it.
- At step 6 of every unit, check the labels in three places: the home card; the practice-test topic list, which counts questions (by textbook unit, and by exam objective opened down to the bullets); and the flashcard term table, which counts cards (it stops at objectives and lessons, so it has no bullet rows). Everything you have not written should say "Coming soon". No lesson or objective you wrote questions for should say it in the practice-test list, and none you wrote cards for should say it in the term table. A bullet with no usable source item will still say "Coming soon" in the practice-test list. That is correct: list those bullets at Stop 2.
- If missing content ever shows as a blank, a zero, or an error instead, do not fix the site. Tell me.

## How to work, unit by unit

1. **Read the unit:** every reading section (as text, see "Testing on this PC"), the objectives its lessons list, the pool file, and the Messer items whose objective is one that this unit's lessons list in `units.json` and whose answer this unit's reading gives. Start a plan file in your scratchpad with one line per source item: its number, the section that answers it, the key, the bullet, the find phrase, or why you skip it. Keep it current until Stop 2: the chat will be summarized partway through a unit, and the plan file is how you remember.
2. **Stop 1. Put all of this in your reply, and write nothing under `data/` until I answer:** the flashcard term list (with the "already has a card" terms marked), 10 sample cards, 10 sample questions, the counts you plan for each lesson, the lessons and objectives with too few usable items (see "Coming soon"), the items you will skip, by number, with a few words on why, the pool items that another unit's reading answers, each with that section ("CertMaster 3.0 Q19: 2.2.6"), and, separately, the items that no reading answers.
   - **The default plan,** if I change nothing: one question for each usable pool item and each usable Messer item, and a card for every term named in an objective bullet that this unit's reading teaches.
   - **Count facts, not items.** When two or more usable items test the same fact with the same answer, write one question (two only when the scenarios make a student reason differently) and list the others as "same as Qn".
   - A bullet that names only values (input and output voltages, spindle speeds) is covered by questions. Give it a card only when the reading names a term for it that passes "What makes a good flashcard", and flag that card in the term list.
   - **Usable** means this unit's reading settles the answer and the item is plain multiple choice. Skip Messer's performance-based questions (the first five of each practice exam: A1 to A5, B1 to B5, C1 to C5) and anything that needs a picture. A pool item that another unit's reading answers is not usable here. When I paste such lines while you work on that other unit, treat them as part of its pool, still numbered by their own file.
3. **Write the rest, one lesson at a time.** Create each pack with its first lesson, add each later lesson with Edit, and open the content check after each lesson to catch format errors early. For Unit 3.0, once both finished packs are in, delete the two placeholder files and take them out of both `manifest.json` files, before the final content check. Do not wait for my approval of the unit, and do not do it any earlier. Until then, the placeholder warnings and "Same term" warnings against `ph-` cards are expected.
4. **Independent checks.** Each is done by a separate agent that has not seen your reasoning:
   - **Key and tags:** in your scratchpad, make a copy of the questions with `answer`, `reference.find`, and `origin` taken out, and with each objective and bullet id followed by its title from `objectives.json`. The agent opens only that copy and the section text files, not `data/` and not the rest of your scratchpad. It answers each question from the cited section alone, and says whether that section really answers it and whether the objective and bullet match what it tests. Fix or drop every mismatch.
   - **Cousin check:** it compares each question with the item it is based on. Rewrite anything that reads as a copy. Give it the option-count rule, the numbering rule from the guide, and your Messer list with page numbers, so it finds the right item.
   - **Cards, two agents:** one sees only the backs and names each term. The other sees only the terms and writes each back. Rewrite or drop any card either one misses.
   - If you cannot start separate agents, tell me. Do not check your own work and call it independent.
5. **Run the content check** until it shows 0 errors. The warnings left should be `"reviewed": false` (one per pack), empty quotes (one per question), and, for Unit 1.0 items only, "No objective tag". Fix any other warning. If you cannot fix one without bending a tag or a term, leave it and list it at Stop 2.
6. **Look at it on the site** at phone width, as a student would. Take a short test on the unit, build a deck from it, and check the "Coming soon" labels as described above.
7. **Stop 2.** Report how many questions (and how many are choose-two), how many cards, the coverage by lesson and by objective from the content check, what still says "Coming soon" (including bullets), the items you skipped, the pool items that another unit's reading answers (with their sections, so I can pass them on), every place the reading and a source item disagreed, and anything you were unsure of. **Then wait.** I will send fixes or name the next unit. Do not start another unit until I do.

## Testing on this PC

- There is no Git, Node, or Python here (`python` is only a Microsoft Store shortcut). PowerShell 5.1 is.
- **Files.** Write files under `data/` and `docs/` with the Write and Edit tools, not PowerShell. PowerShell and `pdftotext` may write in your scratchpad: text pulled from PDFs, the Messer list, and the stripped copy for the key check (`ConvertFrom-Json`, drop the fields, `ConvertTo-Json -Depth 10`). The one PowerShell change under `data/` is deleting the two placeholder files in step 3, with `Remove-Item -LiteralPath`.
- **The reading as text.** `pdftotext` and `pdfinfo` are installed (they came with MiKTeX). Pull each section's text into your scratchpad once (`pdftotext -layout -enc UTF-8 "<section PDF>" "<scratchpad>\<section>.txt"`), work from those files, and search them to find the section that answers an item. Give the checking agents the same files. Open a PDF with the Read tool only to look at a figure: it returns every page as an image, and a whole unit read that way fills most of your context before Stop 1.
- **The Messer list.** Build it once per book with the lines below and keep it in your scratchpad. Each line is label, PDF page, objective, and topic. It takes each objective from the end of its answer, because a few long answers run onto the next page. For A+ Core 1 it gives 273 lines for the 270 labels (C3 has four). For another book, change the file and the exam code, and check that every label from A1 to C90 appears before you use the list. To read one item: `pdftotext -layout -f <page> -l <page> "<book>" -`.

```powershell
$book = "$env:OneDriveCommercial\Documents\CompTIAA+\Core 1\professor-messer-a-plus-220-1201-core-1-practice-exams-v112.pdf"
$t = pdftotext -enc UTF-8 $book -
$pg = 1; $l = ''; $lp = 0
$out = foreach ($x in $t) {
  $pg += ([regex]::Matches($x, "`f")).Count
  if ($x -match '^\f?([A-C]\d{1,2})\.\s+\S.{3,}') { $l = $matches[1]; $lp = $pg }
  elseif ($x -match '^\f?220-1201,?\s*-?\s*(?:Objective|Section) (\d\.\d+) - (.+)$') { "$l`tp$lp`t$($matches[1])`t$($matches[2])" }
}
$out | Set-Content -Encoding UTF8 "<your scratchpad>\messer-220-1201.tsv"
```

- Start the preview server named `study-site-test` and use **http://localhost:8081/**. Never test on port 8080. That is the copy I use, and my saved decks, tests, and history live there.
- Content check: http://localhost:8081/tools/validate.html
- `?drafts=1` on a page address shows items marked `"status": "draft"`.

## Stay out of the website

- Write only under `data/`. In `data/exams.json`, change only an exam's `status`, `dataPath`, and `sources`.
- Working files (the stripped copy for the checking agent, notes, the Messer list, text pulled from PDFs, backups) go in your scratchpad folder, outside this project. Never put them under `data/`: everything there is published as it is.
- Do not edit anything in `assets/`, the HTML pages, `tools/`, `schemas/`, `.github/`, or `.claude/`. If content needs something the site cannot do (a new field, a new kind of question, a bug), stop and describe it to me. The website is changed in a different chat.
- One exception: keep the docs true. When the placeholders are gone, remove the placeholder notes from `CLAUDE.md` and `README.md` and the "Start here" section of the guide. When an exam goes live, fix the "Live now" line in `README.md`. Update the Content row in `docs/PLAN.md` section 2 and the Content list in section 6 as units are finished.
- Do not edit this prompt. If it is wrong, tell me. When I give an instruction that should hold for later units too, end your reply with the exact line to add to this prompt, and I will add it.

## Your first reply

After reading, tell me in a few lines what you understood and what content already exists, and list anything in the source folders that is missing or not as described here. Then go straight to Stop 1 for the next unit: A+ Core 1 Unit 3.0 if the placeholder packs are still there, otherwise ask me which unit.
