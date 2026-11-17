# Plan: Anotar gastos por voz

Diseño aprobado en sesión de brainstorming (2026-08-20). Este documento es la fuente de verdad para implementar la feature. Leer antes de tocar código.

## Objetivo

Permitir cargar gastos variables dictándolos por voz en lugar de completar el formulario manual. El usuario mantiene presionado un botón de micrófono, dice uno o varios gastos ("gasté 15 euros en el super y 20 en nafta"), y la app transcribe, interpreta y arma los gastos para que el usuario los revise y guarde.

## Decisiones fijadas

- **Transcripción**: Web Speech API del navegador (`SpeechRecognition`/`webkitSpeechRecognition`), client-side, sin costo. Se acepta que en Safari/iOS el soporte es limitado — si falla, el usuario cae al flujo manual existente sin romper nada.
- **Interpretación (NLU)**: se envía el transcript a DeepSeek (mismo proveedor que el chat de análisis existente) para extraer gastos estructurados. Reusa `DEEPSEEK_API_KEY`, sin env vars nuevas.
- **Acceso**: disponible para **todos los miembros del household**, sin el gate de allowlist `aiAccess` que usa el chat de análisis.
- **Interacción de grabación**: push-to-talk (mantener presionado el botón, soltar para procesar).
- **Multi-gasto**: una sola grabación puede contener varios gastos. Se revisan todos juntos en una lista editable antes de guardar.
- **Alcance**: solo gastos variables (tab "Variables"). No aplica a fijos, ingresos ni splits.
- **Ubicación del botón**: botón de mic separado, al lado del FAB "+ Añadir gasto" existente, solo en la tab Variables.
- **Fallback si no se detecta ningún gasto**: error + volver a grabar. No se abre ninguna pantalla vacía.
- **Sin fila manual en la revisión**: si la IA detectó menos gastos de los dichos, se completa el faltante con el flujo manual normal (FAB), no dentro de la pantalla de revisión de voz.
- **Sin persistencia de transcripciones**: cada grabación es una toma nueva, sin historial ni edición conversacional.

---

## Arquitectura — flujo end-to-end

```
[VariablesTab]
   🎤 (nuevo, al lado del FAB "+ Añadir gasto")
        │ push-to-talk (mantener presionado)
        ▼
[useVoiceExpense hook]
   1. SpeechRecognition (Web Speech API, lang='es-AR') escucha mientras se mantiene presionado
   2. Al soltar → transcript final
   3. POST /api/parseVoiceExpense { transcript }  (requiere sesión, SIN gate de aiAccess)
        │
        ▼
[api/parseVoiceExpense.ts]
   - verifyIdToken (auth normal, igual que /api/chat, pero sin checkAiAccess ni lectura de household)
   - valida transcript (no vacío, ≤500 caracteres)
   - arma prompt de extracción (fecha actual + las 11 categorías válidas)
   - llama a DeepSeek (deepseek-chat, sin streaming, JSON mode, temperature 0.2)
   - sanitiza la respuesta: category clampeada a uno de los 11 ids válidos (default "otros"),
     amount coercionado a número > 0, date default = hoy si falta/inválida, filtra items sin name/amount
   - devuelve 200 { expenses: [{name, amount, category, date}, ...] } (puede ser array vacío)
        │
        ▼
[VoiceReviewModal] — lista editable de N gastos detectados
   - 0 detectados → error, vuelve al estado inicial del mic
   - ≥1 detectado → filas editables (nombre, importe, categoría en chip, fecha), se puede borrar una fila
   - "Guardar todos" → un solo write a Firestore vía addExpenses() en bulk
```

### Por qué un write en bulk y no un loop de `addExpense`

El `addExpense` actual en `App.tsx` (línea ~251) hace `doUpdateMonth({ expenses: [nuevo, ...md.expenses] })` leyendo `md.expenses` del closure. Si se llamara en loop para N gastos detectados por voz, todas las llamadas partirían del mismo array viejo (closure no actualizado entre llamadas síncronas) y se pisarían entre sí, perdiendo gastos. Por eso se agrega una función bulk `addExpenses(exps[])` que hace un único write con todos los gastos nuevos juntos.

---

## Sección 1 — Backend: `/api/parseVoiceExpense`

### Request

```
POST /api/parseVoiceExpense
Authorization: Bearer <idToken>
Content-Type: application/json

{ "transcript": "gasté 15 euros en el super y 20 en nafta" }
```

### Validaciones

| Caso | Respuesta |
|---|---|
| Sin token | `401 { error: "no_token" }` |
| Token inválido | `401 { error: "invalid_token" }` |
| `transcript` vacío o no-string | `400 { error: "bad_request" }` |
| `transcript` > 500 caracteres | `400 { error: "message_too_long" }` |
| Error de DeepSeek (timeout, 5xx) | `500 { error: "model_error" }` |
| OK (con o sin gastos detectados) | `200 { expenses: [...] }` |

