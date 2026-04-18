# BCS Content Management System

A lightweight CMS backend built with Node.js and Express, featuring JWT authentication, SQLite database, and RESTful API.

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Installation

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

## Example: Create a Page

```bash
curl -X POST http://localhost:3000/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "About Us",
    "slug": "about-us",
    "content": "Welcome to our company...",
    "excerpt": "Learn about our company",
    "status": "published"
  }'
```

## Health Endpoints

- `/health` - Liveness probe
- `/ready` - Readiness probe

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Application port |
| `DB_PATH` | `./data/bcs.db` | SQLite database path |
| `JWT_SECRET` | (dev default) | JWT signing secret |
| `LOG_LEVEL` | `info` | Logging verbosity |

## Project Structure

```
bcs/
├── src/
│   ├── db/
│   │   └── database.js      # Database connection
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── models/
│   │   ├── User.js          # User model
│   │   ├── Page.js          # Page model
│   │   └── Media.js         # Media model
│   └── routes/
│       ├── auth.js          # Auth routes
│       ├── pages.js         # Pages routes
│       ├── users.js         # Users routes
│       └── media.js         # Media routes
├── migrations/
│   └── 001_initial_schema.sql
├── scripts/
│   ├── migrate.js           # Migration runner
│   └── ...
├── test/
│   └── server.test.js       # Integration tests
├── server.js                # Express app entry
└── package.json
```

## Testing

```bash
# Run tests
npm test
```

## License

Copyright (c) 2026 ClawTeam Engineering
