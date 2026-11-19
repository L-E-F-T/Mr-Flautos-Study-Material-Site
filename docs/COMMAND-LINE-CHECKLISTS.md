# Command line: acceptance checklists

One list for each phase and push of `docs/COMMAND-LINE-PLAN.md`. A push is ready when every line of its list is true and the proof has been run and reported. The lists are the four planners' checks merged into one, with the two critics' corrections and section 11 of the plan. Where two planners disagreed, the critics' pick is used (last section).

Each line says what must be true, then how to prove it.

## Where proofs run

| Port | Server (`.claude/launch.json`) | Serves |
|---|---|---|
| 8080 | `study-site` | His copy. No chat starts it, stops it, opens it, or clears or seeds what it has saved. |
| 8081 to 8085 | `study-site-test` | The real files. Regression checks and the content check. |
| 8091 | `study-site-fixture` | Test data: Network+ has `commandUnits` and the example pack (Ready). |
| 8092 | `study-site-fixture` | Test data: the field and no packs (Coming soon). |
| 8093 | `study-site-fixture` | Test data: the field and a commands manifest that cannot be read. |
| 8094 | `study-site-fixture` | Test data: no field, and the example pack (the `?drafts=1` preview). |
| 8095 | `study-site-fixture` | Test data: the field over the real packs (launch rehearsal). |

## Every push

| # | Must be true | How to prove it |
|---|---|---|
| E1 | Port 8080 was never started, stopped, or opened, and nothing saved on it was cleared or seeded. | The session's commands and addresses name no port 8080. |
| E2 | No test data is under `data/`, not even in a `private/` folder. Test items are plainly fake and stay in `tools/test-data`. | `git status --short -- data` lists only what the push means to change. Read the test items: every task, output, and title says TEST. |
| E3 | A website chat wrote no command, task, output, or question that could pass for content. | Read the diff. Real content appears only in commits made by the content chat. |
| E4 | `data/exams.json` has no `commandUnits` until the switch push of phase 1d. | `git grep -n commandUnits -- data` prints nothing. |
| E5 | Only the planned files changed. | `git status --short` and `git diff --stat` match the file list of the push. |
| E6 | The session ends with a commit. Nothing is pushed without his word. | `git status --short` is empty after the commit. `git status -sb` shows the commit ahead of `origin/main` until he says push. |
| E7 | After a push, GitHub checked and published it. | `gh run watch` shows Check content and Deploy green. The published pages open with no error in the browser console. |
| E8 | New code is on the published site at least a day before data or pages that need it. The switch goes out at least a day after the last code push. | `git log --date=iso` on the two commits. |
| E9 | A push that changes shared code (`content.js`, `boot.js`, `home.js`, a page shell, `site.css`) has the regression pass before and after it. | Rule 4 of the plan: the home, flashcards, and practice pages for both live exams at 320, 640, and 1100 px, plus a dark spot check. The whole content check report compared, not only its counts. A deck and a test saved before and resumed after. No errors in the browser console. `tools/quotes.html` still opens. |
| E10 | Every new CSS selector matches nothing on the finished pages. | On each finished page and screen, `document.querySelectorAll(selector).length` is 0 for every new selector. Run it again after the last CSS edit of the phase. |

## Phase 0. Freeze the shape

| # | Must be true | How to prove it |
|---|---|---|
| 0.1 | He answered questions A to D. | Section 2 of the plan records the four answers and their date. |
| 0.2 | `schemas/command-pack.schema.json` is the shape of section 4 of the plan, field for field. | Read the two side by side: `pack` with `set`, `commands`, `id`, `typedFormOf` (always a list), `origin`, `system` (four values), `task`, `accept` (one to three groups, lines only), `versions` (one to three, each with an id, outputs, and at most one `followUp`), an output that is `text` or `exhibitOf`, `followUp` as `{ "question": id }`, `objectives`, `units`, `reference`. No weight field. |
| 0.3 | The plan's own example in section 4 passes the schema. | Check it against the schema in an editor or with a JSON Schema checker: no problem reported. |
| 0.4 | The schema refuses the shapes the plan rules out. | Each of these is reported: `typedFormOf` as one id; outputs inside an answer group; an output with both `text` and `exhibitOf`; a `followUp` written in place; `set` on a command; a fourth answer group; a fourth version; an output line of 26 characters; an output of 13 lines; a stored line of 37 characters; a command with neither `typedFormOf` nor `origin`; a misspelled field. |
| 0.5 | One example pack shows every part of the shape. | `tools/test-data/ready/network-plus/commands/unit-99.json` has a command with two answer groups and two versions, one output that is `text`, one that is `exhibitOf`, and a `followUp`. A second command has a flashcard partner and an `origin`. |
| 0.6 | The example's `followUp` names a real published Network+ question that has a text exhibit. | `git grep -n '"id": "n-u04-q054"' -- data/network-plus/questions` finds it. The question has an `exhibit` of type text and no `"status": "draft"`. |
| 0.7 | The example is plainly fake. | Its tasks read TEST ITEM and its outputs read TEST OUTPUT. Its ids use unit 99, which no real unit has. |
| 0.8 | The example passes the schema, and its manifest lists it. | No problem reported for `unit-99.json`. `manifest.json` beside it has `"packs": ["unit-99.json"]`. |
| 0.9 | Every JSON file written parses. | PowerShell `ConvertFrom-Json` on each file. |
| 0.10 | One merged checklist exists for each phase and push. | This file has a list for 0, 1a push 1, 2, and 3, 1b push 1 and 2, 1c, and 1d. |
| 0.11 | The shape is committed before any code is built on it (rule 1 of the plan). | `git log --stat` shows the schema, the example pack with its manifest, and this file committed before, or apart from, the first code commit. |

## Phase 1a, push 1. The test server, the deploy change, the loader

