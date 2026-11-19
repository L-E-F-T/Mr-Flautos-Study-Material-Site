<#
.SYNOPSIS
  Local test server for the study site. Needs nothing installed (Windows PowerShell 5.1+).

.DESCRIPTION
  Serves this project folder at http://localhost:<Port>/ so the site can be tested exactly the
  way it will run on GitHub Pages or on the lab web server. Only this computer can reach it
  (it listens on localhost only). Files are sent with no-cache headers, so after editing a file
  you only need to refresh the browser. Press Ctrl+C in the server window to stop it.

.EXAMPLE
  serve.cmd
  Double-click friendly launcher in the project root. Opens http://localhost:8080/

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File tools\serve.ps1 -Port 5500 -Open

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File tools\serve.ps1 -Port 8091 -DataOverlays "8091=tools\test-data\ready"
  Fixture server. Port 8091 answers requests under data/ from the test folder first. Only ports
  8091 to 8095 can serve test data (see tools\test-data\README.md).
#>
[CmdletBinding()]
param(
  [ValidateRange(1024, 65535)]
  [int]$Port = 8080,

  # More ports to answer on with the same files, as a comma-separated list ("8082,8083").
  # A browser keeps saved data separately for each port, so automated tests can use these
  # without touching the decks, tests, and history saved on the main port.
  [string]$AlsoPorts = '',

  # Test data, for the fixture server only (study-site-fixture in .claude\launch.json; see
  # tools\test-data\README.md). "port=folder" pairs separated by semicolons:
  #   "8091=tools\test-data\ready;8092=tools\test-data\soon"
  # On a listed port, a request under /data/ is answered from that folder when the file is
  # there, and from the real data folder when it is not. Only ports 8091 to 8095 may be
  # listed, so ports 8080 to 8085 always serve the real files. The server answers on each
  # listed port too. Without this setting nothing changes.
  [string]$DataOverlays = '',

  # Folder to serve. Defaults to the project root (the parent of this tools folder).
  [string]$Root,

  # Open the site in the default browser once the server is running.
  [switch]$Open
)

$ErrorActionPreference = 'Stop'

if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
$Root = (Resolve-Path -LiteralPath $Root).ProviderPath.TrimEnd('\')
$RootWithSep = $Root + '\'

$MimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.map'  = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
  '.csv'  = 'text/csv; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2' = 'font/woff2'
  '.pdf'  = 'application/pdf'
}

