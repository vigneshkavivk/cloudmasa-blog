# Create storage account for queues
resource "azurerm_storage_account" "queue" {
  name                     = var.storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Service     = "QueueStorage"
  }
}

# Create storage queue
resource "azurerm_storage_queue" "main" {
  name                 = var.queue_name
  storage_account_name = azurerm_storage_account.queue.name

  # Optional: Configure queue properties
  # metadata = {
  #   owner = "app-team"
  # }
}