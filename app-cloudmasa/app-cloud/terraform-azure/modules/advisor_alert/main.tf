resource "azurerm_monitor_action_group" "advisor_action_group" {
  name                = "${var.advisor_alert_name}-actiongroup"
  resource_group_name = var.resource_group_name
  location                 = "global"
  short_name = substr(coalesce(var.prefix, "advisor"), 0, 12)

  email_receiver {
    name          = "AdminEmail"
    email_address = var.admin_email
  }

  dynamic "webhook_receiver" {
    for_each = var.slack_webhook_url != "" ? [1] : []
    content {
      name        = "SlackWebhook"
      service_uri = var.slack_webhook_url
    }
  }
}

resource "azurerm_monitor_activity_log_alert" "advisor_new_recommendation" {
  name                = var.advisor_alert_name
  resource_group_name = var.resource_group_name
  location            = "global"
  scopes              = ["/subscriptions/${var.subscription_id}"]
  enabled             = true

  criteria {
    category       = "Recommendation"
    operation_name = "Microsoft.Advisor/recommendations/write"
  }

  action {
    action_group_id = azurerm_monitor_action_group.advisor_action_group.id
  }
}