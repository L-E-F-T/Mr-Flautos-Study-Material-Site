# Content guide

This is the contract between the website and whoever writes the questions, flashcards, and commands. The website is built in one chat; **content is written in a separate chat** and dropped into `data/`. Everything here is enforced or reported by the content check (`tools/validate.html`; the same check runs on GitHub before every deploy).

## Where content lives

```
data/
  exams.json                          every exam (live or planned) and its book(s)
  a-plus-core-1/
    objectives.json                   CompTIA 220-1201 objectives v4.0 (domains → objectives → bullets)
    units.json                        CertMaster Learn 15.0 units → lessons → reading sections
    questions/
      manifest.json                   lists the public question packs, e.g. "unit-03.json"
      unit-03.json                    one pack per unit
      manifest.private.json           LAB ONLY, never committed (see "Lab-only packs")
      private/…                       LAB ONLY, never committed
    flashcards/
      manifest.json
      unit-03.json
  network-plus/                       the same layout, plus:
    commands/                         Command line packs ("A command"), only for an exam with commandUnits
      manifest.json
      unit-04.json                    the launch pack for a unit
      unit-04-extra.json              the extra set, only on Mr. Flauto's word
      bank.json                       the command bank ("The command bank"), not listed in the manifest
```

Add a pack: save the file next to `manifest.json` and add its name to `"packs"`. Remove a pack: take it out of the list and delete the file.

## What students see where there is no content yet: "Coming soon"

The site labels anything without content **Coming soon**, and it works that out from the data. Nothing is typed into a data file to make it happen, and nothing has to be removed when the content arrives.

| What has no content | What the site shows |
|---|---|
| An exam whose `status` in `data/exams.json` is not `live` | Its card on the home page says Coming soon and has no buttons |
| A live exam with question packs but no flashcard packs (or the other way round) | The home card shows that study mode as Coming soon; the other one works |
| A unit, lesson, domain, or objective that no published item is tagged to | A greyed-out row labeled Coming soon in the practice-test topic list and in the flashcard term table. It cannot be picked |
| An objective bullet that no published question is tagged to | The same, in the practice-test topic list by exam objective (the only list that shows bullets) |
| An exam that has the Command line tool (`commandUnits` in `data/exams.json`) and no command pack listed | Its home card shows Command line as Coming soon, and the Command line page reads Coming soon |
| A unit that `commandUnits` lists with no published command | A greyed-out unit row labeled Coming soon in Command line. It cannot be picked. When no listed unit has a published command, the whole page reads Coming soon |
| The extra set, while no extra pack has a published command | The Extra commands row in Command line is greyed out, with a Coming soon chip |
| A system with no entry in the command bank (or no bank yet) | Help on that system's commands prints Coming soon |

An exam without `commandUnits` shows no Command line at all: no button, no tab, and its `commands.html` address goes to the home page. Only a website chat sets that field.

What that means for whoever writes content:

- **Tag every item as specifically as you can** (the bullet, `3.4.c`, and the reading section, `3.2.6`). A bullet or lesson stays "Coming soon" until at least one published item is tagged to it, even if its objective or unit has items.
- Draft items (`"status": "draft"`) do not count: a lesson with only drafts still says Coming soon.
- Never write "coming soon", "TBD", or filler items to make a topic look covered. An empty topic is labeled for you.
- Write whole lessons at a time where you can, so a lesson goes from Coming soon to complete rather than showing one or two questions.
- The content check lists coverage by objective and by lesson, so it shows exactly which topics still say Coming soon.

## Adding another exam (Core 2, Network+, Security+)

The other exams are already listed in `data/exams.json` with `"status": "planned"`, so each shows on the home page as Coming soon. To build one:

1. Make its folder, for example `data/a-plus-core-2/`, with the same layout as `data/a-plus-core-1/`.
2. Write `objectives.json` from CompTIA's official exam objectives PDF for that exam code, word for word: domains with their weights, objectives, and bullets. Bullet ids (`1.1.a`, `1.1.b`, …) are assigned in the order CompTIA prints them. Use `data/a-plus-core-1/objectives.json` as the model and `schemas/objectives.schema.json` for the format. The Core 1 file was transcribed twice, independently, and the two copies compared; do the same. Keep every nested line, at any depth, in `details`: test A in "Which terms get a card" reads them. Network+'s objectives document is CertMaster's `B.1.3 Exam Objectives for CompTIA Network+ N10-009` (CompTIA's own PDF is not in Mr. Flauto's folders): take its wording, but never the outline number it prints on every line ("4.1 -", "4.1.1 -") or its Lesson Index column; nest the members it prints beside their list's heading (3.4's record types, its zone types Forward and Reverse, and 3.2's SNMP versions v2c and v3); and take the weights from `B.1.2 Exam Details`.
3. Write `units.json` from the courseware Mr. Flauto teaches from: units, lessons, and the reading sections that exist, with the section numbers and titles exactly as printed on the pages (a file name can differ). Each lesson's `objectives` are those in its "Exam Objectives Covered" box, plus, for Network+, every objective whose B.1.3 Lesson Index names the lesson (Mr. Flauto, 2026-11-14). Leave out the course introduction and each unit's "Additional Resources" lesson: they have no reading. A lesson whose sections are not printed yet has `"sections": []` (Network+ Units 8.0 to 14.0, for now). Only A+ Core 1's Unit 1.0 is `notOnExam`. Model: `data/a-plus-core-1/units.json`.
4. Add an empty `questions/manifest.json` and `flashcards/manifest.json` (`{ "$schema": "../../../schemas/manifest.schema.json", "packs": [] }`). A `commands/manifest.json` comes with the exam's first command pack. The Command line tool also needs `commandUnits` on the exam in `data/exams.json`, which only a website chat adds.
5. In `data/exams.json`, give the exam a `dataPath`, a `sources` entry keyed `certmaster` that names the courseware (the kit writes every `reference.source` as `certmaster`), and `facts` with only what the exam details print, and change `status` to `"live"`. The content check only checks live exams, so do this as soon as the two outline files are in, then run the check.
6. Add packs unit by unit. Until an exam has its first pack, its home card still says Coming soon.

