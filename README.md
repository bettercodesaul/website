# BCS Content Management System

A lightweight CMS backend built with Node.js and Express, featuring JWT authentication, SQLite database, and RESTful API.

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Docker & Docker Compose (for containerized deployment)

### Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run database migrations
npm run migrate

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

### Docker Deployment

```bash
# Build and run
docker compose up --build

# Or use the deploy script
./scripts/deploy.sh staging
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Pages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/pages` | List all pages | - |
| GET | `/api/pages/:id` | Get page by ID | - |
| GET | `/api/pages/slug/:slug` | Get page by slug | - |
| POST | `/api/pages` | Create page | Admin/Editor |
| PUT | `/api/pages/:id` | Update page | Admin/Editor |
| DELETE | `/api/pages/:id` | Delete page | Admin |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get current user | Required |
| PUT | `/api/users/me` | Update current user | Required |
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Media

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/media` | List all media | Required |
| GET | `/api/media/:id` | Get media by ID | Required |
| POST | `/api/media/upload` | Upload file | Admin/Editor |
| DELETE | `/api/media/:id` | Delete media | Admin |

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Get a token by registering or logging in:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password","name":"Admin"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## Deployment

### Staging Deployment

```bash
./scripts/deploy.sh staging
```

### Production Deployment

```bash
./scripts/deploy.sh production
```

### Rollback

```bash
# Rollback to previous version
./scripts/rollback.sh previous

# Rollback to specific version
./scripts/rollback.sh v1.2.3
```

### Health Check

```bash
./scripts/healthcheck.sh
```

## CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | Push to main/develop, PRs | Lint, test, build, deploy |
| `release.yml` | Version tags (v*) | Create release and push image |
| `security.yml` | Push, weekly schedule | Security scanning |

### Environments

- **Staging**: Auto-deployed from `develop` branch
- **Production**: Auto-deployed from `main` branch

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Application port |
| `DB_PATH` | `./data/bcs.db` | SQLite database path |
| `JWT_SECRET` | (required) | JWT signing secret (min 32 chars) |
| `LOG_LEVEL` | `info` | Logging verbosity |

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| `app` | 3000 | Main application with SQLite |

### Volumes

| Volume | Purpose |
|--------|---------|
| `bcs-data` | SQLite database persistence |
| `bcs-uploads` | Uploaded media files |

## Health Endpoints

- `/health` - Liveness probe
- `/ready` - Readiness probe

## Testing

```bash
# Run tests
npm test
```

## Security

- Container runs as non-root user
- Security scanning in CI pipeline (Trivy, CodeQL, npm audit)
- JWT authentication for protected endpoints
- SQLite database with file-based persistence

## Troubleshooting

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up --build
```

### Build Issues

```bash
# Clean build cache
docker builder prune

# Rebuild from scratch
docker compose build --no-cache
```

### Deployment Issues

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f app

# Restart services
docker compose restart
```

## License

Copyright (c) 2026 ClawTeam Engineering
