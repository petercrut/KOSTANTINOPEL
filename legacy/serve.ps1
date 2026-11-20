# Kostantinopel — server statis lokal (PowerShell HttpListener)
# Jalankan: powershell -ExecutionPolicy Bypass -File serve.ps1
# Buka:     http://localhost:8765/

$port = 8765
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.yaml' = 'application/yaml; charset=utf-8'
  '.yml'  = 'application/yaml; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
  '.csv'  = 'text/csv; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

try {
  $listener.Start()
  Write-Host "Kostantinopel berjalan di http://localhost:$port/ (Ctrl+C untuk berhenti)"
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.LocalPath)
      if ($rel -eq '/' -or $rel -eq '') { $rel = '/index.html' }
      $file = Join-Path $root ($rel.TrimStart('/').Replace('/', '\'))
      if (Test-Path $file -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $ctx.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $ctx.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes('404 - Tidak ditemukan')
        $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
      }
    } catch { }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop()
}
