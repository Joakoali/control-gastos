# Plan: Chat con IA para análisis de gastos

Diseño aprobado en sesión de brainstorming. Este documento es la fuente de verdad para implementar la feature. Leer antes de tocar código.

## Objetivo

Agregar un chat con DeepSeek dentro de la app que permita preguntar en lenguaje natural sobre los gastos del household, con respuestas que pueden incluir mini-gráficos renderizados localmente.

## Decisiones fijadas

- **LLM**: DeepSeek (`deepseek-chat`), API ya tenemos
- **Hosting backend**: Vercel serverless function `/api/chat` (Node runtime, no Edge)
- **Auth**: Firestore allowlist en colección `aiAccess/{uid}` — solo usuarios habilitados manualmente desde la consola de Firebase ven el botón y pueden llamar el endpoint
- **Datos enviados**: TODOS los meses del household en el system prompt (no RAG, no resumen)
- **Persistencia de chat**: NINGUNA. Estado en memoria, se pierde al cerrar el modal
- **Streaming**: Sí, SSE re-pipeado del server al cliente
- **Charts**: bloques de código con lenguaje `chart` que contienen JSON. Renderizados con divs + Tailwind, cero dependencias de charting
- **UI**: botón 🤖 en el header (al lado de 🏦 y 👤). Modal full-screen al tocarlo
- **Branch de desarrollo**: `claude/add-data-analysis-section-XcE7V`
- **Tests**: Vitest mínimo, solo para funciones puras (`parseChat.ts`, `promptBuilder.ts`)

---

## Arquitectura — flujo end-to-end

```
[Browser]                  [Vercel /api/chat]        [Firestore]         [DeepSeek]
   |                              |                       |                   |
1. usuario abre chat              |                       |                   |
2. useAiAccess lee aiAccess/{uid} ----------------------->|                   |
                                                          |                   |
3. POST /api/chat               >|                       |                   |
   { messages, idToken }         |                       |                   |
                                  |-- verifyIdToken (admin SDK)               |
                                  |-- check aiAccess/{uid} ------------------>|
                                  |-- read users/{uid}.householdId            |
                                  |-- read households/{hid} ----------------->|
                                  |-- buildSystemPrompt(data)                 |
                                  |-- POST /v1/chat/completions stream:true ->|
                                  |<-- SSE chunks ----------------------------|
4. SSE re-piped al browser       |                                          |
5. render markdown + ```chart blocks en vivo
```

---

## Sección 1 — Auth, allowlist y reglas Firestore

### Flujo de autorización en cada request

1. Frontend obtiene `idToken = await auth.currentUser.getIdToken()` (se refresca solo, dura 1h)
2. Lo manda en header `Authorization: Bearer <idToken>`
3. Function valida con `firebase-admin.auth().verifyIdToken(idToken)` → si falla, **401**
4. Function lee `aiAccess/{uid}` con admin SDK → si no existe o `enabled !== true`, **403**
5. Function lee `users/{uid}.householdId` → si no hay, **400 "no_household"**
6. Function lee `households/{householdId}` → si no es member, **403** (defensa en profundidad)
7. Sigue al paso de armar prompt + llamar DeepSeek

### Schema de la colección nueva

```
aiAccess/{uid}
{
  enabled: true,
  grantedBy: "<uid del admin>",  // opcional, auditoría
  grantedAt: "2026-05-17T...",   // opcional
  note: "Joaco (admin)"          // opcional, para identificar en la consola
}
```

Solo `enabled` se chequea. Los demás campos son para que vos, en la consola de Firebase, sepas a quién pertenece cada UID.

### Reglas Firestore a agregar

```js
match /aiAccess/{uid} {
  // Solo podés leer tu propio doc (para que el frontend sepa si mostrar el botón)
  allow read: if isSignedIn() && request.auth.uid == uid;

  // Nadie escribe desde la app. Vos creás/editás docs desde la consola de Firebase.
  // (La consola usa Admin privileges, ignora estas reglas)
  allow write: if false;
}
```

### Cómo autorizar a alguien (manual, ~30s)

1. La persona se loguea una vez en la app (se crea su user)
2. Consola de Firebase → Firestore → colección `aiAccess`
3. Agregar documento, ID = UID de la persona (sacar de la colección `users` filtrando por email)
4. Campo `enabled: true` + `note: "..."` para acordarte
5. Próxima vez que abra la app le aparece el botón 🤖

### Defensa en profundidad

Aunque el botón no se renderice, si alguien llama directo a `/api/chat`, el server lo rechaza con 403. La seguridad NO depende del frontend.

---

## Sección 2 — Backend: forma de la function

### Stack

- Runtime Node.js en Vercel (no Edge — `firebase-admin` requiere Node)
- Dependencia nueva: `firebase-admin`
- Carpeta `/api/` en la raíz del repo (Vercel la detecta automáticamente)

### Estructura de archivos

```
/api/
  chat.ts                    ← endpoint serverless
  _lib/
    firebaseAdmin.ts         ← singleton de firebase-admin (no reiniciar entre invocaciones)
    auth.ts                  ← verifyIdToken + checkAiAccess
    promptBuilder.ts         ← arma el system prompt con la data
    deepseek.ts              ← cliente con stream a DeepSeek
