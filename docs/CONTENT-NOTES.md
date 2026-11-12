# Content notes

Passed from one unit's content chat to the next. Each chat reads this before it maps its sources and updates it before it ends: it removes what it used (saying where it went) and adds what it found for later units. Source items keep their own names ("CertMaster 3.0 Q19" is still that name when Unit 2.0 uses it).

## Source items that another unit's reading answers

Found while mapping A+ Core 1 Units 3.0 and 2.0. Each later unit maps these with its own items. Unit 2.0 used the three items passed to it: CertMaster 3.0 Q19 became c1-u02-q027, Messer B27 c1-u02-q030, and Messer C44 c1-u02-q036.

| Item | Section that answers it | For unit |
|---|---|---|
| CertMaster 2.0 Q10 | 1.2.7 | 1.0 (no pack: the methodology has no objective) |
| CertMaster 2.0 Q29, Messer B90 | 3.1.11 | 3.0, already written (same fact as c1-u03-q021) |
| CertMaster 2.0 Q34 | 3.1.4 | 3.0, already written (same fact as c1-u03-q019) |
| CertMaster 2.0 Q33 | 3.4.4 | 3.0, already written |
| CertMaster 2.0 Q35 | 3.1.11 | 3.0, already written |
| CertMaster 2.0 Q42 | 3.1.12 | 3.0, already written |
| CertMaster 2.0 Q32 and Q36 | 4.1.6 | 4.0 |
| CertMaster 2.0 Q40 | 4.1.8 | 4.0 |
| CertMaster 2.0 Q43 and Q44 | 4.1.4 | 4.0 |
| CertMaster 2.0 Q50 | 4.3.6 | 4.0 |
| Messer A55 (F-type; 6.1.3 says it most directly) | 5.3.13 | 5.0 |
| Messer A89, B67 | 5.3.5 | 5.0 |
| Messer B37, C53 | 5.3.10 | 5.0 |
| Messer B56, C19, C36, C60 | 5.3.11 | 5.0 |
| Messer A13 (dim laptop screen, inverter) and A19 (stylus, digitizer) | 9.4.4 | 9.0 |
| Messer A21 (USB to Ethernet adapter or docking station, choose two) | 9.1.3 | 9.0 |
| Messer A87 | 4.1.6 | 4.0 |
| Messer A83 | 4.1.8 | 4.0 |
| CertMaster 3.0 Q2 | 4.2.1 | 4.0 |
| Messer A61 (a 12 V pin reading 6 V means the power supply is faulty) | 4.2.1 | 4.0 |
| CertMaster 3.0 Q89 | 4.2.3 | 4.0 |
| CertMaster 3.0 Q54 | 4.2.9 | 4.0 |
| CertMaster 3.0 Q90 | 4.3.2 | 4.0 |
| Messer C70 | 8.1.4 | 8.0 |
| CertMaster 3.0 Q16 and Q27 | 9.3.2 | 9.0 |

Messer items tagged 5.x that Unit 2.0 screened and its reading does not answer (each unit maps its own 5.x items; these sections are a first guess): Unit 4.0: A7, A11, C14 (4.2.5), A60 (4.2.9), A70, B44, B71, B83 (4.2.1), C8 (4.2.8), A18, A57, A76, B38, B68, B70, C25, C88 (4.3.7), A53 (4.3.6), A56 (4.3.5), B23, C13, C78 (4.3.2), C85 (4.3.3). Unit 7.0: A10, C81 (7.3.1), A33, C50 (7.3.6), B80 (7.3.2), C72 (7.3.5). Unit 9.0: A12, B7, B32, C30, C83 (9.4.1), A38, B69 (9.4.4), B10 (9.4.5). Unit 10.0: C12, C73 (10.3.5). Not placed: A73.

## Items no reading answers

Searched across every unit's sections during Unit 3.0 and left out. Do not map them again unless the reading changes.

