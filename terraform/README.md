# Terraform — Docker provider (dev)

This folder contains a minimal Terraform scaffold using the Docker provider so you can manage local development containers, network, and volumes with Terraform.

What it does
- Creates a Docker network for the app
- Creates a Docker volume for MySQL data
- Pulls a MySQL image and creates a MySQL container connected to the network

Why use this
- Keeps dev environment reproducible for everyone on the team
- Works well when you want to recreate / destroy dev infra reliably from the repo

Getting started (local)
1. Make sure Docker Desktop (or Docker) is running on your machine.
2. Run:

```powershell
# from repo root
C:\terraform_1.14.0_windows_amd64\terraform.exe -chdir=terraform init
C:\terraform_1.14.0_windows_amd64\terraform.exe -chdir=terraform plan
C:\terraform_1.14.0_windows_amd64\terraform.exe -chdir=terraform apply
```

3. To remove the created resources:

```powershell
C:\terraform_1.14.0_windows_amd64\terraform.exe -chdir=terraform destroy
```

Notes
- This scaffold uses local state (terraform.tfstate in `terraform/`). If you want remote state (recommended for teams) configure a backend in `backend.tf`.
