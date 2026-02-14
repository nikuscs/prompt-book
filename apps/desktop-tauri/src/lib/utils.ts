import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type SmartFadeOrientation = "vertical" | "horizontal"
type SmartFadeOptions = {
  overflow?: boolean
  width?: number
  alpha?: number
  inset?: number
}

export function createSmartFade(
  orientation: SmartFadeOrientation,
  { width = 7, alpha = 0, inset = 0 }: SmartFadeOptions = {},
  fadeStart = false,
  fadeEnd = false,
) {
  if (!fadeStart && !fadeEnd) return "none"

  const transparent = `rgba(0,0,0,${alpha})`
  const opaque = "rgba(0,0,0,1)"
  const edge = width + inset

  const dir = orientation === "vertical" ? "to bottom" : "to right"
  const stops: string[] = []
  stops.push(fadeStart ? `${transparent} 0px` : `${opaque} 0px`)
  if (fadeStart) stops.push(`${opaque} ${edge}px`)
  if (fadeEnd) stops.push(`${opaque} calc(100% - ${edge}px)`)
  stops.push(fadeEnd ? `${transparent} 100%` : `${opaque} 100%`)

  return `linear-gradient(${dir}, ${stops.join(", ")})`
}
