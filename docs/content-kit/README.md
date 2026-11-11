# Content kit

Tools for the content chats (one chat per unit, started with `docs/CONTENT-HANDOFF.md`). The scripts read Mr. Flauto's sources and write only to the chat's scratchpad. They never write under `data/`: the chat copies finished packs in with the Write and Edit tools. Built and tested on A+ Core 1 Unit 3.0 (2026-11-10).

Run a script with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\CompTIA Website\docs\content-kit\<script>.ps1" -Scratch "<scratchpad>" ...
```

Through `-File`, a list argument arrives as one string: write `-Only q005,q019` and the script splits it.

## In the order a unit uses them

| Step | File | What it does |
|---|---|---|
| 1 | `extract-sources.ps1` | Reading sections (every unit's, so you can tell which unit answers an item), CertMaster pools (numbered), Messer items with and without keys, Messer index, exam details, all as text. Run once per chat. About 3 minutes. The 15 performance-based Messer items get no blind copy: they are not usable anyway. |
| 1 | `extract-aids.ps1 -Unit N` | Mr. Flauto's lesson decks, review decks, Blookets, and the unit study guide with its key, as text. Corroboration only. |
| 2 | `brief-read.md` | Brief for the agents that map every source item: section, key from the reading, bullet, find phrase, fact, or why it is not usable here. |
| 3 | `brief-weight.md` | Brief for the two ranking agents (exam evidence, course coverage) and the rules for turning their ranks into question counts. Exam evidence decides. |
| 4 | `brief-write.md` | Brief for the agents that draft each lesson's questions and the unit's flashcards. |
| 5 | `assemble.ps1 -Unit N.0` | Builds both packs from the drafts, checks every mechanical rule, spreads the answer keys, writes the house layout and one paste-ready file per lesson. |
| 6 | `strip-for-check.ps1 -Unit N.0` | Blind copies for the checkers: questions without keys, card backs alone, card terms alone. |
| 6 | `brief-review.md` | Brief for the independent checks: blind key check, exam-style review, three card checks. Then fix, re-assemble, re-check the changed items. |

Each brief has `<<...>>` blanks. The chat copies it to the scratchpad, fills them in, and gives the agent the path.

## Scratchpad layout

```
<scratchpad>\
  text\<section>.txt, <section>.raw.txt, _index.csv    extract-sources.ps1
  pool\<file>.txt                                       extract-sources.ps1
  messer\<label>.txt, messer-<exam>.tsv                 extract-sources.ps1
  messer-q\<label>.txt                                  extract-sources.ps1 (no key, for blind checks)
  examdetails.txt                                       extract-sources.ps1
  aids\                                                 extract-aids.ps1
  plan-unitNN.tsv                                       the chat's plan file: one line per source item
  plan-counts.json                                      the weighting result (brief-weight.md)
  spec.json                                             the slots, in pack order
  work\draft-<lesson>.json, cards.json                  drafts
  work\revised-<lesson>.json, fixes-<lesson>.json       after review; later files win
  packs\                                                assemble.ps1 output
  check\                                                strip-for-check.ps1 output
```

## File shapes

`spec.json` (lessons in book order, slots in order):

```json
{ "lessons": { "2.1": [ { "slot": "q01" }, { "slot": "q02" } ], "2.2": [ { "slot": "q03" } ] } }
```

Drafts, revisions, and fixes all use the same shape, keyed by `slot`. A later file replaces the whole question for that slot:

```json
{ "questions": [ { "slot": "q01", "stem": "...", "choices": [ { "id": "a", "text": "..." } ], "answer": ["a"],
  "objectives": ["2.5", "2.5.b"], "units": ["2.1.4"],
  "reference": { "source": "certmaster", "section": "2.1.4", "title": "...", "quote": "", "find": "..." },
  "origin": { "kind": "certmaster-variation", "basedOn": "CertMaster 2.0 Q14" } } ] }
```

`work\cards.json`: `{ "flashcards": [ { "term", "definition", "objectives", "units", "reference": { "source", "section", "title" } } ] }`

Ids are assigned by `assemble.ps1` in spec order (`c1-u02-q001`, `c1-u02-f001`). They are only final once the pack is in `data/`: settle which slots to drop before the last assembly.

## What `assemble.ps1` checks

Choice ids and counts (4 for one answer, 5 for two or three, a note at 6), answers that are not choices, duplicate choice text, unknown objectives or sections, titles that do not match `units.json`, find phrases (3 to 6 words, on one line of the raw section text, not a header or footer, not half of a hyphenated word), em dashes, banned phrases, stems over two sentences, a lowercase negative question, a source item used twice, a Messer item or a flashcard term already used in another unit's pack.

It then spreads the keys: a single-answer key moves (by swapping two choices) only while its letter holds more than a quarter of the keys, and a choose-two or choose-three item with its keys at the top is rotated. Choices with a natural order (sizes, voltages, RAID levels) are never touched. `packs\keys-moved.txt` lists every move. `-NoSpread` turns it off.

## Known quirks on this PC

- Windows PowerShell 5.1. Read and write files as UTF-8 explicitly (the scripts do).
- `pdftotext` and `pdfinfo` came with MiKTeX. Capturing `pdftotext` output from the pipeline garbles non-ASCII characters: always write to a file.
- Git and the GitHub CLI are installed but may be missing from `PATH` in a chat opened before they were: they are in `C:\Program Files\Git\cmd` and `C:\Program Files\GitHub CLI`.
