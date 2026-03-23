output "advisor_alert_id" {
  value = azurerm_monitor_activity_log_alert.advisor_new_recommendation.id
}

output "action_group_id" {
  value = azurerm_monitor_action_group.advisor_action_group.id
}