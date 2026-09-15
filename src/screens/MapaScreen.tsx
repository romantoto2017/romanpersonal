import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Encabezado from '../components/Encabezado'
import MapaMundi from '../components/MapaMundi'
import PanelPais from '../components/PanelPais'
import { IconAjustes, IconBuscar } from '../components/Iconos'
import { useEstados } from '../lib/datos'
import {
  CONTINENTES,
  COLOR_ESTADO,
  ESTADOS,
  TOTAL_MUNDO,
  buscarPaises,
  pais,
} from '../lib/paises'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'

export default function MapaScreen() {
  const navegar = useNavigate()
  const estados = useEstados()
  const viajes = useLiveQuery(() => db.viajes.toArray(), [], [])
  const [consulta, setConsulta] = useState('')
  const [elegido, setElegido] = useState<string | null>(null)
  const [foco, setFoco] = useState<{ lat: number; lng: number; iso3: string } | null>(null)

  const resumen = useMemo(() => {
    const visitados = Object.entries(estados)
      .filter(([, e]) => e === 'visitado')
      .map(([iso3]) => iso3)
    const soberanosVisitados = visitados.filter((i) => pais(i)?.un)
    const continentes = new Set(
      soberanosVisitados.map((i) => pais(i)?.c).filter(Boolean) as string[],
    )
    const ciudades = new Set(
      viajes.flatMap((v) => v.ciudades.map((c) => `${v.iso3}:${c.toLowerCase()}`)),
    )
    return {
      paises: soberanosVisitados.length,
      porcentaje: (soberanosVisitados.length / TOTAL_MUNDO) * 100,
      ciudades: ciudades.size,
      continentes: continentes.size,
    }
  }, [estados, viajes])

  const resultados = useMemo(
    () => (consulta.trim() ? buscarPaises(consulta, 8) : []),
    [consulta],
  )

  const abrirPais = (iso3: string) => {
    setElegido(iso3)
    setConsulta('')
  }

  return (
    <>
      <Encabezado
        titulo="Mi mapa de viajes"
        bajada="Tocá un país para marcarlo o cargarle un viaje"
        accion={
          <button
            onClick={() => navegar('/ajustes')}
            aria-label="Ajustes"
            className="tap -mr-2 flex items-center justify-center text-tinta-suave"
          >
            <IconAjustes className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-4 px-5">
        {/* % del mundo */}
        <section className="tarjeta animate-rise overflow-hidden">
          <div className="flex items-end justify-between px-5 pb-4 pt-5">
            <div>
              <p className="titulo text-[44px] leading-none text-terracota">
                {resumen.porcentaje.toFixed(1)}
                <span className="text-[26px]">%</span>
              </p>
              <p className="mt-1.5 text-[13px] text-tinta-suave">del mundo visitado</p>
            </div>
            <p className="text-right text-[13px] text-tinta-suave">
              <span className="titulo block text-[20px] text-tinta">
                {resumen.paises}
                <span className="text-tinta-suave">/{TOTAL_MUNDO}</span>
              </span>
              países
            </p>
          </div>
          <div className="h-2 w-full bg-papel-hondo">
            <div
              className="h-full bg-terracota transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(resumen.porcentaje, 0.8)}%` }}
            />
          </div>
        </section>

        {/* Tres tarjetas chicas */}
        <section className="grid grid-cols-3 gap-2">
          {[
            { n: String(resumen.paises), t: 'países' },
            { n: String(resumen.ciudades), t: 'ciudades' },
            { n: `${resumen.continentes}/${CONTINENTES.length}`, t: 'continentes' },
          ].map((d, i) => (
            <div
              key={d.t}
              className="tarjeta animate-rise px-3 py-3 text-center"
              style={{ animationDelay: `${60 + i * 50}ms` }}
            >
              <p className="titulo text-[22px] leading-none">{d.n}</p>
              <p className="etiqueta mt-1.5">{d.t}</p>
            </div>
          ))}
        </section>

        {/* Buscador */}
        <section className="relative">
          <div className="relative">
            <IconBuscar className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-suave" />
            <input
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Buscar país"
              aria-label="Buscar país"
              className="campo pl-10"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
          {resultados.length > 0 && (
            <ul className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-borde/25 bg-arena shadow-lg">
              {resultados.map((p) => (
                <li key={p.i3}>
                  <button
                    onClick={() => {
                      setFoco({ lat: p.lat, lng: p.lng, iso3: p.i3 })
                      abrirPais(p.i3)
                    }}
                    className="tap flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px]
                               transition active:bg-papel-hondo"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full border border-borde/30"
                      style={{ background: COLOR_ESTADO[estados[p.i3] ?? 'no'] }}
                    />
                    <span aria-hidden>{p.flag}</span>
                    <span className="min-w-0 flex-1 truncate">{p.n}</span>
                    <span className="text-[11px] text-tinta-suave">{p.c}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Leyenda */}
        <section className="scroll-x -mx-5 px-5">
          <ul className="flex gap-2 pb-0.5">
            {ESTADOS.map((e) => (
              <li
                key={e.clave}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-borde/20
                           bg-arena px-2.5 py-1.5 text-[11.5px] text-tinta-suave"
              >
                <span
                  className="h-2.5 w-2.5 rounded-[3px] border border-borde/40"
                  style={{ background: e.color }}
                />
                {e.nombre}
              </li>
            ))}
            <li
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-borde/20
                         bg-arena px-2.5 py-1.5 text-[11.5px] text-tinta-suave"
            >
              <span
                className="h-2.5 w-2.5 rounded-[3px] border border-borde/40"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg,#C8553D 0 2px,#FBF7F0 2px 3.5px)',
                }}
              />
              Mi país
            </li>
          </ul>
        </section>

        {/* Mapa */}
        <MapaMundi
          estados={estados}
          onTocarPais={abrirPais}
          foco={foco}
          resaltado={elegido}
        />

        <p className="pb-2 text-center text-[11.5px] text-tinta-suave">
          Pellizcá para hacer zoom · arrastrá para moverte
        </p>
      </div>

      <PanelPais
        iso3={elegido}
        estado={(elegido && estados[elegido]) || 'no'}
        onCerrar={() => setElegido(null)}
      />
    </>
  )
}
