# CipherChat 🛡️💬

> **A secure, real-time messaging application with a zero-knowledge "dumb pipe" backend, architected for client-side end-to-end encryption (E2EE) and privacy-first collaboration.**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cipher-chat-roan.vercel.app)
[![Render Backend](https://img.shields.io/badge/Render-API%20%26%20WebSocket-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://cipherchat-rtn2.onrender.com)
[![Supabase Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

---

## 🌐 Live Deployments

| Component | Platform | URL |
|:---|:---|:---|
| **Web Client (Frontend)** | Vercel | [**https://cipher-chat-roan.vercel.app**](https://cipher-chat-roan.vercel.app) |
| **REST API & WebSocket Relay** | Render | [**https://cipherchat-rtn2.onrender.com**](https://cipherchat-rtn2.onrender.com) |
| **Health Probe** | Render | [`https://cipherchat-rtn2.onrender.com/api/health`](https://cipherchat-rtn2.onrender.com/api/health) |
| **Database** | Supabase | PostgreSQL (US East) with Row-Level Security (RLS) |

---

## 🔐 Core Security & Cryptographic Invariants

CipherChat is designed for university cryptography research and high-assurance messaging workflows. It adheres strictly to the **"Dumb Pipe" Relay Principle**:

1. **Zero-Knowledge Relay**: The backend routes and stores strictly **opaque ciphertext envelopes** (`enc:v1:...`) and ratchet headers. The server **never** decrypts, encrypts, parses, or logs message plaintext.
2. **Zero Private Keys on Server**: Private cryptographic keys exist **exclusively in client memory**. The backend manages only public cryptographic metadata (Identity Keys, Signed Pre-keys, One-Time Pre-keys) to facilitate Extended Triple Diffie-Hellman (X3DH) handshakes.
3. **Directory Privacy Guarantee**: Email addresses are strictly private to authenticated accounts. Users are discovered exclusively by `@username` or display name—email addresses are never exposed in search results, user profiles, or group rosters.
4. **Offline Delivery Guarantees**: When a peer is offline, encrypted envelopes are persisted in the database with status `sent`. Upon client reconnection, pending envelopes are automatically flushed to the recipient across the WebSocket connection without server-side decryption.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────┐                                ┌─────────────────────────┐
│        CLIENT A         │                                │        CLIENT B         │
│  (React 19 + TypeScript)│                                │  (React 19 + TypeScript)│
│                         │                                │                         │
│  ┌───────────────────┐  │                                │  ┌───────────────────┐  │
│  │ Client-Side Crypto│  │                                │  │ Client-Side Crypto│  │
│  │ (X3DH / Ratchet)  │  │                                │  │ (X3DH / Ratchet)  │  │
│  └─────────┬─────────┘  │                                │  └─────────▲─────────┘  │
│            │ Ciphertext │                                │            │ Ciphertext │
└────────────┼────────────┘                                └────────────┼────────────┘
             │                                                          │
             │ WSS (Encrypted Payload)                                  │ WSS (Encrypted Payload)
             ▼                                                          │
┌───────────────────────────────────────────────────────────────────────┴────────────┐
│                             CIPHERCHAT DUMB-PIPE BACKEND                           │
│                             (Node.js / Express / ws on Render)                     │
│                                                                                    │
│   • Validates JWT session tokens & conversation membership                         │
│   • Routes opaque ciphertext packets without reading plaintext                     │
│   • Manages online/offline presence & WebSocket lifecycle                          │
│   • Flushes offline queued messages upon reconnection                              │
└─────────────────────────────────────────┬──────────────────────────────────────────┘
                                          │
                                          │ Service-Role Authentication
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                               SUPABASE POSTGRESQL                                  │
│                                                                                    │
│   • users                 (Credentials, public fingerprints, private emails)       │
│   • conversations         (Direct DMs & collaborative project groups)             │
│   • conversation_members  (Membership roles, permissions, unread counters)        │
│   • messages              (Opaque ciphertext payloads & ratchet headers ONLY)      │
│   • public_keys           (X3DH Identity Keys, Signed Pre-keys, One-Time Pre-keys) │
│   • sessions              (Active token hashes)                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- **Real-Time Cross-Device Messaging**: Instant communication across desktop browsers, laptops, and mobile devices over WebSockets.
- **E2EE Envelope Inspector**: Click the shield icon on any message bubble to inspect the underlying cryptographic packet—including ciphertext, ratchet step, sequence counter, and verification status.
- **Dynamic Peer Resolution**: Direct 1-to-1 chats always resolve the other participant dynamically, preventing self-messaging loops.
- **User Discovery**: Search users safely by `@username` or display name with zero email leakage.
- **Group Collaboration**: Create named groups (e.g. *Crypto Lab Team*), invite team members, assign administrator privileges, and update group details.
- **Live Presence & Typing Indicators**: Real-time status indicators (`online`, `away`, `offline`) and typing notifications.
- **Theme Support**: Polished dark and light themes crafted with TailwindCSS.

---

## 👥 Demo Accounts

The database comes pre-seeded with university project accounts (password for all demo accounts is **`password123`**):

| Username | Display Name | Email | Role |
|:---|:---|:---|:---|
| `@rahul123` | Rahul Sharma | `rahul@university.edu` | Student / Crypto Lab Lead |
| `@priya_k` | Priya Kapoor | `priya@university.edu` | Research Collaborator |
| `@alex_c` | Alex Chen | `alex@university.edu` | Team Member |
| `@crypto_prof` | Prof. Alan Vance | `vance@university.edu` | Project Advisor |

> You can also click **"Create an account"** on the login page to register your own custom username.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Bundler & Tooling**: Vite 8
- **Styling**: TailwindCSS 4
- **Icons**: Lucide React
- **Routing**: React Router 7
- **Hosting**: [Vercel](https://vercel.com)

### Backend
- **Runtime**: Node.js 20+ (ES Modules)
- **Language**: TypeScript 5
- **Framework**: Express.js
- **WebSocket Server**: `ws`
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting, bcrypt, JSON Web Tokens (JWT)
- **Hosting**: [Render](https://render.com)

### Database
- **Provider**: [Supabase](https://supabase.com)
- **Engine**: PostgreSQL 15+
- **Security**: Row-Level Security (RLS) policies with service-role backend access

---

## 📡 REST API & WebSocket Reference

All protected endpoints require an `Authorization: Bearer <jwt_token>` header.

### REST Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Service health status and uptime probe |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate existing credentials |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile |
| `GET` | `/api/users/search?q=:query` | Search directory by `@username` or name (email hidden) |
| `GET` | `/api/users/:id` | Lookup public user profile |
| `GET` | `/api/users/username/:username` | Lookup user profile by username |
| `PATCH` | `/api/users/profile` | Update display name, avatar, or public key fingerprint |
| `GET` | `/api/users/:id/keys` | Fetch public keys for X3DH session establishment |
| `GET` | `/api/conversations` | List conversations for the authenticated caller |
| `GET` | `/api/conversations/:id` | Get conversation details (membership checked) |
| `POST` | `/api/conversations/direct` | Get or create a 1-to-1 direct conversation |
| `POST` | `/api/conversations/group` | Create a multi-member group conversation |
| `POST` | `/api/conversations/:id/members` | Add members to an existing group |
| `DELETE` | `/api/conversations/:id/members/:userId` | Remove a member from a group (Admin or self) |
| `PATCH` | `/api/conversations/:id` | Update group name |
| `POST` | `/api/conversations/:id/leave` | Leave a group conversation |
| `POST` | `/api/conversations/:id/read` | Mark conversation messages as read |
| `GET` | `/api/conversations/:id/messages` | Retrieve encrypted message envelopes |
| `POST` | `/api/messages` | Store encrypted envelope (REST fallback) |
| `POST` | `/api/keys` | Register a public key (`identity`, `signed_prekey`, `one_time_prekey`) |

### WebSocket Protocol (`/ws?token=<jwt>`)

| Event Type | Direction | Description |
|:---|:---|:---|
| `ping` / `pong` | Bidirectional | Connection heartbeat monitoring |
| `connected` | Server → Client | Connection established acknowledgment |
| `message.send` | Client → Server | Client sends opaque encrypted envelope |
| `message.receive` | Server → Client | Server relays encrypted envelope to peer(s) |
| `delivery` | Server → Client | Delivery acknowledgment (`delivered`, `read`) |
| `typing.start` / `typing.stop` | Client → Server → Client | Real-time peer typing indicator |
| `presence.update` | Server → Client | Real-time user status changes (`online`, `offline`) |

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **bun**

### 1. Clone Repository
```bash
git clone https://github.com/JawagarVetrivel/CipherChat.git
cd CipherChat
```

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start local Vite dev server (runs on http://localhost:3000)
npm run dev
```

### 3. Backend Setup
```bash
# Open a new terminal and navigate to backend/
cd backend

# Install backend dependencies
npm install

# Copy environment template
cp .env.example .env

# Run automated integration tests
npm test

# Start backend dev server with hot-reload (runs on http://localhost:3001)
npm run dev
```

---

## ⚙️ Environment Variables

### Frontend (`.env` or Vercel Environment Variables)

| Variable | Description | Default / Example |
|:---|:---|:---|
| `VITE_API_BASE_URL` | Backend REST API endpoint | `https://cipherchat-rtn2.onrender.com/api` |
| `VITE_WS_URL` | WebSocket relay endpoint | `wss://cipherchat-rtn2.onrender.com/ws` |

### Backend (`backend/.env` or Render Environment Variables)

| Variable | Description | Default / Example |
|:---|:---|:---|
| `PORT` | Server listening port | `10000` (set by Render) |
| `NODE_ENV` | Runtime environment | `production` |
| `FRONTEND_URL` | Allowed origin for CORS | `https://cipher-chat-roan.vercel.app` |
| `SUPABASE_URL` | Supabase Project API URL | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | `eyJ...` (Keep secret!) |
| `JWT_SECRET` | Secret key for signing user tokens | High-entropy random string |
| `JWT_EXPIRES_IN` | Token lifespan | `7d` |

---

## 📂 Project Structure

```
CipherChat/
├── backend/                       # Standalone Express & WebSocket Backend
│   ├── database/
│   │   └── schema.sql             # Supabase PostgreSQL schema with RLS
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Database migration scripts
│   ├── src/
│   │   ├── config/env.ts          # Zod-validated environment config
│   │   ├── controllers/           # REST controllers (auth, user, conv, msg, key)
│   │   ├── database/client.ts     # Supabase client & fallback repository
│   │   ├── database/seed.ts       # Seed demo users & university project team
│   │   ├── middleware/            # JWT auth, rate limiter, error handler
│   │   ├── routes/                # Express API routes
│   │   ├── services/              # Business logic & data access
│   │   ├── types/                 # Shared domain interfaces
│   │   ├── utils/logger.ts        # Zero-leakage logger
│   │   ├── websocket/wsHandler.ts # WebSocket protocol & event dispatcher
│   │   ├── websocket/wsManager.ts # Connection tracking & targeted relay
│   │   ├── app.ts                 # Express application & CORS configuration
│   │   └── server.ts              # Entry point binding HTTP & WS servers
│   ├── tests/backend.test.ts      # 11-step automated integration test suite
│   ├── package.json
│   └── tsconfig.json
├── src/                           # React 19 Frontend
│   ├── components/
│   │   ├── chat/                  # ChatArea, ChatHeader, MessageBubble, SecurityInspector
│   │   ├── common/                # Avatar, StatusBadge, Button, Input
│   │   ├── layout/                # Sidebar, Navigation, BrandHeader
│   │   └── modals/                # NewDirectChatModal, NewGroupModal, GroupDetailsModal
│   ├── context/                   # AuthContext, ChatContext, ThemeContext
│   ├── crypto/                    # Client-side cryptographic abstraction layer
│   ├── pages/                     # LoginPage, RegisterPage, ChatPage
│   ├── services/
│   │   ├── api/                   # authService, chatService, userService
│   │   └── websocket/             # WebSocketClient transport layer
│   ├── types/                     # Frontend domain types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  # Modern TailwindCSS styles
├── .env.example                   # Frontend environment configuration template
├── package.json                   # Root scripts & frontend dependencies
├── render.yaml                    # Render Infrastructure-as-Code blueprint
├── vite.config.ts                 # Vite bundler configuration
└── README.md                      # Project documentation
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
