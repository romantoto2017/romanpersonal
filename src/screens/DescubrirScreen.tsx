import { useEffect, useMemo, useState } from 'react'
import Encabezado from '../components/Encabezado'
import TarjetaRecomendacion from '../components/TarjetaRecomendacion'
import { traerTasas } from '../lib/apis'
import { useEstados, useViajes } from '../lib/datos'
import { FILTROS_MOTIVO, estacionDe, recomendar, type MotivoTipo } from '../lib/recomendar'

export default function DescubrirScreen() {
  const estados = useEstados()
  const viajes = useViajes()
  const [filtro, setFiltro] = useState<MotivoTipo | 'todas'>('todas')
  const [tasas, setTasas] = useState<Record<string, number> | null>(null)
  const [fechaTasas, setFechaTasas] = useState('')
  const [enLinea, setEnLinea] = useState(navigator.onLine)

  useEffect(() => {
    let vivo = true
    traerTasas().then((r) => {
      if (!vivo || !r) return
      setTasas(r.tasas)
      setFechaTasas(r.fecha)
    })
    const arriba = () => setEnLinea(true)
    const abajo = () => setEnLinea(false)
    window.addEventListener('online', arriba)
    window.addEventListener('offline', abajo)
    return () => {
      vivo = false
      window.removeEventListener('online', arriba)
      window.removeEventListener('offline', abajo)
    }
  }, [])

  const todas = useMemo(
    () => recomendar(estados, viajes ?? [], 24),
    [estados, viajes],
  )

  const visibles = useMemo(() => {
    const lista =
      filtro === 'todas'
        ? todas
        : filtro === 'temporada'
          ? todas.filter((r) => r.temporada.buenAhora)
          : todas.filter((r) => r.motivos.some((m) => m.tipo === filtro))
    return lista.slice(0, 10)
  }, [todas, filtro])

  const estacionAca = estacionDe(-34.9, new Date().getMonth())

  return (
    <>
      <Encabezado
        titulo="Descubrir"
        bajada={`Armado con tus datos. Acá en Uruguay es ${estacionAca}, así que lo tenemos en cuenta.`}
      />

      {!enLinea && (
        <div className="mx-5 mb-4 rounded-lg border border-mostaza/45 bg-mostaza/10 px-3 py-2.5 text-[12.5px]">
          Estás sin internet: el clima y la cotización son los últimos que guardé.
        </div>
      )}

      <div className="scroll-x px-5 pb-4">
        <div className="flex gap-2">
          {FILTROS_MOTIVO.map((f) => (
            <button
              key={f.clave}
              onClick={() => setFiltro(f.clave)}
              className={`chip tap shrink-0 ${filtro === f.clave ? 'chip-activo' : ''}`}
            >
              {f.texto}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 px-5">
        {visibles.length === 0 && (
          <div className="tarjeta px-5 py-8 text-center">
            <p className="titulo text-lg">Nada por acá</p>
            <p className="mt-1.5 text-[13px] text-tinta-suave">
              {filtro === 'deseo'
                ? 'Marcá países como “Deseo” en el mapa y te los ordeno acá.'
                : 'Probá con otro filtro.'}
            </p>
          </div>
        )}

        {visibles.map((r, i) => (
          <TarjetaRecomendacion
            key={r.p.i3}
            r={r}
            tasas={tasas}
            fechaTasas={fechaTasas}
            estado={estados[r.p.i3] ?? 'no'}
            demora={i * 220}
          />
        ))}

        {visibles.length > 0 && (
          <p className="pb-2 text-center text-[11px] leading-relaxed text-tinta-suave">
            Clima: Open-Meteo · Cotización: open.er-api.com
            {fechaTasas ? ` (${fechaTasas})` : ''} · Datos de países: REST Countries
          </p>
        )}
      </div>
    </>
  )
}