Ids must be unique across all exams, so each starts with its exam's short course code (the content check reports an id another exam already uses): `c1-` (A+ Core 1), `c2-` (A+ Core 2), `n-` (Network+), `s-` (Security+), then unit and number, for example `c2-u11-q004`.

A pack file looks like this:

```json
{
  "pack": { "id": "unit-03", "title": "Unit 3.0 Installing System Devices", "reviewed": false },
  "questions": [ … ]
}
```

(`"flashcards": [ … ]` in a flashcard pack.)

## A question

```json
{
  "id": "c1-u03-q007",
  "stem": "A technician is adding a second drive so a user's data survives one drive failing. Which RAID level BEST meets this need with only two drives?",
  "choices": [
    { "id": "a", "text": "RAID 0" },
    { "id": "b", "text": "RAID 1" },
    { "id": "c", "text": "RAID 5" },
    { "id": "d", "text": "RAID 10" }
  ],
  "answer": ["b"],
  "objectives": ["3.4", "3.4.c"],
  "units": ["3.2.6"],
  "reference": {
    "source": "certmaster",
    "section": "3.2.6",
    "title": "RAID 0 and RAID 1",
    "quote": "",
    "find": "disk mirroring"
  },
  "origin": { "kind": "certmaster-variation", "basedOn": "CertMaster 3.0 Q41" }
}
```

| Field | Rule |
|---|---|
| `id` | Unique across all exams. Pattern: `c1-u03-q007` (course code, unit, number; Network+ is `n-u06-q007`). Never reuse an id: students' saved progress points at it. |
| `stem` | CompTIA voice, one or two short sentences, plain enough for a 10th grader. "BEST" / "MOST likely" phrasing. A negative stem only with NOT in capitals. No em dashes. |
| `exhibit` | Optional, for a question about a command's output or a short configuration: `{ "type": "text", "text": "..." }`, shown under the stem in a fixed-width box, and referred to in the stem ("Based on the output shown, ..."). Written fresh for each question, consistent with the reading, and never copied from a source item's output. At most 12 lines of at most 25 characters each (a longer line wraps on a 320 px phone), lines separated by `\n`, no em dashes. The output a command prints in the Command line tool keeps the same limits ("A command"). |
| `choices` | Single answer: exactly 4. Choose two or three: 5 (6 only when the source item had 6 or more). This count applies whatever the source item had. Parallel, similar length, distractors from the same unit. No "all/none of the above". |
| `answer` | Choice ids. One id = single answer. Two or more = the site shows "Choose two." / "Choose three." automatically, so never write "(Select TWO.)" in the stem. |
| `objectives` | The objective (`3.4`) plus the best-fitting bullet (`3.4.c`). Bullet ids are listed in `objectives.json`. If no bullet fits, tag the objective alone (the site lists it under "General"); if the question tests two bullets equally, tag both. Never borrow a bullet that does not fit. A+ Core 1's Unit 1 (troubleshooting methodology) has no exam objective, so it may be left empty. Network+ tests the methodology as objective 5.1. |
| `units` | The reading section that answers it (`3.2.6`): the one that teaches the key, not one that only names the topic or teaches a distractor. The site rolls it up to lesson 3.2 and unit 3.0 for filtering. Only sections of the pack's own unit: a section of an unwritten unit would make its lesson show one stray item instead of "Coming soon". |
| `reference` | Always required. `section` must exist in `units.json`. The site shows **Reading 3.2.6** RAID 0 and RAID 1, followed by the quote. |
| `reference.quote` | The one or two sentences from the reading that answer the question, word for word, 40 words max. |
| `reference.find` | Helper for the teacher only: a short phrase to Ctrl+F in that section's PDF to locate the quote. Never shown to students. Take it from the sentence that gives the key (for a worked answer, the sentence of its rule), on one line of the reading and inside that sentence: Ctrl+F does not find a phrase that crosses a page break, a word hyphenated across two lines, or a table's columns (in a table, stay inside one cell). |
| `origin` | Where the idea came from: `certmaster-variation`, `messer-variation` (A+ Core 1's practice exams), `practice-exam-variation` (Network+'s practice exam book), `original`, or `teacher`. `basedOn` names the item ("CertMaster 3.0 Q41", "Messer B44", "Practice Tests 1 Q33"), numbered as in "Numbering source items" below. |
| `status` | Leave out (published) or `"draft"` to hide it from students. Preview drafts with `?drafts=1` on the URL. |

