import * as React from "react"
import { motion } from "framer-motion"

interface SubjectCardInfo {
  subject: string
  totalCount: number
  notesCount: number
  assignmentsCount: number
  pyqsCount: number
  latestTitle: string
  color: string
}

const PALETTE = [
  "#c4b5fd", // purple
  "#9ee5c3", // mint
  "#f2cd98", // amber
  "#a5d9ef", // sky
  "#f3b4c3", // pink
  "#fed7aa", // orange
  "#d8b4fe", // violet
  "#a7f3d0", // emerald
]

export default function SemesterSubjectsGrid({
  items,
  activeSubject,
  onSelectSubject,
  onAddForSubject,
  onOpenQuiz,
}: {
  items: any[]
  activeSubject: string
  onSelectSubject: (subject: string) => void
  onAddForSubject: (subject: string) => void
  onOpenQuiz: (subject: string) => void
}) {
  const subjectMap = React.useMemo(() => {
    const map = new Map<string, SubjectCardInfo>()

    items.forEach((item, index) => {
      const s = (item.subject || "General").trim()
      if (!map.has(s)) {
        map.set(s, {
          subject: s,
          totalCount: 0,
          notesCount: 0,
          assignmentsCount: 0,
          pyqsCount: 0,
          latestTitle: item.title,
          color: PALETTE[map.size % PALETTE.length],
        })
      }
      const entry = map.get(s)!
      entry.totalCount += 1
      if (item.type === "Notes") entry.notesCount += 1
      if (item.type === "Assignments") entry.assignmentsCount += 1
      if (item.type === "PYQs") entry.pyqsCount += 1
    })

    return Array.from(map.values())
  }, [items])

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "#c4b5fd", textTransform: "uppercase" }}>
            SEMESTER SUBJECT CARDS · AUTOMATICALLY GENERATED
          </span>
          <h2 style={{ fontSize: 20, margin: "2px 0 0", fontWeight: 600 }}>Active Semester Subjects</h2>
        </div>
        <button
          type="button"
          className="button tiny"
          onClick={() => onAddForSubject("")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderColor: "rgba(196,181,253,0.4)",
            color: "#d8cfff",
          }}
        >
          <span>+</span> Add Custom Subject
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
          gap: 14,
        }}
      >
        {subjectMap.map((sub, i) => {
          const isSelected = activeSubject === sub.subject
          return (
            <motion.div
              key={sub.subject}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.25) }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, rgba(196,181,253,0.18), rgba(255,255,255,0.06))"
                  : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                border: isSelected ? "1px solid #c4b5fd" : "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: "16px 18px",
                position: "relative",
                cursor: "pointer",
                boxShadow: isSelected ? "0 8px 24px rgba(196,181,253,0.15)" : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backdropFilter: "blur(14px)",
              }}
              onClick={() => onSelectSubject(isSelected ? "All subjects" : sub.subject)}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: sub.color,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                    }}
                  >
                    ● {sub.subject}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.08)",
                      color: "#c2c5d1",
                    }}
                  >
                    {sub.totalCount} {sub.totalCount === 1 ? "file" : "files"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#f3f4f8",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    marginBottom: 10,
                  }}
                  title={sub.latestTitle}
                >
                  {sub.latestTitle}
                </div>

                <div style={{ display: "flex", gap: 6, fontSize: 10, color: "#9ca0af", marginBottom: 14 }}>
                  <span>{sub.notesCount} notes</span>
                  <span>·</span>
                  <span>{sub.assignmentsCount} assg.</span>
                  <span>·</span>
                  <span>{sub.pyqsCount} pyq</span>
                </div>
              </div>

              {/* Action buttons inside subject card */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  paddingTop: 10,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="button tiny"
                  onClick={() => onAddForSubject(sub.subject)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: "6px 0",
                    fontSize: 11,
                    borderColor: "rgba(196,181,253,0.3)",
                    color: "#d8cfff",
                  }}
                  title={`Upload notes for ${sub.subject}`}
                >
                  <span>+</span> Add Notes
                </button>
                <button
                  type="button"
                  className="button tiny"
                  onClick={() => onOpenQuiz(sub.subject)}
                  style={{
                    padding: "6px 10px",
                    fontSize: 11,
                    borderColor: "rgba(181,232,202,0.3)",
                    color: "#b5e8ca",
                  }}
                  title={`Practice flashcards for ${sub.subject}`}
                >
                  ⚡ Quiz
                </button>
              </div>
            </motion.div>
          )
        })}

        {/* Plus Card to Add Any New Subject */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAddForSubject("")}
          style={{
            border: "1px dashed rgba(255,255,255,0.22)",
            borderRadius: 14,
            padding: "20px 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            cursor: "pointer",
            background: "rgba(255,255,255,0.02)",
            minHeight: 140,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(196,181,253,0.15)",
              color: "#c4b5fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            +
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f3f4f8" }}>Add New Subject</div>
          <div style={{ fontSize: 11, color: "#8a8f9f", marginTop: 4 }}>
            e.g. Design Thinking, Cloud Computing, etc.
          </div>
        </motion.div>
      </div>
    </div>
  )
}
