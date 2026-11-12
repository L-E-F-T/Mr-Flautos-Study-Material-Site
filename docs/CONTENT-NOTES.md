# Content notes

Passed from one unit's content chat to the next. Each chat reads this before it maps its sources and updates it before it ends: it removes what it used (saying where it went) and adds what it found for later units. Source items keep their own names ("CertMaster 3.0 Q19" is still that name when Unit 2.0 uses it).

## Source items that another unit's reading answers

Found while mapping A+ Core 1 Units 3.0, 2.0, 5.0, and 6.0. Each later unit maps these with its own items. Unit 2.0 used the three items passed to it: CertMaster 3.0 Q19 became c1-u02-q027, Messer B27 c1-u02-q030, and Messer C44 c1-u02-q036. Unit 5.0 used seven of the nine passed to it: Messer A55 became c1-u05-q033, A89 c1-u05-q029, B37 c1-u05-q022, C53 c1-u05-q023, C19 c1-u05-q024, C36 c1-u05-q030, and C60 c1-u05-q031. Messer B56 is the same fact as C36, and B67 (RJ45 on a patch cable) was dropped in review because other stems give it away; RJ45 is asked as c1-u05-q028. Unit 6.0 mapped all seventeen passed to it and used seven: Messer B89 became c1-u06-q001, A72 c1-u06-q003, C38 c1-u06-q010, A71 c1-u06-q011, B12 c1-u06-q015, A33 c1-u06-q020, and CertMaster 5.0 Q28 c1-u06-q022. It left CertMaster 5.0 Q2, Q8, Q10, Q29, and Q34 and Messer C43 unused (each the same fact as a question it kept) and Messer C33 (the same fact as c1-u05-q033); a settle check dropped CertMaster 5.0 Q35 (the reading supports only one of its "select all" answers). It passed Messer B80 and C50 on to Unit 7.0 (in the table).

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
| CertMaster 6.0 Q47, Q49 (FTP's ports 20 and 21 in active mode, for uploading files to websites); Q59 (a NAS shares files over SMB through Samba); Q61 (NetBT is obsolete and should be disabled) | 7.1.1 | 7.0 |
| CertMaster 6.0 Q58 (SMTP: port 25 relays mail between servers, 587 is for clients submitting mail) | 7.1.5 | 7.0 |
| CertMaster 6.0 Q36 (IMAP keeps mail on the server for several clients); Q62 (IMAPS on 993, POP3S on 995) | 7.1.6 | 7.0 |
| Messer C64 (syslog collects event logs in one place) | 7.1.11 | 7.0 |
| Messer B9 (spam gateway) | 7.2.3 | 7.0 |
| Messer C31 (load balancer) | 7.2.4 | 7.0 |
| Messer A10 (port flapping, faulty crimp), C81 (dark link lights) | 7.3.1 | 7.0 |
| CertMaster 5.0 Q43 (crosstalk); Messer C40 (duplex mismatch) | 7.3.2 | 7.0 |
| Messer A59 (intermittent wireless: check signal strength), A63 (slow Wi-Fi: interference), B72 (new AP: check channel interference) | 7.3.4 | 7.0 |
| Messer C72 (VoIP jitter); Messer B80 (ping round trips of 600 to 800 ms show high latency; 6.1.7 also answers it) | 7.3.5 | 7.0 |
| Messer B52 (limited connectivity: check the IP configuration); Messer C50 (tests to the gateway and an outside address work but names fail: the DNS server); CertMaster 6.0 Q71, Q80 (a DHCP server with no addresses left leaves clients without a lease) | 7.3.6 | 7.0 |
| Messer A16 (beep codes; the reading disagrees in part, see below) | 4.2.3 | 4.0 |
| Messer A27, C84 | 4.2.9 | 4.0 |
| Messer A14, B47 | 4.2.11 | 4.0 |
| Messer B78, C55 | 4.2.12 | 4.0 |
| Messer C34 | 4.3.1 | 4.0 |
| Messer B14 | 4.3.2 | 4.0 |
| Messer B43 | 4.3.4 | 4.0 |
| CertMaster 6.0 Q6 (5G up to 10 Gbps); Messer C21 (5G for equipment miles from any wired network, tagged 1.3) | 9.1.7 | 9.0 |
| Messer C77 (smartwatch needs Bluetooth on) | 9.1.9 | 9.0 |
| Messer A82 | 9.4.4 | 9.0 |
| Messer A73 | 9.4.6 | 9.0 |
| Messer B75 | 10.3.1 | 10.0 |
| Messer A46 | 10.3.2 | 10.0 |
| Messer B57, C51, C57 (the reading disagrees with C51 and C57, see below) | 10.3.3 | 10.0 |
| Messer B34 | 10.3.4 | 10.0 |
| Messer A62, A65 | 10.3.5 | 10.0 |
| Messer C49 (management port is DB9 serial: same fact as c1-u02-q040), B81 (IOPS), C24 (drive activity light) | 2.3.3, 3.2.2, 2.2.10 | already written, nothing to do |
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

Messer items tagged 5.x that Unit 2.0 screened and its reading does not answer (each unit maps its own 5.x items; these sections are a first guess): Unit 4.0: A7, A11, C14 (4.2.5), A60 (4.2.9), A70, B44, B71, B83 (4.2.1), C8 (4.2.8), A18, A57, A76, B38, B68, B70, C25, C88 (4.3.7), A53 (4.3.6), A56 (4.3.5), B23, C13, C78 (4.3.2), C85 (4.3.3). Unit 9.0: A12, B7, B32, C30, C83 (9.4.1), A38, B69 (9.4.4), B10 (9.4.5). Unit 10.0: C12, C73 (10.3.5). Unit 5.0 then screened the 5.x items no earlier unit had placed, and re-checked the 5.5 items, and put its results in the table above: A33, B80, and C50 went to Unit 6.0, which used A33 (c1-u06-q020) and passed B80 and C50 on to Unit 7.0, and A73 to 9.4.6.

Unit 5.0 left these usable items of its own unused on purpose (same fact as a question it kept, or no exam evidence; see its report). Do not map them again: CertMaster 5.0 Q4, Q5, Q6, Q7, Q9, Q13, Q15, Q17, Q18, Q19, Q20, Q22, Q24, Q25, Q27, Q31, Q32, Q33, Q36, Q37, Q38, Q39, Q40, Q47, Q50, Q55, Q57, Q59, Q60, Q62, Q63, Q65, Q67, Q68, Q69, Q70, Q71, Q72, Q73, Q74, Q76, Q77, Q79; Messer A39, B41, B54, B56, B67, B86, C35.

Unit 6.0 left these usable items unused on purpose (same fact as a question it kept, no exam evidence, or a second question that independent reviews found gave another's answer away; see its report). Do not map them again: CertMaster 6.0 Q1, Q2, Q3, Q4, Q7, Q8, Q11, Q12, Q17, Q18, Q19, Q20, Q21, Q22, Q25, Q26, Q27, Q28, Q29, Q31, Q33, Q35, Q38, Q39, Q45, Q46, Q50, Q51, Q53, Q57, Q63, Q64, Q66, Q67, Q70, Q72, Q73, Q74, Q76, Q77, Q78, Q79, Q85, Q86; CertMaster 5.0 Q2, Q8, Q10, Q29, Q34, Q35; Messer A85, B60, B73, C33, C37, C43, C54, C79.

## Items no reading answers

Searched across every unit's sections during Unit 3.0 and left out. Do not map them again unless the reading changes.

- CertMaster 3.0 Q12 (the reading settles only one of its correct choices), Q15 (no section gives a tolerance for a 12 V rail), Q26 (which appliances need 220 V), Q33 (the operating system needs the RAID controller's driver), Q38 (converting basic disks to dynamic), Q66 and Q76 (pagefile versus swap space: no section defines either).
- Messer B31 (clearing an unknown BIOS password with the motherboard jumper): 4.1.6 defines the password but never says how to reset it.
- CertMaster 2.0 Q38 and Q41 (TPM versus HSM: 4.1.8 never says which one speeds up cryptography or creates keys), Q46 (3.4.5 never ties a CPU feature to "minor internal changes").
- Skipped, no Core 1 objective: CertMaster 2.0 Q26 (what mass storage is for, 2.2.1). Section 2.2.2 (ESD and electrical safety) is a Core 2 objective, so Unit 2.0 has no question on it.
- Found during Unit 5.0: CertMaster 5.0 Q11 (cellular router or mobile hotspot for a temporary office), Q26 (a patch panel protects switch ports from wear), Q48 (a loopback plug for a parallel port); Messer C17 (802.1Q trunk: no section mentions 802.1Q or trunks; 6.4.6 only says VLANs are a managed switch feature), C26 (Task Manager is not in the Core 1 reading), B82 (login scripts that map network drives), A69 (a weak cellular signal drains the battery).
- Found during Unit 6.0: CertMaster 6.0 Q15 (a cable modem's blinking connection light), Q42 (a firewall blocking part of the TCP handshake), Q44 (HTTP running on a port other than 80; Mr. Flauto's Study Guide 6.0 Q45 is the same item), Q55 (SIP on UDP port 5060), Q75 (an NXDOMAIN reply), Q82 (a short DHCP lease that keeps dropping a client).

## Known problems in the reading

Key nothing to these points.

- **Thermal paste:** 3.4.6 and 3.4.7 give two different ways to apply it.
- **3.3.8, last sentence:** it reverses the rest of the section on ECC (which kind of DDR5 RAM does what). CertMaster 3.0 Q75 was skipped because it depends on that sentence.
- **2.3.4, adapters:** it lists HDMI to DVI among video adapters that "convert between signaling types," and says passive adapters work only when both ends use the same signaling. HDMI and DVI-D carry the same digital signal, so a passive adapter works. Key nothing to whether an HDMI or DVI adapter is active or passive. Messer C41 (a DVI-D video card to an HDMI projector) is held until this is settled. Quotes for c1-u02-q042 and c1-u02-q043 should come from the "like digital HDMI to analog VGA" sentence, not the line that lists HDMI to DVI.
- **3.1.11 and 3.1.12, heat sinks:** 3.1.11 describes passive and active heat sinks (active ones typically use a fan), while 3.1.12 says a heat sink is a passive cooling device that needs no electricity. No key depends on it so far.
- **5.4.10, signal strength:** "anything over -80 dBm is likely to suffer packet loss or be dropped" is backwards by the section's own rule that values closer to zero are better (it means weaker than -80 dBm). Unit 5.0 keyed nothing to the -80 dBm figure; c1-u05-q052 rests on "closer to zero is better" and "-65 dBm is a good signal".
- **NFC range, 5.4.12 and 9.1.10:** 5.4.12 says NFC "normally works at up to two inches (6 cm)"; 9.1.10 says 10 cm (about 4 inches), up to 20 cm (9 inches) for some devices. Both conversions are off (two inches is about 5 cm; 20 cm is about 8 inches). Unit 5.0 keyed nothing to an NFC distance; Unit 9.0 should do the same.
- **5.3.7, crimper:** "A crimper is used to fix a jack to a patch cord", then the same paragraph calls the part an RJ45 plug. Unit 5.0's questions say plug or connector.
- **6.2.15, IPv6 subnets:** "A /48 block allows the private network to be configured with up to 65,336 subnets." Sixteen bits of subnet ID give 65,536. Unit 6.0 keyed nothing to the number of subnets.
- **6.3.2, NACK:** it lists a TCP "negative acknowledgment (NACK) to force retransmission of a missing or damaged packet." TCP has no NACK. Unit 6.0 keyed nothing to it; the fact that TCP recovers lost packets stands on 6.2.4.
- **6.2.12 and 6.4.3, figure descriptions:** the DHCP pool in 6.2.12's figure runs from 192.168.0.100 to 192.168.1.199 (not one /24), and step 5 of 6.4.3's figure says the authoritative server "returns the name server" where it means the host's address. Key nothing to either figure.
- **6.2.14, spotting a public address:** the rule (not from a private range, does not start with zero, below 224) leaves out 127.x.y.z and 169.254.x.y, so both would pass as public. No Unit 6.0 question uses either as a choice in a public-or-private question; c1-u06-q022 uses only private, 224-and-above, and ordinary public addresses.
- **3G speeds, 6.1.8 and 9.1.7:** 6.1.8 gives about 3 Mbps (UMTS, EV-DO) and up to 42 Mbps (HSPA+); 9.1.7 gives about 7.2 Mbps. Key nothing to a 3G speed. 6.1.8 gives no 5G speed (9.1.7: up to 10 Gbps).

## Disagreements between a source and the reading

- **Messer A49:** option C's text and the explanation under it do not match (the explanation is headed "C. SDRAM"). Messer's key, A, stands, and c1-u03-q050 was written around it.
- **CertMaster 3.0 Q38:** the author's intended key (convert basic disks to dynamic) is taught in no section.
- **Messer A89 (for Unit 5.0):** option C prints as "BNC" in the question, but the answer section explains "C. Molex".
- **Mr. Flauto's Unit 2.0 Blookets:** Harder Q105 calls a DVI-D to HDMI adapter passive, which is right in practice but against 2.3.4 as written. Harder Q85, Q98, and Q102 (DisplayPort or DVI-D to VGA needs an active adapter) go past the reading's one example (HDMI to VGA). Harder Q89 (VGA pins in three rows), Q104 (DB9 pins in two rows), and Harder Q76 (an ATX board will not fit a microATX case) are not in the reading's text. No question was keyed to any of these.
- **Messer A78:** keys "Bandwidth" for a 40 MHz access point setting; the reading calls it the channel width. c1-u05-q046 asks what widening the channel does instead.
- **Messer B36:** its explanation gives NFC a range of about 4 cm (see the NFC range problem above). The key, NFC, stands; c1-u05-q056 names no distance.
- **Messer B89 (for Unit 6.0):** says DSL uses a single pair of copper wires; 6.1.2 and 5.3.5 say two-pair cable. Key nothing to the number of pairs.
- **Messer A33 (for Unit 6.0):** gives the APIPA range as 169.254.1.0 to 169.254.254.255; 6.2.12 says 169.254.0.1 to 169.254.255.254. Key nothing to the exact range.
- **Messer A16 (for Unit 4.0):** its beep codes disagree in part with the table in 4.2.3. **Messer C51 and C57 (for Unit 10.0):** 10.3.3 gives other causes for speckled output (loose toner) and blank pages (an application or driver issue, or packing seals left on the toner cartridge).
- **CertMaster 5.0 pool:** Q27's key choice is an RJ11 patch cord "over 300m long" (no reading gives a DSL cable length); Q30 says all motherboards have a built-in 1000BASE-T adapter (5.2.1 says the majority); Q64 gives 802.11ac 2.6 Gbps (not in 5.4.7); Q71 says gain measures a wireless signal's power (5.4.11 makes gain one of three parts of it). Questions built on Q30 and Q64 leave those claims out; Q27 and Q71 were not used.
- **Mr. Flauto's Unit 5.0 materials** go past or against the reading in places (none was keyed): a loopback plug on a router port or for rising error counts (Study Guide 5.0 Q48 and Part 3; Review 5.0-6.0 slides 63, 87, 101; the reading says NIC or switch port); a ground wire marking direct burial cable (Part 3); "-30 dBm is not typical" (Part 3, Q74); crosstalk "at the near end" (Part 4 Set 5 H, Q35); the punchdown tool trimming the wire in a 110 block (Part 3, Set 8 N); 802.11ac at 2.6 Gbps (Q66); "gain measures a signal's power" (Q79); bonded ports "are not a backup" (Part 3); a switch replacing a hub (Q26, Review slide 36; the reading never mentions hubs); "wiring map" (Set 8 D, Q42); toning cables that are not terminated (Q45); RJ as "Registered Jack" (Part 2, lesson deck 5.2.6-5.3.5 slide 36); an LC connector meaning a link between buildings (Q57); OFDMA splitting a channel (Memorization Blooket Q104; splitting is Wi-Fi 7's MRUs); a LAN "within a mile or two" (Part 3; the reading says 1 or 2 km). Labels: Memorization Tables slides 7 and 8 tag cables and connectors OBJ 3.1 (they are 3.2), and lesson decks 5.1-5.2.5 slide 27 and 5.3.7-5.4.12 slide 5 tag the patch panel "OBJ 2.4" from Network+ CertMaster and spell "Structed Cable".
- **CertMaster 6.0 pool:** Q40 names TCP the "Transport Layer Protocol" (6.2.4 and 6.3.2: Transmission Control Protocol), and Mr. Flauto's Study Guide 6.0 Q48 copies it; c1-u06-q026 names it correctly. Q56 spells IMAP "Internet Message Access Protocol" (7.1.6's name); 6.3.6 and the objectives say Internet Mail Access Protocol, as c1-u06-q036 and the IMAP card do. CertMaster 5.0 Q35 is "select all", but the reading supports only the router (dropped). Messer C45's explanation misprints the APIPA range as starting at 169.245.
- **Mr. Flauto's Unit 6.0 materials:** all 87 Part 5 keys in the Study Guide 6.0 KEY (bold in the PDF) agree with the reading, except Q45, which matches CertMaster 6.0 Q44 and no section settles. They go past or against the reading in these places (none was keyed): DSL "over one pair of copper phone wires" (Blooket 6.0 Harder Q1; the known pair-count problem); cable carrying "voice" (Harder Q6; 6.1.3 says only cable TV over coax); a client that loses its address every hour needs a longer lease (Harder Q110; no section says so); an APIPA mask of 255.255.0.0 (Memorization Tables 5.0-6.0 slide 6; no section gives one) and the exact APIPA range (Study Guide Q39 and Part 4 Set 4 I, the 6.2.10-6.2.15 lesson deck slide 16, Memorization Tables slide 6; known problem); the 6.2.14 public-address rule without the 169.254 exception (lesson deck 6.2.10-6.2.15 slide 19, Study Guide Parts 1, 3, and Part 4 Set 4 A, Memorization Blooket Q168; Review 6.0 slide 63 and Review 5.0-6.0 slide 208 add "or 169.254"); "TCP retransmits a missing or damaged packet" (Study Guide Part 4 Set 5, Review 6.0 slide 94, Review 5.0-6.0 slide 253, lesson deck 6.3 slides 6 and 12), worded from the NACK line, though the fact holds by 6.2.4; OSI layers on the 6.2.1-6.2.9 lesson deck slides 8 and 32 (the reading teaches only the four TCP/IP layers, and OSI is not a Core 1 objective); a DHCP scope with no addresses left cited to 6.4.1 (Review 6.0 slide 124, Review 5.0-6.0 slide 334; 7.3.6 states it); IMAP "keeps mail on the server" cited to 6.3.6 (Review 5.0-6.0 slide 278, Memorization Tables slide 3; that is 7.1.6); the DHCP configuration slide labeled 6.2.11 (lesson deck 6.2.10-6.2.15 slide 14; it is 6.2.12); FTTP "the faster one" with "the highest speeds and reliability" (Study Guide Parts 1 and 3; 6.1.5 never ranks them); and satellite "highest latency" without saying geostationary (Study Guide Part 4 Set 1 C, Review 6.0 slide 50, Review 5.0-6.0 slide 192, Memorization Blooket Q144; LEO has 25 to 60 ms).

## Gaps

Exam-weighted facts in Unit 3.0 with no usable source item, so they are on flashcards but have no question of their own:

- Hard drive form factors (2.5-inch and 3.5-inch) and spindle speeds beyond the 15,000 RPM server drive.
- AMD's PGA sockets (only the LGA-versus-PGA bent-pins question, c1-u03-q060, touches them).

Exam-weighted facts in Unit 2.0 with no usable pool or Messer item. Mr. Flauto's own items cover five of them (origin "teacher"): USB-C (c1-u02-q003), TN panels (q007), screen resolution (q011), refresh rate (q012), and add-on NICs (q037). On flashcards only: MicroUSB and MiniUSB, pixel density, DisplayPort Multi-Stream Transport, OLED burn-in, and sound cards.

Exam-weighted facts in Unit 5.0 with no usable pool or Messer item. Mr. Flauto's review deck covers six of them (origin "teacher"): Cat 6A for 10 Gbps at 100 m (c1-u05-q019), T568B (q021), the ST connector (q032), moving off a crowded 2.4 GHz band (q045), the non-overlapping channels 1, 6, and 11 (q047), and the 6 GHz band in Wi-Fi 6E and Wi-Fi 7 (q049). On flashcards only: LAN and WLAN (no item keys them), 802.3af and 802.3bt (distractors in q017), Cat 5, 5e, 7, and 8, the MAC address format, RFID passive and active tags, and the details of each 802.11 standard (exam evidence puts 802.11 standards in tier 3, so two questions ask about them: q048 and q049).

Exam-weighted facts in Unit 6.0 with no usable pool or Messer item. Mr. Flauto's own items cover six of them (origin "teacher"), each one the exam evidence asks (a ports PBQ, PBQ C1, or a Messer wrong choice): the ONT (c1-u06-q004), cellular (q009), Telnet on port 23 (q029), POP3 on port 110 (q034), LDAP on port 389 (q037), and the AAAA record (q047). On flashcards only, because no exam evidence keys them: NetBIOS/NetBT on 137 to 139, DHCP scope and exclusions, DKIM, and DMARC. TCP vs. UDP has no Messer item at all; it has two questions (q025, q026) because the ports PBQs label every port TCP or UDP.

## For later units

- **Cards a later unit should tag:** c1-u03-f039 (Virtualization support) is also taught in 8.1.4. Its `units` were trimmed to Unit 3.0's own sections so lesson 8.1 still says "Coming soon". When Unit 8.0 is written, add 8.1.4 back to that card's `units` (and any other section of yours that teaches a term an earlier unit already carded). Unit 2.0 did this for eight Unit 3.0 cards: f001 DIMM and f006 DDR5 (2.2.3), f007 RAM (2.2.1, 2.2.3), f021 SATA (2.1.13, 2.2.4), f022 PCIe (2.2.5), f024 M.2 (2.2.4), f035 Power connectors (2.2.10), f040 CPU (2.2.1). Unit 6.0 did this for seven Unit 5.0 cards: f007 MAC address (6.1.9, 6.2.2), f009 switch (6.1.9), f010 unmanaged switch and f011 managed switch (6.4.6), f029 RJ11 (6.1.2), f046 coaxial cable and f047 F-type (6.1.3).
- **Unit 9.0:** Messer A13 (a dim laptop screen, so the inverter) and A19 (a stylus that stops working, so the digitizer) are troubleshooting items for 9.4.4. Unit 2.0 used their twins, Messer C15 and B11, as questions on what each part does, keyed from 2.1.9 (c1-u02-q009 inverter, c1-u02-q008 digitizer). Unit 9.0 should ask the troubleshooting step, not the part's job.
- **Unit 5.0 cards later units may teach again.** Unit 5.0 added 5.2.1 to c1-u02-f033 (NIC). When a later unit's reading teaches one of these terms, add its section to the Unit 5.0 card's `units` and change nothing else: c1-u05-f064 Bluetooth and f005 PAN (9.1.9), f066 NFC (9.1.10), f063 Wi-Fi analyzer (7.3.4), f034 cable tester and f036 loopback plug (7.3.1), f006 SAN (8.1.4). Check each against the later section first. Unit 6.0 checked f040 optical cable (6.1.5), f048 access point and f001 LAN (6.1.9), f002 WAN (6.1.1, 6.1.9), f026 RJ45 (6.1.2, 6.1.3, 6.1.5), and c1-u02-f033 NIC (6.1.1): those sections only name the terms, so none was added.
- **Unit 6.0 cards later units may teach again.** Unit 7.0's 7.1.x sections explain the protocols behind Unit 6.0's port cards. Where a 7.1.x section teaches the protocol, add it to the card's `units` and change nothing else: c1-u06-f022 FTP, f023 SSH, f024 Telnet, f025 SMTP, f026 HTTP, f027 POP3, f028 NetBIOS/NetBT, f029 IMAP, f030 LDAP, f031 HTTPS, f032 SMB/CIFS, f033 RDP, f039 DNS, and f034 DHCP (7.3.6 also covers DHCP and APIPA: f018). For Unit 9.0, f008 Cellular may fit 9.1.7. Check each against the later section first.
- **Unit 7.0:** Messer A59, A63, B72, and C81 went to 7.3 because they test the troubleshooting step. Unit 5.0 already asks the facts they lean on: the Wi-Fi analyzer for slow Wi-Fi after neighbors add access points (c1-u05-q051), leaving a 2.4 GHz band crowded by a microwave for 5 GHz (q045), the non-overlapping channels (q047), the loopback plug after a cable swap (q041), and the cable tester for damaged in-wall wiring (q038). Ask the step or the diagnosis, not the tool or the band again.
- **Unit 7.0, from Unit 6.0:** Unit 6.0 asks every 2.1 port except NetBIOS (c1-u06-q027 to q040) and TCP vs. UDP (q025, q026), so Unit 7.0's 2.1 questions should ask what a server or protocol does beyond the 6.3.6 table (secure ports, relay vs. submission, mail kept on the server), not the port numbers again. Unit 6.0 asks APIPA as "a 169.254 address means the host could not reach the DHCP server" (q020), DNS as "reaches a resource by IP address but not by name" (q045), and satellite latency as a VoIP symptom (q006). Ask Messer C50 as the split between the gateway test and name resolution, Messer B80 as reading the ping output, and CertMaster 6.0 Q71 and Q80 for why the DHCP server stopped handing out addresses.
- **Unit 9.0, from Unit 6.0:** Unit 6.0 asks cellular as the connection type for small IoT sensors (c1-u06-q009). Messer C21 (5G for equipment far from any wired network) and CertMaster 6.0 Q6 (5G up to 10 Gbps) belong to 9.1.7. Key no 3G speed (see the known problems).
- **Study guide keys:** pdftotext does not keep how the Part 5 answers are marked in Mr. Flauto's study guide KEY, so those keys cannot be compared from the text. In the Unit 6.0 KEY the answers are bold type, and Unit 6.0 read all 87 from the PDF's page images (the Read tool with `pages`, Part 5 pages only). Later units can do the same.
- **Unit 4.0:** Mr. Flauto's Study Guide 3.0 Q49 and Q50 (used for c1-u03-q035 and c1-u03-q034: a failed RAID 1 disk should be replaced right away; a failed RAID 0 disk means restoring from backup) are his versions of Messer A22 and B55, which are troubleshooting items (objective 5.2). Use A22 and B55 in Unit 4.0 only for what is new in them (the troubleshooting steps and their order), not to test the same RAID facts again.
- **Mr. Flauto's materials for A+ Core 1:** unit study guides with keys for Units 2.0 to 7.0 (`CompTIAA+\Core 1\Study Guides\`), review decks for Units 2.0-3.0, 5.0-6.0, 6.0, and 7.0 (`Slides\`), lesson decks (`Slides\A+ <lesson> <title>.pptx`), and Blookets (`Blookets\`; Unit 3.0's in `Activites\`). Units 8.0 to 10.0 have no study guide or review deck: their weighting rests on the exam evidence and the pool.

## Other exams

- **Security+:** `Certmaster Questions\4.0.txt` holds 23 Security+ items. It is not a copy of the A+ Core 1 Unit 4.0 pool, as earlier notes said. There is also a combined pool file, `1.0 + 2.0.txt`, whose items are named "CertMaster 1.0 + 2.0 Qn" by the numbering rule.