Files: `tools/serve.ps1`, `.claude/launch.json`, `tools/test-data/`, `.github/workflows/pages.yml`, `assets/js/lib/content.js`, `schemas/exams.schema.json`, `.vscode/settings.json`, `CLAUDE.md`.

| # | Must be true | How to prove it |
|---|---|---|
| 1a1.1 | `tools/serve.ps1` still parses. | `[System.Management.Automation.Language.Parser]::ParseFile` on the file reports no errors in Windows PowerShell 5.1. |
| 1a1.2 | A server started without `-DataOverlays` behaves exactly as before. | Before the edit, record the status, headers, length, and hash of every file under `data/`, `assets/`, `tools/`, and `schemas/` on ports 8081 to 8085, plus a missing file, a folder, a HEAD, and a POST. Restart `study-site-test` after the edit and record again. Every record matches, apart from files the push edits or adds. No answer carries `X-Test-Data`. |
| 1a1.3 | Test data can be served only on ports 8091 to 8095. | Start the script with a pair for port 8081, for port 8080, for a folder that does not exist, and with no folder: each time it prints the reason and exits with 1 before it listens. |
| 1a1.4 | A fixture server never takes the default port by accident. | Start the script with `-DataOverlays` and no `-Port`: it listens on its first test port and not on 8080. Stop it. |
| 1a1.5 | The fixture server starts by its name and each port serves its own folder. | Start `study-site-fixture`. Its first lines list the five folders. On each port, `data/exams.json` carries the header `X-Test-Data` with that port's folder and its bytes equal the test file. A file the folder does not hold (`data/network-plus/questions/manifest.json`, `assets/css/site.css`) is the real file. |
| 1a1.6 | The real-data ports cannot be made to serve test data. | A request sent to port 8081 with a Host header that names port 8091 still gets the real `data/exams.json`. |
| 1a1.7 | Each fixture port is the state its row says. | In the page console on each port, import `assets/js/lib/content.js` and call `commandState` for Network+: `ready` on 8091, `soon` on 8092, an error that names `commands/manifest.json` on 8093, `none` on 8094 and `ready` there with `preview: true`, `soon` on 8095 until real packs exist. A+ Core 1 is `none` on every port. |
| 1a1.8 | The example pack loads through the new loader. | On ports 8091 and 8094, `loadCommandPacks` then `commandsFromPacks` give `n-u99-c001` and `n-u99-c002`, each with `_set` `launch`, its `_pack`, and its `_visibility`. Its partner ids and its follow-up id are found in the real question and flashcard packs loaded on the same port. |
| 1a1.9 | The gate helpers give the right answer in every branch. | In the page console, with readers made on the spot: `commandUnits({})` is null and `commandUnits({ commandUnits: ['4.0'] })` is the list. `commandState` is `none` with no field and never calls the reader; `soon` with the field and no pack; `ready` with a pack listed; `ready` with `preview: true`, no field, and a pack; `soon` for an exam with the field and no folder, with no request; and it throws when the manifest cannot be read. `assumedAvailable` gives `commands: 'none'` without the field and `'ready'` with it. |
| 1a1.10 | The loader stamps the extra set and skips a pack with no `commands` list. | With a reader made on the spot: a pack marked `"set": "extra"` gives commands with `_set` `extra`; a pack with no `set` gives `launch`; a listed pack with no `commands` list gives no command and no error; a missing commands folder gives an empty list; a lab-only pack is left out with `includePrivate: false`. |
| 1a1.11 | No existing function changed its behavior. | `git diff -- assets/js/lib/content.js` shows added lines only. `loadExamContent` still returns its five keys and `contentAvailable` its two answers, and neither asks for anything under `commands/`. |
| 1a1.12 | The content check report is the same as before. | On `http://localhost:8081/tools/validate.html`, save the whole report text before the first edit of `content.js` and again after, with every list opened. The two texts are identical. |
| 1a1.13 | The finished pages load as before and ask for nothing new. | On port 8081: `index.html`, and `flashcards.html` and `practice.html` for `?exam=a-plus-core-1` and `?exam=network-plus`. Each draws, with no script error in the console. The only console lines are the browser's own notes for the lab-only manifests a local page asks for, the same as before the edit. No request has `/commands/` in its address. |
| 1a1.14 | The quote helper still opens. | `http://localhost:8081/tools/quotes.html` draws with no error in the console. |
| 1a1.15 | The rest of rule 4 holds for `content.js`. | Compare with a copy of the site as it was before the edit, served on a spare port: the layout records of the five pages at 320, 640, and 1100 px in one theme, plus a spot check in the other theme, are the same number for number. A deck and a test saved with the code as it was are resumed with the edited `content.js`. |
| 1a1.16 | Nothing imports the new exports yet. | `git grep -l -e commandUnits -e commandState -e assumedAvailable -e loadCommandPacks -e commandsFromPacks -- assets tools/*.js tools/*.mjs` lists only `assets/js/lib/content.js`. |
| 1a1.17 | The deploy publishes every page in the project root, and the same files as before. | Run the lines of the Assemble site step by hand with a scratch folder in place of `_site`: it holds the root pages, `assets`, and `data`, and nothing from `tools/`, `schemas/`, or `docs/`. It equals what the old copy line gives. |
| 1a1.18 | The page check passes on every root page and reports each fault. | Run the lines of the Check the pages step in Git Bash from the project folder: every root page is named and the exit code is 0. Run them in a scratch folder on copies with one fault each (no noindex tag, the theme script under the stylesheet, no skip link, no opened-from-a-folder notice): each is reported and the exit code is 1. |
| 1a1.19 | `schemas/exams.schema.json` knows the optional `commandUnits`. | The real registry and the five test registries pass. An empty list, a lesson id, and a repeated unit are reported. |
| 1a1.20 | The editor maps command packs to the new schema. | `.vscode/settings.json` has one entry for `schemas/command-pack.schema.json` that covers `data/*/commands/*.json` and the packs in `tools/test-data`, and leaves the manifests out. |
| 1a1.21 | The test registries are the real one plus the field. | `diff data/exams.json tools/test-data/ready/exams.json` shows the `$schema` line and one added `commandUnits` line. The copy in `preview/` differs in the `$schema` line only. The other three equal the one in `ready/`. The example pack in `preview/` is the same file as the one in `ready/`. |
| 1a1.22 | `CLAUDE.md` names the fixture ports and says test data is fake, is never content, and is never copied into a pack. Nothing else in it changed. | `git diff --stat -- CLAUDE.md` shows one added line. |
| 1a1.23 | Every JSON file written parses, and the broken manifest does not. | PowerShell `ConvertFrom-Json` on each. `tools/test-data/broken/network-plus/commands/manifest.json` must fail: that is its job. |
| 1a1.24 | After the push, GitHub ran the new step and the site is unchanged. | `gh run watch` is green, and the log of Check the pages names the three root pages. The three published pages open as before, and nothing new is linked or shown. |

