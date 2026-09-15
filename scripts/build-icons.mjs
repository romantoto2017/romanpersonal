// Genera los íconos PWA rasterizando un SVG con Chromium.
// Se corre a mano: `node scripts/build-icons.mjs` (necesita playwright-core).
import { writeFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const PAPEL = '#F3EDE3'
const TERRACOTA = '#C8553D'
const TINTA = '#2B2622'

/** @param {{pad:number, fondoCompleto:boolean}} o */
const svg = ({ pad, fondoCompleto }) => {
  const r = 50 - pad // radio del globo en un viewBox de 100
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" fill="${PAPEL}" ${fondoCompleto ? '' : 'rx="22"'}/>
  <g transform="translate(50 50)">
    <circle r="${r}" fill="${TERRACOTA}"/>
    <g fill="none" stroke="${PAPEL}" stroke-width="${r * 0.055}" opacity="0.9">
      <line x1="${-r}" y1="0" x2="${r}" y2="0"/>
      <ellipse rx="${r * 0.42}" ry="${r}"/>
      <line x1="${-r * 0.8}" y1="${-r * 0.55}" x2="${r * 0.8}" y2="${-r * 0.55}"/>
      <line x1="${-r * 0.8}" y1="${r * 0.55}" x2="${r * 0.8}" y2="${r * 0.55}"/>
    </g>
    <circle r="${r}" fill="none" stroke="${TINTA}" stroke-width="${r * 0.05}" opacity="0.75"/>
    <circle cx="${r * 0.26}" cy="${r * 0.3}" r="${r * 0.14}" fill="${PAPEL}"
            stroke="${TINTA}" stroke-width="${r * 0.045}"/>
  </g>
</svg>`
}

const salidas = [
  { archivo: 'icon-192.png', tam: 192, pad: 10, fondoCompleto: false },
  { archivo: 'icon-512.png', tam: 512, pad: 10, fondoCompleto: false },
  { archivo: 'maskable-512.png', tam: 512, pad: 22, fondoCompleto: true },
  { archivo: 'apple-touch-icon.png', tam: 180, pad: 12, fondoCompleto: true },
]

const dir = new URL('../public/icons/', import.meta.url)
mkdirSync(dir, { recursive: true })

const navegador = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
})
const pagina = await navegador.newPage()

for (const s of salidas) {
  await pagina.setViewportSize({ width: s.tam, height: s.tam })
  await pagina.setContent(
    `<style>html,body{margin:0;padding:0}svg{width:${s.tam}px;height:${s.tam}px;display:block}</style>` +
      svg(s),
  )
  const png = await pagina.screenshot({ omitBackground: false })
  writeFileSync(new URL(s.archivo, dir), png)
  console.log(`${s.archivo} — ${s.tam}px`)
}

// Favicon SVG (nítido en cualquier tamaño)
writeFileSync(
  new URL('../public/favicon.svg', import.meta.url),
  svg({ pad: 8, fondoCompleto: false }).trim(),
)
console.log('favicon.svg')

await navegador.close()
