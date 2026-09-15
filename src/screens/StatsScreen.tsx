import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Encabezado from '../components/Encabezado'
import { useEstados, useViajes } from '../lib/datos'
import { banderaPais, nombrePais } from '../lib/paises'
import { calcularResumen } from '../lib/stats'

const TERRACOTA = '#C8553D'
const TINTA_SUAVE = '#6B625A'
const REJILLA = 'rgba(43,38,34,0.09)'

type Medida = 'viajes' | 'dias'

export default function StatsScreen() {
  const viajes = useViajes()
  const estados = useEstados()
  const [medida, setMedida] = useState<Medida>('viajes')

  const r = useMemo(() => calcularResumen(viajes ?? [], estados), [viajes, estados])
  const pico = useMemo(
    () => Math.max(0, ...r.porAnio.map((d) => d[medida])),
    [r.porAnio, medida],
  )
  // Solo etiquetamos el año pico si es uno solo: si empatan todos, un número
  // arriba de cada barra es ruido.
  const picoUnico = useMemo(
    () => pico > 0 && r.porAnio.filter((d) => d[medida] === pico).length === 1,
    [r.porAnio, medida, pico],
  )

  if (viajes === undefined) {
    return <p className="px-5 py-10 text-center text-[13px] text-tinta-suave">Cargando…</p>
  }

  const vacio = r.totalViajes === 0

  return (
    <>
      <Encabezado
        titulo="Estadísticas"
        bajada={
          vacio
            ? 'Cargá viajes y acá aparecen los números'
            : `${r.totalViajes} viajes · ${r.totalDias} días afuera · ${r.paisesVisitados} países`
        }
      />

      <div className="space-y-4 px-5">
        {/* Números grandes */}
        <section className="grid grid-cols-2 gap-2">
          <Tarjeta
            grande
            numero={r.totalDias.toLocaleString('es-UY')}
            texto="días viajando en total"
            pie={
              r.totalDias >= 30
                ? `Algo así como ${(r.totalDias / 30).toFixed(1)} meses`
                : undefined
            }
          />
          <div className="grid grid-rows-2 gap-2">
            <Tarjeta
              numero={`${r.continentesVisitados}/${r.continentes.length}`}
              texto="continentes"
            />
            <Tarjeta numero={r.ciudades.toString()} texto="ciudades" />
          </div>
        </section>

        {/* Gráfico */}
        <section className="tarjeta px-3 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between gap-2 px-2">
            <h2 className="titulo text-[17px]">
              {medida === 'viajes' ? 'Viajes por año' : 'Días por año'}
            </h2>
            <div className="flex overflow-hidden rounded-lg border border-borde/20">
              {(
                [
                  ['viajes', 'Viajes'],
                  ['dias', 'Días'],
                ] as [Medida, string][]
              ).map(([clave, texto]) => (
                <button
                  key={clave}
                  onClick={() => setMedida(clave)}
                  className={`px-2.5 py-1.5 text-[12px] transition ${
                    medida === clave ? 'bg-terracota text-arena' : 'text-tinta-suave'
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          {r.porAnio.length === 0 ? (
            <p className="px-2 pb-4 text-[13px] text-tinta-suave">
              Todavía no hay viajes con fecha cargada.
            </p>
          ) : (
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={r.porAnio}
                  margin={{ top: 18, right: 6, left: -22, bottom: 0 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid stroke={REJILLA} vertical={false} />
                  <XAxis
                    dataKey="anio"
                    tick={{ fill: TINTA_SUAVE, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: REJILLA }}
                    interval="preserveStartEnd"
                    minTickGap={4}
                  />
                  <YAxis
                    tick={{ fill: TINTA_SUAVE, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={44}
                    /* Sin esto recharts estira el eje a 0–4 aunque el máximo sea 1 */
                    domain={[0, (max: number) => Math.max(1, Math.ceil(max))]}
                    tickCount={Math.min(5, Math.max(2, pico + 1))}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(43,38,34,0.05)' }}
                    content={<Globo medida={medida} />}
                  />
                  <Bar
                    dataKey={medida}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={34}
                    isAnimationActive
                    animationDuration={450}
                  >
                    {r.porAnio.map((d) => (
                      <Cell
                        key={d.anio}
                        fill={TERRACOTA}
                        fillOpacity={d[medida] === 0 ? 0.18 : 1}
                      />
                    ))}
                    {/* Etiqueta directa solo en el año pico, para no ensuciar */}
                    <LabelList
                      dataKey={medida}
                      position="top"
                      offset={6}
                      content={(props) => {
                        const { x, y, width, value } = props as {
                          x: number
                          y: number
                          width: number
                          value: number
                        }
                        if (!picoUnico || value !== pico) return null
                        return (
                          <text
                            x={x + width / 2}
                            y={y - 6}
                            textAnchor="middle"
                            fill={TINTA_SUAVE}
                            fontSize={11}
                            fontWeight={600}
                          >
                            {value}
                          </text>
                        )
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Continentes */}
        <section className="tarjeta px-4 py-4">
          <h2 className="titulo mb-3 text-[17px]">Continentes</h2>
          <ul className="space-y-2">
            {r.continentes.map((c) => (
              <li key={c.nombre} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full border border-borde/30"
                  style={{ background: c.visitado ? TERRACOTA : 'transparent' }}
                />
                <span className={`flex-1 text-[14px] ${c.visitado ? '' : 'text-tinta-suave'}`}>
                  {c.nombre}
                </span>
                <span className="text-[12px] text-tinta-suave">
                  {c.paises === 0 ? 'todavía no' : `${c.paises} ${c.paises === 1 ? 'país' : 'países'}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Datitos */}
        <section className="grid grid-cols-1 gap-2">
          {r.paisMasRepetido && (
            <Dato
              clave="País más repetido"
              valor={`${banderaPais(r.paisMasRepetido.iso3)} ${nombrePais(r.paisMasRepetido.iso3)}`}
              pie={`${r.paisMasRepetido.veces} ${r.paisMasRepetido.veces === 1 ? 'viaje' : 'viajes'}`}
            />
          )}
          {r.ciudadFavorita && (
            <Dato
              clave="Ciudad favorita"
              valor={`${banderaPais(r.ciudadFavorita.iso3)} ${r.ciudadFavorita.ciudad}`}
              pie={`${r.ciudadFavorita.puntaje.toFixed(1)} de 5 según tu puntaje`}
            />
          )}
          {r.viajeMasLargo && (
            <Dato
              clave="Viaje más largo"
              valor={`${banderaPais(r.viajeMasLargo.iso3)} ${nombrePais(r.viajeMasLargo.iso3)}`}
              pie={`${r.viajeMasLargo.ciudades.join(' · ') || 'sin ciudades'}`}
            />
          )}
          {r.puntajePromedio > 0 && (
            <Dato
              clave="Puntaje promedio"
              valor={`${r.puntajePromedio.toFixed(1)} de 5`}
              pie={'★'.repeat(Math.round(r.puntajePromedio))}
            />
          )}
          {r.etiquetaEstrella && (
            <Dato
              clave="Tu etiqueta estrella"
              valor={`#${r.etiquetaEstrella.nombre}`}
              pie={`la usaste ${r.etiquetaEstrella.veces} ${
                r.etiquetaEstrella.veces === 1 ? 'vez' : 'veces'
              }`}
            />
          )}
          {r.companiaFrecuente && (
            <Dato clave="Casi siempre viajás" valor={r.companiaFrecuente} />
          )}
        </section>

        {/* Tabla: los mismos datos del gráfico, en texto */}
        {r.porAnio.length > 0 && (
          <details className="tarjeta px-4 py-3">
            <summary className="cursor-pointer text-[13px] text-tinta-suave">
              Ver los números del gráfico
            </summary>
            <table className="mt-3 w-full text-[13px]">
              <thead>
                <tr className="text-left text-tinta-suave">
                  <th className="pb-1.5 font-medium">Año</th>
                  <th className="pb-1.5 text-right font-medium">Viajes</th>
                  <th className="pb-1.5 text-right font-medium">Días</th>
                </tr>
              </thead>
              <tbody>
                {[...r.porAnio].reverse().map((d) => (
                  <tr key={d.anio} className="border-t border-borde/10">
                    <td className="py-1.5">{d.anio}</td>
                    <td className="py-1.5 text-right tabular-nums">{d.viajes}</td>
                    <td className="py-1.5 text-right tabular-nums">{d.dias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </>
  )
}

function Globo({
  active,
  payload,
  label,
  medida,
}: {
  active?: boolean
  payload?: { payload: { viajes: number; dias: number } }[]
  label?: string
  medida: Medida
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-borde/25 bg-arena px-3 py-2 text-[12px] shadow-lg">
      <p className="font-semibold">{label}</p>
      <p className="text-tinta-suave">
        {medida === 'viajes'
          ? `${d.viajes} ${d.viajes === 1 ? 'viaje' : 'viajes'} · ${d.dias} días`
          : `${d.dias} días · ${d.viajes} ${d.viajes === 1 ? 'viaje' : 'viajes'}`}
      </p>
    </div>
  )
}

function Tarjeta({
  numero,
  texto,
  pie,
  grande,
}: {
  numero: string
  texto: string
  pie?: string
  grande?: boolean
}) {
  return (
    <div className={`tarjeta flex flex-col justify-center px-4 ${grande ? 'py-5' : 'py-3'}`}>
      <p className={`titulo leading-none ${grande ? 'text-[38px] text-terracota' : 'text-[22px]'}`}>
        {numero}
      </p>
      <p className="mt-1.5 text-[12px] leading-snug text-tinta-suave">{texto}</p>
      {pie && <p className="mt-1 text-[11px] text-tinta-suave/80">{pie}</p>}
    </div>
  )
}

function Dato({ clave, valor, pie }: { clave: string; valor: string; pie?: string }) {
  return (
    <div className="tarjeta flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="etiqueta">{clave}</p>
        <p className="mt-0.5 truncate text-[15px]">{valor}</p>
      </div>
      {pie && <p className="shrink-0 text-right text-[11.5px] text-tinta-suave">{pie}</p>}
    </div>
  )
}
