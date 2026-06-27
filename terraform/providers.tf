provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# CloudFront requires its ACM certificate in us-east-1, regardless of the bucket's region.
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile
}
