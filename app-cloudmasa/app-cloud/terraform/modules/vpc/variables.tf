variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

# ✅ KEEP THESE — they match your backend
variable "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = []
}

variable "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default     = []
}

variable "availability_zones" {
  description = "List of Availability Zones (e.g., ['us-east-1a', 'us-east-1b'])"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "deployment_id" {
  description = "Unique deployment identifier for cost tracking"
  type        = string
}
