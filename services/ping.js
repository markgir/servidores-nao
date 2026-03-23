const ping = require('ping');

async function pingHost(host) {
  const result = await ping.promise.probe(host, {
    timeout: 5, // seconds
    extra: ['-c', '1']
  });
  return {
    alive: result.alive,
    time: result.alive ? parseFloat(result.time) : null,
    host: result.host
  };
}

module.exports = { pingHost };
