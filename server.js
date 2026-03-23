const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { getAllServers, addServer, removeServer, getServer } = require('./data/store');
const { pingHost } = require('./services/ping');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100
});

app.use(limiter);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: List all servers
app.get('/api/servers', (req, res) => {
  const servers = getAllServers();
  res.json(servers);
});

// API: Add a server
app.post('/api/servers', (req, res) => {
  const { name, host } = req.body;
  if (!name || !host || !name.trim() || !host.trim()) {
    return res.status(400).json({ error: 'Name and host are required' });
  }
  const server = addServer(name, host);
  res.status(201).json(server);
});

// API: Remove a server
app.delete('/api/servers/:id', (req, res) => {
  const success = removeServer(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Server not found' });
  }
  res.json({ success: true });
});

// API: Ping a specific server
app.get('/api/servers/:id/ping', async (req, res) => {
  const server = getServer(req.params.id);
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  try {
    const result = await pingHost(server.host);
    res.json(result);
  } catch (err) {
    res.json({ alive: false, time: null, error: err.message });
  }
});

// API: Ping all servers
app.get('/api/status', async (req, res) => {
  const servers = getAllServers();
  const results = await Promise.all(
    servers.map(async (server) => {
      try {
        const result = await pingHost(server.host);
        return { id: server.id, ...result };
      } catch (err) {
        return { id: server.id, alive: false, time: null, error: err.message };
      }
    })
  );
  res.json(results);
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server monitoring running on http://localhost:${PORT}`);
  });
}

module.exports = app;
