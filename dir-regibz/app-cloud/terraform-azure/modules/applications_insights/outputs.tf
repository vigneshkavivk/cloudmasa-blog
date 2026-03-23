output "appinsights_id" {
  description = "Resource ID of Application Insights"
  value       = azurerm_application_insights.appinsights.id
}

output "appinsights_instrumentation_key" {
  description = "Instrumentation Key for Application Insights"
  value       = azurerm_application_insights.appinsights.instrumentation_key
}