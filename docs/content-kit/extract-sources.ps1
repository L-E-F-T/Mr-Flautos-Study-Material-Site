<#
  extract-sources.ps1
  Pulls one exam's sources into a content chat's scratchpad as text. It reads the teacher's OneDrive
  and writes only under -Scratch. Run it once at the start of a chat.

    powershell -ExecutionPolicy Bypass -File extract-sources.ps1 -Scratch "<scratchpad>" -Exam a-plus-core-1
    powershell -ExecutionPolicy Bypass -File extract-sources.ps1 -Scratch "<scratchpad>" -Exam network-plus

  -Exam is required and picks one exam's folders and books: a-plus-core-1 or network-plus. To change
  one setting, pass -CourseDir, -ModulesDir, -PoolDir, -MesserBook, -PracticeBook, -ExamCode, or
  -ExamDetails ('' turns that source off). -ModulesDir, -PoolDir, the books, and -ExamDetails are
  relative to -CourseDir; -PracticeBook is a file name or a wildcard pattern (the first match is read).
  A+ Core 1's section PDFs moved from Core 1\Modules to CompTIAA+\Book\bySubunit in November 2026.

  The reading is the source of truth: every item from every source is keyed from it. Questions are
  modeled on the CertMaster pool and the exam's keyed practice exam (A+ Core 1: Messer; Network+: the
  N10-009 practice tests book, -PracticeBook), whose items also show what the exam asks. A book's key
  is checked against the reading like any other (docs/CONTENT-GUIDE.md, "Where questions come from").

  Writes, under -Scratch:
    text\<section>.raw.txt    pdftotext -layout of each reading-section PDF. Page breaks are form feeds.
                              Find phrases are checked against these.
    text\<section>.txt        The same text with each page break shown as a line <<<PAGE BREAK>>>.
                              Read and cite from these.
    text\_index.csv           Section id, page count, PDF name.
    pool\<file>.txt           Each CertMaster pool file with its items numbered "=== CertMaster 3.0 Q41 ===".
                              Numbering follows the guide: count the lines that read "answer". All.txt
                              (every unit's items again, in one file) is skipped.
    messer\<label>.txt        Each Messer item with the book's answer, explanation, and objective.
    messer-q\<label>.txt      The same item with no answer or explanation, for blind checks.
    messer\messer-<exam>.tsv  One line per objective tag: label, PDF page, objective, topic.
    practice\1-Q33.txt        Network+ practice exam item "Practice Tests 1 Q33" (Chapter 1, question 33)
                              with the book's key and explanation.
    practice-q\1-Q33.txt      The same item with no key or explanation, for blind checks.
    practice\practice-<exam>.tsv  The practice exam index, one line per item under a header line: item,
                              PDF page, objective (the heading it is printed under; "-" in Chapters 6 and
                              7, the book's two full practice tests), answers (how many), choices (how
                              many), flags ("figure": it needs a picture; "exhibit": it prints a
                              command's output, whose columns may be out of order, so read that PDF
                              page; "all-that-apply"), and the start of the stem.
    examdetails.txt           The exam details PDF (domain weights, question types), if there is one.
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [ValidateSet('a-plus-core-1', 'network-plus')][string]$Exam,
  [string]$CourseDir,
  [string]$ModulesDir,
  [string]$PoolDir,
  [string]$MesserBook,
  [string]$PracticeBook,
  [string]$ExamCode,
  [string]$ExamDetails
)
$ErrorActionPreference = 'Stop'
if (-not $Exam) { throw 'extract-sources.ps1 needs -Exam a-plus-core-1 or -Exam network-plus.' }
# Each exam's folders and books. CourseDir is under the OneDrive Documents folder; a parameter given on
# the command line wins over its preset. The practice exam book is found by a pattern, so no author's
# name is in this repository.
$presets = @{
  'a-plus-core-1' = @{ CourseDir = 'CompTIAA+\Core 1'; ModulesDir = '..\Book\bySubunit'; PoolDir = 'Certmaster Questions'
    MesserBook = 'professor-messer-a-plus-220-1201-core-1-practice-exams-v112.pdf'; PracticeBook = ''
    ExamCode = '220-1201'; ExamDetails = 'A+Core1ExamDetails.pdf' }
  'network-plus' = @{ CourseDir = 'CompTIANet+'; ModulesDir = 'Book\bySubunit'; PoolDir = 'Certmaster Questions'
    MesserBook = ''; PracticeBook = 'CompTIA-Network-Practice-Tests*N10-009*.pdf'
    ExamCode = 'N10-009'; ExamDetails = 'Book\bySubunit\B.1.2 Exam Details for CompTIA Network+ N10-009.pdf' }
}
$preset = $presets[$Exam]
foreach ($k in @($preset.Keys)) { if (-not $PSBoundParameters.ContainsKey($k)) { Set-Variable -Name $k -Value $preset[$k] } }
if (-not $PSBoundParameters.ContainsKey('CourseDir')) { $CourseDir = Join-Path $env:OneDriveCommercial "Documents\$CourseDir" }
$utf8 = New-Object System.Text.UTF8Encoding($false)
if (-not (Get-Command pdftotext -ErrorAction SilentlyContinue)) { throw 'pdftotext was not found. It comes with MiKTeX.' }
function New-Dir([string]$path) { New-Item -ItemType Directory -Force $path | Out-Null; $path }
function Get-SortKey([string]$id) {
  if ($id -match '^\d+(\.\d+)*$') { (($id -split '\.') | ForEach-Object { $_.PadLeft(4, '0') }) -join '.' } else { "zzzz $id" }
}

