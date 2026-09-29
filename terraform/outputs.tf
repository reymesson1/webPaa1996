output "alb_dns_name" {
  description = "Public DNS hostname of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS Cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS Service"
  value       = aws_ecs_service.main.name
}

output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret for application credentials"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "rds_endpoint" {
  description = "Endpoint of PostgreSQL RDS database"
  value       = aws_db_instance.postgres.endpoint
}
