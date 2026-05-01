import { useState } from 'react'
import type { SplitParticipant } from '../../types'
import { participantKey } from '../../splitUtils'

interface Props {
  currentUser: { uid: string; displayName: string | null }
  onClose: () => void
  onSave: (title: string, participants: SplitParticipant[]) => void
  onSearchUser: (email: string) => Promise<SplitParticipant | null>
}

export default function NewSplitModal({ currentUser, onClose, onSave, onSearchUser }: Props) {
  const [title, setTitle]             = useState('')
  const [emailInput, setEmailInput]   = useState('')
  const [aliasInput, setAliasInput]   = useState('')
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')
  const [participants, setParticipants] = useState<SplitParticipant[]>([
    { type: 'user', uid: currentUser.uid, name: currentUser.displayName ?? 'Yo' },
  ])

  const addAlias = () => {
    const name = aliasInput.trim()
    if (!name) return
    if (participants.some(p => p.type === 'alias' && p.name.toLowerCase() === name.toLowerCase())) return
    setParticipants(prev => [...prev, { type: 'alias', name }])
    setAliasInput('')
  }

  const searchUser = async () => {
    const email = emailInput.trim().toLowerCase()
    if (!email) return
    setSearching(true)
    setSearchError('')
    try {
      const found = await onSearchUser(email)
      if (!found) { setSearchError('No se encontró ningún usuario con ese email'); return }
      if (participants.some(p => p.uid === found.uid)) { setSearchError('Este usuario ya está en la lista'); return }
      setParticipants(prev => [...prev, found])
      setEmailInput('')
    } finally {
      setSearching(false)
    }
  }

  const remove = (key: string) =>
    setParticipants(prev => prev.filter(p => participantKey(p) !== key))

  const save = () => {
    if (!title.trim() || participants.length < 2) return
    onSave(title.trim(), participants)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,10,40,0.6)] z-50 flex items-end backdrop-blur-xs"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[28px_28px_0_0] w-full max-w-120 mx-auto p-[20px_20px_44px] max-h-[92vh] overflow-y-auto">
        <div className="w-9 h-1 bg-slate-200 rounded-xs mx-auto mb-4.5" />
        <div className="text-[21px] font-extrabold text-[#1e1b4b] mb-4.5">🤝 Nuevo evento</div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            Nombre del evento
          </label>
          <input
            className="w-full p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[16px] text-[#1e1b4b] outline-none focus:border-indigo-600 bg-white"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Cena de cumpleaños"
            autoFocus
          />
        </div>

        {/* Add by email */}
        <div className="mb-3">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            Agregar usuario por email
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[15px] text-[#1e1b4b] outline-none focus:border-indigo-600 bg-white"
              type="email"
              inputMode="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUser()}
              placeholder="email@ejemplo.com"
            />
            <button
              onClick={searchUser}
              disabled={searching}
              className="px-4 border-none rounded-[13px] bg-indigo-100 text-indigo-700 font-bold text-[14px] cursor-pointer disabled:opacity-60"
            >
              {searching ? '...' : 'Buscar'}
            </button>
          </div>
          {searchError && <div className="text-red-500 text-[12px] mt-1">{searchError}</div>}
        </div>

        {/* Add alias */}
        <div className="mb-4">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-1.5 block">
            Agregar persona sin app
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 p-[13px_14px] border-2 border-slate-200 rounded-[13px] text-[15px] text-[#1e1b4b] outline-none focus:border-indigo-600 bg-white"
              value={aliasInput}
              onChange={e => setAliasInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAlias()}
              placeholder="Nombre (ej: Martín)"
            />
            <button
              onClick={addAlias}
              className="px-4 border-none rounded-[13px] bg-slate-100 text-slate-700 font-bold text-[14px] cursor-pointer"
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Participant list */}
        <div className="mb-5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4px] mb-2 block">
            Participantes ({participants.length})
          </label>
          <div className="flex flex-col gap-1.5">
            {participants.map(p => {
              const key  = participantKey(p)
              const isMe = p.type === 'user' && p.uid === currentUser.uid
              return (
                <div key={key} className="flex items-center gap-2 bg-slate-50 rounded-[10px] px-3 py-2">
                  <span className="text-[14px]">{p.type === 'user' ? '👤' : '🙂'}</span>
                  <span className="flex-1 text-[14px] font-semibold text-[#1e1b4b]">
                    {p.name}{isMe ? ' (vos)' : ''}
                  </span>
                  {!isMe && (
                    <button
                      onClick={() => remove(key)}
                      aria-label={`Eliminar ${p.name}`}
                      className="bg-transparent border-none text-slate-300 text-[20px] cursor-pointer leading-none active:text-red-500"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            className="flex-1 py-3.75 border-2 border-slate-200 rounded-[13px] bg-white text-[15px] font-semibold text-slate-500 cursor-pointer"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="flex-2 py-3.75 border-none rounded-[13px] bg-linear-to-br from-indigo-600 to-violet-600 text-[15px] font-bold text-white cursor-pointer disabled:opacity-50"
            onClick={save}
            disabled={!title.trim() || participants.length < 2}
          >
            Crear evento
          </button>
        </div>
      </div>
    </div>
  )
}