- CertMaster 3.0 Q12 (the reading settles only one of its correct choices), Q15 (no section gives a tolerance for a 12 V rail), Q26 (which appliances need 220 V), Q33 (the operating system needs the RAID controller's driver), Q38 (converting basic disks to dynamic), Q66 and Q76 (pagefile versus swap space: no section defines either).
- Messer B31 (clearing an unknown BIOS password with the motherboard jumper): 4.1.6 defines the password but never says how to reset it.
- CertMaster 2.0 Q38 and Q41 (TPM versus HSM: 4.1.8 never says which one speeds up cryptography or creates keys), Q46 (3.4.5 never ties a CPU feature to "minor internal changes").
- Skipped, no Core 1 objective: CertMaster 2.0 Q26 (what mass storage is for, 2.2.1). Section 2.2.2 (ESD and electrical safety) is a Core 2 objective, so Unit 2.0 has no question on it.

## Known problems in the reading

Key nothing to these points.

- **Thermal paste:** 3.4.6 and 3.4.7 give two different ways to apply it.
- **3.3.8, last sentence:** it reverses the rest of the section on ECC (which kind of DDR5 RAM does what). CertMaster 3.0 Q75 was skipped because it depends on that sentence.
- **2.3.4, adapters:** it lists HDMI to DVI among video adapters that "convert between signaling types," and says passive adapters work only when both ends use the same signaling. HDMI and DVI-D carry the same digital signal, so a passive adapter works. Key nothing to whether an HDMI or DVI adapter is active or passive. Messer C41 (a DVI-D video card to an HDMI projector) is held until this is settled. Quotes for c1-u02-q042 and c1-u02-q043 should come from the "like digital HDMI to analog VGA" sentence, not the line that lists HDMI to DVI.
- **3.1.11 and 3.1.12, heat sinks:** 3.1.11 describes passive and active heat sinks (active ones typically use a fan), while 3.1.12 says a heat sink is a passive cooling device that needs no electricity. No key depends on it so far.

## Disagreements between a source and the reading

- **Messer A49:** option C's text and the explanation under it do not match (the explanation is headed "C. SDRAM"). Messer's key, A, stands, and c1-u03-q050 was written around it.
- **CertMaster 3.0 Q38:** the author's intended key (convert basic disks to dynamic) is taught in no section.
- **Messer A89 (for Unit 5.0):** option C prints as "BNC" in the question, but the answer section explains "C. Molex".
- **Mr. Flauto's Unit 2.0 Blookets:** Harder Q105 calls a DVI-D to HDMI adapter passive, which is right in practice but against 2.3.4 as written. Harder Q85, Q98, and Q102 (DisplayPort or DVI-D to VGA needs an active adapter) go past the reading's one example (HDMI to VGA). Harder Q89 (VGA pins in three rows), Q104 (DB9 pins in two rows), and Harder Q76 (an ATX board will not fit a microATX case) are not in the reading's text. No question was keyed to any of these.

## Gaps

Exam-weighted facts in Unit 3.0 with no usable source item, so they are on flashcards but have no question of their own:

- Hard drive form factors (2.5-inch and 3.5-inch) and spindle speeds beyond the 15,000 RPM server drive.
- AMD's PGA sockets (only the LGA-versus-PGA bent-pins question, c1-u03-q060, touches them).

Exam-weighted facts in Unit 2.0 with no usable pool or Messer item. Mr. Flauto's own items cover five of them (origin "teacher"): USB-C (c1-u02-q003), TN panels (q007), screen resolution (q011), refresh rate (q012), and add-on NICs (q037). On flashcards only: MicroUSB and MiniUSB, pixel density, DisplayPort Multi-Stream Transport, OLED burn-in, and sound cards.

## For later units

- **Cards a later unit should tag:** c1-u03-f039 (Virtualization support) is also taught in 8.1.4. Its `units` were trimmed to Unit 3.0's own sections so lesson 8.1 still says "Coming soon". When Unit 8.0 is written, add 8.1.4 back to that card's `units` (and any other section of yours that teaches a term an earlier unit already carded). Unit 2.0 did this for eight Unit 3.0 cards: f001 DIMM and f006 DDR5 (2.2.3), f007 RAM (2.2.1, 2.2.3), f021 SATA (2.1.13, 2.2.4), f022 PCIe (2.2.5), f024 M.2 (2.2.4), f035 Power connectors (2.2.10), f040 CPU (2.2.1).
- **Unit 9.0:** Messer A13 (a dim laptop screen, so the inverter) and A19 (a stylus that stops working, so the digitizer) are troubleshooting items for 9.4.4. Unit 2.0 used their twins, Messer C15 and B11, as questions on what each part does, keyed from 2.1.9 (c1-u02-q009 inverter, c1-u02-q008 digitizer). Unit 9.0 should ask the troubleshooting step, not the part's job.
- **Unit 5.0:** the Messer network cable and connector items in the table above (A55, A89, B37, B56, B67, C19, C36, C53, C60) are tagged 3.2, so they turn up in Unit 2.0's search; their reading is 5.3.
- **Study guide keys:** the multiple-choice answers in Part 5 of Mr. Flauto's study guide KEY are circled in the PDF, and pdftotext does not keep the circles, so those keys cannot be compared from the text.
- **Unit 4.0:** Mr. Flauto's Study Guide 3.0 Q49 and Q50 (used for c1-u03-q035 and c1-u03-q034: a failed RAID 1 disk should be replaced right away; a failed RAID 0 disk means restoring from backup) are his versions of Messer A22 and B55, which are troubleshooting items (objective 5.2). Use A22 and B55 in Unit 4.0 only for what is new in them (the troubleshooting steps and their order), not to test the same RAID facts again.
- **Mr. Flauto's materials for A+ Core 1:** unit study guides with keys for Units 2.0 to 7.0 (`CompTIAA+\Core 1\Study Guides\`), review decks for Units 2.0-3.0, 5.0-6.0, 6.0, and 7.0 (`Slides\`), lesson decks (`Slides\A+ <lesson> <title>.pptx`), and Blookets (`Blookets\`; Unit 3.0's in `Activites\`). Units 8.0 to 10.0 have no study guide or review deck: their weighting rests on the exam evidence and the pool.

## Other exams

- **Security+:** `Certmaster Questions\4.0.txt` holds 23 Security+ items. It is not a copy of the A+ Core 1 Unit 4.0 pool, as earlier notes said. There is also a combined pool file, `1.0 + 2.0.txt`, whose items are named "CertMaster 1.0 + 2.0 Qn" by the numbering rule.
