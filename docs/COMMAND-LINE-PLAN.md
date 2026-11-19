# Command line: build plan

A third study tool for Network+ only: a typed command drill. This is the plan a website chat builds from and the list of what the content chat writes.

**Status (2026-11-19): approved by Mr. Flauto ("Yes to all four", questions A to D in section 2). Nothing is built yet. Phase 0 is next.**

How it was made: two research and design rounds, then a planning round (four planners read the code, the rules, the sources, and the manuals; two critics attacked the result). Sections 1 to 11 are the merged plan. The appendices are the planners' own tables. **Where an appendix differs from sections 1 to 11, the sections win.**

## 1. What it is

One exam-style task about a command at a time, above a prompt for the system the task names (Windows, Linux, Router, Switch). The student types the command. A right command prints example output, then the reading. A wrong one costs a try and gets a short label. After two counted misses the tool shows the command and its output. A slip that is not a recall mistake costs nothing.

Words: the tool is **Command line**, one run is a **drill**, one item is a **command**.

## 2. Decisions

### Made by Mr. Flauto (2026-11-19)

1. **Typed drill** is the first version.
2. **Scope.** Launch set: every command line that a published Network+ practice question or command card already asks, each tied to that item. Extra set: other lines the reading teaches in a written unit that a CertMaster pool item or a practice exam item asks. The extra set is written later, only on his word, and students opt in. Never: a line no source item asks. A command he names joins the launch set. (He asked Claude to set the scope. This is that decision.)
3. **Extra set placeholder.** "Add a placeholder for a button that adds the extra set." The setup screen has a control for it that reads Coming soon, worked out from the data, until extra commands exist.
4. **Strictness.** Accept what the real system accepts and refuse what it refuses. Two counted tries.
5. **Output.** Folded, at most 12 lines of at most 25 characters. Each right command prints its own output.
6. **A wrong command prints no output.**
7. **Follow-up question.** "Maybe also consider asking them follow up question based on the command output." Planned in section 3 and priced in section 10.
8. **Output that changes.** One command may hold two or three versions of its output, and each version has its own right answer to the follow-up.

### Answered by him on 2026-11-19 ("Yes to all four")

| # | Question | His answer |
|---|---|---|
| A | Is the tool called Command line, one run a drill, one item a command? | Yes |
| B | May a command line that a published question or command card already asks be asked once more by typing, on that question's source item? (Rule sentences R1 to R3, Appendix E.) | Yes |
| C | Follow-up questions in the first version, using only published practice questions, with the final say after the phone trial? | Yes |
| D | Go ahead at the size in section 10, or take the cuts listed there? | Go ahead at the full size. The build runs one phase to a fresh session, without multi-agent rounds, and the first session measures what a session costs. |

The rule sentences themselves (Appendix E with the fixes in section 9) still get his read when a website chat writes them into the guide and the handoff in phase 1c.

### Defaults he can change with a word

- The four published questions in section 3 may also be shown under the output, with their own exhibit printed as that output. Each is then seen in Practice test and in Command line.
- The hidden tab, the home card row, and the new header are built early and stay invisible. The switch that shows the tool is its own small push after all the content is in.
- The trial is all of Unit 4.0 (nine commands), published with the tool off. Anyone who adds `?drafts=1` to the address can open it. Nothing links to it.
- A hidden trial pack may be rebuilt until the tool is switched on. Ids stay with their commands.
- Test data lives in `tools/test-data` in the repository (never on the site), served only on new test ports 8091 to 8095 through one optional setting in `tools/serve.ps1`.
- If a question that a command is the typed form of is deleted, the content check blocks publishing until the command is dropped too.
- A line a real system would run, but that the tool does not hold (`show ip ro`, `ifconfig -a`, `show vlan brief`), costs no try. It gets a plain label and stays in the field.
- Three sentences change in `CLAUDE.md`: a prompt (`C:\>`, a dollar sign, `Router#`) is the system's own text, not a symbol; a tool an exam does not have is not shown at all, and the extra set control reads Coming soon until it has commands; the Network+ home card has a third button and still no score.
- Each build session ends with a commit. Nothing is pushed without his word.
- `ipconfig /release`, `ipconfig /renew`, and `netstat -r` as a command of its own are not launch commands. Each joins when he names it. A line found only on a card's back is not a launch command.
- `arp -s` stays in the trial with both addresses printed in the task and no try charged for the addresses. It is dropped if the phones show it is a typing test.

### Things he will see

- Command line sits on a row of its own on the Network+ card. On wide screens that leaves the A+ Core 1 buttons 48 px lower than the Network+ card's first row (measured).
- A+ Core 1 pages keep today's header. Only pages with three tabs get the new one.
- On the Network+ Flashcards and Practice test pages the third tab appears a moment after the page loads. He sees it in the phone trial and then picks: leave it, a small fix, or one phone header for every exam.

## 3. What students get at launch

- Command line on the Network+ card and as a third tab on Network+ pages.
- About 25 commands from Units 4.0, 5.0, and 6.0 (Appendix A): 9, 7, and 9. By system: 19 Windows, 3 Linux, 3 router or switch.
- Two tries, example output, the reading, results, Retry missed, and a drill that survives a reload.
- A question about the output on three commands, if question C is yes: `ipconfig` with two output versions (questions n-u04-q054 and n-u04-q059), `show ip route` (n-u05-q013), and `tracert` (n-u05-q016). `route print` (n-u05-q070) only on his word, because its exhibit is a cut-down table.
- Extra commands, reading Coming soon.
- Units 3.0 and 8.0 listed inside the tool, reading Coming soon.

Not at launch: a follow-up on other commands, two-step answers such as `ipconfig /release` then `/renew`, output shown first, Resume drill on the home card, a list of recent drills, missed commands coming back inside the same drill.

Five of the ten questions first listed as follow-ups are left out, because their stems already say what the output shows (Appendix C).

## 4. The data shape

One shape, frozen in phase 0 as `schemas/command-pack.schema.json` with one example pack in `tools/test-data`.

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

- **Folder.** `data/network-plus/commands/` with `manifest.json` and one launch pack per unit (`unit-04.json`). The extra set is a pack of its own (`unit-04-extra.json`) marked `"set": "extra"` in its pack header. The loader stamps that mark on each command.
- **`typedFormOf`** is always a list: the published questions, or the one card, whose command line this command types. No question or card is the partner of two commands.
- **`origin`** is present exactly when no partner is a question (a card's command, a command he names, an extra command).
- **`system`**: windows, linux, router, or switch. The prompt text is set in code.
- **`accept`**: one to three answer groups. A group holds its lines, and may name the reading sections that teach them in `sections`, which only the kit reads. Lines are plain text the way the reading or the objectives print them. No patterns, no second spellings.
- **`versions`**: one to three. Each has an id (`n-u04-v001`, never reused), one output for each answer group in the same order, and at most one `followUp`. An output is `text` (which may be empty where the real command prints nothing) or `exhibitOf`, which prints the exhibit of the version's own follow-up question.
- **`followUp`** is `{ "question": "<id>" }`, a published question of the same exam. A follow-up written in place is refused by the content check until phase 3.
- **Ids.** A command is `n-u04-c001`. No id is shared with a question, a card, or a version of any exam.
- **No weight is stored.** The draw works it out from the partner question's source (the practice exam book's two full tests 3, the rest of the book 2, the pool 1).
- **The page ignores a field it does not know**, skips a version it cannot print, and hides a command with no printable version. The content check warns about an unknown field.
- **`data/exams.json`** gets one field on the Network+ exam, set only by a website chat: `"commandUnits": ["3.0", "4.0", "5.0", "6.0", "8.0"]`.

## 5. Code layout

| File | Job | Phase |
|---|---|---|
| `assets/js/lib/command-match.js` | The matcher. No page code. `matchLine()` returns accepted, miss, slip, ignored, or wrong-command (with the systems that command runs on). The words for each result live in one table here. | 1a |
| `tools/command-cases.json` | Test lines the content check runs in the browser and on GitHub. | 1a |
| `assets/js/lib/command-items.js` | Reads a command: partners, outputs of a version, the follow-up, the weight. Shared by the page and the content check. | 1a |
| `assets/js/lib/content.js` | New exports: the command pack loader and the gate helpers. `loadExamContent` is not changed. | 1a |
| `assets/js/lib/validate-core.js`, `tools/validate.js` | The command checks, and a Command line panel on the content check page: counts, the stored-lines table, a try-a-line box that takes many lines. | 1a |
| `schemas/command-pack.schema.json`, `schemas/exams.schema.json` | The shape, and the `commandUnits` field. | 0, 1a |
| `tools/serve.ps1`, `.claude/launch.json`, `tools/test-data/` | A third preview server on ports 8091 to 8095 that serves test data. | 1a |
| `.github/workflows/pages.yml` | Publish every page in the project root, and check each page shell. | 1a |
| `assets/js/lib/boot.js` | The tool's name, the exam choice, the hidden tab, the redirect for an exam without the tool. | 1b |
| `flashcards.html`, `practice.html`, `commands.html` | The hidden third tab, and the new page shell (a copy of `practice.html`). | 1b |
| `assets/js/pages/home.js`, `assets/css/site.css` | The third button row, the three-tab header, and the new page's styles. | 1b |
| `assets/js/lib/command-drill.js` | The draw, the version pick, grading a saved answer. | 1b |
| `assets/js/pages/commands.js` and its parts | Setup, the command screen, the question step, results, review, the saved drill. | 1b |
| `docs/`, `docs/content-kit/` | The guide's new section, the handoff section, the kit, the docs that say two tools. | 1c |

