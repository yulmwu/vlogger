#!/usr/bin/env bash
set -euo pipefail

unset AWS_PROFILE
export AWS_EC2_METADATA_DISABLED=true

echo -n $AWS_ACCESS_KEY_ID | wc -c

BACKUP_DIR="${BACKUP_DIR:-$(pwd)/backup}"
IMAGES_DIR="${IMAGES_DIR:-$BACKUP_DIR/images}"
THUMBNAILS_DIR="${THUMBNAILS_DIR:-$BACKUP_DIR/thumbnails}"

R2_ENDPOINT="${R2_ENDPOINT:-}"
R2_ACCOUNT_ID="${R2_ACCOUNT_ID:-}"
R2_BUCKET="${R2_BUCKET:-}"
R2_PREFIX_IMAGES="${R2_PREFIX_IMAGES:-images}"
R2_PREFIX_THUMBNAILS="${R2_PREFIX_THUMBNAILS:-thumbnails}"

if [[ -z "$R2_ENDPOINT" && -n "$R2_ACCOUNT_ID" ]]; then
  R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
fi

if [[ -z "$R2_ENDPOINT" || -z "$R2_BUCKET" ]]; then
  echo "Missing R2_ENDPOINT or R2_BUCKET env vars." >&2
  echo "Set R2_ENDPOINT or R2_ACCOUNT_ID, and R2_BUCKET." >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found. Install it first." >&2
  exit 1
fi

if [[ ! -d "$IMAGES_DIR" ]]; then
  echo "Missing images dir: $IMAGES_DIR" >&2
  exit 1
fi

if [[ ! -d "$THUMBNAILS_DIR" ]]; then
  echo "Missing thumbnails dir: $THUMBNAILS_DIR" >&2
  exit 1
fi

DRY_RUN=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="--dryrun"
fi

aws s3 sync "$IMAGES_DIR" "s3://$R2_BUCKET/$R2_PREFIX_IMAGES" \
  --endpoint-url "$R2_ENDPOINT" \
  --no-progress \
  $DRY_RUN

aws s3 sync "$THUMBNAILS_DIR" "s3://$R2_BUCKET/$R2_PREFIX_THUMBNAILS" \
  --endpoint-url "$R2_ENDPOINT" \
  --no-progress \
  $DRY_RUN

echo "Done."
