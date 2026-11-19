# Command line: build plan

A third study tool for Network+ only: a typed command drill. This is the plan a website chat builds from and the list of what the content chat writes.

**Status: approved by Mr. Flauto on 2026-11-19 ("Yes to all four", questions A to D in section 2). The build is under way. Section 14 says where it stands, what the next push is, and how a new chat picks it up. Read section 14 first.**

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
| D | Go ahead at the size in section 10, or take the cuts listed there? | Go ahead at the full size. The build runs one push to a fresh chat (section 14), without multi-agent rounds, and the first session measures what a session costs. |

The rule sentences themselves (Appendix E with the fixes in section 9) still get his read when a website chat writes them into the guide and the handoff in phase 1c.

### Defaults he can change with a word

- The four published questions in section 3 may also be shown under the output, with their own exhibit printed as that output. Each is then seen in Practice test and in Command line.
- The hidden tab, the home card row, and the new header are built early and stay invisible. The switch that shows the tool is its own small push after all the content is in.
- The trial is all of Unit 4.0 (nine commands), published with the tool off. Anyone who adds `?drafts=1` to the address can open it. Nothing links to it.
- A hidden trial pack may be rebuilt until the tool is switched on. Ids stay with their commands.
- Test data lives in `tools/test-data` in the repository (never on the site), served only on new test ports 8091 to 8095 through one optional setting in `tools/serve.ps1`.
- If a question that a command is the typed form of is deleted, the content check blocks publishing until the command is dropped too.
- A line a real system would run, but that the tool does not hold (`show ip ro`, `ifconfig -a`, `show vlan brief`), costs no try. It gets a plain label and stays in the field. This covers only the two cases section 6 lists. Any other working line the reading does not teach still costs a try until the blind command check lists it.
- Three sentences change in `CLAUDE.md`: a prompt (`C:\>`, a dollar sign, `Router#`) is the system's own text, not a symbol; a tool an exam does not have is not shown at all, and the extra set control reads Coming soon until it has commands; the Network+ home card has a third button and still no score.
- Each build chat ends with a commit once its proofs pass (section 14, rule 7). Nothing is pushed without his word.
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
- A question about the output on three commands: `ipconfig` with two output versions (questions n-u04-q054 and n-u04-q059), `show ip route` (n-u05-q013), and `tracert` (n-u05-q016). `route print` (n-u05-q070) only on his word, because its exhibit is a cut-down table.
- Extra commands, reading Coming soon.
- Units 3.0 and 8.0 listed inside the tool, reading Coming soon.

Not at launch: a follow-up on other commands, two-step answers such as `ipconfig /release` then `/renew`, output shown first, Resume drill on the home card, a list of recent drills, missed commands coming back inside the same drill.

Five of the ten questions first listed as follow-ups are left out, because their stems already say what the output shows (Appendix C).

## 4. The data shape

One shape, frozen in phase 0 as `schemas/command-pack.schema.json` with one example pack in `tools/test-data`. The pack header may gain two bookkeeping fields in 1c push 2, for keeping ids on a rebuild (section 14). The page ignores them.

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
- **`alsoWorks`** (optional, on the command): lines a real system would run for this job that the reading does not teach, such as `ifconfig -a`. A typed line that matches one costs no try (section 6). The list starts empty and grows only from what the blind command check types. It is not in the schema or the example pack yet: 1a push 2 adds it to both.
- **`followUp`** is `{ "question": "<id>" }`, a published question of the same exam. A follow-up written in place is refused by the content check until phase 3.
- **Ids.** A command is `n-u04-c001`. No id is shared with a question, a card, or a version of any exam.
- **No weight is stored.** The draw works it out from the partner question's source (the practice exam book's two full tests, Practice Tests 6 and 7, count 3, the rest of the book 2). With several partner questions the highest weight counts. A command with an `origin` of its own uses that source. Anything that is not the practice exam book counts 1.
- **The page ignores a field it does not know**, skips a version it cannot print, and hides a command with no printable version. The content check warns about an unknown field.
- **`data/exams.json`** gets one field on the Network+ exam, set only by a website chat: `"commandUnits": ["3.0", "4.0", "5.0", "6.0", "8.0"]`.

## 5. Code layout

| File | Job | Phase |
|---|---|---|
| `assets/js/lib/command-match.js` | The matcher. No page code. `matchLine()` returns a verdict (accepted, miss, slip, or ignored) and a code. The code `wrong-command` carries the systems that command runs on when it is another system's command. The words for each code live in one table here. | 1a |
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
- **Linux.** Case matters, except the first letter of the line and a DNS name. A leading `sudo` is dropped. `ip a`, `ip addr`, and `ip address show` are one line.
- **Router and Switch.** Any case. `sh`, `sho`, and `show` are show. Every other word in full to be accepted. A short form of two letters or more costs nothing, and an unfinished line still costs a try (see below).

**Results.**

| Result | Uses a try | Example |
|---|---|---|
| Accepted | | prints that answer group's output |
| Wrong command | yes | a real command that is not the answer. The other system's command adds a tag: `ifconfig: Linux` |
| Right command, wrong details | yes | the right tool with a wrong or missing switch |
| A slip | no | a wrong or missing address or host name that the task gave; a misspelled command name; a real command the tool has no commands for; a line a real system would run that the tool does not hold |

**A line a real system would run that the tool does not hold** is one of two things, and both are slips with the plain label Not counted (the line stays in the field):

- a line listed in the command's `alsoWorks` (section 4), read by the matcher the same way as a stored line;
- on a router or switch, a line with the same number of words as an accepted line or an `alsoWorks` line, where each word is that line's word in the same place or a beginning of it at least two letters long (`show ip ro` for `show ip route`, `sh vl br` for `show vlan brief`). A line with fewer words (`show ip`) is unfinished and still costs a try. The tool cannot know which short forms a real device would call unclear, so it neither accepts them nor charges for them.

The label Not counted is a working label. He sees it in the phone trial and may rename it.

The planner's working sketch and 373 passing test rows are in the planning notes (section 13). 148 rows were run on this PC. No Linux or device row has been run by anyone.

## 7. The page

- **Setup.** The units named in `commandUnits`, each with a count. Quick picks 5, 10, All. A check box row, Extra commands, greyed with a Coming soon chip while empty. Banners for a drill in progress and the last drill, each with the two-click minus.
- **Command screen.** Command 3 of 10, the right and wrong counts, Quit before the first answer and End drill after. The task. The terminal box: a title strip with the system and Show answer, the prompt, one live text field, Run. Everything a try produces prints inside the box above the prompt.
- **Question step.** When the version has a follow-up, it is asked under the output, whichever right line was typed, and after a missed command too. The command's reading waits until the question is checked.
- **Results.** 8 of 10 commands. 6 on the first try. 2 of 3 questions. Review cards tagged Right, Missed, Question missed, or Not answered. Retry missed shows the same version again when the question was the part missed.
- **Saved on the device.** The setup and the drill (with the version id shown and the follow-up answer). Nothing is written to the practice test's history, and its streak never moves. Typed lines are capped at 80 characters and kept only until Last drill is dismissed or replaced.

