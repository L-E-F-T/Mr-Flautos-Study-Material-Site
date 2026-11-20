# Writing brief: <<EXAM>> Unit <<UNIT>> commands (the Command line tool)

The content chat fills in every `<<...>>` and gives this to the writing agent for one unit. It is binding. It is for a Command line pass (`docs/CONTENT-HANDOFF.md`, "A Command line pass"), not for questions or flashcards.

`SP` = `<<SCRATCHPAD>>`

## What you write

The Command line tool asks for a command by typing: one exam-style task above a prompt for the system the task names, and the student types the line. A right line prints example output, then the reading. You write one command for each item below: its task, its answer groups with their lines, an output for each answer group, and its versions. Every command is the typed form of a line that a published question or a command flashcard of the exam already asks (its partners, in `typedFormOf`), so it tests the same fact a second way.

The rules are `C:\CompTIA Website\docs\CONTENT-GUIDE.md`, the section "A command (the Command line tool)", all of it, and the `exhibit` row of "A question". Read them first. Where this brief and the guide differ, the guide wins: tell the chat in your reply.

## Your items

<<THE ROWS OF SP\command-lines-<unit>.tsv FOR THIS UNIT: for each item, its slot, its partners, its system, its job, its lines by answer group with the section that teaches each, its follow-ups if any, and its source item if it has no question partner>>

The lines are settled. Store exactly these lines, in these groups, in this order. Where a line holds a word in angle brackets (`ping <address>`, `dig @<server> <name>`), write the address or host name your task prints in its place, and keep the rest as it is (`@` and all). Add no line and drop none. If a line looks wrong to you, say so in your reply instead of changing it.

You may read each partner question or card in `C:\CompTIA Website\data\<<EXAM FOLDER>>\questions\` and `flashcards\` (by its id), and the source item of a command that has one (`SP\pool\`), to know what is being asked. Copy nothing from them.

## The task

The guide's "The task" is the rule. In short:

- One or two sentences in CompTIA voice that end by asking which command, with a question mark. Plain wording a 10th grader can read. No em dashes.
- A new scenario: not the partner question's, not the source item's.
- It names the system in words: a Windows PC, a Linux server, a router, a switch.
- It prints every address, host name, and interface the lines need, except the loopback address (`127.0.0.1`, `localhost`), which is the answer.
- It never holds a line, a switch (`-a`, `/all`), or the command's name in any form, a verb included ("ping the server"), unless the task may name the tool: only where the partner question's stem names it, or every choice of that question is a line of that tool.
- It is worded so that the lines below are the only taught lines that do the job as asked.
- Where the command has a follow-up, the task leads into it: the same system, the same addresses, and nothing its stem contradicts.

## Outputs

The guide's "Output" is the rule. In short:

- One output for each answer group, in the order of `accept`. It shows what that line prints on the real system, and what the task asked for, with the task's own addresses and names. Never a source item's, a partner question's, or the reading's values, except an output that is a follow-up's own exhibit (`exhibitOf`, below).
- At most 12 lines of at most 25 characters (a longer line wraps on a 320 px phone), lines separated by `\n`, no tabs, no em or en dashes.
- It does not start with the prompt and the line: the box has just printed them.
- An output may be empty (`""`) where the real command prints nothing.
- A long output shows only its first lines and the lines the task asked about. Nothing is added to say it was cut.
- **Fold a record that does not fit.** Keep its first fields on the line and put the rest on the next line, indented two spaces, as the published exhibits do: `n-u04-q037` (an `arp -a` table: the address and its type, then the physical address under it), `n-u04-q054` (`ipconfig`: each label, then its value under it), and `n-u05-q016` (`tracert`: the hop and its times, then the address under them). Read them for the layout only.
- A ping output prints no TTL value, and nothing leans on the Linux netstat interface switch.
- Windows layouts the reading does not show, as the chat ran them on its PC with every value replaced: <<THE LAYOUTS, or "none">>. Follow their shape, never their values.
- Linux, router, and switch layouts come from the reading's figures only: <<THE FIGURES AND THEIR SECTIONS, or "none">>. Nobody in the pipeline can run these commands, so keep to what a figure shows.

## Follow-ups

A follow-up is a published question about the output, asked under it in the tool. Only these commands have one, each a question whose exhibit is that command's own output (`docs/COMMAND-LINE-PLAN.md` section 3):

- `ipconfig` (Unit 4.0): two versions, one following `n-u04-q054` and one following `n-u04-q059`.
- `show ip route` (Unit 5.0): `n-u05-q013`.
- `tracert` (Unit 5.0): `n-u05-q016`, so the task's target is 203.0.113.45.
- `route print` (Unit 5.0): `n-u05-q070`, only if Mr. Flauto has named it: <<YES OR NO>>.

No other command has a follow-up or a second version. Write no new question.

A version with a follow-up has `"followUp": { "question": "<id>" }`. The output of the answer group whose line made that question's exhibit is `{ "exhibitOf": "<the same id>" }`: the tool prints the exhibit, and leaves out its first line when that is the prompt and the group's line. Every other answer group's output is written fresh and shows the same values (the same addresses, mask, gateway, and route the exhibit shows), so the question can be answered whichever right line was typed.

## Tags and the reference

As for a question (the guide, "A question"): `objectives` the CompTIA objective and its best bullet (`5.5`, `5.5.a`); `units` and `reference.section` the section of Unit <<UNIT>> that teaches the command (the item's row says which); `reference.title` copied exactly from `units.json`; `reference.quote` empty (Mr. Flauto adds quotes); `reference.find` three to six words from one line of `SP\text\<section>.raw.txt`, inside the sentence that teaches the command. A group whose lines another section teaches names it in `sections` (the item's row says which). <<KNOWN READING PROBLEMS: key nothing to these>>

## Command JSON

Write `{ "commands": [ ... ] }` to `<<OUTPUT FILE, for example SP\work\commands-4.0.json>>` with the Write tool, one object per item with its slot in `slot`, and reply with only the count. You may write nothing else. Leave out `id`, `status`, and `alsoWorks`: the kit sets the ids, and the chat adds `alsoWorks` after the blind check. `origin` is only for a command whose partner is a card (its row names the source item), written as for a question.

```json
{
  "slot": "U4-1",
  "typedFormOf": ["n-u04-q033"],
  "system": "windows",
  "task": "(one or two sentences in CompTIA voice that end by asking which command)",
  "accept": [
    { "lines": ["ipconfig"] },
    { "lines": ["ipconfig /all"] }
  ],
  "versions": [
    { "outputs": [ { "exhibitOf": "n-u04-q054" }, { "text": "(written fresh, 12 by 25)" } ], "followUp": { "question": "n-u04-q054" } },
    { "outputs": [ { "exhibitOf": "n-u04-q059" }, { "text": "(written fresh, 12 by 25)" } ], "followUp": { "question": "n-u04-q059" } }
  ],
  "objectives": ["5.5", "5.5.a"],
  "units": ["4.4.1"],
  "reference": { "source": "certmaster", "section": "4.4.1", "title": "ipconfig", "quote": "", "find": "(three to six words)" }
}
```

A command with no follow-up has one version with no `followUp`: `"versions": [ { "outputs": [ { "text": "..." } ] } ]`. A card's command adds `"origin": { "kind": "certmaster-variation", "basedOn": "CertMaster 5.0 Q59" }` after `typedFormOf`.
