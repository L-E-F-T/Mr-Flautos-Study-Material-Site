<#
  assemble.ps1
  Builds a unit's question pack and flashcard pack from the chat's drafts. It checks every mechanical
  rule, spreads the answer keys across the letters, and writes the packs in the house layout. It writes
  only under -Scratch\packs. Copy the result into data/ with the Write and Edit tools.

    powershell -ExecutionPolicy Bypass -File assemble.ps1 -Scratch "<scratchpad>" -Unit 2.0

  Reads, under -Scratch:
    spec.json            { "lessons": { "2.1": [ { "slot": "q01" }, ... ], "2.2": [ ... ] } }
                         Lessons in pack order, slots in order within each lesson.
    work\draft-*.json    { "questions": [ { "slot": "q01", "stem", "choices", "answer", "objectives",
                           "units", "reference": { "section", "title", "find" },
                           "origin": { "kind", "basedOn" } } ] }
    work\revised-*.json  Same shape. Wins over the drafts.
    work\fixes-*.json    Same shape. Wins over both.
    work\cards.json      { "flashcards": [ { "term", "definition", "objectives", "units",
                           "reference": { "section", "title" } } ] }
    text\<section>.raw.txt  From extract-sources.ps1, for the find-phrase check.

  Writes, under -Scratch\packs:
    unit-NN.questions.json   The question pack, house layout, ids assigned.
    unit-NN.flashcards.json  The flashcard pack.
    unit-NN.lesson-X.Y.txt   That lesson's question blocks, ready to paste into the pack with Edit.
    keys-moved.txt           Every key the spread moved (the key text never changes, only its letter).

  It also reads the exam's other packs in -Data, so a Messer item or a flashcard term already used in
  another unit is reported.
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [Parameter(Mandatory = $true)][string]$Unit,
  [string]$Data = 'C:\CompTIA Website\data\a-plus-core-1',
  [string]$Course = 'c1',
  [switch]$NoSpread
)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Read-Json([string]$path) { [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8) | ConvertFrom-Json }
function Get-Norm([string]$s) { (($s -replace '[\u2010\u2011]', '-') -replace '\s+', ' ').Trim().ToLowerInvariant() }

$nn = ($Unit -split '\.')[0].PadLeft(2, '0')
$packName = "unit-$nn.json"

# ---- Outline lookups --------------------------------------------------------------------------------
$objTitle = @{}
foreach ($d in (Read-Json "$Data\objectives.json").domains) { foreach ($o in $d.objectives) { $objTitle[$o.id] = $o.title; foreach ($b in $o.subobjectives) { $objTitle[$b.id] = $b.title } } }
$secTitle = @{}; $unitTitle = $null
foreach ($u in (Read-Json "$Data\units.json").units) {
  if ($u.id -eq $Unit) { $unitTitle = "Unit $($u.id) $($u.title)" }
  foreach ($l in $u.subunits) { foreach ($s in $l.sections) { $secTitle[$s.id] = $s.title } }
}
if (-not $unitTitle) { throw "Unit $Unit is not in units.json" }

# ---- What the exam's other packs already use ---------------------------------------------------------
$usedSource = @{}; $usedTerm = @{}
foreach ($kind in 'questions', 'flashcards') {
  $manifest = "$Data\$kind\manifest.json"
  if (-not (Test-Path -LiteralPath $manifest)) { continue }
  foreach ($p in (Read-Json $manifest).packs) {
    if ($p -eq $packName) { continue }
    $f = "$Data\$kind\$p"
    if (-not (Test-Path -LiteralPath $f)) { continue }
    $pk = Read-Json $f
    if ($kind -eq 'questions') { foreach ($q in $pk.questions) { if ($q.origin.basedOn) { $usedSource[$q.origin.basedOn] = $q.id } } }
    else { foreach ($c in $pk.flashcards) { $usedTerm[(Get-Norm $c.term)] = $c.id } }
  }
}

