param([string]$Deck, [string]$OutPdf)
$ErrorActionPreference = "Stop"
$pp = New-Object -ComObject PowerPoint.Application
$pres = $pp.Presentations.Open($Deck, $true, $false, $false)
$pres.SaveAs($OutPdf, 32)
$pres.Close()
$pp.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($pp) | Out-Null
Get-Item $OutPdf | Select-Object Name, Length