## Phase 1a, push 2. The matcher and its test lines, alone

Files: `assets/js/lib/command-match.js`, `tools/command-cases.json`, and the hook in `assets/js/lib/validate-core.js` that runs the table.

| # | Must be true | How to prove it |
|---|---|---|
| 1a2.1 | The planner's sketch and its 373 test rows are in the repository as real files. | `tools/command-cases.json` holds at least 373 rows. No file in the repository points at a folder outside it. |
| 1a2.2 | The case table passes in the browser. | `http://localhost:8081/tools/validate.html` shows 0 errors and one line for the table, such as Case table: 373 of 373, with the matcher's version. |
| 1a2.3 | The table and the matcher carry the same version number. | Change the number in one of the two in the working tree: the content check reports an error. Undo it. |
| 1a2.4 | The gate bites. | Change one expected code in `tools/command-cases.json` in the working tree and press Recheck: the page says Errors block publishing and names the row. Undo it, and `git status --short` no longer lists the file. |
| 1a2.5 | The matcher answers in the agreed form. | `matchLine()` returns accepted, miss, slip, ignored, or wrong-command with the systems that command runs on. Every result in Appendix G of the plan (What the box prints) appears at least once among the test rows. |
| 1a2.6 | The words for each result live in one table in the matcher file, with the label fixes of section 7. | The table reads Wrong host name and Host name missing, not Wrong name. A line that asks for help gives Not in this tool. No other file holds a label. |
| 1a2.7 | Every rule has a test line, refusals included, and every row says how it is known. | Each row has its evidence mark: run on this PC, a manual or source file, a rule, general knowledge, or never run. The count of rows with no mark is 0. |
| 1a2.8 | No Windows rule was added on a guess. | Every Windows rule has at least one row marked run on this PC. The exceptions are `arp -d` and `arp -s`, which the plan lists as never run. |
| 1a2.9 | Each test set's own stored lines are plain, accepted by themselves, and distinct. | The content check reports no error for any set. Add a stored line in capitals to one set in the working tree: an error. Undo it. |
| 1a2.10 | The matcher is plain code an old phone can load. | The file has no import, no DOM use, and no fetch. It has no optional chaining and no regex lookbehind: `git grep -n -F -e "?." -e "(?<" -- assets/js/lib/command-match.js` prints nothing. A typed line that reads `constructor` or `__proto__` has a row and gets Not recognized. |
| 1a2.11 | A line a real system would run but the tool does not hold costs no try. | Rows for `show ip ro`, `ifconfig -a`, and `show vlan brief` give a slip, not a miss. |
| 1a2.12 | The content check report for existing content is the same as before. | Save the whole report on port 8081 before and after. The only difference is the new line for the case table. |
| 1a2.13 | The quote helper still opens. | `http://localhost:8081/tools/quotes.html` draws with no error in the console. It imports the same check code. |
| 1a2.14 | Nothing a student loads imports the matcher yet. | `git grep -l command-match -- "*.html" assets/js/pages` prints nothing. |
| 1a2.15 | File names in imports match the files letter for letter, capitals included. | Compare each import path in the new files with `git ls-files`. GitHub's runner tells capitals apart and Windows does not. |
| 1a2.16 | The push holds the matcher, its table, and the hook, and nothing else. | `git show --stat` lists those files only. |
| 1a2.17 | GitHub ran the table on its own Node and published nothing new. | After the push: `gh run list --limit 1` is green. `gh run view --log` shows the case table line in the Check content step. The published site has no new page and no new link. |
| 1a2.18 | From now on every change to the matcher or its test lines is run against every pack on the test port, pushed alone, and watched (rule 6 of the plan). | The rule is written in `CLAUDE.md` with this push or the next. |

## Phase 1a, push 3. The command checks and the content check panel

Files: `assets/js/lib/command-items.js`, `assets/js/lib/validate-core.js`, `tools/validate.js`, and test packs in `tools/test-data`.