Label fixes over Appendix F: Wrong host name and Host name missing (not Wrong name). After a follow-up, the second block reads Command: ipconfig (not a second Answer line). A line that asks for help prints Not in this tool. A line a real system would run that the tool does not hold prints Not counted (section 6).

**Phone rules.** One live field per command, never redrawn between tries. The field's settings are written as text, because `h()` skips a value of false. On touch, scroll the top line to the top of the screen when a command opens. Nothing on the command screen is docked. Every new CSS class starts with `cl-`.

## 8. Site plumbing

- **Three states.** No `commandUnits` field: no button, no tab, no download. The field with no packs: Coming soon, worked out from the manifest. The field with packs: a link. If a manifest cannot be read, the button follows the field. The command state is read in its own try, so a broken commands manifest cannot change the other two buttons.
- **Header.** A layout only for pages that show three tabs: two rows up to about 740 px, tab columns sized by their labels. At 320 px two labels wrap to two lines. From 360 px all three fit on one line (measured).
- **Home card.** The third button on a row of its own, in the outline style.
- **Deploy.** `pages.yml` publishes every page in the project root. A new step checks each page for the do-not-list tag, the theme script above the stylesheet, the skip link, and the opened-from-a-folder notice. No test page may be left in the project root. The one exception is the bare typing page of 1b push 0, until the commit of 1b push 1 deletes it (section 14).
- **Hidden until launch.** `commands.html` sends everyone to the home page until the exam has the field. He opens it with `?drafts=1`. The flag is public, so the trial is hidden, not locked.
- **Cached scripts.** GitHub Pages lets a browser keep a script for 10 minutes. New exports go out at least a day before the code that imports them. The switch goes out at least a day after the last code push.

## 9. Content rules and the content run

The rule sentences are in Appendix E (R1 to R14). They are proposals for his approval, with these fixes:

- **R4b.** Unless the task may name the tool, it never uses the command's name in any form. The task may share its follow-up's system, addresses, and setting.
- **R4c.** A taught switch that only adds detail is stored only when the blind check finds it for that job. Three groups at most.
- **R4c, R4d, R4i and `alsoWorks`.** A line the blind check types that a real system would run for the job, and that no command section teaches, is never added to `accept`. It goes in the command's `alsoWorks`, so it costs no try and prints no output. R4c's last sentence becomes: nothing the reading does not teach is ever required or accepted. A Windows line is run on this PC first, and only if it changes nothing. A Linux or device line is listed for his look. A content chat never puts a second spelling of an accepted line in `alsoWorks`. This wording gets his read with the other rule sentences.
- **R4f.** A follow-up must need the printed output. A question whose stem already says what the output shows is not used.
- **R4g.** Its last two sentences (later versions and a versions pack) wait until he orders more versions.
- **R4h.** Leave out the versions pack (`unit-04-versions.json`). It is not decided.
- **R5.** Ids stay with their commands when a trial pack is rebuilt, and a dropped id is retired.
- **R7.** Both new `git grep` lines go in, as a sixth and a seventh. The seventh looks for a word the three matcher files already hold, so the matcher is never edited to make it pass (section 14, 1c push 2).
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
| 1b | Shared parts, hidden, as their own push outside class time: `boot.js`, the hidden tab, the page shell, the home card row, the header. Then the page. First of all (push 0): a bare test page with only the typing box, tried on his phones, and deleted by push 1. | About 5 to 6 sessions | Nothing | Three pushes, a phone trial of the bare page, and a look at two test ports |
| 1c | In two pushes: (1) the rules and the docs: the guide's new section and the docs that say two tools; (2) the kit at its smallest and the handoff section. Then the content chat writes Unit 4.0. Then his phone trial and one fix session. | About 5 sessions, plus a content chat | Nothing, unless they add `?drafts=1` | Read the rule sentences. Two pushes. Start the content chat. Try it on an iPhone and an Android phone. Look at two Linux outputs. |
| 1d | The content chat writes Units 5.0 and 6.0. Then the one-line switch, as its own push. | Small, plus a content chat | The tool, as in section 3 | Start the content chat. Look at five outputs. The word to switch on. |
| 3 | On his word: more output versions (about 12), and the extra set (19 solid lines, Appendix D). | Small for the site | More than one output for a command. Extra commands switched on. | His word for each pass |
| Later | Resume drill on the home card, recent drills, missed commands returning in the same drill, Unit 3.0's device words, Unit 8.0. | With each | | |

**Total to launch: about 14 to 16 sessions, plus the content.** The design round guessed about five working days. That was too low.

**The follow-up question** adds about one and a half sessions if built into the first version. Added after launch it costs about two to two and a half sessions, a second test pass, and edits to about seven published commands. So it is planned in the first version (question C).

**Cuts, if he wants a smaller build:** leave out the follow-up question (about 1.5 sessions), or show the third tab only on the Command line page (about 1 session).

**Stop points.** After 1a and after 1b nothing is visible and nothing is lost if work pauses. The first step that is hard to undo is the 1c push of the trial pack.

**Content cost**, counted from agent runs and not measured: 2.5 to 4 points of his weekly limit for the launch set, 3 to 5 with follow-ups. A unit run cost 10 to 14. Plan on 4 to 6 until the Unit 4.0 trial gives a real number.

**Website cost in points is not known yet.** One measurement exists: the planning round (six agents, about 3 million tokens) took 11 points of the weekly limit and 22 points of the weekly limit for the model it ran on. A build session without agent rounds should cost far less. The first 1a session measures it, and the rest is priced from that. 1a push 1 was measured: 3 points of the weekly limit and 7 of the larger model's weekly limit, built by one agent inside the planning chat. No Opus 5.5 chat has been measured yet. 1a push 2 is the first.

## 11. Rules for the build

1. Phase 0 comes first. No code before the shape is frozen and committed.
2. Never start, stop, clear, or seed anything on port 8080. Test data never goes under `data/`.
3. `boot.js`, `home.js`, and the page shells are pushed alone, after a regression pass, outside class time.
4. Before and after each shared-code push: the home, flashcards, and practice pages for both exams at 320, 640, and 1100 px, plus a dark spot check; the whole content check report compared, not only its counts; a deck and a test saved before and resumed after; no errors in the browser console; the quote helper still opens.
5. Every new CSS selector matches nothing on the finished pages. (A class named `term` would have restyled the flashcards term list.)
6. Every change to the matcher or its test lines is run through the content check on port 8081 (the real packs) and port 8091 (the example pack), pushed alone, and its GitHub run is watched.
7. No Network+ unit run while the kit is being changed in 1c.
8. A website chat never writes commands, tasks, outputs, or questions. Test items are plainly fake and stay in `tools/test-data`.

