import { NavLink } from 'react-router-dom'
import { IconDescubrir, IconMapa, IconStats, IconViajes } from './Iconos'

const items = [
  { to: '/', icono: IconMapa, texto: 'Mapa' },
  { to: '/viajes', icono: IconViajes, texto: 'Viajes' },
  { to: '/stats', icono: IconStats, texto: 'Stats' },
  { to: '/descubrir', icono: IconDescubrir, texto: 'Descubrir' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde/15 bg-papel/95 backdrop-blur"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {items.map(({ to, icono: Icono, texto }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `tap flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  isActive ? 'text-terracota' : 'text-tinta-suave'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icono className="h-[22px] w-[22px]" />
                  <span
                    className={`text-[10px] tracking-wide ${isActive ? 'font-semibold' : ''}`}
                  >
                    {texto}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
