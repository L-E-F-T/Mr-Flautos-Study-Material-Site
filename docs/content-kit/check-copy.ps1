<#
  check-copy.ps1
  Confirms that the packs in data/ are exact copies of the packs the checkers saw. The packs are copied
  into data/ by hand with the Write and Edit tools, and a changed letter or word there is still valid
  content, so the content check would never notice it. Read-only.

    powershell -NoProfile -ExecutionPolicy Bypass -File check-copy.ps1 -Scratch "<scratchpad>" -Unit 2.0

  Compares data\...\questions\unit-NN.json with packs\unit-NN.questions.json, and the flashcard pack with
  packs\unit-NN.flashcards.json, line by line and case by case (line endings and a final newline are
  ignored). Prints "identical" for each, or every line that differs, and exits 1 if any differ.
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [Parameter(Mandatory = $true)][string]$Unit,
  [string]$Data = 'C:\CompTIA Website\data\a-plus-core-1'
)
$ErrorActionPreference = 'Stop'
$nn = ($Unit -split '\.')[0].PadLeft(2, '0')
function Get-Lines([string]$path) { @(([IO.File]::ReadAllText($path, [Text.Encoding]::UTF8) -replace "`r", '').TrimEnd("`n") -split "`n") }
$bad = 0
foreach ($pair in @(
    @{ name = 'questions'; site = "$Data\questions\unit-$nn.json"; built = "$Scratch\packs\unit-$nn.questions.json" },
    @{ name = 'flashcards'; site = "$Data\flashcards\unit-$nn.json"; built = "$Scratch\packs\unit-$nn.flashcards.json" })) {
  if (-not (Test-Path -LiteralPath $pair.built)) { "$($pair.name): no assembled pack at $($pair.built)"; $bad++; continue }
  if (-not (Test-Path -LiteralPath $pair.site)) { "$($pair.name): not in the site yet ($($pair.site))"; $bad++; continue }
  $a = Get-Lines $pair.site; $b = Get-Lines $pair.built
  $diffs = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt [Math]::Max($a.Count, $b.Count); $i++) {
    $x = if ($i -lt $a.Count) { $a[$i] } else { '<missing>' }
    $y = if ($i -lt $b.Count) { $b[$i] } else { '<missing>' }
    if (-not [string]::Equals($x, $y, [StringComparison]::Ordinal)) { $diffs.Add("  line $($i + 1)`n    site:      $x`n    assembled: $y") }
  }
  if ($diffs.Count -eq 0) { "$($pair.name): identical ($($a.Count) lines)" }
  else {
    $bad++
    "$($pair.name): $($diffs.Count) lines differ (site $($a.Count) lines, assembled $($b.Count))"
    $diffs | Select-Object -First 20
    if ($diffs.Count -gt 20) { "  ... and $($diffs.Count - 20) more" }
  }
}
if ($bad) { exit 1 }
