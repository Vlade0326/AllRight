# Terraform — AllRight (cloud-agnostic)

Módulos para desplegar la API en AWS ECS Fargate, GCP Cloud Run y Azure Container Instances.

## Requisitos

- [Terraform](https://www.terraform.io/) >= 1.5
- Credenciales del proveedor configuradas (`aws configure`, `gcloud auth application-default login`, `az login`)

## AWS ECS Fargate

```bash
cd infra/terraform/aws
terraform init
terraform plan -var="ecr_image=<account>.dkr.ecr.us-east-1.amazonaws.com/allright-api:latest"
terraform apply -var="ecr_image=..."
```

## GCP Cloud Run

```bash
cd infra/terraform/gcp
terraform init
terraform plan -var="gcp_project=YOUR_PROJECT" -var="container_image=gcr.io/PROJECT/allright-api:latest"
terraform apply ...
```

## Azure Container Instances

```bash
cd infra/terraform/azure
terraform init
terraform plan -var="container_image=yourregistry.azurecr.io/allright-api:latest"
terraform apply ...
```

> **Nota:** Los archivos `.tfstate` están en `.gitignore`. No subas state ni secrets al repositorio.
