import { useNavigate } from 'react-router-dom'
import { db, marcarPais } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { COLOR_ESTADO, ESTADOS, MI_PAIS, distanciaDesdeMontevideo, pais } from '../lib/paises'
import { rangoFechas } from '../lib/datos'
import type { EstadoPais } from '../types'
import BottomSheet from './BottomSheet'
import { IconMas } from './Iconos'

type Props = {
  iso3: string | null
  estado: EstadoPais
  onCerrar: () => void
}

export default function PanelPais({ iso3, estado, onCerrar }: Props) {
  const navegar = useNavigate()
  const p = iso3 ? pais(iso3) : undefined
  const viajes = useLiveQuery(
    async () => (iso3 ? db.viajes.where('iso3').equals(iso3).toArray() : []),
    [iso3],
    [],
  )

  if (!p) return null

  const km = distanciaDesdeMontevideo(p)

  return (
    <BottomSheet
      abierto={!!iso3}
      onCerrar={onCerrar}
      titulo={
        <span className="flex items-center gap-2">
          <span aria-hidden>{p.flag}</span>
          {p.n}
        </span>
      }
      bajada={
        <>
          {p.c}
          {p.sr ? ` · ${p.sr}` : ''} · {km.toLocaleString('es-UY')} km de Montevideo
          {iso3 === MI_PAIS && ' · tu casa 🧉'}
        </>
      }
    >
      <p className="etiqueta mb-2">Cómo lo marcás</p>
      <div className="grid grid-cols-2 gap-2">
        {ESTADOS.map((e) => {
          const activo = e.clave === estado
          return (
            <button
              key={e.clave}
              onClick={() => marcarPais(p.i3, e.clave)}
              className={`tap flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left
                          text-[13px] transition active:scale-[0.97] ${
                            activo
                              ? 'border-terracota bg-terracota/10 font-medium'
                              : 'border-borde/25 bg-arena'
                          }`}
            >
              <span
                className="h-4 w-4 shrink-0 rounded-[4px] border border-borde/40"
                style={{ background: COLOR_ESTADO[e.clave] }}
              />
              <span className="min-w-0">
                <span className="block truncate">{e.nombre}</span>
                <span className="block truncate text-[11px] text-tinta-suave">{e.ayuda}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { k: 'Capital', v: p.cap || '—' },
          { k: 'Moneda', v: p.cur || '—' },
          { k: 'Idioma', v: p.lang[0] || '—' },
        ].map((d) => (
          <div key={d.k} className="tarjeta px-2 py-2.5">
            <p className="etiqueta">{d.k}</p>
            <p className="mt-1 truncate text-[13px] font-medium capitalize">{d.v}</p>
          </div>
        ))}
      </div>

      {viajes.length > 0 && (
        <div className="mt-5">
          <p className="etiqueta mb-2">
            {viajes.length === 1 ? 'Tu viaje' : `Tus ${viajes.length} viajes`}
          </p>
          <ul className="space-y-1.5">
            {viajes.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => navegar(`/viajes/${v.id}`)}
                  className="tarjeta tap flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px]">
                      {v.ciudades.join(' · ') || 'Sin ciudades'}
                    </span>
                    <span className="block truncate text-[12px] text-tinta-suave">
                      {rangoFechas(v)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] text-terracota">
                    {'★'.repeat(v.puntaje)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => navegar(`/viajes/nuevo?pais=${p.i3}`)}
        className="boton-lleno mt-5 w-full tap"
      >
        <IconMas className="h-4 w-4" />
        Cargar un viaje a {p.n}
      </button>
    </BottomSheet>
  )
}
