variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "ecr_image" {
  type        = string
  description = "Imagen ECR de allright-api"
}

variable "desired_count" {
  type    = number
  default = 1
}