`assets/js/pages/practice.js` is copied from, never edited.

## 6. Matching

**Principle.** The reading decides which command is right. That is content, in the pack. The real system decides how that command may be typed. That is code, changed only by a website chat, with a test line for every rule, and a Windows rule only after the line was run on a Windows PC.

**Steps.** Clean the line (odd spaces, curly quotes, an en dash to a hyphen, an em dash to two hyphens, a pasted prompt). Lines that ask for help cost nothing. Read the line by its system. Compare with the stored lines read the same way. Name the miss.

- **Windows.** Command names in any case. One row of rules per command: `ipconfig`, `ping`, `tracert`, `netstat`, `arp`, `route`, `nslookup`. A command with no row is compared exactly as typed.
- **Linux.** Case matters, except the first letter of the line. A leading `sudo` is dropped. `ip a`, `ip addr`, and `ip address show` are one line.
- **Router and Switch.** Any case. `sh`, `sho`, and `show` are show. Every other word in full at launch.

**Results.**

| Result | Uses a try | Example |
|---|---|---|
| Accepted | | prints that answer group's output |
| Wrong command | yes | a real command that is not the answer. The other system's command adds a tag: `ifconfig: Linux` |
| Right command, wrong details | yes | the right tool with a wrong or missing switch |
| A slip | no | a wrong or missing address or host name that the task gave; a misspelled command name; a real command the tool has no commands for; a line a real system would run that the tool does not hold |

The planner's working sketch and 373 passing test rows are in the planning notes (section 12). 148 rows were run on this PC. No Linux or device row has been run by anyone.

## 7. The page

- **Setup.** The units named in `commandUnits`, each with a count. Quick picks 5, 10, All. A check box row, Extra commands, greyed with a Coming soon chip while empty. Banners for a drill in progress and the last drill, each with the two-click minus.
- **Command screen.** Command 3 of 10, the right and wrong counts, End drill. The task. The terminal box: a title strip with the system and Show answer, the prompt, one live text field, Run. Everything a try produces prints inside the box above the prompt.
- **Question step.** When the version has a follow-up, it is asked under the output, whichever right line was typed, and after a missed command too. The command's reading waits until the question is checked.
- **Results.** 8 of 10 commands. 6 on the first try. 2 of 3 questions. Review cards tagged Right, Missed, or Question missed. Retry missed shows the same version again when the question was the part missed.
- **Saved on the device.** The setup and the drill (with the version id shown and the follow-up answer). Nothing is written to the practice test's history, and its streak never moves. Typed lines are capped at 80 characters and kept only until Last drill is dismissed or replaced.

Label fixes over Appendix F: Wrong host name and Host name missing (not Wrong name). After a follow-up, the second block reads Command: ipconfig (not a second Answer line). A line that asks for help prints Not in this tool.

**Phone rules.** One live field per command, never redrawn between tries. The field's settings are written as text, because `h()` skips a value of false. On touch, scroll the top line to the top of the screen when a command opens. Nothing on the command screen is docked. Every new CSS class starts with `cl-`.

## 8. Site plumbing

- **Three states.** No `commandUnits` field: no button, no tab, no download. The field with no packs: Coming soon, worked out from the manifest. The field with packs: a link. If a manifest cannot be read, the button follows the field. The command state is read in its own try, so a broken commands manifest cannot change the other two buttons.
- **Header.** A layout only for pages that show three tabs: two rows up to about 740 px, tab columns sized by their labels. At 320 px two labels wrap to two lines. From 360 px all three fit on one line (measured).
- **Home card.** The third button on a row of its own, in the outline style.
- **Deploy.** `pages.yml` publishes every page in the project root. A new step checks each page for the do-not-list tag, the theme script above the stylesheet, the skip link, and the opened-from-a-folder notice. No test page may be left in the project root.
- **Hidden until launch.** `commands.html` sends everyone to the home page until the exam has the field. He opens it with `?drafts=1`. The flag is public, so the trial is hidden, not locked.
- **Cached scripts.** GitHub Pages lets a browser keep a script for 10 minutes. New exports go out at least a day before the code that imports them. The switch goes out at least a day after the last code push.

## 9. Content rules and the content run

The rule sentences are in Appendix E (R1 to R14). They are proposals for his approval, with these fixes:

- **R4b.** Unless the task may name the tool, it never uses the command's name in any form. The task may share its follow-up's system, addresses, and setting.
- **R4c.** A taught switch that only adds detail is stored only when the blind check finds it for that job. Three groups at most.
- **R4f.** A follow-up must need the printed output. A question whose stem already says what the output shows is not used.
- **R4g.** Its last two sentences (later versions and a versions pack) wait until he orders more versions.
- **R5.** Ids stay with their commands when a trial pack is rebuilt, and a dropped id is retired.
- **R7.** Both new `git grep` lines go in, as a sixth and a seventh.
- **Handoff rule 6** (flashcards only for what the exam tests) is not edited anywhere.

**The content run** is the content chat's, started by him with the handoff and one line that names it.

1. Unit 4.0 as a trial (nine commands), pushed with the tool off.
2. His phone trial.
3. Units 5.0 and 6.0 (sixteen commands).

Checks by agents that did not write the command: the blind command check (an agent sees only the task, the system, and the command sections, and types every line it would run), the output and style review, a blind key check of each follow-up against the output it is shown with, the content check, and proof of copy. Three rounds at most, then the command is dropped.

Nobody in the pipeline can run a Linux or device command, `arp -d`, or `arp -s`. Seven outputs are marked for his look first.

## 10. Phases, sizes, and cost

A session is one focused website chat.

| Phase | What | Size | Students see | Needs from him |
|---|---|---|---|---|
| 0 | His answers. Then the shape frozen as a schema, one example pack, and one merged checklist for each phase. | One conversation, then a small step | Nothing | Questions A to D |
| 1a | Engine, hidden, in three pushes: (1) the test server, the deploy change, the loader; (2) the matcher and its test lines, alone, with the GitHub run watched; (3) the command checks and the content check panel. | About 4 sessions | Nothing | Three pushes |
| 1b | Shared parts, hidden, as their own push outside class time: `boot.js`, the hidden tab, the page shell, the home card row, the header. Then the page. First of all: a bare test page with only the typing box, tried on his phones and deleted. | About 5 to 6 sessions | Nothing | Two pushes, and a look at two test ports |
| 1c | The guide and handoff sections, the kit at its smallest, the docs that say two tools. Then the content chat writes Unit 4.0. Then his phone trial and one fix session. | About 5 sessions, plus a content chat | Nothing, unless they add `?drafts=1` | Start the content chat. Try it on an iPhone and an Android phone. Look at two Linux outputs. |
| 1d | The content chat writes Units 5.0 and 6.0. Then the one-line switch, as its own push. | Small, plus a content chat | The tool, as in section 3 | Start the content chat. Look at five outputs. The word to switch on. |
| 3 | On his word: more output versions (about 12), and the extra set (19 solid lines, Appendix D). | Small for the site | More than one output for a command. Extra commands switched on. | His word for each pass |
| Later | Resume drill on the home card, recent drills, missed commands returning in the same drill, Unit 3.0's device words, Unit 8.0. | With each | | |

**Total to launch: about 14 to 16 sessions, plus the content.** The design round guessed about five working days. That was too low.

**The follow-up question** adds about one and a half sessions if built into the first version. Added after launch it costs about two to two and a half sessions, a second test pass, and edits to about seven published commands. So it is planned in the first version (question C).

**Cuts, if he wants a smaller build:** leave out the follow-up question (about 1.5 sessions), or show the third tab only on the Command line page (about 1 session).

**Stop points.** After 1a and after 1b nothing is visible and nothing is lost if work pauses. The first step that is hard to undo is the 1c push of the trial pack.

**Content cost**, counted from agent runs and not measured: 2.5 to 4 points of his weekly limit for the launch set, 3 to 5 with follow-ups. A unit run cost 10 to 14. Plan on 4 to 6 until the Unit 4.0 trial gives a real number.

**Website cost in points is not known yet.** One measurement exists: the planning round (six agents, about 3 million tokens) took 11 points of the weekly limit and 22 points of the weekly limit for the model it ran on. A build session without agent rounds should cost far less. The first 1a session measures it, and the rest is priced from that.

## 11. Rules for the build

1. Phase 0 comes first. No code before the shape is frozen and committed.
2. Never start, stop, clear, or seed anything on port 8080. Test data never goes under `data/`.
3. `boot.js`, `home.js`, and the page shells are pushed alone, after a regression pass, outside class time.
4. Before and after each shared-code push: the home, flashcards, and practice pages for both exams at 320, 640, and 1100 px, plus a dark spot check; the whole content check report compared, not only its counts; a deck and a test saved before and resumed after; no errors in the browser console; the quote helper still opens.
5. Every new CSS selector matches nothing on the finished pages. (A class named `term` would have restyled the flashcards term list.)
6. Every change to the matcher or its test lines is run against every pack on the test port, pushed alone, and its GitHub run is watched.
7. No Network+ unit run while the kit is being changed in 1c.
8. A website chat never writes commands, tasks, outputs, or questions. Test items are plainly fake and stay in `tools/test-data`.

