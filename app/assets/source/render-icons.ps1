# Renders all Hanger icon variants from the design in icon.svg.
#
# Usage: from anywhere,
#   powershell -File "path\to\render-icons.ps1"
#
# Outputs:
#   ..\icon.png                    1024 x 1024, grey bg + runner
#   ..\adaptive-icon.png           1024 x 1024, transparent, H in 66% safe zone
#   ..\splash-icon.png             1280 x 1280, transparent, runner + wordmark
#   ..\favicon.png                   48 x 48, simplified red H
#   ..\store\feature-graphic.png   1024 x 500, chip + Bebas Neue HANGER
#
# Requires Bebas Neue for the wordmark. If it isn't installed, the
# script downloads it from Google Fonts into %TEMP% and loads it via
# PrivateFontCollection (no admin needed).

Add-Type -AssemblyName System.Drawing

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetsDir  = Resolve-Path (Join-Path $scriptDir '..')
$outDir     = $assetsDir.Path
$storeDir   = Join-Path $outDir 'store'
New-Item -ItemType Directory -Force -Path $storeDir | Out-Null

# --- Load Bebas Neue ---
$ttfDir = Join-Path $env:TEMP 'hanger-fonts'
New-Item -ItemType Directory -Force -Path $ttfDir | Out-Null
$ttf = Join-Path $ttfDir 'BebasNeue-Regular.ttf'
if (-not (Test-Path $ttf)) {
  Invoke-WebRequest -Uri 'https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf' -OutFile $ttf -UseBasicParsing
}
$fontCol = New-Object System.Drawing.Text.PrivateFontCollection
$fontCol.AddFontFile($ttf)
$bebas = $fontCol.Families[0]

# --- Palette (matches icon.svg + app palette) ---
$C = @{
  Bg      = [System.Drawing.Color]::FromArgb(0xDD, 0xE3, 0xE8)
  Dark    = [System.Drawing.Color]::FromArgb(0x2F, 0x3A, 0x45)
  Red     = [System.Drawing.Color]::FromArgb(0xC6, 0x28, 0x28)
  RedHigh = [System.Drawing.Color]::FromArgb(0xE3, 0x5D, 0x5D)
  RedShad = [System.Drawing.Color]::FromArgb(0x8E, 0x1B, 0x1B)
  RedDeep = [System.Drawing.Color]::FromArgb(0x7A, 0x15, 0x15)
  AppDark = [System.Drawing.Color]::FromArgb(0x0F, 0x0E, 0x0D)
  White   = [System.Drawing.Color]::FromArgb(240, 240, 240)
}

