param(
    [string]$OutputDir = 'release/installer',
    [switch]$SkipBuild,
    [switch]$NoVersionBump
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-SigningVar {
    param(
        [string]$Primary,
        [string]$Secondary
    )

    $value = [Environment]::GetEnvironmentVariable($Primary)
    if (-not [string]::IsNullOrWhiteSpace($value)) {
        return $value
    }

    $value = [Environment]::GetEnvironmentVariable($Secondary)
    if (-not [string]::IsNullOrWhiteSpace($value)) {
        return $value
    }

    return $null
}

function Require-TrueSetting {
    param(
        [object]$Value,
        [string]$Name
    )

    if ($Value -ne $true) {
        Write-Error "Expected build.nsis.$Name to be true in package.json"
    }
}

function Remove-PathWithRetry {
    param(
        [string]$Path,
        [int]$MaxAttempts = 8,
        [int]$DelayMs = 750
    )

    if (-not (Test-Path $Path)) {
        return
    }

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            Remove-Item -Path $Path -Force -Recurse -ErrorAction Stop
            return
        } catch {
            if ($attempt -eq $MaxAttempts) {
                throw
            }
            Start-Sleep -Milliseconds $DelayMs
        }
    }
}

function Write-FileUtf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Get-NextPatchVersion {
    param(
        [string]$Version
    )

    $parts = $Version.Split('.')
    if ($parts.Length -ne 3) {
        Write-Error "Unsupported version format: $Version"
    }

    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]
    $patch += 1
    return "$major.$minor.$patch"
}

$certPath = Get-SigningVar -Primary 'CSC_LINK' -Secondary 'WIN_CSC_LINK'
$certPassword = Get-SigningVar -Primary 'CSC_KEY_PASSWORD' -Secondary 'WIN_CSC_KEY_PASSWORD'

if ([string]::IsNullOrWhiteSpace($certPath) -or [string]::IsNullOrWhiteSpace($certPassword)) {
    Write-Host "Signing credentials are missing. Skipping code signing." -ForegroundColor Yellow
    $SkipSigning = $true
} else {
    if (-not (Test-Path $certPath)) {
        Write-Error "Certificate file not found: $certPath"
    }
}

$packageJsonPath = Join-Path $PSScriptRoot '..\package.json'
$packageJsonPath = (Resolve-Path $packageJsonPath).Path
$packageJsonRaw = Get-Content $packageJsonPath -Raw

$versionMatch = [regex]::Match($packageJsonRaw, '"version"\s*:\s*"(?<version>\d+\.\d+\.\d+)"')
if (-not $versionMatch.Success) {
    Write-Error "Could not find semantic version in package.json: $packageJsonPath"
}

$currentVersion = $versionMatch.Groups['version'].Value
if (-not $NoVersionBump) {
    $nextVersion = Get-NextPatchVersion -Version $currentVersion
    $packageJsonRaw = [regex]::Replace(
        $packageJsonRaw,
        '"version"\s*:\s*"\d+\.\d+\.\d+"',
        ('"version": "' + $nextVersion + '"'),
        1
    )
    Write-FileUtf8NoBom -Path $packageJsonPath -Content $packageJsonRaw
    Write-Host "Version bumped: $currentVersion -> $nextVersion" -ForegroundColor Cyan
}

$packageJson = $packageJsonRaw | ConvertFrom-Json

if (-not $SkipBuild) {
    Write-Host 'Running renderer build (build:win)...' -ForegroundColor Cyan
    npm run build:win
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed with exit code $LASTEXITCODE"
    }
}

 $effectiveOutputDir = "$OutputDir-$($packageJson.version)"
if (Test-Path $effectiveOutputDir) {
    Write-Host "Cleaning previous output dir: $effectiveOutputDir" -ForegroundColor Cyan
    Remove-PathWithRetry -Path $effectiveOutputDir
}

Write-Host "Running Inno Setup for output: $effectiveOutputDir" -ForegroundColor Cyan
& "C:\Program Files (x86)\Inno Setup 6\iscc.exe" /O"$effectiveOutputDir" installer.iss
if ($LASTEXITCODE -ne 0) {
    Write-Error "Inno Setup failed with exit code $LASTEXITCODE"
}

$outputResolved = (Resolve-Path $effectiveOutputDir).Path
$setupFile = Get-ChildItem -Path $outputResolved -File -Filter '*.exe' |
    Where-Object { $_.Name -notlike '__uninstaller-*' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $setupFile) {
    Write-Error "Expected setup artifact was not found in: $outputResolved"
}

$setupPath = $setupFile.FullName

$appFile = Get-ChildItem -Path (Join-Path $outputResolved 'win-unpacked') -File -Filter '*.exe' |
    Where-Object { $_.Name -ne 'elevate.exe' -and $_.Name -ne 'pagent.exe' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $appFile) {
    Write-Error "Expected unpacked app executable was not found in: $(Join-Path $outputResolved 'win-unpacked')"
}

$appPath = $appFile.FullName

$uninstallerFile = Get-ChildItem -Path $outputResolved -File -Filter '__uninstaller-*.exe' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

Write-Host "SETUP artifact: $setupPath" -ForegroundColor DarkGray
Write-Host "APP artifact: $appPath" -ForegroundColor DarkGray
if ($uninstallerFile) {
    Write-Host "UNINSTALLER artifact: $($uninstallerFile.FullName)" -ForegroundColor DarkGray
} else {
    Write-Host 'UNINSTALLER artifact: not present on disk (temporary NSIS artifact may have been cleaned after packaging).' -ForegroundColor DarkGray
}

if (-not $SkipSigning) {
    $setupSig = Get-AuthenticodeSignature $setupPath
    $appSig = Get-AuthenticodeSignature $appPath
}

Write-Host 'Signed build completed.' -ForegroundColor Green
