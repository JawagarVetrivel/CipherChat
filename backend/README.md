# CipherChat Backend

A secure, zero-knowledge "dumb pipe" backend for **CipherChat**, designed for university cryptography research and high-assurance messaging applications.

---

## Core Security & Cryptographic Invariants

1. **Zero-Knowledge Dumb Pipe**: The server receives, validates metadata for, stores, and relays strictly **opaque ciphertext** envelopes and ratchet headers. The backend **never** decrypts, encrypts, parses, or logs user message plaintext.
2. **Zero Private Keys**: The backend stores **only public keys** in `public_keys` (identity keys, signed pre-keys, one-time pre-keys) for future client-side Extended Triple Diffie-Hellman (X3DH) and Double Ratchet handshakes. Private keys are **strictly client-side** and are never transmitted to the server.
3. **Directory Privacy**: Email addresses are private to authenticated users and are **never** returned in user searches or group member rosters. Users are discovered exclusively by `@username` or display name.

---

## Tech Stack

- **Runtime**: Node.js & TypeScript
- **Web Framework**: Express.js
- **Real-Time Communication**: WebSockets (`ws`)
- **Database**: Supabase PostgreSQL
- **Security**: Helmet, CORS, Rate Limiting, bcrypt, JWT, Zod validation
- **Deployment**: Render Web Service

---

## Database Architecture (Supabase PostgreSQL)

The database schema is fully normalized and located in [`database/schema.sql`](database/schema.sql) and [`migrations/001_initial_schema.sql`](migrations/001_initial_schema.sql).

### Normalized Tables

| Table Name | Description | Key Columns |
|---|---|---|
| `users` | User credentials & public profile | `id` (UUID PK), `username` (UNIQUE), `display_name`, `email` (UNIQUE), `password_hash`, `status`, `last_seen`, `public_key_fingerprint` |
| `conversations` | 1-to-1 direct chats and multi-user groups | `id` (UUID PK), `type` ('direct' \| 'group'), `name`, `description`, `created_by`, `updated_at` |
| `conversation_members` | Normalizes membership & unread counts | `id` (UUID PK), `conversation_id` (FK), `user_id` (FK), `role` ('admin' \| 'member'), `unread_count` |
| `messages` | Opaque ciphertext message storage | `id` (UUID PK), `conversation_id` (FK), `sender_id` (FK), `ciphertext` (TEXT), `header` (JSONB), `delivery_status`, `timestamp` |
| `public_keys` | Public keys for X3DH handshakes | `id` (UUID PK), `user_id` (FK), `key_type`, `public_key`, `is_active`, `expires_at` |
| `sessions` | Active user sessions & token tracking | `id` (UUID PK), `user_id` (FK), `token_hash`, `expires_at` |

---

## REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: Create account.
  ```json
  // Request
  { "email": "user@university.edu", "username": "jawagar", "displayName": "Jawagar S", "password": "password123" }
  // Response (201 Created)
  { "user": { "id": "...", "username": "jawagar", "displayName": "Jawagar S", "email": "user@university.edu", ... }, "token": "..." }
  ```
- `POST /api/auth/login`: Authenticate existing user.
  ```json
  // Request
  { "email": "rahul@university.edu", "password": "password123" }
  // Response (200 OK)
  { "user": { "id": "...", "username": "rahul123", ... }, "token": "..." }
  ```
- `GET /api/auth/me`: Validate session and retrieve authenticated profile.

### 2. User Directory & Profile (`/api/users`)
- `GET /api/users/search?q=<query>`: Search directory by `@username` or display name.
  - **Privacy Guarantee**: `email` is **never** included in search results.
- `GET /api/users/:id`: Lookup user profile by UUID (excluding email).
- `GET /api/users/username/:username`: Lookup user by username.
- `PATCH /api/users/profile`: Update display name, avatar, or public key fingerprint.
- `GET /api/users/:id/keys`: Fetch public keys for X3DH session initiation.

