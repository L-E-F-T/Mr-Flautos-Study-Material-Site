# Test data for the fixture server

Fake data for testing the Command line tool (`docs/COMMAND-LINE-PLAN.md`) before it has content and before it is switched on. It is not content. It is never published: the deploy copies only the root pages, `assets/`, and `data/`, and the content check on GitHub never reads this folder.

## Ports

Start the preview server named `study-site-fixture` (`.claude/launch.json`). It serves the real site files. On each of its ports, a request under `data/` is answered from one folder here when that folder has the file, and from the real `data/` folder when it does not.

| Port | Folder | In the data | What the port shows |
|---|---|---|---|
| 8091 | `ready/` | Network+ has `commandUnits`. Its commands manifest lists the example pack. | Ready |
| 8092 | `soon/` | The field. A commands manifest with no packs. | Coming soon |
| 8093 | `broken/` | The field. A commands manifest that is not valid JSON. | A manifest that cannot be read |
| 8094 | `preview/` | No field. A commands manifest that lists the example pack. | Nothing without `?drafts=1`, the tool with it |
| 8095 | `rehearsal/` | The field, and nothing else. Real command packs show through. | The launch look, before the switch |

- Ports 8080 to 8085 never serve anything from here. `tools/serve.ps1` refuses test data on any port outside 8091 to 8095.
- An answer that came from here carries the header `X-Test-Data` with the folder's name, and the server's log names the folder under that request.
- Each port is its own site to the browser, so a drill saved on one fixture port stays on that port.

## Files

- `*/exams.json` is a copy of `data/exams.json` with its `$schema` line pointing three folders up. Four copies add `"commandUnits": ["3.0", "4.0", "5.0", "6.0", "8.0"]` to the Network+ exam. The copy in `preview/` never has the field. When `data/exams.json` changes, make the five copies again.
- `ready/network-plus/commands/unit-99.json` is the example pack: the frozen shape (`schemas/command-pack.schema.json`) in use. No real unit is 99.
  - `n-u99-c001`, Windows. Right lines: `ipconfig`, `ipconfig /all`. Two versions. The first prints the exhibit of question `n-u04-q054` for `ipconfig` and asks that question.
  - `n-u99-c002`, Router. Right line: `show arp`. One version. Its partner is a flashcard, so it has an `origin`.
- `preview/network-plus/commands/unit-99.json` is the same file. Copy it again when the one in `ready/` changes.
- `broken/network-plus/commands/manifest.json` is not valid JSON on purpose. An editor marks it red. Leave it that way.

## Rules

- Every task, output, and title here is plainly fake ("TEST ITEM", "TEST OUTPUT"). Keep it that way. A website chat never writes real commands, tasks, outputs, or questions.
- Nothing here is ever copied into `data/` or into a pack, and no content is copied into here. A test item may name a published question or flashcard by its id, and nothing more.
- Test ids use unit 99 (`n-u99-c001`, `n-u99-v001`).
- Never put test data under `data/`, not even in a `private/` folder: port 8080 would read it.
