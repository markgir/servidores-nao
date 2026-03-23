const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'servers.json');

function loadServers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading servers data:', err.message);
  }
  return [];
}

function saveServers(servers) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(servers, null, 2), 'utf8');
}

function getAllServers() {
  return loadServers();
}

function getServer(id) {
  const servers = loadServers();
  return servers.find((s) => s.id === id) || null;
}

function addServer(name, host) {
  const servers = loadServers();
  const server = {
    id: uuidv4(),
    name: name.trim(),
    host: host.trim(),
    createdAt: new Date().toISOString()
  };
  servers.push(server);
  saveServers(servers);
  return server;
}

function removeServer(id) {
  const servers = loadServers();
  const index = servers.findIndex((s) => s.id === id);
  if (index === -1) return false;
  servers.splice(index, 1);
  saveServers(servers);
  return true;
}

module.exports = { getAllServers, getServer, addServer, removeServer };
