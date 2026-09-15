import type { EstadoPais, Pais, Viaje } from '../types'
import {
  CONTINENTES,
  MI_PAIS,
  PAISES_SOBERANOS,
  distanciaDesdeMontevideo,
  pais,
} from './paises'

export type MotivoTipo = 'deseo' | 'continente' | 'cerca' | 'vecino' | 'temporada'

export interface Recomendacion {
  p: Pais
  puntos: number
  motivos: { tipo: MotivoTipo; texto: string }[]
  /** Motivo principal, el que se muestra grande en la tarjeta */
  titular: string
  km: number
  temporada: Temporada
}

export type Estacion = 'verano' | 'otoño' | 'invierno' | 'primavera'

export interface Temporada {
  /** Estación que está viviendo el destino ahora mismo */
  ahora: Estacion
  /** Estación que estás viviendo vos en Uruguay ahora */
  aca: Estacion
  /** Recomendación de cuándo ir */
  cuando: string
  /** ¿Es buen momento para ir ahora? */
  buenAhora: boolean
}

const ESTACIONES_SUR: Estacion[] = [
  'verano', 'verano', 'otoño', 'otoño', 'otoño', 'invierno',
  'invierno', 'invierno', 'primavera', 'primavera', 'primavera', 'verano',
]

const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre',
]

const opuesta = (e: Estacion): Estacion =>
  ({ verano: 'invierno', invierno: 'verano', otoño: 'primavera', primavera: 'otoño' } as const)[e]

/** Estación en un lugar, según el mes y de qué lado del Ecuador esté. */
export function estacionDe(lat: number, mes: number): Estacion {
  const sur = ESTACIONES_SUR[mes]
  if (lat < -10) return sur
  if (lat > 10) return opuesta(sur)
  return 'verano' // en el trópico es siempre verano, seamos honestos
}

/**
 * Cuándo conviene ir, pensado desde acá: en Uruguay las vacaciones grandes caen
 * en enero, así que avisamos si el destino está en temporada o al revés.
 */
export function temporadaDe(p: Pais, hoy = new Date()): Temporada {
  const mes = hoy.getMonth()
  const aca = estacionDe(-34.9, mes)
  const ahora = estacionDe(p.lat, mes)
  const tropical = Math.abs(p.lat) <= 23.5

  let cuando: string
  let buenAhora: boolean

  if (tropical) {
    cuando = 'Calor todo el año: se puede ir casi en cualquier momento'
    buenAhora = true
  } else if (ahora === 'verano' || ahora === 'primavera') {
    cuando = `Allá es ${ahora}: buen momento para ir ahora`
    buenAhora = true
  } else if (ahora === 'otoño') {
    cuando = 'Allá es otoño: menos gente y precios más amables'
    buenAhora = true
  } else {
    const mesVerano = p.lat < 0 ? 0 : 6 // enero o julio
    cuando =
      p.lat > 0
        ? `Allá es invierno. Si no vas por la nieve, mejor entre ${MESES_LARGOS[5]} y ${MESES_LARGOS[8]}`
        : `Allá es invierno. Apuntá a ${MESES_LARGOS[mesVerano]} si querés calor`
    buenAhora = false
  }

  return { ahora, aca, cuando, buenAhora }
}

/**
 * Arma las recomendaciones con TUS datos: qué continentes te faltan, qué países
 * tenés al lado de los que ya fuiste, tu lista de deseos y qué tan lejos queda
 * todo de Montevideo.
 */
