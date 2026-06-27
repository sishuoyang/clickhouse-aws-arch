output "url" {
  description = "Public HTTPS URL once DNS has propagated."
  value       = "https://${var.domain_name}/"
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain (the alias target)."
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (used for cache invalidations)."
  value       = aws_cloudfront_distribution.cdn.id
}

output "bucket" {
  description = "S3 origin bucket."
  value       = aws_s3_bucket.site.id
}
