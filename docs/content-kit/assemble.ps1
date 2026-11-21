<#
  assemble.ps1
  Builds a unit's question pack and flashcard pack from the chat's drafts. It checks every mechanical
  rule, spreads the answer keys across the letters, and writes the packs in the house layout. It writes
  only under -Scratch\packs. Copy the result into data/ with the Write and Edit tools.

    powershell -ExecutionPolicy Bypass -File assemble.ps1 -Scratch "<scratchpad>" -Exam a-plus-core-1 -Unit 2.0
    powershell -ExecutionPolicy Bypass -File assemble.ps1 -Scratch "<scratchpad>" -Exam network-plus -Unit 6.0
    powershell -ExecutionPolicy Bypass -File assemble.ps1 -Scratch "<scratchpad>" -Exam security-plus -Unit 8.0 -PackNote "Needs revision: ..."

  -Exam is required: a-plus-core-1 (data\a-plus-core-1, ids like c1-u02-q001), network-plus
  (data\network-plus, ids like n-u06-q001), or security-plus (data\security-plus, ids like s-u08-q001).
  -Data and -Course override the folder and the id prefix.
  -CardsOnly builds only the flashcard pack (spec.json and the question drafts are not read), to check
  cards early. -NoSpread leaves every key where the draft put it.
  -PackNote writes "notes" into the pack header of every pack the run builds, after "reviewed": false
  (Security+ Units 8.0 and 9.0: the handoff's "Needs revision" note). check-copy.ps1 compares the header
  line too, so the copy in data/ must carry the same note.
  -CommandsOnly builds only the unit's command pack for the Command line tool (docs/CONTENT-HANDOFF.md,
  "A Command line pass"), and nothing of the question and card code below runs:

    powershell -ExecutionPolicy Bypass -File assemble.ps1 -Scratch "<scratchpad>" -Exam network-plus -Unit 4.0 -CommandsOnly

  Reads, under -Scratch:
    spec.json            { "lessons": { "2.1": [ { "slot": "q01" }, ... ], "2.2": [ ... ] } }
                         Lessons in pack order, slots in order within each lesson.
    work\draft-*.json    { "questions": [ { "slot": "q01", "stem", "exhibit" (optional: { "type": "text",
                           "text" }), "choices", "answer", "objectives", "units",
                           "reference": { "section", "title", "find" }, "origin": { "kind", "basedOn" } } ] }
    work\revised-*.json  Same shape. Wins over the drafts.
    work\fixes-*.json    Same shape. Wins over both.
    work\cards.json      { "flashcards": [ { "term", "definition", "objectives", "units",
                           "reference": { "section", "title" } } ] }
    card-terms.tsv       The unit's card list, if there is one: a card whose term is not a "card" row is reported.
    practice\practice-<exam>.tsv  From extract-sources.ps1 (Network+): a practice exam basedOn must be in it.
    text\<section>.raw.txt  From extract-sources.ps1, for the find-phrase check.
  With -CommandsOnly, instead:
    command-lines-<unit>.tsv  The line list (command-lines-4.0.tsv): one command for each item, in the order
                         the items first appear, and every line the pack stores is a row of its item.
    work\commands-<unit>.json  { "commands": [ { "slot": "U4-1", "typedFormOf", "origin" (only where no
                           partner is a question), "system", "task", "accept", "alsoWorks", "versions",
                           "objectives", "units", "reference" } ] }, with no ids (the kit sets them).
    work\commands-<unit>-fixes*.json  The same shape. A later file (by name) wins, command by command.
    text\<section>.raw.txt  The find-phrase check, and the words of each stored line.

  Writes, under -Scratch\packs:
    unit-NN.questions.json   The question pack, house layout, ids assigned.
    unit-NN.flashcards.json  The flashcard pack.
    unit-NN.lesson-X.Y.txt   That lesson's question blocks, ready to paste into the pack with Edit.
    keys-moved.txt           Every key the spread moved (the key text never changes, only its letter).
  With -CommandsOnly, instead:
    unit-NN.commands.json    The command pack, house layout. Ids stay with their commands: a command keeps
                             the id of the command in the unit's pack in -Data that shares a partner (or,
                             with no partner, its source item), a version keeps the id of that command's
                             version with the same follow-up (or, with none, the same place), and a new one
                             takes a number above "lastCommand" and "lastVersion" in the pack header, which
                             keep the highest numbers ever used, so a dropped id is never used again. A kept
                             command keeps Mr. Flauto's quote.
    command-ids.tsv          id, slot, command or version N, partners or follow-up, kept or new.
    stored-lines.tsv         system, line, id, slot, group (1 to 3, or also for alsoWorks), section.

  It also reads the exam's other packs in -Data, so a source item (a pool, Messer, or practice exam item)
  or a flashcard term already used in another unit is reported. Command packs count too: a source item a
  command is modeled on is used. The commands mode reads the unit's own question and card packs as well
  (a command's partners and follow-ups are there), but not the unit's command pack, which it rebuilds.
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [Parameter(Mandatory = $true)][string]$Unit,
  [ValidateSet('a-plus-core-1', 'network-plus', 'security-plus')][string]$Exam,
  [string]$Data,
  [string]$Course,
  [string]$PackNote,
  [switch]$NoSpread,
  [switch]$CardsOnly,
  [switch]$CommandsOnly
)
$ErrorActionPreference = 'Stop'
# A forgotten -Exam stops here, instead of giving c1- ids or checking against the A+ outline.
if (-not $Exam) { throw 'assemble.ps1 needs -Exam a-plus-core-1, -Exam network-plus, or -Exam security-plus.' }
if ($CardsOnly -and $CommandsOnly) { throw 'assemble.ps1 takes -CardsOnly or -CommandsOnly, not both.' }
# Each exam's data folder and id prefix (docs/CONTENT-GUIDE.md: c1- A+ Core 1, n- Network+, s- Security+).
$presets = @{ 'a-plus-core-1' = @{ Data = 'a-plus-core-1'; Course = 'c1' }; 'network-plus' = @{ Data = 'network-plus'; Course = 'n' }
  'security-plus' = @{ Data = 'security-plus'; Course = 's' } }
if (-not $PSBoundParameters.ContainsKey('Data')) { $Data = Join-Path 'C:\CompTIA Website\data' $presets[$Exam].Data }
if (-not $PSBoundParameters.ContainsKey('Course')) { $Course = $presets[$Exam].Course }
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Read-Json([string]$path) { [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8) | ConvertFrom-Json }
function Get-Norm([string]$s) { (($s -replace '[\u2010\u2011]', '-') -replace '\s+', ' ').Trim().ToLowerInvariant() }
# The house layout's JSON text (the question and card writers below use them too).
function ConvertTo-JsonString([string]$s) { '"' + (($s -replace '\\', '\\') -replace '"', '\"' -replace "`r", '\r' -replace "`n", '\n' -replace "`t", '\t') + '"' }
function ConvertTo-JsonList($arr) { '[' + ((@($arr) | ForEach-Object { ConvertTo-JsonString $_ }) -join ', ') + ']' }
# -PackNote: the "notes" field that follows "reviewed" (and, in a command pack, "lastVersion") in each pack header.
if ($PSBoundParameters.ContainsKey('PackNote') -and -not $PackNote.Trim()) { throw 'assemble.ps1 -PackNote needs the text of the note.' }
$noteField = if ($PackNote) { ", `"notes`": $(ConvertTo-JsonString $PackNote.Trim())" } else { '' }

$unitMajor = ($Unit -split '\.')[0]
$nn = $unitMajor.PadLeft(2, '0')
$packName = "unit-$nn.json"

# ---- Outline lookups --------------------------------------------------------------------------------
$objTitle = @{}
foreach ($d in (Read-Json "$Data\objectives.json").domains) { foreach ($o in $d.objectives) { $objTitle[$o.id] = $o.title; foreach ($b in $o.subobjectives) { $objTitle[$b.id] = $b.title } } }
$secTitle = @{}; $unitTitle = $null
# The objectives this unit's lessons list: every card must carry one (docs/CONTENT-GUIDE.md, "Which terms get a card").
$unitObjectives = @{}
foreach ($u in (Read-Json "$Data\units.json").units) {
  if ($u.id -eq $Unit) {
    $unitTitle = "Unit $($u.id) $($u.title)"
    foreach ($l in $u.subunits) { foreach ($o in @($l.objectives)) { if ($o) { $unitObjectives[$o] = $true } } }
  }
  foreach ($l in $u.subunits) { foreach ($s in $l.sections) { $secTitle[$s.id] = $s.title } }
}
if (-not $unitTitle) { throw "Unit $Unit is not in units.json" }
# The unit's card list, when the chat has written one: only its "card" rows become cards.
$termList = $null
if (Test-Path -LiteralPath "$Scratch\card-terms.tsv") {
  $termList = @{}
  foreach ($r in (Import-Csv -LiteralPath "$Scratch\card-terms.tsv" -Delimiter "`t" -Encoding UTF8)) { if ($r.decision -eq 'card') { $termList[(Get-Norm $r.term)] = $r.test } }
}
# The practice exam index (extract-sources.ps1): a practice exam basedOn must be in it and need no figure.
$practiceIndex = @{}
foreach ($t in @(Get-ChildItem -LiteralPath "$Scratch\practice" -Filter 'practice-*.tsv' -File -ErrorAction SilentlyContinue)) {
  foreach ($r in (Import-Csv -LiteralPath $t.FullName -Delimiter "`t" -Encoding UTF8)) { $practiceIndex[$r.item] = $r }
}