export function recomendar(
  estados: Record<string, EstadoPais>,
  viajes: Viaje[],
  cantidad = 12,
  hoy = new Date(),
): Recomendacion[] {
  const visitados = new Set(
    Object.entries(estados)
      .filter(([, e]) => e === 'visitado')
      .map(([iso3]) => iso3),
  )
  visitados.add(MI_PAIS)

  const deseos = new Set(
    Object.entries(estados)
      .filter(([, e]) => e === 'deseo')
      .map(([iso3]) => iso3),
  )
  const pendientes = new Set(
    Object.entries(estados)
      .filter(([, e]) => e === 'pendiente')
      .map(([iso3]) => iso3),
  )

  // Continentes donde ya pisaste algo
  const continentesVisitados = new Set(
    [...visitados].map((i) => pais(i)?.c).filter(Boolean) as string[],
  )
  const continentesFaltantes = CONTINENTES.filter(
    (c) => c !== 'Antártida' && !continentesVisitados.has(c),
  )

  // Vecinos de los países que ya conocés
  const vecinos = new Map<string, string[]>()
  for (const iso3 of visitados) {
    for (const v of pais(iso3)?.b ?? []) {
      if (visitados.has(v)) continue
      vecinos.set(v, [...(vecinos.get(v) ?? []), iso3])
    }
  }

  // Qué te gusta: los continentes donde más viajás pesan un poco más
  const afinidad = new Map<string, number>()
  for (const v of viajes) {
    const c = pais(v.iso3)?.c
    if (c) afinidad.set(c, (afinidad.get(c) ?? 0) + Math.max(1, v.puntaje))
  }
  const afinidadMax = Math.max(1, ...afinidad.values())

  const candidatos = PAISES_SOBERANOS.filter(
    (p) => !visitados.has(p.i3) && p.i3 !== MI_PAIS && p.c !== 'Antártida',
  )

  const lista: Recomendacion[] = candidatos.map((p) => {
    const motivos: Recomendacion['motivos'] = []
    let puntos = 0
    const km = distanciaDesdeMontevideo(p)
    const temporada = temporadaDe(p, hoy)

    if (deseos.has(p.i3)) {
      puntos += 60
      motivos.push({ tipo: 'deseo', texto: 'Está en tu lista de sueños' })
    }
    if (pendientes.has(p.i3)) {
      puntos += 45
      motivos.push({ tipo: 'deseo', texto: 'Lo tenés marcado como pendiente' })
    }
    if (continentesFaltantes.includes(p.c as (typeof CONTINENTES)[number])) {
      puntos += 34
      motivos.push({ tipo: 'continente', texto: `Te falta ${p.c} entero` })
    }
    const limitrofes = vecinos.get(p.i3)
    if (limitrofes?.length) {
      puntos += 26
      const nombres = limitrofes.slice(0, 2).map((i) => pais(i)?.n ?? i)
      motivos.push({
        tipo: 'vecino',
        texto: `Está pegado a ${nombres.join(' y ')}, que ya conocés`,
      })
    }

    // Cerca de Montevideo: hasta 30 puntos, se va apagando con la distancia
    const cercania = Math.max(0, 30 - km / 400)
    puntos += cercania
    if (km <= 4000) {
      motivos.push({
        tipo: 'cerca',
        texto: `A ${km.toLocaleString('es-UY')} km de Montevideo, sale más barato`,
      })
    }

    // Afinidad con los continentes donde más viajás
    puntos += ((afinidad.get(p.c) ?? 0) / afinidadMax) * 12

    if (temporada.buenAhora) {
      puntos += 14
      motivos.push({ tipo: 'temporada', texto: temporada.cuando })
    } else {
      motivos.push({ tipo: 'temporada', texto: temporada.cuando })
    }

    // Un empujoncito a los países grandes y conocidos, para no recomendar
    // siempre micro-estados que nadie tiene en el radar.
    if (p.b.length >= 3) puntos += 4

    const titular = motivos[0]?.texto ?? `Un lugar nuevo en ${p.c}`
    return { p, puntos, motivos, titular, km, temporada }
  })

  return lista
    .sort((a, b) => b.puntos - a.puntos || a.km - b.km)
    .slice(0, cantidad)
}

export const FILTROS_MOTIVO: { clave: MotivoTipo | 'todas'; texto: string }[] = [
  { clave: 'todas', texto: 'Para vos' },
  { clave: 'deseo', texto: 'Tus deseos' },
  { clave: 'continente', texto: 'Continentes que faltan' },
  { clave: 'cerca', texto: 'Cerca de Montevideo' },
  { clave: 'vecino', texto: 'Al lado de donde fuiste' },
  { clave: 'temporada', texto: 'Buen momento ahora' },
]
