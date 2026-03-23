variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "storage_account_name" {
  description = "Globally unique name for the storage account"
  type        = string
}

variable "queue_name" {
  description = "Name of the queue"
  type        = string
}

variable "prefix" {
  description = "Prefix for resource naming (optional)"
  type        = string
  default     = ""
}