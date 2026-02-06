# LAMABET - Explicacion Completa del Codigo

## PROMPT PARA USAR CON GPT O CUALQUIER AI

Copia todo esto y pegalo en ChatGPT/Claude/etc para hacer preguntas:

---

# DESCRIPCION GENERAL

Tengo una aplicacion web llamada "LamaBet" - un juego de dados online con las siguientes caracteristicas:

- **Frontend**: Next.js 15 con React 19 y TypeScript
- **Estilos**: Tailwind CSS 4 con tema oscuro
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (serverless)
- **UI Components**: Radix UI (shadcn/ui)

---

# ARQUITECTURA DE CARPETAS

```
lama/
├── app/                    # Next.js App Router (rutas de la app)
│   ├── layout.tsx          # Layout raiz (envuelve toda la app)
│   ├── page.tsx            # Pagina principal (/)
│   ├── game/page.tsx       # Pagina del juego (/game)
│   └── auth/page.tsx       # Pagina de auth (/auth)
│
├── components/             # Componentes React
│   ├── auth-provider.tsx   # Contexto de autenticacion global
│   ├── auth-modal.tsx      # Modal de login/registro
│   ├── betting-panel.tsx   # Panel principal del juego
│   ├── header.tsx          # Header con balance y usuario
│   ├── left-sidebar.tsx    # Sidebar izquierdo
│   └── ui/                 # Componentes UI genericos (button, input, etc)
│
├── lib/                    # Utilidades y logica de negocio
│   ├── supabaseClient.ts   # Cliente de Supabase configurado
│   ├── wallet.ts           # Funciones de billetera (agregar/restar dinero)
│   └── utils.ts            # Logica del juego (multiplicadores, etc)
│
├── hooks/                  # Custom hooks de React
│   └── use-toast.ts        # Hook para notificaciones
│
├── types/                  # Tipos TypeScript
│   └── database.ts         # Tipos de la base de datos
│
└── public/                 # Assets estaticos (imagenes, iconos)
```

---

# BASE DE DATOS (Supabase/PostgreSQL)

## Tablas

