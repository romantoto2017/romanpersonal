import Dexie, { type Table } from 'dexie'
import type { Ajuste, Etiqueta, Foto, MarcaPais, Viaje } from '../types'

export class MapaDB extends Dexie {
  marcas!: Table<MarcaPais, string>
  viajes!: Table<Viaje, number>
  fotos!: Table<Foto, number>
  etiquetas!: Table<Etiqueta, number>
  ajustes!: Table<Ajuste, string>

  constructor() {
    super('mi-mapa-de-viajes')
    this.version(1).stores({
      marcas: '&iso3, estado, actualizado',
      viajes: '++id, iso3, desde, creado',
      fotos: '++id, viajeId',
      etiquetas: '++id, &nombre',
      ajustes: '&clave',
    })
  }
}

export const db = new MapaDB()

export async function leerAjuste<T>(clave: string, porDefecto: T): Promise<T> {
  const fila = await db.ajustes.get(clave)
  return fila ? (fila.valor as T) : porDefecto
}

export async function guardarAjuste(clave: string, valor: unknown) {
  await db.ajustes.put({ clave, valor })
}

/** Marca (o desmarca) un país. Guardar 'no' borra la fila para no dejar basura. */
export async function marcarPais(iso3: string, estado: import('../types').EstadoPais) {
  if (estado === 'no') await db.marcas.delete(iso3)
  else await db.marcas.put({ iso3, estado, actualizado: Date.now() })
}

/** Borra todo el contenido del usuario, pero deja los ajustes. */
export async function borrarTodo() {
  await db.transaction('rw', db.marcas, db.viajes, db.fotos, db.etiquetas, async () => {
    await Promise.all([db.marcas.clear(), db.viajes.clear(), db.fotos.clear(), db.etiquetas.clear()])
  })
}
