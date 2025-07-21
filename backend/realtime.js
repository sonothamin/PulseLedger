const WebSocket = require('ws');

let wss;
const clients = new Set();

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

function broadcast(event, data) {
  const message = JSON.stringify({ event, data });
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

module.exports = { setupWebSocket, broadcast }; 