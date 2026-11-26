# Brief: weighting <<EXAM>> Unit <<UNIT>> by the exam

The content chat fills in every `<<...>>` and gives this to two agents, one per lens, then reconciles their rankings itself (the last section). Read `brief-read.md` first for the files and the unit outline.

Mr. Flauto's goal: **each unit's questions are weighted toward what actually appears on the exam.** The site mirrors the CompTIA objectives and the evidence of what the exam asks. His own materials are based on the CertMaster platform and support that picture. They never set it.

`SP` = `<<SCRATCHPAD>>`

## What is ranked

Every objective bullet that this unit's reading teaches: <<LIST OF BULLETS, each with its objective's verb ("Given a scenario", "Compare and contrast", "Summarize", "Explain")>>. Rank bullets, and within a bullet name the distinct facts that matter (for 3.4.c: "RAID 1 survives one disk failure", "RAID 0 has no redundancy", "RAID 5 usable capacity").

For Network+, whose bullets are broad (3.4 has three bullets for all of DHCP, SLAAC, DNS, and the time protocols), rank each detail line under a bullet that this unit's reading teaches as its own row (`3.4.b` with topic "DNS > Record types", `1.4.a` with topic "Domain Name System (DNS) - 53"), each with its own tier. A fact under no detail line is tier 3 unless the exam evidence keys it.

The mapping is done: `SP\<<PLAN FILE>>` has one line per source item with its section, key, bullet, fact, and status.

**Facts the exam's packs already ask** on this unit's objectives, from earlier units (do not count them again): <<LIST, each with its question id, or "none">>.

Each lens agent writes its result as JSON to its own file (`SP\rank-exam.json` for lens A, `SP\rank-course.json` for lens B) with the Write tool and replies with only the number of bullets ranked. It may write nothing else.

## Lens A: exam evidence (this lens decides)

For each bullet, count and cite:

1. **Practice exam keyed items.** Items in the exam's practice exam index tagged with this bullet's objective whose answer turns on this bullet: `SP\messer\messer-<<EXAM CODE>>.tsv` (A+ Core 1, Messer) or `SP\practice\practice-<<EXAM CODE>>.tsv` (Network+). Note which Messer items are performance-based (A1 to A5, B1 to B5, C1 to C5): a PBQ shows what the exam asks students to do. The Network+ book has no PBQs, and its two full practice tests (Chapters 6 and 7) carry no objective: count the ones the plan file places on this bullet (from the Chapter 6 and 7 screen).
2. **Domain 5 links.** Practice exam items tagged 5.x (troubleshooting) that need this bullet's facts to answer: a RAID level's failure behavior, a power supply's rails, a memory symptom (A+ Core 1); a DHCP scope with no addresses left, a wrong DNS server, an APIPA address (Network+). Network+ lessons often list a 5.x objective themselves: its items are this unit's own evidence where this unit's reading answers them. Troubleshooting is the heaviest domain, so a fact it leans on is high yield even when its own objective is light.
3. **Distractor appearances.** Items where a term from this bullet is a wrong choice. Weak evidence: it shows the exam expects students to tell the terms apart.
4. **The verb.** "Given a scenario" objectives are asked as install, choose, or diagnose scenarios and are the likeliest PBQs. "Compare and contrast" is asked as "pick the technology that meets this requirement". "Summarize" and "Explain" are recognition and short scenarios.
5. **Domain weight** from `SP\examdetails.txt`.

Return for each bullet: a score from 1 to 10, a tier (1 = certain to be asked, several ways; 2 = likely; 3 = possible), the counts with item labels, and one sentence of rationale. Also estimate how many items a 90-question form holds for the bullet: its share of the 270 Messer items, times 90 (A+ Core 1). For Network+, the book's two full practice tests (Chapters 6 and 7, 200 items) stand in for the 270 Messer items: the bullet's share of the Chapter 6 and 7 items that test it, times 90. Check each domain's total against its weight in `SP\examdetails.txt`. The domain chapters (1 to 5) drill every objective, so their counts show how a fact is asked, not how often: use them only to break a tie between bullets of the same domain.

## Lens B: course coverage (this lens informs)

For each bullet: how much of the reading teaches it (sections and rough length), how many usable pool items test it, and how much Mr. Flauto stresses it in his materials (`SP\aids\`: study guide items, review-deck slides, Blooket questions, lesson-deck slides). Return a score from 1 to 10 and the counts.

## Reconcile (the chat does this, not an agent)

1. **The tier comes from lens A.** Where the two scores differ, write one line saying why lens A holds. Lens B can only break a tie, or show that a tier 2 or 3 fact is needed to understand a tier 1 item (then that fact gets a question).
2. **Counts.** Mr. Flauto, 2026-11-26: the units read light; exam evidence still sets the tiers, and the tiers now set how many questions a fact gets.
   - Tier 1: up to three questions for each distinct fact that has enough usable source items.
   - Tier 2: up to two questions for each distinct fact that has enough usable source items.
   - Tier 3: one question for each distinct fact that an objective's bullet or detail line names, or that the exam evidence keys, when it has a usable item. A fact under no bullet or detail line that the exam evidence does not key is listed under "cut".
   - Every bullet the reading teaches with a usable item gets at least one question, so the site shows it.
   - Every question after a fact's first is modeled on its own unused source item and must make a student reason differently from the others on that fact: a different scenario or symptom, or a different direction (definition to use, cause to fix, choose or rule out). Two questions never share a stem frame or a set of choices.
3. **Mr. Flauto's materials never add weight.** A fact that only his materials stress, with no exam evidence, is cut or kept at one question. His items are used only to cover an exam-weighted fact that no pool or practice exam item covers (`"origin": { "kind": "teacher" }`).
4. **Count facts, not items, across the whole exam.** Items that test the same fact in the same scenario become one question ("same as Qn"); an item that tests it in a different scenario may take one of the fact's extra slots (item 2). A fact that another unit's pack already asks gets no new slot unless the scenario makes a student reason differently: list it under `cut` with that question's id. (Students build one test from several units, so a repeat shows up as the same question twice.)
5. **Flashcards are not weighted.** The cards are the `card` rows of `SP\card-terms.tsv` (the guide's "Which terms get a card"). A bullet's tier never adds a card, and a term with no row gets none.

Write the result to `SP\plan-counts.json`:

```json
{
  "tiers": [ { "bullet": "3.4.c", "topic": "RAID 0, 1, 5, 6, 10", "tier": 1, "scoreA": 10, "scoreB": 9, "why": "..." } ],
  "lessons": { "3.1": 22, "3.2": 24 },
  "slots": [ { "slot": "q01", "lesson": "3.1", "bullet": "3.6.a", "fact": "...", "source": "CertMaster 3.0 Q4", "section": "3.1.1" } ],
  "sameAs": [ "CertMaster 3.0 Q7 same as Messer C16" ],
  "cut": [ { "source": "CertMaster 3.0 Q60", "why": "tier 3, not keyed by any exam evidence" } ],
  "thin": [ "bullets with one usable item or none" ],
  "totalQuestions": 62
}
```

`slots` becomes `SP\spec.json` for `assemble.ps1` (lessons in book order, slots in order within each lesson).
