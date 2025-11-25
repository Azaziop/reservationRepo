#!/usr/bin/env pwsh
param(
  [switch]$init,
  [switch]$plan,
  [switch]$apply,
  [switch]$destroy
)

if ($init) {
  & "C:\terraform_1.14.0_windows_amd64\terraform.exe" -chdir=terraform init
}
elseif ($plan) {
  & "C:\terraform_1.14.0_windows_amd64\terraform.exe" -chdir=terraform plan
}
elseif ($apply) {
  & "C:\terraform_1.14.0_windows_amd64\terraform.exe" -chdir=terraform apply -auto-approve
}
elseif ($destroy) {
  & "C:\terraform_1.14.0_windows_amd64\terraform.exe" -chdir=terraform destroy -auto-approve
}
else {
  Write-Host "Usage: .\scripts\terraform-dev.ps1 -init|-plan|-apply|-destroy"
}
