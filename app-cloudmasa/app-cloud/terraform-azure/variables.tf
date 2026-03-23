# terraform-azure/variables.tf

variable "prefix" {
  type = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  default     = ""
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags for resources"
  type        = map(string)
  default     = {
    environment = "dev"
  }
}

# VNet Module Variables
variable "vnet_name" {
  description = "Name of the virtual network"
  type        = string
  default     = "default-vnet"
}

variable "vnet_address_space" {
  description = "CIDR block for VNet"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_prefixes" {
  description = "Map of subnet names to CIDR blocks"
  type        = map(string)
  default     = {
    "subnet1" = "10.0.1.0/24"
  }
}

# VM Module Variables
variable "vm_name" {
  description = "Name of the VM"
  type        = string
  default     = "default-vm"
}

variable "vm_size" {
  description = "VM size"
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Admin username for VM"
  type        = string
  default     = "azureuser"
}

variable "admin_password" {
  description = "Admin password for VM"
  type        = string
  default     = "P@ssw0rd123!"
}

variable "subnet_name" {
  description = "Name of the subnet to attach VM"
  type        = string
  default     = "subnet1"
}

variable "module_to_deploy" {
  description = "Which module to deploy: 'vnet' or 'vm-ware'"
  type        = string
  default     = "none"
}

# AKS-specific variables
variable "cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  default     = ""
}

variable "node_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 2
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "vnet_id" {
  description = "ID of existing Virtual Network (optional)"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "List of subnet IDs (at least 2 required if vnet_id is set)"
  type        = list(string)
  default     = []

  validation {
    condition     = var.vnet_id == "" || length(var.subnet_ids) >= 2
    error_message = "At least 2 subnet IDs are required when using an existing VNet."
  }
}

# --- Storage Account Variables ---
variable "resource_name" {
  description = "Name of the storage account (must be globally unique, lowercase, 3-24 chars)"
  type        = string
  default     = "mystorage12345"
}

variable "performance" {
  type    = string
  default = "Standard"
}

variable "redundancy" {
  type    = string
  default = "LRS" # LRS, GRS, RAGRS, ZRS
}

variable "access_control" {
  type    = string
  default = "RBAC"
}

# --- Cosmos DB Variables ---
variable "cosmosdb_account_name" {
  type = string
  default = "my-cosmos-account"
}

variable "cosmosdb_database_name" {
  type = string
  default = "mydb"
}

variable "cosmosdb_container_name" {
  type = string
  default = "mycontainer"
}

# --- Key Vault ---
variable "key_vault_name" {
  type = string
  default = "demo-cloudmasa"
}

# --- Azure AD App ---
variable "app_display_name" {
  type = string
  default = "MyApp"
}

# --- Advisor & Alerts ---
variable "advisor_alert_name" {
  type = string
  default = "cost-alert"
}

variable "admin_email" {
  type = string
  default = ""
}

variable "slack_webhook_url" {
  type      = string
  sensitive = true
  default   = ""
}

# --- Logic Apps & App Insights (optional workspace IDs) ---
variable "logic_app_name" {
  type = string
  default = "my-logic-app"
}

variable "logic_app_workspace_id" {
  type = string
  default = ""
}

variable "app_insights_workspace_id" {
  type = string
  default = ""
}

# --- Event Grid Variables ---
variable "event_grid_topic_name" {
  description = "Name of the Event Grid topic"
  type        = string
  default     = "demo-event-grid-topic"
}

variable "event_grid_webhook_endpoint" {
  description = "Webhook URL to receive Event Grid events"
  type        = string
  default     = ""
}

variable "app_insights_name" {
  description = "Name of the Application Insights resource"
  type        = string
  default     = "default-appinsights"
}

variable "log_analytics_workspace_id" {
  type    = string
  default = ""
}

variable "queue_storage_account_name" {
  description = "Name of the storage account for queues (must be globally unique)"
  type        = string
}

variable "queue_name" {
  description = "Name of the Azure Storage Queue"
  type        = string
  default     = "default-queue"
}
