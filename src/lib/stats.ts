import type { EstadoPais, Viaje } from '../types'
import { anioDe, diasDe } from './datos'
import { CONTINENTES, TOTAL_MUNDO, pais } from './paises'

export interface Resumen {
  totalViajes: number
  totalDias: number
  paisesVisitados: number
  porcentajeMundo: number
  ciudades: number
  continentes: { nombre: string; paises: number; visitado: boolean }[]
  continentesVisitados: number
  porAnio: { anio: string; viajes: number; dias: number }[]
  paisMasRepetido: { iso3: string; veces: number } | null
  ciudadFavorita: { ciudad: string; iso3: string; puntaje: number } | null
  viajeMasLargo: Viaje | null
  puntajePromedio: number
  etiquetaEstrella: { nombre: string; veces: number } | null
  companiaFrecuente: string | null
}

export function calcularResumen(viajes: Viaje[], estados: Record<string, EstadoPais>): Resumen {
  const visitados = Object.entries(estados)
    .filter(([iso3, e]) => e === 'visitado' && pais(iso3)?.un)
    .map(([iso3]) => iso3)

  const porContinente = new Map<string, number>()
  for (const iso3 of visitados) {
    const c = pais(iso3)?.c
    if (c) porContinente.set(c, (porContinente.get(c) ?? 0) + 1)
  }

  const continentes = CONTINENTES.map((nombre) => ({
    nombre,
    paises: porContinente.get(nombre) ?? 0,
    visitado: (porContinente.get(nombre) ?? 0) > 0,
  }))

  // Viajes y días por año
  const anios = new Map<number, { viajes: number; dias: number }>()
  for (const v of viajes) {
    const a = anioDe(v)
    if (!a) continue
    const fila = anios.get(a) ?? { viajes: 0, dias: 0 }
    fila.viajes += 1
    fila.dias += diasDe(v)
    anios.set(a, fila)
  }
  // Rellenamos los años sin viajes para que el gráfico no mienta con los huecos.
  const listaAnios = [...anios.keys()].sort((a, b) => a - b)
  const porAnio: Resumen['porAnio'] = []
  if (listaAnios.length) {
    for (let a = listaAnios[0]; a <= listaAnios[listaAnios.length - 1]; a++) {
      const f = anios.get(a) ?? { viajes: 0, dias: 0 }
      porAnio.push({ anio: String(a), viajes: f.viajes, dias: f.dias })
    }
  }

  // País más repetido
  const veces = new Map<string, number>()
  for (const v of viajes) veces.set(v.iso3, (veces.get(v.iso3) ?? 0) + 1)
  let paisMasRepetido: Resumen['paisMasRepetido'] = null
  for (const [iso3, n] of veces) {
    if (n > 1 && (!paisMasRepetido || n > paisMasRepetido.veces)) paisMasRepetido = { iso3, veces: n }
  }
  if (!paisMasRepetido && veces.size) {
    const [iso3, n] = [...veces.entries()].sort((a, b) => b[1] - a[1])[0]
    paisMasRepetido = { iso3, veces: n }
  }

  // Ciudad favorita: mejor puntaje promedio, desempata la más repetida
  const ciudades = new Map<string, { ciudad: string; iso3: string; suma: number; n: number }>()
  for (const v of viajes) {
    for (const c of v.ciudades) {
      const clave = `${v.iso3}:${c.toLowerCase()}`
      const f = ciudades.get(clave) ?? { ciudad: c, iso3: v.iso3, suma: 0, n: 0 }
      f.suma += v.puntaje
      f.n += 1
      ciudades.set(clave, f)
    }
  }
  let ciudadFavorita: Resumen['ciudadFavorita'] = null
  for (const f of ciudades.values()) {
    const prom = f.suma / f.n
    if (!ciudadFavorita || prom > ciudadFavorita.puntaje)
      ciudadFavorita = { ciudad: f.ciudad, iso3: f.iso3, puntaje: prom }
  }

  // Etiqueta más usada
  const etiquetas = new Map<string, number>()
  for (const v of viajes) for (const e of v.etiquetas) etiquetas.set(e, (etiquetas.get(e) ?? 0) + 1)
  const etiquetaTop = [...etiquetas.entries()].sort((a, b) => b[1] - a[1])[0]

  // Con quién viajás más
  const compania = new Map<string, number>()
  for (const v of viajes)
    if (v.conQuien.trim()) compania.set(v.conQuien.trim(), (compania.get(v.conQuien.trim()) ?? 0) + 1)
  const companiaTop = [...compania.entries()].sort((a, b) => b[1] - a[1])[0]

  const conPuntaje = viajes.filter((v) => v.puntaje > 0)
  const viajeMasLargo = viajes.reduce<Viaje | null>(
    (mejor, v) => (!mejor || diasDe(v) > diasDe(mejor) ? v : mejor),
    null,
  )

  return {
    totalViajes: viajes.length,
    totalDias: viajes.reduce((s, v) => s + diasDe(v), 0),
    paisesVisitados: visitados.length,
    porcentajeMundo: (visitados.length / TOTAL_MUNDO) * 100,
    ciudades: ciudades.size,
    continentes,
    continentesVisitados: continentes.filter((c) => c.visitado).length,
    porAnio,
    paisMasRepetido,
    ciudadFavorita,
    viajeMasLargo: viajeMasLargo && diasDe(viajeMasLargo) > 0 ? viajeMasLargo : null,
    puntajePromedio: conPuntaje.length
      ? conPuntaje.reduce((s, v) => s + v.puntaje, 0) / conPuntaje.length
      : 0,
    etiquetaEstrella: etiquetaTop ? { nombre: etiquetaTop[0], veces: etiquetaTop[1] } : null,
    companiaFrecuente: companiaTop ? companiaTop[0] : null,
  }
}
