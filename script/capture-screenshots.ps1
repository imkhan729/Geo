# Captures genuine screenshots of the running app with headless Chrome, then crops
# and re-encodes them to JPEG with System.Drawing (no extra npm dependencies).
#
# Usage:  powershell -File script/capture-screenshots.ps1 [baseUrl] [outDir]
# Requires a server (dev or built) on $baseUrl.
#
# Notes:
#  - The cookie consent banner is position:fixed and always lands at the bottom of
#    the captured viewport, so viewport shots are cropped to exclude it.
#  - Mid-page sections come from one tall full-page capture, then cropped by Y.
#  - The interactive map only renders after a photo is loaded, which headless
#    Chrome cannot do (no file-picker interaction). Those steps are illustrated by
#    script/make-diagrams.ps1 instead, and labelled as diagrams rather than
#    presented as screenshots.

param(
  [string]$BaseUrl = "http://localhost:5000",
  [string]$OutDir  = "client/public/screenshots"
)

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "Chrome not found - cannot capture screenshots." }

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$tmp = Join-Path $env:TEMP "fgt-shots"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

function Invoke-Capture {
  param([string]$Url, [int]$W, [int]$H, [int]$Scale, [string]$OutPath)
  if (Test-Path $OutPath) { Remove-Item $OutPath -Force }
  $chromeArgs = @(
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    "--force-device-scale-factor=$Scale",
    "--virtual-time-budget=10000",
    "--window-size=$W,$H",
    "--screenshot=$OutPath",
    $Url
  )
  & $chrome @chromeArgs 2>$null | Out-Null
  return (Test-Path $OutPath)
}

# Crop a source image (in source pixels, scaled by $Scale) and save as JPEG at $TargetW wide.
function Save-Crop {
  param(
    [string]$SrcPath, [string]$Name, [int]$Scale,
    [int]$X, [int]$Y, [int]$W, [int]$H, [int]$TargetW, [int]$Quality = 86
  )
  $src = [System.Drawing.Image]::FromFile($SrcPath)

  $sx = $X * $Scale; $sy = $Y * $Scale; $sw = $W * $Scale; $sh = $H * $Scale
  if ($sx + $sw -gt $src.Width)  { $sw = $src.Width  - $sx }
  if ($sy + $sh -gt $src.Height) { $sh = $src.Height - $sy }
  if ($sw -le 0 -or $sh -le 0) { $src.Dispose(); Write-Warning "empty crop for $Name"; return }

  $targetH = [int][math]::Round($sh * ($TargetW / $sw))
  $bmp = New-Object System.Drawing.Bitmap($TargetW, $targetH)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.SmoothingMode = 'HighQuality'
  $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($src,
    (New-Object System.Drawing.Rectangle(0, 0, $TargetW, $targetH)),
    (New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)),
    [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $src.Dispose()

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)
  $out = Join-Path $OutDir "$Name.jpg"
  $bmp.Save($out, $codec, $ep)
  $bmp.Dispose()
  $kb = [math]::Round((Get-Item $out).Length / 1KB, 1)
  Write-Output ("  {0,-30} {1}x{2}  {3} KB" -f "$Name.jpg", $TargetW, $targetH, $kb)
}

# ── 1. Homepage tool, desktop (crop off the fixed consent banner) ──
$p = Join-Path $tmp "home.png"
if (Invoke-Capture "$BaseUrl/" 1280 940 2 $p) {
  Save-Crop $p "geotag-tool-upload" 2 0 0 1280 782 1200
}

# ── 2. Homepage tool, mobile ──
$p = Join-Path $tmp "home-mobile.png"
if (Invoke-Capture "$BaseUrl/" 430 900 2 $p) {
  Save-Crop $p "geotag-tool-mobile" 2 0 0 430 760 430
}

# ── 3. GPS Finder ──
$p = Join-Path $tmp "gpsfinder.png"
if (Invoke-Capture "$BaseUrl/gps-finder" 1280 940 2 $p) {
  Save-Crop $p "gps-finder-tool" 2 0 0 1280 782 1200
}

# ── 4/5/6. Mid-page sections from one tall full-page capture ──
# Offsets are section bounding boxes measured from the live DOM at a 1280px
# viewport (total page height ~6443). Re-measure if the homepage layout changes:
#   document.querySelectorAll('h2') -> climb to SECTION -> getBoundingClientRect
$p = Join-Path $tmp "home-full.png"
if (Invoke-Capture "$BaseUrl/" 1280 6500 1 $p) {
  Save-Crop $p "geotag-three-steps"   1 0 3600 1280 609 1200
  Save-Crop $p "geotag-comparison"    1 0 4209 1280 665 1200
  Save-Crop $p "geotag-faq"           1 0 4874 1280 859 1200
}

# ── 6. Blog index ──
$p = Join-Path $tmp "blog.png"
if (Invoke-Capture "$BaseUrl/blog" 1280 940 2 $p) {
  Save-Crop $p "blog-index" 2 0 0 1280 782 1200
}

Write-Output "screenshots written to $OutDir"