**Sin chequeo de `aiAccess`** (disponible para todo el household) y **sin lectura de household** — no hace falta ningún dato de Firestore para parsear, solo autenticar que sea un usuario válido.

### Estructura de archivos nuevos

```
api/
  parseVoiceExpense.ts          ← endpoint serverless
  _lib/
    voicePromptBuilder.ts       ← arma el prompt de extracción (+ tests)
    voiceExpenseParser.ts       ← sanitiza la respuesta de DeepSeek (+ tests)
    deepseek.ts                 ← se agrega completeJSONFromDeepSeek (no streaming, JSON mode)
```

### Prompt de extracción (`voicePromptBuilder.ts`)

```
[ROL] Extraés gastos de una transcripción de voz en español rioplatense.
[FECHA ACTUAL] {ISO date}
[CATEGORÍAS VÁLIDAS] super, restaurante, salud, ropa, transporte, ocio, hogar, belleza, online, delivery, otros
[INSTRUCCIONES]
- Devolvé SOLO JSON: {"expenses":[{"name":str,"amount":number,"category":str,"date":"YYYY-MM-DD"}]}
- Un objeto por gasto mencionado. Si no se menciona ningún gasto reconocible, "expenses":[].
- category: elegí el id que más se acerque, si no hay match claro usá "otros"
- date: si se menciona "ayer"/"el lunes"/etc, calculá respecto a la fecha actual. Si no se menciona, usá la fecha actual.
- amount: siempre en números (convertí "quince" → 15). Si no hay importe claro para un gasto, omitilo del array.
- name: descripción corta (2-4 palabras), nunca vacío.
```

### Sanitización (`voiceExpenseParser.ts`)

Función pura, misma filosofía que `parseChat.ts`: nunca debe tirar una excepción hacia arriba, siempre devuelve una lista (posiblemente vacía) de gastos válidos.

- Parsea el JSON del modelo; si falla el parseo → `expenses: []`
- Filtra objetos sin `amount` numérico > 0 o sin `name` no-vacío
- Clampea `category` a uno de los 11 ids válidos de `CATS`, default `"otros"` si no matchea
- Valida `date` con formato `YYYY-MM-DD`; default = hoy si falta o es inválida

### DeepSeek client (`deepseek.ts`)

Se agrega:

```ts
export async function completeJSONFromDeepSeek({ systemPrompt, userMessage }: {
  systemPrompt: string;
  userMessage: string;
}): Promise<string> {
  // POST no-streaming a /v1/chat/completions
  // response_format: { type: "json_object" }
  // temperature: 0.2 (precisión, no creatividad — a diferencia del chat que usa 0.7)
  // devuelve el content crudo del choice, para que voiceExpenseParser lo sanitice
}
```

---

## Sección 2 — Frontend: hook y componentes

### `src/hooks/useVoiceExpense.ts`

Máquina de estados: `idle | recording | processing | review | error`.

```ts
function useVoiceExpense() {
  const [status, setStatus] = useState<'idle'|'recording'|'processing'|'review'|'error'>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  function startRecording() { /* crea SpeechRecognition, lang='es-AR', interimResults=true, onresult acumula liveTranscript, status='recording' */ }
  function stopRecording() { /* recognition.stop(); dispara processTranscript() con el transcript final */ }
  async function processTranscript(transcript: string) {
    setStatus('processing');
    // POST /api/parseVoiceExpense con idToken, mismo patrón que useChat.ts
    // 200 con expenses:[] → status='error', errorMsg = "No entendí ningún gasto, probá de nuevo"
    // 200 con expenses:[...] → parsedExpenses = ..., status='review'
    // error de red/backend → status='error', mapError(code)
  }
  function reset() { setStatus('idle'); setLiveTranscript(''); setParsedExpenses([]); setErrorMsg(null); }

  return { status, liveTranscript, parsedExpenses, errorMsg, supported, startRecording, stopRecording, reset };
}
```

Reusa el patrón `mapError` de `useChat.ts`, agregando códigos nuevos: `not_allowed` (permiso de mic denegado) y `no_speech` (no se detectó voz — se maneja client-side, nunca llega a pegarle al backend).

### Componentes nuevos (`src/components/voice/`)

- **`VoiceButton.tsx`** — botón circular 🎤. Se renderiza solo si `supported === true` (si el navegador no soporta `SpeechRecognition`, no aparece — mismo criterio que el botón 🤖 con `useAiAccess`). `onMouseDown`/`onTouchStart` → `startRecording()`; `onMouseUp`/`onTouchEnd`/`onMouseLeave` → `stopRecording()`.