### 1. profiles (Perfiles de usuario)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. wallets (Billeteras)
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  balance DECIMAL(10,2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. messages (Chat global)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Row Level Security (RLS)
- Cada usuario solo puede ver/modificar SU propia billetera
- Requiere JWT token valido para autenticar quien es el usuario

---

# FLUJO DE AUTENTICACION

## 1. Usuario hace login
```
Usuario ingresa email/password
    ↓
supabase.auth.signInWithPassword()
    ↓
Supabase valida y retorna JWT token
    ↓
Token se guarda en localStorage automaticamente
    ↓
onAuthStateChange dispara evento SIGNED_IN
    ↓
AuthProvider carga profile y wallet del usuario
    ↓
UI se actualiza mostrando balance
```

## 2. Usuario refresca la pagina
```
Pagina carga
    ↓
AuthProvider se monta
    ↓
onAuthStateChange dispara INITIAL_SESSION
    ↓
Si hay sesion en localStorage, la restaura
    ↓
Se cargan profile y wallet via fetch()
    ↓
UI muestra usuario logueado
```

## 3. Problema resuelto: Race Condition
- A veces INITIAL_SESSION dispara ANTES de que localStorage este listo
- Solucion: Fallback que lee localStorage directamente si session es null

---

# LOGICA DEL JUEGO DE DADOS

## Mecanica
1. El dado genera numeros de 0.01 a 98.02
2. Usuario elige un "umbral" (threshold)
3. Si resultado <= umbral, GANA
4. Si resultado > umbral, PIERDE

## Formula del Multiplicador
```
multiplicador = 99 / umbral
```

### Ejemplos:
| Umbral | Probabilidad | Multiplicador | Riesgo |
|--------|--------------|---------------|--------|
| 1      | 1%           | 99x           | Alto   |
| 25     | 25%          | 3.96x         | Medio  |
| 50     | 50%          | 1.98x         | Bajo   |
| 98     | 98%          | 1.01x         | Minimo |

## El "99" (House Edge)
- Si fuera 100/umbral seria juego justo (50% = 2x exacto)
- Con 99, la casa tiene 1% de ventaja matematica

---

# COMPONENTES PRINCIPALES

## 1. AuthProvider (auth-provider.tsx)
**Proposito**: Manejar estado de autenticacion en toda la app

**Patron**: React Context + Provider

```typescript
// Estado que maneja:
user: User | null          // Usuario de Supabase
profile: Profile | null    // Perfil (username)
wallet: Wallet | null      // Billetera (balance)
loading: boolean           // Si esta cargando

// Funciones que expone:
signIn(email, password)    // Iniciar sesion
signUp(email, password, username)  // Registrarse
signOut()                  // Cerrar sesion
refreshWallet()            // Actualizar balance
```

**Conceptos clave**:
- **useContext**: Compartir estado entre componentes sin prop drilling
- **useCallback**: Memorizar funciones para evitar re-renders
- **useRef**: Evitar "stale closures" en callbacks async
- **useEffect**: Ejecutar codigo al montar/actualizar componente

## 2. BettingPanel (betting-panel.tsx)
**Proposito**: Panel interactivo del juego

**Estado**:
```typescript
bet: number              // Monto apostado
threshold: number        // Umbral elegido (probabilidad)
rolling: boolean         // Si el dado esta girando
displayNumber: number    // Numero mostrado en animacion
lastResult: object       // Ultimo resultado (numero + si gano)
history: HistoryItem[]   // Historial de apuestas
```

**Flujo de una apuesta**:
```
Usuario presiona "Tirar Dado"
    ↓
Se genera resultado aleatorio (guardado en ref)
    ↓
Se inicia animacion (numeros aleatorios cada 50ms)
    ↓
Despues de 1.2 segundos, animacion termina
    ↓
Se muestra resultado final
    ↓
Si no es demo: se actualiza balance en BD
    ↓
UI se actualiza con nuevo balance
```

**Patron importante - Refs para callbacks async**:
```typescript
// PROBLEMA:
// setTimeout captura el valor de 'bet' al momento de crearse
// Si bet cambia despues, el timeout usa el valor viejo

// SOLUCION:
const pendingBetRef = useRef(bet)
useEffect(() => { pendingBetRef.current = bet }, [bet])
// En el callback: usar pendingBetRef.current en vez de bet
```

## 3. Wallet Functions (wallet.ts)
**Proposito**: Modificar balance del usuario

**Por que usa fetch() en vez de cliente Supabase**:
- El cliente Supabase se colgaba en Vercel (timeout de 10+ segundos)
- fetch() directo al REST API funciona perfectamente
- Requiere enviar el JWT token manualmente en headers

```typescript
// Headers necesarios para RLS:
{
  'apikey': SUPABASE_ANON_KEY,           // Siempre requerido
  'Authorization': `Bearer ${JWT_TOKEN}`, // Identifica al usuario
  'Content-Type': 'application/json'
}
```

---

# PATRONES Y CONCEPTOS IMPORTANTES

## 1. Stale Closure
**Problema**: Callbacks async capturan valores "viejos" de variables

```typescript
// MAL:
const [count, setCount] = useState(0)
setTimeout(() => {
  console.log(count) // Siempre muestra 0, aunque count haya cambiado
}, 1000)

// BIEN:
const countRef = useRef(count)
useEffect(() => { countRef.current = count }, [count])
setTimeout(() => {
  console.log(countRef.current) // Muestra el valor actual
}, 1000)
```

## 2. Race Condition
**Problema**: Dos operaciones async compiten y el orden es impredecible

**Ejemplo en la app**:
- onAuthStateChange dispara ANTES de que localStorage cargue
- Solucion: Fallback que verifica localStorage directamente

## 3. Lock Pattern
**Problema**: Una funcion puede ejecutarse multiples veces simultaneamente

```typescript
const completingRef = useRef(false)

function completeRoll() {
  if (completingRef.current) return // Ya esta ejecutandose
  completingRef.current = true      // Marcar como "en ejecucion"

  // ... hacer trabajo ...

  completingRef.current = false     // Liberar lock
}
```

## 4. Cleanup en useEffect
**Por que**: Evitar memory leaks y comportamiento inesperado

```typescript
useEffect(() => {
  const intervalId = setInterval(() => {}, 1000)

  // Esta funcion se ejecuta al desmontar el componente
  return () => {
    clearInterval(intervalId)
  }
}, [])
```

## 5. JWT y RLS (Row Level Security)
**Como funciona**:
1. Usuario hace login, recibe JWT token
2. JWT contiene el user_id firmado criptograficamente
3. Cada request a Supabase incluye el JWT
4. Supabase verifica el JWT y aplica politicas RLS
5. Usuario solo ve/modifica sus propios datos

---

# TECNOLOGIAS EXPLICADAS

## Next.js App Router
- Carpeta `app/` define las rutas
- `page.tsx` = contenido de la ruta
- `layout.tsx` = wrapper que envuelve las paginas
- `"use client"` = componente se ejecuta en el browser

## React Hooks
- `useState`: Estado local del componente
- `useEffect`: Side effects (API calls, subscriptions)
- `useCallback`: Memorizar funciones
- `useRef`: Valor mutable que no causa re-render
- `useContext`: Acceder a contexto global

## TypeScript
- Tipos estaticos para prevenir errores
- Interfaces definen la forma de los objetos
- `as` para type casting
- `?` para propiedades opcionales
- `|` para union types (ej: `string | null`)

## Tailwind CSS
- Clases utilitarias directamente en HTML
- `bg-red-500` = background rojo
- `text-white` = texto blanco
- `p-4` = padding 1rem
- `flex` = display flex

## Supabase
- PostgreSQL hosted
- Autenticacion integrada
- REST API automatico para las tablas
- Realtime subscriptions
- Row Level Security para seguridad

---

# PREGUNTAS QUE PUEDES HACERLE A GPT

1. "Explicame como funciona useCallback en React"
2. "Que es una stale closure y como evitarla?"
3. "Como funciona JWT para autenticacion?"
4. "Que es Row Level Security en bases de datos?"
5. "Explicame el patron Provider en React"
6. "Como funciona el event loop de JavaScript con setTimeout?"
7. "Que es una race condition y como prevenirla?"
8. "Como funciona Promise.race()?"
9. "Que diferencia hay entre useRef y useState?"
10. "Como funciona el REST API de Supabase?"

---

# CODIGO IMPORTANTE PARA ESTUDIAR

## Inicializacion de Auth (auth-provider.tsx)
```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    setUser(session.user)
    await fetchUserData(session.user.id)
  }
  if (event === 'INITIAL_SESSION') {
    setLoading(false)
  }
})
```

## Generar resultado del dado (utils.ts)
```typescript
function generateDiceResult(): number {
  const result = 0.01 + Math.random() * (98.02 - 0.01)
  return Number(result.toFixed(2))
}
```

## Fetch con timeout (auth-provider.tsx)
```typescript
const fetchWithTimeout = (url: string) =>
  Promise.race([
    fetch(url, { headers }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
  ])
```

---

Usa este documento para entender tu codigo y hacer preguntas especificas a GPT!