```

### Forma del endpoint (pseudocódigo)

```ts
// /api/chat.ts
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // 1. Auth
  const idToken = req.headers.authorization?.replace('Bearer ', '');
  if (!idToken) return res.status(401).json({ error: 'no_token' });

  const decoded = await verifyIdToken(idToken);
  if (!decoded) return res.status(401).json({ error: 'invalid_token' });

  // 2. Allowlist
  const allowed = await checkAiAccess(decoded.uid);
  if (!allowed) return res.status(403).json({ error: 'no_access' });

  // 3. Validar body
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'bad_request' });
  }
  if (messages.length > 50) return res.status(400).json({ error: 'too_many_messages' });
  if (messages.some(m => m.content.length > 4000)) {
    return res.status(400).json({ error: 'message_too_long' });
  }

  // 4. Cargar datos del household
  const householdData = await loadHouseholdData(decoded.uid);
  if (!householdData) return res.status(400).json({ error: 'no_household' });

  // 5. Armar system prompt
  const systemPrompt = buildSystemPrompt(householdData);

  // 6. Stream desde DeepSeek
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await streamFromDeepSeek({
      systemPrompt,
      messages,
      onChunk: (text) => {
        res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
      },
    });
    res.write('data: [DONE]\n\n');
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: 'model_error' })}\n\n`);
  }
  res.end();
}
```

### Decisiones puntuales

| Tema | Decisión |
|---|---|
| Modelo DeepSeek | `deepseek-chat` (suficiente, mucho más barato que reasoner) |
| Streaming | Sí, SSE |
| Temperatura | `0.7` |
| Max tokens response | `2000` |
| Timeout function | `maxDuration: 60` en vercel.json (Hobby permite hasta 60s) |
| CORS | No hace falta, mismo origen |
| Logging | `console.log({uid, ts, msgCount, error})` solo en errores |

### Variables de entorno en Vercel

```
DEEPSEEK_API_KEY=sk-...
FIREBASE_PROJECT_ID=gastos-familia-57727
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@gastos-familia-57727.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
FIREBASE_DATABASE_ID=gastos
```

Las 3 de Firebase salen del JSON de service account (Firebase Console → Project Settings → Service Accounts → Generate New Private Key). La `PRIVATE_KEY` necesita los `\n` literales preservados.

**Importante**: la app usa `getFirestore(app, "gastos")` (base nombrada, no la default). En el backend, hay que pasar el `databaseId` correctamente cuando se inicializa Firestore con admin SDK.

---

## Sección 3 — Spec del bloque ```chart

Cuando el modelo quiera mostrar datos cuantitativos, en lugar de tablas markdown emite un bloque de código con lenguaje `chart` que contiene JSON. El frontend lo parsea y renderiza como mini-gráfico con divs + Tailwind.

### Tipo 1: `bar` — barras horizontales

Ideal para rankings, top N, gastos por categoría.

```chart
{
  "type": "bar",
  "title": "Gasto por categoría — Abril 2026",
  "data": [
    {"label": "Súper", "value": 480.50},
    {"label": "Resto/Bar", "value": 245.00},
    {"label": "Nafta", "value": 180.00},
    {"label": "Suscripciones", "value": 45.99}
  ],
  "format": "currency"
}
```

Cada barra ocupa el % proporcional al máximo. Colores: degradé violet/indigo (consistente con el resto de la app).

### Tipo 2: `compare` — comparativa multi-mes

Ideal para "últimos N meses", "ingresos vs gastos en el tiempo".

```chart
{
  "type": "compare",
  "title": "Últimos 6 meses",
  "labels": ["Nov", "Dic", "Ene", "Feb", "Mar", "Abr"],
  "series": [
    {"name": "Ingresos", "values": [2500, 2500, 2700, 2500, 2500, 2700]},
    {"name": "Gastos", "values": [1200, 1850, 1100, 1300, 1450, 1280]}
  ],
  "format": "currency"
}
```

