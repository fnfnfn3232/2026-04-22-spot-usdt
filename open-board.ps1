$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$portFile = Join-Path $root "board-url.txt"
$serverScript = Join-Path $root "server.ps1"

if (Test-Path $portFile) {
  Remove-Item -LiteralPath $portFile -Force -ErrorAction SilentlyContinue
}

Start-Process cmd.exe -ArgumentList "/k", "powershell -ExecutionPolicy Bypass -File `"$serverScript`""

for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $portFile) {
    $url = (Get-Content -LiteralPath $portFile -ErrorAction Stop | Select-Object -First 1).Trim()
    if ($url) {
      Start-Process $url
      exit 0
    }
  }
}

Write-Host "Could not get local board URL." -ForegroundColor Red
pause
