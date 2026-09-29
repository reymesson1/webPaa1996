variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for the primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "app_port" {
  description = "Application listening port inside container"
  type        = number
  default     = 5000
}

variable "fargate_cpu" {
  description = "Fargate CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "fargate_memory" {
  description = "Fargate memory in MB"
  type        = number
  default     = 2048
}

variable "min_capacity" {
  description = "Minimum ECS Fargate task replicas"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum ECS Fargate task replicas for bursty AI spikes"
  type        = number
  default     = 10
}

variable "llm_provider" {
  description = "Active LLM provider: mock | gemini | openai"
  type        = string
  default     = "gemini"
}
