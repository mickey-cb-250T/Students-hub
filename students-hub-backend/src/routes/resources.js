import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authRequired, optionalAuth } from "../auth.js";

const __filename = fileURLToPath(import.meta.url);
const defaultBackendDir = path.resolve(path.dirname(__filename), "..");

export default function resourceRoutes(db, backendDir = defaultBackendDir, broadcast = null) {
  const router = Router();
  const uploadDir = path.join(backendDir, "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|png|jpe?g|webp|txt|doc|docx)$/i)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF, image, text or Word documents are allowed"));
      }
    }
  });

  router.get("/", optionalAuth, async (req, res) => {
    try {
      const { search = "", subject = "", type = "", classroom_id } = req.query;
      let sql = `
        SELECT r.*,
               COALESCE(u.name, 'Campus Peer') AS author,
               EXISTS(SELECT 1 FROM saved_resources s WHERE s.resource_id = r.id AND s.user_id = ?) AS saved
        FROM resources r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE 1=1
      `;
      const params = [req.user?.id || 0];
      if (classroom_id && classroom_id !== "all") {
        sql += " AND (r.classroom_id = ? OR r.classroom_id IS NULL)";
        params.push(Number(classroom_id));
      }
      if (search) {
        sql += " AND (r.title LIKE ? OR r.description LIKE ? OR r.subject LIKE ?)";
        const q = `%${search}%`;
        params.push(q, q, q);
      }
      if (subject && subject !== "All subjects") {
        sql += " AND r.subject = ?";
        params.push(subject);
      }
      if (type && type !== "Overview") {
        sql += " AND r.type = ?";
        params.push(type);
      }
      sql += " ORDER BY r.created_at DESC";
      const resources = await db.all(sql, params);
      res.json({ resources });
    } catch (err) {
      console.error("GET /resources error:", err);
      res.status(500).json({ error: "Failed to load resources" });
    }
  });

  router.get("/mine", authRequired, async (req, res) => {
    try {
      const sql = `
        SELECT r.*,
               COALESCE(u.name, 'Campus Peer') AS author,
               EXISTS(SELECT 1 FROM saved_resources s WHERE s.resource_id = r.id AND s.user_id = ?) AS saved
        FROM resources r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      `;
      const resources = await db.all(sql, [req.user.id, req.user.id]);
      res.json({ resources });
    } catch (err) {
      console.error("GET /resources/mine error:", err);
      res.status(500).json({ error: "Failed to load your resources" });
    }
  });

  router.get("/saved", authRequired, async (req, res) => {
    try {
      const sql = `
        SELECT r.*,
               COALESCE(u.name, 'Campus Peer') AS author,
               1 AS saved
        FROM saved_resources s
        JOIN resources r ON r.id = s.resource_id
        LEFT JOIN users u ON u.id = r.user_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
      `;
      const resources = await db.all(sql, [req.user.id]);
      res.json({ resources });
    } catch (err) {
      console.error("GET /resources/saved error:", err);
      res.status(500).json({ error: "Failed to load saved resources" });
    }
  });

  router.get("/:id", optionalAuth, async (req, res) => {
    try {
      const sql = `
        SELECT r.*,
               COALESCE(u.name, 'Campus Peer') AS author,
               EXISTS(SELECT 1 FROM saved_resources s WHERE s.resource_id = r.id AND s.user_id = ?) AS saved
        FROM resources r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.id = ?
      `;
      const resource = await db.get(sql, [req.user?.id || 0, req.params.id]);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      res.json({ resource });
    } catch (err) {
      console.error("GET /resources/:id error:", err);
      res.status(500).json({ error: "Failed to load resource" });
    }
  });

  router.post("/", authRequired, upload.single("file"), async (req, res) => {
    try {
      const { title, description, subject, type, classroom_id } = req.body;
      if (!title || !subject || !type) {
        return res.status(400).json({ error: "Title, subject and type are required" });
      }
      if (!["Notes", "Assignments", "PYQs"].includes(type)) {
        return res.status(400).json({ error: "Invalid resource type. Must be Notes, Assignments, or PYQs" });
      }
      const file = req.file;
      const result = await db.run(
        `INSERT INTO resources (classroom_id, user_id, title, description, subject, type, file_url, file_name, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          classroom_id ? Number(classroom_id) : null,
          req.user.id,
          title.trim(),
          description ? description.trim() : "",
          subject.trim(),
          type,
          file ? `/uploads/${file.filename}` : null,
          file ? file.originalname : null,
          file ? file.size : null
        ]
      );
      const created = await db.get(
        `SELECT r.*, COALESCE(u.name, 'Campus Peer') AS author, 0 AS saved FROM resources r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
        [result.lastID]
      );
      if (broadcast) {
        broadcast({
          type: "RESOURCE_ADDED",
          resource: created,
          classroom_id: created.classroom_id,
          actor: req.user.name || "A classmate"
        });
      }
      res.status(201).json({ resource: created });
    } catch (err) {
      console.error("POST /resources error:", err);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });

  router.post("/:id/save", authRequired, async (req, res) => {
    try {
      const resource = await db.get("SELECT id FROM resources WHERE id = ?", [req.params.id]);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      const existing = await db.get("SELECT 1 FROM saved_resources WHERE user_id = ? AND resource_id = ?", [req.user.id, req.params.id]);
      if (existing) {
        await db.run("DELETE FROM saved_resources WHERE user_id = ? AND resource_id = ?", [req.user.id, req.params.id]);
        return res.json({ saved: false });
      }
      await db.run("INSERT INTO saved_resources (user_id, resource_id) VALUES (?, ?)", [req.user.id, req.params.id]);
      res.json({ saved: true });
    } catch (err) {
      console.error("POST /resources/:id/save error:", err);
      res.status(500).json({ error: "Failed to update save status" });
    }
  });

  router.post("/:id/download", async (req, res) => {
    try {
      await db.run("UPDATE resources SET downloads = downloads + 1 WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error("POST /resources/:id/download error:", err);
      res.status(500).json({ error: "Failed to record download" });
    }
  });

  router.delete("/:id", authRequired, async (req, res) => {
    try {
      const resource = await db.get("SELECT * FROM resources WHERE id = ?", [req.params.id]);
      if (!resource) return res.status(404).json({ error: "Resource not found" });
      if (resource.user_id !== req.user.id) {
        return res.status(403).json({ error: "You can delete only your own uploads" });
      }
      if (resource.file_url) {
        const rel = resource.file_url.replace(/^\/+/, "");
        const p = path.join(backendDir, rel);
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); } catch {}
        }
      }
      await db.run("DELETE FROM saved_resources WHERE resource_id = ?", [req.params.id]);
      await db.run("DELETE FROM resources WHERE id = ?", [req.params.id]);
      if (broadcast) {
        broadcast({
          type: "RESOURCE_DELETED",
          id: req.params.id
        });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /resources/:id error:", err);
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  return router;
}
