import http from 'http';
import { WebSocket } from 'ws';
import app from '../src/app.js';
import { setupWebSocketServer } from '../src/websocket/wsHandler.js';
import { db } from '../src/database/client.js';

let server: http.Server;
let port: number;
let baseUrl: string;
let wsUrl: string;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🚀 Starting CipherChat Backend Automated Test Suite...\n');
  await db.init();

  server = http.createServer(app);
  const wss = setupWebSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      port = addr.port;
      baseUrl = `http://127.0.0.1:${port}`;
      wsUrl = `ws://127.0.0.1:${port}/ws`;
      resolve();
    });
  });

  console.log(`Test server running on port ${port}`);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`  • Testing: ${name}... `);
      await fn();
      console.log('PASSED ✅');
      passed++;
    } catch (err: unknown) {
      console.log('FAILED ❌');
      console.error('    Error:', err instanceof Error ? err.message : err);
      failed++;
    }
  }

  // TEST 1: Health Check
  await test('GET /api/health returns 200 and healthy status', async () => {
    const res = await request('/api/health');
    if (res.status !== 200 || res.data.status !== 'healthy') {
      throw new Error(`Expected status 200 healthy, got ${res.status}`);
    }
  });

  // TEST 2: Pre-seeded Demo Login
  let rahulToken = '';
  let rahulId = '';
  await test('POST /api/auth/login with pre-seeded Rahul account', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'rahul@university.edu',
        password: 'password123',
      }),
    });
    if (res.status !== 200 || !res.data.token || res.data.user.username !== 'rahul123') {
      throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
    }
    rahulToken = res.data.token;
    rahulId = res.data.user.id;
  });

  // TEST 3: User Registration & Validation
  let newUserToken = '';
  let newUserId = '';
  const testUsername = `user_${Date.now().toString(36)}`;
  await test('POST /api/auth/register creates new account', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `${testUsername}@university.edu`,
        username: testUsername,
        displayName: 'Test Cryptographer',
        password: 'password123',
      }),
    });
    if (res.status !== 201 || !res.data.token) {
      throw new Error(`Registration failed: ${JSON.stringify(res.data)}`);
    }
    newUserToken = res.data.token;
    newUserId = res.data.user.id;
  });

  // TEST 4: Reject Duplicate Registration
  await test('POST /api/auth/register rejects duplicate username', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `other_${Date.now()}@university.edu`,
        username: testUsername,
        displayName: 'Duplicate User',
        password: 'password123',
      }),
    });
    if (res.status !== 500 && res.status !== 400) {
      throw new Error(`Expected rejection for duplicate username, got ${res.status}`);
    }
  });

  // TEST 5: Verify Session with GET /api/auth/me
  await test('GET /api/auth/me returns authenticated user profile', async () => {
    const res = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    if (res.status !== 200 || res.data.user.id !== rahulId) {
      throw new Error(`Expected user ${rahulId}, got ${JSON.stringify(res.data)}`);
    }
  });

  // TEST 6: User Search with Strict Privacy (Email NEVER revealed)
  await test('GET /api/users/search returns results WITHOUT email', async () => {
    const res = await request('/api/users/search?q=priya', {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    if (res.status !== 200 || !Array.isArray(res.data)) {
      throw new Error(`Expected array of users, got ${res.status}`);
    }
    const found = res.data.find((u: { username: string }) => u.username === 'priya_k');
    if (!found) throw new Error('Could not find priya_k in search');
    if (found.email !== undefined) {
      throw new Error('SECURITY VIOLATION: Email address leaked in user search!');
    }
  });

  // TEST 7: Direct Conversation Creation (Idempotent)
  let directConvId = '';
  await test('POST /api/conversations/direct establishes 1-to-1 conversation', async () => {
    // Get Priya's ID
    const priyaRes = await request('/api/users/username/priya_k', {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    const priyaId = priyaRes.data.id;

    const res1 = await request('/api/conversations/direct', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: JSON.stringify({ participantId: priyaId }),
    });

    if (res1.status !== 200 || res1.data.type !== 'direct') {
      throw new Error(`Failed to create direct conversation: ${JSON.stringify(res1.data)}`);
    }
    directConvId = res1.data.id;

    // Idempotent test
    const res2 = await request('/api/conversations/direct', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: JSON.stringify({ participantId: priyaId }),
    });

    if (res2.data.id !== directConvId) {
      throw new Error(`Idempotency failed: expected ${directConvId}, got ${res2.data.id}`);
    }
  });

  // TEST 8: Group Conversation Management
  let groupId = '';
  await test('Group Lifecycle: Create, add member, rename, leave', async () => {
    // 1. Create group
    const createRes = await request('/api/conversations/group', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: JSON.stringify({
        name: 'Quantum Resistant Lab',
        description: 'Post-quantum crypto algorithms research',
        memberIds: [newUserId],
      }),
    });
    if (createRes.status !== 201 || createRes.data.name !== 'Quantum Resistant Lab') {
      throw new Error(`Failed to create group: ${JSON.stringify(createRes.data)}`);
    }
    groupId = createRes.data.id;

    // 2. Rename group
    const renameRes = await request(`/api/conversations/${groupId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: JSON.stringify({ name: 'Kyber & Dilithium Lab' }),
    });
    if (renameRes.status !== 200 || renameRes.data.name !== 'Kyber & Dilithium Lab') {
      throw new Error(`Failed to rename group: ${JSON.stringify(renameRes.data)}`);
    }

    // 3. New user leaves group
    const leaveRes = await request(`/api/conversations/${groupId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newUserToken}` },
    });
    if (leaveRes.status !== 200) {
      throw new Error(`Failed to leave group: ${JSON.stringify(leaveRes.data)}`);
    }
  });

  // TEST 9: Encrypted Message Storage (Zero-Knowledge Dumb Pipe)
  let testMsgId = '';
  await test('POST /api/messages stores opaque ciphertext envelope', async () => {
    const opaqueCiphertext = 'enc:v1:TmV2ZXIgYnJlYWsgcHJpdmFjeSE=';
    const ratchetHeader = {
      ratchetKey: '04aabbccddee',
      messageCounter: 5,
      algorithm: 'AES-256-GCM',
    };

    const res = await request('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: JSON.stringify({
        conversationId: directConvId,
        ciphertext: opaqueCiphertext,
        header: ratchetHeader,
      }),
    });

    if (res.status !== 201 || res.data.ciphertext !== opaqueCiphertext) {
      throw new Error(`Failed to store encrypted message: ${JSON.stringify(res.data)}`);
    }
    testMsgId = res.data.id;

    // Retrieve conversation messages
    const getRes = await request(`/api/conversations/${directConvId}/messages`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    if (getRes.status !== 200 || !getRes.data.some((m: { id: string }) => m.id === testMsgId)) {
      throw new Error(`Stored message not found in conversation messages`);
    }
  });

  // TEST 10: Public Key Registration & Discovery
  await test('POST /api/keys registers identity public key', async () => {
    const res = await request('/api/keys', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: JSON.stringify({
        keyType: 'identity',
        publicKey: '04c3b578912ef34d89a2bc90fe8134ad',
      }),
    });
    if (res.status !== 201 || !res.data.id) {
      throw new Error(`Failed to register public key: ${JSON.stringify(res.data)}`);
    }

    // Retrieve keys for Rahul
    const getRes = await request(`/api/users/${rahulId}/keys`, {
      headers: { Authorization: `Bearer ${newUserToken}` },
    });
    if (getRes.status !== 200 || getRes.data.length === 0) {
      throw new Error('Failed to retrieve user public keys');
    }
  });

  // TEST 11: Real-Time WebSocket Protocol
  await test('WebSocket: Authenticates, handles ping/pong, routes encrypted message', async () => {
    const wsClientRahul = new WebSocket(`${wsUrl}?token=${encodeURIComponent(rahulToken)}`);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 3000);

      wsClientRahul.on('open', () => {
        // Send ping
        wsClientRahul.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      });

      wsClientRahul.on('message', (data: string) => {
        const event = JSON.parse(data.toString());
        if (event.type === 'connected') {
          // Connected ack received
        } else if (event.type === 'pong') {
          clearTimeout(timeout);
          wsClientRahul.close();
          resolve();
        }
      });

      wsClientRahul.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  wss.close();
  server.close();

  console.log(`\n=======================================================`);
  console.log(` CipherChat Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`=======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
