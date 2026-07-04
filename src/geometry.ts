export interface LogicalPoint {
  x: number
  y: number
}

export interface PhysicalPoint {
  x: number
  y: number
}

export interface LogicalSize {
  width: number
  height: number
}

export interface PhysicalSize {
  width: number
  height: number
}

export interface LogicalRect {
  origin: LogicalPoint
  size: LogicalSize
}

export interface PhysicalRect {
  origin: PhysicalPoint
  size: PhysicalSize
}

export const distance = (a: LogicalPoint, b: LogicalPoint): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y

  return Math.sqrt(dx * dx + dy * dy)
}