The site shuffles choices for every student (turn off per question with `"shuffleChoices": false`), but a student can switch shuffling off, so spread the keys evenly across a, b, c, and d within each lesson and within the pack (the kit's `assemble.ps1` does this). Where the choices have a natural order (sizes, voltages, RAID levels), keep that order and let the key fall where it falls.

What students see with a question: right or wrong immediately, the reading reference and quote, and at the end of a test a list of every question they missed with a button to retry those.

## A flashcard

```json
{
  "id": "c1-u03-f012",
  "term": "RAID 5",
  "definition": "Striping with parity spread across the drives. Needs at least 3 drives and survives one drive failing.",
  "objectives": ["3.4", "3.4.c"],
  "units": ["3.2.7"],
  "reference": { "source": "certmaster", "section": "3.2.7", "title": "RAID 5 and RAID 10" }
}
```

Students choose "Term first" or "Definition first", so one card covers both directions.

### Which terms get a card

Mr. Flauto's rule (2026-11-14): flashcards cover only what is testable, so a student never studies a term the exam does not use. Judge each term against the objectives that the unit's lessons list in `units.json`, as written in the exam's `objectives.json`. A term gets a card only if it passes one of these tests:

- **A. Named.** The objective's title, one of its bullets, or a detail under a bullet (at any depth) names the term, or names the exact thing the card defines. Examples: SATA ("Communications interfaces > SATA"), Spindle speeds, Inaccurate system date/time, the 110-120 VAC input range.
- **B. One kind of a named group.** An objective, bullet, or detail names a group without listing its members (iterations, categories, standards, types, configurations, options), and the term is one of the kinds the unit's reading lists for it (DDR4, Cat 6, 802.11ac). Where the objectives list the members themselves (Network+ 3.4 lists its DNS record types: A, AAAA, CNAME, MX, text, NS, and pointer), only those pass, by test A. A mode, part, feature, or step inside one kind is not a kind. Examples: DDR4 ("Double Data Rate (DDR) iterations"), Cat 6 ("Copper > Categories"), 802.11ac ("802.11 standards"), LGA ("CPU socket types"), BSOD ("Proprietary crash screens"), an active adapter ("Adapters"). A record type that 3.4 leaves out, such as SOA or SRV, can pass only by test C, and those two fail it: the practice exam has them only as wrong choices.
- **C. Keyed by the practice exam.** An item of the exam's keyed practice exam that is tagged to one of those objectives asks about the term (its question turns on what the term is or does), or has the term, or the exact thing the card defines, as its correct answer. A wrong choice, an explanation, or a term the item only mentions in its scenario or in a command's output while it asks about something else does not count (the DUID in the ipconfig /all output of "Practice Tests 5 Q97", which asks about the default gateway). In the Network+ book's Chapters 6 and 7, which carry no objective, the bullet the item asks about decides. Examples: the RTC battery (Messer A56's key), and for Network+ the TCP three-way handshake (the key of Practice Tests 1 Q123, objective 1.4).

Nothing else gets a card: not a term only the reading teaches, however true or clear; not a term only the CertMaster pool or Mr. Flauto's materials use; and not a part, tool, cause, or fix that a named symptom or task turns on (the fuser, the static eliminator, the OSD) unless it passes a test on its own. That fact goes on the back of the named card instead. The term must also be taught, not just named, by a section of the unit.

Each unit writes its list in `card-terms.tsv` before any card is written (`docs/CONTENT-HANDOFF.md`, step 2), the card writer writes only that list, and an independent testable check applies these tests to every card (step 8). A card that fails is dropped, not argued.

### What makes a good flashcard

Check every card against this before it goes in:

- **The front passes "Which terms get a card"**, written the way the exam writes it: the words of the objective, bullet, or detail, with the reading's other name in parentheses if it has one ("110-120 VAC input (low-line voltage)"), and an acronym with its expansion ("SATA (Serial Advanced Technology Attachment)"). A bare measurement or detail from the reading (an RPM figure, a wattage) is not a term.
- **The back is useful on its own.** It says what the thing is or does in one plain line a student could say out loud, without needing the reading open.
- **The back stays on what is testable.** It gives what the term is or does and the fact that tells it apart from the other terms in its bullet. A number, part, menu path, brand or product name, file format, or command syntax the reading adds belongs on the back only when it is that telling fact or a practice exam item turns on it.
- **It works both ways.** Cover the back: could a prepared student say it? Cover the front: does the back point to exactly one term?
- **The back never names its term.** Not the term, its spelled-out name, or the command it defines: in Definition first mode the back is the question, so that back gives the answer away. Where a section gives a protocol only by its name and port, the back is "The protocol that uses well-known port 22."
- **It is tagged to the bullet that passes it:** the objective plus the bullet that names the term (test A) or its group (test B); for test C, the bullet the practice exam item asks about, or the objective alone when no bullet fits.
- **Never two cards for one term in an exam.** The same term is often named by bullets taught in different units (SATA, M.2, DHCP). Before writing a card, search the exam's flashcard packs for the term. If a card already exists, do not write a second one (the content check warns about repeats). Instead, the later unit adds its own section to that card's `units`, and changes nothing else on it, so the card also shows under the later lesson.
- **The back is true to the reading.** Every card is checked against the section it cites, not just for style: a back can read well and still be wrong.
- Mr. Flauto signs off on a unit's cards when he reads the pack and marks it reviewed.

