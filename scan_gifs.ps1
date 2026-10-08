[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$previewDir = $PSScriptRoot
if (-not $previewDir) { $previewDir = (Get-Location).Path }

# Get all category directories
$subDirs = Get-ChildItem -Path $previewDir -Directory | Where-Object { $_.Name -ne ".git" }
$categories = @($subDirs | ForEach-Object { $_.Name })

$supportedExtensions = @(".gif", ".png", ".webp", ".jpg", ".jpeg")
$allFiles = Get-ChildItem -Path $previewDir -Recurse -File | Where-Object {
    $ext = $_.Extension.ToLower()
    $supportedExtensions -contains $ext -and $_.FullName -notlike "*\.git\*"
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

$dataObj = [PSCustomObject]@{
    categories = $categories
    items      = $items
    updatedAt  = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$json = $dataObj | ConvertTo-Json -Depth 5
$content = "window.GIF_DATA = " + $json + ";"
[System.IO.File]::WriteAllText((Join-Path $previewDir "data.js"), $content, [System.Text.Encoding]::UTF8)

Write-Host "Scanned $($items.Count) files across $($categories.Count) categories into data.js"