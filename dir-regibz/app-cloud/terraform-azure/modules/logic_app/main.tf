# 1. Create the Logic App workflow
resource "azurerm_logic_app_workflow" "example" {
  name                = var.logic_app_name
  location            = var.location
  resource_group_name = var.resource_group_name
}

# 2. Add a recurrence trigger
resource "azurerm_logic_app_trigger_custom" "recurrence" {
  name         = "Recurrence"
  logic_app_id = azurerm_logic_app_workflow.example.id
  body = jsonencode({
    type = "Recurrence"
    recurrence = {
      frequency = "Hour"
      interval  = 1
    }
  })
}

# 3. Add an HTTP action
resource "azurerm_logic_app_action_custom" "http_get" {
  name         = "GetPublicIP"
  logic_app_id = azurerm_logic_app_workflow.example.id
  body = jsonencode({
    type   = "Http"
    inputs = {
      method = "GET"
      uri    = "https://httpbin.org/ip"  # ✅ Fixed: no trailing spaces!
    }
  })
  depends_on = [azurerm_logic_app_trigger_custom.recurrence]
}

# 4. Optional: Send logs to Log Analytics
# Always create diagnostic setting (assumes workspace ID is provided)
resource "azurerm_monitor_diagnostic_setting" "logicapp_diag" {
  count                      = var.log_analytics_workspace_id != "" ? 1 : 0
  name                       = "${var.logic_app_name}-diagnostics"
  target_resource_id         = azurerm_logic_app_workflow.example.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "WorkflowRuntime"
  }
}
