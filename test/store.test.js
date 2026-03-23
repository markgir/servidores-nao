const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Use a test-specific data file
const DATA_FILE = path.join(__dirname, '..', 'data', 'servers.json');

function cleanData() {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
}

describe('Data Store', () => {
  beforeEach(() => cleanData());
  afterEach(() => cleanData());

  it('should return empty array when no servers exist', () => {
    const { getAllServers } = require('../data/store');
    const servers = getAllServers();
    assert.deepStrictEqual(servers, []);
  });

  it('should add a server', () => {
    const { addServer, getAllServers } = require('../data/store');
    const server = addServer('Test Server', '192.168.1.1');
    assert.ok(server.id);
    assert.strictEqual(server.name, 'Test Server');
    assert.strictEqual(server.host, '192.168.1.1');
    assert.ok(server.createdAt);

    const all = getAllServers();
    assert.strictEqual(all.length, 1);
    assert.strictEqual(all[0].name, 'Test Server');
  });

  it('should get a server by id', () => {
    const { addServer, getServer } = require('../data/store');
    const server = addServer('My Server', '10.0.0.1');
    const found = getServer(server.id);
    assert.ok(found);
    assert.strictEqual(found.name, 'My Server');
    assert.strictEqual(found.host, '10.0.0.1');
  });

  it('should return null for non-existent server', () => {
    const { getServer } = require('../data/store');
    const found = getServer('non-existent-id');
    assert.strictEqual(found, null);
  });

  it('should remove a server', () => {
    const { addServer, removeServer, getAllServers } = require('../data/store');
    const server = addServer('Delete Me', '1.1.1.1');
    assert.strictEqual(getAllServers().length, 1);

    const result = removeServer(server.id);
    assert.strictEqual(result, true);
    assert.strictEqual(getAllServers().length, 0);
  });

  it('should return false when removing non-existent server', () => {
    const { removeServer } = require('../data/store');
    const result = removeServer('non-existent-id');
    assert.strictEqual(result, false);
  });

  it('should trim name and host', () => {
    const { addServer } = require('../data/store');
    const server = addServer('  Padded Name  ', '  192.168.1.1  ');
    assert.strictEqual(server.name, 'Padded Name');
    assert.strictEqual(server.host, '192.168.1.1');
  });
});