## 12. Not verified

- Nothing has been seen on a real phone: the keyboard, the Go key, autocorrect, the 25 characters with phone fonts, the scroll when the field goes away. On paper, at 320 by 568 the Run button starts below the first screen, and a question sits one to two screens below its output.
- No Linux, router, or switch rule has been run by anyone. `arp -d` and `arp -s` were not run.
- What the live exam's prompt accepts is not published.
- Every size is an estimate. The count of 25 is matched to real ids, and the blind command check has never been run.

## 13. Where the detailed notes are

The planners' full notes, the matcher sketch, and the 373 test rows are kept outside the repository on this PC, in `.claude\projects\C--CompTIA-Website\command-line-plan\` under the user's home folder (`planners\site`, `planners\page`, `planners\matcher`, `planners\content`, `planners\out`). They hold file and line references for every change, and notes on the source materials, so they are not committed. Phase 1a copies the sketch and the test rows into the repository as real files.

## Appendices: the planners' tables

These are the planners' own words. Sections 1 to 11 win where they differ. Known differences: test items go in `tools/test-data`, not in a private folder under `data/`; the matcher's call is `matchLine()`; the follow-up set is the four questions in section 3; later output versions and the versions pack are not decided.

### Appendix A. Launch list (25, plus 2 on his word)

| Item | Lines to store, by answer group | System | Paired id (pack line) | How the pack keys it today | Cites | Source item | Task must add | Follow-up ready | Flags |
|---|---|---|---|---|---|---|---|---|---|
| U4-1 ipconfig | group 1: ipconfig; group 2: ipconfig /all | Windows | n-u04-q033 (unit-04.json line 684) | one answer, choice text ipconfig; the wrong choices are three Linux commands | 4.4.1 | Practice Tests 5 Q195 | nothing; a new scenario | n-u04-q059, q054, q060 (three versions) | Reading 4.2.7 also teaches netsh interface ip show config for this job: see the open questions |
| U4-2 ipconfig /all | ipconfig /all | Windows | n-u04-q032 (line 663) | one answer, ipconfig /all; plain ipconfig is a wrong choice | 4.4.1 | Practice Tests 5 Q202 | nothing | none | must refuse plain ipconfig |
| U4-3 arp -a | one group: arp -a, arp -g | Windows | n-u04-q037 (line 769) | one answer, arp -a; the question shows the output and asks which command | 4.4.3 | Practice Tests 7 Q69 | the job (the stem states none) | none | best exam evidence of the 25: a full practice test item |
| U4-4 arp -d * | arp -d * | Windows | n-u04-q038 (line 791) | one answer, arp -d *; arp -d with one address is a wrong choice | 4.4.3 | Practice Tests 5 Q184 | nothing | none: the output is empty | cannot be run on this PC |
| U4-5 arp -s | arp -s with the task's IP address and MAC address | Windows | n-u04-q039 (line 812) | one answer, the bare form arp -s | 4.4.3 | Practice Tests 5 Q207 | both addresses; the MAC with hyphens; an IP address of 11 characters or fewer | none: the output is empty | least fair of the 25: 32 to 40 characters where the question keys two; cannot be run on this PC |
| U4-6 ping | ping with the task's address | Windows | n-u04-q041 (line 854) | one answer, bare ping; the question shows the output and asks which command | 4.4.4 | Practice Tests 5 Q173 | a named system and a target address | n-u04-q044, q043 (two versions, new outputs) | ping -t is refused on this item |
| U4-7 ping -t | ping -t with the task's address | Windows | n-u04-q042 (line 876) | one answer, the bare switch -t; the stem names ping | 4.4.4 | Practice Tests 5 Q183 | a target address | none | the output has no end: reply lines and no statistics |
| U4-8 loopback ping | group 1: ping 127.0.0.1; group 2: ping localhost | Windows | n-u04-q022 (line 451) | choose two: 127.0.0.1 and localhost; the stem names ping | 4.3.3 (tagged 1.7.a) | Practice Tests 5 Q201 | nothing printed: the target is the answer; the wording must limit the job to the default IPv4 loopback address | none (n-u04-q061 says Linux) | ping localhost answered from ::1 on this PC; 127.0.0.2 and ::1 work on a real PC and cost a try here |
| U4-9 Linux address report | group 1: ip addr; group 2: ifconfig | Linux | n-u04-q036 (line 748), q035 (line 727), q052 (line 1089) | q036 keys ip addr; q035 keys ifconfig; q052 keys a FIRST step that names ip addr | 4.4.2 (q052 cites 4.6.1) | CertMaster 4.0 Q264; Practice Tests 5 Q182; Practice Tests 6 Q72 | nothing; it must not name one interface | none | three questions, one typed job; Linux layouts cannot be run by anyone |
| U5-1 route print | one group: route print, netstat -r | Windows | n-u05-q011 (unit-05.json line 219) | one answer, route print | 5.1.7 (netstat -r is taught in 6.1.5) | CertMaster 5.0 Q104 | nothing | n-u05-q070 (exhibit) | pool only; the two lines printed identical output on this PC today |
| U5-2 show ip route | one group: show ip route, show route | Router | n-u05-q012 (line 240) | one answer, show ip route | 5.1.7 | Practice Tests 5 Q234 | nothing | n-u05-q013 (exhibit) | show route is the objectives' spelling; device behavior unverified |
| U5-3 traceroute | traceroute with the task's address | Linux | n-u05-q014 (line 283) | one answer, bare traceroute; it asks for a tool | 5.1.8 | Practice Tests 5 Q176 | a named system and a target | n-u05-q020 (new output) | the stem names no system |
| U5-4 tracert | one group: tracert and tracert -d with the task's address | Windows | n-u05-q015 (line 304), q018 (line 369) | both key tracert; q015 shows the output | 5.1.8 | Practice Tests 5 Q172; Practice Tests 5 Q168 | a target (203.0.113.45 if q016 follows) | n-u05-q016 (exhibit) | two questions, one typed job |
| U5-5 tracert -d | tracert -d with the task's name | Windows | n-u05-q021 (line 433) | one answer, a whole line | 5.1.8 | CertMaster 5.0 Q33 | a named system; the target in the task (today it is only in the choices) | none | pool only; must refuse plain tracert |
| U5-6 show arp | one group: show arp, show ip arp | Router | card n-u05-f038 (flashcards/unit-05.json line 302) | card front show arp | 5.1.7 | needs its own: CertMaster 5.0 Q59 | the whole scenario | none | needs its own quote; the reading shows no output for it |
| U5-7 show vlan | show vlan | Switch | card n-u05-f039 (flashcards/unit-05.json line 310) | card front show vlan | 5.6.2 | needs its own: CertMaster 5.0 Q386 | the whole scenario | none | needs its own quote; CertMaster 5.0 Q289 lists show vlan brief as a wrong choice, which a real switch accepts |
| U6-1 netstat | netstat | Windows | n-u06-q015 (unit-06.json line 303) | one answer, bare netstat | 6.1.5 | Practice Tests 5 Q174 | nothing | none | the blind check may add netstat -n |
| U6-2 netstat -s | netstat -s | Windows | n-u06-q016 (line 324) | one answer; every choice is a netstat line | 6.1.5 | Practice Tests 5 Q197 | nothing; may name netstat | none | 116 real lines on this PC: the output is an excerpt |
| U6-3 netstat -e | netstat -e | Windows | n-u06-q017 (line 345) | one answer | 6.1.5 | Practice Tests 5 Q205 | nothing | none | never the Linux interface switch (a known problem) |
| U6-4 netstat -a | netstat -a | Windows | n-u06-q018 (line 366) | one answer; every choice is a netstat line | 6.1.5 | CertMaster 6.0 Q42 | nothing; may name netstat | none | pool only; netstat -an may join as a second group |
| U6-5 netstat -o | group 1: netstat -o; group 2: netstat -ano | Windows | n-u06-q019 (line 387) | one answer; every choice is a netstat line | 6.1.5 (netstat -ano is the figure in 6.1.3) | CertMaster 6.0 Q54 | nothing; may name netstat | none | pool only |
| U6-6 nslookup | nslookup with the task's name | Windows | n-u06-q097 (line 2038), q102 (line 2145) | both key bare nslookup; q097 shows the output | 6.6.3 (q102 cites 6.6.4) | Practice Tests 5 Q191; CertMaster 6.0 Q403 | a host name, and no added software, so that dig is fairly wrong | n-u06-q083 (new output) | two questions, one typed job |
| U6-7 nslookup -type=mx | nslookup -type=mx with the task's domain | Windows | n-u06-q099 (line 2082) | one answer, a whole line; every choice is an nslookup line | 6.6.3 | CertMaster 6.0 Q384 | a named system | n-u06-q074 only with a new output | pool only; 36 characters as keyed, so a shorter name |
| U6-8 nslookup with a server | nslookup with the task's name, then its server | Windows | n-u06-q100 (line 2103) | one answer, a whole line | 6.6.3 | CertMaster 6.0 Q282 | new names only | none | pool only; must refuse the reversed order |
| U6-9 dig @server | dig with @ and the task's server, then its name | Linux | n-u06-q101 (line 2124) | one answer, a whole line; the stem names dig | 6.6.4 | CertMaster 6.0 Q388 | new, shorter names | none | pool only; 36 characters as keyed; Linux unverified |
| On his word: ipconfig /release | ipconfig /release | Windows | half of n-u04-q034's pair (line 705); no partner of its own | choose two: /release and /renew | 4.4.1 | CertMaster 4.0 Q238 | a job that asks only to give the address up | none | cannot be run on this PC |
| On his word: ipconfig /renew | ipconfig /renew | Windows | the other half of n-u04-q034's pair | choose two | 4.4.1 | CertMaster 6.0 Q203 | a job that asks only to renew the lease | none | a question on Q203 was dropped once in review; cannot be run on this PC |

