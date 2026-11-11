# Brief: independent checks for <<EXAM>> Unit <<UNIT>>

Each check is run by a separate agent that has not seen the writing or the chat's reasoning, and it sees only the files named for it. The chat fills in every `<<...>>`, runs `assemble.ps1` and then `strip-for-check.ps1` to make the blind copies, and starts the checks in parallel. A check writes nothing except its own findings file, `SP\findings\<check>-<lesson or "cards">.json`, with the Write tool, and replies with only the number it flagged. The findings files are what the chat works from, so they survive a summary of the chat.

`SP` = `<<SCRATCHPAD>>`. Reading sections are `SP\text\<section>.txt`. Objectives and titles are in `C:\CompTIA Website\data\<<EXAM FOLDER>>\objectives.json` and `units.json`.

## 1. Blind key check (one agent per lesson or about 25 questions)

Sees `SP\check\questions-blind.json` and the reading sections it cites. Nothing else: not `data/`, not the packs, not the source items.

For each question: answer it from the cited section alone, then write

```json
{ "id": "c1-u03-q012", "answer": ["b"], "settles": "yes | partly | no",
  "otherDefensible": "a choice the section also supports, or none",
  "tagFits": "yes | no: why", "why": "one or two sentences quoting the deciding words" }
```

`settles: partly` means the section points to the key but leaves a distractor open. The chat compares each answer with the key: every mismatch, `partly`, `no`, or `otherDefensible` other than none is fixed or dropped.

## 2. Exam-style review (one agent per lesson)

Sees the questions (the pack with keys, `SP\packs\unit-NN.questions.json`), each question's source item (`SP\pool\`, `SP\messer\`, or Mr. Flauto's item in `SP\aids\`), and the reading. Its job is Mr. Flauto's goal: does each question read like the real exam and test what the exam tests?

For each question write

```json
{ "id": "...", "exam": "strong | ok | weak", "copy": "fine | too close",
  "flags": ["giveaway: ...", "distractor: ...", "wording: ...", "two facts", "recall the exam would not ask", "answer count changed"],
  "fix": "a concrete rewrite of the stem or the choices, or empty" }
```

- `exam: weak` when the exam would not ask it this way (bare recall where the exam uses a scenario, a trivial or invented detail, a scenario that gives the answer away).
- `copy: too close` when the stem or choices keep the source item's scenario or sentence shape. A cousin, not a copy.
- `answer count changed` when a single-answer source became choose two or three, or the reverse.
- Giveaways: the key repeats a distinctive stem word, is the only plural, is far longer, or is the only one with an article or example. Distractors must be real terms from the unit that a student could confuse with the key.
- House style: plain 10th-grade wording, at most two sentences in the stem, no em dashes, BEST, MOST likely, FIRST, and NOT in capitals.

## 3. Cards, three agents

- **Backs to terms.** Sees `SP\check\card-backs.json` only. For each back, names the one term it describes, or says it fits more than one (and which).
- **Terms to backs.** Sees `SP\check\card-terms.json` and the cited sections. For each term, writes the back a prepared student would give, in one line.
- **Fact check.** Sees the card pack (`SP\packs\unit-NN.flashcards.json`) and the reading. For each card: `true`, `partly`, or `false` against its cited section, with the words that decide it and a corrected back when it is not `true`. Also flags a card whose term is not named in any of the unit's objective bullets, a card that duplicates another, and a card whose sections are outside the unit.

The chat rewrites or drops every card the first agent cannot name uniquely, every card whose meaning the second agent misses, and every card the third agent does not mark `true`.

## After the checks

1. Checkers report ids. Find each question id's slot in `SP\packs\ids.tsv` (and each card in `card-ids.tsv`). Put every fix in `SP\work\fixes-<lesson>.json` (same shape as the drafts, with the slot id) or in `SP\work\cards.json`, or drop the slot from `spec.json` and say why in the plan file. Note what you changed in `progress.txt`.
2. Run `assemble.ps1` again. Dropping a slot or a card renumbers every id after it, so take the changed ids from the new `ids.tsv` and `card-ids.tsv`. Run `strip-for-check.ps1 -Only <the changed ids>`, then check every changed item again with fresh agents: the blind key check for every changed question, the exam-style review for any question whose stem or choices you rewrote, and all three card checks for every card you rewrote. Fixing an item yourself and calling it checked is not allowed.
3. Repeat until nothing is flagged, for questions and cards. A question that cannot be keyed cleanly from the reading is dropped, not argued.
