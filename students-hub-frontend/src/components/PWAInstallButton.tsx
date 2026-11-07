import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePWAInstall } from "./usePWAInstall"

export default function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall()
  const [showGuide, setShowGuide] = React.useState(false)

  if (isInstalled) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(181,232,202,0.12)",
          border: "1px solid rgba(181,232,202,0.3)",
          color: "#b5e8ca",
          borderRadius: 8,
          padding: compact ? "4px 8px" : "6px 12px",
          fontSize: 11,
          fontWeight: 600,
        }}
        title="Running as native installed app"
      >
        <span>✓</span> Installed App
      </span>
    )
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install()
      if (!ok) setShowGuide(true)
    } else {
      setShowGuide(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "linear-gradient(135deg, rgba(167,139,250,0.22), rgba(52,211,153,0.15))",
          border: "1px solid rgba(196,181,253,0.45)",
          color: "#e2dcff",
          borderRadius: 8,
          padding: compact ? "6px 10px" : "8px 14px",
          fontSize: compact ? 11 : 12,
          fontWeight: 600,
          cursor: "pointer",
          transition: "transform 0.15s, background 0.15s, border-color 0.15s",
          boxShadow: "0 4px 12px rgba(167,139,250,0.15)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)"
          e.currentTarget.style.borderColor = "#c4b5fd"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.borderColor = "rgba(196,181,253,0.45)"
        }}
        title="Download and install on Android or device"
      >
        <span style={{ fontSize: 13 }}>📲</span>
        <span>{isAndroid ? "Download on Android" : "Download App"}</span>
      </button>

      {/* Android & Mobile Installation Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <div
            className="overlay"
            style={{ zIndex: 1200 }}
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              className="dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 440 }}
            >
              <div className="between">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(196,181,253,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    🤖
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, margin: 0 }}>Install on Android</h2>
                    <span style={{ fontSize: 11, color: "#9ca0af" }}>
                      Standalone mobile app · Zero contradiction
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="button tiny"
                  onClick={() => setShowGuide(false)}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 16,
                  margin: "18px 0 14px",
                }}
              >
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#c4b5fd",
                      color: "#1d1929",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div style={{ fontSize: 13, color: "#e3e5ed" }}>
                    <strong>Tap the browser menu (⋮)</strong> in Chrome or your Android browser at the top right.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#c4b5fd",
                      color: "#1d1929",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div style={{ fontSize: 13, color: "#e3e5ed" }}>
                    Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#b5e8ca",
                      color: "#102319",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div style={{ fontSize: 13, color: "#e3e5ed" }}>
                    Tap <strong>Install</strong>. Students Hub will be added to your Android app drawer with full offline access and fast performance!
                  </div>
                </div>
              </div>

              {isInstallable && (
                <button
                  type="button"
                  className="primary"
                  style={{ width: "100%", marginBottom: 8 }}
                  onClick={async () => {
                    await install()
                    setShowGuide(false)
                  }}
                >
                  📥 Trigger Android System Install Prompt
                </button>
              )}

              <div style={{ fontSize: 11, color: "#9da1b2", textAlign: "center", marginTop: 8 }}>
                {isIOS
                  ? "On iPhone / iPad: Tap Share (⎋) in Safari, then tap 'Add to Home Screen'."
                  : "Optimized for Android: Fast start, offline caching, and responsive touch controls."}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