# ---- 1. Reading sections: one text file per section PDF, named by its number -----------------------
$modules = Join-Path $CourseDir $ModulesDir
$textDir = New-Dir (Join-Path $Scratch 'text')
$index = foreach ($pdf in Get-ChildItem -LiteralPath $modules -Filter *.pdf -File) {
  $id = if ($pdf.BaseName -match '^(\d+(?:\.\d+)*)\s') { $matches[1] } else { $pdf.BaseName }
  $raw = Join-Path $textDir "$id.raw.txt"
  & pdftotext -layout -enc UTF-8 $pdf.FullName $raw
  $t = [IO.File]::ReadAllText($raw, [Text.Encoding]::UTF8)
  [IO.File]::WriteAllText((Join-Path $textDir "$id.txt"), ($t -replace "`f", "`n<<<PAGE BREAK>>>`n"), $utf8)
  [pscustomobject]@{ id = $id; pages = ([regex]::Matches($t, "`f")).Count; pdf = $pdf.Name }
}
$index | Sort-Object { Get-SortKey $_.id } | Export-Csv (Join-Path $textDir '_index.csv') -NoTypeInformation -Encoding UTF8
"Reading sections: $(@($index).Count) files in $textDir"

# ---- 2. CertMaster pools: number the items by counting "answer" lines ------------------------------
$pools = Join-Path $CourseDir $PoolDir
if (Test-Path -LiteralPath $pools) {
  $poolOut = New-Dir (Join-Path $Scratch 'pool')
  foreach ($file in Get-ChildItem -LiteralPath $pools -Filter *.txt -File) {
    $name = $file.BaseName
    # Network+ and Security+ also have All.txt, every unit's items again in one file. Items are numbered
    # from the unit files only (docs/CONTENT-HANDOFF.md).
    if ($name -eq 'All') { 'Pool All: skipped (every unit file again in one; items are numbered from the unit files)'; continue }
    $lines = [IO.File]::ReadAllLines($file.FullName, [Text.Encoding]::UTF8)
    $stem = New-Object System.Collections.Generic.List[string]
    $sb = New-Object System.Text.StringBuilder
    $n = 0; $multi = 0; $i = 0
    while ($i -lt $lines.Count) {
      $ln = $lines[$i].Trim()
      if ($ln -eq 'answer') {
        $n++
        $opts = New-Object System.Collections.Generic.List[string]
        $i++
        while ($i -lt $lines.Count) {
          $l2 = $lines[$i].Trim()
          if ($l2 -eq 'Select Question') { break }
          # Up to J: Network+ 4.0 Q224 ("Select four") runs to I.
          if ($l2 -cmatch '^[A-J]$') {
            $letter = $l2; $i++
            while ($i -lt $lines.Count -and $lines[$i].Trim() -eq '') { $i++ }
            if ($i -lt $lines.Count) { $opts.Add("$letter) " + $lines[$i].Trim()) }
          }
          $i++
        }
        $stemText = ($stem -join "`n").Trim()
        if ($stemText -match 'Select (two|three|four|all that apply)') { $multi++ }
        [void]$sb.AppendLine("=== CertMaster $name Q$n ===")
        [void]$sb.AppendLine($stemText)
        foreach ($o in $opts) { [void]$sb.AppendLine($o) }
        [void]$sb.AppendLine()
        $stem.Clear()
      } elseif ($ln -eq 'Select Question') { $stem.Clear() }
      elseif ($ln -ne '') { $stem.Add($ln) }
      $i++
    }
    [IO.File]::WriteAllText((Join-Path $poolOut "$name.txt"), $sb.ToString(), $utf8)
    "Pool ${name}: $n items ($multi say select two, three, or all that apply)"
  }
} else { "No pool folder at $pools" }