# ---- What the exam's other packs already use ---------------------------------------------------------
# Command packs count too: no question is modeled on a source item a command used. A run skips the packs
# it rebuilds: the unit's question and card packs, or with -CommandsOnly only the unit's command pack, so
# the commands mode reads the unit's own question pack (a command's partners and follow-ups are there, and
# a source item one of them uses counts as used).
$usedSource = @{}; $usedTerm = @{}
$questionById = @{}; $cardIds = @{}; $partnerOwner = @{}; $followUpOwner = @{}
foreach ($kind in 'questions', 'flashcards', 'commands') {
  $manifest = "$Data\$kind\manifest.json"
  if (-not (Test-Path -LiteralPath $manifest)) { continue }
  foreach ($p in (Read-Json $manifest).packs) {
    if ($p -eq $packName -and (($kind -eq 'commands') -eq [bool]$CommandsOnly)) { continue }
    $f = "$Data\$kind\$p"
    if (-not (Test-Path -LiteralPath $f)) { continue }
    $pk = Read-Json $f
    if ($kind -eq 'questions') { foreach ($q in $pk.questions) { if ($q.origin.basedOn) { $usedSource[$q.origin.basedOn] = $q.id }; if ($q.id) { $questionById[$q.id] = $q } } }
    elseif ($kind -eq 'flashcards') { foreach ($c in $pk.flashcards) { $usedTerm[(Get-Norm $c.term)] = $c.id; if ($c.id) { $cardIds[$c.id] = $true } } }
    else {
      foreach ($c in $pk.commands) {
        if ($c.origin.basedOn) { $usedSource[$c.origin.basedOn] = $c.id }
        foreach ($t in @($c.typedFormOf)) { if ($t) { $partnerOwner[$t] = $c.id } }
        foreach ($v in @($c.versions)) { if ($v.followUp.question) { $followUpOwner[$v.followUp.question] = "$($c.id) $($v.id)" } }
      }
    }
  }
}

