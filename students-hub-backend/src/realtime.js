import { WebSocketServer, WebSocket } from "ws";

const clients = new Set();
const sseClients = new Set();

export function setupRealtime(server, app) {
  const wss = new WebSocketServer({ server, path: "/api/realtime/ws" });

  wss.on("connection", (ws, req) => {
    clients.add(ws);

    // Initial handshake
    ws.send(JSON.stringify({ type: "CONNECTED", message: "Connected to Students Hub Real-time Stream" }));

    ws.on("message", (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
        }
      } catch {}
    });

    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });

  // SSE Fallback for mobile networks
  app.get("/api/realtime/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const client = { res, id: Date.now() };
    sseClients.add(client);

    // Send initial ping
    res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "SSE Real-time Active" })}\n\n`);

    const interval = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(interval);
      sseClients.delete(client);
    });
  });

  console.log("Real-time engine initialized (WebSocket + SSE fallback)");
}

export function broadcast(event) {
  const payload = JSON.stringify(event);

  // Broadcast to WebSockets
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error("WS broadcast error:", err);
      }
    }
  }

  // Broadcast to SSE streams
  for (const client of sseClients) {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}
