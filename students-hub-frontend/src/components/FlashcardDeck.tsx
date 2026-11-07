import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface Flashcard {
  id: string
  subject: string
  topic: string
  question: string
  answer: string
  keyTakeaway: string
}

const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    subject: "Machine Learning",
    topic: "Supervised Learning",
    question: "What is the difference between Precision and Recall, and when would you optimize for Recall?",
    answer: "Precision is True Positives / (True Positives + False Positives). Recall is True Positives / (True Positives + False Negatives). Optimize for Recall when missing a positive case has severe consequences (e.g., disease diagnosis or fraud detection).",
    keyTakeaway: "Recall = catching every positive; Precision = making sure positives are true.",
  },
  {
    id: "fc-2",
    subject: "DBMS",
    topic: "Normalization",
    question: "What conditions must a relation satisfy to be in Boyce-Codd Normal Form (BCNF)?",
    answer: "A relation is in BCNF if for every non-trivial functional dependency X -> Y, X must be a superkey. BCNF strictly eliminates all redundancy caused by functional dependencies.",
    keyTakeaway: "Every determinant X in functional dependency X -> Y must be a candidate/super key.",
  },
  {
    id: "fc-3",
    subject: "Data Structures",
    topic: "Binary Search Trees",
    question: "What is the worst-case time complexity of searching in an unbalanced BST vs an AVL tree?",
    answer: "In an unbalanced BST, elements can degenerate into a linked list giving O(N) worst-case. In an AVL tree, strict height balancing ensures a worst-case search complexity of O(log N).",
    keyTakeaway: "Self-balancing AVL trees prevent skewing and preserve O(log N) operations.",
  },
  {
    id: "fc-4",
    subject: "Operating Systems",
    topic: "Concurrency & Deadlocks",
    question: "Name the 4 Coffman conditions required for a deadlock to occur in an operating system.",
    answer: "1. Mutual Exclusion (non-shareable resources)\n2. Hold and Wait (processes holding resources while waiting for more)\n3. No Preemption (resources cannot be forcibly confiscated)\n4. Circular Wait (a closed chain of processes waiting on each other)",
    keyTakeaway: "Breaking even one Coffman condition guarantees deadlock cannot occur.",
  },
  {
    id: "fc-5",
    subject: "Machine Learning",
    topic: "Gradient Descent",
    question: "Why do we use the ReLU activation function instead of Sigmoid in deep neural networks?",
    answer: "Sigmoid saturates at both ends causing vanishing gradients where derivatives approach zero. ReLU (f(x) = max(0, x)) has a constant gradient of 1 for positive inputs, enabling deep networks to train much faster.",
    keyTakeaway: "ReLU prevents vanishing gradients and accelerates backpropagation convergence.",
  },
  {
    id: "fc-6",
    subject: "DBMS",
    topic: "Transactions",
    question: "Explain the ACID properties in database transaction management.",
    answer: "Atomicity: all-or-nothing execution.\nConsistency: preserves integrity constraints before & after.\nIsolation: concurrent transactions execute without interference.\nDurability: committed changes persist through crashes.",
    keyTakeaway: "ACID guarantees database reliability even amid power failures or concurrent queries.",
  },
]

export default function FlashcardDeck({
  subject = "All subjects",
  onClose,
}: {
  subject?: string
  onClose: () => void
}) {
  const [cards, setCards] = React.useState<Flashcard[]>(() => {
    return subject === "All subjects"
      ? DEFAULT_FLASHCARDS
      : DEFAULT_FLASHCARDS.filter((c) => c.subject === subject)
  })
  const [index, setIndex] = React.useState(0)
  const [isFlipped, setIsFlipped] = React.useState(false)
  const [mastered, setMastered] = React.useState<string[]>([])
  const [needsReview, setNeedsReview] = React.useState<string[]>([])

  const current = cards[index] || cards[0]

  const nextCard = () => {
    setIsFlipped(false)
    setIndex((i) => (i + 1) % cards.length)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setIndex((i) => (i - 1 + cards.length) % cards.length)
  }

  const markMastered = () => {
    if (current && !mastered.includes(current.id)) {
      setMastered((prev) => [...prev, current.id])
      setNeedsReview((prev) => prev.filter((id) => id !== current.id))
    }
    nextCard()
  }

  const markReview = () => {
    if (current && !needsReview.includes(current.id)) {
      setNeedsReview((prev) => [...prev, current.id])
      setMastered((prev) => prev.filter((id) => id !== current.id))
    }
    nextCard()
  }

  const progressPercent = Math.round((mastered.length / cards.length) * 100)

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 12, 17, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          width: 580,
          maxWidth: "100%",
          background: "linear-gradient(150deg, #1d202bf0, #13151ef8)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
          color: "#f3f4f6",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#c4b5fd", textTransform: "uppercase" }}>
              Exam Sprint · Quick Concept Mastery
            </div>
            <h2 style={{ fontSize: 22, margin: "4px 0 0", fontWeight: 600 }}>Interactive Flashcards</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#c2c5d1",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Close
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca0af", marginBottom: 6 }}>
            <span>Card {index + 1} of {cards.length}</span>
            <span>Mastery: {progressPercent}% ({mastered.length} mastered)</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", background: "#c4b5fd", borderRadius: 99 }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 3D Flip Card Container */}
        <div style={{ perspective: 1200, minHeight: 280, cursor: "pointer" }} onClick={() => setIsFlipped((f) => !f)}>
          <motion.div
            style={{
              position: "relative",
              width: "100%",
              minHeight: 280,
              transformStyle: "preserve-3d",
              borderRadius: 16,
            }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Front of Card */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                borderRadius: 16,
                padding: 24,
                background: "linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>{current?.subject}</span>
                  <span style={{ fontSize: 10, color: "#9ca0af", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4 }}>
                    {current?.topic}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, lineHeight: 1.45, fontWeight: 500, marginTop: 12 }}>
                  {current?.question}
                </h3>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#9ca0af", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span>💡 Click card to flip and reveal answer</span>
                <span>Spacebar or Tap</span>
              </div>
            </div>

            {/* Back of Card */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderRadius: 16,
                padding: 24,
                background: "linear-gradient(135deg, rgba(196,181,253,0.12), rgba(255,255,255,0.03))",
                border: "1px solid rgba(196,181,253,0.35)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#b5e8ca", fontWeight: 600, marginBottom: 8 }}>
                  ✓ Core Concept Explanation
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#e3e5ed", whiteSpace: "pre-line", margin: "6px 0 12px" }}>
                  {current?.answer}
                </p>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 11,
                    color: "#baa9e8",
                  }}
                >
                  <strong>Takeaway:</strong> {current?.keyTakeaway}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#9ca0af", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span>Rate your recall below</span>
                <span>Click card to return</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={prevCard}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#e2e4ec",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={nextCard}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#e2e4ec",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Next →
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={markReview}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid rgba(239, 68, 68, 0.4)",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#fca5a5",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Needs Review
            </button>
            <button
              type="button"
              onClick={markMastered}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid rgba(181, 232, 202, 0.4)",
                background: "#b5e8ca",
                color: "#182a20",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Mastered ✓
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