Render: barras agrupadas verticales (N barritas por mes), con leyenda arriba.

### Tipo 3: `donut` — proporción / mix

Ideal para "% fijos vs variables", distribuciones.

```chart
{
  "type": "donut",
  "title": "Distribución del gasto — Abril",
  "data": [
    {"label": "Fijos", "value": 800},
    {"label": "Variables", "value": 480}
  ],
  "format": "currency"
}
```

Render: dona SVG simple (`<svg>` con 2-5 segmentos) + leyenda con valores y %.

### Campo `format`

- `"currency"` → `€480.50` (usa `fmt()` del proyecto)
- `"percent"` → `45%`
- `"number"` → `480.50` plano
- ausente → `"number"` por default

### Manejo de errores en el parser

- JSON malformado → se renderiza como bloque de código normal (no rompe el chat)
- Tipo desconocido (`"pie"`, `"line"`) → bloque de código normal + texto sutil "tipo no soportado"
- Data vacía o inválida → mismo fallback

### Por qué solo 3 tipos

- Cubre el 95% de lo que tiene sentido pedir sobre gastos personales
- Cero deps (sin recharts, sin chart.js → ahorramos ~80KB del bundle)
- El modelo aprende rápido el spec con pocos ejemplos en el system prompt

---

## Sección 4 — Frontend: componentes y UI

### Archivos nuevos

```
src/
  components/
    chat/
      ChatModal.tsx          ← contenedor full-screen
      ChatMessageList.tsx    ← lista scrollable
      ChatMessage.tsx        ← un mensaje (parsea markdown + chart blocks)
      ChartBlock.tsx         ← renderiza un chart (switch por type)
      ChatInput.tsx          ← textarea + botón enviar
      EmptyState.tsx         ← cuando no hay mensajes, prompts sugeridos
  hooks/
    useAiAccess.ts           ← lee aiAccess/{uid} con onSnapshot
    useChat.ts               ← state de mensajes + lógica de streaming SSE
  utils/
    parseChat.ts             ← parsea markdown → bloques (text | chart)
```

### Cambios en archivos existentes

- **`src/App.tsx`**: botón 🤖 en el header (si `useAiAccess` devuelve `true`) + state `showChat` + render `<ChatModal />`
- **`firestore.rules`**: agregar reglas de `aiAccess`
- **`package.json`**: agregar `firebase-admin` como dep + `react-markdown` + `vitest` (devDep)
- **`vercel.json`**: agregar `functions["api/chat.ts"].maxDuration: 60`

### Botón en el header

Estética: el header actual tiene 👤 y 🏦. Agregamos 🤖 con el mismo tamaño.

```
┌──────────────────────────────────────┐
│  Control de gastos       🤖  🏦  👤  │
└──────────────────────────────────────┘
```

Si `useAiAccess` → `false` o aún cargando, el botón no aparece. Sin placeholder.

### ChatModal — layout

**Full-screen** (no bottom-sheet como los otros modales). El chat necesita altura completa.

```
┌──────────────────────────────────────────────┐
│  🤖 Asistente                             ✕  │  ← header sticky
├──────────────────────────────────────────────┤
│  [EmptyState con sugerencias]                │
│      o                                       │
│  [Mensajes scrollables, auto-scroll al fondo]│
├──────────────────────────────────────────────┤
│  [Textarea]                          [ ↑ ]   │  ← input sticky
└──────────────────────────────────────────────┘
```

- Modal `position: fixed; inset: 0; z-50`
- Backdrop opaco (no semi-transparente)
- `Esc` cierra
- Mobile: full-screen. Desktop: `max-w-2xl` centrado

### EmptyState — sugerencias

```
👋 ¿Qué querés analizar?

[ 📊 Comparame los últimos 3 meses          ]
[ 💸 ¿En qué gasté más este mes?            ]
[ 📈 ¿Mi tendencia de ahorro va bien?       ]
[ 🎯 ¿Dónde podría recortar?                ]
```

Tocar uno envía esa pregunta directamente.

### ChatMessage — render

- **Usuario**: burbuja a la derecha, fondo violet-100, texto violet-900
- **Asistente**: ancho completo, sin burbuja (estilo Claude/ChatGPT), texto slate-800
- Avatar: usuario sin avatar; asistente con 🤖 chico al inicio
- Markdown: `**bold**`, `*italic*`, listas, code inline, headers. Sin imágenes ni HTML embed
- Librería: `react-markdown` (integración limpia con el parser de chart blocks)

### useChat hook — esqueleto

