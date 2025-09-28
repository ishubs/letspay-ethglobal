# Environment Configuration

This project uses environment variables to configure API endpoints. Create a `.env.local` file in the client directory with the following variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
```

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for the main API server (default: http://localhost:3000)

## Production Configuration

For production deployment, update these URLs to point to your deployed services:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Verification

User verification is handled entirely through Self Protocol integration and localStorage. No external verification service is required.

