variable "resource_group_name" {
  type    = string
  default = "allright-rg"
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "container_image" {
  type        = string
  description = "Imagen Docker pública o ACR"
}

variable "dns_name_label" {
  type    = string
  default = "allright-api"
}
