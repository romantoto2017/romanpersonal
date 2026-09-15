import datos from '../data/countries.json'
import type { EstadoPais, Pais } from '../types'

export const PAISES = datos as Pais[]

/** Mi país. Uruguay nomás. */
export const MI_PAIS = 'URY'

/** Los 195 reconocidos: 193 miembros de la ONU + Vaticano y Palestina. */
export const PAISES_SOBERANOS = PAISES.filter((p) => p.un)
export const TOTAL_MUNDO = PAISES_SOBERANOS.length // 195

export const CONTINENTES = ['América', 'Europa', 'Asia', 'África', 'Oceanía', 'Antártida'] as const

const porIso3 = new Map(PAISES.map((p) => [p.i3, p]))
const porNum = new Map(PAISES.map((p) => [p.id, p]))

/** El TopoJSON trae 3 territorios con id -99; los enganchamos por nombre. */
const POR_NOMBRE_TOPO: Record<string, string> = {
  Kosovo: 'XKX',
  'N. Cyprus': 'CYP',
  Somaliland: 'SOM',
}

export const pais = (iso3: string) => porIso3.get(iso3)
export const paisPorNumero = (n: string | number) => porNum.get(String(n))

export function paisDesdeGeo(geo: { id?: string | number; properties?: { name?: string } }) {
  if (geo.id != null) {
    const p = porNum.get(String(geo.id))
    if (p) return p
  }
  const alias = geo.properties?.name ? POR_NOMBRE_TOPO[geo.properties.name] : undefined
  return alias ? porIso3.get(alias) : undefined
}

export const nombrePais = (iso3: string) => porIso3.get(iso3)?.n ?? iso3
export const banderaPais = (iso3: string) => porIso3.get(iso3)?.flag ?? '🏳️'

/** Saca tildes y pasa a minúsculas, para que "peru" encuentre "Perú". */
export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

export function buscarPaises(consulta: string, limite = 30): Pais[] {
  const q = normalizar(consulta)
  if (!q) return PAISES_SOBERANOS.slice(0, limite)
  const empieza: Pais[] = []
  const contiene: Pais[] = []
  for (const p of PAISES) {
    const n = normalizar(p.n)
    if (n.startsWith(q)) empieza.push(p)
    else if (n.includes(q) || normalizar(p.o).includes(q) || p.i3.toLowerCase() === q)
      contiene.push(p)
    if (empieza.length >= limite) break
  }
  return [...empieza, ...contiene].slice(0, limite)
}

export const ESTADOS: { clave: EstadoPais; nombre: string; color: string; ayuda: string }[] = [
  { clave: 'no', nombre: 'No visitado', color: '#E8DFD1', ayuda: 'Todavía no fuiste' },
  { clave: 'visitado', nombre: 'Visitado', color: '#C8553D', ayuda: 'Ya lo pisaste' },
  { clave: 'pendiente', nombre: 'Pendiente', color: '#D9A441', ayuda: 'Viaje planeado' },
  { clave: 'deseo', nombre: 'Deseo', color: '#7A8B6F', ayuda: 'Lista de sueños' },
]

export const COLOR_ESTADO: Record<EstadoPais, string> = {
  no: '#E8DFD1',
  visitado: '#C8553D',
  pendiente: '#D9A441',
  deseo: '#7A8B6F',
}

/** Distancia en km entre dos puntos (haversine). */
export function distanciaKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLng = rad(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

export const MONTEVIDEO = { lat: -34.9011, lng: -56.1645 }

export const distanciaDesdeMontevideo = (p: Pais) =>
  distanciaKm(MONTEVIDEO.lat, MONTEVIDEO.lng, p.lat, p.lng)
