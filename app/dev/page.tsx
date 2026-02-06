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
  Eye,
  Settings
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

  // Guardar password para usarla en las llamadas API
  const passwordRef = React.useRef("")

  const addLog = (message: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 49)])
  }

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
