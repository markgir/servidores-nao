// =========================================================
// Server Monitor - Frontend Application
// =========================================================

const API_BASE = '/api';
const PING_INTERVAL = 5000; // Ping every 5 seconds
const MAX_HEARTBEAT_POINTS = 60; // Keep last 60 ping results

// Store ping history for each server (for heartbeat chart)
const pingHistory = {};

// ---- DOM Elements ----
const serverListEl = document.getElementById('server-list');
const nameInput = document.getElementById('server-name');
const hostInput = document.getElementById('server-host');
const btnAdd = document.getElementById('btn-add');

// ---- Event Listeners ----
btnAdd.addEventListener('click', addServer);
hostInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addServer();
});

// ---- Load servers on start ----
loadServers();

// ---- Periodic status check ----
setInterval(updateAllStatus, PING_INTERVAL);

// =========================================================
// API Functions
// =========================================================

async function loadServers() {
  try {
    const res = await fetch(`${API_BASE}/servers`);
    const servers = await res.json();
    renderServerList(servers);
    // Initial ping for all
    if (servers.length > 0) {
      updateAllStatus();
    }
  } catch (err) {
    console.error('Error loading servers:', err);
  }
}

async function addServer() {
  const name = nameInput.value.trim();
  const host = hostInput.value.trim();
  if (!name || !host) return;

  try {
    const res = await fetch(`${API_BASE}/servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, host })
    });
    if (res.ok) {
      nameInput.value = '';
      hostInput.value = '';
      loadServers();
    }
  } catch (err) {
    console.error('Error adding server:', err);
  }
}

async function deleteServer(id) {
  try {
    const res = await fetch(`${API_BASE}/servers/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      delete pingHistory[id];
      loadServers();
    }
  } catch (err) {
    console.error('Error deleting server:', err);
  }
}

async function updateAllStatus() {
  try {
    const res = await fetch(`${API_BASE}/status`);
    const results = await res.json();
    results.forEach((result) => {
      updateServerStatus(result.id, result.alive, result.time);
    });
  } catch (err) {
    console.error('Error updating status:', err);
  }
}

// =========================================================
// Rendering
// =========================================================

function renderServerList(servers) {
  if (servers.length === 0) {
    serverListEl.innerHTML =
      '<div class="empty-state">Nenhum servidor adicionado. Adicione um acima.</div>';
    return;
  }

  serverListEl.innerHTML = servers
    .map(
      (s) => `
    <div class="server-card" data-id="${s.id}">
      <div class="server-header">
        <div class="server-info">
          <div>
            <div class="server-name">${escapeHtml(s.name)}</div>
            <div class="server-host">${escapeHtml(s.host)}</div>
          </div>
        </div>
        <div class="server-actions">
          <span class="ping-time" data-ping-time="${s.id}">--</span>
          <div class="status-light unknown" data-status="${s.id}"></div>
          <button class="btn-delete" data-delete-id="${s.id}" title="Remover servidor">✕</button>
        </div>
      </div>
      <div class="heartbeat-container">
        <canvas class="heartbeat-canvas" data-canvas="${s.id}"></canvas>
      </div>
    </div>
  `
    )
    .join('');

  // Attach delete event listeners
  servers.forEach((s) => {
    const btn = serverListEl.querySelector(`[data-delete-id="${s.id}"]`);
    if (btn) {
      btn.addEventListener('click', () => deleteServer(s.id));
    }
    if (!pingHistory[s.id]) {
      pingHistory[s.id] = [];
    }
    drawHeartbeat(s.id);
  });
}

function updateServerStatus(id, alive, time) {
  // Update status light
  const lightEl = document.querySelector(`[data-status="${id}"]`);
  if (lightEl) {
    lightEl.className = `status-light ${alive ? 'online' : 'offline'}`;
  }

  // Update ping time display
  const timeEl = document.querySelector(`[data-ping-time="${id}"]`);
  if (timeEl) {
    timeEl.textContent = alive && time != null ? `${Number(time).toFixed(1)} ms` : '--';
  }

  // Update ping history
  if (!pingHistory[id]) {
    pingHistory[id] = [];
  }
  pingHistory[id].push({
    alive,
    time: alive ? time : null,
    timestamp: Date.now()
  });

  // Limit history size
  if (pingHistory[id].length > MAX_HEARTBEAT_POINTS) {
    pingHistory[id].shift();
  }

  // Redraw heartbeat
  drawHeartbeat(id);
}

// =========================================================
// Heartbeat / Lifeline Visualization
// =========================================================

function drawHeartbeat(id) {
  const canvas = document.querySelector(`[data-canvas="${id}"]`);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const w = canvas.width;
  const h = canvas.height;
  const history = pingHistory[id] || [];

  // Clear
  ctx.clearRect(0, 0, w, h);

  if (history.length < 2) {
    // Draw flat line if not enough data
    ctx.strokeStyle = 'rgba(60, 160, 60, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    return;
  }

  // Calculate max time for scaling (capped for visual clarity)
  const times = history.filter((p) => p.time !== null).map((p) => p.time);
  const maxTime = times.length > 0 ? Math.max(...times, 10) : 100;

  const padding = 4;
  const usableH = h - padding * 2;
  const stepX = w / (MAX_HEARTBEAT_POINTS - 1);
  const startX = w - (history.length - 1) * stepX;

  // Draw heartbeat line
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Create gradient for the line based on latest status
  const lastAlive = history[history.length - 1].alive;
  if (lastAlive) {
    ctx.strokeStyle = '#22cc22';
    ctx.shadowColor = 'rgba(34, 204, 34, 0.4)';
  } else {
    ctx.strokeStyle = '#dd3333';
    ctx.shadowColor = 'rgba(221, 51, 51, 0.4)';
  }
  ctx.shadowBlur = 4;

  for (let i = 0; i < history.length; i++) {
    const x = startX + i * stepX;
    let y;

    if (history[i].alive && history[i].time !== null) {
      // Scale time: higher time = higher on chart (inverted y)
      const ratio = Math.min(history[i].time / maxTime, 1);
      // Create heartbeat spikes
      y = h / 2 - ratio * (usableH / 2);
    } else {
      // Offline: flat line at bottom area
      y = h - padding - 2;
    }

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw baseline
  ctx.strokeStyle = 'rgba(60, 160, 60, 0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
}

// =========================================================
// Utility
// =========================================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Handle window resize - redraw all canvases
window.addEventListener('resize', () => {
  Object.keys(pingHistory).forEach((id) => drawHeartbeat(id));
});
