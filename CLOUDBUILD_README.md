# Cloud Build Staging Deployment Guide

This guide explains how to use the `cloudbuild.stg.yaml` file to deploy your application to Google Cloud Platform.

## Overview

The Cloud Build configuration deploys the main application service:
- **Main Application** (`sim-app-stg`) - Your Next.js application

## Prerequisites

1. **Google Cloud Project**: Ensure you have a GCP project set up
2. **Required APIs**: Enable the following APIs in your project:
   - Cloud Build API
   - Cloud Run API
   - Container Registry API
   - Cloud Logging API

3. **Service Account**: Create a service account with the following roles:
   - Cloud Build Service Account
   - Cloud Run Admin
   - Storage Admin
   - Logs Writer

## Configuration

### 1. Environment Variables

The `substitutions` section in `cloudbuild.stg.yaml` contains placeholder values. You need to set the actual values in the Cloud Build trigger configuration:

```yaml
substitutions:
  _DATABASE_URL: 'your-database-url-here'
  _BETTER_AUTH_SECRET: 'your-better-auth-secret-here'
  _BETTER_AUTH_URL: 'https://sim-app-stg-${_COMMIT_SHA}-uc.a.run.app'
  _NEXT_PUBLIC_APP_URL: 'https://sim-app-stg-${_COMMIT_SHA}-uc.a.run.app'
  _ENCRYPTION_KEY: 'your-encryption-key-here'
```

**Set these values in Cloud Build Trigger:**
- `_DATABASE_URL`: `postgresql://pc_master:EnergyAWS2021@stg-pcdb-generic-master.pulseenergy.io:5432/pulse-247-workspace-sim-stg`
- `_BETTER_AUTH_SECRET`: `95bd70e8bcaa6cded17f4df5884138585ab02044873d572d8ba3b4f2ad7bda3c`
- `_ENCRYPTION_KEY`: `8b2e3ef046e30f5461ede43962682dcfd218c3f705e91d3ed5e29eb613a76fa5`

### 2. Secrets Management

For production, use Google Secret Manager instead of hardcoding secrets:

```bash
# Create secrets
echo -n "your-nextauth-secret" | gcloud secrets create nextauth-secret --data-file=-
echo -n "your-postgres-password" | gcloud secrets create postgres-password --data-file=-
```

Then update the Cloud Build configuration to use secrets:

```yaml
- '--update-env-vars'
- 'NEXTAUTH_SECRET=projects/$PROJECT_ID/secrets/nextauth-secret/versions/latest'
```

## Deployment

### Setting up Cloud Build Trigger

1. **Go to Cloud Build Triggers** in Google Cloud Console
2. **Create a new trigger** with these settings:
   - **Name**: `sim-staging-deploy`
   - **Description**: `Deploy sim app to staging`
   - **Event**: `Push to a branch`
   - **Repository**: Your GitHub repository
   - **Branch**: `staging` (or your preferred branch)
   - **Cloud Build configuration file**: `cloudbuild.stg.yaml`

3. **Add Substitution Variables** in the trigger:
   ```
   _DATABASE_URL = postgresql://pc_master:EnergyAWS2021@stg-pcdb-generic-master.pulseenergy.io:5432/pulse-247-workspace-sim-stg
   _BETTER_AUTH_SECRET = 95bd70e8bcaa6cded17f4df5884138585ab02044873d572d8ba3b4f2ad7bda3c
   _ENCRYPTION_KEY = 8b2e3ef046e30f5461ede43962682dcfd218c3f705e91d3ed5e29eb613a76fa5
   ```

### Manual Deployment

```bash
# Deploy to staging
gcloud builds submit --config cloudbuild.stg.yaml

# Deploy with custom substitutions
gcloud builds submit --config cloudbuild.stg.yaml \
  --substitutions=_DATABASE_URL="your-db-url",_BETTER_AUTH_SECRET="your-secret"
```

### Automated Deployment (GitHub Actions)

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Google Cloud CLI
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          
      - name: Deploy to Staging
        run: |
          gcloud builds submit --config cloudbuild.stg.yaml
```

## Service URLs

After deployment, your service will be available at:

- **Main App**: `https://sim-app-stg-{commit-sha}-uc.a.run.app`

## Monitoring

### View Logs

```bash
# Main application logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=sim-app-stg"
```

### View Service Status

```bash
# List all Cloud Run services
gcloud run services list --region=us-central1

# Get service details
gcloud run services describe sim-app-stg --region=us-central1
```

## Scaling Configuration

The current configuration includes:

- **Main App**: 2 CPU, 2GB RAM, 1-10 instances

Adjust these values based on your traffic patterns and requirements.

## Cost Optimization

1. **Use Cloud SQL** for database instead of containerized database
2. **Enable autoscaling** with appropriate min/max instances
3. **Use Cloud Memorystore** for Redis instead of containerized Redis
4. **Monitor costs** with Cloud Billing alerts

## Troubleshooting

### Common Issues

1. **Build fails**: Check Dockerfile syntax and dependencies
2. **Deployment fails**: Verify service account permissions
3. **App doesn't start**: Check environment variables and database connectivity
4. **Socket connection fails**: Verify CORS settings and WebSocket URL

### Debug Commands

```bash
# Check build logs
gcloud builds log [BUILD_ID]

# Check service logs
gcloud run services logs read sim-app-stg --region=us-central1

# Test service connectivity
curl https://sim-app-stg-{commit-sha}-uc.a.run.app/health
```

## Security Considerations

1. **Use Secret Manager** for sensitive environment variables
2. **Enable VPC Connector** for private database access
3. **Set up IAM** with least privilege principle
4. **Enable Cloud Armor** for DDoS protection
5. **Use HTTPS** for all external communications

## Next Steps

1. Create a production version (`cloudbuild.prod.yaml`)
2. Set up monitoring and alerting
3. Configure custom domains
4. Implement blue-green deployments
5. Set up automated testing in the pipeline 