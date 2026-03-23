
output "app_id" {
  value = azuread_application.app.client_id  # ✅ correct
}