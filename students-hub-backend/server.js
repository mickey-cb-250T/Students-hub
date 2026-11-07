import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import http from "http";
import { fileURLToPath } from "url";
import { createDb } from "./src/db.js";
import authRoutes from "./src/routes/auth.js";
import resourceRoutes from "./src/routes/resources.js";
import noticeRoutes from "./src/routes/notices.js";
import classroomRoutes from "./src/routes/classrooms.js";
import { setupRealtime, broadcast } from "./src/realtime.js";

const __filename = fileURLToPath(import.meta.url);
const backendDir = path.dirname(__filename);
dotenv.config({ path: path.join(backendDir, ".env") });

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists and serve statically
const uploadsDir = path.join(backendDir, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Attach real-time engine
setupRealtime(server, app);

const db = await createDb();
app.use("/api/auth", authRoutes(db));
app.use("/api/classrooms", classroomRoutes(db, broadcast));
app.use("/api/resources", resourceRoutes(db, backendDir, broadcast));
app.use("/api/notices", noticeRoutes(db, broadcast));

// Peer doubt and live collaboration broadcast proxy
app.post("/api/realtime/broadcast", (req, res) => {
  if (req.body && req.body.type) {
    broadcast(req.body);
  }
  res.json({ success: true });
});

app.get("/api/health", (req, res) => res.json({ status: "Students Hub backend is running", realtime: true }));

// Serve the frontend application
const frontendDist = path.resolve(backendDir, "..", "students-hub-frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error("Backend error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`Students Hub running on http://localhost:${PORT}`));

export { app, server, db, broadcast };