| # | Must be true | How to prove it |
|---|---|---|
| 1a3.1 | The frozen example pack passes the new checks. | `http://localhost:8091/tools/validate.html` lists the test pack with its placeholder warning and no error from it. If a check refuses the example, settle which of the two is wrong before the push. |
| 1a3.2 | Each proof fires. | Put a throwaway pack with one planted fault per command in a test folder (in `tools/test-data` or a scratch folder, never under `data/`), serve it on a fixture port, and open that port's content check. Each fault is reported once, with its command id: a stored line in capitals; a stored line of 37 characters; two stored lines that are the same line to the matcher; a fourth answer group; an address in a stored line that the task does not print; a task with no system word; a task that holds a stored line; a line with the shape of a wrong choice of its partner question; an output line of 26 characters; an output of 13 lines; a tab in an output; an em dash in an output; an id that a question already uses; a `typedFormOf` id that does not exist; a question listed by two commands; `origin` on a command whose partner is a question; no `origin` on a command whose partner is a flashcard; a source item that a command and another item both use; a command in a pack marked extra that has `typedFormOf`; a command with neither `typedFormOf` nor `origin`. |
| 1a3.3 | A missing partner blocks publishing. | A `typedFormOf` id that no question or card has is an error, not a warning. A partner that is a draft is a warning. |
| 1a3.4 | Warnings stay warnings. | In the same throwaway pack: an unknown field (a misspelled `typedFormOf`, a `refuse` list), a task of three sentences, `TTL=` in a ping output, and two versions with the same right answer each give a warning and no error. `sections` on an answer group gives nothing: only the kit reads it. |
| 1a3.5 | Version and follow-up faults are caught. | Each is an error: a version with fewer outputs than the command has answer groups; an output with both `text` and `exhibitOf`; `exhibitOf` that is not the version's own follow-up question; a follow-up question with no text exhibit; a follow-up question that is a draft or is not in this exam; a follow-up whose right answer is a line the command accepts (`n-u04-q037` after an `arp -a` command); one question used as a follow-up twice; a follow-up written in place. |
| 1a3.6 | A reused exhibit prints cleanly, by one shared rule. | For the example command, the output read through `command-items.js` is the exhibit of `n-u04-q054` without its first line, because that line is the prompt and a line of the same answer group. An exhibit whose first line is not such a line keeps it. What is printed passes the 12 by 25 limit. |
| 1a3.7 | The gate field is checked. | `commandUnits` that is empty, repeats a unit, or names a unit `units.json` does not have: an error. The field with no pack listed: a warning (port 8092). Packs listed with no field: a warning that the tool is switched off (port 8094). A command tagged to a unit the list leaves out: an error. |
| 1a3.8 | A broken commands folder is reported without hiding the rest of the exam. | `http://localhost:8093/tools/validate.html` shows one error that names `commands/manifest.json` and still reports the questions and flashcards of Network+. |
| 1a3.9 | A listed pack with no `commands` list cannot go by unseen. | List one in a throwaway manifest: the content check reports it as an error, and the pages skip it. |
| 1a3.10 | The check reads every live exam's commands folder, field or not. | With the trial pack still to come, port 8081 reports no commands and no error. Port 8094 has no field and its pack is still checked. |
| 1a3.11 | Pack rules apply to command packs unchanged. | A command pack with `"reviewed": false` warns. A pack listed in the lab-only manifest but stored outside `private/` is an error. A placeholder pack warns and asks for no quote. |
| 1a3.12 | The Command line panel is the review sheet. | On port 8091 the panel shows the counts of commands, versions, follow-ups, and extra commands, and every stored line once, under its system, with its command id, group, section, and where its weight comes from. On port 8081, with no pack, the panel shows no commands and no error. |
| 1a3.13 | The try-a-line box gives the right verdicts, many lines at a time. | With no command picked: system Windows, stored line `ipconfig /all`. Paste six lines: `IPCONFIG -ALL`, `ipconfig all`, `ipconfig /all` with a period, `ifconfig`, `getmac`, `ipconfg`. Read one row for each: Accepted; Right command, wrong details (a try); Extra period (no try); Wrong command with `ifconfig: Linux` (a try); Not in this tool (no try); Not recognized: ipconfg (no try). |
| 1a3.14 | The page and the check read a command through one module. | `validate-core.js` imports `command-items.js` for partners, outputs, follow-ups, and weights. No weight is stored in any pack. |
| 1a3.15 | Nothing else moved. | On port 8081 the whole report, saved before and after, differs only in the new Command line lines. The question and flashcard counts of both exams are the same. |
| 1a3.16 | The panel works on a phone. | At 320 px wide the content check page does not scroll sideways, in light and in dark. Its labels are short and it has no how-to text. |
| 1a3.17 | Test data never reaches the real check. | The report on port 8081 names no `n-u99` id. `git status --short -- data` prints nothing. |
| 1a3.18 | The same code passes on GitHub. | After the push the run is green. |

## Phase 1b, push 1. The shared parts, hidden

Files: `assets/js/lib/boot.js`, `flashcards.html`, `practice.html`, `commands.html` (the shell), `assets/js/pages/home.js`, `assets/css/site.css` (the three-tab header), `CLAUDE.md`. First of all, a bare test page with only the typing box. Pushed alone, outside class time, at least a day after phase 1a is on the published site.

