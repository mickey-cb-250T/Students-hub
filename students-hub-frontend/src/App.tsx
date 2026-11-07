import * as React from "react"
import CampusHub from "./components/CampusHub"
import LoginPage from "./components/LoginPage"

export default function App() {
  const [token, setToken] = React.useState<string | null>(() => {
    try { return window.localStorage.getItem("students-hub-token") } catch { return null }
  })
  const [guest, setGuest] = React.useState(false)

  function signIn(value: string) {
    try { window.localStorage.setItem("students-hub-token", value) } catch {}
    setToken(value)
  }

  function signOut() {
    try { window.localStorage.removeItem("students-hub-token") } catch {}
    setToken(null)
    setGuest(false)
  }

  if (!token && !guest) {
    return <LoginPage onAuthenticated={signIn} onGuest={() => setGuest(true)} />
  }

  return (
    <>
      <CampusHub
        title="campus."
        token={token}
        onSignOut={signOut}
        onRequireLogin={() => {
          signOut()
        }}
      />
      <button
        type="button"
        onClick={signOut}
        style={{
          position: "fixed",
          zIndex: 80,
          right: 12,
          bottom: 12,
          border: "1px solid #ffffff30",
          borderRadius: 999,
          padding: "7px 13px",
          background: "#1b1a25ee",
          color: "#e9e4f5",
          font: "600 11px 'DM Sans', sans-serif",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          transition: "transform 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        {token ? "Sign out" : "Back to sign in"}
      </button>
    </>
  )
}

