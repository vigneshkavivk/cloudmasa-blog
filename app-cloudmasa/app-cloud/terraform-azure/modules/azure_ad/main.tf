resource "azuread_application" "app" {
  display_name = var.app_display_name
}

resource "azuread_service_principal" "sp" {
  client_id = azuread_application.app.client_id  # ✅ correct attribute

  tags = [
    "ManagedBy=Terraform",
    "Environment=Production",
    "Organization=cloudmasa"
  ]  # ✅ must be list of strings
}