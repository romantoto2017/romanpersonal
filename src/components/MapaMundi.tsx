import { memo, useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import topo from '../data/world-110m.json'
import { COLOR_ESTADO, MI_PAIS, paisDesdeGeo } from '../lib/paises'
import type { EstadoPais } from '../types'
import { IconCasa, IconMas, IconMenos } from './Iconos'

type Props = {
  estados: Record<string, EstadoPais>
  onTocarPais: (iso3: string) => void
  /** País a centrar (por ej. al elegirlo desde el buscador) */
  foco?: { lat: number; lng: number; iso3: string } | null
  resaltado?: string | null
}

const INICIO = { coordinates: [-25, 5] as [number, number], zoom: 1.2 }

function MapaMundi({ estados, onTocarPais, foco, resaltado }: Props) {
  const [vista, setVista] = useState(INICIO)

  // Cuando llega un foco nuevo, centramos el mapa ahí con un poco de zoom.
  const claveFoco = foco ? `${foco.iso3}:${foco.lat}:${foco.lng}` : ''
  useEffect(() => {
    if (!claveFoco) return
    const [, lat, lng] = claveFoco.split(':')
    setVista({ coordinates: [Number(lng), Number(lat)], zoom: 3.2 })
  }, [claveFoco])

  const zoom = (factor: number) =>
    setVista((v) => ({ ...v, zoom: Math.min(8, Math.max(1, v.zoom * factor)) }))

  return (
    <div className="relative">
      <div className="tarjeta overflow-hidden bg-[#FBF7F0]">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 165 }}
          width={800}
          height={500}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            {/* Rayado diagonal para "mi país" */}
            <pattern
              id="rayado-casa"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill={COLOR_ESTADO.visitado} />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#FBF7F0" strokeWidth="2.2" />
            </pattern>
          </defs>
          <ZoomableGroup
            center={vista.coordinates}
            zoom={vista.zoom}
            minZoom={1}
            maxZoom={8}
            onMoveEnd={({ coordinates, zoom }) =>
              setVista({ coordinates: coordinates as [number, number], zoom })
            }
          >
            <Geographies geography={topo}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const p = paisDesdeGeo(geo)
                  const iso3 = p?.i3
                  const estado: EstadoPais = (iso3 && estados[iso3]) || 'no'
                  const esCasa = iso3 === MI_PAIS
                  const esResaltado = !!iso3 && iso3 === resaltado
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => iso3 && onTocarPais(iso3)}
                      tabIndex={-1}
                      style={{
                        default: {
                          fill: esCasa ? 'url(#rayado-casa)' : COLOR_ESTADO[estado],
                          stroke: esResaltado ? '#2B2622' : '#2B2622',
                          strokeWidth: esResaltado ? 1.1 : esCasa ? 0.75 : 0.35,
                          strokeOpacity: esResaltado ? 1 : 0.55,
                          outline: 'none',
                          transition: 'fill .25s ease',
                        },
                        hover: {
                          fill: estado === 'no' ? '#DCD0BC' : COLOR_ESTADO[estado],
                          stroke: '#2B2622',
                          strokeWidth: 0.7,
                          outline: 'none',
                          cursor: iso3 ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: COLOR_ESTADO[estado],
                          stroke: '#2B2622',
                          strokeWidth: 1,
                          outline: 'none',
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        {[
          { icono: IconMas, accion: () => zoom(1.5), etiqueta: 'Acercar' },
          { icono: IconMenos, accion: () => zoom(1 / 1.5), etiqueta: 'Alejar' },
          { icono: IconCasa, accion: () => setVista(INICIO), etiqueta: 'Volver al inicio' },
        ].map(({ icono: Icono, accion, etiqueta }) => (
          <button
            key={etiqueta}
            onClick={accion}
            aria-label={etiqueta}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-borde/25
                       bg-arena/95 text-tinta shadow-papel transition active:scale-90"
          >
            <Icono className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(MapaMundi)