# --- Draw the runner design onto a Graphics context ---
function Draw-Runner {
  param($g, [double]$ox, [double]$oy, [double]$s, [switch]$Transparent)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $M = { param($x) $ox + $x * $s }
  $N = { param($y) $oy + $y * $s }

  if (-not $Transparent) {
    $bgBrush = New-Object System.Drawing.SolidBrush($C.Bg)
    $g.FillRectangle($bgBrush, [float](&$M 0), [float](&$N 0), [float](200*$s), [float](200*$s))
    $bgBrush.Dispose()
  }

  $darkBrush = New-Object System.Drawing.SolidBrush($C.Dark)
  $darkPen   = New-Object System.Drawing.Pen($C.Dark, [float](6 * $s))
  $penStrong = New-Object System.Drawing.Pen($C.Dark, [float](5 * $s))
  $penThin   = New-Object System.Drawing.Pen($C.Dark, [float](2 * $s))

  $rect = New-Object System.Drawing.Drawing2D.GraphicsPath
  $r = [float](10 * $s)
  $x = [float](&$M 30); $y = [float](&$N 30); $w = [float](140 * $s); $h = [float](140 * $s)
  $rect.AddArc($x, $y, $r*2, $r*2, 180, 90)
  $rect.AddArc($x + $w - $r*2, $y, $r*2, $r*2, 270, 90)
  $rect.AddArc($x + $w - $r*2, $y + $h - $r*2, $r*2, $r*2, 0, 90)
  $rect.AddArc($x, $y + $h - $r*2, $r*2, $r*2, 90, 90)
  $rect.CloseFigure()
  $g.DrawPath($darkPen, $rect)
  $rect.Dispose()

  $gateR = [float](5 * $s); $holeR = [float](2.2 * $s)
  foreach ($p in @(@(100,30), @(100,170))) {
    $cx = [float](&$M $p[0]); $cy = [float](&$N $p[1])
    $g.FillEllipse($darkBrush, $cx - $gateR, $cy - $gateR, $gateR*2, $gateR*2)
    if (-not $Transparent) {
      $holeBrush = New-Object System.Drawing.SolidBrush($C.Bg)
      $g.FillEllipse($holeBrush, $cx - $holeR, $cy - $holeR, $holeR*2, $holeR*2)
      $holeBrush.Dispose()
    }
  }

  $attachments = @(
    @(73,33,73,48,5), @(73,48,73,56,2),
    @(127,33,127,48,5), @(127,48,127,56,2),
    @(73,152,73,167,5), @(73,144,73,152,2),
    @(127,152,127,167,5), @(127,144,127,152,2),
    @(33,100,53,100,5), @(53,100,62,100,2),
    @(147,100,167,100,5), @(138,100,147,100,2)
  )
  foreach ($a in $attachments) {
    $pen = if ($a[4] -eq 5) { $penStrong } else { $penThin }
    $g.DrawLine($pen, [float](&$M $a[0]), [float](&$N $a[1]), [float](&$M $a[2]), [float](&$N $a[3]))
  }

  $redBrush = New-Object System.Drawing.SolidBrush($C.Red)
  $g.FillRectangle($redBrush, [float](&$M 62), [float](&$N 56), [float](22*$s), [float](88*$s))
  $g.FillRectangle($redBrush, [float](&$M 116), [float](&$N 56), [float](22*$s), [float](88*$s))
  $g.FillRectangle($redBrush, [float](&$M 84), [float](&$N 92), [float](32*$s), [float](16*$s))

  $hiBrush = New-Object System.Drawing.SolidBrush($C.RedHigh)
  $g.FillRectangle($hiBrush, [float](&$M 63), [float](&$N 58), [float](3*$s), [float](84*$s))
  $g.FillRectangle($hiBrush, [float](&$M 117), [float](&$N 58), [float](3*$s), [float](84*$s))
  $hiBrush.Dispose()

  $shBrush = New-Object System.Drawing.SolidBrush($C.RedShad)
  $g.FillRectangle($shBrush, [float](&$M 80), [float](&$N 58), [float](3*$s), [float](34*$s))
  $g.FillRectangle($shBrush, [float](&$M 80), [float](&$N 108), [float](3*$s), [float](34*$s))
  $g.FillRectangle($shBrush, [float](&$M 134), [float](&$N 58), [float](3*$s), [float](84*$s))
  $g.FillRectangle($shBrush, [float](&$M 84), [float](&$N 105), [float](32*$s), [float](3*$s))
  $shBrush.Dispose()

  $deepBrush = New-Object System.Drawing.SolidBrush($C.RedDeep)
  $dotR = [float](3 * $s)
  $dcx = [float](&$M 100); $dcy = [float](&$N 99)
  $g.FillEllipse($deepBrush, $dcx - $dotR, $dcy - $dotR, $dotR*2, $dotR*2)
  $deepBrush.Dispose()

  $redBrush.Dispose(); $darkBrush.Dispose()
  $darkPen.Dispose(); $penStrong.Dispose(); $penThin.Dispose()
}