### Appendix B. Lines a published item asks that stay untyped

| Line | Published item | Why | When |
|---|---|---|---|
| ipconfig /release then /renew as one answer | n-u04-q034 (unit-04.json line 705) | one typed line cannot hold a pair | later, as a two-step item; or two one-line items on his word |
| adding a static route | n-u05-q010 (unit-05.json line 197) | the reading gives no syntax (5.1.7 lines 97 to 98) | never, unless the reading changes |
| interface VLAN60 | n-u05-q067 (line 1408) | a configuration line needs a configuration prompt | later |
| ip helper-address | n-u06-q054 (unit-06.json line 1130) | the same, and the question asks what the line does | later |
| nslookup or dig against one server | n-u06-q098 (line 2060) | its lines are items U6-8 and U6-9 | covered |
| ping by address, then by name | n-u06-q090 (line 1891) | two steps; its line repeats U4-6 | later |
| netstat -r | back of card n-u06-f067 (flashcards/unit-06.json line 534) | accepted inside U5-1 | covered |

### Appendix C. Follow-up candidates (section 3 uses only the four whose exhibit is the command's own output)

| Question (pack line) | Reads the output of | Could follow | Its exhibit as the printed output, as it stands | Verdict |
|---|---|---|---|---|
| n-u04-q054 (unit-04.json line 1131) | ipconfig | U4-1 ipconfig | yes, once its first line (the prompt line) is dropped; 7 lines remain | ready |
| n-u04-q059 (line 1237) | ipconfig | U4-1 ipconfig | yes, the same way | ready; a different right answer from q054 |
| n-u04-q060 (line 1259) | ipconfig values given in the stem | U4-1 ipconfig | no exhibit: an output is written with the stem's three values | ready with a new output; a third right answer |
| n-u04-q044 (line 918) | ping (replies) | U4-6 ping | no exhibit: a new output | ready with a new output |
| n-u04-q043 (line 897) | ping (the unreachable message) | U4-6 ping | no exhibit: a new output | ready with a new output; a second version |
| n-u05-q016 (unit-05.json line 326) | tracert | U5-4 tracert | yes, as it stands (8 lines), if the task's target is 203.0.113.45 | ready; its stem names no system and the layout is Windows |
| n-u05-q020 (line 412) | traceroute (asterisks at one hop) | U5-3 traceroute | no exhibit: a new output | ready with a new output; Linux layout unverified |
| n-u05-q013 (line 261) | show ip route (letter codes) | U5-2 show ip route | yes, as it stands (6 lines) | ready |
| n-u05-q070 (line 1472) | a host routing table | U5-1 route print | yes, as it stands (6 lines; a cut-down table) | ready |
| n-u06-q083 (unit-06.json line 1743) | nslookup (a non-authoritative reply) | U6-6 nslookup | no exhibit: a new output | ready with a new output; the task uses that question's name |
| n-u06-q074 (line 1553) | a table of MX records | U6-7 nslookup -type=mx | no: the exhibit is a table, not nslookup's layout | possible only with a new output and that question's domain; a loose fit |
| n-u04-q037 (line 769) | arp -a | its own item, U4-3 | the exhibit would fit (11 lines) | not a follow-up: it asks which command |
| n-u04-q041 (line 854) | ping | its own item, U4-6 | the exhibit would fit (12 lines) | not a follow-up: it asks which command |
| n-u05-q015 (line 304) | tracert | its own item, U5-4 | the exhibit would fit (10 lines) | not a follow-up: it asks which utility |
| n-u06-q097 (line 2038) | nslookup | its own item, U6-6 | the exhibit would fit (7 lines) | not a follow-up: it asks which command |
| n-u04-q061 (line 1280) | ping 127.0.0.1 (replies) | U4-8 loopback | no exhibit | not as it stands: the stem says Linux and the item is Windows |
| n-u05-q068 (line 1430) | show ip route, described | U5-2 | no exhibit | not recommended: the stem does the reading and names no address |
| n-u05-q034 (line 707) | a list of routes by source, no command named | none | no | not a command's output |
| n-u05-q018 (line 369) | a capture of tracert's probes, not its output | a partner of U5-4 | no exhibit | not a follow-up |
| n-u06-q090, q093, q096; n-u05-q069, q074 | a ping result used only as a premise | none | no exhibit | not recommended |

### Appendix D. Extra set candidates (19 solid, 10 borderline)

| Line | System | Taught in | Candidate source item | Strength | Note |
|---|---|---|---|---|---|
| ipconfig /flushdns | Windows | 4.4.1 line 21; 6.6.2 line 24 | CertMaster 6.0 Q346 (also 4.0 Q302, 5.0 Q37, 6.0 Q428) | solid | four pool items ask it; it cannot be run on this PC |
| ipconfig /release | Windows | 4.4.1 line 18 | CertMaster 4.0 Q238 (also 6.0 Q122) | solid | half of n-u04-q034's pair; a launch item if he names it |
| ipconfig /renew | Windows | 4.4.1 line 17 | CertMaster 6.0 Q203 | solid | the other half; a question on Q203 was dropped once in review |
| tracert -h | Windows | 5.1.8 line 80 | CertMaster 5.0 Q39 | solid | the item prints one choice twice |
| tracert -w | Windows | 5.1.8 line 81 | CertMaster 5.0 Q101 (also Q17) | solid |  |
| tracert -6 | Windows | 5.1.8 lines 83 to 86 | CertMaster 5.0 Q31 | solid |  |
| ping -6 with a name | Windows | 4.4.4 lines 119 to 120 | CertMaster 4.0 Q237 | solid |  |
| netstat with an interval | Windows | 6.1.5 line 132 | CertMaster 6.0 Q78 | solid | the item's key is a placeholder |
| ip route show, with route and netstat -r as other groups | Linux | 5.1.7 lines 97 to 98 | CertMaster 4.0 Q293 (also Q240, Q250) | solid | belongs in the Unit 5.0 extra pack |
| ip neigh, with arp -a as a second group | Linux | 4.4.3 line 77 | CertMaster 4.0 Q247 | solid | Q276 only asks what ip neigh does |
| ip link set eth0 up or down | Linux | 4.4.2 line 111 | CertMaster 4.0 Q288 | solid | the item's key adds the word dev |
| traceroute -I | Linux | 5.1.8 lines 28 to 29 | CertMaster 5.0 Q90 | solid | the capital letter matters |
| traceroute -6 | Linux | 5.1.8 line 29 | CertMaster 5.0 Q75 | solid |  |
| netstat -tua | Linux | 6.1.5 line 25 | CertMaster 6.0 Q7 | solid |  |
| netstat -l | Linux | 6.1.5 line 21 | CertMaster 6.0 Q63 (also Q21) | solid |  |
| netstat -4 or -6 | Linux | 6.1.5 line 67 | CertMaster 6.0 Q8 | solid |  |
| netstat -c | Linux | 6.1.5 line 133 | CertMaster 6.0 Q70 | solid |  |
| dig with a name, with nslookup as a second group | Linux | 6.6.4 line 14 | CertMaster 6.0 Q431 | solid |  |
| dig with a name and MX | Linux | 6.6.4 line 27 | CertMaster 6.0 Q417 | solid | two of the item's choices are valid |
| netstat -an | Windows | 6.1.5 lines 15 and 66 (two switches taught apart) | CertMaster 6.0 Q48 | borderline | would join the netstat -a item if supersets are accepted |
| netstat -r with the tool named | Windows | 6.1.5 line 76 | CertMaster 6.0 Q65 (Practice Tests 5 Q178 is on a list) | borderline | the same job as the route print item; the only line the practice exam asks |
| ipconfig /all for the DNS servers | Windows | 6.6.1 line 18 | CertMaster 6.0 Q422 (also Q199, Q386; 5.0 Q79) | borderline | the same line as a launch item, for a different job |
| netsh interface ip show config | Windows | 4.2.7 line 35 | CertMaster 4.0 Q116 | borderline | lesson 4.2 does not list objective 5.5 |
| nslookup with no arguments | Windows | 6.6.3 lines 37 to 39 | CertMaster 6.0 Q423 | borderline | its output is another prompt |
| nslookup -type=mx with a server | Windows | 6.6.3 line 35 | CertMaster 6.0 Q421 | borderline | over 36 characters with most names |
| ip link | Linux | 4.4.2 line 67 | CertMaster 4.0 Q279 (Q261 is on the no-reading list) | borderline | ip addr shows the state too |
| ping -c | Linux | 4.4.4 lines 123 to 124 | CertMaster 4.0 Q417 | borderline | the reading names the switch but prints no full line |
| dig +nocomments | Linux | 6.6.4 line 30 | CertMaster 6.0 Q424 | borderline | a detail only the reading and the pool use |
| show ip route with an address | Router | 5.7.1 line 19 | CertMaster 5.0 Q67 | borderline | lesson 5.7 does not list objective 5.5 |

