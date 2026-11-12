# CompTIA Cert Prep

A study site for Mr. Flauto's CompTIA classes: build-your-own **flashcard decks** and **practice tests** filtered by textbook unit/lesson or by exam objective, with instant feedback that points to the exact CertMaster reading section.

Live now: **A+ Core 1 (220-1201)**. Planned: A+ Core 2 (220-1202), Network+ (N10-009), Security+ (SY0-701, then SY0-801).

It works on phones and computers, in light or dark mode (the sun/moon button in the header).

Content so far: A+ Core 1 Units 2.0, 3.0, and 5.0 (164 questions, 166 flashcards). Every other unit says "Coming soon" until its packs are written.

## Test it on this computer

1. Double-click **`serve.cmd`** in this folder. A window opens and your browser goes to **http://localhost:8080/**.
2. Keep that window open while testing. Edit any file, then refresh the browser to see the change.
3. Press **Ctrl+C** in the window to stop.

Other port: `serve.cmd -Port 5500`. Nothing needs to be installed: the server is a small PowerShell script (`tools/serve.ps1`) that only this computer can reach.

Teacher pages while the server runs:

- **Content check:** http://localhost:8080/tools/validate.html (errors, warnings, and coverage by objective and lesson)
- **Quote helper:** http://localhost:8080/tools/quotes.html (add the line from the reading to each question; Chrome or Edge saves straight into the file)
- **Draft preview:** add `?drafts=1` to any page URL to see questions marked `"status": "draft"`

> Opening `index.html` by double-clicking it will not work: browsers block the site's scripts on `file://` pages. Always use `serve.cmd`.

## Folder map

| Path | What it is |
|---|---|
| `index.html`, `flashcards.html`, `practice.html` | The three student pages |
| `assets/css/site.css` | All styles (course colors, light and dark mode, phone layout) |
| `assets/js/pages/` | Page logic: home, flashcards, practice test |
| `assets/js/lib/` | Shared code: content loading, taxonomy trees, saved progress, light/dark toggle, validator rules |
| `assets/js/theme-init.js` | Tiny script that sets light or dark before the page draws |
| `data/exams.json` | Every exam and its status |
| `data/a-plus-core-1/` | Objectives, units, and the question and flashcard packs |
| `schemas/` | Format definitions (VS Code uses them to flag mistakes as you type) |
| `tools/` | Local server, content check (browser + command line) |
| `docs/PLAN.md` | The plan: site layout, how it is built, sign-in and scoreboard design, roadmap, tools to install |
| `docs/CONTENT-GUIDE.md` | The contract for whoever writes content: file format and rules |
| `docs/CONTENT-HANDOFF.md` | The prompt to paste into a new Claude Code chat, one chat per unit |
| `docs/CONTENT-NOTES.md` | Notes passed from one unit's chat to the next: source items another unit answers, reading problems, open questions |
| `docs/content-kit/` | Scripts and agent briefs the content chats use (they write only to the chat's scratchpad) |
| `CLAUDE.md` | Short notes Claude reads at the start of every chat in this folder |
| `.github/workflows/pages.yml` | Checks content, then publishes to GitHub Pages |

## Published on GitHub Pages

The site is live at **https://l-e-f-t.github.io/Mr-Flautos-Study-Material-Site/** (repository `L-E-F-T/Mr-Flautos-Study-Material-Site`; the address is case-sensitive).

- Every push to `main` runs the content check and, if it passes, publishes the site. Pushes to other branches do not change the live site.
- Pages is set to **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site is plain HTML, CSS, and JavaScript with JSON data, so the same files can later be served from any web server on the lab equipment.

Not affiliated with or endorsed by CompTIA.
