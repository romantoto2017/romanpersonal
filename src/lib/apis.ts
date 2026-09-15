/**
 * APIs gratuitas y sin clave. Todo se pide desde el celular y el service worker
 * guarda la última respuesta, así que sin internet ves los datos de la última vez.
 */

export interface Clima {
  temp: number
  codigo: number
  descripcion: string
  emoji: string
  maxHoy: number
  minHoy: number
  proximos: { dia: string; max: number; min: number; emoji: string }[]
}

const TABLA_CLIMA: Record<number, [string, string]> = {
  0: ['Despejado', '☀️'],
  1: ['Bastante despejado', '🌤️'],
  2: ['Parcialmente nublado', '⛅'],
  3: ['Nublado', '☁️'],
  45: ['Neblina', '🌫️'],
  48: ['Neblina con escarcha', '🌫️'],
  51: ['Garúa suave', '🌦️'],
  53: ['Garúa', '🌦️'],
  55: ['Garúa fuerte', '🌧️'],
  56: ['Garúa helada', '🌧️'],
  57: ['Garúa helada fuerte', '🌧️'],
  61: ['Lluvia suave', '🌦️'],
  63: ['Lluvia', '🌧️'],
  65: ['Lluvia fuerte', '🌧️'],
  66: ['Lluvia helada', '🌧️'],
  67: ['Lluvia helada fuerte', '🌧️'],
  71: ['Nieve suave', '🌨️'],
  73: ['Nieve', '❄️'],
  75: ['Nevada fuerte', '❄️'],
  77: ['Granizo de nieve', '🌨️'],
  80: ['Chaparrones', '🌦️'],
  81: ['Chaparrones fuertes', '🌧️'],
  82: ['Tormenta de agua', '⛈️'],
  85: ['Chaparrones de nieve', '🌨️'],
  86: ['Nevada fuerte', '❄️'],
  95: ['Tormenta eléctrica', '⛈️'],
  96: ['Tormenta con granizo', '⛈️'],
  99: ['Tormenta con granizo fuerte', '⛈️'],
}

export const describirClima = (codigo: number): [string, string] =>
  TABLA_CLIMA[codigo] ?? ['Sin datos', '🌍']

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