### Appendix D2. Output versions: supply by command

| Command | Ready now from published questions | Unused practice exam items | Unused pool items, output printed | Unused pool items, output described in the stem | Note |
|---|---|---|---|---|---|
| ipconfig and ipconfig /all | n-u04-q059, q054, q060 (3 versions) | 3: Practice Tests 5 Q94, 5 Q97, 7 Q96 (each on a Do not map them again list); 5 Q100 waits for Unit 9.0 | 4: CertMaster 4.0 Q239, Q249, Q289, Q304 | 10: CertMaster 6.0 Q130, Q152, Q177, Q204, Q209, Q210, Q211, Q213, Q221, Q229 | richest by far: 17 unused items |
| ping | n-u04-q044, q043 (2 versions) | 1: Practice Tests 5 Q200 (on a list; a loopback result) | 1: CertMaster 4.0 Q236 | 8: CertMaster 4.0 Q282, Q301, Q390, Q402, Q414, Q434, Q442, Q444 | a third version (timed out) is possible |
| ping -t | none | none | none | 2: CertMaster 4.0 Q252, Q300 |  |
| tracert | n-u05-q016 | none | none | 2: CertMaster 5.0 Q400; CertMaster 4.0 Q440 (both say traceroute) |  |
| traceroute | n-u05-q020 | none | none | the same 2 | Linux layout unverified |
| route print | n-u05-q070 | 1: Practice Tests 5 Q88 (on a list) | none | none | Q88's right answer differs from q070's |
| show ip route | n-u05-q013 | none | none | none |  |
| nslookup | n-u06-q083 | none | none | 2: CertMaster 6.0 Q268, Q414 |  |
| dig | none | none (5 Q211 needs a figure) | 1: CertMaster 6.0 Q395 | none | real dig output is wide; Linux unverified |
| netstat -a | none | none | none | 2: CertMaster 6.0 Q18, Q32 (both name a Linux switch) |  |
| ifconfig or ip addr | none | none | 1: CertMaster 4.0 Q278 (it asks which system) | none | weak |
| arp -a | none | none | none | none that read output; 3 method items: CertMaster 4.0 Q396, Q409, Q431 | weak |
| show arp, show vlan, plain netstat, netstat -s, -e, -o, arp -d *, arp -s, tracert -d, both nslookup switch items | none | none | none | none | no supply |
| Cannot be follow-ups: they ask which command | \| Practice Tests 5 Q171, 7 Q100 (each on a list) | CertMaster 4.0 Q263; CertMaster 6.0 Q33, Q37, Q46, Q397 | \| |  |  |

### Appendix E. Rule text (proposals; section 9 lists the fixes)

| Ref | File and place | Text to add or change | Existing rules it touches |
|---|---|---|---|
| R1 | docs/CONTENT-GUIDE.md, after the One question per fact bullet (line 164) | ADD: A command line that a published question or a command flashcard already asks may also be asked once by typing, in the Command line tool. The typed command is the same fact in a second form, not a second question, and it names its question or card in `typedFormOf`. No question or card is the partner of two commands. | One question per fact (guide line 164; handoff rule 3, line 151; brief-weight.md line 46) |
| R2 | docs/CONTENT-GUIDE.md, after the sentence A practice-exam item is used once per exam (line 168) | ADD: A command that is the typed form of a published question is read through that question's source item and carries no `origin` of its own, so the item is still used once. A command with no such question (a card's command, a command Mr. Flauto names, an extra command) and every new follow-up question is modeled on one source item that no question, command, or follow-up of the exam has used. | A source item is used once (guide line 168; handoff rule 3; assemble.ps1 lines 186 and 190). Every question is modeled on one source item (guide line 162; handoff rule 1, line 149) |
| R3 | docs/CONTENT-HANDOFF.md, end of rule 3 (line 151) | ADD: A command line that a published question or command card already asks may be asked once more by typing (the guide, "A command"): that is not asking the fact again, and it is not a second use of its source item. | Handoff rule 3 |
| R4a | docs/CONTENT-GUIDE.md, new section A command (the Command line tool) before line 154: Which lines may be asked | ADD: The launch set: every command line that a published question or command flashcard of the exam asks, each tied to that item by `typedFormOf`, and any command Mr. Flauto names. The extra set: a line the reading teaches in a written unit that a CertMaster pool item or a practice exam item asks and no published question or card asks. It is written only when Mr. Flauto asks for it, in a pack of its own marked "set": "extra", and students choose whether to include it. Never: a line that no source item asks, however clearly the reading teaches it. | The exam decides what is written (guide line 160; handoff, What the site mirrors, 1 to 3) |
| R4b | same section: The task | ADD: One or two sentences in CompTIA voice that end by asking which command. It is a new scenario: not the source item's and not its question's. It names the system in words: a Windows PC, a Linux server, a router, a switch. It prints every address, name, and interface the answer needs, except the loopback address. It never holds an accepted line, a switch, or a command's name used as a verb. It names the tool only where the paired question's stem names it, or every choice of that question is a line of that tool. It is worded so that the lines the reading teaches are the only taught lines that do the job as asked. | A cousin, not a copy (guide line 158; handoff rule 1). The stem row (guide line 97). Wording (handoff rule 7, line 160) |
| R4c | same section: The accepted lines | ADD: The reading keys every answer, and for a command the key is a list: every line that a command section of a written unit teaches for that job on that system. The command sections are the sections of lessons that list the exam's command line objective (Network+: 5.5), plus the section the item cites. A line is stored the way the reading prints it, or the way the objectives print a device command: full words, lower case on Windows and on devices, with the task's own addresses and names, 36 characters at most. Lines that print the same output form one answer group. A different right command is its own group with its own output. So is a taught switch that only adds detail or changes how the result is shown (ipconfig /all for ipconfig, tracert -d for tracert, netstat -n beside another netstat line). A switch that changes what the command does (ping -t, tracert -h, traceroute -I) is never accepted for the plain job. An item has at most three answer groups. If more lines qualify, the task is rewritten to narrow the job. A group whose lines are taught by a section other than the one the item cites names that section in `sections`. Nothing the reading does not teach is ever required, and nothing it does not teach is ever stored. | The reading keys every answer (guide lines 163 and 166; handoff rule 2, line 150). An item belongs to the unit whose reading answers it (guide line 168; handoff rule 3): the item still cites only its own unit, and an accepted line may rest on a section of another written unit |
| R4d | same section: Two authorities | ADD: The reading decides which command is right. That is content, and it is in the pack. The real system decides how that command may be typed: capitals, a slash or a hyphen, spacing, the order of switches, short forms such as ip a. That is code (`assets/js/lib/command-match.js`). Only a website chat changes it, every rule has a test line, and a Windows rule is added only after the line was run on a Windows PC. A content chat never stores a second spelling of a line to make it pass, and never edits the matcher or its test lines. If the tool refuses a line that a real system accepts, it tells Mr. Flauto the line. | Stay out of the website (handoff lines 232 to 238). CLAUDE.md, two kinds of chat work |
| R4e | same section: Output | ADD: The printed output follows the exhibit rule (the `exhibit` row): written fresh, true to the reading, never a source item's or the reading's values, at most 12 lines of at most 25 characters, no em dashes, records folded onto two lines. Each answer group has its own output. It shows what that command prints, and it shows what the task asked for, with the task's own addresses. An output may be empty where the real command prints nothing (arp -d *). A long output shows only its first lines and the lines the task asked about. Nothing is added to say it was cut. Where the reading shows no output for a command, the layout comes from the real tool. On this PC a content chat runs only commands that change nothing (ipconfig, ipconfig /all, arp -a, route print, netstat with -n, -an, -ano, -e, -s, or -r, and ping or tracert to 127.0.0.1), and it keeps no value from the PC. It never runs ipconfig /release, /renew, /flushdns, or /registerdns, arp -d, arp -s, a route or netsh line that changes a setting, or anything that asks for an administrator. No one in the pipeline can run a Linux or device command. Those layouts come from the reading's figures, and the report lists them for Mr. Flauto to look at first. Where the reading and the real tool differ in meaning, the reading's meaning wins and the scenario avoids the case. A ping output prints no TTL value, and nothing leans on the Linux netstat interface switch. | The exhibit rule (guide line 98; brief-write.md rule 10, line 40; handoff lines 54 and 181; PLAN.md line 192). Sources are never copied (handoff line 142). Known problems (CONTENT-NOTES.md lines 268, 286, 287) |
| R4f | same section: The follow-up question | ADD: After the output prints, a version may ask one multiple-choice question about that output. The cheapest follow-up is a published question of the exam that reads this command's output: "followUp": { "question": "n-u04-q059" }. It stays one question, shown in Practice test and here. The output printed for the command that made that question's exhibit is the exhibit itself (`exhibitOf`). Every other answer group's output carries the same values. A published question with no exhibit gets an output written to match its stem. The task leads into the follow-up: the same system, the same addresses, and nothing its stem contradicts. A question that asks which command made the output is never a follow-up. A new follow-up is a full question (stem, choices, answer, tags, reference, origin), modeled on one unused source item that reads this command's output. It passes every check a question passes, with the output as its exhibit. | One question per fact (guide line 164). The exhibit rule's words Written fresh for each question (guide line 98): an exhibit is printed a second time, by the tool, for its own question only |
| R4g | same section: Output versions | ADD: A command may have two or three versions. Each has one output for every answer group and its own follow-up with its own right answer, so the follow-up cannot be memorized. The task and the accepted lines are the same in every version. A version added after the pack is published goes in the unit's versions pack (`unit-04-versions.json`), never into the published pack. A version's new follow-up may ask a fact that a published question asks only when the student has to read it from different output. That is the two-questions case of "One question per fact". | One question per fact (two only when the scenarios make a student reason differently). A published pack is fixed (handoff rule 8, line 161). The Do not map them again lists (CONTENT-NOTES.md lines 322, 327, 329) |
| R4h | same section: Packs and ids | ADD: `data/<exam folder>/commands/` holds a manifest and, for each unit, the launch pack (`unit-04.json`), the extra pack (`unit-04-extra.json`, with "set": "extra"), and the versions pack (`unit-04-versions.json`). Each has its own "reviewed" flag. A command is `n-u04-c001` and a version is `n-u04-v001`. No id is shared with a question or a card, and none is ever reused. If a paired question is deleted, the site hides its command and the content check reports it. | Ids never reused (guide lines 55 and 96). A published pack is fixed (handoff rule 8) |
| R4i | same section: The checks | ADD: The blind command check. An agent that has not seen the accepted lines, the outputs, or the paired question reads only each task, its system, and the command sections of every written unit. It lists every line it would run, with the section and words that teach each one. Every line is run through the tool's own matcher (the content check's try-a-line box). A taught line the item refuses is added, or the task is narrowed. An accepted line that no section teaches is removed. The other checks are the output and style review, the blind key check of every follow-up against the output it will be shown with, the content check, and `check-copy.ps1`. Three rounds at most. An item still flagged then is dropped, not argued. | Independent checks (handoff line 168 and step 8, line 182; brief-review.md lines 50 to 54; PLAN.md decision 14, line 191) |
| R5 | docs/CONTENT-HANDOFF.md, end of rule 8 (line 161) | ADD: This holds for command packs. A command pack pushed while its exam has no `commandUnits` in `data/exams.json` (the tool is still hidden) is a trial: it may be re-assembled until the tool is switched on. | A published pack is fixed (handoff rule 8; kit README line 81) |
| R6 | docs/CONTENT-HANDOFF.md, new section A Command line pass after line 217 | ADD: the twelve steps of the Content run table, in the handoff's own voice. A pass is started by the handoff plus one line that names it, for example: This is a Command line pass for Network+ Unit 4.0. | The unit steps (lines 166 to 193) are not edited |
| R7 | docs/CONTENT-HANDOFF.md lines 30 to 35 and line 170 | CHANGE: These five commands becomes These six commands, and line 170's five becomes six. ADD a sixth line: git grep -l typedFormOf HEAD -- assets/js/lib/validate-core.js schemas/command-pack.schema.json docs/content-kit/assemble.ps1 docs/content-kit/strip-for-check.ps1 docs/content-kit/brief-commands.md docs/CONTENT-GUIDE.md: all six. check-copy.ps1 is covered by a word it will hold (the website chat picks it once the script exists). | The kit check under Your unit |
| R8 | docs/CONTENT-HANDOFF.md line 236 | ADD: The matcher (`assets/js/lib/command-match.js`) and its test lines (`tools/command-cases.json`) are website files too. | Stay out of the website |
| R9 | docs/CONTENT-GUIDE.md, the exhibit row (line 98) | ADD: The output a command prints in the Command line tool keeps the same limits ("A command"). | The exhibit rule |
| R10 | docs/CONTENT-GUIDE.md, Quotes from the book, a fifth rule after line 192 | ADD: A command shows the quote of the question it is the typed form of when both cite the same section, so a fact is quoted once. Only a command with no such question needs a quote of its own. | Quotes from the book (guide lines 180 to 192; handoff rule 5, line 153) |
| R11 | docs/content-kit/brief-write.md line 20 | CHANGE the first clause to: The site has no performance-based questions. The Command line tool asks for a command by typing (those items are written from `brief-commands.md`), and a multiple-choice item can test the same decision a PBQ does: (the rest of the line stays). | Wording only |
| R12 | docs/CONTENT-GUIDE.md lines 7 to 21 and 29 to 34 | ADD the commands folder to the tree, and three Coming soon rows: an exam that has the tool and no command pack; a listed unit with no published command; the extra set while no extra pack has a published command. | Coming soon (guide lines 25 to 42; handoff lines 219 to 221; CLAUDE.md) |
| R13 | docs/CONTENT-NOTES.md, Network+ part, For later units (after line 329) | ADD a Command line entry: the launch list, the two pool items for the card commands, and by name every item lifted from a Do not map them again list. | The notes are the hand-over between content chats |
| R14 | NOT EDITED | docs/CONTENT-HANDOFF.md lines 20 and 154 to 159; docs/CONTENT-GUIDE.md lines 128 to 152; brief-write.md lines 65 to 78; brief-review.md line 46 stay word for word. | Handoff rule 6, flashcards only for what the exam tests |