# --- 1. icon.png (1024x1024, grey bg, runner at ~88%) ---
$size = 1024
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($C.Bg)
$s = 4.5
$ox = ($size - 200 * $s) / 2
$oy = ($size - 200 * $s) / 2
Draw-Runner -g $g -ox $ox -oy $oy -s $s
$g.Dispose()
$bmp.Save((Join-Path $outDir 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# --- 2. adaptive-icon.png (1024x1024, transparent, 66% safe zone) ---
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$s = 3.375
$ox = ($size - 200 * $s) / 2
$oy = ($size - 200 * $s) / 2
Draw-Runner -g $g -ox $ox -oy $oy -s $s -Transparent
$g.Dispose()
$bmp.Save((Join-Path $outDir 'adaptive-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# --- 3. splash-icon.png (1280x1280, transparent, runner + Bebas HANGER) ---
$sz = 1280
$bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$s = 3.5
$ox = ($sz - 200 * $s) / 2
$oy = ($sz - 200 * $s) / 2 - 60
Draw-Runner -g $g -ox $ox -oy $oy -s $s -Transparent
$wordFont = New-Object System.Drawing.Font($bebas, 96, [System.Drawing.FontStyle]::Regular)
$wordBrush = New-Object System.Drawing.SolidBrush($C.Red)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('HANGER', $wordFont, $wordBrush, [float]($sz/2), [float]($oy + 200*$s + 40), $sf)
$wordFont.Dispose(); $wordBrush.Dispose(); $sf.Dispose()
$g.Dispose()
$bmp.Save((Join-Path $outDir 'splash-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# --- 4. favicon.png (48x48, red H only) ---
$sz = 48
$bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($C.Bg)
$s = 0.24
$redBrush = New-Object System.Drawing.SolidBrush($C.Red)
$g.FillRectangle($redBrush, [float](62*$s), [float](56*$s), [float](22*$s), [float](88*$s))
$g.FillRectangle($redBrush, [float](116*$s), [float](56*$s), [float](22*$s), [float](88*$s))
$g.FillRectangle($redBrush, [float](84*$s), [float](92*$s), [float](32*$s), [float](16*$s))
$redBrush.Dispose(); $g.Dispose()
$bmp.Save((Join-Path $outDir 'favicon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# --- 5. store/feature-graphic.png (1024x500) ---
$w = 1024; $h = 500
$bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear($C.AppDark)

$chip = 340
$chipX = 40; $chipY = ($h - $chip) / 2
$chipRad = 60
$chipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$chipPath.AddArc($chipX, $chipY, $chipRad*2, $chipRad*2, 180, 90)
$chipPath.AddArc($chipX + $chip - $chipRad*2, $chipY, $chipRad*2, $chipRad*2, 270, 90)
$chipPath.AddArc($chipX + $chip - $chipRad*2, $chipY + $chip - $chipRad*2, $chipRad*2, $chipRad*2, 0, 90)
$chipPath.AddArc($chipX, $chipY + $chip - $chipRad*2, $chipRad*2, $chipRad*2, 90, 90)
$chipPath.CloseFigure()
$chipBrush = New-Object System.Drawing.SolidBrush($C.Bg)
$g.FillPath($chipBrush, $chipPath)
$chipBrush.Dispose(); $chipPath.Dispose()

$s = ($chip - 60) / 200
$ox = $chipX + ($chip - 200*$s) / 2
$oy = $chipY + ($chip - 200*$s) / 2
Draw-Runner -g $g -ox $ox -oy $oy -s $s -Transparent
$backingBrush = New-Object System.Drawing.SolidBrush($C.Bg)
foreach ($p in @(@(100,30), @(100,170))) {
  $cx = $ox + $p[0] * $s; $cy = $oy + $p[1] * $s
  $r = 2.2 * $s
  $g.FillEllipse($backingBrush, [float]($cx - $r), [float]($cy - $r), [float]($r*2), [float]($r*2))
}
$backingBrush.Dispose()

$wordFont = New-Object System.Drawing.Font($bebas, 160, [System.Drawing.FontStyle]::Regular)
$wordBrush = New-Object System.Drawing.SolidBrush($C.White)
$g.DrawString('HANGER', $wordFont, $wordBrush, [float]($chipX + $chip + 30), 145)
$wordFont.Dispose(); $wordBrush.Dispose()

$subFont = New-Object System.Drawing.Font($bebas, 34, [System.Drawing.FontStyle]::Regular)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 180, 180))
$g.DrawString('MECHA KIT REVIEWS FOR PILOTS', $subFont, $subBrush, [float]($chipX + $chip + 34), 328)
$subFont.Dispose(); $subBrush.Dispose()

$tagFont = New-Object System.Drawing.Font('Consolas', 12, [System.Drawing.FontStyle]::Regular)
$tagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 120, 120))
$g.DrawString('// STANDBY STUDIOS', $tagFont, $tagBrush, 800, 450)
$tagFont.Dispose(); $tagBrush.Dispose()
$g.Dispose()
$bmp.Save((Join-Path $storeDir 'feature-graphic.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Done. Rendered:"
Get-ChildItem "$outDir\*.png","$storeDir\*.png" | Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1024,1)}}
