# terraform-azure/main.tf

# Define provider
provider "azurerm" {
  features {}
}

# Conditional Resource Group (always needed)
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name != "" ? var.resource_group_name : "${var.vnet_name}-rg"
  location = var.location
  tags     = var.tags
}

# Deploy VNet module only if selected
module "vnet" {
  source = "./modules/vnet"

  count = var.module_to_deploy == "vnet" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  vnet_name           = var.vnet_name
  address_space       = var.vnet_address_space
  subnet_prefixes     = var.subnet_prefixes
  tags                = var.tags
}

# Deploy VM module only if selected
module "vm_ware" {
  source = "./modules/vm-ware"

  count = var.module_to_deploy == "vm-ware" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  vm_name             = var.vm_name
  vm_size             = var.vm_size
  admin_username      = var.admin_username
  admin_password      = var.admin_password

  vnet_name           = module.vnet[0].vnet_name
  subnet_name         = var.subnet_name
  subnet_id           = module.vnet[0].subnet_ids[var.subnet_name]

  tags                = var.tags
}

module "storage_account" {
  source = "./modules/storage_account"
  count = var.module_to_deploy == "storage_account" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  resource_name    = var.resource_name
  performance      = var.performance
  redundancy       = var.redundancy
  access_control   = var.access_control
}

module "cosmos_db" {
  source = "./modules/cosmos_db"

  count = var.module_to_deploy == "cosmos_db" ? 1 : 0

  resource_group_name     = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  cosmosdb_account_name   = var.cosmosdb_account_name
  cosmosdb_database_name  = var.cosmosdb_database_name
  cosmosdb_container_name = var.cosmosdb_container_name
}

module "key_vault" {
  source = "./modules/key_vault"

  count = var.module_to_deploy == "key_vault" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  key_vault_name      = var.key_vault_name
}

module "azure_ad" {
  source = "./modules/azure_ad"

  count = var.module_to_deploy == "azure_ad" ? 1 : 0

  app_display_name = var.app_display_name
}

module "azure_files" {
  source = "./modules/azure_files"

  count = var.module_to_deploy == "azure_files" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  prefix              = var.prefix
}


module "blob_storage" {
  source = "./modules/blob_storage"

  count = var.module_to_deploy == "blob_storage" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  prefix              = var.prefix
}

module "application_insights" {
  source = "./modules/applications_insights"

  count = var.module_to_deploy == "applications_insights" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  prefix              = var.prefix
  # Removed dependency on log_analysis to allow standalone deployment
  workspace_id = var.app_insights_workspace_id  # Pass from UI if needed, or leave null
}

module "microsoft_defender" {
  source = "./modules/microsoft_defender"
  count = var.module_to_deploy == "microsoft_defender" ? 1 : 0
}

module "advisor_alert" {
  source = "./modules/advisor_alert"

  count = var.module_to_deploy == "advisor_alert" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  subscription_id     = var.subscription_id
  prefix              = var.prefix

  advisor_alert_name = var.advisor_alert_name
  admin_email        = var.admin_email
  slack_webhook_url  = var.slack_webhook_url
}

module "azure_logicapps" {
  source = "./modules/logic_app"

  count = var.module_to_deploy == "logic_app" ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  logic_app_name      = var.logic_app_name
  # Removed dependency on log_analysis
  log_analytics_workspace_id = var.logic_app_workspace_id  # Optional; pass from UI if needed
}

module "event_grid" {
  source = "./modules/event_grid"
  count = var.module_to_deploy == "event_grid" ? 1 : 0

  resource_group_name   = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  event_grid_topic_name = var.event_grid_topic_name
  prefix                = var.prefix
  webhook_endpoint      = var.event_grid_webhook_endpoint
}

module "log_analytics" {
  source              = "./modules/log_analytics"
  count = var.module_to_deploy == "log_analytics" ? 1 : 0 

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  prefix              = var.prefix
}

module "queue_storage" {
  source = "./modules/azure_queuestorage"
  count = var.module_to_deploy == "azure_queuestorage" ? 1 : 0

  resource_group_name  = azurerm_resource_group.main.name
  location             = azurerm_resource_group.main.location
  storage_account_name = var.queue_storage_account_name
  queue_name           = var.queue_name
  prefix               = var.prefix
}