# ---- Questions --------------------------------------------------------------------------------------
$spec = Read-Json "$Scratch\spec.json"
$drafts = @{}
foreach ($pattern in 'draft-*.json', 'revised-*.json', 'fixes-*.json') {
  foreach ($f in Get-ChildItem -LiteralPath "$Scratch\work" -Filter $pattern -File -ErrorAction SilentlyContinue | Sort-Object Name) {
    foreach ($q in (Read-Json $f.FullName).questions) { $drafts[$q.slot] = $q }
  }
}
$problems = New-Object System.Collections.Generic.List[string]
$items = New-Object System.Collections.Generic.List[object]
$n = 0
foreach ($lp in $spec.lessons.PSObject.Properties) {
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
    if (@('certmaster-variation', 'messer-variation', 'teacher', 'original') -notcontains $q.origin.kind) { $problems.Add("$tag origin.kind '$($q.origin.kind)'") }
    if ($q.origin.basedOn -and $usedSource.ContainsKey($q.origin.basedOn)) { $problems.Add("$tag $($q.origin.basedOn) is already used by $($usedSource[$q.origin.basedOn])") }
    $items.Add([pscustomobject]@{ lesson = $lp.Name; q = $q })
  }
}
$items | Group-Object { $_.q.origin.basedOn } | Where-Object Count -gt 1 | ForEach-Object { $problems.Add("$($_.Name) is the source of more than one question") }

# ---- Spread the keys --------------------------------------------------------------------------------
# Writers tend to put the key first. A student who turns shuffling off would notice, so:
#  - Choices with a natural order (sizes, voltages, RAID levels: texts that differ only in their
#    numbers) are never touched.
#  - A single-answer key moves only while its letter is used more than a quarter of the time (rounded
#    up), to the least-used letter, by swapping two choices.
#  - A choose-two or choose-three item whose keys sit at the top (a and b) is rotated down.
# Only letters change, never which text is the key.
function Test-Ordered($choices) {
  $texts = @($choices | ForEach-Object { $_.text })
  if (@($texts | Where-Object { $_ -notmatch '\d' }).Count) { return $false }
  @($texts | ForEach-Object { (($_ -replace '[\d.,+\-]', '') -replace '\s+', ' ').Trim().ToLowerInvariant() } | Select-Object -Unique).Count -eq 1
}
$moved = New-Object System.Collections.Generic.List[string]
if (-not $NoSpread) {
  $letters = 'a', 'b', 'c', 'd'
  $single = @($items | Where-Object { @($_.q.answer).Count -eq 1 -and @($_.q.choices).Count -eq 4 })
  $count = @{ a = 0; b = 0; c = 0; d = 0 }
  foreach ($it in $single) { $count[$it.q.answer[0]]++ }
  $cap = [Math]::Ceiling($single.Count / 4)
  $rot = 0
  foreach ($it in $single) {
    $q = $it.q; $cur = $q.answer[0]
    if ($count[$cur] -le $cap -or (Test-Ordered $q.choices)) { continue }
    $target = $letters | Where-Object { $count[$_] -lt $cap } | Sort-Object { $count[$_] }, { ([array]::IndexOf($letters, $_) - $rot + 4) % 4 } | Select-Object -First 1
    if (-not $target) { continue }
    $from = [array]::IndexOf($letters, $cur); $to = [array]::IndexOf($letters, $target)
    $t = $q.choices[$from].text; $q.choices[$from].text = $q.choices[$to].text; $q.choices[$to].text = $t
    $q.answer = @($target); $count[$cur]--; $count[$target]++; $rot = ($to + 1) % 4
    $moved.Add("$($q.id): $cur -> $target")
  }
  $j = 0
  foreach ($it in $items) {
    $q = $it.q; $k = @($q.answer).Count; $nc = @($q.choices).Count
    if ($k -lt 2 -or (Test-Ordered $q.choices)) { continue }
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
    if (@($card.units) -notcontains $card.reference.section) { $cardProblems.Add("$cid reference.section is not in units") }
    if ($secTitle[$card.reference.section] -ne $card.reference.title) { $cardProblems.Add("$cid title should be '$($secTitle[$card.reference.section])'") }
    if (($card.term + ' ' + $card.definition) -match '[\u2013\u2014]') { $cardProblems.Add("$cid em or en dash") }
    if ($usedTerm.ContainsKey((Get-Norm $card.term))) { $cardProblems.Add("$cid '$($card.term)' already has a card: $($usedTerm[(Get-Norm $card.term)])") }
    $cards.Add($card)
  }
  $cards | Group-Object { Get-Norm $_.term } | Where-Object Count -gt 1 | ForEach-Object { $cardProblems.Add("two cards for the term '$($_.Name)'") }
}

