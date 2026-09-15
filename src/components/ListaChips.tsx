import { useState, type KeyboardEvent } from 'react'
import { IconCerrar, IconMas } from './Iconos'

export default function ListaChips({
  valores,
  onCambiar,
  placeholder,
  sugerencias = [],
}: {
  valores: string[]
  onCambiar: (v: string[]) => void
  placeholder: string
  sugerencias?: string[]
}) {
  const [borrador, setBorrador] = useState('')

  const agregar = (texto: string) => {
    const limpio = texto.trim().replace(/\s+/g, ' ')
    if (!limpio) return
    if (valores.some((v) => v.toLowerCase() === limpio.toLowerCase())) {
      setBorrador('')
      return
    }
    onCambiar([...valores, limpio])
    setBorrador('')
  }

  const teclas = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      agregar(borrador)
    } else if (e.key === 'Backspace' && !borrador && valores.length) {
      onCambiar(valores.slice(0, -1))
    }
  }

  const libres = sugerencias.filter(
    (s) => !valores.some((v) => v.toLowerCase() === s.toLowerCase()),
  )

  return (
    <div>
      {valores.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {valores.map((v) => (
            <li key={v}>
              <button
                type="button"
                onClick={() => onCambiar(valores.filter((x) => x !== v))}
                className="chip chip-activo"
                aria-label={`Sacar ${v}`}
              >
                {v}
                <IconCerrar className="h-3 w-3 opacity-80" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={teclas}
          onBlur={() => agregar(borrador)}
          placeholder={placeholder}
          className="campo flex-1"
          enterKeyHint="done"
        />
        <button
          type="button"
          onClick={() => agregar(borrador)}
          aria-label="Agregar"
          className="tap flex w-11 items-center justify-center rounded-lg border border-borde/25
                     bg-arena transition active:scale-95"
        >
          <IconMas className="h-4 w-4" />
        </button>
      </div>
      {libres.length > 0 && (
        <ul className="scroll-x mt-2 flex gap-1.5">
          {libres.slice(0, 12).map((s) => (
            <li key={s} className="shrink-0">
              <button type="button" onClick={() => agregar(s)} className="chip text-tinta-suave">
                + {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
