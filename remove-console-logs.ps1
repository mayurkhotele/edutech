# PowerShell script to remove all console.log statements from TypeScript/JavaScript files

# Get all .tsx, .ts, and .js files excluding node_modules and .git
$files = Get-ChildItem -Recurse -Include "*.tsx", "*.ts", "*.js" | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and 
    $_.FullName -notlike "*.git*" -and
    $_.FullName -notlike "*remove-console-logs.ps1*"
}

$totalFiles = 0
$totalLogs = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "console\.log") {
        $totalFiles++
        
        # Count console.log statements
        $logCount = ([regex]::Matches($content, "console\.log")).Count
        $totalLogs += $logCount
        
        Write-Host "Processing: $($file.Name) - Found $logCount console.log statements"
        
        # Remove console.log statements (including the line if it only contains console.log)
        $newContent = $content -replace "^\s*console\.log\([^;]*\);\s*$", "" -replace "^\s*console\.log\([^;]*\)\s*$", ""
        
        # Also remove console.log statements that are part of larger statements
        $newContent = $newContent -replace "console\.log\([^)]*\);?", ""
        
        # Clean up empty lines
        $newContent = $newContent -replace "^\s*$\n", ""
        
        # Write back to file
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}

Write-Host "`nSummary:"
Write-Host "Files processed: $totalFiles"
Write-Host "Total console.log statements removed: $totalLogs"
Write-Host "`nConsole.log removal completed!"