# ---- Write in the house layout ----------------------------------------------------------------------
function ConvertTo-JsonString([string]$s) { '"' + (($s -replace '\\', '\\') -replace '"', '\"' -replace "`r", '\r' -replace "`n", '\n' -replace "`t", '\t') + '"' }
function ConvertTo-JsonList($arr) { '[' + ((@($arr) | ForEach-Object { ConvertTo-JsonString $_ }) -join ', ') + ']' }
function Format-Question($x) {
  $ch = ($x.choices | ForEach-Object { '        { "id": ' + (ConvertTo-JsonString $_.id) + ', "text": ' + (ConvertTo-JsonString $_.text) + ' }' }) -join ",`n"
  @(
    '    {'
    '      "id": ' + (ConvertTo-JsonString $x.id) + ','
    '      "stem": ' + (ConvertTo-JsonString $x.stem) + ','
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
$head = "{`n  `"`$schema`": `"../../../schemas/question-pack.schema.json`",`n  `"pack`": { `"id`": `"unit-$nn`", `"title`": $(ConvertTo-JsonString $unitTitle), `"reviewed`": false },`n  `"questions`": [`n"
$qFile = Join-Path $packs "unit-$nn.questions.json"
[IO.File]::WriteAllText($qFile, $head + (($items | ForEach-Object { Format-Question $_.q }) -join ",`n") + "`n  ]`n}`n", $utf8)
foreach ($g in $items | Group-Object lesson) {
  [IO.File]::WriteAllText((Join-Path $packs "unit-$nn.lesson-$($g.Name).txt"), ((@($g.Group) | ForEach-Object { Format-Question $_.q }) -join ",`n") + "`n", $utf8)
}
if ($cards.Count) {
  $fhead = "{`n  `"`$schema`": `"../../../schemas/flashcard-pack.schema.json`",`n  `"pack`": { `"id`": `"unit-$nn`", `"title`": $(ConvertTo-JsonString $unitTitle), `"reviewed`": false },`n  `"flashcards`": [`n"
  [IO.File]::WriteAllText((Join-Path $packs "unit-$nn.flashcards.json"), $fhead + (($cards | ForEach-Object { Format-Card $_ }) -join ",`n") + "`n  ]`n}`n", $utf8)
}
[IO.File]::WriteAllLines((Join-Path $packs 'keys-moved.txt'), [string[]]@($moved), $utf8)

# Round trip: the files must parse and keep every item.
$check = Read-Json $qFile
if (@($check.questions).Count -ne $items.Count) { $problems.Add("the written pack has $(@($check.questions).Count) questions, expected $($items.Count)") }

"$unitTitle"
"Questions: $($items.Count) (" + (($items | Group-Object lesson | ForEach-Object { "$($_.Name): $($_.Count)" }) -join ', ') + "); choose two or three: " + @($items | Where-Object { @($_.q.answer).Count -gt 1 }).Count
"Single-answer keys: $spread; keys moved by the spread: $($moved.Count) (keys-moved.txt)"
"Question problems: $($problems.Count)"; $problems | ForEach-Object { "  $_" }
if (Test-Path -LiteralPath $cardFile) { "Flashcards: $($cards.Count); card problems: $($cardProblems.Count)"; $cardProblems | ForEach-Object { "  $_" } }
"Written to $packs"
