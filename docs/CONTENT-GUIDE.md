# Content guide

This is the contract between the website and whoever writes the questions and flashcards. The website is built in one chat; **content is written in a separate chat** and dropped into `data/`. Everything here is enforced or reported by the content check (`tools/validate.html`; the same check runs on GitHub before every deploy).

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
4. Add an empty `questions/manifest.json` and `flashcards/manifest.json` (`{ "$schema": "../../../schemas/manifest.schema.json", "packs": [] }`).
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
| `exhibit` | Optional, for a question about a command's output or a short configuration: `{ "type": "text", "text": "..." }`, shown under the stem in a fixed-width box, and referred to in the stem ("Based on the output shown, ..."). Written fresh for each question, consistent with the reading, and never copied from a source item's output. At most 12 lines of at most 25 characters each (a longer line wraps on a 320 px phone), lines separated by `\n`, no em dashes. |
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

## Where questions come from (the rule)

From Mr. Flauto's own unit-review rules:

> A book item never appears as written. Keep the objective and the one distinction it tests; change the scenario, the wording, and the option text; keep the option count and whether it is select-one or select-two. Someone comparing the two should see a cousin, not a copy.

- **The exam decides what is written and how much.** Each unit's questions are weighted by the CompTIA objectives and by evidence of what the exam asks (the objective's verb, the exam's keyed practice exam, the troubleshooting items in Domain 5 that depend on the unit). How often the CertMaster pool or Mr. Flauto's materials repeat a fact does not set its weight.
- **Questions read like the exam:** short scenarios ending in "Which of the following BEST…" or "MOST likely…", with real distractors from the same unit.
- Every question is modeled on a CertMaster pool item or a practice-exam item (`origin.basedOn`), never invented from nothing. Mr. Flauto's study-guide and review-deck items (`teacher`) are used only to cover an exam-weighted fact that no pool or practice-exam item covers, and his keys are checked against the reading like any other source.
- **Each exam's keyed practice exam.** A+ Core 1: the Professor Messer practice exams. Network+: the book *CompTIA Network+ Practice Tests, Exam N10-009* (third edition), which has the same role Messer has for A+ Core 1 (Mr. Flauto, 2026-11-14): the closest stand-in for the exam, and a source questions are modeled on alongside the CertMaster pool. Neither book is a source of truth. The CertMaster reading keys every answer, a book's key included, and every question cites only the reading. Students never see where a question came from.
- **One question per fact.** The pool and the practice exam often test the same fact several times. When they do, write one question (two only when the scenarios make a student reason differently), so a short random test does not ask the same thing twice.
- If the reading contradicts itself or is plainly wrong on a point, no question is keyed to that point until Mr. Flauto settles it.
- The CertMaster pool export has **no answer key**. Every item is keyed against the reading. When the book and the reading disagree, the reading wins.
- Pool and practice exam items that say "Select all that apply" or "Choose all that apply" become a fixed "Choose two/three" with 5 options (the real exam always gives the count), or a one-answer item when the practice exam's key gives one answer. The key gives the true count. An item with four or more answers (18 in the Network+ practice exam, and CertMaster 4.0 Q224, "Select four") is used only if the one distinction it tests still works as a choose two or choose three; otherwise skip it. On this site the option counts in the `choices` row above apply even where the rule quoted above says to keep the source's count.
- **An item belongs to the unit whose reading answers it.** Some objectives are taught across several units (objective 3.5 is in lessons 2.2, 3.1, 3.4, and 4.1), so a practice-exam item or an objective bullet waits for the unit whose reading answers it. A practice-exam item is used once per exam.

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
