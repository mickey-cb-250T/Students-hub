import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

// Web Audio API ambient noise generator & chime (pure code, zero external audio files)
class AmbientAudioController {
  private ctx: AudioContext | null = null
  private noiseNode: AudioNode | null = null
  private gainNode: GainNode | null = null
  private isPlaying = false

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  startRainNoise() {
    try {
      this.initContext()
      if (!this.ctx || this.isPlaying) return

      const bufferSize = this.ctx.sampleRate * 2
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let lastOut = 0.0

      // Brown noise (soothing warm rain / library tone)
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        output[i] = (lastOut + (0.02 * white)) / 1.02
        lastOut = output[i]
        output[i] *= 2.5
      }

      const whiteNoise = this.ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer
      whiteNoise.loop = true

      // Lowpass filter for smooth rain sound
      const filter = this.ctx.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(650, this.ctx.currentTime)

      this.gainNode = this.ctx.createGain()
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime)
      this.gainNode.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 1.2)

      whiteNoise.connect(filter)
      filter.connect(this.gainNode)
      this.gainNode.connect(this.ctx.destination)

      whiteNoise.start()
      this.noiseNode = whiteNoise
      this.isPlaying = true
    } catch {
      // Audio autoplay gracefully handled
    }
  }

  stopRainNoise() {
    try {
      if (this.gainNode && this.ctx) {
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5)
        setTimeout(() => {
          if (this.noiseNode && "stop" in this.noiseNode) {
            (this.noiseNode as AudioScheduledSourceNode).stop()
          }
          this.noiseNode = null
          this.isPlaying = false
        }, 500)
      } else {
        this.isPlaying = false
      }
    } catch {
      this.isPlaying = false
    }
  }

  playCompletionChime() {
    try {
      this.initContext()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      // Chord progression E5 -> G#5 -> B5
      osc.frequency.setValueAtTime(659.25, now)
      osc.frequency.exponentialRampToValueAtTime(830.61, now + 0.15)
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.35)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 1.3)
    } catch {
      // Ignore audio error
    }
  }

  toggleAmbient(active: boolean) {
    if (active) {
      this.startRainNoise()
    } else {
      this.stopRainNoise()
    }
  }
}

const audioController = new AmbientAudioController()

export default function FocusPod({ onComplete }: { onComplete?: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"focus" | "break">("focus")
  const [timeLeft, setTimeLeft] = React.useState(25 * 60)
  const [isRunning, setIsRunning] = React.useState(false)
  const [ambientAudio, setAmbientAudio] = React.useState(false)
  const [sessionsCompleted, setSessionsCompleted] = React.useState<number>(() => {
    try {
      return Number(localStorage.getItem("campus_focus_sessions") || "0")
    } catch {
      return 0
    }
  })

  const totalTime = mode === "focus" ? 25 * 60 : 5 * 60

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((t) => t - 1)
      }, 1000)
    } else if (isRunning && timeLeft === 0) {
      audioController.playCompletionChime()
      if (mode === "focus") {
        const next = sessionsCompleted + 1
        setSessionsCompleted(next)
        try {
          localStorage.setItem("campus_focus_sessions", String(next))
        } catch {}
        setMode("break")
        setTimeLeft(5 * 60)
        onComplete?.()
      } else {
        setMode("focus")
        setTimeLeft(25 * 60)
      }
      setIsRunning(false)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRunning, timeLeft, mode, sessionsCompleted, onComplete])

  const toggleRun = () => {
    const next = !isRunning
    setIsRunning(next)
    if (ambientAudio) {
      audioController.toggleAmbient(next)
    }
  }

  const toggleSound = () => {
    const next = !ambientAudio
    setAmbientAudio(next)
    if (isRunning) {
      audioController.toggleAmbient(next)
    }
  }

  const resetTimer = (newMode = mode) => {
    setIsRunning(false)
    audioController.stopRainNoise()
    setMode(newMode)
    setTimeLeft(newMode === "focus" ? 25 * 60 : 5 * 60)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "8px 14px",
          borderRadius: 8,
          background: isRunning ? "rgba(196,181,253,0.18)" : "rgba(255,255,255,0.06)",
          border: isRunning ? "1px solid #c4b5fd" : "1px solid rgba(255,255,255,0.14)",
          color: isRunning ? "#d8cfff" : "#c5c7d2",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          transition: "all 0.25s ease",
        }}
        title="Open Pomodoro Study Pod"
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isRunning ? "#b5e8ca" : "#c4b5fd",
            boxShadow: isRunning ? "0 0 10px #b5e8ca" : "none",
          }}
        />
        <span>{isRunning ? formattedTime : "Focus Pod"}</span>
        {sessionsCompleted > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.1)",
              color: "#baa9e8",
            }}
          >
            {sessionsCompleted}⚡
          </span>
        )}
      </motion.button>

      {/* Popover Pod Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 12px)",
              width: 300,
              zIndex: 120,
              background: "linear-gradient(145deg, #1f212cee, #161822f6)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              color: "#f3f3f7",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => resetTimer("focus")}
                  style={{
                    border: "none",
                    background: mode === "focus" ? "#c4b5fd" : "rgba(255,255,255,0.06)",
                    color: mode === "focus" ? "#201b30" : "#9ca0af",
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  25m Study
                </button>
                <button
                  type="button"
                  onClick={() => resetTimer("break")}
                  style={{
                    border: "none",
                    background: mode === "break" ? "#b5e8ca" : "rgba(255,255,255,0.06)",
                    color: mode === "break" ? "#182a20" : "#9ca0af",
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  5m Break
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9ca0af",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>

            {/* Circular Timer Visual */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "16px 0" }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke={mode === "focus" ? "#c4b5fd" : "#b5e8ca"}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - progress / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    transition={{ ease: "linear", duration: 0.5 }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>{formattedTime}</span>
                  <span style={{ fontSize: 10, color: "#9ca0af", letterSpacing: 1, textTransform: "uppercase" }}>
                    {mode === "focus" ? "Deep Focus" : "Rest Period"}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={toggleRun}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: isRunning ? "#ef4444" : "#c4b5fd",
                  color: isRunning ? "#fff" : "#1f1b2e",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {isRunning ? "Pause" : "Start Session"}
              </motion.button>
              <button
                type="button"
                onClick={() => resetTimer()}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#d1d5db",
                  cursor: "pointer",
                  fontSize: 12,
                }}
                title="Reset timer"
              >
                Reset
              </button>
            </div>

            {/* Ambient Sound Toggle */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid rgba(255,255,255,0.08)",
                fontSize: 11,
              }}
            >
              <span style={{ color: "#9ca0af" }}>🌧️ Ambient Rain Noise</span>
              <button
                type="button"
                onClick={toggleSound}
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: ambientAudio ? "rgba(181,232,202,0.2)" : "rgba(255,255,255,0.05)",
                  color: ambientAudio ? "#b5e8ca" : "#9ca0af",
                  borderRadius: 6,
                  padding: "3px 8px",
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                {ambientAudio ? "ON" : "OFF"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
