$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$portFile = Join-Path $root "board-url.txt"
$logFile = Join-Path $root "server.log"
$listener = $null
$port = $null

function Write-Log {
  param([string] $Message)
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $logFile -Value "[$timestamp] $Message"
}

Set-Content -LiteralPath $logFile -Value ""

foreach ($candidatePort in 8791..8805) {
  try {
    $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $candidatePort)
    $candidate.Start()
    $listener = $candidate
    $port = $candidatePort
    break
  } catch {
    continue
  }
}

if ($null -eq $listener -or $null -eq $port) {
  Write-Log "No available port found"
  throw "사용 가능한 포트를 찾지 못했습니다 (8791-8805)"
}

[System.IO.File]::WriteAllText($portFile, "http://127.0.0.1:$port/", [System.Text.Encoding]::UTF8)
Write-Log "Server started on port $port"

Write-Host "Local server running at http://localhost:$port/"

function Get-ContentType {
  param([string] $Path)
  switch -Regex ($Path) {
    "\.html$" { "text/html; charset=utf-8"; break }
    "\.md$" { "text/markdown; charset=utf-8"; break }
    default { "text/plain; charset=utf-8" }
  }
}

function Write-HttpResponse {
  param(
    [Parameter(Mandatory = $true)] $Client,
    [Parameter(Mandatory = $true)] [int] $StatusCode,
    [Parameter(Mandatory = $true)] [string] $Body,
    [string] $ContentType = "text/plain; charset=utf-8"
  )

  $statusText = switch ($StatusCode) {
    200 { "OK" }
    404 { "Not Found" }
    502 { "Bad Gateway" }
    default { "OK" }
  }

  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
  $header = "HTTP/1.1 $StatusCode $statusText`r`nContent-Type: $ContentType`r`nContent-Length: $($bodyBytes.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

  $stream = $Client.GetStream()
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($bodyBytes, 0, $bodyBytes.Length)
  $stream.Flush()
  $stream.Close()
  $Client.Close()
}

function Read-RequestLine {
  param([Parameter(Mandatory = $true)] $Client)

  $stream = $Client.GetStream()
  $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
  $requestLine = $reader.ReadLine()
  while ($true) {
    $line = $reader.ReadLine()
    if ([string]::IsNullOrEmpty($line)) { break }
  }
  return $requestLine
}

function Get-ProxyTarget {
  param([string] $PathAndQuery)

  $parts = $PathAndQuery.Split("?", 2)
  $path = $parts[0]
  $query = if ($parts.Length -gt 1) { $parts[1] } else { "" }

  switch ($path) {
    "/proxy/binance/exchangeInfo" { return "https://api.binance.com/api/v3/exchangeInfo?$query" }
    "/proxy/binance/ticker24hr" { return "https://api.binance.com/api/v3/ticker/24hr?$query" }
    "/proxy/upbit/marketAll" { return "https://api.upbit.com/v1/market/all?$query" }
    "/proxy/upbit/ticker" { return "https://api.upbit.com/v1/ticker?$query" }
    "/proxy/bithumb/marketAll" { return "https://api.bithumb.com/v1/market/all?$query" }
    "/proxy/bithumb/tickerAll" { return "https://api.bithumb.com/public/ticker/ALL_KRW" }
    "/proxy/coingecko/coinsMarkets" { return "https://api.coingecko.com/api/v3/coins/markets?$query" }
    default { return $null }
  }
}

function Invoke-RemoteJson {
  param([string] $Url)

  $request = [System.Net.HttpWebRequest]::Create($Url)
  $request.Method = "GET"
  $request.UserAgent = "Mozilla/5.0 Codex Local Proxy"
  $request.Accept = "application/json"
  $response = $request.GetResponse()
  $stream = $response.GetResponseStream()
  $reader = [System.IO.StreamReader]::new($stream)
  $body = $reader.ReadToEnd()
  $reader.Close()
  $stream.Close()
  $response.Close()
  return $body
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    Write-Log "Accepted connection"
    try {
      $requestLine = Read-RequestLine -Client $client
      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        Write-HttpResponse -Client $client -StatusCode 404 -Body "Not Found"
        continue
      }

      $requestTarget = $requestLine.Split(" ")[1]
      if ($requestTarget -eq "/") { $requestTarget = "/index.html" }

      if ($requestTarget -eq "/index.html" -or $requestTarget -eq "/README.md") {
        $localPath = Join-Path $root ($requestTarget.TrimStart("/"))
        if (Test-Path $localPath) {
          $body = [System.IO.File]::ReadAllText($localPath, [System.Text.Encoding]::UTF8)
          Write-HttpResponse -Client $client -StatusCode 200 -Body $body -ContentType (Get-ContentType -Path $localPath)
        } else {
          Write-HttpResponse -Client $client -StatusCode 404 -Body "Not Found"
        }
        continue
      }

      $target = Get-ProxyTarget -PathAndQuery $requestTarget
      if ($null -ne $target) {
        try {
          $body = Invoke-RemoteJson -Url $target
          Write-HttpResponse -Client $client -StatusCode 200 -Body $body -ContentType "application/json; charset=utf-8"
        } catch {
          Write-Log "Proxy failure for $target :: $($_.Exception.Message)"
          $errorBody = @{ error = "proxy_failed"; detail = $_.Exception.Message } | ConvertTo-Json -Compress
          Write-HttpResponse -Client $client -StatusCode 502 -Body $errorBody -ContentType "application/json; charset=utf-8"
        }
        continue
      }

      Write-HttpResponse -Client $client -StatusCode 404 -Body "Not Found"
    } catch {
      Write-Log "Request handling failure :: $($_.Exception.Message)"
      if ($null -ne $client) {
        try {
          Write-HttpResponse -Client $client -StatusCode 502 -Body "Server Error"
        } catch {}
      }
    }
  }
} finally {
  Write-Log "Server stopping"
  if ($listener) {
    $listener.Stop()
  }
}
