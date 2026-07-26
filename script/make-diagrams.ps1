# Generates explanatory diagrams for the guides using System.Drawing (no npm deps).
# These are DIAGRAMS, not screenshots — they illustrate concepts that cannot be
# captured from the UI (internal file structure, and the local-processing flow).
#
# Usage: powershell -File script/make-diagrams.ps1 [outDir]

param([string]$OutDir = "client/public/diagrams")

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$INK    = [System.Drawing.ColorTranslator]::FromHtml('#17201B')
$MUTED  = [System.Drawing.ColorTranslator]::FromHtml('#5A6B60')
$GREEN  = [System.Drawing.ColorTranslator]::FromHtml('#2D6A4F')
$MINT   = [System.Drawing.ColorTranslator]::FromHtml('#D8F3E3')
$AMBER  = [System.Drawing.ColorTranslator]::FromHtml('#B45309')
$SAND   = [System.Drawing.ColorTranslator]::FromHtml('#FDF6EC')
$BG     = [System.Drawing.ColorTranslator]::FromHtml('#F7FAF8')
$LINE   = [System.Drawing.ColorTranslator]::FromHtml('#C9D8CE')

function New-Canvas([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'ClearTypeGridFit'
  $g.Clear($BG)
  return @($bmp, $g)
}

function Get-RoundRect([int]$x, [int]$y, [int]$w, [int]$h, [int]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc($x, $y, ($r * 2), ($r * 2), 180, 90)
  $p.AddArc(($x + $w - $r * 2), $y, ($r * 2), ($r * 2), 270, 90)
  $p.AddArc(($x + $w - $r * 2), ($y + $h - $r * 2), ($r * 2), ($r * 2), 0, 90)
  $p.AddArc($x, ($y + $h - $r * 2), ($r * 2), ($r * 2), 90, 90)
  $p.CloseFigure()
  return $p
}

function Add-Box($g, [int]$x, [int]$y, [int]$w, [int]$h, $fill, $border, [int]$r = 12) {
  $path = Get-RoundRect $x $y $w $h $r
  $g.FillPath((New-Object System.Drawing.SolidBrush $fill), $path)
  $g.DrawPath((New-Object System.Drawing.Pen $border, 1.8), $path)
}

function Add-Text($g, [string]$text, $font, $color, [int]$x, [int]$y) {
  $g.DrawString($text, $font, (New-Object System.Drawing.SolidBrush $color), [float]$x, [float]$y)
}

function Add-CenteredText($g, [string]$text, $font, $color, [int]$cx, [int]$y) {
  $sz = $g.MeasureString($text, $font)
  Add-Text $g $text $font $color ([int]($cx - $sz.Width / 2)) $y
}

function Add-Arrow($g, [int]$x1, [int]$y1, [int]$x2, [int]$y2, $color) {
  $pen = New-Object System.Drawing.Pen $color, 2.4
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
  $g.DrawLine($pen, $x1, $y1, $x2, $y2)
}

$fTitle = New-Object System.Drawing.Font('Segoe UI', 27, [System.Drawing.FontStyle]::Bold, 'Pixel')
$fSub   = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Regular, 'Pixel')
$fBox   = New-Object System.Drawing.Font('Segoe UI', 17, [System.Drawing.FontStyle]::Bold, 'Pixel')
$fSmall = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Regular, 'Pixel')
$fMono  = New-Object System.Drawing.Font('Consolas', 15, [System.Drawing.FontStyle]::Regular, 'Pixel')
$fMonoB = New-Object System.Drawing.Font('Consolas', 15, [System.Drawing.FontStyle]::Bold, 'Pixel')
$fTag   = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold, 'Pixel')

# ═══════════════════════════════════════════════════════════════════
# 1. Where GPS data lives inside a JPEG
# ═══════════════════════════════════════════════════════════════════
$W = 1200; $H = 760
$c = New-Canvas $W $H; $bmp = $c[0]; $g = $c[1]

