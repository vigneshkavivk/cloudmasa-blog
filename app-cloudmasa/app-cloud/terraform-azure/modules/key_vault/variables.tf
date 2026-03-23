variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "key_vault_name" {
  type = string
}
variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}