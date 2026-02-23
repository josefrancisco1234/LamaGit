"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-provider"
import { MessageCircle, X, Send, Lock, Users } from "lucide-react"

interface ChatMessage {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
}

const UNLOCK_THRESHOLD = 200

// Paleta de colores por usuario (basada en el ID)
const USER_COLORS = [
  "#f0b616", "#22c55e", "#3b82f6", "#a855f7",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
]
function getUserColor(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

export function LiveChat() {
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [totalBet, setTotalBet] = React.useState(0)
  const [unlocked, setUnlocked] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [unread, setUnread] = React.useState(0)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const lastCountRef = React.useRef(0)

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  const fetchChat = React.useCallback(async (silent = false) => {
    try {
      const url = user ? `/api/chat?user_id=${user.id}` : '/api/chat'
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      setTotalBet(data.totalBet ?? 0)
      setUnlocked(data.unlocked ?? false)

      const newMsgs: ChatMessage[] = data.messages ?? []
      setMessages(newMsgs)

      if (silent && !open) {
        if (newMsgs.length > lastCountRef.current) {
          setUnread(prev => prev + (newMsgs.length - lastCountRef.current))
        }
        lastCountRef.current = newMsgs.length
      }
    } catch {}
  }, [user, open])

  React.useEffect(() => {
    fetchChat()
    const interval = setInterval(() => fetchChat(true), open ? 4000 : 20000)
    return () => clearInterval(interval)
  }, [fetchChat, open])

  React.useEffect(() => {
    if (open) setTimeout(scrollToBottom, 80)
  }, [messages, open])

  React.useEffect(() => {
    if (open) {
      setUnread(0)
      lastCountRef.current = messages.length
    }
  }, [open, messages])

  const handleSend = async () => {
    if (!user || !input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput("")
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          username: user.user_metadata?.username || user.email?.split("@")[0] || "Usuario",
          message: text,
        }),
      })
      await fetchChat()
    } catch {}
    setSending(false)
  }

  const progress = Math.min((totalBet / UNLOCK_THRESHOLD) * 100, 100)
  const uniqueUsers = new Set(messages.map(m => m.user_id)).size

  return (
    <>
      <style>{`
        .lc-wrap {
          position: fixed;
          bottom: 80px;
          right: 16px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .lc-panel {
          width: 270px;
          border-radius: 16px;
          background: linear-gradient(160deg, #0d1b3e 0%, #111827 60%, #0a1020 100%);
          border: 1px solid rgba(240,182,22,0.2);
          box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(240,182,22,0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: lc-in 0.2s ease;
          height: 520px;
          max-height: calc(100vh - 160px);
        }
        @keyframes lc-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .lc-header {
          padding: 10px 14px;
          background: rgba(240,182,22,0.07);
          border-bottom: 1px solid rgba(240,182,22,0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .lc-msgs {
          flex: 1;
          overflow-y: auto;
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lc-msgs::-webkit-scrollbar { width: 3px; }
        .lc-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .lc-msg-row {
          display: flex;
          gap: 6px;
          align-items: flex-start;
        }
        .lc-msg-row.own {
          flex-direction: row-reverse;
        }
        .lc-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .lc-bubble {
          max-width: 78%;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 0.75rem;
          line-height: 1.4;
          word-break: break-word;
        }
        .lc-bubble.other {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e2e8f0;
          border-bottom-left-radius: 3px;
        }
        .lc-bubble.own {
          background: rgba(240,182,22,0.15);
          border: 1px solid rgba(240,182,22,0.25);
          color: #e2e8f0;
          border-bottom-right-radius: 3px;
        }
        .lc-uname {
          font-size: 9px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .lc-time {
          font-size: 8px;
          color: rgba(255,255,255,0.25);
          margin-top: 2px;
        }
        .lc-input-row {
          padding: 8px 10px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .lc-locked-row {
          padding: 8px 10px 10px;
          border-top: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .lc-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(240,182,22,0.18);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 0.78rem;
          padding: 7px 10px;
          outline: none;
          transition: border-color 0.2s;
        }
        .lc-input:focus { border-color: rgba(240,182,22,0.45); }
        .lc-input::placeholder { color: #475569; }
        .lc-input:disabled { opacity: 0.4; cursor: not-allowed; }
        .lc-send {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0b616, #d4920a);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          align-self: center;
          transition: transform 0.15s;
          box-shadow: 0 2px 8px rgba(240,182,22,0.3);
        }
        .lc-send:hover:not(:disabled) { transform: scale(1.1); }
        .lc-send:disabled { opacity: 0.35; cursor: not-allowed; }
        .lc-fab {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0b616, #d4920a);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 18px rgba(240,182,22,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          flex-shrink: 0;
        }
        .lc-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(240,182,22,0.5); }
        .lc-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          background: #ef4444;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          border: 2px solid #0a0f1a;
        }
      `}</style>

      {/* Panel */}
      {open && (
        <div className="lc-wrap">
          <div className="lc-panel">
            {/* Header */}
            <div className="lc-header">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <span className="text-xs font-bold" style={{ color: "#f0b616" }}>Chat LamaBet</span>
                {messages.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
                    <Users className="w-2.5 h-2.5 inline mr-0.5" />
                    {uniqueUsers}
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages — always visible */}
            <div className="lc-msgs">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[11px]" style={{ color: "#334155" }}>Sin mensajes aún 👋</p>
                </div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.user_id === user?.id
                const color = getUserColor(msg.user_id)
                return (
                  <div key={msg.id} className={`lc-msg-row ${isOwn ? "own" : ""}`}>
                    {!isOwn && (
                      <div className="lc-avatar" style={{ background: color + "22", color }}>
                        {msg.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      {!isOwn && (
                        <div className="lc-uname" style={{ color }}>
                          {msg.username}
                        </div>
                      )}
                      <div className={`lc-bubble ${isOwn ? "own" : "other"}`}>
                        {msg.message}
                      </div>
                      <div className={`lc-time ${isOwn ? "text-right" : ""}`}>
                        {new Date(msg.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input — active if unlocked, locked bar otherwise */}
            {unlocked ? (
              <div className="lc-input-row">
                <input
                  className="lc-input"
                  placeholder="Mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  maxLength={300}
                />
                <button className="lc-send" onClick={handleSend} disabled={!input.trim() || sending}>
                  <Send className="w-3 h-3" style={{ color: "#0a0f1a" }} />
                </button>
              </div>
            ) : (
              <div className="lc-locked-row">
                <div className="flex gap-2 mb-2">
                  <input
                    className="lc-input"
                    placeholder="Apuesta S/200 para escribir..."
                    disabled
                  />
                  <button className="lc-send" disabled>
                    <Lock className="w-3 h-3" style={{ color: "#475569" }} />
                  </button>
                </div>
                <div className="flex justify-between text-[9px] mb-1" style={{ color: "#475569" }}>
                  <span>S/ {totalBet.toFixed(0)} apostados</span>
                  <span>S/ {UNLOCK_THRESHOLD} requerido</span>
                </div>
                <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ height: "100%", width: `${progress}%`, borderRadius: "2px", background: "linear-gradient(90deg, #f0b616, #d4920a)", transition: "width 0.5s" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB — always fixed bottom-right */}
      <button
        className="lc-fab"
        onClick={() => setOpen(v => !v)}
      >
        {open
          ? <X className="w-4 h-4" style={{ color: "#0a0f1a" }} />
          : <MessageCircle className="w-5 h-5" style={{ color: "#0a0f1a" }} />
        }
        {unread > 0 && !open && (
          <span className="lc-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
    </>
  )
}
