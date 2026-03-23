# outputs.tf (FIXED)

output "vm_public_ip" {
  value = try(module.vm_ware[0].vm_public_ip, null)
  description = "Public IP of the VM (if deployed)"
}

output "vnet_name" {
  value = try(module.vnet[0].vnet_name, null)
  description = "Name of the VNet (if deployed)"
}

# output "subnet_ids" {
#   value = try(module.vnet[0].subnet_ids, {})
#   description = "Subnet IDs (if VNet deployed)"
# }

# --- Storage Account ---
output "storage_account_name" {
  value = try(module.storage_account[0].storage_account_name, null)
}

# --- Cosmos DB ---
output "cosmosdb_endpoint" {
  value = var.module_to_deploy == "cosmos_db" ? module.cosmos_db[0].cosmosdb_endpoint : null
}

# --- Key Vault ---
output "key_vault_uri" {
  value = var.module_to_deploy == "key_vault" ? module.key_vault[0].key_vault_uri : null
}

# --- Azure AD Application ---
output "azure_ad_app_id" {
  value = var.module_to_deploy == "azure_ad" ? module.azure_ad[0].app_id : null
}

# --- Azure Files ---
output "azure_files_storage_account_name" {
  value = var.module_to_deploy == "azure_files" ? module.azure_files[0].storage_account_name : null
}

output "azure_files_share_name" {
  value = var.module_to_deploy == "azure_files" ? module.azure_files[0].file_share_name : null
}

# --- Log Analytics ---
output "log_analytics_workspace_id" {
  value = var.module_to_deploy == "log_analytics" ? module.log_analytics[0].workspace_id : null
}

# --- Blob Storage ---
output "blob_storage_account_name" {
  value = var.module_to_deploy == "blob_storage" ? module.blob_storage[0].storage_account_name : null
}

output "blob_container_name" {
  value = var.module_to_deploy == "blob_storage" ? module.blob_storage[0].container_name : null
}

# --- Application Insights ---
output "appinsights_id" {
  value = var.module_to_deploy == "application_insights" ? module.application_insights[0].appinsights_id : null
}

output "appinsights_instrumentation_key" {
  value     = var.module_to_deploy == "applications_insights" ? module.application_insights[0].appinsights_instrumentation_key : null
  sensitive = true
}
# --- Microsoft Defender ---
output "defender_status" {
  value = var.module_to_deploy == "microsoft_defender" ? module.microsoft_defender[0].defender_enabled : null
}

# --- Azure Advisor ---
output "advisor_action_group_id" {
  value = var.module_to_deploy == "advisor_alert" ? module.advisor_alert[0].action_group_id : null
}

# --- Logic Apps ---
output "logic_app_id" {
  value = var.module_to_deploy == "azure_logicapps" ? module.azure_logicapps[0].logic_app_id : null
}

output "logic_app_endpoint" {
  value = var.module_to_deploy == "azure_logicapps" ? module.azure_logicapps[0].logic_app_endpoint : null
}

