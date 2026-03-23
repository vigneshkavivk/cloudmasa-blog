variable "resource_group_name" {
  type = string
}
variable "location" {
  type = string
}

variable "subscription_id" {
  type = string
}

variable "prefix" {
  type = string
}

variable "advisor_alert_name" {
  type = string
}

variable "admin_email" {
  type = string
}

variable "slack_webhook_url" {
  type    = string
  default = ""
}