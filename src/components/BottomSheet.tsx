import { useEffect, type ReactNode } from 'react'
import { IconCerrar } from './Iconos'

type Props = {
  abierto: boolean
  onCerrar: () => void
  titulo?: ReactNode
  bajada?: ReactNode
  children: ReactNode
  /** Ocupa toda la pantalla (para formularios largos) */
  alto?: boolean
}

export default function BottomSheet({
  abierto,
  onCerrar,
  titulo,
  bajada,
  children,
  alto = false,
}: Props) {
  useEffect(() => {
    if (!abierto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', esc)
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 animate-fade-in bg-tinta/35 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-md animate-sheet-up rounded-t-2xl border-x border-t
                    border-borde/25 bg-papel shadow-sheet ${alto ? 'h-[92vh]' : 'max-h-[86vh]'}
                    flex flex-col`}
      >
        <div className="flex items-start gap-3 px-5 pb-3 pt-3">
          <div className="min-w-0 flex-1">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-borde/20" />
            {titulo && <h2 className="titulo truncate text-xl leading-tight">{titulo}</h2>}
            {bajada && <p className="mt-0.5 text-[13px] text-tinta-suave">{bajada}</p>}
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="tap -mr-2 mt-2 flex items-center justify-center text-tinta-suave"
          >
            <IconCerrar className="h-5 w-5" />
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto px-5"
          style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
