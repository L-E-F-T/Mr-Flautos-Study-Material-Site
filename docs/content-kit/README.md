# Content kit

Tools for the content chats (one chat per unit, started with `docs/CONTENT-HANDOFF.md`). The scripts read Mr. Flauto's sources and write only to the chat's scratchpad. They never write under `data/`: the chat copies finished packs in with the Write and Edit tools, then `check-copy.ps1` proves the copy is exact. Built and tested on A+ Core 1 Unit 3.0 (2026-11-10). Content chats do not edit this folder: if a script fails, they stop and report it.

Run a script with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\CompTIA Website\docs\content-kit\<script>.ps1" -Scratch "<scratchpad>" ...
```

- Through `-File`, a list argument arrives as one string: write `-Only q005,q019,f012` and the script splits it.
- `-Unit` takes the unit number as `units.json` writes it for `assemble.ps1`, `strip-for-check.ps1`, and `check-copy.ps1` (`-Unit 2.0`), and a plain number for `extract-aids.ps1` (`-Unit 2`).
- The PowerShell tool stops a command after 2 minutes unless the call sets a longer timeout. Give `extract-sources.ps1` a 10-minute timeout (600000 ms) or run it in the background. A timeout is not a script failure: run it again with the longer timeout.

## In the order a unit uses them

| Step | File | What it does |
|---|---|---|
| 1 | `extract-sources.ps1` | Reading sections (every unit's, so you can tell which unit answers an item), CertMaster pools (numbered), Messer items with and without keys, the Messer index, and the exam details, all as text. Once per chat, about 3 minutes. The 15 performance-based Messer items get no blind copy: they are not usable anyway. |
| 1 | `extract-aids.ps1 -Unit N` | Mr. Flauto's lesson decks, review decks, Blookets, and the unit study guide with its key, as text. Corroboration only. |
| 3 | `brief-read.md` | Brief for the agents that map every source item: section, key from the reading, bullet, find phrase, fact, or why it is not usable here. |
| 5 | `brief-weight.md` | Brief for the two ranking agents (exam evidence, course coverage) and the rules for turning their ranks into question counts. Exam evidence decides. |
| 7 | `brief-write.md` | Brief for the agents that draft each lesson's questions and the unit's flashcards. |
| 8 | `assemble.ps1 -Unit N.0` | Builds both packs from the drafts, checks every mechanical rule, spreads the answer keys, and writes the house layout, one paste-ready file per lesson, and the id maps. |
| 8 | `strip-for-check.ps1 -Unit N.0` | Blind copies for the checkers: questions without keys, card backs alone, card terms alone. `-Only` limits them to the ids being re-checked. |
| 8 | `brief-review.md` | Brief for the independent checks (blind key check, exam-style review, three card checks) and the re-check loop. |
| 9 | `check-copy.ps1 -Unit N.0` | Confirms the packs in `data/` are exact copies of the assembled packs the checkers saw. Read-only. |

Each brief has `<<...>>` blanks. The chat copies it to the scratchpad, fills them in, and gives the agent the path. **Agents write their results to files** in the scratchpad (the brief or the task names the file) and reply with only counts, so the results survive a summary of the chat and never pass through it by hand.

## Scratchpad layout

```
<scratchpad>\
  text\<section>.txt, <section>.raw.txt, _index.csv    extract-sources.ps1
  pool\<file>.txt                                       extract-sources.ps1
  messer\<label>.txt, messer-<exam>.tsv                 extract-sources.ps1
  messer-q\<label>.txt                                  extract-sources.ps1 (no key, for blind checks)
  examdetails.txt                                       extract-sources.ps1
  aids\                                                 extract-aids.ps1
  progress.txt                                          the chat's own log: step, files made, agents out, notes for the report
  plan-unitNN.tsv                                       the chat's plan file: one line per source item
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

A draft may add `"keepOrder": true` when its choices have a natural order that the spread cannot detect. It never reaches the pack.

`work\cards.json`: `{ "flashcards": [ { "term", "definition", "objectives", "units", "reference": { "source", "section", "title" } } ] }`

`packs\ids.tsv` (id, slot, lesson, source) and `packs\card-ids.tsv` (id, term) map the ids that checkers report back to the slots and cards you fix. `assemble.ps1` numbers questions in spec order and cards in file order, so dropping one renumbers every id after it: take ids from the latest maps. That is fine until the pack is pushed. **Once a pack is on GitHub, its ids never change** (students' saved decks and tests point at them): it is never re-assembled again, only edited item by item.

## What `assemble.ps1` checks

Choice ids and counts (4 for one answer, 5 for two or three, a note at 6), answers that are not choices, duplicate choice text, unknown objectives or sections, a section outside the unit, titles that do not match `units.json`, find phrases (3 to 6 words, on one line of the raw section text, not a header or footer, not half of a hyphenated word), em dashes, banned phrases, stems over two sentences, a negative question asked in lowercase, a source item used twice, and a Messer item or a flashcard term already used in another unit's pack.

It then spreads the keys: a single-answer key moves (by swapping two choices) only while its letter holds more than a quarter of the keys, and a choose-two or choose-three item with its keys at the top is rotated. Choices whose texts are the same apart from their numbers and units (RAID 0/1/5/10, 4/8/16 GB, 3.3/5/12 V, 100 Mbps/1 Gbps, Cat 5e/6/6a, 802.11a/g/n/ac, Wi-Fi 6/6E) are never touched, and neither is a draft marked `"keepOrder": true`. `packs\keys-moved.txt` lists every move. `-NoSpread` turns it off.

## Known quirks on this PC

- Windows PowerShell 5.1. Read and write files as UTF-8 explicitly (the scripts do).
- `pdftotext` and `pdfinfo` came with MiKTeX. Capturing `pdftotext` output from the pipeline garbles non-ASCII characters: always write to a file.
- Git and the GitHub CLI are installed but may be missing from `PATH` in a chat opened before they were: they are in `C:\Program Files\Git\cmd` and `C:\Program Files\GitHub CLI`.
