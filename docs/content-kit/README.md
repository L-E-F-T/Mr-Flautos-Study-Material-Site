# Content kit

Tools for the content chats (one chat per unit, started with `docs/CONTENT-HANDOFF.md`). The scripts read Mr. Flauto's sources and write only to the chat's scratchpad. They never write under `data/`: the chat copies finished packs in with the Write and Edit tools, then `check-copy.ps1` proves the copy is exact. Built and tested on A+ Core 1 Unit 3.0 (2026-11-10). Network+ (the `-Exam network-plus` presets and its practice exam book) added and tested on Mr. Flauto's files on 2026-11-14. Content chats do not edit this folder: if a script fails, they stop and report it.

Run a script with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\CompTIA Website\docs\content-kit\<script>.ps1" -Scratch "<scratchpad>" -Exam <exam> ...
```

- **Every script needs `-Exam`**: `a-plus-core-1` or `network-plus`. It picks the exam's folders, its data folder, and its id prefix (`c1-` or `n-`). A script run without it stops at once. `-Data` and `-Course` (`assemble.ps1`) and the source-folder parameters (`extract-sources.ps1`) override the preset.
- Through `-File`, a list argument arrives as one string: write `-Only q005,q019,f012` and the script splits it.
- `-Unit` takes the unit number as `units.json` writes it for `assemble.ps1`, `strip-for-check.ps1`, and `check-copy.ps1` (`-Unit 2.0`), and a plain number for `extract-aids.ps1` (`-Unit 2`).
- The PowerShell tool stops a command after 2 minutes unless the call sets a longer timeout. Give `extract-sources.ps1` a 10-minute timeout (600000 ms) or run it in the background. A timeout is not a script failure: run it again with the longer timeout.

## In the order a unit uses them

| Step | File | What it does |
|---|---|---|
| 1 | `extract-sources.ps1` | Reading sections (every unit's, so you can tell which unit answers an item), CertMaster pools (numbered), the exam's keyed practice exam with and without keys and its index by objective (A+ Core 1: Messer; Network+: the practice exam book), and the exam details, all as text. Once per chat, about 2 minutes. The 15 performance-based Messer items get no blind copy: they are not usable anyway. |
| 1 | `extract-aids.ps1 -Unit N` | Mr. Flauto's lesson decks, review decks, Blookets, and the unit study guide with its key, as text. Corroboration only. |
| 3 | `brief-read.md` | Brief for the agents that map every source item: section, key from the reading, bullet, find phrase, fact, or why it is not usable here. |
| 5 | `brief-weight.md` | Brief for the two ranking agents (exam evidence, course coverage) and the rules for turning their ranks into question counts. Exam evidence decides. |
| 7 | `brief-write.md` | Brief for the agents that draft each lesson's questions (with a text exhibit where a question needs a command's output) and the unit's flashcards (only the `card` rows of `card-terms.tsv`). |
| 8 | `assemble.ps1 -Unit N.0` | Builds both packs from the drafts, checks every mechanical rule, spreads the answer keys, and writes the house layout, one paste-ready file per lesson, and the id maps. `-CardsOnly` builds only the flashcard pack, to check cards early. |
| 8 | `strip-for-check.ps1 -Unit N.0` | Blind copies for the checkers: questions (with their exhibits) without keys, card backs alone, card terms alone. `-Only` limits them to the ids being re-checked. |
| 8 | `brief-review.md` | Brief for the independent checks (blind key check, exam-style review, four card checks, the fourth being the testable check) and the re-check loop, which stops after the third round. |
| 9 | `check-copy.ps1 -Unit N.0` | Confirms the packs in `data/` are exact copies of the assembled packs the checkers saw. Read-only. |

Each brief has `<<...>>` blanks. The chat copies it to the scratchpad, fills them in, and gives the agent the path. **Agents write their results to files** in the scratchpad (the brief or the task names the file) and reply with only counts, so the results survive a summary of the chat and never pass through it by hand.

## Scratchpad layout

```
<scratchpad>\
  text\<section>.txt, <section>.raw.txt, _index.csv    extract-sources.ps1
  pool\<file>.txt                                       extract-sources.ps1
  messer\<label>.txt, messer-<exam>.tsv                 extract-sources.ps1 (A+ Core 1)
  messer-q\<label>.txt                                  extract-sources.ps1 (no key, for blind checks)
  practice\1-Q33.txt, practice-<exam>.tsv               extract-sources.ps1 (Network+)
  practice-q\1-Q33.txt                                  extract-sources.ps1 (no key, for blind checks)
  examdetails.txt                                       extract-sources.ps1
  chapters\Net+ 8.0.txt to Net+ 14.0.txt                the chat (Network+ units with no printed sections yet)
  aids\                                                 extract-aids.ps1
  progress.txt                                          the chat's own log: step, files made, agents out, notes for the report
  plan-unitNN.tsv                                       the chat's plan file: one line per source item
  card-terms.tsv                                        the card list (step 2), with a header line: term, decision, test, bullet, words, section, why
  map\                                                  mapping agents' results (brief-read.md)
  rank-exam.json, rank-course.json, plan-counts.json    weighting (brief-weight.md)
  spec.json                                             the slots, in pack order
  work\draft-<lesson>.json, cards.json                  drafts (brief-write.md)
  work\fixes-<lesson>.json                              fixes after review; later files win
  packs\                                                assemble.ps1 output, including ids.tsv and card-ids.tsv
  check\                                                strip-for-check.ps1 output (blind copies)
  findings\                                             checkers' results (brief-review.md)
