#!/bin/bash
set -e

# Project configuration
PROJECT_ID="kisanvriddhi"
REGION="us-central1"

echo "=== 1. Setting active Google Cloud Project ==="
ACTIVE_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ ! -z "$ACTIVE_PROJECT" ]; then
    PROJECT_ID=$ACTIVE_PROJECT
fi
echo "Deploying to Project ID: $PROJECT_ID in Region: $REGION"

echo "=== 2. Enabling GCP Services (Artifact Registry, Cloud Run) ==="
gcloud services enable artifactregistry.googleapis.com \
                       run.googleapis.com \
                       --project=$PROJECT_ID

echo "=== 3. Creating Artifact Registry Repository ==="
gcloud artifacts repositories create kisan-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="KisanVriddhi Docker Repository" \
    --project=$PROJECT_ID || echo "Repository already exists, continuing..."

echo "=== 4. Configuring Docker Credentials Helper ==="
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

echo "=== 5. Building and Pushing Backend Locally ==="
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/backend:latest ./backend
docker push $REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/backend:latest

echo "=== 6. Deploying Backend to Cloud Run ==="
gcloud run deploy backend \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/backend:latest \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --project=$PROJECT_ID \
    --set-env-vars="GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE"

# Fetch backend Cloud Run service URL
BACKEND_URL=$(gcloud run services describe backend --platform=managed --region=$REGION --format="value(status.url)" --project=$PROJECT_ID)
echo "Backend deployed successfully at: $BACKEND_URL"

echo "=== 7. Building and Pushing Frontend Locally ==="
# Build frontend container locally in Cloud Shell, injecting the BACKEND_URL
docker build --build-arg="VITE_API_URL=$BACKEND_URL" -t $REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/frontend:latest ./frontend
docker push $REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/frontend:latest

echo "=== 8. Deploying Frontend to Cloud Run ==="
gcloud run deploy frontend \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/frontend:latest \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --project=$PROJECT_ID

# Fetch frontend Cloud Run service URL
FRONTEND_URL=$(gcloud run services describe frontend --platform=managed --region=$REGION --format="value(status.url)" --project=$PROJECT_ID)

echo "========================================================="
echo " KisanVriddhi Cloud Run Local-Build Deployment Complete! "
echo "========================================================="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo "========================================================="