## 12. Not verified

- Nothing has been seen on a real phone: the keyboard, the Go key, autocorrect, the 25 characters with phone fonts, the scroll when the field goes away. On paper, at 320 by 568 the Run button starts below the first screen, and a question sits one to two screens below its output.
- No Linux, router, or switch rule has been run by anyone. `arp -d` and `arp -s` were not run.
- What the live exam's prompt accepts is not published.
- Every size is an estimate. The count of 25 is matched to real ids, and the blind command check has never been run.

## 13. Where the detailed notes are

The planners' full notes, the matcher sketch, and the 373 test rows are kept outside the repository on this PC, in `.claude\projects\C--CompTIA-Website\command-line-plan\` under the user's home folder (`planners\site`, `planners\page`, `planners\matcher`, `planners\content`, `planners\out`). They hold file and line references for every change, and notes on the source materials, so they are not committed. Phase 1a ports the sketch to a module and turns the draft rows into the case table (section 14, 1a push 2).

## 14. Where the build stands, and how a new chat continues

**How the build runs (his decision, 2026-11-19).** The research and the planning ran on a larger model with agent rounds. The build runs on Opus 5.5 in ordinary website chats: one push to a fresh chat, working alone, no agent rounds. The planning chat is gone. Everything a build chat needs is in the files this section names.

**In this section a push is one step of the build:** the work, its proofs, one build commit, the two small section 14 commits of rule 9, and one `git push` on his word. The git command is always written `git push`.

**To start the next chat, he pastes:**

> Continue the Command line build. Read docs/COMMAND-LINE-PLAN.md section 14, then do the push it names under Next. Work alone. Commit when the proofs pass, and stop before git push.

**This section is the only place that says where the build stands.** A saved memory note or an older chat may be out of date. Trust this section and `git log`.

### Done

| Push | Commit | What it added | State | Cost |
|---|---|---|---|---|
| Phase 0 | `d6021e6` | This plan, `schemas/command-pack.schema.json`, the example pack `tools/test-data/ready/network-plus/commands/unit-99.json`, `docs/COMMAND-LINE-CHECKLISTS.md` | Pushed 2026-11-19 | Counted with 1a push 1 |
| 1a push 1 | `e28deb6` | `tools/serve.ps1 -DataOverlays`, the preview server `study-site-fixture` (ports 8091 to 8095), `tools/test-data/`, the page check and "every root page" in `pages.yml`, new exports in `assets/js/lib/content.js`, `commandUnits` in `schemas/exams.schema.json` | Pushed 2026-11-19. The GitHub run passed, including Check the pages. The published site was opened and loads as before. | 3 points of the weekly limit and 7 of the larger model's weekly limit, built by one agent inside the planning chat. No Opus 5.5 chat has been measured yet. |
| Build state and rules | the commit named "Command line: build state and rules for the build chats" | This section, the reworked `docs/COMMAND-LINE-CHECKLISTS.md`, `alsoWorks` and Not counted (sections 4 and 6), the Command line section of `CLAUDE.md`, one-line pointers in `docs/PLAN.md`, `docs/CONTENT-GUIDE.md`, and `docs/CONTENT-HANDOFF.md` | Committed 2026-11-19, not pushed. It changes no page and no script. It goes out with the next `git push`: do not push it alone. | Planning chat |

`commandUnits` is not in `data/exams.json`. That line is the launch switch and belongs to phase 1d.

### Next

**1a push 2: the matcher and its test lines, alone.** Its steps are under "The pushes, one by one".

### What the pushes so far settled beyond the plan

- `loadCommandPacks(readJSON, exam, { includePrivate })` returns every pack the commands manifests list, as `{ path, visibility, data }`. `commandsFromPacks(packs)` flattens them, skips a pack with no `commands` list, and stamps each command with `_pack`, `_visibility`, and `_set` (`launch` when the pack header has no `set`, otherwise the mark as written, so `extra`). Read commands through `commandsFromPacks`, never from `pack.data`.
- `commandState(readJSON, exam, { includePrivate, preview })` answers `none`, `soon`, or `ready` from the field and the manifests alone. It throws when a manifest cannot be read. Call it in a try of its own and fall back on `assumedAvailable(exam).commands`. `commandUnits(exam)` returns the list or null.
- `contentAvailable` and `loadExamContent` were not changed, and must not be.
- The schema flags unknown fields on the pack header, a command, a group, a version, an output, and a follow-up. It allows `sections` on a group (only the kit reads it).
- The fixture server refuses test data on any port outside 8091 to 8095 and adds the header `X-Test-Data` to every answer that came from `tools/test-data`. It reads files fresh on every request. The five `exams.json` files there are copies of `data/exams.json`: make them again when it changes (`tools/test-data/README.md`).
- On localhost every exam page logs two 404 notes for the optional `manifest.private.json` files. "No console errors" in a checklist means no script errors.
- Several tracked files have CRLF line endings in the working folder. Keep each file's own line endings when editing. Git here has `core.autocrlf` set to true, so `git add` and `git diff` print a warning that LF will be replaced by CRLF for any file written with LF. The warning is harmless: do not change a file's line endings because of it.
- The content check today reads "Ready to publish. 0 errors, 735 warnings."

### Rules for every build chat

These add to section 11. Where this section differs from sections 1 to 11, this section wins: it is newer. So it is one push to a fresh chat, not one phase to a session, and the session counts in section 10 are sizes.

