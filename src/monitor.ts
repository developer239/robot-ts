import type { LogicalRect, PhysicalRect } from './geometry'

export interface Monitor {
  id: number
  name: string
  isPrimary: boolean
  logicalBounds: LogicalRect
  physicalBounds: PhysicalRect
  scaleFactor: number
}
