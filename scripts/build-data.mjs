// Genera src/data/countries.json (slim) a partir de world-countries,
// y copia el TopoJSON del mundo para que la app funcione 100% offline.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const all = require('world-countries')

const CONTINENTE = {
  Africa: 'África',
  Americas: 'América',
  Asia: 'Asia',
  Europe: 'Europa',
  Oceania: 'Oceanía',
  Antarctic: 'Antártida',
}

const SUBREGION = {
  'South America': 'Sudamérica',
  'Central America': 'Centroamérica',
  'North America': 'Norteamérica',
  Caribbean: 'Caribe',
  'Northern America': 'Norteamérica',
  'Northern Europe': 'Europa del Norte',
  'Southern Europe': 'Europa del Sur',
  'Western Europe': 'Europa Occidental',
  'Eastern Europe': 'Europa del Este',
  'Central Europe': 'Europa Central',
  'Southeast Europe': 'Europa del Sudeste',
  'Western Asia': 'Asia Occidental',
  'Southern Asia': 'Asia del Sur',
  'South-Eastern Asia': 'Sudeste Asiático',
  'Eastern Asia': 'Asia Oriental',
  'Central Asia': 'Asia Central',
  'Northern Africa': 'África del Norte',
  'Western Africa': 'África Occidental',
  'Middle Africa': 'África Central',
  'Eastern Africa': 'África Oriental',
  'Southern Africa': 'África Austral',
  'Australia and New Zealand': 'Australia y Nueva Zelanda',
  Melanesia: 'Melanesia',
  Micronesia: 'Micronesia',
  Polynesia: 'Polinesia',
}

const IDIOMA = {
  Spanish: 'español', English: 'inglés', Portuguese: 'portugués', French: 'francés',
  German: 'alemán', Italian: 'italiano', Dutch: 'neerlandés', Russian: 'ruso',
  Arabic: 'árabe', Chinese: 'chino', Japanese: 'japonés', Korean: 'coreano',
  Greek: 'griego', Turkish: 'turco', Polish: 'polaco', Czech: 'checo',
  Slovak: 'eslovaco', Hungarian: 'húngaro', Romanian: 'rumano', Bulgarian: 'búlgaro',
  Croatian: 'croata', Serbian: 'serbio', Slovene: 'esloveno', Albanian: 'albanés',
  Macedonian: 'macedonio', Bosnian: 'bosnio', Montenegrin: 'montenegrino',
  Swedish: 'sueco', Norwegian: 'noruego', Danish: 'danés', Finnish: 'finés',
  Icelandic: 'islandés', Estonian: 'estonio', Latvian: 'letón', Lithuanian: 'lituano',
  Ukrainian: 'ucraniano', Belarusian: 'bielorruso', Hebrew: 'hebreo', Persian: 'persa',
  Hindi: 'hindi', Urdu: 'urdu', Bengali: 'bengalí', Thai: 'tailandés',
  Vietnamese: 'vietnamita', Indonesian: 'indonesio', Malay: 'malayo', Filipino: 'filipino',
  Swahili: 'suajili', Afrikaans: 'afrikáans', Amharic: 'amhárico', Somali: 'somalí',
  Hausa: 'hausa', Zulu: 'zulú', Nepali: 'nepalí', Sinhala: 'cingalés',
  Burmese: 'birmano', Khmer: 'jemer', Lao: 'lao', Mongolian: 'mongol',
  Georgian: 'georgiano', Armenian: 'armenio', Azerbaijani: 'azerí', Kazakh: 'kazajo',
  Uzbek: 'uzbeko', Catalan: 'catalán', Irish: 'irlandés', Welsh: 'galés',
  Maltese: 'maltés', Luxembourgish: 'luxemburgués', Guaraní: 'guaraní',
  Quechua: 'quechua', Aymara: 'aimara', Maori: 'maorí', Samoan: 'samoano',
  Tongan: 'tongano', Fijian: 'fiyiano', Hawaiian: 'hawaiano', Latin: 'latín',
  Tamil: 'tamil', Malagasy: 'malgache', Kinyarwanda: 'kinyarwanda',
}

const es = (s) => IDIOMA[s] || s.toLowerCase()

// Los 195 "países del mundo": 193 miembros ONU + Vaticano y Palestina (observadores).
const OBSERVADORES = new Set(['VAT', 'PSE'])

const out = all
  .filter((c) => c.cca3 !== 'ATA' || true)
  .map((c) => {
    const cur = Object.entries(c.currencies || {})[0]
    return {
      id: c.ccn3 || '',
      i2: c.cca2,
      i3: c.cca3,
      n: c.translations?.spa?.common || c.name.common,
      o: c.translations?.spa?.official || c.name.official,
      c: CONTINENTE[c.region] || c.region,
      sr: SUBREGION[c.subregion] || c.subregion || '',
      cap: (c.capital && c.capital[0]) || '',
      lat: c.latlng?.[0] ?? 0,
      lng: c.latlng?.[1] ?? 0,
      cur: cur ? cur[0] : '',
      curN: cur ? cur[1].name : '',
      curS: cur ? cur[1].symbol || '' : '',
      lang: Object.values(c.languages || {}).map(es).slice(0, 3),
      flag: c.flag,
      b: c.borders || [],
      un: c.unMember || OBSERVADORES.has(c.cca3),
    }
  })
  .sort((a, b) => a.n.localeCompare(b.n, 'es'))

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true })
writeFileSync(new URL('../src/data/countries.json', import.meta.url), JSON.stringify(out))

// TopoJSON del mundo (110m: liviano, ideal para celular)
copyFileSync(
  require.resolve('world-atlas/countries-110m.json'),
  new URL('../src/data/world-110m.json', import.meta.url),
)

const soberanos = out.filter((c) => c.un).length
console.log(`countries.json: ${out.length} entradas (${soberanos} soberanos)`)
console.log('world-110m.json copiado')
