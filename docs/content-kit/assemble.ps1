<#
  assemble.ps1
  Builds a unit's question pack and flashcard pack from the chat's drafts. It checks every mechanical
  rule, spreads the answer keys across the letters, and writes the packs in the house layout. It writes
  only under -Scratch\packs. Copy the result into data/ with the Write and Edit tools.

    powershell -ExecutionPolicy Bypass -File assemble.ps1 -Scratch "<scratchpad>" -Exam a-plus-core-1 -Unit 2.0
    powershell -ExecutionPolicy Bypass -File assemble.ps1 -Scratch "<scratchpad>" -Exam network-plus -Unit 6.0

  -Exam is required: a-plus-core-1 (data\a-plus-core-1, ids like c1-u02-q001) or network-plus
  (data\network-plus, ids like n-u06-q001). -Data and -Course override the folder and the id prefix.
  -CardsOnly builds only the flashcard pack (spec.json and the question drafts are not read), to check
  cards early. -NoSpread leaves every key where the draft put it.

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

  Writes, under -Scratch\packs:
    unit-NN.questions.json   The question pack, house layout, ids assigned.
    unit-NN.flashcards.json  The flashcard pack.
    unit-NN.lesson-X.Y.txt   That lesson's question blocks, ready to paste into the pack with Edit.
    keys-moved.txt           Every key the spread moved (the key text never changes, only its letter).

  It also reads the exam's other packs in -Data, so a source item (a pool, Messer, or practice exam item)
  or a flashcard term already used in another unit is reported.
#>
param(
  [Parameter(Mandatory = $true)][string]$Scratch,
  [Parameter(Mandatory = $true)][string]$Unit,
  [ValidateSet('a-plus-core-1', 'network-plus')][string]$Exam,
  [string]$Data,
  [string]$Course,
  [switch]$NoSpread,
  [switch]$CardsOnly
)
$ErrorActionPreference = 'Stop'
# A forgotten -Exam stops here, instead of giving c1- ids or checking against the A+ outline.
if (-not $Exam) { throw 'assemble.ps1 needs -Exam a-plus-core-1 or -Exam network-plus.' }
# Each exam's data folder and id prefix (docs/CONTENT-GUIDE.md: c1- A+ Core 1, n- Network+).
$presets = @{ 'a-plus-core-1' = @{ Data = 'a-plus-core-1'; Course = 'c1' }; 'network-plus' = @{ Data = 'network-plus'; Course = 'n' } }
if (-not $PSBoundParameters.ContainsKey('Data')) { $Data = Join-Path 'C:\CompTIA Website\data' $presets[$Exam].Data }
if (-not $PSBoundParameters.ContainsKey('Course')) { $Course = $presets[$Exam].Course }
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Read-Json([string]$path) { [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8) | ConvertFrom-Json }
function Get-Norm([string]$s) { (($s -replace '[\u2010\u2011]', '-') -replace '\s+', ' ').Trim().ToLowerInvariant() }

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
function ConvertTo-JsonString([string]$s) { '"' + (($s -replace '\\', '\\') -replace '"', '\"' -replace "`r", '\r' -replace "`n", '\n' -replace "`t", '\t') + '"' }
function ConvertTo-JsonList($arr) { '[' + ((@($arr) | ForEach-Object { ConvertTo-JsonString $_ }) -join ', ') + ']' }
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
$head = "{`n  `"`$schema`": `"../../../schemas/question-pack.schema.json`",`n  `"pack`": { `"id`": `"unit-$nn`", `"title`": $(ConvertTo-JsonString $unitTitle), `"reviewed`": false },`n  `"questions`": [`n"
$qFile = Join-Path $packs "unit-$nn.questions.json"
if (-not $CardsOnly) {
  [IO.File]::WriteAllText($qFile, $head + (($items | ForEach-Object { Format-Question $_.q }) -join ",`n") + "`n  ]`n}`n", $utf8)
  foreach ($g in $items | Group-Object lesson) {
    [IO.File]::WriteAllText((Join-Path $packs "unit-$nn.lesson-$($g.Name).txt"), ((@($g.Group) | ForEach-Object { Format-Question $_.q }) -join ",`n") + "`n", $utf8)
  }
}
if ($cards.Count) {
  $fhead = "{`n  `"`$schema`": `"../../../schemas/flashcard-pack.schema.json`",`n  `"pack`": { `"id`": `"unit-$nn`", `"title`": $(ConvertTo-JsonString $unitTitle), `"reviewed`": false },`n  `"flashcards`": [`n"
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
