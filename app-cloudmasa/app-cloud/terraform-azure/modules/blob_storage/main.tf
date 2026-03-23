resource "random_string" "suffix" {
  length  = 4
  upper   = false
  lower   = true
  numeric = true
  special = false
}

resource "azurerm_storage_account" "sa" {
  name                     = "${var.prefix}blobstorage${random_string.suffix.result}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  access_tier              = "Hot"
}

resource "azurerm_storage_container" "container" {
  name                  = "${var.prefix}-container"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "private"

 
}