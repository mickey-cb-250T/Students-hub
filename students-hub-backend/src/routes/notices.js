import { Router } from "express";
import { authRequired } from "../auth.js";

const router = Router();

export default function noticeRoutes(db) {
  router.get("/", async (req, res) => {
    try {
      const notices = await db.all(`
        SELECT n.*,
               COALESCE(u.name, 'Campus Community') AS author
        FROM notices n
        LEFT JOIN users u ON u.id = n.user_id
        ORDER BY n.urgent DESC, n.created_at DESC
      `);
      res.json({ notices });
    } catch (err) {
      console.error("GET /notices error:", err);
      res.status(500).json({ error: "Failed to load notices" });
    }
  });

  router.post("/", authRequired, async (req, res) => {
    try {
      const { title, description, subject, urgent } = req.body;
      if (!title || !description || !subject) {
        return res.status(400).json({ error: "Title, description and subject are required" });
      }
      const result = await db.run(
        "INSERT INTO notices (user_id, title, description, subject, urgent) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, title.trim(), description.trim(), subject.trim(), urgent ? 1 : 0]
      );
      const notice = await db.get(
        `SELECT n.*, COALESCE(u.name, 'Campus Community') AS author FROM notices n LEFT JOIN users u ON u.id = n.user_id WHERE n.id = ?`,
        [result.lastID]
      );
      res.status(201).json({ notice });
    } catch (err) {
      console.error("POST /notices error:", err);
      res.status(500).json({ error: "Failed to post notice" });
    }
  });

  router.delete("/:id", authRequired, async (req, res) => {
    try {
      const notice = await db.get("SELECT * FROM notices WHERE id = ?", [req.params.id]);
      if (!notice) return res.status(404).json({ error: "Notice not found" });
      if (notice.user_id !== req.user.id) {
        return res.status(403).json({ error: "You can delete only your own notices" });
      }
      await db.run("DELETE FROM notices WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /notices/:id error:", err);
      res.status(500).json({ error: "Failed to delete notice" });
    }
  });

  return router;
}
