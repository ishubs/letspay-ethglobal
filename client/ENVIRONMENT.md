# Environment Configuration

This project uses environment variables to configure API endpoints. Create a `.env.local` file in the client directory with the following variables:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_VERIFICATION_BASE_URL=http://localhost:4000
```

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for the main API server (default: http://localhost:3000)
- `VITE_VERIFICATION_BASE_URL`: Base URL for the verification service (default: http://localhost:4000)

## Production Configuration

For production deployment, update these URLs to point to your deployed services:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_VERIFICATION_BASE_URL=https://verification.yourdomain.com
```

