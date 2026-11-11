<#
  extract-aids.ps1
  Mr. Flauto's own materials for one unit, as text: lesson decks, review decks, Blookets, and the unit
  study guide with its key. They corroborate keys and show which terms he stresses. They never set
  weight (see docs/CONTENT-HANDOFF.md).

    powershell -ExecutionPolicy Bypass -File extract-aids.ps1 -Scratch "<scratchpad>" -Unit 2

  It reads only the top level of Slides, Activites (his spelling), and Study Guides, so it never opens
  graded work in a subfolder (Tests, Assignments, Projects, "2.0 Take Home", Study Guides\Documents).
  It also skips any file whose name looks like graded work.

  Writes, under -Scratch\aids:
    <deck>.txt              slide text, one "--- slide N ---" block per slide (review decks hold his practice items)
    <blooket>.csv           copied as is
    <study guide>.txt       pdftotext -layout (keeps tables and columns)
    <study guide>.flow.txt  pdftotext without -layout (easier to read as prose)
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [Parameter(Mandatory = $true)][int]$Unit,
  [string]$CourseDir = (Join-Path $env:OneDriveCommercial 'Documents\CompTIAA+\Core 1'),
  [string]$Prefix = 'A+'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$utf8 = New-Object System.Text.UTF8Encoding($false)
$out = Join-Path $Scratch 'aids'
New-Item -ItemType Directory -Force $out | Out-Null
# "Form" is left out on purpose: deck names such as "Form Factors" would match it.
$graded = '(?i)\b(test|quiz|exam|assignment|project|virtual day|take home)s?\b'
$p = [regex]::Escape($Prefix)

function Test-NamesUnit([string]$name, [int]$u) {
  # "A+ 2.1 Motherboards.pptx", "A+ Unit 6.0 Review.pptx", "A+ Units 2.0-3.0 Review.pptx"
  if ($name -match "^$p $u\.\d+\s") { return $true }
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
foreach ($folder in 'Activites', 'Activities') {
  foreach ($f in Get-TopFiles $folder '*.csv') {
    if ($f.Name -match $graded) { "Skipped (looks like graded work): $($f.Name)"; continue }
    Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $out $f.Name) -Force
    "Blooket: $($f.Name)"; $found++
  }
}
foreach ($f in Get-TopFiles 'Study Guides' '*.pdf') {
  if ($f.Name -match $graded) { "Skipped (looks like graded work): $($f.Name)"; continue }
  & pdftotext -layout -enc UTF-8 $f.FullName (Join-Path $out ($f.BaseName + '.txt'))
  & pdftotext -enc UTF-8 $f.FullName (Join-Path $out ($f.BaseName + '.flow.txt'))
  "Study guide: $($f.Name)"; $found++
}
"Files found for Unit ${Unit}.0: $found (in $out)"