### Appendix F. Labels on screen (section 7 lists the fixes)

| screen | label | note |
|---|---|---|
| Browser tab | Command line, then the exam name and code, then the site name | the pattern at boot.js 90 |
| Setup | Command line | heading |
| Setup | Coming soon | notice when there are no commands; chip on a unit with none; chip beside Extra commands while it is empty |
| Setup | Drill in progress: 3 of 10 done | banner, with Resume and a minus named Discard drill in progress |
| Setup | Last drill: 8 of 10 correct | banner, with Results and a minus named Dismiss last drill |
| Setup | Units | panel heading; rows read Unit 4.0 and the unit's title, with a count (tooltip: 9 commands) |
| Setup | Commands | panel heading |
| Setup | 5, 10, All (25) | quick picks |
| Setup | Extra commands (22) | button, filled when pressed; reads Extra commands, disabled, while no extra item exists |
| Setup | 25 available | under the picks and in the docked bar |
| Setup | Start 10 commands | Start 1 command for one; Select a unit when nothing is checked |
| Setup | Start a new drill? The drill in progress will be lost. | browser question |
| Command | Command 3 of 10 | top line |
| Command | Missed commands | chip on a retry drill |
| Command | Quit, End drill | Quit until one command is done |
| Command | Draft | badge on a draft item; seen only with drafts=1 |
| Terminal | Windows, Linux, Router, Switch | title strip |
| Terminal | Show answer | button in the title strip |
| Terminal | C:\> and $ and Router# and Switch# | the prompt, set in code from the system |
| Terminal | Run | button under the box |
| Terminal | Wrong command | red, with the x icon |
| Terminal | Right command, wrong details | red, with the x icon |
| Terminal | 1 try left | plain |
| Terminal | ifconfig: Linux | plain tag beside Wrong command |
| Terminal | Wrong address, Wrong name, Address missing, Name missing, Extra period, Not recognized: ipconfg, Not in this tool | plain; no try used |
| Terminal | Answer | plain, before the right command after a second miss or Show answer |
| Result | Correct, Correct on try 2, Incorrect | strip under the box, green or red, with the icon |
| Result | Answer: ipconfig /all | every time; Answer: ip addr or ifconfig when two commands are right |
| Result | Reading 4.4.1 ipconfig | with the quote; chips Obj 5.5 and Lesson 4.4 |
| Result | Next, Results | Results on the last command |
| Question | Check | as on the practice page |
| Question | Correct, or Incorrect. Answer: B | as on the practice page, with that question's reading |
| Question | Your answer, Correct answer | marks, as on the practice page |
| Results | Results | heading |
| Results | 80%, 8 of 10 correct, 6 on the first try | score block |
| Results | Questions: 2 of 3 | only when the drill asked a question |
| Results | 2 not answered, Retry of missed commands | when they apply |
| Results | Retry missed, New drill, Change units | New drill tooltip: Same units, new commands |
| Review | Review, Missed (2), Full drill (10), Nothing missed. | heading, switch, empty state |
| Review | Command 3, with the tag Right, Missed, or Not answered | card head |
| Review | Your answer, Correct answer, Answer: ipconfig /all | on the lines the student ran |
| Screen reader only | Command | the field's name; no visible label and no placeholder |
| Screen reader only | Commands done; 3 correct, 1 incorrect; Output of ipconfig /all; Quick picks; Commands to show; Choose one answer | names of the bar, the counters, the output, the picks, the switch, the choices |

### Appendix G. What the box prints