```ts
function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(content: string) {
    const userMsg = { role: 'user', content };
    const assistantMsg = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const idToken = await auth.currentUser!.getIdToken();
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'unknown' }));
      setError(mapError(err.error));
      setStreaming(false);
      return;
    }

    // Parse SSE stream, ir actualizando el último mensaje del array
    const reader = res.body!.getReader();
    // ... lee chunks, parsea `data: {...}`, appendea delta al content del último msg
    setStreaming(false);
  }

  function clear() { setMessages([]); setError(null); }

  return { messages, streaming, error, send, clear };
}
```

### Mapeo de errores → texto en español

| code backend | mensaje al usuario |
|---|---|
| `no_token` / `invalid_token` | "Iniciá sesión de nuevo" |
| `no_access` | "No tenés acceso a esta función" |
| `no_household` | "Configurá tu hogar primero" |
| `too_many_messages` | "La conversación es muy larga, refrescá el chat" |
| `model_error` | "Error del modelo, probá de nuevo" |
| network/otros | "Sin conexión, revisá tu internet" |

### Estados visuales

- **Loading inicial** (esperando primer chunk): "..." animado
- **Streaming**: cursor titilante al final del texto
- **Error en mid-stream**: el último mensaje queda parcial + banner rojo arriba + botón "Reintentar"
- **Sin mensajes**: EmptyState
- **Botón enviar disabled**: si input vacío o si `streaming === true`

### Persistencia

**Nada se persiste.** Cerrar el modal limpia los mensajes. Refrescar también. A propósito: simple, barato, sin sincronizar con Firestore.

Implicancia: el modelo no recuerda conversaciones anteriores. El system prompt con la data sí está siempre, así que la primera pregunta siempre va bien — pero "¿y comparado con lo que me dijiste ayer?" no funciona.

---

## Sección 5 — System prompt y datos enviados

### Forma del system prompt

Es lo más importante de toda la feature. Estructura:

```
[ROL]
Sos un asistente financiero personal que analiza los gastos de un hogar.
Hablás español rioplatense, sos conciso y directo. Mostrás números concretos.

[FECHA ACTUAL]
{ISO date}

[DATOS DEL HOGAR]
{JSON con todos los datos — ver siguiente bloque}

[INSTRUCCIONES DE FORMATO]
- Respondé en español, tono cercano pero profesional.
- Sé conciso. Preferí bullets cortos y números a párrafos largos.
- Cuando muestres datos cuantitativos (rankings, comparativas, distribuciones),
  USÁ un bloque ```chart en vez de tablas markdown.
- Formato exacto del chart:
  ```chart
  {"type": "bar"|"compare"|"donut", "title": "...", "data": [...] | "labels"+"series", "format": "currency"|"percent"|"number"}
  ```
- Tipos soportados (no inventés otros):
  • "bar": {data: [{label, value}, ...]}
  • "compare": {labels: [...], series: [{name, values}, ...]}
  • "donut": {data: [{label, value}, ...]}
- Si te preguntan algo fuera de finanzas personales, redirigí amablemente.
- Si no tenés data suficiente para responder, decilo en vez de inventar.
- Currency = EUR (€). Toda cifra en euros salvo que se especifique otra.

[EJEMPLO]
Pregunta: "¿En qué gasté más en abril?"
Respuesta:
En abril 2026 tus 3 mayores gastos fueron:

```chart
{"type":"bar","title":"Top gastos — Abril 2026","data":[{"label":"Súper","value":480.50},{"label":"Resto/Bar","value":245.00},{"label":"Nafta","value":180.00}],"format":"currency"}
```

