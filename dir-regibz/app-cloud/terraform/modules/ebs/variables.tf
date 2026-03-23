variable "volume_name" {
  description = "Name tag for the EBS volume"
  type        = string
}

variable "volume_type" {
  description = "Type of EBS volume (gp3, gp2, io1, st1, sc1)"
  type        = string
  default     = "gp3"
}

variable "size" {
  description = "Size in GiB"
  type        = number
}

variable "iops" {
  description = "Provisioned IOPS for io1/io2 volumes"
  type        = number
  default     = null
}

variable "throughput" {
  description = "Throughput in MiB/s for gp3 volumes"
  type        = number
  default     = null
}

variable "encrypted" {
  description = "Enable encryption"
  type        = bool
  default     = true
}

variable "availability_zone" {
  description = "AZ to create volume in"
  type        = string
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "prod"
}

variable "deployment_id" {
  description = "Deployment ID for tagging"
  type        = string
}