| result of a Run | uses a try | printed in the box | typed line |
|---|---|---|---|
| accepted | ends the command as right | the typed line stays; the output of the matched answer group prints | stays in the log |
| Wrong command | yes | echo; red x Wrong command; plain 1 try left | field emptied |
| Wrong command, other system | yes | echo; red x Wrong command with the plain tag ifconfig: Linux; 1 try left | field emptied |
| Right command, wrong details | yes | echo; red x Right command, wrong details; 1 try left | stays in the field |
| Wrong address, Wrong name, Address missing, Name missing | no | that status, plain, in the one status slot | stays in the field |
| Extra period | no | Extra period, plain | stays in the field |
| Not recognized | no | Not recognized: ipconfg, plain; the word is cut at 20 characters | stays in the field |
| Not in this tool | no | Not in this tool, plain | stays in the field |
| nothing typed | no | nothing; the cursor goes to the field | none |
| help, ?, cls, clear, exit | no | nothing | field emptied |
| second counted miss, or Show answer | ends the command as missed | plain Answer; the prompt with the right command; its output | field removed |

### Appendix H. Matcher rules and their evidence

| system | command or step | rule | evidence | kind of evidence |
|---|---|---|---|---|
| all | step 1, clean | Zero-width characters are removed. Tabs and odd spaces become spaces. Curly quotes become straight. An en dash, a minus sign, or a hyphen look-alike becomes one hyphen. An em dash becomes two hyphens. Then trim and squeeze spaces. Nothing else is repaired. | Windows refused ipconfig with an en dash, a minus sign, an em dash, two hyphens, and a no-break space. Reading 6.6.3 prints an en dash after nslookup once. | run on this PC. The tool is kinder than Windows for all of these but the em dash. |
| all | step 1, prompt | A pasted copy of the item's own prompt is dropped from the front, in any case, with or without a space after it. | In cmd the > sign would write a file, so nobody ran it. | a choice in the design, not run |
| all | step 2, never counts | An empty line. help, ?, cls, clear, exit. A line that asks for help: it ends in ?, /?, -?, or --help, or starts with help or man. | CompTIA's sample prompt answers help and ? with its command list. | a design rule, widened by me |
| windows | every command | The name is cut at a slash, matches in any case, and loses .exe. Host names, addresses, and words such as print match in any case. | Ran: IPCONFIG.EXE/ALL, arp/a, netstat/an, ping/n, ping/t, tracert/d, route/4 print, PING LOCALHOST, tracert LOCALHOST, NSLOOKUP EXAMPLE.COM. Refused: ipconfig-all. | run on this PC |
| windows | ipconfig | Slash or hyphen. The switch word in any case, whole, and not repeated. | Ran: /all, -all, -ALL, /aLL. Refused: /al, all, / all, --all, /all /all, /all/all, /all extra. | run on this PC |
| windows | ping | Slash or hyphen. Switch letters exact. A switch, with its value, may sit before or after the target. | Ran: -n 1 before and after the target, /n, -t before and after the target, /t. Refused: -N, -T, /T, --n, --t, -n1. | run on this PC |
| windows | tracert | Slash or hyphen. Switch letters exact. Switches only before the target, and not joined. | Ran: -d -h 1, /d /h 1, -h 1 -d. Refused: a switch after the target, -D, /D, -H, --d, -dh. | run on this PC |
| windows | netstat | Slash or hyphen, mixed too. Any case. The letters are one set: any order, joined or apart, repeats allowed. | Ran: -an, -na, -a -n, /an, /a /n, -a /n, -AN, -n -n, -e -e, and r, s, e, o, a alone in both cases. Refused: an, s, -z, --a, -a/n, -e-s. | run on this PC |
| windows | arp | Slash or hyphen. Any case. Words in typed order. | Ran: -a, -g, /a, /g, -A, -G, /G. arp a printed nothing. Refused: arp alone, --a, -all, -va. arp /? gives -d with * and the hyphenated MAC. | run on this PC for -a and -g. arp -d and arp -s were never run because they change the cache. They are the same program. |
| windows | route | Words in any case, in typed order. No short forms. | Ran: print, PRINT, Print. Refused: pri, prin, /print, -print, print/4, print with a period. | run on this PC |
| windows | nslookup | Hyphen only. The option word in lower case, exactly. ty, typ, type and any beginning of querytype are one option. The value in any case. Options before the name. Name before server. | Ran: -type=mx, -type=MX, -q=mx, -querytype=mx, -ty=mx, -query=mx, name then server. Failed: -TYPE, -Type, -Q, -t, --type, /type, the option after the name, server then name, name @server. | run on this PC |
| windows | a command with no row | Compared exactly as typed, after the name rule. | Strict until someone runs it on this PC. | a design rule |
| windows | a period at the end | Never repaired. When it is the only thing in the way: Extra period, no try. | Refused by ipconfig, arp, netstat, route, ping, and tracert. nslookup takes a trailing dot; the tool still asks for the plain form, at no cost. | run on this PC |
| linux | every command | The first letter of the line is lowered. A leading sudo is dropped. Case matters everywhere else, except in a DNS name. | Bash prints an error for a name it cannot find. The first letter and sudo rules are kindnesses. | documentation (gnu.org, Bash manual, Command Search and Execution) and general knowledge |
| linux | ip | The word after ip may be any beginning of address. With nothing after it, show is meant. A next word that begins show, list, or lst is show. | ip(8): 'address can be abbreviated as addr or just a'. ip-address(8): 'The show subcommand can be omitted'. iproute2 source: the first match wins, and an unknown word is an error. | documentation and source code (man7.org ip.8 and ip-address.8; github.com/iproute2/iproute2 files ip/ip.c, ip/ipaddress.c, lib/utils.c) |
| linux | ifconfig | Typed as it is. ifconfig -a is a different line. | ifconfig(8): with no arguments it shows the active interfaces; a single -a shows all. | documentation (man7.org ifconfig.8) |
| linux | traceroute | Typed as it is, then the target. | traceroute(8): the host is the only required parameter. | documentation (man7.org traceroute.8) |
| linux | dig | The @server word may sit before or after the name. Without the @ it is not a server. | dig(1) shows dig @server name. dig.c tests every argument for a leading @. | documentation and source code (manpages.debian.org dig.1; github.com/isc-projects/bind9 file bin/dig/dig.c) |
| router and switch | every command | Any case. Words in order. | Cisco: commands 'are generally case-insensitive'. | documentation (cisco.com, Using the Cisco IOS Command-Line Interface, PDF page 10) |
| router and switch | show | sh, sho, and show are show. s is not. | Cisco: 'the show version command can be abbreviated as sh ver'; 's could mean show, set, or systat'. | documentation (cisco.com, Using the Command-Line Interface in Cisco IOS Software) |
| router and switch | ip, route, arp, vlan | Typed in full. | No Cisco page gives a shortest safe form. Too few letters is '% Ambiguous command' (cisco.com, Catalyst 2960 configuration guide, Using the Command-Line Interface). | documentation for the principle; the choice is mine |
| all | targets | A stored target is an IPv4 address, a hyphenated MAC address, or a dotted host name. It is given when the task prints it. 127.0.0.1 and localhost are never given. | Design step 5a, narrowed. | a design rule |
| all | step 5, naming the miss | First fit wins. a: a given target is wrong, or every given target is missing (no try). b: only a period is in the way (no try). c: another system's command (try, with a tag). d: the right command with wrong details (try, line kept). e: a command the tool asks elsewhere (try). f: a real command with no item (no try). g: anything else (no try). | The design's order. The Windows names for f were found with where on this PC. | a design rule |

### Appendix I. What the content check proves for command packs

