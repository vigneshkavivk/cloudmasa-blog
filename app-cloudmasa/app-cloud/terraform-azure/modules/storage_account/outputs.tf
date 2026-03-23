output "storage_account_id" {
  description = "ID of the storage account"
  value       = azurerm_storage_account.example.id
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.example.name
}

output "storage_account_primary_blob_endpoint" {
  description = "Primary blob endpoint of the storage account"
  value       = azurerm_storage_account.example.primary_blob_endpoint
}