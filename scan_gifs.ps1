[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$previewDir = $PSScriptRoot
if (-not $previewDir) { $previewDir = (Get-Location).Path }

$assetsDir = Join-Path $previewDir "assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir | Out-Null
}

# Preserve existing createdAt dates from data.js
$dataPath = Join-Path $previewDir "data.js"
$existingDates = @{}
if (Test-Path $dataPath) {
    try {
        $rawJs = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8)
        $firstBrace = $rawJs.IndexOf('{')
        $lastBrace = $rawJs.LastIndexOf('}')
        if ($firstBrace -ge 0 -and $lastBrace -gt $firstBrace) {
            $rawJson = $rawJs.Substring($firstBrace, $lastBrace - $firstBrace + 1)
            $oldData = $rawJson | ConvertFrom-Json
            if ($oldData.items) {
                foreach ($it in $oldData.items) {
                    if ($it.path -and $it.createdAt) {
                        $existingDates[$it.path] = $it.createdAt
                    }
                }
            }
        }
    } catch {
        Write-Host "Notice: Could not parse existing dates"
    }
}

$todayStr = (Get-Date).ToString("yyyy-MM-dd")

# Discover categories from subdirectories inside assets/
$categoryDirs = Get-ChildItem -Path $assetsDir -Directory
$categories = @($categoryDirs | ForEach-Object { $_.Name })

$supportedExtensions = @(".gif", ".png", ".webp", ".jpg", ".jpeg")
$items = @()

foreach ($catDir in $categoryDirs) {
    $catName = $catDir.Name
    $files = Get-ChildItem -Path $catDir.FullName -Recurse -File | Where-Object {
        $supportedExtensions -contains $_.Extension.ToLower()
    }
    foreach ($file in $files) {
        $relPath = $file.FullName.Substring($previewDir.Length).TrimStart("\", "/") -replace "\\", "/"
        
        # Keep existing createdAt date if item already existed; otherwise assign today!
        $itemCreatedAt = if ($existingDates.ContainsKey($relPath)) {
            $existingDates[$relPath]
        } else {
            $todayStr
        }

        $items += [PSCustomObject]@{
            name      = $file.Name
            category  = $catName
            path      = $relPath
            size      = $file.Length
            createdAt = $itemCreatedAt
        }
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
[System.IO.File]::WriteAllText($dataPath, $content, [System.Text.Encoding]::UTF8)

# Update cache-busting timestamp in index.html
$indexPath = Join-Path $previewDir "index.html"
if (Test-Path $indexPath) {
    $html = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)
    $html = [System.Text.RegularExpressions.Regex]::Replace($html, 'src="data\.js(\?v=[^"]*)?"', "src=`"data.js?v=$timestamp`"")
    $html = [System.Text.RegularExpressions.Regex]::Replace($html, 'src="app\.js(\?v=[^"]*)?"', "src=`"app.js?v=$timestamp`"")
    $html = [System.Text.RegularExpressions.Regex]::Replace($html, 'href="style\.css(\?v=[^"]*)?"', "href=`"style.css?v=$timestamp`"")
    [System.IO.File]::WriteAllText($indexPath, $html, [System.Text.Encoding]::UTF8)
}

Write-Host "Scanned $($items.Count) files across $($categories.Count) categories in assets/ into data.js (v=$timestamp)"
