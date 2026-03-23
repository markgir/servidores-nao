const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'servers.json');

function cleanData() {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('API Endpoints', () => {
  let server;
  let port;

  before((_, done) => {
    cleanData();
    const app = require('../server');
    server = app.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  after((_, done) => {
    cleanData();
    server.close(done);
  });

  beforeEach(() => cleanData());

  it('GET /api/servers should return empty list', async () => {
    const res = await request({
      hostname: 'localhost',
      port,
      path: '/api/servers',
      method: 'GET'
    });
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, []);
  });

  it('POST /api/servers should add a server', async () => {
    const res = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/servers',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { name: 'Google DNS', host: '8.8.8.8' }
    );
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.name, 'Google DNS');
    assert.strictEqual(res.body.host, '8.8.8.8');
    assert.ok(res.body.id);
  });

  it('POST /api/servers should reject empty body', async () => {
    const res = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/servers',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { name: '', host: '' }
    );
    assert.strictEqual(res.status, 400);
  });

  it('DELETE /api/servers/:id should remove a server', async () => {
    // Add first
    const addRes = await request(
      {
        hostname: 'localhost',
        port,
        path: '/api/servers',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { name: 'To Delete', host: '1.2.3.4' }
    );
    const id = addRes.body.id;

    // Delete
    const delRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/servers/${id}`,
      method: 'DELETE'
    });
    assert.strictEqual(delRes.status, 200);
    assert.deepStrictEqual(delRes.body, { success: true });
  });

  it('DELETE /api/servers/:id should return 404 for non-existent', async () => {
    const res = await request({
      hostname: 'localhost',
      port,
      path: '/api/servers/fake-id',
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 404);
  });

  it('GET / should return HTML', async () => {
    const res = await request({
      hostname: 'localhost',
      port,
      path: '/',
      method: 'GET'
    });
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body === 'string' || typeof res.body === 'object');
  });
});