### 3. Conversations (`/api/conversations`)
- `GET /api/conversations`: List conversations for caller (sorted by `updatedAt` desc).
- `GET /api/conversations/:id`: Retrieve details for specific conversation (membership verified).
- `POST /api/conversations/direct`: Create or get 1-to-1 conversation (`{ "participantId": "..." }`).
- `POST /api/conversations/group`: Create new group (`{ "name": "...", "description": "...", "memberIds": [...] }`).
- `POST /api/conversations/:id/members`: Add members (`{ "memberIds": [...] }`).
- `DELETE /api/conversations/:id/members/:userId`: Remove member (Admin only, or self-leave).
- `PATCH /api/conversations/:id`: Update group name (`{ "name": "..." }`).
- `POST /api/conversations/:id/leave`: Leave group.
- `POST /api/conversations/:id/read`: Reset unread counter for conversation.

### 4. Encrypted Messages (`/api/conversations/:id/messages` & `/api/messages`)
- `GET /api/conversations/:id/messages`: Fetch encrypted message envelopes.
- `POST /api/messages`: Store encrypted message envelope (REST fallback for WS).
  ```json
  // Request
  {
    "conversationId": "...",
    "ciphertext": "enc:v1:SGVsbG8gV29ybGQ=",
    "header": {
      "ratchetKey": "04c1a2...",
      "messageCounter": 1,
      "algorithm": "AES-256-GCM"
    }
  }
  ```

### 5. Public Keys (`/api/keys`)
- `POST /api/keys`: Register a public key (`identity`, `signed_prekey`, `one_time_prekey`).
- `GET /api/keys/user/:id`: Retrieve public keys for a peer.

---

## Real-Time WebSocket Protocol

- **Connection URL**: `ws://<host>:<port>/ws?token=<jwt_token>`

### Event Specifications

#### Client &rarr; Server
1. **Heartbeat**:
   ```json
   { "type": "ping", "timestamp": 1726815000000 }
   ```
2. **Send Encrypted Message** (`message` or `message.send`):
   ```json
   {
     "type": "message.send",
     "payload": {
       "conversationId": "conv_direct_...",
       "ciphertext": "enc:v1:T2FwZXVlIGNpcGhlcnRleHQ...",
       "header": { "ratchetKey": "04...", "messageCounter": 1 }
     }
   }
   ```
3. **Typing Status** (`typing`, `typing.start`, `typing.stop`):
   ```json
   {
     "type": "typing",
     "payload": { "conversationId": "...", "isTyping": true }
   }
   ```
4. **Delivery / Read Acknowledgement** (`delivery`, `message.delivered`, `message.read`):
   ```json
   {
     "type": "delivery",
     "payload": { "messageId": "...", "conversationId": "...", "status": "read" }
   }
   ```

#### Server &rarr; Client
1. **Connected Ack**:
   ```json
   { "type": "connected", "payload": { "userId": "...", "status": "connected" } }
   ```
2. **Encrypted Message Relay** (`message` / `message.receive`):
   ```json
   { "type": "message", "payload": { "id": "...", "conversationId": "...", "ciphertext": "...", "header": { ... } } }
   ```
3. **Delivery Confirmation**:
   ```json
   { "type": "delivery", "payload": { "messageId": "...", "conversationId": "...", "status": "delivered", "timestamp": "..." } }
   ```
4. **Presence Updates**:
   ```json
   { "type": "presence", "payload": { "userId": "...", "status": "online" } }
   ```

### Offline Message Delivery Guarantee
If a recipient is offline when an encrypted envelope arrives:
1. The message is stored in the database with status `sent`.
2. The server never attempts to decrypt it.
3. When the recipient reconnects and establishes a WebSocket connection, all pending messages are automatically flushed to the recipient, and delivery status updates to `delivered`.

---

## Local Development & Setup

### Prerequisites
- Node.js 18+
- npm or bun

### Instructions
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
4. Run tests:
   ```bash
   npm test
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

---

## Render Deployment Guide

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render binds automatically to `process.env.PORT`)
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g. `https://cipherchat.vercel.app`)
   - `SUPABASE_URL`: Your Supabase Project URL (`https://<project>.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Keep secret!)
   - `JWT_SECRET`: A secure 64-character random string
5. Deploy! The service will expose both:
   - HTTP API at `https://<service-name>.onrender.com/api`
   - WebSocket at `wss://<service-name>.onrender.com/ws`
