# SW Network-First HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que los teléfonos siempre carguen la versión nueva de la app cambiando el fetch handler del Service Worker a network-first para HTML y cache-first para assets.

**Architecture:** Un solo cambio en `public/sw.js`: el fetch handler detecta si la request es de navegación (HTML) y usa network-first; para todo lo demás (JS, CSS, imágenes) mantiene cache-first. Los chunks de Vite tienen hashes en el nombre, por lo que un cambio de contenido implica un cambio de nombre — nunca hay assets obsoletos.

**Tech Stack:** Vanilla JS Service Worker, Vite, Vercel

---

## File Map

| Archivo | Cambio |
|---|---|
| `public/sw.js` | Reemplazar fetch handler con doble estrategia |

---

## Task 1: Reemplazar el fetch handler en sw.js

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Leer el archivo actual**

Antes de editar, leer `public/sw.js` para confirmar el estado actual. Debe verse así:

```js
const CACHE = 'gastos-v2'
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Solo cachear GET, dejar pasar Firebase/Firestore sin caché
  if (e.request.method !== 'GET') return
  const url = e.request.url
  if (url.includes('firestore') || url.includes('googleapis') || url.includes('firebase')) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      }).catch(() => caches.match('/index.html'))
    })
  )
})
```

- [ ] **Step 2: Reemplazar el fetch handler**

Reemplazar solo el bloque `self.addEventListener('fetch', ...)` (las últimas 16 líneas). El archivo completo debe quedar así:

```js
const CACHE = 'gastos-v2'
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = e.request.url
  if (url.includes('firestore') || url.includes('googleapis') || url.includes('firebase')) return

  // HTML → network-first: siempre busca la versión nueva, cae al caché si offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
          return res
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
    )
    return
  }

  // Assets (JS, CSS, imágenes) → cache-first: los chunks de Vite tienen hashes, nunca son obsoletos
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      }).catch(() => caches.match('/index.html'))
    })
  )
})
```

- [ ] **Step 3: Verificar que el archivo no tiene errores de sintaxis**

```bash
node --check public/sw.js
```

Esperado: sin output (sin errores).

- [ ] **Step 4: Commit**

```bash
git add public/sw.js
git commit -m "fix: network-first for HTML in SW so phones always load latest version"
```

- [ ] **Step 5: Deploy a Vercel**

```bash
git push origin main
```

Vercel detecta el push y deploya automáticamente. Una vez deployado, la próxima vez que los teléfonos abran la app cargarán el nuevo `index.html` desde la red.
