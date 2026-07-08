variable "gcp_project" {
  type = string
}

variable "gcp_region" {
  type    = string
  default = "us-central1"
}

variable "container_image" {
  type        = string
  description = "Imagen en Artifact Registry"
}
