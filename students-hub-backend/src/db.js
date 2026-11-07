import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const backendDir = path.resolve(path.dirname(__filename), "..");

export async function createDb() {
  const db = await open({
    filename: path.join(backendDir, "students_hub.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      college TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS classrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      year_sem TEXT NOT NULL,
      department TEXT NOT NULL,
      creator_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS classroom_members (
      classroom_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (classroom_id, user_id),
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classroom_id INTEGER,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      subject TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('Notes','Assignments','PYQs')),
      file_url TEXT, file_name TEXT, file_size INTEGER,
      downloads INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classroom_id INTEGER,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      subject TEXT NOT NULL,
      urgent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS saved_resources (
      user_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );
  `);

  // Safe migration for existing databases:
  try { await db.exec("ALTER TABLE resources ADD COLUMN classroom_id INTEGER"); } catch {}
  try { await db.exec("ALTER TABLE notices ADD COLUMN classroom_id INTEGER"); } catch {}

  await seedInitialData(db);

  return db;
}

async function seedInitialData(db) {
  let user = await db.get("SELECT id FROM users LIMIT 1");
  if (!user) {
    const defaultHash = "$2a$10$eVThQMR80HfG/wYz6h4RX.i4bGcolPwgHqJs.oxmiqdeNGlJydmG2";
    const res = await db.run(
      "INSERT INTO users (name, email, password_hash, college) VALUES (?, ?, ?, ?)",
      ["Campus Community", "community@campus.edu", defaultHash, "Engineering & Technology"]
    );
    user = { id: res.lastID };
  }

  let classroom = await db.get("SELECT id, code FROM classrooms LIMIT 1");
  if (!classroom) {
    const res = await db.run(
      "INSERT INTO classrooms (code, name, year_sem, department, creator_id) VALUES (?, ?, ?, ?, ?)",
      ["CSE5-7892", "3rd Year CSE · 5th Semester", "Year 3 · Sem 5", "Computer Science & Engineering", user.id]
    );
    classroom = { id: res.lastID, code: "CSE5-7892" };
    await db.run(
      "INSERT OR IGNORE INTO classroom_members (classroom_id, user_id) VALUES (?, ?)",
      [classroom.id, user.id]
    );
  }

  const resCount = await db.get("SELECT COUNT(*) AS count FROM resources");
  if (resCount.count === 0) {
    const seeds = [
      {
        title: "Design Thinking · Empathy & Rapid Prototyping",
        type: "Notes",
        subject: "Design Thinking",
        description: "5 Stages of Design Thinking: Empathize, Define, Ideate, Prototype, Test.\n\nKey Concepts:\n1. Empathy Mapping: Says, Thinks, Does, Feels.\n2. Point-of-View (POV) problem statements: [User] needs [Need] because [Insight].\n3. Low-fidelity wireframing vs high-fidelity interactive models.\n4. Fail early, learn quickly through iterative feedback loops.",
        downloads: 58,
        classroom_id: classroom.id
      },
      {
        title: "Machine Learning · Unit 3",
        type: "Notes",
        subject: "Machine Learning",
        description: "A concise guide to supervised learning, decision trees, entropy, and evaluation metrics.\n\nKey ideas:\n• Split data into training and test sets.\n• Compare precision and recall, not just accuracy.\n• Use cross-validation to estimate generalization.\n\nVerified study notes contributed by class toppers.",
        downloads: 42,
        classroom_id: classroom.id
      },
      {
        title: "Database design assignment",
        type: "Assignments",
        subject: "DBMS",
        description: "Worked example: design a library database.\n\n1. Identify entities: Books, Members, Loans.\n2. Use unique primary keys.\n3. Model the loan as a relationship between a member and a book.\n4. Normalize tables up to BCNF to reduce redundancy.",
        downloads: 28,
        classroom_id: classroom.id
      },
      {
        title: "Data Structures · 2025 paper",
        type: "PYQs",
        subject: "Data Structures",
        description: "Sample practice paper · 3 hours · 70 marks\n\n1. Explain stack and queue operations.\n2. Compare merge sort and quicksort.\n3. Implement binary search.\n4. Describe BFS and DFS with examples.\n5. Explain hash collision strategies.",
        downloads: 65,
        classroom_id: classroom.id
      },
      {
        title: "Operating Systems crash notes",
        type: "Notes",
        subject: "Operating Systems",
        description: "Revision checklist:\n\n• Processes and threads\n• CPU scheduling: FCFS, SJF, Round Robin\n• Deadlocks and Banker's algorithm\n• Virtual memory and LRU page replacement\n• File systems and disk scheduling algorithms",
        downloads: 37,
        classroom_id: classroom.id
      },
      {
        title: "Neural networks, made simple",
        type: "Notes",
        subject: "Machine Learning",
        description: "A neuron computes a weighted sum followed by an activation function (ReLU, Sigmoid). Networks learn weights by minimizing loss using backpropagation and gradient descent.",
        downloads: 19,
        classroom_id: classroom.id
      },
      {
        title: "SQL queries · Practice set",
        type: "Assignments",
        subject: "DBMS",
        description: "Practice problems:\n\n1. Select all books with no active loan.\n2. Count loans grouped by member.\n3. Find the most borrowed book.\n4. Use an INNER JOIN to show member names and book titles.",
        downloads: 54,
        classroom_id: classroom.id
      }
    ];

    for (const s of seeds) {
      await db.run(
        "INSERT INTO resources (classroom_id, user_id, title, description, subject, type, downloads) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [s.classroom_id, user.id, s.title, s.description, s.subject, s.type, s.downloads]
      );
    }
  } else {
    // If database already existed, ensure Design Thinking resource and classroom are attached
    const dt = await db.get("SELECT id FROM resources WHERE subject = 'Design Thinking'");
    if (!dt) {
      await db.run(
        "INSERT INTO resources (classroom_id, user_id, title, description, subject, type, downloads) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          classroom.id,
          user.id,
          "Design Thinking · Empathy & Rapid Prototyping",
          "5 Stages of Design Thinking: Empathize, Define, Ideate, Prototype, Test.\n\nKey Concepts:\n1. Empathy Mapping: Says, Thinks, Does, Feels.\n2. Point-of-View (POV) problem statements.\n3. Low-fidelity prototyping vs interactive mockups.\n4. Iterative user testing.",
          "Design Thinking",
          "Notes",
          58
        ]
      );
    }
    // Tag unassigned resources to the default classroom
    await db.run("UPDATE resources SET classroom_id = ? WHERE classroom_id IS NULL", [classroom.id]);
  }

  const noticeCount = await db.get("SELECT COUNT(*) AS count FROM notices");
  if (noticeCount === 0 || !noticeCount.count) {
    const notices = [
      {
        title: "Design Thinking project submission",
        description: "Submit your empathy maps and low-fi prototype photos by Friday 5 PM.",
        subject: "Design Thinking",
        urgent: 1,
        classroom_id: classroom.id
      },
      {
        title: "ML assignment check: tomorrow",
        description: "Get your Machine Learning assignment checked by October 24. Bring your notebook to Lab 3.",
        subject: "Machine Learning",
        urgent: 1,
        classroom_id: classroom.id
      },
      {
        title: "DBMS practice session",
        description: "Join the peer revision session on October 25 at 3 PM in Room 204.",
        subject: "DBMS",
        urgent: 0,
        classroom_id: classroom.id
      }
    ];

    for (const n of notices) {
      await db.run(
        "INSERT INTO notices (classroom_id, user_id, title, description, subject, urgent) VALUES (?, ?, ?, ?, ?, ?)",
        [n.classroom_id, user.id, n.title, n.description, n.subject, n.urgent]
      );
    }
  }
}