# ---- Commands (-CommandsOnly) -----------------------------------------------------------------------
# A Command line pass (docs/CONTENT-HANDOFF.md, "A Command line pass"; the rules are docs/CONTENT-GUIDE.md,
# "A command"). The line list, command-lines-<unit>.tsv, plays the parts spec.json and card-terms.tsv play
# for a unit: one command for each item, in the order the items first appear, and every line the pack
# stores (an accepted line, or an alsoWorks line in the group "also") is a row of its item. The rest of a
# command (how the matcher reads its lines, the partners' wrong choices) is the content check's, once the
# pack is in data/. The question and card code below this block never runs in this mode.
if ($CommandsOnly) {
  $cp = New-Object System.Collections.Generic.List[string]
  $systemWord = @{ windows = 'Windows'; linux = 'Linux'; router = 'router'; switch = 'switch' }
  $promptOf = @{ windows = 'C:\>'; linux = '$'; router = 'Router#'; switch = 'Switch#' }
  $dash = '[' + [char]0x2013 + [char]0x2014 + ']'
  $listName = "command-lines-$Unit.tsv"

  # An address or a host name, read as the matcher reads one (assets/js/lib/command-match.js): an IPv4
  # address, a MAC address, or a dotted name with a letter in it.
  function Test-Target([string]$t) {
    $t = $t.ToLowerInvariant()
    ($t -match '^\d{1,3}(\.\d{1,3}){3}$') -or ($t -match '^[0-9a-f]{2}([-:][0-9a-f]{2}){5}$') -or ($t -match '^[0-9a-f]{4}(\.[0-9a-f]{4}){2}$') -or (($t -match '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$') -and ($t -match '[a-z]'))
  }
  # A task's words in lower case, without the punctuation at either end of each.
  function Get-Words([string]$s) { @(($s -split '\s+') | ForEach-Object { (($_ -replace '^[("''\[{]+', '') -replace '[.,!?;:)\]}"'']+$', '').ToLowerInvariant() } | Where-Object { $_ }) }
  # A row of the line list is the stored line word for word, where a word in angle brackets (<address>,
  # @<server>) is an address or host name that the task prints.
  function Test-Row([string]$row, [string]$line, [string[]]$words) {
    $a = @($row -split ' ' | Where-Object { $_ }); $b = @($line -split ' ' | Where-Object { $_ })
    if ($a.Count -ne $b.Count) { return $false }
    for ($i = 0; $i -lt $a.Count; $i++) {
      if ($a[$i] -match '^([^<]*)<[^>]+>$') {
        $pre = $Matches[1]
        if (-not $b[$i].StartsWith($pre, [StringComparison]::Ordinal)) { return $false }
        $rest = $b[$i].Substring($pre.Length)
        if ((-not (Test-Target $rest)) -or ($words -notcontains $rest.ToLowerInvariant())) { return $false }
      } elseif (-not [string]::Equals($a[$i], $b[$i], [StringComparison]::Ordinal)) { return $false }
    }
    $true
  }
  $rawText = @{}
  function Get-Raw([string]$sec) {
    if (-not $rawText.ContainsKey($sec)) {
      $path = "$Scratch\text\$sec.raw.txt"
      $rawText[$sec] = if ($sec -and (Test-Path -LiteralPath $path)) { [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8) } else { $null }
    }
    $rawText[$sec]
  }
  # True when the word is a word of one of the sections' text, in any case.
  function Test-Taught([string]$word, [string[]]$secs) {
    $re = '(?i)(^|[\s("''\[])' + [regex]::Escape($word) + '($|[\s)"''\].,;:])'
    foreach ($s in $secs) { $t = Get-Raw $s; if ($t -and (($t -replace '[\u2010-\u2013\u2212]', '-') -match $re)) { return $true } }
    $false
  }

  # The line list, by item.
  $listFile = Join-Path $Scratch $listName
  if (-not (Test-Path -LiteralPath $listFile)) { throw "assemble.ps1 -CommandsOnly needs $listFile, the line list (docs/CONTENT-HANDOFF.md, A Command line pass, step 2)." }
  $columns = @((@([IO.File]::ReadAllLines($listFile, [Text.Encoding]::UTF8)) | Select-Object -First 1) -split "`t" | ForEach-Object { $_.Trim() })
  $lacking = @('item', 'partners', 'system', 'line', 'group', 'followUp' | Where-Object { $columns -notcontains $_ })
  if ($lacking.Count) { throw "$listName needs a first line that names its columns. It lacks: $($lacking -join ', ')." }
  $itemOrder = New-Object System.Collections.Generic.List[string]
  $itemRows = @{}
  foreach ($r in @(Import-Csv -LiteralPath $listFile -Delimiter "`t" -Encoding UTF8)) {
    $it = ([string]$r.item).Trim()
    if (-not $it) { continue }
    if (-not $itemRows.ContainsKey($it)) { $itemRows[$it] = New-Object System.Collections.Generic.List[object]; $itemOrder.Add($it) }
    $itemRows[$it].Add($r)
  }

  # The drafts, then the fixes: a later file wins, command by command.
  $cmdDraft = @{}
  $draftFiles = @(Get-ChildItem -LiteralPath "$Scratch\work" -Filter "commands-$Unit.json" -File -ErrorAction SilentlyContinue) + @(Get-ChildItem -LiteralPath "$Scratch\work" -Filter "commands-$Unit-fixes*.json" -File -ErrorAction SilentlyContinue | Sort-Object Name)
  foreach ($f in $draftFiles) { foreach ($c in @((Read-Json $f.FullName).commands)) { if ($c -and $c.slot) { $cmdDraft[[string]$c.slot] = $c } } }

  # The unit's pack in -Data, if there is one: the ids, the highest numbers ever used, and his quotes.
  $oldFile = "$Data\commands\$packName"
  $old = New-Object System.Collections.Generic.List[object]
  $lastC = 0; $lastV = 0
  if (Test-Path -LiteralPath $oldFile) {
    $ex = Read-Json $oldFile
    if ($ex.pack.lastCommand -gt $lastC) { $lastC = [int]$ex.pack.lastCommand }
    if ($ex.pack.lastVersion -gt $lastV) { $lastV = [int]$ex.pack.lastVersion }
    foreach ($c in @($ex.commands)) {
      if (-not $c -or -not $c.id) { continue }
      if ($c.id -match '-c(\d+)$' -and [int]$Matches[1] -gt $lastC) { $lastC = [int]$Matches[1] }
      $keys = @(@($c.typedFormOf) | Where-Object { $_ } | ForEach-Object { [string]$_ })
      if ($c.origin.basedOn) { $keys += 'source:' + (Get-Norm $c.origin.basedOn) }
      $vers = New-Object System.Collections.Generic.List[object]
      foreach ($v in @($c.versions)) {
        if (-not $v -or -not $v.id) { continue }
        if ($v.id -match '-v(\d+)$' -and [int]$Matches[1] -gt $lastV) { $lastV = [int]$Matches[1] }
        $vers.Add([pscustomobject]@{ id = [string]$v.id; followUp = [string]$v.followUp.question; taken = $false })
      }
      $old.Add([pscustomobject]@{ id = [string]$c.id; keys = $keys; versions = $vers; quote = [string]$c.reference.quote; section = [string]$c.reference.section; taken = '' })
    }
    # A trial pack may be re-assembled until the tool is switched on (docs/CONTENT-HANDOFF.md, rule 8).
    $examsFile = Join-Path (Split-Path $Data -Parent) 'exams.json'
    if (Test-Path -LiteralPath $examsFile) {
      $entry = @((Read-Json $examsFile).exams | Where-Object { $_.id -eq $Exam })
      if ($entry.Count -and @($entry[0].PSObject.Properties.Name) -contains 'commandUnits') {
        $cp.Add("NOTE the tool is switched on for $Exam (commandUnits in exams.json): once $packName is on GitHub it is fixed, so never copy this build over it. Edit it item by item (docs/CONTENT-HANDOFF.md, rule 8)")
      }
    }
  }

  $built = New-Object System.Collections.Generic.List[object]
  $runPartner = @{}; $runFollowUp = @{}; $runSource = @{}
  foreach ($slot in $itemOrder) {
    $src = $cmdDraft[$slot]
    if (-not $src) { $cp.Add("${slot}: no draft"); continue }
    $myRows = $itemRows[$slot].ToArray()   # (PowerShell 5.1 cannot take @() of a List of rows)
    $partners = @(@($src.typedFormOf) | Where-Object { $_ } | ForEach-Object { [string]$_ })
    $basedOn = [string]$src.origin.basedOn
    $keys = @($partners)
    if ($basedOn) { $keys += 'source:' + (Get-Norm $basedOn) }

    # The id. No question or card is the partner of two commands, so a shared partner (or source item)
    # names the command this one was.
    $hits = @($old | Where-Object { $o = $_; @($o.keys | Where-Object { $keys -contains $_ }).Count -gt 0 })
    $prev = $null
    if ($hits.Count -gt 1) { $cp.Add("$slot shares partners or a source item with $(@($hits | ForEach-Object { $_.id }) -join ' and ') in ${packName}: a command keeps one id") }
    if ($hits.Count) {
      $prev = $hits[0]
      if ($prev.taken) { $cp.Add("$slot and $($prev.taken) both match $($prev.id) in ${packName}: a command keeps one id"); $prev = $null }
    }
    if ($prev) { $prev.taken = $slot; $id = $prev.id; $state = 'kept' }
    else { $lastC++; $id = '{0}-u{1}-c{2:D3}' -f $Course, $nn, $lastC; $state = 'new' }
    $tag = "$id ($slot)"

    $system = [string]$src.system
    $task = ([string]$src.task).Trim()
    $words = [string[]](Get-Words $task)
    $rowSystem = @($myRows | ForEach-Object { ([string]$_.system).Trim() } | Where-Object { $_ } | Select-Object -Unique)
    $rowPartners = @($myRows | ForEach-Object { ([string]$_.partners) -split '[\s,]+' } | Where-Object { $_ } | Sort-Object -Unique)
    $rowFollow = @($myRows | ForEach-Object { ([string]$_.followUp) -split '[\s,]+' } | Where-Object { $_ } | Sort-Object -Unique)

    # The system and the task (the guide, "The task").
    if (@('windows', 'linux', 'router', 'switch') -cnotcontains $system) { $cp.Add("$tag system '$system' must be windows, linux, router, or switch") }
    elseif ($rowSystem.Count -and $rowSystem -notcontains $system) { $cp.Add("$tag system is $system, and $listName says $($rowSystem -join ', ')") }
    if (-not $task) { $cp.Add("$tag has no task") }
    else {
      if (-not $task.EndsWith('?')) { $cp.Add("$tag task must end with a question mark") }
      $sentences = ([regex]::Matches($task, '[.?!](\s|$)')).Count
      if ($sentences -gt 2) { $cp.Add("$tag task has $sentences sentences (2 at most)") }
      if ($task -match $dash) { $cp.Add("$tag em or en dash in the task") }
      if ($systemWord.ContainsKey($system) -and $task -notmatch ('\b' + $systemWord[$system] + '\b')) { $cp.Add("$tag task does not name its system in words ($($systemWord[$system]))") }
      $sw = @($words | Where-Object { $_ -match '^[/-]+[a-z?]' })
      if ($sw.Count) { $cp.Add("$tag task holds a switch ($($sw[0]))") }
    }

    # The answer groups and their lines (the guide, "The accepted lines").
    $accept = @(@($src.accept) | Where-Object { $_ })
    if ($accept.Count -lt 1 -or $accept.Count -gt 3) { $cp.Add("$tag has $($accept.Count) answer groups (1 to 3)") }
    $groups = New-Object System.Collections.Generic.List[object]
    $groupSecs = New-Object System.Collections.Generic.List[object]
    $joined = ' ' + ($words -join ' ') + ' '
    $ownSec = [string]$src.reference.section
    $noText = @{}
    for ($g = 0; $g -lt $accept.Count; $g++) {
      $lines = [string[]]@(@($accept[$g].lines) | Where-Object { $null -ne $_ } | ForEach-Object { [string]$_ })
      $gs = [string[]]@(@($accept[$g].sections) | Where-Object { $_ } | ForEach-Object { [string]$_ })
      $groups.Add($lines); $groupSecs.Add($gs)
      if (-not $lines.Count) { $cp.Add("$tag answer group $($g + 1) has no lines") }
      foreach ($s in $gs) { if (-not $secTitle.ContainsKey($s)) { $cp.Add("$tag answer group $($g + 1) names unknown section '$s'") } }
      # The words of each line: the line's own section, or the group's sections (another written unit's may teach it).
      $secs = [string[]]@(@($gs | Where-Object { $secTitle.ContainsKey($_) }) + @($ownSec) | Where-Object { $_ } | Select-Object -Unique)
      foreach ($s in $secs) { if ($null -eq (Get-Raw $s) -and -not $noText.ContainsKey($s)) { $noText[$s] = $true; $cp.Add("$tag no text file for section $s") } }
      $readable = [string[]]@($secs | Where-Object { $null -ne (Get-Raw $_) })
      foreach ($line in $lines) {
        if ($line -cne ($line -replace '\s+', ' ').Trim()) { $cp.Add("$tag stored line ""$line"" is not trimmed to single spaces") }
        if ($line.Length -gt 36) { $cp.Add("$tag stored line ""$line"" is longer than 36 characters") }
        if ($system -ne 'linux' -and $line -cne $line.ToLowerInvariant()) { $cp.Add("$tag stored line ""$line"" must be lower case on Windows and on devices") }
        if ($line -and $joined.Contains(' ' + $line.ToLowerInvariant() + ' ')) { $cp.Add("$tag task holds the stored line ""$line""") }
        foreach ($word in @($line -split ' ' | Where-Object { $_ })) {
          $body = $word.TrimStart('@'); $low = $body.ToLowerInvariant()
          # The loopback answer is never printed in the task. Any other address or name always is.
          if ($low -eq '127.0.0.1' -or $low -eq 'localhost') {
            if ($words -contains $low) { $cp.Add("$tag task prints $low, which is the answer") }
          } elseif (Test-Target $body) {
            if ($words -notcontains $low) { $cp.Add("$tag task does not print $body, which stored line ""$line"" holds") }
            continue
          }
          if ($readable.Count -and -not (Test-Taught $word $readable)) { $cp.Add("$tag NOTE stored line ""$line"": ""$word"" is not a word of the text of $($readable -join ' or '). Check that a command section teaches it, and name that section in the group's sections") }
        }
      }
    }

    # Every line the pack stores is a row of the item in the line list, in its group, and every row is stored.
    $also = [string[]]@(@($src.alsoWorks) | Where-Object { $null -ne $_ } | ForEach-Object { [string]$_ })
    $listed = @{}
    foreach ($r in $myRows) {
      $k = ([string]$r.group).Trim().ToLowerInvariant()
      if (-not $listed.ContainsKey($k)) { $listed[$k] = New-Object System.Collections.Generic.List[string] }
      $listed[$k].Add(([string]$r.line).Trim())
    }
    $groupKeys = @(for ($g = 1; $g -le $groups.Count; $g++) { [string]$g }) + @('also')
    foreach ($k in @($groupKeys) + @($listed.Keys | Where-Object { $groupKeys -notcontains $_ } | Sort-Object)) {
      $mine = @(if ($k -eq 'also') { $also } elseif ($groupKeys -contains $k) { $groups[[int]$k - 1] })
      $theirs = @(if ($listed.ContainsKey($k)) { $listed[$k].ToArray() })
      $what = if ($k -eq 'also') { 'alsoWorks line' } else { "group $k line" }
      foreach ($line in $mine) { if (-not @($theirs | Where-Object { Test-Row $_ $line $words }).Count) { $cp.Add("$tag $what ""$line"" is not a row of $slot in $listName") } }
      foreach ($row in $theirs) { if (-not @($mine | Where-Object { Test-Row $row $_ $words }).Count) { $cp.Add("$tag $listName row ""$row"" (group $k) is not stored") } }
    }

    # Partners: questions or cards of the exam, each the partner of one command.
    if ((@($partners | Sort-Object -Unique) -join ' ') -ne ($rowPartners -join ' ')) { $cp.Add("$tag typedFormOf is [$($partners -join ' ')], and $listName says [$($rowPartners -join ' ')]") }
    if (@($partners | Select-Object -Unique).Count -ne $partners.Count) { $cp.Add("$tag typedFormOf lists an id twice") }
    foreach ($p in @($partners | Select-Object -Unique)) {
      if (-not ($questionById.ContainsKey($p) -or $cardIds.ContainsKey($p))) { $cp.Add("$tag typedFormOf names $p, which is not a question or flashcard of the exam") }
      if ($partnerOwner.ContainsKey($p)) { $cp.Add("$tag $p is already the partner of $($partnerOwner[$p]): no question or card is the partner of two commands") }
      elseif ($runPartner.ContainsKey($p)) { $cp.Add("$tag $p is also the partner of $($runPartner[$p]): no question or card is the partner of two commands") }
      else { $runPartner[$p] = $id }
    }

    # The origin: exactly when no partner is a question, and a source item nothing else uses.
    $typesQuestion = @($partners | Where-Object { $questionById.ContainsKey($_) -or $_ -match '-q\d{3}$' }).Count -gt 0
    $hasOrigin = $null -ne $src.origin
    if ($hasOrigin -and $typesQuestion) { $cp.Add("$tag has an origin, but a partner is a question: a command that types a question is read through that question's source item") }
    if (-not $hasOrigin -and -not $typesQuestion) { $cp.Add("$tag needs an origin: no partner is a question, so the command is modeled on a source item of its own") }
    if ($hasOrigin) {
      $okind = [string]$src.origin.kind
      if (@('certmaster-variation', 'messer-variation', 'practice-exam-variation', 'teacher', 'original') -notcontains $okind) { $cp.Add("$tag origin.kind '$okind'") }
      if (-not $basedOn) { $cp.Add("$tag origin has no basedOn") }
      elseif ($okind -eq 'practice-exam-variation' -and $basedOn -cnotmatch '^Practice Tests [1-7] Q[1-9]\d*$') { $cp.Add("$tag basedOn '$basedOn' should read like 'Practice Tests 1 Q33'") }
      elseif ($okind -eq 'practice-exam-variation' -and $practiceIndex.Count) {
        if (-not $practiceIndex.ContainsKey($basedOn)) { $cp.Add("$tag $basedOn is not in the practice exam index") }
        elseif ($practiceIndex[$basedOn].flags -match 'figure') { $cp.Add("$tag $basedOn needs a figure (not usable)") }
      }
      if ($basedOn) {
        if ($usedSource.ContainsKey($basedOn)) { $cp.Add("$tag $basedOn is already used by $($usedSource[$basedOn])") }
        $sk = Get-Norm $basedOn
        if ($runSource.ContainsKey($sk)) { $cp.Add("$tag $basedOn is also the source of $($runSource[$sk])") } else { $runSource[$sk] = $id }
      }
    }

    # Tags and the reference, as for a question.
    $objs = @(@($src.objectives) | Where-Object { $_ } | ForEach-Object { [string]$_ })
    $units = @(@($src.units) | Where-Object { $_ } | ForEach-Object { [string]$_ })
    if (-not $objs.Count) { $cp.Add("$tag has no objectives") }
    foreach ($o in $objs) { if (-not $objTitle.ContainsKey($o)) { $cp.Add("$tag unknown objective '$o'") } }
    foreach ($s in $units) {
      if (-not $secTitle.ContainsKey($s)) { $cp.Add("$tag unknown section '$s'") }
      elseif (($s -split '\.')[0] -ne $unitMajor) { $cp.Add("$tag section '$s' is outside Unit $Unit (a command cites only its unit's sections; a group's sections may be another written unit's)") }
    }
    $title = [string]$src.reference.title
    if ($units -notcontains $ownSec) { $cp.Add("$tag reference.section is not in units") }
    if ($secTitle[$ownSec] -cne $title) { $cp.Add("$tag title should be '$($secTitle[$ownSec])'") }
    $find = (([string]$src.reference.find) -replace '\s+', ' ').Trim()
    $fw = @($find -split ' ' | Where-Object { $_ }).Count
    if ($fw -lt 3 -or $fw -gt 6) { $cp.Add("$tag find phrase has $fw words (3 to 6)") }
    if ($find -match '-$') { $cp.Add("$tag find phrase ends in a hyphen") }
    $raw = Get-Raw $ownSec
    if ($null -ne $raw) {
      $fl = $raw -split "`r?`n|`f"
      $want = Get-Norm $find
      $fh = @(for ($i = 0; $i -lt $fl.Count; $i++) { if ((Get-Norm $fl[$i]).Contains($want)) { $i } })
      if ($fh.Count -eq 0) { $cp.Add("$tag find phrase is not on any one line of ${ownSec}: [$find]") }
      elseif ($fl[$fh[0]] -match '^\s*(\d+/\d+/\d+,|Copyright|https?://)|CertMaster Learn') { $cp.Add("$tag find phrase is in a page header or footer") }
      elseif ((Get-Norm $fl[$fh[0]]).StartsWith($want) -and $fh[0] -gt 0 -and $fl[$fh[0] - 1].TrimEnd() -match '[A-Za-z]-$') { $cp.Add("$tag find phrase starts with the second half of a hyphenated word") }
    } elseif ($ownSec -and -not $noText.ContainsKey($ownSec)) { $noText[$ownSec] = $true; $cp.Add("$tag no text file for section $ownSec") }
    # A kept command keeps Mr. Flauto's quote, which is never blanked.
    $quote = ''
    if ($prev -and $prev.quote) {
      if ($prev.section -eq $ownSec) { $quote = $prev.quote }
      else { $cp.Add("$tag has Mr. Flauto's quote for $($prev.section) in ${packName}, and its section is now ${ownSec}: keep the section, or ask him (a quote is never blanked)") }
    }

    # The versions: one, or one for each follow-up the line list gives the item (only those of
    # docs/COMMAND-LINE-PLAN.md section 3), each with one output for each answer group.
    $vs = @(@($src.versions) | Where-Object { $_ })
    $needV = [Math]::Max(1, $rowFollow.Count)
    if ($vs.Count -ne $needV) {
      $why = if ($rowFollow.Count) { "one for each follow-up $listName gives it" } else { "$listName gives it no follow-up" }
      $cp.Add("$tag has $($vs.Count) versions, and needs $needV ($why)")
    }
    $vOut = New-Object System.Collections.Generic.List[object]
    foreach ($v in $vs) {
      $fu = [string]$v.followUp.question
      $pv = $null
      if ($prev) { $pv = @($prev.versions | Where-Object { -not $_.taken -and $_.followUp -eq $fu })[0] }
      if ($pv) { $pv.taken = $true; $vid = $pv.id; $vstate = 'kept' }
      else { $lastV++; $vid = '{0}-u{1}-v{2:D3}' -f $Course, $nn, $lastV; $vstate = 'new' }
      $vtag = "$tag $vid"
      $outs = @(@($v.outputs) | Where-Object { $null -ne $_ })
      if ($outs.Count -ne $groups.Count) { $cp.Add("$vtag has $($outs.Count) outputs for $($groups.Count) answer groups (one for each)") }
      $vo = New-Object System.Collections.Generic.List[object]
      $printsExhibit = $false
      for ($k = 0; $k -lt $outs.Count; $k++) {
        $o = $outs[$k]; $names = @($o.PSObject.Properties.Name); $what = "$vtag output $($k + 1)"
        $hasText = $names -contains 'text'; $hasEx = $names -contains 'exhibitOf'
        if ($hasText -eq $hasEx) { $cp.Add("$what needs a text or an exhibitOf, and not both"); continue }
        if ($hasEx) {
          if ([string]$o.exhibitOf -ne $fu) { $cp.Add("$what prints the exhibit of $($o.exhibitOf), which is not this version's follow-up") } else { $printsExhibit = $true }
          $vo.Add([ordered]@{ exhibitOf = [string]$o.exhibitOf }); continue
        }
        # The output rule (the guide, "Output"): the exhibit limits, and what the box has just printed.
        $tl = @(([string]$o.text -replace "`r", '') -split "`n" | ForEach-Object { $_.TrimEnd() })
        while ($tl.Count -and -not $tl[0]) { $tl = @($tl | Select-Object -Skip 1) }
        while ($tl.Count -and -not $tl[-1]) { $tl = @($tl | Select-Object -SkipLast 1) }
        $text = $tl -join "`n"
        $vo.Add([ordered]@{ text = $text })
        if ($tl.Count -gt 12) { $cp.Add("$what has $($tl.Count) lines (12 at most)") }
        $long = @(for ($i = 0; $i -lt $tl.Count; $i++) { if ($tl[$i].Length -gt 25) { $i + 1 } })
        if ($long.Count) { $cp.Add("$what line(s) $($long -join ', ') over 25 characters: they wrap on a 320 px phone") }
        if ($text.Contains("`t")) { $cp.Add("$what has a tab") }
        if ($text -match $dash) { $cp.Add("$what has an em or en dash") }
        if ($promptOf.ContainsKey($system) -and $text.StartsWith($promptOf[$system], [StringComparison]::OrdinalIgnoreCase)) { $cp.Add("$what starts with the prompt: the box has just printed the prompt and the line") }
        if ($k -lt $groups.Count -and @($groups[$k] | Where-Object { ($_ -split ' ')[0] -eq 'ping' }).Count -and $text -match 'TTL=') { $cp.Add("$what prints TTL=: a ping output prints no TTL value") }
      }
      # The follow-up (the guide, "The follow-up question"): a published question with a text exhibit.
      if ($null -ne $v.followUp) {
        if (-not $fu) { $cp.Add("$vtag followUp needs ""question"", the id of a published question (one written in place waits for phase 3)") }
        else {
          $fq = $questionById[$fu]
          if (-not $fq) { $cp.Add("$vtag follow-up $fu is not a question of the exam") }
          elseif (-not ($fq.exhibit.type -eq 'text' -and $fq.exhibit.text)) { $cp.Add("$vtag follow-up $fu has no text exhibit") }
          elseif (-not $printsExhibit) { $cp.Add("$vtag no output prints the exhibit of its follow-up $fu (exhibitOf)") }
          if ($partners -contains $fu) { $cp.Add("$vtag follow-up $fu is one of the command's partners") }
          if ($rowFollow -notcontains $fu) { $cp.Add("$vtag follow-up $fu is not in the followUp column of $slot in $listName") }
          if ($followUpOwner.ContainsKey($fu)) { $cp.Add("$vtag $fu already follows $($followUpOwner[$fu]): a question follows one output only") }
          elseif ($runFollowUp.ContainsKey($fu)) { $cp.Add("$vtag $fu also follows $($runFollowUp[$fu]): a question follows one output only") }
          else { $runFollowUp[$fu] = $vid }
        }
      }
      $vOut.Add([pscustomobject]@{ id = $vid; state = $vstate; outputs = $vo; followUp = $fu })
    }
    foreach ($f in $rowFollow) { if (-not @($vs | Where-Object { [string]$_.followUp.question -eq $f }).Count) { $cp.Add("$tag $listName gives it the follow-up $f, and no version has it") } }

    $built.Add([pscustomobject]@{
      id = $id; slot = $slot; state = $state; partners = $partners
      origin = $(if ($hasOrigin) { [ordered]@{ kind = [string]$src.origin.kind; basedOn = $basedOn } } else { $null })
      system = $system; task = $task; groups = $groups; sections = $groupSecs; also = $also; versions = $vOut
      objectives = $objs; units = $units; section = $ownSec; title = $title; quote = $quote; find = $find
    })
  }

  # ---- Write the command pack in the house layout ----
  function Format-Command($c) {
    $acc = @(for ($g = 0; $g -lt $c.groups.Count; $g++) {
      $s = '        { "lines": ' + (ConvertTo-JsonList $c.groups[$g])
      if (@($c.sections[$g]).Count) { $s += ', "sections": ' + (ConvertTo-JsonList $c.sections[$g]) }
      $s + ' }'
    }) -join ",`n"
    $ver = @(foreach ($v in $c.versions) {
      $o = @(foreach ($x in $v.outputs) {
        if ($x.Contains('exhibitOf')) { '            { "exhibitOf": ' + (ConvertTo-JsonString $x.exhibitOf) + ' }' }
        else { '            { "text": ' + (ConvertTo-JsonString $x.text) + ' }' }
      }) -join ",`n"
      @(
        '        {'
        '          "id": ' + (ConvertTo-JsonString $v.id) + ','
        '          "outputs": ['
        $o
        $(if ($v.followUp) { '          ],' } else { '          ]' })
        if ($v.followUp) { '          "followUp": { "question": ' + (ConvertTo-JsonString $v.followUp) + ' }' }
        '        }'
      ) -join "`n"
    }) -join ",`n"
    @(
      '    {'
      '      "id": ' + (ConvertTo-JsonString $c.id) + ','
      if (@($c.partners).Count) { '      "typedFormOf": ' + (ConvertTo-JsonList $c.partners) + ',' }
      if ($c.origin) { '      "origin": { "kind": ' + (ConvertTo-JsonString $c.origin.kind) + ', "basedOn": ' + (ConvertTo-JsonString $c.origin.basedOn) + ' },' }
      '      "system": ' + (ConvertTo-JsonString $c.system) + ','
      '      "task": ' + (ConvertTo-JsonString $c.task) + ','
      '      "accept": ['
      $acc
      '      ],'
      if (@($c.also).Count) { '      "alsoWorks": ' + (ConvertTo-JsonList $c.also) + ',' }
      '      "versions": ['
      $ver
      '      ],'
      '      "objectives": ' + (ConvertTo-JsonList $c.objectives) + ','
      '      "units": ' + (ConvertTo-JsonList $c.units) + ','
      '      "reference": {'
      '        "source": "certmaster",'
      '        "section": ' + (ConvertTo-JsonString $c.section) + ','
      '        "title": ' + (ConvertTo-JsonString $c.title) + ','
      '        "quote": ' + (ConvertTo-JsonString $c.quote) + ','
      '        "find": ' + (ConvertTo-JsonString $c.find)
      '      }'
      '    }'
    ) -join "`n"
  }
  $packDir = Join-Path $Scratch 'packs'
  New-Item -ItemType Directory -Force $packDir | Out-Null
  $sorted = @($built | Sort-Object id)
  $cFile = Join-Path $packDir "unit-$nn.commands.json"
  $chead = "{`n  `"`$schema`": `"../../../schemas/command-pack.schema.json`",`n  `"pack`": { `"id`": `"unit-$nn`", `"title`": $(ConvertTo-JsonString $unitTitle), `"reviewed`": false, `"lastCommand`": $lastC, `"lastVersion`": $lastV$noteField },`n  `"commands`": [`n"
  [IO.File]::WriteAllText($cFile, $chead + ((@($sorted | ForEach-Object { Format-Command $_ })) -join ",`n") + "`n  ]`n}`n", $utf8)
  # The id list maps what checkers report back to the slots you fix. Ids never change on a rebuild.
  $idRows = foreach ($c in $sorted) {
    "$($c.id)`t$($c.slot)`tcommand`t$(@($c.partners) -join ' ')`t$($c.state)"
    $vn = 0
    foreach ($v in $c.versions) { $vn++; "$($v.id)`t$($c.slot)`tversion $vn`t$($v.followUp)`t$($v.state)" }
  }
  [IO.File]::WriteAllLines((Join-Path $packDir 'command-ids.tsv'), [string[]]@($idRows), $utf8)
  # The stored-lines list: every line the pack stores, as the content check's Stored lines table lists them.
  $lineRows = foreach ($c in $sorted) {
    for ($g = 0; $g -lt $c.groups.Count; $g++) {
      $sec = if (@($c.sections[$g]).Count) { @($c.sections[$g]) -join ' ' } else { $c.section }
      foreach ($line in $c.groups[$g]) { "$($c.system)`t$line`t$($c.id)`t$($c.slot)`t$($g + 1)`t$sec" }
    }
    foreach ($line in $c.also) { "$($c.system)`t$line`t$($c.id)`t$($c.slot)`talso`t$($c.section)" }
  }
  [IO.File]::WriteAllLines((Join-Path $packDir 'stored-lines.tsv'), [string[]]@($lineRows), $utf8)
  # Round trip: the file must parse and keep every command.
  $check = Read-Json $cFile
  if (@($check.commands).Count -ne $sorted.Count) { $cp.Add("the written pack has $(@($check.commands).Count) commands, expected $($sorted.Count)") }

  $nv = 0; $nf = 0
  foreach ($c in $sorted) { $nv += $c.versions.Count; $nf += @($c.versions | Where-Object { $_.followUp }).Count }
  "$unitTitle"
  "Commands: $($sorted.Count) ($(@($sorted | Where-Object { $_.state -eq 'kept' }).Count) kept their ids, $(@($sorted | Where-Object { $_.state -eq 'new' }).Count) new); versions: $nv, with a follow-up: $nf; lastCommand $lastC, lastVersion $lastV"
  $unbuilt = @($cmdDraft.Keys | Where-Object { $itemOrder -notcontains $_ } | Sort-Object)
  if ($unbuilt.Count) { "Drafts with no rows in $listName (not built): $($unbuilt -join ', ')" }
  $retired = @(@($old | Where-Object { -not $_.taken } | ForEach-Object { $_.id }) + @($old | ForEach-Object { $_.versions } | Where-Object { -not $_.taken } | ForEach-Object { $_.id }))
  if ($retired.Count) { "Ids in $packName that no command keeps (retired, never used again): $($retired -join ', ')" }
  "Command problems: $($cp.Count)"; $cp | ForEach-Object { "  $_" }
  "Written to $packDir"
  return
}

