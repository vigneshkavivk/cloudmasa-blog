resource "aws_ebs_volume" "demo" {
  availability_zone = var.availability_zone
  size              = var.size
  type              = var.volume_type
  encrypted         = var.encrypted
  iops              = var.iops
  throughput        = var.throughput
  tags = {
    Name          = var.volume_name
    Environment   = var.environment
    DeploymentId  = var.deployment_id
    Terraform     = "true"
  }
}
