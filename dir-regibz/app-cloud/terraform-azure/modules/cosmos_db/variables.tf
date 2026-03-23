variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "cosmosdb_account_name" {
  type = string
}

variable "cosmosdb_database_name" {
  type = string
}

variable "cosmosdb_container_name" {
  type = string
}

# modules/cosmos_db/variables.tf
variable "partition_key_paths" {
  type        = list(string)
  default     = ["/id"]
  description = "Partition key paths for the Cosmos DB container"
}