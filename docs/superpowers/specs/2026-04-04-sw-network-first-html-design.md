# Service Worker: Network-First para HTML

**Fecha:** 2026-04-04

## Problema

El SW actual usa cache-first para todos los recursos, incluyendo `index.html`. La constante `CACHE = 'gastos-v2'` está hardcodeada y no cambia entre deploys. El browser compara el SW byte a byte — si es idéntico, no detecta actualización y `index.html` permanece cacheado indefinidamente. Los teléfonos con la app instalada como PWA siguen viendo la versión vieja después de cada deploy.

## Solución

Cambiar el fetch handler en `public/sw.js` para usar dos estrategias:

- **Navigation requests (`e.request.mode === 'navigate'`):** network-first. Siempre intenta la red primero. Si falla (offline), cae al caché como fallback.
- **Assets (JS, CSS, imágenes):** cache-first. Los chunks de Vite tienen hashes en el nombre (`index-Ab3xK.js`), por lo que un cambio de contenido implica un cambio de nombre — nunca hay assets obsoletos en caché.

## Archivo afectado

| Archivo | Cambio |
|---|---|
| `public/sw.js` | Reemplazar el fetch handler con lógica de doble estrategia |

## Cambio en detalle

```js
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = e.request.url
  if (url.includes('firestore') || url.includes('googleapis') || url.includes('firebase')) return

  // HTML → network-first
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

  // Assets → cache-first
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

## Lo que NO cambia

- Install handler (precacheo inicial de assets)
- Activate handler (limpieza de caches viejos)
- `CACHE = 'gastos-v2'` (no es necesario cambiarla; el SW se actualiza porque el archivo cambia)
- `manifest.json`, `vite.config.js`, `package.json`
- Ningún archivo de la app React