El súper se llevó el 54% del gasto variable. Subió un 12% vs marzo.
```

### Forma de los datos enviados

`buildSystemPrompt(householdData)` arma un JSON compacto con todos los meses:

```json
{
  "household": "ABC123",
  "currentMonth": "2026-4",
  "currency": "EUR",
  "fixedExpensesGlobal": [
    {"name": "Alquiler", "amount": 800, "category": "Vivienda"},
    {"name": "Internet", "amount": 45, "category": "Servicios"}
  ],
  "months": {
    "2024-0": {
      "incomeSources": [{"name": "Sueldo Joaco", "amount": 2500}],
      "savings": 5000,
      "fixedExpenses": [...],
      "expenses": [
        {"name": "Súper", "amount": 480.50, "category": "Comida", "date": "2024-01-15"}
      ]
    },
    "2024-1": {...}
  }
}
```

### Tamaño y costo

- Household con 2 años de data: ~24 meses × ~30 gastos/mes = ~720 entries
- JSON serializado: ~80-120KB
- DeepSeek cobra por token de input; 120KB ≈ 30K tokens
- A $0.27/1M tokens input (`deepseek-chat`) = **$0.008 por request**
- Total esperado <$5/mes con uso moderado de 2-3 personas

### Lo que NO se manda

- `splits/*` (deudas entre personas) — fuera de scope inicial
- Datos no financieros de otros miembros (displayName, email)
- UIDs de los miembros

### Plan de escalado futuro

Si los datos crecen a >200KB, agregar un resumen agregado por mes + detalle solo de los últimos 6 meses. Por ahora no es necesario.

---

## Sección 6 — Tests

### Setup mínimo de Vitest

```bash
npm i -D vitest @vitest/ui happy-dom
```

`package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

`vitest.config.ts`: heredar de Vite, environment `happy-dom`.

### Qué se testea

**Sí**:
- `src/utils/parseChat.test.ts` — parser de bloques ```chart:
  - texto sin charts → 1 bloque text
  - 1 chart en medio → 3 bloques (text, chart, text)
  - chart con JSON inválido → bloque text con el code raw
  - chart con type desconocido → bloque text con fallback
  - múltiples charts seguidos
- `api/_lib/promptBuilder.test.ts` — shape del prompt:
  - household vacío → JSON válido con `months: {}`
  - household con data → incluye todos los meses
  - fecha actual presente en el output
  - no incluye campos PII (uids, emails)

**No**:
- Componentes React (`ChatModal`, `ChartBlock`)
- Hooks (`useChat`, `useAiAccess`)
- Endpoint `/api/chat` end-to-end (eso se testea manual)

Filosofía: testear donde un bug es invisible a ojo. UI se valida manualmente en `vercel dev`.

---

## Plan de implementación

Orden propuesto. Cada paso = commit independiente.

1. **Reglas Firestore + setup**
   - Agregar match `/aiAccess/{uid}` a `firestore.rules`
   - Crear tu propio doc en `aiAccess` desde la consola de Firebase (manual)
   - Commitear las reglas

2. **Setup Vitest**
   - Instalar deps, configurar `vitest.config.ts`, agregar scripts

3. **Backend — base**
   - Instalar `firebase-admin`
   - Crear `/api/_lib/firebaseAdmin.ts` (singleton)
   - Crear `/api/_lib/auth.ts` (verifyIdToken + checkAiAccess)
   - Crear `/api/_lib/promptBuilder.ts` (+ tests)
   - Crear `/api/_lib/deepseek.ts` (cliente streaming)

4. **Backend — endpoint**
   - Crear `/api/chat.ts` integrando todo lo anterior
   - Agregar `functions["api/chat.ts"].maxDuration: 60` a `vercel.json`
   - Documentar env vars necesarias

5. **Frontend — acceso**
   - Crear `src/hooks/useAiAccess.ts`
   - Agregar botón 🤖 en el header de `App.tsx` (condicional al acceso)

6. **Frontend — parser y charts**
   - Crear `src/utils/parseChat.ts` (+ tests)
   - Crear `src/components/chat/ChartBlock.tsx` (los 3 tipos)

7. **Frontend — chat**
   - Crear `src/hooks/useChat.ts` (con parseo SSE)
   - Crear `src/components/chat/ChatModal.tsx`, `ChatMessageList.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`, `EmptyState.tsx`
   - Wire-up al botón del header

8. **QA manual**
   - `vercel dev` local con `.env.local` configurado
   - Probar los 4 prompts del EmptyState
   - Validar que los 3 tipos de charts se rendericen
   - Probar errores (sin acceso, sin household, etc.)

9. **Deploy preview en Vercel**
   - Configurar env vars en Vercel
   - Push, validar preview deploy
   - Crear PR cuando esté listo

### Total estimado

~600-800 líneas nuevas. ~3-5h de trabajo focused, no de un tirón.

---

## Setup local antes de arrancar

```bash
# 1. Estar en la branch correcta
git checkout claude/add-data-analysis-section-XcE7V
git pull origin claude/add-data-analysis-section-XcE7V

# 2. Crear .env.local en la raíz (NO commitear, ya está en .gitignore)
cat > .env.local <<'EOF'
DEEPSEEK_API_KEY=sk-...
FIREBASE_PROJECT_ID=gastos-familia-57727
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@gastos-familia-57727.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_ID=gastos
EOF

# 3. Instalar Vercel CLI si no la tenés
npm i -g vercel

# 4. Login y link al proyecto
vercel login
vercel link

# 5. Levantar dev server (la CLI lee .env.local automáticamente)
vercel dev
```

`vercel dev` levanta Vite + funciona como router para `/api/*` en el mismo puerto. Eso te permite testear el endpoint end-to-end sin deployar.
