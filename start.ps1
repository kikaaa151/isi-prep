<#
.SYNOPSIS
  Builds js\data.js from content\ and serves the app on http://127.0.0.1:<Port>/.
.EXAMPLE
  .\start.ps1
  .\start.ps1 -Port 8080 -NoBrowser
#>
param(
    [int]$Port = 5173,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$venvPython = Join-Path (Split-Path $root -Parent) '.venv\Scripts\python.exe'
$python = if (Test-Path $venvPython) { $venvPython } else { 'python' }
$build = Join-Path $root 'tools\build.py'

& $python $build
if ($LASTEXITCODE -ne 0) {
    Write-Warning 'The content has errors (listed above). Building without the invalid items.'
    & $python $build --lenient | Out-Null
    if (-not (Test-Path (Join-Path $root 'js\data.js'))) {
        throw 'js\data.js could not be built.'
    }
}

# The progress is stored per address: always use the same one (127.0.0.1 and the same port).
$url = "http://127.0.0.1:$Port/"
# http.server logs every request to stderr; without a console of its own that write fails and the
# request is dropped, so the log goes to files.
$log = Join-Path ([IO.Path]::GetTempPath()) "isi-prep-server-$Port"
$server = Start-Process -FilePath $python -NoNewWindow -PassThru `
    -RedirectStandardOutput "$log.out.log" -RedirectStandardError "$log.err.log" `
    -ArgumentList @('-m', 'http.server', "$Port", '--bind', '127.0.0.1', '--directory', "`"$root`"")
try {
    $ready = $false
    for ($i = 0; $i -lt 50 -and -not $ready -and -not $server.HasExited; $i++) {
        Start-Sleep -Milliseconds 100
        $client = New-Object System.Net.Sockets.TcpClient
        try {
            $client.Connect('127.0.0.1', $Port)
            $ready = $true
        } catch {
            $ready = $false
        } finally {
            $client.Dispose()
        }
    }
    if (-not $ready) {
        throw "The server did not start on port $Port (is the port in use? try -Port 8080)."
    }
    Write-Host "ISI priprava runs at $url  (Ctrl+C stops the server)"
    if (-not $NoBrowser) {
        Start-Process $url
    }
    Wait-Process -Id $server.Id
} finally {
    # python.exe of a venv is a launcher: stop the interpreter it started as well.
    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$($server.Id)" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
        Stop-Process -Id $child.ProcessId -ErrorAction SilentlyContinue
    }
    if (-not $server.HasExited) {
        Stop-Process -Id $server.Id -ErrorAction SilentlyContinue
    }
}
