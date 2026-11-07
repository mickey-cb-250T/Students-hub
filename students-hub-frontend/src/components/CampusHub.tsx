import * as React from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import FocusPod from "./FocusPod"
import FlashcardDeck from "./FlashcardDeck"
import ClassroomManager, { Classroom } from "./ClassroomManager"
import SemesterSubjectsGrid from "./SemesterSubjectsGrid"
import { useRealtime, RealtimeEvent } from "./useRealtime"
import PWAInstallButton from "./PWAInstallButton"

function ScrollJourney({
    onEnter,
    onBrowse,
}: {
    onEnter: () => void
    onBrowse: (category: string) => void
}) {
    const desk = React.useRef<HTMLDivElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const deskStickyRef = React.useRef<HTMLElement>(null)
    const introRef = React.useRef<HTMLDivElement>(null)
    const stageRef = React.useRef<HTMLDivElement>(null)
    const cardRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const reminderRef = React.useRef<HTMLDivElement>(null)
    const footerRef = React.useRef<HTMLElement>(null)
    const dotsRef = React.useRef<HTMLDivElement>(null)

    const reduced = useReducedMotion()
    const [reset, setReset] = React.useState(0),
        [front, setFront] = React.useState("Notes"),
        [checked, setChecked] = React.useState(false),
        [surprise, setSurprise] = React.useState(-1),
        [detail, setDetail] = React.useState<any>(null)
    const cards = [
        {
            category: "Notes",
            color: "#d4c5ff",
            title: "That one topic?",
            subtitle: "Someone’s already made it click.",
            tag: "PEER-TO-PEER CLARITY",
            number: "01",
            angle: -9,
        },
        {
            category: "Assignments",
            color: "#b5e8ca",
            title: "Stuck on step 3?",
            subtitle: "See the process. Find your way.",
            tag: "UNDERSTAND THE WHY",
            number: "02",
            angle: 6,
        },
        {
            category: "PYQs",
            color: "#f6d59d",
            title: "Meet your next exam.",
            subtitle: "Before it meets you.",
            tag: "PRACTICE > PANIC",
            number: "03",
            angle: -5,
        },
    ]
    const prompts = [
        "Explain one concept to an imaginary first-year student. If it makes sense out loud, it’s clicking.",
        "Pick one past-paper question. Give yourself 10 minutes. No notes, just a first attempt.",
        "Share one page you wish you had last week. Your classmates will thank you.",
        "Take a breath. Unclench your jaw. One small topic at a time.",
    ]

    // Story scroll animation loop (lerp + smoothstep, inspired by my-portfolio.html)
    React.useEffect(() => {
        if (reduced) return

        let current = 0
        let reqId: number

        const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
        const sg = (p: number, a: number, b: number) => {
            const t = cl((p - a) / (b - a))
            return t * t * (3 - 2 * t)
        }

        const render = () => {
            const track = trackRef.current
            if (track) {
                const rect = track.getBoundingClientRect()
                const maxScroll = rect.height - window.innerHeight
                const target = maxScroll > 0 ? cl(-rect.top / maxScroll, 0, 1) : 0
                current += (target - current) * 0.085
                if (Math.abs(target - current) < 0.0001) current = target
                const p = current

                // Stage 1: Welcome Intro
                if (introRef.current) {
                    const introFade = sg(p, 0.12, 0.30)
                    introRef.current.style.opacity = String(1 - introFade)
                    introRef.current.style.transform = `translateY(${-introFade * 60}px) scale(${1 - introFade * 0.05})`
                    introRef.current.style.pointerEvents = introFade > 0.85 ? "none" : "auto"
                }

                // Stage 2: Desk Content (Playground & Tools)
                if (stageRef.current) {
                    const stageIn = sg(p, 0.18, 0.34)
                    const stageOut = sg(p, 0.86, 1.0)
                    const stageOpacity = stageIn * (1 - stageOut)
                    const stageY = (1 - stageIn) * 70 - stageOut * 60
                    stageRef.current.style.opacity = String(stageOpacity)
                    stageRef.current.style.transform = `translateY(${stageY}px) scale(${1 - stageOut * 0.03})`
                    stageRef.current.style.pointerEvents = stageOpacity > 0.4 ? "auto" : "none"
                }

                // Staggered Cards (Notes -> Assignments -> PYQs)
                const cardThresholds = [
                    [0.22, 0.36],
                    [0.30, 0.44],
                    [0.38, 0.52],
                ]
                cardRefs.current.forEach((el, idx) => {
                    if (el) {
                        const [start, end] = cardThresholds[idx] || [0.24, 0.42]
                        const cardProgress = sg(p, start, end)
                        el.style.opacity = String(cardProgress)
                        el.style.transform = `translateY(${(1 - cardProgress) * 55}px)`
                    }
                })

                // Reminder note
                if (reminderRef.current) {
                    const reminderProgress = sg(p, 0.44, 0.58)
                    reminderRef.current.style.opacity = String(reminderProgress)
                    reminderRef.current.style.transform = `translateX(${(1 - reminderProgress) * 50}px) translateY(${(1 - reminderProgress) * 15}px)`
                }

                // Stage 3: Footer CTA
                if (footerRef.current) {
                    const footerIn = sg(p, 0.62, 0.78)
                    const footerOut = sg(p, 0.90, 1.0)
                    footerRef.current.style.opacity = String(footerIn * (1 - footerOut))
                    footerRef.current.style.transform = `translateY(${(1 - footerIn) * 20}px)`
                }

                // Navigation Dots indicator
                if (dotsRef.current) {
                    const dots = dotsRef.current.querySelectorAll(".dot")
                    const stageIdx = p < 0.22 ? 0 : p < 0.84 ? 1 : 2
                    dots.forEach((d, i) => {
                        if (i === stageIdx) {
                            d.classList.add("active")
                        } else {
                            d.classList.remove("active")
                        }
                    })
                }
            }
            reqId = requestAnimationFrame(render)
        }

        reqId = requestAnimationFrame(render)
        return () => cancelAnimationFrame(reqId)
    }, [reduced])

    return (
        <div className="campus-journey-track" ref={trackRef}>
            <section className="campus-desk sticky-desk" ref={deskStickyRef}>
                <div className="desk-grid" aria-hidden="true" />
                <div className="desk-aura" aria-hidden="true" />
                <header className="desk-header">
                    <span className="journey-brand">c/ campus.</span>
                    <div className="desk-stage-indicator">
                        <span className="desk-status">
                            <i />
                            THE COMMON ROOM IS OPEN
                        </span>
                        <div ref={dotsRef} className="desk-dots">
                            <button
                                type="button"
                                className="dot active"
                                title="Welcome Intro"
                                onClick={() => {
                                    window.scrollTo({ top: 0, behavior: "smooth" })
                                }}
                            />
                            <button
                                type="button"
                                className="dot"
                                title="Common Desk"
                                onClick={() => {
                                    if (trackRef.current) {
                                        const y = trackRef.current.offsetTop + window.innerHeight * 1.3
                                        window.scrollTo({ top: y, behavior: "smooth" })
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="dot"
                                title="Workspace"
                                onClick={onEnter}
                            />
                        </div>
                    </div>
                    <button className="journey-skip" onClick={onEnter}>
                        Go to workspace <span>→</span>
                    </button>
                </header>

                <div className="desk-viewport-body">
                    {/* Stage 1: Welcome Intro */}
                    <div ref={introRef} className="desk-intro desk-intro-floating">
                        <div className="desk-eyebrow">
                            YOUR PEOPLE. YOUR NOTES. YOUR LITTLE ADVANTAGE.
                        </div>
                        <h1>
                            Big semester energy.
                            <br />
                            <span>Small desk chaos.</span>
                        </h1>
                        <p>
                            Pull up a chair. Borrow a little clarity. Leave some for the
                            next person.
                        </p>
                        <button
                            type="button"
                            className="desk-scroll-cue"
                            onClick={() => {
                                if (trackRef.current) {
                                    const y = trackRef.current.offsetTop + window.innerHeight * 1.2
                                    window.scrollTo({ top: y, behavior: "smooth" })
                                }
                            }}
                        >
                            <span>SCROLL TO UNPACK DESK</span>
                            <span className="cue-arrow">↓</span>
                        </button>
                    </div>

                    {/* Stage 2: Interactive Desk with Study Cards */}
                    <div ref={stageRef} className="desk-stage-content">
                        <div className="desk-tools">
                            <span>THIS DESK IS YOURS TO MESS WITH</span>
                            <button
                                onClick={() => {
                                    setReset((v) => v + 1)
                                    setFront("Notes")
                                }}
                            >
                                Tidy desk
                            </button>
                        </div>
                        <div ref={desk} className="desk-playground">
                            <div className="desk-outline" aria-hidden="true" />
                            <span className="desk-doodle doodle-one" aria-hidden="true">
                                less panic.
                                <br />
                                more “ohhh, got it.”
                            </span>
                            {cards.map((card, i) => (
                                <div
                                    key={card.category + "-" + reset}
                                    ref={(el) => {
                                        cardRefs.current[i] = el
                                    }}
                                    className={"desk-paper-slot desk-paper-slot-" + i}
                                >
                                    <motion.article
                                        drag
                                        dragConstraints={desk}
                                        dragElastic={0.08}
                                        dragMomentum={false}
                                        onPointerDown={() => setFront(card.category)}
                                        className={"desk-paper desk-paper-" + i}
                                        initial={false}
                                        animate={{ rotate: card.angle }}
                                        whileHover={reduced ? undefined : { rotate: 0, y: -9, scale: 1.02 }}
                                        whileDrag={{
                                            scale: 1.06,
                                            rotate: 0,
                                            cursor: "grabbing",
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20,
                                        }}
                                        style={{
                                            background: card.color,
                                            zIndex: front === card.category ? 8 : 4 - i,
                                        }}
                                        aria-label={card.category + " draggable card"}
                                    >
                                        <div className="desk-paper-top">
                                            <span>{card.tag}</span>
                                            <span>{card.number}</span>
                                        </div>
                                        <div className="desk-paper-category">
                                            {card.category === "PYQs"
                                                ? "PAST PAPERS"
                                                : card.category.toUpperCase()}
                                        </div>
                                        <h2>{card.title}</h2>
                                        <p>{card.subtitle}</p>
                                        <div
                                            className={"desk-mini-art mini-" + i}
                                            aria-hidden="true"
                                        >
                                            {i === 0 ? (
                                                <>
                                                    <span>Aa</span>
                                                    <i />
                                                    <i />
                                                    <i />
                                                </>
                                            ) : i === 1 ? (
                                                <>
                                                    <b>01</b>
                                                    <b>02</b>
                                                    <b>03</b>
                                                    <span>make it make sense.</span>
                                                </>
                                            ) : (
                                                <>
                                                    <b>?</b>
                                                    <span>you’ve got this.</span>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            className="desk-paper-open"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={() => setDetail(card)}
                                        >
                                            Take a peek <span>+</span>
                                        </button>
                                    </motion.article>
                                </div>
                            ))}
                            <div ref={reminderRef} className="desk-reminder-slot">
                                <motion.div
                                    key={"notice" + reset}
                                    drag
                                    dragConstraints={desk}
                                    dragMomentum={false}
                                    dragElastic={0.08}
                                    className="desk-reminder"
                                    whileDrag={{ scale: 1.04 }}
                                >
                                    <div className="desk-tape" aria-hidden="true" />
                                    <span className="desk-reminder-label">
                                        A HEADS-UP FROM YOUR PEOPLE
                                    </span>
                                    <h3>
                                        ML assignment
                                        <br />
                                        check tomorrow.
                                    </h3>
                                    <p>
                                        Demo reminder · Lab 3<br />
                                        Bring your notebook.
                                    </p>
                                    <button
                                        aria-pressed={checked}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={() => setChecked((c) => !c)}
                                    >
                                        {checked
                                            ? "Noted. You’re on it."
                                            : "Got it, remind me here"}
                                    </button>
                                    <span className="desk-reminder-foot">
                                        {checked
                                            ? "Marked as seen for this visit"
                                            : "Tap to mark as seen"}
                                    </span>
                                </motion.div>
                            </div>
                            <button
                                className="desk-surprise"
                                onClick={() => setSurprise((v) => (v + 1) % prompts.length)}
                            >
                                <span className="surprise-shape" aria-hidden="true">
                                    ?
                                </span>
                                <span>
                                    A tiny study nudge
                                    <br />
                                    <b>Click for a little momentum</b>
                                </span>
                            </button>
                            {surprise >= 0 && (
                                <div className="desk-nudge" role="status">
                                    <button
                                        aria-label="Close study prompt"
                                        onClick={() => setSurprise(-1)}
                                    >
                                        Close
                                    </button>
                                    <span>YOUR NEXT SMALL WIN</span>
                                    <p>{prompts[surprise]}</p>
                                </div>
                            )}
                            <span className="desk-drag-hint">
                                Drag the cards. Follow your curiosity.
                            </span>
                        </div>
                    </div>
                </div>

                <footer ref={footerRef} className="desk-footer">
                    <span>NO GATEKEEPING. JUST GOOD NOTES.</span>
                    <button onClick={onEnter}>
                        Find your next “I get it” moment <span>Open workspace ↓</span>
                    </button>
                    <span>MADE FOR THE NIGHT BEFORE.</span>
                </footer>
            </section>

            {detail && (
                <div className="overlay" onClick={() => setDetail(null)}>
                    <div
                        className="dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-label={detail.category + " preview"}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="between">
                            <span style={{ color: detail.color, fontSize: 12 }}>
                                {detail.category === "PYQs"
                                    ? "Previous year papers"
                                    : detail.category}
                            </span>
                            <button
                                className="button"
                                autoFocus
                                onClick={() => setDetail(null)}
                            >
                                Close
                            </button>
                        </div>
                        <h2 style={{ fontSize: 30, marginTop: 25 }}>
                            {detail.title}
                        </h2>
                        <p className="muted">
                            {detail.category === "Notes"
                                ? "Peer-made explanations, revision sheets, and the concepts that finally clicked. Search by subject and save what helps."
                                : detail.category === "Assignments"
                                  ? "Worked examples that help you understand the approach. Share only your own work or content you have permission to distribute."
                                  : "Sample practice papers to help you spot patterns and revise with a little more confidence."}
                        </p>
                        <button
                            className="primary"
                            onClick={() => {
                                onBrowse(detail.category)
                                setDetail(null)
                            }}
                        >
                            Explore{" "}
                            {detail.category === "PYQs"
                                ? "past papers"
                                : detail.category.toLowerCase()}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
interface Props {
    title?: string
    style?: React.CSSProperties
    token?: string | null
    onSignOut?: () => void
    onRequireLogin?: () => void
}

const API = (import.meta.env.VITE_API_URL?.trim() || "/api").replace(/\/$/, "")

function formatDisplayDate(dateStr?: string) {
    if (!dateStr) return "Just now"
    try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return dateStr
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return `${months[d.getMonth()]} ${d.getDate()}`
    } catch {
        return dateStr
    }
}

function getInitials(name?: string) {
    if (!name) return "PP"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function normalizeResource(item: any) {
    const typeColors: Record<string, string> = {
        Notes: "#c4b5fd",
        Assignments: "#9ee5c3",
        PYQs: "#f2cd98",
    }
    return {
        ...item,
        id: String(item.id),
        color: item.color || typeColors[item.type] || "#c4b5fd",
        pages: item.file_size
            ? `${Math.ceil(item.file_size / 1024)} KB`
            : (item.pages || "Study Sheet"),
        date: item.created_at ? formatDisplayDate(item.created_at) : (item.date || "Just now"),
        author: item.author || "Campus Peer",
        url: item.file_url ? (item.file_url.startsWith("http") ? item.file_url : item.file_url) : (item.url || ""),
        filename: item.file_name || item.filename || (item.file_url ? item.file_url.split("/").pop() : ""),
        downloads: item.downloads || 0,
        saved: Boolean(item.saved),
    }
}

function normalizeNotice(n: any) {
    return {
        ...n,
        id: String(n.id),
        urgent: Boolean(n.urgent),
        date: n.created_at ? formatDisplayDate(n.created_at) : (n.date || "Today"),
        author: n.author || "Campus Community",
    }
}
const seeds = [
    {
        id: "dt-1",
        title: "Design Thinking · Empathy & Rapid Prototyping",
        type: "Notes",
        subject: "Design Thinking",
        description:
            "5 Stages of Design Thinking: Empathize, Define, Ideate, Prototype, Test.\n\nKey Concepts:\n1. Empathy Mapping: Says, Thinks, Does, Feels.\n2. Point-of-View (POV) problem statements: [User] needs [Need] because [Insight].\n3. Low-fidelity wireframing vs high-fidelity interactive models.\n4. Fail early, learn quickly through iterative feedback loops.",
        author: "Dev Patel",
        date: "Oct 24",
        pages: "10 pages",
        color: "#f3b4c3",
    },
    {
        id: "1",
        title: "Machine Learning · Unit 3",
        type: "Notes",
        subject: "Machine Learning",
        description:
            "A concise guide to supervised learning, decision trees, entropy, and evaluation metrics.\n\nKey ideas\n• Split data into training and test sets.\n• Compare precision and recall, not just accuracy.\n• Use cross-validation to estimate generalization.\n\nThese are sample study notes. Verify concepts with your course material.",
        author: "Ananya Sharma",
        date: "Oct 23",
        pages: "12 pages",
        color: "#c4b5fd",
    },
    {
        id: "2",
        title: "Database design assignment",
        type: "Assignments",
        subject: "DBMS",
        description:
            "Worked example: design a library database.\n\n1. Identify entities: Books, Members, Loans.\n2. Use unique primary keys.\n3. Model the loan as a relationship between a member and a book.\n4. Normalize tables to reduce redundancy.\n\nUse this example to learn the approach, not as a submission to copy.",
        author: "Rohan Mehta",
        date: "Oct 22",
        pages: "8 pages",
        color: "#9ee5c3",
    },
    {
        id: "3",
        title: "Data Structures · 2025 paper",
        type: "PYQs",
        subject: "Data Structures",
        description:
            "Sample practice paper · 3 hours · 70 marks\n\n1. Explain stack and queue operations.\n2. Compare merge sort and quicksort.\n3. Implement binary search.\n4. Describe BFS and DFS with examples.\n5. Explain hash collision strategies.\n\nDemo practice material, not an official university paper.",
        author: "Ishita Verma",
        date: "Oct 21",
        pages: "4 pages",
        color: "#f2cd98",
    },
    {
        id: "4",
        title: "Operating Systems crash notes",
        type: "Notes",
        subject: "Operating Systems",
        description:
            "Revision checklist\n\nProcesses and threads\nCPU scheduling: FCFS, SJF, Round Robin\nDeadlocks and prevention\nVirtual memory and page replacement\nFile systems and disk scheduling\n\nAdd your course-specific examples while revising.",
        author: "Arjun Singh",
        date: "Oct 20",
        pages: "16 pages",
        color: "#a5d9ef",
    },
    {
        id: "5",
        title: "Neural networks, made simple",
        type: "Notes",
        subject: "Machine Learning",
        description:
            "A neuron computes a weighted sum followed by an activation function. Networks learn weights by minimizing a loss using gradient-based optimization.\n\nTry drawing a network with two inputs, one hidden layer, and one output. Label the weights, biases, and activations.",
        author: "Meera Kapoor",
        date: "Oct 19",
        pages: "9 pages",
        color: "#f3b4c3",
    },
    {
        id: "6",
        title: "SQL queries · Practice set",
        type: "Assignments",
        subject: "DBMS",
        description:
            "Practice problems\n\n1. Select all books with no active loan.\n2. Count loans grouped by member.\n3. Find the most borrowed book.\n4. Use a JOIN to show member names and book titles.\n\nExplain each query in your own words.",
        author: "Kabir Patel",
        date: "Oct 18",
        pages: "6 pages",
        color: "#c4b5fd",
    },
]
const initialNotices = [
    {
        id: "n1",
        title: "ML assignment check: tomorrow",
        description:
            "Get your Machine Learning assignment checked by October 24. Bring your notebook to Lab 3.",
        subject: "Machine Learning",
        urgent: true,
        author: "Ananya",
        date: "Oct 23",
    },
    {
        id: "n2",
        title: "DBMS practice session",
        description:
            "Join the peer revision session on October 25 at 3 PM in Room 204.",
        subject: "DBMS",
        urgent: false,
        author: "Rohan",
        date: "Oct 22",
    },
]
const subjects = [
    "All subjects",
    "Machine Learning",
    "DBMS",
    "Data Structures",
    "Operating Systems",
]
// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight auto
export default function CampusHub({
    title = "campus.",
    style,
    token,
    onSignOut,
    onRequireLogin,
}: Props) {
    const [user, setUser] = React.useState<{ id: number; name: string; email: string; college?: string } | null>(null)
    const [items, setItems] = React.useState<any[]>(seeds.map(normalizeResource))
    const [notices, setNotices] = React.useState<any[]>(initialNotices.map(normalizeNotice))
    const [saved, setSaved] = React.useState<string[]>([])
    const [tab, setTab] = React.useState("Overview")
    const [search, setSearch] = React.useState("")
    const [subject, setSubject] = React.useState("All subjects")
    const [sortBy, setSortBy] = React.useState<"newest" | "downloads" | "title">("newest")
    const [flashcardSubject, setFlashcardSubject] = React.useState<string | null>(null)
    const [modal, setModal] = React.useState<any>(null)
    const [modalTab, setModalTab] = React.useState<"overview" | "doubts" | "notes">("overview")
    const [classrooms, setClassrooms] = React.useState<Classroom[]>([
        {
            id: 1,
            code: "CSE5-7892",
            name: "3rd Year CSE · 5th Semester",
            year_sem: "Year 3 · Sem 5",
            department: "Computer Science & Engineering",
            member_count: 58,
            joined: true,
        }
    ])
    const [activeClassroom, setActiveClassroom] = React.useState<Classroom | null>({
        id: 1,
        code: "CSE5-7892",
        name: "3rd Year CSE · 5th Semester",
        year_sem: "Year 3 · Sem 5",
        department: "Computer Science & Engineering",
        member_count: 58,
        joined: true,
    })
    const [uploadSubject, setUploadSubject] = React.useState<string>("")
    const [customSubjectMode, setCustomSubjectMode] = React.useState<boolean>(false)
    const [personalNotes, setPersonalNotes] = React.useState<Record<string, string>>(() => {
        try {
            return JSON.parse(localStorage.getItem("campus_personal_notes") || "{}")
        } catch {
            return {}
        }
    })
    const [doubts, setDoubts] = React.useState<Record<string, any[]>>(() => {
        try {
            return JSON.parse(localStorage.getItem("campus_resource_doubts") || "{}")
        } catch {
            return {
                "1": [
                    { id: "d1", author: "Kavya R.", question: "Are decision tree pruning formulas asked in university finals?", date: "2 days ago", answers: [{ author: "Ananya", text: "Yes, cost-complexity pruning (alpha parameter) was a 5-mark question last year." }] }
                ],
                "2": [
                    { id: "d2", author: "Dev P.", question: "What is the best way to handle multivalued dependencies in question 3?", date: "Yesterday", answers: [{ author: "Rohan", text: "Decompose into 4NF by creating separate tables for independent multivalued attributes." }] }
                ]
            }
        }
    })
    const [newDoubtText, setNewDoubtText] = React.useState("")
    const [toast, setToast] = React.useState("")
    const [alerts, setAlerts] = React.useState<any[]>([])
    const [ready, setReady] = React.useState(false)
    const [error, setError] = React.useState("")
    const [busy, setBusy] = React.useState(false)
    const form = React.useRef<HTMLFormElement>(null)
    const workspace = React.useRef<HTMLDivElement>(null)
    const searchInputRef = React.useRef<HTMLInputElement>(null)

    // Keyboard shortcut '/' to focus search
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    const savePersonalNote = (resourceId: string, text: string) => {
        setPersonalNotes((prev) => {
            const next = { ...prev, [resourceId]: text }
            try {
                localStorage.setItem("campus_personal_notes", JSON.stringify(next))
            } catch {}
            return next
        })
    }

    const addDoubt = (resourceId: string) => {
        if (!newDoubtText.trim()) return
        const authorName = user?.name || "Student Peer"
        const newDoubt = {
            id: "d_" + Date.now(),
            author: authorName,
            question: newDoubtText.trim(),
            date: "Just now",
            answers: []
        }
        setDoubts((prev) => {
            const existing = prev[resourceId] || []
            const updated = { ...prev, [resourceId]: [newDoubt, ...existing] }
            try {
                localStorage.setItem("campus_resource_doubts", JSON.stringify(updated))
            } catch {}
            return updated
        })
        setNewDoubtText("")
        notify("Question posted to peer study board.")
        broadcastEvent({
            type: "DOUBT_ADDED",
            resourceId,
            doubt: newDoubt,
            actor: authorName
        })
    }

    const addAnswer = (resourceId: string, doubtId: string, answerText: string) => {
        if (!answerText.trim()) return
        const authorName = user?.name || "Student Peer"
        setDoubts((prev) => {
            const list = prev[resourceId] || []
            const updatedList = list.map((d) => {
                if (d.id === doubtId) {
                    return {
                        ...d,
                        answers: [...(d.answers || []), { author: authorName, text: answerText.trim() }]
                    }
                }
                return d
            })
            const updated = { ...prev, [resourceId]: updatedList }
            try {
                localStorage.setItem("campus_resource_doubts", JSON.stringify(updated))
            } catch {}
            return updated
        })
        notify("Answer posted.")
    }

    // Real-time synchronization handler across Android devices and browsers
    const handleRealtimeEvent = React.useCallback((evt: RealtimeEvent) => {
        if (evt.type === "RESOURCE_ADDED" && evt.resource) {
            const normalized = normalizeResource(evt.resource)
            setItems((prev) => {
                if (prev.some((item) => String(item.id) === String(normalized.id))) return prev
                return [normalized, ...prev]
            })
            notify(`🔔 ${evt.actor || "A classmate"} shared notes: ${normalized.title} (${normalized.subject})`)
        } else if (evt.type === "RESOURCE_DELETED" && evt.id) {
            setItems((prev) => prev.filter((item) => String(item.id) !== String(evt.id)))
            setSaved((prev) => prev.filter((id) => id !== String(evt.id)))
        } else if (evt.type === "NOTICE_ADDED" && evt.notice) {
            const normalized = normalizeNotice(evt.notice)
            setNotices((prev) => {
                if (prev.some((n) => String(n.id) === String(normalized.id))) return prev
                return [normalized, ...prev]
            })
            notify(`📢 Campus Notice: ${normalized.title}`)
        } else if (evt.type === "NOTICE_DELETED" && evt.id) {
            setNotices((prev) => prev.filter((n) => String(n.id) !== String(evt.id)))
        } else if (evt.type === "CLASSROOM_CREATED" || evt.type === "CLASSROOM_JOINED") {
            const headers: Record<string, string> = {}
            if (token) headers.Authorization = `Bearer ${token}`
            fetch(`${API}/classrooms`, { headers })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                    if (data?.classrooms) setClassrooms(data.classrooms)
                })
                .catch(() => {})
        } else if (evt.type === "DOUBT_ADDED" && evt.resourceId && evt.doubt) {
            setDoubts((prev) => {
                const list = prev[evt.resourceId!] || []
                if (list.some((d) => d.id === evt.doubt.id)) return prev
                return { ...prev, [evt.resourceId!]: [evt.doubt, ...list] }
            })
        }
    }, [token])

    const { isConnected: isRealtimeConnected, broadcastEvent } = useRealtime(handleRealtimeEvent)

    const enterWorkspace = () =>
        workspace.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "auto"
                : "smooth",
            block: "start",
        })

    // Fetch current user details
    React.useEffect(() => {
        if (!token) {
            setUser(null)
            return
        }
        fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => (res.ok ? res.json() : Promise.reject(res)))
            .then(data => {
                if (data.user) setUser(data.user)
            })
            .catch(() => {
                onSignOut?.()
            })
    }, [token, onSignOut])

    // Load classrooms, resources, and notices from backend
    const loadData = React.useCallback(async () => {
        try {
            const headers: Record<string, string> = {}
            if (token) headers.Authorization = `Bearer ${token}`

            // Fetch classrooms
            const classRes = await fetch(`${API}/classrooms`, { headers })
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)

            if (classRes?.classrooms && classRes.classrooms.length > 0) {
                setClassrooms(classRes.classrooms)
                setActiveClassroom((prev) => {
                    if (prev) {
                        const updated = classRes.classrooms.find((c: Classroom) => c.id === prev.id)
                        return updated || classRes.classrooms[0]
                    }
                    return classRes.classrooms[0]
                })
            }

            const classQuery = activeClassroom?.id ? `?classroom_id=${activeClassroom.id}` : ""

            const [resRes, noticeRes] = await Promise.allSettled([
                fetch(`${API}/resources${classQuery}`, { headers }).then(r => (r.ok ? r.json() : null)),
                fetch(`${API}/notices${classQuery}`).then(r => (r.ok ? r.json() : null)),
            ])

            if (resRes.status === "fulfilled" && resRes.value?.resources) {
                const mapped = resRes.value.resources.map(normalizeResource)
                setItems(mapped)
                setSaved(mapped.filter((i: any) => Boolean(i.saved)).map((i: any) => String(i.id)))
            }

            if (noticeRes.status === "fulfilled" && noticeRes.value?.notices) {
                setNotices(noticeRes.value.notices.map(normalizeNotice))
            }
        } catch (err) {
            console.error("Failed to load backend data:", err)
        } finally {
            setReady(true)
        }
    }, [token, activeClassroom?.id])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    React.useEffect(() => {
        if (!toast) return
        const id = setTimeout(() => setToast(""), 4500)
        return () => clearTimeout(id)
    }, [toast])

    React.useEffect(() => {
        if (!modal) return
        const f = (e: KeyboardEvent) => {
            if (e.key === "Escape") setModal(null)
        }
        window.addEventListener("keydown", f)
        return () => window.removeEventListener("keydown", f)
    }, [modal])

    const notify = (message: string) => {
        setAlerts((a) => [{ id: String(Date.now()), message }, ...a])
        setToast(message)
    }

    async function toggle(id: string) {
        const isSaved = saved.includes(id)
        setSaved((s) =>
            isSaved ? s.filter((x) => x !== id) : [...s, id]
        )
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, saved: !isSaved } : i))
        )
        if (token) {
            try {
                const res = await fetch(`${API}/resources/${id}/save`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                })
                const result = await res.json()
                if (!res.ok) throw new Error(result.error || "Failed to update save status")
                notify(result.saved ? "Saved to your list." : "Removed from saved.")
            } catch {
                setSaved((s) => (isSaved ? [...s, id] : s.filter((x) => x !== id)))
                setItems((prev) =>
                    prev.map((i) => (i.id === id ? { ...i, saved: isSaved } : i))
                )
                notify("Could not update saved status on server.")
            }
        } else {
            notify(isSaved ? "Removed from local list." : "Saved locally. Sign in to sync across devices.")
        }
    }

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError("")
        setBusy(true)
        const data = new FormData(e.currentTarget)

        if (!token) {
            if (modal === "upload") {
                const titleVal = String(data.get("title") || "").trim()
                const subjectVal = String(data.get("subject") || uploadSubject || "").trim()
                const typeVal = String(data.get("type") || "Notes").trim()
                const descVal = String(data.get("description") || "").trim()

                if (!titleVal || !subjectVal) {
                    setError("Title and subject are required.")
                    setBusy(false)
                    return
                }

                const newItem = {
                    id: "local_" + Date.now(),
                    title: titleVal,
                    subject: subjectVal,
                    type: typeVal,
                    description: descVal,
                    downloads: 0,
                    saved: false,
                    date: "Just now",
                    author: "You (Guest)",
                    classroom_id: activeClassroom?.id || 1,
                }
                setItems((n) => [newItem, ...n])
                broadcastEvent({
                    type: "RESOURCE_ADDED",
                    resource: newItem,
                    classroom_id: activeClassroom?.id || 1,
                    actor: "A classmate (Guest)"
                })
                notify(`Added ${titleVal} under ${subjectVal}! Card generated automatically.`)
                setModal(null)
                setUploadSubject("")
                setBusy(false)
                return
            } else if (modal === "notice") {
                const titleVal = String(data.get("title") || "").trim()
                const subjectVal = String(data.get("subject") || uploadSubject || "General").trim()
                const descVal = String(data.get("description") || "").trim()
                const urgent = data.get("urgent") === "on"
                if (!titleVal || !descVal) {
                    setError("Title and description are required.")
                    setBusy(false)
                    return
                }
                const newNotice = {
                    id: "local_notice_" + Date.now(),
                    title: titleVal,
                    subject: subjectVal,
                    description: descVal,
                    urgent,
                    date: "Just now",
                    classroom_id: activeClassroom?.id || 1,
                }
                setNotices((n) => [newNotice, ...n])
                broadcastEvent({
                    type: "NOTICE_ADDED",
                    notice: newNotice,
                    classroom_id: activeClassroom?.id || 1,
                    actor: "A classmate (Guest)"
                })
                notify("New notice posted: " + newNotice.title)
                setModal(null)
                setUploadSubject("")
                setBusy(false)
                return
            }
        }

        try {
            if (modal === "upload") {
                const titleVal = String(data.get("title") || "").trim()
                const subjectVal = String(data.get("subject") || uploadSubject || "").trim()
                const typeVal = String(data.get("type") || "Notes").trim()
                const descVal = String(data.get("description") || "").trim()
                const file = data.get("file") as File | null

                if (!titleVal || !subjectVal) throw new Error("Title and subject are required.")
                if (file && file.size > 10 * 1024 * 1024) throw new Error("Uploaded files must be under 10 MB.")

                const payload = new FormData()
                payload.append("title", titleVal)
                payload.append("subject", subjectVal)
                payload.append("type", typeVal)
                payload.append("description", descVal)
                if (activeClassroom?.id) {
                    payload.append("classroom_id", String(activeClassroom.id))
                }
                if (file && file.size > 0) {
                    payload.append("file", file)
                }

                const res = await fetch(`${API}/resources`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: payload,
                })
                const result = await res.json()
                if (!res.ok) throw new Error(result.error || "Upload failed.")

                const newItem = normalizeResource(result.resource)
                setItems((n) => [newItem, ...n])
                notify(`Added ${newItem.title} for ${newItem.subject}! Card generated for all classmates.`)
                setModal(null)
                setUploadSubject("")
            } else if (modal === "notice") {
                const titleVal = String(data.get("title") || "").trim()
                const subjectVal = String(data.get("subject") || uploadSubject || "General").trim()
                const descVal = String(data.get("description") || "").trim()
                const urgent = data.get("urgent") === "on"

                if (!titleVal || !descVal || !subjectVal) throw new Error("Title, description and subject are required.")

                const res = await fetch(`${API}/notices`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: titleVal,
                        subject: subjectVal,
                        description: descVal,
                        urgent,
                        classroom_id: activeClassroom?.id
                    })
                })
                const result = await res.json()
                if (!res.ok) throw new Error(result.error || "Failed to post notice.")

                const newNotice = normalizeNotice(result.notice)
                setNotices((n) => [newNotice, ...n])
                notify("New notice posted: " + newNotice.title)
                setModal(null)
                setUploadSubject("")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.")
        } finally {
            setBusy(false)
        }
    }

    function download(item: any) {
        if (item.id) {
            fetch(`${API}/resources/${item.id}/download`, { method: "POST" }).catch(() => {})
            setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, downloads: (i.downloads || 0) + 1 } : i))
            )
        }
        const link = document.createElement("a")
        if (item.url) {
            link.href = item.url
            link.target = "_blank"
        } else {
            const blob = new Blob(
                [
                    `${item.title}\n${"=".repeat(item.title.length)}\n\n` +
                    `Subject: ${item.subject}\n` +
                    `Type: ${item.type}\n` +
                    `Author: ${item.author || "Campus Peer"}\n` +
                    `Date: ${item.date || "Recent"}\n\n` +
                    `Notes & Summary:\n${item.description || "No content provided."}\n`
                ],
                { type: "text/plain;charset=utf-8" }
            )
            link.href = URL.createObjectURL(blob)
        }
        link.download = item.filename || `${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        if (!item.url) setTimeout(() => URL.revokeObjectURL(link.href), 2000)
        notify(`Downloading ${item.title}...`)
    }

    async function deleteResource(id: string) {
        if (!token) return
        if (!confirm("Are you sure you want to delete this resource?")) return
        try {
            const res = await fetch(`${API}/resources/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to delete resource")
            setItems((prev) => prev.filter((i) => String(i.id) !== String(id)))
            setSaved((prev) => prev.filter((x) => x !== String(id)))
            if (modal && typeof modal === "object" && String(modal.id) === String(id)) {
                setModal(null)
            }
            notify("Resource deleted.")
        } catch (err) {
            notify(err instanceof Error ? err.message : "Could not delete resource")
        }
    }

    async function deleteNotice(id: string) {
        if (!token) return
        if (!confirm("Are you sure you want to delete this notice?")) return
        try {
            const res = await fetch(`${API}/notices/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to delete notice")
            setNotices((prev) => prev.filter((n) => String(n.id) !== String(id)))
            notify("Notice deleted.")
        } catch (err) {
            notify(err instanceof Error ? err.message : "Could not delete notice")
        }
    }

    const availableSubjects = React.useMemo(() => {
        const list = [...subjects]
        items.forEach((i) => {
            if (i.subject && !list.includes(i.subject)) list.push(i.subject)
        })
        return list
    }, [items])

    const visible = React.useMemo(() => {
        const filtered = items.filter(
            (i) =>
                (tab === "Overview" ||
                    (tab === "Saved" && saved.includes(String(i.id))) ||
                    i.type === tab) &&
                (subject === "All subjects" || i.subject === subject) &&
                (i.title + " " + i.description + " " + i.subject)
                    .toLowerCase()
                    .includes(search.toLowerCase())
        )
        if (sortBy === "downloads") {
            filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        } else if (sortBy === "title") {
            filtered.sort((a, b) => a.title.localeCompare(b.title))
        }
        return filtered
    }, [items, tab, saved, subject, search, sortBy])
    const btn = (text: string, action: () => void, primary = false) => (
        <button className={primary ? "primary" : "button"} onClick={action}>
            {text}
        </button>
    )
    return (
        <div
            className="campus"
            style={{
                ...style,
                width: "100%",
                maxWidth: "100vw",
                overflowX: "hidden",
                minHeight: 1000,
                background: "#101216",
                color: "#f2f3f5",
                fontFamily: "Outfit, sans-serif",
            }}
        >
            <style>{`
.campus *{box-sizing:border-box}.campus button,.campus input,.campus select,.campus textarea{font:inherit}.campus button{cursor:pointer;transition:background .2s,transform .2s}.campus button:hover{transform:translateY(-2px)}.campus button:focus-visible,.campus a:focus-visible,.campus input:focus-visible,.campus select:focus-visible,.campus textarea:focus-visible{outline:2px solid #c4b5fd;outline-offset:3px}.campus .layout{display:grid;grid-template-columns:216px minmax(0,1fr);max-width:1600px;margin:auto}.campus .side{padding:32px 20px;border-right:1px solid #292c33;display:flex;flex-direction:column;gap:30px}.campus .nav{display:flex;flex-direction:column;gap:7px}.campus .nav button{border:0;background:transparent;color:#969aa8;text-align:left;padding:12px 14px;border-radius:9px}.campus .nav button.active{background:#c4b5fd;color:#20202b}.campus .main{padding:28px 32px 32px;min-width:0}.campus .top,.campus .between{display:flex;justify-content:space-between;align-items:center;gap:16px}.campus .muted{color:#9297a5}.campus .tiny{font-size:12px}.campus h1{font-size:34px;line-height:1.2;margin:10px 0;letter-spacing:-1px}.campus h2{font-size:19px;margin:0}.campus h3{font-size:17px;margin:0;line-height:1.4}.campus p{line-height:1.65}.campus .button,.campus .primary{border:1px solid #353943;border-radius:8px;padding:10px 16px;color:#e5e7ed;background:#20232b}.campus .primary{background:#c4b5fd;color:#201b30;border-color:#c4b5fd;font-weight:600}.campus .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}.campus .stat{border:1px solid #30333d;background:#191c22;border-radius:13px;padding:18px}.campus .stat strong{display:block;font-size:28px;margin:10px 0 4px}.campus .body{display:grid;grid-template-columns:minmax(0,1fr) 285px;gap:24px}.campus .filters{display:flex;gap:9px;flex-wrap:wrap;margin:20px 0}.campus .chip{border:1px solid #30343e;border-radius:7px;padding:8px 13px;background:transparent;color:#9297a5}.campus .chip.active{background:#292537;color:#d8cfff;border-color:#73628d}.campus .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.campus .resource{background:#191c22;border:1px solid #30333d;border-radius:13px;overflow:hidden;transition:transform .25s,border-color .25s;animation:campus-in .5s both}.campus .resource:hover{transform:translateY(-4px);border-color:#75668f}.campus .cover{height:120px;position:relative;overflow:hidden;padding:17px;color:#282436;display:flex;justify-content:space-between;align-items:center}.campus .paper{width:80px;background:#fffaf2;transform:rotate(-10deg);padding:14px 10px;box-shadow:5px 8px 0 #00000015}.campus .paper i{display:block;height:3px;background:#bbb8b3;margin:7px 0}.campus .resource-body{padding:18px}.campus .tag{font-size:10px;letter-spacing:1px;text-transform:uppercase;border:1px solid #0003;padding:5px 8px;border-radius:5px}.campus .save{background:#ffffff40;border:0;border-radius:50%;width:30px;height:30px;color:#292438}.campus .rail{display:flex;flex-direction:column;gap:18px}.campus .panel{padding:20px;border:1px solid #30333d;background:#191c22;border-radius:13px}.campus .notice{border-bottom:1px solid #30333d;padding:18px 0}.campus .notice:last-child{border:0;padding-bottom:0}.campus .badge{display:inline-block;font-size:10px;background:#422b2b;color:#f8b3a4;border-radius:4px;padding:4px 6px;margin-bottom:10px}.campus .input{background:#171a20;border:1px solid #353943;border-radius:8px;color:#f3f3f5;padding:11px 13px;min-width:0}.campus select option{background:#191c22}.campus .overlay{position:fixed;inset:0;background:#000b;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)}.campus .dialog{width:540px;max-width:100%;max-height:90vh;overflow:auto;background:#1a1d24;border:1px solid #44414f;border-radius:16px;padding:26px;box-shadow:0 25px 80px #0008}.campus form{display:flex;flex-direction:column;gap:15px;margin-top:20px}.campus label{display:flex;flex-direction:column;gap:7px;font-size:13px}.campus .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:110;background:#d0f4d4;color:#173322;border-radius:10px;padding:14px 24px;max-width:90%;box-shadow:0 8px 30px #0005}.campus .empty{padding:45px 20px;text-align:center;border:1px dashed #3e4350;border-radius:12px;color:#a4a9b5}.campus .mobile-brand{display:none}@keyframes campus-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.campus *{animation:none!important;transition:none!important}}@media(max-width:1100px){.campus .body{grid-template-columns:1fr}.campus .rail{display:grid;grid-template-columns:1fr 1fr}.campus .layout{grid-template-columns:190px 1fr}.campus .main{padding:24px}}@media(max-width:768px){.campus{overflow-x:hidden}.campus .layout{display:block;width:100%;min-width:0}.campus .side{padding:14px 16px;border-right:0;border-bottom:1px solid #30333d;gap:12px}.campus .side .support,.campus .side .profile,.campus .side .tiny.muted{display:none}.campus .nav{display:flex;flex-direction:row;overflow-x:auto;-webkit-overflow-scrolling:touch;gap:6px;padding-bottom:4px}.campus .nav button{white-space:nowrap;font-size:12px;padding:8px 12px;flex-shrink:0;border-radius:8px}.campus .main{padding:18px 14px;width:100%;box-sizing:border-box}.campus .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0}.campus .stat{padding:12px 14px;min-width:0;word-break:break-word}.campus .stat strong{font-size:22px;margin:4px 0 2px}.campus .grid,.campus .rail{grid-template-columns:1fr;gap:14px}.campus h1{font-size:26px;line-height:1.25}.campus .welcome{align-items:flex-start;flex-direction:column;gap:12px;margin-top:16px!important}.campus .welcome p{font-size:13px!important}.campus .top{flex-direction:column;align-items:stretch;gap:10px}.campus .top .muted{display:none}.campus .input.search{width:100%!important;font-size:14px;padding:10px 12px}.campus .classroom-hub-card{flex-direction:column!important;align-items:stretch!important;gap:12px!important;padding:14px!important}.campus .classroom-hub-controls{display:flex!important;flex-direction:column!important;gap:8px!important;width:100%!important}.campus .classroom-hub-controls select{width:100%!important;min-width:0!important}.campus .classroom-hub-buttons{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;width:100%!important}.campus .classroom-hub-buttons button{width:100%!important;justify-content:center!important;text-align:center!important}.campus .shelf-header{flex-direction:column!important;align-items:stretch!important;gap:10px!important}.campus .shelf-controls{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;width:100%!important}.campus .shelf-controls select{width:100%!important;min-width:0!important}.campus .filters{display:flex!important;overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch!important;gap:8px!important;margin:14px 0!important;padding-bottom:4px!important}.campus .filters .chip{flex-shrink:0!important;white-space:nowrap!important;font-size:12px!important;padding:7px 12px!important}.campus .dialog{width:calc(100vw - 24px)!important;max-width:500px!important;max-height:88vh!important;padding:20px 16px!important;border-radius:14px!important}}

.campus{position:relative;isolation:isolate;overflow:hidden}
.campus .ambient{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:-1;background:radial-gradient(ellipse at 70% 5%,#25213580,transparent 55%),#101216}
.campus .ambient span{position:absolute;width:560px;height:560px;border-radius:50%;filter:blur(85px);opacity:.2;background:#a98cfa;top:30px;left:24%;animation:campus-drift 22s ease-in-out infinite alternate}
.campus .ambient span:nth-child(2){background:#69c9b2;width:450px;height:450px;top:650px;left:65%;animation-duration:28s;animation-delay:-8s;opacity:.14}
.campus .ambient span:nth-child(3){background:#8baee9;top:1100px;left:8%;width:400px;height:400px;animation-duration:25s;animation-delay:-12s;opacity:.12}
.campus .side{background:rgba(18,20,27,.55);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-color:#ffffff12}
.campus .stat,.campus .resource,.campus .panel{background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.025));backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid #ffffff20;box-shadow:inset 0 1px 0 #ffffff09,0 12px 32px #00000018}
.campus .stat{transition:transform .3s,border-color .3s,box-shadow .3s;animation:campus-in .65s both}
.campus .stat:nth-child(2){animation-delay:.07s}.campus .stat:nth-child(3){animation-delay:.14s}.campus .stat:nth-child(4){animation-delay:.21s}
.campus .stat:hover{transform:translateY(-4px);border-color:#c4b5fd66;box-shadow:0 12px 35px #a18ae512}
.campus .resource{transition:transform .35s,border-color .35s,box-shadow .35s;animation-fill-mode:backwards}
.campus .resource:hover{transform:translateY(-6px);border-color:#c4b5fd80;box-shadow:0 18px 40px #0004,inset 0 1px 0 #ffffff22}
.campus .cover{background-image:linear-gradient(120deg,#ffffff20,#ffffff00)!important}
.campus .paper{transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.campus .resource:hover .paper{transform:rotate(0deg) translate(-4px,-5px)}
.campus .cover:after{content:"";position:absolute;top:-40%;left:-80%;width:45%;height:190%;transform:rotate(25deg);background:linear-gradient(90deg,transparent,#ffffff3a,transparent);transition:left .7s;pointer-events:none}
.campus .resource:hover .cover:after{left:140%}
.campus .save{z-index:1;backdrop-filter:blur(10px);transition:background .2s,transform .2s}
.campus .save[aria-pressed="true"]{background:#30283e;color:#fff}
.campus .save:active{transform:scale(.9)}
.campus .input{background:#ffffff06;border-color:#ffffff23;backdrop-filter:blur(12px);transition:border-color .2s,box-shadow .2s}
.campus .input:focus{border-color:#c4b5fd88;box-shadow:0 0 0 4px #c4b5fd0c}
.campus .button{background:#ffffff08;border-color:#ffffff22;backdrop-filter:blur(12px)}
.campus .button:hover{background:#ffffff12;border-color:#c4b5fd70}
.campus .primary{box-shadow:0 4px 20px #b99eec18;transition:transform .25s,box-shadow .25s,background .25s}
.campus .primary:hover{background:#d5c9ff;box-shadow:0 8px 28px #b99eec35}
.campus .primary:active,.campus .button:active{transform:translateY(0) scale(.98)}
.campus .nav button{transition:background .25s,color .25s,transform .25s}
.campus .nav button:not(.active):hover{background:#ffffff08;color:#e9e3f7;transform:translateX(3px)}
.campus .chip{transition:background .25s,border-color .25s,color .25s}
.campus .chip:hover{background:#c4b5fd12;color:#ded2ff;border-color:#c4b5fd66}
.campus .dialog{background:linear-gradient(145deg,#292634eb,#191e27f5);backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);border:1px solid #ffffff30;box-shadow:inset 0 1px 0 #ffffff18,0 30px 100px #0008;animation:campus-dialog .28s cubic-bezier(.2,.8,.2,1) both}
.campus .overlay{animation:campus-fade .2s both}
.campus .welcome{animation:campus-in .7s both}
.campus .notice{transition:background .25s}.campus .notice:hover{background:#ffffff03}
.campus .muted{color:#a5a8b5}
.campus .toast{animation:campus-toast .3s both}
@keyframes campus-drift{0%{transform:translate(-45px,0) scale(.9)}50%{transform:translate(100px,100px) scale(1.15)}100%{transform:translate(-20px,200px) scale(1)}}
@keyframes campus-dialog{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes campus-fade{from{opacity:0}to{opacity:1}}
@keyframes campus-toast{from{opacity:0;translate:0 15px}to{opacity:1;translate:0 0}}
@media(prefers-reduced-motion:reduce){.campus *,.campus *:before,.campus *:after{animation:none!important;transition:none!important}.campus .resource:hover,.campus .stat:hover,.campus button:hover{transform:none}}
@media(max-width:700px){.campus .ambient span{width:300px;height:300px;filter:blur(65px)}.campus .resource,.campus .panel,.campus .stat{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}}

.campus{overflow-x:hidden;max-width:100%}
.campus .ambient{height:100%;z-index:-1}
.campus .journey{position:relative;background:#0d1015;border-bottom:1px solid #ffffff20}
.campus .journey-sticky{top:0;height:100vh;min-height:660px;max-height:1100px;overflow:hidden;background:radial-gradient(ellipse at 60% 50%,#23203460,transparent 65%),#0d1015}
.campus .journey-head{position:absolute;top:0;left:0;right:0;z-index:3;padding:30px 5%;display:flex;align-items:center;justify-content:space-between;gap:20px}
.campus .journey-brand{font-size:26px;font-weight:700;letter-spacing:-1px}.campus .journey-caption{font-size:10px;letter-spacing:2px;color:#9c9da9}
.campus .journey-skip{border:1px solid #ffffff28;background:#ffffff08;backdrop-filter:blur(15px);border-radius:30px;color:#eae8f2;padding:11px 18px;font-size:12px}
.campus .journey-track{height:100%;will-change:transform}
.campus .journey-scene{height:100%;position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:110px 7vw 110px 5vw;gap:40px;overflow:hidden}
.campus .scene-copy{width:51%;position:relative;z-index:1}
.campus .scene-label{font-size:11px;letter-spacing:3px;color:var(--scene-color);margin-bottom:25px}
.campus .scene-copy h2{font-size:clamp(38px,4.6vw,72px);line-height:1.07;font-weight:600;letter-spacing:-2.7px;margin:0}
.campus .scene-copy p{max-width:420px;font-size:16px;color:#a7abb8;margin:25px 0;line-height:1.8}
.campus .scene-pill{display:inline-block;font-size:11px;color:#bdbaca;border:1px solid #ffffff19;background:#ffffff05;border-radius:30px;padding:10px 16px;backdrop-filter:blur(10px)}
.campus .scene-art{width:37%;max-width:440px;position:relative;perspective:1000px}
.campus .scene-sheet{position:relative;border-radius:16px;padding:30px;background:linear-gradient(135deg,#ffffff12,#ffffff04);border:1px solid #ffffff40;backdrop-filter:blur(25px);box-shadow:0 35px 100px #0007,inset 0 1px 0 #ffffff30;transform:rotate(-6deg);transition:transform .6s}
.campus .scene-art:hover .scene-sheet{transform:rotate(0deg) translateY(-8px)}
.campus .sheet-top{font-size:8px;letter-spacing:1.3px;color:#c7c7d0;display:flex;justify-content:space-between;border-bottom:1px solid #ffffff20;padding-bottom:17px}
.campus .sheet-sub{font-size:9px;letter-spacing:1.8px;color:var(--scene-color);margin:34px 0 14px}
.campus .scene-sheet h3{font-size:28px;letter-spacing:-1px;margin-bottom:25px}
.campus .sheet-line{display:flex;gap:13px;font-size:12px;padding:14px 0;border-bottom:1px solid #ffffff14;color:#d7d8e0}
.campus .sheet-line span{color:var(--scene-color);font-size:10px}
.campus .sheet-scribble{height:55px;margin:22px 0;border:1px solid var(--scene-color);border-left:0;border-right:0;opacity:.35;transform:skewY(-7deg);border-radius:50%}
.campus .sheet-foot{font-size:10px;color:#a3a4af;margin-top:20px}
.campus .scene-backcard{position:absolute;inset:-16px 10px 15px -12px;background:var(--scene-color);opacity:.14;border:1px solid var(--scene-color);border-radius:16px;transform:rotate(7deg)}
.campus .scene-float{position:absolute;bottom:-16px;right:-20px;padding:16px 20px;background:var(--scene-color);color:#242333;font-size:9px;letter-spacing:1.2px;font-weight:600;border-radius:9px;box-shadow:0 15px 45px #0004;animation:campus-float 5s ease-in-out infinite}
.campus .scene-halo{pointer-events:none;position:absolute;width:400px;height:400px;right:7%;top:23%;background:var(--scene-color);opacity:.15;filter:blur(90px);border-radius:50%}
.campus .scene-counter{position:absolute;bottom:80px;right:5%;font-size:42px;letter-spacing:-2px;color:var(--scene-color);opacity:.8}
.campus .scene-counter span{font-size:12px;letter-spacing:1px;color:#707581;margin-left:10px}
.campus .journey-bottom{position:absolute;bottom:0;left:5%;right:5%;display:flex;gap:30px;align-items:center;padding:25px 0;border-top:1px solid #ffffff13;font-size:9px;letter-spacing:1.5px;color:#a0a4b1}
.campus .journey-progress{height:2px;background:#ffffff18;flex:1;overflow:hidden}
.campus .journey-progress>div{height:100%;background:#c4b5fd}
.campus .journey-enter{display:block;margin-top:24px;background:#a5d9ef;border:0;border-radius:8px;padding:14px 24px;color:#192a32;font-weight:600}
.campus .reduced .journey-sticky{height:auto;max-height:none}
.campus .reduced .journey-head{position:relative}.campus .reduced .journey-scene{min-height:700px}.campus .reduced .journey-bottom{position:relative;left:0;right:0;margin:0 5%;width:90%}.campus .journey-bottom>span:last-child{max-width:35%;text-align:right}
@keyframes campus-float{0%,100%{translate:0 0}50%{translate:0 -10px}}
@media(max-width:700px){.campus .journey-sticky{min-height:620px;max-height:none}.campus .journey-caption{display:none}.campus .journey-head{padding:20px}.campus .journey-brand{font-size:23px}.campus .journey-scene{flex-direction:column;justify-content:center;padding:90px 24px 90px;gap:30px}.campus .scene-copy{width:100%}.campus .scene-copy h2{font-size:38px;letter-spacing:-1.5px}.campus .scene-label{margin-bottom:15px;font-size:9px}.campus .scene-copy p{font-size:13px;margin:15px 0;line-height:1.6}.campus .scene-pill{display:none}.campus .scene-art{width:65%;max-width:240px}.campus .scene-sheet{padding:18px}.campus .sheet-top{font-size:6px;padding-bottom:10px}.campus .sheet-sub{margin:14px 0 7px;font-size:7px}.campus .scene-sheet h3{font-size:20px;margin-bottom:10px}.campus .sheet-line{font-size:9px;padding:8px 0}.campus .sheet-scribble,.campus .sheet-foot{display:none}.campus .scene-float{padding:11px;font-size:7px}.campus .journey-bottom{left:20px;right:20px;gap:16px;font-size:7px;letter-spacing:1px}.campus .journey-bottom>span:last-child{display:none}.campus .scene-counter{bottom:68px;font-size:28px}.campus .scene-counter span{font-size:10px}.campus .journey-enter{margin-top:12px;padding:10px 16px;font-size:12px}}
@media(prefers-reduced-motion:reduce){.campus .journey-track{will-change:auto}.campus .scene-art:hover .scene-sheet{transform:rotate(-6deg)}}

.campus .stack-journey{position:relative;background:#0b0d13;border-bottom:1px solid #ffffff18}
.campus .stack-pin{top:0;height:100vh;min-height:730px;max-height:1100px;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#28243950,transparent 65%),#0b0d13}
.campus .stack-header{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:25px 5%;z-index:25;gap:15px}
.campus .stack-eyebrow{font-size:9px;letter-spacing:2.5px;color:#777e8f}
.campus .stack-grid{position:absolute;inset:0;opacity:.18;background-image:linear-gradient(#ffffff16 1px,transparent 1px),linear-gradient(90deg,#ffffff16 1px,transparent 1px);background-size:85px 85px;mask-image:radial-gradient(ellipse,#000,transparent 70%);pointer-events:none}
.campus .stack-glow{position:absolute;left:30%;top:22%;width:40%;height:55%;background:var(--stack-accent);opacity:.12;filter:blur(100px);border-radius:50%;transition:background 1s;pointer-events:none}
.campus .stack-heading{position:absolute;top:112px;width:100%;text-align:center;padding:0 20px;animation:campus-in .5s both;z-index:20;pointer-events:none}
.campus .stack-kicker{font-size:9px;letter-spacing:3px;color:var(--stack-accent);margin-bottom:14px}
.campus .stack-heading h2{font-size:clamp(28px,3vw,46px);line-height:1.2;letter-spacing:-1.6px;font-weight:500}
.campus .stack-heading h2 span{color:var(--stack-accent);transition:color .5s}
.campus .stack-stage{position:absolute;top:245px;bottom:155px;left:15%;right:15%;perspective:1400px;display:flex;justify-content:center;align-items:center}
.campus .floating-card{position:absolute;width:410px;height:370px;border-radius:20px;border:1px solid #ffffff3a;background:linear-gradient(140deg,#ffffff12,#ffffff03),#171922e8;backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);box-shadow:0 30px 70px #0006,inset 0 1px 0 #ffffff18;transform-style:preserve-3d;overflow:hidden}
.campus .floating-card:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 90% 10%,var(--card-color),transparent 65%);opacity:.12;pointer-events:none}
.campus .stack-card-top{padding:17px 23px;display:flex;justify-content:space-between;border-bottom:1px solid #ffffff13;font-size:8px;letter-spacing:2px;color:var(--card-color)}
.campus .stack-card-content{padding:21px 26px}
.campus .stack-card-meta{font-size:8px;color:#9699ac;letter-spacing:1.6px}
.campus .stack-card-content h3{font-size:28px;font-weight:500;letter-spacing:-1px;margin-top:9px}
.campus .stack-card-content p{font-size:12px;color:#b6b9c6;margin:12px 0}
.campus .stack-words{display:flex;gap:8px}.campus .stack-words span{font-size:7px;letter-spacing:1px;border:1px solid #ffffff1a;border-radius:20px;padding:6px 9px;color:#a9aabd}
.campus .stack-detail{position:absolute;bottom:0;left:0;width:100%;padding:15px 24px;border:0;border-top:1px solid #ffffff1a;display:flex;justify-content:space-between;background:#ffffff05;color:#e5e5ef;font-size:11px;text-align:left}
.campus .stack-detail span{color:var(--card-color);font-size:18px}
.campus .stack-detail:hover{background:#ffffff0e;transform:none}
.campus .stack-graphic{height:92px;position:relative;display:flex;align-items:center;justify-content:center;gap:8px;margin:7px 0}
.campus .stack-graphic span{width:20px;border:1px solid var(--card-color);height:30px;opacity:.45;transform:skewY(-20deg);border-radius:4px}
.campus .stack-graphic span:nth-child(2),.campus .stack-graphic span:nth-child(5){height:55px;opacity:.7}
.campus .stack-graphic span:nth-child(3),.campus .stack-graphic span:nth-child(4){height:80px;opacity:.9}
.campus .stack-graphic b{position:absolute;color:var(--card-color);font-size:46px;background:#1d1f2b;border:1px solid #ffffff20;border-radius:14px;width:88px;height:80px;display:flex;align-items:center;justify-content:center;font-weight:400;rotate:-7deg;box-shadow:0 10px 25px #0006;transition:rotate .5s,scale .5s}
.campus .floating-card:hover .stack-graphic b{rotate:5deg;scale:1.06}
.campus .graphic-1 span{border-radius:50%}.campus .graphic-2 span{transform:rotate(25deg)}.campus .graphic-3 span{border-radius:50%;transform:rotate(-25deg)}
.campus .stack-orbit{position:absolute;width:640px;height:210px;border:1px solid #ffffff10;border-radius:50%;transform:rotate(-15deg);pointer-events:none}
.campus .stack-orbit:after{content:"";position:absolute;inset:25px -35px;border:1px solid #ffffff08;border-radius:50%;transform:rotate(30deg)}
.campus .stack-side-label{position:absolute;left:-30px;top:45%;writing-mode:vertical-rl;font-size:8px;letter-spacing:3px;color:#626879}
.campus .stack-float-note{position:absolute;right:6%;bottom:5%;padding:13px 18px;border:1px solid #ffffff25;border-radius:11px;backdrop-filter:blur(20px);background:#242531b0;color:#c5c7d2;font-size:10px;z-index:15;box-shadow:0 10px 30px #0005;animation:campus-float 5s ease-in-out infinite}
.campus .stack-float-note span{display:inline-block;width:6px;height:6px;background:var(--stack-accent);border-radius:50%;margin-right:9px}
.campus .stack-controls{position:absolute;bottom:27px;left:5%;right:5%;display:flex;flex-direction:column;align-items:center;gap:22px;z-index:20}
.campus .stack-tabs{display:flex;padding:6px;gap:5px;border:1px solid #ffffff1a;border-radius:40px;background:#ffffff04;backdrop-filter:blur(20px)}
.campus .stack-tabs button{border:0;color:#8b90a0;background:transparent;border-radius:30px;padding:11px 18px;font-size:9px;letter-spacing:1px}
.campus .stack-tabs button span{opacity:.45;margin-right:8px}
.campus .stack-tabs button.selected{background:var(--stack-accent);color:#20202a;box-shadow:0 0 25px #ffffff0b}
.campus .stack-scroll-hint{display:flex;align-items:center;gap:10px;font-size:8px;letter-spacing:2px;color:#9399a9}
.campus .stack-scroll-hint button{border:0;background:none;color:var(--stack-accent);font-size:10px}
.campus .scroll-mouse{width:13px;height:20px;border:1px solid #ffffff4a;border-radius:9px;position:relative}
.campus .scroll-mouse:after{content:"";position:absolute;left:5px;top:4px;width:1px;height:5px;background:var(--stack-accent);animation:campus-float 2s ease-in-out infinite}
.campus .stack-detail-backdrop{position:absolute;inset:0;background:#070910a8;backdrop-filter:blur(15px);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
.campus .stack-detail-dialog{width:460px;max-width:100%;padding:30px;border:1px solid #ffffff30;border-radius:20px;background:linear-gradient(135deg,#313040dd,#191c28f5);box-shadow:0 30px 90px #0008;animation:campus-dialog .3s both}
.campus .stack-detail-dialog h3{font-size:30px;margin:22px 0 10px;letter-spacing:-1px}
.campus .stack-detail-dialog p{font-size:14px;color:#b5b9c8;margin-bottom:25px}
@media(max-width:700px){.campus .stack-pin{min-height:740px}.campus .stack-header{padding:20px}.campus .stack-eyebrow{display:none}.campus .stack-heading{top:110px}.campus .stack-heading h2{font-size:30px;max-width:330px;margin:auto}.campus .stack-heading h2 span{display:block}.campus .stack-stage{left:20px;right:20px;top:265px;bottom:150px}.campus .floating-card{width:min(310px,85vw);height:330px}.campus .stack-card-content{padding:17px 20px}.campus .stack-card-content h3{font-size:25px}.campus .stack-graphic{height:75px}.campus .stack-graphic b{height:65px;width:75px;font-size:36px}.campus .stack-graphic span:nth-child(3),.campus .stack-graphic span:nth-child(4){height:65px}.campus .stack-side-label{display:none}.campus .stack-float-note{right:0;bottom:0;font-size:9px;padding:10px}.campus .stack-controls{left:10px;right:10px;bottom:22px;gap:18px}.campus .stack-tabs{gap:1px;padding:4px;max-width:100%}.campus .stack-tabs button{padding:10px 9px;font-size:7px;letter-spacing:.5px}.campus .stack-tabs button span{display:none}.campus .stack-orbit{width:340px;height:140px}}
@media(prefers-reduced-motion:reduce){.campus .floating-card,.campus .stack-graphic b{transition:none!important}.campus .stack-float-note{animation:none}}

.campus .floating-card{touch-action:pan-y;cursor:grab}.campus .floating-card:active{cursor:grabbing}
.campus .stack-stage:focus-visible{outline:1px dashed #c4b5fd80;outline-offset:10px;border-radius:30px}
.campus .stack-browse{position:absolute;top:50%;z-index:16;border:1px solid #ffffff26;background:#ffffff06;border-radius:50%;width:54px;height:54px;backdrop-filter:blur(16px);color:#aeb1c3;font-size:10px;letter-spacing:1px;transition:background .25s,border-color .25s}
.campus .stack-browse.previous{left:8%}.campus .stack-browse.next{right:8%}
.campus .stack-browse:hover{border-color:var(--stack-accent);color:var(--stack-accent);background:#ffffff12}
.campus .graphic-trigger{position:absolute;color:var(--card-color);font-size:46px;background:#1d1f2b;border:1px solid #ffffff30;border-radius:14px;width:88px;height:80px;display:flex;align-items:center;justify-content:center;font-weight:400;rotate:-7deg;box-shadow:0 10px 25px #0006;transition:rotate .5s,scale .5s,translate .5s,background .3s;z-index:2}
.campus .graphic-trigger:hover{rotate:7deg;scale:1.08;background:#302d40}
.campus .is-peeking .graphic-trigger{font-size:26px;rotate:0deg;translate:-115px 0;scale:.7}
.campus .graphic-preview{position:absolute;left:100px;right:0;padding:14px;border:1px solid #ffffff30;border-radius:10px;background:#292a3df0;color:var(--card-color);font-size:11px;line-height:1.8;backdrop-filter:blur(20px);animation:campus-in .25s both;z-index:3;pointer-events:none}
@media(max-width:900px){.campus .stack-browse.previous{left:-7%}.campus .stack-browse.next{right:-7%}}
@media(max-width:700px){.campus .stack-browse{top:auto;bottom:-40px;width:40px;height:40px;font-size:8px}.campus .stack-browse.previous{left:7%}.campus .stack-browse.next{right:7%}.campus .stack-float-note{bottom:-28px;right:25%;font-size:8px;padding:9px}.campus .graphic-trigger{width:75px;height:65px;font-size:36px}.campus .is-peeking .graphic-trigger{translate:-88px 0}.campus .graphic-preview{left:75px;font-size:9px;padding:9px}.campus .stack-scroll-hint{font-size:7px;letter-spacing:1px}}

.campus .campus-journey-track{position:relative;height:320vh}
.campus .campus-desk{position:sticky;top:0;height:100vh;min-height:100vh;max-height:100vh;overflow:hidden;background:#101218;border-bottom:1px solid #ffffff20;display:flex;flex-direction:column;justify-content:space-between;isolation:isolate}
.campus .desk-grid{position:absolute;inset:0;pointer-events:none;z-index:-1;background-image:radial-gradient(#ffffff18 1px,transparent 1px);background-size:24px 24px;mask-image:linear-gradient(transparent,#000 45%,#000)}
.campus .desk-aura{position:absolute;top:120px;left:20%;width:60%;height:500px;background:radial-gradient(ellipse,#756b9c26,transparent 70%);z-index:-1}

.campus .desk-header{display:flex;justify-content:space-between;align-items:center;padding:22px 5%;gap:18px;position:relative;z-index:20;flex-shrink:0}
.campus .desk-stage-indicator{display:flex;align-items:center;gap:18px}
.campus .desk-status{font-size:9px;letter-spacing:2px;color:#9ca6a5;display:flex;align-items:center;gap:9px}
.campus .desk-status i{height:6px;width:6px;border-radius:50%;background:#b5e8ca;box-shadow:0 0 12px #b5e8ca44}
.campus .desk-dots{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:5px 12px;border-radius:99px}
.campus .desk-dots .dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.25);border:0;padding:0;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1)}
.campus .desk-dots .dot.active{background:#d4c5ff;transform:scale(1.4);box-shadow:0 0 10px #d4c5ffcc}

.campus .desk-viewport-body{position:relative;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:0;width:100%;max-width:1300px;margin:0 auto;overflow:hidden}

.campus .desk-intro-floating{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;z-index:10;will-change:transform,opacity}
.campus .desk-eyebrow{font-size:9px;letter-spacing:2.5px;color:#a9a0bd}
.campus .desk-intro h1{font-size:clamp(36px,4.5vw,62px);font-weight:500;line-height:1.07;letter-spacing:-2.5px;margin:20px 0 14px}
.campus .desk-intro h1 span{color:#d4c5ff}
.campus .desk-intro p{font-size:13px;color:#a5a8b7;margin:0;max-width:520px}
.campus .desk-scroll-cue{margin-top:32px;display:inline-flex;align-items:center;gap:10px;background:rgba(212,197,255,0.08);border:1px solid rgba(212,197,255,0.25);color:#d4c5ff;font-size:10px;letter-spacing:2px;padding:10px 20px;border-radius:99px;cursor:pointer;font-weight:600;transition:all .2s;animation:cue-pulse 2s infinite ease-in-out}
.campus .desk-scroll-cue:hover{background:rgba(212,197,255,0.18);border-color:#d4c5ff;transform:translateY(-2px)}
.campus .desk-scroll-cue .cue-arrow{display:inline-block;animation:cue-bounce 1.5s infinite ease-in-out}
@keyframes cue-pulse{0%,100%{opacity:.85}50%{opacity:1}}
@keyframes cue-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}

.campus .desk-stage-content{position:relative;width:100%;z-index:6;will-change:transform,opacity}
.campus .desk-tools{display:flex;justify-content:space-between;align-items:center;max-width:1160px;margin:0 auto 18px;padding:0 25px;position:relative;z-index:10}
.campus .desk-tools>span{font-size:8px;letter-spacing:2px;color:#72788a}
.campus .desk-tools button{background:#ffffff06;border:1px solid #ffffff20;color:#aeb3c0;font-size:10px;padding:9px 15px;border-radius:20px}

.campus .desk-playground{position:relative;height:440px;max-width:1160px;margin:auto;touch-action:pan-y}
.campus .desk-paper-slot{position:absolute;top:50px;width:255px;height:320px;will-change:transform,opacity}
.campus .desk-paper-slot-0{left:13%}
.campus .desk-paper-slot-1{left:35%}
.campus .desk-paper-slot-2{left:57%}
.campus .desk-paper{position:relative;width:100%;height:100%;top:0;left:0;border-radius:5px 5px 16px 5px;padding:21px;color:#262837;cursor:grab;box-shadow:0 18px 40px #0005,inset 0 1px 0 #ffffff70;touch-action:none;user-select:none}
.campus .desk-paper:active{cursor:grabbing}
.campus .desk-paper-top{display:flex;justify-content:space-between;gap:10px;font-size:6px;letter-spacing:1.2px;border-bottom:1px solid #22222226;padding-bottom:12px}
.campus .desk-paper-category{font-size:8px;letter-spacing:2px;margin-top:23px;opacity:.6}
.campus .desk-paper h2{font-size:28px;font-weight:500;line-height:1.08;letter-spacing:-1px;margin-top:10px}
.campus .desk-paper p{font-size:10px;margin:11px 0 6px;color:#393d48}
.campus .desk-mini-art{height:85px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.campus .mini-0>span{font-size:58px;font-weight:500;letter-spacing:-5px;rotate:-8deg}
.campus .mini-0 i{height:38px;width:38px;border:1px solid #35304745;border-radius:50%;margin-left:-10px}
.campus .mini-1{gap:6px;flex-wrap:wrap;padding-top:14px}
.campus .mini-1 b{font-size:23px;font-weight:400;border:1px solid #27382d40;border-radius:50%;padding:5px 10px;rotate:-10deg}
.campus .mini-1 span{width:100%;text-align:center;font-size:9px}
.campus .mini-2 b{font-size:75px;font-weight:400;rotate:12deg}
.campus .mini-2 span{font-size:10px;rotate:-10deg;border-bottom:1px solid #34302b;margin-left:14px}
.campus .desk-paper-open{position:absolute;bottom:13px;left:21px;right:21px;width:calc(100% - 42px);display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;border:0;border-top:1px solid #22222226;background:none;color:#262837;font-size:10px}
.campus .desk-paper-open span{font-size:18px}
.campus .desk-paper-open:hover{transform:none;color:#000}

.campus .desk-reminder-slot{position:absolute;right:0;top:-6px;width:185px;z-index:9;will-change:transform,opacity}
.campus .desk-reminder{position:relative;width:100%;padding:22px 17px 15px;background:linear-gradient(135deg,#ffffff13,#ffffff05);backdrop-filter:blur(22px);border:1px solid #ffffff28;border-radius:12px;color:#f4f3f7;rotate:7deg;cursor:grab;touch-action:none;box-shadow:0 15px 40px #0004}
.campus .desk-tape{position:absolute;top:-9px;left:60px;width:65px;height:20px;background:#c9c3e34a;backdrop-filter:blur(8px);rotate:-8deg}
.campus .desk-reminder-label{font-size:6px;letter-spacing:1.5px;color:#aba3bb}
.campus .desk-reminder h3{font-size:18px;line-height:1.25;margin:17px 0 8px;font-weight:500;letter-spacing:-.4px}
.campus .desk-reminder p{font-size:10px;color:#a9aab7}
.campus .desk-reminder button{font-size:9px;background:#d4c5ff;color:#2a2435;border:0;border-radius:5px;padding:9px;width:100%}
.campus .desk-reminder button[aria-pressed=true]{background:#b5e8ca}
.campus .desk-reminder-foot{display:block;font-size:7px;text-align:center;margin-top:8px;color:#8a8e9e}

.campus .desk-outline{position:absolute;inset:25px 3% 28px;border:1px dashed #ffffff0e;border-radius:150px;transform:rotate(-3deg)}
.campus .desk-doodle{position:absolute;left:1%;top:115px;color:#7e8294;rotate:-14deg;font-size:12px;line-height:1.6;font-style:italic}
.campus .desk-surprise{position:absolute;bottom:15px;left:0;border:0;background:none;color:#c1c1ce;display:flex;gap:12px;align-items:center;text-align:left;font-size:10px;z-index:10}
.campus .desk-surprise b{font-size:8px;color:#747a8c;font-weight:400}
.campus .surprise-shape{width:42px;height:42px;display:grid;place-items:center;background:#f6d59d;color:#39312a;font-size:23px;border-radius:15px 8px 15px 8px;rotate:-12deg;transition:rotate .3s}
.campus .desk-surprise:hover .surprise-shape{rotate:15deg}
.campus .desk-nudge{position:absolute;bottom:50px;left:0;width:270px;padding:22px;border:1px solid #ffffff30;border-radius:15px;background:#292736ee;backdrop-filter:blur(22px);z-index:30;box-shadow:0 15px 40px #0006;animation:campus-in .3s both}
.campus .desk-nudge>span{font-size:8px;letter-spacing:1.5px;color:#f6d59d}
.campus .desk-nudge p{font-size:12px;color:#c2c1d0}
.campus .desk-nudge button{float:right;border:0;background:none;color:#8e93a4;font-size:8px}
.campus .desk-drag-hint{position:absolute;right:20px;bottom:20px;font-size:9px;letter-spacing:.6px;color:#777f91}

.campus .desk-footer{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:18px 5%;border-top:1px solid #ffffff12;flex-shrink:0;position:relative;z-index:20;will-change:transform,opacity}
.campus .desk-footer>span{font-size:7px;color:#696f82;letter-spacing:1.5px}
.campus .desk-footer button{border:0;background:none;color:#b2b6c5;font-size:11px}
.campus .desk-footer button span{display:block;color:#d4c5ff;font-size:10px;margin-top:9px}

.campus .layout{display:grid;grid-template-columns:216px minmax(0,1fr);max-width:1600px;margin:auto;position:relative;z-index:10;background:#101216;border-top:1px solid #ffffff15;box-shadow:0 -30px 60px rgba(0,0,0,0.4)}

@media(max-width:1000px){
  .campus .desk-playground{max-width:850px}
  .campus .desk-paper-slot{width:220px;height:310px}
  .campus .desk-paper-slot-0{left:7%}
  .campus .desk-paper-slot-1{left:31%}
  .campus .desk-paper-slot-2{left:55%}
  .campus .desk-reminder-slot{width:165px;right:5px;top:-15px}
  .campus .desk-doodle{display:none}
  .campus .desk-tools{margin-top:20px}
}
@media(max-width:768px){
  /* Root & page wrapper */
  .campus{width:100%!important;max-width:100vw!important;overflow-x:hidden!important}
  .campus .ambient{max-width:100vw!important;overflow:hidden!important}
  .campus .ambient span{width:220px!important;height:220px!important;left:10%!important}
  
  /* Hero / Journey track */
  .campus .campus-journey-track{height:auto!important;min-height:unset!important}
  .campus .campus-desk{position:relative!important;height:auto!important;min-height:unset!important;max-height:unset!important;padding:16px 0 24px!important}
  .campus .desk-header{padding:14px 18px!important}
  .campus .desk-status{display:none!important}
  .campus .desk-intro-floating{position:relative!important;inset:unset!important;padding:20px 16px!important}
  .campus .desk-eyebrow{font-size:8px!important;letter-spacing:1.5px!important}
  .campus .desk-intro h1{font-size:30px!important;letter-spacing:-1px!important;margin:12px 0 10px!important}
  .campus .desk-intro p{font-size:12px!important;max-width:320px!important;margin:0 auto!important}
  .campus .desk-scroll-cue{margin-top:16px!important;padding:8px 18px!important;font-size:10px!important}
  .campus .desk-stage-content{display:none!important}
  .campus .desk-footer{display:none!important}
  .campus .desk-outline,.campus .desk-doodle{display:none!important}

  /* WORKSPACE LAYOUT: Completely collapse 2-column sidebar grid to single column */
  .campus .layout{display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;grid-template-columns:1fr!important}
  .campus .side{display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;min-width:0!important;padding:14px 16px!important;border-right:0!important;border-bottom:1px solid #30333d!important;gap:10px!important;box-sizing:border-box!important}
  .campus .side .support,.campus .side .profile,.campus .side .tiny.muted{display:none!important}
  .campus .nav{display:flex!important;flex-direction:row!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;gap:6px!important;padding-bottom:4px!important;width:100%!important;max-width:100%!important}
  .campus .nav button{white-space:nowrap!important;font-size:12px!important;padding:8px 12px!important;flex-shrink:0!important;border-radius:8px!important}
  
  /* MAIN CONTENT AREA */
  .campus .main{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;padding:16px 14px 40px!important;box-sizing:border-box!important}
  .campus .welcome{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:12px!important;margin-top:14px!important;width:100%!important;max-width:100%!important}
  .campus .welcome p{font-size:13px!important;max-width:100%!important}
  .campus .top{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:10px!important;width:100%!important}
  .campus .top .muted{display:none!important}
  .campus .input.search{width:100%!important;max-width:100%!important;font-size:14px!important;padding:10px 12px!important;box-sizing:border-box!important}
  
  /* STATS: Clean 2x2 grid that takes full container width */
  .campus .stats{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;max-width:100%!important;gap:10px!important;margin:16px 0!important;box-sizing:border-box!important}
  .campus .stat{width:100%!important;min-width:0!important;padding:12px 14px!important;box-sizing:border-box!important;word-break:break-word!important}
  .campus .stat strong{font-size:22px!important;margin:4px 0 2px!important;display:block!important}
  .campus .stat .tiny{font-size:11px!important;line-height:1.4!important}

  /* BODY: Content + Rail */
  .campus .body{display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;min-width:0!important;gap:20px!important}
  .campus .body > div:first-child{width:100%!important;max-width:100%!important;min-width:0!important}
  .campus .grid{display:grid!important;grid-template-columns:1fr!important;width:100%!important;max-width:100%!important;min-width:0!important;gap:14px!important}
  .campus .rail{display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;min-width:0!important;gap:16px!important;margin-top:20px!important}
  .campus .rail .panel{width:100%!important;max-width:100%!important;box-sizing:border-box!important}
  .campus .resource{width:100%!important;max-width:100%!important;box-sizing:border-box!important}

  /* Classroom Hub Card */
  .campus .classroom-hub-card{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:12px!important;padding:14px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
  .campus .classroom-hub-info{width:100%!important;max-width:100%!important}
  .campus .classroom-hub-controls{display:flex!important;flex-direction:column!important;gap:8px!important;width:100%!important}
  .campus .classroom-hub-controls select{width:100%!important;min-width:0!important;box-sizing:border-box!important}
  .campus .classroom-hub-buttons{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;width:100%!important}
  .campus .classroom-hub-buttons button{width:100%!important;justify-content:center!important;text-align:center!important;box-sizing:border-box!important}

  /* Shelf header & filters */
  .campus .shelf-header{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:10px!important;width:100%!important}
  .campus .shelf-controls{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;width:100%!important}
  .campus .shelf-controls select{width:100%!important;min-width:0!important;box-sizing:border-box!important}
  .campus .filters{display:flex!important;overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch!important;gap:8px!important;margin:14px 0!important;padding-bottom:4px!important;width:100%!important}
  .campus .filters .chip{flex-shrink:0!important;white-space:nowrap!important;font-size:12px!important;padding:7px 12px!important}

  /* Dialog */
  .campus .dialog{width:calc(100vw - 24px)!important;max-width:500px!important;max-height:88vh!important;padding:20px 16px!important;border-radius:14px!important;box-sizing:border-box!important}
}


`}</style>
            <div className="ambient" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>
            <ScrollJourney
                onEnter={enterWorkspace}
                onBrowse={(category) => {
                    setTab(category)
                    setSearch("")
                    setSubject("All subjects")
                    enterWorkspace()
                }}
            />
            <div ref={workspace} className="layout">
                <aside className="side">
                    <div
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            letterSpacing: -1,
                        }}
                    >
                        {" "}
                        <span style={{ color: "#c4b5fd" }}>c/</span> {title}
                    </div>
                    <div
                        className="profile"
                        style={{
                            padding: 14,
                            background: "#1b1e25",
                            borderRadius: 10,
                        }}
                    >
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                            {user?.name || (token ? "Student workspace" : "Guest Student")}
                        </div>
                        <div className="tiny muted" style={{ marginTop: 5 }}>
                            {user?.college || (token ? "Engineering & Computer Science" : "Guest preview mode")}
                        </div>
                    </div>
                    <div>
                        <div
                            className="tiny muted"
                            style={{ letterSpacing: 2, marginBottom: 14 }}
                        >
                            WORKSPACE
                        </div>
                        <nav className="nav" aria-label="Main navigation">
                            {[
                                "Overview",
                                "Notes",
                                "Assignments",
                                "PYQs",
                                "Notices",
                                "Saved",
                            ].map((n, i) => (
                                <button
                                    key={n}
                                    className={tab === n ? "active" : ""}
                                    onClick={() => {
                                        setTab(n)
                                        setSearch("")
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: 24,
                                            opacity: 0.65,
                                        }}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    {n}
                                    {n === "Saved" && saved.length > 0
                                        ? " · " + saved.length
                                        : ""}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div
                        className="support"
                        style={{
                            marginTop: 35,
                            padding: 17,
                            borderRadius: 12,
                            background:
                                "linear-gradient(140deg,#302b42,#1b2029)",
                            border: "1px solid #4b405e",
                        }}
                    >
                        <h3>Good notes deserve company.</h3>
                        <p className="tiny muted">
                            Help your classmates. Share what you know.
                        </p>
                        {btn(
                            "Share a resource",
                            () => {
                                setError("")
                                setModal("upload")
                            },
                            true
                        )}
                        <div style={{ marginTop: 10 }}>
                            <PWAInstallButton compact />
                        </div>
                    </div>
                    <div
                        className="tiny muted"
                        style={{ marginTop: "auto", paddingTop: 35 }}
                    >
                        {token ? (
                            <>
                                CAMPUS DATABASE CONNECTED
                                <br />
                                <br />
                                Signed in as {user?.name || "student"}.
                                <br />
                                Synced with Students Hub server.
                            </>
                        ) : (
                            <>
                                GUEST PREVIEW MODE
                                <br />
                                <br />
                                Sign in anytime to upload,
                                <br />
                                post notices, and save papers.
                            </>
                        )}
                    </div>
                </aside>
                <main className="main">
                    <header className="top">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="tiny muted">
                                THE STUDENT COLLECTIVE / YOUR WORKSPACE
                            </span>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    background: isRealtimeConnected ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
                                    border: isRealtimeConnected ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.1)",
                                    color: isRealtimeConnected ? "#b5e8ca" : "#9ca0af",
                                    borderRadius: 8,
                                    padding: "5px 9px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                                title={isRealtimeConnected ? "Live Peer Sync active across Android & Web" : "Connecting to real-time sync stream..."}
                            >
                                <span
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: isRealtimeConnected ? "#34d399" : "#f59e0b",
                                        boxShadow: isRealtimeConnected ? "0 0 8px #34d399" : "none",
                                    }}
                                />
                                <span>{isRealtimeConnected ? "Live Sync" : "Syncing…"}</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <PWAInstallButton />
                            <FocusPod onComplete={() => notify("Pomodoro study cycle completed! Great job.")} />
                            <button
                                type="button"
                                className="button"
                                style={{ display: "flex", alignItems: "center", gap: 6, borderColor: "rgba(196,181,253,0.35)", color: "#d8cfff" }}
                                onClick={() => setFlashcardSubject("All subjects")}
                                title="Open interactive revision flashcard deck"
                            >
                                <span>⚡</span> Exam Sprint
                            </button>
                            {btn(
                                "Notifications" +
                                    (alerts.length
                                        ? " · " + alerts.length
                                        : ""),
                                () => setModal("alerts")
                            )}
                            <div
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    background: "#302b42",
                                    color: "#d8cfff",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    letterSpacing: 1,
                                }}
                                title={user?.email ? `${user.name} (${user.email})` : "Guest"}
                            >
                                {getInitials(user?.name)}
                            </div>
                        </div>
                    </header>

                    {/* Classroom Hub & Invite Code Switcher */}
                    <div style={{ marginTop: 20 }}>
                        <ClassroomManager
                            classrooms={classrooms}
                            activeClassroom={activeClassroom}
                            onSelectClassroom={(c) => {
                                setActiveClassroom(c)
                                setSubject("All subjects")
                            }}
                            onJoinSuccess={(c) => {
                                setClassrooms((prev) => {
                                    if (prev.some((x) => x.id === c.id)) return prev
                                    return [c, ...prev]
                                })
                            }}
                            onCreateSuccess={(c) => {
                                setClassrooms((prev) => [c, ...prev])
                            }}
                            token={token || null}
                            API={API}
                            notify={notify}
                        />
                    </div>

                    <div className="between welcome" style={{ marginTop: 24 }}>
                        <div>
                            <div
                                className="tiny"
                                style={{ color: "#baa9e8", letterSpacing: 2 }}
                            >
                                LESS SCRAMBLING. MORE LEARNING.
                            </div>
                            <h1>Your semester, sorted.</h1>
                            <p
                                className="muted"
                                style={{ margin: "8px 0 0", fontSize: 14 }}
                            >
                                Notes, solved assignments, flashcard sprints, and real peer study discussions.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button
                                type="button"
                                className="button"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    borderColor: "rgba(196,181,253,0.5)",
                                    background: "rgba(196,181,253,0.08)",
                                    color: "#d8cfff",
                                    fontWeight: 600,
                                }}
                                onClick={() => setFlashcardSubject("All subjects")}
                            >
                                <span>⚡</span> Interactive Flashcards
                            </button>
                            {btn(
                                "+ Upload resource",
                                () => {
                                    setError("")
                                    setModal("upload")
                                },
                                true
                            )}
                        </div>
                    </div>
                    <section className="stats">
                        {[
                            [
                                String(items.length),
                                "Shared resources",
                                "#c4b5fd",
                            ],
                            [
                                String(
                                    new Set(items.map((i) => i.subject)).size
                                ),
                                "Subjects covered",
                                "#9ee5c3",
                            ],
                            [
                                String(notices.length),
                                "Community notices",
                                "#f2cd98",
                            ],
                            [
                                String(saved.length),
                                "Saved for later",
                                "#a5d9ef",
                            ],
                        ].map(([v, l, col]) => (
                            <div className="stat" key={l}>
                                <span className="tiny muted">{l}</span>
                                <strong style={{ color: col }}>
                                    {v.padStart(2, "0")}
                                </strong>
                                <span className="tiny muted">
                                    {l === "Shared resources"
                                        ? "Your peer-powered library"
                                        : l === "Saved for later"
                                          ? "Your personal reading list"
                                          : "In your student workspace"}
                                </span>
                            </div>
                        ))}
                    </section>

                    {/* Dynamic Semester Subjects Grid - Auto generates cards for any subject like Design Thinking */}
                    <SemesterSubjectsGrid
                        items={items}
                        activeSubject={subject}
                        onSelectSubject={(s) => setSubject(s)}
                        onAddForSubject={(sub) => {
                            if (sub) {
                                setUploadSubject(sub)
                                setCustomSubjectMode(false)
                            } else {
                                setUploadSubject("")
                                setCustomSubjectMode(true)
                            }
                            setError("")
                            setModal("upload")
                        }}
                        onOpenQuiz={(sub) => setFlashcardSubject(sub)}
                    />

                    <div className="body">
                        <section>
                            <div className="between shelf-header" style={{ flexWrap: "wrap", gap: 12 }}>
                                <h2>
                                    {tab === "Overview"
                                        ? "The resource shelf"
                                        : tab === "PYQs"
                                          ? "Previous year papers"
                                          : tab === "Saved"
                                            ? "Saved for later"
                                            : tab}
                                </h2>
                                <div className="shelf-controls" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                    <label className="tiny muted" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        Sort:
                                        <select
                                            aria-label="Sort resources"
                                            className="input tiny"
                                            value={sortBy}
                                            onChange={(e: any) => setSortBy(e.target.value)}
                                        >
                                            <option value="newest">Newest first</option>
                                            <option value="downloads">Most downloaded</option>
                                            <option value="title">Alphabetical</option>
                                        </select>
                                    </label>
                                    <select
                                        aria-label="Filter by subject"
                                        className="input tiny"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    >
                                        {availableSubjects.map((s) => (
                                            <option key={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ position: "relative", marginTop: 18 }}>
                                <input
                                    ref={searchInputRef}
                                    className="input search"
                                    aria-label="Search resources"
                                    placeholder="Search by topic, subject, or keyword... (Press / to focus)"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: "100%", paddingRight: 45 }}
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        style={{
                                            position: "absolute",
                                            right: 12,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            color: "#8a8e9e",
                                            cursor: "pointer",
                                            fontSize: 14,
                                        }}
                                        title="Clear search"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <div className="filters">
                                {[
                                    "Overview",
                                    "Notes",
                                    "Assignments",
                                    "PYQs",
                                ].map((n) => (
                                    <button
                                        key={n}
                                        className={
                                            "chip " +
                                            (tab === n ? "active" : "")
                                        }
                                        onClick={() => setTab(n)}
                                    >
                                        {n === "Overview" ? "All resources" : n}
                                    </button>
                                ))}
                                <span
                                    className="tiny muted"
                                    style={{
                                        marginLeft: "auto",
                                        alignSelf: "center",
                                    }}
                                >
                                    {tab === "Notices"
                                        ? notices.length
                                        : visible.length}{" "}
                                    results
                                </span>
                            </div>
                            {tab === "Notices" ? (
                                <div className="panel">
                                    <div className="between">
                                        <h2>Campus noticeboard</h2>
                                        {btn(
                                            "+ Post notice",
                                            () => {
                                                setError("")
                                                setModal("notice")
                                            },
                                            true
                                        )}
                                    </div>
                                    {notices
                                        .filter(
                                            (n) =>
                                                (subject === "All subjects" ||
                                                    n.subject === subject) &&
                                                (n.title + " " + n.description)
                                                    .toLowerCase()
                                                    .includes(
                                                        search.toLowerCase()
                                                    )
                                        )
                                        .map((n) => (
                                            <article
                                                className="notice"
                                                key={n.id}
                                            >
                                                <div className="between" style={{ marginBottom: 6 }}>
                                                    {n.urgent ? (
                                                        <span className="badge">
                                                            TIME SENSITIVE
                                                        </span>
                                                    ) : (
                                                        <span />
                                                    )}
                                                    {token && user && (n.user_id === user.id || n.author === user.name) && (
                                                        <button
                                                            type="button"
                                                            style={{
                                                                background: "transparent",
                                                                border: "1px solid #ef444455",
                                                                color: "#fca5a5",
                                                                borderRadius: 6,
                                                                padding: "3px 8px",
                                                                fontSize: 10,
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => deleteNotice(n.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                                <h3>{n.title}</h3>
                                                <p
                                                    className="muted"
                                                    style={{ fontSize: 14 }}
                                                >
                                                    {n.description}
                                                </p>
                                                <div className="tiny muted">
                                                    {n.author} · {n.subject} ·{" "}
                                                    {n.date}
                                                </div>
                                            </article>
                                        ))}
                                </div>
                            ) : visible.length ? (
                                <div className="grid">
                                    {visible.map((item, i) => (
                                        <motion.article
                                            className="resource"
                                            key={item.id}
                                            initial={{ opacity: 0, y: 14 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ type: "spring", stiffness: 280, damping: 24, delay: Math.min(i * 0.04, 0.25) }}
                                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                        >
                                            <div
                                                className="cover"
                                                style={{
                                                    background: item.color,
                                                }}
                                            >
                                                <div>
                                                    <span className="tag">
                                                        {item.type === "PYQs"
                                                            ? "Past paper"
                                                            : item.type}
                                                    </span>
                                                    <div
                                                        style={{
                                                            marginTop: 16,
                                                            fontSize: 11,
                                                            letterSpacing: 1,
                                                        }}
                                                    >
                                                        {item.subject.toUpperCase()}
                                                    </div>
                                                </div>
                                                <div
                                                    className="paper"
                                                    aria-hidden="true"
                                                >
                                                    <b style={{ fontSize: 10 }}>
                                                        STUDY / 0{i + 1}
                                                    </b>
                                                    <i />
                                                    <i />
                                                    <i />
                                                </div>
                                                <button
                                                    className="save"
                                                    style={{
                                                        position: "absolute",
                                                        right: 12,
                                                        top: 10,
                                                    }}
                                                    aria-label={
                                                        saved.includes(item.id)
                                                            ? "Unsave resource"
                                                            : "Save resource"
                                                    }
                                                    aria-pressed={saved.includes(
                                                        item.id
                                                    )}
                                                    onClick={() =>
                                                        toggle(item.id)
                                                    }
                                                >
                                                    {saved.includes(item.id)
                                                        ? "✓"
                                                        : "+"}
                                                </button>
                                            </div>
                                            <div className="resource-body">
                                                <div
                                                    className="tiny muted"
                                                    style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}
                                                >
                                                    <span>{item.subject} · {item.pages}</span>
                                                    {item.downloads > 0 && (
                                                        <span style={{ color: "#baa9e8" }}>⬇ {item.downloads}</span>
                                                    )}
                                                </div>
                                                <h3>{item.title}</h3>
                                                <p
                                                    className="tiny muted"
                                                    style={{
                                                        margin: "9px 0 16px",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient:
                                                            "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {item.description}
                                                </p>
                                                <div
                                                    className="between"
                                                    style={{
                                                        paddingTop: 13,
                                                        borderTop:
                                                            "1px solid #30333d",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span className="tiny muted">
                                                        {item.author}
                                                        <br />
                                                        {item.date}
                                                    </span>
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        <button
                                                            type="button"
                                                            className="button tiny"
                                                            style={{
                                                                borderColor: "rgba(196,181,253,0.3)",
                                                                color: "#d8cfff",
                                                                padding: "8px 12px",
                                                                fontSize: 11,
                                                            }}
                                                            onClick={() => setFlashcardSubject(item.subject)}
                                                            title={`Practice ${item.subject} flashcards`}
                                                        >
                                                            ⚡ Quiz
                                                        </button>
                                                        {btn("Open", () => {
                                                            setModalTab("overview")
                                                            setModal(item)
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.article>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty">
                                    <h3>Nothing on this shelf yet.</h3>
                                    <p>
                                        Try another search, or share the first
                                        resource.
                                    </p>
                                    {btn("Clear filters", () => {
                                        setSearch("")
                                        setSubject("All subjects")
                                        setTab("Overview")
                                    })}
                                </div>
                            )}
                        </section>
                        <aside className="rail">
                            <div className="panel">
                                <div className="between">
                                    <h2>Don’t miss this</h2>
                                    <span
                                        style={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: 10,
                                            background: "#c4b5fd",
                                        }}
                                    />
                                </div>
                                <div
                                    className="tiny muted"
                                    style={{ marginTop: 6 }}
                                >
                                    Your community noticeboard
                                </div>
                                {notices.slice(0, 2).map((n) => (
                                    <article className="notice" key={n.id}>
                                        {n.urgent ? (
                                            <span className="badge">
                                                DEADLINE REMINDER
                                            </span>
                                        ) : (
                                            <span
                                                className="badge"
                                                style={{
                                                    background: "#24392e",
                                                    color: "#9ee5c3",
                                                }}
                                            >
                                                CAMPUS UPDATE
                                            </span>
                                        )}
                                        <h3 style={{ fontSize: 15 }}>
                                            {n.title}
                                        </h3>
                                        <p className="tiny muted">
                                            {n.description}
                                        </p>
                                        <span className="tiny muted">
                                            {n.author} · {n.date}
                                        </span>
                                    </article>
                                ))}
                                <button
                                    className="button"
                                    style={{ width: "100%", marginTop: 18 }}
                                    onClick={() => {
                                        setError("")
                                        setModal("notice")
                                    }}
                                >
                                    + Post a notice
                                </button>
                            </div>
                            <div
                                className="panel"
                                style={{
                                    background:
                                        "linear-gradient(130deg,#272239,#20242c)",
                                }}
                            >
                                <div
                                    className="tiny"
                                    style={{
                                        color: "#c4b5fd",
                                        letterSpacing: 1,
                                    }}
                                >
                                    BUILT FOR THE NIGHT BEFORE.
                                </div>
                                <h3 style={{ fontSize: 21, marginTop: 14 }}>
                                    We’re better
                                    <br />
                                    at this together.
                                </h3>
                                <p className="tiny muted">
                                    That one explanation that clicked? It could
                                    help someone else, too.
                                </p>
                                {btn(
                                    "Contribute your notes",
                                    () => {
                                        setError("")
                                        setModal("upload")
                                    },
                                    true
                                )}
                            </div>
                            <div className="panel">
                                <h3>How it works</h3>
                                {[
                                    "Find your subject",
                                    "Open or save a resource",
                                    "Upload your own work",
                                ].map((s, i) => (
                                    <div
                                        key={s}
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            marginTop: 18,
                                            fontSize: 13,
                                        }}
                                    >
                                        <span style={{ color: "#c4b5fd" }}>
                                            0{i + 1}
                                        </span>
                                        <span className="muted">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>
                    <footer
                        className="between tiny muted"
                        style={{
                            paddingTop: 32,
                            marginTop: 25,
                            borderTop: "1px solid #2b2e36",
                        }}
                    >
                        <span>Made for students. Powered by sharing.</span>
                        <span>Interactive demo · Local browser data only</span>
                    </footer>
                </main>
            </div>
            {modal && (
                <div className="overlay" onClick={() => setModal(null)}>
                    <div
                        className="dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-label={
                            typeof modal === "object"
                                ? modal.title
                                : modal === "alerts"
                                  ? "Notifications"
                                  : "Share with your community"
                        }
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="between">
                            <h2>
                                {typeof modal === "object"
                                    ? "Resource details"
                                    : modal === "upload"
                                      ? "Share your knowledge"
                                      : modal === "notice"
                                        ? "Post a campus notice"
                                        : "Notifications"}
                            </h2>
                            <button
                                autoFocus
                                className="button"
                                aria-label="Close dialog"
                                onClick={() => setModal(null)}
                            >
                                Close
                            </button>
                        </div>
                        {modal === "alerts" ? (
                            <>
                                <p className="tiny muted">
                                    Local activity only. Other users are not
                                    notified in this demo.
                                </p>
                                {alerts.length ? (
                                    alerts.map((a) => (
                                        <div className="notice" key={a.id}>
                                            {a.message}
                                        </div>
                                    ))
                                ) : (
                                    <p className="muted">
                                        You’re all caught up. Upload a resource
                                        or post a notice to see activity here.
                                    </p>
                                )}
                                {alerts.length > 0 &&
                                    btn("Clear notifications", () =>
                                        setAlerts([])
                                    )}
                            </>
                        ) : typeof modal === "object" ? (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                                    <span style={{ color: modal.color, fontSize: 12, fontWeight: 600 }}>
                                        {modal.type} · {modal.subject}
                                    </span>
                                    <span className="tiny muted">
                                        {modal.downloads || 0} downloads · {modal.pages}
                                    </span>
                                </div>
                                <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>{modal.title}</h1>
                                <p className="tiny muted" style={{ margin: "0 0 16px" }}>
                                    Shared by {modal.author} · {modal.date}
                                </p>

                                {/* Reader Sub-Tabs */}
                                <div style={{ display: "flex", gap: 6, padding: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, marginBottom: 18 }}>
                                    <button
                                        type="button"
                                        onClick={() => setModalTab("overview")}
                                        style={{
                                            flex: 1,
                                            border: "none",
                                            background: modalTab === "overview" ? "#c4b5fd" : "transparent",
                                            color: modalTab === "overview" ? "#1f1b2e" : "#a1a5b4",
                                            padding: "8px 12px",
                                            borderRadius: 7,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        📖 Study Notes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModalTab("notes")}
                                        style={{
                                            flex: 1,
                                            border: "none",
                                            background: modalTab === "notes" ? "#c4b5fd" : "transparent",
                                            color: modalTab === "notes" ? "#1f1b2e" : "#a1a5b4",
                                            padding: "8px 12px",
                                            borderRadius: 7,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        📝 My Scratchpad
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModalTab("doubts")}
                                        style={{
                                            flex: 1,
                                            border: "none",
                                            background: modalTab === "doubts" ? "#c4b5fd" : "transparent",
                                            color: modalTab === "doubts" ? "#1f1b2e" : "#a1a5b4",
                                            padding: "8px 12px",
                                            borderRadius: 7,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        💬 Peer Q&A ({(doubts[modal.id] || []).length})
                                    </button>
                                </div>

                                {modalTab === "overview" && (
                                    <>
                                        <div
                                            style={{
                                                background: "rgba(0,0,0,0.25)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: 12,
                                                padding: 16,
                                                maxHeight: 280,
                                                overflowY: "auto",
                                            }}
                                        >
                                            <p
                                                style={{
                                                    whiteSpace: "pre-wrap",
                                                    fontSize: 13,
                                                    lineHeight: 1.65,
                                                    color: "#e2e4ed",
                                                    margin: 0,
                                                }}
                                            >
                                                {modal.description}
                                            </p>
                                        </div>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
                                            {btn(
                                                modal.url ? "Download file" : "Download study sheet",
                                                () => download(modal),
                                                true
                                            )}
                                            {btn(
                                                saved.includes(modal.id) ? "Unsave" : "Save for later",
                                                () => toggle(modal.id)
                                            )}
                                            <button
                                                type="button"
                                                className="button"
                                                style={{ borderColor: "rgba(196,181,253,0.4)", color: "#d8cfff" }}
                                                onClick={() => {
                                                    try {
                                                        navigator.clipboard.writeText(`${modal.title}\n\n${modal.description}`)
                                                        notify("Notes copied to clipboard!")
                                                    } catch {
                                                        notify("Copy supported in browser!")
                                                    }
                                                }}
                                            >
                                                📋 Copy notes
                                            </button>
                                            <button
                                                type="button"
                                                className="button"
                                                style={{ borderColor: "rgba(181,232,202,0.4)", color: "#b5e8ca" }}
                                                onClick={() => setFlashcardSubject(modal.subject)}
                                            >
                                                ⚡ Practice {modal.subject}
                                            </button>
                                            {token && user && (modal.user_id === user.id || modal.author === user.name) && (
                                                <button
                                                    type="button"
                                                    className="button"
                                                    style={{ borderColor: "#ef444466", color: "#fca5a5", marginLeft: "auto" }}
                                                    onClick={() => deleteResource(modal.id)}
                                                >
                                                    Delete upload
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}

                                {modalTab === "notes" && (
                                    <div>
                                        <div className="tiny muted" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                                            <span>Your private revision scratchpad</span>
                                            <span>Auto-saved to browser</span>
                                        </div>
                                        <textarea
                                            className="input"
                                            rows={9}
                                            placeholder="Jot down formulas, tricky steps, or reminder hints while reading these notes..."
                                            value={personalNotes[modal.id] || ""}
                                            onChange={(e) => savePersonalNote(modal.id, e.target.value)}
                                            style={{ width: "100%", fontSize: 13, lineHeight: 1.6 }}
                                        />
                                        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span className="tiny muted">
                                                {(personalNotes[modal.id] || "").length} characters saved
                                            </span>
                                            <button
                                                type="button"
                                                className="button"
                                                onClick={() => {
                                                    savePersonalNote(modal.id, "")
                                                    notify("Scratchpad cleared.")
                                                }}
                                            >
                                                Clear note
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {modalTab === "doubts" && (
                                    <div>
                                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                                            <input
                                                className="input"
                                                placeholder="Ask a question about this material..."
                                                value={newDoubtText}
                                                onChange={(e) => setNewDoubtText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") addDoubt(modal.id)
                                                }}
                                                style={{ flex: 1, fontSize: 13 }}
                                            />
                                            <button
                                                type="button"
                                                className="primary"
                                                onClick={() => addDoubt(modal.id)}
                                            >
                                                Post
                                            </button>
                                        </div>
                                        <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                                            {(doubts[modal.id] || []).length > 0 ? (
                                                (doubts[modal.id] || []).map((d) => (
                                                    <div
                                                        key={d.id}
                                                        style={{
                                                            padding: 12,
                                                            background: "rgba(255,255,255,0.04)",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: 8,
                                                        }}
                                                    >
                                                        <div className="tiny muted" style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                            <span>{d.author}</span>
                                                            <span>{d.date}</span>
                                                        </div>
                                                        <div style={{ fontSize: 13, color: "#f3f4f6", fontWeight: 500 }}>
                                                            {d.question}
                                                        </div>
                                                        {d.answers && d.answers.length > 0 && (
                                                            <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "2px solid #c4b5fd" }}>
                                                                {d.answers.map((ans: any, idx: number) => (
                                                                    <div key={idx} style={{ fontSize: 12, color: "#c8cae5", marginTop: 4 }}>
                                                                        <strong style={{ color: "#d8cfff" }}>{ans.author}:</strong> {ans.text}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div style={{ marginTop: 8 }}>
                                                            <input
                                                                className="input tiny"
                                                                placeholder="Add peer reply... (Press Enter)"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                                                                        addAnswer(modal.id, d.id, (e.target as HTMLInputElement).value)
                                                                        ;(e.target as HTMLInputElement).value = ""
                                                                    }
                                                                }}
                                                                style={{ width: "100%", padding: "6px 10px", fontSize: 12 }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty" style={{ padding: "20px" }}>
                                                    <p className="tiny muted">No questions yet. Ask anything you’re curious about!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="tiny muted">
                                    {activeClassroom
                                        ? `Posting to ${activeClassroom.name} (${activeClassroom.code}). Cards are automatically created for any subject name.`
                                        : "Share materials with your classmates. All uploads are saved to the Students Hub database."}
                                </p>
                                <form ref={form} onSubmit={submit}>
                                    <label>
                                        Title
                                        <input
                                            autoComplete="off"
                                            name="title"
                                            className="input"
                                            required
                                            maxLength={100}
                                            placeholder={
                                                modal === "notice"
                                                    ? "e.g. ML assignment check tomorrow"
                                                    : "e.g. Unit 3 revision notes / Design Thinking Empathy Map"
                                            }
                                        />
                                    </label>
                                    <div style={{ display: "flex", gap: 14 }}>
                                        <label style={{ flex: 1 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                                <span>Subject</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomSubjectMode(!customSubjectMode)
                                                        if (!customSubjectMode) setUploadSubject("")
                                                    }}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#c4b5fd",
                                                        fontSize: 11,
                                                        textDecoration: "underline",
                                                        cursor: "pointer",
                                                        padding: 0,
                                                    }}
                                                >
                                                    {customSubjectMode ? "← Pick existing" : "+ Type new subject"}
                                                </button>
                                            </div>
                                            {customSubjectMode ? (
                                                <input
                                                    name="subject"
                                                    className="input"
                                                    required
                                                    placeholder="Type subject name (e.g. Design Thinking)..."
                                                    value={uploadSubject}
                                                    onChange={(e) => setUploadSubject(e.target.value)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <select
                                                    name="subject"
                                                    className="input"
                                                    value={uploadSubject || (availableSubjects.slice(1)[0] || "General")}
                                                    onChange={(e) => {
                                                        if (e.target.value === "__NEW__") {
                                                            setCustomSubjectMode(true)
                                                            setUploadSubject("")
                                                        } else {
                                                            setUploadSubject(e.target.value)
                                                        }
                                                    }}
                                                >
                                                    {availableSubjects.slice(1).map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                    <option value="__NEW__">+ Type another subject (e.g. Design Thinking)...</option>
                                                </select>
                                            )}
                                        </label>
                                        {modal === "upload" && (
                                            <label style={{ flex: 1 }}>
                                                Category
                                                <select
                                                    className="input"
                                                    name="type"
                                                >
                                                    {[
                                                        "Notes",
                                                        "Assignments",
                                                        "PYQs",
                                                    ].map((s) => (
                                                        <option key={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}
                                    </div>
                                    <label>
                                        Description
                                        <textarea
                                            name="description"
                                            className="input"
                                            required
                                            maxLength={3000}
                                            rows={4}
                                            placeholder="Add context, topics covered, or deadline details."
                                        />
                                    </label>
                                    {modal === "upload" ? (
                                        <label>
                                            Resource file · PDF, text, Word, or image
                                            · up to 10 MB
                                            <input
                                                name="file"
                                                className="input"
                                                type="file"
                                                accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx"
                                            />
                                        </label>
                                    ) : (
                                        <label style={{ flexDirection: "row" }}>
                                            <input
                                                name="urgent"
                                                type="checkbox"
                                            />
                                            Mark as time sensitive
                                        </label>
                                    )}
                                    <label
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "start",
                                        }}
                                    >
                                        <input type="checkbox" required />I have
                                        permission to share this content.
                                    </label>
                                    {error && (
                                        <p
                                            role="alert"
                                            style={{
                                                color: "#f8b3a4",
                                                margin: 0,
                                            }}
                                        >
                                            {error}
                                        </p>
                                    )}
                                    <button
                                        disabled={busy}
                                        className="primary"
                                        type="submit"
                                    >
                                        {busy
                                            ? "Saving…"
                                            : modal === "upload"
                                              ? "Upload resource"
                                              : "Post notice"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
            {flashcardSubject && (
                <FlashcardDeck
                    subject={flashcardSubject}
                    onClose={() => setFlashcardSubject(null)}
                />
            )}
            {toast && (
                <div role="status" className="toast">
                    {toast}
                </div>
            )}
        </div>
    )
}
