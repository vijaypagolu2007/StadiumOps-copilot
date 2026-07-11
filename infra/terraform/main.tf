terraform {
  required_version = "= 1.10.4"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 5.83.1"
    }
  }
}

provider "aws" {
  region = var.region
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.31.6"

  cluster_name    = "stadiumops-${var.environment}"
  cluster_version = "1.31"
  subnet_ids      = var.private_subnet_ids
  vpc_id          = var.vpc_id

  eks_managed_node_groups = {
    ops = {
      min_size     = 6
      max_size     = 80
      desired_size = 12
      instance_types = ["m7i.large"]
    }
  }
}

resource "aws_s3_bucket" "audit_archive" {
  bucket = "stadiumops-audit-${var.environment}"
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_archive" {
  bucket = aws_s3_bucket.audit_archive.id
  rule {
    id     = "glacier-after-seven-days"
    status = "Enabled"
    transition {
      days          = 7
      storage_class = "GLACIER"
    }
  }
}

resource "aws_elasticache_replication_group" "semantic_cache" {
  replication_group_id       = "stadiumops-cache-${var.environment}"
  description                = "Semantic cache and rate-limit store"
  node_type                  = "cache.r7g.large"
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  engine                     = "redis"
}

resource "aws_db_instance" "pgvector" {
  identifier             = "stadiumops-pgvector-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.r7g.large"
  allocated_storage      = 100
  db_name                = "stadiumops"
  username               = var.db_username
  password               = var.db_password
  skip_final_snapshot    = false
  backup_retention_period = 7
}