| # | Must be true | How to prove it |
|---|---|---|
| 1b1.1 | The bare test page is tried on his phones before the page is built around the box. | A page with only the typing box and one made-up line is published at an address nothing links to. It passes the page check. He tries it on an iPhone and an Android phone, and what the phones showed is written down: the keyboard, the Go key, the first letter, two hyphens, a period, the 25 characters, and the scroll when the field goes away. |
| 1b1.2 | The bare test page is deleted when the trial is done. | `ls *.html` in Git Bash from the project folder lists `index.html`, `flashcards.html`, `practice.html`, and `commands.html` only. After the next push the test page's address is a 404. |
| 1b1.3 | The regression records were taken before the first shared edit. | On port 8081, record the position and size of the header parts, the tabs, and every home card button on the home, flashcards, and practice pages of both live exams, at 320, 640, and 1100 px, plus a dark spot check. After the edits every number matches. |
| 1b1.4 | The rest of rule 4 holds. | The whole content check report is the same before and after. A deck and a test saved before the edits are resumed after them. No page has an error in the console. `tools/quotes.html` opens. |
| 1b1.5 | The two finished tools still work end to end. | On port 8081 at 320 and 1100 px: build a deck and flip a card; take a 5-question test to its results; use Resume and the two-click minus on the home card; open Recent history. |
| 1b1.6 | Nothing shows without the field. | On port 8081: no third button on any card and no third tab on any page. `commands.html?exam=network-plus`, `commands.html?exam=a-plus-core-1`, and `commands.html` alone each end on `index.html`. No request has `/commands/` in its address. |
| 1b1.7 | Ready. | On port 8091: the Network+ card has Command line on a row of its own, in the outline style, a link to `commands.html?exam=network-plus`. The A+ Core 1 card's numbers equal port 8081's. Network+ pages show three tabs and A+ Core 1 pages two. The browser tab title starts with Command line and names CompTIA Network+ (N10-009). |
| 1b1.8 | Coming soon. | On port 8092: Command line is dashed with a small Coming soon, is not a link, and cannot be reached with the Tab key. The tab shows. `commands.html?exam=network-plus` shows its heading and a Coming soon notice. Nobody typed Coming soon into a data file. |
| 1b1.9 | A commands manifest that cannot be read changes nothing else. | On port 8093: the home page draws, Command line is a link, and the Flashcards and Practice test buttons are as on port 8081. `commands.html` shows the could-not-load notice that names the manifest. The Network+ flashcards and practice pages work. |
| 1b1.10 | Teacher preview. | On port 8094: without `?drafts=1` nothing shows and `commands.html` goes to the home page. With `index.html?drafts=1` the button, the tabs, and the page show, and every link keeps the flag. |
| 1b1.11 | An exam without the tool never lands on another exam's page. | `commands.html?exam=a-plus-core-1` goes to the home page on every port. `commands.html` with no exam named opens the first live exam that has the tool. `boot.js` decides this before any pack is asked for. |
| 1b1.12 | Only the Command line page downloads command packs. | On port 8091 the flashcards and practice pages for Network+ show three tabs and ask for nothing under `commands/`. The home page asks for the commands manifest of Network+ only. |
| 1b1.13 | The three-tab header fits at every width. | On port 8091, the Network+ pages at 320, 360, 390, 600, 640, 700, 740, 741, 901, 940, and 1100 px: `scrollWidth` equals `clientWidth`; the tab row is 44 px tall, or 55 px under 360 px; nothing overlaps or is cut; the current tab is marked. Screenshots in light and dark at 320, 700, and 1100 px. |
| 1b1.14 | Pages with two tabs did not move. | Every A+ Core 1 record of 1b1.3 matches. On port 8081 the Network+ records match too, because the field is not there. |
| 1b1.15 | Keyboard order in the header. | On port 8091, press Tab from the top of a Network+ page at 1100 px (home, three tabs, the light and dark button) and at 700 px (home, tabs, button). The focus ring shows on each stop. |
| 1b1.16 | The home card fits at every width. | On ports 8091 and 8092 at 320, 360, 600, 700, 1100, and 1280 px in both themes: no sideways scroll. At 320 px the new row is 251 by 44. At 1100 px the A+ Core 1 buttons sit 48 px lower than the Network+ card's first row, as measured. The home card still shows no score. |
| 1b1.17 | New code copes with an old cached page, and an old script with a new page. | Serve the new scripts with the last commit's `flashcards.html` (no third link): the page works and the console is clean. Serve the last commit's scripts with the new `flashcards.html`: the third tab stays hidden. |
| 1b1.18 | Every new header selector matches nothing on a two-tab page (rule 5 of the plan). | On each finished page on port 8081, `document.querySelectorAll` of every new selector gives 0 elements. |
| 1b1.19 | `commands.html` is a copy of `practice.html` with three differences: the title, the script, and the tab list. | `diff practice.html commands.html`. The page check of `pages.yml`, run in Git Bash, passes on four pages. |
| 1b1.20 | `CLAUDE.md` has the three changed sentences he was told about, and the flashcard rule is whole. | It says a prompt is the system's own text and not a symbol; a tool an exam does not have is not shown at all, and the extra set control reads Coming soon until it has commands; the Network+ home card has a third button and still no score. `git diff -- CLAUDE.md` shows the flashcard line unchanged. |
| 1b1.21 | The files changed are the merged list above, and nothing else. | `git show --stat`. `assets/js/pages/practice.js`, `assets/js/pages/flashcards.js`, `assets/js/theme-init.js`, and everything under `data/` are not in it. |
| 1b1.22 | He looked at two test ports before the push. | He opens ports 8091 and 8092 on this PC: the home card row and the header. What he said is written down. |
| 1b1.23 | The published site is unchanged and the new page is there. | After the push: the three pages look the same at phone size and their consoles are clean. `commands.html` answers, not a 404, and goes to the home page. The commit to take back if something is wrong is written down. |

## Phase 1b, push 2. The page

Files: `assets/js/pages/commands.js` and its parts, `assets/js/lib/command-drill.js`, `assets/css/site.css` (one block of `cl-` classes), and test commands in `tools/test-data`. Tested at 320 by 568 with touch, in light and dark, on the fixture ports.

