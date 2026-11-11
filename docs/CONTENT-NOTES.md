# Content notes

Passed from one unit's content chat to the next. Each chat reads this before it maps its sources and updates it before it ends: it removes what it used (saying where it went) and adds what it found for later units. Source items keep their own names ("CertMaster 3.0 Q19" is still that name when Unit 2.0 uses it).

## Source items that another unit's reading answers

Found while mapping A+ Core 1 Unit 3.0. Each later unit maps these with its own items.

| Item | Section that answers it | For unit |
|---|---|---|
| CertMaster 3.0 Q19 | 2.2.6 | 2.0 |
| Messer B27 (front-panel USB ports connect through motherboard USB headers) | 2.2.10 | 2.0 |
| Messer C44 | 2.2.14 | 2.0 |
| Messer A87 | 4.1.6 | 4.0 |
| Messer A83 | 4.1.8 | 4.0 |
| CertMaster 3.0 Q2 | 4.2.1 | 4.0 |
| Messer A61 (a 12 V pin reading 6 V means the power supply is faulty) | 4.2.1 | 4.0 |
| CertMaster 3.0 Q89 | 4.2.3 | 4.0 |
| CertMaster 3.0 Q54 | 4.2.9 | 4.0 |
| CertMaster 3.0 Q90 | 4.3.2 | 4.0 |
| Messer C70 | 8.1.4 | 8.0 |
| CertMaster 3.0 Q16 and Q27 | 9.3.2 | 9.0 |

## Items no reading answers

Searched across every unit's sections during Unit 3.0 and left out. Do not map them again unless the reading changes.

- CertMaster 3.0 Q12 (the reading settles only one of its correct choices), Q15 (no section gives a tolerance for a 12 V rail), Q26 (which appliances need 220 V), Q33 (the operating system needs the RAID controller's driver), Q38 (converting basic disks to dynamic), Q66 and Q76 (pagefile versus swap space: no section defines either).
- Messer B31 (clearing an unknown BIOS password with the motherboard jumper): 4.1.6 defines the password but never says how to reset it.

## Known problems in the reading

Key nothing to these points.

- **Thermal paste:** 3.4.6 and 3.4.7 give two different ways to apply it.
- **3.3.8, last sentence:** it reverses the rest of the section on ECC (which kind of DDR5 RAM does what). CertMaster 3.0 Q75 was skipped because it depends on that sentence.

## Disagreements between a source and the reading

- **Messer A49:** option C's text and the explanation under it do not match (the explanation is headed "C. SDRAM"). Messer's key, A, stands, and c1-u03-q050 was written around it.
- **CertMaster 3.0 Q38:** the author's intended key (convert basic disks to dynamic) is taught in no section.

## Gaps

Exam-weighted facts in Unit 3.0 with no usable source item, so they are on flashcards but have no question of their own:

- Hard drive form factors (2.5-inch and 3.5-inch) and spindle speeds beyond the 15,000 RPM server drive.
- AMD's PGA sockets (only the LGA-versus-PGA bent-pins question, c1-u03-q060, touches them).

## For later units

- **Unit 4.0:** Mr. Flauto's Study Guide 3.0 Q49 and Q50 (used for c1-u03-q035 and c1-u03-q034: a failed RAID 1 disk should be replaced right away; a failed RAID 0 disk means restoring from backup) are his versions of Messer A22 and B55, which are troubleshooting items (objective 5.2). Use A22 and B55 in Unit 4.0 only for what is new in them (the troubleshooting steps and their order), not to test the same RAID facts again.
- **Mr. Flauto's materials for A+ Core 1:** unit study guides with keys for Units 2.0 to 7.0 (`CompTIAA+\Core 1\Study Guides\`), review decks for Units 2.0-3.0, 5.0-6.0, 6.0, and 7.0 (`Slides\`), lesson decks (`Slides\A+ <lesson> <title>.pptx`), and Blookets (`Activites\`). Units 8.0 to 10.0 have no study guide or review deck: their weighting rests on the exam evidence and the pool.

## Other exams

- **Security+:** `Certmaster Questions\4.0.txt` holds 23 Security+ items. It is not a copy of the A+ Core 1 Unit 4.0 pool, as earlier notes said. There is also a combined pool file, `1.0 + 2.0.txt`, whose items are named "CertMaster 1.0 + 2.0 Qn" by the numbering rule.
