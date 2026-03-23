# modules/key_vault/main.tf

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "vault" {
  name                = var.key_vault_name
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  soft_delete_retention_days = 7
  purge_protection_enabled   = false

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get", "List", "Create", "Delete"
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete"
    ]
  }

  tags = {
  ManagedBy    = "Terraform"
  Environment  = "Production"
  Organization = "cloudmasa"
}

}