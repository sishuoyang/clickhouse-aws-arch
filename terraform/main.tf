# DiagramHouse hosting: private S3 origin behind CloudFront (HTTPS, custom domain), ACM cert
# DNS-validated in Route 53, and a Terraform-driven content sync + cache invalidation.

# ----------------------------------------------------------------------------------------------
# S3 origin (private — only CloudFront can read it via Origin Access Control)
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket" "site" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ----------------------------------------------------------------------------------------------
# ACM certificate for the custom domain (must be in us-east-1 for CloudFront), DNS-validated
# ----------------------------------------------------------------------------------------------
resource "aws_acm_certificate" "cert" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# ----------------------------------------------------------------------------------------------
# CloudFront — Origin Access Control + a cache policy that honors the objects' Cache-Control
# (so content-hashed assets cache for a year while index.html / layouts / GIFs revalidate).
# ----------------------------------------------------------------------------------------------
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.bucket_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "honor_origin" {
  name        = "${var.bucket_name}-honor-origin"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
    cookies_config { cookie_behavior = "none" }
    headers_config { header_behavior = "none" }
    query_strings_config { query_string_behavior = "none" }
  }
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "DiagramHouse (${var.domain_name})"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = [var.domain_name]

  origin {
    origin_id                = "s3-${aws_s3_bucket.site.id}"
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = aws_cloudfront_cache_policy.honor_origin.id
  }

  # Single-page app: a missing key (S3 returns 403 under OAC) falls back to index.html.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# Bucket policy: allow ONLY this CloudFront distribution to read objects (via OAC).
data "aws_iam_policy_document" "bucket" {
  statement {
    sid       = "AllowCloudFrontReadViaOAC"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.bucket.json

  depends_on = [aws_s3_bucket_public_access_block.site]
}

# ----------------------------------------------------------------------------------------------
# DNS: alias diagrams.housemate.click -> CloudFront (A + AAAA). Z2FDTNDATAQYW2 is CloudFront's
# fixed hosted-zone id for alias targets.
# ----------------------------------------------------------------------------------------------
resource "aws_route53_record" "a" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "aaaa" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

# ----------------------------------------------------------------------------------------------
# Content sync: upload dist/ with per-type cache headers and invalidate CloudFront. Re-runs
# whenever any file under dist/ changes. Build first with `./build-static.sh`.
# ----------------------------------------------------------------------------------------------
locals {
  dist_path  = "${path.module}/${var.dist_dir}"
  dist_files = fileset(local.dist_path, "**")
  dist_hash  = length(local.dist_files) == 0 ? "empty" : sha1(join(",", [for f in local.dist_files : filesha1("${local.dist_path}/${f}")]))
}

resource "null_resource" "publish" {
  triggers = {
    dist_hash       = local.dist_hash
    distribution_id = aws_cloudfront_distribution.cdn.id
  }

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    environment = {
      AWS_PROFILE = var.aws_profile
      AWS_REGION  = var.aws_region
    }
    command = <<-EOT
      set -euo pipefail
      DIST="${local.dist_path}"
      BUCKET="${aws_s3_bucket.site.id}"
      if [ ! -f "$DIST/index.html" ]; then
        echo "✗ $DIST/index.html not found — run ./build-static.sh before terraform apply." >&2
        exit 1
      fi

      echo "› Uploading hashed assets…"
      aws s3 sync "$DIST" "s3://$BUCKET" --delete \
        --exclude index.html --exclude "__layout/*" --exclude "gifs/*" \
        --cache-control "public,max-age=31536000,immutable"

      echo "› Uploading index.html…"
      aws s3 cp "$DIST/index.html" "s3://$BUCKET/index.html" \
        --content-type "text/html; charset=utf-8" --cache-control "no-cache"

      if [ -d "$DIST/__layout" ]; then
        echo "› Uploading layouts…"
        aws s3 sync "$DIST/__layout" "s3://$BUCKET/__layout" --delete \
          --content-type "application/json" --cache-control "no-cache"
      fi

      if [ -d "$DIST/gifs" ]; then
        echo "› Uploading GIFs…"
        aws s3 sync "$DIST/gifs" "s3://$BUCKET/gifs" --delete \
          --content-type "image/gif" --cache-control "public,max-age=300"
      fi

      echo "› Invalidating CloudFront…"
      aws cloudfront create-invalidation \
        --distribution-id "${aws_cloudfront_distribution.cdn.id}" --paths "/*" >/dev/null
      echo "✓ Published."
    EOT
  }

  depends_on = [aws_s3_bucket_policy.site]
}
