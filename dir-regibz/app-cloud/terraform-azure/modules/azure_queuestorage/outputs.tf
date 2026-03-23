output "storage_account_id" {
  description = "ID of the created storage account"
  value       = azurerm_storage_account.queue.id
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.queue.name
}

output "queue_id" {
  description = "ID of the storage queue"
  value       = azurerm_storage_queue.main.id
}

output "queue_name" {
  description = "Name of the queue"
  value       = azurerm_storage_queue.main.name
}

output "primary_connection_string" {
  description = "Primary connection string for the storage account"
  value       = azurerm_storage_account.queue.primary_connection_string
  sensitive   = true
}