output "logic_app_id" {
  value = azurerm_logic_app_workflow.example.id
}

output "logic_app_endpoint" {
  value = azurerm_logic_app_workflow.example.access_endpoint
}