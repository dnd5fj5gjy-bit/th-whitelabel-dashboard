// Server-Sent Events manager

const clients = new Set();

export function addClient(req, res) {
  // Configure SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx/cloudflare buffering
  });

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'ok', time: Date.now() })}\n\n`);

  clients.add(res);

  // Send keepalive every 30s to prevent timeout through tunnels
  const keepalive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(keepalive);
    clients.delete(res);
  });
}

export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

export function getClientCount() {
  return clients.size;
}
