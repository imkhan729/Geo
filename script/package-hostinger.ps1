# Packages dist/public into the Hostinger upload artifact.
#
#   powershell -File script/package-hostinger.ps1
#
# Produces:
#   freegeotagger-hostinger-static/      mirror of dist/public
#   freegeotagger-hostinger-static.zip   upload this to public_html
#
# Zip entries MUST use forward slashes. Windows' built-in Compress-Archive writes
# backslash separators, which Hostinger's Linux servers do not unpack correctly, so
# this uses System.IO.Compression directly and normalises each entry name.
# Dotfiles (.htaccess in particular) are included via -Force.

param(
  [string]$SourceDir = "dist/public",
  [string]$OutDir    = "freegeotagger-hostinger-static"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$sep = [System.IO.Path]::DirectorySeparatorChar
$src = Join-Path $PWD $SourceDir
$dst = Join-Path $PWD $OutDir
$zipPath = "$dst.zip"

if (-not (Test-Path $src)) { throw "$SourceDir not found - run 'npm run build' first." }

# ── Mirror the build output ──
if (Test-Path $dst) { Remove-Item -LiteralPath $dst -Recurse -Force }
Copy-Item -LiteralPath $src -Destination $dst -Recurse -Force

# ── Rebuild the zip ──
if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
  $count = 0
  foreach ($f in Get-ChildItem -LiteralPath $dst -Recurse -File -Force) {
    $rel = $f.FullName.Substring($dst.Length + 1).Replace($sep, '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $rel, 'Optimal')
    $count++
  }
} finally {
  $zip.Dispose()
}

Write-Output "packaged $count files -> $OutDir.zip ($([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB)"

# ── Verify the artifact ──
$check = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  $names = @($check.Entries | ForEach-Object { $_.FullName })
  $bad = @($names | Where-Object { $_.Contains($sep) })
  if ($bad.Count -gt 0) { throw "$($bad.Count) zip entries use backslash separators - Hostinger will not unpack these correctly" }

  $required = @('.htaccess', 'index.html', 'robots.txt', 'sitemap.xml', 'llms.txt', 'og-image.png', 'ads.txt', '404.html', 'favicon.png')
  $missing = @($required | Where-Object { $names -notcontains $_ })
  if ($missing.Count -gt 0) { throw "missing from zip: $($missing -join ', ')" }

  $routes = @($names | Where-Object { $_ -like 'seo-routes/*.html' }).Count
  $imgs   = @($names | Where-Object { $_ -like 'screenshots/*' -or $_ -like 'diagrams/*' }).Count
  Write-Output "verified: forward-slash paths, all $($required.Count) required root files, $routes prerendered routes, $imgs images"
} finally {
  $check.Dispose()
}