# ---- Questions --------------------------------------------------------------------------------------
$problems = New-Object System.Collections.Generic.List[string]
$items = New-Object System.Collections.Generic.List[object]
$drafts = @{}; $lessons = @()
if (-not $CardsOnly) {
  $spec = Read-Json "$Scratch\spec.json"
  $lessons = @($spec.lessons.PSObject.Properties)
  foreach ($pattern in 'draft-*.json', 'revised-*.json', 'fixes-*.json') {
    foreach ($f in Get-ChildItem -LiteralPath "$Scratch\work" -Filter $pattern -File -ErrorAction SilentlyContinue | Sort-Object Name) {
      foreach ($q in (Read-Json $f.FullName).questions) { $drafts[$q.slot] = $q }
    }
  }
}
$n = 0
foreach ($lp in $lessons) {
  foreach ($slot in @($lp.Value)) {
    $src = $drafts[$slot.slot]
    if (-not $src) { $problems.Add("$($slot.slot) ($($lp.Name)): no draft"); continue }
    $n++
    $id = '{0}-u{1}-q{2:D3}' -f $Course, $nn, $n
    $q = [ordered]@{
      id = $id; stem = $src.stem.Trim()
      choices = @($src.choices | ForEach-Object { [ordered]@{ id = $_.id; text = $_.text.Trim() } })
      answer = @($src.answer); objectives = @($src.objectives); units = @($src.units)
      reference = [ordered]@{ source = 'certmaster'; section = $src.reference.section; title = $src.reference.title; quote = ''; find = ($src.reference.find -replace '\s+', ' ').Trim() }
      origin = [ordered]@{ kind = $src.origin.kind; basedOn = $src.origin.basedOn }
    }
    $tag = "$id ($($slot.slot), lesson $($lp.Name))"
    # A text exhibit (a command's output, written fresh for the question) goes into the pack after the stem.
    if ($src.PSObject.Properties.Name -contains 'exhibit' -and $null -ne $src.exhibit) {
      if ($src.exhibit.type -ne 'text' -or -not ($src.exhibit.text -is [string]) -or -not $src.exhibit.text.Trim()) {
        $problems.Add("$tag exhibit must be { ""type"": ""text"", ""text"": ""..."" }")
      } else {
        $exLines = @((($src.exhibit.text -replace "`r", '') -split "`n" | ForEach-Object { $_.TrimEnd() }))
        while ($exLines.Count -and -not $exLines[0]) { $exLines = @($exLines | Select-Object -Skip 1) }
        while ($exLines.Count -and -not $exLines[-1]) { $exLines = @($exLines | Select-Object -SkipLast 1) }
        $q.exhibit = [ordered]@{ type = 'text'; text = ($exLines -join "`n") }
        if ($exLines.Count -gt 12) { $problems.Add("$tag exhibit has $($exLines.Count) lines (12 at most)") }
        $long = @(for ($i = 0; $i -lt $exLines.Count; $i++) { if ($exLines[$i].Length -gt 25) { $i + 1 } })
        if ($long.Count) { $problems.Add("$tag exhibit line(s) $($long -join ', ') over 25 characters: they wrap on a 320 px phone") }
        # The dashes are built from their code points so this file stays ASCII (PowerShell 5.1 reads it as ANSI).
        if ($q.exhibit.text -match ('[' + [char]0x2013 + [char]0x2014 + ']')) { $problems.Add("$tag em or en dash in the exhibit") }
      }
    }
    $cids = @($q.choices | ForEach-Object { $_.id }); $na = @($q.answer).Count; $nc = $cids.Count
    if (($cids -join '') -ne ('abcdef'.Substring(0, [Math]::Min(6, $nc)))) { $problems.Add("$tag choice ids are not a, b, c... in order") }
    if (@($q.choices | ForEach-Object { Get-Norm $_.text } | Select-Object -Unique).Count -ne $nc) { $problems.Add("$tag two choices have the same text") }
    foreach ($a in $q.answer) { if ($cids -notcontains $a) { $problems.Add("$tag answer '$a' is not a choice") } }
    if ($na -eq 1 -and $nc -ne 4) { $problems.Add("$tag one answer with $nc choices (must be 4)") }
    if ($na -gt 1 -and $nc -lt 5) { $problems.Add("$tag choose $na with only $nc choices (must be 5)") }
    if ($na -gt 1 -and $nc -eq 6) { $problems.Add("$tag NOTE 6 choices: allowed only when $($q.origin.basedOn) had 6 or more") }
    if ($na -gt 3 -or $nc -gt 6) { $problems.Add("$tag $na answers and $nc choices is out of range") }
    foreach ($o in $q.objectives) { if (-not $objTitle.ContainsKey($o)) { $problems.Add("$tag unknown objective '$o'") } }
    foreach ($s in $q.units) { if (-not $secTitle.ContainsKey($s)) { $problems.Add("$tag unknown section '$s'") } }
    foreach ($s in $q.units) { if (($s -split '\.')[0] -ne $unitMajor) { $problems.Add("$tag section '$s' is outside Unit $Unit (cite only this unit's sections)") } }
    if (@($q.units) -notcontains $q.reference.section) { $problems.Add("$tag reference.section is not in units") }
    if ($secTitle[$q.reference.section] -ne $q.reference.title) { $problems.Add("$tag title should be '$($secTitle[$q.reference.section])'") }
    $w = @($q.reference.find -split '\s+').Count
    if ($w -lt 3 -or $w -gt 6) { $problems.Add("$tag find phrase has $w words (3 to 6)") }
    if ($q.reference.find -match '-$') { $problems.Add("$tag find phrase ends in a hyphen") }
    $raw = "$Scratch\text\$($q.reference.section).raw.txt"
    if (Test-Path -LiteralPath $raw) {
      $lines = [IO.File]::ReadAllText($raw, [Text.Encoding]::UTF8) -split "`r?`n|`f"
      $want = Get-Norm $q.reference.find
      $hits = @(for ($i = 0; $i -lt $lines.Count; $i++) { if ((Get-Norm $lines[$i]).Contains($want)) { $i } })
      if ($hits.Count -eq 0) { $problems.Add("$tag find phrase is not on any one line of $($q.reference.section): [$($q.reference.find)]") }
      elseif ($lines[$hits[0]] -match '^\s*(\d+/\d+/\d+,|Copyright|https?://)|CertMaster Learn') { $problems.Add("$tag find phrase is in a page header or footer") }
      elseif ((Get-Norm $lines[$hits[0]]).StartsWith($want) -and $hits[0] -gt 0 -and $lines[$hits[0] - 1].TrimEnd() -match '[A-Za-z]-$') { $problems.Add("$tag find phrase starts with the second half of a hyphenated word") }
    } else { $problems.Add("$tag no text file for section $($q.reference.section)") }
    $all = $q.stem + ' ' + (($q.choices | ForEach-Object { $_.text }) -join ' ')
    if ($all -match '[\u2013\u2014]') { $problems.Add("$tag em or en dash") }
    if ($all -match '(?i)all of the above|none of the above|\(select|choose (two|three)|select (two|three)') { $problems.Add("$tag banned phrase") }
    $sentences = ([regex]::Matches($q.stem, '[.?!](\s|$)')).Count
    if ($sentences -gt 2) { $problems.Add("$tag stem has $sentences sentences (2 at most)") }
    $ask = @($q.stem -split '(?<=[.!?])\s+')[-1]
    if ($ask -cmatch "\bnot\b|n't\b") { $problems.Add("$tag the question asks a negative in lowercase (write NOT in capitals)") }
    if (@('certmaster-variation', 'messer-variation', 'practice-exam-variation', 'teacher', 'original') -notcontains $q.origin.kind) { $problems.Add("$tag origin.kind '$($q.origin.kind)'") }
    # One spelling per item, so the used-once check below can find it in every pack.
    if ($q.origin.kind -eq 'practice-exam-variation' -and $q.origin.basedOn -cnotmatch '^Practice Tests [1-7] Q[1-9]\d*$') { $problems.Add("$tag basedOn '$($q.origin.basedOn)' should read like 'Practice Tests 1 Q33'") }
    elseif ($q.origin.kind -eq 'practice-exam-variation' -and $practiceIndex.Count) {
      if (-not $practiceIndex.ContainsKey($q.origin.basedOn)) { $problems.Add("$tag $($q.origin.basedOn) is not in the practice exam index") }
      elseif ($practiceIndex[$q.origin.basedOn].flags -match 'figure') { $problems.Add("$tag $($q.origin.basedOn) needs a figure (not usable)") }
    }
    if ($q.origin.basedOn -and $usedSource.ContainsKey($q.origin.basedOn)) { $problems.Add("$tag $($q.origin.basedOn) is already used by $($usedSource[$q.origin.basedOn])") }
    $items.Add([pscustomobject]@{ lesson = $lp.Name; slot = $slot.slot; keep = [bool]$src.keepOrder; q = $q })
  }
}
$items | Group-Object { $_.q.origin.basedOn } | Where-Object Count -gt 1 | ForEach-Object { $problems.Add("$($_.Name) is the source of more than one question") }

