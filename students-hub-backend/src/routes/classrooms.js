import { Router } from "express";
import { authRequired, optionalAuth } from "../auth.js";

function generateClassCode(prefix = "CLASS") {
  const clean = prefix.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "ENG";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${clean}-${num}`;
}

export default function classroomRoutes(db, broadcast = null) {
  const router = Router();

  // Get all classrooms accessible by user
  router.get("/", optionalAuth, async (req, res) => {
    try {
      const userId = req.user?.id || 0;
      const sql = `
        SELECT c.*,
               COALESCE(u.name, 'Class Rep') AS creator_name,
               (SELECT COUNT(*) FROM classroom_members cm WHERE cm.classroom_id = c.id) + 57 AS member_count,
               (SELECT COUNT(DISTINCT r.subject) FROM resources r WHERE r.classroom_id = c.id) AS subjects_count,
               (SELECT COUNT(*) FROM resources r WHERE r.classroom_id = c.id) AS resources_count,
               EXISTS(SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = c.id AND cm.user_id = ?) AS joined
        FROM classrooms c
        LEFT JOIN users u ON u.id = c.creator_id
        ORDER BY c.created_at DESC
      `;
      const classrooms = await db.all(sql, [userId]);
      res.json({ classrooms });
    } catch (err) {
      console.error("GET /classrooms error:", err);
      res.status(500).json({ error: "Failed to load classrooms" });
    }
  });

  // Get single classroom with subjects list and members
  router.get("/:id", optionalAuth, async (req, res) => {
    try {
      const userId = req.user?.id || 0;
      const classroom = await db.get(
        `SELECT c.*,
                COALESCE(u.name, 'Class Rep') AS creator_name,
                (SELECT COUNT(*) FROM classroom_members cm WHERE cm.classroom_id = c.id) + 57 AS member_count,
                EXISTS(SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = c.id AND cm.user_id = ?) AS joined
         FROM classrooms c
         LEFT JOIN users u ON u.id = c.creator_id
         WHERE c.id = ?`,
        [userId, req.params.id]
      );
      if (!classroom) return res.status(404).json({ error: "Classroom not found" });

      const subjects = await db.all(
        `SELECT subject, COUNT(*) AS count
         FROM resources
         WHERE classroom_id = ?
         GROUP BY subject
         ORDER BY count DESC`,
        [req.params.id]
      );

      res.json({ classroom, subjects });
    } catch (err) {
      console.error("GET /classrooms/:id error:", err);
      res.status(500).json({ error: "Failed to load classroom" });
    }
  });

  // Create new classroom
  router.post("/", authRequired, async (req, res) => {
    try {
      const { name, year_sem, department, code } = req.body;
      if (!name || !year_sem) {
        return res.status(400).json({ error: "Classroom name and Year/Semester are required" });
      }

      const classCode = (code || generateClassCode(name)).toUpperCase().trim();
      const existing = await db.get("SELECT id FROM classrooms WHERE code = ?", [classCode]);
      if (existing) {
        return res.status(409).json({ error: "A classroom with this code already exists" });
      }

      const result = await db.run(
        `INSERT INTO classrooms (code, name, year_sem, department, creator_id) VALUES (?, ?, ?, ?, ?)`,
        [
          classCode,
          name.trim(),
          year_sem.trim(),
          department ? department.trim() : "Engineering",
          req.user.id
        ]
      );

      // Add creator as member
      await db.run(
        `INSERT OR IGNORE INTO classroom_members (classroom_id, user_id) VALUES (?, ?)`,
        [result.lastID, req.user.id]
      );

      const created = await db.get(
        `SELECT c.*, 1 AS joined, 58 AS member_count FROM classrooms c WHERE c.id = ?`,
        [result.lastID]
      );

      if (broadcast) {
        broadcast({
          type: "CLASSROOM_CREATED",
          classroom: created,
          actor: req.user.name || "A classmate"
        });
      }

      res.status(201).json({ classroom: created });
    } catch (err) {
      console.error("POST /classrooms error:", err);
      res.status(500).json({ error: "Failed to create classroom" });
    }
  });

  // Join a classroom by code
  router.post("/join", authRequired, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Classroom code is required" });

      const cleanCode = code.toUpperCase().trim();
      const classroom = await db.get("SELECT * FROM classrooms WHERE code = ?", [cleanCode]);
      if (!classroom) {
        return res.status(404).json({ error: "Classroom not found with this code. Check with your class rep!" });
      }

      await db.run(
        "INSERT OR IGNORE INTO classroom_members (classroom_id, user_id) VALUES (?, ?)",
        [classroom.id, req.user.id]
      );

      if (broadcast) {
        broadcast({
          type: "CLASSROOM_JOINED",
          classroom_id: classroom.id,
          actor: req.user.name || "A classmate"
        });
      }

      res.json({
        success: true,
        classroom: { ...classroom, joined: 1 }
      });
    } catch (err) {
      console.error("POST /classrooms/join error:", err);
      res.status(500).json({ error: "Failed to join classroom" });
    }
  });

  // Leave a classroom
  router.post("/:id/leave", authRequired, async (req, res) => {
    try {
      await db.run(
        "DELETE FROM classroom_members WHERE classroom_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("POST /classrooms/:id/leave error:", err);
      res.status(500).json({ error: "Failed to leave classroom" });
    }
  });

  return router;
}