1. **Read first.** `CLAUDE.md`, sections 1 to 11 and this section, the checklist for the push together with the list Every push in `docs/COMMAND-LINE-CHECKLISTS.md`, and the planning notes this section names for the push. The appendices are for looking things up.
2. **Look at the folder before changing anything.** Run `git fetch`, `git status -sb`, and `git log --oneline origin/main..HEAD`, and keep what they print. `main` is normally ahead of `origin/main` by commits the Done table names: the last section 14 commit of the push before, and any docs-only commit the Done table says goes out with the next `git push`, such as "Command line: build state and rules for the build chats". That is expected: say so in your first reply and carry on. Stop and wait for his answer if `main` is behind `origin/main`, is not the checked-out branch, or is ahead by a commit the Done table does not name. If the Done table shows a push as committed, not pushed, ask him for the word to `git push` it, and do rule 8 for it, before you build anything: two pushes never go out together. If a commit of the push named under Next is already there, do not build it again. If files are changed that this push does not own, name them in your first reply and carry on. Changed files that are not yours stay as they are and out of your commits: his quotes and review marks under `data/`, lines he added to a doc, a content chat's files. Stage your own files by path.
3. **Read the usage meters at the start and at the end** (`ToolSearch` with the query `select:mcp__ccd_session_mgmt__get_usage`, then call it). Write the difference into the Done table: the weekly limit, the model's weekly limit, and how full the context was at the end.
4. **Servers.** Use the preview server `study-site-test` (ports 8081 to 8085) for the real data and `study-site-fixture` (ports 8091 to 8095) for test data: `preview_start` with the name, and `preview_stop` for a server you started. If one will not start because its ports are held, another chat's server is already serving this same folder: use it, and do not stop it. Check that it is this folder first: `http://localhost:8081/docs/COMMAND-LINE-PLAN.md` must show this section as it is on disk. If it does not, something else holds the port: tell him. Never end a process you did not start. The content check for a chat is http://localhost:8081/tools/validate.html (and the same page on a fixture port). After editing a script, reload the page fully: the browser keeps modules.
5. **One push to a chat.** Do not start the next one. If the push will not fit in one chat (the usage tool shows the context about two thirds full before the proofs begin, or a usage limit is close), stop at a point where the content check has 0 errors and no page is broken. Commit that part as `Command line <push> (part 1)`, do not `git push`, and write under Next exactly what is done and what is left. The next chat finishes the same push.
6. **Proofs.** Run the checklist's proofs. A line that says after the push is run after the `git push`. Every other line is run before the commit. A few lines read the commit itself (`git show --stat`, and E6, E12, and E13): before the commit, check the same thing with `git diff --cached --stat`, and run the line itself right after the commit. If it fails then, fix it with a new commit. Say which you ran, which you could not run, and why. A proof that could not be run is reported, never passed over. A proof that needs his phone is his: list it for him.
7. **Commit** on `main` when every before-the-commit proof passes. He approved a commit at the end of each build chat. If a proof fails and you cannot fix it, or one could not be run and it is not a phone proof, do not commit the build: tell him which one and why, and leave the build files as they are. Then write under Next what is done and what is left, and commit that note by itself (a commit that holds only this file, as rule 9 says). If a proof's own command cannot show the fact and you proved the same fact another way, say how: that counts as run. Name the build commit Command line, then the push, then what it added, like the two commits in the Done table.
8. **After a `git push`** (only on his word in that chat): find the run with `gh run list --commit $(git rev-parse HEAD) --limit 1 --json databaseId,status,conclusion,headSha` in Git Bash (list again after a few seconds if it is empty). GitHub starts one run for a `git push`, on the newest commit in it. That is your section 14 commit, not the build commit, and a short commit id finds nothing, so always pass the full id that `git rev-parse HEAD` prints. If the list is still empty after a minute, read `gh run list --branch main --limit 1 --json databaseId,status,conclusion,headSha` and check that `headSha` is that id. Wait for the run with `gh run watch <id> --exit-status`, with a 10-minute timeout. If the run fails, read its log with `gh run view <id> --log`. The old site stays up, but nothing can be published until it is fixed. Tell him the cause in one or two lines. On his word, either push a fix or `git revert` the commit and push that. This belongs to the same chat and is not a second push in the sense of rule 5. Never end a chat with `main` red without telling him. When the run is green, open the published home page and the published Network+ practice page and confirm that both load with no script errors and that nothing new is visible.
9. **Update this section twice**, each time as a commit of its own that holds only this file. Right after the build commit: move the push to Done with its commit id and the words committed, not pushed; add what it settled beyond the plan (every function a later push will call, with its signature); add its cost; name the next push; and fix any sentence in this plan that the push made untrue. After the `git push` and the checks of rule 8: change the State cell to the date and what the run showed. That second commit rides with the next `git push`. Never leave this file changed and uncommitted: a content chat would stop on it. Build state is not kept in the memory note.
10. **If the files disagree:** this section and sections 1 to 11 win over the checklists, the checklists win over the appendices and the planning notes, and the code as committed wins for what already exists. If something students or the content chat will see is still unclear, ask him. Do not guess.
11. **Running a Windows line on this PC to check a spelling:** only commands that show and never change. That is `ipconfig` with no switch, `/all`, or `/allcompartments`; `arp -a` and `arp -g`; `route print`; `netstat` with any of `-a`, `-n`, `-o`, `-e`, `-s`, `-r`; `nslookup` for example.com; and `ping` or `tracert` to 127.0.0.1 or localhost. Any case, order, or switch mark of those is fine, and so is a misspelled switch on one of them, which only prints the usage text. Stop a line that does not end by itself (`ping -t`, plain `netstat`) after a few seconds. If a line is not plainly one of these, do not run it: its row is marked never run. Write down pass or fail only, never this PC's addresses or names: the repository is public.
12. **Ask him** before every `git push`, when a shared-code push should go out (outside class time is his call), and whenever rule 10 says so.

### Never

- Never start, stop, or open port 8080, or the preview server `study-site`.
- Never `git push` without his word in that chat. Never force-push, amend a pushed commit, or start the workflow by hand.
- Never `git add -A` or `git add .`, and never stash, reset, restore, clean, or switch branches. Never touch a changed file that is not yours.
- Never write a command, task, output, or question that could pass for content. Never copy anything from `tools/test-data` into `data/`, and never copy content (a question, a card, a command, a pack) into `tools/test-data`. The five `exams.json` files there are the one thing made from `data/`.
- Never put a file under `data/`, and never add `commandUnits` to `data/exams.json`, before the switch push of 1d.
- Never edit `assets/js/pages/practice.js`, `loadExamContent`, or `contentAvailable`.
- Never edit rule 6 of the handoff or the guide's flashcard section.
- Never run a Windows line that changes this PC: `ipconfig /release`, `/renew`, `/flushdns`, or `/registerdns`, `arp -d`, `arp -s`, a `route` or `netsh` line that changes a setting, anything that asks for an administrator, or a pasted `C:\>` line. Never install Node, Python, or anything else on this PC.
- Never commit the planning notes.
- Never start the next push.

### The pushes, one by one

#### 1a push 2. The matcher and its test lines, alone

Files: `assets/js/lib/command-match.js` (new), `tools/command-cases.json` (new), `assets/js/lib/validate-core.js` (the hook, and the line `formatReport` prints), `tools/validate.js` (one line on the content check page), `schemas/command-pack.schema.json` (`alsoWorks`), the example pack `tools/test-data/ready/network-plus/commands/unit-99.json` and its copy in `tools/test-data/preview/`, `tools/test-data/README.md`, and `CLAUDE.md` (the matcher rule). Notes to read: `planners\matcher\matcher-notes.txt`, `matcher-sketch.js`, `command-cases.draft.json`, `run-cases.js`, and `planners\out\matcher-spec.txt`. Nothing else is needed.

