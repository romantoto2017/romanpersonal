import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { EstadoPais, Etiqueta, Viaje } from '../types'

/** Mapa iso3 → estado, listo para pintar el mapa. */
export function useEstados(): Record<string, EstadoPais> {
  const marcas = useLiveQuery(() => db.marcas.toArray(), [], [])
  const mapa: Record<string, EstadoPais> = {}
  for (const m of marcas) mapa[m.iso3] = m.estado
  return mapa
}

export function useViajes(): Viaje[] | undefined {
  return useLiveQuery(
    () => db.viajes.toArray().then((v) => v.sort(ordenarPorFecha)),
    [],
  )
}

export function useViaje(id?: number): Viaje | undefined | null {
  return useLiveQuery(async () => (id ? ((await db.viajes.get(id)) ?? null) : null), [id])
}

export function useEtiquetas(): Etiqueta[] {
  // 'usos' no está indexado (son cuatro etiquetas, no hace falta): ordenamos acá.
  return useLiveQuery(
    () => db.etiquetas.toArray().then((e) => e.sort((a, b) => b.usos - a.usos)),
    [],
    [],
  )
}

/** Más recientes primero. */
export const ordenarPorFecha = (a: Viaje, b: Viaje) =>
  (b.desde || '').localeCompare(a.desde || '') || (b.creado ?? 0) - (a.creado ?? 0)

export const anioDe = (viaje: Viaje) => Number((viaje.desde || '').slice(0, 4)) || 0

/** Días del viaje, contando el día de ida y el de vuelta. */
export function diasDe(viaje: Viaje): number {
  if (!viaje.desde || !viaje.hasta) return 0
  const a = Date.parse(`${viaje.desde}T00:00:00`)
  const b = Date.parse(`${viaje.hasta}T00:00:00`)
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0
  return Math.round((b - a) / 86_400_000) + 1
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre',
]

export function fechaCorta(iso: string): string {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  const mes = MESES[Number(m) - 1]
  return mes ? `${Number(d)} de ${mes} ${a}` : iso
}

export function rangoFechas(viaje: Viaje): string {
  if (!viaje.desde) return 'Sin fecha'
  if (!viaje.hasta || viaje.hasta === viaje.desde) return fechaCorta(viaje.desde)
  const [a1, m1] = viaje.desde.split('-')
  const [a2, m2] = viaje.hasta.split('-')
  if (a1 === a2 && m1 === m2) {
    const d1 = Number(viaje.desde.slice(8))
    const d2 = Number(viaje.hasta.slice(8))
    return `${d1}–${d2} de ${MESES[Number(m1) - 1]} ${a1}`
  }
  return `${fechaCorta(viaje.desde)} → ${fechaCorta(viaje.hasta)}`
}

/** Registra etiquetas nuevas y lleva la cuenta de uso, para sugerirlas después. */
export async function registrarEtiquetas(nombres: string[]) {
  for (const nombre of nombres) {
    const limpio = nombre.trim()
    if (!limpio) continue
    const existente = await db.etiquetas.get({ nombre: limpio })
    if (existente?.id) await db.etiquetas.update(existente.id, { usos: existente.usos + 1 })
    else await db.etiquetas.add({ nombre: limpio, usos: 1 })
  }
}