Add-CenteredText $g 'Where GPS Data Lives Inside a JPEG File' $fTitle $INK 600 34
Add-CenteredText $g 'Location metadata sits in the APP1 segment - entirely separate from the compressed pixel data' $fSub $MUTED 600 78

# File segment strip
$stripY = 132; $stripH = 92
$segs = @(
  @{ label = 'SOI';        note = 'start marker'; w = 118; fill = $SAND },
  @{ label = 'APP1 / Exif'; note = 'metadata';     w = 384; fill = $MINT },
  @{ label = 'DQT / DHT / SOF'; note = 'tables';   w = 258; fill = $SAND },
  @{ label = 'Compressed image data'; note = 'your pixels'; w = 300; fill = $SAND }
)
$x = 58
foreach ($s in $segs) {
  $border = if ($s.fill -eq $MINT) { $GREEN } else { $LINE }
  Add-Box $g $x $stripY $s.w $stripH $s.fill $border 10
  Add-CenteredText $g $s.label $fBox $INK ($x + $s.w / 2) ($stripY + 22)
  Add-CenteredText $g $s.note  $fSmall $MUTED ($x + $s.w / 2) ($stripY + 50)
  $s.cx = $x + $s.w / 2
  $x += $s.w + 10
}

Add-Text $g 'FILE START' $fTag $MUTED 58 ($stripY + $stripH + 12)
Add-Text $g 'FILE END'   $fTag $MUTED 1058 ($stripY + $stripH + 12)

# Zoom line from APP1 down into the detail panel
$app1cx = [int]$segs[1].cx
Add-Arrow $g $app1cx ($stripY + $stripH + 6) $app1cx 296 $GREEN

# Detail panel: the nested IFD structure
Add-Box $g 58 300 1084 300 ([System.Drawing.Color]::White) $LINE 14
Add-Text $g 'Inside the APP1 (Exif) segment' $fBox $GREEN 84 320

$rows = @(
  @{ ind = 0; k = 'TIFF header';   v = 'byte order + offset to first directory' },
  @{ ind = 1; k = 'IFD0';          v = 'camera make, model, orientation, date' },
  @{ ind = 2; k = 'GPS sub-IFD';   v = 'referenced from IFD0 by tag 0x8825 - the location block' }
)
$y = 356
foreach ($r in $rows) {
  $ix = 96 + ($r.ind * 34)
  $isGps = $r.k -eq 'GPS sub-IFD'
  Add-Text $g ('|- ' + $r.k) $(if ($isGps) { $fMonoB } else { $fMono }) $(if ($isGps) { $GREEN } else { $INK }) $ix $y
  Add-Text $g $r.v $fSmall $MUTED ($ix + 190) ($y + 2)
  $y += 34
}

# GPS fields grid
Add-Box $g 160 462 962 120 $MINT $GREEN 12
$fields = @(
  'GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude',
  'GPSLongitudeRef', 'GPSAltitude', 'GPSTimeStamp',
  'GPSDateStamp', 'GPSImgDirection', 'GPSSpeed'
)
$i = 0
foreach ($f in $fields) {
  $col = $i % 3; $row = [math]::Floor($i / 3)
  Add-Text $g $f $fMono $INK (186 + $col * 318) (478 + $row * 32)
  $i++
}
Add-Text $g 'Only four of these are required to place a photo on a map: GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef' $fSmall $MUTED 160 596

# Key takeaway strip
Add-Box $g 58 630 1084 96 $SAND $AMBER 12
Add-Text $g 'Why geotagging causes zero quality loss' $fBox $AMBER 84 646
Add-Text $g 'Writing GPS coordinates only rewrites bytes in the APP1 segment. The compressed image data is copied through' $fSmall $INK 84 678
Add-Text $g 'untouched - there is no decode and re-encode step, so no generation loss.' $fSmall $INK 84 700

