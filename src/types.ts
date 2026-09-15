export type EstadoPais = 'no' | 'visitado' | 'pendiente' | 'deseo'

export interface Pais {
  /** ISO 3166-1 numérico (coincide con los ids del TopoJSON) */
  id: string
  /** ISO alpha-2 */
  i2: string
  /** ISO alpha-3 — clave que usamos en la base */
  i3: string
  /** Nombre común en español */
  n: string
  /** Nombre oficial en español */
  o: string
  /** Continente */
  c: string
  /** Subregión */
  sr: string
  cap: string
  lat: number
  lng: number
  /** Código de moneda (ISO 4217) */
  cur: string
  curN: string
  curS: string
  lang: string[]
  flag: string
  /** Países limítrofes (ISO alpha-3) */
  b: string[]
  /** Es uno de los 195 países soberanos */
  un: boolean
}

export interface MarcaPais {
  /** ISO alpha-3 */
  iso3: string
  estado: EstadoPais
  actualizado: number
}

export interface Viaje {
  id?: number
  iso3: string
  ciudades: string[]
  desde: string // YYYY-MM-DD
  hasta: string // YYYY-MM-DD
  conQuien: string
  puntaje: number // 1..5
  notas: string
  etiquetas: string[]
  mejor: string[]
  peor: string[]
  fotos: number[] // ids de la tabla fotos
  creado: number
}

export interface Foto {
  id?: number
  viajeId?: number
  blob: Blob
  ancho: number
  alto: number
  creado: number
}

export interface Etiqueta {
  id?: number
  nombre: string
  usos: number
}

export interface Ajuste {
  clave: string
  valor: unknown
}

export interface Backup {
  app: 'mi-mapa-de-viajes'
  version: number
  exportado: string
  marcas: MarcaPais[]
  viajes: Viaje[]
  etiquetas: Etiqueta[]
  fotos: { id: number; viajeId?: number; ancho: number; alto: number; creado: number; dataUrl: string }[]
}
