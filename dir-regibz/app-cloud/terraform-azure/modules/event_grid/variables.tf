variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "event_grid_topic_name" {
  description = "Name of the Event Grid Topic"
  type        = string
}

variable "prefix" {
  description = "Prefix for resource naming (optional)"
  type        = string
  default     = ""
}

variable "webhook_endpoint" {
  description = "Webhook URL to receive events (optional)"
  type        = string
  default     = ""
}