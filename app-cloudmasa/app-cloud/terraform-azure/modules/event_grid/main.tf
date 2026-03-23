# Create Event Grid Topic
resource "azurerm_eventgrid_topic" "main" {
  name                = var.event_grid_topic_name
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Service     = "EventGrid"
  }
}

# Optional: Create Event Subscription if webhook is provided
resource "azurerm_eventgrid_event_subscription" "webhook" {
  count = var.webhook_endpoint != "" ? 1 : 0

  name  = "${var.event_grid_topic_name}-webhook-sub"
  
  # For topic-scoped subscriptions, use 'scope' instead of resource_group_name/topic_id
  scope = azurerm_eventgrid_topic.main.id

  webhook_endpoint {
    url = var.webhook_endpoint
  }
}