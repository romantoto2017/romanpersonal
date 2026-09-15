import { db, guardarAjuste, leerAjuste } from '../db/db'
import { registrarEtiquetas } from './datos'
import type { Viaje } from '../types'

const CLAVE = 'ejemplo-cargado'

const VIAJES: Omit<Viaje, 'id' | 'creado'>[] = [
  {
    iso3: 'ARG',
    ciudades: ['Buenos Aires', 'Bariloche'],
    desde: '2023-07-08',
    hasta: '2023-07-18',
    conQuien: 'Con amigos',
    puntaje: 5,
    notas: 'Diez días a puro asado y trekking. El Cerro Catedral con nieve fue una locura.',
    etiquetas: ['nieve', 'con amigos', 'montaña'],
    mejor: ['La vista desde el Cerro Campanario', 'Chocolate caliente en Rapa Nui'],
    peor: ['El micro de 20 horas'],
    fotos: [],
  },
  {
    iso3: 'BRA',
    ciudades: ['Río de Janeiro', 'Búzios'],
    desde: '2024-01-12',
    hasta: '2024-01-22',
    conQuien: 'En pareja',
    puntaje: 5,
    notas: 'Calor bestial. Açaí todos los días. Me quemé la espalda el primer día, clásico.',
    etiquetas: ['playa', 'verano'],
    mejor: ['Amanecer en Arpoador', 'Feijoada en Lapa'],
    peor: ['Me afanaron los lentes en Copacabana'],
    fotos: [],
  },
  {
    iso3: 'CHL',
    ciudades: ['Santiago', 'Valparaíso'],
    desde: '2022-10-05',
    hasta: '2022-10-11',
    conQuien: 'Solo',
    puntaje: 4,
    notas: 'Valpo es un murales por todos lados. Los ascensores viejos valen cada peso.',
    etiquetas: ['ciudad', 'solo'],
    mejor: ['Los cerros de Valparaíso'],
    peor: ['El smog de Santiago'],
    fotos: [],
  },
  {
    iso3: 'ESP',
    ciudades: ['Madrid', 'Barcelona', 'Sevilla'],
    desde: '2019-09-14',
    hasta: '2019-10-02',
    conQuien: 'Con la familia',
    puntaje: 5,
    notas: 'Primer viaje a Europa. Caminé como 15 km por día y no me arrepiento de nada.',
    etiquetas: ['ciudad', 'primera vez', 'con familia'],
    mejor: ['La Sagrada Familia de tardecita', 'Jamón en el Mercado de San Miguel'],
    peor: ['El calor de Sevilla en setiembre'],
    fotos: [],
  },
  {
    iso3: 'PER',
    ciudades: ['Cusco', 'Lima', 'Aguas Calientes'],
    desde: '2018-05-20',
    hasta: '2018-05-30',
    conQuien: 'Con amigos',
    puntaje: 5,
    notas: 'Machu Picchu con neblina y después se abrió el cielo. El soroche me tuvo dos días a mate de coca.',
    etiquetas: ['montaña', 'con amigos', 'me perdí'],
    mejor: ['Machu Picchu', 'Ceviche en Lima'],
    peor: ['El apunamiento en Cusco'],
    fotos: [],
  },
  {
    iso3: 'ARG',
    ciudades: ['Mendoza'],
    desde: '2025-03-14',
    hasta: '2025-03-19',
    conQuien: 'En pareja',
    puntaje: 4,
    notas: 'Bodegas, bici y malbec. Volvimos con seis botellas y cero espacio en la valija.',
    etiquetas: ['vino', 'montaña'],
    mejor: ['Bici entre viñedos en Maipú'],
    peor: ['Pinchamos una rueda a 8 km del hotel'],
    fotos: [],
  },
]

const MARCAS: Record<string, 'visitado' | 'pendiente' | 'deseo'> = {
  URY: 'visitado',
  ARG: 'visitado',
  BRA: 'visitado',
  CHL: 'visitado',
  PER: 'visitado',
  ESP: 'visitado',
  PRY: 'visitado',
  ITA: 'pendiente',
  PRT: 'pendiente',
  JPN: 'deseo',
  ISL: 'deseo',
  NZL: 'deseo',
  MEX: 'deseo',
}

export async function cargarEjemplo() {
  const ahora = Date.now()
  await db.transaction('rw', db.marcas, db.viajes, db.etiquetas, async () => {
    await db.marcas.bulkPut(
      Object.entries(MARCAS).map(([iso3, estado]) => ({ iso3, estado, actualizado: ahora })),
    )
    await db.viajes.bulkAdd(
      VIAJES.map((v, i) => ({ ...v, creado: ahora + i })) as Viaje[],
    )
  })
  await registrarEtiquetas(VIAJES.flatMap((v) => v.etiquetas))
  await guardarAjuste(CLAVE, true)
}

/** La primera vez que abrís la app te dejamos datos de ejemplo para mirar. */
export async function sembrarSiHaceFalta() {
  if (await leerAjuste(CLAVE, false)) return
  const hayAlgo = (await db.viajes.count()) > 0 || (await db.marcas.count()) > 0
  if (hayAlgo) {
    await guardarAjuste(CLAVE, true)
    return
  }
  await cargarEjemplo()
}
