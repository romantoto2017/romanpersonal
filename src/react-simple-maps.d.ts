declare module 'react-simple-maps' {
  import type { CSSProperties, ReactNode, SVGProps } from 'react'

  export interface GeoFeature {
    rsmKey: string
    id?: string | number
    properties?: Record<string, unknown> & { name?: string }
    geometry: unknown
    svgPath?: string
  }

  export interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string
    projectionConfig?: {
      scale?: number
      center?: [number, number]
      rotate?: [number, number, number]
      parallels?: [number, number]
    }
    width?: number
    height?: number
    children?: ReactNode
  }
  export const ComposableMap: (props: ComposableMapProps) => JSX.Element

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    translateExtent?: [[number, number], [number, number]]
    filterZoomEvent?: (event: unknown) => boolean
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void
    onMove?: (position: { coordinates: [number, number]; zoom: number }) => void
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void
    children?: ReactNode
  }
  export const ZoomableGroup: (props: ZoomableGroupProps) => JSX.Element

  export interface GeographiesProps {
    geography: unknown
    children: (args: { geographies: GeoFeature[]; outline: unknown; borders: unknown }) => ReactNode
    parseGeographies?: (geos: GeoFeature[]) => GeoFeature[]
    className?: string
  }
  export const Geographies: (props: GeographiesProps) => JSX.Element

  export interface GeographyStyles {
    default?: CSSProperties
    hover?: CSSProperties
    pressed?: CSSProperties
  }
  export interface GeographyProps extends Omit<SVGProps<SVGPathElement>, 'style'> {
    geography: GeoFeature
    style?: GeographyStyles
  }
  export const Geography: (props: GeographyProps) => JSX.Element

  export const Marker: (props: {
    coordinates: [number, number]
    children?: ReactNode
  } & SVGProps<SVGGElement>) => JSX.Element

  export const Sphere: (props: SVGProps<SVGPathElement> & { id?: string }) => JSX.Element
  export const Graticule: (props: SVGProps<SVGPathElement> & { step?: [number, number] }) => JSX.Element
}
