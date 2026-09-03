param([string]$Deck, [string]$OutDir)
$ErrorActionPreference = "Stop"
if (Test-Path $OutDir) { Remove-Item "$OutDir\*" -Force -ErrorAction SilentlyContinue }
else { New-Item -ItemType Directory -Force $OutDir | Out-Null }
$pp = New-Object -ComObject PowerPoint.Application
$pres = $pp.Presentations.Open($Deck, $true, $false, $false)   # readonly, untitled, no window
$i = 1
foreach ($s in $pres.Slides) {
    $p = Join-Path $OutDir ("slide-{0}.png" -f $i)
    $s.Export($p, "PNG", 1920, 1080)
    $i++
}
$pres.Close()
$pp.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($pp) | Out-Null
Get-ChildItem $OutDir | Select-Object Name, Length