## A command (the Command line tool)

Command line is the third study tool, for Network+ only so far: one exam-style task at a time, above a prompt for the system the task names (Windows, Linux, Router, Switch). The student types the command. A right line prints example output, then the reading. A wrong command, or the right command with wrong details, adds a try; there is no limit, and the results count the tries each command took. A slip that is not a recall mistake (a wrong address the task gave, a misspelled command name) costs nothing, and so does help: `help` lists the commands the tool covers on the task's system, and a command's own help (`ipconfig /?`, `show ?`) its switches ("The command bank"), except on a command with help off, where it prints Help off ("Help off"). An exam has the tool only when its entry in `data/exams.json` has `commandUnits`, which only a website chat sets. The build plan is `docs/COMMAND-LINE-PLAN.md`.

A command pack (`data/network-plus/commands/unit-04.json`) looks like this:

```json
{
  "pack": { "id": "unit-04", "title": "Unit 4.0 Configuring Network Addressing", "reviewed": false },
  "commands": [
    {
      "id": "n-u04-c001",
      "typedFormOf": ["n-u04-q033"],
      "system": "windows",
      "task": "(one or two sentences that end by asking which command)",
      "accept": [
        { "lines": ["ipconfig"] },
        { "lines": ["ipconfig /all"] }
      ],
      "versions": [
        { "id": "n-u04-v001",
          "outputs": [ { "exhibitOf": "n-u04-q054" }, { "text": "(written fresh, 12 by 25)" } ],
          "followUp": { "question": "n-u04-q054" } },
        { "id": "n-u04-v002",
          "outputs": [ { "exhibitOf": "n-u04-q059" }, { "text": "(written fresh, 12 by 25)" } ],
          "followUp": { "question": "n-u04-q059" } }
      ],
      "objectives": ["5.5", "5.5.a"],
      "units": ["4.4.1"],
      "reference": { "source": "certmaster", "section": "4.4.1", "title": "ipconfig", "quote": "", "find": "(three to six words)" }
    }
  ]
}
```

