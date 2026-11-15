# Brief: mapping and keying source items, <<EXAM>> Unit <<UNIT>>

The content chat copies this file to its scratchpad, fills in every `<<...>>`, and gives it to each mapping agent with its share of the items. Nothing here is optional.

You are mapping source items for Mr. Flauto's CompTIA study site, a high school class preparing for the real exam. Work only from the files named here. Never edit anything under `C:\CompTIA Website`, and never open anything in the teacher's OneDrive: every source you need is in the scratchpad as text.

`SP` = `<<SCRATCHPAD>>`

## Files

| What | Where |
|---|---|
| The reading (CertMaster Learn), one file per section. Page breaks show as a line `<<<PAGE BREAK>>>`. | `SP\text\<section>.txt`, for example `SP\text\3.2.6.txt` |
| The same text with page breaks as form feeds. Find phrases are checked against these. | `SP\text\<section>.raw.txt` |
| Lesson overview pages (they list the lesson's exam objectives and teach nothing: never cite them) | `SP\text\<lesson>.txt`, for example `SP\text\3.1.txt` |
| Outline: units, lessons, the objectives each lesson lists, sections, titles | `C:\CompTIA Website\data\<<EXAM FOLDER>>\units.json` |
| CompTIA objectives and bullets (`3.4.c`) | `C:\CompTIA Website\data\<<EXAM FOLDER>>\objectives.json` |
| CertMaster question pools, numbered, NO answer key | `SP\pool\<file>.txt`, items headed `=== CertMaster 3.0 Q41 ===` |
| The exam's keyed practice exam. A+ Core 1: Professor Messer's items with the book's answer, explanation, and objective tag | `SP\messer\<label>.txt`, for example `SP\messer\B44.txt` |
| Index of Messer items: label, PDF page, objective, topic | `SP\messer\messer-<<EXAM CODE>>.tsv` |
| Network+: the practice exam book's items with the book's key and explanation | `SP\practice\<item>.txt`: Practice Tests 1 Q33 is `SP\practice\1-Q33.txt` |
| Index of the Network+ practice exam: item, PDF page, objective (the heading it is printed under; `-` for the book's two full practice tests, Chapters 6 and 7), number of answers, number of choices, flags (`figure` = needs a picture, not usable; `exhibit` = prints a command's output, whose columns can come out of order in the text and can run onto the last choice: map it only if the text still settles it, otherwise `skip` with skipReason "exhibit"; `all-that-apply` = the stem says Choose all that apply, and `answers` is the book's key count), start of the stem | `SP\practice\practice-<<EXAM CODE>>.tsv` |

## This unit

<<LESSON TABLE: one row per lesson with the objectives units.json lists for it and the sections that teach (leave out the overview page and any video or lab page with no text)>>

- **Book numbers and CompTIA numbers overlap by accident.** Section and lesson ids (`3.2.6`, `3.4`) are book numbers. Objective and bullet ids (`3.4`, `3.4.c`) are CompTIA numbers.
- **Objectives split across units:** <<WHICH BULLETS OF THIS UNIT'S OBJECTIVES ARE TAUGHT IN OTHER UNITS, AND WHERE>>
- **Known problems in the reading:** <<FROM THIS EXAM'S SECTION OF docs/CONTENT-NOTES.md AND YOUR OWN READING, OR "none known">>

## Your items

<<THE ITEMS THIS AGENT MAPS, BY NUMBER: a run of pool items ("CertMaster 2.0 Q1 to Q30"), practice exam items ("Messer B44", "Practice Tests 1 Q33"), items carried over from earlier units in this exam's section of docs/CONTENT-NOTES.md. Leave out every item an existing pack of this exam already names in origin.basedOn (pool item names repeat across exams).>>

You may write only your output file. Never edit anything else.

## Rules (Mr. Flauto's, binding)

1. **The reading decides the answer.** The pool has no key, and the practice exam (Messer, or the Network+ practice exam book) is a different book. Key every item from the reading section that answers it. Where the reading disagrees with the item, with the practice exam's key, or with Mr. Flauto's key, the reading wins: flag the disagreement and say exactly what each side says.
2. **Known problems.** Key nothing to a point listed under "Known problems in the reading", and flag any item that depends on one. If you find a new contradiction or plain error in the reading, report it the same way.
3. **An item belongs to the unit whose reading answers it.** An item is usable here only if one of this unit's sections settles the answer. If another unit's section settles it, give that section (`other-unit`). If no section anywhere settles it, say so (`no-reading`) and name the nearest section. Search all of `SP\text\` before you decide.
4. **Usable also means plain multiple choice.** Skip performance-based items (Messer A1 to A5, B1 to B5, C1 to C5) and anything that needs a picture (the Network+ practice exam index flags those `figure`).
5. **Tag as specifically as you can:** the CompTIA objective plus its best-fitting bullet (`["3.4", "3.4.c"]`). If no bullet fits, tag the objective alone. Tag two bullets only when the item tests both equally. Never borrow a bullet that does not fit.
6. **The find phrase** is 3 to 6 consecutive words copied from ONE line of `SP\text\<section>.raw.txt`, taken from the sentence that answers the item.
   - It must not cross a line break or a page break, and must not include a word hyphenated across two lines.
   - Prefer words that appear on only one line of the section. Never use a page header or footer line.
   - Also copy that whole line exactly as it is in the file (`findLine`), so the phrase can be checked by machine.
7. **Name items exactly:** "CertMaster 3.0 Q41", "Messer B44", "Practice Tests 1 Q33", "Study Guide 3.0 Q56", "Review 2.0-3.0 slide 85".
8. **One fact per item.** State in one plain sentence the single fact the item tests, so items that test the same fact with the same answer can be merged (`sameFactAs`).
9. **"Select all that apply", "Select two", and "Select three"** items, and the practice exam's "Choose all that apply", "Choose two", and "Choose three": give every option the reading supports as correct. The index's `answers` column is the book's key count; go by it when the stem's wording disagrees.

## Return

Write one record per item as JSON, `{ "items": [ ... ] }`, to `<<OUTPUT FILE, for example SP\map\pool-Q1-Q25.json>>` with the Write tool, and reply with only the counts by status. The fields:

| Field | Value |
|---|---|
| `item` | "CertMaster 2.0 Q14" |
| `status` | `usable`, `other-unit`, `no-reading`, or `skip` |
| `section` | The section that settles it (for `no-reading`, the nearest one) |
| `answerLetters`, `answerText` | The key from the reading, as the item's own letters and text |
| `objective`, `bullets` | `"2.5"`, `["2.5.b"]` |
| `findPhrase`, `findLine` | See rule 6 |
| `fact` | One sentence |
| `sameFactAs` | Other items in your share that test the same fact with the same answer |
| `readingDisagrees`, `disagreeNote` | `true` and what each side says, or `false` and `""` |
| `bookKey` | For a practice exam item (Messer or the Network+ book), the book's letter(s) |
| `skipReason` | For `skip` and `no-reading`, a few words |
| `confidence` | `high`, `medium`, or `low` |
| `notes` | Anything Mr. Flauto should know |
