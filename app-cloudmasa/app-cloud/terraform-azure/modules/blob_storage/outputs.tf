output "storage_account_name" {
  description = "Name of the Blob Storage Account"
  value       = azurerm_storage_account.sa.name
}

output "container_name" {
  description = "Name of the Blob Container"
  value       = azurerm_storage_container.container.name
}