1. Run the draft as it stands: in `planners\matcher`, `cscript //nologo run-cases.js` prints 373 rows, 0 failed. After the port that runner is no longer the test. The ported module can only be run in the content check on port 8081 and on GitHub, because this PC has no Node.
2. Port the sketch to `assets/js/lib/command-match.js`: an ES module with no page code, no import, no `?.`, no `??`, and no lookbehind. Export what section 4 of `matcher-notes.txt` lists, and write the parts the sketch does not have: `specFromItem(item)`, `givenTargets(task, lines)` (127.0.0.1 and localhost are never given), `matchLine(item, raw, ctx)`, `isCommandLine(text)`, and `promptFor(system)`. The case table calls `matchSpec(spec, raw, ctx)`. `buildContext(specs)` takes specs, as in the sketch: the hook passes the table's sets, and a caller that holds commands passes them through `specFromItem` first. The page will call `matchLine(item, raw, ctx)`, which is `matchSpec(specFromItem(item), raw, ctx)`. A spec is `{ system, groups, given, alsoWorks }`. A result is `{ verdict, code, counts, keepLine, typed, group, line, exact, word, runsOn }`. `verdict` is accepted, miss, slip, or ignored. `wrong-command` is a code under miss, and only it carries `runsOn`. The matcher's version number stays 1.
3. Add the one table of words, `VERDICTS`: for each code its label, whether it counts a try, and whether the line stays in the field. All of it: `accepted` Accepted, no, no. `wrong-command` Wrong command, yes, no. `wrong-details` Right command, wrong details, yes, yes. `wrong-address` Wrong address, no, yes. `wrong-name` Wrong host name, no, yes. `address-missing` Address missing, no, yes. `name-missing` Host name missing, no, yes. `extra-period` Extra period, no, yes. `not-counted` (new) Not counted, no, yes. `not-in-tool` Not in this tool, no, yes. `not-recognized` Not recognized, no, yes. `ignored-word` Not in this tool, no, no. `empty` no label, no, no. `ignored-word` covers `help`, `?`, `cls`, `clear`, `exit`, and a line that asks a command for help such as `ipconfig /?`. Two more exports make the rest of the words, so the page and the try-a-line box print the same: `systemName(system)` gives Windows, Linux, Router, or Switch, and `wordsFor(result)` gives `{ label, tag }`. The label is the table's, with a colon and the typed word, the word cut at 20 characters, added for `not-recognized` (Not recognized: ipconfg). The tag is empty except for a wrong command that belongs to another system, where it reads `ifconfig: Linux`, or `show: Router, Switch` for two systems. No other file holds a label.
4. Add the two rules of section 6 behind `not-counted`. Check them right after Accepted and before any other result is named. The extra-period check tries them too: a line that would be Not counted without the periods at the ends of its words reads Extra period (add a row: `show ip ro.` on the set `router-route`).
5. Turn `command-cases.draft.json` into `tools/command-cases.json`. Copy the file with `cp` in Git Bash, then change it with Edit. Do not retype it, and do not write it with PowerShell, which can change its encoding. Rewrite its `note` line: it is no longer a draft, and it must not point at a folder outside the repository. Keep the evidence mark on every row. A set carries its `alsoWorks` list beside `groups` and `given`.
6. Change the draft rows that the two new rules turn into Not counted: line 345 (`ifconfig -a`, through `alsoWorks` on the set `linux-addr`), line 424 (`show vlan brief`, through `alsoWorks` on the set `switch-vlan`), and lines 399, 400, 416, 426, and 427 (`show ip ro`, `sh ip ro`, `show ar`, `show vl`, `sh vl br`, by the short-word rule). Lines 401, 402, and 428 (`show ip`, `show`) stay Right command, wrong details. Rewrite the `why` of every changed row. Add rows that prove: a one-letter beginning still costs a try (`show ip r`); a longer word still costs a try (`show vlans`, already there); an `alsoWorks` line of one set is not free on another set; `givenTargets` and `isCommandLine` each have rows. Those two do not fit the `cases` shape (a set, a typed line, and the code it must get), so the table gets two more lists beside `sets` and `cases`: `given`, with rows of `task`, `lines`, and the list `want`, and `commandLines`, with rows of `t` and `want` (true or false). Each row has `why` and `ev` like the others. The hook runs all three lists and counts them in its one line. Other rows that charge a try for a working line the reading does not teach (`ping -n 4`, `route print -4`, `netstat -an` on the `-a` set, `traceroute -n`, `ip -4 addr`) stay as they are: such a line becomes Not counted only when the blind command check adds it to a real command's `alsoWorks`.
7. Add `alsoWorks` to the `command` properties of the schema: an optional list with no repeats, each line a string of 1 to 36 characters. Give the example command `n-u99-c001` the list `["ipconfig /allcompartments"]` (a real Windows line the example does not accept). Copy the file over its copy in `tools/test-data/preview/`, and add the line to the entry for `n-u99-c001` in `tools/test-data/README.md`. The rule that the list starts empty is for real packs, not for test data or the case table.
8. Add the hook that runs the case table at the top of `validateAll` in `assets/js/lib/validate-core.js`. It reads `tools/command-cases.json` through `readJSON`, so it runs in the browser and on GitHub, and `tools/validate-cli.mjs` needs no edit. A failing row, a set whose own lines fail, a row with no evidence mark, or a version number that differs from the matcher's is an error. Show the result in both places: one line from `formatReport` for GitHub's log, and one line on the content check page (a small edit to `tools/validate.js`), such as Case table: 380 of 380, matcher 1. Nothing else in the content check changes in this push. `tools/quotes.js` imports the same file, so open the quote helper afterward.
9. Add one bullet to the section Command line tool (being built) of `CLAUDE.md`, and change nothing else in that file. The bullet: Every change to the matcher (`assets/js/lib/command-match.js`) or its test lines (`tools/command-cases.json`) is run through the content check on port 8081 (the real packs) and port 8091 (the example pack), pushed alone, and its GitHub run is watched. A note for this push, not for `CLAUDE.md`: the content check reads no command pack yet, so on both ports only the case table runs.
10. Proofs: the checklist "Phase 1a, push 2" and the list Every push. The GitHub run after the `git push` is the first time the matcher runs on Node. On port 8091 the content check reads the same as on port 8081 in this push (no command pack is checked yet), plus the case table line.

Settled for this push, so the builder does not have to choose:

