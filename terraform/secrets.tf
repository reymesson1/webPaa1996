# 1. AWS KMS Key for Encryption at Rest
resource "aws_kms_key" "secrets" {
  description             = "KMS Customer Managed Key for DocIntel Secrets and DB encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "docintel-${var.environment}-kms-key"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/docintel-${var.environment}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# 2. AWS Secrets Manager - LLM API Keys & Auth Secret
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "docintel/${var.environment}/app-secrets"
  description             = "Secured LLM API keys (Gemini, OpenAI) and JWT signing secret"
  kms_key_id              = aws_kms_key.secrets.arn
  recovery_window_in_days = 7

  tags = {
    Name = "docintel-${var.environment}-app-secrets"
  }
}

# Initial JSON template in Secrets Manager (Populated securely via AWS CLI / CI/CD, never in git)
resource "aws_secretsmanager_secret_version" "initial_template" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    GEMINI_API_KEY = "placeholder_replace_in_aws_console"
    OPENAI_API_KEY = "placeholder_replace_in_aws_console"
    JWT_SECRET     = "placeholder_replace_with_high_entropy_secret_2026"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# 3. IAM Policy for ECS Task to access ONLY this secret
resource "aws_iam_policy" "secrets_access" {
  name        = "docintel-${var.environment}-secrets-access"
  description = "Allows ECS tasks to read encrypted application secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.app_secrets.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.secrets.arn
      }
    ]
  })
}
