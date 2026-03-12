#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="zaaby-483422"
REGION="us-central1"
SERVICE_NAME="pitchpilot-backend"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
ENV_FILE="backend/.env"

# Load env vars from backend/.env
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Copy backend/.env.example to backend/.env and fill in values."
  exit 1
fi

# Build env var flags from .env (skip empty values and comments)
ENV_FLAGS=""
while IFS= read -r line; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  [[ -z "$value" ]] && continue
  [[ "$key" == "PORT" ]] && continue  # Cloud Run sets PORT automatically
  ENV_FLAGS="${ENV_FLAGS}${key}=${value},"
done < "$ENV_FILE"
ENV_FLAGS="${ENV_FLAGS%,}"  # strip trailing comma

echo "Building and pushing Docker image (linux/amd64): ${IMAGE}"
docker buildx build --platform linux/amd64 -t "${IMAGE}" --push backend/

echo "Deploying to Cloud Run"
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --port 8080 \
  --set-env-vars "${ENV_FLAGS}"

echo ""
echo "Deploy complete. Service URL:"
gcloud run services describe "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format "value(status.url)"
