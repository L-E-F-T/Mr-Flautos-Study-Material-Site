<#
  extract-aids.ps1
  Mr. Flauto's own materials for one unit, as text: lesson decks, review decks, Blookets, and the unit
  study guide with its key. They corroborate keys and show which terms he stresses. They never set
  weight (see docs/CONTENT-HANDOFF.md).

    powershell -ExecutionPolicy Bypass -File extract-aids.ps1 -Scratch "<scratchpad>" -Exam a-plus-core-1 -Unit 2
    powershell -ExecutionPolicy Bypass -File extract-aids.ps1 -Scratch "<scratchpad>" -Exam network-plus -Unit 6
    powershell -ExecutionPolicy Bypass -File extract-aids.ps1 -Scratch "<scratchpad>" -Exam security-plus -Unit 8

  -Exam is required and picks the course folder and the file-name prefix: a-plus-core-1 (Core 1, "A+"),
  network-plus (CompTIANet+, "Net+"), or security-plus (CompTIASec+, "Sec+"). -CourseDir and -Prefix
  override them.

  It reads only the top level of Slides, Activites (his spelling) or Activities, Blookets or Blooket,
  and Study Guides, plus the one Study Guides folder named for the unit ("Net+ Unit 6.0 Review"), so it
  never opens graded work in any other subfolder (Tests, Assignments, Projects, "2.0 Take Home",
  Study Guides\Documents). It also skips any file or folder whose name looks like graded work.

  Writes, under -Scratch\aids:
    <deck>.txt              slide text, one "--- slide N ---" block per slide (review decks hold his practice items)
    <blooket>.csv           copied as is
    <study guide>.txt       pdftotext -layout (keeps tables and columns)
    <study guide>.flow.txt  pdftotext without -layout (easier to read as prose)
    <study guide>.tex       Network+ and Security+: every .tex file in the unit's study guide folder,
                            copied as is (the study guide's source marks every correct choice
                            \CorrectChoice; Security+ names it like unit8-review.tex, beside its
                            preamble.tex)
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [Parameter(Mandatory = $true)][int]$Unit,
  [ValidateSet('a-plus-core-1', 'network-plus', 'security-plus')][string]$Exam,
  [string]$CourseDir,
  [string]$Prefix
)
$ErrorActionPreference = 'Stop'
if (-not $Exam) { throw 'extract-aids.ps1 needs -Exam a-plus-core-1, -Exam network-plus, or -Exam security-plus.' }
$presets = @{
  'a-plus-core-1' = @{ CourseDir = 'CompTIAA+\Core 1'; Prefix = 'A+' }
  'network-plus'  = @{ CourseDir = 'CompTIANet+'; Prefix = 'Net+' }
  'security-plus' = @{ CourseDir = 'CompTIASec+'; Prefix = 'Sec+' }
}
if (-not $PSBoundParameters.ContainsKey('CourseDir')) { $CourseDir = Join-Path $env:OneDriveCommercial "Documents\$($presets[$Exam].CourseDir)" }
if (-not $PSBoundParameters.ContainsKey('Prefix')) { $Prefix = $presets[$Exam].Prefix }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$utf8 = New-Object System.Text.UTF8Encoding($false)
$out = Join-Path $Scratch 'aids'
New-Item -ItemType Directory -Force $out | Out-Null
# "Form" is left out on purpose: deck names such as "Form Factors" would match it.
$graded = '(?i)\b(test|quiz|exam|assignment|project|virtual day|take home)s?\b'
# Some file names drop the plus ("A 2.0 Installing ... Blooket.csv", "Sec 4.0 Review Blooket.csv").
$p = [regex]::Escape($Prefix.TrimEnd('+')) + '\+?'

function Test-NamesUnit([string]$name, [int]$u) {
  # "A+ 2.1 Motherboards.pptx", "A+ 5.2.6-5.3.5 Networking Hardware.pptx", "Net+ 4.1.3 ARP Primer.pptx",
  # "A+ Unit 6.0 Review.pptx", "A+ Units 2.0-3.0 Review.pptx"
  if ($name -match "^$p $u\.\d+[\s.-]") { return $true }
  foreach ($m in [regex]::Matches($name, 'Units?\s+(\d+)\.0(?:\s*-\s*(\d+)\.0)?')) {
    $lo = [int]$m.Groups[1].Value; $hi = if ($m.Groups[2].Success) { [int]$m.Groups[2].Value } else { $lo }
    if ($u -ge $lo -and $u -le $hi) { return $true }
  }
  return $false
}

