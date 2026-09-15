import { db } from '../db/db'

const LADO_MAX = 1280
const CALIDAD = 0.72

/** Achica y comprime la foto antes de guardarla: el celular no es un disco infinito. */
export async function comprimirImagen(archivo: File): Promise<{
  blob: Blob
  ancho: number
  alto: number
}> {
  const bitmap = await crearBitmap(archivo)
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)

  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, ancho, alto)
  if ('close' in bitmap) (bitmap as ImageBitmap).close()

  const blob = await new Promise<Blob | null>((res) =>
    lienzo.toBlob(res, 'image/jpeg', CALIDAD),
  )
  if (!blob) throw new Error('No se pudo comprimir la imagen')
  return { blob, ancho, alto }
}

async function crearBitmap(archivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(archivo)
    } catch {
      /* algunos Safari viejos se quejan: seguimos con <img> */
    }
  }
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = () => rej(new Error('Imagen inválida'))
      img.src = url
    })
    return img
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export async function guardarFoto(archivo: File, viajeId?: number): Promise<number> {
  const { blob, ancho, alto } = await comprimirImagen(archivo)
  return (await db.fotos.add({ viajeId, blob, ancho, alto, creado: Date.now() })) as number
}

export async function borrarFotos(ids: number[]) {
  if (ids.length) await db.fotos.bulkDelete(ids)
}
