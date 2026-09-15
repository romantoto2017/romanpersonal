import { useMemo, useState } from 'react'
import { buscarPaises, pais } from '../lib/paises'
import BottomSheet from './BottomSheet'
import { IconBuscar } from './Iconos'

export default function SelectorPais({
  valor,
  onCambiar,
}: {
  valor: string
  onCambiar: (iso3: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [consulta, setConsulta] = useState('')
  const elegido = valor ? pais(valor) : undefined
  const resultados = useMemo(() => buscarPaises(consulta, 60), [consulta])

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConsulta('')
          setAbierto(true)
        }}
        className="campo tap flex items-center justify-between gap-2 text-left"
      >
        <span className={elegido ? '' : 'text-tinta-suave/70'}>
          {elegido ? `${elegido.flag}  ${elegido.n}` : 'Elegí un país'}
        </span>
        <span className="text-[12px] text-terracota">cambiar</span>
      </button>

      <BottomSheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="¿A dónde fuiste?"
        alto
      >
        <div className="sticky top-0 z-10 -mx-5 bg-papel px-5 pb-3">
          <div className="relative">
            <IconBuscar className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-suave" />
            <input
              autoFocus
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Buscar país"
              className="campo pl-10"
              enterKeyHint="search"
            />
          </div>
        </div>
        <ul className="divide-y divide-borde/10">
          {resultados.map((p) => (
            <li key={p.i3}>
              <button
                type="button"
                onClick={() => {
                  onCambiar(p.i3)
                  setAbierto(false)
                }}
                className={`tap flex w-full items-center gap-3 py-3 text-left text-[15px] ${
                  p.i3 === valor ? 'font-semibold text-terracota' : ''
                }`}
              >
                <span aria-hidden className="text-lg">
                  {p.flag}
                </span>
                <span className="min-w-0 flex-1 truncate">{p.n}</span>
                <span className="shrink-0 text-[11px] text-tinta-suave">{p.c}</span>
              </button>
            </li>
          ))}
          {resultados.length === 0 && (
            <li className="py-6 text-center text-[13px] text-tinta-suave">
              No encontré ningún país con eso
            </li>
          )}
        </ul>
      </BottomSheet>
    </>
  )
}
