# Brief: independent checks for <<EXAM>> Unit <<UNIT>>

Each check is run by a separate agent that has not seen the writing or the chat's reasoning, and it sees only the files named for it. The chat fills in every `<<...>>`, runs `assemble.ps1` and then `strip-for-check.ps1` to make the blind copies, and starts the checks in parallel. A check writes nothing except its own findings file, `SP\findings\<check>-<lesson or "cards">.json`, with the Write tool, and replies with only the number it flagged. The findings files are what the chat works from, so they survive a summary of the chat.

`SP` = `<<SCRATCHPAD>>`. Reading sections are `SP\text\<section>.txt`. Objectives and titles are in `C:\CompTIA Website\data\<<EXAM FOLDER>>\objectives.json` and `units.json`.

## 1. Blind key check (one agent per lesson or about 25 questions)

Sees `SP\check\questions-blind.json` and the reading sections it cites. Nothing else: not `data/`, not the packs, not the source items.

For each question: answer it from the cited section alone (with the question's exhibit, when it has one), then write

```json
{ "id": "c1-u03-q012", "answer": ["b"], "settles": "yes | partly | no",
  "otherDefensible": "a choice the section also supports, or none",
  "tagFits": "yes | no: why", "why": "one or two sentences quoting the deciding words" }
```

`settles: partly` means the section points to the key but leaves a distractor open. The chat compares each answer with the key: every mismatch, `partly`, `no`, or `otherDefensible` other than none is fixed or dropped.

**A follow-up of the Command line tool** (a Command line pass) gets this check from `SP\check\followups-blind.json` and the sections each one cites. Each entry is a version's follow-up question with its `outputs`: what the tool prints for each answer group (its prompt and line, then the output), since the question is asked whichever right line was typed. The agent answers the question once under each output, from that output and the cited section alone, and writes one result per output to `SP\findings\blind-followups-<unit>.json`, with the version id in `id` and `"output": 1` (2, 3) added. Every output must settle the key: a version where one does not is fixed (its output or the task) or loses its follow-up.

## 2. Exam-style review (one agent per lesson)

Sees the questions (the pack with keys, `SP\packs\unit-NN.questions.json`), each question's source item (`SP\pool\`, the practice exam in `SP\messer\` or `SP\practice\`, or Mr. Flauto's item in `SP\aids\`), and the reading. Its job is Mr. Flauto's goal: does each question read like the real exam and test what the exam tests?

For each question write

```json
{ "id": "...", "exam": "strong | ok | weak", "copy": "fine | too close",
  "flags": ["giveaway: ...", "distractor: ...", "wording: ...", "exhibit: ...", "reference: ...", "two facts", "recall the exam would not ask", "answer count changed", "restatement: same as ..."],
  "fix": "a concrete rewrite of the stem or the choices, or empty" }
```

- `exam: weak` when the exam would not ask it this way (bare recall where the exam uses a scenario, a trivial or invented detail, a scenario that gives the answer away).
- `copy: too close` when the stem or choices keep the source item's scenario or sentence shape. A cousin, not a copy.
- `answer count changed` when a single-answer source became choose two or three, or the reverse.
- **Each fact's questions side by side.** A fact may have two or three questions (`brief-weight.md`, "Reconcile"): each slot's fact is in `SP\plan-counts.json`, and `SP\packs\ids.tsv` gives each slot's id. Read every fact's questions together, in other lessons too, and flag the weaker of any pair that restates the other (`restatement: same as <id>`): the same scenario or symptom, the same direction, the same stem frame, or the same set of choices.
- Giveaways: the key repeats a distinctive stem word, is the only plural, is far longer, or is the only one with an article or example. Distractors must be real terms from the unit that a student could confuse with the key.
- House style: plain 10th-grade wording, at most two sentences in the stem, no em dashes, BEST, MOST likely, FIRST, and NOT in capitals.
- **An exhibit** (a question's `exhibit` text, such as a command's output): flag `exhibit: ...` when it copies the source item's output or values, does not match the reading, does not settle the answer with the stem, or would not show cleanly at 320 px (more than 12 lines, or a line over 25 characters, which wraps on a phone). Flag a stem that says "shown" with no exhibit.
- **The reference:** flag `reference: ...` when the cited section does not teach the key (it only names the topic, or teaches a distractor), or when the `find` phrase is not on the sentence that gives the key (for a worked answer, the sentence of its rule), runs across two sentences, or runs from one table cell into the next (Ctrl+F in the PDF misses it).

## 3. Cards, four agents

- **Backs to terms.** Sees `SP\check\card-backs.json` only. For each back, names the one term it describes, or says it fits more than one (and which). Another name or spelling of the same term (multilayer switch for Layer 3 switch) is the same term, not a second one.
- **Terms to backs.** Sees `SP\check\card-terms.json` and the cited sections. For each term, writes the back a prepared student would give, in one line.
- **Fact check.** Sees the card pack (`SP\packs\unit-NN.flashcards.json`) and the reading. For each card: `true`, `partly`, or `false` against its cited section, with the words that decide it and a corrected back when it is not `true`. Also flags a card that duplicates another, a card whose sections are outside the unit, and a back that contains its own term, the term's spelled-out name, or the command it defines (in Definition first mode that back gives the answer away).
- **Testable check.** Sees the card pack, "Which terms get a card" in `C:\CompTIA Website\docs\CONTENT-GUIDE.md`, `objectives.json` and `units.json`, the unit's sections, and the practice exam items with their index (<<SP\messer\ OR SP\practice\>>). It never sees `card-terms.tsv` or the chat's notes. For each card it writes `{ "id": "...", "term": "...", "test": "A | B | C | fail", "bullet": "3.4.c", "words": "the objective, bullet, or detail words, or the practice exam item and the words of its question or key, that pass the term", "backExtra": "reading detail on the back (a figure, port, product name, or command syntax) that is neither the fact telling the term apart from the other terms in its bullet nor in a practice exam item, or none" }` to `SP\findings\cards-testable.json`.

The chat rewrites or drops every card the first agent cannot name uniquely, every card whose meaning the second agent misses, and every card the third agent does not mark `true` or flags. It drops every card the testable check marks `fail`: no rewrite, no new tag, no argument. It trims every `backExtra`, and a trimmed back goes through the first three checks again.

## 4. Blind command check (a Command line pass: one agent per unit)

Sees `SP\check\commands-blind.json` (each command's id, system, and task) and the command sections: <<THE COMMAND SECTIONS OF EVERY WRITTEN UNIT, as SP\text\<section>.txt: the sections of the lessons that list the exam's command line objective (Network+: 5.5), plus each command's cited section>>. Nothing else: not `data/`, not the packs, not the line list, not the partner questions, not the source items. The same check, given each item's job instead of its task (`SP\check\jobs-<unit>.json`, which the chat writes from the line list: the slot as `id`, the system, and the job as `task`), is the second line finder of step 2 of the pass.

For each command: every line it would type at that system's prompt to do the job as asked, from the sections alone, with the section and the words that teach each line, written the way the section prints it with the task's own addresses and names. Then, apart, any line a real system would also run for that job that no section teaches. Then write

```json
{ "id": "n-u04-c003", "lines": [ { "line": "arp -a", "section": "4.4.3", "words": "the words that teach it" } ],
  "alsoRuns": ["a line a real system runs for this job that no section teaches"],
  "clear": "yes | no: what the task leaves open (two jobs, a value it does not print, more than one taught line that does it)" }
```

to `SP\findings\blind-commands-<unit>.json`. Nothing goes in `lines` that the agent did not find in a section.

The chat runs every line in `lines` and `alsoRuns` through the try-a-line box (the content check's Command line panel, `docs/CONTENT-HANDOFF.md`, "A Command line pass", step 7), writes the result next to each line in `SP\findings\blind-lines-<unit>.tsv` (id, line, taught or also, section, the box's result), and settles each one:

- **Accepted**, or a slip that uses no try (Wrong address, Not in this tool, Not counted): nothing to do.
- **A taught line the command refuses** (Wrong command, or Right command, wrong details): add it to `accept` (its own group when it prints other output, as the guide's "The accepted lines" says) and to the line list, or narrow the task so that it no longer does the job.
- **A line that works on a real system but no command section teaches:** put it in the command's `alsoWorks` and in the line list (group `also`), so it costs no try. A Windows line goes in only after the chat has run it on its PC, and only if it is a line the guide's "Output" lists as safe to run. A Linux or device line goes in, and the report lists it for Mr. Flauto's look. Never a second spelling of an accepted line: how a line may be typed is the matcher's.
- **A real spelling of an accepted line that the box charges a try for** (capitals, the order of switches): never stored. The report lists it for a website chat: it needs a test row in the matcher's case table (`tools/command-cases.json`).
- **An accepted line the agent never typed and no section teaches:** remove it.
- **`clear: no`:** rewrite the task.

## 5. Output and style review (a Command line pass: one agent per unit)

Sees the assembled pack with its lines and outputs (`SP\packs\unit-NN.commands.json`), each command's partner questions or card (by id, in `C:\CompTIA Website\data\<<EXAM FOLDER>>\questions\` and `flashcards\`), the source item of a command with an `origin` (`SP\pool\`), the cited sections and each group's `sections` (`SP\text\`), the section "A command (the Command line tool)" and the `exhibit` row of `C:\CompTIA Website\docs\CONTENT-GUIDE.md`, and the known problems: <<KNOWN READING PROBLEMS>>. For each command write

```json
{ "id": "...", "task": "strong | ok | weak",
  "flags": ["task: ...", "output: ...", "layout: ...", "reference: ...", "follow-up: ..."],
  "fix": "a concrete rewrite of the task or an output, or empty" }
```

to `SP\findings\review-commands-<unit>.json`.

- **`task: ...`** when the task is not CompTIA voice in one or two plain sentences ending in a question mark, keeps the partner's or the source item's scenario, does not name its system in words, leaves out a value a line needs or prints the loopback answer, holds a line, a switch, or the command's name (a verb included) where the guide does not let it name the tool, leaves another taught line doing the job as asked, or does not lead into its follow-up (another system, other addresses, or something its stem contradicts). `weak` when the exam would not ask it this way.
- **`output: ...`** when an output is not what that line prints on a real system, does not match the reading's meaning, copies a source item's, a partner's, or the reading's values (an `exhibitOf` output is a follow-up's own exhibit and is fine), does not show what the task asked for with the task's addresses, breaks the limits (12 lines of 25 characters, records folded as the writing brief says, no em dash), starts with the prompt and the line, prints a TTL value in a ping output, or leans on the Linux netstat interface switch; or when the outputs of one version do not show the same values.
- **`layout: ...`** when a Linux, router, or switch output does not follow the reading's figures. Nobody in the pipeline can run those commands: the chat lists every such output for Mr. Flauto's look either way.
- **`reference: ...`** when the cited section does not teach the command's lines, or the `find` phrase is not on the sentence that teaches it, as for a question.
- **`follow-up: ...`** when an output under a follow-up does not show the values its question reads.

## After the checks

1. Checkers report ids. Find each question id's slot in `SP\packs\ids.tsv` (and each card in `card-ids.tsv`). Put every fix in `SP\work\fixes-<lesson>.json` (same shape as the drafts, with the slot id) or in `SP\work\cards.json`, or drop the slot from `spec.json` and say why in the plan file. Note what you changed in `progress.txt`.
2. Run `assemble.ps1` again. Dropping a slot or a card renumbers every id after it, so take the changed ids from the new `ids.tsv` and `card-ids.tsv`. Run `strip-for-check.ps1 -Only <the changed ids>`, then check every changed item again with fresh agents: the blind key check for every changed question (not for a change to its `find` phrase alone, which that checker never sees), the exam-style review for any question whose stem, choices, or exhibit you rewrote, and the first three card checks for every card you rewrote (the testable check again only for a card whose front or tags changed). Fixing an item yourself and calling it checked is not allowed.
3. Repeat, for questions and cards, at most three rounds. Stop after the third round: drop any question or card still flagged then, and list it in the report. Every changed question still gets its blind key check. A question that cannot be keyed cleanly from the reading is dropped, not argued.
4. **Commands and versions** (a Command line pass). Find each reported command or version id in `SP\packs\command-ids.tsv`. A command's and a version's ids never change when you re-assemble: `assemble.ps1 -CommandsOnly` keeps them. Put every fix in `SP\work\commands-<unit>-fixes-<n>.json` (the whole command, by its slot: a later file wins), and every line you add or take out in `SP\command-lines-<unit>.tsv` too. To drop a command, take its rows out of the line list and say why in `progress.txt`. Run `assemble.ps1 -CommandsOnly` again, copy the pack into `data/` again, run `strip-for-check.ps1 -Only <the changed ids>`, and check every changed command again with fresh agents: the blind command check when its task or its lines changed, the output and style review when its task or an output changed, and the follow-up key check when an output under a follow-up changed. At most three rounds, as above: a command still flagged after the third is dropped, not argued, and listed in the report.
