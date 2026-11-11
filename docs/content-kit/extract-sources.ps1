<#
  extract-sources.ps1
  Pulls one course's sources into a content chat's scratchpad as text. It reads the teacher's OneDrive
  and writes only under -Scratch. Run it once at the start of a chat.

    powershell -ExecutionPolicy Bypass -File extract-sources.ps1 -Scratch "<scratchpad>"

  The defaults are A+ Core 1. For another course pass -CourseDir, -ModulesDir, -MesserBook, -ExamCode,
  and -ExamDetails (or '' when there is none).

  Writes, under -Scratch:
    text\<section>.raw.txt    pdftotext -layout of each reading-section PDF. Page breaks are form feeds.
                              Find phrases are checked against these.
    text\<section>.txt        The same text with each page break shown as a line <<<PAGE BREAK>>>.
                              Read and cite from these.
    text\_index.csv           Section id, page count, PDF name.
    pool\<file>.txt           Each CertMaster pool file with its items numbered "=== CertMaster 3.0 Q41 ===".
                              Numbering follows the guide: count the lines that read "answer".
    messer\<label>.txt        Each Messer item with the book's answer, explanation, and objective.
    messer-q\<label>.txt      The same item with no answer or explanation, for blind checks.
    messer\messer-<exam>.tsv  One line per objective tag: label, PDF page, objective, topic.
    examdetails.txt           The exam details PDF (domain weights, question types), if there is one.
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [string]$CourseDir   = (Join-Path $env:OneDriveCommercial 'Documents\CompTIAA+\Core 1'),
  [string]$ModulesDir  = 'Modules',
  [string]$PoolDir     = 'Certmaster Questions',
  [string]$MesserBook  = 'professor-messer-a-plus-220-1201-core-1-practice-exams-v112.pdf',
  [string]$ExamCode    = '220-1201',
  [string]$ExamDetails = 'A+Core1ExamDetails.pdf'
)
$ErrorActionPreference = 'Stop'
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
          if ($l2 -match '^[A-H]$') {
            $letter = $l2; $i++
            while ($i -lt $lines.Count -and $lines[$i].Trim() -eq '') { $i++ }
            if ($i -lt $lines.Count) { $opts.Add("$letter) " + $lines[$i].Trim()) }
          }
          $i++
        }
        $stemText = ($stem -join "`n").Trim()
        if ($stemText -match 'Select (two|three|all that apply)') { $multi++ }
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
$book = Join-Path $CourseDir $MesserBook
if ($MesserBook -and (Test-Path -LiteralPath $book)) {
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
} else { "No Messer book at $book" }

# ---- 4. Exam details ------------------------------------------------------------------------------
if ($ExamDetails) {
  $details = Join-Path $CourseDir $ExamDetails
  if (Test-Path -LiteralPath $details) { & pdftotext -layout -enc UTF-8 $details (Join-Path $Scratch 'examdetails.txt'); 'Exam details: examdetails.txt' }
  else { "No exam details PDF at $details" }
}
