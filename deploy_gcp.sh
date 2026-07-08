#!/bin/bash
set -e

# Project configuration
PROJECT_ID="kissanproject-415814" # Will default to active project in Cloud Shell
REGION="us-central1"

echo "=== 1. Setting active Google Cloud Project ==="
# Get active project ID from gcloud configuration if not hardcoded
ACTIVE_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ ! -z "$ACTIVE_PROJECT" ]; then
    PROJECT_ID=$ACTIVE_PROJECT
fi
echo "Deploying to Project ID: $PROJECT_ID in Region: $REGION"

echo "=== 2. Enabling GCP Services (Cloud Build, Cloud Run, Artifact Registry) ==="
gcloud services enable artifactregistry.googleapis.com \
                       cloudbuild.googleapis.com \
                       run.googleapis.com \
                       --project=$PROJECT_ID

echo "=== 3. Creating Artifact Registry Repository ==="
gcloud artifacts repositories create kisan-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="KisanVriddhi Docker Repository" \
    --project=$PROJECT_ID || echo "Repository already exists, continuing..."

echo "=== 4. Building and Deploying Backend to Cloud Run ==="
gcloud builds submit ./backend \
    --tag=$REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/backend:latest \
    --project=$PROJECT_ID

# Deploy backend serverlessly. Allow unauthenticated requests for public APIs.
# SQLite database is kept local inside container (/app/data/kisan_alert.db)
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

echo "=== 5. Building and Deploying Frontend to Cloud Run ==="
# Build frontend container with Cloud Build, injecting the BACKEND_URL
gcloud builds submit ./frontend \
    --tag=$REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/frontend:latest \
    --build-arg="VITE_API_URL=$BACKEND_URL" \
    --project=$PROJECT_ID

# Deploy frontend serverlessly
gcloud run deploy frontend \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/kisan-repo/frontend:latest \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --project=$PROJECT_ID

# Fetch frontend Cloud Run service URL
FRONTEND_URL=$(gcloud run services describe frontend --platform=managed --region=$REGION --format="value(status.url)" --project=$PROJECT_ID)

echo "========================================================="
echo " KisanVriddhi Cloud Run Deployment Complete! "
echo "========================================================="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo "========================================================="
echo "Note: Make sure to update the GEMINI_API_KEY variable in your backend Cloud Run service configuration console if needed."
