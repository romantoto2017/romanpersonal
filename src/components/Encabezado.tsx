import type { ReactNode } from 'react'

export default function Encabezado({
  titulo,
  bajada,
  accion,
}: {
  titulo: string
  bajada?: string
  accion?: ReactNode
}) {
  return (
    <header
      className="px-5 pb-4"
      style={{ paddingTop: 'calc(18px + var(--safe-top))' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="titulo text-[27px] leading-[1.15]">{titulo}</h1>
          {bajada && (
            <p className="mt-1 text-[13px] leading-snug text-tinta-suave">{bajada}</p>
          )}
        </div>
        {accion}
      </div>
    </header>
  )
}
