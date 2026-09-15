import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Encabezado from '../components/Encabezado'
import { IconMas } from '../components/Iconos'
import { anioDe, diasDe, useViajes } from '../lib/datos'
import { pais } from '../lib/paises'
import type { Viaje } from '../types'

type Filtro = { tipo: 'todos' } | { tipo: 'anio'; valor: number } | { tipo: 'cont'; valor: string }

export default function ViajesScreen() {
  const navegar = useNavigate()
  const viajes = useViajes()
  const [filtro, setFiltro] = useState<Filtro>({ tipo: 'todos' })

  const { anios, continentes } = useMemo(() => {
    const a = new Set<number>()
    const c = new Set<string>()
    for (const v of viajes ?? []) {
      const y = anioDe(v)
      if (y) a.add(y)
      const p = pais(v.iso3)
      if (p) c.add(p.c)
    }
    return {
      anios: [...a].sort((x, y) => y - x),
      continentes: [...c].sort((x, y) => x.localeCompare(y, 'es')),
    }
  }, [viajes])

  const filtrados = useMemo(() => {
    const lista = viajes ?? []
    if (filtro.tipo === 'anio') return lista.filter((v) => anioDe(v) === filtro.valor)
    if (filtro.tipo === 'cont') return lista.filter((v) => pais(v.iso3)?.c === filtro.valor)
    return lista
  }, [viajes, filtro])

  const porAnio = useMemo(() => {
    const grupos = new Map<number, Viaje[]>()
    for (const v of filtrados) {
      const y = anioDe(v)
      if (!grupos.has(y)) grupos.set(y, [])
      grupos.get(y)!.push(v)
    }
    return [...grupos.entries()].sort((a, b) => b[0] - a[0])
  }, [filtrados])

  const chips: { clave: string; texto: string; filtro: Filtro }[] = [
    { clave: 'todos', texto: 'Todos', filtro: { tipo: 'todos' } },
    ...anios.map((a) => ({ clave: `a${a}`, texto: String(a), filtro: { tipo: 'anio' as const, valor: a } })),
    ...continentes.map((c) => ({ clave: `c${c}`, texto: c, filtro: { tipo: 'cont' as const, valor: c } })),
  ]

  const claveActual =
    filtro.tipo === 'todos' ? 'todos' : filtro.tipo === 'anio' ? `a${filtro.valor}` : `c${filtro.valor}`

  const totalDias = filtrados.reduce((s, v) => s + diasDe(v), 0)

  return (
    <>
      <Encabezado
        titulo="Viajes cargados"
        bajada={
          viajes === undefined
            ? 'Cargando…'
            : `${filtrados.length} ${filtrados.length === 1 ? 'viaje' : 'viajes'}${
                totalDias ? ` · ${totalDias} días afuera` : ''
              }`
        }
      />

      <div className="scroll-x px-5 pb-4">
        <div className="flex gap-2">
          {chips.map((c) => (
            <button
              key={c.clave}
              onClick={() => setFiltro(c.filtro)}
              className={`chip tap shrink-0 ${claveActual === c.clave ? 'chip-activo' : ''}`}
            >
              {c.texto}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 px-5">
        {viajes !== undefined && filtrados.length === 0 && (
          <div className="tarjeta px-5 py-8 text-center">
            <p className="titulo text-lg">Todavía no hay nada acá</p>
            <p className="mt-1.5 text-[13px] text-tinta-suave">
              {viajes.length === 0
                ? 'Cargá tu primer viaje con el botón +'
                : 'Probá con otro filtro'}
            </p>
          </div>
        )}

        {porAnio.map(([anio, lista]) => (
          <section key={anio}>
            <div className="mb-2.5 flex items-baseline gap-2.5">
              <h2 className="titulo text-[19px]">{anio || 'Sin fecha'}</h2>
              <span className="h-px flex-1 bg-borde/15" />
              <span className="etiqueta">{lista.length}</span>
            </div>
            <ul className="space-y-2">
              {lista.map((v) => (
                <li key={v.id}>
                  <FilaViaje viaje={v} onAbrir={() => navegar(`/viajes/${v.id}`)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <button
        onClick={() => navegar('/viajes/nuevo')}
        aria-label="Agregar un viaje"
        className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full
                   border border-borde/20 bg-terracota text-arena shadow-lg transition
                   active:scale-90"
        style={{ bottom: 'calc(var(--nav-h) + var(--safe-bottom) + 16px)' }}
      >
        <IconMas className="h-6 w-6" />
      </button>
    </>
  )
}

function FilaViaje({ viaje, onAbrir }: { viaje: Viaje; onAbrir: () => void }) {
  const p = pais(viaje.iso3)
  const dias = diasDe(viaje)
  return (
    <button
      onClick={onAbrir}
      className="tarjeta tap w-full px-4 py-3.5 text-left transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="titulo truncate text-[16px] leading-tight">
            <span aria-hidden className="mr-1.5">
              {p?.flag}
            </span>
            {p?.n ?? viaje.iso3}
          </p>
          {viaje.etiquetas.length > 0 && (
            <p className="mt-1 truncate text-[11px] text-tinta-suave">
              {viaje.etiquetas.map((e) => `#${e}`).join(' ')}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="truncate text-[13px] leading-tight">
            {viaje.ciudades.join(' · ') || '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-tinta-suave">
            {'★'.repeat(viaje.puntaje)}
            {dias ? ` · ${dias}d` : ''}
          </p>
        </div>
      </div>
      {viaje.notas && (
        <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-tinta-suave">
          {viaje.notas}
        </p>
      )}
    </button>
  )
}
