# Roomzy

A room and flatmate discovery platform with AI-powered compatibility scoring, real-time chat, and email notifications.

Live: https://roomzy4u.vercel.app

---

## How It Works

Owners list rooms. Tenants create profiles with their budget, lifestyle traits, and preferences. When a tenant browses listings or flatmates, the system computes a compatibility score using a two-phase approach -- a deterministic rule engine runs instantly, then an AI worker refines the score asynchronously. If two users express mutual interest and the owner accepts, a private chat channel opens between them via WebSocket.

---

## Architecture

```
roomzy-backend/
  src/
    app.js                     # Express + HTTP server + Socket.io binding
    modules/
      identity/                # Auth (register/login with OTP), profile management
      inventory/               # Room listings CRUD, photo uploads
      search/                  # Discovery engine (rooms + flatmates)
      matching/                # Compatibility scoring (rule engine + AI)
      interaction/             # Interest requests (send/accept/decline)
      messaging/               # Real-time chat via Socket.io
      notification/            # Email notification worker service
    shared/
      config/                  # Environment config
      middlewares/              # Auth, rate limiting, error handling, logging
      providers/               # Gemini (LLM), Resend (email), Cloudinary (CDN)
      infrastructure/queue/    # RabbitMQ publisher + connection manager
    workers/
      ai.worker.js             # Consumes AI queue, finalizes compatibility scores
      email.worker.js          # Consumes notification queue, sends emails via Resend

roomzy-frontend/
  src/
    pages/
      auth/                    # Login, Register
      tenant/                  # Profile setup, search feed
      owner/                   # Dashboard, create listing, manage photos
      shared/                  # Home, inbox, chat, 404
    store/                     # Redux Toolkit slices
    context/                   # Socket.io context provider
```

The backend follows a domain-oriented monolith pattern. Each module owns its own API layer, application logic, domain rules, and database models. Modules communicate through the shared infrastructure (RabbitMQ queues) rather than direct imports.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS v4, Redux Toolkit, React Router v7 |
| Backend | Express 5, Node.js (ESM) |
| Database | MongoDB Atlas (Mongoose ODM) |
| Real-time | Socket.io |
| Message Queue | RabbitMQ (CloudAMQP) |
| AI | Google Gemini 2.5 Flash |
| Email | Resend |
| Media | Cloudinary |
| Auth | JWT + bcrypt, email OTP verification |
| Validation | Zod |

---

## Compatibility Scoring

The scoring system has two phases and is entirely non-blocking for the user.

**Phase 1 -- Rule Engine (instant, synchronous)**

When a tenant views a listing or flatmate, the `RuleEngine` calculates a deterministic base score:
- For rooms: starts at 70, penalizes for budget overshoot (2 points per 1000 over max) and distant availability dates
- For flatmates: scores budget overlap (30 pts), cleanliness match (15 pts), schedule match (15 pts), sociability match (10 pts)

This score is saved to the database as `PROVISIONAL` and returned immediately to the frontend.

**Phase 2 -- AI Refinement (async, via RabbitMQ)**

A message is published to the `ai_scoring_queue`. The AI worker picks it up, calls Gemini 2.5 Flash with a structured prompt, and computes a lifestyle/spatial fit score. The final score is a weighted hybrid:

```
finalScore = (ruleScore * 0.70) + (aiScore * 0.30)
```

The record is updated to `FINALIZED` with the combined score, explanation, model metadata, and latency.

**Fallback handling**: If Gemini is unavailable, the provider returns a neutral score of 50 with `isFallback: true` and `confidence: 0.0`. The pipeline never breaks.

### LLM Prompt (Room Fit)

```
You are a real estate compatibility analyzer. Evaluate how well a tenant's
lifestyle fits a specific property. DO NOT evaluate budget or location.
Focus on amenities, space, and lifestyle fit.

Tenant Profile:
- Schedule: EARLY_BIRD
- Sociability: INTROVERTED
- Pet Friendly: true
- Bio: "Quiet person, work from home"

Property Listing:
- Type: PRIVATE_ROOM
- Amenities: WiFi, AC, Parking
- Description: "Spacious room in a gated community"

Return ONLY a valid JSON object with exact keys:
{ "aiScore": <number 0-100>, "reason": "<2-sentence explanation>", "confidence": <0.0-1.0> }
```

**Example output:**

```json
{
  "aiScore": 82,
  "reason": "The private room with WiFi suits a remote worker who values quiet. Parking and gated community add convenience for an introverted lifestyle.",
  "confidence": 0.85
}
```

---

## Real-time Chat

Built on Socket.io, bound to the same HTTP server as Express.

1. On connection, the server authenticates the JWT from `socket.handshake.auth.token`
2. The server queries all `ACCEPTED` interactions for that user and auto-joins them to rooms named `chat_{interactionId}`
3. On `send_message`, the `MessageService` validates the message, writes it to MongoDB, then broadcasts via `io.to(room).emit('new_message', ...)`
4. The sender gets an acknowledgment callback; all participants (including other devices) receive the broadcast
5. Chat history is loaded via REST: `GET /api/messaging/history/:interactionId`

Chat is only available after an interest request is accepted. There is no way to message someone without going through the interaction flow.

