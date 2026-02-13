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

  if (orientation === "vertical") {
    if (fadeStart && fadeEnd) {
      return `linear-gradient(to bottom, ${transparent} 0px, ${opaque} ${edge}px, ${opaque} calc(100% - ${edge}px), ${transparent} 100%)`
    }
    if (fadeStart) {
      return `linear-gradient(to bottom, ${transparent} 0px, ${opaque} ${edge}px, ${opaque} 100%)`
    }
    return `linear-gradient(to bottom, ${opaque} 0px, ${opaque} calc(100% - ${edge}px), ${transparent} 100%)`
  }

  if (fadeStart && fadeEnd) {
    return `linear-gradient(to right, ${transparent} 0px, ${opaque} ${edge}px, ${opaque} calc(100% - ${edge}px), ${transparent} 100%)`
  }
  if (fadeStart) {
    return `linear-gradient(to right, ${transparent} 0px, ${opaque} ${edge}px, ${opaque} 100%)`
  }
  return `linear-gradient(to right, ${opaque} 0px, ${opaque} calc(100% - ${edge}px), ${transparent} 100%)`
}
