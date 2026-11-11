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
2. Write `objectives.json` from CompTIA's official exam objectives PDF for that exam code, word for word: domains with their weights, objectives, and bullets. Bullet ids (`1.1.a`, `1.1.b`, …) are assigned in the order CompTIA prints them. Use `data/a-plus-core-1/objectives.json` as the model and `schemas/objectives.schema.json` for the format. The Core 1 file was transcribed twice, independently, and the two copies compared; do the same.
3. Write `units.json` from the courseware Mr. Flauto teaches from: units, lessons, and the reading sections that exist, with the section numbers and titles exactly as printed. Model: `data/a-plus-core-1/units.json`.
4. Add an empty `questions/manifest.json` and `flashcards/manifest.json` (`{ "packs": [] }`).
5. In `data/exams.json`, give the exam a `dataPath` and a `sources` entry naming the book, and change `status` to `"live"`. The content check only checks live exams, so do this as soon as the two outline files are in, then run the check.
6. Add packs unit by unit. Until an exam has its first pack, its home card still says Coming soon.

Ids must be unique within an exam and should start with a short course code: `c1-` (A+ Core 1), `c2-` (A+ Core 2), `n-` (Network+), `s-` (Security+), then unit and number, for example `c2-u11-q004`.

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
| `id` | Unique across the exam. Pattern: `c1-u03-q007` (course, unit, number). Never reuse an id: students' saved progress points at it. |
| `stem` | CompTIA voice, one or two short sentences, plain enough for a 10th grader. "BEST" / "MOST likely" phrasing. A negative stem only with NOT in capitals. No em dashes. |
| `choices` | Single answer: exactly 4. Choose two or three: 5 (6 only when the source item had 6 or more). This count applies whatever the source item had. Parallel, similar length, distractors from the same unit. No "all/none of the above". |
| `answer` | Choice ids. One id = single answer. Two or more = the site shows "Choose two." / "Choose three." automatically, so never write "(Select TWO.)" in the stem. |
| `objectives` | The objective (`3.4`) plus the best-fitting bullet (`3.4.c`). Bullet ids are listed in `objectives.json`. If no bullet fits, tag the objective alone (the site lists it under "General"); if the question tests two bullets equally, tag both. Never borrow a bullet that does not fit. Unit 1 (troubleshooting methodology) has no exam objective, so it may be left empty. |
| `units` | The reading section that answers it (`3.2.6`). The site rolls it up to lesson 3.2 and unit 3.0 for filtering. Only sections of the pack's own unit: a section of an unwritten unit would make its lesson show one stray item instead of "Coming soon". |
| `reference` | Always required. `section` must exist in `units.json`. The site shows **Reading 3.2.6** RAID 0 and RAID 1, followed by the quote. |
| `reference.quote` | The one or two sentences from the reading that answer the question, word for word, 40 words max. |
| `reference.find` | Helper for the teacher only: a short phrase to Ctrl+F in that section's PDF to locate the quote. Never shown to students. Take it from one line of the reading: a phrase that crosses a page break, or a word hyphenated across two lines, is not found by Ctrl+F. |
| `origin` | Where the idea came from: `certmaster-variation`, `messer-variation`, `original`, or `teacher`. `basedOn` names the item ("Messer B44", "CertMaster 3.0 Q41"), numbered as in "Numbering source items" below. |
| `status` | Leave out (published) or `"draft"` to hide it from students. Preview drafts with `?drafts=1` on the URL. |

The site shuffles choices for every student (turn off per question with `"shuffleChoices": false`), but a student can switch shuffling off, so spread the keys evenly across a, b, c, and d within a pack. Where the choices have a natural order (sizes, voltages, RAID levels), keep that order and let the key fall where it falls.

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

### What makes a good flashcard

Check every card against this before it goes in:

