import { useState } from 'react'

export default function HouseholdSetup({ user, onCreate, onJoin }) {
  const [mode,   setMode]   = useState(null) // 'create' | 'join'
  const [code,   setCode]   = useState('')
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try { await onCreate() }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleJoin = async () => {
    if (code.trim().length < 6) { setError('Ingresá el código de 6 caracteres'); return }
    setLoading(true)
    setError('')
    try { await onJoin(code) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      padding: '60px 24px 24px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>👋</div>
      <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
        Hola, {user.displayName?.split(' ')[0]}
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 40 }}>
        Para sincronizar los gastos, necesitás crear un hogar o unirte al de tu pareja.
      </p>

      {!mode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={() => setMode('create')} style={btnStyle('#fff', '#4f46e5')}>
            🏠 Crear hogar nuevo
          </button>
          <button onClick={() => setMode('join')} style={btnStyle('rgba(255,255,255,0.15)', '#fff', true)}>
            🔗 Unirme con código
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
            Crear hogar nuevo
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Se va a generar un código de 6 caracteres. Compartíselo a tu pareja para que pueda unirse.
          </p>
          <button onClick={handleCreate} disabled={loading} style={btnStyle('#fff', '#4f46e5')}>
            {loading ? 'Creando...' : '✅ Crear hogar'}
          </button>
          <button onClick={() => setMode(null)} style={{ ...btnStyle('transparent', 'rgba(255,255,255,0.6)', true), marginTop: 10 }}>
            Volver
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
            Unirme a un hogar
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 16 }}>
            Pedile el código de 6 caracteres a quien ya creó el hogar.
          </p>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Ej: AB12CD"
            maxLength={6}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 22,
              fontWeight: 800, letterSpacing: 6, textAlign: 'center', outline: 'none',
              marginBottom: 16,
            }}
          />
          <button onClick={handleJoin} disabled={loading} style={btnStyle('#fff', '#4f46e5')}>
            {loading ? 'Uniéndome...' : '🔗 Unirme'}
          </button>
          <button onClick={() => setMode(null)} style={{ ...btnStyle('transparent', 'rgba(255,255,255,0.6)', true), marginTop: 10 }}>
            Volver
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: '#fca5a5', marginTop: 16, fontSize: 14, textAlign: 'center' }}>{error}</p>
      )}
    </div>
  )
}

const btnStyle = (bg, color, outline = false) => ({
  width: '100%', padding: '15px', borderRadius: 14, fontSize: 16, fontWeight: 700,
  cursor: 'pointer', border: outline ? `2px solid ${color}` : 'none',
  background: bg, color,
})
