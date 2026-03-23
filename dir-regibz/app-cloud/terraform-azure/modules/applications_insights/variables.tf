variable "resource_group_name" { type = string }
variable "location"            { type = string }
variable "prefix"              { type = string }
variable "workspace_id" {
  description = "Log Analytics Workspace ID (optional)"
  type        = string
  default     = ""
}