| # | Must be true | How to prove it |
|---|---|---|
| 1b2.1 | The page opens only where it should. | Port 8091: `commands.html?exam=network-plus` shows the setup screen. Port 8094: the same address goes to the home page, and with `&drafts=1` it shows the setup screen. Any port: `?exam=a-plus-core-1` goes to the home page. |
| 1b2.2 | No sideways scrolling at 320 px on any screen. | On setup, an open command, an ended command with 12 output lines of 25 characters, a question, results, and the review: `document.documentElement.scrollWidth` is 320 or less. |
| 1b2.3 | 25 characters stay on one line. | With a test command whose output is 12 lines of exactly 25 characters, in the live box and in a review card: the output's height divided by its line height is 12. |
| 1b2.4 | The student's own typed line cannot break the page. | Run a counted miss of 80 characters with no space. The live box, the result block, and the review card do not scroll sideways at 320 px. The field stops at 80 characters. |
| 1b2.5 | The field is set up for phones. | Its attributes read: `spellcheck` the text `false`, `autocapitalize` `none`, `autocorrect` `off`, `autocomplete` `off`, `enterkeyhint` `go`, `maxlength` `80`, and no placeholder. Its computed font size is 16px. With touch it is at least 44 px tall. Its only name is Command, for screen readers. |
| 1b2.6 | One live field per command, never redrawn between tries. | Keep a reference to the field, run a slip and then a first miss: the field on the page is the same node and still has focus. |
| 1b2.7 | Two counted tries, free slips, and no output for a wrong command. | Three slips and then the right line end as Correct on the first try. One real wrong command prints the echo, the red label with the x icon, and 1 try left, and no output anywhere. A second ends the command with Answer, the right command, and its output. Show answer with no tries does the same. |
| 1b2.8 | Each right command prints its own output. | With a test command that has two answer groups, typing each group's line shows that group's output and no other. An empty output prints nothing but the next prompt. |
| 1b2.9 | A line that asks for help, or that the tool does not hold, costs no try. | `help` and `ipconfig /?` print Not in this tool. `ifconfig -a` on a Linux test command gets a plain label and stays in the field. The try count does not move. |
| 1b2.10 | The page and the try-a-line box agree. | Type ten lines from the case table into the page for a test command and the same ten into the box on the content check page: the verdict and the try count match line for line. |
| 1b2.11 | The cursor follows the device. | With touch, a new command does not focus the field, and a tap in the box or on Run does. A tap on the title strip or on Show answer does not. Without touch, the cursor is in the field when the command opens. |
| 1b2.12 | On touch, a new command starts at the top of the screen, and nothing on the command screen is docked. | When a command opens, its top line is at the top of the screen, with the header scrolled out of view. No bar stays fixed over the page. |
| 1b2.13 | A held Enter cannot skip the output. | Send a repeating Enter keydown to the field and to Next: nothing runs. |
| 1b2.14 | The question is asked under the output. | With the example command on port 8091: the output is the exhibit of `n-u04-q054` without its first line. No reading and no Next show before Check. After Check, the question's reading, then a block that reads Command: ipconfig with the command's reading, and Next. The letter keys pick a choice only while focus is in the question. |
| 1b2.15 | The question is asked whichever right line was typed, and after a missed command too. | Type the second group's line (`ipconfig /all`): the same question is asked. Miss the command twice: the question is still asked. |
| 1b2.16 | A version is picked once per command and saved by its id. | Run the example command in two drills in a row: the second shows the other version. Reload with the question open: the same version and the same order of choices. The saved drill holds the version's id, not its place in the list. |
| 1b2.17 | A version the page cannot print is skipped, and a command with no printable version is hidden. | Give a test command a version whose `exhibitOf` names a question that does not exist: that version is never shown. Give it only such versions: the command is not listed and not counted. The page does not stop. |
| 1b2.18 | A saved drill the page does not understand is dropped, not repaired. | Take a test command out of the pack and reload: the drill in progress is gone and the setup screen shows. Take out the saved version and reload: the page opens with no error in the console. |
| 1b2.19 | The page ignores a field it does not know. | Add an unknown field to a test command, to a group, and to a version: the page works and the console is clean. |
| 1b2.20 | The drill survives a reload. | Reload with one try used, with a command ended, with a question open, and on results: the same state comes back each time. The address holds `resume=1` during a drill. Leaving and coming Back reloads the page. |
| 1b2.21 | The practice test is untouched. | On the same fixture port take one practice test first. Copy the saved values `certprep:v1:progress`, `certprep:v1:practice-run:network-plus`, `certprep:v1:practice-setup:network-plus`, and `certprep:v1:flashcards:network-plus`. Run a full drill that asks a reused question. All four values are unchanged, and the practice page's streak and Recent history are the same. A search of the new files for `progress.js` finds nothing. |
| 1b2.22 | One spoken message per action. | After each Run, read the text of the element with id `sr-announcer` after 50 ms: it is one message, such as Wrong command. 1 try left. |
| 1b2.23 | Light and dark, and the two greens. | Screenshot every screen in both modes at 320 px. A counted miss is red with the x icon. Plain statuses are grey. Nothing in the box uses the right-and-wrong green, and the focus ring on the field is the class color. Look at an open question under a Correct strip on the Network+ theme in both modes and write down what was seen. |
| 1b2.24 | Extra commands is worked out from the data. | With no pack marked extra, the Extra commands check box row is greyed with a Coming soon chip. Add a test pack marked `"set": "extra"` with two commands: the row reads Extra commands (2) and is not checked. Checking it adds 2 to the available count, and the choice survives a reload. |
| 1b2.25 | The setup lists the units named in `commandUnits`, and a unit with no commands reads Coming soon. | On port 8091: five unit rows, each with its count. The units with no test command read Coming soon and cannot be picked. With no unit checked, the button reads Select a unit. |
| 1b2.26 | The draw follows the weights and never repeats a command. | In the console import `assets/js/lib/command-drill.js` and draw 10 of 25 two thousand times with weights of 3, 2, and 1: every draw has 10 different ids, and the weight 3 command is drawn more often than the weight 1 command. |
| 1b2.27 | The numbers on the results screen agree. | The score reads as 8 of 10 commands, 6 on the first try, 2 of 3 questions. The questions line shows only when a question was asked. Review cards are tagged Right, Missed, or Question missed. A right command with a missed question is in Retry missed, and the retry shows the same version again. Quit at the start of a retry drill goes back to the results it came from. |
| 1b2.28 | Typed lines are kept only as long as Last drill. | Finish a drill, then dismiss Last drill with the two-click minus: the saved drill and its typed lines are gone from the device. Nothing is written to the practice test's history. |
| 1b2.29 | The Test content banner is right on every page. | On port 8091 `commands.html` shows the banner, because the example pack is a placeholder. The flashcards and practice pages on the same port do not. The banner is worked out once, from all packs together. |
| 1b2.30 | Every new class starts with `cl-`, and every new selector matches nothing on the finished pages. | `git diff -- assets/css/site.css` shows added lines only. On each finished page and screen on port 8081, every new selector gives 0 elements. No new hover rule sits outside the one `@media (hover: hover)` block. |
| 1b2.31 | The screen has labels, not instructions, and no emoji or symbol characters. | Read every screen against Appendix F of the plan with the fixes of section 7. The only symbols are the prompt (`C:\>`, a dollar sign, `Router#`, `Switch#`), which is the system's own text and is set in code. |
| 1b2.32 | Text from the packs is inserted as text, never as HTML. | A test task and a test output that hold `<b>` show the characters, not bold text. |
| 1b2.33 | Wide screens. | At 1100 px the setup has two columns, and the page does not jump when a command ends. |
| 1b2.34 | The files changed are the merged list above, and nothing else. | `git show --stat`. `assets/js/pages/practice.js` is copied from, never edited: it is not in the list. `data/exams.json` is unchanged and nothing is under `data/`. |
| 1b2.35 | The published site is unchanged. | After the push: the home card and the tabs are as before, `commands.html` goes to the home page, and the consoles are clean. |