# Test data (only with -DataOverlays): which folder stands in for data\ on which port.
$overlays = @{}
$overlayNames = @{}
if ($DataOverlays) {
  $DataWithSep = $RootWithSep + 'data\'
  $testData = $null
  foreach ($pair in ($DataOverlays -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
    $overlayPort, $overlayFolder = $pair -split '=', 2
    $problem = $null
    $overlayPath = $null
    if ($overlayPort -notmatch '^\d{4}$' -or [int]$overlayPort -lt 8091 -or [int]$overlayPort -gt 8095) {
      $problem = 'Test data is served only on ports 8091 to 8095.'
    }
    elseif (-not $overlayFolder -or -not $overlayFolder.Trim()) {
      $problem = 'Each pair needs a folder, for example 8091=tools\test-data\ready.'
    }
    else {
      $overlayFolder = $overlayFolder.Trim()
      if (-not [System.IO.Path]::IsPathRooted($overlayFolder)) { $overlayFolder = Join-Path $Root $overlayFolder }
      try { $overlayPath = [System.IO.Path]::GetFullPath($overlayFolder).TrimEnd('\') } catch { $overlayPath = $null }
      if (-not $overlayPath -or -not (Test-Path -LiteralPath $overlayPath -PathType Container)) { $problem = 'The folder was not found.' }
    }
    if ($problem) {
      Write-Host ""
      Write-Host "  Could not use -DataOverlays `"$pair`"." -ForegroundColor Red
      Write-Host "  $problem" -ForegroundColor Yellow
      Write-Host ""
      exit 1
    }
    $overlayShown = $overlayPath
    if ($overlayPath.StartsWith($RootWithSep, [StringComparison]::OrdinalIgnoreCase)) { $overlayShown = $overlayPath.Substring($RootWithSep.Length) }
    $overlays[[int]$overlayPort] = $overlayPath
    $overlayNames[[int]$overlayPort] = ($overlayShown -replace '\\', '/') -replace '[^\x20-\x7E]', '?'
  }
  # A fixture server never takes the default port by accident: with no -Port, its first test port is the main one.
  if ($overlays.Count -and -not $PSBoundParameters.ContainsKey('Port')) { $Port = @($overlays.Keys | Sort-Object)[0] }
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$extraPorts = @($AlsoPorts -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ } |
  Where-Object { $_ -ge 1024 -and $_ -le 65535 -and $_ -ne $Port } | Select-Object -Unique)
foreach ($extraPort in $extraPorts) { $listener.Prefixes.Add("http://localhost:$extraPort/") }
# Test data: answer on every listed test port, even one that -Port and -AlsoPorts leave out.
foreach ($overlayPort in @($overlays.Keys | Sort-Object)) {
  if ($overlayPort -ne $Port -and $extraPorts -notcontains $overlayPort) {
    $extraPorts += $overlayPort
    $listener.Prefixes.Add("http://localhost:$overlayPort/")
  }
}

try {
  $listener.Start()
}
catch {
  Write-Host ""
  Write-Host "  Could not start the server on port $(@($Port) + $extraPorts -join ', ')." -ForegroundColor Red
  Write-Host "  Another program is probably using that port. Try a different one, e.g.:" -ForegroundColor Yellow
  Write-Host "      serve.cmd -Port 8081" -ForegroundColor Yellow
  Write-Host "  Details: $($_.Exception.Message)"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "  Study site running at  $prefix" -ForegroundColor Green
if ($extraPorts.Count) { Write-Host "  Also on ports          $($extraPorts -join ', ')" }
Write-Host "  Serving folder         $Root"
foreach ($overlayPort in @($overlays.Keys | Sort-Object)) { Write-Host "  Test data on $overlayPort      $($overlayNames[$overlayPort])" }
Write-Host "  Validator              ${prefix}tools/validate.html"
Write-Host "  Press Ctrl+C to stop."
Write-Host ""

if ($Open) { Start-Process $prefix }

function Send-Text {
  param($Response, [int]$Status, [string]$Text, [bool]$IsHead)
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $Response.StatusCode = $Status
  $Response.ContentType = 'text/plain; charset=utf-8'
  $Response.ContentLength64 = $bytes.Length
  if (-not $IsHead) { $Response.OutputStream.Write($bytes, 0, $bytes.Length) }
}

try {
  while ($listener.IsListening) {
    # Wait in short slices so Ctrl+C is noticed between requests.
    $pending = $listener.GetContextAsync()
    while (-not $pending.AsyncWaitHandle.WaitOne(250)) { }
    $context = $pending.Result

    $request = $context.Request
    $response = $context.Response
    $isHead = $request.HttpMethod -eq 'HEAD'
    $status = 200

    try {
      $response.Headers['Cache-Control'] = 'no-store'
      $response.Headers['X-Content-Type-Options'] = 'nosniff'

      if ($request.HttpMethod -ne 'GET' -and -not $isHead) {
        $status = 405
        Send-Text $response $status 'Method not allowed' $isHead
      }
      else {
        $urlPath = $request.Url.AbsolutePath
        $relative = [Uri]::UnescapeDataString($urlPath).TrimStart('/') -replace '/', '\'

        $fullPath = $null
        try { $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $relative)) } catch { $fullPath = $null }

        if (-not $fullPath) {
          $status = 400
          Send-Text $response $status 'Bad request' $isHead
        }
        elseif ($fullPath -ne $Root -and -not $fullPath.StartsWith($RootWithSep, [StringComparison]::OrdinalIgnoreCase)) {
          $status = 403
          Send-Text $response $status 'Forbidden' $isHead
        }
        else {
          # Test data: on a listed port, a file under data\ is read from that port's test
          # folder when it is there. The port is the one the request really arrived on.
          if ($overlays.Count) {
            if ($request.LocalEndPoint) { $overlayPort = [int]$request.LocalEndPoint.Port } else { $overlayPort = [int]$request.Url.Port }
            $overlayRoot = $overlays[$overlayPort]
            if ($overlayRoot -and $fullPath.StartsWith($DataWithSep, [StringComparison]::OrdinalIgnoreCase)) {
              $overlayFile = $null
              $overlayRest = $fullPath.Substring($DataWithSep.Length)
              if ($overlayRest) {
                try { $overlayFile = [System.IO.Path]::GetFullPath((Join-Path $overlayRoot $overlayRest)) } catch { $overlayFile = $null }
              }
              if ($overlayFile -and $overlayFile.StartsWith($overlayRoot + '\', [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $overlayFile -PathType Leaf)) {
                $fullPath = $overlayFile
                $testData = $overlayNames[$overlayPort]
                $response.Headers['X-Test-Data'] = $testData
              }
            }
          }

          if (Test-Path -LiteralPath $fullPath -PathType Container) {
            if (-not $urlPath.EndsWith('/')) {
              # Redirect /folder to /folder/ so relative links inside it resolve correctly.
              $status = 301
              $response.StatusCode = $status
              $response.RedirectLocation = $urlPath + '/' + $request.Url.Query
              $response.ContentLength64 = 0
              $fullPath = $null
            }
            else {
              $fullPath = Join-Path $fullPath 'index.html'
            }
          }

          if ($fullPath) {
            if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
              $bytes = [System.IO.File]::ReadAllBytes($fullPath)
              $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
              $contentType = $MimeTypes[$extension]
              if (-not $contentType) { $contentType = 'application/octet-stream' }
              $response.StatusCode = 200
              $response.ContentType = $contentType
              $response.ContentLength64 = $bytes.Length
              if (-not $isHead) { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
            }
            else {
              $status = 404
              Send-Text $response $status "Not found: $urlPath" $isHead
            }
          }
        }
      }
    }
    catch {
      $status = 500
      try { Send-Text $response $status 'Server error' $isHead } catch { }
      Write-Host "  Error serving $($request.Url.AbsolutePath): $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
      try { $response.Close() } catch { }
      $color = 'Gray'
      if ($status -ge 400) { $color = 'Yellow' }
      if ($status -ge 500) { $color = 'Red' }
      Write-Host ("  {0} {1} {2}" -f $status, $request.HttpMethod, $request.Url.PathAndQuery) -ForegroundColor $color
      if ($overlays.Count) {
        if ($testData) { Write-Host "      from test data: $testData" -ForegroundColor Gray }
        $testData = $null
      }
    }
  }
}
finally {
  try { $listener.Stop() } catch { }
  try { $listener.Close() } catch { }
  Write-Host ""
  Write-Host "  Server stopped."
}
