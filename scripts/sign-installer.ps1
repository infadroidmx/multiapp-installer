# scripts/sign-installer.ps1
param(
    [Parameter(Mandatory=$true)][string]$InstallerPath,
    [string]$CertPath,
    [string]$CertPassword
)

function Write-Log {
    param([string]$msg)
    Write-Host "[sign-installer] $msg"
}

# If no certificate provided, generate a temporary self‑signed code‑signing certificate
if (-not $CertPath) {
    Write-Log "No certificate provided. Generating temporary self‑signed certificate."
    $tempPfx = "$env:TEMP\selfsigned_code_signing.pfx"
    $tempPwd = "TempPass123!"
    $securePwd = ConvertTo-SecureString -String $tempPwd -Force -AsPlainText
    $cert = New-SelfSignedCertificate -DnsName "SelfSignedCodeSigning" -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable -Provider "Microsoft Enhanced RSA and AES Cryptographic Provider" -KeySpec Signature -NotAfter (Get-Date).AddYears(1)
    Export-PfxCertificate -Cert $cert -FilePath $tempPfx -Password $securePwd
    $CertPath = $tempPfx
    $CertPassword = $tempPwd
    Write-Log "Generated temporary certificate at $CertPath"
}

# Ensure signtool is available
$signTool = "signtool"
try {
    $null = & $signTool /?
} catch {
    Write-Error "signtool not found in PATH. Please ensure Windows SDK is installed and signtool is available."
    exit 1
}

# Sign the installer
$securePwd = ConvertTo-SecureString -String $CertPassword -Force -AsPlainText
Write-Log "Signing installer $InstallerPath using certificate $CertPath"
& $signTool sign /f $CertPath /p $CertPassword /tr http://timestamp.digicert.com /td sha256 /fd sha256 $InstallerPath
if ($LASTEXITCODE -eq 0) {
    Write-Log "Successfully signed $InstallerPath"
} else {
    Write-Error "Failed to sign $InstallerPath. Exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