- Before any edit to `assets/js/lib/validate-core.js`, collect the baseline for proof 1a2.12 on port 8081. It cannot be collected afterward.
- Edit the draft rows that step 6 names before adding any line above them: the line numbers go stale as soon as a line is added.
- `matcher-notes.txt` section 4 and `matcher-spec.txt` describe an older call and an older data shape. They lose to step 2 on every point: `buildContext(specs)`, a spec with `alsoWorks`, the code `not-counted`, and outputs in versions.
- The short-word rule compares plain words only. An address, a host name, or a switch must be typed whole.
- An `alsoWorks` line is Not counted only when the typed line is that same line to the matcher. A typed line with a different address goes on through the usual steps.
- A Not counted result carries `line`, the line it matched. It carries `group` only for a short form of an accepted line.
- A wrong command that belongs to another system carries `runsOn`. A wrong command that is only a command the tool asks elsewhere carries none, and its tag is empty.
- `isCommandLine(text)` is true when the first word, exactly as typed in lower case, is in one of the matcher's lists of known commands. A capital first letter means it is not a command line. Its rows use plainly fake texts.
- `givenTargets(task, lines)` splits the task at spaces, drops a period, comma, question mark, exclamation mark, semicolon, colon, or closing bracket at the end of a word, and compares without regard to case. An `@` in front of a server in a line is dropped. 127.0.0.1 and localhost are never given.
- The hook also checks each set's `alsoWorks` lines: plain form, Not counted on their own set, and not the same line as an accepted one.
- The N in the case table line counts the rows of `cases`, `given`, and `commandLines`. An evidence mark must be one of run, doc, rule, gk, or notrun. Everything the runner `run-cases.js` checks for a row (the code, the group, the line, exact, the tag, whether it counts) is checked by the hook too.
- In `validate-core.js` and `tools/validate.js` this push adds only the case table and its line. The other edits Appendix L lists for those two files belong to push 3.
- Proof 1a2.10 searches for `?.` as plain text. A hit inside a comment or a string is not the thing it guards against: reword the comment.

#### 1a push 3. The command checks and the content check panel

Files: `assets/js/lib/command-items.js` (new), `assets/js/lib/validate-core.js` (the command checks and the gate rules), `tools/validate.js` (the Command line panel). No new test pack is committed. Notes to read: `planners\matcher\matcher-notes.txt` sections 4 to 7 (item 11 of section 7 is the old data shape: follow the schema), `planners\out\matcher-tables.txt` (the proofs and the edit map of `validate-core.js`), `planners\out\site-workItems.txt` (the gate rules).