# ---- Spread the keys --------------------------------------------------------------------------------
# Writers tend to put the key first. A student who turns shuffling off would notice, so:
#  - Choices with a natural order are never touched: a draft marked "keepOrder": true, or choices whose
#    texts are the same apart from their numbers and units (RAID 0/1/5/10, 4/8/16 GB, 100 Mbps/1 Gbps,
#    Cat 5e/6/6a, 802.11ac/ax, Wi-Fi 6/6E).
#  - A single-answer key moves only while its letter keys more than a quarter (rounded up) of its
#    lesson's single-answer questions, then only while it keys more than a quarter of the pack's, to
#    the least-used letter, by swapping two choices. The lesson pass comes first: a pass over the whole
#    pack alone moves only keys near the start, so the last lesson kept the writers' habit (Network+
#    lesson 5.7 had six "a" keys in a row), and a one-lesson test with shuffling off showed it.
#  - A choose-two or choose-three item whose keys sit at the top (a and b) is rotated down.
# Only letters change, never which text is the key.
function Get-Template([string]$text) {
  $t = $text.ToLowerInvariant()
  # A number with its unit becomes one placeholder: "100 Mbps" and "1 Gbps" read alike.
  $t = $t -replace '[+\-]?\d[\d.,]*\s*(?:[kmgt]i?b(?:ps|/s)?|[kmg]?hz|rpm|vac|vdc|v|w|ns|ms|ft|cm|mm|m|in(?:ch(?:es)?)?)\b', '#'
  # Any other word that holds a digit (5e, 6a, 802.11ac, x16, DDR4, IPv6) becomes a placeholder too.
  $t = (($t -split '\s+') | ForEach-Object { if ($_ -match '\d') { '#' } else { $_ } }) -join ' '
  ($t -replace '\s+', ' ').Trim()
}
function Test-Ordered($choices) {
  $texts = @($choices | ForEach-Object { $_.text })
  if (@($texts | Where-Object { $_ -notmatch '\d' }).Count) { return $false }
  @($texts | ForEach-Object { Get-Template $_ } | Select-Object -Unique).Count -eq 1
}
$moved = New-Object System.Collections.Generic.List[string]
if (-not $NoSpread) {
  $letters = 'a', 'b', 'c', 'd'
  $single = @($items | Where-Object { @($_.q.answer).Count -eq 1 -and @($_.q.choices).Count -eq 4 })
  $count = @{ a = 0; b = 0; c = 0; d = 0 }
  $inLesson = @{}; $lessonSize = @{}
  foreach ($it in $single) {
    if (-not $inLesson.ContainsKey($it.lesson)) { $inLesson[$it.lesson] = @{ a = 0; b = 0; c = 0; d = 0 }; $lessonSize[$it.lesson] = 0 }
    $count[$it.q.answer[0]]++; $inLesson[$it.lesson][$it.q.answer[0]]++; $lessonSize[$it.lesson]++
  }
  $cap = [Math]::Ceiling($single.Count / 4)
  $rot = 0
  # Pass 1 spreads the keys within each lesson; pass 2 across the pack, never past a lesson's quarter.
  foreach ($pass in 1, 2) {
    foreach ($it in $single) {
      $q = $it.q; $cur = $q.answer[0]; $lc = $inLesson[$it.lesson]; $lcap = [Math]::Ceiling($lessonSize[$it.lesson] / 4)
      if ($it.keep -or (Test-Ordered $q.choices)) { continue }
      if ($pass -eq 1) {
        if ($lc[$cur] -le $lcap) { continue }
        $target = $letters | Where-Object { $lc[$_] -lt $lcap } | Sort-Object { $lc[$_] }, { $count[$_] }, { ([array]::IndexOf($letters, $_) - $rot + 4) % 4 } | Select-Object -First 1
      } else {
        if ($count[$cur] -le $cap) { continue }
        $target = $letters | Where-Object { $count[$_] -lt $cap -and $lc[$_] -lt $lcap } | Sort-Object { $count[$_] }, { $lc[$_] }, { ([array]::IndexOf($letters, $_) - $rot + 4) % 4 } | Select-Object -First 1
      }
      if (-not $target) { continue }
      $from = [array]::IndexOf($letters, $cur); $to = [array]::IndexOf($letters, $target)
      $t = $q.choices[$from].text; $q.choices[$from].text = $q.choices[$to].text; $q.choices[$to].text = $t
      $q.answer = @($target); $count[$cur]--; $count[$target]++; $lc[$cur]--; $lc[$target]++; $rot = ($to + 1) % 4
      $moved.Add("$($q.id): $cur -> $target")
    }
  }
  $j = 0
  foreach ($it in $items) {
    $q = $it.q; $k = @($q.answer).Count; $nc = @($q.choices).Count
    if ($k -lt 2 -or $it.keep -or (Test-Ordered $q.choices)) { continue }
    $top = 'abcdef'.Substring(0, $k)
    if ((@($q.answer) -join '') -ne $top) { continue }
    $r = ($j % ($nc - $k)) + 1; $j++
    $keyTexts = @($q.answer | ForEach-Object { $a = $_; ($q.choices | Where-Object { $_.id -eq $a }).text })
    $texts = @($q.choices | ForEach-Object { $_.text })
    for ($i = 0; $i -lt $nc; $i++) { $q.choices[($i + $r) % $nc].text = $texts[$i] }
    $q.answer = @($q.choices | Where-Object { $keyTexts -contains $_.text } | ForEach-Object { $_.id })
    $moved.Add("$($q.id): $top -> $(@($q.answer) -join '')")
  }
}
$spread = ($items | Where-Object { @($_.q.answer).Count -eq 1 } | Group-Object { $_.q.answer[0] } | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', '

# ---- Flashcards -------------------------------------------------------------------------------------
$cards = New-Object System.Collections.Generic.List[object]
$cardProblems = New-Object System.Collections.Generic.List[string]
$cardFile = "$Scratch\work\cards.json"
if (Test-Path -LiteralPath $cardFile) {
  $k = 0
  foreach ($c in (Read-Json $cardFile).flashcards) {
    $k++; $cid = '{0}-u{1}-f{2:D3}' -f $Course, $nn, $k
    $card = [ordered]@{ id = $cid; term = $c.term.Trim(); definition = $c.definition.Trim(); objectives = @($c.objectives); units = @($c.units); reference = [ordered]@{ source = 'certmaster'; section = $c.reference.section; title = $c.reference.title } }
    foreach ($o in $card.objectives) { if (-not $objTitle.ContainsKey($o)) { $cardProblems.Add("$cid unknown objective '$o'") } }
    foreach ($s in $card.units) { if (-not $secTitle.ContainsKey($s)) { $cardProblems.Add("$cid unknown section '$s'") } }
    foreach ($s in $card.units) { if (($s -split '\.')[0] -ne $unitMajor) { $cardProblems.Add("$cid section '$s' is outside Unit $Unit (cite only this unit's sections)") } }
    if (@($card.units) -notcontains $card.reference.section) { $cardProblems.Add("$cid reference.section is not in units") }
    if ($secTitle[$card.reference.section] -ne $card.reference.title) { $cardProblems.Add("$cid title should be '$($secTitle[$card.reference.section])'") }
    if (($card.term + ' ' + $card.definition) -match '[\u2013\u2014]') { $cardProblems.Add("$cid em or en dash") }
    if ($usedTerm.ContainsKey((Get-Norm $card.term))) { $cardProblems.Add("$cid '$($card.term)' already has a card, $($usedTerm[(Get-Norm $card.term)]): drop this one and add your section to that card's units instead") }
    # Testable only (docs/CONTENT-GUIDE.md, "Which terms get a card"): an objective this unit's lessons list, and a "card" row.
    if (-not @($card.objectives | Where-Object { $unitObjectives.ContainsKey(($_ -replace '\.[a-z][a-z0-9]*$', '')) }).Count) { $cardProblems.Add("$cid is tagged to no objective that a Unit $Unit lesson lists") }
    if ($termList -and -not $termList.ContainsKey((Get-Norm $card.term))) { $cardProblems.Add("$cid '$($card.term)' is not a card row of card-terms.tsv: drop it, or add a checked row first") }
    $cards.Add($card)
  }
  $cards | Group-Object { Get-Norm $_.term } | Where-Object Count -gt 1 | ForEach-Object { $cardProblems.Add("two cards for the term '$($_.Name)'") }
}

# ---- Write in the house layout ----------------------------------------------------------------------
function Format-Question($x) {
  $ch = ($x.choices | ForEach-Object { '        { "id": ' + (ConvertTo-JsonString $_.id) + ', "text": ' + (ConvertTo-JsonString $_.text) + ' }' }) -join ",`n"
  @(
    '    {'
    '      "id": ' + (ConvertTo-JsonString $x.id) + ','
    '      "stem": ' + (ConvertTo-JsonString $x.stem) + ','
    if ($x.Contains('exhibit')) { '      "exhibit": { "type": "text", "text": ' + (ConvertTo-JsonString $x.exhibit.text) + ' },' }
    '      "choices": ['
    $ch
    '      ],'
    '      "answer": ' + (ConvertTo-JsonList $x.answer) + ','
    '      "objectives": ' + (ConvertTo-JsonList $x.objectives) + ','
    '      "units": ' + (ConvertTo-JsonList $x.units) + ','
    '      "reference": {'
    '        "source": "certmaster",'
    '        "section": ' + (ConvertTo-JsonString $x.reference.section) + ','
    '        "title": ' + (ConvertTo-JsonString $x.reference.title) + ','
    '        "quote": "",'
    '        "find": ' + (ConvertTo-JsonString $x.reference.find)
    '      },'
    '      "origin": { "kind": ' + (ConvertTo-JsonString $x.origin.kind) + ', "basedOn": ' + (ConvertTo-JsonString $x.origin.basedOn) + ' }'
    '    }'
  ) -join "`n"
}
function Format-Card($c) {
  @(
    '    {'
    '      "id": ' + (ConvertTo-JsonString $c.id) + ','
    '      "term": ' + (ConvertTo-JsonString $c.term) + ','
    '      "definition": ' + (ConvertTo-JsonString $c.definition) + ','
    '      "objectives": ' + (ConvertTo-JsonList $c.objectives) + ','
    '      "units": ' + (ConvertTo-JsonList $c.units) + ','
    '      "reference": { "source": "certmaster", "section": ' + (ConvertTo-JsonString $c.reference.section) + ', "title": ' + (ConvertTo-JsonString $c.reference.title) + ' }'
    '    }'
  ) -join "`n"
}
$packs = Join-Path $Scratch 'packs'
New-Item -ItemType Directory -Force $packs | Out-Null
$head = "{`n  `"`$schema`": `"../../../schemas/question-pack.schema.json`",`n  `"pack`": { `"id`": `"unit-$nn`", `"title`": $(ConvertTo-JsonString $unitTitle), `"reviewed`": false$noteField },`n  `"questions`": [`n"
$qFile = Join-Path $packs "unit-$nn.questions.json"
if (-not $CardsOnly) {
  [IO.File]::WriteAllText($qFile, $head + (($items | ForEach-Object { Format-Question $_.q }) -join ",`n") + "`n  ]`n}`n", $utf8)
  foreach ($g in $items | Group-Object lesson) {
    [IO.File]::WriteAllText((Join-Path $packs "unit-$nn.lesson-$($g.Name).txt"), ((@($g.Group) | ForEach-Object { Format-Question $_.q }) -join ",`n") + "`n", $utf8)
  }
}
if ($cards.Count) {
  $fhead = "{`n  `"`$schema`": `"../../../schemas/flashcard-pack.schema.json`",`n  `"pack`": { `"id`": `"unit-$nn`", `"title`": $(ConvertTo-JsonString $unitTitle), `"reviewed`": false$noteField },`n  `"flashcards`": [`n"
  [IO.File]::WriteAllText((Join-Path $packs "unit-$nn.flashcards.json"), $fhead + (($cards | ForEach-Object { Format-Card $_ }) -join ",`n") + "`n  ]`n}`n", $utf8)
}
if (-not $CardsOnly) {
  [IO.File]::WriteAllLines((Join-Path $packs 'keys-moved.txt'), [string[]]@($moved), $utf8)
  # Checkers report ids; fixes go by slot. Ids follow spec order, so dropping a slot renumbers later ids.
  [IO.File]::WriteAllLines((Join-Path $packs 'ids.tsv'), [string[]]@($items | ForEach-Object { "$($_.q.id)`t$($_.slot)`t$($_.lesson)`t$($_.q.origin.basedOn)" }), $utf8)
}
if ($cards.Count) { [IO.File]::WriteAllLines((Join-Path $packs 'card-ids.tsv'), [string[]]@($cards | ForEach-Object { "$($_.id)`t$($_.term)" }), $utf8) }

# Round trip: the files must parse and keep every item.
if (-not $CardsOnly) {
  $check = Read-Json $qFile
  if (@($check.questions).Count -ne $items.Count) { $problems.Add("the written pack has $(@($check.questions).Count) questions, expected $($items.Count)") }
}

"$unitTitle"
if ($CardsOnly) { 'Questions: not built (-CardsOnly)' }
else {
  "Questions: $($items.Count) (" + (($items | Group-Object lesson | ForEach-Object { "$($_.Name): $($_.Count)" }) -join ', ') + "); choose two or three: " + @($items | Where-Object { @($_.q.answer).Count -gt 1 }).Count
  "Single-answer keys: $spread; keys moved by the spread: $($moved.Count) (keys-moved.txt)"
  "Single-answer keys by lesson: " + (($items | Where-Object { @($_.q.answer).Count -eq 1 } | Group-Object lesson | ForEach-Object { "$($_.Name) " + (($_.Group | Group-Object { $_.q.answer[0] } | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ' ') }) -join '; ')
  "Question problems: $($problems.Count)"; $problems | ForEach-Object { "  $_" }
}
if (Test-Path -LiteralPath $cardFile) { "Flashcards: $($cards.Count); card problems: $($cardProblems.Count)"; $cardProblems | ForEach-Object { "  $_" } }
"Written to $packs"
