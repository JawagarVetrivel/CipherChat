-- ============================================================================
-- CipherChat Supabase PostgreSQL Database Schema
-- Zero-Knowledge, Dumb-Pipe Secure Messaging Architecture
-- ============================================================================

-- Enable pgcrypto / uuid generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores user identity and discovery credentials.
-- Privacy invariant: email is PRIVATE and never exposed in directory search.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    public_key_fingerprint VARCHAR(64),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive index for fast username search
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users (LOWER(display_name));

-- ----------------------------------------------------------------------------
-- 2. CONVERSATIONS TABLE
-- Represents direct 1-to-1 conversations and multi-user groups.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
    name VARCHAR(100),
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (updated_at DESC);

-- ----------------------------------------------------------------------------
-- 3. CONVERSATION MEMBERS TABLE
-- Normalizes conversation membership, roles, and unread counts.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    unread_count INT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cm_user_id ON conversation_members (user_id);
CREATE INDEX IF NOT EXISTS idx_cm_conv_id ON conversation_members (conversation_id);

-- ----------------------------------------------------------------------------
-- 4. MESSAGES TABLE (ZERO-KNOWLEDGE CIPHERTEXT STORAGE)
-- Strictly holds opaque encrypted payloads and cryptographic ratchet headers.
-- Plaintext is NEVER stored or handled by the backend.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ciphertext TEXT NOT NULL,
    header JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages (conversation_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_messages_pending_delivery ON messages (conversation_id, delivery_status) WHERE delivery_status = 'sent';

-- ----------------------------------------------------------------------------
-- 5. PUBLIC KEYS TABLE
-- Stores public cryptographic identity and pre-key material for X3DH handshakes.
-- Private keys are NEVER stored on the backend.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_type VARCHAR(50) NOT NULL, -- 'identity', 'signed_prekey', 'one_time_prekey'
    public_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_public_keys_user ON public_keys (user_id, key_type, is_active);

-- ----------------------------------------------------------------------------
-- 6. SESSIONS TABLE
-- Manages active authentication tokens.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token_hash);

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Supabase service-role key bypasses RLS for backend management.
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY service_role_all_users ON users FOR ALL TO service_role USING (true);
CREATE POLICY service_role_all_conversations ON conversations FOR ALL TO service_role USING (true);
CREATE POLICY service_role_all_members ON conversation_members FOR ALL TO service_role USING (true);
CREATE POLICY service_role_all_messages ON messages FOR ALL TO service_role USING (true);
CREATE POLICY service_role_all_keys ON public_keys FOR ALL TO service_role USING (true);
CREATE POLICY service_role_all_sessions ON sessions FOR ALL TO service_role USING (true);

-- ----------------------------------------------------------------------------
-- 8. INITIAL SEED USERS (Password for all accounts is: password123)
-- ----------------------------------------------------------------------------
INSERT INTO users (id, username, display_name, email, password_hash, status, public_key_fingerprint)
VALUES
    ('a1111111-1111-4111-a111-111111111111', 'rahul123', 'Rahul Sharma', 'rahul@university.edu', '$2a$10$NDt.hdmKPo1wgNBBvfwSTuTHlK0qeaCS5Jk.mrxo7jSD9w02yjk22', 'online', '8F21 A4BC 9901 3E7D'),
    ('b2222222-2222-4222-b222-222222222222', 'priya_k', 'Priya Kapoor', 'priya@university.edu', '$2a$10$NDt.hdmKPo1wgNBBvfwSTuTHlK0qeaCS5Jk.mrxo7jSD9w02yjk22', 'away', 'B391 7CD4 12EE 8840'),
    ('c3333333-3333-4333-c333-333333333333', 'crypto_prof', 'Prof. Alan Vance', 'vance@university.edu', '$2a$10$NDt.hdmKPo1wgNBBvfwSTuTHlK0qeaCS5Jk.mrxo7jSD9w02yjk22', 'offline', '44FA 1982 CD30 67BA'),
    ('d4444444-4444-4444-d444-444444444444', 'alex_c', 'Alex Chen', 'alex@university.edu', '$2a$10$NDt.hdmKPo1wgNBBvfwSTuTHlK0qeaCS5Jk.mrxo7jSD9w02yjk22', 'online', '11C9 DD40 82A1 991F')
ON CONFLICT (id) DO NOTHING;

-- Seed Direct Conversation between Rahul and Priya
INSERT INTO conversations (id, type, name, created_by)
VALUES ('e5555555-5555-4555-e555-555555555555', 'direct', 'Rahul & Priya', 'a1111111-1111-4111-a111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_members (conversation_id, user_id, role)
VALUES
    ('e5555555-5555-4555-e555-555555555555', 'a1111111-1111-4111-a111-111111111111', 'member'),
    ('e5555555-5555-4555-e555-555555555555', 'b2222222-2222-4222-b222-222222222222', 'member')
ON CONFLICT DO NOTHING;

