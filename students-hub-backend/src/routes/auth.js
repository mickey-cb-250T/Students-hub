import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRequired } from "../auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "students_hub_jwt_super_secret_key_2026";
const router = Router();

export default function authRoutes(db) {
  router.post("/register", async (req, res) => {
    try {
      const { name, email, password, college } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await db.get("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }
      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.run(
        "INSERT INTO users (name, email, password_hash, college) VALUES (?, ?, ?, ?)",
        [name.trim(), normalizedEmail, password_hash, college ? college.trim() : null]
      );
      const token = jwt.sign(
        { id: result.lastID, name: name.trim(), email: normalizedEmail },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.status(201).json({
        token,
        user: { id: result.lastID, name: name.trim(), email: normalizedEmail, college: college ? college.trim() : null }
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.get("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, college: user.college }
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  router.get("/me", authRequired, async (req, res) => {
    try {
      const user = await db.get("SELECT id, name, email, college FROM users WHERE id = ?", [req.user.id]);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user });
    } catch (err) {
      console.error("GET /me error:", err);
      res.status(500).json({ error: "Failed to retrieve profile" });
    }
  });

  return router;
}