# ---- 3. Messer practice exams ------------------------------------------------------------------------
$book = if ($MesserBook) { Join-Path $CourseDir $MesserBook } else { '' }
if ($book -and (Test-Path -LiteralPath $book)) {
  $mDir = New-Dir (Join-Path $Scratch 'messer'); $qDir = New-Dir (Join-Path $Scratch 'messer-q')
  $rawFile = Join-Path $mDir '_book.raw.txt'
  # Through a file: capturing pdftotext's standard output garbles the non-ASCII characters.
  & pdftotext -enc UTF-8 $book $rawFile
  $lines = [IO.File]::ReadAllLines($rawFile, [Text.Encoding]::UTF8)
  $labelRx = '^([A-C]\d{1,2})\.\s+\S.{3,}'
  $objRx = '^' + [regex]::Escape($ExamCode) + ',?\s*-?\s*(?:Objective|Section) (\d\.\d+) - (.+)$'
  # Option lines start with a checkbox glyph: "<glyph> A. text" becomes "A. text".
  function Clear-Line([string]$s) { ($s -replace "`f", '') -replace '^[^\w"(\[]+\s*([A-F])\.\s', '$1. ' }
  # The questions come first and the answers later, both under the same labels. Only an answer block
  # ends in an objective line, so the answer block is the one kept.
  $page = 1; $cur = $null; $curPage = 0; $buf = $null
  $blocks = @{}; $tsv = New-Object System.Collections.Generic.List[string]
  foreach ($x in $lines) {
    $page += ([regex]::Matches($x, "`f")).Count
    $y = Clear-Line $x
    if ($y -match $labelRx) { $cur = $matches[1]; $curPage = $page; $buf = New-Object System.Collections.Generic.List[string] }
    if ($cur) { $buf.Add($y) }
    if ($cur -and $y -match $objRx) { $blocks[$cur] = ($buf -join "`n"); $tsv.Add("$cur`tp$curPage`t$($matches[1])`t$($matches[2])") }
  }
  [IO.File]::WriteAllLines((Join-Path $mDir "messer-$ExamCode.tsv"), $tsv, $utf8)
  $noKey = @()
  foreach ($k in $blocks.Keys) {
    [IO.File]::WriteAllText((Join-Path $mDir "$k.txt"), $blocks[$k], $utf8)
    $bl = $blocks[$k] -split "`n"
    $cut = -1
    for ($j = 0; $j -lt $bl.Count; $j++) { if ($bl[$j] -match '^\s*The Answers?:') { $cut = $j; break } }
    if ($cut -lt 1) { $noKey += $k; continue }
    [IO.File]::WriteAllText((Join-Path $qDir "$k.txt"), (($bl[0..($cut - 1)] -join "`n").Trim()), $utf8)
  }
  [IO.File]::WriteAllText((Join-Path $mDir '_book.txt'), (($lines | ForEach-Object { $_ -replace "`f", "`n<<<PAGE BREAK>>>`n" }) -join "`n"), $utf8)
  $labels = foreach ($e in 'A', 'B', 'C') { foreach ($q in 1..90) { "$e$q" } }
  $missing = @($labels | Where-Object { -not $blocks.ContainsKey($_) })
  "Messer: $($blocks.Count) items, $($tsv.Count) objective lines in messer-$ExamCode.tsv"
  "Messer labels missing: " + $(if ($missing.Count) { $missing -join ', ' } else { 'none' })
  "Messer items with no 'The Answer:' line (no blind copy): " + $(if ($noKey.Count) { $noKey -join ', ' } else { 'none' })
} elseif ($book) { "No Messer book at $book" } else { 'No Messer book for this exam' }