| Field | Rule |
|---|---|
| `id` | Pattern: `n-u04-c001` (course code, unit, the letter c, a number). Shared with no question, card, or version of any exam. Never reuse an id: a saved drill points at it. |
| `typedFormOf` | Always a list: the published questions, or the one command flashcard, of this exam whose command line this command types ("Which lines may be asked"). |
| `origin` | Present exactly when no id in `typedFormOf` is a question (a card's command, a command Mr. Flauto names, an extra command): the one source item the command is modeled on, written as for a question. |
| `system` | `windows`, `linux`, `router`, or `switch`. The prompt (`C:\>`, `$`, `Router#`, `Switch#`) is set in code. |
| `task` | One or two sentences that name the system and end by asking which command ("The task"). |
| `accept` | One to three answer groups, each `{ "lines": [...] }`, with `sections` when a section other than the reference teaches the group's lines ("The accepted lines"). |
| `alsoWorks` | Optional: lines a real system would run for this job that the reading does not teach ("Lines that work but are not taught"). |
| `versions` | One to three. Each has an id of its own (`n-u04-v001`, never reused), one output for each answer group in the order of `accept`, and at most one `followUp`. An output is `{ "text": "..." }`, which may be empty, or `{ "exhibitOf": "<question id>" }`, which prints the exhibit of the version's own follow-up ("Output", "The follow-up question", "Output versions"). |
| `objectives`, `units`, `reference` | As for a question, with the quote rule 5 of "Quotes from the book" gives. A command is listed under the unit its `units` roll up to; once the exam has `commandUnits`, that unit must be one it names. |
| `status` | Leave out (published) or `"draft"` to hide it from students. Preview drafts with `?drafts=1`. |
| `help` | Leave out (help is on), or `false` to turn help off on the command ("Help off"). It goes on the line under `id`. |

No weight is stored. The draw works it out from the source of the partner question (the practice exam book's two full tests, Practice Tests 6 and 7, count 3, the rest of the book 2, anything else 1; with several partners the highest counts), or from the command's own `origin`.

### Which lines may be asked

- **The launch set:** every command line that a published question or command flashcard of the exam asks, each tied to that item by `typedFormOf`, and any command Mr. Flauto names. A line found only on a card's back is not one. For Network+ the list is in `docs/CONTENT-NOTES.md` (Network+, "Command line").
- **The extra set:** a line the reading teaches in a written unit (a unit of the exam whose question pack is published) that a CertMaster pool item or a practice exam item asks and no published question or card asks. It is written only when Mr. Flauto asks for it, in a pack of its own marked `"set": "extra"`, and students choose whether to include it.
- **Never:** a line that no source item asks, however clearly the reading teaches it.

### The task

One or two sentences in CompTIA voice that end by asking which command, with a question mark. It is a new scenario: not the source item's and not its question's. It may share its follow-up's system, addresses, and setting. It names the system in words: a Windows PC, a Linux server, a router, a switch. It prints every address, name, and interface the answer needs, except the loopback address. It never holds an accepted line or a switch. Unless the task may name the tool, it never uses the command's name in any form, a verb included ("ping the server"). It may name the tool only where the paired question's stem names it, or every choice of that question is a line of that tool. It is worded so that the lines the reading teaches are the only taught lines that do the job as asked.

This paragraph is the rule for naming the tool. The content check refuses a task that holds a stored line or a switch, but on the tool's name it only warns on the gross case (every stored line starts with the tool and has two words the task does not give), so a task the check passes can still break the rule.

### The accepted lines

The reading keys every answer, and for a command the key is a list: every line that a command section of a written unit teaches for that job on that system. The command sections are the sections of lessons that list the exam's command line objective (Network+: 5.5), plus the section the item cites.

- A line is stored the way the reading prints it, or the way the objectives print a device command: full words, lower case on Windows and on devices, with the task's own addresses and names, 36 characters at most.
- Lines that print the same output form one answer group. A different right command is its own group with its own output. So is a taught switch that only adds detail or changes how the result is shown (`ipconfig /all` for `ipconfig`, `tracert -d` for `tracert`, `netstat -n` beside another netstat line), and such a switch is stored only when the blind check finds it for that job.
- A switch that changes what the command does (`ping -t`, `tracert -h`, `traceroute -I`) is never accepted for the plain job.
- An item has at most three answer groups. If more lines qualify, the task is rewritten to narrow the job.
- A group whose lines are taught by a section other than the one the item cites names that section in `sections`.
- Nothing the reading does not teach is ever required or accepted.

### Lines that work but are not taught

A line the blind check types that a real system would run for the job, and that no command section teaches, is never added to `accept`. It goes in the command's `alsoWorks`, so it costs no try and prints no output: the tool reads it Not counted. The list starts empty and grows only from what the blind check types. A Windows line is run on this PC first, and only if it changes nothing ("Output" lists what may be run). A Linux or device line is listed for Mr. Flauto to look at. A content chat never puts a second spelling of an accepted line in `alsoWorks`: how a line may be typed is the matcher's ("Two authorities"), and a router or switch short form such as `sh ip ro` already costs nothing.

### Two authorities

The reading decides which command is right. That is content, and it is in the pack. The real system decides how that command may be typed: capitals, a slash or a hyphen, spacing, the order of switches, short forms such as `ip a`. That is code: the matcher (`assets/js/lib/command-match.js`) and its test lines (`tools/command-cases.json`). Only a website chat changes them, every rule has a test line, and a Windows rule is added only after the line was run on a Windows PC. A content chat never stores a second spelling of a line to make it pass, and never edits the matcher or its test lines. If the tool refuses a line that a real system accepts, it tells Mr. Flauto the line.

### Output

Each answer group prints its own output, and the output follows the exhibit rule (the `exhibit` row of "A question"): written fresh, true to the reading, never a source item's or the reading's values, at most 12 lines of at most 25 characters, no em dashes, records folded onto two lines. It shows what that command prints, and it shows what the task asked for, with the task's own addresses. It does not start with the prompt and the line: the box has just printed them. An output may be empty where the real command prints nothing (`arp -d *`). A long output shows only its first lines and the lines the task asked about. Nothing is added to say it was cut.

Where the reading shows no output for a command, the layout comes from the real tool. On this PC a content chat runs only commands that change nothing (`ipconfig`, `ipconfig /all`, `arp -a`, `route print`, `netstat` with `-n`, `-an`, `-ano`, `-e`, `-s`, or `-r`, and `ping` or `tracert` to 127.0.0.1), and it keeps no value from the PC. It never runs `ipconfig /release`, `/renew`, `/flushdns`, or `/registerdns`, `arp -d`, `arp -s`, a `route` or `netsh` line that changes a setting, or anything that asks for an administrator. No one in the pipeline can run a Linux or device command. Those layouts come from the reading's figures, and the content chat's report lists them for Mr. Flauto to look at. Where the reading and the real tool differ in meaning, the reading's meaning wins and the scenario avoids the case. A ping output prints no TTL value, and nothing leans on the Linux netstat interface switch.

### The follow-up question

After the output prints, a version may ask one multiple-choice question about that output. It is asked whichever right line was typed, and after Show answer too. The follow-up is a published question of the exam that reads this command's output and has a text exhibit: `"followUp": { "question": "n-u04-q059" }`. It stays one question, shown in Practice test and here. A follow-up must need the printed output: a question whose stem already says what the output shows is not used, and neither is a question that asks which command made the output. A question follows one output only.

The output printed for the answer group whose command made that question's exhibit is the exhibit itself (`{ "exhibitOf": "n-u04-q059" }`). When the exhibit's first line is the prompt and a line that group accepts (`C:\>ipconfig`), the tool leaves that line out, because the box has just printed it. Every other answer group's output carries the same values. The task leads into the follow-up: the same system, the same addresses, and nothing its stem contradicts.

For now every follow-up is a published question, and the content check refuses a follow-up written in place. When Mr. Flauto orders new ones (phase 3 of `docs/COMMAND-LINE-PLAN.md`), a new follow-up is a full question (stem, choices, answer, tags, reference, origin), modeled on one unused source item that reads this command's output. It passes every check a question passes, with the output as its exhibit.

### Output versions

A command may have two or three versions. Each has one output for every answer group and, where the command has a follow-up, its own follow-up with its own right answer, so the follow-up cannot be memorized. The task and the accepted lines are the same in every version.

### Packs and ids

`data/<exam folder>/commands/` holds a manifest and, for each unit, the launch pack (`unit-04.json`) and, only on Mr. Flauto's word, the extra pack (`unit-04-extra.json`, with `"set": "extra"` in its pack header). Each has its own `"reviewed"` flag. A command is `n-u04-c001` and a version is `n-u04-v001`. No id is shared with a question, a card, a command, or a version of any exam, and none is ever reused. If a paired question or card is deleted, the site hides its command, and the content check blocks publishing until the command is dropped too.

### The checks

- **The blind command check.** An agent that has not seen the accepted lines, the outputs, or the paired question reads only each task, its system, and the command sections of every written unit. It lists every line it would run, with the section and words that teach each one. Every line is run through the tool's own matcher: the try-a-line box in the Command line panel of the content check. A taught line the item refuses is added, or the task is narrowed. A line that works but is not taught goes in `alsoWorks` (above). An accepted line that no section teaches is removed.
- **The other checks** are the output and style review, the blind key check of every follow-up against the output it will be shown with, the content check, and `check-copy.ps1`.
- **Three rounds at most.** An item still flagged then is dropped, not argued.

### The command bank

The command bank is the text the terminal's help prints (Mr. Flauto, 2026-11-23 and 2026-11-26; `docs/COMMAND-LINE-PLAN.md` section 15). At the prompt, `help` or `?` lists every command the tool covers on the task's system, each with its words. A command's own help (`ipconfig /?`, `ip --help`, `show ?`) prints its syntax line (or, with none, its name) with its words, then every switch the reading teaches for it, with its words. Help costs no try; the results mark a command where help listed something, and Retry brings it back. Where the bank has no entry for the task's system, help prints Coming soon. A student never sees the words Command bank.

The bank is one file per exam, `data/<exam folder>/commands/bank.json`, beside the command packs. It is not a pack and is not listed in the manifest: the site and the content check read it by its name. Its shape is `schemas/command-bank.schema.json`:

```json
{
  "$schema": "../../../schemas/command-bank.schema.json",
  "bank": { "title": "Network+ command bank", "reviewed": false },
  "entries": [
    {
      "system": "windows",
      "command": "arp",
      "does": "(three to six words)",
      "syntax": "arp -s <IP> <MAC>",
      "section": "4.4.3",
      "switches": [
        { "switch": "-a", "does": "(three to six words)" },
        { "switch": "-s", "does": "(three to six words)" }
      ]
    }
  ]
}
```

| Field | Rule |
|---|---|
| `system` | `windows`, `linux`, `router`, or `switch`. A student sees only the entries of the task's system, in the order of the file. |
| `command` | The tool, written the way a stored line of that system starts with it: `ipconfig`, `ip`, `dig`. On a router or switch it is `show`. One entry for each tool on each system. |
| `does` | What the command does, in 3 to 6 words. |
| `syntax` | Only for a command that takes an address or a name: one line that starts with the command and shows where each value goes, in angle brackets (`arp -s <IP> <MAC>`), 36 characters at most. Left out for any other command. |
| `section` | The command section that teaches the command, for the record and the checks: help does not print it. |
| `switches` | Every switch the reading teaches for the command, each `{ "switch": "-a", "does": "..." }`, with a `section` of its own when a section other than the entry's teaches it. An empty list when the reading teaches none. |

- **Which commands.** One entry for each tool that a stored line of the exam's command packs starts with, on each system it runs on, and no other: the bank shows what the drill asks. A later Command line pass that adds a tool adds its entry too.
- **Which switches.** Every switch that a command section of a written unit ("The accepted lines") teaches for the command, whether or not a task asks for it, and nothing the reading does not teach. A switch is what follows the command's name: on Windows a slash or hyphen switch (`/all`, `-t`), on Linux a hyphen switch or the word that says what to show (`-n`, `addr`), and on a router or switch the words after `show` (`ip route`, `vlan`). A value the student types, such as an address or a name, is not a switch: the syntax line shows where it goes. Each switch is written the way the reading prints it.
- **The words.** 3 to 6 for each command and each switch, in plain 10th-grade wording, true to the section, with no em dashes.
- **Never an answer line.** No text in the bank holds a stored line of two or more words (`ipconfig /all`), and no syntax line holds an address or a name that a task gives. The student puts the line together. A one-word stored line, such as `netstat`, is the entry's own command, and that is shown.
- **Reviewed.** The bank has `"reviewed": false` until Mr. Flauto reads it.
- **The checks.** The content check refuses a bank that is not valid JSON or has no `entries` list; an entry with an unknown system, or a command that is not one word written as the tool's name; a second entry for one tool on one system; a switch with no text, or listed twice; a command or switch with no words; a section that `units.json` does not have; a syntax line that does not start with its command, shows no value in angle brackets, or is longer than 36 characters; a tab or an en or em dash in a command, switch, or syntax line; any text that holds a stored line of two or more words; and a syntax line that holds a value a task gives. It warns about words outside 3 to 6, an em dash in the words, an unknown field, `"reviewed": false`, a tool a stored line starts with that has no entry, a switch a stored line uses that its entry does not list, an entry whose command no stored line starts with, and an exam with command packs and no bank. It cannot see a taught switch that no task asks: the blind switch list of a Command bank pass (`docs/CONTENT-HANDOFF.md`) finds those.

### Help off

On some exam items, `help` does nothing, so the tool turns help off on some commands. Mr. Flauto, 2026-11-26: "Only off on the easiest so a content chat picks the ones students really shouldnt need help on. It should ultimaly be 25% of the total about". On a command with `"help": false`, `help`, `?`, and every command's own help (`ipconfig /?`, `show ?`) print Help off. That costs no try, and the results do not mark the command with Help. Show answer still appears after 2 counted tries.

- **Which commands.** The easiest: the ones students really should not need help on. Help off changes nothing else: the task, the lines, the outputs, and the follow-up stay as they are.
- **How many.** About a quarter of the exam's commands. The content check counts them on its `Command line:` line (`29 commands (0 extra), ..., 7 help off`) and gives no warning on the share, so the content chat keeps it. A help-off pass (`docs/CONTENT-HANDOFF.md`) marks the commands already published, and each later Command line pass marks the easiest of its unit's new commands, so the share stays about a quarter.
- **Where it goes.** `"help": false` on the line under the command's `id`, where `assemble.ps1` writes it. A rebuild of the unit keeps it on a command that keeps its id, as it keeps a quote. The content check refuses any other value. To turn help back on, take the line out.

## Where questions come from (the rule)

From Mr. Flauto's own unit-review rules:

> A book item never appears as written. Keep the objective and the one distinction it tests; change the scenario, the wording, and the option text; keep the option count and whether it is select-one or select-two. Someone comparing the two should see a cousin, not a copy.

- **The exam decides what is written and how much.** Each unit's questions are weighted by the CompTIA objectives and by evidence of what the exam asks (the objective's verb, the exam's keyed practice exam, the troubleshooting items in Domain 5 that depend on the unit). How often the CertMaster pool or Mr. Flauto's materials repeat a fact does not set its weight.
- **Questions read like the exam:** short scenarios ending in "Which of the following BEST…" or "MOST likely…", with real distractors from the same unit.
- Every question is modeled on a CertMaster pool item or a practice-exam item (`origin.basedOn`), never invented from nothing. Mr. Flauto's study-guide and review-deck items (`teacher`) are used only to cover an exam-weighted fact that no pool or practice-exam item covers, and his keys are checked against the reading like any other source.
- **Each exam's keyed practice exam.** A+ Core 1: the Professor Messer practice exams. Network+: the book *CompTIA Network+ Practice Tests, Exam N10-009* (third edition), which has the same role Messer has for A+ Core 1 (Mr. Flauto, 2026-11-14): the closest stand-in for the exam, and a source questions are modeled on alongside the CertMaster pool. Neither book is a source of truth. The CertMaster reading keys every answer, a book's key included, and every question cites only the reading. Students never see where a question came from.
- **One question per fact.** The pool and the practice exam often test the same fact several times. When they do, write one question (two only when the scenarios make a student reason differently), so a short random test does not ask the same thing twice.
- **A typed command is not a second question.** A command line that a published question or a command flashcard already asks may also be asked once by typing, in the Command line tool ("A command"). The typed command is the same fact in a second form, not a second question, and it names its question or card in `typedFormOf`. No question or card is the partner of two commands.
- If the reading contradicts itself or is plainly wrong on a point, no question is keyed to that point until Mr. Flauto settles it.
- The CertMaster pool export has **no answer key**. Every item is keyed against the reading. When the book and the reading disagree, the reading wins.
- Pool and practice exam items that say "Select all that apply" or "Choose all that apply" become a fixed "Choose two/three" with 5 options (the real exam always gives the count), or a one-answer item when the practice exam's key gives one answer. The key gives the true count. An item with four or more answers (18 in the Network+ practice exam, and CertMaster 4.0 Q224, "Select four") is used only if the one distinction it tests still works as a choose two or choose three; otherwise skip it. On this site the option counts in the `choices` row above apply even where the rule quoted above says to keep the source's count.
- **An item belongs to the unit whose reading answers it.** Some objectives are taught across several units (objective 3.5 is in lessons 2.2, 3.1, 3.4, and 4.1), so a practice-exam item or an objective bullet waits for the unit whose reading answers it. A practice-exam item is used once per exam. A command that is the typed form of a published question is read through that question's source item and carries no `origin` of its own, so the item is still used once. A command with no such question (a card's command, a command Mr. Flauto names, an extra command) and every new follow-up question is modeled on one source item that no question, command, or follow-up of the exam has used.

### Numbering source items

`origin.basedOn` must point at exactly one item, so everyone numbers them the same way:

- **CertMaster pool files** have no item numbers. Number items by position: count the lines that read `answer`. The item with the first `answer` line in `3.0.txt` is "CertMaster 3.0 Q1"; the one with the 41st is "CertMaster 3.0 Q41". Do not count `Select Question` lines: some files have none before their first item.
- **Messer items** keep the book's own labels: practice exam letter and question number ("Messer B44").
- **Network+ practice exam items** are named by the book's title, then its chapter number, then the question number: "Practice Tests 1 Q33" is question 33 of Chapter 1. Chapters 1 to 5 follow the exam's five domains, and Chapters 6 and 7 are the book's two full practice tests, so "Practice Tests 6 Q12" is question 12 of the first practice test. The book titles Chapters 6 and 7 "Practice Test 1" and "Practice Test 2", but their items are still named by chapter: "Practice Tests 6 Q12", never "Practice Tests 1 Q12" (that is Chapter 1's Q12). The book numbers its questions through each chapter. Take the number from the kit's index (`practice-N10-009.tsv`), not the page: the PDF drops the hundreds digit of numbers over 99, so Q100 prints as "00.". Write it exactly that way, with no leading zeros: `assemble.ps1` rejects any other spelling, so one item can never be used twice under two names.
- **Mr. Flauto's items** name the document and its own numbering: "Study Guide 3.0 Q56" (the unit study guide), "Review 2.0-3.0 slide 85" (a review deck).
- **Public packs never contain copied items.** An item marked `"origin": { "verbatim": true }` outside a `private/` folder is an error, and GitHub will refuse to deploy.