- **The front is something the exam names**: a term, acronym, port, standard, connector, or component the student has to recognize. A bare measurement or detail from the reading (an RPM figure, a wattage) is not a term.
- **The back is useful on its own.** It says what the thing is or does in one plain line a student could say out loud, without needing the reading open.
- **It works both ways.** Cover the back: could a prepared student say it? Cover the front: does the back point to exactly one term?
- **It is tied to an objective bullet.** Reading detail beyond the objectives is not card material.
- **One card per term in an exam.** The same term is often named by bullets taught in different units (SATA, M.2, DHCP). Before writing a card, search the exam's flashcard packs for the term. If a card already exists, do not write a second one (the content check warns about repeats). Instead, the later unit adds its own section to that card's `units`, and changes nothing else on it, so the card also shows under the later lesson.
- **The back is true to the reading.** Every card is checked against the section it cites, not just for style: a back can read well and still be wrong.
- Mr. Flauto signs off on a unit's cards when he reads the pack and marks it reviewed.

## Where questions come from (the rule)

From Mr. Flauto's own unit-review rules:

> A book item never appears as written. Keep the objective and the one distinction it tests; change the scenario, the wording, and the option text; keep the option count and whether it is select-one or select-two. Someone comparing the two should see a cousin, not a copy.

- **The exam decides what is written and how much.** Each unit's questions are weighted by the CompTIA objectives and by evidence of what the exam asks (the objective's verb, the Messer practice exams, the troubleshooting items in Domain 5 that depend on the unit). How often the CertMaster pool or Mr. Flauto's materials repeat a fact does not set its weight.
- **Questions read like the exam:** short scenarios ending in "Which of the following BEST…" or "MOST likely…", with real distractors from the same unit.
- Every question is modeled on a CertMaster pool item or a Messer practice-exam item (`origin.basedOn`), never invented from nothing. Mr. Flauto's study-guide and review-deck items (`teacher`) are used only to cover an exam-weighted fact that no pool or Messer item covers, and his keys are checked against the reading like any other source.
- **One question per fact.** The pool and the Messer book often test the same fact several times. When they do, write one question (two only when the scenarios make a student reason differently), so a short random test does not ask the same thing twice.
- If the reading contradicts itself or is plainly wrong on a point, no question is keyed to that point until Mr. Flauto settles it.
- The CertMaster pool export has **no answer key**. Every item is keyed against the reading. When the book and the reading disagree, the reading wins.
- Pool items that say "Select all that apply" become a fixed "Choose two/three" with 5 options (the real exam always gives the count). On this site the option counts in the `choices` row above apply even where the rule quoted above says to keep the source's count.
- **An item belongs to the unit whose reading answers it.** Some objectives are taught across several units (objective 3.5 is in lessons 2.2, 3.1, 3.4, and 4.1), so a Messer item or an objective bullet waits for the unit whose reading answers it. A Messer item is used once per exam.

### Numbering source items

`origin.basedOn` must point at exactly one item, so everyone numbers them the same way:

- **CertMaster pool files** have no item numbers. Number items by position: count the lines that read `answer`. The item with the first `answer` line in `3.0.txt` is "CertMaster 3.0 Q1"; the one with the 41st is "CertMaster 3.0 Q41". Do not count `Select Question` lines: some files have none before their first item.
- **Messer items** keep the book's own labels: practice exam letter and question number ("Messer B44").
- **Mr. Flauto's items** name the document and its own numbering: "Study Guide 3.0 Q56" (the unit study guide), "Review 2.0-3.0 slide 85" (a review deck).
- **Public packs never contain copied items.** An item marked `"origin": { "verbatim": true }` outside a `private/` folder is an error, and GitHub will refuse to deploy.

## Quotes from the book

Each question shows a short quote from the reading under the section name. Rules:

1. The sentence (or two) that actually answers the question, copied exactly.
2. 40 words max. The check warns above that.
3. The teacher adds quotes from his own copy of the reading. The fastest way is the **quote helper** at `http://localhost:8080/tools/quotes.html` (Chrome or Edge, with `serve.cmd` running):
   - Open a pack (for example `data/a-plus-core-1/questions/unit-03.json`) and, once, choose the CertMaster `Modules` folder.
   - For each question it shows the stem, the correct answer, the reading section, and the `find` phrase. Click **Open 3.2.6 PDF**, press Ctrl+F, paste the phrase, then copy the sentence into the box. The word count turns red over 40.
   - **Save changes** writes straight back into the pack file.

   By hand instead: open the section PDF (for example `Modules\3.2.6 RAID 0 and RAID 1.pdf`), search the `find` phrase, and paste the sentence into `"quote"`.
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
