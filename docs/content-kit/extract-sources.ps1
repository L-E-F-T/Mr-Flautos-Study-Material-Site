<#
  extract-sources.ps1
  Pulls one exam's sources into a content chat's scratchpad as text. It reads the teacher's OneDrive
  and writes only under -Scratch. Run it once at the start of a chat.

    powershell -ExecutionPolicy Bypass -File extract-sources.ps1 -Scratch "<scratchpad>" -Exam a-plus-core-1
    powershell -ExecutionPolicy Bypass -File extract-sources.ps1 -Scratch "<scratchpad>" -Exam network-plus
    powershell -ExecutionPolicy Bypass -File extract-sources.ps1 -Scratch "<scratchpad>" -Exam security-plus

  -Exam is required and picks one exam's folders and books: a-plus-core-1, network-plus, or security-plus. To change
  one setting, pass -CourseDir, -ModulesDir, -PoolDir, -MesserBook, -PracticeBook, -ExamCode, or
  -ExamDetails ('' turns that source off). -ModulesDir, -PoolDir, the books, and -ExamDetails are
  relative to -CourseDir; -PracticeBook is a file name or a wildcard pattern (the first match is read).
  A+ Core 1's section PDFs moved from Core 1\Modules to CompTIAA+\Book\bySubunit in November 2026.

  The reading is the source of truth: every item from every source is keyed from it. Questions are
  modeled on the CertMaster pool and the exam's keyed practice exam (A+ Core 1 and Security+: Messer;
  Network+: the N10-009 practice tests book, -PracticeBook), whose items also show what the exam asks. A book's key
  is checked against the reading like any other (docs/CONTENT-GUIDE.md, "Where questions come from").

  Writes, under -Scratch:
    text\<section>.raw.txt    pdftotext -layout of each reading-section PDF. Page breaks are form feeds.
                              Find phrases are checked against these.
    text\<section>.txt        The same text with each page break shown as a line <<<PAGE BREAK>>>.
                              Read and cite from these.
    text\_index.csv           Section id, page count, PDF name.
    pool\<file>.txt           Each CertMaster pool file with its items numbered "=== CertMaster 3.0 Q41 ===".
                              Numbering follows the guide: count the lines that read "answer". Network+'s
                              All.txt (its unit files joined) is skipped.
    pool\All.txt              Security+ only: All.txt numbered the same way, after the unit files
                              ("=== CertMaster All Q679 ==="). An item that repeats a unit file's item
                              is that item: it shows only its header and the name it keeps.
    pool\All-repeats.tsv      Security+ only: item, sameAs, differs. One line for each All.txt item that
                              repeats an item of a unit file (or of All.txt), with the name it keeps and
                              what differs apart from spacing (-, choice order, punctuation).
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
                              Security+: the SY0-701 Exam Objectives PDF, which prints the objectives,
                              the domain weights, and the exam details.
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [ValidateSet('a-plus-core-1', 'network-plus', 'security-plus')][string]$Exam,
  [string]$CourseDir,
  [string]$ModulesDir,
  [string]$PoolDir,
  [string]$MesserBook,
  [string]$PracticeBook,
  [string]$ExamCode,
  [string]$ExamDetails
)
$ErrorActionPreference = 'Stop'
if (-not $Exam) { throw 'extract-sources.ps1 needs -Exam a-plus-core-1, -Exam network-plus, or -Exam security-plus.' }
# Each exam's folders and books. CourseDir is under the OneDrive Documents folder; a parameter given on
# the command line wins over its preset. The practice exam book is found by a pattern, so no author's
# name is in this repository. NumberAll numbers the pool's All.txt too (Security+ only, on Mr. Flauto's
# word of 2026-11-26); it has no parameter.
$presets = @{
  'a-plus-core-1' = @{ CourseDir = 'CompTIAA+\Core 1'; ModulesDir = '..\Book\bySubunit'; PoolDir = 'Certmaster Questions'
    MesserBook = 'professor-messer-a-plus-220-1201-core-1-practice-exams-v112.pdf'; PracticeBook = ''
    ExamCode = '220-1201'; ExamDetails = 'A+Core1ExamDetails.pdf'; NumberAll = $false }
  'network-plus' = @{ CourseDir = 'CompTIANet+'; ModulesDir = 'Book\bySubunit'; PoolDir = 'Certmaster Questions'
    MesserBook = ''; PracticeBook = 'CompTIA-Network-Practice-Tests*N10-009*.pdf'
    ExamCode = 'N10-009'; ExamDetails = 'Book\bySubunit\B.1.2 Exam Details for CompTIA Network+ N10-009.pdf'; NumberAll = $false }
  # The objectives PDF was downloaded from comptia.org on Mr. Flauto's word (2026-11-21), under CompTIA's name.
  'security-plus' = @{ CourseDir = 'CompTIASec+'; ModulesDir = 'Book\bySubunit'; PoolDir = 'Certmaster Questions'
    MesserBook = 'professor-messer-sy0-701-comptia-security-plus-practice-exams-v18.pdf'; PracticeBook = ''
    ExamCode = 'SY0-701'; ExamDetails = 'CompTIA Security+ SY0-701 Exam Objectives (7.0).pdf'; NumberAll = $true }
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
  # A pool file's items, each numbered by its "answer" line (docs/CONTENT-GUIDE.md, "Numbering source
  # items"): its stem (the lines since the last "Select Question" line) and its choices (a letter line,
  # A to J, then the choice's text). noAnswer counts the "Select Question" blocks with no "answer" line
  # (matching or drag-and-drop items, which get no number).
  function Read-Pool([string]$path) {
    $lines = [IO.File]::ReadAllLines($path, [Text.Encoding]::UTF8)
    $items = New-Object System.Collections.Generic.List[object]
    $stem = New-Object System.Collections.Generic.List[string]
    $n = 0; $i = 0; $afterSelect = $false; $selects = 0; $selected = 0
    while ($i -lt $lines.Count) {
      $ln = $lines[$i].Trim()
      if ($ln -eq 'answer') {
        $n++
        if ($afterSelect) { $selected++ }
        $opts = New-Object System.Collections.Generic.List[string]
        # The lines after the last choice. They are the next item's stem when its "answer" line comes
        # with no "Select Question" line before it (Security+ 1.0 + 2.0.txt Q15).
        $after = New-Object System.Collections.Generic.List[string]
        $atAnswer = $false; $afterSelect = $false
        $i++
        while ($i -lt $lines.Count) {
          $l2 = $lines[$i].Trim()
          if ($l2 -eq 'Select Question') { $selects++; $afterSelect = $true; break }
          if ($l2 -eq 'answer') { $atAnswer = $true; break }
          # Up to J: Network+ 4.0 Q224 ("Select four") runs to I.
          if ($l2 -cmatch '^[A-J]$') {
            $letter = $l2; $i++
            while ($i -lt $lines.Count -and $lines[$i].Trim() -eq '') { $i++ }
            if ($i -lt $lines.Count) { $opts.Add("$letter) " + $lines[$i].Trim()) }
            $after.Clear()
          } elseif ($l2 -ne '') { $after.Add($l2) }
          $i++
        }
        $items.Add([pscustomobject]@{ n = $n; stem = ($stem -join "`n").Trim(); choices = $opts.ToArray() })
        $stem.Clear()
        # The outer loop reads that "answer" line next.
        if ($atAnswer) { $stem.AddRange($after); continue }
      } elseif ($ln -eq 'Select Question') { $selects++; $afterSelect = $true; $stem.Clear() }
      elseif ($ln -ne '') { $stem.Add($ln) }
      $i++
    }
    [pscustomobject]@{ items = $items; noAnswer = $selects - $selected }
  }
  function Add-PoolItem($sb, [string]$label, $it) {
    [void]$sb.AppendLine("=== $label ===")
    [void]$sb.AppendLine($it.stem)
    foreach ($o in $it.choices) { [void]$sb.AppendLine($o) }
    [void]$sb.AppendLine()
  }
  # Security+ writes "(Select the two best options.)", and some items "(Select the best two options.)".
  function Get-Multi($items) { @($items | Where-Object { $_.stem -match 'Select (?:the )?(?:best )?(two|three|four|all that apply)' }).Count }
  # An item's words, to find the All.txt item that repeats it: the stem and the set of choices, in lower
  # case, with every run of spaces and punctuation read as one space. All.txt prints some of Security+'s
  # unit items with their choices in another order (1.0 + 2.0.txt, 3.0.txt) or with a question mark that
  # the unit file leaves off (11.0.txt).
  function Get-Words([string]$s) { ($s -replace '[^\p{L}\p{N}]+', ' ').Trim().ToLowerInvariant() }
  function Get-ItemKey($it) { (@(Get-Words $it.stem) + @($it.choices | ForEach-Object { Get-Words $_.Substring(3) } | Sort-Object)) -join "`n" }
  # What else tells a repeat from its unit item, apart from spacing: for the README and the repeat list.
  function Get-Spaced($it) { @(@($it.stem) + @($it.choices | ForEach-Object { $_.Substring(3) }) | ForEach-Object { ($_ -replace '\s+', ' ').Trim() }) }
  function Get-Difference($a, $b) {
    $x = @(Get-Spaced $a); $y = @(Get-Spaced $b)
    if (($x -join "`n") -ceq ($y -join "`n")) { return '-' }
    $order = (($x[0..0] + @($x | Select-Object -Skip 1 | Sort-Object)) -join "`n") -ceq (($y[0..0] + @($y | Select-Object -Skip 1 | Sort-Object)) -join "`n")
    if ($order) { return 'choice order' }
    if ((@($x | ForEach-Object { Get-Words $_ }) -join "`n") -eq (@($y | ForEach-Object { Get-Words $_ }) -join "`n")) { return 'punctuation' }
    'choice order, punctuation'
  }
  $allFile = $null
  $unitByKey = @{}; $unitTwins = New-Object System.Collections.Generic.List[string]; $unitCount = 0
  foreach ($file in Get-ChildItem -LiteralPath $pools -Filter *.txt -File) {
    $name = $file.BaseName
    # Network+ also has All.txt, its unit files joined, and its items are numbered from the unit files only.
    # Security+'s All.txt holds 1,135 items, three times its unit files: it is numbered after them (NumberAll).
    if ($name -eq 'All') {
      if ($NumberAll) { $allFile = $file; continue }
      'Pool All: skipped (every unit file again in one; items are numbered from the unit files)'; continue
    }
    $items = (Read-Pool $file.FullName).items
    $sb = New-Object System.Text.StringBuilder
    foreach ($it in $items) { Add-PoolItem $sb "CertMaster $name Q$($it.n)" $it }
    [IO.File]::WriteAllText((Join-Path $poolOut "$name.txt"), $sb.ToString(), $utf8)
    "Pool ${name}: $($items.Count) items ($(Get-Multi $items) say select two, three, or all that apply)"
    if ($NumberAll) {
      foreach ($it in $items) {
        $unitCount++
        $k = Get-ItemKey $it; $label = "CertMaster $name Q$($it.n)"
        if ($unitByKey.ContainsKey($k)) { $unitTwins.Add("$label is $($unitByKey[$k].label)") }
        else { $unitByKey[$k] = [pscustomobject]@{ label = $label; file = $name; item = $it; copies = New-Object System.Collections.Generic.List[string] } }
      }
    }
  }
  # Security+'s All.txt. Its items are numbered as in a unit file ("CertMaster All Q679"). An item that
  # repeats a unit file's item (the same stem and choices, in any order, allowing for spacing, capitals,
  # and punctuation) is that item and keeps its name ("CertMaster 8.0 Q12"; docs/CONTENT-GUIDE.md,
  # "Numbering source items"): pool\All.txt gives it only its header and that name, and
  # pool\All-repeats.tsv lists every such item. A second copy inside All.txt is named by its first copy.
  if ($NumberAll -and -not $allFile) { "Pool All: no All.txt in $pools" }
  if ($allFile) {
    $read = Read-Pool $allFile.FullName
    $items = $read.items
    $sb = New-Object System.Text.StringBuilder
    $rows = New-Object System.Collections.Generic.List[string]
    $rows.Add("item`tsameAs`tdiffers")
    $allByKey = @{}; $inside = New-Object System.Collections.Generic.List[string]
    $only = 0; $kinds = @{}
    foreach ($it in $items) {
      $label = "CertMaster All Q$($it.n)"
      $k = Get-ItemKey $it
      $same = $null; $differs = '-'
      if ($unitByKey.ContainsKey($k)) {
        $u = $unitByKey[$k]; $u.copies.Add($label)
        $same = $u.label; $differs = Get-Difference $u.item $it
      } elseif ($allByKey.ContainsKey($k)) {
        $same = $allByKey[$k].label; $differs = Get-Difference $allByKey[$k].item $it
        $inside.Add("$label is $same")
      } else { $allByKey[$k] = [pscustomobject]@{ label = $label; item = $it } }
      if ($same) {
        [void]$sb.AppendLine("=== $label ===")
        [void]$sb.AppendLine("Repeats $same, the same source item: it keeps that name.")
        [void]$sb.AppendLine()
        $rows.Add("$label`t$same`t$differs")
        $kinds[$differs] = 1 + [int]$kinds[$differs]
      } else { Add-PoolItem $sb $label $it; $only++ }
    }
    [IO.File]::WriteAllText((Join-Path $poolOut 'All.txt'), $sb.ToString(), $utf8)
    [IO.File]::WriteAllLines((Join-Path $poolOut 'All-repeats.tsv'), $rows, $utf8)
    $repeats = $rows.Count - 1
    $unrepeated = @($unitByKey.Values | Where-Object { $_.copies.Count -eq 0 } | ForEach-Object { $_.label })
    $twice = @($unitByKey.Values | Where-Object { $_.copies.Count -gt 1 } | ForEach-Object { "$($_.label) ($($_.copies -join ', '))" })
    "Pool All: $($items.Count) items ($(Get-Multi $items) say select two, three, or all that apply), CertMaster All Q1 to Q$($items.Count)"
    "Pool All: $repeats repeat an item of a unit file or of All.txt and keep its name (pool\All-repeats.tsv), $only are only in All.txt; $repeats + $only = $($repeats + $only)"
    "Pool All: what else differs in a repeat: " + (($kinds.Keys | Sort-Object | ForEach-Object { "$(if ($_ -eq '-') { 'nothing' } else { $_ }) $($kinds[$_])" }) -join ', ')
    "Pool All: copies inside All.txt: " + $(if ($inside.Count) { $inside -join '; ' } else { 'none' })
    "Pool All: blocks with no answer line (not numbered): $($read.noAnswer)"
    "Pool All: unit file items ($unitCount) that All.txt does not repeat: " + $(if ($unrepeated.Count) { $unrepeated -join ', ' } else { 'none' })
    "Pool All: unit file items that All.txt repeats more than once: " + $(if ($twice.Count) { $twice -join '; ' } else { 'none' })
    "Pool All: unit file items that repeat another unit file's item: " + $(if ($unitTwins.Count) { $unitTwins -join '; ' } else { 'none' })
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
  # SY0-701 prints one label with no space ("C25.A network IPS ..."): a capital letter may follow the dot.
  $labelRx = '^([A-C]\d{1,2})\.(?:\s+|(?=[A-Z]))\S.{3,}'
  # Most objective lines read "220-1201, Objective 1.2 - Topic". SY0-701 also prints "Assorted topics in
  # Objective 1.4 - ...", "Section 3.2 videos - ...", "Objective 4.9- ...", and "Objective 1.2" with the
  # topic on the next line. It prints one objective line, C86's, under the old exam code ("SY0-601,
  # Objective 1.4 - Blockchain Technology"; its link is a 701 one), so SY0-601 counts there too.
  $codeRx = if ($ExamCode -eq 'SY0-701') { 'SY0-[67]01' } else { [regex]::Escape($ExamCode) }
  $objRx = '^' + $codeRx + ',?\s*-?\s*(?:Assorted topics in )?(?:Objective|Section) (\d\.\d+)(?: videos)?(?:\s*-\s*(.+))?$'
  # Option lines start with a checkbox glyph: "<glyph> A. text" becomes "A. text".
  function Clear-Line([string]$s) { ($s -replace "`f", '') -replace '^[^\w"(\[]+\s*([A-F])\.\s', '$1. ' }
  # The questions come first and the answers later, both under the same labels. Only an answer block
  # ends in an objective line, so the answer block is the one kept.
  $page = 1; $cur = $null; $curPage = 0; $buf = $null; $topicNext = $false
  $blocks = @{}; $tsv = New-Object System.Collections.Generic.List[string]
  foreach ($x in $lines) {
    $page += ([regex]::Matches($x, "`f")).Count
    $y = Clear-Line $x
    if ($y -match $labelRx) { $cur = $matches[1]; $curPage = $page; $buf = New-Object System.Collections.Generic.List[string]; $topicNext = $false }
    if ($cur) { $buf.Add($y) }
    if ($topicNext -and $y.Trim()) {
      # The topic of an objective line that printed none ("SY0-701, Objective 1.2"), unless it is the link.
      $topicNext = $false
      if ($y -notmatch '^\s*https?://') { $tsv[$tsv.Count - 1] += $y.Trim(); $blocks[$cur] = ($buf -join "`n") }
    }
    elseif ($cur -and $y -match $objRx) {
      $blocks[$cur] = ($buf -join "`n"); $tsv.Add("$cur`tp$curPage`t$($matches[1])`t$($matches[2])")
      if (-not $matches[2]) { $topicNext = $true }
    }
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
  # order: the index flags it "exhibit", with the PDF page to read instead. ". . . ." is the dotted
  # leader of ipconfig /all output, which some stems print without saying "output shown".
  $exhibitRx = '(?i)\boutput shown\b|\bshown here\b|\bthe following output\b|\. \. \. \.'
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
