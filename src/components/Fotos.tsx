import { useEffect, useState, type ChangeEvent } from 'react'
import { db } from '../db/db'
import { guardarFoto } from '../lib/fotos'
import { IconCerrar, IconMas } from './Iconos'

export default function Fotos({
  ids,
  onCambiar,
}: {
  ids: number[]
  onCambiar: (ids: number[]) => void
}) {
  const [urls, setUrls] = useState<Record<number, string>>({})
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    const creadas: string[] = []
    ;(async () => {
      const fotos = await db.fotos.bulkGet(ids)
      if (!vivo) return
      const mapa: Record<number, string> = {}
      fotos.forEach((f, i) => {
        if (!f) return
        const url = URL.createObjectURL(f.blob)
        creadas.push(url)
        mapa[ids[i]] = url
      })
      setUrls(mapa)
    })()
    return () => {
      vivo = false
      creadas.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [ids])

  const subir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivos = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!archivos.length) return
    setCargando(true)
    setError('')
    try {
      const nuevos: number[] = []
      for (const a of archivos.slice(0, 8)) nuevos.push(await guardarFoto(a))
      onCambiar([...ids, ...nuevos])
    } catch {
      setError('No pude guardar alguna foto. Probá con otra.')
    } finally {
      setCargando(false)
    }
  }

  const sacar = async (id: number) => {
    onCambiar(ids.filter((x) => x !== id))
    await db.fotos.delete(id)
  }

  return (
    <div>
      <div className="scroll-x -mx-5 px-5">
        <ul className="flex gap-2">
          {ids.map((id) => (
            <li key={id} className="relative shrink-0">
              <img
                src={urls[id]}
                alt=""
                className="h-24 w-24 rounded-lg border border-borde/25 object-cover"
              />
              <button
                type="button"
                onClick={() => sacar(id)}
                aria-label="Borrar foto"
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center
                           rounded-full border border-borde/30 bg-papel text-tinta shadow"
              >
                <IconCerrar className="h-3 w-3" />
              </button>
            </li>
          ))}
          <li className="shrink-0">
            <label
              className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1
                         rounded-lg border border-dashed border-borde/35 bg-arena text-tinta-suave"
            >
              <IconMas className="h-5 w-5" />
              <span className="text-[11px]">{cargando ? 'Guardando…' : 'Foto'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={subir}
                disabled={cargando}
              />
            </label>
          </li>
        </ul>
      </div>
      <p className="mt-2 text-[11.5px] text-tinta-suave">
        {error || 'Se guardan comprimidas en tu celular. No suben a ningún lado.'}
      </p>
    </div>
  )
}
