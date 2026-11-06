import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createDb } from "./src/db.js";
import authRoutes from "./src/routes/auth.js";
import resourceRoutes from "./src/routes/resources.js";
import noticeRoutes from "./src/routes/notices.js";

const __filename = fileURLToPath(import.meta.url);
const backendDir = path.dirname(__filename);
dotenv.config({ path: path.join(backendDir, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists and serve statically
const uploadsDir = path.join(backendDir, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

const db = await createDb();
app.use("/api/auth", authRoutes(db));
app.use("/api/resources", resourceRoutes(db, backendDir));
app.use("/api/notices", noticeRoutes(db));

app.get("/api/health", (req, res) => res.json({ status: "Students Hub backend is running" }));

// In production, serve the built frontend application
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Students Hub backend running on http://localhost:${PORT}`));

export { app, db };
