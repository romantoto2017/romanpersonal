import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Estrellas from '../components/Estrellas'
import Fotos from '../components/Fotos'
import ListaChips from '../components/ListaChips'
import SelectorPais from '../components/SelectorPais'
import { IconTacho, IconVolver } from '../components/Iconos'
import { db, marcarPais } from '../db/db'
import { registrarEtiquetas, useEtiquetas, useViaje } from '../lib/datos'
import { borrarFotos } from '../lib/fotos'
import { pais } from '../lib/paises'
import type { Viaje } from '../types'

const VACIO: Viaje = {
  iso3: '',
  ciudades: [],
  desde: '',
  hasta: '',
  conQuien: '',
  puntaje: 0,
  notas: '',
  etiquetas: [],
  mejor: [],
  peor: [],
  fotos: [],
  creado: 0,
}

const COMPANIA = ['Solo', 'En pareja', 'Con amigos', 'Con la familia', 'Por trabajo']

export default function ViajeFormScreen() {
  const navegar = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const idNum = id ? Number(id) : undefined
  const esNuevo = !idNum

  const guardado = useViaje(idNum)
  const etiquetasConocidas = useEtiquetas()
  const [v, setV] = useState<Viaje>(() => ({
    ...VACIO,
    iso3: params.get('pais') ?? '',
  }))
  const [listo, setListo] = useState(esNuevo)
  const [error, setError] = useState('')
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  useEffect(() => {
    if (esNuevo) return
    if (guardado === undefined) return
    if (guardado === null) {
      navegar('/viajes', { replace: true })
      return
    }
    setV(guardado)
    setListo(true)
  }, [guardado, esNuevo, navegar])

  const set = <K extends keyof Viaje>(k: K, valor: Viaje[K]) =>
    setV((prev) => ({ ...prev, [k]: valor }))

  const p = v.iso3 ? pais(v.iso3) : undefined

  const sugerencias = useMemo(
    () => etiquetasConocidas.map((e) => e.nombre),
    [etiquetasConocidas],
  )

  const guardar = async () => {
    if (!v.iso3) {
      setError('Elegí a qué país fuiste')
      return
    }
    if (v.desde && v.hasta && v.hasta < v.desde) {
      setError('La vuelta no puede ser antes que la ida')
      return
    }
    setError('')
    const datos: Viaje = { ...v, creado: v.creado || Date.now() }
    if (esNuevo) {
      const nuevoId = (await db.viajes.add(datos)) as number
      if (datos.fotos.length) {
        await db.fotos.where('id').anyOf(datos.fotos).modify({ viajeId: nuevoId })
      }
    } else {
      await db.viajes.put({ ...datos, id: idNum })
      if (datos.fotos.length) {
        await db.fotos.where('id').anyOf(datos.fotos).modify({ viajeId: idNum })
      }
    }
    await registrarEtiquetas(datos.etiquetas)
    // Si cargaste un viaje, el país queda visitado. Obvio.
    const marca = await db.marcas.get(datos.iso3)
    if (marca?.estado !== 'visitado') await marcarPais(datos.iso3, 'visitado')
    navegar('/viajes', { replace: true })
  }

  const borrar = async () => {
    if (!idNum) return
    await borrarFotos(v.fotos)
    await db.viajes.delete(idNum)
    navegar('/viajes', { replace: true })
  }

  if (!listo) {
    return <p className="px-5 py-10 text-center text-[13px] text-tinta-suave">Cargando…</p>
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
        <h1 className="titulo flex-1 truncate text-[18px]">
          {esNuevo ? 'Nuevo viaje' : 'Editar viaje'}
        </h1>
        {!esNuevo && (
          <button
            onClick={() => setConfirmarBorrado(true)}
            aria-label="Borrar viaje"
            className="tap flex items-center justify-center text-tinta-suave"
          >
            <IconTacho className="h-5 w-5" />
          </button>
        )}
        <button onClick={guardar} className="boton-lleno px-4 py-2 text-[13px]">
          Guardar
        </button>
      </header>

      <div className="space-y-5 px-5 pt-5">
        <Campo etiqueta="País">
          <SelectorPais valor={v.iso3} onCambiar={(iso3) => set('iso3', iso3)} />
          {p && (
            <p className="mt-1.5 text-[11.5px] text-tinta-suave">
              {p.c}
              {p.cap ? ` · capital ${p.cap}` : ''}
              {p.cur ? ` · ${p.cur}` : ''}
            </p>
          )}
        </Campo>

        <Campo etiqueta="Ciudades" ayuda="Escribí y tocá + (o Enter)">
          <ListaChips
            valores={v.ciudades}
            onCambiar={(x) => set('ciudades', x)}
            placeholder={p ? `Ciudades de ${p.n}` : 'Montevideo, Colonia…'}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Ida">
            <input
              type="date"
              value={v.desde}
              onChange={(e) => set('desde', e.target.value)}
              className="campo"
            />
          </Campo>
          <Campo etiqueta="Vuelta">
            <input
              type="date"
              value={v.hasta}
              min={v.desde || undefined}
              onChange={(e) => set('hasta', e.target.value)}
              className="campo"
            />
          </Campo>
        </div>

        <Campo etiqueta="Con quién fuiste">
          <input
            value={v.conQuien}
            onChange={(e) => set('conQuien', e.target.value)}
            placeholder="Solo, con amigos, en pareja…"
            className="campo"
          />
          <ul className="scroll-x mt-2 flex gap-1.5">
            {COMPANIA.map((c) => (
              <li key={c} className="shrink-0">
                <button
                  type="button"
                  onClick={() => set('conQuien', c)}
                  className={`chip ${v.conQuien === c ? 'chip-activo' : 'text-tinta-suave'}`}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </Campo>

        <Campo etiqueta="Puntaje" ayuda={v.puntaje ? `${v.puntaje} de 5` : 'Del 1 al 5'}>
          <Estrellas valor={v.puntaje} onCambiar={(n) => set('puntaje', n)} />
        </Campo>

        <Campo etiqueta="Notas / boludeces" ayuda="Anécdotas, lo que comiste, cosas random">
          <textarea
            value={v.notas}
            onChange={(e) => set('notas', e.target.value)}
            rows={5}
            placeholder="Contá cómo estuvo…"
            className="campo resize-y leading-relaxed"
          />
        </Campo>

        <Campo etiqueta="Etiquetas" ayuda="Creá las tuyas: playa, con amigos, nieve, me perdí…">
          <ListaChips
            valores={v.etiquetas}
            onCambiar={(x) => set('etiquetas', x)}
            placeholder="Nueva etiqueta"
            sugerencias={sugerencias}
          />
        </Campo>

        <Campo etiqueta="Lo mejor">
          <ListaChips
            valores={v.mejor}
            onCambiar={(x) => set('mejor', x)}
            placeholder="Lo que más te gustó"
          />
        </Campo>

        <Campo etiqueta="Lo peor">
          <ListaChips
            valores={v.peor}
            onCambiar={(x) => set('peor', x)}
            placeholder="Lo que no zafó"
          />
        </Campo>

        <Campo etiqueta="Fotos">
          <Fotos ids={v.fotos} onCambiar={(x) => set('fotos', x)} />
        </Campo>

        {error && (
          <p className="rounded-lg border border-terracota/40 bg-terracota/10 px-3 py-2 text-[13px] text-terracota">
            {error}
          </p>
        )}

        <button onClick={guardar} className="boton-lleno w-full tap">
          Guardar viaje
        </button>
      </div>

      {confirmarBorrado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          <button
            aria-label="Cancelar"
            onClick={() => setConfirmarBorrado(false)}
            className="absolute inset-0 animate-fade-in bg-tinta/35"
          />
          <div className="tarjeta relative w-full max-w-xs animate-rise bg-papel p-5 text-center">
            <p className="titulo text-lg">¿Borrás este viaje?</p>
            <p className="mt-1.5 text-[13px] text-tinta-suave">
              Se va con las fotos y todo. No hay vuelta atrás.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmarBorrado(false)} className="boton-borde tap">
                No, dejá
              </button>
              <button onClick={borrar} className="boton-lleno tap">
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string
  ayuda?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="etiqueta">{etiqueta}</p>
        {ayuda && <p className="text-[11px] text-tinta-suave">{ayuda}</p>}
      </div>
      {children}
    </div>
  )
}
