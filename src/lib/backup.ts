import { db, borrarTodo } from '../db/db'
import type { Backup, Viaje } from '../types'

const VERSION = 1

const blobADataUrl = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const lector = new FileReader()
    lector.onload = () => res(String(lector.result))
    lector.onerror = () => rej(new Error('No pude leer una foto'))
    lector.readAsDataURL(blob)
  })

async function dataUrlABlob(dataUrl: string): Promise<Blob> {
  const r = await fetch(dataUrl)
  return await r.blob()
}

/** Todo lo tuyo en un solo archivo, fotos incluidas. */
export async function armarBackup(): Promise<Backup> {
  const [marcas, viajes, etiquetas, fotos] = await Promise.all([
    db.marcas.toArray(),
    db.viajes.toArray(),
    db.etiquetas.toArray(),
    db.fotos.toArray(),
  ])
  return {
    app: 'mi-mapa-de-viajes',
    version: VERSION,
    exportado: new Date().toISOString(),
    marcas,
    viajes,
    etiquetas,
    fotos: await Promise.all(
      fotos.map(async (f) => ({
        id: f.id!,
        viajeId: f.viajeId,
        ancho: f.ancho,
        alto: f.alto,
        creado: f.creado,
        dataUrl: await blobADataUrl(f.blob),
      })),
    ),
  }
}

export async function descargarBackup() {
  const datos = await armarBackup()
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const fecha = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `mis-viajes-${fecha}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return datos
}

export interface ResultadoImportacion {
  viajes: number
  marcas: number
  fotos: number
}

/**
 * Restaura un backup. `reemplazar` borra lo que haya antes; si no, suma
 * los viajes nuevos a lo que ya tenés.
 */
export async function importarBackup(
  texto: string,
  reemplazar: boolean,
): Promise<ResultadoImportacion> {
  let datos: Backup
  try {
    datos = JSON.parse(texto)
  } catch {
    throw new Error('El archivo no es un JSON válido')
  }
  if (datos?.app !== 'mi-mapa-de-viajes' || !Array.isArray(datos.viajes)) {
    throw new Error('Este archivo no es un backup de Mi mapa de viajes')
  }
  if (datos.version > VERSION) {
    throw new Error('El backup viene de una versión más nueva de la app')
  }

  if (reemplazar) await borrarTodo()

  // Las fotos cambian de id al importarse, así que traducimos las referencias.
  const traduccion = new Map<number, number>()
  for (const f of datos.fotos ?? []) {
    try {
      const blob = await dataUrlABlob(f.dataUrl)
      const nuevo = (await db.fotos.add({
        blob,
        ancho: f.ancho,
        alto: f.alto,
        creado: f.creado,
      })) as number
      traduccion.set(f.id, nuevo)
    } catch {
      /* una foto rota no debería tirar abajo todo el backup */
    }
  }

  let viajesImportados = 0
  for (const v of datos.viajes) {
    const { id: _viejo, ...resto } = v as Viaje & { id?: number }
    const fotos = (resto.fotos ?? [])
      .map((idViejo) => traduccion.get(idViejo))
      .filter((x): x is number => typeof x === 'number')
    const nuevoId = (await db.viajes.add({ ...resto, fotos })) as number
    if (fotos.length) await db.fotos.where('id').anyOf(fotos).modify({ viajeId: nuevoId })
    viajesImportados++
  }

  if (Array.isArray(datos.marcas) && datos.marcas.length) await db.marcas.bulkPut(datos.marcas)

  for (const e of datos.etiquetas ?? []) {
    const existente = await db.etiquetas.get({ nombre: e.nombre })
    if (existente?.id) await db.etiquetas.update(existente.id, { usos: existente.usos + e.usos })
    else await db.etiquetas.add({ nombre: e.nombre, usos: e.usos })
  }

  return {
    viajes: viajesImportados,
    marcas: datos.marcas?.length ?? 0,
    fotos: traduccion.size,
  }
}
