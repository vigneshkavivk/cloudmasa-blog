 
output "sp_id" {
  value = azuread_service_principal.sp.id
}

variable "app_display_name" {
  description = "Display name for the Azure AD application"
  type        = string
}