## Phase 1c. The rules, the kit, the docs, and the Unit 4.0 trial

| # | Must be true | How to prove it |
|---|---|---|
| 1c.1 | He read the rule sentences before they went into the guide and the handoff. | Appendix E of the plan with the fixes of section 9 (R4b, R4c, R4f, R4g, R5, R7). His yes is noted in the plan's status line. |
| 1c.2 | The flashcard rule is whole. | `git diff -- docs/CONTENT-GUIDE.md` changes no line of the flashcard section. `git diff -- docs/CONTENT-HANDOFF.md` changes neither rule 6 nor the line near the top that points at it. The handoff's own `git grep` line for "without listing its members" still lists both of its files. |
| 1c.3 | The handoff asks for seven commands, and each lists its files. | In both places where it said five commands, it says seven. The sixth line names `typedFormOf` in the six files of rule R7 (Appendix E of the plan). The seventh names `command-match` in `assets/js/lib/command-match.js`, `assets/js/lib/validate-core.js`, and `tools/validate.js`. After the commit, run all seven: each lists every file named after it. |
| 1c.4 | A content chat is told what it may not touch. | The handoff says the matcher and its test lines are website files, and that a content chat never sets `commandUnits`. `CLAUDE.md` says the content chat also writes commands. |
| 1c.5 | The kit builds question packs exactly as before. | In a scratch folder, build one questions-only draft with the committed `assemble.ps1` and with the new one: the two packs are the same byte for byte. |
| 1c.6 | The kit builds a command pack and names each defect. | Run the commands mode on a draft that holds one of each defect: one problem line for each. Run it on a clean draft: it writes the pack, the id list, and the stored-lines list. |
| 1c.7 | A source item is used once across questions and commands. | A draft command modeled on a source item that a published question or command already uses is refused by the kit. |
| 1c.8 | The blind copy is blind, and the copy proof works for commands alone. | The blind file holds each command's id, system, and task. A search of it finds no lines, no output text, no `typedFormOf`, and no `origin`. `check-copy.ps1` for commands prints identical for an exact copy, prints the line after one character is changed, and exits with 1. |
| 1c.9 | No Network+ unit run started while the kit was being changed (rule 7 of the plan). | `git log` shows no content commit between the first and the last kit commit of this phase. |
| 1c.10 | No doc still says two tools. | Search the project for: two study modes, Two tools per exam, both study modes, the two packs, The three student pages. Each hit is fixed, or is one of the lines Appendix L of the plan marks 1d. The preview address is not in `README.md` yet. |
| 1c.11 | The trial pack is clean. | `http://localhost:8081/tools/validate.html`, with Include lab-only packs unticked as GitHub runs it: 0 errors. For `data/network-plus/commands` the only warnings are reviewed false and the tool switched off. Nine commands. The two `ipconfig` versions follow `n-u04-q054` and `n-u04-q059`, and no other command has a follow-up. |
| 1c.12 | The pack is the kit's copy, unedited. | `check-copy.ps1` for commands prints identical. |
| 1c.13 | The blind command check ran through the try-a-line box, and its report says what it did. | The report lists every line the blind checker typed with the verdict the box gave, the lines added to accept lists, the commands dropped after three rounds, and any row a website chat added to the case table. |
| 1c.14 | Each follow-up fits the output above it. | For both `ipconfig` versions: the output printed for every answer group shows the values the question reads, the keyed choice is marked right, and the question is drawn without its own exhibit. |
| 1c.15 | The trial runs on this PC, and students still see nothing. | `http://localhost:8081/commands.html?exam=network-plus&drafts=1` at 320 px in light and dark: a drill of Unit 4.0, the first stored line of each of the nine commands is accepted, and no output scrolls sideways. Without the flag, the Network+ card and the tabs are as before. |
| 1c.16 | On the published site the trial is hidden from students and open to him. | The home page shows no third button. The home page with `?drafts=1` shows Command line on Network+ only. `commands.html?exam=network-plus` goes home without the flag and opens with it. The content check on GitHub passes and lists the switched-off warning. |
| 1c.17 | The launch look, before launch. | Port 8095 shows the real trial pack with the field: the card, the tabs, the page. Compare it with what his phones showed. |
| 1c.18 | It works on real phones. | He opens the published address with `drafts=1` on an iPhone and an Android phone, and at 320 by 568 with the keyboard open if he has such a phone. He checks: a tap in the box opens the keyboard; the first letter stays lower case; two hyphens stay two hyphens; Go runs the command; the keyboard stays open between tries; the status shows above the keyboard; when the command ends the keyboard closes and the typed line and its output are in view; 25-character lines do not wrap; the question under the output can be answered; both themes. The builder fixes what fails and repeats the checks of 1b push 2. |
| 1c.19 | He made the calls the plan leaves to the trial. | Written down: keep `arp -s` or drop it; keep the follow-up question or not; the third tab that appears a moment late (leave it, a small fix, or one phone header for every exam); whether Show answer was tapped by mistake; the label `ifconfig: Linux`. |
| 1c.20 | He looked at the two Linux outputs. | His yes, or his changes, for the outputs of the Linux command in Unit 4.0 (`ip addr` and `ifconfig`). |
| 1c.21 | Rows for what the blind check typed are in the case table, each Windows spelling run on this PC first. | The matcher change is its own push and its GitHub run was watched (rule 6 of the plan). |
| 1c.22 | Ids stay with their commands if the trial pack is rebuilt. | Compare the ids before and after a rebuild: each id still names the same command, and a dropped id is not used again. |
| 1c.23 | The trial gave a real cost. | The content chat's usage for Unit 4.0 is written into the plan, section 10. |

