Add-Type -AssemblyName System.Drawing

$W = 1200; $H = 630
$out = $args[0]
$iconPath = $args[1]

$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'ClearTypeGridFit'
$g.InterpolationMode = 'HighQualityBicubic'

# ── Background: deep green diagonal gradient ──
$rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$c1 = [System.Drawing.ColorTranslator]::FromHtml('#14352A')
$c2 = [System.Drawing.ColorTranslator]::FromHtml('#2D6A4F')
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 35.0)
$g.FillRectangle($bg, $rect)

# Soft radial glow, upper right
$glow = New-Object System.Drawing.Drawing2D.GraphicsPath
$glow.AddEllipse(760, -220, 700, 700)
$pgb = New-Object System.Drawing.Drawing2D.PathGradientBrush($glow)
$pgb.CenterColor = [System.Drawing.Color]::FromArgb(70, 82, 183, 136)
$pgb.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 82, 183, 136))
$g.FillPath($pgb, $glow)

# Amber accent bar, bottom edge
$amber = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle(0, ($H - 10), $W, 10)),
  [System.Drawing.ColorTranslator]::FromHtml('#52B788'),
  [System.Drawing.ColorTranslator]::FromHtml('#D97706'), 0.0)
$g.FillRectangle($amber, 0, ($H - 10), $W, 10)

# ── Icon: real favicon, rounded ──
if (Test-Path $iconPath) {
  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $g.DrawImage($icon, 82, 74, 96, 96)
  $icon.Dispose()
}

$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$mint  = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#95D5B2'))
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(215, 255, 255, 255))

# ── Brand name ──
$fBrand = New-Object System.Drawing.Font('Segoe UI', 34, [System.Drawing.FontStyle]::Bold, 'Pixel')
$g.DrawString('FreeGeoTagger', $fBrand, $white, 198, 96)

# ── Headline (two lines, large) ──
$fH1 = New-Object System.Drawing.Font('Segoe UI', 62, [System.Drawing.FontStyle]::Bold, 'Pixel')
$g.DrawString('Geotag Photos Free', $fH1, $white, 76, 218)
$g.DrawString('Add GPS to Any Photo', $fH1, $mint, 76, 306)

# ── Subhead ──
$fSub = New-Object System.Drawing.Font('Segoe UI', 25, [System.Drawing.FontStyle]::Regular, 'Pixel')
$g.DrawString('Runs entirely in your browser. Your photos never leave your device.', $fSub, $muted, 80, 412)

# ── Feature pills ──
$fPill = New-Object System.Drawing.Font('Segoe UI', 19, [System.Drawing.FontStyle]::Bold, 'Pixel')
$pills = @('No uploads', 'No account', 'JPG / PNG / WebP / HEIC', 'Batch geotagging')
$x = 80
foreach ($p in $pills) {
  $sz = $g.MeasureString($p, $fPill)
  $w = [int]$sz.Width + 34
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $r = 21; $y = 484; $h = 46
  $path.AddArc($x, $y, $r * 2, $r * 2, 180, 90)
  $path.AddArc(($x + $w - $r * 2), $y, $r * 2, $r * 2, 270, 90)
  $path.AddArc(($x + $w - $r * 2), ($y + $h - $r * 2), $r * 2, $r * 2, 0, 90)
  $path.AddArc($x, ($y + $h - $r * 2), $r * 2, $r * 2, 90, 90)
  $path.CloseFigure()
  $fill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(38, 255, 255, 255))
  $g.FillPath($fill, $path)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, 149, 213, 178)), 1.6
  $g.DrawPath($pen, $path)
  $g.DrawString($p, $fPill, $white, ($x + 17), ($y + 10))
  $x += $w + 14
}

# ── Domain, top right (explicit coords - keeps it clear of the logo) ──
$fDom = New-Object System.Drawing.Font('Segoe UI', 24, [System.Drawing.FontStyle]::Bold, 'Pixel')
$g.DrawString('freegeotagger.com', $fDom, $mint, [float]898, [float]112)

$g.Dispose()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "wrote $out"