$bmp.Save((Join-Path $OutDir 'exif-gps-structure.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "  exif-gps-structure.png  ${W}x${H}"

# ═══════════════════════════════════════════════════════════════════
# 2. Browser-local geotagging flow (nothing is uploaded)
# ═══════════════════════════════════════════════════════════════════
$W = 1200; $H = 560
$c = New-Canvas $W $H; $bmp = $c[0]; $g = $c[1]

Add-CenteredText $g 'How Browser-Based Geotagging Works' $fTitle $INK 600 32
Add-CenteredText $g 'Every step happens on your device - no photo is ever sent to a server' $fSub $MUTED 600 76

# Device boundary
Add-Box $g 46 124 892 300 ([System.Drawing.Color]::White) $GREEN 16
Add-Text $g 'YOUR DEVICE' $fTag $GREEN 70 140

$steps = @(
  @{ t = 'Photo';        s1 = 'no GPS data'; s2 = 'JPG / PNG'; s3 = 'WebP / HEIC' },
  @{ t = 'Read bytes';   s1 = 'locate the';  s2 = 'EXIF APP1'; s3 = 'segment' },
  @{ t = 'Write GPS';    s1 = 'insert lat';  s2 = '+ long into'; s3 = 'GPS sub-IFD' },
  @{ t = 'Geotagged';    s1 = 'same pixels'; s2 = 'new location'; s3 = 'metadata' }
)
$bx = 78; $bw = 186; $by = 186; $bh = 158
$i = 0
foreach ($st in $steps) {
  $isEnd = ($i -eq 3)
  $fill = if ($isEnd) { $MINT } else { $SAND }
  $bord = if ($isEnd) { $GREEN } else { $LINE }
  Add-Box $g $bx $by $bw $bh $fill $bord 12
  Add-CenteredText $g $st.t $fBox $INK ($bx + $bw / 2) ($by + 20)
  Add-CenteredText $g $st.s1 $fSmall $MUTED ($bx + $bw / 2) ($by + 60)
  Add-CenteredText $g $st.s2 $fSmall $MUTED ($bx + $bw / 2) ($by + 84)
  Add-CenteredText $g $st.s3 $fSmall $MUTED ($bx + $bw / 2) ($by + 108)
  if ($i -lt 3) { Add-Arrow $g ($bx + $bw + 6) ($by + $bh / 2) ($bx + $bw + 26) ($by + $bh / 2) $GREEN }
  $bx += $bw + 32
  $i++
}

Add-Text $g 'Steps 2 and 3 run as JavaScript inside the page. Disconnect from the internet after loading and it still works.' $fSmall $MUTED 78 372

# Blocked server path
Add-Box $g 962 186 194 158 $SAND ([System.Drawing.ColorTranslator]::FromHtml('#D97070')) 12
Add-CenteredText $g 'Server' $fBox ([System.Drawing.ColorTranslator]::FromHtml('#B33A3A')) 1059 206
Add-CenteredText $g 'never' $fSmall $MUTED 1059 248
Add-CenteredText $g 'receives' $fSmall $MUTED 1059 272
Add-CenteredText $g 'your photo' $fSmall $MUTED 1059 296

$penX = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#D97070')), 3
$g.DrawLine($penX, 944, 250, 956, 280)
$g.DrawLine($penX, 956, 250, 944, 280)

# Compatibility footer
Add-Box $g 46 452 1110 76 $MINT $GREEN 12
Add-Text $g 'The result is standard EXIF GPS metadata, read by:' $fBox $GREEN 72 466
Add-Text $g 'Google Photos  -  Apple Photos  -  Adobe Lightroom  -  Windows File Explorer  -  macOS Preview  -  QGIS / ArcGIS' $fSmall $INK 72 496

$bmp.Save((Join-Path $OutDir 'geotag-workflow.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "  geotag-workflow.png  ${W}x${H}"

Write-Output "diagrams written to $OutDir"
