# APP/app-cloud/terraform-azure/modules/storage_account/variables.tf

variable "resource_name" {
  description = "Name of the storage account"
  type        = string
}

variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
}
variable "location" {
  description = "Azure region for the storage account"
  type        = string
}

variable "performance" {
  description = "Performance tier (Standard or Premium)"
  type        = string
  default     = "Standard"
}

variable "redundancy" {
  description = "Redundancy option (LRS, ZRS, GRS, etc.)"
  type        = string
  default     = "LRS"
}

variable "access_control" {
  description = "Access control model (RBAC or ACL)"
  type        = string
  default     = "RBAC"
}

# You might also need other variables based on your main.tf logic