## Quotes from the book

Each question shows a short quote from the reading under the section name. Rules:

1. The sentence (or two) that actually answers the question, copied exactly.
2. 40 words max. The check warns above that.
3. The teacher adds quotes from his own copy of the reading. The fastest way is the **quote helper** at `http://localhost:8080/tools/quotes.html` (Chrome or Edge, with `serve.cmd` running):
   - Open a pack (for example `data/a-plus-core-1/questions/unit-03.json`) and, once, click **Choose readings folder** and pick the exam's reading folder in OneDrive `Documents`: `CompTIAA+\Book\bySubunit` or `CompTIANet+\Book\bySubunit`.
   - For each question it shows the stem, the correct answer, the reading section, and the `find` phrase. Click **Open 3.2.6 PDF**, press Ctrl+F, paste the phrase, then copy the sentence into the box. The word count turns red over 40.
   - **Save changes** writes straight back into the pack file.

   By hand instead: open the section PDF (for example `Book\bySubunit\3.2.6 RAID 0 and RAID 1.pdf`), search the `find` phrase, and paste the sentence into `"quote"`.
4. Until a quote is added, students still see "Reading 3.2.6 RAID 0 and RAID 1", and the content check counts questions still missing a quote.
5. A command shows the quote of the question it is the typed form of when both cite the same section, so a fact is quoted once. Only a command with no such question needs a quote of its own. Add it by hand for now: the quote helper opens only question packs.