---

## Notification Flow

All side effects (AI scoring, emails) are decoupled from the request cycle using RabbitMQ.

```
User Action --> API Handler --> Publish to Queue --> Worker Processes Async
```

**When notifications are sent:**

- Owner receives an email when a tenant with a compatibility score above 80 sends an interest request
- Tenant receives an email when an owner accepts or declines their request
- OTP emails are sent during registration for email verification

The email worker (`email.worker.js`) consumes from `notification_queue`, processes each payload through `NotificationWorkerService`, and sends via Resend's HTTP API. Failed messages are negatively acknowledged without requeue to prevent infinite loops.

---

## Database Schema

Six collections, each owned by a single module:

**User** -- `email`, `passwordHash`, `role` (TENANT | OWNER | ADMIN), timestamps

**OtpRecord** -- `email`, `otp`, `createdAt` (TTL index, auto-deletes after 5 minutes)

**FlatmateProfile** -- `userId` (ref User, unique), `fullName`, `bio`, `profilePicture`, `budget` { min, max }, `lifestyleTraits` { cleanliness, schedule, sociability, petFriendly }

**Listing** -- `ownerId` (ref User), `title`, `description`, `location` { city, neighborhood, coordinates (2dsphere) }, `rent`, `availableFrom`, `roomType` (ENTIRE_PROPERTY | PRIVATE_ROOM | SHARED_ROOM), `amenities[]`, `photos[]`, `status` (DRAFT | PUBLISHED | FILLED | ARCHIVED)

**MatchScore** -- `tenantId` (ref User), `targetId`, `targetType` (ROOM | FLATMATE), `score` (0-100), `reason`, `status` (PROVISIONAL | FINALIZED), `provider`, `algorithmVersion`, `latencyMs`, `confidence`, `isFallback`. Compound unique index on (tenantId, targetId, targetType).

**Interaction** -- `initiatorId` (ref User), `targetId`, `receiverId` (ref User), `type` (ROOM | FLATMATE), `status` (PENDING | ACCEPTED | DECLINED), `message`

**Message** -- `interactionId` (ref Interaction), `senderId` (ref User), `content`, `isRead`

---

## API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <jwt>`.

### Identity

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/identity/register` | No | Register with email, password, role. Sends OTP. |
| POST | `/identity/login` | No | Login, returns JWT |
| GET | `/identity/profile` | Yes | Get current user's flatmate profile |
| POST | `/identity/profile` | Yes | Create or update flatmate profile |
| POST | `/identity/profile/picture` | Yes | Upload profile picture (multipart) |

### Inventory (Owner only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/inventory/listings` | Owner | Create a listing |
| GET | `/inventory/listings/me` | Owner | Get all listings by current owner |
| PATCH | `/inventory/listings/:id/status` | Owner | Update status (PUBLISHED, FILLED, etc.) |
| DELETE | `/inventory/listings/:id` | Owner | Delete a listing |
| POST | `/inventory/listings/:id/photos` | Owner | Upload photos (multipart, max 5) |

### Search (Tenant only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search/rooms` | Tenant | Search rooms with filters (city, budget) |
| GET | `/search/flatmates` | Tenant | Search flatmate profiles |

### Matching (Tenant only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/matching/score/:targetId?targetType=ROOM` | Tenant | Get compatibility score for a target |

### Interactions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/interactions/request` | Yes | Send interest request |
| PATCH | `/interactions/:id/respond` | Yes | Accept or decline a request |
| GET | `/interactions/inbox` | Yes | Get all interactions for current user |

### Messaging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messaging/history/:interactionId` | Yes | Get chat history for an interaction |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `send_message` | Client --> Server | `{ interactionId, content }` |
| `new_message` | Server --> Client | Saved message object |
| `join_room` | Client --> Server | `interactionId` |

---

## Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- CloudAMQP account (free tier works)
- Google AI Studio API key
- Resend account
- Cloudinary account

### Environment Variables

Create `roomzy-backend/.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

JWT_SECRET=your_jwt_secret

MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/roomzyDB

RABBITMQ_URI=amqps://<user>:<pass>@<host>/<vhost>

AI_PROVIDER_KEY=your_gemini_api_key

RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=Roomzy <onboarding@resend.dev>

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create `roomzy-frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-url.com
```

### Running Locally

```bash
# Backend
cd roomzy-backend
npm install
npm run dev:api             # starts Express + Socket.io on port 5000
npm run dev:worker:ai       # starts AI scoring worker (separate terminal)
npm run dev:worker:email    # starts email notification worker (separate terminal)

# Frontend
cd roomzy-frontend
npm install
npm run dev                 # starts Vite dev server on port 5173
```

### Deployment

- Frontend is deployed on Vercel with `vercel.json` handling SPA routing
- Backend (API + workers) can be deployed on Render or Railway as separate services

---

## Role-based Access

| Role | Capabilities |
|------|-------------|
| Tenant | Create profile, search rooms/flatmates, view scores, send interest, chat |
| Owner | Create/manage listings, upload photos, accept/decline interest, chat |
| Admin | Manage users, listings, and view platform activity |

---

## License

MIT
