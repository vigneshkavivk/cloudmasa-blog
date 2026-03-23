output "storage_account_name" {
  description = "Name of the Storage Account"
  value       = azurerm_storage_account.sa.name
}

output "file_share_name" {
  description = "Name of the Azure File Share"
  value       = azurerm_storage_share.file_share.name
}