# Test data for the fixture server

Fake data for testing the Command line tool (`docs/COMMAND-LINE-PLAN.md`) before it has content and before it is switched on. It is not content. It is never published: the deploy copies only the root pages, `assets/`, and `data/`, and the content check on GitHub never reads this folder.

## Ports

Start the preview server named `study-site-fixture` (`.claude/launch.json`). It serves the real site files. On each of its ports, a request under `data/` is answered from one folder here when that folder has the file, and from the real `data/` folder when it does not.

| Port | Folder | In the data | What the port shows |
|---|---|---|---|
| 8091 | `ready/` | Network+ has `commandUnits`. Its commands manifest lists the example pack and the page test pack. | Ready |
| 8092 | `soon/` | The field. A commands manifest with no packs. | Coming soon |
| 8093 | `broken/` | The field. A commands manifest that is not valid JSON. | A manifest that cannot be read |
| 8094 | `preview/` | No field. A commands manifest that lists the example pack and the extra pack. | Nothing without `?drafts=1`, the tool with it |
| 8095 | `rehearsal/` | The field, and nothing else. Real command packs show through. | The launch look, before the switch |

- Ports 8080 to 8085 never serve anything from here. `tools/serve.ps1` refuses test data on any port outside 8091 to 8095.
- An answer that came from here carries the header `X-Test-Data` with the folder's name, and the server's log names the folder under that request.
- Each port is its own site to the browser, so a drill saved on one fixture port stays on that port.

## Files

- `*/exams.json` is a copy of `data/exams.json` with its `$schema` line pointing three folders up. Four copies add `"commandUnits": ["3.0", "4.0", "5.0", "6.0", "8.0"]` to the Network+ exam. The copy in `preview/` never has the field. When `data/exams.json` changes, make the five copies again.
- `ready/network-plus/commands/unit-99.json` is the example pack: the frozen shape (`schemas/command-pack.schema.json`) in use. No real unit is 99.
  - `n-u99-c001`, Windows. Right lines: `ipconfig`, `ipconfig /all`. `alsoWorks`: `ipconfig /allcompartments`, a real Windows line it does not accept, which reads Not counted (the rule that the list starts empty is for real packs). Two versions. The first prints the exhibit of question `n-u04-q054` for `ipconfig` and asks that question.
  - `n-u99-c002`, Router. Right line: `show arp`. One version. Its partner is a flashcard, so it has an `origin`.
- `ready/network-plus/commands/unit-98.json` is the page test pack: the cases the Command line page needs. None of its commands types a published question: three have a flashcard partner and an `origin` (for the weights), and the rest an `origin` only.
  - `n-u98-c001`, Windows. Right line: `netstat -s`. Its output is 12 lines of exactly 25 characters. Weight 3 (`Practice Tests 6 TEST`).
  - `n-u98-c002`, Linux. Two answer groups, `ip addr` and `ifconfig`, each with its own output. `alsoWorks`: `ifconfig -a`. Weight 2 (`Practice Tests 5 TEST`).
  - `n-u98-c003`, Windows. Right line: `ping 192.0.2.20`, an address the task prints. Weight 1 (`TEST SOURCE`).
  - `n-u98-c004`, Windows. Right line: `arp -d *`. Its output is empty.
  - `n-u98-c005`, Switch. Right lines: `show vlan` and `show vlan brief`, in one answer group.
  - `n-u98-c006`, Windows. Right line: `route print`. Its task and its output hold the tag `<b>`, which the page shows as text.
  - `n-u98-c007`, Windows, a draft. Right line: `netstat -e`. Seen only with `?drafts=1`.
  - `n-u98-c008`, Windows. Right line: `netstat`. `"help": false` (help off): `help`, `?`, and a command's own help (`netstat /?`) print Help off, and the try-a-line box reads Help off for it.
  - Its commands are tagged to Units 4.0, 5.0, and 6.0, so on port 8091 Units 3.0 and 8.0 read Coming soon.
- `ready/network-plus/commands/bank.json` is the page test bank: a command bank (`schemas/command-bank.schema.json`) for the test packs' own tools and switches, with every word TEST, marked `"placeholder": true`. It has 8 entries for Windows (`ipconfig`, `netstat`, `ping`, `arp`, `route`), Linux (`ip`, `ifconfig`), and the switch (`show`), and none for the router, so on port 8091 the router command `n-u99-c002` reads Coming soon and the content check warns that the bank has no Router `show`. Its longest switch is `/allcompartments`, its `ping` syntax line is 36 characters, the words of `route`'s `print` hold the tag `<b>`, `netstat -e` names a section of its own, and `ifconfig` has no switches. No other folder has a bank: on ports 8092 to 8094 every command reads Coming soon, and port 8095 shows the real bank once it is published.
- `preview/network-plus/commands/unit-99.json` is the same file as the example pack in `ready/`. Copy it again when the one in `ready/` changes.
- `preview/network-plus/commands/unit-97-extra.json` is the extra pack, only in `preview/`: `"set": "extra"` in its header, and two commands with an `origin` only (`n-u97-c001`, `netstat -o`, and `n-u97-c002`, `arp -a`), tagged to Units 4.0 and 5.0.
- `broken/network-plus/commands/manifest.json` is not valid JSON on purpose. An editor marks it red. Leave it that way.

## Rules

- Every task, output, and title here is plainly fake ("TEST ITEM", "TEST OUTPUT"). Keep it that way. A website chat never writes real commands, tasks, outputs, or questions.
- Nothing here is ever copied into `data/` or into a pack, and no content is copied into here. A test item may name a published question or flashcard by its id, and nothing more.
- Test ids use units 97 to 99 (`n-u99-c001`, `n-u99-v001`, `n-u98-c001`, `n-u97-c001`). No real unit is 97, 98, or 99.
- Never put test data under `data/`, not even in a `private/` folder: port 8080 would read it.
