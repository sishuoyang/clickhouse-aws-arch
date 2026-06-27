# Terraform deploy — CloudFront + custom domain

Provisions the production hosting for DiagramHouse and publishes the built site:

- **Private S3 bucket** (no public access) as the origin
- **CloudFront** distribution with **Origin Access Control** (only CloudFront can read the bucket)
- **ACM certificate** for `diagrams.housemate.click`, **DNS-validated** in your Route 53 zone
- **Route 53** `A`/`AAAA` alias records pointing the domain at CloudFront
- A Terraform-driven **content sync** (`dist/` → S3 with per-type cache headers) + **CloudFront invalidation**

This replaces the simpler public-S3-website `deploy-aws.sh` for the custom-domain setup.

## Prerequisites

```bash
aws sso login --profile sa        # the profile Terraform/CLI use (var.aws_profile)
./build-static.sh                 # build dist/ (app + /__layout + /gifs) BEFORE applying
```

## Deploy

```bash
cd terraform
terraform init
terraform apply
```

The first apply takes a few minutes (ACM validation via Route 53, then the CloudFront distribution
deploying). It outputs the live URL, the CloudFront domain, and the distribution ID.

## Redeploy after changes

```bash
./build-static.sh                 # rebuild app + refresh /gifs and /__layout
cd terraform && terraform apply    # re-syncs dist/ and invalidates the CDN (only when dist changed)
```

The `null_resource.publish` step re-runs whenever any file under `dist/` changes, uploading with the
right cache headers (hashed assets immutable; `index.html`, layouts, and GIFs revalidate) and issuing
a `/*` invalidation.

## Variables (defaults in `variables.tf`)

| Variable | Default | Notes |
|---|---|---|
| `domain_name` | `diagrams.housemate.click` | Served by CloudFront |
| `hosted_zone_id` | `Z061826531GW1HJ8NRB9R` | Your public Route 53 zone |
| `bucket_name` | `diagrams-housemate-click` | Private origin bucket (globally unique) |
| `aws_region` | `ap-southeast-1` | Bucket region (ACM is always us-east-1) |
| `aws_profile` | `sa` | AWS CLI/SDK profile |
| `price_class` | `PriceClass_200` | Includes Asia edge locations |

Override per run, e.g. `terraform apply -var bucket_name=my-bucket`.

## Notes

- The ACM cert is created in **us-east-1** (required by CloudFront) via a second provider alias; the
  bucket lives in `aws_region`.
- DNS validation requires that this hosted zone is the **authoritative** zone for the domain (its NS
  records are live at the registrar).
- `terraform destroy` removes the distribution, cert, DNS records, and bucket. Empty the bucket first
  if `destroy` complains about a non-empty bucket.
- The older public-website bucket from `deploy-aws.sh` (e.g. `ch-diagrams`) can be deleted once this
  is live.
