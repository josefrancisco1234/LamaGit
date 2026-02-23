"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Trash2,
  DollarSign,
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

interface GameHistoryData {
  games: GameRecord[]
  deposits: DepositRecord[]
  stats: {
    totalGames: number
    wins: number
    losses: number
    winRate: string
    totalBet: number
    totalPayout: number
    net: number
    totalDeposited: number
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
  const [gameHistory, setGameHistory] = React.useState<GameHistoryData | null>(null)
  const [loadingHistory, setLoadingHistory] = React.useState(false)

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

    const interval = setInterval(() => {
      fetchUserssilent()
      fetchRechargesSilent()
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

  const resetAllBalances = async (amount: number) => {
    if (!confirm(`Seguro que quieres poner TODOS los balances en S/ ${amount}?`)) {
      return
    }
    try {
      const res = await fetch('/api/admin/global', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'reset_all_balances', amount }),
      })

      if (res.ok) {
        addLog(`TODOS los balances reseteados a S/ ${amount}`)
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

                  {/* Set Balance */}
                  <div>
                    <label className="text-sm text-muted-foreground">Forzar Balance</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        placeholder="Nuevo balance"
                      />
                      <Button
                        onClick={() => setUserBalance(selectedUser.id, Number(newBalance))}
                        disabled={!newBalance}
                      >
                        <DollarSign className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToBalance(selectedUser.id, 100)}
                    >
                      +S/ 100
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToBalance(selectedUser.id, 1000)}
                    >
                      +S/ 1000
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToBalance(selectedUser.id, -100)}
                    >
                      -S/ 100
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserBalance(selectedUser.id, 0)}
                    >
                      Poner en 0
                    </Button>
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

            {/* Global Actions */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-4">Acciones Globales</h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => resetAllBalances(100)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset todos a S/ 100
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => resetAllBalances(1000)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Dar S/ 1000 a todos
                </Button>
              </div>
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
                      <div className="bg-secondary rounded-lg p-2 col-span-2">
                        <p className="text-muted-foreground">Depositos totales</p>
                        <p className="font-bold text-sm text-primary">S/ {gameHistory.stats.totalDeposited.toFixed(2)}</p>
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
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">Error cargando historial</p>
                )}
              </div>
            )}

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
