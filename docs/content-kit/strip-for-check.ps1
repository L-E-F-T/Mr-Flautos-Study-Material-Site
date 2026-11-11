<#
  strip-for-check.ps1
  Makes the blind copies the independent checkers work from, so no checker sees the key, the find
  phrase, the source item, or your reasoning. Run it after assemble.ps1.

    powershell -ExecutionPolicy Bypass -File strip-for-check.ps1 -Scratch "<scratchpad>" -Unit 2.0

  Reads packs\unit-NN.questions.json and packs\unit-NN.flashcards.json. Writes, under -Scratch\check:
    questions-blind.json  For each question: id, stem, choices, how many to choose, the cited sections,
                          and each objective and bullet with its title. No answer, find phrase, or origin.
    card-backs.json       For each card: id and back only. The checker names the term.
    card-terms.json       For each card: id, term, and cited section only. The checker writes the back.
  Optional -Only q005,q017 limits the question copy to those ids (for re-checking fixed items).
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [Parameter(Mandatory = $true)][string]$Unit,
  [string]$Data = 'C:\CompTIA Website\data\a-plus-core-1',
  [string[]]$Only = @()
)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Read-Json([string]$path) { [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8) | ConvertFrom-Json }
$nn = ($Unit -split '\.')[0].PadLeft(2, '0')
$objTitle = @{}
foreach ($d in (Read-Json "$Data\objectives.json").domains) { foreach ($o in $d.objectives) { $objTitle[$o.id] = $o.title; foreach ($b in $o.subobjectives) { $objTitle[$b.id] = $b.title } } }
$out = Join-Path $Scratch 'check'
New-Item -ItemType Directory -Force $out | Out-Null

$qs = (Read-Json "$Scratch\packs\unit-$nn.questions.json").questions
$Only = @($Only | ForEach-Object { $_ -split '[,\s]+' } | Where-Object { $_ })  # -File passes "q005,q019" as one string
if ($Only.Count) { $qs = @($qs | Where-Object { $id = $_.id; @($Only | Where-Object { $id.EndsWith($_) }).Count -gt 0 }) }
$blind = @($qs | ForEach-Object {
  [ordered]@{
    id = $_.id
    stem = $_.stem
    choose = @($_.answer).Count
    choices = @($_.choices | ForEach-Object { [ordered]@{ id = $_.id; text = $_.text } })
    sections = @($_.units)
    tags = @($_.objectives | ForEach-Object { "$_ $($objTitle[$_])" })
  }
})
[IO.File]::WriteAllText((Join-Path $out 'questions-blind.json'), (ConvertTo-Json -InputObject $blind -Depth 6), $utf8)
"questions-blind.json: $($blind.Count) questions"

$cardFile = "$Scratch\packs\unit-$nn.flashcards.json"
if (Test-Path -LiteralPath $cardFile) {
  $cards = (Read-Json $cardFile).flashcards
  $backs = @($cards | ForEach-Object { [ordered]@{ id = $_.id; back = $_.definition } })
  $terms = @($cards | ForEach-Object { [ordered]@{ id = $_.id; term = $_.term; section = $_.reference.section } })
  [IO.File]::WriteAllText((Join-Path $out 'card-backs.json'), (ConvertTo-Json -InputObject $backs -Depth 4), $utf8)
  [IO.File]::WriteAllText((Join-Path $out 'card-terms.json'), (ConvertTo-Json -InputObject $terms -Depth 4), $utf8)
  "card-backs.json and card-terms.json: $($cards.Count) cards"
}