function Get-PptxText([string]$path) {
  $zip = [IO.Compression.ZipFile]::OpenRead($path)
  try {
    $slides = $zip.Entries | Where-Object { $_.FullName -match '^ppt/slides/slide(\d+)\.xml$' } |
      Sort-Object { [int]([regex]::Match($_.FullName, '(\d+)\.xml$').Groups[1].Value) }
    $sb = New-Object System.Text.StringBuilder
    foreach ($e in $slides) {
      $r = New-Object IO.StreamReader($e.Open()); $xml = $r.ReadToEnd(); $r.Close()
      $n = [regex]::Match($e.FullName, '(\d+)\.xml$').Groups[1].Value
      $paras = [regex]::Matches($xml, '<a:p>.*?</a:p>|<a:p .*?</a:p>', 'Singleline') | ForEach-Object {
        (([regex]::Matches($_.Value, '<a:t>(.*?)</a:t>') | ForEach-Object { $_.Groups[1].Value }) -join '')
      } | Where-Object { $_.Trim() }
      [void]$sb.AppendLine("--- slide $n ---")
      foreach ($para in $paras) { [void]$sb.AppendLine([Net.WebUtility]::HtmlDecode($para)) }
    }
    $sb.ToString()
  } finally { $zip.Dispose() }
}

function Get-TopFiles([string]$folder, [string]$filter) {
  $dir = Join-Path $CourseDir $folder
  if (-not (Test-Path -LiteralPath $dir)) { return @() }
  Get-ChildItem -LiteralPath $dir -Filter $filter -File | Where-Object { Test-NamesUnit $_.Name $Unit }
}

$found = 0
foreach ($f in Get-TopFiles 'Slides' '*.pptx') {
  if ($f.Name -match $graded) { "Skipped (looks like graded work): $($f.Name)"; continue }
  [IO.File]::WriteAllText((Join-Path $out ($f.BaseName + '.txt')), (Get-PptxText $f.FullName), $utf8)
  "Deck: $($f.Name)"; $found++
}
foreach ($folder in 'Activites', 'Activities', 'Blookets', 'Blooket') {
  foreach ($f in Get-TopFiles $folder '*.csv') {
    if ($f.Name -match $graded) { "Skipped (looks like graded work): $($f.Name)"; continue }
    Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $out $f.Name) -Force
    "Blooket: $($f.Name)"; $found++
  }
}
# A+ keeps its study guides at the top of Study Guides. Network+ and Security+ give each unit a folder of
# its own ("Net+ Unit 6.0 Review", "Sec+ Unit 8.0 Review", with the .tex source next to the PDFs): only
# that folder's PDFs are read, and every .tex file in it is copied (Security+'s source is unit8-review.tex,
# a name that does not say "Unit 8.0").
$guides = @(Get-TopFiles 'Study Guides' '*.pdf')
$sgDir = Join-Path $CourseDir 'Study Guides'
if (Test-Path -LiteralPath $sgDir) {
  foreach ($d in Get-ChildItem -LiteralPath $sgDir -Directory) {
    if ($d.Name -notmatch "^$p Units? \d+\.0(?:\s*-\s*\d+\.0)? Review$" -or -not (Test-NamesUnit $d.Name $Unit)) { continue }
    if ($d.Name -match $graded) { "Skipped (looks like graded work): $($d.Name)"; continue }
    $guides += @(Get-ChildItem -LiteralPath $d.FullName -Filter *.pdf -File | Where-Object { Test-NamesUnit $_.Name $Unit })
    # Its .tex source marks every correct choice \CorrectChoice: the key in a form an agent can read.
    foreach ($t in @(Get-ChildItem -LiteralPath $d.FullName -Filter *.tex -File)) {
      if ($t.Name -match $graded) { "Skipped (looks like graded work): $($t.Name)"; continue }
      Copy-Item -LiteralPath $t.FullName -Destination (Join-Path $out $t.Name) -Force; "Study guide source: $($t.Name)"; $found++
    }
  }
}
foreach ($f in $guides) {
  if ($f.Name -match $graded) { "Skipped (looks like graded work): $($f.Name)"; continue }
  & pdftotext -layout -enc UTF-8 $f.FullName (Join-Path $out ($f.BaseName + '.txt'))
  & pdftotext -enc UTF-8 $f.FullName (Join-Path $out ($f.BaseName + '.flow.txt'))
  "Study guide: $($f.Name)"; $found++
}
"Files found for Unit ${Unit}.0: $found (in $out)"
