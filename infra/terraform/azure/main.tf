terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "allright" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_container_group" "allright_api" {
  name                = "allright-api-aci"
  location            = azurerm_resource_group.allright.location
  resource_group_name = azurerm_resource_group.allright.name
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = var.dns_name_label

  container {
    name   = "allright-api"
    image  = var.container_image
    cpu    = "1"
    memory = "1.5"

    ports {
      port     = 3000
      protocol = "TCP"
    }

    environment_variables = {
      NODE_ENV = "production"
      PORT     = "3000"
    }
  }
}

output "fqdn" {
  value = azurerm_container_group.allright_api.fqdn
}

output "ip_address" {
  value = azurerm_container_group.allright_api.ip_address
}
