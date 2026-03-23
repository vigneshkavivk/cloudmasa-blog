# APP/app-cloud/terraform-azure/modules/storage_account/main.tf

resource "azurerm_storage_account" "example" {
  name                     = var.resource_name
  resource_group_name      = var.resource_group_name # This is passed from global tfvars
  location                 = var.location
  account_tier             = var.performance == "Premium" ? "Premium" : "Standard"
  account_replication_type = var.redundancy

 

  # Handle access control
  blob_properties {
    container_delete_retention_policy {
      days = 7 # Example, adjust as needed
    }
  }

  # If using RBAC, you might need to set up role assignments separately.
  # For simple cases, this might be sufficient.
}