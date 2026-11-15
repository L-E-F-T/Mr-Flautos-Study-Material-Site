<#
  strip-for-check.ps1
  Makes the blind copies the independent checkers work from, so no checker sees the key, the find
  phrase, the source item, or your reasoning. Run it after assemble.ps1.

    powershell -ExecutionPolicy Bypass -File strip-for-check.ps1 -Scratch "<scratchpad>" -Exam a-plus-core-1 -Unit 2.0

  -Exam is required: a-plus-core-1 or network-plus (the exam's data folder; -Data overrides it).
  Reads packs\unit-NN.questions.json and packs\unit-NN.flashcards.json. Writes, under -Scratch\check:
    questions-blind.json  For each question: id, stem, its exhibit if it has one, choices, how many to
                          choose, the cited sections, and each objective and bullet with its title. No
                          answer, find phrase, or origin.
    card-backs.json       For each card: id and back only. The checker names the term.
    card-terms.json       For each card: id, term, and cited section only. The checker writes the back.
  Optional -Only limits the copies to the ids given, for re-checking fixed items: -Only q005,q017,f012
  matches c1-u02-q005, c1-u02-q017, and c1-u02-f012. Take ids from packs\ids.tsv and packs\card-ids.tsv
  after the latest assemble.ps1 run: dropping a slot or a card renumbers every id after it.
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [Parameter(Mandatory = $true)][string]$Unit,
  [ValidateSet('a-plus-core-1', 'network-plus')][string]$Exam,
  [string]$Data,
  [string[]]$Only = @()
)
$ErrorActionPreference = 'Stop'
if (-not $Exam) { throw 'strip-for-check.ps1 needs -Exam a-plus-core-1 or -Exam network-plus.' }
if (-not $PSBoundParameters.ContainsKey('Data')) { $Data = Join-Path 'C:\CompTIA Website\data' $Exam }
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Read-Json([string]$path) { [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8) | ConvertFrom-Json }
$nn = ($Unit -split '\.')[0].PadLeft(2, '0')
$objTitle = @{}
foreach ($d in (Read-Json "$Data\objectives.json").domains) { foreach ($o in $d.objectives) { $objTitle[$o.id] = $o.title; foreach ($b in $o.subobjectives) { $objTitle[$b.id] = $b.title } } }
$out = Join-Path $Scratch 'check'
New-Item -ItemType Directory -Force $out | Out-Null

$qs = (Read-Json "$Scratch\packs\unit-$nn.questions.json").questions
$Only = @($Only | ForEach-Object { $_ -split '[,\s]+' } | Where-Object { $_ })  # -File passes "q005,q019" as one string
function Test-Wanted([string]$id) { if (-not $Only.Count) { return $true }; @($Only | Where-Object { $id.EndsWith("-$_") -or $id -eq $_ }).Count -gt 0 }
$qs = @($qs | Where-Object { Test-Wanted $_.id })
$blind = @($qs | ForEach-Object {
  $b = [ordered]@{ id = $_.id; stem = $_.stem }
  # A text exhibit (a command's output) is part of the question, so the blind checker sees it.
  if ($_.exhibit -and $_.exhibit.text) { $b.exhibit = $_.exhibit.text }
  $b.choose = @($_.answer).Count
  $b.choices = @($_.choices | ForEach-Object { [ordered]@{ id = $_.id; text = $_.text } })
  $b.sections = @($_.units)
  $b.tags = @($_.objectives | ForEach-Object { "$_ $($objTitle[$_])" })
  $b
})
[IO.File]::WriteAllText((Join-Path $out 'questions-blind.json'), (ConvertTo-Json -InputObject $blind -Depth 6), $utf8)
"questions-blind.json: $($blind.Count) questions"

$cardFile = "$Scratch\packs\unit-$nn.flashcards.json"
if (Test-Path -LiteralPath $cardFile) {
  $cards = @((Read-Json $cardFile).flashcards | Where-Object { Test-Wanted $_.id })
  $backs = @($cards | ForEach-Object { [ordered]@{ id = $_.id; back = $_.definition } })
  $terms = @($cards | ForEach-Object { [ordered]@{ id = $_.id; term = $_.term; section = $_.reference.section } })
  [IO.File]::WriteAllText((Join-Path $out 'card-backs.json'), (ConvertTo-Json -InputObject $backs -Depth 4), $utf8)
  [IO.File]::WriteAllText((Join-Path $out 'card-terms.json'), (ConvertTo-Json -InputObject $terms -Depth 4), $utf8)
  "card-backs.json and card-terms.json: $($cards.Count) cards"
}
