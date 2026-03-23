output "volume_id" {
  description = "ID of the created EBS volume"
  value       = aws_ebs_volume.demo.id
}

output "arn" {
  description = "ARN of the EBS volume"
  value       = aws_ebs_volume.demo.arn
}