async function pedirJson<T>(url: string, ms = 9000): Promise<T> {
  const corte = new AbortController()
  const reloj = setTimeout(() => corte.abort(), ms)
  try {
    const r = await fetch(url, { signal: corte.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return (await r.json()) as T
  } finally {
    clearTimeout(reloj)
  }
}

interface RespuestaMeteo {
  current?: { temperature_2m: number; weather_code: number }
  daily?: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

/** Clima de ahora + los próximos 3 días, con Open-Meteo. */
export async function traerClima(lat: number, lng: number): Promise<Clima | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}` +
      `&longitude=${lng.toFixed(3)}&current=temperature_2m,weather_code` +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&forecast_days=4&timezone=auto'
    const d = await pedirJson<RespuestaMeteo>(url)
    if (!d.current || !d.daily) return null
    const [descripcion, emoji] = describirClima(d.current.weather_code)
    const proximos = d.daily.time.slice(1, 4).map((fecha, i) => {
      const j = i + 1
      return {
        dia: DIAS[new Date(`${fecha}T12:00:00`).getDay()],
        max: Math.round(d.daily!.temperature_2m_max[j]),
        min: Math.round(d.daily!.temperature_2m_min[j]),
        emoji: describirClima(d.daily!.weather_code[j])[1],
      }
    })
    return {
      temp: Math.round(d.current.temperature_2m),
      codigo: d.current.weather_code,
      descripcion,
      emoji,
      maxHoy: Math.round(d.daily.temperature_2m_max[0]),
      minHoy: Math.round(d.daily.temperature_2m_min[0]),
      proximos,
    }
  } catch {
    return null
  }
}

export interface Cambio {
  /** Cuántas unidades de la moneda destino te dan por 1 UYU */
  porPeso: number
  /** Cuántas unidades te dan por $1.000 UYU */
  porMil: number
  actualizado: string
  fuente: string
}

let cacheTasas: { tasas: Record<string, number>; fecha: string; pedido: number } | null = null

/** Todas las tasas contra el peso uruguayo, de una sola pasada. */
export async function traerTasas(): Promise<{ tasas: Record<string, number>; fecha: string } | null> {
  if (cacheTasas && Date.now() - cacheTasas.pedido < 60 * 60 * 1000) {
    return { tasas: cacheTasas.tasas, fecha: cacheTasas.fecha }
  }
  // Primero er-api (tiene casi todas las monedas del mundo).
  try {
    const d = await pedirJson<{
      result: string
      rates: Record<string, number>
      time_last_update_utc: string
    }>('https://open.er-api.com/v6/latest/UYU')
    if (d.result === 'success' && d.rates) {
      const fecha = (d.time_last_update_utc || '').slice(5, 16)
      cacheTasas = { tasas: d.rates, fecha, pedido: Date.now() }
      return { tasas: d.rates, fecha }
    }
  } catch {
    /* seguimos con el plan B */
  }
  // Plan B: currency-api en jsDelivr. También gratis y sin clave, y sí tiene UYU.
  // (Frankfurter queda afuera a propósito: solo cubre las monedas del BCE y el
  // peso uruguayo no está, así que como respaldo no servía.)
  try {
    const d = await pedirJson<{ date: string; uyu: Record<string, number> }>(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/uyu.json',
    )
    if (d.uyu) {
      // Vienen en minúscula: las pasamos a ISO 4217 en mayúscula.
      const tasas: Record<string, number> = {}
      for (const [k, v] of Object.entries(d.uyu)) tasas[k.toUpperCase()] = v
      cacheTasas = { tasas, fecha: d.date, pedido: Date.now() }
      return { tasas, fecha: d.date }
    }
  } catch {
    /* sin internet, ni modo */
  }
  return null
}

export function calcularCambio(
  tasas: Record<string, number>,
  fecha: string,
  moneda: string,
): Cambio | null {
  const tasa = tasas[moneda]
  if (!tasa || !Number.isFinite(tasa)) return null
  return { porPeso: tasa, porMil: tasa * 1000, actualizado: fecha, fuente: 'open.er-api.com' }
}

export interface InfoPais {
  capital: string
  idiomas: string[]
  moneda: string
  monedaNombre: string
  bandera: string
  poblacion: number
}

/** Ficha del país desde REST Countries (para cuando hay internet). */
export async function traerInfoPais(iso3: string): Promise<InfoPais | null> {
  try {
    const d = await pedirJson<
      {
        capital?: string[]
        languages?: Record<string, string>
        currencies?: Record<string, { name: string }>
        flag?: string
        population?: number
      }[]
    >(
      `https://restcountries.com/v3.1/alpha/${iso3}` +
        '?fields=capital,languages,currencies,flag,population',
    )
    const c = Array.isArray(d) ? d[0] : (d as unknown as (typeof d)[0])
    if (!c) return null
    const moneda = Object.entries(c.currencies ?? {})[0]
    return {
      capital: c.capital?.[0] ?? '',
      idiomas: Object.values(c.languages ?? {}),
      moneda: moneda?.[0] ?? '',
      monedaNombre: moneda?.[1]?.name ?? '',
      bandera: c.flag ?? '',
      poblacion: c.population ?? 0,
    }
  } catch {
    return null
  }
}

/** Formatea plata sin decimales cuando el número es grande. */
export function formatearMonto(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1000) return n.toLocaleString('es-UY', { maximumFractionDigits: 0 })
  if (n >= 10) return n.toLocaleString('es-UY', { maximumFractionDigits: 1 })
  return n.toLocaleString('es-UY', { maximumFractionDigits: 2 })
}
