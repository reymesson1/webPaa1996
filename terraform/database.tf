# 1. Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "docintel-${var.environment}-db-subnet-group"
  description = "Subnet group for DocIntel PostgreSQL vector store"
  subnet_ids  = aws_subnet.database[*].id

  tags = {
    Name = "docintel-${var.environment}-db-subnet-group"
  }
}

# 2. Database Security Group
resource "aws_security_group" "db" {
  name        = "docintel-${var.environment}-db-sg"
  description = "Allows inbound PostgreSQL traffic strictly from ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = 5432
    to_port         = 5432
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "docintel-${var.environment}-db-sg"
  }
}

# 3. RDS PostgreSQL Instance (pgvector compatible)
resource "aws_db_instance" "postgres" {
  identifier        = "docintel-${var.environment}-postgres"
  engine            = "postgres"
  engine_version    = "16.3"
  instance_class    = "db.t4g.medium"
  allocated_storage = 50
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.secrets.arn

  db_name  = "docintel_prod"
  username = "docintel_admin"
  password = "replace_with_secrets_manager_random_password"

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  skip_final_snapshot     = true
  deletion_protection     = false
  backup_retention_period = 7

  tags = {
    Name = "docintel-${var.environment}-postgres"
  }
}
