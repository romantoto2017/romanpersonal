import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { marcarPais } from '../db/db'
import {
  calcularCambio,
  formatearMonto,
  traerClima,
  traerInfoPais,
  type Cambio,
  type Clima,
  type InfoPais,
} from '../lib/apis'
import type { Recomendacion } from '../lib/recomendar'
import type { EstadoPais } from '../types'

export default function TarjetaRecomendacion({
  r,
  tasas,
  fechaTasas,
  estado,
  demora,
}: {
  r: Recomendacion
  tasas: Record<string, number> | null
  fechaTasas: string
  estado: EstadoPais
  demora: number
}) {
  const navegar = useNavigate()
  const [clima, setClima] = useState<Clima | null>(null)
  const [buscandoClima, setBuscandoClima] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [info, setInfo] = useState<InfoPais | null>(null)

  useEffect(() => {
    let vivo = true
    // Escalonamos los pedidos para no golpear la API de una.
    const reloj = setTimeout(async () => {
      const c = await traerClima(r.p.lat, r.p.lng)
      if (vivo) {
        setClima(c)
        setBuscandoClima(false)
      }
    }, demora)
    return () => {
      vivo = false
      clearTimeout(reloj)
    }
  }, [r.p.i3, r.p.lat, r.p.lng, demora])

  // La ficha completa la pedimos recién cuando abrís la tarjeta.
  useEffect(() => {
    if (!abierto || info) return
    let vivo = true
    traerInfoPais(r.p.i3).then((d) => vivo && d && setInfo(d))
    return () => {
      vivo = false
    }
  }, [abierto, info, r.p.i3])

  const cambio: Cambio | null =
    tasas && r.p.cur ? calcularCambio(tasas, fechaTasas, r.p.cur) : null

  return (
    <article className="tarjeta animate-rise overflow-hidden">
      <div className="flex items-start gap-3 px-4 pt-4">
        <span aria-hidden className="text-[30px] leading-none">
          {r.p.flag}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="titulo text-[18px] leading-tight">{r.p.n}</h3>
          <p className="mt-0.5 text-[11.5px] text-tinta-suave">
            {r.p.c}
            {r.p.cap ? ` · ${r.p.cap}` : ''} · {r.km.toLocaleString('es-UY')} km
          </p>
        </div>
        {r.temporada.buenAhora && (
          <span className="shrink-0 rounded-full border border-oliva/40 bg-oliva/10 px-2 py-0.5 text-[10px] text-oliva">
            buen momento
          </span>
        )}
      </div>

      <p className="px-4 pt-2.5 text-[13.5px] leading-snug">{r.titular}</p>

      {/* Clima y cambio */}
      <div className="mt-3 grid grid-cols-2 gap-px bg-borde/10">
        <div className="bg-arena px-4 py-3">
          <p className="etiqueta">Clima ahora</p>
          {buscandoClima ? (
            <p className="mt-1 text-[13px] text-tinta-suave">buscando…</p>
          ) : clima ? (
            <>
              <p className="mt-1 text-[15px]">
                <span aria-hidden className="mr-1">
                  {clima.emoji}
                </span>
                {clima.temp}°
              </p>
              <p className="text-[11px] text-tinta-suave">
                {clima.descripcion} · {clima.minHoy}°/{clima.maxHoy}°
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12px] text-tinta-suave">sin conexión</p>
          )}
        </div>
        <div className="bg-arena px-4 py-3">
          <p className="etiqueta">$1.000 UYU</p>
          {cambio ? (
            <>
              <p className="mt-1 text-[15px]">
                {formatearMonto(cambio.porMil)}{' '}
                <span className="text-[12px] text-tinta-suave">{r.p.cur}</span>
              </p>
              <p className="truncate text-[11px] text-tinta-suave">
                {r.p.curN || r.p.cur}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12px] text-tinta-suave">
              {tasas ? 'sin cotización' : 'sin conexión'}
            </p>
          )}
        </div>
      </div>

      {abierto && (
        <div className="animate-fade-in border-t border-borde/10 px-4 py-3">
          <ul className="space-y-1.5">
            {r.motivos.map((m, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-tinta-suave">
                <span aria-hidden className="text-terracota">
                  ·
                </span>
                {m.texto}
              </li>
            ))}
          </ul>

          {clima && clima.proximos.length > 0 && (
            <div className="mt-3">
              <p className="etiqueta mb-1.5">Próximos días</p>
              <ul className="flex gap-4">
                {clima.proximos.map((d) => (
                  <li key={d.dia} className="text-center">
                    <p className="text-[11px] text-tinta-suave">{d.dia}</p>
                    <p aria-hidden className="text-[16px] leading-tight">
                      {d.emoji}
                    </p>
                    <p className="text-[11px]">
                      {d.max}°<span className="text-tinta-suave">/{d.min}°</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            <div>
              <dt className="etiqueta">Capital</dt>
              <dd className="truncate">{info?.capital || r.p.cap || '—'}</dd>
            </div>
            <div>
              <dt className="etiqueta">Idioma</dt>
              <dd className="truncate capitalize">{r.p.lang.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="etiqueta">Moneda</dt>
              <dd className="truncate">
                {r.p.cur || '—'} {r.p.curS}
              </dd>
            </div>
            <div>
              <dt className="etiqueta">Gente</dt>
              <dd>
                {info?.poblacion
                  ? `${(info.poblacion / 1_000_000).toFixed(1)} M`
                  : '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => marcarPais(r.p.i3, estado === 'deseo' ? 'no' : 'deseo')}
              className={`boton tap text-[13px] ${
                estado === 'deseo' ? 'bg-oliva text-arena' : 'boton-borde'
              }`}
            >
              {estado === 'deseo' ? 'En tu lista ✓' : 'Sumar a deseos'}
            </button>
            <button
              onClick={() => navegar(`/viajes/nuevo?pais=${r.p.i3}`)}
              className="boton-lleno tap text-[13px]"
            >
              Ya fui, cargar
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setAbierto((x) => !x)}
        className="tap w-full border-t border-borde/10 py-2.5 text-[12px] text-tinta-suave"
        aria-expanded={abierto}
      >
        {abierto ? 'Cerrar' : 'Por qué te la recomiendo'}
      </button>
    </article>
  )
}
