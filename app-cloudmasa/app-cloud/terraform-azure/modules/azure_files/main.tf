resource "azurerm_storage_account" "sa" {
  name                     = "${var.prefix}storage${random_string.suffix.result}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "random_string" "suffix" {
  length  = 4
  upper   = false
  lower   = true
  numeric = true
  special = false
}

resource "azurerm_storage_share" "file_share" {
  name                 = "${var.prefix}-files"
  storage_account_name = azurerm_storage_account.sa.name
  quota                = 50

 
}

 