[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$previewDir = $PSScriptRoot
if (-not $previewDir) { $previewDir = (Get-Location).Path }

# Ignore technical folders like .git and images (assets of the website itself)
$ignoreDirs = @(".git", "images", "build")

# Get category directories
$subDirs = Get-ChildItem -Path $previewDir -Directory | Where-Object { $ignoreDirs -notcontains $_.Name }
$categories = @($subDirs | ForEach-Object { $_.Name })

$supportedExtensions = @(".gif", ".png", ".webp", ".jpg", ".jpeg")
$allFiles = Get-ChildItem -Path $previewDir -Recurse -File | Where-Object {
    $ext = $_.Extension.ToLower()
    $isIgnored = $false
    foreach ($ign in $ignoreDirs) {
        if ($_.FullName -like "*\$ign\*") { $isIgnored = $true; break }
    }
    $supportedExtensions -contains $ext -and -not $isIgnored
}

$items = @()
foreach ($file in $allFiles) {
    $relPath = $file.FullName.Substring($previewDir.Length).TrimStart("\", "/")
    $relPath = $relPath -replace "\\", "/"
    
    $parentDir = Split-Path $relPath -Parent
    $category = if ($parentDir) { $parentDir } else { "Khác" }
    
    $items += [PSCustomObject]@{
        name     = $file.Name
        category = $category
        path     = $relPath
        size     = $file.Length
    }
}

$timestamp = (Get-Date).ToString("yyyyMMddHHmmss")
$dataObj = [PSCustomObject]@{
    categories = $categories
    items      = $items
    updatedAt  = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$json = $dataObj | ConvertTo-Json -Depth 5
$content = "window.GIF_DATA = " + $json + ";"
[System.IO.File]::WriteAllText((Join-Path $previewDir "data.js"), $content, [System.Text.Encoding]::UTF8)

# Update cache-busting timestamp in index.html
$indexPath = Join-Path $previewDir "index.html"
if (Test-Path $indexPath) {
    $html = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)
    $html = [System.Text.RegularExpressions.Regex]::Replace($html, 'src="data\.js(\?v=[^"]*)?"', "src=`"data.js?v=$timestamp`"")
    $html = [System.Text.RegularExpressions.Regex]::Replace($html, 'src="app\.js(\?v=[^"]*)?"', "src=`"app.js?v=$timestamp`"")
    [System.IO.File]::WriteAllText($indexPath, $html, [System.Text.Encoding]::UTF8)
}

Write-Host "Scanned $($items.Count) files across $($categories.Count) categories into data.js (v=$timestamp)"