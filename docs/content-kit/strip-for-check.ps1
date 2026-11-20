<#
  strip-for-check.ps1
  Makes the blind copies the independent checkers work from, so no checker sees the key, the find
  phrase, the source item, or your reasoning. Run it after assemble.ps1.

    powershell -ExecutionPolicy Bypass -File strip-for-check.ps1 -Scratch "<scratchpad>" -Exam a-plus-core-1 -Unit 2.0

  -Exam is required: a-plus-core-1 or network-plus (the exam's data folder; -Data overrides it).
  Reads packs\unit-NN.questions.json and packs\unit-NN.flashcards.json. Writes, under -Scratch\check:
    questions-blind.json  For each question: id, stem, its exhibit if it has one, choices, how many to
                          choose, the cited sections, and each objective and bullet with its title. No
                          answer, find phrase, or origin. Not written while there is no question pack
                          (after assemble.ps1 -CardsOnly).
    card-backs.json       For each card: id and back only. The checker names the term.
    card-terms.json       For each card: id, term, and cited section only. The checker writes the back.
  And, after assemble.ps1 -CommandsOnly, from packs\unit-NN.commands.json (A Command line pass):
    commands-blind.json   For each command: id, system, and task only. No stored line, alsoWorks line,
                          output, typedFormOf, origin, or reference: the blind command check types every
                          line it would run from the task and the command sections alone.
    followups-blind.json  For each version with a follow-up: the version id, the system, and its outputs
                          as the Command line box shows them, one for each answer group (the prompt and
                          the group's first line, then what that group prints), then the follow-up
                          question read from the exam's question packs in -Data: stem, choices, how many
                          to choose, cited sections, and tags. The question's own exhibit is left out (the
                          output stands in for it), and so are its answer, find phrase, and origin.
  Optional -Only limits the copies to the ids given, for re-checking fixed items: -Only q005,q017,f012
  matches c1-u02-q005, c1-u02-q017, and c1-u02-f012. Take ids from packs\ids.tsv and packs\card-ids.tsv
  after the latest assemble.ps1 run: dropping a slot or a card renumbers every id after it. Command and
  version ids (packs\command-ids.tsv) never change: -Only c003,v002 matches n-u04-c003 and n-u04-v002,
  and a command's follow-ups come with it.
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

$qFile = "$Scratch\packs\unit-$nn.questions.json"
$cmdFile = "$Scratch\packs\unit-$nn.commands.json"
# After assemble.ps1 -CardsOnly there is no question pack yet: then only the card copies are made. A
# Command line pass has a command pack and no question pack.
$haveQuestions = Test-Path -LiteralPath $qFile
$qs = if ($haveQuestions) { @((Read-Json $qFile).questions) } else { @() }
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
if ($haveQuestions) {
  [IO.File]::WriteAllText((Join-Path $out 'questions-blind.json'), (ConvertTo-Json -InputObject $blind -Depth 6), $utf8)
  "questions-blind.json: $($blind.Count) questions"
} elseif (-not (Test-Path -LiteralPath $cmdFile)) { 'questions-blind.json: not written (no question pack yet: assemble.ps1 -CardsOnly)' }

$cardFile = "$Scratch\packs\unit-$nn.flashcards.json"
if (Test-Path -LiteralPath $cardFile) {
  $cards = @((Read-Json $cardFile).flashcards | Where-Object { Test-Wanted $_.id })
  $backs = @($cards | ForEach-Object { [ordered]@{ id = $_.id; back = $_.definition } })
  $terms = @($cards | ForEach-Object { [ordered]@{ id = $_.id; term = $_.term; section = $_.reference.section } })
  [IO.File]::WriteAllText((Join-Path $out 'card-backs.json'), (ConvertTo-Json -InputObject $backs -Depth 4), $utf8)
  [IO.File]::WriteAllText((Join-Path $out 'card-terms.json'), (ConvertTo-Json -InputObject $terms -Depth 4), $utf8)
  "card-backs.json and card-terms.json: $($cards.Count) cards"
}

if (Test-Path -LiteralPath $cmdFile) {
  $commands = @((Read-Json $cmdFile).commands)
  # The blind command check sees the system and the task, and nothing that holds a line.
  $blindC = @($commands | Where-Object { Test-Wanted $_.id } | ForEach-Object { [ordered]@{ id = $_.id; system = $_.system; task = $_.task } })
  [IO.File]::WriteAllText((Join-Path $out 'commands-blind.json'), (ConvertTo-Json -InputObject $blindC -Depth 4), $utf8)
  "commands-blind.json: $($blindC.Count) commands"
  # The follow-up key check sees the question under each output it can be shown under. A follow-up is a
  # published question of the exam, so it is read from the question packs in -Data.
  $qById = @{}
  $qManifest = "$Data\questions\manifest.json"
  if (Test-Path -LiteralPath $qManifest) {
    foreach ($p in (Read-Json $qManifest).packs) { $f = "$Data\questions\$p"; if (Test-Path -LiteralPath $f) { foreach ($q in (Read-Json $f).questions) { if ($q.id) { $qById[$q.id] = $q } } } }
  }
  $prompts = @{ windows = 'C:\>'; linux = '$'; router = 'Router#'; switch = 'Switch#' }
  $blindF = @(foreach ($c in $commands) {
    $prompt = [string]$prompts[[string]$c.system]
    foreach ($v in @($c.versions)) {
      $fu = [string]$v.followUp.question
      if (-not $fu -or -not ((Test-Wanted $v.id) -or (Test-Wanted $c.id))) { continue }
      $q = $qById[$fu]
      if (-not $q) { throw "$($v.id): its follow-up $fu is not a question in $Data\questions" }
      $outputs = @(for ($k = 0; $k -lt @($v.outputs).Count; $k++) {
        $o = @($v.outputs)[$k]
        $lines = @(@(@($c.accept)[$k].lines) | ForEach-Object { [string]$_ })
        if (@($o.PSObject.Properties.Name) -contains 'exhibitOf') {
          # The exhibit as the box prints it: its first line is left out when it is the prompt and a line
          # of this group, because the box has just printed that (assets/js/lib/command-items.js).
          $ex = @(([string]$q.exhibit.text -replace "`r", '') -split "`n")
          if ($prompt -and $ex.Count -and $ex[0].StartsWith($prompt, [StringComparison]::OrdinalIgnoreCase)) {
            $typed = (($ex[0].Substring($prompt.Length)) -replace '\s+', ' ').Trim().ToLowerInvariant()
            if (@($lines | Where-Object { $_.ToLowerInvariant() -eq $typed }).Count) { $ex = @($ex | Select-Object -Skip 1) }
          }
          $text = $ex -join "`n"
        } else { $text = [string]$o.text }
        # The echo: a Linux prompt has a space after it, as a shell prints it; the others have none.
        $echo = $prompt + $(if ($c.system -eq 'linux') { ' ' } else { '' }) + $(if ($lines.Count) { $lines[0] } else { '' })
        if ($text) { "$echo`n$text" } else { $echo }
      })
      [ordered]@{
        id = $v.id; system = $c.system; outputs = $outputs; stem = $q.stem; choose = @($q.answer).Count
        choices = @($q.choices | ForEach-Object { [ordered]@{ id = $_.id; text = $_.text } })
        sections = @($q.units); tags = @($q.objectives | ForEach-Object { "$_ $($objTitle[$_])" })
      }
    }
  })
  [IO.File]::WriteAllText((Join-Path $out 'followups-blind.json'), (ConvertTo-Json -InputObject $blindF -Depth 6), $utf8)
  "followups-blind.json: $($blindF.Count) follow-ups"
}
