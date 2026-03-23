output "key_vault_name" {
  value = azurerm_key_vault.vault.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.vault.vault_uri
}