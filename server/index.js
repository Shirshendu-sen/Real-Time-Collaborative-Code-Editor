import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "@y/websocket-server/utils";
import { publisher, subscriber } from "./redis.js";
import { runCode, UnsupportedLanguageError } from "./sandbox/runner.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/run", async (req, res) => {
  const { code, language } = req.body;

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ error: "Code must be a non-empty string." });
  }

  try {
    const result = await runCode(code, language);
    res.json(result);
  } catch (error) {
    if (error instanceof UnsupportedLanguageError) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Sandbox execution error:", error);
    res.status(500).json({ error: "Failed to execute code in sandbox." });
  }
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const CHANNEL = "collab-updates";

subscriber
  .subscribe(CHANNEL)
  .then(() => console.log(`Subscribed to Redis channel: ${CHANNEL}`))
  .catch((error) => console.error("Redis subscribe error:", error.message));

subscriber.on("message", (channel, message) => {
  if (channel === CHANNEL) {
    console.log("Received update from Redis:", message);
  }
});

wss.on("connection", (ws, req) => {
  // setupWSConnection handles Y.js document syncing for each room URL.
  setupWSConnection(ws, req);

  ws.on("message", (data) => {
    publisher.publish(CHANNEL, JSON.stringify({ room: req.url, size: data.length }));
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});