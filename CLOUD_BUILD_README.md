# Cloud Build Configuration for 247-Workforce-Sim

This repository contains Cloud Build configurations for deploying the 247-Workforce-Sim application to Google Cloud Run.

## Files

- `cloudbuild.yml` - Staging environment configuration
- `cloudbuild.prod.yml` - Production environment configuration

## Overview

The Cloud Build configurations follow a similar pattern to your existing `cloudbuild.stg.yml` example but are adapted for this Next.js/Bun application. They include:

1. **Docker Build Step**: Builds the application using the existing `docker/app.Dockerfile`
2. **Docker Push Step**: Pushes the built image to Google Container Registry
3. **Cloud Run Deploy Step**: Deploys the application to Cloud Run
4. **Traffic Routing Step**: Routes 100% traffic to the latest revision

## Key Differences from Your Example

### Application-Specific Changes
- Uses `./docker/app.Dockerfile` instead of `./Dockerfile.stg`
- Targets the `247-workforce-sim` application instead of `central-console`
- Includes all environment variables from `apps/sim/lib/env.ts`

### Environment Variables
The configurations include all environment variables defined in your application:

**Server Variables:**
- Database and authentication: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, etc.
- Payment processing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.
- AI/ML services: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY_1`, `MISTRAL_API_KEY`, etc.
- Storage: AWS S3 and Azure Blob Storage configurations
- OAuth providers: Google, GitHub, Discord, Notion, etc.
- Monitoring: Sentry configuration
- Whitelabel settings: Custom branding and configuration options

**Client Variables:**
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`, etc.

## Usage

### Staging Deployment
```bash
gcloud builds submit --config cloudbuild.yml .
```

### Production Deployment
```bash
gcloud builds submit --config cloudbuild.prod.yml .
```

## Configuration Details

### Staging Environment (`cloudbuild.yml`)
- **Service Name**: `stg-247-workforce-sim`
- **Repository**: `asia-south1-docker.pkg.dev/pulse-energy-stg/247-workforce-sim/247-workforce-sim`
- **Resources**: 2 CPU, 2Gi memory
- **Scaling**: 0-10 instances
- **Authentication**: Requires authentication

### Production Environment (`cloudbuild.prod.yml`)
- **Service Name**: `prod-247-workforce-sim`
- **Repository**: `asia-south1-docker.pkg.dev/pulse-energy-prod/247-workforce-sim/247-workforce-sim`
- **Resources**: 4 CPU, 4Gi memory
- **Scaling**: 1-50 instances (minimum 1 for production)
- **Authentication**: Public access (`--allow-unauthenticated`)

## Prerequisites

1. **Google Cloud Project Setup**:
   - Ensure you have the necessary permissions
   - Set up the service account: `508073074780@cloudbuild.gserviceaccount.com`
   - Configure the GITHUB_TOKEN secret in Secret Manager

2. **Environment Variables**:
   - Set up all required environment variables in your Cloud Build trigger
   - Ensure sensitive values are stored in Secret Manager

3. **Docker Registry**:
   - Ensure the Container Registry repositories exist:
     - `asia-south1-docker.pkg.dev/pulse-energy-stg/247-workforce-sim`
     - `asia-south1-docker.pkg.dev/pulse-energy-prod/247-workforce-sim`

## Customization

### Adding New Environment Variables
1. Add the variable to `apps/sim/lib/env.ts`
2. Add the corresponding `--build-arg` in the Docker build step
3. Set the variable value in your Cloud Build trigger

### Modifying Resource Allocation
Update the Cloud Run deployment step with different values:
- `--memory`: Memory allocation (e.g., `2Gi`, `4Gi`)
- `--cpu`: CPU allocation (e.g., `2`, `4`)
- `--max-instances`: Maximum number of instances
- `--min-instances`: Minimum number of instances

### Changing Regions
Update the `--region` parameter in both the deploy and traffic routing steps.

## Troubleshooting

### Common Issues
1. **Build Failures**: Check that all required environment variables are set
2. **Deployment Failures**: Verify the service account has necessary permissions
3. **Image Push Failures**: Ensure the Container Registry repository exists

### Logs
- Cloud Build logs are available in the Google Cloud Console
- Cloud Run logs can be viewed with: `gcloud logs read --service=stg-247-workforce-sim`

## Security Notes

- The `GITHUB_TOKEN` is managed through Secret Manager
- Production environment allows unauthenticated access (public)
- Staging environment requires authentication
- All sensitive environment variables should be stored in Secret Manager

## Next Steps

1. Set up Cloud Build triggers in the Google Cloud Console
2. Configure environment variables for each environment
3. Test the staging deployment first
4. Set up monitoring and alerting for the deployed services 