| id | proof | error or warning | note |
|---|---|---|---|
| C1 | The id follows course code, unit, the letter c, and a number. It is unique among command items and is used by no question or card of any exam. | error | a new per-exam map beside lines 194 and 219; the cross-exam list at line 79 |
| C2 | system is windows, linux, router, or switch. | error |  |
| C3 | The task is not empty, names its system in words, and ends with a question mark. | error | more than two sentences, or an em dash: warning |
| C4 | accept has at least one group. Each group has lines and outputs. | error |  |
| C5 | Each stored line is in plain form: lower case on Windows and devices, single spaces, no .exe, no sudo, no period at the end of a word, at most 36 characters, first word a real command of that system. | error | uses plainFormProblems from the matcher |
| C6 | Each stored line, typed exactly, is accepted in its own group. | error |  |
| C7 | No two stored lines of one item are the same line to the matcher. | error | catches ip addr beside ip address, or netstat -an beside -na |
| C8 | Every stored target is printed in the task. 127.0.0.1 is not printed when it is the answer. | error |  |
| C9 | The task holds no stored line and no switch. It names the command only when every stored line starts with it and has two or more words the task does not give. | error |  |
| C10 | Each output is at most 12 lines of 25 characters, with no tab and no en or em dash. | error | warnings: TTL= in a ping output; a given target the output never shows; an output that starts with the prompt |
| C11 | Tags and reference as for a question. | as today | the empty quote warning fires only when no partner question cites the same section |
| C12 | Every id in typedFormOf is a question or card of this exam. No question or card is named by two items. | error | partner is a draft: warning; a public item with a lab-only partner: error |
| C13 | origin is present exactly when no partner is a question. An item in a pack marked extra has no typedFormOf. | error | origin.kind and the copied-item rule as for a question (line 280) |
| C14 | The item refuses, by shape, every wrong choice of its partner questions that is a command line. | error | a right choice that is a command line and is not matched: warning |
| C15 | A source item is used once: the origin of a command item or of a follow-up written in place is used by nothing else in the exam. | error | two plain questions sharing one stay a warning, so old packs cannot start blocking |
| C16 | Same first answer as another item of the same system. | warning | like the 'Same term as' warning for cards |
| C17 | An unknown field on an item, a group, an output, or a follow-up. | warning | catches a misspelled typedFormOf |
| C18 | Each id in commandUnits is a unit in units.json. No item is tagged outside the list. | error | packs exist but the exam has no commandUnits: warning that the tool is hidden |
| V1 | Every group has the same number of outputs. | error | more than three: warning |
| V2 | An output is text or exhibitOf, not both. | error |  |
| V3 | followUps is absent or has one entry per version. | error |  |
| V4 | A linked follow-up question exists in this exam, is published, has a text exhibit, follows this output only, and its right answer is not a line the item accepts. | error | stops n-u04-q037 following an arp -a item |
| V5 | exhibitOf and the follow-up of that version name the same question. A linked question's exhibit is some group's output. | error |  |
| V6 | The exhibit, less a first line that is the prompt and a line of that same group, passes C10. | error | n-u04-q054 and n-u04-q059 start with such a line |
| V7 | A follow-up written in place passes the question checks, has a reference and an origin, and has no exhibit. | error | the same code as a question |
| V8 | Two versions of one item have the same right answer text. | warning | then the follow-up can be memorized |
| T1 | tools/command-cases.json loads and carries the matcher's version number. | error |  |
| T2 | Every row gets its code, and its group, line, and tag when the row names them. | error |  |
| T3 | Every fixture set's stored lines are plain, self-accepted, and distinct. | error |  |

### Appendix J. The three states

| State | In the data | Home card | Header tab | commands.html | New downloads |
|---|---|---|---|---|---|
| No tool | no commandUnits on the exam | nothing | not shown | goes to the home page | none |
| Coming soon | the field; commands manifest missing or its packs list empty | Command line, dashed, small Coming soon, not a link | shown | heading and a Coming soon notice | home page: the commands manifest |
| Ready | the field; the manifest lists a pack | Command line, a link | shown | the tool | home page: the manifest. Command line page: the packs |
| Manifest cannot be read, exam has the field | read throws (network, server error, bad JSON) | Command line, a link | shown | could-not-load notice with the reason | flashcards and practice pages ask for nothing, so they still work |
| Manifest cannot be read, exam has no field | same | nothing | not shown | goes to the home page | none |
| Teacher preview | no field; ?drafts=1 in the address; the manifest lists a pack | as Ready | shown | the tool | one manifest per live exam, only with the flag |
| Planned exam with the field | status is not live | planned card, no buttons | shown | heading and Coming soon (boot.js 109-121) | none |

### Appendix K. Header by width

| Width | Pages with two tabs (every A+ Core 1 page) | Pages with three tabs (Network+ after launch) | Basis |
|---|---|---|---|
| 320 px | as today: two tabs 236 px wide beside the 44 px button | two rows; Flashcards on one line, Practice test and Command line on two; tab row 55 px; the exam code drops under the name | fit in 288 px and 55 px height measured; column widths (about 87, 95, 95) and the code dropping are computed |
| 360 px | as today | two rows; all three tabs on one line, 44 px | measured |
| 390 px | as today | two rows; one line, about 43 px to spare | computed |
| 600 px | as today (phone layout) | two rows; tabs about 171, 184, and 201 px wide | computed |
| 601 to 740 px | as today: one row | two rows | the need is measured at 640 px (name on three lines, header 61 to 86 px); the layout is computed |
| 741 to 900 px | as today | one row with a third pill; name and code on one line | the 740 px limit is measured; the fit at 741 px is computed (about 226 px for a 200 px title) |
| 901 px and up | as today | one row; the site name is back; about 40 px to spare at 901 px | computed; check 901 and 940 px |

### Appendix L. Every place that says there are two tools

| File and line | What it says today | Change | Phase | Whose |
|---|---|---|---|---|
| CLAUDE.md:3 | the site is flashcards and practice tests | add Command line for exams that have it | 1b | site |
| CLAUDE.md:10 | the content chat writes questions and flashcards | add command items | 1c | site |
| CLAUDE.md:29 | test ports 8081 to 8085 | add the fixture server, ports 8091 to 8095, and tools/test-data | 1a | site |
| CLAUDE.md:36 | no symbol characters in the UI | one sentence: a prompt is the system's own text | 1b | page |
| CLAUDE.md:37 | Coming soon covers a study mode with no packs and both pickers | add: a tool an exam does not have is not shown at all; the tool's unit list; the extra set control | 1b | site |
| CLAUDE.md:38 | the home card only links to the two study modes | add the third row on exams with the field; no Resume drill yet | 1b | site |
| docs/PLAN.md:7-10 | Two tools per exam | three, the third only where commandUnits is set | 1c | site |
| docs/PLAN.md:25, 27 | Coming soon row; phone layout row | add the tool and the three-tab header | 1c | site |
| docs/PLAN.md:41-45 | page tree with two tools | add Command line (commands.html) | 1c | site |
| docs/PLAN.md:52 | each exam uses the same pages | add: Command line serves only exams with the field | 1c | site |
| docs/PLAN.md:56-57 | header has the two tabs | two or three tabs; the two phone layouts | 1c | site |
| docs/PLAN.md:63 | home card has Flashcards and Practice test buttons | add the third row | 1c | site |
| docs/PLAN.md:75 | the Coming soon rule | same sentence as CLAUDE.md:37 | 1c | site |
| docs/PLAN.md:85-92, 96 | two pack kinds; what is saved on the device | add commands packs and saved drills | 1c | content and page |
| docs/PLAN.md:156-158, 171 | roadmap; a new exam needs no code changes | add the tool; say the field turns it on for an exam | 1c | site |
| docs/PLAN.md section 2 table and section 7 | status rows and decisions | a new row and the new decisions | 1d | site |
| docs/CONTENT-GUIDE.md:3, 7-21 | the contract covers questions and flashcards; where content lives | add commands | 1c | content |
| docs/CONTENT-GUIDE.md:29-34 | Coming soon table; row 32 names two study modes | add rows for the tool's states | 1c | site |
| docs/CONTENT-GUIDE.md:51 | a new exam gets two empty manifests | say the commands manifest comes with the first command pack and the field is a website chat's | 1c | site |
| docs/CONTENT-HANDOFF.md:184, 186 | step 10 both study modes; step 12 the two packs, the two manifests | add the tool; a command pass names its own files | 1c | content |
| docs/CONTENT-HANDOFF.md:215, 234 | two manifests for a new exam; fields a content chat may change in exams.json | 215 stays; 234 adds: never commandUnits | 1c | content |
| README.md:3, 9 | what the site is; content so far | add the tool | 1d | site and content |
| README.md:19-23 | teacher pages | add the preview address and the fixture server | 1c | site |
| README.md:31, 33, 37 | three student pages; page logic; packs | four pages; add commands | 1c | site |
| index.html:9 | description line | add the tool, at launch only | 1d | site |
| package.json:5 | description | add the tool | 1c | site |
| schemas/exams.schema.json:4, 27 | Flashcards and Practice test links; folder holds flashcards/ and questions/ | reword; add the commandUnits property | 1a | site |
| .vscode/settings.json:8-9 | schema mapping for two folders | add commands and tools/test-data | 1a | site |
| .github/workflows/pages.yml:55, 59 | names three pages | every root page; the page check | 1a | site |
| flashcards.html:24-27 and practice.html:24-27 | two tabs | a third, hidden | 1b | site |
| assets/css/site.css:194-198, 792 | header comments draw two tabs | add the three-tab drawing | 1b | site |
| assets/css/site.css:384-387, 417 | the last row is Flashcards and Practice test | add the third row | 1b | site |
| assets/js/lib/boot.js:2, 74, 89, 124 | two pages named; two-way name; banner looks at two kinds | lookup; comments; banner | 1b | site |
| assets/js/lib/content.js:6-16, 60, 74-77, 87-88 | layout comment and two kinds | third folder in the comment; three-state result; CONTENT_KINDS left alone with a comment | 1a | site |
| assets/js/pages/home.js:2-6, 17, 21, 44, 47-49, 68-72, 88-92, 104-105 | two study modes throughout | third row; three-state map; comments | 1b | site |
| assets/js/pages/home.js:37-42 and components/discard-button.js:8-9 | discard is two-way | three-way, with Resume drill | later | site |
| assets/js/lib/validate-core.js:79, 162-164, 221, 350 and tools/validate.js:49-73 | two kinds in the id list, placeholders, storage check, and report | add commands | 1a | matcher and content check |
| tools/quotes.js:81 | refuses a file with no questions list | accept command packs | later | site |
| docs/content-kit/assemble.ps1:90, README.md:25, brief-write.md:20 | two kinds; both packs; performance-based questions cannot be shown | kit work | 1c | content |

