type P = { className?: string }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconMapa = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 2.5 15 0 18M12 3c-2.5 2.7-2.5 15 0 18" />
  </svg>
)

export const IconViajes = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
  </svg>
)

export const IconStats = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)

export const IconDescubrir = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4z" />
  </svg>
)

export const IconBuscar = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const IconMas = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconCerrar = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const IconLapiz = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16z" />
  </svg>
)

export const IconTacho = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
)

export const IconEstrella = ({ className, lleno }: P & { lleno?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    {...base}
    fill={lleno ? 'currentColor' : 'none'}
  >
    <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </svg>
)

export const IconAjustes = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 7h11M19 7h1M4 17h5M13 17h7" />
    <circle cx="17" cy="7" r="2" />
    <circle cx="11" cy="17" r="2" />
  </svg>
)

export const IconVolver = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export const IconMenos = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
    <path d="M5 12h14" />
  </svg>
)

export const IconCasa = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
  </svg>
)
