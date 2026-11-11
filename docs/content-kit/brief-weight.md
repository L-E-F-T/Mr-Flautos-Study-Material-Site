# Brief: weighting <<EXAM>> Unit <<UNIT>> by the exam

The content chat fills in every `<<...>>` and gives this to two agents, one per lens, then reconciles their rankings itself (the last section). Read `brief-read.md` first for the files and the unit outline.

Mr. Flauto's goal: **each unit's questions are weighted toward what actually appears on the exam.** The site mirrors the CompTIA objectives and the evidence of what the exam asks. His own materials are based on the CertMaster platform and support that picture. They never set it.

`SP` = `<<SCRATCHPAD>>`

## What is ranked

Every objective bullet that this unit's reading teaches: <<LIST OF BULLETS, each with its objective's verb ("Given a scenario", "Compare and contrast", "Summarize", "Explain")>>. Rank bullets, and within a bullet name the distinct facts that matter (for 3.4.c: "RAID 1 survives one disk failure", "RAID 0 has no redundancy", "RAID 5 usable capacity").

The mapping is done: `SP\<<PLAN FILE>>` has one line per source item with its section, key, bullet, fact, and status.

## Lens A: exam evidence (this lens decides)

For each bullet, count and cite:

1. **Messer keyed items.** Items in `SP\messer\messer-<<EXAM CODE>>.tsv` tagged with this bullet's objective whose answer turns on this bullet. Note which are performance-based (A1 to A5, B1 to B5, C1 to C5): a PBQ shows what the exam asks students to do.
2. **Domain 5 links.** Messer items tagged 5.x (troubleshooting) that need this bullet's facts to answer: a RAID level's failure behavior, a power supply's rails, a memory symptom. Troubleshooting is the heaviest domain, so a fact it leans on is high yield even when its own objective is light.
3. **Distractor appearances.** Items where a term from this bullet is a wrong choice. Weak evidence: it shows the exam expects students to tell the terms apart.
4. **The verb.** "Given a scenario" objectives are asked as install, choose, or diagnose scenarios and are the likeliest PBQs. "Compare and contrast" is asked as "pick the technology that meets this requirement". "Summarize" and "Explain" are recognition and short scenarios.
5. **Domain weight** from `SP\examdetails.txt`.

Return for each bullet: a score from 1 to 10, a tier (1 = certain to be asked, several ways; 2 = likely; 3 = possible), the counts with item labels, and one sentence of rationale. Also estimate how many items a 90-question form holds for the bullet (its share of the 270 Messer items, times 90).

## Lens B: course coverage (this lens informs)

For each bullet: how much of the reading teaches it (sections and rough length), how many usable pool items test it, and how much Mr. Flauto stresses it in his materials (`SP\aids\`: study guide items, review-deck slides, Blooket questions, lesson-deck slides). Return a score from 1 to 10 and the counts.

## Reconcile (the chat does this, not an agent)

1. **The tier comes from lens A.** Where the two scores differ, write one line saying why lens A holds. Lens B can only break a tie, or show that a tier 2 or 3 fact is needed to understand a tier 1 item (then that fact gets a question).
2. **Counts.**
   - Tier 1: a question for every distinct fact that has a usable source item, plus a second question where a second item makes a student reason differently (a scenario versus a definition, a different symptom).
   - Tier 2: one question per distinct fact with a usable item.
   - Tier 3: only the facts the exam evidence actually keys. List the rest under "cut".
   - Every bullet the reading teaches with a usable item gets at least one question, so the site shows it.
3. **Mr. Flauto's materials never add weight.** A fact that only his materials stress, with no exam evidence, is cut or kept at one question. His items are used only to cover an exam-weighted fact that no pool or Messer item covers (`"origin": { "kind": "teacher" }`).
4. **Count facts, not items.** Items that test the same fact with the same answer become one question ("same as Qn").
5. **Flashcards are not weighted.** Every term named in a bullet that this unit's reading teaches gets one card, unless an earlier unit already has a card for it.

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
