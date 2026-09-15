import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { IconCerrar } from './Iconos'

interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function AvisoPWA() {
  const {
    needRefresh: [hayActualizacion, setHayActualizacion],
    updateServiceWorker,
  } = useRegisterSW()

  const [instalar, setInstalar] = useState<EventoInstalar | null>(null)
  const [oculto, setOculto] = useState(
    () => sessionStorage.getItem('oculto-instalar') === '1',
  )

  useEffect(() => {
    const manejar = (e: Event) => {
      e.preventDefault()
      setInstalar(e as EventoInstalar)
    }
    window.addEventListener('beforeinstallprompt', manejar)
    window.addEventListener('appinstalled', () => setInstalar(null))
    return () => window.removeEventListener('beforeinstallprompt', manejar)
  }, [])

  if (hayActualizacion) {
    return (
      <Barra onCerrar={() => setHayActualizacion(false)}>
        <span className="flex-1">Hay una versión nueva de la app.</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 rounded-md bg-terracota px-3 py-1.5 text-[12px] text-arena"
        >
          Actualizar
        </button>
      </Barra>
    )
  }

  if (instalar && !oculto) {
    return (
      <Barra
        onCerrar={() => {
          setOculto(true)
          sessionStorage.setItem('oculto-instalar', '1')
        }}
      >
        <span className="flex-1">Instalala en tu pantalla de inicio.</span>
        <button
          onClick={async () => {
            await instalar.prompt()
            await instalar.userChoice
            setInstalar(null)
          }}
          className="shrink-0 rounded-md bg-terracota px-3 py-1.5 text-[12px] text-arena"
        >
          Instalar
        </button>
      </Barra>
    )
  }

  return null
}

function Barra({
  children,
  onCerrar,
}: {
  children: React.ReactNode
  onCerrar: () => void
}) {
  return (
    <div
      className="fixed inset-x-0 z-40 mx-auto max-w-md px-4"
      style={{ bottom: 'calc(var(--nav-h) + var(--safe-bottom) + 12px)' }}
    >
      <div
        className="flex animate-rise items-center gap-2 rounded-lg border border-borde/25
                   bg-arena px-3 py-2.5 text-[12.5px] shadow-lg"
      >
        {children}
        <button onClick={onCerrar} aria-label="Cerrar" className="shrink-0 text-tinta-suave">
          <IconCerrar className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
