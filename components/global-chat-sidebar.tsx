"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import type { Message, Profile } from "@/types/database"
import { Send, MessageCircle, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { RealtimeChannel } from "@supabase/supabase-js"

interface ChatMessage extends Message {
  profiles: Profile
}

export function GlobalChatSidebar() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [onlineCount, setOnlineCount] = React.useState(1700)

  const { user, profile } = useAuth()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const channelRef = React.useRef<RealtimeChannel | null>(null)

  // Ref for messages to prevent stale closure in realtime callback
  const messagesRef = React.useRef<ChatMessage[]>([])
  React.useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Simulated online counter
  React.useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const change = Math.floor(Math.random() * 20) - 10
        return Math.max(1500, Math.min(2000, prev + change))
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch initial messages
  const fetchMessages = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })
      .limit(60)

    if (data && !error) {
      setMessages(data.reverse() as ChatMessage[])
    }
  }, [])

  // Subscribe to realtime updates
  React.useEffect(() => {
    fetchMessages()

    // Setup realtime subscription
    channelRef.current = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          // Fetch the full message with profile
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(*)")
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as ChatMessage].slice(-100))
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to chat messages")
        }
      })

    // Handle visibility change for reconnection
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchMessages()
        if (channelRef.current?.state !== "joined") {
          channelRef.current?.subscribe()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      channelRef.current?.unsubscribe()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchMessages])

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return

    if (newMessage.length > 280) {
      return
    }

    setSending(true)

    const { error } = await supabase.from("messages").insert({
      user_id: user.id,
      text: newMessage.trim(),
    })

    if (!error) {
      setNewMessage("")
    }

    setSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Collapsed state
  if (isCollapsed) {
    return (
      <aside className="w-14 border-l border-border bg-chat-gradient flex flex-col items-center py-4 hidden md:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <MessageCircle className="w-5 h-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mt-2 [writing-mode:vertical-lr]">
          Chat Global
        </span>
      </aside>
    )
  }

  return (
    <aside className="w-[340px] border-l border-border bg-chat-gradient flex flex-col hidden md:flex">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-accent" />
          <span className="font-medium">Chat Global</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{onlineCount.toLocaleString()}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {getInitials(msg.profiles?.username || "??")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {msg.profiles?.username || "Usuario"}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  {msg.text}
                </p>
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No hay mensajes aun. Se el primero!
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      {user ? (
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe un mensaje..."
              maxLength={280}
              disabled={sending}
              className="bg-secondary border-border"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {newMessage.length}/280
          </p>
        </div>
      ) : (
        <div className="p-4 border-t border-border text-center shrink-0">
          <p className="text-sm text-muted-foreground">
            Inicia sesion para chatear
          </p>
        </div>
      )}
    </aside>
  )
}