## Lab-only packs

For content that should never be on the public internet (for example, items reused on graded quizzes), put the pack in a `private/` folder and list it in `manifest.private.json` next to `manifest.json`. Both are ignored by git, so they are never pushed to GitHub, and the deploy step strips them even if they slip in. Copy them to the lab server by hand. Check license terms before putting any third-party text there.

## Review workflow

1. New packs arrive with `"pack": { "reviewed": false }` (the check shows a warning).
2. Read each question in the site itself: `http://localhost:8080/practice.html?drafts=1`.
3. Fix or delete anything wrong, add quotes, then set `"reviewed": true`.
4. Run the content check (`http://localhost:8080/tools/validate.html`). Zero errors and no placeholder notice means it is safe to share with students.

## Marking something as placeholder yourself

Any pack can be flagged as throwaway test content with `"pack": { "placeholder": true }`. The site then shows the "Test content" banner, the content check warns until the pack is gone, and its items are left out of the coverage tables. Use ids that cannot collide with real ones (`ph-…`).

The first-pass Unit 3.0 placeholder packs (`ph-u03-…`) were deleted on 2026-11-10 when the real packs went in. Never reuse a `ph-` id: decks and tests saved on students' devices may still point at one. (The site drops a missing card from a saved deck and discards a saved test that holds a missing question.)
