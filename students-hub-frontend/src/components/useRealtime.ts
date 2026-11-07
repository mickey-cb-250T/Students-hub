import { useEffect, useState, useRef, useCallback } from "react"

export interface RealtimeEvent {
  type: "CONNECTED" | "RESOURCE_ADDED" | "RESOURCE_DELETED" | "NOTICE_ADDED" | "NOTICE_DELETED" | "CLASSROOM_CREATED" | "CLASSROOM_JOINED" | "DOUBT_ADDED"
  resource?: any
  notice?: any
  classroom?: any
  classroom_id?: number
  id?: string | number
  actor?: string
  message?: string
  doubt?: any
  resourceId?: string
}

export function useRealtime(onEvent: (event: RealtimeEvent) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent
  const wsRef = useRef<WebSocket | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    // Only connect in browser environment
    if (typeof window === "undefined") return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/api/realtime/ws`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
      }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as RealtimeEvent
          onEventRef.current(data)
        } catch {}
      }

      ws.onclose = () => {
        setIsConnected(false)
        wsRef.current = null
        // Fallback to SSE if WS closes unexpectedly
        startSSE()
      }

      ws.onerror = () => {
        setIsConnected(false)
        ws.close()
      }
    } catch {
      startSSE()
    }

    function startSSE() {
      if (esRef.current) return
      try {
        const es = new EventSource("/api/realtime/stream")
        esRef.current = es

        es.onopen = () => {
          setIsConnected(true)
        }

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data) as RealtimeEvent
            onEventRef.current(data)
          } catch {}
        }

        es.onerror = () => {
          setIsConnected(false)
          es.close()
          esRef.current = null
          // Retry connecting in 5 seconds
          setTimeout(connect, 5000)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      wsRef.current?.close()
      esRef.current?.close()
      wsRef.current = null
      esRef.current = null
    }
  }, [connect])

  const broadcastEvent = async (event: RealtimeEvent) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(event))
      }
      await fetch("/api/realtime/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch(() => {})
    } catch {}
  }

  return { isConnected, broadcastEvent }
}
