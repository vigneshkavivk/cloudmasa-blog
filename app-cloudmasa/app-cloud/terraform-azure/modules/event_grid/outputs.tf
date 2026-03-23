output "topic_id" {
  description = "ID of the Event Grid Topic"
  value       = azurerm_eventgrid_topic.main.id
}

output "topic_name" {
  description = "Name of the Event Grid Topic"
  value       = azurerm_eventgrid_topic.main.name
}

output "endpoint" {
  description = "Endpoint URL for publishing events"
  value       = azurerm_eventgrid_topic.main.endpoint
}

output "primary_access_key" {
  description = "Primary access key for the topic"
  value       = azurerm_eventgrid_topic.main.primary_access_key
  sensitive   = true
}

output "webhook_subscription_id" {
  description = "ID of the webhook subscription (if created)"
  value       = length(azurerm_eventgrid_event_subscription.webhook) > 0 ? azurerm_eventgrid_event_subscription.webhook[0].id : null
}