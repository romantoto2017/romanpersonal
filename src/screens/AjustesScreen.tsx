import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconVolver } from '../components/Iconos'
import { borrarTodo, db } from '../db/db'
import { descargarBackup, importarBackup } from '../lib/backup'
import { cargarEjemplo } from '../lib/ejemplo'
import { useLiveQuery } from 'dexie-react-hooks'

type Aviso = { tono: 'ok' | 'mal'; texto: string } | null

export default function AjustesScreen() {
  const navegar = useNavigate()
  const [aviso, setAviso] = useState<Aviso>(null)
  const [trabajando, setTrabajando] = useState('')
  const [confirmar, setConfirmar] = useState<null | 'borrar' | 'reemplazar'>(null)
  const [archivoPendiente, setArchivoPendiente] = useState<string | null>(null)

  const conteos = useLiveQuery(
    async () => ({
      viajes: await db.viajes.count(),
      marcas: await db.marcas.count(),
      fotos: await db.fotos.count(),
    }),
    [],
  )

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(t)
  }, [aviso])

  const exportar = async () => {
    setTrabajando('exportar')
    try {
      const d = await descargarBackup()
      setAviso({
        tono: 'ok',
        texto: `Listo: ${d.viajes.length} viajes y ${d.fotos.length} fotos en el archivo.`,
      })
    } catch {
      setAviso({ tono: 'mal', texto: 'No pude armar el backup.' })
    } finally {
      setTrabajando('')
    }
  }

  const elegirArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    const texto = await archivo.text()
    setArchivoPendiente(texto)
    setConfirmar('reemplazar')
  }

  const importar = async (reemplazar: boolean) => {
    if (!archivoPendiente) return
    setConfirmar(null)
    setTrabajando('importar')
    try {
      const r = await importarBackup(archivoPendiente, reemplazar)
      setAviso({
        tono: 'ok',
        texto: `Importé ${r.viajes} viajes, ${r.marcas} países y ${r.fotos} fotos.`,
      })
    } catch (err) {
      setAviso({ tono: 'mal', texto: (err as Error).message })
    } finally {
      setArchivoPendiente(null)
      setTrabajando('')
    }
  }

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center gap-2 border-b border-borde/10 bg-papel/95
                   px-3 pb-3 backdrop-blur"
        style={{ paddingTop: 'calc(12px + var(--safe-top))' }}
      >
        <button
          onClick={() => navegar(-1)}
          aria-label="Volver"
          className="tap flex items-center justify-center text-tinta"
        >
          <IconVolver className="h-5 w-5" />
        </button>
        <h1 className="titulo flex-1 text-[18px]">Ajustes</h1>
      </header>

      <div className="space-y-5 px-5 pt-5">
        {aviso && (
          <p
            className={`rounded-lg border px-3 py-2.5 text-[13px] ${
              aviso.tono === 'ok'
                ? 'border-oliva/45 bg-oliva/10 text-oliva'
                : 'border-terracota/45 bg-terracota/10 text-terracota'
            }`}
          >
            {aviso.texto}
          </p>
        )}

        <section className="tarjeta px-4 py-4">
          <h2 className="titulo text-[17px]">Lo que tenés guardado</h2>
          <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { n: conteos?.viajes ?? 0, t: 'viajes' },
              { n: conteos?.marcas ?? 0, t: 'países' },
              { n: conteos?.fotos ?? 0, t: 'fotos' },
            ].map((d) => (
              <li key={d.t} className="rounded-lg border border-borde/15 px-2 py-2.5">
                <p className="titulo text-[20px] leading-none">{d.n}</p>
                <p className="etiqueta mt-1">{d.t}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-relaxed text-tinta-suave">
            Todo vive en tu celular (IndexedDB). No hay cuenta, ni servidor, ni nadie
            mirando. Si borrás los datos del navegador, se van con ellos: por eso
            conviene hacerse un backup cada tanto.
          </p>
        </section>

        <section className="tarjeta px-4 py-4">
          <h2 className="titulo text-[17px]">Backup</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-tinta-suave">
            Bajate un archivo JSON con todo (viajes, países y fotos) y guardalo donde
            quieras. Cuando cambies de celular, lo importás y seguís donde estabas.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={exportar} disabled={!!trabajando} className="boton-lleno tap">
              {trabajando === 'exportar' ? 'Armando…' : 'Exportar'}
            </button>
            <label className="boton-borde tap cursor-pointer">
              {trabajando === 'importar' ? 'Importando…' : 'Importar'}
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={elegirArchivo}
                disabled={!!trabajando}
              />
            </label>
          </div>
        </section>

        <section className="tarjeta px-4 py-4">
          <h2 className="titulo text-[17px]">Datos de ejemplo</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-tinta-suave">
            La app arranca con unos viajes de muestra para que veas cómo queda.
            Borralos cuando quieras arrancar en limpio.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                await cargarEjemplo()
                setAviso({ tono: 'ok', texto: 'Listo, volvieron los viajes de ejemplo.' })
              }}
              className="boton-borde tap"
            >
              Volver a cargar
            </button>
            <button onClick={() => setConfirmar('borrar')} className="boton-borde tap text-terracota">
              Borrar todo
            </button>
          </div>
        </section>

        <section className="tarjeta px-4 py-4">
          <h2 className="titulo text-[17px]">De dónde salen los datos</h2>
          <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-tinta-suave">
            <li>· Clima y pronóstico: Open-Meteo</li>
            <li>· Cotizaciones contra el peso: open.er-api.com (respaldo: currency-api)</li>
            <li>· Ficha de países: REST Countries</li>
            <li>· Mapa: Natural Earth vía world-atlas</li>
          </ul>
          <p className="mt-3 text-[11.5px] text-tinta-suave">
            Todas gratuitas y sin clave. Sin internet la app igual funciona: te muestra
            lo último que guardó.
          </p>
        </section>
      </div>

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          <button
            aria-label="Cancelar"
            onClick={() => {
              setConfirmar(null)
              setArchivoPendiente(null)
            }}
            className="absolute inset-0 animate-fade-in bg-tinta/35"
          />
          <div className="tarjeta relative w-full max-w-xs animate-rise bg-papel p-5 text-center">
            {confirmar === 'borrar' ? (
              <>
                <p className="titulo text-lg">¿Borrás todo?</p>
                <p className="mt-1.5 text-[13px] text-tinta-suave">
                  Se van los viajes, los países marcados y las fotos. Si no tenés backup,
                  no hay vuelta atrás.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => setConfirmar(null)} className="boton-borde tap">
                    No
                  </button>
                  <button
                    onClick={async () => {
                      await borrarTodo()
                      setConfirmar(null)
                      setAviso({ tono: 'ok', texto: 'Listo, quedó todo en blanco.' })
                    }}
                    className="boton-lleno tap"
                  >
                    Sí, borrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="titulo text-lg">¿Cómo lo importo?</p>
                <p className="mt-1.5 text-[13px] text-tinta-suave">
                  Puedo reemplazar todo lo que tenés, o sumar los viajes del archivo a
                  los actuales.
                </p>
                <div className="mt-4 grid gap-2">
                  <button onClick={() => importar(true)} className="boton-lleno tap">
                    Reemplazar todo
                  </button>
                  <button onClick={() => importar(false)} className="boton-borde tap">
                    Sumar a lo que tengo
                  </button>
                  <button
                    onClick={() => {
                      setConfirmar(null)
                      setArchivoPendiente(null)
                    }}
                    className="tap text-[13px] text-tinta-suave"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
