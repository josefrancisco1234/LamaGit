"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Trash2,
  Users,
  RefreshCw,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Clock,
  History,
} from "lucide-react"

const DEV_PASSWORD = "troxomoroxo"

interface UserData {
  id: string
  email: string
  username: string
  balance: number
  created_at: string
  banned?: boolean
}

interface GameRecord {
  id: string
  result: number
  threshold: number
  bet_amount: number
  won: boolean
  payout: number
  created_at: string
}

interface DepositRecord {
  amount: number
  created_at: string
}

interface WithdrawalRecord {
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface GameHistoryData {
  games: GameRecord[]
  deposits: DepositRecord[]
  withdrawals: WithdrawalRecord[]
  stats: {
    totalGames: number
    wins: number
    losses: number
    winRate: string
    totalBet: number
    totalPayout: number
    net: number
    totalDeposited: number
    totalWithdrawn: number
  }
}

interface RechargeRequest {
  id: string
  user_id: string
  username: string
  amount: number
  code: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  resolved_at?: string
}

interface WithdrawalRequest {
  id: string
  user_id: string
  username: string
  amount: number
  holder_name: string
  phone: string
  document_id: string
  cci: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  resolved_at?: string
}

interface CommunityMessage {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
}

export default function DevPage() {
  const [authenticated, setAuthenticated] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState("")

  const [users, setUsers] = React.useState<UserData[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedUser, setSelectedUser] = React.useState<UserData | null>(null)
  const [newBalance, setNewBalance] = React.useState("")
  const [actionLog, setActionLog] = React.useState<string[]>([])
  const [recharges, setRecharges] = React.useState<RechargeRequest[]>([])
  const [loadingRecharges, setLoadingRecharges] = React.useState(false)
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRequest[]>([])
  const [loadingWithdrawals, setLoadingWithdrawals] = React.useState(false)
  const [gameHistory, setGameHistory] = React.useState<GameHistoryData | null>(null)
  const [loadingHistory, setLoadingHistory] = React.useState(false)
  const [communityMessages, setCommunityMessages] = React.useState<CommunityMessage[]>([])

  // Guardar password para usarla en las llamadas API
  const passwordRef = React.useRef("")

  const addLog = (message: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 49)])
  }

  // Auto-refresh cada 5 segundos cuando esta autenticado
  React.useEffect(() => {
    if (!authenticated) return

    // Cargar al entrar
    fetchUsers()
    fetchRecharges()
    fetchWithdrawals()
    fetchCommunityChat()

    const interval = setInterval(() => {
      fetchUserssilent()
      fetchRechargesSilent()
      fetchWithdrawalsSilent()
      fetchCommunityChat()
    }, 5000)

    return () => clearInterval(interval)
  }, [authenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === DEV_PASSWORD) {
      setAuthenticated(true)
      setPasswordError("")
      passwordRef.current = password
      addLog("Sesion de dev iniciada")
    } else {
      setPasswordError("Contrasena incorrecta")
    }
  }

  // Headers con password para autenticar
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-password': passwordRef.current,
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        headers: getHeaders(),
      })

      if (!res.ok) {
        const error = await res.json()
        addLog(`Error: ${error.error || res.status}`)
        setLoading(false)
        return
      }

      const data = await res.json()
      setUsers(data)
      addLog(`Cargados ${data.length} usuarios`)
    } catch (error) {
      addLog(`Error cargando usuarios: ${error}`)
    }
    setLoading(false)
  }

  const setUserBalance = async (userId: string, balance: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ balance }),
      })

      if (res.ok) {
        addLog(`Balance de ${selectedUser?.username} cambiado a S/ ${balance}`)
        fetchUsers()
        setNewBalance("")
      } else {
        const error = await res.json()
        addLog(`Error: ${error.error || res.status}`)
      }
    } catch (error) {
      addLog(`Error: ${error}`)
    }
  }

  const addToBalance = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      await setUserBalance(userId, Number(user.balance) + amount)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm(`Seguro que quieres BORRAR este usuario? Esta accion no se puede deshacer.`)) {
      return
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })

      if (res.ok) {
        addLog(`Usuario ${selectedUser?.username} ELIMINADO`)
        setSelectedUser(null)
        fetchUsers()
      } else {
        const error = await res.json()
        addLog(`Error: ${error.error || res.status}`)
      }
    } catch (error) {
      addLog(`Error eliminando usuario: ${error}`)
    }
  }

  const toggleBan = async (userId: string, banned: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ banned }),
      })

      if (res.ok) {
        addLog(`Usuario ${selectedUser?.username} ${banned ? 'BANEADO' : 'DESBANEADO'}`)
        fetchUsers()
      } else {
        const error = await res.json()
        addLog(`Error: ${error.error || res.status}`)
      }
    } catch (error) {
      addLog(`Error: ${error}`)
    }
  }

  // Silent versions (no loading spinners, no logs) for auto-refresh
  const fetchUserssilent = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch {}
  }

  const fetchRechargesSilent = async () => {
    try {
      const res = await fetch('/api/admin/recharges', { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setRecharges(data)
      }
    } catch {}
  }

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true)
    try {
      const res = await fetch('/api/admin/withdrawals', { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setWithdrawals(data)
        const pending = data.filter((w: WithdrawalRequest) => w.status === 'pending').length
        addLog(`Cargados ${data.length} retiros (${pending} pendientes)`)
      }
    } catch (error) {
      addLog(`Error cargando retiros: ${error}`)
    }
    setLoadingWithdrawals(false)
  }

  const fetchWithdrawalsSilent = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals', { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setWithdrawals(data)
      }
    } catch {}
  }

  const fetchCommunityChat = async () => {
    try {
      const res = await fetch('/api/admin/chat', { headers: getHeaders() })
      if (res.ok) setCommunityMessages(await res.json())
    } catch {}
  }

  const resetCommunityChat = async () => {
    if (!confirm('Seguro que quieres borrar TODOS los mensajes del chat? Esta accion no se puede deshacer.')) return
    try {
      const res = await fetch('/api/admin/chat', { method: 'DELETE', headers: getHeaders() })
      if (res.ok) {
        addLog('Chat comunitario reseteado')
        setCommunityMessages([])
      } else {
        addLog('Error reseteando chat')
      }
    } catch {}
  }

  const handleWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ id, action }),
      })
      if (res.ok) {
        const w = withdrawals.find(w => w.id === id)
        addLog(`Retiro de ${w?.username} (S/ ${w?.amount}) ${action === 'approve' ? 'APROBADO — balance deducido' : 'RECHAZADO'}`)
        fetchWithdrawals()
        fetchUsers()
      } else {
        const error = await res.json()
        addLog(`Error: ${error.error}`)
      }
    } catch (error) {
      addLog(`Error: ${error}`)
    }
  }

  // Recargas
  const fetchRecharges = async () => {
    setLoadingRecharges(true)
    try {
      const res = await fetch('/api/admin/recharges', {
        headers: getHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setRecharges(data)
        const pending = data.filter((r: RechargeRequest) => r.status === 'pending').length
        addLog(`Cargadas ${data.length} recargas (${pending} pendientes)`)
      }
    } catch (error) {
      addLog(`Error cargando recargas: ${error}`)
    }
    setLoadingRecharges(false)
  }

  const handleRecharge = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/recharges', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ id, action }),
      })
      if (res.ok) {
        const recharge = recharges.find(r => r.id === id)
        addLog(`Recarga de ${recharge?.username} (S/ ${recharge?.amount}) ${action === 'approve' ? 'APROBADA' : 'RECHAZADA'}`)
        fetchRecharges()
        fetchUsers()
      } else {
        const error = await res.json()
        addLog(`Error: ${error.error}`)
      }
    } catch (error) {
      addLog(`Error: ${error}`)
    }
  }

  const fetchGameHistory = async (userId: string) => {
    setLoadingHistory(true)
    setGameHistory(null)
    try {
      const res = await fetch(`/api/admin/game-history?userId=${userId}`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setGameHistory(data)
      }
    } catch {}
    setLoadingHistory(false)
  }

  // Cargar historial al seleccionar usuario
  React.useEffect(() => {
    if (selectedUser) fetchGameHistory(selectedUser.id)
    else setGameHistory(null)
  }, [selectedUser?.id])

  const pendingRecharges = recharges.filter(r => r.status === 'pending')

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Dev Control</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Contrasena</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contrasena"
                className="mt-1"
              />
              {passwordError && (
                <p className="text-destructive text-sm mt-1">{passwordError}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Acceder
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Admin Panel
  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Dev Control Panel</h1>
          </div>
          <Button variant="outline" onClick={() => setAuthenticated(false)}>
            Cerrar Sesion
          </Button>
        </div>

        {/* Recargas Pendientes */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Recargas Pendientes ({pendingRecharges.length})
            </h2>
            <Button onClick={fetchRecharges} disabled={loadingRecharges} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingRecharges ? 'animate-spin' : ''}`} />
              {loadingRecharges ? 'Cargando...' : 'Cargar'}
            </Button>
          </div>

          {pendingRecharges.length > 0 ? (
            <div className="space-y-3">
              {pendingRecharges.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3 border border-warning/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{req.username}</span>
                      <span className="text-2xl font-bold text-primary">S/ {Number(req.amount).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Codigo: {req.code} | {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      className="bg-success hover:bg-success/80 text-white"
                      onClick={() => handleRecharge(req.id, 'approve')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRecharge(req.id, 'reject')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {recharges.length === 0 ? 'Haz clic en "Cargar" para ver las recargas' : 'No hay recargas pendientes'}
            </p>
          )}
        </div>

        {/* Retiros Pendientes */}
        {(() => {
          const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending')
          return (
            <div className="bg-card border border-border rounded-xl p-4 mb-6" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Retiros Pendientes ({pendingWithdrawals.length})
                </h2>
                <Button onClick={fetchWithdrawals} disabled={loadingWithdrawals} size="sm">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingWithdrawals ? 'animate-spin' : ''}`} />
                  {loadingWithdrawals ? 'Cargando...' : 'Cargar'}
                </Button>
              </div>

              {pendingWithdrawals.length > 0 ? (
                <div className="space-y-3">
                  {pendingWithdrawals.map((w) => (
                    <div key={w.id} className="bg-secondary/30 rounded-lg p-3 border" style={{ borderColor: 'rgba(34,197,94,0.25)' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{w.username}</span>
                            <span className="text-xl font-bold text-green-400">S/ {Number(w.amount).toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            <span><strong className="text-foreground">Titular:</strong> {w.holder_name || '—'}</span>
                            <span><strong className="text-foreground">Celular:</strong> +51 {w.phone}</span>
                            <span><strong className="text-foreground">DNI:</strong> {w.document_id}</span>
                            <span><strong className="text-foreground">CCI:</strong> {w.cci}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(w.created_at).toLocaleString('es-PE')}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/80 text-white"
                            onClick={() => handleWithdrawal(w.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleWithdrawal(w.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {withdrawals.length === 0 ? 'Haz clic en "Cargar" para ver los retiros' : 'No hay retiros pendientes'}
                </p>
              )}
            </div>
          )
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Usuarios ({users.length})
              </h2>
              <Button onClick={fetchUsers} disabled={loading} size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Cargando...' : 'Cargar'}
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2">Usuario</th>
                    <th className="text-left p-2">Balance</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-right p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border/50 hover:bg-secondary/30 cursor-pointer ${
                        selectedUser?.id === user.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="p-2">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</div>
                      </td>
                      <td className="p-2">
                        <span className="text-primary font-semibold">
                          S/ {Number(user.balance).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-2">
                        {user.banned ? (
                          <span className="text-destructive flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Baneado
                          </span>
                        ) : (
                          <span className="text-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUser(user)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Haz clic en "Cargar" para ver los usuarios
                </p>
              )}
            </div>
          </div>

          {/* Selected User Panel */}
          <div className="space-y-4">
            {/* User Actions */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-4">
                {selectedUser ? `Acciones: ${selectedUser.username}` : 'Selecciona un usuario'}
              </h2>

              {selectedUser ? (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="bg-secondary/30 rounded-lg p-3 text-sm">
                    <p><strong>ID:</strong> {selectedUser.id}</p>
                    <p><strong>Username:</strong> {selectedUser.username}</p>
                    <p><strong>Balance:</strong> S/ {Number(selectedUser.balance).toFixed(2)}</p>
                  </div>

                  {/* Add / Subtract Balance */}
                  <div>
                    <label className="text-sm text-muted-foreground">Ajustar Balance</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        placeholder="Monto"
                        min={0}
                      />
                      <Button
                        onClick={() => addToBalance(selectedUser.id, Number(newBalance))}
                        disabled={!newBalance || Number(newBalance) <= 0}
                        className="shrink-0"
                      >
                        +S/
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addToBalance(selectedUser.id, -Number(newBalance))}
                        disabled={!newBalance || Number(newBalance) <= 0}
                        className="shrink-0"
                      >
                        -S/
                      </Button>
                    </div>
                  </div>

                  {/* Ban/Unban */}
                  <Button
                    variant={selectedUser.banned ? "default" : "secondary"}
                    className="w-full"
                    onClick={() => toggleBan(selectedUser.id, !selectedUser.banned)}
                  >
                    {selectedUser.banned ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Desbanear
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Banear Usuario
                      </>
                    )}
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => deleteUser(selectedUser.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Usuario
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Selecciona un usuario de la lista para ver las acciones disponibles.
                </p>
              )}
            </div>


            {/* Game History */}
            {selectedUser && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Historial: {selectedUser.username}
                  </h2>
                  <button
                    onClick={() => fetchGameHistory(selectedUser.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingHistory ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Cargando...</p>
                ) : gameHistory ? (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-muted-foreground">Partidas</p>
                        <p className="font-bold text-sm">{gameHistory.stats.totalGames}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-muted-foreground">Win Rate</p>
                        <p className="font-bold text-sm text-primary">{gameHistory.stats.winRate}%</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-muted-foreground">Ganadas / Perdidas</p>
                        <p className="font-bold text-sm">
                          <span className="text-success">{gameHistory.stats.wins}</span>
                          {" / "}
                          <span className="text-destructive">{gameHistory.stats.losses}</span>
                        </p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-muted-foreground">Neto</p>
                        <p className={`font-bold text-sm ${gameHistory.stats.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {gameHistory.stats.net >= 0 ? '+' : ''}S/ {gameHistory.stats.net.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-muted-foreground">Dinero apostado</p>
                        <p className="font-bold text-sm">S/ {gameHistory.stats.totalBet.toFixed(2)}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-muted-foreground">Dinero ganado</p>
                        <p className="font-bold text-sm text-success">S/ {gameHistory.stats.totalPayout.toFixed(2)}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-muted-foreground">Depositos totales</p>
                        <p className="font-bold text-sm text-primary">S/ {gameHistory.stats.totalDeposited.toFixed(2)}</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-muted-foreground">Retirado total</p>
                        <p className="font-bold text-sm text-destructive">-S/ {(gameHistory.stats.totalWithdrawn ?? 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Last 20 games */}
                    {gameHistory.games.length > 0 ? (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2">Ultimas {gameHistory.games.length} partidas</p>
                        {gameHistory.games.map((g) => (
                          <div
                            key={g.id}
                            className={`flex items-center justify-between px-2 py-1.5 rounded text-xs border ${
                              g.won
                                ? 'bg-success/10 border-success/20'
                                : 'bg-destructive/10 border-destructive/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`font-bold w-12 ${g.won ? 'text-success' : 'text-destructive'}`}>
                                {g.won ? 'GANO' : 'PERDIO'}
                              </span>
                              <span className="font-mono text-muted-foreground">{Number(g.result).toFixed(2)} / {g.threshold}</span>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                              <span className="text-muted-foreground">S/ {Number(g.bet_amount).toFixed(2)}</span>
                              {g.won && <span className="text-success font-bold">+S/ {Number(g.payout).toFixed(2)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs text-center py-2">Sin partidas registradas</p>
                    )}

                    {/* Deposits list */}
                    {gameHistory.deposits?.length > 0 && (
                      <div className="space-y-1 mt-3 max-h-40 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2">Depositos ({gameHistory.deposits.length})</p>
                        {gameHistory.deposits.map((d, i) => (
                          <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded text-xs border bg-primary/10 border-primary/20">
                            <span className="text-muted-foreground">
                              {new Date(d.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-primary font-bold">+S/ {Number(d.amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Withdrawals list */}
                    {gameHistory.withdrawals?.length > 0 && (
                      <div className="space-y-1 mt-3 max-h-40 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2">Retiros ({gameHistory.withdrawals.length})</p>
                        {gameHistory.withdrawals.map((w, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-2 py-1.5 rounded text-xs border ${
                              w.status === 'approved'
                                ? 'bg-destructive/10 border-destructive/20'
                                : w.status === 'rejected'
                                ? 'bg-secondary border-border'
                                : 'bg-yellow-500/10 border-yellow-500/20'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${
                                w.status === 'approved' ? 'text-destructive' :
                                w.status === 'rejected' ? 'text-muted-foreground' :
                                'text-yellow-400'
                              }`}>
                                {w.status === 'approved' ? 'APROBADO' : w.status === 'rejected' ? 'RECHAZADO' : 'PENDIENTE'}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(w.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className={`font-bold ${w.status === 'rejected' ? 'text-muted-foreground line-through' : 'text-destructive'}`}>
                              -S/ {Number(w.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">Error cargando historial</p>
                )}
              </div>
            )}

            {/* Chat Comunitario */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Chat Comunitario ({communityMessages.length})
                </h2>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={resetCommunityChat}
                  disabled={communityMessages.length === 0}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>

              {communityMessages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Sin mensajes aún</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {communityMessages.map((m) => (
                    <div key={m.id} className="flex items-start gap-2 px-2 py-1.5 rounded text-xs border bg-secondary/30 border-border/50">
                      <span className="font-bold text-primary shrink-0">{m.username}</span>
                      <span className="text-foreground flex-1 break-words">{m.message}</span>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(m.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Log */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-4">Log de Acciones</h2>
              <div className="bg-black/50 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs">
                {actionLog.length === 0 ? (
                  <span className="text-muted-foreground">Sin acciones recientes...</span>
                ) : (
                  actionLog.map((log, i) => (
                    <div key={i} className="text-green-400">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
