function New-TemporaryFilePath {
  $parent = [System.IO.Path]::GetTempPath()
  $name = [System.IO.Path]::GetRandomFileName()
  return (Join-Path $parent $name)
}

$targetPath = Join-Path -Path $PSScriptRoot -ChildPath "../src/kiota/runtime.json"

$currentContent = Get-Content -Path $targetPath -Raw | ConvertFrom-Json

$latestVersion = (Invoke-RestMethod -Uri "https://api.github.com/repos/microsoft/kiota/releases/latest").tag_name.TrimStart("v")

echo "Updating to Kiota version $latestVersion"

$currentContent.kiotaVersion = $latestVersion

foreach($runtimeDependency in $currentContent.runtimeDependencies.GetEnumerator()) {
	$tempPath = New-TemporaryFilePath
	$downloadUrl = "https://github.com/microsoft/kiota/releases/download/v$latestVersion/$($runtimeDependency.platformId).zip"
	echo "Downloading $downloadUrl to compute SHA256"
	Invoke-WebRequest -Uri $downloadUrl -OutFile $tempPath
	$sha256 = (Get-FileHash -Path $tempPath -Algorithm SHA256).Hash.ToLower()
	$runtimeDependency.sha256 = $sha256
	Remove-Item -Path $tempPath
}
$currentContent | ConvertTo-Json -Depth 10 | Set-Content -Path $targetPath