- This push only uses the matcher. If an export it needs is not in `assets/js/lib/command-match.js` as committed (its exports are listed under What the pushes so far settled beyond the plan), stop: a matcher change is a push of its own.
- `command-items.js` reads a command for the page and the check: its partners, the outputs of a version (an `exhibitOf` output is the exhibit of that version's follow-up question; drop the exhibit's first line only when it is the prompt plus a line the same answer group accepts), the follow-up, the weight, and the reference. Weight: a partner based on Practice Tests 6 or 7 counts 3, any other Practice Tests chapter 2, everything else 1. With several partners the highest counts. A command with an `origin` of its own uses that source. Reference: a command with an empty quote shows its partner question's quote when both cite the same section.
- The proofs are Appendix I, read for the frozen shape. V1 means each version has one output for each answer group. V3 is replaced by the schema: one `followUp` in a version. V7 is replaced: a follow-up written in place is an error until phase 3. C9 is split. A task that holds a stored line or a switch is an error. A task that names its command's tool when C9 says it may not is a warning: R4b is the rule for when a task may name the tool, and the check only catches the gross case. A missing partner is an error. A draft partner is a warning. A draft follow-up is an error.
- `alsoWorks` is checked. Each is an error: a line that is not in plain form; a line that is the same line to the matcher as an accepted line of its command or as another `alsoWorks` line; a line that has the shape of a wrong choice of a partner question.
- A source item used twice is an error for commands and follow-ups. Add no new warning between two old questions, and no exhibit-size warning for old questions, in this push.
- Do not move the question checks into a function (the edit map's row for lines 246 to 282). No follow-up is written in place before phase 3, so nothing needs it, and every message for the old packs must stay as it is.
- "Names its system in words" means one of the whole words Windows, Linux, router, or switch, in any case.
- The panel shows only for an exam that has command packs or the field, so port 8081 shows no panel today. Its labels: Command line, Stored lines, Not counted (beside an `alsoWorks` line), Try lines, Try. The box's own fields get short labels of the builder's choice (the command, the system, the stored line, the also-works line), written into this section afterward. Use existing classes. `site.css` does not change. A placeholder command pack counts toward the verdict only where command packs exist, so the verdict on port 8081 does not change.
- Planted-fault proofs: put a throwaway pack in `tools/test-data/rehearsal/network-plus/commands/` with a `manifest.json` that lists it, and open port 8095's content check. Delete that folder again before the commit. Use plainly fake source labels such as TEST SOURCE 1. For a draft partner or a draft follow-up, do not write a file: in the page console, call the check with a reader that marks one question as a draft in memory.
- The report on port 8081 differs from before only by Command line lines.

#### 1b push 0. The bare typing page, for his phones

Files: `typing-trial.html` in the project root, and nothing else. It must pass the page check (the do-not-list tag, the theme script above the stylesheet, the skip link, the opened-from-a-folder notice). It uses `site.css`, no matcher, and no data. Nothing links to it. Notes to read: `planners\page\notes.txt` section 6, only the terminal box's styles and the width arithmetic at 320 px. Use the same font, size, padding, and box width the page will use, written as styles inside this file, because `site.css` has no `cl-` classes yet. The script is inside the file too. It is a small chat.

- On the page: the words TEST PAGE, a box with the prompt `C:\>`, one text field inside a real form with the field settings of checklist 1b2.5, and Run. Any typed line prints back exactly what the field held, then twelve made-up lines of 25 characters, and the field goes away. A button puts the field back.
- It goes out on his word, and the chat stops after the `git push` and the checks of rule 8. He tries it on an iPhone and an Android phone and reports for each: the keyboard opens on a tap; the Go key runs the line; the first letter stays lower case; two hyphens stay two hyphens; two spaces do not become a period; 25 characters fit on one line; what the page does when the field goes away. Write what the phones showed into this section. If he reports in the same chat, write it in then (a commit that holds only this file). If not, the next chat does that first.
- It is the one test page that may sit in the project root for a time. The commit of 1b push 1 deletes it.

#### 1b push 1. The shared parts, hidden

Files: `assets/js/lib/boot.js`, `flashcards.html`, `practice.html`, `commands.html` (new), `assets/js/pages/commands.js` (new, start-up only), `assets/js/pages/home.js`, `assets/css/site.css` (the three-tab header), `CLAUDE.md` (the three sentences in section 2, and the one-day rule for exports and the switch), and the deletion of `typing-trial.html`. Notes to read: `planners\site\site-notes.txt` sections 2 to 5, 10, and 11. This push goes out alone, outside class time.

- Do not start until what his phones showed is written in this section. This push deletes the page he needs for the trial. If it is missing, ask him, write it in as a commit of its own, and then go on.
- `boot.js` owns the tool's name (today line 89 is a two-way choice) and, for the mode `commands` only, the exam choice, the redirect, and showing the third tab, all before any pack loads. On `commands.html`, an address that names an exam without the tool goes to the home page, and no exam named, or an unknown id, means the first live exam that has the tool, or the home page when none has. The flashcards and practice pages choose their exam exactly as today. `boot.js` also exports the Test content banner function (today it takes true or false, line 159). For the mode `commands` it does not draw the banner itself: it hands back whether a flashcard or question pack is a placeholder, so `commands.js` can add the command packs and call the function once.
- The third tab is in the HTML with the `hidden` attribute and is shown when the exam has `commandUnits`. With `?drafts=1` and no field, the flashcards and practice pages may ask `commandState` with `preview`, in a try of its own, to show the tab. Without the flag those two pages ask for nothing new.
- `home.js`: for each exam, `commandState` in a try of its own, falling back on `assumedAvailable(exam).commands`. `contentAvailable` is not touched, and what counts as a live exam does not change. The site notes' sections 1 and 3 are replaced on this point.
- `commands.html` is a copy of `practice.html` with four differences: the title, the script, the current tab, and `data-tabs="3"` on the `html` element, so its header does not move.
- `commands.js` in this push only starts the page: it calls boot, shows the heading Command line with Coming soon when the state is soon, shows the could-not-load notice that names the manifest when it cannot be read, and shows only the heading when the state is ready. The drill comes in push 2.
- The old cached page proof needs no second server: take the third tab link out of `flashcards.html` in the working folder, reload port 8091, confirm there is no script error, and put the line back.
- The regression pass is the checklist's (rule 4 of section 11). The 50 records in the site notes are replaced by it.
- His look at ports 8091 and 8092, and what he said, go into this section. The paint hint for the late tab is not built (Still open).

#### 1b push 2. The page, in two chats

Files: the rest of `assets/js/pages/commands.js` and its parts, `assets/js/lib/command-drill.js`, `assets/css/site.css` (one block of `cl-` classes), the test pack `tools/test-data/ready/network-plus/commands/unit-98.json`, the extra pack `unit-97-extra.json` in `tools/test-data/preview/` only, the two commands manifests that list them, and `tools/test-data/README.md`. One `git push` at the end. Notes to read: `planners\page\notes.txt`, with care. It was written before the shape was frozen. Still good: the DOM outline, the focus, keyboard, and scroll rules, the width arithmetic, and the map of `practice.js` (find places by their words: the line numbers have moved). Replaced: its data shape, its matcher call (`judge()`), labels kept in `commands.js`, its class names (every new class starts with `cl-`), test items under `data/`, the page doing the redirect, a version known by its place, and its saved format.

- **Part 1 (first chat).** The page's test commands in `tools/test-data/ready/network-plus/commands/unit-98.json` (plainly fake, listed in that manifest). Its ids use unit 98 (`n-u98-c001`, `n-u98-v001`) and the extra pack's use unit 97. For the weights, give three of the test commands a flashcard partner and an `origin` whose `basedOn` reads Practice Tests 6 TEST, Practice Tests 5 TEST, and TEST SOURCE, so no real question is tied to a fake command. Update `tools/test-data/README.md`: the two new files, and that test ids use units 97 to 99. It holds: a 12 by 25 output, two answer groups, an empty output, an address in the task, a draft, weights 3, 2, and 1, a tag in a text, and a Linux command with `alsoWorks`. An extra pack `unit-97-extra.json` (`"set": "extra"`) in `tools/test-data/preview/` only, listed in that manifest. Then `assets/js/lib/command-drill.js` (the draw, the version pick, grading a saved answer), the setup screen, the terminal box and the command screen, the saved drill and resume, and the `cl-` styles, with their proofs. Commit it as `Command line 1b push 2 (part 1)`. No `git push`.
- **Part 2 (second chat).** The question step, results, review, Retry missed, Extra commands, and the Test content banner (call the function boot exports once, with one yes or no worked out from the flashcard, question, and command packs together). Then the whole checklist and the regression pass, the commit, and the `git push` on his word.
- The saved drill keeps the version by its id. The rest of its format is the builder's.
- On a preview with no `commandUnits`, setup lists only the units that have commands.
- Version pick: a new drill shows a version other than the last one shown for that command on this device, when there is one. Retry missed shows the same version when the question was the part missed, and another one otherwise.
- Labels are Appendix F with these fixes: Wrong host name and Host name missing; Not counted; Command: ipconfig for the second block after a follow-up; Not in this tool for a help line; Extra commands is a check box row, greyed with a Coming soon chip while empty; the score reads 8 of 10 commands, 6 on the first try, 2 of 3 questions; the review tags are Right, Missed, Question missed, and Not answered; the top button reads Quit before the first answer and End drill after.
- Extra commands: the Coming soon half is proved on port 8091, and the switched-on half on port 8094 with `?drafts=1`.
- Proof fixes: for 1b2.14, set the saved last-shown version first, so the version with the follow-up shows. For 1b2.13, a made-up key press does not submit a form: call the handler twice inside the guard's time instead, and leave the held key to the phone trial.
- Touch: set the browser pane to the mobile size or to 320 by 568, reload, and confirm in the console that `matchMedia('(hover: none) and (pointer: coarse)')` matches. Proofs that need a real keyboard on a phone wait for his trial: list them for him.
- Write what was seen (the two greens on the Network+ theme, the heights at 320 by 568) into this section.

#### 1c push 1. The rules and the docs

- First show him, in the chat, the rule sentences as they will be written: Appendix E with the fixes of section 9. Wait for his yes. Then write them.
- Files: `docs/CONTENT-GUIDE.md` (the new section A command, with R1, R2, R4a to R4i, R9, R10, R12, and the `alsoWorks` sentence), `docs/content-kit/brief-write.md` line 20 (R11), `docs/CONTENT-NOTES.md` (a Command line entry: for Units 4.0 to 6.0 the rows of Appendix A with their partner ids, lines, and flags, the two source items for the card commands, and the follow-ups of section 3 only), and, from the rows of Appendix L marked 1c, only `docs/PLAN.md`, `docs/CONTENT-GUIDE.md`, `README.md` lines 31 to 37, and `package.json`. The rows for `CLAUDE.md`, `docs/CONTENT-HANDOFF.md`, and `docs/content-kit/` belong to push 2. The numbers in Appendix E are the ones to use. Find each place by its words: the line numbers have moved. Take out the paragraph near the top of the guide that says commands are not in it yet, and reword the line near the top of `docs/PLAN.md` that says it does not describe the tool. Copying the rows of Appendix A into the notes is not writing commands: the content chat still writes every task, output, and pack.
- The guide says which is which: R4b is the rule for naming the tool, and the content check only warns on the gross case.
- Leave out R4h's versions pack and R4g's last two sentences. Leave the preview address out of `README.md` until 1d. Leave true code comments alone (the comment in `content.js` that says both study modes exist is right).

#### 1c push 2. The kit and the handoff

- The kit at its smallest: a commands mode in `assemble.ps1` with no rewrite of the question rules; the used-source list also reads command packs (near line 98), and the commands mode still reads the same unit's question pack for partners and used sources (the loop near line 94 skips the same unit today); the blind copies in `strip-for-check.ps1` (the command check sees only the task and the system; the follow-up key check sees the question with the output it will be shown under); the commands pair in `check-copy.ps1`; a new `brief-commands.md` that carries only the follow-ups of section 3; two checks in `brief-review.md`; the kit README; `CLAUDE.md` (line 10: the content chat also writes commands), and the Appendix L rows for `docs/CONTENT-HANDOFF.md` and `docs/content-kit/`. Nothing for phase 3. Notes to read: `planners\content\content-plan-notes.txt` sections 6 and 7 and `planners\out\content-tables.txt` (Kit changes, Content run). They lose to this section on two points: no rewrite of the question rules, and ids are not numbered in draft order. The shape of a command draft is yours to set: write it into `brief-commands.md` and the kit README, and record it in this section.
- Ids must hold on a rebuild of the trial pack: a command keeps its id, and a dropped id is never used again. A way to do it: key each command by its first partner id (or its source item), read the existing pack and keep its ids, and keep the highest command and version numbers ever used in the pack header. Add those header fields to the schema if you use them.
- The handoff: R3, R5 (ids stay with their commands), R7 (two new `git grep` lines: `typedFormOf` in six files, and for the matcher a word its three files already hold, so the matcher is never edited for it; add a word for `check-copy.ps1` to the kit line), R8, and the new section A Command line pass (R6). Its steps are the Content run table in `planners\out\content-tables.txt`, with seven `git grep` lines and the name try-a-line box. It also says: a pass skips the unit pick and `extract-aids.ps1`; give a usage estimate first (about 1.5 to 2 points for the Unit 4.0 trial, 4 to 6 for the whole launch set); start from the Command line entry in `docs/CONTENT-NOTES.md`; list every line the blind check typed that needs a test row or an `alsoWorks` entry; do not push the trial until the page has been published for a day; no card for a next unit after the trial; no edits to `README.md` or `docs/PLAN.md` until 1d.
- No Network+ unit run while the kit is being changed.

#### The trial, his phones, and the fix chat

He starts the content chat with the handoff and one line: This is a Command line pass for Network+ Unit 4.0. It writes nine commands, pushed with the tool off. He opens `commands.html?exam=network-plus&drafts=1` on the published site on an iPhone and an Android phone. One website chat then fixes what the phones showed and adds test rows for what the blind check typed.

#### 1d. The rest of the content, then the switch

The content chat writes Units 5.0 and 6.0 (sixteen commands), pushed with the tool off. He looks with `?drafts=1`. Run the content check on port 8095, where the field sits over the real packs. Then the switch, as a push of its own, at least a day after the last code push: `commandUnits` in `data/exams.json` (make the five test copies again), the preview address in `README.md`, and the status lines of the docs.

### The planning notes

They are outside the repository, on this PC, in `%USERPROFILE%\.claude\projects\C--CompTIA-Website\command-line-plan\`. Reading them may ask him for permission once.

- `planners\site\site-notes.txt`, `planners\page\notes.txt`, `planners\matcher\matcher-notes.txt`, `planners\content\content-plan-notes.txt`: each area in full.
- `planners\matcher\matcher-sketch.js`, `command-cases.draft.json`, `run-cases.js`: the working sketch, its 373 rows, and the runner.
- `planners\out\`: every planner's work items, checks, tables, and sizes, and the two critics' issues.
- `design\` and `research\`: older than the plan, and they lose to it. Open them only when the plan and a planner's notes leave a question open.

The notes were written before the build. Their line numbers are from commit `ddf9d48`: find a place by its words. The matcher planner split 1a into two pushes: its first push is this plan's push 2, and its second push is this plan's push 3 (its loader and schema items were done in push 1). Checks in the notes that use `data/network-plus/commands/private` are replaced by the checklists.

They are never committed and never copied into the repository, with the two exceptions that 1a push 2 makes: the sketch is ported to `assets/js/lib/command-match.js`, and the draft rows become `tools/command-cases.json`.

### What only Mr. Flauto can do

- Give the word for each `git push`. The shared-code push (1b push 1) goes out outside class time.
- Try the bare typing page, and later the Unit 4.0 trial, on an iPhone and an Android phone.
- Look at ports 8091 and 8092 on this PC during 1b: the home card row and the header.
- Read the rule sentences before they go into the guide (1c push 1).
- Start the content chat for Unit 4.0, and later for Units 5.0 and 6.0, with the handoff and one line that names the pass.
- Look at the seven Linux and device outputs nobody can run, and at any Linux or device line proposed for `alsoWorks`.
- Add quotes for the paired questions (27, and the four follow-up questions).
- Give the word to switch the tool on.

### Still open, for him to settle when he sees them

- The label Not counted.
- The third tab appearing late on the Network+ Flashcards and Practice test pages: leave it, add the small fix, or one phone header for every exam.
- `route print` with the follow-up n-u05-q070.
- Whether `arp -s` stays after the phone trial.
- What may go into `alsoWorks`, and who decides that a Linux or device line is real (section 9).
- Phase 3: whether later output versions go in a pack of their own.

## Appendices: the planners' tables

These are the planners' own words. Sections 1 to 11 and section 14 win where they differ. Known differences: test items go in `tools/test-data`, not in a private folder under `data/`; the matcher's call is `matchLine()`; outputs sit in `versions`, not in answer groups, and each version holds its own `followUp` (rows C4, V1, and V3 of Appendix I, and the wording of R4f and R4g, use the older shape: follow the schema, the checklists, and section 14, 1a push 3); a line a real system would run that the tool does not hold costs no try and reads Not counted (Appendices F, G, H, and I do not have it: follow section 6); every line that asks for help, and `cls`, `clear`, and `exit`, prints Not in this tool (Appendix G says they print nothing: follow section 14, 1a push 2, step 3); Appendix F shows Extra commands as a button, and section 7 makes it a check box row; the follow-up set is the four questions in section 3; later output versions and the versions pack are not decided. Appendix L's line numbers are from before the build, and every file it names has moved since (its `CLAUDE.md` lines 36 to 38 are lines 46 to 48 today), so match by the words. Its rows marked 1a are done, except `validate-core.js` and `tools/validate.js`. Its row for `README.md` lines 19 to 23 (the preview address and the fixture server) belongs to 1d, not 1c.

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

