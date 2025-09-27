# Polling System Backend

A Node.js/Express backend for a polling system with email-based token authentication.

## Features

- RESTful API for poll management
- Email-based token authentication for voting
- MongoDB with Mongoose ODM
- Rate limiting and security middleware
- Real-time results aggregation

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Email service (Mailtrap for development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

The server will start on port 5000 by default.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/polling-system |
| `ADMIN_SECRET` | Secret key for admin endpoints | - |
| `EMAIL_HOST` | SMTP host for emails | smtp.mailtrap.io |
| `EMAIL_PORT` | SMTP port | 587 |
| `EMAIL_USER` | SMTP username | - |
| `EMAIL_PASS` | SMTP password | - |
| `EMAIL_FROM` | From email address | noreply@pollingsystem.com |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `TOKEN_EXPIRY_HOURS` | Token expiry time | 24 |

## API Endpoints

### System Endpoints

- `GET /health` - Health check
- `GET /api` - API information and endpoints list

### Public Poll Endpoints

- `GET /api/polls` - List all active polls
- `GET /api/polls/:id` - Get poll details with current results
- `GET /api/polls/:id/results` - Get poll results only (polls every 3s from frontend)
- `POST /api/polls/:id/vote` - Cast vote using token

### Token Endpoints (Rate Limited)

- `POST /api/request-token` - Request voting token via email (3 requests/hour per IP)
- `GET /api/request-token/verify/:token` - Verify token validity
- `POST /api/request-token/resend` - Resend existing token

### Admin Endpoints (require `X-Admin-Secret` header)

- `POST /api/admin/polls` - Create new poll
- `GET /api/admin/polls` - List all polls (admin view with pagination)
- `GET /api/admin/polls/:id` - Get specific poll details (admin view)
- `PUT /api/admin/polls/:id` - Update poll (title, description, status, settings)
- `DELETE /api/admin/polls/:id` - Delete poll (or deactivate if has votes)
- `GET /api/admin/polls/:id/audit` - Get vote audit trail
- `GET /api/admin/stats` - Get system statistics

## Request/Response Examples

### Create Poll (Admin)
```bash
curl -X POST http://localhost:3001/api/admin/polls \
  -H "X-Admin-Secret: your-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Favorite Programming Language",
    "description": "Which programming language do you prefer for web development?",
    "options": ["JavaScript", "TypeScript", "Python", "Go", "Rust"]
  }'
```

### Request Voting Token
```bash
curl -X POST http://localhost:3001/api/request-token \
  -H "Content-Type: application/json" \
  -d '{
    "pollId": "60f1b2c3d4e5f6789abcdef0",
    "email": "voter@example.com"
  }'
```

### Cast Vote
```bash
curl -X POST http://localhost:3001/api/polls/60f1b2c3d4e5f6789abcdef0/vote \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "optionId": "option_1640995200000_0"
  }'
```

### Get Poll Results
```bash
curl http://localhost:3001/api/polls/60f1b2c3d4e5f6789abcdef0/results
```

## Database Models

### Poll
- `title` - Poll title
- `description` - Poll description
- `options[]` - Array of poll options
- `isActive` - Whether poll is active
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Token
- `pollId` - Associated poll ID
- `email` - Voter email
- `tokenHash` - Hashed token
- `used` - Whether token has been used
- `expiresAt` - Token expiry time

### Vote
- `pollId` - Associated poll ID
- `optionId` - Selected option ID
- `tokenHash` - Token used for voting
- `ip` - Voter IP address
- `userAgent` - Voter user agent
- `votedAt` - Vote timestamp

## Development

The server includes:
- Hot reload with nodemon
- Request logging
- CORS configuration
- Error handling
- Graceful shutdown

## Security Features

- **Admin Protection**: Admin endpoints protected by secret key in `X-Admin-Secret` header
- **Rate Limiting**: 3 token requests per IP per hour, 2 requests per email per 10 minutes
- **Token Security**: Tokens are SHA-256 hashed before database storage
- **Vote Tracking**: IP addresses and user agents logged for audit trail
- **Input Validation**: Comprehensive validation and sanitization on all inputs
- **CORS**: Configured for frontend origin only
- **Transaction Safety**: MongoDB transactions for vote casting
- **Email Security**: Magic links expire in 24 hours, single-use tokens

## Email Configuration

The system uses NodeMailer for sending voting tokens. For development, configure with Mailtrap:

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=noreply@pollingsystem.com
```

## Rate Limiting

- **Token Requests**: 3 per IP per hour + 2 per email per 10 minutes
- **API Calls**: No rate limiting on poll viewing/voting (only token requests)
- **Admin Actions**: No rate limiting (protected by admin secret)

## Automatic Cleanup

The system includes automatic cleanup tasks:

- **Expired Tokens**: Cleaned every hour
- **Old Unused Tokens**: Removed after 7 days
- **Vote Count Sync**: Poll totals synced with actual vote records
- **Database Health**: Monitored and reported
- **Orphaned Data**: Invalid votes cleaned up automatically