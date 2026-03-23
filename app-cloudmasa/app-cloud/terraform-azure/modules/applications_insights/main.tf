resource "azurerm_application_insights" "appinsights" {
  name                = "${var.prefix}-appinsights"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"
  retention_in_days   = 30
  workspace_id        = var.workspace_id != "" ? var.workspace_id : null


  tags = {
  ManagedBy    = "Terraform"
  Environment  = "Production"
  Organization = "cloudmasa"
}
}