- **`VoiceRecordingOverlay.tsx`** — visible cuando `status === 'recording' | 'processing'`.
  - `recording`: ícono de mic animado + `liveTranscript` en vivo + hint "soltá para procesar"
  - `processing`: spinner + "Procesando..."

- **`VoiceReviewModal.tsx`** — visible cuando `status === 'review'`. Bottom sheet, mismo estilo que `AddModal`.
  - Lista de filas, una por gasto detectado: input de nombre, input de importe, chip de categoría (tap abre el grid de `CATS`, igual que `AddModal` pero inline/compacto), date picker
  - Botón ✕ por fila para descartarla
  - Botón inferior "Guardar todos (N)" → `addExpenses(rows)` y cierra
  - "Cancelar" → `reset()`, no guarda nada

- **Estado de error** (`status === 'error'`): banner chico con `errorMsg` + botón "Reintentar" que vuelve a `idle`. No necesita modal propio, se resuelve con el mismo overlay.

### Integración en `App.tsx`

Solo en `tab === 'variables'`, al lado del FAB existente:

```tsx
{tab === "variables" && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
    <button onClick={() => { setEditExp(null); setShowAdd(true); }}>+ Añadir gasto</button>
    <VoiceButton {...voiceHook} />
  </div>
)}
{(voiceHook.status === 'recording' || voiceHook.status === 'processing') && <VoiceRecordingOverlay {...voiceHook} />}
{voiceHook.status === 'review' && <VoiceReviewModal expenses={voiceHook.parsedExpenses} onSave={addExpenses} onCancel={voiceHook.reset} />}
```

Y se agrega la función bulk junto a `addExpense` (línea ~251):

```ts
const addExpenses = (exps: Omit<Expense, "id">[]) =>
  doUpdateMonth({ expenses: [...exps.map(e => ({ ...e, id: newId() })), ...md.expenses] });
```

---

## Sección 3 — Errores y permisos (frontend)

| Situación | Manejo |
|---|---|
| Navegador sin `SpeechRecognition` (ej. Firefox desktop, algunos Android WebView) | `VoiceButton` no se renderiza. Sin mensaje. |
| Usuario niega permiso de mic (`onerror: 'not-allowed'`) | `status='error'`, "Permiso de micrófono denegado" |
| Sin voz detectada (`onerror: 'no-speech'` o transcript final vacío) | `status='error'`, "No escuché nada, probá de nuevo" — no llega a pegarle al backend |
| DeepSeek devuelve `expenses: []` | `status='error'`, "No entendí ningún gasto, probá de nuevo" |
| Error de red o 500 del backend | `status='error'`, `mapError` (mismo mapa que `useChat.ts`), botón "Reintentar" |
| Safari/iOS con soporte débil de `SpeechRecognition` | Riesgo aceptado. Si falla, cae en alguno de los casos de arriba — no rompe la app, el usuario usa el flujo manual del FAB. |

---

## Sección 4 — Tests

Mismo criterio que la spec de chat: solo funciones puras, donde un bug es invisible a ojo. Sin tests de componentes React, hooks, ni el endpoint end-to-end (se valida manual con `vercel dev`).

- **`api/_lib/voicePromptBuilder.test.ts`**: incluye fecha actual, incluye las 11 categorías, formato correcto del prompt
- **`api/_lib/voiceExpenseParser.test.ts`** (mayor superficie de bugs):
  - JSON válido con 1 gasto → 1 expense sanitizado
  - JSON válido con N gastos → N expenses
  - JSON malformado → `expenses: []`
  - `category` inválida/inventada por el modelo → se clampea a `"otros"`
  - `amount` faltante o ≤ 0 en un item → ese item se filtra, los demás quedan
  - `date` inválida o ausente → default hoy
  - `name` vacío → se filtra ese item
  - array vacío de entrada → array vacío de salida

---

## Non-goals (explícitamente fuera de scope)

- Grabación de audio / STT en el backend (se descartó Whisper/Groq — Web Speech API client-side, aceptando limitación en Safari)
- Fila manual dentro de `VoiceReviewModal` (se usa el FAB normal para lo que falte)
- Persistencia o historial de transcripciones de voz
- Voz para gastos fijos, ingresos o splits — solo gastos variables
- Edición conversacional ("no, eran 20") — cada grabación es una toma nueva

## Env vars nuevas

Ninguna. Reusa `DEEPSEEK_API_KEY` ya configurada en Vercel.

## Cambios en archivos existentes

- **`src/App.tsx`**: botón 🎤 al lado del FAB en tab Variables, función `addExpenses` bulk, render de `VoiceRecordingOverlay`/`VoiceReviewModal`
- **`api/_lib/deepseek.ts`**: agregar `completeJSONFromDeepSeek`
