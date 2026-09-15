import { IconEstrella } from './Iconos'

export default function Estrellas({
  valor,
  onCambiar,
  tam = 'md',
}: {
  valor: number
  onCambiar?: (n: number) => void
  tam?: 'sm' | 'md'
}) {
  const clase = tam === 'sm' ? 'h-3.5 w-3.5' : 'h-7 w-7'
  return (
    <div className="flex items-center gap-1" role={onCambiar ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const lleno = n <= valor
        const contenido = (
          <IconEstrella
            className={`${clase} ${lleno ? 'text-terracota' : 'text-borde/30'}`}
            lleno={lleno}
          />
        )
        return onCambiar ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} de 5`}
            onClick={() => onCambiar(n === valor ? 0 : n)}
            className="tap flex items-center justify-center transition active:scale-90"
          >
            {contenido}
          </button>
        ) : (
          <span key={n}>{contenido}</span>
        )
      })}
    </div>
  )
}