```

## File shapes

`spec.json` (lessons in book order, slots in order):

```json
{ "lessons": { "2.1": [ { "slot": "q01" }, { "slot": "q02" } ], "2.2": [ { "slot": "q03" } ] } }
```

Drafts, revisions, and fixes all use the same shape, keyed by `slot`. A later file replaces the whole question for that slot (`draft-*`, then `revised-*`, then `fixes-*`):

```json
{ "questions": [ { "slot": "q01", "stem": "...", "choices": [ { "id": "a", "text": "..." } ], "answer": ["a"],
  "objectives": ["2.5", "2.5.b"], "units": ["2.1.4"],
  "reference": { "source": "certmaster", "section": "2.1.4", "title": "...", "quote": "", "find": "..." },
  "origin": { "kind": "certmaster-variation", "basedOn": "CertMaster 2.0 Q14" } } ] }
```

A draft may add `"keepOrder": true` when its choices have a natural order that the spread cannot detect. It never reaches the pack. A question about a command's output adds `"exhibit": { "type": "text", "text": "line 1\nline 2" }` (`brief-write.md` rule 10), which goes into the pack after the stem.

`work\cards.json`: `{ "flashcards": [ { "term", "definition", "objectives", "units", "reference": { "source", "section", "title" } } ] }`

`card-terms.tsv`: tab-separated, a first line that names the seven columns (`assemble.ps1` reads them by name), then one row per term the reading teaches under the unit's objectives, with `term`, `decision` (`card`, `carded`, `no card`), `test` (A, B, C), `bullet`, `words`, `section`, `why`. Each `term` is written exactly as its card's front will read ("TCP (Transmission Control Protocol)"): `assemble.ps1` matches the two. Only `card` rows become cards (CONTENT-GUIDE, "Which terms get a card").

`packs\ids.tsv` (id, slot, lesson, source) and `packs\card-ids.tsv` (id, term) map the ids that checkers report back to the slots and cards you fix. `assemble.ps1` numbers questions in spec order and cards in file order, so dropping one renumbers every id after it: take ids from the latest maps. That is fine until the pack is pushed. **Once a pack is on GitHub, its ids never change** (students' saved decks and tests point at them): it is never re-assembled again, only edited item by item.

## What `assemble.ps1` checks

Choice ids and counts (4 for one answer, 5 for two or three, a note at 6), answers that are not choices, duplicate choice text, unknown objectives or sections, a section outside the unit, titles that do not match `units.json`, find phrases (3 to 6 words, on one line of the raw section text, not a header or footer, not half of a hyphenated word), em dashes, banned phrases, stems over two sentences, a negative question asked in lowercase, an unknown `origin.kind`, a Network+ practice exam item not written like "Practice Tests 1 Q33" or missing from the practice exam index or needing a figure, a text exhibit over 12 lines or with a line over 25 characters (it wraps on a 320 px phone) or with an em or en dash, a source item used twice, and a source item (pool, Messer, or practice exam) or a flashcard term already used in another unit's pack. For cards it also reports a card tagged to no objective that the unit's lessons list, and, when `card-terms.tsv` exists, a card whose front does not equal the `term` of a `card` row there.

It then spreads the keys: a single-answer key moves (by swapping two choices) only while its letter holds more than a quarter of the keys, and a choose-two or choose-three item with its keys at the top is rotated. Choices whose texts are the same apart from their numbers and units (RAID 0/1/5/10, 4/8/16 GB, 3.3/5/12 V, 100 Mbps/1 Gbps, Cat 5e/6/6a, 802.11a/g/n/ac, Wi-Fi 6/6E) are never touched, and neither is a draft marked `"keepOrder": true`. `packs\keys-moved.txt` lists every move. `-NoSpread` turns it off.

## Network+

The sources are the same kinds as A+ Core 1's, and they play the same parts. The CertMaster reading in `CompTIANet+\Book\bySubunit` keys every answer and is the only thing a question cites. Questions are modeled on the CertMaster pool and on the practice exam book (CONTENT-GUIDE, "Each exam's keyed practice exam"), which has the part the Messer practice exams have for A+ Core 1: the closest stand-in for the exam. Mr. Flauto's study guides, decks, and Blookets corroborate and fill gaps, as for A+.

```powershell
...\extract-sources.ps1 -Scratch "<scratchpad>" -Exam network-plus
...\extract-aids.ps1 -Scratch "<scratchpad>" -Exam network-plus -Unit 6
...\assemble.ps1 -Scratch "<scratchpad>" -Exam network-plus -Unit 6.0
...\strip-for-check.ps1 -Scratch "<scratchpad>" -Exam network-plus -Unit 6.0
...\check-copy.ps1 -Scratch "<scratchpad>" -Exam network-plus -Unit 6.0
```

What `extract-sources.ps1 -Exam network-plus` found on 2026-11-15 (about 100 seconds):

- **Reading:** 323 PDFs in `Book\bySubunit`, each written to `text\` under its number: the sections, the unit and lesson opening pages (`6.0`, `6.1`), `0.0 Network+ CertMaster Perform`, and the exam details and objectives (`B.1.2 ...`, `B.1.3 ...`, under their full names). `examdetails.txt` is B.1.2. The files numbered 8.x to 14.x are excerpts split from the chapters, not CertMaster printouts: their pages print no section number, so nothing cites them. For those units the chat writes the whole chapters to `chapters\Net+ 8.0.txt` to `Net+ 14.0.txt` with `pdftotext -layout`, for the outline's lessons and for placing items (`docs/CONTENT-HANDOFF.md`).
- **Pools:** `1.0.txt` to `14.0.txt`, 4,418 numbered items (Unit 6.0: 432). `All.txt` is skipped: it repeats the unit files, and items are numbered from the unit files.
- **Practice exam:** 1,213 items, every one with its key: Chapters 1 to 5 (one per domain) have 271, 178, 183, 147, and 234, each printed under its objective heading, so the index gives every one an objective (1.1 to 5.5). Chapters 6 and 7 are two full 100-question practice tests with no objectives (`-` in the index). 302 items have two or more answers, 22 need a figure (flag `figure`: not usable), and 20 print a command's output (flag `exhibit`, which `ipconfig /all`'s dotted lines also set: its columns can come out of order in the text, so the chat, not an agent, checks that PDF page (the Read tool, `pages` = the index's `page` without its `p`) before it uses an exhibit item; 4 of them also need a figure).

Things to know about the practice exam:

- **Item names** are the book's title, the chapter, and the question number (CONTENT-GUIDE, "Numbering source items"): "Practice Tests 1 Q33" is Chapter 1, question 33, and "Practice Tests 6 Q12" is question 12 of the first full practice test (Chapter 6). `practice\1-Q33.txt` has the item, the book's key, and its explanation; `practice-q\1-Q33.txt` has the item alone. The book's key is a second opinion: the reading keys every item.
- **Finding a unit's items.** Chapters 1 to 5: filter the index's `objective` column by the objectives the unit's lessons list in `units.json`, then screen the other 5.x items for ones the unit's reading answers. Chapters 6 and 7 have no objective (`-`), so they are screened once, by the first Network+ unit: screening agents of about 50 items each read all 200 blind copies (`practice-q\6-Q*.txt`, `practice-q\7-Q*.txt`; `brief-read.md`, "Screening") and record each item's unit, lesson, section where one is printed, and the bullet it asks about, and that unit's chat lists them in the Network+ part of `docs/CONTENT-NOTES.md`, as Unit 2.0 did for Messer's 5.x items. That unit maps its own; every later unit maps only the items listed for it.
- **The answer count comes from the key.** A few items have two keys without saying "Choose two", and some "Choose all that apply" items have one key. The index's `answers` column has the true count. The site allows one answer or a stated two or three, so an item with four or five keys (18 in the book) is used only if the one distinction it tests still works as a choose two or choose three (CONTENT-GUIDE, "Where questions come from").
- **The book prints most question numbers over 99 without their hundreds digit** (Q100 as "00.", Q271 as "71."). The script numbers them correctly, so use the index's names, not the numbers on the page.
- The domain chapters drill every objective, so how many items an objective has there shows how a fact is asked, not how often (`brief-weight.md`).

`extract-aids.ps1 -Exam network-plus` reads the decks in `Slides`, the Blookets in `Activities` and `Blooket`, and the unit's own study guide folder, `Study Guides\Net+ Unit 6.0 Review` (its PDFs as text, and its `.tex` source copied as it is, which marks every correct choice `\CorrectChoice`). On 2026-11-15 that was 3 lesson decks, the study guide with its key, and its `.tex` for Unit 6.0, 12 files for Unit 4.0, and 8 for Unit 1.0. Decks kept in `Activities` (`Net+ Unit 1.0 Review_3.pptx`, `Net Unit 4.0 Subnetting Review.pptx`, `Net Subnetting Practice.pptx`) are not read: open them by hand. The Unit 1.0 KEY has no text layer (its `.txt` comes out empty): read its key from the `.tex`.

## Known quirks on this PC

- Windows PowerShell 5.1. Read and write files as UTF-8 explicitly (the scripts do).
- `pdftotext` and `pdfinfo` came with MiKTeX. Capturing `pdftotext` output from the pipeline garbles non-ASCII characters: always write to a file. Git Bash finds a different `pdftotext` (xpdf, in `/ucrt64/bin`) whose output the scripts are not built for: run them from PowerShell.
- Git and the GitHub CLI are installed but may be missing from `PATH` in a chat opened before they were: they are in `C:\Program Files\Git\cmd` and `C:\Program Files\GitHub CLI`.