## Phase 1d. The rest of the content, then the switch

| # | Must be true | How to prove it |
|---|---|---|
| 1d.1 | The launch content is complete and matches the plan. | Content check on port 8081: 25 commands (27 if he names two). Every paired id in the launch list (Appendix A of the plan) appears in exactly one `typedFormOf`. The stored-lines sheet matches the list. Only `show arp` and `show vlan` report an empty quote of their own. |
| 1d.2 | The packs are the kit's copies, unedited. | `check-copy.ps1` for commands prints identical for Units 4.0, 5.0, and 6.0. |
| 1d.3 | The follow-ups are the ones in section 3 of the plan. | `ipconfig` with `n-u04-q054` and `n-u04-q059`, `show ip route` with `n-u05-q013`, `tracert` with `n-u05-q016`, and `route print` with `n-u05-q070` only on his word. For each, the output for every answer group shows the values the question reads, and the keyed choice is marked right. |
| 1d.4 | He looked at the five Linux and device outputs. | His yes, or his changes, for `traceroute`, `dig`, `show ip route`, `show arp`, and `show vlan`. |
| 1d.5 | The content check is clean on the rehearsal port before the switch. | `http://localhost:8095/tools/validate.html`: 0 errors, no switched-off warning, and no command tagged to a unit outside `commandUnits`. |
| 1d.6 | The tool tells the truth about what is missing. | On port 8095: the Extra commands row reads Coming soon, Units 3.0 and 8.0 read Coming soon, and a drill of All completes. |
| 1d.7 | The last code push is at least a day old, and no test page is left. | `git log --date=iso`. `ls *.html` in Git Bash from the project folder lists the four pages only, and the bare test page's address on the published site is a 404. |
| 1d.8 | The switch is one line, in a commit of its own, made by a website chat. | `git show --stat` lists `data/exams.json` and the status lines of the docs (Appendix L of the plan, the rows marked 1d). `git show -- data/exams.json` adds `"commandUnits": ["3.0", "4.0", "5.0", "6.0", "8.0"]` to the Network+ exam and nothing else. |
| 1d.9 | The switch does what port 8095 showed. | After the commit and before the push, port 8081 matches port 8095. The A+ Core 1 records still equal the baseline of 1b1.3. The content check has 0 errors and no switched-off warning. |
| 1d.10 | The page with the field in place. | `commands.html?exam=network-plus` opens without `drafts=1`. Units shows five rows, and Unit 3.0 and Unit 8.0 read Coming soon. `commands.html` with no exam opens Network+. `commands.html?exam=a-plus-core-1` goes to the home page. |
| 1d.11 | The field is enforced. | On a fixture port, a test command tagged to a unit outside the list is an error. |
| 1d.12 | The switch can be undone. | On port 8081 only, not pushed: take the line out and the tool is gone, put it back and it returns. |
| 1d.13 | The test registries still follow the real one. | The four copies in `tools/test-data` with the field differ from `data/exams.json` in the `$schema` line only. The copy in `preview/` still has no `commandUnits`. |
| 1d.14 | Launch on the published site, on his word, outside class time. | `gh run watch` is green. The home card shows Command line on Network+ only, with no flag in the address. Network+ pages show three tabs. A+ Core 1 pages are unchanged. He opens it on a phone. |
| 1d.15 | The docs say what students now have. | `README.md`, `docs/PLAN.md`, and the description line of `index.html` name the tool. `README.md` has the preview address and the fixture server. |

## Picks used where the planners' checks disagreed

| Subject | Pick |
|---|---|
| Where test commands live | `tools/test-data`, served on ports 8091 to 8095. Never `data/network-plus/commands/private` on port 8081. |
| A command whose partner question or card is gone | An error that blocks publishing, not a warning. |
| Old content unmoved | The whole content check report is compared, not only its counts. |
| Regression records | Three pages for both exams at 320, 640, and 1100 px, plus a dark spot check. Not 50 records. |
| Files changed in 1b | One merged list for each push, with `flashcards.html`, `practice.html`, `home.js`, `CLAUDE.md`, and `tools/test-data` in it. |
| Follow-ups | In the first version, published questions only: the four in section 3 of the plan, not ten. The question is asked whichever right line was typed. |
| How a version is known | By its id, picked once per command and saved in the drill. Not by its place in a list. |
| The extra set | Marked on the pack. The control is a check box row, not a button. |
| A `refuse` list | None at launch. The check warns about it as an unknown field. |
| An exam without the tool | `commands.html` goes to the home page, and `boot.js` does it. |
| The matcher's call and labels | `matchLine()` with accepted, miss, slip, ignored, and wrong-command. One table of labels in the matcher file. |
| A source item used twice | An error for commands and follow-ups. Still a warning between two older questions. |
| The trial | All nine Unit 4.0 commands, not lesson 4.4. |
| The guide's new section | Written in 1c with the handoff and the kit. |
| The handoff's new `git grep` lines | Both, as a sixth and a seventh. |
| The third tab that appears late | No fix in the first build. He sees it in the phone trial and picks. |
| Words on the results screen | Commands are the score and questions have a line of their own. A card is tagged Question missed when only the question was missed. |
| The focus ring on Network+ | The class color, which is green. Only the right-and-wrong green is kept out of the box. |
