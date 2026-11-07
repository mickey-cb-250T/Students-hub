import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface Classroom {
  id: number
  code: string
  name: string
  year_sem: string
  department: string
  member_count: number
  subjects_count?: number
  resources_count?: number
  joined?: boolean | number
  creator_name?: string
}

interface ClassroomManagerProps {
  classrooms: Classroom[]
  activeClassroom: Classroom | null
  onSelectClassroom: (classroom: Classroom | null) => void
  onJoinSuccess: (classroom: Classroom) => void
  onCreateSuccess: (classroom: Classroom) => void
  token?: string | null
  API: string
  notify: (msg: string) => void
}

export default function ClassroomManager({
  classrooms,
  activeClassroom,
  onSelectClassroom,
  onJoinSuccess,
  onCreateSuccess,
  token,
  API,
  notify,
}: ClassroomManagerProps) {
  const [modal, setModal] = React.useState<"join" | "create" | "invite" | null>(null)
  const [joinCode, setJoinCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [yearSem, setYearSem] = React.useState("Year 3 · Sem 5")
  const [department, setDepartment] = React.useState("Computer Science & Engineering")
  const [customCode, setCustomCode] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setError("")
    setBusy(true)
    try {
      if (!token) {
        // Guest mode fallback
        const codeClean = joinCode.trim().toUpperCase()
        const existing = classrooms.find((c) => c.code.toUpperCase() === codeClean)
        if (existing) {
          onJoinSuccess(existing)
          onSelectClassroom(existing)
          notify(`Joined classroom: ${existing.name}!`)
          setModal(null)
          setJoinCode("")
        } else {
          // Allow joining dynamically
          const mockClass: Classroom = {
            id: Date.now(),
            code: codeClean,
            name: `${codeClean} Common Room`,
            year_sem: "Semester Class",
            department: "Engineering",
            member_count: 58,
            joined: true,
          }
          onJoinSuccess(mockClass)
          onSelectClassroom(mockClass)
          notify(`Joined classroom: ${mockClass.name}!`)
          setModal(null)
          setJoinCode("")
        }
        return
      }

      const res = await fetch(`${API}/classrooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to join classroom")
      onJoinSuccess(data.classroom)
      onSelectClassroom(data.classroom)
      notify(`Successfully joined ${data.classroom.name}!`)
      setModal(null)
      setJoinCode("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join classroom")
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !yearSem.trim()) return
    setError("")
    setBusy(true)
    try {
      if (!token) {
        const codeGenerated = (customCode.trim() || `${name.replace(/[^a-zA-Z]/g, "").slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase()
        const newClass: Classroom = {
          id: Date.now(),
          code: codeGenerated,
          name: name.trim(),
          year_sem: yearSem.trim(),
          department: department.trim(),
          member_count: 1,
          joined: true,
        }
        onCreateSuccess(newClass)
        onSelectClassroom(newClass)
        notify(`Classroom created! Share code: ${newClass.code}`)
        setModal("invite")
        return
      }

      const res = await fetch(`${API}/classrooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          year_sem: yearSem.trim(),
          department: department.trim(),
          code: customCode.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create classroom")
      onCreateSuccess(data.classroom)
      onSelectClassroom(data.classroom)
      notify(`Classroom created! Share code: ${data.classroom.code}`)
      setModal("invite")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create classroom")
    } finally {
      setBusy(false)
    }
  }

  const copyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code)
      notify(`Classroom code ${code} copied! Share it with your classmates.`)
    } catch {
      notify(`Classroom code is: ${code}`)
    }
  }

  return (
    <>
      {/* Classroom Switcher Bar / Dropdown in Workspace */}
      <div
        className="classroom-hub-card"
        style={{
          background: "linear-gradient(135deg, rgba(196,181,253,0.12), rgba(255,255,255,0.03))",
          border: "1px solid rgba(196,181,253,0.25)",
          borderRadius: 14,
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="classroom-hub-info" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#c4b5fd",
              color: "#1d1929",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            🏛️
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#f3f4f8" }}>
                {activeClassroom ? activeClassroom.name : "All Campus Repository"}
              </span>
              {activeClassroom && (
                <button
                  type="button"
                  onClick={() => copyCode(activeClassroom.code)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(196,181,253,0.15)",
                    border: "1px solid rgba(196,181,253,0.3)",
                    borderRadius: 6,
                    padding: "2px 7px",
                    color: "#d8cfff",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Click to copy invite code"
                >
                  Code: {activeClassroom.code} 📋
                </button>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#9da1b2", marginTop: 2 }}>
              {activeClassroom ? (
                <>
                  {activeClassroom.year_sem} · {activeClassroom.department} ·{" "}
                  <strong style={{ color: "#b5e8ca" }}>
                    {activeClassroom.member_count || 58} classmates joined
                  </strong>
                </>
              ) : (
                "Showing public notes and papers from all semesters"
              )}
            </div>
          </div>
        </div>

        <div className="classroom-hub-controls" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Classroom Selector */}
          <select
            className="input tiny"
            aria-label="Switch classroom"
            value={activeClassroom ? String(activeClassroom.id) : "all"}
            onChange={(e) => {
              if (e.target.value === "all") {
                onSelectClassroom(null)
              } else {
                const found = classrooms.find((c) => String(c.id) === e.target.value)
                if (found) onSelectClassroom(found)
              }
            }}
            style={{ padding: "7px 12px", fontSize: 12, minWidth: 160 }}
          >
            <option value="all">🌐 All Campus Materials</option>
            {classrooms.map((c) => (
              <option key={c.id} value={String(c.id)}>
                🏛️ {c.name} ({c.code})
              </option>
            ))}
          </select>

          <div className="classroom-hub-buttons" style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="button tiny"
              onClick={() => setModal("join")}
              style={{ padding: "7px 12px", fontSize: 12 }}
            >
              🔑 Join by code
            </button>
            <button
              type="button"
              className="primary tiny"
              onClick={() => setModal("create")}
              style={{ padding: "7px 12px", fontSize: 12 }}
            >
              + Create Class
            </button>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      <AnimatePresence>
        {modal === "join" && (
          <div className="overlay" onClick={() => setModal(null)}>
            <motion.div
              className="dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="between">
                <h2>Join Your Classroom</h2>
                <button className="button" onClick={() => setModal(null)}>
                  Close
                </button>
              </div>
              <p className="tiny muted" style={{ marginTop: 8 }}>
                Enter the classroom code provided by your classmate or class representative to access your semester notes, assignments, and exam papers.
              </p>
              <form onSubmit={handleJoin} style={{ marginTop: 18 }}>
                <label>
                  Classroom Code
                  <input
                    className="input"
                    required
                    placeholder="e.g. CSE5-7892"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    style={{ textTransform: "uppercase", fontSize: 16, letterSpacing: 1 }}
                    autoFocus
                  />
                </label>
                <div style={{ fontSize: 11, color: "#9da1b2" }}>
                  💡 Tip: For 3rd Year 5th Sem, try default code:{" "}
                  <button
                    type="button"
                    onClick={() => setJoinCode("CSE5-7892")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#c4b5fd",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    CSE5-7892
                  </button>
                </div>
                {error && <p style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}
                <button type="submit" disabled={busy} className="primary" style={{ marginTop: 10 }}>
                  {busy ? "Joining…" : "Join Classroom"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {modal === "create" && (
          <div className="overlay" onClick={() => setModal(null)}>
            <motion.div
              className="dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="between">
                <h2>Create a Semester Classroom</h2>
                <button className="button" onClick={() => setModal(null)}>
                  Close
                </button>
              </div>
              <p className="tiny muted" style={{ marginTop: 8 }}>
                Set up a dedicated hub for all 50+ students in your class. When anyone posts notes, past papers, or assignments for any subject, cards are automatically prepared for everyone.
              </p>
              <form onSubmit={handleCreate} style={{ marginTop: 18 }}>
                <label>
                  Classroom Title
                  <input
                    className="input"
                    required
                    placeholder="e.g. 3rd Year CSE · 5th Semester"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <label style={{ flex: "1 1 160px", minWidth: 0 }}>
                    Year & Semester
                    <input
                      className="input"
                      required
                      placeholder="e.g. Year 3 · Sem 5"
                      value={yearSem}
                      onChange={(e) => setYearSem(e.target.value)}
                    />
                  </label>
                  <label style={{ flex: "1 1 160px", minWidth: 0 }}>
                    Department / Branch
                    <input
                      className="input"
                      placeholder="e.g. Computer Engineering"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Custom Joining Code (Optional)
                  <input
                    className="input"
                    placeholder="Leave blank for auto-generated code"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    style={{ textTransform: "uppercase" }}
                  />
                </label>
                {error && <p style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}
                <button type="submit" disabled={busy} className="primary" style={{ marginTop: 10 }}>
                  {busy ? "Creating…" : "Create & Get Join Code"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {modal === "invite" && activeClassroom && (
          <div className="overlay" onClick={() => setModal(null)}>
            <motion.div
              className="dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="between">
                <h2>Classroom Ready! 🎉</h2>
                <button className="button" onClick={() => setModal(null)}>
                  Done
                </button>
              </div>
              <p className="muted" style={{ margin: "14px 0" }}>
                <strong>{activeClassroom.name}</strong> is live. Share this code with your batchmates on WhatsApp or Discord:
              </p>
              <div
                style={{
                  background: "rgba(196,181,253,0.15)",
                  border: "2px dashed #c4b5fd",
                  borderRadius: 12,
                  padding: "20px",
                  textAlign: "center",
                  margin: "16px 0",
                }}
              >
                <div style={{ fontSize: 11, color: "#baa9e8", letterSpacing: 2 }}>STUDENT INVITE CODE</div>
                <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 3, margin: "8px 0", color: "#f3f4f8" }}>
                  {activeClassroom.code}
                </div>
                <button
                  type="button"
                  className="primary"
                  onClick={() => copyCode(activeClassroom.code)}
                  style={{ marginTop: 8 }}
                >
                  📋 Copy Code to Clipboard
                </button>
              </div>
              <p className="tiny muted">
                Classmates can enter this code under &ldquo;Join by code&rdquo; to immediately collaborate and access notes.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
