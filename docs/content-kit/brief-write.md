# Writing brief: <<EXAM>> Unit <<UNIT>> questions and flashcards

The content chat fills in every `<<...>>` and gives this, with `brief-read.md`, to each writing agent. Both are binding.

`SP` = `<<SCRATCHPAD>>`

## Mr. Flauto's goal

The site prepares students for the real CompTIA exam. **Each unit's questions are weighted toward what actually appears on the exam, and presented the way the exam presents it.** When the CertMaster pool and the exam disagree on what matters, the exam wins. The exam's keyed practice exam (Professor Messer's for A+ Core 1, the practice exam book for Network+) is the closest stand-in for the exam. The slots you are given already carry that weighting: write each one as the exam would ask it.

## How the exam presents an item

- **Mostly short scenarios.** "A technician is installing...", "A user reports...", "An administrator needs...", then "Which of the following BEST...", "Which of the following is the MOST likely cause?", or "Which of the following should the technician do FIRST?".
  - "Given a scenario" objectives are asked as install, choose, configure, or diagnose scenarios.
  - "Compare and contrast" objectives are asked as "pick the technology that meets this requirement" (speed, capacity, redundancy, size, range, cost).
  - "Summarize" and "Explain" objectives allow short direct items: "Which of the following BEST describes...?", "Which of the following is MOST associated with...?".
- **Bare recall** ("What is a thumb drive also called?") becomes a requirement or a scenario where the exam would ask it that way. If the exam would never ask it, say so instead of writing it.
- **Distractors are real.** Every wrong choice is a real term or action from the same unit that a student could confuse with the key. Use Mr. Flauto's mix-ups where he lists them (<<PATH TO HIS STUDY GUIDE'S MIX-UPS OR CONFUSIONS SECTION, OR "none">>). No joke or throwaway choices.
- **Choose two (or three)** exactly where the source item is multiple response, keyed with the choices the reading supports, and never for a single-answer source (Mr. Flauto's rule: keep whether it is select-one or select-two). The site adds "Choose two." itself.
- Performance-based questions cannot be shown on this site, but a multiple-choice item can test the same decision a PBQ does: pick the level, part, or setting from requirements, or match a symptom to its cause. Prefer those decisions.

## Rules for every question (Mr. Flauto's, binding)

1. **A cousin, not a copy.** Every question is modeled on exactly ONE source item and names it in `origin.basedOn`. Keep the objective, the one distinction it tests, and whether it has one answer or asks for two or three. Change the scenario, the wording, and the option text. Someone comparing the two should see a cousin, not a copy. No source item appears as written.
   - Pool items: `"origin": { "kind": "certmaster-variation", "basedOn": "CertMaster 3.0 Q41" }`.
   - Messer items: `"kind": "messer-variation", "basedOn": "Messer B6"`. A Messer item is used once per exam.
   - Network+ practice exam items: `"kind": "practice-exam-variation", "basedOn": "Practice Tests 1 Q33"`, written exactly that way. An item is used once per exam.
   - Mr. Flauto's items: `"kind": "teacher", "basedOn": "Study Guide 3.0 Q12"` or `"Review 2.0-3.0 slide 85"`. When one of his items is close to a pool or practice exam item, base the question on that item instead.
2. **The reading decides the answer.** Key every question from the section you cite. <<KNOWN READING PROBLEMS: key nothing to these>>
3. **One question per fact.** Your slot names the fact. Do not test a second fact in the same question.
4. **Option counts.** Exactly 4 choices for one answer. 5 for choose two or three, and 6 only when the source item had 6 or more.
5. **Wording.** CompTIA voice, plain enough for a 10th grader meeting the topic for the first time. Stem at most two sentences. "BEST", "MOST likely", and "FIRST" in capitals. A negative question only with NOT in capitals. No em dashes. No "all of the above" or "none of the above". Never "(Select TWO.)" or a stated answer count in the stem.
6. **No giveaways.**
   - Choices are parallel and similar in length.
   - The key never repeats a distinctive word from the stem that no distractor shares.
   - The key is not the only plural, the only one without an article, the longest by far, or the only one with an example.
7. **Tags.** `objectives`: the CompTIA objective plus its best-fitting bullet (`["3.4", "3.4.c"]`); the objective alone when no bullet fits; two bullets only when the question tests both equally. `units` and `reference.section`: the section of Unit <<UNIT>> that answers it, never a section of another unit. `reference.title`: copied exactly from `units.json`.
8. **`reference.quote` stays empty** (Mr. Flauto adds quotes). `reference.find`: 3 to 6 words copied from ONE line of `SP\text\<section>.raw.txt`, from the sentence that answers the question. It must not cross a line or page break, and must not include a word hyphenated across lines.
9. **Leave out `status`** (published) and `shuffleChoices`. Do not worry about which letter the key is: `assemble.ps1` spreads the keys. Where the choices have a natural order (sizes, speeds, cable categories, Wi-Fi standards, RAID levels), list them in that order and add `"keepOrder": true` to the draft (it does not go into the pack).
10. **A command's output goes in an exhibit.** When the slot's source item shows output (ipconfig, tracert, nslookup, netstat, a routing table) or the question needs a short configuration, add `"exhibit": { "type": "text", "text": "..." }` to the draft and point the stem at it ("Based on the output shown, ..."). Write it fresh for this question: addresses, names, and values that fit the reading and the scenario, never a source item's output or its values. At most 12 lines of at most 25 characters each (a longer line wraps on a 320 px phone), lines separated by `\n`, no em dashes. The exhibit and the stem together must settle the answer.

## Your slots

<<THE SLOTS THIS AGENT WRITES, from plan-counts.json: each slot id with its lesson, bullet, the fact it tests, its source item, and the section that answers it>>

## Question JSON

Write `{ "questions": [ ... ] }` to `<<OUTPUT FILE, for example SP\work\draft-2.1.json>>` with the Write tool, one object per slot with your slot's id in `slot`, and reply with only the count. You may write nothing else.

```json
{
  "slot": "q07",
  "stem": "...",
  "choices": [ { "id": "a", "text": "..." }, { "id": "b", "text": "..." }, { "id": "c", "text": "..." }, { "id": "d", "text": "..." } ],
  "answer": ["b"],
  "objectives": ["3.4", "3.4.c"],
  "units": ["3.2.6"],
  "reference": { "source": "certmaster", "section": "3.2.6", "title": "RAID 0 and RAID 1", "quote": "", "find": "mirrored drive configuration using two" },
  "origin": { "kind": "certmaster-variation", "basedOn": "CertMaster 3.0 Q41" }
}
```

A question with an exhibit (rule 10) adds `"exhibit": { "type": "text", "text": "C:\\>ipconfig\nIPv4: 169.254.20.7" }` after `stem`.

## Flashcards

Mr. Flauto's rule: flashcards cover only what is testable (`C:\CompTIA Website\docs\CONTENT-GUIDE.md`, "Which terms get a card").

- **Your cards.** Write exactly these, one card each, and no others: <<THE "card" ROWS OF SP\card-terms.tsv: term, test, bullet, the objective or practice exam words that pass it, section>>. Add no term the list leaves out, even one the reading teaches clearly; if you think one is missing, name it in your reply instead. A part, tool, cause, or fix that a listed symptom or task turns on goes on that card's back, not on a card of its own. The chat may not add exceptions to this list.
- **Front.** The term as the exam writes it: the words of the objective, bullet, or detail, with the reading's other name in parentheses when it has one. Give the acronym and its expansion the way the exam writes them: "SATA (Serial Advanced Technology Attachment)". A bare value (an RPM figure, a wattage, a voltage) is not a term.
- **Back.**
  - One plain line a student could say out loud, useful without the reading open.
  - What the term is or does, and the fact that tells it apart from the other terms in its bullet. Leave out numbers, parts, menu paths, brands, and file formats the reading adds unless they are that telling fact.
  - Cover the front, and the back points to exactly one term. Cover the back, and a prepared student could say it.
  - True to the reading, word for word where it matters (counts, speeds, which one is which). No em dashes.
- **One card per term** in the exam. The terms that already have cards in earlier units are listed here: <<TERMS ALREADY CARDED, FROM THE EXAM'S FLASHCARD PACKS>>. Write no card for those: list them in your reply instead.
- **Tags.** `objectives`: the objective plus the bullet on your list. `units` and `reference.section`: sections of Unit <<UNIT>> only.

Write `{ "flashcards": [ ... ] }` to `SP\work\cards.json` with the Write tool and reply with only the count and the already-carded terms you skipped. You may write nothing else:

```json
{ "term": "RAID 5", "definition": "...", "objectives": ["3.4", "3.4.c"], "units": ["3.2.7"], "reference": { "source": "certmaster", "section": "3.2.7", "title": "RAID 5 and RAID 10" } }
```

## Style models

The published packs are the models: `C:\CompTIA Website\data\a-plus-core-1\questions\unit-03.json` and `flashcards\unit-03.json` (the house model for every exam), and any published pack of this exam. Match their voice and length. Do not reuse their scenarios.
