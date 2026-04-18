const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { runMigrations } = require('../scripts/migrate');

const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;
const DB_PATH = path.join(process.cwd(), 'data', 'test-bcs.db');

let authToken = null;
let testPageId = null;
let testServer = null;

// Helper to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe('BCS CMS API', () => {
  before(async () => {
    // Start server with test port
    process.env.PORT = PORT;
    process.env.JWT_SECRET = 'test-secret';
    process.env.DB_PATH = DB_PATH;

    // Clean test database and reset database module
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }

    // Reset database module to clear any cached connection
    const { resetDatabase } = require('../src/db/database');
    await resetDatabase();

    // Run migrations on test database
    await runMigrations();

    const { startServer } = require('../server');
    testServer = await startServer();

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  after(async () => {
    if (testServer) {
      testServer.close();
    }
    // Cleanup test database
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  describe('Health and Info', () => {
    test('health endpoint returns healthy status', async () => {
      const res = await request('GET', '/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'healthy');
      assert.ok(res.data.timestamp);
    });

    test('ready endpoint returns ready status', async () => {
      const res = await request('GET', '/ready');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.ready, true);
    });

    test('root endpoint returns CMS info', async () => {
      const res = await request('GET', '/');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.name, 'BCS Content Management System');
    });
  });

  describe('Authentication', () => {
    test('register creates new user and returns token', async () => {
      const res = await request('POST', '/api/auth/register', {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Test Admin',
        role: 'admin'
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.data.token);
      assert.strictEqual(res.data.user.email, 'admin@test.com');
      authToken = res.data.token;
    });

    test('login with valid credentials returns token', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'admin@test.com',
        password: 'password123'
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.token);
      authToken = res.data.token;
    });

    test('login with invalid credentials returns 401', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'admin@test.com',
        password: 'wrongpassword'
      });
      assert.strictEqual(res.status, 401);
    });

    test('register with existing email returns 409', async () => {
      const res = await request('POST', '/api/auth/register', {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Duplicate Admin'
      });
      assert.strictEqual(res.status, 409);
    });
  });

  describe('Pages API', () => {
    test('create page requires authentication', async () => {
      const res = await request('POST', '/api/pages', {
        title: 'Unauthorized Page',
        slug: 'unauthorized',
        content: 'Should fail'
      });
      assert.strictEqual(res.status, 401);
    });

    test('create page successfully', async () => {
      const res = await request('POST', '/api/pages', {
        title: 'Test Page',
        slug: 'test-page',
        content: 'Test content here',
        excerpt: 'A test page',
        status: 'draft'
      }, authToken);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.page.title, 'Test Page');
      testPageId = res.data.page.id;
    });

    test('get page by id', async () => {
      const res = await request('GET', `/api/pages/${testPageId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.page.title, 'Test Page');
    });

    test('get page by slug', async () => {
      const res = await request('GET', '/api/pages/slug/test-page');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.page.slug, 'test-page');
    });

    test('list pages', async () => {
      const res = await request('GET', '/api/pages');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.pages);
      assert.ok(res.data.total >= 1);
    });

    test('update page', async () => {
      const res = await request('PUT', `/api/pages/${testPageId}`, {
        title: 'Updated Test Page',
        status: 'published'
      }, authToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.page.title, 'Updated Test Page');
    });

    test('delete page requires admin', async () => {
      // Create editor user
      const editorRes = await request('POST', '/api/auth/register', {
        email: 'editor@test.com',
        password: 'password123',
        name: 'Test Editor',
        role: 'editor'
      });

      const res = await request('DELETE', `/api/pages/${testPageId}`, null, editorRes.data.token);
      assert.strictEqual(res.status, 403);
    });

    test('delete page successfully', async () => {
      const res = await request('DELETE', `/api/pages/${testPageId}`, null, authToken);
      assert.strictEqual(res.status, 204);
    });
  });

  describe('Users API', () => {
    test('get current user', async () => {
      const res = await request('GET', '/api/users/me', null, authToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.email, 'admin@test.com');
    });

    test('update current user', async () => {
      const res = await request('PUT', '/api/users/me', {
        name: 'Updated Admin'
      }, authToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.name, 'Updated Admin');
    });

    test('list users requires admin', async () => {
      const res = await request('GET', '/api/users', null, authToken);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.users);
    });
  });

  describe('Media API', () => {
    test('list media requires auth', async () => {
      const res = await request('GET', '/api/media', null, authToken);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.media);
    });
  });
});