# ---- 4. Network+ practice exam (keyed): the N10-009 practice tests book ------------------------------
# The N10-009 practice tests book (CONTENT-GUIDE, "Each exam's keyed practice exam"), an EPUB printed to PDF. Chapters
# 1 to 5 follow the exam domains, with each question printed under an objective heading ("1.2 Compare
# and contrast ..."); Chapters 6 and 7 are the book's two full practice tests, with no headings.
# Questions are numbered through each chapter, and the keys and explanations are at the back under
# "Chapter 1: Networking Concepts" and so on. An item is named by the book's title, the chapter, and
# the question number (docs/CONTENT-GUIDE.md, "Numbering source items"): "Practice Tests 1 Q33".
$zBook = if ($PracticeBook) { [string](Get-ChildItem -LiteralPath $CourseDir -Filter $PracticeBook -File -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName) } else { '' }
if ($zBook -and (Test-Path -LiteralPath $zBook)) {
  $zDir = New-Dir (Join-Path $Scratch 'practice'); $zqDir = New-Dir (Join-Path $Scratch 'practice-q')
  $rawFile = Join-Path $zDir '_book.raw.txt'
  & pdftotext -enc UTF-8 $zBook $rawFile
  $lines = [IO.File]::ReadAllLines($rawFile, [Text.Encoding]::UTF8)
  $headRx = '^([1-5])\.(\d) (Explain|Compare and contrast|Summarize|Given a scenario)\b'
  $numRx = '^(\d{1,3})\.\s+(\S.*)$'
  $optRx = '^([A-J])\.\s+(\S.*)$'
  $keyRx = '^(\d{1,3})\.\s+([A-J](?:\s*,\s*[A-J])*)\.(?:\s+(.*))?$'
  # The PDF drops the hundreds digit of most question numbers, in the questions and in the keys: Q100
  # prints as "00." and Q271 as "71." (Q111 keeps it). A number counts as the next item either way.
  function Test-Next([string]$tok, [int]$next) { ($tok -eq [string]$next) -or ($next -ge 100 -and $tok -eq ('{0:D2}' -f ($next % 100))) }
  # Wrapped lines are joined into one. A numbered or bulleted line that starts after a sentence ends
  # ("as follows:", "...the wires.") keeps its own line; "port" + "4. The two..." is a wrapped line.
  # The bullets are built from their code points so this file stays ASCII (PowerShell 5.1 reads it as ANSI).
  $listRx = '^(\d{1,2}\.|[' + [char]0x25A0 + [char]0x2022 + '])\s'
  function Join-Lines($list) {
    $sb = New-Object System.Text.StringBuilder
    foreach ($l in $list) {
      $so = $sb.ToString()
      if ($sb.Length -eq 0) { [void]$sb.Append($l) }
      elseif ($l -match $listRx -and $so -match '[.:?!)]$') { [void]$sb.Append("`n$l") }
      elseif ($so -match '[A-Za-z]-$') { [void]$sb.Append($l) }
      else { [void]$sb.Append(" $l") }
    }
    $sb.ToString()
  }
  # A stem that prints a command's output keeps the book's lines. Its columns may still come out of
  # order: the index flags it "exhibit", with the PDF page to read instead.
  $exhibitRx = '(?i)\boutput shown\b|\bshown here\b|\bthe following output\b'
  $zItems = New-Object System.Collections.Generic.List[object]; $zByName = @{}
  $zOdd = New-Object System.Collections.Generic.List[string]
  $part = 'front'; $ch = 0; $obj = '-'; $n = 0; $cur = $null; $kch = 0; $kn = 0; $kcur = $null; $page = 1
  foreach ($x in $lines) {
    $page += ([regex]::Matches($x, "`f")).Count
    $y = ($x -replace "`f", '').Trim()
    if ($part -eq 'keys') {
      if ($y -ceq 'Index') { break }
      if ($y -cmatch '^Chapter ([1-9]): ') { $kch = [int]$matches[1]; $kn = 0; $kcur = $null; continue }
      if ($y -cmatch $keyRx -and (Test-Next $matches[1] ($kn + 1))) {
        $kn++; $kcur = $zByName["$kch Q$kn"]
        if (-not $kcur) { $zOdd.Add("Practice Tests $kch Q$kn"); continue }
        $kcur.key = ($matches[2] -split '\s*,\s*') -join ', '
        if ($matches[3]) { $kcur.why.Add($matches[3]) }
        continue
      }
      if ($kcur -and $y) { $kcur.why.Add($y) }
      continue
    }
    if ($y -cmatch '^Chapter ([1-9])$') { $part = 'questions'; $ch = [int]$matches[1]; $obj = '-'; $n = 0; $cur = $null; continue }
    if ($part -ne 'questions') { continue }
    if ($y -ceq 'Appendix' -or $y -ceq 'Answers to Review Questions') { $part = 'keys'; continue }
    # Each chapter opens with its objectives and their bullets; the questions follow under the same
    # headings. A heading ends the question before it.
    if ($ch -le 5 -and $y -cmatch $headRx -and [int]$matches[1] -eq $ch) { $obj = "$($matches[1]).$($matches[2])"; $cur = $null; continue }
    if ($y -cmatch $numRx -and (Test-Next $matches[1] ($n + 1))) {
      $n++
      $cur = [pscustomobject]@{
        name = "$ch Q$n"; objective = $(if ($ch -le 5) { $obj } else { '-' }); page = $page; key = ''
        stem = (New-Object System.Collections.Generic.List[string])
        choices = (New-Object System.Collections.Generic.List[string])
        why = (New-Object System.Collections.Generic.List[string])
      }
      $cur.stem.Add($matches[2]); $zItems.Add($cur); $zByName[$cur.name] = $cur
      continue
    }
    if (-not $cur -or -not $y) { continue }
    $want = [string][char](65 + $cur.choices.Count)
    if ($y -cmatch $optRx -and $matches[1] -ceq $want) { $cur.choices.Add("$want. $($matches[2])") }
    elseif ($cur.choices.Count) { $cur.choices[$cur.choices.Count - 1] = Join-Lines @($cur.choices[$cur.choices.Count - 1], $y) }
    else { $cur.stem.Add($y) }
  }
  $tsv = New-Object System.Collections.Generic.List[string]
  $tsv.Add("item`tpage`tobjective`tanswers`tchoices`tflags`tstem")
  $noKey = @(); $badKey = @(); $figure = 0; $exhibits = 0; $multi = 0
  foreach ($it in $zItems) {
    $label = "Practice Tests $($it.name)"
    $file = ($it.name -replace ' ', '-') + '.txt'
    $exhibit = ($it.stem -join ' ') -match $exhibitRx
    $stem = if ($exhibit) { $it.stem -join "`n" } else { Join-Lines $it.stem }
    $letters = @($it.choices | ForEach-Object { $_.Substring(0, 1) })
    $keys = @(if ($it.key) { $it.key -split ', ' })
    if (-not $keys.Count) { $noKey += $label }
    elseif (@($keys | Where-Object { $letters -cnotcontains $_ }).Count) { $badKey += $label }
    if ($keys.Count -gt 1) { $multi++ }
    $flags = @()
    if ($stem -match '\bfigure\b|\bgraphic\b') { $flags += 'figure'; $figure++ }
    if ($exhibit) { $flags += 'exhibit'; $exhibits++ }
    if ($stem -match 'all that apply') { $flags += 'all-that-apply' }
    $question = (@($label, $stem) + @($it.choices)) -join "`n"
    [IO.File]::WriteAllText((Join-Path $zqDir $file), $question, $utf8)
    $keyed = @("$label (objective $($it.objective), PDF page $($it.page))", $stem) + @($it.choices) +
      @("Book key: $($it.key)", "Book explanation: $(Join-Lines $it.why)")
    [IO.File]::WriteAllText((Join-Path $zDir $file), ($keyed -join "`n"), $utf8)
    $short = ($stem -replace '\s+', ' ')
    if ($short.Length -gt 100) { $short = $short.Substring(0, 100) }
    $tsv.Add("$label`tp$($it.page)`t$($it.objective)`t$($keys.Count)`t$($it.choices.Count)`t$($flags -join ',')`t$short")
  }
  [IO.File]::WriteAllLines((Join-Path $zDir "practice-$ExamCode.tsv"), $tsv, $utf8)
  [IO.File]::WriteAllText((Join-Path $zDir '_book.txt'), (($lines | ForEach-Object { $_ -replace "`f", "`n<<<PAGE BREAK>>>`n" }) -join "`n"), $utf8)
  $perChapter = ($zItems | Group-Object { ($_.name -split ' ')[0] } | ForEach-Object { "chapter $($_.Name): $($_.Count)" }) -join ', '
  $noObjective = @($zItems | Where-Object { $_.objective -eq '-' -and $_.name -match '^[1-5] ' }).Count
  "Practice exam: $($zItems.Count) items ($perChapter), one line each in practice-$ExamCode.tsv"
  "Practice exam items in Chapters 1 to 5 with no objective heading: $noObjective"
  "Practice exam items with no key at the back of the book: " + $(if ($noKey.Count) { $noKey -join ', ' } else { 'none' })
  "Practice exam items whose key is not one of their choices: " + $(if ($badKey.Count) { $badKey -join ', ' } else { 'none' })
  "Practice exam keys with no question: " + $(if ($zOdd.Count) { $zOdd -join ', ' } else { 'none' })
  "Practice exam items with two or more answers: $multi; that need a figure (flag 'figure'): $figure; that print a command's output (flag 'exhibit'): $exhibits"
} elseif ($PracticeBook) { "No practice exam book matching $PracticeBook in $CourseDir" }

# ---- 5. Exam details ------------------------------------------------------------------------------
if ($ExamDetails) {
  $details = Join-Path $CourseDir $ExamDetails
  if (Test-Path -LiteralPath $details) { & pdftotext -layout -enc UTF-8 $details (Join-Path $Scratch 'examdetails.txt'); 'Exam details: examdetails.txt' }
  else { "No exam details PDF at $details" }
}
